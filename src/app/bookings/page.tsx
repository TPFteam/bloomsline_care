'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
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
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns'
import {
  getCalendarConnection,
  disconnectCalendar,
  getAvailabilitySchedules,
  bulkUpdateAvailability,
  getBookingSettings,
  saveBookingSettings,
} from '@/lib/services/calendar'
import type { CalendarConnection, BookingSettings, DayOfWeek, SessionType } from '@/types/calendar'

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
  created_at: string
}

type MainTab = 'appointments' | 'settings'
type AppointmentFilter = 'pending' | 'upcoming' | 'past' | 'all'

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
    bg: 'bg-lavender-100/80',
    text: 'text-lavender-700',
    border: 'border-lavender-200',
    iconBg: 'from-lavender-400 to-lavender-600',
    cardBg: 'from-lavender-50/30 to-white',
  },
  no_show: {
    bg: 'bg-gray-100/80',
    text: 'text-gray-600',
    border: 'border-gray-200',
    iconBg: 'from-gray-400 to-gray-600',
    cardBg: 'from-gray-50/30 to-white',
  },
}

const STATUS_LABELS = {
  pending: 'Pending Approval',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
}

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const DEFAULT_SESSION_TYPES: SessionType[] = [
  { id: 'initial', name: 'Initial Consultation', duration: 60, price: null },
  { id: 'follow_up', name: 'Follow-up Session', duration: 50, price: null },
  { id: 'check_in', name: 'Check-in', duration: 30, price: null },
]

interface AvailabilitySlot {
  day: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
}

