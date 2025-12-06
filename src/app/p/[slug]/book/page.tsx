'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Clock, User, Mail, Phone, FileText, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getPractitionerBookingInfo,
  getAvailabilitySchedules,
  getAvailableSlots,
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
      const dateStr = selectedDate.toISOString().split('T')[0]
      const slots = await getAvailableSlots(
        practitioner.profile.user_id,
        dateStr,
        selectedService.duration
      )
      setAvailableSlots(slots)
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

    // Add empty days for alignment
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Past dates
    if (date < today) return true

    // Beyond max advance days
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
      <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-lavender-600" />
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !practitioner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Booking Unavailable</h2>
            <p className="text-gray-600">{error || 'This practitioner is not accepting bookings.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Booking complete state
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-4">
              {practitioner.settings.require_approval
                ? 'Your booking request has been submitted and is awaiting confirmation.'
                : 'Your appointment has been confirmed.'}
            </p>
            {calendarSynced && (
              <p className="text-sm text-green-600 mb-4">
                A calendar invite has been sent to {clientEmail}
              </p>
            )}
            {!calendarSynced && !practitioner.settings.require_approval && (
              <p className="text-sm text-gray-500 mb-4">
                Please save this appointment to your calendar manually.
              </p>
            )}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <p>
                <span className="font-medium">Service:</span> {selectedService?.name}
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {selectedDate && formatDate(selectedDate)}
              </p>
              <p>
                <span className="font-medium">Time:</span>{' '}
                {selectedSlot && formatTime(selectedSlot.slot_start)}
              </p>
              <p>
                <span className="font-medium">With:</span> {practitioner.user.full_name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sessionTypes = practitioner.settings.session_types as SessionType[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {practitioner.user.avatar_url ? (
            <img
              src={practitioner.user.avatar_url}
              alt={practitioner.user.full_name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-lavender-600" />
            </div>
          )}
          <h1 className="text-2xl font-bold">{practitioner.user.full_name}</h1>
          {practitioner.profile.headline && (
            <p className="text-gray-600 mt-1">{practitioner.profile.headline}</p>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          {STEP_ORDER.map((step, index) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => {
                  const currentIndex = STEP_ORDER.indexOf(currentStep)
                  if (index <= currentIndex) goToStep(step)
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  STEP_ORDER.indexOf(currentStep) >= index
                    ? 'bg-lavender-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </button>
              {index < STEP_ORDER.length - 1 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    STEP_ORDER.indexOf(currentStep) > index
                      ? 'bg-lavender-600'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 'service' && 'Select a Service'}
              {currentStep === 'datetime' && 'Choose Date & Time'}
              {currentStep === 'details' && 'Your Details'}
              {currentStep === 'confirm' && 'Confirm Booking'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'service' && 'Choose the type of session you would like to book'}
              {currentStep === 'datetime' && 'Select an available time slot'}
              {currentStep === 'details' && 'Enter your contact information'}
              {currentStep === 'confirm' && 'Review and confirm your booking'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Service Selection */}
            {currentStep === 'service' && (
              <div className="space-y-3">
                {sessionTypes.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedService?.id === service.id
                        ? 'border-lavender-600 bg-lavender-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.duration} minutes</p>
                      </div>
                      {service.price && (
                        <p className="font-semibold">${service.price}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Date & Time Selection */}
            {currentStep === 'datetime' && (
              <div className="space-y-6">
                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                        )
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-semibold">
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
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(currentMonth).map((date, index) => (
                      <div key={index}>
                        {date ? (
                          <button
                            onClick={() => setSelectedDate(date)}
                            disabled={isDateDisabled(date)}
                            className={`w-full p-2 text-sm rounded-lg transition-colors ${
                              selectedDate?.toDateString() === date.toDateString()
                                ? 'bg-lavender-600 text-white'
                                : isDateDisabled(date)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        ) : (
                          <div className="p-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <h4 className="font-medium mb-3">
                      Available times for {formatDate(selectedDate)}
                    </h4>
                    {isLoadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-lavender-600" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No available times on this date. Please select another day.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.slot_start}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 text-sm rounded-lg border transition-colors ${
                              selectedSlot?.slot_start === slot.slot_start
                                ? 'border-lavender-600 bg-lavender-50 text-lavender-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {formatTime(slot.slot_start)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Client Details */}
            {currentStep === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything you'd like the practitioner to know..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Confirmation */}
            {currentStep === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedService?.name}</p>
                      <p className="text-sm text-gray-500">{selectedService?.duration} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {selectedDate && formatDate(selectedDate)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedSlot && formatTime(selectedSlot.slot_start)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{clientName}</p>
                      <p className="text-sm text-gray-500">{clientEmail}</p>
                      {clientPhone && (
                        <p className="text-sm text-gray-500">{clientPhone}</p>
                      )}
                    </div>
                  </div>
                  {notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">{notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {bookingError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    {bookingError}
                  </div>
                )}

                {practitioner.settings.cancellation_policy && (
                  <div className="text-sm text-gray-500">
                    <p className="font-medium mb-1">Cancellation Policy</p>
                    <p>{practitioner.settings.cancellation_policy}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep !== 'service' ? (
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep === 'confirm' ? (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Confirm Booking
                </Button>
              ) : (
                <Button onClick={goNext} disabled={!canProceed()}>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
