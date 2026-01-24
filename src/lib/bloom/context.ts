import { SupabaseClient } from '@supabase/supabase-js'
import { getUserInsights, formatInsightsForPrompt, type StoredInsight } from './patterns'

// ============================================
// Bloom Context Builder
// Gathers all user data to give Bloom full awareness
// ============================================

export interface BloomContext {
  today: TodaySnapshot
  thisWeek: WeeklyTrends
  patterns: DetectedPatterns
  storedInsights: StoredInsight[]
  entryPoint: EntryPoint
}

export interface TodaySnapshot {
  balance: {
    sleep: number // minutes
    work: number
    life: number
    targets: { sleep: number; work: number; life: number }
    hasLogged: boolean
  }
  moments: {
    count: number
    moods: string[]
    latestCaption?: string
  }
  rituals: {
    completed: number
    total: number
    completedNames: string[]
    missedNames: string[]
  }
  anchors: {
    grow: { name: string; completed: boolean }[]
    letGo: { name: string; completed: boolean }[]
    totalGrow: number
    totalLetGo: number
    completedGrow: number
    completedLetGo: number
  }
}

export interface WeeklyTrends {
  balance: {
    avgSleep: number // hours
    avgWork: number
    avgLife: number
    sleepTrend: 'improving' | 'declining' | 'stable'
    workTrend: 'increasing' | 'decreasing' | 'stable'
  }
  moods: {
    positive: number // percentage
    negative: number
    topMoods: string[]
  }
  rituals: {
    completionRate: number // percentage
  }
  anchors: {
    growCompletionRate: number // percentage
    letGoCompletionRate: number // percentage
    totalLogs: number
    topGrowAnchors: string[]
    topLetGoAnchors: string[]
  }
  momentsCount: number
}

export interface DetectedPatterns {
  insights: string[]
}

export type EntryPoint = 'home' | 'balance' | 'moments' | 'rituals' | 'progress' | 'reflect' | 'anchors' | 'general'

/**
 * Build comprehensive context for Bloom AI
 */
export async function buildBloomContext(
  supabase: SupabaseClient,
  userId: string,
  entryPoint: EntryPoint = 'general'
): Promise<BloomContext> {
  // Fetch all context data in parallel
  const [today, thisWeek, storedInsights] = await Promise.all([
    getTodaySnapshot(supabase, userId),
    getWeeklyTrends(supabase, userId),
    getUserInsights(supabase, userId),
  ])

  const patterns = detectPatterns(today, thisWeek)

  return {
    today,
    thisWeek,
    patterns,
    storedInsights,
    entryPoint,
  }
}

/**
 * Get today's data snapshot
 */
