import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server-client'
import { snapshotLanguages, type BlogSnapshot } from '@/types/blog'

export const dynamic = 'force-dynamic'

const ORIGIN = 'https://www.bloomsline.com'

// hreflang alternates for a post, limited to the languages it actually has.
function postAlternates(slug: string, langs: string[]) {
  const languages: Record<string, string> = {}
  if (langs.includes('en')) languages['en'] = `${ORIGIN}/blog/${slug}`
  if (langs.includes('fr')) languages['fr-FR'] = `${ORIGIN}/fr/blog/${slug}`
  return languages
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, published_at, published_snapshot')
    .not('published_snapshot', 'is', null)
    .order('published_at', { ascending: false })

  const entries: MetadataRoute.Sitemap = [
    { url: `${ORIGIN}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${ORIGIN}/blog`, changeFrequency: 'daily', priority: 0.8, alternates: { languages: { en: `${ORIGIN}/blog`, 'fr-FR': `${ORIGIN}/fr/blog` } } },
    { url: `${ORIGIN}/fr/blog`, changeFrequency: 'daily', priority: 0.8 },
  ]

  for (const row of data || []) {
    const slug = row.slug as string | null
    if (!slug) continue
    const langs = snapshotLanguages(row.published_snapshot as BlogSnapshot)
    const lastModified = (row.published_at as string) || undefined
    const alternates = { languages: postAlternates(slug, langs) }
    if (langs.includes('en')) entries.push({ url: `${ORIGIN}/blog/${slug}`, lastModified, changeFrequency: 'monthly', priority: 0.7, alternates })
    if (langs.includes('fr')) entries.push({ url: `${ORIGIN}/fr/blog/${slug}`, lastModified, changeFrequency: 'monthly', priority: 0.7, alternates })
  }

  return entries
}
