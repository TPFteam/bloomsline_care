import { createClient } from '@/lib/supabase/browser-client'

// ============================================
// TYPES
// ============================================

export type Feeling = 'great' | 'good' | 'okay' | 'tired' | 'rough'

export interface DayConfirmation {
  id: string
  member_id: string
  confirmation_date: string
  feeling: Feeling
  created_at: string
}

export interface FeelingsSummary {
  confirmations: DayConfirmation[]
  thisWeekCounts: Record<Feeling, number>
  lastWeekCounts: Record<Feeling, number>
  mostCommonFeeling: Feeling | null
  trend: 'better' | 'same' | 'lower' | 'unknown'
}

export interface MomentsSummary {
  total: number
  thisWeek: number
  byType: {
    photo: number
    video: number
    voice: number
    write: number
  }
  topMoods: string[]
}

export interface ReflectionsSummary {
  total: number
  thisWeek: number
  byIntent: {
    discovery: number
    vent: number
    reflect: number
    gratitude: number
  }
  averageMood: number | null
  moodTrend: 'up' | 'stable' | 'down' | 'unknown'
}

export interface RitualsSummary {
  activeRituals: number
  completedThisWeek: number
  totalPossibleThisWeek: number
  completionRate: number
  currentStreak: number
  topRituals: Array<{ name: string; completions: number }>
}

export interface BalanceSummary {
  sleepMinutes: number
  workMinutes: number
  lifeMinutes: number
  sleepTarget: number
  workTarget: number
  lifeTarget: number
  sleepPercentage: number
  workPercentage: number
  lifePercentage: number
}

export interface ProgressSummary {
  feelings: FeelingsSummary
  moments: MomentsSummary
  reflections: ReflectionsSummary
  rituals: RitualsSummary
  balance: BalanceSummary
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  return new Date(d.setDate(diff))
}

function formatDate(date: Date): string {
  // Use local date format (YYYY-MM-DD) to avoid timezone shifts
  return date.toLocaleDateString('en-CA')
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

/**
 * Get member ID for current user
 */
export async function getMemberId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return member?.id || null
  } catch {
    return null
  }
}

/**
 * Get day confirmations (feelings) for the past N days
 */
export async function getFeelingsSummary(memberId: string): Promise<FeelingsSummary> {
  const supabase = createClient()

  const today = new Date()
  const fourteenDaysAgo = new Date(today)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const startOfThisWeek = getStartOfWeek(today)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  let allConfirmations: DayConfirmation[] = []

  try {
    const { data: confirmations } = await supabase
      .from('day_confirmations')
      .select('*')
      .eq('member_id', memberId)
      .gte('confirmation_date', formatDate(fourteenDaysAgo))
      .order('confirmation_date', { ascending: false })

    allConfirmations = (confirmations || []) as DayConfirmation[]
  } catch {
    // Table might not exist
  }

  // Count feelings for this week and last week
  const thisWeekCounts: Record<Feeling, number> = { great: 0, good: 0, okay: 0, tired: 0, rough: 0 }
  const lastWeekCounts: Record<Feeling, number> = { great: 0, good: 0, okay: 0, tired: 0, rough: 0 }

  allConfirmations.forEach(c => {
    const date = new Date(c.confirmation_date)
    if (date >= startOfThisWeek) {
      thisWeekCounts[c.feeling]++
    } else if (date >= startOfLastWeek) {
      lastWeekCounts[c.feeling]++
    }
  })

  // Find most common feeling this week
  let mostCommonFeeling: Feeling | null = null
  let maxCount = 0
  Object.entries(thisWeekCounts).forEach(([feeling, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostCommonFeeling = feeling as Feeling
    }
  })

  // Calculate trend (positive feelings: great=5, good=4, okay=3, tired=2, rough=1)
  const feelingScore = (counts: Record<Feeling, number>): number => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    if (total === 0) return 0
    return (counts.great * 5 + counts.good * 4 + counts.okay * 3 + counts.tired * 2 + counts.rough * 1) / total
  }

  const thisWeekScore = feelingScore(thisWeekCounts)
  const lastWeekScore = feelingScore(lastWeekCounts)

  let trend: 'better' | 'same' | 'lower' | 'unknown' = 'unknown'
  if (Object.values(thisWeekCounts).some(c => c > 0) && Object.values(lastWeekCounts).some(c => c > 0)) {
    if (thisWeekScore > lastWeekScore + 0.3) trend = 'better'
    else if (thisWeekScore < lastWeekScore - 0.3) trend = 'lower'
    else trend = 'same'
  }

  return {
    confirmations: allConfirmations.slice(0, 7), // Last 7 entries
    thisWeekCounts,
    lastWeekCounts,
    mostCommonFeeling,
    trend
  }
}

