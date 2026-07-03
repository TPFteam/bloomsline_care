'use client'

// Bottom tab bar for the care app on phones. Replaces the sidebar on small
// screens (hidden at sm+). Keep in sync with AppSidebar's main destinations.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarCheck, Users, BookOpen } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export function MobileTabBar() {
  const pathname = usePathname()
  const { locale } = useLanguage()

  const items = [
    { href: '/dashboard', icon: Home, label: locale === 'fr' ? 'Accueil' : 'Home' },
    { href: '/bookings', icon: CalendarCheck, label: locale === 'fr' ? 'Réservations' : 'Bookings' },
    { href: '/members', icon: Users, label: locale === 'fr' ? 'Personnes' : 'People' },
    { href: '/resources', icon: BookOpen, label: locale === 'fr' ? 'Ressources' : 'Resources' },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href))
          const Icon = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${active ? 'text-teal-600' : 'text-gray-400'}`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
