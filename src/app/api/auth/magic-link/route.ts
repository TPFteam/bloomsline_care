import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

/**
 * Pre-flight check before sending a magic link from the client.
 * Validates eligibility for signup, or account existence for signin.
 * The actual OTP is sent client-side so PKCE flow works correctly.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, flow } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Check if user already has an account
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === cleanEmail)

    if (flow === 'signin') {
      if (!existingUser) {
        return NextResponse.json({
          error: 'no_account',
          message: "We don't have an account for this email.",
        }, { status: 404 })
      }
    }

    if (flow === 'signup') {
      if (existingUser) {
        return NextResponse.json({
          error: 'account_exists',
          message: 'You already have an account.',
        }, { status: 409 })
      }

      // Check eligibility: waitlist (status = invited) OR practitioner invite
      const { data: waitlistEntry } = await adminClient
        .from('early_access_waitlist')
        .select('id, status, user_type')
        .eq('email', cleanEmail)
        .single()

      const { data: memberEntry } = await adminClient
        .from('members')
        .select('id, practitioner_id')
        .eq('email', cleanEmail)
        .is('user_id', null)
        .single()

      const isEligible =
        (waitlistEntry && waitlistEntry.status === 'invited') || !!memberEntry

      if (!isEligible) {
        const message = waitlistEntry
          ? "You're on our waitlist. We'll reach out when your spot is ready."
          : "We're currently in early access. Request an invite to join us."
        return NextResponse.json({ error: 'not_eligible', message }, { status: 403 })
      }
    }

    // All checks passed — client can proceed to send OTP
    return NextResponse.json({ eligible: true })
  } catch (e: any) {
    console.error('Magic link check error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
