'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'

type PaymentStatus = 'paid' | 'unpaid'

const CYCLE: PaymentStatus[] = ['unpaid', 'paid']

const CONFIG: Record<PaymentStatus, { bg: string; text: string; label: { en: string; fr: string } }> = {
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: { en: 'Paid', fr: 'Payé' } },
  unpaid: { bg: 'bg-red-100', text: 'text-red-600', label: { en: 'Unpaid', fr: 'Impayé' } },
}

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

  const config = CONFIG[current]

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const idx = CYCLE.indexOf(current)
    const next = CYCLE[(idx + 1) % CYCLE.length]
    setCurrent(next)
    onUpdate?.(next)
    await supabase.from(table).update({ payment_status: next }).eq('id', recordId)
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.text} hover:opacity-80 transition-opacity cursor-pointer`}
      title={locale === 'fr' ? 'Cliquer pour changer' : 'Click to toggle'}
    >
      <CreditCard className="w-3 h-3" />
      {config.label[locale === 'fr' ? 'fr' : 'en']}
    </button>
  )
}
