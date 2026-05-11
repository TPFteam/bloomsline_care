'use client'

/**
 * Route-level client error boundary.
 *
 * Catches every render error or unhandled exception that bubbles up out of a
 * page in the App Router and:
 *   1. Sends it to PostHog as a `client_error` event with the full stack so
 *      we can read it in the dashboard without asking the user for a
 *      screenshot.
 *   2. Renders a calm recovery UI with a Try Again button (re-mounts the
 *      crashed subtree) and a hint about translation extensions, which is
 *      the most common source of mysterious React mutation crashes.
 *
 * `global-error.tsx` is the layout-level backstop for errors that crash the
 * root layout itself.
 */

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    const payload = {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack || null,
      error_digest: error.digest || null,
      scope: 'page' as const,
      url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      // Light fingerprint for translator-extension issues; we read a known
      // English token in the DOM and report whether it survived. If a
      // translation tool is mutating text nodes, this will be different.
      translate_probe_value:
        typeof document !== 'undefined'
          ? document.querySelector('[data-translate-probe]')?.textContent || null
          : null,
    }

    // PostHog only initializes after cookie consent. Send to our own
    // consent-independent endpoint as well so non-consenting users' crashes
    // still leave a trace in Vercel logs / the client_errors table.
    try {
      void fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch {
      // network failure — nothing we can do
    }

    try {
      posthog.capture('client_error', payload)
    } catch {
      // PostHog may not be initialized yet — don't fail the error UI.
    }
    // Also log to console so dev sessions still see something useful.
    // eslint-disable-next-line no-console
    console.error('[error.tsx]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      {/* Hidden probe used to detect text-mutating translator extensions. */}
      <span
        data-translate-probe
        translate="no"
        className="sr-only"
        aria-hidden="true"
      >
        BLOOMSLINE_PROBE_EN
      </span>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-red-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-base font-semibold text-gray-900 mb-1">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          An unexpected error happened on this page. We&apos;ve logged it. Try again, or refresh the page.
        </p>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          If you&apos;re using a browser translation extension (Google Translate, Mate Translate, etc.),
          try disabling it for this site — it can interfere with the page.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Refresh page
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-[10px] text-gray-400 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
