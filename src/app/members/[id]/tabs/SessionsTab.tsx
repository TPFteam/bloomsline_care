'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Session, SessionType, SessionFormat, SessionStatus } from '@/types/member'

interface SessionsTabProps {
  memberId: string
  sessions: Session[]
  onSessionsUpdate: () => void
}

export default function SessionsTab({ memberId, sessions, onSessionsUpdate }: SessionsTabProps) {
  const { t } = useLanguage()
  const supabase = createClient()

  const [showAddSession, setShowAddSession] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('follow_up')
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>('in_person')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

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
          notes: notes.trim() || null,
          status: 'scheduled' as SessionStatus,
          goals: [],
          outcomes: [],
          homework: [],
        })

      if (error) throw error

      toast.success(t.members.success.sessionCreated)
      setShowAddSession(false)
      setScheduledAt('')
      setNotes('')
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

  const formatIcon = {
    in_person: User,
    virtual: Video,
    phone: Phone,
  }

  const statusStyles: Record<SessionStatus, { bg: string; text: string; gradient: string; border: string }> = {
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', gradient: 'from-blue-100 to-blue-50', border: 'border-blue-200' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', gradient: 'from-emerald-100 to-emerald-50', border: 'border-emerald-200' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', gradient: 'from-gray-100 to-gray-50', border: 'border-gray-200' },
    no_show: { bg: 'bg-red-50', text: 'text-red-700', gradient: 'from-red-100 to-red-50', border: 'border-red-200' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5 text-lavender-600" />
          </div>
          {t.members.sessions.title}
        </h2>
        <Button
          onClick={() => setShowAddSession(!showAddSession)}
          className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-smooth hover-lift"
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
            <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60">
              <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-lavender-500" />
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
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
                    <Calendar className="w-4 h-4 text-lavender-500" />
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.duration} ({t.members.sessions.minutes})
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
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
                  {t.members.sessions.notes}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Session notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none resize-none bg-white/80 backdrop-blur-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowAddSession(false)} className="rounded-xl">
                  {t.members.form.cancel}
                </Button>
                <Button
                  onClick={handleAddSession}
                  disabled={saving}
                  className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50"
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
        className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60 hover-lift"
      >
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
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
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">{t.members.sessions.noUpcoming}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session, index) => {
              const FormatIcon = formatIcon[session.session_format]
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-blue-100/50 border border-blue-200/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                        <FormatIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {t.members.sessionTypes[session.session_type]}
                        </p>
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
                          <span className="text-xs text-gray-400 glass-subtle px-2 py-1 rounded-lg">
                            {session.duration_minutes} {t.members.sessions.minutes}
                          </span>
                          <span className="text-xs text-gray-400 glass-subtle px-2 py-1 rounded-lg">
                            {t.members.sessionFormats[session.session_format]}
                          </span>
                        </div>
                        {session.notes && (
                          <div className="mt-3 p-3 rounded-xl bg-white/60 border border-blue-100">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">{t.members.sessions.notes}</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {session.notes}
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
                        onClick={() => handleUpdateStatus(session.id, 'completed')}
                        className="h-10 w-10 p-0 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-smooth"
                        title={t.members.sessions.markComplete}
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(session.id, 'cancelled')}
                        className="h-10 w-10 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-smooth"
                        title={t.members.sessions.cancel}
                      >
                        <X className="w-5 h-5" />
                      </Button>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
      >
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
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
            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Clock className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">{t.members.sessions.noPast}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session, index) => {
              const FormatIcon = formatIcon[session.session_format]
              const statusStyle = statusStyles[session.status]
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={`p-5 rounded-2xl bg-gradient-to-r ${statusStyle.gradient} border ${statusStyle.border} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        <FormatIcon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {t.members.sessionTypes[session.session_type]}
                          </p>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                            {t.members.sessionStatus[session.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <p className="text-sm text-gray-500">
                            {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <span className="text-xs text-gray-400">
                            {session.duration_minutes} {t.members.sessions.minutes}
                          </span>
                          <span className="text-xs text-gray-400">
                            {t.members.sessionFormats[session.session_format]}
                          </span>
                        </div>
                        {session.notes && (
                          <div className="mt-3 p-3 rounded-xl bg-white/60 border border-gray-100">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-lavender-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">{t.members.sessions.notes}</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {session.notes}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {session.summary && (
                          <div className="mt-2 p-3 rounded-xl bg-lavender-50/50 border border-lavender-100">
                            <p className="text-xs font-medium text-lavender-600 mb-1">Summary</p>
                            <p className="text-sm text-gray-700">
                              {session.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {session.mood_rating && (
                      <div className="text-right glass-subtle px-3 py-2 rounded-xl">
                        <p className="text-xs text-gray-400 mb-0.5">{t.members.sessions.mood}</p>
                        <p className="font-bold text-gray-700 text-lg">{session.mood_rating}<span className="text-sm text-gray-400">/10</span></p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
