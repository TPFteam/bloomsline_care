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

    const timeMin = `${dateStr}T00:00:00`;
    const timeMax = `${dateStr}T23:59:59`;

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: new Date(`${timeMin}`).toISOString(),
          timeMax: new Date(`${timeMax}`).toISOString(),
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
