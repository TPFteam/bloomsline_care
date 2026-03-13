'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  ArrowLeft,
  Users,
  Camera,
  BookOpen,
  Link2,
  Unlink,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type {
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
import type { PublicPractitioner } from '@/types/public-practitioner'
import type { User as UserType } from '@/types/user'

type TabId = 'about' | 'credentials' | 'practice' | 'publications' | 'contact' | 'settings'

const PUBLICATION_TYPES: { value: PublicationType; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'blog', label: 'Blog' },
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
]

const SPECIALTIES: Specialty[] = [
  'anxiety', 'depression', 'trauma_ptsd', 'grief_loss', 'relationships',
  'family', 'couples', 'stress', 'self_esteem', 'life_transitions',
  'career', 'addiction', 'eating_disorders', 'ocd', 'adhd',
  'autism', 'bipolar', 'personality_disorders', 'anger_management',
  'parenting', 'lgbtq', 'cultural_identity', 'spirituality', 'chronic_illness', 'sleep'
]

const APPROACHES: TherapeuticApproach[] = [
  'cbt', 'dbt', 'emdr', 'psychodynamic', 'humanistic', 'solution_focused',
  'narrative', 'mindfulness', 'art_therapy', 'play_therapy', 'family_systems',
  'gestalt', 'acceptance_commitment', 'motivational_interviewing', 'trauma_informed', 'somatic'
]

const AGE_GROUPS: AgeGroup[] = ['children', 'adolescents', 'young_adults', 'adults', 'seniors']
const SESSION_TYPES: SessionType[] = ['individual', 'couples', 'family', 'group']

const EMPTY_FORM: Partial<PublicPractitioner> = {
  full_name: '',
  avatar_url: '',
  headline: '',
  bio: '',
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
  show_availability: true,
  show_languages: true,
  show_fees: false,
  session_fee_min: null,
  session_fee_max: null,
  fee_currency: 'USD',
  insurance_accepted: [],
  offers_sliding_scale: false,
  social_links: { website: null, linkedin: null, twitter: null, instagram: null, facebook: null },
  contact_email: '',
  contact_phone: '',
  publications: [],
  is_published: false,
  slug: '',
}

