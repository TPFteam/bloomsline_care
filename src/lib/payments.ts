import type { PaymentStatus } from '@/types/member'

// The three payment states, in the order shown in selectors:
//   paid   — collected
//   unpaid — "To be paid": owed / receivable (reminders fire here)
//   free   — no charge: comped / waived (excluded from reminders & receivables)
export const PAYMENT_OPTIONS: PaymentStatus[] = ['paid', 'unpaid', 'free']

const LABELS: Record<PaymentStatus, { en: string; fr: string; es: string }> = {
  paid:   { en: 'Paid',       fr: 'Payé',     es: 'Pagado' },
  unpaid: { en: 'Awaiting payment', fr: 'En attente', es: 'Por cobrar' },
  free:   { en: 'Not billed', fr: 'Non facturé', es: 'No facturado' },
}

export function paymentLabel(status: PaymentStatus | null | undefined, locale?: string): string {
  const l = LABELS[(status ?? 'unpaid') as PaymentStatus] ?? LABELS.unpaid
  return locale === 'fr' ? l.fr : locale === 'es' ? l.es : l.en
}

// Next state when cycling the badge by click (paid → to-be-paid → free → …).
export function nextPaymentStatus(status: PaymentStatus): PaymentStatus {
  return status === 'paid' ? 'unpaid' : status === 'unpaid' ? 'free' : 'paid'
}
