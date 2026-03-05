'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider, useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'
import { Heart, Sprout, Hand, Users, Globe, Sparkles } from 'lucide-react'

const valueIcons = [Sprout, Hand, Heart, Users, Globe]

function AboutContent() {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()

  // Scroll to hash anchor after mount (Next.js client nav doesn't auto-scroll)
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 600)
    }
  }, [])

  const content = {
    en: {
      title: 'About Bloomsline',
      problem: {
        title: 'The Problem',
        text: 'What happens in a session doesn\'t always carry over to the next one. Notes get scattered, progress gets lost, and practitioners spend more time on admin than on care.',
      },
      origin: {
        title: 'How It Started',
        text1: 'Bloomsline started as Doctalink — a project born from curiosity about how care actually works.',
        text2: 'By listening to practitioners and the people they support, we discovered something unexpected: the real gap in care isn\'t during sessions. It\'s what happens between them.',
        text3: 'We didn\'t just build a product. We earned the insight to build the right one.',
      },
      what: {
        title: 'What Bloomsline Is',
        intro: 'An all-in-one clinical platform where both sides of care are connected.',
        practitioner: {
          title: 'For practitioners',
          items: ['Session management', 'Progress tracking', 'Clinical notes', 'Shared resources'],
        },
        member: {
          title: 'For members',
          items: ['Moments & reflections', 'Daily rituals', 'AI companion', 'Practitioner connection'],
        },
      },
      different: {
        title: 'What Makes Us Different',
        text: 'Bloomsline isn\'t a practice management tool. It isn\'t a wellness app. It\'s the bridge between both — connecting practitioners and the people they support into one continuous experience of care.',
      },
      mission: {
        title: 'Our Mission & Values',
        statement: 'We believe care is more than a session. Our mission is to help practitioners stay connected to the people they support and give everyone the tools to keep growing, without guilt, at their own pace.',
        values: [
          { title: 'Small moments matter', description: 'Healing doesn\'t always happen in breakthroughs. Sometimes it\'s a quiet walk, a deep breath, or writing three words in a journal.' },
          { title: 'Gentleness by design', description: 'Every interaction should feel safe. We design with softness, never pressure.' },
          { title: 'Showing up over doing more', description: 'Consistency beats intensity. We celebrate presence, not perfection.' },
          { title: 'Human connection first', description: 'Technology should bring people closer, not replace the warmth of real relationships.' },
          { title: 'Care without barriers', description: 'Support should be accessible to everyone, regardless of language, location, or circumstance.' },
        ],
      },
      team: {
        title: 'The Team',
        intro: 'Two founders. One mission.',
        members: [
          { name: 'Aditya', role: 'Product & Technology', description: 'Turning research into a product that practitioners and members actually want to use.' },
          { name: 'Sarah', role: 'Sales & Operations', description: 'Building the relationships and systems that bring Bloomsline to the people who need it.' },
        ],
      },
      cta: 'Get Early Access',
    },
    fr: {
      title: 'À propos de Bloomsline',
      problem: {
        title: 'Le problème',
        text: 'Ce qui se passe en séance ne se prolonge pas toujours jusqu\'à la suivante. Les notes se dispersent, les progrès se perdent, et les praticiens passent plus de temps sur l\'administratif que sur le soin.',
      },
      origin: {
        title: 'Comment tout a commencé',
        text1: 'Bloomsline a commencé sous le nom de Doctalink — un projet né de la curiosité sur le fonctionnement réel du soin.',
        text2: 'En écoutant les praticiens et les personnes qu\'ils accompagnent, nous avons découvert quelque chose d\'inattendu : le vrai manque dans le soin n\'est pas pendant les séances. C\'est ce qui se passe entre elles.',
        text3: 'Nous n\'avons pas simplement construit un produit. Nous avons mérité la compréhension nécessaire pour construire le bon.',
      },
      what: {
        title: 'Ce qu\'est Bloomsline',
        intro: 'Une plateforme clinique tout-en-un où les deux côtés du soin sont connectés.',
        practitioner: {
          title: 'Pour les praticiens',
          items: ['Gestion des séances', 'Suivi des progrès', 'Notes cliniques', 'Ressources partagées'],
        },
        member: {
          title: 'Pour les membres',
          items: ['Moments & réflexions', 'Rituels quotidiens', 'Compagnon IA', 'Connexion avec le praticien'],
        },
      },
      different: {
        title: 'Ce qui nous différencie',
        text: 'Bloomsline n\'est pas un outil de gestion de cabinet. Ce n\'est pas une application de bien-être. C\'est le pont entre les deux — connectant les praticiens et les personnes qu\'ils accompagnent dans une expérience de soin continue.',
      },
      mission: {
        title: 'Notre mission et nos valeurs',
        statement: 'Nous croyons que le soin va au-delà d\'une séance. Notre mission est d\'aider les praticiens à rester connectés aux personnes qu\'ils accompagnent et de donner à chacun les outils pour continuer à avancer, sans culpabilité, à son propre rythme.',
        values: [
          { title: 'Les petits moments comptent', description: 'La guérison ne passe pas toujours par des percées. Parfois, c\'est une marche tranquille, une respiration profonde, ou trois mots dans un journal.' },
          { title: 'La douceur par conception', description: 'Chaque interaction doit être rassurante. Nous concevons avec douceur, jamais avec pression.' },
          { title: 'Être présent plutôt que faire plus', description: 'La régularité bat l\'intensité. Nous célébrons la présence, pas la perfection.' },
          { title: 'La connexion humaine d\'abord', description: 'La technologie devrait rapprocher les gens, pas remplacer la chaleur des vraies relations.' },
          { title: 'Le soin sans barrières', description: 'Le soutien devrait être accessible à tous, quelle que soit la langue, le lieu ou les circonstances.' },
        ],
      },
      team: {
        title: 'L\'équipe',
        intro: 'Deux fondateurs. Une mission.',
        members: [
          { name: 'Aditya', role: 'Produit & Technologie', description: 'Transformer la recherche en un produit que les praticiens et les membres veulent réellement utiliser.' },
          { name: 'Sarah', role: 'Ventes & Opérations', description: 'Construire les relations et les systèmes qui amènent Bloomsline aux personnes qui en ont besoin.' },
        ],
      },
      cta: 'Obtenir un accès anticipé',
    },
  }

  const t = content[locale as keyof typeof content] || content.en

  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="min-h-screen bg-white pt-20">
        <div className="container mx-auto px-6 py-12 lg:py-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-500" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-light text-neutral-900">
                {t.title}
              </h1>
            </div>

            {/* The Problem */}
            <motion.section
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-4">{t.problem.title}</h2>
              <blockquote className="border-l-4 border-rose-300 pl-6 py-2">
                <p className="text-lg text-neutral-600 leading-relaxed italic">
                  {t.problem.text}
                </p>
              </blockquote>
            </motion.section>

            {/* Origin Story */}
            <motion.section
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-4">{t.origin.title}</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>{t.origin.text1}</p>
                <p>{t.origin.text2}</p>
                <p className="font-medium text-neutral-800">{t.origin.text3}</p>
              </div>
            </motion.section>

            {/* What Bloomsline Is */}
            <motion.section
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-4">{t.what.title}</h2>
              <p className="text-neutral-600 leading-relaxed mb-6">{t.what.intro}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-teal-50 rounded-xl p-5">
                  <h3 className="font-medium text-teal-900 mb-3">{t.what.practitioner.title}</h3>
                  <ul className="space-y-2">
                    {t.what.practitioner.items.map((item, i) => (
                      <li key={i} className="text-sm text-teal-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-lavender-50 rounded-xl p-5">
                  <h3 className="font-medium text-lavender-900 mb-3">{t.what.member.title}</h3>
                  <ul className="space-y-2">
                    {t.what.member.items.map((item, i) => (
                      <li key={i} className="text-sm text-lavender-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-lavender-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* What Makes Us Different */}
            <motion.section
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-4">{t.different.title}</h2>
              <p className="text-neutral-600 leading-relaxed">{t.different.text}</p>
            </motion.section>

            {/* Mission & Values */}
            <motion.section
              id="mission"
              className="mb-16 scroll-mt-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-4">{t.mission.title}</h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8 italic">
                {t.mission.statement}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {t.mission.values.map((value, i) => {
                  const Icon = valueIcons[i]
                  return (
                    <motion.div
                      key={i}
                      className="bg-neutral-50 rounded-xl p-5 border border-neutral-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-4 h-4 text-neutral-400" />
                        <h3 className="font-medium text-neutral-900 text-sm">{value.title}</h3>
                      </div>
                      <p className="text-sm text-neutral-500 leading-relaxed">{value.description}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>

            {/* Team */}
            <motion.section
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-2">{t.team.title}</h2>
              <p className="text-neutral-500 mb-6">{t.team.intro}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {t.team.members.map((member, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 border border-neutral-200">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-sm font-medium text-neutral-600">{member.name[0]}</span>
                    </div>
                    <h3 className="font-medium text-neutral-900">{member.name}</h3>
                    <p className="text-sm text-neutral-400 mb-2">{member.role}</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">{member.description}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* CTA */}
            <motion.div
              className="text-center py-8 border-t border-neutral-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <button
                onClick={() => openModal()}
                className="px-8 py-3 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 transition-all duration-300"
              >
                {t.cta}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function AboutPage() {
  return (
    <EarlyAccessModalProvider>
      <AboutContent />
    </EarlyAccessModalProvider>
  )
}
