import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body.confirmation !== 'DELETE' && body.confirmation !== 'CLOSE' && body.confirmation !== 'FERMER') {
      return NextResponse.json({ error: 'Invalid confirmation.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Ban user for ~100 years (soft-delete: data preserved, login blocked)
    const { error: banError } = await adminClient.auth.admin.updateUserById(user.id, {
      ban_duration: '876600h',
    })

    if (banError) {
      console.error('Failed to deactivate account:', banError)
      return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deactivation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
