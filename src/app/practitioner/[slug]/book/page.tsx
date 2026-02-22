'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Mail, Phone, FileText, ChevronLeft, ChevronRight, Check, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import {
  getPractitionerBookingInfo,
} from '@/lib/services/calendar'
import type { BookingSettings, SessionType, TimeSlot } from '@/types/calendar'

interface PractitionerInfo {
  profile: {
    id: string
    user_id: string
    slug: string
    headline: string | null
    bio: string | null
    specialties: string[]
    offers_telehealth: boolean
    offers_in_person: boolean
  }
  settings: BookingSettings
  user: {
    full_name: string
    avatar_url: string | null
  }
}

type Step = 'service' | 'datetime' | 'details' | 'confirm'

const STEP_ORDER: Step[] = ['service', 'datetime', 'details', 'confirm']

const STEP_LABELS: Record<Step, string> = {
  service: 'Service',
  datetime: 'Date & Time',
  details: 'Details',
  confirm: 'Confirm',
}

export default function BookingPage() {
  const params = useParams()
  const slug = params.slug as string

  // State
  const [practitioner, setPractitioner] = useState<PractitionerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Booking flow state
  const [currentStep, setCurrentStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<SessionType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [practitionerTimezone, setPractitionerTimezone] = useState<string | null>(null)

  // Timezone helpers
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isSameTimezone = practitionerTimezone === clientTimezone

  // Form state
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [calendarSynced, setCalendarSynced] = useState(false)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Load practitioner info
  useEffect(() => {
    async function loadPractitioner() {
      setIsLoading(true)
      const info = await getPractitionerBookingInfo(slug)

      if (!info || !info.profile || !info.settings) {
        setError('This practitioner is not accepting bookings at this time.')
        setIsLoading(false)
        return
      }

      setPractitioner(info as PractitionerInfo)
      setIsLoading(false)
    }

    loadPractitioner()
  }, [slug])

  // Load available slots when date changes
  useEffect(() => {
    async function loadSlots() {
      if (!selectedDate || !practitioner || !selectedService) return

      setIsLoadingSlots(true)
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      try {
        const res = await fetch(
          `/api/bookings/available-slots?practitionerId=${practitioner.profile.user_id}&date=${dateStr}&duration=${selectedService.duration}`
        )
        const data = await res.json()
        setAvailableSlots(data.slots || [])
        if (data.practitionerTimezone) {
          setPractitionerTimezone(data.practitionerTimezone)
        }
      } catch {
        setAvailableSlots([])
      }
      setSelectedSlot(null)
      setIsLoadingSlots(false)
    }

    loadSlots()
  }, [selectedDate, practitioner, selectedService])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) return true

    if (practitioner?.settings?.max_advance_days) {
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + practitioner.settings.max_advance_days)
      if (date > maxDate) return true
    }

    return false
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatTimeInZone = (isoString: string, timezone: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    })
  }

  const getShortTzName = (timezone: string) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short',
      }).formatToParts(new Date())
      return parts.find(p => p.type === 'timeZoneName')?.value || timezone
    } catch {
      return timezone
    }
  }

  const getTzCity = (timezone: string) => {
    const city = timezone.split('/').pop()
    return city ? city.replace(/_/g, ' ') : null
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Navigation
  const goToStep = (step: Step) => {
    setCurrentStep(step)
  }

  const goNext = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1])
    }
  }

  const goBack = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
    }
  }

  // Submit booking
  const handleSubmit = async () => {
    if (!practitioner || !selectedService || !selectedSlot) return

    setIsSubmitting(true)
    setBookingError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practitioner_id: practitioner.profile.user_id,
          session_type: selectedService.id,
          start_time: selectedSlot.slot_start,
          end_time: selectedSlot.slot_end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      setCalendarSynced(data.calendarSynced === true)
      setBookingComplete(true)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return !!selectedService
      case 'datetime':
        return !!selectedDate && !!selectedSlot
      case 'details':
        return clientName.trim() !== '' && clientEmail.trim() !== '' && clientEmail.includes('@')
      case 'confirm':
        return true
      default:
        return false
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-600 font-medium">Loading booking page...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error || !practitioner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-xl max-w-md mx-4"
        >
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Booking Unavailable</h2>
          <p className="text-gray-600">{error || 'This practitioner is not accepting bookings.'}</p>
        </motion.div>
      </div>
    )
  }

  // Booking complete state
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50">
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/">
              <Logo size="md" showText />
            </Link>
          </div>
        </header>

        <div className="flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white/60 overflow-hidden"
          >
            <div className="p-8 sm:p-10 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {practitioner.settings.require_approval ? 'Request Submitted!' : 'Booking Confirmed!'}
              </h2>
              <p className="text-gray-600 mb-8">
                {practitioner.settings.require_approval
                  ? 'Your booking request has been submitted and is awaiting confirmation.'
                  : 'Your appointment has been confirmed.'}
              </p>
              {calendarSynced && (
                <p className="text-sm text-emerald-600 mb-6">
                  A calendar invite has been sent to {clientEmail}
                </p>
              )}
              {!calendarSynced && !practitioner.settings.require_approval && (
                <p className="text-sm text-gray-500 mb-6">
                  Please save this appointment to your calendar manually.
                </p>
              )}

              <div className="bg-gray-50/80 rounded-xl p-5 text-left space-y-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedService?.name}</p>
                    <p className="text-sm text-gray-500">{selectedService?.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedDate && formatDate(selectedDate)}</p>
                    <p className="text-sm text-gray-500">
                      {selectedSlot && formatTime(selectedSlot.slot_start)}
                      {practitionerTimezone && (
                        <> {getShortTzName(clientTimezone)}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="w-4.5 h-4.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{practitioner.user?.full_name || 'Practitioner'}</p>
                    {practitioner.profile.headline && (
                      <p className="text-sm text-gray-500">{practitioner.profile.headline}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const sessionTypes = practitioner.settings.session_types as SessionType[]
  const currentStepIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/practitioner/${slug}`}>
              <Logo size="md" showText />
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Sidebar — Practitioner Info */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:w-80 shrink-0"
          >
            <div className="lg:sticky lg:top-24">
              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white/60 overflow-hidden">
                                <div className="p-6 text-center">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-br from-teal-300/20 to-teal-500/20 rounded-[1.5rem] blur-lg" />
                      <div className="relative w-24 h-24 rounded-[1.25rem] bg-gradient-to-br from-teal-100 via-teal-50 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-3xl shadow-lg border-2 border-white overflow-hidden">
                        {practitioner.user?.avatar_url ? (
                          <img
                            src={practitioner.user.avatar_url}
                            alt={practitioner.user.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          practitioner.user?.full_name?.charAt(0) || 'P'
                        )}
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{practitioner.user?.full_name || 'Practitioner'}</h2>
                  {practitioner.profile.headline && (
                    <p className="text-gray-500 mt-1 italic text-sm">{practitioner.profile.headline}</p>
                  )}

                  {/* Bio */}
                  {practitioner.profile.bio && (
                    <p className="text-sm text-gray-600 mt-4 leading-relaxed text-left line-clamp-4">
                      {practitioner.profile.bio}
                    </p>
                  )}

                  {/* Specialties */}
                  {practitioner.profile.specialties && practitioner.profile.specialties.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-left">Specialties</p>
                      <div className="flex flex-wrap gap-1.5">
                        {practitioner.profile.specialties.slice(0, 6).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100"
                          >
                            {specialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modalities */}
                  {(practitioner.profile.offers_telehealth || practitioner.profile.offers_in_person) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-center">
                      {practitioner.profile.offers_telehealth && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                          Video
                        </span>
                      )}
                      {practitioner.profile.offers_in_person && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                          In-Person
                        </span>
                      )}
                    </div>
                  )}

                  {/* View Profile Link */}
                  <Link
                    href={`/practitioner/${slug}`}
                    className="mt-5 block text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    View full profile
                  </Link>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Right Side — Booking Flow */}
          <div className="flex-1 min-w-0">
            {/* Mobile-only practitioner header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 lg:hidden"
            >
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-br from-teal-300/20 to-teal-500/20 rounded-[1.5rem] blur-lg" />
                  <div className="relative w-16 h-16 rounded-[1rem] bg-gradient-to-br from-teal-100 via-teal-50 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-xl shadow-lg border-2 border-white overflow-hidden">
                    {practitioner.user?.avatar_url ? (
                      <img
                        src={practitioner.user.avatar_url}
                        alt={practitioner.user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      practitioner.user?.full_name?.charAt(0) || 'P'
                    )}
                  </div>
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{practitioner.user?.full_name || 'Practitioner'}</h1>
              {practitioner.profile.headline && (
                <p className="text-gray-500 mt-0.5 italic text-sm">{practitioner.profile.headline}</p>
              )}
            </motion.div>

            {/* Progress Steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center justify-center mb-6"
            >
              {STEP_ORDER.map((step, index) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => {
                      if (index <= currentStepIndex) goToStep(step)
                    }}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        currentStepIndex > index
                          ? 'bg-teal-500 text-white shadow-md shadow-teal-200/50'
                          : currentStepIndex === index
                          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200/50'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {currentStepIndex > index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      currentStepIndex >= index ? 'text-teal-600' : 'text-gray-400'
                    }`}>
                      {STEP_LABELS[step]}
                    </span>
                  </button>
                  {index < STEP_ORDER.length - 1 && (
                    <div
                      className={`w-10 sm:w-14 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors ${
                        currentStepIndex > index
                          ? 'bg-teal-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </motion.div>

            {/* Main Card */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white/60 overflow-hidden"
            >
          
          <div className="p-6 sm:p-8">
            {/* Step Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentStep === 'service' && 'Select a Service'}
                {currentStep === 'datetime' && 'Choose Date & Time'}
                {currentStep === 'details' && 'Your Details'}
                {currentStep === 'confirm' && 'Confirm Booking'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep === 'service' && 'Choose the type of session you\'d like to book'}
                {currentStep === 'datetime' && 'Pick an available time that works for you'}
                {currentStep === 'details' && 'We\'ll use this to confirm your appointment'}
                {currentStep === 'confirm' && 'Review everything before confirming'}
              </p>
            </div>

            {/* Service Selection */}
            {currentStep === 'service' && (
              <div className="space-y-3">
                {sessionTypes.map((service, i) => (
                  <motion.button
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedService(service)}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                      selectedService?.id === service.id
                        ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-100/50'
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedService?.id === service.id
                            ? 'bg-teal-100'
                            : 'bg-gray-50'
                        }`}>
                          <Clock className={`w-5 h-5 ${
                            selectedService?.id === service.id
                              ? 'text-teal-500'
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.duration} minutes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {service.price && (
                          <p className="font-semibold text-gray-900">${service.price}</p>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedService?.id === service.id
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedService?.id === service.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Date & Time Selection */}
            {currentStep === 'datetime' && (
              <div className="space-y-6">
                {/* Calendar */}
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                        )
                      }
                      className="p-2 hover:bg-white rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h3 className="font-semibold text-gray-900">
                      {currentMonth.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h3>
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                        )
                      }
                      className="p-2 hover:bg-white rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(currentMonth).map((date, index) => (
                      <div key={index}>
                        {date ? (
                          <button
                            onClick={() => setSelectedDate(date)}
                            disabled={isDateDisabled(date)}
                            className={`w-full aspect-square flex items-center justify-center text-sm rounded-xl transition-all ${
                              selectedDate?.toDateString() === date.toDateString()
                                ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold shadow-md shadow-teal-200/50'
                                : isDateDisabled(date)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-white hover:shadow-sm font-medium'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        ) : (
                          <div className="aspect-square" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Available times for {formatDateShort(selectedDate)}
                    </h4>
                    {isLoadingSlots ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Clock className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm">No available times on this date.</p>
                        <p className="text-gray-400 text-xs mt-1">Please select another day.</p>
                      </div>
                    ) : (
                      <>
                        {practitionerTimezone && (
                          <div className={`flex items-start gap-2.5 p-3 rounded-xl text-sm mb-4 ${
                            isSameTimezone ? 'bg-gray-50 text-gray-600 border border-gray-100' : 'bg-blue-50/80 text-blue-700 border border-blue-100'
                          }`}>
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>
                              {isSameTimezone
                                ? `You and the practitioner are both in ${getShortTzName(clientTimezone)}${getTzCity(clientTimezone) ? ` (${getTzCity(clientTimezone)})` : ''}.`
                                : `Times shown in your timezone (${getShortTzName(clientTimezone)}${getTzCity(clientTimezone) ? ` \u2013 ${getTzCity(clientTimezone)}` : ''}). Practitioner is in ${getShortTzName(practitionerTimezone)}${getTzCity(practitionerTimezone) ? ` \u2013 ${getTzCity(practitionerTimezone)}` : ''}.`
                              }
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.slot_start}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 text-sm rounded-xl border-2 transition-all ${
                                selectedSlot?.slot_start === slot.slot_start
                                  ? 'border-teal-500 bg-teal-50/50 text-teal-700 shadow-md shadow-teal-100/50 font-medium'
                                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm text-gray-700'
                              }`}
                            >
                              <span>
                                {formatTime(slot.slot_start)}
                                {isSameTimezone && practitionerTimezone && (
                                  <span className="text-xs text-gray-400 ml-1">{getShortTzName(clientTimezone)}</span>
                                )}
                              </span>
                              {!isSameTimezone && practitionerTimezone && (
                                <span className="block text-xs text-gray-400 mt-0.5">
                                  {formatTimeInZone(slot.slot_start, practitionerTimezone)} {getShortTzName(practitionerTimezone)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Client Details */}
            {currentStep === 'details' && (
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow bg-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow bg-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow bg-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything you'd like the practitioner to know..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow resize-none bg-white placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Confirmation */}
            {currentStep === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-gray-50/80 rounded-xl p-5 space-y-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-4.5 h-4.5 text-teal-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedService?.name}</p>
                      <p className="text-sm text-gray-500">{selectedService?.duration} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      <Clock className="w-4.5 h-4.5 text-teal-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedDate && formatDate(selectedDate)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedSlot && formatTime(selectedSlot.slot_start)}
                        {practitionerTimezone && (
                          <> {getShortTzName(clientTimezone)}</>
                        )}
                      </p>
                      {!isSameTimezone && practitionerTimezone && selectedSlot && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTimeInZone(selectedSlot.slot_start, practitionerTimezone)} {getShortTzName(practitionerTimezone)} for practitioner
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{clientName}</p>
                      <p className="text-sm text-gray-500">{clientEmail}</p>
                      {clientPhone && (
                        <p className="text-sm text-gray-500">{clientPhone}</p>
                      )}
                    </div>
                  </div>
                  {notes && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {bookingError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
                    {bookingError}
                  </div>
                )}

                {practitioner.settings.cancellation_policy && (
                  <div className="text-sm text-gray-500 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <p className="font-medium text-gray-700 mb-1">Cancellation Policy</p>
                    <p>{practitioner.settings.cancellation_policy}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep !== 'service' ? (
                <Button variant="outline" onClick={goBack} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep === 'confirm' ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-teal-200/50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Confirm Booking
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:shadow-none"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
            </motion.div>
          </div>

        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10 py-6"
        >
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <Link href="/" className="text-teal-500 hover:text-teal-600 font-medium">
              Bloomsline Care
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
