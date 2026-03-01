'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

type PractitionerType = 'psychologue' | 'psychanalyste' | 'praticien' | 'autre' | null

interface PractitionerSignupModalContextType {
  openModal: () => void
  closeModal: () => void
  isOpen: boolean
}

const PractitionerSignupModalContext = createContext<PractitionerSignupModalContextType | undefined>(undefined)

const practitionerTypeOptions: { value: PractitionerType; label: { en: string; fr: string } }[] = [
  { value: 'psychologue', label: { en: 'Psychologist', fr: 'Psychologue' } },
  { value: 'psychanalyste', label: { en: 'Psychoanalyst', fr: 'Psychanalyste' } },
  { value: 'praticien', label: { en: 'Practitioner', fr: 'Praticien' } },
  { value: 'autre', label: { en: 'Other', fr: 'Autre' } },
]

export function PractitionerSignupModalProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage()
  const fr = locale === 'fr'

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    practitionerType: null as PractitionerType,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const openModal = () => {
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSuccess(false)
    setError('')
    setTimeout(() => {
      if (!showModal) {
        setFormData({ fullname: '', email: '', practitionerType: null })
      }
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullname.trim() || !formData.email.trim()) {
      setError(fr ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields')
      return
    }
    if (!formData.practitionerType) {
      setError(fr ? 'Veuillez sélectionner votre type de pratique' : 'Please select your practitioner type')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/practitioner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('Signup response:', response.status, JSON.stringify(data, null, 2))

      if (!response.ok) {
        if (data.code === 'DUPLICATE') {
          setError(fr ? 'Cet email est déjà inscrit' : 'This email is already registered')
        } else {
          setError(data.error || (fr ? 'Une erreur est survenue' : 'An error occurred'))
        }
        return
      }

      setSuccess(true)
    } catch {
      setError(fr ? 'Une erreur est survenue' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PractitionerSignupModalContext.Provider value={{ openModal, closeModal, isOpen: showModal }}>
      {children}

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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto scrollbar-hide"
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
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {fr ? `Merci, ${formData.fullname} !` : `Thank you, ${formData.fullname}!`}
                  </h3>
                  <p className="text-neutral-500">
                    {fr ? 'Nous vous contacterons très bientôt.' : "We'll be in touch very soon."}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {fr ? 'Essayez Bloomsline gratuitement' : 'Try Bloomsline for free'}
                  </h3>
                  <p className="text-neutral-500 text-sm mb-6">
                    {fr
                      ? 'Laissez-nous vos coordonnées, nous vous répondrons dans les plus brefs délais.'
                      : 'Join practitioners who are simplifying their daily work.'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Fullname */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {fr ? 'Nom complet' : 'Full name'}
                      </label>
                      <input
                        type="text"
                        value={formData.fullname}
                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                        placeholder={fr ? 'Marie Dupont' : 'Sarah Johnson'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {fr ? 'Email' : 'Email'}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={fr ? 'marie@cabinet.fr' : 'sarah@practice.com'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* Practitioner Type */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {fr ? 'Type de pratique' : 'Practitioner type'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {practitionerTypeOptions.map((option) => {
                          const isSelected = formData.practitionerType === option.value
                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setFormData({ ...formData, practitionerType: option.value })}
                              disabled={loading}
                              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                              } disabled:opacity-50`}
                            >
                              {fr ? option.label.fr : option.label.en}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !formData.practitionerType}
                      className="w-full px-6 py-3 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-600/25"
                      style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
                    >
                      {loading
                        ? (fr ? 'Envoi...' : 'Sending...')
                        : (fr ? 'Envoyer' : 'Send')}
                    </button>
                  </form>

                  <p className="text-center text-xs text-neutral-400 mt-4">
                    {fr
                      ? 'Nous ne partageons jamais vos informations.'
                      : 'We never share your information.'}
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PractitionerSignupModalContext.Provider>
  )
}

export function usePractitionerSignupModal() {
  const context = useContext(PractitionerSignupModalContext)
  if (context === undefined) {
    throw new Error('usePractitionerSignupModal must be used within a PractitionerSignupModalProvider')
  }
  return context
}
