'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { surfaceFor } from './surface'

/**
 * Tags every PostHog event with `surface` = 'app' | 'marketing' so traffic can
 * be split between the marketing site and the authenticated app. Registering a
 * super-property on each route change means the autocaptured $pageview and all
 * subsequent events carry it. Mount inside PostHogProvider in the app layout.
 */
export function PostHogSurface() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || !posthog.__loaded) return
    posthog.register({ surface: surfaceFor(pathname || '/') })
  }, [pathname])

  return null
}
