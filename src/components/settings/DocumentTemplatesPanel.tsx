'use client'

// Practitioner-facing management of reusable signable-document templates
// (consent / intake). Lives in the Settings "Documents" tab. Create by
// uploading a PDF or authoring lightweight rich-text blocks; view, edit,
// preview (during creation/editing), toggle active, and delete.

import { useEffect, useRef, useState } from 'react'
import { FileText, Plus, Trash2, Loader2, Upload, PenLine, X, GripVertical, Eye, Pencil, Folder, FolderPlus, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { DocumentTemplate, DocumentFolder, DocumentBlock, DocumentType, DocumentSource } from '@/types/documents'

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
  folder_id: string | null
}

const emptyDraft = (locale: string, folder_id: string | null = null): Draft => ({
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
  folder_id,
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
  folder_id: t.folder_id ?? null,
})

function blockHasContent(b: DocumentBlock): boolean {
  if (b.type === 'paragraph' || b.type === 'heading') return b.text.trim().length > 0
  if (b.type === 'list') return b.items.some(i => i.trim().length > 0)
  return true
}

export function DocumentTemplatesPanel({ locale }: { locale: string }) {
  const [templates, setTemplates] = useState<TemplateWithPreview[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<TemplateWithPreview | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft(locale))
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState<Viewer | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [tRes, fRes] = await Promise.all([
        fetch('/api/documents/templates'),
        fetch('/api/documents/folders'),
      ])
      const tData = await tRes.json().catch(() => ({}))
      const fData = await fRes.json().catch(() => ({}))
      if (tRes.ok) setTemplates(tData.templates || [])
      if (fRes.ok) setFolders(fData.folders || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const typeLabel = (t: DocumentType) =>
    t === 'consent' ? tr(locale, 'Consent', 'Consentement')
      : t === 'intake' ? tr(locale, 'Intake', 'Admission')
      : tr(locale, 'Other', 'Autre')

  const openCreate = (folderId: string | null = null) => { setEditing(null); setDraft(emptyDraft(locale, folderId)); setCreating(true) }
  const openEdit = (t: TemplateWithPreview) => { setEditing(t); setDraft(draftFromTemplate(t)); setCreating(true) }
  const closeEditor = () => { setCreating(false); setEditing(null); setDraft(emptyDraft(locale)) }

  const toggleCollapse = (id: string) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const createFolder = async () => {
    const name = newFolderName.trim()
    if (!name) { setCreatingFolder(false); return }
    const res = await fetch('/api/documents/folders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setFolders(prev => [...prev, data.folder]); setNewFolderName(''); setCreatingFolder(false) }
    else toast.error(tr(locale, 'Could not create folder', 'Création du dossier impossible'))
  }

  const renameFolder = async (id: string) => {
    const name = renameValue.trim()
    if (!name) { setRenamingFolder(null); return }
    const res = await fetch(`/api/documents/folders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    })
    if (res.ok) setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
    else toast.error(tr(locale, 'Could not rename', 'Renommage impossible'))
    setRenamingFolder(null)
  }

  const deleteFolder = async (id: string) => {
    const res = await fetch(`/api/documents/folders/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setFolders(prev => prev.filter(f => f.id !== id))
      // Documents stay — the FK just clears their folder_id (they become ungrouped).
      setTemplates(prev => prev.map(t => t.folder_id === id ? { ...t, folder_id: null } : t))
      toast.success(tr(locale, 'Folder deleted', 'Dossier supprimé'))
    } else toast.error(tr(locale, 'Could not delete folder', 'Suppression du dossier impossible'))
  }

  const moveToFolder = async (t: TemplateWithPreview, folderId: string | null) => {
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, folder_id: folderId } : x)) // optimistic
    const res = await fetch(`/api/documents/templates/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder_id: folderId }),
    })
    if (!res.ok) { toast.error(tr(locale, 'Could not move', 'Déplacement impossible')); load() }
  }

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
        folder_id: draft.folder_id,
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

  const inFolder = (id: string | null) => templates.filter(t => (t.folder_id ?? null) === id)
  const ungrouped = inFolder(null)

  // A single document row — used both inside folders and in the ungrouped list.
  const renderDoc = (t: TemplateWithPreview) => (
    <div key={t.id} className="flex items-center gap-2 rounded-xl border border-gray-200 p-3">
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
      {/* Move to a folder */}
      <select
        value={t.folder_id ?? ''}
        onChange={(e) => moveToFolder(t, e.target.value || null)}
        title={tr(locale, 'Move to folder', 'Déplacer vers un dossier')}
        className="max-w-[8rem] text-xs text-gray-500 border border-gray-200 rounded-lg px-1.5 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      >
        <option value="">{tr(locale, 'No folder', 'Sans dossier')}</option>
        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
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
  )

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
            {templates.length === 0 && folders.length === 0 && !creating && !creatingFolder && (
              <p className="text-sm text-gray-400 py-2">
                {tr(locale, 'No documents yet.', 'Aucun document pour le moment.')}
              </p>
            )}

            {/* Folders — each a collapsible group; deleting one keeps its docs. */}
            {folders.map(f => {
              const docs = inFolder(f.id)
              const isCollapsed = collapsed.has(f.id)
              return (
                <div key={f.id} className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/70 border-b border-gray-100">
                    <button onClick={() => toggleCollapse(f.id)} className="p-0.5 text-gray-400 hover:text-gray-700" aria-label={tr(locale, 'Toggle', 'Basculer')}>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                    </button>
                    <Folder className="w-4 h-4 text-teal-600 shrink-0" />
                    {renamingFolder === f.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => renameFolder(f.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') renameFolder(f.id); if (e.key === 'Escape') setRenamingFolder(null) }}
                        className="text-sm font-medium px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900 truncate">{f.name}</span>
                    )}
                    <span className="text-xs text-gray-400">{docs.length}</span>
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => { setRenamingFolder(f.id); setRenameValue(f.name) }} title={tr(locale, 'Rename', 'Renommer')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteFolder(f.id)} title={tr(locale, 'Delete folder', 'Supprimer le dossier')} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="p-2 space-y-2">
                      {docs.length === 0
                        ? <p className="text-xs text-gray-400 px-2 py-1">{tr(locale, 'Empty folder.', 'Dossier vide.')}</p>
                        : docs.map(renderDoc)}
                      <button
                        onClick={() => openCreate(f.id)}
                        className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {tr(locale, 'New document in folder', 'Nouveau document dans le dossier')}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Ungrouped documents */}
            {ungrouped.length > 0 && (
              <div className="space-y-2">
                {folders.length > 0 && (
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1">{tr(locale, 'Ungrouped', 'Sans dossier')}</p>
                )}
                {ungrouped.map(renderDoc)}
              </div>
            )}

            {creating ? (
              <DraftEditor
                draft={draft}
                setDraft={setDraft}
                folders={folders}
                locale={locale}
                saving={saving}
                isEditing={!!editing}
                hasExistingFile={!!(editing && editing.source === 'upload' && editing.file_path)}
                onCancel={closeEditor}
                onSave={handleSave}
                onPreview={previewDraft}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => openCreate()}
                  className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {tr(locale, 'New document', 'Nouveau document')}
                </button>
                {creatingFolder ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') } }}
                      placeholder={tr(locale, 'Folder name e.g. Welcome kit', 'Nom du dossier ex. Kit de bienvenue')}
                      className="text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 w-56"
                    />
                    <button onClick={createFolder} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg" title={tr(locale, 'Create', 'Créer')}><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setCreatingFolder(false); setNewFolderName('') }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" title={tr(locale, 'Cancel', 'Annuler')}><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreatingFolder(true)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                    {tr(locale, 'New folder', 'Nouveau dossier')}
                  </button>
                )}
              </div>
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
        if (b.type === 'heading') return <h3 key={i} className="text-base font-semibold text-gray-900 mt-4">{renderVarText(b.text, locale)}</h3>
        if (b.type === 'paragraph') return <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">{renderVarText(b.text, locale)}</p>
        if (b.type === 'list') return <ul key={i} className="list-disc pl-5 space-y-1 text-sm">{b.items.map((it, j) => <li key={j}>{renderVarText(it, locale)}</li>)}</ul>
        if (b.type === 'divider') return <hr key={i} className="border-gray-100 my-2" />
        return null
      })}
    </div>
  )
}

// Render text with {{patient_name}} / {{patient_email}} shown as highlighted
// chips that explain (on hover) they auto-fill with the patient's data.
function renderVarText(text: string, locale: string): React.ReactNode {
  const parts = text.split(/(\{\{\s*patient_(?:name|email)\s*\}\})/gi)
  return parts.map((part, i) => {
    const m = /\{\{\s*patient_(name|email)\s*\}\}/i.exec(part)
    if (!m) return <span key={i}>{part}</span>
    const isName = m[1].toLowerCase() === 'name'
    const label = isName ? tr(locale, 'Patient name', 'Nom du patient') : tr(locale, 'Patient email', 'Email du patient')
    const tip = isName
      ? tr(locale, 'This is filled in automatically with the patient’s name when the document is sent.', 'Ceci est rempli automatiquement avec le nom du patient à l’envoi du document.')
      : tr(locale, 'This is filled in automatically with the patient’s email when the document is sent.', 'Ceci est rempli automatiquement avec l’email du patient à l’envoi du document.')
    return (
      <span key={i}
        className="group relative inline-flex items-center rounded px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[0.85em] font-medium cursor-help">
        {label}
        <span className="pointer-events-none absolute top-full left-0 mt-1.5 z-20 hidden group-hover:block w-48 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg">
          {tip}
        </span>
      </span>
    )
  })
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
  draft, setDraft, folders, locale, saving, isEditing, hasExistingFile, onCancel, onSave, onPreview,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  folders: DocumentFolder[]
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
        <div className="col-span-2">
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{tr(locale, 'Folder', 'Dossier')}</label>
          <select
            value={draft.folder_id ?? ''}
            onChange={(e) => set({ folder_id: e.target.value || null })}
            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            <option value="">{tr(locale, 'No folder', 'Sans dossier')}</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
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
