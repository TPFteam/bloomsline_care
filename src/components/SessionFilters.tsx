'use client'

// Shared filter bar for the SessionsTab and bookings page timelines.
// All four filter categories are dropdown buttons that open a small
// multi-select panel — keeps the bar compact even when many options
// would otherwise overflow. The Date dropdown is single-select with
// presets + a custom range; the others are multi-select.
//
// The component is presentational — parent owns the state. Use the
// exported `inDateRange` helper to apply the date filter to a row.

import { useRef, useState, useEffect } from 'react'
import { ChevronDown, RotateCcw, Check } from 'lucide-react'

export type DateRangePreset =
  | 'all'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_year'
  | 'custom'

interface FilterOption {
  key: string
  label: string
}

interface SessionFiltersProps {
  dateRange: DateRangePreset
  onDateRangeChange: (r: DateRangePreset) => void
  customFrom: string | null            // ISO yyyy-mm-dd
  customTo: string | null              // ISO yyyy-mm-dd
  onCustomChange: (from: string | null, to: string | null) => void

  statusOptions: FilterOption[]
  statusFilters: Set<string>
  onStatusFiltersChange: (next: Set<string>) => void

  typeOptions: FilterOption[]
  typeFilters: Set<string>
  onTypeFiltersChange: (next: Set<string>) => void

  paymentOptions: FilterOption[]
  paymentFilters: Set<string>
  onPaymentFiltersChange: (next: Set<string>) => void

  // Optional patient/member filter. When omitted, the chip stays
  // hidden — used by the bookings page (which spans all patients)
  // but not the SessionsTab (already scoped to a single patient).
  memberOptions?: FilterOption[]
  memberFilters?: Set<string>
  onMemberFiltersChange?: (next: Set<string>) => void

  locale: string
  onReset: () => void
}

const DATE_LABELS: Record<DateRangePreset, Record<string, string>> = {
  all:           { en: 'All time',     fr: 'Tout',                 es: 'Todo' },
  this_week:     { en: 'This week',    fr: 'Cette semaine',        es: 'Esta semana' },
  this_month:    { en: 'This month',   fr: 'Ce mois-ci',           es: 'Este mes' },
  last_month:    { en: 'Last month',   fr: 'Mois dernier',         es: 'Mes pasado' },
  last_3_months: { en: 'Last 3 months',fr: '3 derniers mois',      es: 'Últimos 3 meses' },
  this_year:     { en: 'This year',    fr: 'Cette année',          es: 'Este año' },
  custom:        { en: 'Custom range', fr: 'Période personnalisée',es: 'Rango personalizado' },
}

