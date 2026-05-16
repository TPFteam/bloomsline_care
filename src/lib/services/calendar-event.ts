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
  } = params

  const isInPerson = sessionFormat === 'in_person'

  const isFr = locale === 'fr'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bloomsline.com'

  // Title
  const title = isFr
    ? `Rendez-vous ${practitionerName} <> ${clientName}`
    : `Appointment ${practitionerName} <> ${clientName}`

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

  lines.push(isFr ? `Type: ${sessionTypeName}` : `Type: ${sessionTypeName}`)
  lines.push(isFr ? `Format: ${isInPerson ? 'En personne' : 'Vidéo'}` : `Format: ${isInPerson ? 'In person' : 'Video'}`)
  lines.push('')
  lines.push(isFr ? `Client: ${clientName}` : `Client: ${clientName}`)
  lines.push(`Email: ${clientEmail}`)
  if (clientPhone) lines.push(isFr ? `Tél: ${clientPhone}` : `Phone: ${clientPhone}`)
  lines.push('')
  lines.push(isFr ? `Date: ${dateStr}` : `Date: ${dateStr}`)
  lines.push(isFr ? `Heure: ${timeStart} – ${timeEnd}` : `Time: ${timeStart} – ${timeEnd}`)

  if (isInPerson && practitionerAddress) {
    lines.push('')
    lines.push(isFr ? `📍 Lieu: ${practitionerAddress}` : `📍 Location: ${practitionerAddress}`)
    if (practitionerGoogleMapsUrl) {
      lines.push(isFr ? `Google Maps: ${practitionerGoogleMapsUrl}` : `Google Maps: ${practitionerGoogleMapsUrl}`)
    }
  }

  if (notes) {
    lines.push('')
    lines.push(isFr ? `Notes: ${notes}` : `Notes: ${notes}`)
  }

  // Practitioner details
  lines.push('')
  lines.push('─────────────────')
  lines.push(isFr ? `Votre praticien(ne)` : `Your practitioner`)
  lines.push(practitionerName)
  if (practitionerEmail) lines.push(`Email: ${practitionerEmail}`)
  if (practitionerPhone) lines.push(isFr ? `Tél: ${practitionerPhone}` : `Phone: ${practitionerPhone}`)
  if (practitionerAddress) lines.push(isFr ? `Adresse: ${practitionerAddress}` : `Address: ${practitionerAddress}`)

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
        { method: 'email', minutes: 24 * 60 }, // 1 email, 24h before
        { method: 'popup', minutes: 30 },      // 1 popup,  30min before
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
