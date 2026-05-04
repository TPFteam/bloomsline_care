'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCheck,
  X,
  FileText,
  Calendar,
  UserPlus,
  Clock,
  MessageSquare,
  Trash2,
  Share2,
  XCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter, usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr, es } from 'date-fns/locale'
import { useLanguage } from '@/lib/i18n/context'
import type { NotificationType } from '@/lib/notifications/types'
import { getNotificationContent } from '@/lib/notifications/templates'

interface NotificationBellProps {
  className?: string
}

const notificationIcons: Record<string, React.ElementType> = {
  resource_shared: Share2,
  resource_assigned: FileText,
  resource_submitted: FileText,
  story_shared: BookOpen,
  resource_started: FileText,
  session_scheduled: Calendar,
  session_reminder_24h: Clock,
  session_reminder_1h: Clock,
  session_cancelled: Calendar,
  session_rescheduled: Calendar,
  booking_request: Calendar,
  booking_confirmed: Calendar,
  booking_cancelled: XCircle,
  booking_cancelled_by_member: XCircle,
  booking_rescheduled_by_member: RefreshCw,
  booking_rescheduled_by_practitioner: RefreshCw,
  reschedule_requested: RefreshCw,
  member_invitation_accepted: UserPlus,
  member_invitation_rejected: UserPlus,
  member_inactive: UserPlus,
  weekly_summary: MessageSquare,
  ritual_reminder: Bell,
  bloom_checkin: MessageSquare,
}

