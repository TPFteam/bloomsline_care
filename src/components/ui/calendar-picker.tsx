'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { fr, es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface CalendarPickerProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disabledDaysOfWeek?: number[]
  className?: string
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDaysOfWeek,
  className = '',
}: CalendarPickerProps) {
  const { locale } = useLanguage()
  const dateFnsLocale = locale === 'fr' ? fr : locale === 'es' ? es : undefined
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate))
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keep the displayed month in sync when selectedDate changes externally
  // (e.g. auto-advance when format changes disables the current day)
  useEffect(() => {
    setCurrentMonth(startOfMonth(selectedDate))
  }, [selectedDate])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 380

      const spaceBelow = viewportHeight - rect.bottom
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setDropdownPosition({
        top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Get calendar days including padding from prev/next months
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    if (disabledDaysOfWeek && disabledDaysOfWeek.includes(date.getDay())) return true
    return false
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return
    onDateSelect(date)
    setIsOpen(false)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(startOfMonth(new Date()))
    onDateSelect(new Date())
    setIsOpen(false)
  }

  // Calendar dropdown content
  const calendarDropdown = isOpen && mounted ? createPortal(
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: Math.max(dropdownPosition.width, 320),
          zIndex: 9999,
        }}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: dateFnsLocale })}
          </h3>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)
            const isPastDate = isPast(day) && !isTodayDate
            const disabled = isDateDisabled(day)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={`
                  relative w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${isCurrentMonth && !isSelected && !disabled ? 'hover:bg-gray-100' : ''}
                  ${isSelected ? 'bg-mint-500 text-white hover:bg-mint-600' : ''}
                  ${isTodayDate && !isSelected ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}
                  ${isPastDate && isCurrentMonth && !isSelected ? 'text-amber-600' : ''}
                  ${isCurrentMonth && !isSelected && !isTodayDate && !isPastDate ? 'text-gray-700' : ''}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="text-sm font-medium text-mint-600 hover:text-mint-700 transition-colors"
          >
            Today
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null

  return (
    <div ref={containerRef} className={className}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-gray-200 hover:border-gray-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 outline-none transition-all bg-white"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-left text-gray-700">
          {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateFnsLocale })}
        </span>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Calendar Dropdown - rendered via portal */}
      {calendarDropdown}
    </div>
  )
}
