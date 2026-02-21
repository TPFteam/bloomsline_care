'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Lock, Calendar, Quote } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { GlimpseSection } from '@/components/landing/glimpse-section'
import { BeliefSection } from '@/components/landing/belief-section'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider, useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'
import { TabProvider } from '@/lib/landing/tab-context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

/* ─── Hero Section ─── */

function HeroSection() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()

  const moments = [
    { img: '/images/hero/rainy-city.jpg', label: { en: 'Even grey days have their beauty', fr: 'Même les jours gris ont leur beauté' } },
    { img: '/images/hero/blue-harbor.jpg', label: { en: 'Found my calm', fr: 'J\'ai trouvé mon calme' } },
    { img: '/images/hero/window-bloom.jpg', label: { en: 'Growing, slowly', fr: 'Grandir, doucement' } },
    { img: '/images/hero/balcony-garden.jpg', label: { en: 'Spring on the windowsill', fr: 'Le printemps au bord de la fenêtre' } },
    { img: '/images/hero/cozy-morning.jpg', label: { en: 'The best kind of morning', fr: 'Le meilleur genre de matin' } },
    { img: '/images/hero/nourish.jpg', label: { en: 'Chose something good today', fr: 'Choisi quelque chose de bon aujourd\'hui' } },
    { img: '/images/hero/simple-feast.jpg', label: { en: 'Simple things, big joy', fr: 'Choses simples, grande joie' } },
  ]

  const n = moments.length
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % n)
    }, 5000)
    return () => clearInterval(interval)
  }, [n])

  const getIdx = (offset: number) => ((activeIdx + offset) % n + n) % n
  const fr = locale === 'fr'

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 pb-12 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/80 via-white to-white" />

      <div className="relative container mx-auto px-6 text-center">
        {/* Moment Conveyor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative w-full max-w-4xl mx-auto overflow-hidden"
          style={{ height: 'clamp(220px, 28vw, 280px)' }}
        >
          {/* Far left */}
          <motion.div key={`fl-${activeIdx}`} initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute left-0 top-1/2 -translate-y-1/2">
            <img src={moments[getIdx(-2)].img} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover opacity-30" />
          </motion.div>

          {/* Left */}
          <motion.div key={`l-${activeIdx}`} initial={{ x: 10, opacity: 0.2 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute left-[12%] sm:left-[15%] top-1/2 -translate-y-1/2">
            <img src={moments[getIdx(-1)].img} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-md opacity-50" />
          </motion.div>

          {/* CENTER — glass card */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div
              className="relative overflow-hidden"
              style={{
                width: 'clamp(130px, 17vw, 190px)',
                height: 'clamp(130px, 17vw, 190px)',
                borderRadius: '2.75rem',
                border: '1.5px solid rgba(0,0,0,0.06)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              }}
            >
              <AnimatePresence mode="sync" initial={false}>
                <motion.img
                  key={activeIdx}
                  src={moments[activeIdx].img}
                  alt=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ borderRadius: '2.65rem' }}
                />
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.span
                key={activeIdx}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-3 inline-block text-sm text-neutral-400 italic"
              >
                {fr ? moments[activeIdx].label.fr : moments[activeIdx].label.en}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Right */}
          <motion.div key={`r-${activeIdx}`} initial={{ x: -10, opacity: 0.2 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute right-[12%] sm:right-[15%] top-1/2 -translate-y-1/2">
            <img src={moments[getIdx(1)].img} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-md opacity-50" />
          </motion.div>

          {/* Far right */}
          <motion.div key={`fr-${activeIdx}`} initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }} className="absolute right-0 top-1/2 -translate-y-1/2">
            <img src={moments[getIdx(2)].img} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover opacity-30" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-2xl sm:text-3xl font-semibold text-neutral-700 tracking-tight"
        >
          {fr ? 'Capturez ce qui compte. Voyez le chemin parcouru.' : 'Capture what matters. See how far you\u2019ve come.'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-3 text-lg text-neutral-500 max-w-xl mx-auto"
        >
          {fr ? 'Les petits moments racontent toute votre histoire' : 'Small moments tell your whole story'}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => openModal()}
            className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-[#4A9A86]/25"
            style={{ background: 'linear-gradient(135deg, #4A9A86, #5AB39C)' }}
          >
            {fr ? 'Accès anticipé' : 'Get Early Access'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-sm text-neutral-400"
        >
          {fr ? 'Vous êtes praticien ?' : 'Are you a practitioner?'}{' '}
          <a href="/" className="text-neutral-500 underline underline-offset-2 hover:text-neutral-700 transition-colors">
            {fr ? 'Par ici' : 'Learn more'}
          </a>
        </motion.p>
      </div>
    </section>
  )
}

/* ─── Social Proof ─── */

function SocialProofSection() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()
  const fr = locale === 'fr'

  const quotes = [
    {
      text: fr ? 'J\u2019ai enfin arrêté de culpabiliser les jours où je ne suis pas au rendez-vous.' : 'I finally stopped feeling guilty about the days I don\u2019t show up.',
      role: fr ? 'Membre' : 'Member',
      initials: 'SL',
      color: 'from-rose-200 to-rose-300',
    },
    {
      text: fr ? 'J\u2019arrive à chaque séance en sachant exactement où nous en étions.' : 'I walk into every session knowing exactly where we left off.',
      role: fr ? 'Praticien' : 'Practitioner',
      initials: 'DK',
      color: 'from-teal-200 to-teal-300',
    },
    {
      text: fr ? 'C\u2019est la première app qui ne m\u2019a pas donné l\u2019impression d\u2019échouer.' : 'It\u2019s the first app that didn\u2019t make me feel like I was failing.',
      role: fr ? 'Membre' : 'Member',
      initials: 'JR',
      color: 'from-amber-200 to-amber-300',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-neutral-50">
      <div className="container mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {quotes.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col"
            >
              <Quote className="w-5 h-5 text-neutral-300 mb-3 flex-shrink-0" />
              <p className="text-neutral-700 text-sm italic leading-relaxed flex-1">{q.text}</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-neutral-100">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${q.color} flex items-center justify-center`}>
                  <span className="text-neutral-600 text-xs font-medium">{q.initials}</span>
                </div>
                <span className="text-xs text-neutral-500">{q.role}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <button
            onClick={() => openModal()}
            className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-[#4A9A86]/25"
            style={{ background: 'linear-gradient(135deg, #4A9A86, #5AB39C)' }}
          >
            {fr ? 'Accès anticipé' : 'Get Early Access'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Final CTA ─── */

function UpgradedCTASection() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()
  const fr = locale === 'fr'

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 mb-6">
            {fr ? 'Vous n\u2019avez pas à tout comprendre aujourd\u2019hui.' : 'You don\u2019t have to figure it all out today.'}
          </h2>

          <p className="text-lg text-neutral-500 mb-10">
            {fr ? 'Commencez par un petit moment. Nous serons là quand vous serez prêt.' : 'Start with one small moment. We\u2019ll be here when you\u2019re ready.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openModal()}
              className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#1F2227' }}
            >
              {fr ? 'Accès anticipé' : 'Get Early Access'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full border border-neutral-200 text-neutral-500 font-medium inline-flex items-center gap-2 hover:border-neutral-300 hover:text-neutral-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {fr ? 'Contactez-nous' : 'Talk to us'}
            </a>
          </div>

          <p className="mt-8 text-xs text-neutral-400 inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            {fr ? 'Vos données sont chiffrées et restent privées. Toujours.' : 'Your data is encrypted and stays private. Always.'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Page ─── */

export default function ForMembersPage() {
  return (
    <TabProvider>
      <EarlyAccessModalProvider>
        <div className="bg-white text-gray-900">
          <Navbar isMemberPage />
          <main>
            <HeroSection />
            <div id="glimpse"><GlimpseSection /></div>
            <SocialProofSection />
            <BeliefSection />
            <UpgradedCTASection />
          </main>
          <Footer />
        </div>
      </EarlyAccessModalProvider>
    </TabProvider>
  )
}
