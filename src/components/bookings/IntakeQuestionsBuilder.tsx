'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import type { IntakeQuestion, IntakeFieldType } from '@/types/calendar'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function defaultTemplate(locale: string): IntakeQuestion[] {
  const fr = locale === 'fr'
  return [
    {
      id: genId(),
      label: fr ? 'Motif de consultation' : 'Reason for visit',
      type: 'multi',
      options: fr
        ? ['Anxiété / stress', 'Humeur basse', 'Relations', 'Travail / burnout', 'Autre']
        : ['Anxiety / stress', 'Low mood', 'Relationships', 'Work / burnout', 'Other'],
      required: true,
    },
    {
      id: genId(),
      label: fr ? 'Est-ce votre première séance avec moi ?' : 'Is this your first session with me?',
      type: 'single',
      options: fr ? ['Oui', 'Non'] : ['Yes', 'No'],
      required: false,
    },
    {
      id: genId(),
      label: fr ? 'Quelque chose à me signaler ?' : 'Anything you’d like me to know?',
      type: 'text',
      required: false,
    },
  ]
}

interface Props {
  value: IntakeQuestion[]
  onChange: (next: IntakeQuestion[]) => void
}

export function IntakeQuestionsBuilder({ value, onChange }: Props) {
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)

  const update = (id: string, patch: Partial<IntakeQuestion>) =>
    onChange(value.map((q) => (q.id === id ? { ...q, ...patch } : q)))

  const remove = (id: string) => onChange(value.filter((q) => q.id !== id))

  const addQuestion = () =>
    onChange([
      ...value,
      { id: genId(), label: '', type: 'text', required: false },
    ])

  const setType = (q: IntakeQuestion, type: IntakeFieldType) =>
    update(q.id, {
      type,
      // Seed two empty options when switching to a choice type.
      options: type === 'text' ? undefined : q.options && q.options.length ? q.options : ['', ''],
    })

  const updateOption = (q: IntakeQuestion, i: number, val: string) => {
    const options = [...(q.options || [])]
    options[i] = val
    update(q.id, { options })
  }
  const addOption = (q: IntakeQuestion) => update(q.id, { options: [...(q.options || []), ''] })
  const removeOption = (q: IntakeQuestion, i: number) =>
    update(q.id, { options: (q.options || []).filter((_, idx) => idx !== i) })

  const TYPES: { key: IntakeFieldType; label: string }[] = [
    { key: 'text', label: t('Text', 'Texte') },
    { key: 'single', label: t('Single choice', 'Choix unique') },
    { key: 'multi', label: t('Multiple choice', 'Choix multiple') },
  ]

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 mb-3">
            {t('No intake questions yet.', 'Aucune question pour le moment.')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onChange(defaultTemplate(locale))}
              className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              {t('Use a starter template', 'Utiliser un modèle')}
            </button>
            <button
              type="button"
              onClick={addQuestion}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {t('Add a question', 'Ajouter une question')}
            </button>
          </div>
        </div>
      )}

      {value.map((q, qi) => (
        <div key={q.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
          <div className="flex items-start gap-2">
            <span className="mt-2 text-xs font-medium text-gray-400 w-4 shrink-0">{qi + 1}.</span>
            <input
              type="text"
              value={q.label}
              onChange={(e) => update(q.id, { label: e.target.value })}
              placeholder={t('Question (e.g. Reason for visit)', 'Question (ex. Motif de consultation)')}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => remove(q.id)}
              className="mt-1 p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              aria-label={t('Remove question', 'Supprimer la question')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-6">
            <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {TYPES.map((ty) => (
                <button
                  key={ty.key}
                  type="button"
                  onClick={() => setType(q, ty.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    q.type === ty.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {ty.label}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={!!q.required}
                onChange={(e) => update(q.id, { required: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              {t('Required', 'Obligatoire')}
            </label>
          </div>

          {(q.type === 'single' || q.type === 'multi') && (
            <div className="pl-6 space-y-2">
              {(q.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 shrink-0 border border-gray-300 ${q.type === 'single' ? 'rounded-full' : 'rounded'}`} />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(q, i, e.target.value)}
                    placeholder={t('Option', 'Option')}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(q, i)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                    aria-label={t('Remove option', 'Supprimer l’option')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(q)}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Add option', 'Ajouter une option')}
              </button>
            </div>
          )}
        </div>
      ))}

      {value.length > 0 && (
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('Add a question', 'Ajouter une question')}
        </button>
      )}
    </div>
  )
}
