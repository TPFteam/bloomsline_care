/**
 * PATCH  /api/documents/templates/[id]  → update a template (RLS-scoped)
 * DELETE /api/documents/templates/[id]  → delete a template
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

const EDITABLE = [
  'title', 'type', 'source', 'file_path', 'content', 'locale',
  'require_signature', 'required_before_session', 'allow_guardian', 'auto_send', 'is_active',
] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const update: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) update[key] = body[key]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('document_templates')
    .update(update)
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', id)
    .eq('practitioner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
