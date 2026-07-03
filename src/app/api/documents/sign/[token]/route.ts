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
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server-client'
import { buildSignedPdf } from '@/lib/pdf/signed-document'
import { storeSignedArtifacts, decodeSignaturePng, substituteDocVariables } from '@/lib/services/documents'
import { createNotificationService } from '@/lib/notifications/service'
import type { DocumentTemplateSnapshot, MemberDocument } from '@/types/documents'

function isExpired(doc: { token_expires_at: string }): boolean {
  return new Date(doc.token_expires_at).getTime() < Date.now()
}

/**
 * After a document is signed, notify + email both parties. For a bundle we wait
 * until every document in it is signed, then send ONE notification + email
 * listing all of them (with the signed PDFs attached). Best-effort — never lets
 * a notification failure break the signing itself.
 */
async function notifySigned(admin: SupabaseClient, signedDoc: MemberDocument) {
  try {
    console.log('[notifySigned] start', { docId: signedDoc.id, bundleId: signedDoc.bundle_id })
    // Which documents this notification covers.
    let docs: MemberDocument[] = [signedDoc]
    let label = (signedDoc.template_snapshot as DocumentTemplateSnapshot)?.title || 'a document'
    if (signedDoc.bundle_id) {
      const { data: bundleDocs } = await admin.from('member_documents').select('*').eq('bundle_id', signedDoc.bundle_id)
      const all = (bundleDocs || []) as MemberDocument[]
      const statuses = all.map((d) => d.status)
      console.log('[notifySigned] bundle statuses', statuses)
      if (all.length === 0 || !all.every((d) => d.status === 'signed')) {
        console.log('[notifySigned] bundle not complete yet — waiting')
        return // wait for the rest
      }
      docs = all.sort((a, b) => (a.bundle_seq ?? 0) - (b.bundle_seq ?? 0))
      const { data: bundle } = await admin.from('document_bundles').select('title').eq('id', signedDoc.bundle_id).maybeSingle()
      label = (bundle?.title as string) || `${all.length} documents`
    }

    // People.
    const { data: member } = await admin
      .from('members').select('user_id, first_name, last_name, email')
      .eq('id', signedDoc.member_id).maybeSingle()
    const patientName = member ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() : 'Your patient'
    const { data: prof } = await admin
      .from('users').select('full_name, preferred_language')
      .eq('id', signedDoc.practitioner_id).maybeSingle()
    const locale: 'en' | 'fr' = prof?.preferred_language === 'fr' ? 'fr' : 'en'
    const practitionerName = (prof?.full_name as string) || ''
    let practitionerEmail: string | null = null
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(signedDoc.practitioner_id)
      practitionerEmail = authUser?.user?.email ?? null
    } catch { /* no-op */ }

    // Signed PDFs → base64 attachments.
    const documents: Array<{ title: string; contentBase64: string }> = []
    for (const d of docs) {
      if (!d.signed_pdf_path) continue
      const { data: blob } = await admin.storage.from('member-files').download(d.signed_pdf_path)
      if (!blob) continue
      const b64 = Buffer.from(new Uint8Array(await blob.arrayBuffer())).toString('base64')
      documents.push({ title: (d.template_snapshot as DocumentTemplateSnapshot)?.title || 'document', contentBase64: b64 })
    }

    // In-app notifications (channels: [] → in-app only; the attachment email is
    // sent separately below).
    const svc = createNotificationService(admin)
    await svc.send({
      userId: signedDoc.practitioner_id, userType: 'practitioner', type: 'document_signed',
      metadata: { patientName, documentLabel: label, memberId: signedDoc.member_id },
      entityType: 'document', entityId: signedDoc.id, channels: [], locale,
    })
    if (member?.user_id) {
      await svc.send({
        userId: member.user_id as string, userType: 'member', type: 'documents_signed_receipt',
        metadata: { documentLabel: label }, entityType: 'document', entityId: signedDoc.id, channels: [], locale,
      })
    }

    // Where each party can find the documents in-product.
    const careOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bloomsline.com'
    const appOrigin = process.env.NEXT_PUBLIC_MOBILE_APP_URL || 'https://app.bloomsline.com'
    const practitionerCta = `${careOrigin}/members/${signedDoc.member_id}?tab=files`
    const patientCta = `${appOrigin}/practitioner` // My Care (documents live there)

    // Emails with the signed PDFs attached, to both parties (best-effort).
    console.log('[notifySigned] emailing', { practitionerEmail, memberEmail: member?.email ?? null, attachments: documents.length, label })
    const sendMail = async (toEmail: string | null, toName: string, role: 'practitioner' | 'patient', counterpartName: string, ctaUrl: string) => {
      if (!toEmail) { console.warn('[notifySigned] skip email — no address for', role); return }
      if (documents.length === 0) { console.warn('[notifySigned] skip email — no signed PDFs to attach'); return }
      const { data, error } = await admin.functions
        .invoke('send-documents-signed', { body: { toEmail, toName, role, counterpartName, folderLabel: label, documents, locale, ctaUrl } })
      if (error) {
        let detail: string = (error as { message?: string })?.message || String(error)
        try {
          const ctx = (error as { context?: { text?: () => Promise<string> } })?.context
          if (ctx?.text) detail = await ctx.text()
        } catch { /* no-op */ }
        console.error(`[notifySigned] email invoke FAILED for ${role}:`, detail)
      } else {
        console.log(`[notifySigned] email sent for ${role}`, data)
      }
    }
    await Promise.all([
      sendMail(practitionerEmail, practitionerName, 'practitioner', patientName, practitionerCta),
      sendMail(member?.email ?? null, patientName, 'patient', practitionerName, patientCta),
    ])
  } catch (e) {
    console.error('[sign] notifySigned error:', e)
  }
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

  // Notify + email both parties (waits for the whole bundle when applicable).
  await notifySigned(admin, { ...doc, status: 'signed', signed_pdf_path: signedPdfPath })

  return NextResponse.json({ ok: true })
}
