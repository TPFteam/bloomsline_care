import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// Practitioner Context Builder
// Gathers all practitioner data for Bloom Assistant
// ============================================

export interface PractitionerContext {
  members: MemberSummary[]
  sessions: SessionSummary[]
  milestones: MilestoneSummary[]
  notes: NoteSummary[]
  resources: ResourceSummary[]
  assignments: AssignmentSummary[]
  totals: PracticeTotals
  // Newly added context — Bloom now reads content, not just metadata.
  pulses: PulseSummary[]
  reflections: ReflectionSummary[]
  sharedMoments: MomentSummary[]
  patientStories: StorySummary[]
  resourceResponses: ResponseSummary[]
  bookings: BookingSummary[]
}

interface MemberSummary {
  id: string
  user_id: string | null
  name: string
  status: string
  engagement_level: string
  last_session_at: string | null
  created_at: string
  about_notes: string | null
  internal_notes: string | null
  // Compact one-liners pulled from member.preferences JSONB so the
  // prompt doesn't carry the full nested object.
  preferences_digest: string | null
}

interface PulseSummary {
  member_id: string
  generated_at: string
  current_status: string
  themes: string[]
  attention: string[]
}

interface ReflectionSummary {
  member_id: string
  mood_value: number | null
  gratitude_entries: string[] | null
  created_at: string
}

interface MomentSummary {
  member_id: string
  type: string
  moods: string[]
  text: string | null
  created_at: string
  shared_at: string | null
  comments: Array<{ author_type: 'practitioner' | 'member'; content: string }>
}

interface StorySummary {
  member_id: string
  title: string | null
  excerpt: string | null
  shared_at: string
}

interface ResponseSummary {
  member_id: string
  resource_title: string | null
  resource_type: string | null
  status: string
  submitted_at: string | null
  answers_digest: string | null
}

interface BookingSummary {
  id: string
  member_id: string
  start_time: string
  status: string
  session_type: string | null
  session_format: string | null
}

interface SessionSummary {
  id: string
  member_id: string
  session_type: string
  scheduled_at: string
  status: string
  mood_rating: number | null
}

interface MilestoneSummary {
  id: string
  member_id: string
  title: string
  status: string
  category: string
  target_date: string | null
}

interface NoteSummary {
  id: string
  member_id: string
  title: string | null
  note_type: string
  content_excerpt: string | null
  created_at: string
}

interface ResourceSummary {
  id: string
  type: string
  title: string
  status: string
  times_assigned: number
  times_completed: number
}

interface AssignmentSummary {
  id: string
  resource_id: string
  member_id: string
  status: string
  due_date: string | null
}

interface PracticeTotals {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  pendingMembers: number
  sessionsThisWeek: number
  sessionsThisMonth: number
  completedSessions: number
  cancelledSessions: number
  noShowSessions: number
  totalMilestones: number
  totalResources: number
}

/**
 * Fetch all practitioner data from Supabase in parallel
 */
