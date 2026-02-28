'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, X, Calendar, AlertTriangle, Target, Lightbulb, MessageSquare, Pencil, Check, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import type { SessionPreparation } from '@/types/member'

interface SessionPrepCardProps {
  prep: SessionPreparation
  onDismiss: () => void
  onSave: (updated: SessionPreparation) => Promise<void>
  defaultCollapsed?: boolean
}

const labels = {
  en: {
    title: 'Session Preparation',
    lastSession: 'Last Session',
    mood: 'Mood',
    keyTakeaways: 'Key Takeaways',
    openThreads: 'Open Threads',
    suggestedFocus: 'Suggested Focus',
    thingsToNote: 'Things to Note',
    disclaimer: 'AI-generated briefing based on available data. Always use your clinical judgment.',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
    addItem: 'Add item',
    viewMore: 'View full briefing',
    viewLess: 'Collapse',
  },
  fr: {
    title: 'Préparation de Séance',
    lastSession: 'Dernière Séance',
    mood: 'Humeur',
    keyTakeaways: 'Points Clés',
    openThreads: 'Fils Ouverts',
    suggestedFocus: 'Axes Suggérés',
    thingsToNote: 'Points d\'Attention',
    disclaimer: 'Briefing généré par IA basé sur les données disponibles. Utilisez toujours votre jugement clinique.',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    saving: 'Enregistrement...',
    addItem: 'Ajouter',
    viewMore: 'Voir le briefing complet',
    viewLess: 'Réduire',
  },
  es: {
    title: 'Preparación de Sesión',
    lastSession: 'Última Sesión',
    mood: 'Ánimo',
    keyTakeaways: 'Puntos Clave',
    openThreads: 'Temas Pendientes',
    suggestedFocus: 'Enfoque Sugerido',
    thingsToNote: 'Puntos a Considerar',
    disclaimer: 'Briefing generado por IA basado en datos disponibles. Siempre use su juicio clínico.',
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    saving: 'Guardando...',
    addItem: 'Agregar',
    viewMore: 'Ver briefing completo',
    viewLess: 'Colapsar',
  },
}

