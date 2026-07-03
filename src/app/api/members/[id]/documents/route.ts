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
import { newShareToken, tokenExpiryISO, snapshotFromTemplate, emailSigningLink, substituteDocVariables } from '@/lib/services/documents'
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

  // Patient data for filling in authored-document variables in the view.
  const { data: gMember } = await supabase
    .from('members')
    .select('first_name, last_name, email')
    .eq('id', memberId)
    .maybeSingle()
  const gMemberName = gMember ? `${gMember.first_name ?? ''} ${gMember.last_name ?? ''}`.trim() : ''

  // Bundle titles/tokens so the card can group folder-sent documents together.
  const bundleIds = Array.from(new Set(((data || []) as MemberDocument[]).map(d => d.bundle_id).filter(Boolean))) as string[]
  const bundleMap = new Map<string, { title: string; share_token: string }>()
  if (bundleIds.length > 0) {
    const { data: bs } = await supabase.from('document_bundles').select('id, title, share_token').in('id', bundleIds)
    for (const b of bs || []) bundleMap.set(b.id as string, { title: b.title as string, share_token: b.share_token as string })
  }

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
    // Fill in patient variables for the authored-document viewer.
    const snap = (doc.template_snapshot || {}) as { source?: string; content?: import('@/types/documents').DocumentBlock[] | null }
    const template_snapshot = snap.source === 'authored'
      ? { ...snap, content: substituteDocVariables(snap.content, { name: gMemberName, email: gMember?.email }) }
      : doc.template_snapshot
    const bundle = doc.bundle_id ? bundleMap.get(doc.bundle_id) : null
    return { ...doc, template_snapshot, signedPdfUrl, signedPdfDownloadUrl, signatureUrl, bundleTitle: bundle?.title ?? null, bundleToken: bundle?.share_token ?? null }
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

  // Folder bundle — send every (not-yet-signed) document in a folder as one
  // link the patient signs sequentially.
  if (body?.folderId) {
    return sendFolderBundle(supabase, user.id, memberId, String(body.folderId), request)
  }

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

  // Don't create a duplicate: if this template is already out for signature
  // (sent or viewed, not yet signed) for this member, block it — the UI offers
  // "Remind" on the existing row instead.
  const { data: dupes } = await supabase
    .from('member_documents')
    .select('id')
    .eq('member_id', memberId)
    .eq('practitioner_id', user.id)
    .eq('template_id', template.id)
    .in('status', ['sent', 'viewed'])
    .limit(1)
  if (dupes && dupes.length > 0) {
    return NextResponse.json({ error: 'already_sent', existingId: dupes[0].id }, { status: 409 })
  }

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

  // Use the configured public app URL so links are correct in production
  // (request.nextUrl.origin can resolve to localhost / an internal host behind
  // the proxy). Falls back to the request origin for local dev.
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const signUrl = `${origin}/documents/sign/${token}`

  // Email the patient the signing link (best-effort; skipped if no email).
  const emailed = await emailSigningLink(supabase, {
    practitionerId: user.id,
    memberEmail: member.email,
    memberFirstName: member.first_name,
    templateTitle: (template as { title?: string }).title || '',
    signUrl,
  })

  return NextResponse.json({ document: doc, signUrl, emailed })
}

// Send a folder's active documents to a member as one bundle: a shared link
// and one email. Each doc becomes its own member_documents row (own token) so
// the existing signing pipeline is reused; the bundle ties them together and
// carries the sequential-signing link. Documents the member already signed
// (standalone) are skipped.
async function sendFolderBundle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  memberId: string,
  folderId: string,
  request: NextRequest,
) {
  const { data: member, error: memberErr } = await supabase
    .from('members')
    .select('id, first_name, last_name, email')
    .eq('id', memberId)
    .eq('practitioner_id', userId)
    .maybeSingle()
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: folder } = await supabase
    .from('document_folders')
    .select('id, name')
    .eq('id', folderId)
    .eq('practitioner_id', userId)
    .maybeSingle()
  if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })

  const { data: templates } = await supabase
    .from('document_templates')
    .select('*')
    .eq('practitioner_id', userId)
    .eq('folder_id', folderId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (!templates || templates.length === 0) {
    return NextResponse.json({ error: 'empty_folder' }, { status: 400 })
  }

  // Skip documents this member has already signed (standalone or a prior bundle).
  const { data: signed } = await supabase
    .from('member_documents')
    .select('template_id')
    .eq('member_id', memberId)
    .eq('practitioner_id', userId)
    .eq('status', 'signed')
    .in('template_id', templates.map((t) => t.id))
  const signedIds = new Set((signed || []).map((r) => r.template_id))
  const toSend = templates.filter((t) => !signedIds.has(t.id))
  if (toSend.length === 0) {
    return NextResponse.json({ allSigned: true, count: 0 })
  }

  const bundleToken = newShareToken()
  const { data: bundle, error: bErr } = await supabase
    .from('document_bundles')
    .insert({
      member_id: memberId,
      practitioner_id: userId,
      folder_id: folderId,
      title: folder.name,
      share_token: bundleToken,
      token_expires_at: tokenExpiryISO(),
    })
    .select('*')
    .single()
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  const rows = toSend.map((t, i) => ({
    member_id: memberId,
    practitioner_id: userId,
    template_id: t.id,
    template_snapshot: snapshotFromTemplate(t as DocumentTemplate),
    status: 'sent' as const,
    share_token: newShareToken(),
    token_expires_at: tokenExpiryISO(),
    bundle_id: bundle.id,
    bundle_seq: i,
  }))
  const { error: insErr } = await supabase.from('member_documents').insert(rows)
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const signUrl = `${origin}/documents/sign/bundle/${bundleToken}`

  const emailed = await emailSigningLink(supabase, {
    practitionerId: userId,
    memberEmail: member.email,
    memberFirstName: member.first_name,
    templateTitle: folder.name,
    signUrl,
  })

  return NextResponse.json({ bundle, signUrl, emailed, count: rows.length })
}
