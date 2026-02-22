import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getGoogleCalendarBusyTimes } from '@/lib/services/google-calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import type { TimeSlot } from '@/types/calendar';

/**
 * GET /api/bookings/available-slots
 *
 * Public endpoint that returns available booking slots for a practitioner,
 * filtered against Google Calendar busy times when connected.
 *
 * Query params:
 *   practitionerId - UUID of the practitioner
 *   date           - YYYY-MM-DD
 *   duration       - session duration in minutes (default 60)
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.public);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const { searchParams } = request.nextUrl;
  const practitionerId = searchParams.get('practitionerId');
  const date = searchParams.get('date');
  const duration = parseInt(searchParams.get('duration') || '60', 10);

  if (!practitionerId || !date) {
    return NextResponse.json(
      { error: 'practitionerId and date are required' },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date must be YYYY-MM-DD format' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 1. Get base slots from existing RPC
  const { data: baseSlots, error: rpcError } = await supabase.rpc(
    'get_available_slots',
    {
      p_practitioner_id: practitionerId,
      p_date: date,
      p_duration: duration,
    }
  );

  if (rpcError) {
    console.error('RPC get_available_slots error:', rpcError);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }

  const slots: TimeSlot[] = baseSlots || [];

  // Get practitioner's timezone from availability schedule
  const { data: schedules } = await supabase
    .from('availability_schedules')
    .select('timezone')
    .eq('user_id', practitionerId)
    .limit(1)
    .single();

  const timezone = schedules?.timezone || 'UTC';

  // If no base slots, return early
  if (slots.length === 0) {
    return NextResponse.json({ slots: [], practitionerTimezone: timezone });
  }

  // 2. Get Google Calendar busy times (graceful fallback)
  const googleAuth = await getValidGoogleToken(practitionerId, supabase);

  if (!googleAuth) {
    console.log('[available-slots] No Google auth — returning base slots');
    return NextResponse.json({ slots, practitionerTimezone: timezone });
  }

  console.log('[available-slots] Google auth OK, calendarId:', googleAuth.calendarId);

  // Get buffer settings
  const { data: settings } = await supabase
    .from('booking_settings')
    .select('buffer_before, buffer_after')
    .eq('user_id', practitionerId)
    .single();

  const bufferBefore = (settings?.buffer_before || 0) * 60 * 1000; // to ms
  const bufferAfter = (settings?.buffer_after || 0) * 60 * 1000;

  console.log('[available-slots] Fetching busy times for', date, 'tz:', timezone);

  const busyTimes = await getGoogleCalendarBusyTimes(
    googleAuth.accessToken,
    googleAuth.calendarId,
    date,
    timezone
  );

  console.log('[available-slots] Busy times:', JSON.stringify(busyTimes));
  console.log('[available-slots] Base slots count:', slots.length, 'Buffer before:', bufferBefore, 'Buffer after:', bufferAfter);

  // If no busy times, return base slots as-is
  if (busyTimes.length === 0) {
    console.log('[available-slots] No busy times — returning base slots');
    return NextResponse.json({ slots, practitionerTimezone: timezone });
  }

  // 3. Filter out slots that overlap with busy intervals (including buffers)
  const filteredSlots = slots.filter((slot) => {
    const slotStart = new Date(slot.slot_start).getTime();
    const slotEnd = new Date(slot.slot_end).getTime();

    // Check if this slot overlaps with any busy interval
    return !busyTimes.some((busy) => {
      const busyStart = new Date(busy.start).getTime() - bufferBefore;
      const busyEnd = new Date(busy.end).getTime() + bufferAfter;

      // Overlap: slot starts before busy ends AND slot ends after busy starts
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });

  return NextResponse.json({ slots: filteredSlots, practitionerTimezone: timezone });
}