function getMoodColor(mood: number): string {
  if (mood >= 7) return 'bg-emerald-100 text-emerald-700'
  if (mood >= 4) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

function AutoTextarea({ value, onChange, className, placeholder }: {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [])

  useEffect(() => { resize() }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      rows={1}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden ${className || ''}`}
    />
  )
}

function EditableList({
  items,
  onChange,
  placeholder,
  addLabel,
  itemClassName,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel: string
  itemClassName?: string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <AutoTextarea
            value={item}
            onChange={(val) => {
              const next = [...items]
              next[i] = val
              onChange(next)
            }}
            placeholder={placeholder}
            className={`flex-1 min-w-0 text-sm bg-white/80 border border-blue-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-300 leading-relaxed ${itemClassName || 'text-gray-700'}`}
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="mt-2 p-1 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  )
}

export function SessionPrepCard({ prep, onDismiss, onSave, defaultCollapsed = false }: SessionPrepCardProps) {
  const { locale } = useLanguage()
  const l = labels[locale]

  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<SessionPreparation>(prep)

  const startEdit = () => {
    setCollapsed(false)
    setDraft(structuredClone(prep))
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(prep)
    setEditing(false)
  }

  const handleSave = async () => {
    const cleaned: SessionPreparation = {
      ...draft,
      open_threads: draft.open_threads.filter(s => s.trim()),
      suggested_focus: draft.suggested_focus.filter(s => s.trim()),
      things_to_note: draft.things_to_note.filter(s => s.trim()),
      last_session: draft.last_session ? {
        ...draft.last_session,
        key_takeaways: draft.last_session.key_takeaways.filter(s => s.trim()),
      } : null,
    }

    setSaving(true)
    try {
      await onSave(cleaned)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const display = editing ? draft : prep

  // Collapsed view — compact summary
  if (collapsed && !editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/60 px-5 py-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">{l.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {prep.quick_context}
              </p>
              {prep.suggested_focus.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Target className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  {prep.suggested_focus.slice(0, 2).map((focus, i) => (
                    <span key={i} className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                      {focus}
                    </span>
                  ))}
                  {prep.suggested_focus.length > 2 && (
                    <span className="text-[11px] text-indigo-400">+{prep.suggested_focus.length - 2}</span>
                  )}
                </div>
              )}
              <button
                onClick={() => setCollapsed(false)}
                className="inline-flex items-center gap-1 mt-2.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                {l.viewMore}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={startEdit}
              className="p-1 rounded-lg hover:bg-blue-100/60 text-blue-400 hover:text-blue-600 transition-colors"
              title={l.edit}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-blue-100/60 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Expanded view — full briefing
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/60 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-sm font-semibold text-blue-900">{l.title}</h4>
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-2.5 py-1 text-xs rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {l.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {l.saving}
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    {l.save}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded-lg hover:bg-blue-100/60 text-blue-400 hover:text-blue-600 transition-colors"
                title={l.viewLess}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={startEdit}
                className="p-1 rounded-lg hover:bg-blue-100/60 text-blue-400 hover:text-blue-600 transition-colors"
                title={l.edit}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg hover:bg-blue-100/60 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Context */}
      {editing ? (
        <textarea
          value={draft.quick_context}
          onChange={(e) => setDraft(d => ({ ...d, quick_context: e.target.value }))}
          rows={3}
          className="w-full text-sm bg-white/80 border border-blue-100 rounded-xl px-3 py-2.5 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-y text-gray-700 leading-relaxed"
        />
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {display.quick_context}
        </p>
      )}

      {/* Last Session */}
      {display.last_session && (
        <div className="mb-4 p-3 rounded-xl bg-white/60 border border-blue-100/80">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-800">{l.lastSession}</span>
            <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
              {display.last_session.date}
            </span>
            {display.last_session.mood !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getMoodColor(display.last_session.mood)}`}>
                {l.mood}: {display.last_session.mood}/10
              </span>
            )}
          </div>
          {editing ? (
            <textarea
              value={draft.last_session?.summary || ''}
              onChange={(e) => setDraft(d => ({
                ...d,
                last_session: d.last_session ? { ...d.last_session, summary: e.target.value } : null,
              }))}
              rows={3}
              className="w-full text-sm bg-white/80 border border-blue-100 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-y text-gray-600 leading-relaxed"
            />
          ) : (
            <p className="text-sm text-gray-600 mb-2">{display.last_session.summary}</p>
          )}
          {(display.last_session.key_takeaways.length > 0 || editing) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{l.keyTakeaways}</p>
              {editing ? (
                <EditableList
                  items={draft.last_session?.key_takeaways || []}
                  onChange={(items) => setDraft(d => ({
                    ...d,
                    last_session: d.last_session ? { ...d.last_session, key_takeaways: items } : null,
                  }))}
                  addLabel={l.addItem}
                />
              ) : (
                <ul className="space-y-0.5">
                  {display.last_session.key_takeaways.map((takeaway, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">&#8226;</span>
                      {takeaway}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Open Threads */}
      {(display.open_threads.length > 0 || editing) && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-gray-700">{l.openThreads}</span>
            {!editing && display.open_threads.length > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                {display.open_threads.length}
              </span>
            )}
          </div>
          {editing ? (
            <EditableList
              items={draft.open_threads}
              onChange={(items) => setDraft(d => ({ ...d, open_threads: items }))}
              addLabel={l.addItem}
            />
          ) : (
            <ul className="space-y-0.5 pl-5">
              {display.open_threads.map((thread, i) => (
                <li key={i} className="text-xs text-gray-600 list-disc">{thread}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Suggested Focus */}
      {(display.suggested_focus.length > 0 || editing) && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-gray-700">{l.suggestedFocus}</span>
          </div>
          {editing ? (
            <EditableList
              items={draft.suggested_focus}
              onChange={(items) => setDraft(d => ({ ...d, suggested_focus: items }))}
              addLabel={l.addItem}
              itemClassName="text-indigo-700 font-medium"
            />
          ) : (
            <ul className="space-y-1 pl-5">
              {display.suggested_focus.map((focus, i) => (
                <li key={i} className="text-xs text-indigo-700 font-medium list-disc">{focus}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Things to Note */}
      {(display.things_to_note.length > 0 || editing) && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-700">{l.thingsToNote}</span>
          </div>
          {editing ? (
            <EditableList
              items={draft.things_to_note}
              onChange={(items) => setDraft(d => ({ ...d, things_to_note: items }))}
              addLabel={l.addItem}
              itemClassName="text-amber-700"
            />
          ) : (
            <ul className="space-y-0.5 pl-5">
              {display.things_to_note.map((note, i) => (
                <li key={i} className="text-xs text-amber-700 list-disc">{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="mt-4 pt-3 border-t border-blue-100/80">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 text-blue-300 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-blue-400 leading-relaxed">{l.disclaimer}</p>
        </div>
      </div>
    </motion.div>
  )
}
