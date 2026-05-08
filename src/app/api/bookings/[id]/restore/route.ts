/**
 * POST /api/bookings/[id]/restore
 *
 * Undo path for a single-occurrence cancel (`series_scope: 'this'`).
 * Restores the booking + matching session to confirmed/scheduled and tries
 * to flip the Google Calendar instance back to `confirmed`.
 *
 * Caveat: between the original cancel and this restore, Google has already
 * delivered a "your appointment was cancelled" email to the patient. The
 * restore re-confirms the slot in their calendar but Google sends a fresh
 * "appointment updated" notification. The practitioner is told this in the
 * toast UI before they click Undo.
 *
 * Limited to bookings that were cancelled within the last 5 minutes — this
 * is a UX undo, not a general-purpose restoration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: booking, error: fetchErr } = await adminSupabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.practitioner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'cancelled') {
      return NextResponse.json({ error: 'Booking is not cancelled' }, { status: 400 });
    }

    // Sanity-check: don't restore bookings cancelled long ago.
    if (booking.cancelled_at) {
      const minutesSinceCancel = (Date.now() - new Date(booking.cancelled_at).getTime()) / 60_000;
      if (minutesSinceCancel > 5) {
        return NextResponse.json({ error: 'Undo window expired' }, { status: 410 });
      }
    }

    const nowIso = new Date().toISOString();

    // 1. Flip the booking row back to confirmed.
    await adminSupabase
      .from('bookings')
      .update({
        status: 'confirmed',
        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
        updated_at: nowIso,
      })
      .eq('id', id);

    // 2. Flip the matching session row back to scheduled.
    if (booking.member_id) {
      await adminSupabase
        .from('sessions')
        .update({ status: 'scheduled', updated_at: nowIso })
        .eq('practitioner_id', booking.practitioner_id)
        .eq('member_id', booking.member_id)
        .eq('scheduled_at', booking.start_time)
        .eq('status', 'cancelled');
    }

    // 3. Restore the Google instance (only if it's a series row and we have
    //    the parent google_event_id). Single-booking restores would need a
    //    full event recreate — not in scope for v1.
    if (booking.google_event_id && booking.series_id) {
      const googleAuth = await getValidGoogleToken(user.id, adminSupabase);
      if (googleAuth) {
        const startUtc = new Date(booking.start_time);
        const yyyy = startUtc.getUTCFullYear();
        const mm = String(startUtc.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(startUtc.getUTCDate()).padStart(2, '0');
        const hh = String(startUtc.getUTCHours()).padStart(2, '0');
        const mi = String(startUtc.getUTCMinutes()).padStart(2, '0');
        const ss = String(startUtc.getUTCSeconds()).padStart(2, '0');
        const instanceId = `${booking.google_event_id}_${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
        const instanceUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleAuth.calendarId)}/events/${instanceId}`;
        try {
          await fetch(`${instanceUrl}?sendUpdates=all`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${googleAuth.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'confirmed' }),
          });
        } catch (err) {
          console.warn('Failed to restore Google instance:', err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Restore error:', err);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}
