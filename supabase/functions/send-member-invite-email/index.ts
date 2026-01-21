import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email template with language support
function getTemplate(
  memberName: string,
  practitionerName: string,
  lang: 'en' | 'fr' = 'en'
) {
  const accentColor = '#4A9A86' // Teal color for members

  const content = lang === 'fr' ? {
    title: `${practitionerName} vous a invité(e) sur Bloomsline`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} vous a ajouté comme membre sur Bloomsline, une plateforme dédiée à votre bien-être.`,
    whatYouCanDo: 'Ce que vous pouvez faire :',
    features: [
      'Accéder à des ressources de bien-être personnalisées',
      'Suivre votre parcours avec votre praticien',
      'Découvrir des exercices guidés et du contenu de soutien',
    ],
    cta: 'Créer mon compte',
    ctaNote: 'Cliquez sur le bouton ci-dessous pour créer votre compte et commencer.',
    footer: 'Bloomsline Care',
    footerSub: 'Accompagner votre parcours vers le bien-être',
    questions: `Si vous avez des questions, n'hésitez pas à contacter ${practitionerName}.`,
  } : {
    title: `${practitionerName} invited you to Bloomsline`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} has added you as a member on Bloomsline, a platform dedicated to your wellbeing.`,
    whatYouCanDo: 'What you can do:',
    features: [
      'Access personalized wellness resources',
      'Track your journey with your practitioner',
      'Discover guided exercises and supportive content',
    ],
    cta: 'Create My Account',
    ctaNote: 'Click the button below to create your account and get started.',
    footer: 'Bloomsline Care',
    footerSub: 'Supporting your journey to wellness',
    questions: `If you have any questions, feel free to reach out to ${practitionerName}.`,
  }

  // Get the base URL from environment or default
  const siteUrl = Deno.env.get('SITE_URL') || 'https://bloomsline.com'

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
              <h2 style="margin: 0 0 24px 0; font-size: 20px; color: #333; text-align: center;">
                ${content.title}
              </h2>

              <p style="margin: 0 0 16px 0; color: #333; font-weight: 500;">
                ${content.greeting}
              </p>

              <p style="margin: 0 0 24px 0; color: #555;">
                ${content.intro}
              </p>

              <!-- Features -->
              <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">
                  ${content.whatYouCanDo}
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  ${content.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
                </ul>
              </div>

              <!-- CTA -->
              <p style="margin: 0 0 16px 0; color: #555; text-align: center;">
                ${content.ctaNote}
              </p>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${siteUrl}/sign-up" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  ${content.cta}
                </a>
              </div>

              <p style="margin: 0; color: #888; font-size: 14px; text-align: center;">
                ${content.questions}
              </p>
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

// Get subject based on language
function getSubject(practitionerName: string, lang: 'en' | 'fr' = 'en'): string {
  if (lang === 'fr') {
    return `${practitionerName} vous a invité(e) sur Bloomsline`
  }
  return `${practitionerName} invited you to Bloomsline`
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!POSTMARK_API_TOKEN) {
      console.error('POSTMARK_API_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Database service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the webhook payload from Supabase
    const payload = await req.json()

    // Supabase sends: { type: 'INSERT', table: 'members', record: {...}, ... }
    const { type, record } = payload

    // Only process INSERT events
    if (type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Ignored non-INSERT event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { first_name, email, practitioner_id } = record

    // Only send email if member has an email address
    if (!email) {
      return new Response(
        JSON.stringify({ message: 'Member has no email, skipping' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client to fetch practitioner info
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch practitioner's name
    const { data: practitioner, error: practitionerError } = await supabase
      .from('users')
      .select('full_name, preferred_language')
      .eq('id', practitioner_id)
      .single()

    if (practitionerError) {
      console.error('Error fetching practitioner:', practitionerError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch practitioner info' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const practitionerName = practitioner?.full_name || 'Your practitioner'
    // Use practitioner's language preference for the email (default to 'en')
    const lang = (practitioner?.preferred_language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'

    // Initialize Postmark client
    const client = new ServerClient(POSTMARK_API_TOKEN)

    // Get subject and template
    const subject = getSubject(practitionerName, lang)
    const htmlBody = getTemplate(first_name || 'there', practitionerName, lang)

    // Send email
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: email,
      Subject: subject,
      HtmlBody: htmlBody,
      Tag: 'member-invite',
      MessageStream: 'outbound',
    })

    console.log(`Member invite email sent to ${email} (invited by ${practitionerName}) in ${lang}, MessageID: ${response.MessageID}`)

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending member invite email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
