import type { BusyInterval } from '@/types/calendar';

/**
 * Fetch busy times from Google Calendar using the FreeBusy API.
 * Checks ALL calendars the user owns. Returns empty array on any error.
 */
export async function getGoogleCalendarBusyTimes(
  accessToken: string,
  calendarId: string,
  dateStr: string,
  timezone: string
): Promise<BusyInterval[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Use a wide UTC window to cover any timezone (full 48h to be safe)
    const timeMinUtc = `${dateStr}T00:00:00Z`
    const timeMaxUtc = `${dateStr}T23:59:59Z`

    console.log('[google-calendar] FreeBusy query:', { dateStr, timezone, timeMinUtc, timeMaxUtc })

    // Fetch the user's calendar list to check ALL calendars
    let calendarIds = [calendarId]
    try {
      const listRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        }
      )
      if (listRes.ok) {
        const listData = await listRes.json()
        if (listData.items && Array.isArray(listData.items)) {
          // Include all calendars (not just owned — shared calendars may have relevant events)
          calendarIds = listData.items.map((cal: { id: string }) => cal.id)
          console.log('[google-calendar] Found', calendarIds.length, 'calendars:', calendarIds.map((id: string) => id.substring(0, 30)))
        }
      } else {
        console.warn('[google-calendar] Calendar list failed:', listRes.status)
      }
    } catch (e) {
      console.warn('[google-calendar] Calendar list fetch error:', e)
    }

    const freeBusyBody = {
      timeMin: timeMinUtc,
      timeMax: timeMaxUtc,
      timeZone: timezone,
      items: calendarIds.map((id: string) => ({ id })),
    }

    console.log('[google-calendar] FreeBusy request body:', JSON.stringify(freeBusyBody).substring(0, 500))

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(freeBusyBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.error('[google-calendar] FreeBusy API error:', response.status, errBody);
      return [];
    }

    const data = await response.json();

    console.log('[google-calendar] FreeBusy raw response calendars:', JSON.stringify(data.calendars).substring(0, 1000))

    // Merge busy times from ALL calendars
    const allBusy: BusyInterval[] = []
    if (data.calendars) {
      for (const calId of Object.keys(data.calendars)) {
        const calData = data.calendars[calId]
        const busy = calData?.busy
        if (calData?.errors) {
          console.warn('[google-calendar] Calendar errors for', calId, ':', calData.errors)
        }
        if (Array.isArray(busy) && busy.length > 0) {
          console.log('[google-calendar] Calendar', calId, 'has', busy.length, 'busy intervals:', busy)
          for (const b of busy) {
            allBusy.push({ start: b.start, end: b.end })
          }
        }
      }
    }

    console.log('[google-calendar] Total busy intervals:', allBusy.length)
    return allBusy;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error('[google-calendar] FreeBusy request timed out');
    } else {
      console.error('[google-calendar] FreeBusy error:', err);
    }
    return [];
  }
}
