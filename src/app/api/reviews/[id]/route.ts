import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/api/session-user'
import { createAdminProjectClient } from '@/lib/supabase/admin-project-client'

function clampRating(v: unknown): number | null {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const i = Math.round(n)
  return i >= 1 && i <= 5 ? i : null
}

async function ownedRow(sb: ReturnType<typeof createAdminProjectClient>, id: string, userId: string) {
  const { data } = await sb.from('practitioner_reviews').select('practitioner_id').eq('id', id).maybeSingle()
  return !!data && data.practitioner_id === userId
}

// PATCH /api/reviews/[id] — update an owned review.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  if (!(await ownedRow(sb, id, userId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}
  if ('rating' in body) patch.rating = clampRating(body.rating)
  if ('content' in body) patch.content = (body.content ?? '').toString()
  if ('consent_publish' in body) patch.consent_publish = !!body.consent_publish
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true })

  const { error } = await sb.from('practitioner_reviews').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/reviews/[id] — remove an owned review.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  if (!(await ownedRow(sb, id, userId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await sb.from('practitioner_reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
