import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server-client'
import { notifyBookingSms, type BookingSmsKind } from '@/lib/notifications/sms'

// Fires a booking SMS for client-side creation paths (the schedule modal inserts
// bookings directly, bypassing the public /api/bookings route). Self-gated:
// notifyBookingSms only sends when the practitioner's toggle is on, a usable
// mobile exists, and Bird is configured. Never throws.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({} as { kind?: string }))
    const kind: BookingSmsKind = ['confirmed', 'rescheduled', 'cancelled'].includes(body?.kind || '')
      ? (body.kind as BookingSmsKind)
      : 'confirmed'

    // Only the booking's practitioner may trigger it.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: booking } = await admin
      .from('bookings')
      .select('id, practitioner_id, member_id, client_phone, start_time, timezone, status')
      .eq('id', id)
      .maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (booking.practitioner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await notifyBookingSms(admin, { practitionerId: booking.practitioner_id, booking, kind })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[notify-sms] error:', e)
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 200 })
  }
}
