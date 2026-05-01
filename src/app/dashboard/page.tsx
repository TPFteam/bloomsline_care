'use client'

import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
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
  Search,
  RefreshCw,
  CalendarPlus,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage, lt } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'
import type { Member } from '@/types/member'
import { ConsentModal } from '@/components/consent-modal'
import { isAdmin } from '@/lib/admin'

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
  name: Record<string, string>
  description: Record<string, string>
  href: string
}


type ResourceType = 'worksheet' | 'table' | 'psychoeducation'

interface Template {
  id: string
  name: Record<string, string>
  description: Record<string, string>
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
  const welcomeShown = useRef(false)
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<{ id: string; client_name: string; session_type: string; start_time: string; member_id: string | null; status: string; meet_link?: string | null }[]>([])

  // Member picker for quick actions
  const [members, setMembers] = useState<{ id: string; first_name: string; last_name: string; status: string; last_session_at: string | null; email: string | null; phone: string | null; user_id: string | null }[]>([])
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [memberPickerAction, setMemberPickerAction] = useState<'share' | 'reengage' | 'summary' | 'session' | null>(null)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [schedulePreselectedMember, setSchedulePreselectedMember] = useState<Member | null>(null)

  // User's latest resources
  const [userResources, setUserResources] = useState<{ id: string; title: string; type: string }[]>([])

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [sendInvite, setSendInvite] = useState(true)
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] as string[] })
  const [savingMember, setSavingMember] = useState(false)
  const [hasConsented, setHasConsented] = useState(true)
  const [memberGroups, setMemberGroups] = useState<{ id: string; name: string; color: string }[]>([])

  // Featured templates - one from each type
  const featuredTemplates: TemplateOption[] = [
    {
      id: 'gratitude',
      type: 'worksheet',
      name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
      description: { en: 'Daily gratitude reflection practice', fr: 'Pratique quotidienne de réflexion de gratitude' },
      href: '/resources/create/worksheet?template=gratitude',
    },
    {
      id: 'cognitive-restructuring',
      type: 'table',
      name: { en: 'Cognitive Restructuring', fr: 'Restructuration cognitive' },
      description: { en: 'Challenge and reframe negative thoughts', fr: 'Remettre en question les pensées négatives' },
      href: '/resources/create/table?template=cognitive-restructuring',
    },
    {
      id: 'cbt-introduction',
      type: 'psychoeducation',
      name: { en: 'CBT Introduction', fr: 'Introduction à la TCC' },
      description: { en: 'Simple introduction to CBT', fr: 'Introduction simple à la TCC' },
      href: '/resources/create/psychoeducation?template=cbt-introduction',
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
        .select('id, first_name, last_name, created_at')
        .eq('practitioner_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!membersError && members) {
        members.forEach((member) => {
          const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || (currentLocale === 'fr' ? 'Nouveau patient' : 'New member')
          activities.push({
            id: `member-${member.id}`,
            type: 'member_added',
            title: memberName,
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
          member:members(id, first_name, last_name)
        `)
        .eq('practitioner_id', userId)
        .order('shared_at', { ascending: false })
        .limit(5)

      if (!sharedError && sharedResources) {
        sharedResources.forEach((share) => {
          const resource = Array.isArray(share.resource) ? share.resource[0] : share.resource
          const member = Array.isArray(share.member) ? share.member[0] : share.member
          if (resource && member) {
            const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || (currentLocale === 'fr' ? 'Patient' : 'Member')
            activities.push({
              id: `share-${share.id}`,
              type: 'resource_shared',
              title: resource.title || (currentLocale === 'fr' ? 'Sans titre' : 'Untitled'),
              description: currentLocale === 'fr'
                ? `Partagé avec ${memberName}`
                : `Shared with ${memberName}`,
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
          member:members(id, first_name, last_name)
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
            const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || (currentLocale === 'fr' ? 'Patient' : 'Member')
            activities.push({
              id: `submission-${sub.id}`,
              type: 'submission_received',
              title: resource.title || (currentLocale === 'fr' ? 'Sans titre' : 'Untitled'),
              description: currentLocale === 'fr'
                ? `Réponse de ${memberName}`
                : `Response from ${memberName}`,
              timestamp: sub.submitted_at,
              href: `/members/${member.id}`,
            })
          }
        })
      }

      // Ensure variety in activities - take most recent from different types first
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Group activities by type and take most recent from each
      const byType = new Map<string, ActivityItem[]>()
      activities.forEach(activity => {
        const existing = byType.get(activity.type) || []
        existing.push(activity)
        byType.set(activity.type, existing)
      })

      // Priority order for variety: member_added, resource_shared, session_*, submission, resource_created
      const priorityTypes = ['member_added', 'resource_shared', 'session_completed', 'session_scheduled', 'submission_received', 'resource_created', 'resource_updated']

      const diverseActivities: ActivityItem[] = []

      // First pass: take one from each type in priority order
      for (const type of priorityTypes) {
        const typeActivities = byType.get(type)
        if (typeActivities && typeActivities.length > 0 && diverseActivities.length < 3) {
          diverseActivities.push(typeActivities[0])
        }
      }

      // If we still have slots, fill with most recent overall (avoiding duplicates)
      if (diverseActivities.length < 3) {
        for (const activity of activities) {
          if (!diverseActivities.find(a => a.id === activity.id) && diverseActivities.length < 3) {
            diverseActivities.push(activity)
          }
        }
      }

      // Sort the final selection by timestamp (most recent first)
      diverseActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setRecentActivity(diverseActivities)
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
        is_minor: newMember.isMinor,
      }

      const { data: memberResult, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // Add to groups if any selected
      if (newMember.groupIds.length > 0 && memberResult?.id) {
        await supabase.from('member_group_members').insert(
          newMember.groupIds.map(gid => ({ group_id: gid, member_id: memberResult.id }))
        )
      }

      // Send invitation email if toggle is on
      if (sendInvite && memberResult?.id) {
        try {
          const { data: practitionerProfile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .single()

          await supabase.functions.invoke('send-member-welcome', {
            body: {
              memberName: newMember.firstName.trim(),
              memberLastName: newMember.lastName.trim(),
              memberEmail: newMember.email.trim(),
              practitionerName: practitionerProfile?.full_name || 'Your practitioner',
              practitionerAvatarUrl: practitionerProfile?.avatar_url || null,
              locale,
            },
          })

          await supabase
            .from('members')
            .update({ invitation_sent: true, invitation_sent_at: new Date().toISOString() })
            .eq('id', memberResult.id)
        } catch (inviteErr) {
          console.error('Error sending invitation:', inviteErr)
        }
      }

      // Reset form and close modal
      setNewMember({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] })
      setSendInvite(true)
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
        setHasConsented(!!userProfile.has_consented)
        if (userProfile.preferred_language) {
          setLocale(userProfile.preferred_language, false)
        }
      }

      setLoading(false)

      // Fetch members for quick action picker
      const { data: membersData } = await supabase
        .from('members')
        .select('id, first_name, last_name, status, last_session_at, email, phone, user_id')
        .eq('practitioner_id', authUser.id)
        .order('first_name')
      if (membersData) setMembers(membersData)

      // Fetch upcoming sessions from BOTH bookings and sessions tables
      // Some sessions may exist only in the sessions table (if booking insert failed silently)
      const now = new Date().toISOString()

      const [bookingsRes, sessionsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('practitioner_id', authUser.id)
          .in('status', ['confirmed', 'pending'])
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(5),
        supabase
          .from('sessions')
          .select('id, session_type, scheduled_at, member_id, status, practitioner_id')
          .eq('practitioner_id', authUser.id)
          .eq('status', 'scheduled')
          .gte('scheduled_at', now)
          .order('scheduled_at', { ascending: true })
          .limit(5),
      ])

      // Merge: use bookings as primary, fill in sessions-only entries
      const bookingMemberIds = new Set((bookingsRes.data || []).map(b => `${b.member_id}_${b.start_time}`))
      const sessionsOnly = (sessionsRes.data || []).filter(
        s => !bookingMemberIds.has(`${s.member_id}_${s.scheduled_at}`)
      )

      // Look up member names for sessions-only entries
      let sessionsMapped: typeof upcomingSessions = []
      if (sessionsOnly.length > 0) {
        const memberIds = [...new Set(sessionsOnly.map(s => s.member_id).filter(Boolean))]
        const { data: memberNames } = memberIds.length > 0
          ? await supabase.from('members').select('id, first_name, last_name').in('id', memberIds)
          : { data: [] }
        const nameMap: Record<string, string> = {}
        memberNames?.forEach(m => { nameMap[m.id] = `${m.first_name} ${m.last_name}` })

        sessionsMapped = sessionsOnly.map(s => ({
          id: s.id,
          client_name: nameMap[s.member_id] || 'Unknown',
          session_type: s.session_type,
          start_time: s.scheduled_at,
          member_id: s.member_id,
          status: 'confirmed',
        }))
      }

      const merged = [...(bookingsRes.data || []), ...sessionsMapped]
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 3)

      setUpcomingSessions(merged)

      // Fetch user's latest resources
      const { data: latestResources } = await supabase
        .from('resources')
        .select('id, title, type')
        .eq('practitioner_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(3)
      if (latestResources && latestResources.length > 0) setUserResources(latestResources)

      if (searchParams.get('welcome') === 'true' && !welcomeShown.current) {
        welcomeShown.current = true
        toast.success(`Welcome to Bloomsline, ${authUser.user_metadata?.full_name || 'there'}!`)
        const url = new URL(window.location.href)
        url.searchParams.delete('welcome')
        window.history.replaceState({}, '', url.pathname)
      }

      await fetchRecentActivity(authUser.id, locale)
    }

    getUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, supabase, setLocale, locale])

  const handleConsent = async () => {
    setHasConsented(true)
    if (user) {
      await supabase.from('users').update({ has_consented: true }).eq('id', user.id)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return locale === 'fr' ? 'Bonjour' : 'Good morning'
    if (hour >= 12 && hour < 18) return locale === 'fr' ? 'Bonjour' : 'Good afternoon'
    return locale === 'fr' ? 'Bonsoir' : 'Good evening'
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
      id: 'add-patient',
      type: null,
      title: locale === 'fr' ? 'Nouveau suivi' : 'New Follow-up',
      icon: HeartHandshake,
      color: 'from-rose-400 to-rose-500',
      bgColor: 'bg-rose-50',
    },
    {
      id: 'book-session',
      type: null,
      title: locale === 'fr' ? 'Créer une séance' : 'Book a Session',
      icon: CalendarPlus,
      color: 'from-teal-400 to-teal-500',
      bgColor: 'bg-teal-50',
    },
    {
      id: 'share-resource',
      type: null,
      title: locale === 'fr' ? 'Envoyer un support' : 'Share a Resource',
      icon: Share2,
      color: 'from-indigo-400 to-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ]

  const getTypeLabel = (type: ResourceType) => {
    const labels: Record<ResourceType, Record<string, string>> = {
      psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation' },
      worksheet: { en: 'Worksheet', fr: 'Fiche' },
      table: { en: 'Table', fr: 'Tableau' },
    }
    return lt(labels[type], locale)
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
      <ConsentModal isOpen={!hasConsented} onAccept={handleConsent} locale={locale} />
      <AppSidebar activeItem="home" />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          isAdmin={!!user && isAdmin(user.id)}
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
            <div className="flex gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  onClick={() => {
                    if (action.id === 'add-patient') {
                      setShowAddMemberModal(true)
                      // Fetch groups for the modal
                      supabase.from('member_groups').select('id, name, color').order('name').then(({ data }) => {
                        if (data) setMemberGroups(data)
                      })
                    } else if (action.id === 'share-resource') {
                      router.push('/resources')
                    } else if (action.id === 'reengage') {
                      setMemberPickerAction('reengage')
                      setMemberSearchQuery('')
                      setShowMemberPicker(true)
                    } else if (action.id === 'bloom-pulse') {
                      setMemberPickerAction('summary')
                      setMemberSearchQuery('')
                      setShowMemberPicker(true)
                    } else if (action.id === 'book-session') {
                      setMemberPickerAction('session')
                      setMemberSearchQuery('')
                      setShowMemberPicker(true)
                    } else if (action.type) {
                      setSelectedType(action.type)
                    }
                  }}
                  className="flex flex-col items-center group cursor-pointer w-[140px]"
                >
                    <div className="w-[140px] h-[140px] bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-gray-200/80 transition-colors relative overflow-hidden p-4 isolate">
                      {/* Custom illustrations for each card */}
                      {action.id === 'add-patient' && (
                        <div className="relative">
                          <motion.div
                            className="w-16 h-20 bg-white rounded-lg shadow-md flex flex-col items-center pt-3 gap-1"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <motion.div
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-rose-400"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <div className="w-10 h-1.5 bg-rose-200 rounded-full mt-1" />
                            <div className="w-6 h-1 bg-rose-100 rounded-full" />
                          </motion.div>
                          <motion.div
                            className="absolute -right-2 -bottom-2 w-7 h-7 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'share-resource' && (
                        <div className="relative">
                          <motion.div
                            className="w-14 h-18 bg-white rounded-lg shadow-md flex flex-col items-center justify-center gap-1.5 p-2"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-10 h-1.5 bg-indigo-200 rounded-full" />
                            <div className="w-8 h-1.5 bg-indigo-100 rounded-full" />
                            <div className="w-10 h-1.5 bg-indigo-200 rounded-full" />
                            <div className="w-6 h-1.5 bg-indigo-100 rounded-full" />
                          </motion.div>
                          <motion.div
                            className="absolute -right-3 -top-1 w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ x: [0, 3, 0], y: [0, -2, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Share2 className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'reengage' && (
                        <div className="relative">
                          <motion.div
                            className="w-16 h-18 bg-white rounded-lg shadow-md flex flex-col items-center pt-2 gap-1"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-10 h-2 bg-amber-200 rounded-full" />
                            <div className="grid grid-cols-3 gap-0.5 mt-1">
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-2.5 h-2.5 rounded-sm bg-amber-100"
                                  animate={i === 4 ? { backgroundColor: ['#fde68a', '#fbbf24', '#fde68a'] } : {}}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              ))}
                            </div>
                          </motion.div>
                          <motion.div
                            className="absolute -right-2 -bottom-2 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ rotate: [0, -180, -360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'bloom-pulse' && (
                        <div className="relative">
                          <motion.div
                            className="w-16 h-18 bg-white rounded-lg shadow-md flex items-end justify-center gap-1 p-2 pt-3"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <motion.div
                              className="w-2.5 bg-violet-200 rounded-full"
                              animate={{ height: [12, 18, 12] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                              className="w-2.5 bg-violet-300 rounded-full"
                              animate={{ height: [18, 10, 18] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            />
                            <motion.div
                              className="w-2.5 bg-violet-400 rounded-full"
                              animate={{ height: [10, 22, 10] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            />
                            <motion.div
                              className="w-2.5 bg-violet-300 rounded-full"
                              animate={{ height: [16, 12, 16] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                            />
                          </motion.div>
                          <motion.div
                            className="absolute -right-2 -top-2 w-7 h-7 bg-gradient-to-br from-violet-400 to-violet-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'book-session' && (
                        <div className="relative">
                          <motion.div
                            className="w-16 h-18 bg-white rounded-lg shadow-md flex flex-col items-center pt-2 gap-1"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-10 h-2 bg-teal-300 rounded-full" />
                            <div className="grid grid-cols-4 gap-0.5 mt-1">
                              {[...Array(8)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className={`w-2 h-2 rounded-sm ${i === 5 ? 'bg-teal-400' : 'bg-teal-100'}`}
                                  animate={i === 5 ? { scale: [1, 1.3, 1] } : {}}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              ))}
                            </div>
                          </motion.div>
                          <motion.div
                            className="absolute -right-2 -bottom-2 w-7 h-7 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </motion.div>
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

            {/* Upcoming Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {locale === 'fr' ? 'Prochaines séances' : 'Upcoming sessions'}
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {upcomingSessions.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      {locale === 'fr' ? 'Aucune séance à venir' : 'No upcoming sessions'}
                    </p>
                  </div>
                ) : (
                  upcomingSessions.map((session, index) => {
                    const sessionDate = new Date(session.start_time)
                    const isToday = sessionDate.toDateString() === new Date().toDateString()
                    const isTomorrow = sessionDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
                    const dayLabel = isToday
                      ? (locale === 'fr' ? "Aujourd'hui" : 'Today')
                      : isTomorrow
                        ? (locale === 'fr' ? 'Demain' : 'Tomorrow')
                        : sessionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    const timeLabel = sessionDate.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })

                    const content = (
                      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-semibold text-blue-600 uppercase leading-none">
                            {sessionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })}
                          </span>
                          <span className="text-sm font-bold text-blue-700 leading-none mt-0.5">
                            {sessionDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700">
                            {session.client_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dayLabel} · {timeLabel}
                          </p>
                        </div>
                        {session.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
                            {locale === 'fr' ? 'En attente' : 'Pending'}
                          </span>
                        )}
                        {session.meet_link && session.status !== 'pending' && (
                          <a
                            href={session.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                          >
                            <Video className="w-3.5 h-3.5" />
                            {locale === 'fr' ? 'Rejoindre' : 'Join'}
                          </a>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                      </div>
                    )

                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                      >
                        {session.member_id ? (
                          <Link href={`/members/${session.member_id}`}>{content}</Link>
                        ) : (
                          content
                        )}
                      </motion.div>
                    )
                  })
                )}
                {upcomingSessions.length > 0 && (
                  <Link
                    href="/bookings"
                    className="flex items-center justify-end gap-2 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {locale === 'fr' ? 'Voir toutes les séances' : 'View all sessions'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>

          {/* Explore Templates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {userResources.length > 0
                ? (locale === 'fr' ? 'Vos dernières ressources' : 'Your latest resources')
                : (locale === 'fr' ? 'Modèles à explorer' : 'Explore templates')}
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {userResources.length > 0
                ? userResources.map((resource, index) => {
                    const TemplateIcon = getTemplateIcon(resource.type as 'worksheet' | 'table' | 'psychoeducation')
                    const colorClass = getTemplateColor(resource.type as 'worksheet' | 'table' | 'psychoeducation')
                    return (
                      <Link key={resource.id} href={`/resources/${resource.id}`}>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                          className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                            <TemplateIcon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700">
                              {resource.title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getTemplateTypeLabel(resource.type as TemplateOption['type'])}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                        </motion.div>
                      </Link>
                    )
                  })
                : featuredTemplates.map((template, index) => {
                    const TemplateIcon = getTemplateIcon(template.type)
                    const colorClass = getTemplateColor(template.type)
                    return (
                      <Link key={template.id} href={template.href}>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                          className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                            <TemplateIcon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700">
                              {lt(template.name, locale)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getTemplateTypeLabel(template.type)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                        </motion.div>
                      </Link>
                    )
                  })
              }
            </div>
          </motion.div>

        </div>
      </main>

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => { setShowScheduleModal(false); setSchedulePreselectedMember(null) }}
        onSuccess={() => { setShowScheduleModal(false); setSchedulePreselectedMember(null) }}
        preselectedMember={schedulePreselectedMember}
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
                        {lt(template.name, locale)}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {lt(template.description, locale)}
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
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
                  {locale === 'fr' ? 'Ajouter un nouveau patient / client' : 'Add a New Person'}
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

                {/* Minor Toggle */}
                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newMember.isMinor || false}
                      onChange={(e) => { setNewMember({ ...newMember, isMinor: e.target.checked }); if (e.target.checked) setSendInvite(false) }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {locale === 'fr' ? 'Mineur' : 'Minor'}
                  </span>
                </label>

                {/* Send Invitation Card */}
                <div
                  onClick={() => setSendInvite(!sendInvite)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all mt-4 ${
                    sendInvite ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    sendInvite ? 'bg-teal-100' : 'bg-gray-100'
                  }`}>
                    <Mail className={`w-4 h-4 ${sendInvite ? 'text-teal-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${sendInvite ? 'text-teal-900' : 'text-gray-500'}`}>
                      {locale === 'fr'
                        ? `Inviter ${newMember.firstName.trim() || 'cette personne'} sur l'app bien-être`
                        : `Invite ${newMember.firstName.trim() || 'this person'} to the wellbeing app`}
                    </p>
                    <p className="text-xs text-gray-400 leading-snug">
                      {locale === 'fr' ? 'Accès gratuit entre les séances' : 'Free access between sessions'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 relative">
                    <div className={`w-9 h-5 rounded-full transition-colors ${sendInvite ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${sendInvite ? 'translate-x-4' : ''}`} />
                  </div>
                </div>

                {/* Group selector */}
                {memberGroups.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Ajouter à un groupe' : 'Add to a Group'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {memberGroups.map(group => {
                        const selected = newMember.groupIds.includes(group.id)
                        const dotColors: Record<string, string> = {
                          blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500',
                          amber: 'bg-amber-500', red: 'bg-red-500', pink: 'bg-pink-500', cyan: 'bg-cyan-500',
                        }
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setNewMember({
                              ...newMember,
                              groupIds: selected
                                ? newMember.groupIds.filter(id => id !== group.id)
                                : [...newMember.groupIds, group.id]
                            })}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              selected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${dotColors[group.color] || 'bg-blue-500'}`} />
                            {group.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

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

      {/* Member Picker Modal */}
      <AnimatePresence>
        {showMemberPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowMemberPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Rechercher une personne' : 'Search for a person'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {memberPickerAction === 'share' && (locale === 'fr' ? 'Envoyer un support' : 'Share a resource')}
                    {memberPickerAction === 'reengage' && (locale === 'fr' ? 'Réengager un suivi' : 'Schedule a session')}
                    {memberPickerAction === 'summary' && (locale === 'fr' ? 'Obtenir un résumé' : 'View summary')}
                    {memberPickerAction === 'session' && (locale === 'fr' ? 'Créer une séance' : 'Book a session')}
                  </p>
                </div>
                <button
                  onClick={() => setShowMemberPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder={locale === 'fr' ? 'Rechercher un patient...' : 'Search members...'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Members List */}
              <div className="p-4 max-h-80 overflow-y-auto space-y-1">
                {(() => {
                  const query = memberSearchQuery.toLowerCase()
                  let filtered = members.filter(m =>
                    `${m.first_name} ${m.last_name}`.toLowerCase().includes(query)
                  )
                  // For reengage: sort inactive/no recent sessions first
                  if (memberPickerAction === 'reengage') {
                    filtered.sort((a, b) => {
                      const aInactive = a.status === 'inactive' ? 0 : 1
                      const bInactive = b.status === 'inactive' ? 0 : 1
                      if (aInactive !== bInactive) return aInactive - bInactive
                      // Then by oldest last session
                      const aDate = a.last_session_at ? new Date(a.last_session_at).getTime() : 0
                      const bDate = b.last_session_at ? new Date(b.last_session_at).getTime() : 0
                      return aDate - bDate
                    })
                  }
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Aucun patient trouvé' : 'No members found'}
                        </p>
                      </div>
                    )
                  }
                  return filtered.map((member, index) => {
                    const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                    const statusColor = member.status === 'active' ? 'bg-emerald-400' : member.status === 'inactive' ? 'bg-gray-400' : 'bg-amber-400'
                    return (
                      <motion.button
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          setShowMemberPicker(false)
                          if (memberPickerAction === 'share') {
                            router.push(`/members/${member.id}?tab=shared`)
                          } else if (memberPickerAction === 'reengage' || memberPickerAction === 'session') {
                            setSchedulePreselectedMember(member as unknown as Member)
                            setShowScheduleModal(true)
                          } else if (memberPickerAction === 'summary') {
                            router.push(`/members/${member.id}?tab=overview`)
                          }
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {initials}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.status === 'active' ? (locale === 'fr' ? 'Actif' : 'Active') :
                             member.status === 'inactive' ? (locale === 'fr' ? 'Inactif' : 'Inactive') :
                             (locale === 'fr' ? 'En attente' : 'Pending')}
                            {member.last_session_at && ` · ${formatTimeAgo(member.last_session_at)}`}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                      </motion.button>
                    )
                  })
                })()}
              </div>
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
