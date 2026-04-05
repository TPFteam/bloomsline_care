import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getTemplate(params: {
  memberName: string
  memberLastName: string
  practitionerName: string
  practitionerAvatarUrl: string | null
  lang: 'en' | 'fr'
}) {
  const { memberName, memberLastName, practitionerName, practitionerAvatarUrl, lang } = params
  const accentColor = '#4A9A86'
  const practitionerInitials = getInitials(practitionerName)
  const memberInitials = getInitials(`${memberName} ${memberLastName}`)

  const practitionerCircle = practitionerAvatarUrl
    ? `<div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><img src="${practitionerAvatarUrl}" alt="${practitionerName}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
    : `<div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, ${accentColor}, #5AB39C); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><span style="color: white; font-weight: 700; font-size: 18px;">${practitionerInitials}</span></div>`

  const memberCircle = `<div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6B7280, #9CA3AF); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-left: -12px;"><span style="color: white; font-weight: 700; font-size: 18px;">${memberInitials}</span></div>`

  const content = lang === 'fr' ? {
    subject: `${practitionerName} vous a préparé un espace bien-être`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} souhaite vous accompagner entre vos séances avec des outils pensés pour votre bien-être.`,
    intro2: `Un espace vous attend sur Bloomsline, une app bien-être pour prendre soin de vous à votre rythme. Sans frais, sans engagement.`,
    what: `Qu'est-ce que Bloomsline ?`,
    whatDesc: `Un espace sécurisé et privé où vous pouvez recevoir des ressources de votre praticien(ne), suivre votre progression et explorer des outils bien-être par vous-même — quand vous en avez envie.`,
    expectTitle: `Ce qui vous attend :`,
    expectItems: [
      `Des exercices et fiches partagés par ${practitionerName}`,
      'Des rappels pour vos séances',
      'Un espace personnel pour capturer vos réflexions et suivre votre évolution',
      'Des ressources bien-être à explorer librement, à votre rythme',
    ],
    secure: 'Confidentiel et sécurisé.',
    secureDesc: 'Vos données sont protégées et conformes au RGPD.',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} has created a wellbeing space for you`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} wants to support you between sessions with tools designed for your wellbeing.`,
    intro2: `You have a space waiting for you on Bloomsline, a wellbeing app to take care of yourself at your own pace. No cost, no commitment.`,
    what: `What is Bloomsline?`,
    whatDesc: `A secure and private place where you can receive resources from your practitioner, track your progress, and explore wellbeing tools on your own — whenever you feel like it.`,
    expectTitle: `What to expect:`,
    expectItems: [
      `Exercises and worksheets shared by ${practitionerName}`,
      'Reminders for your sessions',
      'A personal space to capture your thoughts and track how you\'re doing',
      'Wellbeing resources to explore freely, at your own pace',
    ],
    secure: 'Confidential and secure.',
    secureDesc: 'Your data is protected and GDPR-compliant.',
    footerSub: 'Supporting your journey to wellbeing',
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
              <p style="margin: 0 0 20px 0; font-weight: 500;">
                ${content.greeting}
              </p>

              <!-- Connection circles -->
              <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 24px;">
                <!--[if mso]><table><tr><td>${practitionerCircle}</td><td>${memberCircle}</td></tr></table><![endif]-->
                <!--[if !mso]><!-->${practitionerCircle}${memberCircle}<!--<![endif]-->
              </div>

              <p style="margin: 0 0 8px 0; color: #555;">
                ${content.intro}
              </p>

              <p style="margin: 0 0 24px 0; color: #555;">
                ${content.intro2}
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
                ${content.expectTitle}
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #555;">
                ${content.expectItems.map(item => `<li style="margin-bottom: 8px; font-size: 14px; line-height: 1.5;">${item}</li>`).join('')}
              </ul>

              <!-- Security -->
              <div style="background-color: #f8f8f8; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #333; font-size: 14px;">
                  ${content.secure}
                </p>
                <p style="margin: 0; color: #666; font-size: 13px;">
                  ${content.secureDesc}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="https://app.bloomsline.com/welcome" style="display: inline-block; background-color: #1F2227; color: white; padding: 14px 32px; border-radius: 28px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  ${lang === 'fr' ? 'Découvrir mon espace' : 'Discover my space'}
                </a>
              </div>

              <!-- Links -->
              <div style="text-align: center; color: #888; font-size: 13px; line-height: 1.8;">
                <a href="https://bloomsline.com" style="color: ${accentColor}; text-decoration: none; font-weight: 500;">
                  ${lang === 'fr' ? 'Explorer Bloomsline' : 'Explore Bloomsline'}
                </a>
                <br />
                ${lang === 'fr' ? 'Des questions ? Écrivez-nous à' : 'Questions? Write to us at'}
                <a href="mailto:hi@bloomsline.com" style="color: ${accentColor}; text-decoration: none;"> hi@bloomsline.com</a>
              </div>
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

    const { memberName, memberLastName, memberEmail, practitionerName, practitionerAvatarUrl, locale } = await req.json()

    if (!memberEmail || !memberName || !practitionerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lang = (locale === 'fr' ? 'fr' : 'en') as 'en' | 'fr'
    const { subject, html } = getTemplate({
      memberName,
      memberLastName: memberLastName || '',
      practitionerName,
      practitionerAvatarUrl: practitionerAvatarUrl || null,
      lang,
    })

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
