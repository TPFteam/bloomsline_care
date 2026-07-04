import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server-client'

// Resolve the logged-in practitioner from the *main* project session. Used by
// the videos/reviews routes to stamp practitioner_id server-side before writing
// to the admin project — the client never supplies its own id.
export async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const response = NextResponse.next()
  const supabase = createRouteHandlerClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
