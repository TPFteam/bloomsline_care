import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

/**
 * POST   /api/calendar/dismiss-google-event   { googleEventId }  → 204
 * DELETE /api/calendar/dismiss-google-event   { googleEventId }  → 204
 *
 * POST records a dismissal so the event won't show up again in the
 * orphan-events feed. DELETE removes the dismissal — used by the toast's
 * "Undo" action.
 *
 * Both routes are idempotent: re-dismissing a dismissed event or
 * un-dismissing an absent dismissal both succeed silently.
 */

async function readEventId(request: NextRequest): Promise<string | null> {
  try {
    const body = await request.json()
    const id = body?.googleEventId
    return typeof id === 'string' && id.length > 0 && id.length < 512 ? id : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const googleEventId = await readEventId(request)
  if (!googleEventId) {
    return NextResponse.json({ error: 'googleEventId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // upsert via insert + on-conflict-ignore-equivalent: the unique
  // constraint means re-inserting is a no-op, which is what we want.
  const { error } = await supabase
    .from('dismissed_google_events')
    .insert({ practitioner_id: user.id, google_event_id: googleEventId })

  // 23505 = unique_violation. Treat as success — already dismissed.
  if (error && error.code !== '23505') {
    console.error('[dismiss-google-event] insert failed:', error)
    return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

export async function DELETE(request: NextRequest) {
  const googleEventId = await readEventId(request)
  if (!googleEventId) {
    return NextResponse.json({ error: 'googleEventId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('dismissed_google_events')
    .delete()
    .eq('practitioner_id', user.id)
    .eq('google_event_id', googleEventId)

  if (error) {
    console.error('[dismiss-google-event] delete failed:', error)
    return NextResponse.json({ error: 'Failed to undo' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
