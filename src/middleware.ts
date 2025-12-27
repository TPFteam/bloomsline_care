import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/home',
  '/care',
  '/worksheets',
  '/resources',
  '/members',
  '/settings',
  '/profile',
  '/library',
  '/my-stories',
]

// Routes only for non-authenticated users
const AUTH_ROUTES = ['/sign-in', '/sign-up']

// Public routes (no auth check needed)
const PUBLIC_ROUTES = ['/', '/early-access', '/onboarding', '/p/', '/stories']

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

// isPublicRoute kept for reference but not used since public routes just pass through
// function isPublicRoute(pathname: string): boolean {
//   return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
// }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

    // Handle protected routes - require authentication
    if (isProtectedRoute(pathname)) {
      if (!user) {
        // Redirect to sign-in with return URL
        const signInUrl = new URL('/sign-in', request.url)
        signInUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(signInUrl)
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

      const redirectUrl = userProfile?.user_type === 'member' ? '/home' : '/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Handle root path - redirect authenticated users based on type
    if (pathname === '/' && user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (userProfile?.user_type === 'member') {
        return NextResponse.redirect(new URL('/home', request.url))
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
