import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { sendEmail } from '@/lib/email'
import { invitePractitionerTemplate } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    // Support both cookie auth (web) and Bearer token auth (mobile)
    const authHeader = request.headers.get('authorization')
    let userId: string

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const adminClient = createAdminClient()
      const { data: { user }, error } = await adminClient.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get member's name
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single()

    const memberName = profile?.full_name || 'A Bloomsline member'
    const signupUrl = 'https://bloomsline.care/practitioner'

    const htmlBody = invitePractitionerTemplate({ memberName, signupUrl })

    const result = await sendEmail({
      to: email,
      subject: `${memberName} invites you to try Bloomsline Care`,
      htmlBody,
      tag: 'invite-practitioner',
      metadata: { invitedBy: userId },
    })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invite practitioner error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
