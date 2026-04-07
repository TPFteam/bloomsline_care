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
    ? `<div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 auto;"><img src="${practitionerAvatarUrl}" alt="${practitionerName}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
    : `<div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, ${accentColor}, #5AB39C); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 auto;"><span style="color: white; font-weight: 700; font-size: 18px;">${practitionerInitials}</span></div>`

  const memberCircle = `<div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6B7280, #9CA3AF); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-left: -12px;"><span style="color: white; font-weight: 700; font-size: 18px;">${memberInitials}</span></div>`

  const content = lang === 'fr' ? {
    subject: `${practitionerName} vous invite à rejoindre Bloomsline`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} vous invite à rejoindre Bloomsline pour prolonger votre accompagnement entre les séances.`,
    intro2: '',
    what: `Qu'est-ce que Bloomsline ?`,
    whatDesc: `C'est votre espace privé et sécurisé pour accéder aux ressources partagées par votre praticien(ne), organiser vos séances et mieux comprendre ce que vous vivez entre les séances.`,
    expectTitle: `Concrètement, vous pouvez :`,
    expectItems: [
      'Planifier et gérer vos séances',
      'Déposer vos réflexions si vous le souhaitez',
      'Suivre votre parcours dans le temps',
    ],
    secure: 'Confidentialité et sécurité',
    secureDesc: 'Vos données sont protégées et conformes aux normes RGPD.',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} invites you to join Bloomsline`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} invites you to join Bloomsline to continue your care between sessions.`,
    intro2: '',
    what: `What is Bloomsline?`,
    whatDesc: `It's your private and secure space to access resources shared by your practitioner, organize your sessions, and better understand what you're going through between sessions.`,
    expectTitle: `Here's what you can do:`,
    expectItems: [
      'Book and manage your sessions',
      'Capture your thoughts, whenever you feel like it',
      'See how far you\'ve come, over time',
    ],
    secure: 'Privacy and security',
    secureDesc: 'Your data is protected and compliant with GDPR standards.',
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
              <!-- Practitioner avatar -->
              <div style="text-align: center; margin-bottom: 24px;">
                ${practitionerCircle}
              </div>

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
                  ${lang === 'fr' ? 'Accéder à mon espace' : 'Access my space'}
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
