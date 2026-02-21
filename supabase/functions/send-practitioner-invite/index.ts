import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: 'INSERT'
  table: 'practitioner_invites'
  schema: 'public'
  record: {
    id: string
    member_user_id: string
    member_name: string | null
    practitioner_email: string
    status: string
  }
}

const DEMO_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'
const WEBSITE_URL = 'https://bloomsline.care/practitioner'

function generateEmailHtml(memberName: string) {
  const accentColor = '#D4856A'

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
          <h2 style="margin: 0 0 8px 0; font-size: 22px; color: #333; text-align: center;">
            ${memberName} wants to work with you on Bloomsline
          </h2>

          <p style="margin: 0 0 28px 0; color: #888; font-size: 14px; text-align: center;">
            A client of yours is already using Bloomsline Care and would love you to join.
          </p>

          <!-- The problem -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #333;">
              Sound familiar?
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
              <li>Clients disengage between sessions and progress stalls</li>
              <li>Homework and exercises get lost or forgotten</li>
              <li>You spend admin time on follow-ups instead of clinical work</li>
              <li>It's hard to see the full picture of a client's journey</li>
            </ul>
          </div>

          <!-- The solution -->
          <div style="background: linear-gradient(135deg, #fdf2f0 0%, #fef7f5 100%); border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: ${accentColor};">
              Bloomsline helps you stay connected with clients between sessions
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">&#x1F4CB;</td>
                <td style="padding: 8px 0; color: #555; font-size: 14px;">
                  <strong style="color: #333;">Share worksheets & exercises</strong><br>
                  Assign therapeutic resources your clients can complete on their own time
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">&#x1F4CA;</td>
                <td style="padding: 8px 0; color: #555; font-size: 14px;">
                  <strong style="color: #333;">Track progress & milestones</strong><br>
                  See how clients are doing between sessions with real engagement data
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">&#x1F4D6;</td>
                <td style="padding: 8px 0; color: #555; font-size: 14px;">
                  <strong style="color: #333;">Therapeutic stories & psychoeducation</strong><br>
                  Build and share narrative-based resources tailored to each client
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">&#x1F91D;</td>
                <td style="padding: 8px 0; color: #555; font-size: 14px;">
                  <strong style="color: #333;">Strengthen the therapeutic relationship</strong><br>
                  Clients feel supported even outside sessions — improving outcomes and retention
                </td>
              </tr>
            </table>
          </div>

          <!-- Social proof -->
          <div style="background-color: #f8f8f8; border-radius: 12px; padding: 16px; margin-bottom: 28px; text-align: center;">
            <p style="margin: 0; color: #555; font-size: 14px; font-style: italic;">
              "Bloomsline bridges the gap between sessions. My clients are more engaged and our work together goes deeper."
            </p>
            <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;">— Early access practitioner</p>
          </div>

          <!-- CTAs -->
          <div style="text-align: center; margin-bottom: 16px;">
            <a href="${DEMO_URL}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, ${accentColor} 0%, #c77a5f 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(212, 133, 106, 0.35);">
              Book a Demo
            </a>
          </div>

          <div style="text-align: center; margin-bottom: 8px;">
            <a href="${WEBSITE_URL}" style="display: inline-block; padding: 12px 28px; color: ${accentColor}; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; border: 1px solid #f0d0c4;">
              Explore the Website &#x2192;
            </a>
          </div>

          <p style="margin: 20px 0 0 0; color: #888; font-size: 13px; text-align: center;">
            Free to get started. No credit card required.
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const POSTMARK_API_TOKEN = Deno.env.get('POSTMARK_API_TOKEN')
    const FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL') || 'hi@bloomsline.com'
    const FROM_NAME = Deno.env.get('POSTMARK_FROM_NAME') || 'Bloomsline'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!POSTMARK_API_TOKEN) {
      console.error('POSTMARK_API_TOKEN not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: WebhookPayload = await req.json()

    console.log('Received webhook:', JSON.stringify(payload, null, 2))

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Ignored non-INSERT event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { id, member_name, practitioner_email } = payload.record
    const memberName = member_name || 'A Bloomsline member'

    console.log(`Sending practitioner invite to ${practitioner_email} from ${memberName}`)

    const client = new ServerClient(POSTMARK_API_TOKEN)

    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: practitioner_email,
      Subject: `${memberName} wants to work with you on Bloomsline`,
      HtmlBody: generateEmailHtml(memberName),
      Tag: 'practitioner-invite',
      MessageStream: 'outbound',
    })

    console.log(`Practitioner invite email sent to ${practitioner_email}, MessageID: ${response.MessageID}`)

    // Update the invite record with sent status
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabase
      .from('practitioner_invites')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        email_message_id: response.MessageID,
      })
      .eq('id', id)

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending practitioner invite:', error)

    // Try to mark as failed
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const payload = await req.clone().json().catch(() => null)
        if (payload?.record?.id) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
          await supabase
            .from('practitioner_invites')
            .update({ status: 'failed' })
            .eq('id', payload.record.id)
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
