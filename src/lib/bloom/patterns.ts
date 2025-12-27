import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// Bloom Pattern Detection & Storage
// Analyzes historical data to find long-term patterns
// ============================================

export interface StoredInsight {
  id: string
  insight_type: InsightType
  insight_key: string
  insight_text: string
  insight_text_fr?: string
  confidence: number
  data_points: number
  first_detected_at: string
  last_confirmed_at: string
  is_active: boolean
}

export type InsightType =
  | 'sleep_pattern'
  | 'mood_correlation'
  | 'ritual_impact'
  | 'work_pattern'
  | 'weekly_cycle'
  | 'balance_pattern'

interface PatternData {
  balanceEntries: BalanceEntry[]
  moments: MomentEntry[]
  ritualCompletions: RitualCompletion[]
  rituals: Ritual[]
}

interface BalanceEntry {
  date: string
  sleep_total: number | null
  work_total: number | null
  life_total: number | null
  sleep_night?: number
  sleep_nap?: number
  work_deep?: number
  work_meetings?: number
  work_admin?: number
  life_exercise?: number
  life_social?: number
  life_hobby?: number
  life_rest?: number
}

interface MomentEntry {
  created_at: string
  moods: string[]
}

interface RitualCompletion {
  ritual_id: string
  completed_date: string
  mood_before?: string
  mood_after?: string
}

interface Ritual {
  id: string
  name: string
}

interface DetectedPattern {
  type: InsightType
  key: string
  text: string
  textFr: string
  confidence: number
  dataPoints: number
}

/**
 * Fetch all user insights from database
 */
export async function getUserInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<StoredInsight[]> {
  const { data, error } = await supabase
    .from('bloom_user_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_dismissed', false)
    .order('confidence', { ascending: false })

  if (error) {
    console.error('Error fetching user insights:', error)
    return []
  }

  return data || []
}

/**
 * Detect and store patterns for a user
 * Call this periodically (e.g., daily, after significant data entry)
 */
export async function detectAndStorePatterns(
  supabase: SupabaseClient,
  userId: string,
  memberId: string
): Promise<DetectedPattern[]> {
  // Fetch 30 days of historical data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  // Fetch all data in parallel
  const [balanceResult, momentsResult, completionsResult, ritualsResult] = await Promise.all([
    supabase
      .from('balance_entries')
      .select('date, sleep_total, work_total, life_total, sleep_night, sleep_nap, work_deep, work_meetings, work_admin, life_exercise, life_social, life_hobby, life_rest')
      .eq('member_id', memberId)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: true }),
    supabase
      .from('moments')
      .select('created_at, moods')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('ritual_completions')
      .select('ritual_id, completed_date, mood_before, mood_after')
      .eq('member_id', memberId)
      .gte('completed_date', thirtyDaysAgoStr),
    supabase
      .from('rituals')
      .select('id, name')
      .eq('member_id', memberId)
      .eq('is_active', true),
  ])

  const data: PatternData = {
    balanceEntries: balanceResult.data || [],
    moments: momentsResult.data || [],
    ritualCompletions: completionsResult.data || [],
    rituals: ritualsResult.data || [],
  }

  // Detect patterns
  const patterns: DetectedPattern[] = []

  patterns.push(...detectSleepPatterns(data))
  patterns.push(...detectWorkPatterns(data))
  patterns.push(...detectWeeklyCycles(data))
  patterns.push(...detectMoodCorrelations(data))
  patterns.push(...detectRitualImpact(data))
  patterns.push(...detectBalancePatterns(data))

  // Store patterns in database
  for (const pattern of patterns) {
    await upsertInsight(supabase, userId, pattern)
  }

  return patterns
}

/**
 * Upsert an insight into the database
 */
async function upsertInsight(
  supabase: SupabaseClient,
  userId: string,
  pattern: DetectedPattern
): Promise<void> {
  const { error } = await supabase
    .from('bloom_user_insights')
    .upsert(
      {
        user_id: userId,
        insight_type: pattern.type,
        insight_key: pattern.key,
        insight_text: pattern.text,
        insight_text_fr: pattern.textFr,
        confidence: pattern.confidence,
        data_points: pattern.dataPoints,
        last_confirmed_at: new Date().toISOString(),
        is_active: true,
      },
      {
        onConflict: 'user_id,insight_key',
      }
    )

  if (error) {
    console.error('Error upserting insight:', error)
  }
}

// ============================================
// Pattern Detection Functions
// ============================================

