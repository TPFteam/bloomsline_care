'use client'

/**
 * Layout-level error backstop.
 *
 * `error.tsx` only catches errors that bubble up out of pages — it can't
 * catch errors from the root layout itself (`app/layout.tsx`) or the
 * providers it mounts. `global-error.tsx` is Next.js's escape hatch for
 * those rare but show-stopping cases.
 *
 * Important: this file MUST render its own <html> and <body> because it
 * replaces the root layout when invoked.
 */

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    try {
      posthog.capture('client_error', {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack || null,
        error_digest: error.digest || null,
        scope: 'global',
        url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      })
    } catch {
      // PostHog may not be initialized — error UI must still render.
    }
    // eslint-disable-next-line no-console
    console.error('[global-error.tsx]', error)
  }, [error])

  return (
    <html lang="en" translate="no">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', background: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 6 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5, margin: 0, marginBottom: 16 }}>
              The app hit an unexpected error. We&apos;ve logged it. Try again, or refresh.
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, margin: 0, marginBottom: 20 }}>
              If you&apos;re using a browser translation extension, try disabling it — it often
              interferes with this kind of page.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={reset}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#111827', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}
              >
                Try again
              </button>
              <button
                onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 500, border: '1px solid #e5e7eb', cursor: 'pointer' }}
              >
                Refresh page
              </button>
            </div>
            {error.digest && (
              <p style={{ marginTop: 16, fontSize: 10, color: '#9ca3af', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>
                ref: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