async function getTodaySnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<TodaySnapshot> {
  const todayStr = new Date().toISOString().split('T')[0]

  // Get member_id from user_id
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .single()

  const memberId = member?.id

  // Get today's balance entry
  let balance: TodaySnapshot['balance'] = {
    sleep: 0,
    work: 0,
    life: 0,
    targets: { sleep: 480, work: 480, life: 480 }, // default 8h each
    hasLogged: false,
  }

  if (memberId) {
    // Get targets from balance_settings
    const { data: settings } = await supabase
      .from('balance_settings')
      .select('sleep_target, work_target, life_target')
      .eq('member_id', memberId)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    if (settings) {
      balance.targets = {
        sleep: settings.sleep_target,
        work: settings.work_target,
        life: settings.life_target,
      }
    }

    // Get today's balance entry
    const { data: balanceEntry } = await supabase
      .from('balance_entries')
      .select('*')
      .eq('member_id', memberId)
      .eq('date', todayStr)
      .single()

    if (balanceEntry) {
      // Calculate totals from activities or use _total fields
      const sleepTotal = balanceEntry.sleep_total ||
        (balanceEntry.sleep_night || 0) + (balanceEntry.sleep_nap || 0)
      const workTotal = balanceEntry.work_total ||
        (balanceEntry.work_deep || 0) + (balanceEntry.work_meetings || 0) + (balanceEntry.work_admin || 0)
      const lifeTotal = balanceEntry.life_total ||
        (balanceEntry.life_exercise || 0) + (balanceEntry.life_social || 0) +
        (balanceEntry.life_hobby || 0) + (balanceEntry.life_rest || 0)

      balance = {
        ...balance,
        sleep: sleepTotal,
        work: workTotal,
        life: lifeTotal,
        hasLogged: true,
      }
    }
  }

  // Get today's moments
  const todayStart = new Date(todayStr)
  const todayEnd = new Date(todayStr)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const { data: moments } = await supabase
    .from('moments')
    .select('moods, caption, text_content')
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString())

  const allMoods: string[] = []
  moments?.forEach(m => {
    if (m.moods) allMoods.push(...m.moods)
  })

  const momentSnapshot: TodaySnapshot['moments'] = {
    count: moments?.length || 0,
    moods: [...new Set(allMoods)], // unique moods
    latestCaption: moments?.[0]?.caption || moments?.[0]?.text_content?.slice(0, 100),
  }

  // Get today's rituals
  let rituals: TodaySnapshot['rituals'] = {
    completed: 0,
    total: 0,
    completedNames: [],
    missedNames: [],
  }

  if (memberId) {
    // Get active rituals
    const { data: activeRituals } = await supabase
      .from('rituals')
      .select('id, name')
      .eq('member_id', memberId)
      .eq('is_active', true)

    // Get today's ritual completions
    const { data: completions } = await supabase
      .from('ritual_completions')
      .select('ritual_id')
      .eq('member_id', memberId)
      .eq('completed_date', todayStr)

    const completedIds = new Set(completions?.map(c => c.ritual_id) || [])
    const completedNames: string[] = []
    const missedNames: string[] = []

    activeRituals?.forEach(r => {
      if (completedIds.has(r.id)) {
        completedNames.push(r.name)
      } else {
        missedNames.push(r.name)
      }
    })

    rituals = {
      completed: completedNames.length,
      total: activeRituals?.length || 0,
      completedNames,
      missedNames,
    }
  }

  // Get today's anchors
  let anchors: TodaySnapshot['anchors'] = {
    grow: [],
    letGo: [],
    totalGrow: 0,
    totalLetGo: 0,
    completedGrow: 0,
    completedLetGo: 0,
  }

  if (memberId) {
    // Get all active anchors
    const { data: memberAnchors } = await supabase
      .from('member_anchors')
      .select('id, label_en, type, is_active')
      .eq('member_id', memberId)
      .eq('is_active', true)

    // Get today's anchor logs (presence of a log = completed)
    const { data: anchorLogs } = await supabase
      .from('anchor_logs')
      .select('anchor_id')
      .eq('member_id', memberId)
      .eq('log_date', todayStr)

    const completedSet = new Set(anchorLogs?.map(l => l.anchor_id) || [])

    const growAnchors: { name: string; completed: boolean }[] = []
    const letGoAnchors: { name: string; completed: boolean }[] = []

    memberAnchors?.forEach(anchor => {
      const completed = completedSet.has(anchor.id)
      if (anchor.type === 'grow') {
        growAnchors.push({ name: anchor.label_en, completed })
      } else {
        letGoAnchors.push({ name: anchor.label_en, completed })
      }
    })

    anchors = {
      grow: growAnchors,
      letGo: letGoAnchors,
      totalGrow: growAnchors.length,
      totalLetGo: letGoAnchors.length,
      completedGrow: growAnchors.filter(a => a.completed).length,
      completedLetGo: letGoAnchors.filter(a => a.completed).length,
    }
  }

  return { balance, moments: momentSnapshot, rituals, anchors }
}

/**
 * Get weekly trends (last 7 days)
 */
