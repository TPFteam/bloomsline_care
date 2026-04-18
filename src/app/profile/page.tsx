'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { analytics } from '@/lib/analytics/events'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  GraduationCap,
  Briefcase,
  Mail,
  Settings,
  Eye,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  Shield,
  Plus,
  X,
  ExternalLink,
  Camera,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type {
  PractitionerProfile,
  Specialty,
  TherapeuticApproach,
  AgeGroup,
  SessionType,
  ClientAcceptanceStatus,
  Education,
  License,
  Publication,
  PublicationType,
} from '@/types/practitioner-profile'
import { generateSlug } from '@/types/practitioner-profile'

type TabId = 'about' | 'credentials' | 'practice' | 'publications' | 'contact' | 'settings'

const PUBLICATION_TYPES: { value: PublicationType; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'blog', label: 'Blog' },
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
]

// All specialties options
const SPECIALTIES: Specialty[] = [
  'stress_anxiety', 'confidence_esteem', 'emotional_regulation', 'relationships',
  'work_career', 'burnout', 'decision_making', 'life_transitions',
  'nutrition', 'grief_loss', 'trauma', 'parenting', 'addiction', 'sleep'
]

// All approaches options
const THERAPEUTIC_APPROACHES: TherapeuticApproach[] = [
  'cbt', 'psychodynamic', 'psychoanalysis', 'integrative', 'acceptance_commitment',
  'emdr', 'systemic', 'humanistic', 'dbt', 'solution_focused',
]
const COACHING_APPROACHES: TherapeuticApproach[] = [
  'professional_coaching', 'life_coaching', 'nlp', 'emotional_intelligence',
  'mindfulness', 'goal_oriented', 'narrative',
]

// Age groups
const AGE_GROUPS: AgeGroup[] = ['children', 'adolescents', 'young_adults', 'adults', 'seniors']

// Session types
const SESSION_TYPES: SessionType[] = ['individual', 'couples', 'family', 'group']

