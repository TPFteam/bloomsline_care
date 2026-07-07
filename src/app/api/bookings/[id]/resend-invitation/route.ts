import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { buildCalendarEvent, getPractitionerAddress, getBookingConfirmationDetails } from '@/lib/services/calendar-event';
import { postGoogleEvent } from '@/lib/services/google-event-create';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/bookings/[id]/resend-invitation
 *
 * Re-sends the Google Calendar invitation for a booking whose client email was
 * missing when it was created. The "invitation" is the Google Calendar invite:
 * we attach the (now-present) client email to the event as an attendee and ask
 * Google to notify them (`sendUpdates=all`). Google sends the email — the app
 * does not send it directly.
 *
 * Two cases:
 *   A. No Google event yet → create it with the attendee (like sync-calendar).
 *   B. Event exists but had no attendee → add the attendee and re-notify (PATCH).
 *
 * Requires: the practitioner's Google Calendar connected AND a valid client
 * email (backfilled from the linked member if the booking's is blank).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: booking, error: fetchError } = await admin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.practitioner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ ok: false, reason: 'cancelled', message: 'This appointment was cancelled.' });
    }
    // An invitation to a past appointment is pointless — Google won't usefully notify.
    if (new Date(booking.start_time).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, reason: 'past', message: 'This appointment is in the past.' });
    }

    // Resolve the client email: prefer the booking's; otherwise backfill from the
    // linked member (the "added the email later" case) and persist it onto the booking.
    let email = (booking.client_email || '').trim();
    let clientName: string = booking.client_name || '';
    if (!EMAIL_RE.test(email) && booking.member_id) {
      const { data: member } = await admin
        .from('members')
        .select('first_name, last_name, email')
        .eq('id', booking.member_id)
        .single();
      const memberEmail = (member?.email || '').trim();
      if (EMAIL_RE.test(memberEmail)) {
        email = memberEmail;
        if (!clientName) {
          clientName = [member?.first_name, member?.last_name].filter(Boolean).join(' ').trim();
        }
        const update: { client_email: string; client_name?: string } = { client_email: email };
        if (clientName && !booking.client_name) update.client_name = clientName;
        await admin.from('bookings').update(update).eq('id', id);
      }
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, reason: 'no_email', message: 'Add an email address for this client first, then resend.' });
    }

    // The invite can only go out via the practitioner's connected Google Calendar.
    const googleAuth = await getValidGoogleToken(user.id, admin);
    if (!googleAuth) {
      return NextResponse.json({ ok: false, reason: 'google_not_connected', message: 'Connect your Google Calendar to send invitations.' });
    }

    // ── Case B: event already exists → (re)add the attendee and force a notify ──
    if (booking.google_event_id) {
      const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`;
      const authHeaders = { Authorization: `Bearer ${googleAuth.accessToken}`, 'Content-Type': 'application/json' };

      const getRes = await fetch(calendarUrl, { headers: authHeaders });
      if (getRes.ok) {
        const event = await getRes.json();
        const existing: Array<{ email?: string; displayName?: string; responseStatus?: string }> =
          Array.isArray(event.attendees) ? event.attendees : [];
        const others = existing.filter((a) => (a.email || '').trim().toLowerCase() !== email.toLowerCase());
        const alreadyPresent = others.length !== existing.length;
        const withClient = [...others, { email, displayName: clientName || undefined, responseStatus: 'needsAction' }];

        // Google only emails attendees when the event actually CHANGES. If the
        // client is already an attendee, a PATCH with the same list is a no-op
        // and Google sends nothing (even with sendUpdates=all). So when they're
        // already present, first remove them silently (sendUpdates=none), then
        // re-add them (sendUpdates=all) — the re-add is a real change that makes
        // Google send a fresh invitation.
        if (alreadyPresent) {
          const rmRes = await fetch(`${calendarUrl}?sendUpdates=none`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ attendees: others }),
          });
          if (!rmRes.ok) {
            const detail = await rmRes.text().catch(() => '');
            return NextResponse.json({ ok: false, reason: 'google_error', message: 'Google rejected the update. Please try again.', detail });
          }
        }

        const addRes = await fetch(`${calendarUrl}?sendUpdates=all`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ attendees: withClient }),
        });
        if (!addRes.ok) {
          const detail = await addRes.text().catch(() => '');
          return NextResponse.json({ ok: false, reason: 'google_error', message: 'Google rejected the update. Please try again.', detail });
        }
        return NextResponse.json({ ok: true, email, message: `Invitation sent to ${email}.` });
      }
      if (getRes.status !== 404) {
        const detail = await getRes.text().catch(() => '');
        return NextResponse.json({ ok: false, reason: 'google_error', message: 'Could not read the calendar event. Please try again.', detail });
      }
      // 404 → the stored event no longer exists on Google; fall through to recreate it.
    }

    // ── Case A: no event yet (or it vanished) → create it; Google emails the invite ──
    // (Build block mirrors /api/bookings/[id]/sync-calendar.)
    const { data: settings } = await admin
      .from('booking_settings')
      .select('session_types, calendar_event_title_template, calendar_email_reminder_enabled')
      .eq('user_id', user.id)
      .single();

    const sessionTypes = (settings?.session_types as Array<{ id: string; name: string }>) || [];
    const sessionType = sessionTypes.find((st) => st.id === booking.session_type);
    const sessionTypeName = sessionType?.name || booking.session_type;
    const titleTemplate = (settings as { calendar_event_title_template?: string | null } | null)?.calendar_event_title_template ?? null;
    const calendarEmailReminder = (settings as { calendar_email_reminder_enabled?: boolean } | null)?.calendar_email_reminder_enabled ?? false;

    const { data: practUser } = await admin
      .from('users')
      .select('full_name, preferred_language, email, phone')
      .eq('id', user.id)
      .single();

    let practitionerName = practUser?.full_name || '';
    if (!practitionerName) {
      const { data: profile } = await admin.from('practitioner_profiles').select('slug').eq('user_id', user.id).maybeSingle();
      if (profile?.slug) {
        practitionerName = profile.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }
    if (!practitionerName) practitionerName = 'Practitioner';
    const locale = practUser?.preferred_language || 'fr';

    const practAddr = await getPractitionerAddress(booking.practitioner_id, admin);
    const confirmationDetails = await getBookingConfirmationDetails(booking.practitioner_id, admin, booking.session_type);
    const calendarEvent = buildCalendarEvent({
      confirmationDetails,
      bookingId: id,
      practitionerName,
      clientName,
      clientEmail: email,
      clientPhone: booking.client_phone,
      sessionTypeName,
      sessionFormat: booking.session_format,
      startTime: booking.start_time,
      endTime: booking.end_time,
      timezone: booking.timezone,
      notes: booking.notes,
      locale,
      practitionerAddress: practAddr.address,
      practitionerGoogleMapsUrl: practAddr.googleMapsUrl,
      practitionerEmail: practUser?.email,
      practitionerPhone: practUser?.phone,
      recurrenceRule: booking.recurrence_rule || null,
      titleTemplate,
      calendarEmailReminder,
    });

    const result = await postGoogleEvent({
      accessToken: googleAuth.accessToken,
      calendarId: googleAuth.calendarId,
      payload: calendarEvent,
      sessionFormat: booking.session_format,
      initialSendUpdates: 'all',
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, reason: 'google_error', message: 'Failed to create the calendar event. Please try again.', detail: result.errorText });
    }

    const event = result.event;
    const isVideo = booking.session_format === 'video';
    const meetLinkValue = isVideo ? (event.hangoutLink || null) : null;
    await admin.from('bookings').update({ google_event_id: event.id, meet_link: meetLinkValue }).eq('id', id);

    // Series anchor: propagate the event id to siblings (mirrors sync-calendar).
    if (booking.series_id && booking.recurrence_rule) {
      await admin
        .from('bookings')
        .update({ google_event_id: event.id, meet_link: meetLinkValue })
        .eq('series_id', booking.series_id)
        .neq('id', id);
    }

    await admin.from('calendar_connections').update({ last_synced_at: new Date().toISOString() }).eq('user_id', user.id);

    return NextResponse.json({ ok: true, email, eventId: event.id, message: `Invitation sent to ${email}.` });
  } catch (err) {
    console.error('resend-invitation error:', err);
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 });
  }
}
