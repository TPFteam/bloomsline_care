import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import type { CreateBookingInput, GoogleCalendarEvent } from '@/types/calendar';
import { notifyBookingRequest } from '@/lib/notifications';
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

    // Send notification to practitioner about new booking request
    try {
      await notifyBookingRequest(supabase, {
        practitionerUserId: body.practitioner_id,
        bookingId: booking.id,
        clientName: body.client_name,
        clientEmail: body.client_email,
        sessionType: sessionType.name,
        requestedTime: body.start_time,
        notes: body.notes,
      });
    } catch (notifyError) {
      console.error('Error sending booking notification:', notifyError);
      // Don't fail the booking if notification fails
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
