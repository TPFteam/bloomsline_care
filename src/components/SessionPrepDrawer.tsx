'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, RotateCcw, AlertTriangle, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'

interface PrepBooking {
  member_id: string | null
  client_name: string
  start_time: string
  session_type: string
}

interface PrepResult {
  header: { sessionNumber: number; sessionType: string; lastSeen: string | null; gapDays: number | null }
  statusFlag: 'cancelled' | 'no_show' | 'long_gap' | 'first' | null
  recentSessions: { date: string; status: string }[]
  betweenSessions: { checkIns: number; moodTrend: 'up' | 'down' | 'steady' | null; windowDays: number } | null
  whereLeftOff: string | null
  thread: string[]
  toRevisit: string | null
  notesUsed: number
}

interface Props {
  isOpen: boolean
  booking: PrepBooking | null
  onClose: () => void
  locale: 'en' | 'fr' | 'es'
  sessionTypeLabel?: (raw: string) => string
}

export function SessionPrepDrawer({ isOpen, booking, onClose, locale, sessionTypeLabel }: Props) {
  const t = (en: string, fr: string, es: string) => (locale === 'fr' ? fr : locale === 'es' ? es : en)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PrepResult | null>(null)

  const load = useCallback(async () => {
    if (!booking?.member_id) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/session-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          memberId: booking.member_id,
          sessionType: booking.session_type,
          startTime: booking.start_time,
          locale,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setData((await res.json()) as PrepResult)
    } catch {
      setError(t('Could not generate the prep. Try again.', 'Impossible de générer la préparation. Réessayez.', 'No se pudo generar. Inténtalo de nuevo.'))
    } finally {
      setLoading(false)
    }
  }, [booking?.member_id, booking?.start_time, booking?.session_type, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && booking?.member_id) load()
  }, [isOpen, booking?.member_id, booking?.start_time, load])

  if (!isOpen || !booking) return null

  const dl = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
  const dateLabel = new Date(booking.start_time).toLocaleDateString(dl, { weekday: 'short', day: 'numeric', month: 'short' })
  const timeLabel = new Date(booking.start_time).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: locale !== 'fr' })
  const typeLabel = sessionTypeLabel ? sessionTypeLabel(booking.session_type) : booking.session_type

  const lastSeenLabel = (() => {
    if (!data?.header?.gapDays && data?.header?.gapDays !== 0) return null
    const d = data.header.gapDays
    if (d <= 0) return t('Last seen today', "Vu aujourd'hui", 'Visto hoy')
    return t(`Last seen ${d} day${d === 1 ? '' : 's'} ago`, `Vu il y a ${d} jour${d === 1 ? '' : 's'}`, `Visto hace ${d} día${d === 1 ? '' : 's'}`)
  })()

  const banner = (() => {
    if (!data?.statusFlag) return null
    const map: Record<string, { text: string; blue?: boolean }> = {
      cancelled: { text: t('Last session was cancelled — picking up from the one before.', 'La dernière séance a été annulée — on reprend la précédente.', 'La última sesión se canceló — retomamos la anterior.') },
      no_show: { text: t('Patient no-showed last session. Possibly a re-engagement moment.', "Le patient ne s'est pas présenté à la dernière séance. Peut-être un moment de reprise de contact.", 'El paciente no asistió a la última sesión. Posible momento de reenganche.') },
      long_gap: { text: t('First session in a while — the patient is returning.', 'Première séance depuis un moment — le patient revient.', 'Primera sesión en un tiempo — el paciente regresa.') },
      first: { text: t('First session — no prior notes yet.', 'Première séance — pas encore de notes.', 'Primera sesión — aún sin notas.'), blue: true },
    }
    return map[data.statusFlag] || null
  })()

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
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{t('Session prep', 'Préparation', 'Preparación')}</h2>
                  <p className="text-xs text-gray-500 truncate">{booking.client_name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                aria-label={t('Close', 'Fermer', 'Cerrar')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{dateLabel} · {timeLabel}</span>
              {typeLabel && <span>· {typeLabel}</span>}
              {data && <span>· {t(`Session ${data.header.sessionNumber}`, `Séance ${data.header.sessionNumber}`, `Sesión ${data.header.sessionNumber}`)}</span>}
              {lastSeenLabel && <span>· {lastSeenLabel}</span>}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-3 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded mt-6" />
                <div className="flex gap-2"><div className="h-6 w-16 bg-gray-100 rounded-full" /><div className="h-6 w-20 bg-gray-100 rounded-full" /></div>
              </div>
            )}

            {!loading && error && (
              <div className="text-sm text-gray-600">
                <p>{error}</p>
                <button onClick={load} className="mt-3 inline-flex items-center gap-1.5 text-violet-700 hover:text-violet-800 text-sm font-medium">
                  <RotateCcw className="w-3.5 h-3.5" /> {t('Retry', 'Réessayer', 'Reintentar')}
                </button>
              </div>
            )}

            {!loading && !error && data && (
              <div className="space-y-6">
                {banner && (
                  <div className={`flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm ${banner.blue ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{banner.text}</span>
                  </div>
                )}

                {data.whereLeftOff && (
                  <section>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-medium mb-1.5">{t('Where you left off', 'Où vous en étiez', 'Dónde lo dejaron')}</p>
                    <p className="text-[15px] text-gray-800 leading-relaxed">{data.whereLeftOff}</p>
                  </section>
                )}

                {data.thread.length > 0 && (
                  <section>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-medium mb-2">{t('The thread', 'Le fil', 'El hilo')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.thread.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">{tag}</span>
                      ))}
                    </div>
                  </section>
                )}

                {data.toRevisit && (
                  <section>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-medium mb-1.5">{t('To revisit', 'À revoir', 'Para retomar')}</p>
                    <p className="text-[15px] text-gray-800 leading-relaxed">{data.toRevisit}</p>
                  </section>
                )}

                {/* Notes-derived content empty */}
                {!data.whereLeftOff && data.thread.length === 0 && !data.toRevisit && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4 shrink-0 mt-0.5 text-gray-300" />
                    <span>{t('No recent notes to summarize yet.', 'Pas encore de notes récentes à résumer.', 'Aún no hay notas recientes para resumir.')}</span>
                  </div>
                )}

                {/* Between sessions (Phase 2) */}
                {data.betweenSessions && data.betweenSessions.checkIns > 0 && (
                  <section>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-medium mb-1.5">{t('Between sessions', 'Entre les séances', 'Entre sesiones')}</p>
                    <p className="text-[15px] text-gray-800 leading-relaxed">
                      {t(
                        `${data.betweenSessions.checkIns} check-in${data.betweenSessions.checkIns === 1 ? '' : 's'}`,
                        `${data.betweenSessions.checkIns} suivi${data.betweenSessions.checkIns === 1 ? '' : 's'}`,
                        `${data.betweenSessions.checkIns} registro${data.betweenSessions.checkIns === 1 ? '' : 's'}`,
                      )}
                      {data.betweenSessions.moodTrend && (
                        <span className="text-gray-500"> · {
                          data.betweenSessions.moodTrend === 'down'
                            ? t('mood trending lower', 'humeur en baisse', 'ánimo a la baja')
                            : data.betweenSessions.moodTrend === 'up'
                              ? t('mood trending up', 'humeur en hausse', 'ánimo al alza')
                              : t('mood steady', 'humeur stable', 'ánimo estable')
                        }</span>
                      )}
                    </p>
                  </section>
                )}

                {/* Last 3 sessions */}
                {data.recentSessions.length > 0 && (
                  <section>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-gray-400 font-medium mb-2">{t('Recent sessions', 'Séances récentes', 'Sesiones recientes')}</p>
                    <div className="space-y-1.5">
                      {data.recentSessions.map((s, i) => {
                        const tone = s.status === 'completed' ? 'text-gray-600'
                          : s.status === 'cancelled' || s.status === 'no_show' ? 'text-amber-700'
                          : 'text-gray-500'
                        const lbl = ({
                          completed: t('Completed', 'Terminée', 'Completada'),
                          cancelled: t('Cancelled', 'Annulée', 'Cancelada'),
                          no_show: t('No-show', 'Absent', 'Ausente'),
                          scheduled: t('Scheduled', 'Planifiée', 'Programada'),
                        } as Record<string, string>)[s.status] || s.status
                        return (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{new Date(s.date).toLocaleDateString(dl, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className={`text-xs ${tone}`}>{lbl}</span>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && data && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-[11px] text-gray-500">
                {data.notesUsed > 0
                  ? t(`From your last ${data.notesUsed} note${data.notesUsed === 1 ? '' : 's'}`, `D'après vos ${data.notesUsed} dernière${data.notesUsed === 1 ? '' : 's'} note${data.notesUsed === 1 ? '' : 's'}`, `De tus últimas ${data.notesUsed} nota${data.notesUsed === 1 ? '' : 's'}`)
                  : t('Context only — not advice', 'Contexte seulement — pas de conseil', 'Solo contexto — sin consejos')}
              </p>
              <button onClick={load} className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-violet-700 transition-colors">
                <RotateCcw className="w-3 h-3" /> {t('Regenerate', 'Régénérer', 'Regenerar')}
              </button>
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  )
}
