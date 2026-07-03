/**
 * Google Calendar push-notification receiver.
 *
 * Google POSTs a tiny notification (no body) every time the watched calendar
 * changes. We use the headers to identify the channel, look up the practitioner,
 * pull the diff via `events.list?syncToken=…`, and reconcile each changed event
 * against our `bookings` and `sessions` rows.
 *
 * Headers Google sends:
 *   X-Goog-Channel-ID        — our channel UUID (echoed from the watch request)
 *   X-Goog-Channel-Token     — the practitioner user_id (we set this at register time)
 *   X-Goog-Resource-ID       — Google's calendar handle
 *   X-Goog-Resource-State    — 'sync' (initial) or 'exists' (change)
 *   X-Goog-Resource-URI      — events feed URL
 *   X-Goog-Message-Number    — sequence
 *
 * Reconciliation rules:
 *   - event.status === 'cancelled' on a row we know → mark booking + session
 *     cancelled (cancelled_by = 'practitioner_via_calendar')
 *   - event has `recurringEventId` (it's a single instance of a series) → find
 *     the matching booking by start_time within that series, mark it detached,
 *     update its time / status
 *   - parent event time changed (start.dateTime) → update non-detached siblings
 *     by walking the new RRULE? For Phase 2, simpler: only update the anchor
 *     and mark the rest stale (UI can warn). Per-occurrence retiming covered
 *     by exception path above.
 *   - attendee responseStatus changed → update bookings.attendee_status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { getValidGoogleToken } from '@/lib/services/google-auth'
import { retimeBookingAndSession } from '@/lib/services/google-calendar-sync'

interface GoogleEventInstance {
  id: string
  status?: string  // 'confirmed' | 'tentative' | 'cancelled'
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  recurringEventId?: string
  attendees?: Array<{ email?: string; responseStatus?: string }>
  organizer?: { email?: string }
}

export async function POST(request: NextRequest) {
  const channelId = request.headers.get('x-goog-channel-id')
  const channelToken = request.headers.get('x-goog-channel-token')
  const resourceState = request.headers.get('x-goog-resource-state')

  if (!channelId) {
    // Missing the channel id header — likely not from Google. Reject with
    // 401 so curious scanners stop hitting us; Google never omits this.
    return NextResponse.json({ error: 'Missing channel' }, { status: 401 })
  }

  // Initial 'sync' ping is sent right after watch registration — nothing to do.
  if (resourceState === 'sync') {
    return NextResponse.json({ ok: true })
  }

  const supabase = createAdminClient()

  // Look up the channel → practitioner.
  const { data: channel } = await supabase
    .from('calendar_watch_channels')
    .select('user_id, sync_token, active')
    .eq('channel_id', channelId)
    .single()

  if (!channel || !channel.active) {
    return NextResponse.json({ error: 'Unknown channel' }, { status: 401 })
  }

  // Verification: token MUST be present AND match the recorded practitioner.
  // Treating a missing token as valid was a forgery vector — anyone who knew
  // a channel id could spoof reconciliation events.
  if (!channelToken || channelToken !== channel.user_id) {
    console.warn('[calendar-webhook] channel token missing or mismatched — rejecting')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const auth = await getValidGoogleToken(channel.user_id, supabase)
  if (!auth) {
    console.warn('[calendar-webhook] no valid token for', channel.user_id)
    return NextResponse.json({ ok: true })
  }

  // Pull the diff. Use saved syncToken when we have one; otherwise a windowed
  // list (last 30 days through 90 days out) as a one-time bootstrap.
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events`
  const params = new URLSearchParams()
  if (channel.sync_token) {
    params.set('syncToken', channel.sync_token)
  } else {
    const now = new Date()
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    params.set('timeMin', past.toISOString())
    params.set('timeMax', future.toISOString())
    params.set('singleEvents', 'true') // expand recurring → instance rows for easier matching
  }
  params.set('showDeleted', 'true')

  let nextPageToken: string | undefined
  let nextSyncToken: string | undefined
  const events: GoogleEventInstance[] = []

  let pageSafety = 20
  do {
    if (nextPageToken) params.set('pageToken', nextPageToken); else params.delete('pageToken')
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      // 410 Gone means the sync token expired — fall back to bootstrap on next ping.
      if (res.status === 410) {
        await supabase
          .from('calendar_watch_channels')
          .update({ sync_token: null, updated_at: new Date().toISOString() })
          .eq('channel_id', channelId)
      } else {
        console.warn('[calendar-webhook] events list failed:', res.status, text)
      }
      return NextResponse.json({ ok: true })
    }
    const json = await res.json()
    if (Array.isArray(json.items)) events.push(...json.items)
    nextPageToken = json.nextPageToken
    nextSyncToken = json.nextSyncToken
    pageSafety--
  } while (nextPageToken && pageSafety > 0)

  // Persist the new sync token before processing — if processing throws
  // halfway, we still don't re-process the same events on the next ping.
  if (nextSyncToken) {
    await supabase
      .from('calendar_watch_channels')
      .update({ sync_token: nextSyncToken, updated_at: new Date().toISOString() })
      .eq('channel_id', channelId)
  }

  // Reconcile each changed event back to our DB.
  for (const evt of events) {
    try {
      await reconcileEvent(evt, channel.user_id, supabase)
    } catch (err) {
      console.error('[calendar-webhook] reconcile failed for event', evt.id, err)
    }
  }

  return NextResponse.json({ ok: true, processed: events.length })
}

async function reconcileEvent(
  evt: GoogleEventInstance,
  userId: string,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  if (!evt.id) return
  // Match by google_event_id. For exception instances (recurringEventId set),
  // the parent google_event_id matches what we stored on every sibling.
  const lookupId = evt.recurringEventId || evt.id

  const { data: candidates } = await supabase
    .from('bookings')
    .select('id, start_time, end_time, status, series_id, series_position, member_id, client_email')
    .eq('practitioner_id', userId)
    .eq('google_event_id', lookupId)

  if (!candidates || candidates.length === 0) return // event we don't track

  // Cancellation
  if (evt.status === 'cancelled') {
    if (evt.recurringEventId && evt.start?.dateTime) {
      // Single occurrence cancelled — match by start_time, leave siblings alone.
      const occStart = new Date(evt.start.dateTime).toISOString()
      const target = candidates.find(c => new Date(c.start_time).toISOString() === occStart)
      if (target) {
        await markCancelled(supabase, target.id, target.member_id, target.start_time, userId)
      }
    } else {
      // Whole series (or single non-recurring event) deleted.
      for (const target of candidates) {
        await markCancelled(supabase, target.id, target.member_id, target.start_time, userId)
      }
    }
    return
  }

  // Time change for a single occurrence (exception instance)
  if (evt.recurringEventId && evt.start?.dateTime && evt.end?.dateTime) {
    // Match by the original_start_time semantics: the row whose start_time was
    // closest before the new instance start. For Phase 2 we keep it simple and
    // match by event id alone, taking the most recent.
    const target = candidates[0]
    if (target && target.status !== 'cancelled') {
      await supabase
        .from('bookings')
        .update({
          start_time: new Date(evt.start.dateTime).toISOString(),
          end_time: new Date(evt.end.dateTime).toISOString(),
          detached_from_series: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id)
      // Mirror the same change on the sessions row. Prefer matching by
      // (series_id + series_position) when available — a practitioner
      // may have independently edited the session's scheduled_at via
      // "Edit session", in which case the old timestamp on the booking
      // no longer matches the session's current scheduled_at and the
      // old equality lookup would silently miss. Fall back to
      // scheduled_at for non-series bookings.
      let sessionUpdate = supabase
        .from('sessions')
        .update({
          scheduled_at: new Date(evt.start.dateTime).toISOString(),
          detached_from_series: true,
          updated_at: new Date().toISOString(),
        })
        .eq('practitioner_id', userId)
        .eq('member_id', target.member_id)
      if (target.series_id && typeof target.series_position === 'number') {
        sessionUpdate = sessionUpdate
          .eq('series_id', target.series_id)
          .eq('series_position', target.series_position)
      } else {
        sessionUpdate = sessionUpdate.eq('scheduled_at', target.start_time)
      }
      await sessionUpdate
    }
  }

  // Time change for a single (non-recurring) event — the practitioner moved a
  // one-off appointment in Google Calendar. Update the booking + session to the
  // new time. (Recurring instances are handled above; additions stay manual.)
  if (!evt.recurringEventId && evt.status !== 'cancelled' && evt.start?.dateTime && evt.end?.dateTime) {
    const newStart = new Date(evt.start.dateTime).toISOString()
    const newEnd = new Date(evt.end.dateTime).toISOString()
    for (const target of candidates) {
      if (target.status === 'cancelled') continue
      if (new Date(target.start_time).toISOString() === newStart) continue // unchanged
      await retimeBookingAndSession(supabase, {
        bookingId: target.id,
        memberId: target.member_id,
        oldStart: target.start_time,
        newStart,
        newEnd,
        practitionerId: userId,
        seriesId: target.series_id,
        seriesPosition: target.series_position,
      })
    }
  }

  // Attendee responseStatus
  if (Array.isArray(evt.attendees)) {
    for (const target of candidates) {
      if (!target.client_email) continue
      const att = evt.attendees.find(a => a.email?.toLowerCase() === target.client_email.toLowerCase())
      if (!att?.responseStatus) continue
      const allowed = ['accepted', 'declined', 'tentative', 'needs_action']
      if (!allowed.includes(att.responseStatus)) continue
      await supabase
        .from('bookings')
        .update({ attendee_status: att.responseStatus, updated_at: new Date().toISOString() })
        .eq('id', target.id)
    }
  }
}

async function markCancelled(
  supabase: ReturnType<typeof createAdminClient>,
  bookingId: string,
  memberId: string | null,
  startTime: string,
  practitionerId: string,
): Promise<void> {
  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'practitioner_via_calendar',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
  // Also cancel the matching session row so the member's tab reflects the change.
  if (memberId) {
    await supabase
      .from('sessions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('practitioner_id', practitionerId)
      .eq('member_id', memberId)
      .eq('scheduled_at', startTime)
      .in('status', ['scheduled', 'confirmed'])
  }
}
