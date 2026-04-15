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
  startTime: string
  endTime: string
  timezone: string
  notes?: string | null
  locale?: string // practitioner's preferred language
  isRescheduled?: boolean
  practitionerAddress?: string | null
  practitionerEmail?: string | null
  practitionerPhone?: string | null
}

export function buildCalendarEvent(params: CalendarEventParams) {
  const {
    bookingId,
    practitionerName,
    clientName,
    clientEmail,
    clientPhone,
    sessionTypeName,
    startTime,
    endTime,
    timezone,
    notes,
    locale = 'fr',
    isRescheduled = false,
    practitionerAddress,
    practitionerEmail,
    practitionerPhone,
  } = params

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
  lines.push('')
  lines.push(isFr ? `Client: ${clientName}` : `Client: ${clientName}`)
  lines.push(`Email: ${clientEmail}`)
  if (clientPhone) lines.push(isFr ? `Tél: ${clientPhone}` : `Phone: ${clientPhone}`)
  lines.push('')
  lines.push(isFr ? `Date: ${dateStr}` : `Date: ${dateStr}`)
  lines.push(isFr ? `Heure: ${timeStart} – ${timeEnd}` : `Time: ${timeStart} – ${timeEnd}`)

  if (practitionerAddress) {
    lines.push('')
    lines.push(isFr ? `Adresse: ${practitionerAddress}` : `Address: ${practitionerAddress}`)
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

  return {
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
    attendees: [
      { email: clientEmail, displayName: clientName },
    ],
    conferenceData: {
      createRequest: {
        requestId: `bloomsline-${bookingId}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 30 },
      ],
    },
  }
}
