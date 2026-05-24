import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import type { CreateBookingInput, GoogleCalendarEvent } from '@/types/calendar';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { buildCalendarEvent, getPractitionerName, getPractitionerAddress } from '@/lib/services/calendar-event';
import { postGoogleEvent } from '@/lib/services/google-event-create';
import { waitUntil } from '@vercel/functions';

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

    // Auto-link or create member
    let memberId = body.member_id || null;

    if (!memberId && body.client_email) {
      // Check if email matches an existing member for this practitioner
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('practitioner_id', body.practitioner_id)
        .ilike('email', body.client_email.trim())
        .maybeSingle();

      if (existingMember) {
        memberId = existingMember.id;
      } else {
        // Create a new prospect member
        const nameParts = body.client_name.trim().split(' ');
        const firstName = nameParts[0] || body.client_name;
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newMember } = await supabase
          .from('members')
          .insert({
            practitioner_id: body.practitioner_id,
            first_name: firstName,
            last_name: lastName,
            email: body.client_email.trim(),
            phone: body.client_phone || null,
            status: 'prospect',
            engagement_level: 'medium',
          })
          .select('id')
          .maybeSingle();

        if (newMember) {
          memberId = newMember.id;
        }
      }
    }

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
        session_format: body.session_format || 'video',
        status: bookingStatus,
        member_id: memberId,
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

    // Backdated booking: skip notifications and confirmation emails — already happened
    const isBackdated = new Date(body.start_time).getTime() < Date.now();

    // Practitioner profile — needed for locale-aware emails + calendar event titles
    const { data: practitionerProfile } = await supabase
      .from('users')
      .select('preferred_language, full_name')
      .eq('id', body.practitioner_id)
      .single();
    const practitionerLocale = (practitionerProfile?.preferred_language as 'en' | 'fr' | 'es') || 'en';
    const practitionerName = await getPractitionerName(body.practitioner_id, supabase);

    // Send notification + email to practitioner about new booking request
    if (!isBackdated) try {

      // Format the requested time in the practitioner's locale and timezone
      const { data: schedTz } = await supabase
        .from('availability_schedules')
        .select('timezone')
        .eq('user_id', body.practitioner_id)
        .limit(1)
        .maybeSingle();
      const practTz = schedTz?.timezone || body.timezone || 'Europe/Paris';
      const formattedTime = new Date(body.start_time).toLocaleString(
        practitionerLocale === 'fr' ? 'fr-FR' : practitionerLocale === 'es' ? 'es-ES' : 'en-US',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: practTz }
      );

      const metadata = {
        bookingId: booking.id,
        clientName: body.client_name,
        clientEmail: body.client_email,
        sessionType: sessionType.name,
        requestedTime: formattedTime,
        notes: body.notes,
      };

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

      // Send email via Postmark — use waitUntil so the response is sent
      // immediately but the function stays alive to complete the email.
      // Previously fire-and-forget which got killed by the serverless runtime.
      waitUntil((async () => {
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
      })());
    } catch (notifyError) {
      console.error('Error sending booking notification:', notifyError);
      // Don't fail the booking if notification fails
    }

    // No Bloomsline confirmation email to patient — Google Calendar
    // handles it via sendUpdates=all when the event is created below.
    // The practitioner notification email above (booking_request) is
    // kept because pending bookings don't create Google events yet.

    // If confirmed (no approval needed), create Google Calendar event
    // Backdated bookings: skip calendar sync entirely (historical record only)
    let calendarSynced = false;
    let calendarError: string | null = null;

    if (bookingStatus === 'confirmed' && !isBackdated) {
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

          const practAddr = await getPractitionerAddress(body.practitioner_id, supabase);
          const { data: titleSettings } = await supabase
            .from('booking_settings')
            .select('calendar_event_title_template, calendar_email_reminder_enabled')
            .eq('user_id', body.practitioner_id)
            .maybeSingle();
          const titleTemplate = (titleSettings as { calendar_event_title_template?: string | null } | null)?.calendar_event_title_template ?? null;
          const calendarEmailReminder = (titleSettings as { calendar_email_reminder_enabled?: boolean } | null)?.calendar_email_reminder_enabled ?? false;
          const calendarEvent = buildCalendarEvent({
            bookingId: booking.id,
            practitionerName,
            clientName: body.client_name,
            clientEmail: body.client_email,
            clientPhone: body.client_phone,
            sessionTypeName: sessionType.name,
            sessionFormat: body.session_format,
            startTime: body.start_time,
            endTime: body.end_time,
            timezone: eventTimezone,
            notes: body.notes,
            locale: practitionerLocale,
            practitionerAddress: practAddr.address,
            practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
            titleTemplate,
            calendarEmailReminder,
          });

          const isVideo = (body.session_format || 'video') === 'video';
          const result = await postGoogleEvent({
            accessToken: googleAuth.accessToken,
            calendarId: googleAuth.calendarId,
            payload: calendarEvent,
            sessionFormat: body.session_format || 'video',
          });

          if (result.ok) {
            const event = result.event;
            calendarSynced = true;

            await supabase
              .from('bookings')
              .update({
                google_event_id: event.id,
                meet_link: isVideo ? (event.hangoutLink || null) : null,
              })
              .eq('id', booking.id);

            await supabase
              .from('calendar_connections')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('user_id', body.practitioner_id);
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
