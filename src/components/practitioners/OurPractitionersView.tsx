'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, MapPin, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { useLanguage, type Locale } from '@/lib/i18n/context'
import { getSpecialtyLabel, type Specialty } from '@/types/practitioner-profile'

interface Practitioner {
  slug: string
  name: string
  avatar: string | null
  headline: string | null
  city: string | null
  country: string | null
  specialties: Specialty[]
}

// Shared directory view. Rendered at /our-practitioners (follows the site
// language) and /fr/our-practitioners (forceLocale='fr' → shareable French URL).
export function OurPractitionersView({ forceLocale }: { forceLocale?: Locale }) {
  const { locale: ctxLocale, setLocale } = useLanguage()
  const locale = forceLocale ?? ctxLocale
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const [items, setItems] = useState<Practitioner[]>([])
  const [loading, setLoading] = useState(true)

  // On the locale-pinned URL, sync the site language so the rest of the site
  // matches once the visitor navigates away.
  useEffect(() => {
    if (forceLocale && ctxLocale !== forceLocale) setLocale(forceLocale, false)
  }, [forceLocale, ctxLocale, setLocale])

  useEffect(() => {
    // Deduped, name-resolved list comes from the service-role API (avoids the
    // anon RLS join limitation on practitioner_profiles → users).
    fetch('/api/practitioners')
      .then((r) => r.json())
      .then((d) => setItems((d.practitioners || []) as Practitioner[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <EarlyAccessModalProvider>
      <div className="min-h-screen bg-[#FAF8F5]">
        <Navbar locale={locale} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 max-w-6xl">
          <header className="mb-14 text-center">
            <p className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-3">{t('Our Practitioners', 'Nos praticiens')}</p>
            <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 tracking-tight">
              {t('Our founding practitioners', 'Nos praticiens fondateurs')}
            </h1>
            <p className="text-neutral-500 mt-3 font-light max-w-2xl mx-auto">
              {t('Mental health practitioners using Bloomsline to manage their practice and care for their patients between sessions.',
                 'Des praticiens en santé mentale qui utilisent Bloomsline pour gérer leur cabinet et accompagner leurs patients entre les séances.')}
            </p>
          </header>

          {loading ? (
            <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-300" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-neutral-400 py-20">{t('No practitioners to show yet.', 'Aucun praticien à afficher pour le moment.')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((p) => (
                <Link
                  key={p.slug}
                  href={`/p/${p.slug}`}
                  className="group flex flex-col rounded-3xl border border-neutral-200/70 bg-white p-6 hover:shadow-lg hover:shadow-neutral-200/60 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar} alt={p.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xl font-medium shrink-0">{p.name.charAt(0)}</div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-neutral-900 leading-snug tracking-tight group-hover:text-teal-800 transition-colors truncate">{p.name}</h2>
                      {p.headline && <p className="text-sm text-neutral-500 font-light leading-snug line-clamp-2">{p.headline}</p>}
                    </div>
                  </div>

                  {(p.city || p.country) && (
                    <p className="flex items-center gap-1.5 text-xs text-neutral-400 mt-4">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {[p.city, p.country].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {p.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {p.specialties.slice(0, 3).map((s) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                          {getSpecialtyLabel(s, locale)}
                        </span>
                      ))}
                      {p.specialties.length > 3 && (
                        <span className="text-[11px] px-2 py-0.5 text-neutral-400">+{p.specialties.length - 3}</span>
                      )}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 mt-5 group-hover:gap-2 transition-all">
                    {t('View profile', 'Voir le profil')}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </main>
        <Footer locale={locale} />
      </div>
    </EarlyAccessModalProvider>
  )
}
