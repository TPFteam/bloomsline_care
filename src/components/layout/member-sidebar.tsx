'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, BookOpen, LogOut } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { AnimatedIcon } from '@/components/ui/animated-icons'
import { Logo } from '@/components/ui/logo'

export function MemberSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, locale } = useLanguage()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success(locale === 'fr' ? 'Déconnexion réussie' : 'Signed out successfully')
    router.push('/')
  }

  const navItems = [
    { title: t.dashboard.sidebar.home, icon: Home, href: '/member' },
    { title: t.dashboard.sections.library.title, icon: BookOpen, href: '/member/stories' },
  ]

  const isActive = (href: string) => {
    if (href === '/member') return pathname === '/member'
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
        <div className="flex items-center justify-between mb-8 px-2">
          <Link href="/member">
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <Logo size="lg" showText />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer
                  ${active
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 shadow-md shadow-teal-200/50'
                    : 'hover:bg-gray-50/80'
                  }`}
                >
                  <AnimatedIcon
                    icon={item.icon}
                    animation="bounce"
                    size={20}
                    animateOnHover
                    animateOnRender={false}
                    className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                  />
                  <span className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {item.title}
                  </span>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="pt-4 border-t border-gray-100">
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
