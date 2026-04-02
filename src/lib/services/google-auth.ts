import { decryptToken, encryptToken, isEncrypted } from '@/lib/security/encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET!;

export interface GoogleAuthResult {
  accessToken: string;
  calendarId: string;
}

/**
 * Get a valid Google access token for a user.
 * Handles decryption, token refresh, and re-encryption.
 * Works with both admin and server supabase clients.
 */
export async function getValidGoogleToken(
  userId: string,
  supabase: { from: (table: string) => any }
): Promise<GoogleAuthResult | null> {
  console.log('=== getValidGoogleToken called for user:', userId, '===');

  const { data: connection, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  console.log('Calendar connection query result:', { found: !!connection, error: error?.message || null });

  if (error || !connection) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);
  const calendarId = connection.calendar_id || 'primary';

  // Decrypt the stored access token
  let accessToken: string | null = null;
  try {
    accessToken = isEncrypted(connection.access_token)
      ? decryptToken(connection.access_token)
      : connection.access_token;
  } catch {
    console.warn('Failed to decrypt access token, will try refresh');
  }

  // If token is still valid and decrypted, return it
  if (accessToken && expiresAt > now) {
    return { accessToken, calendarId };
  }

  // Token expired or decrypt failed, refresh it
  console.log('Google token expired/invalid, attempting refresh for user:', userId);
  if (!connection.refresh_token) {
    console.error('No refresh token available for user:', userId);
    return null;
  }

  // Decrypt refresh token — try decryption, fall back to raw value
  let refreshToken: string;
  try {
    refreshToken = isEncrypted(connection.refresh_token)
      ? decryptToken(connection.refresh_token)
      : connection.refresh_token;
    console.log('Refresh token decrypted successfully, length:', refreshToken.length);
  } catch {
    // If decrypt fails, try using the raw value (might not be encrypted)
    console.warn('Failed to decrypt refresh token, trying raw value');
    refreshToken = connection.refresh_token;
  }

  try {
    console.log('Refreshing token with client_id:', GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
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
      const errBody = await tokenResponse.text().catch(() => '');
      console.error('Failed to refresh Google token:', tokenResponse.status, errBody);
      return null;
    }

    const tokens = await tokenResponse.json();

    // Encrypt and store the new token
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

    return { accessToken: tokens.access_token, calendarId };
  } catch (err) {
    console.error('Token refresh error:', err);
    return null;
  }
}
