'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { BlogContent } from '@/components/blog/BlogContent'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import type { BlogSnapshot } from '@/types/blog'

export default function PublicBlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const supabase = createClient()
  const [snap, setSnap] = useState<BlogSnapshot | null>(null)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('published_at, published_snapshot')
        .eq('slug', slug)
        .not('published_snapshot', 'is', null)
        .maybeSingle()
      if (!data?.published_snapshot) { setState('notfound'); return }
      setSnap(data.published_snapshot as BlogSnapshot)
      setPublishedAt(data.published_at)
      setState('ready')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <EarlyAccessModalProvider>
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 max-w-2xl">
        {state === 'loading' ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-neutral-300" /></div>
        ) : state === 'notfound' || !snap ? (
          <div className="py-24 text-center">
            <p className="text-neutral-900 font-medium">{t('Article not found', 'Article introuvable')}</p>
            <Link href="/blog" className="inline-flex items-center gap-1.5 mt-4 text-sm text-teal-700 hover:text-teal-800">
              <ArrowLeft className="w-4 h-4" /> {t('Back to the blog', 'Retour au blog')}
            </Link>
          </div>
        ) : (
          <article>
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> {t('All articles', 'Tous les articles')}
            </Link>

            <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 leading-tight tracking-tight">
              {snap.title}
            </h1>

            <div className="flex items-center gap-3 mt-5 mb-9">
              {snap.author_avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={snap.author_avatar} alt={snap.author_name || ''} className="w-9 h-9 rounded-full object-cover" />
                : <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-medium">{(snap.author_name || '?').charAt(0)}</div>}
              <div className="text-sm">
                <p className="text-neutral-800 font-medium">{snap.author_name}</p>
                <p className="text-neutral-400">{fmt(publishedAt)}</p>
              </div>
            </div>

            {snap.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={snap.cover_image_url} alt="" className="w-full h-72 object-cover rounded-3xl mb-10" />
            )}

            <BlogContent markdown={snap.content} images={snap.images} />
          </article>
        )}
      </main>
      <Footer />
    </div>
    </EarlyAccessModalProvider>
  )
}