export async function buildPractitionerContext(
  supabase: SupabaseClient,
  practitionerId: string
): Promise<PractitionerContext> {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now)
  monthAgo.setMonth(monthAgo.getMonth() - 1)

  const [
    membersResult,
    sessionsResult,
    milestonesResult,
    notesResult,
    resourcesResult,
    assignmentsResult,
    pulsesResult,
    reflectionsResult,
    storiesResult,
    responsesResult,
    bookingsResult,
  ] = await Promise.all([
    supabase
      .from('members')
      .select('id, user_id, first_name, last_name, status, engagement_level, last_session_at, created_at, is_demo, about_notes, internal_notes, preferences')
      .eq('practitioner_id', practitionerId)
      .eq('is_demo', false)
      .order('last_session_at', { ascending: false, nullsFirst: false }),

    supabase
      .from('sessions')
      .select('id, member_id, session_type, scheduled_at, status, mood_rating')
      .eq('practitioner_id', practitionerId)
      .order('scheduled_at', { ascending: false })
      .limit(200),

    supabase
      .from('milestones')
      .select('id, member_id, title, status, category, target_date')
      .eq('practitioner_id', practitionerId),

    // Note CONTENT now included (truncated). Practitioners were
    // confused by Bloom answering vaguely about notes — it literally
    // wasn't reading the text. 80 most recent across the practice.
    supabase
      .from('progress_notes')
      .select('id, member_id, title, note_type, content, created_at')
      .eq('practitioner_id', practitionerId)
      .order('created_at', { ascending: false })
      .limit(80),

    supabase
      .from('resources')
      .select('id, type, title, status, times_assigned, times_completed')
      .eq('practitioner_id', practitionerId),

    supabase
      .from('resource_assignments')
      .select('id, resource_id, member_id, status, due_date')
      .eq('practitioner_id', practitionerId)
      .order('created_at', { ascending: false })
      .limit(200),

    // Latest Bloom Pulse per member. We sort by generated_at desc
    // here and dedupe in JS so we always have the freshest digest
    // for each patient.
    supabase
      .from('member_summaries')
      .select('member_id, generated_at, summary_content')
      .eq('practitioner_id', practitionerId)
      .order('generated_at', { ascending: false })
      .limit(120),

    // Patient-side reflections (mood + gratitude) from the mobile
    // app. Newest 80 across the practice — typical caseloads stay
    // well within this budget.
    supabase
      .from('member_reflections')
      .select('member_id, mood_value, gratitude_entries, created_at')
      .order('created_at', { ascending: false })
      .limit(80),

    // Patient-shared stories with this practitioner. Joins stories
    // for title + content excerpt.
    supabase
      .from('story_shares')
      .select('member_id, shared_at, story:stories!inner(title, content)')
      .eq('practitioner_id', practitionerId)
      .order('shared_at', { ascending: false })
      .limit(40),

    // Submitted resource responses with a compact digest of answers.
    supabase
      .from('resource_responses')
      .select('member_id, status, submitted_at, resource:resources(title, type), answers')
      .eq('practitioner_id', practitionerId)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(60),

    // Bookings timeline — sessions only catches mirrored rows;
    // bookings carries the source-of-truth status (pending /
    // confirmed / cancelled / no_show) the practitioner actually
    // works with.
    supabase
      .from('bookings')
      .select('id, member_id, start_time, status, session_type, session_format')
      .eq('practitioner_id', practitionerId)
      .order('start_time', { ascending: false })
      .limit(150),
  ])

  // Shared moments — keyed by users.id (auth uid), not members.id, so
  // we resolve the auth ids from members then issue one .in() query
  // afterwards. Same for moment_comments grouped by moment_id.
  const memberAuthIds = (membersResult.data || [])
    .map((m: { user_id: string | null }) => m.user_id)
    .filter((x): x is string => !!x)
  let sharedMomentsRows: Array<{
    id: string; user_id: string; type: string; moods: string[] | null;
    caption: string | null; text_content: string | null;
    created_at: string; shared_with_practitioner_at: string | null
  }> = []
  let momentCommentsByMomentId = new Map<string, Array<{ author_type: 'practitioner' | 'member'; content: string }>>()
  if (memberAuthIds.length > 0) {
    const { data: momentsRaw } = await supabase
      .from('moments')
      .select('id, user_id, type, moods, caption, text_content, created_at, shared_with_practitioner_at')
      .in('user_id', memberAuthIds)
      .not('shared_with_practitioner_at', 'is', null)
      .order('shared_with_practitioner_at', { ascending: false })
      .limit(60)
    sharedMomentsRows = (momentsRaw || []) as typeof sharedMomentsRows
    if (sharedMomentsRows.length > 0) {
      const momentIds = sharedMomentsRows.map(m => m.id)
      const { data: cmtRows } = await supabase
        .from('moment_comments')
        .select('moment_id, author_type, content')
        .in('moment_id', momentIds)
        .order('created_at', { ascending: true })
      for (const c of (cmtRows || []) as Array<{ moment_id: string; author_type: 'practitioner' | 'member'; content: string }>) {
        const list = momentCommentsByMomentId.get(c.moment_id) || []
        list.push({ author_type: c.author_type, content: c.content })
        momentCommentsByMomentId.set(c.moment_id, list)
      }
    }
  }

  const allMembers = (membersResult.data || [])
  const members: MemberSummary[] = allMembers.slice(0, 50).map(m => ({
    id: m.id,
    user_id: m.user_id || null,
    name: `${m.first_name} ${m.last_name}`.trim(),
    status: m.status,
    engagement_level: m.engagement_level,
    last_session_at: m.last_session_at,
    created_at: m.created_at,
    about_notes: m.about_notes || null,
    internal_notes: m.internal_notes || null,
    preferences_digest: digestPreferences(m.preferences),
  }))
  // user_id → member.id map. Lets us re-attach moments (keyed by
  // auth uid) back to the member record they belong to.
  const memberByUserId = new Map<string, string>()
  for (const m of allMembers) {
    if (m.user_id) memberByUserId.set(m.user_id, m.id)
  }

  const sessions: SessionSummary[] = (sessionsResult.data || []).map(s => ({
    id: s.id,
    member_id: s.member_id,
    session_type: s.session_type,
    scheduled_at: s.scheduled_at,
    status: s.status,
    mood_rating: s.mood_rating,
  }))

  const milestones: MilestoneSummary[] = (milestonesResult.data || []).map(m => ({
    id: m.id,
    member_id: m.member_id,
    title: m.title,
    status: m.status,
    category: m.category,
    target_date: m.target_date,
  }))

  const notes: NoteSummary[] = (notesResult.data || []).map((n: { id: string; member_id: string; title: string | null; note_type: string; content: string | null; created_at: string }) => ({
    id: n.id,
    member_id: n.member_id,
    title: n.title,
    note_type: n.note_type,
    content_excerpt: digestNoteContent(n.content),
    created_at: n.created_at,
  }))

  const resources: ResourceSummary[] = (resourcesResult.data || []).map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    status: r.status,
    times_assigned: r.times_assigned,
    times_completed: r.times_completed,
  }))

  const assignments: AssignmentSummary[] = (assignmentsResult.data || []).map(a => ({
    id: a.id,
    resource_id: a.resource_id,
    member_id: a.member_id,
    status: a.status,
    due_date: a.due_date,
  }))

  // Compute totals
  const weekAgoStr = weekAgo.toISOString()
  const monthAgoStr = monthAgo.toISOString()

  const totals: PracticeTotals = {
    totalMembers: allMembers.length,
    activeMembers: allMembers.filter(m => m.status === 'active').length,
    inactiveMembers: allMembers.filter(m => m.status === 'inactive').length,
    pendingMembers: allMembers.filter(m => m.status === 'pending').length,
    sessionsThisWeek: sessions.filter(s => s.scheduled_at >= weekAgoStr).length,
    sessionsThisMonth: sessions.filter(s => s.scheduled_at >= monthAgoStr).length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
    noShowSessions: sessions.filter(s => s.status === 'no_show').length,
    totalMilestones: milestones.length,
    totalResources: resources.length,
  }

  // ── Pulses: keep only the latest entry per member ──
  const seenPulse = new Set<string>()
  const pulses: PulseSummary[] = []
  for (const row of (pulsesResult.data || []) as Array<{ member_id: string; generated_at: string; summary_content: unknown }>) {
    if (seenPulse.has(row.member_id)) continue
    seenPulse.add(row.member_id)
    const c = (row.summary_content || {}) as { current_status?: string; key_themes?: string[]; areas_of_attention?: string[] }
    pulses.push({
      member_id: row.member_id,
      generated_at: row.generated_at,
      current_status: (c.current_status || '').toString().slice(0, 400),
      themes: Array.isArray(c.key_themes) ? c.key_themes.slice(0, 3) : [],
      attention: Array.isArray(c.areas_of_attention) ? c.areas_of_attention.slice(0, 3) : [],
    })
  }

  const reflections: ReflectionSummary[] = (reflectionsResult.data || []).map((r: { member_id: string; mood_value: number | null; gratitude_entries: string[] | null; created_at: string }) => ({
    member_id: r.member_id,
    mood_value: r.mood_value,
    gratitude_entries: r.gratitude_entries,
    created_at: r.created_at,
  }))

  const sharedMoments: MomentSummary[] = sharedMomentsRows.map(m => {
    const memId = memberByUserId.get(m.user_id) || ''
    return {
      member_id: memId,
      type: m.type,
      moods: m.moods || [],
      text: (m.text_content || m.caption || null)?.slice(0, 240) || null,
      created_at: m.created_at,
      shared_at: m.shared_with_practitioner_at,
      comments: (momentCommentsByMomentId.get(m.id) || []).slice(0, 3).map(c => ({
        author_type: c.author_type,
        content: c.content.slice(0, 200),
      })),
    }
  }).filter(m => m.member_id)

  const patientStories: StorySummary[] = (storiesResult.data || []).map((s: { member_id: string; shared_at: string; story?: { title: string | null; content: unknown } | Array<{ title: string | null; content: unknown }> }) => {
    const story = Array.isArray(s.story) ? s.story[0] : s.story
    return {
      member_id: s.member_id,
      title: story?.title ?? null,
      excerpt: digestStoryContent(story?.content),
      shared_at: s.shared_at,
    }
  })

  const resourceResponses: ResponseSummary[] = (responsesResult.data || []).map((r: { member_id: string; status: string; submitted_at: string | null; resource?: { title: string | null; type: string | null } | Array<{ title: string | null; type: string | null }>; answers: unknown }) => {
    const resource = Array.isArray(r.resource) ? r.resource[0] : r.resource
    return {
      member_id: r.member_id,
      resource_title: resource?.title ?? null,
      resource_type: resource?.type ?? null,
      status: r.status,
      submitted_at: r.submitted_at,
      answers_digest: digestResponseAnswers(r.answers),
    }
  })

  const bookings: BookingSummary[] = (bookingsResult.data || []).map((b: { id: string; member_id: string; start_time: string; status: string; session_type: string | null; session_format: string | null }) => ({
    id: b.id,
    member_id: b.member_id,
    start_time: b.start_time,
    status: b.status,
    session_type: b.session_type,
    session_format: b.session_format,
  }))

  return { members, sessions, milestones, notes, resources, assignments, totals, pulses, reflections, sharedMoments, patientStories, resourceResponses, bookings }
}

