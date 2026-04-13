import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';

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

          const calendarEvent = {
            summary: `Session with ${booking.client_name}`,
            description: `Session Type: ${sessionTypeName}\n\nClient: ${booking.client_name}\nEmail: ${booking.client_email}${booking.client_phone ? `\nPhone: ${booking.client_phone}` : ''}${booking.notes ? `\n\nNotes: ${booking.notes}` : ''}`,
            start: {
              dateTime: booking.start_time,
              timeZone: booking.timezone,
            },
            end: {
              dateTime: booking.end_time,
              timeZone: booking.timezone,
            },
            attendees: [
              { email: booking.client_email, displayName: booking.client_name },
            ],
            conferenceData: {
              createRequest: {
                requestId: `bloomsline-${booking.id}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 1440 },
                { method: 'popup', minutes: 30 },
              ],
            },
          };

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
              .update({ google_event_id: event.id })
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

    // If cancelling and there's a Google event, delete it
    // Backdated bookings: skip calendar deletion entirely (historical record only)
    if (status === 'cancelled' && booking.google_event_id && !isBackdatedBooking) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (googleAuth) {
        try {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}?sendUpdates=all`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${googleAuth.accessToken}`,
              },
            }
          );
        } catch (err) {
          console.error('Failed to delete calendar event:', err);
        }
      }
    }

    // Send confirmation email to client when booking is approved
    // Skip for backdated bookings — the session already happened
    if (status === 'confirmed' && booking.status === 'pending' && booking.client_email && !isBackdatedBooking) {
      ;(async () => {
        try {
          const { data: settings } = await adminSupabase
            .from('booking_settings')
            .select('session_types')
            .eq('user_id', user.id)
            .single();

          const sessionTypes = settings?.session_types as Array<{ id: string; name: string }> || [];
          const sessionType = sessionTypes.find(st => st.id === booking.session_type);
          const sessionTypeName = sessionType?.name || booking.session_type;

          const scheduledAt = new Date(booking.start_time).toLocaleString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
          });

          const metadata = {
            bookingId: booking.id,
            sessionType: sessionTypeName,
            scheduledAt,
            clientName: booking.client_name,
          };

          const content = getNotificationContent('booking_confirmed', metadata, 'en');
          const emailContent = getEmailContent('booking_confirmed', metadata, 'en');
          const patientAppUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL || 'https://app.bloomsline.com';
          const htmlBody = generateEmailHtml({
            subject: content.emailSubject,
            body: content.body,
            actionUrl: `${patientAppUrl}/practitioner`,
            actionText: emailContent.actionText,
          });

          const calendarAttachment = generateCalendarAttachment({
            uid: booking.id,
            summary: `${sessionTypeName} — Bloomsline Care`,
            startTime: booking.start_time,
            endTime: booking.end_time,
            description: `Your ${sessionTypeName} session with your practitioner`,
            attendeeEmail: booking.client_email,
            attendeeName: booking.client_name,
          });

          await sendEmail({
            to: booking.client_email,
            subject: content.emailSubject,
            htmlBody,
            tag: 'booking_confirmed',
            attachments: [calendarAttachment],
          });
          // Also send .ics confirmation to the practitioner
          if (user.email) {
            const practitionerCalendarAttachment = generateCalendarAttachment({
              uid: booking.id,
              summary: `${sessionTypeName} — ${booking.client_name}`,
              startTime: booking.start_time,
              endTime: booking.end_time,
              description: `${sessionTypeName} with ${booking.client_name}\nEmail: ${booking.client_email}${booking.client_phone ? `\nPhone: ${booking.client_phone}` : ''}`,
              attendeeEmail: booking.client_email,
              attendeeName: booking.client_name,
              organizerEmail: user.email,
            });

            const practitionerHtmlBody = generateEmailHtml({
              subject: `Booking confirmed: ${sessionTypeName} with ${booking.client_name}`,
              body: `Your ${sessionTypeName} with ${booking.client_name} is confirmed for ${scheduledAt}.`,
              actionUrl: `/bookings`,
              actionText: 'View Bookings',
            });

            await sendEmail({
              to: user.email,
              subject: `Booking confirmed: ${sessionTypeName} with ${booking.client_name}`,
              htmlBody: practitionerHtmlBody,
              tag: 'booking_confirmed_practitioner',
              attachments: [practitionerCalendarAttachment],
            });
          }
        } catch (emailError) {
          console.error('Error sending booking confirmation email:', emailError);
        }
      })();
    }

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
