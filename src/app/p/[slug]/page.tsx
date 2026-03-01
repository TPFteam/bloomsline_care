import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  Clock,
  Video,
  Building,
  GraduationCap,
  Award,
  Heart,
  Shield,
  BookOpen,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { createAdminClient } from '@/lib/supabase/server-client'
import type { PublicPractitioner } from '@/types/public-practitioner'
import type { Education, License, Certification, PracticeLocation, SocialLinks, Publication } from '@/types/practitioner-profile'
import {
  getSpecialtyLabel,
  getApproachLabel,
  getAgeGroupLabel,
  getSessionTypeLabel,
} from '@/types/practitioner-profile'

const translations = {
  en: {
    notFound: 'Practitioner Not Found',
    accepting: 'Accepting New Clients',
    waitlist: 'Waitlist Only',
    not_accepting: 'Not Accepting',
    telehealth: 'Telehealth',
    inPerson: 'In-Person',
    years: 'Years',
    contact: 'Contact',
    call: 'Call',
    website: 'Website',
    about: 'About',
    specialties: 'Areas of Specialty',
    approaches: 'Therapeutic Approaches',
    publications: 'Publications',
    credentials: 'Credentials',
    education: 'Education',
    licenses: 'Licenses',
    certifications: 'Certifications',
    sessionInfo: 'Session Info',
    sessionTypes: 'Session Types',
    agesServed: 'Ages Served',
    languages: 'Languages',
    location: 'Location',
    fees: 'Fees',
    perSession: 'per session',
    from: 'From',
    upTo: 'Up to',
    slidingScale: 'Sliding scale available',
    insuranceAccepted: 'Insurance Accepted',
    poweredBy: 'Powered by',
  },
  fr: {
    notFound: 'Praticien introuvable',
    accepting: 'Accepte de nouveaux clients',
    waitlist: 'Liste d\'attente seulement',
    not_accepting: 'N\'accepte pas',
    telehealth: 'Télésanté',
    inPerson: 'En personne',
    years: 'Ans',
    contact: 'Contact',
    call: 'Appeler',
    website: 'Site web',
    about: 'À propos',
    specialties: 'Spécialités',
    approaches: 'Approches thérapeutiques',
    publications: 'Publications',
    credentials: 'Qualifications',
    education: 'Formation',
    licenses: 'Licences',
    certifications: 'Certifications',
    sessionInfo: 'Info séance',
    sessionTypes: 'Types de séance',
    agesServed: 'Âges servis',
    languages: 'Langues',
    location: 'Lieu',
    fees: 'Tarifs',
    perSession: 'par séance',
    from: 'À partir de',
    upTo: 'Jusqu\'à',
    slidingScale: 'Tarif dégressif disponible',
    insuranceAccepted: 'Assurances acceptées',
    poweredBy: 'Propulsé par',
  },
}

