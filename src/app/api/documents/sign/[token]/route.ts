/**
 * Token-based signing — the shared contract used by BOTH the web link
 * (/documents/sign/[token]) and the mobile app. No auth required; the token is
 * the credential, so all DB access uses the service-role client (bypasses RLS)
 * and the handler validates the token + expiry itself.
 *
 * GET  /api/documents/sign/[token]   → fetch the document to render; marks viewed
 * POST /api/documents/sign/[token]   → submit signature; generates the signed PDF
 *      body: { signerName, signerRelationship?, signatureImage }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { buildSignedPdf } from '@/lib/pdf/signed-document'
import { storeSignedArtifacts, decodeSignaturePng, substituteDocVariables } from '@/lib/services/documents'
import type { DocumentTemplateSnapshot, MemberDocument } from '@/types/documents'

function isExpired(doc: { token_expires_at: string }): boolean {
  return new Date(doc.token_expires_at).getTime() < Date.now()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: doc, error } = await admin
    .from('member_documents')
    .select('*')
    .eq('share_token', token)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (isExpired(doc)) return NextResponse.json({ error: 'expired' }, { status: 410 })

  const snap = (doc.template_snapshot || {}) as DocumentTemplateSnapshot

  // Mark viewed on first open.
  if (doc.status === 'sent') {
    await admin.from('member_documents')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', doc.id)
  }

  // Minor → maybe offer guardian signing. Email used for variable fill-in.
  const { data: member } = await admin
    .from('members')
    .select('first_name, last_name, email, is_minor')
    .eq('id', doc.member_id)
    .maybeSingle()
  const memberFullName = member ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() : ''

  // Language for the signing UI — match the email (practitioner's preferred
  // language), falling back to the template's locale.
  const { data: prof } = await admin
    .from('users')
    .select('preferred_language')
    .eq('id', doc.practitioner_id)
    .maybeSingle()
  const uiLocale = prof?.preferred_language || snap.locale || 'fr'

  // For uploaded originals, hand back a short-lived URL to render the PDF.
  let originalUrl: string | null = null
  if (snap.source === 'upload' && snap.file_path) {
    const { data: signed } = await admin.storage
      .from('member-files')
      .createSignedUrl(snap.file_path, 3600)
    originalUrl = signed?.signedUrl ?? null
  }

  let signedPdfUrl: string | null = null
  if (doc.status === 'signed' && doc.signed_pdf_path) {
    const { data: signed } = await admin.storage
      .from('member-files')
      .createSignedUrl(doc.signed_pdf_path, 3600)
    signedPdfUrl = signed?.signedUrl ?? null
  }

  return NextResponse.json({
    status: doc.status === 'sent' ? 'viewed' : doc.status,
    title: snap.title,
    type: snap.type,
    source: snap.source,
    content: substituteDocVariables(snap.content, { name: memberFullName, email: member?.email }),
    locale: uiLocale,
    requireSignature: snap.require_signature !== false,
    allowGuardian: snap.allow_guardian !== false,
    isMinor: member?.is_minor === true,
    memberName: member ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() : null,
    originalUrl,
    signedPdfUrl,
    alreadySigned: doc.status === 'signed',
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const admin = createAdminClient()

  const body = await request.json().catch(() => null)
  if (!body?.signerName?.trim() || !body?.signatureImage) {
    return NextResponse.json({ error: 'signerName and signatureImage are required' }, { status: 400 })
  }
  const signerRelationship = body.signerRelationship === 'guardian' ? 'guardian' : 'self'

  const { data: docRow, error } = await admin
    .from('member_documents')
    .select('*')
    .eq('share_token', token)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!docRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const doc = docRow as MemberDocument
  if (isExpired(doc)) return NextResponse.json({ error: 'expired' }, { status: 410 })
  if (doc.status === 'signed') return NextResponse.json({ error: 'already signed' }, { status: 409 })

  const snap = doc.template_snapshot as DocumentTemplateSnapshot
  const signaturePng = decodeSignaturePng(String(body.signatureImage))

  // Fill in patient variables in authored content for the signed PDF.
  const { data: signMember } = await admin
    .from('members')
    .select('first_name, last_name, email')
    .eq('id', doc.member_id)
    .maybeSingle()
  const signMemberName = signMember ? `${signMember.first_name ?? ''} ${signMember.last_name ?? ''}`.trim() : ''
  const filledBlocks = substituteDocVariables(snap.content, { name: signMemberName, email: signMember?.email })

  // Load the original PDF bytes for uploaded templates.
  let uploadBytes: Uint8Array | null = null
  if (snap.source === 'upload' && snap.file_path) {
    const { data: blob, error: dlErr } = await admin.storage
      .from('member-files')
      .download(snap.file_path)
    if (dlErr || !blob) return NextResponse.json({ error: 'Could not load document' }, { status: 500 })
    uploadBytes = new Uint8Array(await blob.arrayBuffer())
  }

  const signedAt = new Date().toISOString()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = request.headers.get('user-agent') || null

  const pdfBytes = await buildSignedPdf({
    source: snap.source,
    uploadBytes,
    blocks: filledBlocks,
    title: snap.title,
    signerName: String(body.signerName).trim(),
    signerRelationship,
    signaturePng,
    signedAt,
    ip,
    locale: snap.locale,
  })

  const { signedPdfPath, signaturePath } = await storeSignedArtifacts(admin, {
    practitionerId: doc.practitioner_id,
    memberId: doc.member_id,
    docId: doc.id,
    title: snap.title,
    pdfBytes,
    signaturePng,
  })

  const { error: updErr } = await admin
    .from('member_documents')
    .update({
      status: 'signed',
      signed_at: signedAt,
      signer_name: String(body.signerName).trim(),
      signer_relationship: signerRelationship,
      signature_path: signaturePath,
      signed_pdf_path: signedPdfPath,
      audit: { ...(doc.audit || {}), ip, user_agent: userAgent, signed_at: signedAt },
      updated_at: signedAt,
    })
    .eq('id', doc.id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
