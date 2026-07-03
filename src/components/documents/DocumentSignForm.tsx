'use client'

// The document body + signature panel used on the public signing pages.
// Self-contained (name / consent / drawn signature); the parent supplies the
// document and handles submission. Give it a `key` per document so it remounts
// with a fresh canvas when moving through a bundle.

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Loader2, Eraser } from 'lucide-react'
import type { DocumentBlock } from '@/types/documents'

function tr(locale: string, en: string, fr: string) { return locale === 'fr' ? fr : en }

export function AuthoredBlocks({ blocks }: { blocks: DocumentBlock[] }) {
  return (
    <div className="space-y-3 text-gray-800">
      {blocks.map((b, i) => {
        if (b.type === 'heading') return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4">{b.text}</h3>
        if (b.type === 'paragraph') return <p key={i} className="text-sm leading-relaxed">{b.text}</p>
        if (b.type === 'list') return (
          <ul key={i} className="list-disc pl-5 space-y-1 text-sm">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        )
        if (b.type === 'divider') return <hr key={i} className="border-gray-100 my-2" />
        return null
      })}
    </div>
  )
}

export interface SignFormDoc {
  title: string
  source: 'upload' | 'authored'
  content: DocumentBlock[] | null
  originalUrl: string | null
  allowGuardian: boolean
}

export function DocumentSignForm({
  doc, locale, isMinor, memberName, submitting, error, submitLabel, onSubmit,
}: {
  doc: SignFormDoc
  locale: string
  isMinor: boolean
  memberName: string | null
  submitting: boolean
  error?: string | null
  submitLabel: string
  onSubmit: (args: { signerName: string; relationship: 'self' | 'guardian'; signatureImage: string }) => void
}) {
  const guardianMode = isMinor && doc.allowGuardian
  const [agreed, setAgreed] = useState(false)
  const [signerName, setSignerName] = useState(guardianMode ? '' : (memberName || ''))
  const [relationship] = useState<'self' | 'guardian'>(guardianMode ? 'guardian' : 'self')
  const sigRef = useRef<SignatureCanvas | null>(null)

  const submit = () => {
    if (!agreed || !signerName.trim()) return
    if (!sigRef.current || sigRef.current.isEmpty()) return
    const signatureImage = sigRef.current.getCanvas().toDataURL('image/png')
    onSubmit({ signerName: signerName.trim(), relationship, signatureImage })
  }

  return (
    <>
      {/* Document body */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{doc.title}</h1>
        {doc.source === 'upload' && doc.originalUrl ? (
          <iframe src={doc.originalUrl} className="w-full h-[60vh] rounded-lg border border-gray-100" title={doc.title} />
        ) : doc.content ? (
          <AuthoredBlocks blocks={doc.content} />
        ) : (
          <p className="text-sm text-gray-400">{tr(locale, 'No content.', 'Aucun contenu.')}</p>
        )}
      </div>

      {/* Signature panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {guardianMode && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
            {tr(locale, 'This patient is a minor — please sign as their parent or legal guardian.', 'Ce patient est mineur — veuillez signer en tant que parent ou représentant légal.')}
          </div>
        )}

        <div>
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {guardianMode ? tr(locale, 'Your full name (parent / guardian)', 'Votre nom complet (parent / tuteur)') : tr(locale, 'Your full name', 'Votre nom complet')}
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            placeholder={tr(locale, 'Full name', 'Nom complet')}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              {tr(locale, 'Signature', 'Signature')}
            </label>
            <button type="button" onClick={() => sigRef.current?.clear()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
              <Eraser className="w-3.5 h-3.5" />
              {tr(locale, 'Clear', 'Effacer')}
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
            <SignatureCanvas ref={sigRef} penColor="#0f172a" canvasProps={{ className: 'w-full h-40' }} />
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-600">
            {guardianMode
              ? tr(locale, 'I have read and agree to this document on behalf of the patient.', 'J’ai lu et j’accepte ce document au nom du patient.')
              : tr(locale, 'I have read and agree to this document.', 'J’ai lu et j’accepte ce document.')}
          </span>
        </label>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={submitting || !agreed || !signerName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </>
  )
}
