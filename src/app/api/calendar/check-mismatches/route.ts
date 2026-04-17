import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { getValidGoogleToken } from '@/lib/services/google-auth'

/**
 * GET /api/calendar/check-mismatches
 *
 * Checks future bookings that have a google_event_id against Google Calendar.
 * Returns any mismatches (events deleted/cancelled on Google but still confirmed
 * on Bloomsline) so the practitioner can decide what to do — instead of
 * auto-cancelling behind their back.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Get future bookings with a Google event ID that are still active
    const { data: bookings } = await adminSupabase
      .from('bookings')
      .select('id, google_event_id, start_time, end_time, client_name, session_type, member_id')
      .eq('practitioner_id', user.id)
      .not('google_event_id', 'is', null)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ mismatches: [] })
    }

    // Get Google auth
    const googleAuth = await getValidGoogleToken(user.id, adminSupabase)
    if (!googleAuth) {
      // No Google Calendar connected — can't check
      return NextResponse.json({ mismatches: [] })
    }

    // Check each booking's Google event in parallel (batched)
    const BATCH_SIZE = 10
    const mismatches: Array<{
      bookingId: string
      clientName: string
      sessionType: string
      startTime: string
      endTime: string
    }> = []

    for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
      const batch = bookings.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (booking) => {
          if (!booking.google_event_id) return null
          try {
            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`,
              { headers: { Authorization: `Bearer ${googleAuth.accessToken}` } }
            )

            if (res.status === 404 || res.status === 410) {
              return booking // Event deleted
            }

            if (res.ok) {
              const event = await res.json()
              if (event.status === 'cancelled') {
                return booking // Event cancelled
              }
            }

            return null // Event still exists
          } catch {
            return null // Can't check — skip
          }
        })
      )

      for (const booking of results) {
        if (booking) {
          mismatches.push({
            bookingId: booking.id,
            clientName: booking.client_name,
            sessionType: booking.session_type,
            startTime: booking.start_time,
            endTime: booking.end_time,
          })
        }
      }
    }

    return NextResponse.json({ mismatches })
  } catch (err) {
    console.error('[check-mismatches] Error:', err)
    return NextResponse.json({ mismatches: [] })
  }
}
