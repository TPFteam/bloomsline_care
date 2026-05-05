'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { analytics } from '@/lib/analytics/events'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Clock, Users, Check, ChevronRight, ArrowLeft, Calendar, Building2, Video, Settings, Loader2, Info, Maximize2, AlertCircle } from 'lucide-react'
import { SlotCalendarView } from '@/components/bookings/SlotCalendarView'
import { CalendarPicker } from '@/components/ui/calendar-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { notifySessionScheduled } from '@/lib/notifications'
import { format, startOfDay } from 'date-fns'
import { fr as frLocale, es as esLocale } from 'date-fns/locale'
import { useLanguage } from '@/lib/i18n/context'
import type { Member } from '@/types/member'

interface SessionType {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

interface TimeSlot {
  slot_start: string
  slot_end: string
}

interface RescheduleBooking {
  id: string
  practitioner_id: string
  member_id: string | null
  client_name: string
  client_email: string
  session_type: string
  session_format?: string
  start_time: string
  end_time: string
}

interface ScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedMember?: Member | null
  rescheduleBooking?: RescheduleBooking | null
  preselectedDate?: Date
  preselectedTime?: string
}

type Step = 'member' | 'session' | 'format' | 'datetime' | 'confirm'
type ScheduleMode = 'calendar' | 'manual'

