'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  type EngagementSettings,
  type EngagementSignalId,
  type EngagementPreset,
  DEFAULT_ENGAGEMENT_SETTINGS,
  applyPreset,
  SIGNAL_LABELS,
} from '@/lib/analytics/engagement'

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: EngagementSettings
  onSave: (next: EngagementSettings) => Promise<void>
  locale: 'en' | 'fr' | 'es'
}

const PRESET_OPTIONS: { id: Exclude<EngagementPreset, 'custom'>; label: { en: string; fr: string; es: string } }[] = [
  { id: 'all',       label: { en: 'All signals',    fr: 'Tous les signaux', es: 'Todas las señales' } },
  { id: 'sessions',  label: { en: 'Sessions only',  fr: 'Séances uniquement', es: 'Solo sesiones' } },
  { id: 'notes',     label: { en: 'Notes only',     fr: 'Notes uniquement', es: 'Solo notas' } },
  { id: 'resources', label: { en: 'Resources only', fr: 'Ressources uniquement', es: 'Solo recursos' } },
  { id: 'stories',   label: { en: 'Stories only',   fr: 'Histoires uniquement', es: 'Solo historias' } },
]

export function EngagementSettingsDrawer({ isOpen, onClose, settings, onSave, locale }: Props) {
  const [draft, setDraft] = useState<EngagementSettings>(settings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setDraft(settings)
  }, [isOpen, settings])

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  const handlePreset = (preset: Exclude<EngagementPreset, 'custom'>) => {
    setDraft(applyPreset(draft, preset))
  }

  const handleToggle = (id: EngagementSignalId) => {
    setDraft({
      ...draft,
      preset: 'custom',
      signals: { ...draft.signals, [id]: { ...draft.signals[id], enabled: !draft.signals[id].enabled } },
    })
  }

  const handlePulseToggle = () => {
    setDraft({ ...draft, pulseSentimentOverride: !draft.pulseSentimentOverride })
  }

  const handleReset = () => {
    setDraft(DEFAULT_ENGAGEMENT_SETTINGS)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      toast.success(t('Settings saved', 'Paramètres enregistrés', 'Configuración guardada'))
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(t('Failed to save', 'Échec de l\'enregistrement', 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {t('Engagement signals', 'Signaux d\'engagement', 'Señales de compromiso')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('Customize how each patient is scored', 'Personnalisez le calcul du score de chaque patient', 'Personaliza cómo se puntúa cada paciente')}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Presets */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('Quick presets', 'Préréglages', 'Preajustes')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handlePreset(opt.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        draft.preset === opt.id
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label[locale]}
                    </button>
                  ))}
                  <div className={`px-3 py-2 rounded-lg text-xs font-medium border text-center ${
                    draft.preset === 'custom'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {t('Custom', 'Personnalisé', 'Personalizado')}
                  </div>
                </div>
              </div>

              {/* Signals — toggle only (each enabled signal contributes equally) */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('Signals to include', 'Signaux à inclure', 'Señales a incluir')}
                </h3>
                <div className="space-y-2">
                  {(Object.keys(draft.signals) as EngagementSignalId[]).map(id => {
                    const cfg = draft.signals[id]
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          cfg.enabled ? 'border-gray-200 bg-white hover:border-gray-300' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={cfg.enabled}
                          onChange={() => handleToggle(id)}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-2"
                        />
                        <span className={`text-sm font-medium ${cfg.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {SIGNAL_LABELS[id][locale]}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Pulse sentiment override */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.pulseSentimentOverride}
                    onChange={handlePulseToggle}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {t('Use Bloom Pulse sentiment as a tier override', 'Utiliser le ressenti Bloom Pulse comme ajustement', 'Usar el sentimiento de Bloom Pulse como ajuste')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {t(
                        'When the latest Pulse marks a patient as "attention", they\'re forced to orange. "Progressing" forces emerald. Other states leave the score-based color unchanged.',
                        'Quand le dernier Pulse marque "à surveiller", le patient passe en orange. "En progression" force le vert. Les autres états laissent la couleur basée sur le score.',
                        'Cuando el último Pulse marca "atención", el paciente pasa a naranja. "Progresando" fuerza esmeralda.'
                      )}
                    </p>
                  </div>
                </label>
              </div>

              {/* Reset */}
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-gray-900 underline"
                >
                  {t('Reset to defaults', 'Réinitialiser', 'Restablecer')}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                {t('Cancel', 'Annuler', 'Cancelar')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {t('Save', 'Enregistrer', 'Guardar')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