// Generic multi-select dropdown. Hides itself completely if `options`
// is empty (so the bar doesn't show empty buttons).
function MultiSelectDropdown({
  label, options, selected, onChange, accentClass = 'bg-gray-900 border-gray-900 text-white', locale,
}: {
  label: string
  options: FilterOption[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  accentClass?: string
  locale: string
}) {
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
  if (options.length === 0) return null
  const isActive = selected.size > 0
  const allLabel = locale === 'fr' ? 'tous' : locale === 'es' ? 'todos' : 'all'
  const buttonText = isActive
    ? `${label}: ${selected.size}`
    : `${label}: ${allLabel}`
  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key); else next.add(key)
    onChange(next)
  }
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
          isActive ? accentClass : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        {buttonText}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[220px] max-h-80 overflow-y-auto py-1">
          {options.map(opt => {
            const active = selected.has(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 ${
                  active ? 'text-gray-900 font-medium' : 'text-gray-700'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  active ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                }`}>
                  {active && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                {opt.label}
              </button>
            )
          })}
          {isActive && (
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                type="button"
                onClick={() => onChange(new Set())}
                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
              >
                {locale === 'fr' ? 'Effacer' : locale === 'es' ? 'Borrar' : 'Clear'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SessionFilters({
  dateRange, onDateRangeChange,
  customFrom, customTo, onCustomChange,
  statusOptions, statusFilters, onStatusFiltersChange,
  typeOptions, typeFilters, onTypeFiltersChange,
  paymentOptions, paymentFilters, onPaymentFiltersChange,
  memberOptions, memberFilters, onMemberFiltersChange,
  locale, onReset,
}: SessionFiltersProps) {
  const t = (en: string, fr: string, es: string) =>
    locale === 'fr' ? fr : locale === 'es' ? es : en

  const [dateOpen, setDateOpen] = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!dateOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDateOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [dateOpen])

  const isFiltering =
    dateRange !== 'all' ||
    statusFilters.size > 0 ||
    typeFilters.size > 0 ||
    paymentFilters.size > 0 ||
    (memberFilters?.size ?? 0) > 0

  const dateLabel = DATE_LABELS[dateRange][locale] || DATE_LABELS[dateRange].en

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range dropdown */}
      <div ref={dateRef} className="relative">
        <button
          type="button"
          onClick={() => setDateOpen(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            dateRange === 'all'
              ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              : 'bg-gray-900 border-gray-900 text-white'
          }`}
        >
          {t('Date', 'Date', 'Fecha')}: {dateLabel}
          <ChevronDown className="w-3 h-3" />
        </button>
        {dateOpen && (
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 min-w-[200px] py-1">
            {(['all', 'this_week', 'this_month', 'last_month', 'last_3_months', 'this_year', 'custom'] as const).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => { onDateRangeChange(key); if (key !== 'custom') setDateOpen(false) }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                  dateRange === key ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700'
                }`}
              >
                {DATE_LABELS[key][locale] || DATE_LABELS[key].en}
              </button>
            ))}
            {dateRange === 'custom' && (
              <div className="border-t border-gray-100 mt-1 pt-2 px-3 pb-2 space-y-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                    {t('From', 'Du', 'Desde')}
                  </label>
                  <input
                    type="date"
                    value={customFrom || ''}
                    onChange={(e) => onCustomChange(e.target.value || null, customTo)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                    {t('To', 'Au', 'Hasta')}
                  </label>
                  <input
                    type="date"
                    value={customTo || ''}
                    onChange={(e) => onCustomChange(customFrom, e.target.value || null)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDateOpen(false)}
                  className="w-full text-center text-xs text-gray-700 hover:bg-gray-50 py-1.5 rounded"
                >
                  {t('Done', 'OK', 'Listo')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <MultiSelectDropdown
        label={t('Status', 'Statut', 'Estado')}
        options={statusOptions}
        selected={statusFilters}
        onChange={onStatusFiltersChange}
        locale={locale}
      />

      <MultiSelectDropdown
        label={t('Type', 'Type', 'Tipo')}
        options={typeOptions}
        selected={typeFilters}
        onChange={onTypeFiltersChange}
        accentClass="bg-violet-600 border-violet-600 text-white"
        locale={locale}
      />

      <MultiSelectDropdown
        label={t('Payment', 'Paiement', 'Pago')}
        options={paymentOptions}
        selected={paymentFilters}
        onChange={onPaymentFiltersChange}
        accentClass="bg-emerald-600 border-emerald-600 text-white"
        locale={locale}
      />

      {memberOptions && memberFilters && onMemberFiltersChange && (
        <MultiSelectDropdown
          label={t('Patient', 'Patient', 'Paciente')}
          options={memberOptions}
          selected={memberFilters}
          onChange={onMemberFiltersChange}
          accentClass="bg-blue-600 border-blue-600 text-white"
          locale={locale}
        />
      )}

      {isFiltering && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-900 ml-auto"
        >
          <RotateCcw className="w-3 h-3" />
          {t('Reset', 'Réinitialiser', 'Restablecer')}
        </button>
      )}
    </div>
  )
}

// Apply a date-range filter to a Date instance. Returns true if the
// row should be visible. Used by callers when filtering session lists.
export function inDateRange(
  d: Date,
  range: DateRangePreset,
  customFrom: string | null,
  customTo: string | null,
): boolean {
  if (range === 'all') return true
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  switch (range) {
    case 'this_week': {
      const day = now.getDay() || 7
      const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - (day - 1))
      const nextMonday = new Date(monday.getTime() + 7 * dayMs)
      return d >= monday && d < nextMonday
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return d >= start && d < end
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      return d >= start && d < end
    }
    case 'last_3_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return d >= start && d <= now
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date(now.getFullYear() + 1, 0, 1)
      return d >= start && d < end
    }
    case 'custom': {
      if (!customFrom && !customTo) return true
      const from = customFrom ? new Date(customFrom + 'T00:00:00') : null
      const to = customTo ? new Date(customTo + 'T23:59:59') : null
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    }
    default:
      return true
  }
}
