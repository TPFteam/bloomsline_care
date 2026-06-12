'use client'

import { useState } from 'react'
import { Check, CircleDashed, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'

type PaymentStatus = 'paid' | 'unpaid'

interface PaymentBadgeProps {
  status: PaymentStatus
  table: 'sessions' | 'bookings'
  recordId: string
  onUpdate?: (newStatus: PaymentStatus) => void
  /** Render just the icon (no "Paid"/"Unpaid" text) — for dense rows. */
  iconOnly?: boolean
  /** Display only — no click-to-toggle (e.g. on the calendar, where payment is
   *  set in the close flow, not here). */
  readOnly?: boolean
}

export function PaymentBadge({ status, table, recordId, onUpdate, iconOnly = false, readOnly = false }: PaymentBadgeProps) {
  const supabase = createClient()
  const { locale } = useLanguage()
  const [current, setCurrent] = useState<PaymentStatus>(status || 'unpaid')

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const next: PaymentStatus = current === 'paid' ? 'unpaid' : 'paid'
    setCurrent(next)
    onUpdate?.(next)
    await supabase.from(table).update({ payment_status: next }).eq('id', recordId)
  }

  const isPaid = current === 'paid'

  const label = isPaid
    ? (locale === 'fr' ? 'Payé' : 'Paid')
    : (locale === 'fr' ? 'Impayé' : 'Unpaid')

  if (iconOnly) {
    // Wallet = "this is about payment"; green = paid, gray = still owed.
    const tint = isPaid ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-100'
    if (readOnly) {
      return (
        <span
          title={label}
          aria-label={label}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${tint}`}
        >
          <Wallet className="w-3.5 h-3.5" />
        </span>
      )
    }
    return (
      <button
        onClick={handleClick}
        title={`${label} · ${locale === 'fr' ? 'cliquer pour changer' : 'click to toggle'}`}
        aria-label={label}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all cursor-pointer ${tint} ${
          isPaid ? 'hover:bg-emerald-100' : 'hover:bg-gray-200'
        }`}
      >
        <Wallet className="w-3.5 h-3.5" />
      </button>
    )
  }

  const textTint = isPaid ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'
  if (readOnly) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${textTint}`} title={label}>
        {isPaid ? <Check className="w-3 h-3" /> : <CircleDashed className="w-3 h-3" />}
        {label}
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
        isPaid
          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
      title={locale === 'fr' ? 'Cliquer pour changer' : 'Click to toggle'}
    >
      {isPaid ? <Check className="w-3 h-3" /> : <CircleDashed className="w-3 h-3" />}
      {label}
    </button>
  )
}
