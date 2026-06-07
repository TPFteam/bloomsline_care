/**
 * Per-document actions on a member's signable document.
 *
 * DELETE /api/members/[id]/documents/[docId]  → "unsend" — remove a document
 *        that hasn't been signed yet (undo a send).
 * POST   /api/members/[id]/documents/[docId]  → "remind" — re-email the patient
 *        the same signing link (no new row, same token).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { emailSigningLink } from '@/lib/services/documents'
import type { DocumentTemplateSnapshot } from '@/types/documents'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id: memberId, docId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only allow undo while it hasn't been signed.
  const { data: doc } = await supabase
    .from('member_documents')
    .select('id, status')
    .eq('id', docId)
    .eq('member_id', memberId)
    .eq('practitioner_id', user.id)
    .maybeSingle()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.status === 'signed') {
    return NextResponse.json({ error: 'Cannot unsend a signed document' }, { status: 409 })
  }

  const { error } = await supabase
    .from('member_documents')
    .delete()
    .eq('id', docId)
    .eq('practitioner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id: memberId, docId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: doc } = await supabase
    .from('member_documents')
    .select('*')
    .eq('id', docId)
    .eq('member_id', memberId)
    .eq('practitioner_id', user.id)
    .maybeSingle()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.status === 'signed') {
    return NextResponse.json({ error: 'Already signed' }, { status: 409 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('first_name, email')
    .eq('id', memberId)
    .maybeSingle()
  if (!member?.email) {
    return NextResponse.json({ error: 'no_email' }, { status: 422 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const signUrl = `${origin}/documents/sign/${doc.share_token}`
  const snap = (doc.template_snapshot || {}) as DocumentTemplateSnapshot

  const emailed = await emailSigningLink(supabase, {
    practitionerId: user.id,
    memberEmail: member.email,
    memberFirstName: member.first_name,
    templateTitle: snap.title || '',
    signUrl,
  })

  return NextResponse.json({ ok: true, emailed })
}
