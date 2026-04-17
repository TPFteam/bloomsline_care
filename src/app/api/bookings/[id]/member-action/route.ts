import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getNotificationContent } from '@/lib/notifications/templates';
import { generateEmailHtml } from '@/lib/notifications/email';
import { sendEmail } from '@/lib/email';
import { generateCalendarAttachment } from '@/lib/email/calendar-invite';
import { buildCalendarEvent } from '@/lib/services/calendar-event';

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
      .select('email, full_name, raw_user_meta_data')
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

      // Delete Google Calendar event — update description with reason first,
      // then delete with sendUpdates=all so Google notifies both sides.
      // No separate Bloomsline email — Google's notification is sufficient.
      if (booking.google_event_id) {
        const googleAuth = await getValidGoogleToken(booking.practitioner_id, adminSupabase);
        if (googleAuth) {
          const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`;
          const authHeaders = { Authorization: `Bearer ${googleAuth.accessToken}`, 'Content-Type': 'application/json' };

          // Map reason keys to human-readable labels
          const reasonLabels: Record<string, { en: string; fr: string }> = {
            schedule_conflict: { en: 'Schedule conflict', fr: 'Conflit d\'horaire' },
            personal_emergency: { en: 'Personal emergency', fr: 'Imprévu personnel' },
            availability_change: { en: 'Availability change', fr: 'Changement de disponibilité' },
            other: { en: 'Other', fr: 'Autre' },
          };

          try {
            const { data: pUser } = await adminSupabase.from('users').select('preferred_language').eq('id', booking.practitioner_id).single();
            const isFr = pUser?.preferred_language === 'fr';
            const reasonText = reason.trim();
            const reasonLabel = reasonLabels[reasonText]
              ? (isFr ? reasonLabels[reasonText].fr : reasonLabels[reasonText].en)
              : reasonText;
            const cancelNote = isFr
              ? `\n\n❌ Séance annulée par ${booking.client_name} — Raison : ${reasonLabel}`
              : `\n\n❌ Session cancelled by ${booking.client_name} — Reason: ${reasonLabel}`;

            // 1. Update description with reason (no notification yet)
            const eventRes = await fetch(calendarUrl, { headers: authHeaders });
            if (eventRes.ok) {
              const event = await eventRes.json();
              await fetch(`${calendarUrl}?sendUpdates=none`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ description: (event.description || '') + cancelNote }),
              });
            }

            // 2. Delete event → Google sends cancellation email to both sides
            await fetch(`${calendarUrl}?sendUpdates=all`, {
              method: 'DELETE',
              headers: authHeaders,
            });
          } catch (err) {
            console.error('Failed to update/delete calendar event:', err);
          }
        }
      }

      // Create in-app notification for practitioner
      const cancelMetadata = { clientName: booking.client_name, scheduledAt, reason: reason.trim(), sessionType: sessionTypeName };
      await adminSupabase.from('notifications').insert({
        user_id: booking.practitioner_id,
        user_type: 'practitioner',
        type: 'booking_cancelled_by_member',
        title: `${booking.client_name} cancelled their session`,
        body: `${booking.client_name} cancelled their ${sessionTypeName} on ${scheduledAt}. Reason: ${reason.trim()}`,
        entity_type: 'booking',
        entity_id: id,
        metadata: cancelMetadata,
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

      // Delete old Google Calendar event — patch description with reschedule
      // reason first so the cancellation email includes it.
      if (booking.google_event_id) {
        const googleAuth = await getValidGoogleToken(booking.practitioner_id, adminSupabase);
        if (googleAuth) {
          const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${booking.google_event_id}`;
          const authHeaders = { Authorization: `Bearer ${googleAuth.accessToken}`, 'Content-Type': 'application/json' };
          try {
            const { data: pUser } = await adminSupabase.from('users').select('preferred_language').eq('id', booking.practitioner_id).single();
            const isFr = pUser?.preferred_language === 'fr';
            const reasonText = reason.trim();
            const rescheduleNote = reasonText
              ? (isFr ? `\n\n⟳ Reprogrammé par ${booking.client_name} — Raison : ${reasonText}` : `\n\n⟳ Rescheduled by ${booking.client_name} — Reason: ${reasonText}`)
              : (isFr ? `\n\n⟳ Reprogrammé par ${booking.client_name}` : `\n\n⟳ Rescheduled by ${booking.client_name}`);

            const eventRes = await fetch(calendarUrl, { headers: authHeaders });
            if (eventRes.ok) {
              const event = await eventRes.json();
              await fetch(`${calendarUrl}?sendUpdates=none`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({ description: (event.description || '') + rescheduleNote }),
              });
            }

            await fetch(`${calendarUrl}?sendUpdates=all`, {
              method: 'DELETE',
              headers: authHeaders,
            });
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
          notes: reason.trim() ? `Rescheduled: ${reason.trim()}${booking.notes ? `\n\n${booking.notes}` : ''}` : booking.notes,
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
        session_format: booking.session_format === 'in_person' ? 'in_person' : 'virtual',
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
              body: JSON.stringify(buildCalendarEvent({
                bookingId: newBooking.id,
                practitionerName: (practitioner as any)?.full_name || (practitioner as any)?.raw_user_meta_data?.full_name || practitioner?.email || 'Practitioner',
                clientName: booking.client_name,
                clientEmail: booking.client_email,
                clientPhone: booking.client_phone,
                sessionTypeName,
                startTime: newSlotStart,
                endTime: newSlotEnd,
                timezone: booking.timezone,
                notes: booking.notes,
                locale: 'fr',
                isRescheduled: true,
              })),
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

      // No Bloomsline emails — Google Calendar handles notifications:
      // - Old event DELETE with sendUpdates=all → cancellation email (with reason)
      // - New event POST with sendUpdates=all → invitation email (with new time)

      // Create in-app notification for practitioner
      const rescheduleMetadata = { clientName: booking.client_name, originalTime: scheduledAt, newTime, reason: reason.trim(), sessionType: sessionTypeName };
      await adminSupabase.from('notifications').insert({
        user_id: booking.practitioner_id,
        user_type: 'practitioner',
        type: 'booking_rescheduled_by_member',
        title: `${booking.client_name} rescheduled their session`,
        body: `${booking.client_name} rescheduled from ${scheduledAt} to ${newTime}. Reason: ${reason.trim()}`,
        entity_type: 'booking',
        entity_id: newBooking.id,
        metadata: rescheduleMetadata,
        action_url: `/bookings?highlight=${newBooking.id}`,
      });

      return NextResponse.json({ success: true, action: 'rescheduled', newBookingId: newBooking.id });
    }
  } catch (err) {
    console.error('Member action error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
