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

// DELETE: Clear all shares, assignments, and responses for a resource
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('resourceId')
    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Delete in order: responses → assignments → shares, then reset counters
    await adminClient.from('resource_responses').delete().eq('resource_id', resourceId)
    await adminClient.from('resource_assignments').delete().eq('resource_id', resourceId)
    await adminClient.from('member_shared_resources').delete().eq('resource_id', resourceId)

    // Reset counters
    await adminClient
      .from('resources')
      .update({ times_assigned: 0, times_completed: 0 })
      .eq('id', resourceId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing resource data:', error)
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
