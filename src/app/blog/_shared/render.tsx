// Shared server-side data + rendering + metadata for the public blog, used by
// both the English routes (/blog, /blog/[slug]) and the French routes
// (/fr/blog, /fr/blog/[slug]). Not a route (underscore folder). Locale is
// passed in from the route file — the URL is the source of truth, so the SSR
// HTML always matches the language and there is no client hydration flash.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { BlogLangSwitcher } from '@/components/blog/BlogLangSwitcher'
import { createAdminClient } from '@/lib/supabase/server-client'
import { pickLocalized, snapshotLanguages, type BlogSnapshot } from '@/types/blog'
import { BlogBody } from '@/components/blog/BlogBody'
import type { Locale } from '@/lib/i18n/context'

export const ORIGIN = 'https://www.bloomsline.com'

type BlogLocale = 'en' | 'fr'
const tr = (locale: BlogLocale, en: string, fr: string) => (locale === 'fr' ? fr : en)
const listPath = (l: BlogLocale) => (l === 'fr' ? '/fr/blog' : '/blog')
const postPath = (l: BlogLocale, slug: string) => (l === 'fr' ? `/fr/blog/${slug}` : `/blog/${slug}`)
const fmtDate = (d: string | null, locale: BlogLocale) =>
  d ? new Date(d).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

// hreflang alternates limited to the languages a post actually has.
function altLanguages(langs: string[], toPath: (l: BlogLocale) => string) {
  const languages: Record<string, string> = {}
  if (langs.includes('en')) languages['en'] = toPath('en')
  if (langs.includes('fr')) languages['fr-FR'] = toPath('fr')
  languages['x-default'] = toPath('en')
  return languages
}

interface ListRow {
  id: string
  slug: string | null
  practitioner_id: string
  published_at: string | null
  published_snapshot: BlogSnapshot
}

async function getPublishedPosts(): Promise<ListRow[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, practitioner_id, published_at, published_snapshot')
    .not('published_snapshot', 'is', null)
    .order('published_at', { ascending: false })
  return (data as ListRow[]) || []
}

async function getPublishedPost(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, published_at, published_snapshot, practitioner_id')
    .eq('slug', slug)
    .not('published_snapshot', 'is', null)
    .maybeSingle()
  return data as { slug: string; published_at: string | null; published_snapshot: BlogSnapshot; practitioner_id: string } | null
}

// Live headline + profile slug for a set of practitioners (so the author line
// and "View profile" link stay current without re-approving old posts).
async function getAuthorHeadlines(ids: string[]): Promise<Record<string, { headline: string | null; slug: string | null }>> {
  if (!ids.length) return {}
  const supabase = createAdminClient()
  const { data } = await supabase.from('practitioner_profiles').select('user_id, headline, slug').in('user_id', ids)
  const map: Record<string, { headline: string | null; slug: string | null }> = {}
  for (const p of data || []) map[p.user_id as string] = { headline: (p.headline as string) || null, slug: (p.slug as string) || null }
  return map
}

// ── List ────────────────────────────────────────────────────────────────────

export function buildListMetadata(locale: BlogLocale): Metadata {
  const title = tr(locale, 'Words from our practitioners | Bloomsline', 'Les mots de nos praticiens | Bloomsline')
  const description = tr(
    locale,
    'Reflections on therapy, mental health, and the space between sessions, from Bloomsline practitioners.',
    'Réflexions sur la thérapie, la santé mentale et l\'espace entre les séances, par les praticiens Bloomsline.',
  )
  return {
    title,
    description,
    alternates: { canonical: listPath(locale), languages: { en: '/blog', 'fr-FR': '/fr/blog', 'x-default': '/blog' } },
    openGraph: { title, description, type: 'website', url: listPath(locale), locale: locale === 'fr' ? 'fr_FR' : 'en_US' },
  }
}

