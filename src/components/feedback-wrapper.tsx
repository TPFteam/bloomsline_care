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
]

export function FeedbackWrapper() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  // Listen for the trigger from AppHeader's help button. We keep the
  // modal mounted globally (it has shared submission state) and just
  // toggle visibility via this window event, so any page with the
  // header can open it without prop-drilling.
  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('bloomsline:open-feedback', handler)
    return () => window.removeEventListener('bloomsline:open-feedback', handler)
  }, [])

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

  return (
    <FeedbackButton
      userEmail={user.email}
      userName={user.name}
      showFloatingButton={false}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  )
}
