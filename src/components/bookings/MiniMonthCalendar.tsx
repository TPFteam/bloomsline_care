'use client'

// Google-Calendar-style mini month picker for the bookings calendar left rail.
// Clicking a day jumps the main week view to that day's week. The cells in the
// currently-shown week are highlighted; today is emphasised.

import { useEffect, useState } from 'react'
import { addMonths, startOfMonth, startOfWeek, addDays, isSameDay, isSameMonth, format } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MiniMonthCalendar({
  selectedWeekStart,
  onSelectDate,
  locale,
}: {
  selectedWeekStart: Date
  onSelectDate: (d: Date) => void
  locale: string
}) {
  const dl = locale === 'fr' ? frLocale : undefined
  const [month, setMonth] = useState(() => startOfMonth(selectedWeekStart))

  // Keep the displayed month in step with the week shown in the main view
  // (e.g. when the user navigates weeks with the calendar's ‹ › / Today).
  useEffect(() => {
    setMonth(startOfMonth(selectedWeekStart))
  }, [selectedWeekStart])

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const today = new Date()
  const weekEndExclusive = addDays(selectedWeekStart, 7)
  const weekdayLabels = locale === 'fr' ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold capitalize text-gray-800">
          {format(month, 'MMMM yyyy', { locale: dl })}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekdayLabels.map((d, i) => (
          <span key={i} className="py-1 text-[10px] font-medium text-gray-400">
            {d}
          </span>
        ))}
        {days.map((d, i) => {
          const inWeek = d >= selectedWeekStart && d < weekEndExclusive
          const isToday = isSameDay(d, today)
          const outside = !isSameMonth(d, month)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`flex h-7 items-center justify-center rounded-md text-[11px] transition-colors hover:bg-teal-100 ${
                inWeek ? 'bg-teal-50' : ''
              } ${
                isToday
                  ? 'font-bold text-teal-700'
                  : outside
                    ? 'text-gray-300'
                    : 'text-gray-700'
              }`}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
