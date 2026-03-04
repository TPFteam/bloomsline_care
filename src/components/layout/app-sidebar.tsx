'use client'

import { useState } from 'react'
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
  const [expanded, setExpanded] = useState(false)

  const navItems = [
    { id: 'home' as NavItem, href: '/dashboard', icon: Home, label: locale === 'fr' ? 'Accueil' : locale === 'es' ? 'Inicio' : 'Home' },
    { id: 'members' as NavItem, href: '/members', icon: Users, label: locale === 'fr' ? 'Personnes suivies' : locale === 'es' ? 'Personas' : 'People' },
    { id: 'library' as NavItem, href: '/library', icon: BookOpen, label: locale === 'fr' ? 'Bibliothèque' : locale === 'es' ? 'Biblioteca' : 'Library' },
    { id: 'analytics' as NavItem, href: '/analytics', icon: Activity, label: locale === 'fr' ? 'Signaux' : locale === 'es' ? 'Señales' : 'Signals' },
  ]

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 z-[109] bg-black/10 backdrop-blur-[1px] transition-opacity duration-200"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-[110] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'w-56 shadow-2xl shadow-black/10' : 'w-16'
        }`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className={`h-[65px] flex items-center border-b border-gray-100 dark:border-gray-800 ${
          expanded ? 'px-4' : 'justify-center'
        }`}>
          <Link href="/dashboard" className="flex items-center">
            <Logo size="sm" showText={expanded} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto ${expanded ? 'px-3' : 'px-2'}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <Link key={item.id} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg text-[13px] transition-all duration-150 ${
                    expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
                  } ${
                    isActive
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? '' : ''}`} />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
