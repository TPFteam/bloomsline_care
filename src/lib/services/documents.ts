// Server-side helpers for the signable-documents feature. Used by the API
// routes (template CRUD, send, token signing). DB writes that must bypass RLS
// (token signing) use the admin/service-role client passed in by the caller.

import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type {
  DocumentTemplate,
  DocumentTemplateSnapshot,
} from '@/types/documents'
import { DOCUMENT_TOKEN_TTL_DAYS } from '@/types/documents'

/** URL-safe, high-entropy share token for a signing link. */
export function newShareToken(): string {
  return (randomUUID() + randomUUID()).replace(/-/g, '')
}

/** Expiry timestamp for a freshly minted signing token (30 days). */
export function tokenExpiryISO(from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + DOCUMENT_TOKEN_TTL_DAYS)
  return d.toISOString()
}

/** Freeze the parts of a template that define what the patient signs. */
export function snapshotFromTemplate(t: DocumentTemplate): DocumentTemplateSnapshot {
  return {
    title: t.title,
    type: t.type,
    source: t.source,
    file_path: t.file_path,
    content: t.content,
    locale: t.locale,
    require_signature: t.require_signature,
    allow_guardian: t.allow_guardian,
  }
}

/**
 * Persist the signed artifacts for a member document:
 *   - raw signature PNG → member-files bucket
 *   - flattened signed PDF → member-files bucket
 *   - a member_files row (category 'consent') so it appears in the Files tab
 * Returns the storage paths to record on `member_documents`.
 */
export async function storeSignedArtifacts(
  admin: SupabaseClient,
  args: {
    practitionerId: string
    memberId: string
    docId: string
    title: string
    pdfBytes: Uint8Array
    signaturePng: Uint8Array
  },
): Promise<{ signedPdfPath: string; signaturePath: string }> {
  const base = `${args.practitionerId}/${args.memberId}/documents/${args.docId}`
  const signaturePath = `${base}/signature.png`
  const signedPdfPath = `${base}/signed.pdf`

  const sigUp = await admin.storage
    .from('member-files')
    .upload(signaturePath, args.signaturePng, { contentType: 'image/png', upsert: true })
  if (sigUp.error) throw sigUp.error

  const pdfUp = await admin.storage
    .from('member-files')
    .upload(signedPdfPath, args.pdfBytes, { contentType: 'application/pdf', upsert: true })
  if (pdfUp.error) throw pdfUp.error

  // Surface the signed PDF in the member's Files tab (downloadable by the
  // practitioner). Best-effort: a failure here shouldn't fail the signing.
  await admin.from('member_files').insert({
    member_id: args.memberId,
    practitioner_id: args.practitionerId,
    file_name: args.title || 'Signed document',
    file_type: 'application/pdf',
    storage_path: signedPdfPath,
    category: 'consent',
    is_folder: false,
  })

  return { signedPdfPath, signaturePath }
}

/** Decode a data-URL or base64 PNG signature into raw bytes. */
export function decodeSignaturePng(input: string): Uint8Array {
  const base64 = input.includes(',') ? input.split(',')[1] : input
  return new Uint8Array(Buffer.from(base64, 'base64'))
}
