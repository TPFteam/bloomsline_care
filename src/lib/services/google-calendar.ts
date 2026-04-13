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
  timezone: string
): Promise<BusyInterval[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Convert practitioner's local day boundaries to UTC for the API query
    // e.g., Paris (UTC+2): April 15 00:00 local = April 14 22:00 UTC
    function localDayToUtc(dateStr: string, time: string, tz: string): string {
      const refUtc = Date.UTC(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(5, 7)) - 1,
        parseInt(dateStr.slice(8, 10)),
        parseInt(time.slice(0, 2)),
        parseInt(time.slice(3, 5)),
        0
      )
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).formatToParts(new Date(refUtc))
      const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
      const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'))
      const offsetMs = localMs - refUtc
      return new Date(refUtc - offsetMs).toISOString()
    }

    const tz = timezone || 'UTC'
    const timeMin = localDayToUtc(dateStr, '00:00', tz)
    const timeMax = localDayToUtc(dateStr, '23:59', tz)

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
