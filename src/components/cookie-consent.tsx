'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'bloomsline-cookie-consent'

type ConsentStatus = 'accepted' | 'declined' | null

export function CookieConsent() {
  const { locale } = useLanguage()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay before showing for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleConsent = (status: ConsentStatus) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, status || '')
    setShowBanner(false)

    // Dispatch custom event for PostHog to listen
    window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: status }))
  }

  const content = locale === 'fr' ? {
    title: 'Plot twist : des cookies',
    description: 'On les utilise pour comprendre ce qui fonctionne (pas vous, promis). Juste des stats anonymes pour améliorer Bloomsline.',
    privacyPolicy: 'En savoir plus',
    accept: 'Ça me va',
    decline: 'Non merci',
  } : locale === 'es' ? {
    title: 'Plot twist: cookies',
    description: 'Las usamos para entender qué funciona (no para rastrearte, lo prometemos). Solo estadísticas anónimas para mejorar Bloomsline.',
    privacyPolicy: 'Más información',
    accept: 'Me apunto',
    decline: 'No, gracias',
  } : {
    title: 'Plot twist: cookies',
    description: 'We use them to understand what\'s working (not you, we promise). Just anonymous stats to make Bloomsline better.',
    privacyPolicy: 'Learn more',
    accept: 'I\'m in',
    decline: 'Pass',
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[300] p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icon & Text */}
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{content.title}</h3>
                  <p className="text-sm text-gray-600">
                    {content.description}{' '}
                    <Link href="/privacy" className="text-teal-600 hover:underline">
                      {content.privacyPolicy}
                    </Link>.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleConsent('declined')}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap"
                >
                  {content.decline}
                </button>
                <button
                  onClick={() => handleConsent('accepted')}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors whitespace-nowrap"
                >
                  {content.accept}
                </button>
              </div>

              {/* Close button (mobile) */}
              <button
                onClick={() => handleConsent('declined')}
                className="absolute top-4 right-4 sm:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