export default function AdminEditPractitionerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const isNew = resolvedParams.id === 'new'

  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingPubImage, setUploadingPubImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [authUser, setAuthUser] = useState<UserType | null>(null)
  const [form, setForm] = useState<Partial<PublicPractitioner>>(EMPTY_FORM)

  // Account linking state
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null)
  const [linkedAt, setLinkedAt] = useState<string | null>(null)
  const [linkedUserName, setLinkedUserName] = useState<string | null>(null)
  const [linkedUserEmail, setLinkedUserEmail] = useState<string | null>(null)
  const [practitionerAccounts, setPractitionerAccounts] = useState<{ id: string; full_name: string; email: string; avatar_url: string | null; is_linked: boolean }[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkSearch, setLinkSearch] = useState('')
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, email')
      .eq('id', user.id)
      .single()
    if (userData) setAuthUser(userData as UserType)

    if (!isNew) {
      try {
        const res = await fetch(`/api/admin/practitioners/${resolvedParams.id}`)
        if (!res.ok) throw new Error('Not found')
        const { practitioner } = await res.json()
        setForm(practitioner)

        // Load linked user info
        if (practitioner.user_id) {
          setLinkedUserId(practitioner.user_id)
          setLinkedAt(practitioner.linked_at)
          const { data: linkedUser } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', practitioner.user_id)
            .single()
          if (linkedUser) {
            setLinkedUserName(linkedUser.full_name)
            setLinkedUserEmail(linkedUser.email)
          }
        }
      } catch {
        toast.error('Practitioner not found')
        router.push('/admin/practitioners')
      } finally {
        setLoading(false)
      }
    }
  }

  const fetchPractitionerAccounts = async () => {
    const res = await fetch('/api/admin/practitioners/accounts')
    if (res.ok) {
      const { practitioners } = await res.json()
      setPractitionerAccounts(practitioners)
    }
  }

  const handleLinkAccount = async (targetUserId: string) => {
    setLinking(true)
    try {
      const res = await fetch(`/api/admin/practitioners/${resolvedParams.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Update local state
      const account = practitionerAccounts.find(a => a.id === targetUserId)
      setLinkedUserId(targetUserId)
      setLinkedAt(new Date().toISOString())
      setLinkedUserName(account?.full_name || null)
      setLinkedUserEmail(account?.email || null)
      setShowLinkModal(false)
      setForm(prev => ({ ...prev, is_published: false }))
      toast.success(locale === 'fr' ? 'Compte lié — URL publique désactivée, le profil praticien prend le relais' : 'Account linked — public URL disabled, practitioner profile takes over')
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to link account')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkAccount = async () => {
    setLinking(true)
    try {
      const res = await fetch(`/api/admin/practitioners/${resolvedParams.id}/link`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to unlink')

      setLinkedUserId(null)
      setLinkedAt(null)
      setLinkedUserName(null)
      setLinkedUserEmail(null)
      toast.success(locale === 'fr' ? 'Compte délié' : 'Account unlinked')
    } catch {
      toast.error('Failed to unlink account')
    } finally {
      setLinking(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `public-practitioners/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          toast.error('Avatar storage is being set up. Please try again later.')
          return
        }
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setForm(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Photo uploaded!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast.error('Full name is required')
      return
    }
    if (!form.slug?.trim()) {
      toast.error('Slug is required')
      return
    }

    setSaving(true)
    try {
      const url = isNew
        ? '/api/admin/practitioners'
        : `/api/admin/practitioners/${resolvedParams.id}`

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          avatar_url: form.avatar_url || null,
          headline: form.headline || null,
          bio: form.bio || null,
          credentials: form.credentials || [],
          education: form.education || [],
          licenses: form.licenses || [],
          certifications: form.certifications || [],
          years_experience: form.years_experience || null,
          specialties: form.specialties || [],
          approaches: form.approaches || [],
          age_groups: form.age_groups || [],
          session_types: form.session_types || [],
          languages: form.languages || ['English'],
          practice_location: form.practice_location || null,
          offers_telehealth: form.offers_telehealth ?? true,
          offers_in_person: form.offers_in_person ?? false,
          client_acceptance_status: form.client_acceptance_status || 'accepting',
          show_fees: form.show_fees ?? false,
          session_fee_min: form.session_fee_min || null,
          session_fee_max: form.session_fee_max || null,
          fee_currency: form.fee_currency || 'USD',
          insurance_accepted: form.insurance_accepted || [],
          offers_sliding_scale: form.offers_sliding_scale ?? false,
          social_links: form.social_links || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          publications: form.publications || [],
          show_availability: form.show_availability !== false,
          show_languages: form.show_languages !== false,
          is_published: form.is_published ?? false,
          slug: form.slug,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Failed to save')
      }

      const { practitioner } = await res.json()
      toast.success(isNew ? 'Practitioner created!' : 'Practitioner updated!')

      if (isNew) {
        router.push(`/admin/practitioners/${practitioner.id}`)
      } else {
        setForm(practitioner)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    return array.includes(item) ? array.filter(i => i !== item) : [...array, item]
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      degree: '',
      institution: '',
      year_completed: null,
    }
    setForm(prev => ({ ...prev, education: [...(prev.education || []), newEdu] }))
  }

  const updateEducation = (id: string, field: keyof Education, value: string | number | null) => {
    setForm(prev => ({
      ...prev,
      education: (prev.education || []).map(edu => edu.id === id ? { ...edu, [field]: value } : edu),
    }))
  }

  const removeEducation = (id: string) => {
    setForm(prev => ({ ...prev, education: (prev.education || []).filter(edu => edu.id !== id) }))
  }

  const addLicense = () => {
    const newLic: License = {
      id: crypto.randomUUID(),
      type: '',
      number: null,
      state_province: null,
      expiration_date: null,
      is_verified: false,
    }
    setForm(prev => ({ ...prev, licenses: [...(prev.licenses || []), newLic] }))
  }

  const updateLicense = (id: string, field: keyof License, value: string | boolean | null) => {
    setForm(prev => ({
      ...prev,
      licenses: (prev.licenses || []).map(lic => lic.id === id ? { ...lic, [field]: value } : lic),
    }))
  }

  const removeLicense = (id: string) => {
    setForm(prev => ({ ...prev, licenses: (prev.licenses || []).filter(lic => lic.id !== id) }))
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
    setForm(prev => ({ ...prev, publications: [...(prev.publications || []), newPub] }))
  }

  const updatePublication = (id: string, field: keyof Publication, value: string | null) => {
    setForm(prev => ({
      ...prev,
      publications: (prev.publications || []).map(pub => pub.id === id ? { ...pub, [field]: value } : pub),
    }))
  }

  const removePublication = (id: string) => {
    setForm(prev => ({ ...prev, publications: (prev.publications || []).filter(pub => pub.id !== id) }))
  }

  const handlePublicationImageUpload = async (pubId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
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
          toast.error('Storage is being set up. Please try again later.')
          return
        }
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      updatePublication(pubId, 'image_url', publicUrl)
      toast.success('Image uploaded!')
    } catch (error) {
      console.error('Error uploading publication image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingPubImage(null)
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'about', label: t.profile.tabs.about, icon: User },
    { id: 'credentials', label: t.profile.tabs.credentials, icon: GraduationCap },
    { id: 'practice', label: t.profile.tabs.practice, icon: Briefcase },
    { id: 'publications', label: locale === 'fr' ? 'Publications' : 'Publications', icon: BookOpen },
    { id: 'contact', label: t.profile.tabs.contact, icon: Mail },
    { id: 'settings', label: t.profile.tabs.settings, icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />

      <main className="flex-1 ml-14">
        <AppHeader
          user={authUser}
          isAdmin
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Users className="w-4 h-4" />
              <span>{isNew ? (locale === 'fr' ? 'Nouveau praticien' : 'New Practitioner') : form.full_name || 'Edit Practitioner'}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/admin/practitioners">
              <Button variant="outline" className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Retour' : 'Back'}
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {!isNew && form.is_published && form.slug && (
                <Link href={`/p/${form.slug}`} target="_blank">
                  <Button variant="outline" className="rounded-xl">
                    <Eye className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Voir page' : 'View Page'}
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
                    {isNew ? (locale === 'fr' ? 'Créer' : 'Create') : t.profile.actions.save}
                  </>
                )}
              </Button>
            </div>
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
                      {form.avatar_url ? (
                        <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        form.full_name?.charAt(0) || 'P'
                      )}

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
                    {form.full_name || (locale === 'fr' ? 'Nouveau praticien' : 'New Practitioner')}
                  </h1>
                  {form.credentials && form.credentials.length > 0 && (
                    <p className="text-gray-600 text-sm mb-2">{form.credentials.join(', ')}</p>
                  )}
                  {form.headline && (
                    <p className="text-gray-500 text-sm">{form.headline}</p>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3 flex-wrap">
                    {form.is_published ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700">
                        <Globe className="w-3 h-3 mr-1" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Draft
                      </span>
                    )}
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

                    {/* Full Name */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Nom complet' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        value={form.full_name || ''}
                        onChange={(e) => {
                          const name = e.target.value
                          setForm(prev => ({
                            ...prev,
                            full_name: name,
                            ...(isNew && !prev.slug ? { slug: generateSlug(name) } : {}),
                          }))
                        }}
                        placeholder={locale === 'fr' ? 'Dr. Marie Dupont' : 'Dr. Jane Smith'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                      />
                    </div>

                    {/* Photo Upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Photo' : 'Photo'}
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xl overflow-hidden">
                            {form.avatar_url ? (
                              <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              form.full_name?.charAt(0) || 'P'
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              disabled={uploadingAvatar}
                            />
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {locale === 'fr' ? 'Envoi...' : 'Uploading...'}
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4" />
                                {locale === 'fr' ? 'Choisir une photo' : 'Choose Photo'}
                              </>
                            )}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            {locale === 'fr' ? 'JPG, PNG. Max 5MB.' : 'JPG, PNG. Max 5MB.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.profile.about.headline.label}
                      </label>
                      <input
                        type="text"
                        value={form.headline || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, headline: e.target.value }))}
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
                        value={form.bio || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder={t.profile.about.bio.placeholder}
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t.profile.about.bio.help}</p>
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
                        value={form.credentials?.join(', ') || ''}
                        onChange={(e) => setForm(prev => ({
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
                        value={form.years_experience || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) || null }))}
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
                        {form.education?.map((edu) => (
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
                        {(!form.education || form.education.length === 0) && (
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
                        {form.licenses?.map((lic) => (
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
                        {(!form.licenses || form.licenses.length === 0) && (
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
                          const isSelected = form.specialties?.includes(specialty)
                          return (
                            <button
                              key={specialty}
                              onClick={() => setForm(prev => ({
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

                    {/* Therapeutic Approaches */}
                    <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {t.profile.practice.approaches.label}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {APPROACHES.map((approach) => {
                          const isSelected = form.approaches?.includes(approach)
                          return (
                            <button
                              key={approach}
                              onClick={() => setForm(prev => ({
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
                          const isSelected = form.age_groups?.includes(ageGroup)
                          return (
                            <button
                              key={ageGroup}
                              onClick={() => setForm(prev => ({
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
                          const isSelected = form.session_types?.includes(sessionType)
                          return (
                            <button
                              key={sessionType}
                              onClick={() => setForm(prev => ({
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
                            {form.show_availability !== false
                              ? (locale === 'fr' ? 'Visible' : 'Visible')
                              : (locale === 'fr' ? 'Masqué' : 'Hidden')}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.show_availability !== false}
                            onClick={() => setForm(prev => ({ ...prev, show_availability: !(prev.show_availability !== false) }))}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.show_availability !== false ? 'bg-gray-900' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.show_availability !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                          </button>
                        </label>
                      </div>
                      {form.show_availability !== false && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.offers_telehealth}
                                onChange={(e) => setForm(prev => ({ ...prev, offers_telehealth: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              />
                              <span className="text-sm text-gray-700">{t.profile.practice.availability.telehealth}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.offers_in_person}
                                onChange={(e) => setForm(prev => ({ ...prev, offers_in_person: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              />
                              <span className="text-sm text-gray-700">{t.profile.practice.availability.inPerson}</span>
                            </label>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {(['accepting', 'waitlist', 'not_accepting'] as ClientAcceptanceStatus[]).map((status) => (
                              <button
                                key={status}
                                onClick={() => setForm(prev => ({ ...prev, client_acceptance_status: status }))}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                  form.client_acceptance_status === status
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
                            {form.show_languages !== false
                              ? (locale === 'fr' ? 'Visible' : 'Visible')
                              : (locale === 'fr' ? 'Masqué' : 'Hidden')}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.show_languages !== false}
                            onClick={() => setForm(prev => ({ ...prev, show_languages: !(prev.show_languages !== false) }))}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.show_languages !== false ? 'bg-gray-900' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.show_languages !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                          </button>
                        </label>
                      </div>
                      {form.show_languages !== false && (
                        <>
                          <input
                            type="text"
                            value={form.languages?.join(', ') || ''}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            }))}
                            placeholder={t.profile.practice.languages.placeholder}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">{t.profile.practice.languages.help}</p>
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
                        <p className="text-sm text-gray-500 mt-1">
                          {locale === 'fr' ? 'Livres, podcasts, blogs, articles, vidéos' : 'Books, podcasts, blogs, articles, videos'}
                        </p>
                      </div>
                      <Button onClick={addPublication} variant="outline" size="sm" className="rounded-xl">
                        <Plus className="w-4 h-4 mr-1" />
                        {locale === 'fr' ? 'Ajouter' : 'Add'}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {(form.publications || []).map((pub) => (
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
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                {locale === 'fr' ? 'Titre' : 'Title'} *
                              </label>
                              <input
                                type="text"
                                value={pub.title}
                                onChange={(e) => updatePublication(pub.id, 'title', e.target.value)}
                                placeholder={locale === 'fr' ? 'Titre de la publication' : 'Publication title'}
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
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                {locale === 'fr' ? 'Description' : 'Description'}
                              </label>
                              <input
                                type="text"
                                value={pub.description || ''}
                                onChange={(e) => updatePublication(pub.id, 'description', e.target.value || null)}
                                placeholder={locale === 'fr' ? 'Courte description' : 'Short description'}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                {locale === 'fr' ? 'Image' : 'Cover Image'}
                              </label>
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
                                  <span>{pub.image_url ? (locale === 'fr' ? 'Changer' : 'Change') : (locale === 'fr' ? 'Télécharger' : 'Upload')}</span>
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
                      {(!form.publications || form.publications.length === 0) && (
                        <div className="text-center py-8">
                          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">
                            {locale === 'fr' ? 'Aucune publication ajoutée' : 'No publications added yet'}
                          </p>
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
                          value={form.contact_email || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, contact_email: e.target.value }))}
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
                          value={form.contact_phone || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, contact_phone: e.target.value }))}
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
                            value={form.social_links?.website || ''}
                            onChange={(e) => setForm(prev => ({
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
                            value={form.social_links?.linkedin || ''}
                            onChange={(e) => setForm(prev => ({
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
                            value={form.social_links?.instagram || ''}
                            onChange={(e) => setForm(prev => ({
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
                            value={form.social_links?.facebook || ''}
                            onChange={(e) => setForm(prev => ({
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
                  {/* Link Account Card */}
                  {!isNew && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link2 className="w-5 h-5 inline mr-2" />
                        {locale === 'fr' ? 'Compte lié' : 'Linked Account'}
                      </h2>
                      <p className="text-sm text-gray-500 mb-6">
                        {locale === 'fr'
                          ? 'Associer ce profil public au compte d\'un praticien inscrit. Les données du profil seront copiées dans son compte.'
                          : 'Link this public profile to a signed-up practitioner account. Profile data will be copied to their account.'}
                      </p>

                      {linkedUserId ? (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{linkedUserName || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{linkedUserEmail}</p>
                              {linkedAt && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {locale === 'fr' ? 'Lié le' : 'Linked on'} {new Date(linkedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleUnlinkAccount}
                            disabled={linking}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Unlink className="w-4 h-4" />
                            {locale === 'fr' ? 'Délier' : 'Unlink'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { fetchPractitionerAccounts(); setShowLinkModal(true) }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 transition-all w-full justify-center"
                          >
                            <Link2 className="w-4 h-4" />
                            {locale === 'fr' ? 'Lier un compte praticien' : 'Link Practitioner Account'}
                          </button>

                          {/* Link Modal */}
                          {showLinkModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowLinkModal(false)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-gray-100">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {locale === 'fr' ? 'Sélectionner un praticien' : 'Select Practitioner'}
                                    </h3>
                                    <button onClick={() => setShowLinkModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                                      <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      placeholder={locale === 'fr' ? 'Rechercher par nom...' : 'Search by name...'}
                                      value={linkSearch}
                                      onChange={e => setLinkSearch(e.target.value)}
                                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none text-sm"
                                      autoFocus
                                    />
                                  </div>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1">
                                  {practitionerAccounts.length === 0 ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {practitionerAccounts
                                        .filter(a => {
                                          if (!linkSearch) return true
                                          const q = linkSearch.toLowerCase()
                                          return a.full_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
                                        })
                                        .map(account => (
                                          <button
                                            key={account.id}
                                            onClick={() => !account.is_linked && handleLinkAccount(account.id)}
                                            disabled={account.is_linked || linking}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                                              account.is_linked
                                                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                                : 'hover:bg-gray-50 cursor-pointer'
                                            }`}
                                          >
                                            {account.avatar_url ? (
                                              <img src={account.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-400" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-gray-900 truncate">{account.full_name}</p>
                                              <p className="text-xs text-gray-500 truncate">{account.email}</p>
                                            </div>
                                            {account.is_linked && (
                                              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-lg flex-shrink-0">
                                                {locale === 'fr' ? 'Déjà lié' : 'Already linked'}
                                              </span>
                                            )}
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.profile.settings.title}</h2>

                    {/* Published Toggle */}
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {locale === 'fr' ? 'Publication' : 'Publication'}
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => setForm(prev => ({ ...prev, is_published: true }))}
                          className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                            form.is_published
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Globe className={`w-5 h-5 ${form.is_published ? 'text-emerald-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${form.is_published ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Publié' : 'Published'}
                            </span>
                            {form.is_published && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                          </div>
                          <p className="text-sm text-gray-500">
                            {locale === 'fr' ? 'Visible au public sur /p/slug' : 'Visible to the public at /p/slug'}
                          </p>
                        </button>

                        <button
                          onClick={() => setForm(prev => ({ ...prev, is_published: false }))}
                          className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                            !form.is_published
                              ? 'border-gray-400 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Shield className={`w-5 h-5 ${!form.is_published ? 'text-gray-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${!form.is_published ? 'text-gray-700' : 'text-gray-500'}`}>
                              {locale === 'fr' ? 'Brouillon' : 'Draft'}
                            </span>
                            {!form.is_published && <CheckCircle2 className="w-5 h-5 text-gray-500 ml-auto" />}
                          </div>
                          <p className="text-sm text-gray-500">
                            {locale === 'fr' ? 'Non visible au public' : 'Not visible to the public'}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'URL du profil' : 'Profile URL'} *
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">bloomsline.com/p/</span>
                        <input
                          type="text"
                          value={form.slug || ''}
                          onChange={(e) => setForm(prev => ({
                            ...prev,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          }))}
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {locale === 'fr' ? 'Lettres minuscules, chiffres et tirets uniquement' : 'Lowercase letters, numbers, and hyphens only'}
                      </p>
                    </div>
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
