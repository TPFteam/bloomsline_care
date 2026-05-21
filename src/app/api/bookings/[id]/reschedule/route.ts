import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
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

    // Get session type name (used by buildCalendarEvent if we PATCH Google).
    const { data: settings } = await adminSupabase
      .from('booking_settings')
      .select('session_types')
      .eq('user_id', user.id)
      .single();

    const sessionTypes = (settings?.session_types as Array<{ id: string; name: string }>) || [];
    const sessionType = sessionTypes.find(st => st.id === (sessionTypeId ?? booking.session_type));
    const sessionTypeName = sessionType?.name || (sessionTypeId ?? booking.session_type);

    // ────────────────────────────────────────────────────────────────────
    // In-place reschedule.
    //
    // Previously we inserted a new booking row at the new time and
    // cancelled the old row. That left a "Rescheduled by practitioner"
    // ghost in Historique and sent the patient TWO emails (cancellation
    // + new invitation). The patient sees one move; they should receive
    // one email and we should keep one row.
    //
    // Now: UPDATE the existing booking in place. The bookings→sessions
    // trigger (migration 20260514_sync_sessions_with_bookings) moves
    // the paired session row in lockstep. Then PATCH the Google event
    // with the new start/end + refreshed description. Patient gets
    // exactly one "appointment updated" email.
    //
    // bookings.session_format uses the Google-Calendar vocabulary
    // ('in_person' | 'video' | 'phone'). The front-end uses 'virtual'
    // as a synonym for 'video', so map it back before the update.
    // ────────────────────────────────────────────────────────────────────
    const effectiveSessionType = sessionTypeId ?? booking.session_type;
    const rawSessionFormat = sessionFormat ?? booking.session_format;
    const effectiveSessionFormat =
      rawSessionFormat === 'virtual' ? 'video' : rawSessionFormat;

    const updateNow = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from('bookings')
      .update({
        start_time: newSlotStart,
        end_time: newSlotEnd,
        ...(sessionTypeId ? { session_type: effectiveSessionType } : {}),
        ...(sessionFormat ? { session_format: effectiveSessionFormat } : {}),
        updated_at: updateNow,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update booking for reschedule:', updateError);
      return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
    }

    // PATCH the Google event so the patient sees the new time. One
    // notification email gets sent ("Event updated"), not a cancel +
    // invite pair. Errors are non-fatal — the practitioner can retry
    // the Google sync from the bookings page if it fails.
    const isFutureNewBooking = new Date(newSlotStart).getTime() > Date.now();
    let calendarSyncFailed = false;
    if (booking.google_event_id && (isFutureBooking || isFutureNewBooking)) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (googleAuth) {
        try {
          const practAddr = await getPractitionerAddress(user.id, adminSupabase);
          const { data: titleSettings } = await adminSupabase
            .from('booking_settings')
            .select('calendar_event_title_template')
            .eq('user_id', user.id)
            .maybeSingle();
          const titleTemplate = (titleSettings as { calendar_event_title_template?: string | null } | null)?.calendar_event_title_template ?? null;
          const rebuilt = buildCalendarEvent({
            bookingId: booking.id,
            practitionerName: await getPractitionerName(user.id, adminSupabase),
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            clientPhone: booking.client_phone,
            sessionTypeName,
            sessionFormat: effectiveSessionFormat,
            startTime: newSlotStart,
            endTime: newSlotEnd,
            timezone: booking.timezone,
            notes: booking.notes,
            locale: 'fr',
            isRescheduled: true,
            practitionerAddress: practAddr.address,
            practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
            titleTemplate,
          }) as { start: unknown; end: unknown; summary: string; description: string; location?: string };

          // Inject the optional reason just after the "Session rescheduled"
          // header so the patient sees why in the same email.
          let description = rebuilt.description;
          const reasonText = reason?.trim();
          if (reasonText) {
            const { data: pUser } = await adminSupabase.from('users').select('preferred_language').eq('id', user.id).single();
            const isFr = pUser?.preferred_language === 'fr';
            const reasonLine = isFr ? `Raison : ${reasonText}` : `Reason: ${reasonText}`;
            description = description.replace(
              /(⟳ (?:Séance reprogrammée|Rescheduled session))/,
              `$1\n${reasonLine}`,
            );
          }

          const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`;
          const patchRes = await fetch(`${calendarUrl}?sendUpdates=${ownSendUpdates}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${googleAuth.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              start: rebuilt.start,
              end: rebuilt.end,
              summary: rebuilt.summary,
              description,
              ...(rebuilt.location ? { location: rebuilt.location } : {}),
            }),
          });
          if (!patchRes.ok) {
            const errText = await patchRes.text().catch(() => '');
            console.error('Reschedule Google PATCH failed:', patchRes.status, errText);
            calendarSyncFailed = true;
          }
        } catch (err) {
          console.error('Reschedule Google PATCH errored:', err);
          calendarSyncFailed = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      newBookingId: id,
      ...(calendarSyncFailed ? { calendarSyncFailed: true } : {}),
    });
  } catch (err) {
    console.error('Practitioner reschedule error:', err);
    return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
  }
}
