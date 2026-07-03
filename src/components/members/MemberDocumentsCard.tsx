'use client'

// Per-member documents: send a template for signature and track status
// (Sent → Viewed → Signed). Signed PDFs also appear in the Files list below
// (they're written to member-files on signing). Lives at the top of the
// member's Files tab.

import { useEffect, useState } from 'react'
import { FileSignature, Send, Loader2, Copy, Check, Clock, Eye, CheckCircle2, X, Download, Bell, Trash2, Folder, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { DocumentTemplate, DocumentFolder, MemberDocument, DocumentBlock, DocumentTemplateSnapshot, DocumentSource } from '@/types/documents'

interface FolderPreviewDoc {
  id: string
  title: string
  source: DocumentSource
  blocks: DocumentBlock[]
  url: string | null
}

type MemberDocumentWithUrl = MemberDocument & {
  signedPdfUrl?: string | null
  signedPdfDownloadUrl?: string | null
  signatureUrl?: string | null
  bundleTitle?: string | null
  bundleToken?: string | null
}

type TemplateWithPreview = DocumentTemplate & { previewUrl?: string | null }

function fillVar(s: string, name: string, email: string): string {
  return s
    .replace(/\{\{\s*patient_name\s*\}\}/gi, name || '')
    .replace(/\{\{\s*patient_email\s*\}\}/gi, email || '')
}
function fillBlocks(blocks: DocumentBlock[] | null, name: string, email: string): DocumentBlock[] {
  if (!blocks) return []
  return blocks.map((b) => {
    if (b.type === 'heading' || b.type === 'paragraph') return { ...b, text: fillVar(b.text, name, email) }
    if (b.type === 'list') return { ...b, items: b.items.map((i) => fillVar(i, name, email)) }
    return b
  })
}

type Viewer =
  | { kind: 'pdf'; title: string; url: string }
  | { kind: 'authored'; title: string; blocks: DocumentBlock[]; signerName: string | null; signedAt: string | null; signatureUrl: string | null }
  | { kind: 'folder'; title: string; docs: FolderPreviewDoc[] }

function tr(locale: string, en: string, fr: string) { return locale === 'fr' ? fr : en }

function AuthoredBlocks({ blocks, locale }: { blocks: DocumentBlock[]; locale: string }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-sm text-gray-400">{tr(locale, 'No content.', 'Aucun contenu.')}</p>
  }
  return (
    <div className="space-y-3 text-gray-800">
      {blocks.map((b, i) => {
        if (b.type === 'heading') return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4">{b.text}</h3>
        if (b.type === 'paragraph') return <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">{b.text}</p>
        if (b.type === 'list') return <ul key={i} className="list-disc pl-5 space-y-1 text-sm">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
        if (b.type === 'divider') return <hr key={i} className="border-gray-100 my-2" />
        return null
      })}
    </div>
  )
}

