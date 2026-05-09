import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel Skew Protection: tag every static asset URL with the
  // deployment ID so Vercel's edge routes old clients back to the
  // matching old deploy instead of 404'ing on stale chunk hashes.
  // Vercel auto-injects VERCEL_DEPLOYMENT_ID at build time. When the
  // env var is absent (local dev), the field is undefined and Next
  // simply skips the deployment-ID stamping — no breakage either way.
  // The Skew Protection toggle in Vercel project settings must also
  // be on for the routing layer to honour the header.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  async headers() {
    return [
      // Public booking pages + embed loader script: allow embedding from any
      // third-party site so practitioners can drop the widget into their own
      // websites. Everything else stays click-jacking-protected.
      {
        source: '/practitioner/:slug/book',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        source: '/embed.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ]
  },
};

export default nextConfig;
