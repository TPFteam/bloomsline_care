import { createClient } from '@/lib/supabase/browser-client'

// Fire-and-forget: ask the server to email the client a thank-you + payment
// link when a session is closed as "Awaiting payment". The endpoint no-ops
// unless the practitioner configured a payment link, so it's safe to call on
// every unpaid close. Best-effort — the manual reminder remains available.
export function notifyPaymentRequest(bookingId: string, locale: string) {
  fetch('/api/payment-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, locale }),
  }).catch(() => { /* best-effort */ })
}

// Does this practitioner have a payment link configured? Gates the "send
// payment email" toggle on the close popups — no link means there is no email
// to send, so we hide the toggle rather than promise an email that can't go.
export async function fetchHasPaymentLink(practitionerId: string): Promise<boolean> {
  try {
    const sb = createClient()
    const { data } = await sb
      .from('booking_settings')
      .select('payment_url')
      .eq('user_id', practitionerId)
      .maybeSingle()
    return !!(data?.payment_url && data.payment_url.trim())
  } catch {
    return false
  }
}
