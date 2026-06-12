'use client'

/**
 * Customizable patient overview sections — works like the History card.
 *
 *   Template (per practitioner) — user_preferences.overview_sections:
 *     [{ id, title, type: 'paragraph' | 'list' }]. Defined once via "Edit
 *     template"; shows on every patient as empty fields.
 *   Content (per patient) — members.overview_content:
 *     { [subId]: string (paragraph) | string[] (list) }.
 *
 * Explicit Cancel / Save (no auto-save). Separate card; old History untouched.
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { toast } from 'sonner'
import { Plus, Trash2, ChevronUp, ChevronDown, SlidersHorizontal, Pencil, GripVertical, Settings2 } from 'lucide-react'

type SubType = 'paragraph' | 'list'
type Subsection = { id: string; title: string; type: SubType }
type Content = Record<string, string | string[]>

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

export default function CustomSections({
  memberId,
  onEditingChange,
}: {
  memberId: string
  /** Reports whether the card is in an edit mode (parent disables drag). */
  onEditingChange?: (editing: boolean) => void
}) {
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const supabase = createClient()

  const [template, setTemplate] = useState<Subsection[]>([])
  const [content, setContent] = useState<Content>({})
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'view' | 'content' | 'template'>('view')
  const [draftTemplate, setDraftTemplate] = useState<Subsection[]>([])
  const [draftContent, setDraftContent] = useState<Content>({})
  const [saving, setSaving] = useState(false)
  const [openPresetFor, setOpenPresetFor] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  // Common section names so teams stay consistent — "Other" lets them type
  // their own.
  const PRESETS: { key: string; label: string }[] = [
    { key: 'strengths', label: t('Strengths', 'Forces') },
    { key: 'weaknesses', label: t('Weaknesses', 'Faiblesses') },
    { key: 'treatment_plan', label: t('Current treatment plan', 'Plan de traitement actuel') },
    { key: 'treatment_history', label: t('Treatment history', 'Antécédents de traitement') },
    { key: 'other', label: t('Other…', 'Autre…') },
  ]
  const choosePreset = (id: string, p: { key: string; label: string }) => {
    if (p.key !== 'other') patchSub(id, { title: p.label })
    setOpenPresetFor(null)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      userIdRef.current = user.id
      const [{ data: prefs }, { data: m }] = await Promise.all([
        supabase.from('user_preferences').select('overview_sections').eq('user_id', user.id).maybeSingle(),
        supabase.from('members').select('overview_content').eq('id', memberId).maybeSingle(),
      ])
      if (cancelled) return
      setTemplate(((prefs?.overview_sections as Subsection[]) || []))
      setContent(((m?.overview_content as Content) || {}))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [memberId, supabase])

  // Let the parent disable card drag while editing (text selection vs drag).
  useEffect(() => { onEditingChange?.(mode !== 'view') }, [mode, onEditingChange])

  // ── Content editing ──
  const startContent = () => { setDraftContent({ ...content }); setMode('content') }
  const saveContent = async () => {
    setSaving(true)
    const { error } = await supabase.from('members').update({ overview_content: draftContent }).eq('id', memberId)
    setSaving(false)
    if (error) { toast.error(t('Could not save — has the migration been run?', "Échec — la migration a-t-elle été lancée ?")); return }
    setContent(draftContent); setMode('view'); toast.success(t('Saved', 'Enregistré'))
  }

  // ── Template editing ──
  const startTemplate = () => { setDraftTemplate(template.map(s => ({ ...s }))); setMode('template') }
  const saveTemplate = async () => {
    if (!userIdRef.current) return
    const clean = draftTemplate.filter(s => s.title.trim())
    setSaving(true)
    const { error } = await supabase.from('user_preferences').upsert(
      { user_id: userIdRef.current, overview_sections: clean }, { onConflict: 'user_id' },
    )
    setSaving(false)
    if (error) { toast.error(t('Could not save — has the migration been run?', "Échec — la migration a-t-elle été lancée ?")); return }
    setTemplate(clean); setMode('view'); toast.success(t('Template saved', 'Modèle enregistré'))
  }

  const addSub = () => setDraftTemplate([...draftTemplate, { id: uid(), title: '', type: 'paragraph' }])
  const patchSub = (id: string, patch: Partial<Subsection>) =>
    setDraftTemplate(draftTemplate.map(s => (s.id === id ? { ...s, ...patch } : s)))
  const removeSub = (id: string) => setDraftTemplate(draftTemplate.filter(s => s.id !== id))
  const moveSub = (idx: number, dir: -1 | 1) => {
    const j = idx + dir; if (j < 0 || j >= draftTemplate.length) return
    const next = [...draftTemplate]; [next[idx], next[j]] = [next[j], next[idx]]; setDraftTemplate(next)
  }

  if (loading) return <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse h-32" />

  const asList = (v: string | string[] | undefined): string[] => (Array.isArray(v) ? v : [])
  const asText = (v: string | string[] | undefined): string => (typeof v === 'string' ? v : '')

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-semibold text-gray-900">{t('About patient', 'À propos du patient')}</span>
        {mode === 'view' && (
          <div className="flex items-center gap-1">
            <button onClick={startTemplate} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" /> {t('Edit template', 'Modifier le modèle')}
            </button>
            {template.length > 0 && (
              <button onClick={startContent} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5" /> {t('Edit', 'Modifier')}
              </button>
            )}
            {/* Drag affordance — the parent wraps this card in the drag shell. */}
            <div className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* ── Template editor ── */}
      {mode === 'template' && (
        <div>
          <p className="text-xs text-gray-400 mb-3">{t('Define your sections — name and type. They apply to every patient.', 'Définissez vos sections — nom et type. Elles s’appliquent à tous vos patients.')}</p>
          {openPresetFor && <div className="fixed inset-0 z-10" onClick={() => setOpenPresetFor(null)} />}
          <div className="space-y-2">
            {draftTemplate.map((sub, idx) => (
              <div key={sub.id} className="flex items-center gap-2">
                <div className={`relative flex-1 ${openPresetFor === sub.id ? 'z-20' : ''}`}>
                  <input
                    value={sub.title}
                    onChange={(e) => patchSub(sub.id, { title: e.target.value })}
                    onFocus={() => { if (!sub.title.trim()) setOpenPresetFor(sub.id) }}
                    placeholder={t('Section name…', 'Nom de la section…')}
                    className="w-full text-sm pl-3 pr-9 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setOpenPresetFor(openPresetFor === sub.id ? null : sub.id)}
                    title={t('Choose a common name', 'Choisir un nom courant')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  {openPresetFor === sub.id && (
                    <div className="absolute z-20 mt-1 left-0 min-w-[14rem] bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                      {PRESETS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => choosePreset(sub.id, p)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${p.key === 'other' ? 'text-violet-600 border-t border-gray-100 mt-1' : 'text-gray-700'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={sub.type}
                  onChange={(e) => patchSub(sub.id, { type: e.target.value as SubType })}
                  className="text-sm px-2.5 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gray-100"
                >
                  <option value="paragraph">{t('Paragraph', 'Paragraphe')}</option>
                  <option value="list">{t('List', 'Liste')}</option>
                </select>
                <button onClick={() => moveSub(idx, -1)} disabled={idx === 0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveSub(idx, 1)} disabled={idx === draftTemplate.length - 1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => removeSub(sub.id)} className="p-1 text-gray-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={addSub} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700">
            <Plus className="w-4 h-4" /> {t('Add section', 'Ajouter une section')}
          </button>
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setMode('view')} className="text-sm text-gray-500 hover:text-gray-800">{t('Cancel', 'Annuler')}</button>
            <button onClick={saveTemplate} disabled={saving} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">{t('Save', 'Enregistrer')}</button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {mode !== 'template' && template.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-3">{t('No sections yet.', 'Aucune section.')}</p>
          <button onClick={startTemplate} className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg">
            <SlidersHorizontal className="w-4 h-4" /> {t('Edit template', 'Modifier le modèle')}
          </button>
        </div>
      )}

      {/* ── Content (view + edit) ── */}
      {mode !== 'template' && template.length > 0 && (
        <div className="space-y-5">
          {template.map((sub) => {
            const editing = mode === 'content'
            const cur = editing ? draftContent[sub.id] : content[sub.id]
            return (
              <div key={sub.id}>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">{sub.title}</p>
                {sub.type === 'paragraph' ? (
                  editing ? (
                    <textarea
                      value={asText(cur)}
                      onChange={(e) => setDraftContent({ ...draftContent, [sub.id]: e.target.value })}
                      rows={3}
                      placeholder={t('Write…', 'Écrire…')}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-y"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{asText(cur) || <span className="text-gray-300">{t('—', '—')}</span>}</p>
                  )
                ) : editing ? (
                  <ol className="space-y-1.5">
                    {(asList(cur).length ? asList(cur) : ['']).map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 tabular-nums w-4 text-right">{i + 1}.</span>
                        <input
                          value={item}
                          onChange={(e) => { const items = [...asList(cur)]; if (!items.length) items.push(''); items[i] = e.target.value; setDraftContent({ ...draftContent, [sub.id]: items }) }}
                          onKeyDown={(e) => {
                            const items = asList(cur).length ? [...asList(cur)] : ['']
                            if (e.key === 'Enter') { e.preventDefault(); items.splice(i + 1, 0, ''); setDraftContent({ ...draftContent, [sub.id]: items }) }
                            else if (e.key === 'Backspace' && item === '' && items.length > 1) { e.preventDefault(); items.splice(i, 1); setDraftContent({ ...draftContent, [sub.id]: items }) }
                          }}
                          placeholder={t('Item…', 'Élément…')}
                          className="flex-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none"
                        />
                      </li>
                    ))}
                  </ol>
                ) : asList(cur).filter(Boolean).length ? (
                  <ol className="space-y-1">
                    {asList(cur).filter(Boolean).map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-gray-400 tabular-nums">{i + 1}.</span> {item}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-300">{t('—', '—')}</p>
                )}
              </div>
            )
          })}

          {mode === 'content' && (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setMode('view')} className="text-sm text-gray-500 hover:text-gray-800">{t('Cancel', 'Annuler')}</button>
              <button onClick={saveContent} disabled={saving} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">{t('Save', 'Enregistrer')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
