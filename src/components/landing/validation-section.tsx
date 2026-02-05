'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

type AudienceType = 'member' | 'practitioner'

export function ValidationSection() {
  const { locale } = useLanguage()
  const [audience, setAudience] = useState<AudienceType>('member')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#for-me') {
        setAudience('member')
      } else if (hash === '#for-practitioners') {
        setAudience('practitioner')
      }
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const content = {
    member: {
      stats: [
        {
          number: '96%',
          text: {
            en: 'of wellness app users stop using the app within 30 days.',
            fr: 'des utilisateurs d\'apps bien-être arrêtent dans les 30 jours.',
            es: 'de los usuarios de apps de bienestar dejan de usarla en 30 días.',
          },
          source: 'Business of Apps, 2024',
          sourceUrl: 'https://www.businessofapps.com/data/health-fitness-app-benchmarks/',
        },
        {
          number: '66',
          suffix: {
            en: 'days',
            fr: 'jours',
            es: 'días',
          },
          text: {
            en: 'on average to form a habit. Most people give up in the first two weeks.',
            fr: 'en moyenne pour former une habitude. La plupart abandonnent en deux semaines.',
            es: 'en promedio para formar un hábito. La mayoría se rinde en las primeras dos semanas.',
          },
          source: 'European Journal of Social Psychology',
          sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3505409/',
        },
        {
          number: '80%',
          text: {
            en: 'of mental health app users drop off within the first 10 days.',
            fr: 'des utilisateurs d\'apps santé mentale abandonnent en 10 jours.',
            es: 'de los usuarios de apps de salud mental abandonan en los primeros 10 días.',
          },
          source: 'JMIR Research',
          sourceUrl: 'https://www.researchgate.net/figure/App-30-day-retention-by-mental-health-focus-The-percentages-reflect-the-number-of-users_fig2_334562120',
        },
      ],
    },
    practitioner: {
      stats: [
        {
          number: '#1',
          text: {
            en: 'barrier to therapy progress: clients forgetting what to practice between sessions.',
            fr: 'obstacle aux progrès en thérapie: les clients oublient quoi pratiquer entre les séances.',
            es: 'barrera para el progreso terapéutico: los clientes olvidan qué practicar entre sesiones.',
          },
          source: 'PMC Research, 2024',
          sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11671782/',
        },
        {
          number: '7',
          suffix: {
            en: 'days',
            fr: 'jours',
            es: 'días',
          },
          text: {
            en: 'is all it takes for clients to forget most of what was discussed in session.',
            fr: 'suffisent pour que les clients oublient la plupart de ce qui a été discuté.',
            es: 'es todo lo que se necesita para que los clientes olviden la mayor parte de lo discutido en sesión.',
          },
          source: 'Cognitive Therapy Research',
          sourceUrl: 'https://link.springer.com/article/10.1007/s10608-020-10136-x',
        },
        {
          number: '2x',
          text: {
            en: 'better outcomes when clients have support between sessions.',
            fr: 'meilleurs résultats quand les clients ont du soutien entre les séances.',
            es: 'mejores resultados cuando los clientes tienen apoyo entre sesiones.',
          },
          source: 'Journal of Clinical Psychology',
          sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16319035/',
        },
      ],
    },
  }

  const current = content[audience]

  return (
    <section className="pt-12 pb-20 sm:pt-16 sm:pb-28 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-400 mb-4">
            {locale === 'fr' ? 'Ce n\'est pas vous' : locale === 'es' ? 'No eres tú' : 'It is not you'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 max-w-2xl mx-auto">
            {locale === 'fr'
              ? 'Le système est conçu contre vous.'
              : locale === 'es'
              ? 'El sistema está diseñado en tu contra.'
              : 'The system is designed against you.'}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {current.stats.map((stat, index) => (
            <motion.div
              key={`${audience}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-5xl sm:text-6xl font-light mb-4 text-neutral-900">
                {stat.number}
                {stat.suffix && (
                  <span className="text-2xl sm:text-3xl ml-1">
                    {locale === 'fr' ? stat.suffix.fr : locale === 'es' ? stat.suffix.es : stat.suffix.en}
                  </span>
                )}
              </div>
              <p className="text-neutral-600 leading-relaxed mb-3">
                {locale === 'fr' ? stat.text.fr : locale === 'es' ? stat.text.es : stat.text.en}
              </p>
              <a
                href={stat.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {stat.source}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
