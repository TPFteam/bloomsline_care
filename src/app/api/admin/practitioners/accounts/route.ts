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

// GET: List all practitioner user accounts (user_type = 'mentor')
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Fetch all practitioner users
    const { data: practitioners, error } = await adminClient
      .from('users')
      .select('id, full_name, email, avatar_url, created_at')
      .eq('user_type', 'mentor')
      .order('full_name', { ascending: true })

    if (error) throw error

    // Fetch which user_ids are already linked to public profiles
    const { data: linkedProfiles } = await adminClient
      .from('public_practitioners')
      .select('user_id')
      .not('user_id', 'is', null)

    const linkedUserIds = new Set((linkedProfiles || []).map(p => p.user_id))

    // Mark each practitioner as linked or available
    const result = (practitioners || []).map(p => ({
      ...p,
      is_linked: linkedUserIds.has(p.id),
    }))

    return NextResponse.json({ practitioners: result })
  } catch (error) {
    console.error('Error fetching practitioner accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
