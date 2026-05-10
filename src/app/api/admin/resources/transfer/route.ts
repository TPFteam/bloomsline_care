import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { ADMIN_USER_IDS } from '@/lib/admin'
import { sendEmail } from '@/lib/email'
import { resourcesTransferredTemplate } from '@/lib/email/templates'

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

// POST: Transfer resource ownership to another practitioner
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resource_ids, new_practitioner_id } = await request.json()

    if (!resource_ids || !Array.isArray(resource_ids) || resource_ids.length === 0) {
      return NextResponse.json({ error: 'resource_ids is required (array)' }, { status: 400 })
    }
    if (!new_practitioner_id) {
      return NextResponse.json({ error: 'new_practitioner_id is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify target practitioner exists. We look up email separately so
    // a missing/optional `locale` column on `users` never blocks the
    // transfer itself — the email-out is best-effort, the DB ownership
    // change is the contract.
    const { data: targetUser, error: userError } = await adminClient
      .from('users')
      .select('id, full_name, email')
      .eq('id', new_practitioner_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Target practitioner not found' }, { status: 404 })
    }

    // Try to pull locale opportunistically. If the column doesn't exist
    // (or the row has none) we just default to 'en' for the email below.
    let recipientLocale: 'en' | 'fr' | 'es' = 'en'
    try {
      const { data: localeRow } = await adminClient
        .from('users')
        .select('locale')
        .eq('id', new_practitioner_id)
        .maybeSingle()
      const raw = (localeRow as any)?.locale as string | undefined
      if (raw === 'fr' || raw === 'es') recipientLocale = raw
    } catch {
      // Column likely doesn't exist on this deployment — silently fall
      // back to English. Not worth surfacing to the admin user.
    }

    // Update practitioner_id on all selected resources
    const { data: updated, error: updateError } = await adminClient
      .from('resources')
      .update({ practitioner_id: new_practitioner_id })
      .in('id', resource_ids)
      .select('id')

    if (updateError) {
      console.error('Error transferring resources:', updateError)
      return NextResponse.json({ error: 'Failed to transfer resources' }, { status: 500 })
    }

    // Also update assignments for these resources
    await adminClient
      .from('resource_assignments')
      .update({ practitioner_id: new_practitioner_id })
      .in('resource_id', resource_ids)

    const transferredCount = updated?.length || 0

    // Notify the recipient. Best-effort — a failure here doesn't undo
    // the transfer; the practitioner can still see the resources in
    // their library, they just won't have the heads-up email.
    if (transferredCount > 0 && targetUser.email) {
      try {
        const locale = recipientLocale
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bloomsline.com'
        const subject = locale === 'fr'
          ? (transferredCount === 1
              ? '1 ressource ajoutée à votre compte Bloomsline'
              : `${transferredCount} ressources ajoutées à votre compte Bloomsline`)
          : locale === 'es'
            ? (transferredCount === 1
                ? '1 recurso añadido a tu cuenta Bloomsline'
                : `${transferredCount} recursos añadidos a tu cuenta Bloomsline`)
            : (transferredCount === 1
                ? '1 resource added to your Bloomsline account'
                : `${transferredCount} resources added to your Bloomsline account`)

        await sendEmail({
          to: targetUser.email,
          subject,
          htmlBody: resourcesTransferredTemplate({
            practitionerName: targetUser.full_name || '',
            count: transferredCount,
            locale,
            viewUrl: `${appUrl}/resources`,
          }),
          tag: 'resources-transferred',
        })
      } catch (emailErr) {
        console.warn('Resources transferred — recipient email send failed:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      transferred: transferredCount,
      message: `${transferredCount} resource(s) transferred to ${targetUser.full_name}`,
    })
  } catch (error) {
    console.error('Error transferring resources:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
