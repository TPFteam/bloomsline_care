'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronRight, Check } from 'lucide-react'

interface TimePickerProps {
  value: string // "HH:mm" format
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({
  value,
  onChange,
  className = '',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState(() => {
    const [h] = value.split(':')
    return parseInt(h, 10)
  })
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const [, m] = value.split(':')
    return parseInt(m, 10)
  })
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minuteScrollRef = useRef<HTMLDivElement>(null)

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update internal state when value prop changes
  useEffect(() => {
    const [h, m] = value.split(':')
    setSelectedHour(parseInt(h, 10))
    setSelectedMinute(parseInt(m, 10))
  }, [value])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 320

      const spaceBelow = viewportHeight - rect.bottom
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setDropdownPosition({
        top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen])

  // Scroll to selected values when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourScrollRef.current) {
          const selectedEl = hourScrollRef.current.querySelector('[data-selected="true"]')
          selectedEl?.scrollIntoView({ block: 'center', behavior: 'auto' })
        }
        if (minuteScrollRef.current) {
          const selectedEl = minuteScrollRef.current.querySelector('[data-selected="true"]')
          selectedEl?.scrollIntoView({ block: 'center', behavior: 'auto' })
        }
      }, 50)
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

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, '0')
    const m = minute.toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const formatDisplayTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const m = minute.toString().padStart(2, '0')
    return `${displayHour}:${m} ${period}`
  }

  const handleConfirm = () => {
    onChange(formatTime(selectedHour, selectedMinute))
    setIsOpen(false)
  }

  const handleCancel = () => {
    // Reset to original value
    const [h, m] = value.split(':')
    setSelectedHour(parseInt(h, 10))
    setSelectedMinute(parseInt(m, 10))
    setIsOpen(false)
  }

  // Time picker dropdown content
  const timeDropdown = isOpen && mounted ? createPortal(
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
          width: Math.max(dropdownPosition.width, 280),
          zIndex: 9999,
        }}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Select Time</p>
          <p className="text-lg font-semibold text-gray-900 mt-0.5">
            {formatDisplayTime(selectedHour, selectedMinute)}
          </p>
        </div>

        {/* Time selectors */}
        <div className="flex divide-x divide-gray-100">
          {/* Hours */}
          <div className="flex-1">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 text-center">Hour</p>
            </div>
            <div
              ref={hourScrollRef}
              className="h-48 overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.time-scroll::-webkit-scrollbar { display: none; }`}</style>
              {hours.map((hour) => {
                const isSelected = hour === selectedHour
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                const period = hour >= 12 ? 'PM' : 'AM'
                return (
                  <button
                    key={hour}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => setSelectedHour(hour)}
                    className={`w-full px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-mint-50 text-mint-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{displayHour} {period}</span>
                    {isSelected && <Check className="w-4 h-4 text-mint-600" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Minutes */}
          <div className="flex-1">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 text-center">Minute</p>
            </div>
            <div
              ref={minuteScrollRef}
              className="h-48 overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {minutes.map((minute) => {
                const isSelected = minute === selectedMinute
                return (
                  <button
                    key={minute}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => setSelectedMinute(minute)}
                    className={`w-full px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-mint-50 text-mint-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>:{minute.toString().padStart(2, '0')}</span>
                    {isSelected && <Check className="w-4 h-4 text-mint-600" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-mint-500 text-white text-sm font-medium rounded-lg hover:bg-mint-600 transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null

  return (
    <div className={className}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 text-base rounded-xl border border-gray-200 hover:border-gray-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 outline-none transition-all bg-white"
      >
        <Clock className="w-5 h-5 text-gray-400" />
        <span className="flex-1 text-left text-gray-700 font-medium">
          {formatDisplayTime(selectedHour, selectedMinute)}
        </span>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Time Dropdown - rendered via portal */}
      {timeDropdown}
    </div>
  )
}
