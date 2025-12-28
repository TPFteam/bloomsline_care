'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  LogOut,
  Loader2,
  Check,
  Sparkles,
  Bell,
  Mail,
  Smartphone,
  Phone,
  Edit2,
  X,
} from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

interface MemberProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  created_at: string
}

interface NotificationPrefs {
  email_enabled: boolean
  push_enabled: boolean
}

interface EditableInfo {
  phone: string
}

export default function MemberSettingsPage() {
  const router = useRouter()
  const { locale, setLocale } = useLanguage()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    email_enabled: true,
    push_enabled: true,
  })
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [editableInfo, setEditableInfo] = useState<EditableInfo>({ phone: '' })
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isSavingPhone, setIsSavingPhone] = useState(false)

  // Translations
  const t = {
    en: {
      title: 'Settings',
      profile: 'Your Profile',
      viewProfile: 'View full profile',
      memberSince: 'Member since',
      language: 'Language',
      languageDescription: 'Choose your preferred language',
      english: 'English',
      french: 'Français',
      logout: 'Log out',
      logoutDescription: 'Sign out of your account',
      loggingOut: 'Logging out...',
      version: 'Version 1.0.0',
      madeWith: 'Made with care',
      notifications: 'Notifications',
      notificationsDescription: 'Choose how you receive updates',
      emailNotifications: 'Email',
      pushNotifications: 'Push',
      saving: 'Saving...',
      contactInfo: 'Contact Information',
      contactDescription: 'Update your contact details',
      phone: 'Phone Number',
      phonePlaceholder: 'Enter phone number',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      phoneUpdated: 'Phone number updated',
      errorUpdating: 'Error updating phone',
      notProvided: 'Not provided',
    },
    fr: {
      title: 'Paramètres',
      profile: 'Votre Profil',
      viewProfile: 'Voir le profil complet',
      memberSince: 'Membre depuis',
      language: 'Langue',
      languageDescription: 'Choisissez votre langue préférée',
      english: 'English',
      french: 'Français',
      logout: 'Déconnexion',
      logoutDescription: 'Se déconnecter de votre compte',
      loggingOut: 'Déconnexion...',
      version: 'Version 1.0.0',
      madeWith: 'Fait avec soin',
      notifications: 'Notifications',
      notificationsDescription: 'Choisissez comment recevoir les mises à jour',
      emailNotifications: 'Email',
      pushNotifications: 'Push',
      saving: 'Enregistrement...',
      contactInfo: 'Coordonnées',
      contactDescription: 'Mettez à jour vos coordonnées',
      phone: 'Numéro de téléphone',
      phonePlaceholder: 'Entrez le numéro de téléphone',
      edit: 'Modifier',
      save: 'Enregistrer',
      cancel: 'Annuler',
      phoneUpdated: 'Numéro de téléphone mis à jour',
      errorUpdating: 'Erreur lors de la mise à jour',
      notProvided: 'Non fourni',
    },
  }

  const text = locale === 'fr' ? t.fr : t.en

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: member } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, avatar_url, created_at')
        .eq('user_id', user.id)
        .single()

      if (member) {
        setProfile({
          ...member,
          email: user.email || '',
        })
        setEditableInfo({ phone: member.phone || '' })
      }

      // Fetch notification preferences (use maybeSingle to handle no row gracefully)
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_enabled, push_enabled')
        .eq('user_id', user.id)
        .maybeSingle()

      if (prefs) {
        setNotificationPrefs({
          email_enabled: prefs.email_enabled ?? true,
          push_enabled: prefs.push_enabled ?? true,
        })
      }
      // If no prefs exist, keep defaults (true, true)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (newLocale: 'en' | 'fr') => {
    setLocale(newLocale)
    toast.success(newLocale === 'fr' ? 'Langue changée' : 'Language changed')
  }

  const handleNotificationToggle = async (type: 'email_enabled' | 'push_enabled') => {
    const newPrefs = {
      ...notificationPrefs,
      [type]: !notificationPrefs[type],
    }
    setNotificationPrefs(newPrefs)
    setIsSavingNotifications(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          user_type: 'member',
          ...newPrefs,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      toast.success(locale === 'fr' ? 'Préférences enregistrées' : 'Preferences saved')
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      // Revert on error
      setNotificationPrefs(notificationPrefs)
      toast.error(locale === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Error saving preferences')
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const handleSavePhone = async () => {
    if (!profile) return

    setIsSavingPhone(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ phone: editableInfo.phone || null })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, phone: editableInfo.phone })
      setIsEditingPhone(false)
      toast.success(text.phoneUpdated)
    } catch (error) {
      console.error('Error updating phone:', error)
      toast.error(text.errorUpdating)
    } finally {
      setIsSavingPhone(false)
    }
  }

  const handleCancelPhoneEdit = () => {
    setEditableInfo({ phone: profile?.phone || '' })
    setIsEditingPhone(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la déconnexion' : 'Error logging out')
      setIsLoggingOut(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  const getInitials = () => {
    if (!profile) return '?'
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{text.title}</h1>
          </div>
        </motion.div>

        <div className="space-y-5">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-6 text-white relative overflow-hidden"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-white/80 text-sm">{profile?.email}</p>
                <p className="text-white/60 text-xs mt-1">
                  {text.memberSince} {profile?.created_at ? formatDate(profile.created_at) : '-'}
                </p>
              </div>
            </div>

            {/* View Profile Button */}
            <button
              onClick={() => router.push('/profile/member')}
              className="mt-4 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              {text.viewProfile}
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Contact Information / Phone Edit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{text.contactInfo}</h3>
                <p className="text-sm text-gray-500">{text.contactDescription}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-500">{text.phone}</label>
                {!isEditingPhone && (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {text.edit}
                  </button>
                )}
              </div>

              {isEditingPhone ? (
                <div className="space-y-3">
                  <input
                    type="tel"
                    value={editableInfo.phone}
                    onChange={(e) => setEditableInfo({ phone: e.target.value })}
                    placeholder={text.phonePlaceholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelPhoneEdit}
                      disabled={isSavingPhone}
                      className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {text.cancel}
                    </button>
                    <button
                      onClick={handleSavePhone}
                      disabled={isSavingPhone}
                      className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingPhone ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {isSavingPhone ? text.saving : text.save}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`font-medium ${profile?.phone ? 'text-gray-900' : 'text-gray-400'}`}>
                  {profile?.phone || text.notProvided}
                </p>
              )}
            </div>
          </motion.div>

          {/* Language Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{text.language}</h3>
                <p className="text-sm text-gray-500">{text.languageDescription}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`relative py-4 px-4 rounded-2xl border-2 transition-all ${
                  locale === 'en'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                {locale === 'en' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                <span className="text-2xl mb-1 block">🇬🇧</span>
                <span className={`font-medium ${locale === 'en' ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {text.english}
                </span>
              </button>

              <button
                onClick={() => handleLanguageChange('fr')}
                className={`relative py-4 px-4 rounded-2xl border-2 transition-all ${
                  locale === 'fr'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                {locale === 'fr' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                <span className="text-2xl mb-1 block">🇫🇷</span>
                <span className={`font-medium ${locale === 'fr' ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {text.french}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{text.notifications}</h3>
                <p className="text-sm text-gray-500">{text.notificationsDescription}</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Email Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    notificationPrefs.email_enabled
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-gray-700">{text.emailNotifications}</span>
                </div>
                <button
                  onClick={() => handleNotificationToggle('email_enabled')}
                  disabled={isSavingNotifications}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    notificationPrefs.email_enabled ? 'bg-emerald-500' : 'bg-gray-300'
                  } ${isSavingNotifications ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      notificationPrefs.email_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    notificationPrefs.push_enabled
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-gray-700">{text.pushNotifications}</span>
                </div>
                <button
                  onClick={() => handleNotificationToggle('push_enabled')}
                  disabled={isSavingNotifications}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    notificationPrefs.push_enabled ? 'bg-emerald-500' : 'bg-gray-300'
                  } ${isSavingNotifications ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      notificationPrefs.push_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-red-50 hover:border-red-100 transition-all group disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors">
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-red-600">
                {isLoggingOut ? text.loggingOut : text.logout}
              </h3>
              <p className="text-sm text-gray-500">{text.logoutDescription}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
          </motion.button>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-6"
          >
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{text.madeWith}</span>
            </div>
            <p className="text-gray-300 text-xs mt-1">{text.version}</p>
          </motion.div>
        </div>
      </div>
    </MemberLayout>
  )
}
