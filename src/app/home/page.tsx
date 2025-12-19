'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  BookOpen,
  Puzzle,
  Flag,
  Eye,
  Share2,
  User,
  Check,
  X,
  UserPlus,
  Bell,
  Settings,
  Leaf,
  Heart,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  getAllMemberRecords,
  getAllMemberResources,
  getMemberPractitioner,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  type MemberResourceItem,
  type PractitionerProfile,
  type PendingInvitation
} from '@/lib/services/member-resources'
import { toast } from 'sonner'
import MemberLayout from '@/components/member/MemberLayout'
import type { Member } from '@/types/member'

// Resource type icons
const typeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  exercise: Puzzle,
  psychoeducation: BookOpen,
}

// Get greeting based on time
function getGreeting(locale: string) {
  const hour = new Date().getHours()
  if (hour < 12) return locale === 'fr' ? 'Bonjour' : 'Good morning'
  if (hour < 18) return locale === 'fr' ? 'Bon après-midi' : 'Good afternoon'
  return locale === 'fr' ? 'Bonsoir' : 'Good evening'
}

// Get motivational message
function getMotivationalMessage(locale: string) {
  const messages = locale === 'fr'
    ? ['Ce moment est le vôtre', 'Vous avancez bien', 'Chaque pas compte', 'Prenez soin de vous']
    : ['This moment is yours', 'You\'re doing great', 'Every step counts', 'Take care of yourself']
  return messages[Math.floor(Math.random() * messages.length)]
}

