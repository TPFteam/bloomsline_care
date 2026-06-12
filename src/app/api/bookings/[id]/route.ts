import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { notifyBookingSms } from '@/lib/notifications/sms';
import { waitUntil } from '@vercel/functions';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';
import { buildCalendarEvent, getPractitionerName, getPractitionerAddress } from '@/lib/services/calendar-event';
import { postGoogleEvent } from '@/lib/services/google-event-create';

// PATCH /api/bookings/[id] - Update booking status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, practitioner_notes, cancellation_reason } = body;
    // Optional: scope of the cancel for a series booking.
    //   'this'      = only this occurrence (DB row + the matching Google instance)
    //   'following' = this occurrence and every later sibling in the same series
    // Defaults to 'this' so existing single-booking flows keep working.
    const seriesScope: 'this' | 'following' = body.series_scope === 'following' ? 'following' : 'this';

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client for updates
    const adminSupabase = createAdminClient();

    // Check calendar email preference for practitioner-initiated actions
    const { data: calSettings } = await adminSupabase.from('booking_settings').select('send_own_calendar_emails').eq('user_id', user.id).maybeSingle();
    const ownSendUpdates = calSettings?.send_own_calendar_emails !== false ? 'all' : 'none';

    // Get the booking and verify ownership
    const { data: booking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.practitioner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (practitioner_notes !== undefined) {
      updateData.practitioner_notes = practitioner_notes;
    }

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = 'practitioner';
      if (cancellation_reason) updateData.cancellation_reason = cancellation_reason;
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await adminSupabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // SMS the client when the practitioner confirms or cancels a future booking.
    // Self-gated on booking_settings.sms_on_booking + a usable mobile; no-throw.
    if (new Date(booking.start_time).getTime() >= Date.now()) {
      if (status === 'confirmed' && booking.status === 'pending') {
        waitUntil(notifyBookingSms(adminSupabase, { practitionerId: booking.practitioner_id, booking, kind: 'confirmed' }));
      } else if (status === 'cancelled' && booking.status !== 'cancelled') {
        waitUntil(notifyBookingSms(adminSupabase, { practitionerId: booking.practitioner_id, booking, kind: 'cancelled' }));
      }
    }

    // If approving, create a session record and link to member
    let sessionCreated = false;
    if (status === 'confirmed' && booking.status === 'pending') {
      try {
        // Try to find existing member by email for this practitioner
        let memberId = booking.member_id;
        console.log('[booking→session] booking.member_id:', memberId, 'client_email:', booking.client_email);
        if (!memberId && booking.client_email) {
          // Find all members with this email to debug duplicates
          const { data: allMatches } = await adminSupabase
            .from('members')
            .select('id, email, first_name, last_name, status')
            .eq('practitioner_id', user.id)
            .eq('email', booking.client_email);

          console.log('[booking→session] all member matches for', booking.client_email, ':', JSON.stringify(allMatches));

          // Prefer active member, fallback to first match
          const existingMember = allMatches?.find(m => m.status === 'active') || allMatches?.[0];
          const memberLookupError = allMatches === null ? { message: 'query failed' } : null;

          console.log('[booking→session] member lookup:', { existingMember, memberLookupError: memberLookupError?.message });

          if (existingMember) {
            memberId = existingMember.id;
            // Link member to booking for future reference
            await adminSupabase
              .from('bookings')
              .update({ member_id: memberId })
              .eq('id', id);
          }
        }

        // Map booking session_type to sessions table session_type enum
        const sessionTypeMap: Record<string, string> = {
          'initial_consultation': 'initial_consultation',
          'follow_up': 'follow_up',
          'check_in': 'check_in',
          'crisis': 'crisis',
          'group': 'group',
        };
        const mappedSessionType = sessionTypeMap[booking.session_type] || 'check_in';

        // Calculate duration from start/end times
        const durationMinutes = Math.round(
          (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000
        );

        const sessionData: Record<string, unknown> = {
          practitioner_id: user.id,
          session_type: mappedSessionType,
          session_format: 'virtual',
          scheduled_at: booking.start_time,
          duration_minutes: durationMinutes,
          status: 'scheduled',
          member_confirmed: true,
          notes: booking.notes || null,
        };

        if (memberId) {
          sessionData.member_id = memberId;
        }

        console.log('[booking→session] creating session:', JSON.stringify(sessionData));

        const { data: session, error: sessionError } = await adminSupabase
          .from('sessions')
          .insert(sessionData)
          .select('id')
          .single();

        if (sessionError) {
          console.error('Failed to create session from booking:', sessionError);
        } else {
          sessionCreated = true;
          console.log('Session created from booking:', session.id);
        }
      } catch (err) {
        console.error('Error creating session from booking:', err);
      }
    }

    // Backdated booking: skip Google Calendar invites + confirmation emails
    const isBackdatedBooking = new Date(booking.start_time).getTime() < Date.now();

    // If approving (confirming), sync to Google Calendar
    // Backdated bookings: skip calendar sync entirely (historical record only)
    let calendarSynced = false;
    let calendarError: string | null = null;

    console.log('=== Booking approval ===', { status, bookingStatus: booking.status, userId: user.id });
    if (status === 'confirmed' && booking.status === 'pending' && !isBackdatedBooking) {
      console.log('Attempting calendar sync for user:', user.id);
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);

      if (!googleAuth) {
        calendarError = 'Google Calendar not connected';
      } else {
        try {
          const { data: settings } = await adminSupabase
            .from('booking_settings')
            .select('session_types, calendar_event_title_template, calendar_email_reminder_enabled')
            .eq('user_id', user.id)
            .single();

          const sessionTypes = settings?.session_types as Array<{ id: string; name: string }> || [];
          const sessionType = sessionTypes.find(st => st.id === booking.session_type);
          const sessionTypeName = sessionType?.name || booking.session_type;
          const titleTemplate = (settings as { calendar_event_title_template?: string | null } | null)?.calendar_event_title_template ?? null;
          const calendarEmailReminder = (settings as { calendar_email_reminder_enabled?: boolean } | null)?.calendar_email_reminder_enabled ?? false;

          // Get practitioner name (robust fallback) and locale
          const { data: practUser } = await adminSupabase.from('users').select('full_name, preferred_language, email, phone').eq('id', user.id).single();
          const practName = await getPractitionerName(user.id, adminSupabase);

          const practAddr = await getPractitionerAddress(user.id, adminSupabase);
          const calendarEvent = buildCalendarEvent({
            bookingId: booking.id,
            practitionerName: practName,
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            clientPhone: booking.client_phone,
            sessionTypeName,
            sessionFormat: booking.session_format,
            startTime: booking.start_time,
            endTime: booking.end_time,
            timezone: booking.timezone,
            notes: booking.notes,
            locale: practUser?.preferred_language || 'fr',
            practitionerAddress: practAddr.address,
            practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
            practitionerEmail: practUser?.email,
            practitionerPhone: practUser?.phone,
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
            calendarSynced = true;

            const isVideo = booking.session_format === 'video';
            await adminSupabase
              .from('bookings')
              .update({ google_event_id: event.id, meet_link: isVideo ? (event.hangoutLink || null) : null })
              .eq('id', id);

            await adminSupabase
              .from('calendar_connections')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('user_id', user.id);
          } else {
            console.error('Google Calendar API error:', result.status, result.errorText);
            calendarError = result.errorText || 'Failed to create calendar event';
          }
        } catch (err) {
          console.error('Failed to create calendar event:', err);
          calendarError = err instanceof Error ? err.message : 'Unknown error';
        }
      }
    }

    // If cancelling and there's a Google event, propagate to Google.
    // Three behaviours:
    //   - Single booking (no series_id): delete the event entirely.
    //   - Series + scope='this': cancel the specific instance only (parent +
    //     siblings stay intact in the patient's calendar).
    //   - Series + scope='following': cancel this and every later sibling in
    //     the DB, and update Google by either deleting the parent (if this is
    //     the anchor) or shortening the parent RRULE with UNTIL.
    // Backdated bookings: skip calendar mutations entirely (historical only).
    if (status === 'cancelled' && booking.google_event_id && !isBackdatedBooking) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (googleAuth) {
        const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`;
        const authHeaders = { Authorization: `Bearer ${googleAuth.accessToken}`, 'Content-Type': 'application/json' };

        // Map raw reason keys to human-readable labels
        const reasonLabels: Record<string, { en: string; fr: string }> = {
          client_request: { en: 'Client request', fr: 'Demande du patient' },
          practitioner_unavailable: { en: 'Practitioner unavailable', fr: 'Praticien indisponible' },
          scheduling_conflict: { en: 'Scheduling conflict', fr: 'Conflit d\'agenda' },
          personal_reasons: { en: 'Personal reasons', fr: 'Raisons personnelles' },
        };

        try {
          // Fetch practitioner's language for the reason label
          const { data: pUser } = await adminSupabase.from('users').select('preferred_language').eq('id', user.id).single();
          const isFr = pUser?.preferred_language === 'fr';

          // Build the cancellation note for the event description
          const reasonKey = practitioner_notes || '';
          const reasonLabel = reasonLabels[reasonKey]
            ? (isFr ? reasonLabels[reasonKey].fr : reasonLabels[reasonKey].en)
            : reasonKey; // custom text or unknown key → pass through
          const cancelNote = reasonLabel
            ? (isFr ? `\n\n❌ Séance annulée — Raison : ${reasonLabel}` : `\n\n❌ Session cancelled — Reason: ${reasonLabel}`)
            : (isFr ? '\n\n❌ Séance annulée' : '\n\n❌ Session cancelled');

          const isSeries = !!booking.series_id;
          const isAnchor = booking.series_position === 1;

          if (!isSeries) {
            // ── Single booking: existing flow ───────────────────────────────
            // 1. Update description with reason (no notification yet)
            const eventRes = await fetch(`${calendarUrl}`, { headers: authHeaders });
            if (eventRes.ok) {
              const event = await eventRes.json();
              await fetch(`${calendarUrl}?sendUpdates=none`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ description: (event.description || '') + cancelNote }),
              });
            }
            // 2. Delete event → Google sends cancellation email with updated description
            await fetch(`${calendarUrl}?sendUpdates=all`, {
              method: 'DELETE',
              headers: authHeaders,
            });
          } else if (seriesScope === 'this') {
            // ── Series, single occurrence ──────────────────────────────────
            // Compute the Google "instance ID": parent event id + "_" + UTC start in compact iCal form
            // Format: YYYYMMDDTHHMMSSZ (e.g. 20260508T090000Z)
            const startUtc = new Date(booking.start_time);
            const yyyy = startUtc.getUTCFullYear();
            const mm = String(startUtc.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(startUtc.getUTCDate()).padStart(2, '0');
            const hh = String(startUtc.getUTCHours()).padStart(2, '0');
            const mi = String(startUtc.getUTCMinutes()).padStart(2, '0');
            const ss = String(startUtc.getUTCSeconds()).padStart(2, '0');
            const instanceId = `${booking.google_event_id}_${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
            const instanceUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${instanceId}`;

            // PATCH with status:cancelled — the patient receives a cancellation
            // notification only for this single occurrence; the rest of the
            // series stays in their calendar.
            await fetch(`${instanceUrl}?sendUpdates=all`, {
              method: 'PATCH',
              headers: authHeaders,
              body: JSON.stringify({ status: 'cancelled', description: undefined }),
            });
          } else {
            // ── Series, this and following ─────────────────────────────────
            if (isAnchor) {
              // Killing from the anchor = killing the whole series → delete parent.
              const eventRes = await fetch(`${calendarUrl}`, { headers: authHeaders });
              if (eventRes.ok) {
                const event = await eventRes.json();
                await fetch(`${calendarUrl}?sendUpdates=none`, {
                  method: 'PATCH',
                  headers: authHeaders,
                  body: JSON.stringify({ description: (event.description || '') + cancelNote }),
                });
              }
              await fetch(`${calendarUrl}?sendUpdates=all`, {
                method: 'DELETE',
                headers: authHeaders,
              });
            } else {
              // Shorten the parent RRULE with UNTIL = (this start - 1 second).
              // Past occurrences stay; future ones (this and onward) disappear.
              const eventRes = await fetch(calendarUrl, { headers: authHeaders });
              if (eventRes.ok) {
                const event = await eventRes.json();
                if (Array.isArray(event.recurrence) && event.recurrence.length > 0) {
                  const until = new Date(new Date(booking.start_time).getTime() - 1000);
                  const u = until;
                  const untilStr = `${u.getUTCFullYear()}${String(u.getUTCMonth() + 1).padStart(2, '0')}${String(u.getUTCDate()).padStart(2, '0')}T${String(u.getUTCHours()).padStart(2, '0')}${String(u.getUTCMinutes()).padStart(2, '0')}${String(u.getUTCSeconds()).padStart(2, '0')}Z`;
                  const newRecurrence = event.recurrence.map((rule: string) => {
                    if (!rule.startsWith('RRULE:')) return rule;
                    let r = rule
                      .replace(/(^RRULE:|;)COUNT=\d+(?=;|$)/g, (m) => m.startsWith('RRULE:') ? 'RRULE:' : '')
                      .replace(/(^RRULE:|;)UNTIL=[^;]+(?=;|$)/g, (m) => m.startsWith('RRULE:') ? 'RRULE:' : '');
                    r = r.replace(/RRULE:;/, 'RRULE:').replace(/;;+/g, ';').replace(/;$/, '');
                    return r + ';UNTIL=' + untilStr;
                  });
                  await fetch(`${calendarUrl}?sendUpdates=all`, {
                    method: 'PATCH',
                    headers: authHeaders,
                    body: JSON.stringify({ recurrence: newRecurrence }),
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to update/delete calendar event:', err);
        }
      }
    }

    // Series + scope='following': cancel every later sibling in our DB so the
    // practitioner's session list reflects the same state Google will show.
    //
    // Prefer matching by `series_position` (1-indexed sequence number)
    // rather than `start_time` / `scheduled_at`. A session can be
    // independently edited via "Edit session" — its scheduled_at moves
    // but the series_position stays. The position-based predicate
    // catches those edited rows; the timestamp-based one used to miss
    // them, leaving sessions "scheduled" after the booking was cancelled.
    if (status === 'cancelled' && booking.series_id && seriesScope === 'following') {
      try {
        let cancelBookings = adminSupabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: 'practitioner',
            updated_at: new Date().toISOString(),
          })
          .eq('series_id', booking.series_id)
          .neq('id', booking.id)
          .neq('status', 'cancelled');
        if (typeof booking.series_position === 'number') {
          cancelBookings = cancelBookings.gte('series_position', booking.series_position);
        } else {
          cancelBookings = cancelBookings.gte('start_time', booking.start_time);
        }
        await cancelBookings;

        let cancelSessions = adminSupabase
          .from('sessions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('practitioner_id', booking.practitioner_id)
          .eq('series_id', booking.series_id)
          .in('status', ['scheduled', 'confirmed']);
        if (typeof booking.series_position === 'number') {
          cancelSessions = cancelSessions.gte('series_position', booking.series_position);
        } else {
          cancelSessions = cancelSessions.gte('scheduled_at', booking.start_time);
        }
        await cancelSessions;
      } catch (err) {
        console.warn('Could not cancel following series rows:', err);
      }
    }

    // When a booking is cancelled, also cancel the matching session so the
    // member's Sessions tab stays in sync. Match by practitioner + start time.
    if (status === 'cancelled') {
      try {
        let sessionQuery = adminSupabase
          .from('sessions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('practitioner_id', booking.practitioner_id)
          .eq('scheduled_at', booking.start_time)
          .in('status', ['scheduled', 'confirmed'])
        if (booking.member_id) {
          sessionQuery = sessionQuery.eq('member_id', booking.member_id)
        }
        await sessionQuery
      } catch (err) {
        console.warn('Could not cancel matching session:', err)
      }
    }

    // No Bloomsline confirmation emails — Google Calendar handles it:
    // The event created above with sendUpdates=all sends an invitation
    // to both the patient and the practitioner with the correct title,
    // time, Google Meet link, and event description.

    return NextResponse.json({
      booking: updatedBooking,
      calendarSynced,
      calendarError,
      sessionCreated,
    });
  } catch (err) {
    console.error('Booking update error:', err);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('practitioner_id', user.id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('Get booking error:', err);
    return NextResponse.json(
      { error: 'Failed to get booking' },
      { status: 500 }
    );
  }
}
