import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getTemplate(params: {
  memberName: string
  practitionerName: string
  lang: 'en' | 'fr'
}) {
  const { memberName, practitionerName, lang } = params
  const accentColor = '#4A9A86'

  const content = lang === 'fr' ? {
    subject: `${practitionerName} vous invite sur Bloomsline`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} utilise Bloomsline pour partager des ressources thérapeutiques avec vous entre vos séances.`,
    what: `Qu'est-ce que Bloomsline ?`,
    whatDesc: `C'est un espace sécurisé et confidentiel où votre praticien(ne) peut partager des exercices, suivre votre progression et communiquer avec vous entre les séances.`,
    expect: `Ce que vous pouvez recevoir :`,
    expectItems: [
      'Des exercices et fiches de travail',
      'Des rappels de séance',
      'Des ressources de bien-être personnalisées',
    ],
    secure: `🔒 Vos données sont protégées et conformes au RGPD.`,
    questions: `Si vous avez des questions, contactez directement ${practitionerName}.`,
    footer: 'Bloomsline Care',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} invites you to Bloomsline`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} uses Bloomsline to share therapeutic resources with you between sessions.`,
    what: `What is Bloomsline?`,
    whatDesc: `It's a secure and confidential space where your practitioner can share exercises, track your progress, and communicate with you between sessions.`,
    expect: `What you can expect:`,
    expectItems: [
      'Exercises and worksheets',
      'Session reminders',
      'Personalized wellbeing resources',
    ],
    secure: `🔒 Your data is protected and GDPR-compliant.`,
    questions: `If you have any questions, contact ${practitionerName} directly.`,
    footer: 'Bloomsline Care',
    footerSub: 'Supporting your journey to wellness',
  }

  return {
    subject: content.subject,
    html: `
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
              <span style="font-size: 24px; font-weight: 500; color: #1F2227;">blooms</span><span style="font-size: 24px; font-weight: 300; color: ${accentColor};">line</span>
            </div>

            <!-- Content -->
            <div style="color: #333; line-height: 1.7;">
              <p style="margin: 0 0 16px 0; font-weight: 500;">
                ${content.greeting}
              </p>

              <p style="margin: 0 0 24px 0; color: #555;">
                ${content.intro}
              </p>

              <!-- What is Bloomsline -->
              <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #333; font-size: 15px;">
                  ${content.what}
                </p>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  ${content.whatDesc}
                </p>
              </div>

              <!-- What to expect -->
              <p style="margin: 0 0 12px 0; font-weight: 600; color: #333; font-size: 15px;">
                ${content.expect}
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #555;">
                ${content.expectItems.map(item => `<li style="margin-bottom: 6px; font-size: 14px;">${item}</li>`).join('')}
              </ul>

              <!-- Security note -->
              <p style="margin: 0 0 24px 0; color: #555; font-size: 14px;">
                ${content.secure}
              </p>

              <p style="margin: 0; color: #888; font-size: 14px; text-align: center;">
                ${content.questions}
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
              <p style="margin: 0;"><span style="font-weight: 500; color: #1F2227;">blooms</span><span style="font-weight: 300; color: ${accentColor};">line</span></p>
              <p style="margin: 8px 0 0 0;">${content.footerSub}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const POSTMARK_API_TOKEN = Deno.env.get('POSTMARK_API_TOKEN')
    const FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL') || 'team@theproductfirst.com'
    const FROM_NAME = Deno.env.get('POSTMARK_FROM_NAME') || 'Bloomsline Care'

    if (!POSTMARK_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { memberName, memberEmail, practitionerName, locale } = await req.json()

    if (!memberEmail || !memberName || !practitionerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: memberName, memberEmail, practitionerName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lang = (locale === 'fr' ? 'fr' : 'en') as 'en' | 'fr'
    const { subject, html } = getTemplate({ memberName, practitionerName, lang })

    const client = new ServerClient(POSTMARK_API_TOKEN)
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: memberEmail,
      Subject: subject,
      HtmlBody: html,
      Tag: 'member-welcome',
      MessageStream: 'outbound',
    })

    console.log(`Welcome email sent to ${memberEmail} (by: ${practitionerName}), MessageID: ${response.MessageID}`)

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
