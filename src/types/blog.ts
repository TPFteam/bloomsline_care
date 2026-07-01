export type BlogStatus = 'draft' | 'pending' | 'changes_requested' | 'published' | 'unpublished'

/** An image inserted in the body, stored apart from the text as a {{token}}. */
export interface BlogImage {
  token: string
  url: string
}

/** Title/excerpt/body for one language. */
export interface LocalizedFields {
  title: string
  excerpt: string
  content: string
}

/** The fields captured when a post is approved — what the public site renders. */
export interface BlogSnapshot {
  title: string
  excerpt: string
  content: string
  cover_image_url: string | null
  language: string
  images?: BlogImage[]
  // Per-language variants (including the original), keyed by locale. Absent on
  // older snapshots — fall back to the top-level fields via pickLocalized().
  localized?: Record<string, LocalizedFields>
  // Denormalized at approval time so the public site needs no users-table join.
  author_name?: string
  author_avatar?: string | null
  author_title?: string | null   // practitioner headline
  author_slug?: string | null    // public profile at /practitioner/[slug]
}

/** The languages a snapshot is available in (original only if no variants). */
export function snapshotLanguages(s: BlogSnapshot): string[] {
  const keys = Object.keys(s.localized || {})
  return keys.length ? keys : [s.language]
}

/** Pick a snapshot's content for a locale, falling back to the original
 *  language, then the top-level fields (older snapshots). */
export function pickLocalized(s: BlogSnapshot, locale: string): LocalizedFields {
  const loc = s.localized || {}
  const chosen = loc[locale] || loc[s.language]
  return {
    title: chosen?.title || s.title,
    excerpt: chosen?.excerpt || s.excerpt,
    content: chosen?.content || s.content,
  }
}

export interface BlogPost {
  id: string
  practitioner_id: string
  title: string
  slug: string | null
  excerpt: string
  content: string
  cover_image_url: string | null
  language: string
  // Non-original language variants, keyed by locale.
  translations?: Record<string, LocalizedFields>
  images: BlogImage[]
  status: BlogStatus
  published_snapshot: BlogSnapshot | null
  review_note: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

/** A post is visible on bloomsline.com iff it has an approved snapshot. */
export function isLive(post: Pick<BlogPost, 'published_snapshot'>): boolean {
  return post.published_snapshot != null
}