export async function renderBlogList({ locale }: { locale: BlogLocale }) {
  const posts = await getPublishedPosts()
  const headlines = await getAuthorHeadlines(Array.from(new Set(posts.map((p) => p.practitioner_id).filter(Boolean))))

  return (
    <EarlyAccessModalProvider>
      <div className="min-h-screen bg-[#FAF8F5]">
        <Navbar locale={locale as Locale} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 max-w-6xl">
          <div className="flex justify-end mb-4">
            <BlogLangSwitcher enHref="/blog" frHref="/fr/blog" current={locale} />
          </div>

          <header className="mb-14 text-center">
            <p className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-3">{tr(locale, 'The Blog', 'Le Blog')}</p>
            <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 tracking-tight">
              {tr(locale, 'Words from our practitioners', 'Les mots de nos praticiens')}
            </h1>
            <p className="text-neutral-500 mt-3 font-light">
              {tr(locale, 'Reflections on therapy, mental health, and the space between sessions.', 'Réflexions sur la thérapie, la santé mentale, et l\'espace entre les séances.')}
            </p>
          </header>

          {posts.length === 0 ? (
            <p className="text-center text-neutral-400 py-20">{tr(locale, 'No articles yet. Check back soon.', 'Pas encore d\'articles. Revenez bientôt.')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => {
                const s = p.published_snapshot
                const loc = pickLocalized(s, locale)
                const headline = headlines[p.practitioner_id]?.headline || s.author_title || null
                return (
                  <Link
                    key={p.id}
                    href={postPath(locale, p.slug || '')}
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
                      {loc.excerpt && <p className="text-sm text-neutral-500 mt-2 font-light leading-relaxed line-clamp-2 flex-1">{loc.excerpt}</p>}
                      <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-neutral-100">
                        {s.author_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.author_avatar} alt={s.author_name || ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-medium shrink-0">{(s.author_name || '?').charAt(0)}</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">{s.author_name}</p>
                          <p className="text-xs text-neutral-400 truncate">{headline ? `${headline} · ` : ''}{fmtDate(p.published_at, locale)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
        <Footer locale={locale as Locale} />
      </div>
    </EarlyAccessModalProvider>
  )
}

// ── Post ────────────────────────────────────────────────────────────────────

export async function buildPostMetadata({ slug, locale }: { slug: string; locale: BlogLocale }): Promise<Metadata> {
  // Missing post / missing-in-this-language → not a real page. Force-dynamic
  // streaming can't set a 404 status after the head flushes, so we mark it
  // noindex to keep soft-404s out of the index.
  const notFoundMeta: Metadata = {
    title: tr(locale, 'Article not found | Bloomsline', 'Article introuvable | Bloomsline'),
    robots: { index: false, follow: false },
  }
  const post = await getPublishedPost(slug)
  if (!post) return notFoundMeta
  const s = post.published_snapshot
  const langs = snapshotLanguages(s)
  if (!langs.includes(locale)) return notFoundMeta
  const picked = pickLocalized(s, locale)
  const title = `${picked.title} | Bloomsline`
  const description = (picked.excerpt || '').slice(0, 160)
  return {
    title,
    description,
    alternates: { canonical: postPath(locale, slug), languages: altLanguages(langs, (l) => postPath(l, slug)) },
    openGraph: {
      title,
      description,
      type: 'article',
      url: postPath(locale, slug),
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(s.author_name ? { authors: [s.author_name] } : {}),
      images: s.cover_image_url ? [{ url: s.cover_image_url }] : ['/api/og'],
    },
    twitter: { card: 'summary_large_image', title, description, images: s.cover_image_url ? [s.cover_image_url] : ['/api/og'] },
  }
}

export async function renderBlogPost({ slug, locale }: { slug: string; locale: BlogLocale }) {
  const post = await getPublishedPost(slug)
  if (!post) notFound()
  const s = post.published_snapshot
  const langs = snapshotLanguages(s)
  // A post that has no variant for this locale is not a real page here.
  if (!langs.includes(locale)) notFound()

  const picked = pickLocalized(s, locale)
  const author = await getAuthorHeadlines(post.practitioner_id ? [post.practitioner_id] : [])
  const authorTitle = author[post.practitioner_id]?.headline || s.author_title || null
  const authorSlug = author[post.practitioner_id]?.slug || s.author_slug || null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: picked.title,
    ...(picked.excerpt ? { description: picked.excerpt } : {}),
    ...(s.cover_image_url ? { image: s.cover_image_url } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    inLanguage: locale === 'fr' ? 'fr-FR' : 'en-US',
    author: {
      '@type': 'Person',
      name: s.author_name || 'A Bloomsline practitioner',
      ...(authorSlug ? { url: `${ORIGIN}/practitioner/${authorSlug}` } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bloomsline',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}${postPath(locale, slug)}` },
  }

  return (
    <EarlyAccessModalProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#FAF8F5]">
        <Navbar locale={locale as Locale} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 max-w-2xl">
          <article>
            <div className="flex items-center justify-between gap-4 mb-8">
              <Link href={listPath(locale)} className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> {tr(locale, 'All articles', 'Tous les articles')}
              </Link>
              <BlogLangSwitcher
                enHref={langs.includes('en') ? postPath('en', slug) : null}
                frHref={langs.includes('fr') ? postPath('fr', slug) : null}
                current={locale}
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 leading-tight tracking-tight">{picked.title}</h1>

            <div className="flex items-center gap-3 mt-5 mb-9">
              {s.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.author_avatar} alt={s.author_name || ''} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-medium shrink-0">{(s.author_name || '?').charAt(0)}</div>
              )}
              <div className="text-sm min-w-0">
                <p className="text-neutral-800 font-medium truncate">{s.author_name}</p>
                <p className="text-neutral-400 truncate">{authorTitle ? `${authorTitle} · ` : ''}{fmtDate(post.published_at, locale)}</p>
              </div>
              {authorSlug && (
                <Link href={`/practitioner/${authorSlug}`} className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 group shrink-0">
                  <span className="hidden sm:inline">{tr(locale, 'View profile', 'Voir le profil')}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>

            {s.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.cover_image_url} alt="" className="w-full h-72 object-cover rounded-3xl mb-10" />
            )}

            <BlogBody markdown={picked.content} images={s.images} />
          </article>
        </main>
        <Footer locale={locale as Locale} />
      </div>
    </EarlyAccessModalProvider>
  )
}
