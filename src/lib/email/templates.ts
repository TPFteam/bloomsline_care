// Email templates for Bloomsline Care

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  line-height: 1.6;
`

const buttonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #4A9A86;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
`

const practitionerButtonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #D4856A;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
`

function wrapInLayout(content: string, isPractitioner = false) {
  const accentColor = isPractitioner ? '#D4856A' : '#4A9A86'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 24px; font-weight: 600; color: ${accentColor};">Bloomsline</span>
            </div>

            <!-- Content -->
            <div style="${baseStyles}">
              ${content}
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
              <p style="margin: 0;">Bloomsline Care</p>
              <p style="margin: 8px 0 0 0;">Supporting your journey to wellness</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Resource shared notification (to client)
export function resourceSharedTemplate({
  clientName,
  practitionerName,
  resourceTitle,
  resourceType,
  message,
  viewUrl,
}: {
  clientName: string
  practitionerName: string
  resourceTitle: string
  resourceType: string
  message?: string
  viewUrl: string
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
      Hi ${clientName},
    </h2>

    <p style="margin: 0 0 24px 0; color: #555;">
      ${practitionerName} has shared a new resource with you.
    </p>

    <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #333;">
        ${resourceTitle}
      </p>
      <p style="margin: 0; font-size: 14px; color: #888;">
        ${resourceType}
      </p>
    </div>

    ${message ? `
      <div style="background-color: #4A9A86; background: linear-gradient(135deg, #4A9A86 0%, #5AB39C 100%); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: white; font-style: italic;">
          "${message}"
        </p>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">
          — ${practitionerName}
        </p>
      </div>
    ` : ''}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${viewUrl}" style="${buttonStyle}">
        View Resource
      </a>
    </div>
  `

  return wrapInLayout(content, false)
}

/**
 * Notifies a practitioner that the Bloomsline team has transferred N
 * resources to their account (admin → admin/resources/transfer flow).
 * Deliberately dry: just count + a CTA to /resources, no admin name,
 * no per-resource list. Triggered from the admin transfer route after
 * the DB update succeeds; failure is logged and ignored.
 */
export function resourcesTransferredTemplate({
  practitionerName,
  count,
  locale,
  viewUrl,
}: {
  practitionerName: string
  count: number
  locale: 'en' | 'fr' | 'es'
  viewUrl: string
}) {
  const copy = {
    en: {
      hi: `Hi ${practitionerName},`,
      body: count === 1
        ? 'The Bloomsline team has transferred 1 resource to your account.'
        : `The Bloomsline team has transferred ${count} resources to your account.`,
      tail: 'You can find them in your library now.',
      cta: 'View resources',
    },
    fr: {
      hi: `Bonjour ${practitionerName},`,
      body: count === 1
        ? 'L\'équipe Bloomsline vient de transférer 1 ressource sur votre compte.'
        : `L'équipe Bloomsline vient de transférer ${count} ressources sur votre compte.`,
      tail: 'Vous les retrouverez dans votre bibliothèque dès maintenant.',
      cta: 'Voir les ressources',
    },
    es: {
      hi: `Hola ${practitionerName},`,
      body: count === 1
        ? 'El equipo de Bloomsline ha transferido 1 recurso a tu cuenta.'
        : `El equipo de Bloomsline ha transferido ${count} recursos a tu cuenta.`,
      tail: 'Ya puedes encontrarlos en tu biblioteca.',
      cta: 'Ver recursos',
    },
  }[locale]

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
      ${copy.hi}
    </h2>

    <p style="margin: 0 0 12px 0; color: #555;">
      ${copy.body}
    </p>

    <p style="margin: 0 0 24px 0; color: #555;">
      ${copy.tail}
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${viewUrl}" style="${buttonStyle}">
        ${copy.cta}
      </a>
    </div>
  `

  return wrapInLayout(content, false)
}

// Welcome email for new clients
export function welcomeClientTemplate({
  clientName,
  practitionerName,
  loginUrl,
}: {
  clientName: string
  practitionerName: string
  loginUrl: string
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
      Welcome to Bloomsline, ${clientName}!
    </h2>

    <p style="margin: 0 0 16px 0; color: #555;">
      ${practitionerName} has invited you to join Bloomsline Care — a space designed to support your journey.
    </p>

    <p style="margin: 0 0 24px 0; color: #555;">
      Here, you can:
    </p>

    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #555;">
      <li style="margin-bottom: 8px;">Access resources shared by your practitioner</li>
      <li style="margin-bottom: 8px;">Track your progress and milestones</li>
      <li style="margin-bottom: 8px;">Capture meaningful moments in your journey</li>
    </ul>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${loginUrl}" style="${buttonStyle}">
        Get Started
      </a>
    </div>
  `

  return wrapInLayout(content, false)
}

