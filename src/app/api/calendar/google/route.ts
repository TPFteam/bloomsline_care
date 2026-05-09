import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Cookie name + TTL for the OAuth CSRF state. Short TTL because the round
// trip to Google is normally a few seconds; 5 minutes is generous.
const STATE_COOKIE = 'bloom_oauth_state';
const STATE_TTL_SECONDS = 60 * 5;

// GET /api/calendar/google - Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.auth);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // CSRF protection: generate a random state, send it in the auth URL,
  // and store the same value in an httpOnly cookie so the callback can
  // confirm the request is the one we initiated. Without this, an
  // attacker who can craft a callback URL could attach their Google
  // account to the victim's authenticated Bloomsline session.
  const state = crypto.randomUUID();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
  authUrl.searchParams.set('state', state);

  const response = NextResponse.json({ url: authUrl.toString() });
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // OAuth redirect is cross-site; 'strict' would drop the cookie
    maxAge: STATE_TTL_SECONDS,
    path: '/api/calendar',
  });
  return response;
}
