'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/browser-client'

/**
 * Identifies the logged-in user with PostHog.
 * Place inside PostHogProvider in the app layout.
 * Runs once per session — fetches user + profile and calls posthog.identify().
 */
export function PostHogIdentify() {
  const identified = useRef(false)

  useEffect(() => {
    if (identified.current) return

    const identify = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch practitioner profile for extra properties
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, user_type, email, preferred_language')
          .eq('id', user.id)
          .single()

        // Count members for this practitioner
        const { count: memberCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('practitioner_id', user.id)

        identified.current = true

        posthog.identify(user.id, {
          email: user.email,
          name: profile?.full_name || undefined,
          user_type: profile?.user_type || 'unknown',
          language: profile?.preferred_language || 'en',
          member_count: memberCount || 0,
          signup_provider: user.app_metadata?.provider || 'email',
          created_at: user.created_at,
        })
      } catch (e) {
        // Silent fail — don't break the app for analytics
      }
    }

    // Small delay to not block initial render
    const timeout = setTimeout(identify, 1500)
    return () => clearTimeout(timeout)
  }, [])

  return null
}
