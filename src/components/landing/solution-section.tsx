'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

export function SolutionSection() {
  const { locale } = useLanguage()

  const points = [
    {
      en: 'A quiet space to check in with yourself.',
      fr: 'Un espace calme pour faire le point avec vous-même.',
    },
    {
      en: 'Small rituals that bring meaning to your day.',
      fr: 'De petits rituels qui donnent du sens à votre journée.',
    },
    {
      en: 'A way to notice the efforts you already make.',
      fr: 'Une façon de remarquer les efforts que vous faites déjà.',
    },
    {
      en: 'Connection with someone who understands your journey.',
      fr: 'Une connexion avec quelqu\'un qui comprend votre parcours.',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-400 mb-4">
              {locale === 'fr' ? 'Ce que nous avons créé' : 'What we built'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-6">
              {locale === 'fr' ? 'Voici Bloomsline.' : 'This is Bloomsline.'}
            </h2>
            <p className="text-xl text-neutral-500 leading-relaxed">
              {locale === 'fr'
                ? 'Une façon de vous reconnecter à vous-même. De donner du sens aux petits gestes. De voir que ce que vous faites compte.'
                : 'A way to reconnect with yourself. To find meaning in the small things. To see that what you do matters.'}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {points.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-neutral-50 rounded-2xl p-6"
              >
                <p className="text-neutral-700 leading-relaxed">
                  {locale === 'fr' ? point.fr : point.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
