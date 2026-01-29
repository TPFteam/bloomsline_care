'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, FileText, Lock, Database, ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ConsentModalProps {
  isOpen: boolean
  onAccept: () => void
  locale: string
}

const content = {
  en: {
    heading: 'Before you begin...',
    subheading: 'Please review our policies.',
    mvpNotice: 'Bloomsline is currently in early development and testing. These policies will be updated as we finalize our practices before public launch.',
    checkboxLabel: 'I have read and agree to the above policies',
    continueButton: 'Continue',
    readFull: 'Read full policy',
    sections: [
      {
        key: 'privacy',
        title: 'Privacy Policy',
        icon: Shield,
        intro: 'At Bloomsline, your privacy matters deeply to us. This policy explains how we handle your information.',
        href: '/privacy',
      },
      {
        key: 'terms',
        title: 'Terms of Service',
        icon: FileText,
        intro: 'Welcome to Bloomsline. By using our service, you agree to these terms. Please read them carefully.',
        href: '/terms',
      },
      {
        key: 'security',
        title: 'Security',
        icon: Lock,
        intro: 'Your trust is our foundation. We take security seriously and implement robust measures to protect your data.',
        href: '/security',
      },
      {
        key: 'data-protection',
        title: 'Data Protection',
        icon: Database,
        intro: 'We believe you should have full control over your personal data. Here\'s how we protect it and what rights you have.',
        href: '/data-protection',
      },
    ],
  },
  fr: {
    heading: 'Avant de commencer...',
    subheading: 'Veuillez consulter nos politiques.',
    mvpNotice: 'Bloomsline est actuellement en développement et en phase de test. Ces politiques seront mises à jour avant le lancement public.',
    checkboxLabel: 'J\'ai lu et j\'accepte les politiques ci-dessus',
    continueButton: 'Continuer',
    readFull: 'Lire la politique complète',
    sections: [
      {
        key: 'privacy',
        title: 'Politique de Confidentialité',
        icon: Shield,
        intro: 'Chez Bloomsline, votre vie privée nous tient à cœur. Cette politique explique comment nous traitons vos informations.',
        href: '/privacy',
      },
      {
        key: 'terms',
        title: 'Conditions d\'Utilisation',
        icon: FileText,
        intro: 'Bienvenue sur Bloomsline. En utilisant notre service, vous acceptez ces conditions. Veuillez les lire attentivement.',
        href: '/terms',
      },
      {
        key: 'security',
        title: 'Sécurité',
        icon: Lock,
        intro: 'Votre confiance est notre fondement. Nous prenons la sécurité au sérieux et mettons en place des mesures robustes pour protéger vos données.',
        href: '/security',
      },
      {
        key: 'data-protection',
        title: 'Protection des Données',
        icon: Database,
        intro: 'Nous croyons que vous devez avoir le contrôle total de vos données personnelles. Voici comment nous les protégeons et quels sont vos droits.',
        href: '/data-protection',
      },
    ],
  },
}

export function ConsentModal({ isOpen, onAccept, locale }: ConsentModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)

  const t = content[locale as keyof typeof content] || content.en

  const toggleSection = (key: string) => {
    setOpenSection(openSection === key ? null : key)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Amber MVP banner */}
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 rounded-t-2xl">
              <p className="text-sm text-amber-800">{t.mvpNotice}</p>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {/* Header */}
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">
                {t.heading}
              </h2>
              <p className="text-neutral-500 mb-6">{t.subheading}</p>

              {/* Accordion sections */}
              <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                {t.sections.map((section) => {
                  const Icon = section.icon
                  const isExpanded = openSection === section.key

                  return (
                    <div key={section.key}>
                      <button
                        onClick={() => toggleSection(section.key)}
                        className="flex items-center w-full py-4 text-left gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4.5 h-4.5 text-neutral-600" />
                        </div>
                        <span className="flex-1 font-medium text-neutral-900 group-hover:text-teal-700 transition-colors">
                          {section.title}
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pb-4 pl-12 pr-2">
                              <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                                {section.intro}
                              </p>
                              <Link
                                href={section.href}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                              >
                                {t.readFull}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-sm text-neutral-700 leading-snug">
                  {t.checkboxLabel}
                </span>
              </label>

              {/* Continue button */}
              <button
                onClick={onAccept}
                disabled={!accepted}
                className="mt-6 w-full h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {t.continueButton}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
