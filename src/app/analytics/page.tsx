'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
}

interface MilestoneRow {
  id: string
  status: string
  created_at: string
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
}

interface AnalyticsState {
  members: MemberRow[]
  sessions: SessionRow[]
  milestones: MilestoneRow[]
  notes: NoteRow[]
  sharedResources: number
  upcomingSessions: UpcomingSession[]
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

      const [membersRes, sessionsRes, milestonesRes, notesRes, sharedRes, upcomingRes] =
        await Promise.all([
          supabase
            .from('members')
            .select('id, first_name, last_name, status, last_session_at, created_at')
            .eq('practitioner_id', user.id),
          supabase
            .from('sessions')
            .select('id, member_id, status, scheduled_at, session_type')
            .eq('practitioner_id', user.id),
          supabase
            .from('milestones')
            .select('id, status, created_at')
            .eq('practitioner_id', user.id),
          supabase
            .from('progress_notes')
            .select('id, created_at')
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
          <AppHeader user={null} />
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

  const { members, sessions, milestones, notes, upcomingSessions } = data

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

  const newClientsInMonth = members.filter((m) => {
    const d = new Date(m.created_at)
    return d >= selMonthStart && d <= selMonthEnd
  }).length

  const notesInMonth = notes.filter((n) => {
    const d = new Date(n.created_at)
    return d >= selMonthStart && d <= selMonthEnd
  }).length

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

  const journeySegments = [
    { count: discoveryCount, color: 'bg-blue-400', label: locale === 'fr' ? 'Découverte' : locale === 'es' ? 'Descubrimiento' : 'Discovery' },
    { count: buildingCount, color: 'bg-amber-400', label: locale === 'fr' ? 'Construction' : locale === 'es' ? 'Construcción' : 'Building' },
    { count: thrivingCount, color: 'bg-emerald-400', label: locale === 'fr' ? 'Épanouissement' : locale === 'es' ? 'Florecimiento' : 'Thriving' },
    { count: independentCount, color: 'bg-violet-400', label: locale === 'fr' ? 'Autonome' : locale === 'es' ? 'Independiente' : 'Independent' },
  ].filter((s) => s.count > 0)

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
            className="grid gap-4 mb-6 grid-cols-1 lg:grid-cols-5"
          >
            {/* Sessions chart — takes 3/5 */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 lg:col-span-3">
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

            {/* Journey — takes 2/5 */}
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
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex h-4 rounded-full overflow-hidden mb-3">
                    {journeySegments.map((seg) => (
                      <div
                        key={seg.label}
                        className={seg.color}
                        style={{ width: `${(seg.count / totalMilestones) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {journeySegments.map((seg) => (
                      <div key={seg.label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                          {seg.label}
                        </span>
                        <span className="text-gray-400 tabular-nums">{seg.count}</span>
                      </div>
                    ))}
                  </div>
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
