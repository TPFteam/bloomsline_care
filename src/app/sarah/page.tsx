// DEMO-ONLY page (temporary). Renders the exact "Partagé → Moments" timeline for
// one patient, fetched server-side with the service-role client so it works on a
// public URL without anyone logging in. DELETE this folder (src/app/sarah) once
// the demo is over — it exposes patient moments without auth by design.

import { createAdminClient } from '@/lib/supabase/server-client'
import SarahTimeline, { type DemoMoment, type DemoComment } from './SarahTimeline'

export const dynamic = 'force-dynamic'

const EMAIL = 'sarah.lagzouli@gmail.com'
const MEDIA_BUCKET = 'moments_media'
const SIGN_TTL = 60 * 60 * 6 // 6 hours — long enough for a demo session

type Admin = ReturnType<typeof createAdminClient>

async function resolveUserId(admin: Admin): Promise<string | null> {
  // moments are keyed by auth uid (user_id). Try members → public.users → auth.
  const { data: mem } = await admin
    .from('members')
    .select('user_id')
    .ilike('email', EMAIL)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle()
  if (mem?.user_id) return mem.user_id as string

  const { data: prof } = await admin
    .from('users')
    .select('id')
    .ilike('email', EMAIL)
    .limit(1)
    .maybeSingle()
  if (prof?.id) return prof.id as string

  // Fallback: scan auth users (first pages) for the email.
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    const hit = data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase())
    if (hit) return hit.id
    if (data.users.length < 200) break
  }
  return null
}

async function signImage(admin: Admin, path: string | null): Promise<string | null> {
  if (!path) return null
  // Stored values may already be full URLs (migration window) — pass through.
  if (path.startsWith('http')) return path
  const { data } = await admin.storage.from(MEDIA_BUCKET).createSignedUrl(path, SIGN_TTL)
  return data?.signedUrl ?? null
}

export default async function SarahDemoPage() {
  let moments: DemoMoment[] = []

  try {
    const admin = createAdminClient()
    const userId = await resolveUserId(admin)

    if (userId) {
      const { data } = await admin
        .from('moments')
        .select(
          'id, type, media_path, media_url, thumbnail_path, thumbnail_url, text_content, caption, moods, duration_seconds, created_at, shared_with_practitioner_at'
        )
        .eq('user_id', userId)
        .not('shared_with_practitioner_at', 'is', null)
        .order('shared_with_practitioner_at', { ascending: false })

      const rows = data || []
      const ids = rows.map((m: any) => m.id)

      // Conversation threads (read-only in the demo), grouped per moment.
      const commentsByMoment: Record<string, DemoComment[]> = {}
      if (ids.length) {
        const { data: cData } = await admin
          .from('moment_comments')
          .select('moment_id, author_type, content, created_at')
          .in('moment_id', ids)
          .order('created_at', { ascending: true })
        for (const c of (cData || []) as any[]) {
          ;(commentsByMoment[c.moment_id] ||= []).push({
            author_type: c.author_type,
            content: c.content,
            created_at: c.created_at,
          })
        }
      }

      moments = await Promise.all(
        rows.map(async (m: any): Promise<DemoMoment> => {
          const isMedia = m.type === 'photo' || m.type === 'video' || m.type === 'mixed'
          const image_url = isMedia
            ? await signImage(admin, m.thumbnail_path ?? m.media_path ?? m.thumbnail_url ?? m.media_url)
            : null
          const full_url =
            isMedia || m.type === 'voice' ? await signImage(admin, m.media_path ?? m.media_url) : null
          return {
            id: m.id,
            type: m.type,
            text_content: m.text_content,
            caption: m.caption,
            moods: m.moods,
            duration_seconds: m.duration_seconds,
            created_at: m.created_at,
            shared_with_practitioner_at: m.shared_with_practitioner_at,
            image_url,
            full_url,
            comments: commentsByMoment[m.id] || [],
          }
        })
      )
    }
  } catch (err) {
    console.error('[sarah-demo] failed to load moments:', err)
  }

  return <SarahTimeline moments={moments} />
}
