import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server-client';
import { syncCancelledGoogleEvents } from '@/lib/services/google-calendar-sync';

/**
 * POST /api/calendar/sync-check
 *
 * Checks if any confirmed bookings were cancelled on Google Calendar
 * and cancels them on our side. Called when practitioner opens calendar view.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const cancelledCount = await syncCancelledGoogleEvents(user.id, adminSupabase);

    return NextResponse.json({ cancelledCount });
  } catch (err) {
    console.error('Sync check error:', err);
    return NextResponse.json({ error: 'Sync check failed' }, { status: 500 });
  }
}
