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
      .select('id, user_id, slug, headline, bio, specialties, offers_telehealth, offers_in_person, city, country, address, google_maps_url')
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
      .select('full_name, avatar_url, preferred_language')
      .eq('id', profile.user_id)
      .single()

    // Get available days of week
    const { data: availDays } = await adminClient
      .from('availability_schedules')
      .select('day_of_week, session_format')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)

    const dayNameToNumber: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    }
    const activeDays = availDays ? [...new Set(availDays.map(d => dayNameToNumber[d.day_of_week]))] : []

    // Build format map per day: { 0: ['video'], 1: ['in_person', 'video'], ... }
    const dayFormats: Record<number, string[]> = {}
    const formats = new Set<string>()
    if (availDays) {
      for (const d of availDays) {
        const dayNum = dayNameToNumber[d.day_of_week]
        const fmt = (d as any).session_format || 'both'
        if (!dayFormats[dayNum]) dayFormats[dayNum] = []
        if (fmt === 'both') {
          if (!dayFormats[dayNum].includes('in_person')) dayFormats[dayNum].push('in_person')
          if (!dayFormats[dayNum].includes('video')) dayFormats[dayNum].push('video')
          formats.add('in_person')
          formats.add('video')
        } else {
          if (!dayFormats[dayNum].includes(fmt)) dayFormats[dayNum].push(fmt)
          formats.add(fmt)
        }
      }
    }
    const availableFormats = [...formats]

    return NextResponse.json({
      profile,
      settings,
      user: user || { full_name: 'Practitioner', avatar_url: null },
      activeDays,
      availableFormats,
      dayFormats,
    })
  } catch (error) {
    console.error('Error fetching booking info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
