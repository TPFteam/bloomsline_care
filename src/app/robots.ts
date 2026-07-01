import type { MetadataRoute } from 'next'

// Public pages are crawlable; the authenticated app, the practitioner blog
// authoring surface (/blogs), and API routes are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/members',
          '/member',
          '/settings',
          '/profile',
          '/library',
          '/admin',
          '/resources',
          '/blogs',
          '/api',
          '/sign-in',
          '/sign-up',
        ],
      },
    ],
    sitemap: 'https://www.bloomsline.com/sitemap.xml',
    host: 'https://www.bloomsline.com',
  }
}
