import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Session } from '@supabase/supabase-js'

/** Build mobile app URL with session tokens for seamless auth handoff */
function mobileAppUrl(session: Session | null): string {
  const base = 'https://app.bloomsline.com'
  if (!session?.access_token || !session?.refresh_token) return base
  return `${base}/#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer`
}

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/resources',
  '/members',
  '/settings',
  '/profile',
  '/library',
  '/member',
]

// Web routes members are allowed to access (subset of PROTECTED_ROUTES)
const MEMBER_ROUTES = ['/member']

function isMemberRoute(pathname: string): boolean {
  return MEMBER_ROUTES.some(route => pathname.startsWith(route))
}

// Routes only for non-authenticated users
const AUTH_ROUTES = ['/sign-in', '/sign-up']

// Public routes (no auth check needed)
const PUBLIC_ROUTES = ['/', '/early-access', '/onboarding', '/practitioner/', '/stories', '/for-everyone']

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CORS for Expo app API routes (bloom + auth setup)
  if (pathname.startsWith('/api/bloom/') || pathname.startsWith('/api/auth/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  // Skip middleware for API routes, static files, and auth callback
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // Public routes (except '/') never need auth — return immediately
  if (isPublicRoute(pathname) && pathname !== '/') {
    return response
  }

  // '/' without auth cookies — show landing page instantly, skip getUser()
  if (pathname === '/' && !hasAuthCookie) {
    return response
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    // Handle protected routes - require authentication
    if (isProtectedRoute(pathname)) {
      if (!user) {
        // Redirect to sign-in with return URL
        const signInUrl = new URL('/sign-in', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signInUrl)
      }

      // Check user type for members
      const { data: protectedProfile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (protectedProfile?.user_type === 'member') {
        // Allow members on /member routes, redirect others to /member
        if (isMemberRoute(pathname)) {
          return response
        }
        return NextResponse.redirect(new URL('/member', request.url))
      }
    }

    // Handle auth routes - redirect authenticated users away
    if (isAuthRoute(pathname) && user) {
      // Get user type to redirect appropriately
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (userProfile?.user_type === 'member') {
        return NextResponse.redirect(new URL('/member', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Handle root path - redirect authenticated users based on type
    if (pathname === '/' && user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (userProfile?.user_type === 'member') {
        return NextResponse.redirect(new URL('/member', request.url))
      } else if (userProfile?.user_type) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch (error) {
    // On error, allow request to continue (fail open for better UX)
    // Individual pages can handle auth state
    if (process.env.NODE_ENV === 'development') {
      console.error('Middleware error')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
