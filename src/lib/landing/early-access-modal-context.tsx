'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface EarlyAccessModalContextType {
  openModal: () => void
  closeModal: () => void
  isOpen: boolean
}

const EarlyAccessModalContext = createContext<EarlyAccessModalContextType | undefined>(undefined)

export function EarlyAccessModalProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const openModal = () => setShowModal(true)

  const closeModal = () => {
    setShowModal(false)
    setSuccess(false)
    setError('')
  }

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
    <EarlyAccessModalContext.Provider value={{ openModal, closeModal, isOpen: showModal }}>
      {children}

      {/* Early Access Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {success ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {locale === 'fr' ? 'Merci pour votre inscription !' : 'Thank you for signing up!'}
                  </h3>
                  <p className="text-neutral-500">
                    {locale === 'fr' ? 'Nous vous contacterons bientôt.' : 'We\'ll be in touch soon.'}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
                  </h3>
                  <p className="text-neutral-500 text-sm mb-6">
                    {locale === 'fr'
                      ? 'Inscrivez-vous pour être parmi les premiers à découvrir Bloomsline.'
                      : 'Sign up to be among the first to discover Bloomsline.'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={locale === 'fr' ? 'Votre nom' : 'Your name'}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
                      disabled={loading}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={locale === 'fr' ? 'Votre email' : 'Your email'}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
                      disabled={loading}
                    />
                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-xl shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300 disabled:opacity-50"
                    >
                      {loading
                        ? (locale === 'fr' ? 'Envoi...' : 'Sending...')
                        : (locale === 'fr' ? 'Accès anticipé' : 'Get Early Access')}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </EarlyAccessModalContext.Provider>
  )
}

export function useEarlyAccessModal() {
  const context = useContext(EarlyAccessModalContext)
  if (context === undefined) {
    throw new Error('useEarlyAccessModal must be used within an EarlyAccessModalProvider')
  }
  return context
}
