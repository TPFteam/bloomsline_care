import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { getValidGoogleToken } from '@/lib/services/google-auth';

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

    // Backdated session: historical record only — never touch the calendar
    if (new Date(booking.start_time).getTime() < Date.now()) {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: null,
        message: 'Backdated session — calendar sync skipped',
      });
    }

    // Get access token
    const googleAuth = await getValidGoogleToken(user.id, adminSupabase);

    if (!googleAuth) {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: 'Google Calendar not connected',
      });
    }

    try {
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

      // Backdated session: create the event for the practitioner's historical record
      // but don't send Google Calendar invites to attendees
      const isBackdated = new Date(booking.start_time).getTime() < Date.now();
      const sendUpdates = isBackdated ? 'none' : 'all';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events?sendUpdates=${sendUpdates}`,
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

        await adminSupabase
          .from('bookings')
          .update({ google_event_id: event.id })
          .eq('id', id);

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