/**
 * Get moments summary
 */
export async function getMomentsSummary(userId: string): Promise<MomentsSummary> {
  const supabase = createClient()

  const startOfWeek = getStartOfWeek(new Date())

  let allMoments: any[] = []

  try {
    const { data: moments } = await supabase
      .from('moments')
      .select('type, moods, created_at')
      .eq('user_id', userId)

    allMoments = moments || []
  } catch {
    // Table might not exist
  }

  const thisWeekMoments = allMoments.filter(m => new Date(m.created_at) >= startOfWeek)

  // Count by type
  const byType = { photo: 0, video: 0, voice: 0, write: 0 }
  thisWeekMoments.forEach(m => {
    if (m.type in byType) {
      byType[m.type as keyof typeof byType]++
    }
  })

  // Get top moods
  const moodCounts: Record<string, number> = {}
  allMoments.forEach(m => {
    (m.moods || []).forEach((mood: string) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
    })
  })
  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood)

  return {
    total: allMoments.length,
    thisWeek: thisWeekMoments.length,
    byType,
    topMoods
  }
}

/**
 * Get reflections summary
 */
export async function getReflectionsSummary(memberId: string): Promise<ReflectionsSummary> {
  const supabase = createClient()

  const startOfWeek = getStartOfWeek(new Date())
  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  let allReflections: any[] = []

  try {
    const { data: reflections } = await supabase
      .from('member_reflections')
      .select('intent, mood, created_at')
      .eq('member_id', memberId)

    allReflections = reflections || []
  } catch {
    // Table might not exist
  }

  const thisWeekReflections = allReflections.filter(r => new Date(r.created_at) >= startOfWeek)
  const lastWeekReflections = allReflections.filter(r => {
    const date = new Date(r.created_at)
    return date >= startOfLastWeek && date < startOfWeek
  })

  // Count by intent
  const byIntent = { discovery: 0, vent: 0, reflect: 0, gratitude: 0 }
  thisWeekReflections.forEach(r => {
    const intent = r.intent || 'reflect'
    if (intent in byIntent) {
      byIntent[intent as keyof typeof byIntent]++
    }
  })

  // Calculate average mood this week
  const moodsThisWeek = thisWeekReflections.filter(r => r.mood !== null).map(r => r.mood)
  const moodsLastWeek = lastWeekReflections.filter(r => r.mood !== null).map(r => r.mood)

  const averageMood = moodsThisWeek.length > 0
    ? moodsThisWeek.reduce((a, b) => a + b, 0) / moodsThisWeek.length
    : null

  // Mood trend
  let moodTrend: 'up' | 'stable' | 'down' | 'unknown' = 'unknown'
  if (moodsThisWeek.length > 0 && moodsLastWeek.length > 0) {
    const avgThis = moodsThisWeek.reduce((a, b) => a + b, 0) / moodsThisWeek.length
    const avgLast = moodsLastWeek.reduce((a, b) => a + b, 0) / moodsLastWeek.length
    if (avgThis > avgLast + 0.3) moodTrend = 'up'
    else if (avgThis < avgLast - 0.3) moodTrend = 'down'
    else moodTrend = 'stable'
  }

  return {
    total: allReflections.length,
    thisWeek: thisWeekReflections.length,
    byIntent,
    averageMood,
    moodTrend
  }
}

/**
 * Get rituals summary
 */
