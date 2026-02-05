'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { RefreshCw, Footprints, Eye } from 'lucide-react'

export function BeliefSection() {
  const { locale } = useLanguage()

  const beliefs = [
    {
      icon: RefreshCw,
      highlight: { en: 'Change', fr: 'Le changement', es: 'El cambio' },
      before: { en: '', fr: '', es: '' },
      after: {
        en: ' is not about doing more. It is about showing up, again and again.',
        fr: ', ce n\'est pas en faire plus. C\'est se présenter, encore et encore.',
        es: ' no se trata de hacer más. Se trata de estar presente, una y otra vez.',
      },
    },
    {
      icon: Footprints,
      highlight: { en: 'Motivation', fr: 'La motivation', es: 'Motivación' },
      before: { en: 'You do not need ', fr: 'Vous n\'avez pas besoin de ', es: 'No necesitas ' },
      after: {
        en: '. You need a small step you can take today.',
        fr: '. Vous avez besoin d\'un petit pas à faire aujourd\'hui.',
        es: '. Necesitas un pequeño paso que puedas dar hoy.',
      },
    },
    {
      icon: Eye,
      highlight: { en: 'Real support', fr: 'Le vrai soutien', es: 'El verdadero apoyo' },
      before: { en: '', fr: '', es: '' },
      after: {
        en: ' is not a notification. It is someone who sees your journey.',
        fr: ', ce n\'est pas une notification. C\'est quelqu\'un qui voit votre parcours.',
        es: ' no es una notificación. Es alguien que ve tu camino.',
      },
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-neutral-900 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-light text-white">
            {locale === 'fr'
              ? 'Nous repensons ce que signifie vraiment grandir.'
              : locale === 'es'
              ? 'Estamos repensando lo que realmente significa crecer.'
              : 'We are rethinking what it actually means to grow.'}
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-16 sm:space-y-20">
          {beliefs.map((belief, index) => {
            const Icon = belief.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-2xl ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                  {/* Icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                    className={`mb-4 ${index % 2 === 0 ? '' : 'flex justify-end'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                  </motion.div>
                  {/* Text */}
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-light leading-snug">
                    <span className="text-neutral-400">
                      {locale === 'fr' ? belief.before.fr : locale === 'es' ? belief.before.es : belief.before.en}
                    </span>
                    <span className="text-white font-normal">
                      {locale === 'fr' ? belief.highlight.fr : locale === 'es' ? belief.highlight.es : belief.highlight.en}
                    </span>
                    <span className="text-neutral-400">
                      {locale === 'fr' ? belief.after.fr : locale === 'es' ? belief.after.es : belief.after.en}
                    </span>
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
