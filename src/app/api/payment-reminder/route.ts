import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createAdminClient } from '@/lib/supabase/server-client'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/payment-reminder
 * Send a gentle payment reminder to a patient for an UNPAID session/booking.
 * - Practitioner-authenticated; only their own records.
 * - Reply-To is the practitioner, and the email is signed by them, so it
 *   reads as a personal note (replies go back to the practitioner).
 * - No amount is ever included (by product decision).
 */
export async function POST(request: NextRequest) {
  try {
    // Auth — cookie session or Bearer token (mirrors the notifications routes).
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

    const { table, recordId, locale = 'en', dateLabel, dateLabels, sessionIds } = await request.json() as {
      table: 'sessions' | 'bookings'
      recordId: string
      locale?: 'en' | 'fr' | 'es'
      dateLabel?: string
      /** All of the patient's owed session date+time labels (per-patient remind). */
      dateLabels?: string[]
      /** All owed session ids to stamp as reminded (so the whole patient cools down). */
      sessionIds?: string[]
    }
    if (!recordId || (table !== 'sessions' && table !== 'bookings')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Load the record and confirm it belongs to this practitioner + is unpaid.
    const cols = table === 'sessions'
      ? 'id, practitioner_id, member_id, payment_status, scheduled_at, payment_reminder_sent_at'
      : 'id, practitioner_id, member_id, payment_status, start_time, client_email, client_name, payment_reminder_sent_at'
    const { data: record, error: recErr } = await admin.from(table).select(cols).eq('id', recordId).single()
    if (recErr || !record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if ((record as any).practitioner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if ((record as any).payment_status !== 'unpaid') {
      return NextResponse.json({ error: 'already_paid' }, { status: 409 })
    }
    // Cooldown: one reminder per session/booking per 24h.
    const lastSent = (record as any).payment_reminder_sent_at as string | null
    if (lastSent && Date.now() - new Date(lastSent).getTime() < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'too_soon' }, { status: 429 })
    }

    // Patient email + first name — prefer the member record, fall back to the
    // booking's guest contact fields.
    let patientEmail: string | null = null
    let patientFirstName = ''
    const memberId = (record as any).member_id as string | null
    if (memberId) {
      const { data: member } = await admin.from('members').select('first_name, email').eq('id', memberId).single()
      patientEmail = member?.email || null
      patientFirstName = member?.first_name || ''
    }
    if (!patientEmail && table === 'bookings') {
      patientEmail = (record as any).client_email || null
      patientFirstName = patientFirstName || ((record as any).client_name || '').split(' ')[0] || ''
    }
    if (!patientEmail) {
      return NextResponse.json({ error: 'no_email' }, { status: 422 })
    }

    // Practitioner name + email (for signature + reply-to).
    const { data: pract } = await admin.from('users').select('full_name, email').eq('id', user.id).single()
    const practitionerName = pract?.full_name || (locale === 'fr' ? 'Votre praticien' : locale === 'es' ? 'Su terapeuta' : 'Your practitioner')
    const practitionerEmail = pract?.email || undefined

    // Date/time label — use the client-formatted value (correct timezone);
    // fall back to a server format if absent.
    const when = dateLabel || (() => {
      const raw = (record as any).scheduled_at || (record as any).start_time
      try {
        const loc = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
        return new Date(raw).toLocaleString(loc, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      } catch { return '' }
    })()

    // One or many owed sessions. Multiple → a numbered list in the email.
    const labels = (dateLabels && dateLabels.length ? dateLabels : (when ? [when] : []))
    const multi = labels.length > 1
    const listHtml = labels.map((l, i) => `${i + 1}. ${l}`).join('<br>')
    const loc = locale === 'fr' ? 'fr' : locale === 'es' ? 'es' : 'en'
    const t = multi
      ? {
          fr: {
            subject: `Rappel — règlement de vos séances`,
            body: `Bonjour ${patientFirstName || ''},<br><br>Petit rappel : <strong>${labels.length} séances</strong> sont en attente de règlement :<br><br>${listHtml}<br><br>Vous pouvez les régler à votre convenance.<br><br>Bien à vous,<br>${practitionerName}`,
          },
          es: {
            subject: `Recordatorio — pago de sus sesiones`,
            body: `Hola ${patientFirstName || ''},<br><br>Un recordatorio: <strong>${labels.length} sesiones</strong> están pendientes de pago:<br><br>${listHtml}<br><br>Puede abonarlas cuando le convenga.<br><br>Un saludo,<br>${practitionerName}`,
          },
          en: {
            subject: `Reminder — payment for your sessions`,
            body: `Hi ${patientFirstName || ''},<br><br>A quick reminder: <strong>${labels.length} sessions</strong> are awaiting payment:<br><br>${listHtml}<br><br>You can settle them at your convenience.<br><br>Best,<br>${practitionerName}`,
          },
        }[loc]
      : {
          fr: {
            subject: `Rappel — règlement de votre séance du ${when}`,
            body: `Bonjour ${patientFirstName || ''},<br><br>Petit rappel : le règlement de votre séance du <strong>${when}</strong> est en attente. Vous pouvez le régler à votre convenance.<br><br>Bien à vous,<br>${practitionerName}`,
          },
          es: {
            subject: `Recordatorio — pago de su sesión del ${when}`,
            body: `Hola ${patientFirstName || ''},<br><br>Un recordatorio: el pago de su sesión del <strong>${when}</strong> está pendiente. Puede abonarlo cuando le convenga.<br><br>Un saludo,<br>${practitionerName}`,
          },
          en: {
            subject: `Reminder — payment for your session on ${when}`,
            body: `Hi ${patientFirstName || ''},<br><br>A quick reminder: payment for your session on <strong>${when}</strong> is still pending. You can settle it at your convenience.<br><br>Best,<br>${practitionerName}`,
          },
        }[loc]

    const sentWith = locale === 'fr' ? 'Envoyé avec' : locale === 'es' ? 'Enviado con' : 'Sent with'
    const footer = `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #eef0f2;font-size:12px;color:#9ca3af">${sentWith} <a href="https://bloomsline.com" style="font-weight:600;color:#0d9488;text-decoration:none">Bloomsline</a></div>`
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:520px">${t.body}${footer}</div>`

    const result = await sendEmail({
      to: patientEmail,
      subject: t.subject,
      htmlBody: html,
      replyTo: practitionerEmail,
      tag: 'payment-reminder',
      metadata: { table, recordId, practitionerId: user.id },
    })
    if (!result.success) {
      return NextResponse.json({ error: 'send_failed', detail: result.error }, { status: 502 })
    }
    // Record the send time for the 24h cooldown. For a per-patient reminder
    // (covers several sessions) stamp all of them so the whole patient cools down.
    const stampedAt = new Date().toISOString()
    if (sessionIds && sessionIds.length) {
      await admin.from('sessions').update({ payment_reminder_sent_at: stampedAt }).in('id', sessionIds)
    } else {
      await admin.from(table).update({ payment_reminder_sent_at: stampedAt }).eq('id', recordId)
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('payment-reminder error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
