'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Lock, Server, Eye, Key, ShieldCheck, Bell } from 'lucide-react'

export default function SecurityPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Security',
      lastUpdated: 'Last updated: January 2025',
      intro: 'Your trust is our foundation. We take security seriously and implement robust measures to protect your data.',
      mvpNote: 'Bloomsline is currently in early development and testing. Our security practices will continue to evolve as we prepare for public launch.',
      practices: [
        {
          icon: Lock,
          title: 'Encryption',
          description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.'
        },
        {
          icon: Server,
          title: 'Secure Infrastructure',
          description: 'We use trusted cloud providers with SOC 2 compliance and implement strict access controls.'
        },
        {
          icon: Eye,
          title: 'Privacy by Design',
          description: 'We collect only what we need and give you control over your data at every step.'
        },
        {
          icon: Key,
          title: 'Authentication',
          description: 'Secure authentication with support for strong passwords and session management.'
        },
        {
          icon: ShieldCheck,
          title: 'Regular Audits',
          description: 'We continuously monitor our systems and will conduct regular security assessments.'
        },
        {
          icon: Bell,
          title: 'Incident Response',
          description: 'We have procedures in place to detect, respond to, and notify you of any security incidents.'
        }
      ],
      commitment: {
        title: 'Our Commitment',
        content: 'Security is not a feature—it\'s a core part of how we build Bloomsline. We are committed to protecting your personal information and the trust you place in us.'
      },
      contact: {
        title: 'Report a Vulnerability',
        content: 'If you discover a security issue, please contact us immediately at hi@bloomsline.com. We appreciate responsible disclosure and will work with you to address any concerns.'
      }
    },
    fr: {
      title: 'Sécurité',
      lastUpdated: 'Dernière mise à jour : Janvier 2025',
      intro: 'Votre confiance est notre fondement. Nous prenons la sécurité au sérieux et mettons en place des mesures robustes pour protéger vos données.',
      mvpNote: 'Bloomsline est actuellement en développement et en phase de test. Nos pratiques de sécurité continueront d\'évoluer avant le lancement public.',
      practices: [
        {
          icon: Lock,
          title: 'Chiffrement',
          description: 'Toutes les données sont chiffrées en transit avec TLS 1.3 et au repos avec le chiffrement AES-256.'
        },
        {
          icon: Server,
          title: 'Infrastructure sécurisée',
          description: 'Nous utilisons des fournisseurs cloud de confiance conformes SOC 2 et mettons en place des contrôles d\'accès stricts.'
        },
        {
          icon: Eye,
          title: 'Confidentialité par conception',
          description: 'Nous ne collectons que ce dont nous avons besoin et vous donnons le contrôle de vos données à chaque étape.'
        },
        {
          icon: Key,
          title: 'Authentification',
          description: 'Authentification sécurisée avec prise en charge de mots de passe forts et gestion des sessions.'
        },
        {
          icon: ShieldCheck,
          title: 'Audits réguliers',
          description: 'Nous surveillons continuellement nos systèmes et effectuerons des évaluations de sécurité régulières.'
        },
        {
          icon: Bell,
          title: 'Réponse aux incidents',
          description: 'Nous avons des procédures en place pour détecter, répondre et vous notifier de tout incident de sécurité.'
        }
      ],
      commitment: {
        title: 'Notre engagement',
        content: 'La sécurité n\'est pas une fonctionnalité—c\'est une partie essentielle de la façon dont nous construisons Bloomsline. Nous nous engageons à protéger vos informations personnelles et la confiance que vous nous accordez.'
      },
      contact: {
        title: 'Signaler une vulnérabilité',
        content: 'Si vous découvrez un problème de sécurité, veuillez nous contacter immédiatement à hi@bloomsline.com. Nous apprécions la divulgation responsable et travaillerons avec vous pour résoudre tout problème.'
      }
    }
  }

  const t = content[locale as keyof typeof content] || content.en

  return (
    <div className="bg-white text-gray-900">
      <Navbar />
      <main className="min-h-screen bg-white pt-20">
        <div className="container mx-auto px-6 py-12 lg:py-20 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-light text-neutral-900">
                  {t.title}
                </h1>
                <p className="text-sm text-neutral-400 mt-1">{t.lastUpdated}</p>
              </div>
            </div>

            {/* MVP Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-amber-800">{t.mvpNote}</p>
            </div>

            {/* Intro */}
            <p className="text-neutral-600 leading-relaxed mb-12 text-lg">
              {t.intro}
            </p>

            {/* Security Practices Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {t.practices.map((practice, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 bg-neutral-50 rounded-2xl"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <practice.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    {practice.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {practice.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Commitment Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mb-10"
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-3">
                {t.commitment.title}
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                {t.commitment.content}
              </p>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="p-6 bg-teal-50 rounded-2xl"
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-3">
                {t.contact.title}
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                {t.contact.content}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
