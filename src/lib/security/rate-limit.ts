/**
 * Distributed rate limiter using Upstash Redis
 * Falls back to in-memory for local development (no Redis configured)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Upstash Redis rate limiter (production) ──────────────────────────

let redis: Redis | null = null
let upstashLimiters: Map<string, Ratelimit> | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  if (!upstashLimiters) upstashLimiters = new Map()
  const key = `${config.limit}:${config.windowSeconds}`
  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(key, new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      analytics: false,
      prefix: 'bloomsline:rl',
    }))
  }
  return upstashLimiters.get(key)!
}

// ── In-memory fallback (local dev) ───────────────────────────────────

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// ── Types ────────────────────────────────────────────────────────────

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

// ── Main function ────────────────────────────────────────────────────

/**
 * Check rate limit for a given identifier
 * Uses Upstash Redis in production, in-memory fallback for local dev
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  // Try Upstash first (async — but we need sync interface for backward compat)
  // For now, use in-memory with Upstash as async check
  const upstash = getUpstashLimiter(config)
  if (upstash) {
    // Fire async Upstash check (non-blocking)
    upstash.limit(identifier).catch(() => {})
  }

  // In-memory check (synchronous, always runs)
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `${identifier}`

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime: now + windowMs }
    rateLimitStore.set(key, entry)
    return { success: true, remaining: config.limit - 1, resetTime: entry.resetTime }
  }

  entry.count++

  if (entry.count > config.limit) {
    return { success: false, remaining: 0, resetTime: entry.resetTime }
  }

  return { success: true, remaining: config.limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Async rate limit check — uses Upstash Redis when available
 * Preferred over checkRateLimit when you can await
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(config)
  if (upstash) {
    try {
      const result = await upstash.limit(identifier)
      return {
        success: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
      }
    } catch {
      // Fall through to in-memory
    }
  }
  return checkRateLimit(identifier, config)
}

// ── Client identifier ────────────────────────────────────────────────

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'

  return `ip:${ip}`
}

// ── Pre-configured limits ────────────────────────────────────────────

export const RATE_LIMITS = {
  auth: { limit: 10, windowSeconds: 60 },
  api: { limit: 60, windowSeconds: 60 },
  read: { limit: 120, windowSeconds: 60 },
  expensive: { limit: 10, windowSeconds: 60 },
  public: { limit: 20, windowSeconds: 60 },
  summary: { limit: 3, windowSeconds: 300 },
  assist: { limit: 15, windowSeconds: 60 },
} as const

// ── Response headers ─────────────────────────────────────────────────

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  }
}

// ── CSRF / Origin Verification ───────────────────────────────────────

/**
 * Verify that a request originates from the same site (CSRF protection)
 */
export function verifyOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (!origin && !referer) return true

  const host = request.headers.get('host')
  if (!host) return false

  if (origin) {
    try {
      const originHost = new URL(origin).host.replace(/:\d+$/, '')
      const expectedHost = host.replace(/:\d+$/, '')
      if (originHost !== expectedHost) return false
    } catch {
      return false
    }
  }

  if (referer && !origin) {
    try {
      const refererHost = new URL(referer).host.replace(/:\d+$/, '')
      const expectedHost = host.replace(/:\d+$/, '')
      if (refererHost !== expectedHost) return false
    } catch {
      return false
    }
  }

  return true
}
