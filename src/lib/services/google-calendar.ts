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

    // First, fetch the user's calendar list to check ALL calendars (not just primary)
    let calendarIds = [calendarId]
    try {
      const listRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        }
      )
      if (listRes.ok) {
        const listData = await listRes.json()
        if (listData.items && Array.isArray(listData.items)) {
          calendarIds = listData.items.map((cal: { id: string }) => cal.id)
          console.log('[google-calendar] Checking', calendarIds.length, 'calendars:', calendarIds)
        }
      }
    } catch {
      // Fall back to just the stored calendar ID
      console.log('[google-calendar] Calendar list fetch failed, using:', calendarId)
    }

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
          items: calendarIds.map(id => ({ id })),
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.error('Google FreeBusy API error:', response.status, errBody);
      return [];
    }

    const data = await response.json();

    // Merge busy times from ALL calendars
    const allBusy: BusyInterval[] = []
    if (data.calendars) {
      for (const calId of Object.keys(data.calendars)) {
        const busy = data.calendars[calId]?.busy
        if (Array.isArray(busy)) {
          for (const b of busy) {
            allBusy.push({ start: b.start, end: b.end })
          }
        }
      }
    }

    console.log('[google-calendar] Found', allBusy.length, 'busy intervals across', Object.keys(data.calendars || {}).length, 'calendars')
    return allBusy;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error('Google FreeBusy request timed out');
    } else {
      console.error('Google FreeBusy error:', err);
    }
    return [];
  }
}
