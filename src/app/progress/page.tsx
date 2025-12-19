'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  Target,
  Flame,
  Loader2,
  Users,
  FileText,
  BookOpen,
  ChevronRight,
  CalendarCheck,
  CalendarX,
  Video,
  MapPin,
  Phone,
  Check,
  RefreshCw,
  X,
} from 'lucide-react'
import Link from 'next/link'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

interface ProgressStats {
  totalCompleted: number
  totalAssigned: number
  currentStreak: number
  longestStreak: number
  weeklyProgress: number[]
}

interface UpcomingSession {
  id: string
  scheduled_at: string
  duration_minutes: number
  session_type: string
  session_format: string
  status: string
  member_confirmed: boolean
  reschedule_requested: boolean
  reschedule_status: 'pending' | 'proposed' | 'accepted' | 'declined' | null
  practitioner_proposed_date: string | null
  notes: string | null
  practitioner: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

export default function ProgressPage() {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProgressStats>({
    totalCompleted: 0,
    totalAssigned: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
  })
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [pastSessions, setPastSessions] = useState<UpcomingSession[]>([])
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [suggestedDate, setSuggestedDate] = useState('')
  const [suggestedTime, setSuggestedTime] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAllHistory, setShowAllHistory] = useState(false)

  useEffect(() => {
    fetchProgress()
    fetchUpcomingSessions()
    fetchPastSessions()
  }, [])

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get member record
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      // Get completed submissions
      const { data: submissions } = await supabase
        .from('resource_responses')
        .select('submitted_at, status')
        .eq('member_id', member.id)
        .eq('status', 'submitted')

      // Get total assignments
      const { data: assignments } = await supabase
        .from('resource_assignments')
        .select('id')
        .eq('member_id', member.id)

      // Get shared resources
      const { data: shared } = await supabase
        .from('member_shared_resources')
        .select('id')
        .eq('member_id', member.id)

      const totalAssigned = (assignments?.length || 0) + (shared?.length || 0)
      const totalCompleted = submissions?.length || 0

      // Calculate weekly progress (last 7 days)
      const weeklyProgress = [0, 0, 0, 0, 0, 0, 0]
      const now = new Date()

