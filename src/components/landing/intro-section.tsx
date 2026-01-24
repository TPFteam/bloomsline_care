'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

export function IntroSection() {
  const { locale } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Transform scroll progress to color transition
  const grayToColor = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 0, 1])
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [0.4, 1])

  const content = {
    en: {
      thought: "You know how life moves fast and we forget the small moments?",
      answer: "We help you capture those",
      details: "a photo, a voice note, or just a few words",
      feeling: "with how you felt.",
      pattern: "Over time, you see your patterns,",
      bloom: "and Bloom AI helps you make sense of it all.",
    },
    fr: {
      thought: "Vous savez comment la vie va vite et on oublie les petits moments ?",
      answer: "On vous aide à les capturer",
      details: "une photo, une note vocale, ou juste quelques mots",
      feeling: "avec ce que vous avez ressenti.",
      pattern: "Au fil du temps, vous voyez vos patterns,",
      bloom: "et Bloom IA vous aide à tout comprendre.",
    },
  }

  const t = locale === 'fr' ? content.fr : content.en

  return (
    <section
      ref={containerRef}
      className="py-24 md:py-36 bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden"
    >
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          className="text-center space-y-6"
          style={{ opacity: textOpacity }}
        >
          {/* The thought - starts gray */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#9ca3af', '#374151'])
            }}
          >
            {t.thought}
          </motion.p>

          {/* The answer - reveals in teal */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#9ca3af', '#0d9488'])
            }}
          >
            {t.answer}
          </motion.p>

          {/* The details - with em dashes */}
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#d1d5db', '#6b7280'])
            }}
          >
            — {t.details} —
          </motion.p>

          {/* With feeling */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#9ca3af', '#374151'])
            }}
          >
            {t.feeling}
          </motion.p>

          {/* Spacer */}
          <div className="py-4" />

          {/* Pattern recognition */}
          <motion.p
            className="text-xl md:text-2xl font-light leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#d1d5db', '#6b7280'])
            }}
          >
            {t.pattern}
          </motion.p>

          {/* Bloom AI - the finale in gradient */}
          <motion.p
            className="text-xl md:text-2xl font-medium leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#d1d5db', '#14b8a6'])
            }}
          >
            {t.bloom}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
