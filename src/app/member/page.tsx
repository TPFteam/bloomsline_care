'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ExternalLink, LogOut, Loader2, Smartphone } from 'lucide-react'
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
            ? 'Votre espace bien-être vous attend. Accédez à vos moments, vos séances et votre parcours.'
            : 'Your wellbeing space is ready. Access your moments, sessions, and journey.'}
        </p>

        {/* Go to app button */}
        <a
          href="https://app.bloomsline.com"
          className="w-full px-8 py-4 bg-gray-900 text-white rounded-2xl font-medium inline-flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
        >
          {fr ? 'Accéder à mon espace' : 'Go to my space'}
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Coming soon note */}
        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 mt-4 mb-8">
          <Smartphone className="w-3.5 h-3.5" />
          <span>{fr ? 'L\'application iOS et Android arrive bientôt !' : 'iOS and Android apps coming soon!'}</span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          {fr ? 'Se déconnecter' : 'Sign out'}
        </button>
      </motion.div>
    </div>
  )
}