export default function BookingsPage() {
  const { t } = useLanguage()

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>('appointments')

  // Appointments state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // Load all data
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setUserId(user.id)

      // Load practitioner profile to get slug
      const { data: profile } = await supabase
        .from('practitioner_profiles')
        .select('slug')
        .eq('user_id', user.id)
        .single()

      if (profile?.slug) {
        setPractitionerSlug(profile.slug)
      }

      // Load booking settings to get session types
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', user.id)
        .single()

      if (settings?.session_types) {
        setSessionTypes(settings.session_types as SessionType[])
      }

      // Load bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', user.id)
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

      const schedules = await getAvailabilitySchedules()
      if (schedules.length > 0) {
        setAvailabilitySlots(
          schedules.map((s) => ({
            day: s.day_of_week,
            startTime: s.start_time.slice(0, 5),
            endTime: s.end_time.slice(0, 5),
            isActive: s.is_active,
          }))
        )
        setTimezone(schedules[0].timezone)
      } else {
        setAvailabilitySlots(
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => ({
            day: day as DayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          }))
        )
      }

      const bookingSettingsData = await getBookingSettings()
      setBookingSettings(bookingSettingsData)

      setIsLoadingSettings(false)
    }

    loadData()
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  // Get session type name
  const getSessionTypeName = (typeId: string) => {
    const type = sessionTypes.find(st => st.id === typeId)
    return type?.name || typeId
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const startTime = parseISO(booking.start_time)
    const now = new Date()

    switch (appointmentFilter) {
      case 'pending':
        return booking.status === 'pending'
      case 'upcoming':
        return (booking.status === 'confirmed' || booking.status === 'pending') && startTime > now
      case 'past':
        return startTime < now || booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show'
      case 'all':
      default:
        return true
    }
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

      setMessage({ type: 'success', text: `Booking marked as ${STATUS_LABELS[status].toLowerCase()}.` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update booking' })
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
      { day, startTime: '09:00', endTime: '17:00', isActive: true },
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
      }))
    )

    if (success) {
      setMessage({ type: 'success', text: 'Availability saved!' })
    } else {
      setMessage({ type: 'error', text: 'Failed to save availability' })
    }
    setIsSavingAvailability(false)
  }

  const handleSaveBookingSettings = async () => {
    if (!userId) return

    setIsSavingSettings(true)
    const saved = await saveBookingSettings({
      user_id: userId,
      default_duration: bookingSettings?.default_duration || 60,
      buffer_before: bookingSettings?.buffer_before || 0,
      buffer_after: bookingSettings?.buffer_after || 15,
      min_notice_hours: bookingSettings?.min_notice_hours || 24,
      max_advance_days: bookingSettings?.max_advance_days || 60,
      session_types: bookingSettings?.session_types || DEFAULT_SESSION_TYPES,
      booking_page_enabled: bookingSettings?.booking_page_enabled ?? true,
      require_approval: bookingSettings?.require_approval ?? false,
      email_notifications: bookingSettings?.email_notifications ?? true,
    })

    if (saved) {
      setBookingSettings(saved)
      setMessage({ type: 'success', text: 'Booking settings saved!' })
    } else {
      setMessage({ type: 'error', text: 'Failed to save booking settings' })
    }
    setIsSavingSettings(false)
  }

  const getSlotsForDay = (day: DayOfWeek) => {
    return availabilitySlots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.day === day)
  }

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-coral-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Link href="/dashboard">
          <motion.button
            whileHover={{ x: -2 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.dashboard.backToDashboard}
          </motion.button>
        </Link>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-lavender-600 to-mint-600 bg-clip-text text-transparent">Bookings</span>
              </h1>
              <p className="text-gray-500">Manage appointments and booking settings</p>
            </div>
            {pendingCount > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-md shadow-amber-200/50"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">{pendingCount} pending</span>
              </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg shadow-gray-200/40 border border-white/60 inline-flex"
          >
            <button
              onClick={() => setMainTab('appointments')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                mainTab === 'appointments'
                  ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-md shadow-lavender-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Appointments
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
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                mainTab === 'settings'
                  ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-md shadow-lavender-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </motion.div>

          {/* Appointments Tab Content */}
          {mainTab === 'appointments' && (
            <>
              {/* Sub Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-2 flex-wrap"
              >
                {(['pending', 'upcoming', 'past', 'all'] as AppointmentFilter[]).map((tab) => {
                  const isActive = appointmentFilter === tab

                  return (
                    <motion.button
                      key={tab}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAppointmentFilter(tab)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white shadow-md shadow-gray-200/50 text-gray-900 border border-gray-100'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'pending' && pendingCount > 0 && (
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {pendingCount}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>

              {/* Bookings List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-12 shadow-lg shadow-gray-200/40 border border-white/60 border-dashed text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-lavender-100/80 flex items-center justify-center mx-auto mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-md">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium">
                    {appointmentFilter === 'pending'
                      ? 'No pending booking requests'
                      : appointmentFilter === 'upcoming'
                      ? 'No upcoming appointments'
                      : appointmentFilter === 'past'
                      ? 'No past appointments'
                      : 'No bookings yet'}
                  </p>
                  {appointmentFilter === 'pending' && (
                    <p className="text-sm text-gray-400 mt-2">
                      New booking requests will appear here for your approval
                    </p>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking, index) => {
                    const startTime = parseISO(booking.start_time)
                    const isPastBooking = isPast(startTime) && booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'no_show'
                    const statusConfig = STATUS_CONFIG[booking.status]

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ y: -2 }}
                        className={`bg-gradient-to-r ${statusConfig.cardBg} backdrop-blur-xl rounded-[1.25rem] p-6 shadow-lg shadow-gray-200/40 border ${statusConfig.border} transition-all duration-300`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                          {/* Left Section - Client Avatar & Info */}
                          <div className="flex gap-4">
                            {/* Avatar */}
                            <div className={`w-14 h-14 rounded-2xl ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusConfig.iconBg} flex items-center justify-center shadow-md`}>
                                <User className="w-5 h-5 text-white" />
                              </div>
                            </div>

                            {/* Client Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {booking.client_name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                  {STATUS_LABELS[booking.status]}
                                </span>
                                {booking.google_event_id && (
                                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Synced
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5">
                                  <Mail className="w-4 h-4" />
                                  {booking.client_email}
                                </span>
                                {booking.client_phone && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone className="w-4 h-4" />
                                    {booking.client_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Date/Time & Actions */}
                          <div className="flex flex-col lg:items-end gap-4 lg:min-w-[200px]">
                            {/* Session Info Card */}
                            <div className="bg-white/60 rounded-xl px-4 py-3 space-y-1.5">
                              <p className="font-medium text-gray-900 text-sm">
                                {getSessionTypeName(booking.session_type)}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatBookingDate(booking.start_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                {format(parseISO(booking.start_time), 'h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApprove(booking.id)}
                                    disabled={processingId === booking.id}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl shadow-md shadow-emerald-200/50 hover:shadow-lg transition-all disabled:opacity-50"
                                  >
                                    {processingId === booking.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                    Approve
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleReject(booking.id)}
                                    disabled={processingId === booking.id}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                    Reject
                                  </motion.button>
                                </>
                              )}
                              {booking.status === 'confirmed' && isPastBooking && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleMarkStatus(booking.id, 'completed')}
                                    disabled={processingId === booking.id}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lavender-500 to-lavender-600 text-white text-sm font-medium rounded-xl shadow-md shadow-lavender-200/50 hover:shadow-lg transition-all disabled:opacity-50"
                                  >
                                    {processingId === booking.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    Completed
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleMarkStatus(booking.id, 'no_show')}
                                    disabled={processingId === booking.id}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    No Show
                                  </motion.button>
                                </>
                              )}
                              {booking.status === 'confirmed' && !isPastBooking && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleReject(booking.id)}
                                  disabled={processingId === booking.id}
                                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                                >
                                  {processingId === booking.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                  Cancel
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {booking.notes && (
                          <div className="mt-4 flex items-start gap-3 text-sm text-gray-600 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-400 mb-1">Client Notes</p>
                              <p className="text-gray-700">{booking.notes}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Settings Tab Content */}
          {mainTab === 'settings' && (
            <div className="space-y-6">
              {/* Booking Link */}
              {practitionerSlug && bookingSettings?.booking_page_enabled && (
                <Card className="border-lavender-200 bg-gradient-to-r from-lavender-50/50 to-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-lavender-600" />
                      Your Booking Link
                    </CardTitle>
                    <CardDescription>
                      Share this link with clients so they can book appointments with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white border rounded-lg px-4 py-2.5 font-mono text-sm text-gray-700 truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/p/${practitionerSlug}/book` : `/p/${practitionerSlug}/book`}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/p/${practitionerSlug}/book`)
                          setLinkCopied(true)
                          setTimeout(() => setLinkCopied(false), 2000)
                        }}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Link href={`/p/${practitionerSlug}/book`} target="_blank">
                        <Button variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Calendar Connection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Calendar Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your Google Calendar to sync appointments and show real-time availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSettings ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  ) : calendarConnection ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Google Calendar Connected</p>
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
                          'Disconnect'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleConnectGoogle} disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-2" />
                      )}
                      Connect Google Calendar
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Availability Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Availability Schedule
                  </CardTitle>
                  <CardDescription>
                    Set your weekly availability for client bookings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
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
                            <span className="font-medium">{DAY_LABELS[day]}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addAvailabilitySlot(day)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add slot
                            </Button>
                          </div>
                          {slots.length === 0 ? (
                            <p className="text-sm text-gray-500">Unavailable</p>
                          ) : (
                            <div className="space-y-2">
                              {slots.map((slot) => (
                                <div
                                  key={slot.index}
                                  className="flex items-center gap-3"
                                >
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) =>
                                      updateAvailabilitySlot(slot.index, 'startTime', e.target.value)
                                    }
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                  />
                                  <span className="text-gray-500">to</span>
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) =>
                                      updateAvailabilitySlot(slot.index, 'endTime', e.target.value)
                                    }
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                  />
                                  <button
                                    onClick={() => removeAvailabilitySlot(slot.index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
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
                    Save Availability
                  </Button>
                </CardContent>
              </Card>

              {/* Booking Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Preferences</CardTitle>
                  <CardDescription>
                    Configure how clients can book appointments with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Booking Page</p>
                      <p className="text-sm text-gray-500">
                        Allow clients to book appointments through your public profile
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setBookingSettings((prev) => ({
                          ...prev!,
                          booking_page_enabled: !prev?.booking_page_enabled,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        bookingSettings?.booking_page_enabled ? 'bg-lavender-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          bookingSettings?.booking_page_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Approval</p>
                      <p className="text-sm text-gray-500">
                        Manually approve booking requests before they are confirmed
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setBookingSettings((prev) => ({
                          ...prev!,
                          require_approval: !prev?.require_approval,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        bookingSettings?.require_approval ? 'bg-lavender-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          bookingSettings?.require_approval ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buffer before (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={bookingSettings?.buffer_before || 0}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            buffer_before: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buffer after (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={bookingSettings?.buffer_after || 15}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            buffer_after: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum notice (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={bookingSettings?.min_notice_hours || 24}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            min_notice_hours: parseInt(e.target.value) || 24,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max advance booking (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={bookingSettings?.max_advance_days || 60}
                        onChange={(e) =>
                          setBookingSettings((prev) => ({
                            ...prev!,
                            max_advance_days: parseInt(e.target.value) || 60,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveBookingSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
