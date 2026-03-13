import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { ADMIN_USER_IDS } from '@/lib/admin'

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const adminClient = createAdminClient()
    const { data: { user } } = await adminClient.auth.getUser(token)
    return user?.id || null
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// POST: Link a practitioner user account to a public practitioner profile
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminUserId = await getAuthUserId(request)
    if (!adminUserId || !ADMIN_USER_IDS.includes(adminUserId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_id } = await request.json()
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Fetch the public practitioner profile
    const { data: publicProfile, error: fetchError } = await adminClient
      .from('public_practitioners')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !publicProfile) {
      return NextResponse.json({ error: 'Public practitioner not found' }, { status: 404 })
    }

    if (publicProfile.user_id) {
      return NextResponse.json({ error: 'This profile is already linked to an account' }, { status: 409 })
    }

    // 2. Verify the target user exists and is a practitioner
    const { data: targetUser, error: userError } = await adminClient
      .from('users')
      .select('id, full_name, email, user_type')
      .eq('id', user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check if user already has a practitioner_profiles record
    const { data: existingProfile } = await adminClient
      .from('practitioner_profiles')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle()

    // 4. Copy public profile data into practitioner_profiles (upsert)
    const profileData = {
      user_id,
      headline: publicProfile.headline,
      bio: publicProfile.bio,
      credentials: publicProfile.credentials,
      education: publicProfile.education,
      licenses: publicProfile.licenses,
      certifications: publicProfile.certifications,
      years_experience: publicProfile.years_experience,
      specialties: publicProfile.specialties,
      approaches: publicProfile.approaches,
      age_groups: publicProfile.age_groups,
      session_types: publicProfile.session_types,
      languages: publicProfile.languages,
      practice_location: publicProfile.practice_location,
      offers_telehealth: publicProfile.offers_telehealth,
      offers_in_person: publicProfile.offers_in_person,
      client_acceptance_status: publicProfile.client_acceptance_status,
      show_fees: publicProfile.show_fees,
      session_fee_min: publicProfile.session_fee_min,
      session_fee_max: publicProfile.session_fee_max,
      fee_currency: publicProfile.fee_currency,
      insurance_accepted: publicProfile.insurance_accepted,
      offers_sliding_scale: publicProfile.offers_sliding_scale,
      social_links: publicProfile.social_links,
      contact_email: publicProfile.contact_email,
      contact_phone: publicProfile.contact_phone,
      slug: publicProfile.slug,
      is_public: true,
    }

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await adminClient
        .from('practitioner_profiles')
        .update(profileData)
        .eq('user_id', user_id)

      if (updateError) {
        console.error('Error updating practitioner_profiles:', updateError)
        return NextResponse.json({ error: 'Failed to update practitioner profile' }, { status: 500 })
      }
    } else {
      // Insert new profile
      const { error: insertError } = await adminClient
        .from('practitioner_profiles')
        .insert(profileData)

      if (insertError) {
        console.error('Error creating practitioner_profiles:', insertError)
        return NextResponse.json({ error: 'Failed to create practitioner profile' }, { status: 500 })
      }
    }

    // 5. Update the user's avatar if public profile has one
    if (publicProfile.avatar_url) {
      await adminClient
        .from('users')
        .update({ avatar_url: publicProfile.avatar_url })
        .eq('id', user_id)
    }

    // 6. Mark the public practitioner as linked and unpublish (practitioner_profiles takes over)
    const { data: updated, error: linkError } = await adminClient
      .from('public_practitioners')
      .update({
        user_id,
        linked_at: new Date().toISOString(),
        is_published: false,
      })
      .eq('id', id)
      .select()
      .single()

    if (linkError) {
      console.error('Error linking public practitioner:', linkError)
      return NextResponse.json({ error: 'Failed to link account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      practitioner: updated,
      message: `Profile linked to ${targetUser.full_name}`,
    })
  } catch (error) {
    console.error('Error linking practitioner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Unlink a practitioner user account from a public practitioner profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminUserId = await getAuthUserId(request)
    if (!adminUserId || !ADMIN_USER_IDS.includes(adminUserId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('public_practitioners')
      .update({ user_id: null, linked_at: null })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to unlink account' }, { status: 500 })
    }

    return NextResponse.json({ success: true, practitioner: data })
  } catch (error) {
    console.error('Error unlinking practitioner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
