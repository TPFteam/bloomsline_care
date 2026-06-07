// Signable documents (consent / intake forms).
// See migration 20260607_signable_documents.sql and the project plan
// (signable-documents) for the full feature design.

export type DocumentType = 'consent' | 'intake' | 'other'
export type DocumentSource = 'upload' | 'authored'
export type MemberDocumentStatus = 'sent' | 'viewed' | 'signed' | 'declined'
export type SignerRelationship = 'self' | 'guardian'

/** Practice-level reusable document a practitioner authors once. */
export interface DocumentTemplate {
  id: string
  practitioner_id: string
  title: string
  type: DocumentType
  source: DocumentSource
  /** Storage path in the `member-files` bucket when source = 'upload'. */
  file_path: string | null
  /** Rich-text blocks when source = 'authored'. */
  content: DocumentBlock[] | null
  locale: string
  require_signature: boolean
  required_before_session: boolean
  allow_guardian: boolean
  /** Pre-checked in the add-patient modal so it sends on patient creation. */
  auto_send: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Frozen copy of the template captured at send time (immutability). */
export interface DocumentTemplateSnapshot {
  title: string
  type: DocumentType
  source: DocumentSource
  file_path: string | null
  content: DocumentBlock[] | null
  locale: string
  require_signature: boolean
  allow_guardian: boolean
}

/** A per-patient instance of a document sent for signature. */
export interface MemberDocument {
  id: string
  member_id: string
  practitioner_id: string
  template_id: string | null
  template_snapshot: DocumentTemplateSnapshot
  status: MemberDocumentStatus
  share_token: string
  token_expires_at: string
  sent_at: string
  viewed_at: string | null
  signed_at: string | null
  signer_name: string | null
  signer_relationship: SignerRelationship
  signature_path: string | null
  signed_pdf_path: string | null
  audit: DocumentAudit
  created_at: string
  updated_at: string
}

export interface DocumentAudit {
  ip?: string | null
  user_agent?: string | null
  events?: Array<{ at: string; event: string; detail?: string }>
}

/**
 * Lightweight rich-text block for authored documents. Kept intentionally
 * minimal (prose-focused) — consent/intake docs are mostly headings and
 * paragraphs, not interactive worksheet blocks. The signature block is
 * appended automatically at sign time, not authored here.
 */
export type DocumentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'divider' }

/** 30-day signing link, per the locked product decision. */
export const DOCUMENT_TOKEN_TTL_DAYS = 30
