import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get practitioner profile
    const { data: profile, error: profileError } = await adminClient
      .from('practitioner_profiles')
      .select('id, user_id, slug, headline, bio, specialties, offers_telehealth, offers_in_person')
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ profile: null, settings: null, user: null })
    }

    // Get booking settings
    const { data: settings } = await adminClient
      .from('booking_settings')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('booking_page_enabled', true)
      .limit(1)
      .single()

    // Get user info (bypasses RLS)
    const { data: user } = await adminClient
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', profile.user_id)
      .single()

    return NextResponse.json({
      profile,
      settings,
      user: user || { full_name: 'Practitioner', avatar_url: null },
    })
  } catch (error) {
    console.error('Error fetching booking info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