// Early access confirmation
export function earlyAccessConfirmationTemplate({
  name,
  type,
}: {
  name: string
  type: 'member' | 'practitioner'
}) {
  const isPractitioner = type === 'practitioner'
  const btnStyle = isPractitioner ? practitionerButtonStyle : buttonStyle

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
      You're on the list, ${name}!
    </h2>

    <p style="margin: 0 0 16px 0; color: #555;">
      Thank you for joining our early access list. We're building something special for ${isPractitioner ? 'practitioners like you' : 'people seeking support on their wellness journey'}.
    </p>

    <p style="margin: 0 0 24px 0; color: #555;">
      We'll be in touch soon with updates and your exclusive early access invitation.
    </p>

    <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #888;">
        In the meantime, follow our journey
      </p>
    </div>
  `

  return wrapInLayout(content, isPractitioner)
}

// Progress update (to practitioner)
export function progressUpdateTemplate({
  practitionerName,
  clientName,
  goalTitle,
  previousStage,
  newStage,
  dashboardUrl,
}: {
  practitionerName: string
  clientName: string
  goalTitle: string
  previousStage: string
  newStage: string
  dashboardUrl: string
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
      Progress Update
    </h2>

    <p style="margin: 0 0 24px 0; color: #555;">
      Hi ${practitionerName}, ${clientName} has made progress!
    </p>

    <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #333;">
        ${goalTitle}
      </p>
      <p style="margin: 0; font-size: 14px; color: #888;">
        Moved from <strong>${previousStage}</strong> → <strong style="color: #4A9A86;">${newStage}</strong>
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${dashboardUrl}" style="${practitionerButtonStyle}">
        View Dashboard
      </a>
    </div>
  `

  return wrapInLayout(content, true)
}

