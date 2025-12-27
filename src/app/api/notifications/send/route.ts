import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server-client'
import { getNotificationContent } from '@/lib/notifications/templates'
import type { NotificationType, UserType, EntityType } from '@/lib/notifications/types'

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

    // Get notification content from template
    const content = getNotificationContent(type, metadata, locale)

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create the notification
    const { data: notification, error } = await supabase
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
