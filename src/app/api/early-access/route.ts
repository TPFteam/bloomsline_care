import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, reason, userType } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!userType || !['member', 'practitioner', 'both'].includes(userType)) {
      return NextResponse.json(
        { error: 'Please select how you want to use Bloomsline' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Insert into early_access_waitlist table
    const { error } = await supabase
      .from('early_access_waitlist')
      .insert({
        name,
        email,
        reason: reason || null,
        user_type: userType,
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing early access request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
