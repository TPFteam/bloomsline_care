'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 2025',
      intro: 'At Bloomsline, your privacy matters deeply to us. This policy explains how we handle your information.',
      mvpNote: 'Bloomsline is currently in early development and testing. This privacy policy will be updated as we finalize our practices before public launch.',
      sections: [
        {
          title: 'Information We Collect',
          content: 'We collect information you provide directly, such as your name, email address, and any content you create within the platform. We also collect usage data to improve our services.'
        },
        {
          title: 'How We Use Your Information',
          content: 'We use your information to provide and improve our services, communicate with you, and ensure the security of your account. We never sell your personal data to third parties.'
        },
        {
          title: 'Data Storage & Security',
          content: 'Your data is stored securely using industry-standard encryption. We use trusted cloud infrastructure providers and implement strict access controls.'
        },
        {
          title: 'Your Rights',
          content: 'You have the right to access, correct, or delete your personal data at any time. You can also request a copy of your data or ask us to stop processing it.'
        },
        {
          title: 'Contact Us',
          content: 'If you have questions about this privacy policy or your data, please contact us at hi@bloomsline.com.'
        }
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : Janvier 2025',
      intro: 'Chez Bloomsline, votre vie privée nous tient à cœur. Cette politique explique comment nous traitons vos informations.',
      mvpNote: 'Bloomsline est actuellement en développement et en phase de test. Cette politique de confidentialité sera mise à jour avant le lancement public.',
      sections: [
        {
          title: 'Informations que nous collectons',
          content: 'Nous collectons les informations que vous fournissez directement, telles que votre nom, adresse email et tout contenu que vous créez sur la plateforme. Nous collectons également des données d\'utilisation pour améliorer nos services.'
        },
        {
          title: 'Comment nous utilisons vos informations',
          content: 'Nous utilisons vos informations pour fournir et améliorer nos services, communiquer avec vous et assurer la sécurité de votre compte. Nous ne vendons jamais vos données personnelles à des tiers.'
        },
        {
          title: 'Stockage et sécurité des données',
          content: 'Vos données sont stockées de manière sécurisée en utilisant un chiffrement aux normes de l\'industrie. Nous utilisons des fournisseurs d\'infrastructure cloud de confiance et mettons en place des contrôles d\'accès stricts.'
        },
        {
          title: 'Vos droits',
          content: 'Vous avez le droit d\'accéder, de corriger ou de supprimer vos données personnelles à tout moment. Vous pouvez également demander une copie de vos données ou nous demander d\'arrêter de les traiter.'
        },
        {
          title: 'Nous contacter',
          content: 'Si vous avez des questions sur cette politique de confidentialité ou vos données, veuillez nous contacter à hi@bloomsline.com.'
        }
      ]
    }
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
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-lavender-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-lavender-600" />
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

            {/* Sections */}
            <div className="space-y-10">
              {t.sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <h2 className="text-xl font-medium text-neutral-900 mb-3">
                    {section.title}
                  </h2>
                  <p className="text-neutral-600 leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
