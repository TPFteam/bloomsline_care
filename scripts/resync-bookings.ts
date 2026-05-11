/**
 * One-off recovery: re-sync booking rows to Google Calendar.
 *
 * Mirrors the logic of POST /api/bookings/[id]/sync-calendar but runs
 * with the service role so we can recover bookings that were never
 * successfully synced (e.g. failed when patient had no email — fixed
 * in 1f2cf72). Skips bookings that already have google_event_id, are
 * not confirmed, or are backdated.
 *
 * Usage (from repo root):
 *   bash scripts/run-resync-bookings.sh <booking-id> [<booking-id> ...]
 *
 * Example for drmouniasami's stuck bookings:
 *   bash scripts/run-resync-bookings.sh \
 *     d6393d45-9dde-40cd-924c-8740fde7a8d7 \
 *     cbe060fb-d44b-4ae6-be93-f8d1a136ce40 \
 *     f4f9cafe-1743-42a4-9887-643282bea8cd
 *
 * Idempotent: bookings already synced (google_event_id set) are skipped.
 */

import { createClient } from '@supabase/supabase-js'
import { getValidGoogleToken } from '../src/lib/services/google-auth'
import {
  buildCalendarEvent,
  getPractitionerAddress,
  getPractitionerName,
} from '../src/lib/services/calendar-event'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.')
  process.exit(1)
}

const bookingIds = process.argv.slice(2)
if (bookingIds.length === 0) {
  console.error('Usage: tsx scripts/resync-bookings.ts <booking-id> [<booking-id> ...]')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function resyncOne(bookingId: string): Promise<{ status: 'synced' | 'skipped' | 'failed'; reason: string; eventId?: string }> {
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) {
    return { status: 'failed', reason: `not found: ${fetchErr?.message || 'no row'}` }
  }

  if (booking.status !== 'confirmed') {
    return { status: 'skipped', reason: `status is "${booking.status}", not confirmed` }
  }

  if (booking.google_event_id) {
    return { status: 'skipped', reason: `already synced (event_id ${booking.google_event_id})` }
  }

  if (new Date(booking.start_time).getTime() < Date.now()) {
    return { status: 'skipped', reason: 'backdated — by policy calendar sync is skipped for past sessions' }
  }

  const googleAuth = await getValidGoogleToken(booking.practitioner_id, supabase)
  if (!googleAuth) {
    return { status: 'failed', reason: 'Google Calendar not connected for this practitioner' }
  }

  // Resolve session type name + practitioner profile for the event title/body.
  const { data: settings } = await supabase
    .from('booking_settings')
    .select('session_types')
    .eq('user_id', booking.practitioner_id)
    .single()

  const sessionTypes = (settings?.session_types as Array<{ id: string; name: string }>) || []
  const sessionType = sessionTypes.find(st => st.id === booking.session_type)
  const sessionTypeName = sessionType?.name || booking.session_type

  const { data: practUser } = await supabase
    .from('users')
    .select('full_name, preferred_language, email, phone')
    .eq('id', booking.practitioner_id)
    .single()

  const practitionerName = (await getPractitionerName(booking.practitioner_id, supabase)) || 'Practitioner'
  const locale = (practUser?.preferred_language as 'en' | 'fr' | 'es') || 'fr'
  const practAddr = await getPractitionerAddress(booking.practitioner_id, supabase)

  const calendarEvent = buildCalendarEvent({
    bookingId,
    practitionerName,
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    clientPhone: booking.client_phone,
    sessionTypeName,
    sessionFormat: booking.session_format,
    startTime: booking.start_time,
    endTime: booking.end_time,
    timezone: booking.timezone,
    notes: booking.notes,
    locale,
    practitionerAddress: practAddr.address,
    practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
    practitionerEmail: practUser?.email,
    practitionerPhone: practUser?.phone,
    recurrenceRule: booking.recurrence_rule || null,
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events?sendUpdates=all&conferenceDataVersion=1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleAuth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    },
  )

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    return {
      status: 'failed',
      reason: `Google API ${res.status}: ${JSON.stringify(errBody.error || errBody)}`,
    }
  }

  const event = await res.json()

  await supabase
    .from('bookings')
    .update({ google_event_id: event.id, meet_link: event.hangoutLink || null })
    .eq('id', bookingId)

  await supabase
    .from('calendar_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', booking.practitioner_id)

  return { status: 'synced', reason: 'OK', eventId: event.id }
}

;(async () => {
  console.log(`Resyncing ${bookingIds.length} booking(s)…\n`)
  let synced = 0
  let skipped = 0
  let failed = 0

  for (const id of bookingIds) {
    process.stdout.write(`${id} … `)
    try {
      const result = await resyncOne(id)
      if (result.status === 'synced') {
        console.log(`✅ synced (event ${result.eventId})`)
        synced++
      } else if (result.status === 'skipped') {
        console.log(`↪️  skipped — ${result.reason}`)
        skipped++
      } else {
        console.log(`❌ failed — ${result.reason}`)
        failed++
      }
    } catch (err) {
      console.log(`❌ exception — ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  console.log(`\nDone. Synced: ${synced} | Skipped: ${skipped} | Failed: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
})()
