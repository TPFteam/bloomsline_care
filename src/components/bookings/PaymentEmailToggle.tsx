'use client'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  locale: string
  className?: string
}

/**
 * Per-close toggle for the "Awaiting payment" thank-you + payment-link email.
 * Defaults on; matches the app's small switch style. Callers render it only
 * when a payment link is configured and the chosen payment is "unpaid".
 *
 * Shared across all three close surfaces (bookings, SessionsTab, dashboard
 * CloseSessionPopup) so they stay in parity.
 */
export function PaymentEmailToggle({ checked, onChange, locale, className = 'mb-5 -mt-2' }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={`flex items-center justify-between gap-3 w-full text-left ${className}`}
    >
      <span className="text-sm text-gray-600">
        {locale === 'fr'
          ? 'Envoyer un email au patient avec le lien de paiement'
          : 'Send the patient an email with the payment link'}
      </span>
      <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-teal-500' : 'bg-gray-200'}`}>
        <div className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
      </div>
    </button>
  )
}
