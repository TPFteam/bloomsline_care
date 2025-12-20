'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Heart,
  BookOpen,
  MoreHorizontal,
  PieChart,
  Camera,
  Circle,
  X,
  Sun,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface MemberLayoutProps {
  children: React.ReactNode
}

// Animated icon wrapper component
function AnimatedIcon({
  Icon,
  isActive,
  className
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  isActive: boolean
  className?: string
}) {
  return (
    <motion.div
      animate={isActive ? {
        scale: [1, 1.15, 1],
        rotate: [0, -5, 5, 0],
      } : {}}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <Icon
        className={className}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </motion.div>
  )
}

// Primary nav items (always visible)
const primaryNavItems = [
  {
    href: '/home',
    icon: Home,
    labelEn: 'Home',
    labelFr: 'Accueil',
  },
  {
    href: '/moments',
    icon: Sun,
    labelEn: 'Moments',
    labelFr: 'Moments',
  },
  {
    href: '/progress',
    icon: Heart,
    labelEn: 'Progress',
    labelFr: 'Progrès',
  },
]

// Secondary nav items (in More menu)
const moreNavItems = [
  {
    href: '/care',
    icon: Heart,
    labelEn: 'Care',
    labelFr: 'Soins',
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    href: '/rituals',
    icon: Circle,
    labelEn: 'Rituals',
    labelFr: 'Rituels',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    href: '/stories',
    icon: BookOpen,
    labelEn: 'Stories',
    labelFr: 'Histoires',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    href: '/balance',
    icon: PieChart,
    labelEn: 'Balance',
    labelFr: 'Équilibre',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    href: '/reflection',
    icon: Heart,
    labelEn: 'Reflect',
    labelFr: 'Réflexion',
    gradient: 'from-teal-400 to-emerald-500',
  },
]

export default function MemberLayout({ children }: MemberLayoutProps) {
  const pathname = usePathname()
  const { locale } = useLanguage()
  const [showMore, setShowMore] = useState(false)

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  // Check if any "more" item is active
  const isMoreActive = moreNavItems.some(item => isActive(item.href))

  // Don't show bottom nav on fill pages
  const isFillingResource = pathname?.includes('/fill')

  // Don't show floating camera on moments pages (they have their own add button)
  const isMomentsPage = pathname?.startsWith('/moments')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-teal-50/50">
      {/* Main Content */}
      <main className="relative pb-24">
        {children}
      </main>

      {/* Floating Camera Button - Hide on moments pages and fill pages */}
      {!isFillingResource && !isMomentsPage && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
        >
          <Link
            href="/moments/capture"
            className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-300/50 active:scale-95 transition-transform"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Camera className="w-6 h-6 text-white" />
            </motion.div>
          </Link>
        </motion.div>
      )}

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-24 left-4 z-50"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[160px]">
                {moreNavItems.map((item, index) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                          active ? 'bg-gray-100' : 'hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <motion.div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </motion.div>
                        <span className={`font-medium ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                          {locale === 'fr' ? item.labelFr : item.labelEn}
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Only show when not filling */}
      {!isFillingResource && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
          <div className="mx-4 mb-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-lg shadow-gray-200/50 border border-gray-100/50 px-4 py-2 flex items-center justify-around">
              {/* More Button - Left side */}
              <motion.button
                onClick={() => setShowMore(!showMore)}
                className="flex flex-col items-center justify-center py-2 px-3 relative"
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className={`transition-colors ${
                    showMore || isMoreActive ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                  animate={showMore ? { rotate: 90 } : { rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {showMore ? (
                    <X className="w-6 h-6" strokeWidth={2} />
                  ) : (
                    <MoreHorizontal className="w-6 h-6" strokeWidth={isMoreActive ? 2.5 : 2} />
                  )}
                </motion.div>
                <span
                  className={`text-[11px] mt-1 font-medium transition-colors ${
                    showMore || isMoreActive ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {locale === 'fr' ? 'Plus' : 'More'}
                </span>
                {isMoreActive && !showMore && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>

              {/* Primary Nav Items */}
              {primaryNavItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center justify-center py-2 px-3 relative"
                  >
                    <AnimatedIcon
                      Icon={Icon}
                      isActive={active}
                      className={`w-6 h-6 transition-colors ${
                        active ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                    />
                    <motion.span
                      className={`text-[11px] mt-1 font-medium transition-colors ${
                        active ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                      animate={active ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {locale === 'fr' ? item.labelFr : item.labelEn}
                    </motion.span>
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
          </div>
        </nav>
      )}
    </div>
  )
}
