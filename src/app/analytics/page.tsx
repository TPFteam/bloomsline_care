'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Calendar,
  Clock,
  Activity,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  MessageCircle,
  BarChart3,
  Grid3X3,
  CreditCard,
  Settings,
  Search,
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar, AppHeader } from '@/components/layout'
import { BloomInlineChat } from '@/components/bloom/bloom-inline-chat'
import { createClient } from '@/lib/supabase/browser-client'
import type { User } from '@/types/user'
import {
  computeEngagement,
  parseEngagementSettings,
  DEFAULT_ENGAGEMENT_SETTINGS,
  type EngagementSettings,
  type EngagementSignalId,
} from '@/lib/analytics/engagement'
import { EngagementSettingsDrawer } from '@/components/analytics/EngagementSettingsDrawer'
import { PatientQuickViewDrawer } from '@/components/analytics/PatientQuickViewDrawer'
import { MemberSummaryModal } from '@/components/members/MemberSummaryModal'

// ── Types ────────────────────────────────────────────────────────────────

interface MemberRow {
  id: string
  first_name: string
  last_name: string
  status: string
  last_session_at: string | null
  created_at: string
  date_of_birth?: string | null
}

interface SessionRow {
  id: string
  member_id: string
  status: string
  scheduled_at: string
  session_type: string
  mood_rating: number | null
  session_format: string | null
  payment_status: string | null
  price: number | null
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

interface MonthlySessionDetail {
  memberName: string
  type: string
  status: string
  date: string
}

interface MonthlyData {
  month: string
  sessions: number
  details: MonthlySessionDetail[]
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

interface DeletedProspect {
  first_name: string
  last_name: string
  email: string | null
  created_at: string
  deleted_at: string
}

interface BookingRow {
  id: string
  start_time: string
  status: string
  payment_status: string | null
  price: number | null
  member_id: string | null
}

interface AnalyticsState {
  members: MemberRow[]
  sessions: SessionRow[]
  milestones: MilestoneRow[]
  notes: NoteRow[]
  sharedResources: number
  upcomingSessions: UpcomingSession[]
  resources: ResourceRow[]
  bookings: BookingRow[]
  currency: string
  sessionTypePrices: Record<string, number>
  // Engagement signals (per-member arrays for the orbit scoring)
  notesByMember: Record<string, Array<{ id: string; created_at: string; note_type?: string }>>
  reflectionsByMember: Record<string, Array<{ id: string; created_at: string }>>
  filesByMember: Record<string, Array<{ id: string; created_at: string }>>
  storiesByMember: Record<string, Array<{ id: string; shared_at: string }>>
  storyCommentsByMember: Record<string, Array<{ id: string; created_at: string; author_type: 'practitioner' | 'member' }>>
  resourceResponsesByMember: Record<string, Array<{ id: string; updated_at: string; status: string }>>
  pulseSentimentByMember: Record<string, 'progressing' | 'stable' | 'plateau' | 'attention' | null>
  // For the patient quick-view drawer
  pulseByMember: Record<string, { sentiment: 'progressing' | 'stable' | 'plateau' | 'attention' | null; headline: string | null; generatedAt: string } | null>
  assignedResourcesByMember: Record<string, number>  // total shared count
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

function humanTimeAgo(d: number | null, locale: string): string {
  if (d === null) return locale === 'fr' ? 'Pas encore rencontré' : locale === 'es' ? 'Aún no se han visto' : 'Not yet met'
  if (d === 0) return locale === 'fr' ? "Aujourd'hui" : locale === 'es' ? 'Hoy' : 'Today'
  if (d === 1) return locale === 'fr' ? 'Hier' : locale === 'es' ? 'Ayer' : 'Yesterday'
  if (d < 7) return locale === 'fr' ? `Il y a ${d} jours` : locale === 'es' ? `Hace ${d} días` : `${d} days ago`
  if (d < 14) return locale === 'fr' ? 'Il y a environ 1 semaine' : locale === 'es' ? 'Hace aproximadamente 1 semana' : 'About a week ago'
  if (d < 21) return locale === 'fr' ? 'Il y a environ 2 semaines' : locale === 'es' ? 'Hace unas 2 semanas' : 'About 2 weeks ago'
  if (d < 35) return locale === 'fr' ? 'Il y a environ un mois' : locale === 'es' ? 'Hace aproximadamente un mes' : 'About a month ago'
  return locale === 'fr' ? "Plus d'un mois" : locale === 'es' ? 'Más de un mes' : 'Over a month ago'
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

function buildMonthlyChart(sessions: SessionRow[], members: MemberRow[], locale: string, refDate: Date, mode: 'month' | 'year' | 'custom' = 'month'): MonthlyData[] {
  const data: MonthlyData[] = []
  const lid = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
  const months: Date[] = []
  if (mode === 'year') {
    for (let m = 0; m < 12; m++) months.push(new Date(refDate.getFullYear(), m, 1))
  } else {
    for (let i = 5; i >= 0; i--) months.push(new Date(refDate.getFullYear(), refDate.getMonth() - i, 1))
  }
  for (const d of months) {
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const monthSessions = sessions.filter((s) => {
      const sd = new Date(s.scheduled_at)
      return sd >= monthStart && sd <= monthEnd
    })
    const completed = monthSessions.filter(s => s.status === 'completed').length
    const details: MonthlySessionDetail[] = monthSessions
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .slice(0, 8)
      .map(s => {
        const mem = members.find(m => m.id === s.member_id)
        return {
          memberName: mem ? `${mem.first_name} ${mem.last_name[0]}.` : '—',
          type: s.session_type,
          status: s.status,
          date: new Date(s.scheduled_at).toLocaleDateString(lid, { day: 'numeric', weekday: 'short' }),
        }
      })
    data.push({ month: getMonthAbbrev(d, locale), sessions: completed, details })
  }
  return data
}

// ── Custom tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value: number; payload: MonthlyData }>; locale: string }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  const details = payload[0].payload.details || []

  const statusDot: Record<string, string> = {
    completed: 'bg-emerald-400',
    cancelled: 'bg-gray-400',
    no_show: 'bg-amber-400',
    scheduled: 'bg-indigo-400',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 min-w-[180px] max-w-[240px]">
      <p className="text-sm font-semibold text-gray-900 mb-2">
        {v} {locale === 'fr' ? 'complétées' : locale === 'es' ? 'completadas' : 'completed'}
      </p>
      {details.length > 0 && (
        <div className="space-y-1.5">
          {details.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[d.status] || 'bg-gray-300'}`} />
              <span className="text-xs text-gray-700 truncate flex-1">{d.memberName}</span>
              <span className="text-[10px] text-gray-400 shrink-0">{d.date}</span>
            </div>
          ))}
          {details.length >= 8 && (
            <p className="text-[10px] text-gray-400 pt-0.5">...</p>
          )}
        </div>
      )}
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
  const [deletedProspects, setDeletedProspects] = useState<DeletedProspect[]>([])
  const [data, setData] = useState<AnalyticsState | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'custom'>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showViewPicker, setShowViewPicker] = useState(false)
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)
  const [bloomOpen, setBloomOpen] = useState(false)
  const [bloomPrompt, setBloomPrompt] = useState<string | undefined>(undefined)
  // Blue hero panel: tabbed views that swap the middle while the ask bar stays.
  const [signalsTab, setSignalsTab] = useState<'overview' | 'sessions' | 'engagement' | 'progress' | 'attention'>('overview')
  const [expandedOwedMember, setExpandedOwedMember] = useState<string | null>(null)
  const moneyZoneRef = useRef<HTMLDivElement>(null)
  const [moneySpacer, setMoneySpacer] = useState(0)
  const tt = (en: string, fr: string, es: string) => (locale === 'fr' ? fr : locale === 'es' ? es : en)
  const [sessionView, setSessionView] = useState<'chart' | 'heatmap'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('analytics_session_view') as 'chart' | 'heatmap') || 'chart'
    }
    return 'chart'
  })
  const [engagementSettings, setEngagementSettings] = useState<EngagementSettings>(DEFAULT_ENGAGEMENT_SETTINGS)
  const [showEngagementDrawer, setShowEngagementDrawer] = useState(false)
  const [quickViewMemberId, setQuickViewMemberId] = useState<string | null>(null)
  const [pulseModalMemberId, setPulseModalMemberId] = useState<string | null>(null)

  const openBloom = (prompt?: string) => {
    setBloomPrompt(prompt)
    setBloomOpen(true)
  }

  const toggleSessionView = (view: 'chart' | 'heatmap') => {
    setSessionView(view)
    localStorage.setItem('analytics_session_view', view)
  }

  const isCurrentMonth =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear()

  const isCurrentYear = selectedMonth.getFullYear() === new Date().getFullYear()

  const goToPrev = () => {
    if (viewMode === 'year') {
      setSelectedMonth((prev) => new Date(prev.getFullYear() - 1, 0, 1))
    } else {
      setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }
  }

  const goToNext = () => {
    if (viewMode === 'year') {
      if (!isCurrentYear) setSelectedMonth((prev) => new Date(prev.getFullYear() + 1, 0, 1))
    } else {
      if (!isCurrentMonth) setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }
  }

  const canGoNext = viewMode === 'year' ? !isCurrentYear : viewMode === 'month' ? !isCurrentMonth : false

  const formatMonthLabel = (date: Date) => {
    if (viewMode === 'year') return date.getFullYear().toString()
    return date.toLocaleDateString(localeId(locale), { month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  // Gentle scroll-snap: once most of the upper section is scrolled past, the
  // page eases the Money section up under the sticky header and rests there
  // (proximity = only snaps when you're close, never fights mid-scroll).
  useEffect(() => {
    const el = document.documentElement
    const prevSnap = el.style.scrollSnapType
    const prevPad = el.style.scrollPaddingTop
    const prevBehavior = el.style.scrollBehavior
    el.style.scrollSnapType = 'y proximity'
    el.style.scrollPaddingTop = '64px'
    el.style.scrollBehavior = 'smooth'
    return () => {
      el.style.scrollSnapType = prevSnap
      el.style.scrollPaddingTop = prevPad
      el.style.scrollBehavior = prevBehavior
    }
  }, [])

  // Dynamic trailing spacer: when the Money zone is shorter than the viewport,
  // add just enough empty space below it so it can pin to the top (under the
  // 48px header) and stay there. Tall months get zero extra space. A
  // ResizeObserver recomputes whenever the zone's height changes (month
  // switch, expand/collapse) so this needs no render-derived deps — it must
  // sit above the loading/empty early returns to keep hook order stable.
  useEffect(() => {
    const recompute = () => {
      const zone = moneyZoneRef.current
      if (!zone) return
      const h = zone.getBoundingClientRect().height
      const needed = window.innerHeight - 64 - h
      setMoneySpacer(needed > 0 ? Math.ceil(needed) : 0)
    }
    recompute()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(recompute) : null
    if (ro && moneyZoneRef.current) ro.observe(moneyZoneRef.current)
    window.addEventListener('resize', recompute)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [data])

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
        setEngagementSettings(parseEngagementSettings((profile as { engagement_settings?: unknown }).engagement_settings))
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

      const [
        membersRes, sessionsRes, milestonesRes, notesRes, sharedRes, upcomingRes, resourcesRes, bookingsRes, bookingSettingsRes,
        // Engagement signals
        progressNotesByMemberRes, reflectionsRes, filesRes, storySharesRes, storyCommentsRes, resourceResponsesRes, summariesRes,
        memberSharedRes,
      ] = await Promise.all([
          supabase
            .from('members')
            .select('id, first_name, last_name, status, last_session_at, created_at, is_demo, date_of_birth')
            .eq('practitioner_id', user.id)
            .is('deleted_at', null),
          supabase
            .from('sessions')
            .select('id, member_id, status, scheduled_at, session_type, mood_rating, session_format, payment_status, price')
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
          supabase
            .from('bookings')
            .select('id, start_time, status, payment_status, price, member_id')
            .eq('practitioner_id', user.id)
            .in('status', ['confirmed', 'completed']),
          supabase
            .from('booking_settings')
            .select('currency, session_types')
            .eq('user_id', user.id)
            .maybeSingle(),
          // Per-member progress notes for engagement scoring + tag patterns
          supabase
            .from('progress_notes')
            .select('id, member_id, note_type, created_at')
            .eq('practitioner_id', user.id),
          // Patient reflections (mood/gratitude)
          supabase
            .from('member_reflections')
            .select('id, member_id, created_at'),
          // Patient files (excluding folders)
          supabase
            .from('member_files')
            .select('id, member_id, created_at')
            .or('is_folder.is.null,is_folder.eq.false'),
          // Story shares
          supabase
            .from('story_shares')
            .select('id, member_id, shared_at')
            .eq('practitioner_id', user.id),
          // Story share comments
          supabase
            .from('story_share_comments')
            .select('id, share_id, author_type, created_at, story_shares!inner(member_id, practitioner_id)')
            .eq('story_shares.practitioner_id', user.id),
          // Resource responses (submissions)
          supabase
            .from('resource_responses')
            .select('id, member_id, status, updated_at')
            .eq('practitioner_id', user.id),
          // Latest Bloom Pulse summary per member (for sentiment override + headline)
          supabase
            .from('member_summaries')
            .select('member_id, summary_content, summary_text, generated_at')
            .eq('practitioner_id', user.id)
            .order('generated_at', { ascending: false }),
          // Member resource assignments — for the "X / N completed" ratio per patient
          supabase
            .from('member_shared_resources')
            .select('id, member_id, shared_at')
            .eq('practitioner_id', user.id),
        ])

      const allMembers = (membersRes.data || []) as (MemberRow & { is_demo?: boolean })[]
      const demoMemberIds = new Set(allMembers.filter(m => m.is_demo).map(m => m.id))
      const members = allMembers.filter(m => !m.is_demo)
      const sessions = ((sessionsRes.data || []) as SessionRow[]).filter(s => !demoMemberIds.has(s.member_id))

      const upcoming = ((upcomingRes.data || []) as Array<{
        id: string
        member_id: string
        scheduled_at: string
        session_type: string
      }>).filter(s => !demoMemberIds.has(s.member_id))
      const enrichedUpcoming: UpcomingSession[] = upcoming.map((s) => {
        const m = members.find((mem) => mem.id === s.member_id)
        return {
          ...s,
          member_name: m ? `${m.first_name} ${m.last_name}` : '—',
        }
      })

      // Group engagement signal arrays by member_id (used by computeEngagement)
      const groupBy = <T extends { member_id: string }>(rows: T[]): Record<string, T[]> => {
        const out: Record<string, T[]> = {}
        for (const r of rows) {
          if (!r.member_id || demoMemberIds.has(r.member_id)) continue
          if (!out[r.member_id]) out[r.member_id] = []
          out[r.member_id].push(r)
        }
        return out
      }
      const notesByMember = groupBy((progressNotesByMemberRes.data || []) as Array<{ id: string; member_id: string; created_at: string }>)
      const reflectionsByMember = groupBy((reflectionsRes.data || []) as Array<{ id: string; member_id: string; created_at: string }>)
      const filesByMember = groupBy((filesRes.data || []) as Array<{ id: string; member_id: string; created_at: string }>)
      const storiesByMember = groupBy((storySharesRes.data || []) as Array<{ id: string; member_id: string; shared_at: string }>)
      const resourceResponsesByMember = groupBy((resourceResponsesRes.data || []) as Array<{ id: string; member_id: string; status: string; updated_at: string }>)

      // Story comments are joined via story_shares for member_id
      type StoryCommentRow = { id: string; share_id: string; author_type: 'practitioner' | 'member'; created_at: string; story_shares: { member_id: string } | { member_id: string }[] | null }
      const storyCommentsByMember: Record<string, Array<{ id: string; created_at: string; author_type: 'practitioner' | 'member' }>> = {}
      for (const c of (storyCommentsRes.data || []) as StoryCommentRow[]) {
        const ss = Array.isArray(c.story_shares) ? c.story_shares[0] : c.story_shares
        const mId = ss?.member_id
        if (!mId || demoMemberIds.has(mId)) continue
        if (!storyCommentsByMember[mId]) storyCommentsByMember[mId] = []
        storyCommentsByMember[mId].push({ id: c.id, created_at: c.created_at, author_type: c.author_type })
      }

      // Latest Pulse per member (sentiment + headline) — results sorted desc by generated_at
      type SummaryRow = {
        member_id: string
        summary_content: { v2?: { sentiment?: string; status_headline?: string }; current_status?: string } | null
        summary_text?: string | null
        generated_at: string
      }
      const pulseSentimentByMember: Record<string, 'progressing' | 'stable' | 'plateau' | 'attention' | null> = {}
      const pulseByMember: Record<string, { sentiment: 'progressing' | 'stable' | 'plateau' | 'attention' | null; headline: string | null; generatedAt: string } | null> = {}
      for (const s of (summariesRes.data || []) as SummaryRow[]) {
        if (pulseByMember[s.member_id]) continue // first hit is the latest
        const sentiment = s.summary_content?.v2?.sentiment
        const validSentiment: 'progressing' | 'stable' | 'plateau' | 'attention' | null =
          sentiment === 'progressing' || sentiment === 'stable' || sentiment === 'plateau' || sentiment === 'attention' ? sentiment : null
        pulseSentimentByMember[s.member_id] = validSentiment
        pulseByMember[s.member_id] = {
          sentiment: validSentiment,
          headline: s.summary_content?.v2?.status_headline || s.summary_content?.current_status?.split('.')[0]?.trim() || null,
          generatedAt: s.generated_at,
        }
      }

      // Total resources assigned per member (via member_shared_resources)
      const assignedResourcesByMember: Record<string, number> = {}
      for (const r of (memberSharedRes.data || []) as Array<{ id: string; member_id: string }>) {
        if (!r.member_id || demoMemberIds.has(r.member_id)) continue
        assignedResourcesByMember[r.member_id] = (assignedResourcesByMember[r.member_id] || 0) + 1
      }

      setData({
        members,
        sessions,
        milestones: ((milestonesRes.data || []) as MilestoneRow[]).filter(m => !demoMemberIds.has(m.member_id)),
        notes: (notesRes.data || []) as NoteRow[],
        sharedResources: sharedRes.data?.length || 0,
        upcomingSessions: enrichedUpcoming,
        resources: ((resourcesRes.data || []) as ResourceRow[]).filter(r => !demoMemberIds.has(r.member_id)),
        bookings: ((bookingsRes.data || []) as BookingRow[]).filter(b => !b.member_id || !demoMemberIds.has(b.member_id)),
        currency: (bookingSettingsRes.data as any)?.currency || 'EUR',
        sessionTypePrices: (() => {
          const types = (bookingSettingsRes.data as any)?.session_types || []
          const map: Record<string, number> = {}
          for (const t of types) {
            if (t.price) {
              map[t.id] = t.price
              if (t.name) map[t.name] = t.price
              if (t.name_fr) map[t.name_fr] = t.price
            }
          }
          return map
        })(),
        notesByMember,
        reflectionsByMember,
        filesByMember,
        storiesByMember,
        storyCommentsByMember,
        resourceResponsesByMember,
        pulseSentimentByMember,
        pulseByMember,
        assignedResourcesByMember,
      })

      // Fetch deleted/unconverted prospects
      const { data: deletedData } = await supabase
        .from('members')
        .select('first_name, last_name, email, created_at, deleted_at')
        .eq('practitioner_id', user.id)
        .eq('deletion_reason', 'prospect_not_converted')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      setDeletedProspects((deletedData || []) as DeletedProspect[])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    // Match the standard full-screen loader used across the other pages
    // (members, resources) instead of a Signals-specific one.
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">
            {locale === 'fr' ? 'Chargement de votre espace de travail...'
              : locale === 'es' ? 'Cargando tu espacio de trabajo...'
              : 'Loading your workspace...'}
          </span>
        </div>
      </div>
    )
  }

  if (!data) return null

  // ── Derived data ─────────────────────────────────────────────────────

  const { members, sessions, milestones, notes, upcomingSessions, resources, bookings, currency, sessionTypePrices } = data

  const activeMembers = members.filter((m) => m.status === 'active').length
  const now = new Date()

  // Date boundaries based on view mode
  const selMonthStart = viewMode === 'year'
    ? new Date(selectedMonth.getFullYear(), 0, 1)
    : viewMode === 'custom' && customStart
      ? new Date(customStart)
      : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
  const selMonthEnd = viewMode === 'year'
    ? new Date(selectedMonth.getFullYear(), 11, 31, 23, 59, 59)
    : viewMode === 'custom' && customEnd
      ? new Date(customEnd + 'T23:59:59')
      : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59)

  const sessionsInMonth = sessions.filter((s) => {
    const d = new Date(s.scheduled_at)
    return d >= selMonthStart && d <= selMonthEnd
  }).length

  const nextSession = upcomingSessions[0] || null
  const chartData = buildMonthlyChart(sessions, members, locale, selectedMonth, viewMode)

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
  // Pulls from the configurable engagement signals; see lib/analytics/engagement.ts
  interface EngagementEntry {
    member: MemberRow
    score: number
    tier: 'ontrack' | 'watch' | 'checkin'
    riskReason: string
    pulseOverride: 'up' | 'down' | null
  }

  // Self-tuning denominator: only score against signals this practice actually
  // uses. A signal counts only if a meaningful share of active patients have any
  // data for it — otherwise dead signals (e.g. patient-app reflections/stories
  // in a practice that doesn't use the app) drag everyone below the green tier.
  const activeMemberList = members.filter((m) => m.status === 'active')
  const signalHasData: Record<EngagementSignalId, (id: string) => boolean> = {
    sessions:    (id) => sessions.some((s) => s.member_id === id),
    notes:       (id) => (data.notesByMember[id]?.length ?? 0) > 0,
    milestones:  (id) => milestones.some((ms) => ms.member_id === id),
    reflections: (id) => (data.reflectionsByMember[id]?.length ?? 0) > 0,
    resources:   (id) => (data.resourceResponsesByMember[id]?.length ?? 0) > 0,
    stories:     (id) => (data.storiesByMember[id]?.length ?? 0) > 0,
    files:       (id) => (data.filesByMember[id]?.length ?? 0) > 0,
    bookings:    (id) => bookings.some((b) => b.member_id === id),
  }
  const coverageMin = Math.max(3, Math.ceil(activeMemberList.length * 0.2))
  const effectiveSettings: EngagementSettings = (() => {
    const next: EngagementSettings = { ...engagementSettings, signals: { ...engagementSettings.signals } }
    const enabledIds = (Object.keys(next.signals) as EngagementSignalId[]).filter((id) => next.signals[id].enabled)
    const coverage = (sig: EngagementSignalId) => activeMemberList.filter((m) => signalHasData[sig](m.id)).length
    const inUse = enabledIds.filter((id) => coverage(id) >= coverageMin)
    // Only prune when at least one enabled signal is actually in use, so a
    // deliberate single-signal filter still works on a sparse practice.
    if (inUse.length > 0) {
      for (const id of enabledIds) {
        if (coverage(id) < coverageMin) next.signals[id] = { ...next.signals[id], enabled: false }
      }
    }
    return next
  })()

  const engagementScores: EngagementEntry[] = members
    .filter((m) => m.status === 'active')
    .map((m) => {
      const memberSessions = sessions.filter((s) => s.member_id === m.id)
      const memberMilestones = milestones.filter((ms) => ms.member_id === m.id)
      const result = computeEngagement({
        memberId: m.id,
        lastSessionAt: m.last_session_at,
        sessions: memberSessions,
        notes: data.notesByMember[m.id] || [],
        milestones: memberMilestones,
        reflections: data.reflectionsByMember[m.id] || [],
        resources: data.resourceResponsesByMember[m.id] || [],
        stories: data.storiesByMember[m.id] || [],
        storyComments: data.storyCommentsByMember[m.id] || [],
        files: data.filesByMember[m.id] || [],
        bookings: bookings.filter(b => b.member_id === m.id).map(b => ({ id: b.id, start_time: b.start_time, status: b.status })),
        pulseSentiment: data.pulseSentimentByMember[m.id] || null,
      }, effectiveSettings, locale as 'en' | 'fr' | 'es')
      return { member: m, score: result.score, tier: result.tier, riskReason: result.riskReason, pulseOverride: result.pulseOverride }
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

  // ── Payment stats (uses sessions — that's where practitioners toggle paid/unpaid) ──
  const sessionsForPayment = sessions.filter(s => {
    const d = new Date(s.scheduled_at)
    return d >= selMonthStart && d <= selMonthEnd
  })
  const paidSessions = sessionsForPayment.filter(s => s.payment_status === 'paid')
  const unpaidSessions = sessionsForPayment.filter(s => s.payment_status !== 'paid')
  const getSessionPrice = (s: SessionRow) => s.price || sessionTypePrices[s.session_type] || 0
  const totalRevenue = paidSessions.reduce((sum, s) => sum + getSessionPrice(s), 0)
  const pendingRevenue = unpaidSessions.reduce((sum, s) => sum + getSessionPrice(s), 0)

  // ── Outstanding balances by person (aging) ──────────────────────────
  // Unpaid sessions in the selected period that have already happened —
  // scoped to the month/year/custom filter the practitioner picks above.
  // Grouped per person so the list reads "who owes, for how many sessions".
  const nowMs = new Date().getTime()
  const outstandingSessions = unpaidSessions.filter((s) =>
    new Date(s.scheduled_at).getTime() <= nowMs
  )
  type OwedPerson = { memberId: string; name: string; initials: string; amount: number; count: number; lastMs: number }
  const owedByPersonMap = new Map<string, OwedPerson>()
  for (const s of outstandingSessions) {
    const m = members.find((mm) => mm.id === s.member_id)
    const name = m ? `${m.first_name} ${m.last_name}`.trim() : (locale === 'fr' ? 'Inconnu' : locale === 'es' ? 'Desconocido' : 'Unknown')
    const initials = m ? `${(m.first_name || '?')[0] || '?'}${(m.last_name || '')[0] || ''}`.toUpperCase() : '–'
    const ms = new Date(s.scheduled_at).getTime()
    const cur = owedByPersonMap.get(s.member_id) || { memberId: s.member_id, name, initials, amount: 0, count: 0, lastMs: 0 }
    cur.amount += getSessionPrice(s)
    cur.count += 1
    cur.lastMs = Math.max(cur.lastMs, ms)
    owedByPersonMap.set(s.member_id, cur)
  }
  const owedByPerson = Array.from(owedByPersonMap.values()).sort((a, b) => b.amount - a.amount)
  const owedTotal = owedByPerson.reduce((sum, p) => sum + p.amount, 0)
  const billedThisPeriod = totalRevenue + owedTotal
  const collectedPct = billedThisPeriod > 0 ? Math.round((totalRevenue / billedThisPeriod) * 100) : 0

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
    } catch { return `${amount} ${currency}` }
  }

  // ── Journey Velocity ───────────────────────────────────────────────
  const stageOrder = ['discovery', 'planned', 'building', 'in_progress', 'thriving', 'independent', 'achieved']
  const stageLabels: Record<string, Record<string, string>> = {
    discovery: { en: 'Discovery', fr: 'Compréhension', es: 'Descubrimiento' },
    planned: { en: 'Planned', fr: 'Planifié', es: 'Planificado' },
    building: { en: 'Building', fr: 'Ancrage', es: 'Construcción' },
    in_progress: { en: 'In Progress', fr: 'En cours', es: 'En progreso' },
    thriving: { en: 'Thriving', fr: 'Évolution', es: 'Florecimiento' },
    independent: { en: 'Independent', fr: 'Autonomie', es: 'Independiente' },
    achieved: { en: 'Achieved', fr: 'Atteint', es: 'Logrado' },
  }
  const lang = locale === 'fr' ? 'fr' : locale === 'es' ? 'es' : 'en'

  // Avg time per stage: for milestones that have moved past a given stage
  const stageAvgDays: { stage: string; label: string; avgDays: number }[] = []
  for (const stage of ['discovery', 'thriving', 'building']) {
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

  // ── Practice Reflection (narrative) ───────────────────────────────
  interface Reflection {
    type: 'celebration' | 'observation' | 'nudge'
    icon: typeof Heart
    text: string
  }

  const reflections: Reflection[] = []

  // Celebration: people supported
  if (completedInMonth > 0) {
    const uniqueMembers = [...new Set(sessionsInMonthArr
      .filter(s => s.status === 'completed')
      .map(s => members.find(m => m.id === s.member_id)?.first_name)
      .filter(Boolean)
    )]
    reflections.push({
      type: 'celebration',
      icon: Heart,
      text: locale === 'fr'
        ? `Vous avez accompagné ${uniqueMembers.length} personne${uniqueMembers.length > 1 ? 's' : ''} ${viewMode === 'year' ? 'cette année' : viewMode === 'custom' ? 'sur cette période' : 'ce mois'} à travers ${completedInMonth} séance${completedInMonth > 1 ? 's' : ''}.`
        : locale === 'es'
          ? `Acompañaste a ${uniqueMembers.length} persona${uniqueMembers.length > 1 ? 's' : ''} este mes a través de ${completedInMonth} sesión${completedInMonth > 1 ? 'es' : ''}.`
          : `You supported ${uniqueMembers.length} ${uniqueMembers.length === 1 ? 'person' : 'people'} ${viewMode === 'year' ? 'this year' : viewMode === 'custom' ? 'in this period' : 'this month'} through ${completedInMonth} ${completedInMonth === 1 ? 'session' : 'sessions'}.`,
    })
  }

  // Celebration: journey progress
  const recentlyAdvanced = milestones.filter(m => {
    const updated = new Date(m.updated_at)
    return updated >= selMonthStart && updated <= selMonthEnd &&
      ['thriving', 'independent', 'achieved'].includes(m.status)
  })
  if (recentlyAdvanced.length > 0) {
    const advancedNames = [...new Set(recentlyAdvanced.map(m => {
      const member = members.find(mem => mem.id === m.member_id)
      return member?.first_name
    }).filter(Boolean))]
    reflections.push({
      type: 'celebration',
      icon: Sparkles,
      text: locale === 'fr'
        ? `${advancedNames.slice(0, 2).join(' et ')}${advancedNames.length > 2 ? ` et ${advancedNames.length - 2} autre(s)` : ''} ${advancedNames.length === 1 ? 'a progressé' : 'ont progressé'} dans leur parcours.`
        : locale === 'es'
          ? `${advancedNames.slice(0, 2).join(' y ')}${advancedNames.length > 2 ? ` y ${advancedNames.length - 2} más` : ''} avanzaron en su recorrido.`
          : `${advancedNames.slice(0, 2).join(' and ')}${advancedNames.length > 2 ? ` and ${advancedNames.length - 2} more` : ''} moved forward in their journey.`,
    })
  }

  // Gentle nudge: members who haven't connected
  if (staleClients.length > 0) {
    const nudgeNames = staleClients.slice(0, 2).map(m => m.first_name)
    reflections.push({
      type: 'nudge',
      icon: MessageCircle,
      text: locale === 'fr'
        ? `${nudgeNames.join(' et ')}${staleClients.length > 2 ? ` et ${staleClients.length - 2} autre(s)` : ''} n'ont pas donné de nouvelles récemment — un petit message pourrait leur faire du bien.`
        : locale === 'es'
          ? `${nudgeNames.join(' y ')}${staleClients.length > 2 ? ` y ${staleClients.length - 2} más` : ''} no se han conectado recientemente — podrían apreciar saber de ti.`
          : `${nudgeNames.join(' and ')}${staleClients.length > 2 ? ` and ${staleClients.length - 2} more` : ''} haven't connected in a while — when you're ready, they might appreciate hearing from you.`,
    })
  }

  // Keep max 3 reflections, prioritize celebrations first
  const sortedReflections = reflections
    .sort((a, b) => {
      const order = { celebration: 0, observation: 1, nudge: 2 }
      return order[a.type] - order[b.type]
    })
    .slice(0, 3)

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
  // engagementScores is sorted ascending; rank DESCENDING for the orbit so the
  // most-engaged patients are actually shown near the centre (the old
  // slice(0,20) on the ascending list rendered the 20 LEAST engaged and hid the
  // engaged ones under "+N more"). Cap bounds crowding for large practices.
  const ORBIT_CAP = 30
  const orbitMembers = [...engagementScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, ORBIT_CAP)
    .map((e, i) => {
    const distance = 15 + ((100 - e.score) / 100) * 115
    const angle = (137.508 * i * Math.PI) / 180
    const offsetX = Math.cos(angle) * distance
    const offsetY = Math.sin(angle) * distance
    // Use computed tier (which honours Pulse override) for color, score for distance
    const color = e.tier === 'ontrack' ? 'emerald' : e.tier === 'watch' ? 'amber' : 'orange'
    const level = e.tier
    return { ...e, distance, angle, offsetX, offsetY, color, level, index: i }
  })
  const orbitOverflow = Math.max(0, engagementScores.length - orbitMembers.length)

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
    { key: 'discovery', label: locale === 'fr' ? 'Compréhension' : locale === 'es' ? 'Descubrimiento' : 'Discovery', color: 'bg-blue-400', dotColor: 'bg-blue-400', statuses: ['discovery', 'planned'] },
    { key: 'thriving', label: locale === 'fr' ? 'Évolution' : locale === 'es' ? 'Florecimiento' : 'Thriving', color: 'bg-emerald-400', dotColor: 'bg-emerald-400', statuses: ['thriving'] },
    { key: 'building', label: locale === 'fr' ? 'Ancrage' : locale === 'es' ? 'Construcción' : 'Building', color: 'bg-amber-400', dotColor: 'bg-amber-400', statuses: ['building', 'in_progress'] },
    { key: 'independent', label: locale === 'fr' ? 'Autonomie' : locale === 'es' ? 'Independiente' : 'Independent', color: 'bg-violet-400', dotColor: 'bg-violet-400', statuses: ['independent', 'achieved'] },
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
        <main className="flex-1 ml-14">
          <AppHeader
            user={userProfile}
            leftContent={
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Activity className="w-4 h-4" />
                <span>{locale === 'fr' ? 'Signaux' : locale === 'es' ? 'Señales' : 'Signals'}</span>
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

      <main className="flex-1 ml-14">
        <AppHeader
          user={userProfile}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Activity className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Signaux' : locale === 'es' ? 'Señales' : 'Signals'}</span>
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
                  ? 'Voici ce qui se passe dans votre pratique.'
                  : locale === 'es'
                    ? 'Esto es lo que está pasando en tu práctica.'
                    : "Here's what's happening in your practice."}
              </p>
            </div>

          </motion.div>

          {/* ─── Signals hero — pinned ask bar + tabbed views (blue) ────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="mb-6"
          >
            <div className="rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100/70 p-6 shadow-sm">
              {/* Ask bar — stays put, opens Bloom */}
              <button
                onClick={() => openBloom()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 hover:bg-white border border-white text-left transition-colors shadow-sm mb-6"
              >
                <Search className="w-[18px] h-[18px] text-blue-400 shrink-0" />
                <span className="text-[15px] text-gray-500">
                  {tt('Ask Bloom about your practice…', 'Demandez à Bloom à propos de votre pratique…', 'Pregunta a Bloom sobre tu práctica…')}
                </span>
                <Sparkles className="w-4 h-4 text-blue-400 ml-auto shrink-0" />
              </button>

              {/* Swappable middle — only this changes when you switch tabs */}
              <div className="min-h-[200px]">
                {/* Bold answer headline — like a chat reply */}
                <div className="flex items-start gap-2.5 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-500 mt-1 shrink-0" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
                    {signalsTab === 'overview' && tt("Here's what's happening in your practice.", 'Voici ce qui se passe dans votre pratique.', 'Esto es lo que pasa en tu práctica.')}
                    {signalsTab === 'sessions' && (
                      <>{tt('Your sessions over time.', 'Vos séances dans le temps.', 'Tus sesiones en el tiempo.')} <span className="text-blue-500/80 font-normal">{tt(`${sessionsInMonth} this month.`, `${sessionsInMonth} ce mois-ci.`, `${sessionsInMonth} este mes.`)}</span></>
                    )}
                    {signalsTab === 'engagement' && tt('How engaged your caseload is right now.', "L'engagement de votre file active en ce moment.", 'El compromiso de tus pacientes ahora.')}
                    {signalsTab === 'progress' && (
                      <>{tt('Progress across your milestones.', 'Progression sur vos objectifs.', 'Progreso en tus objetivos.')} <span className="text-blue-500/80 font-normal">{totalMilestones}</span></>
                    )}
                    {signalsTab === 'attention' && (staleClients.length > 0
                      ? tt(`${staleClients.length} ${staleClients.length === 1 ? 'person has' : 'people have'} gone quiet.`, `${staleClients.length} personne${staleClients.length === 1 ? '' : 's'} sans nouvelles.`, `${staleClients.length} persona${staleClients.length === 1 ? '' : 's'} sin noticias.`)
                      : tt('Everyone has been in touch recently.', 'Tout le monde a donné des nouvelles récemment.', 'Todos han estado en contacto recientemente.'))}
                  </h3>
                </div>

                {signalsTab === 'overview' && (
                  <div className="space-y-2.5 pl-[30px]">
                    {sortedReflections.length > 0 ? sortedReflections.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.type === 'celebration' ? 'bg-emerald-100' : r.type === 'nudge' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                          <r.icon className={`w-3 h-3 ${r.type === 'celebration' ? 'text-emerald-600' : r.type === 'nudge' ? 'text-amber-600' : 'text-blue-600'}`} />
                        </div>
                        <p className="text-[15px] text-gray-700 leading-relaxed">{r.text}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-400">{tt('Nothing to report yet.', 'Rien à signaler pour le moment.', 'Nada que reportar aún.')}</p>
                    )}
                  </div>
                )}

                {signalsTab === 'sessions' && (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
                        <defs>
                          <linearGradient id="signalsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                        <Tooltip content={<ChartTooltip locale={locale} />} cursor={false} />
                        <Area type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2.5} fill="url(#signalsAreaGrad)" dot={false} activeDot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {signalsTab === 'engagement' && (() => {
                  const onTrack = engagementScores.filter((e) => e.tier === 'ontrack').length
                  const watch = engagementScores.filter((e) => e.tier === 'watch').length
                  const checkin = engagementScores.filter((e) => e.tier === 'checkin').length
                  return (
                    <div className="grid grid-cols-3 gap-3 pl-[30px]">
                      <div className="rounded-2xl bg-white/70 border border-emerald-100 px-4 py-3.5">
                        <p className="text-3xl font-bold text-emerald-600">{onTrack}</p>
                        <p className="text-xs text-gray-500 mt-1">{tt('On track', 'Sur la bonne voie', 'En camino')}</p>
                      </div>
                      <div className="rounded-2xl bg-white/70 border border-amber-100 px-4 py-3.5">
                        <p className="text-3xl font-bold text-amber-500">{watch}</p>
                        <p className="text-xs text-gray-500 mt-1">{tt('To watch', 'À surveiller', 'A vigilar')}</p>
                      </div>
                      <div className="rounded-2xl bg-white/70 border border-orange-100 px-4 py-3.5">
                        <p className="text-3xl font-bold text-orange-500">{checkin}</p>
                        <p className="text-xs text-gray-500 mt-1">{tt('Needs check-in', 'À recontacter', 'Contactar')}</p>
                      </div>
                    </div>
                  )
                })()}

                {signalsTab === 'progress' && (
                  <div className="pl-[30px]">
                    {totalMilestones > 0 ? (
                      <>
                        <div className="flex h-3.5 rounded-full overflow-hidden mb-4">
                          {journeyLanes.map((lane) => (
                            lane.milestones.length > 0 && (
                              <div key={lane.key} className={`${lane.dotColor} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(lane.milestones.length / totalMilestones) * 100}%` }} />
                            )
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                          {journeyLanes.map((lane) => (
                            <span key={lane.key} className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                              <span className={`w-2 h-2 rounded-full ${lane.dotColor}`} />
                              {lane.label}
                              <span className="text-gray-400">{lane.milestones.length}</span>
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">{tt('No milestones tracked yet.', 'Aucun objectif suivi pour le moment.', 'Sin objetivos seguidos aún.')}</p>
                    )}
                  </div>
                )}

                {signalsTab === 'attention' && staleClients.length > 0 && (
                  <div className="bg-white/70 border border-sky-100 rounded-2xl divide-y divide-gray-50 ml-[30px]">
                    {staleClients.slice(0, 4).map((m) => (
                      <Link key={m.id} href={`/members/${m.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                        <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">{m.first_name} {m.last_name}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{humanTimeAgo(daysAgo(m.last_session_at), locale)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs — swap the middle (the ask bar stays put) */}
              <div className="flex flex-wrap gap-2 mt-5">
                {([
                  ['overview', tt('Overview', 'Aperçu', 'Resumen')],
                  ['sessions', tt('Sessions', 'Séances', 'Sesiones')],
                  ['engagement', tt('Engagement', 'Engagement', 'Compromiso')],
                  ['progress', tt('Progress', 'Parcours', 'Progreso')],
                  ['attention', tt('Needs attention', 'À suivre', 'Atención')],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSignalsTab(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      signalsTab === key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/70 text-blue-700 hover:bg-white border border-blue-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── Practice overview — sticky header + boxed cards ───────── */}
          <div className="sticky top-[48px] z-30 -mx-8 px-8 py-3 mb-4 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200/60 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 shrink-0">
              {tt('Practice overview', "Vue d'ensemble de votre pratique", 'Resumen de tu práctica')}
            </h2>
            {/* Date range picker */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View mode toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowViewPicker(!showViewPicker)}
                  className="text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {viewMode === 'month' ? (locale === 'fr' ? 'Mois' : 'Month')
                    : viewMode === 'year' ? (locale === 'fr' ? 'Année' : 'Year')
                    : (locale === 'fr' ? 'Période' : 'Custom')}
                </button>
                {showViewPicker && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowViewPicker(false)} />
                    <div className="absolute top-full right-0 mt-1 z-40 bg-white rounded-xl border border-gray-200 shadow-xl py-1 w-36">
                      {([
                        { value: 'month' as const, label: locale === 'fr' ? 'Par mois' : 'By month' },
                        { value: 'year' as const, label: locale === 'fr' ? 'Par année' : 'By year' },
                        { value: 'custom' as const, label: locale === 'fr' ? 'Période' : 'Custom range' },
                      ]).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setViewMode(opt.value); setShowViewPicker(false) }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${viewMode === opt.value ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          {viewMode === opt.value && '✓ '}{opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Month/Year navigator */}
              {viewMode !== 'custom' ? (
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-0.5">
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
                    disabled={!canGoNext}
                    className={`p-1.5 rounded-md transition-colors ${
                      !canGoNext
                        ? 'text-gray-200 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                    <select
                      value={customStart ? new Date(customStart).getMonth() : new Date().getMonth()}
                      onChange={(e) => {
                        const m = parseInt(e.target.value)
                        const y = customStart ? new Date(customStart).getFullYear() : new Date().getFullYear()
                        setCustomStart(`${y}-${String(m + 1).padStart(2, '0')}-01`)
                      }}
                      className="text-xs bg-transparent border-0 focus:outline-none text-gray-700 font-medium cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2026, i).toLocaleDateString(localeId(locale), { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={customStart ? new Date(customStart).getFullYear() : new Date().getFullYear()}
                      onChange={(e) => {
                        const y = parseInt(e.target.value)
                        const m = customStart ? new Date(customStart).getMonth() : 0
                        setCustomStart(`${y}-${String(m + 1).padStart(2, '0')}-01`)
                      }}
                      className="text-xs bg-transparent border-0 focus:outline-none text-gray-700 font-medium cursor-pointer"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-gray-400">→</span>
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                    <select
                      value={customEnd ? new Date(customEnd).getMonth() : new Date().getMonth()}
                      onChange={(e) => {
                        const m = parseInt(e.target.value)
                        const y = customEnd ? new Date(customEnd).getFullYear() : new Date().getFullYear()
                        const lastDay = new Date(y, m + 1, 0).getDate()
                        setCustomEnd(`${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
                      }}
                      className="text-xs bg-transparent border-0 focus:outline-none text-gray-700 font-medium cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2026, i).toLocaleDateString(localeId(locale), { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={customEnd ? new Date(customEnd).getFullYear() : new Date().getFullYear()}
                      onChange={(e) => {
                        const y = parseInt(e.target.value)
                        const m = customEnd ? new Date(customEnd).getMonth() : 11
                        const lastDay = new Date(y, m + 1, 0).getDate()
                        setCustomEnd(`${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
                      }}
                      className="text-xs bg-transparent border-0 focus:outline-none text-gray-700 font-medium cursor-pointer"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* ─── My People + My Sessions side-by-side ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            {/* My People — orbit */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 order-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {locale === 'fr' ? 'Mes personnes' : locale === 'es' ? 'Mi gente' : 'My People'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {locale === 'fr' ? 'Plus proche = plus engagé' : locale === 'es' ? 'Más cerca = más comprometido' : 'Closer to you = more engaged'}
                  </p>
                </div>
                <button
                  onClick={() => setShowEngagementDrawer(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title={locale === 'fr' ? 'Paramètres des signaux' : locale === 'es' ? 'Configuración de señales' : 'Signal settings'}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Orbit Map */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  {/* Zone rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[260px] h-[260px] rounded-full border border-dashed border-orange-200/60 absolute" />
                    <div className="w-[180px] h-[180px] rounded-full border border-dashed border-amber-200/60 absolute" />
                    <div className="w-[100px] h-[100px] rounded-full border border-dashed border-emerald-200/60 absolute" />
                  </div>
                  {/* Center "You" dot */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center z-10">
                    <span className="text-[7px] font-bold text-white">
                      {locale === 'fr' ? 'Vous' : locale === 'es' ? 'Tú' : 'You'}
                    </span>
                  </div>
                  {/* Member dots */}
                  {orbitMembers.map((om) => {
                    const bgColor = om.color === 'emerald' ? 'bg-emerald-500' : om.color === 'amber' ? 'bg-amber-400' : 'bg-orange-400'
                    const glowColor = om.color === 'emerald' ? 'rgba(16,185,129,0.3)' : om.color === 'amber' ? 'rgba(245,158,11,0.3)' : 'rgba(251,146,60,0.3)'
                    return (
                        <motion.div
                          key={om.member.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: om.index * 0.04, duration: 0.4 }}
                          whileHover={{ scale: 1.2 }}
                          onHoverStart={() => setHoveredMember(om.member.id)}
                          onHoverEnd={() => setHoveredMember(null)}
                          onClick={() => setQuickViewMemberId(om.member.id)}
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
                                ? (locale === 'fr' ? 'En bonne voie' : locale === 'es' ? 'Va bien' : 'Doing well')
                                : om.score >= 40
                                  ? (locale === 'fr' ? 'À noter' : locale === 'es' ? 'Para notar' : 'Worth noticing')
                                  : (locale === 'fr' ? 'À reconnecter' : locale === 'es' ? 'Para reconectar' : 'Could use a check-in')
                              const levelColor = om.score >= 70 ? 'bg-emerald-400' : om.score >= 40 ? 'bg-amber-400' : 'bg-orange-400'
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
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />{locale === 'fr' ? 'En bonne voie' : locale === 'es' ? 'Va bien' : 'Doing well'}</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-400" />{locale === 'fr' ? 'À noter' : locale === 'es' ? 'Para notar' : 'Worth noticing'}</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-orange-400" />{locale === 'fr' ? 'À reconnecter' : locale === 'es' ? 'Para reconectar' : 'Could use a check-in'}</span>
                </div>
              </div>
            </div>

            {/* My Sessions — trend chart (respects month / year / custom) */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col order-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {locale === 'fr' ? 'Mes séances' : locale === 'es' ? 'Mis sesiones' : 'My Sessions'}
                </h3>
                <span className="text-xs font-semibold text-blue-600">{sessionsInMonth}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {viewMode === 'year'
                  ? tt('Completed per month this year', 'Complétées par mois cette année', 'Completadas por mes este año')
                  : viewMode === 'custom'
                    ? tt('Completed across this period', 'Complétées sur la période', 'Completadas en el periodo')
                    : tt('Completed per month', 'Complétées par mois', 'Completadas por mes')}
                {' · '}
                <span className="text-blue-500/80">{tt(`${completedInMonth} done`, `${completedInMonth} faites`, `${completedInMonth} hechas`)}</span>
              </p>
              <div className="flex-1 min-h-[200px]">
                {chartData.some((d) => d.sessions > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
                      <defs>
                        <linearGradient id="mySessionsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} interval={0} />
                      <Tooltip content={<ChartTooltip locale={locale} />} cursor={false} />
                      <Area type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={2.5} fill="url(#mySessionsGrad)" dot={false} activeDot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-gray-300">
                      {tt('No sessions in this period', 'Aucune séance sur la période', 'Sin sesiones en el periodo')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Money zone (snap target + dynamic spacer keep it pinned) ─ */}
          <div ref={moneyZoneRef} className="mt-10 snap-start">
          {/* ─── Section break so Payments reads as its own zone ───────── */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{tt('Money', 'Finances', 'Finanzas')}</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* ─── Payments ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-gray-100 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-base font-semibold text-gray-900">{tt('Payments', 'Paiements', 'Pagos')}</span>
              </div>
              {viewMode === 'month' && (
                <span className="text-xs text-gray-400 capitalize">{formatMonthLabel(selectedMonth)}</span>
              )}
            </div>

            {/* This month's money: what came in vs what's still owed (they add up) */}
            <div className="flex items-end gap-10">
              <div>
                <p className="text-xs text-gray-500 mb-1">{tt('Collected', 'Encaissé', 'Cobrado')}</p>
                <p className="text-3xl font-bold text-emerald-600 leading-none">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1.5">{tt(`${paidSessions.length} ${paidSessions.length === 1 ? 'session' : 'sessions'} paid`, `${paidSessions.length} séance${paidSessions.length > 1 ? 's' : ''} payée${paidSessions.length > 1 ? 's' : ''}`, `${paidSessions.length} sesión${paidSessions.length > 1 ? 'es' : ''} pagada${paidSessions.length > 1 ? 's' : ''}`)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{tt('Still owed', 'Encore dû', 'Aún se debe')}</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">{formatCurrency(owedTotal)}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {owedByPerson.length === 0
                    ? tt('all paid up', 'tout est réglé', 'todo saldado')
                    : tt(`${owedByPerson.length} ${owedByPerson.length === 1 ? 'person' : 'people'}`, `${owedByPerson.length} personne${owedByPerson.length > 1 ? 's' : ''}`, `${owedByPerson.length} persona${owedByPerson.length > 1 ? 's' : ''}`)}
                </p>
              </div>
            </div>

            {/* Collected-vs-billed bar — makes the two numbers reconcile at a glance */}
            {billedThisPeriod > 0 && (
              <div className="mt-5">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${collectedPct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {tt(
                    `${collectedPct}% of ${formatCurrency(billedThisPeriod)} billed this month is in`,
                    `${collectedPct}% des ${formatCurrency(billedThisPeriod)} facturés ce mois sont encaissés`,
                    `${collectedPct}% de ${formatCurrency(billedThisPeriod)} facturado este mes está cobrado`,
                  )}
                </p>
              </div>
            )}

            {/* Who hasn't paid this month — sorted by amount owed */}
            {owedByPerson.length > 0 && (
              <div className="border-t border-gray-100 mt-6 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{tt('Awaiting payment', 'En attente de paiement', 'A la espera de pago')}</p>
                <div className="divide-y divide-gray-50">
                  {owedByPerson.map((p) => {
                    const expandable = p.count > 1
                    const expanded = expandedOwedMember === p.memberId
                    const memberSessions = expanded
                      ? outstandingSessions
                          .filter((s) => s.member_id === p.memberId)
                          .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
                      : []
                    return (
                      <div key={p.memberId}>
                        <button
                          type="button"
                          onClick={() => expandable && setExpandedOwedMember(expanded ? null : p.memberId)}
                          className={`w-full flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg text-left transition-colors ${expandable ? 'hover:bg-gray-50/70 cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">{p.initials}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">
                              {p.count === 1
                                ? new Date(p.lastMs).toLocaleDateString(localeId(locale), { month: 'short', day: 'numeric' })
                                : tt(`${p.count} sessions`, `${p.count} séances`, `${p.count} sesiones`)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap text-right min-w-[60px]">{formatCurrency(p.amount)}</span>
                          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${expandable ? 'text-gray-300' : 'text-transparent'} ${expanded ? 'rotate-90' : ''}`} />
                        </button>
                        {expanded && (
                          <div className="pl-11 pr-7 pb-2.5 space-y-1.5">
                            {memberSessions.map((s, i) => (
                              <div key={s.id || i} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  {new Date(s.scheduled_at).toLocaleDateString(localeId(locale), { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-gray-600 font-medium text-right min-w-[60px]">{formatCurrency(getSessionPrice(s))}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
          </div>

          {/* Dynamic spacer — keeps a short Money zone pinned to the top */}
          <div aria-hidden style={{ height: moneySpacer }} />
        </div>
      </main>

      {/* Patient quick-view drawer (orbit click) */}
      {data && (() => {
        const m = quickViewMemberId ? members.find(mm => mm.id === quickViewMemberId) : null
        const entry = quickViewMemberId ? engagementScores.find(e => e.member.id === quickViewMemberId) : null
        const completedResources = quickViewMemberId
          ? (data.resourceResponsesByMember[quickViewMemberId] || []).filter(r => r.status === 'submitted' || r.status === 'reviewed').length
          : 0
        return (
          <PatientQuickViewDrawer
            isOpen={!!quickViewMemberId && !!m}
            onClose={() => setQuickViewMemberId(null)}
            locale={locale as 'en' | 'fr' | 'es'}
            data={m && entry ? {
              member: { id: m.id, first_name: m.first_name, last_name: m.last_name, date_of_birth: (m as MemberRow).date_of_birth },
              tier: entry.tier,
              sessions: sessions.filter(s => s.member_id === m.id).map(s => ({ id: s.id, status: s.status, scheduled_at: s.scheduled_at })),
              notesWithTag: data.notesByMember[m.id] || [],
              pulse: data.pulseByMember[m.id] || null,
              totalAssignedResources: data.assignedResourcesByMember[m.id] || 0,
              completedResources,
            } : null}
            onOpenPulseModal={(memberId) => {
              setQuickViewMemberId(null)
              setPulseModalMemberId(memberId)
            }}
          />
        )
      })()}

      {/* Bloom Pulse modal — opened from the quick-view */}
      {pulseModalMemberId && (() => {
        const m = members.find(mm => mm.id === pulseModalMemberId)
        if (!m) return null
        return (
          <MemberSummaryModal
            isOpen={!!pulseModalMemberId}
            onClose={() => setPulseModalMemberId(null)}
            memberId={pulseModalMemberId}
            memberName={`${m.first_name} ${m.last_name}`.trim()}
          />
        )
      })()}

      {/* Engagement settings drawer */}
      <EngagementSettingsDrawer
        isOpen={showEngagementDrawer}
        onClose={() => setShowEngagementDrawer(false)}
        settings={engagementSettings}
        locale={locale as 'en' | 'fr' | 'es'}
        onSave={async (next) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not signed in')
          const { error } = await supabase
            .from('users')
            .update({ engagement_settings: next })
            .eq('id', user.id)
          if (error) throw error
          setEngagementSettings(next)
        }}
      />

      {/* Bloom overlay */}
      <BloomInlineChat
        isOpen={bloomOpen}
        onClose={() => { setBloomOpen(false); setBloomPrompt(undefined) }}
        initialMessage={bloomPrompt}
        suggestions={[
          ...(staleClients.length > 0 ? [
            locale === 'fr' ? 'Des idées pour recontacter mes membres ?' : locale === 'es' ? 'Ideas para reconectar?' : 'Tips for reconnecting with my members?'
          ] : []),
          ...(stuckMilestones.length > 0 ? [
            locale === 'fr' ? 'Des objectifs n\'avancent pas, que faire ?' : locale === 'es' ? 'Objetivos estancados, qué hago?' : 'Some goals aren\'t moving — what should I try?'
          ] : []),
          locale === 'fr' ? 'Quelles tendances vois-tu ?' : locale === 'es' ? 'Qué patrones ves?' : 'What patterns do you notice?',
          locale === 'fr' ? 'Comment améliorer ma pratique ?' : locale === 'es' ? 'Cómo mejorar mi práctica?' : 'How can I improve my practice?',
        ].slice(0, 4)}
      />
    </div>
  )
}