      submissions?.forEach(sub => {
        if (sub.submitted_at) {
          const subDate = new Date(sub.submitted_at)
          const daysDiff = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff >= 0 && daysDiff < 7) {
            weeklyProgress[6 - daysDiff]++
          }
        }
      })

      // Calculate streak (simplified)
      let currentStreak = 0
      const sortedDates = submissions
        ?.filter(s => s.submitted_at)
        .map(s => new Date(s.submitted_at!).toDateString())
        .filter((v, i, a) => a.indexOf(v) === i) // unique dates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      if (sortedDates && sortedDates.length > 0) {
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          currentStreak = 1
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1])
            const currDate = new Date(sortedDates[i])
            const diff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
            if (diff === 1) {
              currentStreak++
            } else {
              break
            }
          }
        }
      }

      setStats({
        totalCompleted,
        totalAssigned,
        currentStreak,
        longestStreak: Math.max(currentStreak, 3), // Placeholder
        weeklyProgress,
      })
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get member record
      const { data: member } = await supabase
        .from('members')
        .select('id, practitioner_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      // Get upcoming sessions
      const now = new Date().toISOString()
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          session_type,
          session_format,
          status,
          member_confirmed,
          reschedule_requested,
          reschedule_status,
          practitioner_proposed_date,
          notes,
          practitioner_id
        `)
        .eq('member_id', member.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(5)

      if (sessions && sessions.length > 0) {
        // Get practitioner info
        const practitionerIds = [...new Set(sessions.map(s => s.practitioner_id))]
        const { data: practitioners } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', practitionerIds)

        const sessionsWithPractitioner = sessions.map(session => ({
          ...session,
          member_confirmed: session.member_confirmed ?? false,
          reschedule_requested: session.reschedule_requested ?? false,
          reschedule_status: session.reschedule_status ?? null,
          practitioner_proposed_date: session.practitioner_proposed_date ?? null,
          practitioner: practitioners?.find(p => p.id === session.practitioner_id) || null
        }))

        setUpcomingSessions(sessionsWithPractitioner)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchPastSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get member record
      const { data: member } = await supabase
        .from('members')
        .select('id, practitioner_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      // Get past sessions (completed or past scheduled date)
      const now = new Date().toISOString()
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          session_type,
          session_format,
          status,
          member_confirmed,
          reschedule_requested,
          reschedule_status,
          practitioner_proposed_date,
          notes,
          practitioner_id
        `)
        .eq('member_id', member.id)
        .or(`status.eq.completed,scheduled_at.lt.${now}`)
        .order('scheduled_at', { ascending: false })
        .limit(20)

      if (sessions && sessions.length > 0) {
        // Get practitioner info
        const practitionerIds = [...new Set(sessions.map(s => s.practitioner_id))]
        const { data: practitioners } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', practitionerIds)

        const sessionsWithPractitioner = sessions.map(session => ({
          ...session,
          member_confirmed: session.member_confirmed ?? false,
          reschedule_requested: session.reschedule_requested ?? false,
          reschedule_status: session.reschedule_status ?? null,
          practitioner_proposed_date: session.practitioner_proposed_date ?? null,
          practitioner: practitioners?.find(p => p.id === session.practitioner_id) || null
        }))

        setPastSessions(sessionsWithPractitioner)
      }
    } catch (error) {
      console.error('Error fetching past sessions:', error)
    }
  }

  const handleConfirmSession = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ member_confirmed: true, reschedule_requested: false })
        .eq('id', sessionId)

      if (error) throw error

      // Update local state
      setUpcomingSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, member_confirmed: true, reschedule_requested: false } : s)
      )

      toast.success(locale === 'fr' ? 'Séance confirmée!' : 'Session confirmed!')
    } catch (error) {
      console.error('Error confirming session:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la confirmation' : 'Failed to confirm session')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequestReschedule = async (sessionId: string) => {
    if (!rescheduleReason.trim()) {
      toast.error(locale === 'fr' ? 'Veuillez indiquer une raison' : 'Please provide a reason')
      return
    }

    setActionLoading(sessionId)
    try {
      // Build suggested date if provided
      let memberSuggestedDate = null
      if (suggestedDate && suggestedTime) {
        memberSuggestedDate = new Date(`${suggestedDate}T${suggestedTime}`).toISOString()
      }

      const { error } = await supabase
        .from('sessions')
        .update({
          reschedule_requested: true,
          reschedule_reason: rescheduleReason,
          member_confirmed: false,
          member_suggested_date: memberSuggestedDate,
          reschedule_status: 'pending',
        })
        .eq('id', sessionId)

      if (error) throw error

      // Update local state
      setUpcomingSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, reschedule_requested: true, member_confirmed: false } : s)
      )

      setShowRescheduleModal(null)
      setRescheduleReason('')
      setSuggestedDate('')
      setSuggestedTime('')
      toast.success(locale === 'fr' ? 'Demande de report envoyée' : 'Reschedule request sent')
    } catch (error) {
      console.error('Error requesting reschedule:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la demande' : 'Failed to request reschedule')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptProposedDate = async (session: UpcomingSession) => {
    if (!session.practitioner_proposed_date) return

    setActionLoading(session.id)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          scheduled_at: session.practitioner_proposed_date,
          reschedule_requested: false,
          reschedule_status: 'accepted',
          member_confirmed: true,
          practitioner_proposed_date: null,
        })
        .eq('id', session.id)

      if (error) throw error

      // Update local state
      setUpcomingSessions(prev =>
        prev.map(s => s.id === session.id ? {
          ...s,
          scheduled_at: session.practitioner_proposed_date!,
          reschedule_requested: false,
          reschedule_status: 'accepted' as const,
          member_confirmed: true,
          practitioner_proposed_date: null,
        } : s)
      )

      toast.success(locale === 'fr' ? 'Nouvelle date acceptée!' : 'New date accepted!')
    } catch (error) {
      console.error('Error accepting proposed date:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de l\'acceptation' : 'Failed to accept date')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineProposedDate = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          reschedule_status: 'pending',
          practitioner_proposed_date: null,
        })
        .eq('id', sessionId)

      if (error) throw error

      // Update local state
      setUpcomingSessions(prev =>
        prev.map(s => s.id === sessionId ? {
          ...s,
          reschedule_status: 'pending' as const,
          practitioner_proposed_date: null,
        } : s)
      )

      toast.success(locale === 'fr' ? 'Proposition déclinée' : 'Proposal declined')
    } catch (error) {
      console.error('Error declining proposed date:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du déclin' : 'Failed to decline')
    } finally {
      setActionLoading(null)
    }
  }

  const getSessionFormatIcon = (format: string) => {
    switch (format) {
      case 'video': return Video
      case 'in_person': return MapPin
      case 'phone': return Phone
      default: return Calendar
    }
  }

  const getSessionTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; fr: string }> = {
      initial: { en: 'Initial Session', fr: 'Séance initiale' },
      follow_up: { en: 'Follow-up', fr: 'Suivi' },
      emergency: { en: 'Emergency', fr: 'Urgence' },
      assessment: { en: 'Assessment', fr: 'Évaluation' },
    }
    return labels[type]?.[locale] || type
  }

  const completionPercentage = stats.totalAssigned > 0
    ? Math.round((stats.totalCompleted / stats.totalAssigned) * 100)
    : 0

  const dayLabels = locale === 'fr'
    ? ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {locale === 'fr' ? 'Votre Progrès' : 'Your Progress'}
          </h1>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Suivez votre parcours de bien-être'
              : 'Track your wellness journey'}
          </p>
        </motion.div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {locale === 'fr' ? 'Séances à venir' : 'Upcoming Sessions'}
            </h3>

            <div className="space-y-3">
              {upcomingSessions.map((session, idx) => {
                const FormatIcon = getSessionFormatIcon(session.session_format)
                const sessionDate = new Date(session.scheduled_at)
                const needsConfirmation = !session.member_confirmed && !session.reschedule_requested && session.reschedule_status !== 'proposed'
                const hasProposedDate = session.reschedule_status === 'proposed' && session.practitioner_proposed_date

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white rounded-2xl p-4 border shadow-sm ${
                      hasProposedDate
                        ? 'border-purple-200 bg-purple-50/30'
                        : needsConfirmation
                          ? 'border-amber-200 bg-amber-50/30'
                          : session.reschedule_requested
                            ? 'border-orange-200 bg-orange-50/30'
                            : 'border-emerald-200 bg-emerald-50/30'
                    }`}
                  >
                    {/* Proposed Date Banner */}
                    {hasProposedDate && (
                      <div className="mb-4 p-3 rounded-xl bg-purple-100/80 border border-purple-200">
                        <div className="flex items-start gap-2 mb-3">
                          <CalendarCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-purple-800 text-sm">
                              {locale === 'fr' ? 'Nouvelle date proposée' : 'New Date Proposed'}
                            </p>
                            <p className="text-sm text-purple-700 mt-1">
                              {format(new Date(session.practitioner_proposed_date!), "EEEE, MMM d 'at' HH:mm", {
                                locale: locale === 'fr' ? fr : enUS
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptProposedDate(session)}
                            disabled={actionLoading === session.id}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            {actionLoading === session.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                {locale === 'fr' ? 'Accepter' : 'Accept'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeclineProposedDate(session.id)}
                            disabled={actionLoading === session.id}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                          >
                            <X className="w-4 h-4" />
                            {locale === 'fr' ? 'Refuser' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    {needsConfirmation && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          {locale === 'fr' ? 'En attente de confirmation' : 'Awaiting your confirmation'}
                        </span>
                      </div>
                    )}
                    {session.reschedule_requested && session.reschedule_status === 'pending' && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          {locale === 'fr' ? 'Report demandé' : 'Reschedule requested'}
                        </span>
                      </div>
                    )}
                    {session.member_confirmed && !hasProposedDate && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {locale === 'fr' ? 'Confirmé' : 'Confirmed'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Date Box */}
                      <div className="flex-shrink-0 w-14 h-14 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xs text-gray-500 uppercase">
                          {format(sessionDate, 'MMM', { locale: locale === 'fr' ? fr : enUS })}
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {format(sessionDate, 'd')}
                        </span>
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {getSessionTypeLabel(session.session_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(sessionDate, 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FormatIcon className="w-3.5 h-3.5" />
                            {session.session_format === 'video' ? 'Video' :
                              session.session_format === 'in_person' ? (locale === 'fr' ? 'En personne' : 'In Person') :
                                (locale === 'fr' ? 'Téléphone' : 'Phone')}
                          </span>
                          <span>{session.duration_minutes} min</span>
                        </div>
                        {session.practitioner && (
                          <p className="text-sm text-gray-600">
                            {locale === 'fr' ? 'avec' : 'with'} <span className="font-medium">{session.practitioner.full_name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {needsConfirmation && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleConfirmSession(session.id)}
                          disabled={actionLoading === session.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CalendarCheck className="w-4 h-4" />
                              {locale === 'fr' ? 'Confirmer' : 'Confirm'}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowRescheduleModal(session.id)}
                          disabled={actionLoading === session.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {locale === 'fr' ? 'Reporter' : 'Reschedule'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Reschedule Modal */}
        <AnimatePresence>
          {showRescheduleModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRescheduleModal(null)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Demander un report' : 'Request Reschedule'}
                  </h3>
                  <button
                    onClick={() => setShowRescheduleModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  {locale === 'fr'
                    ? 'Veuillez indiquer la raison de votre demande de report.'
                    : 'Please let us know why you need to reschedule.'}
                </p>

                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder={locale === 'fr' ? 'Raison du report...' : 'Reason for rescheduling...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                  rows={2}
                />

                {/* Suggested Date/Time */}
                <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {locale === 'fr' ? 'Suggérer une nouvelle date (optionnel)' : 'Suggest a new date (optional)'}
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        {locale === 'fr' ? 'Date' : 'Date'}
                      </label>
                      <input
                        type="date"
                        value={suggestedDate}
                        onChange={(e) => setSuggestedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">
                        {locale === 'fr' ? 'Heure' : 'Time'}
                      </label>
                      <input
                        type="time"
                        value={suggestedTime}
                        onChange={(e) => setSuggestedTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowRescheduleModal(null)}
                    className="flex-1 px-4 py-2.5 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleRequestReschedule(showRescheduleModal)}
                    disabled={actionLoading === showRescheduleModal}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === showRescheduleModal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {locale === 'fr' ? 'Envoyer' : 'Send Request'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Completion Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold mb-1">{completionPercentage}%</p>
            <p className="text-emerald-100 text-sm">
              {locale === 'fr' ? 'Complété' : 'Completed'}
            </p>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-5 text-white"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.currentStreak}</p>
            <p className="text-amber-100 text-sm">
              {locale === 'fr' ? 'Jours de suite' : 'Day Streak'}
            </p>
          </motion.div>

          {/* Total Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCompleted}</p>
            <p className="text-gray-500 text-sm">
              {locale === 'fr' ? 'Terminés' : 'Completed'}
            </p>
          </motion.div>

          {/* Total Assigned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAssigned}</p>
            <p className="text-gray-500 text-sm">
              {locale === 'fr' ? 'Total assignés' : 'Total Assigned'}
            </p>
          </motion.div>
        </div>

        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {locale === 'fr' ? 'Cette semaine' : 'This Week'}
            </h3>
            <div className="flex items-center gap-1 text-emerald-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.weeklyProgress.reduce((a, b) => a + b, 0)} {locale === 'fr' ? 'terminés' : 'completed'}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-24">
            {stats.weeklyProgress.map((count, idx) => {
              const maxCount = Math.max(...stats.weeklyProgress, 1)
              const height = (count / maxCount) * 100
              const isToday = idx === 6

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-16">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 8)}%` }}
                      transition={{ delay: 0.4 + idx * 0.05, type: 'spring' }}
                      className={`w-full max-w-[28px] rounded-full ${
                        isToday
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : count > 0
                            ? 'bg-emerald-200'
                            : 'bg-gray-100'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                    {dayLabels[idx]}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Quick Access Sections */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'Accès rapide' : 'Quick Access'}
          </h3>
          <div className="space-y-3">
            {/* My Mentors */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Link
                href="/mentors"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Mes Mentors' : 'My Mentors'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Voir vos accompagnants' : 'View your practitioners'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>

            {/* My Resources */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/worksheets"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Mes Ressources' : 'My Worksheets'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Worksheets et exercices' : 'Worksheets and exercises'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>

            {/* My Stories */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link
                href="/stories"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Mes Histoires' : 'My Stories'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Récits thérapeutiques' : 'Therapeutic stories'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Achievements Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {locale === 'fr' ? 'Prochaine réussite' : 'Next Achievement'}
              </h3>
              <p className="text-sm text-gray-500">
                {locale === 'fr'
                  ? `${5 - stats.totalCompleted > 0 ? 5 - stats.totalCompleted : 0} de plus pour débloquer`
                  : `${5 - stats.totalCompleted > 0 ? 5 - stats.totalCompleted : 0} more to unlock`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.totalCompleted / 5) * 100, 100)}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
            <span className="text-sm font-medium text-purple-600">
              {stats.totalCompleted}/5
            </span>
          </div>
        </motion.div>

        {/* Session History */}
        {pastSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                {locale === 'fr' ? 'Historique des séances' : 'Session History'}
              </h3>
              {pastSessions.length > 3 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                >
                  {showAllHistory
                    ? (locale === 'fr' ? 'Voir moins' : 'Show less')
                    : (locale === 'fr' ? 'Voir tout' : 'View all')}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(showAllHistory ? pastSessions : pastSessions.slice(0, 3)).map((session, idx) => {
                const FormatIcon = getSessionFormatIcon(session.session_format)
                const sessionDate = new Date(session.scheduled_at)
                const isCompleted = session.status === 'completed'
                const isCancelled = session.status === 'cancelled'
                const isNoShow = session.status === 'no_show'

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white rounded-2xl p-4 border shadow-sm ${
                      isCompleted
                        ? 'border-gray-200'
                        : isCancelled
                          ? 'border-red-200 bg-red-50/30'
                          : isNoShow
                            ? 'border-amber-200 bg-amber-50/30'
                            : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Box */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                        isCompleted ? 'bg-gray-100' : isCancelled ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        <span className="text-xs text-gray-500 uppercase">
                          {format(sessionDate, 'MMM', { locale: locale === 'fr' ? fr : enUS })}
                        </span>
                        <span className="text-lg font-bold text-gray-700">
                          {format(sessionDate, 'd')}
                        </span>
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getSessionTypeLabel(session.session_type)}
                          </span>
                          {isCompleted && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {locale === 'fr' ? 'Terminé' : 'Completed'}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              {locale === 'fr' ? 'Annulé' : 'Cancelled'}
                            </span>
                          )}
                          {isNoShow && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              {locale === 'fr' ? 'Absent' : 'No Show'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(sessionDate, 'HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FormatIcon className="w-3.5 h-3.5" />
                            {session.session_format === 'video' ? 'Video' :
                              session.session_format === 'in_person' ? (locale === 'fr' ? 'En personne' : 'In Person') :
                                (locale === 'fr' ? 'Téléphone' : 'Phone')}
                          </span>
                          <span>{session.duration_minutes} min</span>
                        </div>
                        {session.practitioner && (
                          <p className="text-sm text-gray-500 mt-1">
                            {locale === 'fr' ? 'avec' : 'with'} {session.practitioner.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </MemberLayout>
  )
}
