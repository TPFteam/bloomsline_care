import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/api/session-user'
import { createAdminProjectClient, PRACTITIONER_VIDEOS_BUCKET } from '@/lib/supabase/admin-project-client'

const COLUMNS =
  'id, practitioner_id, title, description, language, storage_path, thumbnail_url, duration_seconds, status, review_note, submitted_at, reviewed_at, reviewed_by, published_at, created_at, updated_at'

// Confirm the row belongs to the caller before any mutation/read.
async function ownedRow(sb: ReturnType<typeof createAdminProjectClient>, id: string, userId: string) {
  const { data } = await sb.from('practitioner_videos').select('practitioner_id').eq('id', id).maybeSingle()
  return !!data && data.practitioner_id === userId
}

// GET /api/videos/[id] — a single owned video with a signed playback URL.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  const { data, error } = await sb.from('practitioner_videos').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || (data as any).practitioner_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let playback_url: string | null = null
  if ((data as any).storage_path) {
    const { data: signed } = await sb.storage
      .from(PRACTITIONER_VIDEOS_BUCKET)
      .createSignedUrl((data as any).storage_path, 60 * 60)
    playback_url = signed?.signedUrl ?? null
  }
  return NextResponse.json({ video: { ...data, playback_url } })
}

// PATCH /api/videos/[id] — update editable fields on an owned draft.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  if (!(await ownedRow(sb, id, userId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}
  for (const k of ['title', 'description', 'language', 'storage_path', 'thumbnail_url', 'duration_seconds'] as const) {
    if (k in body) patch[k] = body[k]
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const { error } = await sb.from('practitioner_videos').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/videos/[id] — remove an owned video (and its stored file).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  const { data } = await sb.from('practitioner_videos').select('practitioner_id, storage_path').eq('id', id).maybeSingle()
  if (!data || (data as any).practitioner_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if ((data as any).storage_path) {
    await sb.storage.from(PRACTITIONER_VIDEOS_BUCKET).remove([(data as any).storage_path])
  }
  const { error } = await sb.from('practitioner_videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
