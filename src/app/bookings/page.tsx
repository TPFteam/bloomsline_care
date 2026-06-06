'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  CalendarCheck,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  Plus,
  Trash2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  RefreshCw,
  Video,
  Building2,
  SlidersHorizontal,
  Code2,
  MoreHorizontal,
  PenLine,
  ArrowUpRight,
  CheckCircle,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { TutorialVideo } from '@/components/ui/tutorial-video'
import { Button } from '@/components/ui/button'
import { PaymentBadge } from '@/components/ui/payment-badge'
import { TimeSelect } from '@/components/ui/time-select'
import { SeriesDetailDrawer } from '@/components/SeriesDetailDrawer'
import { SessionDotLegend, StatusDot, type StatusKey } from '@/components/SessionDotLegend'
import { SessionFilters, inDateRange, type DateRangePreset } from '@/components/SessionFilters'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { emitBookingsChanged, useBookingsChanged } from '@/lib/bookings-events'
import { format, parseISO, isToday, isTomorrow, isPast, startOfWeek } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { WeekCalendarView } from '@/components/bookings/WeekCalendarView'
import { EmbedSnippetCard } from '@/components/bookings/EmbedSnippetCard'
import { UnclaimedGoogleEventsCard } from '@/components/bookings/UnclaimedGoogleEventsCard'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'
import { MiniMonthCalendar } from '@/components/bookings/MiniMonthCalendar'
import { useFloatingNotes } from '@/lib/floating-notes/context'
import { FIXED_NOTE_TYPES, DEFAULT_NOTE_TYPES } from '@/types/member'
import {
  getCalendarConnection,
  disconnectCalendar,
  getAvailabilitySchedules,
  bulkUpdateAvailability,
  getBookingSettings,
  saveBookingSettings,
} from '@/lib/services/calendar'
import type { CalendarConnection, BookingSettings, DayOfWeek, SessionType } from '@/types/calendar'
import type { User as UserType } from '@/types/user'

interface Booking {
  id: string
  practitioner_id: string
  member_id: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  session_type: string
  start_time: string
  end_time: string
  timezone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  payment_status: 'paid' | 'unpaid'
  notes: string | null
  practitioner_notes: string | null
  google_event_id: string | null
  meet_link: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  session_format: string | null
  created_at: string
  // Recurring-series columns (added by migration 20260508_recurring_sessions_phase0).
  // Null for one-off bookings.
  series_id?: string | null
  series_parent_id?: string | null
  series_position?: number | null
  series_total?: number | null
  recurrence_rule?: string | null
  updated_at?: string | null
}

type MainTab = 'appointments' | 'settings'
type AppointmentFilter = 'upcoming' | 'past' | 'all'

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-amber-100/80',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'from-amber-400 to-amber-600',
    cardBg: 'from-amber-50/50 to-white',
  },
  confirmed: {
    bg: 'bg-emerald-100/80',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'from-emerald-400 to-emerald-600',
    cardBg: 'from-emerald-50/30 to-white',
  },
  cancelled: {
    bg: 'bg-red-100/80',
    text: 'text-red-700',
    border: 'border-red-200',
    iconBg: 'from-red-400 to-red-600',
    cardBg: 'from-red-50/30 to-white',
  },
  completed: {
    bg: 'bg-blue-100/80',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'from-blue-400 to-blue-600',
    cardBg: 'from-blue-50/30 to-white',
  },
  no_show: {
    bg: 'bg-gray-100/80',
    text: 'text-gray-600',
    border: 'border-gray-200',
    iconBg: 'from-gray-400 to-gray-600',
    cardBg: 'from-gray-50/30 to-white',
  },
}

const STATUS_LABELS: Record<string, { en: string; fr: string }> = {
  pending: { en: 'Pending Approval', fr: 'En attente' },
  confirmed: { en: 'Confirmed', fr: 'Confirmé' },
  cancelled: { en: 'Cancelled', fr: 'Annulé' },
  completed: { en: 'Completed', fr: 'Terminé' },
  no_show: { en: 'No Show', fr: 'Absent' },
}

