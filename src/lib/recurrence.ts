/**
 * Recurrence helpers for session series.
 *
 * Two responsibilities:
 *   1. Expand a recurrence config (frequency + count/until) into a list of
 *      concrete UTC Date occurrences, anchored to the practitioner's local
 *      timezone so DST transitions don't shift the wall-clock time.
 *   2. Validate that each generated occurrence is actually bookable against
 *      `bookings` (no overlap with another active booking) and
 *      `availability_overrides` (not on a blocked day).
 *
 * Used by the schedule-session-modal recurring flow and the booking API.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type RecurrenceFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency
  /** Stop after this many occurrences. Mutually exclusive with `until`. */
  count?: number
  /** Stop on/after this date (yyyy-mm-dd in the practitioner's timezone). */
  until?: string
}

export interface SeriesConflict {
  date: Date
  reason: 'booked' | 'override_blocked'
}

interface WallClock {
  year: number
  month: number   // 1-12
  day: number
  hour: number
  minute: number
  second: number
}

const HARD_MAX_OCCURRENCES = 52 // safety net — never generate more than ~1 year of weekly

// ---------------------------------------------------------------------------
// Timezone math
// ---------------------------------------------------------------------------

/** Project a UTC Date into wall-clock components as observed in `timezone`. */
function utcToWallClock(utc: Date, timezone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(utc)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    // Intl can return '24' at midnight in some locales; normalize to 0
    hour: get('hour') === 24 ? 0 : get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/**
 * Convert a wall-clock time in `timezone` to a UTC Date.
 *
 * Uses the same approach as schedule-session-modal's `tzToUtc`: build a UTC
 * guess from the components, observe what wall-clock the timezone reports for
 * that guess, and subtract the offset. Two iterations cover DST boundaries.
 */
function wallClockToUtc(w: WallClock, timezone: string): Date {
  const guessMs = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  const observed = utcToWallClock(new Date(guessMs), timezone)
  const observedMs = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second)
  const offsetMs = observedMs - guessMs
  return new Date(guessMs - offsetMs)
}

// ---------------------------------------------------------------------------
// Calendar arithmetic on wall-clock components (timezone-agnostic)
// ---------------------------------------------------------------------------

/** Shift a wall-clock by N calendar days using JS Date math (handles month rollover). */
function advanceWallClockDays(w: WallClock, days: number): WallClock {
  const d = new Date(Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second))
  d.setUTCDate(d.getUTCDate() + days)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: w.hour,
    minute: w.minute,
    second: w.second,
  }
}

/**
 * Shift a wall-clock by N months. If the source day doesn't exist in the
 * target month (e.g., Jan 31 + 1 month), clamp to the last day of the target
 * month. Mirrors how Google Calendar handles monthly recurrence on day-31.
 */
