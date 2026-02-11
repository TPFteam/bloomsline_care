'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowDown, Calendar, Quote, Lock } from 'lucide-react'
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
    { img: '/images/hero/rainy-city.jpg', label: { en: 'Even grey days have their beauty', fr: 'Même les jours gris ont leur beauté', es: 'Incluso los días grises tienen su belleza' } },
    { img: '/images/hero/blue-harbor.jpg', label: { en: 'Found my calm', fr: 'J\'ai trouvé mon calme', es: 'Encontré mi calma' } },
    { img: '/images/hero/window-bloom.jpg', label: { en: 'Growing, slowly', fr: 'Grandir, doucement', es: 'Creciendo, despacio' } },
    { img: '/images/hero/balcony-garden.jpg', label: { en: 'Spring on the windowsill', fr: 'Le printemps au bord de la fenêtre', es: 'Primavera en el alféizar' } },
    { img: '/images/hero/cozy-morning.jpg', label: { en: 'The best kind of morning', fr: 'Le meilleur genre de matin', es: 'La mejor clase de mañana' } },
    { img: '/images/hero/nourish.jpg', label: { en: 'Chose something good today', fr: 'Choisi quelque chose de bon aujourd\'hui', es: 'Elegí algo bueno hoy' } },
    { img: '/images/hero/simple-feast.jpg', label: { en: 'Simple things, big joy', fr: 'Choses simples, grande joie', es: 'Cosas simples, gran alegría' } },
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

  const headline = {
    en: 'Small moments tell your whole story',
    fr: 'Les petits moments racontent toute votre histoire',
    es: 'Los pequeños momentos cuentan toda tu historia',
  }

  const subtitle = {
    en: 'Capture what matters. See how far you\u2019ve come.',
    fr: 'Capturez ce qui compte. Voyez le chemin parcouru.',
    es: 'Captura lo que importa. Mira cuánto has avanzado.',
  }

  const ctaPrimary = {
    en: 'Get Early Access',
    fr: 'Accès anticipé',
    es: 'Acceso anticipado',
  }

  const ctaSecondary = {
    en: 'See how it works',
    fr: 'Voir comment ça marche',
    es: 'Ver cómo funciona',
  }

  const scrollToGlimpse = () => {
    document.getElementById('glimpse')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 pb-12 bg-white overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/80 via-white to-white" />

      <div className="relative container mx-auto px-6 text-center">
        {/* Moment Conveyor — flows through center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative w-full max-w-4xl mx-auto overflow-hidden"
          style={{ height: 'clamp(220px, 28vw, 280px)' }}
        >

          {/* Far left thumbnail */}
          <motion.div
            key={`fl-${activeIdx}`}
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
          >
            <img src={moments[getIdx(-2)].img} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover opacity-30" />
          </motion.div>

          {/* Left thumbnail */}
          <motion.div
            key={`l-${activeIdx}`}
            initial={{ x: 10, opacity: 0.2 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute left-[12%] sm:left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
          >
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

            {/* Pill below — label */}
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIdx}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-3 inline-block text-sm text-neutral-400 italic"
              >
                {locale === 'fr' ? moments[activeIdx].label.fr : locale === 'es' ? moments[activeIdx].label.es : moments[activeIdx].label.en}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Right thumbnail */}
          <motion.div
            key={`r-${activeIdx}`}
            initial={{ x: -10, opacity: 0.2 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute right-[12%] sm:right-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
          >
            <img src={moments[getIdx(1)].img} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shadow-md opacity-50" />
          </motion.div>

          {/* Far right thumbnail */}
          <motion.div
            key={`fr-${activeIdx}`}
            initial={{ x: 15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
          >
            <img src={moments[getIdx(2)].img} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover opacity-30" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-2xl sm:text-3xl font-semibold text-neutral-700 tracking-tight"
        >
          {locale === 'fr' ? subtitle.fr : locale === 'es' ? subtitle.es : subtitle.en}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-3 text-lg text-neutral-500 max-w-xl mx-auto"
        >
          {locale === 'fr' ? headline.fr : locale === 'es' ? headline.es : headline.en}
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
            className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-[#4A9A86]/25" style={{ background: 'linear-gradient(135deg, #4A9A86, #5AB39C)' }}
          >
            {locale === 'fr' ? ctaPrimary.fr : locale === 'es' ? ctaPrimary.es : ctaPrimary.en}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-sm text-neutral-400"
        >
          {locale === 'fr' ? 'Vous êtes praticien ?' : locale === 'es' ? '¿Eres profesional?' : 'Are you a practitioner?'}{' '}
          <a href="/practitioner" className="text-neutral-500 underline underline-offset-2 hover:text-neutral-700 transition-colors">
            {locale === 'fr' ? 'Par ici' : locale === 'es' ? 'Por aquí' : 'Learn more'}
          </a>
        </motion.p>

      </div>
    </section>
  )
}

/* ─── Social Proof Section ─── */

function SocialProofSection() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()

  const waitlistLabel = {
    en: '200+ people already on the waitlist',
    fr: '200+ personnes déjà inscrites',
    es: '200+ personas ya en la lista',
  }

  const quotes = [
    {
      text: {
        en: 'I finally stopped feeling guilty about the days I don\u2019t show up.',
        fr: 'J\u2019ai enfin arrêté de culpabiliser les jours où je ne suis pas au rendez-vous.',
        es: 'Finalmente dejé de sentirme culpable por los días en que no me presento.',
      },
      role: { en: 'Member', fr: 'Membre', es: 'Miembro' },
      initials: 'SL',
      color: 'from-rose-200 to-rose-300',
    },
    {
      text: {
        en: 'I walk into every session knowing exactly where we left off.',
        fr: 'J\u2019arrive à chaque séance en sachant exactement où nous en étions.',
        es: 'Llego a cada sesión sabiendo exactamente dónde lo dejamos.',
      },
      role: { en: 'Practitioner', fr: 'Praticien', es: 'Profesional' },
      initials: 'DK',
      color: 'from-teal-200 to-teal-300',
    },
    {
      text: {
        en: 'It\u2019s the first app that didn\u2019t make me feel like I was failing.',
        fr: 'C\u2019est la première app qui ne m\u2019a pas donné l\u2019impression d\u2019échouer.',
        es: 'Es la primera app que no me hizo sentir que estaba fracasando.',
      },
      role: { en: 'Member', fr: 'Membre', es: 'Miembro' },
      initials: 'JR',
      color: 'from-amber-200 to-amber-300',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-neutral-50">
      <div className="container mx-auto px-6">
        {/* Quote cards */}
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
              <p className="text-neutral-700 text-sm italic leading-relaxed flex-1">
                {locale === 'fr' ? q.text.fr : locale === 'es' ? q.text.es : q.text.en}
              </p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-neutral-100">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${q.color} flex items-center justify-center`}>
                  <span className="text-neutral-600 text-xs font-medium">{q.initials}</span>
                </div>
                <span className="text-xs text-neutral-500">
                  {locale === 'fr' ? q.role.fr : locale === 'es' ? q.role.es : q.role.en}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mid-page CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <button
            onClick={() => openModal()}
            className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-[#4A9A86]/25" style={{ background: 'linear-gradient(135deg, #4A9A86, #5AB39C)' }}
          >
            {locale === 'fr' ? 'Accès anticipé' : locale === 'es' ? 'Acceso anticipado' : 'Get Early Access'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Upgraded CTA Section ─── */

function UpgradedCTASection() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()

  const headline = {
    en: "You don\u2019t have to figure it all out today.",
    fr: "Vous n\u2019avez pas à tout comprendre aujourd\u2019hui.",
    es: 'No tienes que resolverlo todo hoy.',
  }

  const subtitle = {
    en: "Start with one small moment. We\u2019ll be here when you\u2019re ready.",
    fr: 'Commencez par un petit moment. Nous serons là quand vous serez prêt.',
    es: 'Empieza con un peque\u00f1o momento. Estaremos aquí cuando estés listo.',
  }

  const ctaPrimary = {
    en: 'Get Early Access',
    fr: 'Accès anticipé',
    es: 'Acceso anticipado',
  }

  const ctaSecondary = {
    en: 'Talk to us',
    fr: 'Contactez-nous',
    es: 'Habla con nosotros',
  }

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
            {locale === 'fr' ? headline.fr : locale === 'es' ? headline.es : headline.en}
          </h2>

          <p className="text-lg text-neutral-500 mb-10">
            {locale === 'fr' ? subtitle.fr : locale === 'es' ? subtitle.es : subtitle.en}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openModal()}
              className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors" style={{ backgroundColor: '#1F2227' }}
            >
              {locale === 'fr' ? ctaPrimary.fr : locale === 'es' ? ctaPrimary.es : ctaPrimary.en}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full border border-neutral-200 text-neutral-500 font-medium inline-flex items-center gap-2 hover:border-neutral-300 hover:text-neutral-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {locale === 'fr' ? ctaSecondary.fr : locale === 'es' ? ctaSecondary.es : ctaSecondary.en}
            </a>
          </div>

          <p className="mt-8 text-xs text-neutral-400 inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            {locale === 'fr' ? 'Vos données sont chiffrées et restent privées. Toujours.' : locale === 'es' ? 'Tus datos están cifrados y son privados. Siempre.' : 'Your data is encrypted and stays private. Always.'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Welcome Section ─── */

function WelcomeSection() {
  const { locale } = useLanguage()

  const team = [
    { initials: 'AC', color: 'bg-teal-500' },
    { initials: 'SB', color: 'bg-rose-400' },
    { initials: 'ML', color: 'bg-amber-500' },
  ]

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto relative"
        >
          {/* Warm ambient glow behind the card */}
          <div className="absolute -inset-4 bg-gradient-to-br from-amber-100/40 via-rose-50/30 to-teal-50/30 rounded-[2rem] blur-2xl pointer-events-none" />

          {/* The note */}
          <div className="relative bg-gradient-to-br from-amber-50/80 via-white to-rose-50/40 rounded-3xl border border-amber-100/60 shadow-sm px-8 py-8 sm:px-10 sm:py-10">

            {/* Greeting */}
            <p className="text-2xl sm:text-3xl font-light text-neutral-900 mb-6">
              {locale === 'fr' ? 'Hey \u2014 content de vous voir.' : locale === 'es' ? 'Hey \u2014 qué bueno que estás aquí.' : 'Hey \u2014 glad you\u2019re here.'}
            </p>

            {/* Quote intro */}
            <p className="text-sm text-neutral-400 mb-4">
              {locale === 'fr' ? 'Quelque chose qu\u2019on croit vraiment' : locale === 'es' ? 'Algo en lo que realmente creemos' : 'Something we genuinely believe'}
            </p>

            {/* Quote — warm accent bar */}
            <div className="border-l-2 border-teal-300 pl-5 py-1 mb-8 space-y-3">
              {locale === 'fr' ? (
                <>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">Tu n\u2019as pas besoin de tout réparer d\u2019un coup.</p>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">Parfois, juste remarquer un bon moment suffit.</p>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">Un café tranquille. Un fou rire. Une promenade qui t\u2019a fait du bien sans que tu saches pourquoi.</p>
                  <p className="text-neutral-900 text-sm sm:text-base font-medium mt-1">Ces moments comptent plus que tu ne le penses.</p>
                </>
              ) : locale === 'es' ? (
                <>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">No necesitas arreglar todo de una vez.</p>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">A veces, solo notar un buen momento es suficiente.</p>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">Un café tranquilo. Una risa inesperada. Una caminata que te hizo bien sin saber por qué.</p>
                  <p className="text-neutral-900 text-sm sm:text-base font-medium mt-1">Esos momentos importan más de lo que crees.</p>
                </>
              ) : (
                <>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">You don&apos;t have to fix everything at once.</p>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">Sometimes just noticing a good moment is enough.</p>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed italic">A quiet coffee. An unexpected laugh. A walk that helped and you&apos;re not sure why.</p>
                  <p className="text-neutral-900 text-sm sm:text-base font-medium mt-1">Those moments matter more than you think.</p>
                </>
              )}
            </div>

            {/* Closing line */}
            <p className="text-neutral-900 text-sm sm:text-base mb-8">
              {locale === 'fr'
                ? 'Bloomsline vous aide à les voir, les garder, et réaliser à quel point vous avancez.'
                : locale === 'es'
                ? 'Bloomsline te ayuda a verlos, guardarlos, y darte cuenta de cuánto has avanzado.'
                : 'Bloomsline helps you see them, hold onto them, and realize how far you\u2019ve come.'}
            </p>

            {/* Divider */}
            <div className="border-t border-amber-100/80 pt-6">
              {/* Team sign-off */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {team.map((member, i) => (
                    <motion.div
                      key={member.initials}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                      className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center ring-2 ring-white`}
                    >
                      <span className="text-white text-[10px] font-medium">{member.initials}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-neutral-500">
                  {locale === 'fr' ? 'De toute l\u2019équipe Bloomsline' : locale === 'es' ? 'De todo el equipo de Bloomsline' : 'From all of us at Bloomsline'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Glimpse Wrapper (adds id + intro copy) ─── */

function GlimpseWrapper() {
  return (
    <div id="glimpse">
      <GlimpseSection />
    </div>
  )
}

/* ─── Page ─── */

export default function HomeNew() {
  return (
    <TabProvider>
      <EarlyAccessModalProvider>
        <div className="bg-white text-gray-900">
          <Navbar />
          <main>
            <HeroSection />
            <GlimpseWrapper />
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