// Early access invitation accepted - You're in!
export function earlyAccessInvitationTemplate({
  name,
  userType,
  signupUrl,
}: {
  name: string
  userType: 'member' | 'practitioner' | 'both'
  signupUrl: string
}) {
  const isPractitioner = userType === 'practitioner' || userType === 'both'

  const roleMessage = userType === 'member'
    ? "a space to nurture your wellbeing"
    : userType === 'practitioner'
    ? "tools to better support the people you care for"
    : "both personal wellbeing tools and practitioner features"

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🌸</div>
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: #333;">
        ${name}, you're in!
      </h1>
      <p style="margin: 0; font-size: 16px; color: #888;">
        Your spot at Bloomsline is ready
      </p>
    </div>

    <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.7;">
      We've been building something special, and we're thrilled you'll be one of the first to experience it.
    </p>

    <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #4A9A86; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        What awaits you
      </p>
      <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
        ${roleMessage}
      </p>
    </div>

    <p style="margin: 0 0 32px 0; color: #555; font-size: 15px; line-height: 1.7;">
      This isn't just another app. It's a gentle space where small steps lead to meaningful change. We can't wait to see you inside.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${signupUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4A9A86 0%, #5AB39C 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(74, 154, 134, 0.4);">
        Create Your Account →
      </a>
    </div>

    <p style="margin: 32px 0 0 0; color: #888; font-size: 14px; text-align: center; font-style: italic;">
      "Every bloom begins with a single step."
    </p>
  `

  return wrapInLayout(content, isPractitioner)
}

// Invite practitioner (sent by a member)
export function invitePractitionerTemplate({
  memberName,
  signupUrl,
}: {
  memberName: string
  signupUrl: string
}) {
  const demoUrl = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

  const content = `
    <h2 style="margin: 0 0 8px 0; font-size: 22px; color: #333; text-align: center;">
      ${memberName} wants to work with you on Bloomsline
    </h2>

    <p style="margin: 0 0 28px 0; color: #888; font-size: 14px; text-align: center;">
      A client of yours is already using Bloomsline Care and would love you to join.
    </p>

    <!-- The problem -->
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #333;">
        Sound familiar?
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
        <li>Clients disengage between sessions and progress stalls</li>
        <li>Homework and exercises get lost or forgotten</li>
        <li>You spend admin time on follow-ups instead of clinical work</li>
        <li>It's hard to see the full picture of a client's journey</li>
      </ul>
    </div>

    <!-- The solution -->
    <div style="background: linear-gradient(135deg, #fdf2f0 0%, #fef7f5 100%); border-radius: 14px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #D4856A;">
        Bloomsline helps you stay connected with clients between sessions
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">📋</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">
            <strong style="color: #333;">Share worksheets & exercises</strong><br>
            Assign therapeutic resources your clients can complete on their own time
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">📊</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">
            <strong style="color: #333;">Track progress & milestones</strong><br>
            See how clients are doing between sessions with real engagement data
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">📖</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">
            <strong style="color: #333;">Therapeutic stories & psychoeducation</strong><br>
            Build and share narrative-based resources tailored to each client
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 12px 8px 0; vertical-align: top; width: 28px; font-size: 18px;">🤝</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">
            <strong style="color: #333;">Strengthen the therapeutic relationship</strong><br>
            Clients feel supported even outside sessions — improving outcomes and retention
          </td>
        </tr>
      </table>
    </div>

    <!-- Social proof -->
    <div style="background-color: #f8f8f8; border-radius: 12px; padding: 16px; margin-bottom: 28px; text-align: center;">
      <p style="margin: 0; color: #555; font-size: 14px; font-style: italic;">
        "Bloomsline bridges the gap between sessions. My clients are more engaged and our work together goes deeper."
      </p>
      <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;">— Early access practitioner</p>
    </div>

    <!-- CTAs -->
    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${demoUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4856A 0%, #c77a5f 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(212, 133, 106, 0.35);">
        Book a Demo
      </a>
    </div>

    <div style="text-align: center; margin-bottom: 8px;">
      <a href="${signupUrl}" style="display: inline-block; padding: 12px 28px; color: #D4856A; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; border: 1px solid #f0d0c4;">
        Explore the Website →
      </a>
    </div>

    <p style="margin: 20px 0 0 0; color: #888; font-size: 13px; text-align: center;">
      Free to get started. No credit card required.
    </p>
  `

  return wrapInLayout(content, true)
}

// Session reminder
export function sessionReminderTemplate({
  clientName,
  practitionerName,
  sessionDate,
  sessionTime,
  calendarUrl,
}: {
  clientName: string
  practitionerName: string
  sessionDate: string
  sessionTime: string
  calendarUrl?: string
}) {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
      Upcoming Session Reminder
    </h2>

    <p style="margin: 0 0 24px 0; color: #555;">
      Hi ${clientName}, just a reminder about your upcoming session with ${practitionerName}.
    </p>

    <div style="background-color: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 24px; font-weight: 600; color: #333;">
        ${sessionDate}
      </p>
      <p style="margin: 0; font-size: 16px; color: #4A9A86;">
        ${sessionTime}
      </p>
    </div>

    ${calendarUrl ? `
      <div style="text-align: center; margin-top: 32px;">
        <a href="${calendarUrl}" style="${buttonStyle}">
          Add to Calendar
        </a>
      </div>
    ` : ''}
  `

  return wrapInLayout(content, false)
}
