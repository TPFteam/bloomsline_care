'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLanguage } from '@/lib/i18n/context'

function SignUpContent() {
  const { locale } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'azure' | null>(null)
  const [supabase] = useState(() => createClient())

  const [showDialog, setShowDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')

  useEffect(() => {
    const error = searchParams.get('error')
    const info = searchParams.get('info')

    if (error) {
      toast.error(decodeURIComponent(error))
    }

    if (info) {
      const message = decodeURIComponent(info)
      setDialogMessage(message)
      setShowDialog(true)
    }
  }, [searchParams])

  const handleGoogleSignUp = async () => {
    try {
      setLoadingProvider('google')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=signup`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setLoadingProvider(null)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setLoadingProvider(null)
    }
  }

  const handleAzureSignUp = async () => {
    try {
      setLoadingProvider('azure')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=signup`,
          scopes: 'openid profile email',
        },
      })

      if (error) {
        toast.error(error.message)
        setLoadingProvider(null)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Soft gradient background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-teal-100/40 via-emerald-50/30 to-cyan-100/40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="md" showText />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Accueil' : 'Home'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Welcome text */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-3">
              {locale === 'fr' ? 'Commencez ici' : 'Start here'}
            </h1>
            <p className="text-neutral-500">
              {locale === 'fr'
                ? 'Créez votre compte en quelques secondes.'
                : 'Create your account in seconds.'}
            </p>
          </div>

          {/* Minimal card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-neutral-200/50 shadow-sm">
            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignUp}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingProvider === 'google' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {locale === 'fr' ? 'Continuer avec Google' : 'Continue with Google'}
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-neutral-400">{locale === 'fr' ? 'ou' : 'or'}</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* Outlook Sign Up */}
            <button
              onClick={handleAzureSignUp}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-neutral-900 border border-neutral-200 rounded-full font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingProvider === 'azure' ? (
                <span className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  {locale === 'fr' ? 'Continuer avec Outlook' : 'Continue with Outlook'}
                </>
              )}
            </button>

            {/* Sign in link */}
            <p className="text-center text-neutral-500 mt-6 text-sm">
              {locale === 'fr' ? 'Déjà un compte ?' : 'Already have an account?'}{' '}
              <Link href="/sign-in" className="text-teal-600 hover:text-teal-700 font-medium">
                {locale === 'fr' ? 'Se connecter' : 'Sign in'}
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-neutral-400 mt-6">
            {locale === 'fr' ? 'En continuant, vous acceptez nos' : 'By continuing, you agree to our'}{' '}
            <Link href="/terms" className="text-neutral-500 hover:text-neutral-700">
              {locale === 'fr' ? 'Conditions' : 'Terms'}
            </Link>{' '}
            {locale === 'fr' ? 'et' : 'and'}{' '}
            <Link href="/privacy" className="text-neutral-500 hover:text-neutral-700">
              {locale === 'fr' ? 'Confidentialité' : 'Privacy'}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Info Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'fr' ? 'Compte non trouvé' : 'Account Not Found'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/')} className="rounded-xl">
              {locale === 'fr' ? 'Accueil' : 'Go to Home'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setShowDialog(false)}
              className="rounded-xl bg-neutral-900 hover:bg-neutral-800"
            >
              {locale === 'fr' ? "S'inscrire" : 'Sign Up'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
