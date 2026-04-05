import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── RETURNING USER TEMPLATE (invitation already sent) ───
function getResourceTemplate(params: {
  memberName: string
  practitionerName: string
  resourceTitle: string
  resourceType: string
  resourceId: string
  ctaUrl: string
  lang: 'en' | 'fr'
}) {
  const { memberName, practitionerName, resourceTitle, resourceType, ctaUrl, lang } = params
  const accentColor = '#4A9A86'

  const typeLabels: Record<string, { en: string; fr: string }> = {
    worksheet: { en: 'worksheet', fr: 'fiche de travail' },
    exercise: { en: 'exercise', fr: 'exercice' },
    psychoeducation: { en: 'resource', fr: 'ressource' },
    assessment: { en: 'assessment', fr: 'évaluation' },
    table: { en: 'table', fr: 'tableau' },
  }
  const typeLabel = typeLabels[resourceType]?.[lang] || (lang === 'fr' ? 'ressource' : 'resource')

  const c = lang === 'fr' ? {
    subject: `${practitionerName} vous a partagé une ${typeLabel}`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} vous a partagé une nouvelle ${typeLabel} :`,
    cta: 'Voir la ressource',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} shared a ${typeLabel} with you`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} shared a new ${typeLabel} with you:`,
    cta: 'View Resource',
    footerSub: 'Supporting your journey to wellbeing',
  }

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
            <p style="margin:0 0 16px;font-weight:500;">${c.greeting}</p>
            <p style="margin:0 0 16px;color:#555;">${c.intro}</p>
            <div style="background:#f8f8f8;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid ${accentColor};">
              <p style="margin:0;font-weight:600;color:#333;font-size:16px;">${resourceTitle}</p>
              <p style="margin:4px 0 0;color:#888;font-size:13px;text-transform:capitalize;">${typeLabel}</p>
            </div>
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

// ─── FIRST TIME TEMPLATE (welcome + resource combined) ───
function getWelcomeResourceTemplate(params: {
  memberName: string
  memberLastName: string
  practitionerName: string
  practitionerAvatarUrl: string | null
  resourceTitle: string
  resourceType: string
  ctaUrl: string
  lang: 'en' | 'fr'
}) {
  const { memberName, memberLastName, practitionerName, practitionerAvatarUrl, resourceTitle, resourceType, ctaUrl, lang } = params
  const accentColor = '#4A9A86'
  const practitionerInitials = getInitials(practitionerName)
  const memberInitials = getInitials(`${memberName} ${memberLastName}`)

  const typeLabels: Record<string, { en: string; fr: string }> = {
    worksheet: { en: 'worksheet', fr: 'fiche de travail' },
    exercise: { en: 'exercise', fr: 'exercice' },
    psychoeducation: { en: 'resource', fr: 'ressource' },
    assessment: { en: 'assessment', fr: 'évaluation' },
    table: { en: 'table', fr: 'tableau' },
  }
  const typeLabel = typeLabels[resourceType]?.[lang] || (lang === 'fr' ? 'ressource' : 'resource')

  const practitionerCircle = practitionerAvatarUrl
    ? `<div style="width:56px;height:56px;border-radius:50%;border:3px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:inline-block;vertical-align:middle;"><img src="${practitionerAvatarUrl}" alt="${practitionerName}" style="width:100%;height:100%;object-fit:cover;" /></div>`
    : `<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,${accentColor},#5AB39C);display:inline-flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.1);vertical-align:middle;"><span style="color:white;font-weight:700;font-size:18px;">${practitionerInitials}</span></div>`

  const memberCircle = `<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6B7280,#9CA3AF);display:inline-flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-left:-12px;vertical-align:middle;"><span style="color:white;font-weight:700;font-size:18px;">${memberInitials}</span></div>`

  const c = lang === 'fr' ? {
    subject: `${practitionerName} vous a partagé une ${typeLabel}`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} souhaite vous accompagner entre vos séances avec des outils pensés pour votre bien-être.`,
    intro2: `Un espace vous attend sur Bloomsline, une app bien-être pour prendre soin de vous à votre rythme. Sans frais, sans engagement.`,
    what: `Qu'est-ce que Bloomsline ?`,
    whatDesc: `Un espace sécurisé et privé où vous pouvez recevoir des ressources de votre praticien(ne), suivre votre progression et explorer des outils bien-être par vous-même — quand vous en avez envie.`,
    resourceIntro: `${practitionerName} vous a partagé :`,
    expectTitle: `Ce qui vous attend :`,
    expectItems: [
      `Des exercices et fiches partagés par ${practitionerName}`,
      'Des rappels pour vos séances',
      'Un espace personnel pour capturer vos réflexions et suivre votre évolution',
      'Des ressources bien-être à explorer librement, à votre rythme',
    ],
    secure: 'Confidentiel et sécurisé.',
    secureDesc: 'Vos données sont protégées et conformes au RGPD.',
    cta: 'Découvrir mon espace',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} shared a ${typeLabel} with you`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} wants to support you between sessions with tools designed for your wellbeing.`,
    intro2: `You have a space waiting for you on Bloomsline, a wellbeing app to take care of yourself at your own pace. No cost, no commitment.`,
    what: `What is Bloomsline?`,
    whatDesc: `A secure and private place where you can receive resources from your practitioner, track your progress, and explore wellbeing tools on your own — whenever you feel like it.`,
    resourceIntro: `${practitionerName} shared with you:`,
    expectTitle: `What to expect:`,
    expectItems: [
      `Exercises and worksheets shared by ${practitionerName}`,
      'Reminders for your sessions',
      'A personal space to capture your thoughts and track how you\'re doing',
      'Wellbeing resources to explore freely, at your own pace',
    ],
    secure: 'Confidential and secure.',
    secureDesc: 'Your data is protected and GDPR-compliant.',
    cta: 'Discover my space',
    footerSub: 'Supporting your journey to wellbeing',
  }

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
            <p style="margin:0 0 20px;font-weight:500;">${c.greeting}</p>

            <!-- Connection circles -->
            <div style="text-align:center;margin-bottom:24px;">
              ${practitionerCircle}${memberCircle}
            </div>

            <p style="margin:0 0 8px;color:#555;">${c.intro}</p>
            <p style="margin:0 0 24px;color:#555;">${c.intro2}</p>

            <!-- What is Bloomsline -->
            <div style="background:#f8f8f8;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-weight:600;color:#333;font-size:15px;">${c.what}</p>
              <p style="margin:0;color:#666;font-size:14px;">${c.whatDesc}</p>
            </div>

            <!-- Resource shared -->
            <p style="margin:0 0 12px;font-weight:600;color:#333;font-size:15px;">${c.resourceIntro}</p>
            <div style="background:#f8f8f8;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid ${accentColor};">
              <p style="margin:0;font-weight:600;color:#333;font-size:16px;">${resourceTitle}</p>
              <p style="margin:4px 0 0;color:#888;font-size:13px;text-transform:capitalize;">${typeLabel}</p>
            </div>

            <!-- What to expect -->
            <p style="margin:0 0 12px;font-weight:600;color:#333;font-size:15px;">${c.expectTitle}</p>
            <ul style="margin:0 0 24px;padding-left:20px;color:#555;">
              ${c.expectItems.map(item => `<li style="margin-bottom:8px;font-size:14px;line-height:1.5;">${item}</li>`).join('')}
            </ul>

            <!-- Security -->
            <div style="background:#f8f8f8;border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-weight:600;color:#333;font-size:14px;">${c.secure}</p>
              <p style="margin:0;color:#666;font-size:13px;">${c.secureDesc}</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${ctaUrl}" style="display:inline-block;background:#1F2227;color:white;padding:14px 32px;border-radius:28px;text-decoration:none;font-weight:600;font-size:15px;">${c.cta}</a>
            </div>

            <!-- Links -->
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

