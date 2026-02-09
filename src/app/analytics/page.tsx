'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Calendar,
  Clock,
  Activity,
  Heart,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Shield,
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar, AppHeader } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import type { User } from '@/types/user'

// ── Types ────────────────────────────────────────────────────────────────

interface MemberRow {
  id: string
  first_name: string
  last_name: string
  status: string
  last_session_at: string | null
  created_at: string
}

interface SessionRow {
  id: string
  member_id: string
  status: string
  scheduled_at: string
  session_type: string
  mood_rating: number | null
  session_format: string | null
}

interface MilestoneRow {
  id: string
  status: string
  created_at: string
  member_id: string
  updated_at: string
}

interface UpcomingSession {
  id: string
  member_id: string
  scheduled_at: string
  session_type: string
  member_name: string
}

interface MonthlyData {
  month: string
  sessions: number
}

interface NoteRow {
  id: string
  created_at: string
  session_id: string | null
}

interface ResourceRow {
  id: string
  member_id: string
  status: string
}

interface AnalyticsState {
  members: MemberRow[]
  sessions: SessionRow[]
  milestones: MilestoneRow[]
  notes: NoteRow[]
  sharedResources: number
  upcomingSessions: UpcomingSession[]
  resources: ResourceRow[]
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getMonthAbbrev(date: Date, locale: string): string {
  return date.toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'short' },
  )
}

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatSessionType(type: string, locale: string): string {
  const map: Record<string, Record<string, string>> = {
    initial_consultation: { en: 'Initial', fr: 'Initiale', es: 'Inicial' },
    follow_up: { en: 'Follow-up', fr: 'Suivi', es: 'Seguimiento' },
    check_in: { en: 'Check-in', fr: 'Bilan', es: 'Revisión' },
    crisis: { en: 'Crisis', fr: 'Crise', es: 'Crisis' },
    group: { en: 'Group', fr: 'Groupe', es: 'Grupo' },
    other: { en: 'Session', fr: 'Séance', es: 'Sesión' },
  }
  const lang = locale === 'fr' ? 'fr' : locale === 'es' ? 'es' : 'en'
  return map[type]?.[lang] || map.other[lang]
}

function buildMonthlyChart(sessions: SessionRow[], locale: string, refDate: Date): MonthlyData[] {
  const data: MonthlyData[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const count = sessions.filter((s) => {
      const sd = new Date(s.scheduled_at)
      return s.status === 'completed' && sd >= monthStart && sd <= monthEnd
    }).length
    data.push({ month: getMonthAbbrev(d, locale), sessions: count })
  }
  return data
}

// ── Custom tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value: number }>; locale: string }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
      {v} {locale === 'fr' ? 'séances' : locale === 'es' ? 'sesiones' : 'sessions'}
    </div>
  )
}

// ── Locale helper ────────────────────────────────────────────────────────

