import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Helper to get valid access token for a specific user
async function getAccessTokenForUser(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const { data: connection, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !connection) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  // If token is still valid, return it
  if (expiresAt > now) {
    return connection.access_token;
  }

  // Token expired, refresh it
  if (!connection.refresh_token) {
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
      return null;
    }

    const tokens = await tokenResponse.json();
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
  } catch {
    return null;
  }
}

// POST /api/bookings/[id]/sync-calendar - Sync a booking to Google Calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client for queries
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

    // Only sync confirmed bookings
    if (booking.status !== 'confirmed') {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: 'Booking must be confirmed to sync to calendar',
      });
    }

    // Check if already synced
    if (booking.google_event_id) {
      return NextResponse.json({
        calendarSynced: true,
        calendarError: null,
        message: 'Already synced',
      });
    }

    // Get access token
    const accessToken = await getAccessTokenForUser(user.id, adminSupabase);

    if (!accessToken) {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: 'Google Calendar not connected',
      });
    }

    try {
      // Get session type name from booking settings
      const { data: settings } = await adminSupabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', user.id)
        .single();

      const sessionTypes = settings?.session_types as Array<{ id: string; name: string }> || [];
      const sessionType = sessionTypes.find(st => st.id === booking.session_type);
      const sessionTypeName = sessionType?.name || booking.session_type;

      const calendarEvent: GoogleCalendarEvent = {
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
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 hours before
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      // Get calendar ID
      const { data: connection } = await adminSupabase
        .from('calendar_connections')
        .select('calendar_id')
        .eq('user_id', user.id)
        .single();

      const calendarId = connection?.calendar_id || 'primary';

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

        // Update booking with Google event ID
        await adminSupabase
          .from('bookings')
          .update({ google_event_id: event.id })
          .eq('id', id);

        // Update last_synced_at
        await adminSupabase
          .from('calendar_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return NextResponse.json({
          calendarSynced: true,
          calendarError: null,
          eventId: event.id,
        });
      } else {
        const errorData = await response.json();
        console.error('Google Calendar API error:', response.status, errorData);
        return NextResponse.json({
          calendarSynced: false,
          calendarError: errorData.error?.message || 'Failed to create calendar event',
        });
      }
    } catch (err) {
      console.error('Failed to create calendar event:', err);
      return NextResponse.json({
        calendarSynced: false,
        calendarError: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  } catch (err) {
    console.error('Calendar sync error:', err);
    return NextResponse.json(
      { error: 'Failed to sync to calendar' },
      { status: 500 }
    );
  }
}
