/**
 * Document templates — practice-level reusable consent/intake documents.
 *
 * GET  /api/documents/templates        → list the practitioner's templates
 * POST /api/documents/templates        → create one (upload or authored)
 *
 * For uploads the client first puts the file into the `member-files` bucket
 * (e.g. `{practitionerId}/templates/...`) and passes the resulting `file_path`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('practitioner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Short-lived preview URL for uploaded PDFs (for the View/Preview modal).
  const admin = createAdminClient()
  const templates = await Promise.all(((data || []) as Array<{ source: string; file_path: string | null }>).map(async (t) => {
    let previewUrl: string | null = null
    if (t.source === 'upload' && t.file_path) {
      const { data: signed } = await admin.storage.from('member-files').createSignedUrl(t.file_path, 3600)
      previewUrl = signed?.signedUrl ?? null
    }
    return { ...t, previewUrl }
  }))

  return NextResponse.json({ templates })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || !body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  const source = body.source === 'authored' ? 'authored' : 'upload'
  if (source === 'upload' && !body.file_path) {
    return NextResponse.json({ error: 'file_path is required for uploaded templates' }, { status: 400 })
  }
  if (source === 'authored' && !Array.isArray(body.content)) {
    return NextResponse.json({ error: 'content blocks are required for authored templates' }, { status: 400 })
  }

  const row = {
    practitioner_id: user.id,
    title: String(body.title).trim(),
    type: ['consent', 'intake', 'other'].includes(body.type) ? body.type : 'consent',
    source,
    file_path: source === 'upload' ? body.file_path : null,
    content: source === 'authored' ? body.content : null,
    locale: body.locale || 'fr',
    require_signature: body.require_signature !== false,
    required_before_session: body.required_before_session === true,
    allow_guardian: body.allow_guardian !== false,
    auto_send: body.auto_send === true,
    is_active: body.is_active !== false,
    folder_id: typeof body.folder_id === 'string' ? body.folder_id : null,
  }

  const { data, error } = await supabase
    .from('document_templates')
    .insert(row)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
