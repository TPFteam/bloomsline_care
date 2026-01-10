'use client'

import Link from 'next/link'
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
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
    { id: 'home' as NavItem, href: '/dashboard', icon: Home, label: locale === 'fr' ? 'Accueil' : 'Home' },
  ]

  const resourceItems = [
    { id: 'library' as NavItem, href: '/library', icon: BookOpen, label: locale === 'fr' ? 'Ressources' : 'Library' },
  ]

  const managementItems = [
    { id: 'members' as NavItem, href: '/members', icon: Users, label: locale === 'fr' ? 'Patients' : 'Members' },
    { id: 'analytics' as NavItem, href: '/analytics', icon: BarChart3, label: locale === 'fr' ? 'Statistiques' : 'Analytics' },
  ]

  const renderNavItem = (item: { id: NavItem; href: string; icon: typeof Home; label: string }) => {
    const Icon = item.icon
    const isActive = activeItem === item.id

    return (
      <Link key={item.id} href={item.href}>
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{item.label}</span>
        </div>
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-screen transition-colors">
      {/* Logo */}
      <div className="px-3 h-[65px] flex items-center border-b border-gray-200 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="sm" showText />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(renderNavItem)}
        {resourceItems.map(renderNavItem)}
        {managementItems.map(renderNavItem)}
      </nav>
    </aside>
  )
}