export async function getRitualsSummary(memberId: string): Promise<RitualsSummary> {
  const supabase = createClient()

  const today = new Date()
  const startOfWeek = getStartOfWeek(today)

  let activeRituals = 0
  let completedThisWeek = 0
  let currentStreak = 0
  const topRituals: Array<{ name: string; completions: number }> = []
  let memberRituals: any[] = []
  let completions: any[] = []

  try {
    // Get active rituals
    const { data } = await supabase
      .from('member_rituals')
      .select('id, ritual_id, rituals(name)')
      .eq('member_id', memberId)
      .eq('is_active', true)

    memberRituals = data || []
    activeRituals = memberRituals.length
  } catch {
    // Table might not exist
  }

  try {
    // Get completions this week
    const { data } = await supabase
      .from('ritual_completions')
      .select('ritual_id, completion_date, completed')
      .eq('member_id', memberId)
      .gte('completion_date', formatDate(startOfWeek))
      .eq('completed', true)

    completions = data || []
    completedThisWeek = completions.length
  } catch {
    // Table might not exist
  }

  // Calculate days since start of week
  const daysSinceMonday = Math.min(7, Math.floor((today.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const totalPossibleThisWeek = activeRituals * daysSinceMonday

  const completionRate = totalPossibleThisWeek > 0
    ? Math.round((completedThisWeek / totalPossibleThisWeek) * 100)
    : 0

  try {
    // Calculate streak (consecutive days with at least one completion)
    const { data: allCompletions } = await supabase
      .from('ritual_completions')
      .select('completion_date')
      .eq('member_id', memberId)
      .eq('completed', true)
      .order('completion_date', { ascending: false })

    if (allCompletions && allCompletions.length > 0) {
      const uniqueDates = [...new Set(allCompletions.map(c => c.completion_date))].sort().reverse()
      const todayStr = formatDate(today)
      const yesterdayStr = formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000))

      // Check if streak is active (completed today or yesterday)
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        currentStreak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1])
          const currDate = new Date(uniqueDates[i])
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }
  } catch {
    // Table might not exist
  }

  // Get top rituals by completion count
  const ritualCompletionCounts: Record<string, { name: string; count: number }> = {}
  if (completions.length > 0 && memberRituals.length > 0) {
    completions.forEach(c => {
      const ritual = memberRituals.find(r => r.ritual_id === c.ritual_id)
      const name = (ritual?.rituals as any)?.name || 'Unknown'
      if (!ritualCompletionCounts[c.ritual_id]) {
        ritualCompletionCounts[c.ritual_id] = { name, count: 0 }
      }
      ritualCompletionCounts[c.ritual_id].count++
    })
  }

  const sortedRituals = Object.values(ritualCompletionCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(r => ({ name: r.name, completions: r.count }))

  return {
    activeRituals,
    completedThisWeek,
    totalPossibleThisWeek,
    completionRate,
    currentStreak,
    topRituals: sortedRituals
  }
}

/**
 * Get balance summary
 */
