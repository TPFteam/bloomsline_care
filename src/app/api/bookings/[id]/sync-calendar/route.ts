import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { buildCalendarEvent, getPractitionerAddress, getBookingConfirmationDetails } from '@/lib/services/calendar-event';
import { postGoogleEvent } from '@/lib/services/google-event-create';

// POST /api/bookings/[id]/sync-calendar - Sync a booking to Google Calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client for queries
    const adminSupabase = createAdminClient();

    // Get the booking and verify ownership
    const { data: booking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.practitioner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only sync confirmed bookings
    if (booking.status !== 'confirmed') {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: 'Booking must be confirmed to sync to calendar',
      });
    }

    // Check if already synced
    if (booking.google_event_id) {
      return NextResponse.json({
        calendarSynced: true,
        calendarError: null,
        message: 'Already synced',
      });
    }

    // Backdated session: historical record only — never touch the calendar
    if (new Date(booking.start_time).getTime() < Date.now()) {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: null,
        message: 'Backdated session — calendar sync skipped',
      });
    }

    // Get access token
    const googleAuth = await getValidGoogleToken(user.id, adminSupabase);

    if (!googleAuth) {
      return NextResponse.json({
        calendarSynced: false,
        calendarError: 'Google Calendar not connected',
      });
    }

    try {
      const { data: settings } = await adminSupabase
        .from('booking_settings')
        .select('session_types, calendar_event_title_template, calendar_email_reminder_enabled')
        .eq('user_id', user.id)
        .single();

      const sessionTypes = settings?.session_types as Array<{ id: string; name: string }> || [];
      const sessionType = sessionTypes.find(st => st.id === booking.session_type);
      const sessionTypeName = sessionType?.name || booking.session_type;
      const titleTemplate = (settings as { calendar_event_title_template?: string | null } | null)?.calendar_event_title_template ?? null;
      const calendarEmailReminder = (settings as { calendar_email_reminder_enabled?: boolean } | null)?.calendar_email_reminder_enabled ?? false;

      // Get practitioner name and locale from public.users (has the Bloomsline profile name)
      const { data: practUser, error: practErr } = await adminSupabase.from('users').select('full_name, preferred_language, email, phone').eq('id', user.id).single();
      console.log(`[sync-calendar] userId=${user.id}, practUser=${JSON.stringify(practUser)}, err=${practErr?.message || 'none'}`);
      // Try practitioner_profiles if users table fails
      let practitionerName = practUser?.full_name || '';
      if (!practitionerName) {
        const { data: profile } = await adminSupabase.from('practitioner_profiles').select('slug').eq('user_id', user.id).maybeSingle();
        if (profile?.slug) {
          // Use the slug-based name as fallback
          practitionerName = profile.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        }
      }
      if (!practitionerName) practitionerName = 'Practitioner';
      console.log(`[sync-calendar] final practitionerName=${practitionerName}`);
      const locale = practUser?.preferred_language || 'fr';

      const practAddr = await getPractitionerAddress(booking.practitioner_id, adminSupabase);
      const confirmationDetails = await getBookingConfirmationDetails(booking.practitioner_id, adminSupabase);
      const calendarEvent = buildCalendarEvent({
        confirmationDetails,
        bookingId: id,
        practitionerName,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
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
        // Series anchor: Google creates one recurring event for the entire series.
        // Children siblings have recurrence_rule = NULL and inherit the same google_event_id below.
        recurrenceRule: booking.recurrence_rule || null,
        titleTemplate,
        calendarEmailReminder,
      });

      // Backdated session: create the event for the practitioner's historical record
      // but don't send Google Calendar invites to attendees
      const isBackdated = new Date(booking.start_time).getTime() < Date.now();
      const sendUpdates = isBackdated ? 'none' : 'all';

      const result = await postGoogleEvent({
        accessToken: googleAuth.accessToken,
        calendarId: googleAuth.calendarId,
        payload: calendarEvent,
        sessionFormat: booking.session_format,
        initialSendUpdates: sendUpdates as 'all' | 'none',
      });

      if (result.ok) {
        const event = result.event;

        // Only persist hangoutLink for video sessions — Google's
        // "auto-add Meet" practitioner setting can attach one to
        // in_person events too.
        const isVideo = booking.session_format === 'video';
        const meetLinkValue = isVideo ? (event.hangoutLink || null) : null;
        await adminSupabase
          .from('bookings')
          .update({ google_event_id: event.id, meet_link: meetLinkValue })
          .eq('id', id);

        // Series anchor: propagate google_event_id + meet_link to every sibling
        // so cancel/reschedule on any occurrence can find the parent Google event.
        if (booking.series_id && booking.recurrence_rule) {
          await adminSupabase
            .from('bookings')
            .update({ google_event_id: event.id, meet_link: meetLinkValue })
            .eq('series_id', booking.series_id)
            .neq('id', id);
        }

        await adminSupabase
          .from('calendar_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return NextResponse.json({
          calendarSynced: true,
          calendarError: null,
          eventId: event.id,
          debug: { practitionerName, practUserFound: !!practUser, practFullName: practUser?.full_name, practErr: practErr?.message },
        });
      } else {
        console.error('Google Calendar API error:', result.status, result.errorText);
        return NextResponse.json({
          calendarSynced: false,
          calendarError: result.errorText || 'Failed to create calendar event',
        });
      }
    } catch (err) {
      console.error('Failed to create calendar event:', err);
      return NextResponse.json({
        calendarSynced: false,
        calendarError: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  } catch (err) {
    console.error('Calendar sync error:', err);
    return NextResponse.json(
      { error: 'Failed to sync to calendar' },
      { status: 500 }
    );
  }
}
