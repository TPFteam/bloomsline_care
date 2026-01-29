import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { earlyAccessInvitationTemplate } from '@/lib/email/templates'

// Optional: Verify webhook secret to ensure request is from Supabase
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET // Can be skipped if not set

interface WebhookPayload {
  type: 'UPDATE'
  table: 'early_access_waitlist'
  schema: 'public'
  record: {
    id: string
    name: string
    email: string
    user_type: 'member' | 'practitioner' | 'both'
    status: string
    created_at: string
  }
  old_record: {
    id: string
    status: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization')
    if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.error('Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: WebhookPayload = await request.json()

    // Only process if status changed TO 'invited' (send invitation email)
    if (
      payload.type !== 'UPDATE' ||
      payload.record.status !== 'invited' ||
      payload.old_record.status === 'invited'
    ) {
      return NextResponse.json({ message: 'No action needed' })
    }

    const { name, email, user_type } = payload.record
    const firstName = name.split(' ')[0] // Get first name for personalization

    // Generate the signup URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bloomsline.com'
    const signupUrl = `${baseUrl}/login`

    // Generate email content
    const htmlBody = earlyAccessInvitationTemplate({
      name: firstName,
      userType: user_type || 'member',
      signupUrl,
    })

    // Send the invitation email
    const result = await sendEmail({
      to: email,
      subject: `${firstName}, you're invited to Bloomsline! 🌸`,
      htmlBody,
      tag: 'early-access-invited',
      metadata: {
        waitlist_id: payload.record.id,
        user_type: user_type || 'member',
      },
    })

    if (result.success) {
      console.log(`Early access invitation email sent to ${email}`)
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      console.error(`Failed to send invitation email to ${email}:`, result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
