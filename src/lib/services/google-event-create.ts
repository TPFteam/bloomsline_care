/**
 * Create a Google Calendar event and, for in-person sessions, strip any
 * Meet link that Google auto-attached via the practitioner's
 * "Automatically add Google Meet video conferencing to events I create"
 * calendar setting.
 *
 * Two HTTP calls in the in-person path:
 *   1. POST the event with sendUpdates=all → patient receives invite
 *      immediately (Google may auto-attach a Meet link).
 *   2. PATCH the event with conferenceData: null and sendUpdates=none
 *      → removes the Meet button from the patient's calendar entry
 *      without sending a second notification email.
 *
 * Trade-off: if Google's auto-attach happens, the initial invitation
 * EMAIL the patient receives still mentions Meet (it was sent in step 1
 * before the strip). The calendar event itself is clean within ~1s.
 * Practitioners should also disable the "auto-add Meet" Calendar
 * setting to remove the email window entirely.
 */

export interface PostGoogleEventResult {
  ok: boolean
  event: any
  status: number
  errorText?: string
}

export async function postGoogleEvent(opts: {
  accessToken: string
  calendarId: string
  payload: Record<string, unknown>
  sessionFormat: string | null | undefined // 'in_person' | 'video' | 'phone' | etc.
  /** sendUpdates value for the initial POST. Defaults to 'all'.
   *  Callers like sync-calendar pass 'none' for backdated events. */
  initialSendUpdates?: 'all' | 'externalOnly' | 'none'
}): Promise<PostGoogleEventResult> {
  const { accessToken, calendarId, payload, sessionFormat, initialSendUpdates = 'all' } = opts
  const isVideo = sessionFormat === 'video'

  const createUrl =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}` +
    `/events?sendUpdates=${initialSendUpdates}&conferenceDataVersion=1`

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return { ok: false, event: null, status: response.status, errorText }
  }

  let event = await response.json()

  // In-person path: if Google auto-attached conferenceData, strip it
  // silently so the patient's calendar entry never shows a Meet button.
  if (!isVideo && (event.conferenceData || event.hangoutLink)) {
    const stripUrl =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}` +
      `/events/${encodeURIComponent(event.id)}?sendUpdates=none&conferenceDataVersion=1`
    try {
      const stripRes = await fetch(stripUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conferenceData: null }),
      })
      if (stripRes.ok) {
        event = await stripRes.json()
      } else {
        const t = await stripRes.text().catch(() => '')
        console.warn('In-person strip-Meet PATCH failed:', stripRes.status, t)
      }
    } catch (err) {
      console.warn('In-person strip-Meet PATCH errored:', err)
    }
  }

  return { ok: true, event, status: response.status }
}
