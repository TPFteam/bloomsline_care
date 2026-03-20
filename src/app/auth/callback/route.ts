import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase/server-client'
import { setupNewUser } from '@/lib/auth/setup-new-user'

/** Build the mobile app URL with session tokens so the member is auto-logged-in */
function mobileAppUrl(session: { access_token: string; refresh_token: string } | null): string {
  const base = 'https://app.bloomsline.com'
  if (!session?.access_token || !session?.refresh_token) return base
  return `${base}/#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer`
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const flow = requestUrl.searchParams.get('flow') // 'signup' or 'signin'

  if (process.env.NODE_ENV === 'development') {
    console.log('Auth callback:', { hasCode: !!code, hasError: !!error, flow })
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const tempResponse = NextResponse.next()
    const supabase = createRouteHandlerClient(request, tempResponse)

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/sign-in?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Check if this is a new user (sign-up) or existing user (sign-in)
    const createdAt = new Date(data.user?.created_at || '').getTime()
    const lastSignInAt = new Date(data.user?.last_sign_in_at || '').getTime()
    const timeDiff = Math.abs(createdAt - lastSignInAt)
    const isNewUser = timeDiff < 2000

    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Debug:', { isNewUser, flow, timeDiff })
    }

    let redirectUrl = `${requestUrl.origin}/dashboard`
    const userId = data.user?.id
    const userEmail = data.user?.email
    const adminClient = createAdminClient()

    // Always check if users record exists (don't rely on isNewUser timing)
    let userProfile: { user_type: string; has_consented: boolean } | null = null
    if (userId) {
      const { data: profile } = await adminClient
        .from('users')
        .select('user_type, has_consented')
        .eq('id', userId)
        .single()
      userProfile = profile
    }

    const hasUsersRecord = !!userProfile
    const needsSetup = !hasUsersRecord || !userProfile?.user_type || userProfile.user_type === 'unknown'

    if (flow === 'signin' && !hasUsersRecord && isNewUser) {
      // User came from sign-in but doesn't have an account — delete and redirect
      if (userId) {
        try { await adminClient.auth.admin.deleteUser(userId) } catch {}
      }
      const userName = data.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
      const message = `Hi ${userName}! We don't have an account for you yet. Would you like to create one?`
      redirectUrl = `${requestUrl.origin}/sign-up?info=${encodeURIComponent(message)}`
    } else if (needsSetup && userId && userEmail) {
      // No users record or incomplete setup — run setup (works for new AND stuck users)
      const result = await setupNewUser(adminClient, userId, userEmail, {
        full_name: data.user?.user_metadata?.full_name,
        avatar_url: data.user?.user_metadata?.avatar_url,
      })

      if (!result.ok) {
        try { await adminClient.auth.admin.deleteUser(userId) } catch {}
        redirectUrl = `${requestUrl.origin}/early-access?info=${encodeURIComponent(result.message)}`
      } else {
        switch (result.action) {
          case 'mobile_app':
            redirectUrl = mobileAppUrl(data.session)
            break
          case 'dashboard':
            redirectUrl = `${requestUrl.origin}/dashboard`
            break
          case 'onboarding':
            redirectUrl = `${requestUrl.origin}/onboarding`
            break
          case 'already_setup':
            if (userProfile?.has_consented) {
              redirectUrl = userProfile.user_type === 'member'
                ? mobileAppUrl(data.session)
                : `${requestUrl.origin}/dashboard`
            } else {
              redirectUrl = `${requestUrl.origin}/onboarding`
            }
            break
        }
      }
    } else if (hasUsersRecord) {
      // Existing user with record — route based on type
      if (userProfile!.user_type === 'member') {
        redirectUrl = mobileAppUrl(data.session)
      } else if (!userProfile!.has_consented) {
        redirectUrl = `${requestUrl.origin}/onboarding`
      }
    }

    // Create final redirect response and copy cookies
    const response = NextResponse.redirect(redirectUrl)
    tempResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })

    return response
  }

  // No code or error, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