export default function ProfilePage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingPubImage, setUploadingPubImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [user, setUser] = useState<{ id: string; full_name: string | null; avatar_url: string | null; email: string } | null>(null)
  const [profile, setProfile] = useState<Partial<PractitionerProfile>>({
    headline: '',
    bio: '',
    city: '',
    country: '',
    credentials: [],
    education: [],
    licenses: [],
    certifications: [],
    specialties: [],
    approaches: [],
    age_groups: [],
    session_types: [],
    languages: ['English'],
    offers_telehealth: true,
    offers_in_person: false,
    client_acceptance_status: 'accepting',
    show_fees: false,
    insurance_accepted: [],
    offers_sliding_scale: false,
    social_links: { website: null, linkedin: null, twitter: null, instagram: null, facebook: null },
    contact_email: '',
    contact_phone: '',
    publications: [],
    is_public: false,
    slug: '',
  })
  const [profileCompleteness, setProfileCompleteness] = useState(0)

  useEffect(() => {
    fetchProfileData()
  }, [])

  useEffect(() => {
    // Calculate profile completeness whenever profile changes
    const completeness = calculateCompletenessLocal(profile)
    setProfileCompleteness(completeness)
  }, [profile])

  const calculateCompletenessLocal = (p: Partial<PractitionerProfile>): number => {
    let score = 0
    if (p.headline && p.headline.length > 0) score += 15
    if (p.bio && p.bio.length > 50) score += 20
    if (p.credentials && p.credentials.length > 0) score += 10
    if (p.education && p.education.length > 0) score += 10
    if (p.licenses && p.licenses.length > 0) score += 10
    if (p.specialties && p.specialties.length > 0) score += 15
    if (p.approaches && p.approaches.length > 0) score += 10
    if (p.contact_email) score += 5
    if (p.years_experience) score += 5
    return Math.min(100, score)
  }

  const fetchProfileData = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        setLoading(false)
        return
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        console.log('User data not found, using auth user:', userError.code)
        // Use auth user data as fallback
        setUser({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          email: authUser.email || '',
        })
      } else if (userData) {
        setUser(userData)
      }

      // Get profile data - this table might not exist yet
      try {
        const { data: profileData, error } = await supabase
          .from('practitioner_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine for new profiles
          if (error.code === '42P01') {
            // Table doesn't exist yet
            console.log('Profile table not yet created - run the migration')
          } else {
            console.error('Error fetching profile:', error)
          }
        }

        if (profileData) {
          // If profile exists but has no slug, generate one from the user's name
          const defaultSlug = !profileData.slug && (userData?.full_name || authUser.user_metadata?.full_name)
            ? generateSlug(userData?.full_name || authUser.user_metadata?.full_name)
            : null
          setProfile({
            ...profileData,
            contact_email: profileData.contact_email || userData?.email || authUser.email || '',
            ...(defaultSlug ? { slug: defaultSlug } : {}),
          })
        } else {
          // New profile — generate default slug from name
          const fullName = userData?.full_name || authUser.user_metadata?.full_name || ''
          setProfile(prev => ({
            ...prev,
            contact_email: userData?.email || authUser.email || '',
            slug: fullName ? generateSlug(fullName) : '',
          }))
        }
      } catch (profileError) {
        console.log('Could not fetch profile data:', profileError)
        // Continue without profile data - user can still edit
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(t.profile.errors.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const profileData = {
        user_id: user.id,
        headline: profile.headline || null,
        bio: profile.bio || null,
        city: profile.city || null,
        country: profile.country || null,
        intro_video_url: profile.intro_video_url || null,
        credentials: profile.credentials || [],
        education: profile.education || [],
        licenses: profile.licenses || [],
        certifications: profile.certifications || [],
        years_experience: profile.years_experience || null,
        specialties: profile.specialties || [],
        approaches: profile.approaches || [],
        age_groups: profile.age_groups || [],
        session_types: profile.session_types || [],
        languages: profile.languages || ['English'],
        practice_location: profile.practice_location || null,
        offers_telehealth: profile.offers_telehealth ?? true,
        offers_in_person: profile.offers_in_person ?? false,
        client_acceptance_status: profile.client_acceptance_status || 'accepting',
        show_fees: profile.show_fees ?? false,
        session_fee_min: profile.session_fee_min || null,
        session_fee_max: profile.session_fee_max || null,
        fee_currency: profile.fee_currency || 'USD',
        insurance_accepted: profile.insurance_accepted || [],
        offers_sliding_scale: profile.offers_sliding_scale ?? false,
        social_links: profile.social_links || null,
        contact_email: profile.contact_email || null,
        contact_phone: profile.contact_phone || null,
        publications: profile.publications || [],
        show_availability: profile.show_availability !== false,
        show_languages: profile.show_languages !== false,
        is_public: profile.is_public ?? false,
        slug: profile.slug || null,
        profile_completeness: profileCompleteness,
      }

      const { error } = await supabase
        .from('practitioner_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (error) {
        if (error.code === '42P01') {
          toast.error(locale === 'fr' ? 'Le système de profil est en cours de configuration. Veuillez réessayer plus tard.' : 'Profile system is being set up. Please try again later.')
          return
        }
        throw error
      }

      // Sync key fields to public_practitioners if linked (via API — RLS blocks direct update)
      await fetch('/api/profile/sync-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: profileData.headline,
          bio: profileData.bio,
          city: profileData.city,
          country: profileData.country,
          credentials: profileData.credentials,
          specialties: profileData.specialties,
          approaches: profileData.approaches,
          languages: profileData.languages,
          contact_email: profileData.contact_email,
          contact_phone: profileData.contact_phone,
        }),
      }).catch(() => {}) // Don't fail if sync fails

      toast.success(t.profile.success.saved)
      analytics.profileUpdated({ section: 'practice' })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(t.profile.errors.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(locale === 'fr' ? 'Veuillez sélectionner un fichier image' : 'Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'fr' ? 'L\'image doit faire moins de 5 Mo' : 'Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // If bucket doesn't exist, create it or show friendly error
        if (uploadError.message.includes('not found')) {
          toast.error(locale === 'fr' ? 'Le stockage des avatars est en cours de configuration. Veuillez réessayer plus tard.' : 'Avatar storage is being set up. Please try again later.')
          return
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast.success(locale === 'fr' ? 'Photo de profil mise à jour !' : 'Profile photo updated!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(locale === 'fr' ? 'Impossible de télécharger l\'image. Veuillez réessayer.' : 'Failed to upload image. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'about', label: t.profile.tabs.about, icon: User },
    { id: 'credentials', label: t.profile.tabs.credentials, icon: GraduationCap },
    { id: 'practice', label: t.profile.tabs.practice, icon: Briefcase },
    { id: 'publications', label: 'Publications', icon: BookOpen },
    { id: 'contact', label: t.profile.tabs.contact, icon: Mail },
    { id: 'settings', label: t.profile.tabs.settings, icon: Settings },
  ]

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    if (array.includes(item)) {
      return array.filter(i => i !== item)
    }
    return [...array, item]
  }

  const addEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      degree: '',
      institution: '',
      year_completed: null,
    }
    setProfile(prev => ({
      ...prev,
      education: [...(prev.education || []), newEducation],
    }))
  }

  const updateEducation = (id: string, field: keyof Education, value: string | number | null) => {
    setProfile(prev => ({
      ...prev,
      education: (prev.education || []).map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }))
  }

  const removeEducation = (id: string) => {
    setProfile(prev => ({
      ...prev,
      education: (prev.education || []).filter(edu => edu.id !== id),
    }))
  }

  const addLicense = () => {
    const newLicense: License = {
      id: crypto.randomUUID(),
      type: '',
      number: null,
      state_province: null,
      expiration_date: null,
      is_verified: false,
    }
    setProfile(prev => ({
      ...prev,
      licenses: [...(prev.licenses || []), newLicense],
    }))
  }

  const updateLicense = (id: string, field: keyof License, value: string | boolean | null) => {
    setProfile(prev => ({
      ...prev,
      licenses: (prev.licenses || []).map(lic =>
        lic.id === id ? { ...lic, [field]: value } : lic
      ),
    }))
  }

  const removeLicense = (id: string) => {
    setProfile(prev => ({
      ...prev,
      licenses: (prev.licenses || []).filter(lic => lic.id !== id),
    }))
  }

  const addPublication = () => {
    const newPub: Publication = {
      id: crypto.randomUUID(),
      type: 'article',
      title: '',
      description: null,
      url: '',
      image_url: null,
    }
    setProfile(prev => ({ ...prev, publications: [...(prev.publications || []), newPub] }))
  }

  const updatePublication = (id: string, field: keyof Publication, value: string | null) => {
    setProfile(prev => ({
      ...prev,
      publications: (prev.publications || []).map(pub => pub.id === id ? { ...pub, [field]: value } : pub),
    }))
  }

  const removePublication = (id: string) => {
    setProfile(prev => ({ ...prev, publications: (prev.publications || []).filter(pub => pub.id !== id) }))
  }

  const handlePublicationImageUpload = async (pubId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(locale === 'fr' ? 'Veuillez sélectionner un fichier image' : 'Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'fr' ? 'L\'image doit faire moins de 5 Mo' : 'Image must be less than 5MB')
      return
    }

    setUploadingPubImage(pubId)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `publications/${Date.now()}-${pubId}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          toast.error(locale === 'fr' ? 'Le stockage est en cours de configuration. Veuillez réessayer plus tard.' : 'Storage is being set up. Please try again later.')
          return
        }
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      updatePublication(pubId, 'image_url', publicUrl)
      toast.success(locale === 'fr' ? 'Image téléchargée !' : 'Image uploaded!')
    } catch (error) {
      console.error('Error uploading publication image:', error)
      toast.error(locale === 'fr' ? 'Impossible de télécharger l\'image' : 'Failed to upload image')
    } finally {
      setUploadingPubImage(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="text-gray-500 text-sm">{t.dashboard.loading}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user as any}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <User className="w-4 h-4" />
              <span>{t.profile.title}</span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mb-6">
            {user && (
              <Link
                href={`/practitioner/${profile.is_public && profile.slug ? profile.slug : user.id}`}
                target="_blank"
              >
                <Button variant="outline" className="rounded-xl">
                  <Eye className="w-4 h-4 mr-2" />
                  {profile.is_public ? t.profile.viewPublicProfile : 'Preview Profile'}
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.profile.actions.saving}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t.profile.actions.save}
                </>
              )}
            </Button>
          </div>

          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 flex justify-center md:justify-start">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-2xl overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.full_name?.charAt(0) || 'P'
                      )}

                      {/* Upload overlay */}
                      <label className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center cursor-pointer transition-all duration-200 group/upload rounded-2xl">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                        <div className="opacity-0 group-hover/upload:opacity-100 transition-opacity duration-200">
                          {uploadingAvatar ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          ) : (
                            <Camera className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-xl font-semibold text-gray-900 mb-1">
                    {user?.full_name || t.profile.title}
                  </h1>
                  {profile.credentials && profile.credentials.length > 0 && (
                    <p className="text-gray-600 text-sm mb-2">{profile.credentials.join(', ')}</p>
                  )}
                  {profile.headline && (
                    <p className="text-gray-500 text-sm">{profile.headline}</p>
                  )}
                  {(profile.city || profile.country) && (
                    <p className="text-gray-400 text-xs mt-1">
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3 flex-wrap">
                    {profile.is_public ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700">
                        <Globe className="w-3 h-3 mr-1" />
                        Public Profile
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Private Profile
                      </span>
                    )}
                  </div>
                </div>

                {/* Completeness */}
                <div className="flex-shrink-0 text-center md:text-right">
                  <div className="inline-flex flex-col items-center bg-gray-50 rounded-xl p-4">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${profileCompleteness * 1.76} 176`}
                          strokeLinecap="round"
                          className="text-gray-900 transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">{profileCompleteness}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t.profile.completeness.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 overflow-x-auto"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">{t.profile.about.title}</h2>

                  {/* Headline */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.profile.about.headline.label}
                    </label>
                    <input
                      type="text"
                      value={profile.headline || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, headline: e.target.value }))}
                      placeholder={t.profile.about.headline.placeholder}
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.profile.about.headline.help}</p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.profile.about.bio.label}
                    </label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder={t.profile.about.bio.placeholder}
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.profile.about.bio.help}</p>
                  </div>

                  {/* City & Country */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Ville' : 'City'}
                      </label>
                      <input
                        type="text"
                        value={profile.city || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                        placeholder={locale === 'fr' ? 'Lyon' : 'Paris'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Pays' : 'Country'}
                      </label>
                      <input
                        type="text"
                        value={profile.country || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                        placeholder={locale === 'fr' ? 'France' : 'France'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credentials Tab */}
            {activeTab === 'credentials' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.profile.credentials.title}</h2>

                  {/* Credentials List */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.profile.credentials.credentialsList.label}
                    </label>
                    <input
                      type="text"
                      value={profile.credentials?.join(', ') || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        credentials: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder={t.profile.credentials.credentialsList.placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.profile.credentials.credentialsList.help}</p>
                  </div>

                  {/* Years of Experience */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.profile.credentials.yearsExperience.label}
                    </label>
                    <input
                      type="number"
                      value={profile.years_experience || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, years_experience: parseInt(e.target.value) || null }))}
                      placeholder={t.profile.credentials.yearsExperience.placeholder}
                      min={0}
                      max={60}
                      className="w-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                    />
                  </div>

                  {/* Education */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{t.profile.credentials.education.title}</h3>
                      <Button onClick={addEducation} variant="outline" size="sm" className="rounded-xl">
                        <Plus className="w-4 h-4 mr-1" />
                        {t.profile.credentials.education.add}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {profile.education?.map((edu) => (
                        <div key={edu.id} className="flex gap-4 items-start bg-gray-50/80 rounded-xl p-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              placeholder={t.profile.credentials.education.degreePlaceholder}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              placeholder={t.profile.credentials.education.institutionPlaceholder}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                            <input
                              type="number"
                              value={edu.year_completed || ''}
                              onChange={(e) => updateEducation(edu.id, 'year_completed', parseInt(e.target.value) || null)}
                              placeholder={t.profile.credentials.education.year}
                              min={1950}
                              max={new Date().getFullYear()}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!profile.education || profile.education.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No education added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Licenses */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{t.profile.credentials.licenses.title}</h3>
                      <Button onClick={addLicense} variant="outline" size="sm" className="rounded-xl">
                        <Plus className="w-4 h-4 mr-1" />
                        {t.profile.credentials.licenses.add}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {profile.licenses?.map((lic) => (
                        <div key={lic.id} className="flex gap-4 items-start bg-gray-50/80 rounded-xl p-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                              type="text"
                              value={lic.type}
                              onChange={(e) => updateLicense(lic.id, 'type', e.target.value)}
                              placeholder={t.profile.credentials.licenses.typePlaceholder}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                            <input
                              type="text"
                              value={lic.number || ''}
                              onChange={(e) => updateLicense(lic.id, 'number', e.target.value || null)}
                              placeholder={t.profile.credentials.licenses.number}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                            <input
                              type="text"
                              value={lic.state_province || ''}
                              onChange={(e) => updateLicense(lic.id, 'state_province', e.target.value || null)}
                              placeholder={t.profile.credentials.licenses.state}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                            <input
                              type="date"
                              value={lic.expiration_date || ''}
                              onChange={(e) => updateLicense(lic.id, 'expiration_date', e.target.value || null)}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeLicense(lic.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!profile.licenses || profile.licenses.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No licenses added yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Practice Tab */}
            {activeTab === 'practice' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.profile.practice.title}</h2>

                  {/* Specialties */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t.profile.practice.specialties.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTIES.map((specialty) => {
                        const isSelected = profile.specialties?.includes(specialty)
                        return (
                          <button
                            key={specialty}
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              specialties: toggleArrayItem(prev.specialties || [], specialty)
                            }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-gray-100 text-gray-900 border-2 border-gray-400'
                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {t.profile.specialties[specialty as keyof typeof t.profile.specialties] || specialty}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Approaches */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t.profile.practice.approaches.label}
                    </label>

                    {/* Therapeutic */}
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      {locale === 'fr' ? 'Approches thérapeutiques' : 'Therapeutic approaches'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {THERAPEUTIC_APPROACHES.map((approach) => {
                        const isSelected = profile.approaches?.includes(approach)
                        return (
                          <button
                            key={approach}
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              approaches: toggleArrayItem(prev.approaches || [], approach)
                            }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-mint-100 text-mint-700 border-2 border-mint-400'
                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {t.profile.approaches[approach as keyof typeof t.profile.approaches] || approach}
                          </button>
                        )
                      })}
                    </div>

                    {/* Coaching */}
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      {locale === 'fr' ? 'Approches coaching' : 'Coaching approaches'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {COACHING_APPROACHES.map((approach) => {
                        const isSelected = profile.approaches?.includes(approach)
                        return (
                          <button
                            key={approach}
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              approaches: toggleArrayItem(prev.approaches || [], approach)
                            }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-mint-100 text-mint-700 border-2 border-mint-400'
                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {t.profile.approaches[approach as keyof typeof t.profile.approaches] || approach}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Age Groups */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t.profile.practice.ageGroups.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AGE_GROUPS.map((ageGroup) => {
                        const isSelected = profile.age_groups?.includes(ageGroup)
                        return (
                          <button
                            key={ageGroup}
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              age_groups: toggleArrayItem(prev.age_groups || [], ageGroup)
                            }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-coral-100 text-coral-700 border-2 border-coral-400'
                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {t.profile.ageGroups[ageGroup as keyof typeof t.profile.ageGroups] || ageGroup}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Session Types */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t.profile.practice.sessionTypes.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SESSION_TYPES.map((sessionType) => {
                        const isSelected = profile.session_types?.includes(sessionType)
                        return (
                          <button
                            key={sessionType}
                            onClick={() => setProfile(prev => ({
                              ...prev,
                              session_types: toggleArrayItem(prev.session_types || [], sessionType)
                            }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-peach-100 text-peach-700 border-2 border-peach-400'
                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {t.profile.sessionTypes[sessionType as keyof typeof t.profile.sessionTypes] || sessionType}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{t.profile.practice.availability.title}</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-400">
                          {profile.show_availability !== false
                            ? (locale === 'fr' ? 'Visible' : 'Visible')
                            : (locale === 'fr' ? 'Masqué' : 'Hidden')}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={profile.show_availability !== false}
                          onClick={() => setProfile(prev => ({ ...prev, show_availability: !(prev.show_availability !== false) }))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${profile.show_availability !== false ? 'bg-gray-900' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${profile.show_availability !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                        </button>
                      </label>
                    </div>
                    {profile.show_availability !== false && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.offers_telehealth}
                              onChange={(e) => setProfile(prev => ({ ...prev, offers_telehealth: e.target.checked }))}
                              className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <span className="text-sm text-gray-700">{t.profile.practice.availability.telehealth}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile.offers_in_person}
                              onChange={(e) => setProfile(prev => ({ ...prev, offers_in_person: e.target.checked }))}
                              className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                            />
                            <span className="text-sm text-gray-700">{t.profile.practice.availability.inPerson}</span>
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {(['accepting', 'waitlist', 'not_accepting'] as ClientAcceptanceStatus[]).map((status) => (
                            <button
                              key={status}
                              onClick={() => setProfile(prev => ({ ...prev, client_acceptance_status: status }))}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                profile.client_acceptance_status === status
                                  ? status === 'accepting'
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400'
                                    : status === 'waitlist'
                                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
                                    : 'bg-red-100 text-red-700 border-2 border-red-400'
                                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                              }`}
                            >
                              {t.profile.practice.availability[status === 'accepting' ? 'acceptingClients' : status === 'waitlist' ? 'waitlistOnly' : 'notAccepting']}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Languages */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t.profile.practice.languages.label}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-400">
                          {profile.show_languages !== false
                            ? (locale === 'fr' ? 'Visible' : 'Visible')
                            : (locale === 'fr' ? 'Masqué' : 'Hidden')}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={profile.show_languages !== false}
                          onClick={() => setProfile(prev => ({ ...prev, show_languages: !(prev.show_languages !== false) }))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${profile.show_languages !== false ? 'bg-gray-900' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${profile.show_languages !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                        </button>
                      </label>
                    </div>
                    {profile.show_languages !== false && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'Français', en: 'French', fr: 'Français' },
                            { key: 'English', en: 'English', fr: 'Anglais' },
                            { key: 'Español', en: 'Spanish', fr: 'Espagnol' },
                            { key: 'Deutsch', en: 'German', fr: 'Allemand' },
                            { key: 'Italiano', en: 'Italian', fr: 'Italien' },
                            { key: 'Português', en: 'Portuguese', fr: 'Portugais' },
                            { key: 'Nederlands', en: 'Dutch', fr: 'Néerlandais' },
                            { key: 'العربية', en: 'Arabic', fr: 'Arabe' },
                            { key: 'Türkçe', en: 'Turkish', fr: 'Turc' },
                            { key: 'Русский', en: 'Russian', fr: 'Russe' },
                            { key: 'Polski', en: 'Polish', fr: 'Polonais' },
                            { key: 'Română', en: 'Romanian', fr: 'Roumain' },
                            { key: '中文', en: 'Chinese', fr: 'Chinois' },
                            { key: '日本語', en: 'Japanese', fr: 'Japonais' },
                            { key: '한국어', en: 'Korean', fr: 'Coréen' },
                            { key: 'हिन्दी', en: 'Hindi', fr: 'Hindi' },
                            { key: 'Ελληνικά', en: 'Greek', fr: 'Grec' },
                            { key: 'Svenska', en: 'Swedish', fr: 'Suédois' },
                            { key: 'Dansk', en: 'Danish', fr: 'Danois' },
                            { key: 'Suomi', en: 'Finnish', fr: 'Finnois' },
                          ].map((lang) => {
                            const isSelected = profile.languages?.includes(lang.key)
                            return (
                              <button
                                key={lang.key}
                                type="button"
                                onClick={() => {
                                  setProfile(prev => ({
                                    ...prev,
                                    languages: isSelected
                                      ? (prev.languages || []).filter(l => l !== lang.key)
                                      : [...(prev.languages || []), lang.key]
                                  }))
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                  isSelected
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                {locale === 'fr' ? lang.fr : lang.en}
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{t.profile.practice.languages.help}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Publications Tab */}
            {activeTab === 'publications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Publications</h2>
                      <p className="text-sm text-gray-500 mt-1">Books, podcasts, blogs, articles, videos</p>
                    </div>
                    <Button onClick={addPublication} variant="outline" size="sm" className="rounded-xl">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(profile.publications || []).map((pub) => (
                      <div key={pub.id} className="bg-gray-50/80 rounded-xl p-5 border border-gray-100">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <select
                            value={pub.type}
                            onChange={(e) => updatePublication(pub.id, 'type', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm bg-white"
                          >
                            {PUBLICATION_TYPES.map((pt) => (
                              <option key={pt.value} value={pt.value}>{pt.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removePublication(pub.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                            <input
                              type="text"
                              value={pub.title}
                              onChange={(e) => updatePublication(pub.id, 'title', e.target.value)}
                              placeholder="Publication title"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">URL *</label>
                            <input
                              type="url"
                              value={pub.url}
                              onChange={(e) => updatePublication(pub.id, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={pub.description || ''}
                              onChange={(e) => updatePublication(pub.id, 'description', e.target.value || null)}
                              placeholder="Short description"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Cover Image</label>
                            <div className="flex items-center gap-3">
                              {pub.image_url && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                  <img src={pub.image_url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => updatePublication(pub.id, 'image_url', null)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-sm text-gray-600">
                                {uploadingPubImage === pub.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Camera className="w-4 h-4" />
                                )}
                                <span>{pub.image_url ? 'Change' : 'Upload'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePublicationImageUpload(pub.id, e)}
                                  className="hidden"
                                  disabled={uploadingPubImage === pub.id}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!profile.publications || profile.publications.length === 0) && (
                      <div className="text-center py-8">
                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No publications added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.profile.contact.title}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.profile.contact.email.label}
                      </label>
                      <input
                        type="email"
                        value={profile.contact_email || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t.profile.contact.email.help}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.profile.contact.phone.label}
                      </label>
                      <input
                        type="tel"
                        value={profile.contact_phone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t.profile.contact.phone.help}</p>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t.profile.contact.social.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.profile.contact.social.website}
                        </label>
                        <input
                          type="url"
                          value={profile.social_links?.website || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, website: e.target.value || null } as any
                          }))}
                          placeholder="https://yourwebsite.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.profile.contact.social.linkedin}
                        </label>
                        <input
                          type="url"
                          value={profile.social_links?.linkedin || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, linkedin: e.target.value || null } as any
                          }))}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        <input
                          type="url"
                          value={profile.social_links?.instagram || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, instagram: e.target.value || null } as any
                          }))}
                          placeholder="https://instagram.com/yourprofile"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={profile.social_links?.facebook || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            social_links: { ...prev.social_links, facebook: e.target.value || null } as any
                          }))}
                          placeholder="https://facebook.com/yourpage"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.profile.settings.title}</h2>

                  {/* Visibility */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t.profile.settings.visibility.title}</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, is_public: true }))}
                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                          profile.is_public
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className={`w-5 h-5 ${profile.is_public ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span className={`font-medium ${profile.is_public ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {t.profile.settings.visibility.public}
                          </span>
                          {profile.is_public && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                        </div>
                        <p className="text-sm text-gray-500">{t.profile.settings.visibility.publicDescription}</p>
                      </button>

                      <button
                        onClick={() => setProfile(prev => ({ ...prev, is_public: false }))}
                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                          !profile.is_public
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className={`w-5 h-5 ${!profile.is_public ? 'text-gray-600' : 'text-gray-400'}`} />
                          <span className={`font-medium ${!profile.is_public ? 'text-gray-700' : 'text-gray-500'}`}>
                            {t.profile.settings.visibility.private}
                          </span>
                          {!profile.is_public && <CheckCircle2 className="w-5 h-5 text-gray-500 ml-auto" />}
                        </div>
                        <p className="text-sm text-gray-500">{t.profile.settings.visibility.privateDescription}</p>
                      </button>
                    </div>
                  </div>

                  {/* Profile URL */}
                  {profile.is_public && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.profile.settings.slug.label}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">bloomsline.com/practitioner/</span>
                        <input
                          type="text"
                          value={profile.slug || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          }))}
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t.profile.settings.slug.help}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
