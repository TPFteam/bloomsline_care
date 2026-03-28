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

// GET: List all resources with owner info
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Fetch all resources
    const { data: resources, error } = await adminClient
      .from('resources')
      .select('id, title, type, category, status, visibility, practitioner_id, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Get unique practitioner IDs
    const practitionerIds = [...new Set((resources || []).map(r => r.practitioner_id).filter(Boolean))]

    // Fetch owner info
    let owners: Record<string, { full_name: string; email: string }> = {}
    if (practitionerIds.length > 0) {
      const { data: users } = await adminClient
        .from('users')
        .select('id, full_name, email')
        .in('id', practitionerIds)

      if (users) {
        owners = Object.fromEntries(users.map(u => [u.id, { full_name: u.full_name, email: u.email }]))
      }
    }

    const result = (resources || []).map(r => ({
      ...r,
      owner_name: owners[r.practitioner_id]?.full_name || 'Unknown',
      owner_email: owners[r.practitioner_id]?.email || '',
    }))

    return NextResponse.json({ resources: result })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update resource visibility
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resourceId, visibility } = await request.json()
    if (!resourceId || !['private', 'link_only', 'public', 'onboarding'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('resources')
      .update({ visibility })
      .eq('id', resourceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating visibility:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
