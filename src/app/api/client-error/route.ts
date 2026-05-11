import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from '@/lib/security/rate-limit'

/**
 * POST /api/client-error
 *
 * Consent-independent error sink. The PostHog `client_error` capture in
 * error.tsx / global-error.tsx only fires once the user has accepted cookies,
 * which means crashes for users who never clicked "Accept" left no trace
 * anywhere. This endpoint accepts the same payload directly so we always
 * have something to read after a "Something went wrong" report.
 *
 * Side effects: writes to Vercel logs (always), and inserts into the
 * `client_errors` table if it exists. Insert failure is non-fatal.
 */

const MAX_FIELD_BYTES = 8 * 1024 // 8 KB cap per field — prevents abuse via huge stacks

function clip(value: unknown, max = MAX_FIELD_BYTES): string | null {
  if (value == null) return null
  const s = typeof value === 'string' ? value : String(value)
  return s.length > max ? s.slice(0, max) : s
}

export async function POST(request: NextRequest) {
  // Rate limit per-IP to keep this endpoint from being used as a log spammer.
  const clientId = getClientIdentifier(request)
  const rl = checkRateLimit(clientId, RATE_LIMITS.api)
  if (!rl.success) {
    return new NextResponse(null, { status: 429 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const payload = {
    error_name: clip(body.error_name, 256),
    error_message: clip(body.error_message, 2048),
    error_stack: clip(body.error_stack),
    error_digest: clip(body.error_digest, 256),
    url: clip(body.url, 2048),
    user_agent: clip(body.user_agent, 1024),
    scope: clip(body.scope, 32),
    translate_probe_value: clip(body.translate_probe_value, 256),
  }

  // Always log to Vercel — this works even before the table exists.
  console.error('[client-error]', JSON.stringify(payload))

  // Best-effort insert into client_errors table. If the table isn't created
  // yet (migration not applied), Supabase returns an error; we swallow it
  // because the Vercel log above is the primary record.
  try {
    const admin = createAdminClient()
    await admin.from('client_errors').insert(payload)
  } catch {
    // Table missing or insert failed — Vercel log is the fallback.
  }

  return new NextResponse(null, { status: 204 })
}