function localeId(locale: string) {
  return locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { locale } = useLanguage()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsState | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date())
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)

  const isCurrentMonth =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear()

  const goToPrev = () =>
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))

  const goToNext = () => {
    if (!isCurrentMonth) {
      setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }
  }

  const formatMonthLabel = (date: Date) =>
    date.toLocaleDateString(localeId(locale), { month: 'long', year: 'numeric' })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile as User)
      } else {
        setUserProfile({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          user_type: user.user_metadata?.user_type || 'mentor',
          preferred_language: 'en',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        })
      }

      const now = new Date()

      const [membersRes, sessionsRes, milestonesRes, notesRes, sharedRes, upcomingRes, resourcesRes] =
        await Promise.all([
          supabase
            .from('members')
            .select('id, first_name, last_name, status, last_session_at, created_at')
            .eq('practitioner_id', user.id),
          supabase
            .from('sessions')
            .select('id, member_id, status, scheduled_at, session_type, mood_rating, session_format')
            .eq('practitioner_id', user.id),
          supabase
            .from('milestones')
            .select('id, status, created_at, member_id, updated_at')
            .eq('practitioner_id', user.id),
          supabase
            .from('progress_notes')
            .select('id, created_at, session_id')
            .eq('practitioner_id', user.id),
          supabase
            .from('shared_resources')
            .select('id')
            .eq('practitioner_id', user.id),
          supabase
            .from('sessions')
            .select('id, member_id, scheduled_at, session_type')
            .eq('practitioner_id', user.id)
            .eq('status', 'scheduled')
            .gte('scheduled_at', now.toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5),
          supabase
            .from('shared_resources')
            .select('id, member_id, status')
            .eq('practitioner_id', user.id),
        ])

      const members = (membersRes.data || []) as MemberRow[]
      const sessions = (sessionsRes.data || []) as SessionRow[]

      const upcoming = (upcomingRes.data || []) as Array<{
        id: string
        member_id: string
        scheduled_at: string
        session_type: string
      }>
      const enrichedUpcoming: UpcomingSession[] = upcoming.map((s) => {
        const m = members.find((mem) => mem.id === s.member_id)
        return {
          ...s,
          member_name: m ? `${m.first_name} ${m.last_name}` : '—',
        }
      })

      setData({
        members,
        sessions,
        milestones: (milestonesRes.data || []) as MilestoneRow[],
        notes: (notesRes.data || []) as NoteRow[],
        sharedResources: sharedRes.data?.length || 0,
        upcomingSessions: enrichedUpcoming,
        resources: (resourcesRes.data || []) as ResourceRow[],
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AppSidebar activeItem="analytics" />
        <main className="flex-1 ml-64">
          <AppHeader
            user={null}
            leftContent={
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Activity className="w-4 h-4" />
                <span>{locale === 'fr' ? 'Rythme' : locale === 'es' ? 'Tu ritmo' : 'Your Flow'}</span>
              </div>
            }
          />
          <div className="flex items-center justify-center h-[calc(100vh-65px)]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">
                {locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!data) return null

  // ── Derived data ─────────────────────────────────────────────────────

  const { members, sessions, milestones, notes, upcomingSessions, resources } = data

  const activeMembers = members.filter((m) => m.status === 'active').length
  const now = new Date()

  // Month boundaries for the selected month
  const selMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
  const selMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59)

  const sessionsInMonth = sessions.filter((s) => {
    const d = new Date(s.scheduled_at)
    return d >= selMonthStart && d <= selMonthEnd
  }).length

  const nextSession = upcomingSessions[0] || null
  const chartData = buildMonthlyChart(sessions, locale, selectedMonth)

  // Only show milestones that existed by the end of the selected month
  const milestonesInRange = milestones.filter(
    (m) => new Date(m.created_at) <= selMonthEnd,
  )

  const discoveryCount = milestonesInRange.filter(
    (m) => m.status === 'discovery' || m.status === 'planned',
  ).length
  const buildingCount = milestonesInRange.filter(
    (m) => m.status === 'building' || m.status === 'in_progress',
  ).length
  const thrivingCount = milestonesInRange.filter((m) => m.status === 'thriving').length
  const independentCount = milestonesInRange.filter(
    (m) => m.status === 'independent' || m.status === 'achieved',
  ).length
  const totalMilestones = discoveryCount + buildingCount + thrivingCount + independentCount

  const staleClients = members
    .filter((m) => {
      if (m.status !== 'active') return false
      const d = daysAgo(m.last_session_at)
      return d === null || d >= 14
    })
    .sort((a, b) => {
      const da = daysAgo(a.last_session_at)
      const db = daysAgo(b.last_session_at)
      if (da === null) return -1
      if (db === null) return 1
      return db - da
    })
    .slice(0, 5)

  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thisWeekSessions = upcomingSessions.filter(
    (s) => new Date(s.scheduled_at) <= oneWeekFromNow,
  )

  const needsAttentionEmpty = staleClients.length === 0 && thisWeekSessions.length === 0

  // ── Session Health Ring data ───────────────────────────────────────
  const sessionsInMonthArr = sessions.filter((s) => {
    const d = new Date(s.scheduled_at)
    return d >= selMonthStart && d <= selMonthEnd
  })
  const completedInMonth = sessionsInMonthArr.filter((s) => s.status === 'completed').length
  const cancelledInMonth = sessionsInMonthArr.filter((s) => s.status === 'cancelled').length
  const noShowInMonth = sessionsInMonthArr.filter((s) => s.status === 'no_show').length
  const scheduledInMonth = sessionsInMonthArr.filter((s) => s.status === 'scheduled').length
  const totalHealthSessions = completedInMonth + cancelledInMonth + noShowInMonth + scheduledInMonth

  const pct = (v: number) => totalHealthSessions > 0 ? Math.round((v / totalHealthSessions) * 100) : 0

  // ── Client Engagement Radar ────────────────────────────────────────
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  interface EngagementEntry {
    member: MemberRow
    score: number
    attendance: number
    recency: number
    consistency: number
    momentum: number
    riskReason: string
  }

  const engagementScores: EngagementEntry[] = members
    .filter((m) => m.status === 'active')
    .map((m) => {
      const memberSessions = sessions.filter((s) => s.member_id === m.id)
      const recentSessions = memberSessions.filter((s) => new Date(s.scheduled_at) >= threeMonthsAgo)

      // Attendance (0-30)
      const scheduled = recentSessions.filter((s) => s.status !== 'scheduled').length
      const completed = recentSessions.filter((s) => s.status === 'completed').length
      const attendanceRate = scheduled > 0 ? completed / scheduled : 0
      const attendance = scheduled > 0 ? Math.round(attendanceRate * 30) : 15

      // Recency (0-30)
      const lastD = daysAgo(m.last_session_at)
      const recency = lastD === null ? 0 : lastD <= 7 ? 30 : lastD <= 14 ? 20 : lastD <= 30 ? 10 : 0

      // Consistency (0-20)
      const completedDates = memberSessions
        .filter((s) => s.status === 'completed')
        .map((s) => new Date(s.scheduled_at).getTime())
        .sort((a, b) => a - b)
      let consistency = 10
      if (completedDates.length >= 3) {
        const gaps: number[] = []
        for (let i = 1; i < completedDates.length; i++) {
          gaps.push((completedDates[i] - completedDates[i - 1]) / (1000 * 60 * 60 * 24))
        }
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
        const stdDev = Math.sqrt(gaps.reduce((sum, g) => sum + (g - avgGap) ** 2, 0) / gaps.length)
        consistency = stdDev < 3 ? 20 : stdDev < 7 ? 15 : stdDev < 14 ? 10 : 5
      }

      // Momentum (0-20)
      const memberMilestones = milestones.filter((ms) => ms.member_id === m.id)
      let momentum = 10
      if (memberMilestones.length > 0) {
        const recentlyMoved = memberMilestones.some((ms) => new Date(ms.updated_at) >= thirtyDaysAgo)
        momentum = recentlyMoved ? 20 : 5
      }

      const score = attendance + recency + consistency + momentum

      // Risk reason
      const cancellations = recentSessions.filter((s) => s.status === 'cancelled').length
      let riskReason = ''
      if (lastD === null) {
        riskReason = locale === 'fr' ? 'Aucune séance' : locale === 'es' ? 'Sin sesiones' : 'No sessions yet'
      } else if (lastD > 14) {
        riskReason = locale === 'fr' ? `Pas de séance depuis ${lastD}j` : locale === 'es' ? `Sin sesión en ${lastD} días` : `No session in ${lastD} days`
      } else if (cancellations >= 2) {
        riskReason = locale === 'fr' ? `${cancellations} annulations récentes` : locale === 'es' ? `${cancellations} cancelaciones recientes` : `${cancellations} cancellations recently`
      } else if (momentum <= 5) {
        riskReason = locale === 'fr' ? 'Objectifs stagnants' : locale === 'es' ? 'Objetivos estancados' : 'Milestones stalled'
      } else {
        riskReason = locale === 'fr' ? 'Engagement faible' : locale === 'es' ? 'Bajo compromiso' : 'Low engagement'
      }

      return { member: m, score, attendance, recency, consistency, momentum, riskReason }
    })
    .sort((a, b) => a.score - b.score)


  // ── Practitioner Pulse metrics ─────────────────────────────────────
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
  const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000)

  const recentFourWeeks = sessions.filter((s) => new Date(s.scheduled_at) >= fourWeeksAgo && s.status === 'completed')
  const prevFourWeeks = sessions.filter((s) => {
    const d = new Date(s.scheduled_at)
    return d >= eightWeeksAgo && d < fourWeeksAgo && s.status === 'completed'
  })
  const sessionsPerWeek = recentFourWeeks.length / 4
  const prevSessionsPerWeek = prevFourWeeks.length / 4
  const weekTrend = sessionsPerWeek > prevSessionsPerWeek + 0.5 ? 'up' : sessionsPerWeek < prevSessionsPerWeek - 0.5 ? 'down' : 'flat'

  const pastSessions = sessions.filter((s) => s.status !== 'scheduled')
  const completionRate = pastSessions.length > 0
    ? Math.round((pastSessions.filter((s) => s.status === 'completed').length / pastSessions.length) * 100)
    : 0

  const completedSessions = sessions.filter((s) => s.status === 'completed')
  const sessionsWithNotes = completedSessions.filter((s) => notes.some((n) => n.session_id === s.id)).length
  const notesCoverage = completedSessions.length > 0 ? Math.round((sessionsWithNotes / completedSessions.length) * 100) : 0

  const crisisSessions = sessions.filter((s) => s.session_type === 'crisis').length
  const crisisRatio = sessions.length > 0 ? Math.round((crisisSessions / sessions.length) * 100) : -1

  // ── Journey Velocity ───────────────────────────────────────────────
  const stageOrder = ['discovery', 'planned', 'building', 'in_progress', 'thriving', 'independent', 'achieved']
  const stageLabels: Record<string, Record<string, string>> = {
    discovery: { en: 'Discovery', fr: 'Découverte', es: 'Descubrimiento' },
    planned: { en: 'Planned', fr: 'Planifié', es: 'Planificado' },
    building: { en: 'Building', fr: 'Construction', es: 'Construcción' },
    in_progress: { en: 'In Progress', fr: 'En cours', es: 'En progreso' },
    thriving: { en: 'Thriving', fr: 'Épanouissement', es: 'Florecimiento' },
    independent: { en: 'Independent', fr: 'Autonome', es: 'Independiente' },
    achieved: { en: 'Achieved', fr: 'Atteint', es: 'Logrado' },
  }
  const lang = locale === 'fr' ? 'fr' : locale === 'es' ? 'es' : 'en'

  // Avg time per stage: for milestones that have moved past a given stage
  const stageAvgDays: { stage: string; label: string; avgDays: number }[] = []
  for (const stage of ['discovery', 'building', 'thriving']) {
    const pastMs = milestones.filter((ms) => {
      const idx = stageOrder.indexOf(ms.status)
      const stageIdx = stageOrder.indexOf(stage)
      return idx > stageIdx
    })
    if (pastMs.length > 0) {
      const avgMs = pastMs.reduce((sum, ms) => {
        const days = (new Date(ms.updated_at).getTime() - new Date(ms.created_at).getTime()) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0) / pastMs.length
      stageAvgDays.push({ stage, label: stageLabels[stage][lang], avgDays: Math.round(avgMs) })
    }
  }

  // Stuck milestones: in discovery/building for >30 days with no status change
  const stuckMilestones = milestones.filter((ms) => {
    if (ms.status !== 'discovery' && ms.status !== 'building' && ms.status !== 'planned') return false
    const daysSinceUpdate = (now.getTime() - new Date(ms.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate > 30
  })
  const stuckMemberIds = [...new Set(stuckMilestones.map((ms) => ms.member_id))]
  const stuckMemberNames = stuckMemberIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => `${m!.first_name} ${m!.last_name[0]}.`)
    .slice(0, 3)

  const newClientsInMonth = members.filter((m) => {
    const d = new Date(m.created_at)
    return d >= selMonthStart && d <= selMonthEnd
  }).length

  const notesInMonth = notes.filter((n) => {
    const d = new Date(n.created_at)
    return d >= selMonthStart && d <= selMonthEnd
  }).length

  // ── Heatmap data ──────────────────────────────────────────────────
  const heatmapColorMap: Record<string, string> = {
    completed: '#10b981',
    cancelled: '#9ca3af',
    no_show: '#f59e0b',
    scheduled: '#6366f1',
    empty: '#f3f4f6',
  }
  const heatmapPriority: Record<string, number> = { no_show: 4, cancelled: 3, completed: 2, scheduled: 1 }
  const daysInSelMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  const firstDayWeekday = (new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay() + 6) % 7 // Mon=0
  const heatmapCells: { day: number; row: number; col: number; status: string; count: number }[] = []
  for (let day = 1; day <= daysInSelMonth; day++) {
    const dayStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
    const dayEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day, 23, 59, 59)
    const daySessions = sessionsInMonthArr.filter((s) => {
      const d = new Date(s.scheduled_at)
      return d >= dayStart && d <= dayEnd
    })
    let dominant = 'empty'
    let maxPri = 0
    for (const s of daySessions) {
      const p = heatmapPriority[s.status] || 0
      if (p > maxPri) { maxPri = p; dominant = s.status }
    }
    const offset = firstDayWeekday + day - 1
    heatmapCells.push({ day, row: offset % 7, col: Math.floor(offset / 7), status: dominant, count: daySessions.length })
  }
  const totalWeeks = heatmapCells.length > 0 ? heatmapCells[heatmapCells.length - 1].col + 1 : 1
  const heatmapDayLabels = locale === 'fr'
    ? ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    : locale === 'es'
      ? ['L', 'M', 'M', 'J', 'V', 'S', 'D']
      : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // ── Orbit data ────────────────────────────────────────────────────
  const orbitMembers = engagementScores.slice(0, 20).map((e, i) => {
    const distance = 15 + ((100 - e.score) / 100) * 115
    const angle = (137.508 * i * Math.PI) / 180
    const offsetX = Math.cos(angle) * distance
    const offsetY = Math.sin(angle) * distance
    const color = e.score >= 70 ? 'emerald' : e.score >= 40 ? 'amber' : 'red'
    const level = e.score >= 70 ? 'ontrack' : e.score >= 40 ? 'watch' : 'atrisk'
    return { ...e, distance, angle, offsetX, offsetY, color, level, index: i }
  })
  const orbitOverflow = Math.max(0, engagementScores.length - 20)

  // ── Weekly bars data ──────────────────────────────────────────────
  const weeklyBars: number[] = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000)
    weeklyBars.push(sessions.filter((s) => {
      const d = new Date(s.scheduled_at)
      return s.status === 'completed' && d >= weekStart && d < weekEnd
    }).length)
  }
  const maxWeeklyBar = Math.max(...weeklyBars, 1)

  // ── Journey lanes data ────────────────────────────────────────────
  const journeyLanesDef = [
    { key: 'discovery', label: locale === 'fr' ? 'Découverte' : locale === 'es' ? 'Descubrimiento' : 'Discovery', color: 'bg-blue-400', dotColor: 'bg-blue-400', statuses: ['discovery', 'planned'] },
    { key: 'building', label: locale === 'fr' ? 'Construction' : locale === 'es' ? 'Construcción' : 'Building', color: 'bg-amber-400', dotColor: 'bg-amber-400', statuses: ['building', 'in_progress'] },
    { key: 'thriving', label: locale === 'fr' ? 'Épanouissement' : locale === 'es' ? 'Florecimiento' : 'Thriving', color: 'bg-emerald-400', dotColor: 'bg-emerald-400', statuses: ['thriving'] },
    { key: 'independent', label: locale === 'fr' ? 'Autonome' : locale === 'es' ? 'Independiente' : 'Independent', color: 'bg-violet-400', dotColor: 'bg-violet-400', statuses: ['independent', 'achieved'] },
  ]
  const journeyLanes = journeyLanesDef.map((lane) => {
    const laneMilestones = milestonesInRange.filter((ms) => lane.statuses.includes(ms.status)).map((ms) => {
      const daysSinceUpdate = (now.getTime() - new Date(ms.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      const isStuck = (ms.status === 'discovery' || ms.status === 'planned' || ms.status === 'building') && daysSinceUpdate > 30
      const member = members.find((m) => m.id === ms.member_id)
      const initials = member ? `${member.first_name[0]}${member.last_name[0]}` : '?'
      return { ...ms, isStuck, initials }
    })
    return { ...lane, milestones: laneMilestones }
  })

  // ── Greeting ─────────────────────────────────────────────────────────

  const hour = now.getHours()
  const greeting =
    locale === 'fr'
      ? hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
      : locale === 'es'
        ? hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
        : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const firstName = userProfile?.full_name?.split(' ')[0] || ''

  // ── Empty state ──────────────────────────────────────────────────────

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AppSidebar activeItem="analytics" />
        <main className="flex-1 ml-64">
          <AppHeader
            user={userProfile}
            leftContent={
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Activity className="w-4 h-4" />
                <span>{locale === 'fr' ? 'Rythme' : locale === 'es' ? 'Tu ritmo' : 'Your Flow'}</span>
              </div>
            }
          />
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {locale === 'fr'
                  ? 'Commencez votre pratique'
                  : locale === 'es'
                    ? 'Comienza tu práctica'
                    : 'Start your practice'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {locale === 'fr'
                  ? 'Ajoutez votre premier client pour voir votre rythme de pratique ici.'
                  : locale === 'es'
                    ? 'Agrega tu primer cliente para ver el ritmo de tu práctica aquí.'
                    : 'Add your first client to see your practice flow here.'}
              </p>
              <Link
                href="/members"
                className="inline-flex items-center px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {locale === 'fr' ? 'Ajouter un client' : locale === 'es' ? 'Agregar un cliente' : 'Add a client'}
              </Link>
            </motion.div>
          </div>
        </main>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="analytics" />

      <main className="flex-1 ml-64">
        <AppHeader
          user={userProfile}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Activity className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Rythme' : locale === 'es' ? 'Tu ritmo' : 'Your Flow'}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* ─── Greeting + Month selector ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {greeting}{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {locale === 'fr'
                  ? 'Voici le pouls de votre pratique.'
                  : locale === 'es'
                    ? 'Aquí está el pulso de tu práctica.'
                    : "Here's the pulse of your practice."}
              </p>
            </div>

            {/* Month picker */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-0.5 shrink-0">
              <button
                onClick={goToPrev}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-gray-700 min-w-[100px] text-center capitalize select-none">
                {formatMonthLabel(selectedMonth)}
              </span>
              <button
                onClick={goToNext}
                disabled={isCurrentMonth}
                className={`p-1.5 rounded-md transition-colors ${
                  isCurrentMonth
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* ─── 1. Practice Pulse — borderless stats ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-8 mb-8"
          >
            {/* People */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-[18px] h-[18px] text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  {locale === 'fr' ? 'Personnes accompagnées' : locale === 'es' ? 'Personas que apoyas' : 'People You Support'}
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-none">{activeMembers}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {locale === 'fr' ? `${members.length} au total` : locale === 'es' ? `${members.length} en total` : `${members.length} total`}
                </p>
              </div>
            </div>

            {/* Sessions */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Calendar className="w-[18px] h-[18px] text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  {locale === 'fr' ? 'Séances' : locale === 'es' ? 'Sesiones' : 'Sessions'}
                </p>
                <div className="flex items-end gap-3">
                  <p className="text-2xl font-bold text-gray-900 leading-none">{sessionsInMonth}</p>
                  <div className="w-16 h-7 mb-0.5">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Next session */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Clock className="w-[18px] h-[18px] text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  {locale === 'fr' ? 'Prochaine séance' : locale === 'es' ? 'Próxima sesión' : 'Next Session'}
                </p>
                {nextSession ? (
                  <Link href={`/members/${nextSession.member_id}`} className="group">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                      {nextSession.member_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(nextSession.scheduled_at).toLocaleDateString(localeId(locale), { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}
                      {new Date(nextSession.scheduled_at).toLocaleTimeString(localeId(locale), { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-400">
                    {locale === 'fr' ? 'Rien de planifié' : locale === 'es' ? 'Nada programado' : 'Nothing scheduled'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Divider ───────────────────────────────────────────────── */}
          <div className="border-t border-gray-200 mb-6" />

          {/* ─── 2 + 3. Chart + Journey side-by-side ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 mb-6 grid-cols-1 lg:grid-cols-6"
          >
            {/* Sessions chart — takes 2/6 */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {locale === 'fr' ? 'Vos séances' : locale === 'es' ? 'Tus sesiones' : 'Your Sessions'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {locale === 'fr' ? 'Complétées par mois' : locale === 'es' ? 'Completadas por mes' : 'Completed per month'}
                  </p>
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip content={<ChartTooltip locale={locale} />} cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                      dot={false}
                      activeDot={{ r: 3.5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Session Rhythm Heatmap — takes 2/6 */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 lg:col-span-2 flex flex-col">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {locale === 'fr' ? 'Rythme' : locale === 'es' ? 'Ritmo' : 'Rhythm'}
                </h3>
                <p className="text-xs text-gray-400">
                  {locale === 'fr' ? 'Activité par jour' : locale === 'es' ? 'Actividad por día' : 'Activity by day'}
                </p>
              </div>
              {totalHealthSessions > 0 ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `10px repeat(${totalWeeks}, 1fr)` }}>
                      {Array.from({ length: 7 }, (_, row) => (
                        <Fragment key={`row-${row}`}>
                          <div className="h-4 flex items-center">
                            {row % 2 === 0 && <span className="text-[7px] text-gray-400 leading-none">{heatmapDayLabels[row]}</span>}
                          </div>
                          {Array.from({ length: totalWeeks }, (_, col) => {
                            const cell = heatmapCells.find((c) => c.col === col && c.row === row)
                            return (
                              <motion.div
                                key={`${col}-${row}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: (col * 7 + row) * 0.008, duration: 0.15 }}
                                className="w-4 h-4 rounded-[3px] flex items-center justify-center"
                                style={{
                                  backgroundColor: cell ? heatmapColorMap[cell.status] : 'transparent',
                                  opacity: cell ? (cell.status === 'empty' ? 0.7 : 1) : 0,
                                }}
                                title={cell ? `${locale === 'fr' ? 'Jour' : locale === 'es' ? 'Día' : 'Day'} ${cell.day}${cell.count > 1 ? ` (${cell.count})` : ''}` : ''}
                              >
                                {cell && cell.count > 1 && cell.status !== 'empty' && (
                                  <span className="text-[7px] font-bold text-white leading-none">{cell.count}</span>
                                )}
                              </motion.div>
                            )
                          })}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-0.5 mt-3 pt-3 border-t border-gray-50">
                    {completedInMonth > 0 && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{locale === 'fr' ? 'Complétées' : locale === 'es' ? 'Completadas' : 'Completed'}</span>
                        <span className="text-gray-400 tabular-nums">{pct(completedInMonth)}%</span>
                      </div>
                    )}
                    {cancelledInMonth > 0 && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />{locale === 'fr' ? 'Annulées' : locale === 'es' ? 'Canceladas' : 'Cancelled'}</span>
                        <span className="text-gray-400 tabular-nums">{pct(cancelledInMonth)}%</span>
                      </div>
                    )}
                    {noShowInMonth > 0 && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{locale === 'fr' ? 'Absences' : locale === 'es' ? 'No asistió' : 'No-show'}</span>
                        <span className="text-gray-400 tabular-nums">{pct(noShowInMonth)}%</span>
                      </div>
                    )}
                    {scheduledInMonth > 0 && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{locale === 'fr' ? 'Planifiées' : locale === 'es' ? 'Programadas' : 'Scheduled'}</span>
                        <span className="text-gray-400 tabular-nums">{pct(scheduledInMonth)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-gray-300">
                    {locale === 'fr' ? 'Aucune séance' : locale === 'es' ? 'Sin sesiones' : 'No sessions'}
                  </p>
                </div>
              )}
            </div>

            {/* Journey Flow Lanes — takes 2/6 */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 lg:col-span-2 flex flex-col">
              <h3 className="text-sm font-medium text-gray-900">
                {locale === 'fr' ? 'Parcours' : locale === 'es' ? 'Recorrido' : 'Journey'}
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {totalMilestones > 0
                  ? `${totalMilestones} ${locale === 'fr' ? 'objectifs' : locale === 'es' ? 'objetivos' : 'milestones'}`
                  : locale === 'fr' ? 'Objectifs suivis' : locale === 'es' ? 'Objetivos seguidos' : 'Milestones tracked'}
              </p>

              {totalMilestones > 0 ? (
                <div className="flex-1 flex flex-col">
                  {/* Stacked bar */}
                  <div className="flex h-3 rounded-full overflow-hidden mb-4">
                    {journeyLanes.map((lane) => (
                      lane.milestones.length > 0 && (
                        <motion.div
                          key={lane.key}
                          initial={{ width: 0 }}
                          animate={{ width: `${(lane.milestones.length / totalMilestones) * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`${lane.dotColor} first:rounded-l-full last:rounded-r-full`}
                        />
                      )
                    ))}
                  </div>

                  {/* Stage rows */}
                  <div className="space-y-2.5">
                    {journeyLanes.map((lane) => (
                      <div key={lane.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${lane.color}`} />
                          <span className="text-xs text-gray-600">{lane.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {lane.milestones.length > 0 && (
                            <div className="flex -space-x-1">
                              {lane.milestones.slice(0, 4).map((ms) => (
                                <div
                                  key={ms.id}
                                  className={`w-5 h-5 rounded-full ${lane.dotColor} flex items-center justify-center ring-2 ring-white ${ms.isStuck ? 'ring-amber-300 animate-pulse' : ''}`}
                                  title={ms.initials}
                                >
                                  <span className="text-[7px] font-semibold text-white leading-none">{ms.initials}</span>
                                </div>
                              ))}
                              {lane.milestones.length > 4 && (
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-white">
                                  <span className="text-[7px] font-semibold text-gray-500 leading-none">+{lane.milestones.length - 4}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-gray-700 tabular-nums w-5 text-right">{lane.milestones.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Velocity stats */}
                  {(stageAvgDays.length > 0 || stuckMilestones.length > 0) && (
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      {stageAvgDays.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                            {locale === 'fr' ? 'Moy. par étape' : locale === 'es' ? 'Prom. por etapa' : 'Avg. per stage'}
                          </p>
                          <div className="flex gap-2">
                            {stageAvgDays.map((s) => (
                              <div key={s.stage} className="text-[10px] text-gray-500">
                                <span className="font-medium text-gray-700">{s.avgDays}</span>
                                <span className="text-gray-400">d</span>
                                {' '}
                                <span className="text-gray-400">{s.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {stuckMilestones.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-amber-600">
                            {stuckMilestones.length} {locale === 'fr' ? 'bloqués' : locale === 'es' ? 'estancados' : 'stuck'}
                            {stuckMemberNames.length > 0 && ` · ${stuckMemberNames.join(', ')}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-gray-300">
                    {locale === 'fr'
                      ? 'Aucune donnée pour cette période'
                      : locale === 'es'
                        ? 'Sin datos para este período'
                        : 'No data for this period'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── Client Engagement Radar ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-6"
          >
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {locale === 'fr' ? 'Mes personnes' : locale === 'es' ? 'Mi gente' : 'My People'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {locale === 'fr' ? 'Score par distance au centre' : locale === 'es' ? 'Puntuación por distancia al centro' : 'Score by distance to center'}
                  </p>
                </div>
              </div>

              {/* Orbit Map */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  {/* Zone rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[260px] h-[260px] rounded-full border border-dashed border-red-200 absolute" />
                    <div className="w-[180px] h-[180px] rounded-full border border-dashed border-amber-200 absolute" />
                    <div className="w-[100px] h-[100px] rounded-full border border-dashed border-emerald-200 absolute" />
                  </div>
                  {/* Center "You" dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center z-10">
                    <span className="text-[7px] font-bold text-white">
                      {locale === 'fr' ? 'Vous' : locale === 'es' ? 'Tú' : 'You'}
                    </span>
                  </div>
                  {/* Member dots */}
                  {orbitMembers.map((om) => {
                    const bgColor = om.color === 'emerald' ? 'bg-emerald-500' : om.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                    const glowColor = om.color === 'emerald' ? 'rgba(16,185,129,0.3)' : om.color === 'amber' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
                    return (
                      <Link key={om.member.id} href={`/members/${om.member.id}`}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: om.index * 0.04, duration: 0.4 }}
                          whileHover={{ scale: 1.2 }}
                          onHoverStart={() => setHoveredMember(om.member.id)}
                          onHoverEnd={() => setHoveredMember(null)}
                          className={`absolute w-7 h-7 rounded-full ${bgColor} flex items-center justify-center cursor-pointer`}
                          style={{
                            left: `calc(50% + ${om.offsetX}px - 14px)`,
                            top: `calc(50% + ${om.offsetY}px - 14px)`,
                            zIndex: hoveredMember === om.member.id ? 50 : 20,
                            boxShadow: hoveredMember === om.member.id ? `0 0 12px 4px ${glowColor}` : 'none',
                          }}
                        >
                          <span className="text-[8px] font-semibold text-white leading-none">
                            {om.member.first_name[0]}{om.member.last_name[0]}
                          </span>
                          {/* Tooltip */}
                          <AnimatePresence>
                            {hoveredMember === om.member.id && (() => {
                              const lastD = daysAgo(om.member.last_session_at)
                              const lastLabel = lastD === null
                                ? (locale === 'fr' ? 'Jamais vu' : locale === 'es' ? 'Nunca visto' : 'Never seen')
                                : lastD === 0
                                  ? (locale === 'fr' ? "Aujourd'hui" : locale === 'es' ? 'Hoy' : 'Today')
                                  : (locale === 'fr' ? `Il y a ${lastD}j` : locale === 'es' ? `Hace ${lastD}d` : `${lastD}d ago`)
                              const levelLabel = om.score >= 70
                                ? (locale === 'fr' ? 'En voie' : locale === 'es' ? 'En camino' : 'On Track')
                                : om.score >= 40
                                  ? (locale === 'fr' ? 'À surveiller' : locale === 'es' ? 'Observar' : 'Watch')
                                  : (locale === 'fr' ? 'À risque' : locale === 'es' ? 'En riesgo' : 'At Risk')
                              const levelColor = om.score >= 70 ? 'bg-emerald-400' : om.score >= 40 ? 'bg-amber-400' : 'bg-red-400'
                              return (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  className="absolute -top-[72px] left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-30 pointer-events-none"
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <p className="font-semibold text-[11px]">{om.member.first_name} {om.member.last_name}</p>
                                    <span className={`w-1.5 h-1.5 rounded-full ${levelColor}`} />
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <span>{levelLabel}</span>
                                    <span className="text-gray-600">·</span>
                                    <span>{lastLabel}</span>
                                  </div>
                                  <p className="text-gray-500 mt-1">{om.riskReason}</p>
                                  <div className="flex items-center gap-1 mt-1 text-gray-400">
                                    <span>{locale === 'fr' ? 'Voir profil' : locale === 'es' ? 'Ver perfil' : 'View profile'}</span>
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </div>
                                </motion.div>
                              )
                            })()}
                          </AnimatePresence>
                        </motion.div>
                      </Link>
                    )
                  })}
                  {/* Overflow indicator */}
                  {orbitOverflow > 0 && (
                    <div className="absolute bottom-0 right-0 text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded-full border border-gray-100">
                      +{orbitOverflow} {locale === 'fr' ? 'de plus' : locale === 'es' ? 'más' : 'more'}
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />{locale === 'fr' ? 'En voie' : locale === 'es' ? 'En camino' : 'On Track'}</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-500" />{locale === 'fr' ? 'À surveiller' : locale === 'es' ? 'Observar' : 'Watch'}</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-red-500" />{locale === 'fr' ? 'À risque' : locale === 'es' ? 'En riesgo' : 'At Risk'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── 4. Needs Attention ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            {needsAttentionEmpty ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <Heart className="w-4 h-4 text-emerald-400" />
                {locale === 'fr'
                  ? 'Tout est à jour — beau travail !'
                  : locale === 'es'
                    ? 'Todo al día — ¡buen trabajo!'
                    : "All caught up — nice work!"}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Overdue follow-ups */}
                {staleClients.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {locale === 'fr'
                          ? 'Suivis en retard'
                          : locale === 'es'
                            ? 'Seguimientos pendientes'
                            : 'Overdue Follow-ups'}
                      </h3>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                      {staleClients.map((m) => {
                        const d = daysAgo(m.last_session_at)
                        return (
                          <Link key={m.id} href={`/members/${m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                              {m.first_name[0]}{m.last_name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {m.first_name} {m.last_name}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {d === null
                                ? locale === 'fr' ? 'Jamais vu' : locale === 'es' ? 'Nunca visto' : 'Never seen'
                                : locale === 'fr' ? `${d}j` : `${d}d ago`}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Coming up this week */}
                {thisWeekSessions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {locale === 'fr' ? 'Cette semaine' : locale === 'es' ? 'Esta semana' : 'Coming up this week'}
                      </h3>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                      {thisWeekSessions.map((s) => (
                        <Link key={s.id} href={`/members/${s.member_id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.member_name}</p>
                            <p className="text-xs text-gray-400">{formatSessionType(s.session_type, locale)}</p>
                          </div>
                          <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                            {new Date(s.scheduled_at).toLocaleDateString(localeId(locale), { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' · '}
                            {new Date(s.scheduled_at).toLocaleTimeString(localeId(locale), { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* ─── Practitioner Pulse ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
          >
            {/* Sessions/Week — mini bars */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-medium text-gray-500">
                  {locale === 'fr' ? 'Séances/sem.' : locale === 'es' ? 'Sesiones/sem.' : 'Sessions/Week'}
                </span>
              </div>
              <div className="flex items-end gap-1.5 mb-3">
                <span className="text-xl font-bold text-gray-900">{sessionsPerWeek.toFixed(1)}</span>
                {weekTrend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />}
                {weekTrend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500 mb-0.5" />}
                {weekTrend === 'flat' && <Minus className="w-3.5 h-3.5 text-gray-400 mb-0.5" />}
              </div>
              <div className="flex items-end gap-1.5 h-8">
                {weeklyBars.map((count, i) => (
                  <motion.div
                    key={i}
                    className="w-3 bg-blue-400 rounded-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${(count / maxWeeklyBar) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </div>

            {/* Completion Rate — gauge ring */}
            {(() => {
              const circumference = 2 * Math.PI * 28
              const crColor = completionRate > 80 ? '#10b981' : completionRate >= 60 ? '#f59e0b' : '#ef4444'
              return (
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-gray-500">
                      {locale === 'fr' ? 'Taux complétion' : locale === 'es' ? 'Tasa completado' : 'Completion Rate'}
                    </span>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <svg width={64} height={64} className="-rotate-90">
                      <circle cx={32} cy={32} r={28} fill="none" stroke="#f3f4f6" strokeWidth={5} />
                      <motion.circle
                        cx={32} cy={32} r={28} fill="none" stroke={crColor} strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (completionRate / 100) * circumference }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className={`absolute text-sm font-bold ${completionRate > 80 ? 'text-emerald-600' : completionRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {completionRate}%
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Notes Coverage — gauge ring */}
            {(() => {
              const circumference = 2 * Math.PI * 28
              const ncColor = notesCoverage > 80 ? '#10b981' : notesCoverage >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-medium text-gray-500">
                      {locale === 'fr' ? 'Couverture notes' : locale === 'es' ? 'Cobertura notas' : 'Notes Coverage'}
                    </span>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <svg width={64} height={64} className="-rotate-90">
                      <circle cx={32} cy={32} r={28} fill="none" stroke="#f3f4f6" strokeWidth={5} />
                      <motion.circle
                        cx={32} cy={32} r={28} fill="none" stroke={ncColor} strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (notesCoverage / 100) * circumference }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className={`absolute text-sm font-bold ${notesCoverage > 80 ? 'text-emerald-600' : notesCoverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {notesCoverage}%
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Crisis Ratio — gauge ring (inverted: lower = better) */}
            {(() => {
              const circumference = 2 * Math.PI * 28
              const isNoData = crisisRatio < 0
              const crVal = isNoData ? 0 : crisisRatio
              const crColor = isNoData ? '#d1d5db' : crVal < 10 ? '#10b981' : crVal <= 25 ? '#f59e0b' : '#ef4444'
              return (
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-xs font-medium text-gray-500">
                      {locale === 'fr' ? 'Ratio crise' : locale === 'es' ? 'Ratio crisis' : 'Crisis Ratio'}
                    </span>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <svg width={64} height={64} className="-rotate-90">
                      <circle cx={32} cy={32} r={28} fill="none" stroke="#f3f4f6" strokeWidth={5} />
                      <motion.circle
                        cx={32} cy={32} r={28} fill="none" stroke={crColor} strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (crVal / 100) * circumference }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className={`absolute text-sm font-bold ${isNoData ? 'text-gray-400' : crVal < 10 ? 'text-emerald-600' : crVal <= 25 ? 'text-amber-600' : 'text-red-600'}`}>
                      {isNoData ? '—' : `${crisisRatio}%`}
                    </span>
                  </div>
                </div>
              )
            })()}
          </motion.div>

          {/* ─── 5. Activity Footer ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="border-t border-gray-100 pt-4 pb-2 text-xs text-gray-400 text-center"
          >
            {locale === 'fr'
              ? `${notesInMonth} notes · ${data.sharedResources} ressources partagées · ${newClientsInMonth} nouveaux clients`
              : locale === 'es'
                ? `${notesInMonth} notas · ${data.sharedResources} recursos compartidos · ${newClientsInMonth} clientes nuevos`
                : `${notesInMonth} notes · ${data.sharedResources} resources shared · ${newClientsInMonth} new clients`}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
