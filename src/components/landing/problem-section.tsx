'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

type AudienceType = 'member' | 'practitioner'

interface ProblemSectionProps {
  selectedAudience?: AudienceType
}

interface StoryCard {
  id: string
  text: { en: string; fr: string }
  avatar: {
    color: string
    initials: string
  }
}

export function ProblemSection({ selectedAudience: initialAudience }: ProblemSectionProps) {
  const { locale } = useLanguage()
  const [audience, setAudience] = useState<AudienceType>(initialAudience || 'member')
  const [activeIndex, setActiveIndex] = useState(0)

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

  // Reset active index when audience changes
  useEffect(() => {
    setActiveIndex(0)
  }, [audience])

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

  const practitionerCards: StoryCard[] = [
    {
      id: 'practitioner-1',
      text: {
        en: "My client had a real breakthrough on Tuesday. We were both so hopeful. By our next session on Monday, they'd forgotten half of what we discussed. I wish I could be there for them in between.",
        fr: "Mon client a eu une vraie percée mardi. On était tous les deux si pleins d'espoir. À notre séance suivante lundi, il avait oublié la moitié de ce qu'on avait discuté.",
      },
      avatar: { color: 'bg-teal-500', initials: 'DR' },
    },
    {
      id: 'practitioner-2',
      text: {
        en: "I spend hours creating worksheets and resources that get used exactly once. I know there has to be a better way, but finding it takes time I don't have. So I keep reinventing the wheel.",
        fr: "Je passe des heures à créer des fiches et des ressources qui sont utilisées exactement une fois. Je sais qu'il doit y avoir un meilleur moyen, mais le trouver prend du temps que je n'ai pas.",
      },
      avatar: { color: 'bg-rose-500', initials: 'AP' },
    },
    {
      id: 'practitioner-3',
      text: {
        en: "They tell me they 'did okay' this week. But what does that really mean? I'm working with snapshots, trying to piece together a picture I can't fully see.",
        fr: "Ils me disent qu'ils ont 'plutôt bien été' cette semaine. Mais qu'est-ce que ça veut vraiment dire ? Je travaille avec des instantanés, essayant de reconstituer une image que je ne peux pas voir.",
      },
      avatar: { color: 'bg-blue-500', initials: 'LM' },
    },
  ]

  const cards = audience === 'member' ? memberCards : practitionerCards

  const handleCardClick = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length)
  }

  const headlines = {
    member: {
      en: 'Sound familiar?',
      fr: 'Ça vous parle ?',
    },
    practitioner: {
      en: 'Sound familiar?',
      fr: 'Ça vous parle ?',
    },
  }

  const subheadlines = {
    member: {
      en: "You're not alone. These are the moments that slip through the cracks—the ones no app notification can fix.",
      fr: "Vous n'êtes pas seul. Ce sont ces moments qui passent entre les mailles du filet—ceux qu'aucune notification ne peut résoudre.",
    },
    practitioner: {
      en: "You're not alone. These gaps in care aren't your fault—they're a limitation of the tools we've had until now.",
      fr: "Vous n'êtes pas seul. Ces lacunes dans l'accompagnement ne sont pas de votre faute—ce sont les limites des outils dont nous disposions.",
    },
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
    <section id="problems" className="pt-16 pb-24 sm:pt-20 sm:pb-32 bg-neutral-50 scroll-mt-16">
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

        {/* Toggle - centered, subtle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setAudience('member')}
              className={`px-6 py-2 text-sm font-medium transition-all rounded-full ${
                audience === 'member'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {locale === 'fr' ? 'Pour moi' : 'For me'}
            </button>
            <button
              onClick={() => setAudience('practitioner')}
              className={`px-6 py-2 text-sm font-medium transition-all rounded-full ${
                audience === 'practitioner'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {locale === 'fr' ? "J'accompagne" : "I guide others"}
            </button>
          </div>
        </motion.div>

        {/* Main content - Cards on left, text on right */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Left - Stacked Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={audience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative h-[320px] sm:h-[280px] flex items-center justify-center cursor-pointer"
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
                      <p className="text-sm sm:text-base leading-relaxed font-light text-white/90">
                        {locale === 'fr' ? card.text.fr : card.text.en}
                      </p>
                    </div>
                  </motion.div>
                )
              })}

              {/* Click hint */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-400">
                {locale === 'fr' ? 'Cliquez pour voir plus' : 'Click to see more'}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right - Headline and context */}
          <AnimatePresence mode="wait">
            <motion.div
              key={audience}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:pl-8"
            >
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 mb-6"
              >
                {locale === 'fr' ? headlines[audience].fr : headlines[audience].en}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-lg text-neutral-600 leading-relaxed mb-8"
              >
                {locale === 'fr' ? subheadlines[audience].fr : subheadlines[audience].en}
              </motion.p>

              {/* Card indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
