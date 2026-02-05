'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Quote, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export function Testimonials() {
  const { t, locale } = useLanguage()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError(locale === 'fr' ? 'Veuillez remplir tous les champs' : locale === 'es' ? 'Por favor, completa todos los campos' : 'Please fill in all fields')
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
          setError(locale === 'fr' ? 'Cet email est déjà inscrit' : locale === 'es' ? 'Este correo ya está registrado' : 'This email is already registered')
        } else {
          setError(data.error || (locale === 'fr' ? 'Une erreur est survenue' : locale === 'es' ? 'Ocurrió un error' : 'An error occurred'))
        }
        return
      }

      setSuccess(true)
      setName('')
      setEmail('')
    } catch {
      setError(locale === 'fr' ? 'Une erreur est survenue' : locale === 'es' ? 'Ocurrió un error' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-mint-50/30 via-lavender-50/20 to-peach-50/30 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-gradient-to-br from-lavender-200 to-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-gradient-to-br from-peach-200 to-coral-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900" suppressHydrationWarning>
            {t.testimonials.sectionTitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t.testimonials.sectionSubtitle}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.testimonials.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="p-8 rounded-3xl border border-white/60 bg-white/50 backdrop-blur-xl hover:bg-white/60 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                {/* Quote Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-100 to-mint-100 flex items-center justify-center mb-6 shadow-md">
                  <Quote className="w-6 h-6 text-lavender-600" />
                </div>

                {/* Quote */}
                <p className="text-gray-700 leading-relaxed mb-6 flex-grow text-base italic" suppressHydrationWarning>
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-gray-900" suppressHydrationWarning>{testimonial.author}</p>
                  <p className="text-sm text-gray-600" suppressHydrationWarning>{testimonial.role}</p>
                  <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Community Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8" suppressHydrationWarning>
            {t.testimonials.communityNote}
          </p>

          {success ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-neutral-900 font-medium">
                {locale === 'fr' ? 'Merci pour votre inscription !' : locale === 'es' ? '¡Gracias por registrarte!' : 'Thank you for signing up!'}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                {locale === 'fr' ? 'Nous vous contacterons bientôt.' : locale === 'es' ? 'Nos pondremos en contacto pronto.' : 'We\'ll be in touch soon.'}
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
                  placeholder={(t.testimonials as { formNamePlaceholder?: string }).formNamePlaceholder || 'Votre nom'}
                  className="w-full sm:w-auto px-4 py-3 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
                  disabled={loading}
                  suppressHydrationWarning
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={(t.testimonials as { formEmailPlaceholder?: string }).formEmailPlaceholder || 'Votre email'}
                  className="w-full sm:w-auto px-4 py-3 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
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
                    ? (locale === 'fr' ? 'Envoi...' : locale === 'es' ? 'Enviando...' : 'Sending...')
                    : ((t.testimonials as { formButton?: string }).formButton || 'Accès anticipé')}
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
