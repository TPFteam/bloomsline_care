'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Sparkles, ExternalLink, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface PatientQuickViewData {
  member: {
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string | null
  }
  tier: 'ontrack' | 'watch' | 'checkin'
  sessions: Array<{ id: string; status: string; scheduled_at: string }>
  notesWithTag: Array<{ id: string; created_at: string; note_type?: string }>
  pulse: { sentiment: 'progressing' | 'stable' | 'plateau' | 'attention' | null; headline: string | null; generatedAt: string } | null
  totalAssignedResources: number
  completedResources: number  // count of resource_responses with submitted/reviewed
}

interface Props {
  isOpen: boolean
  onClose: () => void
  data: PatientQuickViewData | null
  locale: 'en' | 'fr' | 'es'
  onOpenPulseModal?: (memberId: string) => void
}

type Period = 'week' | 'month' | '3months'

const PERIOD_DAYS: Record<Period, number> = {
  week: 7,
  month: 30,
  '3months': 90,
}

// Tag color palette — softer pastels with a gradient bar (matches in-app tag palette)
const TAG_COLORS: Record<string, { bar: string; text: string }> = {
  general:             { bar: 'bg-gradient-to-r from-rose-300 to-rose-400',           text: 'text-rose-500' },
  recurrence:          { bar: 'bg-gradient-to-r from-blue-300 to-blue-400',           text: 'text-blue-500' },
  hypothese:           { bar: 'bg-gradient-to-r from-orange-300 to-orange-400',       text: 'text-orange-500' },
  symptome:            { bar: 'bg-gradient-to-r from-violet-300 to-violet-400',       text: 'text-violet-500' },
  transfert:           { bar: 'bg-gradient-to-r from-yellow-300 to-yellow-400',       text: 'text-yellow-600' },
  contre_transfert:    { bar: 'bg-gradient-to-r from-pink-300 to-pink-400',           text: 'text-pink-500' },
  ajustement_envisage: { bar: 'bg-gradient-to-r from-emerald-300 to-emerald-400',     text: 'text-emerald-500' },
}
// Tag types that aren't in the explicit map cycle through these soft brand-aligned tones
const FALLBACK_TAG_PALETTE: Array<{ bar: string; text: string }> = [
  { bar: 'bg-gradient-to-r from-violet-300 to-violet-400', text: 'text-violet-500' },
  { bar: 'bg-gradient-to-r from-teal-300 to-teal-400',     text: 'text-teal-500' },
  { bar: 'bg-gradient-to-r from-indigo-300 to-indigo-400', text: 'text-indigo-500' },
]