export default function MyResourcesPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [practitioners, setPractitioners] = useState<PractitionerProfile[]>([])
  const [resources, setResources] = useState<MemberResourceItem[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [locale, router])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      const pendingInvitations = await getPendingInvitations()
      setInvitations(pendingInvitations)

      const memberRecords = await getAllMemberRecords()
      setMembers(memberRecords)

      if (memberRecords.length > 0) {
        const practitionerPromises = memberRecords.map(m =>
          getMemberPractitioner(m.practitioner_id)
        )
        const practitionerResults = await Promise.all(practitionerPromises)
        setPractitioners(practitionerResults.filter((p): p is PractitionerProfile => p !== null))

        const resourcePromises = memberRecords.map(m =>
          getAllMemberResources(m.id, m.practitioner_id)
        )
        const resourceResults = await Promise.all(resourcePromises)
        setResources(resourceResults.flat())
      }
    } catch (error) {
      console.error('Error loading resources:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du chargement' : 'Error loading resources')
    } finally {
      setLoading(false)
    }
  }

  // Get pending resources (to do)
  const pendingResources = resources.filter(r =>
    r.status === 'pending' || r.status === 'in_progress' || r.status === 'unviewed'
  )

  // Get completed resources
  const completedResources = resources.filter(r =>
    r.status === 'completed' || r.status === 'viewed'
  )

  const handleResourceClick = (item: MemberResourceItem) => {
    if (item.type === 'assignment') {
      router.push(`/fill/${item.assignmentId}`)
    } else {
      router.push(`/fill/shared/${item.resource.id}`)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId)
    try {
      await acceptInvitation(invitationId)
      toast.success(locale === 'fr' ? 'Invitation acceptée!' : 'Invitation accepted!')
      window.location.reload()
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Error accepting invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId)
    try {
      await rejectInvitation(invitationId)
      toast.success(locale === 'fr' ? 'Invitation refusée' : 'Invitation declined')
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error('Error rejecting invitation:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du refus' : 'Error declining invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-emerald-600 animate-pulse" />
            </div>
            <span className="text-gray-500 text-sm">
              {locale === 'fr' ? 'Chargement...' : 'Loading...'}
            </span>
          </motion.div>
        </div>
      </MemberLayout>
    )
  }

  const firstName = members[0]?.first_name || ''

  return (
    <MemberLayout>
      {/* Header */}
      <div className="px-5 pt-14 pb-2 safe-area-pt">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
              {getGreeting(locale)},
            </h1>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
              {firstName || (locale === 'fr' ? 'Ami' : 'Friend')}!
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1.5">
              {getMotivationalMessage(locale)}
              <Clock className="w-4 h-4 text-emerald-500" />
            </p>
          </div>

          {/* Header Icons */}
          <div className="flex items-center gap-1 bg-white rounded-full px-3 py-2 shadow-sm">
            <button className="p-1.5 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {invitations.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>
            <button className="p-1.5">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-5">
        {/* Pending Invitations */}
        <AnimatePresence>
          {invitations.map((invitation) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-emerald-600 font-medium">
                    {locale === 'fr' ? 'Nouvelle invitation' : 'New invitation'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {invitation.practitioner_name || invitation.practitioner_email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectInvitation(invitation.id)}
                  disabled={processingInvitation === invitation.id}
                  className="flex-1 rounded-full border-gray-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  {locale === 'fr' ? 'Refuser' : 'Decline'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={processingInvitation === invitation.id}
                  className="flex-1 rounded-full bg-emerald-500 hover:bg-emerald-600"
                >
                  {processingInvitation === invitation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      {locale === 'fr' ? 'Accepter' : 'Accept'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Your Flow Today Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/80 rounded-3xl p-5 border border-emerald-100/50"
        >
          <div className="flex items-center gap-4 mb-4">
            {/* Progress Circle */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 p-1">
                <div className="w-full h-full rounded-full bg-emerald-50 flex items-center justify-center">
                  <Leaf className="w-7 h-7 text-emerald-500" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {locale === 'fr' ? 'Votre parcours' : 'Your Journey'}
                </h3>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {pendingResources.length > 0
                    ? (locale === 'fr' ? 'En cours' : 'Active')
                    : (locale === 'fr' ? 'À jour' : 'Up to date')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {pendingResources.length > 0
                  ? `${pendingResources.length} ${locale === 'fr' ? 'ressource(s) à compléter' : 'resource(s) to complete'}`
                  : (locale === 'fr' ? 'Vous êtes à jour!' : 'You\'re all caught up!')}
              </p>
            </div>
          </div>

          {/* Next Task */}
          {pendingResources.length > 0 && (
            <>
              <p className="text-sm text-emerald-600 font-medium italic mb-2">
                {locale === 'fr' ? 'votre prochaine étape' : 'your next step'}
              </p>
              <motion.button
                onClick={() => handleResourceClick(pendingResources[0])}
                className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 line-clamp-1">
                    {typeof pendingResources[0].resource.title === 'string'
                      ? pendingResources[0].resource.title
                      : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    {locale === 'fr' ? 'touchez pour commencer' : 'tap to begin'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </motion.button>

              {/* Pagination dots */}
              {pendingResources.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {pendingResources.slice(0, 5).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i === 0 ? 'w-5 h-1.5 bg-emerald-500' : 'w-1.5 h-1.5 bg-emerald-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {pendingResources.length === 0 && (
            <div className="text-center py-4">
              <Sparkles className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {locale === 'fr'
                  ? 'Aucune ressource en attente'
                  : 'No pending resources'}
              </p>
            </div>
          )}

          {/* Choose what feels right */}
          <p className="text-center text-sm text-gray-400 mt-4">
            {locale === 'fr' ? 'choisissez ce qui vous convient' : 'choose what feels right'} ✨
          </p>
        </motion.div>

        {/* Today's Journey / Progress */}
        {resources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-5 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {locale === 'fr' ? 'Votre progression' : 'Your Progress'}
              </h3>
              <span className="text-xs text-gray-400">
                {completedResources.length}/{resources.length}
              </span>
            </div>

            {/* Progress visualization */}
            <div className="relative h-16 bg-gray-50 rounded-2xl overflow-hidden mb-3">
              <div className="absolute inset-0 flex items-center px-4">
                {resources.slice(0, 8).map((resource, i) => {
                  const isCompleted = resource.status === 'completed' || resource.status === 'viewed'
                  const colors = ['bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-amber-400', 'bg-orange-400', 'bg-rose-400', 'bg-purple-400', 'bg-blue-400']
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleResourceClick(resource)}
                      className={`w-8 h-8 rounded-full ${colors[i % colors.length]} ${
                        isCompleted ? 'opacity-100' : 'opacity-30'
                      } flex items-center justify-center cursor-pointer active:scale-90 transition-transform mr-2`}
                    >
                      {isCompleted && <Check className="w-4 h-4 text-white" />}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Progress message */}
            <p className="text-emerald-600 font-medium text-sm">
              {completedResources.length === 0
                ? (locale === 'fr' ? 'Commencez votre parcours!' : 'Start your journey!')
                : completedResources.length === resources.length
                  ? (locale === 'fr' ? 'Parcours complété! 🎉' : 'Journey complete! 🎉')
                  : (locale === 'fr' ? 'Vous progressez bien!' : 'You\'re making progress!')}
            </p>
          </motion.div>
        )}

        {/* All Resources Section */}
        {resources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
              {locale === 'fr' ? 'Toutes les ressources' : 'All Resources'}
            </h3>
            <div className="space-y-3">
              {resources.map((item, index) => {
                const TypeIcon = typeIcons[item.resource.type] || FileText
                const isCompleted = item.status === 'completed' || item.status === 'viewed'

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleResourceClick(item)}
                    className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left border border-gray-100"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-100'
                        : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TypeIcon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium line-clamp-1 ${
                        isCompleted ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {typeof item.resource.title === 'string' ? item.resource.title : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isCompleted
                          ? (locale === 'fr' ? 'Complété' : 'Completed')
                          : item.status === 'in_progress'
                            ? (locale === 'fr' ? 'En cours' : 'In progress')
                            : (locale === 'fr' ? 'À faire' : 'To do')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {resources.length === 0 && invitations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 text-center border border-gray-100"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Bienvenue!' : 'Welcome!'}
            </h3>
            <p className="text-gray-500 text-sm">
              {locale === 'fr'
                ? 'Vos ressources apparaîtront ici une fois partagées par votre praticien.'
                : 'Your resources will appear here once shared by your practitioner.'}
            </p>
          </motion.div>
        )}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </MemberLayout>
  )
}
