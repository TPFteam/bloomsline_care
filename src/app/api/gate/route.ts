import { NextRequest, NextResponse } from 'next/server'
import { GATE_COOKIE, gateToken } from '@/lib/gate'

// POST { password } → validates against PITCH_PASSWORD (server-only) and, when
// correct, sets the httpOnly gate cookie. The password is never returned and
// never stored client-side.
export async function POST(request: NextRequest) {
  const expected = process.env.PITCH_PASSWORD
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'Gate not configured' }, { status: 500 })
  }

  let password = ''
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Case- and whitespace-insensitive so "Early-Bloomers " still works.
  const norm = (s: string) => s.trim().toLowerCase()
  if (norm(password) !== norm(expected)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(GATE_COOKIE, await gateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
