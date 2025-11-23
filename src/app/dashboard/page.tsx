'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('home')
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
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          user_type: 'mentor',
          preferred_language: 'en',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        })
      } else {
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
    }

    getUser()
  }, [router, searchParams, supabase, setLocale])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  // Mentor sections (default for all users)
  const sections = [
    {
      title: t.dashboard.sections.library.title,
      description: t.dashboard.sections.library.description,
      detail: t.dashboard.sections.library.detail,
      icon: BookOpen,
      gradient: 'from-mint-400 to-mint-600',
      bg: 'bg-mint-50',
      border: 'border-mint-200',
      stats: [
        { label: t.dashboard.sections.library.stats.resources, value: '150+' },
        { label: t.dashboard.sections.library.stats.categories, value: '12' },
      ],
      tags: [
        t.dashboard.sections.library.tags.expertCurated,
        t.dashboard.sections.library.tags.customizable,
        t.dashboard.sections.library.tags.evidenceBased,
      ],
      href: '/dashboard/library',
    },
    {
      title: t.dashboard.sections.resources.title,
      description: t.dashboard.sections.resources.description,
      detail: t.dashboard.sections.resources.detail,
      icon: Heart,
      gradient: 'from-coral-400 to-coral-600',
      bg: 'bg-coral-50',
      border: 'border-coral-200',
      stats: [
        { label: t.dashboard.sections.resources.stats.savedItems, value: '24' },
        { label: t.dashboard.sections.resources.stats.collections, value: '5' },
      ],
      tags: [
        t.dashboard.sections.resources.tags.personalSaved,
        t.dashboard.sections.resources.tags.collections,
        t.dashboard.sections.resources.tags.quickAccess,
      ],
      href: '/dashboard/resources',
    },
    {
      title: t.dashboard.sections.members.title,
      description: t.dashboard.sections.members.description,
      detail: t.dashboard.sections.members.detail,
      icon: Users,
      gradient: 'from-lavender-400 to-lavender-600',
      bg: 'bg-lavender-50',
      border: 'border-lavender-200',
      stats: [
        { label: t.dashboard.sections.members.stats.activeClients, value: '18' },
        { label: t.dashboard.sections.members.stats.sessions, value: '142' },
      ],
      tags: [
        t.dashboard.sections.members.tags.clientManagement,
        t.dashboard.sections.members.tags.sessionTracking,
        t.dashboard.sections.members.tags.progressNotes,
      ],
      href: '/dashboard/members',
    },
    {
      title: t.dashboard.sections.analytics.title,
      description: t.dashboard.sections.analytics.description,
      detail: t.dashboard.sections.analytics.detail,
      icon: BarChart3,
      gradient: 'from-peach-400 to-peach-600',
      bg: 'bg-peach-50',
      border: 'border-peach-200',
      stats: [
        { label: t.dashboard.sections.analytics.stats.successRate, value: '94%' },
        { label: t.dashboard.sections.analytics.stats.insights, value: '47' },
      ],
      tags: [
        t.dashboard.sections.analytics.tags.analytics,
        t.dashboard.sections.analytics.tags.clientInsights,
        t.dashboard.sections.analytics.tags.outcomes,
      ],
      href: '/dashboard/analytics',
    },
  ]

  // Member-specific sections (only for members)
  const memberSections = [
    {
      title: t.dashboard.sections.rituals.title,
      description: t.dashboard.sections.rituals.description,
      detail: t.dashboard.sections.rituals.detail,
      icon: Sparkles,
      gradient: 'from-purple-400 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      stats: [
        { label: t.dashboard.sections.rituals.stats.activeRituals, value: '5' },
        { label: t.dashboard.sections.rituals.stats.streak, value: '12' },
      ],
      tags: [
        t.dashboard.sections.rituals.tags.dailyPractice,
        t.dashboard.sections.rituals.tags.trackProgress,
        t.dashboard.sections.rituals.tags.buildHabits,
      ],
      href: '/dashboard/rituals',
    },
    {
      title: t.dashboard.sections.moments.title,
      description: t.dashboard.sections.moments.description,
      detail: t.dashboard.sections.moments.detail,
      icon: Camera,
      gradient: 'from-sky-400 to-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      stats: [
        { label: t.dashboard.sections.moments.stats.totalMoments, value: '48' },
        { label: t.dashboard.sections.moments.stats.thisWeek, value: '7' },
      ],
      tags: [
        t.dashboard.sections.moments.tags.journaling,
        t.dashboard.sections.moments.tags.reflection,
        t.dashboard.sections.moments.tags.insights,
      ],
      href: '/dashboard/moments',
    },
    {
      title: t.dashboard.sections.balance.title,
      description: t.dashboard.sections.balance.description,
      detail: t.dashboard.sections.balance.detail,
      icon: Scale,
      gradient: 'from-teal-400 to-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      stats: [
        { label: t.dashboard.sections.balance.stats.balanceScore, value: '78%' },
        { label: t.dashboard.sections.balance.stats.categories, value: '6' },
      ],
      tags: [
        t.dashboard.sections.balance.tags.wellness,
        t.dashboard.sections.balance.tags.tracking,
        t.dashboard.sections.balance.tags.holistic,
      ],
      href: '/dashboard/balance',
    },
    {
      title: t.dashboard.sections.reflection.title,
      description: t.dashboard.sections.reflection.description,
      detail: t.dashboard.sections.reflection.detail,
      icon: MessageSquare,
      gradient: 'from-rose-400 to-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      stats: [
        { label: t.dashboard.sections.reflection.stats.reflections, value: '32' },
        { label: t.dashboard.sections.reflection.stats.growth, value: '85%' },
      ],
      tags: [
        t.dashboard.sections.reflection.tags.selfAwareness,
        t.dashboard.sections.reflection.tags.progress,
        t.dashboard.sections.reflection.tags.celebration,
      ],
      href: '/dashboard/reflection',
    },
    {
      title: t.dashboard.sections.stories.title,
      description: t.dashboard.sections.stories.description,
      detail: t.dashboard.sections.stories.detail,
      icon: FileText,
      gradient: 'from-amber-400 to-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      stats: [
        { label: t.dashboard.sections.stories.stats.published, value: '14' },
        { label: t.dashboard.sections.stories.stats.views, value: '326' },
      ],
      tags: [
        t.dashboard.sections.stories.tags.richContent,
        t.dashboard.sections.stories.tags.shareableLink,
        t.dashboard.sections.stories.tags.multimedia,
      ],
      href: '/dashboard/stories',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/30 via-white to-mint-50/30 relative overflow-hidden flex">
      {/* Subtle background gradient orbs */}
      <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-mint-200/20 to-mint-300/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-lavender-200/20 to-lavender-300/20 rounded-full mix-blend-multiply filter blur-3xl"></div>

      {/* Floating Pill Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed left-6 top-6 bottom-6 z-50 w-64 transition-all duration-300"
      >
        <div className="h-full bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl shadow-black/5 p-4 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-mint-400 to-lavender-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Bloomsline</span>
          </div>

          {/* Navigation Pills */}
          <nav className="flex-1 space-y-2">
            <Link href="/dashboard" onClick={() => setActiveSection('home')}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group cursor-pointer
                ${activeSection === 'home'
                  ? 'bg-gradient-to-r from-mint-50 to-lavender-50 shadow-sm'
                  : 'hover:bg-gray-50/50'
                }`}>
                <Home className={`w-5 h-5 flex-shrink-0 ${activeSection === 'home' ? 'text-mint-600' : 'text-gray-600 group-hover:text-foreground'}`} />
                <span className={`text-sm font-medium ${activeSection === 'home' ? 'text-foreground' : 'text-gray-600 group-hover:text-foreground'}`}>
                  {t.dashboard.sidebar.home}
                </span>
              </div>
            </Link>

            {displaySections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.href
              return (
                <Link key={section.title} href={section.href} onClick={() => setActiveSection(section.href)}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group cursor-pointer
                    ${isActive
                      ? 'bg-gradient-to-r from-mint-50 to-lavender-50 shadow-sm'
                      : 'hover:bg-gray-50/50'
                    }`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-mint-600' : 'text-gray-600 group-hover:text-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-gray-600 group-hover:text-foreground'}`}>
                      {section.title}
                    </span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-gray-200/50 space-y-2">
            <Link href="/dashboard/settings" onClick={() => setActiveSection('/dashboard/settings')}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group cursor-pointer
                ${activeSection === '/dashboard/settings'
                  ? 'bg-gradient-to-r from-mint-50 to-lavender-50 shadow-sm'
                  : 'hover:bg-gray-50/50'
                }`}>
                <Settings className={`w-5 h-5 flex-shrink-0 ${activeSection === '/dashboard/settings' ? 'text-mint-600' : 'text-gray-600 group-hover:text-foreground'}`} />
                <span className={`text-sm font-medium ${activeSection === '/dashboard/settings' ? 'text-foreground' : 'text-gray-600 group-hover:text-foreground'}`}>
                  {t.dashboard.sections.settings.title}
                </span>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50/50 transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-gray-600 group-hover:text-red-500" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-red-500">
                {t.dashboard.sidebar.signOut}
              </span>
            </button>
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
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {getGreeting()},
              <span className="italic text-mint-600"> {user?.full_name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="text-gray-600">{t.dashboard.tagline}</p>
          </div>

          {/* User Profile & Language Switcher */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl rounded-2xl px-4 py-3 border border-gray-200/50 shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-mint-400 to-lavender-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.full_name?.[0] || 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.user_type || 'Member'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t.dashboard.stats.activeClients.label, value: '18', change: `+3 ${t.dashboard.stats.activeClients.change}`, icon: Users, color: 'mint' },
            { label: t.dashboard.stats.sessionsThisWeek.label, value: '12', change: `4 ${t.dashboard.stats.sessionsThisWeek.change}`, icon: BarChart3, color: 'lavender' },
            { label: t.dashboard.stats.resourcesSaved.label, value: '24', change: `+5 ${t.dashboard.stats.resourcesSaved.change}`, icon: Heart, color: 'coral' },
            { label: t.dashboard.stats.completionRate.label, value: '94%', change: `+2% ${t.dashboard.stats.completionRate.change}`, icon: BookOpen, color: 'peach' },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 hover:bg-white/80 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-700 mb-1">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50">
              <h2 className="text-xl font-bold text-foreground mb-6">{t.dashboard.quickActions.title}</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t.dashboard.quickActions.newSessionNote, icon: '📝', href: '/dashboard/members' },
                  { label: t.dashboard.quickActions.scheduleAppointment, icon: '📅', href: '/dashboard/members' },
                  { label: t.dashboard.quickActions.browseResources, icon: '📚', href: '/dashboard/library' },
                  { label: t.dashboard.quickActions.viewAnalytics, icon: '📊', href: '/dashboard/analytics' },
                ].map((action) => (
                  <Link key={action.label} href={action.href}>
                    <button className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left group">
                      <div className="text-3xl mb-3">{action.icon}</div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-foreground">{action.label}</p>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50">
              <h2 className="text-xl font-bold text-foreground mb-6">{t.dashboard.schedule.title}</h2>
              <div className="space-y-4">
                {[
                  { time: '10:00 AM', client: 'Sarah M.', type: t.dashboard.schedule.session },
                  { time: '2:00 PM', client: 'John D.', type: t.dashboard.schedule.checkIn },
                  { time: '4:30 PM', client: 'Emma L.', type: t.dashboard.schedule.session },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="w-16 text-sm font-medium text-gray-600">{item.time}</div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.client}</p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity & Your Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50">
              <h2 className="text-xl font-bold text-foreground mb-6">{t.dashboard.activity.title}</h2>
              <div className="space-y-4">
                {[
                  { action: `${t.dashboard.activity.completedSession} Sarah M.`, time: `2 ${t.dashboard.activity.hoursAgo}`, icon: '✓' },
                  { action: `${t.dashboard.activity.addedToLibrary} "Mindfulness Exercises" ${t.dashboard.activity.toLibrary}`, time: `5 ${t.dashboard.activity.hoursAgo}`, icon: '📚' },
                  { action: `${t.dashboard.activity.updatedNotes} John D.`, time: t.dashboard.activity.yesterday, icon: '📝' },
                  { action: t.dashboard.activity.reviewedAnalytics, time: `2 ${t.dashboard.activity.daysAgo}`, icon: '📊' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Your Practice Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50">
              <h2 className="text-xl font-bold text-foreground mb-6">{t.dashboard.practice.title}</h2>
              <div className="space-y-3">
                {displaySections.map((section) => {
                  const Icon = section.icon
                  return (
                    <Link key={section.title} href={section.href}>
                      <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/80 transition-all group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{section.title}</p>
                            <p className="text-xs text-gray-500">{section.stats[0].value} {section.stats[0].label}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
