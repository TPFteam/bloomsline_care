import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';

/**
 * POST /api/bookings/[id]/member-action
 *
 * Patient-initiated cancel or reschedule.
 * Body:
 *   action: 'cancel' | 'reschedule'
 *   reason: string (required)
 *   newSlotStart?: string (ISO, required for reschedule)
 *   newSlotEnd?: string (ISO, required for reschedule)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, newSlotStart, newSlotEnd } = body;

    if (!action || !['cancel', 'reschedule'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    if (action === 'reschedule' && (!newSlotStart || !newSlotEnd)) {
      return NextResponse.json({ error: 'New slot start and end are required for reschedule' }, { status: 400 });
    }

    // Authenticate member (support both cookie auth and Bearer token from mobile)
    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const adminSupabaseAuth = createAdminClient();
      const { data } = await adminSupabaseAuth.auth.getUser(token);
      user = data?.user || null;
    }
    if (!user) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get the booking
    const { data: booking, error: fetchError } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify this member owns the booking
    const { data: member } = await adminSupabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .eq('practitioner_id', booking.practitioner_id)
      .single();

    if (!member || booking.member_id !== member.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow modifications on future bookings
    if (new Date(booking.start_time).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Cannot modify past bookings' }, { status: 400 });
    }

    // Check practitioner settings
    const { data: settings } = await adminSupabase
      .from('booking_settings')
      .select('allow_patient_reschedule, allow_patient_cancel, modification_notice_hours, session_types, require_approval')
      .eq('user_id', booking.practitioner_id)
      .single();

    const noticeHours = settings?.modification_notice_hours ?? 48;
    const hoursUntilSession = (new Date(booking.start_time).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilSession < noticeHours) {
      return NextResponse.json({
        error: `Changes must be made at least ${noticeHours} hours before the session. Please contact your practitioner directly.`,
      }, { status: 400 });
    }

    if (action === 'cancel' && !settings?.allow_patient_cancel) {
      return NextResponse.json({ error: 'Cancellation by patient is not enabled. Please contact your practitioner.' }, { status: 403 });
    }

    if (action === 'reschedule' && !settings?.allow_patient_reschedule) {
      return NextResponse.json({ error: 'Rescheduling by patient is not enabled. Please contact your practitioner.' }, { status: 403 });
    }

    // Get practitioner info for emails
    const { data: practitioner } = await adminSupabase
      .from('users')
      .select('email, raw_user_meta_data')
      .eq('id', booking.practitioner_id)
      .single();

    const practitionerEmail = practitioner?.email;

    // Format dates for notifications
    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });

    const scheduledAt = formatDate(booking.start_time);

    // Get session type name
    const sessionTypes = (settings?.session_types as Array<{ id: string; name: string }>) || [];
    const sessionType = sessionTypes.find(st => st.id === booking.session_type);
    const sessionTypeName = sessionType?.name || booking.session_type;

    if (action === 'cancel') {
      // Cancel the booking
      await adminSupabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'member',
          cancellation_reason: reason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Cancel linked session if any
      await adminSupabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('practitioner_id', booking.practitioner_id)
        .eq('scheduled_at', booking.start_time)
        .eq('status', 'scheduled');

      // Delete Google Calendar event
      if (booking.google_event_id) {
        const googleAuth = await getValidGoogleToken(booking.practitioner_id, adminSupabase);
        if (googleAuth) {
          try {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}?sendUpdates=all`,
              { method: 'DELETE', headers: { Authorization: `Bearer ${googleAuth.accessToken}` } }
            );
          } catch (err) {
            console.error('Failed to delete calendar event:', err);
          }
        }
      }

      // Send emails to both sides (fire-and-forget)
      const metadata = { clientName: booking.client_name, scheduledAt, reason: reason.trim(), sessionType: sessionTypeName };

      ;(async () => {
        try {
          // Email to practitioner
          if (practitionerEmail) {
            const content = getNotificationContent('booking_cancelled_by_member', metadata, 'en');
            const htmlBody = generateEmailHtml({
              subject: content.emailSubject,
              body: content.body,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://care.bloomsline.com'}/bookings`,
              actionText: 'View Bookings',
            });
            await sendEmail({ to: practitionerEmail, subject: content.emailSubject, htmlBody, tag: 'booking_cancelled_by_member' });
          }

          // Email to patient
          if (booking.client_email) {
            const content = getNotificationContent('booking_cancelled', metadata, 'en');
            const htmlBody = generateEmailHtml({
              subject: content.emailSubject,
              body: `Your ${sessionTypeName} on ${scheduledAt} has been cancelled as requested.`,
              actionUrl: '',
              actionText: '',
            });
            await sendEmail({ to: booking.client_email, subject: content.emailSubject, htmlBody, tag: 'booking_cancelled_member_confirm' });
          }
        } catch (err) {
          console.error('Error sending cancellation emails:', err);
        }
      })();

      // Create in-app notification for practitioner
      await adminSupabase.from('notifications').insert({
        user_id: booking.practitioner_id,
        user_type: 'practitioner',
        type: 'booking_cancelled_by_member',
        title: `${booking.client_name} cancelled their session`,
        body: `${booking.client_name} cancelled their ${sessionTypeName} on ${scheduledAt}. Reason: ${reason.trim()}`,
        entity_type: 'booking',
        entity_id: id,
        metadata,
        action_url: `/bookings?highlight=${id}`,
      });

      return NextResponse.json({ success: true, action: 'cancelled' });
    }

    if (action === 'reschedule') {
      const newTime = formatDate(newSlotStart);

      // Cancel old booking
      await adminSupabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'member',
          cancellation_reason: `Rescheduled: ${reason.trim()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Cancel linked session
      await adminSupabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('practitioner_id', booking.practitioner_id)
        .eq('scheduled_at', booking.start_time)
        .eq('status', 'scheduled');

      // Delete old Google Calendar event
      if (booking.google_event_id) {
        const googleAuth = await getValidGoogleToken(booking.practitioner_id, adminSupabase);
        if (googleAuth) {
          try {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}?sendUpdates=all`,
              { method: 'DELETE', headers: { Authorization: `Bearer ${googleAuth.accessToken}` } }
            );
          } catch (err) {
            console.error('Failed to delete old calendar event:', err);
          }
        }
      }

      // Create new booking
      const { data: newBooking, error: createError } = await adminSupabase
        .from('bookings')
        .insert({
          practitioner_id: booking.practitioner_id,
          member_id: booking.member_id,
          client_name: booking.client_name,
          client_email: booking.client_email,
          client_phone: booking.client_phone,
          session_type: booking.session_type,
          start_time: newSlotStart,
          end_time: newSlotEnd,
          timezone: booking.timezone,
          status: settings?.require_approval ? 'pending' : 'confirmed',
          notes: booking.notes,
          rescheduled_from: id,
          rescheduled_by: 'member',
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create rescheduled booking:', createError);
        return NextResponse.json({ error: 'Failed to create new booking' }, { status: 500 });
      }

      // Create new session record (skip if approval required — session created on approval)
      if (!settings?.require_approval) {
      const durationMinutes = Math.round(
        (new Date(newSlotEnd).getTime() - new Date(newSlotStart).getTime()) / 60000
      );

      const sessionTypeMap: Record<string, string> = {
        'initial_consultation': 'initial_consultation',
        'follow_up': 'follow_up',
        'check_in': 'check_in',
        'crisis': 'crisis',
        'group': 'group',
      };

      await adminSupabase.from('sessions').insert({
        practitioner_id: booking.practitioner_id,
        member_id: booking.member_id,
        session_type: sessionTypeMap[booking.session_type] || 'check_in',
        session_format: 'virtual',
        scheduled_at: newSlotStart,
        duration_minutes: durationMinutes,
        status: 'scheduled',
        member_confirmed: true,
      });
      }

      // Sync new booking to Google Calendar (skip if pending approval)
      const googleAuth = !settings?.require_approval ? await getValidGoogleToken(booking.practitioner_id, adminSupabase) : null;
      if (googleAuth) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events?sendUpdates=all&conferenceDataVersion=1`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${googleAuth.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: `Session with ${booking.client_name}`,
                description: `${sessionTypeName} (rescheduled)\n\nClient: ${booking.client_name}\nEmail: ${booking.client_email}`,
                start: { dateTime: newSlotStart, timeZone: booking.timezone },
                end: { dateTime: newSlotEnd, timeZone: booking.timezone },
                attendees: [{ email: booking.client_email, displayName: booking.client_name }],
                conferenceData: {
                  createRequest: {
                    requestId: `bloomsline-member-${newBooking.id}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                  },
                },
              }),
            }
          );
          if (response.ok) {
            const event = await response.json();
            await adminSupabase
              .from('bookings')
              .update({ google_event_id: event.id })
              .eq('id', newBooking.id);
          }
        } catch (err) {
          console.error('Failed to create new calendar event:', err);
        }
      }

      // Send emails to both sides (fire-and-forget)
      const metadata = {
        clientName: booking.client_name,
        originalTime: scheduledAt,
        newTime,
        reason: reason.trim(),
        sessionType: sessionTypeName,
        scheduledAt: newTime,
      };

      ;(async () => {
        try {
          // Email to practitioner
          if (practitionerEmail) {
            const content = getNotificationContent('booking_rescheduled_by_member', metadata, 'en');
            const htmlBody = generateEmailHtml({
              subject: content.emailSubject,
              body: content.body,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://care.bloomsline.com'}/bookings`,
              actionText: 'View Bookings',
            });
            await sendEmail({ to: practitionerEmail, subject: content.emailSubject, htmlBody, tag: 'booking_rescheduled_by_member' });
          }

          // Confirmation email to patient with .ics
          if (booking.client_email) {
            const calendarAttachment = generateCalendarAttachment({
              uid: newBooking.id,
              summary: `${sessionTypeName} — Bloomsline Care`,
              startTime: newSlotStart,
              endTime: newSlotEnd,
              description: `Your rescheduled ${sessionTypeName} session`,
              attendeeEmail: booking.client_email,
              attendeeName: booking.client_name,
            });

            const htmlBody = generateEmailHtml({
              subject: `Session rescheduled to ${newTime}`,
              body: `Your ${sessionTypeName} has been rescheduled from ${scheduledAt} to ${newTime}.`,
              actionUrl: '',
              actionText: '',
            });

            await sendEmail({
              to: booking.client_email,
              subject: `Session rescheduled to ${newTime}`,
              htmlBody,
              tag: 'booking_rescheduled_member_confirm',
              attachments: [calendarAttachment],
            });
          }
        } catch (err) {
          console.error('Error sending reschedule emails:', err);
        }
      })();

      // Create in-app notification for practitioner
      await adminSupabase.from('notifications').insert({
        user_id: booking.practitioner_id,
        user_type: 'practitioner',
        type: 'booking_rescheduled_by_member',
        title: `${booking.client_name} rescheduled their session`,
        body: `${booking.client_name} rescheduled from ${scheduledAt} to ${newTime}. Reason: ${reason.trim()}`,
        entity_type: 'booking',
        entity_id: newBooking.id,
        metadata,
        action_url: `/bookings?highlight=${newBooking.id}`,
      });

      return NextResponse.json({ success: true, action: 'rescheduled', newBookingId: newBooking.id });
    }
  } catch (err) {
    console.error('Member action error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
