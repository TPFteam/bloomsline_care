/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, use Redis-based solution
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `${identifier}`

  let entry = rateLimitStore.get(key)

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if available (more accurate for authenticated users)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'

  return `ip:${ip}`
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Strict limit for authentication-related endpoints
  auth: { limit: 10, windowSeconds: 60 },

  // Standard API limit
  api: { limit: 60, windowSeconds: 60 },

  // Relaxed limit for read-heavy endpoints
  read: { limit: 120, windowSeconds: 60 },

  // Very strict limit for expensive operations (AI, emails)
  expensive: { limit: 10, windowSeconds: 60 },

  // Limit for public endpoints (booking, early access)
  public: { limit: 20, windowSeconds: 60 },

  // AI summary generation (3 per 5 minutes)
  summary: { limit: 3, windowSeconds: 300 },
} as const

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  }
}

// ============================================
// CSRF / Origin Verification
// ============================================

/**
 * Verify that a request originates from the same site (CSRF protection)
 * Returns true if the request is safe, false if it might be a CSRF attack
 *
 * Note: This is additional protection on top of:
 * - Bearer token auth (not sent automatically by browsers)
 * - SameSite=Lax cookies (Supabase default)
 */
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Allow requests without origin/referer (same-origin non-CORS requests, server-side, curl)
  if (!origin && !referer) {
    return true
  }

  // Get the expected host
  const host = request.headers.get('host')
  if (!host) {
    return false
  }

  // Extract host from origin header
  if (origin) {
    try {
      const originUrl = new URL(origin)
      // Compare hosts (ignoring port for localhost)
      const originHost = originUrl.host.replace(/:\d+$/, '')
      const expectedHost = host.replace(/:\d+$/, '')
      if (originHost !== expectedHost) {
        return false
      }
    } catch {
      return false
    }
  }

  // Check referer header as fallback (when origin is not present)
  if (referer && !origin) {
    try {
      const refererUrl = new URL(referer)
      const refererHost = refererUrl.host.replace(/:\d+$/, '')
      const expectedHost = host.replace(/:\d+$/, '')
      if (refererHost !== expectedHost) {
        return false
      }
    } catch {
      return false
    }
  }

  return true
}
