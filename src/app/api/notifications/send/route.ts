import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server-client'
import { getNotificationContent } from '@/lib/notifications/templates'
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email'
import { sendEmail } from '@/lib/email'
import type { NotificationType, UserType, EntityType } from '@/lib/notifications/types'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

interface SendNotificationBody {
  userId: string
  userType: UserType
  type: NotificationType
  metadata: Record<string, unknown>
  entityType?: EntityType
  entityId?: string
  locale?: 'en' | 'fr'
  recipientEmail?: string // Fallback email for members without an account
}

/**
 * POST /api/notifications/send
 * Send a notification (uses service role to bypass RLS)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.api)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Verify the user is authenticated (try cookie-based auth first, then Bearer token)
    let user = null
    const supabaseAuth = await createServerClient()
    const { data: { user: cookieUser } } = await supabaseAuth.auth.getUser()
    user = cookieUser

    if (!user) {
      // Fallback: check for Bearer token in Authorization header
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseAdmin = createAdminClient()
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token)
        user = tokenUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SendNotificationBody = await request.json()
    const {
      userId,
      userType,
      type,
      metadata,
      entityType,
      entityId,
      locale = 'en',
      recipientEmail: fallbackEmail,
    } = body

    // Validate required fields
    if (!userId || !userType || !type || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // SECURITY: Validate the caller has permission to send notifications
    // Users can only send notifications triggered by their own actions
    // (e.g., practitioner sharing a resource creates notification for member)
    const supabaseAdmin = createAdminClient()

    // Check if caller is a practitioner with a relationship to the target user
    if (userId !== user.id) {
      // Verify target user is a member linked to this practitioner (using auth user id)
      const { data: memberLink } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('user_id', userId)
        .eq('practitioner_id', user.id)
        .single()

      if (!memberLink) {
        // Also check if user is in the users table as a practitioner
        const { data: callerProfile } = await supabaseAdmin
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single()

        if (!callerProfile || (callerProfile.user_type !== 'mentor' && callerProfile.user_type !== 'practitioner')) {
          return NextResponse.json({ error: 'Unauthorized: Cannot send notifications to other users' }, { status: 403 })
        }

        // Final check - maybe member doesn't have user_id linked yet
        const { data: memberByPractitioner } = await supabaseAdmin
          .from('members')
          .select('id')
          .eq('practitioner_id', user.id)
          .limit(1)
          .single()

        if (!memberByPractitioner) {
          return NextResponse.json({ error: 'Unauthorized: No relationship with target user' }, { status: 403 })
        }
      }
    }

    // Look up recipient's preferred language
    const { data: recipientProfile } = await supabaseAdmin
      .from('users')
      .select('preferred_language')
      .eq('id', userId)
      .single()
    const recipientLocale = (recipientProfile?.preferred_language as 'en' | 'fr' | 'es') || locale

    // Get notification content from template in recipient's language
    const content = getNotificationContent(type, metadata, recipientLocale)

    // Create the notification (reuse admin client)
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        user_type: userType,
        type,
        title: content.title,
        body: content.body,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
        action_url: content.actionUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // Send email (awaited, not fire-and-forget)
    let emailSent = false
    let emailError: string | null = null
    try {
      let recipientEmail = fallbackEmail
      console.log(`[notifications/send] Email lookup: userId=${userId}, fallbackEmail=${fallbackEmail || 'none'}, type=${type}`)
      try {
        const { data: { user: recipientUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
        console.log(`[notifications/send] auth.users result: email=${recipientUser?.email || 'none'}`)
        if (recipientUser?.email) {
          recipientEmail = recipientUser.email
        }
      } catch (lookupErr) {
        console.warn(`[notifications/send] auth.users lookup failed for userId=${userId}:`, lookupErr)
      }

      // If still no email, try members table
      if (!recipientEmail) {
        const { data: memberData } = await supabaseAdmin
          .from('members')
          .select('email')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()
        if (memberData?.email) recipientEmail = memberData.email
      }

      if (!recipientEmail) {
        console.warn(`[notifications/send] No email found for userId=${userId}, fallbackEmail=${fallbackEmail || 'none'} — skipping email`)
        emailError = 'no_email_found'
      } else {
        // Get practitioner info for email template
        let practitionerName: string | undefined
        let practitionerAvatar: string | undefined
        try {
          const { data: practProfile } = await supabaseAdmin
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single()
          practitionerName = practProfile?.full_name || undefined
          practitionerAvatar = practProfile?.avatar_url || undefined
        } catch {}

        // Get recipient name
        let recipientName: string | undefined
        try {
          const { data: memberData } = await supabaseAdmin
            .from('members')
            .select('first_name, last_name')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()
          if (memberData) recipientName = `${memberData.first_name} ${memberData.last_name}`.trim()
        } catch {}

        const emailContent = getEmailContent(type, metadata, recipientLocale)
        const htmlBody = generateEmailHtml({
          subject: content.emailSubject,
          body: content.body,
          actionUrl: content.actionUrl,
          actionText: emailContent.actionText,
          practitionerName,
          practitionerAvatar,
          recipientName,
        })

        const result = await sendEmail({
          to: recipientEmail,
          subject: content.emailSubject,
          htmlBody,
          tag: type,
        })
        emailSent = result.success
        if (!result.success) {
          emailError = result.error || 'send_failed'
          console.error(`[notifications/send] Email send failed to=${recipientEmail}:`, result.error)
        } else {
          console.log(`[notifications/send] Email sent to=${recipientEmail} type=${type}`)
        }
      }
    } catch (err) {
      emailError = String(err)
      console.error('[notifications/send] Error in email sending:', err)
    }

    // Create delivery record for tracking
    if (notification?.id) {
      try {
        await supabaseAdmin.from('notification_deliveries').insert({
          notification_id: notification.id,
          channel: 'email',
          status: emailSent ? 'sent' : (emailError === 'no_email_found' ? 'failed' : 'failed'),
          recipient_address: emailSent ? undefined : null,
          error_message: emailError,
        })
      } catch {
        // Non-critical, don't fail the request
      }
    }

    return NextResponse.json({ notification, emailSent, emailError })
  } catch (error) {
    console.error('Error in send notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