async function getPractitioner(slug: string): Promise<PublicPractitioner | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_practitioners')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null
  return data as PublicPractitioner
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const practitioner = await getPractitioner(slug)

  if (!practitioner) {
    return { title: 'Practitioner Not Found | Bloomsline Care' }
  }

  const title = `${practitioner.full_name}${practitioner.credentials?.length ? `, ${practitioner.credentials.join(', ')}` : ''} | Bloomsline Care`
  const description = practitioner.headline || practitioner.bio?.slice(0, 160) || `${practitioner.full_name} — mental health practitioner on Bloomsline Care`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(practitioner.avatar_url ? { images: [{ url: practitioner.avatar_url }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function PublicPractitionerPage(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
) {
  const { slug } = await params
  const { lang } = await searchParams
  const practitioner = await getPractitioner(slug)

  if (!practitioner) notFound()

  const p = practitioner
  const locale = lang === 'fr' ? 'fr' : 'en'
  const t = translations[locale]
  const otherLocale = locale === 'en' ? 'fr' : 'en'

  // Cast JSONB fields
  const education = (p.education || []) as Education[]
  const licenses = (p.licenses || []) as License[]
  const certifications = (p.certifications || []) as Certification[]
  const location = p.practice_location as PracticeLocation | null
  const social = p.social_links as SocialLinks | null
  const publications = (p.publications || []) as Publication[]

  const hasCredentials = education.length > 0 || licenses.length > 0 || certifications.length > 0
  const hasLocation = location && (location.city || location.state_province)

  const acceptanceStatusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    accepting: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: t.accepting },
    waitlist: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: t.waitlist },
    not_accepting: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: t.not_accepting },
  }

  const status = acceptanceStatusStyles[p.client_acceptance_status] || acceptanceStatusStyles.not_accepting

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.full_name,
    ...(p.headline ? { jobTitle: p.headline } : {}),
    ...(p.bio ? { description: p.bio } : {}),
    ...(p.avatar_url ? { image: p.avatar_url } : {}),
    ...(p.contact_email ? { email: p.contact_email } : {}),
    ...(p.contact_phone ? { telephone: p.contact_phone } : {}),
    ...(social?.website ? { url: social.website } : {}),
    ...(hasLocation ? {
      address: {
        '@type': 'PostalAddress',
        ...(location!.city ? { addressLocality: location!.city } : {}),
        ...(location!.state_province ? { addressRegion: location!.state_province } : {}),
        ...(location!.country ? { addressCountry: location!.country } : {}),
      }
    } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-teal-50/60 via-white to-gray-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Logo size="md" showText />
              </Link>
              <a
                href={`?lang=${otherLocale}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {otherLocale === 'fr' ? 'FR' : 'EN'}
              </a>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
          {/* Profile Hero */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-lg shadow-gray-200/30 border border-gray-100 overflow-hidden mb-8">
            {/* Soft teal banner background */}
            <div className="h-32 sm:h-40 bg-gradient-to-br from-teal-100 via-teal-50 to-emerald-50 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/40 via-transparent to-transparent" />
            </div>

            <div className="px-6 sm:px-10 pb-8 -mt-16 sm:-mt-20 relative">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 font-bold text-4xl">
                        {p.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & headline */}
                <div className="text-center sm:text-left flex-1 pb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {p.full_name}
                    {p.credentials && p.credentials.length > 0 && (
                      <span className="text-gray-400 font-normal text-xl">, {p.credentials.join(', ')}</span>
                    )}
                  </h1>
                  {p.headline && (
                    <p className="text-gray-500 mt-1 text-base">{p.headline}</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-5">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot} mr-2`} />
                  {status.label}
                </span>

                {p.offers_telehealth && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700">
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                    {t.telehealth}
                  </span>
                )}

                {p.offers_in_person && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-50 text-slate-700">
                    <Building className="w-3.5 h-3.5 mr-1.5" />
                    {t.inPerson}
                  </span>
                )}

                {p.years_experience && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {p.years_experience}+ {t.years}
                  </span>
                )}

                {hasLocation && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    {[location!.city, location!.state_province].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                {p.contact_email && (
                  <a
                    href={`mailto:${p.contact_email}`}
                    className="inline-flex items-center gap-2 px-6 h-11 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    {t.contact}
                  </a>
                )}
                {p.contact_phone && (
                  <a
                    href={`tel:${p.contact_phone}`}
                    className="inline-flex items-center gap-2 px-6 h-11 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {t.call}
                  </a>
                )}
                {social?.website && (
                  <a
                    href={social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 h-11 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {t.website}
                  </a>
                )}
                {social?.linkedin && (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 h-11 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              {p.bio && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-500" />
                    {t.about}
                  </h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{p.bio}</p>
                </div>
              )}

              {/* Specialties */}
              {p.specialties && p.specialties.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-500" />
                    {t.specialties}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {p.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100"
                      >
                        {getSpecialtyLabel(s, locale)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Therapeutic Approaches */}
              {p.approaches && p.approaches.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-500" />
                    {t.approaches}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {p.approaches.map((a) => (
                      <span
                        key={a}
                        className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        {getApproachLabel(a, locale)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {publications.length > 0 && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-500" />
                    {t.publications}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {publications.map((pub) => (
                      <a
                        key={pub.id}
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all"
                      >
                        {pub.image_url && (
                          <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                            <img src={pub.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-600 mb-1.5">
                            {pub.type}
                          </span>
                          <p className="font-medium text-gray-900 text-sm group-hover:text-teal-700 transition-colors line-clamp-2">
                            {pub.title}
                          </p>
                          {pub.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pub.description}</p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Credentials */}
              {hasCredentials && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-500" />
                    {t.credentials}
                  </h2>

                  {education.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.education}</h3>
                      <div className="space-y-3">
                        {education.map((edu) => (
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

                  {licenses.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.licenses}</h3>
                      <div className="space-y-3">
                        {licenses.map((lic) => (
                          <div key={lic.id} className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{lic.type}</p>
                              {lic.state_province && (
                                <p className="text-gray-500 text-xs">{lic.state_province}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {certifications.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.certifications}</h3>
                      <div className="space-y-3">
                        {certifications.map((cert) => (
                          <div key={cert.id} className="text-sm">
                            <p className="font-medium text-gray-900">{cert.name}</p>
                            {cert.issuing_body && (
                              <p className="text-gray-500">{cert.issuing_body}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Session Info */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-500" />
                  {t.sessionInfo}
                </h2>

                {p.session_types && p.session_types.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t.sessionTypes}</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.session_types.map((st) => (
                        <span key={st} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 capitalize">
                          {getSessionTypeLabel(st, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {p.age_groups && p.age_groups.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t.agesServed}</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.age_groups.map((ag) => (
                        <span key={ag} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600">
                          {getAgeGroupLabel(ag, locale)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {p.languages && p.languages.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t.languages}</h3>
                    <p className="text-sm text-gray-700">{p.languages.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Location */}
              {hasLocation && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-500" />
                    {t.location}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {[location!.city, location!.state_province, location!.country].filter(Boolean).join(', ')}
                  </p>
                  {location!.address_line1 && (
                    <p className="text-sm text-gray-500 mt-1">{location!.address_line1}</p>
                  )}
                </div>
              )}

              {/* Fees */}
              {p.show_fees && (p.session_fee_min || p.session_fee_max) && (
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-500" />
                    {t.fees}
                  </h2>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      {p.session_fee_min && p.session_fee_max
                        ? `${p.fee_currency} $${p.session_fee_min} – $${p.session_fee_max} ${t.perSession}`
                        : p.session_fee_min
                        ? `${t.from} ${p.fee_currency} $${p.session_fee_min} ${t.perSession}`
                        : `${t.upTo} ${p.fee_currency} $${p.session_fee_max} ${t.perSession}`}
                    </p>
                    {p.offers_sliding_scale && (
                      <p className="text-sm text-emerald-600 font-medium">{t.slidingScale}</p>
                    )}
                    {p.insurance_accepted && p.insurance_accepted.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t.insuranceAccepted}</h3>
                        <p className="text-sm text-gray-700">{p.insurance_accepted.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 py-8 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              {t.poweredBy}{' '}
              <Link href="/" className="text-teal-600 hover:text-teal-700 font-medium">
                Bloomsline Care
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
