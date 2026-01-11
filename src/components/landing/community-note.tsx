'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Heart, Check } from 'lucide-react'

export function CommunityNote() {
  const { t, locale } = useLanguage()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError(locale === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          userType: 'practitioner',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'DUPLICATE') {
          setError(locale === 'fr' ? 'Cet email est déjà inscrit' : 'This email is already registered')
        } else {
          setError(data.error || (locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred'))
        }
        return
      }

      setSuccess(true)
      setName('')
      setEmail('')
    } catch {
      setError(locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xl sm:text-2xl font-light text-neutral-600 max-w-2xl mx-auto leading-relaxed inline-flex items-center justify-center flex-wrap gap-2 mb-8" suppressHydrationWarning>
            {t.testimonials.communityNote}
            <Heart className="w-5 h-5 text-[#4A9A86] fill-[#4A9A86] inline-block" />
          </p>

          {success ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-neutral-900 font-medium">
                {locale === 'fr' ? 'Merci pour votre inscription !' : 'Thank you for signing up!'}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                {locale === 'fr' ? 'Nous vous contacterons bientôt.' : 'We\'ll be in touch soon.'}
              </p>
            </div>
          ) : (
            <>
              {/* Early Access Form */}
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={locale === 'fr' ? 'Votre nom' : 'Your name'}
                  className="w-full sm:w-auto px-4 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
                  disabled={loading}
                  suppressHydrationWarning
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={locale === 'fr' ? 'Votre email' : 'Your email'}
                  className="w-full sm:w-auto px-4 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
                  disabled={loading}
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-full shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300 whitespace-nowrap disabled:opacity-50"
                  suppressHydrationWarning
                >
                  {loading
                    ? (locale === 'fr' ? 'Envoi...' : 'Sending...')
                    : (locale === 'fr' ? 'Accès anticipé' : 'Early Access')}
                </button>
              </form>
              {error && (
                <p className="text-red-500 text-sm text-center mt-2">{error}</p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
