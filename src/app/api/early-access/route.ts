import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { isValidEmail, sanitizeString } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public signup endpoint
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.public)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const name = sanitizeString(body.name, 100)
    const email = sanitizeString(body.email, 255)?.toLowerCase()
    const reason = sanitizeString(body.reason, 500)
    const userType = body.userType
    const preferredLanguage = body.preferredLanguage === 'fr' ? 'fr' : 'en'

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (!userType || !['member', 'practitioner', 'both'].includes(userType)) {
      return NextResponse.json(
        { error: 'Please select how you want to use Bloomsline' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Insert into early_access_waitlist table
    const { error } = await supabase
      .from('early_access_waitlist')
      .insert({
        name,
        email,
        reason: reason || null,
        user_type: userType,
        preferred_language: preferredLanguage,
      })

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist', code: 'DUPLICATE' },
          { status: 409 }
        )
      }
      console.error('Error inserting early access request:', error)
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      )
    }

    // Email will be sent via Supabase Edge Function trigger
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing early access request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
