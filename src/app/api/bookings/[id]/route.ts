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

// PATCH /api/bookings/[id] - Update booking status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // If approving (confirming), sync to Google Calendar
    let calendarSynced = false;
    let calendarError: string | null = null;

    if (status === 'confirmed' && booking.status === 'pending') {
      console.log('Booking approved, syncing to Google Calendar...');
      const accessToken = await getAccessTokenForUser(user.id, adminSupabase);

      if (!accessToken) {
        calendarError = 'Google Calendar not connected';
      } else {
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
                { method: 'email', minutes: 1440 },
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
            calendarSynced = true;

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
    if (status === 'cancelled' && booking.google_event_id) {
      const accessToken = await getAccessTokenForUser(user.id, adminSupabase);
      if (accessToken) {
        try {
          const { data: connection } = await adminSupabase
            .from('calendar_connections')
            .select('calendar_id')
            .eq('user_id', user.id)
            .single();

          const calendarId = connection?.calendar_id || 'primary';

          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${booking.google_event_id}?sendUpdates=all`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log('Google Calendar event deleted');
        } catch (err) {
          console.error('Failed to delete calendar event:', err);
        }
      }
    }

    return NextResponse.json({
      booking: updatedBooking,
      calendarSynced,
      calendarError,
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
