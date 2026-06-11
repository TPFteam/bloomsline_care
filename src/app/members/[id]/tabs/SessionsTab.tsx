'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Calendar,
  Video,
  Phone,
  User,
  Check,
  X,
  FileText,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  CalendarCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Target,
  Loader2,
  MoreHorizontal,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Ban,
  StickyNote,
  PenLine,
  Building2,
} from 'lucide-react'
import { format, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isBefore, isAfter, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { TimeSelect } from '@/components/ui/time-select'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { useSearchParams } from 'next/navigation'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'
import { toast } from 'sonner'
import { emitBookingsChanged, useBookingsChanged } from '@/lib/bookings-events'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { EditSessionModal } from '@/components/EditSessionModal'
import { SeriesDetailDrawer } from '@/components/SeriesDetailDrawer'
import { MarkdownRenderer } from '@/components/notes/MarkdownRenderer'
import { PaymentBadge } from '@/components/ui/payment-badge'
import { SessionDotLegend, StatusDot, type StatusKey } from '@/components/SessionDotLegend'
import { SessionFilters, inDateRange, type DateRangePreset } from '@/components/SessionFilters'
import type { Session, SessionType, SessionFormat, SessionStatus, PaymentStatus, Member } from '@/types/member'
import { DEFAULT_NOTE_TYPES, FIXED_NOTE_TYPES } from '@/types/member'

interface SessionsTabProps {
  memberId: string
  member: Member
  sessions: Session[]
  onSessionsUpdate: () => void
  highlightSessionId?: string
  openBookModal?: boolean
  onBookModalOpened?: () => void
}

// ── Session row menu ────────────────────────────────────────────────
// Compact 3-dot dropdown that hosts secondary row actions
// (reschedule, cancel, delete, etc). Keeps the session row visually
// uncluttered while preserving access to every existing action.
interface RowMenuItem {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  // Visual tone — keeps Show/No-show/Delete distinguishable instead of
  // all looking like the same destructive action.
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
            const tone = item.tone ?? (item.danger ? 'danger' : 'default')
            const toneClass =
              tone === 'success' ? 'text-emerald-600 hover:bg-emerald-50' :
              tone === 'warning' ? 'text-amber-600 hover:bg-amber-50' :
              tone === 'danger'  ? 'text-red-600 hover:bg-red-50' :
              'text-gray-700 hover:bg-gray-50'
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

export default function SessionsTab({ memberId, member, sessions, onSessionsUpdate, highlightSessionId, openBookModal, onBookModalOpened }: SessionsTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  // Pending bookings for this member (used for the "Pending approval"
  // section + for matching each session to its parent booking so we can
  // show Join button, origin chip, etc).
  const [pendingBookings, setPendingBookings] = useState<any[]>([])
  // All bookings for this member — needed because History sessions also
  // need their parent booking looked up for the Google/Manual chip.
  const [allBookings, setAllBookings] = useState<any[]>([])

  // Extracted so callers (reschedule success, etc.) can refresh the
  // local cache after mutating bookings — otherwise the next match by
  // timestamp uses stale start_times and silently fails.
  const refetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('member_id', memberId)
      .order('start_time', { ascending: true })
    const rows = data || []
    setAllBookings(rows)
    const now = new Date().toISOString()
    setPendingBookings(rows.filter(b => ['pending', 'confirmed'].includes(b.status) && b.start_time >= now))
  }, [memberId, supabase])

  useEffect(() => { refetchBookings() }, [refetchBookings])

  // Cross-page / cross-tab sync — when any other surface (bookings
  // page, another tab) mutates a booking or session, refetch ours.
  // The listener calls the RAW prop without emitting back, otherwise
  // we'd create a broadcast loop between tabs.
  useBookingsChanged(() => {
    refetchBookings()
    onSessionsUpdate()
  })

  // Wrap onSessionsUpdate so every local mutation also broadcasts to
  // other open surfaces (bookings page, dashboard, other tabs).
  const notifyMutation = () => {
    onSessionsUpdate()
    emitBookingsChanged()
  }

  // Match a session to its parent booking by timestamp (within 1 min).
  const getBookingForSession = (scheduledAt: string) => {
    const sessionTime = Math.floor(new Date(scheduledAt).getTime() / 60000)
    return allBookings.find(b => Math.floor(new Date(b.start_time).getTime() / 60000) === sessionTime) || null
  }

  // Build meet_link lookup: match booking start_time to session scheduled_at (within 1 min)
  const getMeetLinkForSession = (scheduledAt: string): string | null => {
    return getBookingForSession(scheduledAt)?.meet_link || null
  }

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
    const booking = pendingBookings.find(b => b.id === bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: action })
      .eq('id', bookingId)
    if (!error) {
      // Session row is created automatically by the bookings→sessions
      // trigger when the booking status flips to 'confirmed'. We just
      // need to refresh the parent list so the UI picks it up.
      if (action === 'confirmed' && booking) {
        notifyMutation()
      }
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId))
      toast.success(action === 'confirmed'
        ? (locale === 'fr' ? 'Séance confirmée' : 'Session confirmed')
        : (locale === 'fr' ? 'Séance refusée' : 'Session rejected'))
    }
  }

  const searchParams = useSearchParams()
  const [showAddSession, setShowAddSession] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(searchParams.get('book') === 'true' || openBookModal === true)
  const [rescheduleSession, setRescheduleSession] = useState<any | null>(null)

  // ── Close session popup state ──────────────────────────────────────
  // Single popup that starts by asking Show vs No-show, then expands
  // into the relevant branch. Branch-specific state is preserved across
  // outcome toggles so a half-filled No-show isn't lost if you flip to
  // Show by accident.
  const [closePopupSession, setClosePopupSession] = useState<Session | null>(null)
  const [closePopupOutcome, setClosePopupOutcome] = useState<'show' | 'no_show' | null>(null)
  // Show-branch state. Every required field starts null/empty so the
  // practitioner must explicitly answer each section — no silent
  // defaults that they might miss.
  const [showPopupPayment, setShowPopupPayment] = useState<PaymentStatus | null>(null)
  const [showPopupNoteAction, setShowPopupNoteAction] = useState<'take' | 'skip' | 'has' | null>(null)
  const [showPopupNoteDraft, setShowPopupNoteDraft] = useState('')
  // After a Show close is confirmed, ask "Schedule next session?" in
  // a separate small popup so the main Close popup stays focused on
  // the just-finished session.
  const [scheduleNextPromptOpen, setScheduleNextPromptOpen] = useState(false)
  // No-show branch state
  const [noShowPopupPayment, setNoShowPopupPayment] = useState<PaymentStatus | null>(null)
  const [noShowPopupReason, setNoShowPopupReason] = useState<string>('')
  const [noShowPopupComments, setNoShowPopupComments] = useState('')
  // Shared saving flag
  const [closePopupSaving, setClosePopupSaving] = useState(false)

  const openClosePopup = (session: Session) => {
    setClosePopupSession(session)
    // Editing an already-closed session: pre-fill outcome + payment (+ reason)
    // so the practitioner adjusts what they recorded. Completed → "show";
    // cancelled/no_show → "no_show".
    const isCompleted = session.status === 'completed'
    const isClosedCancel = session.status === 'cancelled' || session.status === 'no_show'
    setClosePopupOutcome(isCompleted ? 'show' : isClosedCancel ? 'no_show' : null)
    setShowPopupPayment(isCompleted ? session.payment_status : null)
    const hasExistingNote = !!sessionSummaryNotes[session.id]?.content
    setShowPopupNoteAction(hasExistingNote ? 'has' : null)
    setShowPopupNoteDraft('')
    setNoShowPopupPayment(isClosedCancel ? session.payment_status : null)
    setNoShowPopupReason(isClosedCancel ? (session.cancellation_reason || '') : '')
    setNoShowPopupComments('')
  }

  const closeClosePopup = () => {
    setClosePopupSession(null)
    setClosePopupOutcome(null)
    setShowPopupNoteDraft('')
    setNoShowPopupComments('')
  }

  const confirmClosePopup = async () => {
    if (!closePopupSession || !closePopupOutcome) return
    const session = closePopupSession
    setClosePopupSaving(true)
    try {
      if (closePopupOutcome === 'show') {
        // Required fields: payment + note choice. Guard explicitly so a
        // stray confirm with null state never silently writes.
        if (showPopupPayment === null || showPopupNoteAction === null) return
        if (showPopupPayment !== session.payment_status) {
          await supabase.from('sessions').update({ payment_status: showPopupPayment }).eq('id', session.id)
        }
        // Save new note if the practitioner wrote one inside the popup
        if (showPopupNoteAction === 'take' && showPopupNoteDraft.replace(/<[^>]*>/g, '').trim()) {
          await handleSaveSessionSummary(session.id, showPopupNoteDraft)
        }
        await handleUpdateStatus(session.id, 'completed')
        closeClosePopup()
        // Hand off to the small follow-up prompt — ask after the
        // session is closed, not while filling the form.
        setScheduleNextPromptOpen(true)
      } else {
        // Required fields: payment + reason. Comments optional.
        if (noShowPopupPayment === null || !noShowPopupReason) return
        if (noShowPopupPayment !== session.payment_status) {
          await supabase.from('sessions').update({ payment_status: noShowPopupPayment }).eq('id', session.id)
        }
        // Always store as cancelled — no_communication is just one
        // reason among many, per founder's decision.
        await handleUpdateStatus(session.id, 'cancelled', noShowPopupReason, noShowPopupComments)
        closeClosePopup()
      }
    } finally {
      setClosePopupSaving(false)
    }
  }

  // Shared reschedule launcher — used by the menu item on every row and
  // by the bookings page equivalent.
  const openRescheduleForSession = async (session: Session) => {
    // The reschedule modal POSTs to /api/bookings/[id]/reschedule, so
    // we must hand it a real booking row id. Match within a 2-minute
    // window on start_time + same member, and skip already-cancelled
    // rows (so the row we just cancelled in a prior reschedule can't be
    // matched). If the local cache misses, fall back to a direct DB
    // query before erroring — without this fallback a quick second
    // reschedule click hits the toast because `refetchBookings()` from
    // the previous onSuccess hasn't returned yet.
    const sessionMs = new Date(session.scheduled_at).getTime()
    const sessionMin = Math.floor(sessionMs / 60000)
    const findMatch = (rows: any[]) => rows.find(b => {
      if (b.status === 'cancelled') return false
      const bookingMin = Math.floor(new Date(b.start_time).getTime() / 60000)
      return Math.abs(bookingMin - sessionMin) <= 1 &&
        (!session.member_id || b.member_id === session.member_id)
    })

    let matchingBooking = findMatch(allBookings)

    if (!matchingBooking) {
      // Cache miss — refresh from the DB and retry. Common right after
      // a reschedule: parent refresh + local refetch are both in flight
      // when the user clicks again.
      const lo = new Date(sessionMs - 60_000).toISOString()
      const hi = new Date(sessionMs + 60_000).toISOString()
      let q = supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', session.practitioner_id)
        .gte('start_time', lo)
        .lte('start_time', hi)
        .neq('status', 'cancelled')
      if (session.member_id) q = q.eq('member_id', session.member_id)
      const { data } = await q
      if (data && data.length > 0) {
        matchingBooking = findMatch(data) || data[0]
        // Patch the local cache so the next match doesn't have to re-query.
        setAllBookings(prev => {
          const seen = new Set(prev.map(b => b.id))
          const additions = data.filter(b => !seen.has(b.id))
          return additions.length > 0 ? [...prev, ...additions] : prev
        })
      }
    }

    if (!matchingBooking) {
      toast.error(
        locale === 'fr'
          ? "Aucun rendez-vous lié — modifiez la date directement via « Modifier la séance »."
          : locale === 'es'
            ? 'No hay reserva vinculada — edita la fecha desde "Editar sesión".'
            : 'No linked booking — edit the date directly via "Edit session".'
      )
      return
    }
    const fullName = `${member.first_name} ${member.last_name}`
    const sessionEnd = new Date(new Date(session.scheduled_at).getTime() + session.duration_minutes * 60000).toISOString()
    setRescheduleSession({
      id: matchingBooking.id,
      practitioner_id: session.practitioner_id,
      member_id: session.member_id,
      client_name: fullName,
      client_email: member.email || '',
      session_type: session.session_type,
      session_format: session.session_format,
      start_time: session.scheduled_at,
      end_time: sessionEnd,
      series_id: session.series_id,
    })
  }

  // Open modal when triggered from parent (e.g. header Book Session button)
  useEffect(() => {
    if (openBookModal) {
      setShowScheduleModal(true)
      onBookModalOpened?.()
    }
  }, [openBookModal])
  const [sessionType, setSessionType] = useState<SessionType>('follow_up')
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>('in_person')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [editSessionType, setEditSessionType] = useState<SessionType>('follow_up')
  const [editSessionFormat, setEditSessionFormat] = useState<SessionFormat>('in_person')
  const [editScheduledAt, setEditScheduledAt] = useState('')
  const [editDuration, setEditDuration] = useState(60)
  const [editSummary, setEditSummary] = useState('')
  const [editStatus, setEditStatus] = useState<SessionStatus>('scheduled')

  // Edit date/time picker state
  const [editSelectedDate, setEditSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [editSelectedTime, setEditSelectedTime] = useState<string | null>(null)
  const [editCalendarMonth, setEditCalendarMonth] = useState(new Date())
  const [editAvailableSlots, setEditAvailableSlots] = useState<{ slot_start: string; slot_end: string }[]>([])
  const [editLoadingSlots, setEditLoadingSlots] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)

  // Fetch practitioner ID for edit slot fetching
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEditUserId(user.id)
    }
    getUser()
  }, [])

  // Fetch available slots when edit date or duration changes
  useEffect(() => {
    if (editingSession && editUserId && editSelectedDate) {
      fetchEditSlots()
    }
  }, [editSelectedDate, editDuration, editingSession, editUserId])

  const fetchEditSlots = async () => {
    if (!editUserId) return
    setEditLoadingSlots(true)
    try {
      const dateStr = format(editSelectedDate, 'yyyy-MM-dd')
      const res = await fetch(`/api/bookings/available-slots?practitionerId=${editUserId}&date=${dateStr}&duration=${editDuration}&skipNotice=true`)
      const json = await res.json()
      setEditAvailableSlots(json.slots || [])
    } catch {
      setEditAvailableSlots([])
    }
    setEditLoadingSlots(false)
  }

  // Delete state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  // True while the Delete-confirm modal's request is in flight. Drives
  // the spinner / disabled state on the confirm dialog so the user
  // doesn't feel like nothing is happening and start clicking again.
  const [confirmDeleting, setConfirmDeleting] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  // Only Delete still flows through this generic confirm dialog —
  // complete, cancel, and no_show all go through the Close session
  // popup now.
  const [confirmAction, setConfirmAction] = useState<{ sessionId: string; action: 'delete' } | null>(null)
  // Modal that asks the practitioner what to do with notes attached to a
  // session they're about to delete. We branch the delete flow through
  // here only when the count > 0; otherwise the session is deleted directly.
  const [notesPrompt, setNotesPrompt] = useState<{ sessionId: string; count: number } | null>(null)
  // Series detail drawer: when set, shows all occurrences for this series_id
  const [viewingSeriesId, setViewingSeriesId] = useState<string | null>(null)

  // Reschedule proposal state
  // Per-series toggle for the "show next dates" list inside a collapsed
  // recurring card. Keyed by series_id.
  const [expandedSeriesNext, setExpandedSeriesNext] = useState<Set<string>>(new Set())

  // ── Filter state (date / status / type / payment) ────────────────
  const [dateRange, setDateRange] = useState<DateRangePreset>('all')
  const [customFrom, setCustomFrom] = useState<string | null>(null)
  const [customTo, setCustomTo] = useState<string | null>(null)
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [paymentFilters, setPaymentFilters] = useState<Set<string>>(new Set())
  const resetFilters = () => {
    setDateRange('all')
    setCustomFrom(null)
    setCustomTo(null)
    setStatusFilters(new Set())
    setTypeFilters(new Set())
    setPaymentFilters(new Set())
  }

  // Practitioner's configured session types (from booking_settings) —
  // drives the Type filter. Falls back to derived-from-data if none
  // are configured, so the filter is always useful.
  const [configuredSessionTypes, setConfiguredSessionTypes] = useState<{ id: string; name: string; name_fr?: string }[]>([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return
      if (Array.isArray(settings?.session_types)) {
        setConfiguredSessionTypes(settings!.session_types as any)
      }
    })()
    return () => { cancelled = true }
  }, [supabase])
  const [proposingSession, setProposingSession] = useState<Session | null>(null)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')
  const [proposalSaving, setProposalSaving] = useState(false)

  // Session notes state
  interface SessionNote {
    id: string
    content: string
    created_at: string
    milestone_id: string | null
    milestone_title?: string
    note_type?: string
  }
  interface MilestoneOption {
    id: string
    title: string
    status: string
  }

  const [sessionSummaryNotes, setSessionSummaryNotes] = useState<Record<string, SessionNote | null>>({})
  const [milestones, setMilestones] = useState<MilestoneOption[]>([])
  const [editorNoteTypes, setEditorNoteTypes] = useState<{ type: string; label: string }[]>([])
  // Legacy practitioners see the original 7 default tags; new practitioners see only the 2 fixed ones.
  const [usesLegacyDefaults, setUsesLegacyDefaults] = useState<boolean>(false)
  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      supabase.from('users').select('uses_legacy_default_tags').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (!cancelled) setUsesLegacyDefaults(!!data?.uses_legacy_default_tags)
      })
    })
    return () => { cancelled = true }
  }, [supabase])
  const effectiveDefaultTags: readonly string[] = usesLegacyDefaults ? DEFAULT_NOTE_TYPES : FIXED_NOTE_TYPES


  // Session summary note editing state
  const [editingSummarySession, setEditingSummarySession] = useState<string | null>(null)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())


  // Scroll to highlighted session or section. Also auto-open the note
  // panel for the highlighted session so "Go to this session" from the
  // bookings page lands directly on the note-taking surface.
  useEffect(() => {
    if (!highlightSessionId) return
    if (highlightSessionId !== 'past-sessions-section') {
      setExpandedNotes(prev => {
        if (prev.has(highlightSessionId)) return prev
        const next = new Set(prev)
        next.add(highlightSessionId)
        return next
      })
    }
    const t = setTimeout(() => {
      const elementId = highlightSessionId === 'past-sessions-section'
        ? 'past-sessions-section'
        : `session-${highlightSessionId}`
      const element = document.getElementById(elementId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
    return () => clearTimeout(t)
  }, [highlightSessionId])

  // Fetch milestones for the member
  useEffect(() => {
    const fetchMilestones = async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('id, title, status')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setMilestones(data)
      }
    }

    fetchMilestones()
  }, [memberId, supabase])

  // Build note types list for inline tagging.
  // Mirrors NotesTab's `snEditorNoteTypes` builder so the two tabs show
  // an identical tag list — the practitioner's set of available tags is
  // a single concept, regardless of which surface they're tagging from.
  useEffect(() => {
    const buildNoteTypes = async () => {
      const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined

      const baseDefaults = usesLegacyDefaults ? DEFAULT_NOTE_TYPES : FIXED_NOTE_TYPES

      // Read custom_note_types once; split `_hidden:*` soft-delete
      // markers from real customs. Hidden defaults must be stripped here
      // too or a deletable default the practitioner removed comes back
      // on every refresh.
      const hiddenSet = new Set<string>()
      const customs: string[] = []
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('custom_note_types')
          .select('type_name')
          .eq('practitioner_id', user.id)
          .order('created_at')

        if (data) {
          for (const d of data) {
            if (d.type_name.startsWith('_hidden:')) {
              hiddenSet.add(d.type_name.replace('_hidden:', ''))
            } else {
              customs.push(d.type_name)
            }
          }
        }
      }

      const types: { type: string; label: string }[] = baseDefaults
        .filter(nt => !hiddenSet.has(nt))
        .map(nt => ({ type: nt, label: noteTypeLabels?.[nt] || nt }))
      for (const c of customs) {
        if (!types.some(existing => existing.type === c)) {
          types.push({ type: c, label: noteTypeLabels?.[c] || c.replace(/_/g, ' ') })
        }
      }

      setEditorNoteTypes(types)
    }
    buildNoteTypes()
  }, [supabase, t, usesLegacyDefaults])

  // All notes for this member — used by tag-management handlers (count usage,
  // unwrap inline <mark> on tag delete).
  const [allMemberNotes, setAllMemberNotes] = useState<{ id: string; content: string; note_type: string | null }[]>([])
  const refreshAllMemberNotes = async () => {
    const { data } = await supabase
      .from('progress_notes')
      .select('id, content, note_type')
      .eq('member_id', memberId)
    if (data) setAllMemberNotes(data as unknown as { id: string; content: string; note_type: string | null }[])
  }
  useEffect(() => { refreshAllMemberNotes() }, [memberId, supabase])

  // Tag management — same semantics as NotesTab so practitioners can edit
  // tags from any editor surface.
  const handleEditorAddType = async (typeName: string) => {
    const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined
    const label = noteTypeLabels?.[typeName] || typeName.replace(/_/g, ' ')
    setEditorNoteTypes(prev => prev.some(nt => nt.type === typeName) ? prev : [...prev, { type: typeName, label }])
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('custom_note_types').upsert(
      { practitioner_id: user.id, type_name: typeName },
      { onConflict: 'practitioner_id,type_name' }
    )
  }

  const handleEditorRenameType = async (oldName: string, newName: string) => {
    const val = newName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!val || val === oldName) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('custom_note_types').update({ type_name: val }).eq('practitioner_id', user.id).eq('type_name', oldName)
    await supabase.from('progress_notes').update({ note_type: val }).eq('practitioner_id', user.id).eq('note_type', oldName)
    const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined
    const label = noteTypeLabels?.[val] || val.replace(/_/g, ' ')
    setEditorNoteTypes(prev => prev.map(nt => nt.type === oldName ? { type: val, label } : nt))
    refreshAllMemberNotes()
    onSessionsUpdate()
    toast.success(locale === 'fr' ? 'Étiquette renommée' : 'Tag renamed')
  }

  const DELETABLE_DEFAULTS = ['general', 'symptome', 'transfert', 'contre_transfert', 'ajustement_envisage']
  const handleEditorDeleteType = async (typeName: string, reassignTo: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Reassign notes whose note_type matches
    await supabase.from('progress_notes').update({ note_type: reassignTo }).eq('practitioner_id', user.id).eq('note_type', typeName)

    // Unwrap inline <mark data-tag="typeName"> from any note's content
    const notesWithInlineTag = allMemberNotes.filter(n => n.content?.includes(`data-tag="${typeName}"`))
    for (const note of notesWithInlineTag) {
      let updated = note.content
      try {
        const doc = new DOMParser().parseFromString(note.content, 'text/html')
        doc.querySelectorAll(`mark[data-tag="${typeName}"]`).forEach(mark => {
          const parent = mark.parentNode
          if (parent) {
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
            parent.removeChild(mark)
          }
        })
        updated = doc.body.innerHTML
      } catch { /* ignore */ }
      if (updated !== note.content) {
        await supabase.from('progress_notes').update({ content: updated }).eq('id', note.id)
      }
    }

    if (DELETABLE_DEFAULTS.includes(typeName)) {
      // Hide a deletable default via _hidden: marker
      await supabase.from('custom_note_types').upsert(
        { practitioner_id: user.id, type_name: `_hidden:${typeName}` },
        { onConflict: 'practitioner_id,type_name' }
      )
    } else {
      await supabase.from('custom_note_types').delete().eq('practitioner_id', user.id).eq('type_name', typeName)
    }

    setEditorNoteTypes(prev => prev.filter(nt => nt.type !== typeName))
    refreshAllMemberNotes()
    onSessionsUpdate()
    toast.success(locale === 'fr' ? 'Étiquette supprimée' : 'Tag deleted')
  }

  const getTagNoteCount = (typeName: string): number =>
    allMemberNotes.filter(n => n.note_type === typeName || n.content?.includes(`data-tag="${typeName}"`)).length

  // Fetch notes for all sessions
  useEffect(() => {
    const fetchSessionSummaryNotes = async () => {
      const sessionIds = sessions.map(s => s.id)
      if (sessionIds.length === 0) return

      const { data, error } = await supabase
        .from('progress_notes')
        .select('id, content, created_at, session_id, milestone_id, note_type')
        .in('session_id', sessionIds)
        .eq('note_type', 'session_summary')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const summaryBySession: Record<string, SessionNote | null> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((note: any) => {
          if (note.session_id && !summaryBySession[note.session_id]) {
            summaryBySession[note.session_id] = {
              id: note.id,
              content: note.content,
              created_at: note.created_at,
              milestone_id: note.milestone_id,
              note_type: note.note_type,
            }
          }
        })
        setSessionSummaryNotes(summaryBySession)
      }
    }

    fetchSessionSummaryNotes()
  }, [sessions, supabase])

  const handleSaveSessionSummary = async (sessionId: string, content: string) => {
    const plain = content.replace(/<[^>]*>/g, '').trim()
    const existing = sessionSummaryNotes[sessionId]
    // Empty + no existing row = nothing to do. Empty + existing row =
    // the practitioner is clearing a stale note, so delete instead of bailing.
    if (!plain && !existing) return

    setSavingSummary(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (!plain && existing) {
        const { error } = await supabase
          .from('progress_notes')
          .delete()
          .eq('id', existing.id)

        if (error) throw error

        setSessionSummaryNotes(prev => {
          const next = { ...prev }
          delete next[sessionId]
          return next
        })
        setEditingSummarySession(null)
        setSummaryDraft('')
        toast.success(locale === 'fr' ? 'Note supprimée' : 'Note deleted')
        return
      }

      if (existing) {
        const { error } = await supabase
          .from('progress_notes')
          .update({ content: content.trim(), updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (error) throw error

        setSessionSummaryNotes(prev => ({
          ...prev,
          [sessionId]: { ...existing, content: content.trim() },
        }))
      } else {
        const { data, error } = await supabase
          .from('progress_notes')
          .insert({
            member_id: memberId,
            practitioner_id: user.id,
            session_id: sessionId,
            content: content.trim(),
            note_type: 'session_summary',
            is_private: true,
          })
          .select('id, content, created_at, milestone_id')
          .single()

        if (error) throw error

        setSessionSummaryNotes(prev => ({
          ...prev,
          [sessionId]: {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            milestone_id: null,
            note_type: 'session_summary',
          },
        }))
      }

      setEditingSummarySession(null)
      setSummaryDraft('')
      toast.success(locale === 'fr' ? 'Note de séance enregistrée' : 'Session note saved')
    } catch (error) {
      console.error('Error saving session summary:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'enregistrement' : 'Failed to save note')
    } finally {
      setSavingSummary(false)
    }
  }

  // Merge confirmed bookings that have no matching session record into upcoming
  const sessionScheduledTimes = new Set(
    sessions.map(s => Math.floor(new Date(s.scheduled_at).getTime() / 60000))
  )
  const bookingsAsSessions: Session[] = pendingBookings
    .filter(b => b.status === 'confirmed' && !sessionScheduledTimes.has(Math.floor(new Date(b.start_time).getTime() / 60000)))
    .map(b => ({
      id: `booking-${b.id}`,
      practitioner_id: b.practitioner_id,
      member_id: b.member_id,
      session_type: 'follow_up' as SessionType,
      custom_session_type: null,
      session_format: (b.session_format === 'in_person' ? 'in_person' : 'virtual') as SessionFormat,
      scheduled_at: b.start_time,
      duration_minutes: Math.round((new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 60000),
      status: 'scheduled' as SessionStatus,
      payment_status: (b.payment_status || 'unpaid') as PaymentStatus,
      notes: b.notes || b.session_type,
      summary: null,
      cancellation_reason: null,
      mood_rating: null,
      goals: [],
      outcomes: [],
      homework: [],
      member_confirmed: false,
      reschedule_requested: false,
      reschedule_reason: null,
      member_suggested_date: null,
      practitioner_proposed_date: null,
      reschedule_status: null,
      preparation: null,
      created_at: b.created_at,
      updated_at: b.created_at,
    } as Session))

  // Map a Session to its StatusKey for filtering (mirrors the dot
  // colour logic — 'scheduled' splits into future vs awaiting outcome).
  const sessionStatusKey = (s: Session): StatusKey => {
    if (s.status === 'scheduled') {
      return new Date(s.scheduled_at) < new Date() ? 'awaiting' : 'scheduled'
    }
    if (s.status === 'completed') return 'completed'
    if (s.status === 'cancelled') return 'cancelled'
    if (s.status === 'no_show') return 'no_show'
    return 'scheduled'
  }

  // Apply the active filter set to a Session row. Returns true if it
  // should be visible after filtering.
  const passesFilters = (s: Session): boolean => {
    if (!inDateRange(new Date(s.scheduled_at), dateRange, customFrom, customTo)) return false
    if (statusFilters.size > 0 && !statusFilters.has(sessionStatusKey(s))) return false
    if (typeFilters.size > 0 && !typeFilters.has(s.session_type as string)) return false
    if (paymentFilters.size > 0 && !paymentFilters.has(s.payment_status || 'unpaid')) return false
    return true
  }

  const upcomingSessionsRaw = [
    ...sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date()),
    ...bookingsAsSessions,
  ]
    .filter(passesFilters)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  // Collapse recurring-series occurrences into a single card. A 12-session
  // series shouldn't produce 12 cards in Up next — show the next one as
  // the row and fold the remaining future dates into a compact list
  // inside the same card.
  const upcomingSessions: (Session & { _seriesNext?: Session[] })[] = (() => {
    const seen = new Set<string>()
    const out: (Session & { _seriesNext?: Session[] })[] = []
    for (const s of upcomingSessionsRaw) {
      if (!s.series_id) { out.push(s); continue }
      if (seen.has(s.series_id)) continue
      seen.add(s.series_id)
      const seriesNext = upcomingSessionsRaw.filter(x => x.series_id === s.series_id && x.id !== s.id)
      out.push({ ...s, _seriesNext: seriesNext })
    }
    return out
  })()

  const pastSessions = sessions
    .filter(s => s.status !== 'scheduled' || new Date(s.scheduled_at) < new Date())
    .filter(passesFilters)

  const handleAddSession = async () => {
    if (!scheduledAt) {
      toast.error(locale === 'fr' ? 'Veuillez sélectionner une date et une heure' : 'Please select a date and time')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('sessions')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_type: sessionType,
          session_format: sessionFormat,
          scheduled_at: scheduledAt,
          duration_minutes: duration,
          summary: summary.trim() || null,
          status: 'scheduled' as SessionStatus,
          goals: [],
          outcomes: [],
          homework: [],
        })

      if (error) throw error

      toast.success(t.members.success.sessionCreated)
      setShowAddSession(false)
      setScheduledAt('')
      setSummary('')
      notifyMutation()
    } catch (error) {
      console.error('Error adding session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (sessionId: string, newStatus: SessionStatus, reason?: string, notes?: string, seriesScope?: 'this' | 'following') => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
      if (reason) updateData.cancellation_reason = reason
      if (notes) updateData.notes = (notes || '').trim() || null
      // Clear stale cancellation data when (re)closing as completed — relevant
      // when editing a previously cancelled/no-show session back to attended.
      // NB: only cancellation_reason — the sessions table has no cancelled_at
      // column (that's on bookings); writing it makes Postgres reject the
      // whole update and breaks closing the session.
      if (newStatus === 'completed') { updateData.cancellation_reason = null }
      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)

      if (error) throw error

      // When closing as completed (or no-show, which we store as
      // cancelled), mirror the new status to the paired booking row so
      // the bookings page doesn't keep showing "Clôturer la séance".
      // Cancelled goes through the PATCH endpoint below to also trigger
      // Google Calendar updates; completed is local-only (the event
      // already happened, nothing to sync to Google).
      let cancelledBookingId: string | null = null
      const sessionRow = sessions.find(s => s.id === sessionId)
      if (newStatus === 'completed' && sessionRow) {
        try {
          const { data: matchingBooking } = await supabase
            .from('bookings')
            .select('id, payment_status')
            .eq('practitioner_id', sessionRow.practitioner_id)
            .eq('member_id', memberId)
            .eq('start_time', sessionRow.scheduled_at)
            // No status guard: editing an already-closed session must still
            // propagate the new outcome/payment to its paired booking row.
            .maybeSingle()
          if (matchingBooking) {
            // Read the just-updated session row to pick up the new
            // payment_status the practitioner set in the close popup
            // (written immediately before this handler ran).
            const { data: freshSession } = await supabase
              .from('sessions')
              .select('payment_status')
              .eq('id', sessionId)
              .maybeSingle()
            const updates: Record<string, unknown> = {
              status: 'completed',
              updated_at: new Date().toISOString(),
            }
            if (freshSession?.payment_status && freshSession.payment_status !== matchingBooking.payment_status) {
              updates.payment_status = freshSession.payment_status
            }
            await supabase.from('bookings').update(updates).eq('id', matchingBooking.id)
          }
        } catch (bookingErr) {
          console.warn('Could not propagate completed to matching booking:', bookingErr)
        }
      }
      if (newStatus === 'cancelled') {
        try {
          if (sessionRow) {
            // Find the matching booking by member + start time
            const { data: matchingBooking } = await supabase
              .from('bookings')
              .select('id, status')
              .eq('member_id', memberId)
              .eq('start_time', sessionRow.scheduled_at)
              .neq('status', 'cancelled')
              .maybeSingle()

            if (matchingBooking) {
              cancelledBookingId = matchingBooking.id
              await fetch(`/api/bookings/${matchingBooking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'cancelled',
                  practitioner_notes: reason || undefined,
                  series_scope: seriesScope || 'this',
                }),
              })
            }
          }
        } catch (bookingErr) {
          console.warn('Could not cancel matching booking:', bookingErr)
          // Don't block — session was already cancelled successfully
        }
      }

      // Undo affordance for series-occurrence cancels (scope='this'). The
      // restore endpoint flips DB rows back and PATCHes the Google instance
      // to confirmed. We don't offer undo for 'following' scope — restoring
      // a multi-row series cancel correctly is more involved (recreating
      // RRULE state) and out of v1 scope.
      const showUndo =
        newStatus === 'cancelled' &&
        sessionRow?.series_id &&
        (seriesScope === 'this' || seriesScope === undefined) &&
        cancelledBookingId
      if (showUndo) {
        toast.success(
          locale === 'fr' ? 'Séance annulée' : 'Session cancelled',
          {
            duration: 8000,
            action: {
              label: locale === 'fr' ? 'Annuler' : 'Undo',
              onClick: async () => {
                try {
                  const r = await fetch(`/api/bookings/${cancelledBookingId}/restore`, { method: 'POST' })
                  if (!r.ok) throw new Error('restore failed')
                  toast.success(locale === 'fr' ? 'Séance restaurée' : 'Session restored')
                  notifyMutation()
                } catch {
                  toast.error(locale === 'fr' ? 'Échec de la restauration' : 'Restore failed')
                }
              },
            },
          }
        )
      } else {
        toast.success(t.members.success.sessionUpdated)
      }
      notifyMutation()
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
    }
  }

  // Reopen a cancelled session — affordance for "I cancelled this by
  // mistake." Finds the cancelled booking that pairs with this session
  // (by member + scheduled_at) and calls the /restore endpoint, which
  // flips both rows back AND recreates the Google event so the patient
  // gets a fresh invitation.
  const handleReopenSession = async (session: Session) => {
    try {
      const { data: matchingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('practitioner_id', session.practitioner_id)
        .eq('start_time', session.scheduled_at)
        .eq('status', 'cancelled')
        .order('cancelled_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!matchingBooking?.id) {
        toast.error(
          locale === 'fr'
            ? 'Impossible de trouver la réservation associée à restaurer.'
            : 'Could not find the matching booking to restore.'
        )
        return
      }
      const res = await fetch(`/api/bookings/${matchingBooking.id}/restore`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null as any)
        toast.error(body?.error || (locale === 'fr' ? 'Échec de la restauration' : 'Restore failed'))
        return
      }
      toast.success(locale === 'fr' ? 'Séance restaurée' : 'Session restored')
      notifyMutation()
    } catch (err) {
      console.error('Reopen session error:', err)
      toast.error(locale === 'fr' ? 'Échec de la restauration' : 'Restore failed')
    }
  }

  const handleStartEdit = (session: Session) => {
    setEditingSession(session)
    setEditSessionType(session.session_type)
    setEditSessionFormat(session.session_format)
    setEditScheduledAt(session.scheduled_at.slice(0, 16))
    setEditDuration(session.duration_minutes)
    setEditSummary(session.summary || '')
    setEditStatus(session.status)

    // Set date picker state from existing session
    const sessionDate = new Date(session.scheduled_at)
    setEditSelectedDate(startOfDay(sessionDate))
    setEditCalendarMonth(sessionDate)
    setEditSelectedTime(format(sessionDate, 'HH:mm'))
  }

  const handleCancelEdit = () => {
    setEditingSession(null)
  }

  const handleSaveEdit = async () => {
    if (!editingSession) return

    setSaving(true)
    try {
      // Build scheduled_at from date picker state
      const dt = new Date(editSelectedDate)
      if (editSelectedTime) {
        const [hours, minutes] = editSelectedTime.split(':').map(Number)
        dt.setHours(hours, minutes, 0, 0)
      } else {
        // Keep original time if no time selected
        const originalDate = new Date(editingSession.scheduled_at)
        dt.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0)
      }
      const scheduledAtValue = dt.toISOString()

      const { error } = await supabase
        .from('sessions')
        .update({
          session_type: editSessionType,
          session_format: editSessionFormat,
          scheduled_at: scheduledAtValue,
          duration_minutes: editDuration,
          summary: editSummary.trim() || null,
          status: editStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSession.id)

      if (error) throw error

      toast.success(t.members.success.sessionUpdated)
      setEditingSession(null)
      notifyMutation()
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    // Synthetic rows for pending bookings have IDs prefixed with
    // "booking-". They don't exist in the sessions table — delete the
    // underlying booking row instead.
    if (sessionId.startsWith('booking-')) {
      await deleteBookingRow(sessionId.slice('booking-'.length))
      return
    }
    // Before deleting, find out if any notes are linked to this session
    // so we can ask the practitioner whether to keep them (detach) or
    // delete them too. If none, fall straight through to the deletion.
    try {
      const { count, error: countErr } = await supabase
        .from('progress_notes')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
      if (countErr) throw countErr
      if ((count ?? 0) > 0) {
        setNotesPrompt({ sessionId, count: count ?? 0 })
        return
      }
    } catch (err) {
      console.warn('Could not count notes for session, deleting without prompt:', err)
    }
    await deleteSessionAndNotes(sessionId, 'no_notes')
  }

  // Hard-delete a booking row (used when the "delete" came from a
  // bookings-as-session synthetic row in this tab).
  const deleteBookingRow = async (bookingId: string) => {
    try {
      const { error, count } = await supabase
        .from('bookings')
        .delete({ count: 'exact' })
        .eq('id', bookingId)
      if (error) throw error
      if ((count ?? 0) === 0) {
        throw new Error('Delete matched 0 rows — likely RLS or wrong practitioner_id')
      }
      // Refresh the local pending-bookings cache so the row disappears.
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId))
      setAllBookings(prev => prev.filter(b => b.id !== bookingId))
      toast.success(locale === 'fr' ? 'Réservation supprimée' : 'Booking deleted')
    } catch (err: any) {
      console.error('Error deleting booking:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      })
      toast.error(locale === 'fr' ? 'Échec de la suppression' : 'Failed to delete booking')
    }
  }

  /**
   * Performs the actual deletion. `noteAction` controls what happens
   * to notes whose session_id points at this session:
   *   - 'no_notes'    — there were no linked notes to begin with
   *   - 'keep'        — null out their session_id so they survive as
   *                     standalone notes in Observations
   *   - 'delete'      — hard-delete the notes alongside the session
   */
  const deleteSessionAndNotes = async (
    sessionId: string,
    noteAction: 'no_notes' | 'keep' | 'delete',
  ) => {
    try {
      const session = sessions.find(s => s.id === sessionId)

      if (noteAction === 'keep') {
        const { error: updErr } = await supabase
          .from('progress_notes')
          .update({ session_id: null })
          .eq('session_id', sessionId)
        if (updErr) throw updErr
      } else if (noteAction === 'delete') {
        const { error: delNotesErr } = await supabase
          .from('progress_notes')
          .delete()
          .eq('session_id', sessionId)
        if (delNotesErr) throw delNotesErr
      }

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      // Cancel the matching booking + Google Calendar event so the Bookings
      // page / calendar view stays in sync.
      if (session) {
        try {
          let bookingQuery = supabase
            .from('bookings')
            .select('id, status')
            .eq('practitioner_id', session.practitioner_id)
            .eq('start_time', session.scheduled_at)
            .neq('status', 'cancelled')
          if (session.member_id) {
            bookingQuery = bookingQuery.eq('member_id', session.member_id)
          }
          const { data: matchingBooking } = await bookingQuery.maybeSingle()

          if (matchingBooking) {
            // 1. PATCH to cancelled — this fires the Google Calendar
            //    cancellation email with the reschedule/cancel reason
            //    note and removes the event from the calendar.
            await fetch(`/api/bookings/${matchingBooking.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'cancelled' }),
            })
            // 2. Hard-delete the booking row. The user explicitly
            //    asked us to delete the session — keeping a cancelled
            //    booking around makes it reappear in the global
            //    bookings History as "Cancelled", which is confusing.
            //    Patient already got the cancellation email from step 1.
            await supabase
              .from('bookings')
              .delete()
              .eq('id', matchingBooking.id)
            // Drop the booking from local caches so the synthetic
            // "bookingsAsSessions" row stops re-appearing in Upcoming
            // before the next page refresh.
            setPendingBookings(prev => prev.filter(b => b.id !== matchingBooking.id))
            setAllBookings(prev => prev.filter(b => b.id !== matchingBooking.id))
          }
        } catch (bookingErr) {
          console.warn('Could not cancel matching booking:', bookingErr)
        }
      }

      const successMsg = noteAction === 'delete'
        ? (locale === 'fr' ? 'Séance et notes supprimées' : 'Session and notes deleted')
        : noteAction === 'keep'
          ? (locale === 'fr' ? 'Séance supprimée, notes conservées' : 'Session deleted, notes kept')
          : (locale === 'fr' ? 'Séance supprimée' : 'Session deleted')
      toast.success(successMsg)
      setDeletingSessionId(null)
      setNotesPrompt(null)
      notifyMutation()
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error(locale === 'fr' ? 'Échec de la suppression' : 'Failed to delete session')
    }
  }

  const handleOpenProposal = (session: Session) => {
    setProposingSession(session)
    // Pre-fill with member's suggested date if available
    if (session.member_suggested_date) {
      const suggestedDate = new Date(session.member_suggested_date)
      setProposedDate(suggestedDate.toISOString().split('T')[0])
      setProposedTime(suggestedDate.toTimeString().slice(0, 5))
    } else {
      setProposedDate('')
      setProposedTime('')
    }
  }

  const handleProposeNewDate = async () => {
    if (!proposingSession || !proposedDate || !proposedTime) {
      toast.error(locale === 'fr' ? 'Veuillez sélectionner une date et une heure' : 'Please select a date and time')
      return
    }

    setProposalSaving(true)
    try {
      const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`)

      const { error } = await supabase
        .from('sessions')
        .update({
          practitioner_proposed_date: proposedDateTime.toISOString(),
          reschedule_status: 'proposed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposingSession.id)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Nouvelle date proposée au membre' : 'New date proposed to member')
      setProposingSession(null)
      setProposedDate('')
      setProposedTime('')
      notifyMutation()
    } catch (error) {
      console.error('Error proposing new date:', error)
      toast.error(locale === 'fr' ? 'Impossible de proposer une nouvelle date' : 'Failed to propose new date')
    } finally {
      setProposalSaving(false)
    }
  }

  const handleAcceptReschedule = async (session: Session) => {
    if (!session.member_suggested_date) return

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          scheduled_at: session.member_suggested_date,
          reschedule_requested: false,
          reschedule_status: 'accepted',
          member_confirmed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Report accepté — séance mise à jour avec la date suggérée par le membre' : 'Reschedule accepted - session updated to member\'s suggested date')
      notifyMutation()
    } catch (error) {
      console.error('Error accepting reschedule:', error)
      toast.error(locale === 'fr' ? 'Impossible d\'accepter le report' : 'Failed to accept reschedule')
    }
  }

  const handleDeclineReschedule = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          reschedule_requested: false,
          reschedule_status: 'declined',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Demande de report refusée' : 'Reschedule request declined')
      notifyMutation()
    } catch (error) {
      console.error('Error declining reschedule:', error)
      toast.error(locale === 'fr' ? 'Impossible de refuser le report' : 'Failed to decline reschedule')
    }
  }

  const formatIcon = {
    in_person: User,
    virtual: Video,
    phone: Phone,
  }

  const statusStyles: Record<SessionStatus, { bg: string; text: string; dot: string }> = {
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    no_show: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  }

  return (
    <div className="space-y-6">

      {/* Add Session Form */}
      <AnimatePresence>
        {showAddSession && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl p-6  border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" />
                {t.members.sessions.scheduleSession}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.sessionType}
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white "
                  >
                    <option value="initial_consultation">{t.members.sessionTypes.initial_consultation}</option>
                    <option value="follow_up">{t.members.sessionTypes.follow_up}</option>
                    <option value="check_in">{t.members.sessionTypes.check_in}</option>
                    <option value="crisis">{t.members.sessionTypes.crisis}</option>
                    <option value="group">{t.members.sessionTypes.group}</option>
                    <option value="other">{t.members.sessionTypes.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.sessionFormat}
                  </label>
                  <select
                    value={sessionFormat}
                    onChange={(e) => setSessionFormat(e.target.value as SessionFormat)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white "
                  >
                    <option value="in_person">{t.members.sessionFormats.in_person}</option>
                    <option value="virtual">{t.members.sessionFormats.virtual}</option>
                    <option value="phone">{t.members.sessionFormats.phone}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    {locale === 'fr' ? 'Date et heure' : 'Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.duration} ({t.members.sessions.minutes})
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white "
                  >
                    <option value={30}>30 {t.members.sessions.minutes}</option>
                    <option value={45}>45 {t.members.sessions.minutes}</option>
                    <option value={60}>60 {t.members.sessions.minutes}</option>
                    <option value={90}>90 {t.members.sessions.minutes}</option>
                    <option value={120}>120 {t.members.sessions.minutes}</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Session summary..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white "
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowAddSession(false)} className="rounded-xl">
                  {t.members.form.cancel}
                </Button>
                <Button
                  onClick={handleAddSession}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg"
                >
                  {saving ? t.members.form.saving : t.members.sessions.scheduleSession}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Bookings */}
      {pendingBookings.filter(b => b.status === 'pending').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 rounded-2xl p-6 border border-amber-200 mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            {locale === 'fr' ? 'En attente d\'approbation' : 'Pending Approval'}
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              {pendingBookings.filter(b => b.status === 'pending').length}
            </span>
          </h3>
          <div className="space-y-3">
            {pendingBookings.filter(b => b.status === 'pending').map(booking => (
              <div key={booking.id} className="bg-white rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{booking.session_type}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      {new Date(booking.start_time).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}
                      {new Date(booking.start_time).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(booking.end_time).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {booking.notes && (
                      <p className="text-xs text-gray-400 mt-2 italic">{booking.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBookingAction(booking.id, 'confirmed')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {locale === 'fr' ? 'Accepter' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'cancelled')}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-medium flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      {locale === 'fr' ? 'Refuser' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upcoming + History — timeline UI (ported from /bookings page) */}
      {(() => {
        const now = new Date()

        // ── Relative-date label for a session row ──
        const dateHeadline = (d: Date) => {
          if (isToday(d)) return locale === 'fr' ? "Aujourd'hui" : 'Today'
          if (isTomorrow(d)) return locale === 'fr' ? 'Demain' : 'Tomorrow'
          return format(d, locale === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale: locale === 'fr' ? frLocale : undefined })
        }

        // ── Session type label (handles custom types + i18n) ──
        const getSessionTypeLabel = (type: SessionType, custom?: string | null) => {
          if (custom) return custom
          const labels = t.members.sessionTypes as Record<string, string>
          return labels[type] || type
        }

        // ── Reusable timeline row renderer ──
        const renderRow = (session: Session, _index: number, isLast: boolean) => {
          const startTime = parseISO(session.scheduled_at)
          const durMin = session.duration_minutes
          const isAwaitingOutcome = session.status === 'scheduled' && isPast(startTime)
          const isFutureScheduled = session.status === 'scheduled' && !isPast(startTime)
          const hasRescheduleRequest = session.reschedule_requested && session.reschedule_status === 'pending'
          const hasPendingProposal = session.reschedule_status === 'proposed'
          // Each status maps to a distinct hue — green is reserved for
          // 'completed' so a future-scheduled session no longer reads as
          // "done". Status maps to the StatusDot icon+color via the
          // shared SessionDotLegend map.
          const statusKey: StatusKey =
            session.status === 'scheduled' ? (isAwaitingOutcome ? 'awaiting' : 'scheduled') :
            session.status === 'completed' ? 'completed' :
            session.status === 'cancelled' ? 'cancelled' :
            session.status === 'no_show'   ? 'no_show'   :
            'scheduled'

          const meetLink = isFutureScheduled ? getMeetLinkForSession(session.scheduled_at) : null
          // Origin chip: matched booking → Google if synced, else Manual.
          // No matched booking (e.g. session scheduled directly via Add
          // Session) is treated as Manual.
          const matchedBooking = getBookingForSession(session.scheduled_at)
          const isGoogleSynced = !!matchedBooking?.google_event_id
          const isNotesOpen = expandedNotes.has(session.id) || editingSummarySession === session.id
          const recordTable = session.id.startsWith('booking-') ? 'bookings' as const : 'sessions' as const
          const recordId = session.id.startsWith('booking-') ? session.id.replace('booking-', '') : session.id

          // Menu shape depends on whether the session is still open.
          // Closed sessions (completed/cancelled/no_show) can only be
          // edited or deleted — Close + Reschedule don't apply anymore.
          // Cancelled rows also get a "Reopen" affordance for accidental
          // cancellations.
          const isClosed = session.status !== 'scheduled'
          const isCancelled = session.status === 'cancelled'
          const menuItems: RowMenuItem[] = [
            {
              label: locale === 'fr' ? 'Modifier la séance' : 'Edit session',
              icon: Pencil,
              onClick: () => handleStartEdit(session),
            },
            ...(isClosed ? [] : [
              {
                label: locale === 'fr' ? 'Clôturer la séance' : 'Close session',
                icon: CheckCircle,
                onClick: () => openClosePopup(session),
                tone: 'success' as const,
              },
              {
                label: locale === 'fr' ? 'Reprogrammer' : 'Reschedule',
                icon: RefreshCw,
                onClick: () => openRescheduleForSession(session),
              },
            ]),
            ...(isCancelled ? [{
              label: locale === 'fr' ? 'Restaurer la séance' : 'Reopen session',
              icon: RefreshCw,
              onClick: () => handleReopenSession(session),
              tone: 'success' as const,
            }] : []),
            {
              label: locale === 'fr' ? 'Supprimer' : 'Delete',
              icon: Trash2,
              onClick: () => setConfirmAction({ sessionId: session.id, action: 'delete' }),
              danger: true,
            },
          ]

          return (
            <motion.div
              key={session.id}
              id={`session-${session.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: highlightSessionId === session.id
                  ? ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 20px 8px rgba(59, 130, 246, 0.4)', '0 0 0 0 rgba(59, 130, 246, 0)']
                  : '0 0 0 0 rgba(0, 0, 0, 0)'
              }}
              transition={{
                boxShadow: highlightSessionId === session.id ? { duration: 1.5, repeat: 2 } : {}
              }}
              className={`relative flex gap-4 group ${highlightSessionId === session.id ? 'ring-2 ring-blue-400 ring-offset-2 rounded-lg' : ''}`}
            >
              {/* Timeline column — dot (with status icon) + vertical line */}
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
                    {/* Headline: session title */}
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {getSessionTypeLabel(session.session_type, session.custom_session_type)}
                    </p>

                    {/* Sub-line: relative date + time */}
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="text-gray-700 font-medium">{dateHeadline(startTime)}</span>
                      <span className="text-gray-400"> · </span>
                      <span className="font-medium">{format(startTime, 'h:mm a')}</span>
                    </p>

                    {/* Meta row: format · duration · series chip · attendee · reschedule banner · awaiting flag */}
                    <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        {session.session_format === 'in_person'
                          ? <><Building2 className="w-3 h-3" /> {locale === 'fr' ? 'En personne' : 'In Person'}</>
                          : session.session_format === 'phone'
                          ? <><Phone className="w-3 h-3" /> {locale === 'fr' ? 'Téléphone' : 'Phone'}</>
                          : <><Video className="w-3 h-3" /> {locale === 'fr' ? 'Vidéo' : 'Virtual'}</>}
                      </span>
                      <span className="text-gray-500 tabular-nums">{durMin} {t.members.sessions.minutes}</span>
                      {/* Origin chip — Google Calendar / Manual */}
                      {isGoogleSynced ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[10px]"
                          title={locale === 'fr' ? 'Synchronisé avec Google Agenda' : 'Synced with Google Calendar'}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          {locale === 'fr' ? 'Google Agenda' : 'Google Calendar'}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium text-[10px]"
                          title={locale === 'fr' ? 'Séance manuelle — non synchronisée avec Google Agenda' : 'Manual session — not synced with Google Calendar'}
                        >
                          {locale === 'fr' ? 'Manuelle' : 'Manual'}
                        </span>
                      )}
                      {/* "Confirmed" badge removed — every upcoming session is
                          confirmed by default; the tag added noise next to
                          the "Completed" tag we use post-session. */}
                      {session.series_id && session.series_position && session.series_total && (
                        <button
                          type="button"
                          onClick={() => setViewingSeriesId(session.series_id!)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium text-[10px] transition-colors"
                          title={locale === 'fr' ? 'Voir la série' : 'View series'}
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          {locale === 'fr'
                            ? `Séance ${session.series_position}/${session.series_total}`
                            : `Session ${session.series_position}/${session.series_total}`}
                        </button>
                      )}
                      {session.attendee_status === 'declined' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium text-[10px]" title={locale === 'fr' ? 'Le patient a refusé l\'invitation' : 'Patient declined the invite'}>
                          <X className="w-2.5 h-2.5" />
                          {locale === 'fr' ? 'Refusé' : 'Declined'}
                        </span>
                      )}
                      {session.attendee_status === 'tentative' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-[10px]" title={locale === 'fr' ? 'Réponse provisoire du patient' : 'Patient marked as tentative'}>
                          {locale === 'fr' ? 'Provisoire' : 'Tentative'}
                        </span>
                      )}
                      {hasRescheduleRequest && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-[10px]" title={session.reschedule_reason || undefined}>
                          <AlertCircle className="w-2.5 h-2.5" />
                          {locale === 'fr' ? 'Report demandé' : 'Reschedule requested'}
                        </span>
                      )}
                      {hasPendingProposal && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium text-[10px]">
                          <MessageSquare className="w-2.5 h-2.5" />
                          {locale === 'fr' ? 'Réponse en attente' : 'Awaiting member'}
                        </span>
                      )}
                      {session.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px]">
                          {locale === 'fr' ? 'Terminée' : 'Completed'}
                        </span>
                      )}
                      {session.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium text-[10px]">
                          {locale === 'fr' ? 'Annulée' : 'Cancelled'}
                        </span>
                      )}
                      {session.status === 'no_show' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium text-[10px]">
                          {locale === 'fr' ? 'Absent' : 'No show'}
                        </span>
                      )}
                      {isAwaitingOutcome && (
                        <span className="text-orange-600 font-medium">{locale === 'fr' ? 'En attente du statut' : 'Awaiting outcome'}</span>
                      )}
                    </div>

                    {/* Cancellation reason — inline */}
                    {(session.status === 'cancelled' || session.status === 'no_show') && session.cancellation_reason && (
                      <p className="text-xs text-red-500 mt-2">
                        {({
                          client_request: locale === 'fr' ? 'Demande du patient' : 'Client request',
                          practitioner_unavailable: locale === 'fr' ? 'Praticien indisponible' : 'Practitioner unavailable',
                          scheduling_conflict: locale === 'fr' ? 'Conflit d\'agenda' : 'Scheduling conflict',
                          illness: locale === 'fr' ? 'Maladie' : 'Illness',
                          personal_reasons: locale === 'fr' ? 'Raisons personnelles' : 'Personal reasons',
                          rescheduled: locale === 'fr' ? 'Reprogrammée' : 'Rescheduled',
                          no_communication: locale === 'fr' ? 'Aucune communication' : 'No communication',
                          forgot: locale === 'fr' ? 'Patient a oublié' : 'Client forgot',
                          late_cancellation: locale === 'fr' ? 'Annulation tardive' : 'Late cancellation',
                          technical_issue: locale === 'fr' ? 'Problème technique' : 'Technical issue',
                          emergency: locale === 'fr' ? 'Urgence' : 'Emergency',
                          other: locale === 'fr' ? 'Autre' : 'Other',
                        } as Record<string, string>)[session.cancellation_reason] || session.cancellation_reason}
                      </p>
                    )}

                    {/* Summary preview (read-only, when not actively editing) */}
                    {session.summary && session.status !== 'cancelled' && session.status !== 'no_show' && editingSummarySession !== session.id && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {session.summary.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    {/* Action row — primary actions stay visible */}
                    {(isFutureScheduled || isAwaitingOutcome) && (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {isFutureScheduled && meetLink && (
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            {locale === 'fr' ? 'Rejoindre' : 'Join'}
                          </a>
                        )}
                        {/* Awaiting-outcome rows get a glowing Close
                            session call-to-action right before Take notes
                            so the practitioner can't miss it. */}
                        {isAwaitingOutcome && (
                          <span className="relative inline-flex rounded-md">
                            <span
                              className="absolute inset-0 rounded-md bg-amber-400 opacity-40 animate-ping"
                              style={{ animationDuration: '2s' }}
                            />
                            <button
                              type="button"
                              onClick={() => openClosePopup(session)}
                              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-md transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {locale === 'fr' ? 'Clôturer la séance' : 'Close session'}
                            </button>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isNotesOpen) {
                              setExpandedNotes(prev => {
                                const next = new Set(prev)
                                next.delete(session.id)
                                return next
                              })
                              if (editingSummarySession === session.id) {
                                setEditingSummarySession(null)
                                setSummaryDraft('')
                              }
                            } else {
                              setExpandedNotes(prev => {
                                const next = new Set(prev)
                                next.add(session.id)
                                return next
                              })
                              setEditingSummarySession(session.id)
                              setSummaryDraft(sessionSummaryNotes[session.id]?.content || '')
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
                        >
                          <PenLine className="w-3.5 h-3.5 text-gray-500" />
                          {locale === 'fr' ? 'Prendre des notes' : 'Take notes'}
                        </button>
                        <PaymentBadge
                          status={session.payment_status || 'unpaid'}
                          table={recordTable}
                          recordId={recordId}
                        />
                      </div>
                    )}

                    {/* Past/completed/cancelled: View notes if a note
                        exists, otherwise Take notes + "No notes" label. */}
                    {!isFutureScheduled && !isAwaitingOutcome && (() => {
                      const hasNote = !!sessionSummaryNotes[session.id]?.content
                      return (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {hasNote ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isNotesOpen) {
                                  setExpandedNotes(prev => {
                                    const next = new Set(prev)
                                    next.delete(session.id)
                                    return next
                                  })
                                  if (editingSummarySession === session.id) {
                                    setEditingSummarySession(null)
                                    setSummaryDraft('')
                                  }
                                } else {
                                  setExpandedNotes(prev => {
                                    const next = new Set(prev)
                                    next.add(session.id)
                                    return next
                                  })
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-gray-500" />
                              {isNotesOpen
                                ? (locale === 'fr' ? 'Masquer les notes' : 'Hide notes')
                                : (locale === 'fr' ? 'Voir les notes' : 'View notes')}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedNotes(prev => {
                                    const next = new Set(prev)
                                    next.add(session.id)
                                    return next
                                  })
                                  setEditingSummarySession(session.id)
                                  setSummaryDraft('')
                                }}
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
                          <PaymentBadge
                            status={session.payment_status || 'unpaid'}
                            table={recordTable}
                            recordId={recordId}
                          />
                        </div>
                      )
                    })()}

                    {/* The "Session N/Y" chip in the meta row above is
                        already clickable and opens the SeriesDetailDrawer
                        — no separate "View all sessions" button needed. */}

                    {/* Inline session-note editor — toggled by "Take notes" or via menu */}
                    {editingSummarySession === session.id && (
                      <div className="mt-3">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <RichTextEditor
                            value={summaryDraft}
                            onChange={setSummaryDraft}
                            placeholder={locale === 'fr' ? 'Rédigez votre note de séance...' : 'Write your session note...'}
                            memberId={memberId}
                            locale={locale}
                            autoFocus
                            milestones={milestones}
                            noteTypes={editorNoteTypes}
                            lockedTypes={FIXED_NOTE_TYPES as unknown as string[]}
                            onAddType={handleEditorAddType}
                            onRenameType={handleEditorRenameType}
                            onDeleteType={handleEditorDeleteType}
                            getTagNoteCount={getTagNoteCount}
                            maxTypes={Math.max(7, editorNoteTypes.length)}
                            memberName={member?.first_name}
                          />
                          <div className="flex items-center justify-end gap-2 px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingSummarySession(null); setSummaryDraft('') }}
                              className="h-8 px-3 text-gray-500 hover:text-gray-700 rounded-lg"
                            >
                              {locale === 'fr' ? 'Annuler' : 'Cancel'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveSessionSummary(session.id, summaryDraft)}
                              disabled={savingSummary || (!summaryDraft.replace(/<[^>]*>/g, '').trim() && !sessionSummaryNotes[session.id])}
                              className="h-8 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                            >
                              {savingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Saved note viewer — only for completed/no_show, expanded via Take notes toggle */}
                    {sessionSummaryNotes[session.id] && editingSummarySession !== session.id && expandedNotes.has(session.id) && (
                      <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3">
                        <MarkdownRenderer
                          content={sessionSummaryNotes[session.id]?.content || ''}
                          onContentChange={(html) => handleSaveSessionSummary(session.id, html)}
                          onEdit={() => {
                            setEditingSummarySession(session.id)
                            setSummaryDraft(sessionSummaryNotes[session.id]?.content || '')
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Three-dot menu — every other action lives here */}
                  <div className="flex items-center gap-2 shrink-0">
                    <RowMenu items={menuItems} />
                  </div>
                </div>
              </div>
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
                  { key: 'scheduled', label: locale === 'fr' ? 'Planifiée' : 'Scheduled' },
                  { key: 'awaiting',  label: locale === 'fr' ? 'En attente' : 'Awaiting' },
                  { key: 'completed', label: locale === 'fr' ? 'Terminée' : 'Completed' },
                  { key: 'cancelled', label: locale === 'fr' ? 'Annulée' : 'Cancelled' },
                  { key: 'no_show',   label: locale === 'fr' ? 'Absent' : 'No-show' },
                ]}
                statusFilters={statusFilters}
                onStatusFiltersChange={setStatusFilters}
                typeOptions={(() => {
                  // Use the practitioner's configured session types from
                  // booking_settings — that's the canonical list. Fall
                  // back to types derived from existing sessions if the
                  // practitioner hasn't configured any yet.
                  const labels = t.members.sessionTypes as Record<string, string>
                  if (configuredSessionTypes.length > 0) {
                    return configuredSessionTypes
                      .map(st => ({
                        key: st.name,
                        label: locale === 'fr' ? (st.name_fr || st.name) : st.name,
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label))
                  }
                  const seen = new Set<string>()
                  const opts: { key: string; label: string }[] = []
                  for (const s of sessions) {
                    const key = s.session_type as string
                    if (!key || seen.has(key)) continue
                    seen.add(key)
                    opts.push({ key, label: labels[key] || key })
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
                locale={locale}
                onReset={resetFilters}
              />
            </section>

            {/* ── Up next ── */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6">
              <header className="flex items-center justify-between mb-5">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{locale === 'fr' ? 'À venir' : 'Up next'}</h2>
                  <span className="text-sm text-gray-400 tabular-nums">{upcomingSessions.length}</span>
                </div>
                <SessionDotLegend />
              </header>

              {/* Add Session CTA — kept at the top of the timeline */}
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="w-full mb-4 p-3 rounded-xl border border-dashed border-gray-300 hover:border-gray-900 bg-gray-50/40 hover:bg-gray-50 transition-all group flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 group-hover:border-gray-900 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                  {t.members.sessions.addSession}
                </span>
              </button>

              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-gray-400">{t.members.sessions.noUpcoming}</p>
              ) : (
                <div>
                  {upcomingSessions.map((s, i) => renderRow(s, i, i === upcomingSessions.length - 1))}
                </div>
              )}
            </section>

            {/* ── History ── */}
            <section
              id="past-sessions-section"
              className={`bg-white rounded-2xl border border-gray-200 p-6 ${
                highlightSessionId === 'past-sessions-section' ? 'ring-2 ring-blue-400 ring-offset-2' : ''
              }`}
            >
              <header className="flex items-center justify-between mb-5">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{locale === 'fr' ? 'Historique' : 'History'}</h2>
                  <span className="text-sm text-gray-400 tabular-nums">{pastSessions.length}</span>
                </div>
                <SessionDotLegend />
              </header>
              {pastSessions.length === 0 ? (
                <p className="text-sm text-gray-400">{t.members.sessions.noPast}</p>
              ) : (
                <div>
                  {pastSessions.map((s, i) => renderRow(s, i, i === pastSessions.length - 1))}
                </div>
              )}
            </section>
          </div>
        )
      })()}


      {/* Delete confirmation — the only flow still routed through this
          dialog. Status changes (complete/cancel/no_show) all go through
          the Close session popup. */}
      {confirmAction && (() => {
        return (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!confirmDeleting) setConfirmAction(null) }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {locale === 'fr' ? 'Supprimer cette séance ?' : 'Delete this session?'}
            </h3>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              {locale === 'fr' ? 'Cette action est irréversible.' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
                disabled={confirmDeleting}
                className="rounded-xl"
              >
                {locale === 'fr' ? 'Retour' : 'Back'}
              </Button>
              <Button
                onClick={async () => {
                  if (confirmDeleting) return
                  setConfirmDeleting(true)
                  try {
                    await handleDeleteSession(confirmAction.sessionId)
                  } finally {
                    setConfirmDeleting(false)
                    setConfirmAction(null)
                  }
                }}
                disabled={confirmDeleting}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-80 disabled:cursor-not-allowed min-w-[88px]"
              >
                {confirmDeleting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {locale === 'fr' ? 'Suppression…' : 'Deleting…'}
                  </span>
                ) : (
                  locale === 'fr' ? 'Supprimer' : 'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Notes-decision modal — surfaces only when deleting a session
          that has linked progress_notes. "Keep notes" is the primary
          (recoverable) action; "Delete notes" is destructive. */}
      {notesPrompt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setNotesPrompt(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button — replaces the previous "Retour" footer
                button which used to overflow on narrow widths. */}
            <button
              type="button"
              onClick={() => setNotesPrompt(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={locale === 'fr' ? 'Fermer' : locale === 'es' ? 'Cerrar' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <StickyNote className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr'
                    ? (notesPrompt.count > 1
                        ? `${notesPrompt.count} notes sont liées à cette séance`
                        : 'Une note est liée à cette séance')
                    : locale === 'es'
                      ? (notesPrompt.count > 1
                          ? `${notesPrompt.count} notas están vinculadas a esta sesión`
                          : 'Una nota está vinculada a esta sesión')
                      : (notesPrompt.count > 1
                          ? `${notesPrompt.count} notes are linked to this session`
                          : 'A note is linked to this session')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {locale === 'fr'
                    ? (notesPrompt.count > 1
                        ? 'Souhaitez-vous également supprimer les notes liées à cette séance ?'
                        : 'Souhaitez-vous également supprimer la note liée à cette séance ?')
                    : locale === 'es'
                      ? (notesPrompt.count > 1
                          ? '¿Deseas eliminar también las notas vinculadas a esta sesión?'
                          : '¿Deseas eliminar también la nota vinculada a esta sesión?')
                      : (notesPrompt.count > 1
                          ? 'Do you also want to delete the notes linked to this session?'
                          : 'Do you also want to delete the note linked to this session?')}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-5">
              <Button
                variant="outline"
                onClick={() => deleteSessionAndNotes(notesPrompt.sessionId, 'delete')}
                className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Supprimer' : locale === 'es' ? 'Eliminar' : 'Delete'}
              </Button>
              <Button
                onClick={() => deleteSessionAndNotes(notesPrompt.sessionId, 'keep')}
                className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Conserver' : locale === 'es' ? 'Conservar' : 'Keep'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Close session popup — single dialog. Top asks Show vs
          No-show, then reveals the matching branch. ─── */}
      {closePopupSession && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={closeClosePopup}
        >
          <div
            // Widen the popup when the inline RichTextEditor is open —
            // the toolbar needs more room than the standard md width.
            className={`bg-white rounded-2xl shadow-xl w-full p-6 max-h-[90vh] overflow-y-auto transition-[max-width] duration-200 ${
              closePopupOutcome === 'show' && showPopupNoteAction === 'take'
                ? 'max-w-2xl'
                : 'max-w-md'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {(() => {
                  const editing = closePopupSession.status !== 'scheduled'
                  return locale === 'fr'
                    ? editing ? 'Modifier la clôture' : 'Clôturer la séance'
                    : editing ? 'Edit close' : 'Close session'
                })()}
              </h3>
              <button
                type="button"
                onClick={closeClosePopup}
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
                        onClick={() => setShowPopupPayment(opt)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          showPopupPayment === opt
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

                {/* Section 2 — Note */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    {locale === 'fr' ? 'Note de séance' : 'Session note'}
                  </p>
                  {showPopupNoteAction === 'has' ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>{locale === 'fr' ? 'Note déjà ajoutée' : 'Note already added'}</span>
                    </div>
                  ) : showPopupNoteAction === 'take' ? (
                    <div>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <RichTextEditor
                          value={showPopupNoteDraft}
                          onChange={setShowPopupNoteDraft}
                          placeholder={locale === 'fr' ? 'Rédigez votre note de séance...' : 'Write your session note...'}
                          memberId={memberId}
                          locale={locale}
                          autoFocus
                          milestones={milestones}
                          noteTypes={editorNoteTypes}
                          lockedTypes={FIXED_NOTE_TYPES as unknown as string[]}
                          onAddType={handleEditorAddType}
                          onRenameType={handleEditorRenameType}
                          onDeleteType={handleEditorDeleteType}
                          getTagNoteCount={getTagNoteCount}
                          maxTypes={Math.max(7, editorNoteTypes.length)}
                          memberName={member?.first_name}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowPopupNoteAction('skip'); setShowPopupNoteDraft('') }}
                        className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                      >
                        {locale === 'fr' ? '← Sans note' : '← No note'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPopupNoteAction('take')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <PenLine className="w-4 h-4 text-gray-500" />
                        {locale === 'fr' ? 'Prendre des notes' : 'Take notes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPopupNoteAction('skip')}
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
                        onClick={() => setNoShowPopupPayment(opt)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                          noShowPopupPayment === opt
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
                    value={noShowPopupReason}
                    onChange={(e) => setNoShowPopupReason(e.target.value)}
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
                    value={noShowPopupComments}
                    onChange={(e) => setNoShowPopupComments(e.target.value)}
                    placeholder={locale === 'fr' ? 'Commentaires supplémentaires (optionnel)' : 'Additional comments (optional)'}
                    rows={3}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closeClosePopup} disabled={closePopupSaving}>
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                onClick={confirmClosePopup}
                disabled={
                  closePopupSaving ||
                  !closePopupOutcome ||
                  (closePopupOutcome === 'show'   && (showPopupPayment === null || showPopupNoteAction === null)) ||
                  (closePopupOutcome === 'no_show' && (noShowPopupPayment === null || !noShowPopupReason))
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
      {scheduleNextPromptOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setScheduleNextPromptOpen(false)}
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
                ? `Voulez-vous planifier une nouvelle séance avec ${member.first_name} maintenant ?`
                : `Would you like to schedule a new session with ${member.first_name} now?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setScheduleNextPromptOpen(false)}
              >
                {locale === 'fr' ? 'Non' : 'No'}
              </Button>
              <Button
                onClick={() => { setScheduleNextPromptOpen(false); setShowScheduleModal(true) }}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {locale === 'fr' ? 'Oui, planifier' : 'Yes, schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal (shared component). For already-closed sessions
          this becomes the single unified "Edit" — outcome + payment + details
          — replacing the separate "Edit close". */}
      <EditSessionModal
        session={editingSession}
        onClose={handleCancelEdit}
        onSave={onSessionsUpdate}
        showOutcome={!!editingSession && editingSession.status !== 'scheduled'}
      />

      {/* Series detail drawer — opens from the violet "Session N/Y" badge */}
      <SeriesDetailDrawer
        isOpen={!!viewingSeriesId}
        onClose={() => setViewingSeriesId(null)}
        sessions={viewingSeriesId ? sessions.filter(s => s.series_id === viewingSeriesId) : []}
        memberName={`${member.first_name} ${member.last_name}`}
        locale={locale as 'en' | 'fr' | 'es'}
      />

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          notifyMutation()
        }}
        preselectedMember={member}
      />

      {/* Reschedule Modal */}
      <ScheduleSessionModal
        isOpen={!!rescheduleSession}
        onClose={() => setRescheduleSession(null)}
        onSuccess={() => {
          setRescheduleSession(null)
          notifyMutation()
          // Refetch so a second reschedule attempt can locate the
          // booking by its new start_time instead of using stale rows.
          refetchBookings()
        }}
        rescheduleBooking={rescheduleSession}
      />

      {/* Propose New Date Modal */}
      <AnimatePresence>
        {proposingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50  z-50 flex items-center justify-center p-4"
            onClick={() => setProposingSession(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-500" />
                  Propose New Date
                </h2>
                <button
                  onClick={() => setProposingSession(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Current Session Info */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Current session scheduled for:</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {new Date(proposingSession.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Member's Suggested Date (if any) */}
                {proposingSession.member_suggested_date && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4" />
                      Member suggested:
                    </p>
                    <p className="font-semibold text-amber-800 mt-1">
                      {new Date(proposingSession.member_suggested_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}

                {/* Proposed Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Propose a new date
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none bg-white"
                  />
                </div>

                {/* Proposed Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed time
                  </label>
                  <TimeSelect
                    value={proposedTime || '09:00'}
                    onChange={(v) => setProposedTime(v)}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => setProposingSession(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProposeNewDate}
                  disabled={proposalSaving || !proposedDate || !proposedTime}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-amber-300/50"
                >
                  {proposalSaving ? 'Sending...' : 'Send Proposal'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
