import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only check auth for the root path
  if (pathname !== '/') {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Middleware: Root path accessed', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    // If user is logged in and on root page, redirect based on user type
    if (user) {
      // Get user profile to check type
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      console.log('Middleware: User profile', {
        userType: userProfile?.user_type,
        profileError: profileError?.message
      })

      if (userProfile?.user_type === 'member') {
        return NextResponse.redirect(new URL('/home', request.url))
      } else if (userProfile?.user_type) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: ['/'],
}
