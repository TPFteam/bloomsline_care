import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server-client'
import { createNotificationService } from '@/lib/notifications/service'
import { sanitizeLimit, sanitizeOffset } from '@/lib/security/validation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // Get user from token
    const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const limit = sanitizeLimit(searchParams.get('limit'), 50, 100)
    const offset = sanitizeOffset(searchParams.get('offset'), 0)
    const unreadOnly = searchParams.get('unread') === 'true'

    // Use service role for fetching
    const supabase = createAdminClient()
    const notificationService = createNotificationService(supabase)

    const [notifications, unreadCount] = await Promise.all([
      notificationService.getNotifications(user.id, { limit, offset, unreadOnly }),
      notificationService.getUnreadCount(user.id),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