const notificationColors: Record<string, string> = {
  resource_shared: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  resource_assigned: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  resource_submitted: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  story_shared: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  session_scheduled: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  booking_request: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  booking_cancelled: 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400',
  booking_cancelled_by_member: 'bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400',
  booking_rescheduled_by_member: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  booking_rescheduled_by_practitioner: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  reschedule_requested: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  member_invitation_accepted: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60',
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [detailNotification, setDetailNotification] = useState<typeof notifications[0] | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useLanguage()

  // Detect if user is on member pages vs practitioner pages
  const isMemberSide = useMemo(() => {
    const memberPaths = ['/home', '/care', '/worksheets', '/resources', '/profile/member', '/settings/member']
    return memberPaths.some(p => pathname?.startsWith(p))
  }, [pathname])

  const settingsUrl = isMemberSide ? '/settings/member' : '/settings?tab=notifications'

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
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
        setSwipedId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    // For cancel notifications, show detail popup instead of navigating
    if (notification.type === 'booking_cancelled_by_member') {
      setDetailNotification(notification)
      return
    }
    if (notification.action_url) {
      // Security: Only navigate to internal paths (starting with /)
      let url = notification.action_url
      // Add highlight param for booking notifications if not already present
      if (url === '/bookings' && notification.entity_id && notification.entity_type === 'booking') {
        url = `/bookings?highlight=${notification.entity_id}`
      }
      if (url.startsWith('/') && !url.startsWith('//')) {
        router.push(url)
        setIsOpen(false)
      }
    }
  }

  const handleSwipe = (notificationId: string, info: PanInfo) => {
    if (info.offset.x < -80) {
      setSwipedId(notificationId)
    } else {
      setSwipedId(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
    setSwipedId(null)
  }

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await markAsRead(notificationId)
  }

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: locale === 'fr' ? fr : locale === 'es' ? es : undefined,
    })
  }

  const getIcon = (type: NotificationType) => {
    return notificationIcons[type] || Bell
  }

  const getIconColor = (type: NotificationType) => {
    return notificationColors[type] || notificationColors.default
  }

  return (
    <div className={`relative z-[100] ${className}`}>
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
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {locale === 'fr' ? 'Notifications' : locale === 'es' ? 'Notificaciones' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-full">
                    {unreadCount} {locale === 'fr' ? 'nouvelles' : locale === 'es' ? 'nuevas' : 'new'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    title={locale === 'fr' ? 'Tout marquer comme lu' : locale === 'es' ? 'Marcar todo como leido' : 'Mark all as read'}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-300 dark:text-white/20" />
                  </div>
                  <p className="text-gray-500 dark:text-white/50 font-medium">
                    {locale === 'fr' ? 'Aucune notification' : locale === 'es' ? 'No hay notificaciones' : 'No notifications yet'}
                  </p>
                  <p className="text-gray-400 dark:text-white/30 text-sm mt-1">
                    {locale === 'fr'
                      ? 'Vous verrez vos notifications ici'
                      : locale === 'es'
                        ? 'Veras tus notificaciones aqui'
                        : "You'll see your notifications here"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                  {notifications.map((notification) => {
                    const Icon = getIcon(notification.type)
                    const isSwiped = swipedId === notification.id

                    return (
                      <div key={notification.id} className="relative overflow-hidden">
                        {/* Delete action behind */}
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="h-full px-4 bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {locale === 'fr' ? 'Supprimer' : locale === 'es' ? 'Eliminar' : 'Delete'}
                            </span>
                          </button>
                        </div>

                        {/* Notification content */}
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: -100, right: 0 }}
                          dragElastic={0.1}
                          onDragEnd={(_, info) => handleSwipe(notification.id, info)}
                          animate={{ x: isSwiped ? -100 : 0 }}
                          className={`relative bg-white dark:bg-[#1a1a1c] cursor-pointer group ${
                            !notification.read
                              ? 'bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-500/5'
                              : ''
                          }`}
                        >
                          <div
                            onClick={() => handleNotificationClick(notification)}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="flex gap-3">
                              {/* Icon */}
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconColor(
                                  notification.type
                                )}`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  {(() => {
                                    // Re-render title/body in the current UI locale (not the stored language)
                                    const localized = notification.metadata
                                      ? getNotificationContent(notification.type as NotificationType, notification.metadata, locale as 'en' | 'fr' | 'es')
                                      : null
                                    const displayTitle = localized?.title || notification.title
                                    const displayBody = localized?.body || notification.body
                                    return (
                                      <>
                                        <p
                                          className={`text-sm font-medium leading-snug ${
                                            !notification.read
                                              ? 'text-gray-900 dark:text-white'
                                              : 'text-gray-600 dark:text-white/70'
                                          }`}
                                        >
                                          {displayTitle}
                                        </p>
                                        {!notification.read && (
                                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                                {(() => {
                                  const localized = notification.metadata
                                    ? getNotificationContent(notification.type as NotificationType, notification.metadata, locale as 'en' | 'fr' | 'es')
                                    : null
                                  return (
                                    <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-2 mt-0.5 leading-snug">
                                      {localized?.body || notification.body}
                                    </p>
                                  )
                                })()}
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-400 dark:text-white/30">
                                    {formatTime(notification.created_at)}
                                  </p>

                                  {/* Action buttons - visible on hover */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notification.read && (
                                      <button
                                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 transition-colors"
                                        title={locale === 'fr' ? 'Marquer comme lu' : locale === 'es' ? 'Marcar como leido' : 'Mark as read'}
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => handleDelete(e, notification.id)}
                                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors"
                                      title={locale === 'fr' ? 'Supprimer' : locale === 'es' ? 'Eliminar' : 'Delete'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation detail popup */}
      {detailNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setDetailNotification(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[380px] mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header accent */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 pt-6 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{locale === 'fr' ? 'Séance annulée' : 'Session cancelled'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(detailNotification.created_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <button onClick={() => setDetailNotification(null)} className="p-1 hover:bg-white/60 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {(detailNotification.metadata as any)?.clientName && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 text-sm font-bold">
                    {((detailNotification.metadata as any).clientName as string).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{(detailNotification.metadata as any).clientName}</p>
                    <p className="text-[11px] text-gray-400">{locale === 'fr' ? 'Patient' : 'Patient'}</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {(detailNotification.metadata as any)?.scheduledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">{locale === 'fr' ? 'Date prévue' : 'Scheduled'}</span>
                    <span className="text-xs font-semibold text-gray-700">{(detailNotification.metadata as any).scheduledAt}</span>
                  </div>
                )}
                {(detailNotification.metadata as any)?.sessionType && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium">{locale === 'fr' ? 'Type' : 'Type'}</span>
                    <span className="text-xs font-semibold text-gray-700">{(detailNotification.metadata as any).sessionType}</span>
                  </div>
                )}
              </div>

              {(detailNotification.metadata as any)?.reason && (
                <div className="bg-red-50/60 rounded-2xl p-4">
                  <p className="text-[11px] text-red-400 font-medium uppercase tracking-wider mb-1.5">{locale === 'fr' ? 'Raison de l\'annulation' : 'Cancellation reason'}</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{(detailNotification.metadata as any).reason}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setDetailNotification(null)}
                className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl hover:shadow-lg hover:shadow-teal-200/40 transition-all"
              >
                {locale === 'fr' ? 'Compris' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
