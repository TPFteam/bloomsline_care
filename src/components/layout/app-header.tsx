'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  User,
  Users,
  Settings,
  LogOut,
  Globe,
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import type { User as UserType } from '@/types/user'
import { BloomInlineChat } from '@/components/bloom/bloom-inline-chat'

interface AppHeaderProps {
  user: UserType | null
  leftContent?: React.ReactNode
  isAdmin?: boolean
}

export function AppHeader({ user, leftContent, isAdmin = false }: AppHeaderProps) {
  const { locale, setLocale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showPractitionerChat, setShowPractitionerChat] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-[100] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-[48px] flex items-center transition-colors">
      <div className="flex items-center justify-between w-full">
        {leftContent}

        <div className="flex items-center gap-3">
          {/* Talk to Bloom */}
          <button onClick={() => setShowPractitionerChat(true)}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm text-gray-900 dark:text-gray-100 font-medium">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
              <span>{locale === 'fr' ? 'Parler à Bloom' : locale === 'es' ? 'Hablar con Bloom' : 'Talk to Bloom'}</span>
            </div>
          </button>

          {/* Dark mode toggle - hidden for now */}
          {/* <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button> */}

          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : user?.full_name ? (
                  user.full_name[0]
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>{locale === 'fr' ? 'Profil' : locale === 'es' ? 'Perfil' : 'Profile'}</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{locale === 'fr' ? 'Paramètres' : locale === 'es' ? 'Configuración' : 'Settings'}</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin/practitioners"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>{locale === 'fr' ? 'Gérer praticiens' : 'Manage Practitioners'}</span>
                        </Link>
                      )}
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setLocale('en')
                            }}
                            className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${
                              locale === 'en'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            EN
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setLocale('fr')
                            }}
                            className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all ${
                              locale === 'fr'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            FR
                          </button>
                        </div>
                      </div>
                      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleSignOut()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{locale === 'fr' ? 'Déconnexion' : locale === 'es' ? 'Cerrar sesión' : 'Log out'}</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <BloomInlineChat
        isOpen={showPractitionerChat}
        onClose={() => setShowPractitionerChat(false)}
        suggestions={
          locale === 'fr'
            ? ['Qui devrais-je contacter cette semaine ?', 'Quelles tendances vois-tu ?', 'Comment vont mes membres ?', 'Comment améliorer ma pratique ?']
            : locale === 'es'
              ? ['Con quién debería conectarme?', 'Qué patrones ves?', 'Cómo están mis miembros?', 'Cómo puedo mejorar mi práctica?']
              : ['Who should I check in with this week?', 'What patterns do you notice?', 'How are my members doing?', 'How can I improve my practice?']
        }
      />
    </header>
  )
}
