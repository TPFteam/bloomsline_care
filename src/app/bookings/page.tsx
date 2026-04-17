'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  CalendarCheck,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  Plus,
  Trash2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  RefreshCw,
  Video,
  Building2,
  SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { TutorialVideo } from '@/components/ui/tutorial-video'
import { Button } from '@/components/ui/button'
import { TimeSelect } from '@/components/ui/time-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import { WeekCalendarView } from '@/components/bookings/WeekCalendarView'
import {
  getCalendarConnection,
  disconnectCalendar,
  getAvailabilitySchedules,
  bulkUpdateAvailability,
  getBookingSettings,
  saveBookingSettings,
} from '@/lib/services/calendar'
import type { CalendarConnection, BookingSettings, DayOfWeek, SessionType } from '@/types/calendar'
import type { User as UserType } from '@/types/user'

interface Booking {
  id: string
  practitioner_id: string
  client_name: string
  client_email: string
  client_phone: string | null
  session_type: string
  start_time: string
  end_time: string
  timezone: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  practitioner_notes: string | null
  google_event_id: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  session_format: string | null
  created_at: string
}

type MainTab = 'appointments' | 'settings'
type AppointmentFilter = 'upcoming' | 'past' | 'all'

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-amber-100/80',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'from-amber-400 to-amber-600',
    cardBg: 'from-amber-50/50 to-white',
  },
  confirmed: {
    bg: 'bg-emerald-100/80',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'from-emerald-400 to-emerald-600',
    cardBg: 'from-emerald-50/30 to-white',
  },
  cancelled: {
    bg: 'bg-red-100/80',
    text: 'text-red-700',
    border: 'border-red-200',
    iconBg: 'from-red-400 to-red-600',
    cardBg: 'from-red-50/30 to-white',
  },
  completed: {
    bg: 'bg-blue-100/80',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'from-blue-400 to-blue-600',
    cardBg: 'from-blue-50/30 to-white',
  },
  no_show: {
    bg: 'bg-gray-100/80',
    text: 'text-gray-600',
    border: 'border-gray-200',
    iconBg: 'from-gray-400 to-gray-600',
    cardBg: 'from-gray-50/30 to-white',
  },
}

const STATUS_LABELS: Record<string, { en: string; fr: string }> = {
  pending: { en: 'Pending Approval', fr: 'En attente' },
  confirmed: { en: 'Confirmed', fr: 'Confirmé' },
  cancelled: { en: 'Cancelled', fr: 'Annulé' },
  completed: { en: 'Completed', fr: 'Terminé' },
  no_show: { en: 'No Show', fr: 'Absent' },
}

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS: Record<DayOfWeek, { en: string; fr: string }> = {
  monday: { en: 'Monday', fr: 'Lundi' },
  tuesday: { en: 'Tuesday', fr: 'Mardi' },
  wednesday: { en: 'Wednesday', fr: 'Mercredi' },
  thursday: { en: 'Thursday', fr: 'Jeudi' },
  friday: { en: 'Friday', fr: 'Vendredi' },
  saturday: { en: 'Saturday', fr: 'Samedi' },
  sunday: { en: 'Sunday', fr: 'Dimanche' },
}

const DEFAULT_SESSION_TYPES: SessionType[] = [
  { id: 'initial', name: 'Initial Consultation', name_fr: 'Consultation initiale', duration: 60, price: null, is_default: true },
  { id: 'follow_up', name: 'Follow-up Session', name_fr: 'Séance de suivi', duration: 50, price: null, is_default: true },
  { id: 'check_in', name: 'Check-in', name_fr: 'Point de situation', duration: 30, price: null },
]

interface AvailabilitySlot {
  day: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
  sessionFormat: 'in_person' | 'video' | 'both'
}

