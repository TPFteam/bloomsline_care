import { createClient } from '@/lib/supabase/browser-client'
import type { BlogPost, BlogImage } from '@/types/blog'
import { slugify } from './markdown'

export interface BlogInput {
  title: string
  excerpt: string
  content: string
  images?: BlogImage[]
  cover_image_url: string | null
  language: string
}

const COLUMNS =
  'id, practitioner_id, title, slug, excerpt, content, images, cover_image_url, language, status, published_snapshot, review_note, submitted_at, reviewed_at, reviewed_by, published_at, created_at, updated_at'

export async function listMyPosts(): Promise<BlogPost[]> {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return []
  const { data } = await sb
    .from('blog_posts')
    .select(COLUMNS)
    .eq('practitioner_id', user.id)
    .order('updated_at', { ascending: false })
  return (data as BlogPost[]) || []
}

export async function getMyPost(id: string): Promise<BlogPost | null> {
  const sb = createClient()
  const { data } = await sb.from('blog_posts').select(COLUMNS).eq('id', id).maybeSingle()
  return (data as BlogPost) || null
}

// Create a new draft. Slug is set once (stable public URL); collisions get a
// short suffix so two posts never clash.
export async function createPost(input: BlogInput): Promise<{ id: string } | { error: string }> {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'not_authenticated' }

  const base = slugify(input.title)
  for (const slug of [base, `${base}-${Math.random().toString(36).slice(2, 6)}`]) {
    const { data, error } = await sb
      .from('blog_posts')
      .insert({ ...input, practitioner_id: user.id, slug, status: 'draft' })
      .select('id')
      .single()
    if (!error && data) return { id: data.id }
    if (error && error.code !== '23505') return { error: error.message } // not a slug clash
  }
  return { error: 'could_not_create' }
}

// Save edits to the working copy. Never touches the live snapshot.
export async function updatePost(id: string, input: BlogInput): Promise<{ error?: string }> {
  const sb = createClient()
  const { error } = await sb.from('blog_posts').update(input).eq('id', id)
  return error ? { error: error.message } : {}
}

// Submit for admin review. Works for first publish and for edits to a live post
// (the live version stays up until re-approved).
export async function submitPost(id: string): Promise<{ error?: string }> {
  const sb = createClient()
  const { error } = await sb
    .from('blog_posts')
    .update({ status: 'pending', submitted_at: new Date().toISOString() })
    .eq('id', id)
  return error ? { error: error.message } : {}
}

export async function deletePost(id: string): Promise<{ error?: string }> {
  const sb = createClient()
  const { error } = await sb.from('blog_posts').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

// Upload an image to the public blog-images bucket under the practitioner's
// own folder (RLS requires the first path segment to be their user id).
export async function uploadBlogImage(file: File): Promise<{ url: string } | { error: string }> {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'not_authenticated' }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${user.id}/${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await sb.storage.from('blog-images').upload(path, file, { upsert: true })
  if (error) return { error: error.message }
  const { data } = sb.storage.from('blog-images').getPublicUrl(path)
  return { url: data.publicUrl }
}