export function MemberDocumentsCard({ memberId, locale, memberName = '', memberEmail = null }: { memberId: string; locale: string; memberName?: string; memberEmail?: string | null }) {
  const [docs, setDocs] = useState<MemberDocumentWithUrl[]>([])
  const [templates, setTemplates] = useState<TemplateWithPreview[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [sendOpen, setSendOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Viewer | null>(null)
  // Pre-send confirmation: preview the document (with this patient's data
  // filled in) before it actually goes out.
  const [confirmSend, setConfirmSend] = useState<Viewer | null>(null)
  // Which folder-preview documents are expanded in the confirm modal.
  const [expandedPreview, setExpandedPreview] = useState<Set<string>>(new Set())

  const openView = (d: MemberDocumentWithUrl) => {
    const snap = (d.template_snapshot || {}) as DocumentTemplateSnapshot
    const title = snap.title || tr(locale, 'Document', 'Document')
    if (snap.source === 'authored') {
      setViewing({ kind: 'authored', title, blocks: snap.content || [], signerName: d.signer_name, signedAt: d.signed_at, signatureUrl: d.signatureUrl || null })
    } else if (d.signedPdfUrl) {
      setViewing({ kind: 'pdf', title, url: d.signedPdfUrl })
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [dRes, tRes, fRes] = await Promise.all([
        fetch(`/api/members/${memberId}/documents`),
        fetch('/api/documents/templates'),
        fetch('/api/documents/folders'),
      ])
      const dData = await dRes.json()
      const tData = await tRes.json()
      const fData = await fRes.json().catch(() => ({}))
      if (dRes.ok) setDocs(dData.documents || [])
      if (tRes.ok) setTemplates((tData.templates || []).filter((t: DocumentTemplate) => t.is_active))
      if (fRes.ok) setFolders(fData.folders || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [memberId])

  const isFolderSel = selectedTemplate.startsWith('folder:')
  const selectedFolderId = isFolderSel ? selectedTemplate.slice(7) : null

  const handleSend = async () => {
    if (!selectedTemplate) return
    setSending(true)
    try {
      const res = await fetch(`/api/members/${memberId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isFolderSel ? { folderId: selectedFolderId } : { templateId: selectedTemplate }),
      })
      const data = await res.json()
      if (res.status === 409 && data.error === 'already_sent') {
        toast.error(tr(locale, 'Already sent — use Remind on the existing one.', 'Déjà envoyé — utilisez Relancer sur l’existant.'))
        return
      }
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (isFolderSel && data.allSigned) {
        toast.info(tr(locale, 'This patient already signed every document in the folder.', 'Ce patient a déjà signé tous les documents du dossier.'))
      } else if (isFolderSel) {
        toast.success(tr(locale, `Sent ${data.count} documents`, `${data.count} documents envoyés`))
      } else {
        toast.success(tr(locale, 'Document sent', 'Document envoyé'))
      }
      setSendOpen(false)
      setSelectedTemplate('')
      setConfirmSend(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSending(false)
    }
  }

  // Build the "what the patient will get" preview (variables filled in) and
  // open the confirmation modal instead of sending immediately.
  const handlePreviewSend = () => {
    if (isFolderSel) {
      const f = folders.find(x => x.id === selectedFolderId)
      const docs: FolderPreviewDoc[] = templates
        .filter(t => t.folder_id === selectedFolderId)
        .map(t => ({
          id: t.id,
          title: t.title,
          source: t.source,
          blocks: t.source === 'authored' ? fillBlocks(t.content, memberName, memberEmail || '') : [],
          url: t.source === 'upload' ? (t.previewUrl || null) : null,
        }))
      setExpandedPreview(new Set())
      setConfirmSend({ kind: 'folder', title: f?.name || tr(locale, 'Folder', 'Dossier'), docs })
      return
    }
    const t = templates.find(x => x.id === selectedTemplate)
    if (!t) return
    if (t.source === 'authored') {
      setConfirmSend({ kind: 'authored', title: t.title, blocks: fillBlocks(t.content, memberName, memberEmail || ''), signerName: null, signedAt: null, signatureUrl: null })
    } else {
      setConfirmSend({ kind: 'pdf', title: t.title, url: t.previewUrl || '' })
    }
  }

  const handleRemind = async (d: MemberDocumentWithUrl) => {
    const res = await fetch(`/api/members/${memberId}/documents/${d.id}`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(data.emailed
        ? tr(locale, 'Reminder sent', 'Rappel envoyé')
        : tr(locale, 'No email on file — copy the link instead.', 'Pas d’email — copiez le lien.'))
    } else {
      toast.error(tr(locale, 'Could not send reminder', 'Échec du rappel'))
    }
  }

  const handleUnsend = async (d: MemberDocumentWithUrl) => {
    const res = await fetch(`/api/members/${memberId}/documents/${d.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDocs(prev => prev.filter(x => x.id !== d.id))
      toast.success(tr(locale, 'Unsent', 'Annulé'))
    } else {
      toast.error(tr(locale, 'Could not unsend', 'Impossible d’annuler'))
    }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/documents/sign/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 1500)
  }

  const statusChip = (status: string) => {
    const map: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
      sent: { label: tr(locale, 'Sent', 'Envoyé'), cls: 'bg-blue-50 text-blue-600', Icon: Clock },
      viewed: { label: tr(locale, 'Viewed', 'Consulté'), cls: 'bg-amber-50 text-amber-600', Icon: Eye },
      signed: { label: tr(locale, 'Signed', 'Signé'), cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
      declined: { label: tr(locale, 'Declined', 'Refusé'), cls: 'bg-gray-100 text-gray-500', Icon: X },
    }
    const s = map[status] || map.sent
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
        <s.Icon className="w-3 h-3" />{s.label}
      </span>
    )
  }

  // Hide templates that are already out for signature (sent/viewed) so the
  // same document can't be sent twice — use Remind on the existing row instead.
  const pendingTemplateIds = new Set(
    docs.filter(d => d.status === 'sent' || d.status === 'viewed').map(d => d.template_id).filter(Boolean),
  )
  const availableTemplates = templates.filter(t => !pendingTemplateIds.has(t.id))
  // Folders that hold at least one active document can be sent as a bundle.
  const folderCount = (fid: string) => templates.filter(t => t.folder_id === fid).length
  const availableFolders = folders.filter(f => folderCount(f.id) > 0)

  const copyBundleLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/documents/sign/bundle/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 1500)
  }

  // Group folder-sent documents under their bundle; the rest render on their own.
  const bundleOrder: string[] = []
  const groups = new Map<string, MemberDocumentWithUrl[]>()
  const singles: MemberDocumentWithUrl[] = []
  for (const d of docs) {
    if (d.bundle_id) {
      if (!groups.has(d.bundle_id)) { groups.set(d.bundle_id, []); bundleOrder.push(d.bundle_id) }
      groups.get(d.bundle_id)!.push(d)
    } else singles.push(d)
  }

  const renderDocRow = (d: MemberDocumentWithUrl) => {
    const title = (d.template_snapshot as { title?: string })?.title || tr(locale, 'Document', 'Document')
    return (
      <div key={d.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{title}</p>
          <p className="text-[11px] text-gray-400">
            {d.status === 'signed' && d.signed_at
              ? `${tr(locale, 'Signed', 'Signé')} ${new Date(d.signed_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}`
              : `${tr(locale, 'Sent', 'Envoyé')} ${new Date(d.sent_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>
        {statusChip(d.status)}
        {d.status === 'signed' ? (
          <div className="flex items-center gap-1">
            {d.signedPdfUrl && (
              <button onClick={() => openView(d)}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100">
                <Eye className="w-3.5 h-3.5" />
                {tr(locale, 'View', 'Voir')}
              </button>
            )}
            {d.signedPdfDownloadUrl && (
              <a href={d.signedPdfDownloadUrl}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100">
                <Download className="w-3.5 h-3.5" />
                {tr(locale, 'Download', 'Télécharger')}
              </a>
            )}
          </div>
        ) : d.bundle_id ? (
          // Bundle docs share one link — no per-doc remind/copy/unsend here.
          <span className="text-[11px] text-gray-300 px-2">—</span>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={() => handleRemind(d)} title={tr(locale, 'Remind', 'Relancer')}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100">
              <Bell className="w-3.5 h-3.5" />
              {tr(locale, 'Remind', 'Relancer')}
            </button>
            <button onClick={() => copyLink(d.share_token)} title={tr(locale, 'Copy link', 'Copier le lien')}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100">
              {copied === d.share_token ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => handleUnsend(d)} title={tr(locale, 'Unsend', 'Annuler l’envoi')}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">{tr(locale, 'Documents to sign', 'Documents à signer')}</h3>
        </div>
        {!sendOpen && (
          <button
            onClick={() => setSendOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />{tr(locale, 'Send document', 'Envoyer un document')}
          </button>
        )}
      </div>

      {sendOpen && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">{tr(locale, 'Choose a document or folder…', 'Choisir un document ou dossier…')}</option>
            {availableFolders.length > 0 && (
              <optgroup label={tr(locale, 'Folders', 'Dossiers')}>
                {availableFolders.map(f => (
                  <option key={f.id} value={`folder:${f.id}`}>{f.name} ({folderCount(f.id)})</option>
                ))}
              </optgroup>
            )}
            <optgroup label={tr(locale, 'Documents', 'Documents')}>
              {availableTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </optgroup>
          </select>
          <button onClick={handlePreviewSend} disabled={!selectedTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg disabled:opacity-50">
            <Eye className="w-3.5 h-3.5" />
            {tr(locale, 'Preview & send', 'Aperçu et envoi')}
          </button>
          <button onClick={() => { setSendOpen(false); setSelectedTemplate('') }} className="p-2 text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {sendOpen && templates.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {tr(locale, 'No active templates — create one in Settings → Documents.', 'Aucun modèle actif — créez-en un dans Réglages → Documents.')}
        </p>
      )}
      {sendOpen && templates.length > 0 && availableTemplates.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">
          {tr(locale, 'All your documents are already sent to this patient.', 'Tous vos documents ont déjà été envoyés à ce patient.')}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
      ) : docs.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">{tr(locale, 'No documents sent yet.', 'Aucun document envoyé.')}</p>
      ) : (
        <div className="space-y-2">
          {bundleOrder.map(bid => {
            const group = groups.get(bid)!.slice().sort((a, b) => (a.bundle_seq ?? 0) - (b.bundle_seq ?? 0))
            const signedN = group.filter(d => d.status === 'signed').length
            const bundleTitle = group[0].bundleTitle || tr(locale, 'Folder', 'Dossier')
            const bundleToken = group[0].bundleToken
            const allSigned = signedN === group.length
            return (
              <div key={bid} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/70 border-b border-gray-100">
                  <Folder className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">{bundleTitle}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${allSigned ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                    {signedN}/{group.length} {tr(locale, 'signed', 'signés')}
                  </span>
                  {!allSigned && bundleToken && (
                    <button onClick={() => copyBundleLink(bundleToken)} title={tr(locale, 'Copy bundle link', 'Copier le lien du dossier')}
                      className="ml-auto flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100">
                      {copied === bundleToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {tr(locale, 'Copy link', 'Copier le lien')}
                    </button>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  {group.map(renderDocRow)}
                </div>
              </div>
            )
          })}
          {singles.map(renderDocRow)}
        </div>
      )}
    </div>

    {/* In-platform document viewer */}
    {viewing && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewing(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{viewing.title}</p>
            <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          {viewing.kind === 'pdf' ? (
            <iframe src={viewing.url} className="flex-1 w-full rounded-b-2xl" title={viewing.title} />
          ) : viewing.kind === 'authored' ? (
            <div className="flex-1 overflow-y-auto p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">{viewing.title}</h1>
              <AuthoredBlocks blocks={viewing.blocks} locale={locale} />
              <div className="mt-8 pt-4 border-t border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{tr(locale, 'Signature', 'Signature')}</p>
                {viewing.signatureUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewing.signatureUrl} alt="signature" className="h-20 object-contain" />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {viewing.signerName}
                  {viewing.signedAt && <> · {new Date(viewing.signedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'long', timeStyle: 'short' })}</>}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )}

    {/* Pre-send confirmation — preview the document (patient's data filled in)
        before it actually goes out. */}
    {confirmSend && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !sending && setConfirmSend(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate">{confirmSend.title}</p>
              <p className="text-[11px] text-gray-400">
                {tr(locale, 'Preview — this is what the patient will receive.', 'Aperçu — voici ce que le patient recevra.')}
              </p>
            </div>
            <button onClick={() => setConfirmSend(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          {confirmSend.kind === 'pdf' ? (
            confirmSend.url
              ? <iframe src={confirmSend.url} className="flex-1 w-full" title={confirmSend.title} />
              : <div className="flex-1 flex items-center justify-center text-sm text-gray-400">{tr(locale, 'No preview available.', 'Aperçu indisponible.')}</div>
          ) : confirmSend.kind === 'folder' ? (
            <div className="flex-1 overflow-y-auto p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-1">{confirmSend.title}</h1>
              <p className="text-sm text-gray-500 mb-4">
                {tr(locale,
                  `The patient signs these ${confirmSend.docs.length} documents one after another, from a single link and email. Expand any to preview it.`,
                  `Le patient signe ces ${confirmSend.docs.length} documents l’un après l’autre, via un seul lien et un seul e-mail. Dépliez-en un pour le prévisualiser.`)}
              </p>
              <div className="space-y-2">
                {confirmSend.docs.map((d, i) => {
                  const open = expandedPreview.has(d.id)
                  return (
                    <div key={d.id} className="rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedPreview(prev => { const n = new Set(prev); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n })}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="w-5 h-5 shrink-0 rounded-full bg-teal-50 text-teal-700 text-[11px] font-medium flex items-center justify-center">{i + 1}</span>
                        <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{d.title}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          {open ? tr(locale, 'Hide', 'Masquer') : tr(locale, 'Preview', 'Aperçu')}
                          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                      </button>
                      {open && (
                        <div className="border-t border-gray-100 bg-gray-50/50">
                          {d.source === 'upload' ? (
                            d.url
                              ? <iframe src={d.url} className="w-full h-[55vh] bg-white" title={d.title} />
                              : <p className="p-4 text-sm text-gray-400">{tr(locale, 'No preview available.', 'Aperçu indisponible.')}</p>
                          ) : (
                            <div className="p-5 max-h-[55vh] overflow-y-auto">
                              <AuthoredBlocks blocks={d.blocks} locale={locale} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">{confirmSend.title}</h1>
              <AuthoredBlocks blocks={confirmSend.blocks} locale={locale} />
            </div>
          )}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
            <button onClick={() => setConfirmSend(null)} disabled={sending}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50">
              {tr(locale, 'Cancel', 'Annuler')}
            </button>
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {tr(locale, 'Confirm & send', 'Confirmer et envoyer')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
