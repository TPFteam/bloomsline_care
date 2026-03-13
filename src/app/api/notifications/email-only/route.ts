import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server-client'
import { getNotificationContent } from '@/lib/notifications/templates'
import { generateEmailHtml } from '@/lib/notifications/email'
import { sendEmail } from '@/lib/email'
import type { NotificationType } from '@/lib/notifications/types'

/**
 * POST /api/notifications/email-only
 * Send an email notification directly (for members without an account)
 * Does NOT create an in-app notification record
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated (must be a practitioner)
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, email, metadata, locale = 'en', shareToken } = await request.json() as {
      type: NotificationType
      email: string
      metadata: Record<string, unknown>
      locale?: 'en' | 'fr' | 'es'
      shareToken?: string
    }

    if (!type || !email || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get notification content from template
    const content = getNotificationContent(type, metadata, locale)

    let actionUrl: string | undefined
    let actionText: string | undefined
    let bodyExtra = ''

    if (shareToken) {
      // Include a preview link
      actionUrl = `/shared/${shareToken}`
      actionText = locale === 'fr' ? 'Voir la ressource' : locale === 'es' ? 'Ver recurso' : 'Preview Resource'
    } else {
      // No preview link — just a note
      bodyExtra = locale === 'fr'
        ? '<br><br><em style="color: #6b7280;">Créez votre compte sur l\'application Bloomsline Care pour accéder à cette ressource.</em>'
        : locale === 'es'
          ? '<br><br><em style="color: #6b7280;">Cree su cuenta en la aplicación Bloomsline Care para acceder a este recurso.</em>'
          : '<br><br><em style="color: #6b7280;">Create your account on the Bloomsline Care app to access this resource.</em>'
    }

    const htmlBody = generateEmailHtml({
      subject: content.emailSubject,
      body: content.body + bodyExtra,
      actionUrl,
      actionText,
    })

    await sendEmail({
      to: email,
      subject: content.emailSubject,
      htmlBody,
      tag: type,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email-only notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
