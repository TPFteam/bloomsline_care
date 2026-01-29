'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Calendar,
  Clock,
  Users,
  FileText,
  BookOpen,
  ChevronRight,
  CalendarCheck,
  Video,
  MapPin,
  Phone,
  Check,
  RefreshCw,
  X,
  CheckCircle,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MemberLayout from '@/components/member/MemberLayout'
import { LoadingDots } from '@/components/ui/loading-dots'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

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

export default function CarePage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [pastSessions, setPastSessions] = useState<UpcomingSession[]>([])
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [suggestedDate, setSuggestedDate] = useState('')
  const [suggestedTime, setSuggestedTime] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAllHistory, setShowAllHistory] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchUpcomingSessions(),
        fetchPastSessions(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('id, practitioner_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

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

      const { data: member } = await supabase
        .from('members')
        .select('id, practitioner_id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

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

  if (loading) {
    return (
      <MemberLayout>
        <LoadingDots fullScreen />
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-rose-200/40 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 -left-20 w-56 h-56 bg-violet-200/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-sky-200/30 rounded-full blur-[70px]" />
        <div className="absolute bottom-20 -left-10 w-32 h-32 bg-amber-200/20 rounded-full blur-[50px]" />
      </div>

      <div className="relative z-10 px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {locale === 'fr' ? 'Mes Soins' : 'My Care'}
            </h1>
            <p className="text-xs text-gray-500">
              {locale === 'fr'
                ? 'Gérez vos séances et ressources'
                : 'Manage your sessions and resources'}
            </p>
          </div>
        </motion.div>

        {/* Quick Access */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'Accès rapide' : 'Quick Access'}
          </h3>
          <div className="space-y-3">
            {/* My Practitioners */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
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
                    {locale === 'fr' ? 'Mes Praticiens' : 'My Practitioners'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Voir vos praticiens' : 'View your practitioners'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>

            {/* My Assessments */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
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
                    {locale === 'fr' ? 'Mes supports' : 'My Resources'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Exercices et fiches' : 'Exercises and worksheets'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>

            {/* My Stories */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
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

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {locale === 'fr' ? 'Séances à venir' : 'Upcoming Sessions'}
          </h3>

          {upcomingSessions.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {locale === 'fr' ? 'Aucune séance prévue' : 'No upcoming sessions'}
              </p>
            </div>
          ) : (
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
                    transition={{ delay: 0.3 + idx * 0.1 }}
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
          )}
        </motion.div>

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

        {/* Session History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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

          {pastSessions.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {locale === 'fr' ? 'Aucun historique de séances' : 'No session history'}
              </p>
            </div>
          ) : (
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
          )}
        </motion.div>
      </div>
    </MemberLayout>
  )
}
