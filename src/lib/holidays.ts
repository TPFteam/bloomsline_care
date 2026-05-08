/**
 * Hardcoded national holiday lookup for the recurring-series booking flow.
 *
 * We use this only as a *warning* (not a hard block) — the practitioner can
 * still confirm a series that lands on a holiday. Patient-side `availability_overrides`
 * is the authoritative blocker for vacations the practitioner explicitly set.
 *
 * Two locales for now (FR + US). Extend by adding entries; date strings are
 * `MM-DD` (year-agnostic) for fixed-date holidays plus a few computed Easter
 * holidays for FR which shift each year.
 */

export type Locale = 'fr' | 'en' | 'es'

interface HolidayEntry {
  /** YYYY-MM-DD when the holiday is year-specific, or MM-DD for fixed annual */
  date: string
  name: string
}

// Fixed-date holidays repeated every year (MM-DD).
const FR_FIXED: HolidayEntry[] = [
  { date: '01-01', name: 'Jour de l\'an' },
  { date: '05-01', name: 'Fête du Travail' },
  { date: '05-08', name: 'Victoire 1945' },
  { date: '07-14', name: 'Fête nationale' },
  { date: '08-15', name: 'Assomption' },
  { date: '11-01', name: 'Toussaint' },
  { date: '11-11', name: 'Armistice 1918' },
  { date: '12-25', name: 'Noël' },
]

const US_FIXED: HolidayEntry[] = [
  { date: '01-01', name: 'New Year\'s Day' },
  { date: '07-04', name: 'Independence Day' },
  { date: '11-11', name: 'Veterans Day' },
  { date: '12-25', name: 'Christmas Day' },
]

/**
 * Easter Sunday for a given year (Anonymous Gregorian algorithm).
 * Used to derive Easter Monday + Ascension + Pentecost for FR.
 */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const L = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * L) / 451)
  const month = Math.floor((h + L - 7 * m + 114) / 31)
  const day = ((h + L - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function addDaysUtc(d: Date, n: number): Date {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}

/**
 * Build the holiday set for a given year + locale, expressed as a set of
 * `YYYY-MM-DD` strings for O(1) lookup.
 */
export function getHolidaysForYear(year: number, locale: Locale): Map<string, string> {
  const map = new Map<string, string>()
  const fixed = locale === 'fr' ? FR_FIXED : locale === 'en' ? US_FIXED : []
  for (const h of fixed) {
    map.set(`${year}-${h.date}`, h.name)
  }

  if (locale === 'fr') {
    const easter = easterSunday(year)
    const easterMonday = addDaysUtc(easter, 1)
    const ascension = addDaysUtc(easter, 39)
    const pentecost = addDaysUtc(easter, 50)
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    map.set(fmt(easterMonday), 'Lundi de Pâques')
    map.set(fmt(ascension), 'Ascension')
    map.set(fmt(pentecost), 'Lundi de Pentecôte')
  }

  return map
}

/**
 * Look up a holiday name for a date (in the practitioner's timezone) given a
 * locale. Returns null when the date isn't a holiday.
 */
export function getHolidayName(
  date: Date,
  timezone: string,
  locale: Locale,
): string | null {
  // Format the date as YYYY-MM-DD in the target timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => parts.find(p => p.type === t)?.value || ''
  const yyyy = parseInt(get('year'), 10)
  const key = `${yyyy}-${get('month')}-${get('day')}`
  const map = getHolidaysForYear(yyyy, locale)
  return map.get(key) || null
}
