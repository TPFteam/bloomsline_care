import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server-client'
import { getNotificationContent } from '@/lib/notifications/templates'
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
      // Get caller's practitioner profile
      const { data: practitionerProfile } = await supabaseAdmin
        .from('practitioner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!practitionerProfile) {
        // Caller is not a practitioner, cannot send to others
        return NextResponse.json({ error: 'Unauthorized: Cannot send notifications to other users' }, { status: 403 })
      }

      // Verify target user is a member linked to this practitioner
      const { data: memberLink } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('user_id', userId)
        .eq('practitioner_id', practitionerProfile.id)
        .single()

      if (!memberLink) {
        return NextResponse.json({ error: 'Unauthorized: No relationship with target user' }, { status: 403 })
      }
    }

    // Get notification content from template
    const content = getNotificationContent(type, metadata, locale)

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

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error in send notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
