/**
 * Input validation utilities for API endpoints
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate ISO date string
 */
export function isValidISODate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime()) && dateStr === date.toISOString()
}

/**
 * Validate date string (ISO format or common formats)
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * Validate that end time is after start time
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start
}

/**
 * Sanitize and bound a pagination limit
 */
export function sanitizeLimit(value: string | null, defaultValue = 50, max = 100): number {
  const parsed = parseInt(value || String(defaultValue), 10)
  if (isNaN(parsed) || parsed < 1) return defaultValue
  return Math.min(parsed, max)
}

/**
 * Sanitize and bound a pagination offset
 */
export function sanitizeOffset(value: string | null, defaultValue = 0): number {
  const parsed = parseInt(value || String(defaultValue), 10)
  if (isNaN(parsed) || parsed < 0) return defaultValue
  return parsed
}

/**
 * Sanitize string input (trim and limit length)
 */
export function sanitizeString(
  value: string | undefined | null,
  maxLength = 1000
): string {
  if (!value) return ''
  return value.trim().slice(0, maxLength)
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate locale
 */
export function isValidLocale(locale: string): locale is 'en' | 'fr' {
  return locale === 'en' || locale === 'fr'
}

/**
 * Validate timezone string (basic check)
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}
