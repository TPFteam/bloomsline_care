import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/api/session-user'
import { createAdminProjectClient } from '@/lib/supabase/admin-project-client'

// POST /api/reviews/[id]/submit — send an owned review for admin review.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getSessionUserId(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createAdminProjectClient()
  const { data } = await sb
    .from('practitioner_reviews')
    .select('practitioner_id, content, rating')
    .eq('id', id)
    .maybeSingle()
  if (!data || (data as any).practitioner_id !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(data as any).content?.trim()) return NextResponse.json({ error: 'empty_review' }, { status: 400 })

  const { error } = await sb
    .from('practitioner_reviews')
    .update({ status: 'pending', submitted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
