import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ServerClient } from 'npm:postmark@3.0.19'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email template
function getTemplate(params: {
  memberName: string
  practitionerName: string
  resourceTitle: string
  resourceType: string
  previewUrl?: string
  hasAccount: boolean
  lang: 'en' | 'fr'
}) {
  const { memberName, practitionerName, resourceTitle, resourceType, previewUrl, hasAccount, lang } = params
  const accentColor = '#4A9A86'

  const typeLabels: Record<string, { en: string; fr: string }> = {
    worksheet: { en: 'worksheet', fr: 'fiche de travail' },
    exercise: { en: 'exercise', fr: 'exercice' },
    psychoeducation: { en: 'resource', fr: 'ressource' },
    assessment: { en: 'assessment', fr: 'évaluation' },
  }
  const typeLabel = typeLabels[resourceType]?.[lang] || (lang === 'fr' ? 'ressource' : 'resource')

  const content = lang === 'fr' ? {
    subject: `${practitionerName} vous a partagé une ${typeLabel}`,
    greeting: `Bonjour ${memberName},`,
    intro: `${practitionerName} vous a partagé une nouvelle ${typeLabel} sur Bloomsline :`,
    resourceLabel: resourceTitle,
    cta: hasAccount ? 'Ouvrir dans l\'application' : 'Voir la ressource',
    ctaNote: hasAccount
      ? 'Ouvrez l\'application Bloomsline pour accéder à cette ressource.'
      : 'Cliquez ci-dessous pour voir cette ressource.',
    noAccountNote: 'Créez votre compte sur l\'application Bloomsline pour accéder à toutes vos ressources et suivre votre parcours.',
    questions: `Si vous avez des questions, n'hésitez pas à contacter ${practitionerName}.`,
    footer: 'Bloomsline Care',
    footerSub: 'Accompagner votre parcours vers le bien-être',
  } : {
    subject: `${practitionerName} shared a ${typeLabel} with you`,
    greeting: `Hi ${memberName},`,
    intro: `${practitionerName} shared a new ${typeLabel} with you on Bloomsline:`,
    resourceLabel: resourceTitle,
    cta: hasAccount ? 'Open in App' : 'View Resource',
    ctaNote: hasAccount
      ? 'Open the Bloomsline app to access this resource.'
      : 'Click below to view this resource.',
    noAccountNote: 'Create your account on the Bloomsline app to access all your resources and track your journey.',
    questions: `If you have any questions, feel free to reach out to ${practitionerName}.`,
    footer: 'Bloomsline Care',
    footerSub: 'Supporting your journey to wellness',
  }

  const ctaUrl = hasAccount
    ? 'https://app.bloomsline.com'
    : (previewUrl || 'https://app.bloomsline.com')

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
              <span style="font-size: 24px; font-weight: 600; color: ${accentColor};">Bloomsline</span>
            </div>

            <!-- Content -->
            <div style="color: #333; line-height: 1.6;">
              <p style="margin: 0 0 16px 0; color: #333; font-weight: 500;">
                ${content.greeting}
              </p>

              <p style="margin: 0 0 16px 0; color: #555;">
                ${content.intro}
              </p>

              <!-- Resource card -->
              <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${accentColor};">
                <p style="margin: 0; font-weight: 600; color: #333; font-size: 16px;">
                  ${content.resourceLabel}
                </p>
              </div>

              <!-- CTA -->
              <p style="margin: 0 0 16px 0; color: #555; text-align: center;">
                ${content.ctaNote}
              </p>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${ctaUrl}" style="display: inline-block; background-color: ${accentColor}; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  ${content.cta}
                </a>
              </div>

              ${!hasAccount ? `
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  ${content.noAccountNote}
                </p>
              </div>
              ` : ''}

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://bloomsline.com'

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

    // Parse webhook payload
    const payload = await req.json()
    const { type, record } = payload

    if (type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Ignored non-INSERT event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { member_id, resource_id, practitioner_id } = record

    if (!member_id || !resource_id) {
      return new Response(
        JSON.stringify({ message: 'Missing member_id or resource_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('first_name, last_name, email, user_id')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      console.error('Error fetching member:', memberError)
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!member.email) {
      console.log(`Member ${member_id} has no email, skipping`)
      return new Response(
        JSON.stringify({ message: 'Member has no email, skipping' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('title, type')
      .eq('id', resource_id)
      .single()

    if (resourceError || !resource) {
      console.error('Error fetching resource:', resourceError)
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch practitioner
    const pid = practitioner_id || record.shared_by
    const { data: practitioner } = await supabase
      .from('users')
      .select('full_name, preferred_language')
      .eq('id', pid)
      .single()

    const practitionerName = practitioner?.full_name || 'Your practitioner'
    const lang = (practitioner?.preferred_language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'
    const memberName = member.first_name || 'there'
    const hasAccount = !!member.user_id

    // Create share token for members without an account
    let previewUrl: string | undefined
    if (!hasAccount) {
      const { data: tokenData } = await supabase
        .from('resource_share_tokens')
        .insert({
          resource_id,
          member_id,
          practitioner_id: pid,
          member_email: member.email,
        })
        .select('token')
        .single()

      if (tokenData?.token) {
        previewUrl = `${SITE_URL}/shared/${tokenData.token}`
      }
    }

    // Generate email
    const { subject, html } = getTemplate({
      memberName,
      practitionerName,
      resourceTitle: typeof resource.title === 'string' ? resource.title : 'Resource',
      resourceType: resource.type || 'psychoeducation',
      previewUrl,
      hasAccount,
      lang,
    })

    // Send email
    const client = new ServerClient(POSTMARK_API_TOKEN)
    const response = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: member.email,
      Subject: subject,
      HtmlBody: html,
      Tag: 'resource-shared',
      MessageStream: 'outbound',
    })

    console.log(`Resource shared email sent to ${member.email} (resource: ${resource.title}, by: ${practitionerName}), MessageID: ${response.MessageID}`)

    // Also create in-app notification if member has an account
    if (hasAccount && member.user_id) {
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        user_type: 'member',
        type: 'resource_shared',
        title: lang === 'fr'
          ? `${practitionerName} vous a partagé une ressource`
          : `${practitionerName} shared a resource with you`,
        body: typeof resource.title === 'string' ? resource.title : 'Resource',
        metadata: {
          resourceId: resource_id,
          resourceTitle: resource.title,
          resourceType: resource.type,
          practitionerName,
        },
      })
    }

    return new Response(
      JSON.stringify({ success: true, messageId: response.MessageID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending resource shared email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
