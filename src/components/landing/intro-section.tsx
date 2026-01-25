'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Camera, Mic, Heart } from 'lucide-react'

export function IntroSection() {
  const { locale } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  })

  // Staggered reveal for each element
  const line1Opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const line1Y = useTransform(scrollYProgress, [0, 0.2], [30, 0])

  const line2Opacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1])
  const line2Y = useTransform(scrollYProgress, [0.15, 0.35], [30, 0])

  const iconsOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1])
  const iconsY = useTransform(scrollYProgress, [0.3, 0.5], [20, 0])

  const line3Opacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1])
  const line3Y = useTransform(scrollYProgress, [0.4, 0.6], [30, 0])

  const line4Opacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1])
  const line4Y = useTransform(scrollYProgress, [0.55, 0.75], [30, 0])

  const line5Opacity = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])
  const line5Y = useTransform(scrollYProgress, [0.7, 0.9], [30, 0])

  const content = {
    en: {
      thought: "You know how life moves fast and we forget the small moments?",
      answer: "We help you capture those",
      details: "a photo, a voice note, or just how you're feeling",
      pattern: "Over time, you see your patterns, understand yourself better, and take gentler steps forward.",
      bloom: "When you need a gentle nudge, Bloom is there.",
    },
    fr: {
      thought: "Vous savez comment la vie va vite et on oublie les petits moments ?",
      answer: "On vous aide à les capturer",
      details: "une photo, une note vocale, ou juste ce que vous ressentez",
      pattern: "Au fil du temps, vous voyez vos patterns, vous comprenez mieux, et vous avancez plus doucement.",
      bloom: "Quand vous avez besoin d'un petit coup de pouce, Bloom est là.",
    },
  }

  const t = locale === 'fr' ? content.fr : content.en

  const captureIcons = [
    { Icon: Camera, color: '#14b8a6', bg: '#ccfbf1' },
    { Icon: Mic, color: '#f59e0b', bg: '#fef3c7' },
    { Icon: Heart, color: '#ec4899', bg: '#fce7f3' },
  ]

  return (
    <section
      ref={containerRef}
      className="min-h-[80vh] py-24 md:py-36 bg-gradient-to-b from-white via-gray-50/30 to-white flex items-center"
    >
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center space-y-8">
          {/* Line 1 - The thought */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-gray-600"
            style={{ opacity: line1Opacity, y: line1Y }}
          >
            {t.thought}
          </motion.p>

          {/* Line 2 - The answer */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-relaxed text-teal-600"
            style={{ opacity: line2Opacity, y: line2Y }}
          >
            {t.answer}
          </motion.p>

          {/* Icons */}
          <motion.div
            className="flex justify-center gap-5 py-4"
            style={{ opacity: iconsOpacity, y: iconsY }}
          >
            {captureIcons.map(({ Icon, color, bg }, index) => (
              <motion.div
                key={index}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: bg }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </motion.div>
            ))}
          </motion.div>

          {/* Line 3 - The details */}
          <motion.p
            className="text-xl md:text-2xl font-light leading-relaxed text-gray-500"
            style={{ opacity: line3Opacity, y: line3Y }}
          >
            {t.details}
          </motion.p>

          {/* Divider */}
          <motion.div
            className="flex justify-center"
            style={{ opacity: line4Opacity }}
          >
            <div className="w-16 h-px bg-gray-200" />
          </motion.div>

          {/* Line 4 - Pattern */}
          <motion.p
            className="text-lg md:text-xl font-light leading-relaxed text-gray-600 max-w-2xl mx-auto"
            style={{ opacity: line4Opacity, y: line4Y }}
          >
            {t.pattern}
          </motion.p>

          {/* Line 5 - Bloom */}
          <motion.p
            className="text-lg md:text-xl font-medium leading-relaxed text-teal-600"
            style={{ opacity: line5Opacity, y: line5Y }}
          >
            {t.bloom}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
