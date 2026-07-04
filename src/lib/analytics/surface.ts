// Shared route classification for analytics. `app` = the authenticated app /
// auth funnel; `marketing` = public pages (home, blog, pricing, directory,
// legal, pitch…). Used by the PostHog provider (to decide when to initialise)
// and the surface super-property tagger.

export const APP_PREFIXES = [
  '/dashboard', '/members', '/member', '/settings', '/profile', '/library',
  '/resources', '/analytics', '/blogs', '/bookings', '/shared-resources',
  '/admin', '/sign-in', '/sign-up',
]

export function isMarketingPath(pathname: string): boolean {
  return !APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function surfaceFor(pathname: string): 'app' | 'marketing' {
  return isMarketingPath(pathname) ? 'marketing' : 'app'
}
