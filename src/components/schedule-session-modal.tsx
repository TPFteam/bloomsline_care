'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Calendar, Clock, Users, Check, ChevronRight, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
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

export function ScheduleSessionModal({ isOpen, onClose, onSuccess, preselectedMember }: ScheduleSessionModalProps) {
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

  const supabase = createClient()

  // Generate next 14 days for date selection
  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i))

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
    if (!userId || !selectedSessionType) return

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const { data, error } = await supabase
        .rpc('get_available_slots', {
          p_practitioner_id: userId,
          p_date: dateStr,
          p_duration: selectedSessionType.duration,
        })

      if (error) throw error
      setAvailableSlots(data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    }
  }

  const handleBookSession = async () => {
    if (!selectedMember || !selectedSessionType || !selectedTime || !userId) return

    setLoading(true)
    try {
      // Parse the selected time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + selectedSessionType.duration)

      // Create the booking
      const bookingData = {
        practitioner_id: userId,
        client_name: `${selectedMember.first_name} ${selectedMember.last_name}`,
        client_email: selectedMember.email || '',
        client_phone: selectedMember.phone || null,
        session_type: selectedSessionType.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: notes || null,
        status: 'confirmed', // Auto-confirm since practitioner is booking
        member_id: selectedMember.id, // Link to member
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
    if (step === 'session') return !!selectedSessionType
    if (step === 'datetime') return !!selectedTime
    return true
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
              <h2 className="text-lg font-semibold text-gray-900">Schedule Session</h2>
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
            <div className="flex items-center gap-2">
              {['member', 'session', 'datetime', 'confirm'].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
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
                      className={`w-8 h-0.5 mx-1 ${
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
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 outline-none transition-all"
                  />
                </div>

                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>No members found</p>
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
              <div className="space-y-3">
                {sessionTypes.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>No session types configured</p>
                    <p className="text-sm mt-1">Add session types in Bookings Settings</p>
                  </div>
                ) : (
                  sessionTypes.map((type) => (
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
                  ))
                )}
              </div>
            )}

            {/* Step 3: Select Date & Time */}
            {step === 'datetime' && (
              <div className="space-y-4">
                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {dateOptions.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date)
                          setSelectedTime(null)
                        }}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl border text-center min-w-[70px] transition-all ${
                          isSameDay(selectedDate, date)
                            ? 'border-mint-500 bg-mint-50 text-mint-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-xs text-gray-500">{format(date, 'EEE')}</p>
                        <p className="font-semibold">{format(date, 'd')}</p>
                        <p className="text-xs text-gray-500">{format(date, 'MMM')}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Select Time</label>
                  {availableSlots.length === 0 ? (
                    <div className="py-6 text-center text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No available slots for this date</p>
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
                      <span className="text-gray-500">Session Type</span>
                      <span className="font-medium text-gray-900">{selectedSessionType?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">{selectedSessionType?.duration} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium text-gray-900">
                        {selectedTime && format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for this session..."
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
                {loading ? 'Scheduling...' : 'Confirm & Schedule'}
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
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
