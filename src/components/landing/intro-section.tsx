'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Camera, Mic, PenLine, Sparkles } from 'lucide-react'

export function IntroSection() {
  const { locale } = useLanguage()

  const content = {
    en: {
      headline: 'Life moves fast.',
      subheadline: 'We forget the good moments.',
      description: 'Bloomsline lets you capture them — photos, voice notes, written reflections — with how you felt. Over time, you see your patterns, and Bloom AI helps you make sense of it all.',
    },
    fr: {
      headline: 'La vie va vite.',
      subheadline: 'On oublie les bons moments.',
      description: 'Bloomsline vous permet de les capturer — photos, notes vocales, réflexions écrites — avec ce que vous avez ressenti. Au fil du temps, vous voyez vos patterns, et Bloom IA vous aide à tout comprendre.',
    },
  }

  const t = locale === 'fr' ? content.fr : content.en

  const captureTypes = [
    { icon: Camera, label: locale === 'fr' ? 'Photos' : 'Photos' },
    { icon: Mic, label: locale === 'fr' ? 'Notes vocales' : 'Voice notes' },
    { icon: PenLine, label: locale === 'fr' ? 'Réflexions' : 'Reflections' },
  ]

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            {t.headline}
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-teal-600 mb-8">
            {t.subheadline}
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-12">
            {t.description}
          </p>

          {/* Capture types */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            {captureTypes.map((type, index) => (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100"
              >
                <type.icon className="w-5 h-5 text-teal-500" />
                <span className="text-gray-700 font-medium">{type.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bloom AI mention */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full"
          >
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="text-teal-700 font-medium">
              {locale === 'fr' ? 'Bloom IA vous aide à tout comprendre' : 'Bloom AI helps you make sense of it all'}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
