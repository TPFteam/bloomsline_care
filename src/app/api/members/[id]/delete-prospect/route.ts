import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify member belongs to this practitioner
    const { data: member } = await supabase
      .from('members')
      .select('id, email, status, practitioner_id')
      .eq('id', id)
      .single()

    if (!member || member.practitioner_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Soft delete — mark as deleted, keep data for analytics
    const { error } = await supabase
      .from('members')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_reason: member.status === 'prospect' ? 'prospect_not_converted' : 'practitioner_removed',
        status: 'inactive',
      })
      .eq('id', id)

    if (error) {
      console.error('Soft delete member error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
