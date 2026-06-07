import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getTemplate(params: {
  memberName: string
  practitionerName: string
  documentTitle: string
  signUrl: string
  lang: 'en' | 'fr'
}) {
  const { memberName, practitionerName, documentTitle, signUrl, lang } = params
  const accentColor = '#4A9A86'
  const by = practitionerName ? (lang === 'fr' ? ` par ${practitionerName}` : ` by ${practitionerName}`) : ''

  const content = lang === 'fr' ? {
    subject: `À signer : ${documentTitle}`,
    greeting: `Bonjour${memberName ? ' ' + memberName : ''},`,
    intro: `Un document vous a été envoyé${by} et nécessite votre signature : « ${documentTitle} ».`,
    cta: 'Lire et signer',
    note: 'Ce lien est personnel et expire dans 30 jours.',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `To sign: ${documentTitle}`,
    greeting: `Hi${memberName ? ' ' + memberName : ''},`,
    intro: `A document has been sent to you${by} and needs your signature: "${documentTitle}".`,
    cta: 'Read & sign',
    note: 'This link is personal and expires in 30 days.',
    footerSub: 'Supporting your journey to wellbeing',
  }

  return {
    subject: content.subject,
    html: `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="background-color:white;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align:center;margin-bottom:32px;">
              <span style="font-size:24px;font-weight:500;color:#1F2227;">blooms</span><span style="font-size:24px;font-weight:300;color:${accentColor};">line</span>
            </div>
            <div style="color:#333;line-height:1.7;">
              <p style="margin:0 0 16px 0;font-weight:500;">${content.greeting}</p>
              <p style="margin:0 0 24px 0;color:#555;">${content.intro}</p>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${signUrl}" style="display:inline-block;background-color:#1F2227;color:white;padding:14px 32px;border-radius:28px;text-decoration:none;font-weight:600;font-size:15px;">${content.cta}</a>
              </div>
              <p style="margin:0;color:#888;font-size:13px;text-align:center;">${content.note}</p>
            </div>
          </div>
          <p style="text-align:center;color:#aaa;font-size:12px;margin-top:16px;">${content.footerSub}</p>
        </div>
      </body>
    </html>`,
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
      return new Response(JSON.stringify({ error: 'POSTMARK_API_TOKEN not set' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { memberEmail, memberName, practitionerName, documentTitle, signUrl, locale } = await req.json()
    if (!memberEmail || !signUrl) {
      return new Response(JSON.stringify({ error: 'memberEmail and signUrl are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const lang = locale === 'fr' ? 'fr' : 'en'
    const { subject, html } = getTemplate({
      memberName: memberName || '',
      practitionerName: practitionerName || '',
      documentTitle: documentTitle || '',
      signUrl,
      lang,
    })

    const client = new ServerClient(POSTMARK_API_TOKEN)
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: memberEmail,
      Subject: subject,
      HtmlBody: html,
      MessageStream: 'outbound',
    })

    return new Response(JSON.stringify({ ok: true, messageId: response.MessageID }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
