/**
 * GET /api/me/documents — documents tied to the signed-in patient's linked
 * member record(s). Used by the mobile app to show pending-to-sign and signed
 * documents. RLS (the "Patients read own member documents" policy) scopes the
 * rows; we add short-lived URLs for signed PDFs.
 */

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import type { MemberDocument, DocumentTemplateSnapshot } from '@/types/documents'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('member_documents')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const admin = createAdminClient()
  const documents = await Promise.all(((data || []) as MemberDocument[]).map(async (doc) => {
    const snap = (doc.template_snapshot || {}) as DocumentTemplateSnapshot
    let signedPdfUrl: string | null = null
    if (doc.status === 'signed' && doc.signed_pdf_path) {
      const { data: signed } = await admin.storage
        .from('member-files')
        .createSignedUrl(doc.signed_pdf_path, 3600)
      signedPdfUrl = signed?.signedUrl ?? null
    }
    return {
      id: doc.id,
      title: snap.title,
      status: doc.status,
      signedAt: doc.signed_at,
      shareToken: doc.status === 'signed' ? null : doc.share_token, // pending → can sign
      signedPdfUrl,
    }
  }))

  return NextResponse.json({ documents })
}
