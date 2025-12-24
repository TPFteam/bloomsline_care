'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ArrowRight, Heart, Users } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'

const BREATH_DURATION = 4

const rotatingWords = {
  en: ['care', 'peace', 'rest', 'calm', 'joy', 'healing'],
  fr: ['paix', 'repos', 'calme', 'joie', 'soin', 'guérison'],
}

export function MainHero() {
  const { locale } = useLanguage()
  const [phase, setPhase] = useState<'breathe' | 'reveal'>('breathe')
  const [breathState, setBreathState] = useState<'in' | 'out'>('in')
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    // Skip breathing if there's a hash in URL (user navigated to specific section)
    if (typeof window !== 'undefined' && window.location.hash) {
      setPhase('reveal')
      return
    }

    // Reveal content after 2 breath cycles
    const revealTimer = setTimeout(() => {
      setPhase('reveal')
    }, BREATH_DURATION * 2 * 1000)

    return () => clearTimeout(revealTimer)
  }, [])

  // Disable scrolling during breathing phase
  useEffect(() => {
    if (phase === 'breathe') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  // Alternate breath state
  useEffect(() => {
    if (phase !== 'breathe') return
    const interval = setInterval(() => {
      setBreathState(prev => prev === 'in' ? 'out' : 'in')
    }, BREATH_DURATION * 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Rotate words in headline
  useEffect(() => {
    if (phase !== 'reveal') return
    const words = rotatingWords[locale]
    const interval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [phase, locale])

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
        <AnimatePresence mode="wait">
          {/* Breathing Phase */}
          {phase === 'breathe' && (
            <motion.div
              key="breathe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center"
            >
              {/* Premium breathing ring */}
              <motion.div
                className="relative w-32 h-32 sm:w-40 sm:h-40 mb-12"
              >
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-neutral-300 dark:border-white/20"
                  animate={{
                    scale: breathState === 'in' ? [1, 1.2] : [1.2, 1],
                    opacity: breathState === 'in' ? [0.3, 0.6] : [0.6, 0.3],
                  }}
                  transition={{
                    duration: BREATH_DURATION,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
                {/* Inner dot */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neutral-900 dark:bg-white"
                  animate={{
                    scale: breathState === 'in' ? [1, 1.5] : [1.5, 1],
                    opacity: breathState === 'in' ? [0.6, 1] : [1, 0.6],
                  }}
                  transition={{
                    duration: BREATH_DURATION,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              </motion.div>

              {/* Breathing text */}
              <motion.p
                className="text-2xl sm:text-3xl text-neutral-500 dark:text-white/60 font-light tracking-wide"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: BREATH_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {breathState === 'in'
                  ? (locale === 'fr' ? 'Inspirez' : 'Breathe in')
                  : (locale === 'fr' ? 'Expirez' : 'Breathe out')}
              </motion.p>
            </motion.div>
          )}

          {/* Reveal Phase */}
          {phase === 'reveal' && (
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

        {/* Skip button during breathing */}
        {phase === 'breathe' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            onClick={() => setPhase('reveal')}
            className="absolute bottom-12 text-neutral-400 dark:text-white/30 text-sm hover:text-neutral-600 dark:hover:text-white/60 transition-colors duration-300"
          >
            {locale === 'fr' ? 'Passer' : 'Skip'}
          </motion.button>
        )}

        {/* Scroll indicator - only in reveal phase */}
        {phase === 'reveal' && (
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
