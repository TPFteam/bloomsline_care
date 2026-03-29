/**
 * Generate an .ics (iCalendar) file content for booking confirmations.
 * When attached to an email, this auto-adds the event to the recipient's calendar.
 */

interface CalendarEventParams {
  uid: string           // unique event ID (booking ID)
  summary: string       // event title
  startTime: string     // ISO datetime
  endTime: string       // ISO datetime
  description?: string
  location?: string
  organizerEmail?: string
  organizerName?: string
  attendeeEmail?: string
  attendeeName?: string
}

function formatICSDate(isoDate: string): string {
  // Convert ISO date to ICS format: 20260331T123000Z
  const d = new Date(isoDate)
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function generateICSContent(params: CalendarEventParams): string {
  const {
    uid,
    summary,
    startTime,
    endTime,
    description,
    location,
    organizerEmail,
    organizerName,
    attendeeEmail,
    attendeeName,
  } = params

  const now = formatICSDate(new Date().toISOString())
  const start = formatICSDate(startTime)
  const end = formatICSDate(endTime)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bloomsline Care//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@bloomsline.care`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
  ]

  if (description) {
    // Escape newlines and commas for ICS format
    const escaped = description.replace(/\n/g, '\\n').replace(/,/g, '\\,')
    lines.push(`DESCRIPTION:${escaped}`)
  }

  if (location) {
    lines.push(`LOCATION:${location.replace(/,/g, '\\,')}`)
  }

  if (organizerEmail) {
    const cn = organizerName ? `;CN=${organizerName}` : ''
    lines.push(`ORGANIZER${cn}:mailto:${organizerEmail}`)
  }

  if (attendeeEmail) {
    const cn = attendeeName ? `;CN=${attendeeName}` : ''
    lines.push(`ATTENDEE;RSVP=TRUE;PARTSTAT=ACCEPTED${cn}:mailto:${attendeeEmail}`)
  }

  lines.push(
    'STATUS:CONFIRMED',
    `SEQUENCE:0`,
    'END:VEVENT',
    'END:VCALENDAR',
  )

  return lines.join('\r\n')
}

/**
 * Generate a base64-encoded .ics attachment ready for Postmark
 */
export function generateCalendarAttachment(params: CalendarEventParams) {
  const icsContent = generateICSContent(params)
  const base64Content = Buffer.from(icsContent).toString('base64')

  return {
    Name: 'invite.ics',
    Content: base64Content,
    ContentType: 'text/calendar; method=REQUEST',
  }
}
