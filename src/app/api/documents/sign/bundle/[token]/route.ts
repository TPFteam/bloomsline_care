/**
 * GET /api/documents/sign/bundle/[token]
 *
 * Public (no auth) — resolves a document bundle by its share token and returns
 * the ordered documents the patient must sign, each with its OWN signing token
 * so the client can submit them one by one through the existing per-document
 * signing endpoint (POST /api/documents/sign/[docToken]).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { substituteDocVariables } from '@/lib/services/documents'
import type { DocumentTemplateSnapshot } from '@/types/documents'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: bundle, error } = await admin
    .from('document_bundles')
    .select('*')
    .eq('share_token', token)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (new Date(bundle.token_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'expired' }, { status: 410 })
  }

  const { data: docs } = await admin
    .from('member_documents')
    .select('*')
    .eq('bundle_id', bundle.id)
    .order('bundle_seq', { ascending: true })

  // Patient (for variable fill-in + guardian handling) and UI language.
  const { data: member } = await admin
    .from('members')
    .select('first_name, last_name, email, is_minor')
    .eq('id', bundle.member_id)
    .maybeSingle()
  const memberName = member ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() : ''
  const { data: prof } = await admin
    .from('users')
    .select('preferred_language')
    .eq('id', bundle.practitioner_id)
    .maybeSingle()

  // Mark still-'sent' docs as viewed on first open of the bundle.
  const freshIds = (docs || []).filter((d) => d.status === 'sent').map((d) => d.id)
  if (freshIds.length > 0) {
    await admin.from('member_documents')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .in('id', freshIds)
  }

  const items = await Promise.all((docs || []).map(async (d) => {
    const snap = (d.template_snapshot || {}) as DocumentTemplateSnapshot
    let originalUrl: string | null = null
    if (snap.source === 'upload' && snap.file_path) {
      const { data: signed } = await admin.storage.from('member-files').createSignedUrl(snap.file_path, 3600)
      originalUrl = signed?.signedUrl ?? null
    }
    return {
      token: d.share_token,
      title: snap.title,
      source: snap.source,
      content: substituteDocVariables(snap.content, { name: memberName, email: member?.email }),
      originalUrl,
      requireSignature: snap.require_signature !== false,
      allowGuardian: snap.allow_guardian !== false,
      status: d.status === 'sent' ? 'viewed' : d.status,
    }
  }))

  const total = items.length
  const signedCount = items.filter((i) => i.status === 'signed').length

  return NextResponse.json({
    title: bundle.title,
    locale: prof?.preferred_language || 'fr',
    isMinor: member?.is_minor === true,
    memberName: memberName || null,
    total,
    signedCount,
    documents: items,
  })
}
