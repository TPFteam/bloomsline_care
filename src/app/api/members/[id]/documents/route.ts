/**
 * Per-member signable documents.
 *
 * GET  /api/members/[id]/documents            → list documents sent to a member
 * POST /api/members/[id]/documents            → send a template to the member
 *                                               body: { templateId }
 *
 * Sending creates a `member_documents` row + a 30-day signing token and returns
 * the signing link. (Email delivery is wired in a later step via the
 * `send-document-to-sign` edge function; the link is returned so the UI can
 * also copy/share it.) Account creation is never gated on this.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { newShareToken, tokenExpiryISO, snapshotFromTemplate } from '@/lib/services/documents'
import type { DocumentTemplate, MemberDocument } from '@/types/documents'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('member_documents')
    .select('*')
    .eq('member_id', memberId)
    .eq('practitioner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach a short-lived URL to each signed PDF so the practitioner can view /
  // download it straight from the Documents card.
  const admin = createAdminClient()
  const documents = await Promise.all(((data || []) as MemberDocument[]).map(async (doc) => {
    let signedPdfUrl: string | null = null       // inline (for the viewer)
    let signedPdfDownloadUrl: string | null = null // attachment (direct download)
    let signatureUrl: string | null = null        // the drawn-signature image
    if (doc.status === 'signed' && doc.signed_pdf_path) {
      const title = (doc.template_snapshot as { title?: string })?.title || 'document'
      const fileName = `${title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'document'}.pdf`
      const [inline, attach, sig] = await Promise.all([
        admin.storage.from('member-files').createSignedUrl(doc.signed_pdf_path, 3600),
        admin.storage.from('member-files').createSignedUrl(doc.signed_pdf_path, 3600, { download: fileName }),
        doc.signature_path
          ? admin.storage.from('member-files').createSignedUrl(doc.signature_path, 3600)
          : Promise.resolve({ data: null }),
      ])
      signedPdfUrl = inline.data?.signedUrl ?? null
      signedPdfDownloadUrl = attach.data?.signedUrl ?? null
      signatureUrl = sig.data?.signedUrl ?? null
    }
    return { ...doc, signedPdfUrl, signedPdfDownloadUrl, signatureUrl }
  }))

  return NextResponse.json({ documents })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
  }

  // Ownership: the member must belong to this practitioner.
  const { data: member, error: memberErr } = await supabase
    .from('members')
    .select('id, practitioner_id, first_name, last_name, email')
    .eq('id', memberId)
    .eq('practitioner_id', user.id)
    .maybeSingle()
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Template (RLS scopes it to this practitioner).
  const { data: template, error: tErr } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', body.templateId)
    .eq('practitioner_id', user.id)
    .maybeSingle()
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const token = newShareToken()
  const { data: doc, error: insErr } = await supabase
    .from('member_documents')
    .insert({
      member_id: memberId,
      practitioner_id: user.id,
      template_id: template.id,
      template_snapshot: snapshotFromTemplate(template as DocumentTemplate),
      status: 'sent',
      share_token: token,
      token_expires_at: tokenExpiryISO(),
    })
    .select('*')
    .single()
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  const origin = request.nextUrl.origin
  const signUrl = `${origin}/documents/sign/${token}`

  // Email the patient the signing link. Best-effort: never fail the send (the
  // practitioner can always copy the link from the Documents card). Skipped
  // when the patient has no email on file.
  let emailed = false
  if (member.email) {
    const { data: prof } = await supabase
      .from('users')
      .select('full_name, preferred_language')
      .eq('id', user.id)
      .maybeSingle()
    try {
      const { error: fnErr } = await supabase.functions.invoke('send-document-to-sign', {
        body: {
          memberEmail: member.email,
          memberName: member.first_name || '',
          practitionerName: prof?.full_name || '',
          documentTitle: (template as { title?: string }).title || '',
          signUrl,
          locale: prof?.preferred_language || (template as { locale?: string }).locale || 'fr',
        },
      })
      emailed = !fnErr
    } catch {
      emailed = false
    }
  }

  return NextResponse.json({ document: doc, signUrl, emailed })
}
