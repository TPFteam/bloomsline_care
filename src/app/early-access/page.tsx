'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { Check, Heart, Users, Info, Sparkles, Leaf, Sun } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type UserType = 'member' | 'practitioner' | 'both' | null

function EarlyAccessContent() {
  const { locale } = useLanguage()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    userType: null as UserType,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  // Animated visual state
  const [animStep, setAnimStep] = useState(0)

  useEffect(() => {
    const info = searchParams.get('info')
    if (info) {
      setInfoMessage(decodeURIComponent(info))
    }
  }, [searchParams])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
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
          setError(locale === 'fr'
            ? 'Cet email est déjà sur la liste d\'attente.'
            : 'This email is already on the waitlist.')
        } else {
          setError(locale === 'fr'
            ? 'Une erreur est survenue. Réessayez.'
            : 'Something went wrong. Please try again.')
        }
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(locale === 'fr'
        ? 'Une erreur est survenue. Réessayez.'
        : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const userTypeOptions = [
    {
      value: 'member' as UserType,
      icon: Heart,
      label: { en: 'For myself', fr: 'Pour moi' },
      description: { en: 'I want support for my own wellbeing', fr: 'Je cherche du soutien pour mon bien-être' },
    },
    {
      value: 'practitioner' as UserType,
      icon: Users,
      label: { en: 'I help others', fr: 'J\'accompagne les autres' },
      description: { en: 'I\'m a therapist, coach, or practitioner', fr: 'Je suis thérapeute, coach ou praticien' },
    },
    {
      value: 'both' as UserType,
      icon: Heart,
      label: { en: 'Both', fr: 'Les deux' },
      description: { en: 'I care for myself and support others', fr: 'Je prends soin de moi et j\'accompagne les autres' },
    },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-neutral-950 pt-20">
        <div className="container mx-auto px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto">

            {/* Left - Animated Visual */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Decorative background */}
                <div className="absolute inset-0 bg-gradient-to-br from-lavender-100/50 to-teal-100/50 dark:from-lavender-900/20 dark:to-teal-900/20 rounded-3xl" />

                <div className="relative p-10">
                  {/* Animated journey visualization */}
                  <div className="space-y-6">
                    <motion.div
                      animate={{ opacity: animStep >= 0 ? 1 : 0.3 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        animate={{
                          scale: animStep === 0 ? 1.1 : 1,
                          backgroundColor: animStep >= 0 ? 'rgb(139 92 246)' : 'rgb(229 231 235)'
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                      >
                        <motion.div
                          animate={{
                            rotate: animStep === 0 ? [0, 15, -15, 0] : 0,
                            scale: animStep === 0 ? [1, 1.2, 1] : 1
                          }}
                          transition={{ duration: 0.6, repeat: animStep === 0 ? Infinity : 0, repeatDelay: 1 }}
                        >
                          <Sparkles className="w-5 h-5 text-white" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {locale === 'fr' ? 'Rejoindre' : 'Join'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Un espace créé avec soin' : 'A space built with care'}
                        </p>
                      </div>
                    </motion.div>

                    {/* Connecting line */}
                    <div className="ml-6 h-8 w-0.5 bg-gradient-to-b from-lavender-400 to-teal-400" />

                    <motion.div
                      animate={{ opacity: animStep >= 1 ? 1 : 0.3 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        animate={{
                          scale: animStep === 1 ? 1.1 : 1,
                          backgroundColor: animStep >= 1 ? 'rgb(20 184 166)' : 'rgb(229 231 235)'
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                      >
                        <motion.div
                          animate={{
                            y: animStep === 1 ? [0, -3, 0] : 0,
                            scale: animStep === 1 ? [1, 1.1, 1] : 1
                          }}
                          transition={{ duration: 0.8, repeat: animStep === 1 ? Infinity : 0, repeatDelay: 0.5 }}
                        >
                          <Leaf className="w-5 h-5 text-white" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {locale === 'fr' ? 'Grandir' : 'Grow'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Des petits rituels qui comptent' : 'Small rituals that matter'}
                        </p>
                      </div>
                    </motion.div>

                    {/* Connecting line */}
                    <div className="ml-6 h-8 w-0.5 bg-gradient-to-b from-teal-400 to-rose-400" />

                    <motion.div
                      animate={{ opacity: animStep >= 2 ? 1 : 0.3 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        animate={{
                          scale: animStep === 2 ? 1.1 : 1,
                          backgroundColor: animStep >= 2 ? 'rgb(244 63 94)' : 'rgb(229 231 235)'
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                      >
                        <motion.div
                          animate={{
                            scale: animStep === 2 ? [1, 1.2, 1, 1.15, 1] : 1
                          }}
                          transition={{ duration: 0.8, repeat: animStep === 2 ? Infinity : 0, repeatDelay: 0.3 }}
                        >
                          <Heart className="w-5 h-5 text-white" fill="white" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {locale === 'fr' ? 'Se connecter' : 'Connect'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Avec quelqu\'un qui comprend' : 'With someone who understands'}
                        </p>
                      </div>
                    </motion.div>

                    {/* Connecting line */}
                    <div className="ml-6 h-8 w-0.5 bg-gradient-to-b from-rose-400 to-amber-400" />

                    <motion.div
                      animate={{ opacity: animStep >= 3 ? 1 : 0.3 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        animate={{
                          scale: animStep === 3 ? 1.1 : 1,
                          backgroundColor: animStep >= 3 ? 'rgb(245 158 11)' : 'rgb(229 231 235)'
                        }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                      >
                        <motion.div
                          animate={{
                            rotate: animStep === 3 ? [0, 360] : 0,
                            scale: animStep === 3 ? [1, 1.1, 1] : 1
                          }}
                          transition={{
                            rotate: { duration: 8, repeat: animStep === 3 ? Infinity : 0, ease: "linear" },
                            scale: { duration: 1, repeat: animStep === 3 ? Infinity : 0 }
                          }}
                        >
                          <Sun className="w-5 h-5 text-white" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">
                          {locale === 'fr' ? 'S\'épanouir' : 'Flourish'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Voir que vous comptez' : 'See that you matter'}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quote */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 p-6 bg-white/60 dark:bg-neutral-900/60 rounded-2xl"
                  >
                    <p className="text-neutral-600 dark:text-neutral-400 italic text-sm leading-relaxed">
                      {locale === 'fr'
                        ? '"Nous ne cherchons pas à ajouter une app de plus dans votre vie. Nous voulons créer un espace qui a du sens."'
                        : '"We are not trying to add another app to your life. We want to create a space that matters."'}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Right - Form */}
            <div>
              {!isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {/* Info Message Banner */}
                  {infoMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-lavender-600 dark:text-lavender-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-lavender-800 dark:text-lavender-200">
                          {infoMessage}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 dark:text-white mb-3">
                      {locale === 'fr' ? 'Rejoignez les premiers.' : 'Join the first ones.'}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {locale === 'fr'
                        ? 'Nous construisons Bloomsline avec soin. Dites-nous qui vous êtes.'
                        : 'We are building Bloomsline with care. Tell us who you are.'}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'fr' ? 'Votre prénom' : 'Your first name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-all"
                        placeholder={locale === 'fr' ? 'Marie' : 'Sarah'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'fr' ? 'Votre email' : 'Your email'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-all"
                        placeholder={locale === 'fr' ? 'marie@example.com' : 'sarah@example.com'}
                      />
                    </div>

                    {/* User Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                        {locale === 'fr' ? 'Comment voulez-vous utiliser Bloomsline?' : 'How do you want to use Bloomsline?'}
                      </label>
                      <div className="space-y-2">
                        {userTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, userType: option.value })}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              formData.userType === option.value
                                ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/20'
                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.userType === option.value
                                  ? 'border-lavender-500 bg-lavender-500'
                                  : 'border-neutral-300 dark:border-neutral-600'
                              }`}>
                                {formData.userType === option.value && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {locale === 'fr' ? option.label.fr : option.label.en}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {locale === 'fr' ? option.description.fr : option.description.en}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'fr'
                          ? 'Qu\'est-ce qui vous amène ici?'
                          : 'What brings you here?'}
                        <span className="text-neutral-400 font-normal ml-1">
                          {locale === 'fr' ? '(optionnel)' : '(optional)'}
                        </span>
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-all resize-none"
                        placeholder={locale === 'fr'
                          ? 'Un moment difficile, une envie de changement, ou juste de la curiosité...'
                          : 'A hard moment, a desire for change, or just curiosity...'}
                      />
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.userType}
                      className="w-full py-6 bg-gradient-to-r from-lavender-500 to-lavender-600 text-white hover:from-lavender-600 hover:to-lavender-700 rounded-xl font-medium shadow-lg shadow-lavender-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? (locale === 'fr' ? 'Envoi...' : 'Sending...')
                        : (locale === 'fr' ? 'Demander un accès' : 'Request access')}
                    </Button>
                  </form>

                  {/* Trust note */}
                  <p className="text-center text-xs text-neutral-400 mt-6">
                    {locale === 'fr'
                      ? 'Nous ne partageons jamais vos informations. Promis.'
                      : 'We never share your information. Promise.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-light text-neutral-900 dark:text-white mb-4">
                    {locale === 'fr' ? 'Merci, ' + formData.name + '.' : 'Thank you, ' + formData.name + '.'}
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                    {locale === 'fr'
                      ? 'Nous avons reçu votre demande. Nous vous écrirons personnellement quand une place se libère.'
                      : 'We received your request. We will write to you personally when a spot opens up.'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function EarlyAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    }>
      <EarlyAccessContent />
    </Suspense>
  )
}
