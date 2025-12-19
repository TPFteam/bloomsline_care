'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@/types/user'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Heart,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  LogOut,
  Home,
  Sparkles,
  Camera,
  Scale,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  Plus,
  User as UserIcon,
  CalendarCheck,
} from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icons'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'

interface TodayBooking {
  id: string
  client_name: string
  session_type: string
  start_time: string
  status: string
}

interface SessionType {
  id: string
  name: string
}

interface DashboardStats {
  activeMembers: number
  sessionsThisWeek: number
  resourcesSaved: number
  completionRate: number
  totalSessions: number
  collectionsCount: number
}

interface RecentActivity {
  id: string
  type: 'session_completed' | 'resource_saved' | 'member_added' | 'booking_created'
  description: string
  time: string
  relatedName?: string
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('home')
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([])
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    activeMembers: 0,
    sessionsThisWeek: 0,
    resourcesSaved: 0,
    completionRate: 0,
    totalSessions: 0,
    collectionsCount: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { t, setLocale } = useLanguage()

  useEffect(() => {
    const getUser = async () => {
      // Check auth status first
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/sign-in')
        return
      }

      // Fetch user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        // If profile doesn't exist, redirect to onboarding
        if (profileError.code === 'PGRST116') {
          router.push('/onboarding')
          return
        }
        // Use auth user data as fallback
        const userType = authUser.user_metadata?.user_type || 'mentor'

        // Redirect members to their mobile home page
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
        // Redirect members to their mobile home page
        if (userProfile.user_type === 'member') {
          router.replace('/home')
          return
        }

        setUser(userProfile)
        // Load user's preferred language from database
        if (userProfile.preferred_language) {
          setLocale(userProfile.preferred_language, false) // Don't sync back to DB
        }
      }

      setLoading(false)

      // Show welcome message for new users
      if (searchParams.get('welcome') === 'true') {
        toast.success(`Welcome to Bloomsline, ${authUser.user_metadata?.full_name || 'there'}!`)
      }

      // Fetch today's bookings
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, client_name, session_type, start_time, status')
        .eq('practitioner_id', authUser.id)
        .gte('start_time', startOfDay)
        .lt('start_time', endOfDay)
        .in('status', ['confirmed', 'pending'])
        .order('start_time', { ascending: true })

      if (bookings) {
        setTodayBookings(bookings)
      }

      // Fetch session types
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', authUser.id)
        .single()

      if (settings?.session_types) {
        setSessionTypes(settings.session_types as SessionType[])
      }

      // Fetch dashboard stats
      await fetchDashboardStats(authUser.id)

      // Fetch recent activity
      await fetchRecentActivity(authUser.id)
    }

