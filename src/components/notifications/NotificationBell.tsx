'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useLanguage } from '@/lib/i18n/context'

interface NotificationBellProps {
  className?: string
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const { locale } = useLanguage()

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
      setIsOpen(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: locale === 'fr' ? fr : undefined,
    })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-white/70" />

        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-semibold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {locale === 'fr' ? 'Notifications' : 'Notifications'}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {locale === 'fr' ? 'Tout marquer lu' : 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-white/20 mb-3" />
                  <p className="text-gray-500 dark:text-white/50 text-sm">
                    {locale === 'fr' ? 'Aucune notification' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <motion.button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Unread indicator */}
                        <div className="mt-1.5">
                          {!notification.read ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-300 dark:text-white/20" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            !notification.read
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-white/70'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-2 mt-0.5">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-white/10">
                <button
                  onClick={() => {
                    router.push('/settings?tab=notifications')
                    setIsOpen(false)
                  }}
                  className="text-xs text-gray-500 dark:text-white/50 hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  {locale === 'fr' ? 'Gérer les préférences' : 'Manage preferences'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
