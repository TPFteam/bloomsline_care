'use client'

import { useState } from 'react'
import { Check, Wallet, CircleSlash } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import type { PaymentStatus } from '@/types/member'
import { paymentLabel, paymentShortLabel, nextPaymentStatus } from '@/lib/payments'

interface PaymentBadgeProps {
  status: PaymentStatus
  table: 'sessions' | 'bookings'
  recordId: string
  onUpdate?: (newStatus: PaymentStatus) => void
  /** Compact chip: icon + short word ("Paid"/"Unpaid"/"Free") for dense rows.
   *  Still labelled so it's never mistaken for a completed/closed status. */
  compact?: boolean
  /** Display only — no click-to-cycle (e.g. on the calendar, where payment is
   *  set in the close flow, not here). */
  readOnly?: boolean
}

// Per-state visuals: paid = green, to-be-paid = amber, free (not billed) = gray.
const STYLE: Record<PaymentStatus, { tint: string; hover: string; Icon: typeof Check }> = {
  paid:   { tint: 'text-emerald-600 bg-emerald-50', hover: 'hover:bg-emerald-100', Icon: Check },
  unpaid: { tint: 'text-amber-600 bg-amber-50',     hover: 'hover:bg-amber-100',   Icon: Wallet },
  free:   { tint: 'text-gray-400 bg-gray-100',      hover: 'hover:bg-gray-200',    Icon: CircleSlash },
}

export function PaymentBadge({ status, table, recordId, onUpdate, compact = false, readOnly = false }: PaymentBadgeProps) {
  const supabase = createClient()
  const { locale } = useLanguage()
  const [current, setCurrent] = useState<PaymentStatus>(status || 'unpaid')

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const next = nextPaymentStatus(current)
    setCurrent(next)
    onUpdate?.(next)
    await supabase.from(table).update({ payment_status: next }).eq('id', recordId)
  }

  const label = paymentLabel(current, locale)
  const { tint, hover, Icon } = STYLE[current] ?? STYLE.unpaid

  // Compact chip — icon + short word, so it reads clearly next to the session's
  // completed/closed status instead of being an ambiguous lone icon.
  if (compact) {
    const short = paymentShortLabel(current, locale)
    const base = `inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${tint}`
    if (readOnly) {
      return (
        <span title={label} aria-label={label} className={base}>
          <Icon className="w-3 h-3 shrink-0" /> {short}
        </span>
      )
    }
    return (
      <button
        onClick={handleClick}
        title={`${label} · ${locale === 'fr' ? 'cliquer pour changer' : 'click to change'}`}
        aria-label={label}
        className={`${base} ${hover} transition-all cursor-pointer`}
      >
        <Icon className="w-3 h-3 shrink-0" /> {short}
      </button>
    )
  }

  if (readOnly) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${tint}`} title={label}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${tint} ${hover}`}
      title={locale === 'fr' ? 'Cliquer pour changer' : 'Click to change'}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  )
}
