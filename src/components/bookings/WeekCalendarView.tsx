'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Check, X, Clock, Mail, Loader2, Video, Building2, ExternalLink, ArrowRight, Palette, FileText } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser-client'
import { PaymentBadge } from '@/components/ui/payment-badge'
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
  paymentStatus?: 'paid' | 'unpaid'
  bookingId?: string
  memberId?: string | null
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
    payment_status?: string | null
    member_id?: string | null
  }>
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  processingId?: string | null
  onSlotClick?: (day: Date, time: string, options?: { outsideHours?: boolean }) => void
  // When true, the toolbar (legend / week nav / Today / Availability)
  // is skipped entirely — only the day strip + time grid render.
  hideToolbar?: boolean
  // When true, render the toolbar but skip the legend chips on its
  // left side. Keeps week navigation, Today, timezone, and
  // Availability. Used by the dashboard embed where the legend is
  // noise but the practitioner still needs to navigate weeks.
  hideLegend?: boolean
  // Override for the internal grid's max-height (default 560). The
  // dashboard embed sets a smaller value to keep the widget at the
  // same height as a populated "Up next" list.
  gridMaxHeight?: number
  // Set of `${memberId}::${minutePrecisionTs}` keys identifying which
  // bookings already have a saved session_summary note. Used by the
  // event popover to label the notes button "View notes" vs
  // "Take notes".
  bookingsWithNotes?: Set<string>
  // Open the floating notes editor for a specific booking. Parent
  // resolves bookingId → Booking and calls into the shared
  // handleTakeNotes flow.
  onTakeNotes?: (bookingId: string) => void
}

const HOUR_HEIGHT = 56
const START_HOUR = 7
const END_HOUR = 21
const TOTAL_HOURS = END_HOUR - START_HOUR

