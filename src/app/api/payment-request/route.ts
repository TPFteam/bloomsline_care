import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server-client'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/payment-request
 * Sent automatically when a practitioner closes a session as "Awaiting payment".
 * Emails the client a short thank-you + the practitioner's payment link so they
 * can pay. ONLY fires when the practitioner has a payment_url configured —
 * otherwise there's nothing to pay, so we skip silently.
 *
 * Our own (Postmark) email, reply-to the practitioner — same channel as the
 * manual payment reminder. No amount is included (product decision).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    let { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const admin = createAdminClient()
        const { data } = await admin.auth.getUser(authHeader.substring(7))
        user = data.user
      }
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bookingId, locale = 'en', dateLabel } = await request.json() as {
      bookingId: string
      locale?: 'en' | 'fr' | 'es'
      dateLabel?: string
    }
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('id, practitioner_id, member_id, payment_status, start_time, client_email, client_name, payment_reminder_sent_at, session_type')
      .eq('id', bookingId)
      .single()
    if (bErr || !booking) { console.warn('[payment-request] booking not found', { bookingId, bErr: bErr?.message }); return NextResponse.json({ error: 'Not found' }, { status: 404 }) }
    if (booking.practitioner_id !== user.id) { console.warn('[payment-request] forbidden', { bookingId }); return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    if (booking.payment_status !== 'unpaid') { console.warn('[payment-request] not awaiting payment', { bookingId, payment_status: booking.payment_status }); return NextResponse.json({ error: 'not_awaiting_payment' }, { status: 409 }) }

    // The payment link now lives on the session type. Use the one for THIS
    // booking's session type; skip silently if that type has no link.
    const { data: settings } = await admin
      .from('booking_settings')
      .select('session_types')
      .eq('user_id', user.id)
      .maybeSingle()
    const sessionTypes = (settings?.session_types as Array<{ id: string; payment_url?: string | null }>) || []
    const matchedType = sessionTypes.find((t) => t.id === booking.session_type)
    const paymentUrl = (matchedType?.payment_url || '').trim()
    if (!paymentUrl) { console.warn('[payment-request] skipped: no payment link for session type', { bookingId, sessionType: booking.session_type }); return NextResponse.json({ skipped: 'no_payment_link' }) }

    // Client email + first name — prefer the member record, fall back to guest.
    let patientEmail: string | null = null
    let patientFirstName = ''
    if (booking.member_id) {
      const { data: member } = await admin.from('members').select('first_name, email').eq('id', booking.member_id).single()
      patientEmail = member?.email || null
      patientFirstName = member?.first_name || ''
    }
    if (!patientEmail) {
      patientEmail = booking.client_email || null
      patientFirstName = patientFirstName || (booking.client_name || '').split(' ')[0] || ''
    }
    if (!patientEmail) return NextResponse.json({ error: 'no_email' }, { status: 422 })

    const { data: pract } = await admin.from('users').select('full_name, email').eq('id', user.id).single()
    const practitionerName = pract?.full_name || (locale === 'fr' ? 'Votre praticien' : locale === 'es' ? 'Su terapeuta' : 'Your practitioner')
    const practitionerEmail = pract?.email || undefined

    const when = dateLabel || (() => {
      try {
        const loc = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
        return new Date(booking.start_time).toLocaleString(loc, { day: 'numeric', month: 'long' })
      } catch { return '' }
    })()

    // Warm, minimal, not pushy — but with a clear way to pay.
    const messages = {
      fr: 'Merci pour votre séance. Quand cela vous convient, vous pouvez régler via le lien ci-dessous.',
      es: 'Gracias por su sesión. Cuando le venga bien, puede realizar el pago con el enlace de abajo.',
      en: 'Thank you for the session. Whenever it suits you, you can settle the payment using the link below.',
    }
    const loc = locale === 'fr' ? 'fr' : locale === 'es' ? 'es' : 'en'
    const message = messages[loc]
    const subject = loc === 'fr' ? 'Merci pour votre séance' : loc === 'es' ? 'Gracias por su sesión' : 'Thank you for your session'
    const hi = patientFirstName
      ? (loc === 'fr' ? `Bonjour ${patientFirstName},` : loc === 'es' ? `Hola ${patientFirstName},` : `Hi ${patientFirstName},`)
      : (loc === 'fr' ? 'Bonjour,' : loc === 'es' ? 'Hola,' : 'Hi,')
    const payLabel = loc === 'fr' ? 'Payer la séance' : loc === 'es' ? 'Pagar la sesión' : 'Pay for the session'
    const sessionLine = when ? `<span style="color:#6b7280">${loc === 'fr' ? 'Séance du' : loc === 'es' ? 'Sesión del' : 'Session on'} ${when}</span><br><br>` : ''
    const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

    const button = `<a href="${paymentUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:10px">${payLabel}</a>`
    const sentWith = loc === 'fr' ? 'Envoyé avec' : loc === 'es' ? 'Enviado con' : 'Sent with'
    const footer = `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #eef0f2;font-size:12px;color:#9ca3af">${sentWith} <a href="https://bloomsline.com" style="font-weight:600;color:#0d9488;text-decoration:none">Bloomsline</a></div>`
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:520px">${hi}<br><br>${sessionLine}${safeMessage}<br><br>${button}<br><br>${loc === 'fr' ? 'Bien à vous,' : loc === 'es' ? 'Un saludo,' : 'Best,'}<br>${practitionerName}${footer}</div>`

    const result = await sendEmail({
      to: patientEmail,
      subject,
      htmlBody: html,
      replyTo: practitionerEmail,
      tag: 'payment-request',
      metadata: { bookingId: booking.id, practitionerId: user.id },
    })
    if (!result.success) return NextResponse.json({ error: 'send_failed', detail: result.error }, { status: 502 })

    // Stamp the cooldown so the manual reminder doesn't double-fire right after.
    await admin.from('bookings').update({ payment_reminder_sent_at: new Date().toISOString() }).eq('id', booking.id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('payment-request error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
