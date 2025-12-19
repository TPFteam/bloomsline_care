'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  Heart,
  Sparkles,
  Camera,
  BookOpen,
  Scale,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface MemberLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    href: '/home',
    icon: Home,
    labelEn: 'Home',
    labelFr: 'Accueil',
  },
  {
    href: '/balance',
    icon: Scale,
    labelEn: 'Balance',
    labelFr: 'Équilibre',
  },
  {
    href: '/stories',
    icon: BookOpen,
    labelEn: 'Stories',
    labelFr: 'Histoires',
  },
  {
    href: '/progress',
    icon: Heart,
    labelEn: 'Progress',
    labelFr: 'Progrès',
  },
]

export default function MemberLayout({ children }: MemberLayoutProps) {
  const pathname = usePathname()
  const { locale } = useLanguage()

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  // Don't show bottom nav on fill pages
  const isFillingResource = pathname?.includes('/fill')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-teal-50/50">
      {/* Main Content */}
      <main className="relative pb-24">
        {children}
      </main>

      {/* Bottom Navigation - Only show when not filling */}
      {!isFillingResource && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
          <div className="mx-4 mb-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-lg shadow-gray-200/50 border border-gray-100/50 px-2 py-2 flex items-center">
              {/* Nav Items */}
              <div className="flex-1 flex items-center justify-around">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col items-center justify-center py-2 px-4 relative"
                    >
                      <Icon
                        className={`w-6 h-6 transition-colors ${
                          active ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span
                        className={`text-[11px] mt-1 font-medium transition-colors ${
                          active ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                      >
                        {locale === 'fr' ? item.labelFr : item.labelEn}
                      </span>
                      {active && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Floating Action Button - Capture Moments */}
              <Link
                href="/moments/capture"
                className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-200/50 ml-2 active:scale-95 transition-transform"
              >
                <Camera className="w-6 h-6 text-white" />
              </Link>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
