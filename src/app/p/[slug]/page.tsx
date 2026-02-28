import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  Video,
  Building,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  Heart,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server-client'
import type { PublicPractitioner } from '@/types/public-practitioner'
import type { Education, License, Certification, PracticeLocation, SocialLinks } from '@/types/practitioner-profile'
import {
  getSpecialtyLabel,
  getApproachLabel,
  getAgeGroupLabel,
  getSessionTypeLabel,
  getClientAcceptanceLabel,
} from '@/types/practitioner-profile'

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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const practitioner = await getPractitioner(slug)

  if (!practitioner) notFound()

  const p = practitioner
  const locale = 'en'

  // Cast JSONB fields
  const education = (p.education || []) as Education[]
  const licenses = (p.licenses || []) as License[]
  const certifications = (p.certifications || []) as Certification[]
  const location = p.practice_location as PracticeLocation | null
  const social = p.social_links as SocialLinks | null

  const hasContactInfo = p.contact_email || p.contact_phone || social?.website || social?.linkedin
  const hasCredentials = education.length > 0 || licenses.length > 0 || certifications.length > 0
  const hasLocation = location && (location.city || location.state_province)

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

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Bloomsline Care</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0 flex justify-center sm:justify-start">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-3xl overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                      ) : (
                        p.full_name.charAt(0)
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {p.full_name}
                      {p.credentials && p.credentials.length > 0 && (
                        <span className="text-gray-500 font-normal text-lg ml-2">
                          {p.credentials.join(', ')}
                        </span>
                      )}
                    </h1>
                    {p.headline && (
                      <p className="text-gray-600 mt-1">{p.headline}</p>
                    )}

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        p.client_acceptance_status === 'accepting'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.client_acceptance_status === 'waitlist'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {getClientAcceptanceLabel(p.client_acceptance_status, locale)}
                      </span>
                      {p.offers_telehealth && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          <Video className="w-3 h-3" />
                          Telehealth
                        </span>
                      )}
                      {p.offers_in_person && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700">
                          <Building className="w-3 h-3" />
                          In-Person
                        </span>
                      )}
                      {p.years_experience && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                          {p.years_experience}+ years
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Buttons */}
              {hasContactInfo && (
                <div className="flex flex-wrap gap-3">
                  {p.contact_email && (
                    <a
                      href={`mailto:${p.contact_email}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                  {p.contact_phone && (
                    <a
                      href={`tel:${p.contact_phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  )}
                  {social?.website && (
                    <a
                      href={social.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {social?.linkedin && (
                    <a
                      href={social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              )}

              {/* About */}
              {p.bio && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">{p.bio}</p>
                </div>
              )}

              {/* Specialties */}
              {p.specialties && p.specialties.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {p.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                      >
                        {getSpecialtyLabel(s, locale)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Approaches */}
              {p.approaches && p.approaches.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Therapeutic Approaches</h2>
                  <div className="flex flex-wrap gap-2">
                    {p.approaches.map((a) => (
                      <span
                        key={a}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700"
                      >
                        {getApproachLabel(a, locale)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Credentials */}
              {hasCredentials && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Credentials
                  </h3>

                  {education.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Education</h4>
                      <div className="space-y-2">
                        {education.map((edu) => (
                          <div key={edu.id} className="text-sm">
                            <p className="font-medium text-gray-900">{edu.degree}</p>
                            <p className="text-gray-500">
                              {edu.institution}
                              {edu.year_completed ? ` (${edu.year_completed})` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {licenses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Licenses</h4>
                      <div className="space-y-2">
                        {licenses.map((lic) => (
                          <div key={lic.id} className="text-sm">
                            <p className="font-medium text-gray-900">{lic.type}</p>
                            {lic.state_province && (
                              <p className="text-gray-500">{lic.state_province}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {certifications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Certifications</h4>
                      <div className="space-y-2">
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
              {((p.session_types && p.session_types.length > 0) || (p.age_groups && p.age_groups.length > 0) || (p.languages && p.languages.length > 0)) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Session Info
                  </h3>

                  {p.session_types && p.session_types.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Session Types</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.session_types.map((st) => (
                          <span key={st} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                            {getSessionTypeLabel(st, locale)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.age_groups && p.age_groups.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Age Groups</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.age_groups.map((ag) => (
                          <span key={ag} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                            {getAgeGroupLabel(ag, locale)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.languages && p.languages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Languages</h4>
                      <p className="text-sm text-gray-700">{p.languages.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {hasLocation && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <p className="text-sm text-gray-700">
                    {[location!.city, location!.state_province, location!.country].filter(Boolean).join(', ')}
                  </p>
                  {location!.address_line1 && (
                    <p className="text-sm text-gray-500 mt-1">{location!.address_line1}</p>
                  )}
                </div>
              )}

              {/* Fees */}
              {p.show_fees && (p.session_fee_min || p.session_fee_max) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Fees
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      {p.session_fee_min && p.session_fee_max
                        ? `${p.fee_currency} $${p.session_fee_min} – $${p.session_fee_max} per session`
                        : p.session_fee_min
                        ? `From ${p.fee_currency} $${p.session_fee_min} per session`
                        : `Up to ${p.fee_currency} $${p.session_fee_max} per session`}
                    </p>
                    {p.offers_sliding_scale && (
                      <p className="text-sm text-emerald-600 font-medium">Sliding scale available</p>
                    )}
                    {p.insurance_accepted && p.insurance_accepted.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Insurance Accepted</h4>
                        <p className="text-sm text-gray-700">{p.insurance_accepted.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Powered by</span>
            <Link href="/" className="font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Bloomsline Care
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}
