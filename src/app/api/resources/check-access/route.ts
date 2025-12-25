import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('id')

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS and check if resource exists
    const adminClient = createAdminClient()
    const { data: resource, error } = await adminClient
      .from('resources')
      .select('id, visibility, status, practitioner_id')
      .eq('id', resourceId)
      .single()

    if (error || !resource) {
      // Resource truly doesn't exist
      return NextResponse.json({
        exists: false,
        hasAccess: false,
        reason: 'not_found'
      })
    }

    // Check if current user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine access
    const isOwner = user?.id === resource.practitioner_id
    const isPublicOrLinkOnly = ['public', 'link_only'].includes(resource.visibility) && resource.status === 'published'

    if (isOwner || isPublicOrLinkOnly) {
      return NextResponse.json({
        exists: true,
        hasAccess: true,
        reason: 'allowed'
      })
    }

    // Resource exists but user doesn't have access - fetch creator profile
    let creatorProfile = null

    // Try practitioner_profiles table first
    const { data: profileData } = await adminClient
      .from('practitioner_profiles')
      .select('id, slug, headline, credentials, specialties, years_experience, is_verified')
      .eq('user_id', resource.practitioner_id)
      .single()

    // Also get user data for full_name and avatar
    const { data: userData } = await adminClient
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', resource.practitioner_id)
      .single()

    if (profileData) {
      creatorProfile = {
        id: profileData.id,
        slug: profileData.slug,
        full_name: userData?.full_name || userData?.email?.split('@')[0] || 'Practitioner',
        avatar_url: userData?.avatar_url || null,
        headline: profileData.headline,
        credentials: profileData.credentials || [],
        specialties: (profileData.specialties || []).slice(0, 5),
        years_experience: profileData.years_experience,
        is_verified: profileData.is_verified || false,
      }
    } else if (userData) {
      creatorProfile = {
        id: userData.id,
        slug: null,
        full_name: userData.full_name || userData.email?.split('@')[0] || 'Practitioner',
        avatar_url: userData.avatar_url || null,
        headline: null,
        credentials: [],
        specialties: [],
        years_experience: null,
        is_verified: false,
      }
    }

    return NextResponse.json({
      exists: true,
      hasAccess: false,
      reason: 'private',
      visibility: resource.visibility,
      creatorProfile
    })

  } catch (error) {
    console.error('Error checking resource access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
