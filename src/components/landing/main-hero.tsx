'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ArrowRight, Heart, Users } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'

const rotatingWords = {
  en: ['care', 'peace', 'rest', 'calm', 'joy', 'healing'],
  fr: ['paix', 'repos', 'calme', 'joie', 'soin', 'guérison'],
}

export function MainHero() {
  const { locale } = useLanguage()
  const [showLine, setShowLine] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    // Skip animation if there's a hash in URL (user navigated to specific section)
    if (typeof window !== 'undefined' && window.location.hash) {
      setShowLine(false)
      setShowContent(true)
      return
    }

    // Start showing content as line reaches middle
    const contentTimer = setTimeout(() => {
      setShowContent(true)
    }, 800)

    // Hide line after it completes
    const hideLineTimer = setTimeout(() => {
      setShowLine(false)
    }, 1400)

    return () => {
      clearTimeout(contentTimer)
      clearTimeout(hideLineTimer)
    }
  }, [])

  // Disable scrolling during line animation
  useEffect(() => {
    if (showLine && !showContent) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showLine, showContent])

  // Rotate words in headline
  useEffect(() => {
    if (!showContent) return
    const words = rotatingWords[locale]
    const interval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [showContent, locale])

  return (
    <section className="relative min-h-screen bg-white dark:bg-neutral-950 overflow-hidden">
      {/* Subtle grain texture overlay - only visible in dark mode */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle ambient glow - light mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 via-white to-white dark:from-transparent dark:via-transparent dark:to-transparent" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-24 sm:pt-16">
        <AnimatePresence>
          {/* Line Animation - draws across screen */}
          {showLine && (
            <motion.div
              key="line"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                className="h-[2px] bg-gradient-to-r from-lavender-400 via-lavender-500 to-mint-400"
                initial={{ width: 0, x: '-50vw' }}
                animate={{ width: '100vw', x: '0vw' }}
                transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {/* Main Content - fades up as line passes */}
          {showContent && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-4xl mx-auto"
            >
              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center mb-6"
              >
                <LayoutGroup>
                  <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-light tracking-tight text-neutral-900 dark:text-white leading-[1.15] mb-3 flex items-baseline justify-center flex-wrap gap-x-[0.25em]">
                    <motion.span layout transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}>
                      {locale === 'fr' ? 'Votre' : 'Your'}
                    </motion.span>
                    <motion.span
                      layout
                      className="text-lavender-500"
                      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={wordIndex}
                          initial={{ opacity: 0, filter: "blur(8px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, filter: "blur(8px)" }}
                          transition={{ duration: 0.7 }}
                          className="inline-block"
                        >
                          {rotatingWords[locale][wordIndex]}
                        </motion.span>
                      </AnimatePresence>
                    </motion.span>
                    <motion.span layout transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}>
                      {locale === 'fr' ? 'compte' : 'matters'}
                    </motion.span>
                  </h1>
                </LayoutGroup>
                <p className="text-xl sm:text-2xl text-neutral-500 dark:text-white/50">
                  {locale === 'fr' ? 'On vous facilite la vie.' : 'We make it easier.'}
                </p>
              </motion.div>

              {/* Platform description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-base text-neutral-400 dark:text-white/40 text-center max-w-xl mx-auto mb-12 leading-relaxed"
              >
                <p>
                  {locale === 'fr'
                    ? 'Le vrai changement ne vient pas d\'un grand effort. Il vient des petits gestes.'
                    : 'Real change does not happen all at once. It happens when you show up.'}
                </p>
                <p>
                  {locale === 'fr'
                    ? 'Un rituel, un moment de gratitude. Des instants qui comptent.'
                    : 'A ritual, a gratitude moment. Small things that matter.'}
                </p>
              </motion.div>

              {/* Path Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
              >
                {/* Member Card */}
                <button
                  className="group text-left"
                  onClick={() => {
                    window.location.hash = 'for-me'
                    setTimeout(() => {
                      document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  <motion.div
                    className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-lg shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-800 hover:shadow-xl dark:hover:border-neutral-700 transition-all duration-300 overflow-hidden"
                    whileHover={{ y: -4 }}
                  >
                    {/* Decorative circle */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-lavender-100 dark:bg-lavender-900/20 opacity-60" />

                    <div className="relative">
                      <div className="w-12 h-12 bg-lavender-100 dark:bg-lavender-900/30 rounded-2xl flex items-center justify-center mb-6">
                        <Heart className="w-6 h-6 text-lavender-600 dark:text-lavender-400" />
                      </div>

                      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                        {locale === 'fr' ? 'Pour mon bien-être' : 'For my wellbeing'}
                      </h3>

                      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
                        {locale === 'fr'
                          ? 'Accédez aux rituels, suivez vos progrès et connectez-vous avec votre praticien.'
                          : 'Access rituals, track your progress, and connect with your practitioner.'}
                      </p>

                      <span className="inline-flex items-center text-lavender-600 dark:text-lavender-400 text-sm font-medium group-hover:gap-2 gap-1.5 transition-all">
                        {locale === 'fr' ? 'En savoir plus' : 'Learn more'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </motion.div>
                </button>

                {/* Practitioner Card */}
                <Link
                  href="/practitioner"
                  className="group text-left block"
                >
                  <motion.div
                    className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-lg shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-800 hover:shadow-xl dark:hover:border-neutral-700 transition-all duration-300 overflow-hidden"
                    whileHover={{ y: -4 }}
                  >
                    {/* Decorative circle */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-mint-100 dark:bg-mint-900/20 opacity-60" />

                    <div className="relative">
                      <div className="w-12 h-12 bg-mint-100 dark:bg-mint-900/30 rounded-2xl flex items-center justify-center mb-6">
                        <Users className="w-6 h-6 text-mint-600 dark:text-mint-400" />
                      </div>

                      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
                        {locale === 'fr' ? 'Je suis praticien' : "I'm a practitioner"}
                      </h3>

                      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
                        {locale === 'fr'
                          ? 'Gérez vos clients, créez des ressources personnalisées et développez votre pratique.'
                          : 'Manage clients, create personalized resources, and grow your practice.'}
                      </p>

                      <span className="inline-flex items-center text-mint-600 dark:text-mint-400 text-sm font-medium group-hover:gap-2 gap-1.5 transition-all">
                        {locale === 'fr' ? 'En savoir plus' : 'Learn more'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll indicator - only after content revealed */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12"
          >
            <motion.div
              className="w-[1px] h-8 bg-gradient-to-b from-neutral-300 dark:from-white/30 to-transparent"
              animate={{ scaleY: [1, 0.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </div>
    </section>
  )
}