// ── Compaction helpers ─────────────────────────────────────────────

function digestPreferences(prefs: unknown): string | null {
  if (!prefs || typeof prefs !== 'object') return null
  const p = prefs as Record<string, unknown>
  const parts: string[] = []
  for (const key of ['communication_style', 'key_strengths', 'areas_of_sensitivity', 'therapeutic_context', 'current_treatment']) {
    const v = p[key]
    if (typeof v === 'string' && v.trim()) parts.push(`${key.replace(/_/g, ' ')}: ${v.trim().slice(0, 120)}`)
  }
  return parts.length > 0 ? parts.join(' · ').slice(0, 320) : null
}

function digestNoteContent(content: string | null): string | null {
  if (!content) return null
  // progress_notes.content can carry HTML from the rich editor. Strip
  // tags + collapse whitespace before truncating.
  const stripped = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > 0 ? stripped.slice(0, 220) : null
}

function digestStoryContent(content: unknown): string | null {
  if (!content) return null
  let blocks: unknown[] = []
  if (Array.isArray(content)) blocks = content
  else if (typeof content === 'string') return content.trim().slice(0, 280) || null
  else if (typeof content === 'object' && content !== null) {
    const maybe = (content as { blocks?: unknown[] }).blocks
    if (Array.isArray(maybe)) blocks = maybe
  }
  const parts: string[] = []
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue
    const block = b as { content?: { text?: string } }
    if (typeof block.content?.text === 'string' && block.content.text.trim()) {
      parts.push(block.content.text.trim())
    }
    if (parts.join(' ').length > 300) break
  }
  const joined = parts.join(' · ').trim()
  return joined.length > 0 ? joined.slice(0, 280) : null
}

