'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { sanitizePostHogProperties } from './scrub'
import { isMarketingPath } from './surface'

const COOKIE_CONSENT_KEY = 'bloomsline-cookie-consent'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()

  const initPostHog = useCallback(() => {
    if (isInitialized) return

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

    if (posthogKey && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      posthog.init(posthogKey, {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage',
        disable_session_recording: false,
        autocapture: true,
        // Redact known PII (emails, names, free-text content) on every
        // event before it's POSTed to /ingest. See scrub.ts for the rules.
        sanitize_properties: sanitizePostHogProperties,
      })
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    // Marketing/public pages track by default (opt-out): initialise unless the
    // visitor has explicitly declined. The authenticated app stays opt-in
    // (requires an explicit Accept). Once initialised it persists for the session.
    const shouldInit =
      consent !== 'declined' &&
      (consent === 'accepted' || isMarketingPath(pathname || '/'))
    if (shouldInit) {
      initPostHog()
    }

    // Listen for cookie consent changes (same tab)
    const handleConsentChange = (e: CustomEvent<string>) => {
      if (e.detail === 'accepted') {
        initPostHog()
      } else if (e.detail === 'declined' && isInitialized) {
        posthog.opt_out_capturing()
      }
    }

    // Listen for storage changes (other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) {
        if (e.newValue === 'accepted' && !isInitialized) {
          initPostHog()
        } else if (e.newValue === 'declined' && isInitialized) {
          posthog.opt_out_capturing()
        }
      }
    }

    window.addEventListener('cookie-consent-change', handleConsentChange as EventListener)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('cookie-consent-change', handleConsentChange as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isInitialized, initPostHog, pathname])

  if (isInitialized) {
    return <PHProvider client={posthog}>{children}</PHProvider>
  }

  return <>{children}</>
}
