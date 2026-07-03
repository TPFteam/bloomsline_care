import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email sent to BOTH the practitioner and the patient once a document (or every
// document in a folder) is signed. The signed PDFs are attached.
function getTemplate(params: {
  toName: string
  counterpartName: string
  role: 'practitioner' | 'patient'
  folderLabel: string
  lang: 'en' | 'fr'
  count: number
  ctaUrl?: string
}) {
  const { toName, counterpartName, role, folderLabel, lang, count, ctaUrl } = params
  const accentColor = '#4A9A86'
  const plural = count > 1

  // "Find these in your account" CTA — destination differs per side.
  const cta = role === 'practitioner'
    ? (lang === 'fr'
        ? { line: 'Vous retrouvez les documents signés dans le dossier du patient.', label: 'Ouvrir dans Bloomsline' }
        : { line: "You can find the signed documents in the patient's file.", label: 'Open in Bloomsline' })
    : (lang === 'fr'
        ? { line: 'Vous retrouvez vos documents à tout moment dans votre espace.', label: 'Voir mes documents' }
        : { line: 'You can find your documents anytime in your account.', label: 'View my documents' })
  const ctaBlock = ctaUrl
    ? `<p style="margin:16px 0 8px 0;color:#555;">${cta.line}</p>
       <div style="text-align:center;margin:16px 0 4px 0;">
         <a href="${ctaUrl}" style="display:inline-block;background-color:#1F2227;color:white;padding:12px 28px;border-radius:28px;text-decoration:none;font-weight:600;font-size:14px;">${cta.label}</a>
       </div>`
    : ''

  const en = role === 'practitioner'
    ? {
        subject: `Signed: ${folderLabel}`,
        greeting: `Hi${toName ? ' ' + toName : ''},`,
        intro: `${counterpartName || 'Your patient'} has signed ${folderLabel}. ${plural ? 'The signed documents are' : 'The signed document is'} attached for your records.`,
      }
    : {
        subject: `Your signed documents: ${folderLabel}`,
        greeting: `Hi${toName ? ' ' + toName : ''},`,
        intro: `Thank you — you've signed ${folderLabel}. ${plural ? 'Copies are' : 'A copy is'} attached for your records.`,
      }
  const fr = role === 'practitioner'
    ? {
        subject: `Signé : ${folderLabel}`,
        greeting: `Bonjour${toName ? ' ' + toName : ''},`,
        intro: `${counterpartName || 'Votre patient'} a signé ${folderLabel}. ${plural ? 'Les documents signés sont joints' : 'Le document signé est joint'} à cet e-mail.`,
      }
    : {
        subject: `Vos documents signés : ${folderLabel}`,
        greeting: `Bonjour${toName ? ' ' + toName : ''},`,
        intro: `Merci — vous avez signé ${folderLabel}. ${plural ? 'Des copies sont jointes' : 'Une copie est jointe'} à cet e-mail.`,
      }
  const content = lang === 'fr' ? fr : en
  const footerSub = lang === 'fr' ? 'Accompagner votre parcours vers le bien-être' : 'Supporting your journey to wellbeing'

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
              <p style="margin:0 0 8px 0;color:#555;">${content.intro}</p>
              ${ctaBlock}
            </div>
          </div>
          <p style="text-align:center;color:#aaa;font-size:12px;margin-top:16px;">${footerSub}</p>
        </div>
      </body>
    </html>`,
  }
}

function safeName(title: string): string {
  const base = (title || 'document').replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'document'
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
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

    const { toEmail, toName, role, counterpartName, folderLabel, documents, locale, ctaUrl } = await req.json()
    if (!toEmail || !Array.isArray(documents) || documents.length === 0) {
      return new Response(JSON.stringify({ error: 'toEmail and documents are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const lang = locale === 'fr' ? 'fr' : 'en'
    const { subject, html } = getTemplate({
      toName: toName || '',
      counterpartName: counterpartName || '',
      role: role === 'patient' ? 'patient' : 'practitioner',
      folderLabel: folderLabel || (lang === 'fr' ? 'vos documents' : 'your documents'),
      lang,
      count: documents.length,
      ctaUrl: typeof ctaUrl === 'string' ? ctaUrl : undefined,
    })

    const Attachments = (documents as Array<{ title: string; contentBase64: string }>).map((d) => ({
      Name: safeName(d.title),
      Content: d.contentBase64,
      ContentType: 'application/pdf',
    }))

    const client = new ServerClient(POSTMARK_API_TOKEN)
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: toEmail,
      Subject: subject,
      HtmlBody: html,
      Attachments,
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
