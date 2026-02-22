import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { getValidGoogleToken } from '@/lib/services/google-auth';

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
