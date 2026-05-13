'use client'

// Status indicator + legend for the bookings page and patient detail
// Sessions tab. Exports:
//   - StatusDot: the colored circle with an inner icon used on each
//     timeline row, so the status is readable without relying on color
//     alone (accessibility for colour-blind users).
//   - SessionDotLegend: small Info button in section headers that opens
//     a popover explaining each color/icon combination.

import { useState, useRef, useEffect } from 'react'
import {
  Info,
  Calendar as CalendarIcon,
  AlertCircle,
  Hourglass,
  Check,
  X as XIcon,
  Ban,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export type StatusKey =
  | 'scheduled'
  | 'awaiting'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'no_show'

// Single source of truth for dot color + icon per status. Both the
// timeline dot and the legend popover read from this map.
export const STATUS_VISUAL: Record<StatusKey, {
  bg: string
  ring: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  scheduled: { bg: 'bg-blue-500',    ring: 'ring-blue-100',    Icon: CalendarIcon },
  awaiting:  { bg: 'bg-amber-500',   ring: 'ring-amber-100',   Icon: AlertCircle },
  pending:   { bg: 'bg-amber-300',   ring: 'ring-amber-100',   Icon: Hourglass },
  completed: { bg: 'bg-emerald-500', ring: 'ring-emerald-100', Icon: Check },
  cancelled: { bg: 'bg-red-400',     ring: 'ring-red-100',     Icon: XIcon },
  no_show:   { bg: 'bg-gray-500',    ring: 'ring-gray-200',    Icon: Ban },
}

// Colored circle + inner white icon, sized for the timeline column.
export function StatusDot({ status }: { status: StatusKey }) {
  const v = STATUS_VISUAL[status] || STATUS_VISUAL.scheduled
  const Icon = v.Icon
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full ring-4 ${v.bg} ${v.ring}`}
    >
      <Icon className="w-3 h-3 text-white" />
    </span>
  )
}

export function SessionDotLegend() {
  const { locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const t = (en: string, fr: string, es: string) =>
    locale === 'fr' ? fr : locale === 'es' ? es : en

  const items: { key: StatusKey; label: string; hint: string }[] = [
    { key: 'scheduled', label: t('Scheduled', 'Planifiée', 'Programada'),
      hint: t('Upcoming, on the books', 'À venir', 'Próxima') },
    { key: 'awaiting',  label: t('Awaiting outcome', 'En attente', 'Pendiente'),
      hint: t('Past start time — mark Show or No show', 'Passée — marquer Présent ou Absent', 'Pasada — marcar Presente o Ausente') },
    { key: 'completed', label: t('Completed', 'Terminée', 'Completada'),
      hint: t('Session happened', 'Séance terminée', 'Sesión completada') },
    { key: 'cancelled', label: t('Cancelled', 'Annulée', 'Cancelada'),
      hint: t('Cancelled with reason', 'Annulée avec motif', 'Cancelada con razón') },
    { key: 'no_show',   label: t('No-show', 'Absent', 'Ausente'),
      hint: t('Patient did not attend', 'Patient absent', 'Paciente ausente') },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={t('Status colors', 'Couleurs des statuts', 'Colores de estado')}
        title={t('What the dots mean', 'Que signifient les points', 'Qué significan los puntos')}
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-72 py-3 px-3">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-2 px-1">
            {t('What the dots mean', 'Que signifient les points', 'Qué significan los puntos')}
          </p>
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.key} className="flex items-start gap-2.5 px-1">
                <span className="mt-0.5 shrink-0">
                  <StatusDot status={item.key} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                  <p className="text-[11px] text-gray-500 leading-snug">{item.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
