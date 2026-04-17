'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, Video, Building2 } from 'lucide-react'

interface SlotCalendarViewProps {
  userId: string
  sessionDuration: number // minutes
  selectedFormat: 'in_person' | 'video' | null
  disabledDaysOfWeek: number[]
  practitionerTz: string | null
  dayFormats: Record<string, string[]>
  locale: string
  onSelectSlot: (date: Date, time: string) => void
}

interface TimeSlot {
  slot_start: string
  slot_end: string
}

const HOUR_HEIGHT = 56
const START_HOUR = 7
const END_HOUR = 21
const TOTAL_HOURS = END_HOUR - START_HOUR

export function SlotCalendarView({
  userId,
  sessionDuration,
  selectedFormat,
  disabledDaysOfWeek,
  practitionerTz,
  dayFormats,
  locale,
  onSelectSlot,
}: SlotCalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weekSlots, setWeekSlots] = useState<Record<string, TimeSlot[]>>({})
  const [weekBookings, setWeekBookings] = useState<Array<{ start: string; end: string; title: string; source: string }>>([])
  const [loading, setLoading] = useState(false)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getHoursInTz = (isoStr: string): number => {
    const d = new Date(isoStr)
    const h = parseInt(d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
    const m = parseInt(d.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' }))
    return (h === 24 ? 0 : h) + m / 60
  }

  const formatTimeInTz = (isoStr: string): string => {
    const d = new Date(isoStr)
    return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr',
    })
  }

  const isSameDayInTz = (isoStr: string, day: Date): boolean => {
    const d = new Date(isoStr)
    const eventDate = d.toLocaleDateString('en-CA', { timeZone: tz })
    const dayDate = format(day, 'yyyy-MM-dd')
    return eventDate === dayDate
  }

  // Fetch available slots + existing bookings for the visible week
  const fetchWeekData = useCallback(async () => {
    setLoading(true)
    const formatParam = selectedFormat ? `&format=${selectedFormat}` : ''

    // Build candidate dates (only non-disabled days)
    const candidates: { dateStr: string; day: Date }[] = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      if (disabledDaysOfWeek.includes(day.getDay())) continue
      // Skip past days
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (day < today) continue
      const dateStr = format(day, 'yyyy-MM-dd')
      candidates.push({ dateStr, day })
    }

    // Fetch available slots for all candidate days in parallel
    const slotResults = await Promise.all(
      candidates.map(({ dateStr }) =>
        fetch(`/api/bookings/available-slots?practitionerId=${userId}&date=${dateStr}&duration=${sessionDuration}&skipNotice=true${formatParam}`)
          .then(r => r.json())
          .then(data => ({ dateStr, slots: (data.slots || []) as TimeSlot[] }))
          .catch(() => ({ dateStr, slots: [] as TimeSlot[] }))
      )
    )

    const slotsMap: Record<string, TimeSlot[]> = {}
    for (const { dateStr, slots } of slotResults) {
      slotsMap[dateStr] = slots
    }
    setWeekSlots(slotsMap)

    // Fetch existing bookings for the week (for occupied block display)
    try {
      const start = weekStart.toISOString()
      const end = addDays(weekStart, 7).toISOString()
      const { createClient } = await import('@/lib/supabase/browser-client')
      const supabase = createClient()
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time, client_name')
        .eq('practitioner_id', userId)
        .gte('start_time', start)
        .lte('start_time', end)
        .neq('status', 'cancelled')

      setWeekBookings(
        (bookings || []).map(b => ({ start: b.start_time, end: b.end_time, title: b.client_name, source: 'booking' }))
      )
    } catch {
      setWeekBookings([])
    }

    setLoading(false)
  }, [weekStart, userId, sessionDuration, selectedFormat, disabledDaysOfWeek])

  useEffect(() => { fetchWeekData() }, [fetchWeekData])

  const getBlockPosition = (startIso: string, endIso: string) => {
    const startHour = getHoursInTz(startIso)
    const endHour = getHoursInTz(endIso)
    return {
      top: (startHour - START_HOUR) * HOUR_HEIGHT,
      height: Math.max((endHour - startHour) * HOUR_HEIGHT, 20),
    }
  }

  const todayCheck = (day: Date) => isSameDay(day, new Date())

  const handleSlotClick = (slot: TimeSlot, day: Date) => {
    const slotDate = new Date(slot.slot_start)
    const h = parseInt(slotDate.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
    const m = slotDate.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' })
    const timeStr = `${String(h === 24 ? 0 : h).padStart(2, '0')}:${m.padStart(2, '0')}`
    onSelectSlot(day, timeStr)
  }

  // Can't go before current week
  const canGoPrev = weekStart > startOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => canGoPrev && setWeekStart(prev => addDays(prev, -7))}
            disabled={!canGoPrev}
            className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-sm font-semibold text-gray-800">
            {format(weekStart, locale === 'fr' ? 'd MMM' : 'MMM d')} — {format(addDays(weekStart, 6), locale === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy')}
          </h3>
          <button onClick={() => setWeekStart(prev => addDays(prev, 7))} className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors">
            {locale === 'fr' ? "Aujourd'hui" : 'Today'}
          </button>
          {practitionerTz && (
            <span className="text-[11px] text-gray-400 ml-1">({tz.replace(/_/g, ' ').split('/').pop()})</span>
          )}
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-teal-500" />}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-teal-200 border border-teal-300" />
            {locale === 'fr' ? 'Disponible' : 'Available'}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-200 border border-gray-300" />
            {locale === 'fr' ? 'Occupé' : 'Occupied'}
          </span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-100">
        <div />
        {days.map(day => {
          const disabled = disabledDaysOfWeek.includes(day.getDay())
          const fmts = dayFormats[String(day.getDay())]
          return (
            <div key={day.toISOString()} className={`py-2 text-center ${disabled ? 'opacity-30' : ''}`}>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{format(day, 'EEE')}</p>
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center ${todayCheck(day) ? 'bg-teal-600 text-white' : 'text-gray-800'}`}>
                <span className="text-xs font-semibold">{format(day, 'd')}</span>
              </div>
              {fmts && !disabled && (
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {fmts.includes('video') && <Video className="w-2.5 h-2.5 text-blue-400" />}
                  {fmts.includes('in_person') && <Building2 className="w-2.5 h-2.5 text-amber-400" />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] overflow-y-auto" style={{ maxHeight: '65vh' }}>
        {/* Time labels */}
        <div>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div key={i} className="flex items-start justify-end pr-2 pt-0.5" style={{ height: HOUR_HEIGHT }}>
              <span className="text-[10px] text-gray-300 font-medium">
                {format(new Date(2000, 0, 1, START_HOUR + i), locale === 'fr' ? 'HH:mm' : 'h a')}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const disabled = disabledDaysOfWeek.includes(day.getDay())
          const slots = weekSlots[dateStr] || []
          const dayBookings = weekBookings.filter(b => isSameDayInTz(b.start, day))
          const today = todayCheck(day)

          return (
            <div key={day.toISOString()} className={`relative border-l border-gray-50 ${disabled ? 'bg-gray-50/50' : ''} ${today ? 'bg-teal-50/10' : ''}`}>
              {/* Hour grid lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
              ))}

              {/* Now line */}
              {today && (() => {
                const h = getHoursInTz(new Date().toISOString())
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

              {/* Existing bookings (occupied blocks) */}
              {dayBookings.map((b, i) => {
                const { top, height } = getBlockPosition(b.start, b.end)
                return (
                  <div
                    key={`booking-${i}`}
                    className="absolute left-1 right-1 rounded-lg bg-gray-100 border border-gray-200 px-2 py-1 overflow-hidden z-10"
                    style={{ top, height: Math.max(height, 22) }}
                  >
                    <p className="text-[10px] font-medium text-gray-500 truncate">{b.title}</p>
                    {height > 28 && <p className="text-[9px] text-gray-400">{formatTimeInTz(b.start)}</p>}
                  </div>
                )
              })}

              {/* Available slots — expand to full duration on hover */}
              {!disabled && slots.map(slot => {
                const startHour = getHoursInTz(slot.slot_start)
                const endHour = getHoursInTz(slot.slot_end)
                const top = (startHour - START_HOUR) * HOUR_HEIGHT
                const fullHeight = Math.max((endHour - startHour) * HOUR_HEIGHT, 24)
                const isHovered = hoveredSlot === slot.slot_start
                return (
                  <div
                    key={slot.slot_start}
                    onClick={() => handleSlotClick(slot, day)}
                    onMouseEnter={() => setHoveredSlot(slot.slot_start)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={`absolute left-1 right-1 rounded-lg border cursor-pointer z-20 px-2 overflow-hidden ${
                      isHovered
                        ? 'bg-teal-500 border-teal-600 shadow-lg text-white z-30'
                        : 'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-700'
                    }`}
                    style={{
                      top: top + 1,
                      height: isHovered ? fullHeight - 2 : 24,
                      transition: 'height 0.15s ease-out, background-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div className="flex items-center gap-1 h-6">
                      <p className="text-[10px] font-semibold whitespace-nowrap">
                        {formatTimeInTz(slot.slot_start)}
                      </p>
                      <p className={`text-[9px] whitespace-nowrap ${isHovered ? 'text-teal-100' : 'text-teal-400'}`}>
                        → {formatTimeInTz(slot.slot_end)}
                      </p>
                    </div>
                    {isHovered && fullHeight > 40 && (
                      <p className="text-[10px] text-teal-100 mt-0.5">{sessionDuration} min</p>
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
