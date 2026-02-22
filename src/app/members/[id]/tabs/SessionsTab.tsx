'use client'

import { useState, useEffect } from 'react'
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
  Send,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Target,
  Loader2,
} from 'lucide-react'
import { format, startOfDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isBefore } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'
import { toast } from 'sonner'
import type { Session, SessionType, SessionFormat, SessionStatus, Member } from '@/types/member'

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
  const [editNotes, setEditNotes] = useState('')
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
  }
  interface MilestoneOption {
    id: string
    title: string
    status: string
  }

  // Helper to get status label and color
  const getStatusInfo = (status: string) => {
    const info: Record<string, { en: string; fr: string; color: string; bg: string }> = {
      discovery: { en: 'Discovery', fr: 'Compréhension', color: 'text-emerald-600', bg: 'bg-emerald-100' },
      building: { en: 'Building', fr: 'Ancrage', color: 'text-emerald-700', bg: 'bg-emerald-200' },
      thriving: { en: 'Thriving', fr: 'Évolution', color: 'text-emerald-800', bg: 'bg-emerald-300' },
      independent: { en: 'Independent', fr: 'Autonomie', color: 'text-violet-700', bg: 'bg-violet-100' },
    }
    return info[status] || { en: status, fr: status, color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const getStatusLabel = (status: string) => {
    const info = getStatusInfo(status)
    return locale === 'fr' ? info.fr : info.en
  }

  // Custom dropdown state
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false)
  const [showEditMilestoneDropdown, setShowEditMilestoneDropdown] = useState(false)
  const [sessionNotes, setSessionNotes] = useState<Record<string, SessionNote[]>>({})
  const [milestones, setMilestones] = useState<MilestoneOption[]>([])
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [addingNoteToSession, setAddingNoteToSession] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('')
  const [savingNote, setSavingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [editNoteMilestoneId, setEditNoteMilestoneId] = useState<string>('')

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

  // Fetch notes for all sessions
  useEffect(() => {
    const fetchSessionNotes = async () => {
      const sessionIds = sessions.map(s => s.id)
      if (sessionIds.length === 0) return

      const { data, error } = await supabase
        .from('progress_notes')
        .select('id, content, created_at, session_id, milestone_id, milestones(title)')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const notesBySession: Record<string, SessionNote[]> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((note: any) => {
          if (note.session_id) {
            if (!notesBySession[note.session_id]) {
              notesBySession[note.session_id] = []
            }
            // Handle milestones relation - it may be an array or single object
            const milestoneData = Array.isArray(note.milestones) ? note.milestones[0] : note.milestones
            notesBySession[note.session_id].push({
              id: note.id,
              content: note.content,
              created_at: note.created_at,
              milestone_id: note.milestone_id,
              milestone_title: milestoneData?.title,
            })
          }
        })
        setSessionNotes(notesBySession)
      }
    }

    fetchSessionNotes()
  }, [sessions, supabase])

  const handleAddNoteToSession = async (sessionId: string) => {
    if (!newNoteContent.trim()) return

    setSavingNote(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const milestoneId = selectedMilestoneId || null
      const milestoneTitle = milestoneId ? milestones.find(m => m.id === milestoneId)?.title : undefined

      const { data, error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_id: sessionId,
          milestone_id: milestoneId,
          content: newNoteContent.trim(),
          note_type: 'general',
          is_private: true,
        })
        .select('id, content, created_at, milestone_id')
        .single()

      if (error) throw error

      // Add to local state
      setSessionNotes(prev => ({
        ...prev,
        [sessionId]: [
          {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            milestone_id: data.milestone_id,
            milestone_title: milestoneTitle,
          },
          ...(prev[sessionId] || [])
        ]
      }))

      setNewNoteContent('')
      setSelectedMilestoneId('')
      setAddingNoteToSession(null)
      toast.success(t.members.success.noteAdded)
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setSavingNote(false)
    }
  }

  const handleUpdateNote = async (sessionId: string, noteId: string) => {
    if (!editNoteContent.trim()) return

    setSavingNote(true)
    try {
      const milestoneId = editNoteMilestoneId || null
      const milestoneTitle = milestoneId ? milestones.find(m => m.id === milestoneId)?.title : undefined

      const { error } = await supabase
        .from('progress_notes')
        .update({
          content: editNoteContent.trim(),
          milestone_id: milestoneId,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)

      if (error) throw error

      // Update local state
      setSessionNotes(prev => ({
        ...prev,
        [sessionId]: prev[sessionId]?.map(note =>
          note.id === noteId ? {
            ...note,
            content: editNoteContent.trim(),
            milestone_id: milestoneId,
            milestone_title: milestoneTitle,
          } : note
        ) || []
      }))

      setEditingNoteId(null)
      setEditNoteContent('')
      setEditNoteMilestoneId('')
      toast.success(locale === 'fr' ? 'Note mise à jour' : 'Note updated')
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error(locale === 'fr' ? 'Échec de la mise à jour' : 'Failed to update note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (sessionId: string, noteId: string) => {
    try {
      const { error } = await supabase
        .from('progress_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      setSessionNotes(prev => ({
        ...prev,
        [sessionId]: prev[sessionId]?.filter(n => n.id !== noteId) || []
      }))
    } catch (error) {
      console.error('Error deleting note:', error)
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

  const handleUpdateStatus = async (sessionId: string, newStatus: SessionStatus) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
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
    setEditNotes(session.notes || '')
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
      let scheduledAtValue = editScheduledAt
      if (editSelectedTime) {
        const [hours, minutes] = editSelectedTime.split(':').map(Number)
        const dt = new Date(editSelectedDate)
        dt.setHours(hours, minutes, 0, 0)
        scheduledAtValue = dt.toISOString()
      }

      const { error } = await supabase
        .from('sessions')
        .update({
          session_type: editSessionType,
          session_format: editSessionFormat,
          scheduled_at: scheduledAtValue,
          duration_minutes: editDuration,
          summary: editSummary.trim() || null,
          notes: editNotes.trim() || null,
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
                    Date & Time
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
                              {new Date(session.member_suggested_date).toLocaleDateString('en-US', {
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
                              {new Date(session.practitioner_proposed_date).toLocaleDateString('en-US', {
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
                          {new Date(session.scheduled_at).toLocaleDateString('en-US', {
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
                                  {session.summary}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(session)}
                        className="h-10 w-10 p-0 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Edit session"
                      >
                        <Pencil className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(session.id, 'completed')}
                        className="h-10 w-10 p-0 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title={t.members.sessions.markComplete}
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(session.id, 'cancelled')}
                        className="h-10 w-10 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title={t.members.sessions.cancel}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                      {deletingSessionId === session.id ? (
                        <div className="flex items-center gap-1 bg-red-50 rounded-xl px-2 py-1">
                          <span className="text-xs text-red-600">Delete?</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingSessionId(null)}
                            className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingSessionId(session.id)}
                          className="h-10 w-10 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
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
                            {new Date(session.scheduled_at).toLocaleDateString('en-US', {
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
                  {/* Summary */}
                  {session.summary && (
                    <div className="mt-3 pl-12">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {session.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Session Notes Section */}
                  <div className="mt-3 pl-12">
                    {/* Notes list */}
                    {sessionNotes[session.id]?.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {(expandedNotes === session.id ? sessionNotes[session.id] : sessionNotes[session.id].slice(0, 2)).map((note) => (
                          <div key={note.id} className="group/note bg-blue-50 rounded-lg p-2">
                            {editingNoteId === note.id ? (
                              // Edit mode
                              <div className="space-y-2">
                                <textarea
                                  value={editNoteContent}
                                  onChange={(e) => setEditNoteContent(e.target.value)}
                                  rows={2}
                                  autoFocus
                                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                />
                                {/* Milestone selector for edit */}
                                {milestones.length > 0 && (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setShowEditMilestoneDropdown(!showEditMilestoneDropdown)}
                                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Target className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        {editNoteMilestoneId ? (
                                          <>
                                            <span className="truncate text-gray-700">{milestones.find(m => m.id === editNoteMilestoneId)?.title}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${getStatusInfo(milestones.find(m => m.id === editNoteMilestoneId)?.status || '').bg} ${getStatusInfo(milestones.find(m => m.id === editNoteMilestoneId)?.status || '').color}`}>
                                              {getStatusLabel(milestones.find(m => m.id === editNoteMilestoneId)?.status || '')}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-gray-400">{locale === 'fr' ? 'Aucun axe de travail' : 'No goal linked'}</span>
                                        )}
                                      </div>
                                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showEditMilestoneDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                      {showEditMilestoneDropdown && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -4 }}
                                          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                                        >
                                          <div className="max-h-40 overflow-y-auto py-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditNoteMilestoneId('')
                                                setShowEditMilestoneDropdown(false)
                                              }}
                                              className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 ${!editNoteMilestoneId ? 'bg-gray-50' : ''}`}
                                            >
                                              <X className="w-3 h-3 text-gray-400" />
                                              <span className="text-gray-500">{locale === 'fr' ? 'Aucun axe de travail' : 'No goal linked'}</span>
                                            </button>
                                            {milestones.map((m) => {
                                              const statusInfo = getStatusInfo(m.status)
                                              return (
                                                <button
                                                  key={m.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setEditNoteMilestoneId(m.id)
                                                    setShowEditMilestoneDropdown(false)
                                                  }}
                                                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between gap-2 ${editNoteMilestoneId === m.id ? 'bg-blue-50' : ''}`}
                                                >
                                                  <div className="flex items-center gap-2 min-w-0">
                                                    {editNoteMilestoneId === m.id && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                                    <span className="truncate text-gray-700">{m.title}</span>
                                                  </div>
                                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
                                                    {locale === 'fr' ? statusInfo.fr : statusInfo.en}
                                                  </span>
                                                </button>
                                              )
                                            })}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(null)
                                      setEditNoteContent('')
                                      setEditNoteMilestoneId('')
                                      setShowEditMilestoneDropdown(false)
                                    }}
                                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded"
                                  >
                                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateNote(session.id, note.id)}
                                    disabled={savingNote || !editNoteContent.trim()}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                  >
                                    {savingNote ? '...' : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700">{note.content}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400">
                                      {new Date(note.created_at).toLocaleDateString()}
                                    </span>
                                    {note.milestone_title && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                                        <Target className="w-2.5 h-2.5" />
                                        {note.milestone_title}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/note:opacity-100 transition-all">
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(note.id)
                                      setEditNoteContent(note.content)
                                      setEditNoteMilestoneId(note.milestone_id || '')
                                    }}
                                    className="text-gray-400 hover:text-blue-500 p-1"
                                    title={locale === 'fr' ? 'Modifier' : 'Edit'}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(session.id, note.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                    title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {sessionNotes[session.id].length > 2 && (
                          <button
                            onClick={() => setExpandedNotes(expandedNotes === session.id ? null : session.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            {expandedNotes === session.id ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                Show {sessionNotes[session.id].length - 2} more notes
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Add note inline */}
                    {addingNoteToSession === session.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder={locale === 'fr' ? 'Ajouter une note...' : 'Add a note...'}
                          rows={2}
                          autoFocus
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                        />
                        {/* Milestone selector */}
                        {milestones.length > 0 && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowMilestoneDropdown(!showMilestoneDropdown)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Target className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                {selectedMilestoneId ? (
                                  <>
                                    <span className="truncate text-gray-700">{milestones.find(m => m.id === selectedMilestoneId)?.title}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${getStatusInfo(milestones.find(m => m.id === selectedMilestoneId)?.status || '').bg} ${getStatusInfo(milestones.find(m => m.id === selectedMilestoneId)?.status || '').color}`}>
                                      {getStatusLabel(milestones.find(m => m.id === selectedMilestoneId)?.status || '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-400">{locale === 'fr' ? 'Lier à un axe de travail (optionnel)' : 'Link to a goal (optional)'}</span>
                                )}
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMilestoneDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                              {showMilestoneDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                                >
                                  <div className="max-h-48 overflow-y-auto py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMilestoneId('')
                                        setShowMilestoneDropdown(false)
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 ${!selectedMilestoneId ? 'bg-gray-50' : ''}`}
                                    >
                                      <X className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-500">{locale === 'fr' ? 'Aucun axe de travail' : 'No goal linked'}</span>
                                    </button>
                                    {milestones.map((m) => {
                                      const statusInfo = getStatusInfo(m.status)
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedMilestoneId(m.id)
                                            setShowMilestoneDropdown(false)
                                          }}
                                          className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between gap-2 ${selectedMilestoneId === m.id ? 'bg-blue-50' : ''}`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            {selectedMilestoneId === m.id && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                            <span className="truncate text-gray-700">{m.title}</span>
                                          </div>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
                                            {locale === 'fr' ? statusInfo.fr : statusInfo.en}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAddingNoteToSession(null)
                              setNewNoteContent('')
                              setSelectedMilestoneId('')
                              setShowMilestoneDropdown(false)
                            }}
                            className="h-8 px-2 text-gray-400 hover:text-gray-600 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            {locale === 'fr' ? 'Annuler' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddNoteToSession(session.id)}
                            disabled={savingNote || !newNoteContent.trim()}
                            className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            {locale === 'fr' ? 'Ajouter' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingNoteToSession(session.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add note
                      </button>
                    )}
                  </div>
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
                        No Show
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Session Modal */}
      <AnimatePresence>
        {editingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50  z-50 flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-teal-500" />
                  Edit Session
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
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

                {/* Date & Time Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
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
                      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
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
                        const yesterday = addDays(startOfDay(new Date()), -1)
                        return days.map((d) => {
                          const isCurrentMonth = isSameMonth(d, editCalendarMonth)
                          const isSelected = isSameDay(d, editSelectedDate)
                          const isPast = isBefore(d, yesterday)
                          return (
                            <button
                              key={d.toISOString()}
                              disabled={isPast || !isCurrentMonth}
                              onClick={() => {
                                setEditSelectedDate(startOfDay(d))
                                setEditSelectedTime(null)
                              }}
                              className={`text-xs py-1.5 rounded-lg transition-all ${
                                !isCurrentMonth ? 'text-gray-200' :
                                isPast ? 'text-gray-300 cursor-not-allowed' :
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

                  {/* Time Slots */}
                  {editLoadingSlots ? (
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

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      Notes
                    </span>
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Private notes about this session..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none resize-none bg-white"
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
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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
                    {new Date(proposingSession.scheduled_at).toLocaleDateString('en-US', {
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
                      {new Date(proposingSession.member_suggested_date).toLocaleDateString('en-US', {
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
                  <input
                    type="time"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none bg-white"
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
