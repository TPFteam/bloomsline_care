import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getGoogleCalendarBusyTimes } from '@/lib/services/google-calendar';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { syncCancelledGoogleEvents } from '@/lib/services/google-calendar-sync';
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
  const formatFilter = searchParams.get('format'); // 'in_person', 'video', or null (all)

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

  // Sync: check if any confirmed bookings were cancelled on Google Calendar
  // Fire-and-forget to not block the response, but await briefly
  try {
    await syncCancelledGoogleEvents(practitionerId, supabase)
  } catch (err) {
    console.error('[available-slots] Google sync check failed:', err)
  }

  let slots: TimeSlot[];
  let knownTz: string | null = null;

  if (skipNotice) {
    // Practitioner scheduling internally — build slots without min_notice_hours filter
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[new Date(date + 'T12:00:00').getDay()];

    console.log('[available-slots] skipNotice mode, practitionerId:', practitionerId, 'date:', date, 'dayOfWeek:', dayOfWeek);

    // Get availability schedules for this day
    let { data: schedules, error: schedError } = await supabase
      .from('availability_schedules')
      .select('start_time, end_time, timezone, session_format')
      .eq('user_id', practitionerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    // Filter by session format if requested
    if (formatFilter && schedules) {
      schedules = schedules.filter((s: any) => {
        const fmt = s.session_format || 'both';
        return fmt === 'both' || fmt === formatFilter;
      });
    }

    console.log('[available-slots] schedules for', dayOfWeek, ':', JSON.stringify(schedules), 'error:', schedError);

    // If no schedules exist for this day, return empty
    // (Do NOT auto-seed — practitioners manage their own availability)

    if (!schedules || schedules.length === 0) {
      // Still fetch timezone from any schedule day for display
      const { data: anySchedule } = await supabase
        .from('availability_schedules')
        .select('timezone')
        .eq('user_id', practitionerId)
        .limit(1)
        .maybeSingle();
      return NextResponse.json({ slots: [], practitionerTimezone: anySchedule?.timezone || 'UTC' });
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

    const tz = schedules[0].timezone || 'UTC';
    knownTz = tz;

    // Calculate the UTC offset for the practitioner's timezone on this date.
    // Uses Intl.DateTimeFormat to reliably get the offset — works on any server locale.
    function getTimezoneOffsetMs(timezone: string, dateStr: string): number {
      // Create a known UTC reference point at noon on the date
      const utcMs = Date.UTC(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(5, 7)) - 1,
        parseInt(dateStr.slice(8, 10)),
        12, 0, 0
      )
      // Format that UTC moment in the target timezone to extract its local components
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).formatToParts(new Date(utcMs))
      const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
      const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'))
      // Offset = local - UTC (positive means timezone is ahead of UTC)
      // e.g., Paris UTC+2: localMs(14:00) - utcMs(12:00) = +7200000
      return localMs - utcMs
    }

    const tzOffsetMs = getTimezoneOffsetMs(tz, date);

    // Calculate the practitioner's local day boundaries in UTC
    // e.g., for Paris (UTC+2) on May 5: day starts May 4 22:00 UTC, ends May 5 22:00 UTC
    const dayStartLocal = new Date(`${date}T00:00:00Z`);
    const dayEndLocal = new Date(`${date}T23:59:59Z`);
    const dayStartUtc = new Date(dayStartLocal.getTime() - tzOffsetMs).toISOString();
    const dayEndUtc = new Date(dayEndLocal.getTime() - tzOffsetMs).toISOString();

    // Get existing bookings for conflict check (using timezone-aware day boundaries)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('practitioner_id', practitionerId)
      .gte('start_time', dayStartUtc)
      .lte('start_time', dayEndUtc)
      .neq('status', 'cancelled');

    // Also check sessions table for conflicts (sessions without bookings)
    const { data: sessionConflicts } = await supabase
      .from('sessions')
      .select('scheduled_at, duration_minutes')
      .eq('practitioner_id', practitionerId)
      .gte('scheduled_at', dayStartUtc)
      .lte('scheduled_at', dayEndUtc)
      .neq('status', 'cancelled');

    const { data: bufferSettings } = await supabase
      .from('booking_settings')
      .select('buffer_before, buffer_after')
      .eq('user_id', practitionerId)
      .single();

    const bufBefore = (bufferSettings?.buffer_before || 0) * 60 * 1000;
    const bufAfter = (bufferSettings?.buffer_after || 0) * 60 * 1000;

    // Merge bookings + sessions into one conflict list
    const allConflicts = [
      ...(bookings || []).map(b => ({ start: new Date(b.start_time).getTime(), end: new Date(b.end_time).getTime() })),
      ...(sessionConflicts || []).map(s => ({ start: new Date(s.scheduled_at).getTime(), end: new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000 })),
    ];

    // Generate slots from each schedule window
    const generatedSlots: TimeSlot[] = [];
    const durationMs = duration * 60 * 1000;
    const stepMs = 30 * 60 * 1000;

    for (const schedule of schedules) {
      // Convert practitioner local times to UTC
      // schedule.start_time is like "09:00:00" in the practitioner's timezone
      const startLocal = new Date(`${date}T${schedule.start_time}Z`);
      const endLocal = new Date(`${date}T${schedule.end_time}Z`);
      const startUtc = new Date(startLocal.getTime() - tzOffsetMs);
      const endUtc = new Date(endLocal.getTime() - tzOffsetMs);

      for (let t = startUtc.getTime(); t + durationMs <= endUtc.getTime(); t += stepMs) {
        const slotStart = new Date(t);
        const slotEnd = new Date(t + durationMs);

        // Check for conflicts with existing bookings + sessions
        const hasConflict = allConflicts.some((c) => {
          const cStart = c.start - bufBefore;
          const cEnd = c.end + bufAfter;
          return slotStart.getTime() < cEnd && slotEnd.getTime() > cStart;
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

  // Get practitioner's timezone (use cached value from skipNotice path, or re-query)
  let timezone: string;
  if (knownTz) {
    timezone = knownTz;
  } else {
    const { data: tzRow } = await supabase
      .from('availability_schedules')
      .select('timezone')
      .eq('user_id', practitionerId)
      .limit(1)
      .maybeSingle();
    timezone = tzRow?.timezone || 'UTC';
  }

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
    console.log('[available-slots] No busy times found — returning all base slots');
    return NextResponse.json({ slots, practitionerTimezone: timezone, calendarFiltered: true, busyCount: 0 });
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
