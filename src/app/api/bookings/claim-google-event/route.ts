/**
 * POST /api/bookings/claim-google-event
 *
 * Adopts an existing Google Calendar event into Bloomsline. The practitioner
 * has already booked the event in Google directly; this endpoint creates the
 * matching `bookings` + `sessions` row pointing at the same `google_event_id`
 * so the two stay linked. NO new Google event is created → patient receives
 * no additional email.
 *
 * Body: { googleEventId, memberId, sessionTypeId? }
 *
 * Side effects:
 *   - INSERT bookings row (status: confirmed for future, completed for past)
 *   - INSERT sessions row (member-tracking mirror)
 *   - Updates calendar_connections.last_synced_at to keep the activity log fresh
 *
 * Idempotency: if a `bookings` row already exists with this google_event_id
 * for this practitioner, returns 409 with the existing booking id rather than
 * creating a duplicate.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { getValidGoogleToken } from '@/lib/services/google-auth'

interface ClaimBody {
  googleEventId?: string
  memberId?: string
  sessionTypeId?: string
}

interface GoogleEvent {
  id: string
  status?: string
  summary?: string
  start?: { dateTime?: string; timeZone?: string }
  end?: { dateTime?: string; timeZone?: string }
  attendees?: Array<{ email?: string; displayName?: string; self?: boolean }>
  hangoutLink?: string
  location?: string
  description?: string
}

const SESSION_TYPE_ENUM_MAP: Record<string, string> = {
  initial_consultation: 'initial_consultation',
  initial: 'initial_consultation',
  follow_up: 'follow_up',
  follow: 'follow_up',
  check_in: 'check_in',
  check: 'check_in',
  crisis: 'crisis',
  group: 'group',
}

function toSessionEnum(typeId: string): string {
  const lower = typeId.toLowerCase()
  return SESSION_TYPE_ENUM_MAP[lower] || 'other'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClaimBody
    const { googleEventId, memberId, sessionTypeId } = body

    if (!googleEventId || !memberId) {
      return NextResponse.json({ error: 'googleEventId and memberId are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Idempotency: if we already track this event, don't double-claim.
    const { data: existing } = await adminSupabase
      .from('bookings')
      .select('id')
      .eq('practitioner_id', user.id)
      .eq('google_event_id', googleEventId)
      .maybeSingle()
    if (existing?.id) {
      return NextResponse.json(
        { error: 'This event is already linked to a Bloomsline booking', bookingId: existing.id },
        { status: 409 },
      )
    }

    // Verify the member belongs to this practitioner before we link them.
    const { data: member } = await adminSupabase
      .from('members')
      .select('id, first_name, last_name, email, phone, session_price')
      .eq('id', memberId)
      .eq('practitioner_id', user.id)
      .single()
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Pull the live event from Google so we have authoritative start/end and
    // can confirm it still exists (practitioner may have just deleted it).
    const auth = await getValidGoogleToken(user.id, adminSupabase)
    if (!auth) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events/${googleEventId}`
    const evtRes = await fetch(eventUrl, { headers: { Authorization: `Bearer ${auth.accessToken}` } })
    if (evtRes.status === 404 || evtRes.status === 410) {
      return NextResponse.json({ error: 'Event no longer exists in Google Calendar' }, { status: 410 })
    }
    if (!evtRes.ok) {
      const text = await evtRes.text().catch(() => '')
      console.error('[claim-google-event] fetch failed:', evtRes.status, text)
      return NextResponse.json({ error: 'Failed to read event from Google' }, { status: 502 })
    }
    const event = (await evtRes.json()) as GoogleEvent
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Event is cancelled in Google Calendar' }, { status: 400 })
    }
    if (!event.start?.dateTime || !event.end?.dateTime) {
      return NextResponse.json({ error: 'Event must have a fixed start and end time' }, { status: 400 })
    }

    const startIso = new Date(event.start.dateTime).toISOString()
    const endIso = new Date(event.end.dateTime).toISOString()
    const durationMinutes = Math.max(1, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000))

    const isPast = new Date(startIso).getTime() < Date.now()
    const bookingStatus = isPast ? 'completed' : 'confirmed'
    const sessionStatus = isPast ? 'completed' : 'scheduled'

    // Pull session_types so we can resolve a name for the chosen ID and figure
    // out a price. Defaults to the first type if no ID is provided.
    const { data: settings } = await adminSupabase
      .from('booking_settings')
      .select('session_types')
      .eq('user_id', user.id)
      .maybeSingle()
    const sessionTypes = (settings?.session_types as Array<{ id: string; name: string; duration?: number; price?: number | null }>) || []
    const chosenType = sessionTypeId
      ? sessionTypes.find(t => t.id === sessionTypeId)
      : sessionTypes[0]
    const resolvedSessionTypeId = chosenType?.id || sessionTypeId || 'follow_up'
    const resolvedTypeName = chosenType?.name || event.summary || resolvedSessionTypeId

    // Patient-level override on price wins, falling back to the session type's price.
    const price = (member.session_price ?? chosenType?.price) ?? null

    // Determine format from the event payload — Google Meet link → video,
    // a populated location → in_person, otherwise default to in_person.
    const sessionFormat: 'in_person' | 'video' =
      event.hangoutLink ? 'video' : event.location ? 'in_person' : 'in_person'

    const clientName = `${member.first_name} ${member.last_name}`.trim()
    const clientEmail = member.email || ''
    const clientPhone = member.phone || null

    // 1. Insert booking. google_event_id set → no Google round-trip required.
    const { data: booking, error: bookingErr } = await adminSupabase
      .from('bookings')
      .insert({
        practitioner_id: user.id,
        member_id: member.id,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        session_type: resolvedSessionTypeId,
        session_format: sessionFormat === 'in_person' ? 'in_person' : 'video',
        start_time: startIso,
        end_time: endIso,
        timezone: event.start.timeZone || 'UTC',
        status: bookingStatus,
        notes: event.description || null,
        google_event_id: event.id,
        meet_link: event.hangoutLink || null,
        price,
      })
      .select()
      .single()

    if (bookingErr || !booking) {
      console.error('[claim-google-event] booking insert failed:', bookingErr)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // 2. Base session row is created automatically by the
    //    bookings→sessions trigger from the booking insert above.
    //    Backfill the session-only extras the trigger can't know
    //    (custom_session_type for "other"-mapped types, notes, price).
    try {
      const sessionEnum = toSessionEnum(resolvedSessionTypeId)
      await adminSupabase.from('sessions')
        .update({
          custom_session_type: sessionEnum === 'other' ? resolvedTypeName : null,
          notes: event.description ? `${resolvedTypeName}\n\n${event.description}` : resolvedTypeName,
          price,
        })
        .eq('practitioner_id', user.id)
        .eq('member_id', member.id)
        .eq('scheduled_at', startIso)
      void sessionStatus; void durationMinutes;
    } catch (sessionErr) {
      console.warn('[claim-google-event] session backfill failed (booking created):', sessionErr)
    }

    // 3. Refresh sync timestamp.
    await adminSupabase
      .from('calendar_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      booking: { id: booking.id, status: booking.status, start_time: booking.start_time, end_time: booking.end_time },
    })
  } catch (err) {
    console.error('claim-google-event error:', err)
    return NextResponse.json({ error: 'Failed to claim event' }, { status: 500 })
  }
}
