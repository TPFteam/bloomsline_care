'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Lock,
  Brain,
  Heart,
  Calendar,
  Clock,
  ChevronDown,
  Zap,
  MessageSquare,
} from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { TabProvider } from '@/lib/landing/tab-context'
import { EarlyAccessModalProvider, useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'
import { useLanguage } from '@/lib/i18n/context'
import { GlimpseSection } from '@/components/landing/glimpse-section'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

/* ─── Hero Conveyor ─── */

function HeroConveyor({ locale, l, content, onCta }: { locale: string; l: (obj: { en: string; fr: string }) => string; content: any; onCta: () => void }) {
  const fr = locale === 'fr'

  const cards = [
    { icon: Clock, iconColor: 'text-blue-500', iconBg: 'bg-blue-100' },
    { icon: Heart, iconColor: 'text-rose-500', iconBg: 'bg-rose-100' },
    { icon: MessageSquare, iconColor: 'text-teal-500', iconBg: 'bg-teal-100' },
    { icon: Zap, iconColor: 'text-amber-500', iconBg: 'bg-amber-100' },
    { icon: Brain, iconColor: 'text-violet-500', iconBg: 'bg-violet-100' },
  ]

  const captions = [
    fr ? 'Prêt en quelques secondes' : 'Ready in seconds',
    fr ? 'Capturé sans effort' : 'Captured effortlessly',
    fr ? 'Toujours connecté' : 'Always connected',
    fr ? 'Des progrès visibles' : 'Progress you can see',
    fr ? 'L\'IA qui vous écoute' : 'AI that listens to you',
  ]

  const CardContent = ({ idx }: { idx: number }) => {
    if (idx === 0) {
      return (
        <div className="p-4 w-56 sm:w-64">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-3">{fr ? 'Avant la séance' : 'Before session'}</p>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">SL</span>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-700">Sarah L.</p>
              <p className="text-[10px] text-neutral-400">{fr ? 'Contexte chargé' : 'Context loaded'}</p>
            </div>
          </div>
          {[0.4, 0.6, 0.8].map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: d }} className={`h-2 bg-blue-100 rounded mb-1.5 ${i === 2 ? 'w-3/5' : i === 1 ? 'w-4/5' : 'w-full'}`} />
          ))}
        </div>
      )
    }
    if (idx === 1) {
      return (
        <div className="p-4 w-56 sm:w-64">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-3">{fr ? 'Pendant la séance' : 'During session'}</p>
          {[0, 0.3, 0.6].map((d, i) => (
            <motion.div key={i} initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: d, duration: 0.3 }}
              className={`h-2 bg-rose-100 rounded mb-2 ${i === 2 ? 'w-3/5' : i === 1 ? 'w-full' : 'w-5/6'}`}
            />
          ))}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-[10px] text-rose-400 mt-1 italic">
            {fr ? '"Se sent plus légère"' : '"Feeling lighter this week"'}
          </motion.p>
        </div>
      )
    }
    if (idx === 2) {
      return (
        <div className="p-4 w-56 sm:w-64">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-3">{fr ? 'Entre les séances' : 'Between sessions'}</p>
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-neutral-100 rounded-2xl rounded-tl-sm px-3 py-2 w-4/5 mb-2">
            <p className="text-[10px] text-neutral-500">{fr ? 'Soirée difficile...' : 'Tough evening...'}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-teal-100 rounded-2xl rounded-tr-sm px-3 py-2 w-4/5 ml-auto">
            <p className="text-[10px] text-teal-600">{fr ? 'Bloom est là pour vous' : 'Bloom is here for you'}</p>
          </motion.div>
        </div>
      )
    }
    if (idx === 3) {
      const stages = [
        { label: fr ? 'Compréhension' : 'Discovery', color: 'bg-blue-400' },
        { label: fr ? 'Évolution' : 'Thriving', color: 'bg-teal-400' },
        { label: fr ? 'Ancrage' : 'Building', color: 'bg-amber-400' },
        { label: fr ? 'Autonomie' : 'Independent', color: 'bg-violet-400' },
      ]
      return (
        <div className="p-4 w-56 sm:w-64">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-4">{fr ? 'Parcours' : 'Journey'}</p>
          <div className="flex items-center gap-1">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.35, type: 'spring', stiffness: 200 }}
                  className={`w-5 h-5 rounded-full ${i < 3 ? s.color : 'bg-neutral-200'} flex items-center justify-center shrink-0`}
                >
                  {i < 3 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.35 }} className="w-1.5 h-1.5 rounded-full bg-white" />}
                </motion.div>
                {i < stages.length - 1 && (
                  <motion.div initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: i < 2 ? 1 : 0 }} transition={{ delay: 0.6 + i * 0.35, duration: 0.3 }}
                    className={`h-0.5 flex-1 mx-0.5 ${s.color}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {stages.map((s, i) => (
              <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: i < 3 ? 1 : 0.3 }} transition={{ delay: 0.4 + i * 0.35 }}
                className="text-[8px] text-neutral-400 w-1/4 text-center">{s.label}</motion.span>
            ))}
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="text-[10px] text-teal-500 mt-3 font-medium text-center">
            {fr ? 'Sarah avance bien' : 'Sarah is making progress'}
          </motion.p>
        </div>
      )
    }
    /* Bloom pulse */
    return (
      <div className="p-4 w-56 sm:w-64">
        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-3">Bloom Pulse</p>
        <div className="flex items-center gap-3">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-full bg-violet-400" />
          </motion.div>
          <div className="flex-1 space-y-1.5">
            {[0.3, 0.5, 0.7].map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: d }}
                className={`h-2 bg-violet-100 rounded ${i === 2 ? 'w-3/5' : i === 1 ? 'w-4/5' : 'w-full'}`}
              />
            ))}
          </div>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-[10px] text-violet-400 mt-2 italic">
          {fr ? 'Tendance positive détectée' : 'Positive trend detected'}
        </motion.p>
      </div>
    )
  }

  const n = cards.length
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % n)
    }, 5000)
    return () => clearInterval(interval)
  }, [n, paused])

  // Resume auto-play after 10s of no interaction
  useEffect(() => {
    if (!paused) return
    const timeout = setTimeout(() => setPaused(false), 10000)
    return () => clearTimeout(timeout)
  }, [paused, activeIdx])

  const goTo = (idx: number) => {
    setPaused(true)
    setActiveIdx(idx)
  }

  const getIdx = (offset: number) => ((activeIdx + offset) % n + n) % n

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-28 pb-12 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/80 via-white to-white" />

      <div className="relative container mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-400"
        >
          {l(content.hero.tagline)}
        </motion.p>

        {/* Conveyor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative w-full max-w-4xl mx-auto overflow-hidden"
          style={{ height: 'clamp(240px, 30vw, 300px)' }}
        >
          {(() => { const c = cards[getIdx(-2)]; const I = c.icon; return (
            <motion.div key={`fl-${activeIdx}`} initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute left-0 top-1/2 -translate-y-1/2">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${c.iconBg} flex items-center justify-center opacity-30`}><I className={`w-5 h-5 ${c.iconColor}`} /></div>
            </motion.div>
          ) })()}

          {(() => { const c = cards[getIdx(-1)]; const I = c.icon; return (
            <motion.div key={`l-${activeIdx}`} initial={{ x: 10, opacity: 0.2 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute left-[10%] sm:left-[14%] top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => goTo(getIdx(-1))}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${c.iconBg} flex items-center justify-center opacity-50 shadow-sm hover:opacity-70 transition-opacity`}><I className={`w-7 h-7 ${c.iconColor}`} /></div>
            </motion.div>
          ) })()}

          {/* CENTER — card in fixed area */}
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white border border-neutral-100 rounded-2xl shadow-lg overflow-hidden"
                >
                  <CardContent idx={activeIdx} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Caption + dots — pinned to bottom of carousel area */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-block text-sm text-neutral-400 italic"
              >
                {captions[activeIdx]}
              </motion.span>
            </AnimatePresence>

            <div className="flex items-center gap-2 mt-2">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIdx
                      ? 'w-6 h-2 bg-teal-500'
                      : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {(() => { const c = cards[getIdx(1)]; const I = c.icon; return (
            <motion.div key={`r-${activeIdx}`} initial={{ x: -10, opacity: 0.2 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute right-[10%] sm:right-[14%] top-1/2 -translate-y-1/2 cursor-pointer" onClick={() => goTo(getIdx(1))}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${c.iconBg} flex items-center justify-center opacity-50 shadow-sm hover:opacity-70 transition-opacity`}><I className={`w-7 h-7 ${c.iconColor}`} /></div>
            </motion.div>
          ) })()}

          {(() => { const c = cards[getIdx(2)]; const I = c.icon; return (
            <motion.div key={`fr-${activeIdx}`} initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute right-0 top-1/2 -translate-y-1/2">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${c.iconBg} flex items-center justify-center opacity-30`}><I className={`w-5 h-5 ${c.iconColor}`} /></div>
            </motion.div>
          ) })()}
        </motion.div>

        {/* Text */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-2xl sm:text-3xl font-semibold text-neutral-700 tracking-tight"
        >
          {l(content.hero.headline)}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-3 sm:mt-4 text-sm sm:text-lg text-neutral-500 max-w-xl mx-auto"
        >
          {l(content.hero.subtitle)}{' '}
          <span className="text-neutral-700 font-semibold">{l(content.hero.subtitleHighlight)}</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4"
        >
          <button
            onClick={onCta}
            className="px-6 py-3 sm:px-8 sm:py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-teal-600/25 text-sm sm:text-base"
            style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
          >
            {l(content.hero.cta)}
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 sm:px-8 sm:py-4 rounded-full border border-neutral-200 text-neutral-500 font-medium inline-flex items-center gap-2 hover:border-neutral-300 hover:text-neutral-700 transition-colors text-sm sm:text-base"
          >
            {locale === 'fr' ? 'Parlons-en' : 'Talk to us'}
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-4 text-sm text-neutral-400"
        >
          <a href="/for-everyone" className="text-neutral-500 underline underline-offset-2 hover:text-neutral-700 transition-colors">
            {locale === 'fr' ? 'Pour votre bien-être personnel →' : 'For your personal wellbeing →'}
          </a>
        </motion.p>
      </div>
    </section>
  )
}