async function getWeeklyTrends(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyTrends> {
  const today = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Get member_id
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .single()

  const memberId = member?.id

  // Balance trends
  let balanceTrends: WeeklyTrends['balance'] = {
    avgSleep: 0,
    avgWork: 0,
    avgLife: 0,
    sleepTrend: 'stable',
    workTrend: 'stable',
  }

  if (memberId) {
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    const { data: balanceEntries } = await supabase
      .from('balance_entries')
      .select('date, sleep_total, work_total, life_total, sleep_night, sleep_nap, work_deep, work_meetings, work_admin, life_exercise, life_social, life_hobby, life_rest')
      .eq('member_id', memberId)
      .gte('date', weekAgoStr)
      .lte('date', todayStr)
      .order('date', { ascending: true })

    if (balanceEntries && balanceEntries.length > 0) {
      let totalSleep = 0, totalWork = 0, totalLife = 0

      balanceEntries.forEach(entry => {
        const sleep = entry.sleep_total || (entry.sleep_night || 0) + (entry.sleep_nap || 0)
        const work = entry.work_total || (entry.work_deep || 0) + (entry.work_meetings || 0) + (entry.work_admin || 0)
        const life = entry.life_total || (entry.life_exercise || 0) + (entry.life_social || 0) + (entry.life_hobby || 0) + (entry.life_rest || 0)

        totalSleep += sleep
        totalWork += work
        totalLife += life
      })

      const count = balanceEntries.length
      balanceTrends.avgSleep = Math.round((totalSleep / count / 60) * 10) / 10 // hours
      balanceTrends.avgWork = Math.round((totalWork / count / 60) * 10) / 10
      balanceTrends.avgLife = Math.round((totalLife / count / 60) * 10) / 10

      // Calculate trends (compare first half vs second half of week)
      if (balanceEntries.length >= 4) {
        const midpoint = Math.floor(balanceEntries.length / 2)
        const firstHalf = balanceEntries.slice(0, midpoint)
        const secondHalf = balanceEntries.slice(midpoint)

        const avgFirst = (arr: typeof balanceEntries, field: 'sleep_total' | 'work_total') => {
          return arr.reduce((sum, e) => sum + (e[field] || 0), 0) / arr.length
        }

        const sleepFirst = avgFirst(firstHalf, 'sleep_total')
        const sleepSecond = avgFirst(secondHalf, 'sleep_total')
        const workFirst = avgFirst(firstHalf, 'work_total')
        const workSecond = avgFirst(secondHalf, 'work_total')

        balanceTrends.sleepTrend = sleepSecond > sleepFirst * 1.1 ? 'improving' :
                                   sleepSecond < sleepFirst * 0.9 ? 'declining' : 'stable'
        balanceTrends.workTrend = workSecond > workFirst * 1.1 ? 'increasing' :
                                  workSecond < workFirst * 0.9 ? 'decreasing' : 'stable'
      }
    }
  }

  // Mood trends from moments
  const { data: weekMoments } = await supabase
    .from('moments')
    .select('moods')
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString())

  const positiveMoods = ['grateful', 'peaceful', 'joyful', 'inspired', 'loved', 'calm', 'hopeful', 'proud']
  const moodCounts: Record<string, number> = {}
  let positiveCount = 0
  let totalMoodCount = 0

  weekMoments?.forEach(m => {
    m.moods?.forEach((mood: string) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
      totalMoodCount++
      if (positiveMoods.includes(mood)) positiveCount++
    })
  })

  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood)

  const moodTrends: WeeklyTrends['moods'] = {
    positive: totalMoodCount > 0 ? Math.round((positiveCount / totalMoodCount) * 100) : 0,
    negative: totalMoodCount > 0 ? Math.round(((totalMoodCount - positiveCount) / totalMoodCount) * 100) : 0,
    topMoods,
  }

  // Ritual completion rate
  let ritualRate = 0
  if (memberId) {
    const { data: activeRituals } = await supabase
      .from('rituals')
      .select('id')
      .eq('member_id', memberId)
      .eq('is_active', true)

    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    const { data: completions } = await supabase
      .from('ritual_completions')
      .select('id')
      .eq('member_id', memberId)
      .gte('completed_date', weekAgoStr)

    const possibleCompletions = (activeRituals?.length || 0) * 7
    ritualRate = possibleCompletions > 0
      ? Math.round(((completions?.length || 0) / possibleCompletions) * 100)
      : 0
  }

  // Anchor trends
  let anchorTrends: WeeklyTrends['anchors'] = {
    growCompletionRate: 0,
    letGoCompletionRate: 0,
    totalLogs: 0,
    topGrowAnchors: [],
    topLetGoAnchors: [],
  }

  if (memberId) {
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    // Get all active anchors
    const { data: memberAnchors } = await supabase
      .from('member_anchors')
      .select('id, label_en, type')
      .eq('member_id', memberId)
      .eq('is_active', true)

    // Get this week's anchor logs (presence of log = completed)
    const { data: weekAnchorLogs } = await supabase
      .from('anchor_logs')
      .select('anchor_id, log_date')
      .eq('member_id', memberId)
      .gte('log_date', weekAgoStr)
      .lte('log_date', todayStr)

    // Count completions per anchor
    const anchorCompletions: Record<string, number> = {}
    let growCompleted = 0
    let letGoCompleted = 0
    let growPossible = 0
    let letGoPossible = 0

    const anchorInfoMap = new Map(memberAnchors?.map(a => [a.id, { name: a.label_en, type: a.type }]) || [])

    // Calculate possible completions (anchors * 7 days)
    memberAnchors?.forEach(anchor => {
      if (anchor.type === 'grow') {
        growPossible += 7
      } else {
        letGoPossible += 7
      }
    })

    weekAnchorLogs?.forEach(log => {
      const anchorInfo = anchorInfoMap.get(log.anchor_id)
      if (anchorInfo) {
        anchorCompletions[anchorInfo.name] = (anchorCompletions[anchorInfo.name] || 0) + 1
        if (anchorInfo.type === 'grow') {
          growCompleted++
        } else {
          letGoCompleted++
        }
      }
    })

    // Get top anchors by completion count
    const sortedAnchors = Object.entries(anchorCompletions)
      .sort((a, b) => b[1] - a[1])

    const topGrow: string[] = []
    const topLetGo: string[] = []

    sortedAnchors.forEach(([name]) => {
      const anchor = memberAnchors?.find(a => a.label_en === name)
      if (anchor?.type === 'grow' && topGrow.length < 3) {
        topGrow.push(name)
      } else if (anchor?.type === 'letgo' && topLetGo.length < 3) {
        topLetGo.push(name)
      }
    })

    anchorTrends = {
      growCompletionRate: growPossible > 0 ? Math.round((growCompleted / growPossible) * 100) : 0,
      letGoCompletionRate: letGoPossible > 0 ? Math.round((letGoCompleted / letGoPossible) * 100) : 0,
      totalLogs: weekAnchorLogs?.length || 0,
      topGrowAnchors: topGrow,
      topLetGoAnchors: topLetGo,
    }
  }

  return {
    balance: balanceTrends,
    moods: moodTrends,
    rituals: { completionRate: ritualRate },
    anchors: anchorTrends,
    momentsCount: weekMoments?.length || 0,
  }
}

