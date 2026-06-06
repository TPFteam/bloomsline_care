// SMS service (MessageBird / Bird) — transactional booking texts.
//
// Env-gated: with no MESSAGEBIRD_API_KEY this is a silent no-op, so the app
// works fine without SMS configured. Sending is gated upstream on the
// practitioner's `booking_settings.sms_on_booking` toggle.

import type { SupabaseClient } from '@supabase/supabase-js'

// Bird (MessageBird) Channels API. The sender ("Bloomsline" alphanumeric) lives
// on the channel, so we only need workspace + channel + an access key.
const BIRD_ACCESS_KEY = process.env.BIRD_ACCESS_KEY || ''
const BIRD_WORKSPACE_ID = process.env.BIRD_WORKSPACE_ID || ''
const BIRD_CHANNEL_ID = process.env.BIRD_CHANNEL_ID || ''
const BIRD_CONFIGURED = !!(BIRD_ACCESS_KEY && BIRD_WORKSPACE_ID && BIRD_CHANNEL_ID)

type Locale = 'en' | 'fr' | 'es'
export type BookingSmsKind = 'confirmed' | 'rescheduled' | 'cancelled'

/**
 * Normalize a free-text phone number to E.164 (e.g. "+33612345678").
 * Returns null when it can't be confidently normalized (we then skip SMS).
 * Defaults unknown local numbers to France (cc 33).
 */
export function toE164(raw: string | null | undefined, defaultCc = '33'): string | null {
  if (!raw) return null
  let s = raw.replace(/[\s().\-/]/g, '')
  if (s.startsWith('+')) {
    // keep as-is
  } else if (s.startsWith('00')) {
    s = '+' + s.slice(2)
  } else if (s.startsWith('0')) {
    s = '+' + defaultCc + s.slice(1)
  } else if (/^\d+$/.test(s) && s.startsWith(defaultCc)) {
    s = '+' + s
  } else {
    return null // ambiguous — don't guess
  }
  const digits = s.slice(1)
  if (!/^\d{8,15}$/.test(digits)) return null
  return s
}

/** Send a single SMS via MessageBird. Returns true on success. Never throws. */
export async function sendSms({ to, body }: { to: string; body: string }): Promise<boolean> {
  if (!BIRD_CONFIGURED) {
    console.warn('Bird SMS not configured (BIRD_ACCESS_KEY/WORKSPACE_ID/CHANNEL_ID missing) — skipping SMS')
    return false
  }
  const recipient = toE164(to)
  if (!recipient) {
    console.warn('SMS skipped — could not normalize phone to E.164')
    return false
  }
  try {
    const res = await fetch(
      `https://api.bird.com/workspaces/${BIRD_WORKSPACE_ID}/channels/${BIRD_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `AccessKey ${BIRD_ACCESS_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver: { contacts: [{ identifierKey: 'phonenumber', identifierValue: recipient }] },
          body: { type: 'text', text: { text: body } },
        }),
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!res.ok) {
      console.error('Bird SMS error:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('Error sending SMS:', e)
    return false
  }
}

/** Build the localized booking SMS body. */
export function bookingSmsBody(params: {
  kind: BookingSmsKind
  practitionerName: string
  startTime: string
  timezone?: string | null
  locale: Locale
}): string {
  const { kind, practitionerName, startTime, timezone, locale } = params
  const when = new Date(startTime).toLocaleString(
    locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: timezone || 'Europe/Paris' }
  )
  const withName = practitionerName ? ` ${locale === 'en' ? 'with' : locale === 'es' ? 'con' : 'avec'} ${practitionerName}` : ''

  if (locale === 'fr') {
    if (kind === 'confirmed') return `Bloomsline : votre séance${withName} le ${when} est confirmée.`
    if (kind === 'rescheduled') return `Bloomsline : votre séance${withName} est reprogrammée au ${when}.`
    return `Bloomsline : votre séance${withName} du ${when} a été annulée.`
  }
  if (locale === 'es') {
    if (kind === 'confirmed') return `Bloomsline: tu sesión${withName} el ${when} está confirmada.`
    if (kind === 'rescheduled') return `Bloomsline: tu sesión${withName} se ha movido al ${when}.`
    return `Bloomsline: tu sesión${withName} del ${when} ha sido cancelada.`
  }
  if (kind === 'confirmed') return `Bloomsline: your session${withName} on ${when} is confirmed.`
  if (kind === 'rescheduled') return `Bloomsline: your session${withName} has been moved to ${when}.`
  return `Bloomsline: your session${withName} on ${when} has been cancelled.`
}

interface BookingForSms {
  id?: string
  client_phone?: string | null
  member_id?: string | null
  start_time: string
  timezone?: string | null
}

/**
 * Send a booking SMS to the client IF the practitioner enabled the toggle and a
 * usable mobile exists. Safe to fire-and-forget — it queries its own settings,
 * resolves the phone (booking.client_phone → member.phone), and never throws.
 * Gating is the practitioner's toggle only (they're responsible for client
 * consent), per product decision.
 */
export async function notifyBookingSms(
  // admin (service-role) Supabase client
  supabase: SupabaseClient,
  params: { practitionerId: string; booking: BookingForSms; kind: BookingSmsKind }
): Promise<void> {
  try {
    if (!BIRD_CONFIGURED) {
      console.warn('[sms] skip: Bird not configured (BIRD_ACCESS_KEY/WORKSPACE_ID/CHANNEL_ID missing in env)')
      return
    }

    const { practitionerId, booking, kind } = params

    // 1. Toggle gate
    const { data: settings, error: settingsErr } = await supabase
      .from('booking_settings')
      .select('sms_on_booking')
      .eq('user_id', practitionerId)
      .maybeSingle()
    if (settingsErr) console.warn('[sms] booking_settings read error:', settingsErr.message)
    if (!settings?.sms_on_booking) {
      console.warn('[sms] skip: sms_on_booking is OFF/missing for practitioner', practitionerId, '— settings:', settings)
      return
    }

    // 2. Resolve phone: booking.client_phone first, else the member's phone
    let phone = booking.client_phone || null
    if (!phone && booking.member_id) {
      const { data: member } = await supabase
        .from('members')
        .select('phone')
        .eq('id', booking.member_id)
        .maybeSingle()
      phone = member?.phone || null
    }
    if (!toE164(phone)) {
      console.warn('[sms] skip: no usable mobile (could not normalize to E.164) — raw:', JSON.stringify(phone))
      return
    }
    console.log('[sms] sending', kind, 'to', toE164(phone), 'for booking', booking.id)

    // 3. Practitioner locale + name
    const { data: prof } = await supabase
      .from('users')
      .select('preferred_language, full_name')
      .eq('id', practitionerId)
      .maybeSingle()
    const locale = (prof?.preferred_language as Locale) || 'fr'
    const practitionerName = prof?.full_name || ''

    const body = bookingSmsBody({
      kind,
      practitionerName,
      startTime: booking.start_time,
      timezone: booking.timezone,
      locale,
    })

    await sendSms({ to: phone as string, body })
  } catch (e) {
    console.error('notifyBookingSms failed (ignored):', e)
  }
}
