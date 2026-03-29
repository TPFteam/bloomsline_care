import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import type { CreateBookingInput, GoogleCalendarEvent } from '@/types/calendar';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';

// POST /api/bookings - Create a new booking (public)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public booking endpoint
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.public)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many booking requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const body: CreateBookingInput = await request.json();

    // Validate required fields
    if (
      !body.practitioner_id ||
      !body.session_type ||
      !body.start_time ||
      !body.end_time ||
      !body.timezone ||
      !body.client_name ||
      !body.client_email
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for public booking
    const supabase = createAdminClient();

    // Get booking settings to check if approval is required
    const { data: settings } = await supabase
      .from('booking_settings')
      .select('require_approval, booking_page_enabled, session_types')
      .eq('user_id', body.practitioner_id)
      .single();

    if (!settings?.booking_page_enabled) {
      return NextResponse.json(
        { error: 'Booking is not enabled for this practitioner' },
        { status: 400 }
      );
    }

    // Verify the session type exists
    const sessionTypes = settings.session_types as Array<{ id: string; name: string; duration: number }>;
    const sessionType = sessionTypes?.find((st) => st.id === body.session_type);

    if (!sessionType) {
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 400 }
      );
    }

    // Create the booking
    const bookingStatus = settings.require_approval ? 'pending' : 'confirmed';

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        practitioner_id: body.practitioner_id,
        session_type: body.session_type,
        start_time: body.start_time,
        end_time: body.end_time,
        timezone: body.timezone,
        client_name: body.client_name,
        client_email: body.client_email,
        client_phone: body.client_phone || null,
        notes: body.notes || null,
        status: bookingStatus,
        member_id: body.member_id || null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Failed to create booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Send notification + email to practitioner about new booking request
    try {
      const metadata = {
        bookingId: booking.id,
        clientName: body.client_name,
        clientEmail: body.client_email,
        sessionType: sessionType.name,
        requestedTime: body.start_time,
        notes: body.notes,
      };

      // Look up practitioner's preferred language
      const { data: practitionerProfile } = await supabase
        .from('users')
        .select('preferred_language')
        .eq('id', body.practitioner_id)
        .single();
      const practitionerLocale = (practitionerProfile?.preferred_language as 'en' | 'fr' | 'es') || 'en';

      const content = getNotificationContent('booking_request', metadata, practitionerLocale);

      // Create notification record
      await supabase.from('notifications').insert({
        user_id: body.practitioner_id,
        user_type: 'practitioner',
        type: 'booking_request',
        title: content.title,
        body: content.body,
        entity_type: 'booking',
        entity_id: booking.id,
        metadata,
        action_url: content.actionUrl,
      });

      // Send email via Postmark (fire-and-forget)
      ;(async () => {
        try {
          const { data: { user: practitionerUser } } = await supabase.auth.admin.getUserById(body.practitioner_id);
          const practitionerEmail = practitionerUser?.email;
          if (!practitionerEmail) return;

          const emailContent = getEmailContent('booking_request', metadata, practitionerLocale);
          const htmlBody = generateEmailHtml({
            subject: content.emailSubject,
            body: content.body,
            actionUrl: content.actionUrl,
            actionText: emailContent.actionText,
          });

          await sendEmail({
            to: practitionerEmail,
            subject: content.emailSubject,
            htmlBody,
            tag: 'booking_request',
          });
        } catch (emailError) {
          console.error('Error sending booking email:', emailError);
        }
      })();
    } catch (notifyError) {
      console.error('Error sending booking notification:', notifyError);
      // Don't fail the booking if notification fails
    }

    // If confirmed (no approval needed), send confirmation email to client with .ics
    if (bookingStatus === 'confirmed' && body.client_email) {
      ;(async () => {
        try {
          const scheduledAt = new Date(body.start_time).toLocaleString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
          });

          const confirmMetadata = {
            bookingId: booking.id,
            sessionType: sessionType.name,
            scheduledAt,
            clientName: body.client_name,
          };

          const confirmContent = getNotificationContent('booking_confirmed', confirmMetadata, 'en');
          const confirmEmailContent = getEmailContent('booking_confirmed', confirmMetadata, 'en');
          const patientAppUrl = process.env.NEXT_PUBLIC_PATIENT_APP_URL || 'https://app.bloomsline.com';
          const confirmHtmlBody = generateEmailHtml({
            subject: confirmContent.emailSubject,
            body: confirmContent.body,
            actionUrl: `${patientAppUrl}/practitioner`,
            actionText: confirmEmailContent.actionText,
          });

          const calendarAttachment = generateCalendarAttachment({
            uid: booking.id,
            summary: `${sessionType.name} — Bloomsline Care`,
            startTime: body.start_time,
            endTime: body.end_time,
            description: `Your ${sessionType.name} session with your practitioner`,
            attendeeEmail: body.client_email,
            attendeeName: body.client_name,
          });

          await sendEmail({
            to: body.client_email,
            subject: confirmContent.emailSubject,
            htmlBody: confirmHtmlBody,
            tag: 'booking_confirmed',
            attachments: [calendarAttachment],
          });
        } catch (emailError) {
          console.error('Error sending booking confirmation email to client:', emailError);
        }
      })();
    }

    // If confirmed (no approval needed), create Google Calendar event
    let calendarSynced = false;
    let calendarError: string | null = null;

    if (bookingStatus === 'confirmed') {
      const googleAuth = await getValidGoogleToken(body.practitioner_id, supabase);

      if (!googleAuth) {
        calendarError = 'Google Calendar not connected';
      } else {
        try {
          // Use practitioner's timezone for the calendar event display
          const { data: scheduleData } = await supabase
            .from('availability_schedules')
            .select('timezone')
            .eq('user_id', body.practitioner_id)
            .limit(1)
            .single();
          const eventTimezone = scheduleData?.timezone || body.timezone;

          const calendarEvent: GoogleCalendarEvent = {
            summary: `Session with ${body.client_name}`,
            description: `Session Type: ${sessionType.name}\n\nClient: ${body.client_name}\nEmail: ${body.client_email}${body.client_phone ? `\nPhone: ${body.client_phone}` : ''}${body.notes ? `\n\nNotes: ${body.notes}` : ''}`,
            start: {
              dateTime: body.start_time,
              timeZone: eventTimezone,
            },
            end: {
              dateTime: body.end_time,
              timeZone: eventTimezone,
            },
            attendees: [
              { email: body.client_email, displayName: body.client_name },
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 1440 },
                { method: 'popup', minutes: 30 },
              ],
            },
          };

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events?sendUpdates=all`,
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

            await supabase
              .from('bookings')
              .update({ google_event_id: event.id })
              .eq('id', booking.id);

            await supabase
              .from('calendar_connections')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('user_id', body.practitioner_id);
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

    return NextResponse.json({
      booking,
      message: bookingStatus === 'pending'
        ? 'Booking request submitted. Awaiting confirmation.'
        : 'Booking confirmed!',
      calendarSynced,
      calendarError,
    });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json(
      { error: 'Failed to process booking' },
      { status: 500 }
    );
  }
}