/* ─── Page Content ─── */

function PractitionerContent() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleOpenModal = () => {
    openModal('practitioner')
  }

  const content = {
    hero: {
      tagline: { en: 'For Mental Health Practitioners', fr: 'Pour les praticiens en santé mentale' },
      headline: { en: 'Less admin, more presence.', fr: 'Moins d\'admin, plus de présence.' },
      subtitle: { en: 'Prepare faster, keep everything organized, track real progress, and share the right resources.', fr: 'Préparez plus vite, gardez tout organisé, suivez les vrais progrès et partagez les bonnes ressources.' },
      subtitleHighlight: { en: 'All from one simple place.', fr: 'Le tout depuis un seul endroit.' },
      cta: { en: 'Get Early Access', fr: 'Accès anticipé' },
      trust: { en: 'No credit card required', fr: 'Pas de carte de crédit requise' },
    },
    dayWith: {
      headline: { en: 'How it fits into your day', fr: 'Comment ça s\'intègre à votre journée' },
      subtitle: { en: 'Same people. Same practice. Less friction.', fr: 'Les mêmes personnes. La même pratique. Moins de friction.' },
      moments: [
        { time: { en: 'Before a session', fr: 'Avant une séance' }, pain: { en: 'Notes pile up, context gets lost', fr: 'Les notes s\'accumulent, le contexte se perd' }, description: { en: 'Everything you need, already there. No digging.', fr: 'Tout ce qu\'il vous faut, déjà là. Sans chercher.' }, icon: Clock },
        { time: { en: 'During a session', fr: 'Pendant une séance' }, pain: { en: 'Admin steals time from what matters', fr: 'L\'administratif vole du temps à l\'essentiel' }, description: { en: 'Stay present. Notes flow. Nothing gets lost.', fr: 'Restez présent. Les notes coulent. Rien ne se perd.' }, icon: Heart },
        { time: { en: 'Between sessions', fr: 'Entre les séances' }, pain: { en: 'The connection fades', fr: 'La connexion s\'estompe' }, description: { en: 'They reflect, access resources, and feel supported on their own.', fr: 'Ils réfléchissent, accèdent aux ressources et se sentent soutenus seuls.' }, icon: MessageSquare },
        { time: { en: 'Over time', fr: 'Au fil du temps' }, pain: { en: 'Progress lives in your head, not on screen', fr: 'Les progrès restent dans votre tête, pas à l\'écran' }, description: { en: 'See real progress, not just snapshots.', fr: 'Voyez les vrais progrès, pas juste des instantanés.' }, icon: Zap },
      ],
    },
    aiTrust: {
      badge: { en: 'About AI', fr: 'À propos de l\'IA' },
      headline: { en: 'AI that supports your judgment,', fr: 'Une IA qui soutient votre jugement,' },
      headlineAccent: { en: 'never replaces it.', fr: 'ne le remplace jamais.' },
      highlight: { en: 'It never interprets. Never diagnoses. Always defers to you.', fr: 'Elle n\'interprète jamais. Ne diagnostique jamais. Vous laisse toujours le dernier mot.' },
    },
    audience: {
      headline: { en: 'Built for', fr: 'Conçu pour' },
      subtitle: { en: 'Less admin, more time with the people you care about.', fr: 'Moins d\'administratif, plus de temps avec ceux qui comptent.' },
      types: [
        { en: 'Psychotherapists', fr: 'Psychothérapeutes' },
        { en: 'Psychologists', fr: 'Psychologues' },
        { en: 'Counselors', fr: 'Conseillers' },
        { en: 'Coaches', fr: 'Coachs' },
        { en: 'Social Workers', fr: 'Travailleurs sociaux' },
        { en: 'Art Therapists', fr: 'Art-thérapeutes' },
      ],
    },
    security: {
      headline: { en: 'Their trust is everything', fr: 'Leur confiance est primordiale' },
      subtitle: { en: 'We take that as seriously as you do.', fr: 'Nous prenons cela aussi au sérieux que vous.' },
    },
    faq: {
      items: [
        { q: { en: 'Will Bloomsline change how I work?', fr: 'Bloomsline va-t-il changer ma façon de travailler ?' }, a: { en: 'No. Bloomsline adapts to your workflow. Use as much or as little as you need. Start small and expand when you\'re ready.', fr: 'Non. Bloomsline s\'adapte à votre flux de travail. Utilisez autant ou aussi peu que nécessaire. Commencez petit et étendez quand vous êtes prêt.' } },
        { q: { en: 'Is AI required?', fr: 'L\'IA est-elle obligatoire ?' }, a: { en: 'No. AI features are completely optional. You can use Bloomsline purely for organizing your practice — no AI needed.', fr: 'Non. Les fonctionnalités IA sont entièrement optionnelles. Vous pouvez utiliser Bloomsline uniquement pour organiser votre pratique — aucune IA nécessaire.' } },
        { q: { en: 'Is my clients\' data safe?', fr: 'Les données de mes clients sont-elles en sécurité ?' }, a: { en: 'Yes. Encryption at every level, GDPR compliant, and your data is never used to train anything. You can delete any data permanently at any time.', fr: 'Oui. Chiffrement à tous les niveaux, conforme RGPD, et vos données ne sont jamais utilisées pour entraîner quoi que ce soit. Vous pouvez tout supprimer définitivement à tout moment.' } },
        { q: { en: 'What if it doesn\'t fit my practice?', fr: 'Et si ça ne correspond pas à ma pratique ?' }, a: { en: 'Try it free. No commitment, no credit card. If it\'s not for you, no hard feelings.', fr: 'Essayez gratuitement. Sans engagement, sans carte de crédit. Si ce n\'est pas pour vous, pas de problème.' } },
      ],
    },
    cta: {
      headline: { en: 'Less admin. More connection.', fr: 'Moins d\'administratif. Plus de connexion.' },
      subtitle: { en: 'Join practitioners who are reclaiming their time for what actually matters.', fr: 'Rejoignez les praticiens qui récupèrent leur temps pour ce qui compte vraiment.' },
    },
  }

  const l = (obj: { en: string; fr: string }) => obj[locale as 'en' | 'fr'] || obj.en

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      <main>
        <HeroConveyor locale={locale} l={l} content={content} onCta={handleOpenModal} />

        {/* What is Bloomsline */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-light text-neutral-900 mb-4">
                {locale === 'fr'
                  ? 'Une plateforme clinique tout-en-un.'
                  : 'An all-in-one clinical platform.'
                }
              </h2>
              <p className="text-base sm:text-lg text-neutral-500 leading-relaxed">
                {locale === 'fr'
                  ? <>Séances, suivi des progrès, notes et ressources thérapeutiques dans un seul espace calme et concentré. <span className="font-medium text-neutral-700">Pour passer moins de temps sur l&apos;administratif et plus à faire ce que vous faites le mieux.</span></>
                  : <>Sessions, client progress, notes, and therapeutic resources in one calm, focused space. <span className="font-medium text-neutral-700">So you spend less time on admin and more time doing what you do best.</span></>
                }
              </p>
            </motion.div>
          </div>
        </section>

        {/* A Day With Bloomsline */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">{l(content.dayWith.headline)}</h2>
                <p className="text-lg text-neutral-600">{l(content.dayWith.subtitle)}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {content.dayWith.moments.map((moment, i) => {
                  const Icon = moment.icon
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-5 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-teal-600" /></div>
                      <h3 className="font-medium text-neutral-900 mb-2">{l(moment.time)}</h3>
                      <p className="text-sm text-neutral-400 line-through mb-1">{l(moment.pain)}</p>
                      <p className="text-neutral-600 text-sm leading-relaxed">{l(moment.description)}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </section>

        <GlimpseSection isPractitionerPage />

        {/* AI Trust */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-neutral-600 mb-6 border border-neutral-200">
                <Brain className="w-4 h-4" />
                {l(content.aiTrust.badge)}
              </span>
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                {l(content.aiTrust.headline)}<br />
                <span className="text-teal-600">{l(content.aiTrust.headlineAccent)}</span>
              </h2>
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-teal-500/10 rounded-xl text-teal-600 text-sm font-medium">
                <Shield className="w-4 h-4" />
                {l(content.aiTrust.highlight)}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Audience */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">{l(content.audience.headline)}</h2>
              <p className="text-lg text-neutral-600 mb-10 max-w-2xl mx-auto">{l(content.audience.subtitle)}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {content.audience.types.map((type, i) => (
                  <span key={i} className="px-5 py-3 bg-neutral-100 rounded-full text-neutral-700 font-medium hover:bg-neutral-200 transition-colors">{l(type)}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Security */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-6"><Lock className="w-6 h-6 text-white" /></div>
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">{l(content.security.headline)}</h2>
              <p className="text-lg text-neutral-600 mb-8">{l(content.security.subtitle)}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[{ en: 'Encrypted', fr: 'Chiffré' }, { en: 'GDPR compliant', fr: 'Conforme RGPD' }, { en: 'Your data stays yours', fr: 'Vos données restent vôtres' }, { en: 'Delete anytime', fr: 'Supprimez à tout moment' }].map((item, i) => (
                  <span key={i} className="px-4 py-2 bg-white rounded-full text-sm text-neutral-700 border border-neutral-200">{l(item)}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-2 bg-teal-500/10 text-teal-600 rounded-full text-sm font-medium mb-4">FAQ</span>
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900">{locale === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}</h2>
              </div>
              <div className="space-y-4">
                {content.faq.items.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className={`rounded-2xl border transition-all ${openFaq === i ? 'bg-white border-teal-500/30 shadow-lg' : 'bg-white border-neutral-100 hover:border-neutral-200'}`}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-5 flex items-center justify-between text-left">
                      <span className="font-medium text-neutral-900 pr-4">{l(item.q)}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? 'bg-teal-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {openFaq === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-6 pb-5">
                        <p className="text-neutral-600 leading-relaxed">{l(item.a)}</p>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">{l(content.cta.headline)}</h2>
              <p className="text-lg text-neutral-600 mb-10">{l(content.cta.subtitle)}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={handleOpenModal} className="px-8 py-4 bg-teal-600 text-white rounded-full font-medium inline-flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/30">
                  {l(content.hero.cta)} <ArrowRight className="w-4 h-4" />
                </button>
                <a href={DEMO_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-neutral-300 text-neutral-700 font-medium inline-flex items-center gap-2 hover:border-neutral-400 transition-colors">
                  <Calendar className="w-4 h-4" />
                  {locale === 'fr' ? 'Parlons-en' : 'Talk to us'}
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <TabProvider defaultTab="practitioner">
      <EarlyAccessModalProvider>
        <PractitionerContent />
      </EarlyAccessModalProvider>
    </TabProvider>
  )
}
