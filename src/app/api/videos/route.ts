import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/api/session-user'
import { createAdminProjectClient, PRACTITIONER_VIDEOS_BUCKET } from '@/lib/supabase/admin-project-client'

const COLUMNS =
  'id, practitioner_id, title, description, language, storage_path, thumbnail_url, duration_seconds, status, review_note, submitted_at, reviewed_at, reviewed_by, published_at, created_at, updated_at'

// GET /api/videos — list the current practitioner's videos (admin project),
// each with a short-lived signed playback URL.
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  const { data, error } = await sb
    .from('practitioner_videos')
    .select(COLUMNS)
    .eq('practitioner_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const videos = await Promise.all(
    (data || []).map(async (v: any) => {
      let playback_url: string | null = null
      if (v.storage_path) {
        const { data: signed } = await sb.storage
          .from(PRACTITIONER_VIDEOS_BUCKET)
          .createSignedUrl(v.storage_path, 60 * 60) // 1 hour
        playback_url = signed?.signedUrl ?? null
      }
      return { ...v, playback_url }
    })
  )
  return NextResponse.json({ videos })
}

// POST /api/videos — create a draft video row. practitioner_id is stamped from
// the session, never from the request body.
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sb = createAdminProjectClient()
  const { data, error } = await sb
    .from('practitioner_videos')
    .insert({
      practitioner_id: userId,
      title: (body.title ?? '').toString(),
      description: (body.description ?? '').toString(),
      language: (body.language ?? 'en').toString(),
      status: 'draft',
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
