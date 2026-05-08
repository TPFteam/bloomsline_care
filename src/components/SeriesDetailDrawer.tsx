'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Calendar, CheckCircle, XCircle, Ban, Clock } from 'lucide-react'
import type { Session } from '@/types/member'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Every session in the series (filtered by series_id by the caller). */
  sessions: Session[]
  memberName: string
  locale: 'en' | 'fr' | 'es'
}

const STATUS_VISUAL: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled:  { bg: 'bg-blue-50',     text: 'text-blue-700',     icon: Clock },
  completed:  { bg: 'bg-emerald-50',  text: 'text-emerald-700',  icon: CheckCircle },
  cancelled:  { bg: 'bg-gray-100',    text: 'text-gray-500',     icon: XCircle },
  no_show:    { bg: 'bg-amber-50',    text: 'text-amber-700',    icon: Ban },
}

export function SeriesDetailDrawer({ isOpen, onClose, sessions, memberName, locale }: Props) {
  if (!isOpen) return null

  // Order chronologically and derive a few summary numbers.
  const ordered = [...sessions].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )
  const total = ordered[0]?.series_total ?? ordered.length
  const completed = ordered.filter(s => s.status === 'completed').length
  const cancelled = ordered.filter(s => s.status === 'cancelled').length
  const upcoming = ordered.filter(s => s.status === 'scheduled').length
  const anchor = ordered[0]
  const lastDate = ordered[ordered.length - 1]?.scheduled_at

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  // Best-effort frequency label from the anchor's recurrence_rule.
  let frequencyLabel = ''
  const rule = anchor?.recurrence_rule
  if (rule) {
    if (/INTERVAL=2/.test(rule)) frequencyLabel = t('Every 2 weeks', 'Toutes les 2 semaines', 'Cada 2 semanas')
    else if (/FREQ=MONTHLY/.test(rule)) frequencyLabel = t('Monthly', 'Chaque mois', 'Mensual')
    else if (/FREQ=WEEKLY/.test(rule)) frequencyLabel = t('Weekly', 'Chaque semaine', 'Semanal')
  }

  const statusLabel = (status: string) => {
    if (locale === 'fr') {
      return ({ scheduled: 'Planifiée', completed: 'Terminée', cancelled: 'Annulée', no_show: 'Absent' } as Record<string, string>)[status] || status
    }
    if (locale === 'es') {
      return ({ scheduled: 'Programada', completed: 'Completada', cancelled: 'Cancelada', no_show: 'Ausente' } as Record<string, string>)[status] || status
    }
    return ({ scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No show' } as Record<string, string>)[status] || status
  }

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/30"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '110%' }}
          animate={{ x: 0 }}
          exit={{ x: '110%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed right-4 top-4 bottom-4 z-[201] w-full max-w-md bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">
                    {t('Recurring series', 'Série récurrente', 'Serie recurrente')}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">{memberName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary row */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {frequencyLabel && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">{frequencyLabel}</span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                {t(`${total} sessions`, `${total} séances`, `${total} sesiones`)}
              </span>
              {anchor && (
                <span className="text-gray-400">
                  {new Date(anchor.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}
                  {lastDate && (
                    <> → {new Date(lastDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}</>
                  )}
                </span>
              )}
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Counter label={t('Upcoming', 'À venir', 'Próximas')} value={upcoming} tone="blue" />
              <Counter label={t('Completed', 'Terminées', 'Completadas')} value={completed} tone="emerald" />
              <Counter label={t('Cancelled', 'Annulées', 'Canceladas')} value={cancelled} tone="gray" />
            </div>
          </div>

          {/* Timeline list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {ordered.map((s) => {
              const visual = STATUS_VISUAL[s.status] || STATUS_VISUAL.scheduled
              const Icon = visual.icon
              const date = new Date(s.scheduled_at)
              const dateLabel = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })
              const timeLabel = date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                hour: '2-digit', minute: '2-digit', hour12: locale !== 'fr',
              })
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-[11px] font-mono text-gray-400 w-7 pt-1 shrink-0 text-right">
                    {s.series_position}/{s.series_total}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{dateLabel}</p>
                      <span className="text-xs text-gray-500">{timeLabel}</span>
                      {s.detached_from_series && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-[10px] font-medium" title={t('Moved away from the series', 'Déplacée hors de la série', 'Movida fuera de la serie')}>
                          {t('Moved', 'Déplacée', 'Movida')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${visual.bg} ${visual.text}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {statusLabel(s.status)}
                      </span>
                      {s.attendee_status === 'declined' && (
                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-medium">
                          {t('Patient declined', 'Patient a refusé', 'Paciente rechazó')}
                        </span>
                      )}
                      {s.attendee_status === 'tentative' && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium">
                          {t('Tentative', 'Provisoire', 'Provisional')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[11px] text-gray-500 leading-snug">
              {t(
                'To cancel, reschedule or skip an occurrence, use the action menu on the session card.',
                'Pour annuler, reprogrammer ou sauter une séance, utilisez le menu d\'actions sur la carte.',
                'Para cancelar, reprogramar u omitir una sesión, usa el menú de acciones en la tarjeta.',
              )}
            </p>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

function Counter({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'emerald' | 'gray' }) {
  const toneClass =
    tone === 'blue'    ? 'bg-blue-50 text-blue-700'
    : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700'
    :                      'bg-gray-100 text-gray-600'
  return (
    <div className={`rounded-lg px-2.5 py-2 ${toneClass}`}>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
    </div>
  )
}
