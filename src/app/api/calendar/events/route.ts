import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { decryptToken, encryptToken, isEncrypted } from '@/lib/security/encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Helper to refresh access token if expired
async function getValidAccessToken(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
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

  // Decrypt the stored access token
  let accessToken: string;
  try {
    accessToken = isEncrypted(connection.access_token)
      ? decryptToken(connection.access_token)
      : connection.access_token; // Handle legacy unencrypted tokens
  } catch {
    console.error('Failed to decrypt access token');
    return null;
  }

  // If token is still valid, return it
  if (expiresAt > now) {
    return accessToken;
  }

  // Token expired, refresh it
  if (!connection.refresh_token) {
    return null;
  }

  // Decrypt refresh token
  let refreshToken: string;
  try {
    refreshToken = isEncrypted(connection.refresh_token)
      ? decryptToken(connection.refresh_token)
      : connection.refresh_token;
  } catch {
    console.error('Failed to decrypt refresh token');
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
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to refresh token');
      return null;
    }

    const tokens = await tokenResponse.json();

    // Encrypt and update token in database
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokens.expires_in);

    const encryptedNewToken = encryptToken(tokens.access_token);

    await supabase
      .from('calendar_connections')
      .update({
        access_token: encryptedNewToken,
        token_expires_at: newExpiresAt.toISOString(),
      })
      .eq('id', connection.id);

    return tokens.access_token;
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
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

  const accessToken = await getValidAccessToken(user.id, supabase);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Calendar not connected or token expired' },
      { status: 400 }
    );
  }

  try {
    const body: GoogleCalendarEvent = await request.json();

    // Get calendar ID
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('calendar_id')
      .eq('user_id', user.id)
      .single();

    const calendarId = connection?.calendar_id || 'primary';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

  const accessToken = await getValidAccessToken(user.id, supabase);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Calendar not connected or token expired' },
      { status: 400 }
    );
  }

  try {
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('calendar_id')
      .eq('user_id', user.id)
      .single();

    const calendarId = connection?.calendar_id || 'primary';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

  const accessToken = await getValidAccessToken(user.id, supabase);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Calendar not connected or token expired' },
      { status: 400 }
    );
  }

  try {
    const body: Partial<GoogleCalendarEvent> = await request.json();

    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('calendar_id')
      .eq('user_id', user.id)
      .single();

    const calendarId = connection?.calendar_id || 'primary';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
