// ============================================
// Email Service (Resend)
// ============================================

import type { NotificationType } from './types'

interface SendEmailParams {
  to: string
  subject: string
  body: string
  actionUrl?: string
  actionText?: string
  preheader?: string
}

interface EmailTemplate {
  subject: string
  body: string
  actionUrl?: string
  actionText?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, body, actionUrl, actionText, preheader } = params

  // Check if Resend is configured
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('Resend API key not configured, skipping email')
    return false
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@bloomsline.care'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html: generateEmailHtml({ subject, body, actionUrl, actionText, preheader }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Generate HTML email template — clean, modern design
 */
export function generateEmailHtml(params: {
  subject: string
  body: string
  actionUrl?: string
  actionText?: string
  preheader?: string
  practitionerName?: string
  practitionerAvatar?: string
  recipientName?: string
}): string {
  const { subject, body, actionUrl, actionText, preheader, practitionerName, practitionerAvatar, recipientName } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bloomsline.com'

  const buttonHtml = actionUrl
    ? `
      <tr>
        <td style="padding: 28px 0 8px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color: #0D9488; border-radius: 28px;">
                <a href="${actionUrl.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`}"
                   style="display: inline-block; color: #ffffff; padding: 14px 32px;
                          text-decoration: none; font-weight: 600; font-size: 14px;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          letter-spacing: 0.3px;">
                  ${actionText || 'View'}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : ''

  const practitionerHtml = practitionerName
    ? `
      <tr>
        <td style="padding: 0 0 24px; text-align: center;">
          ${practitionerAvatar
            ? `<img src="${practitionerAvatar}" alt="" width="56" height="56" style="border-radius: 50%; display: block; margin: 0 auto 12px; object-fit: cover;" />`
            : `<div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0D9488, #14B8A6); margin: 0 auto 12px; line-height: 56px; text-align: center; color: white; font-size: 22px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">${practitionerName.charAt(0).toUpperCase()}</div>`
          }
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${practitionerName}</p>
        </td>
      </tr>
    `
    : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<span style="display:none;font-size:1px;color:#FAF9F7;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FAF9F7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width: 520px; margin: 0 auto;">

          <!-- Logo -->
          <tr>
            <td style="padding: 0 0 32px; text-align: center;">
              <p style="margin: 0; font-size: 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="font-weight: 700; color: #1F2937;">blooms</span><span style="font-weight: 700; color: #0D9488;">line</span>
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">

                <!-- Accent line -->
                <tr>
                  <td style="height: 3px; background: linear-gradient(90deg, #0D9488, #14B8A6, #5EEAD4);"></td>
                </tr>

                <!-- Card content -->
                <tr>
                  <td style="padding: 36px 36px 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">

                      <!-- Practitioner -->
                      ${practitionerHtml}

                      <!-- Greeting -->
                      ${recipientName ? `
                      <tr>
                        <td style="color: #1F2937; font-size: 16px; font-weight: 600; padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          Hi ${recipientName.split(' ')[0]},
                        </td>
                      </tr>
                      ` : ''}

                      <!-- Body -->
                      <tr>
                        <td style="color: #4B5563; font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          ${body.replace(/\n/g, '<br>')}
                        </td>
                      </tr>

                      <!-- Button -->
                      ${buttonHtml}

                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                bloomsline.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Get email template content for a notification type
 */
export function getEmailContent(
  type: NotificationType,
  _metadata: Record<string, unknown>,
  locale: 'en' | 'fr' | 'es' = 'en'
): EmailTemplate {
  // Map notification types to email-specific content
  const actionTexts: Record<string, { en: string; fr: string; es: string }> = {
    resource_shared: { en: 'View Resource', fr: 'Voir la ressource', es: 'Ver recurso' },
    resource_assigned: { en: 'Start Now', fr: 'Commencer', es: 'Comenzar ahora' },
    assignment_due_soon: { en: 'Complete Now', fr: 'Compléter', es: 'Completar ahora' },
    session_scheduled: { en: 'View Session', fr: 'Voir la session', es: 'Ver sesión' },
    booking_confirmed: { en: 'View Booking', fr: 'Voir la réservation', es: 'Ver reserva' },
    resource_submitted: { en: 'Review Submission', fr: 'Voir la soumission', es: 'Revisar envío' },
    story_shared: { en: 'Read Story', fr: 'Lire l\'histoire', es: 'Leer historia' },
    story_comment: { en: 'View Comment', fr: 'Voir le commentaire', es: 'Ver comentario' },
    moment_shared: { en: 'View Moment', fr: 'Voir le moment', es: 'Ver momento' },
    moment_comment: { en: 'View Comment', fr: 'Voir le commentaire', es: 'Ver comentario' },
    booking_request: { en: 'Review Request', fr: 'Voir la demande', es: 'Revisar solicitud' },
    reschedule_requested: { en: 'Respond', fr: 'Répondre', es: 'Responder' },
  }

  return {
    subject: '', // Will be filled by caller
    body: '', // Will be filled by caller
    actionText: actionTexts[type]?.[locale] || (locale === 'fr' ? 'Voir' : locale === 'es' ? 'Ver' : 'View'),
  }
}

/**
 * Process pending email deliveries (called by cron job)
 */
export async function processPendingEmails(_supabase: unknown): Promise<number> {
  // This would be called by a cron job to process the delivery queue
  // For now, emails are sent immediately when notification is created
  // This function can be used for retry logic and batch processing
  return 0
}
