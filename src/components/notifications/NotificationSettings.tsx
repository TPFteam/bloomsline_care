'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Moon, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import type { NotificationPreferences, NotificationType } from '@/lib/notifications/types'

interface NotificationTypeConfig {
  type: NotificationType
  label: { en: string; fr: string }
  description: { en: string; fr: string }
  category: 'resources' | 'sessions' | 'bookings' | 'general'
}

// Notification types configuration
const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  // Resources
  {
    type: 'resource_shared',
    label: { en: 'Resource Shared', fr: 'Ressource partagee' },
    description: { en: 'When someone shares a resource with you', fr: 'Quand quelqu\'un partage une ressource avec vous' },
    category: 'resources',
  },
  {
    type: 'resource_submitted',
    label: { en: 'Resource Submitted', fr: 'Ressource soumise' },
    description: { en: 'When a member submits a worksheet', fr: 'Quand un membre soumet une fiche' },
    category: 'resources',
  },
  // Sessions
  {
    type: 'session_scheduled',
    label: { en: 'Session Scheduled', fr: 'Session planifiee' },
    description: { en: 'When a new session is scheduled', fr: 'Quand une nouvelle session est planifiee' },
    category: 'sessions',
  },
  {
    type: 'session_reminder_24h',
    label: { en: '24h Reminder', fr: 'Rappel 24h' },
    description: { en: 'Reminder 24 hours before session', fr: 'Rappel 24 heures avant la session' },
    category: 'sessions',
  },
  // Bookings
  {
    type: 'booking_request',
    label: { en: 'Booking Request', fr: 'Demande de reservation' },
    description: { en: 'When someone requests a booking', fr: 'Quand quelqu\'un demande une reservation' },
    category: 'bookings',
  },
  {
    type: 'booking_confirmed',
    label: { en: 'Booking Confirmed', fr: 'Reservation confirmee' },
    description: { en: 'When a booking is confirmed', fr: 'Quand une reservation est confirmee' },
    category: 'bookings',
  },
  // General
  {
    type: 'weekly_summary',
    label: { en: 'Weekly Summary', fr: 'Resume hebdomadaire' },
    description: { en: 'Weekly wellness and activity summary', fr: 'Resume hebdomadaire de bien-etre et d\'activite' },
    category: 'general',
  },
]

const CATEGORIES = {
  resources: { en: 'Resources', fr: 'Ressources' },
  sessions: { en: 'Sessions', fr: 'Sessions' },
  bookings: { en: 'Bookings', fr: 'Reservations' },
  general: { en: 'General', fr: 'General' },
}

export function NotificationSettings() {
  const { locale } = useLanguage()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error)
        }

        if (data) {
          setPreferences(data as NotificationPreferences)
        } else {
          // Set defaults
          setPreferences({
            user_id: user.id,
            user_type: 'practitioner',
            email_enabled: true,
            push_enabled: true,
            sms_enabled: false,
            preferences: {},
          } as NotificationPreferences)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [supabase])

  // Save preferences
  const handleSave = async () => {
    if (!preferences) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setMessage({
        type: 'success',
        text: locale === 'fr' ? 'Preferences enregistrees' : 'Preferences saved',
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({
        type: 'error',
        text: locale === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Error saving preferences',
      })
    } finally {
      setIsSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Toggle global channel
  const toggleChannel = (channel: 'email_enabled' | 'push_enabled' | 'sms_enabled') => {
    if (!preferences) return
    setPreferences({ ...preferences, [channel]: !preferences[channel] })
  }

  // Toggle per-type preference
  const toggleTypePreference = (type: NotificationType, channel: 'email' | 'push') => {
    if (!preferences) return

    const current = preferences.preferences?.[type] || { email: true, push: true }
    const updated = {
      ...preferences.preferences,
      [type]: { ...current, [channel]: !current[channel] },
    }

    setPreferences({ ...preferences, preferences: updated })
  }

  // Get type preference
  const getTypePreference = (type: NotificationType, channel: 'email' | 'push'): boolean => {
    return preferences?.preferences?.[type]?.[channel] ?? true
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          {locale === 'fr' ? 'Preferences de notification' : 'Notification Preferences'}
        </CardTitle>
        <CardDescription>
          {locale === 'fr'
            ? 'Gerez comment vous recevez les notifications'
            : 'Manage how you receive notifications'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <Check className="w-4 h-4" />
            {message.text}
          </div>
        )}

        {/* Global Channel Settings */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">
            {locale === 'fr' ? 'Canaux de notification' : 'Notification Channels'}
          </h3>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => toggleChannel('email_enabled')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                preferences?.email_enabled
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>

            <button
              onClick={() => toggleChannel('push_enabled')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                preferences?.push_enabled
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Push
            </button>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Moon className="w-4 h-4 text-gray-500" />
            {locale === 'fr' ? 'Heures de tranquillite' : 'Quiet Hours'}
          </h3>
          <p className="text-sm text-gray-500">
            {locale === 'fr'
              ? 'Aucune notification push pendant ces heures'
              : 'No push notifications during these hours'}
          </p>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={preferences?.quiet_hours_start || '22:00'}
              onChange={(e) =>
                setPreferences((prev) => prev ? { ...prev, quiet_hours_start: e.target.value } : null)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">{locale === 'fr' ? 'a' : 'to'}</span>
            <input
              type="time"
              value={preferences?.quiet_hours_end || '08:00'}
              onChange={(e) =>
                setPreferences((prev) => prev ? { ...prev, quiet_hours_end: e.target.value } : null)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Per-Type Settings */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">
            {locale === 'fr' ? 'Parametres par type' : 'Per-type Settings'}
          </h3>

          {Object.entries(CATEGORIES).map(([category, label]) => {
            const types = NOTIFICATION_TYPES.filter((t) => t.category === category)
            if (types.length === 0) return null

            return (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  {label[locale as 'en' | 'fr']}
                </h4>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {types.map((typeConfig) => (
                    <div
                      key={typeConfig.type}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {typeConfig.label[locale as 'en' | 'fr']}
                        </p>
                        <p className="text-xs text-gray-500">
                          {typeConfig.description[locale as 'en' | 'fr']}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTypePreference(typeConfig.type, 'email')}
                          disabled={!preferences?.email_enabled}
                          className={`p-2 rounded-lg transition-all ${
                            getTypePreference(typeConfig.type, 'email') && preferences?.email_enabled
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-gray-100 text-gray-400'
                          } ${!preferences?.email_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleTypePreference(typeConfig.type, 'push')}
                          disabled={!preferences?.push_enabled}
                          className={`p-2 rounded-lg transition-all ${
                            getTypePreference(typeConfig.type, 'push') && preferences?.push_enabled
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-gray-100 text-gray-400'
                          } ${!preferences?.push_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Push"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              {locale === 'fr' ? 'Enregistrer les preferences' : 'Save Preferences'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
