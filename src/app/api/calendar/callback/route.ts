import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/security/rate-limit';
import { encryptToken } from '@/lib/security/encryption';
import { registerCalendarWatch } from '@/lib/services/calendar-watch';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;

// GET /api/calendar/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.auth);
  if (!rateLimitResult.success) {
    return NextResponse.redirect(
      new URL('/bookings?tab=settings&calendar_error=rate_limited', request.url)
    );
  }
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateFromUrl = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/bookings?tab=settings&calendar_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/bookings?tab=settings&calendar_error=no_code', request.url)
    );
  }

  // CSRF check: the `state` value in the URL must match the value we set
  // as an httpOnly cookie when initiating the flow at /api/calendar/google.
  // A missing cookie or mismatch means this callback wasn't initiated by
  // this browser session — likely an attacker trying to attach their own
  // Google account to the victim's Bloomsline session.
  const stateFromCookie = request.cookies.get('bloom_oauth_state')?.value;
  if (!stateFromUrl || !stateFromCookie || stateFromUrl !== stateFromCookie) {
    const redirect = NextResponse.redirect(
      new URL('/bookings?tab=settings&calendar_error=invalid_state', request.url)
    );
    // Clear the (now-suspect) cookie so the next attempt starts clean.
    redirect.cookies.delete('bloom_oauth_state');
    return redirect;
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/bookings?tab=settings&calendar_error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get user email from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();

    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/sign-in?redirect=/bookings', request.url)
      );
    }

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null;

    // Save calendar connection to database
    const { error: dbError } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: user.id,
        provider: 'google',
        provider_email: userInfo.email,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt.toISOString(),
        calendar_id: 'primary',
        sync_enabled: true,
        sync_status: 'active',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (dbError) {
      console.error('Failed to save calendar connection:', dbError);
      return NextResponse.redirect(
        new URL('/bookings?tab=settings&calendar_error=save_failed', request.url)
      );
    }

    // Register a Google push-notification (watch) channel so changes made
    // directly inside Google Calendar reconcile back into our DB. Failure here
    // is non-fatal — the connection still works, just without two-way sync.
    try {
      const adminClient = createAdminClient();
      await registerCalendarWatch(
        { userId: user.id, accessToken: tokens.access_token, calendarId: 'primary' },
        adminClient,
      );
    } catch (watchErr) {
      console.warn('[calendar-callback] watch registration failed (non-fatal):', watchErr);
    }

    const redirect = NextResponse.redirect(
      new URL('/bookings?tab=settings&calendar_connected=true', request.url)
    );
    // Burn the state cookie so a captured callback URL can't be replayed.
    redirect.cookies.delete('bloom_oauth_state');
    return redirect;
  } catch (err) {
    console.error('Calendar callback error:', err);
    return NextResponse.redirect(
      new URL('/bookings?tab=settings&calendar_error=unknown', request.url)
    );
  }
}