export async function getBalanceSummary(memberId: string): Promise<BalanceSummary> {
  const supabase = createClient()

  const startOfWeek = getStartOfWeek(new Date())

  // Default values
  let sleepTarget = 480 // 8 hours default
  let workTarget = 480
  let lifeTarget = 480

  // Get settings (use maybeSingle to handle no rows gracefully)
  try {
    const { data: settings } = await supabase
      .from('balance_settings')
      .select('sleep_target, work_target, life_target')
      .eq('member_id', memberId)
      .maybeSingle()

    if (settings) {
      sleepTarget = settings.sleep_target || 480
      workTarget = settings.work_target || 480
      lifeTarget = settings.life_target || 480
    }
  } catch {
    // Table might not exist, use defaults
  }

  let sleepMinutes = 0
  let workMinutes = 0
  let lifeMinutes = 0

  // Get entries this week
  try {
    const { data: entries } = await supabase
      .from('balance_entries')
      .select('category, duration_minutes')
      .eq('member_id', memberId)
      .gte('entry_date', formatDate(startOfWeek))

    ;(entries || []).forEach(e => {
      if (e.category === 'sleep') sleepMinutes += e.duration_minutes
      else if (e.category === 'work') workMinutes += e.duration_minutes
      else if (e.category === 'life') lifeMinutes += e.duration_minutes
    })
  } catch {
    // Table might not exist
  }

  // Calculate days in week so far
  const today = new Date()
  const daysSinceMonday = Math.min(7, Math.floor((today.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  const weeklyTargetMultiplier = daysSinceMonday

  return {
    sleepMinutes,
    workMinutes,
    lifeMinutes,
    sleepTarget: sleepTarget * weeklyTargetMultiplier,
    workTarget: workTarget * weeklyTargetMultiplier,
    lifeTarget: lifeTarget * weeklyTargetMultiplier,
    sleepPercentage: Math.min(100, Math.round((sleepMinutes / (sleepTarget * weeklyTargetMultiplier)) * 100)) || 0,
    workPercentage: Math.min(100, Math.round((workMinutes / (workTarget * weeklyTargetMultiplier)) * 100)) || 0,
    lifePercentage: Math.min(100, Math.round((lifeMinutes / (lifeTarget * weeklyTargetMultiplier)) * 100)) || 0
  }
}

/**
 * Get complete progress summary
 */
export async function getProgressSummary(): Promise<ProgressSummary | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const memberId = await getMemberId()
  if (!memberId) return null

  const [feelings, moments, reflections, rituals, balance] = await Promise.all([
    getFeelingsSummary(memberId),
    getMomentsSummary(user.id),
    getReflectionsSummary(memberId),
    getRitualsSummary(memberId),
    getBalanceSummary(memberId)
  ])

  return {
    feelings,
    moments,
    reflections,
    rituals,
    balance
  }
}

// ============================================
// NARRATIVE & INSIGHTS GENERATION
// ============================================

export interface DailyNarrative {
  greeting: string
  mainMessage: string
  encouragement: string
  streaks: Array<{ label: string; value: number; icon: string }>
}

export interface ThreeThings {
  daysActive: { value: number; total: number }
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown'
  momentsCount: number
}

export interface WeeklyInsight {
  type: 'pattern' | 'achievement' | 'suggestion' | 'celebration'
  message: string
  icon: string
}

export interface CalendarDay {
  date: string
  activityLevel: 0 | 1 | 2 | 3 // 0=none, 1=low, 2=medium, 3=high
  hasRitual: boolean
  hasBalance: boolean
  hasReflection: boolean
  hasMoment: boolean
  mood?: string
}

/**
 * Generate daily narrative from progress data
 */
export function generateDailyNarrative(
  summary: ProgressSummary,
  locale: string = 'en'
): DailyNarrative {
  const { rituals, moments, reflections, feelings } = summary
  const isEn = locale !== 'fr'

  // Time-based greeting
  const hour = new Date().getHours()
  let greeting = ''
  if (hour < 12) {
    greeting = isEn ? 'Good morning' : 'Bonjour'
  } else if (hour < 18) {
    greeting = isEn ? 'Good afternoon' : 'Bon après-midi'
  } else {
    greeting = isEn ? 'Good evening' : 'Bonsoir'
  }

  // Build main message based on activity
  const parts: string[] = []

  if (rituals.completedThisWeek > 0) {
    parts.push(
      isEn
        ? `You completed ${rituals.completedThisWeek} ritual${rituals.completedThisWeek > 1 ? 's' : ''} this week`
        : `Vous avez complété ${rituals.completedThisWeek} rituel${rituals.completedThisWeek > 1 ? 's' : ''} cette semaine`
    )
  }

  if (moments.thisWeek > 0) {
    parts.push(
      isEn
        ? `captured ${moments.thisWeek} moment${moments.thisWeek > 1 ? 's' : ''}`
        : `capturé ${moments.thisWeek} moment${moments.thisWeek > 1 ? 's' : ''}`
    )
  }

  if (reflections.thisWeek > 0) {
    parts.push(
      isEn
        ? `reflected ${reflections.thisWeek} time${reflections.thisWeek > 1 ? 's' : ''}`
        : `réfléchi ${reflections.thisWeek} fois`
    )
  }

  let mainMessage = ''
  if (parts.length === 0) {
    mainMessage = isEn
      ? "Start your journey today - every small step counts."
      : "Commencez votre parcours aujourd'hui - chaque petit pas compte."
  } else if (parts.length === 1) {
    mainMessage = parts[0] + '.'
  } else {
    const lastPart = parts.pop()
    mainMessage = parts.join(', ') + (isEn ? ' and ' : ' et ') + lastPart + '.'
  }

  // Encouragement based on feeling trend
  let encouragement = ''
  if (feelings.trend === 'better') {
    encouragement = isEn
      ? "Your mood has been improving - keep it up! 🌟"
      : "Votre humeur s'améliore - continuez! 🌟"
  } else if (feelings.trend === 'same') {
    encouragement = isEn
      ? "You're staying consistent - that's powerful. 💪"
      : "Vous restez constant - c'est puissant. 💪"
  } else {
    encouragement = isEn
      ? "Every moment of self-care matters. ✨"
      : "Chaque moment de bien-être compte. ✨"
  }

  // Build activity badges - all showing "this week" data for consistency
  const streaks: Array<{ label: string; value: number; icon: string }> = []

  if (rituals.completedThisWeek > 0) {
    streaks.push({
      label: isEn ? 'Rituals' : 'Rituels',
      value: rituals.completedThisWeek,
      icon: 'sparkles'
    })
  }

  if (moments.thisWeek > 0) {
    streaks.push({
      label: isEn ? 'Moments' : 'Moments',
      value: moments.thisWeek,
      icon: 'camera'
    })
  }

  if (reflections.thisWeek > 0) {
    streaks.push({
      label: isEn ? 'Reflections' : 'Réflexions',
      value: reflections.thisWeek,
      icon: 'pen-line'
    })
  }

  return {
    greeting,
    mainMessage,
    encouragement,
    streaks
  }
}

/**
 * Generate three things summary
 */
export function generateThreeThings(summary: ProgressSummary): ThreeThings {
  const { rituals, feelings, moments } = summary

  // Calculate days active (days with at least one activity this week)
  // For now, estimate based on completions
  const estimatedDaysActive = Math.min(7, Math.ceil(rituals.completedThisWeek / Math.max(1, rituals.activeRituals)))

  // Mood trend
  let moodTrend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown'
  if (feelings.trend === 'better') moodTrend = 'improving'
  else if (feelings.trend === 'same') moodTrend = 'stable'
  else if (feelings.trend === 'lower') moodTrend = 'declining'

  return {
    daysActive: { value: estimatedDaysActive, total: 7 },
    moodTrend,
    momentsCount: moments.total
  }
}

/**
 * Generate weekly insights
 */
export function generateWeeklyInsights(
  summary: ProgressSummary,
  locale: string = 'en'
): WeeklyInsight[] {
  const { rituals, moments, reflections, feelings, balance } = summary
  const isEn = locale !== 'fr'
  const insights: WeeklyInsight[] = []

  // Streak achievement
  if (rituals.currentStreak >= 7) {
    insights.push({
      type: 'celebration',
      message: isEn
        ? `Amazing! You've maintained a ${rituals.currentStreak}-day streak!`
        : `Incroyable! Vous avez maintenu une série de ${rituals.currentStreak} jours!`,
      icon: '🎉'
    })
  } else if (rituals.currentStreak >= 3) {
    insights.push({
      type: 'achievement',
      message: isEn
        ? `${rituals.currentStreak} days in a row - you're building momentum!`
        : `${rituals.currentStreak} jours de suite - vous prenez de l'élan!`,
      icon: '🔥'
    })
  }

  // Mood improvement
  if (feelings.trend === 'better') {
    insights.push({
      type: 'pattern',
      message: isEn
        ? 'Your mood has been improving compared to last week.'
        : 'Votre humeur s\'améliore par rapport à la semaine dernière.',
      icon: '📈'
    })
  }

  // Top ritual
  if (rituals.topRituals.length > 0 && rituals.topRituals[0].completions >= 3) {
    insights.push({
      type: 'pattern',
      message: isEn
        ? `"${rituals.topRituals[0].name}" is your most consistent ritual.`
        : `"${rituals.topRituals[0].name}" est votre rituel le plus constant.`,
      icon: '⭐'
    })
  }

  // Moments captured
  if (moments.thisWeek >= 5) {
    insights.push({
      type: 'celebration',
      message: isEn
        ? `You captured ${moments.thisWeek} moments this week - wonderful!`
        : `Vous avez capturé ${moments.thisWeek} moments cette semaine - magnifique!`,
      icon: '📸'
    })
  } else if (moments.thisWeek >= 1) {
    insights.push({
      type: 'pattern',
      message: isEn
        ? `You've captured ${moments.thisWeek} moment${moments.thisWeek > 1 ? 's' : ''} - keep noticing the good!`
        : `Vous avez capturé ${moments.thisWeek} moment${moments.thisWeek > 1 ? 's' : ''} - continuez!`,
      icon: '📸'
    })
  }

  // Reflection consistency
  if (reflections.thisWeek >= 3) {
    insights.push({
      type: 'achievement',
      message: isEn
        ? 'Great reflection practice - you journaled multiple times!'
        : 'Excellente pratique de réflexion - vous avez écrit plusieurs fois!',
      icon: '✍️'
    })
  } else if (reflections.thisWeek >= 1) {
    insights.push({
      type: 'pattern',
      message: isEn
        ? 'You took time to reflect - that takes courage.'
        : 'Vous avez pris le temps de réfléchir - cela demande du courage.',
      icon: '✍️'
    })
  }

  // Rituals completed (any amount)
  if (rituals.completedThisWeek >= 1 && insights.length < 3) {
    insights.push({
      type: 'achievement',
      message: isEn
        ? `${rituals.completedThisWeek} ritual${rituals.completedThisWeek > 1 ? 's' : ''} completed - you're showing up for yourself!`
        : `${rituals.completedThisWeek} rituel${rituals.completedThisWeek > 1 ? 's' : ''} complété${rituals.completedThisWeek > 1 ? 's' : ''} - vous prenez soin de vous!`,
      icon: '✨'
    })
  }

  // Balance insight
  const avgBalance = (balance.sleepPercentage + balance.workPercentage + balance.lifePercentage) / 3
  if (avgBalance >= 70) {
    insights.push({
      type: 'achievement',
      message: isEn
        ? 'Your life balance is looking healthy this week.'
        : 'Votre équilibre de vie est sain cette semaine.',
      icon: '⚖️'
    })
  }

  // Suggestion if not much activity
  if (insights.length === 0) {
    insights.push({
      type: 'suggestion',
      message: isEn
        ? 'Try completing just one ritual today to start building momentum.'
        : 'Essayez de compléter un seul rituel aujourd\'hui pour commencer.',
      icon: '💡'
    })
  }

  return insights.slice(0, 3) // Max 3 insights
}

/**
 * Get calendar data for the past N days
 */
export async function getCalendarData(days: number = 30): Promise<CalendarDay[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const memberId = await getMemberId()
  if (!memberId) return []

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)

  // Fetch all data in parallel
  const [ritualsData, balanceData, reflectionsData, momentsData] = await Promise.all([
    supabase
      .from('ritual_completions')
      .select('completion_date, mood')
      .eq('member_id', memberId)
      .eq('completed', true)
      .gte('completion_date', formatDate(startDate))
      .then(r => r.data || []),
    supabase
      .from('balance_entries')
      .select('entry_date')
      .eq('member_id', memberId)
      .gte('entry_date', formatDate(startDate))
      .then(r => r.data || []),
    supabase
      .from('member_reflections')
      .select('created_at')
      .eq('member_id', memberId)
      .gte('created_at', startDate.toISOString())
      .then(r => r.data || []),
    supabase
      .from('moments')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .then(r => r.data || [])
  ])

  // Group by date
  const ritualsByDate = new Map<string, { count: number; mood?: string }>()
  ritualsData.forEach(r => {
    const existing = ritualsByDate.get(r.completion_date) || { count: 0 }
    existing.count++
    if (r.mood) existing.mood = r.mood
    ritualsByDate.set(r.completion_date, existing)
  })

  const balanceDates = new Set(balanceData.map(b => b.entry_date))
  const reflectionDates = new Set(reflectionsData.map(r => r.created_at.split('T')[0]))
  const momentDates = new Set(momentsData.map(m => m.created_at.split('T')[0]))

  // Build calendar
  const calendar: CalendarDay[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = formatDate(date)

    const hasRitual = ritualsByDate.has(dateStr)
    const hasBalance = balanceDates.has(dateStr)
    const hasReflection = reflectionDates.has(dateStr)
    const hasMoment = momentDates.has(dateStr)

    // Calculate activity level
    const activityCount = [hasRitual, hasBalance, hasReflection, hasMoment].filter(Boolean).length
    let activityLevel: 0 | 1 | 2 | 3 = 0
    if (activityCount >= 3) activityLevel = 3
    else if (activityCount === 2) activityLevel = 2
    else if (activityCount === 1) activityLevel = 1

    calendar.push({
      date: dateStr,
      activityLevel,
      hasRitual,
      hasBalance,
      hasReflection,
      hasMoment,
      mood: ritualsByDate.get(dateStr)?.mood
    })
  }

  return calendar
}

/**
 * Get current week data (Monday to Sunday)
 */
export async function getCurrentWeekData(): Promise<CalendarDay[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const memberId = await getMemberId()
  if (!memberId) return []

  // Calculate Monday of current week
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)

  // Calculate Sunday of current week
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  // Fetch all data in parallel
  const [ritualsData, balanceData, reflectionsData, momentsData] = await Promise.all([
    supabase
      .from('ritual_completions')
      .select('completion_date, mood')
      .eq('member_id', memberId)
      .eq('completed', true)
      .gte('completion_date', formatDate(monday))
      .lte('completion_date', formatDate(sunday))
      .then(r => r.data || []),
    supabase
      .from('balance_entries')
      .select('entry_date')
      .eq('member_id', memberId)
      .gte('entry_date', formatDate(monday))
      .lte('entry_date', formatDate(sunday))
      .then(r => r.data || []),
    supabase
      .from('member_reflections')
      .select('created_at')
      .eq('member_id', memberId)
      .gte('created_at', monday.toISOString())
      .lte('created_at', sunday.toISOString())
      .then(r => r.data || []),
    supabase
      .from('moments')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', monday.toISOString())
      .lte('created_at', sunday.toISOString())
      .then(r => r.data || [])
  ])

  // Group by date
  const ritualsByDate = new Map<string, { count: number; mood?: string }>()
  ritualsData.forEach(r => {
    const existing = ritualsByDate.get(r.completion_date) || { count: 0 }
    existing.count++
    if (r.mood) existing.mood = r.mood
    ritualsByDate.set(r.completion_date, existing)
  })

  const balanceDates = new Set(balanceData.map(b => b.entry_date))
  const reflectionDates = new Set(reflectionsData.map(r => r.created_at.split('T')[0]))
  const momentDates = new Set(momentsData.map(m => m.created_at.split('T')[0]))

  // Build calendar for Monday-Sunday
  const calendar: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)
    const dateStr = formatDate(date)

    const hasRitual = ritualsByDate.has(dateStr)
    const hasBalance = balanceDates.has(dateStr)
    const hasReflection = reflectionDates.has(dateStr)
    const hasMoment = momentDates.has(dateStr)

    // Calculate activity level
    const activityCount = [hasRitual, hasBalance, hasReflection, hasMoment].filter(Boolean).length
    let activityLevel: 0 | 1 | 2 | 3 = 0
    if (activityCount >= 3) activityLevel = 3
    else if (activityCount === 2) activityLevel = 2
    else if (activityCount === 1) activityLevel = 1

    calendar.push({
      date: dateStr,
      activityLevel,
      hasRitual,
      hasBalance,
      hasReflection,
      hasMoment,
      mood: ritualsByDate.get(dateStr)?.mood
    })
  }

  return calendar
}
