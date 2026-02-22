'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/logo'
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Video,
  Building,
  GraduationCap,
  Award,
  Heart,
  BookOpen,
  Shield,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import type { PractitionerProfileWithUser, Specialty, TherapeuticApproach } from '@/types/practitioner-profile'

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<PractitionerProfileWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [publishedResources, setPublishedResources] = useState<{ id: string; title: string; type: string }[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [resolvedParams.slug])

  const fetchProfile = async () => {
    try {
      let profileData = null

      // Get current user to check if they're viewing their own profile
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setIsLoggedIn(!!currentUser)

      // First try practitioner_profiles table (by slug then by user_id)
      try {
        // Try by slug first - this works for public profiles (is_public = true)
        const { data: bySlug, error: slugError } = await supabase
          .from('practitioner_profiles')
          .select('*')
          .eq('slug', resolvedParams.slug)
          .single()

        if (bySlug && !slugError) {
          // Get user data separately
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, email')
            .eq('id', bySlug.user_id)
            .single()

          profileData = { ...bySlug, user: userData }
        } else {
          // Try by user_id - allows viewing own profile when navigating by user ID
          const { data: byUserId, error: userIdError } = await supabase
            .from('practitioner_profiles')
            .select('*')
            .eq('user_id', resolvedParams.slug)
            .single()

          if (byUserId && !userIdError) {
            // Get user data separately
            const { data: userData } = await supabase
              .from('users')
              .select('id, full_name, avatar_url, email')
              .eq('id', byUserId.user_id)
              .single()

            profileData = { ...byUserId, user: userData }
          }
        }

        // If still no profile found but user is logged in, try to get their own profile
        // This handles the case where the logged-in user is viewing their private profile via slug
        if (!profileData && currentUser) {
          const { data: ownProfile, error: ownError } = await supabase
            .from('practitioner_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single()

          if (ownProfile && !ownError) {
            // Check if the slug matches their profile's slug
            if (ownProfile.slug === resolvedParams.slug) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, avatar_url, email')
                .eq('id', ownProfile.user_id)
                .single()

              profileData = { ...ownProfile, user: userData }
            }
          }
        }
      } catch (e) {
        // practitioner_profiles table may not exist, continue to fallback
      }

      // If no profile found, try users table directly
      if (!profileData) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, email')
          .eq('id', resolvedParams.slug)
          .single()

        if (userData && !userError) {
          // Create a minimal profile object from user data
          profileData = {
            id: userData.id,
            user_id: userData.id,
            slug: null,
            full_name: userData.full_name || userData.email?.split('@')[0] || 'Practitioner',
            headline: 'Mental Health Professional',
            bio: 'This practitioner has not yet set up their full profile.',
            specialties: [],
            approaches: [],
            credentials: [],
            education: [],
            licenses: [],
            languages: ['English'],
            years_experience: null,
            session_types: [],
            insurance_accepted: [],
            contact_email: userData.email,
            contact_phone: null,
            website_url: null,
            social_links: {},
            location_city: null,
            location_state: null,
            location_country: null,
            accepts_new_clients: false,
            client_acceptance_status: 'not_accepting',
            is_public: true,
            is_verified: false,
            total_resources: 0,
            total_saves: 0,
            user: {
              ...userData,
              full_name: userData.full_name || userData.email?.split('@')[0] || 'Practitioner',
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      }

      if (!profileData) {
        setNotFound(true)
        return
      }

      setProfile(profileData as PractitionerProfileWithUser)

      // Fetch published resources
      const userId = profileData.user_id || profileData.user?.id
      if (userId) {
        try {
          const { data: resources } = await supabase
            .from('resources')
            .select('id, title, type')
            .eq('practitioner_id', userId)
            .eq('status', 'published')
            .eq('visibility', 'public')
            .limit(6)

          if (resources) {
            setPublishedResources(resources)
          }
        } catch {
          // resources table query failed, ignore
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const getSpecialtyLabel = (specialty: Specialty) => {
    return t.profile.specialties[specialty as keyof typeof t.profile.specialties] || specialty
  }

  const getApproachLabel = (approach: TherapeuticApproach) => {
    return t.profile.approaches[approach as keyof typeof t.profile.approaches] || approach
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-600 font-medium">{t.dashboard.loading}</p>
        </motion.div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-[2rem] p-12 shadow-xl max-w-md mx-4 border border-gray-100"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">This practitioner profile doesn&apos;t exist or isn&apos;t public.</p>
          <Link href={isLoggedIn ? '/dashboard' : '/'}>
            <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isLoggedIn ? 'Go to Dashboard' : 'Go Home'}
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!profile) return null

  const acceptanceStatusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    accepting: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Accepting New Clients' },
    waitlist: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Waitlist Only' },
    not_accepting: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Not Accepting' },
  }

  const status = profile.client_acceptance_status
    ? acceptanceStatusStyles[profile.client_acceptance_status]
    : acceptanceStatusStyles.not_accepting

  const hasBookingEnabled = profile.slug

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href={isLoggedIn ? '/dashboard' : '/'}>
              <Logo size="md" showText />
            </Link>
            {hasBookingEnabled && (
              <Link href={`/practitioner/${profile.slug}/book`}>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-200/50">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Profile Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-lg shadow-gray-200/30 border border-gray-100 overflow-hidden mb-8"
        >
          {/* Soft teal banner background */}
          <div className="h-32 sm:h-40 bg-gradient-to-br from-teal-100 via-teal-50 to-emerald-50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/40 via-transparent to-transparent" />
          </div>

          <div className="px-6 sm:px-10 pb-8 -mt-16 sm:-mt-20 relative">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden">
                  {profile.user?.avatar_url ? (
                    <img src={profile.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-4xl">
                      {profile.user?.full_name?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>
                {profile.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  </div>
                )}
              </div>

              {/* Name & headline */}
              <div className="text-center sm:text-left flex-1 pb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {profile.user?.full_name}
                  {profile.credentials && profile.credentials.length > 0 && (
                    <span className="text-gray-400 font-normal text-xl">, {profile.credentials.join(', ')}</span>
                  )}
                </h1>
                {profile.headline && (
                  <p className="text-gray-500 mt-1 text-base">{profile.headline}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-5">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                <span className={`w-2 h-2 rounded-full ${status.dot} mr-2`} />
                {status.label}
              </span>

              {profile.offers_telehealth && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700">
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Telehealth
                </span>
              )}

              {profile.offers_in_person && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-50 text-slate-700">
                  <Building className="w-3.5 h-3.5 mr-1.5" />
                  In-Person
                </span>
              )}

              {profile.years_experience && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {profile.years_experience}+ Years
                </span>
              )}

              {profile.practice_location && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  {[profile.practice_location.city, profile.practice_location.state_province].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
              {hasBookingEnabled && (
                <Link href={`/practitioner/${profile.slug}/book`}>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-200/50 h-11 px-6">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book a Session
                  </Button>
                </Link>
              )}
              {profile.contact_email && (
                <a href={`mailto:${profile.contact_email}`}>
                  <Button variant="outline" className="rounded-xl h-11 px-6 border-gray-200">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </a>
              )}
              {profile.contact_phone && (
                <a href={`tel:${profile.contact_phone}`}>
                  <Button variant="outline" className="rounded-xl h-11 border-gray-200">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </a>
              )}
              {profile.social_links?.website && (
                <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-xl h-11 border-gray-200">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </Button>
                </a>
              )}
              {profile.social_links?.linkedin && (
                <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-xl h-11 border-gray-200">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-500" />
                  About
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
              </motion.div>
            )}

            {/* Specialties */}
            {profile.specialties && profile.specialties.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-500" />
                  Areas of Specialty
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100"
                    >
                      {getSpecialtyLabel(specialty as Specialty)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Therapeutic Approaches */}
            {profile.approaches && profile.approaches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-500" />
                  Therapeutic Approaches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.approaches.map((approach) => (
                    <span
                      key={approach}
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {getApproachLabel(approach as TherapeuticApproach)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Published Resources */}
            {publishedResources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-500" />
                  Published Resources
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {publishedResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-teal-200 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{resource.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book a Session CTA (sidebar) */}
            {hasBookingEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200/40"
              >
                <h3 className="font-semibold text-lg mb-2">Ready to get started?</h3>
                <p className="text-teal-100 text-sm mb-4">
                  Book a session with {profile.user?.full_name?.split(' ')[0]} and take the next step in your journey.
                </p>
                <Link href={`/practitioner/${profile.slug}/book`}>
                  <Button className="w-full bg-white text-teal-700 hover:bg-teal-50 rounded-xl font-semibold h-11">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book a Session
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Education & Credentials */}
            {((profile.education && profile.education.length > 0) || (profile.licenses && profile.licenses.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-500" />
                  Credentials
                </h2>

                {/* Education */}
                {profile.education && profile.education.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Education</h3>
                    <div className="space-y-3">
                      {profile.education.map((edu: { id: string; degree: string; institution: string; year_completed: number | null }) => (
                        <div key={edu.id} className="text-sm">
                          <p className="font-medium text-gray-900">{edu.degree}</p>
                          <p className="text-gray-500">{edu.institution}</p>
                          {edu.year_completed && (
                            <p className="text-gray-400 text-xs">{edu.year_completed}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Licenses */}
                {profile.licenses && profile.licenses.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Licenses</h3>
                    <div className="space-y-3">
                      {profile.licenses.map((lic: { id: string; type: string; state_province: string | null; is_verified: boolean }) => (
                        <div key={lic.id} className="flex items-start gap-2">
                          <Award className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                              {lic.type}
                              {lic.is_verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </p>
                            {lic.state_province && (
                              <p className="text-gray-500 text-xs">{lic.state_province}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Session Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" />
                Session Info
              </h2>

              {/* Session Types */}
              {profile.session_types && profile.session_types.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Session Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.session_types.map((type) => (
                      <span key={type} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 capitalize">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Groups */}
              {profile.age_groups && profile.age_groups.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ages Served</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.age_groups.map((age) => (
                      <span key={age} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600">
                        {t.profile.ageGroups[age as keyof typeof t.profile.ageGroups] || age}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Languages</h3>
                  <p className="text-sm text-gray-700">{profile.languages.join(', ')}</p>
                </div>
              )}
            </motion.div>

            {/* Location */}
            {profile.practice_location && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-500" />
                  Location
                </h2>
                <p className="text-sm text-gray-600">
                  {[profile.practice_location.city, profile.practice_location.state_province, profile.practice_location.country].filter(Boolean).join(', ')}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12 py-8 border-t border-gray-100"
        >
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="text-teal-600 hover:text-teal-700 font-medium">
              Bloomsline Care
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
