/**
 * POST /api/bookings/[id]/restore
 *
 * Reopen a cancelled booking. Used both as the toast-level undo right
 * after a cancellation AND as a "I cancelled this by mistake" recovery
 * affordance from the row menu hours/days later.
 *
 * Behaviour:
 *   - Flip booking row back to confirmed (clears cancellation fields)
 *   - Flip the paired session row back to scheduled
 *   - Recreate the Google event:
 *       · Series instance: PATCH the instance back to confirmed
 *       · Single non-series booking: POST a fresh event (the original was
 *         deleted on cancel) so the patient gets a new invitation
 *   - Refuses when a reschedule-successor exists (would create a duplicate
 *     appointment for the patient at two times). The practitioner should
 *     cancel the successor first or restore that instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { buildCalendarEvent, getPractitionerName, getPractitionerAddress } from '@/lib/services/calendar-event';
import { postGoogleEvent } from '@/lib/services/google-event-create';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: booking, error: fetchErr } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.practitioner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'cancelled') {
      return NextResponse.json({ error: 'Booking is not cancelled' }, { status: 400 });
    }

    // Refuse if a reschedule-successor exists. Restoring would create
    // two active appointments for the same patient at different times,
    // and the patient already has the successor in their calendar.
    const { data: successor } = await adminSupabase
      .from('bookings')
      .select('id, start_time, status')
      .eq('rescheduled_from', id)
      .neq('status', 'cancelled')
      .maybeSingle();
    if (successor) {
      return NextResponse.json({
        error: 'This booking was rescheduled — the new booking is still active. Cancel the new one before restoring this one.',
        successorBookingId: successor.id,
      }, { status: 409 });
    }

    const nowIso = new Date().toISOString();

    // 1. Flip the booking row back to confirmed.
    await adminSupabase
      .from('bookings')
      .update({
        status: 'confirmed',
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        updated_at: nowIso,
      })
      .eq('id', id);

    // 2. Flip the matching session row back to scheduled.
    if (booking.member_id) {
      await adminSupabase
        .from('sessions')
        .update({ status: 'scheduled', updated_at: nowIso })
        .eq('practitioner_id', booking.practitioner_id)
        .eq('member_id', booking.member_id)
        .eq('scheduled_at', booking.start_time)
        .eq('status', 'cancelled');
    }

    // 3. Restore the Google event.
    //    - Series instance with parent event still present → PATCH back to confirmed.
    //    - Single non-series booking → original event was deleted on cancel;
    //      POST a fresh event and update the booking with the new id.
    //    Backdated bookings skip Google sync (historical record only).
    const isFutureBooking = new Date(booking.start_time).getTime() > Date.now();
    if (isFutureBooking) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (googleAuth) {
        if (booking.google_event_id && booking.series_id) {
          // Series occurrence — flip the instance back to confirmed.
          const startUtc = new Date(booking.start_time);
          const yyyy = startUtc.getUTCFullYear();
          const mm = String(startUtc.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(startUtc.getUTCDate()).padStart(2, '0');
          const hh = String(startUtc.getUTCHours()).padStart(2, '0');
          const mi = String(startUtc.getUTCMinutes()).padStart(2, '0');
          const ss = String(startUtc.getUTCSeconds()).padStart(2, '0');
          const instanceId = `${booking.google_event_id}_${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
          const instanceUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${instanceId}`;
          try {
            await fetch(`${instanceUrl}?sendUpdates=all`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${googleAuth.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'confirmed' }),
            });
          } catch (err) {
            console.warn('Failed to restore Google instance:', err);
          }
        } else {
          // Single non-series — the original event was DELETEd. Create a
          // new one so the patient gets a fresh invitation.
          try {
            const { data: settings } = await adminSupabase
              .from('booking_settings')
              .select('session_types, calendar_event_title_template, calendar_email_reminder_enabled')
              .eq('user_id', user.id)
              .maybeSingle();
            const sessionTypes = (settings?.session_types as Array<{ id: string; name: string }>) || [];
            const sessionType = sessionTypes.find(st => st.id === booking.session_type);
            const sessionTypeName = sessionType?.name || (booking.session_type as string);
            const titleTemplate = (settings as { calendar_event_title_template?: string | null } | null)?.calendar_event_title_template ?? null;
            const calendarEmailReminder = (settings as { calendar_email_reminder_enabled?: boolean } | null)?.calendar_email_reminder_enabled ?? false;
            const practAddr = await getPractitionerAddress(user.id, adminSupabase);

            const calendarEvent = buildCalendarEvent({
              bookingId: booking.id,
              practitionerName: await getPractitionerName(user.id, adminSupabase),
              clientName: booking.client_name,
              clientEmail: booking.client_email,
              clientPhone: booking.client_phone,
              sessionTypeName,
              sessionFormat: booking.session_format,
              startTime: booking.start_time,
              endTime: booking.end_time,
              timezone: booking.timezone,
              notes: booking.notes,
              locale: 'fr',
              practitionerAddress: practAddr.address,
              practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
              titleTemplate,
              calendarEmailReminder,
            });

            const result = await postGoogleEvent({
              accessToken: googleAuth.accessToken,
              calendarId: googleAuth.calendarId,
              payload: calendarEvent,
              sessionFormat: booking.session_format,
            });
            if (result.ok) {
              const event = result.event;
              const isVideo = booking.session_format === 'video';
              await adminSupabase
                .from('bookings')
                .update({ google_event_id: event.id, meet_link: isVideo ? (event.hangoutLink || null) : null })
                .eq('id', id);
            } else {
              console.warn('Restore: Google event create failed:', result.status, result.errorText);
            }
          } catch (err) {
            console.warn('Restore: Google event create errored:', err);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Restore error:', err);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}
