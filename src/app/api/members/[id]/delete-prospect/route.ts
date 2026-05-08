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

    // Wipe resource-flow data tied to this member BEFORE soft-deleting
    // the row. Product decision (May 2026): when a member is deleted,
    // their worksheet responses + assignments + share rows are removed
    // entirely so old patient data doesn't linger in the practitioner's
    // UI. Sessions, notes, files, etc. follow their own lifecycles.
    //
    // We capture response IDs first so we can clean up any notifications
    // that pointed at them (the notifications table has no FK link to
    // resource_responses, so cascade can't reach it).
    const { data: responseRows } = await supabase
      .from('resource_responses')
      .select('id')
      .eq('member_id', id)
    const responseIds = (responseRows || []).map(r => r.id as string)

    try {
      // resource_responses
      await supabase
        .from('resource_responses')
        .delete()
        .eq('member_id', id)

      // member_shared_resources (the share/assignment from practitioner → member)
      await supabase
        .from('member_shared_resources')
        .delete()
        .eq('member_id', id)

      // resource_assignments (the assigned-to link)
      await supabase
        .from('resource_assignments')
        .delete()
        .eq('member_id', id)

      // Notifications for those responses (best-effort)
      if (responseIds.length > 0) {
        await supabase
          .from('notifications')
          .delete()
          .eq('entity_type', 'resource_response')
          .in('entity_id', responseIds)
      }
    } catch (cleanupErr) {
      // Don't block the member delete on resource cleanup — log and proceed.
      console.warn('Resource data cleanup on member delete failed:', cleanupErr)
    }

    // Soft delete — mark as deleted, keep the member row + status/reason
    // for analytics and audit. Resource data above is the only thing
    // hard-deleted.
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
