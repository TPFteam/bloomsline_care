import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotificationService } from '@/lib/notifications/service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
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

    // Use service role for fetching
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const notificationService = createNotificationService(supabase)

    const preferences = await notificationService.getPreferences(user.id)

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          timezone: 'UTC',
          preferences: {},
        },
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the current user
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json()

    // Use service role for updating
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const notificationService = createNotificationService(supabase)

    await notificationService.updatePreferences(user.id, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