/**
 * Detect patterns and generate insights
 */
function detectPatterns(today: TodaySnapshot, week: WeeklyTrends): DetectedPatterns {
  const insights: string[] = []

  // Sleep patterns
  if (week.balance.avgSleep < 6) {
    insights.push('User is sleep deprived (avg under 6 hours)')
  } else if (week.balance.avgSleep >= 7.5) {
    insights.push('User is getting good sleep (7.5+ hours)')
  }

  if (week.balance.sleepTrend === 'declining') {
    insights.push('Sleep has been declining this week')
  } else if (week.balance.sleepTrend === 'improving') {
    insights.push('Sleep has been improving this week')
  }

  // Work patterns
  if (week.balance.avgWork > 9) {
    insights.push('User is working long hours (9+ daily)')
  }

  if (week.balance.workTrend === 'increasing') {
    insights.push('Work hours have been increasing')
  }

  // Life balance
  if (week.balance.avgLife < 2) {
    insights.push('User has little personal time (under 2 hours daily)')
  }

  // Mood patterns
  if (week.moods.positive < 40 && week.moods.topMoods.length > 0) {
    insights.push(`User has been feeling mostly ${week.moods.topMoods.join(', ')}`)
  } else if (week.moods.positive >= 70) {
    insights.push('User has been in a positive emotional state')
  }

  // Ritual patterns
  if (week.rituals.completionRate < 30 && today.rituals.total > 0) {
    insights.push('Ritual completion is low this week')
  } else if (week.rituals.completionRate >= 80) {
    insights.push('User is consistent with rituals')
  }

  // Today specific
  if (!today.balance.hasLogged && !today.moments.count) {
    insights.push('User has not logged anything today yet')
  }

  if (today.rituals.total > 0 && today.rituals.completed === 0) {
    insights.push(`User hasn't completed any rituals today (${today.rituals.missedNames.join(', ')})`)
  }

  // Anchor patterns
  const totalAnchors = today.anchors.totalGrow + today.anchors.totalLetGo
  const completedAnchors = today.anchors.completedGrow + today.anchors.completedLetGo

  if (totalAnchors > 0) {
    if (completedAnchors === totalAnchors) {
      insights.push('User has completed all their daily anchors/habits today')
    } else if (completedAnchors === 0) {
      const growNames = today.anchors.grow.map(a => a.name).join(', ')
      const letGoNames = today.anchors.letGo.map(a => a.name).join(', ')
      insights.push(`User has not completed any anchors today. Grow habits: ${growNames}. Let go habits: ${letGoNames}`)
    } else {
      const completed = [...today.anchors.grow.filter(a => a.completed), ...today.anchors.letGo.filter(a => a.completed)]
      const incomplete = [...today.anchors.grow.filter(a => !a.completed), ...today.anchors.letGo.filter(a => !a.completed)]
      insights.push(`User completed ${completedAnchors}/${totalAnchors} anchors. Done: ${completed.map(a => a.name).join(', ')}. Remaining: ${incomplete.map(a => a.name).join(', ')}`)
    }
  }

  // Weekly anchor trends - but only if they didn't complete everything today
  // If they completed today, focus on that positive, not weekly criticism
  const completedAllToday = completedAnchors === totalAnchors && totalAnchors > 0

  if (week.anchors.growCompletionRate >= 70) {
    insights.push('User is consistent with their Grow habits this week')
  } else if (week.anchors.growCompletionRate < 30 && week.anchors.topGrowAnchors.length > 0 && !completedAllToday) {
    // Only mention weekly struggle if they also didn't do well today
    insights.push('User has low Grow habit completion this week (may have just started tracking)')
  }

  if (week.anchors.letGoCompletionRate >= 70) {
    insights.push('User is doing well avoiding things they want to let go of')
  } else if (week.anchors.letGoCompletionRate < 30 && week.anchors.topLetGoAnchors.length > 0 && !completedAllToday) {
    insights.push('User has low Let Go habit completion this week (may have just started tracking)')
  }

  return { insights }
}

