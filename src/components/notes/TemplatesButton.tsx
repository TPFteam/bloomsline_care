'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { LayoutTemplate, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'

// Per-practitioner note templates. The button sits in the RichTextEditor
// toolbar; clicking opens a popover with the practitioner's saved
// templates + a "New template" entry. Clicking a template name inserts
// its content into the current note editor.

interface Template {
  id: string
  name: string
  content: string
  updated_at: string
}

interface TemplatesButtonProps {
  fr: boolean
  onInsert: (html: string) => void
  isEditorEmpty: () => boolean
}

export function TemplatesButton({ fr, onInsert, isEditorEmpty }: TemplatesButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [editing, setEditing] = useState<Template | 'new' | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load templates on open
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('note_templates')
      .select('id, name, content, updated_at')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        setTemplates((data as Template[]) || [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        popoverRef.current && !popoverRef.current.contains(t) &&
        buttonRef.current && !buttonRef.current.contains(t)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Plain text → HTML. Lines starting with `## ` become <h2>, lines
  // starting with `# ` become <h1>, everything else is a <p>. Blank
  // lines render as empty paragraphs so spacing is preserved.
  const textToHtml = (text: string): string => {
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return text
      .split('\n')
      .map(rawLine => {
        const line = rawLine.trimEnd()
        if (!line.trim()) return '<p><br></p>'
        const h2 = line.match(/^##\s+(.+)$/)
        if (h2) return `<h2>${escape(h2[1])}</h2>`
        const h1 = line.match(/^#\s+(.+)$/)
        if (h1) return `<h1>${escape(h1[1])}</h1>`
        return `<p>${escape(line)}</p>`
      })
      .join('')
  }

  const handleInsert = (tpl: Template) => {
    if (!tpl.content.trim()) {
      toast.error(fr ? 'Ce modèle est vide.' : 'This template is empty.')
      return
    }
    if (!isEditorEmpty()) {
      const ok = window.confirm(
        fr
          ? 'La note contient déjà du contenu. Ajouter le modèle à la suite ?'
          : 'The note already has content. Append the template below?'
      )
      if (!ok) return
    }
    onInsert(textToHtml(tpl.content))
    setOpen(false)
    toast.success(fr ? 'Modèle inséré' : 'Template inserted')
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const ok = window.confirm(fr ? 'Supprimer ce modèle ?' : 'Delete this template?')
    if (!ok) return
    const { error } = await supabase.from('note_templates').delete().eq('id', id)
    if (error) {
      toast.error(fr ? 'Échec de la suppression' : 'Delete failed')
      return
    }
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success(fr ? 'Modèle supprimé' : 'Template deleted')
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
      >
        <LayoutTemplate className="w-4 h-4" />
        <span>{fr ? 'Modèles' : 'Templates'}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden"
        >
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline" />
            </div>
          ) : templates.length === 0 ? (
            <div className="px-4 py-6 text-xs text-gray-400 text-center leading-snug">
              {fr
                ? 'Aucun modèle pour le moment.\nCréez votre premier ci-dessous.'
                : 'No templates yet.\nCreate your first below.'}
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {templates.map(tpl => (
                <li key={tpl.id} className="group flex items-center gap-1 px-2 py-0.5 hover:bg-gray-50">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsert(tpl)}
                    className="flex-1 text-left text-sm text-gray-700 truncate px-1.5 py-1.5 rounded hover:text-gray-900"
                  >
                    {tpl.name}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.stopPropagation(); setEditing(tpl) }}
                    className="p-1 rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-700 hover:bg-gray-100 transition-opacity"
                    title={fr ? 'Modifier' : 'Edit'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => handleDelete(e, tpl.id)}
                    className="p-1 rounded text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-opacity"
                    title={fr ? 'Supprimer' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-100">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditing('new')}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {fr ? 'Nouveau modèle' : 'Add new template'}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <TemplateEditor
          template={editing === 'new' ? null : editing}
          fr={fr}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setTemplates(prev => {
              const i = prev.findIndex(t => t.id === saved.id)
              if (i >= 0) {
                const next = [...prev]
                next[i] = saved
                return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
              }
              return [saved, ...prev]
            })
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function TemplateEditor({
  template, fr, onClose, onSaved,
}: {
  template: Template | null
  fr: boolean
  onClose: () => void
  onSaved: (t: Template) => void
}) {
  const [name, setName] = useState(template?.name || '')
  const [content, setContent] = useState(template?.content || '')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Prepend `# ` or `## ` to the start of the line the cursor is on
  // (or wrap the current selection's first line). Lets the practitioner
  // add a heading with one click instead of remembering the syntax.
  const applyHeading = (prefix: '# ' | '## ') => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const value = ta.value
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1
    const lineEnd = value.indexOf('\n', pos)
    const endIdx = lineEnd === -1 ? value.length : lineEnd
    const line = value.slice(lineStart, endIdx)
    // Strip any existing leading "# " / "## " so toggling between H1/H2
    // doesn't stack prefixes.
    const stripped = line.replace(/^#{1,2}\s+/, '')
    const newLine = prefix + stripped
    const newValue = value.slice(0, lineStart) + newLine + value.slice(endIdx)
    setContent(newValue)
    // Restore caret to the end of the modified line on the next tick.
    setTimeout(() => {
      const caret = lineStart + newLine.length
      ta.focus()
      ta.setSelectionRange(caret, caret)
    }, 0)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(fr ? 'Le nom est requis' : 'Name is required')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(fr ? 'Session expirée' : 'Session expired')
        return
      }
      if (template) {
        const { data, error } = await supabase
          .from('note_templates')
          .update({ name: name.trim(), content, updated_at: new Date().toISOString() })
          .eq('id', template.id)
          .select()
          .single()
        if (error) throw error
        if (data) onSaved(data as Template)
      } else {
        const { data, error } = await supabase
          .from('note_templates')
          .insert({ practitioner_id: user.id, name: name.trim(), content })
          .select()
          .single()
        if (error) throw error
        if (data) onSaved(data as Template)
      }
      toast.success(fr ? 'Modèle enregistré' : 'Template saved')
    } catch (err) {
      console.error('Template save error:', err)
      toast.error(fr ? 'Échec de l\'enregistrement' : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {template ? (fr ? 'Modifier le modèle' : 'Edit template') : (fr ? 'Nouveau modèle' : 'New template')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {fr ? 'Nom' : 'Name'}
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={fr ? 'Première séance' : 'Intake interview'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700">
                {fr ? 'Contenu' : 'Content'}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyHeading('# ')}
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title={fr ? 'Titre' : 'Heading'}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => applyHeading('## ')}
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  title={fr ? 'Sous-titre' : 'Subheading'}
                >
                  H2
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={fr
                ? '# Première séance\n\nMotif de consultation\n—\n\n## Historique\n—\n\n## Objectifs\n—'
                : '# Intake interview\n\nPresenting concern\n—\n\n## History\n—\n\n## Goals\n—'}
              rows={12}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">
              {fr
                ? 'Astuce : commencez une ligne par # pour un titre, ## pour un sous-titre.'
                : 'Tip: start a line with # for a heading, ## for a subheading.'}
            </p>
          </div>
        </div>
        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            {fr ? 'Annuler' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {fr ? 'Enregistrer' : 'Save'}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  )
}
