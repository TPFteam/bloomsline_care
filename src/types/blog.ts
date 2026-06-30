export type BlogStatus = 'draft' | 'pending' | 'changes_requested' | 'published'

/** An image inserted in the body, stored apart from the text as a {{token}}. */
export interface BlogImage {
  token: string
  url: string
}

/** The fields captured when a post is approved — what the public site renders. */
export interface BlogSnapshot {
  title: string
  excerpt: string
  content: string
  cover_image_url: string | null
  language: string
  images?: BlogImage[]
  // Denormalized at approval time so the public site needs no users-table join.
  author_name?: string
  author_avatar?: string | null
  author_title?: string | null   // practitioner headline
  author_slug?: string | null    // public profile at /practitioner/[slug]
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
