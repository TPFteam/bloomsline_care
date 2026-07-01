'use client'

import { useState } from 'react'
import { Loader2, Check, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/context'

interface Props {
  table: 'sessions' | 'bookings'
  recordId: string
  /** Patient display name, for the confirmation prompt. */
  patientName: string
  /** Already-formatted session date + time (correct timezone), shown in the
   *  prompt and sent to the server for the email. */
  dateLabel: string
  /** When the last reminder was sent (from the record). Drives the 24h
   *  cooldown so the same reminder can't be re-sent within a day. */
  reminderSentAt?: string | null
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000

/**
 * The "Unpaid" payment badge for a CLOSED session/booking, merged with a
 * one-tap payment-reminder action: it reads as a single wallet pill
 * (🪙 Unpaid · ✉️) — tapping it asks to send a gentle reminder email to the
 * patient via Postmark. Render only for closed + unpaid sessions.
 */
export function PaymentReminderButton({ table, recordId, patientName, dateLabel, reminderSentAt }: Props) {
  const { locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  // In cooldown if a reminder was sent within the last 24h (persisted), or just
  // sent in this view.
  const recentlySent = !!reminderSentAt && (Date.now() - new Date(reminderSentAt).getTime() < COOLDOWN_MS)
  const [sent, setSent] = useState(recentlySent)

  const fr = locale === 'fr'
  const es = locale === 'es'

  const send = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/payment-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, recordId, locale, dateLabel }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.error === 'too_soon') {
          // Already reminded in the last 24h — reflect the cooldown.
          setSent(true)
          setOpen(false)
          toast.error(fr ? 'Un rappel a déjà été envoyé. Réessayez dans 24 h.' : es ? 'Ya se envió un recordatorio. Inténtelo de nuevo en 24 h.' : 'A reminder was already sent. Try again in 24h.')
          return
        }
        const msg = data?.error === 'no_email'
          ? (fr ? "Ce patient n'a pas d'email enregistré." : es ? 'Este paciente no tiene un correo registrado.' : 'This patient has no email on file.')
          : data?.error === 'already_paid'
            ? (fr ? 'Cette séance est déjà réglée.' : es ? 'Esta sesión ya está pagada.' : 'This session is already paid.')
            : (fr ? "Échec de l'envoi du rappel." : es ? 'No se pudo enviar el recordatorio.' : 'Could not send the reminder.')
        toast.error(msg)
        return
      }
      setSent(true)
      setOpen(false)
      toast.success(fr ? 'Rappel de paiement envoyé.' : es ? 'Recordatorio de pago enviado.' : 'Payment reminder sent.')
    } catch {
      toast.error(fr ? "Échec de l'envoi du rappel." : es ? 'No se pudo enviar el recordatorio.' : 'Could not send the reminder.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={sent}
        onClick={(e) => { e.stopPropagation(); if (!sent) setOpen(true) }}
        title={sent
          ? (fr ? 'Rappel envoyé — possible à nouveau dans 24 h' : es ? 'Recordatorio enviado — disponible de nuevo en 24 h' : 'Reminder sent — available again in 24h')
          : (fr ? 'Envoyer un rappel de paiement' : es ? 'Enviar recordatorio de pago' : 'Send a payment reminder')}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
          sent
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
            : 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200'
        }`}
      >
        {sent ? <Check className="w-3.5 h-3.5" /> : <Wallet className="w-3.5 h-3.5" />}
        <span>{sent
          ? (fr ? 'Rappel envoyé' : es ? 'Enviado' : 'Sent')
          : (fr ? 'Rappel' : es ? 'Recordar' : 'Remind')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={(e) => { e.stopPropagation(); if (!sending) setOpen(false) }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {fr ? 'Envoyer un rappel de paiement' : es ? 'Enviar recordatorio de pago' : 'Send payment reminder'}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {fr
                ? <>Envoyer un rappel de paiement à <strong>{patientName}</strong> pour la séance du <strong>{dateLabel}</strong> ?</>
                : es
                  ? <>¿Enviar un recordatorio de pago a <strong>{patientName}</strong> por la sesión del <strong>{dateLabel}</strong>?</>
                  : <>Send a payment reminder to <strong>{patientName}</strong> for the session on <strong>{dateLabel}</strong>?</>}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {fr ? 'Annuler' : es ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-60"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {fr ? 'Envoyer' : es ? 'Enviar' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
