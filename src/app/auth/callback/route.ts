import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const flow = requestUrl.searchParams.get('flow') // 'signup' or 'signin'

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    let redirectUrl = `${requestUrl.origin}/dashboard`

    // Create response object with redirect
    const response = NextResponse.redirect(redirectUrl)
    const supabase = createRouteHandlerClient(request, response)

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

    // Debug logging
    console.log('Auth Debug:', {
      email: data.user?.email,
      created_at: data.user?.created_at,
      last_sign_in_at: data.user?.last_sign_in_at,
      timeDiff,
      isNewUser,
      flow
    })

    // Determine the redirect URL based on the flow
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
          // Delete the user using admin client
          const adminClient = createAdminClient()
          console.log('Attempting to delete user:', userId)
          const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

          if (deleteError) {
            console.error('Error deleting user:', deleteError)
          } else {
            console.log('User deleted successfully:', userId)
          }
        } catch (error) {
          console.error('Exception deleting user:', error)
        }
      }

      const userName = data.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
      const message = `Hi ${userName}! We don't have an account for you yet. Would you like to create one?`
      redirectUrl = `${requestUrl.origin}/sign-up?info=${encodeURIComponent(message)}`
    } else if (isNewUser) {
      // New user from sign-up page - redirect to onboarding to select user type
      redirectUrl = `${requestUrl.origin}/onboarding`
    } else {
      // Existing user - redirect to dashboard
      redirectUrl = `${requestUrl.origin}/dashboard`
    }

    // Return response with cookies and correct redirect
    return NextResponse.redirect(redirectUrl, response)
  }

  // No code or error, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