/**
 * Format context for the AI system prompt
 */
export function formatContextForPrompt(context: BloomContext, locale: 'en' | 'fr' = 'en'): string {
  const { today, thisWeek, patterns, storedInsights } = context

  const formatHours = (mins: number) => `${Math.round(mins / 60 * 10) / 10}h`

  // Check if user has been active this week
  const hasWeeklyData = thisWeek.momentsCount > 0 || thisWeek.balance.avgSleep > 0 || thisWeek.rituals.completionRate > 0 || thisWeek.anchors.totalLogs > 0
  const hasTodayData = today.balance.hasLogged || today.moments.count > 0 || today.rituals.completed > 0 || (today.anchors.completedGrow + today.anchors.completedLetGo) > 0

  // Format anchors for today
  const formatTodayAnchors = (loc: 'en' | 'fr') => {
    const totalAnchors = today.anchors.totalGrow + today.anchors.totalLetGo
    if (totalAnchors === 0) return loc === 'fr' ? '- Ancres: aucune configurée' : '- Anchors: none configured'

    const growDone = today.anchors.grow.filter(a => a.completed).map(a => a.name)
    const growRemaining = today.anchors.grow.filter(a => !a.completed).map(a => a.name)
    const letGoAvoided = today.anchors.letGo.filter(a => a.completed).map(a => a.name)
    const letGoSlipped = today.anchors.letGo.filter(a => !a.completed).map(a => a.name)

    if (loc === 'fr') {
      return `- Habitudes Grandir: ${today.anchors.completedGrow}/${today.anchors.totalGrow} faites${growDone.length ? ` (faits: ${growDone.join(', ')})` : ''}${growRemaining.length ? ` (restants: ${growRemaining.join(', ')})` : ''}
- Habitudes Lâcher: ${letGoSlipped.length === 0 ? 'Tout évité ✓' : `${letGoSlipped.length} écart(s)`}${letGoAvoided.length ? ` (évités: ${letGoAvoided.join(', ')})` : ''}${letGoSlipped.length ? ` (écarts: ${letGoSlipped.join(', ')})` : ''}`
    }
    return `- Grow habits: ${today.anchors.completedGrow}/${today.anchors.totalGrow} done${growDone.length ? ` (done: ${growDone.join(', ')})` : ''}${growRemaining.length ? ` (remaining: ${growRemaining.join(', ')})` : ''}
- Let Go habits: ${letGoSlipped.length === 0 ? 'All avoided ✓' : `${letGoSlipped.length} slip(s)`}${letGoAvoided.length ? ` (avoided: ${letGoAvoided.join(', ')})` : ''}${letGoSlipped.length ? ` (slipped: ${letGoSlipped.join(', ')})` : ''}`
  }

  // Today section
  const todaySection = locale === 'fr' ? `
AUJOURD'HUI:
- Sommeil: ${today.balance.hasLogged ? formatHours(today.balance.sleep) : 'non enregistré'} (objectif: ${formatHours(today.balance.targets.sleep)})
- Travail: ${today.balance.hasLogged ? formatHours(today.balance.work) : 'non enregistré'} (objectif: ${formatHours(today.balance.targets.work)})
- Vie perso: ${today.balance.hasLogged ? formatHours(today.balance.life) : 'non enregistré'} (objectif: ${formatHours(today.balance.targets.life)})
- Moments capturés: ${today.moments.count}${today.moments.moods.length > 0 ? ` (humeurs: ${today.moments.moods.join(', ')})` : ''}
- Rituels: ${today.rituals.completed}/${today.rituals.total} complétés${today.rituals.missedNames.length > 0 ? ` (manqués: ${today.rituals.missedNames.join(', ')})` : ''}
${formatTodayAnchors('fr')}
${!hasTodayData ? '*** L\'utilisateur n\'a rien enregistré aujourd\'hui ***' : ''}
` : `
TODAY:
- Sleep: ${today.balance.hasLogged ? formatHours(today.balance.sleep) : 'not logged'} (target: ${formatHours(today.balance.targets.sleep)})
- Work: ${today.balance.hasLogged ? formatHours(today.balance.work) : 'not logged'} (target: ${formatHours(today.balance.targets.work)})
- Life: ${today.balance.hasLogged ? formatHours(today.balance.life) : 'not logged'} (target: ${formatHours(today.balance.targets.life)})
- Moments captured: ${today.moments.count}${today.moments.moods.length > 0 ? ` (moods: ${today.moments.moods.join(', ')})` : ''}
- Rituals: ${today.rituals.completed}/${today.rituals.total} done${today.rituals.missedNames.length > 0 ? ` (missed: ${today.rituals.missedNames.join(', ')})` : ''}
${formatTodayAnchors('en')}
${!hasTodayData ? '*** User has not logged anything today ***' : ''}
`

  // Format weekly anchors
  const formatWeekAnchors = (loc: 'en' | 'fr') => {
    if (thisWeek.anchors.totalLogs === 0 && thisWeek.anchors.topGrowAnchors.length === 0 && thisWeek.anchors.topLetGoAnchors.length === 0) {
      return loc === 'fr' ? '- Ancres: aucune donnée cette semaine' : '- Anchors: no data this week'
    }
    if (loc === 'fr') {
      return `- Ancres Grandir: ${thisWeek.anchors.growCompletionRate}% de complétion${thisWeek.anchors.topGrowAnchors.length > 0 ? ` (meilleures: ${thisWeek.anchors.topGrowAnchors.join(', ')})` : ''}
- Ancres Lâcher: ${thisWeek.anchors.letGoCompletionRate}% de complétion${thisWeek.anchors.topLetGoAnchors.length > 0 ? ` (meilleures: ${thisWeek.anchors.topLetGoAnchors.join(', ')})` : ''}`
    }
    return `- Grow anchors: ${thisWeek.anchors.growCompletionRate}% completion${thisWeek.anchors.topGrowAnchors.length > 0 ? ` (top: ${thisWeek.anchors.topGrowAnchors.join(', ')})` : ''}
- Let Go anchors: ${thisWeek.anchors.letGoCompletionRate}% completion${thisWeek.anchors.topLetGoAnchors.length > 0 ? ` (top: ${thisWeek.anchors.topLetGoAnchors.join(', ')})` : ''}`
  }

  // This week section
  const weekSection = locale === 'fr' ? `
CETTE SEMAINE:
${!hasWeeklyData ? '*** L\'utilisateur n\'a pas utilisé Bloomsline cette semaine - pas de données récentes ***\n' : ''}
- Sommeil moyen: ${thisWeek.balance.avgSleep}h/nuit (${thisWeek.balance.sleepTrend === 'improving' ? 'en amélioration' : thisWeek.balance.sleepTrend === 'declining' ? 'en baisse' : 'stable'})
- Travail moyen: ${thisWeek.balance.avgWork}h/jour (${thisWeek.balance.workTrend === 'increasing' ? 'en hausse' : thisWeek.balance.workTrend === 'decreasing' ? 'en baisse' : 'stable'})
- Vie perso moyenne: ${thisWeek.balance.avgLife}h/jour
- Humeurs: ${thisWeek.moods.positive}% positives${thisWeek.moods.topMoods.length > 0 ? ` (principales: ${thisWeek.moods.topMoods.join(', ')})` : ''}
- Rituels: ${thisWeek.rituals.completionRate}% de complétion
${formatWeekAnchors('fr')}
- Moments cette semaine: ${thisWeek.momentsCount}
` : `
THIS WEEK:
${!hasWeeklyData ? '*** User has NOT used Bloomsline this week - no recent data available ***\n' : ''}
- Avg sleep: ${thisWeek.balance.avgSleep}h/night (${thisWeek.balance.sleepTrend})
- Avg work: ${thisWeek.balance.avgWork}h/day (${thisWeek.balance.workTrend})
- Avg life: ${thisWeek.balance.avgLife}h/day
- Moods: ${thisWeek.moods.positive}% positive${thisWeek.moods.topMoods.length > 0 ? ` (top: ${thisWeek.moods.topMoods.join(', ')})` : ''}
- Rituals: ${thisWeek.rituals.completionRate}% completion
${formatWeekAnchors('en')}
- Moments this week: ${thisWeek.momentsCount}
`

  // Patterns section (real-time observations)
  const patternsSection = patterns.insights.length > 0
    ? (locale === 'fr' ? `
OBSERVATIONS RÉCENTES:
${patterns.insights.map(i => `- ${i}`).join('\n')}
` : `
RECENT OBSERVATIONS:
${patterns.insights.map(i => `- ${i}`).join('\n')}
`)
    : ''

  // Stored insights section (long-term patterns from database)
  const storedInsightsSection = formatInsightsForPrompt(storedInsights, locale)

  return `${todaySection}${weekSection}${patternsSection}${storedInsightsSection}`
}