function detectSleepPatterns(data: PatternData): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const entries = data.balanceEntries.filter(e => e.sleep_total != null)

  if (entries.length < 7) return patterns

  // Weekend vs weekday sleep
  const weekendSleep: number[] = []
  const weekdaySleep: number[] = []

  entries.forEach(entry => {
    const date = new Date(entry.date)
    const dayOfWeek = date.getDay()
    const sleep = entry.sleep_total || (entry.sleep_night || 0) + (entry.sleep_nap || 0)

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendSleep.push(sleep)
    } else {
      weekdaySleep.push(sleep)
    }
  })

  if (weekendSleep.length >= 2 && weekdaySleep.length >= 5) {
    const avgWeekend = weekendSleep.reduce((a, b) => a + b, 0) / weekendSleep.length
    const avgWeekday = weekdaySleep.reduce((a, b) => a + b, 0) / weekdaySleep.length
    const diffMinutes = avgWeekend - avgWeekday
    const diffHours = Math.round(diffMinutes / 60 * 10) / 10

    if (diffMinutes > 60) {
      patterns.push({
        type: 'sleep_pattern',
        key: 'weekend_sleep_more',
        text: `You sleep about ${diffHours} hours more on weekends than weekdays.`,
        textFr: `Tu dors environ ${diffHours} heures de plus le week-end qu'en semaine.`,
        confidence: Math.min(0.9, 0.5 + (entries.length / 60)),
        dataPoints: entries.length,
      })
    } else if (diffMinutes < -60) {
      patterns.push({
        type: 'sleep_pattern',
        key: 'weekday_sleep_more',
        text: `Interestingly, you sleep ${Math.abs(diffHours)} hours more on weekdays than weekends.`,
        textFr: `Fait intéressant, tu dors ${Math.abs(diffHours)} heures de plus en semaine que le week-end.`,
        confidence: Math.min(0.9, 0.5 + (entries.length / 60)),
        dataPoints: entries.length,
      })
    }
  }

  // Chronic sleep deprivation
  const avgSleep = entries.reduce((sum, e) => sum + (e.sleep_total || 0), 0) / entries.length
  const avgSleepHours = Math.round(avgSleep / 60 * 10) / 10

  if (avgSleep < 360 && entries.length >= 14) { // Under 6 hours
    patterns.push({
      type: 'sleep_pattern',
      key: 'chronic_sleep_deprivation',
      text: `You have been averaging ${avgSleepHours} hours of sleep over the past month. That is below the recommended 7-8 hours.`,
      textFr: `Tu as dormi en moyenne ${avgSleepHours} heures ces derniers mois. C'est en dessous des 7-8 heures recommandées.`,
      confidence: 0.85,
      dataPoints: entries.length,
    })
  } else if (avgSleep >= 420 && entries.length >= 14) { // 7+ hours
    patterns.push({
      type: 'sleep_pattern',
      key: 'good_sleep_habit',
      text: `You have been maintaining ${avgSleepHours} hours of sleep on average. That is solid.`,
      textFr: `Tu maintiens une moyenne de ${avgSleepHours} heures de sommeil. C'est bien.`,
      confidence: 0.85,
      dataPoints: entries.length,
    })
  }

  // Nap pattern
  const napsCount = entries.filter(e => (e.sleep_nap || 0) > 0).length
  if (napsCount >= 7 && entries.length >= 14) {
    const napPercentage = Math.round((napsCount / entries.length) * 100)
    patterns.push({
      type: 'sleep_pattern',
      key: 'regular_napper',
      text: `You take naps about ${napPercentage}% of the time. Naps can be great for energy.`,
      textFr: `Tu fais des siestes environ ${napPercentage}% du temps. Les siestes peuvent être très bénéfiques.`,
      confidence: 0.7,
      dataPoints: napsCount,
    })
  }

  return patterns
}

