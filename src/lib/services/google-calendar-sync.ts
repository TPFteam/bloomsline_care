import { SupabaseClient } from '@supabase/supabase-js'
import { getValidGoogleToken } from '@/lib/services/google-auth'

/**
 * Check if confirmed bookings still exist on Google Calendar.
 * If a booking's Google Calendar event was deleted/cancelled,
 * cancel the booking on our side too.
 *
 * Call this when loading the calendar view or fetching available slots.
 */
export async function syncCancelledGoogleEvents(
  practitionerId: string,
  supabase: SupabaseClient
): Promise<number> {
  // Get bookings with google_event_id that are still confirmed
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, google_event_id, start_time, member_id')
    .eq('practitioner_id', practitionerId)
    .not('google_event_id', 'is', null)
    .in('status', ['confirmed', 'pending'])
    .gte('start_time', new Date().toISOString())

  if (!bookings || bookings.length === 0) return 0

  // Get Google auth
  const googleAuth = await getValidGoogleToken(practitionerId, supabase)
  if (!googleAuth) return 0

  let cancelledCount = 0

  // Check each booking's Google Calendar event
  for (const booking of bookings) {
    if (!booking.google_event_id) continue

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`,
        {
          headers: { Authorization: `Bearer ${googleAuth.accessToken}` },
        }
      )

      if (res.status === 404 || res.status === 410) {
        // Event deleted from Google Calendar — cancel on our side
        await cancelBookingAndSession(booking.id, booking.start_time, practitionerId, booking.member_id, supabase)
        cancelledCount++
      } else if (res.ok) {
        const event = await res.json()
        if (event.status === 'cancelled') {
          // Event cancelled on Google Calendar
          await cancelBookingAndSession(booking.id, booking.start_time, practitionerId, booking.member_id, supabase)
          cancelledCount++
        }
      }
    } catch (err) {
      console.error(`[google-sync] Error checking event ${booking.google_event_id}:`, err)
    }
  }

  if (cancelledCount > 0) {
    console.log(`[google-sync] Cancelled ${cancelledCount} bookings that were removed from Google Calendar`)
  }

  return cancelledCount
}

async function cancelBookingAndSession(
  bookingId: string,
  startTime: string,
  practitionerId: string,
  memberId: string | null,
  supabase: SupabaseClient
) {
  // Cancel the booking
  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'practitioner',
      cancellation_reason: 'Cancelled from Google Calendar',
    })
    .eq('id', bookingId)

  // Cancel the linked session — match by practitioner + time + optional member
  let sessionQuery = supabase
    .from('sessions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('practitioner_id', practitionerId)
    .eq('scheduled_at', startTime)
    .in('status', ['scheduled', 'confirmed'])
  if (memberId) {
    sessionQuery = sessionQuery.eq('member_id', memberId)
  }
  await sessionQuery
}

/**
 * Move a booking + its linked session to a new time — used when a practitioner
 * reschedules an appointment directly in Google Calendar (real-time via the
 * webhook, and as a fallback via check-mismatches). Only retimes sessions that
 * are still scheduled/confirmed, never completed / no-show.
 */
export async function retimeBookingAndSession(
  supabase: SupabaseClient,
  args: {
    bookingId: string
    memberId: string | null
    oldStart: string
    newStart: string
    newEnd: string
    practitionerId: string
    seriesId?: string | null
    seriesPosition?: number | null
  },
): Promise<void> {
  await supabase
    .from('bookings')
    .update({ start_time: args.newStart, end_time: args.newEnd, updated_at: new Date().toISOString() })
    .eq('id', args.bookingId)

  let sessionQuery = supabase
    .from('sessions')
    .update({ scheduled_at: args.newStart, updated_at: new Date().toISOString() })
    .eq('practitioner_id', args.practitionerId)
    .in('status', ['scheduled', 'confirmed'])
  if (args.memberId) sessionQuery = sessionQuery.eq('member_id', args.memberId)
  // Prefer matching the session by series identity (survives an independent
  // "Edit session" that changed scheduled_at); else by the old timestamp.
  if (args.seriesId && typeof args.seriesPosition === 'number') {
    sessionQuery = sessionQuery.eq('series_id', args.seriesId).eq('series_position', args.seriesPosition)
  } else {
    sessionQuery = sessionQuery.eq('scheduled_at', args.oldStart)
  }
  await sessionQuery
}
