/**
 * Google Calendar push-notification (watch) channel management.
 *
 * Google's API: https://developers.google.com/calendar/api/guides/push
 *
 * Flow:
 *   1. We call `events.watch` for the practitioner's calendar.
 *   2. Google replies with a `resourceId` and acknowledges our `id` (our channel UUID).
 *   3. Whenever the calendar changes, Google POSTs a tiny notification to our webhook
 *      URL with `X-Goog-Channel-ID` + `X-Goog-Resource-ID` headers (no body).
 *   4. The webhook looks up our `calendar_watch_channels` row, then calls `events.list`
 *      with `syncToken` to pull only the diffs.
 *
 * Channels expire after ~7 days. A cron job renews them ~24h before expiry.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const WEBHOOK_PATH = '/api/calendar/webhook'

interface RegisterArgs {
  userId: string
  accessToken: string
  calendarId: string
  /** Optional explicit base URL — defaults to NEXT_PUBLIC_APP_URL. Webhooks
   *  must be HTTPS and on a verified domain in the GCP console. */
  appUrl?: string
}

export interface WatchChannel {
  id: string
  channel_id: string
  resource_id: string
  expires_at: string
  sync_token: string | null
}

/**
 * Register a new watch channel. If one already exists for this user, stop
 * the old one first and replace it (Google permits multiple but we only
 * track one — keeping a single channel per practitioner avoids duplicate
 * webhooks).
 */
export async function registerCalendarWatch(
  args: RegisterArgs,
  supabase: SupabaseClient,
): Promise<WatchChannel | null> {
  const { userId, accessToken, calendarId } = args
  const appUrl = args.appUrl || process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl || !appUrl.startsWith('https://')) {
    // Google rejects http:// (except localhost via tunnel) — caller should ensure
    // a public HTTPS URL is configured. We fail soft so OAuth still completes.
    console.warn('[calendar-watch] NEXT_PUBLIC_APP_URL must be HTTPS to register webhooks; skipping.')
    return null
  }

  // Stop any prior channel for this user so we don't accumulate dead webhooks.
  const { data: existing } = await supabase
    .from('calendar_watch_channels')
    .select('id, channel_id, resource_id')
    .eq('user_id', userId)
    .eq('active', true)
  for (const row of existing || []) {
    await stopChannel({ channelId: row.channel_id, resourceId: row.resource_id, accessToken })
    await supabase
      .from('calendar_watch_channels')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', row.id)
  }

  // Generate a fresh channel ID. Google echoes this back in webhook headers,
  // so it must be unique per active channel and ideally a UUID.
  const channelId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `bloom_${Date.now()}_${Math.random().toString(36).slice(2)}`

  // 7 days is the per-channel TTL. We send our requested expiration but Google
  // can return a sooner one — always trust the response.
  const requestedExpirationMs = Date.now() + 7 * 24 * 60 * 60 * 1000

  const watchUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`
  let response: Response
  try {
    response = await fetch(watchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: appUrl + WEBHOOK_PATH,
        // Echoed back in X-Goog-Channel-Token for cheap verification.
        token: userId,
        params: {
          ttl: String(7 * 24 * 60 * 60), // seconds
        },
      }),
    })
  } catch (err) {
    console.error('[calendar-watch] watch POST network error:', err)
    return null
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error('[calendar-watch] watch register failed:', response.status, text)
    return null
  }

  const body = await response.json()
  // body: { kind, id, resourceId, resourceUri, token, expiration }
  // expiration is a string of milliseconds since epoch.
  const expiresAtMs = body.expiration ? parseInt(body.expiration, 10) : requestedExpirationMs
  const expiresAt = new Date(expiresAtMs).toISOString()

  // Pull an initial syncToken so subsequent reconciliation calls can be
  // incremental. Google requires a "first sync" full list to get the token.
  const initialSyncToken = await primeSyncToken(accessToken, calendarId)

  const { data: inserted, error: insertErr } = await supabase
    .from('calendar_watch_channels')
    .insert({
      user_id: userId,
      channel_id: channelId,
      resource_id: body.resourceId,
      sync_token: initialSyncToken,
      expires_at: expiresAt,
      active: true,
    })
    .select()
    .single()

  if (insertErr) {
    console.error('[calendar-watch] DB insert failed; stopping channel to avoid drift:', insertErr)
    await stopChannel({ channelId, resourceId: body.resourceId, accessToken }).catch(() => {})
    return null
  }

  return {
    id: inserted.id,
    channel_id: inserted.channel_id,
    resource_id: inserted.resource_id,
    expires_at: inserted.expires_at,
    sync_token: inserted.sync_token,
  }
}

/**
 * Tell Google to stop a watch channel. Idempotent — failures are logged but
 * not raised because the channel may already be expired/stopped.
 */
export async function stopChannel(args: {
  channelId: string
  resourceId: string
  accessToken: string
}): Promise<void> {
  try {
    await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: args.channelId, resourceId: args.resourceId }),
    })
  } catch (err) {
    console.warn('[calendar-watch] stopChannel failed (channel may already be expired):', err)
  }
}

/**
 * Initial events.list to grab a syncToken. We don't care about the events
 * themselves on first connect — only the token. Returns null on failure;
 * the webhook handler can fall back to a windowed list if we have no token.
 */
async function primeSyncToken(accessToken: string, calendarId: string): Promise<string | null> {
  try {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
    // singleEvents=false — we want the parent recurring events to be reported
    // as such; only their cancellations/exceptions come through as instances.
    url.searchParams.set('singleEvents', 'false')
    url.searchParams.set('maxResults', '1')
    url.searchParams.set('showDeleted', 'true')

    let nextPageToken: string | undefined
    let nextSyncToken: string | undefined
    // Walk to the end to get the syncToken. With maxResults=1 + a busy
    // calendar this could take many requests, but on first connect most
    // calendars have <100 events in scope.
    let safety = 50
    do {
      if (nextPageToken) url.searchParams.set('pageToken', nextPageToken)
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        console.warn('[calendar-watch] primeSyncToken list failed:', res.status, t)
        return null
      }
      const json = await res.json()
      nextPageToken = json.nextPageToken
      nextSyncToken = json.nextSyncToken
      safety--
    } while (nextPageToken && safety > 0)

    return nextSyncToken || null
  } catch (err) {
    console.warn('[calendar-watch] primeSyncToken error:', err)
    return null
  }
}
