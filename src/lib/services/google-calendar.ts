import type { BusyInterval } from '@/types/calendar';

/**
 * Fetch busy times from Google Calendar using the FreeBusy API.
 * Returns empty array on any error (never breaks the booking flow).
 */
export async function getGoogleCalendarBusyTimes(
  accessToken: string,
  calendarId: string,
  dateStr: string,
  timezone: string
): Promise<BusyInterval[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Calculate UTC offset for the practitioner's timezone on this date
    const refDate = new Date(`${dateStr}T12:00:00Z`)
    const utcStr = refDate.toLocaleString('en-US', { timeZone: 'UTC' })
    const tzStr = refDate.toLocaleString('en-US', { timeZone: timezone })
    const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime()

    // Convert practitioner's local midnight/end-of-day to UTC
    const timeMinUtc = new Date(new Date(`${dateStr}T00:00:00`).getTime() + offsetMs).toISOString()
    const timeMaxUtc = new Date(new Date(`${dateStr}T23:59:59`).getTime() + offsetMs).toISOString()

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: timeMinUtc,
          timeMax: timeMaxUtc,
          timeZone: timezone,
          items: [{ id: calendarId }],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Google FreeBusy API error:', response.status);
      return [];
    }

    const data = await response.json();
    const calendarBusy = data.calendars?.[calendarId]?.busy;

    if (!Array.isArray(calendarBusy)) {
      return [];
    }

    return calendarBusy.map((b: { start: string; end: string }) => ({
      start: b.start,
      end: b.end,
    }));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error('Google FreeBusy request timed out');
    } else {
      console.error('Google FreeBusy error:', err);
    }
    return [];
  }
}
