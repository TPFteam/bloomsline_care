import * as postmark from 'postmark'

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'team@theproductfirst.com'
const FROM_NAME = process.env.POSTMARK_FROM_NAME || 'Bloomsline Care'

// Lazy initialize Postmark client
let client: postmark.ServerClient | null = null

function getClient() {
  if (!process.env.POSTMARK_API_TOKEN) {
    return null
  }
  if (!client) {
    client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN)
  }
  return client
}

export interface SendEmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  tag?: string
  metadata?: Record<string, string>
  attachments?: Array<{ Name: string; Content: string; ContentType: string }>
}

export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  tag,
  metadata,
  attachments,
}: SendEmailOptions) {
  const postmarkClient = getClient()

  if (!postmarkClient) {
    console.warn('POSTMARK_API_TOKEN not set, skipping email send')
    return { success: false, error: 'API token not configured' }
  }

  try {
    const response = await postmarkClient.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody || htmlBody.replace(/<[^>]*>/g, ''),
      Tag: tag,
      Metadata: metadata,
      MessageStream: 'outbound',
      Attachments: attachments?.map(a => ({ ...a, ContentID: null as unknown as string })),
    })

    return { success: true, messageId: response.MessageID }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: String(error) }
  }
}

// Batch send for multiple recipients
export async function sendBatchEmails(
  emails: SendEmailOptions[]
) {
  const postmarkClient = getClient()

  if (!postmarkClient) {
    console.warn('POSTMARK_API_TOKEN not set, skipping batch email send')
    return { success: false, error: 'API token not configured' }
  }

  try {
    const messages = emails.map((email) => ({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: email.to,
      Subject: email.subject,
      HtmlBody: email.htmlBody,
      TextBody: email.textBody || email.htmlBody.replace(/<[^>]*>/g, ''),
      Tag: email.tag,
      Metadata: email.metadata,
      MessageStream: 'outbound' as const,
    }))

    const response = await postmarkClient.sendEmailBatch(messages)
    return { success: true, results: response }
  } catch (error) {
    console.error('Failed to send batch emails:', error)
    return { success: false, error: String(error) }
  }
}