function detectWorkPatterns(data: PatternData): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const entries = data.balanceEntries.filter(e => e.work_total != null)

  if (entries.length < 7) return patterns

  // Average work hours
  const avgWork = entries.reduce((sum, e) => sum + (e.work_total || 0), 0) / entries.length
  const avgWorkHours = Math.round(avgWork / 60 * 10) / 10

  if (avgWork > 540 && entries.length >= 14) { // Over 9 hours
    patterns.push({
      type: 'work_pattern',
      key: 'long_work_hours',
      text: `You have been working ${avgWorkHours} hours on average. That is quite intense.`,
      textFr: `Tu travailles en moyenne ${avgWorkHours} heures. C'est assez intense.`,
      confidence: 0.8,
      dataPoints: entries.length,
    })
  }

  // Meeting heavy
  const meetingsTotal = entries.reduce((sum, e) => sum + (e.work_meetings || 0), 0)
  const workTotal = entries.reduce((sum, e) => sum + (e.work_total || 0), 0)

  if (workTotal > 0 && meetingsTotal / workTotal > 0.4 && entries.length >= 14) {
    const meetingPercentage = Math.round((meetingsTotal / workTotal) * 100)
    patterns.push({
      type: 'work_pattern',
      key: 'meeting_heavy',
      text: `About ${meetingPercentage}% of your work time is spent in meetings. Consider if you need more deep focus time.`,
      textFr: `Environ ${meetingPercentage}% de ton temps de travail est passé en réunions. As-tu besoin de plus de temps de concentration ?`,
      confidence: 0.75,
      dataPoints: entries.length,
    })
  }

  // Deep work pattern
  const deepWorkTotal = entries.reduce((sum, e) => sum + (e.work_deep || 0), 0)
  if (workTotal > 0 && deepWorkTotal / workTotal > 0.5 && entries.length >= 14) {
    patterns.push({
      type: 'work_pattern',
      key: 'good_deep_work',
      text: `You are great at prioritizing deep work. More than half your work time is focused.`,
      textFr: `Tu es doué pour prioriser le travail en profondeur. Plus de la moitié de ton temps est du travail concentré.`,
      confidence: 0.8,
      dataPoints: entries.length,
    })
  }

  return patterns
}

function detectWeeklyCycles(data: PatternData): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const entries = data.balanceEntries

  if (entries.length < 14) return patterns

  // Group by day of week
  const dayStats: Record<number, { sleep: number[]; work: number[]; life: number[] }> = {}

  for (let i = 0; i < 7; i++) {
    dayStats[i] = { sleep: [], work: [], life: [] }
  }

  entries.forEach(entry => {
    const date = new Date(entry.date)
    const dayOfWeek = date.getDay()
    const sleep = entry.sleep_total || (entry.sleep_night || 0) + (entry.sleep_nap || 0)
    const work = entry.work_total || (entry.work_deep || 0) + (entry.work_meetings || 0) + (entry.work_admin || 0)
    const life = entry.life_total || (entry.life_exercise || 0) + (entry.life_social || 0) + (entry.life_hobby || 0) + (entry.life_rest || 0)

    if (sleep > 0) dayStats[dayOfWeek].sleep.push(sleep)
    if (work > 0) dayStats[dayOfWeek].work.push(work)
    if (life > 0) dayStats[dayOfWeek].life.push(life)
  })

  // Find most and least productive days
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayNamesFr = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

  let maxWorkDay = -1, maxWorkAvg = 0
  let minWorkDay = -1, minWorkAvg = Infinity

  for (let i = 0; i < 7; i++) {
    if (dayStats[i].work.length >= 2) {
      const avg = dayStats[i].work.reduce((a, b) => a + b, 0) / dayStats[i].work.length
      if (avg > maxWorkAvg) {
        maxWorkAvg = avg
        maxWorkDay = i
      }
      if (avg < minWorkAvg) {
        minWorkAvg = avg
        minWorkDay = i
      }
    }
  }

  if (maxWorkDay >= 0 && maxWorkAvg > minWorkAvg * 1.5) {
    patterns.push({
      type: 'weekly_cycle',
      key: 'most_productive_day',
      text: `${dayNames[maxWorkDay]} tends to be your most productive work day.`,
      textFr: `Le ${dayNamesFr[maxWorkDay]} est généralement ton jour le plus productif.`,
      confidence: 0.7,
      dataPoints: dayStats[maxWorkDay].work.length,
    })
  }

  // Best life balance day
  let maxLifeDay = -1, maxLifeAvg = 0
  for (let i = 0; i < 7; i++) {
    if (dayStats[i].life.length >= 2) {
      const avg = dayStats[i].life.reduce((a, b) => a + b, 0) / dayStats[i].life.length
      if (avg > maxLifeAvg) {
        maxLifeAvg = avg
        maxLifeDay = i
      }
    }
  }

  if (maxLifeDay >= 0 && maxLifeAvg > 120) { // At least 2 hours
    const maxLifeHours = Math.round(maxLifeAvg / 60 * 10) / 10
    patterns.push({
      type: 'weekly_cycle',
      key: 'best_life_day',
      text: `${dayNames[maxLifeDay]} is when you dedicate the most time to yourself (${maxLifeHours}h on average).`,
      textFr: `Le ${dayNamesFr[maxLifeDay]} est le jour où tu te consacres le plus de temps (${maxLifeHours}h en moyenne).`,
      confidence: 0.7,
      dataPoints: dayStats[maxLifeDay].life.length,
    })
  }

  return patterns
}

