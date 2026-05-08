/**
 * Renew Google Calendar watch channels before they expire.
 *
 * Channels live ~7 days. We refresh any active channel whose `expires_at` is
 * within the next 24 hours so webhooks never silently stop.
 *
 * Trigger: Vercel cron schedule every 6 hours (configured separately in
 * vercel.json or the dashboard).
 *
 * Auth: requires the CRON_SECRET header to match the env var. Returns 401
 * otherwise so this endpoint can't be hit publicly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { getValidGoogleToken } from '@/lib/services/google-auth'
import { registerCalendarWatch } from '@/lib/services/calendar-watch'

export async function GET(request: NextRequest) {
  // Vercel cron passes the secret in `Authorization: Bearer <secret>`.
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find active channels expiring within the next 24 hours.
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { data: expiring } = await supabase
    .from('calendar_watch_channels')
    .select('id, user_id')
    .eq('active', true)
    .lt('expires_at', cutoff)

  const renewed: string[] = []
  const failed: string[] = []

  for (const row of expiring || []) {
    try {
      const auth = await getValidGoogleToken(row.user_id, supabase)
      if (!auth) {
        failed.push(row.user_id)
        continue
      }
      // registerCalendarWatch stops the existing channel and creates a fresh one.
      const result = await registerCalendarWatch(
        { userId: row.user_id, accessToken: auth.accessToken, calendarId: auth.calendarId },
        supabase,
      )
      if (result) renewed.push(row.user_id); else failed.push(row.user_id)
    } catch (err) {
      console.error('[cron/renew-calendar-watches] renewal failed for', row.user_id, err)
      failed.push(row.user_id)
    }
  }

  return NextResponse.json({
    checked: (expiring || []).length,
    renewed: renewed.length,
    failed: failed.length,
  })
}
