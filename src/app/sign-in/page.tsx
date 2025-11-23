'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

function SignInContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?flow=signin`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50 relative overflow-hidden">
      {/* Cinematic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender-100/30 via-peach-50/20 to-mint-100/30"></div>

      {/* Large organic blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-lavender-200/40 to-lavender-300/40 rounded-full mix-blend-multiply filter blur-[160px] animate-blob"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-peach-200/30 to-coral-200/30 rounded-full mix-blend-multiply filter blur-[140px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-br from-mint-200/30 to-mint-300/30 rounded-full mix-blend-multiply filter blur-[180px] animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-lavender-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-semibold text-foreground">Bloomsline</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span suppressHydrationWarning>{t.nav.home}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="min-h-screen grid lg:grid-cols-2 relative z-10">
        {/* Left Side - Welcome Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-center px-12 xl:px-20"
        >
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4" suppressHydrationWarning>
              {t.auth.signIn.welcomeBack}
            </h1>
            <p className="text-lg text-gray-600 mb-12 leading-relaxed" suppressHydrationWarning>
              {t.auth.signIn.welcomeDescription}
            </p>

            {/* Feature highlights */}
            <div className="space-y-6">
              {[
                {
                  icon: TrendingUp,
                  feature: t.auth.signIn.features.progressTracking,
                },
                {
                  icon: Users,
                  feature: t.auth.signIn.features.clientSharing,
                },
                {
                  icon: Sparkles,
                  feature: t.auth.signIn.features.customResources,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-mint-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1" suppressHydrationWarning>{item.feature.title}</h3>
                    <p className="text-sm text-gray-600" suppressHydrationWarning>{item.feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side - Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center px-4 sm:px-6 lg:px-12 xl:px-20 py-20"
        >
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2" suppressHydrationWarning>
                {t.auth.signIn.signInToAccount}
              </h2>
              <p className="text-gray-600">
                <span suppressHydrationWarning>{t.auth.signIn.dontHaveAccount}</span>{' '}
                <Link href="/sign-up" className="text-mint-600 hover:text-mint-700 font-medium" suppressHydrationWarning>
                  {t.auth.signIn.getStarted}
                </Link>
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-lg text-base mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
              <span suppressHydrationWarning>{isLoading ? t.auth.signIn.signingIn : t.auth.signIn.continueWithGoogle}</span>
            </Button>

            <p className="text-xs text-center text-gray-500">
              <span suppressHydrationWarning>{t.auth.signIn.termsPrefix}</span>{' '}
              <a href="#" className="text-mint-600 hover:text-mint-700" suppressHydrationWarning>
                {t.auth.signIn.termsOfService}
              </a>{' '}
              <span suppressHydrationWarning>{t.auth.signIn.and}</span>{' '}
              <a href="#" className="text-mint-600 hover:text-mint-700" suppressHydrationWarning>
                {t.auth.signIn.privacyPolicy}
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Info Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome Back!</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/')}>
              Go to Home
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowDialog(false)
              // User can now click "Continue with Google" to sign in
            }}>
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
