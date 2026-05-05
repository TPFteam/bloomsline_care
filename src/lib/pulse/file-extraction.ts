/**
 * Bloom Pulse — file extraction service
 *
 * Extracts text/summary from member files (PDFs, images, docs) via Claude.
 * Results cached forever in `file_extractions`. Re-runs only when the source
 * file changes (detected via source_hash on storage path + updated_at).
 */

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001'
const MAX_PARALLEL = 5 // Process 5 files concurrently

interface MemberFile {
  id: string
  member_id: string
  file_name: string
  file_type: string
  file_size: number | null
  storage_path: string
  description: string | null
  category: string
  created_at: string
  updated_at: string
}

export interface ExtractionResult {
  fileId: string
  fileName: string
  summary: string | null
  status: 'done' | 'cached' | 'failed' | 'skipped'
  error?: string
}

/**
 * Compute a stable hash of a file's source state.
 * If storage_path or updated_at change, we re-extract.
 */
function computeSourceHash(file: MemberFile): string {
  return `${file.storage_path}|${file.updated_at}|${file.file_size ?? 0}`
}

/**
 * Determine whether a file should be processed via vision (image / PDF)
 * or skipped (unsupported type).
 */
function isExtractable(fileType: string): 'vision' | 'skip' {
  const t = fileType.toLowerCase()
  if (t.startsWith('image/')) return 'vision'
  if (t === 'application/pdf') return 'vision'
  // DOCX/text files: skip for now (we said keep it simple)
  return 'skip'
}

/**
 * Build a public URL or signed URL for a file in Supabase storage.
 * Uses a signed URL (1 hour validity) so Claude can fetch the file.
 */
async function getSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('member-files')
    .createSignedUrl(storagePath, 3600)
  if (error || !data) {
    console.error('[file-extraction] signed URL error:', error)
    return null
  }
  return data.signedUrl
}

/**
 * Download a file as base64 for the Anthropic vision API.
 */
async function downloadAsBase64(url: string): Promise<{ data: string; mediaType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const base64 = Buffer.from(buf).toString('base64')
    const mediaType = res.headers.get('content-type') || 'application/octet-stream'
    return { data: base64, mediaType }
  } catch (err) {
    console.error('[file-extraction] download error:', err)
    return null
  }
}

/**
 * Extract text + summary from a single file via Claude vision.
 */
async function extractWithVision(
  anthropic: Anthropic,
  file: MemberFile,
  fileBase64: string,
  mediaType: string,
): Promise<{ summary: string; tokensUsed: number; model: string }> {
  // Note: Anthropic vision accepts images directly; PDFs use the document content type.
  const isPdf = mediaType === 'application/pdf'

  const systemPrompt = `You are a clinical documentation assistant. Extract and summarize the contents of this file for a mental health practitioner's review.

Output ONLY a single paragraph (max 200 words) describing:
- What kind of document this is
- Key clinical or contextual information visible
- Names, dates, diagnoses, medications, or other identifiable clinical data
- Anything a practitioner would want to know without re-reading the file

Be factual and concise. Do not editorialize. If the file is illegible or non-clinical (e.g. a personal photo), say so briefly.`

  const userContent: Anthropic.ContentBlockParam[] = [
    isPdf
      ? {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: fileBase64,
          },
        }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: fileBase64,
          },
        },
    {
      type: 'text',
      text: `File name: ${file.file_name}${file.description ? `\nDescription: ${file.description}` : ''}\nCategory: ${file.category}`,
    },
  ]

  const response = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const summary = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()

  return {
    summary,
    tokensUsed: response.usage.output_tokens,
    model: response.model,
  }
}

/**
 * Process one file: check cache, extract if needed, store result.
 */
async function processFile(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  file: MemberFile,
): Promise<ExtractionResult> {
  const newHash = computeSourceHash(file)
  const extractable = isExtractable(file.file_type)

  if (extractable === 'skip') {
    return { fileId: file.id, fileName: file.file_name, summary: null, status: 'skipped' }
  }

  // Check cache
  const { data: existing } = await supabase
    .from('file_extractions')
    .select('source_hash, extracted_summary, status')
    .eq('file_id', file.id)
    .maybeSingle()

  if (existing && existing.source_hash === newHash && existing.status === 'done') {
    return {
      fileId: file.id,
      fileName: file.file_name,
      summary: existing.extracted_summary,
      status: 'cached',
    }
  }

  // Mark as processing
  await supabase.from('file_extractions').upsert({
    file_id: file.id,
    member_id: file.member_id,
    source_hash: newHash,
    status: 'processing',
    updated_at: new Date().toISOString(),
  })

  try {
    const url = await getSignedUrl(supabase, file.storage_path)
    if (!url) throw new Error('Failed to generate signed URL for file')

    const downloaded = await downloadAsBase64(url)
    if (!downloaded) throw new Error('Failed to download file')

    const { summary, tokensUsed, model } = await extractWithVision(
      anthropic,
      file,
      downloaded.data,
      downloaded.mediaType,
    )

    await supabase.from('file_extractions').upsert({
      file_id: file.id,
      member_id: file.member_id,
      source_hash: newHash,
      extracted_summary: summary,
      status: 'done',
      model_used: model,
      tokens_used: tokensUsed,
      extracted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return { fileId: file.id, fileName: file.file_name, summary, status: 'done' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[file-extraction] failed for file', file.id, msg)

    await supabase.from('file_extractions').upsert({
      file_id: file.id,
      member_id: file.member_id,
      source_hash: newHash,
      status: 'failed',
      error_message: msg,
      updated_at: new Date().toISOString(),
    })

    return { fileId: file.id, fileName: file.file_name, summary: null, status: 'failed', error: msg }
  }
}

/**
 * Process all files for a member, with concurrency control.
 */
export async function extractAllMemberFiles(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  memberId: string,
): Promise<ExtractionResult[]> {
  const { data: files } = await supabase
    .from('member_files')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: true })

  if (!files || files.length === 0) return []

  const results: ExtractionResult[] = []
  const queue = [...(files as MemberFile[])]

  // Process in parallel batches of MAX_PARALLEL
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_PARALLEL)
    const batchResults = await Promise.all(
      batch.map((f) => processFile(supabase, anthropic, f))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Format extraction results for the Pulse synthesis prompt.
 */
export function formatExtractionsForPrompt(results: ExtractionResult[]): string {
  const usable = results.filter((r) => r.summary && r.status !== 'failed')
  if (usable.length === 0) return ''

  const lines = usable.map(
    (r) => `### ${r.fileName}\n${r.summary}`
  )
  return `## Patient Files (extracted summaries)\n\n${lines.join('\n\n')}`
}
