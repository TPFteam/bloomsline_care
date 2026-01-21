import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email templates with language support
function getTemplate(type: 'member' | 'practitioner' | 'both', name: string, lang: 'en' | 'fr' = 'en') {
  const isPractitioner = type === 'practitioner'
  const isBoth = type === 'both'
  const accentColor = isPractitioner ? '#D4856A' : '#4A9A86'

  // Content based on language
  const content = lang === 'fr' ? {
    title: `Vous êtes sur la liste, ${name} !`,
    roleText: isBoth
      ? 'ceux qui cherchent du soutien et qui accompagnent les autres'
      : isPractitioner
        ? 'les praticiens comme vous qui souhaitent mieux accompagner leurs clients'
        : 'les personnes en quête de soutien dans leur parcours de bien-être',
    thankYou: 'Merci de rejoindre notre liste d\'accès anticipé. Nous construisons quelque chose de spécial pour',
    stayTuned: 'Nous vous contacterons bientôt avec des nouvelles et votre invitation exclusive.',
    working: 'Nous travaillons dur pour créer un espace de soutien pour le bien-être mental.',
    footer: 'Bloomsline Care',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    title: `You're on the list, ${name}!`,
    roleText: isBoth
      ? 'both as someone seeking support and as a practitioner helping others'
      : isPractitioner
        ? 'practitioners like you who want to better support their clients'
        : 'people seeking support on their wellness journey',
    thankYou: 'Thank you for joining our early access list. We\'re building something special for',
    stayTuned: 'We\'ll be in touch soon with updates and your exclusive early access invitation.',
    working: 'We\'re working hard to create a supportive space for mental wellness.',
    footer: 'Bloomsline Care',
    footerSub: 'Supporting your journey to wellness',
  }

  return `
    <!DOCTYPE html>
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
                ${content.title}
              </h2>

              <p style="margin: 0 0 16px 0; color: #555;">
                ${content.thankYou} ${content.roleText}.
              </p>

              <p style="margin: 0 0 24px 0; color: #555;">
                ${content.stayTuned}
              </p>

              <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #888;">
                  ${content.working}
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
              <p style="margin: 0;">${content.footer}</p>
              <p style="margin: 8px 0 0 0;">${content.footerSub}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Get subject based on user type and language
function getSubject(type: 'member' | 'practitioner' | 'both', lang: 'en' | 'fr' = 'en'): string {
  if (lang === 'fr') {
    if (type === 'practitioner') {
      return "Bienvenue sur Bloomsline pour Praticiens - Vous êtes sur la liste !"
    }
    return "Vous êtes sur la liste d'accès anticipé Bloomsline !"
  }

  if (type === 'practitioner') {
    return "Welcome to Bloomsline for Practitioners - You're on the list!"
  }
  return "You're on the Bloomsline early access list!"
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const POSTMARK_API_TOKEN = Deno.env.get('POSTMARK_API_TOKEN')
    const FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL') || 'team@theproductfirst.com'
    const FROM_NAME = Deno.env.get('POSTMARK_FROM_NAME') || 'Bloomsline Care'

    if (!POSTMARK_API_TOKEN) {
      console.error('POSTMARK_API_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the webhook payload from Supabase
    const payload = await req.json()

    // Supabase sends: { type: 'INSERT', table: 'early_access_waitlist', record: {...}, ... }
    const { type, record } = payload

    // Only process INSERT events
    if (type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Ignored non-INSERT event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, user_type, preferred_language } = record
    const lang = (preferred_language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Postmark client
    const client = new ServerClient(POSTMARK_API_TOKEN)

    // Get subject and template based on user type and language
    const subject = getSubject(user_type || 'member', lang)
    const htmlBody = getTemplate(user_type || 'member', name, lang)

    // Send email
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: email,
      Subject: subject,
      HtmlBody: htmlBody,
      Tag: 'early-access',
      MessageStream: 'outbound',
    })

    console.log(`Email sent to ${email} in ${lang}, MessageID: ${response.MessageID}`)

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
