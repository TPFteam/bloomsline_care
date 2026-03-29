'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Shield } from 'lucide-react'
import { EarlyAccessModalProvider } from '@/lib/landing/early-access-modal-context'

export default function PrivacyPolicyPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: March 2026',
      intro: 'At Bloomsline, your privacy matters deeply to us. This policy explains how we collect, use, store, and protect your personal data in compliance with the General Data Protection Regulation (GDPR — EU Regulation 2016/679) and French data protection law (Loi Informatique et Libertés).',
      mvpNote: 'Bloomsline is currently in early development and testing. This privacy policy will be updated as we finalize our practices before public launch.',
      sections: [
        {
          title: 'Data Controller',
          content: 'The data controller is Bloomsline Care, based in Paris, France. Company registration is currently in progress. Contact: hi@bloomsline.com. For any question relating to the protection of your personal data, you may also contact the CNIL (Commission Nationale de l\'Informatique et des Libertés) at www.cnil.fr.'
        },
        {
          title: 'Legal Basis for Processing',
          content: 'We process your personal data on the following legal bases under Article 6 of the GDPR: (a) your consent (e.g., when you create an account); (b) the performance of a contract (e.g., providing the Bloomsline service); (c) our legitimate interests (e.g., improving services, ensuring security); (d) compliance with legal obligations.'
        },
        {
          title: 'Information We Collect',
          content: 'We collect information you provide directly, such as your name, email address, and any content you create within the platform. We also collect usage data (pages visited, features used) to improve our services. We do not collect sensitive health data without your explicit consent.'
        },
        {
          title: 'How We Use Your Information',
          content: 'We use your information to provide and improve our services, communicate with you, and ensure the security of your account. We never sell your personal data to third parties. We do not use your data for profiling or automated decision-making.'
        },
        {
          title: 'Google User Data',
          content: 'When you sign in with Google, we receive your name, email address, and profile picture from your Google account. This data is used solely to create and maintain your Bloomsline account. We do not share, transfer, or disclose your Google user data to any third parties. We do not use your Google user data for advertising purposes. Your Google data is stored securely and is subject to the same protections as all other user data described in this policy. You can revoke Bloomsline\'s access to your Google data at any time through your Google Account permissions at myaccount.google.com.'
        },
        {
          title: 'Cookies & Tracking',
          content: 'A cookie is a small text file stored on your device when you visit a website. Bloomsline uses the following types of cookies: (1) Essential cookies — required for authentication and security (session tokens). These cannot be disabled. (2) Analytics cookies — we use PostHog (self-hosted in the EU) to understand how users interact with the platform. These are anonymized and do not track you across other websites. We do not use advertising or third-party tracking cookies. You can manage or delete cookies at any time through your browser settings (Chrome: Settings > Privacy > Cookies; Firefox: Settings > Privacy; Safari: Preferences > Privacy). Deleting cookies may require you to log in again. For more information, visit www.cnil.fr/cookies.'
        },
        {
          title: 'Data Sharing & Disclosure',
          content: 'We do not sell, rent, or trade your personal information to third parties. We may share data only in the following limited circumstances: (1) with service providers who help us operate the platform (cloud hosting: Vercel, EU region; database: Supabase, EU region; email delivery: Postmark), under strict data protection agreements (DPA); (2) if required by law, regulation, or legal process; (3) to protect the rights, safety, or property of Bloomsline or our users. All third-party service providers are contractually obligated to handle your data securely and only for the purposes we specify.'
        },
        {
          title: 'Data Storage & Security',
          content: 'Your data is stored on servers located in the European Union. We use encryption in transit (TLS 1.3) and at rest (AES-256). We implement strict access controls, row-level security, and regular security audits.'
        },
        {
          title: 'Data Retention',
          content: 'We retain your personal data for as long as your account is active. If you delete your account, your data is permanently erased within 30 days. Backup copies are purged within 90 days. Anonymized analytics data may be retained indefinitely.'
        },
        {
          title: 'Your Rights (GDPR)',
          content: 'Under the GDPR and French data protection law, you have the right to: access your personal data; rectify inaccurate data; erase your data ("right to be forgotten"); restrict or object to processing; data portability (receive your data in a structured format); withdraw consent at any time; lodge a complaint with the CNIL (www.cnil.fr). To exercise any of these rights, contact us at hi@bloomsline.com. We will respond within 30 days.'
        },
        {
          title: 'International Transfers',
          content: 'Your data is stored and processed within the European Union. In the event data needs to be transferred outside the EU, we ensure appropriate safeguards are in place (Standard Contractual Clauses or adequacy decisions).'
        },
        {
          title: 'Contact Us',
          content: 'If you have questions about this privacy policy or your data, please contact us at hi@bloomsline.com. You may also contact the CNIL: Commission Nationale de l\'Informatique et des Libertés, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr.'
        }
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdated: 'Dernière mise à jour : Mars 2026',
      intro: 'Chez Bloomsline, votre vie privée nous tient à cœur. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi française Informatique et Libertés.',
      mvpNote: 'Bloomsline est actuellement en développement et en phase de test. Cette politique de confidentialité sera mise à jour avant le lancement public.',
      sections: [
        {
          title: 'Responsable du traitement',
          content: 'Le responsable du traitement est Bloomsline Care, basé à Paris, France. L\'immatriculation de la société est en cours. Contact : hi@bloomsline.com. Pour toute question relative à la protection de vos données personnelles, vous pouvez également contacter la CNIL (Commission Nationale de l\'Informatique et des Libertés) sur www.cnil.fr.'
        },
        {
          title: 'Base légale du traitement',
          content: 'Nous traitons vos données personnelles sur les bases légales suivantes conformément à l\'article 6 du RGPD : (a) votre consentement (ex. : création de compte) ; (b) l\'exécution d\'un contrat (ex. : fourniture du service Bloomsline) ; (c) nos intérêts légitimes (ex. : amélioration des services, sécurité) ; (d) le respect d\'obligations légales.'
        },
        {
          title: 'Informations que nous collectons',
          content: 'Nous collectons les informations que vous fournissez directement, telles que votre nom, adresse email et tout contenu que vous créez sur la plateforme. Nous collectons également des données d\'utilisation (pages visitées, fonctionnalités utilisées) pour améliorer nos services. Nous ne collectons pas de données de santé sensibles sans votre consentement explicite.'
        },
        {
          title: 'Comment nous utilisons vos informations',
          content: 'Nous utilisons vos informations pour fournir et améliorer nos services, communiquer avec vous et assurer la sécurité de votre compte. Nous ne vendons jamais vos données personnelles à des tiers. Nous n\'utilisons pas vos données à des fins de profilage ou de prise de décision automatisée.'
        },
        {
          title: 'Données utilisateur Google',
          content: 'Lorsque vous vous connectez avec Google, nous recevons votre nom, votre adresse e-mail et votre photo de profil depuis votre compte Google. Ces données sont utilisées uniquement pour créer et maintenir votre compte Bloomsline. Nous ne partageons, ne transférons ni ne divulguons vos données utilisateur Google à des tiers. Nous n\'utilisons pas vos données Google à des fins publicitaires. Vos données Google sont stockées de manière sécurisée et bénéficient des mêmes protections que toutes les autres données utilisateur décrites dans cette politique. Vous pouvez révoquer l\'accès de Bloomsline à vos données Google à tout moment via les autorisations de votre compte Google sur myaccount.google.com.'
        },
        {
          title: 'Cookies et traceurs',
          content: 'Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d\'un site web. Bloomsline utilise les types de cookies suivants : (1) Cookies essentiels — nécessaires à l\'authentification et à la sécurité (jetons de session). Ils ne peuvent pas être désactivés. (2) Cookies analytiques — nous utilisons PostHog (auto-hébergé dans l\'UE) pour comprendre comment les utilisateurs interagissent avec la plateforme. Ces données sont anonymisées et ne vous suivent pas sur d\'autres sites. Nous n\'utilisons pas de cookies publicitaires ni de traceurs tiers. Vous pouvez gérer ou supprimer les cookies à tout moment via les paramètres de votre navigateur (Chrome : Paramètres > Confidentialité > Cookies ; Firefox : Paramètres > Vie privée ; Safari : Préférences > Confidentialité). La suppression des cookies peut nécessiter une nouvelle connexion. Pour plus d\'informations : www.cnil.fr/cookies.'
        },
        {
          title: 'Partage et divulgation des données',
          content: 'Nous ne vendons, ne louons ni n\'échangeons vos informations personnelles à des tiers. Nous pouvons partager des données uniquement dans les circonstances limitées suivantes : (1) avec des prestataires de services qui nous aident à exploiter la plateforme (hébergement : Vercel, région UE ; base de données : Supabase, région UE ; envoi d\'e-mails : Postmark), sous des accords stricts de protection des données (DPA) ; (2) si la loi, la réglementation ou une procédure judiciaire l\'exige ; (3) pour protéger les droits, la sécurité ou la propriété de Bloomsline ou de nos utilisateurs.'
        },
        {
          title: 'Stockage et sécurité des données',
          content: 'Vos données sont stockées sur des serveurs situés dans l\'Union européenne. Nous utilisons le chiffrement en transit (TLS 1.3) et au repos (AES-256). Nous mettons en place des contrôles d\'accès stricts, une sécurité au niveau des lignes (RLS) et des audits de sécurité réguliers.'
        },
        {
          title: 'Durée de conservation',
          content: 'Nous conservons vos données personnelles tant que votre compte est actif. Si vous supprimez votre compte, vos données sont définitivement effacées sous 30 jours. Les copies de sauvegarde sont purgées sous 90 jours. Les données analytiques anonymisées peuvent être conservées indéfiniment.'
        },
        {
          title: 'Vos droits (RGPD)',
          content: 'Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants : accéder à vos données personnelles ; rectifier les données inexactes ; effacer vos données (« droit à l\'oubli ») ; limiter ou vous opposer au traitement ; à la portabilité des données (recevoir vos données dans un format structuré) ; retirer votre consentement à tout moment ; introduire une réclamation auprès de la CNIL (www.cnil.fr). Pour exercer l\'un de ces droits, contactez-nous à hi@bloomsline.com. Nous répondrons sous 30 jours.'
        },
        {
          title: 'Transferts internationaux',
          content: 'Vos données sont stockées et traitées au sein de l\'Union européenne. En cas de transfert de données hors de l\'UE, nous veillons à ce que des garanties appropriées soient en place (Clauses Contractuelles Types ou décisions d\'adéquation).'
        },
        {
          title: 'Nous contacter',
          content: 'Si vous avez des questions sur cette politique de confidentialité ou vos données, veuillez nous contacter à hi@bloomsline.com. Vous pouvez également contacter la CNIL : Commission Nationale de l\'Informatique et des Libertés, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr.'
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
    </EarlyAccessModalProvider>
  )
}
