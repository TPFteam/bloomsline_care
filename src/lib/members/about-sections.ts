/**
 * Shared serialization for the customizable "About patient" sections
 * (the model that replaced the legacy History card).
 *
 *   Template (per practitioner)  — user_preferences.overview_sections:
 *     [{ id, title, type: 'paragraph' | 'list' }]
 *   Content  (per patient)       — members.overview_content:
 *     { [sectionId]: string (paragraph) | string[] (list) }
 *
 * These helpers turn a patient's sections into a plain-text block for the AI
 * prompt builders (summaries, session prep, Bloom chat, practitioner context).
 */

export type AboutSubType = 'paragraph' | 'list'
export type AboutSubsection = { id: string; title: string; type: AboutSubType }
export type AboutContent = Record<string, string | string[]>

const asText = (v: string | string[] | undefined): string => (typeof v === 'string' ? v.trim() : '')
const asList = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v.map(s => (s ?? '').trim()).filter(Boolean) : []

/**
 * Render the patient's About sections as `Title: value` lines, in template
 * order. Returns '' when nothing is filled. Lists are joined with '; ' so the
 * whole block stays compact for the model.
 */
export function serializeAboutSections(
  template: AboutSubsection[] | null | undefined,
  content: AboutContent | null | undefined,
): string {
  if (!template?.length || !content) return ''
  const lines: string[] = []
  for (const s of template) {
    const raw = content[s.id]
    if (s.type === 'list') {
      const items = asList(raw)
      if (items.length) lines.push(`${s.title}: ${items.join('; ')}`)
    } else {
      const text = asText(raw)
      if (text) lines.push(`${s.title}: ${text}`)
    }
  }
  return lines.join('\n')
}

/**
 * Fetch a practitioner's section template once. Cheap to reuse across many of
 * their patients (e.g. the practitioner-wide Bloom context).
 *
 * `supabase` is any client exposing `.from(...).select(...).eq(...).maybeSingle()`.
 */
export async function fetchAboutTemplate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  practitionerId: string,
): Promise<AboutSubsection[]> {
  const { data } = await supabase
    .from('user_preferences')
    .select('overview_sections')
    .eq('user_id', practitionerId)
    .maybeSingle()
  return (data?.overview_sections as AboutSubsection[]) || []
}

/**
 * The standard starter sections (stable ids matched to the history→sections
 * migration). Used to seed a practitioner's template from the demo seed and
 * the Add-Member "background notes" field. Titled in the given locale.
 */
export function starterSections(locale: 'en' | 'fr' = 'en'): AboutSubsection[] {
  const fr = locale === 'fr'
  return [
    { id: 'hist_notes', title: fr ? 'Historique' : 'History', type: 'paragraph' },
    { id: 'hist_context', title: fr ? 'Contexte thérapeutique' : 'Therapeutic context', type: 'paragraph' },
    { id: 'hist_treatment', title: fr ? 'Plan de traitement actuel' : 'Current treatment plan', type: 'paragraph' },
    { id: 'hist_strengths', title: fr ? 'Forces' : 'Strengths', type: 'list' },
    { id: 'hist_sensitivity', title: fr ? 'Points de sensibilité' : 'Areas of sensitivity', type: 'list' },
    { id: 'hist_communication', title: fr ? 'Style de communication' : 'Communication style', type: 'list' },
  ]
}

/**
 * Ensure the practitioner's template contains the given starter section ids
 * (appends any missing ones, never touches existing). Idempotent.
 */
export async function ensureSections(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  practitionerId: string,
  sectionIds: string[],
  locale: 'en' | 'fr' = 'en',
): Promise<AboutSubsection[]> {
  const existing = await fetchAboutTemplate(supabase, practitionerId)
  const have = new Set(existing.map(s => s.id))
  const toAdd = starterSections(locale).filter(s => sectionIds.includes(s.id) && !have.has(s.id))
  if (!toAdd.length) return existing
  const next = [...existing, ...toAdd]
  await supabase
    .from('user_preferences')
    .upsert({ user_id: practitionerId, overview_sections: next }, { onConflict: 'user_id' })
  return next
}

/**
 * Convenience: fetch the template and serialize a single patient's content.
 */
export async function buildAboutText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  practitionerId: string,
  content: AboutContent | null | undefined,
): Promise<string> {
  if (!content || Object.keys(content).length === 0) return ''
  const template = await fetchAboutTemplate(supabase, practitionerId)
  return serializeAboutSections(template, content)
}
