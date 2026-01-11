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
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900">
            {t.personas?.title || 'Who thrives with Bloomsline'}
          </h2>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {personas.map((persona, index) => (
            <motion.span
              key={persona}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-sm sm:text-base font-medium rounded-full transition-colors cursor-default"
            >
              {persona}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
