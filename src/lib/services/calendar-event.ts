import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Robust practitioner name lookup — tries multiple sources so we never
 * fall back to the literal string "Practitioner" in calendar events.
 *
 * Priority:
 * 1. public.users.full_name (primary — set via profile page)
 * 2. auth.users.raw_user_meta_data.full_name (set at signup / OAuth)
 * 3. email prefix (last resort — better than "Practitioner")
 */
export async function getPractitionerName(
  userId: string,
  adminSupabase: SupabaseClient
): Promise<string> {
  // 1. Check public.users
  const { data: pubUser } = await adminSupabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()
  if (pubUser?.full_name?.trim()) return pubUser.full_name.trim()

  // 2. Check auth.users metadata
  try {
    const { data: { user: authUser } } = await adminSupabase.auth.admin.getUserById(userId)
    const metaName = authUser?.user_metadata?.full_name
    if (metaName?.trim()) return metaName.trim()
    // 3. Email prefix
    if (authUser?.email) return authUser.email.split('@')[0]
  } catch { /* admin API not available — skip */ }

  return 'Practitioner'
}

/**
 * Get practitioner's address info for calendar events.
 */
export async function getPractitionerAddress(
  userId: string,
  supabase: SupabaseClient
): Promise<{ address: string | null; googleMapsUrl: string | null }> {
  const { data } = await supabase
    .from('practitioner_profiles')
    .select('address, city, country, google_maps_url')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return { address: null, googleMapsUrl: null }
  const address = [data.address, data.city, data.country].filter(Boolean).join(', ') || null
  return { address, googleMapsUrl: data.google_maps_url || null }
}

/**
 * Per-practitioner booking-confirmation details (consent / payment / cancellation)
 * for the calendar description + confirmation screens. Returns null when the
 * feature is off or nothing is filled in, so callers can pass it through blindly.
 */
export async function getBookingConfirmationDetails(
  userId: string,
  supabase: SupabaseClient,
  sessionTypeId?: string | null
): Promise<NonNullable<CalendarEventParams['confirmationDetails']> | null> {
  const { data } = await supabase
    .from('booking_settings')
    .select('booking_confirmation_enabled, consent_text, payment_text, cancellation_text, practice_text, practice_url, session_types')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data || !(data as { booking_confirmation_enabled?: boolean }).booking_confirmation_enabled) return null
  const d = data as Record<string, unknown>
  // Payment link is per session type — resolve it for this booking's type.
  const types = (d.session_types as Array<{ id: string; payment_url?: string | null }>) || []
  const paymentUrl = (types.find((t) => t.id === sessionTypeId)?.payment_url || null) as string | null
  const str = (v: unknown) => (v ? String(v) : null)
  const cd = {
    consentText: str(d.consent_text),
    paymentText: str(d.payment_text),
    paymentUrl,
    cancellationText: str(d.cancellation_text),
    practiceText: str(d.practice_text),
    practiceUrl: str(d.practice_url),
  }
  if (!cd.consentText && !cd.paymentText && !cd.paymentUrl && !cd.cancellationText && !cd.practiceText && !cd.practiceUrl) return null
  return cd
}

/**
 * Build a standardized Google Calendar event object for Bloomsline bookings.
 * Used across all calendar sync points for consistency.
 */

export interface CalendarEventParams {
  bookingId: string
  practitionerName: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  sessionTypeName: string
  sessionFormat?: string | null // 'in_person' | 'video'
  startTime: string
  endTime: string
  timezone: string
  notes?: string | null
  locale?: string // practitioner's preferred language
  isRescheduled?: boolean
  practitionerAddress?: string | null
  practitionerGoogleMapsUrl?: string | null
  practitionerEmail?: string | null
  practitionerPhone?: string | null
  /** Optional iCalendar RRULE for recurring series (e.g. "RRULE:FREQ=WEEKLY;COUNT=12").
   *  When set, Google creates a single recurring event so the patient receives
   *  one invite for the whole series, with per-occurrence reminders. */
  recurrenceRule?: string | null
  /** Optional per-practitioner title template stored in
   *  booking_settings.calendar_event_title_template. Supports placeholders:
   *  {practitioner}, {client}, {session_type}. Empty/null → use the default
   *  "Rendez-vous {practitioner} <> {client}" / "Appointment ..." pattern. */
  titleTemplate?: string | null
  /** Whether to attach Google Calendar's 24h email reminder to the event.
   *  Mirrors booking_settings.calendar_email_reminder_enabled. Defaults
   *  to false so practitioners aren't opted into a Google-side email
   *  reminder they didn't ask for. The 30-min popup reminder is always
   *  included. */
  calendarEmailReminder?: boolean
  /** Per-practitioner booking-confirmation details shown to the patient inside
   *  the Google invite (and on the confirmation screen). Only the provided
   *  sections render. Pass only when the practitioner enabled the feature
   *  (booking_settings.booking_confirmation_enabled) for a confirmed booking. */
  confirmationDetails?: {
    consentText?: string | null
    paymentText?: string | null
    paymentUrl?: string | null
    cancellationText?: string | null
    practiceText?: string | null
    practiceUrl?: string | null
  } | null
}

