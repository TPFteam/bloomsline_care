'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Mail, Phone, FileText, ChevronLeft, ChevronRight, Check, Loader2, Info, Building2, Video, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { PhoneInput } from '@/components/ui/phone-input'
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
    city: string | null
    country: string | null
    address: string | null
    google_maps_url: string | null
  }
  settings: BookingSettings
  user: {
    full_name: string
    avatar_url: string | null
    preferred_language?: string
  }
  activeDays?: number[]
  availableFormats?: string[]
  dayFormats?: Record<string, string[]>
}

type Step = 'schedule' | 'details'

const STEP_ORDER: Step[] = ['schedule', 'details']

const STEP_LABELS: Record<string, Record<Step, string>> = {
  en: { schedule: 'Schedule', details: 'Your details' },
  fr: { schedule: 'Planifier', details: 'Vos coordonnées' },
}

const t = (locale: string, translations: Record<string, string>) =>
  translations[locale] || translations['en']

const SPECIALTY_FR: Record<string, string> = {
  stress_anxiety: 'Stress / Anxiété',
  confidence_esteem: 'Confiance / Estime',
  emotional_regulation: 'Gestion des émotions',
  relationships: 'Relations',
  work_career: 'Travail / Carrière',
  burnout: 'Burn-out',
  decision_making: 'Prise de décision',
  life_transitions: 'Transition de vie',
  nutrition: 'Nutrition',
  grief_loss: 'Deuil / Perte',
  trauma: 'Trauma',
  parenting: 'Parentalité',
  addiction: 'Addiction',
  sleep: 'Troubles du sommeil',
  anxiety: 'Anxiété',
  depression: 'Dépression',
  couples: 'Couple',
  lgbtq: 'LGBTQ+',
  other: 'Autre',
}

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  // Embed mode: ?embed=1 (and optional ?primary=#hex for accent override).
  // When embedded, we drop the Bloomsline header + sidebar + background gradient
  // so the booking flow blends into the host site, and post heights to the parent
  // window so a JS-aware embed snippet can auto-resize the iframe.
  const embedMode = searchParams.get('embed') === '1'
  const primaryColorOverride = searchParams.get('primary') // e.g. "#4A9A86"
  const hideSidebar = embedMode || searchParams.get('hideSidebar') === '1'
  const containerRef = useRef<HTMLDivElement | null>(null)

  // State
  const [practitioner, setPractitioner] = useState<PractitionerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Booking flow state
  const [currentStep, setCurrentStep] = useState<Step>('schedule')
  const [selectedService, setSelectedService] = useState<SessionType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<'in_person' | 'video' | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [practitionerTimezone, setPractitionerTimezone] = useState<string | null>(null)

  // Timezone helpers
  const [clientTimezone, setClientTimezone] = useState<string>('UTC')
  useEffect(() => { setClientTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) }, [])
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

  // Date view mode
  const [dateViewMode, setDateViewMode] = useState<'calendar' | 'quick'>('calendar')
  const [quickDays, setQuickDays] = useState<{ date: string; dayLabel: string; slots: TimeSlot[] }[]>([])
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickExpandedDate, setQuickExpandedDate] = useState<string | null>(null)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Locale: prefer the dedicated booking-page setting; fall back to the
  // practitioner's dashboard language so existing pages keep working.
  const locale = (() => {
    const explicit = (practitioner as any)?.settings?.booking_page_language as string | null | undefined
    if (explicit === 'fr') return 'fr'
    if (explicit === 'en') return 'en'
    return practitioner?.user?.preferred_language === 'fr' ? 'fr' : 'en'
  })()

  // Pick the service name in the active locale, falling back to default name.
  // Mirrors the practitioner-side getSessionTypeName() helper in bookings/page.tsx
  // so built-in service IDs / English-only names still translate to French.
  const lockedNameFr: Record<string, string> = {
    initial: 'Consultation initiale',
    follow_up: 'Séance de suivi',
    check_in: 'Point de situation',
    'Initial Consultation': 'Consultation initiale',
    'Follow-up Session': 'Séance de suivi',
    'Follow-up': 'Séance de suivi',
    'Check-in': 'Point de situation',
  }
  const getServiceName = (svc: { id?: string; name: string; name_fr?: string } | null | undefined) => {
    if (!svc) return ''
    if (locale === 'fr') {
      if (svc.name_fr && svc.name_fr.trim()) return svc.name_fr
      if (svc.id && lockedNameFr[svc.id]) return lockedNameFr[svc.id]
      if (svc.name && lockedNameFr[svc.name]) return lockedNameFr[svc.name]
    }
    return svc.name
  }

  // Load practitioner info via API route (bypasses RLS for user data)
  useEffect(() => {
    async function loadPractitioner() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/practitioner/booking-info?slug=${encodeURIComponent(slug)}`)
        const info = await res.json()

        if (!info || !info.profile || !info.settings) {
          setError('This practitioner is not accepting bookings at this time.')
          setIsLoading(false)
          return
        }

        // Redirect to external booking system if configured
        if (info.settings.external_booking_url) {
          window.location.href = info.settings.external_booking_url
          return
        }

        console.log('[book] activeDays:', info.activeDays, 'dayFormats:', info.dayFormats, 'availableFormats:', info.availableFormats)
        setPractitioner(info as PractitionerInfo)

        // Auto-pick when there's only one option for service or format —
        // no reason to make the patient click a single-option list.
        const services = (info.settings?.session_types || []) as SessionType[]
        if (services.length === 1) setSelectedService(services[0])
        const formats: string[] = info.availableFormats || []
        if (formats.length === 1) {
          setSelectedFormat(formats[0] === 'in_person' ? 'in_person' : 'video')
        }
      } catch {
        setError('Failed to load practitioner information.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPractitioner()
  }, [slug])

  // Embed mode: continuously report the document body height to the parent
  // window via postMessage so a JS-aware embed snippet can auto-resize the
  // iframe to fit the content. ResizeObserver fires whenever the booking
  // form's height changes (step change, calendar expand, error, etc.).
  useEffect(() => {
    if (!embedMode || typeof window === 'undefined') return
    const post = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      )
      try {
        window.parent.postMessage({ type: 'bloomsline:embed:height', height: h }, '*')
      } catch { /* parent blocked — ignore */ }
    }
    post()
    const ro = new ResizeObserver(() => post())
    ro.observe(document.body)
    const interval = window.setInterval(post, 1000)
    return () => {
      ro.disconnect()
      window.clearInterval(interval)
    }
  }, [embedMode])

  // Load available slots when date changes
  useEffect(() => {
    async function loadSlots() {
      if (!selectedDate || !practitioner || !selectedService) return

      setIsLoadingSlots(true)
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      try {
        const res = await fetch(
          `/api/bookings/available-slots?practitionerId=${practitioner.profile.user_id}&date=${dateStr}&duration=${selectedService.duration}${selectedFormat ? `&format=${selectedFormat}` : ''}`
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
  }, [selectedDate, practitioner, selectedService, selectedFormat])

  // Constrain the format to the chosen session type's configured formats
  // (intersected with what the practitioner offers). Default to in-person when
  // both are possible; auto-select (and lock) when only one applies. Runs when
  // the patient picks a different session type.
  useEffect(() => {
    if (!selectedService) return
    const stf = selectedService.sessionFormat || 'both'
    let allowed: ('in_person' | 'video')[] = stf === 'both' ? ['in_person', 'video'] : [stf]
    const offered = practitioner?.availableFormats
    if (offered) allowed = allowed.filter(f => offered.includes(f))
    if (allowed.length === 0) return
    if (!selectedFormat || !allowed.includes(selectedFormat)) {
      setSelectedFormat(allowed.includes('in_person') ? 'in_person' : allowed[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, practitioner])

  // When the format changes, drop any previously-picked date/slot that doesn't fit
  // (e.g. user picked a Thursday for Video, then went back and switched to In-person
  // which is only on Mondays) — and jump the calendar to a month that has availability.
  useEffect(() => {
    if (!selectedFormat || !practitioner?.dayFormats) return
    if (selectedDate) {
      const dayFmts = practitioner.dayFormats[String(selectedDate.getDay())]
      if (!dayFmts || !dayFmts.includes(selectedFormat)) {
        setSelectedDate(null)
        setSelectedSlot(null)
      }
    }
    // Advance the calendar if the displayed month has no enabled days for this format
    const hasAnyInMonth = (() => {
      const days = getDaysInMonth(currentMonth)
      return days.some((d) => d && !isDateDisabled(d))
    })()
    if (!hasAnyInMonth) {
      // Find the next month with at least one enabled day (scan up to 12 months)
      for (let i = 1; i <= 12; i++) {
        const candidate = new Date(currentMonth)
        candidate.setMonth(candidate.getMonth() + i)
        const days = getDaysInMonth(candidate)
        if (days.some((d) => d && !isDateDisabled(d))) {
          setCurrentMonth(candidate)
          break
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, practitioner])

  // Load quick view (next available days)
  useEffect(() => {
    if (dateViewMode !== 'quick' || !practitioner || !selectedService) return
    setQuickLoading(true)
    fetch(`/api/bookings/next-available?practitionerId=${practitioner.profile.user_id}&duration=${selectedService.duration}&limit=6${selectedFormat ? `&format=${selectedFormat}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setQuickDays(data.days || [])
        if (data.practitionerTimezone) setPractitionerTimezone(data.practitionerTimezone)
        // Auto-expand first day
        if (data.days?.length > 0) setQuickExpandedDate(data.days[0].date)
      })
      .catch(() => setQuickDays([]))
      .finally(() => setQuickLoading(false))
  }, [dateViewMode, practitioner, selectedService, selectedFormat])

  // Pre-select the first bookable date so the calendar never opens blank.
  // Runs whenever practitioner/service/format is ready and no date is picked
  // yet — scanning client-side through calendar rules (active days, max advance,
  // format fit) so it works even if the next-available endpoint is slow.
  useEffect(() => {
    if (selectedDate || !practitioner) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxAdvance = practitioner.settings?.max_advance_days || 60
    for (let i = 0; i < maxAdvance; i++) {
      const candidate = new Date(today)
      candidate.setDate(today.getDate() + i)
      if (!isDateDisabled(candidate)) {
        setSelectedDate(candidate)
        setCurrentMonth(new Date(candidate.getFullYear(), candidate.getMonth(), 1))
        return
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practitioner, selectedService, selectedFormat, selectedDate])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    const offset = (firstDay.getDay() + 6) % 7 // Monday = 0
    for (let i = 0; i < offset; i++) {
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

    // Disable days without availability
    if (practitioner?.activeDays && practitioner.activeDays.length > 0) {
      if (!practitioner.activeDays.includes(date.getDay())) return true
    }

    // Disable days that don't match the selected format
    if (selectedFormat && practitioner?.dayFormats) {
      const dayFmts = practitioner.dayFormats[String(date.getDay())]
      if (!dayFmts || !dayFmts.includes(selectedFormat)) return true
    }

    return false
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale !== 'fr',
    })
  }

  const formatTimeInZone = (isoString: string, timezone: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: locale !== 'fr',
      timeZone: timezone,
    })
  }

  const getShortTzName = (timezone: string) => {
    try {
      const parts = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
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
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
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

    // Validate required notes
    if (selectedService.notesRequired && !notes.trim()) {
      setBookingError(locale === 'fr'
        ? 'Les notes sont obligatoires pour ce type de séance.'
        : 'Notes are required for this session type.')
      return
    }

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
          session_format: selectedFormat === 'in_person' ? 'in_person' : 'video',
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
      case 'schedule':
        // Need service + format + a picked slot. Service/format may be auto-picked
        // when the practitioner only offers one of each.
        return !!selectedService && !!selectedFormat && !!selectedDate && !!selectedSlot
      case 'details': {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clientEmail.trim())
        const baseValid = clientName.trim() !== '' && emailValid
        if (selectedService?.notesRequired && !notes.trim()) return false
        return baseValid
      }
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
          <p className="text-gray-600 font-medium">{locale === 'fr' ? 'Chargement...' : 'Loading booking page...'}</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{locale === 'fr' ? 'Réservation indisponible' : 'Booking Unavailable'}</h2>
          <p className="text-gray-600">{error || (locale === 'fr' ? 'Ce praticien n\'accepte pas les réservations pour le moment.' : 'This practitioner is not accepting bookings.')}</p>
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
                {practitioner.settings.require_approval
                  ? (locale === 'fr' ? 'Demande envoyée !' : 'Request Submitted!')
                  : (locale === 'fr' ? 'Réservation confirmée !' : 'Booking Confirmed!')}
              </h2>
              <p className="text-gray-600 mb-8">
                {practitioner.settings.require_approval
                  ? (locale === 'fr' ? 'Votre demande a été soumise et est en attente de confirmation.' : 'Your booking request has been submitted and is awaiting confirmation.')
                  : (locale === 'fr' ? 'Votre rendez-vous a été confirmé.' : 'Your appointment has been confirmed.')}
              </p>
              {calendarSynced && (
                <p className="text-sm text-emerald-600 mb-6">
                  {locale === 'fr' ? `Une invitation a été envoyée à ${clientEmail}` : `A calendar invite has been sent to ${clientEmail}`}
                </p>
              )}
              {!calendarSynced && !practitioner.settings.require_approval && (
                <p className="text-sm text-gray-500 mb-6">
                  {locale === 'fr' ? 'Veuillez enregistrer ce rendez-vous dans votre calendrier.' : 'Please save this appointment to your calendar manually.'}
                </p>
              )}

              <div className="bg-gray-50/80 rounded-xl p-5 text-left space-y-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getServiceName(selectedService)}</p>
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

  // Validate the primary color override (only accept #RGB or #RRGGBB to avoid CSS injection)
  const validPrimary = primaryColorOverride && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColorOverride)
    ? primaryColorOverride
    : null

  // Convert hex to "r, g, b" for use in rgba()
  const hexToRgbTriplet = (hex: string): string | null => {
    let h = hex.replace('#', '')
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    if (h.length !== 6) return null
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    if ([r, g, b].some(n => Number.isNaN(n))) return null
    return `${r}, ${g}, ${b}`
  }
  const rgbTriplet = validPrimary ? hexToRgbTriplet(validPrimary) : null

  // CSS overrides — when an embed primary color is set, remap the booking page's
  // teal accent classes to the practitioner's chosen color. Light shades (50/100)
  // become tinted with the same color at low opacity for a cohesive feel.
  const brandOverrideCss = embedMode && validPrimary && rgbTriplet
    ? `
        .bg-teal-50,
        .from-teal-50,
        .to-teal-50 { background-color: rgba(${rgbTriplet}, 0.06) !important; }
        .bg-teal-100,
        .from-teal-100,
        .to-teal-100 { background-color: rgba(${rgbTriplet}, 0.12) !important; }
        .bg-teal-200 { background-color: rgba(${rgbTriplet}, 0.20) !important; }
        .bg-teal-500,
        .bg-teal-600,
        .bg-teal-700 { background-color: ${validPrimary} !important; }
        .hover\\:bg-teal-600:hover,
        .hover\\:bg-teal-700:hover { background-color: ${validPrimary} !important; filter: brightness(0.92); }
        .text-teal-500,
        .text-teal-600,
        .text-teal-700 { color: ${validPrimary} !important; }
        .hover\\:text-teal-600:hover,
        .hover\\:text-teal-700:hover { color: ${validPrimary} !important; filter: brightness(0.92); }
        .border-teal-200,
        .border-teal-300,
        .border-teal-400,
        .border-teal-500,
        .border-teal-600 { border-color: ${validPrimary} !important; }
        .ring-teal-500 { --tw-ring-color: ${validPrimary} !important; }
        .focus\\:ring-teal-500:focus { --tw-ring-color: ${validPrimary} !important; }
      `
    : null

  return (
    <div
      ref={containerRef}
      className={embedMode
        ? 'min-h-0 bg-transparent'
        : 'min-h-screen bg-gradient-to-br from-teal-100 via-white to-teal-50'
      }
    >
      {brandOverrideCss && <style dangerouslySetInnerHTML={{ __html: brandOverrideCss }} />}
      {/* Header — hidden in embed mode (host site provides its own chrome) */}
      {!embedMode && (
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href={`/practitioner/${slug}`}>
                <Logo size="md" showText />
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className={`container mx-auto ${embedMode ? 'px-3 py-4' : 'px-4 sm:px-6 lg:px-8 py-8'} max-w-6xl`}>
        <div className={`flex flex-col ${hideSidebar ? '' : 'lg:flex-row'} gap-8`}>

          {/* Left Sidebar — Practitioner Info (desktop only, hidden in embed by default) */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${hideSidebar ? 'hidden' : 'hidden lg:block lg:w-80 shrink-0'}`}
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

                  {/* Address */}
                  {(practitioner.profile.address || practitioner.profile.city) && (
                    <div className="mt-4 text-left">
                      <p className="text-sm text-gray-600">
                        {[practitioner.profile.address, practitioner.profile.city, practitioner.profile.country].filter(Boolean).join(', ')}
                      </p>
                      {practitioner.profile.google_maps_url && (
                        <a
                          href={practitioner.profile.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 inline-block"
                        >
                          {locale === 'fr' ? 'Voir sur Google Maps →' : 'View on Google Maps →'}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Specialties */}
                  {practitioner.profile.specialties && practitioner.profile.specialties.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-left">{locale === 'fr' ? 'Spécialités' : 'Specialties'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {practitioner.profile.specialties.slice(0, 6).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100"
                          >
                            {locale === 'fr' ? (SPECIALTY_FR[specialty] || specialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())) : specialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                          {locale === 'fr' ? 'Vidéo' : 'Video'}
                        </span>
                      )}
                      {practitioner.profile.offers_in_person && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                          {locale === 'fr' ? 'En personne' : 'In-Person'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* View Profile Link */}
                  <Link
                    href={`/practitioner/${slug}`}
                    className="mt-5 block text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    {locale === 'fr' ? 'Voir le profil complet' : 'View full profile'}
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
              {(practitioner.profile.address || practitioner.profile.city) && (
                <p className="text-sm text-gray-500 mt-2">
                  📍 {[practitioner.profile.address, practitioner.profile.city, practitioner.profile.country].filter(Boolean).join(', ')}
                </p>
              )}
              {practitioner.profile.google_maps_url && (
                <a href={practitioner.profile.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 font-medium mt-1 inline-block">
                  {locale === 'fr' ? 'Voir sur Google Maps →' : 'View on Google Maps →'}
                </a>
              )}
              <Link href={`/practitioner/${slug}`} className="text-xs text-teal-600 font-medium mt-2 block">
                {locale === 'fr' ? 'Voir le profil complet' : 'View full profile'}
              </Link>
            </motion.div>

            {/* Progress Steps */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center justify-center mb-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
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
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
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
                      {(STEP_LABELS[locale] || STEP_LABELS['en'])[step]}
                    </span>
                  </button>
                  {index < STEP_ORDER.length - 1 && (
                    <div
                      className={`w-6 sm:w-14 h-0.5 mx-1 sm:mx-3 rounded-full transition-colors ${
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
                {currentStep === 'schedule' && t(locale, { en: 'Schedule your session', fr: 'Planifiez votre séance' })}
                {currentStep === 'details' && t(locale, { en: 'Your Details', fr: 'Vos coordonnées' })}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep === 'schedule' && t(locale, { en: 'Pick an available time that works for you', fr: 'Choisissez un créneau qui vous convient' })}
                {currentStep === 'details' && t(locale, { en: 'We\'ll use this to confirm your appointment', fr: 'Ces informations serviront à confirmer votre rendez-vous' })}
              </p>
            </div>

            {/* ─── Schedule step: service chips + format chips + calendar/slots ─── */}
            {currentStep === 'schedule' && sessionTypes.length > 1 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t(locale, { en: 'Session', fr: 'Séance' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessionTypes.map((service) => {
                    const isActive = selectedService?.id === service.id
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className={`px-3.5 py-2 rounded-xl border text-sm transition-all ${
                          isActive
                            ? 'border-teal-500 bg-teal-50/50 text-teal-700 shadow-sm shadow-teal-100/50'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium">{getServiceName(service)}</span>
                        <span className={`ml-2 ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                          · {service.duration} {locale === 'fr' ? 'min' : 'min'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStep === 'schedule' && selectedService && (() => {
              // Formats this session type allows, narrowed to what the
              // practitioner actually offers across their week. A single
              // resulting format locks the choice (no toggle shown).
              const stf = selectedService.sessionFormat || 'both'
              let allowed: string[] = stf === 'both' ? ['in_person', 'video'] : [stf]
              if (practitioner?.availableFormats) allowed = allowed.filter(f => practitioner.availableFormats!.includes(f))
              const showInPerson = allowed.includes('in_person')
              const showVideo = allowed.includes('video')
              if (!showInPerson || !showVideo) return null  // single-format → no toggle
              return (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t(locale, { en: 'Format', fr: 'Format' })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('in_person')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition-all ${
                        selectedFormat === 'in_person'
                          ? 'border-teal-500 bg-teal-50/50 text-teal-700 shadow-sm shadow-teal-100/50'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{t(locale, { en: 'In person', fr: 'En personne' })}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFormat('video')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition-all ${
                        selectedFormat === 'video'
                          ? 'border-teal-500 bg-teal-50/50 text-teal-700 shadow-sm shadow-teal-100/50'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span className="font-medium">{t(locale, { en: 'Video', fr: 'Vidéo' })}</span>
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Date & Time Selection — only when service + format are chosen */}
            {currentStep === 'schedule' && selectedService && selectedFormat && (
              <div className="space-y-6">
                {/* View toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setDateViewMode('calendar')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                      dateViewMode === 'calendar' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t(locale, { en: 'Calendar', fr: 'Calendrier' })}
                  </button>
                  <button
                    onClick={() => setDateViewMode('quick')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                      dateViewMode === 'quick' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t(locale, { en: 'Next available', fr: 'Prochaines dispos' })}
                  </button>
                </div>

                {/* Quick view - next available days */}
                {dateViewMode === 'quick' && (
                  <div className="space-y-2">
                    {quickLoading ? (
                      <div className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500 mb-2" />
                        <p className="text-sm text-gray-500">{t(locale, { en: 'Finding available times...', fr: 'Recherche des créneaux...' })}</p>
                      </div>
                    ) : quickDays.length === 0 ? (
                      <div className="py-8 text-center">
                        <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">{t(locale, { en: 'No available times in the next weeks', fr: 'Aucun créneau dans les prochaines semaines' })}</p>
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
                                    const tz = practitionerTimezone || 'UTC'
                                    const timeDisplay = slotDate.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr',
                                    })
                                    const isSelected = selectedSlot?.slot_start === slot.slot_start
                                    return (
                                      <button
                                        key={slot.slot_start}
                                        onClick={() => {
                                          setSelectedSlot(slot)
                                          setSelectedDate(new Date(day.date + 'T12:00:00'))
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                          isSelected
                                            ? 'bg-teal-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
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
                {dateViewMode === 'calendar' && (
                <div className="md:grid md:grid-cols-[minmax(0,1fr)_240px] md:gap-8 md:items-start">
                {/* Minimal Motion-style calendar */}
                {(() => {
                  const todayKey = (() => {
                    const t = new Date()
                    return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`
                  })()
                  const monthLabel = currentMonth.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const isViewingCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth()
                  const daysShort = locale === 'fr' ? ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                  return (
                    <div className="px-1">
                      {/* Month header */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900 capitalize">{monthLabel}</h3>
                        <div className="flex items-center gap-1">
                          {!isViewingCurrentMonth && (
                            <button
                              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                              aria-label="Previous month"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Next month"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Day-of-week row — small, light */}
                      <div className="grid grid-cols-7 mb-1">
                        {daysShort.map((d) => (
                          <div key={d} className="text-[11px] text-gray-400 text-center py-1">
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Days — circular markers, tight rows */}
                      <div className="grid grid-cols-7 gap-y-1.5">
                        {getDaysInMonth(currentMonth).map((date, index) => {
                          if (!date) return <div key={index} className="h-9" />
                          const isSelected = selectedDate?.toDateString() === date.toDateString()
                          const disabled = isDateDisabled(date)
                          const isToday = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey
                          return (
                            <div key={index} className="flex justify-center items-center h-9">
                              <button
                                onClick={() => setSelectedDate(date)}
                                disabled={disabled}
                                className={`relative w-9 h-9 flex items-center justify-center text-sm rounded-full transition-all ${
                                  isSelected
                                    ? 'bg-teal-600 text-white font-semibold'
                                    : disabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-800 bg-teal-50 hover:bg-teal-100'
                                }`}
                              >
                                {date.getDate()}
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Time zone footer (desktop) */}
                      {practitionerTimezone && (
                        <div className="hidden md:block mt-6">
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            {locale === 'fr' ? 'Fuseau horaire' : 'Time zone'}
                          </p>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {getShortTzName(clientTimezone)}
                              {getTzCity(clientTimezone) && (
                                <span className="font-medium text-gray-900 ml-1">{getTzCity(clientTimezone)}</span>
                              )}
                            </span>
                            <span className="ml-auto text-xs text-gray-400 tabular-nums">
                              {new Date().toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: clientTimezone, hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr' })}
                            </span>
                          </div>
                          {!isSameTimezone && (
                            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                              {locale === 'fr'
                                ? `Le praticien est en ${getShortTzName(practitionerTimezone)}${getTzCity(practitionerTimezone) ? ` — ${getTzCity(practitionerTimezone)}` : ''}.`
                                : `Practitioner is in ${getShortTzName(practitionerTimezone)}${getTzCity(practitionerTimezone) ? ` — ${getTzCity(practitionerTimezone)}` : ''}.`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Time Slots */}
                {selectedDate && (
                  <div className="mt-6 md:mt-0 md:border-l md:border-gray-100 md:pl-6">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm capitalize">
                      {formatDateShort(selectedDate)}
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
                        <p className="text-gray-500 text-sm">{locale === 'fr' ? 'Aucun créneau disponible à cette date.' : 'No available times on this date.'}</p>
                        <p className="text-gray-400 text-xs mt-1">{locale === 'fr' ? 'Veuillez sélectionner un autre jour.' : 'Please select another day.'}</p>
                      </div>
                    ) : (
                      <>
                        {practitionerTimezone && (
                          <div className={`flex md:hidden items-start gap-2.5 p-3 rounded-xl text-sm mb-4 ${
                            isSameTimezone ? 'bg-gray-50 text-gray-600 border border-gray-100' : 'bg-blue-50/80 text-blue-700 border border-blue-100'
                          }`}>
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>
                              {isSameTimezone
                                ? (locale === 'fr'
                                    ? `Vous et le praticien êtes dans le même fuseau horaire (${getShortTzName(clientTimezone)}${getTzCity(clientTimezone) ? ` — ${getTzCity(clientTimezone)}` : ''}).`
                                    : `You and the practitioner are both in ${getShortTzName(clientTimezone)}${getTzCity(clientTimezone) ? ` (${getTzCity(clientTimezone)})` : ''}.`)
                                : (locale === 'fr'
                                    ? `Horaires affichés dans votre fuseau (${getShortTzName(clientTimezone)}${getTzCity(clientTimezone) ? ` — ${getTzCity(clientTimezone)}` : ''}). Le praticien est en ${getShortTzName(practitionerTimezone)}${getTzCity(practitionerTimezone) ? ` — ${getTzCity(practitionerTimezone)}` : ''}.`
                                    : `Times shown in your timezone (${getShortTzName(clientTimezone)}${getTzCity(clientTimezone) ? ` \u2013 ${getTzCity(clientTimezone)}` : ''}). Practitioner is in ${getShortTzName(practitionerTimezone)}${getTzCity(practitionerTimezone) ? ` \u2013 ${getTzCity(practitionerTimezone)}` : ''}.`)
                              }
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:max-h-[420px] md:overflow-y-auto md:pr-1 md:[scrollbar-width:thin] md:[scrollbar-color:#e5e7eb_transparent] md:[&::-webkit-scrollbar]:w-1 md:[&::-webkit-scrollbar-track]:bg-transparent md:[&::-webkit-scrollbar-thumb]:bg-gray-200 md:[&::-webkit-scrollbar-thumb]:rounded-full md:hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.slot_start}
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-3 py-2.5 text-sm rounded-lg border transition-all md:text-center ${
                                selectedSlot?.slot_start === slot.slot_start
                                  ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                                  : 'border-gray-200 hover:border-teal-400 hover:text-teal-600 text-gray-700'
                              }`}
                            >
                              <span>
                                {formatTime(slot.slot_start)}
                                {isSameTimezone && practitionerTimezone && (
                                  <span className="text-xs text-gray-400 ml-1 md:hidden">{getShortTzName(clientTimezone)}</span>
                                )}
                              </span>
                              {!isSameTimezone && practitionerTimezone && (
                                <span className="block text-[11px] text-gray-400 mt-0.5">
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
              </div>
            )}

            {/* Client Details */}
            {currentStep === 'details' && (
              <div className="space-y-5">
                {/* Appointment summary — read-only at top of details */}
                {selectedService && selectedFormat && selectedSlot && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep('schedule')}
                    className="w-full text-left rounded-xl bg-teal-50/40 border border-teal-100 px-4 py-3 hover:bg-teal-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                        <span className="font-medium text-gray-900">{getServiceName(selectedService)}</span>
                        <span className="text-gray-400">·</span>
                        <span>{selectedService.duration} {locale === 'fr' ? 'min' : 'min'}</span>
                        <span className="text-gray-400">·</span>
                        <span className="inline-flex items-center gap-1">
                          {selectedFormat === 'video' ? <Video className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                          {selectedFormat === 'video' ? t(locale, { en: 'Video', fr: 'Vidéo' }) : t(locale, { en: 'In person', fr: 'En personne' })}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="font-medium text-teal-700">
                          {new Date(selectedSlot.slot_start).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' '}{formatTime(selectedSlot.slot_start)}
                        </span>
                      </div>
                      <span className="text-xs text-teal-600 group-hover:text-teal-700 font-medium shrink-0">
                        {locale === 'fr' ? 'Modifier' : 'Edit'}
                      </span>
                    </div>
                  </button>
                )}

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {locale === 'fr' ? 'Nom complet' : 'Full Name'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={locale === 'fr' ? 'Votre nom complet' : 'Your full name'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow bg-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {locale === 'fr' ? 'Adresse e-mail' : 'Email Address'} <span className="text-red-400">*</span>
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
                    {locale === 'fr' ? 'Téléphone' : 'Phone Number'} <span className="text-gray-400 font-normal">{locale === 'fr' ? '(facultatif)' : '(optional)'}</span>
                  </label>
                  <PhoneInput
                    value={clientPhone}
                    onChange={setClientPhone}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    {locale === 'fr' ? 'Notes' : 'Additional Notes'}
                    {selectedService?.notesRequired
                      ? <span className="text-red-500 font-normal">*</span>
                      : <span className="text-gray-400 font-normal">{locale === 'fr' ? '(facultatif)' : '(optional)'}</span>
                    }
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={locale === 'fr' ? 'Informations supplémentaires pour le praticien...' : 'Anything you\'d like the practitioner to know...'}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow resize-none bg-white placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Booking error + cancellation policy — shown on the details step */}
            {currentStep === 'details' && bookingError && (
              <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
                {bookingError}
              </div>
            )}
            {currentStep === 'details' && practitioner.settings.cancellation_policy && (
              <div className="mt-4 text-sm text-gray-500 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <p className="font-medium text-gray-700 mb-1">{locale === 'fr' ? 'Politique d\'annulation' : 'Cancellation Policy'}</p>
                <p>{practitioner.settings.cancellation_policy}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep !== 'schedule' ? (
                <Button variant="outline" onClick={goBack} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Retour' : 'Back'}
                </Button>
              ) : (
                <div />
              )}

              {currentStep === 'details' ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed()}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {locale === 'fr' ? 'Confirmer la réservation' : 'Confirm Booking'}
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:shadow-none"
                >
                  {locale === 'fr' ? 'Continuer' : 'Continue'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
            </motion.div>
          </div>

        </div>

        {/* Footer — minimal "powered by" line; opens in new tab when embedded */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={embedMode ? 'text-center mt-6 py-3' : 'text-center mt-10 py-6'}
        >
          <p className="text-xs text-gray-400">
            {locale === 'fr' ? 'Propulsé par' : 'Powered by'}{' '}
            <a
              href="https://bloomsline.com"
              {...(embedMode ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-teal-500 hover:text-teal-600 font-medium"
            >
              Bloomsline
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
