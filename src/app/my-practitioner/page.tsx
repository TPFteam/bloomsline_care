'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Sparkles,
  Calendar,
  Video,
  MapPin,
  Phone,
  Check,
  RefreshCw,
  X,
  CheckCircle,
  CalendarCheck,
  Loader2,
  Users,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import MemberLayout from '@/components/member/MemberLayout'
import { LoadingDots } from '@/components/ui/loading-dots'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import {
  getMemberRecord,
  getMemberPractitioner,
  getAllMemberResources,
  type PractitionerProfile,
  type MemberResourceItem,
} from '@/lib/services/member-resources'

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

const content = {
  en: {
    title: 'My Practitioner',
    noPractitioner: 'No practitioner connected yet',
    noPractitionerDesc: 'When a practitioner invites you, they will appear here.',
    resources: 'Resources',
    noResources: 'No resources yet',
    noResourcesDesc: 'Your practitioner will share worksheets and exercises with you here.',
    pending: 'To do',
    inProgress: 'In progress',
    completed: 'Completed',
    dueDate: 'Due',
    viewAll: 'View all',
    viewLess: 'View less',
    sharedBy: 'Shared by',
    quickAccess: 'Quick Access',
    myPractitioners: 'My Practitioners',
    viewPractitioners: 'View your practitioners',
    myAssessments: 'My Assessments',
    assessmentsDesc: 'Assessments and exercises',
    myStories: 'My Stories',
    storiesDesc: 'Therapeutic stories',
    upcomingSessions: 'Upcoming Sessions',
    noUpcoming: 'No upcoming sessions',
    sessionHistory: 'Session History',
    noHistory: 'No session history',
    awaitingConfirmation: 'Awaiting your confirmation',
    rescheduleRequested: 'Reschedule requested',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    confirm: 'Confirm',
    reschedule: 'Reschedule',
    newDateProposed: 'New Date Proposed',
    accept: 'Accept',
    decline: 'Decline',
    requestReschedule: 'Request Reschedule',
    rescheduleReason: 'Please let us know why you need to reschedule.',
    reasonPlaceholder: 'Reason for rescheduling...',
    suggestDate: 'Suggest a new date (optional)',
    date: 'Date',
    time: 'Time',
    cancel: 'Cancel',
    sendRequest: 'Send Request',
    with: 'with',
    initialSession: 'Initial Session',
    followUp: 'Follow-up',
    emergency: 'Emergency',
    assessment: 'Assessment',
    inPerson: 'In Person',
    phone: 'Phone',
  },
  fr: {
    title: 'Mon Praticien',
    noPractitioner: 'Pas encore de praticien connecté',
    noPractitionerDesc: 'Quand un praticien vous invite, il apparaîtra ici.',
    resources: 'Ressources',
    noResources: 'Pas encore de ressources',
    noResourcesDesc: 'Votre praticien partagera des fiches et exercices avec vous ici.',
    pending: 'À faire',
    inProgress: 'En cours',
    completed: 'Terminé',
    dueDate: 'Échéance',
    viewAll: 'Voir tout',
    viewLess: 'Voir moins',
    sharedBy: 'Partagé par',
    quickAccess: 'Accès rapide',
    myPractitioners: 'Mes Praticiens',
    viewPractitioners: 'Voir vos praticiens',
    myAssessments: 'Mes supports',
    assessmentsDesc: 'Exercices et fiches',
    myStories: 'Mes Histoires',
    storiesDesc: 'Récits thérapeutiques',
    upcomingSessions: 'Séances à venir',
    noUpcoming: 'Aucune séance prévue',
    sessionHistory: 'Historique des séances',
    noHistory: 'Aucun historique de séances',
    awaitingConfirmation: 'En attente de confirmation',
    rescheduleRequested: 'Report demandé',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    noShow: 'Absent',
    confirm: 'Confirmer',
    reschedule: 'Reporter',
    newDateProposed: 'Nouvelle date proposée',
    accept: 'Accepter',
    decline: 'Refuser',
    requestReschedule: 'Demander un report',
    rescheduleReason: 'Veuillez indiquer la raison de votre demande de report.',
    reasonPlaceholder: 'Raison du report...',
    suggestDate: 'Suggérer une nouvelle date (optionnel)',
    date: 'Date',
    time: 'Heure',
    cancel: 'Annuler',
    sendRequest: 'Envoyer',
    with: 'avec',
    initialSession: 'Séance initiale',
    followUp: 'Suivi',
    emergency: 'Urgence',
    assessment: 'Évaluation',
    inPerson: 'En personne',
    phone: 'Téléphone',
  },
}

