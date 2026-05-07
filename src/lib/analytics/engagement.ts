/**
 * Engagement scoring for the "My People" / Mes personnes widget.
 *
 * Each signal contributes 0..weight points; total max 100.
 * Tier thresholds are fixed (>=70 emerald, >=40 amber, <40 orange).
 * Configuration lives on `users.engagement_settings` JSONB.
 */

export type EngagementSignalId =
  | 'sessions'
  | 'notes'
  | 'milestones'
  | 'reflections'
  | 'resources'
  | 'stories'
  | 'files'
  | 'bookings'

export type EngagementPreset = 'all' | 'sessions' | 'notes' | 'resources' | 'stories' | 'custom'

export interface EngagementSignalConfig {
  enabled: boolean
  weight: number // 0..100, default sums to 100 across enabled signals
}

export interface EngagementSettings {
  preset: EngagementPreset
  signals: Record<EngagementSignalId, EngagementSignalConfig>
  /** When true, overlay Bloom Pulse sentiment as a tier nudge:
   *   sentiment 'attention' → force orange (downgrade)
   *   sentiment 'progressing' → force emerald (upgrade)
   *   others → no change */
  pulseSentimentOverride: boolean
}

export const DEFAULT_ENGAGEMENT_SETTINGS: EngagementSettings = {
  preset: 'all',
  signals: {
    sessions:    { enabled: true, weight: 25 },
    notes:       { enabled: true, weight: 10 },
    milestones:  { enabled: true, weight: 15 },
    reflections: { enabled: true, weight: 15 },
    resources:   { enabled: true, weight: 10 },
    stories:     { enabled: true, weight: 10 },
    files:       { enabled: true, weight: 5 },
    bookings:    { enabled: true, weight: 10 },
  },
  pulseSentimentOverride: false,
}

/** One-click presets — flip enabled flags but leave weights alone for restore */
export const ENGAGEMENT_PRESETS: Record<Exclude<EngagementPreset, 'custom'>, EngagementSignalId[]> = {
  all: ['sessions', 'notes', 'milestones', 'reflections', 'resources', 'stories', 'files', 'bookings'],
  sessions: ['sessions'],
  notes: ['notes'],
  resources: ['resources'],
  stories: ['stories'],
}

export function applyPreset(settings: EngagementSettings, preset: Exclude<EngagementPreset, 'custom'>): EngagementSettings {
  const enabled = new Set(ENGAGEMENT_PRESETS[preset])
  const next: EngagementSettings = {
    ...settings,
    preset,
    signals: { ...settings.signals },
  }
  for (const id of Object.keys(next.signals) as EngagementSignalId[]) {
    next.signals[id] = { ...next.signals[id], enabled: enabled.has(id) }
  }
  return next
}

// ── Per-signal sub-score helpers ───────────────────────────────────
// Each returns 0..1; we then multiply by the configured weight.

interface PatientData {
  memberId: string
  lastSessionAt: string | null
  sessions: Array<{ id: string; status: string; scheduled_at: string }>
  notes: Array<{ id: string; created_at: string }>
  milestones: Array<{ id: string; status: string; updated_at: string }>
  reflections: Array<{ id: string; created_at: string }>
  resources: Array<{ id: string; updated_at: string; status: string }>  // resource_responses
  stories: Array<{ id: string; shared_at: string }>
  storyComments: Array<{ id: string; created_at: string; author_type: 'practitioner' | 'member' }>
  files: Array<{ id: string; created_at: string }>
  bookings: Array<{ id: string; start_time: string; status: string }>
  pulseSentiment: 'progressing' | 'stable' | 'plateau' | 'attention' | null
}

