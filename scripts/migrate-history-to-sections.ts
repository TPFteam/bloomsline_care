/**
 * Migrate the legacy "History" card data into the new customizable
 * "About patient" sections. NON-DESTRUCTIVE: writes only to the new columns
 *   user_preferences.overview_sections   (the practitioner TEMPLATE)
 *   members.overview_content             (per-patient values, keyed by section id)
 * and leaves members.internal_notes / members.preferences untouched.
 *
 * Field → section mapping (title localized to the practitioner's
 * users.preferred_language, fallback en):
 *
 *   internal_notes        → hist_notes         paragraph  History / Historique
 *   therapeutic_context   → hist_context       paragraph  Therapeutic context / Contexte thérapeutique
 *   current_treatment     → hist_treatment     paragraph  Current treatment plan / Plan de traitement actuel
 *   key_strengths         → hist_strengths     list       Strengths / Forces
 *   areas_of_sensitivity  → hist_sensitivity   list       Areas of sensitivity / Points de sensibilité
 *   communication_style   → hist_communication list       Communication style / Style de communication
 *
 * Demo patients (Emma Thompson, Lucas Martin) are excluded.
 * Idempotent: stable hist_ ids; never overwrites an existing section or
 * content key.
 *
 *   bash scripts/run-migrate-history.sh           # DRY RUN (prints plan, writes nothing)
 *   bash scripts/run-migrate-history.sh --apply   # actually write
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })

const APPLY = process.argv.includes('--apply')

type Any = unknown
const isObj = (v: Any): v is Record<string, Any> => !!v && typeof v === 'object' && !Array.isArray(v)
const LOCALES = ['en', 'fr', 'es']

/** Resolve a possibly-localized container to the chosen locale's value. */
function resolve(v: Any, loc: string): Any {
  if (isObj(v) && Object.keys(v).some(k => LOCALES.includes(k))) {
    const o = v as Record<string, Any>
    return o[loc] ?? o.en ?? o.fr ?? Object.values(o)[0]
  }
  return v
}
function toText(v: Any, loc: string): string {
  const r = resolve(v, loc)
  if (r == null) return ''
  if (Array.isArray(r)) return r.map(x => toText(x, loc)).filter(Boolean).join(', ')
  if (typeof r === 'string') return r.trim()
  return String(r)
}
function toList(v: Any, loc: string): string[] {
  const r = resolve(v, loc)
  if (r == null) return []
  if (Array.isArray(r)) return r.map(x => toText(x, loc)).map(s => s.trim()).filter(Boolean)
  if (typeof r === 'string') return r.trim() ? [r.trim()] : []
  return []
}
function hasContent(v: Any): boolean {
  if (v == null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.some(hasContent)
  if (isObj(v)) return Object.values(v).some(hasContent)
  return false
}

type Kind = 'paragraph' | 'list'
const SECTIONS: { field: string; id: string; type: Kind; en: string; fr: string }[] = [
  { field: 'internal_notes',       id: 'hist_notes',         type: 'paragraph', en: 'History',               fr: 'Historique' },
  { field: 'therapeutic_context',  id: 'hist_context',       type: 'paragraph', en: 'Therapeutic context',   fr: 'Contexte thérapeutique' },
  { field: 'current_treatment',    id: 'hist_treatment',     type: 'paragraph', en: 'Current treatment plan', fr: 'Plan de traitement actuel' },
  { field: 'key_strengths',        id: 'hist_strengths',     type: 'list',      en: 'Strengths',             fr: 'Forces' },
  { field: 'areas_of_sensitivity', id: 'hist_sensitivity',   type: 'list',      en: 'Areas of sensitivity',  fr: 'Points de sensibilité' },
  { field: 'communication_style',  id: 'hist_communication', type: 'list',      en: 'Communication style',   fr: 'Style de communication' },
]
const DEMO = new Set(['emma thompson', 'lucas martin'])

const fieldVal = (m: Record<string, Any>, field: string): Any =>
  field === 'internal_notes' ? m.internal_notes : (m.preferences as Record<string, Any> | null)?.[field]

async function main() {
  console.log(`\n${APPLY ? '🟢 APPLY MODE — writing to the database' : '🟡 DRY RUN — no writes (pass --apply to write)'}\n`)

  const { data: members, error } = await sb
    .from('members')
    .select('id, practitioner_id, first_name, last_name, internal_notes, preferences, overview_content')
  if (error) throw error

  // Group non-demo members-with-data by practitioner.
  const byP = new Map<string, Record<string, Any>[]>()
  for (const m of members || []) {
    const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim().toLowerCase()
    if (DEMO.has(name)) continue
    if (!SECTIONS.some(s => hasContent(fieldVal(m, s.field)))) continue
    const pid = (m.practitioner_id as string) || '(none)'
    if (!byP.has(pid)) byP.set(pid, [])
    byP.get(pid)!.push(m)
  }

  let totalSectionsAdded = 0, totalPatients = 0, totalContentKeys = 0

  for (const [pid, pts] of [...byP.entries()].sort((a, b) => b[1].length - a[1].length)) {
    // Practitioner locale.
    const { data: u } = await sb.from('users').select('preferred_language').eq('id', pid).maybeSingle()
    const loc = (u?.preferred_language as string) || 'en'
    const title = (s: typeof SECTIONS[number]) => (loc === 'fr' ? s.fr : s.en)

    // Existing template.
    const { data: prefRow } = await sb.from('user_preferences').select('overview_sections').eq('user_id', pid).maybeSingle()
    const existing: { id: string; title: string; type: Kind }[] = (prefRow?.overview_sections as Any[] as { id: string; title: string; type: Kind }[]) || []
    const existingIds = new Set(existing.map(s => s.id))

    // Which fields does THIS practitioner's cohort use?
    const usedFields = SECTIONS.filter(s => pts.some(m => hasContent(fieldVal(m, s.field))))
    const sectionsToAdd = usedFields.filter(s => !existingIds.has(s.id))
    const newTemplate = [...existing, ...sectionsToAdd.map(s => ({ id: s.id, title: title(s), type: s.type }))]

    console.log(`\n████ ${pid}  (${u?.preferred_language || 'en'})  — ${pts.length} patient(s)`)
    console.log(`   template: ${existing.length} existing section(s)${existing.length ? ` [${existing.map(s => s.title).join(', ')}]` : ''}`)
    if (sectionsToAdd.length) {
      console.log(`   + add ${sectionsToAdd.length} section(s): ${sectionsToAdd.map(s => `"${title(s)}" (${s.type})`).join(', ')}`)
      totalSectionsAdded += sectionsToAdd.length
    } else {
      console.log(`   + no new sections needed (already present)`)
    }

    if (APPLY) {
      const { error: e } = await sb.from('user_preferences').upsert(
        { user_id: pid, overview_sections: newTemplate }, { onConflict: 'user_id' },
      )
      if (e) { console.error(`   ✗ template upsert failed: ${e.message}`); continue }
    }

    // Per-patient content.
    for (const m of pts) {
      totalPatients++
      const content: Record<string, Any> = { ...((m.overview_content as Record<string, Any>) || {}) }
      const writes: string[] = []
      for (const s of usedFields) {
        const raw = fieldVal(m, s.field)
        if (!hasContent(raw)) continue
        if (content[s.id] !== undefined && hasContent(content[s.id])) { writes.push(`${s.id}=（kept existing）`); continue }
        const val = s.type === 'list' ? toList(raw, loc) : toText(raw, loc)
        if ((Array.isArray(val) && val.length === 0) || val === '') continue
        content[s.id] = val
        totalContentKeys++
        const preview = Array.isArray(val) ? `[${val.length} items] ${JSON.stringify(val).slice(0, 90)}` : JSON.stringify(val.slice(0, 90))
        writes.push(`${s.id} ← ${preview}`)
      }
      const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || (m.id as string)
      console.log(`     • ${name}`)
      for (const w of writes) console.log(`         ${w}`)
      if (APPLY) {
        const { error: e } = await sb.from('members').update({ overview_content: content }).eq('id', m.id)
        if (e) console.error(`         ✗ content update failed: ${e.message}`)
      }
    }
  }

  console.log(`\n──────────────────────────────────────────────`)
  console.log(`Practitioners touched : ${byP.size}`)
  console.log(`Patients touched      : ${totalPatients}`)
  console.log(`Template sections add : ${totalSectionsAdded}`)
  console.log(`Content keys written  : ${totalContentKeys}`)
  console.log(APPLY ? '\n✅ Done (applied).' : '\n🟡 Dry run only. Re-run with --apply to write.')
  console.log('')
}
main().catch((e) => { console.error(e); process.exit(1) })
