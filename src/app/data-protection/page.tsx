'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { Database, Globe, UserCheck, Trash2, Download, HelpCircle } from 'lucide-react'

export default function DataProtectionPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Data Protection',
      lastUpdated: 'Last updated: January 2025',
      intro: 'We believe you should have full control over your personal data. Here\'s how we protect it and what rights you have.',
      mvpNote: 'Bloomsline is currently in early development and testing. Our data protection practices align with GDPR principles and will be formalized before public launch.',
      rights: [
        {
          icon: UserCheck,
          title: 'Right to Access',
          description: 'You can request a copy of all personal data we hold about you at any time.'
        },
        {
          icon: Database,
          title: 'Right to Rectification',
          description: 'You can update or correct your personal information whenever you need to.'
        },
        {
          icon: Trash2,
          title: 'Right to Erasure',
          description: 'You can request deletion of your account and all associated data.'
        },
        {
          icon: Download,
          title: 'Right to Portability',
          description: 'You can export your data in a common format to use elsewhere.'
        },
        {
          icon: Globe,
          title: 'Right to Restrict Processing',
          description: 'You can ask us to limit how we use your data in certain circumstances.'
        },
        {
          icon: HelpCircle,
          title: 'Right to Object',
          description: 'You can object to certain types of data processing, including marketing.'
        }
      ],
      sections: [
        {
          title: 'Data We Collect',
          content: 'We collect only what\'s necessary: account information (name, email), content you create (rituals, moments, reflections), and usage data to improve our service. We never collect more than we need.'
        },
        {
          title: 'How Long We Keep Data',
          content: 'We retain your data while your account is active. If you delete your account, we remove your personal data within 30 days, except where legally required to retain it.'
        },
        {
          title: 'Data Sharing',
          content: 'We do not sell your data. We share data only with essential service providers (hosting, email) under strict contracts, or when legally required.'
        },
        {
          title: 'International Transfers',
          content: 'Your data may be processed in different countries. We ensure appropriate safeguards are in place for any international data transfers.'
        }
      ],
      exercise: {
        title: 'Exercise Your Rights',
        content: 'To exercise any of these rights, contact us at hi@bloomsline.com. We will respond to your request within 30 days.'
      }
    },
    fr: {
      title: 'Protection des Données',
      lastUpdated: 'Dernière mise à jour : Janvier 2025',
      intro: 'Nous croyons que vous devez avoir le contrôle total de vos données personnelles. Voici comment nous les protégeons et quels sont vos droits.',
      mvpNote: 'Bloomsline est actuellement en développement et en phase de test. Nos pratiques de protection des données sont alignées sur les principes du RGPD et seront formalisées avant le lancement public.',
      rights: [
        {
          icon: UserCheck,
          title: 'Droit d\'accès',
          description: 'Vous pouvez demander une copie de toutes les données personnelles que nous détenons à votre sujet.'
        },
        {
          icon: Database,
          title: 'Droit de rectification',
          description: 'Vous pouvez mettre à jour ou corriger vos informations personnelles à tout moment.'
        },
        {
          icon: Trash2,
          title: 'Droit à l\'effacement',
          description: 'Vous pouvez demander la suppression de votre compte et de toutes les données associées.'
        },
        {
          icon: Download,
          title: 'Droit à la portabilité',
          description: 'Vous pouvez exporter vos données dans un format courant pour les utiliser ailleurs.'
        },
        {
          icon: Globe,
          title: 'Droit à la limitation',
          description: 'Vous pouvez nous demander de limiter l\'utilisation de vos données dans certaines circonstances.'
        },
        {
          icon: HelpCircle,
          title: 'Droit d\'opposition',
          description: 'Vous pouvez vous opposer à certains types de traitement de données, y compris le marketing.'
        }
      ],
      sections: [
        {
          title: 'Données que nous collectons',
          content: 'Nous collectons uniquement ce qui est nécessaire : informations de compte (nom, email), contenu que vous créez (rituels, moments, réflexions) et données d\'utilisation pour améliorer notre service. Nous ne collectons jamais plus que nécessaire.'
        },
        {
          title: 'Durée de conservation',
          content: 'Nous conservons vos données tant que votre compte est actif. Si vous supprimez votre compte, nous supprimons vos données personnelles dans les 30 jours, sauf obligation légale de les conserver.'
        },
        {
          title: 'Partage des données',
          content: 'Nous ne vendons pas vos données. Nous partageons des données uniquement avec des prestataires essentiels (hébergement, email) sous contrats stricts, ou lorsque la loi l\'exige.'
        },
        {
          title: 'Transferts internationaux',
          content: 'Vos données peuvent être traitées dans différents pays. Nous veillons à ce que des garanties appropriées soient en place pour tout transfert international de données.'
        }
      ],
      exercise: {
        title: 'Exercer vos droits',
        content: 'Pour exercer l\'un de ces droits, contactez-nous à hi@bloomsline.com. Nous répondrons à votre demande dans les 30 jours.'
      }
    }
  }

  const t = content[locale as keyof typeof content] || content.en

  return (
    <EarlyAccessModalProvider>
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
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
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

            {/* Your Rights Section */}
            <h2 className="text-2xl font-light text-neutral-900 mb-6">
              {locale === 'fr' ? 'Vos droits' : 'Your Rights'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {t.rights.map((right, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 bg-neutral-50 rounded-2xl"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                    <right.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    {right.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {right.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Additional Sections */}
            <div className="space-y-10 mb-12">
              {t.sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
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

            {/* Exercise Rights Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1 }}
              className="p-6 bg-teal-50 rounded-2xl"
            >
              <h2 className="text-xl font-medium text-neutral-900 mb-3">
                {t.exercise.title}
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                {t.exercise.content}
              </p>
            </motion.div>
          </motion.div>
        </div>
        </main>
        <Footer />
      </div>
    </EarlyAccessModalProvider>
  )
}
