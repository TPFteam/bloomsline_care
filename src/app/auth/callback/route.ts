import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const flow = requestUrl.searchParams.get('flow') // 'signup' or 'signin'

  // Debug logging (production-safe - no PII)
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
    // First, exchange code for session to determine redirect URL
    // We'll create a temporary response to capture cookies
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

    // If timestamps are within 2 seconds of each other, consider it a new user
    const isNewUser = timeDiff < 2000

    // Debug logging (no PII in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Debug:', { isNewUser, flow, timeDiff })
    }

    // Determine the redirect URL based on the flow and user type
    let redirectUrl = `${requestUrl.origin}/dashboard`

    // Check user type to determine redirect for existing users
    if (!isNewUser && data.user?.id) {
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', data.user.id)
          .single()

        if (userProfile?.user_type === 'member') {
          redirectUrl = `${requestUrl.origin}/home`
        }
      } catch (e) {
        console.error('Error checking user type:', e)
      }
    }

    if (flow === 'signup' && !isNewUser) {
      // If user came from sign-up page but already has an account
      const userName = data.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
      const message = `Hey ${userName}! Looks like you already have an account with us. Welcome back! 👋`
      redirectUrl = `${requestUrl.origin}/sign-in?info=${encodeURIComponent(message)}`
    } else if (flow === 'signin' && isNewUser) {
      // If user came from sign-in page but doesn't have an account yet
      // Delete the account that was just created
      const userId = data.user?.id

      if (userId) {
        try {
          // Delete the user using admin client (no account exists scenario)
          const adminClient = createAdminClient()
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

          if (deleteError) {
            console.error('Error cleaning up auth state')
          }
        } catch {
          // Silently handle deletion errors
        }
      }

      const userName = data.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
      const message = `Hi ${userName}! We don't have an account for you yet. Would you like to create one?`
      redirectUrl = `${requestUrl.origin}/sign-up?info=${encodeURIComponent(message)}`
    } else if (isNewUser) {
      // New user - check if they're on the early access waitlist
      const userEmail = data.user?.email
      const adminClient = createAdminClient()

      if (userEmail) {
        // Check waitlist status using admin client (bypasses RLS)
        const { data: waitlistEntry } = await adminClient
          .from('early_access_waitlist')
          .select('id, status, name')
          .eq('email', userEmail)
          .single()

        // Waitlist check (no PII logged)

        if (!waitlistEntry || waitlistEntry.status === 'pending') {
          // User is NOT on the waitlist or hasn't been invited yet
          // Delete the auto-created account
          const userId = data.user?.id

          if (userId) {
            try {
              await adminClient.auth.admin.deleteUser(userId)
            } catch {
              // Silently handle deletion errors
            }
          }

          // Redirect to early access page with a friendly message
          const userName = data.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
          const message = waitlistEntry
            ? `Hey ${userName}! You're on our waitlist. We'll reach out personally when your spot is ready.`
            : `Hey ${userName}! We're currently in early access. Request an invite to join us.`
          redirectUrl = `${requestUrl.origin}/early-access?info=${encodeURIComponent(message)}`
        } else {
          // User is on the waitlist and has been invited - allow signup
          // Update their status to 'activated'
          await adminClient
            .from('early_access_waitlist')
            .update({
              status: 'activated',
              activated_at: new Date().toISOString()
            })
            .eq('id', waitlistEntry.id)

          // Redirect to onboarding
          redirectUrl = `${requestUrl.origin}/onboarding`
        }
      } else {
        // No email - shouldn't happen with Google OAuth, but handle it
        redirectUrl = `${requestUrl.origin}/early-access`
      }
    }

    // Create final redirect response and copy cookies from temp response
    const response = NextResponse.redirect(redirectUrl)

    // Copy all cookies from the temp response to the final redirect response
    tempResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })

    return response
  }

  // No code or error, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
