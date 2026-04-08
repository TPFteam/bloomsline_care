import { SupabaseClient } from '@supabase/supabase-js'
import { createDemoMembers } from '@/lib/demo/create-demo-members'

export type SetupResult =
  | { ok: true; user_type: string; action: 'mobile_app' | 'dashboard' | 'onboarding' | 'already_setup' }
  | { ok: false; reason: 'not_eligible'; message: string; should_delete_user: true }

/**
 * Checks signup eligibility and sets up user/member records for a new user.
 * Used by both the auth callback (web) and the setup-member API (mobile).
 *
 * @param adminClient - Supabase admin client (service role, bypasses RLS)
 * @param userId - The authenticated user's ID
 * @param userEmail - The user's email
 * @param userMetadata - OAuth metadata (full_name, avatar_url)
 */
export async function setupNewUser(
  adminClient: SupabaseClient,
  userId: string,
  userEmail: string,
  userMetadata: { full_name?: string; avatar_url?: string }
): Promise<SetupResult> {
  // Check if user already has a type set (already set up)
  const { data: existingUser } = await adminClient
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .single()

  if (existingUser?.user_type && existingUser.user_type !== 'unknown') {
    return { ok: true, user_type: existingUser.user_type, action: 'already_setup' }
  }

  // 1. Check waitlist status
  const { data: waitlistEntry } = await adminClient
    .from('early_access_waitlist')
    .select('id, status, name, user_type')
    .eq('email', userEmail)
    .single()

  // 2. Check if they were added as a member by a practitioner (may have multiple)
  const { data: memberEntries } = await adminClient
    .from('members')
    .select('id, practitioner_id, first_name')
    .eq('email', userEmail)
    .is('user_id', null)

  const memberEntry = memberEntries?.[0] || null

  // Determine signup eligibility
  let canSignup = false
  let signupSource: 'waitlist' | 'practitioner_invite' = 'waitlist'
  let invitedByPractitionerId: string | null = null

  if (waitlistEntry && waitlistEntry.status === 'invited') {
    canSignup = true
    signupSource = 'waitlist'
  } else if (memberEntry) {
    canSignup = true
    signupSource = 'practitioner_invite'
    invitedByPractitionerId = memberEntry.practitioner_id
  }

  if (!canSignup) {
    const userName = userMetadata.full_name?.split(' ')[0] || 'there'
    const message = waitlistEntry
      ? `Hey ${userName}! You're on our waitlist. We'll reach out personally when your spot is ready.`
      : `Hey ${userName}! We're currently in early access. Request an invite to join us.`

    return { ok: false, reason: 'not_eligible', message, should_delete_user: true }
  }

  // --- User is authorized ---

  // Ensure user record exists and update signup source
  const upsertData: Record<string, unknown> = {
    id: userId,
    email: userEmail,
    full_name: userMetadata.full_name || null,
    avatar_url: userMetadata.avatar_url || null,
    signup_source: signupSource,
    invited_by_practitioner_id: invitedByPractitionerId,
    has_consented: false,
  }
  if (signupSource === 'practitioner_invite') {
    upsertData.user_type = 'member'
  }

  await adminClient
    .from('users')
    .upsert(upsertData, { onConflict: 'id' })

  let userType: string = 'unknown'
  let action: 'mobile_app' | 'dashboard' | 'onboarding' = 'onboarding'

  if (signupSource === 'waitlist' && waitlistEntry) {
    // Activate waitlist entry
    await adminClient
      .from('early_access_waitlist')
      .update({ status: 'activated', activated_at: new Date().toISOString() })
      .eq('id', waitlistEntry.id)

    const waitlistUserType = waitlistEntry.user_type as 'member' | 'practitioner' | 'both'

    if (waitlistUserType === 'member' || waitlistUserType === 'practitioner') {
      const dbUserType = waitlistUserType === 'practitioner' ? 'mentor' : 'member'

      await adminClient
        .from('users')
        .upsert({
          id: userId,
          email: userEmail,
          user_type: dbUserType,
          full_name: waitlistEntry.name || userMetadata.full_name,
          avatar_url: userMetadata.avatar_url || null,
          has_consented: false,
        }, { onConflict: 'id' })

      userType = dbUserType

      if (waitlistUserType === 'practitioner') {
        try {
          await createDemoMembers(adminClient, userId)
        } catch (err) {
          console.error('Failed to create demo members:', err)
        }
        action = 'onboarding'
      }

      if (waitlistUserType === 'member') {
        const nameParts = (waitlistEntry.name || userMetadata.full_name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        await adminClient
          .from('members')
          .insert({
            user_id: userId,
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            status: 'active',
          })

        action = 'mobile_app'
      }
    } else {
      // 'both' type — needs onboarding
      action = 'onboarding'
    }
  }

  if (signupSource === 'practitioner_invite' && memberEntries && memberEntries.length > 0) {
    // Link ALL existing member records to this user
    const nameParts = (userMetadata.full_name || '').split(' ')

    for (const entry of memberEntries) {
      const updateData: Record<string, any> = {
        user_id: userId,
        status: 'active',
        updated_at: new Date().toISOString(),
      }
      if (!entry.first_name && nameParts[0]) {
        updateData.first_name = nameParts[0]
        updateData.last_name = nameParts.slice(1).join(' ') || ''
      }
      await adminClient
        .from('members')
        .update(updateData)
        .eq('id', entry.id)
    }

    userType = 'member'
    action = 'mobile_app'
  }

  return { ok: true, user_type: userType, action }
}
