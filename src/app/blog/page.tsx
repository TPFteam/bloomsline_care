'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { pickLocalized, type BlogSnapshot } from '@/types/blog'

interface LivePost {
  id: string
  slug: string | null
  practitioner_id: string
  published_at: string | null
  published_snapshot: BlogSnapshot
}

export default function PublicBlogList() {
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const supabase = createClient()
  const [posts, setPosts] = useState<LivePost[]>([])
  // practitioner_id → live title (headline) for the author line
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, practitioner_id, published_at, published_snapshot')
        .not('published_snapshot', 'is', null)
        .order('published_at', { ascending: false })
      const list = (data as LivePost[]) || []
      setPosts(list)
      setLoading(false)

      const ids = Array.from(new Set(list.map((p) => p.practitioner_id).filter(Boolean)))
      if (ids.length) {
        const { data: profs } = await supabase
          .from('practitioner_profiles')
          .select('user_id, headline')
          .in('user_id', ids)
        const map: Record<string, string> = {}
        for (const p of profs || []) if (p.headline) map[p.user_id as string] = p.headline as string
        setTitles(map)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <EarlyAccessModalProvider>
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 max-w-6xl">
        <header className="mb-14 text-center">
          <p className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-3">{t('The Blog', 'Le Blog')}</p>
          <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 tracking-tight">
            {t('Words from our practitioners', 'Les mots de nos praticiens')}
          </h1>
          <p className="text-neutral-500 mt-3 font-light">{t('Reflections on therapy, mental health, and the space between sessions.', 'Réflexions sur la thérapie, la santé mentale, et l\'espace entre les séances.')}</p>
        </header>

        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-300" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-neutral-400 py-20">{t('No articles yet. Check back soon.', 'Pas encore d\'articles. Revenez bientôt.')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => {
              const s = p.published_snapshot
              const title = titles[p.practitioner_id] || s.author_title || null
              const loc = pickLocalized(s, locale)
              return (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col rounded-3xl border border-neutral-200/70 bg-white overflow-hidden hover:shadow-lg hover:shadow-neutral-200/60 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {s.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.cover_image_url} alt="" className="w-full aspect-[16/10] object-cover" />
                  ) : (
                    <div className="w-full aspect-[16/10] bg-gradient-to-br from-teal-50 via-[#FAF8F5] to-neutral-100" />
                  )}

                  <div className="flex flex-col flex-1 p-5">
                    <h2 className="text-lg font-semibold text-neutral-900 leading-snug tracking-tight group-hover:text-teal-800 transition-colors line-clamp-2">
                      {loc.title}
                    </h2>
                    {loc.excerpt && (
                      <p className="text-sm text-neutral-500 mt-2 font-light leading-relaxed line-clamp-2 flex-1">{loc.excerpt}</p>
                    )}

                    {/* Practitioner: photo + name + title */}
                    <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-neutral-100">
                      {s.author_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.author_avatar} alt={s.author_name || ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-medium shrink-0">{(s.author_name || '?').charAt(0)}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{s.author_name}</p>
                        <p className="text-xs text-neutral-400 truncate">{title ? `${title} · ` : ''}{fmt(p.published_at)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
    </EarlyAccessModalProvider>
  )
}
