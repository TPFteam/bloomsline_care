import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import Holidays from 'date-holidays'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

/**
 * Public-holiday lookup for the "import holidays" flow in the time-off picker.
 *
 * Runs server-side so the ~200-country `date-holidays` dataset never ships in
 * the client bundle. It computes movable feasts (Easter) and lunar/Islamic
 * holidays (e.g. Morocco's Eid) correctly, which a hardcoded table can't.
 *
 *   GET /api/availability/holidays               → { countries: { FR: 'France', ... } }
 *   GET /api/availability/holidays?country=FR&year=2026&lang=fr
 *                                                → { holidays: [{ date, name }], year, country }
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rl = checkRateLimit(clientId, RATE_LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: getRateLimitHeaders(rl) })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const country = searchParams.get('country')
  const lang = (searchParams.get('lang') || 'en').slice(0, 2).toLowerCase()

  // No country → the picker's country list.
  if (!country) {
    const countries = new Holidays().getCountries(lang) || new Holidays().getCountries('en')
    return NextResponse.json({ countries })
  }

  if (!/^[A-Za-z]{2}$/.test(country)) {
    return NextResponse.json({ error: 'Invalid country code' }, { status: 400 })
  }

  const parsedYear = parseInt(searchParams.get('year') || '', 10)
  const year = Number.isFinite(parsedYear) && parsedYear >= 1970 && parsedYear <= 2100
    ? parsedYear
    : new Date().getFullYear()

  let hd
  try {
    hd = new Holidays(country.toUpperCase())
    // Prefer the UI language, then English/French, else the country default.
    hd.setLanguages([lang, 'en', 'fr'])
  } catch {
    return NextResponse.json({ error: 'Unsupported country' }, { status: 400 })
  }

  const raw = hd.getHolidays(year) || []
  const seen = new Set<string>()
  const holidays: Array<{ date: string; name: string }> = []
  for (const h of raw) {
    if (h.type !== 'public') continue // skip optional / observance / bank days
    const date = String(h.date).slice(0, 10) // 'YYYY-MM-DD HH:mm:ss [tz]' → 'YYYY-MM-DD'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || seen.has(date)) continue
    seen.add(date)
    holidays.push({ date, name: h.name })
  }
  holidays.sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ holidays, year, country: country.toUpperCase() })
}
