'use client'

import { useState } from 'react'
import { Check, CircleDashed } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'

type PaymentStatus = 'paid' | 'unpaid'

interface PaymentBadgeProps {
  status: PaymentStatus
  table: 'sessions' | 'bookings'
  recordId: string
  onUpdate?: (newStatus: PaymentStatus) => void
}

export function PaymentBadge({ status, table, recordId, onUpdate }: PaymentBadgeProps) {
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
      {isPaid
        ? (locale === 'fr' ? 'Payé' : 'Paid')
        : (locale === 'fr' ? 'Impayé' : 'Unpaid')
      }
    </button>
  )
}
