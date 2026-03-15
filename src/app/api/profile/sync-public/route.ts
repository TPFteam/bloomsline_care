import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/profile/sync-public
 * Syncs practitioner profile fields to public_practitioners (if linked)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fields = await request.json()
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Only update if this user has a linked public_practitioners record
    const { data: linked } = await adminClient
      .from('public_practitioners')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!linked) {
      return NextResponse.json({ synced: false, reason: 'no_linked_profile' })
    }

    const { error } = await adminClient
      .from('public_practitioners')
      .update(fields)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error syncing to public_practitioners:', error)
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
    }

    return NextResponse.json({ synced: true })
  } catch (error) {
    console.error('Error in sync-public:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
