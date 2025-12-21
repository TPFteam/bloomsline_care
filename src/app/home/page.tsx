'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  ChevronRight,
  BookOpen,
  Puzzle,
  Check,
  X,
  UserPlus,
  Bell,
  Settings,
  Heart,
  Leaf,
  Sparkles,
  Smile,
  Sun,
  Zap,
  CloudRain,
  Flame,
  Star,
  Trophy,
  Wind,
  Moon,
  LogOut,
  Circle,
  Eye,
  Coffee,
  Sprout,
  StretchHorizontal,
  MapPin,
  Music,
  Cloud,
  RefreshCw,
  List,
  Gift,
  Hand,
  Stars,
  CalendarHeart,
  Sofa,
  Mail,
  Shield,
  Play,
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
import { getMemberMoments, type Moment } from '@/lib/services/moments'

// Ritual types
interface Ritual {
  id: string
  name: string
  name_fr: string
  description: string | null
  description_fr: string | null
  benefit: string | null
  benefit_fr: string | null
  category: 'morning' | 'midday' | 'evening' | 'selfcare'
  icon: string | null
  duration_suggestion: number | null
  is_predefined: boolean
}

interface MemberRitual {
  id: string
  member_id: string
  ritual_id: string
  tracking_type: 'checkbox' | 'duration' | 'streak'
  is_active: boolean
  sort_order: number
  planned_time: string | null
  ritual: Ritual
}

interface RitualCompletion {
  id: string
  member_id: string
  ritual_id: string
  completion_date: string
  completed: boolean
  duration_minutes: number | null
  notes: string | null
}

// Ritual icon mapping
const RITUAL_ICONS: Record<string, React.ElementType> = {
  eye: Eye,
  coffee: Coffee,
  sprout: Sprout,
  'stretch-horizontal': StretchHorizontal,
  sun: Sun,
  'map-pin': MapPin,
  music: Music,
  cloud: Cloud,
  'refresh-cw': RefreshCw,
  heart: Heart,
  list: List,
  gift: Gift,
  moon: Moon,
  hand: Hand,
  stars: Stars,
  'calendar-heart': CalendarHeart,
  sofa: Sofa,
  mail: Mail,
  smile: Smile,
  shield: Shield,
}

// Category gradients
const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  morning: { from: '#fbbf24', to: '#f59e0b' },
  midday: { from: '#22d3ee', to: '#06b6d4' },
  evening: { from: '#a78bfa', to: '#8b5cf6' },
  selfcare: { from: '#fb7185', to: '#f43f5e' },
}

// Emotion scores: positive = higher, negative = lower
const EMOTION_SCORES: Record<string, number> = {
  // Positive (high scores)
  grateful: 90,
  joyful: 95,
  inspired: 85,
  loved: 92,
  peaceful: 80,
  calm: 75,
  hopeful: 78,
  proud: 88,
  // Softer/processing (mid-low scores)
  overwhelmed: 35,
  tired: 40,
  uncertain: 45,
  tender: 50,
  restless: 42,
  heavy: 32,
  // Legacy (for old data)
  anxious: 35,
  sad: 25,
  frustrated: 30,
}

