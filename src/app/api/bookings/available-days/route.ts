import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';

/**
 * GET /api/bookings/available-days
 *
 * Returns the calendar dates within [from, to] that have at least one real
 * available slot, so the public booking calendar can disable empty days.
 * Uses the same per-day computation as /api/bookings/available-slots
 * (Google Calendar, buffers, conflicts, notice) for identical filtering.
 *
 * Query params:
 *   practitionerId - UUID
 *   from, to       - YYYY-MM-DD (inclusive) calendar range
 *   duration       - session duration in minutes (default 60)
 *   format         - optional session format filter
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const practitionerId = searchParams.get('practitionerId');
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const duration = searchParams.get('duration') || '60';
  const formatFilter = searchParams.get('format') || '';

  if (!practitionerId) {
    return NextResponse.json({ error: 'practitionerId is required' }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(practitionerId)) {
    return NextResponse.json({ error: 'Invalid practitioner ID format' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: 'from and to (YYYY-MM-DD) are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: schedules } = await supabase
    .from('availability_schedules')
    .select('day_of_week, timezone, session_format')
    .eq('user_id', practitionerId)
    .eq('is_active', true);

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ days: [] });
  }

  const dayNameToNumber: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const filteredSchedules = formatFilter
    ? schedules.filter((s: { session_format?: string }) => {
        const fmt = s.session_format || 'both';
        return fmt === 'both' || fmt === formatFilter;
      })
    : schedules;
  const activeDayNumbers = new Set(filteredSchedules.map((s: { day_of_week: string }) => dayNameToNumber[s.day_of_week]));

  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only scan active-schedule weekdays inside the range, from today forward.
  // Cap the number of candidate days as a safety bound.
  const candidates: string[] = [];
  const cursor = new Date(start < today ? today : start);
  while (cursor <= end && candidates.length < 45) {
    if (activeDayNumbers.has(cursor.getDay())) {
      candidates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const baseUrl = request.nextUrl.origin;
  const results = await Promise.all(
    candidates.map((dateStr) =>
      fetch(`${baseUrl}/api/bookings/available-slots?practitionerId=${practitionerId}&date=${dateStr}&duration=${duration}${formatFilter ? `&format=${formatFilter}` : ''}`)
        .then((r) => r.json())
        .then((d) => ({ dateStr, has: Array.isArray(d.slots) && d.slots.length > 0 }))
        .catch(() => ({ dateStr, has: false }))
    )
  );

  const days = results.filter((r) => r.has).map((r) => r.dateStr);
  return NextResponse.json({ days });
}
