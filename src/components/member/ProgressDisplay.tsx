'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Camera,
  PenLine,
  Check,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

// Icon map for activity badges
const streakIcons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  camera: Camera,
  'pen-line': PenLine,
}
import { useLanguage } from '@/lib/i18n/context'
import {
  getProgressSummary,
  getCalendarData,
  getCurrentWeekData,
  generateDailyNarrative,
  generateThreeThings,
  generateWeeklyInsights,
  type ProgressSummary,
  type DailyNarrative,
  type ThreeThings,
  type WeeklyInsight,
  type CalendarDay,
} from '@/lib/services/progress'

// ============================================
// WEEKLY PROGRESS (Combined: Dots + Chart)
// ============================================

// Soft pastel colors for each day of the week
const DAY_COLORS = [
  'bg-emerald-200', // Mon
  'bg-cyan-200',    // Tue
  'bg-amber-200',   // Wed
  'bg-orange-300',  // Thu
  'bg-rose-200',    // Fri
  'bg-pink-200',    // Sat
  'bg-violet-200',  // Sun
]

const WEEK_DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function WeeklyProgressDots() {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [weekData, setWeekData] = useState<CalendarDay[]>([])
  const [todayStr, setTodayStr] = useState<string>('')

  useEffect(() => {
    // Set today's date on client side to avoid timezone issues
    setTodayStr(new Date().toLocaleDateString('en-CA'))

    async function load() {
      // Get current week data (Monday to Sunday)
      const data = await getCurrentWeekData()
      setWeekData(data)
      setLoading(false)
    }
    load()
  }, [])

  const isEn = locale !== 'fr'

  // Count active days
  const activeDays = weekData.filter(d => d.activityLevel > 0).length
  const totalDays = weekData.length || 7

  // Get encouraging message based on progress
  const getMessage = () => {
    const ratio = activeDays / totalDays
    if (ratio >= 0.8) return isEn ? "Amazing week!" : "Semaine incroyable!"
    if (ratio >= 0.5) return isEn ? "You're making progress!" : "Vous progressez!"
    if (ratio >= 0.3) return isEn ? "Keep going!" : "Continuez!"
    if (activeDays > 0) return isEn ? "Every step counts!" : "Chaque pas compte!"
    return isEn ? "Start your journey!" : "Commencez votre parcours!"
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
        <div className="flex justify-between items-center mb-3">
          <div className="h-5 bg-gray-100 rounded w-28" />
          <div className="h-4 bg-gray-100 rounded w-8" />
        </div>
        <div className="flex justify-between gap-2 px-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-gray-100" />
              <div className="h-3 w-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 border border-gray-100"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">
          {isEn ? 'This Week' : 'Cette semaine'}
        </h3>
        <span className="text-sm text-emerald-600 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          {activeDays}/{totalDays}
        </span>
      </div>

      {/* Dots with Day Labels */}
      <div className="flex justify-between mb-3">
        {weekData.map((day, i) => {
          const hasActivity = day.activityLevel > 0
          const isToday = day.date === todayStr

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative w-8 h-8 rounded-full ${DAY_COLORS[i % 7]} flex items-center justify-center ${
                  isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                }`}
              >
                {hasActivity && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>
              <span className={`text-[10px] ${isToday ? 'font-bold text-emerald-600' : 'text-gray-400'}`}>
                {WEEK_DAY_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Message */}
      <p className="text-center text-sm font-medium text-emerald-600">
        {getMessage()}
      </p>
    </motion.div>
  )
}

// ============================================
// DAILY MOTIVATION (Narrative + Streaks)
// ============================================

export function DailyMotivation() {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [narrative, setNarrative] = useState<DailyNarrative | null>(null)

  useEffect(() => {
    async function load() {
      const summary = await getProgressSummary()
      if (summary) {
        setNarrative(generateDailyNarrative(summary, locale))
      }
      setLoading(false)
    }
    load()
  }, [locale])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 animate-pulse">
        <div className="h-6 bg-emerald-100 rounded w-32 mb-2" />
        <div className="h-4 bg-emerald-100 rounded w-full mb-4" />
        <div className="h-4 bg-emerald-100 rounded w-48" />
      </div>
    )
  }

  if (!narrative) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl p-5 border border-emerald-100/50"
    >
      {/* Greeting & Narrative */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {narrative.greeting} <span className="wave">👋</span>
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {narrative.mainMessage}
        </p>
        <p className="text-emerald-600 text-sm font-medium mt-2">
          {narrative.encouragement}
        </p>
      </div>

      {/* Streaks */}
      {narrative.streaks.length > 0 && (
        <div className="flex gap-2">
          {narrative.streaks.map((streak, i) => {
            const IconComponent = streakIcons[streak.icon] || Sparkles
            const iconColors: Record<string, string> = {
              flame: 'text-orange-500',
              sparkles: 'text-amber-500',
              camera: 'text-rose-500',
              'pen-line': 'text-purple-500',
            }
            return (
              <motion.div
                key={streak.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100"
              >
                <IconComponent className={`w-3.5 h-3.5 ${iconColors[streak.icon] || 'text-emerald-500'}`} />
                <span className="text-xs font-semibold text-gray-900">{streak.value}</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ============================================
// THREE THINGS (Ultra Minimal Summary)
// ============================================

export function ThreeThingsSummary() {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ThreeThings | null>(null)

  useEffect(() => {
    async function load() {
      const summary = await getProgressSummary()
      if (summary) {
        setData(generateThreeThings(summary))
      }
      setLoading(false)
    }
    load()
  }, [])

  const isEn = locale !== 'fr'

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
        <div className="flex justify-between">
          <div className="h-12 w-20 bg-gray-100 rounded" />
          <div className="h-12 w-20 bg-gray-100 rounded" />
          <div className="h-12 w-20 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const getMoodIcon = () => {
    switch (data.moodTrend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-emerald-500" />
      case 'stable': return <Minus className="w-5 h-5 text-blue-500" />
      case 'declining': return <TrendingDown className="w-5 h-5 text-orange-500" />
      default: return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  const getMoodLabel = () => {
    switch (data.moodTrend) {
      case 'improving': return isEn ? 'Improving' : 'En hausse'
      case 'stable': return isEn ? 'Stable' : 'Stable'
      case 'declining': return isEn ? 'Needs care' : 'À soigner'
      default: return isEn ? 'Unknown' : 'Inconnu'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 border border-gray-100"
    >
      <div className="flex justify-between items-center">
        {/* Days Active */}
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-gray-900">
            {data.daysActive.value}<span className="text-gray-400 text-lg">/{data.daysActive.total}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEn ? 'Days Active' : 'Jours actifs'}
          </p>
        </div>

        <div className="w-px h-10 bg-gray-100" />

        {/* Mood Trend */}
        <div className="text-center flex-1">
          <div className="flex justify-center mb-0.5">
            {getMoodIcon()}
          </div>
          <p className="text-xs text-gray-500">
            {getMoodLabel()}
          </p>
        </div>

        <div className="w-px h-10 bg-gray-100" />

        {/* Moments */}
        <div className="text-center flex-1">
          <p className="text-2xl font-bold text-gray-900">{data.momentsCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEn ? 'Moments' : 'Moments'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// WEEKLY INSIGHTS
// ============================================

export function WeeklyInsights() {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<WeeklyInsight[]>([])

  useEffect(() => {
    async function load() {
      const summary = await getProgressSummary()
      if (summary) {
        setInsights(generateWeeklyInsights(summary, locale))
      }
      setLoading(false)
    }
    load()
  }, [locale])

  const isEn = locale !== 'fr'

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-24 mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-50 rounded-xl" />
          <div className="h-12 bg-gray-50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 border border-gray-100"
    >
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        {isEn ? 'Insights' : 'Aperçus'}
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-start gap-3 p-3 rounded-xl ${
              insight.type === 'celebration' ? 'bg-amber-50' :
              insight.type === 'achievement' ? 'bg-emerald-50' :
              insight.type === 'pattern' ? 'bg-blue-50' :
              'bg-gray-50'
            }`}
          >
            <span className="text-lg flex-shrink-0">{insight.icon}</span>
            <p className="text-sm text-gray-700 leading-relaxed">
              {insight.message}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================
// GENTLE CALENDAR - Monthly View with Navigation
// ============================================

export function GentleCalendar() {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [calendarData, setCalendarData] = useState<Map<string, CalendarDay>>(new Map())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const isEn = locale !== 'fr'
  const WEEKDAYS = isEn
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  useEffect(() => {
    async function load() {
      // Get 90 days of data to cover 3 months
      const data = await getCalendarData(90)
      const dataMap = new Map<string, CalendarDay>()
      data.forEach(d => dataMap.set(d.date, d))
      setCalendarData(dataMap)
      setLoading(false)
    }
    load()
  }, [])

  // Get month name
  const monthName = currentMonth.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
    month: 'long',
    year: 'numeric'
  })

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    const today = new Date()
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    // Don't go past current month
    if (nextMonth <= today) {
      setCurrentMonth(nextMonth)
      setSelectedDay(null)
    }
  }

  // Check if can go to next month
  const canGoNext = () => {
    const today = new Date()
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.getMonth() <= today.getMonth() && nextMonth.getFullYear() <= today.getFullYear()
  }

  // Build calendar grid for current month
  const buildMonthGrid = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of month
    const firstDay = new Date(year, month, 1)
    // Get day of week (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 // Convert to Monday=0

    // Last day of month
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Build grid
    const grid: (CalendarDay | null)[][] = []
    let currentWeek: (CalendarDay | null)[] = []

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null)
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = calendarData.get(dateStr) || {
        date: dateStr,
        activityLevel: 0 as 0 | 1 | 2 | 3,
        hasRitual: false,
        hasBalance: false,
        hasReflection: false,
        hasMoment: false
      }
      currentWeek.push(dayData)

      if (currentWeek.length === 7) {
        grid.push(currentWeek)
        currentWeek = []
      }
    }

    // Add remaining empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      grid.push(currentWeek)
    }

    return grid
  }

  const getActivityColor = (level: number) => {
    switch (level) {
      case 3: return 'bg-emerald-500 text-white'
      case 2: return 'bg-emerald-300 text-emerald-900'
      case 1: return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-50 text-gray-400'
    }
  }

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  // Count active days in current month
  const countActiveDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    let count = 0
    const lastDay = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = calendarData.get(dateStr)
      if (dayData && dayData.activityLevel > 0) count++
    }
    return count
  }

  // Check if date is today
  const isToday = (dateStr: string) => {
    return dateStr === new Date().toLocaleDateString('en-CA')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-gray-100 rounded w-32" />
          <div className="h-5 bg-gray-100 rounded w-16" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const grid = buildMonthGrid()
  const activeDays = countActiveDays()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 border border-gray-100"
    >
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <h3 className="font-semibold text-gray-900 capitalize">
            {monthName}
          </h3>
          <span className="text-xs text-gray-500">
            {activeDays} {isEn ? 'active days' : 'jours actifs'}
          </span>
        </div>

        <button
          onClick={goToNextMonth}
          disabled={!canGoNext()}
          className={`p-1.5 rounded-full transition-colors ${
            canGoNext() ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-xs text-gray-400 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {grid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => (
              <div key={dayIndex} className="aspect-square">
                {day ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                    className={`w-full h-full rounded-lg text-xs font-medium transition-all ${getActivityColor(day.activityLevel)} ${
                      selectedDay?.date === day.date ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                    } ${isToday(day.date) ? 'ring-2 ring-gray-900' : ''}`}
                  >
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </motion.button>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-500">
        <span>{isEn ? 'Less' : 'Moins'}</span>
        <div className="w-3 h-3 rounded bg-gray-100" />
        <div className="w-3 h-3 rounded bg-emerald-100" />
        <div className="w-3 h-3 rounded bg-emerald-300" />
        <div className="w-3 h-3 rounded bg-emerald-500" />
        <span>{isEn ? 'More' : 'Plus'}</span>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-gray-100"
        >
          <p className="text-sm font-medium text-gray-900 mb-2 capitalize">
            {formatDateLabel(selectedDay.date)}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedDay.hasRitual && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {isEn ? 'Rituals' : 'Rituels'}
              </span>
            )}
            {selectedDay.hasBalance && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {isEn ? 'Balance' : 'Équilibre'}
              </span>
            )}
            {selectedDay.hasReflection && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {isEn ? 'Reflection' : 'Réflexion'}
              </span>
            )}
            {selectedDay.hasMoment && (
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                {isEn ? 'Moment' : 'Moment'}
              </span>
            )}
            {selectedDay.activityLevel === 0 && (
              <span className="text-xs text-gray-400">
                {isEn ? 'Rest day' : 'Jour de repos'}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================
// ENERGY CHECK - Human Insight with Interaction
// ============================================

interface EnergyInsight {
  message: string
  type: 'positive' | 'neutral' | 'caring'
  followUpYes: string
  followUpNo: string
}

function generateEnergyInsight(
  summary: ProgressSummary,
  locale: string
): EnergyInsight {
  const { rituals, moments, reflections, feelings } = summary
  const isEn = locale !== 'fr'

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysIntoWeek = dayOfWeek === 0 ? 7 : dayOfWeek // Monday = 1

  // Calculate activity score
  const activityScore = rituals.completedThisWeek + moments.thisWeek + reflections.thisWeek
  const expectedForDays = daysIntoWeek * 2 // rough expectation
  const activityRatio = activityScore / Math.max(expectedForDays, 1)

  // Determine insight based on patterns
  if (feelings.trend === 'better' && activityRatio > 0.5) {
    return {
      message: isEn
        ? "Your energy feels lighter this week. You're showing up for yourself more."
        : "Votre énergie semble plus légère cette semaine. Vous prenez soin de vous.",
      type: 'positive',
      followUpYes: isEn
        ? "That's wonderful! Keep riding this wave 🌊"
        : "C'est merveilleux! Continuez sur cette lancée 🌊",
      followUpNo: isEn
        ? "I hear you. Sometimes the inside doesn't match the outside. Want to talk about it?"
        : "Je comprends. Parfois l'intérieur ne correspond pas à l'extérieur. Voulez-vous en parler?"
    }
  }

  if (feelings.trend === 'lower' || activityRatio < 0.3) {
    return {
      message: isEn
        ? "It seems like things might be feeling a bit heavy lately. That's okay."
        : "Il semble que les choses soient un peu lourdes dernièrement. C'est normal.",
      type: 'caring',
      followUpYes: isEn
        ? "Thank you for being honest. Remember, rest is productive too. Want to talk?"
        : "Merci d'être honnête. N'oubliez pas, le repos est aussi productif. Voulez-vous en parler?",
      followUpNo: isEn
        ? "I'm glad to hear that! Maybe today is a fresh start 🌱"
        : "Je suis content de l'entendre! Peut-être qu'aujourd'hui est un nouveau départ 🌱"
    }
  }

  if (rituals.currentStreak >= 3) {
    return {
      message: isEn
        ? `${rituals.currentStreak} days of consistency! You're building something meaningful.`
        : `${rituals.currentStreak} jours de régularité! Vous construisez quelque chose de significatif.`,
      type: 'positive',
      followUpYes: isEn
        ? "Your dedication is inspiring! Small steps, big changes 💪"
        : "Votre dévouement est inspirant! Petits pas, grands changements 💪",
      followUpNo: isEn
        ? "That's okay - numbers don't tell the whole story. How are you really feeling?"
        : "C'est normal - les chiffres ne disent pas tout. Comment vous sentez-vous vraiment?"
    }
  }

  if (moments.thisWeek > 0) {
    return {
      message: isEn
        ? "You've been capturing moments. Noticing the good things takes strength."
        : "Vous avez capturé des moments. Remarquer les bonnes choses demande de la force.",
      type: 'neutral',
      followUpYes: isEn
        ? "Keep your eyes open for more beauty today ✨"
        : "Gardez les yeux ouverts pour plus de beauté aujourd'hui ✨",
      followUpNo: isEn
        ? "That's valid. Not every moment feels meaningful. What would help right now?"
        : "C'est valide. Tous les moments ne semblent pas significatifs. Qu'est-ce qui aiderait maintenant?"
    }
  }

  // Default neutral insight
  return {
    message: isEn
      ? "How are you really doing this week? Check in with yourself."
      : "Comment allez-vous vraiment cette semaine? Faites le point avec vous-même.",
    type: 'neutral',
    followUpYes: isEn
      ? "Great! Keep listening to yourself 💚"
      : "Super! Continuez à vous écouter 💚",
    followUpNo: isEn
      ? "That's okay. Want to explore what's on your mind?"
      : "C'est normal. Voulez-vous explorer ce qui vous préoccupe?"
  }
}

