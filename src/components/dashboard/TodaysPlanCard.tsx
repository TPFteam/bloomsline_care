'use client'

/**
 * Dashboard "Today's plan" card. Replaces the old upcoming-sessions
 * list. Always lands on TODAY when first mounted; chevrons step the
 * cursor by one day in either direction. Empty days surface a stable
 * (date-indexed, non-jittering) quip on the present/future, and a
 * neutral "no sessions that day" line on the past.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { quipForDay } from '@/lib/dashboard/empty-day-quips'

interface DayRow {
  id: string
  member_id: string | null
  client_name: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | string
  meet_link: string | null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface Props {
  practitionerId: string
}

export function TodaysPlanCard({ practitionerId }: Props) {
  const { locale } = useLanguage()
  const supabase = createClient()

  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()))
  const [rows, setRows] = useState<DayRow[]>([])
  const [loading, setLoading] = useState(true)

  const today = useMemo(() => startOfDay(new Date()), [])
  const isToday = isSameDay(cursor, today)
  const isPast = cursor < today
  const isFuture = cursor > today

  // Fetch sessions for the cursor day. We want the full local day window,
  // including completed / cancelled / no-show — they're rendered dimmed
  // below so the practitioner gets a complete picture.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const start = startOfDay(cursor)
      const end = addDays(start, 1)
      const { data } = await supabase
        .from('sessions')
        .select('id, member_id, scheduled_at, status, meet_link, members!inner(first_name, last_name, deleted_at)')
        .eq('practitioner_id', practitionerId)
        .gte('scheduled_at', start.toISOString())
        .lt('scheduled_at', end.toISOString())
        .order('scheduled_at', { ascending: true })

      if (cancelled) return
      const filtered = (data ?? [])
        .filter((s: any) => {
          const m = Array.isArray(s.members) ? s.members[0] : s.members
          return !m?.deleted_at
        })
        .map((s: any): DayRow => {
          const m = Array.isArray(s.members) ? s.members[0] : s.members
          return {
            id: s.id,
            member_id: s.member_id,
            client_name: m ? `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() : 'Unknown',
            scheduled_at: s.scheduled_at,
            status: s.status,
            meet_link: (s as any).meet_link ?? null,
          }
        })
      setRows(filtered)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [cursor, practitionerId, supabase])

  // Header label adapts to context: Aujourd'hui / Demain / Hier / actual date
  const headerLabel = useMemo(() => {
    if (isToday) return locale === 'fr' ? "Aujourd'hui" : locale === 'es' ? 'Hoy' : 'Today'
    if (isSameDay(cursor, addDays(today, 1))) return locale === 'fr' ? 'Demain' : locale === 'es' ? 'Mañana' : 'Tomorrow'
    if (isSameDay(cursor, addDays(today, -1))) return locale === 'fr' ? 'Hier' : locale === 'es' ? 'Ayer' : 'Yesterday'
    return cursor.toLocaleDateString(
      locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long' }
    )
  }, [cursor, isToday, locale, today])

  const allViewedSessionsLink = locale === 'fr' ? 'Voir toutes les séances' : locale === 'es' ? 'Ver todas las sesiones' : 'View all sessions'
  const todayPill = locale === 'fr' ? "Aujourd'hui" : locale === 'es' ? 'Hoy' : 'Today'
  const noSessionsThatDay = locale === 'fr' ? 'Aucune séance ce jour-là.' : locale === 'es' ? 'Sin sesiones ese día.' : 'No sessions that day.'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header — title + date chevrons + snap-back-to-today link */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
            {headerLabel}
          </h2>
          {!isToday && (
            <button
              type="button"
              onClick={() => setCursor(today)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
            >
              {todayPill}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(prev => addDays(prev, -1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label={locale === 'fr' ? 'Jour précédent' : locale === 'es' ? 'Día anterior' : 'Previous day'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(prev => addDays(prev, 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label={locale === 'fr' ? 'Jour suivant' : locale === 'es' ? 'Día siguiente' : 'Next day'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 animate-pulse rounded-full bg-gray-200" />
            <p className="text-sm text-gray-400">…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              {isPast ? noSessionsThatDay : quipForDay(cursor, locale)}
            </p>
          </div>
        ) : (
          rows.map((session, index) => {
            const sessionDate = new Date(session.scheduled_at)
            const timeLabel = sessionDate.toLocaleTimeString(
              locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
              { hour: '2-digit', minute: '2-digit' }
            )
            // Cancelled / no_show render dimmed with a strikethrough so
            // the practitioner sees the full picture without confusing
            // them with active rows.
            const dimmed = session.status === 'cancelled' || session.status === 'no_show'
            const isCompleted = session.status === 'completed'
            const dotColor = session.status === 'cancelled' ? 'bg-red-400'
              : session.status === 'no_show' ? 'bg-amber-400'
              : isCompleted ? 'bg-emerald-400'
              : 'bg-blue-500'

            const content = (
              <div
                className={`flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all cursor-pointer group ${
                  dimmed ? 'opacity-60 hover:opacity-80' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center relative">
                  <span className="text-sm font-bold text-blue-700 tabular-nums">
                    {timeLabel}
                  </span>
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${dotColor} ring-2 ring-white`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 ${dimmed ? 'line-through' : ''}`}>
                    {session.client_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {session.status === 'cancelled' ? (locale === 'fr' ? 'Annulée' : locale === 'es' ? 'Cancelada' : 'Cancelled')
                      : session.status === 'no_show' ? (locale === 'fr' ? 'Absent' : locale === 'es' ? 'Ausente' : 'No-show')
                      : isCompleted ? (locale === 'fr' ? 'Terminée' : locale === 'es' ? 'Completada' : 'Completed')
                      : timeLabel}
                  </p>
                </div>
                {session.meet_link && !dimmed && !isCompleted && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(session.meet_link!, '_blank', 'noopener,noreferrer') }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    <Video className="w-3.5 h-3.5" />
                    {locale === 'fr' ? 'Rejoindre' : locale === 'es' ? 'Unirse' : 'Join'}
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
              </div>
            )

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.04 }}
              >
                {session.member_id ? (
                  <Link href={`/members/${session.member_id}?tab=sessions_notes`}>{content}</Link>
                ) : (
                  content
                )}
              </motion.div>
            )
          })
        )}

        {!loading && (
          <Link
            href="/bookings"
            className="flex items-center justify-end gap-2 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {allViewedSessionsLink}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}
