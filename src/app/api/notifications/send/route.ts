import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server-client'
import { getNotificationContent } from '@/lib/notifications/templates'
import { generateEmailHtml, getEmailContent } from '@/lib/notifications/email'
import { sendEmail } from '@/lib/email'
import type { NotificationType, UserType, EntityType } from '@/lib/notifications/types'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface SendNotificationBody {
  userId: string
  userType: UserType
  type: NotificationType
  metadata: Record<string, unknown>
  entityType?: EntityType
  entityId?: string
  locale?: 'en' | 'fr'
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

    // Verify the user is authenticated
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
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
    } = body

    // Validate required fields
    if (!userId || !userType || !type || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // SECURITY: Validate the caller has permission to send notifications
    // Users can only send notifications triggered by their own actions
    // (e.g., practitioner sharing a resource creates notification for member)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

    // Fire-and-forget: send email via Postmark
    ;(async () => {
      try {
        const { data: { user: recipientUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
        const recipientEmail = recipientUser?.email
        if (!recipientEmail) {
          console.warn('No email found for user', userId)
          return
        }

        const emailContent = getEmailContent(type, metadata, recipientLocale)
        const htmlBody = generateEmailHtml({
          subject: content.emailSubject,
          body: content.body,
          actionUrl: content.actionUrl,
          actionText: emailContent.actionText,
        })

        await sendEmail({
          to: recipientEmail,
          subject: content.emailSubject,
          htmlBody,
          tag: type,
        })
      } catch (emailError) {
        console.error('Error sending notification email:', emailError)
      }
    })()

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error in send notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
