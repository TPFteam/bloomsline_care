'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { Check, Heart, Info, Sparkles, Leaf, Sun } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'

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
            : locale === 'es'
              ? 'Este correo electrónico ya está en la lista de espera.'
              : 'This email is already on the waitlist.')
        } else {
          setError(locale === 'fr'
            ? 'Une erreur est survenue. Réessayez.'
            : locale === 'es'
              ? 'Algo salió mal. Por favor, inténtelo de nuevo.'
              : 'Something went wrong. Please try again.')
        }
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(locale === 'fr'
        ? 'Une erreur est survenue. Réessayez.'
        : locale === 'es'
          ? 'Algo salió mal. Por favor, inténtelo de nuevo.'
          : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const userTypeOptions = [
    {
      value: 'member' as UserType,
      Icon: Leaf,
      label: { en: 'For myself', fr: 'Pour moi', es: 'Para mí' },
      description: { en: 'I want support for my own wellbeing', fr: 'Je cherche du soutien pour mon bien-être', es: 'Quiero apoyo para mi propio bienestar' },
      color: 'rose',
    },
    {
      value: 'practitioner' as UserType,
      Icon: Heart,
      label: { en: 'I help others', fr: 'J\'accompagne les autres', es: 'Ayudo a otros' },
      description: { en: 'I\'m a therapist, coach, or practitioner', fr: 'Je suis thérapeute, coach ou praticien', es: 'Soy terapeuta, coach o profesional' },
      color: 'lavender',
    },
    {
      value: 'both' as UserType,
      Icon: Sparkles,
      label: { en: 'Both', fr: 'Les deux', es: 'Ambos' },
      description: { en: 'I care for myself and support others', fr: 'Je prends soin de moi et j\'accompagne les autres', es: 'Me cuido a mí mismo y apoyo a otros' },
      color: 'teal',
    },
  ]

  return (
    <EarlyAccessModalProvider>
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="min-h-screen bg-white pt-20">
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
                <div className="absolute inset-0 bg-gradient-to-br from-lavender-100/50 to-teal-100/50 rounded-3xl" />

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
                        <p className="font-medium text-neutral-800">
                          {locale === 'fr' ? 'Rejoindre' : locale === 'es' ? 'Unirse' : 'Join'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Un espace créé avec soin' : locale === 'es' ? 'Un espacio creado con cuidado' : 'A space built with care'}
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
                        <p className="font-medium text-neutral-800">
                          {locale === 'fr' ? 'Grandir' : locale === 'es' ? 'Crecer' : 'Grow'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Des petits rituels qui comptent' : locale === 'es' ? 'Pequeños rituales que importan' : 'Small rituals that matter'}
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
                        <p className="font-medium text-neutral-800">
                          {locale === 'fr' ? 'Se connecter' : locale === 'es' ? 'Conectar' : 'Connect'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Avec quelqu\'un qui comprend' : locale === 'es' ? 'Con alguien que entiende' : 'With someone who understands'}
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
                        <p className="font-medium text-neutral-800">
                          {locale === 'fr' ? 'S\'épanouir' : locale === 'es' ? 'Florecer' : 'Flourish'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {locale === 'fr' ? 'Voir que vous comptez' : locale === 'es' ? 'Ver que usted importa' : 'See that you matter'}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quote */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 p-6 bg-white/60 rounded-2xl"
                  >
                    <p className="text-neutral-600 italic text-sm leading-relaxed">
                      {locale === 'fr'
                        ? '"Nous ne cherchons pas à ajouter une app de plus dans votre vie. Nous voulons créer un espace qui a du sens."'
                        : locale === 'es'
                          ? '"No intentamos agregar otra app a su vida. Queremos crear un espacio que importe."'
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
                      className="mb-6 p-4 bg-lavender-50 border border-lavender-200 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-lavender-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-lavender-800">
                          {infoMessage}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-3">
                      {locale === 'fr' ? 'Rejoignez les premiers.' : locale === 'es' ? 'Únase a los primeros.' : 'Join the first ones.'}
                    </h1>
                    <p className="text-neutral-500 leading-relaxed">
                      {locale === 'fr'
                        ? 'Nous construisons Bloomsline avec soin. Dites-nous qui vous êtes.'
                        : locale === 'es'
                          ? 'Estamos construyendo Bloomsline con cuidado. Cuéntenos quién es usted.'
                          : 'We are building Bloomsline with care. Tell us who you are.'}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {locale === 'fr' ? 'Votre prénom' : locale === 'es' ? 'Su nombre' : 'Your first name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-all"
                        placeholder={locale === 'fr' ? 'Marie' : locale === 'es' ? 'María' : 'Sarah'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {locale === 'fr' ? 'Votre email' : locale === 'es' ? 'Su correo electrónico' : 'Your email'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-all"
                        placeholder={locale === 'fr' ? 'marie@example.com' : locale === 'es' ? 'maria@example.com' : 'sarah@example.com'}
                      />
                    </div>

                    {/* User Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        {locale === 'fr' ? 'Comment voulez-vous utiliser Bloomsline?' : locale === 'es' ? '¿Cómo quiere usar Bloomsline?' : 'How do you want to use Bloomsline?'}
                      </label>
                      <div className="space-y-3">
                        {userTypeOptions.map((option) => {
                          const isSelected = formData.userType === option.value
                          const colorStylesMap = {
                            rose: {
                              selected: 'border-rose-400 bg-rose-50',
                              icon: 'bg-rose-100',
                              iconColor: 'text-rose-500',
                              check: 'border-rose-400 bg-rose-400',
                            },
                            lavender: {
                              selected: 'border-lavender-400 bg-lavender-50',
                              icon: 'bg-lavender-100',
                              iconColor: 'text-lavender-500',
                              check: 'border-lavender-400 bg-lavender-400',
                            },
                            teal: {
                              selected: 'border-teal-400 bg-teal-50',
                              icon: 'bg-teal-100',
                              iconColor: 'text-teal-500',
                              check: 'border-teal-400 bg-teal-400',
                            },
                          }
                          const colorStyles = colorStylesMap[option.color as keyof typeof colorStylesMap] || colorStylesMap.teal

                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setFormData({ ...formData, userType: option.value })}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                isSelected
                                  ? colorStyles.selected
                                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                  isSelected ? colorStyles.icon : 'bg-neutral-100'
                                }`}>
                                  <option.Icon className={`w-5 h-5 ${isSelected ? colorStyles.iconColor : 'text-neutral-400'}`} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-neutral-800">
                                    {locale === 'fr' ? option.label.fr : locale === 'es' ? option.label.es : option.label.en}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {locale === 'fr' ? option.description.fr : locale === 'es' ? option.description.es : option.description.en}
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
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

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {locale === 'fr'
                          ? 'Qu\'est-ce qui vous amène ici?'
                          : locale === 'es'
                            ? '¿Qué le trae por aquí?'
                            : 'What brings you here?'}
                        <span className="text-neutral-400 font-normal ml-1">
                          {locale === 'fr' ? '(optionnel)' : locale === 'es' ? '(opcional)' : '(optional)'}
                        </span>
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent transition-all resize-none"
                        placeholder={locale === 'fr'
                          ? 'Un moment difficile, une envie de changement, ou juste de la curiosité...'
                          : locale === 'es'
                            ? 'Un momento difícil, un deseo de cambio, o simplemente curiosidad...'
                            : 'A hard moment, a desire for change, or just curiosity...'}
                      />
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.userType}
                      className="w-full py-6 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-medium shadow-lg shadow-neutral-900/20 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? (locale === 'fr' ? 'Envoi...' : locale === 'es' ? 'Enviando...' : 'Sending...')
                        : (locale === 'fr' ? 'Obtenir un accès anticipé' : locale === 'es' ? 'Obtener acceso anticipado' : 'Get Early Access')}
                    </Button>
                  </form>

                  {/* Trust note */}
                  <p className="text-center text-xs text-neutral-400 mt-6">
                    {locale === 'fr'
                      ? 'Nous ne partageons jamais vos informations. Promis.'
                      : locale === 'es'
                        ? 'Nunca compartimos su información. Prometido.'
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
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-light text-neutral-900 mb-4">
                    {locale === 'fr' ? 'Merci, ' + formData.name + '.' : locale === 'es' ? 'Gracias, ' + formData.name + '.' : 'Thank you, ' + formData.name + '.'}
                  </h2>
                  <p className="text-neutral-500 leading-relaxed max-w-sm mx-auto">
                    {locale === 'fr'
                      ? 'Nous avons reçu votre demande. Nous vous écrirons personnellement quand une place se libère.'
                      : locale === 'es'
                        ? 'Hemos recibido su solicitud. Le escribiremos personalmente cuando se abra un lugar.'
                        : 'We received your request. We will write to you personally when a spot opens up.'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </EarlyAccessModalProvider>
  )
}

export default function EarlyAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
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
