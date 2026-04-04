'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

// Pages that don't require auth
const PUBLIC_PATHS = [
  '/', '/sign-in', '/sign-up', '/auth', '/privacy', '/terms', '/security',
  '/data-protection', '/practitioner', '/shared', '/p/',
]

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const [showExpired, setShowExpired] = useState(false)
  const [wasAuthenticated, setWasAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isPublicPage = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  useEffect(() => {
    const supabase = createClient()

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setWasAuthenticated(true)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setWasAuthenticated(true)
        setShowExpired(false)
      }

      if (event === 'SIGNED_OUT' && wasAuthenticated && !isPublicPage) {
        setShowExpired(true)
      }
    })

    // Periodic session check (every 60 seconds)
    const interval = setInterval(async () => {
      if (!wasAuthenticated || isPublicPage) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Try to refresh
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        if (!refreshed) {
          setShowExpired(true)
        }
      }
    }, 60000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [wasAuthenticated, isPublicPage])

  const handleSignIn = () => {
    setShowExpired(false)
    router.push('/sign-in')
  }

  return (
    <>
      {children}
      {showExpired && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Session expirée
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Votre session a expiré. Veuillez vous reconnecter pour continuer. Les modifications non enregistrées peuvent être perdues.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Se reconnecter
            </button>
          </div>
        </div>
      )}
    </>
  )
}