function digestResponseAnswers(answers: unknown): string | null {
  if (!answers || typeof answers !== 'object') return null
  const obj = answers as Record<string, unknown>
  const lines: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    let v: string
    if (value === null || value === undefined) v = '—'
    else if (Array.isArray(value)) v = value.map(x => String(x)).join(', ')
    else if (typeof value === 'object') {
      const o = value as Record<string, unknown>
      v = typeof o.value !== 'undefined' ? String(o.value) : JSON.stringify(o)
    } else {
      v = String(value)
    }
    lines.push(`${key}: ${v.slice(0, 80)}`)
    if (lines.join(' · ').length > 220) break
  }
  return lines.length > 0 ? lines.join(' · ').slice(0, 260) : null
}

/**
 * Format practitioner context into a compact text summary for Claude's system prompt
 */
export function formatPractitionerContextForPrompt(
  context: PractitionerContext,
  locale: 'en' | 'fr' | 'es' = 'en'
): string {
  const { members, sessions, milestones, notes, resources, assignments, totals } = context
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString()

  // Build member name lookup
  const memberName = new Map(members.map(m => [m.id, m.name]))

  // ── PRACTICE OVERVIEW ──
  const overview = `PRACTICE OVERVIEW:
- Total members: ${totals.totalMembers} (${totals.activeMembers} active, ${totals.inactiveMembers} inactive, ${totals.pendingMembers} pending)
- Sessions this week: ${totals.sessionsThisWeek} | This month: ${totals.sessionsThisMonth}
- Completed: ${totals.completedSessions} | Cancelled: ${totals.cancelledSessions} | No-shows: ${totals.noShowSessions}
- Milestones: ${totals.totalMilestones} | Resources: ${totals.totalResources}
- Engagement: ${members.filter(m => m.engagement_level === 'high').length} high, ${members.filter(m => m.engagement_level === 'medium').length} medium, ${members.filter(m => m.engagement_level === 'low').length} low`

  // ── MEMBERS ──
  let membersSection: string
  if (members.length === 0) {
    membersSection = `\nMEMBERS:\nNo members yet.`
  } else {
    const memberLines = members.map(m => {
      const memberMilestones = milestones.filter(ms => ms.member_id === m.id)
      const memberSessions = sessions.filter(s => s.member_id === m.id)
      const recentMoods = memberSessions
        .filter(s => s.mood_rating !== null)
        .slice(0, 3)
        .map(s => s.mood_rating)

      const lastSession = m.last_session_at
        ? formatRelative(m.last_session_at)
        : 'never'
      const moodStr = recentMoods.length > 0
        ? ` | Mood trend: ${recentMoods.join(', ')}/10`
        : ''

      return `  - ${m.name}: ${m.status}, ${m.engagement_level} engagement, last session ${lastSession}, ${memberMilestones.length} milestones${moodStr}`
    })

    const truncated = totals.totalMembers > 50
      ? `\n  (Showing 50 most recently active of ${totals.totalMembers} total)`
      : ''

    membersSection = `\nMEMBERS:${truncated}\n${memberLines.join('\n')}`
  }

  // ── SESSION PATTERNS ──
  const completedWithMood = sessions.filter(s => s.status === 'completed' && s.mood_rating !== null)
  const avgMood = completedWithMood.length > 0
    ? (completedWithMood.reduce((sum, s) => sum + (s.mood_rating || 0), 0) / completedWithMood.length).toFixed(1)
    : 'N/A'

  const typeCounts: Record<string, number> = {}
  sessions.forEach(s => {
    typeCounts[s.session_type] = (typeCounts[s.session_type] || 0) + 1
  })
  const typeBreakdown = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type.replace(/_/g, ' ')}: ${count}`)
    .join(', ')

  const completionRate = sessions.length > 0
    ? Math.round((totals.completedSessions / sessions.length) * 100)
    : 0

  const sessionSection = `\nSESSION PATTERNS:
