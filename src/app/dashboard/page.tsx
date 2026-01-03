'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@/types/user'
import { motion } from 'framer-motion'
import {
  Home,
  FileText,
  TrendingUp,
  Plus,
  FolderOpen,
  Table2,
  ChevronRight,
  Users,
  CalendarCheck,
  BookOpen,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'

interface RecentResource {
  id: string
  title: string
  type: string
  created_at: string
}

interface TemplateOption {
  id: string
  type: 'worksheet' | 'table' | 'psychoeducation'
  name: { en: string; fr: string }
  description: { en: string; fr: string }
  href: string
}


function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [recentResources, setRecentResources] = useState<RecentResource[]>([])

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

  useEffect(() => {
    const fetchRecentData = async (userId: string) => {
      const { data: resources } = await supabase
        .from('resources')
        .select('id, title, type, created_at')
        .eq('practitioner_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (resources && resources.length > 0) {
        setRecentResources(resources)
      }
    }

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

      await fetchRecentData(authUser.id)
    }

    getUser()
  }, [router, searchParams, supabase, setLocale])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return locale === 'fr' ? 'Bonjour' : 'Good morning'
    if (hour < 18) return locale === 'fr' ? 'Bon après-midi' : 'Good afternoon'
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
      case 'worksheet': return locale === 'fr' ? 'Exercice' : 'Worksheet'
      case 'table': return locale === 'fr' ? 'Tableau' : 'Table'
      case 'psychoeducation': return locale === 'fr' ? 'Psychoéducation' : 'Psychoeducation'
      default: return ''
    }
  }

  const quickActions = [
    {
      id: 'worksheet',
      title: locale === 'fr' ? 'Exercice' : 'Worksheet',
      icon: FileText,
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-50',
      href: '/resources/create?type=worksheet',
    },
    {
      id: 'table',
      title: locale === 'fr' ? 'Tableau' : 'Table',
      icon: Table2,
      color: 'from-emerald-400 to-emerald-500',
      bgColor: 'bg-emerald-50',
      href: '/resources/create?type=table',
    },
    {
      id: 'education',
      title: locale === 'fr' ? 'Psychoéducation' : 'Psychoeducation',
      icon: BookOpen,
      color: 'from-purple-400 to-purple-500',
      bgColor: 'bg-purple-50',
      href: '/resources/create?type=psychoeducation',
    },
    {
      id: 'members',
      title: locale === 'fr' ? 'Patients' : 'Members',
      icon: Users,
      color: 'from-pink-400 to-pink-500',
      bgColor: 'bg-pink-50',
      href: '/members',
    },
    {
      id: 'bookings',
      title: locale === 'fr' ? 'Séances' : 'Sessions',
      icon: CalendarCheck,
      color: 'from-amber-400 to-amber-500',
      bgColor: 'bg-amber-50',
      href: '/bookings',
    },
    {
      id: 'analytics',
      title: locale === 'fr' ? 'Statistiques' : 'Analytics',
      icon: BarChart3,
      color: 'from-teal-400 to-teal-500',
      bgColor: 'bg-teal-50',
      href: '/analytics',
    },
  ]

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
            className="mb-8"
          >
            <p className="text-sm text-gray-500 mb-1">
              {locale === 'fr' ? 'Mon espace de travail' : 'My Workspace'}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}
            </h1>
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
                <Link key={action.id} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    className="flex flex-col items-center cursor-pointer group"
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

                      {action.id === 'members' && (
                        <div className="relative flex items-center justify-center w-full h-full">
                          {/* Profile cards - stacked horizontally */}
                          <div className="flex items-center -space-x-2">
                            <motion.div
                              className="w-9 h-11 bg-white rounded-lg shadow-md flex flex-col items-center justify-center z-10"
                              animate={{ x: [0, 1, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <div className="w-4 h-4 bg-pink-200 rounded-full mb-1" />
                              <div className="w-5 h-1 bg-pink-100 rounded" />
                            </motion.div>
                            <motion.div
                              className="w-9 h-11 bg-white rounded-lg shadow-md flex flex-col items-center justify-center z-20"
                              animate={{ x: [0, -1, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                            >
                              <div className="w-4 h-4 bg-pink-300 rounded-full mb-1" />
                              <div className="w-5 h-1 bg-pink-200 rounded" />
                            </motion.div>
                            <motion.div
                              className="w-9 h-11 bg-white rounded-lg shadow-md flex flex-col items-center justify-center z-30 relative"
                              animate={{ x: [0, 1, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            >
                              <div className="w-4 h-4 bg-pink-400 rounded-full mb-1" />
                              <div className="w-5 h-1 bg-pink-300 rounded" />
                              {/* Plus badge - bottom right */}
                              <motion.div
                                className="absolute -right-1.5 -bottom-1.5 w-5 h-5 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg z-40"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Plus className="w-2.5 h-2.5 text-white" />
                              </motion.div>
                            </motion.div>
                          </div>
                        </div>
                      )}

                      {action.id === 'bookings' && (
                        <div className="relative">
                          {/* Calendar */}
                          <motion.div
                            className="w-16 h-16 bg-white rounded-lg shadow-md overflow-hidden"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="h-4 bg-amber-400 flex items-center justify-center">
                              <div className="w-8 h-1 bg-white/50 rounded" />
                            </div>
                            <div className="p-1.5 grid grid-cols-4 gap-0.5">
                              {[...Array(12)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className={`w-2.5 h-2.5 rounded-sm ${i === 5 ? 'bg-amber-400' : 'bg-gray-100'}`}
                                  animate={i === 5 ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              ))}
                            </div>
                          </motion.div>
                          {/* Clock */}
                          <motion.div
                            className="absolute -right-2 -bottom-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ rotate: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <CalendarCheck className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </div>
                      )}

                      {action.id === 'analytics' && (
                        <div className="relative">
                          {/* Chart */}
                          <motion.div
                            className="flex items-end gap-1.5 h-16"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {[40, 65, 45, 80, 55].map((height, i) => (
                              <motion.div
                                key={i}
                                className="w-3 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t"
                                style={{ height: `${height}%` }}
                                animate={{ scaleY: [0.9, 1, 0.9] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </motion.div>
                          {/* Trend line */}
                          <motion.div
                            className="absolute -right-1 top-1 w-6 h-6 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <TrendingUp className="w-3 h-3 text-white" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">{action.title}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Latest Resources */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {locale === 'fr' ? 'Dernières ressources' : 'Latest resources'}
                </h2>
                <Link href="/resources" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  {locale === 'fr' ? 'Voir tout' : 'View all'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-2">
                {recentResources.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
                    <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      {locale === 'fr' ? 'Aucune ressource créée' : 'No resources yet'}
                    </p>
                  </div>
                ) : (
                  recentResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                    >
                      <Link href={`/resources/${resource.id}`}>
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-teal-600">
                              {resource.title}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                        </div>
                      </Link>
                    </motion.div>
                  ))
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

              <div className="space-y-2">
                {featuredTemplates.map((template, index) => {
                  const TemplateIcon = getTemplateIcon(template.type)
                  const colorClass = getTemplateColor(template.type)
                  return (
                    <Link key={template.id} href={template.href}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer group"
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
