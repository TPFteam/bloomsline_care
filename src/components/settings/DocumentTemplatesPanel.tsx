'use client'

// Practitioner-facing management of reusable signable-document templates
// (consent / intake). Lives in the Settings "Documents" tab. Create by
// uploading a PDF or authoring lightweight rich-text blocks; view, edit,
// preview (during creation/editing), toggle active, and delete.

import { useEffect, useRef, useState } from 'react'
import { FileText, Plus, Trash2, Loader2, Upload, PenLine, X, GripVertical, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { DocumentTemplate, DocumentBlock, DocumentType, DocumentSource } from '@/types/documents'

function tr(locale: string, en: string, fr: string) { return locale === 'fr' ? fr : en }

type TemplateWithPreview = DocumentTemplate & { previewUrl?: string | null }
type Viewer = { title: string; source: DocumentSource; url?: string | null; blocks?: DocumentBlock[] | null }

interface Draft {
  title: string
  type: DocumentType
  source: DocumentSource
  file: File | null
  blocks: DocumentBlock[]
  require_signature: boolean
  required_before_session: boolean
  allow_guardian: boolean
  auto_send: boolean
  locale: string
}

const emptyDraft = (locale: string): Draft => ({
  title: '',
  type: 'consent',
  source: 'upload',
  file: null,
  blocks: [{ type: 'paragraph', text: '' }],
  require_signature: true,
  required_before_session: false,
  allow_guardian: true,
  auto_send: false,
  locale,
})

const draftFromTemplate = (t: TemplateWithPreview): Draft => ({
  title: t.title,
  type: t.type,
  source: t.source,
  file: null,
  blocks: (t.content && t.content.length > 0) ? t.content : [{ type: 'paragraph', text: '' }],
  require_signature: t.require_signature,
  required_before_session: t.required_before_session,
  allow_guardian: t.allow_guardian,
  auto_send: t.auto_send,
  locale: t.locale,
})

function blockHasContent(b: DocumentBlock): boolean {
  if (b.type === 'paragraph' || b.type === 'heading') return b.text.trim().length > 0
  if (b.type === 'list') return b.items.some(i => i.trim().length > 0)
  return true
}

export function DocumentTemplatesPanel({ locale }: { locale: string }) {
  const [templates, setTemplates] = useState<TemplateWithPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<TemplateWithPreview | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft(locale))
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState<Viewer | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents/templates')
      const data = await res.json()
      if (res.ok) setTemplates(data.templates || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const typeLabel = (t: DocumentType) =>
    t === 'consent' ? tr(locale, 'Consent', 'Consentement')
      : t === 'intake' ? tr(locale, 'Intake', 'Admission')
      : tr(locale, 'Other', 'Autre')

  const openCreate = () => { setEditing(null); setDraft(emptyDraft(locale)); setCreating(true) }
  const openEdit = (t: TemplateWithPreview) => { setEditing(t); setDraft(draftFromTemplate(t)); setCreating(true) }
  const closeEditor = () => { setCreating(false); setEditing(null); setDraft(emptyDraft(locale)) }

  const viewTemplate = (t: TemplateWithPreview) => {
    if (t.source === 'upload') setViewing({ title: t.title, source: 'upload', url: t.previewUrl })
    else setViewing({ title: t.title, source: 'authored', blocks: t.content || [] })
  }

  const previewDraft = () => {
    if (draft.source === 'authored') {
      setViewing({ title: draft.title || tr(locale, 'Preview', 'Aperçu'), source: 'authored', blocks: draft.blocks.filter(blockHasContent) })
      return
    }
    // upload
    if (draft.file) {
      setViewing({ title: draft.title || draft.file.name, source: 'upload', url: URL.createObjectURL(draft.file) })
    } else if (editing?.previewUrl) {
      setViewing({ title: draft.title || editing.title, source: 'upload', url: editing.previewUrl })
    } else {
      toast.error(tr(locale, 'Choose a PDF first', 'Choisissez d’abord un PDF'))
    }
  }

  const handleSave = async () => {
    if (!draft.title.trim()) { toast.error(tr(locale, 'Add a title', 'Ajoutez un titre')); return }
    if (draft.source === 'upload' && !draft.file && !(editing && editing.source === 'upload' && editing.file_path)) {
      toast.error(tr(locale, 'Choose a PDF', 'Choisissez un PDF')); return
    }
    setSaving(true)
    try {
      let file_path: string | null | undefined
      if (draft.source === 'upload' && draft.file) {
        const fd = new FormData()
        fd.append('file', draft.file)
        const up = await fetch('/api/documents/templates/upload', { method: 'POST', body: fd })
        const upData = await up.json()
        if (!up.ok) throw new Error(upData.error || 'Upload failed')
        file_path = upData.file_path
      }

      const payload: Record<string, unknown> = {
        title: draft.title.trim(),
        type: draft.type,
        source: draft.source,
        content: draft.source === 'authored' ? draft.blocks.filter(blockHasContent) : null,
        require_signature: draft.require_signature,
        required_before_session: draft.required_before_session,
        allow_guardian: draft.allow_guardian,
        auto_send: draft.auto_send,
        locale: draft.locale,
      }
      // Only set file_path when a new file was uploaded (keeps the existing one on edit).
      if (file_path !== undefined) payload.file_path = file_path
      else if (!editing) payload.file_path = null

      const res = editing
        ? await fetch(`/api/documents/templates/${editing.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
        : await fetch('/api/documents/templates', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(editing ? tr(locale, 'Document updated', 'Document mis à jour') : tr(locale, 'Document created', 'Document créé'))
      closeEditor()
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/documents/templates/${id}`, { method: 'DELETE' })
    if (res.ok) { setTemplates(prev => prev.filter(t => t.id !== id)); toast.success(tr(locale, 'Deleted', 'Supprimé')) }
    else toast.error(tr(locale, 'Could not delete', 'Suppression impossible'))
  }

  const toggleActive = async (t: TemplateWithPreview) => {
    const res = await fetch(`/api/documents/templates/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !t.is_active }),
    })
    if (res.ok) setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !t.is_active } : x))
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          {tr(locale, 'Documents', 'Documents')}
        </CardTitle>
        <CardDescription>
          {tr(locale,
            'Reusable documents (consent, intake) you can send to patients to sign when you add them.',
            'Documents réutilisables (consentement, admission) à envoyer aux patients pour signature lors de leur ajout.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : (
          <>
            {templates.length === 0 && !creating && (
              <p className="text-sm text-gray-400 py-2">
                {tr(locale, 'No documents yet.', 'Aucun document pour le moment.')}
              </p>
            )}

            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {t.source === 'upload' ? <Upload className="w-4 h-4 text-gray-500" /> : <PenLine className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {typeLabel(t.type)}
                      {t.auto_send && <> · {tr(locale, 'auto-send', 'envoi auto')}</>}
                      {t.require_signature && <> · {tr(locale, 'signature required', 'signature requise')}</>}
                    </p>
                  </div>
                  <button onClick={() => viewTemplate(t)} title={tr(locale, 'View', 'Voir')} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(t)} title={tr(locale, 'Edit', 'Modifier')} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(t)}
                    className={`text-xs px-2 py-1 rounded-md font-medium ${t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {t.is_active ? tr(locale, 'Active', 'Actif') : tr(locale, 'Inactive', 'Inactif')}
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {creating ? (
              <DraftEditor
                draft={draft}
                setDraft={setDraft}
                locale={locale}
                saving={saving}
                isEditing={!!editing}
                hasExistingFile={!!(editing && editing.source === 'upload' && editing.file_path)}
                onCancel={closeEditor}
                onSave={handleSave}
                onPreview={previewDraft}
              />
            ) : (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {tr(locale, 'New document', 'Nouveau document')}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>

    {viewing && <DocumentViewer viewer={viewing} locale={locale} onClose={() => setViewing(null)} />}
    </>
  )
}

function AuthoredBlocks({ blocks, locale }: { blocks: DocumentBlock[]; locale: string }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-sm text-gray-400">{tr(locale, 'Nothing to preview yet.', 'Rien à prévisualiser.')}</p>
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

function DocumentViewer({ viewer, locale, onClose }: { viewer: Viewer; locale: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900 truncate">{viewer.title}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        {viewer.source === 'upload' ? (
          viewer.url
            ? <iframe src={viewer.url} className="flex-1 w-full rounded-b-2xl" title={viewer.title} />
            : <div className="flex-1 flex items-center justify-center text-sm text-gray-400">{tr(locale, 'No file to preview.', 'Aucun fichier à prévisualiser.')}</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">{viewer.title}</h1>
            <AuthoredBlocks blocks={viewer.blocks || []} locale={locale} />
          </div>
        )}
      </div>
    </div>
  )
}

function DraftEditor({
  draft, setDraft, locale, saving, isEditing, hasExistingFile, onCancel, onSave, onPreview,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  locale: string
  saving: boolean
  isEditing: boolean
  hasExistingFile: boolean
  onCancel: () => void
  onSave: () => void
  onPreview: () => void
}) {
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{isEditing ? tr(locale, 'Edit document', 'Modifier le document') : tr(locale, 'New document', 'Nouveau document')}</p>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{tr(locale, 'Title', 'Titre')}</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            placeholder={tr(locale, 'e.g. Consent to care', 'ex. Consentement aux soins')}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{tr(locale, 'Type', 'Type')}</label>
          <select
            value={draft.type}
            onChange={(e) => set({ type: e.target.value as DocumentType })}
            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="consent">{tr(locale, 'Consent', 'Consentement')}</option>
            <option value="intake">{tr(locale, 'Intake', 'Admission')}</option>
            <option value="other">{tr(locale, 'Other', 'Autre')}</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{tr(locale, 'Source', 'Source')}</label>
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mt-1">
            <button
              onClick={() => set({ source: 'upload' })}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium ${draft.source === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >{tr(locale, 'Upload PDF', 'Téléverser')}</button>
            <button
              onClick={() => set({ source: 'authored' })}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium ${draft.source === 'authored' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >{tr(locale, 'Write', 'Rédiger')}</button>
          </div>
        </div>
      </div>

      {draft.source === 'upload' ? (
        <div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => set({ file: e.target.files?.[0] || null })}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-white file:text-xs"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {hasExistingFile && !draft.file
              ? tr(locale, 'A PDF is already attached — choose a new one only to replace it.', 'Un PDF est déjà joint — choisissez-en un nouveau seulement pour le remplacer.')
              : tr(locale, 'PDF only for now.', 'PDF uniquement pour le moment.')}
          </p>
        </div>
      ) : (
        <BlockEditor blocks={draft.blocks} onChange={(blocks) => set({ blocks })} locale={locale} />
      )}

      {/* Flags */}
      <div className="space-y-2">
        <ToggleRow label={tr(locale, 'Send automatically when a patient is added', 'Envoyer automatiquement à l’ajout d’un patient')} value={draft.auto_send} onChange={(v) => set({ auto_send: v })} />
        <ToggleRow label={tr(locale, 'Require signature', 'Signature requise')} value={draft.require_signature} onChange={(v) => set({ require_signature: v })} />
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onPreview} className="rounded-lg">
          <Eye className="w-4 h-4 mr-1.5" />{tr(locale, 'Preview', 'Aperçu')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="rounded-lg">{tr(locale, 'Cancel', 'Annuler')}</Button>
          <Button onClick={onSave} disabled={saving} className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {tr(locale, 'Save document', 'Enregistrer')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex items-center gap-2 w-full">
      <div className={`relative w-8 h-[18px] rounded-full transition-colors ${value ? 'bg-teal-500' : 'bg-gray-200'}`}>
        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </button>
  )
}

function BlockEditor({ blocks, onChange, locale }: { blocks: DocumentBlock[]; onChange: (b: DocumentBlock[]) => void; locale: string }) {
  const update = (i: number, b: DocumentBlock) => onChange(blocks.map((x, idx) => idx === i ? b : x))
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i))
  const add = (b: DocumentBlock) => onChange([...blocks, b])

  // Track the last-focused text field so "insert variable" drops the token at
  // the caret. Falls back to appending a paragraph when nothing is focused.
  const activeRef = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; index: number } | null>(null)

  const insertVar = (token: string) => {
    const a = activeRef.current
    if (!a) { onChange([...blocks, { type: 'paragraph', text: token }]); return }
    const { el, index } = a
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const newVal = el.value.slice(0, start) + token + el.value.slice(end)
    const b = blocks[index]
    if (b.type === 'heading') update(index, { type: 'heading', text: newVal })
    else if (b.type === 'paragraph') update(index, { type: 'paragraph', text: newVal })
    else if (b.type === 'list') update(index, { type: 'list', items: newVal.split('\n') })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  const onFieldFocus = (i: number) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    activeRef.current = { el: e.currentTarget, index: i }
  }

  return (
    <div className="space-y-2">
      {/* Variable inserter — drops a placeholder filled with the patient's
          data at signing time. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-gray-400">{tr(locale, 'Insert:', 'Insérer :')}</span>
        <AddBtn onClick={() => insertVar('{{patient_name}}')}>{tr(locale, 'Patient name', 'Nom du patient')}</AddBtn>
        <AddBtn onClick={() => insertVar('{{patient_email}}')}>{tr(locale, 'Patient email', 'Email du patient')}</AddBtn>
      </div>
      {blocks.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-gray-300 mt-2 shrink-0" />
          <div className="flex-1">
            {b.type === 'heading' && (
              <input value={b.text} onFocus={onFieldFocus(i)} onChange={(e) => update(i, { type: 'heading', text: e.target.value })}
                placeholder={tr(locale, 'Heading', 'Titre de section')}
                className="w-full px-3 py-2 text-sm font-semibold border border-gray-200 rounded-lg bg-white" />
            )}
            {b.type === 'paragraph' && (
              <textarea value={b.text} onFocus={onFieldFocus(i)} onChange={(e) => update(i, { type: 'paragraph', text: e.target.value })}
                placeholder={tr(locale, 'Paragraph…', 'Paragraphe…')} rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white resize-y" />
            )}
            {b.type === 'list' && (
              <textarea value={b.items.join('\n')} onFocus={onFieldFocus(i)} onChange={(e) => update(i, { type: 'list', items: e.target.value.split('\n') })}
                placeholder={tr(locale, 'One item per line', 'Un élément par ligne')} rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white resize-y" />
            )}
            {b.type === 'divider' && <hr className="border-gray-200 my-2" />}
          </div>
          <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-500 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <AddBtn onClick={() => add({ type: 'heading', text: '' })}>{tr(locale, '+ Heading', '+ Titre')}</AddBtn>
        <AddBtn onClick={() => add({ type: 'paragraph', text: '' })}>{tr(locale, '+ Paragraph', '+ Paragraphe')}</AddBtn>
        <AddBtn onClick={() => add({ type: 'list', items: [''] })}>{tr(locale, '+ List', '+ Liste')}</AddBtn>
        <AddBtn onClick={() => add({ type: 'divider' })}>{tr(locale, '+ Divider', '+ Séparateur')}</AddBtn>
      </div>
      <p className="text-[11px] text-gray-400">
        {tr(locale,
          'Variables like {{patient_name}} are replaced with the patient’s details when sent.',
          'Les variables comme {{patient_name}} sont remplacées par les infos du patient à l’envoi.')}
      </p>
    </div>
  )
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100">
      {children}
    </button>
  )
}
