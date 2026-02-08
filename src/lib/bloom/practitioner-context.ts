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
}

interface MemberSummary {
  id: string
  name: string
  status: string
  engagement_level: string
  last_session_at: string | null
  created_at: string
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
  ] = await Promise.all([
    supabase
      .from('members')
      .select('id, first_name, last_name, status, engagement_level, last_session_at, created_at, is_demo')
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

    supabase
      .from('progress_notes')
      .select('id, member_id, title, note_type, created_at')
      .eq('practitioner_id', practitionerId)
      .order('created_at', { ascending: false })
      .limit(100),

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
  ])

  const allMembers = (membersResult.data || [])
  const members: MemberSummary[] = allMembers.slice(0, 50).map(m => ({
    id: m.id,
    name: `${m.first_name} ${m.last_name}`.trim(),
    status: m.status,
    engagement_level: m.engagement_level,
    last_session_at: m.last_session_at,
    created_at: m.created_at,
  }))

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

  const notes: NoteSummary[] = (notesResult.data || []).map(n => ({
    id: n.id,
    member_id: n.member_id,
    title: n.title,
    note_type: n.note_type,
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

  return { members, sessions, milestones, notes, resources, assignments, totals }
}

/**
 * Format practitioner context into a compact text summary for Claude's system prompt
 */
export function formatPractitionerContextForPrompt(
  context: PractitionerContext,
  locale: 'en' | 'fr' | 'es' = 'en'
): string {
  const { members, sessions, milestones, resources, assignments, totals } = context
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

  // Locale instruction
  const localeInstruction = locale === 'fr'
    ? '\nIMPORTANT: Respond in French.'
    : locale === 'es'
      ? '\nIMPORTANT: Respond in Spanish.'
      : ''

  return `${overview}${membersSection}${sessionSection}${milestoneSection}${resourceSection}${last7Section}${localeInstruction}`
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
