'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Calendar, Clock, Check, X, Plus, Trash2, Loader2, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  getCalendarConnection,
  disconnectCalendar,
  getAvailabilitySchedules,
  bulkUpdateAvailability,
  getBookingSettings,
  saveBookingSettings,
} from '@/lib/services/calendar'
import type { CalendarConnection, BookingSettings, DayOfWeek, SessionType } from '@/types/calendar'

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

function SettingsContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()

  // State
  const [userId, setUserId] = useState<string | null>(null)
  const [practitionerSlug, setPractitionerSlug] = useState<string | null>(null)
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnection | null>(null)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null)
  const [timezone, setTimezone] = useState('America/New_York')
  const [linkCopied, setLinkCopied] = useState(false)

  // Loading states
  const [isLoadingConnection, setIsLoadingConnection] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Success/error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load initial data
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

      // Load calendar connection
      const connection = await getCalendarConnection()
      setCalendarConnection(connection)

      // Load availability schedules
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
        // Set default availability (Mon-Fri 9am-5pm)
        setAvailabilitySlots(
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => ({
            day: day as DayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          }))
        )
      }

      // Load booking settings
      const settings = await getBookingSettings()
      setBookingSettings(settings)

      setIsLoadingConnection(false)
    }

    loadData()

    // Detect timezone
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  // Check for URL params (success/error from OAuth callback)
  useEffect(() => {
    const connected = searchParams.get('calendar_connected')
    const error = searchParams.get('calendar_error')

    if (connected) {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' })
      // Reload connection
      getCalendarConnection().then(setCalendarConnection)
    } else if (error) {
      setMessage({ type: 'error', text: `Failed to connect calendar: ${error}` })
    }
  }, [searchParams])

  // Connect Google Calendar
  const handleConnectGoogle = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/calendar/google')
      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to initiate calendar connection' })
      setIsConnecting(false)
    }
  }

  // Disconnect calendar
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

  // Add availability slot
  const addAvailabilitySlot = (day: DayOfWeek) => {
    setAvailabilitySlots([
      ...availabilitySlots,
      { day, startTime: '09:00', endTime: '17:00', isActive: true },
    ])
  }

  // Remove availability slot
  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index))
  }

  // Update availability slot
  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    const updated = [...availabilitySlots]
    updated[index] = { ...updated[index], [field]: value }
    setAvailabilitySlots(updated)
  }

  // Save availability
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

  // Save booking settings
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

  // Get slots for a specific day
  const getSlotsForDay = (day: DayOfWeek) => {
    return availabilitySlots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => slot.day === day)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.dashboard.backToDashboard}
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-gray-600">Manage your calendar integration and booking preferences</p>
          </div>

          {/* Message Toast */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
              {isLoadingConnection ? (
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
              {/* Timezone selector */}
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
                </select>
              </div>

              {/* Days */}
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
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>
                Configure how clients can book appointments with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable booking page */}
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

              {/* Require approval */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Approval</p>
                  <p className="text-sm text-gray-500">
                    Manually approve booking requests before they're confirmed
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

              {/* Buffer times */}
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

              {/* Notice and advance booking */}
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
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>}>
      <SettingsContent />
    </Suspense>
  )
}