function daysAgo(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

function recentCount<T>(items: T[], getDate: (x: T) => string, withinDays: number): number {
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000
  return items.filter(i => new Date(getDate(i)).getTime() >= cutoff).length
}

/**
 * Sessions sub-score: blends attendance (last 3 mo) + recency.
 * Returns 0..1.
 */
function scoreSessions(d: PatientData): number {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const recent = d.sessions.filter(s => new Date(s.scheduled_at).getTime() >= ninetyDaysAgo)
  const completed = recent.filter(s => s.status === 'completed').length
  const past = recent.filter(s => s.status !== 'scheduled').length
  const attendance = past > 0 ? completed / past : 0.5

  const lastD = daysAgo(d.lastSessionAt)
  const recency = lastD === null ? 0
    : lastD <= 7 ? 1
    : lastD <= 14 ? 0.7
    : lastD <= 30 ? 0.4
    : lastD <= 60 ? 0.15
    : 0

  return attendance * 0.4 + recency * 0.6
}

function scoreNotes(d: PatientData): number {
  const recent30 = recentCount(d.notes, n => n.created_at, 30)
  const recent90 = recentCount(d.notes, n => n.created_at, 90)
  if (recent30 >= 3) return 1
  if (recent30 >= 1) return 0.7
  if (recent90 >= 1) return 0.35
  return 0
}

function scoreMilestones(d: PatientData): number {
  if (d.milestones.length === 0) return 0
  const recent30 = recentCount(d.milestones, m => m.updated_at, 30)
  const recent90 = recentCount(d.milestones, m => m.updated_at, 90)
  if (recent30 >= 1) return 1
  if (recent90 >= 1) return 0.5
  return 0.2 // has goals but inactive — still better than nothing
}

function scoreReflections(d: PatientData): number {
  const recent14 = recentCount(d.reflections, r => r.created_at, 14)
  const recent30 = recentCount(d.reflections, r => r.created_at, 30)
  if (recent14 >= 5) return 1
  if (recent14 >= 1) return 0.7
  if (recent30 >= 1) return 0.4
  return 0
}

function scoreResources(d: PatientData): number {
  const submitted = d.resources.filter(r => r.status === 'submitted' || r.status === 'reviewed')
  const recent30 = recentCount(submitted, r => r.updated_at, 30)
  const recent90 = recentCount(submitted, r => r.updated_at, 90)
  if (recent30 >= 2) return 1
  if (recent30 >= 1) return 0.7
  if (recent90 >= 1) return 0.35
  return 0
}

function scoreStories(d: PatientData): number {
  const recentShares = recentCount(d.stories, s => s.shared_at, 30)
  const recentMemberComments = d.storyComments
    .filter(c => c.author_type === 'member')
    .filter(c => Date.now() - new Date(c.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000)
    .length
  if (recentShares + recentMemberComments >= 3) return 1
  if (recentShares + recentMemberComments >= 1) return 0.7
  // has any history?
  if (d.stories.length > 0) return 0.2
  return 0
}

function scoreFiles(d: PatientData): number {
  const recent60 = recentCount(d.files, f => f.created_at, 60)
  if (recent60 >= 2) return 1
  if (recent60 >= 1) return 0.6
  if (d.files.length > 0) return 0.2
  return 0
}

function scoreBookings(d: PatientData): number {
  const upcoming = d.bookings.filter(b => new Date(b.start_time).getTime() > Date.now()).length
  const recent60 = recentCount(d.bookings, b => b.start_time, 60)
  if (upcoming >= 1) return 1
  if (recent60 >= 1) return 0.5
  return 0
}

const SCORERS: Record<EngagementSignalId, (d: PatientData) => number> = {
  sessions: scoreSessions,
  notes: scoreNotes,
  milestones: scoreMilestones,
  reflections: scoreReflections,
  resources: scoreResources,
  stories: scoreStories,
  files: scoreFiles,
  bookings: scoreBookings,
}

export interface EngagementResult {
  score: number              // 0..100
  tier: 'ontrack' | 'watch' | 'checkin'
  perSignal: Partial<Record<EngagementSignalId, { sub: number; contributed: number }>>
  riskReason: string
  pulseOverride: 'up' | 'down' | null  // if Pulse override was applied
}

export function tierFromScore(score: number): 'ontrack' | 'watch' | 'checkin' {
  if (score >= 70) return 'ontrack'
  if (score >= 40) return 'watch'
  return 'checkin'
}

export function computeEngagement(
  data: PatientData,
  settings: EngagementSettings,
  locale: 'en' | 'fr' | 'es' = 'en',
): EngagementResult {
  const perSignal: EngagementResult['perSignal'] = {}
  let score = 0
  let totalWeight = 0

  for (const id of Object.keys(SCORERS) as EngagementSignalId[]) {
    const cfg = settings.signals[id]
    if (!cfg?.enabled) continue
    const sub = SCORERS[id](data) // 0..1
    const contributed = sub * cfg.weight
    perSignal[id] = { sub, contributed }
    score += contributed
    totalWeight += cfg.weight
  }

  // Rescale to 0..100 if total weight differs from 100 (e.g. user disabled some)
  if (totalWeight > 0 && totalWeight !== 100) {
    score = (score / totalWeight) * 100
  }
  score = Math.max(0, Math.min(100, Math.round(score)))

  let tier = tierFromScore(score)

  // Optional Pulse sentiment override
  let pulseOverride: 'up' | 'down' | null = null
  if (settings.pulseSentimentOverride && data.pulseSentiment) {
    if (data.pulseSentiment === 'attention') {
      tier = 'checkin'
      pulseOverride = 'down'
    } else if (data.pulseSentiment === 'progressing') {
      tier = 'ontrack'
      pulseOverride = 'up'
    }
  }

  // Risk reason — same heuristics as before, locale-aware
  const lastD = daysAgo(data.lastSessionAt)
  const cancellations = data.sessions.filter(s => {
    if (s.status !== 'cancelled') return false
    return Date.now() - new Date(s.scheduled_at).getTime() <= 90 * 24 * 60 * 60 * 1000
  }).length
  let riskReason = ''
  if (lastD === null) {
    riskReason = locale === 'fr' ? 'Pas encore rencontré' : locale === 'es' ? 'Aún no se han visto' : 'Not yet met'
  } else if (lastD > 14) {
    const weeks = Math.floor(lastD / 7)
    riskReason = locale === 'fr' ? `Il y a ${weeks > 0 ? weeks + ' semaine' + (weeks > 1 ? 's' : '') : Math.floor(lastD) + ' jours'}`
      : locale === 'es' ? `Hace ${weeks > 0 ? weeks + ' semana' + (weeks > 1 ? 's' : '') : Math.floor(lastD) + ' días'}`
      : `${weeks > 0 ? weeks + ' week' + (weeks > 1 ? 's' : '') : Math.floor(lastD) + ' days'} ago`
  } else if (cancellations >= 2) {
    riskReason = locale === 'fr' ? `${cancellations} séances annulées récemment` : locale === 'es' ? `${cancellations} sesiones canceladas recientemente` : `${cancellations} sessions cancelled recently`
  } else {
    riskReason = locale === 'fr' ? 'Moins actif récemment' : locale === 'es' ? 'Menos activo recientemente' : 'Less active recently'
  }

  return { score, tier, perSignal, riskReason, pulseOverride }
}

/** Read settings from the JSONB column, with safe defaults if missing/malformed */
export function parseEngagementSettings(raw: unknown): EngagementSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_ENGAGEMENT_SETTINGS
  const obj = raw as Partial<EngagementSettings>
  const merged: EngagementSettings = {
    preset: (obj.preset as EngagementPreset) || 'all',
    signals: { ...DEFAULT_ENGAGEMENT_SETTINGS.signals },
    pulseSentimentOverride: !!obj.pulseSentimentOverride,
  }
  if (obj.signals && typeof obj.signals === 'object') {
    for (const id of Object.keys(merged.signals) as EngagementSignalId[]) {
      const incoming = (obj.signals as Record<string, unknown>)[id]
      if (incoming && typeof incoming === 'object') {
        const ic = incoming as Partial<EngagementSignalConfig>
        merged.signals[id] = {
          enabled: ic.enabled !== undefined ? !!ic.enabled : merged.signals[id].enabled,
          weight: typeof ic.weight === 'number' ? Math.max(0, Math.min(100, ic.weight)) : merged.signals[id].weight,
        }
      }
    }
  }
  return merged
}

export const SIGNAL_LABELS: Record<EngagementSignalId, { en: string; fr: string; es: string }> = {
  sessions:    { en: 'Sessions',          fr: 'Séances',                es: 'Sesiones' },
  notes:       { en: 'Progress notes',    fr: 'Notes',                  es: 'Notas' },
  milestones:  { en: 'Goals',             fr: 'Axes de travail',        es: 'Objetivos' },
  reflections: { en: 'Patient reflections', fr: 'Réflexions du patient', es: 'Reflexiones' },
  resources:   { en: 'Resource submissions', fr: 'Réponses aux ressources', es: 'Envíos de recursos' },
  stories:     { en: 'Stories',           fr: 'Histoires',              es: 'Historias' },
  files:       { en: 'Files',             fr: 'Fichiers',               es: 'Archivos' },
  bookings:    { en: 'Self-bookings',     fr: 'Auto-réservations',      es: 'Auto-reservas' },
}
