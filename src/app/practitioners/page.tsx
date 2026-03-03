'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Lock,
  Brain,
  Heart,
  FileText,
  Calendar,
  Clock,
  ChevronDown,
  Zap,
  MessageSquare,
  Quote,
} from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { TabProvider } from '@/lib/landing/tab-context'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { PractitionerSignupModalProvider, usePractitionerSignupModal } from '@/lib/landing/practitioner-signup-modal-context'
import { useLanguage } from '@/lib/i18n/context'
import { GlimpseSection } from '@/components/landing/glimpse-section'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

/* ─── Hero Section ─── */

function HeroSection({ locale, l, content, onCtaClick }: { locale: string; l: (obj: { en: string; fr: string }) => string; content: any; onCtaClick: () => void }) {
  const fr = locale === 'fr'
  const [activeCard, setActiveCard] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard(prev => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    // Session prep
    <div key="prep" className="p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{fr ? 'Séance à venir' : 'Upcoming session'}</p>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">SL</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-800">Sarah Laurent</p>
          <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block shrink-0" />
            {fr ? 'Dans 30 min' : 'In 30 min'}
          </p>
        </div>
      </div>
      <div className="bg-blue-50/70 rounded-xl px-3.5 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{fr ? 'Hypothèse' : 'Hypothesis'}</span>
        <span className="text-sm text-neutral-600">{fr ? 'Hypervigilance liée à l&apos;insécurité' : 'Hypervigilance linked to insecurity'}</span>
      </div>
    </div>,

    // Progress — client journey
    <div key="progress" className="p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{fr ? 'Parcours de Marc' : 'Marc\u2019s journey'}</p>
      </div>
      <div className="space-y-2.5 relative ml-3">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-neutral-100" />
        {[
          { text: fr ? 'Stress récurrent au travail' : 'Recurring work stress', time: fr ? 'Sem. 2' : 'Week 2', done: true },
          { text: fr ? 'Réalisation d\'un exercice d\'ancrage' : 'Completed a grounding exercise', time: fr ? 'Sem. 5' : 'Week 5', done: true },
          { text: fr ? 'Intégration d\'une nouvelle habitude' : 'Integrating a new habit', time: fr ? 'Maintenant' : 'Now', done: false, current: true },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.2 }}
            className="flex items-start gap-3 relative"
          >
            <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 relative z-10 ${step.current ? 'bg-teal-400 ring-4 ring-teal-50' : step.done ? 'bg-teal-400' : 'bg-neutral-200'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${step.current ? 'text-neutral-800 font-medium' : 'text-neutral-600'}`}>{step.text}</p>
              <p className={`text-[10px] ${step.current ? 'text-teal-500 font-medium' : 'text-neutral-400'}`}>{step.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>,

    // Resources
    <div key="resources" className="p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{fr ? 'Ressources partagées' : 'Shared resources'}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <FileText className="w-3 h-3 text-blue-500" />
          </div>
          <p className="text-sm text-neutral-700 flex-1">{fr ? 'Schémas précoces inadaptés' : 'Early Maladaptive Schemas'}</p>
          <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-medium rounded-full">{fr ? 'Vu' : 'Viewed'}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <Zap className="w-3 h-3 text-emerald-500" />
          </div>
          <p className="text-sm text-neutral-700 flex-1">{fr ? 'Journal des pensées automatiques' : 'Automatic Thought Journal'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <p className="text-xs text-neutral-400">{fr ? '1/2 consulté' : '1/2 viewed'}</p>
        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ delay: 0.3, duration: 0.5 }} className="h-full bg-teal-400 rounded-full" />
        </div>
      </div>
    </div>,
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-28 pb-16 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/80 via-white to-white" />

      <div className="relative container mx-auto px-6 text-center">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="mb-6 text-xs font-medium uppercase tracking-wider text-neutral-400"
        >
          {l(content.hero.tagline)}
        </motion.p>

        {/* Animated cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-10 sm:mb-12 max-w-md sm:max-w-lg mx-auto"
        >
          <div className="relative bg-white border border-neutral-200/80 rounded-2xl shadow-xl shadow-neutral-200/50 overflow-hidden" style={{ height: 195 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                {cards[activeCard]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setActiveCard(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeCard === i ? 'w-6 bg-teal-500' : 'w-1.5 bg-neutral-200 hover:bg-neutral-300'}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-3xl sm:text-5xl font-semibold text-neutral-800 tracking-tight"
        >
          {l(content.hero.headline)}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-5 text-base sm:text-lg text-neutral-500 max-w-xl mx-auto"
        >
          {l(content.hero.subtitle)}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-8 sm:mt-10"
        >
          <button
            onClick={onCtaClick}
            className="px-8 py-4 rounded-full text-white font-medium tracking-wide inline-flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-teal-600/25 text-base"
            style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
          >
            {fr ? 'En savoir plus' : 'Learn more'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* WhatsApp link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-6 text-sm"
        >
          <a href="https://wa.me/33671482004" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-600 transition-colors">
            {fr ? <>Ou contactez-nous sur <span className="text-[#25D366] font-medium">WhatsApp</span> →</> : <>Or reach us on <span className="text-[#25D366] font-medium">WhatsApp</span> →</>}
          </a>
        </motion.p>
      </div>
    </section>
  )
}

/* ─── Page Content ─── */

function PractitionerContent() {
  const { locale } = useLanguage()
  const { openModal } = usePractitionerSignupModal()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [testimonialExpanded, setTestimonialExpanded] = useState(true)

  const fr = locale === 'fr'

  const handleOpenModal = () => {
    openModal()
  }

  const content = {
    hero: {
      tagline: { en: 'For Mental Health Practitioners', fr: 'Pour les praticiens en santé mentale' },
      headline: { en: 'A simpler way to manage your practice.', fr: 'Une façon plus simple de gérer votre pratique.' },
      subtitle: { en: 'Sessions, progress, and resources. All in one calm, organized space.', fr: 'Séances, évolutions et ressources. Dans un seul espace calme et organisé.' },
      cta: { en: 'Get Early Access', fr: 'Accès anticipé' },
      trust: { en: 'No credit card required', fr: 'Pas de carte de crédit requise' },
    },
    dayWith: {
      headline: { en: 'How it fits into your day', fr: 'S\'intègre naturellement à votre quotidien' },
      subtitle: { en: '', fr: '' },
      moments: [
        { time: { en: 'Before a session', fr: 'Avant une séance' }, pain: { en: 'Notes pile up, context gets lost', fr: 'Les notes s\'accumulent, le contexte se perd' }, description: { en: 'Everything you need, already there. No digging.', fr: 'Tout ce qu\'il vous faut, déjà là. Sans chercher.' }, icon: Clock },
        { time: { en: 'During a session', fr: 'Pendant une séance' }, pain: { en: 'Admin steals time from what matters', fr: 'L\'administratif vole du temps à l\'essentiel' }, description: { en: 'Stay present. Notes flow. Nothing gets lost.', fr: 'Restez présent. Les notes se structurent toutes seules.' }, icon: Heart },
        { time: { en: 'Between sessions', fr: 'Entre les séances' }, pain: { en: 'The connection fades', fr: 'Le travail s\'interrompt' }, description: { en: 'Reflection continues with the right resources.', fr: 'La réflexion se poursuit avec des supports adaptés.' }, icon: MessageSquare },
        { time: { en: 'Over time', fr: 'Au fil du temps' }, pain: { en: 'Progress lives in your head, not on screen', fr: 'L\'évolution se perçoit, mais ne se formalise pas' }, description: { en: 'See real progress, not just snapshots.', fr: 'Voyez les vrais progrès, pas juste des instantanés.' }, icon: Zap },
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
      subtitle: { en: '', fr: '' },
      types: [
        { en: 'Brief Therapy Practitioners', fr: 'Praticiens en thérapies brèves', hint: { en: 'Structured homework and between-session tools your clients actually use', fr: 'Des exercices structurés et des outils inter-séances que vos clients utilisent vraiment' } },
        { en: 'Psychologists', fr: 'Psychologues', hint: { en: 'Track client progress between sessions with AI-powered insights', fr: 'Suivez les progrès de vos clients entre les séances grâce à l\'IA' } },
        { en: 'Psychoanalysts', fr: 'Psychanalystes', hint: { en: 'Organize long-term follow-ups and session notes across years of work', fr: 'Organisez le suivi au long cours et les notes de séance sur des années de travail' } },
        { en: 'Psychotherapists', fr: 'Psychothérapeutes', hint: { en: 'Reduce session notes from 30 min to 5 min with smart templates', fr: 'Réduisez vos notes de séance de 30 min à 5 min avec des modèles intelligents' } },
        { en: 'Therapists & Coaches', fr: 'Thérapeutes et coachs', hint: { en: 'A flexible space that adapts to your approach and your rhythm', fr: 'Un espace flexible qui s\'adapte à votre approche et à votre rythme' } },
        { en: 'Institutional Psychologists', fr: 'Psychologues institutionnels', hint: { en: 'Manage caseloads across teams with unified dashboards', fr: 'Gérez vos dossiers en équipe avec des tableaux de bord unifiés' } },
        { en: 'Cabinets', fr: 'Cabinets', hint: { en: 'One platform for your whole team — shared notes, referrals, and outcomes', fr: 'Une plateforme pour toute votre équipe — notes partagées, orientations et résultats' } },
      ],
    },
    security: {
      headline: { en: 'A secure space that respects the therapeutic framework.', fr: 'Un espace sécurisé, respectueux du cadre thérapeutique.' },
      subtitle: { en: 'We take that as seriously as you do.', fr: 'Nous prenons cela TRÈS au sérieux.' },
    },
    faq: {
      items: [
        { q: { en: 'Will Bloomsline change how I work?', fr: 'Bloomsline va-t-il changer ma façon de travailler ?' }, a: { en: 'No. Bloomsline fits into your practice without changing how you work. Use it at your own pace, based on your needs. Start simple, then expand gradually.', fr: 'Non. Bloomsline s\'intègre à votre pratique sans en modifier le cadre. Vous l\'utilisez à votre rythme, selon vos besoins. Commencez simplement, puis développez progressivement.' } },
        { q: { en: 'Is AI required?', fr: 'L\'IA est-elle obligatoire ?' }, a: { en: 'No. AI features are entirely optional. You can use Bloomsline purely to structure and organize your practice, without using AI.', fr: 'Non. Les fonctionnalités d\'IA sont entièrement optionnelles. Vous pouvez utiliser Bloomsline uniquement pour structurer et organiser votre pratique, sans recourir à l\'IA.' } },
        { q: { en: 'Is my clients\' data safe?', fr: 'Les données de mes clients sont-elles en sécurité ?' }, a: { en: 'Yes. Data is encrypted and hosted in compliance with GDPR. It is never resold or used for any other purpose. You retain full control and can permanently delete your data at any time.', fr: 'Oui. Les données sont chiffrées et hébergées conformément au RGPD. Elles ne sont jamais revendues ni utilisées à d\'autres fins. Vous conservez le contrôle total et pouvez supprimer définitivement vos données à tout moment.' } },
        { q: { en: 'What if it doesn\'t fit my practice?', fr: 'Et si ça ne correspond pas à ma pratique ?' }, a: { en: 'You can try it for free, with no commitment or credit card required. If the tool doesn\'t suit you, you can stop at any time.', fr: 'Vous pouvez essayer gratuitement, sans engagement ni carte bancaire. Si l\'outil ne vous convient pas, vous pouvez arrêter à tout moment.' } },
      ],
    },
    cta: {
      headline: { en: 'Less admin. More connection.', fr: 'Moins d\'administratif. Plus de continuité.' },
      subtitle: { en: 'Join those who chose to simplify their work so they can better improve the lives of others.', fr: 'Rejoignez ceux qui ont choisi de se simplifier la vie pour mieux améliorer celle des autres.' },
    },
  }

  const l = (obj: { en: string; fr: string }) => obj[locale as 'en' | 'fr'] || obj.en

  return (
    <div className="bg-white text-gray-900">
      <Navbar minimal onCtaClick={handleOpenModal} />

      <main>
        <HeroSection locale={locale} l={l} content={content} onCtaClick={handleOpenModal} />

        {/* Testimonial */}
        <section className="py-24 sm:py-32 bg-neutral-900 text-white overflow-hidden">
          <div className="container mx-auto px-6">
            {/* Section label */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 text-center mb-8"
            >
              {fr ? 'Parole de praticienne' : 'A practitioner\u2019s words'}
            </motion.p>

            <div className="max-w-3xl mx-auto space-y-16">
              {/* Block 1 — left aligned */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-left relative"
              >
                <div className="absolute -top-6 -left-10 sm:-left-14 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-500/10 flex items-center justify-center select-none">
                  <span className="text-5xl sm:text-6xl font-serif text-teal-400/60 leading-none mt-2">&ldquo;</span>
                </div>
                <p className="text-xl sm:text-2xl leading-relaxed">
                  <span className="font-semibold text-white">{fr ? 'Un véritable atout' : 'A real asset'}</span>
                  <span className="text-neutral-400">
                    {fr
                      ? ' pour les psychologues. Centraliser les séances, les progrès et les ressources dans un espace calme et organisé.'
                      : ' for psychologists. Centralizing sessions, progress, and resources in a calm, organized space.'}
                  </span>
                </p>
              </motion.div>

              {/* Block 2 — right aligned */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-right"
              >
                <p className="text-xl sm:text-2xl leading-relaxed">
                  <span className="text-neutral-400">
                    {fr
                      ? 'Cela libère du temps pour '
                      : 'It frees up time for '}
                  </span>
                  <span className="font-semibold text-white">
                    {fr ? "l\u2019essentiel" : 'what matters most'}
                  </span>
                  <span className="text-neutral-400">.</span>
                  <br />
                  <span className="text-neutral-400">
                    {fr ? "L\u2019accompagnement des patients." : 'Supporting patients.'}
                  </span>
                </p>
              </motion.div>

              {/* Block 3 — left aligned */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-left"
              >
                <p className="text-xl sm:text-2xl leading-relaxed">
                  <span className="font-semibold text-white">{fr ? 'Interface intuitive' : 'Intuitive interface'}</span>
                  <span className="text-neutral-400">
                    {fr
                      ? ', idéale pour les thérapies brèves.'
                      : ', ideal for brief therapies.'}
                  </span>
                </p>
              </motion.div>

              {/* Expanded blocks */}
              <AnimatePresence>
                {testimonialExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-16"
                  >
                    {/* Block 4 — right */}
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl leading-relaxed">
                        <span className="text-neutral-400">
                          {fr
                            ? "Je recommande cet outil à tous les psychologues qui souhaitent "
                            : "I recommend this tool to all psychologists who want to "}
                        </span>
                        <span className="font-semibold text-white">
                          {fr ? 'optimiser leur pratique' : 'optimize their practice'}
                        </span>
                        <span className="text-neutral-400">.</span>
                      </p>
                    </div>

                    {/* Block 5 — left, italic wisdom */}
                    <div className="text-left">
                      <p className="text-xl sm:text-2xl leading-relaxed text-neutral-400">
                        {fr ? <>
                          Quelle que soit la technologie, <span className="font-semibold text-white">rien ne remplace le travail sur soi, la supervision, la formation continue et un sens du contact humain</span> développé.
                        </> : <>
                          No matter how advanced the technology, <span className="font-semibold text-white">nothing replaces self-work, supervision, continuing education, and a strong sense of human connection</span>.
                        </>}
                      </p>
                    </div>

                    {/* Block 6 — center, closing */}
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl leading-relaxed font-semibold text-white">
                        {fr
                          ? "Un excellent investissement pour une gestion sereine de votre activité."
                          : "An excellent investment for serene management of your practice."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Author */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center justify-center gap-4 pt-6 border-t border-neutral-800"
              >
                <img
                  src="/images/testimonials/p-serin.jpg"
                  alt="P. Serin"
                  className="w-20 h-20 rounded-full object-cover border-2 border-neutral-700"
                />
                <div className="text-left">
                  <p className="text-2xl text-white font-semibold">P. Serin</p>
                  <p className="text-base text-neutral-400">{fr ? 'Psychologue clinicienne' : 'Clinical Psychologist'}</p>
                  <a
                    href="https://www.bloomsline.com/p/serin-patricia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-teal-400 text-sm font-medium hover:text-teal-300 transition-colors mt-1"
                  >
                    {fr ? 'Voir le portrait' : 'View profile'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            </div>
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
              {/* Audience — inline */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-center mt-24"
              >
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">{l(content.audience.headline)}</h2>
                <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">{l(content.audience.subtitle)}</p>
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {content.audience.types.map((type, i) => (
                    <div key={i} className="relative group">
                      <span className="px-5 py-3 bg-neutral-100 rounded-full text-neutral-700 font-medium hover:bg-neutral-200 transition-colors cursor-default inline-block">{l(type)}</span>
                      {type.hint && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2.5 bg-neutral-800 text-white text-xs leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-56 text-center z-10">
                          {l(type.hint)}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-neutral-800" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleOpenModal}
                  className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium rounded-full shadow-lg shadow-teal-600/30 hover:shadow-xl hover:from-teal-700 hover:to-teal-600 transition-all duration-300 inline-flex items-center gap-2"
                >
                  {fr ? 'Découvrir Bloomsline' : 'Discover Bloomsline'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <GlimpseSection isPractitionerPage onCtaClick={handleOpenModal} />

        {/* Security */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-6"><Lock className="w-6 h-6 text-white" /></div>
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">{l(content.security.headline)}</h2>
              <p className="text-lg text-neutral-600 mb-8">{l(content.security.subtitle)}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[{ en: 'Protected', fr: 'Protection' }, { en: 'GDPR compliant', fr: 'Conformité RGPD' }, { en: 'Your data stays yours', fr: 'Aucune exploitation des données' }, { en: 'Delete anytime', fr: 'Suppression à tout moment' }].map((item, i) => (
                  <span key={i} className="px-4 py-2 bg-white rounded-full text-sm text-neutral-700 border border-neutral-200">{l(item)}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>


      </main>

      <Footer />
    </div>
  )
}

export default function PractitionersPage() {
  return (
    <TabProvider defaultTab="practitioner">
      <EarlyAccessModalProvider>
        <PractitionerSignupModalProvider>
          <PractitionerContent />
        </PractitionerSignupModalProvider>
      </EarlyAccessModalProvider>
    </TabProvider>
  )
}
