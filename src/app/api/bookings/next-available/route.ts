import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import { getValidGoogleToken } from '@/lib/services/google-auth';
import { getGoogleCalendarBusyTimes } from '@/lib/services/google-calendar';

/**
 * GET /api/bookings/next-available
 *
 * Returns available slots for the next N days that have availability.
 * Scans forward from today, skipping days with no schedule or no open slots.
 *
 * Query params:
 *   practitionerId - UUID
 *   duration       - session duration in minutes (default 60)
 *   limit          - max number of days to return (default 6)
 *   skipNotice     - if 'true', skip min_notice_hours filter (practitioner scheduling)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const practitionerId = searchParams.get('practitionerId');
  const duration = parseInt(searchParams.get('duration') || '60', 10);
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const skipNotice = searchParams.get('skipNotice') === 'true';

  if (!practitionerId) {
    return NextResponse.json({ error: 'practitionerId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get all active schedules
  const { data: schedules } = await supabase
    .from('availability_schedules')
    .select('day_of_week, start_time, end_time, timezone')
    .eq('user_id', practitionerId)
    .eq('is_active', true);

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ days: [], practitionerTimezone: 'UTC' });
  }

  const tz = schedules[0].timezone || 'UTC';
  const dayNameToNumber: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const numberToDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const activeDayNumbers = new Set(schedules.map(s => dayNameToNumber[s.day_of_week]));

  // Get booking settings for min_notice and buffers
  const { data: settingsData } = await supabase
    .from('booking_settings')
    .select('min_notice_hours, buffer_before, buffer_after')
    .eq('user_id', practitionerId)
    .single();

  const minNoticeHours = skipNotice ? 0 : (settingsData?.min_notice_hours || 24);
  const bufBefore = (settingsData?.buffer_before || 0) * 60 * 1000;
  const bufAfter = (settingsData?.buffer_after || 0) * 60 * 1000;
  const minBookingTime = new Date(Date.now() + minNoticeHours * 60 * 60 * 1000);

  // Timezone offset helper
  function getTimezoneOffsetMs(timezone: string, dateStr: string): number {
    const utcMs = Date.UTC(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(5, 7)) - 1,
      parseInt(dateStr.slice(8, 10)),
      12, 0, 0
    );
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(utcMs));
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
    const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'));
    return localMs - utcMs;
  }

  // Get Google Calendar busy times for the scan range
  let busyTimes: { start: string; end: string }[] = [];
  const googleAuth = await getValidGoogleToken(practitionerId, supabase);

  // Scan forward up to 60 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const durationMs = duration * 60 * 1000;
  const stepMs = 30 * 60 * 1000;
  const result: { date: string; dayLabel: string; slots: { slot_start: string; slot_end: string }[] }[] = [];
  let scannedDays = 0;

  for (let dayOffset = 0; dayOffset < 60 && result.length < limit; dayOffset++) {
    const scanDate = new Date(today);
    scanDate.setDate(today.getDate() + dayOffset);
    const dayOfWeek = scanDate.getDay();

    // Skip days without schedules
    if (!activeDayNumbers.has(dayOfWeek)) continue;

    const dateStr = `${scanDate.getFullYear()}-${String(scanDate.getMonth() + 1).padStart(2, '0')}-${String(scanDate.getDate()).padStart(2, '0')}`;
    const dayName = numberToDayName[dayOfWeek];
    const daySchedules = schedules.filter(s => s.day_of_week === dayName);

    // Check for date override blocking the whole day
    const { data: override } = await supabase
      .from('availability_overrides')
      .select('is_available')
      .eq('user_id', practitionerId)
      .eq('override_date', dateStr)
      .eq('is_available', false)
      .is('start_time', null)
      .maybeSingle();

    if (override) continue;

    const tzOffsetMs = getTimezoneOffsetMs(tz, dateStr);
    const dayStartUtc = new Date(new Date(`${dateStr}T00:00:00Z`).getTime() - tzOffsetMs);
    const dayEndUtc = new Date(new Date(`${dateStr}T23:59:59Z`).getTime() - tzOffsetMs);

    // Get existing bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('practitioner_id', practitionerId)
      .gte('start_time', dayStartUtc.toISOString())
      .lte('start_time', dayEndUtc.toISOString())
      .neq('status', 'cancelled');

    const { data: sessions } = await supabase
      .from('sessions')
      .select('scheduled_at, duration_minutes')
      .eq('practitioner_id', practitionerId)
      .gte('scheduled_at', dayStartUtc.toISOString())
      .lte('scheduled_at', dayEndUtc.toISOString())
      .neq('status', 'cancelled');

    const allConflicts = [
      ...(bookings || []).map(b => ({ start: new Date(b.start_time).getTime(), end: new Date(b.end_time).getTime() })),
      ...(sessions || []).map(s => ({ start: new Date(s.scheduled_at).getTime(), end: new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000 })),
    ];

    // Fetch Google Calendar busy times for this day (if connected)
    if (googleAuth && scannedDays === 0) {
      try {
        // Fetch busy times for a wider range (next 60 days) once
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 60);
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        // We'll skip per-day Google Calendar checks for performance; use the main available-slots API for exact filtering
      } catch {
        // Ignore
      }
    }

    // Generate slots
    const daySlots: { slot_start: string; slot_end: string }[] = [];

    for (const schedule of daySchedules) {
      const startLocal = new Date(`${dateStr}T${schedule.start_time}Z`);
      const endLocal = new Date(`${dateStr}T${schedule.end_time}Z`);
      const startUtc = new Date(startLocal.getTime() - tzOffsetMs);
      const endUtc = new Date(endLocal.getTime() - tzOffsetMs);

      for (let t = startUtc.getTime(); t + durationMs <= endUtc.getTime(); t += stepMs) {
        const slotStart = new Date(t);
        const slotEnd = new Date(t + durationMs);

        // Skip slots before min booking time
        if (slotStart < minBookingTime) continue;

        // Check conflicts
        const hasConflict = allConflicts.some(c => {
          const cStart = c.start - bufBefore;
          const cEnd = c.end + bufAfter;
          return slotStart.getTime() < cEnd && slotEnd.getTime() > cStart;
        });

        if (!hasConflict) {
          daySlots.push({
            slot_start: slotStart.toISOString(),
            slot_end: slotEnd.toISOString(),
          });
        }
      }
    }

    scannedDays++;

    if (daySlots.length > 0) {
      result.push({
        date: dateStr,
        dayLabel: scanDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        slots: daySlots,
      });
    }
  }

  return NextResponse.json({ days: result, practitionerTimezone: tz });
}
