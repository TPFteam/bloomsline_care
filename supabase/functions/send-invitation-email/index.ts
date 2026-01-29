import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  }
  old_record: {
    id: string
    status: string
  }
}

function generateEmailHtml(name: string, userType: string, signupUrl: string) {
  const firstName = name.split(' ')[0]
  const accentColor = '#4A9A86'

  const roleDescription = userType === 'member'
    ? 'a space to nurture your wellbeing'
    : userType === 'practitioner'
    ? 'tools to better support the people you care for'
    : 'both personal wellbeing tools and practitioner features'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 600; color: ${accentColor};">Bloomsline</span>
        </div>

        <!-- Content -->
        <div style="color: #333; line-height: 1.6;">
          <h2 style="margin: 0 0 24px 0; font-size: 20px; color: #333; text-align: center;">
            Your early access is ready
          </h2>

          <p style="margin: 0 0 16px 0; color: #333; font-weight: 500;">
            Hi ${firstName},
          </p>

          <p style="margin: 0 0 24px 0; color: #555;">
            Your spot on Bloomsline is confirmed. You signed up for ${roleDescription}, and your account is ready to set up.
          </p>

          <!-- Next steps -->
          <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">
              To get started:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin-bottom: 8px;">Click the button below to create your account</li>
              <li style="margin-bottom: 0;">Start exploring Bloomsline</li>
            </ul>
          </div>

          <!-- CTA -->
          <p style="margin: 0 0 16px 0; color: #555; text-align: center;">
            Click below to create your account.
          </p>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${signupUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Create Your Account
            </a>
          </div>

          <p style="margin: 0; color: #888; font-size: 14px; text-align: center;">
            If you have any questions, reach out to us at hi@bloomsline.com.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 0;">Bloomsline Care</p>
          <p style="margin: 8px 0 0 0;">Supporting your journey to wellness</p>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function generateTextBody(name: string, userType: string, signupUrl: string) {
  const firstName = name.split(' ')[0]
  const roleDescription = userType === 'member'
    ? 'a space to nurture your wellbeing'
    : userType === 'practitioner'
    ? 'tools to better support the people you care for'
    : 'both personal wellbeing tools and practitioner features'

  return `Hi ${firstName},

Your early access to Bloomsline is ready. You signed up for ${roleDescription}, and your account is ready to set up.

To get started:
- Click the link below to create your account
- Start exploring Bloomsline

Create your account: ${signupUrl}

If you have any questions, reach out to us at hi@bloomsline.com.

Bloomsline Care
Supporting your journey to wellness`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const POSTMARK_API_TOKEN = Deno.env.get('POSTMARK_API_TOKEN')
    const FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL') || 'hi@bloomsline.com'
    const FROM_NAME = Deno.env.get('POSTMARK_FROM_NAME') || 'Bloomsline'
    const APP_URL = Deno.env.get('SITE_URL') || 'https://www.bloomsline.com'

    if (!POSTMARK_API_TOKEN) {
      console.error('POSTMARK_API_TOKEN not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: WebhookPayload = await req.json()

    console.log('Received webhook:', JSON.stringify(payload, null, 2))

    // Only process if status changed TO 'invited'
    if (
      payload.type !== 'UPDATE' ||
      payload.record.status !== 'invited' ||
      payload.old_record.status === 'invited'
    ) {
      console.log('No action needed - status not changed to invited')
      return new Response(
        JSON.stringify({ message: 'No action needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, user_type } = payload.record
    const firstName = name.split(' ')[0]
    const signupUrl = `${APP_URL}/sign-up`

    console.log(`Sending invitation email to ${email}`)

    const client = new ServerClient(POSTMARK_API_TOKEN)

    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: email,
      Subject: `${firstName}, your Bloomsline account is ready`,
      HtmlBody: generateEmailHtml(name, user_type || 'member', signupUrl),
      TextBody: generateTextBody(name, user_type || 'member', signupUrl),
      Tag: 'early-access-invited',
      MessageStream: 'outbound',
    })

    console.log(`Email sent successfully to ${email}, MessageID: ${response.MessageID}`)

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
