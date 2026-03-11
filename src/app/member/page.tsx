'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Smartphone, LogOut, Loader2, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export default function MemberPage() {
  const router = useRouter()
  const supabase = createClient()
  const { locale } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  const fr = locale === 'fr'

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      setUserName(user.user_metadata?.full_name?.split(' ')[0] || '')
      setLoading(false)
    }
    check()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center mx-auto mb-8">
          <Smartphone className="h-10 w-10 text-teal-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          {userName
            ? (fr ? `Bonjour ${userName} !` : `Hey ${userName}!`)
            : (fr ? 'Bonjour !' : 'Hey there!')}
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          {fr
            ? 'Votre espace est sur l\u2019application mobile. Téléchargez Bloomsline pour accéder à vos moments, vos séances et votre parcours.'
            : 'Your space lives in the mobile app. Download Bloomsline to access your moments, sessions, and journey.'}
        </p>

        {/* App store buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <a
            href="https://apps.apple.com/app/bloomsline"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium inline-flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          >
            App Store
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.bloomsline"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gray-100 text-gray-900 rounded-2xl font-medium inline-flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            Google Play
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          {fr ? 'Se déconnecter' : 'Sign out'}
        </button>
      </motion.div>
    </div>
  )
}