function getInitials(first: string, last: string): string {
  return ((first[0] || '?') + (last[0] || '')).toUpperCase()
}

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export function PatientQuickViewDrawer({ isOpen, onClose, data, locale, onOpenPulseModal }: Props) {
  const [period, setPeriod] = useState<Period>('month')

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  const cutoffMs = useMemo(() => Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000, [period])

  const computed = useMemo(() => {
    if (!data) return null

    // Sessions in window (completed only)
    const sessionsInWindow = data.sessions.filter(s =>
      s.status === 'completed' && new Date(s.scheduled_at).getTime() >= cutoffMs
    )
    const sessionsCount = sessionsInWindow.length
    const firstSessionInWindow = sessionsInWindow
      .map(s => new Date(s.scheduled_at).getTime())
      .sort((a, b) => a - b)[0]

    // Notes in window — group by note_type, count distinct sessions
    const notesInWindow = data.notesWithTag.filter(n => new Date(n.created_at).getTime() >= cutoffMs)
    const tagCounts: Record<string, number> = {}
    for (const n of notesInWindow) {
      const tag = n.note_type || 'general'
      if (tag === 'general') continue // skip the default
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
    const totalNotesForBars = Math.max(notesInWindow.length, 1)
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count, total: totalNotesForBars }))

    return {
      sessionsCount,
      firstSessionInWindow,
      topTags,
      notesInWindow: notesInWindow.length,
    }
  }, [data, cutoffMs])

  const tierLabels = {
    ontrack: { en: 'Doing well', fr: 'En bonne voie', es: 'Va bien' },
    watch:   { en: 'To watch',   fr: 'À surveiller',  es: 'Vigilar' },
    checkin: { en: 'Vigilance',  fr: 'Vigilance',     es: 'Vigilancia' },
  }
  // Soft tier palette — light tinted avatar + matching status text
  const tierColors = {
    ontrack: { avatarBg: 'bg-emerald-100', avatarText: 'text-emerald-700', statusText: 'text-emerald-600' },
    watch:   { avatarBg: 'bg-amber-100',   avatarText: 'text-amber-700',   statusText: 'text-amber-600' },
    checkin: { avatarBg: 'bg-rose-100',    avatarText: 'text-rose-700',    statusText: 'text-rose-500' },
  }

  // Tag label resolution — uses i18n if available, else humanizes the slug
  const noteTypeLabel = (slug: string): string => {
    const labels: Record<string, { en: string; fr: string; es: string }> = {
      recurrence:          { en: 'Recurrence',         fr: 'Récurrence',         es: 'Recurrencia' },
      hypothese:           { en: 'Hypothesis',         fr: 'Hypothèse',          es: 'Hipótesis' },
      symptome:            { en: 'Symptom',            fr: 'Symptôme',           es: 'Síntoma' },
      transfert:           { en: 'Transference',       fr: 'Transfert',          es: 'Transferencia' },
      contre_transfert:    { en: 'Countertransference', fr: 'Contre-transfert', es: 'Contratransferencia' },
      ajustement_envisage: { en: 'Planned adjustment', fr: 'Ajustement envisagé', es: 'Ajuste previsto' },
    }
    return labels[slug]?.[locale] || slug.replace(/_/g, ' ')
  }

  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
    { day: 'numeric', month: 'short' }
  )

  return (
    <AnimatePresence>
      {isOpen && data && (
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
            className="fixed right-4 top-4 bottom-4 z-[201] w-full max-w-sm bg-gray-50 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Period filter strip + close — soft pill toggle */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
                {(['week', 'month', '3months'] as Period[]).map(p => {
                  const label = p === 'week'
                    ? t('This week', 'Cette semaine', 'Esta semana')
                    : p === 'month'
                      ? t('This month', 'Ce mois', 'Este mes')
                      : t('3 months', '3 mois', '3 meses')
                  return (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                        period === p ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {/* Header card */}
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${tierColors[data.tier].avatarBg} ${tierColors[data.tier].avatarText} flex items-center justify-center font-semibold text-sm shrink-0`}>
                  {getInitials(data.member.first_name, data.member.last_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {data.member.first_name} {data.member.last_name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                    {(() => {
                      const age = calcAge(data.member.date_of_birth)
                      return age !== null ? <span>{age} {t('yrs', 'ans', 'años')}</span> : null
                    })()}
                    {calcAge(data.member.date_of_birth) !== null && <span>·</span>}
                    <span className={`font-medium ${tierColors[data.tier].statusText}`}>
                      {tierLabels[data.tier][locale].toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-gray-900 tabular-nums">{computed?.sessionsCount ?? 0}</span>
                    <span className="text-sm text-gray-500">
                      {(computed?.sessionsCount ?? 0) === 1 ? t('session', 'séance', 'sesión') : t('sessions', 'séances', 'sesiones')}
                    </span>
                  </div>
                  {computed?.firstSessionInWindow ? (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('since', 'depuis le', 'desde el')} {fmtDate(computed.firstSessionInWindow)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">{t('No sessions in this period', 'Aucune séance sur la période', 'Sin sesiones en este período')}</p>
                  )}
                </div>
              </div>

              {/* Bloom Pulse */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Bloom Pulse</span>
                  {data.pulse?.headline && (
                    <span className="text-[10px] text-gray-400">
                      {t('updated', 'mis à jour', 'actualizado')} {new Date(data.pulse.generatedAt).toLocaleDateString(
                        locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
                        { day: 'numeric', month: 'short' }
                      )}
                    </span>
                  )}
                </div>
                {data.pulse?.headline ? (
                  <>
                    <p className="text-sm text-gray-700 leading-snug mb-3">{data.pulse.headline}</p>
                    <button
                      onClick={() => onOpenPulseModal?.(data.member.id)}
                      className="w-full px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                    >
                      {t('View full Pulse', 'Voir le Pulse complet', 'Ver Pulse completo')}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {t(
                        'Contextual synthesis from sessions, mood, and therapeutic alliance.',
                        'Synthèse contextualisée à partir des séances, de l\'humeur et de l\'alliance thérapeutique.',
                        'Síntesis contextual a partir de sesiones, estado de ánimo y alianza terapéutica.'
                      )}
                    </p>
                    <button
                      onClick={() => onOpenPulseModal?.(data.member.id)}
                      className="w-full px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                    >
                      {t('Generate Pulse', 'Générer l\'analyse', 'Generar análisis')}
                    </button>
                  </>
                )}
              </div>

              {/* Patterns */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Patterns</span>
                  <span className="text-[10px] text-gray-400">
                    {t('top 3 motifs', 'top 3 motifs', 'top 3 patrones')}
                  </span>
                </div>
                {computed && computed.topTags.length > 0 ? (
                  <div className="space-y-4">
                    {computed.topTags.map(({ tag, count, total }, idx) => {
                      const colors = TAG_COLORS[tag] || FALLBACK_TAG_PALETTE[idx % FALLBACK_TAG_PALETTE.length]
                      const widthPct = Math.max(8, Math.round((count / total) * 100))
                      return (
                        <div key={tag}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-gray-900">{noteTypeLabel(tag)}</span>
                            <span className={`text-xs font-semibold ${colors.text}`}>
                              {count}/{total} {t('notes', 'notes', 'notas')}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full p-[2px]">
                            {count > 0 && (
                              <div
                                className={`${colors.bar} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${widthPct}%`, minWidth: '12px' }}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    {t('No tagged notes yet in this period', 'Pas encore de notes taguées sur la période', 'Sin notas etiquetadas en este período')}
                  </p>
                )}
              </div>

              {/* Resources completed */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-700">{t('Resources completed', 'Ressources complétées', 'Recursos completados')}</span>
                  </div>
                  <span className="text-sm tabular-nums">
                    <span className="font-semibold text-gray-900">{data.completedResources}</span>
                    <span className="text-gray-400"> / {data.totalAssignedResources}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full p-[2px]">
                  {data.completedResources > 0 && data.totalAssignedResources > 0 && (
                    <div
                      className="bg-gradient-to-r from-indigo-300 via-violet-400 to-violet-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((data.completedResources / data.totalAssignedResources) * 100)}%`,
                        minWidth: '12px',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Footer link — opens full profile in new tab to preserve dashboard state */}
              <Link
                href={`/members/${data.member.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 rounded-2xl bg-white hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 text-center transition-colors flex items-center justify-center gap-1.5"
              >
                {t('View full profile', 'Voir le dossier complet', 'Ver perfil completo')}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
