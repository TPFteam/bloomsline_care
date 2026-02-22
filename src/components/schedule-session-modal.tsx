'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Clock, Users, Check, ChevronRight, ArrowLeft, Calendar, Building2, Video } from 'lucide-react'
import { CalendarPicker } from '@/components/ui/calendar-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { notifySessionScheduled } from '@/lib/notifications'
import { format, startOfDay } from 'date-fns'
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

interface ScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  preselectedMember?: Member | null
}

type Step = 'member' | 'session' | 'datetime' | 'confirm'
type ScheduleMode = 'calendar' | 'manual'

export function ScheduleSessionModal({ isOpen, onClose, onSuccess, preselectedMember }: ScheduleSessionModalProps) {
  const { locale } = useLanguage()
  const [step, setStep] = useState<Step>(preselectedMember ? 'session' : 'member')
  const [members, setMembers] = useState<Member[]>([])
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Selected values
  const [selectedMember, setSelectedMember] = useState<Member | null>(preselectedMember || null)
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  // Manual scheduling (without calendar)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('calendar')
  const [manualSessionType, setManualSessionType] = useState<string>('follow_up')
  const [manualSessionFormat, setManualSessionFormat] = useState<'in_person' | 'virtual'>('in_person')
  const [manualDuration, setManualDuration] = useState(60)
  const [manualTime, setManualTime] = useState('10:00')

  // Session type options for manual mode (must match database enum)
  const sessionTypeOptions = [
    { value: 'initial_consultation', label: 'Initial Consultation', labelFr: 'Consultation initiale', labelEs: 'Consulta inicial' },
    { value: 'follow_up', label: 'Follow-up', labelFr: 'Suivi', labelEs: 'Seguimiento' },
    { value: 'check_in', label: 'Check-in', labelFr: 'Point de situation', labelEs: 'Revisión' },
    { value: 'crisis', label: 'Crisis Intervention', labelFr: 'Intervention de crise', labelEs: 'Intervención de crisis' },
    { value: 'group', label: 'Group Session', labelFr: 'Séance de groupe', labelEs: 'Sesión grupal' },
    { value: 'other', label: 'Other', labelFr: 'Autre', labelEs: 'Otro' },
  ]

  const getSessionTypeLabel = (value: string) => {
    return sessionTypeOptions.find(opt => opt.value === value)?.label || value
  }

  // Session format options
  const sessionFormatOptions = [
    { value: 'in_person', label: 'In Person', labelFr: 'En personne', labelEs: 'Presencial', Icon: Building2 },
    { value: 'virtual', label: 'Virtual', labelFr: 'Virtuel', labelEs: 'Virtual', Icon: Video },
  ]

  const supabase = createClient()

  // Fetch members and session types on open
  useEffect(() => {
    if (isOpen) {
      // Set preselected member and start at appropriate step
      if (preselectedMember) {
        setSelectedMember(preselectedMember)
        setStep('session')
      } else {
        setStep('member')
        setSelectedMember(null)
      }
      fetchInitialData()
    } else {
      // Reset state when modal closes
      setStep(preselectedMember ? 'session' : 'member')
      setSelectedMember(preselectedMember || null)
      setSelectedSessionType(null)
      setSelectedDate(startOfDay(new Date()))
      setSelectedTime(null)
      setNotes('')
      setSearchQuery('')
      setScheduleMode('calendar')
      setManualSessionType('follow_up')
      setManualSessionFormat('in_person')
      setManualDuration(60)
      setManualTime('10:00')
    }
  }, [isOpen, preselectedMember])

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
        .order('first_name')

      if (membersData) {
        setMembers(membersData)
      }

      // Fetch session types from booking settings
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', user.id)
        .single()

      if (settings?.session_types) {
        setSessionTypes(settings.session_types as SessionType[])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    console.log('[modal] fetchAvailableSlots called', { userId, selectedSessionType, selectedDate })
    if (!userId || !selectedSessionType) {
      console.log('[modal] skipping fetch - missing userId or sessionType')
      return
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const url = `/api/bookings/available-slots?practitionerId=${userId}&date=${dateStr}&duration=${selectedSessionType.duration}&skipNotice=true`
      console.log('[modal] fetching:', url)
      const res = await fetch(url)
      const json = await res.json()
      console.log('[modal] response:', json)

      if (!res.ok) throw new Error(json.error || 'Failed to fetch slots')
      setAvailableSlots(json.slots || [])
    } catch (error) {
      console.error('[modal] Error fetching slots:', error)
      setAvailableSlots([])
    }
  }

  const handleBookSession = async () => {
    if (!selectedMember || !userId) return

    // For calendar mode, require selectedSessionType and selectedTime
    if (scheduleMode === 'calendar' && (!selectedSessionType || !selectedTime)) return

    // For manual mode, require manualSessionType and manualTime
    if (scheduleMode === 'manual' && (!manualSessionType || !manualTime)) return

    setLoading(true)
    try {
      const timeToUse = scheduleMode === 'manual' ? manualTime : selectedTime!
      const durationToUse = scheduleMode === 'manual' ? manualDuration : selectedSessionType!.duration

      // Parse the selected time
      const [hours, minutes] = timeToUse.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + durationToUse)

      if (scheduleMode === 'manual') {
        // Save to sessions table for member tracking
        const sessionTypeLabel = getSessionTypeLabel(manualSessionType)
        const sessionData = {
          practitioner_id: userId,
          member_id: selectedMember.id,
          session_type: manualSessionType as 'initial_consultation' | 'follow_up' | 'check_in' | 'crisis' | 'group' | 'other',
          session_format: manualSessionFormat,
          scheduled_at: startTime.toISOString(),
          duration_minutes: durationToUse,
          status: 'scheduled',
          notes: notes ? `${sessionTypeLabel}\n\n${notes}` : sessionTypeLabel,
        }

        console.log('Creating session with data:', sessionData)

        const { data: sessionResult, error: sessionError } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select('id')
          .single()

        if (sessionError) {
          console.error('Supabase session error:', sessionError)
          throw new Error(sessionError.message || 'Failed to create session')
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
        }

        const { error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingData)

        if (bookingError) {
          console.warn('Could not create booking entry:', bookingError)
          // Don't fail - session was created successfully
        }

        // Send notification to member
        if (selectedMember.user_id && sessionResult?.id) {
          try {
            const { data: practitioner } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', userId)
              .single()

            await notifySessionScheduled(supabase, {
              memberUserId: selectedMember.user_id,
              sessionId: sessionResult.id,
              scheduledAt: startTime.toISOString(),
              practitionerName: practitioner?.full_name || 'Your practitioner',
            })
          } catch (notifyError) {
            console.error('Error sending session notification:', notifyError)
          }
        }

        toast.success(`Session scheduled with ${selectedMember.first_name} ${selectedMember.last_name}`)
      } else {
        // Calendar mode: create session + booking + calendar sync

        // 1. Create session entry (for member tracking / upcoming sessions)
        const sessionData = {
          practitioner_id: userId,
          member_id: selectedMember.id,
          session_type: 'follow_up' as const,
          session_format: 'virtual' as const,
          scheduled_at: startTime.toISOString(),
          duration_minutes: durationToUse,
          status: 'scheduled',
          notes: notes ? `${selectedSessionType!.name}\n\n${notes}` : selectedSessionType!.name,
        }

        const { error: sessionError } = await supabase
          .from('sessions')
          .insert(sessionData)

        if (sessionError) {
          console.warn('Could not create session entry:', sessionError)
        }

        // 2. Create booking entry (for bookings page + calendar)
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
          status: 'confirmed',
          member_id: selectedMember.id,
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

        // Send notification to member
        if (selectedMember.user_id && data?.id) {
          try {
            const { data: practitioner } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', userId)
              .single()

            await notifySessionScheduled(supabase, {
              memberUserId: selectedMember.user_id,
              sessionId: data.id,
              scheduledAt: startTime.toISOString(),
              practitionerName: practitioner?.full_name || 'Your practitioner',
            })
          } catch (notifyError) {
            console.error('Error sending session notification:', notifyError)
          }
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
      toast.error('Failed to schedule session')
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const goBack = () => {
    if (step === 'session' && !preselectedMember) setStep('member')
    else if (step === 'datetime') setStep('session')
    else if (step === 'confirm') setStep('datetime')
  }

  const canProceed = () => {
    if (step === 'member') return !!selectedMember
    if (step === 'session') {
      if (scheduleMode === 'manual') return !!manualSessionType && manualDuration > 0
      return !!selectedSessionType
    }
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
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
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
                {locale === 'fr' ? 'Planifier une séance' : locale === 'es' ? 'Programar sesión' : 'Schedule Session'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-center">
              {['member', 'session', 'datetime', 'confirm'].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step === s
                        ? 'bg-mint-500 text-white'
                        : ['member', 'session', 'datetime', 'confirm'].indexOf(step) > index
                        ? 'bg-mint-100 text-mint-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {['member', 'session', 'datetime', 'confirm'].indexOf(step) > index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        ['member', 'session', 'datetime', 'confirm'].indexOf(step) > index
                          ? 'bg-mint-300'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
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
                {/* Mode Toggle */}
                {sessionTypes.length > 0 && (
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
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
                  <div className="space-y-2">
                    {sessionTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedSessionType(type)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedSessionType?.id === type.id
                            ? 'border-mint-500 bg-mint-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{type.name}</p>
                            <p className="text-sm text-gray-500">{type.duration} minutes</p>
                          </div>
                          {selectedSessionType?.id === type.id && (
                            <Check className="w-5 h-5 text-mint-500" />
                          )}
                        </div>
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
                        {sessionTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setManualSessionType(option.value)}
                            className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                              manualSessionType === option.value
                                ? 'border-mint-500 bg-mint-50 text-mint-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            {locale === 'fr' ? option.labelFr : locale === 'es' ? (option.labelEs || option.label) : option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {locale === 'fr' ? 'Durée (minutes)' : locale === 'es' ? 'Duración (minutos)' : 'Duration (minutes)'}
                      </label>
                      <div className="flex gap-2">
                        {[30, 45, 60, 90].map((duration) => (
                          <button
                            key={duration}
                            onClick={() => setManualDuration(duration)}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              manualDuration === duration
                                ? 'border-mint-500 bg-mint-50 text-mint-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {duration}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {locale === 'fr' ? 'Format de séance' : locale === 'es' ? 'Formato de sesión' : 'Session Format'}
                      </label>
                      <div className="flex gap-2">
                        {sessionFormatOptions.map((option) => {
                          const IconComponent = option.Icon
                          return (
                            <button
                              key={option.value}
                              onClick={() => setManualSessionFormat(option.value as 'in_person' | 'virtual')}
                              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                manualSessionFormat === option.value
                                  ? 'border-mint-500 bg-mint-50 text-mint-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                              <span>{locale === 'fr' ? option.labelFr : locale === 'es' ? (option.labelEs || option.label) : option.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Date & Time */}
            {step === 'datetime' && (
              <div className="space-y-4">
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
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {locale === 'fr' ? 'Sélectionner l\'heure' : locale === 'es' ? 'Seleccionar hora' : 'Select Time'}
                  </label>
                  {scheduleMode === 'manual' ? (
                    /* Manual time input - themed picker */
                    <TimePicker
                      value={manualTime}
                      onChange={(time) => setManualTime(time)}
                    />
                  ) : availableSlots.length === 0 ? (
                    <div className="py-6 text-center text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{locale === 'fr' ? 'Aucun créneau disponible pour cette date' : locale === 'es' ? 'No hay horarios disponibles para esta fecha' : 'No available slots for this date'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => {
                        // slot_start is ISO string like "2025-12-03T09:00:00-05:00"
                        const slotDate = new Date(slot.slot_start)
                        const timeStr = format(slotDate, 'HH:mm')
                        return (
                          <button
                            key={slot.slot_start}
                            onClick={() => setSelectedTime(timeStr)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                              selectedTime === timeStr
                                ? 'border-mint-500 bg-mint-50 text-mint-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {format(slotDate, 'h:mm a')}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white font-medium">
                      {selectedMember?.first_name[0]}{selectedMember?.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedMember?.first_name} {selectedMember?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{selectedMember?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Type de séance' : locale === 'es' ? 'Tipo de sesión' : 'Session Type'}</span>
                      <span className="font-medium text-gray-900">
                        {scheduleMode === 'manual' ? getSessionTypeLabel(manualSessionType) : selectedSessionType?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Durée' : locale === 'es' ? 'Duración' : 'Duration'}</span>
                      <span className="font-medium text-gray-900">
                        {scheduleMode === 'manual' ? manualDuration : selectedSessionType?.duration} min
                      </span>
                    </div>
                    {scheduleMode === 'manual' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{locale === 'fr' ? 'Format' : locale === 'es' ? 'Formato' : 'Format'}</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1.5">
                          {manualSessionFormat === 'virtual' ? (
                            <><Video className="w-4 h-4" /> {locale === 'fr' ? 'Virtuel' : locale === 'es' ? 'Virtual' : 'Virtual'}</>
                          ) : (
                            <><Building2 className="w-4 h-4" /> {locale === 'fr' ? 'En personne' : locale === 'es' ? 'Presencial' : 'In Person'}</>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Date' : locale === 'es' ? 'Fecha' : 'Date'}</span>
                      <span className="font-medium text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{locale === 'fr' ? 'Heure' : locale === 'es' ? 'Hora' : 'Time'}</span>
                      <span className="font-medium text-gray-900">
                        {scheduleMode === 'manual'
                          ? format(new Date(`2000-01-01T${manualTime}`), 'h:mm a')
                          : selectedTime && format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            {step === 'confirm' ? (
              <button
                onClick={handleBookSession}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-mint-500 to-mint-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-mint-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (locale === 'fr' ? 'Planification...' : locale === 'es' ? 'Programando...' : 'Scheduling...')
                  : (locale === 'fr' ? 'Confirmer et planifier' : locale === 'es' ? 'Confirmar y programar' : 'Confirm & Schedule')}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (step === 'member') setStep('session')
                  else if (step === 'session') setStep('datetime')
                  else if (step === 'datetime') setStep('confirm')
                }}
                disabled={!canProceed()}
                className="w-full py-3 bg-gradient-to-r from-mint-500 to-mint-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-mint-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {locale === 'fr' ? 'Continuer' : locale === 'es' ? 'Continuar' : 'Continue'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
