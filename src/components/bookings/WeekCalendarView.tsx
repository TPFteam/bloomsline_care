'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Check, X, Clock, Mail, Loader2, Video, Building2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  source: 'booking' | 'google'
  status?: string
  email?: string
  sessionType?: string
  notes?: string
  meetLink?: string | null
}

interface WeekCalendarViewProps {
  bookings: Array<{
    id: string
    client_name: string
    client_email: string
    start_time: string
    end_time: string
    status: string
    session_type: string
    notes: string | null
    google_event_id?: string | null
    meet_link?: string | null
  }>
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  processingId?: string | null
}

const HOUR_HEIGHT = 56
const START_HOUR = 7
const END_HOUR = 21
const TOTAL_HOURS = END_HOUR - START_HOUR

export function WeekCalendarView({ bookings, onApprove, onReject, processingId }: WeekCalendarViewProps) {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [practitionerTz, setPractitionerTz] = useState<string | null>(null)
  const [dayFormats, setDayFormats] = useState<Record<number, string[]>>({})

  // Fetch practitioner timezone + day formats
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('availability_schedules')
        .select('timezone, day_of_week, session_format')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .then(({ data }) => {
          if (!data || data.length === 0) return
          setPractitionerTz(data[0].timezone)
          const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
          const dfMap: Record<number, string[]> = {}
          for (const d of data) {
            const num = dayMap[d.day_of_week]
            const fmt = (d as any).session_format || 'both'
            if (!dfMap[num]) dfMap[num] = []
            if (fmt === 'both') {
              if (!dfMap[num].includes('in_person')) dfMap[num].push('in_person')
              if (!dfMap[num].includes('video')) dfMap[num].push('video')
            } else {
              if (!dfMap[num].includes(fmt)) dfMap[num].push(fmt)
            }
          }
          setDayFormats(dfMap)
        })
    })
  }, [])

  // Helper: get hours/minutes in practitioner's timezone
  const getHoursInTz = (isoStr: string): number => {
    const d = new Date(isoStr)
    const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
    const h = parseInt(d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
    const m = parseInt(d.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' }))
    return (h === 24 ? 0 : h) + m / 60
  }

  const formatTimeInTz = (isoStr: string): string => {
    const d = new Date(isoStr)
    const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
    return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr',
    })
  }

  const isSameDayInTz = (isoStr: string, day: Date): boolean => {
    const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
    const d = new Date(isoStr)
    const eventDate = d.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
    const dayDate = format(day, 'yyyy-MM-dd')
    return eventDate === dayDate
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchGoogleEvents = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const start = weekStart.toISOString()
      const end = addDays(weekStart, 7).toISOString()
      const res = await fetch(`/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGoogleConnected(data.connected)
        setGoogleEvents((data.events || []).map((e: any) => ({ ...e, source: 'google' as const, meetLink: e.meetLink || null })))
      }
    } catch { /* silent */ }
  }, [weekStart])

  useEffect(() => { fetchGoogleEvents() }, [fetchGoogleEvents])

  // Sync check: cancel bookings that were removed from Google Calendar
  useEffect(() => {
    fetch('/api/calendar/sync-check', { method: 'POST' }).catch(() => {})
  }, [])

  const bookingEvents: CalendarEvent[] = bookings
    .filter(b => b.status !== 'cancelled')
    .map(b => ({ id: b.id, title: b.client_name, start: b.start_time, end: b.end_time, source: 'booking' as const, status: b.status, email: b.client_email, sessionType: b.session_type, notes: b.notes || undefined, meetLink: b.meet_link }))

  // Deduplicate: remove Google Calendar events that are synced copies of Bloomsline bookings
  // A Google event is a duplicate if its start time matches a booking's start time (within 1 min)
  const bookingStartTimes = new Set(
    bookings
      .filter(b => b.status !== 'cancelled' && b.google_event_id)
      .map(b => Math.floor(new Date(b.start_time).getTime() / 60000)) // round to minute
  )
  const dedupedGoogleEvents = googleEvents.filter(e => {
    const startMin = Math.floor(new Date(e.start).getTime() / 60000)
    return !bookingStartTimes.has(startMin)
  })

  const allEvents = [...bookingEvents, ...dedupedGoogleEvents]
  const getEventsForDay = (day: Date) => allEvents.filter(e => isSameDayInTz(e.start, day))

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = getHoursInTz(event.start)
    const endHour = getHoursInTz(event.end)
    return {
      top: (startHour - START_HOUR) * HOUR_HEIGHT,
      height: Math.max((endHour - startHour) * HOUR_HEIGHT, 28),
    }
  }

  // Detect overlaps and assign columns
  const layoutEvents = (events: CalendarEvent[]) => {
    const sorted = [...events].sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
    const positioned: Array<CalendarEvent & { col: number; totalCols: number }> = []

    for (const event of sorted) {
      const eStart = parseISO(event.start).getTime()
      const eEnd = parseISO(event.end).getTime()

      // Find overlapping events already placed
      const overlapping = positioned.filter(p => {
        const pStart = parseISO(p.start).getTime()
        const pEnd = parseISO(p.end).getTime()
        return eStart < pEnd && eEnd > pStart
      })

      const usedCols = new Set(overlapping.map(o => o.col))
      let col = 0
      while (usedCols.has(col)) col++

      positioned.push({ ...event, col, totalCols: 1 })

      // Update totalCols for all overlapping events
      const group = [...overlapping, positioned[positioned.length - 1]]
      const maxCol = Math.max(...group.map(g => g.col)) + 1
      group.forEach(g => { g.totalCols = maxCol })
    }

    return positioned
  }

  const todayCheck = (day: Date) => isSameDay(day, new Date())

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(prev => addDays(prev, -7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-sm font-semibold text-gray-800">
            {format(weekStart, locale === 'fr' ? 'd MMM' : 'MMM d')} — {format(addDays(weekStart, 6), locale === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy')}
          </h3>
          <button onClick={() => setWeekStart(prev => addDays(prev, 7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors">
            {locale === 'fr' ? "Aujourd'hui" : 'Today'}
          </button>
          {practitionerTz && (
            <span className="text-[11px] text-gray-400 ml-1">
              ({practitionerTz.replace(/_/g, ' ').split('/').pop()})
            </span>
          )}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-teal-100 border border-teal-200" />
            {locale === 'fr' ? 'Confirmé' : 'Confirmed'}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-amber-100 border border-amber-300" />
            {locale === 'fr' ? 'En attente' : 'Pending'}
          </span>
          {googleConnected && (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-200" />
              Google Calendar
            </span>
          )}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-t border-gray-100">
        <div />
        {days.map(day => (
          <div key={day.toISOString()} className="py-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{format(day, 'EEE')}</p>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${todayCheck(day) ? 'bg-teal-600 text-white' : 'text-gray-800'}`}>
              <span className="text-sm font-semibold">{format(day, 'd')}</span>
            </div>
            {dayFormats[day.getDay()] && (
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {dayFormats[day.getDay()].includes('video') && (
                  <div className="w-4 h-4 rounded bg-blue-50 flex items-center justify-center" title={locale === 'fr' ? 'Vidéo' : 'Video'}>
                    <Video className="w-2.5 h-2.5 text-blue-400" />
                  </div>
                )}
                {dayFormats[day.getDay()].includes('in_person') && (
                  <div className="w-4 h-4 rounded bg-amber-50 flex items-center justify-center" title={locale === 'fr' ? 'En personne' : 'In person'}>
                    <Building2 className="w-2.5 h-2.5 text-amber-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] overflow-y-auto border-t border-gray-100" style={{ maxHeight: '560px' }}>
        <div>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div key={i} className="flex items-start justify-end pr-3 pt-0.5" style={{ height: HOUR_HEIGHT }}>
              <span className="text-[10px] text-gray-300 font-medium">{format(new Date(2000, 0, 1, START_HOUR + i), 'h a')}</span>
            </div>
          ))}
        </div>

        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const today = todayCheck(day)
          const laid = layoutEvents(dayEvents)

          return (
            <div key={day.toISOString()} className={`relative border-l border-gray-50 ${today ? 'bg-teal-50/20' : ''}`}>
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
              ))}

              {/* Now line */}
              {today && (() => {
                const now = new Date()
                const h = getHoursInTz(now.toISOString())
                if (h < START_HOUR || h > END_HOUR) return null
                return (
                  <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-400 -ml-1" />
                      <div className="flex-1 h-[1.5px] bg-red-400/60" />
                    </div>
                  </div>
                )
              })()}

              {/* Events */}
              {laid.map(event => {
                const { top, height } = getEventPosition(event)
                const isGoogle = event.source === 'google'
                const isPending = event.status === 'pending'
                const isSelected = selectedEvent === event.id
                const colWidth = 100 / event.totalCols
                const left = `${event.col * colWidth}%`
                const width = `${colWidth - 2}%`

                return (
                  <div key={event.id}>
                    <div
                      onClick={() => setSelectedEvent(isSelected ? null : event.id)}
                      className={`absolute rounded-lg px-2 py-1.5 overflow-hidden z-10 border cursor-pointer transition-all ${
                        isSelected ? 'shadow-lg z-20 ring-2 ring-offset-1' : 'hover:shadow-md'
                      } ${
                        isGoogle
                          ? `bg-blue-50 border-blue-200/60 text-blue-700 ${isSelected ? 'ring-blue-300' : ''}`
                          : isPending
                            ? `bg-amber-50 border-amber-300 text-amber-800 ${isSelected ? 'ring-amber-300' : ''}`
                            : event.status === 'completed'
                              ? `bg-gray-50 border-gray-200/60 text-gray-500 ${isSelected ? 'ring-gray-300' : ''}`
                              : `bg-teal-50 border-teal-200/60 text-teal-700 ${isSelected ? 'ring-teal-300' : ''}`
                      }`}
                      style={{ top, height: Math.max(height, 26), left: `calc(${left} + 4px)`, width: `calc(${width} - 2px)` }}
                    >
                      <p className="text-[11px] font-semibold truncate leading-tight">{event.title}</p>
                      {height > 32 && (
                        <p className="text-[10px] opacity-60 truncate mt-0.5">
                          {formatTimeInTz(event.start)}
                        </p>
                      )}
                    </div>

                    {/* Popover */}
                    {isSelected && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSelectedEvent(null)} />
                        <div
                          className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-56"
                          style={{ top: top + Math.min(height, 40), left: `calc(${left} + 4px)` }}
                        >
                          <p className="font-semibold text-gray-900 text-sm mb-1">{event.title}</p>
                          <div className="space-y-1 text-xs text-gray-500 mb-3">
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {formatTimeInTz(event.start)} – {formatTimeInTz(event.end)}
                            </p>
                            {event.email && (
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {event.email}
                              </p>
                            )}
                            {event.meetLink && (
                              <a
                                href={event.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Video className="w-3 h-3" />
                                {locale === 'fr' ? 'Rejoindre Google Meet' : 'Join Google Meet'}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {event.sessionType && (
                              <p className="text-gray-400">{event.sessionType}</p>
                            )}
                            {isGoogle && (
                              <p className="text-blue-500 text-[11px]">Google Calendar</p>
                            )}
                            {event.status && (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                isPending ? 'bg-amber-100 text-amber-700' : event.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {event.status === 'pending' ? (locale === 'fr' ? 'En attente' : 'Pending')
                                  : event.status === 'confirmed' ? (locale === 'fr' ? 'Confirmé' : 'Confirmed')
                                  : event.status}
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {event.notes && (
                            <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2 mt-1">{event.notes}</p>
                          )}

                          {/* Actions for pending bookings */}
                          {isPending && onApprove && onReject && (
                            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); onApprove(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                              >
                                {processingId === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {locale === 'fr' ? 'Accepter' : 'Approve'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onReject(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                {locale === 'fr' ? 'Refuser' : 'Reject'}
                              </button>
                            </div>
                          )}

                          {/* Cancel for confirmed bookings */}
                          {event.status === 'confirmed' && event.source === 'booking' && onReject && (
                            <div className="pt-2 border-t border-gray-100 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); onReject(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
                              >
                                {processingId === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                {locale === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

    </div>
  )
}
