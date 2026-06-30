'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import type { BlogSnapshot } from '@/types/blog'

interface LivePost {
  id: string
  slug: string | null
  published_at: string | null
  published_snapshot: BlogSnapshot
}

export default function PublicBlogList() {
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const supabase = createClient()
  const [posts, setPosts] = useState<LivePost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, slug, published_at, published_snapshot')
        .not('published_snapshot', 'is', null)
        .order('published_at', { ascending: false })
      setPosts((data as LivePost[]) || [])
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <EarlyAccessModalProvider>
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 max-w-3xl">
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
          <div className="space-y-10">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
                <article className="grid sm:grid-cols-[1fr_auto] gap-5 items-start">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-medium text-neutral-900 group-hover:text-teal-800 transition-colors leading-snug">
                      {p.published_snapshot.title}
                    </h2>
                    {p.published_snapshot.excerpt && (
                      <p className="text-neutral-500 mt-2 font-light leading-relaxed line-clamp-2">{p.published_snapshot.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-sm text-neutral-400">
                      <span>{p.published_snapshot.author_name}</span>
                      <span>·</span>
                      <span>{fmt(p.published_at)}</span>
                    </div>
                  </div>
                  {p.published_snapshot.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.published_snapshot.cover_image_url} alt="" className="w-full sm:w-40 h-28 object-cover rounded-2xl" />
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
    </EarlyAccessModalProvider>
  )
}
