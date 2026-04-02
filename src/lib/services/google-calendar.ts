import type { BusyInterval } from '@/types/calendar';

/**
 * Fetch busy times from Google Calendar using the Events List API.
 * Uses calendar.events scope (no additional scopes needed).
 * Returns empty array on any error (never breaks the booking flow).
 */
export async function getGoogleCalendarBusyTimes(
  accessToken: string,
  _calendarId: string,
  dateStr: string,
  _timezone: string
): Promise<BusyInterval[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const timeMin = `${dateStr}T00:00:00Z`
    const timeMax = `${dateStr}T23:59:59Z`

    // Use Events List API on primary calendar (works with calendar.events scope)
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
      fields: 'items(start,end,status,transparency)',
    })

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      }
    )

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.error('[google-calendar] Events List API error:', response.status, errBody);
      return [];
    }

    const data = await response.json();
    const events = data.items || [];

    // Convert events to busy intervals
    // Skip cancelled events and transparent (free/available) events
    const allBusy: BusyInterval[] = []
    for (const event of events) {
      if (event.status === 'cancelled') continue
      if (event.transparency === 'transparent') continue // "free" events don't block

      const start = event.start?.dateTime || event.start?.date
      const end = event.end?.dateTime || event.end?.date

      if (start && end) {
        allBusy.push({ start, end })
      }
    }

    console.log('[google-calendar] Found', allBusy.length, 'busy events out of', events.length, 'total events for', dateStr)
    return allBusy;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error('[google-calendar] Events request timed out');
    } else {
      console.error('[google-calendar] Events error:', err);
    }
    return [];
  }
}
