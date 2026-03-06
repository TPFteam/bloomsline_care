'use client'

import Link from 'next/link'
import {
  Home,
  BookOpen,
  Users,
  Activity,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useLanguage } from '@/lib/i18n/context'

type NavItem = 'home' | 'library' | 'members' | 'analytics'

interface AppSidebarProps {
  activeItem?: NavItem
}

export function AppSidebar({ activeItem }: AppSidebarProps) {
  const { locale } = useLanguage()

  const navItems = [
    { id: 'home' as NavItem, href: '/dashboard', icon: Home, label: locale === 'fr' ? 'Accueil' : locale === 'es' ? 'Inicio' : 'Home' },
    { id: 'members' as NavItem, href: '/members', icon: Users, label: locale === 'fr' ? 'Personnes suivies' : locale === 'es' ? 'Personas' : 'People' },
    { id: 'library' as NavItem, href: '/library', icon: BookOpen, label: locale === 'fr' ? 'Bibliothèque' : locale === 'es' ? 'Biblioteca' : 'Library' },
    { id: 'analytics' as NavItem, href: '/analytics', icon: Activity, label: locale === 'fr' ? 'Signaux' : locale === 'es' ? 'Señales' : 'Signals' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-[110] bg-teal-700 flex flex-col h-screen w-14">
      {/* Logo */}
      <div className="h-[65px] flex items-center justify-center">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="sm" showText={false} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id

          return (
            <Link key={item.id} href={item.href}>
              <div className="relative group">
                <div
                  className={`flex items-center justify-center rounded-lg py-2.5 transition-all duration-150 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-teal-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none shadow-lg">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