export function EnergyCheck({ onOpenChat }: { onOpenChat?: () => void }) {
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<EnergyInsight | null>(null)
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)

  useEffect(() => {
    async function load() {
      const summary = await getProgressSummary()
      if (summary) {
        setInsight(generateEnergyInsight(summary, locale))
      }
      setLoading(false)
    }
    load()
  }, [locale])

  const isEn = locale !== 'fr'

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-violet-100 rounded w-3/4 mb-3" />
        <div className="h-8 bg-violet-100 rounded w-1/2" />
      </div>
    )
  }

  if (!insight) return null

  const bgColors = {
    positive: 'from-emerald-50 to-teal-50 border-emerald-100',
    neutral: 'from-blue-50 to-indigo-50 border-blue-100',
    caring: 'from-amber-50 to-orange-50 border-amber-100',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${bgColors[insight.type]} rounded-2xl p-4 border`}
    >
      {response === null ? (
        <>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            {insight.message}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {isEn ? 'Does this resonate with you?' : 'Est-ce que cela vous parle?'}
          </p>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setResponse('yes')}
              className="flex-1 py-2 px-3 bg-white rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {isEn ? 'Yes, that\'s me' : 'Oui, c\'est moi'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setResponse('no')}
              className="flex-1 py-2 px-3 bg-white rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {isEn ? 'Not quite' : 'Pas vraiment'}
            </motion.button>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            {response === 'yes' ? insight.followUpYes : insight.followUpNo}
          </p>
          {(response === 'no' || insight.type === 'caring') && onOpenChat && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenChat}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-medium text-white hover:from-violet-600 hover:to-purple-600 transition-colors"
            >
              {isEn ? 'Talk to Bloom 💬' : 'Parler à Bloom 💬'}
            </motion.button>
          )}
          <button
            onClick={() => setResponse(null)}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            {isEn ? '← Back' : '← Retour'}
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================
// COMBINED PROGRESS SECTION
// ============================================

export function ProgressSection({ onOpenChat }: { onOpenChat?: () => void }) {
  return (
    <div className="space-y-4">
      <DailyMotivation />
      <EnergyCheck onOpenChat={onOpenChat} />
      <ThreeThingsSummary />
      <WeeklyInsights />
      <GentleCalendar />
    </div>
  )
}
