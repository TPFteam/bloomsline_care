import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server-client'
import { isValidLanguage, type Language } from '@/types/user'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

// API endpoint to update user's preferred language
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }

  try {
    const response = NextResponse.next()
    const supabase = createRouteHandlerClient(request, response)

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { language } = await request.json()

    // Validate language
    if (!language || !isValidLanguage(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be "en" or "fr"' },
        { status: 400 }
      )
    }

    // Update user's preferred language in database
    const { data, error } = await supabase
      .from('users')
      .update({ preferred_language: language as Language })
      .eq('id', authUser.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating language preference:', error)
      return NextResponse.json(
        { error: 'Failed to update language preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferred_language: data.preferred_language
    })
  } catch (error) {
    console.error('Error in update-language API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
