import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase/server-client'
import { setupNewUser } from '@/lib/auth/setup-new-user'

function mobileAppUrl(session: { access_token: string; refresh_token: string } | null): string {
  const base = 'https://app.bloomsline.com'
  if (!session?.access_token || !session?.refresh_token) return base
  return `${base}/#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer`
}

/**
 * GET /auth/confirm
 * Handles email confirmation via token_hash (no PKCE flow state required)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') || 'signup'

  if (!tokenHash) {
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent('Missing confirmation token')}`
    )
  }

  const tempResponse = NextResponse.next()
  const supabase = createRouteHandlerClient(request, tempResponse)

  // Verify the token hash — this confirms the email and creates a session
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'signup' | 'email',
  })

  if (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent(error.message)}`
    )
  }

  // User is now confirmed and logged in
  let redirectUrl = `${requestUrl.origin}/dashboard`

  if (data.user && data.session) {
    try {
      const adminClient = createAdminClient()
      const result = await setupNewUser(
        adminClient,
        data.user.id,
        data.user.email || '',
        {
          full_name: data.user.user_metadata?.full_name,
          avatar_url: data.user.user_metadata?.avatar_url,
        }
      )

      if (!result.ok) {
        // Not eligible — delete user and show message
        if (result.should_delete_user) {
          await adminClient.auth.admin.deleteUser(data.user.id)
        }
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
        }
      }
    } catch (setupError) {
      console.error('Setup error during email confirmation:', setupError)
    }
  }

  // Build redirect response with auth cookies
  const response = NextResponse.redirect(redirectUrl)

  // Copy cookies from the temp response (set by supabase auth)
  tempResponse.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
      maxAge: cookie.maxAge,
    })
  })

  return response
}