function detectMoodCorrelations(data: PatternData): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const { moments, balanceEntries } = data

  if (moments.length < 14 || balanceEntries.length < 14) return patterns

  // Create daily mood mapping
  const dailyMoods: Record<string, string[]> = {}
  moments.forEach(m => {
    const date = m.created_at.split('T')[0]
    if (!dailyMoods[date]) dailyMoods[date] = []
    dailyMoods[date].push(...(m.moods || []))
  })

  const positiveMoods = ['grateful', 'peaceful', 'joyful', 'inspired', 'loved', 'calm', 'hopeful', 'proud']
  const negativeMoods = ['anxious', 'sad', 'frustrated', 'tired', 'overwhelmed', 'stressed', 'angry']

  // Correlate with sleep
  const goodSleepDays: string[] = []
  const badSleepDays: string[] = []

  balanceEntries.forEach(entry => {
    const sleep = entry.sleep_total || (entry.sleep_night || 0) + (entry.sleep_nap || 0)
    if (sleep >= 420) { // 7+ hours
      goodSleepDays.push(entry.date)
    } else if (sleep < 360) { // Under 6 hours
      badSleepDays.push(entry.date)
    }
  })

  // Calculate positive mood percentage on good vs bad sleep days
  const calcPositiveRate = (days: string[]) => {
    let positive = 0, total = 0
    days.forEach(date => {
      const moods = dailyMoods[date] || []
      moods.forEach(mood => {
        total++
        if (positiveMoods.includes(mood)) positive++
      })
    })
    return total > 0 ? positive / total : 0
  }

  if (goodSleepDays.length >= 5 && badSleepDays.length >= 5) {
    const goodSleepPositive = calcPositiveRate(goodSleepDays)
    const badSleepPositive = calcPositiveRate(badSleepDays)

    if (goodSleepPositive > badSleepPositive + 0.2) {
      const diff = Math.round((goodSleepPositive - badSleepPositive) * 100)
      patterns.push({
        type: 'mood_correlation',
        key: 'sleep_improves_mood',
        text: `When you get good sleep (7+ hours), you are ${diff}% more likely to feel positive.`,
        textFr: `Quand tu dors bien (7h+), tu as ${diff}% plus de chances de te sentir positif.`,
        confidence: 0.8,
        dataPoints: goodSleepDays.length + badSleepDays.length,
      })
    }
  }

  // Correlate with exercise
  const exerciseDays: string[] = []
  const noExerciseDays: string[] = []

  balanceEntries.forEach(entry => {
    const exercise = entry.life_exercise || 0
    if (exercise >= 30) {
      exerciseDays.push(entry.date)
    } else {
      noExerciseDays.push(entry.date)
    }
  })

  if (exerciseDays.length >= 5 && noExerciseDays.length >= 5) {
    const exercisePositive = calcPositiveRate(exerciseDays)
    const noExercisePositive = calcPositiveRate(noExerciseDays)

    if (exercisePositive > noExercisePositive + 0.15) {
      patterns.push({
        type: 'mood_correlation',
        key: 'exercise_improves_mood',
        text: `You tend to feel better on days when you exercise. Your mood noticeably lifts after physical activity.`,
        textFr: `Tu te sens mieux les jours où tu fais de l'exercice. Ton humeur s'améliore après l'activité physique.`,
        confidence: 0.75,
        dataPoints: exerciseDays.length,
      })
    }
  }

  return patterns
}

