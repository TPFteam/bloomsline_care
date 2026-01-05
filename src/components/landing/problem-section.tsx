'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

type AudienceType = 'member' | 'practitioner'

interface ProblemSectionProps {
  selectedAudience?: AudienceType
}

export function ProblemSection({ selectedAudience: initialAudience }: ProblemSectionProps) {
  const { locale } = useLanguage()
  const [audience, setAudience] = useState<AudienceType>(initialAudience || 'member')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#for-me' || hash === '#for-practitioners') {
        const newAudience = hash === '#for-me' ? 'member' : 'practitioner'
        setAudience(newAudience)
        const element = document.getElementById('problems')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const content = {
    member: {
      problems: [
        {
          en: 'Starting alone is overwhelming. Where do you even begin?',
          fr: 'Commencer seul est accablant. Par où commencer ?',
        },
        {
          en: 'Habits rarely stick. You start strong, then fall off after a week.',
          fr: 'Les habitudes tiennent rarement. Vous commencez fort, puis abandonnez après une semaine.',
        },
        {
          en: 'Apps send notifications. They do not provide real guidance.',
          fr: 'Les apps envoient des notifications. Elles ne fournissent pas de vraie guidance.',
        },
      ],
      cta: { en: 'Request Early Access', fr: 'Demander un accès anticipé' },
      link: '/early-access',
    },
    practitioner: {
      problems: [
        {
          en: 'Sessions end. Then you lose touch until the next appointment.',
          fr: 'Les séances se terminent. Puis vous perdez le contact jusqu\'au prochain rendez-vous.',
        },
        {
          en: 'Building resources from scratch takes hours you do not have.',
          fr: 'Créer des ressources à partir de zéro prend des heures que vous n\'avez pas.',
        },
        {
          en: 'You only see snapshots. Never the full picture of progress.',
          fr: 'Vous ne voyez que des instantanés. Jamais l\'image complète des progrès.',
        },
      ],
      cta: { en: 'Learn more', fr: 'En savoir plus' },
      link: '/practitioner',
    },
  }

  const current = content[audience]

  return (
    <section id="problems" className="pt-20 pb-12 sm:pt-24 sm:pb-16 bg-white scroll-mt-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-400 mb-4">
            {locale === 'fr' ? 'Le problème' : 'The problem'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900">
            {locale === 'fr' ? 'On comprend.' : 'We get it.'}
          </h2>
        </motion.div>

        {/* Toggle */}
        <div className="flex mb-8">
          <div className="inline-flex border-b border-neutral-200">
            <button
              onClick={() => setAudience('member')}
              className={`px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                audience === 'member'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {locale === 'fr' ? 'Pour moi' : 'For me'}
            </button>
            <button
              onClick={() => setAudience('practitioner')}
              className={`px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                audience === 'practitioner'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {locale === 'fr' ? 'Praticien' : 'Practitioner'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Problems */}
          <AnimatePresence mode="wait">
            <motion.div
              key={audience}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {current.problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <span className="text-neutral-300 text-lg font-light">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    {locale === 'fr' ? problem.fr : problem.en}
                  </p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="pt-6"
              >
                <Link href={current.link}>
                  <button className="group inline-flex items-center gap-2 text-neutral-900 font-medium hover:gap-3 transition-all">
                    {locale === 'fr' ? current.cta.fr : current.cta.en}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Right - Simple Visual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={audience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Simple line visual */}
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  {/* Broken/incomplete path representing the problem */}
                  <motion.path
                    d="M 50 250 Q 100 200 150 220 Q 200 240 200 180"
                    fill="none"
                    stroke={audience === 'member' ? '#C4B5FD' : '#99F6E4'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  {/* Gap - represents the break/problem */}
                  <motion.path
                    d="M 220 160 Q 280 100 350 120"
                    fill="none"
                    stroke={audience === 'member' ? '#C4B5FD' : '#99F6E4'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  />
                  {/* Dots at key points */}
                  <motion.circle
                    cx="50"
                    cy="250"
                    r="4"
                    fill={audience === 'member' ? '#8B5CF6' : '#14B8A6'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.circle
                    cx="200"
                    cy="180"
                    r="6"
                    fill={audience === 'member' ? '#8B5CF6' : '#14B8A6'}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  />
                  {/* Question mark at the break */}
                  <motion.text
                    x="210"
                    y="145"
                    className="text-2xl"
                    fill={audience === 'member' ? '#8B5CF6' : '#14B8A6'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1 }}
                  >
                    ?
                  </motion.text>
                </svg>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
