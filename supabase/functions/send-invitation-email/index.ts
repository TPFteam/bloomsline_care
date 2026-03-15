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
    preferred_language?: string
  }
  old_record: {
    id: string
    status: string
  }
}

function generateEmailHtml(name: string, userType: string, signupUrl: string, lang: string) {
  const firstName = name.split(' ')[0]
  const accentColor = '#4A9A86'
  const isFr = lang === 'fr'

  const roleDescription = isFr
    ? (userType === 'member'
      ? 'un espace pour prendre soin de votre bien-être'
      : userType === 'practitioner'
      ? 'des outils pour mieux accompagner les personnes dont vous prenez soin'
      : 'des outils de bien-être personnel et des fonctionnalités pour praticiens')
    : (userType === 'member'
      ? 'a space to nurture your wellbeing'
      : userType === 'practitioner'
      ? 'tools to better support the people you care for'
      : 'both personal wellbeing tools and practitioner features')

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
            ${isFr ? 'Bienvenue sur Bloomsline' : 'Welcome to Bloomsline'}
          </h2>

          <p style="margin: 0 0 16px 0; color: #333; font-weight: 500;">
            ${isFr ? `Bonjour ${firstName},` : `Hi ${firstName},`}
          </p>

          <p style="margin: 0 0 24px 0; color: #555;">
            ${isFr
              ? 'Merci — et bienvenue sur Bloomsline. Votre compte est prêt à être configuré.'
              : 'Thank you — and welcome to Bloomsline. Your account is ready to set up.'}
          </p>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${signupUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
              ${isFr ? 'Créer mon compte' : 'Create My Account'}
            </a>
          </div>

          <p style="margin: 0; color: #555; font-size: 14px; text-align: center;">
            ${isFr
              ? 'Nous avons construit Bloomsline pour des personnes comme vous. On est contents que vous soyez là.'
              : 'We built Bloomsline for people like you. We\'re glad you\'re here.'}
          </p>

          <p style="margin: 16px 0 0; color: #555; font-size: 14px;">
            ${isFr ? 'Avec soin,' : 'With care,'}
            <br>
            ${isFr ? 'L\'équipe Bloomsline' : 'The Bloomsline team'}
          </p>

          <p style="margin: 24px 0 0; color: #888; font-size: 13px; text-align: center;">
            ${isFr
              ? 'Une question ? Contactez-nous à <a href="mailto:hi@bloomsline.com" style="color: #4A9A86; text-decoration: none;">hi@bloomsline.com</a>'
              : 'Any questions? Reach out to us at <a href="mailto:hi@bloomsline.com" style="color: #4A9A86; text-decoration: none;">hi@bloomsline.com</a>'}
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
          <p style="margin: 0;">Bloomsline Care</p>
          <p style="margin: 8px 0 0 0;">${isFr ? 'Le soin continue entre les séances' : 'Where care continues between sessions'}</p>
        </div>
      </div>
    </div>
  </body>
</html>`
}

function generateTextBody(name: string, userType: string, signupUrl: string, lang: string) {
  const firstName = name.split(' ')[0]
  const isFr = lang === 'fr'

  const roleDescription = isFr
    ? (userType === 'member'
      ? 'un espace pour prendre soin de votre bien-être'
      : userType === 'practitioner'
      ? 'des outils pour mieux accompagner les personnes dont vous prenez soin'
      : 'des outils de bien-être personnel et des fonctionnalités pour praticiens')
    : (userType === 'member'
      ? 'a space to nurture your wellbeing'
      : userType === 'practitioner'
      ? 'tools to better support the people you care for'
      : 'both personal wellbeing tools and practitioner features')

  if (isFr) {
    return `Bonjour ${firstName},

Merci — et bienvenue sur Bloomsline. Votre compte est prêt à être configuré.

Créer votre compte : ${signupUrl}

Nous avons construit Bloomsline pour des personnes comme vous. On est contents que vous soyez là.

Une question ? Contactez-nous à hi@bloomsline.com

Avec soin,
L'équipe Bloomsline

Bloomsline Care — Le soin continue entre les séances`
  }

  return `Hi ${firstName},

Thank you — and welcome to Bloomsline. Your account is ready to set up.

Create your account: ${signupUrl}

We built Bloomsline for people like you. We're glad you're here.

Any questions? Reach out to us at hi@bloomsline.com

With care,
The Bloomsline team

Bloomsline Care — Where care continues between sessions`
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

    const { name, email, user_type, preferred_language } = payload.record
    const lang = preferred_language || 'en'
    const firstName = name.split(' ')[0]
    const isFr = lang === 'fr'
    const signupUrl = user_type === 'member'
      ? 'https://app.bloomsline.com/sign-up'
      : `${APP_URL}/sign-up`

    console.log(`Sending invitation email to ${email} (lang: ${lang})`)

    const client = new ServerClient(POSTMARK_API_TOKEN)

    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: email,
      Subject: isFr
        ? `${firstName}, votre espace sur Bloomsline est prêt`
        : `${firstName}, your space on Bloomsline is ready`,
      HtmlBody: generateEmailHtml(name, user_type || 'member', signupUrl, lang),
      TextBody: generateTextBody(name, user_type || 'member', signupUrl, lang),
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
