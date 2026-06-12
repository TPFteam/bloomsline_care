/**
 * Backfill (all practitioners): historical no-shows that were stored as
 * `cancelled` get flipped to `no_show` — but ONLY when the reason is a genuine
 * no-show. Real cancellations (late_cancellation, client_request, illness,
 * practitioner-side, reason-less API cancels) are left exactly as they are.
 *
 *   No-show reasons → flip to no_show:  no_communication · forgot · patient_no_show
 *   Everything else                  →  leave as cancelled
 *
 * Bookings also require cancelled_by IS NULL (a real API cancellation always
 * stamps cancelled_by; the close flow never did). Sessions have no cancelled_by
 * column, so they match on the unambiguous no-show reason alone.
 *
 *   bash scripts/run-backfill-noshow.sh            # DRY RUN (read-only)
 *   bash scripts/run-backfill-noshow.sh --apply    # apply
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing env'); process.exit(1) }
const APPLY = process.argv.includes('--apply')
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

const NO_SHOW_REASONS = ['no_communication', 'forgot', 'patient_no_show']

async function run() {
  console.log(`\n=== No-show backfill (all practitioners) — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`)

  // ── Bookings ──
  const { data: bk, error: bErr } = await sb
    .from('bookings')
    .select('id, cancellation_reason')
    .eq('status', 'cancelled')
    .is('cancelled_by', null)
    .in('cancellation_reason', NO_SHOW_REASONS)
  if (bErr) throw bErr
  const bookingIds = (bk || []).map((r) => r.id)

  // ── Sessions ──
  const { data: ss, error: sErr } = await sb
    .from('sessions')
    .select('id, cancellation_reason')
    .eq('status', 'cancelled')
    .in('cancellation_reason', NO_SHOW_REASONS)
  if (sErr) throw sErr
  const sessionIds = (ss || []).map((r) => r.id)

  const breakdown = (rows: { cancellation_reason: string | null }[]) => {
    const m: Record<string, number> = {}
    for (const r of rows) { const k = String(r.cancellation_reason); m[k] = (m[k] || 0) + 1 }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([r, n]) => `    ${String(n).padStart(4)}  ${r}`).join('\n')
  }

  console.log(`BOOKINGS to flip → no_show: ${bookingIds.length}`)
  if (bookingIds.length) console.log(breakdown(bk!))
  console.log(`\nSESSIONS to flip → no_show: ${sessionIds.length}`)
  if (sessionIds.length) console.log(breakdown(ss!))

  if (!APPLY) { console.log('\nDRY RUN — nothing changed. Re-run with --apply.\n'); return }

  const chunk = <T,>(a: T[], n: number) => a.reduce<T[][]>((acc, x, i) => { if (i % n === 0) acc.push([]); acc[acc.length - 1].push(x); return acc }, [])
  let bU = 0
  for (const part of chunk(bookingIds, 200)) {
    const { error, count } = await sb.from('bookings').update({ status: 'no_show' }, { count: 'exact' }).in('id', part)
    if (error) throw error
    bU += count ?? part.length
  }
  let sU = 0
  for (const part of chunk(sessionIds, 200)) {
    const { error, count } = await sb.from('sessions').update({ status: 'no_show' }, { count: 'exact' }).in('id', part)
    if (error) throw error
    sU += count ?? part.length
  }
  console.log(`\nApplied — bookings: ${bU}, sessions: ${sU}\n`)
}
run().catch((e) => { console.error(e); process.exit(1) })
