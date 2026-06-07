/**
 * POST /api/documents/templates/upload  (multipart: field "file")
 *
 * Uploads a template's source PDF into the `member-files` bucket under
 * `{practitionerId}/templates/...` and returns its storage path. Uses the
 * admin client so it doesn't depend on per-path storage RLS. v1 accepts PDF;
 * DOCX support is a fast-follow (needs HTML→PDF rendering).
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (file.type && file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported for now' }, { status: 415 })
  }

  const path = `${user.id}/templates/${randomUUID()}.pdf`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('member-files')
    .upload(path, bytes, { contentType: 'application/pdf', upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ file_path: path })
}
