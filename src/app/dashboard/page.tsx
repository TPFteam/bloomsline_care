'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@/types/user'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  FileText,
  Table2,
  ChevronRight,
  BookOpen,
  Puzzle,
  Sparkles,
  X,
  Plus,
  Clock,
  HeartHandshake,
  UserPlus,
  Edit3,
  Share2,
  Calendar,
  CheckCircle2,
  Send,
  Mail,
  Phone,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'

interface ActivityItem {
  id: string
  type: 'resource_created' | 'resource_updated' | 'member_added' | 'session_scheduled' | 'session_completed' | 'resource_shared' | 'submission_received'
  title: string
  description: string
  timestamp: string
  href?: string
}

interface TemplateOption {
  id: string
  type: 'worksheet' | 'table' | 'psychoeducation'
  name: { en: string; fr: string }
  description: { en: string; fr: string }
  href: string
}


type ResourceType = 'worksheet' | 'table' | 'psychoeducation'

interface Template {
  id: string
  name: { en: string; fr: string }
  description: { en: string; fr: string }
}

const templatesData: Record<ResourceType, Template[]> = {
  psychoeducation: [
    {
      id: 'self-esteem',
      name: { en: 'Understanding Self-Esteem', fr: 'Comprendre l\'estime de soi' },
      description: { en: 'Guide to building healthy self-esteem', fr: 'Guide pour une estime de soi saine' },
    },
    {
      id: 'cbt-introduction',
      name: { en: 'CBT Introduction', fr: 'Introduction à la TCC' },
      description: { en: 'Simple introduction to CBT', fr: 'Introduction simple à la TCC' },
    },
  ],
  worksheet: [
    {
      id: 'gratitude',
      name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
      description: { en: 'Daily gratitude reflection practice', fr: 'Pratique quotidienne de réflexion de gratitude' },
    },
  ],
  table: [
    {
      id: 'cognitive-restructuring',
      name: { en: 'Cognitive Restructuring Chart', fr: 'Tableau de restructuration cognitive' },
      description: { en: 'Challenge negative thoughts', fr: 'Remettre en question les pensées négatives' },
    },
    {
      id: 'emotion-tracker',
      name: { en: 'Emotion Tracker', fr: 'Suivi des émotions' },
      description: { en: 'Monitor emotions', fr: 'Surveiller les émotions' },
    },
  ],
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null)

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [savingMember, setSavingMember] = useState(false)

  // Featured templates - one from each type
  const featuredTemplates: TemplateOption[] = [
    {
      id: 'thought-record',
      type: 'worksheet',
      name: { en: 'Thought Record', fr: 'Journal de pensées' },
      description: { en: 'Classic CBT thought record', fr: 'Journal de pensées TCC classique' },
      href: '/resources/create/worksheet?template=thought-record',
    },
    {
      id: 'thought-log',
      type: 'table',
      name: { en: 'Thought Log', fr: 'Suivi des pensées' },
      description: { en: 'Track thoughts over time', fr: 'Suivre les pensées au fil du temps' },
      href: '/resources/create/table?template=thought-log',
    },
    {
      id: 'condition-overview',
      type: 'psychoeducation',
      name: { en: 'Condition Overview', fr: 'Aperçu d\'une condition' },
      description: { en: 'Explain a mental health topic', fr: 'Expliquer un sujet de santé mentale' },
      href: '/resources/create/psychoeducation?template=condition-overview',
    },
  ]
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { t, locale, setLocale } = useLanguage()

  // Fetch activity data
  const fetchRecentActivity = useCallback(async (userId: string, currentLocale: string) => {
    try {
      const activities: ActivityItem[] = []

      // Fetch resources created
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('id, title, type, created_at')
        .eq('practitioner_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!resourcesError && resources) {
        resources.forEach((resource) => {
          activities.push({
            id: `resource-${resource.id}`,
            type: 'resource_created',
            title: resource.title || (currentLocale === 'fr' ? 'Sans titre' : 'Untitled'),
            description: currentLocale === 'fr'
              ? `Créé un ${resource.type === 'worksheet' ? 'exercice' : resource.type === 'table' ? 'tableau' : 'psychoéducation'}`
              : `Created a ${resource.type}`,
            timestamp: resource.created_at,
            href: `/resources/${resource.id}`,
          })
        })
      }

      // Fetch members added
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, full_name, created_at')
        .eq('practitioner_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!membersError && members) {
        members.forEach((member) => {
          activities.push({
            id: `member-${member.id}`,
            type: 'member_added',
            title: member.full_name || (currentLocale === 'fr' ? 'Nouveau patient' : 'New member'),
            description: currentLocale === 'fr' ? 'Patient ajouté' : 'Member added',
            timestamp: member.created_at,
            href: `/members/${member.id}`,
          })
        })
      }

      // Fetch shared resources
      const { data: sharedResources, error: sharedError } = await supabase
        .from('member_shared_resources')
        .select(`
          id,
          shared_at,
          resource:resources(id, title, type),
          member:members(id, full_name)
        `)
        .eq('practitioner_id', userId)
        .order('shared_at', { ascending: false })
        .limit(5)

      if (!sharedError && sharedResources) {
        sharedResources.forEach((share) => {
          const resource = Array.isArray(share.resource) ? share.resource[0] : share.resource
          const member = Array.isArray(share.member) ? share.member[0] : share.member
          if (resource && member) {
            activities.push({
              id: `share-${share.id}`,
              type: 'resource_shared',
              title: resource.title || (currentLocale === 'fr' ? 'Sans titre' : 'Untitled'),
              description: currentLocale === 'fr'
                ? `Partagé avec ${member.full_name}`
                : `Shared with ${member.full_name}`,
              timestamp: share.shared_at,
              href: `/members/${member.id}`,
            })
          }
        })
      }

      // Fetch bookings/sessions
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, client_name, session_type, status, start_time, created_at, member_id')
        .eq('practitioner_id', userId)
        .in('status', ['confirmed', 'completed', 'pending'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (!bookingsError && bookings) {
        bookings.forEach((booking) => {
          const isCompleted = booking.status === 'completed'
          activities.push({
            id: `booking-${booking.id}`,
            type: isCompleted ? 'session_completed' : 'session_scheduled',
            title: booking.client_name,
            description: isCompleted
              ? (currentLocale === 'fr' ? 'Séance terminée' : 'Session completed')
              : (currentLocale === 'fr' ? 'Séance programmée' : 'Session scheduled'),
            timestamp: booking.created_at,
            href: booking.member_id ? `/members/${booking.member_id}` : undefined,
          })
        })
      }

      // Fetch member submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('resource_submissions')
        .select(`
          id,
          submitted_at,
          status,
          resource:resources(id, title, type),
          member:members(id, full_name)
        `)
        .eq('practitioner_id', userId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(5)

      if (!submissionsError && submissions) {
        submissions.forEach((sub) => {
          const resource = Array.isArray(sub.resource) ? sub.resource[0] : sub.resource
          const member = Array.isArray(sub.member) ? sub.member[0] : sub.member
          if (resource && member) {
            activities.push({
              id: `submission-${sub.id}`,
              type: 'submission_received',
              title: resource.title || (currentLocale === 'fr' ? 'Sans titre' : 'Untitled'),
              description: currentLocale === 'fr'
                ? `Réponse de ${member.full_name}`
                : `Response from ${member.full_name}`,
              timestamp: sub.submitted_at,
              href: `/members/${member.id}`,
            })
          }
        })
      }

      // Sort by timestamp and take top 3
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 3))
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }, [supabase])

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()) {
      toast.error(locale === 'fr'
        ? 'Le prénom, le nom et l\'email sont requis'
        : 'First name, last name, and email are required')
      return
    }

    setSavingMember(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        return
      }

      const memberData = {
        practitioner_id: authUser.id,
        first_name: newMember.firstName.trim(),
        last_name: newMember.lastName.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone.trim() || null,
        status: 'pending' as const,
        engagement_level: 'medium' as const,
      }

      const { error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // Reset form and close modal
      setNewMember({ firstName: '', lastName: '', email: '', phone: '' })
      setShowAddMemberModal(false)
      toast.success(locale === 'fr' ? 'Patient créé avec succès!' : 'Member created successfully!')

      // Refresh activity
      await fetchRecentActivity(authUser.id, locale)
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating member')
    } finally {
      setSavingMember(false)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/sign-in')
        return
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          router.push('/onboarding')
          return
        }
        const userType = authUser.user_metadata?.user_type || 'mentor'
        if (userType === 'member') {
          router.replace('/home')
          return
        }
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          user_type: userType,
          preferred_language: 'en',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        })
      } else {
        if (userProfile.user_type === 'member') {
          router.replace('/home')
          return
        }
        setUser(userProfile)
        if (userProfile.preferred_language) {
          setLocale(userProfile.preferred_language, false)
        }
      }

      setLoading(false)

      if (searchParams.get('welcome') === 'true') {
        toast.success(`Welcome to Bloomsline, ${authUser.user_metadata?.full_name || 'there'}!`)
      }

      await fetchRecentActivity(authUser.id, locale)
    }

    getUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, supabase, setLocale, locale])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return locale === 'fr' ? 'Bonjour' : 'Good morning'
    if (hour < 18) return locale === 'fr' ? 'Bonjour' : 'Good afternoon'
    if (hour < 22) return locale === 'fr' ? 'Bonsoir' : 'Good evening'
    return locale === 'fr' ? 'Bonne nuit' : 'Good night'
  }

  const getTemplateIcon = (type: TemplateOption['type']) => {
    switch (type) {
      case 'worksheet': return FileText
      case 'table': return Table2
      case 'psychoeducation': return BookOpen
      default: return FileText
    }
  }

  const getTemplateColor = (type: TemplateOption['type']) => {
    switch (type) {
      case 'worksheet': return 'bg-blue-50 text-blue-600'
      case 'table': return 'bg-emerald-50 text-emerald-600'
      case 'psychoeducation': return 'bg-purple-50 text-purple-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const getTemplateTypeLabel = (type: TemplateOption['type']) => {
    switch (type) {
      case 'worksheet': return locale === 'fr' ? 'Fiche' : 'Worksheet'
      case 'table': return locale === 'fr' ? 'Tableau' : 'Table'
      case 'psychoeducation': return locale === 'fr' ? 'Psychoéducation' : 'Psychoeducation'
      default: return ''
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'resource_created': return FileText
      case 'resource_updated': return Edit3
      case 'member_added': return UserPlus
      case 'session_scheduled': return Calendar
      case 'session_completed': return CheckCircle2
      case 'resource_shared': return Share2
      case 'submission_received': return Send
      default: return FileText
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'resource_created': return 'bg-blue-50 text-blue-600'
      case 'resource_updated': return 'bg-purple-50 text-purple-600'
      case 'member_added': return 'bg-emerald-50 text-emerald-600'
      case 'session_scheduled': return 'bg-amber-50 text-amber-600'
      case 'session_completed': return 'bg-green-50 text-green-600'
      case 'resource_shared': return 'bg-indigo-50 text-indigo-600'
      case 'submission_received': return 'bg-pink-50 text-pink-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return locale === 'fr' ? 'À l\'instant' : 'Just now'
    if (diffMins < 60) return locale === 'fr' ? `Il y a ${diffMins} min` : `${diffMins}m ago`
    if (diffHours < 24) return locale === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`
    if (diffDays < 7) return locale === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
  }

  const quickActions = [
    {
      id: 'education',
      type: 'psychoeducation' as ResourceType,
      title: locale === 'fr' ? 'Psychoéducation' : 'Psychoeducation',
      icon: BookOpen,
      color: 'from-purple-400 to-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'worksheet',
      type: 'worksheet' as ResourceType,
      title: locale === 'fr' ? 'Exercice' : 'Worksheet',
      icon: FileText,
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'table',
      type: 'table' as ResourceType,
      title: locale === 'fr' ? 'Tableau' : 'Table',
      icon: Table2,
      color: 'from-emerald-400 to-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'activity',
      type: null,
      title: locale === 'fr' ? 'Activité' : 'Activity',
      icon: Puzzle,
      color: 'from-amber-400 to-amber-500',
      bgColor: 'bg-amber-50',
      comingSoon: true,
    },
    {
      id: 'add-patient',
      type: null,
      title: locale === 'fr' ? 'Nouveau suivi' : 'New Follow-up',
      icon: HeartHandshake,
      color: 'from-rose-400 to-rose-500',
      bgColor: 'bg-rose-50',
      isAddPatient: true,
    },
  ]

  const getTypeLabel = (type: ResourceType) => {
    const labels: Record<ResourceType, { en: string; fr: string }> = {
      psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation' },
      worksheet: { en: 'Worksheet', fr: 'Fiche' },
      table: { en: 'Table', fr: 'Tableau' },
    }
    return labels[type][locale]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-100 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors">
      <AppSidebar activeItem="home" />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <Home className="w-4 h-4" strokeWidth={2.5} />
              <span>{locale === 'fr' ? 'Accueil' : 'Home'}</span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          {/* Greeting Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-end justify-between"
          >
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {locale === 'fr' ? 'Mon espace de travail' : 'My Workspace'}
              </p>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}
              </h1>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="grid grid-cols-6 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={action.comingSoon ? {} : { y: -2, scale: 1.02 }}
                  onClick={() => {
                    if (action.comingSoon) return
                    if ('isAddPatient' in action && action.isAddPatient) {
                      setShowAddMemberModal(true)
                    } else if (action.type) {
                      setSelectedType(action.type)
                    }
                  }}
                  className={`flex flex-col items-center group ${action.comingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                    <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-gray-200/80 transition-colors relative overflow-hidden p-4 isolate">
                      {/* Custom illustrations for each card */}
                      {action.id === 'worksheet' && (
                        <div className="relative">
                          {/* Document */}
                          <motion.div
                            className="w-16 h-20 bg-white rounded-lg shadow-md flex flex-col p-2 gap-1.5"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-full h-1.5 bg-blue-200 rounded-full" />
                            <div className="w-3/4 h-1.5 bg-blue-100 rounded-full" />
                            <div className="w-full h-1.5 bg-blue-200 rounded-full" />
                            <div className="w-1/2 h-1.5 bg-blue-100 rounded-full" />
                          </motion.div>
                          {/* Floating checkmark */}
                          <motion.div
                            className="absolute -right-3 -top-2 w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <FileText className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'table' && (
                        <div className="relative">
                          {/* Table grid */}
                          <motion.div
                            className="grid grid-cols-3 gap-1 p-2 bg-white rounded-lg shadow-md"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          >
                            {[...Array(9)].map((_, i) => (
                              <motion.div
                                key={i}
                                className={`w-4 h-4 rounded ${i < 3 ? 'bg-emerald-300' : 'bg-emerald-100'}`}
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                          </motion.div>
                          {/* Floating badge */}
                          <motion.div
                            className="absolute -right-2 -bottom-2 w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          >
                            <Table2 className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'education' && (
                        <div className="relative">
                          {/* Book */}
                          <motion.div
                            className="w-14 h-18 bg-gradient-to-br from-purple-500 to-purple-600 rounded-r-lg rounded-l shadow-md flex flex-col justify-center items-center"
                            animate={{ rotateY: [0, 5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-10 h-1 bg-white/30 rounded mb-1" />
                            <div className="w-8 h-1 bg-white/20 rounded mb-1" />
                            <div className="w-10 h-1 bg-white/30 rounded" />
                          </motion.div>
                          {/* Floating elements */}
                          <motion.div
                            className="absolute -left-3 -top-2 w-6 h-6 bg-purple-200 rounded-lg flex items-center justify-center"
                            animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <span className="text-xs">💡</span>
                          </motion.div>
                          <motion.div
                            className="absolute -right-2 top-0 w-5 h-5 bg-purple-300 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                          />
                        </div>
                      )}

                      {action.id === 'activity' && (
                        <div className="relative">
                          {/* Activity checklist card */}
                          <motion.div
                            className="w-16 h-20 bg-white rounded-lg shadow-md flex flex-col p-2 gap-1.5"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="flex items-center gap-1.5">
                              <motion.div
                                className="w-3 h-3 rounded bg-amber-400"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                              />
                              <div className="flex-1 h-1.5 bg-amber-200 rounded-full" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <motion.div
                                className="w-3 h-3 rounded bg-amber-300"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                              />
                              <div className="flex-1 h-1.5 bg-amber-100 rounded-full" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <motion.div
                                className="w-3 h-3 rounded bg-amber-200"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                              />
                              <div className="flex-1 h-1.5 bg-amber-100 rounded-full" />
                            </div>
                          </motion.div>
                          {/* Floating badge */}
                          <motion.div
                            className="absolute -right-2 -top-2 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Puzzle className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'add-patient' && (
                        <div className="relative">
                          {/* Patient profile card */}
                          <motion.div
                            className="w-16 h-20 bg-white rounded-lg shadow-md flex flex-col items-center pt-3 gap-1"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {/* Avatar placeholder */}
                            <motion.div
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-rose-400"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            {/* Name lines */}
                            <div className="w-10 h-1.5 bg-rose-200 rounded-full mt-1" />
                            <div className="w-6 h-1 bg-rose-100 rounded-full" />
                          </motion.div>
                          {/* Plus badge */}
                          <motion.div
                            className="absolute -right-2 -bottom-2 w-7 h-7 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {/* Coming Soon badge */}
                      {action.comingSoon && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                          {locale === 'fr' ? 'Bientôt' : 'Soon'}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">{action.title}</p>
                  </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Latest Activity */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {locale === 'fr' ? 'Activité récente' : 'Latest activity'}
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {recentActivity.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      {locale === 'fr' ? 'Aucune activité récente' : 'No recent activity'}
                    </p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type)
                    const colorClass = getActivityColor(activity.type)
                    const content = (
                      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                          <ActivityIcon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    )
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.05 }}
                      >
                        {activity.href ? (
                          <Link href={activity.href}>{content}</Link>
                        ) : (
                          content
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>

            {/* Explore Templates */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {locale === 'fr' ? 'Modèles à explorer' : 'Explore templates'}
              </h2>

              <div className="flex flex-col gap-3">
                {featuredTemplates.map((template, index) => {
                  const TemplateIcon = getTemplateIcon(template.type)
                  const colorClass = getTemplateColor(template.type)
                  return (
                    <Link key={template.id} href={template.href}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                          <TemplateIcon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700">
                            {template.name[locale]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getTemplateTypeLabel(template.type)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => setShowScheduleModal(false)}
      />

      {/* Template Selection Modal */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedType(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Choisir un modèle' : 'Choose a template'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getTypeLabel(selectedType)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedType(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Templates List */}
              <div className="p-4 space-y-2">
                {templatesData[selectedType].map((template, index) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      router.push(`/resources/create/${selectedType}?template=${template.id}`)
                      setSelectedType(null)
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-gray-700">
                        {template.name[locale]}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {template.description[locale]}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </motion.button>
                ))}

                {/* Blank Option */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: templatesData[selectedType].length * 0.05 }}
                  onClick={() => {
                    router.push(`/resources/create/${selectedType}?template=blank`)
                    setSelectedType(null)
                  }}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {locale === 'fr'
                        ? (selectedType === 'worksheet' ? 'Nouvel exercice' : selectedType === 'table' ? 'Nouveau tableau' : 'Nouvelle fiche')
                        : (selectedType === 'worksheet' ? 'New Worksheet' : selectedType === 'table' ? 'New Table' : 'New Psychoeducation')
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {locale === 'fr' ? 'Créez sans modèle' : 'Start from scratch'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddMemberModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-md shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr' ? 'Nouveau Patient' : 'New Patient'}
                </h2>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddMember} className="p-5">
                <div className="space-y-4">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Prénom' : 'First Name'} *
                      </label>
                      <input
                        type="text"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                        placeholder={locale === 'fr' ? 'Jean' : 'John'}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Nom' : 'Last Name'} *
                      </label>
                      <input
                        type="text"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                        placeholder={locale === 'fr' ? 'Dupont' : 'Doe'}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                      placeholder={locale === 'fr' ? 'jean@exemple.com' : 'john@example.com'}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {locale === 'fr' ? 'Téléphone' : 'Phone'}
                      <span className="text-gray-400 font-normal text-xs">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                      placeholder={locale === 'fr' ? '+33 6 12 34 56 78' : '+1 (555) 123-4567'}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddMemberModal(false)}
                    className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingMember}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                  >
                    {savingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {locale === 'fr' ? 'Création...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Créer' : 'Create'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-100 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
