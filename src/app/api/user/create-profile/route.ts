import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase/server-client'
import { UserType, isValidUserType } from '@/types/user'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { createDemoMembers } from '@/lib/demo/create-demo-members'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.auth)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }

  try {
    const response = NextResponse.next()
    const supabase = createRouteHandlerClient(request, response)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { user_type, has_consented } = body

    // Validate user_type
    if (!user_type || !isValidUserType(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be "mentor" or "member"' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        user_type: user_type as UserType,
        has_consented: !!has_consented,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // If practitioner (mentor), create demo members with full data to showcase all features
    if (user_type === 'mentor') {
      try {
        const serviceClient = createAdminClient()
        await createDemoMembers(serviceClient, user.id)
      } catch (demoErr) {
        console.error('Failed to create demo members:', demoErr)
        // Don't fail the main request
      }
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
