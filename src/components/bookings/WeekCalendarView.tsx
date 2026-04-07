'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Check, X, Clock, Mail, Loader2 } from 'lucide-react'
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
        setGoogleEvents((data.events || []).map((e: any) => ({ ...e, source: 'google' as const })))
      }
    } catch { /* silent */ }
  }, [weekStart])

  useEffect(() => { fetchGoogleEvents() }, [fetchGoogleEvents])

  const bookingEvents: CalendarEvent[] = bookings
    .filter(b => b.status !== 'cancelled')
    .map(b => ({ id: b.id, title: b.client_name, start: b.start_time, end: b.end_time, source: 'booking' as const, status: b.status, email: b.client_email, sessionType: b.session_type, notes: b.notes || undefined }))

  const allEvents = [...bookingEvents, ...googleEvents]
  const getEventsForDay = (day: Date) => allEvents.filter(e => isSameDay(parseISO(e.start), day))

  const getEventPosition = (event: CalendarEvent) => {
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60
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
        <button onClick={() => setWeekStart(prev => addDays(prev, -7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {format(weekStart, locale === 'fr' ? 'd MMM' : 'MMM d')} — {format(addDays(weekStart, 6), locale === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy')}
          </h3>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors">
            {locale === 'fr' ? "Aujourd'hui" : 'Today'}
          </button>
        </div>
        <button onClick={() => setWeekStart(prev => addDays(prev, 7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
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
                const h = now.getHours() + now.getMinutes() / 60
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
                          {format(parseISO(event.start), 'h:mm a')}
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
                              {format(parseISO(event.start), 'h:mm a')} – {format(parseISO(event.end), 'h:mm a')}
                            </p>
                            {event.email && (
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {event.email}
                              </p>
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

      {/* Legend */}
      <div className="flex items-center gap-5 px-6 py-3 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-200" />
          {locale === 'fr' ? 'Confirmé' : 'Confirmed'}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />
          {locale === 'fr' ? 'En attente' : 'Pending'}
        </span>
        {googleConnected && (
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-200" />
            Google Calendar
          </span>
        )}
      </div>
    </div>
  )
}
