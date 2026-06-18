'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import type { IntakeForm } from '@/types/calendar'
import { IntakeQuestionsBuilder } from './IntakeQuestionsBuilder'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

interface Props {
  value: IntakeForm[]
  onChange: (next: IntakeForm[]) => void
}

export function IntakeFormsManager({ value, onChange }: Props) {
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  // Collapsed by default — only the form the practitioner opens (or a newly
  // added one) expands.
  const [expanded, setExpanded] = useState<string | null>(null)

  const update = (id: string, patch: Partial<IntakeForm>) =>
    onChange(value.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  const remove = (id: string) => onChange(value.filter((f) => f.id !== id))
  const addForm = () => {
    const id = genId()
    onChange([...value, { id, name: t('Untitled form', 'Formulaire sans titre'), questions: [] }])
    setExpanded(id)
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-gray-500">
          {t(
            'No forms yet. Create a form, add questions, then link it to a session type below.',
            'Aucun formulaire. Créez-en un, ajoutez des questions, puis liez-le à un type de séance ci-dessous.',
          )}
        </p>
      )}

      {value.map((form) => {
        const open = expanded === form.id
        return (
          <div key={form.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-2 py-2 bg-gray-50/60">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : form.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label={open ? t('Collapse', 'Réduire') : t('Expand', 'Développer')}
              >
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <input
                value={form.name}
                onChange={(e) => update(form.id, { name: e.target.value })}
                placeholder={t('Form name', 'Nom du formulaire')}
                className="flex-1 px-2 py-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
              />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {form.questions.length} {t('q', 'q')}
              </span>
              <button
                type="button"
                onClick={() => remove(form.id)}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                aria-label={t('Delete form', 'Supprimer le formulaire')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {open && (
              <div className="p-3 border-t border-gray-100">
                <IntakeQuestionsBuilder
                  value={form.questions}
                  onChange={(qs) => update(form.id, { questions: qs })}
                />
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addForm}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('Add a form', 'Ajouter un formulaire')}
      </button>
    </div>
  )
}
