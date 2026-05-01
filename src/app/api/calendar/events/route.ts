import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';

// GET /api/calendar/events - Fetch Google Calendar events for a date range
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 });
  }

  const googleAuth = await getValidGoogleToken(user.id, supabase);
  if (!googleAuth) {
    return NextResponse.json({ events: [], connected: false });
  }

  try {
    const calendarId = encodeURIComponent(googleAuth.calendarId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      `timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&` +
      `singleEvents=true&orderBy=startTime&maxResults=200`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${googleAuth.accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json({ events: [], connected: true, error: 'fetch_failed' });
    }

    const data = await res.json();
    const items = (data.items || []).filter((e: any) => e.status !== 'cancelled' && e.start?.dateTime);
    const events = items.map((e: any) => ({
      id: e.id,
      title: e.summary || '(No title)',
      start: e.start.dateTime,
      end: e.end.dateTime,
      meetLink: e.hangoutLink || null,
    }));

    // Backfill meet_link for existing bookings that have a google_event_id but no meet_link
    const meetLinks = items
      .filter((e: any) => e.hangoutLink)
      .map((e: any) => ({ id: e.id, link: e.hangoutLink }));
    if (meetLinks.length > 0) {
      const googleIds = meetLinks.map((m: any) => m.id);
      const { data: bookingsToUpdate } = await supabase
        .from('bookings')
        .select('id, google_event_id')
        .in('google_event_id', googleIds)
        .is('meet_link', null);
      if (bookingsToUpdate?.length) {
        const linkMap = Object.fromEntries(meetLinks.map((m: any) => [m.id, m.link]));
        await Promise.all(
          bookingsToUpdate.map((b: any) =>
            supabase.from('bookings').update({ meet_link: linkMap[b.google_event_id] }).eq('id', b.id)
          )
        );
      }
    }

    return NextResponse.json({ events, connected: true });
  } catch (err) {
    console.error('Fetch calendar events error:', err);
    return NextResponse.json({ events: [], connected: true, error: 'fetch_failed' });
  }
}

// POST /api/calendar/events - Create calendar event
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const googleAuth = await getValidGoogleToken(user.id, supabase);

  if (!googleAuth) {
    return NextResponse.json(
      { error: 'Calendar not connected or token expired' },
      { status: 400 }
    );
  }

  try {
    const body: GoogleCalendarEvent = await request.json();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAuth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to create event:', errorData);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      );
    }

    const event = await response.json();

    // Update last_synced_at
    await supabase
      .from('calendar_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return NextResponse.json(event);
  } catch (err) {
    console.error('Create event error:', err);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events?eventId=xxx - Delete calendar event
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  const googleAuth = await getValidGoogleToken(user.id, supabase);

  if (!googleAuth) {
    return NextResponse.json(
      { error: 'Calendar not connected or token expired' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${googleAuth.accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorData = await response.text();
      console.error('Failed to delete event:', errorData);
      return NextResponse.json(
        { error: 'Failed to delete calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete event error:', err);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// PATCH /api/calendar/events?eventId=xxx - Update calendar event
export async function PATCH(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  const googleAuth = await getValidGoogleToken(user.id, supabase);

  if (!googleAuth) {
    return NextResponse.json(
      { error: 'Calendar not connected or token expired' },
      { status: 400 }
    );
  }

  try {
    const body: Partial<GoogleCalendarEvent> = await request.json();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${googleAuth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to update event:', errorData);
      return NextResponse.json(
        { error: 'Failed to update calendar event' },
        { status: 500 }
      );
    }

    const event = await response.json();

    return NextResponse.json(event);
  } catch (err) {
    console.error('Update event error:', err);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}