- Type breakdown: ${typeBreakdown || 'none'}
- Completion rate: ${completionRate}%
- Average mood (completed): ${avgMood}/10`

  // ── MILESTONES ──
  const milestoneByStatus: Record<string, number> = {}
  milestones.forEach(m => {
    milestoneByStatus[m.status] = (milestoneByStatus[m.status] || 0) + 1
  })
  const statusBreakdown = Object.entries(milestoneByStatus)
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ')

  const overdue = milestones.filter(m =>
    m.target_date && new Date(m.target_date) < now && m.status !== 'independent'
  )
  const recentlyAchieved = milestones.filter(m => m.status === 'independent')

  const milestoneSection = `\nMILESTONES:
- By status: ${statusBreakdown || 'none'}
- Overdue: ${overdue.length}${overdue.length > 0 ? ` (${overdue.slice(0, 5).map(m => `"${m.title}" for ${memberName.get(m.member_id) || 'unknown'}`).join('; ')})` : ''}
- Achieved: ${recentlyAchieved.length}`

  // ── RESOURCES ──
  const publishedResources = resources.filter(r => r.status === 'published')
  const totalAssigned = assignments.length
  const completedAssignments = assignments.filter(a => a.status === 'completed').length
  const assignmentCompletionRate = totalAssigned > 0
    ? Math.round((completedAssignments / totalAssigned) * 100)
    : 0

  const resourceSection = `\nRESOURCES:
