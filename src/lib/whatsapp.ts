// WhatsApp click-to-send helpers.
//
// Replaces the removed automated SMS. Instead of a paid gateway, we build a
// `wa.me` deep link the practitioner taps to send a pre-filled confirmation
// from their OWN WhatsApp — free, manual ("just hit Send"), no Business API,
// no templates, no per-message cost. Opens the WhatsApp app on mobile or
// WhatsApp Web on desktop with the message already typed in.

export type WaKind = 'confirmed' | 'rescheduled' | 'reminder'

// Normalise a stored phone into the digits-only international form wa.me needs
// (e.g. "+33 6 71 48 20 04" → "33671482004"). Returns null when there aren't
// enough digits to be a real number.
//
// Phones get entered every which way — international ("+33 6…"), national with a
// trunk zero ("06…"), or a messy mix ("+33 06…"). wa.me only accepts country
// code + subscriber with NO leading zero, so we:
//   • drop "+"/"00" international prefixes,
//   • for a bare national number (leading trunk 0, no "+"), swap the 0 for the
//     practitioner's default country code,
//   • strip a stray trunk 0 sitting right after the country code ("330766…").
// defaultCountryCode is the dialing code (no "+") used for national numbers —
// "33" (France) by default since that's the primary market.
export function toWaNumber(phone?: string | null, defaultCountryCode = '33'): string | null {
  if (!phone) return null
  const hadPlus = phone.trim().startsWith('+')
  let digits = phone.replace(/\D/g, '')
  // "00" is the international call prefix — drop it so the country code leads.
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (!hadPlus && digits.startsWith('0')) {
    // National format ("0766…") — the leading 0 is a trunk prefix; replace the
    // whole run of leading zeros with the country code.
    digits = defaultCountryCode + digits.replace(/^0+/, '')
  } else if (digits.startsWith(defaultCountryCode + '0')) {
    // International but someone left the trunk 0 in ("+33 0766…" → "330766…").
    digits = defaultCountryCode + digits.slice(defaultCountryCode.length).replace(/^0+/, '')
  }

  return digits.length >= 8 ? digits : null
}

function localeTag(locale: string): string {
  return locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
}

// Format the session start the way the practitioner would say it out loud.
export function formatWhenForWa(startIso: string, locale: string, timezone?: string | null): string {
  return new Date(startIso).toLocaleString(localeTag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  })
}

// Build the localized message body. Sent from the practitioner's own number, so
// it reads as a personal note rather than a system text.
export function buildBookingWaMessage(opts: {
  locale: string
  clientName?: string | null
  practitionerName?: string | null
  when: string
  kind?: WaKind
}): string {
  const { locale, when, kind = 'confirmed' } = opts
  const first = (opts.clientName || '').trim().split(/\s+/)[0] || ''
  const pract = (opts.practitionerName || '').trim()

  if (locale === 'fr') {
    const greet = first ? `Bonjour ${first},` : 'Bonjour,'
    const who = pract ? ` c'est ${pract}.` : ''
    const line =
      kind === 'rescheduled'
        ? `votre séance a été déplacée au ${when}.`
        : kind === 'reminder'
          ? `petit rappel pour votre séance le ${when}.`
          : `je vous confirme votre séance le ${when}.`
    return `${greet}${who} ${line} À très bientôt !`
  }

  if (locale === 'es') {
    const greet = first ? `Hola ${first},` : 'Hola,'
    const who = pract ? ` soy ${pract}.` : ''
    const line =
      kind === 'rescheduled'
        ? `tu sesión se ha cambiado al ${when}.`
        : kind === 'reminder'
          ? `un recordatorio de tu sesión el ${when}.`
          : `te confirmo tu sesión el ${when}.`
    return `${greet}${who} ${line} ¡Nos vemos!`
  }

  const greet = first ? `Hi ${first},` : 'Hi there,'
  const who = pract ? ` this is ${pract}.` : ''
  const line =
    kind === 'rescheduled'
      ? `your session has been moved to ${when}.`
      : kind === 'reminder'
        ? `a quick reminder about your session on ${when}.`
        : `just confirming your session on ${when}.`
  return `${greet}${who} ${line} See you then!`
}

// One-shot builder: stored phone + booking details → ready-to-open wa.me URL.
// Returns null when there's no usable phone number (caller hides the button).
export function buildBookingWaUrl(opts: {
  phone?: string | null
  locale: string
  clientName?: string | null
  practitionerName?: string | null
  startIso: string
  timezone?: string | null
  kind?: WaKind
}): string | null {
  const num = toWaNumber(opts.phone)
  if (!num) return null
  const when = formatWhenForWa(opts.startIso, opts.locale, opts.timezone)
  const text = buildBookingWaMessage({ ...opts, when })
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}

// Open the WhatsApp deep link. New tab so the practitioner keeps the app open.
export function openWhatsApp(url: string): void {
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer')
}
