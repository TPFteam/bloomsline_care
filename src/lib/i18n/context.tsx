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
import enMembers from '@/lib/dictionaries/en/members.json'
import enLibrary from '@/lib/dictionaries/en/library.json'
import enProfile from '@/lib/dictionaries/en/profile.json'
import enPersonas from '@/lib/dictionaries/en/personas.json'

// Import Spanish translations
import esCommon from '@/lib/dictionaries/es/common.json'
import esHero from '@/lib/dictionaries/es/hero.json'
import esAuth from '@/lib/dictionaries/es/auth.json'
import esFeatures from '@/lib/dictionaries/es/features.json'
import esStakeholders from '@/lib/dictionaries/es/stakeholders.json'
import esTestimonials from '@/lib/dictionaries/es/testimonials.json'
import esFooter from '@/lib/dictionaries/es/footer.json'
import esDashboard from '@/lib/dictionaries/es/dashboard.json'
import esMembers from '@/lib/dictionaries/es/members.json'
import esLibrary from '@/lib/dictionaries/es/library.json'
import esProfile from '@/lib/dictionaries/es/profile.json'
import esPersonas from '@/lib/dictionaries/es/personas.json'

// Import French translations
import frCommon from '@/lib/dictionaries/fr/common.json'
import frHero from '@/lib/dictionaries/fr/hero.json'
import frAuth from '@/lib/dictionaries/fr/auth.json'
import frFeatures from '@/lib/dictionaries/fr/features.json'
import frStakeholders from '@/lib/dictionaries/fr/stakeholders.json'
import frTestimonials from '@/lib/dictionaries/fr/testimonials.json'
import frFooter from '@/lib/dictionaries/fr/footer.json'
import frDashboard from '@/lib/dictionaries/fr/dashboard.json'
import frMembers from '@/lib/dictionaries/fr/members.json'
import frLibrary from '@/lib/dictionaries/fr/library.json'
import frProfile from '@/lib/dictionaries/fr/profile.json'
import frPersonas from '@/lib/dictionaries/fr/personas.json'

export type Locale = 'en' | 'fr' | 'es'

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
  members: enMembers,
  library: enLibrary,
  profile: enProfile,
  personas: enPersonas,
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
  members: frMembers,
  library: frLibrary,
  profile: frProfile,
  personas: frPersonas,
}

const esDict = {
  ...esCommon,
  hero: esHero,
  auth: esAuth,
  features: esFeatures,
  stakeholders: esStakeholders,
  testimonials: esTestimonials,
  footer: esFooter,
  dashboard: esDashboard,
  members: esMembers,
  library: esLibrary,
  profile: esProfile,
  personas: esPersonas,
}

type Dictionary = typeof enDict

const dictionaries = {
  en: enDict,
  fr: frDict,
  es: esDict,
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
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'fr' || savedLocale === 'es')) {
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

/** Safely index a { en, fr, es? } translation object with fallback to English */
export function lt(text: Record<string, string>, locale: Locale): string {
  return text[locale] ?? text['en'] ?? ''
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
