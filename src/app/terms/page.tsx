'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'
import { FileText } from 'lucide-react'

export default function TermsOfServicePage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: 30 March 2026',
      intro: 'Welcome to Bloomsline. By using our service, you agree to these terms. Please read them carefully.',
      mvpNote: 'Bloomsline is currently in early development and testing. These terms of service will be finalized before public launch.',
      sections: [
        {
          title: 'Legal Notice (Mentions Légales)',
          content: 'Publisher: Bloomsline Care, based in Paris, France. Company registration is currently in progress. Contact: hi@bloomsline.com. Hosting provider: Vercel Inc. (EU data region). Database hosting: Supabase Inc. (EU data region). This page will be updated with full legal details (SIRET, RCS) once company registration is complete, in accordance with French law n°2004-575 (LCEN).'
        },
        {
          title: 'Acceptance of Terms',
          content: 'By accessing or using Bloomsline, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.'
        },
        {
          title: 'Description of Service',
          content: 'Bloomsline is a wellbeing platform designed to help individuals track their personal growth and connect with practitioners. We provide tools for self-reflection, habit tracking, and therapeutic resource sharing.'
        },
        {
          title: 'User Accounts',
          content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account.'
        },
        {
          title: 'Acceptable Use',
          content: 'You agree to use Bloomsline only for lawful purposes. You may not use the service to harass, abuse, or harm others, or to share inappropriate or illegal content.'
        },
        {
          title: 'Intellectual Property',
          content: 'All content and materials available on Bloomsline, including but not limited to text, graphics, and software, are the property of Bloomsline or its licensors.'
        },
        {
          title: 'Data Protection',
          content: 'Bloomsline processes personal data in compliance with the GDPR (EU Regulation 2016/679) and the French Loi Informatique et Libertés. For details, see our Privacy Policy. You may exercise your data rights by contacting hi@bloomsline.com or by contacting the CNIL (www.cnil.fr).'
        },
        {
          title: 'Limitation of Liability',
          content: 'Bloomsline is not a substitute for professional medical or mental health advice. We are not liable for any decisions made based on information provided through our platform.'
        },
        {
          title: 'Applicable Law & Jurisdiction',
          content: 'These terms are governed by French law. Any dispute arising from the use of Bloomsline shall be subject to the exclusive jurisdiction of the courts of Paris, France.'
        },
        {
          title: 'Changes to Terms',
          content: 'We may update these terms from time to time. We will notify you of any significant changes. Continued use of the service after changes constitutes acceptance of the new terms.'
        },
        {
          title: 'Contact',
          content: 'For questions about these terms, please contact us at hi@bloomsline.com.'
        }
      ]
    },
    fr: {
      title: 'Conditions Générales d\'Utilisation',
      lastUpdated: 'Dernière mise à jour : 30 mars 2026',
      intro: 'Bienvenue sur Bloomsline. En utilisant notre service, vous acceptez ces conditions. Veuillez les lire attentivement.',
      mvpNote: 'Bloomsline est actuellement en développement et en phase de test. Ces conditions d\'utilisation seront finalisées avant le lancement public.',
      sections: [
        {
          title: 'Mentions légales',
          content: 'Éditeur : Bloomsline Care, basé à Paris, France. L\'immatriculation de la société est en cours. Contact : hi@bloomsline.com. Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA (région de données UE). Hébergement base de données : Supabase Inc. (région de données UE). Cette page sera mise à jour avec les informations légales complètes (SIRET, RCS) dès la finalisation de l\'immatriculation, conformément à la loi française n°2004-575 (LCEN).'
        },
        {
          title: 'Acceptation des conditions',
          content: 'En accédant ou en utilisant Bloomsline, vous acceptez d\'être lié par ces Conditions Générales d\'Utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser notre service.'
        },
        {
          title: 'Description du service',
          content: 'Bloomsline est une plateforme de bien-être conçue pour aider les individus à suivre leur développement personnel et à se connecter avec des praticiens. Nous fournissons des outils pour l\'auto-réflexion, le suivi des habitudes et le partage de ressources thérapeutiques.'
        },
        {
          title: 'Comptes utilisateurs',
          content: 'Vous êtes responsable de la confidentialité de vos identifiants de compte et de toutes les activités qui se produisent sous votre compte. Vous devez fournir des informations exactes lors de la création de votre compte.'
        },
        {
          title: 'Utilisation acceptable',
          content: 'Vous acceptez d\'utiliser Bloomsline uniquement à des fins légales. Vous ne pouvez pas utiliser le service pour harceler, abuser ou nuire à autrui, ni pour partager du contenu inapproprié ou illégal.'
        },
        {
          title: 'Propriété intellectuelle',
          content: 'Tout le contenu et les matériaux disponibles sur Bloomsline, y compris mais sans s\'y limiter les textes, graphiques et logiciels, sont la propriété de Bloomsline ou de ses concédants de licence.'
        },
        {
          title: 'Protection des données',
          content: 'Bloomsline traite les données personnelles conformément au RGPD (Règlement UE 2016/679) et à la loi française Informatique et Libertés. Pour plus de détails, consultez notre Politique de Confidentialité. Vous pouvez exercer vos droits en contactant hi@bloomsline.com ou en contactant la CNIL (www.cnil.fr).'
        },
        {
          title: 'Limitation de responsabilité',
          content: 'Bloomsline ne remplace pas les conseils médicaux ou de santé mentale professionnels. Nous ne sommes pas responsables des décisions prises sur la base des informations fournies via notre plateforme.'
        },
        {
          title: 'Droit applicable et juridiction',
          content: 'Les présentes conditions sont régies par le droit français. Tout litige relatif à l\'utilisation de Bloomsline sera soumis à la compétence exclusive des tribunaux de Paris, France.'
        },
        {
          title: 'Modifications des conditions',
          content: 'Nous pouvons mettre à jour ces conditions de temps à autre. Nous vous informerons de tout changement significatif. L\'utilisation continue du service après les modifications constitue l\'acceptation des nouvelles conditions.'
        },
        {
          title: 'Contact',
          content: 'Pour toute question concernant ces conditions, veuillez nous contacter à hi@bloomsline.com.'
        }
      ]
    }
  }

  const t = content[locale as keyof typeof content] || content.en

  return (
    <EarlyAccessModalProvider>
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
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-teal-600" />
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
    </EarlyAccessModalProvider>
  )
}
