'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

interface StoryCard {
  id: string
  text: { en: string; fr: string }
  avatar: {
    color: string
    initials: string
  }
}

export function ProblemSection() {
  const { locale } = useLanguage()
  const [activeIndex, setActiveIndex] = useState(0)

  const memberCards: StoryCard[] = [
    {
      id: 'member-1',
      text: {
        en: "I journaled for three days straight last week. Nobody noticed. I barely noticed. Then I missed a day and felt like I failed all over again. Why is it so hard to give myself credit for the small things?",
        fr: "J'ai tenu mon journal pendant trois jours d'affilée la semaine dernière. Personne n'a remarqué. J'ai à peine remarqué moi-même. Puis j'ai manqué un jour et j'ai eu l'impression d'avoir tout raté.",
      },
      avatar: { color: 'bg-violet-500', initials: 'SK' },
    },
    {
      id: 'member-2',
      text: {
        en: "Between work, family, and everything else... by the time I have a moment for myself, I'm too exhausted to do anything meaningful. Self-care feels like just another item on an endless to-do list.",
        fr: "Entre le travail, la famille et tout le reste... quand j'ai enfin un moment pour moi, je suis trop épuisé pour faire quoi que ce soit de significatif.",
      },
      avatar: { color: 'bg-emerald-500', initials: 'MR' },
    },
    {
      id: 'member-3',
      text: {
        en: "I've downloaded probably ten different wellness apps. They all work for about a week. Then I get busy, the notifications pile up, and they just become guilt reminders.",
        fr: "J'ai probablement téléchargé dix applications de bien-être différentes. Elles fonctionnent toutes pendant environ une semaine. Puis les notifications s'accumulent et deviennent des rappels de culpabilité.",
      },
      avatar: { color: 'bg-amber-500', initials: 'JL' },
    },
  ]

  const cards = memberCards

  const handleCardClick = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length)
  }

  const headline = {
    en: 'Sound familiar?',
    fr: 'Ça vous parle ?',
  }

  const subheadline = {
    en: "You're not alone. These are the moments that slip through the cracks—the ones no app notification can fix.",
    fr: "Vous n'êtes pas seul. Ce sont ces moments qui passent entre les mailles du filet—ceux qu'aucune notification ne peut résoudre.",
  }

  // Card positions for the stacked effect
  const getCardStyle = (index: number) => {
    const position = (index - activeIndex + cards.length) % cards.length

    if (position === 0) {
      // Front card
      return {
        zIndex: 30,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
      }
    } else if (position === 1) {
      // Back left card
      return {
        zIndex: 20,
        x: -40,
        y: 10,
        rotate: -8,
        scale: 0.95,
        opacity: 0.7,
      }
    } else {
      // Back right card
      return {
        zIndex: 10,
        x: 40,
        y: 10,
        rotate: 8,
        scale: 0.95,
        opacity: 0.7,
      }
    }
  }

  return (
    <section id="problems" className="pt-16 pb-24 sm:pt-20 sm:pb-32 bg-neutral-50 scroll-mt-16 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-400">
            {locale === 'fr' ? 'Le problème' : 'The problem'}
          </p>
        </motion.div>

        {/* Main content - Cards on left, text on right */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Left - Stacked Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative h-[320px] sm:h-[280px] flex items-center justify-center cursor-pointer px-12"
            onClick={handleCardClick}
          >
              {cards.map((card, index) => {
                const style = getCardStyle(index)
                return (
                  <motion.div
                    key={card.id}
                    initial={false}
                    animate={{
                      x: style.x,
                      y: style.y,
                      rotate: style.rotate,
                      scale: style.scale,
                      opacity: style.opacity,
                      zIndex: style.zIndex,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="absolute w-full max-w-[340px] sm:max-w-[380px]"
                  >
                    <div className="rounded-2xl bg-neutral-900/95 backdrop-blur-sm p-6 sm:p-8 text-white shadow-2xl border border-white/10">
                      {/* Avatar */}
                      <div className="flex items-center gap-3 mb-4">
                        <motion.div
                          animate={{
                            y: [0, -3, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className={`w-10 h-10 rounded-full ${card.avatar.color} flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-white text-sm font-medium">{card.avatar.initials}</span>
                        </motion.div>
                        <div className="flex items-center gap-1.5">
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-white/60"
                          />
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-white/60"
                          />
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-white/60"
                          />
                        </div>
                      </div>
                      {/* Text content */}
                      <p className="text-sm sm:text-base leading-relaxed font-light text-white/90 mb-4">
                        {locale === 'fr' ? card.text.fr : card.text.en}
                      </p>
                      {/* Relate button */}
                      <button className="text-xs text-white/50 hover:text-white/80 transition-colors border border-white/20 hover:border-white/40 rounded-full px-3 py-1">
                        {locale === 'fr' ? 'Je ressens ça' : 'I feel this'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}

              {/* Click hint */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-400">
                {locale === 'fr' ? 'Cliquez pour voir plus' : 'Click to see more'}
              </div>
            </motion.div>

          {/* Right - Headline and context */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:pl-8"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 mb-6"
            >
              {locale === 'fr' ? headline.fr : headline.en}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-lg text-neutral-600 leading-relaxed mb-8"
            >
              {locale === 'fr' ? subheadline.fr : subheadline.en}
            </motion.p>

            {/* Card indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex gap-2"
            >
              {cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === activeIndex
                      ? 'bg-neutral-900 w-6'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