- Library: ${resources.length} total (${publishedResources.length} published)
- Assignments: ${totalAssigned} total, ${completedAssignments} completed (${assignmentCompletionRate}% rate)`

  // ── LAST 7 DAYS ──
  const recentSessions = sessions.filter(s => s.scheduled_at >= weekAgoStr)
  const recentCompleted = recentSessions.filter(s => s.status === 'completed')
  const recentCancelled = recentSessions.filter(s => s.status === 'cancelled')
  const recentNoShow = recentSessions.filter(s => s.status === 'no_show')

  // Members needing follow-up: active members with no session in 14+ days
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const needFollowUp = members.filter(m =>
    m.status === 'active' &&
    (!m.last_session_at || new Date(m.last_session_at) < twoWeeksAgo)
  )

  const last7Section = `\nLAST 7 DAYS:
- Sessions: ${recentSessions.length} (${recentCompleted.length} completed, ${recentCancelled.length} cancelled, ${recentNoShow.length} no-shows)
- Members needing follow-up (14+ days since last session): ${needFollowUp.length}${needFollowUp.length > 0 ? ` — ${needFollowUp.slice(0, 8).map(m => m.name).join(', ')}` : ''}`

  // ── BLOOM PULSE DIGESTS ──
  const pulseLines = context.pulses
    .filter(p => memberName.has(p.member_id))
    .slice(0, 15)
    .map(p => {
      const themes = p.themes.length > 0 ? ` Themes: ${p.themes.join(', ')}.` : ''
      const attention = p.attention.length > 0 ? ` Attention: ${p.attention.join(', ')}.` : ''
      return `  - ${memberName.get(p.member_id)}: ${p.current_status}${themes}${attention}`
    })
  const pulseSection = pulseLines.length > 0
    ? `\nBLOOM PULSE DIGESTS (most recent AI summary per patient):\n${pulseLines.join('\n')}`
    : ''

  // ── RECENT NOTE EXCERPTS ──
  const recentNoteLines = notes
    .filter(n => n.content_excerpt)
    .slice(0, 20)
    .map(n => `  - [${formatRelative(n.created_at)}] ${memberName.get(n.member_id) || 'unknown'} · ${n.note_type}: "${n.content_excerpt}"`)
  const notesSection = recentNoteLines.length > 0
    ? `\nRECENT NOTES (excerpts):\n${recentNoteLines.join('\n')}`
    : ''

  // ── REFLECTIONS (mobile app mood + gratitude) ──
  const recentReflections = context.reflections.slice(0, 15)
  let reflectionsSection = ''
  if (recentReflections.length > 0) {
    const lines = recentReflections.map(r => {
      const who = memberName.get(r.member_id) || 'unknown'
      const mood = r.mood_value !== null ? `mood ${r.mood_value}/10` : 'no mood'
      const grat = r.gratitude_entries && r.gratitude_entries.length > 0
        ? ` · grateful for: ${r.gratitude_entries.slice(0, 2).join(', ')}`
        : ''
      return `  - [${formatRelative(r.created_at)}] ${who}: ${mood}${grat}`
    })
    reflectionsSection = `\nPATIENT REFLECTIONS (mobile app):\n${lines.join('\n')}`
  }

  // ── SHARED MOMENTS ──
  const recentMoments = context.sharedMoments.slice(0, 20)
  let momentsSection = ''
  if (recentMoments.length > 0) {
    const lines = recentMoments.map(m => {
      const who = memberName.get(m.member_id) || 'unknown'
      const when = formatRelative(m.shared_at || m.created_at)
      const moods = m.moods.length > 0 ? ` · moods: ${m.moods.join(', ')}` : ''
      const text = m.text ? ` · "${m.text}"` : ''
      const reply = m.comments.length > 0
        ? `\n      conversation: ${m.comments.map(c => `[${c.author_type}] ${c.content}`).join(' / ')}`
        : ''
      return `  - [${when}] ${who} · ${m.type}${moods}${text}${reply}`
    })
    momentsSection = `\nSHARED MOMENTS (B2C mobile app):\n${lines.join('\n')}`
  }

  // ── PATIENT JOURNAL / STORIES ──
  const recentStories = context.patientStories.slice(0, 10)
  let storiesSection = ''
  if (recentStories.length > 0) {
    const lines = recentStories.map(s => {
      const who = memberName.get(s.member_id) || 'unknown'
      const head = `  - [${formatRelative(s.shared_at)}] ${who} · "${s.title || 'Untitled'}"`
      return s.excerpt ? `${head}: ${s.excerpt}` : head
    })
    storiesSection = `\nPATIENT JOURNAL ENTRIES SHARED:\n${lines.join('\n')}`
  }

  // ── RESOURCE RESPONSES ──
  const recentResponses = context.resourceResponses.slice(0, 12)
  let responsesSection = ''
  if (recentResponses.length > 0) {
    const lines = recentResponses.map(r => {
      const who = memberName.get(r.member_id) || 'unknown'
      const when = r.submitted_at ? formatRelative(r.submitted_at) : '—'
      const head = `  - [${when}] ${who} · ${r.resource_title || 'Resource'} (${r.resource_type || 'unknown'}) · ${r.status}`
      return r.answers_digest ? `${head}: ${r.answers_digest}` : head
    })
    responsesSection = `\nRESOURCE RESPONSES (worksheets / assessments submitted):\n${lines.join('\n')}`
  }

  // ── BOOKINGS TIMELINE ──
  const upcomingBookings = context.bookings
    .filter(b => new Date(b.start_time) >= now && b.status !== 'cancelled')
    .slice(0, 8)
  const recentNoShowOrCancelled = context.bookings
    .filter(b => (b.status === 'no_show' || b.status === 'cancelled') && new Date(b.start_time) < now)
    .slice(0, 5)
  let bookingsSection = ''
  if (upcomingBookings.length > 0 || recentNoShowOrCancelled.length > 0) {
    const lines: string[] = []
    if (upcomingBookings.length > 0) {
      lines.push('  Upcoming:')
      for (const b of upcomingBookings) {
        const who = memberName.get(b.member_id) || 'unknown'
        lines.push(`    - ${new Date(b.start_time).toISOString().slice(0, 16).replace('T', ' ')} · ${who} · ${b.session_type || '—'} · ${b.session_format || '—'} · ${b.status}`)
      }
    }
    if (recentNoShowOrCancelled.length > 0) {
      lines.push('  Recent no-shows / cancellations:')
      for (const b of recentNoShowOrCancelled) {
        const who = memberName.get(b.member_id) || 'unknown'
        lines.push(`    - ${formatRelative(b.start_time)} · ${who} · ${b.status}`)
      }
    }
    bookingsSection = `\nBOOKINGS TIMELINE:\n${lines.join('\n')}`
  }

  // ── MEMBER PROFILE NOTES ──
  const profileLines: string[] = []
  for (const m of members) {
    const parts: string[] = []
    if (m.about_notes) parts.push(`about: ${m.about_notes.slice(0, 160)}`)
    if (m.internal_notes) parts.push(`internal: ${m.internal_notes.slice(0, 160)}`)
    if (m.preferences_digest) parts.push(m.preferences_digest)
    if (parts.length > 0) profileLines.push(`  - ${m.name}: ${parts.join(' · ')}`)
  }
  const profileSection = profileLines.length > 0
    ? `\nMEMBER PROFILE NOTES:\n${profileLines.slice(0, 25).join('\n')}`
    : ''

  // Locale instruction
  const localeInstruction = locale === 'fr'
    ? '\nIMPORTANT: Respond in French.'
    : locale === 'es'
      ? '\nIMPORTANT: Respond in Spanish.'
      : ''

  return `${overview}${membersSection}${sessionSection}${milestoneSection}${resourceSection}${last7Section}${pulseSection}${notesSection}${reflectionsSection}${momentsSection}${storiesSection}${responsesSection}${bookingsSection}${profileSection}${localeInstruction}`
}

function formatRelative(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60) return '1 month ago'
  return `${Math.floor(diffDays / 30)} months ago`
}
