'use client'

// Public, token-based signing page for a document BUNDLE (a folder sent as one
// link). Shows a progress bar and walks the patient through each document one
// at a time, reusing the per-document signing endpoint. A final confirmation
// appears once every document is signed.

import { useEffect, useState, use } from 'react'
import { FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { DocumentBlock } from '@/types/documents'
import { DocumentSignForm } from '@/components/documents/DocumentSignForm'

interface BundleDoc {
  token: string
  title: string
  source: 'upload' | 'authored'
  content: DocumentBlock[] | null
  originalUrl: string | null
  requireSignature: boolean
  allowGuardian: boolean
  status: string
}

interface Bundle {
  title: string
  locale: string
  isMinor: boolean
  memberName: string | null
  total: number
  signedCount: number
  documents: BundleDoc[]
}

function tr(locale: string, en: string, fr: string) { return locale === 'fr' ? fr : en }

export default function SignBundlePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [docs, setDocs] = useState<BundleDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const locale = bundle?.locale || 'fr'

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/documents/sign/bundle/${token}`)
        if (res.status === 410) { setError('expired'); return }
        if (!res.ok) { setError('notfound'); return }
        const data = (await res.json()) as Bundle
        setBundle(data)
        setDocs(data.documents || [])
      } catch {
        setError('notfound')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const total = docs.length
  const signedCount = docs.filter((d) => d.status === 'signed').length
  const currentIndex = docs.findIndex((d) => d.status !== 'signed')
  const current = currentIndex >= 0 ? docs[currentIndex] : null
  const allDone = total > 0 && signedCount === total

  const handleSubmit = async ({ signerName, relationship, signatureImage }: { signerName: string; relationship: 'self' | 'guardian'; signatureImage: string }) => {
    if (!current) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/documents/sign/${current.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName, signerRelationship: relationship, signatureImage }),
      })
      if (!res.ok) throw new Error('failed')
      setDocs((prev) => prev.map((d) => d.token === current.token ? { ...d, status: 'signed' } : d))
    } catch {
      setSubmitError(tr(locale, 'Something went wrong. Please try again.', 'Une erreur est survenue. Veuillez réessayer.'))
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
              : tr(locale, 'These documents could not be found.', 'Ces documents sont introuvables.')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tr(locale, 'Please ask your practitioner to resend it.', 'Veuillez demander à votre praticien de le renvoyer.')}
          </p>
        </div>
      </div>
    )
  }

  if (allDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">
            {tr(locale, 'All documents signed — thank you.', 'Tous les documents sont signés — merci.')}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tr(locale, `You've completed all ${total} documents.`, `Vous avez complété les ${total} documents.`)}
          </p>
        </div>
      </div>
    )
  }

  if (!bundle || !current) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-4"
      >
        {/* Header + progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{bundle.title}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{tr(locale, `Document ${signedCount + 1} of ${total}`, `Document ${signedCount + 1} sur ${total}`)}</span>
            <span>{signedCount}/{total} {tr(locale, 'signed', 'signés')}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${total ? (signedCount / total) * 100 : 0}%` }} />
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {docs.map((d, i) => (
              <div
                key={d.token}
                className={`h-1.5 flex-1 rounded-full ${d.status === 'signed' ? 'bg-teal-500' : i === currentIndex ? 'bg-teal-300' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <DocumentSignForm
          key={current.token}
          doc={current}
          locale={locale}
          isMinor={bundle.isMinor}
          memberName={bundle.memberName}
          submitting={submitting}
          error={submitError}
          submitLabel={
            signedCount + 1 < total
              ? tr(locale, 'Sign & continue', 'Signer et continuer')
              : tr(locale, 'Sign & finish', 'Signer et terminer')
          }
          onSubmit={handleSubmit}
        />
      </motion.div>
    </div>
  )
}
