import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/api/session-user'
import { createAdminProjectClient, PRACTITIONER_VIDEOS_BUCKET } from '@/lib/supabase/admin-project-client'

// POST /api/videos/[id]/upload-url — mint a signed upload URL so the browser can
// PUT the (large) video file straight to admin storage, bypassing the serverless
// request-body size limit. Body: { filename }. Returns { path, token, signedUrl }.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  const { data: row } = await sb.from('practitioner_videos').select('practitioner_id').eq('id', id).maybeSingle()
  if (!row || (row as any).practitioner_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const rawName = (body.filename ?? 'video').toString()
  // Keep the extension, sanitize the rest.
  const ext = (rawName.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4'
  const path = `${userId}/${id}/source.${ext}`

  const { data, error } = await sb.storage
    .from(PRACTITIONER_VIDEOS_BUCKET)
    .createSignedUploadUrl(path, { upsert: true })
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'could_not_sign' }, { status: 500 })

  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl })
}
