import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';
import { buildCalendarEvent, getPractitionerName } from '@/lib/services/calendar-event';

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
    const { status, practitioner_notes } = body;

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
            .select('session_types')
            .eq('user_id', user.id)
            .single();

          const sessionTypes = settings?.session_types as Array<{ id: string; name: string }> || [];
          const sessionType = sessionTypes.find(st => st.id === booking.session_type);
          const sessionTypeName = sessionType?.name || booking.session_type;

          // Get practitioner name (robust fallback) and locale
          const { data: practUser } = await adminSupabase.from('users').select('full_name, preferred_language, email, phone').eq('id', user.id).single();
          const practName = await getPractitionerName(user.id, adminSupabase);

          const calendarEvent = buildCalendarEvent({
            bookingId: booking.id,
            practitionerName: practName,
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            clientPhone: booking.client_phone,
            sessionTypeName,
            startTime: booking.start_time,
            endTime: booking.end_time,
            timezone: booking.timezone,
            notes: booking.notes,
            locale: practUser?.preferred_language || 'fr',
            practitionerEmail: practUser?.email,
            practitionerPhone: practUser?.phone,
          });

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events?sendUpdates=all&conferenceDataVersion=1`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${googleAuth.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(calendarEvent),
            }
          );

          if (response.ok) {
            const event = await response.json();
            calendarSynced = true;

            await adminSupabase
              .from('bookings')
              .update({ google_event_id: event.id, meet_link: event.hangoutLink || null })
              .eq('id', id);

            await adminSupabase
              .from('calendar_connections')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('user_id', user.id);
          } else {
            const errorData = await response.json();
            console.error('Google Calendar API error:', response.status, errorData);
            calendarError = errorData.error?.message || 'Failed to create calendar event';
          }
        } catch (err) {
          console.error('Failed to create calendar event:', err);
          calendarError = err instanceof Error ? err.message : 'Unknown error';
        }
      }
    }

    // If cancelling and there's a Google event:
    // 1. Update the event description with the cancellation reason (sendUpdates=none)
    // 2. Delete the event (sendUpdates=all) → Google sends the cancellation email
    //    which now includes the reason in the description.
    // No separate Bloomsline email — Google's notification is sufficient.
    // Backdated bookings: skip calendar deletion entirely (historical record only)
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
        } catch (err) {
          console.error('Failed to update/delete calendar event:', err);
        }
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
