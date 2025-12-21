'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Heart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Sparkles,
  Camera,
  Scale,
  MessageSquare,
  FileText,
  User,
  CalendarCheck,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { AnimatedIcon } from '@/components/ui/animated-icons'

interface AppSidebarProps {
  userType?: 'mentor' | 'member'
}

export function AppSidebar({ userType: propUserType }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const supabase = createClient()
  const [detectedUserType, setDetectedUserType] = useState<'mentor' | 'member'>('mentor')

  // Auto-detect user type from auth session
  useEffect(() => {
    async function detectUserType() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.user_type === 'member') {
        setDetectedUserType('member')
      }
    }
    detectUserType()
  }, [supabase.auth])

  // Use prop if provided, otherwise use detected type
  const userType = propUserType || detectedUserType

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  // Primary: Teal, Secondary: Lavender
  const primaryGradient = 'from-teal-400 to-teal-600'
  const primaryShadow = 'shadow-teal-200/50'
  const secondaryGradient = 'from-lavender-400 to-lavender-600'
  const secondaryShadow = 'shadow-lavender-200/50'

  // Mentor sections (default for all users)
  const mentorSections = [
    {
      title: t.dashboard.sections.library.title,
      icon: BookOpen,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/library',
    },
    {
      title: t.dashboard.sections.resources.title,
      icon: Heart,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/resources',
    },
    {
      title: t.dashboard.sections.members.title,
      icon: Users,
      gradient: secondaryGradient,
      shadow: secondaryShadow,
      href: '/members',
    },
    {
      title: t.dashboard.sections.analytics.title,
      icon: BarChart3,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/analytics',
    },
    {
      title: t.dashboard.sections.bookings?.title || 'Bookings',
      icon: CalendarCheck,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/bookings',
    },
    {
      title: t.profile.title,
      icon: User,
      gradient: secondaryGradient,
      shadow: secondaryShadow,
      href: '/profile',
    },
  ]

  // Member-specific sections
  const memberSections = [
    {
      title: 'My Resources',
      icon: Heart,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/home',
    },
    {
      title: t.dashboard.sections.rituals.title,
      icon: Sparkles,
      gradient: secondaryGradient,
      shadow: secondaryShadow,
      href: '/rituals',
    },
    {
      title: t.dashboard.sections.moments.title,
      icon: Camera,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/moments',
    },
    {
      title: t.dashboard.sections.balance.title,
      icon: Scale,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/balance',
    },
    {
      title: t.dashboard.sections.reflection.title,
      icon: MessageSquare,
      gradient: secondaryGradient,
      shadow: secondaryShadow,
      href: '/reflection',
    },
    {
      title: t.dashboard.sections.stories.title,
      icon: FileText,
      gradient: primaryGradient,
      shadow: primaryShadow,
      href: '/my-stories',
    },
  ]

  const displaySections = userType === 'member' ? memberSections : mentorSections

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed left-6 top-6 bottom-6 z-50 w-64 transition-all duration-300"
    >
      <div className="h-full bg-white/90 backdrop-blur-2xl rounded-[1.5rem] border border-white/60 shadow-xl shadow-gray-200/40 p-4 flex flex-col">
        {/* Logo */}
        <Link href="/dashboard">
          <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-lavender-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200/50 flex-shrink-0">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">Bloomsline</span>
          </div>
        </Link>

        {/* Navigation Pills */}
        <nav className="flex-1 space-y-1.5">
          <Link href="/dashboard">
            <motion.div
              whileHover={{ x: 2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
              ${isActive('/dashboard')
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
                className={`flex-shrink-0 ${isActive('/dashboard') ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
              />
              <span className={`text-sm font-medium ${isActive('/dashboard') ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {t.dashboard.sidebar.home}
              </span>
            </motion.div>
          </Link>

          {displaySections.map((section) => {
            const Icon = section.icon
            const active = isActive(section.href)
            return (
              <Link key={section.title} href={section.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                  ${active
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
                    className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                  />
                  <span className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {section.title}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-gray-100 space-y-1.5">
          <Link href="/settings">
            <motion.div
              whileHover={{ x: 2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
              ${isActive('/settings')
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
                className={`flex-shrink-0 ${isActive('/settings') ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
              />
              <span className={`text-sm font-medium ${isActive('/settings') ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
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
  )
}
