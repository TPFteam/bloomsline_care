/**
 * Read-only: show the most recently updated bookings + their paired sessions
 * so we can see exactly what the close flow wrote (status / reason / payment),
 * and whether the booking and session rows agree.
 *
 *   bash scripts/run-inspect-recent-closes.sh
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing env'); process.exit(1) }
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

async function main() {
  const { data: bookings, error } = await sb
    .from('bookings')
    .select('id, practitioner_id, member_id, client_name, start_time, status, payment_status, cancellation_reason, cancelled_by, updated_at')
    .in('status', ['cancelled', 'no_show'])
    .order('updated_at', { ascending: false })
    .limit(8)
  if (error) throw error

  for (const b of bookings || []) {
    console.log('\n──────────────────────────────────────────')
    console.log(`BOOKING  ${b.client_name}  ${b.start_time}`)
    console.log(`  status=${b.status}  payment=${b.payment_status}  reason=${b.cancellation_reason}  cancelled_by=${b.cancelled_by}`)
    console.log(`  updated_at=${b.updated_at}`)
    const { data: sessions } = await sb
      .from('sessions')
      .select('id, status, payment_status, cancellation_reason, updated_at')
      .eq('practitioner_id', b.practitioner_id)
      .eq('member_id', b.member_id)
      .eq('scheduled_at', b.start_time)
    for (const s of sessions || []) {
      const flag = s.status !== b.status ? '  ⚠️ MISMATCH' : ''
      console.log(`  SESSION  status=${s.status}  payment=${s.payment_status}  reason=${s.cancellation_reason}${flag}`)
    }
    if (!sessions || sessions.length === 0) console.log('  (no paired session row)')
  }
  console.log('')
}
main().catch((e) => { console.error(e); process.exit(1) })