    const fetchDashboardStats = async (userId: string) => {
      // Fetch active members count
      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('practitioner_id', userId)
        .eq('status', 'active')

      // Fetch sessions this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 7)

      const { count: sessionsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('practitioner_id', userId)
        .gte('start_time', startOfWeek.toISOString())
        .lt('start_time', endOfWeek.toISOString())
        .in('status', ['confirmed', 'completed'])

      // Fetch saved resources count
      const { count: resourcesCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Calculate completion rate (completed sessions / total past sessions)
      const { count: completedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('practitioner_id', userId)
        .eq('status', 'completed')

      const { count: totalPastCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('practitioner_id', userId)
        .lt('start_time', new Date().toISOString())
        .in('status', ['completed', 'cancelled', 'no_show'])

      const completionRate = totalPastCount && totalPastCount > 0
        ? Math.round((completedCount || 0) / totalPastCount * 100)
        : 0

      // Get total sessions (all time)
      const { count: totalSessionsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('practitioner_id', userId)
        .in('status', ['confirmed', 'completed'])

      // Get collections count
      const { count: collectionsCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      setStats({
        activeMembers: membersCount || 0,
        sessionsThisWeek: sessionsCount || 0,
        resourcesSaved: resourcesCount || 0,
        completionRate: completionRate,
        totalSessions: totalSessionsCount || 0,
        collectionsCount: collectionsCount || 0,
      })
    }

    const fetchRecentActivity = async (userId: string) => {
      const activities: RecentActivity[] = []

      // Get recent completed sessions
      const { data: recentSessions } = await supabase
        .from('bookings')
        .select('id, client_name, updated_at')
        .eq('practitioner_id', userId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(2)

      if (recentSessions) {
        recentSessions.forEach(session => {
          activities.push({
            id: session.id,
            type: 'session_completed',
            description: `Completed session with ${session.client_name}`,
            time: session.updated_at,
            relatedName: session.client_name,
          })
        })
      }

      // Get recent resources
      const { data: recentResources } = await supabase
        .from('resources')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2)

      if (recentResources) {
        recentResources.forEach(resource => {
          activities.push({
            id: resource.id,
            type: 'resource_saved',
            description: `Saved "${resource.title}" to resources`,
            time: resource.created_at,
            relatedName: resource.title,
          })
        })
      }

      // Get recent members added
      const { data: recentMembers } = await supabase
        .from('members')
        .select('id, first_name, last_name, created_at')
        .eq('practitioner_id', userId)
        .order('created_at', { ascending: false })
        .limit(2)

      if (recentMembers) {
        recentMembers.forEach(member => {
          activities.push({
            id: member.id,
            type: 'member_added',
            description: `Added ${member.first_name} ${member.last_name} as a member`,
            time: member.created_at,
            relatedName: `${member.first_name} ${member.last_name}`,
          })
        })
      }

      // Sort by time and take top 4
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(activities.slice(0, 4))
    }

    getUser()
  }, [router, searchParams, supabase, setLocale])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  // Mentor sections (default for all users) - now with real data
  // Using teal (primary) and lavender (secondary) color scheme
  const sections = [
    {
      title: t.dashboard.sections.library.title,
      description: t.dashboard.sections.library.description,
      detail: t.dashboard.sections.library.detail,
      icon: BookOpen,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: t.dashboard.sections.library.stats.resources, value: '150+' },
        { label: t.dashboard.sections.library.stats.categories, value: '12' },
      ],
      tags: [
        t.dashboard.sections.library.tags.expertCurated,
        t.dashboard.sections.library.tags.customizable,
        t.dashboard.sections.library.tags.evidenceBased,
      ],
      href: '/library',
    },
    {
      title: t.dashboard.sections.resources.title,
      description: t.dashboard.sections.resources.description,
      detail: t.dashboard.sections.resources.detail,
      icon: Heart,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: t.dashboard.sections.resources.stats.savedItems, value: stats.resourcesSaved.toString() },
        { label: t.dashboard.sections.resources.stats.collections, value: stats.collectionsCount.toString() },
      ],
      tags: [
        t.dashboard.sections.resources.tags.personalSaved,
        t.dashboard.sections.resources.tags.collections,
        t.dashboard.sections.resources.tags.quickAccess,
      ],
      href: '/resources',
    },
    {
      title: t.dashboard.sections.members.title,
      description: t.dashboard.sections.members.description,
      detail: t.dashboard.sections.members.detail,
      icon: Users,
      gradient: 'from-lavender-400 to-lavender-600',
      bg: 'bg-lavender-100/80',
      shadow: 'shadow-lavender-200/50',
      stats: [
        { label: t.dashboard.sections.members.stats.activeClients, value: stats.activeMembers.toString() },
        { label: t.dashboard.sections.members.stats.sessions, value: stats.totalSessions.toString() },
      ],
      tags: [
        t.dashboard.sections.members.tags.clientManagement,
        t.dashboard.sections.members.tags.sessionTracking,
        t.dashboard.sections.members.tags.progressNotes,
      ],
      href: '/members',
    },
    {
      title: t.dashboard.sections.analytics.title,
      description: t.dashboard.sections.analytics.description,
      detail: t.dashboard.sections.analytics.detail,
      icon: BarChart3,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: t.dashboard.sections.analytics.stats.successRate, value: stats.completionRate > 0 ? `${stats.completionRate}%` : '-' },
        { label: t.dashboard.sections.analytics.stats.insights, value: stats.totalSessions.toString() },
      ],
      tags: [
        t.dashboard.sections.analytics.tags.analytics,
        t.dashboard.sections.analytics.tags.clientInsights,
        t.dashboard.sections.analytics.tags.outcomes,
      ],
      href: '/analytics',
    },
  ]

  // Member-specific sections (only for members)
  // Using teal (primary) and lavender (secondary) color scheme
  const memberSections = [
    {
      title: 'My Resources',
      description: 'Assigned resources',
      detail: 'View and complete worksheets and exercises assigned by your practitioner.',
      icon: Heart,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: 'Pending', value: '0' },
        { label: 'Completed', value: '0' },
      ],
      tags: ['Worksheets', 'Exercises', 'Assignments'],
      href: '/home',
    },
    {
      title: t.dashboard.sections.rituals.title,
      description: t.dashboard.sections.rituals.description,
      detail: t.dashboard.sections.rituals.detail,
      icon: Sparkles,
      gradient: 'from-lavender-400 to-lavender-600',
      bg: 'bg-lavender-100/80',
      shadow: 'shadow-lavender-200/50',
      stats: [
        { label: t.dashboard.sections.rituals.stats.activeRituals, value: '5' },
        { label: t.dashboard.sections.rituals.stats.streak, value: '12' },
      ],
      tags: [
        t.dashboard.sections.rituals.tags.dailyPractice,
        t.dashboard.sections.rituals.tags.trackProgress,
        t.dashboard.sections.rituals.tags.buildHabits,
      ],
      href: '/rituals',
    },
    {
      title: t.dashboard.sections.moments.title,
      description: t.dashboard.sections.moments.description,
      detail: t.dashboard.sections.moments.detail,
      icon: Camera,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: t.dashboard.sections.moments.stats.totalMoments, value: '48' },
        { label: t.dashboard.sections.moments.stats.thisWeek, value: '7' },
      ],
      tags: [
        t.dashboard.sections.moments.tags.journaling,
        t.dashboard.sections.moments.tags.reflection,
        t.dashboard.sections.moments.tags.insights,
      ],
      href: '/moments',
    },
    {
      title: t.dashboard.sections.balance.title,
      description: t.dashboard.sections.balance.description,
      detail: t.dashboard.sections.balance.detail,
      icon: Scale,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: t.dashboard.sections.balance.stats.balanceScore, value: '78%' },
        { label: t.dashboard.sections.balance.stats.categories, value: '6' },
      ],
      tags: [
        t.dashboard.sections.balance.tags.wellness,
        t.dashboard.sections.balance.tags.tracking,
        t.dashboard.sections.balance.tags.holistic,
      ],
      href: '/balance',
    },
    {
      title: t.dashboard.sections.reflection.title,
      description: t.dashboard.sections.reflection.description,
      detail: t.dashboard.sections.reflection.detail,
      icon: MessageSquare,
      gradient: 'from-lavender-400 to-lavender-600',
      bg: 'bg-lavender-100/80',
      shadow: 'shadow-lavender-200/50',
      stats: [
        { label: t.dashboard.sections.reflection.stats.reflections, value: '32' },
        { label: t.dashboard.sections.reflection.stats.growth, value: '85%' },
      ],
      tags: [
        t.dashboard.sections.reflection.tags.selfAwareness,
        t.dashboard.sections.reflection.tags.progress,
        t.dashboard.sections.reflection.tags.celebration,
      ],
      href: '/reflection',
    },
    {
      title: t.dashboard.sections.stories.title,
      description: t.dashboard.sections.stories.description,
      detail: t.dashboard.sections.stories.detail,
      icon: FileText,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-100/80',
      shadow: 'shadow-teal-200/50',
      stats: [
        { label: t.dashboard.sections.stories.stats.published, value: '14' },
        { label: t.dashboard.sections.stories.stats.views, value: '326' },
      ],
      tags: [
        t.dashboard.sections.stories.tags.richContent,
        t.dashboard.sections.stories.tags.shareableLink,
        t.dashboard.sections.stories.tags.multimedia,
      ],
      href: '/my-stories',
    },
  ]

  // Combine sections based on user type
  const displaySections = user?.user_type === 'member' ? memberSections : sections

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.dashboard.greeting.morning
    if (hour < 18) return t.dashboard.greeting.afternoon
    return t.dashboard.greeting.evening
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden flex">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-lavender-200/20 rounded-full blur-3xl" />
      </div>

      {/* Floating Pill Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed left-6 top-6 bottom-6 z-50 w-64 transition-all duration-300"
      >
        <div className="h-full bg-white/90 backdrop-blur-2xl rounded-[1.5rem] border border-white/60 shadow-xl shadow-gray-200/40 p-4 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-lavender-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200/50 flex-shrink-0">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">Bloomsline</span>
          </div>

          {/* Navigation Pills */}
          <nav className="flex-1 space-y-1.5">
            <Link href="/dashboard" onClick={() => setActiveSection('home')}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                ${activeSection === 'home'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-md shadow-teal-200/50'
                  : 'hover:bg-gray-50/80'
                }`}
              >
                <AnimatedIcon
                  icon={Home}
                  animation="bounce"
                  size={20}
                  animateOnHover
                  animateOnRender={false}
                  className={`flex-shrink-0 ${activeSection === 'home' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                />
                <span className={`text-sm font-medium ${activeSection === 'home' ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {t.dashboard.sidebar.home}
                </span>
              </motion.div>
            </Link>

            {displaySections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.href
              return (
                <Link key={section.title} href={section.href} onClick={() => setActiveSection(section.href)}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                    ${isActive
                      ? `bg-gradient-to-r ${section.gradient} shadow-md ${section.shadow}`
                      : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <AnimatedIcon
                      icon={Icon}
                      animation="scale"
                      size={20}
                      animateOnHover
                      animateOnRender={false}
                      className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                    />
                    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                      {section.title}
                    </span>
                  </motion.div>
                </Link>
              )
            })}

            {/* Bookings */}
            <Link href="/bookings" onClick={() => setActiveSection('/bookings')}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                ${activeSection === '/bookings'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-md shadow-teal-200/50'
                  : 'hover:bg-gray-50/80'
                }`}
              >
                <AnimatedIcon
                  icon={CalendarCheck}
                  animation="scale"
                  size={20}
                  animateOnHover
                  animateOnRender={false}
                  className={`flex-shrink-0 ${activeSection === '/bookings' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                />
                <span className={`text-sm font-medium ${activeSection === '/bookings' ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  Bookings
                </span>
              </motion.div>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-gray-100 space-y-1.5">
            <Link href="/profile" onClick={() => setActiveSection('/profile')}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                ${activeSection === '/profile'
                  ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 shadow-md shadow-lavender-200/50'
                  : 'hover:bg-gray-50/80'
                }`}
              >
                <AnimatedIcon
                  icon={UserIcon}
                  animation="scale"
                  size={20}
                  animateOnHover
                  animateOnRender={false}
                  className={`flex-shrink-0 ${activeSection === '/profile' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                />
                <span className={`text-sm font-medium ${activeSection === '/profile' ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {t.profile.title}
                </span>
              </motion.div>
            </Link>

            <Link href="/settings" onClick={() => setActiveSection('/settings')}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                ${activeSection === '/settings'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-md'
                  : 'hover:bg-gray-50/80'
                }`}
              >
                <AnimatedIcon
                  icon={Settings}
                  animation="spin"
                  size={20}
                  animateOnHover
                  animateOnRender={false}
                  className={`flex-shrink-0 ${activeSection === '/settings' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                />
                <span className={`text-sm font-medium ${activeSection === '/settings' ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {t.dashboard.sections.settings.title}
                </span>
              </motion.div>
            </Link>

            <motion.button
              whileHover={{ x: 2 }}
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50/80 transition-all duration-300 group"
            >
              <AnimatedIcon
                icon={LogOut}
                animation="arrow-right"
                size={20}
                animateOnHover
                animateOnRender={false}
                className="flex-shrink-0 text-gray-500 group-hover:text-red-500"
              />
              <span className="text-sm font-medium text-gray-600 group-hover:text-red-500">
                {t.dashboard.sidebar.signOut}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-80 transition-all duration-300 p-8 relative z-10">
        {/* Top Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {getGreeting()},
              <span className="bg-gradient-to-r from-teal-500 to-lavender-500 bg-clip-text text-transparent"> {user?.full_name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="text-gray-500">{t.dashboard.tagline}</p>
          </div>

          {/* User Profile & Language Switcher */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg shadow-gray-200/40"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-lavender-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                {user?.full_name?.[0] || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.user_type || 'Member'}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.dashboard.stats.activeClients.label, value: stats.activeMembers.toString(), icon: Users, color: 'lavender' },
            { label: t.dashboard.stats.sessionsThisWeek.label, value: stats.sessionsThisWeek.toString(), icon: Calendar, color: 'emerald' },
            { label: t.dashboard.stats.resourcesSaved.label, value: stats.resourcesSaved.toString(), icon: Heart, color: 'coral' },
            { label: t.dashboard.stats.completionRate.label, value: stats.completionRate > 0 ? `${stats.completionRate}%` : '-', icon: TrendingUp, color: 'peach' },
          ].map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              lavender: { bg: 'bg-lavender-100/80', iconBg: 'from-lavender-400 to-lavender-600', shadow: 'shadow-lavender-200/50' },
              emerald: { bg: 'bg-emerald-100/80', iconBg: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200/50' },
              coral: { bg: 'bg-coral-100/80', iconBg: 'from-coral-400 to-coral-600', shadow: 'shadow-coral-200/50' },
              peach: { bg: 'bg-peach-100/80', iconBg: 'from-peach-400 to-peach-600', shadow: 'shadow-peach-200/50' },
            }[stat.color]!

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 shadow-lg shadow-gray-200/40 border border-white/60 cursor-default group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl ${colorClasses.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorClasses.iconBg} flex items-center justify-center shadow-md ${colorClasses.shadow}`}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t.dashboard.quickActions.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* New Session Note */}
              <Link href="/members">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gray-50/80 border border-gray-100 rounded-xl p-5 hover:border-lavender-200 hover:bg-white/80 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-lavender-100/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-md">
                      <AnimatedIcon icon={FileText} animation="scale" size={18} animateOnHover animateOnRender={false} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t.dashboard.quickActions.newSessionNote}</p>
                </motion.div>
              </Link>

              {/* Schedule Appointment - Opens Modal */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowScheduleModal(true)}
                className="bg-gray-50/80 border border-gray-100 rounded-xl p-5 hover:border-emerald-200 hover:bg-white/80 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                    <AnimatedIcon icon={Calendar} animation="scale" size={18} animateOnHover animateOnRender={false} className="text-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t.dashboard.quickActions.scheduleAppointment}</p>
              </motion.div>

              {/* Add New Member */}
              <Link href="/members/new">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gray-50/80 border border-gray-100 rounded-xl p-5 hover:border-mint-200 hover:bg-white/80 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-mint-100/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center shadow-md">
                      <AnimatedIcon icon={Plus} animation="scale" size={18} animateOnHover animateOnRender={false} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t.dashboard.quickActions.addNewMember || 'Add New Member'}</p>
                </motion.div>
              </Link>

              {/* View Analytics */}
              <Link href="/analytics">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gray-50/80 border border-gray-100 rounded-xl p-5 hover:border-peach-200 hover:bg-white/80 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-peach-100/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-peach-400 to-peach-600 flex items-center justify-center shadow-md">
                      <AnimatedIcon icon={BarChart3} animation="scale" size={18} animateOnHover animateOnRender={false} className="text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t.dashboard.quickActions.viewAnalytics}</p>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                    <AnimatedIcon icon={Clock} animation="pulse" size={14} animateOnHover animateOnRender={false} className="text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.schedule.title}</h2>
              </div>
              <Link href="/bookings">
                <span className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">View all</span>
              </Link>
            </div>
            <div className="space-y-3">
              {todayBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <AnimatedIcon icon={Calendar} animation="scale" size={32} animateOnHover animateOnRender={false} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No appointments today</p>
                </div>
              ) : (
                todayBookings.map((booking, index) => {
                  const colors = ['lavender', 'emerald', 'coral', 'peach', 'mint'] as const
                  const color = colors[index % colors.length]
                  const colorClasses = {
                    lavender: 'bg-lavender-100 text-lavender-700',
                    emerald: 'bg-emerald-100 text-emerald-700',
                    coral: 'bg-coral-100 text-coral-700',
                    peach: 'bg-peach-100 text-peach-700',
                    mint: 'bg-mint-100 text-mint-700',
                  }[color]

                  // Format time from ISO string
                  const time = new Date(booking.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })

                  // Get session type name
                  const sessionType = sessionTypes.find(st => st.id === booking.session_type)
                  const typeName = sessionType?.name || booking.session_type

                  return (
                    <Link key={booking.id} href="/bookings">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="w-16 text-sm font-semibold text-gray-500">{time}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{booking.client_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses}`}>{typeName}</span>
                        </div>
                        <AnimatedIcon icon={ArrowRight} animation="arrow-right" size={16} animateOnHover animateOnRender={false} className="text-gray-300 group-hover:text-gray-500" />
                      </motion.div>
                    </Link>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                  <AnimatedIcon icon={Sparkles} animation="sparkle" size={14} animateOnHover animateOnRender={false} className="text-white" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.activity.title}</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <AnimatedIcon icon={Sparkles} animation="sparkle" size={32} animateOnHover animateOnRender={false} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => {
                  const activityConfig = {
                    session_completed: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
                    resource_saved: { icon: Plus, color: 'bg-mint-100 text-mint-600' },
                    member_added: { icon: Users, color: 'bg-lavender-100 text-lavender-600' },
                    booking_created: { icon: Calendar, color: 'bg-peach-100 text-peach-600' },
                  }[activity.type]

                  const Icon = activityConfig.icon

                  // Format relative time
                  const formatRelativeTime = (dateStr: string) => {
                    const date = new Date(dateStr)
                    const now = new Date()
                    const diffMs = now.getTime() - date.getTime()
                    const diffMins = Math.floor(diffMs / 60000)
                    const diffHours = Math.floor(diffMins / 60)
                    const diffDays = Math.floor(diffHours / 24)

                    if (diffMins < 1) return 'Just now'
                    if (diffMins < 60) return `${diffMins} min ago`
                    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
                    if (diffDays === 1) return 'Yesterday'
                    if (diffDays < 7) return `${diffDays} days ago`
                    return date.toLocaleDateString()
                  }

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + index * 0.05 }}
                      className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50/80 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg ${activityConfig.color} flex items-center justify-center flex-shrink-0`}>
                        <AnimatedIcon icon={Icon} animation="scale" size={16} animateOnHover animateOnRender={false} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-relaxed">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(activity.time)}</p>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Your Practice Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-lavender-400 to-lavender-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t.dashboard.practice.title}</h2>
            </div>
            <div className="space-y-2">
              {displaySections.map((section, index) => {
                const Icon = section.icon
                return (
                  <Link key={section.title} href={section.href}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/80 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-md ${section.shadow}`}>
                            <AnimatedIcon icon={Icon} animation="scale" size={14} animateOnHover animateOnRender={false} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{section.title}</p>
                          <p className="text-xs text-gray-500">{section.stats[0].value} {section.stats[0].label}</p>
                        </div>
                      </div>
                      <AnimatedIcon icon={ArrowRight} animation="arrow-right" size={16} animateOnHover animateOnRender={false} className="text-gray-300 group-hover:text-gray-500" />
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSuccess={() => {
          // Refresh today's bookings after scheduling
          const fetchBookings = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            const today = new Date()
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

            const { data: bookings } = await supabase
              .from('bookings')
              .select('id, client_name, session_type, start_time, status')
              .eq('practitioner_id', authUser.id)
              .gte('start_time', startOfDay)
              .lt('start_time', endOfDay)
              .in('status', ['confirmed', 'pending'])
              .order('start_time', { ascending: true })

            if (bookings) {
              setTodayBookings(bookings)
            }
          }
          fetchBookings()
        }}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
