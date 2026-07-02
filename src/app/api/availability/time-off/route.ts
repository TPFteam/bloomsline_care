import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

/**
 * Practitioner time-off / holidays.
 *
 * Time off is stored as `availability_overrides` rows with `is_available =
 * false` (the table was designed for exactly this — see its `reason` column:
 * "Holiday", "Vacation", ...). One row per date:
 *   - full day  → start_time / end_time both NULL
 *   - morning   → 00:00:00–12:00:00
 *   - afternoon → 12:00:00–23:59:59
 *
 * Blocked days/windows are hidden from booking everywhere automatically: the
 * public booking page, the mobile patient app and the practitioner's own
 * calendar all read availability through /api/bookings/available-slots, which
 * filters these rows out (full days via the RPC, half-days at the route level).
 */

type Portion = 'full' | 'morning' | 'afternoon'

const MORNING = { start: '00:00:00', end: '12:00:00' }
const AFTERNOON = { start: '12:00:00', end: '23:59:59' }
const MAX_RANGE_DAYS = 366 // guard against absurd ranges

function isoDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// Inclusive list of YYYY-MM-DD dates from start to end (UTC-noon anchored so
// DST never shifts the calendar day).
function datesInRange(start: string, end: string): string[] {
  const out: string[] = []
  const cur = new Date(`${start}T12:00:00Z`)
  const last = new Date(`${end}T12:00:00Z`)
  while (cur.getTime() <= last.getTime()) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
}

function portionFor(startTime: string | null): Portion {
  if (!startTime) return 'full'
  return startTime < '12:00:00' ? 'morning' : 'afternoon'
}

// GET — upcoming time-off for the signed-in practitioner (one row per date).
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rl = checkRateLimit(clientId, RATE_LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('availability_overrides')
    .select('id, override_date, start_time, end_time, reason')
    .eq('user_id', user.id)
    .eq('is_available', false)
    .gte('override_date', today)
    .order('override_date', { ascending: true })

  if (error) {
    console.error('[time-off] GET error:', error)
    return NextResponse.json({ error: 'Failed to load time off' }, { status: 500 })
  }

  const items = (data || []).map((r) => ({
    id: r.id as string,
    date: r.override_date as string,
    startTime: (r.start_time as string | null) ?? null,
    endTime: (r.end_time as string | null) ?? null,
    portion: portionFor((r.start_time as string | null) ?? null),
    reason: (r.reason as string | null) ?? null,
  }))
  return NextResponse.json({ items })
}

// POST — add a block of time off. Body: { startDate, endDate?, portion, reason? }.
// Writes one row per date in the range; re-adding a date replaces its prior
// time-off (a date is full-off, morning-off, or afternoon-off — not stacked).
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rl = checkRateLimit(clientId, RATE_LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    startDate?: string; endDate?: string; portion?: string; reason?: string
  }
  const startDate = body.startDate
  const endDate = body.endDate || body.startDate
  const portion = (body.portion || 'full') as Portion
  const reason = (body.reason || '').trim().slice(0, 200) || null

  if (!isoDate(startDate) || !isoDate(endDate)) {
    return NextResponse.json({ error: 'startDate and endDate must be YYYY-MM-DD' }, { status: 400 })
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: 'endDate must be on or after startDate' }, { status: 400 })
  }
  if (!['full', 'morning', 'afternoon'].includes(portion)) {
    return NextResponse.json({ error: 'Invalid portion' }, { status: 400 })
  }

  const dates = datesInRange(startDate, endDate)
  if (dates.length > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range too long (max ${MAX_RANGE_DAYS} days)` }, { status: 400 })
  }

  const win = portion === 'morning' ? MORNING : portion === 'afternoon' ? AFTERNOON : null
  const rows = dates.map((d) => ({
    user_id: user.id,
    override_date: d,
    is_available: false,
    start_time: win?.start ?? null,
    end_time: win?.end ?? null,
    reason,
  }))

  // A date holds a single time-off entry — clear any existing block for these
  // dates first so re-adding an overlapping range is idempotent.
  const { error: delError } = await supabase
    .from('availability_overrides')
    .delete()
    .eq('user_id', user.id)
    .eq('is_available', false)
    .in('override_date', dates)
  if (delError) {
    console.error('[time-off] POST clear error:', delError)
    return NextResponse.json({ error: 'Failed to save time off' }, { status: 500 })
  }

  const { error: insError } = await supabase.from('availability_overrides').insert(rows)
  if (insError) {
    console.error('[time-off] POST insert error:', insError)
    return NextResponse.json({ error: 'Failed to save time off' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}

// DELETE — undo time off. Body: { ids: string[] }. RLS scopes to the owner.
export async function DELETE(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rl = checkRateLimit(clientId, RATE_LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => typeof x === 'string') : []
  if (ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 })

  const { error } = await supabase
    .from('availability_overrides')
    .delete()
    .eq('user_id', user.id)
    .eq('is_available', false)
    .in('id', ids)
  if (error) {
    console.error('[time-off] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove time off' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, count: ids.length })
}
