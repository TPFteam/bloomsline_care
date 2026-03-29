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
 * Generate HTML email template
 */
export function generateEmailHtml(params: {
  subject: string
  body: string
  actionUrl?: string
  actionText?: string
  preheader?: string
}): string {
  const { subject, body, actionUrl, actionText, preheader } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bloomsline.care'

  const buttonHtml = actionUrl
    ? `
      <tr>
        <td style="padding: 24px 0;">
          <a href="${actionUrl.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`}"
             style="display: inline-block; background: linear-gradient(135deg, #10B981, #14B8A6);
                    color: white; padding: 14px 28px; border-radius: 12px;
                    text-decoration: none; font-weight: 600; font-size: 15px;">
            ${actionText || 'View'}
          </a>
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
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { background-color: #f4f4f5; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #10B981, #14B8A6); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px; }
    .footer { padding: 24px 32px; background: #f9fafb; text-align: center; }
    .footer p { color: #6b7280; font-size: 13px; margin: 0; }
    .footer a { color: #10B981; text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      .wrapper { background-color: #1a1a1c !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}

  <div class="wrapper">
    <table class="container" cellpadding="0" cellspacing="0" width="100%">
      <!-- Header -->
      <tr>
        <td class="header">
          <h1>Bloomsline Care</h1>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td class="content">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #374151; font-size: 15px; line-height: 1.7;">
                ${body.replace(/\n/g, '<br>')}
              </td>
            </tr>
            ${buttonHtml}
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer">
          <p>
            You received this email because you have an account with Bloomsline Care.<br>
            <a href="${appUrl}/settings">Manage notification preferences</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
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
