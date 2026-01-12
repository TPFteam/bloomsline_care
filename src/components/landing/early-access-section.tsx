'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { ArrowRight, Check, X } from 'lucide-react'

export function EarlyAccessSection() {
  const { locale } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', reason: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userType: 'member' }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'DUPLICATE') {
          setError(locale === 'fr' ? 'Cet email est déjà sur la liste.' : 'This email is already on the list.')
        } else {
          throw new Error('Failed to submit')
        }
        return
      }

      setIsSuccess(true)
    } catch {
      setError(locale === 'fr' ? 'Une erreur est survenue' : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    if (isSuccess) {
      setFormData({ name: '', email: '', reason: '' })
      setIsSuccess(false)
    }
    setError('')
  }

  return (
    <>
      <section className="py-24 sm:py-32 bg-neutral-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 mb-6">
              {locale === 'fr' ? 'Prêt à commencer ?' : 'Ready to begin?'}
            </h2>

            <p className="text-lg text-neutral-500 mb-10">
              {locale === 'fr'
                ? 'Rejoignez notre liste d\'attente et soyez parmi les premiers à découvrir Bloomsline.'
                : 'Join our waitlist and be among the first to experience Bloomsline.'}
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 rounded-full bg-neutral-900 text-white font-medium inline-flex items-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              {locale === 'fr' ? 'Obtenir un accès anticipé' : 'Get Early Access'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">
                    {locale === 'fr' ? `Merci, ${formData.name} !` : `Thank you, ${formData.name}!`}
                  </h3>
                  <p className="text-neutral-500">
                    {locale === 'fr'
                      ? 'Nous vous contacterons bientôt.'
                      : "We'll be in touch soon."}
                  </p>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-2xl font-light text-neutral-900 mb-2">
                    {locale === 'fr' ? 'Rejoignez-nous' : 'Join us'}
                  </h3>
                  <p className="text-neutral-500 mb-6">
                    {locale === 'fr'
                      ? 'Soyez parmi les premiers à découvrir Bloomsline.'
                      : 'Be among the first to experience Bloomsline.'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'fr' ? 'Votre prénom' : 'Your name'}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={locale === 'fr' ? 'Marie' : 'Sarah'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'fr' ? 'Votre email' : 'Your email'}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={locale === 'fr' ? 'marie@example.com' : 'sarah@example.com'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'fr' ? "Qu'est-ce qui vous amène ici ?" : 'What brings you here?'}
                        <span className="text-neutral-400 font-normal ml-1">
                          {locale === 'fr' ? '(optionnel)' : '(optional)'}
                        </span>
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder={locale === 'fr'
                          ? 'Un moment difficile, une envie de changement...'
                          : 'A hard moment, a desire for change...'}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                      />
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {locale === 'fr' ? 'Rejoindre la liste' : 'Join the waitlist'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs text-neutral-400 mt-4">
                    {locale === 'fr'
                      ? 'Nous ne partageons jamais vos informations.'
                      : 'We never share your information.'}
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