// ── Booking row menu ────────────────────────────────────────────────
// Compact 3-dot dropdown that hosts the row's secondary actions
// (reschedule, cancel, delete, etc). Keeps the booking row visually
// uncluttered while preserving access to every existing action.
interface RowMenuItem {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  // Visual tone — keeps Show/No-show/Delete distinguishable instead of
  // all looking like the same destructive action. Mirrors SessionsTab.
  tone?: 'default' | 'success' | 'warning' | 'danger'
  danger?: boolean // legacy alias for tone:'danger'
}
function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])
  if (items.length === 0) return null
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[180px] py-1">
          {items.map((item, i) => {
            const Icon = item.icon
            const tone = item.tone || (item.danger ? 'danger' : 'default')
            const toneClass =
              tone === 'danger' ? 'text-red-600 hover:bg-red-50'
              : tone === 'success' ? 'text-emerald-700 hover:bg-emerald-50'
              : tone === 'warning' ? 'text-amber-700 hover:bg-amber-50'
              : 'text-gray-700 hover:bg-gray-50'
            return (
              <button
                key={i}
                type="button"
                onClick={() => { item.onClick(); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${toneClass}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS: Record<DayOfWeek, { en: string; fr: string }> = {
  monday: { en: 'Monday', fr: 'Lundi' },
  tuesday: { en: 'Tuesday', fr: 'Mardi' },
  wednesday: { en: 'Wednesday', fr: 'Mercredi' },
  thursday: { en: 'Thursday', fr: 'Jeudi' },
  friday: { en: 'Friday', fr: 'Vendredi' },
  saturday: { en: 'Saturday', fr: 'Samedi' },
  sunday: { en: 'Sunday', fr: 'Dimanche' },
}

const DEFAULT_SESSION_TYPES: SessionType[] = [
  { id: 'initial', name: 'Initial Consultation', name_fr: 'Consultation initiale', duration: 60, price: null, is_default: true },
  { id: 'follow_up', name: 'Follow-up Session', name_fr: 'Séance de suivi', duration: 50, price: null, is_default: true },
  { id: 'check_in', name: 'Check-in', name_fr: 'Point de situation', duration: 30, price: null },
]

interface AvailabilitySlot {
  day: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
  sessionFormat: 'in_person' | 'video' | 'both'
}

export default function BookingsPage() {
  const { locale } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Main tab state — read from URL query param (e.g. ?tab=settings after calendar OAuth callback)
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const tab = searchParams.get('tab')
    return tab === 'settings' ? 'settings' : 'appointments'
  })

  // React to URL changes (e.g. clicking a booking notification while already on /bookings)
  useEffect(() => {
    const highlight = searchParams.get('highlight')
    if (highlight) {
      setMainTab('appointments')
      setBookingView('list')
      setAppointmentFilter('upcoming')
      setHighlightId(highlight)
    }
  }, [searchParams])

  // Appointments state
  const [bookings, setBookings] = useState<Booking[]>([])

  // Highlight a specific booking (from notification deep link). Uses
  // a rounded teal halo with a soft outer glow rather than the older
  // square ring — feels like a gentle "look here" rather than a hard
  // selection box.
  const [highlightId, setHighlightId] = useState<string | null>(searchParams.get('highlight'))
  useEffect(() => {
    if (highlightId && bookings.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`booking-${highlightId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('booking-highlight-glow')
          setTimeout(() => {
            el.classList.remove('booking-highlight-glow')
            setHighlightId(null)
          }, 3000)
        }
      }, 500)
    }
  }, [highlightId, bookings])
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('upcoming')
  const [bookingView, setBookingView] = useState<'list' | 'calendar'>('calendar')
  // The week shown in the calendar — controlled here so the left-rail
  // mini-calendar and the grid's own nav stay in sync.
  const [calWeekStart, setCalWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [processingId, setProcessingId] = useState<string | null>(null)
  // Recurring-series drawer — opened from the "View all sessions" button
  // on any series-anchor row. Mirrors the SessionsTab behaviour.
  const [viewingSeriesId, setViewingSeriesId] = useState<string | null>(null)
  // ── Filter state (date / status / type / payment) ────────────────
  const [dateRange, setDateRange] = useState<DateRangePreset>('all')
  const [customFrom, setCustomFrom] = useState<string | null>(null)
  const [customTo, setCustomTo] = useState<string | null>(null)
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [paymentFilters, setPaymentFilters] = useState<Set<string>>(new Set())
  const [memberFilters, setMemberFilters] = useState<Set<string>>(new Set())
  // Tracks which bookings (keyed by `${member_id}::${minute}`) have a
  // saved session_summary progress note. Drives the "Take notes" vs
  // "View notes" label on History rows.
  const [bookingsWithNotes, setBookingsWithNotes] = useState<Set<string>>(new Set())
  const resetFilters = () => {
    setDateRange('all')
    setCustomFrom(null)
    setCustomTo(null)
    setStatusFilters(new Set())
    setTypeFilters(new Set())
    setPaymentFilters(new Set())
    setMemberFilters(new Set())
  }
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [showSettingsSavedModal, setShowSettingsSavedModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'availability' | 'sessions' | 'preferences' | 'embed'>('availability')

  // User state
  const [user, setUser] = useState<UserType | null>(null)

  // Current member names (id → "First Last"). Used so booking rows
  // display the latest name when a patient has been renamed since the
  // booking was created. Falls back to booking.client_name (snapshot).
  const [memberNames, setMemberNames] = useState<Map<string, string>>(new Map())

  // Floating session-note panel (Take notes for this session)
  const { openFloat } = useFloatingNotes()

  // Click → resolve the session row for this booking (member_id +
  // scheduled_at match), then open the global floating note panel in
  // session mode. Falls back to quick-note mode if no session row exists
  // (shouldn't happen for in-app bookings but covers external claims).
  const handleTakeNotes = async (booking: {
    id: string;
    member_id: string | null;
    client_name: string | null;
    start_time: string;
    end_time: string;
    session_type: string;
    session_format?: string | null;
  }) => {
    if (!booking.member_id) {
      toast.error(locale === 'fr' ? 'Aucun patient lié à cette séance' : 'No patient linked to this session')
      return
    }
    const sb = createClient()
    const { data: { user: u } } = await sb.auth.getUser()
    if (!u) return

    // Fetch in parallel: matching session row, the practitioner's custom
    // note types (for the tag chips inside the editor), and the patient's
    // milestones (for the goal-tagging affordance). Each is best-effort —
    // missing data degrades gracefully to fewer editor affordances.
    const [sessionRowRes, customTypesRes, milestonesRes] = await Promise.all([
      sb.from('sessions')
        .select('id')
        .eq('practitioner_id', u.id)
        .eq('member_id', booking.member_id)
        .eq('scheduled_at', booking.start_time)
        .maybeSingle(),
      sb.from('custom_note_types')
        .select('type_name')
        .eq('practitioner_id', u.id)
        .order('created_at'),
      sb.from('milestones')
        .select('id, title, status')
        .eq('member_id', booking.member_id)
        .order('created_at'),
    ])
    let sessionRow: { id: string } | null = sessionRowRes.data as { id: string } | null
    // Safety net for legacy bookings that pre-date the
    // 20260514 bookings → sessions sync trigger, or where the trigger
    // didn't fire for whatever reason: if no session exists yet,
    // create one with the minimum required fields (defaults fill in
    // session_type / session_format / duration). Without this the
    // floating editor would save the note as note_type='general' with
    // no session_id and the bookingsWithNotes lookup would never
    // find it → the popover keeps saying "Take notes" forever.
    if (!sessionRow?.id) {
      const { data: created, error: createErr } = await sb
        .from('sessions')
        .insert({
          practitioner_id: u.id,
          member_id: booking.member_id,
          scheduled_at: booking.start_time,
        })
        .select('id')
        .single()
      if (!createErr && created?.id) sessionRow = { id: created.id }
    }
    const allTypeRows = (customTypesRes.data || []).map(r => r.type_name as string)
    const hiddenSet = new Set(
      allTypeRows.filter(n => n.startsWith('_hidden:')).map(n => n.replace('_hidden:', ''))
    )
    const customTypes = allTypeRows.filter(name => !name.startsWith('_hidden:'))
    const milestones = (milestonesRes.data || []) as Array<{ id: string; title: string; status: string }>

    // Build the note-type list the editor expects (defaults + custom).
    // Soft-deleted defaults (rows like `_hidden:<name>` in custom_note_types)
    // are stripped so the editor matches what the practitioner left visible.
    const noteTypeMap = new Map<string, { type: string; label: string }>()
    for (const t of FIXED_NOTE_TYPES) {
      noteTypeMap.set(t, { type: t, label: t.replace(/_/g, ' ') })
    }
    for (const t of DEFAULT_NOTE_TYPES) {
      if (!hiddenSet.has(t) && !noteTypeMap.has(t)) {
        noteTypeMap.set(t, { type: t, label: t.replace(/_/g, ' ') })
      }
    }
    for (const t of customTypes) {
      if (!noteTypeMap.has(t)) noteTypeMap.set(t, { type: t, label: t.replace(/_/g, ' ') })
    }
    const editorNoteTypes = Array.from(noteTypeMap.values())

    const { data: existingNote } = sessionRow?.id
      ? await sb
          .from('progress_notes')
          .select('id, content')
          .eq('session_id', sessionRow.id)
          .eq('note_type', 'session_summary')
          .maybeSingle()
      : { data: null }
    const durationMinutes = Math.max(0, Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000))
    openFloat({
      mode: 'session',
      content: existingNote?.content || '',
      memberId: booking.member_id,
      // Prefer the live member name so the floating panel title shows
      // the current name, not a stale denormalised snapshot.
      memberName: memberNames.get(booking.member_id) || booking.client_name || '',
      noteType: 'session_summary',
      sessionId: sessionRow?.id,
      existingNoteId: existingNote?.id || undefined,
      milestones,
      editorNoteTypes,
      sessionContext: {
        title: getSessionTypeName(booking.session_type),
        startTimeIso: booking.start_time,
        durationMinutes,
        format: booking.session_format || null,
      },
    })
  }

  // Settings state
  const [userId, setUserId] = useState<string | null>(null)
  const [practitionerSlug, setPractitionerSlug] = useState<string | null>(null)
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnection | null>(null)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [linkCopied, setLinkCopied] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Google Calendar mismatch detection
  const [calendarMismatches, setCalendarMismatches] = useState<Array<{
    bookingId: string; clientName: string; sessionType: string; startTime: string; endTime: string
  }>>([])
  const [mismatchProcessing, setMismatchProcessing] = useState<string | null>(null)

  // Check for Google Calendar mismatches on page load
  useEffect(() => {
    fetch('/api/calendar/check-mismatches')
      .then(r => r.json())
      .then(data => { if (data.mismatches?.length > 0) setCalendarMismatches(data.mismatches) })
      .catch(() => {})
  }, [])

  // Show toast for calendar OAuth callback results
  useEffect(() => {
    if (searchParams.get('calendar_connected') === 'true') {
      toast.success(locale === 'fr' ? 'Google Agenda connecté avec succès' : 'Google Calendar connected successfully')
    }
    const calError = searchParams.get('calendar_error')
    if (calError) {
      toast.error(locale === 'fr' ? `Connexion échouée : ${calError}` : `Calendar connection failed: ${calError}`)
    }
  }, [searchParams])

  // Load all data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      setUserId(authUser.id)

      // Load user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userProfile) {
        setUser(userProfile)
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          user_type: authUser.user_metadata?.user_type || 'mentor',
          preferred_language: 'en',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        })
      }

      // Load practitioner profile to get slug
      const { data: profile } = await supabase
        .from('practitioner_profiles')
        .select('slug')
        .eq('user_id', authUser.id)
        .single()

      if (profile?.slug) {
        setPractitionerSlug(profile.slug)
      }

      // Load booking settings to get session types
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', authUser.id)
        .single()

      if (settings?.session_types) {
        setSessionTypes(settings.session_types as SessionType[])
      }

      // Load bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', authUser.id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Failed to load bookings:', error)
      } else {
        setBookings(bookingsData || [])
      }

      // Load current member names so booking rows display the latest
      // name even after the patient was renamed. bookings.client_name is
      // a denormalised snapshot from the moment of booking.
      const { data: memberRows } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('practitioner_id', authUser.id)
      if (memberRows) {
        const map = new Map<string, string>()
        for (const m of memberRows) {
          const name = `${m.first_name || ''} ${m.last_name || ''}`.trim()
          if (name) map.set(m.id, name)
        }
        setMemberNames(map)
      }

      setIsLoading(false)

      // Load settings data
      const connection = await getCalendarConnection()
      setCalendarConnection(connection)

      const schedules = await getAvailabilitySchedules(authUser.id)
      if (schedules.length > 0) {
        setAvailabilitySlots(
          schedules.map((s: any) => ({
            day: s.day_of_week,
            startTime: s.start_time.slice(0, 5),
            endTime: s.end_time.slice(0, 5),
            isActive: s.is_active,
            sessionFormat: s.session_format || 'both',
          }))
        )
        setTimezone(schedules[0].timezone)
      } else {
        // No availability found — show empty state, don't auto-seed
        setAvailabilitySlots([])
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      }

      const bookingSettingsData = await getBookingSettings(authUser.id)
      setBookingSettings(bookingSettingsData)

      setIsLoadingSettings(false)

      // Scroll to hash target after settings load
      if (window.location.hash) {
        setTimeout(() => {
          const el = document.querySelector(window.location.hash)
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }

    loadData()
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  // Get session type name
  const lockedNameFr: Record<string, string> = { initial: 'Consultation initiale', follow_up: 'Séance de suivi', check_in: 'Point de situation', 'Initial Consultation': 'Consultation initiale', 'Follow-up Session': 'Séance de suivi', 'Follow-up': 'Séance de suivi', 'Check-in': 'Point de situation' }
  const getSessionTypeName = (typeId: string) => {
    const type = sessionTypes.find(st => st.id === typeId)
    if (locale === 'fr') {
      if (type?.name_fr) return type.name_fr
      if (lockedNameFr[typeId]) return lockedNameFr[typeId]
      if (type?.name && lockedNameFr[type.name]) return lockedNameFr[type.name]
    }
    return type?.name || typeId
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const startTime = parseISO(booking.start_time)
    const now = new Date()

    switch (appointmentFilter) {
      case 'upcoming':
        return (booking.status === 'confirmed' || booking.status === 'pending') && startTime > now
      case 'past':
        return (startTime < now && booking.status !== 'pending') || booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show'
      case 'all':
      default:
        return true
    }
  }).sort((a, b) => {
    // Upcoming: nearest first
    if (appointmentFilter === 'upcoming') {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    }
    // Past & All: most recent first
    return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  })

  // Count pending bookings
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  // Format date for display
  const formatBookingDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`
    }
    return format(date, 'MMM d, yyyy h:mm a')
  }

  // Booking actions
  const handleApprove = async (bookingId: string) => {
    setProcessingId(bookingId)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve booking')
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
      )

      if (data.calendarSynced) {
        setMessage({ type: 'success', text: locale === 'fr' ? 'Rendez-vous approuvé et synchronisé avec Google Agenda !' : 'Booking approved and synced to Google Calendar!' })
      } else if (data.calendarError) {
        setMessage({ type: 'success', text: locale === 'fr' ? `Rendez-vous approuvé. Sync agenda : ${data.calendarError}` : `Booking approved. Calendar sync: ${data.calendarError}` })
      } else {
        setMessage({ type: 'success', text: locale === 'fr' ? 'Rendez-vous approuvé !' : 'Booking approved!' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : (locale === 'fr' ? 'Impossible d\'approuver le rendez-vous' : 'Failed to approve booking') })
    }

    setProcessingId(null)
  }

  const handleReject = async (bookingId: string) => {
    setProcessingId(bookingId)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject booking')
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      )
      emitBookingsChanged()

      setMessage({ type: 'success', text: locale === 'fr' ? 'Rendez-vous annulé.' : 'Booking rejected.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : (locale === 'fr' ? 'Impossible d\'annuler le rendez-vous' : 'Failed to reject booking') })
    }

    setProcessingId(null)
  }

  const handleMarkStatus = async (bookingId: string, status: 'completed' | 'no_show') => {
    setProcessingId(bookingId)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking')
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status } : b))
      )
      emitBookingsChanged()

      setMessage({ type: 'success', text: locale === 'fr' ? `Rendez-vous marqué comme ${STATUS_LABELS[status]?.fr?.toLowerCase()}.` : `Booking marked as ${STATUS_LABELS[status]?.en?.toLowerCase()}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : (locale === 'fr' ? 'Impossible de mettre à jour le rendez-vous' : 'Failed to update booking') })
    }

    setProcessingId(null)
  }

  // Reschedule
  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null)
  const [calendarSlotBooking, setCalendarSlotBooking] = useState<{ date: Date; time: string; outsideHours?: boolean } | null>(null)
  const [cancelConfirmBooking, setCancelConfirmBooking] = useState<any | null>(null)
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<any | null>(null)

  // ── Close-session popup state ──────────────────────────────────────
  // Mirrors SessionsTab. A single dialog asks "How did this session go?"
  // (Show vs No-show) and then reveals the matching branch's sections.
  // Captures local state until the practitioner confirms, then writes
  // everything atomically through the right branch.
  const [closePopupBooking, setClosePopupBooking] = useState<Booking | null>(null)
  const [closePopupOutcome, setClosePopupOutcome] = useState<'show' | 'no_show' | null>(null)
  const [closePopupSaving, setClosePopupSaving] = useState(false)

  // Show-branch fields
  // Every required field starts null — practitioner must explicitly
  // answer each section before Confirm enables. No silent defaults.
  const [showBPayment, setShowBPayment] = useState<'paid' | 'unpaid' | null>(null)
  const [showBNoteAction, setShowBNoteAction] = useState<'take' | 'skip' | 'has' | null>(null)
  const [showBNoteDraft, setShowBNoteDraft] = useState('')
  // Schedule-next is asked AFTER Close is confirmed, via a small
  // follow-up popup — keeps the main Close form focused on the
  // session that just happened.
  const [scheduleNextPromptOpenB, setScheduleNextPromptOpenB] = useState(false)

  // No-show-branch fields
  const [noShowBPayment, setNoShowBPayment] = useState<'paid' | 'unpaid' | null>(null)
  const [noShowBReason, setNoShowBReason] = useState<string>('')
  const [noShowBComments, setNoShowBComments] = useState('')

  // For the post-Show "Schedule next" branch — opens ScheduleSessionModal.
  // Bookings page doesn't have the full Member shape on hand, so the modal
  // opens at its member-picker step (consistent with the existing Reschedule
  // path) rather than auto-preselecting.
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  // Refetch when any other surface (patient detail, dashboard, another
  // tab) mutates a booking or session. Keeps the page in sync without
  // requiring a manual refresh.
  useBookingsChanged(() => {
    if (userId) {
      void fetchBookings()
    }
  })

  // On initial mount loadData only fetches the bookings rows
  // themselves — it doesn't populate the bookingsWithNotes lookup
  // (which lives inside fetchBookings). Without this useEffect, the
  // set starts empty on every page reload and the calendar popover
  // shows "Take notes" for bookings that actually have notes saved.
  // Triggered by userId becoming non-null after auth resolves.
  useEffect(() => {
    if (userId) void fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Refresh bookings list — shared by every status-changing handler.
  // Mirrors SessionsTab's onSessionsUpdate pattern.
  const fetchBookings = async () => {
    if (!userId) return
    const sb = createClient()
    const { data } = await sb
      .from('bookings')
      .select('*')
      .eq('practitioner_id', userId)
      .order('start_time', { ascending: true })
    if (data) setBookings(data as Booking[])

    // Build the "has saved session note" lookup with two flat queries
    // and a JS-side intersection. The previous version used a
    // PostgREST nested `progress_notes!inner(...)` select which
    // intermittently returned empty on reload (likely a schema-cache
    // / FK detection quirk), so the calendar popover would forget the
    // note after a refresh. Two simple queries are cheap and rock
    // solid.
    const [{ data: sessionRows }, { data: noteRows }] = await Promise.all([
      sb.from('sessions')
        .select('id, member_id, scheduled_at')
        .eq('practitioner_id', userId),
      sb.from('progress_notes')
        .select('session_id')
        .eq('practitioner_id', userId)
        .eq('note_type', 'session_summary')
        .not('session_id', 'is', null),
    ])
    const sessionIdsWithNotes = new Set<string>(
      (noteRows || []).map((n: { session_id: string | null }) => n.session_id).filter((x): x is string => !!x)
    )
    const set = new Set<string>()
    for (const s of (sessionRows || []) as Array<{ id: string; member_id: string | null; scheduled_at: string }>) {
      if (!s.member_id) continue
      if (!sessionIdsWithNotes.has(s.id)) continue
      const minute = Math.floor(new Date(s.scheduled_at).getTime() / 60000)
      set.add(`${s.member_id}::${minute}`)
    }
    setBookingsWithNotes(set)
  }

  // Match a booking against the has-notes set. Same minute-precision
  // pairing the rest of the page uses for bookings ↔ sessions.
  const bookingHasNotes = (b: Booking): boolean => {
    if (!b.member_id) return false
    const minute = Math.floor(new Date(b.start_time).getTime() / 60000)
    return bookingsWithNotes.has(`${b.member_id}::${minute}`)
  }

  const openClosePopupBooking = (booking: Booking) => {
    setClosePopupBooking(booking)
    // When editing an already-closed booking, pre-fill the outcome + payment
    // (+ reason) so the practitioner adjusts what they recorded rather than
    // starting over. Completed → "show"; cancelled/no_show → "no_show".
    const isCompleted = booking.status === 'completed'
    const isClosedCancel = booking.status === 'cancelled' || booking.status === 'no_show'
    setClosePopupOutcome(isCompleted ? 'show' : isClosedCancel ? 'no_show' : null)
    setShowBPayment(isCompleted ? booking.payment_status : null)
    const hasExistingNote = !!(booking.practitioner_notes && booking.practitioner_notes.trim().length > 0)
    setShowBNoteAction(hasExistingNote ? 'has' : null)
    setShowBNoteDraft('')
    setNoShowBPayment(isClosedCancel ? booking.payment_status : null)
    setNoShowBReason(isClosedCancel ? (booking.cancellation_reason || '') : '')
    setNoShowBComments('')
  }
  const closeClosePopupBooking = () => {
    setClosePopupBooking(null)
    setClosePopupOutcome(null)
    setShowBNoteDraft('')
    setNoShowBComments('')
  }

  const confirmClosePopupBooking = async () => {
    if (!closePopupBooking || !closePopupOutcome) return
    const booking = closePopupBooking
    setClosePopupSaving(true)
    try {
      const sb = createClient()
      // Mirror the booking close to the paired session row so the
      // member page's Sessions tab doesn't keep the row as "scheduled"
      // while the bookings page has already marked it closed.
      // 'show'    → both rows status='completed'
      // 'no_show' → both rows status='cancelled' (no_show is just a
      //             reason; we store it as cancelled per founder's call).
      const mirrorToSession = async (
        sessionStatus: 'completed' | 'cancelled',
        paymentStatus: 'paid' | 'unpaid',
        cancellationReason?: string,
      ) => {
        if (!booking.member_id) return
        try {
          const sessionUpdates: Record<string, unknown> = {
            status: sessionStatus,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          }
          if (cancellationReason) sessionUpdates.cancellation_reason = cancellationReason
          // No status guard: when editing an already-closed booking we DO want
          // to update the (already completed/cancelled) paired session row too.
          await sb
            .from('sessions')
            .update(sessionUpdates)
            .eq('practitioner_id', booking.practitioner_id)
            .eq('member_id', booking.member_id)
            .eq('scheduled_at', booking.start_time)
        } catch (sessErr) {
          console.warn('Could not propagate close to matching session:', sessErr)
        }
      }

      if (closePopupOutcome === 'show') {
        // Required fields: payment + note choice. Guard against null.
        if (showBPayment === null || showBNoteAction === null) return
        const updates: Record<string, unknown> = {
          status: 'completed',
          payment_status: showBPayment,
          // Clear any prior cancellation data — relevant when editing a
          // previously cancelled/no-show booking back to attended.
          cancellation_reason: null,
          cancelled_at: null,
        }
        // Save new note inline by appending to practitioner_notes (don't
        // overwrite an existing entry).
        if (showBNoteAction === 'take' && showBNoteDraft.replace(/<[^>]*>/g, '').trim()) {
          const existing = booking.practitioner_notes || ''
          updates.practitioner_notes = existing
            ? existing + '\n\n' + showBNoteDraft
            : showBNoteDraft
        }
        const { error } = await sb.from('bookings').update(updates).eq('id', booking.id)
        if (error) throw error
        await mirrorToSession('completed', showBPayment)
        await fetchBookings()
        emitBookingsChanged()
        closeClosePopupBooking()
        // Hand off to the small follow-up prompt.
        setScheduleNextPromptOpenB(true)
        toast.success(locale === 'fr' ? 'Rendez-vous marqué comme terminé' : 'Booking marked as completed')
      } else {
        // Required fields: payment + reason. Comments optional.
        if (noShowBPayment === null || !noShowBReason) return
        const updates: Record<string, unknown> = {
          status: 'cancelled',
          payment_status: noShowBPayment,
          cancellation_reason: noShowBReason,
          cancelled_at: new Date().toISOString(),
        }
        if (noShowBComments.trim()) {
          const existing = booking.practitioner_notes || ''
          updates.practitioner_notes = (existing
            ? existing + '\n\n' + noShowBComments.trim()
            : noShowBComments.trim()).trim()
        }
        const { error } = await sb.from('bookings').update(updates).eq('id', booking.id)
        if (error) throw error
        await mirrorToSession('cancelled', noShowBPayment, noShowBReason)
        await fetchBookings()
        emitBookingsChanged()
        closeClosePopupBooking()
        toast.success(locale === 'fr' ? 'Rendez-vous marqué comme annulé' : 'Booking marked as cancelled')
      }
    } catch (err) {
      console.error('confirmClosePopupBooking error:', err)
      toast.error(locale === 'fr' ? 'Erreur lors de la mise à jour' : 'Failed to update booking')
    } finally {
      setClosePopupSaving(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId)
      const sb = createClient()
      const booking = bookings.find(b => b.id === bookingId)

      // 1. If still active and on Google Calendar, cancel via API
      //    first. The PATCH endpoint removes the Google event and
      //    notifies the patient (cancellation email). Skip when the
      //    booking is already cancelled to avoid hitting Google with a
      //    delete on an event that's already gone.
      if (booking && booking.status !== 'cancelled' && booking.google_event_id) {
        try {
          await fetch(`/api/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
          })
        } catch (cancelErr) {
          console.warn('Booking cancel-before-delete failed (continuing):', cancelErr)
        }
      }

      // 2. Find the matching session and detach any progress_notes
      //    from it before we remove the session row, so notes survive
      //    as standalone observations under the patient. Mirrors the
      //    "keep notes" path on the SessionsTab delete flow.
      if (booking?.member_id) {
        const { data: sess } = await sb
          .from('sessions')
          .select('id')
          .eq('practitioner_id', booking.practitioner_id)
          .eq('member_id', booking.member_id)
          .eq('scheduled_at', booking.start_time)
          .maybeSingle()
        if (sess?.id) {
          await sb
            .from('progress_notes')
            .update({ session_id: null })
            .eq('session_id', sess.id)
        }
      }

      // 3. Delete the matching session row. Always scope by member_id
      //    when present so we don't sweep up a different patient's
      //    session that happens to be at the same time on the same
      //    practitioner's calendar.
      if (booking) {
        let q = sb.from('sessions').delete()
          .eq('practitioner_id', booking.practitioner_id)
          .eq('scheduled_at', booking.start_time)
        if (booking.member_id) q = q.eq('member_id', booking.member_id)
        await q
      }

      // 4. Delete the booking row. Request exact count so we can
      //    detect the RLS-silently-blocked case (no error, 0 rows
      //    affected) and surface it instead of fake-succeeding.
      const { error, count } = await sb
        .from('bookings')
        .delete({ count: 'exact' })
        .eq('id', bookingId)
      if (error) throw error
      if ((count ?? 0) === 0) {
        throw new Error('Delete matched 0 rows — likely RLS or wrong practitioner_id')
      }

      setBookings(prev => prev.filter(b => b.id !== bookingId))
      emitBookingsChanged()
      setDeleteConfirmBooking(null)
      toast.success(locale === 'fr' ? 'Rendez-vous supprimé' : 'Booking deleted')
    } catch (err: any) {
      console.error('Delete booking error:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      })
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Failed to delete booking')
    } finally {
      setProcessingId(null)
    }
  }

  // Reopen a cancelled booking — accidental-cancel recovery from the
  // three-dot menu. /restore flips the rows back AND recreates the
  // Google event so the patient gets a fresh invitation.
  const handleReopenBooking = async (booking: Booking) => {
    try {
      setProcessingId(booking.id)
      const res = await fetch(`/api/bookings/${booking.id}/restore`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null as any)
        toast.error(body?.error || (locale === 'fr' ? 'Échec de la restauration' : 'Restore failed'))
        return
      }
      setBookings(prev => prev.map(b =>
        b.id === booking.id
          ? { ...b, status: 'confirmed' as const, cancelled_at: null, cancelled_by: null, cancellation_reason: null }
          : b
      ))
      emitBookingsChanged()
      toast.success(locale === 'fr' ? 'Séance restaurée' : 'Session restored')
    } catch (err) {
      console.error('Reopen booking error:', err)
      toast.error(locale === 'fr' ? 'Échec de la restauration' : 'Restore failed')
    } finally {
      setProcessingId(null)
    }
  }

  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<Array<{ slot_start: string; slot_end: string }>>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const openRescheduleModal = (booking: any) => {
    setRescheduleBooking(booking)
    setRescheduleDate('')
    setRescheduleTime('')
    setRescheduleReason('')
    setRescheduleSlots([])
  }

  const loadRescheduleSlots = async (date: string) => {
    if (!rescheduleBooking || !date) return
    setIsLoadingSlots(true)
    setRescheduleTime('')
    try {
      const duration = Math.round(
        (new Date(rescheduleBooking.end_time).getTime() - new Date(rescheduleBooking.start_time).getTime()) / 60000
      )
      const res = await fetch(`/api/bookings/available-slots?practitionerId=${rescheduleBooking.practitioner_id}&date=${date}&duration=${duration}&skipNotice=true`)
      const data = await res.json()
      setRescheduleSlots(data.slots || [])
    } catch {
      setRescheduleSlots([])
    }
    setIsLoadingSlots(false)
  }

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleTime) return
    setProcessingId(rescheduleBooking.id)
    const selectedSlot = rescheduleSlots.find(s => s.slot_start === rescheduleTime)
    if (!selectedSlot) return

    try {
      const response = await fetch(`/api/bookings/${rescheduleBooking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSlotStart: selectedSlot.slot_start,
          newSlotEnd: selectedSlot.slot_end,
          reason: rescheduleReason || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to reschedule')

      // Refresh bookings — full refetch so the new booking row created
      // server-side shows up too, not just the cancelled old one.
      await fetchBookings()
      emitBookingsChanged()
      setRescheduleBooking(null)
      toast.success(locale === 'fr' ? 'Séance reprogrammée' : 'Session rescheduled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule')
    }
    setProcessingId(null)
  }

  // Settings actions
  const handleConnectGoogle = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/calendar/google')
      const { url } = await response.json()
      window.location.href = url
    } catch {
      setMessage({ type: 'error', text: locale === 'fr' ? 'Impossible d\'initier la connexion' : 'Failed to initiate calendar connection' })
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    const success = await disconnectCalendar()
    if (success) {
      setCalendarConnection(null)
      setMessage({ type: 'success', text: locale === 'fr' ? 'Google Agenda déconnecté' : 'Calendar disconnected' })
    } else {
      setMessage({ type: 'error', text: locale === 'fr' ? 'Impossible de déconnecter Google Agenda' : 'Failed to disconnect calendar' })
    }
    setIsDisconnecting(false)
  }

  const addAvailabilitySlot = (day: DayOfWeek) => {
    setAvailabilitySlots([
      ...availabilitySlots,
      { day, startTime: '09:00', endTime: '17:00', isActive: true, sessionFormat: 'both' },
    ])
  }

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index))
  }

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    const updated = [...availabilitySlots]
    updated[index] = { ...updated[index], [field]: value }
    setAvailabilitySlots(updated)
  }

  const handleSaveAvailability = async () => {
    if (!userId) return

    setIsSavingAvailability(true)
    const success = await bulkUpdateAvailability(
      userId,
      availabilitySlots.map((slot) => ({
        day_of_week: slot.day,
        start_time: slot.startTime + ':00',
        end_time: slot.endTime + ':00',
        is_active: slot.isActive,
        timezone,
        session_format: slot.sessionFormat || 'both',
      }))
    )

    if (success) {
      setShowSavedModal(true)
    } else {
      setMessage({ type: 'error', text: locale === 'fr' ? 'Impossible d\'enregistrer la disponibilité' : 'Failed to save availability' })
    }
    setIsSavingAvailability(false)
  }

  const handleSaveBookingSettings = async () => {
    console.log('[bookings/handleSave] Called! userId:', userId)
    if (!userId) {
      toast.error(locale === 'fr' ? 'Aucun utilisateur trouvé. Veuillez actualiser la page.' : 'No user ID found. Please refresh the page.')
      return
    }

    setIsSavingSettings(true)
    const payload = {
      user_id: userId,
      default_duration: bookingSettings?.default_duration || 60,
      buffer_before: bookingSettings?.buffer_before ?? 0,
      buffer_after: bookingSettings?.buffer_after ?? 15,
      min_notice_hours: bookingSettings?.min_notice_hours || 24,
      max_advance_days: bookingSettings?.max_advance_days || 60,
      session_types: bookingSettings?.session_types || DEFAULT_SESSION_TYPES,
      booking_page_enabled: bookingSettings?.booking_page_enabled ?? true,
      require_approval: bookingSettings?.require_approval ?? false,
      cancellation_policy: bookingSettings?.cancellation_policy ?? null,
      booking_instructions: bookingSettings?.booking_instructions ?? null,
      email_notifications: bookingSettings?.email_notifications ?? true,
      external_booking_url: bookingSettings?.external_booking_url ?? null,
      allow_patient_book: (bookingSettings as any)?.allow_patient_book ?? true,
      allow_patient_cancel: (bookingSettings as any)?.allow_patient_cancel ?? false,
      allow_patient_reschedule: (bookingSettings as any)?.allow_patient_reschedule ?? false,
      modification_notice_hours: (bookingSettings as any)?.modification_notice_hours ?? 48,
      late_cancellation_hours: (bookingSettings as any)?.late_cancellation_hours ?? 0,
      show_payment_to_patient: (bookingSettings as any)?.show_payment_to_patient ?? false,
      // ↑ default false — explicit opt-in to surface payment to patient.
      hour_aligned_slots: (bookingSettings as any)?.hour_aligned_slots ?? false,
      currency: bookingSettings?.currency ?? 'EUR',
      send_own_calendar_emails: (bookingSettings as any)?.send_own_calendar_emails ?? true,
      booking_page_language: bookingSettings?.booking_page_language ?? null,
      calendar_event_title_template: (bookingSettings as any)?.calendar_event_title_template?.trim() || null,
      calendar_email_reminder_enabled: (bookingSettings as any)?.calendar_email_reminder_enabled ?? false,
      sms_on_booking: (bookingSettings as any)?.sms_on_booking ?? false,
    }
    console.log('[bookings/handleSave] Payload:', JSON.stringify(payload))

    try {
      const saved = await saveBookingSettings(payload)
      console.log('[bookings/handleSave] Result:', saved)
      if (saved) {
        setBookingSettings(saved)
        setShowSettingsSavedModal(true)
      } else {
        toast.error(locale === 'fr' ? 'Impossible d\'enregistrer les paramètres.' : 'Failed to save booking settings.')
      }
    } catch (err) {
      console.error('[bookings/handleSave] Exception:', err)
      toast.error(locale === 'fr' ? 'Erreur lors de l\'enregistrement.' : 'Error saving settings.')
    }
    setIsSavingSettings(false)
  }

  const getSlotsForDay = (day: DayOfWeek) => {
    return availabilitySlots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.day === day)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="bookings" />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CalendarCheck className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Réservations' : 'Bookings'}</span>
            </div>
          }
        />

        {/* Content */}
        <div className={mainTab === 'appointments' && bookingView === 'calendar' ? 'p-4' : 'p-8'}>
          <div className={`space-y-6 ${mainTab === 'appointments' && bookingView === 'calendar' ? 'w-full' : 'max-w-5xl mx-auto'}`}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">{locale === 'fr' ? 'Réservations' : 'Bookings'}</h1>
                <p className="text-gray-500 text-sm">{locale === 'fr' ? 'Gérer les rendez-vous et les paramètres' : 'Manage appointments and booking settings'}</p>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pendingCount} {locale === 'fr' ? 'en attente' : 'pending'}</span>
                </div>
              )}
            </motion.div>

          {/* Message Toast */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl flex items-center gap-3 backdrop-blur-xl shadow-lg ${
                message.type === 'success'
                  ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50/90 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <span className="flex-1">{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

            {/* Main Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-6">
              <button
                onClick={() => setMainTab('appointments')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mainTab === 'appointments'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {locale === 'fr' ? 'Rendez-vous' : 'Appointments'}
                {pendingCount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    mainTab === 'appointments'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
              <button
                onClick={() => setMainTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mainTab === 'settings'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                {locale === 'fr' ? 'Paramètres' : 'Settings'}
              </button>
            </div>

          {/* Appointments Tab Content */}
          {mainTab === 'appointments' && (
            <>
              {/* Google Calendar mismatch banner */}
              {calendarMismatches.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        {locale === 'fr'
                          ? `${calendarMismatches.length} séance${calendarMismatches.length > 1 ? 's' : ''} supprimée${calendarMismatches.length > 1 ? 's' : ''} de Google Agenda`
                          : `${calendarMismatches.length} session${calendarMismatches.length > 1 ? 's' : ''} removed from Google Calendar`}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {locale === 'fr'
                          ? 'Ces séances existent sur Bloomsline mais plus sur votre Google Agenda.'
                          : 'These sessions exist on Bloomsline but no longer on your Google Calendar.'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-8">
                    {calendarMismatches.map(m => {
                      const d = new Date(m.startTime)
                      const dateStr = d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })
                      const timeStr = d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr',
                      })
                      const isProcessing = mismatchProcessing === m.bookingId
                      return (
                        <div key={m.bookingId} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{m.clientName}</p>
                            <p className="text-xs text-gray-500">{m.sessionType} · {dateStr} · {timeStr}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setMismatchProcessing(m.bookingId)
                                try {
                                  await fetch(`/api/bookings/${m.bookingId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'cancelled' }),
                                  })
                                  setCalendarMismatches(prev => prev.filter(x => x.bookingId !== m.bookingId))
                                  setBookings(prev => prev.map(b => b.id === m.bookingId ? { ...b, status: 'cancelled' } : b))
                                  toast.success(locale === 'fr' ? 'Séance annulée' : 'Session cancelled')
                                } catch { toast.error(locale === 'fr' ? 'Échoué' : 'Failed') }
                                setMismatchProcessing(null)
                              }}
                              className="text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : (locale === 'fr' ? 'Annuler' : 'Cancel')}
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={async () => {
                                setMismatchProcessing(m.bookingId)
                                try {
                                  const { createClient } = await import('@/lib/supabase/browser-client')
                                  const sb = createClient()
                                  await sb.from('bookings').update({ google_event_id: null }).eq('id', m.bookingId)
                                  setCalendarMismatches(prev => prev.filter(x => x.bookingId !== m.bookingId))
                                  toast.success(locale === 'fr' ? 'Séance conservée' : 'Session kept')
                                } catch { toast.error(locale === 'fr' ? 'Échoué' : 'Failed') }
                                setMismatchProcessing(null)
                              }}
                              className="text-xs font-medium text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                            >
                              {locale === 'fr' ? 'Conserver' : 'Keep'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {calendarMismatches.length > 1 && (
                    <div className="flex gap-2 mt-3 ml-8">
                      <button
                        disabled={!!mismatchProcessing}
                        onClick={async () => {
                          setMismatchProcessing('all')
                          for (const m of calendarMismatches) {
                            try {
                              await fetch(`/api/bookings/${m.bookingId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'cancelled' }),
                              })
                              setBookings(prev => prev.map(b => b.id === m.bookingId ? { ...b, status: 'cancelled' } : b))
                            } catch {}
                          }
                          setCalendarMismatches([])
                          toast.success(locale === 'fr' ? 'Toutes les séances annulées' : 'All sessions cancelled')
                          setMismatchProcessing(null)
                        }}
                        className="text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                      >
                        {locale === 'fr' ? 'Tout annuler' : 'Cancel all'}
                      </button>
                      <button
                        disabled={!!mismatchProcessing}
                        onClick={async () => {
                          setMismatchProcessing('all')
                          try {
                            const { createClient } = await import('@/lib/supabase/browser-client')
                            const sb = createClient()
                            for (const m of calendarMismatches) {
                              await sb.from('bookings').update({ google_event_id: null }).eq('id', m.bookingId)
                            }
                          } catch {}
                          setCalendarMismatches([])
                          toast.success(locale === 'fr' ? 'Toutes les séances conservées' : 'All sessions kept')
                          setMismatchProcessing(null)
                        }}
                        className="text-xs font-medium text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                      >
                        {locale === 'fr' ? 'Tout conserver' : 'Keep all'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* External booking info banner */}
              {bookingSettings?.external_booking_url && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {locale === 'fr' ? 'Vous utilisez un système de réservation externe' : 'You\'re using an external booking system'}
                    </p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      {locale === 'fr' ? 'Les réservations faites via votre plateforme externe ne se synchronisent pas automatiquement avec Bloomsline. Pensez à créer une séance manuellement pour garder vos dossiers à jour.' : 'Bookings made through your external platform won\'t sync to Bloomsline automatically. Remember to create a manual session when needed to keep your records up to date.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Sub Tabs — scroll-anchored to sections (list view only) */}
              <div className="flex gap-2 items-center flex-wrap">
                {bookingView !== 'calendar' && (() => {
                  const handleScroll = (id: string) => () => {
                    const el = document.getElementById(id)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  const upcomingCount = bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && parseISO(b.start_time) > new Date()).length
                  const historyCount = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show' || (b.status === 'confirmed' && parseISO(b.start_time) < new Date())).length
                  return (
                    <>
                      <button onClick={handleScroll('up-next-section')} className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white/60 transition-colors">
                        {locale === 'fr' ? 'À venir' : 'Upcoming'}
                        <span className="text-xs text-gray-400 tabular-nums">{upcomingCount}</span>
                      </button>
                      <button onClick={handleScroll('history-section')} className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-white/60 transition-colors">
                        {locale === 'fr' ? 'Historique' : 'History'}
                        <span className="text-xs text-gray-400 tabular-nums">{historyCount}</span>
                      </button>
                    </>
                  )
                })()}
                {/* View toggle — in calendar view it lives in the left rail
                    (under "New booking"); kept here only for list view so the
                    user can switch back. */}
                {bookingView === 'list' && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-auto">
                  <button
                    onClick={() => setBookingView('calendar')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all text-gray-500 hover:text-gray-700"
                  >
                    {locale === 'fr' ? 'Calendrier' : 'Calendar'}
                  </button>
                  <button
                    onClick={() => setBookingView('list')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-white shadow-sm text-gray-900"
                  >
                    {locale === 'fr' ? 'Liste' : 'List'}
                  </button>
                </div>
                )}
              </div>

              {/* Unlinked Google events — only when Google is connected */}
              {calendarConnection && (
                <div className="mb-4">
                  <UnclaimedGoogleEventsCard
                    sessionTypes={(sessionTypes || []) as { id: string; name: string; duration?: number; price?: number | null }[]}
                    locale={locale as 'en' | 'fr' | 'es'}
                    onClaimed={async () => {
                      // Refetch bookings inline so the newly claimed event
                      // appears in the list immediately.
                      const sb = createClient()
                      const { data: { user: u } } = await sb.auth.getUser()
                      if (!u) return
                      const { data } = await sb
                        .from('bookings')
                        .select('*')
                        .eq('practitioner_id', u.id)
                        .order('start_time', { ascending: true })
                      if (data) setBookings(data as typeof bookings)
                    }}
                  />
                </div>
              )}

              {/* Calendar View — Google-style: left rail (new booking +
                  mini month picker) + full-width week grid. */}
              {bookingView === 'calendar' ? (
                <div className="flex items-start gap-4">
                  <aside className="hidden lg:block w-60 shrink-0 space-y-4">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {locale === 'fr' ? 'Nouveau rendez-vous' : 'New booking'}
                    </button>
                    {/* Calendar / List toggle (Calendar is the active view here) */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setBookingView('calendar')}
                        className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-white shadow-sm text-gray-900"
                      >
                        {locale === 'fr' ? 'Calendrier' : 'Calendar'}
                      </button>
                      <button
                        onClick={() => setBookingView('list')}
                        className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-gray-500 hover:text-gray-700"
                      >
                        {locale === 'fr' ? 'Liste' : 'List'}
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                      <MiniMonthCalendar
                        selectedWeekStart={calWeekStart}
                        onSelectDate={(d) => setCalWeekStart(startOfWeek(d, { weekStartsOn: 1 }))}
                        locale={locale}
                      />
                    </div>
                  </aside>
                  <div className="flex-1 min-w-0">
                    <WeekCalendarView
                      bookings={bookings}
                      weekStart={calWeekStart}
                      onWeekStartChange={setCalWeekStart}
                      fillViewport
                      onApprove={handleApprove}
                      onReject={handleReject}
                      processingId={processingId}
                      onSlotClick={(day, time, options) => setCalendarSlotBooking({ date: day, time, outsideHours: options?.outsideHours })}
                      hasNotesForBooking={(bookingId) => {
                        const b = bookings.find(x => x.id === bookingId)
                        return b ? bookingHasNotes(b) : false
                      }}
                      onTakeNotes={(bookingId) => {
                        const b = bookings.find(x => x.id === bookingId)
                        if (b) handleTakeNotes(b)
                      }}
                      onCloseSession={(bookingId) => {
                        const b = bookings.find(x => x.id === bookingId)
                        if (b) openClosePopupBooking(b)
                      }}
                    />
                  </div>
                </div>
              ) : (
              <>
              {/* Bookings List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : (() => {
                // ── Compute upcoming vs history once. Order-preserving. ──
                const now = new Date()
                // Map a Booking to its StatusKey for filtering (same logic
                // as the dot colour).
                const bookingStatusKey = (b: Booking): StatusKey => {
                  if (b.status === 'pending') return 'pending'
                  if (b.status === 'confirmed') return parseISO(b.start_time) < now ? 'awaiting' : 'scheduled'
                  if (b.status === 'completed') return 'completed'
                  if (b.status === 'cancelled') return 'cancelled'
                  if (b.status === 'no_show') return 'no_show'
                  return 'scheduled'
                }
                const passesFilters = (b: Booking): boolean => {
                  if (!inDateRange(parseISO(b.start_time), dateRange, customFrom, customTo)) return false
                  if (statusFilters.size > 0 && !statusFilters.has(bookingStatusKey(b))) return false
                  if (typeFilters.size > 0 && !typeFilters.has(b.session_type as string)) return false
                  if (paymentFilters.size > 0 && !paymentFilters.has(b.payment_status || 'unpaid')) return false
                  // Patient filter — guest bookings (no member_id) are
                  // excluded when filtering by patient since they can't
                  // belong to a selected member.
                  if (memberFilters.size > 0 && (!b.member_id || !memberFilters.has(b.member_id))) return false
                  return true
                }
                const upcomingBookingsRaw = bookings
                  .filter(b => (b.status === 'confirmed' || b.status === 'pending') && parseISO(b.start_time) > now)
                  .filter(passesFilters)
                  .sort((a, b) => {
                    if (a.status === 'pending' && b.status !== 'pending') return -1
                    if (a.status !== 'pending' && b.status === 'pending') return 1
                    return parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
                  })
                // Collapse recurring-series occurrences into a single card,
                // identical to the SessionsTab pattern. One card per series
                // shows the next occurrence; subsequent dates open via the
                // "View all sessions" button on that card.
                const upcomingBookings = ((): (typeof bookings[number] & { _seriesNext?: typeof bookings })[] => {
                  const seen = new Set<string>()
                  const out: (typeof bookings[number] & { _seriesNext?: typeof bookings })[] = []
                  for (const b of upcomingBookingsRaw) {
                    if (!b.series_id) { out.push(b); continue }
                    if (seen.has(b.series_id)) continue
                    seen.add(b.series_id)
                    const seriesNext = upcomingBookingsRaw.filter(x => x.series_id === b.series_id && x.id !== b.id)
                    out.push({ ...b, _seriesNext: seriesNext })
                  }
                  return out
                })()
                const historyBookings = bookings
                  .filter(b =>
                    b.status === 'completed' ||
                    b.status === 'cancelled' ||
                    b.status === 'no_show' ||
                    (b.status === 'confirmed' && parseISO(b.start_time) < now)
                  )
                  .filter(passesFilters)
                  .sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime())

                // ── Relative-date label for a booking row ──
                const dateHeadline = (d: Date) => {
                  if (isToday(d)) return locale === 'fr' ? "Aujourd'hui" : 'Today'
                  if (isTomorrow(d)) return locale === 'fr' ? 'Demain' : 'Tomorrow'
                  return format(d, locale === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale: locale === 'fr' ? frLocale : undefined })
                }

                // ── Reusable timeline row renderer ──
                // Keeps every existing action wired up; only the visual chrome changed.
                const renderRow = (booking: typeof bookings[number], _index: number, isLast: boolean) => {
                  const startTime = parseISO(booking.start_time)
                  const durMin = Math.round((parseISO(booking.end_time).getTime() - startTime.getTime()) / 60000)
                  const isAwaitingOutcome = booking.status === 'confirmed' && isPast(startTime)
                  // Map status → shared StatusKey so the timeline dot
                  // and the legend popover stay in sync.
                  const statusKey: StatusKey =
                    booking.status === 'pending'   ? 'pending'   :
                    booking.status === 'confirmed' ? (isAwaitingOutcome ? 'awaiting' : 'scheduled') :
                    booking.status === 'completed' ? 'completed' :
                    booking.status === 'cancelled' ? 'cancelled' :
                    booking.status === 'no_show'   ? 'no_show'   :
                    'scheduled'
                  // Use the live member name if the booking links to one, so
                  // renames are reflected in the row. Falls back to the
                  // snapshotted client_name for guest bookings.
                  const displayName = (booking.member_id && memberNames.get(booking.member_id)) || booking.client_name || ''
                  const initials = displayName
                    .split(' ')
                    .map(s => s.charAt(0))
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || '·'
                  return (
                    <div key={booking.id} id={`booking-${booking.id}`} className="relative flex gap-4 group">
                      {/* Timeline column — status dot (icon inside) + vertical line */}
                      <div className="relative w-5 flex-shrink-0">
                        <span className="absolute left-0 top-0.5">
                          <StatusDot status={statusKey} />
                        </span>
                        {!isLast && <span className="absolute left-1/2 -translate-x-1/2 top-7 bottom-[-1.25rem] w-px bg-gray-200" />}
                      </div>

                      {/* Row content */}
                      <div className="flex-1 min-w-0 pb-8">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            {/* Headline: patient name (the row's primary identity).
                                Clickable when linked to a member, with an arrow
                                affordance to the profile. */}
                            {booking.member_id ? (
                              <Link
                                href={`/members/${booking.member_id}`}
                                className="inline-flex items-center gap-2 group/patient hover:text-violet-700 transition-colors"
                                title={locale === 'fr' ? 'Voir le profil du patient' : "View patient profile"}
                              >
                                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-semibold shrink-0">{initials}</span>
                                <span className="text-sm font-semibold text-gray-900 truncate group-hover/patient:text-violet-700 group-hover/patient:underline underline-offset-2 decoration-violet-300">
                                  {displayName}
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover/patient:text-violet-600" />
                              </Link>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-semibold shrink-0">{initials}</span>
                                <span className="text-sm font-semibold text-gray-900 truncate">{displayName}</span>
                              </div>
                            )}

                            {/* Sub-line: session type + relative date + time */}
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="text-gray-800 font-medium">{getSessionTypeName(booking.session_type)}</span>
                              <span className="text-gray-400"> · </span>
                              <span className="text-gray-700 font-medium">{dateHeadline(startTime)}</span>
                              <span className="text-gray-400"> · </span>
                              <span>{format(startTime, locale === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale: locale === 'fr' ? frLocale : undefined })}</span>
                              <span className="text-gray-400"> · </span>
                              <span className="font-medium">{format(startTime, 'h:mm a')}</span>
                            </p>

                            {/* Meta row: format · duration · origin chip · payment (if no action row) · awaiting flag */}
                            <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 flex-wrap text-xs">
                              <span className="inline-flex items-center gap-1 text-gray-500">
                                {booking.session_format === 'in_person'
                                  ? <><Building2 className="w-3 h-3" /> {locale === 'fr' ? 'En personne' : 'In Person'}</>
                                  : <><Video className="w-3 h-3" /> {locale === 'fr' ? 'Vidéo' : 'Virtual'}</>}
                              </span>
                              <span className="text-gray-500 tabular-nums">{durMin} min</span>
                              {/* Payment badge stays in the meta row only when there's
                                  no action row to host it; the action row puts it after
                                  the Take-notes button. Keeps a single source of truth. */}
                              {(() => {
                                const hasActionRow = (booking.member_id && (booking.status === 'confirmed' || booking.status === 'pending')) || (booking.status === 'confirmed' && booking.meet_link && !isAwaitingOutcome) || isAwaitingOutcome
                                if (hasActionRow) return null
                                return (
                                  <PaymentBadge
                                    status={booking.payment_status || 'unpaid'}
                                    table="bookings"
                                    recordId={booking.id}
                                  />
                                )
                              })()}
                              {/* Late-cancel marker — set by the patient
                                  cancel flow when they cancelled inside
                                  the practitioner's policy window. Flags
                                  the row for billing follow-up. */}
                              {(booking as any).late_cancellation && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-medium text-[10px]" title={locale === 'fr' ? "Annulée tardivement par le patient — facturable selon votre politique" : 'Late cancellation by patient — chargeable per your policy'}>
                                  {locale === 'fr' ? 'Annulation tardive' : 'Late cancel'}
                                </span>
                              )}
                              {/* Origin / sync indicator */}
                              {booking.google_event_id ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[10px]" title={locale === 'fr' ? 'Synchronisé avec Google Agenda' : 'Synced with Google Calendar'}>
                                  <Calendar className="w-2.5 h-2.5" />
                                  {locale === 'fr' ? 'Google Agenda' : 'Google Calendar'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium text-[10px]" title={locale === 'fr' ? 'Réservation manuelle dans Bloomsline' : 'Manual Bloomsline booking — not on Google Calendar'}>
                                  {locale === 'fr' ? 'Manuelle' : 'Manual'}
                                </span>
                              )}
                              {/* Series — small clickable chip that opens
                                  the SeriesDetailDrawer (mirrors SessionsTab). */}
                              {booking.series_id && booking.series_position && booking.series_total && (
                                <button
                                  type="button"
                                  onClick={() => setViewingSeriesId(booking.series_id!)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium text-[10px] transition-colors"
                                  title={locale === 'fr' ? 'Voir la série' : 'View series'}
                                >
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  {locale === 'fr'
                                    ? `Séance ${booking.series_position}/${booking.series_total}`
                                    : `Session ${booking.series_position}/${booking.series_total}`}
                                </button>
                              )}
                              {isAwaitingOutcome && (
                                <span className="text-orange-600 font-medium">{locale === 'fr' ? 'En attente du statut' : 'Awaiting outcome'}</span>
                              )}
                            </div>

                            {/* Cancellation reason or notes — inline, subtle */}
                            {booking.status === 'cancelled' && booking.cancellation_reason && (
                              <p className="text-xs text-red-500 mt-2">
                                {locale === 'fr' ? 'Annulé' : 'Cancelled'}{booking.cancelled_by === 'member' ? (locale === 'fr' ? ' par le patient' : ' by patient') : ''}: {booking.cancellation_reason}
                              </p>
                            )}
                            {booking.notes && booking.status !== 'cancelled' && (
                              <p className={`text-xs mt-2 ${booking.notes.startsWith('Rescheduled:') ? 'text-amber-600' : 'text-gray-500 italic'}`}>
                                {booking.notes}
                              </p>
                            )}

                            {/* Session-level actions — Close session
                                (awaiting outcome), Join (meet link), Take
                                notes, payment. Action row also fires for
                                isAwaitingOutcome so the Close button is
                                always reachable even on guest bookings. */}
                            {((booking.member_id && (booking.status === 'confirmed' || booking.status === 'pending')) ||
                              (booking.status === 'confirmed' && booking.meet_link && !isAwaitingOutcome) ||
                              isAwaitingOutcome) && (
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {/* Awaiting outcome — glowing Close session CTA */}
                                {isAwaitingOutcome && (
                                  <span className="relative inline-flex rounded-md">
                                    <span
                                      className="absolute inset-0 rounded-md bg-amber-400 opacity-40 animate-ping"
                                      style={{ animationDuration: '2s' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => openClosePopupBooking(booking)}
                                      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-md transition-colors"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {locale === 'fr' ? 'Clôturer la séance' : 'Close session'}
                                    </button>
                                  </span>
                                )}
                                {booking.status === 'confirmed' && !isAwaitingOutcome && booking.meet_link && (
                                  <a
                                    href={booking.meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    {locale === 'fr' ? 'Rejoindre' : 'Join'}
                                  </a>
                                )}
                                {booking.member_id &&
                                  (booking.status === 'confirmed' || booking.status === 'pending') && (
                                    <button
                                      type="button"
                                      onClick={() => handleTakeNotes(booking)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
                                    >
                                      <PenLine className="w-3.5 h-3.5 text-gray-500" />
                                      {locale === 'fr' ? 'Prendre des notes' : 'Take notes'}
                                    </button>
                                  )}
                                <PaymentBadge
                                  status={booking.payment_status || 'unpaid'}
                                  table="bookings"
                                  recordId={booking.id}
                                />
                              </div>
                            )}

                            {/* History rows (completed / cancelled / no_show)
                                — View notes if a note exists, otherwise Take
                                notes + small "No notes" hint. Mirrors the
                                SessionsTab History behaviour. */}
                            {booking.member_id && (booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show') && (() => {
                              const hasNote = bookingHasNotes(booking)
                              return (
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                  {hasNote ? (
                                    <button
                                      type="button"
                                      onClick={() => handleTakeNotes(booking)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                                      {locale === 'fr' ? 'Voir les notes' : 'View notes'}
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleTakeNotes(booking)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
                                      >
                                        <PenLine className="w-3.5 h-3.5 text-gray-500" />
                                        {locale === 'fr' ? 'Prendre des notes' : 'Take notes'}
                                      </button>
                                      <span className="text-xs text-gray-400 italic">
                                        {locale === 'fr' ? 'Aucune note' : 'No notes'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )
                            })()}

                            {/* The "Session N/Y" chip in the meta row above
                                is already clickable and opens the
                                SeriesDetailDrawer — no separate big button. */}
                          </div>

                          {/* Actions — status-change action + ⋯ menu for the rest. */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Pending: Approve visible, Reject + Delete in menu */}
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => handleApprove(booking.id)}
                                disabled={processingId === booking.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {processingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                {locale === 'fr' ? 'Accepter' : 'Approve'}
                              </button>
                            )}

                            {/* Awaiting outcome: rely on the menu's Show item (mirrors
                                SessionsTab). The inline "Complete" button used to live
                                here — removed when Show landed in the menu. */}

                            {/* Pending bookings keep an inline Reject affordance — it's
                                a status-change action, not the same as Delete. */}
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => setCancelConfirmBooking(booking)}
                                disabled={processingId === booking.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                {locale === 'fr' ? 'Refuser' : 'Reject'}
                              </button>
                            )}

                            {/* Mirror of SessionsTab. Close + Reschedule only
                                apply while the booking is still open (pending
                                or confirmed) — closed rows just keep Delete.
                                "Edit session" is omitted because bookings have
                                no dedicated edit-booking flow. */}
                            {(() => {
                              const isClosedB = booking.status !== 'pending' && booking.status !== 'confirmed'
                              const isCancelledB = booking.status === 'cancelled'
                              return (
                                <RowMenu items={[
                                  ...(isClosedB ? [
                                    { label: locale === 'fr' ? 'Modifier la clôture' : 'Edit close', icon: PenLine, onClick: () => openClosePopupBooking(booking) },
                                  ] : [
                                    { label: locale === 'fr' ? 'Clôturer la séance' : 'Close session', icon: CheckCircle, onClick: () => openClosePopupBooking(booking), tone: 'success' as const },
                                    { label: locale === 'fr' ? 'Reprogrammer' : 'Reschedule', icon: RefreshCw, onClick: () => openRescheduleModal(booking) },
                                  ]),
                                  ...(isCancelledB ? [
                                    { label: locale === 'fr' ? 'Restaurer la séance' : 'Reopen session', icon: RefreshCw, onClick: () => handleReopenBooking(booking), tone: 'success' as const },
                                  ] : []),
                                  { label: locale === 'fr' ? 'Supprimer' : 'Delete', icon: Trash2, onClick: () => setDeleteConfirmBooking(booking), danger: true },
                                ]} />
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Empty state for the page (both sections empty)
                if (upcomingBookings.length === 0 && historyBookings.length === 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-12 border border-gray-200 border-dashed text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        {locale === 'fr' ? 'Aucune réservation' : 'No bookings yet'}
                      </p>
                    </motion.div>
                  )
                }

                return (
                  <div className="space-y-6">
                    {/* ── Filter bar — applies to both Up next + History ── */}
                    <section className="bg-white rounded-2xl border border-gray-200 p-4">
                      <SessionFilters
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        customFrom={customFrom}
                        customTo={customTo}
                        onCustomChange={(from, to) => { setCustomFrom(from); setCustomTo(to) }}
                        statusOptions={[
                          { key: 'pending',   label: locale === 'fr' ? 'En attente d\'approbation' : 'Pending' },
                          { key: 'scheduled', label: locale === 'fr' ? 'Planifiée' : 'Scheduled' },
                          { key: 'awaiting',  label: locale === 'fr' ? 'En attente' : 'Awaiting' },
                          { key: 'completed', label: locale === 'fr' ? 'Terminée' : 'Completed' },
                          { key: 'cancelled', label: locale === 'fr' ? 'Annulée' : 'Cancelled' },
                          { key: 'no_show',   label: locale === 'fr' ? 'Absent' : 'No-show' },
                        ]}
                        statusFilters={statusFilters}
                        onStatusFiltersChange={setStatusFilters}
                        typeOptions={(() => {
                          // Use the practitioner's configured session
                          // types — that's the canonical list.
                          if (sessionTypes && sessionTypes.length > 0) {
                            return sessionTypes
                              .map(st => ({
                                key: st.name,
                                label: locale === 'fr' ? (st.name_fr || st.name) : st.name,
                              }))
                              .sort((a, b) => a.label.localeCompare(b.label))
                          }
                          // Fallback if no settings: derive from existing data
                          const seen = new Set<string>()
                          const opts: { key: string; label: string }[] = []
                          for (const b of bookings) {
                            const key = b.session_type as string
                            if (!key || seen.has(key)) continue
                            seen.add(key)
                            opts.push({ key, label: getSessionTypeName(key) || key })
                          }
                          return opts.sort((a, b) => a.label.localeCompare(b.label))
                        })()}
                        typeFilters={typeFilters}
                        onTypeFiltersChange={setTypeFilters}
                        paymentOptions={[
                          { key: 'paid',   label: locale === 'fr' ? 'Payé' : 'Paid' },
                          { key: 'unpaid', label: locale === 'fr' ? 'Non payé' : 'Unpaid' },
                        ]}
                        paymentFilters={paymentFilters}
                        onPaymentFiltersChange={setPaymentFilters}
                        memberOptions={(() => {
                          // Build patient options from the live memberNames
                          // map (current names, not snapshot from booking
                          // creation). Sorted alphabetically by display name.
                          const opts: { key: string; label: string }[] = []
                          for (const [id, name] of memberNames.entries()) {
                            opts.push({ key: id, label: name })
                          }
                          return opts.sort((a, b) =>
                            a.label.localeCompare(b.label, locale === 'fr' ? 'fr' : 'en')
                          )
                        })()}
                        memberFilters={memberFilters}
                        onMemberFiltersChange={setMemberFilters}
                        locale={locale}
                        onReset={resetFilters}
                      />
                    </section>

                    {/* ── Up next ── */}
                    <section id="up-next-section" className="bg-white rounded-2xl border border-gray-200 p-6 scroll-mt-6">
                      <header className="flex items-center justify-between mb-5">
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{locale === 'fr' ? 'À venir' : 'Up next'}</h2>
                          <span className="text-sm text-gray-400 tabular-nums">{upcomingBookings.length}</span>
                        </div>
                        <SessionDotLegend />
                      </header>
                      {upcomingBookings.length === 0 ? (
                        <p className="text-sm text-gray-400">{locale === 'fr' ? 'Aucun rendez-vous à venir' : 'No upcoming appointments'}</p>
                      ) : (
                        <div>
                          {upcomingBookings.map((b, i) => renderRow(b, i, i === upcomingBookings.length - 1))}
                        </div>
                      )}
                    </section>

                    {/* ── History ── */}
                    <section id="history-section" className="bg-white rounded-2xl border border-gray-200 p-6 scroll-mt-6">
                      <header className="flex items-center justify-between mb-5">
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{locale === 'fr' ? 'Historique' : 'History'}</h2>
                          <span className="text-sm text-gray-400 tabular-nums">{historyBookings.length}</span>
                        </div>
                        <SessionDotLegend />
                      </header>
                      {historyBookings.length === 0 ? (
                        <p className="text-sm text-gray-400">{locale === 'fr' ? 'Aucun rendez-vous passé' : 'No past appointments'}</p>
                      ) : (
                        <div>
                          {historyBookings.map((b, i) => renderRow(b, i, i === historyBookings.length - 1))}
                        </div>
                      )}
                    </section>
                  </div>
                )
              })()}
            </>
          )}
          </>
          )}

          {/* Settings Tab Content */}
          {mainTab === 'settings' && (
            <div className="space-y-6">
              {/* Settings sub-tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {([
                  { key: 'availability' as const, label: locale === 'fr' ? 'Disponibilités' : 'Availability', icon: Calendar },
                  { key: 'sessions' as const, label: locale === 'fr' ? 'Séances' : 'Sessions', icon: Clock },
                  { key: 'preferences' as const, label: locale === 'fr' ? 'Préférences' : 'Preferences', icon: SlidersHorizontal },
                  { key: 'embed' as const, label: locale === 'fr' ? 'Intégrer' : 'Embed', icon: Code2 },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSettingsTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                      settingsTab === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>


              {/* ─── Sessions tab ─── */}
              {settingsTab === 'sessions' && (<>
              {/* Session Types — only for native booking */}
              {!bookingSettings?.external_booking_url && (
              <Card id="session-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    {locale === 'fr' ? 'Types de séance' : 'Session Types'}
                    <TutorialVideo
                      url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Personnaliser%20les%20noms%20de%20vos%20seances.mov"
                      title={locale === 'fr' ? 'Personnaliser les noms de vos séances' : 'Customize your session type names'}
                    />
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Configurez les types de séances que vous proposez et leur durée' : 'Configure the types of sessions you offer and their durations'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Currency selector */}
                  <div className="flex items-center justify-end gap-3 pb-3 border-b border-gray-100">
                    <label className="text-sm text-gray-600 font-medium">{locale === 'fr' ? 'Devise' : 'Currency'}</label>
                    {(() => {
                      const CURRENCIES = [
                        { code: 'EUR', label: 'EUR (€)' },
                        { code: 'USD', label: 'USD ($)' },
                        { code: 'GBP', label: 'GBP (£)' },
                        { code: 'CHF', label: 'CHF' },
                        { code: 'CAD', label: 'CAD (C$)' },
                        { code: 'AUD', label: 'AUD (A$)' },
                        { code: 'MAD', label: 'MAD' },
                        { code: 'XOF', label: 'XOF (CFA)' },
                        { code: 'XAF', label: 'XAF (CFA)' },
                        { code: 'TND', label: 'TND' },
                        { code: 'DZD', label: 'DZD' },
                        { code: 'BRL', label: 'BRL (R$)' },
                        { code: 'INR', label: 'INR (₹)' },
                        { code: 'JPY', label: 'JPY (¥)' },
                        { code: 'CUSTOM', label: locale === 'fr' ? 'Autre...' : 'Other...' },
                      ]
                      const currentCurrency = bookingSettings?.currency || 'EUR'
                      const isCustom = !CURRENCIES.some(c => c.code === currentCurrency && c.code !== 'CUSTOM')
                      return (
                        <div className="flex items-center gap-2">
                          <select
                            value={isCustom ? 'CUSTOM' : currentCurrency}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === 'CUSTOM') {
                                setBookingSettings(prev => prev ? { ...prev, currency: '' } : prev)
                              } else {
                                setBookingSettings(prev => prev ? { ...prev, currency: val } : prev)
                              }
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                          >
                            {CURRENCIES.map(c => (
                              <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                          </select>
                          {(isCustom || currentCurrency === '') && (
                            <input
                              type="text"
                              maxLength={5}
                              value={currentCurrency}
                              onChange={(e) => setBookingSettings(prev => prev ? { ...prev, currency: e.target.value.toUpperCase() } : prev)}
                              className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                              placeholder="e.g. SEK"
                            />
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {(sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES).map((type, index) => {
                    const isLocked = type.id === 'initial' || type.id === 'follow_up'
                    const lockedNameFr: Record<string, string> = { initial: 'Consultation initiale', follow_up: 'Séance de suivi' }
                    return (
                    <div
                      key={type.id}
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{locale === 'fr' ? 'Nom' : 'Name'}</label>
                            <input
                              type="text"
                              value={isLocked && locale === 'fr' ? lockedNameFr[type.id] : type.name}
                              readOnly={isLocked}
                              onChange={(e) => {
                                if (isLocked) return
                                const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                                updated[index] = { ...updated[index], name: e.target.value }
                                setSessionTypes(updated)
                                setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                              }}
                              className={`w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                              placeholder="e.g. Initial Consultation"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{locale === 'fr' ? 'Durée (min)' : 'Duration (min)'}</label>
                            <select
                              value={type.duration}
                              onChange={(e) => {
                                const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                                updated[index] = { ...updated[index], duration: parseInt(e.target.value) }
                                setSessionTypes(updated)
                                setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                              }}
                              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                            >
                              {[15, 20, 25, 30, 45, 50, 60, 75, 90, 120].map((d) => (
                                <option key={d} value={d}>{d} min</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{locale === 'fr' ? `Prix (${bookingSettings?.currency || 'EUR'})` : `Price (${bookingSettings?.currency || 'EUR'})`}</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={type.price ?? ''}
                              onChange={(e) => {
                                const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                                updated[index] = { ...updated[index], price: e.target.value ? parseFloat(e.target.value) : null }
                                setSessionTypes(updated)
                                setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                              }}
                              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {!isLocked && (sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES).length > 1 && (
                          <button
                            onClick={() => {
                              const updated = (sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES).filter((_, i) => i !== index)
                              setSessionTypes(updated)
                              setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                          updated[index] = { ...updated[index], notesRequired: !type.notesRequired }
                          setSessionTypes(updated)
                          setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                        }}
                        className="flex items-center gap-2 cursor-pointer mt-2 pt-2 border-t border-gray-100 w-full"
                      >
                        <div className={`relative w-8 h-[18px] rounded-full transition-colors ${type.notesRequired ? 'bg-teal-500' : 'bg-gray-200'}`}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${type.notesRequired ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
                        </div>
                        <span className="text-xs text-gray-500">
                          {locale === 'fr' ? 'Notes obligatoires lors de la réservation' : 'Require notes when booking'}
                        </span>
                      </button>
                    </div>
                  )})}

                  <button
                    onClick={() => {
                      const current = sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES
                      const newType: SessionType = {
                        id: `custom_${Date.now()}`,
                        name: '',
                        duration: 60,
                        price: null,
                      }
                      const updated = [...current, newType]
                      setSessionTypes(updated)
                      setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                    }}
                    className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'fr' ? 'Ajouter un type de séance' : 'Add session type'}
                  </button>

                  <div className="pt-2">
                    <Button
                      onClick={handleSaveBookingSettings}
                      disabled={isSavingSettings}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {locale === 'fr' ? 'Enregistrer les types de séance' : 'Save Session Types'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Calendar event title template — controls the title that
                  appears on Google Calendar events created by Bloomsline. */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    {locale === 'fr' ? 'Titre des événements Google Agenda' : 'Google Calendar event title'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr'
                      ? "Choisissez le format du titre que vos rendez-vous affichent dans Google Agenda."
                      : 'Choose how your appointments are titled in Google Calendar.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const presets = [
                      {
                        id: 'default',
                        label: locale === 'fr' ? 'Par défaut' : 'Default',
                        template: '',
                      },
                      {
                        id: 'client_only',
                        label: locale === 'fr' ? 'Nom du client uniquement' : 'Client name only',
                        template: '{client}',
                      },
                      {
                        id: 'client_and_type',
                        label: locale === 'fr' ? 'Client + type de séance' : 'Client + session type',
                        template: '{client} — {session_type}',
                      },
                      {
                        id: 'session_with_client',
                        label: locale === 'fr' ? 'Séance avec le client' : 'Session with client',
                        template: locale === 'fr' ? 'Séance avec {client}' : 'Session with {client}',
                      },
                      {
                        id: 'client_and_practitioner',
                        label: locale === 'fr' ? 'Client & praticien' : 'Client & practitioner',
                        template: '{client} & {practitioner}',
                      },
                      {
                        id: 'practitioner_and_client',
                        label: locale === 'fr' ? 'Praticien & client' : 'Practitioner & client',
                        template: '{practitioner} & {client}',
                      },
                      {
                        id: 'client_practitioner_format',
                        label: locale === 'fr' ? 'Client, praticien + format' : 'Client, practitioner + format',
                        template: '{client} & {practitioner} — {session_format}',
                      },
                    ]
                    const currentTemplate = (bookingSettings?.calendar_event_title_template ?? '').trim()
                    const selectedPreset = presets.find(p => p.template === currentTemplate) ?? presets[0]
                    const practitioner = user?.full_name || (locale === 'fr' ? 'Praticien' : 'Practitioner')
                    const client = locale === 'fr' ? 'Sonia Lebari' : 'John Doe'
                    const sessionType = locale === 'fr' ? 'Suivi' : 'Follow-up'
                    const sessionFormat = locale === 'fr' ? '🏢 en personne' : '🏢 in person'
                    const renderPreview = (tmpl: string) => {
                      if (!tmpl) {
                        return locale === 'fr'
                          ? `Rendez-vous ${practitioner} <> ${client}`
                          : `Appointment ${practitioner} <> ${client}`
                      }
                      return tmpl
                        .replace(/\{practitioner(?:_name)?\}/gi, practitioner)
                        .replace(/\{client(?:_name)?\}/gi, client)
                        .replace(/\{session_type\}/gi, sessionType)
                        .replace(/\{session_format\}/gi, sessionFormat)
                    }
                    return (
                      <>
                        <select
                          value={selectedPreset.id}
                          onChange={(e) => {
                            const chosen = presets.find(p => p.id === e.target.value) ?? presets[0]
                            setBookingSettings((prev) => ({ ...(prev as any), calendar_event_title_template: chosen.template } as any))
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-300 outline-none bg-white"
                        >
                          {presets.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                        <div className="text-xs text-gray-500">
                          <p className="mb-1.5">
                            <span className="font-medium text-gray-700">{locale === 'fr' ? 'Aperçu : ' : 'Preview: '}</span>
                            <span className="font-mono text-gray-900">{renderPreview(selectedPreset.template)}</span>
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2">
                            {locale === 'fr'
                              ? "S'applique uniquement aux nouveaux rendez-vous. Les événements existants dans Google Agenda ne sont pas modifiés."
                              : 'Applies only to new appointments. Existing Google Calendar events are not modified.'}
                          </p>
                        </div>
                        <div className="pt-2">
                          <Button
                            onClick={handleSaveBookingSettings}
                            disabled={isSavingSettings}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                          >
                            {isSavingSettings ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {locale === 'fr' ? 'Enregistrer' : 'Save'}
                          </Button>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>

              </>)}

              {/* ─── Availability tab ─── */}
              {settingsTab === 'availability' && (<>
              {/* Booking Link at top */}
              {!bookingSettings?.external_booking_url && practitionerSlug && bookingSettings?.booking_page_enabled && (
                <Card className="border-gray-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LinkIcon className="w-4 h-4 text-gray-600" />
                      {locale === 'fr' ? 'Votre lien de réservation' : 'Your Booking Link'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white border rounded-lg px-4 py-2.5 font-mono text-sm text-gray-700 truncate">
                        bloomsline.com/practitioner/{practitionerSlug}/book
                      </div>
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`https://bloomsline.com/practitioner/${practitionerSlug}/book`); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}>
                        {linkCopied ? (<><Check className="w-4 h-4 mr-2 text-green-600" />{locale === 'fr' ? 'Copié !' : 'Copied!'}</>) : (<><Copy className="w-4 h-4 mr-2" />{locale === 'fr' ? 'Copier' : 'Copy'}</>)}
                      </Button>
                      <Link href={`/practitioner/${practitionerSlug}/book`} target="_blank">
                        <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />{locale === 'fr' ? 'Aperçu' : 'Preview'}</Button>
                      </Link>
                    </div>

                    {/* Public page language — independent from dashboard UI language */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {locale === 'fr' ? 'Langue de la page publique' : 'Public page language'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {locale === 'fr'
                            ? 'Indépendante de la langue de votre tableau de bord.'
                            : 'Independent from your dashboard UI language.'}
                        </p>
                      </div>
                      <select
                        value={bookingSettings?.booking_page_language ?? 'en'}
                        onChange={async (e) => {
                          const next = e.target.value as 'en' | 'fr'
                          const prev = bookingSettings?.booking_page_language ?? 'en'
                          setBookingSettings((s) => ({ ...s!, booking_page_language: next }))
                          if (!userId) return
                          const saved = await saveBookingSettings({
                            ...(bookingSettings as any),
                            user_id: userId,
                            booking_page_language: next,
                          })
                          if (saved) {
                            setBookingSettings(saved)
                            toast.success(locale === 'fr' ? 'Langue mise à jour' : 'Language updated')
                          } else {
                            setBookingSettings((s) => ({ ...s!, booking_page_language: prev }))
                            toast.error(locale === 'fr' ? 'Échec de la mise à jour' : 'Failed to update')
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Availability Schedule — only for native booking */}
              {!bookingSettings?.external_booking_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {locale === 'fr' ? 'Horaires de disponibilité' : 'Availability Schedule'}
                    <TutorialVideo
                      url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Personnaliser%20vos%20horaires%20de%20pratique.mov"
                      title={locale === 'fr' ? 'Personnaliser vos horaires de pratique' : 'Customize your practice hours'}
                    />
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Définissez vos disponibilités hebdomadaires pour les réservations' : 'Set your weekly availability for client bookings'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Fuseau horaire' : 'Timezone'}
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    >
                      <option value="Pacific/Midway">GMT-11 — Midway</option>
                      <option value="Pacific/Honolulu">GMT-10 — Honolulu</option>
                      <option value="America/Anchorage">GMT-9 — Alaska</option>
                      <option value="America/Los_Angeles">GMT-8 — Los Angeles</option>
                      <option value="America/Denver">GMT-7 — Denver</option>
                      <option value="America/Chicago">GMT-6 — Chicago</option>
                      <option value="America/New_York">GMT-5 — New York</option>
                      <option value="America/Sao_Paulo">GMT-3 — São Paulo</option>
                      <option value="Atlantic/Cape_Verde">GMT-1 — Cap-Vert</option>
                      <option value="Europe/London">GMT+0 — London</option>
                      <option value="Europe/Paris">GMT+1 — Paris</option>
                      <option value="Europe/Berlin">GMT+1 — Berlin</option>
                      <option value="Europe/Bucharest">GMT+2 — Bucharest</option>
                      <option value="Africa/Nairobi">GMT+3 — Nairobi</option>
                      <option value="Asia/Dubai">GMT+4 — Dubai</option>
                      <option value="Asia/Kolkata">GMT+5:30 — India</option>
                      <option value="Asia/Bangkok">GMT+7 — Bangkok</option>
                      <option value="Asia/Shanghai">GMT+8 — Shanghai</option>
                      <option value="Asia/Tokyo">GMT+9 — Tokyo</option>
                      <option value="Australia/Sydney">GMT+10 — Sydney</option>
                      <option value="Pacific/Auckland">GMT+12 — Auckland</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day) => {
                      const slots = getSlotsForDay(day)
                      return (
                        <div key={day} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{DAY_LABELS[day]?.[locale as 'en' | 'fr'] || day}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addAvailabilitySlot(day)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {locale === 'fr' ? 'Ajouter un créneau' : 'Add slot'}
                            </Button>
                          </div>
                          {slots.length === 0 ? (
                            <p className="text-sm text-gray-500">Unavailable</p>
                          ) : (
                            <div className="space-y-2">
                              {slots.map((slot) => {
                                return (
                                  <div
                                    key={slot.index}
                                    className="flex items-center gap-3"
                                  >
                                    <TimeSelect
                                      value={slot.startTime}
                                      onChange={(v) => updateAvailabilitySlot(slot.index, 'startTime', v)}
                                    />
                                    <span className="text-gray-400 text-sm">{locale === 'fr' ? 'à' : 'to'}</span>
                                    <TimeSelect
                                      value={slot.endTime}
                                      onChange={(v) => updateAvailabilitySlot(slot.index, 'endTime', v)}
                                    />
                                    <select
                                      value={slot.sessionFormat || 'both'}
                                      onChange={(e) => updateAvailabilitySlot(slot.index, 'sessionFormat', e.target.value)}
                                      className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600"
                                    >
                                      <option value="both">{locale === 'fr' ? 'Les deux' : 'Both'}</option>
                                      <option value="in_person">{locale === 'fr' ? 'En personne' : 'In person'}</option>
                                      <option value="video">{locale === 'fr' ? 'Vidéo' : 'Video'}</option>
                                    </select>
                                    <button
                                      onClick={() => removeAvailabilitySlot(slot.index)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <Button onClick={handleSaveAvailability} disabled={isSavingAvailability}>
                    {isSavingAvailability ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {locale === 'fr' ? 'Enregistrer les disponibilités' : 'Save Availability'}
                  </Button>
                </CardContent>
              </Card>
              )}

              </>)}

              {/* ─── Preferences tab ─── */}
              {settingsTab === 'preferences' && (<>
              {/* SMS confirmation toggle — when on, the client gets a text on
                  booking confirm / reschedule / cancel (if a mobile is on file). */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-gray-600" />
                    {locale === 'fr' ? 'SMS de confirmation' : 'SMS confirmations'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr'
                      ? 'Envoyez un SMS au patient à la confirmation, au report ou à l’annulation d’une séance (si un numéro de mobile est renseigné).'
                      : 'Text the patient when a session is confirmed, rescheduled or cancelled (when a mobile number is on file).'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const enabled = (bookingSettings as any)?.sms_on_booking ?? false
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                          <p className="font-medium">
                            {locale === 'fr' ? 'Envoyer un SMS de confirmation' : 'Send an SMS confirmation'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {locale === 'fr'
                              ? 'Assurez-vous d’avoir le consentement du patient pour recevoir des SMS.'
                              : 'Make sure you have the patient’s consent to receive SMS.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBookingSettings((prev) => ({ ...(prev as any), sms_on_booking: !enabled } as any))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-teal-600' : 'bg-gray-200'}`}
                          aria-pressed={enabled}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Calendar email reminder toggle — controls whether Google
                  Calendar fires its own 24h-before email reminder for
                  events we create. Independent of Bloomsline's bell +
                  email notifications. */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    {locale === 'fr' ? 'Rappel Google Agenda' : 'Google Calendar reminder'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr'
                      ? "Google peut vous envoyer un e-mail 24h avant chaque rendez-vous, indépendamment des notifications Bloomsline."
                      : 'Google can send you an email 24h before each appointment, independently of Bloomsline notifications.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const enabled = (bookingSettings as any)?.calendar_email_reminder_enabled ?? false
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                          <p className="font-medium">
                            {locale === 'fr' ? 'Envoyer un e-mail de rappel 24h avant' : 'Send an email reminder 24h before'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {locale === 'fr'
                              ? "Le rappel popup 30 minutes avant est toujours actif. Ce changement s'applique uniquement aux nouveaux rendez-vous."
                              : 'The 30-min popup reminder is always on. This change applies only to new appointments.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBookingSettings((prev) => ({ ...(prev as any), calendar_email_reminder_enabled: !enabled } as any))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-teal-600' : 'bg-gray-200'}`}
                          aria-pressed={enabled}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    )
                  })()}
                  <div>
                    <Button
                      onClick={handleSaveBookingSettings}
                      disabled={isSavingSettings}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {locale === 'fr' ? 'Enregistrer' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Booking setup: enable/disable, external, approval */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'fr' ? 'Configuration de la réservation' : 'Booking Setup'}</CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Activez ou désactivez la prise de rendez-vous en ligne' : 'Enable or disable online appointment booking'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{locale === 'fr' ? 'Activer la page de réservation' : 'Enable Booking Page'}</p>
                      <p className="text-sm text-gray-500">
                        {locale === 'fr' ? 'Permettre aux clients de prendre rendez-vous via votre profil public' : 'Allow clients to book appointments through your public profile'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const turningOn = !bookingSettings?.booking_page_enabled
                        const externalIsActive = !!bookingSettings?.external_booking_url
                        if (turningOn && externalIsActive) {
                          if (!window.confirm(locale === 'fr' ? 'Cela désactivera le système de réservation externe. Continuer ?' : 'This will disable the external booking system. Continue?')) return
                          setBookingSettings((prev) => ({ ...prev!, booking_page_enabled: true, external_booking_url: null }))
                        } else {
                          setBookingSettings((prev) => ({ ...prev!, booking_page_enabled: !prev?.booking_page_enabled }))
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingSettings?.booking_page_enabled ? 'bg-teal-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings?.booking_page_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-3 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{locale === 'fr' ? 'Utiliser un système de réservation externe' : 'Use external booking system'}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Rediriger les clients vers Calendly, Doctolib ou un autre outil' : 'Redirect clients to Calendly, Doctolib, or another booking tool'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const isCurrentlyOff = bookingSettings?.external_booking_url === null || bookingSettings?.external_booking_url === undefined
                          const nativeIsActive = !!bookingSettings?.booking_page_enabled
                          if (isCurrentlyOff && nativeIsActive) {
                            if (!window.confirm(locale === 'fr' ? 'Cela désactivera la page de réservation intégrée. Continuer ?' : 'This will disable the built-in booking page. Continue?')) return
                            setBookingSettings((prev) => ({ ...prev!, booking_page_enabled: false, external_booking_url: '' }))
                          } else {
                            setBookingSettings((prev) => ({ ...prev!, external_booking_url: prev?.external_booking_url !== null && prev?.external_booking_url !== undefined ? null : '' }))
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingSettings?.external_booking_url !== null && bookingSettings?.external_booking_url !== undefined ? 'bg-teal-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings?.external_booking_url !== null && bookingSettings?.external_booking_url !== undefined ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {bookingSettings?.external_booking_url !== null && bookingSettings?.external_booking_url !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booking URL</label>
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                          <input type="url" value={bookingSettings.external_booking_url || ''} onChange={(e) => setBookingSettings((prev) => ({ ...prev!, external_booking_url: e.target.value }))} placeholder="https://calendly.com/your-link" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {locale === 'fr' ? 'Le bouton « Réserver » sur votre profil public ouvrira ce lien.' : 'The "Book" button on your public profile will open this URL.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {!(bookingSettings?.external_booking_url) && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{locale === 'fr' ? 'Approbation requise' : 'Require Approval'}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Approuver manuellement les demandes de rendez-vous avant confirmation' : 'Manually approve booking requests before they are confirmed'}
                        </p>
                      </div>
                      <button
                        onClick={() => setBookingSettings((prev) => ({ ...prev!, require_approval: !prev?.require_approval }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingSettings?.require_approval ? 'bg-teal-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings?.require_approval ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )}

                  <Button type="button" onClick={() => handleSaveBookingSettings()} disabled={isSavingSettings}>
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {locale === 'fr' ? 'Enregistrer' : 'Save'}
                  </Button>
                </CardContent>
              </Card>

              {/* Calendar Integration */}
              {!bookingSettings?.external_booking_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {locale === 'fr' ? 'Intégration Calendrier' : 'Calendar Integration'}
                    <TutorialVideo
                      url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Comment%20synchroniser%20son%20Google%20Agenda%20avec%20Bloomsline.mp4"
                      title={locale === 'fr' ? 'Comment synchroniser son Google Agenda avec Bloomsline' : 'How to sync Google Calendar with Bloomsline'}
                    />
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Connectez votre Google Calendar pour synchroniser les rendez-vous et afficher vos disponibilités' : 'Connect your Google Calendar to sync appointments and show real-time availability'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSettings ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'fr' ? 'Chargement...' : 'Loading...'}
                    </div>
                  ) : calendarConnection ? (
                    <div>
                      {(calendarConnection as any).sync_status === 'broken' && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">{locale === 'fr' ? 'Connexion expirée' : 'Connection expired'}</p>
                            <p className="text-xs text-red-600">{locale === 'fr' ? 'Veuillez reconnecter votre Google Calendar.' : 'Please reconnect your Google Calendar.'}</p>
                          </div>
                          <Button size="sm" onClick={async () => { await handleDisconnect(); handleConnectGoogle() }} className="bg-red-600 hover:bg-red-700 text-white text-xs">
                            {locale === 'fr' ? 'Reconnecter' : 'Reconnect'}
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(calendarConnection as any).sync_status === 'broken' ? 'bg-red-100' : 'bg-green-100'}`}>
                            {(calendarConnection as any).sync_status === 'broken' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Check className="w-5 h-5 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-medium">
                              {(calendarConnection as any).sync_status === 'broken'
                                ? (locale === 'fr' ? 'Google Calendar — connexion perdue' : 'Google Calendar — connection lost')
                                : (locale === 'fr' ? 'Google Calendar connecté' : 'Google Calendar Connected')}
                            </p>
                            <p className="text-sm text-gray-500">{calendarConnection.provider_email}</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={handleDisconnect} disabled={isDisconnecting}>
                          {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'fr' ? 'Déconnecter' : 'Disconnect')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleConnectGoogle} disabled={isConnecting}>
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                      {locale === 'fr' ? 'Connecter Google Calendar' : 'Connect Google Calendar'}
                    </Button>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Scheduling rules */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'fr' ? 'Règles de planification' : 'Scheduling Rules'}</CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Délais, tampons et intervalles pour vos créneaux' : 'Timing, buffers, and intervals for your time slots'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!(bookingSettings?.external_booking_url) && (
                    <>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Délai avant' : 'Buffer before'}
                      </label>
                      <select
                        value={bookingSettings?.buffer_before || 0}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            buffer_before: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      >
                        <option value={0}>{locale === 'fr' ? 'Aucun' : 'None'}</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Délai après' : 'Buffer after'}
                      </label>
                      <select
                        value={bookingSettings?.buffer_after || 0}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            buffer_after: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      >
                        <option value={0}>{locale === 'fr' ? 'Aucun' : 'None'}</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Préavis minimum (heures)' : 'Minimum notice (hours)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={bookingSettings?.min_notice_hours ?? ''}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            min_notice_hours: e.target.value === '' ? 0 : parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Réservation max à l\'avance (jours)' : 'Max advance booking (days)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={bookingSettings?.max_advance_days ?? ''}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            max_advance_days: e.target.value === '' ? 0 : parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Slot alignment */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {locale === 'fr' ? 'Intervalles de créneaux' : 'Slot Intervals'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {locale === 'fr' ? 'Contrôlez à quelle fréquence les créneaux sont proposés aux patients' : 'Control how frequently time slots are offered to patients'}
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.hour_aligned_slots ? 'bg-teal-600' : 'bg-gray-300'}`}
                        onClick={() =>
                          setBookingSettings((prev: any) => ({
                            ...prev!,
                            hour_aligned_slots: !prev?.hour_aligned_slots,
                          }))
                        }
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.hour_aligned_slots ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <div>
                        <span className="text-sm text-gray-700">
                          {locale === 'fr' ? 'N\'accepter les séances qu\'aux heures pleines' : 'Only offer appointments on the hour'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {locale === 'fr' ? 'Ex : 9:00, 10:00, 11:00 — jamais 9:30 ou 10:30.' : 'e.g. 9:00, 10:00, 11:00 — never 9:30 or 10:30.'}
                        </p>
                      </div>
                    </label>
                  </div>
                    </>
                  )}

                  {/* Patient modification settings */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {locale === 'fr' ? 'Modifications par le patient' : 'Patient modifications'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {locale === 'fr' ? 'Autorisez vos patients à gérer leurs rendez-vous eux-mêmes' : 'Let your patients manage their own appointments'}
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.allow_patient_book !== false ? 'bg-teal-600' : 'bg-gray-300'}`}
                          onClick={() =>
                            setBookingSettings((prev: any) => ({
                              ...prev!,
                              allow_patient_book: prev?.allow_patient_book === false ? true : false,
                            }))
                          }
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.allow_patient_book !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Autoriser le patient à réserver' : 'Allow patient to book'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === 'fr' ? 'Le patient peut réserver une séance depuis son application' : 'Patient can book a session from their app'}
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.allow_patient_cancel ? 'bg-teal-600' : 'bg-gray-300'}`}
                          onClick={() =>
                            setBookingSettings((prev: any) => ({
                              ...prev!,
                              allow_patient_cancel: !prev?.allow_patient_cancel,
                            }))
                          }
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.allow_patient_cancel ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Autoriser le patient à annuler' : 'Allow patient to cancel'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === 'fr' ? 'Le patient peut annuler depuis son espace' : 'Patient can cancel from their booking page'}
                          </p>
                        </div>
                      </label>
                      {/* Late-cancellation policy — only shown when patient
                          cancellation is allowed. 0 = no policy (today's
                          behavior); >0 hours = patient sees a warning in
                          the cancel popup and the booking is flagged as
                          still owed. */}
                      {(bookingSettings as any)?.allow_patient_cancel && (
                        <div className="pl-13">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'fr' ? 'Facturer une annulation tardive si annulée dans les' : 'Charge for late cancellation if cancelled within'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={168}
                              step={1}
                              // Stored value 0 renders as empty so the practitioner can
                              // backspace and type a new number; on blur we re-normalize
                              // anything blank/invalid back to 0.
                              value={(bookingSettings as any)?.late_cancellation_hours ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                if (v === '') {
                                  setBookingSettings((prev: any) => ({ ...prev!, late_cancellation_hours: null }))
                                  return
                                }
                                const raw = parseInt(v, 10)
                                if (Number.isFinite(raw)) {
                                  setBookingSettings((prev: any) => ({
                                    ...prev!,
                                    late_cancellation_hours: Math.max(0, Math.min(168, raw)),
                                  }))
                                }
                              }}
                              onBlur={() => {
                                setBookingSettings((prev: any) => {
                                  const v = prev?.late_cancellation_hours
                                  if (v == null || !Number.isFinite(v)) {
                                    return { ...prev!, late_cancellation_hours: 0 }
                                  }
                                  return prev
                                })
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <span className="text-sm text-gray-600">{locale === 'fr' ? 'heures avant la séance' : 'hours before the session'}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {locale === 'fr'
                              ? '0 = pas de politique. Sinon, le patient verra un avertissement et la séance restera marquée impayée.'
                              : '0 = no policy. Otherwise the patient sees a warning and the session is marked unpaid for follow-up.'}
                          </p>
                        </div>
                      )}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.allow_patient_reschedule ? 'bg-teal-600' : 'bg-gray-300'}`}
                          onClick={() =>
                            setBookingSettings((prev: any) => ({
                              ...prev!,
                              allow_patient_reschedule: !prev?.allow_patient_reschedule,
                            }))
                          }
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.allow_patient_reschedule ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Autoriser le patient à reprogrammer' : 'Allow patient to reschedule'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === 'fr' ? 'Le patient peut choisir un nouveau créneau' : 'Patient can pick a new time slot'}
                          </p>
                        </div>
                      </label>
                      {((bookingSettings as any)?.allow_patient_cancel || (bookingSettings as any)?.allow_patient_reschedule) && (
                        <div className="pl-13">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'fr' ? 'Délai minimum pour modifications' : 'Minimum notice for changes'}
                          </label>
                          <select
                            value={(bookingSettings as any)?.modification_notice_hours ?? 48}
                            onChange={(e) =>
                              setBookingSettings((prev: any) => ({
                                ...prev!,
                                modification_notice_hours: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value={12}>12 {locale === 'fr' ? 'heures' : 'hours'}</option>
                            <option value={24}>24 {locale === 'fr' ? 'heures' : 'hours'}</option>
                            <option value={48}>48 {locale === 'fr' ? 'heures' : 'hours'}</option>
                            <option value={72}>72 {locale === 'fr' ? 'heures' : 'hours'}</option>
                          </select>
                        </div>
                      )}
                      {/* Patient app visibility — payment status badge.
                          Default true (today's behavior). When off, the
                          mobile session card hides the Paid / Unpaid
                          tag entirely. */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
                            ((bookingSettings as any)?.show_payment_to_patient ?? false) ? 'bg-teal-600' : 'bg-gray-300'
                          }`}
                          onClick={() =>
                            setBookingSettings((prev: any) => ({
                              ...prev!,
                              show_payment_to_patient: !((prev as any)?.show_payment_to_patient ?? true),
                            }))
                          }
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            ((bookingSettings as any)?.show_payment_to_patient ?? false) ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Afficher le statut de paiement au patient' : 'Show payment status to patient'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === 'fr'
                              ? "Quand activé, le patient voit une étiquette « Payé » ou « Non payé » sur chaque séance dans son application."
                              : "When on, the patient sees a 'Paid' or 'Unpaid' tag on each session in their mobile app."}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="mt-6"
                    onClick={() => {
                      console.log('[SAVE BUTTON CLICKED]')
                      handleSaveBookingSettings()
                    }}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {locale === 'fr' ? 'Enregistrer' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
              </>)}

              {/* ─── Embed tab ─── */}
              {settingsTab === 'embed' && (
                bookingSettings?.external_booking_url || !practitionerSlug || !bookingSettings?.booking_page_enabled ? (
                  <Card className="border-gray-200 bg-white">
                    <CardContent className="py-8 text-center">
                      <Code2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {locale === 'fr'
                          ? 'L\'intégration n\'est disponible que lorsque la page de réservation Bloomsline est activée.'
                          : 'Embedding is only available when the Bloomsline booking page is enabled.'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {locale === 'fr'
                          ? 'Activez la page de réservation dans Préférences pour générer un code à intégrer.'
                          : 'Enable the booking page in Preferences to generate an embed snippet.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <EmbedSnippetCard slug={practitionerSlug} locale={locale as 'en' | 'fr' | 'es'} />
                )
              )}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelConfirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setCancelConfirmBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Annuler ce rendez-vous ?' : 'Cancel this booking?'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {cancelConfirmBooking.client_name} — {new Date(cancelConfirmBooking.start_time).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              {locale === 'fr' ? 'Cette action est irréversible. Le patient sera notifié.' : 'This action cannot be undone. The patient will be notified.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirmBooking(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Retour' : 'Back'}
              </button>
              <button
                onClick={async () => {
                  const id = cancelConfirmBooking.id
                  setCancelConfirmBooking(null)
                  await handleReject(id)
                }}
                disabled={processingId === cancelConfirmBooking.id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {processingId === cancelConfirmBooking.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {locale === 'fr' ? 'Annuler le rendez-vous' : 'Cancel booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteConfirmBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Supprimer ce rendez-vous ?' : 'Delete this booking?'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {deleteConfirmBooking.client_name} — {new Date(deleteConfirmBooking.start_time).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              {locale === 'fr' ? 'Cette action est irréversible. Le rendez-vous sera définitivement supprimé.' : 'This action cannot be undone. The booking will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmBooking(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Retour' : 'Back'}
              </button>
              <button
                onClick={() => handleDeleteBooking(deleteConfirmBooking.id)}
                disabled={processingId === deleteConfirmBooking.id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {processingId === deleteConfirmBooking.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal — reuses ScheduleSessionModal in reschedule mode */}
      <ScheduleSessionModal
        isOpen={!!rescheduleBooking}
        onClose={() => setRescheduleBooking(null)}
        onSuccess={() => {
          setRescheduleBooking(null)
          // Refresh bookings
          const sb = createClient()
          sb.from('bookings').select('*').eq('practitioner_id', userId).order('start_time', { ascending: true }).then(({ data }: { data: any }) => {
            if (data) setBookings(data)
          })
        }}
        rescheduleBooking={rescheduleBooking ? {
          id: rescheduleBooking.id,
          practitioner_id: rescheduleBooking.practitioner_id,
          member_id: rescheduleBooking.member_id,
          client_name: rescheduleBooking.client_name,
          client_email: rescheduleBooking.client_email,
          session_type: rescheduleBooking.session_type,
          session_format: rescheduleBooking.session_format,
          start_time: rescheduleBooking.start_time,
          end_time: rescheduleBooking.end_time,
        } : null}
      />

      {/* Calendar Slot Booking Modal */}
      <ScheduleSessionModal
        isOpen={!!calendarSlotBooking}
        onClose={() => setCalendarSlotBooking(null)}
        onSuccess={() => {
          setCalendarSlotBooking(null)
          const sb = createClient()
          sb.from('bookings').select('*').eq('practitioner_id', userId).order('start_time', { ascending: true }).then(({ data }: { data: any }) => {
            if (data) setBookings(data)
          })
        }}
        preselectedDate={calendarSlotBooking?.date}
        preselectedTime={calendarSlotBooking?.time}
        preselectedOutsideHours={calendarSlotBooking?.outsideHours}
      />

      {/* Settings Saved Confirmation Modal */}
      {showSettingsSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowSettingsSavedModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Paramètres enregistrés' : 'Settings Saved'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr' ? 'Vos types de séance ont été mis à jour.' : 'Your session types have been updated.'}
            </p>
            <button
              onClick={() => setShowSettingsSavedModal(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {locale === 'fr' ? 'Compris' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Series detail drawer — opens from the "View all sessions" button.
          Bookings carry the same series_* columns as sessions, so we just
          map the field shape (start_time → scheduled_at, status confirmed
          → scheduled) before handing them to the shared drawer. */}
      <SeriesDetailDrawer
        isOpen={!!viewingSeriesId}
        onClose={() => setViewingSeriesId(null)}
        sessions={(() => {
          if (!viewingSeriesId) return []
          return bookings
            .filter(b => b.series_id === viewingSeriesId)
            .map(b => ({
              id: b.id,
              member_id: b.member_id || '',
              practitioner_id: b.practitioner_id,
              scheduled_at: b.start_time,
              duration_minutes: Math.round((parseISO(b.end_time).getTime() - parseISO(b.start_time).getTime()) / 60000),
              status: (b.status === 'confirmed' ? 'scheduled' : b.status) as any,
              session_type: b.session_type as any,
              session_format: b.session_format as any,
              series_id: b.series_id,
              series_position: b.series_position,
              series_total: b.series_total,
              recurrence_rule: b.recurrence_rule,
              created_at: b.created_at,
              updated_at: b.updated_at,
              payment_status: b.payment_status,
            }) as any)
        })()}
        memberName={(() => {
          const first = bookings.find(b => b.series_id === viewingSeriesId)
          if (!first) return ''
          return (first.member_id && memberNames.get(first.member_id)) || first.client_name || ''
        })()}
        locale={locale as 'en' | 'fr' | 'es'}
      />

      {/* ─── Close session popup — single dialog. Top asks Show vs
          No-show, then reveals the matching branch. Mirrors SessionsTab. ─── */}
      {closePopupBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={closeClosePopupBooking}
        >
          <div
            // Widen the popup when the inline note editor is open so the
            // textarea isn't squeezed.
            className={`bg-white rounded-2xl shadow-xl w-full p-6 max-h-[90vh] overflow-y-auto transition-[max-width] duration-200 ${
              closePopupOutcome === 'show' && showBNoteAction === 'take'
                ? 'max-w-2xl'
                : 'max-w-md'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {(() => {
                  const editing =
                    closePopupBooking.status === 'completed' ||
                    closePopupBooking.status === 'cancelled' ||
                    closePopupBooking.status === 'no_show'
                  return locale === 'fr'
                    ? editing ? 'Modifier la clôture' : 'Clôturer la séance'
                    : editing ? 'Edit close' : 'Close session'
                })()}
              </h3>
              <button
                type="button"
                onClick={closeClosePopupBooking}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Outcome — Show or No-show. Required first choice. */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Comment s\'est passée la séance ?' : 'How did this session go?'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClosePopupOutcome('show')}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition ${
                    closePopupOutcome === 'show'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {locale === 'fr' ? 'Présent' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={() => setClosePopupOutcome('no_show')}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition ${
                    closePopupOutcome === 'no_show'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  {locale === 'fr' ? 'Absent' : 'No show'}
                </button>
              </div>
            </div>

            {/* ─── Show branch ─── */}
            {closePopupOutcome === 'show' && (
              <>
                {/* Section 1 — Payment */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    {locale === 'fr' ? 'Paiement' : 'Payment'}
                  </p>
                  <div className="flex gap-2">
                    {(['paid', 'unpaid'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setShowBPayment(opt)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          showBPayment === opt
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt === 'paid'
                          ? (locale === 'fr' ? 'Payé' : 'Paid')
                          : (locale === 'fr' ? 'Non payé' : 'Unpaid')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2 — Note. Uses RichTextEditor to match the
                    SessionsTab Close popup. memberId may be null for
                    guest bookings; pass empty string so the editor still
                    renders (member-specific features just no-op). */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    {locale === 'fr' ? 'Note de séance' : 'Session note'}
                  </p>
                  {showBNoteAction === 'has' ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>{locale === 'fr' ? 'Note déjà ajoutée' : 'Note already added'}</span>
                    </div>
                  ) : showBNoteAction === 'take' ? (
                    <div>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <RichTextEditor
                          value={showBNoteDraft}
                          onChange={setShowBNoteDraft}
                          placeholder={locale === 'fr' ? 'Rédigez votre note de séance...' : 'Write your session note...'}
                          memberId={closePopupBooking?.member_id || ''}
                          locale={locale}
                          autoFocus
                          memberName={closePopupBooking?.client_name?.split(' ')[0]}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowBNoteAction('skip'); setShowBNoteDraft('') }}
                        className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                      >
                        {locale === 'fr' ? '← Sans note' : '← No note'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBNoteAction('take')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <PenLine className="w-4 h-4 text-gray-500" />
                        {locale === 'fr' ? 'Prendre des notes' : 'Take notes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBNoteAction('skip')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 border border-gray-200 text-gray-600"
                      >
                        {locale === 'fr' ? 'Aucune note' : 'No notes'}
                      </button>
                    </div>
                  )}
                </div>

              </>
            )}

            {/* ─── No-show branch ─── */}
            {closePopupOutcome === 'no_show' && (
              <>
                {/* Section 1 — Payment */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    {locale === 'fr' ? 'Paiement' : 'Payment'}
                  </p>
                  <div className="flex gap-2">
                    {(['paid', 'unpaid'] as const).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNoShowBPayment(opt)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          noShowBPayment === opt
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt === 'paid'
                          ? (locale === 'fr' ? 'Payé' : 'Paid')
                          : (locale === 'fr' ? 'Non payé' : 'Unpaid')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2 — Reason + comments */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    {locale === 'fr' ? 'Raison' : 'Reason'}
                  </p>
                  <select
                    value={noShowBReason}
                    onChange={(e) => setNoShowBReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="" disabled>
                      {locale === 'fr' ? 'Sélectionner une raison…' : 'Select a reason…'}
                    </option>
                    {([
                      ['no_communication', locale === 'fr' ? 'Aucune communication' : 'No communication'],
                      ['client_request', locale === 'fr' ? 'Demande du patient' : 'Client request'],
                      ['late_cancellation', locale === 'fr' ? 'Annulation tardive' : 'Late cancellation'],
                      ['illness', locale === 'fr' ? 'Maladie' : 'Illness'],
                      ['forgot', locale === 'fr' ? 'Patient a oublié' : 'Client forgot'],
                      ['emergency', locale === 'fr' ? 'Urgence' : 'Emergency'],
                      ['technical_issue', locale === 'fr' ? 'Problème technique' : 'Technical issue'],
                      ['scheduling_conflict', locale === 'fr' ? 'Conflit d\'agenda' : 'Scheduling conflict'],
                      ['practitioner_unavailable', locale === 'fr' ? 'Praticien indisponible' : 'Practitioner unavailable'],
                      ['other', locale === 'fr' ? 'Autre' : 'Other'],
                    ] as const).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <textarea
                    value={noShowBComments}
                    onChange={(e) => setNoShowBComments(e.target.value)}
                    placeholder={locale === 'fr' ? 'Commentaires supplémentaires (optionnel)' : 'Additional comments (optional)'}
                    rows={3}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closeClosePopupBooking} disabled={closePopupSaving}>
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                onClick={confirmClosePopupBooking}
                disabled={
                  closePopupSaving ||
                  !closePopupOutcome ||
                  (closePopupOutcome === 'show'   && (showBPayment === null || showBNoteAction === null)) ||
                  (closePopupOutcome === 'no_show' && (noShowBPayment === null || !noShowBReason))
                }
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {closePopupSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : (locale === 'fr' ? 'Confirmer' : 'Confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Schedule-next follow-up — appears after a Show close ─── */}
      {scheduleNextPromptOpenB && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setScheduleNextPromptOpenB(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Planifier la prochaine séance ?' : 'Schedule next session?'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {locale === 'fr'
                ? 'Voulez-vous planifier un nouveau rendez-vous maintenant ?'
                : 'Would you like to schedule a new booking now?'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setScheduleNextPromptOpenB(false)}
              >
                {locale === 'fr' ? 'Non' : 'No'}
              </Button>
              <Button
                onClick={() => { setScheduleNextPromptOpenB(false); setShowScheduleModal(true) }}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {locale === 'fr' ? 'Oui, planifier' : 'Yes, schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule-next modal — opens after the prompt's Yes. */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          setShowScheduleModal(false)
          fetchBookings()
        }}
      />

      {/* Availability Saved Confirmation Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowSavedModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Disponibilités enregistrées' : 'Availability Saved'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr' ? 'Vos horaires ont été mis à jour avec succès.' : 'Your schedule has been updated successfully.'}
            </p>
            <button
              onClick={() => setShowSavedModal(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {locale === 'fr' ? 'Compris' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
