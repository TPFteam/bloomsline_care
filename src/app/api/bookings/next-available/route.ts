import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';

/**
 * GET /api/bookings/next-available
 *
 * Returns available slots for the next N days that have availability.
 * Internally calls /api/bookings/available-slots for each candidate day
 * to ensure identical filtering (Google Calendar, buffers, conflicts).
 *
 * Query params:
 *   practitionerId - UUID
 *   duration       - session duration in minutes (default 60)
 *   limit          - max number of days to return (default 6)
 *   skipNotice     - if 'true', skip min_notice_hours filter
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const practitionerId = searchParams.get('practitionerId');
  const duration = searchParams.get('duration') || '60';
  const limit = parseInt(searchParams.get('limit') || '6', 10);
  const skipNotice = searchParams.get('skipNotice') || 'false';
  const formatFilter = searchParams.get('format') || '';

  if (!practitionerId) {
    return NextResponse.json({ error: 'practitionerId is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get active schedule days to know which days to scan
  const { data: schedules } = await supabase
    .from('availability_schedules')
    .select('day_of_week, timezone, session_format')
    .eq('user_id', practitionerId)
    .eq('is_active', true);

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ days: [], practitionerTimezone: 'UTC' });
  }

  const tz = schedules[0].timezone || 'UTC';
  const dayNameToNumber: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };

  // Filter active days by format if specified
  const filteredSchedules = formatFilter
    ? schedules.filter((s: any) => {
        const fmt = s.session_format || 'both';
        return fmt === 'both' || fmt === formatFilter;
      })
    : schedules;
  const activeDayNumbers = new Set(filteredSchedules.map((s: any) => dayNameToNumber[s.day_of_week]));

  // Build the base URL for internal API calls
  const baseUrl = request.nextUrl.origin;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: { date: string; dayLabel: string; slots: { slot_start: string; slot_end: string }[] }[] = [];

  for (let dayOffset = 0; dayOffset < 60 && result.length < limit; dayOffset++) {
    const scanDate = new Date(today);
    scanDate.setDate(today.getDate() + dayOffset);

    // Skip days without schedules
    if (!activeDayNumbers.has(scanDate.getDay())) continue;

    const dateStr = `${scanDate.getFullYear()}-${String(scanDate.getMonth() + 1).padStart(2, '0')}-${String(scanDate.getDate()).padStart(2, '0')}`;

    // Call the existing available-slots API for this day
    try {
      const res = await fetch(
        `${baseUrl}/api/bookings/available-slots?practitionerId=${practitionerId}&date=${dateStr}&duration=${duration}&skipNotice=${skipNotice}${formatFilter ? `&format=${formatFilter}` : ''}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      const slots = data.slots || [];

      if (slots.length > 0) {
        result.push({
          date: dateStr,
          dayLabel: scanDate.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          }),
          slots,
        });
      }
    } catch (err) {
      console.error(`[next-available] Error fetching slots for ${dateStr}:`, err);
    }
  }

  return NextResponse.json({ days: result, practitionerTimezone: tz });
}
