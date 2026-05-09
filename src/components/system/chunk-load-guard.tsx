'use client'

import { useEffect } from 'react'

/**
 * Auto-recover from stale-chunk 404s after a Vercel deploy.
 *
 * Even with Skew Protection enabled, there's a small window where a
 * client holds a reference to an asset that genuinely no longer exists
 * (e.g. preview-deploy expired, or skew window timed out). When that
 * happens, the next chunk load throws and React tears the tree down to
 * the global error boundary.
 *
 * This guard listens for the underlying `<script>` / `<link>` load
 * failure on `_next/static/chunks/`, debounces aggressively (30s of
 * sessionStorage lockout), and force-reloads the page so the browser
 * fetches the fresh HTML with the new chunk hashes. Net effect: the user
 * sees a brief flash instead of a dead error screen.
 *
 * The lockout is critical — if the *new* deploy is also broken (build
 * failure, missing asset upstream), reloading every time would put the
 * tab into an infinite spin.
 */
export function ChunkLoadGuard() {
  useEffect(() => {
    const RELOAD_KEY = '__bl_chunk_reload_at'
    const LOCKOUT_MS = 30_000

    const tryReload = () => {
      try {
        const last = sessionStorage.getItem(RELOAD_KEY)
        if (last && Date.now() - parseInt(last, 10) < LOCKOUT_MS) return
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      } catch { /* sessionStorage unavailable — still reload */ }
      window.location.reload()
    }

    const onResourceError = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || ''
      if (!src.includes('/_next/static/')) return
      tryReload()
    }

    // Module-level chunk load errors (Next.js / Webpack / Turbopack).
    // The error message text varies; match the generic pattern.
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = (e.reason as { message?: string; name?: string } | null) || null
      const msg = reason?.message || ''
      const name = reason?.name || ''
      if (name === 'ChunkLoadError' || /Loading chunk \d+ failed|Failed to load chunk|Importing a module script failed/.test(msg)) {
        tryReload()
      }
    }

    window.addEventListener('error', onResourceError, true) // capture phase — script errors don't bubble
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onResourceError, true)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
