import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { setupNewUser } from '@/lib/auth/setup-new-user'

/**
 * POST /api/auth/setup-member
 *
 * Called after a new user signs up (web or mobile) to check eligibility
 * and create user/member records.
 *
 * Requires: Authorization: Bearer <access_token>
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ ok: false, reason: 'missing_token' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const adminClient = createAdminClient()

  // Verify the token and get the user
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ ok: false, reason: 'invalid_token' }, { status: 401 })
  }

  if (!user.email) {
    return NextResponse.json({ ok: false, reason: 'no_email' }, { status: 400 })
  }

  const result = await setupNewUser(adminClient, user.id, user.email, {
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
  })

  return NextResponse.json(result)
}
