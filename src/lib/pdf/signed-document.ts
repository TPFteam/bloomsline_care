// Builds the final, flattened signed PDF for a member document.
//
// Two input shapes (kept on our own infra — no third-party e-sign):
//   - upload  : the practitioner's original PDF bytes → we append a signature
//               page at the end.
//   - authored: lightweight rich-text blocks → we render them to pages, then
//               append the same signature page.
//
// The signature page carries the legal trail: consent statement, the drawn
// signature image, signer name + relationship, timestamp and IP. pdf-lib runs
// fine server-side, so this is called from the signing API route.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { DocumentBlock, SignerRelationship } from '@/types/documents'

export interface SignedPdfInput {
  source: 'upload' | 'authored'
  /** Original PDF bytes when source = 'upload'. */
  uploadBytes?: Uint8Array | null
  /** Authored content when source = 'authored'. */
  blocks?: DocumentBlock[] | null
  title: string
  signerName: string
  signerRelationship: SignerRelationship
  /** Decoded PNG bytes of the drawn signature. */
  signaturePng: Uint8Array
  signedAt: string // ISO
  ip?: string | null
  locale?: string
}

const PAGE = { width: 595.28, height: 841.89 } // A4 in points
const MARGIN = 56
const LINE = 16

function t(locale: string | undefined, en: string, fr: string): string {
  return locale === 'fr' ? fr : en
}

/** Word-wrap a string to a max width for the given font/size. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Render authored blocks into one or more pages. */
function renderBlocks(pdf: PDFDocument, title: string, blocks: DocumentBlock[], font: PDFFont, bold: PDFFont) {
  let page = pdf.addPage([PAGE.width, PAGE.height])
  let y = PAGE.height - MARGIN
  const maxWidth = PAGE.width - MARGIN * 2

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE.width, PAGE.height])
      y = PAGE.height - MARGIN
    }
  }

  const drawLines = (lines: string[], f: PDFFont, size: number, gap: number) => {
    for (const ln of lines) {
      newPageIfNeeded(gap)
      page.drawText(ln, { x: MARGIN, y, size, font: f, color: rgb(0.1, 0.1, 0.1) })
      y -= gap
    }
  }

  // Title
  drawLines(wrap(title, bold, 18, maxWidth), bold, 18, 24)
  y -= 8

  for (const block of blocks) {
    if (block.type === 'heading') {
      y -= 6
      drawLines(wrap(block.text, bold, 13, maxWidth), bold, 13, 18)
    } else if (block.type === 'paragraph') {
      drawLines(wrap(block.text, font, 11, maxWidth), font, 11, LINE)
      y -= 6
    } else if (block.type === 'list') {
      for (const item of block.items) {
        drawLines(wrap(`•  ${item}`, font, 11, maxWidth), font, 11, LINE)
      }
      y -= 6
    } else if (block.type === 'divider') {
      newPageIfNeeded(12)
      page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: PAGE.width - MARGIN, y: y - 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
      y -= 16
    }
  }
}

/** Append the signature / consent page with the audit trail. */
async function appendSignaturePage(pdf: PDFDocument, input: SignedPdfInput, font: PDFFont, bold: PDFFont) {
  const page: PDFPage = pdf.addPage([PAGE.width, PAGE.height])
  const maxWidth = PAGE.width - MARGIN * 2
  let y = PAGE.height - MARGIN
  const locale = input.locale

  page.drawText(t(locale, 'Signature', 'Signature'), { x: MARGIN, y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.1) })
  y -= 32

  const statement = input.signerRelationship === 'guardian'
    ? t(locale,
        'As the parent / legal guardian, I confirm I have read and agree to this document on behalf of the patient.',
        'En tant que parent / représentant légal, je confirme avoir lu et accepté ce document au nom du patient.')
    : t(locale,
        'I confirm that I have read and agree to this document.',
        'Je confirme avoir lu et accepté ce document.')
  for (const ln of wrap(statement, font, 11, maxWidth)) {
    page.drawText(ln, { x: MARGIN, y, size: 11, font, color: rgb(0.25, 0.25, 0.25) })
    y -= LINE
  }
  y -= 16

  // Signature image
  try {
    const png = await pdf.embedPng(input.signaturePng)
    const dims = png.scaleToFit(220, 90)
    page.drawImage(png, { x: MARGIN, y: y - dims.height, width: dims.width, height: dims.height })
    page.drawLine({ start: { x: MARGIN, y: y - dims.height - 6 }, end: { x: MARGIN + 240, y: y - dims.height - 6 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
    y -= dims.height + 24
  } catch {
    y -= 24
  }

  const when = new Date(input.signedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'long', timeStyle: 'short',
  })
  const rows: Array<[string, string]> = [
    [t(locale, 'Signed by', 'Signé par'), input.signerName],
    [t(locale, 'Capacity', 'Qualité'), input.signerRelationship === 'guardian' ? t(locale, 'Parent / guardian', 'Parent / tuteur') : t(locale, 'Patient', 'Patient')],
    [t(locale, 'Date', 'Date'), when],
  ]
  if (input.ip) rows.push(['IP', input.ip])

  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: MARGIN, y, size: 10, font: bold, color: rgb(0.35, 0.35, 0.35) })
    page.drawText(value, { x: MARGIN + 90, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) })
    y -= LINE
  }
}

/** Build the flattened signed PDF and return its bytes. */
export async function buildSignedPdf(input: SignedPdfInput): Promise<Uint8Array> {
  let pdf: PDFDocument
  if (input.source === 'upload' && input.uploadBytes && input.uploadBytes.length > 0) {
    pdf = await PDFDocument.load(input.uploadBytes)
  } else {
    pdf = await PDFDocument.create()
  }
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  if (input.source === 'authored') {
    renderBlocks(pdf, input.title, input.blocks || [], font, bold)
  }
  await appendSignaturePage(pdf, input, font, bold)
  return await pdf.save()
}
