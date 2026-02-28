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

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('public_practitioners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ practitioners: data || [] })
  } catch (error) {
    console.error('Error listing practitioners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, slug } = body

    if (!full_name || !slug) {
      return NextResponse.json({ error: 'full_name and slug are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('public_practitioners')
      .insert({ ...body, created_by: userId })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A practitioner with this slug already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ practitioner: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating practitioner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
