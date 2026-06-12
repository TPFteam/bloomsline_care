/**
 * READ-ONLY audit of the legacy "History" card data, to plan its migration
 * into the new customizable "About patient" sections.
 *
 * The old History card (the `about` card) writes into `members`:
 *   - internal_notes (text)                         → the "Notes" body
 *   - preferences (jsonb), "Key considerations":
 *       key_strengths        : string[] | {en:[],fr:[]}   → LIST
 *       areas_of_sensitivity : string[] | {en:[],fr:[]}   → LIST
 *       communication_style  : string | string[] | {…}    → LIST
 *       current_treatment    : string | {en,fr}           → PARAGRAPH
 *       therapeutic_context  : string | {en,fr}           → PARAGRAPH
 *
 * This script does NOT write anything. It reports, per practitioner:
 *   - how many of their patients have ANY legacy history data
 *   - per-field fill counts
 * plus global totals, so we can decide what/whether to migrate.
 *
 *   bash scripts/run-audit-history.sh
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

// ── value helpers (a field may be string | string[] | {en,fr,es} | {en:[],…}) ──
type Any = unknown
const isObj = (v: Any): v is Record<string, Any> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Does this value carry any real content? */
function hasContent(v: Any): boolean {
  if (v == null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.some(hasContent)
  if (isObj(v)) return Object.values(v).some(hasContent)
  return false
}

/** Flatten to a representative string[] (for LIST-type fields). */
function toList(v: Any): string[] {
  if (v == null) return []
  if (typeof v === 'string') return v.trim() ? [v.trim()] : []
  if (Array.isArray(v)) return v.flatMap(toList)
  if (isObj(v)) {
    const en = v['en']
    return toList(en !== undefined ? en : Object.values(v)[0])
  }
  return []
}

/** Flatten to a representative string (for PARAGRAPH-type fields). */
function toText(v: Any): string {
  if (v == null) return ''
  if (typeof v === 'string') return v.trim()
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ')
  if (isObj(v)) {
    const en = v['en']
    return toText(en !== undefined ? en : Object.values(v)[0])
  }
  return ''
}

const FIELDS = [
  { key: 'internal_notes', kind: 'paragraph', from: 'notes' },
  { key: 'current_treatment', kind: 'paragraph', from: 'preferences' },
  { key: 'therapeutic_context', kind: 'paragraph', from: 'preferences' },
  { key: 'key_strengths', kind: 'list', from: 'preferences' },
  { key: 'areas_of_sensitivity', kind: 'list', from: 'preferences' },
  { key: 'communication_style', kind: 'list', from: 'preferences' },
] as const

async function main() {
  // Pull every member's legacy history fields.
  const { data: members, error } = await sb
    .from('members')
    .select('id, practitioner_id, first_name, last_name, internal_notes, preferences')
  if (error) throw error
  const rows = members || []

  // Map practitioner_id → email (best-effort via auth admin).
  const practEmail = new Map<string, string>()
  try {
    for (let page = 1; page <= 30; page++) {
      const { data, error: e } = await sb.auth.admin.listUsers({ page, perPage: 200 })
      if (e || !data?.users?.length) break
      for (const u of data.users) practEmail.set(u.id, u.email || u.id)
      if (data.users.length < 200) break
    }
  } catch { /* ignore — fall back to ids */ }

  const fieldVal = (m: Record<string, Any>, key: string): Any =>
    key === 'internal_notes' ? m.internal_notes : (m.preferences as Record<string, Any> | null)?.[key]

  // Per-practitioner aggregation.
  type Stat = { total: number; withAny: number; perField: Record<string, number>; patients: { name: string; fields: string[] }[] }
  const byPract = new Map<string, Stat>()
  let globalWithAny = 0
  const globalPerField: Record<string, number> = {}

  for (const m of rows) {
    const pid = (m.practitioner_id as string) || '(none)'
    if (!byPract.has(pid)) byPract.set(pid, { total: 0, withAny: 0, perField: {}, patients: [] })
    const st = byPract.get(pid)!
    st.total++

    const filled: string[] = []
    for (const f of FIELDS) {
      if (hasContent(fieldVal(m, f.key))) {
        filled.push(f.key)
        st.perField[f.key] = (st.perField[f.key] || 0) + 1
        globalPerField[f.key] = (globalPerField[f.key] || 0) + 1
      }
    }
    if (filled.length) {
      st.withAny++
      globalWithAny++
      st.patients.push({ name: `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || (m.id as string), fields: filled })
    }
  }

  // ── Report ──
  console.log('\n══════════════════════════════════════════════════════')
  console.log(' LEGACY HISTORY DATA AUDIT  (read-only)')
  console.log('══════════════════════════════════════════════════════')
  console.log(`Total members scanned        : ${rows.length}`)
  console.log(`Members with ANY history data: ${globalWithAny}`)
  console.log(`Practitioners total          : ${byPract.size}`)
  console.log(`Practitioners with ≥1 filled : ${[...byPract.values()].filter(s => s.withAny > 0).length}`)
  console.log('\nPer-field fill counts (member rows with content):')
  for (const f of FIELDS) {
    console.log(`  ${f.key.padEnd(22)} ${String(globalPerField[f.key] || 0).padStart(4)}   → ${f.kind}`)
  }

  console.log('\n──────────── Per practitioner (only those with data) ────────────')
  const sorted = [...byPract.entries()].filter(([, s]) => s.withAny > 0).sort((a, b) => b[1].withAny - a[1].withAny)
  for (const [pid, s] of sorted) {
    const who = practEmail.get(pid) || pid
    console.log(`\n● ${who}`)
    console.log(`    patients: ${s.withAny}/${s.total} have history data`)
    const fieldsSummary = FIELDS.filter(f => s.perField[f.key]).map(f => `${f.key}=${s.perField[f.key]}`).join('  ')
    if (fieldsSummary) console.log(`    fields  : ${fieldsSummary}`)
    for (const p of s.patients.slice(0, 8)) {
      console.log(`      - ${p.name}: ${p.fields.join(', ')}`)
    }
    if (s.patients.length > 8) console.log(`      … +${s.patients.length - 8} more`)
  }

  // ── Full per-practitioner dump (`--full`), demo patients excluded ──
  const DEMO = new Set(['emma thompson', 'lucas martin'])
  if (process.argv.includes('--full')) {
    console.log('\n\n══════════════════════════════════════════════════════')
    console.log(' FULL CONTENT DUMP  (demo patients excluded: Emma Thompson, Lucas Martin)')
    console.log('══════════════════════════════════════════════════════')
    // Re-group rows by practitioner, skipping demo patients.
    const byP = new Map<string, Record<string, Any>[]>()
    for (const m of rows) {
      const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim().toLowerCase()
      if (DEMO.has(name)) continue
      if (!FIELDS.some(f => hasContent(fieldVal(m, f.key)))) continue
      const pid = (m.practitioner_id as string) || '(none)'
      if (!byP.has(pid)) byP.set(pid, [])
      byP.get(pid)!.push(m)
    }
    const order = [...byP.entries()].sort((a, b) => b[1].length - a[1].length)
    let grandPatients = 0
    for (const [pid, pts] of order) {
      grandPatients += pts.length
      console.log(`\n\n████ ${practEmail.get(pid) || pid}   (${pts.length} patient${pts.length > 1 ? 's' : ''} with real data)`)
      for (const m of pts) {
        const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || (m.id as string)
        console.log(`\n  ── ${name} ──`)
        for (const f of FIELDS) {
          const v = fieldVal(m, f.key)
          if (!hasContent(v)) continue
          if (f.kind === 'list') {
            console.log(`    • ${f.key} (list):`)
            for (const item of toList(v)) console.log(`        - ${item}`)
          } else {
            const text = toText(v)
            console.log(`    • ${f.key} (paragraph):`)
            for (const line of text.split('\n')) console.log(`        ${line}`)
          }
        }
      }
    }
    console.log(`\n\nTotal non-demo practitioners with data: ${order.length}`)
    console.log(`Total non-demo patients to migrate    : ${grandPatients}`)
    console.log('')
    return
  }

  // A couple of concrete examples so we can eyeball how values would convert.
  console.log('\n──────────── Sample value shapes (first 3 filled patients) ────────────')
  let shown = 0
  for (const m of rows) {
    if (shown >= 3) break
    const anyFilled = FIELDS.some(f => hasContent(fieldVal(m, f.key)))
    if (!anyFilled) continue
    shown++
    console.log(`\n[${`${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.id}]`)
    for (const f of FIELDS) {
      const v = fieldVal(m, f.key)
      if (!hasContent(v)) continue
      const preview = f.kind === 'list' ? JSON.stringify(toList(v)) : JSON.stringify(toText(v).slice(0, 120))
      const raw = JSON.stringify(v)
      console.log(`   ${f.key} (${f.kind}): ${preview}`)
      if (raw !== preview) console.log(`      raw: ${raw.slice(0, 160)}`)
    }
  }
  console.log('')
}
main().catch((e) => { console.error(e); process.exit(1) })