export function WeekCalendarView({ bookings, onApprove, onReject, processingId, onSlotClick, hideToolbar, hideLegend, gridMaxHeight, bookingsWithNotes, onTakeNotes }: WeekCalendarViewProps) {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [practitionerTz, setPractitionerTz] = useState<string | null>(null)
  const [dayFormats, setDayFormats] = useState<Record<number, string[]>>({})
  const [showAvailability, setShowAvailability] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [availSlots, setAvailSlots] = useState<Record<string, Array<{ start: string; end: string; outside: boolean }>>>({})
  const [availLoading, setAvailLoading] = useState(false)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [clickHint, setClickHint] = useState<{ x: number; y: number; key: string } | null>(null)

  useEffect(() => {
    if (!clickHint) return
    const t = setTimeout(() => setClickHint(null), 2500)
    return () => clearTimeout(t)
  }, [clickHint])

  // Fetch practitioner timezone + day formats
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
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

  // Fetch available slots for visible week
  useEffect(() => {
    if (!showAvailability || !userId) { setAvailSlots({}); return }
    const fetchSlots = async () => {
      setAvailLoading(true)
      const result: Record<string, Array<{ start: string; end: string; outside: boolean }>> = {}
      await Promise.all(days.map(async (day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        try {
          const res = await fetch(`/api/bookings/available-slots?practitionerId=${userId}&date=${dateStr}&duration=60&skipNotice=true`)
          if (res.ok) {
            const data = await res.json()
            result[dateStr] = (data.slots || []).map((s: any) => ({
              start: s.slot_start,
              end: s.slot_end,
              outside: !!s.outside_availability,
            }))
          }
        } catch { /* silent */ }
      }))
      setAvailSlots(result)
      setAvailLoading(false)
    }
    fetchSlots()
  }, [showAvailability, weekStart, userId, dayFormats])


  const bookingEvents: CalendarEvent[] = bookings
    .filter(b => b.status !== 'cancelled')
    .map(b => ({ id: b.id, title: b.client_name, start: b.start_time, end: b.end_time, source: 'booking' as const, status: b.status, email: b.client_email, sessionType: b.session_type, notes: b.notes || undefined, meetLink: b.meet_link, paymentStatus: (b.payment_status || 'unpaid') as 'paid' | 'unpaid', bookingId: b.id, memberId: b.member_id || null }))

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
      {/* Header — toolbar with legend, week nav, Today, Availability.
          hideToolbar drops the whole bar; hideLegend keeps the bar
          but drops the legend chips (used by the dashboard embed). */}
      {!hideToolbar && (
      // hideLegend reverses the row so the nav controls slot to the
      // left and the right edge stays free for the dashboard embed's
      // expand button.
      <div className={`flex items-center justify-between px-6 py-4 ${hideLegend ? 'flex-row-reverse' : ''}`}>
        {/* Legend — "Confirmed" entry dropped; confirmed is the default
            state and the dedicated label was confusing alongside the
            "Completed" tag we use post-session. */}
        {hideLegend ? <div /> : (
        // Collapsed legend — palette icon opens a small popover with
        // the color key. Keeps the toolbar uncluttered while still
        // exposing what each color means on demand.
        <div className="relative">
          <button
            type="button"
            onClick={() => setLegendOpen(o => !o)}
            title={locale === 'fr' ? 'Légende des couleurs' : 'Color legend'}
            aria-label={locale === 'fr' ? 'Légende des couleurs' : 'Color legend'}
            aria-expanded={legendOpen}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              legendOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>
          {legendOpen && (
            <>
              {/* Click-away catcher */}
              <button
                type="button"
                onClick={() => setLegendOpen(false)}
                aria-hidden
                tabIndex={-1}
                className="fixed inset-0 z-30 cursor-default"
              />
              <div className="absolute top-full left-0 mt-2 z-40 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                  {locale === 'fr' ? 'Légende' : 'Legend'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-teal-50 border border-teal-200 shrink-0" />
                  {locale === 'fr' ? 'Prévue' : 'Scheduled'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-teal-100 border border-teal-300 shrink-0" />
                  {locale === 'fr' ? 'Terminée' : 'Completed'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300 shrink-0" />
                  {locale === 'fr' ? 'En attente' : 'Pending'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-white border border-dashed border-gray-400 shrink-0" />
                  {locale === 'fr' ? 'Hors horaires' : 'After-hours'}
                </div>
                {googleConnected && (
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 shrink-0" />
                    Google Calendar
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        )}
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(prev => addDays(prev, -7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-sm font-semibold text-gray-800">
            {format(weekStart, locale === 'fr' ? 'd MMM' : 'MMM d', { locale: locale === 'fr' ? frLocale : undefined })} — {format(addDays(weekStart, 6), locale === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: locale === 'fr' ? frLocale : undefined })}
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
          <button
            onClick={() => setShowAvailability(prev => !prev)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ml-2 ${
              showAvailability
                ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-sm'
                : 'text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showAvailability ? 'bg-teal-500' : 'bg-gray-300'}`} />
            {locale === 'fr' ? 'Disponibilités' : 'Availability'}
            {availLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          </button>
        </div>
      </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-t border-gray-100">
        <div />
        {days.map(day => (
          <div key={day.toISOString()} className="py-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{format(day, 'EEE', { locale: locale === 'fr' ? frLocale : undefined })}</p>
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
      <div className="relative">
      {showAvailability && availLoading && (
        <div className="absolute inset-x-0 top-2 z-40 pointer-events-none flex items-start justify-center">
          <div className="bg-white shadow-md border border-gray-200 rounded-full px-3.5 py-1.5 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span className="text-[11px] font-medium text-gray-600">
              {locale === 'fr' ? 'Chargement des disponibilités…' : 'Loading availability…'}
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] overflow-y-auto border-t border-gray-100" style={{ maxHeight: `${gridMaxHeight ?? 560}px` }}>
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
            <div
              key={day.toISOString()}
              onMouseEnter={() => setHoveredDay(day.toISOString())}
              onMouseLeave={() => setHoveredDay(prev => prev === day.toISOString() ? null : prev)}
              className={`relative border-l border-gray-50 ${today ? 'bg-teal-50/20' : ''} ${onSlotClick && !showAvailability ? 'cursor-pointer' : ''}`}
              style={{ touchAction: onSlotClick ? 'manipulation' : undefined }}
              onClick={(e) => {
                if (!onSlotClick) return
                if ((e.target as HTMLElement).closest('[data-event]')) return
                // Whitespace click only reveals the availability overlay.
                // Booking is triggered exclusively by clicking a teal slot
                // pill — clicks on empty grid space never open the modal,
                // so practitioners can't accidentally book non-configured
                // times.
                if (!showAvailability) {
                  setShowAvailability(true)
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                setClickHint({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  key: day.toISOString(),
                })
              }}
            >
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
              ))}

              {/* Inline hint: shown when practitioner clicks empty grid space
                  after availability is loaded — directs them to click a slot. */}
              {clickHint && clickHint.key === day.toISOString() && !availLoading && (
                <div
                  className="absolute z-40 pointer-events-none animate-in fade-in duration-150"
                  style={{
                    left: Math.min(Math.max(clickHint.x, 8), 240),
                    top: clickHint.y + 8,
                  }}
                >
                  <div className="bg-gray-900 text-white text-[10.5px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    {locale === 'fr'
                      ? 'Cliquez sur un créneau disponible'
                      : 'Click an available slot to schedule'}
                  </div>
                </div>
              )}

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

              {/* Available slots — teal pill for in-hours (always shown).
                  After-hours pills are always in the DOM but invisible
                  outside the hovered day, fading in/out smoothly via CSS
                  opacity — no flickery mount/unmount. Both go through
                  calendar-mode submit (Google Calendar sync intact);
                  after-hours clicks carry an outsideHours flag so the modal
                  skips the (now redundant) datetime picker step. */}
              {showAvailability && (availSlots[format(day, 'yyyy-MM-dd')] || []).map((slot, si) => {
                const startH = getHoursInTz(slot.start)
                const endH = getHoursInTz(slot.end)
                const slotTop = (startH - START_HOUR) * HOUR_HEIGHT
                const fullHeight = Math.max((endH - startH) * HOUR_HEIGHT, 24)
                const isHovered = hoveredSlot === slot.start
                const isOutside = slot.outside
                const isDayHovered = hoveredDay === day.toISOString()
                // After-hours pills: invisible (and non-interactive) unless
                // this day is hovered. Inside-hours pills are always
                // visible/interactive.
                const outsideHidden = isOutside && !isDayHovered
                return (
                  <div
                    key={`slot-${si}`}
                    data-event
                    title={isOutside ? (locale === 'fr' ? 'Hors horaires' : 'After-hours') : undefined}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!onSlotClick) return
                      const d = new Date(slot.start)
                      const tz = practitionerTz || 'UTC'
                      const h = parseInt(d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
                      const m = d.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' })
                      const time = `${String(h === 24 ? 0 : h).padStart(2, '0')}:${m.padStart(2, '0')}`
                      onSlotClick(day, time, isOutside ? { outsideHours: true } : undefined)
                    }}
                    onMouseEnter={() => setHoveredSlot(slot.start)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={`absolute left-1 right-1 rounded-lg overflow-hidden transition-opacity duration-200 ${
                      outsideHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
                    } ${
                      isOutside
                        ? isHovered
                          ? 'bg-gray-700 border border-gray-700 shadow-lg text-white z-[8]'
                          : 'bg-white border border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-500 z-[5]'
                        : isHovered
                          ? 'bg-teal-500 border border-teal-600 shadow-lg text-white z-[8]'
                          : 'bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 z-[5]'
                    }`}
                    style={{
                      top: slotTop + 1,
                      height: isHovered ? fullHeight - 2 : 24,
                      transitionDuration: '200ms',
                    }}
                  >
                    <div className="flex items-center gap-1 px-2 h-full">
                      {isOutside && <Clock className={`w-2.5 h-2.5 shrink-0 ${isHovered ? 'text-white' : 'text-gray-400'}`} />}
                      <span className={`text-[10px] font-semibold truncate ${
                        isOutside
                          ? isHovered ? 'text-white' : 'text-gray-500'
                          : isHovered ? 'text-white' : 'text-teal-700'
                      }`}>
                        {formatTimeInTz(slot.start)} → {formatTimeInTz(slot.end)}
                      </span>
                    </div>
                    {isHovered && (
                      <div className="px-2 pb-1">
                        <span className={`text-[10px] ${isOutside ? 'text-gray-300' : 'text-teal-100'}`}>
                          {isOutside ? (locale === 'fr' ? '60 min · hors horaires' : '60 min · after-hours') : '60 min'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

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
                  <div key={event.id} data-event>
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
                              // Deeper teal so completed reads as "done well" rather
                              // than washed-out / cancelled. Same hue family as
                              // confirmed (bg-teal-50) so the calendar stays in one
                              // visual key.
                              ? `bg-teal-100 border-teal-300 text-teal-800 ${isSelected ? 'ring-teal-400' : ''}`
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
                          className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-64 overflow-hidden"
                          style={{ top: top + Math.min(height, 40), left: `calc(${left} + 4px)` }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Header — name + view profile */}
                          <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="font-semibold text-gray-900 text-sm leading-tight flex-1 break-words">{event.title}</p>
                              {event.memberId && (
                                <Link
                                  href={`/members/${event.memberId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-0.5 text-[11px] text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap shrink-0 mt-0.5"
                                >
                                  {locale === 'fr' ? 'Profil' : 'Profile'}
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatTimeInTz(event.start)} – {formatTimeInTz(event.end)}
                            </p>
                          </div>

                          {/* Body */}
                          <div className="px-4 py-3 space-y-2.5">
                            {/* Status pills — 'confirmed' is the default
                                state and rendering it as a pill is redundant
                                with "Completed", so only show pending and
                                exceptional statuses. */}
                            {(event.status || event.sessionType || (event.source === 'booking' && event.bookingId)) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {event.status && event.status !== 'confirmed' && (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    isPending ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {event.status === 'pending' ? (locale === 'fr' ? 'En attente' : 'Pending')
                                      : event.status}
                                  </span>
                                )}
                                {event.source === 'booking' && event.bookingId && (
                                  <PaymentBadge
                                    status={event.paymentStatus || 'unpaid'}
                                    table="bookings"
                                    recordId={event.bookingId}
                                  />
                                )}
                                {event.sessionType && (
                                  <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                                    {event.sessionType.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Email */}
                            {event.email && (
                              <p className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{event.email}</span>
                              </p>
                            )}

                            {/* Meet link — primary action */}
                            {event.meetLink && (
                              <a
                                href={event.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                              >
                                <Video className="w-3.5 h-3.5" />
                                {locale === 'fr' ? 'Rejoindre Google Meet' : 'Join Google Meet'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {/* Google source tag */}
                            {isGoogle && (
                              <p className="text-[10px] text-blue-500">Google Calendar</p>
                            )}

                            {/* Session notes — opens the floating editor.
                                Label flips between "View notes" and "Take
                                notes" based on whether a session_summary
                                note already exists for this booking. */}
                            {event.source === 'booking' && event.bookingId && event.memberId && onTakeNotes && (() => {
                              const minute = Math.floor(new Date(event.start).getTime() / 60000)
                              const hasNote = bookingsWithNotes?.has(`${event.memberId}::${minute}`) ?? false
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onTakeNotes(event.bookingId!); setSelectedEvent(null) }}
                                  className={`flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                    hasNote
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  {hasNote
                                    ? (locale === 'fr' ? 'Voir les notes' : 'View notes')
                                    : (locale === 'fr' ? 'Prendre des notes' : 'Take notes')}
                                </button>
                              )
                            })()}

                            {/* Notes */}
                            {event.notes && (
                              <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2.5">{event.notes}</p>
                            )}
                          </div>

                          {/* Footer — actions */}
                          {isPending && onApprove && onReject && (
                            <div className="px-4 pb-3 pt-1 flex gap-2 border-t border-gray-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); onApprove(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 mt-2"
                              >
                                {processingId === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {locale === 'fr' ? 'Accepter' : 'Approve'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onReject(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 mt-2"
                              >
                                <X className="w-3 h-3" />
                                {locale === 'fr' ? 'Refuser' : 'Reject'}
                              </button>
                            </div>
                          )}

                          {event.status === 'confirmed' && event.source === 'booking' && onReject && (
                            <div className="px-4 pb-3 pt-2 border-t border-gray-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); onReject(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="w-full flex items-center justify-center gap-1 px-2 py-2 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
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

    </div>
  )
}
