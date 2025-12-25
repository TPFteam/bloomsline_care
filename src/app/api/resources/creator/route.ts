import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

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

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Get the resource to find practitioner_id
    const { data: resource, error: resourceError } = await adminClient
      .from('resources')
      .select('practitioner_id, visibility, status')
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ creatorProfile: null })
    }

    // Only return creator profile for public or link_only published resources
    if (!(['public', 'link_only'].includes(resource.visibility) && resource.status === 'published')) {
      return NextResponse.json({ creatorProfile: null })
    }

    // Get practitioner profile
    const { data: profileData } = await adminClient
      .from('practitioner_profiles')
      .select('id, slug, headline, credentials, specialties, years_experience, is_verified')
      .eq('user_id', resource.practitioner_id)
      .single()

    // Get user data for full_name and avatar
    const { data: userData } = await adminClient
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', resource.practitioner_id)
      .single()

    let creatorProfile = null

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

    return NextResponse.json({ creatorProfile })

  } catch (error) {
    console.error('Error fetching creator profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
