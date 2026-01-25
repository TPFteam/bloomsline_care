'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FeedbackButton } from './feedback-button'
import { createClient } from '@/lib/supabase/browser-client'

// Pages where the feedback button should NOT appear
const excludedPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/early-access',
  '/auth',
  '/onboarding',
  '/practitioner',
  // B2C member pages - help is accessed via settings instead
  '/home',
  '/moments',
  '/progress',
  '/rituals',
  '/balance',
  '/reflection',
  '/seeds',
  '/settings/member',
  '/my-practitioner',
  '/profile/member',
]

export function FeedbackWrapper() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        // Get user profile for name
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', authUser.id)
          .single()

        setUser({
          email: authUser.email || '',
          name: profile?.full_name || authUser.user_metadata?.full_name || '',
        })
      } else {
        setUser(null)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Don't show on excluded paths
  const isExcluded = excludedPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  )

  if (isExcluded || !user) {
    return null
  }

  return <FeedbackButton userEmail={user.email} userName={user.name} />
}
