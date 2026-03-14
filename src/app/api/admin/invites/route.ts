import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server-client'
import { ADMIN_USER_IDS } from '@/lib/admin'
import { sendEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Insert into early_access_waitlist
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

    // Send invitation email
    try {
      const isFr = lang === 'fr'
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4A9A86, #5AB39C); border-radius: 50%; margin: 0 auto 12px;"></div>
            <h1 style="font-size: 20px; font-weight: 600; color: #111; margin: 0;">Bloomsline Care</h1>
          </div>
          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            ${isFr ? `Bonjour ${name},` : `Hi ${name},`}
          </p>
          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            ${isFr
              ? 'Vous avez été invité(e) à rejoindre <strong>Bloomsline Care</strong> — une plateforme conçue pour les praticiens en santé mentale.'
              : 'You\'ve been invited to join <strong>Bloomsline Care</strong> — a platform built for mental health practitioners.'}
          </p>
          ${message ? `
          <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 3px solid #4A9A86;">
            <p style="font-size: 13px; color: #666; margin: 0 0 4px; font-weight: 600;">${isFr ? 'Message personnel :' : 'Personal message:'}</p>
            <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">${message}</p>
          </div>
          ` : ''}
          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            ${isFr
              ? 'Bloomsline Care vous aide à gérer vos séances, notes, et ressources thérapeutiques — tout en gardant vos clients engagés entre les rendez-vous.'
              : 'Bloomsline Care helps you manage sessions, notes, and therapeutic resources — while keeping your clients engaged between appointments.'}
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://app.bloomsline.care/early-access" style="display: inline-block; background: #4A9A86; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
              ${isFr ? 'Découvrir Bloomsline Care' : 'Discover Bloomsline Care'}
            </a>
          </div>
          <p style="font-size: 13px; color: #999; line-height: 1.5; text-align: center;">
            Bloomsline Care — Where care continues between sessions.
          </p>
        </div>
      `

      await sendEmail({
        to: email.toLowerCase(),
        subject: isFr ? 'Vous êtes invité(e) à rejoindre Bloomsline Care' : 'You\'re invited to join Bloomsline Care',
        htmlBody,
        tag: 'admin_invite',
      })
    } catch (emailError) {
      console.error('Error sending invite email:', emailError)
      // Don't fail the request — the waitlist entry was created
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
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