export default function BookingsPage() {
  const { locale } = useLanguage()
  const searchParams = useSearchParams()

  // Main tab state — read from URL query param (e.g. ?tab=settings after calendar OAuth callback)
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const tab = searchParams.get('tab')
    return tab === 'settings' ? 'settings' : 'appointments'
  })

  // Appointments state
  const [bookings, setBookings] = useState<Booking[]>([])

  // Highlight a specific booking (from notification deep link)
  const [highlightId, setHighlightId] = useState<string | null>(searchParams.get('highlight'))
  useEffect(() => {
    if (highlightId && bookings.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`booking-${highlightId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-teal-400', 'ring-offset-2', 'transition-all')
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-teal-400', 'ring-offset-2')
            setHighlightId(null)
          }, 3000)
        }
      }, 500)
    }
  }, [highlightId, bookings])
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('upcoming')
  const [bookingView, setBookingView] = useState<'list' | 'calendar'>('list')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [showSettingsSavedModal, setShowSettingsSavedModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'general' | 'sessions' | 'availability' | 'preferences'>('general')

  // User state
  const [user, setUser] = useState<UserType | null>(null)

  // Settings state
  const [userId, setUserId] = useState<string | null>(null)
  const [practitionerSlug, setPractitionerSlug] = useState<string | null>(null)
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnection | null>(null)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)
  const [timezone, setTimezone] = useState('America/New_York')
  const [linkCopied, setLinkCopied] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Show toast for calendar OAuth callback results
  useEffect(() => {
    if (searchParams.get('calendar_connected') === 'true') {
      toast.success('Google Calendar connected successfully')
    }
    const calError = searchParams.get('calendar_error')
    if (calError) {
      toast.error(`Calendar connection failed: ${calError}`)
    }
  }, [searchParams])

  // Load all data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      setUserId(authUser.id)

      // Load user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userProfile) {
        setUser(userProfile)
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          user_type: authUser.user_metadata?.user_type || 'mentor',
          preferred_language: 'en',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        })
      }

      // Load practitioner profile to get slug
      const { data: profile } = await supabase
        .from('practitioner_profiles')
        .select('slug')
        .eq('user_id', authUser.id)
        .single()

      if (profile?.slug) {
        setPractitionerSlug(profile.slug)
      }

      // Load booking settings to get session types
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', authUser.id)
        .single()

      if (settings?.session_types) {
        setSessionTypes(settings.session_types as SessionType[])
      }

      // Load bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', authUser.id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Failed to load bookings:', error)
      } else {
        setBookings(bookingsData || [])
      }

      setIsLoading(false)

      // Load settings data
      const connection = await getCalendarConnection()
      setCalendarConnection(connection)

      const schedules = await getAvailabilitySchedules(authUser.id)
      if (schedules.length > 0) {
        setAvailabilitySlots(
          schedules.map((s: any) => ({
            day: s.day_of_week,
            startTime: s.start_time.slice(0, 5),
            endTime: s.end_time.slice(0, 5),
            isActive: s.is_active,
            sessionFormat: s.session_format || 'both',
          }))
        )
        setTimezone(schedules[0].timezone)
      } else {
        // No availability found — show empty state, don't auto-seed
        setAvailabilitySlots([])
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      }

      const bookingSettingsData = await getBookingSettings(authUser.id)
      setBookingSettings(bookingSettingsData)

      setIsLoadingSettings(false)

      // Scroll to hash target after settings load
      if (window.location.hash) {
        setTimeout(() => {
          const el = document.querySelector(window.location.hash)
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }

    loadData()
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  // Get session type name
  const getSessionTypeName = (typeId: string) => {
    const type = sessionTypes.find(st => st.id === typeId)
    if (locale === 'fr' && type?.name_fr) return type.name_fr
    return type?.name || typeId
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const startTime = parseISO(booking.start_time)
    const now = new Date()

    switch (appointmentFilter) {
      case 'upcoming':
        return (booking.status === 'confirmed' || booking.status === 'pending') && startTime > now
      case 'past':
        return startTime < now || booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show'
      case 'all':
      default:
        return true
    }
  }).sort((a, b) => {
    // Pending bookings first, then by start_time ascending
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  })

  // Count pending bookings
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  // Format date for display
  const formatBookingDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`
    }
    return format(date, 'MMM d, yyyy h:mm a')
  }

  // Booking actions
  const handleApprove = async (bookingId: string) => {
    setProcessingId(bookingId)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve booking')
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
      )

      if (data.calendarSynced) {
        setMessage({ type: 'success', text: 'Booking approved and synced to Google Calendar!' })
      } else if (data.calendarError) {
        setMessage({ type: 'success', text: `Booking approved. Calendar sync: ${data.calendarError}` })
      } else {
        setMessage({ type: 'success', text: 'Booking approved!' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to approve booking' })
    }

    setProcessingId(null)
  }

  const handleReject = async (bookingId: string) => {
    setProcessingId(bookingId)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject booking')
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      )

      setMessage({ type: 'success', text: 'Booking rejected.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reject booking' })
    }

    setProcessingId(null)
  }

  const handleMarkStatus = async (bookingId: string, status: 'completed' | 'no_show') => {
    setProcessingId(bookingId)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking')
      }

      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status } : b))
      )

      setMessage({ type: 'success', text: locale === 'fr' ? `Rendez-vous marqué comme ${STATUS_LABELS[status]?.fr?.toLowerCase()}.` : `Booking marked as ${STATUS_LABELS[status]?.en?.toLowerCase()}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update booking' })
    }

    setProcessingId(null)
  }

  // Reschedule
  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<Array<{ slot_start: string; slot_end: string }>>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const openRescheduleModal = (booking: any) => {
    setRescheduleBooking(booking)
    setRescheduleDate('')
    setRescheduleTime('')
    setRescheduleReason('')
    setRescheduleSlots([])
  }

  const loadRescheduleSlots = async (date: string) => {
    if (!rescheduleBooking || !date) return
    setIsLoadingSlots(true)
    setRescheduleTime('')
    try {
      const duration = Math.round(
        (new Date(rescheduleBooking.end_time).getTime() - new Date(rescheduleBooking.start_time).getTime()) / 60000
      )
      const res = await fetch(`/api/bookings/available-slots?practitionerId=${rescheduleBooking.practitioner_id}&date=${date}&duration=${duration}&skipNotice=true`)
      const data = await res.json()
      setRescheduleSlots(data.slots || [])
    } catch {
      setRescheduleSlots([])
    }
    setIsLoadingSlots(false)
  }

  const handleReschedule = async () => {
    if (!rescheduleBooking || !rescheduleTime) return
    setProcessingId(rescheduleBooking.id)
    const selectedSlot = rescheduleSlots.find(s => s.slot_start === rescheduleTime)
    if (!selectedSlot) return

    try {
      const response = await fetch(`/api/bookings/${rescheduleBooking.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSlotStart: selectedSlot.slot_start,
          newSlotEnd: selectedSlot.slot_end,
          reason: rescheduleReason || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to reschedule')

      // Refresh bookings
      setBookings(prev =>
        prev.map(b => (b.id === rescheduleBooking.id ? { ...b, status: 'cancelled' as const } : b))
      )
      setRescheduleBooking(null)
      toast.success(locale === 'fr' ? 'Séance reprogrammée' : 'Session rescheduled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule')
    }
    setProcessingId(null)
  }

  // Settings actions
  const handleConnectGoogle = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/calendar/google')
      const { url } = await response.json()
      window.location.href = url
    } catch {
      setMessage({ type: 'error', text: 'Failed to initiate calendar connection' })
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    const success = await disconnectCalendar()
    if (success) {
      setCalendarConnection(null)
      setMessage({ type: 'success', text: 'Calendar disconnected' })
    } else {
      setMessage({ type: 'error', text: 'Failed to disconnect calendar' })
    }
    setIsDisconnecting(false)
  }

  const addAvailabilitySlot = (day: DayOfWeek) => {
    setAvailabilitySlots([
      ...availabilitySlots,
      { day, startTime: '09:00', endTime: '17:00', isActive: true, sessionFormat: 'both' },
    ])
  }

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index))
  }

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    const updated = [...availabilitySlots]
    updated[index] = { ...updated[index], [field]: value }
    setAvailabilitySlots(updated)
  }

  const handleSaveAvailability = async () => {
    if (!userId) return

    setIsSavingAvailability(true)
    const success = await bulkUpdateAvailability(
      userId,
      availabilitySlots.map((slot) => ({
        day_of_week: slot.day,
        start_time: slot.startTime + ':00',
        end_time: slot.endTime + ':00',
        is_active: slot.isActive,
        timezone,
        session_format: slot.sessionFormat || 'both',
      }))
    )

    if (success) {
      setShowSavedModal(true)
    } else {
      setMessage({ type: 'error', text: 'Failed to save availability' })
    }
    setIsSavingAvailability(false)
  }

  const handleSaveBookingSettings = async () => {
    console.log('[bookings/handleSave] Called! userId:', userId)
    if (!userId) {
      toast.error('No user ID found. Please refresh the page.')
      return
    }

    setIsSavingSettings(true)
    const payload = {
      user_id: userId,
      default_duration: bookingSettings?.default_duration || 60,
      buffer_before: bookingSettings?.buffer_before ?? 0,
      buffer_after: bookingSettings?.buffer_after ?? 15,
      min_notice_hours: bookingSettings?.min_notice_hours || 24,
      max_advance_days: bookingSettings?.max_advance_days || 60,
      session_types: bookingSettings?.session_types || DEFAULT_SESSION_TYPES,
      booking_page_enabled: bookingSettings?.booking_page_enabled ?? true,
      require_approval: bookingSettings?.require_approval ?? false,
      cancellation_policy: bookingSettings?.cancellation_policy ?? null,
      booking_instructions: bookingSettings?.booking_instructions ?? null,
      email_notifications: bookingSettings?.email_notifications ?? true,
      external_booking_url: bookingSettings?.external_booking_url ?? null,
      allow_patient_cancel: (bookingSettings as any)?.allow_patient_cancel ?? false,
      allow_patient_reschedule: (bookingSettings as any)?.allow_patient_reschedule ?? false,
      modification_notice_hours: (bookingSettings as any)?.modification_notice_hours ?? 48,
      hour_aligned_slots: (bookingSettings as any)?.hour_aligned_slots ?? false,
    }
    console.log('[bookings/handleSave] Payload:', JSON.stringify(payload))

    try {
      const saved = await saveBookingSettings(payload)
      console.log('[bookings/handleSave] Result:', saved)
      if (saved) {
        setBookingSettings(saved)
        setShowSettingsSavedModal(true)
      } else {
        toast.error('Failed to save booking settings.')
      }
    } catch (err) {
      console.error('[bookings/handleSave] Exception:', err)
      toast.error('Error saving settings.')
    }
    setIsSavingSettings(false)
  }

  const getSlotsForDay = (day: DayOfWeek) => {
    return availabilitySlots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.day === day)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="bookings" />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CalendarCheck className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Réservations' : 'Bookings'}</span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">{locale === 'fr' ? 'Réservations' : 'Bookings'}</h1>
                <p className="text-gray-500 text-sm">{locale === 'fr' ? 'Gérer les rendez-vous et les paramètres' : 'Manage appointments and booking settings'}</p>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pendingCount} {locale === 'fr' ? 'en attente' : 'pending'}</span>
                </div>
              )}
            </motion.div>

          {/* Message Toast */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl flex items-center gap-3 backdrop-blur-xl shadow-lg ${
                message.type === 'success'
                  ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50/90 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              )}
              <span className="flex-1">{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

            {/* Main Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-6">
              <button
                onClick={() => setMainTab('appointments')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mainTab === 'appointments'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {locale === 'fr' ? 'Rendez-vous' : 'Appointments'}
                {pendingCount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    mainTab === 'appointments'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
              <button
                onClick={() => setMainTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  mainTab === 'settings'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                {locale === 'fr' ? 'Paramètres' : 'Settings'}
              </button>
            </div>

          {/* Appointments Tab Content */}
          {mainTab === 'appointments' && (
            <>
              {/* External booking info banner */}
              {bookingSettings?.external_booking_url && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {locale === 'fr' ? 'Vous utilisez un système de réservation externe' : 'You\'re using an external booking system'}
                    </p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      {locale === 'fr' ? 'Les réservations faites via votre plateforme externe ne se synchronisent pas automatiquement avec Bloomsline. Pensez à créer une séance manuellement pour garder vos dossiers à jour.' : 'Bookings made through your external platform won\'t sync to Bloomsline automatically. Remember to create a manual session when needed to keep your records up to date.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Sub Tabs */}
              <div className="flex gap-2 flex-wrap">
                {(['upcoming', 'past', 'all'] as AppointmentFilter[]).map((tab) => {
                  const isActive = appointmentFilter === tab

                  return (
                    <button
                      key={tab}
                      onClick={() => setAppointmentFilter(tab)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      {locale === 'fr'
                        ? (tab === 'upcoming' ? 'À venir' : tab === 'past' ? 'Passés' : 'Tous')
                        : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  )
                })}
                {/* View toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-auto">
                  <button
                    onClick={() => setBookingView('list')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${bookingView === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {locale === 'fr' ? 'Liste' : 'List'}
                  </button>
                  <button
                    onClick={() => setBookingView('calendar')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${bookingView === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {locale === 'fr' ? 'Calendrier' : 'Calendar'}
                  </button>
                </div>
              </div>

              {/* Calendar View */}
              {bookingView === 'calendar' ? (
                <WeekCalendarView bookings={bookings} onApprove={handleApprove} onReject={handleReject} processingId={processingId} />
              ) : (
              <>
              {/* Bookings List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[1.5rem] p-12 border border-gray-200 border-dashed text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">
                    {appointmentFilter === 'upcoming'
                      ? (locale === 'fr' ? 'Aucun rendez-vous à venir' : 'No upcoming appointments')
                      : appointmentFilter === 'past'
                      ? (locale === 'fr' ? 'Aucun rendez-vous passé' : 'No past appointments')
                      : (locale === 'fr' ? 'Aucune réservation' : 'No bookings yet')}
                  </p>
                </motion.div>
              ) : (
                <div>
                  {/* Group bookings by date */}
                  {(() => {
                    const grouped: Record<string, typeof filteredBookings> = {}
                    filteredBookings.forEach(b => {
                      const dateKey = format(parseISO(b.start_time), 'yyyy-MM-dd')
                      if (!grouped[dateKey]) grouped[dateKey] = []
                      grouped[dateKey].push(b)
                    })

                    return Object.entries(grouped).map(([dateKey, dayBookings]) => {
                      const dateObj = parseISO(dateKey)
                      const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey
                      const isTmrw = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd') === dateKey

                      return (
                        <div key={dateKey} className="mb-6">
                          {/* Date header */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-sm font-semibold text-gray-500">
                              {isToday
                                ? (locale === 'fr' ? "Aujourd'hui" : 'Today')
                                : isTmrw
                                  ? (locale === 'fr' ? 'Demain' : 'Tomorrow')
                                  : format(dateObj, locale === 'fr' ? 'EEEE d MMMM' : 'EEEE, MMM d')}
                            </h3>
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">{dayBookings.length}</span>
                          </div>

                          {/* Bookings for this day */}
                          <div className="space-y-2">
                            {dayBookings.map((booking, index) => {
                              const startTime = parseISO(booking.start_time)
                              const isPastBooking = isPast(startTime) && booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'no_show'
                              const statusConfig = STATUS_CONFIG[booking.status]

                              return (
                                <motion.div
                                  id={`booking-${booking.id}`}
                                  key={booking.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.03 }}
                                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                                >
                                  <div className="flex items-stretch gap-4">
                                    {/* Format icon + Time */}
                                    <div className="w-24 flex-shrink-0 flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${booking.session_format === 'in_person' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {booking.session_format === 'in_person' ? <Building2 className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-900">{format(startTime, 'h:mm a')}</p>
                                        <p className="text-xs text-gray-400">
                                          {Math.round((parseISO(booking.end_time).getTime() - startTime.getTime()) / 60000)} min
                                        </p>
                                      </div>
                                    </div>

                                    {/* Divider */}
                                    <div className={`w-1 rounded-full self-stretch ${booking.status === 'pending' ? 'bg-amber-400' : booking.status === 'confirmed' ? 'bg-teal-400' : booking.status === 'completed' ? 'bg-gray-300' : booking.status === 'cancelled' ? 'bg-red-300' : 'bg-gray-300'}`} />

                                    {/* Client + Session */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 truncate">{booking.client_name}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                          {STATUS_LABELS[booking.status]?.[locale as 'en' | 'fr'] || booking.status}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 truncate">
                                        {getSessionTypeName(booking.session_type)} · {booking.client_email}
                                      </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {booking.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleApprove(booking.id)}
                                            disabled={processingId === booking.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                          >
                                            {processingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            {locale === 'fr' ? 'Accepter' : 'Approve'}
                                          </button>
                                          <button
                                            onClick={() => handleReject(booking.id)}
                                            disabled={processingId === booking.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                            {locale === 'fr' ? 'Refuser' : 'Reject'}
                                          </button>
                                        </>
                                      )}
                                      {booking.status === 'confirmed' && isPastBooking && (
                                        <>
                                          <button
                                            onClick={() => handleMarkStatus(booking.id, 'completed')}
                                            disabled={processingId === booking.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                          >
                                            {processingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {locale === 'fr' ? 'Terminé' : 'Completed'}
                                          </button>
                                          <button
                                            onClick={() => handleMarkStatus(booking.id, 'no_show')}
                                            disabled={processingId === booking.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                          >
                                            <XCircle className="w-3.5 h-3.5" />
                                            {locale === 'fr' ? 'Absent' : 'No Show'}
                                          </button>
                                        </>
                                      )}
                                      {booking.status === 'confirmed' && (
                                        <button
                                          onClick={() => openRescheduleModal(booking)}
                                          disabled={processingId === booking.id}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-teal-600 text-xs font-medium rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors disabled:opacity-50"
                                        >
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          {locale === 'fr' ? 'Reprogrammer' : 'Reschedule'}
                                        </button>
                                      )}
                                      {booking.status === 'confirmed' && !isPastBooking && (
                                        <button
                                          onClick={() => handleReject(booking.id)}
                                          disabled={processingId === booking.id}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                          {processingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                          {locale === 'fr' ? 'Annuler' : 'Cancel'}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Cancellation reason */}
                                  {booking.status === 'cancelled' && booking.cancellation_reason && (
                                    <div className="mt-2 ml-[136px] pl-5 border-l-2 border-red-200">
                                      <p className="text-xs text-red-500">
                                        {locale === 'fr' ? 'Annulé' : 'Cancelled'}{booking.cancelled_by === 'member' ? (locale === 'fr' ? ' par le patient' : ' by patient') : ''}: {booking.cancellation_reason}
                                      </p>
                                      {booking.cancelled_at && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                          {new Date(booking.cancelled_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {/* Notes — compact */}
                                  {booking.notes && booking.status !== 'cancelled' && (
                                    <div className={`mt-2 ml-[136px] pl-5 border-l-2 ${booking.notes.startsWith('Rescheduled:') ? 'border-amber-200' : 'border-gray-100'}`}>
                                      <p className={`text-xs ${booking.notes.startsWith('Rescheduled:') ? 'text-amber-600' : 'text-gray-500 italic'}`}>{booking.notes}</p>
                                    </div>
                                  )}
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </>
          )}
          </>
          )}

          {/* Settings Tab Content */}
          {mainTab === 'settings' && (
            <div className="space-y-6">
              {/* Settings sub-tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {([
                  { key: 'general' as const, label: locale === 'fr' ? 'Général' : 'General', icon: LinkIcon },
                  { key: 'availability' as const, label: locale === 'fr' ? 'Disponibilités' : 'Availability', icon: Calendar },
                  { key: 'sessions' as const, label: locale === 'fr' ? 'Séances' : 'Sessions', icon: Clock },
                  { key: 'preferences' as const, label: locale === 'fr' ? 'Préférences' : 'Preferences', icon: SlidersHorizontal },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSettingsTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                      settingsTab === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ─── General tab: Booking Link + Calendar ─── */}
              {settingsTab === 'general' && (<>
              {/* Booking Link — only for native booking */}
              {!bookingSettings?.external_booking_url && practitionerSlug && bookingSettings?.booking_page_enabled && (
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-gray-600" />
                      {locale === 'fr' ? 'Votre lien de réservation' : 'Your Booking Link'}
                    </CardTitle>
                    <CardDescription>
                      {locale === 'fr' ? 'Partagez ce lien avec vos clients pour qu\'ils puissent prendre rendez-vous' : 'Share this link with clients so they can book appointments with you'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white border rounded-lg px-4 py-2.5 font-mono text-sm text-gray-700 truncate">
                        bloomsline.com/practitioner/{practitionerSlug}/book
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://bloomsline.com/practitioner/${practitionerSlug}/book`)
                          setLinkCopied(true)
                          setTimeout(() => setLinkCopied(false), 2000)
                        }}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            {locale === 'fr' ? 'Copié !' : 'Copied!'}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            {locale === 'fr' ? 'Copier' : 'Copy'}
                          </>
                        )}
                      </Button>
                      <Link href={`/practitioner/${practitionerSlug}/book`} target="_blank">
                        <Button variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {locale === 'fr' ? 'Aperçu' : 'Preview'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Calendar Connection — only for native booking */}
              {!bookingSettings?.external_booking_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {locale === 'fr' ? 'Intégration Calendrier' : 'Calendar Integration'}
                    <TutorialVideo
                      url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Comment%20synchroniser%20son%20Google%20Agenda%20avec%20Bloomsline.mp4"
                      title={locale === 'fr' ? 'Comment synchroniser son Google Agenda avec Bloomsline' : 'How to sync Google Calendar with Bloomsline'}
                    />
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Connectez votre Google Calendar pour synchroniser les rendez-vous et afficher vos disponibilités' : 'Connect your Google Calendar to sync appointments and show real-time availability'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSettings ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'fr' ? 'Chargement...' : 'Loading...'}
                    </div>
                  ) : calendarConnection ? (
                    <div>
                      {(calendarConnection as any).sync_status === 'broken' && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              {locale === 'fr' ? 'Connexion expirée' : 'Connection expired'}
                            </p>
                            <p className="text-xs text-red-600">
                              {locale === 'fr' ? 'Veuillez reconnecter votre Google Calendar pour synchroniser vos disponibilités.' : 'Please reconnect your Google Calendar to sync your availability.'}
                            </p>
                          </div>
                          <Button size="sm" onClick={async () => { await handleDisconnect(); handleConnectGoogle() }} className="bg-red-600 hover:bg-red-700 text-white text-xs">
                            {locale === 'fr' ? 'Reconnecter' : 'Reconnect'}
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(calendarConnection as any).sync_status === 'broken' ? 'bg-red-100' : 'bg-green-100'}`}>
                            {(calendarConnection as any).sync_status === 'broken' ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <Check className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {(calendarConnection as any).sync_status === 'broken'
                                ? (locale === 'fr' ? 'Google Calendar — connexion perdue' : 'Google Calendar — connection lost')
                                : (locale === 'fr' ? 'Google Calendar connecté' : 'Google Calendar Connected')}
                            </p>
                            <p className="text-sm text-gray-500">{calendarConnection.provider_email}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleDisconnect}
                          disabled={isDisconnecting}
                        >
                          {isDisconnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            locale === 'fr' ? 'Déconnecter' : 'Disconnect'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleConnectGoogle} disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-2" />
                      )}
                      {locale === 'fr' ? 'Connecter Google Calendar' : 'Connect Google Calendar'}
                    </Button>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Booking setup: enable/disable, external, approval */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'fr' ? 'Configuration de la réservation' : 'Booking Setup'}</CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Activez ou désactivez la prise de rendez-vous en ligne' : 'Enable or disable online appointment booking'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{locale === 'fr' ? 'Activer la page de réservation' : 'Enable Booking Page'}</p>
                      <p className="text-sm text-gray-500">
                        {locale === 'fr' ? 'Permettre aux clients de prendre rendez-vous via votre profil public' : 'Allow clients to book appointments through your public profile'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const turningOn = !bookingSettings?.booking_page_enabled
                        const externalIsActive = !!bookingSettings?.external_booking_url
                        if (turningOn && externalIsActive) {
                          if (!window.confirm(locale === 'fr' ? 'Cela désactivera le système de réservation externe. Continuer ?' : 'This will disable the external booking system. Continue?')) return
                          setBookingSettings((prev) => ({ ...prev!, booking_page_enabled: true, external_booking_url: null }))
                        } else {
                          setBookingSettings((prev) => ({ ...prev!, booking_page_enabled: !prev?.booking_page_enabled }))
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingSettings?.booking_page_enabled ? 'bg-teal-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings?.booking_page_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-3 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{locale === 'fr' ? 'Utiliser un système de réservation externe' : 'Use external booking system'}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Rediriger les clients vers Calendly, Doctolib ou un autre outil' : 'Redirect clients to Calendly, Doctolib, or another booking tool'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const isCurrentlyOff = bookingSettings?.external_booking_url === null || bookingSettings?.external_booking_url === undefined
                          const nativeIsActive = !!bookingSettings?.booking_page_enabled
                          if (isCurrentlyOff && nativeIsActive) {
                            if (!window.confirm(locale === 'fr' ? 'Cela désactivera la page de réservation intégrée. Continuer ?' : 'This will disable the built-in booking page. Continue?')) return
                            setBookingSettings((prev) => ({ ...prev!, booking_page_enabled: false, external_booking_url: '' }))
                          } else {
                            setBookingSettings((prev) => ({ ...prev!, external_booking_url: prev?.external_booking_url !== null && prev?.external_booking_url !== undefined ? null : '' }))
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingSettings?.external_booking_url !== null && bookingSettings?.external_booking_url !== undefined ? 'bg-teal-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings?.external_booking_url !== null && bookingSettings?.external_booking_url !== undefined ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {bookingSettings?.external_booking_url !== null && bookingSettings?.external_booking_url !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Booking URL</label>
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                          <input type="url" value={bookingSettings.external_booking_url || ''} onChange={(e) => setBookingSettings((prev) => ({ ...prev!, external_booking_url: e.target.value }))} placeholder="https://calendly.com/your-link" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {locale === 'fr' ? 'Le bouton « Réserver » sur votre profil public ouvrira ce lien.' : 'The "Book" button on your public profile will open this URL.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {!(bookingSettings?.external_booking_url) && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{locale === 'fr' ? 'Approbation requise' : 'Require Approval'}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Approuver manuellement les demandes de rendez-vous avant confirmation' : 'Manually approve booking requests before they are confirmed'}
                        </p>
                      </div>
                      <button
                        onClick={() => setBookingSettings((prev) => ({ ...prev!, require_approval: !prev?.require_approval }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bookingSettings?.require_approval ? 'bg-teal-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bookingSettings?.require_approval ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )}

                  <Button type="button" onClick={() => handleSaveBookingSettings()} disabled={isSavingSettings}>
                    {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {locale === 'fr' ? 'Enregistrer' : 'Save'}
                  </Button>
                </CardContent>
              </Card>
              </>)}

              {/* ─── Sessions tab ─── */}
              {settingsTab === 'sessions' && (<>
              {/* Session Types — only for native booking */}
              {!bookingSettings?.external_booking_url && (
              <Card id="session-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    {locale === 'fr' ? 'Types de séance' : 'Session Types'}
                    <TutorialVideo
                      url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Personnaliser%20les%20noms%20de%20vos%20seances.mov"
                      title={locale === 'fr' ? 'Personnaliser les noms de vos séances' : 'Customize your session type names'}
                    />
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Configurez les types de séances que vous proposez et leur durée' : 'Configure the types of sessions you offer and their durations'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES).map((type, index) => {
                    const isLocked = type.id === 'initial' || type.id === 'follow_up'
                    const lockedNameFr: Record<string, string> = { initial: 'Consultation initiale', follow_up: 'Séance de suivi' }
                    return (
                    <div
                      key={type.id}
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{locale === 'fr' ? 'Nom' : 'Name'}</label>
                            <input
                              type="text"
                              value={isLocked && locale === 'fr' ? lockedNameFr[type.id] : type.name}
                              readOnly={isLocked}
                              onChange={(e) => {
                                if (isLocked) return
                                const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                                updated[index] = { ...updated[index], name: e.target.value }
                                setSessionTypes(updated)
                                setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                              }}
                              className={`w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                              placeholder="e.g. Initial Consultation"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{locale === 'fr' ? 'Durée (min)' : 'Duration (min)'}</label>
                            <select
                              value={type.duration}
                              onChange={(e) => {
                                const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                                updated[index] = { ...updated[index], duration: parseInt(e.target.value) }
                                setSessionTypes(updated)
                                setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                              }}
                              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
                            >
                              {[15, 20, 25, 30, 45, 50, 60, 75, 90, 120].map((d) => (
                                <option key={d} value={d}>{d} min</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {!isLocked && (sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES).length > 1 && (
                          <button
                            onClick={() => {
                              const updated = (sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES).filter((_, i) => i !== index)
                              setSessionTypes(updated)
                              setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES]
                          updated[index] = { ...updated[index], notesRequired: !type.notesRequired }
                          setSessionTypes(updated)
                          setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                        }}
                        className="flex items-center gap-2 cursor-pointer mt-2 pt-2 border-t border-gray-100 w-full"
                      >
                        <div className={`relative w-8 h-[18px] rounded-full transition-colors ${type.notesRequired ? 'bg-teal-500' : 'bg-gray-200'}`}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${type.notesRequired ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
                        </div>
                        <span className="text-xs text-gray-500">
                          {locale === 'fr' ? 'Notes obligatoires lors de la réservation' : 'Require notes when booking'}
                        </span>
                      </button>
                    </div>
                  )})}

                  <button
                    onClick={() => {
                      const current = sessionTypes.length > 0 ? sessionTypes : DEFAULT_SESSION_TYPES
                      const newType: SessionType = {
                        id: `custom_${Date.now()}`,
                        name: '',
                        duration: 60,
                        price: null,
                      }
                      const updated = [...current, newType]
                      setSessionTypes(updated)
                      setBookingSettings((prev: BookingSettings | null) => prev ? { ...prev, session_types: updated } : prev)
                    }}
                    className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'fr' ? 'Ajouter un type de séance' : 'Add session type'}
                  </button>

                  <div className="pt-2">
                    <Button
                      onClick={handleSaveBookingSettings}
                      disabled={isSavingSettings}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {locale === 'fr' ? 'Enregistrer les types de séance' : 'Save Session Types'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              </>)}

              {/* ─── Availability tab ─── */}
              {settingsTab === 'availability' && (<>
              {/* Availability Schedule — only for native booking */}
              {!bookingSettings?.external_booking_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {locale === 'fr' ? 'Horaires de disponibilité' : 'Availability Schedule'}
                    <TutorialVideo
                      url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Personnaliser%20vos%20horaires%20de%20pratique.mov"
                      title={locale === 'fr' ? 'Personnaliser vos horaires de pratique' : 'Customize your practice hours'}
                    />
                  </CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Définissez vos disponibilités hebdomadaires pour les réservations' : 'Set your weekly availability for client bookings'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Fuseau horaire' : 'Timezone'}
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day) => {
                      const slots = getSlotsForDay(day)
                      return (
                        <div key={day} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{DAY_LABELS[day]?.[locale as 'en' | 'fr'] || day}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addAvailabilitySlot(day)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {locale === 'fr' ? 'Ajouter un créneau' : 'Add slot'}
                            </Button>
                          </div>
                          {slots.length === 0 ? (
                            <p className="text-sm text-gray-500">Unavailable</p>
                          ) : (
                            <div className="space-y-2">
                              {slots.map((slot) => {
                                return (
                                  <div
                                    key={slot.index}
                                    className="flex items-center gap-3"
                                  >
                                    <TimeSelect
                                      value={slot.startTime}
                                      onChange={(v) => updateAvailabilitySlot(slot.index, 'startTime', v)}
                                    />
                                    <span className="text-gray-400 text-sm">{locale === 'fr' ? 'à' : 'to'}</span>
                                    <TimeSelect
                                      value={slot.endTime}
                                      onChange={(v) => updateAvailabilitySlot(slot.index, 'endTime', v)}
                                    />
                                    <select
                                      value={slot.sessionFormat || 'both'}
                                      onChange={(e) => updateAvailabilitySlot(slot.index, 'sessionFormat', e.target.value)}
                                      className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600"
                                    >
                                      <option value="both">{locale === 'fr' ? 'Les deux' : 'Both'}</option>
                                      <option value="in_person">{locale === 'fr' ? 'En personne' : 'In person'}</option>
                                      <option value="video">{locale === 'fr' ? 'Vidéo' : 'Video'}</option>
                                    </select>
                                    <button
                                      onClick={() => removeAvailabilitySlot(slot.index)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <Button onClick={handleSaveAvailability} disabled={isSavingAvailability}>
                    {isSavingAvailability ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {locale === 'fr' ? 'Enregistrer les disponibilités' : 'Save Availability'}
                  </Button>
                </CardContent>
              </Card>
              )}

              </>)}

              {/* ─── Preferences tab ─── */}
              {settingsTab === 'preferences' && (<>
              {/* Scheduling rules */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'fr' ? 'Règles de planification' : 'Scheduling Rules'}</CardTitle>
                  <CardDescription>
                    {locale === 'fr' ? 'Délais, tampons et intervalles pour vos créneaux' : 'Timing, buffers, and intervals for your time slots'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!(bookingSettings?.external_booking_url) && (
                    <>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Délai avant' : 'Buffer before'}
                      </label>
                      <select
                        value={bookingSettings?.buffer_before || 0}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            buffer_before: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      >
                        <option value={0}>{locale === 'fr' ? 'Aucun' : 'None'}</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Délai après' : 'Buffer after'}
                      </label>
                      <select
                        value={bookingSettings?.buffer_after || 0}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            buffer_after: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      >
                        <option value={0}>{locale === 'fr' ? 'Aucun' : 'None'}</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Préavis minimum (heures)' : 'Minimum notice (hours)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={bookingSettings?.min_notice_hours ?? ''}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            min_notice_hours: e.target.value === '' ? 0 : parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Réservation max à l\'avance (jours)' : 'Max advance booking (days)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={bookingSettings?.max_advance_days ?? ''}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            max_advance_days: e.target.value === '' ? 0 : parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Slot alignment */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {locale === 'fr' ? 'Intervalles de créneaux' : 'Slot Intervals'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {locale === 'fr' ? 'Contrôlez à quelle fréquence les créneaux sont proposés aux patients' : 'Control how frequently time slots are offered to patients'}
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.hour_aligned_slots ? 'bg-teal-600' : 'bg-gray-300'}`}
                        onClick={() =>
                          setBookingSettings((prev: any) => ({
                            ...prev!,
                            hour_aligned_slots: !prev?.hour_aligned_slots,
                          }))
                        }
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.hour_aligned_slots ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <div>
                        <span className="text-sm text-gray-700">
                          {locale === 'fr' ? 'N\'accepter les séances qu\'aux heures pleines' : 'Only offer appointments on the hour'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {locale === 'fr' ? 'Ex : 9:00, 10:00, 11:00 — jamais 9:30 ou 10:30.' : 'e.g. 9:00, 10:00, 11:00 — never 9:30 or 10:30.'}
                        </p>
                      </div>
                    </label>
                  </div>
                    </>
                  )}

                  {/* Patient modification settings */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {locale === 'fr' ? 'Modifications par le patient' : 'Patient modifications'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {locale === 'fr' ? 'Autorisez vos patients à gérer leurs rendez-vous eux-mêmes' : 'Let your patients manage their own appointments'}
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.allow_patient_cancel ? 'bg-teal-600' : 'bg-gray-300'}`}
                          onClick={() =>
                            setBookingSettings((prev: any) => ({
                              ...prev!,
                              allow_patient_cancel: !prev?.allow_patient_cancel,
                            }))
                          }
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.allow_patient_cancel ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Autoriser le patient à annuler' : 'Allow patient to cancel'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === 'fr' ? 'Le patient peut annuler depuis son espace' : 'Patient can cancel from their booking page'}
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${(bookingSettings as any)?.allow_patient_reschedule ? 'bg-teal-600' : 'bg-gray-300'}`}
                          onClick={() =>
                            setBookingSettings((prev: any) => ({
                              ...prev!,
                              allow_patient_reschedule: !prev?.allow_patient_reschedule,
                            }))
                          }
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(bookingSettings as any)?.allow_patient_reschedule ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                        <div>
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Autoriser le patient à reprogrammer' : 'Allow patient to reschedule'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {locale === 'fr' ? 'Le patient peut choisir un nouveau créneau' : 'Patient can pick a new time slot'}
                          </p>
                        </div>
                      </label>
                      {((bookingSettings as any)?.allow_patient_cancel || (bookingSettings as any)?.allow_patient_reschedule) && (
                        <div className="pl-13">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'fr' ? 'Délai minimum pour modifications' : 'Minimum notice for changes'}
                          </label>
                          <select
                            value={(bookingSettings as any)?.modification_notice_hours ?? 48}
                            onChange={(e) =>
                              setBookingSettings((prev: any) => ({
                                ...prev!,
                                modification_notice_hours: parseInt(e.target.value),
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value={12}>12 {locale === 'fr' ? 'heures' : 'hours'}</option>
                            <option value={24}>24 {locale === 'fr' ? 'heures' : 'hours'}</option>
                            <option value={48}>48 {locale === 'fr' ? 'heures' : 'hours'}</option>
                            <option value={72}>72 {locale === 'fr' ? 'heures' : 'hours'}</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      console.log('[SAVE BUTTON CLICKED]')
                      handleSaveBookingSettings()
                    }}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {locale === 'fr' ? 'Enregistrer' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
              </>)}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setRescheduleBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Reprogrammer la séance' : 'Reschedule session'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {rescheduleBooking.client_name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'fr' ? 'Nouvelle date' : 'New date'}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value)
                    loadRescheduleSlots(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'fr' ? 'Créneau disponible' : 'Available slot'}
                  </label>
                  {isLoadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'fr' ? 'Chargement...' : 'Loading...'}
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      {locale === 'fr' ? 'Aucun créneau disponible' : 'No available slots'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {rescheduleSlots.map((slot) => {
                        const time = new Date(slot.slot_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        return (
                          <button
                            key={slot.slot_start}
                            onClick={() => setRescheduleTime(slot.slot_start)}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              rescheduleTime === slot.slot_start
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'fr' ? 'Raison (optionnel)' : 'Reason (optional)'}
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder={locale === 'fr' ? 'Ex: conflit d\'horaire' : 'e.g. scheduling conflict'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRescheduleBooking(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleReschedule}
                disabled={!rescheduleTime || processingId === rescheduleBooking.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === rescheduleBooking.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {locale === 'fr' ? 'Reprogrammer' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Saved Confirmation Modal */}
      {showSettingsSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowSettingsSavedModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Paramètres enregistrés' : 'Settings Saved'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr' ? 'Vos types de séance ont été mis à jour.' : 'Your session types have been updated.'}
            </p>
            <button
              onClick={() => setShowSettingsSavedModal(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {locale === 'fr' ? 'Compris' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Availability Saved Confirmation Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowSavedModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Disponibilités enregistrées' : 'Availability Saved'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr' ? 'Vos horaires ont été mis à jour avec succès.' : 'Your schedule has been updated successfully.'}
            </p>
            <button
              onClick={() => setShowSavedModal(false)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {locale === 'fr' ? 'Compris' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
