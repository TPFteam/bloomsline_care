'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Users,
  FileText,
  BarChart3,
  Shield,
  Lock,
  Sparkles,
  Brain,
  Heart,
  Calendar,
  Clock,
  X,
  ChevronDown,
  Zap,
  Eye,
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

  // Content
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
        en: 'Understand your clients better. Support their growth with personalized resources, track progress meaningfully, and spend less time on admin.',
        fr: 'Comprenez mieux vos clients. Soutenez leur croissance avec des ressources personnalisées, suivez leurs progrès de manière significative, et passez moins de temps sur l\'administratif.',
      },
      cta: {
        en: 'Get Early Access',
        fr: 'Accès anticipé',
      },
      ctaSecondary: {
        en: 'Book a Demo',
        fr: 'Réserver une démo',
      },
      trust: {
        en: 'No credit card required',
        fr: 'Pas de carte de crédit requise',
      },
    },
    painPoint: {
      headline: {
        en: 'The real challenge:',
        fr: 'Le vrai défi :',
      },
      headlineAccent: {
        en: 'staying connected between sessions',
        fr: 'rester connecté entre les séances',
      },
      subtitle: {
        en: 'After a session, insights fade. Notes pile up. Context gets lost. And the next session starts from scratch.',
        fr: 'Après une séance, les insights s\'estompent. Les notes s\'accumulent. Le contexte se perd. Et la prochaine séance repart de zéro.',
      },
      points: [
        {
          en: 'Client history centralized and always accessible',
          fr: 'Historique client centralisé et toujours accessible',
        },
        {
          en: 'AI-powered summaries to prepare sessions in minutes',
          fr: 'Résumés générés par IA pour préparer les séances en quelques minutes',
        },
        {
          en: 'Progress tracking that shows the real journey',
          fr: 'Suivi des progrès qui montre le vrai parcours',
        },
        {
          en: 'Therapeutic resources you can share instantly',
          fr: 'Ressources thérapeutiques à partager instantanément',
        },
      ],
    },
    beforeAfter: {
      headline: {
        en: 'From scattered to structured',
        fr: 'Du dispersé au structuré',
      },
      subtitle: {
        en: 'Bloomsline brings clarity to your practice without changing how you work.',
        fr: 'Bloomsline apporte de la clarté à votre pratique sans changer votre façon de travailler.',
      },
      before: {
        title: { en: 'Without Bloomsline', fr: 'Sans Bloomsline' },
        points: [
          { en: 'Notes scattered across apps and notebooks', fr: 'Notes dispersées entre apps et carnets' },
          { en: 'Time lost searching for client history', fr: 'Temps perdu à chercher l\'historique client' },
          { en: 'Generic resources that don\'t fit', fr: 'Ressources génériques qui ne correspondent pas' },
          { en: 'No clear picture of client progress', fr: 'Pas de vision claire des progrès client' },
          { en: 'Admin work eating into session prep', fr: 'L\'administratif empiète sur la préparation' },
        ],
      },
      after: {
        title: { en: 'With Bloomsline', fr: 'Avec Bloomsline' },
        points: [
          { en: 'Everything centralized in one place', fr: 'Tout centralisé en un seul endroit' },
          { en: 'Instant context before every session', fr: 'Contexte instantané avant chaque séance' },
          { en: 'Personalized resources for each client', fr: 'Ressources personnalisées pour chaque client' },
          { en: 'Visual progress tracking over time', fr: 'Suivi visuel des progrès dans le temps' },
          { en: 'More time for what matters: your clients', fr: 'Plus de temps pour ce qui compte : vos clients' },
        ],
      },
    },
    features: [
      {
        icon: Users,
        title: { en: 'Member Hub', fr: 'Espace Clients' },
        description: {
          en: 'Centralized profiles with history, preferences, and therapeutic context. Know your clients deeply.',
          fr: 'Profils centralisés avec historique, préférences et contexte thérapeutique. Connaissez vos clients en profondeur.'
        },
      },
      {
        icon: FileText,
        title: { en: 'Resource Library', fr: 'Bibliothèque de Ressources' },
        description: {
          en: 'Create, customize, and share therapeutic worksheets and exercises. Build your toolkit.',
          fr: 'Créez, personnalisez et partagez des fiches et exercices thérapeutiques. Construisez votre boîte à outils.'
        },
      },
      {
        icon: Sparkles,
        title: { en: 'Bloom Pulse', fr: 'Bloom Pulse' },
        description: {
          en: 'AI-generated summaries that capture key themes, progress, and areas of attention.',
          fr: 'Résumés générés par IA qui capturent les thèmes clés, les progrès et les points d\'attention.'
        },
      },
      {
        icon: BarChart3,
        title: { en: 'Progress Tracking', fr: 'Suivi des Progrès' },
        description: {
          en: 'Visual milestones and goals that show the therapeutic journey over time.',
          fr: 'Jalons visuels et objectifs qui montrent le parcours thérapeutique dans le temps.'
        },
      },
      {
        icon: Calendar,
        title: { en: 'Session Management', fr: 'Gestion des Séances' },
        description: {
          en: 'Schedule, track, and prepare for sessions with integrated notes and context.',
          fr: 'Planifiez, suivez et préparez vos séances avec notes et contexte intégrés.'
        },
      },
      {
        icon: MessageSquare,
        title: { en: 'Client Portal', fr: 'Portail Client' },
        description: {
          en: 'Give clients access to shared resources, session confirmations, and their own reflections.',
          fr: 'Donnez à vos clients accès aux ressources partagées, confirmations de séance et leurs propres réflexions.'
        },
      },
    ],
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
        en: 'AI never interprets, never diagnoses, and always defers to you.',
        fr: 'L\'IA n\'interprète jamais, ne diagnostique jamais, et vous laisse toujours le dernier mot.',
      },
      description: {
        en: 'Bloom Pulse helps you structure notes, surface patterns, and prepare for sessions faster. You stay in control of your clinical decisions, your data, and your practice.',
        fr: 'Bloom Pulse vous aide à structurer vos notes, faire émerger des patterns, et préparer vos séances plus vite. Vous gardez le contrôle de vos décisions cliniques, vos données et votre pratique.',
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
      headline: { en: 'Security & Privacy', fr: 'Sécurité & Confidentialité' },
      subtitle: {
        en: 'Your data and your clients\' data are protected.',
        fr: 'Vos données et celles de vos clients sont protégées.'
      },
      points: [
        { icon: Lock, text: { en: 'Data encrypted in transit and at rest', fr: 'Données chiffrées en transit et au repos' } },
        { icon: Shield, text: { en: 'GDPR compliant', fr: 'Conforme RGPD' } },
        { icon: Eye, text: { en: 'No data used to train AI models', fr: 'Aucune donnée utilisée pour entraîner l\'IA' } },
        { icon: X, text: { en: 'Permanent deletion on request', fr: 'Suppression permanente sur demande' } },
      ],
    },
    faq: {
      headline: { en: 'Questions?', fr: 'Questions ?' },
      items: [
        {
          q: { en: 'Will Bloomsline change how I work?', fr: 'Bloomsline va-t-il changer ma façon de travailler ?' },
          a: {
            en: 'No. Bloomsline adapts to your workflow. Use as much or as little as you need. Start with one feature and expand when ready.',
            fr: 'Non. Bloomsline s\'adapte à votre flux de travail. Utilisez autant ou aussi peu que nécessaire. Commencez avec une fonctionnalité et étendez quand vous êtes prêt.'
          },
        },
        {
          q: { en: 'Do I have to use AI?', fr: 'Dois-je utiliser l\'IA ?' },
          a: {
            en: 'The AI features are optional. You can use Bloomsline purely for client management and resource sharing without ever generating a Bloom Pulse.',
            fr: 'Les fonctionnalités IA sont optionnelles. Vous pouvez utiliser Bloomsline uniquement pour la gestion client et le partage de ressources sans jamais générer un Bloom Pulse.'
          },
        },
        {
          q: { en: 'Is my clients\' data safe?', fr: 'Les données de mes clients sont-elles en sécurité ?' },
          a: {
            en: 'Yes. We use bank-level encryption, comply with GDPR, and never use your data to train AI. You can delete any data permanently at any time.',
            fr: 'Oui. Nous utilisons un chiffrement de niveau bancaire, respectons le RGPD, et n\'utilisons jamais vos données pour entraîner l\'IA. Vous pouvez supprimer toute donnée définitivement à tout moment.'
          },
        },
        {
          q: { en: 'What if it doesn\'t fit my practice?', fr: 'Et si ça ne correspond pas à ma pratique ?' },
          a: {
            en: 'We offer a free trial so you can test everything. No commitment, no credit card required. Cancel anytime.',
            fr: 'Nous offrons un essai gratuit pour que vous puissiez tout tester. Sans engagement, sans carte de crédit. Annulez quand vous voulez.'
          },
        },
      ],
    },
    cta: {
      headline: { en: 'Ready to simplify your practice?', fr: 'Prêt à simplifier votre pratique ?' },
      subtitle: {
        en: 'Join practitioners who are spending less time on admin and more time with clients.',
        fr: 'Rejoignez les praticiens qui passent moins de temps sur l\'administratif et plus avec leurs clients.'
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

              {/* Right: Client Profile Animation */}
              <div className="hidden lg:block relative h-[380px] w-[440px] flex-shrink-0">
                {/* Profile card appears */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 2.2 }}
                  className="absolute inset-0 bg-white rounded-2xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden"
                >
                  {/* Profile header */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 0.4 }}
                    className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4856A] to-orange-300 flex items-center justify-center text-white font-medium">
                      MR
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">Marie R.</div>
                      <div className="text-xs text-neutral-500">{locale === 'fr' ? 'Cliente depuis 8 mois' : 'Client for 8 months'}</div>
                    </div>
                    <div className="ml-auto px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full font-medium">
                      {locale === 'fr' ? 'Actif' : 'Active'}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Floating Note */}
                <motion.div
                  initial={{ x: -60, y: 40, rotate: -12, opacity: 0 }}
                  animate={{ x: 16, y: 90, rotate: 0, opacity: 1 }}
                  transition={{ duration: 2.2, delay: 0.2, ease: "easeOut" }}
                  className="absolute z-10"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                    className="bg-amber-50 rounded-xl p-3 shadow-lg border border-amber-100 w-[195px]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">{locale === 'fr' ? 'Note de séance' : 'Session note'}</span>
                    </div>
                    <p className="text-xs text-amber-900/70 leading-relaxed line-clamp-2">
                      {locale === 'fr' ? 'Progrès notable dans la gestion du stress. Continue les exercices de respiration...' : 'Notable progress in stress management. Continuing breathing exercises...'}
                    </p>
                  </motion.div>
                </motion.div>

                {/* Floating Session */}
                <motion.div
                  initial={{ x: 400, y: 20, rotate: 10, opacity: 0 }}
                  animate={{ x: 224, y: 90, rotate: 0, opacity: 1 }}
                  transition={{ duration: 2.2, delay: 0.4, ease: "easeOut" }}
                  className="absolute z-10"
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2.7 }}
                    className="bg-blue-50 rounded-xl p-3 shadow-lg border border-blue-100 w-[195px]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">{locale === 'fr' ? 'Prochaine séance' : 'Next session'}</span>
                    </div>
                    <p className="text-sm font-medium text-blue-900">{locale === 'fr' ? 'Lundi, 14h00' : 'Monday, 2:00 PM'}</p>
                    <p className="text-xs text-blue-600">{locale === 'fr' ? 'Suivi mensuel' : 'Monthly follow-up'}</p>
                  </motion.div>
                </motion.div>

                {/* Floating Progress */}
                <motion.div
                  initial={{ x: -40, y: 280, rotate: -8, opacity: 0 }}
                  animate={{ x: 16, y: 200, rotate: 0, opacity: 1 }}
                  transition={{ duration: 2.2, delay: 0.6, ease: "easeOut" }}
                  className="absolute z-10"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.9 }}
                    className="bg-green-50 rounded-xl p-3 shadow-lg border border-green-100 w-[195px]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{locale === 'fr' ? 'Progrès' : 'Progress'}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-8 flex-1 rounded-md ${i <= 4 ? 'bg-green-400' : 'bg-green-200'}`}
                          style={{ height: `${20 + i * 6}px` }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-green-700 mt-2">{locale === 'fr' ? 'En bonne voie' : 'On track'}</p>
                  </motion.div>
                </motion.div>

                {/* Floating Bloom Pulse */}
                <motion.div
                  initial={{ x: 380, y: 300, rotate: 15, opacity: 0 }}
                  animate={{ x: 224, y: 200, rotate: 0, opacity: 1 }}
                  transition={{ duration: 2.2, delay: 0.8, ease: "easeOut" }}
                  className="absolute z-10"
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 3.1 }}
                    className="bg-[#D4856A]/10 rounded-xl p-3 shadow-lg border border-[#D4856A]/20 w-[195px]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4856A]" />
                      <span className="text-xs font-medium text-[#D4856A]">Bloom Pulse</span>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed line-clamp-2">
                      {locale === 'fr' ? 'Évolution positive. Thèmes clés : confiance, communication...' : 'Positive evolution. Key themes: confidence, communication...'}
                    </p>
                  </motion.div>
                </motion.div>

                {/* Caption */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3, duration: 0.5 }}
                  className="absolute bottom-3 left-0 right-0 text-center"
                >
                  <span className="text-sm text-[#D4856A] font-medium">
                    {locale === 'fr' ? 'Un profil complet, une vraie connexion' : 'A complete profile, a real connection'}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                  {l(content.painPoint.headline)}
                  <span className="text-[#D4856A]"> {l(content.painPoint.headlineAccent)}</span>
                </h2>
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                  {l(content.painPoint.subtitle)}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {content.painPoint.points.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#D4856A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-[#D4856A]" />
                    </div>
                    <span className="text-neutral-700">{l(point)}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Before/After Section */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
                  {l(content.beforeAfter.headline)}
                </h2>
                <p className="text-lg text-neutral-600">
                  {l(content.beforeAfter.subtitle)}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <X className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wider">Before</span>
                      <h3 className="font-medium text-neutral-900">{l(content.beforeAfter.before.title)}</h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {content.beforeAfter.before.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 flex-shrink-0" />
                        {l(point)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* After */}
                <div className="bg-gradient-to-br from-[#D4856A]/5 to-orange-50 rounded-2xl p-6 border border-[#D4856A]/20 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <Sparkles className="w-5 h-5 text-[#D4856A]/30" />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#D4856A]/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-[#D4856A]" />
                    </div>
                    <div>
                      <span className="text-xs text-[#D4856A] uppercase tracking-wider">After</span>
                      <h3 className="font-medium text-neutral-900">{l(content.beforeAfter.after.title)}</h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {content.beforeAfter.after.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-neutral-700">
                        <Check className="w-4 h-4 text-[#D4856A] mt-0.5 flex-shrink-0" />
                        {l(point)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-neutral-50 rounded-2xl hover:bg-neutral-100/80 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#D4856A]/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-[#D4856A]" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">{l(feature.title)}</h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">{l(feature.description)}</p>
                  </motion.div>
                ))}
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

        {/* Security Section */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-3">
                  {l(content.security.headline)}
                </h2>
                <p className="text-neutral-600 text-lg">
                  {l(content.security.subtitle)}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Encryption */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-5 border border-neutral-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-1">
                    {locale === 'fr' ? 'Sécurisé par défaut' : 'Secure by default'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {locale === 'fr' ? 'Données chiffrées en transit et au repos' : 'Data encrypted in transit and at rest'}
                  </p>
                </motion.div>

                {/* GDPR */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-5 border border-neutral-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-1">
                    {locale === 'fr' ? 'Conforme RGPD' : 'GDPR compliant'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {locale === 'fr' ? 'Respect des normes européennes' : 'European standards compliance'}
                  </p>
                </motion.div>

                {/* No AI training */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-5 border border-neutral-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-1">
                    {locale === 'fr' ? 'Vos données restent vôtres' : 'Your data stays yours'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {locale === 'fr' ? 'Jamais utilisées pour entraîner l\'IA' : 'Never used to train AI models'}
                  </p>
                </motion.div>

                {/* Deletion */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl p-5 border border-neutral-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#D4856A]/10 flex items-center justify-center mb-4">
                    <X className="w-6 h-6 text-[#D4856A]" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-1">
                    {locale === 'fr' ? 'Suppression complète' : 'Full deletion'}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {locale === 'fr' ? 'Suppression permanente sur demande' : 'Permanent deletion on request'}
                  </p>
                </motion.div>
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
