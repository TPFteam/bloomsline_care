/**
 * PII scrubbing for PostHog event properties.
 *
 * The care-app PostHog instance has autocapture enabled, which sends DOM
 * snapshots — element text, $current_url query strings, form values — for
 * every captured event. Member emails, names, and free-text journal
 * content can land there incidentally. We scrub before the event leaves
 * the browser.
 *
 * Mirrors mobile/lib/analytics-scrub.ts intentionally (same key set,
 * same email regex) so behavior is consistent across both apps.
 */

const PII_KEYS = new Set<string>([
  'email', 'phone', 'phone_number', 'full_name', 'first_name', 'last_name',
  'name', 'display_name',
  'text_content', 'caption', 'content', 'description', 'note', 'notes',
  'message', 'title',
  'password', 'access_token', 'refresh_token', 'authorization',
  'api_key', 'service_role_key', 'secret', 'session', 'token',
])

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g

function scrubString(s: string): string {
  if (!s) return s
  return s.replace(EMAIL_RE, '<redacted-email>')
}

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return '<truncated>'
  if (value == null) return value
  if (typeof value === 'string') return scrubString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(v => scrub(v, depth + 1))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) {
        out[k] = '<redacted>'
        continue
      }
      out[k] = scrub(v, depth + 1)
    }
    return out
  }
  return value
}

/**
 * PostHog `sanitize_properties` callback. Called on every event before send.
 * Receives the merged property map; returns the same shape with PII redacted.
 */
export function sanitizePostHogProperties(
  properties: Record<string, any>,
  _event_name: string,
): Record<string, any> {
  return scrub(properties) as Record<string, any>
}
