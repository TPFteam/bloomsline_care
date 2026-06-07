'use client'

// Public, token-based signing page (no auth). Mirrors the /shared/[token]
// pattern. Renders the document (uploaded PDF or authored blocks), captures a
// drawn signature + consent, and submits to the shared signing API.

import { useEffect, useRef, useState, use } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { FileText, Loader2, AlertCircle, CheckCircle2, Download, Eraser } from 'lucide-react'
import { motion } from 'framer-motion'
import type { DocumentBlock } from '@/types/documents'

interface SignDoc {
  status: string
  title: string
  source: 'upload' | 'authored'
  content: DocumentBlock[] | null
  locale: string
  requireSignature: boolean
  allowGuardian: boolean
  isMinor: boolean
  memberName: string | null
  originalUrl: string | null
  signedPdfUrl: string | null
  alreadySigned: boolean
}

function tr(locale: string, en: string, fr: string) {
  return locale === 'fr' ? fr : en
}

function AuthoredBlocks({ blocks }: { blocks: DocumentBlock[] }) {
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

export default function SignDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [doc, setDoc] = useState<SignDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [agreed, setAgreed] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [relationship, setRelationship] = useState<'self' | 'guardian'>('self')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const sigRef = useRef<SignatureCanvas | null>(null)

  const locale = doc?.locale || 'fr'

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/documents/sign/${token}`)
        if (res.status === 410) { setError('expired'); return }
        if (!res.ok) { setError('notfound'); return }
        const data = (await res.json()) as SignDoc
        setDoc(data)
        if (data.isMinor && data.allowGuardian) setRelationship('guardian')
        if (data.memberName && !(data.isMinor && data.allowGuardian)) setSignerName(data.memberName)
      } catch {
        setError('notfound')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const handleSubmit = async () => {
    if (!doc) return
    if (!agreed) return
    if (!signerName.trim()) return
    if (!sigRef.current || sigRef.current.isEmpty()) return
    setSubmitting(true)
    try {
      const signatureImage = sigRef.current.getCanvas().toDataURL('image/png')
      const res = await fetch(`/api/documents/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName: signerName.trim(), signerRelationship: relationship, signatureImage }),
      })
      if (!res.ok) throw new Error('failed')
      setDone(true)
    } catch {
      setError('submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error === 'expired' || error === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">
            {error === 'expired'
              ? tr(locale, 'This signing link has expired.', 'Ce lien de signature a expiré.')
              : tr(locale, 'This document could not be found.', 'Ce document est introuvable.')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tr(locale, 'Please ask your practitioner to resend it.', 'Veuillez demander à votre praticien de le renvoyer.')}
          </p>
        </div>
      </div>
    )
  }

  // Already signed (or just submitted) → confirmation + download.
  if (done || doc?.alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">
            {tr(locale, 'Thank you — your document is signed.', 'Merci — votre document est signé.')}
          </p>
          {doc?.signedPdfUrl && (
            <a
              href={doc.signedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              {tr(locale, 'Download a copy', 'Télécharger une copie')}
            </a>
          )}
        </div>
      </div>
    )
  }

  if (!doc) return null
  const guardianMode = doc.isMinor && doc.allowGuardian

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-4"
      >
        <div className="flex items-center gap-2 text-gray-500">
          <FileText className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {tr(locale, 'Document to sign', 'Document à signer')}
          </span>
        </div>

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
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
              >
                <Eraser className="w-3.5 h-3.5" />
                {tr(locale, 'Clear', 'Effacer')}
              </button>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <SignatureCanvas
                ref={sigRef}
                penColor="#0f172a"
                canvasProps={{ className: 'w-full h-40' }}
              />
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

          {error === 'submit' && (
            <p className="text-xs text-red-600">{tr(locale, 'Something went wrong. Please try again.', 'Une erreur est survenue. Veuillez réessayer.')}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !agreed || !signerName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {tr(locale, 'Sign & submit', 'Signer et envoyer')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
