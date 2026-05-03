'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, Clock } from 'lucide-react'

// Pages that don't require auth
const PUBLIC_PATHS = [
  '/', '/sign-in', '/sign-up', '/auth', '/privacy', '/terms', '/security',
  '/data-protection', '/practitioner', '/shared', '/p/', '/notification-flows',
]

const TIMEOUT_MS = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS || '3600000') // 1 hour
const WARNING_MS = parseInt(process.env.NEXT_PUBLIC_SESSION_WARNING_MS || '120000') // 2 min

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const [showExpired, setShowExpired] = useState(false)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [wasAuthenticated, setWasAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const lastActivityRef = useRef(Date.now())
  const debounceRef = useRef(false)

  const isPublicPage = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  const resetActivity = useCallback(() => {
    if (debounceRef.current) return
    debounceRef.current = true
    lastActivityRef.current = Date.now()
    setTimeout(() => { debounceRef.current = false }, 1000)
  }, [])

  // Inactivity detection — event listeners
  useEffect(() => {
    if (!wasAuthenticated || isPublicPage) return

    const events = ['click', 'keydown', 'scroll', 'touchstart', 'mousemove']
    events.forEach(e => document.addEventListener(e, resetActivity, { passive: true }))

    return () => {
      events.forEach(e => document.removeEventListener(e, resetActivity))
    }
  }, [wasAuthenticated, isPublicPage, resetActivity])

  // Inactivity timer — check every 30s
  useEffect(() => {
    if (!wasAuthenticated || isPublicPage) return

    const supabase = createClient()
    const timer = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= TIMEOUT_MS) {
        setShowInactivityWarning(false)
        supabase.auth.signOut()
        setShowExpired(true)
      } else if (idle >= TIMEOUT_MS - WARNING_MS) {
        setShowInactivityWarning(true)
      } else {
        setShowInactivityWarning(false)
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [wasAuthenticated, isPublicPage])

  useEffect(() => {
    const supabase = createClient()

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setWasAuthenticated(true)
        lastActivityRef.current = Date.now()
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setWasAuthenticated(true)
        setShowExpired(false)
        setShowInactivityWarning(false)
        lastActivityRef.current = Date.now()
      }

      if (event === 'SIGNED_OUT' && wasAuthenticated && !isPublicPage) {
        setShowExpired(true)
      }
    })

    // Periodic session check (every 60 seconds) — independent of inactivity
    const interval = setInterval(async () => {
      if (!wasAuthenticated || isPublicPage) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
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

  const handleStaySignedIn = () => {
    lastActivityRef.current = Date.now()
    setShowInactivityWarning(false)
  }

  return (
    <>
      {children}

      {/* Inactivity warning — 2 min before timeout */}
      {showInactivityWarning && !showExpired && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Êtes-vous toujours là ?
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Votre session va expirer dans 2 minutes par mesure de sécurité. Cliquez ci-dessous pour rester connecté(e).
            </p>
            <button
              onClick={handleStaySignedIn}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Rester connecté(e)
            </button>
          </div>
        </div>
      )}

      {/* Session expired */}
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