export default function MyPractitionerPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const supabase = createClient()
  const t = content[locale as keyof typeof content] || content.en

  const [loading, setLoading] = useState(true)
  const [practitioner, setPractitioner] = useState<PractitionerProfile | null>(null)
  const [resources, setResources] = useState<MemberResourceItem[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [pastSessions, setPastSessions] = useState<UpcomingSession[]>([])
  const [showAllResources, setShowAllResources] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [suggestedDate, setSuggestedDate] = useState('')
  const [suggestedTime, setSuggestedTime] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const member = await getMemberRecord()
        if (!member) {
          setLoading(false)
          return
        }

        setMemberId(member.id)

        const [practitionerData, resourcesData] = await Promise.all([
          getMemberPractitioner(member.practitioner_id),
          getAllMemberResources(member.id, member.practitioner_id),
          fetchSessions(member.id),
        ])

        setPractitioner(practitionerData)
        setResources(resourcesData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const fetchSessions = async (memberIdParam: string) => {
    try {
      const now = new Date().toISOString()

      // Fetch upcoming sessions
      const { data: upcoming } = await supabase
        .from('sessions')
        .select(`
          id, scheduled_at, duration_minutes, session_type, session_format,
          status, member_confirmed, reschedule_requested, reschedule_status,
          practitioner_proposed_date, notes, practitioner_id
        `)
        .eq('member_id', memberIdParam)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(5)

      // Fetch past sessions
      const { data: past } = await supabase
        .from('sessions')
        .select(`
          id, scheduled_at, duration_minutes, session_type, session_format,
          status, member_confirmed, reschedule_requested, reschedule_status,
          practitioner_proposed_date, notes, practitioner_id
        `)
        .eq('member_id', memberIdParam)
        .or(`status.eq.completed,scheduled_at.lt.${now}`)
        .order('scheduled_at', { ascending: false })
        .limit(20)

      // Get practitioner info for sessions
      const allSessions = [...(upcoming || []), ...(past || [])]
      if (allSessions.length > 0) {
        const practitionerIds = [...new Set(allSessions.map(s => s.practitioner_id))]
        const { data: practitioners } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', practitionerIds)

        const mapSession = (session: any) => ({
          ...session,
          member_confirmed: session.member_confirmed ?? false,
          reschedule_requested: session.reschedule_requested ?? false,
          reschedule_status: session.reschedule_status ?? null,
          practitioner_proposed_date: session.practitioner_proposed_date ?? null,
          practitioner: practitioners?.find(p => p.id === session.practitioner_id) || null
        })

        if (upcoming) setUpcomingSessions(upcoming.map(mapSession))
        if (past) setPastSessions(past.map(mapSession))
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
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
      initial: { en: t.initialSession, fr: t.initialSession },
      follow_up: { en: t.followUp, fr: t.followUp },
      emergency: { en: t.emergency, fr: t.emergency },
      assessment: { en: t.assessment, fr: t.assessment },
    }
    return labels[type]?.[locale as 'en' | 'fr'] || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'in_progress':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t.completed
      case 'in_progress':
        return t.inProgress
      default:
        return t.pending
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleResourceClick = (resource: MemberResourceItem) => {
    if (resource.type === 'assignment' && resource.assignmentId) {
      router.push(`/fill/${resource.assignmentId}`)
    } else if (resource.type === 'shared') {
      router.push(`/fill/shared/${resource.resource.id}`)
    }
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
      <div className="px-4 pt-8 pb-8 max-w-lg mx-auto">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-gray-900 mb-6"
        >
          {t.title}
        </motion.h1>

        {/* Practitioner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6"
        >
          {practitioner ? (
            <div className="flex items-center gap-4">
              {practitioner.avatar_url ? (
                <img
                  src={practitioner.avatar_url}
                  alt={practitioner.full_name || ''}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {practitioner.full_name || 'Your Practitioner'}
                </h2>
                {practitioner.headline && (
                  <p className="text-sm text-gray-500 mt-0.5">{practitioner.headline}</p>
                )}
                {practitioner.specialties && practitioner.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {practitioner.specialties.slice(0, 3).map((specialty, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">{t.noPractitioner}</p>
              <p className="text-sm text-gray-500 mt-1">{t.noPractitionerDesc}</p>
            </div>
          )}
        </motion.div>

        {/* Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-500" />
              {t.resources}
            </h2>
            {resources.length > 3 && (
              <button
                onClick={() => setShowAllResources(!showAllResources)}
                className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
              >
                {showAllResources ? t.viewLess : t.viewAll}
              </button>
            )}
          </div>

          {resources.length > 0 ? (
            <div className="space-y-3">
              {(showAllResources ? resources : resources.slice(0, 3)).map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => handleResourceClick(item)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {typeof item.resource.title === 'object'
                        ? (item.resource.title as Record<string, string>)[locale] || (item.resource.title as Record<string, string>).en
                        : item.resource.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </span>
                      {item.dueDate && (
                        <span className="text-xs text-gray-400">
                          {t.dueDate}: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">{t.noResources}</p>
              <p className="text-sm text-gray-500 mt-1">{t.noResourcesDesc}</p>
            </div>
          )}
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            {t.upcomingSessions}
          </h3>

          {upcomingSessions.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t.noUpcoming}</p>
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
                    transition={{ delay: 0.1 * idx }}
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
                            <p className="font-semibold text-purple-800 text-sm">{t.newDateProposed}</p>
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
                                {t.accept}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeclineProposedDate(session.id)}
                            disabled={actionLoading === session.id}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                          >
                            <X className="w-4 h-4" />
                            {t.decline}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    {needsConfirmation && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          {t.awaitingConfirmation}
                        </span>
                      </div>
                    )}
                    {session.reschedule_requested && session.reschedule_status === 'pending' && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          {t.rescheduleRequested}
                        </span>
                      </div>
                    )}
                    {session.member_confirmed && !hasProposedDate && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t.confirmed}
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
                              session.session_format === 'in_person' ? t.inPerson : t.phone}
                          </span>
                          <span>{session.duration_minutes} min</span>
                        </div>
                        {session.practitioner && (
                          <p className="text-sm text-gray-600">
                            {t.with} <span className="font-medium">{session.practitioner.full_name}</span>
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
                              {t.confirm}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowRescheduleModal(session.id)}
                          disabled={actionLoading === session.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t.reschedule}
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
                  <h3 className="text-lg font-semibold text-gray-900">{t.requestReschedule}</h3>
                  <button
                    onClick={() => setShowRescheduleModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">{t.rescheduleReason}</p>

                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder={t.reasonPlaceholder}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                  rows={2}
                />

                <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">{t.suggestDate}</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">{t.date}</label>
                      <input
                        type="date"
                        value={suggestedDate}
                        onChange={(e) => setSuggestedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">{t.time}</label>
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
                    {t.cancel}
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
                        {t.sendRequest}
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
              {t.sessionHistory}
            </h3>
            {pastSessions.length > 3 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
              >
                {showAllHistory ? t.viewLess : t.viewAll}
              </button>
            )}
          </div>

          {pastSessions.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t.noHistory}</p>
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
                              {t.completed}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              {t.cancelled}
                            </span>
                          )}
                          {isNoShow && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              {t.noShow}
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
                              session.session_format === 'in_person' ? t.inPerson : t.phone}
                          </span>
                          <span>{session.duration_minutes} min</span>
                        </div>
                        {session.practitioner && (
                          <p className="text-sm text-gray-500 mt-1">
                            {t.with} {session.practitioner.full_name}
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

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">{t.quickAccess}</h3>
          <div className="space-y-3">
            {/* My Practitioners */}
            <Link
              href="/mentors"
              className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{t.myPractitioners}</h4>
                <p className="text-sm text-gray-500">{t.viewPractitioners}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            {/* My Assessments */}
            <Link
              href="/worksheets"
              className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{t.myAssessments}</h4>
                <p className="text-sm text-gray-500">{t.assessmentsDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            {/* My Stories */}
            <Link
              href="/stories"
              className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{t.myStories}</h4>
                <p className="text-sm text-gray-500">{t.storiesDesc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  )
}
