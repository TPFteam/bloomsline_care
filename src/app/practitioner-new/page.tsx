'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  MessageSquare
} from 'lucide-react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { TabProvider } from '@/lib/landing/tab-context'
import { EarlyAccessModalProvider, useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

function PractitionerNewContent() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleOpenModal = () => {
    openModal('practitioner')
  }

  // Content — experience-focused, no feature names exposed
  const content = {
    hero: {
      tagline: {
        en: 'For Mental Health Practitioners',
        fr: 'Pour les praticiens en santé mentale',
      },
      headline: {
        en: 'Every client is different.',
        fr: 'Chaque client est différent.',
      },
      headlineAccent: {
        en: 'Finally, tools that get that.',
        fr: 'Enfin, des outils qui le comprennent.',
      },
      subtitle: {
        en: 'Walk into every session prepared. Stay connected between appointments. See your clients\' real progress — not just snapshots.',
        fr: 'Arrivez préparé à chaque séance. Restez connecté entre les rendez-vous. Voyez les vrais progrès de vos clients — pas juste des instantanés.',
      },
      cta: {
        en: 'Get Early Access',
        fr: 'Accès anticipé',
      },
      ctaSecondary: {
        en: 'Talk to us',
        fr: 'Contactez-nous',
      },
      trust: {
        en: 'No credit card required',
        fr: 'Pas de carte de crédit requise',
      },
    },
    painPoint: {
      headline: {
        en: 'Sound familiar?',
        fr: 'Ça vous parle ?',
      },
      subtitle: {
        en: 'After a session, insights fade. Notes pile up. Context gets lost. And the next session starts from scratch.',
        fr: 'Après une séance, les insights s\'estompent. Les notes s\'accumulent. Le contexte se perd. Et la prochaine séance repart de zéro.',
      },
      points: [
        {
          en: 'You spend more time searching for notes than reading them',
          fr: 'Vous passez plus de temps à chercher vos notes qu\'à les lire',
        },
        {
          en: 'Your clients\' progress is in your head, not somewhere you can see it',
          fr: 'Les progrès de vos clients sont dans votre tête, pas quelque part où vous pouvez les voir',
        },
        {
          en: 'Between sessions, the connection fades',
          fr: 'Entre les séances, la connexion s\'estompe',
        },
        {
          en: 'Admin eats into the time you should spend thinking about your clients',
          fr: 'L\'administratif empiète sur le temps que vous devriez passer à penser à vos clients',
        },
      ],
    },
    dayWith: {
      headline: {
        en: 'A day with Bloomsline',
        fr: 'Une journée avec Bloomsline',
      },
      subtitle: {
        en: 'Same clients. Same practice. Less friction.',
        fr: 'Les mêmes clients. La même pratique. Moins de friction.',
      },
      moments: [
        {
          time: { en: 'Before a session', fr: 'Avant une séance' },
          description: {
            en: 'You open your client\'s page. Everything is there — what you discussed last time, what they\'ve been working on, how they\'ve been doing. No digging through files.',
            fr: 'Vous ouvrez la page de votre client. Tout est là — ce dont vous avez discuté la dernière fois, ce sur quoi il travaille, comment il va. Pas besoin de fouiller dans les dossiers.',
          },
          icon: Clock,
        },
        {
          time: { en: 'During a session', fr: 'Pendant une séance' },
          description: {
            en: 'You\'re present. Notes flow naturally. The small things your client shares don\'t get lost.',
            fr: 'Vous êtes présent. Les notes coulent naturellement. Les petites choses que votre client partage ne se perdent pas.',
          },
          icon: Heart,
        },
        {
          time: { en: 'Between sessions', fr: 'Entre les séances' },
          description: {
            en: 'Your client has a tough week. They can reflect on their own, access what you\'ve shared, and feel supported — without waiting for the next appointment.',
            fr: 'Votre client a une semaine difficile. Il peut réfléchir seul, accéder à ce que vous avez partagé, et se sentir soutenu — sans attendre le prochain rendez-vous.',
          },
          icon: MessageSquare,
        },
        {
          time: { en: 'Over time', fr: 'Au fil du temps' },
          description: {
            en: 'You see the real journey. Not just snapshots, but how someone actually grows. The kind of progress that\'s hard to see week by week, but unmistakable month by month.',
            fr: 'Vous voyez le vrai parcours. Pas juste des instantanés, mais comment quelqu\'un grandit réellement. Le genre de progrès difficile à voir semaine par semaine, mais indéniable mois après mois.',
          },
          icon: Zap,
        },
      ],
    },
    aiTrust: {
      badge: { en: 'About AI', fr: 'À propos de l\'IA' },
      headline: {
        en: 'AI that supports your judgment,',
        fr: 'Une IA qui soutient votre jugement,',
      },
      headlineAccent: {
        en: 'never replaces it.',
        fr: 'ne le remplace jamais.',
      },
      highlight: {
        en: 'It never interprets. Never diagnoses. Always defers to you.',
        fr: 'Elle n\'interprète jamais. Ne diagnostique jamais. Vous laisse toujours le dernier mot.',
      },
      description: {
        en: 'Our tools help you prepare faster, see patterns you might miss, and spend less time on admin. You stay in control of every clinical decision.',
        fr: 'Nos outils vous aident à vous préparer plus vite, voir des tendances que vous pourriez manquer, et passer moins de temps sur l\'administratif. Vous gardez le contrôle de chaque décision clinique.',
      },
    },
    audience: {
      headline: { en: 'Built for', fr: 'Conçu pour' },
      subtitle: {
        en: 'Independent mental health practitioners who want to spend less time on admin and more time with clients.',
        fr: 'Les praticiens indépendants en santé mentale qui veulent passer moins de temps sur l\'administratif et plus avec leurs clients.'
      },
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
      headline: { en: 'Your clients\' trust is everything', fr: 'La confiance de vos clients est primordiale' },
      subtitle: {
        en: 'We take that as seriously as you do.',
        fr: 'Nous prenons cela aussi au sérieux que vous.'
      },
    },
    faq: {
      items: [
        {
          q: { en: 'Will Bloomsline change how I work?', fr: 'Bloomsline va-t-il changer ma façon de travailler ?' },
          a: {
            en: 'No. Bloomsline adapts to your workflow. Use as much or as little as you need. Start small and expand when you\'re ready.',
            fr: 'Non. Bloomsline s\'adapte à votre flux de travail. Utilisez autant ou aussi peu que nécessaire. Commencez petit et étendez quand vous êtes prêt.'
          },
        },
        {
          q: { en: 'Is AI required?', fr: 'L\'IA est-elle obligatoire ?' },
          a: {
            en: 'No. AI features are completely optional. You can use Bloomsline purely for organizing your practice — no AI needed.',
            fr: 'Non. Les fonctionnalités IA sont entièrement optionnelles. Vous pouvez utiliser Bloomsline uniquement pour organiser votre pratique — aucune IA nécessaire.'
          },
        },
        {
          q: { en: 'Is my clients\' data safe?', fr: 'Les données de mes clients sont-elles en sécurité ?' },
          a: {
            en: 'Yes. Encryption at every level, GDPR compliant, and your data is never used to train anything. You can delete any data permanently at any time.',
            fr: 'Oui. Chiffrement à tous les niveaux, conforme RGPD, et vos données ne sont jamais utilisées pour entraîner quoi que ce soit. Vous pouvez tout supprimer définitivement à tout moment.'
          },
        },
        {
          q: { en: 'What if it doesn\'t fit my practice?', fr: 'Et si ça ne correspond pas à ma pratique ?' },
          a: {
            en: 'Try it free. No commitment, no credit card. If it\'s not for you, no hard feelings.',
            fr: 'Essayez gratuitement. Sans engagement, sans carte de crédit. Si ce n\'est pas pour vous, pas de problème.'
          },
        },
      ],
    },
    cta: {
      headline: { en: 'Less admin. More connection.', fr: 'Moins d\'administratif. Plus de connexion.' },
      subtitle: {
        en: 'Join practitioners who are reclaiming their time for what actually matters.',
        fr: 'Rejoignez les praticiens qui récupèrent leur temps pour ce qui compte vraiment.'
      },
    },
  }

  const l = (obj: { en: string; fr: string }) => obj[locale as 'en' | 'fr'] || obj.en

  return (
    <div className="bg-white text-gray-900">
      <Navbar isPractitionerPage />

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-gradient-to-b from-orange-50/50 to-white overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              {/* Left: Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left flex-1"
              >
                <span className="inline-block px-4 py-2 bg-[#D4856A]/10 text-[#D4856A] rounded-full text-sm font-medium mb-6">
                  {l(content.hero.tagline)}
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] xl:text-6xl font-light text-neutral-900 mb-4 leading-tight">
                  {l(content.hero.headline)}
                  <br />
                  <span className="text-[#D4856A] lg:whitespace-nowrap">{l(content.hero.headlineAccent)}</span>
                </h1>

                <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                  {l(content.hero.subtitle)}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                  <button
                    onClick={handleOpenModal}
                    className="px-8 py-4 bg-[#D4856A] text-white rounded-full font-medium inline-flex items-center gap-2 hover:bg-[#c27459] transition-colors shadow-lg shadow-[#D4856A]/30"
                  >
                    {l(content.hero.cta)}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href={DEMO_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 rounded-full border-2 border-neutral-300 text-neutral-700 font-medium inline-flex items-center gap-2 hover:border-neutral-400 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    {l(content.hero.ctaSecondary)}
                  </a>
                </div>

                <p className="text-sm text-neutral-500">
                  {l(content.hero.trust)}
                </p>
              </motion.div>

              {/* Right: Abstract visual — practitioner's calm workspace */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden lg:block relative w-[400px] flex-shrink-0"
              >
                <div className="bg-gradient-to-br from-[#D4856A]/5 to-orange-50 rounded-3xl p-8 border border-[#D4856A]/10">
                  {/* Mini day timeline */}
                  <div className="space-y-4">
                    {[
                      { time: locale === 'fr' ? '9h00' : '9:00 AM', text: locale === 'fr' ? 'Contexte prêt avant la séance' : 'Context ready before the session', color: 'bg-amber-100 text-amber-700' },
                      { time: locale === 'fr' ? '10h30' : '10:30 AM', text: locale === 'fr' ? 'Notes capturées naturellement' : 'Notes captured naturally', color: 'bg-teal-100 text-teal-700' },
                      { time: locale === 'fr' ? '14h00' : '2:00 PM', text: locale === 'fr' ? 'Client soutenu entre les séances' : 'Client supported between sessions', color: 'bg-blue-100 text-blue-700' },
                      { time: locale === 'fr' ? '17h00' : '5:00 PM', text: locale === 'fr' ? 'Progrès visibles au fil du temps' : 'Progress visible over time', color: 'bg-purple-100 text-purple-700' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs text-neutral-400 w-14 text-right shrink-0">{item.time}</span>
                        <div className="w-2 h-2 rounded-full bg-[#D4856A]/40 shrink-0" />
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${item.color}`}>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="text-center text-sm text-[#D4856A] font-medium mt-6"
                  >
                    {locale === 'fr' ? 'Moins d\'admin. Plus de présence.' : 'Less admin. More presence.'}
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pain Point Section — their problems, no solutions named */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                {l(content.painPoint.headline)}
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-10">
                {l(content.painPoint.subtitle)}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 text-left">
                {content.painPoint.points.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-neutral-50 rounded-xl"
                  >
                    <p className="text-neutral-700 text-sm leading-relaxed">{l(point)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* A Day With Bloomsline — experience moments, no feature names */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                  {l(content.dayWith.headline)}
                </h2>
                <p className="text-lg text-neutral-600">
                  {l(content.dayWith.subtitle)}
                </p>
              </div>

              <div className="space-y-0">
                {content.dayWith.moments.map((moment, i) => {
                  const Icon = moment.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-6"
                    >
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#D4856A]/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-[#D4856A]" />
                        </div>
                        {i < content.dayWith.moments.length - 1 && (
                          <div className="w-px h-full bg-[#D4856A]/15 my-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-10">
                        <h3 className="font-medium text-neutral-900 mb-2">{l(moment.time)}</h3>
                        <p className="text-neutral-600 leading-relaxed">{l(moment.description)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* AI Trust Section */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-neutral-600 mb-6 border border-neutral-200">
                <Brain className="w-4 h-4" />
                {l(content.aiTrust.badge)}
              </span>

              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                {l(content.aiTrust.headline)}
                <br />
                <span className="text-[#D4856A]">{l(content.aiTrust.headlineAccent)}</span>
              </h2>

              <div className="inline-flex items-center gap-2 px-5 py-3 bg-[#D4856A]/10 rounded-xl text-[#D4856A] text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                {l(content.aiTrust.highlight)}
              </div>

              <p className="text-lg text-neutral-600 leading-relaxed">
                {l(content.aiTrust.description)}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                {l(content.audience.headline)}
              </h2>
              <p className="text-lg text-neutral-600 mb-10 max-w-2xl mx-auto">
                {l(content.audience.subtitle)}
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {content.audience.types.map((type, i) => (
                  <span
                    key={i}
                    className="px-5 py-3 bg-neutral-100 rounded-full text-neutral-700 font-medium hover:bg-neutral-200 transition-colors"
                  >
                    {l(type)}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Security Section — simplified */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                {l(content.security.headline)}
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                {l(content.security.subtitle)}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { en: 'Encrypted', fr: 'Chiffré' },
                  { en: 'GDPR compliant', fr: 'Conforme RGPD' },
                  { en: 'Your data stays yours', fr: 'Vos données restent vôtres' },
                  { en: 'Delete anytime', fr: 'Supprimez à tout moment' },
                ].map((item, i) => (
                  <span key={i} className="px-4 py-2 bg-white rounded-full text-sm text-neutral-700 border border-neutral-200">
                    {l(item)}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-2 bg-[#D4856A]/10 text-[#D4856A] rounded-full text-sm font-medium mb-4">
                  FAQ
                </span>
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900">
                  {locale === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions'}
                </h2>
              </div>

              <div className="space-y-4">
                {content.faq.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`rounded-2xl border transition-all ${openFaq === i ? 'bg-white border-[#D4856A]/30 shadow-lg' : 'bg-neutral-50 border-transparent hover:border-neutral-200'}`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-neutral-900 pr-4">{l(item.q)}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? 'bg-[#D4856A] text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {openFaq === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="px-6 pb-5"
                      >
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                {l(content.cta.headline)}
              </h2>
              <p className="text-lg text-neutral-600 mb-10">
                {l(content.cta.subtitle)}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleOpenModal}
                  className="px-8 py-4 bg-[#D4856A] text-white rounded-full font-medium inline-flex items-center gap-2 hover:bg-[#c27459] transition-colors shadow-lg shadow-[#D4856A]/30"
                >
                  {l(content.hero.cta)}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-full border-2 border-neutral-300 text-neutral-700 font-medium inline-flex items-center gap-2 hover:border-neutral-400 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  {l(content.hero.ctaSecondary)}
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

export default function PractitionerNewLandingPage() {
  return (
    <TabProvider defaultTab="practitioner">
      <EarlyAccessModalProvider>
        <PractitionerNewContent />
      </EarlyAccessModalProvider>
    </TabProvider>
  )
}
