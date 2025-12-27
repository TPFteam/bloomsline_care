import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'
import { buildBloomContext, getContextAwareGreeting, type EntryPoint } from '@/lib/bloom/context'
import { detectAndStorePatterns } from '@/lib/bloom/patterns'

// Track last pattern detection per user (in-memory, resets on deploy)
const lastPatternDetection = new Map<string, number>()
const PATTERN_DETECTION_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale = 'en', entryPoint = 'general' } = body as {
      locale?: 'en' | 'fr'
      entryPoint?: EntryPoint
    }

    const supabase = createAdminClient()

    // Get user from auth header (optional - greeting works without auth too)
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    // If we have a user, build context-aware greeting
    if (userId) {
      const context = await buildBloomContext(supabase, userId, entryPoint)
      const greeting = getContextAwareGreeting(context, locale)

      // Trigger pattern detection in background if needed (non-blocking)
      triggerPatternDetectionIfNeeded(supabase, userId)

      return NextResponse.json({ greeting })
    }

    // Fallback greeting without user context
    const hour = new Date().getHours()
    const timeGreeting = locale === 'fr'
      ? (hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir')
      : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')

    const greeting = locale === 'fr'
      ? `${timeGreeting}. Comment vas-tu ?`
      : `${timeGreeting}. How are you?`

    return NextResponse.json({ greeting })
  } catch (error) {
    console.error('Greeting error:', error)

    // Return simple fallback on error
    const greeting = 'Hey. How are you?'
    return NextResponse.json({ greeting })
  }
}

/**
 * Trigger pattern detection in background if not run recently
 * This is fire-and-forget, doesn't block the greeting response
 */
async function triggerPatternDetectionIfNeeded(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<void> {
  const now = Date.now()
  const lastRun = lastPatternDetection.get(userId)

  // Skip if run recently
  if (lastRun && now - lastRun < PATTERN_DETECTION_INTERVAL) {
    return
  }

  // Mark as running now (even if it fails, we don't want to retry immediately)
  lastPatternDetection.set(userId, now)

  // Run in background
  try {
    // Get member_id
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (member) {
      await detectAndStorePatterns(supabase, userId, member.id)
      console.log(`Pattern detection completed for user ${userId}`)
    }
  } catch (error) {
    console.error('Background pattern detection error:', error)
    // Don't throw - this is background work
  }
}
