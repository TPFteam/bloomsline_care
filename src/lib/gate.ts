// Password gate for the investor-facing pages (/pitch, /vision).
//
// Security model: the password lives ONLY in the server env var
// PITCH_PASSWORD (never NEXT_PUBLIC, so it is never shipped to the browser).
// The cookie holds a SHA-256 token derived from the password, not the password
// itself, and is httpOnly so client JS cannot read it. Middleware checks the
// token before any page content is served, so an unauthenticated visitor
// cannot extract the password or the deck from the console.

export const GATE_COOKIE = 'bl_gate'
export const GATED_ROUTES = ['/pitch', '/vision']

export function isGatedRoute(pathname: string): boolean {
  return GATED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

// Deterministic token derived from the password. Works in both the edge
// middleware and Node route handlers (Web Crypto is available in both).
export async function gateToken(): Promise<string> {
  const pw = process.env.PITCH_PASSWORD || ''
  const data = new TextEncoder().encode('bloomsline-gate::v1::' + pw)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