// ─── MAIN HANDLER ───
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
    const { type, record } = payload

    if (type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { member_id, resource_id, practitioner_id } = record
    if (!member_id || !resource_id) {
      return new Response(JSON.stringify({ message: 'Missing IDs' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch member (include invitation_sent)
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('first_name, last_name, email, user_id, invitation_sent')
      .eq('id', member_id)
      .single()

    if (memberError || !member || !member.email) {
      console.log('Member not found or no email, skipping')
      return new Response(JSON.stringify({ message: 'Skipped' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch resource
    const { data: resource } = await supabase
      .from('resources')
      .select('title, type')
      .eq('id', resource_id)
      .single()

    if (!resource) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch practitioner
    const pid = practitioner_id || record.shared_by
    const { data: practitioner } = await supabase
      .from('users')
      .select('full_name, preferred_language, avatar_url')
      .eq('id', pid)
      .single()

    const practitionerName = practitioner?.full_name || 'Your practitioner'
    const lang = (practitioner?.preferred_language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'
    const memberName = member.first_name || 'there'
    const hasAccount = !!member.user_id
    const isFirstTime = !member.invitation_sent

    const resourceTitle = typeof resource.title === 'string' ? resource.title : 'Resource'
    const ctaUrl = hasAccount
      ? `https://app.bloomsline.com/practitioner?openResourceId=${resource_id}`
      : 'https://app.bloomsline.com/welcome'

    // Choose template based on whether invitation was sent before
    let subject: string
    let html: string

    if (isFirstTime) {
      // First time: welcome + resource combined
      const result = getWelcomeResourceTemplate({
        memberName,
        memberLastName: member.last_name || '',
        practitionerName,
        practitionerAvatarUrl: practitioner?.avatar_url || null,
        resourceTitle,
        resourceType: resource.type || 'psychoeducation',
        ctaUrl,
        lang,
      })
      subject = result.subject
      html = result.html

      // Mark invitation as sent
      await supabase
        .from('members')
        .update({ invitation_sent: true, invitation_sent_at: new Date().toISOString() })
        .eq('id', member_id)

      console.log(`First-time welcome+resource email sent to ${member.email}`)
    } else {
      // Returning user: just the resource
      const result = getResourceTemplate({
        memberName,
        practitionerName,
        resourceTitle,
        resourceType: resource.type || 'psychoeducation',
        resourceId: resource_id,
        ctaUrl,
        lang,
      })
      subject = result.subject
      html = result.html

      console.log(`Resource email sent to ${member.email}`)
    }

    // Send email
    const client = new ServerClient(POSTMARK_API_TOKEN)
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: member.email,
      Subject: subject,
      HtmlBody: html,
      Tag: isFirstTime ? 'member-welcome-resource' : 'resource-shared',
      MessageStream: 'outbound',
    })

    console.log(`Email sent, MessageID: ${response.MessageID}`)

    // Create in-app notification if member has an account
    if (hasAccount && member.user_id) {
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        user_type: 'member',
        type: 'resource_shared',
        title: lang === 'fr'
          ? `${practitionerName} vous a partagé une ressource`
          : `${practitionerName} shared a resource with you`,
        body: resourceTitle,
        metadata: {
          resourceId: resource_id,
          resourceTitle: resource.title,
          resourceType: resource.type,
          practitionerName,
        },
      })
    }

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID, isFirstTime }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
