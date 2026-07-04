import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/api/session-user'
import { createAdminProjectClient } from '@/lib/supabase/admin-project-client'

const COLUMNS =
  'id, practitioner_id, rating, content, consent_publish, status, review_note, submitted_at, reviewed_at, reviewed_by, published_at, created_at, updated_at'

function clampRating(v: unknown): number | null {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const i = Math.round(n)
  return i >= 1 && i <= 5 ? i : null
}

// GET /api/reviews — the current practitioner's reviews (admin project).
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  const { data, error } = await sb
    .from('practitioner_reviews')
    .select(COLUMNS)
    .eq('practitioner_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data || [] })
}

// POST /api/reviews — create a draft review. practitioner_id stamped from session.
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sb = createAdminProjectClient()
  const { data, error } = await sb
    .from('practitioner_reviews')
    .insert({
      practitioner_id: userId,
      rating: clampRating(body.rating),
      content: (body.content ?? '').toString(),
      consent_publish: !!body.consent_publish,
      status: 'draft',
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
