import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: user } = await adminClient
      .from('users')
      .select('id, full_name, avatar_url, email')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        full_name: user.full_name || user.email?.split('@')[0] || 'Practitioner',
        avatar_url: user.avatar_url,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