/**
 * Get context-aware greeting based on entry point
 */
export function getContextAwareGreeting(
  context: BloomContext,
  locale: 'en' | 'fr' = 'en'
): string {
  const { today, thisWeek, entryPoint } = context
  const hour = new Date().getHours()

  const timeGreeting = locale === 'fr'
    ? (hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir')
    : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')

  // Entry point specific greetings
  switch (entryPoint) {
    case 'balance':
      if (!today.balance.hasLogged) {
        return locale === 'fr'
          ? `${timeGreeting}. Je vois que tu n'as pas encore enregistré ta journée. Comment te sens-tu ?`
          : `${timeGreeting}. I see you have not logged today yet. How are you feeling?`
      }
      if (today.balance.sleep < today.balance.targets.sleep * 0.7) {
        return locale === 'fr'
          ? `${timeGreeting}. Tu as l'air d'avoir peu dormi. Comment vas-tu ?`
          : `${timeGreeting}. Looks like you did not get much sleep. How are you holding up?`
      }
      return locale === 'fr'
        ? `${timeGreeting}. Comment va ton équilibre aujourd'hui ?`
        : `${timeGreeting}. How is your balance today?`

    case 'moments':
      if (today.moments.count === 0) {
        return locale === 'fr'
          ? `${timeGreeting}. Tu veux capturer un moment ou juste discuter ?`
          : `${timeGreeting}. Want to capture a moment or just chat?`
      }
      if (today.moments.moods.some(m => ['anxious', 'sad', 'frustrated'].includes(m))) {
        return locale === 'fr'
          ? `${timeGreeting}. J'ai vu que tu te sens un peu difficile aujourd'hui. Je suis là si tu veux en parler.`
          : `${timeGreeting}. I noticed you have been feeling a bit heavy today. Want to talk about it?`
      }
      return locale === 'fr'
        ? `${timeGreeting}. Tu as capturé ${today.moments.count} moment(s) aujourd'hui. Comment ça va ?`
        : `${timeGreeting}. You have captured ${today.moments.count} moment(s) today. How are you?`

    case 'rituals':
      if (today.rituals.completed === today.rituals.total && today.rituals.total > 0) {
        return locale === 'fr'
          ? `${timeGreeting}. Bravo, tous tes rituels sont faits ! Comment te sens-tu ?`
          : `${timeGreeting}. Nice, all your rituals are done. How are you feeling?`
      }
      if (today.rituals.completed === 0 && today.rituals.total > 0) {
        return locale === 'fr'
          ? `${timeGreeting}. Tu n'as pas encore fait tes rituels. Tout va bien ?`
          : `${timeGreeting}. Have not done your rituals yet. Everything okay?`
      }
      return locale === 'fr'
        ? `${timeGreeting}. Comment se passent tes rituels aujourd'hui ?`
        : `${timeGreeting}. How are your rituals going today?`

    case 'reflect':
      if (thisWeek.moods.positive < 40) {
        return locale === 'fr'
          ? `${timeGreeting}. Cette semaine a l'air un peu difficile. Tu veux qu'on en parle ?`
          : `${timeGreeting}. This week looks a bit tough. Want to talk about it?`
      }
      return locale === 'fr'
        ? `${timeGreeting}. J'ai vu ton résumé de la semaine. Comment tu te sens par rapport à tout ça ?`
        : `${timeGreeting}. I saw your weekly summary. How do you feel about it all?`

    case 'progress':
      return locale === 'fr'
        ? `${timeGreeting}. Tu regardes tes progrès. C'est bien de prendre du recul. Qu'est-ce qui te vient à l'esprit ?`
        : `${timeGreeting}. Looking at your progress. Good to reflect. What is on your mind?`

    case 'anchors':
      const totalAnchors = today.anchors.totalGrow + today.anchors.totalLetGo
      const completedAnchors = today.anchors.completedGrow + today.anchors.completedLetGo

      if (totalAnchors === 0) {
        return locale === 'fr'
          ? `${timeGreeting}. Tu veux définir des habitudes à développer ou à abandonner ?`
          : `${timeGreeting}. Want to set up some habits to grow or let go of?`
      }
      if (completedAnchors === totalAnchors) {
        return locale === 'fr'
          ? `${timeGreeting}. Bravo, toutes tes ancres sont faites ! Comment tu te sens ?`
          : `${timeGreeting}. Nice, all your anchors are done! How are you feeling?`
      }
      if (completedAnchors === 0) {
        return locale === 'fr'
          ? `${timeGreeting}. Comment avancent tes habitudes aujourd'hui ?`
          : `${timeGreeting}. How are your habits going today?`
      }
      return locale === 'fr'
        ? `${timeGreeting}. Tu as fait ${completedAnchors}/${totalAnchors} ancres. Besoin de motivation ?`
        : `${timeGreeting}. You've done ${completedAnchors}/${totalAnchors} anchors. Need some motivation?`

    case 'home':
    case 'general':
    default:
      // Smart default based on data
      if (!today.balance.hasLogged && today.moments.count === 0) {
        return locale === 'fr'
          ? `${timeGreeting}. Comment vas-tu aujourd'hui ?`
          : `${timeGreeting}. How are you doing today?`
      }
      if (thisWeek.balance.sleepTrend === 'declining') {
        return locale === 'fr'
          ? `${timeGreeting}. J'ai remarqué que ton sommeil a baissé cette semaine. Comment tu te sens ?`
          : `${timeGreeting}. I noticed your sleep has been declining this week. How are you feeling?`
      }
      return locale === 'fr'
        ? `${timeGreeting}. Qu'est-ce qui t'occupe l'esprit ?`
        : `${timeGreeting}. What is on your mind?`
  }
}
