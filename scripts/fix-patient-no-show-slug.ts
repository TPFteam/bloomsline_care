/**
 * One-off: records closed with reason `patient_no_show` (a transient slug from
 * an earlier reason set) were stored as status `cancelled` due to a mapping
 * gap. The reason unambiguously means a no-show, so flip those rows to no_show.
 *
 *   bash scripts/run-fix-patient-no-show.sh           # dry run
 *   bash scripts/run-fix-patient-no-show.sh --apply   # apply
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing env'); process.exit(1) }
const APPLY = process.argv.includes('--apply')
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

async function fixTable(table: 'bookings' | 'sessions') {
  const { data, error } = await sb
    .from(table)
    .select('id')
    .eq('status', 'cancelled')
    .eq('cancellation_reason', 'patient_no_show')
  if (error) throw error
  const ids = (data || []).map((r) => r.id)
  console.log(`${table}: ${ids.length} row(s) with reason=patient_no_show but status=cancelled`)
  if (APPLY && ids.length) {
    const { error: uErr, count } = await sb
      .from(table)
      .update({ status: 'no_show' }, { count: 'exact' })
      .in('id', ids)
    if (uErr) throw uErr
    console.log(`  → updated ${count ?? ids.length} to no_show`)
  }
}

async function main() {
  console.log(`\n=== fix patient_no_show — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`)
  await fixTable('bookings')
  await fixTable('sessions')
  if (!APPLY) console.log('\nDry run — re-run with --apply to fix.\n')
  else console.log('\nDone.\n')
}
main().catch((e) => { console.error(e); process.exit(1) })