// Substitute placeholder tokens in a title template. Unknown tokens are
// left as-is so the practitioner can see them and fix the typo. Trims
// whitespace at the edges so an accidental newline doesn't ruin the
// Google Calendar header.
function renderTitle(
  template: string,
  vars: { practitioner: string; client: string; session_type: string; session_format: string },
): string {
  return template
    .replace(/\{practitioner(?:_name)?\}/gi, vars.practitioner)
    .replace(/\{client(?:_name)?\}/gi, vars.client)
    .replace(/\{session_type\}/gi, vars.session_type)
    .replace(/\{session_format\}/gi, vars.session_format)
    .trim()
}

export function buildCalendarEvent(params: CalendarEventParams) {
  const {
    bookingId,
    practitionerName,
    clientName,
    clientEmail,
    clientPhone,
    sessionTypeName,
    sessionFormat,
    startTime,
    endTime,
    timezone,
    notes,
    locale = 'fr',
    isRescheduled = false,
    practitionerAddress,
    practitionerGoogleMapsUrl,
    practitionerEmail,
    practitionerPhone,
    recurrenceRule,
    titleTemplate,
    calendarEmailReminder = false,
    confirmationDetails,
  } = params

  const isInPerson = sessionFormat === 'in_person'

  const isFr = locale === 'fr'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bloomsline.com'

  // Title — use the practitioner's custom template when provided,
  // otherwise fall back to the default "Rendez-vous {practitioner} <>
  // {client}" / "Appointment …" pattern.
  const defaultTitle = isFr
    ? `Rendez-vous ${practitionerName} <> ${clientName}`
    : `Appointment ${practitionerName} <> ${clientName}`
  const sessionFormatLabel = isInPerson
    ? (isFr ? '🏢 en personne' : '🏢 in person')
    : (isFr ? '💻 En visio' : '💻 virtual')
  const title = titleTemplate && titleTemplate.trim()
    ? renderTitle(titleTemplate, {
        practitioner: practitionerName,
        client: clientName,
        session_type: sessionTypeName,
        session_format: sessionFormatLabel,
      }) || defaultTitle
    : defaultTitle

  // Format date/time in practitioner's locale
  const startDate = new Date(startTime)
  const dateStr = startDate.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  })
  const timeStart = startDate.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !isFr,
    timeZone: timezone,
  })
  const timeEnd = new Date(endTime).toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !isFr,
    timeZone: timezone,
  })

  // Description
  const lines: string[] = []

  if (isRescheduled) {
    lines.push(isFr ? '⟳ Séance reprogrammée' : '⟳ Rescheduled session')
    lines.push('')
  }

  // Date + time up top, in bold. (Google also renders its own "When" block
  // below the description — this is the at-a-glance copy the practitioner asked
  // to keep.) Google Calendar descriptions support basic HTML like <b>.
  lines.push(`📅 <b>${dateStr}</b>`)
  lines.push(`🕐 <b>${timeStart} – ${timeEnd}</b>`)
  lines.push('')
  lines.push(`<b>Type:</b> ${sessionTypeName}`)
  lines.push(isFr ? `<b>Format:</b> ${isInPerson ? 'En personne' : 'Vidéo'}` : `<b>Format:</b> ${isInPerson ? 'In person' : 'Video'}`)
  lines.push('')
  lines.push(`<b>Client:</b> ${clientName}`)
  lines.push(`<b>Email:</b> ${clientEmail}`)
  if (clientPhone) lines.push(isFr ? `<b>Tél:</b> ${clientPhone}` : `<b>Phone:</b> ${clientPhone}`)

  if (isInPerson && practitionerAddress) {
    lines.push('')
    lines.push(isFr ? `📍 <b>Lieu:</b> ${practitionerAddress}` : `📍 <b>Location:</b> ${practitionerAddress}`)
    if (practitionerGoogleMapsUrl) {
      lines.push(`<b>Google Maps:</b> ${practitionerGoogleMapsUrl}`)
    }
  }

  if (notes) {
    lines.push('')
    lines.push(isFr ? `Notes: ${notes}` : `Notes: ${notes}`)
  }

  // Practitioner-configured confirmation details (consent / payment / cancellation).
  // Patient-facing; only the sections the practitioner filled in are shown.
  const cd = confirmationDetails
  const has = (s?: string | null) => !!(s && s.trim())
  if (cd && (has(cd.consentText) || has(cd.paymentText) || has(cd.paymentUrl) || has(cd.cancellationText) || has(cd.practiceText) || has(cd.practiceUrl))) {
    lines.push('')
    lines.push('─────────────────')
    if (has(cd.consentText)) {
      lines.push(isFr ? '<b>— CONSENTEMENT —</b>' : '<b>— CONSENT —</b>')
      lines.push(cd.consentText!.trim())
      lines.push('')
    }
    if (has(cd.paymentText) || has(cd.paymentUrl)) {
      lines.push(isFr ? '<b>— PAIEMENT —</b>' : '<b>— PAYMENT —</b>')
      if (has(cd.paymentText)) lines.push(cd.paymentText!.trim())
      if (has(cd.paymentUrl)) lines.push(`👉 ${cd.paymentUrl!.trim()}`)
      lines.push('')
    }
    if (has(cd.cancellationText)) {
      lines.push(isFr ? "<b>— POLITIQUE D'ANNULATION —</b>" : '<b>— CANCELLATION POLICY —</b>')
      lines.push(cd.cancellationText!.trim())
      lines.push('')
    }
    if (has(cd.practiceText) || has(cd.practiceUrl)) {
      lines.push(isFr ? '<b>— POLITIQUE DU CABINET —</b>' : '<b>— PRACTICE POLICY —</b>')
      if (has(cd.practiceText)) lines.push(cd.practiceText!.trim())
      if (has(cd.practiceUrl)) lines.push(`👉 ${cd.practiceUrl!.trim()}`)
    }
  }

  // Practitioner details
  lines.push('')
  lines.push('─────────────────')
  lines.push(isFr ? `<b>Votre praticien(ne)</b>` : `<b>Your practitioner</b>`)
  lines.push(practitionerName)
  if (practitionerEmail) lines.push(`<b>Email:</b> ${practitionerEmail}`)
  if (practitionerPhone) lines.push(isFr ? `<b>Tél:</b> ${practitionerPhone}` : `<b>Phone:</b> ${practitionerPhone}`)
  if (practitionerAddress) lines.push(isFr ? `<b>Adresse:</b> ${practitionerAddress}` : `<b>Address:</b> ${practitionerAddress}`)

  lines.push('')
  lines.push('─────────────────')
  lines.push(isFr ? `Géré via Bloomsline` : `Managed via Bloomsline`)
  lines.push(appUrl)

  // Google rejects the whole event with 400 if attendees contains an
  // invalid email — including empty string. Patients without an email on
  // file (in-person clinic visits, walk-ins) used to wipe out the entire
  // sync. Skip the attendee entry instead; the event still lands on the
  // practitioner's calendar, just without a patient invite.
  const validClientEmail =
    typeof clientEmail === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())

  const event: Record<string, unknown> = {
    summary: title,
    description: lines.join('\n'),
    start: {
      dateTime: startTime,
      timeZone: timezone,
    },
    end: {
      dateTime: endTime,
      timeZone: timezone,
    },
    // Explicit reminder override on the organizer's copy of the event.
    // We deliberately do NOT inherit the practitioner's calendar
    // defaults — some practitioners have stacked multiple email
    // reminders at the calendar level (24h + 4h + 1h …), which would
    // pile up on every Bloomsline event without anyone realizing.
    //
    // Caveat: Google scopes `reminders.overrides` to the organizer
    // only. Each attendee sees reminders based on THEIR own calendar
    // defaults — the organizer cannot reduce or remove an attendee's
    // personal reminders. If a patient is getting too many emails, it's
    // their own Google Calendar settings; only they can change it.
    reminders: {
      useDefault: false,
      overrides: [
        // Email reminder is opt-out per practitioner setting; popup
        // always fires 30min before so they're never surprised by a
        // session they didn't see coming.
        ...(calendarEmailReminder
          ? [{ method: 'email' as const, minutes: 24 * 60 }]
          : []),
        { method: 'popup', minutes: 30 },
      ],
    },
  }

  if (validClientEmail) {
    event.attendees = [{ email: clientEmail.trim(), displayName: clientName }]
  }

  if (recurrenceRule) {
    // Google expects an array of RRULE / EXDATE / RDATE strings
    event.recurrence = [recurrenceRule]
  }

  if (isInPerson) {
    // In-person: set location, no Meet link
    if (practitionerAddress) {
      event.location = practitionerAddress
    }
  } else {
    // Video: create Google Meet link
    event.conferenceData = {
      createRequest: {
        requestId: `bloomsline-${bookingId}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  return event
}
