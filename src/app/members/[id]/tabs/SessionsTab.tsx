'use client'

import { useState, useEffect, useRef } from 'react'
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
  XCircle,
  Ban,
  StickyNote,
} from 'lucide-react'
import { format, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isBefore, isAfter } from 'date-fns'
import { Button } from '@/components/ui/button'
import { TimeSelect } from '@/components/ui/time-select'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { MarkdownRenderer } from '@/components/notes/MarkdownRenderer'
import type { Session, SessionType, SessionFormat, SessionStatus, Member } from '@/types/member'
import { DEFAULT_NOTE_TYPES } from '@/types/member'

interface SessionsTabProps {
  memberId: string
  member: Member
  sessions: Session[]
  onSessionsUpdate: () => void
  highlightSessionId?: string
}

export default function SessionsTab({ memberId, member, sessions, onSessionsUpdate, highlightSessionId }: SessionsTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  // Pending bookings for this member
  const [pendingBookings, setPendingBookings] = useState<any[]>([])

  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('member_id', memberId)
        .in('status', ['pending', 'confirmed'])
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
      setPendingBookings(data || [])
    }
    fetchBookings()
  }, [memberId])

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
    const booking = pendingBookings.find(b => b.id === bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: action })
      .eq('id', bookingId)
    if (!error) {
      // When confirming, also create a session record so it shows in the sessions list
      if (action === 'confirmed' && booking) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const duration = Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000)
          const { error: sessionError } = await supabase.from('sessions').insert({
            member_id: memberId,
            practitioner_id: authUser.id,
            session_type: 'follow_up',
            session_format: 'in_person',
            scheduled_at: booking.start_time,
            duration_minutes: duration,
            status: 'scheduled',
            notes: booking.notes || null,
          })
          if (sessionError) console.error('Failed to create session:', sessionError)
          onSessionsUpdate() // refresh sessions list
        }
      }
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId))
      toast.success(action === 'confirmed'
        ? (locale === 'fr' ? 'Séance confirmée' : 'Session confirmed')
        : (locale === 'fr' ? 'Séance refusée' : 'Session rejected'))
    }
  }

  const [showAddSession, setShowAddSession] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
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
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ sessionId: string; action: 'complete' | 'cancel' | 'no_show' | 'delete' } | null>(null)
  const [confirmReason, setConfirmReason] = useState('')
  const [confirmNotes, setConfirmNotes] = useState('')

  // Reschedule proposal state
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


  // Session summary note editing state
  const [editingSummarySession, setEditingSummarySession] = useState<string | null>(null)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())


  // Scroll to highlighted session or section
  useEffect(() => {
    if (highlightSessionId) {
      // Wait for the DOM to update
      setTimeout(() => {
        // Handle special case for past-sessions-section
        const elementId = highlightSessionId === 'past-sessions-section'
          ? 'past-sessions-section'
          : `session-${highlightSessionId}`
        const element = document.getElementById(elementId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
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

  // Build note types list for inline tagging
  useEffect(() => {
    const buildNoteTypes = async () => {
      const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined

      // Start with defaults
      const types: { type: string; label: string }[] = DEFAULT_NOTE_TYPES.map(nt => ({
        type: nt,
        label: noteTypeLabels?.[nt] || nt,
      }))

      // Fetch custom note types
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('custom_note_types')
          .select('type_name')
          .eq('practitioner_id', user.id)
          .order('created_at')

        if (data) {
          for (const d of data) {
            if (!types.some(existing => existing.type === d.type_name)) {
              types.push({ type: d.type_name, label: noteTypeLabels?.[d.type_name] || d.type_name.replace(/_/g, ' ') })
            }
          }
        }
      }

      setEditorNoteTypes(types)
    }
    buildNoteTypes()
  }, [supabase, t])

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
    if (!content.trim()) return

    setSavingSummary(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existing = sessionSummaryNotes[sessionId]

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

  const upcomingSessions = sessions.filter(s =>
    s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date()
  )
  const pastSessions = sessions.filter(s =>
    s.status !== 'scheduled' || new Date(s.scheduled_at) < new Date()
  )

  const handleAddSession = async () => {
    if (!scheduledAt) {
      toast.error('Please select a date and time')
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
      onSessionsUpdate()
    } catch (error) {
      console.error('Error adding session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (sessionId: string, newStatus: SessionStatus, reason?: string, notes?: string) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
      if (reason) updateData.cancellation_reason = reason
      if (notes) updateData.notes = (notes || '').trim() || null
      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)

      if (error) throw error

      toast.success(t.members.success.sessionUpdated)
      onSessionsUpdate()
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
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
      onSessionsUpdate()
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      toast.success('Session deleted')
      setDeletingSessionId(null)
      onSessionsUpdate()
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Failed to delete session')
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
      toast.error('Please select a date and time')
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

      toast.success('New date proposed to member')
      setProposingSession(null)
      setProposedDate('')
      setProposedTime('')
      onSessionsUpdate()
    } catch (error) {
      console.error('Error proposing new date:', error)
      toast.error('Failed to propose new date')
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

      toast.success('Reschedule accepted - session updated to member\'s suggested date')
      onSessionsUpdate()
    } catch (error) {
      console.error('Error accepting reschedule:', error)
      toast.error('Failed to accept reschedule')
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

      toast.success('Reschedule request declined')
      onSessionsUpdate()
    } catch (error) {
      console.error('Error declining reschedule:', error)
      toast.error('Failed to decline reschedule')
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center ">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          {t.members.sessions.title}
        </h2>
        <Button
          onClick={() => setShowScheduleModal(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg transition-colors hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.members.sessions.addSession}
        </Button>
      </div>

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

      {/* Upcoming Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6  border border-gray-200 hover-lift"
      >
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          {t.members.sessions.upcomingSessions}
          {upcomingSessions.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              {upcomingSessions.length}
            </span>
          )}
        </h3>

        {upcomingSessions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ">
              <Calendar className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">{t.members.sessions.noUpcoming}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session, index) => {
              const FormatIcon = formatIcon[session.session_format]
              const hasRescheduleRequest = session.reschedule_requested && session.reschedule_status === 'pending'
              const hasPendingProposal = session.reschedule_status === 'proposed'
              return (
                <motion.div
                  key={session.id}
                  id={`session-${session.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    boxShadow: highlightSessionId === session.id
                      ? ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 20px 8px rgba(59, 130, 246, 0.4)', '0 0 0 0 rgba(59, 130, 246, 0)']
                      : '0 0 0 0 rgba(0, 0, 0, 0)'
                  }}
                  transition={{
                    delay: 0.05 * index,
                    boxShadow: highlightSessionId === session.id ? { duration: 1.5, repeat: 2 } : {}
                  }}
                  className={`p-5 rounded-2xl bg-gradient-to-r ${
                    hasRescheduleRequest
                      ? 'from-amber-50/80 to-amber-100/50 border-amber-300/60'
                      : hasPendingProposal
                      ? 'from-purple-50/80 to-purple-100/50 border-purple-300/60'
                      : 'from-blue-50/80 to-blue-100/50 border-blue-200/50'
                  } border hover:shadow-lg transition-all group ${
                    highlightSessionId === session.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                  }`}
                >
                  {/* Reschedule Request Banner */}
                  {hasRescheduleRequest && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-100/80 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-800 text-sm">Reschedule Requested</p>
                          {session.reschedule_reason && (
                            <p className="text-sm text-amber-700 mt-1">
                              <span className="font-medium">Reason:</span> {session.reschedule_reason}
                            </p>
                          )}
                          {session.member_suggested_date && (
                            <p className="text-sm text-amber-700 mt-1 flex items-center gap-1">
                              <CalendarCheck className="w-4 h-4" />
                              <span className="font-medium">Suggested:</span>{' '}
                              {new Date(session.member_suggested_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            {session.member_suggested_date && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptReschedule(session)}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs h-8"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Accept Suggested Date
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenProposal(session)}
                              className="border-amber-400 text-amber-700 hover:bg-amber-50 rounded-lg text-xs h-8"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              Propose New Date
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeclineReschedule(session.id)}
                              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs h-8"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending Proposal Banner */}
                  {hasPendingProposal && (
                    <div className="mb-4 p-3 rounded-xl bg-purple-100/80 border border-purple-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-purple-800 text-sm">Awaiting Member Response</p>
                          {session.practitioner_proposed_date && (
                            <p className="text-sm text-purple-700 mt-1">
                              <span className="font-medium">Proposed:</span>{' '}
                              {new Date(session.practitioner_proposed_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        hasRescheduleRequest
                          ? 'from-amber-100 to-amber-200'
                          : hasPendingProposal
                          ? 'from-purple-100 to-purple-200'
                          : 'from-blue-100 to-blue-200'
                      } flex items-center justify-center `}>
                        <FormatIcon className={`w-6 h-6 ${
                          hasRescheduleRequest
                            ? 'text-amber-600'
                            : hasPendingProposal
                            ? 'text-purple-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {t.members.sessionTypes[session.session_type]}
                          </p>
                          {session.member_confirmed && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Confirmed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(session.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                            {session.duration_minutes} {t.members.sessions.minutes}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                            {t.members.sessionFormats[session.session_format]}
                          </span>
                        </div>

                        {session.summary && (
                          <div className="mt-3 p-3 rounded-xl bg-white/60 border border-blue-100">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Summary</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {session.summary?.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSummarySession(editingSummarySession === session.id ? null : session.id)
                          setSummaryDraft(sessionSummaryNotes[session.id]?.content || '')
                        }}
                        className="h-10 w-10 p-0 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                        title={locale === 'fr' ? 'Notes de séance' : 'Session notes'}
                      >
                        <StickyNote className="w-5 h-5" />
                      </Button>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActionMenuId(actionMenuId === session.id ? null : session.id)}
                        className="h-10 w-10 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                      {actionMenuId === session.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => { setActionMenuId(null); handleStartEdit(session) }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4 text-gray-400" />
                              {locale === 'fr' ? 'Modifier' : 'Edit'}
                            </button>
                            <button
                              onClick={() => { setActionMenuId(null); setConfirmAction({ sessionId: session.id, action: 'complete' }) }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              {locale === 'fr' ? 'Marquer terminée' : 'Mark as completed'}
                            </button>
                            <button
                              onClick={() => { setActionMenuId(null); setConfirmAction({ sessionId: session.id, action: 'cancel' }) }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4 text-orange-500" />
                              {locale === 'fr' ? 'Annuler la séance' : 'Cancel session'}
                            </button>
                            <button
                              onClick={() => { setActionMenuId(null); setConfirmAction({ sessionId: session.id, action: 'no_show' }) }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Ban className="w-4 h-4 text-amber-500" />
                              {locale === 'fr' ? 'Absent' : 'No show'}
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => { setActionMenuId(null); setConfirmAction({ sessionId: session.id, action: 'delete' }) }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              {locale === 'fr' ? 'Supprimer' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  </div>

                  {/* Saved note indicator */}
                  {sessionSummaryNotes[session.id] && editingSummarySession !== session.id && (
                    <div className="mt-3 pl-12">
                      <button
                        onClick={() => { setEditingSummarySession(session.id); setSummaryDraft(sessionSummaryNotes[session.id]?.content || '') }}
                        className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Voir la note' : 'View note'}
                      </button>
                    </div>
                  )}

                  {/* Inline Session Note editor for upcoming */}
                  {editingSummarySession === session.id && (
                    <div className="mt-3 pl-12">
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
                            disabled={savingSummary || !summaryDraft.replace(/<[^>]*>/g, '').trim()}
                            className="h-8 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                          >
                            {savingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Past Sessions */}
      <motion.div
        id="past-sessions-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          boxShadow: highlightSessionId === 'past-sessions-section'
            ? ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 20px 8px rgba(59, 130, 246, 0.4)', '0 0 0 0 rgba(59, 130, 246, 0)']
            : '0 0 0 0 rgba(0, 0, 0, 0)'
        }}
        transition={{
          delay: 0.1,
          boxShadow: highlightSessionId === 'past-sessions-section' ? { duration: 1.5, repeat: 2 } : {}
        }}
        className={`bg-white rounded-2xl p-6 border border-gray-200 ${
          highlightSessionId === 'past-sessions-section' ? 'ring-2 ring-blue-400 ring-offset-2' : ''
        }`}
      >
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ">
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          {t.members.sessions.pastSessions}
          {pastSessions.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              {pastSessions.length}
            </span>
          )}
        </h3>

        {pastSessions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ">
              <Clock className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">{t.members.sessions.noPast}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastSessions.map((session, index) => {
              const FormatIcon = formatIcon[session.session_format]
              const statusStyle = statusStyles[session.status]
              return (
                <motion.div
                  key={session.id}
                  id={`session-${session.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    boxShadow: highlightSessionId === session.id
                      ? ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 20px 8px rgba(59, 130, 246, 0.4)', '0 0 0 0 rgba(59, 130, 246, 0)']
                      : '0 0 0 0 rgba(0, 0, 0, 0)'
                  }}
                  transition={{
                    delay: 0.03 * index,
                    boxShadow: highlightSessionId === session.id ? { duration: 1.5, repeat: 2 } : {}
                  }}
                  className={`p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group ${
                    highlightSessionId === session.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                        <FormatIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">
                            {t.members.sessionTypes[session.session_type]}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {t.members.sessionStatus[session.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>
                            {new Date(session.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span>·</span>
                          <span>{session.duration_minutes} {t.members.sessions.minutes}</span>
                          <span>·</span>
                          <span>{t.members.sessionFormats[session.session_format]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(session)}
                        className="h-8 px-2 text-xs text-blue-600 hover:bg-white rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      {deletingSessionId === session.id ? (
                        <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600">Delete?</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 rounded-md"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingSessionId(null)}
                            className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100 rounded-md"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingSessionId(session.id)}
                          className="h-8 px-2 text-xs text-gray-400 hover:text-red-500 hover:bg-white rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Cancellation reason */}
                  {(session.status === 'cancelled' || session.status === 'no_show') && (session.cancellation_reason || session.notes) && (
                    <div className="mt-3 pl-12">
                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          {session.cancellation_reason && (
                            <span className="text-gray-500 font-medium">
                              {{
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
                              }[session.cancellation_reason] || session.cancellation_reason}
                            </span>
                          )}
                          {session.cancellation_reason && session.notes && <span className="text-gray-300 mx-1">·</span>}
                          {session.notes && <span className="text-gray-400">{session.notes.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {session.summary && session.status !== 'cancelled' && session.status !== 'no_show' && (
                    <div className="mt-3 pl-12">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {session.summary?.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Inline Session Note */}
                  {(session.status === 'completed' || session.status === 'no_show') && (
                    <div className="mt-3 pl-12">
                      {editingSummarySession === session.id ? (
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
                            memberName={member?.first_name}
                          />
                          <div className="flex items-center justify-end gap-2 px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSummarySession(null)
                                setSummaryDraft('')
                              }}
                              className="h-8 px-3 text-gray-500 hover:text-gray-700 rounded-lg"
                            >
                              {locale === 'fr' ? 'Annuler' : 'Cancel'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveSessionSummary(session.id, summaryDraft)}
                              disabled={savingSummary || !summaryDraft.replace(/<[^>]*>/g, '').trim()}
                              className="h-8 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                            >
                              {savingSummary ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                locale === 'fr' ? 'Enregistrer' : 'Save'
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : sessionSummaryNotes[session.id] ? (
                        <div>
                          <button
                            onClick={() => setExpandedNotes(prev => {
                              const next = new Set(prev)
                              if (next.has(session.id)) next.delete(session.id)
                              else next.add(session.id)
                              return next
                            })}
                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {expandedNotes.has(session.id)
                              ? (locale === 'fr' ? 'Masquer la note' : 'Hide note')
                              : (locale === 'fr' ? 'Voir la note' : 'View note')}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedNotes.has(session.id) ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {expandedNotes.has(session.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 bg-white border border-gray-200 rounded-xl p-3">
                                  <MarkdownRenderer
                                    content={sessionSummaryNotes[session.id]?.content || ''}
                                    onContentChange={(html) => handleSaveSessionSummary(session.id, html)}
                                    onEdit={() => {
                                      setEditingSummarySession(session.id)
                                      setSummaryDraft(sessionSummaryNotes[session.id]?.content || '')
                                    }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSummarySession(session.id)
                            setSummaryDraft('')
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          {locale === 'fr' ? 'Rédiger une note de séance' : 'Write session note'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show action buttons for past sessions still marked as scheduled */}
                  {session.status === 'scheduled' && new Date(session.scheduled_at) < new Date() && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(session.id, 'completed')}
                        className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {t.members.sessions.markComplete}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(session.id, 'no_show')}
                        className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-3 h-3 mr-1" />
                        {locale === 'fr' ? 'Absent' : 'No Show'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setConfirmAction(null); setConfirmReason(''); setConfirmNotes('') }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmAction.action === 'complete' ? (locale === 'fr' ? 'Marquer comme terminée ?' : 'Mark as completed?') :
               confirmAction.action === 'cancel' ? (locale === 'fr' ? 'Annuler cette séance ?' : 'Cancel this session?') :
               confirmAction.action === 'no_show' ? (locale === 'fr' ? 'Marquer comme absent ?' : 'Mark as no show?') :
               (locale === 'fr' ? 'Supprimer cette séance ?' : 'Delete this session?')}
            </h3>

            {/* Reason dropdown for cancel/no_show */}
            {(confirmAction.action === 'cancel' || confirmAction.action === 'no_show') && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Raison' : 'Reason'}
                  </label>
                  <select
                    value={confirmReason}
                    onChange={(e) => setConfirmReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white text-sm"
                  >
                    <option value="">{locale === 'fr' ? 'Sélectionner une raison...' : 'Select a reason...'}</option>
                    {confirmAction.action === 'cancel' ? (
                      <>
                        <option value="client_request">{locale === 'fr' ? 'Demande du patient' : 'Client request'}</option>
                        <option value="practitioner_unavailable">{locale === 'fr' ? 'Praticien indisponible' : 'Practitioner unavailable'}</option>
                        <option value="scheduling_conflict">{locale === 'fr' ? 'Conflit d\'agenda' : 'Scheduling conflict'}</option>
                        <option value="illness">{locale === 'fr' ? 'Maladie' : 'Illness'}</option>
                        <option value="personal_reasons">{locale === 'fr' ? 'Raisons personnelles' : 'Personal reasons'}</option>
                        <option value="rescheduled">{locale === 'fr' ? 'Reprogrammée' : 'Rescheduled'}</option>
                        <option value="other">{locale === 'fr' ? 'Autre' : 'Other'}</option>
                      </>
                    ) : (
                      <>
                        <option value="no_communication">{locale === 'fr' ? 'Aucune communication' : 'No communication'}</option>
                        <option value="forgot">{locale === 'fr' ? 'Patient a oublié' : 'Client forgot'}</option>
                        <option value="late_cancellation">{locale === 'fr' ? 'Annulation tardive' : 'Late cancellation'}</option>
                        <option value="technical_issue">{locale === 'fr' ? 'Problème technique' : 'Technical issue'}</option>
                        <option value="emergency">{locale === 'fr' ? 'Urgence' : 'Emergency'}</option>
                        <option value="other">{locale === 'fr' ? 'Autre' : 'Other'}</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Commentaire' : 'Comment'} <span className="text-gray-400 font-normal">({locale === 'fr' ? 'facultatif' : 'optional'})</span>
                  </label>
                  <textarea
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                    placeholder={locale === 'fr' ? 'Ajouter un commentaire...' : 'Add a comment...'}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* Simple message for complete/delete */}
            {confirmAction.action !== 'cancel' && confirmAction.action !== 'no_show' && (
              <p className="text-sm text-gray-500 mt-2 mb-4">
                {confirmAction.action === 'delete'
                  ? (locale === 'fr' ? 'Cette action est irréversible.' : 'This action cannot be undone.')
                  : (locale === 'fr' ? 'Vous pouvez modifier le statut ultérieurement.' : 'You can change the status later.')}
              </p>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => { setConfirmAction(null); setConfirmReason(''); setConfirmNotes('') }} className="rounded-xl">
                {locale === 'fr' ? 'Retour' : 'Back'}
              </Button>
              <Button
                onClick={async () => {
                  const status = confirmAction.action === 'complete' ? 'completed' : confirmAction.action === 'cancel' ? 'cancelled' : confirmAction.action === 'no_show' ? 'no_show' : null
                  if (confirmAction.action === 'delete') {
                    await handleDeleteSession(confirmAction.sessionId)
                  } else if (status) {
                    const reason = confirmReason || undefined
                    const notes = confirmNotes || undefined
                    await handleUpdateStatus(confirmAction.sessionId, status as SessionStatus, reason, notes)
                  }
                  setConfirmAction(null)
                  setConfirmReason('')
                  setConfirmNotes('')
                }}
                className={`rounded-xl ${confirmAction.action === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
              >
                {confirmAction.action === 'complete' ? (locale === 'fr' ? 'Confirmer' : 'Confirm') :
                 confirmAction.action === 'cancel' ? (locale === 'fr' ? 'Annuler la séance' : 'Cancel session') :
                 confirmAction.action === 'no_show' ? (locale === 'fr' ? 'Confirmer' : 'Confirm') :
                 (locale === 'fr' ? 'Supprimer' : 'Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      <AnimatePresence>
        {editingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-teal-500" />
                  {locale === 'fr' ? 'Modifier la séance' : 'Edit Session'}
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Statut' : 'Status'}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SessionStatus)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                  >
                    <option value="scheduled">{t.members.sessionStatus.scheduled}</option>
                    <option value="completed">{t.members.sessionStatus.completed}</option>
                    <option value="cancelled">{t.members.sessionStatus.cancelled}</option>
                    <option value="no_show">{t.members.sessionStatus.no_show}</option>
                  </select>
                </div>

                {/* Session Type & Format */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.members.sessions.sessionType}
                    </label>
                    <select
                      value={editSessionType}
                      onChange={(e) => setEditSessionType(e.target.value as SessionType)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
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
                      value={editSessionFormat}
                      onChange={(e) => setEditSessionFormat(e.target.value as SessionFormat)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                    >
                      <option value="in_person">{t.members.sessionFormats.in_person}</option>
                      <option value="virtual">{t.members.sessionFormats.virtual}</option>
                      <option value="phone">{t.members.sessionFormats.phone}</option>
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.duration}
                  </label>
                  <div className="flex gap-2">
                    {[30, 45, 50, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setEditDuration(d)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          editDuration === d
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* {locale === 'fr' ? 'Date et heure' : 'Date & Time'} Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Date et heure' : 'Date & Time'}
                  </label>

                  {/* Mini Calendar */}
                  <div className="border border-gray-200 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setEditCalendarMonth(subMonths(editCalendarMonth, 1))}
                        className="p-1 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium">
                        {format(editCalendarMonth, 'MMMM yyyy')}
                      </span>
                      <button
                        onClick={() => setEditCalendarMonth(addMonths(editCalendarMonth, 1))}
                        className="p-1 rounded-lg hover:bg-gray-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {(locale === 'fr' ? ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((d) => (
                        <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const monthStart = startOfMonth(editCalendarMonth)
                        const monthEnd = endOfMonth(editCalendarMonth)
                        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
                        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
                        const days: Date[] = []
                        let day = calStart
                        while (day <= calEnd) {
                          days.push(day)
                          day = addDays(day, 1)
                        }
                        return days.map((d) => {
                          const isCurrentMonth = isSameMonth(d, editCalendarMonth)
                          const isSelected = isSameDay(d, editSelectedDate)
                          return (
                            <button
                              key={d.toISOString()}
                              disabled={!isCurrentMonth}
                              onClick={() => {
                                setEditSelectedDate(startOfDay(d))
                                setEditSelectedTime(null)
                              }}
                              className={`text-xs py-1.5 rounded-lg transition-all ${
                                !isCurrentMonth ? 'text-gray-200' :
                                isSelected ? 'bg-gray-900 text-white font-medium' :
                                'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {format(d, 'd')}
                            </button>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Selected date label */}
                  <p className="text-sm text-gray-500 mb-2">
                    {format(editSelectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>

                  {/* Time picker — always show manual input, any date */}
                  {true ? (
                    <div>
                      <TimeSelect
                        value={editSelectedTime || '09:00'}
                        onChange={(v) => setEditSelectedTime(v)}
                      />
                    </div>
                  ) : editLoadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : editAvailableSlots.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-400">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                      No available slots for this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                      {editAvailableSlots.map((slot) => {
                        const slotDate = new Date(slot.slot_start)
                        const timeStr = format(slotDate, 'HH:mm')
                        const isSelected = editSelectedTime === timeStr
                        return (
                          <button
                            key={slot.slot_start}
                            onClick={() => setEditSelectedTime(timeStr)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-gray-900 text-white'
                                : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {format(slotDate, 'h:mm a')}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </label>
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder="Summary of what was discussed or accomplished..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="rounded-xl"
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg"
                >
                  {saving ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...') : (locale === 'fr' ? 'Enregistrer' : 'Save Changes')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          onSessionsUpdate()
        }}
        preselectedMember={member}
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