function detectRitualImpact(data: PatternData): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const { ritualCompletions, rituals } = data

  if (ritualCompletions.length < 10 || rituals.length === 0) return patterns

  // Overall consistency
  const uniqueDays = new Set(ritualCompletions.map(c => c.completed_date)).size
  const totalPossible = rituals.length * 30 // Approximate possible completions

  if (ritualCompletions.length >= totalPossible * 0.7) {
    patterns.push({
      type: 'ritual_impact',
      key: 'high_ritual_consistency',
      text: `You are incredibly consistent with your rituals. This dedication builds lasting habits.`,
      textFr: `Tu es incroyablement constant avec tes rituels. Cette dévotion construit des habitudes durables.`,
      confidence: 0.9,
      dataPoints: ritualCompletions.length,
    })
  } else if (ritualCompletions.length < totalPossible * 0.3 && uniqueDays >= 7) {
    patterns.push({
      type: 'ritual_impact',
      key: 'ritual_struggle',
      text: `Rituals seem to be challenging right now. Maybe we could look at making them simpler?`,
      textFr: `Les rituels semblent difficiles en ce moment. On pourrait peut-être les simplifier ?`,
      confidence: 0.7,
      dataPoints: ritualCompletions.length,
    })
  }

  // Mood impact from rituals (if tracked)
  const moodImprovements = ritualCompletions.filter(c => {
    if (!c.mood_before || !c.mood_after) return false
    const positiveMoods = ['grateful', 'peaceful', 'joyful', 'inspired', 'loved', 'calm', 'hopeful', 'proud']
    return positiveMoods.includes(c.mood_after) && !positiveMoods.includes(c.mood_before)
  })

  if (moodImprovements.length >= 5) {
    patterns.push({
      type: 'ritual_impact',
      key: 'rituals_improve_mood',
      text: `Your rituals actually improve your mood. You often feel better after completing them.`,
      textFr: `Tes rituels améliorent vraiment ton humeur. Tu te sens souvent mieux après.`,
      confidence: 0.8,
      dataPoints: moodImprovements.length,
    })
  }

  return patterns
}

function detectBalancePatterns(data: PatternData): DetectedPattern[] {
  const patterns: DetectedPattern[] = []
  const entries = data.balanceEntries

  if (entries.length < 14) return patterns

  // Overall balance assessment
  let wellBalancedDays = 0
  let workDominantDays = 0

  entries.forEach(entry => {
    const sleep = entry.sleep_total || (entry.sleep_night || 0) + (entry.sleep_nap || 0)
    const work = entry.work_total || (entry.work_deep || 0) + (entry.work_meetings || 0) + (entry.work_admin || 0)
    const life = entry.life_total || (entry.life_exercise || 0) + (entry.life_social || 0) + (entry.life_hobby || 0) + (entry.life_rest || 0)

    // Well balanced: Sleep 6-9h, work 6-10h, life 2-6h
    if (sleep >= 360 && sleep <= 540 && work >= 360 && work <= 600 && life >= 120 && life <= 360) {
      wellBalancedDays++
    }

    // Work dominant: Work > Sleep + Life
    if (work > sleep + life) {
      workDominantDays++
    }
  })

  const balanceRate = wellBalancedDays / entries.length

  if (balanceRate >= 0.6) {
    patterns.push({
      type: 'balance_pattern',
      key: 'good_overall_balance',
      text: `You have maintained good balance most days. That is not easy, be proud of that.`,
      textFr: `Tu as maintenu un bon équilibre la plupart des jours. C'est pas facile, bravo.`,
      confidence: 0.85,
      dataPoints: entries.length,
    })
  }

  if (workDominantDays / entries.length > 0.5) {
    const percentage = Math.round((workDominantDays / entries.length) * 100)
    patterns.push({
      type: 'balance_pattern',
      key: 'work_dominant_lifestyle',
      text: `Work takes up more than half your day ${percentage}% of the time. How are you feeling about that?`,
      textFr: `Le travail prend plus de la moitié de ta journée ${percentage}% du temps. Comment te sens-tu par rapport à ça ?`,
      confidence: 0.8,
      dataPoints: entries.length,
    })
  }

  return patterns
}

/**
 * Format stored insights for Bloom's context
 */
export function formatInsightsForPrompt(
  insights: StoredInsight[],
  locale: 'en' | 'fr' = 'en'
): string {
  if (insights.length === 0) return ''

  const header = locale === 'fr' ? '\nPATTERNS LONG-TERME:' : '\nLONG-TERM PATTERNS:'

  const formattedInsights = insights
    .slice(0, 5) // Top 5 most confident
    .map(insight => {
      const text = locale === 'fr' && insight.insight_text_fr
        ? insight.insight_text_fr
        : insight.insight_text
      return `- ${text} (confidence: ${Math.round(insight.confidence * 100)}%)`
    })
    .join('\n')

  return `${header}\n${formattedInsights}`
}