function advanceWallClockMonths(w: WallClock, months: number): WallClock {
  const targetMonth0 = w.month - 1 + months
  const targetYear = w.year + Math.floor(targetMonth0 / 12)
  const normalizedMonth0 = ((targetMonth0 % 12) + 12) % 12
  const lastDayOfTarget = new Date(Date.UTC(targetYear, normalizedMonth0 + 1, 0)).getUTCDate()
  return {
    year: targetYear,
    month: normalizedMonth0 + 1,
    day: Math.min(w.day, lastDayOfTarget),
    hour: w.hour,
    minute: w.minute,
    second: w.second,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Expand a recurrence config into UTC Dates anchored to `timezone`.
 *
 * The first occurrence is at `anchorUtc`. Subsequent occurrences advance the
 * calendar in `timezone` (not in UTC), so a "Tuesday 9 AM Paris" series stays
 * at 9 AM Paris time across DST switches even though the UTC offset changes.
 */
export function expandRecurrence(
  anchorUtc: Date,
  timezone: string,
  config: RecurrenceConfig,
): Date[] {
  if (config.count !== undefined && config.count <= 0) return []
  if (!config.count && !config.until) return [anchorUtc]

  const anchorWall = utcToWallClock(anchorUtc, timezone)
  const limit = Math.min(config.count ?? HARD_MAX_OCCURRENCES, HARD_MAX_OCCURRENCES)
  // `until` is end-of-day in the practitioner's timezone
  const untilUtc = config.until
    ? wallClockToUtc({ year: +config.until.slice(0, 4), month: +config.until.slice(5, 7), day: +config.until.slice(8, 10), hour: 23, minute: 59, second: 59 }, timezone)
    : null

  const out: Date[] = []
  let currentWall = anchorWall

  for (let i = 0; i < limit; i++) {
    const utc = wallClockToUtc(currentWall, timezone)
    if (untilUtc && utc.getTime() > untilUtc.getTime()) break
    out.push(utc)

    if (config.frequency === 'WEEKLY') {
      currentWall = advanceWallClockDays(currentWall, 7)
    } else if (config.frequency === 'BIWEEKLY') {
      currentWall = advanceWallClockDays(currentWall, 14)
    } else {
      currentWall = advanceWallClockMonths(currentWall, 1)
    }
  }

  return out
}

/**
 * Build an iCalendar RRULE string for Google Calendar's `recurrence` field.
 * Format reference: https://datatracker.ietf.org/doc/html/rfc5545#section-3.8.5.3
 */
export function buildRRuleString(config: RecurrenceConfig): string {
  const interval = config.frequency === 'BIWEEKLY' ? 2 : 1
  const freq = config.frequency === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY'
  const parts = [`FREQ=${freq}`, `INTERVAL=${interval}`]
  if (config.count) parts.push(`COUNT=${config.count}`)
  if (config.until) parts.push(`UNTIL=${config.until.replace(/-/g, '')}T235959Z`)
  return `RRULE:${parts.join(';')}`
}

/** Format a Date as 'yyyy-mm-dd' as observed in the given timezone. */
function formatDateInTz(d: Date, timezone: string): string {
  const w = utcToWallClock(d, timezone)
  const mm = String(w.month).padStart(2, '0')
  const dd = String(w.day).padStart(2, '0')
  return `${w.year}-${mm}-${dd}`
}

/**
 * Check that every occurrence in `dates` is actually bookable.
 *
 * Two checks per occurrence:
 *   - No overlap with any active booking on the practitioner's calendar.
 *   - No overlap with a blocking `availability_overrides` row for that date.
 *
 * We fetch both lookup tables once per call (one query each) instead of
 * per-occurrence to avoid an N+1 round-trip.
 */
export async function validateSeriesAvailability(
  supabase: SupabaseClient,
  practitionerId: string,
  dates: Date[],
  durationMinutes: number,
  timezone: string,
): Promise<{ ok: boolean; conflicts: SeriesConflict[] }> {
  if (dates.length === 0) return { ok: true, conflicts: [] }

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  const minStart = sorted[0]
  const maxEnd = new Date(sorted[sorted.length - 1].getTime() + durationMinutes * 60_000)

  const [bookingsRes, overridesRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('practitioner_id', practitionerId)
      .neq('status', 'cancelled')
      .gte('start_time', minStart.toISOString())
      .lt('start_time', maxEnd.toISOString()),
    supabase
      .from('availability_overrides')
      .select('override_date, is_available')
      .eq('user_id', practitionerId)
      .eq('is_available', false)
      .gte('override_date', formatDateInTz(minStart, timezone))
      .lte('override_date', formatDateInTz(maxEnd, timezone)),
  ])

  const existingBookings = (bookingsRes.data || []) as Array<{ start_time: string; end_time: string }>
  const blockingOverrides = (overridesRes.data || []) as Array<{ override_date: string }>
  const blockedDates = new Set(blockingOverrides.map(o => o.override_date))

  const conflicts: SeriesConflict[] = []
  for (const date of dates) {
    const startMs = date.getTime()
    const endMs = startMs + durationMinutes * 60_000

    const overlapsBooking = existingBookings.some(b => {
      const bStart = Date.parse(b.start_time)
      const bEnd = Date.parse(b.end_time)
      return startMs < bEnd && endMs > bStart
    })
    if (overlapsBooking) {
      conflicts.push({ date, reason: 'booked' })
      continue
    }

    if (blockedDates.has(formatDateInTz(date, timezone))) {
      conflicts.push({ date, reason: 'override_blocked' })
    }
  }

  return { ok: conflicts.length === 0, conflicts }
}
