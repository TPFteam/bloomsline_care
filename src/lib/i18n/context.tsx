'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import English translations
import enCommon from '@/lib/dictionaries/en/common.json'
import enHero from '@/lib/dictionaries/en/hero.json'
import enAuth from '@/lib/dictionaries/en/auth.json'
import enFeatures from '@/lib/dictionaries/en/features.json'
import enStakeholders from '@/lib/dictionaries/en/stakeholders.json'
import enTestimonials from '@/lib/dictionaries/en/testimonials.json'
import enFooter from '@/lib/dictionaries/en/footer.json'
import enDashboard from '@/lib/dictionaries/en/dashboard.json'

// Import French translations
import frCommon from '@/lib/dictionaries/fr/common.json'
import frHero from '@/lib/dictionaries/fr/hero.json'
import frAuth from '@/lib/dictionaries/fr/auth.json'
import frFeatures from '@/lib/dictionaries/fr/features.json'
import frStakeholders from '@/lib/dictionaries/fr/stakeholders.json'
import frTestimonials from '@/lib/dictionaries/fr/testimonials.json'
import frFooter from '@/lib/dictionaries/fr/footer.json'
import frDashboard from '@/lib/dictionaries/fr/dashboard.json'

type Locale = 'en' | 'fr'

// Merge all translation files
const enDict = {
  ...enCommon,
  hero: enHero,
  auth: enAuth,
  features: enFeatures,
  stakeholders: enStakeholders,
  testimonials: enTestimonials,
  footer: enFooter,
  dashboard: enDashboard,
}

const frDict = {
  ...frCommon,
  hero: frHero,
  auth: frAuth,
  features: frFeatures,
  stakeholders: frStakeholders,
  testimonials: frTestimonials,
  footer: frFooter,
  dashboard: frDashboard,
}

type Dictionary = typeof enDict

const dictionaries = {
  en: enDict,
  fr: frDict,
}

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale, syncToDatabase?: boolean) => void
  t: Dictionary
  isHydrated: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load locale from localStorage on mount
  useEffect(() => {
    setIsHydrated(true)
    const savedLocale = localStorage.getItem('locale') as Locale | null
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'fr')) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = async (newLocale: Locale, syncToDatabase: boolean = true) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }

    // Sync to database if requested (for authenticated users)
    if (syncToDatabase) {
      try {
        await fetch('/api/user/update-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLocale }),
        })
      } catch (error) {
        console.error('Failed to sync language preference to database:', error)
        // Continue even if sync fails - localStorage is the fallback
      }
    }
  }

  const value = {
    locale,
    setLocale,
    t: dictionaries[locale],
    isHydrated,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
