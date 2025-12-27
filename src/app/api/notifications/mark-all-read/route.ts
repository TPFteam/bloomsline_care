import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotificationService } from '@/lib/notifications/service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
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

    // Use service role for updating
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const notificationService = createNotificationService(supabase)

    await notificationService.markAllAsRead(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}