export function ScheduleSessionModal({ isOpen, onClose, onSuccess, preselectedMember, rescheduleBooking: rescheduleData, preselectedDate, preselectedTime }: ScheduleSessionModalProps) {
  const { locale } = useLanguage()
  const router = useRouter()
  const [step, setStep] = useState<Step>(preselectedMember ? 'session' : 'member')
  const [members, setMembers] = useState<Member[]>([])
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [dayBookings, setDayBookings] = useState<Array<{ id: string; start_time: string; end_time: string; client_name: string; session_format?: string; member_id?: string; google_event_id?: string | null; _mismatch?: boolean }>>([])

  const [loading, setLoading] = useState(false)
  const [selectedSessionFormat, setSelectedSessionFormat] = useState<'in_person' | 'video' | null>(null)
  const [availSessionFormats, setAvailSessionFormats] = useState<string[]>(['in_person', 'video'])
  const [searchQuery, setSearchQuery] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [showSlotCalendar, setShowSlotCalendar] = useState(false)
  const keepTimeRef = useRef(false)

  // Selected values
  const [selectedMember, setSelectedMember] = useState<Member | null>(preselectedMember || null)
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  // Manual scheduling (without calendar)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('calendar')
  const [manualSessionType, setManualSessionType] = useState<string>('')
  const [manualDuration, setManualDuration] = useState(60)
  const [manualTime, setManualTime] = useState('10:00')
  const [use24Hour, setUse24Hour] = useState(locale === 'fr')
  const [hasExternalBooking, setHasExternalBooking] = useState(false)
  const [practitionerTz, setPractitionerTz] = useState<string | null>(null)
  const [browserTz, setBrowserTz] = useState<string | null>(null)
  useEffect(() => {
    setBrowserTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])
  const [baseDisabledDays, setBaseDisabledDays] = useState<number[]>([])
  const [scheduleDayFormats, setScheduleDayFormats] = useState<Record<string, string[]>>({})
  const [dateViewMode, setDateViewMode] = useState<'calendar' | 'quick'>('calendar')

  // Compute disabled days based on format selection
  const disabledDaysOfWeek = useMemo(() => {
    if (!selectedSessionFormat) return baseDisabledDays
    const disabled: number[] = []
    for (let d = 0; d < 7; d++) {
      if (baseDisabledDays.includes(d)) { disabled.push(d); continue }
      const fmts = scheduleDayFormats[String(d)]
      if (!fmts || !fmts.includes(selectedSessionFormat)) disabled.push(d)
    }
    return disabled
  }, [baseDisabledDays, selectedSessionFormat, scheduleDayFormats])

  // Auto-advance selectedDate if the current day is disabled for the chosen format
  // (e.g. user picks "In person" on a Thursday when Thursdays are Video-only → jump to next Monday)
  useEffect(() => {
    if (disabledDaysOfWeek.length === 0 || disabledDaysOfWeek.length >= 7) return
    if (!disabledDaysOfWeek.includes(selectedDate.getDay())) return
    // Scan forward up to 14 days for the first enabled day
    for (let offset = 1; offset <= 14; offset++) {
      const candidate = new Date(selectedDate)
      candidate.setDate(candidate.getDate() + offset)
      if (!disabledDaysOfWeek.includes(candidate.getDay())) {
        setSelectedDate(startOfDay(candidate))
        setSelectedTime(null)
        return
      }
    }
  }, [disabledDaysOfWeek, selectedDate])
  const [quickDays, setQuickDays] = useState<{ date: string; dayLabel: string; slots: { slot_start: string; slot_end: string }[] }[]>([])
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickExpandedDate, setQuickExpandedDate] = useState<string | null>(null)

  const dayNameToNumber: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  }

  // Session type options for manual mode (must match database enum)
  const sessionTypeOptions = [
    { value: 'initial_consultation', label: 'Initial Consultation', labelFr: 'Consultation initiale', labelEs: 'Consulta inicial' },
    { value: 'follow_up', label: 'Follow-up', labelFr: 'Suivi', labelEs: 'Seguimiento' },
    { value: 'check_in', label: 'Check-in', labelFr: 'Point de situation', labelEs: 'Revisión' },
    { value: 'crisis', label: 'Crisis Intervention', labelFr: 'Intervention de crise', labelEs: 'Intervención de crisis' },
    { value: 'group', label: 'Group Session', labelFr: 'Séance de groupe', labelEs: 'Sesión grupal' },
    { value: 'other', label: 'Other', labelFr: 'Autre', labelEs: 'Otro' },
  ]

  const lockedNameFr: Record<string, string> = { initial: 'Consultation initiale', follow_up: 'Séance de suivi', check_in: 'Point de situation' }

  const getLocaleName = (type: { id: string; name: string }) => {
    return locale === 'fr' && lockedNameFr[type.id] ? lockedNameFr[type.id] : type.name
  }

  const getSessionTypeLabel = (value: string) => {
    // First check the practitioner's DB session types (their custom names)
    const dbType = sessionTypes.find(t => t.id === value)
    if (dbType) return getLocaleName(dbType)
    // Fallback to hardcoded options
    return sessionTypeOptions.find(opt => opt.value === value)?.label || value
  }

  // Map a practitioner's custom session-type id (from booking_settings JSON)
  // to a valid sessions.session_type enum value. The DB enum only accepts:
  // initial_consultation, follow_up, check_in, crisis, group, other.
  const VALID_SESSION_ENUMS = new Set(['initial_consultation', 'follow_up', 'check_in', 'crisis', 'group', 'other'])
  const ID_TO_ENUM: Record<string, string> = { initial: 'initial_consultation' }
  const toSessionEnum = (id: string): string => {
    if (VALID_SESSION_ENUMS.has(id)) return id
    return ID_TO_ENUM[id] || 'other'
  }

  const supabase = createClient()

  const isReschedule = !!rescheduleData

  // Fetch members and session types on open — and reset all state so a
  // reopened modal never inherits values from a previously-closed attempt.
  useEffect(() => {
    if (isOpen) {
      // Reset selections to a clean slate
      if (rescheduleData) {
        // Reschedule mode: start at session step with pre-filled data
        // so practitioner can change type/format if needed
        setStep('session')
        setSelectedMember(null)
        setSelectedSessionType(null) // will be set after fetchInitialData
        setSelectedSessionFormat(
          rescheduleData.session_format === 'in_person' ? 'in_person'
          : rescheduleData.session_format === 'video' || rescheduleData.session_format === 'virtual' ? 'video'
          : null
        )
        setSelectedDate(startOfDay(new Date()))
        setSelectedTime(null)
        setNotes('')
        setScheduleMode('calendar')
      } else {
        setStep(preselectedMember ? 'session' : 'member')
        setSelectedMember(preselectedMember || null)
        setSelectedSessionType(null)
        setSelectedSessionFormat(null)
        setSelectedDate(preselectedDate ? startOfDay(preselectedDate) : startOfDay(new Date()))
        setSelectedTime(preselectedTime || null)
        if (preselectedTime) keepTimeRef.current = true
        setNotes('')
        setScheduleMode(hasExternalBooking ? 'manual' : 'calendar')
        setManualSessionType('')
        setManualDuration(60)
        setManualTime(preselectedTime || '10:00')
      }
      setSearchQuery('')
      setAvailableSlots([])
      setDayBookings([])
      setQuickDays([])
      setQuickExpandedDate(null)
      setQuickLoading(false)
      setDateViewMode('calendar')
      setShowSlotCalendar(false)
      fetchInitialData()
    }
  }, [isOpen, preselectedMember, rescheduleData])

  // In reschedule mode, auto-select the session type once session types load
  useEffect(() => {
    if (rescheduleData && sessionTypes.length > 0 && !selectedSessionType) {
      const match = sessionTypes.find(t => t.id === rescheduleData.session_type)
      if (match) setSelectedSessionType(match)
      else if (sessionTypes[0]) setSelectedSessionType(sessionTypes[0])
    }
  }, [rescheduleData, sessionTypes, selectedSessionType])

  // Fetch available slots when date or session type changes
  useEffect(() => {
    if (selectedDate && selectedSessionType && userId) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedSessionType, userId])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Fetch members
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('practitioner_id', user.id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('first_name')

      if (membersData) {
        setMembers(membersData)
      }

      // Fetch booking settings
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settings?.session_types) {
        setSessionTypes(settings.session_types as SessionType[])
      }
      // Fetch available days of week
      const { data: availDays } = await supabase
        .from('availability_schedules')
        .select('day_of_week, session_format')
        .eq('user_id', user.id)
        .eq('is_active', true)
      if (availDays) {
        const activeDays = new Set(availDays.map((d: any) => dayNameToNumber[d.day_of_week]))
        const disabled = [0, 1, 2, 3, 4, 5, 6].filter(d => !activeDays.has(d))
        setBaseDisabledDays(disabled)
        // Build day format map + available formats
        const fmts = new Set<string>()
        const dfMap: Record<string, string[]> = {}
        for (const d of availDays) {
          const dayNum = String(dayNameToNumber[(d as any).day_of_week])
          const fmt = (d as any).session_format || 'both'
          if (!dfMap[dayNum]) dfMap[dayNum] = []
          if (fmt === 'both') {
            if (!dfMap[dayNum].includes('in_person')) dfMap[dayNum].push('in_person')
            if (!dfMap[dayNum].includes('video')) dfMap[dayNum].push('video')
            fmts.add('in_person'); fmts.add('video')
          } else {
            if (!dfMap[dayNum].includes(fmt)) dfMap[dayNum].push(fmt)
            fmts.add(fmt)
          }
        }
        setScheduleDayFormats(dfMap)
        setAvailSessionFormats([...fmts])
      }

      // Check if external booking is enabled (field is non-null, including empty string)
      const extUrl = (settings as Record<string, unknown>)?.external_booking_url
      const isExternal = extUrl !== null && extUrl !== undefined
      setHasExternalBooking(isExternal)
      // Only set default schedule mode if user hasn't already advanced past the session step
      setScheduleMode(prev => {
        // If user already toggled to manual, keep it
        if (prev === 'manual') return 'manual'
        return isExternal ? 'manual' : 'calendar'
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!userId || !selectedSessionType) return

    setAvailableSlots([])
    setDayBookings([])
    // Preserve selectedTime if it was set from slot calendar or preselected
    const shouldKeepTime = keepTimeRef.current
    keepTimeRef.current = false
    if (!shouldKeepTime) {
      setSelectedTime(null)
    }
    setSlotsLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      // Fetch available slots + existing bookings for the day in parallel
      const [slotsRes, bookingsRes] = await Promise.all([
        fetch(`/api/bookings/available-slots?practitionerId=${userId}&date=${dateStr}&duration=${selectedSessionType.duration}&skipNotice=true${selectedSessionFormat ? `&format=${selectedSessionFormat}` : ''}`)
          .then(r => r.json()),
        // Use timezone-aware boundaries so we only get bookings for the
        // selected day in the practitioner's timezone, not UTC.
        (async () => {
          const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
          // Convert local day boundaries to UTC using Intl
          const refNoon = Date.UTC(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(5, 7)) - 1, parseInt(dateStr.slice(8, 10)), 12, 0, 0)
          const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(refNoon))
          const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
          const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'))
          const offsetMs = localMs - refNoon
          const dayStartUtc = new Date(Date.UTC(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(5, 7)) - 1, parseInt(dateStr.slice(8, 10)), 0, 0, 0) - offsetMs).toISOString()
          const dayEndUtc = new Date(Date.UTC(parseInt(dateStr.slice(0, 4)), parseInt(dateStr.slice(5, 7)) - 1, parseInt(dateStr.slice(8, 10)), 23, 59, 59) - offsetMs).toISOString()
          return supabase
            .from('bookings')
            .select('id, start_time, end_time, client_name, session_format, member_id, google_event_id')
            .eq('practitioner_id', userId)
            .gte('start_time', dayStartUtc)
            .lte('start_time', dayEndUtc)
            .neq('status', 'cancelled')
        })(),
      ])

      setAvailableSlots(slotsRes.slots || [])
      if (slotsRes.practitionerTimezone) setPractitionerTz(slotsRes.practitionerTimezone)

      // Check bookings with google_event_id for mismatches (deleted from Google)
      const dayBookingsData = bookingsRes.data || []
      const bookingsWithGoogleId = dayBookingsData.filter((b: any) => b.google_event_id)
      if (bookingsWithGoogleId.length > 0) {
        try {
          const mismatchRes = await fetch('/api/calendar/check-mismatches').then(r => r.json())
          const mismatchIds = new Set((mismatchRes.mismatches || []).map((m: any) => m.bookingId))
          for (const b of dayBookingsData) {
            if (mismatchIds.has(b.id)) (b as any)._mismatch = true
          }
        } catch { /* skip mismatch check if it fails */ }
      }
      setDayBookings(dayBookingsData)
    } catch (error) {
      console.error('[modal] Error fetching slots:', error)
      setAvailableSlots([])
      setDayBookings([])
    } finally {
      setSlotsLoading(false)
    }
  }

  // Load quick view
  useEffect(() => {
    if (dateViewMode !== 'quick' || !userId || !selectedSessionType) return
    setQuickLoading(true)
    fetch(`/api/bookings/next-available?practitionerId=${userId}&duration=${selectedSessionType.duration}&limit=6&skipNotice=true${selectedSessionFormat ? `&format=${selectedSessionFormat}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setQuickDays(data.days || [])
        if (data.practitionerTimezone) setPractitionerTz(data.practitionerTimezone)
        if (data.days?.length > 0) setQuickExpandedDate(data.days[0].date)
      })
      .catch(() => setQuickDays([]))
      .finally(() => setQuickLoading(false))
  }, [dateViewMode, userId, selectedSessionType])

  const handleBookSession = async () => {
    // Reschedule mode: call the reschedule API instead of creating fresh
    if (isReschedule && rescheduleData && selectedTime) {
      setLoading(true)
      try {
        const timeToUse = selectedTime
        const [hours, minutes] = timeToUse.split(':').map(Number)
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone

        function tzToUtc(dateTimeStr: string, timezone: string): Date {
          const refUtc = Date.UTC(parseInt(dateTimeStr.slice(0, 4)), parseInt(dateTimeStr.slice(5, 7)) - 1, parseInt(dateTimeStr.slice(8, 10)), parseInt(dateTimeStr.slice(11, 13)), parseInt(dateTimeStr.slice(14, 16)), 0)
          const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(refUtc))
          const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
          const tzMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'))
          const offsetMs = tzMs - refUtc
          return new Date(refUtc - offsetMs)
        }

        const localDateStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
        const startTime = tzToUtc(localDateStr, tz)
        const duration = selectedSessionType?.duration || Math.round((new Date(rescheduleData.end_time).getTime() - new Date(rescheduleData.start_time).getTime()) / 60000)
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

        const response = await fetch(`/api/bookings/${rescheduleData.id}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newSlotStart: startTime.toISOString(),
            newSlotEnd: endTime.toISOString(),
            reason: notes || undefined,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to reschedule')

        toast.success(locale === 'fr' ? 'Séance reprogrammée' : 'Session rescheduled')
        onSuccess?.()
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reschedule')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!selectedMember || !userId) return

    // For calendar mode, require selectedSessionType and selectedTime
    if (scheduleMode === 'calendar' && (!selectedSessionType || !selectedTime)) return

    // For manual mode, require manualSessionType and manualTime
    if (scheduleMode === 'manual' && (!manualSessionType || !manualTime)) return

    setLoading(true)
    try {
      // Defensive auth check: verify the session is still valid before attempting the insert
      // If the token expired silently, this catches it before we hit a confusing "Failed to schedule" error
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        // Try a refresh once
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        if (!refreshed) {
          toast.error(locale === 'fr'
            ? 'Votre session a expiré. Veuillez vous reconnecter.'
            : 'Your session has expired. Please sign in again.')
          setLoading(false)
          // Trigger the SessionGuard popup by signing out cleanly
          await supabase.auth.signOut()
          return
        }
      }

      const timeToUse = scheduleMode === 'manual' ? manualTime : selectedTime!
      const durationToUse = scheduleMode === 'manual' ? manualDuration : selectedSessionType!.duration

      // Parse the selected time in the practitioner's timezone (not browser timezone)
      const [hours, minutes] = timeToUse.split(':').map(Number)
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone

      // Build a date string in the practitioner's timezone and convert to UTC
      // Create the datetime as if in practitioner's timezone
      const localDateStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

      // Get the UTC offset for the practitioner's timezone on this date
      function tzToUtc(dateTimeStr: string, timezone: string): Date {
        // Parse as local, then find the offset by comparing with Intl formatting
        const refUtc = Date.UTC(
          parseInt(dateTimeStr.slice(0, 4)),
          parseInt(dateTimeStr.slice(5, 7)) - 1,
          parseInt(dateTimeStr.slice(8, 10)),
          parseInt(dateTimeStr.slice(11, 13)),
          parseInt(dateTimeStr.slice(14, 16)),
          0
        )
        // Format refUtc in the target timezone to find the offset
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).formatToParts(new Date(refUtc))
        const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
        const tzMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'))
        const offsetMs = tzMs - refUtc // positive = timezone is ahead of UTC
        // The desired local time in this timezone = refUtc, so UTC = refUtc - offset
        return new Date(refUtc - offsetMs)
      }

      const startTime = tzToUtc(localDateStr, tz)
      const endTime = new Date(startTime.getTime() + durationToUse * 60 * 1000)

      // Backdated session: skip notifications and emails — the session already happened
      const isBackdated = startTime.getTime() < Date.now()

      if (scheduleMode === 'manual') {
        // Save to sessions table for member tracking. Format comes from the
        // step-3 picker (selectedSessionFormat) — same source as calendar mode.
        const sessionTypeLabel = getSessionTypeLabel(manualSessionType)
        // sessions table enum is 'in_person' | 'virtual'; bookings table uses 'video'
        const manualFormat: 'in_person' | 'virtual' = selectedSessionFormat === 'in_person' ? 'in_person' : 'virtual'
        const manualPrice = sessionTypes.find(st => st.id === manualSessionType)?.price ?? null
        const sessionData = {
          practitioner_id: userId,
          member_id: selectedMember.id,
          session_type: toSessionEnum(manualSessionType) as 'initial_consultation' | 'follow_up' | 'check_in' | 'crisis' | 'group' | 'other',
          session_format: manualFormat,
          scheduled_at: startTime.toISOString(),
          duration_minutes: durationToUse,
          status: 'scheduled',
          notes: notes ? `${sessionTypeLabel}\n\n${notes}` : sessionTypeLabel,
          price: manualPrice,
        }

        console.log('Creating session with data:', sessionData)

        const { data: sessionResult, error: sessionError } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select('id')
          .single()

        if (sessionError) {
          console.error('Supabase session error:', {
            code: sessionError.code,
            message: sessionError.message,
            details: sessionError.details,
            hint: sessionError.hint,
            sessionData,
          })
          throw new Error(sessionError.message || sessionError.details || 'Failed to create session')
        }

        // Also create a booking entry so it shows in the bookings page
        const bookingData = {
          practitioner_id: userId,
          client_name: `${selectedMember.first_name} ${selectedMember.last_name}`,
          client_email: selectedMember.email || '',
          client_phone: selectedMember.phone || null,
          session_type: sessionTypeLabel,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes: notes || null,
          status: 'confirmed',
          member_id: selectedMember.id,
          price: manualPrice,
        }

        const { error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingData)

        if (bookingError) {
          console.warn('Could not create booking entry:', bookingError)
          // Don't fail - session was created successfully
        }

        // Google Calendar sends its own invite via sendUpdates=all — no separate email needed

        toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name}`)
        analytics.sessionScheduled({ format: manualFormat, duration: manualDuration })
      } else {
        // Calendar mode: create booking first, then session (avoids orphan sessions)

        // 1. Create booking entry (source of truth)
        const bookingData = {
          practitioner_id: userId,
          client_name: `${selectedMember.first_name} ${selectedMember.last_name}`,
          client_email: selectedMember.email || '',
          client_phone: selectedMember.phone || null,
          session_type: selectedSessionType!.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes: notes || null,
          session_format: selectedSessionFormat === 'in_person' ? 'in_person' : 'video',
          status: 'confirmed',
          member_id: selectedMember.id,
          price: selectedSessionType!.price ?? null,
        }

        console.log('Creating booking with data:', bookingData)

        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select()
          .single()

        if (error) {
          console.error('Supabase error code:', error.code)
          console.error('Supabase error message:', error.message)
          console.error('Supabase error details:', error.details)
          console.error('Supabase error hint:', error.hint)
          throw new Error(error.message || 'Failed to create booking')
        }

        console.log('Booking created:', data)

        // 2. Create session entry (for member tracking — only after booking succeeds)
        try {
          await supabase.from('sessions').insert({
            practitioner_id: userId,
            member_id: selectedMember.id,
            session_type: toSessionEnum(selectedSessionType!.id) as 'initial_consultation' | 'follow_up' | 'check_in' | 'crisis' | 'group' | 'other',
            session_format: selectedSessionFormat === 'in_person' ? 'in_person' : 'virtual',
            scheduled_at: startTime.toISOString(),
            duration_minutes: durationToUse,
            status: 'scheduled',
            notes: notes ? `${selectedSessionType!.name}\n\n${notes}` : selectedSessionType!.name,
            price: selectedSessionType!.price ?? null,
          })
        } catch (sessionErr) {
          console.warn('Could not create session entry:', sessionErr)
        }

        // Sync to Google Calendar via API
        if (data?.id) {
          try {
            const syncResponse = await fetch(`/api/bookings/${data.id}/sync-calendar`, {
              method: 'POST',
            })

            if (syncResponse.ok) {
              const syncResult = await syncResponse.json()
              if (syncResult.calendarSynced) {
                toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name} and added to calendar`)
              } else {
                toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name}`)
                if (syncResult.calendarError) {
                  console.warn('Calendar sync warning:', syncResult.calendarError)
                }
              }
            } else {
              toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name}`)
            }
          } catch (syncError) {
            console.error('Calendar sync error:', syncError)
            toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name}`)
          }
        } else {
          toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name}`)
        }
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error booking session:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'

      // If the error looks like a JWT/auth failure, surface it as a session-expired message
      // and trigger the global SessionGuard popup via signOut
      const isAuthError =
        message.toLowerCase().includes('jwt') ||
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('invalid token') ||
        (error as { code?: string })?.code === 'PGRST301'

      if (isAuthError) {
        toast.error(locale === 'fr'
          ? 'Votre session a expiré. Veuillez vous reconnecter.'
          : 'Your session has expired. Please sign in again.')
        await supabase.auth.signOut()
      } else {
        toast.error(`Failed to schedule session: ${message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const goBack = () => {
    setShowSlotCalendar(false)
    if (step === 'session' && !preselectedMember) setStep('member')
    else if (step === 'format') setStep('session')
    else if (step === 'datetime') setStep('format')
    else if (step === 'confirm') setStep('datetime')
  }

  const canProceed = () => {
    if (step === 'member') return !!selectedMember
    if (step === 'session') {
      if (scheduleMode === 'manual') return !!manualSessionType && manualDuration > 0
      return !!selectedSessionType
    }
    if (step === 'format') return !!selectedSessionFormat
    if (step === 'datetime') {
      if (scheduleMode === 'manual') return !!manualTime
      return !!selectedTime
    }
    return true
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden transition-all duration-300 ${
            showSlotCalendar ? 'max-w-6xl' : 'max-w-lg'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {step !== 'member' && !(step === 'session' && preselectedMember) && (
                <button
                  onClick={goBack}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                {isReschedule
                  ? (locale === 'fr' ? 'Reprogrammer la séance' : 'Reschedule Session')
                  : (locale === 'fr' ? 'Planifier une séance' : locale === 'es' ? 'Programar sesión' : 'Schedule Session')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps — hidden when slot calendar is expanded */}
          {!showSlotCalendar && (
          <>
          {/* Progress Steps — hide the Member step from the indicator when a
              member is preselected, so the user sees the actual flow they'll go
              through (1 of 4) instead of a mysterious pre-checked step 1 of 5. */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-center">
              {(isReschedule
                ? ['session', 'format', 'datetime', 'confirm']
                : preselectedMember
                ? ['session', 'format', 'datetime', 'confirm']
                : ['member', 'session', 'format', 'datetime', 'confirm']
              ).map((s, index, arr) => {
                const currentIndex = arr.indexOf(step)
                return (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      step === s
                        ? 'bg-mint-500 text-white'
                        : currentIndex > index
                        ? 'bg-mint-100 text-mint-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentIndex > index ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < arr.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${
                        currentIndex > index
                          ? 'bg-mint-300'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                )
              })}
            </div>
          </div>
          </>
          )}

          {/* Content */}
          <div className={`p-6 overflow-y-auto scrollbar-minimal-light ${showSlotCalendar ? 'max-h-[80vh]' : 'max-h-[50vh]'}`}>
            {/* Manual mode banner — on non-session steps (session step renders it below the tab) */}
            {scheduleMode === 'manual' && step !== 'session' && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 mb-4">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {locale === 'fr'
                    ? 'Aucun email ne sera envoyé. Pas de synchronisation Google Agenda.'
                    : 'No emails will be sent. No Google Calendar sync.'}
                </span>
              </div>
            )}
            {/* Step 1: Select Member */}
            {step === 'member' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={locale === 'fr' ? 'Rechercher des patients...' : locale === 'es' ? 'Buscar miembros...' : 'Search members...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 outline-none transition-all"
                  />
                </div>

                {loading ? (
                  <div className="py-8 text-center text-gray-500">
                    {locale === 'fr' ? 'Chargement des patients...' : locale === 'es' ? 'Cargando miembros...' : 'Loading members...'}
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>{locale === 'fr' ? 'Aucun patient trouvé' : locale === 'es' ? 'No se encontraron miembros' : 'No members found'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selectedMember?.id === member.id
                            ? 'border-mint-500 bg-mint-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white font-medium">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.email && (
                            <p className="text-sm text-gray-500">{member.email}</p>
                          )}
                        </div>
                        {selectedMember?.id === member.id && (
                          <Check className="w-5 h-5 text-mint-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Session Type */}
            {step === 'session' && (
              <div className="space-y-4">
                {/* Mode Toggle — hide "From Calendar" entirely when external booking is active */}
                {sessionTypes.length > 0 && !hasExternalBooking && (<>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2 p-1 bg-gray-100 rounded-xl">
                      <button
                        onClick={() => setScheduleMode('calendar')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          scheduleMode === 'calendar'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {locale === 'fr' ? 'Depuis le calendrier' : locale === 'es' ? 'Desde el calendario' : 'From Calendar'}
                      </button>
                      <button
                        onClick={() => setScheduleMode('manual')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          scheduleMode === 'manual'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {locale === 'fr' ? 'Saisie manuelle' : locale === 'es' ? 'Entrada manual' : 'Manual Entry'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        onClose()
                        router.push('/bookings?tab=settings#session-types')
                      }}
                      className="p-2.5 rounded-xl text-gray-400 hover:text-teal-600 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 transition-colors"
                      title={locale === 'fr' ? 'Configurer les types de séance' : 'Configure session types'}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  {scheduleMode === 'manual' ? (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {locale === 'fr'
                          ? 'Aucun email ne sera envoyé. Pas de synchronisation Google Agenda.'
                          : 'No emails will be sent. No Google Calendar sync.'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 text-xs text-teal-700">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {locale === 'fr'
                          ? 'Un email de confirmation sera envoyé au patient et la séance sera ajoutée à Google Agenda.'
                          : 'A confirmation email will be sent to the patient and the session will be added to Google Calendar.'}
                      </span>
                    </div>
                  )}
                </>)}
                {hasExternalBooking && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 shrink-0" />
                    {locale === 'fr'
                      ? 'Le calendrier intégré n\'est pas disponible — vos réservations sont gérées par votre système externe.'
                      : 'Calendar booking is not available — your bookings are managed by your external system.'}
                  </div>
                )}

                {scheduleMode === 'calendar' && sessionTypes.length === 0 ? (
                  <div className="py-6 text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600 font-medium">
                      {locale === 'fr' ? 'Aucun type de séance configuré' : locale === 'es' ? 'No hay tipos de sesión configurados' : 'No session types configured'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 mb-4">
                      {locale === 'fr' ? 'Ajoutez des types de séance dans les paramètres' : locale === 'es' ? 'Agrega tipos de sesión en la configuración de reservas' : 'Add session types in Bookings Settings'}
                    </p>
                    <button
                      onClick={() => setScheduleMode('manual')}
                      className="px-4 py-2.5 bg-mint-50 text-mint-700 font-medium rounded-xl hover:bg-mint-100 transition-colors"
                    >
                      {locale === 'fr' ? 'Continuer sans calendrier' : locale === 'es' ? 'Continuar sin calendario' : 'Continue without calendar'}
                    </button>
                  </div>
                ) : scheduleMode === 'calendar' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {sessionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedSessionType(type)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                          selectedSessionType?.id === type.id
                            ? 'border-mint-500 bg-mint-50 text-mint-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="block">{getLocaleName(type)}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{type.duration} min</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Manual Mode */
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {locale === 'fr' ? 'Type de séance' : locale === 'es' ? 'Tipo de sesión' : 'Session Type'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(sessionTypes.length > 0 ? sessionTypes : sessionTypeOptions).map((option) => {
                          const isDbType = 'duration' in option
                          const value = isDbType ? (option as SessionType).id : (option as typeof sessionTypeOptions[0]).value
                          const label = isDbType
                            ? getLocaleName(option as SessionType)
                            : locale === 'fr' ? (option as typeof sessionTypeOptions[0]).labelFr : (option as typeof sessionTypeOptions[0]).label
                          return (
                            <button
                              key={value}
                              onClick={() => {
                                setManualSessionType(value)
                                if (isDbType) {
                                  setManualDuration((option as SessionType).duration)
                                }
                              }}
                              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                                manualSessionType === value
                                  ? 'border-mint-500 bg-mint-50 text-mint-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <span className="block">{label}</span>
                              {isDbType && (
                                <span className="block text-xs text-gray-400 mt-0.5">{(option as SessionType).duration} min</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step: Format */}
            {step === 'format' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {locale === 'fr' ? 'Format de séance' : 'Session Format'}
                </p>
                {availSessionFormats.includes('in_person') && (
                  <button
                    type="button"
                    onClick={() => setSelectedSessionFormat('in_person')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedSessionFormat === 'in_person'
                        ? 'border-mint-500 bg-mint-50/50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{locale === 'fr' ? 'En personne' : 'In person'}</p>
                        <p className="text-xs text-gray-500">{locale === 'fr' ? 'Au cabinet' : "At the office"}</p>
                      </div>
                    </div>
                  </button>
                )}
                {availSessionFormats.includes('video') && (
                  <button
                    type="button"
                    onClick={() => setSelectedSessionFormat('video')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedSessionFormat === 'video'
                        ? 'border-mint-500 bg-mint-50/50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">{locale === 'fr' ? 'Vidéo' : 'Video call'}</p>
                        <p className="text-xs text-gray-500">{locale === 'fr' ? 'Séance à distance' : 'Remote session'}</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Step: Select Date & Time */}
            {step === 'datetime' && (
              <div className="space-y-4">
                {/* Full-week slot calendar view */}
                {showSlotCalendar && userId && (scheduleMode === 'calendar') && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSlotCalendar(false)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {locale === 'fr' ? 'Retour au sélecteur' : 'Back to picker'}
                    </button>
                    <SlotCalendarView
                      userId={userId}
                      sessionDuration={selectedSessionType?.duration || 60}
                      selectedFormat={selectedSessionFormat}
                      disabledDaysOfWeek={disabledDaysOfWeek}
                      practitionerTz={practitionerTz}
                      dayFormats={scheduleDayFormats}
                      locale={locale}
                      onSelectSlot={(date, time) => {
                        keepTimeRef.current = true
                        setSelectedDate(startOfDay(date))
                        setSelectedTime(time)
                        setShowSlotCalendar(false)
                      }}
                    />
                  </div>
                )}

                {/* Normal picker (hidden when full calendar is open) */}
                {!showSlotCalendar && (<>
                {/* View toggle — only useful in calendar-driven scheduling.
                    Manual entry just needs a date + time picker. */}
                {scheduleMode !== 'manual' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setDateViewMode('calendar')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                          dateViewMode === 'calendar' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {locale === 'fr' ? 'Calendrier' : 'Calendar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateViewMode('quick')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                          dateViewMode === 'quick' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {locale === 'fr' ? 'Prochaines dispos' : 'Next available'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSlotCalendar(true)}
                      className="p-2 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                      title={locale === 'fr' ? 'Vue calendrier semaine' : 'Week calendar view'}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Quick view */}
                {dateViewMode === 'quick' && (
                  <div className="space-y-2">
                    {quickLoading ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-500 mb-2" />
                        <p className="text-sm text-gray-500">{locale === 'fr' ? 'Recherche...' : 'Finding times...'}</p>
                      </div>
                    ) : quickDays.length === 0 ? (
                      <div className="py-8 text-center">
                        <Clock className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucun créneau disponible' : 'No available times'}</p>
                      </div>
                    ) : (
                      quickDays.map((day) => {
                        const isExpanded = quickExpandedDate === day.date
                        const dayDate = new Date(day.date + 'T12:00:00')
                        const dayLabel = dayDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })
                        return (
                          <div key={day.date} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setQuickExpandedDate(isExpanded ? null : day.date)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-900 capitalize">{dayLabel}</span>
                              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1">
                                <div className="flex flex-wrap gap-2">
                                  {day.slots.map((slot) => {
                                    const slotDate = new Date(slot.slot_start)
                                    const tz = practitionerTz || 'UTC'
                                    const timeDisplay = slotDate.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr',
                                    })
                                    const h = parseInt(slotDate.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
                                    const m = slotDate.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' })
                                    const timeStr = `${String(h === 24 ? 0 : h).padStart(2, '0')}:${m.padStart(2, '0')}`
                                    const isSelected = selectedTime === timeStr
                                    return (
                                      <button
                                        type="button"
                                        key={slot.slot_start}
                                        onClick={() => {
                                          setSelectedTime(timeStr)
                                          setSelectedDate(startOfDay(new Date(day.date + 'T12:00:00')))
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                          isSelected
                                            ? 'bg-mint-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-mint-50 hover:text-mint-700'
                                        }`}
                                      >
                                        {timeDisplay}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {/* Calendar view */}
                {dateViewMode === 'calendar' && (<>
                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    {locale === 'fr' ? 'Sélectionner la date' : locale === 'es' ? 'Seleccionar fecha' : 'Select Date'}
                  </label>

                  {/* Calendar picker - allows any date */}
                  <CalendarPicker
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(startOfDay(date))
                      setSelectedTime(null)
                    }}
                    disabledDaysOfWeek={disabledDaysOfWeek}
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Sélectionner l\'heure' : locale === 'es' ? 'Seleccionar hora' : 'Select Time'}
                      </label>
                      {practitionerTz && browserTz && browserTz !== practitionerTz && (
                        <p className="mt-1 text-xs text-amber-600">
                          {locale === 'fr' ? `Horaires en heure de ${practitionerTz.replace(/_/g, ' ').split('/').pop()}` : `Times shown in ${practitionerTz.replace(/_/g, ' ').split('/').pop()} time`}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setUse24Hour(!use24Hour)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      {use24Hour ? '24h' : '12h'}
                    </button>
                  </div>
                  {scheduleMode === 'manual' ? (
                    /* Manual time input - themed picker */
                    <TimePicker
                      value={manualTime}
                      onChange={(time) => setManualTime(time)}
                    />
                  ) : slotsLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-500 mb-2" />
                      <p className="text-sm text-gray-500">{locale === 'fr' ? 'Chargement des créneaux...' : locale === 'es' ? 'Cargando horarios...' : 'Loading times...'}</p>
                    </div>
                  ) : availableSlots.length === 0 && dayBookings.length === 0 ? (
                    <div className="py-6 text-center text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{locale === 'fr' ? 'Aucun créneau disponible pour cette date' : locale === 'es' ? 'No hay horarios disponibles para esta fecha' : 'No available slots for this date'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Existing bookings for context */}
                      {dayBookings.length > 0 && (
                        <div className="space-y-1.5">
                          {dayBookings
                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                            .map((b, i) => {
                              const tz = practitionerTz || 'UTC'
                              const startD = new Date(b.start_time)
                              const endD = new Date(b.end_time)
                              const startStr = startD.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: !use24Hour })
                              const endStr = endD.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: !use24Hour })
                              const isSamePatient = selectedMember && b.member_id === selectedMember.id
                              const isPast = startD.getTime() < Date.now()
                              const isMismatch = !!(b as any)._mismatch
                              return (
                                <div key={`booking-${i}`} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                                  isMismatch ? 'bg-red-50 border-red-200' : isSamePatient ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
                                } ${isPast ? 'opacity-40' : ''}`}>
                                  {isMismatch ? <AlertCircle className="w-3 h-3 text-red-400 shrink-0" /> : b.session_format === 'video' ? <Video className="w-3 h-3 text-blue-400 shrink-0" /> : <Building2 className="w-3 h-3 text-amber-400 shrink-0" />}
                                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{startStr}–{endStr}</span>
                                  <span className={`text-[11px] truncate ${isMismatch ? 'text-red-600' : 'text-gray-500'}`}>{b.client_name}</span>
                                  {isMismatch ? (
                                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                                      <span className="text-[9px] text-red-500 whitespace-nowrap">{locale === 'fr' ? 'supprimé de Google' : 'removed from Google'}</span>
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          try {
                                            await fetch(`/api/bookings/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
                                            setDayBookings(prev => prev.filter(x => x.id !== b.id))
                                            fetchAvailableSlots()
                                          } catch {}
                                        }}
                                        className="text-[9px] font-medium text-red-600 hover:bg-red-100 px-1.5 py-0.5 rounded transition-colors"
                                      >
                                        {locale === 'fr' ? 'Annuler' : 'Cancel'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          try {
                                            await supabase.from('bookings').update({ google_event_id: null }).eq('id', b.id)
                                            setDayBookings(prev => prev.map(x => x.id === b.id ? { ...x, _mismatch: false, google_event_id: null } : x))
                                          } catch {}
                                        }}
                                        className="text-[9px] font-medium text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
                                      >
                                        {locale === 'fr' ? 'Garder' : 'Keep'}
                                      </button>
                                    </div>
                                  ) : isSamePatient ? (
                                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                      {locale === 'fr' ? 'même patient' : 'same patient'}
                                    </span>
                                  ) : null}
                                </div>
                              )
                            })}
                        </div>
                      )}

                      {/* Available slots */}
                      {availableSlots.length === 0 ? (
                        <div className="py-4 text-center text-gray-500">
                          <p className="text-sm">{locale === 'fr' ? 'Aucun créneau disponible' : 'No available slots'}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => {
                            const slotDate = new Date(slot.slot_start)
                            const tz = practitionerTz || 'UTC'
                            const timeDisplay = slotDate.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                              timeZone: tz,
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: !use24Hour,
                            })
                            const h = parseInt(slotDate.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
                            const m = slotDate.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' })
                            const timeStr = `${String(h === 24 ? 0 : h).padStart(2, '0')}:${m.padStart(2, '0')}`
                            return (
                              <button
                                key={slot.slot_start}
                                onClick={() => setSelectedTime(timeStr)}
                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                  selectedTime === timeStr
                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {timeDisplay}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>)}
              </>)}
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && (
              <div className="space-y-4">
                {/* Reschedule: show old → new info */}
                {isReschedule && rescheduleData && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {locale === 'fr'
                        ? `Reprogrammation de la séance de ${rescheduleData.client_name}`
                        : `Rescheduling ${rescheduleData.client_name}'s session`}
                    </span>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white font-medium">
                      {isReschedule
                        ? rescheduleData!.client_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        : `${selectedMember?.first_name[0]}${selectedMember?.last_name[0]}`}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {isReschedule ? rescheduleData!.client_name : `${selectedMember?.first_name} ${selectedMember?.last_name}`}
                      </p>
                      <p className="text-sm text-gray-500">{isReschedule ? rescheduleData!.client_email : selectedMember?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Type de séance' : locale === 'es' ? 'Tipo de sesión' : 'Session Type'}</span>
                      <span className="font-medium text-gray-900">
                        {scheduleMode === 'manual' ? getSessionTypeLabel(manualSessionType) : selectedSessionType ? getLocaleName(selectedSessionType) : ''}
                      </span>
                    </div>
                    {selectedSessionFormat && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{locale === 'fr' ? 'Format' : 'Format'}</span>
                        <span className="font-medium text-gray-900">
                          {selectedSessionFormat === 'video'
                            ? (locale === 'fr' ? 'Vidéo' : 'Video call')
                            : (locale === 'fr' ? 'En personne' : 'In person')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Durée' : locale === 'es' ? 'Duración' : 'Duration'}</span>
                      <span className="font-medium text-gray-900">
                        {scheduleMode === 'manual' ? manualDuration : selectedSessionType?.duration} min
                      </span>
                    </div>
                    {selectedSessionFormat && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{locale === 'fr' ? 'Format' : locale === 'es' ? 'Formato' : 'Format'}</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1.5">
                          {selectedSessionFormat === 'video' ? (
                            <><Video className="w-4 h-4" /> {locale === 'fr' ? 'Vidéo' : locale === 'es' ? 'Video' : 'Video'}</>
                          ) : (
                            <><Building2 className="w-4 h-4" /> {locale === 'fr' ? 'En personne' : locale === 'es' ? 'Presencial' : 'In Person'}</>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Date' : locale === 'es' ? 'Fecha' : 'Date'}</span>
                      <span className="font-medium text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: locale === 'fr' ? frLocale : locale === 'es' ? esLocale : undefined })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Heure' : locale === 'es' ? 'Hora' : 'Time'}</span>
                      <span className="font-medium text-gray-900">
                        {(() => {
                          const t = scheduleMode === 'manual' ? manualTime : (selectedTime || preselectedTime)
                          if (!t) return '—'
                          try { return format(new Date(`2000-01-01T${t}`), use24Hour ? 'HH:mm' : 'h:mm a') } catch { return t }
                        })()}
                      </span>
                    </div>
                    {scheduleMode === 'manual' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{locale === 'fr' ? 'Mode' : locale === 'es' ? 'Modo' : 'Mode'}</span>
                        <span className="font-medium text-amber-600">
                          {locale === 'fr' ? 'Manuel (sans sync calendrier)' : locale === 'es' ? 'Manual (sin sincronización de calendario)' : 'Manual (no calendar sync)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {locale === 'fr' ? 'Notes (optionnel)' : locale === 'es' ? 'Notas (opcional)' : 'Notes (optional)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={locale === 'fr' ? 'Ajouter des notes pour cette séance...' : locale === 'es' ? 'Agregar notas para esta sesión...' : 'Add any notes for this session...'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer — hidden when slot calendar is expanded */}
          {!showSlotCalendar && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            {step === 'confirm' ? (
              <button
                onClick={handleBookSession}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (locale === 'fr' ? 'Planification...' : locale === 'es' ? 'Programando...' : 'Scheduling...')
                  : isReschedule
                  ? (locale === 'fr' ? 'Reprogrammer' : 'Reschedule')
                  : (locale === 'fr' ? 'Confirmer et planifier' : locale === 'es' ? 'Confirmar y programar' : 'Confirm & Schedule')}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (step === 'member') setStep('session')
                  else if (step === 'session') setStep('format')
                  else if (step === 'format') setStep('datetime')
                  else if (step === 'datetime') setStep('confirm')
                }}
                disabled={!canProceed()}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {locale === 'fr' ? 'Continuer' : locale === 'es' ? 'Continuar' : 'Continue'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
