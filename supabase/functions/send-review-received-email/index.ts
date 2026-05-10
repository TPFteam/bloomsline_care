import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Triggered by a Supabase database webhook on `resource_responses`
 * UPDATE events when a row's status transitions into 'reviewed' (or its
 * `reviewed_at` timestamp gets set). Sends the patient an email
 * announcing that their practitioner reviewed the submission, plus an
 * in-app notification row so the bell lights up.
 *
 * Mirrors the architecture of `send-resource-shared-email` so the
 * deploy + webhook story is identical.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/** Strip HTML tags from the practitioner's free-text note before embedding. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function getReviewTemplate(params: {
  memberName: string
  practitionerName: string
  practitionerAvatarUrl: string | null
  resourceTitle: string
  practitionerNote: string | null   // already plain text, may be empty
  ctaUrl: string
  lang: 'en' | 'fr'
}) {
  const { memberName, practitionerName, practitionerAvatarUrl, resourceTitle, practitionerNote, ctaUrl, lang } = params
  const accentColor = '#4A9A86'
  const initials = getInitials(practitionerName)

  const c = lang === 'fr' ? {
    subject: `${practitionerName} a relu vos réponses à "${resourceTitle}"`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} a relu vos réponses et a laissé un mot pour vous.`,
    introNoNote: `${practitionerName} a relu vos réponses à "${resourceTitle}".`,
    tail: `Prenez un moment quand vous êtes prêt(e) — c'est là pour vous.`,
    cta: 'Voir mes réponses',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} reviewed your responses to "${resourceTitle}"`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} has reviewed your responses and left a note for you.`,
    introNoNote: `${practitionerName} has reviewed your responses to "${resourceTitle}".`,
    tail: `Take a moment when you're ready — it's there for you.`,
    cta: 'View my responses',
    footerSub: 'Supporting your journey to wellbeing',
  }

  const practitionerCircle = practitionerAvatarUrl
    ? `<div style="width:64px;height:64px;border-radius:50%;border:3px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:inline-block;"><img src="${practitionerAvatarUrl}" alt="${practitionerName}" style="width:100%;height:100%;object-fit:cover;" /></div>`
    : `<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,${accentColor},#5AB39C);display:inline-flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.1);"><span style="color:white;font-weight:700;font-size:20px;">${initials}</span></div>`

  // Quoted note block — only rendered when the practitioner actually
  // wrote something. Background matches the bloomsline accent so it
  // reads as "their voice" rather than UI chrome.
  const noteBlock = practitionerNote
    ? `
      <div style="background:linear-gradient(135deg,${accentColor} 0%,#5AB39C 100%);border-radius:12px;padding:18px 20px;margin:20px 0 24px;">
        <p style="margin:0;color:white;font-style:italic;line-height:1.6;font-size:15px;">"${practitionerNote}"</p>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.78);font-size:12px;">— ${practitionerName}</p>
      </div>`
    : ''

  return {
    subject: c.subject,
    html: `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:24px;font-weight:500;color:#1F2227;">blooms</span><span style="font-size:24px;font-weight:300;color:${accentColor};">line</span>
          </div>
          <div style="color:#333;line-height:1.7;">
            <div style="text-align:center;margin-bottom:12px;">${practitionerCircle}</div>
            <p style="margin:0 0 20px;text-align:center;font-weight:600;color:#1F2227;font-size:15px;">${practitionerName}</p>

            <p style="margin:0 0 16px;font-weight:500;">${c.greeting}</p>
            <p style="margin:0 0 16px;color:#555;">${practitionerNote ? c.intro : c.introNoNote}</p>

            ${noteBlock}

            <div style="background:#f8f8f8;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid ${accentColor};">
              <p style="margin:0;font-weight:600;color:#333;font-size:16px;">${resourceTitle}</p>
              <p style="margin:4px 0 0;color:#888;font-size:13px;">${lang === 'fr' ? 'Réponses relues' : 'Responses reviewed'}</p>
            </div>

            <p style="margin:0 0 24px;color:#555;">${c.tail}</p>

            <div style="text-align:center;margin-bottom:24px;">
              <a href="${ctaUrl}" style="display:inline-block;background:#1F2227;color:white;padding:14px 32px;border-radius:28px;text-decoration:none;font-weight:600;font-size:15px;">${c.cta}</a>
            </div>

            <div style="text-align:center;color:#888;font-size:13px;line-height:1.8;">
              <a href="https://bloomsline.com" style="color:${accentColor};text-decoration:none;font-weight:500;">${lang === 'fr' ? 'Explorer Bloomsline' : 'Explore Bloomsline'}</a><br/>
              ${lang === 'fr' ? 'Des questions ? Écrivez-nous à' : 'Questions? Write to us at'} <a href="mailto:hi@bloomsline.com" style="color:${accentColor};text-decoration:none;">hi@bloomsline.com</a>
            </div>
          </div>
          <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#888;font-size:12px;">
            <p style="margin:0;"><span style="font-weight:500;color:#1F2227;">blooms</span><span style="font-weight:300;color:${accentColor};">line</span></p>
            <p style="margin:8px 0 0;">${c.footerSub}</p>
          </div>
        </div>
      </div>
    </body></html>`,
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!POSTMARK_API_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()
    const { type, record, old_record } = payload

    if (type !== 'UPDATE') {
      return new Response(JSON.stringify({ message: 'Ignored (not UPDATE)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Only fire on the transition into 'reviewed'. Keeps a re-save on
    // an already-reviewed row from re-emailing the patient.
    const wasReviewed = old_record?.status === 'reviewed'
    const isReviewed = record?.status === 'reviewed'
    if (!isReviewed || wasReviewed) {
      return new Response(JSON.stringify({ message: 'Skipped (no transition)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { member_id, resource_id, practitioner_id, practitioner_notes } = record
    if (!member_id || !resource_id || !practitioner_id) {
      return new Response(JSON.stringify({ message: 'Missing IDs' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: member } = await supabase
      .from('members')
      .select('first_name, email, user_id')
      .eq('id', member_id)
      .single()

    if (!member?.email) {
      console.log('Member missing or no email; skipping')
      return new Response(JSON.stringify({ message: 'Skipped (no email)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: resource } = await supabase
      .from('resources')
      .select('title')
      .eq('id', resource_id)
      .single()

    const { data: practitioner } = await supabase
      .from('users')
      .select('full_name, preferred_language, avatar_url')
      .eq('id', practitioner_id)
      .single()

    const practitionerName = practitioner?.full_name || 'Your practitioner'
    const lang = (practitioner?.preferred_language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'
    const memberName = member.first_name || 'there'
    const resourceTitle = typeof resource?.title === 'string' ? resource.title : 'Resource'
    const note = practitioner_notes ? stripHtml(String(practitioner_notes)) : ''
    const practitionerNote = note.length > 0 ? note : null

    const ctaUrl = `https://app.bloomsline.com/practitioner?openResourceId=${resource_id}`

    const { subject, html } = getReviewTemplate({
      memberName,
      practitionerName,
      practitionerAvatarUrl: practitioner?.avatar_url || null,
      resourceTitle,
      practitionerNote,
      ctaUrl,
      lang,
    })

    const client = new ServerClient(POSTMARK_API_TOKEN)
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: member.email,
      Subject: subject,
      HtmlBody: html,
      Tag: 'response-reviewed',
      MessageStream: 'outbound',
    })

    console.log(`Review-received email sent, MessageID: ${response.MessageID}`)

    // In-app notification — only for members who have a Bloomsline
    // account. Members without one will only get the email.
    if (member.user_id) {
      const notePreview = practitionerNote
        ? (practitionerNote.length > 140 ? practitionerNote.slice(0, 140) + '…' : practitionerNote)
        : null
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        user_type: 'member',
        type: 'response_reviewed',
        title: lang === 'fr'
          ? `${practitionerName} a relu vos réponses`
          : `${practitionerName} reviewed your responses`,
        body: notePreview
          ? `"${notePreview}"`
          : (lang === 'fr'
              ? `Vos réponses à "${resourceTitle}" ont été relues.`
              : `Your responses to "${resourceTitle}" have been reviewed.`),
        entity_type: 'resource_response',
        entity_id: record.id,
        metadata: {
          resourceId: resource_id,
          resourceTitle: resource?.title,
          practitionerName,
          practitionerNotes: practitionerNote,
        },
      })
    }

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
