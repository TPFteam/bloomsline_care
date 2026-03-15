import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server-client'
import { ADMIN_USER_IDS } from '@/lib/admin'

/**
 * GET /api/admin/invites
 * List all admin-invited practitioners from the waitlist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !ADMIN_USER_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('early_access_waitlist')
      .select('id, name, email, created_at, reason, status')
      .eq('user_type', 'practitioner')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    return NextResponse.json({ invites: data || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/invites
 * Invite a practitioner — creates an early_access_waitlist entry + sends email
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !ADMIN_USER_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name, message, preferredLanguage = 'fr' } = await request.json()
    const lang = preferredLanguage === 'en' ? 'en' : 'fr'

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Insert into early_access_waitlist as 'pending'
    // Admin will manually change status to 'invited' when ready, which triggers the Edge Function email
    const { error: insertError } = await supabaseAdmin
      .from('early_access_waitlist')
      .insert({
        name,
        email: email.toLowerCase(),
        reason: message || null,
        user_type: 'practitioner',
        preferred_language: lang,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'This email is already on the waitlist' }, { status: 409 })
      }
      console.error('Error inserting invite:', insertError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/admin/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/invites
 * Update status of a waitlist entry
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !ADMIN_USER_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await request.json()
    const validStatuses = ['pending', 'invited', 'activated', 'rejected', 'waitlisted']

    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
      .from('early_access_waitlist')
      .update({
        status,
        ...(status === 'invited' ? { invited_at: new Date().toISOString() } : {}),
        ...(status === 'activated' ? { activated_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating status:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/admin/invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
