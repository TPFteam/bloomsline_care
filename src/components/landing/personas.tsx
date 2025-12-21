'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

export function Personas() {
  const { t } = useLanguage()

  const personas = [
    t.personas?.items?.[0] || 'Psychologists',
    t.personas?.items?.[1] || 'Psychotherapists',
    t.personas?.items?.[2] || 'Therapists',
    t.personas?.items?.[3] || 'Neuropsychologists',
    t.personas?.items?.[4] || 'Professional Coaches',
  ]

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-white" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-teal-600 to-lavender-600 bg-clip-text text-transparent">
            {t.personas?.title || 'Who thrives with Bloomsline'}
          </h2>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 max-w-4xl mx-auto">
          {personas.map((persona, index) => (
            <motion.span
              key={persona}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="px-6 py-3 bg-teal-50 hover:bg-teal-100 text-teal-600 text-base sm:text-lg font-medium rounded-full transition-colors cursor-default"
            >
              {persona}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
