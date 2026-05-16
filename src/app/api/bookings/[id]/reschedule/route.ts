import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';
import { buildCalendarEvent, getPractitionerName, getPractitionerAddress } from '@/lib/services/calendar-event';

/**
 * POST /api/bookings/[id]/reschedule
 *
 * Practitioner-initiated reschedule.
 * Body:
 *   newSlotStart: string (ISO)
 *   newSlotEnd: string (ISO)
 *   reason?: string (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newSlotStart, newSlotEnd, reason } = body;
    // For series bookings: 'this' moves only this occurrence (creates an
    // exception instance on Google); 'following' is not yet supported in v1.
    const seriesScope: 'this' | 'following' = body.series_scope === 'following' ? 'following' : 'this';
    // Optional — practitioner can change session type / format as part of
    // the reschedule. Undefined means "keep what's already on the row".
    const sessionTypeId: string | undefined = typeof body.sessionTypeId === 'string' ? body.sessionTypeId : undefined;
    const sessionFormat: 'in_person' | 'virtual' | undefined =
      body.sessionFormat === 'in_person' || body.sessionFormat === 'virtual'
        ? body.sessionFormat
        : undefined;

    if (!newSlotStart || !newSlotEnd) {
      return NextResponse.json({ error: 'New slot start and end are required' }, { status: 400 });
    }

    // Authenticate practitioner
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get the booking and verify ownership
    const { data: booking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.practitioner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check calendar email preference
    const { data: calSettings } = await adminSupabase.from('booking_settings').select('send_own_calendar_emails').eq('user_id', user.id).maybeSingle();
    const ownSendUpdates = calSettings?.send_own_calendar_emails !== false ? 'all' : 'none';

    const isFutureBooking = new Date(booking.start_time).getTime() > Date.now();

    // ────────────────────────────────────────────────────────────────────────
    // Series-aware reschedule
    // ────────────────────────────────────────────────────────────────────────
    // For a row that's part of a recurring series, "reschedule this occurrence"
    // means updating the row in place and letting Google create an exception
    // instance — never cancel-and-recreate (which would orphan it from the
    // series and spam the patient with separate cancel + invite emails).
    if (booking.series_id && seriesScope === 'this') {
      const newDuration = Math.round((new Date(newSlotEnd).getTime() - new Date(newSlotStart).getTime()) / 60000);

      // Move our DB rows in place. Mark detached so the UI can show "moved
      // from series" if it ever cares to.
      const updateNow = new Date().toISOString();
      await adminSupabase
        .from('bookings')
        .update({
          start_time: newSlotStart,
          end_time: newSlotEnd,
          detached_from_series: true,
          updated_at: updateNow,
          ...(sessionTypeId ? { session_type: sessionTypeId } : {}),
          ...(sessionFormat ? { session_format: sessionFormat } : {}),
        })
        .eq('id', id);

      await adminSupabase
        .from('sessions')
        .update({
          scheduled_at: newSlotStart,
          duration_minutes: newDuration,
          detached_from_series: true,
          updated_at: updateNow,
          ...(sessionTypeId ? { session_type: sessionTypeId } : {}),
          ...(sessionFormat ? { session_format: sessionFormat } : {}),
        })
        .eq('practitioner_id', user.id)
        .eq('member_id', booking.member_id)
        .eq('scheduled_at', booking.start_time)
        .in('status', ['scheduled', 'confirmed']);

      // Move the specific Google instance — PATCH on the instance ID, not the
      // parent. Google emits one "your appointment was moved" notification.
      if (booking.google_event_id && isFutureBooking) {
        const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
        if (googleAuth) {
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
            await fetch(`${instanceUrl}?sendUpdates=${ownSendUpdates}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${googleAuth.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                start: { dateTime: newSlotStart, timeZone: booking.timezone },
                end: { dateTime: newSlotEnd, timeZone: booking.timezone },
              }),
            });
          } catch (err) {
            console.error('Failed to move Google instance:', err);
          }
        }
      }

      return NextResponse.json({ success: true, newBookingId: id, seriesOccurrenceMoved: true });
    }

    // 'following' scope on a series isn't supported in v1 — practitioners
    // should cancel-this-and-following then book a new series at the new time.
    if (booking.series_id && seriesScope === 'following') {
      return NextResponse.json({
        error: 'Rescheduling all following occurrences is not supported. Cancel them and create a new series at the new time.',
      }, { status: 400 });
    }

    // Format dates for notifications
    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });

    const originalTime = formatDate(booking.start_time);
    const newTime = formatDate(newSlotStart);

    // Get session type name
    const { data: settings } = await adminSupabase
      .from('booking_settings')
      .select('session_types')
      .eq('user_id', user.id)
      .single();

    const sessionTypes = (settings?.session_types as Array<{ id: string; name: string }>) || [];
    const sessionType = sessionTypes.find(st => st.id === booking.session_type);
    const sessionTypeName = sessionType?.name || booking.session_type;

    // ─── Reordered for fail-safety ─────────────────────────────────
    // Old order: cancel-old (DB) → delete-old-event (sends cancel email)
    //            → insert-new (DB) → create-new-event (sends invite)
    // Problem: if insert-new or create-new-event failed, the patient
    // already had the cancellation in their inbox with no rebook.
    //
    // New order: insert-new (DB) → create-new-event → cancel-old (DB)
    //            → delete-old-event. Any failure before the cancel-old
    //            step leaves the patient seeing nothing changed.
    // ────────────────────────────────────────────────────────────────

    // Resolve effective session type / format — practitioner-provided
    // overrides win, otherwise inherit from the old booking row.
    //
    // bookings.session_format uses the Google-Calendar vocabulary
    // ('in_person' | 'video' | 'phone'). The front-end and our session
    // table use 'virtual' as a synonym for 'video', so map it back
    // here before the insert — otherwise the bookings check
    // constraint rejects the row.
    const effectiveSessionType = sessionTypeId ?? booking.session_type;
    const rawSessionFormat = sessionFormat ?? booking.session_format;
    const effectiveSessionFormat =
      rawSessionFormat === 'virtual' ? 'video' : rawSessionFormat;

    // ─── Step 1: Insert the new booking ────────────────────────────
    // If this fails (constraint, RLS, trigger throwing), nothing on the
    // patient's calendar has been touched yet.
    const { data: newBooking, error: createError } = await adminSupabase
      .from('bookings')
      .insert({
        practitioner_id: user.id,
        member_id: booking.member_id,
        client_name: booking.client_name,
        client_email: booking.client_email,
        client_phone: booking.client_phone,
        session_type: effectiveSessionType,
        session_format: effectiveSessionFormat,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        timezone: booking.timezone,
        status: 'confirmed',
        notes: booking.notes,
        practitioner_notes: booking.practitioner_notes,
        rescheduled_from: id,
        rescheduled_by: 'practitioner',
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create rescheduled booking:', createError);
      return NextResponse.json({ error: 'Failed to create new booking' }, { status: 500 });
    }

    // Base session row at the new slot is created automatically by the
    // bookings→sessions trigger from the insert above.

    // ─── Step 2: Create the new Google Calendar event ──────────────
    // If this fails for a future booking, bail out without touching
    // the old event. The new booking is in our DB; the practitioner
    // can retry the Google sync from the bookings page.
    const isFutureNewBooking = new Date(newSlotStart).getTime() > Date.now();
    let newGoogleEventCreated = !isFutureNewBooking; // backdated → no Google sync needed, treat as "done"
    if (isFutureNewBooking) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (!googleAuth) {
        // No Google connection → nothing to create on Google, but the
        // DB-level reschedule still proceeds.
        newGoogleEventCreated = true;
      } else {
        try {
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events?sendUpdates=all&conferenceDataVersion=1`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${googleAuth.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(await (async () => {
                const practAddr = await getPractitionerAddress(user.id, adminSupabase);
                return buildCalendarEvent({
                  bookingId: newBooking.id,
                  practitionerName: await getPractitionerName(user.id, adminSupabase),
                  clientName: booking.client_name,
                  clientEmail: booking.client_email,
                  clientPhone: booking.client_phone,
                  sessionTypeName,
                  sessionFormat: booking.session_format,
                  startTime: newSlotStart,
                  endTime: newSlotEnd,
                  timezone: booking.timezone,
                  notes: booking.notes,
                  locale: 'fr',
                  isRescheduled: true,
                  practitionerAddress: practAddr.address,
                  practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
                });
              })()),
            }
          );
          if (response.ok) {
            const event = await response.json();
            await adminSupabase
              .from('bookings')
              .update({ google_event_id: event.id, meet_link: event.hangoutLink || null })
              .eq('id', newBooking.id);
            newGoogleEventCreated = true;
          } else {
            const errText = await response.text().catch(() => '');
            console.error('New Google event create failed:', response.status, errText);
          }
        } catch (err) {
          console.error('Failed to create new calendar event:', err);
        }
      }
    }

    if (!newGoogleEventCreated) {
      // Old event is intact, old booking still confirmed. The new booking
      // is in our DB without a Google event. Surface this so the
      // practitioner can retry the calendar sync rather than leaving the
      // patient with a cancelled appointment and no rebook.
      return NextResponse.json({
        error: 'New booking created but Google Calendar invite failed. The original appointment is still active — please retry calendar sync from the bookings page.',
        newBookingId: newBooking.id,
        calendarSyncFailed: true,
      }, { status: 502 });
    }

    // ─── Step 3: Cancel the old booking + linked session ───────────
    await adminSupabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'practitioner',
        cancellation_reason: reason ? `Rescheduled: ${reason.trim()}` : 'Rescheduled by practitioner',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    await adminSupabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('practitioner_id', user.id)
      .eq('scheduled_at', booking.start_time)
      .eq('status', 'scheduled');

    // ─── Step 4: Delete the old Google event ───────────────────────
    // Patch description with reschedule reason first so the
    // cancellation email shows why. Errors here are non-fatal — the
    // new booking + event are already in place.
    if (booking.google_event_id && isFutureBooking) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (googleAuth) {
        const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`;
        const authHeaders = { Authorization: `Bearer ${googleAuth.accessToken}`, 'Content-Type': 'application/json' };
        try {
          const { data: pUser } = await adminSupabase.from('users').select('preferred_language').eq('id', user.id).single();
          const isFr = pUser?.preferred_language === 'fr';
          const reasonText = reason?.trim() || '';
          const rescheduleNote = reasonText
            ? (isFr ? `\n\n⟳ Séance reprogrammée — Raison : ${reasonText}` : `\n\n⟳ Session rescheduled — Reason: ${reasonText}`)
            : (isFr ? '\n\n⟳ Séance reprogrammée' : '\n\n⟳ Session rescheduled');

          const eventRes = await fetch(calendarUrl, { headers: authHeaders });
          if (eventRes.ok) {
            const event = await eventRes.json();
            await fetch(`${calendarUrl}?sendUpdates=none`, {
              method: 'PATCH',
              headers: authHeaders,
              body: JSON.stringify({ description: (event.description || '') + rescheduleNote }),
            });
          }

          await fetch(`${calendarUrl}?sendUpdates=all`, {
            method: 'DELETE',
            headers: authHeaders,
          });
        } catch (err) {
          console.error('Failed to delete old calendar event:', err);
        }
      }
    }

    // No Bloomsline emails — Google Calendar handles notifications:
    // - Old event DELETE with sendUpdates=all → cancellation email (with reason)
    // - New event POST with sendUpdates=all → invitation email (with new time)

    return NextResponse.json({ success: true, newBookingId: newBooking.id });
  } catch (err) {
    console.error('Practitioner reschedule error:', err);
    return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
  }
}
