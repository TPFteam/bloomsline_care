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
  return date.toISOString().split('T')[0]
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
