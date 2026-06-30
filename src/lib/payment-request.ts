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

// Does the given session type have a payment link? (Or, with no sessionTypeId,
// does ANY type?) Gates the "send payment email" toggle on the close popups so
// it only appears when the booking's own session type can actually be paid.
export async function fetchHasPaymentLink(practitionerId: string, sessionTypeId?: string | null): Promise<boolean> {
  try {
    const sb = createClient()
    const { data } = await sb
      .from('booking_settings')
      .select('session_types')
      .eq('user_id', practitionerId)
      .maybeSingle()
    const types = (data?.session_types as Array<{ id: string; payment_url?: string | null }>) || []
    const hasLink = (t?: { payment_url?: string | null }) => !!(t?.payment_url && t.payment_url.trim())
    if (sessionTypeId) return hasLink(types.find((t) => t.id === sessionTypeId))
    return types.some(hasLink)
  } catch {
    return false
  }
}
