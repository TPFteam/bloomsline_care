/**
 * GET /api/calendar/orphan-events
 *
 * Returns the practitioner's Google Calendar events that exist in their
 * calendar but have no matching `bookings` row yet — typically appointments
 * booked manually inside Google. Used by the "Unlinked Google events" UI on
 * the Bookings page so the practitioner can claim each event under a patient.
 *
 * Filters applied to keep noise out:
 *   - Window: 14 days back, 60 days forward (covers recent past + upcoming)
 *   - Not all-day events
 *   - Not cancelled
 *   - Has at least one attendee that isn't the practitioner (so personal
 *     events don't surface)
 *   - Recurring parents are excluded for v1; single instances of a recurring
 *     series are also excluded (handled via the recurring flow we ship
 *     elsewhere)
 *   - Not already in `bookings` for this practitioner
 *
 * For each result we attempt a `suggestedMember` by matching attendee
 * emails against the practitioner's `members.email` list — the modal can
 * then pre-select that member.
 */

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { getValidGoogleToken } from '@/lib/services/google-auth'

interface GoogleAttendee {
  email?: string
  displayName?: string
  responseStatus?: string
  self?: boolean
  organizer?: boolean
}

interface GoogleEvent {
  id: string
  status?: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  attendees?: GoogleAttendee[]
  hangoutLink?: string
  location?: string
  recurringEventId?: string
  recurrence?: string[]
  organizer?: { email?: string; self?: boolean }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    const auth = await getValidGoogleToken(user.id, adminSupabase)
    if (!auth) {
      return NextResponse.json({ events: [], hasGoogleConnection: false })
    }

    // Members for attendee-email matching → suggestedMember.
    const { data: members } = await adminSupabase
      .from('members')
      .select('id, first_name, last_name, email')
      .eq('practitioner_id', user.id)

    const emailToMember = new Map<string, { id: string; first_name: string; last_name: string }>()
    for (const m of (members || [])) {
      if (m.email) emailToMember.set(m.email.toLowerCase(), m)
    }

    // 14 days back → 60 days forward window. singleEvents=true expands
    // recurring events into instances; we still filter those out below.
    const now = new Date()
    const timeMin = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events`)
    url.searchParams.set('timeMin', timeMin)
    url.searchParams.set('timeMax', timeMax)
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('maxResults', '250')
    url.searchParams.set('orderBy', 'startTime')

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${auth.accessToken}` } })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[orphan-events] Google list failed:', res.status, text)
      return NextResponse.json({ events: [], hasGoogleConnection: true })
    }
    const json = await res.json()
    const items = (json.items || []) as GoogleEvent[]

    // Pull every Bloomsline-tracked Google event ID for this practitioner so
    // we can subtract them in one pass.
    const { data: trackedRows } = await adminSupabase
      .from('bookings')
      .select('google_event_id')
      .eq('practitioner_id', user.id)
      .not('google_event_id', 'is', null)
    const trackedIds = new Set(
      (trackedRows || [])
        .map(r => r.google_event_id as string | null)
        .filter((id): id is string => !!id),
    )

    const orphans: Array<{
      googleEventId: string
      title: string
      description: string | null
      startTime: string
      endTime: string
      timezone: string
      location: string | null
      hangoutLink: string | null
      attendees: Array<{ email: string; displayName: string | null }>
      suggestedMember: { id: string; name: string } | null
      suggestedAttendeeEmail: string | null
    }> = []

    for (const e of items) {
      if (!e.id) continue
      if (e.status === 'cancelled') continue
      if (!e.start?.dateTime || !e.end?.dateTime) continue // skip all-day
      if (e.recurringEventId) continue // skip individual instances of a recurring series
      if (Array.isArray(e.recurrence) && e.recurrence.length > 0) continue // skip recurring parents
      if (trackedIds.has(e.id)) continue

      const attendees = e.attendees || []
      const externalAttendees = attendees.filter(a => !a.self && !a.organizer && a.email)
      if (externalAttendees.length === 0) continue

      let suggestedMember: { id: string; first_name: string; last_name: string } | null = null
      let suggestedAttendeeEmail: string | null = null
      for (const a of externalAttendees) {
        const email = a.email?.toLowerCase()
        if (!email) continue
        const m = emailToMember.get(email)
        if (m) {
          suggestedMember = m
          suggestedAttendeeEmail = a.email || null
          break
        }
      }

      orphans.push({
        googleEventId: e.id,
        title: e.summary || '',
        description: e.description || null,
        startTime: e.start.dateTime,
        endTime: e.end.dateTime,
        timezone: e.start.timeZone || 'UTC',
        location: e.location || null,
        hangoutLink: e.hangoutLink || null,
        attendees: externalAttendees.map(a => ({ email: a.email || '', displayName: a.displayName || null })),
        suggestedMember: suggestedMember
          ? { id: suggestedMember.id, name: `${suggestedMember.first_name} ${suggestedMember.last_name}`.trim() }
          : null,
        suggestedAttendeeEmail,
      })
    }

    orphans.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    return NextResponse.json({
      events: orphans,
      hasGoogleConnection: true,
    })
  } catch (err) {
    console.error('orphan-events error:', err)
    return NextResponse.json({ error: 'Failed to fetch orphan events' }, { status: 500 })
  }
}
