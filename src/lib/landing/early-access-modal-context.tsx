'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Heart, Sparkles, Leaf } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

type UserType = 'member' | 'practitioner' | 'both' | null

interface EarlyAccessModalContextType {
  openModal: (defaultUserType?: UserType) => void
  closeModal: () => void
  isOpen: boolean
}

const EarlyAccessModalContext = createContext<EarlyAccessModalContextType | undefined>(undefined)

const userTypeOptions = [
  {
    value: 'member' as UserType,
    Icon: Leaf,
    label: { en: 'For myself', fr: 'Pour moi' },
    description: { en: 'I want support for my own wellbeing', fr: 'Je cherche du soutien pour mon bien-être' },
    color: 'teal',
  },
  {
    value: 'practitioner' as UserType,
    Icon: Heart,
    label: { en: 'I help others', fr: 'J\'accompagne les autres' },
    description: { en: 'I\'m a therapist, coach, or practitioner', fr: 'Je suis thérapeute, coach ou praticien' },
    color: 'lavender',
  },
  {
    value: 'both' as UserType,
    Icon: Sparkles,
    label: { en: 'Both', fr: 'Les deux' },
    description: { en: 'I care for myself and support others', fr: 'Je prends soin de moi et j\'accompagne les autres' },
    color: 'rose',
  },
]

export function EarlyAccessModalProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    userType: null as UserType,
    preferredLanguage: locale as 'en' | 'fr',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const openModal = (defaultUserType?: UserType) => {
    setFormData(prev => ({ ...prev, userType: defaultUserType || null, preferredLanguage: locale as 'en' | 'fr' }))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSuccess(false)
    setError('')
    // Reset form after animation completes
    setTimeout(() => {
      if (!showModal) {
        setFormData({ name: '', email: '', reason: '', userType: null, preferredLanguage: locale as 'en' | 'fr' })
      }
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.userType) {
      setError(locale === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'DUPLICATE') {
          setError(locale === 'fr' ? 'Cet email est déjà inscrit' : 'This email is already on the list')
        } else {
          setError(data.error || (locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred'))
        }
        return
      }

      setSuccess(true)
    } catch {
      setError(locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getColorStyles = (color: string) => {
    const styles = {
      teal: {
        selected: 'border-teal-400 bg-teal-50',
        icon: 'bg-teal-100',
        iconColor: 'text-teal-500',
        check: 'border-teal-400 bg-teal-400',
      },
      lavender: {
        selected: 'border-[#D4856A] bg-[#D4856A]/10',
        icon: 'bg-[#D4856A]/20',
        iconColor: 'text-[#D4856A]',
        check: 'border-[#D4856A] bg-[#D4856A]',
      },
      rose: {
        selected: 'border-lavender-400 bg-lavender-50',
        icon: 'bg-lavender-100',
        iconColor: 'text-lavender-500',
        check: 'border-lavender-400 bg-lavender-400',
      },
    }
    return styles[color as keyof typeof styles] || styles.teal
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
                    {locale === 'fr' ? `Merci, ${formData.name} !` : `Thank you, ${formData.name}!`}
                  </h3>
                  <p className="text-neutral-500">
                    {locale === 'fr' ? 'Nous vous contacterons bientôt.' : "We'll be in touch soon."}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {locale === 'fr' ? 'Rejoignez les premiers' : 'Join the first ones'}
                  </h3>
                  <p className="text-neutral-500 text-sm mb-6">
                    {locale === 'fr'
                      ? 'Nous construisons Bloomsline avec soin. Dites-nous qui vous êtes.'
                      : 'We are building Bloomsline with care. Tell us who you are.'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'fr' ? 'Votre prénom' : 'Your name'}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={locale === 'fr' ? 'Marie' : 'Sarah'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'fr' ? 'Votre email' : 'Your email'}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={locale === 'fr' ? 'marie@example.com' : 'sarah@example.com'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* User Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {locale === 'fr' ? 'Comment voulez-vous utiliser Bloomsline?' : 'How do you want to use Bloomsline?'}
                      </label>
                      <div className="space-y-2">
                        {userTypeOptions.map((option) => {
                          const isSelected = formData.userType === option.value
                          const colorStyles = getColorStyles(option.color)

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData({ ...formData, userType: option.value })}
                              disabled={loading}
                              className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                                isSelected
                                  ? colorStyles.selected
                                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                  isSelected ? colorStyles.icon : 'bg-neutral-100'
                                }`}>
                                  <option.Icon className={`w-4 h-4 ${isSelected ? colorStyles.iconColor : 'text-neutral-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-neutral-800 text-sm">
                                    {locale === 'fr' ? option.label.fr : option.label.en}
                                  </p>
                                  <p className="text-xs text-neutral-500 truncate">
                                    {locale === 'fr' ? option.description.fr : option.description.en}
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected
                                    ? colorStyles.check
                                    : 'border-neutral-300'
                                }`}>
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Reason (optional) */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'fr' ? "Qu'est-ce qui vous amène ici?" : 'What brings you here?'}
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
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                        disabled={loading}
                      />
                    </div>

                    {/* Preferred Language */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">
                        {locale === 'fr' ? 'Langue préférée' : 'Preferred language'}
                      </span>
                      <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, preferredLanguage: 'en' })}
                          disabled={loading}
                          className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                            formData.preferredLanguage === 'en'
                              ? 'bg-white text-neutral-900 shadow-sm'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, preferredLanguage: 'fr' })}
                          disabled={loading}
                          className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                            formData.preferredLanguage === 'fr'
                              ? 'bg-white text-neutral-900 shadow-sm'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }`}
                        >
                          FR
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !formData.userType}
                      className="w-full px-6 py-3 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? (locale === 'fr' ? 'Envoi...' : 'Sending...')
                        : (locale === 'fr' ? 'Obtenir un accès anticipé' : 'Get Early Access')}
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