// Emotion colors - vibrant gradients
const EMOTION_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  // Positive emotions - warm/bright colors
  grateful: { from: '#34d399', to: '#10b981', glow: 'rgba(52, 211, 153, 0.5)' },
  joyful: { from: '#fbbf24', to: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)' },
  inspired: { from: '#a78bfa', to: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  loved: { from: '#fb7185', to: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)' },
  peaceful: { from: '#22d3ee', to: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  calm: { from: '#60a5fa', to: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  hopeful: { from: '#facc15', to: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' },
  proud: { from: '#fb923c', to: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' },
  // Softer/processing emotions - muted/soft colors
  overwhelmed: { from: '#94a3b8', to: '#64748b', glow: 'rgba(100, 116, 139, 0.5)' },
  tired: { from: '#a5b4fc', to: '#818cf8', glow: 'rgba(165, 180, 252, 0.5)' },
  uncertain: { from: '#cbd5e1', to: '#94a3b8', glow: 'rgba(148, 163, 184, 0.5)' },
  tender: { from: '#fda4af', to: '#fb7185', glow: 'rgba(253, 164, 175, 0.5)' },
  restless: { from: '#c4b5fd', to: '#a78bfa', glow: 'rgba(196, 181, 253, 0.5)' },
  heavy: { from: '#9ca3af', to: '#6b7280', glow: 'rgba(107, 114, 128, 0.5)' },
  // Legacy
  anxious: { from: '#fbbf24', to: '#d97706', glow: 'rgba(217, 119, 6, 0.5)' },
  sad: { from: '#818cf8', to: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' },
  frustrated: { from: '#f87171', to: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
}

// Emotion icons
const EMOTION_ICONS: Record<string, React.ElementType> = {
  // Positive
  grateful: Heart,
  joyful: Smile,
  inspired: Zap,
  loved: Heart,
  peaceful: Moon,
  calm: Leaf,
  hopeful: Star,
  proud: Trophy,
  // Softer/processing
  overwhelmed: CloudRain,
  tired: Moon,
  uncertain: Cloud,
  tender: Heart,
  restless: Wind,
  heavy: CloudRain,
  // Legacy
  anxious: CloudRain,
  sad: CloudRain,
  frustrated: Flame,
}

// Get color for moment's primary emotion
function getMomentColor(moment: Moment): { from: string; to: string; glow: string } {
  if (!moment.moods || moment.moods.length === 0) {
    return { from: '#e5e7eb', to: '#d1d5db', glow: 'rgba(209, 213, 219, 0.4)' }
  }
  return EMOTION_COLORS[moment.moods[0]] || { from: '#e5e7eb', to: '#d1d5db', glow: 'rgba(209, 213, 219, 0.4)' }
}

// Get icon for moment's primary emotion
function getMomentIcon(moment: Moment): React.ElementType {
  if (!moment.moods || moment.moods.length === 0) return Sun
  return EMOTION_ICONS[moment.moods[0]] || Sun
}

// Get average emotion score for a moment
function getMomentScore(moment: Moment): number {
  if (!moment.moods || moment.moods.length === 0) return 60 // neutral
  const scores = moment.moods.map(m => EMOTION_SCORES[m] || 60)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Get time period from date
function getTimePeriod(date: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

// Get current ritual category based on time of day
function getCurrentRitualCategory(): 'morning' | 'midday' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'midday'
  return 'evening'
}

// Get category label for display
function getCategoryLabel(category: string, locale: string): string {
  const labels: Record<string, { en: string; fr: string }> = {
    morning: { en: 'Morning', fr: 'Matin' },
    midday: { en: 'Midday', fr: 'Midi' },
    evening: { en: 'Evening', fr: 'Soir' },
    selfcare: { en: 'Self-Care', fr: 'Bien-être' },
  }
  return locale === 'fr' ? labels[category]?.fr : labels[category]?.en
}

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
  const [todaysMoments, setTodaysMoments] = useState<Moment[]>([])
  const [memberRituals, setMemberRituals] = useState<MemberRitual[]>([])
  const [todayCompletions, setTodayCompletions] = useState<RitualCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [previewMoment, setPreviewMoment] = useState<Moment | null>(null)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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

      // Load today's moments
      const allMoments = await getMemberMoments()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todaysOnly = allMoments.filter(m => {
        const momentDate = new Date(m.created_at)
        momentDate.setHours(0, 0, 0, 0)
        return momentDate.getTime() === today.getTime()
      })
      setTodaysMoments(todaysOnly.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ))

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

        // Load member rituals and today's completions
        const memberId = memberRecords[0].id
        const today = new Date().toISOString().split('T')[0]

        // Fetch member's active rituals sorted by planned time
        const { data: ritualsData } = await supabase
          .from('member_rituals')
          .select(`
            *,
            ritual:rituals(*)
          `)
          .eq('member_id', memberId)
          .eq('is_active', true)
          .order('planned_time', { ascending: true, nullsFirst: false })

        if (ritualsData) {
          // Sort by planned_time
          const sorted = [...ritualsData].sort((a, b) => {
            if (!a.planned_time) return 1
            if (!b.planned_time) return -1
            return a.planned_time.localeCompare(b.planned_time)
          })
          setMemberRituals(sorted as MemberRitual[])
        }

        // Fetch today's completions
        const { data: completionsData } = await supabase
          .from('ritual_completions')
          .select('*')
          .eq('member_id', memberId)
          .eq('completion_date', today)

        if (completionsData) {
          setTodayCompletions(completionsData as RitualCompletion[])
        }
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

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la déconnexion' : 'Error logging out')
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50/80 via-white to-teal-50/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Animated circle loader */}
            <div className="relative w-12 h-12">
              <motion.div
                className="absolute inset-0 rounded-full border-[3px] border-emerald-100"
              />
              <motion.div
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <motion.span
              className="text-gray-500 text-sm font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {locale === 'fr' ? 'Chargement...' : 'Loading...'}
            </motion.span>
          </motion.div>
        </div>
      </MemberLayout>
    )
  }

  const firstName = members[0]?.first_name || ''

  return (
    <MemberLayout>
      {/* Header */}
      <div className="px-5 pt-6 pb-2 safe-area-pt">
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
            <div className="relative">
              <button
                className="p-1.5"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              {/* Settings Dropdown */}
              <AnimatePresence>
                {showSettingsMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSettingsMenu(false)}
                    />
                    {/* Menu */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 min-w-[160px] z-50"
                    >
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false)
                          router.push('/settings')
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        {locale === 'fr' ? 'Paramètres' : 'Settings'}
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        {isLoggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        {locale === 'fr' ? 'Déconnexion' : 'Logout'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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

        {/* Today's Journey - Emotional Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {locale === 'fr' ? 'Flux du jour' : "Today's Flow"}
            </h3>
          </div>

          {/* Journey Visualization */}
          <div className="relative h-40">
            {/* Background grid lines */}
            <div className="absolute inset-0">
              <div className="absolute inset-x-0 top-1/4 border-t border-gray-100/50" />
              <div className="absolute inset-x-0 top-1/2 border-t border-gray-200/50" />
              <div className="absolute inset-x-0 top-3/4 border-t border-gray-100/50" />
            </div>

            {/* Future time fade overlay */}
            {(() => {
              const currentHour = new Date().getHours() + new Date().getMinutes() / 60
              const currentPosition = Math.max(0, Math.min(100, (currentHour / 24) * 100))
              return (
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent to-gray-50/90 pointer-events-none z-10"
                  style={{
                    left: `${currentPosition}%`,
                    right: 0,
                  }}
                />
              )
            })()}

            {/* Empty state - show when no moments */}
            {todaysMoments.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Sun className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {locale === 'fr' ? 'Aucun moment capturé' : 'No moments yet'}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {locale === 'fr' ? 'Capturez votre premier moment' : 'Capture your first moment'}
                </p>
              </div>
            )}

            {/* Connecting line between moments */}
            {todaysMoments.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                {todaysMoments
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((moment, i, arr) => {
                    if (i === 0) return null
                    const prev = arr[i - 1]
                    const prevTime = new Date(prev.created_at)
                    const currTime = new Date(moment.created_at)

                    const prevHours = prevTime.getHours() + prevTime.getMinutes() / 60
                    const currHours = currTime.getHours() + currTime.getMinutes() / 60

                    const prevX = (prevHours / 24) * 100
                    const currX = (currHours / 24) * 100

                    const prevScore = getMomentScore(prev)
                    const currScore = getMomentScore(moment)

                    // Y: high score = top (low %), low score = bottom (high %)
                    const prevY = 100 - ((prevScore / 100) * 70 + 15)
                    const currY = 100 - ((currScore / 100) * 70 + 15)

                    return (
                      <motion.line
                        key={`line-${moment.id}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                        x1={`${prevX}%`}
                        y1={`${prevY}%`}
                        x2={`${currX}%`}
                        y2={`${currY}%`}
                        stroke="url(#flowGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                    )
                  })}
              </svg>
            )}

            {/* Moment orbs - positioned by time and emotion score */}
            {todaysMoments.length > 0 && (
              <div className="absolute inset-0">
                {todaysMoments
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((moment, i) => {
                    const score = getMomentScore(moment)
                    const momentTime = new Date(moment.created_at)
                    const hours = momentTime.getHours() + momentTime.getMinutes() / 60

                    // X: Time position (12 AM = 0%, 12 AM = 100%)
                    const timePosition = (hours / 24) * 100
                    // Y: Score position (high score = top, low score = bottom)
                    const topPosition = 100 - ((score / 100) * 70 + 15)

                    const colors = getMomentColor(moment)
                    const Icon = getMomentIcon(moment)

                    return (
                      <motion.div
                        key={moment.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                        style={{ left: `${timePosition}%`, top: `${topPosition}%` }}
                        onClick={() => setPreviewMoment(moment)}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative w-11 h-11 rounded-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                            boxShadow: `0 0 24px ${colors.glow}, 0 4px 12px rgba(0,0,0,0.15)`,
                          }}
                        >
                          <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.5} />
                        </motion.div>
                      </motion.div>
                    )
                  })}
              </div>
            )}

            {/* Current time indicator */}
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute top-0 bottom-0 w-px bg-emerald-400/60 z-10"
              style={{
                left: `${((new Date().getHours() + new Date().getMinutes() / 60) / 24) * 100}%`,
                originY: 0,
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </motion.div>
          </div>

          {/* Time labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{locale === 'fr' ? 'Matin' : 'Morning'}</span>
            <span>{locale === 'fr' ? 'Après-midi' : 'Afternoon'}</span>
            <span>{locale === 'fr' ? 'Soir' : 'Evening'}</span>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {todaysMoments.length > 0 ? (
              <p className="text-sm text-gray-600">
                {todaysMoments.length} {locale === 'fr' ? 'moment(s) capturé(s) aujourd\'hui' : 'moment(s) captured today'}
                {' • '}
                <span className="text-emerald-600 font-medium">
                  {(() => {
                    const avgScore = todaysMoments.reduce((acc, m) => acc + getMomentScore(m), 0) / todaysMoments.length
                    if (avgScore >= 80) return locale === 'fr' ? 'Très positif' : 'Very positive'
                    if (avgScore >= 60) return locale === 'fr' ? 'Positif' : 'Positive'
                    if (avgScore >= 40) return locale === 'fr' ? 'Neutre' : 'Neutral'
                    return locale === 'fr' ? 'Difficile' : 'Challenging'
                  })()}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                {locale === 'fr' ? 'Commencez à capturer vos moments' : 'Start capturing your moments'}
              </p>
            )}
          </div>
        </motion.div>

        {/* Upcoming Rituals Section */}
        {(() => {
          const currentCategory = getCurrentRitualCategory()
          const incompleteRituals = memberRituals.filter(mr => {
            // Only show rituals for current time of day
            if (mr.ritual.category !== currentCategory) return false
            // Check if not completed today
            const isCompleted = todayCompletions.some(
              c => c.ritual_id === mr.ritual_id && c.completed
            )
            return !isCompleted
          })

          if (incompleteRituals.length === 0 && memberRituals.length === 0) return null

          const gradient = CATEGORY_GRADIENTS[currentCategory]

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-5 border border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
                    }}
                  >
                    <Circle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'fr' ? 'Rituels à venir' : 'Upcoming Rituals'}
                  </h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {getCategoryLabel(currentCategory, locale)}
                </span>
              </div>

              {/* Rituals List */}
              {incompleteRituals.length > 0 ? (
                <div className="space-y-2">
                  {incompleteRituals.slice(0, 3).map((mr, index) => {
                    const RitualIcon = RITUAL_ICONS[mr.ritual.icon || ''] || Circle
                    const catGradient = CATEGORY_GRADIENTS[mr.ritual.category]

                    return (
                      <motion.div
                        key={mr.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        onClick={() => router.push('/rituals')}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors active:scale-[0.98]"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${catGradient.from}, ${catGradient.to})`,
                          }}
                        >
                          <RitualIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {locale === 'fr' ? mr.ritual.name_fr : mr.ritual.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {mr.planned_time && (
                              <span className="font-medium">{mr.planned_time.slice(0, 5)} • </span>
                            )}
                            {mr.ritual.duration_suggestion && `${mr.ritual.duration_suggestion} min`}
                          </p>
                        </div>
                        <Play className="w-4 h-4 text-gray-300" />
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2"
                  >
                    <Check className="w-6 h-6 text-emerald-600" />
                  </motion.div>
                  <p className="text-sm text-gray-600 font-medium">
                    {locale === 'fr' ? 'Tous les rituels complétés!' : 'All rituals completed!'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {locale === 'fr'
                      ? `${getCategoryLabel(currentCategory, locale)} est fait`
                      : `${getCategoryLabel(currentCategory, locale)} is done`}
                  </p>
                </div>
              )}

              {/* View All Link */}
              {memberRituals.length > 0 && (
                <motion.button
                  onClick={() => router.push('/rituals')}
                  className="w-full mt-3 py-2.5 text-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {locale === 'fr' ? 'Voir tous les rituels' : 'View all rituals'} →
                </motion.button>
              )}
            </motion.div>
          )
        })()}

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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setPreviewMoment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl"
            >
              {/* Preview Media */}
              {previewMoment.media_url && previewMoment.type === 'photo' && (
                <div className="w-full aspect-square">
                  <img
                    src={previewMoment.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {previewMoment.media_url && previewMoment.type === 'video' && (
                <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
                  <video
                    src={previewMoment.media_url}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Mood tags */}
                {previewMoment.moods && previewMoment.moods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {previewMoment.moods.map(mood => {
                      const moodColors = getMomentColor({ ...previewMoment, moods: [mood] })
                      return (
                        <span
                          key={mood}
                          className="px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
                          style={{ background: `linear-gradient(135deg, ${moodColors.from}, ${moodColors.to})` }}
                        >
                          {mood}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Text */}
                {(previewMoment.text_content || previewMoment.caption) && (
                  <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                    {previewMoment.text_content || previewMoment.caption}
                  </p>
                )}

                {/* Time */}
                <p className="text-gray-400 text-xs mb-4">
                  {new Date(previewMoment.created_at).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {/* Close button */}
                <button
                  onClick={() => setPreviewMoment(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium"
                >
                  {locale === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MemberLayout>
  )
}
