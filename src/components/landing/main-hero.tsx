'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Plus, Search, Sun, Circle, Smile, Users, Target, BookOpen, Check, Sparkles, Share2, FileText, Camera, Heart } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useTab } from '@/lib/landing/tab-context'
import Link from 'next/link'

const rotatingWords = {
  personal: {
    en: ['Grow', 'Heal', 'Rest', 'Reflect'],
    fr: ['Grandissez', 'Guérissez', 'Reposez-vous', 'Réfléchissez'],
  },
  practitioner: {
    en: ['Create', 'Share', 'Track engagement'],
    fr: ['Créez', 'Partagez', 'Suivez les rythmes'],
  },
}

type PersonalSubTab = 'rituals' | 'moments' | 'balance'
type PractitionerSubTab = 'members' | 'journeys' | 'resources'

interface MainHeroProps {
  isPractitionerPage?: boolean
}

export function MainHero({ isPractitionerPage = false }: MainHeroProps) {
  const { locale } = useLanguage()
  const { activeTab, setActiveTab } = useTab()
  const [wordIndex, setWordIndex] = useState(0)
  const [personalSubTab, setPersonalSubTab] = useState<PersonalSubTab>('moments')
  const [practitionerSubTab, setPractitionerSubTab] = useState<PractitionerSubTab>('members')
  const [demoStep, setDemoStep] = useState(0)

  // Interactive mode state
  const [isInteractive, setIsInteractive] = useState(false)
  const [interactiveStep, setInteractiveStep] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [userNote, setUserNote] = useState('')

  // Practitioner interactive mode state
  const [practitionerInteractive, setPractitionerInteractive] = useState(false)
  const [practitionerStep, setPractitionerStep] = useState(0)
  const [practitionerExplanation, setPractitionerExplanation] = useState(false)

  // Members interactive state
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [sessionNote, setSessionNote] = useState('')

  // Rotate words - slower like Dia
  useEffect(() => {
    const wordsArray = isPractitionerPage ? rotatingWords.practitioner[locale] : rotatingWords.personal[locale]
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % wordsArray.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [locale, isPractitionerPage])

  // Auto-advance demo steps - slower for better storytelling (only when not interactive)
  useEffect(() => {
    if (isInteractive || practitionerInteractive) return
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [personalSubTab, practitionerSubTab, isInteractive, practitionerInteractive])

  // Reset demo step and interactive mode when tab changes
  useEffect(() => {
    setDemoStep(0)
    setWordIndex(0)
    setPractitionerInteractive(false)
    setPractitionerStep(0)
    setPractitionerExplanation(false)
  }, [personalSubTab, practitionerSubTab, activeTab])

  // Reset interactive mode
  const resetInteractive = () => {
    setIsInteractive(false)
    setInteractiveStep(0)
    setSelectedImage(null)
    setSelectedFeelings([])
    setUserNote('')
  }

  // Toggle feeling selection
  const toggleFeeling = (feeling: string) => {
    setSelectedFeelings(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    )
  }

  // Show explanation
  const [showExplanation, setShowExplanation] = useState(false)

  // Rituals interactive state
  const [selectedRitual, setSelectedRitual] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Reset rituals interactive
  const resetRitualsInteractive = () => {
    setIsInteractive(false)
    setInteractiveStep(0)
    setSelectedRitual(null)
    setSelectedTime(null)
  }

  // Balance interactive state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [balanceValues, setBalanceValues] = useState<Record<string, number>>({})

  // Reset balance interactive
  const resetBalanceInteractive = () => {
    setIsInteractive(false)
    setInteractiveStep(0)
    setSelectedCategories([])
    setBalanceValues({})
  }

  // Reset members interactive
  const resetMembersInteractive = () => {
    setPractitionerInteractive(false)
    setPractitionerStep(0)
    setSelectedClient(null)
    setClientName('')
    setSessionNote('')
  }

  // Early access form state
  const [earlyAccessName, setEarlyAccessName] = useState('')
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('')
  const [earlyAccessLoading, setEarlyAccessLoading] = useState(false)
  const [earlyAccessSuccess, setEarlyAccessSuccess] = useState(false)
  const [earlyAccessError, setEarlyAccessError] = useState('')

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!earlyAccessName.trim() || !earlyAccessEmail.trim()) {
      setEarlyAccessError(locale === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all fields')
      return
    }

    setEarlyAccessLoading(true)
    setEarlyAccessError('')

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: earlyAccessName,
          email: earlyAccessEmail,
          userType: 'practitioner',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'DUPLICATE') {
          setEarlyAccessError(locale === 'fr' ? 'Cet email est déjà inscrit' : 'This email is already registered')
        } else {
          setEarlyAccessError(data.error || (locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred'))
        }
        return
      }

      setEarlyAccessSuccess(true)
      setEarlyAccessName('')
      setEarlyAccessEmail('')
    } catch {
      setEarlyAccessError(locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred')
    } finally {
      setEarlyAccessLoading(false)
    }
  }

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : prev.length < 4 ? [...prev, category] : prev
    )
  }

  // Colors based on active tab
  const colors = {
    personal: {
      bg: 'from-[#f2f9f7] via-white to-[#f0f7f5]',
      orb1: 'bg-[#6BB3A0]/20',
      orb2: 'bg-[#4A9A86]/20',
      text: 'from-[#4A9A86] via-[#6BB3A0] to-[#3D8A76]',
    },
    practitioner: {
      bg: 'from-[#fdf8f5] via-white to-[#faf5f2]',
      orb1: 'bg-[#E8A87C]/20',
      orb2: 'bg-[#D4856A]/20',
      text: 'from-[#D4856A] via-[#E8A87C] to-[#C27459]',
    },
  }

  const currentColors = colors[activeTab]

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Soft gradient background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${currentColors.bg}`}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        key={activeTab + '-bg'}
      />

      {/* Subtle animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute top-1/4 -left-32 w-96 h-96 ${currentColors.orb1} rounded-full blur-3xl`}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute bottom-1/4 -right-32 w-96 h-96 ${currentColors.orb2} rounded-full blur-3xl`}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-24 md:pt-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline - only show on personal page */}
          {!isPractitionerPage && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-neutral-500 mb-6"
            >
              {locale === 'fr' ? 'Un soin qui vous rejoint là où vous êtes' : 'Care that meets you where you are'}
            </motion.p>
          )}

          {/* Main rotating headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-neutral-900 leading-[1.1]">
              {isPractitionerPage ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${wordIndex}-practitioner`}
                      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                      className="inline-block bg-gradient-to-r from-[#D4856A] to-[#E8A87C] bg-clip-text text-transparent"
                    >
                      {rotatingWords.practitioner[locale][wordIndex % rotatingWords.practitioner[locale].length]}
                    </motion.span>
                  </AnimatePresence>
                  <br />
                  <span className="text-neutral-900">
                    {locale === 'fr' ? 'sans effort' : 'effortlessly'}
                  </span>
                </>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${wordIndex}-${activeTab}`}
                      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                      className={`inline-block bg-gradient-to-r ${currentColors.text} bg-clip-text text-transparent`}
                    >
                      {rotatingWords.personal[locale][wordIndex % rotatingWords.personal[locale].length]}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-neutral-900">
                    {' '}{locale === 'fr' ? 'à votre rythme' : 'at your pace'}
                  </span>
                </>
              )}
            </h1>
          </motion.div>

          {/* Tab Toggle - hidden on practitioner page */}
          {!isPractitionerPage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center"
            >
              <div className="inline-flex items-center bg-neutral-100 rounded-full p-1">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    activeTab === 'personal'
                      ? 'bg-[#4A9A86] text-white shadow-md'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {locale === 'fr' ? 'Pour moi' : 'For me'}
                </button>
                <button
                  onClick={() => setActiveTab('practitioner')}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    activeTab === 'practitioner'
                      ? 'bg-[#D4856A] text-white shadow-md'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {locale === 'fr' ? "J'accompagne" : "I guide others"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Tab description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className={`text-neutral-500 mt-4 text-center max-w-xl mx-auto ${isPractitionerPage ? 'text-base sm:text-lg' : 'text-sm'}`}
          >
            <AnimatePresence mode="wait">
              {activeTab === 'personal' ? (
                <motion.span
                  key="personal-desc"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {locale === 'fr'
                    ? 'Un espace pour les moments où tout devient flou'
                    : 'A space for when everything feels unclear'}
                </motion.span>
              ) : (
                <motion.span
                  key="practitioner-desc"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {locale === 'fr'
                    ? <>Mesurez l'engagement de vos patients en temps réel.<br />Créez et partagez du contenu pour un suivi fiable entre les séances.</>
                    : <>Measure patient engagement in real-time.<br />Create and share content for reliable follow-up between sessions.</>}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.p>
        </div>

        {/* Mock Preview - Minimal Input Style like Dia - hidden on practitioner page */}
        {!isPractitionerPage && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full max-w-2xl mx-auto mt-10 px-0 sm:px-6"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'personal' ? (
              <motion.div
                key="personal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-neutral-200/30 p-2 sm:p-4 overflow-hidden"
              >
                {/* Prompt text + Pills row - hidden when interactive */}
                {!isInteractive && (
                  <div className="flex items-center gap-1 sm:gap-2 mb-3 flex-wrap">
                    <span className="text-neutral-700 text-sm">
                      {locale === 'fr' ? 'Quel' : 'What'}
                    </span>

                    {/* Pill tabs inline - rituals and balance hidden for now */}
                    {[
                      { id: 'moments' as PersonalSubTab, label: locale === 'fr' ? 'moment' : 'moment', Icon: Sun },
                      // { id: 'rituals' as PersonalSubTab, label: locale === 'fr' ? 'rituel' : 'ritual', Icon: Circle },
                      // { id: 'balance' as PersonalSubTab, label: locale === 'fr' ? 'équilibre' : 'balance', Icon: Smile },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setPersonalSubTab(tab.id)}
                        className={`inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap ${
                          personalSubTab === tab.id
                            ? 'bg-[#4A9A86]/15 text-[#4A9A86] font-medium'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'
                        }`}
                      >
                        <tab.Icon className="w-3 h-3" />
                        {tab.label}
                      </button>
                    ))}

                    <span className="text-neutral-700 text-sm">
                      {locale === 'fr' ? "a compté aujourd'hui ?" : 'mattered today?'}
                    </span>
                  </div>
                )}

                {/* Feature Preview - Visual-forward minimal cards OR Interactive mode */}
                <div className="mb-3 min-h-[160px]">
                  <AnimatePresence mode="wait">
                    {/* Interactive Mode */}
                    {isInteractive && personalSubTab === 'moments' && (
                      <motion.div
                        key="interactive-mode"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <AnimatePresence mode="wait">
                          {/* Step 0: Choose an image */}
                          {interactiveStep === 0 && (
                            <motion.div key="int-step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <p className="text-sm text-neutral-600 flex items-center gap-1.5">
                                {locale === 'fr' ? 'Choisissez un' : 'Pick a'}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4A9A86]/15 text-[#4A9A86] text-sm font-medium rounded-full">
                                  <Sun className="w-3 h-3" />
                                  moment
                                </span>
                              </p>
                              <div className="flex gap-3">
                                {[
                                  { src: '/images/activity.jpg', label: locale === 'fr' ? 'Activité' : 'Activity' },
                                  { src: '/images/cat.jpg', label: locale === 'fr' ? 'Mon chat' : 'My cat' },
                                  { src: '/images/friends.jpg', label: locale === 'fr' ? 'Amis' : 'Friends' },
                                  { src: '/images/family.jpg', label: locale === 'fr' ? 'Famille' : 'Family' },
                                ].map((img) => (
                                  <button
                                    key={img.src}
                                    onClick={() => {
                                      setSelectedImage(img.src)
                                      setInteractiveStep(1)
                                    }}
                                    className={`group relative ${selectedImage === img.src ? 'ring-2 ring-[#4A9A86] ring-offset-2' : ''}`}
                                  >
                                    <img src={img.src} alt={img.label} className="w-16 h-16 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" />
                                    <span className="text-xs text-neutral-500 mt-1 block">{img.label}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Step 1: Select feelings + Add note (combined) */}
                          {interactiveStep === 1 && (
                            <motion.div key="int-step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className="flex gap-3 items-start">
                                {selectedImage && <img src={selectedImage} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />}
                                <div className="flex-1">
                                  <p className="text-sm text-neutral-600">{locale === 'fr' ? "Qu'est-ce qui a rendu ce moment spécial ?" : 'What made this moment special?'}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                  {[
                                    { icon: Smile, label: locale === 'fr' ? 'Soulagement' : 'Peaceful' },
                                    { icon: Heart, label: locale === 'fr' ? 'Joie' : 'Grateful' },
                                    { icon: Sparkles, label: locale === 'fr' ? 'Amour' : 'Inspired' },
                                    { icon: Sun, label: locale === 'fr' ? 'Bienveillance' : 'Energized' },
                                  ].map((f) => (
                                    <button
                                      key={f.label}
                                      onClick={() => toggleFeeling(f.label)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                                        selectedFeelings.includes(f.label)
                                          ? 'bg-[#4A9A86] text-white'
                                          : 'bg-neutral-100 text-neutral-600 hover:bg-[#4A9A86]/10'
                                      }`}
                                    >
                                      <f.icon className="w-3 h-3" /> {f.label}
                                    </button>
                                  ))}
                                  </div>

                                  {/* Note input appears when a feeling is selected */}
                                  {selectedFeelings.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-3 space-y-3"
                                    >
                                      <input
                                        type="text"
                                        placeholder={locale === 'fr' ? 'Ce que vous ressentez compte...' : 'What you feel matters...'}
                                        value={userNote}
                                        onChange={(e) => setUserNote(e.target.value)}
                                        className="w-full text-sm border-0 border-b border-neutral-200 pb-2 focus:outline-none focus:border-[#4A9A86] bg-transparent"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => setInteractiveStep(3)}
                                        className="text-xs text-[#4A9A86] font-medium"
                                      >
                                        {locale === 'fr' ? 'Voir mon parcours →' : 'See my journey →'}
                                      </button>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Step 3: Show flow created */}
                          {interactiveStep === 3 && (
                            <motion.div key="int-step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#4A9A86]" />
                                <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Ajouté à votre flow!' : 'Added to your flow!'}</p>
                              </div>

                              {/* Flow visualization */}
                              <div className="relative h-20">
                                <svg className="absolute inset-0 w-full h-full overflow-visible">
                                  <motion.path
                                    d="M 20 50 C 50 50, 60 30, 90 30 C 120 30, 140 45, 170 40 C 200 35, 230 15, 270 15"
                                    fill="none"
                                    stroke="#4A9A86"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                  />
                                </svg>
                                {/* Past moments (faded) */}
                                {[
                                  { left: 8, top: 35, opacity: 0.4 },
                                  { left: 78, top: 15, opacity: 0.6 },
                                  { left: 158, top: 25, opacity: 0.8 },
                                ].map((pos, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.2 }}
                                    style={{ left: pos.left, top: pos.top, opacity: pos.opacity }}
                                    className="absolute w-8 h-8 rounded-lg bg-neutral-200 border-2 border-white shadow-sm"
                                  />
                                ))}
                                {/* User's new moment (highlighted) */}
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.9, type: 'spring' }}
                                  style={{ left: 258, top: 0 }}
                                  className="absolute"
                                >
                                  {selectedImage && (
                                    <img
                                      src={selectedImage}
                                      alt=""
                                      className="w-10 h-10 rounded-lg object-cover border-2 border-[#4A9A86] shadow-md"
                                    />
                                  )}
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-[#4A9A86] rounded-full flex items-center justify-center"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-white" />
                                  </motion.div>
                                </motion.div>
                              </div>

                              {/* Personalized insight based on selected moment */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                className="bg-gradient-to-r from-[#4A9A86]/10 to-[#4A9A86]/5 rounded-xl p-3 border border-[#4A9A86]/20"
                              >
                                <div className="flex gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#4A9A86] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-neutral-700">
                                      {selectedImage?.includes('cat')
                                        ? (locale === 'fr'
                                          ? 'Les moments avec votre compagnon comptent. Bloom vous montrera comment ils illuminent vos journées.'
                                          : 'Moments with your furry friend matter. Bloom will show you how they brighten your days.')
                                        : selectedImage?.includes('coffee')
                                        ? (locale === 'fr'
                                          ? 'Ces petits rituels font la différence. Continuez et découvrez vos patterns de bien-être.'
                                          : 'These little rituals make a difference. Keep going and discover your wellness patterns.')
                                        : selectedImage?.includes('sunset')
                                        ? (locale === 'fr'
                                          ? 'Prendre le temps de contempler, ça compte. Bloom révélera ce qui vous ressource.'
                                          : 'Taking time to pause matters. Bloom will reveal what recharges you.')
                                        : (locale === 'fr'
                                          ? 'Ces moments en nature sont précieux. Continuez et Bloom vous montrera ce qui vous apaise.'
                                          : 'These nature moments are precious. Keep going and Bloom will show you what brings you calm.')
                                      }
                                    </p>
                                    <motion.p
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 2 }}
                                      className="text-xs text-[#4A9A86] font-medium mt-1.5"
                                    >
                                      {locale === 'fr' ? '3 moments de plus pour votre premier insight →' : '3 more moments to your first insight →'}
                                    </motion.p>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Start again button */}
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.2 }}
                                onClick={resetInteractive}
                                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                {locale === 'fr' ? '↺ Recommencer' : '↺ Start again'}
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Demo Mode */}
                    {!isInteractive && personalSubTab === 'moments' && (
                      <motion.div key="moments-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
                              {/* Morning walk - capture photo */}
                              <div className="flex gap-4">
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className="relative"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src="/images/morning-walk.jpg"
                                    alt="Morning walk"
                                    className="w-24 h-24 rounded-2xl shadow-lg object-cover"
                                  />
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: 'spring' }}
                                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                                  >
                                    <Camera className="w-3 h-3 text-[#4A9A86]" />
                                  </motion.div>
                                </motion.div>
                                <div className="flex-1 flex flex-col justify-center">
                                  <p className="text-sm text-neutral-800 font-medium">{locale === 'fr' ? 'Balade matinale' : 'Morning walk'}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? 'Maintenant' : 'Just now'}</p>
                                  <div className="flex gap-1.5 mt-2">
                                    <motion.span
                                      initial={{ width: 0 }}
                                      animate={{ width: 32 }}
                                      transition={{ delay: 0.5, duration: 0.3 }}
                                      className="h-1 rounded-full bg-[#4A9A86]"
                                    />
                                    <span className="w-8 h-1 rounded-full bg-neutral-200" />
                                  </div>
                                </div>
                              </div>
                              {/* Hint */}
                              <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                                <Plus className="w-3 h-3" />
                                {locale === 'fr' ? "Qu'est-ce qui a rendu ce moment spécial ?" : 'What made this moment special?'}
                              </p>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
                              {/* Photo with typing text */}
                              <div className="flex gap-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="/images/morning-walk.jpg"
                                  alt="Morning walk"
                                  className="w-14 h-14 rounded-xl shadow-md shrink-0 object-cover"
                                />
                                <div className="flex-1">
                                  <p className="text-sm text-neutral-800 font-medium">{locale === 'fr' ? 'Balade matinale' : 'Morning walk'}</p>
                                  {/* Typing animation */}
                                  <div className="mt-2 flex items-center gap-1">
                                    <motion.p
                                      initial={{ width: 0 }}
                                      animate={{ width: 'auto' }}
                                      transition={{ duration: 1.5, ease: 'easeOut' }}
                                      className="text-sm text-neutral-600 overflow-hidden whitespace-nowrap"
                                    >
                                      {locale === 'fr' ? 'Le calme avant la journée...' : 'The calm before the day...'}
                                    </motion.p>
                                    <motion.span
                                      animate={{ opacity: [1, 0, 1] }}
                                      transition={{ duration: 0.8, repeat: Infinity }}
                                      className="w-0.5 h-4 bg-[#4A9A86]"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Feeling suggestions appear */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.8 }}
                                className="flex gap-2"
                              >
                                {[
                                  { icon: Smile, label: locale === 'fr' ? 'Paisible' : 'Peaceful', selected: true },
                                  { icon: Heart, label: locale === 'fr' ? 'Reconnaissant' : 'Grateful', selected: false },
                                  { icon: Sparkles, label: locale === 'fr' ? 'Inspiré' : 'Inspired', selected: true },
                                ].map((f, i) => (
                                  <motion.span
                                    key={f.label}
                                    initial={{ opacity: 0, scale: 0.8, backgroundColor: 'rgb(245, 245, 245)' }}
                                    animate={{
                                      opacity: 1,
                                      scale: f.selected ? [1, 1.05, 1] : 1,
                                      backgroundColor: f.selected ? 'rgba(74, 154, 134, 0.1)' : 'rgb(245, 245, 245)'
                                    }}
                                    transition={{
                                      delay: 2 + i * 0.1,
                                      backgroundColor: { delay: f.selected ? 2.5 + i * 0.15 : 0 },
                                      scale: { delay: f.selected ? 2.5 + i * 0.15 : 0, duration: 0.2 }
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                                      f.selected ? 'text-[#4A9A86]' : 'text-neutral-600'
                                    }`}
                                  >
                                    <f.icon className="w-3 h-3" /> {f.label}
                                  </motion.span>
                                ))}
                              </motion.div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-2">
                              {/* Flow visualization - natural curve ending high */}
                              <div className="relative h-32 overflow-visible">
                                {/* Connecting line - passes through node centers */}
                                <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ width: '100%', height: '100%' }}>
                                  <motion.path
                                    d="M 28 85 C 60 85, 70 50, 100 50 C 130 50, 150 70, 180 65 C 210 60, 240 25, 280 25"
                                    fill="none"
                                    stroke="#4A9A86"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                  />
                                </svg>
                                {/* Moment nodes - centered on the line */}
                                {[
                                  { left: 8, top: 65, color: 'bg-[#4A9A86]/80', icon: Sun, delay: 0.3 },
                                  { left: 80, top: 30, color: 'bg-[#a78bfa]', icon: Heart, delay: 0.6 },
                                  { left: 160, top: 45, color: 'bg-[#4A9A86]', icon: Sparkles, delay: 0.9 },
                                  { left: 260, top: 5, color: 'bg-[#4A9A86]', icon: Sun, delay: 1.2 },
                                ].map((node, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: node.delay, type: 'spring', stiffness: 400, damping: 15 }}
                                    style={{ left: node.left, top: node.top }}
                                    className={`absolute w-10 h-10 ${node.color} rounded-full flex items-center justify-center shadow-lg border-[3px] border-white`}
                                  >
                                    <node.icon className="w-4 h-4 text-white" />
                                  </motion.div>
                                ))}
                              </div>
                              {/* Label */}
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                                className="text-xs text-neutral-500 text-right pr-2"
                              >
                                {locale === 'fr' ? 'Votre flow cette semaine' : 'Your flow this week'}
                              </motion.p>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
                              {/* Bloom discovers a pattern */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2"
                              >
                                <div className="w-6 h-6 rounded-full bg-[#4A9A86] flex items-center justify-center">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Bloom a remarqué quelque chose...' : 'Bloom noticed something...'}</p>
                              </motion.div>

                              {/* The insight card */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white rounded-xl p-3 shadow-sm border border-[#4A9A86]/10"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Mini moments */}
                                  <div className="flex -space-x-1">
                                    {['/images/morning-walk.jpg', '/images/coffee.jpg'].map((src, i) => (
                                      <img key={i} src={src} alt="" className="w-8 h-8 rounded-lg border-2 border-white object-cover" />
                                    ))}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-800 font-medium">{locale === 'fr' ? 'Vos matins = meilleure journée' : 'Your mornings = better days'}</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">{locale === 'fr' ? 'Les jours avec balades matinales, vous êtes' : 'On days with morning walks, you feel'}</p>
                                  </div>
                                </div>
                                {/* The value - clear metric */}
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ delay: 1, duration: 0.8 }}
                                  className="mt-3 flex items-center gap-2"
                                >
                                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: '73%' }}
                                      transition={{ delay: 1.2, duration: 0.6 }}
                                      className="h-full bg-[#4A9A86] rounded-full"
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-[#4A9A86]">73%</span>
                                  <span className="text-xs text-neutral-500">{locale === 'fr' ? 'plus calme' : 'calmer'}</span>
                                </motion.div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Rituals Interactive Mode */}
                    {isInteractive && personalSubTab === 'rituals' && (
                      <motion.div
                        key="rituals-interactive"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <AnimatePresence mode="wait">
                          {/* Step 0: Pick a ritual - gentle, tiny rituals */}
                          {interactiveStep === 0 && (
                            <motion.div key="rit-step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Un petit geste pour vous' : 'A tiny act for you'}</p>
                              <div className="space-y-2">
                                {[
                                  { id: 'window', icon: Sun, label: locale === 'fr' ? 'Moment fenêtre' : 'Window moment', desc: locale === 'fr' ? '2 min à regarder le monde' : '2 min gazing at the world' },
                                  { id: 'sip', icon: Circle, label: locale === 'fr' ? 'Première gorgée' : 'First sip', desc: locale === 'fr' ? 'Savourer votre boisson' : 'Savor your drink' },
                                  { id: 'breath', icon: Heart, label: locale === 'fr' ? 'Souffle lever' : 'Sunrise breath', desc: locale === 'fr' ? '3 respirations profondes' : '3 deep breaths' },
                                  { id: 'intention', icon: Sparkles, label: locale === 'fr' ? 'Graine d\'intention' : 'Intention seed', desc: locale === 'fr' ? 'Une pensée pour la journée' : 'One thought for the day' },
                                ].map((ritual) => (
                                  <button
                                    key={ritual.id}
                                    onClick={() => {
                                      setSelectedRitual(ritual.id)
                                      setInteractiveStep(1)
                                    }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 hover:bg-[#4A9A86]/10 transition-colors text-left w-full"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[#4A9A86]/10 flex items-center justify-center shrink-0">
                                      <ritual.icon className="w-4 h-4 text-[#4A9A86]" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-neutral-700">{ritual.label}</p>
                                      <p className="text-xs text-neutral-400">{ritual.desc}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Step 1: When - gentle, flexible */}
                          {interactiveStep === 1 && (
                            <motion.div key="rit-step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Quand vous sentez-vous prêt?' : 'When feels right?'}</p>
                              <div className="flex gap-2">
                                {[
                                  { id: 'wakeup', label: locale === 'fr' ? 'Au réveil' : 'Waking up', emoji: '🌅' },
                                  { id: 'midday', label: locale === 'fr' ? 'Pause midi' : 'Midday pause', emoji: '☀️' },
                                  { id: 'evening', label: locale === 'fr' ? 'Fin de journée' : 'Winding down', emoji: '🌙' },
                                ].map((time) => (
                                  <button
                                    key={time.id}
                                    onClick={() => {
                                      setSelectedTime(time.id)
                                      setInteractiveStep(2)
                                    }}
                                    className="flex-1 p-3 rounded-xl bg-neutral-50 hover:bg-[#4A9A86]/10 transition-colors text-center"
                                  >
                                    <p className="text-lg mb-1">{time.emoji}</p>
                                    <p className="text-xs text-neutral-600">{time.label}</p>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Step 2: Show added - gentle confirmation */}
                          {interactiveStep === 2 && (
                            <motion.div key="rit-step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#4A9A86]" />
                                <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Votre petit geste est prêt' : 'Your tiny act is ready'}</p>
                              </div>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-[#4A9A86]/5 border border-[#4A9A86]/10"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#4A9A86]/10 flex items-center justify-center">
                                    {selectedRitual === 'window' ? <Sun className="w-5 h-5 text-[#4A9A86]" />
                                      : selectedRitual === 'sip' ? <Circle className="w-5 h-5 text-[#4A9A86]" />
                                      : selectedRitual === 'breath' ? <Heart className="w-5 h-5 text-[#4A9A86]" />
                                      : <Sparkles className="w-5 h-5 text-[#4A9A86]" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-700 font-medium">
                                      {selectedRitual === 'window' ? (locale === 'fr' ? 'Moment fenêtre' : 'Window moment')
                                        : selectedRitual === 'sip' ? (locale === 'fr' ? 'Première gorgée' : 'First sip')
                                        : selectedRitual === 'breath' ? (locale === 'fr' ? 'Souffle lever' : 'Sunrise breath')
                                        : (locale === 'fr' ? 'Graine d\'intention' : 'Intention seed')}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      {selectedTime === 'wakeup' ? (locale === 'fr' ? '🌅 Au réveil' : '🌅 Waking up')
                                        : selectedTime === 'midday' ? (locale === 'fr' ? '☀️ Pause midi' : '☀️ Midday pause')
                                        : (locale === 'fr' ? '🌙 Fin de journée' : '🌙 Winding down')}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                              <p className="text-xs text-neutral-400 text-center">
                                {locale === 'fr' ? 'Pas de pression. Juste une invitation.' : 'No pressure. Just an invitation.'}
                              </p>
                              <button
                                onClick={() => setInteractiveStep(3)}
                                className="text-xs text-[#4A9A86] font-medium"
                              >
                                {locale === 'fr' ? 'Voir la magie →' : 'See the magic →'}
                              </button>
                            </motion.div>
                          )}

                          {/* Step 3: Gentle progress + poetic insight */}
                          {interactiveStep === 3 && (
                            <motion.div key="rit-step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              {/* Soft progress - not gamified, just gentle tracking */}
                              <div className="flex items-center gap-3">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                    <motion.div
                                      key={day}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: day === 1 ? 1 : 0.3 }}
                                      transition={{ delay: day * 0.06 }}
                                      className={`w-6 h-1.5 rounded-full ${
                                        day === 1 ? 'bg-[#4A9A86]' : 'bg-neutral-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-neutral-500">{locale === 'fr' ? 'Jour 1' : 'Day 1'}</span>
                              </div>

                              {/* Personalized poetic insight based on ritual */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-r from-[#4A9A86]/10 to-transparent rounded-xl p-3"
                              >
                                <div className="flex gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#4A9A86] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-neutral-700">
                                      {selectedRitual === 'window'
                                        ? (locale === 'fr' ? '2 minutes à regarder le monde. Parfois c\'est tout ce qu\'il faut pour se recentrer.' : '2 minutes looking at the world. Sometimes that\'s all it takes to feel centered.')
                                        : selectedRitual === 'sip'
                                        ? (locale === 'fr' ? 'Cette première gorgée, savourée. Un petit rituel qui change la couleur de la journée.' : 'That first sip, savored. A tiny ritual that changes how the day feels.')
                                        : selectedRitual === 'breath'
                                        ? (locale === 'fr' ? '3 respirations. Votre corps connaît déjà le chemin vers le calme.' : '3 breaths. Your body already knows the way to calm.')
                                        : (locale === 'fr' ? 'Une pensée pour guider la journée. Pas un objectif, juste une intention douce.' : 'One thought to guide the day. Not a goal, just a gentle intention.')
                                      }
                                    </p>
                                    <motion.p
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 1.2 }}
                                      className="text-xs text-[#4A9A86] mt-2"
                                    >
                                      {locale === 'fr' ? 'Bloom remarquera ce qui fonctionne pour vous →' : 'Bloom will notice what works for you →'}
                                    </motion.p>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Start again */}
                              <button
                                onClick={resetRitualsInteractive}
                                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                {locale === 'fr' ? '↺ Recommencer' : '↺ Start again'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Rituals Demo Mode - Gentle, not habit-tracking */}
                    {!isInteractive && personalSubTab === 'rituals' && (
                      <motion.div key="rituals-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Pas des habitudes. Des petits gestes...' : 'Not habits. Tiny acts...'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <motion.div
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A9A86]/20 to-[#6BB3A0]/20 flex items-center justify-center"
                                >
                                  <Sun className="w-7 h-7 text-[#4A9A86]" />
                                </motion.div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-neutral-800">{locale === 'fr' ? 'Moment fenêtre' : 'Window moment'}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? '2 minutes à regarder le monde' : '2 minutes gazing at the world'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Des gestes simples qui vous ressemblent...' : 'Simple acts that feel like you...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { icon: Sun, name: locale === 'fr' ? 'Moment fenêtre' : 'Window moment', when: locale === 'fr' ? 'Au réveil' : 'Waking up' },
                                  { icon: Circle, name: locale === 'fr' ? 'Première gorgée' : 'First sip', when: locale === 'fr' ? 'Avec mon café' : 'With my coffee' },
                                  { icon: Heart, name: locale === 'fr' ? 'Souffle lever' : 'Sunrise breath', when: locale === 'fr' ? 'Quand j\'en ai besoin' : 'When I need it' },
                                ].map((ritual, i) => (
                                  <motion.div
                                    key={ritual.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.15, duration: 0.3 }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#4A9A86]/5"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[#4A9A86]/10 flex items-center justify-center shrink-0">
                                      <ritual.icon className="w-4 h-4 text-[#4A9A86]" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-sm text-neutral-700">{ritual.name}</span>
                                      <p className="text-[10px] text-neutral-400">{ritual.when}</p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Pas de pression. Juste des invitations...' : 'No pressure. Just invitations...'}</p>
                              </div>
                              <div className="space-y-3">
                                {/* Soft progress bars instead of gamified streaks */}
                                <div className="flex items-center gap-3">
                                  <div className="flex gap-0.5 flex-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                      <motion.div
                                        key={day}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: day <= 3 ? 1 : 0.3 }}
                                        transition={{ delay: day * 0.08 }}
                                        className={`flex-1 h-1.5 rounded-full ${
                                          day <= 3 ? 'bg-[#4A9A86]' : 'bg-neutral-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-neutral-500">{locale === 'fr' ? 'Cette semaine' : 'This week'}</span>
                                </div>
                                <p className="text-sm text-neutral-600 text-center">
                                  {locale === 'fr' ? '3 moments de calme trouvés' : '3 quiet moments found'}
                                </p>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Bloom remarque ce qui fonctionne...' : 'Bloom notices what works...'}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="bg-gradient-to-r from-[#4A9A86]/10 to-transparent rounded-xl p-3"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#4A9A86] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-700">
                                      {locale === 'fr'
                                        ? 'Vos matins avec un moment fenêtre? Vous êtes plus présent le reste de la journée.'
                                        : 'Mornings with a window moment? You feel more present the rest of the day.'}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Balance Interactive Mode - Simple bar-based design */}
                    {isInteractive && personalSubTab === 'balance' && (
                      <motion.div
                        key="balance-interactive"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <AnimatePresence mode="wait">
                          {/* Step 0: Quick daily check-in */}
                          {interactiveStep === 0 && (
                            <motion.div key="bal-step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Comment était votre journée?' : 'How was your day?'}</p>
                              <div className="space-y-3">
                                {[
                                  { id: 'work', label: locale === 'fr' ? 'Travail' : 'Work', color: 'bg-red-400', defaultVal: 80 },
                                  { id: 'rest', label: locale === 'fr' ? 'Repos' : 'Rest', color: 'bg-emerald-400', defaultVal: 30 },
                                  { id: 'social', label: locale === 'fr' ? 'Social' : 'Social', color: 'bg-purple-400', defaultVal: 40 },
                                ].map((item, i) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="space-y-1"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-neutral-600">{item.label}</span>
                                      {item.id === 'work' && <span className="text-[10px] text-red-400 font-medium">{locale === 'fr' ? 'Beaucoup' : 'A lot'}</span>}
                                      {item.id === 'rest' && <span className="text-[10px] text-amber-500 font-medium">{locale === 'fr' ? 'Peu' : 'Little'}</span>}
                                    </div>
                                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.defaultVal}%` }}
                                        transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                                        className={`h-full ${item.color} rounded-full`}
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                onClick={() => setInteractiveStep(1)}
                                className="text-xs text-[#4A9A86] font-medium"
                              >
                                {locale === 'fr' ? 'Voir ce que ça signifie →' : 'See what this means →'}
                              </motion.button>
                            </motion.div>
                          )}

                          {/* Step 1: Show imbalance insight */}
                          {interactiveStep === 1 && (
                            <motion.div key="bal-step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              {/* Visual imbalance indicator */}
                              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 rounded-full bg-red-400" />
                                  <span className="text-xs text-red-600 font-medium">{locale === 'fr' ? 'Déséquilibre détecté' : 'Imbalance detected'}</span>
                                </div>
                                <p className="text-sm text-red-700">
                                  {locale === 'fr' ? 'Beaucoup de travail, peu de repos' : 'Lots of work, little rest'}
                                </p>
                              </div>

                              {/* Week view - simple dots */}
                              <div className="space-y-1.5">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Cette semaine' : 'This week'}</p>
                                <div className="flex gap-1">
                                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                                    <div key={i} className="flex-1 text-center">
                                      <div className={`w-full h-6 rounded-md mb-1 ${i < 5 ? 'bg-red-200' : i === 5 ? 'bg-emerald-200' : 'bg-neutral-100'}`} />
                                      <span className="text-[10px] text-neutral-400">{day}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => setInteractiveStep(2)}
                                className="text-xs text-[#4A9A86] font-medium"
                              >
                                {locale === 'fr' ? 'Voir les conseils →' : 'See suggestions →'}
                              </button>
                            </motion.div>
                          )}

                          {/* Step 2: Bloom suggestion */}
                          {interactiveStep === 2 && (
                            <motion.div key="bal-step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#4A9A86]" />
                                <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Bloom comprend' : 'Bloom understands'}</p>
                              </div>

                              {/* Bloom insight */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-r from-[#4A9A86]/10 to-transparent rounded-xl p-3"
                              >
                                <div className="flex gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-[#4A9A86] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-neutral-700">
                                      {locale === 'fr'
                                        ? '5 jours de travail intense. Ce soir, peut-être un moment pour vous?'
                                        : '5 days of intense work. Tonight, maybe a moment for yourself?'}
                                    </p>
                                    <p className="text-xs text-[#4A9A86] mt-1.5">
                                      {locale === 'fr' ? 'Bloom apprend vos rythmes →' : 'Bloom learns your rhythms →'}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>

                              <button
                                onClick={resetBalanceInteractive}
                                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                {locale === 'fr' ? '↺ Recommencer' : '↺ Start again'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Balance Demo Mode - Simple bars, no wheel */}
                    {!isInteractive && personalSubTab === 'balance' && (
                      <motion.div key="balance-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Où va votre énergie?' : 'Where does your energy go?'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { label: locale === 'fr' ? 'Travail' : 'Work', color: 'bg-red-400', value: 80 },
                                  { label: locale === 'fr' ? 'Repos' : 'Rest', color: 'bg-emerald-400', value: 25 },
                                  { label: locale === 'fr' ? 'Social' : 'Social', color: 'bg-purple-400', value: 45 },
                                ].map((item, i) => (
                                  <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="text-xs text-neutral-500 w-12">{item.label}</span>
                                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                        className={`h-full ${item.color} rounded-full`}
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Bloom remarque les patterns...' : 'Bloom notices patterns...'}</p>
                              </div>
                              {/* Imbalance alert */}
                              <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className="bg-red-50 rounded-xl p-3 border border-red-100"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-500 text-sm">!</span>
                                  </div>
                                  <div>
                                    <p className="text-xs text-red-600 font-medium">{locale === 'fr' ? 'Déséquilibre' : 'Imbalance'}</p>
                                    <p className="text-xs text-red-500">{locale === 'fr' ? 'Trop de travail cette semaine' : 'Too much work this week'}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Voyez la semaine...' : 'See your week...'}</p>
                              </div>
                              {/* Simple week view */}
                              <div className="flex gap-1">
                                {[
                                  { day: 'M', work: true },
                                  { day: 'T', work: true },
                                  { day: 'W', work: true },
                                  { day: 'T', work: true },
                                  { day: 'F', work: true },
                                  { day: 'S', work: false },
                                  { day: 'S', work: false },
                                ].map((d, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex-1 text-center"
                                  >
                                    <div className={`h-8 rounded-lg mb-1 ${d.work ? 'bg-red-200' : 'bg-emerald-200'}`} />
                                    <span className="text-[10px] text-neutral-400">{d.day}</span>
                                  </motion.div>
                                ))}
                              </div>
                              <p className="text-xs text-neutral-500 text-center">{locale === 'fr' ? '5 jours travail • 2 jours repos' : '5 work days • 2 rest days'}</p>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Bloom vous aide à équilibrer...' : 'Bloom helps you balance...'}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="bg-gradient-to-r from-[#4A9A86]/10 to-transparent rounded-xl p-3"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#4A9A86] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-neutral-700">
                                      {locale === 'fr'
                                        ? 'Semaine chargée. Un moment de repos ce soir vous ferait du bien.'
                                        : 'Busy week. A moment of rest tonight would do you good.'}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Explanation panel - changes based on selected tab */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                        {personalSubTab === 'rituals' ? (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "Ce ne sont pas des habitudes à cocher. Ce sont des petits gestes qui vous ressemblent — regarder par la fenêtre 2 minutes, savourer votre première gorgée, 3 respirations au réveil."
                                : "These aren't habits to check off. They're tiny acts that feel like you — gazing out the window for 2 minutes, savoring that first sip, 3 breaths when you wake."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Pas de streaks. Pas de pression. Juste de petites invitations, quand vous êtes prêt. Bloom remarque ce qui fonctionne, doucement."
                                : "No streaks. No pressure. Just gentle invitations, when you're ready. Bloom notices what works, quietly."
                              }
                            </p>
                          </>
                        ) : personalSubTab === 'balance' ? (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "Vous savez ce sentiment quand tout semble déséquilibré? Trop de travail, pas assez de repos. Trop de temps seul, pas assez de connexion."
                                : "You know that feeling when everything feels off-balance? Too much work, not enough rest. Too much alone time, not enough connection."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Balance vous montre où va votre énergie, jour après jour. Pas pour juger, mais pour vous aider à voir — et à ajuster, doucement."
                                : "Balance shows you where your energy goes, day by day. Not to judge, but to help you see — and gently adjust."
                              }
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "La vie n'est pas qu'une suite de grandes réussites. Ce sont les petits moments — un café calme, un sourire de votre chat, une balade au lever du soleil — qui façonnent vraiment qui vous êtes."
                                : "Life isn't just about big achievements. It's the small moments — a quiet coffee, your cat's purr, a sunrise walk — that truly shape who you are."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Moments vous aide à les capturer, à voir les patterns, et à comprendre ce qui vous fait vraiment du bien."
                                : "Moments helps you capture them, see the patterns, and understand what truly makes you feel good."
                              }
                            </p>
                          </>
                        )}
                        <button
                          onClick={() => setShowExplanation(false)}
                          className="text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          {locale === 'fr' ? '← Retour' : '← Back'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom bar - CTA */}
                {isInteractive && interactiveStep === 3 ? (
                  <div className="flex justify-end">
                    <Link
                      href="/early-access"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A9A86] text-white text-sm font-medium rounded-full hover:bg-[#3d8a76] transition-colors"
                    >
                      {locale === 'fr' ? 'Commencer gratuitement' : 'Start free'}
                      <ArrowUp className="w-4 h-4" />
                    </Link>
                  </div>
                ) : isInteractive ? (
                  <button
                    onClick={
                      personalSubTab === 'rituals' ? resetRitualsInteractive
                        : personalSubTab === 'balance' ? resetBalanceInteractive
                        : resetInteractive
                    }
                    className="flex items-center justify-between group w-full"
                  >
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors">
                      {locale === 'fr' ? '← Recommencer' : '← Start over'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        setIsInteractive(true)
                        setInteractiveStep(0)
                        setShowExplanation(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#4A9A86] text-white text-sm font-medium rounded-full hover:bg-[#3d8a76] transition-colors"
                    >
                      {locale === 'fr' ? 'À vous' : 'Your turn'}
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="practitioner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-neutral-200/30 p-2 sm:p-4 overflow-hidden"
              >
                {/* Prompt text + Pills row */}
                <div className="flex items-center gap-1 sm:gap-2 mb-3">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0 hidden sm:block" />
                  <AnimatePresence mode="wait">
                    {practitionerSubTab === 'members' && (
                      <motion.span key="members-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:inline text-neutral-700 text-sm">
                        {locale === 'fr' ? 'Voir mes' : 'View my'}
                      </motion.span>
                    )}
                    {practitionerSubTab === 'journeys' && (
                      <motion.span key="journeys-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:inline text-neutral-700 text-sm">
                        {locale === 'fr' ? 'Suivre les' : 'Track client'}
                      </motion.span>
                    )}
                    {practitionerSubTab === 'resources' && (
                      <motion.span key="resources-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:inline text-neutral-700 text-sm">
                        {locale === 'fr' ? 'Partager une' : 'Share a'}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Pill tabs inline */}
                  {[
                    { id: 'members' as PractitionerSubTab, label: locale === 'fr' ? 'clients' : 'members', Icon: Users },
                    { id: 'journeys' as PractitionerSubTab, label: locale === 'fr' ? 'parcours' : 'journeys', Icon: Target },
                    { id: 'resources' as PractitionerSubTab, label: locale === 'fr' ? 'ressource' : 'resource', Icon: BookOpen },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPractitionerSubTab(tab.id)}
                      className={`inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap ${
                        practitionerSubTab === tab.id
                          ? 'bg-[#D4856A]/15 text-[#D4856A] font-medium'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'
                      }`}
                    >
                      <tab.Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Feature Trailer - Step by step demo */}
                <div className="bg-neutral-50 rounded-xl p-4 mb-3 min-h-[140px]">
                  {/* Step indicators */}
                  <div className="flex items-center gap-1 mb-3">
                    {[0, 1, 2, 3].map((step) => {
                      const currentStep = practitionerInteractive ? practitionerStep : demoStep
                      return (
                        <button
                          key={step}
                          onClick={() => practitionerInteractive ? setPractitionerStep(step) : setDemoStep(step)}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            step === currentStep ? 'bg-[#D4856A]' : step < currentStep ? 'bg-[#D4856A]/40' : 'bg-neutral-200'
                          }`}
                        />
                      )
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Members Demo Mode */}
                    {!practitionerInteractive && practitionerSubTab === 'members' && (
                      <motion.div key="members-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Tous vos clients, organisés...' : 'All your clients, organized...'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                  {['SL', 'MD', 'JT'].map((initials, i) => (
                                    <motion.div
                                      key={initials}
                                      initial={{ scale: 0, x: -10 }}
                                      animate={{ scale: 1, x: 0 }}
                                      transition={{ delay: i * 0.12, duration: 0.3 }}
                                      className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] border-2 border-white flex items-center justify-center text-white text-xs font-medium shadow-sm"
                                    >
                                      {initials}
                                    </motion.div>
                                  ))}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-neutral-800">{locale === 'fr' ? 'Profils complets' : 'Complete profiles'}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? 'Notes, sessions, progrès - tout en un lieu' : 'Notes, sessions, progress - all in one place'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Gérez votre agenda facilement...' : 'Manage your schedule easily...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { name: 'Sarah L.', time: locale === 'fr' ? 'Aujourd\'hui 14h' : 'Today 2pm', status: 'upcoming' },
                                  { name: 'Marc D.', time: locale === 'fr' ? 'Hier' : 'Yesterday', status: 'done' },
                                ].map((session, i) => (
                                  <motion.div
                                    key={session.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.15, duration: 0.3 }}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg ${session.status === 'upcoming' ? 'bg-white shadow-sm border border-[#D4856A]/10' : 'bg-white/50'}`}
                                  >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-[9px] font-medium">
                                      {session.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-sm text-neutral-700 flex-1">{session.name}</span>
                                    <span className={`text-xs font-medium ${session.status === 'upcoming' ? 'text-[#D4856A]' : 'text-neutral-400'}`}>{session.time}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Documentez chaque session...' : 'Document each session...'}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white rounded-xl p-3 shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-[9px] font-medium shrink-0">SL</div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Session du 10 janvier' : 'January 10 session'}</p>
                                      <span className="text-[10px] text-[#D4856A] font-medium">{locale === 'fr' ? '50 min' : '50 min'}</span>
                                    </div>
                                    <p className="text-sm text-neutral-700">{locale === 'fr' ? 'Progrès notable sur la gestion de l\'anxiété. A pratiqué les exercices de respiration...' : 'Notable progress on anxiety management. Practiced breathing exercises...'}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Suivez votre pratique d\'un coup d\'œil...' : 'Track your practice at a glance...'}</p>
                              </div>
                              <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                                <div className="text-center flex-1">
                                  <motion.p
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring" }}
                                    className="text-2xl font-semibold text-[#D4856A]"
                                  >12</motion.p>
                                  <p className="text-[10px] text-neutral-500">{locale === 'fr' ? 'Clients actifs' : 'Active clients'}</p>
                                </div>
                                <div className="w-px h-10 bg-neutral-100" />
                                <div className="text-center flex-1">
                                  <motion.p
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="text-2xl font-semibold text-[#D4856A]"
                                  >8</motion.p>
                                  <p className="text-[10px] text-neutral-500">{locale === 'fr' ? 'Cette semaine' : 'This week'}</p>
                                </div>
                                <div className="w-px h-10 bg-neutral-100" />
                                <div className="text-center flex-1">
                                  <motion.p
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="text-2xl font-semibold text-green-500"
                                  >+15%</motion.p>
                                  <p className="text-[10px] text-neutral-500">{locale === 'fr' ? 'Engagement' : 'Engagement'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Members Interactive Mode */}
                    {practitionerInteractive && practitionerSubTab === 'members' && (
                      <motion.div key="members-interactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {practitionerStep === 0 && (
                            <motion.div key="int-step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Choisissez un client...' : 'Choose a client...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { id: 'sarah', name: 'Sarah L.', status: locale === 'fr' ? 'Session bientôt' : 'Session soon', initials: 'SL' },
                                  { id: 'marc', name: 'Marc D.', status: locale === 'fr' ? 'Stable' : 'Stable', initials: 'MD' },
                                  { id: 'julie', name: 'Julie T.', status: locale === 'fr' ? 'Nouveau' : 'New', initials: 'JT' },
                                ].map((client, i) => (
                                  <motion.button
                                    key={client.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => {
                                      setSelectedClient(client.id)
                                      setClientName(client.name)
                                      setPractitionerStep(1)
                                    }}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                      selectedClient === client.id
                                        ? 'bg-[#D4856A]/10 border border-[#D4856A]/30'
                                        : 'bg-white hover:bg-[#D4856A]/5 border border-transparent'
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-xs font-medium">
                                      {client.initials}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="text-sm font-medium text-neutral-700">{client.name}</p>
                                      <p className="text-xs text-neutral-400">{client.status}</p>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 1 && (
                            <motion.div key="int-step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? `Profil de ${clientName}` : `${clientName}'s profile`}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 shadow-sm space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-sm font-medium">
                                    {clientName.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-neutral-800">{clientName}</p>
                                    <p className="text-xs text-neutral-400">{locale === 'fr' ? '8 sessions' : '8 sessions'}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {[
                                    { label: locale === 'fr' ? 'Notes' : 'Notes', icon: FileText },
                                    { label: locale === 'fr' ? 'Agenda' : 'Schedule', icon: Target },
                                  ].map((action) => (
                                    <button
                                      key={action.label}
                                      onClick={() => setPractitionerStep(2)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-neutral-50 rounded-lg text-xs text-neutral-600 hover:bg-[#D4856A]/10 hover:text-[#D4856A] transition-all"
                                    >
                                      <action.icon className="w-3 h-3" />
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 2 && (
                            <motion.div key="int-step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Ajoutez une note de session...' : 'Add a session note...'}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
                                <textarea
                                  value={sessionNote}
                                  onChange={(e) => setSessionNote(e.target.value)}
                                  placeholder={locale === 'fr' ? 'Notes de la session...' : 'Session notes...'}
                                  className="w-full h-16 text-sm text-neutral-700 placeholder:text-neutral-300 bg-transparent resize-none focus:outline-none"
                                />
                                <button
                                  onClick={() => setPractitionerStep(3)}
                                  className="w-full py-2 bg-[#D4856A] text-white text-sm font-medium rounded-lg hover:bg-[#c27459] transition-colors"
                                >
                                  {locale === 'fr' ? 'Enregistrer' : 'Save note'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 3 && (
                            <motion.div key="int-step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                                className="w-12 h-12 mx-auto rounded-full bg-[#D4856A]/10 flex items-center justify-center"
                              >
                                <Check className="w-6 h-6 text-[#D4856A]" />
                              </motion.div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-neutral-800">
                                  {locale === 'fr' ? 'Note enregistrée!' : 'Note saved!'}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {locale === 'fr'
                                    ? `Profil de ${clientName} mis à jour`
                                    : `${clientName}'s profile updated`}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Journeys Demo Mode */}
                    {!practitionerInteractive && practitionerSubTab === 'journeys' && (
                      <motion.div key="journeys-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Définissez le chemin de guérison...' : 'Define the path to growth...'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <motion.div
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center shadow-lg shadow-[#D4856A]/20"
                                >
                                  <Target className="w-7 h-7 text-white" />
                                </motion.div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-neutral-800">{locale === 'fr' ? 'Parcours personnalisés' : 'Personalized journeys'}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? 'Des objectifs adaptés à chaque client' : 'Milestones tailored to each client'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Visualisez leur progression...' : 'Visualize their progress...'}</p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                  {[
                                    { label: locale === 'fr' ? 'Découverte' : 'Discovery', done: true },
                                    { label: locale === 'fr' ? 'Construction' : 'Building', done: true },
                                    { label: locale === 'fr' ? 'Épanouissement' : 'Thriving', done: false, current: true },
                                    { label: locale === 'fr' ? 'Autonomie' : 'Independent', done: false },
                                  ].map((stage, i) => (
                                    <motion.div
                                      key={stage.label}
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ delay: i * 0.12, duration: 0.3 }}
                                      className="flex-1 text-center"
                                    >
                                      <div className={`h-2.5 rounded-full mb-1.5 ${stage.done ? 'bg-gradient-to-r from-[#D4856A] to-[#E8A87C]' : stage.current ? 'bg-[#D4856A]/30' : 'bg-neutral-200'}`} />
                                      <p className={`text-[9px] ${stage.current ? 'text-[#D4856A] font-semibold' : stage.done ? 'text-neutral-600' : 'text-neutral-400'}`}>{stage.label}</p>
                                    </motion.div>
                                  ))}
                                </div>
                                <p className="text-xs text-center text-neutral-500">{locale === 'fr' ? 'Sarah est en phase d\'Épanouissement' : 'Sarah is in the Thriving phase'}</p>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Célébrez chaque étape...' : 'Celebrate each milestone...'}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white rounded-xl p-3 shadow-sm border border-[#D4856A]/10"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#D4856A]/10 flex items-center justify-center shrink-0">
                                    <Target className="w-4 h-4 text-[#D4856A]" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Gestion de l\'anxiété' : 'Anxiety management'}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{locale === 'fr' ? '"Excellente progression cette semaine! Continue comme ça."' : '"Excellent progress this week! Keep it up."'}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Gardez-les engagés dans leur parcours...' : 'Keep them engaged in their journey...'}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
                              >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-xs font-medium">SL</div>
                                <div className="flex-1">
                                  <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Sarah voit son parcours' : 'Sarah sees her journey'}</p>
                                  <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Partagé avec elle' : 'Shared with her'}</p>
                                </div>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3, type: "spring" }}
                                >
                                  <Check className="w-5 h-5 text-green-500" />
                                </motion.div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Journeys Interactive Mode */}
                    {practitionerInteractive && practitionerSubTab === 'journeys' && (
                      <motion.div key="journeys-interactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {practitionerStep === 0 && (
                            <motion.div key="int-step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Choisissez un client...' : 'Choose a client...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { id: 'sarah', name: 'Sarah L.', phase: locale === 'fr' ? 'Épanouissement' : 'Thriving', initials: 'SL' },
                                  { id: 'marc', name: 'Marc D.', phase: locale === 'fr' ? 'Construction' : 'Building', initials: 'MD' },
                                ].map((client, i) => (
                                  <motion.button
                                    key={client.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => {
                                      setSelectedClient(client.id)
                                      setClientName(client.name)
                                      setPractitionerStep(1)
                                    }}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white hover:bg-[#D4856A]/5 border border-transparent hover:border-[#D4856A]/20 transition-all"
                                  >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-xs font-medium">
                                      {client.initials}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="text-sm font-medium text-neutral-700">{client.name}</p>
                                      <p className="text-xs text-neutral-400">{client.phase}</p>
                                    </div>
                                    <Target className="w-4 h-4 text-neutral-300" />
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 1 && (
                            <motion.div key="int-step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? `Parcours de ${clientName}` : `${clientName}'s journey`}</p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                  {[
                                    { label: locale === 'fr' ? 'Découverte' : 'Discovery', done: true },
                                    { label: locale === 'fr' ? 'Construction' : 'Building', done: true },
                                    { label: locale === 'fr' ? 'Épanouissement' : 'Thriving', done: false, current: true },
                                    { label: locale === 'fr' ? 'Autonomie' : 'Independent', done: false },
                                  ].map((stage, i) => (
                                    <motion.div
                                      key={stage.label}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="flex-1 text-center"
                                    >
                                      <div className={`h-2 rounded-full mb-1 ${stage.done ? 'bg-gradient-to-r from-[#D4856A] to-[#E8A87C]' : stage.current ? 'bg-[#D4856A]/30' : 'bg-neutral-200'}`} />
                                      <p className={`text-[8px] ${stage.current ? 'text-[#D4856A] font-semibold' : stage.done ? 'text-neutral-600' : 'text-neutral-400'}`}>{stage.label}</p>
                                    </motion.div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => setPractitionerStep(2)}
                                  className="w-full py-2 mt-2 bg-[#D4856A]/10 text-[#D4856A] text-sm font-medium rounded-lg hover:bg-[#D4856A]/20 transition-colors"
                                >
                                  {locale === 'fr' ? 'Ajouter un jalon' : 'Add milestone'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 2 && (
                            <motion.div key="int-step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Créez un jalon...' : 'Create a milestone...'}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
                                <div className="space-y-1">
                                  {[
                                    { label: locale === 'fr' ? 'Gestion du stress' : 'Stress management' },
                                    { label: locale === 'fr' ? 'Communication' : 'Communication' },
                                    { label: locale === 'fr' ? 'Confiance en soi' : 'Self-confidence' },
                                  ].map((milestone, i) => (
                                    <button
                                      key={milestone.label}
                                      onClick={() => setPractitionerStep(3)}
                                      className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-[#D4856A]/10 hover:text-[#D4856A] rounded-lg transition-all"
                                    >
                                      {milestone.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 3 && (
                            <motion.div key="int-step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                                className="w-12 h-12 mx-auto rounded-full bg-[#D4856A]/10 flex items-center justify-center"
                              >
                                <Target className="w-6 h-6 text-[#D4856A]" />
                              </motion.div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-neutral-800">
                                  {locale === 'fr' ? 'Jalon ajouté!' : 'Milestone added!'}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {locale === 'fr'
                                    ? `Parcours de ${clientName} mis à jour`
                                    : `${clientName}'s journey updated`}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {!practitionerInteractive && practitionerSubTab === 'resources' && (
                      <motion.div key="resources-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Resources: Sharing valuable content */}
                        <AnimatePresence mode="wait">
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Tout votre contenu, organisé...' : 'All your content, organized...'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <motion.div
                                  animate={{ rotate: [0, -3, 3, 0] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center shadow-lg shadow-[#D4856A]/20"
                                >
                                  <BookOpen className="w-7 h-7 text-white" />
                                </motion.div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-neutral-800">{locale === 'fr' ? 'Votre bibliothèque' : 'Your library'}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? 'PDFs, exercices, articles - prêts à partager' : 'PDFs, exercises, articles - ready to share'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Trouvez la ressource parfaite...' : 'Find the perfect resource...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { name: locale === 'fr' ? 'Exercice de respiration' : 'Breathing exercise', selected: true, type: 'PDF' },
                                  { name: locale === 'fr' ? 'Journal de gratitude' : 'Gratitude journal', selected: false, type: 'Guide' },
                                ].map((resource, i) => (
                                  <motion.div
                                    key={resource.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.12, duration: 0.3 }}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg ${resource.selected ? 'bg-[#D4856A]/10 border border-[#D4856A]/20' : 'bg-white'}`}
                                  >
                                    <FileText className={`w-4 h-4 ${resource.selected ? 'text-[#D4856A]' : 'text-neutral-400'}`} />
                                    <span className={`text-sm flex-1 ${resource.selected ? 'text-[#D4856A] font-medium' : 'text-neutral-600'}`}>{resource.name}</span>
                                    <span className="text-[10px] text-neutral-400">{resource.type}</span>
                                    {resource.selected && <Check className="w-4 h-4 text-[#D4856A]" />}
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Partagez en un instant...' : 'Share in an instant...'}</p>
                              </div>
                              <div className="flex items-center justify-center gap-4 py-2">
                                <motion.div
                                  initial={{ x: 0 }}
                                  animate={{ x: 20 }}
                                  transition={{ duration: 0.8, ease: "easeInOut" }}
                                  className="w-12 h-12 rounded-lg bg-[#D4856A]/10 flex items-center justify-center"
                                >
                                  <FileText className="w-5 h-5 text-[#D4856A]" />
                                </motion.div>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.5, duration: 0.3 }}
                                  className="text-[#D4856A]"
                                >
                                  <Share2 className="w-5 h-5" />
                                </motion.div>
                                <motion.div
                                  initial={{ x: 0 }}
                                  animate={{ x: -20 }}
                                  transition={{ duration: 0.8, ease: "easeInOut" }}
                                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-sm font-medium"
                                >SL</motion.div>
                              </div>
                              <p className="text-xs text-center text-neutral-500">{locale === 'fr' ? 'Envoi à Sarah L.' : 'Sending to Sarah L.'}</p>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Votre client reçoit immédiatement...' : 'Your client receives instantly...'}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white rounded-xl p-3 shadow-sm border border-[#D4856A]/10"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4856A]/20 to-[#E8A87C]/20 flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-[#D4856A]" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Nouvelle ressource!' : 'New resource!'}</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">{locale === 'fr' ? 'Dr. Martin vous a partagé "Exercice de respiration"' : 'Dr. Martin shared "Breathing exercise" with you'}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Resources Interactive Mode */}
                    {practitionerInteractive && practitionerSubTab === 'resources' && (
                      <motion.div key="resources-interactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {practitionerStep === 0 && (
                            <motion.div key="int-step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Choisissez une ressource...' : 'Choose a resource...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { id: 'breathing', name: locale === 'fr' ? 'Exercice de respiration' : 'Breathing exercise', type: 'PDF' },
                                  { id: 'gratitude', name: locale === 'fr' ? 'Journal de gratitude' : 'Gratitude journal', type: 'Guide' },
                                  { id: 'anxiety', name: locale === 'fr' ? 'Gérer l\'anxiété' : 'Managing anxiety', type: 'Article' },
                                ].map((resource, i) => (
                                  <motion.button
                                    key={resource.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => {
                                      setSelectedClient(resource.id)
                                      setClientName(resource.name)
                                      setPractitionerStep(1)
                                    }}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white hover:bg-[#D4856A]/5 border border-transparent hover:border-[#D4856A]/20 transition-all"
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-[#D4856A]/10 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-[#D4856A]" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="text-sm font-medium text-neutral-700">{resource.name}</p>
                                      <p className="text-xs text-neutral-400">{resource.type}</p>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 1 && (
                            <motion.div key="int-step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Avec qui partager?' : 'Share with whom?'}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-[#D4856A]/5 rounded-lg">
                                  <FileText className="w-4 h-4 text-[#D4856A]" />
                                  <span className="text-sm text-[#D4856A] font-medium">{clientName}</span>
                                </div>
                                <div className="space-y-1 pt-2">
                                  {[
                                    { id: 'sarah', name: 'Sarah L.', initials: 'SL' },
                                    { id: 'marc', name: 'Marc D.', initials: 'MD' },
                                  ].map((client) => (
                                    <button
                                      key={client.id}
                                      onClick={() => {
                                        setSessionNote(client.name)
                                        setPractitionerStep(2)
                                      }}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#D4856A]/5 transition-all"
                                    >
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-[10px] font-medium">
                                        {client.initials}
                                      </div>
                                      <span className="text-sm text-neutral-600">{client.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 2 && (
                            <motion.div key="int-step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Ajoutez un message...' : 'Add a message...'}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span>{locale === 'fr' ? 'À:' : 'To:'}</span>
                                  <span className="font-medium text-neutral-700">{sessionNote}</span>
                                </div>
                                <textarea
                                  placeholder={locale === 'fr' ? 'Message optionnel...' : 'Optional message...'}
                                  className="w-full h-12 text-sm text-neutral-700 placeholder:text-neutral-300 bg-neutral-50 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#D4856A]/30"
                                />
                                <button
                                  onClick={() => setPractitionerStep(3)}
                                  className="w-full py-2 bg-[#D4856A] text-white text-sm font-medium rounded-lg hover:bg-[#c27459] transition-colors flex items-center justify-center gap-2"
                                >
                                  <Share2 className="w-4 h-4" />
                                  {locale === 'fr' ? 'Partager' : 'Share'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {practitionerStep === 3 && (
                            <motion.div key="int-step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                                className="w-12 h-12 mx-auto rounded-full bg-[#D4856A]/10 flex items-center justify-center"
                              >
                                <Check className="w-6 h-6 text-[#D4856A]" />
                              </motion.div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-neutral-800">
                                  {locale === 'fr' ? 'Ressource partagée!' : 'Resource shared!'}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {locale === 'fr'
                                    ? `${sessionNote} recevra une notification`
                                    : `${sessionNote} will receive a notification`}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Explanation panel for practitioner */}
                <AnimatePresence>
                  {practitionerExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                        {practitionerSubTab === 'members' ? (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "Vos clients ne sont pas des numéros. Ce sont des personnes avec des histoires, des progrès, des défis. Bloom vous aide à garder tout organisé — notes, sessions, jalons — pour que vous puissiez vous concentrer sur ce qui compte."
                                : "Your clients aren't numbers. They're people with stories, progress, challenges. Bloom helps you keep everything organized — notes, sessions, milestones — so you can focus on what matters."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Pas de logiciels compliqués. Juste un espace calme pour accompagner chaque parcours."
                                : "No complicated software. Just a calm space to support each journey."
                              }
                            </p>
                          </>
                        ) : practitionerSubTab === 'journeys' ? (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "La guérison n'est pas linéaire, mais elle a une direction. Les parcours vous aident à définir des jalons significatifs — pas des cases à cocher, mais de vraies étapes de croissance."
                                : "Healing isn't linear, but it has a direction. Journeys help you define meaningful milestones — not checkboxes, but real markers of growth."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Partagez-les avec vos clients pour qu'ils voient leur propre chemin. Parfois, voir le progrès est aussi puissant que le faire."
                                : "Share them with clients so they see their own path. Sometimes seeing progress is as powerful as making it."
                              }
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "Vous avez des ressources précieuses — exercices, articles, guides. Bloom vous permet de les organiser et de les partager au bon moment."
                                : "You have valuable resources — exercises, articles, guides. Bloom lets you organize them and share at the right moment."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Vos clients les reçoivent instantanément. Plus de fichiers perdus dans les emails."
                                : "Your clients receive them instantly. No more files lost in emails."
                              }
                            </p>
                          </>
                        )}
                        <button
                          onClick={() => setPractitionerExplanation(false)}
                          className="text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          {locale === 'fr' ? '← Retour' : '← Back'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom bar - CTA */}
                {practitionerInteractive && practitionerStep === 3 ? (
                  <Link
                    href="/early-access"
                    className="flex items-center justify-between group"
                  >
                    <span className="text-sm text-[#D4856A] font-medium group-hover:text-[#c27459] transition-colors">
                      {locale === 'fr' ? 'Commencer gratuitement' : 'Start free'}
                    </span>
                    <div className="w-8 h-8 bg-[#D4856A] rounded-full flex items-center justify-center group-hover:bg-[#c27459] transition-colors">
                      <ArrowUp className="w-4 h-4 text-white" />
                    </div>
                  </Link>
                ) : practitionerInteractive ? (
                  <button
                    onClick={resetMembersInteractive}
                    className="flex items-center justify-between group w-full"
                  >
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors">
                      {locale === 'fr' ? '← Recommencer' : '← Start over'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        setPractitionerInteractive(true)
                        setPractitionerStep(0)
                        setPractitionerExplanation(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D4856A] text-white text-sm font-medium rounded-full hover:bg-[#c27459] transition-colors"
                    >
                      {locale === 'fr' ? 'À vous' : 'Your turn'}
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        )}

        {/* Practitioner Early Access Form */}
        {isPractitionerPage && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-full max-w-3xl mx-auto mt-10 px-4 sm:px-6"
          >
            {earlyAccessSuccess ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-neutral-200/30 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-neutral-900 font-medium">
                  {locale === 'fr' ? 'Merci pour votre inscription !' : 'Thank you for signing up!'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  {locale === 'fr' ? 'Nous vous contacterons bientôt.' : 'We\'ll be in touch soon.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop: pill shape */}
                <div className="hidden sm:block bg-white/80 backdrop-blur-sm rounded-full shadow-lg shadow-neutral-200/30 p-2">
                  <form
                    className="flex items-center gap-2"
                    onSubmit={handleEarlyAccessSubmit}
                  >
                    <input
                      type="text"
                      value={earlyAccessName}
                      onChange={(e) => setEarlyAccessName(e.target.value)}
                      placeholder={locale === 'fr' ? 'Votre nom' : 'Your name'}
                      className="flex-1 px-4 py-3 bg-transparent border-none text-neutral-900 placeholder-neutral-400 focus:outline-none"
                      disabled={earlyAccessLoading}
                    />
                    <div className="w-px h-8 bg-neutral-200" />
                    <input
                      type="email"
                      value={earlyAccessEmail}
                      onChange={(e) => setEarlyAccessEmail(e.target.value)}
                      placeholder={locale === 'fr' ? 'Votre email' : 'Your email'}
                      className="flex-1 px-4 py-3 bg-transparent border-none text-neutral-900 placeholder-neutral-400 focus:outline-none"
                      disabled={earlyAccessLoading}
                    />
                    <button
                      type="submit"
                      disabled={earlyAccessLoading}
                      className="px-6 py-3 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-full shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300 whitespace-nowrap disabled:opacity-50"
                    >
                      {earlyAccessLoading
                        ? (locale === 'fr' ? 'Envoi...' : 'Sending...')
                        : (locale === 'fr' ? 'Accès anticipé' : 'Early Access')}
                    </button>
                  </form>
                </div>
                {/* Mobile: stacked */}
                <form
                  className="sm:hidden flex flex-col gap-3"
                  onSubmit={handleEarlyAccessSubmit}
                >
                  <input
                    type="text"
                    value={earlyAccessName}
                    onChange={(e) => setEarlyAccessName(e.target.value)}
                    placeholder={locale === 'fr' ? 'Votre nom' : 'Your name'}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30"
                    disabled={earlyAccessLoading}
                  />
                  <input
                    type="email"
                    value={earlyAccessEmail}
                    onChange={(e) => setEarlyAccessEmail(e.target.value)}
                    placeholder={locale === 'fr' ? 'Votre email' : 'Your email'}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30"
                    disabled={earlyAccessLoading}
                  />
                  <button
                    type="submit"
                    disabled={earlyAccessLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-full shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300 disabled:opacity-50"
                  >
                    {earlyAccessLoading
                      ? (locale === 'fr' ? 'Envoi...' : 'Sending...')
                      : (locale === 'fr' ? 'Accès anticipé' : 'Early Access')}
                  </button>
                </form>
                {earlyAccessError && (
                  <p className="text-red-500 text-sm text-center mt-2">{earlyAccessError}</p>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8"
        >
          <motion.div
            className="w-[1px] h-12 bg-gradient-to-b from-neutral-300 to-transparent"
            animate={{ scaleY: [1, 0.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  )
}
