'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

export function BeliefSection() {
  const { locale } = useLanguage()

  const beliefs = [
    {
      highlight: { en: 'Change', fr: 'Le changement' },
      before: { en: '', fr: '' },
      after: {
        en: ' is not about doing more. It is about showing up, again and again.',
        fr: ', ce n\'est pas en faire plus. C\'est se présenter, encore et encore.',
      },
    },
    {
      highlight: { en: 'Motivation', fr: 'La motivation' },
      before: { en: 'You do not need ', fr: 'Vous n\'avez pas besoin de ' },
      after: {
        en: '. You need a small step you can take today.',
        fr: '. Vous avez besoin d\'un petit pas à faire aujourd\'hui.',
      },
    },
    {
      highlight: { en: 'Real support', fr: 'Le vrai soutien' },
      before: { en: '', fr: '' },
      after: {
        en: ' is not a notification. It is someone who sees your journey.',
        fr: ', ce n\'est pas une notification. C\'est quelqu\'un qui voit votre parcours.',
      },
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-neutral-900 dark:bg-neutral-950 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-4">
            {locale === 'fr' ? 'Ce que nous croyons' : 'What we believe'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-white">
            {locale === 'fr'
              ? 'Nous repensons ce que signifie vraiment grandir.'
              : 'We are rethinking what it actually means to grow.'}
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-16 sm:space-y-20">
          {beliefs.map((belief, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <p className={`text-2xl sm:text-3xl lg:text-4xl font-light leading-snug max-w-2xl ${
                index % 2 === 0 ? 'text-left' : 'text-right'
              }`}>
                <span className="text-neutral-400">
                  {locale === 'fr' ? belief.before.fr : belief.before.en}
                </span>
                <span className="text-white font-normal">
                  {locale === 'fr' ? belief.highlight.fr : belief.highlight.en}
                </span>
                <span className="text-neutral-400">
                  {locale === 'fr' ? belief.after.fr : belief.after.en}
                </span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
