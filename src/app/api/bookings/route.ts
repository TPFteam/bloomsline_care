import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import type { CreateBookingInput, GoogleCalendarEvent } from '@/types/calendar';
import { notifyBookingRequest } from '@/lib/notifications';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Helper to get valid access token for a specific user
async function getAccessTokenForUser(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  console.log('Looking up calendar connection for user_id:', userId);

  const { data: connection, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error) {
    console.log('Error fetching calendar connection:', error.message, error.code);
    return null;
  }

  if (!connection) {
    console.log('No calendar connection found for user');
    return null;
  }

  console.log('Found calendar connection:', {
    id: connection.id,
    provider_email: connection.provider_email,
    has_access_token: !!connection.access_token,
    has_refresh_token: !!connection.refresh_token,
    token_expires_at: connection.token_expires_at,
  });

  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  console.log('Token expiry check:', {
    now: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isExpired: expiresAt <= now,
  });

  // If token is still valid, return it
  if (expiresAt > now) {
    console.log('Access token is still valid, returning it');
    return connection.access_token;
  }

  // Token expired, refresh it
  console.log('Access token expired, attempting refresh...');
  if (!connection.refresh_token) {
    console.log('No refresh token available');
    return null;
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errorText);
      return null;
    }

    const tokens = await tokenResponse.json();
    console.log('Token refresh successful, got new access token');

    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokens.expires_in);

    await supabase
      .from('calendar_connections')
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', connection.id);

    return tokens.access_token;
  } catch (err) {
    console.error('Error during token refresh:', err);
    return null;
  }
}

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
      console.log('Booking confirmed, attempting Google Calendar sync...');
      const accessToken = await getAccessTokenForUser(body.practitioner_id, supabase);

      if (!accessToken) {
        console.log('No access token found - practitioner may not have connected Google Calendar');
        calendarError = 'Google Calendar not connected';
      } else {
        try {
          const calendarEvent: GoogleCalendarEvent = {
            summary: `Session with ${body.client_name}`,
            description: `Session Type: ${sessionType.name}\n\nClient: ${body.client_name}\nEmail: ${body.client_email}${body.client_phone ? `\nPhone: ${body.client_phone}` : ''}${body.notes ? `\n\nNotes: ${body.notes}` : ''}`,
            start: {
              dateTime: body.start_time,
              timeZone: body.timezone,
            },
            end: {
              dateTime: body.end_time,
              timeZone: body.timezone,
            },
            attendees: [
              { email: body.client_email, displayName: body.client_name },
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 1440 }, // 24 hours
                { method: 'popup', minutes: 30 },
              ],
            },
          };

          // Get calendar ID
          const { data: connection } = await supabase
            .from('calendar_connections')
            .select('calendar_id')
            .eq('user_id', body.practitioner_id)
            .single();

          const calendarId = connection?.calendar_id || 'primary';
          console.log('Creating Google Calendar event on calendar:', calendarId);

          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(calendarEvent),
            }
          );

          if (response.ok) {
            const event = await response.json();
            console.log('Google Calendar event created:', event.id);
            calendarSynced = true;

            // Update booking with Google event ID
            await supabase
              .from('bookings')
              .update({ google_event_id: event.id })
              .eq('id', booking.id);

            // Update last_synced_at
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
          // Log but don't fail the booking if calendar sync fails
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
