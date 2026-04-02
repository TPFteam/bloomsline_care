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
  const skipNotice = searchParams.get('skipNotice') === 'true';

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

  let slots: TimeSlot[];

  if (skipNotice) {
    // Practitioner scheduling internally — build slots without min_notice_hours filter
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[new Date(date + 'T12:00:00').getDay()];

    console.log('[available-slots] skipNotice mode, practitionerId:', practitionerId, 'date:', date, 'dayOfWeek:', dayOfWeek);

    // Get availability schedules for this day
    let { data: schedules, error: schedError } = await supabase
      .from('availability_schedules')
      .select('start_time, end_time, timezone')
      .eq('user_id', practitionerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    console.log('[available-slots] schedules for', dayOfWeek, ':', JSON.stringify(schedules), 'error:', schedError);

    // Check if user has ANY schedules at all
    const { data: allSchedules } = await supabase
      .from('availability_schedules')
      .select('day_of_week')
      .eq('user_id', practitionerId)
      .limit(1);

    // If no schedules exist at all, seed default Mon-Fri 9-5
    if (!allSchedules || allSchedules.length === 0) {
      console.log('[available-slots] No schedules found — seeding defaults for user:', practitionerId);
      const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const { error: seedError } = await supabase
        .from('availability_schedules')
        .insert(
          defaultDays.map((day) => ({
            user_id: practitionerId,
            day_of_week: day,
            start_time: '09:00:00',
            end_time: '17:00:00',
            is_active: true,
            timezone: 'Europe/Paris',
          }))
        );

      if (seedError) {
        console.error('[available-slots] Seed error:', seedError);
        return NextResponse.json({ slots: [], practitionerTimezone: 'Europe/Paris' });
      }

      // Re-query for the requested day
      const { data: seededSchedules } = await supabase
        .from('availability_schedules')
        .select('start_time, end_time, timezone')
        .eq('user_id', practitionerId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (!seededSchedules || seededSchedules.length === 0) {
        // Requested day is a weekend
        return NextResponse.json({ slots: [], practitionerTimezone: 'Europe/Paris' });
      }

      // Use the seeded schedules and continue to slot generation below
      schedules = seededSchedules;
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ slots: [], practitionerTimezone: 'UTC' });
    }

    // Check for date override blocking the whole day
    const { data: override } = await supabase
      .from('availability_overrides')
      .select('is_available')
      .eq('user_id', practitionerId)
      .eq('override_date', date)
      .eq('is_available', false)
      .is('start_time', null)
      .maybeSingle();

    if (override) {
      return NextResponse.json({ slots: [], practitionerTimezone: schedules[0].timezone || 'UTC' });
    }

    // Get existing bookings for conflict check
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('practitioner_id', practitionerId)
      .gte('start_time', `${date}T00:00:00`)
      .lte('start_time', `${date}T23:59:59`)
      .neq('status', 'cancelled');

    const { data: bufferSettings } = await supabase
      .from('booking_settings')
      .select('buffer_before, buffer_after')
      .eq('user_id', practitionerId)
      .single();

    const bufBefore = (bufferSettings?.buffer_before || 0) * 60 * 1000;
    const bufAfter = (bufferSettings?.buffer_after || 0) * 60 * 1000;

    // Generate slots from each schedule window
    const generatedSlots: TimeSlot[] = [];
    const tz = schedules[0].timezone || 'UTC';
    const durationMs = duration * 60 * 1000;
    const stepMs = 30 * 60 * 1000;

    for (const schedule of schedules) {
      // schedule.start_time / end_time are like "09:00:00"
      // Create Date objects treating these as local times in the practitioner's timezone
      // by using toLocaleString to get the UTC equivalent
      const startLocal = new Date(`${date}T${schedule.start_time}`);
      const endLocal = new Date(`${date}T${schedule.end_time}`);

      // Get UTC offset for practitioner's timezone on this date
      const refDate = new Date(`${date}T12:00:00Z`);
      const utcStr = refDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzStr = refDate.toLocaleString('en-US', { timeZone: tz });
      const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime();

      // Convert practitioner local times to UTC
      const startUtc = new Date(startLocal.getTime() + offsetMs);
      const endUtc = new Date(endLocal.getTime() + offsetMs);

      for (let t = startUtc.getTime(); t + durationMs <= endUtc.getTime(); t += stepMs) {
        const slotStart = new Date(t);
        const slotEnd = new Date(t + durationMs);

        // Check for conflicts with existing bookings
        const hasConflict = (bookings || []).some((b) => {
          const bStart = new Date(b.start_time).getTime() - bufBefore;
          const bEnd = new Date(b.end_time).getTime() + bufAfter;
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });

        if (!hasConflict) {
          generatedSlots.push({
            slot_start: slotStart.toISOString(),
            slot_end: slotEnd.toISOString(),
          });
        }
      }
    }

    slots = generatedSlots;
  } else {
    // Public booking — use RPC with min_notice_hours filter
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

    slots = baseSlots || [];
  }

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
    return NextResponse.json({ slots: [], practitionerTimezone: timezone, v: 2 });
  }

  // 2. Get Google Calendar busy times (graceful fallback)
  const googleAuth = await getValidGoogleToken(practitionerId, supabase);

  if (!googleAuth) {
    console.warn('[available-slots] No Google auth — returning base slots WITHOUT calendar filtering. Practitioner:', practitionerId);
    return NextResponse.json({ slots, practitionerTimezone: timezone, calendarFiltered: false, v: 2 });
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

  console.log('[available-slots] Filtered:', slots.length, '→', filteredSlots.length, 'slots (removed', slots.length - filteredSlots.length, 'busy)');
  return NextResponse.json({ slots: filteredSlots, practitionerTimezone: timezone, calendarFiltered: true });
}
