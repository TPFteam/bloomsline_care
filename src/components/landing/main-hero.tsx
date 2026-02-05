'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Plus, Search, Sun, Circle, Smile, Users, Check, Sparkles, Camera, Heart, Share2, FileText } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useTab } from '@/lib/landing/tab-context'
import { useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'

const rotatingWords = {
  personal: {
    en: ['existing', 'moving', 'growing'],
    fr: ['existez', 'avancez', 'grandissez'],
  },
  practitioner: {
    en: ['Create', 'Share', 'Track engagement'],
    fr: ['Créez', 'Partagez', 'Suivez les rythmes'],
  },
}

const fixedHeadline = {
  personal: {
    en: "Quietly, you're",
    fr: 'Doucement, vous',
  },
  practitioner: {
    en: 'effortlessly',
    fr: 'sans effort',
  },
}

type PersonalSubTab = 'rituals' | 'moments' | 'balance'
type PractitionerSubTab = 'members'

// Demo scenarios - defined outside component to prevent recreation
const DEMO_SCENARIOS = [
  {
    id: 'morning',
    image: '/images/morning-walk.jpg',
    title: { en: 'Morning walk', fr: 'Balade matinale' },
    caption: { en: 'The calm before the day...', fr: 'Le calme avant la journée...' },
    moods: [
      { iconName: 'Smile' as const, label: { en: 'Peaceful', fr: 'Paisible' }, selected: true },
      { iconName: 'Heart' as const, label: { en: 'Grateful', fr: 'Reconnaissant' }, selected: false },
      { iconName: 'Sparkles' as const, label: { en: 'Inspired', fr: 'Inspiré' }, selected: true },
    ],
    insight: {
      title: { en: 'Your mornings = better days', fr: 'Vos matins = meilleure journée' },
      subtitle: { en: 'On days with morning walks, you feel', fr: 'Les jours avec balades matinales, vous êtes' },
      percent: 73,
      metric: { en: 'calmer', fr: 'plus calme' },
    },
    secondImage: '/images/coffee.jpg',
  },
  {
    id: 'coffee',
    image: '/images/coffee.jpg',
    title: { en: 'Morning coffee', fr: 'Café du matin' },
    caption: { en: 'A quiet ritual to start the day...', fr: 'Un rituel calme pour commencer...' },
    moods: [
      { iconName: 'Sun' as const, label: { en: 'Cozy', fr: 'Cosy' }, selected: true },
      { iconName: 'Smile' as const, label: { en: 'Content', fr: 'Content' }, selected: true },
      { iconName: 'Heart' as const, label: { en: 'Present', fr: 'Présent' }, selected: false },
    ],
    insight: {
      title: { en: 'Rituals ground you', fr: 'Les rituels vous ancrent' },
      subtitle: { en: 'Days with mindful mornings, you are', fr: 'Les jours avec matins conscients, vous êtes' },
      percent: 68,
      metric: { en: 'more focused', fr: 'plus concentré' },
    },
    secondImage: '/images/sunset.jpg',
  },
  {
    id: 'sunset',
    image: '/images/sunset.jpg',
    title: { en: 'Evening sunset', fr: 'Coucher de soleil' },
    caption: { en: 'Taking a moment to breathe...', fr: 'Prendre un moment pour respirer...' },
    moods: [
      { iconName: 'Heart' as const, label: { en: 'Grateful', fr: 'Reconnaissant' }, selected: true },
      { iconName: 'Sparkles' as const, label: { en: 'Reflective', fr: 'Réflexif' }, selected: true },
      { iconName: 'Smile' as const, label: { en: 'Calm', fr: 'Calme' }, selected: false },
    ],
    insight: {
      title: { en: 'Pauses restore you', fr: 'Les pauses vous ressourcent' },
      subtitle: { en: 'When you take evening breaks, you sleep', fr: 'Quand vous prenez des pauses le soir, vous dormez' },
      percent: 81,
      metric: { en: 'better', fr: 'mieux' },
    },
    secondImage: '/images/morning-walk.jpg',
  },
  {
    id: 'pet',
    image: '/images/cat.jpg',
    title: { en: 'Cuddle time', fr: 'Moment câlin' },
    caption: { en: 'My little companion...', fr: 'Mon petit compagnon...' },
    moods: [
      { iconName: 'Heart' as const, label: { en: 'Loved', fr: 'Aimé' }, selected: true },
      { iconName: 'Smile' as const, label: { en: 'Joyful', fr: 'Joyeux' }, selected: true },
      { iconName: 'Sparkles' as const, label: { en: 'Present', fr: 'Présent' }, selected: false },
    ],
    insight: {
      title: { en: 'Pets brighten your days', fr: 'Les animaux illuminent vos jours' },
      subtitle: { en: 'Moments with your companion make you', fr: 'Les moments avec votre compagnon vous rendent' },
      percent: 79,
      metric: { en: 'happier', fr: 'plus heureux' },
    },
    secondImage: '/images/coffee.jpg',
  },
]

interface MainHeroProps {
  isPractitionerPage?: boolean
}

export function MainHero({ isPractitionerPage = false }: MainHeroProps) {
  const { locale } = useLanguage()
  const { activeTab, setActiveTab } = useTab()
  const { openModal } = useEarlyAccessModal()

  // Handler for opening early access modal with appropriate pre-selection
  const handleOpenEarlyAccess = () => {
    openModal(isPractitionerPage ? 'practitioner' : undefined)
  }
  const [wordIndex, setWordIndex] = useState(0)
  const [personalSubTab, setPersonalSubTab] = useState<PersonalSubTab>('moments')
  const [practitionerSubTab, setPractitionerSubTab] = useState<PractitionerSubTab>('members')
  const [demoStep, setDemoStep] = useState(0)
  const [demoScenarioIndex, setDemoScenarioIndex] = useState(0)

  // Icon map for demo scenarios
  const iconMap = { Smile, Heart, Sparkles, Sun }

  // Randomize demo scenario on client-side mount using timestamp for true randomness
  useEffect(() => {
    const randomIndex = Math.floor((Date.now() % 10000) / 10000 * DEMO_SCENARIOS.length)
    // Add extra randomness
    const finalIndex = (randomIndex + Math.floor(Math.random() * DEMO_SCENARIOS.length)) % DEMO_SCENARIOS.length
    setDemoScenarioIndex(finalIndex)
  }, [])

  const currentDemo = DEMO_SCENARIOS[demoScenarioIndex]

  // Interactive mode state - start with interactive by default on global page
  const [isInteractive, setIsInteractive] = useState(true)
  const [interactiveStep, setInteractiveStep] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [userNote, setUserNote] = useState('')

  // Practitioner interactive mode state
  const [practitionerInteractive, setPractitionerInteractive] = useState(true)
  const [practitionerStep, setPractitionerStep] = useState(0)
  const [practitionerExplanation, setPractitionerExplanation] = useState(false)

  // Members interactive state
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [sessionNote, setSessionNote] = useState('')

  // Rotate words
  useEffect(() => {
    const wordsArray = isPractitionerPage ? rotatingWords.practitioner[locale] : rotatingWords.personal[locale]
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % wordsArray.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [locale, isPractitionerPage])

  // Auto-advance demo steps - slower for better storytelling (only when not interactive)
  useEffect(() => {
    // Check the appropriate interactive state based on which page we're on
    const isInInteractiveMode = isPractitionerPage ? practitionerInteractive : isInteractive
    if (isInInteractiveMode) return

    const maxSteps = isPractitionerPage ? 8 : 4 // Practitioner demo has 8 steps, personal has 4
    const interval = setInterval(() => {
      setDemoStep((prev) => {
        const nextStep = (prev + 1) % maxSteps
        // When cycle restarts (step goes back to 0), pick a new random scenario (personal demo only)
        if (nextStep === 0 && !isPractitionerPage) {
          setDemoScenarioIndex(Math.floor(Math.random() * DEMO_SCENARIOS.length))
        }
        return nextStep
      })
    }, 4000) // 4 seconds per step
    return () => clearInterval(interval)
  }, [personalSubTab, practitionerSubTab, isInteractive, practitionerInteractive, isPractitionerPage])

  // Reset demo step when tab changes (keep interactive mode as default)
  useEffect(() => {
    setDemoStep(0)
    setWordIndex(0)
    setPractitionerInteractive(true) // Keep interactive as default
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

  const currentColors = colors[isPractitionerPage ? 'practitioner' : 'personal']

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Soft gradient background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${currentColors.bg}`}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        key={(isPractitionerPage ? 'practitioner' : 'personal') + '-bg'}
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
          {/* Main rotating headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-neutral-900 leading-[1.1]">
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
                    {locale === 'fr' ? 'sans effort' : locale === 'es' ? 'sin esfuerzo' : 'effortlessly'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-neutral-900">
                    {fixedHeadline.personal[locale]}{' '}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${wordIndex}-personal`}
                      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                      className={`inline-block bg-gradient-to-r ${currentColors.text} bg-clip-text text-transparent`}
                    >
                      {rotatingWords.personal[locale][wordIndex % rotatingWords.personal[locale].length]}
                    </motion.span>
                  </AnimatePresence>
                </>
              )}
            </h1>
          </motion.div>

          {/* Page description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={`text-neutral-500 mt-4 text-center max-w-xl mx-auto ${isPractitionerPage ? 'text-base sm:text-lg' : 'text-sm'}`}
          >
            {isPractitionerPage ? (
              locale === 'fr'
                ? 'Accompagnez dans la durée, sans alourdir votre pratique.'
                : locale === 'es'
                ? 'Apoyo a largo plazo, sin sobrecargar tu práctica.'
                : 'Long-term support, without adding to your workload.'
            ) : (
              locale === 'fr'
                ? 'Un espace pour y voir plus clair quand tout devient flou.'
                : locale === 'es'
                ? 'Un espacio para ver con claridad cuando todo se vuelve borroso.'
                : 'A space to find clarity when everything feels unclear.'
            )}
          </motion.p>

        </div>

        {/* Mock Preview - Minimal Input Style like Dia */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full max-w-2xl mx-auto mt-10 px-0 sm:px-6"
        >
          {/* Context label */}
          <p className="text-center text-xs text-neutral-400 mb-3">
            {locale === 'fr' ? 'Découvrez comment ça marche' : locale === 'es' ? 'Descubre cómo funciona' : 'See how it works'}
          </p>
          <AnimatePresence mode="wait">
            {!isPractitionerPage ? (
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
                      {locale === 'fr' ? 'Quel' : locale === 'es' ? 'Qué' : 'What'}
                    </span>

                    {/* Pill tabs inline - rituals and balance hidden for now */}
                    {[
                      { id: 'moments' as PersonalSubTab, label: locale === 'fr' ? 'moment' : locale === 'es' ? 'momento' : 'moment', Icon: Sun },
                      // { id: 'rituals' as PersonalSubTab, label: locale === 'fr' ? 'rituel' : locale === 'es' ? 'ritual' : 'ritual', Icon: Circle },
                      // { id: 'balance' as PersonalSubTab, label: locale === 'fr' ? 'équilibre' : locale === 'es' ? 'equilibrio' : 'balance', Icon: Smile },
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
                      {locale === 'fr' ? "a compté aujourd'hui ?" : locale === 'es' ? 'importó hoy?' : 'mattered today?'}
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
                                {locale === 'fr' ? 'Choisissez un' : locale === 'es' ? 'Elige un' : 'Pick a'}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4A9A86]/15 text-[#4A9A86] text-sm font-medium rounded-full">
                                  <Sun className="w-3 h-3" />
                                  moment
                                </span>
                              </p>
                              <div className="flex gap-3">
                                {[
                                  { src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&h=200&fit=crop', label: locale === 'fr' ? 'Activité' : locale === 'es' ? 'Actividad' : 'Activity' },
                                  { src: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&h=200&fit=crop', label: locale === 'fr' ? 'Mon chat' : locale === 'es' ? 'Mi gato' : 'My cat' },
                                  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop', label: locale === 'fr' ? 'Amis' : locale === 'es' ? 'Amigos' : 'Friends' },
                                  { src: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=200&h=200&fit=crop', label: locale === 'fr' ? 'Famille' : locale === 'es' ? 'Familia' : 'Family' },
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
                                  <p className="text-sm text-neutral-600">{locale === 'fr' ? "Qu'est-ce qui a rendu ce moment spécial ?" : locale === 'es' ? '¿Qué hizo especial este momento?' : 'What made this moment special?'}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                  {[
                                    { icon: Smile, label: locale === 'fr' ? 'Soulagement' : locale === 'es' ? 'Tranquilo' : 'Peaceful' },
                                    { icon: Heart, label: locale === 'fr' ? 'Joie' : locale === 'es' ? 'Agradecido' : 'Grateful' },
                                    { icon: Sparkles, label: locale === 'fr' ? 'Amour' : locale === 'es' ? 'Inspirado' : 'Inspired' },
                                    { icon: Sun, label: locale === 'fr' ? 'Bienveillance' : locale === 'es' ? 'Energizado' : 'Energized' },
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
                                        placeholder={locale === 'fr' ? 'Ce que vous ressentez compte...' : locale === 'es' ? 'Lo que sientes importa...' : 'What you feel matters...'}
                                        value={userNote}
                                        onChange={(e) => setUserNote(e.target.value)}
                                        className="w-full text-sm border-0 border-b border-neutral-200 pb-2 focus:outline-none focus:border-[#4A9A86] bg-transparent"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => setInteractiveStep(3)}
                                        className="text-xs text-[#4A9A86] font-medium"
                                      >
                                        {locale === 'fr' ? 'Voir mon parcours →' : locale === 'es' ? 'Ver mi recorrido →' : 'See my journey →'}
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
                                <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Ajouté à votre flow!' : locale === 'es' ? '¡Añadido a tu flujo!' : 'Added to your flow!'}</p>
                              </div>

                              {/* Flow visualization */}
                              <div className="relative h-20 max-w-[300px] mx-auto">
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
                                          : locale === 'es'
                                          ? 'Los momentos con tu compañero importan. Bloom te mostrará cómo iluminan tus días.'
                                          : 'Moments with your furry friend matter. Bloom will show you how they brighten your days.')
                                        : selectedImage?.includes('coffee')
                                        ? (locale === 'fr'
                                          ? 'Ces petits rituels font la différence. Continuez et découvrez vos patterns de bien-être.'
                                          : locale === 'es'
                                          ? 'Estos pequeños rituales hacen la diferencia. Sigue adelante y descubre tus patrones de bienestar.'
                                          : 'These little rituals make a difference. Keep going and discover your wellness patterns.')
                                        : selectedImage?.includes('sunset')
                                        ? (locale === 'fr'
                                          ? 'Prendre le temps de contempler, ça compte. Bloom révélera ce qui vous ressource.'
                                          : locale === 'es'
                                          ? 'Tomarse tiempo para contemplar importa. Bloom revelará lo que te recarga.'
                                          : 'Taking time to pause matters. Bloom will reveal what recharges you.')
                                        : (locale === 'fr'
                                          ? 'Ces moments en nature sont précieux. Continuez et Bloom vous montrera ce qui vous apaise.'
                                          : locale === 'es'
                                          ? 'Estos momentos en la naturaleza son valiosos. Sigue adelante y Bloom te mostrará lo que te da calma.'
                                          : 'These nature moments are precious. Keep going and Bloom will show you what brings you calm.')
                                      }
                                    </p>
                                    <motion.p
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 2 }}
                                      className="text-xs text-[#4A9A86] font-medium mt-1.5"
                                    >
                                      {locale === 'fr' ? '3 moments de plus pour votre premier insight →' : locale === 'es' ? '3 momentos más para tu primer descubrimiento →' : '3 more moments to your first insight →'}
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
                                {locale === 'fr' ? '↺ Recommencer' : locale === 'es' ? '↺ Empezar de nuevo' : '↺ Start again'}
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
                              {/* Capture photo - using current demo scenario */}
                              <div className="flex gap-4">
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className="relative"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={currentDemo.image}
                                    alt={currentDemo.title.en}
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
                                  <p className="text-sm text-neutral-800 font-medium">{locale === 'fr' ? currentDemo.title.fr : locale === 'es' ? currentDemo.title.en : currentDemo.title.en}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? 'Maintenant' : locale === 'es' ? 'Ahora mismo' : 'Just now'}</p>
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
                                {locale === 'fr' ? "Qu'est-ce qui a rendu ce moment spécial ?" : locale === 'es' ? '¿Qué hizo especial este momento?' : 'What made this moment special?'}
                              </p>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
                              {/* Photo with typing text */}
                              <div className="flex gap-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={currentDemo.image}
                                  alt={currentDemo.title.en}
                                  className="w-14 h-14 rounded-xl shadow-md shrink-0 object-cover"
                                />
                                <div className="flex-1">
                                  <p className="text-sm text-neutral-800 font-medium">{locale === 'fr' ? currentDemo.title.fr : locale === 'es' ? currentDemo.title.en : currentDemo.title.en}</p>
                                  {/* Typing animation */}
                                  <div className="mt-2 flex items-center gap-1">
                                    <motion.p
                                      initial={{ width: 0 }}
                                      animate={{ width: 'auto' }}
                                      transition={{ duration: 1.5, ease: 'easeOut' }}
                                      className="text-sm text-neutral-600 overflow-hidden whitespace-nowrap"
                                    >
                                      {locale === 'fr' ? currentDemo.caption.fr : locale === 'es' ? currentDemo.caption.en : currentDemo.caption.en}
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
                                {currentDemo.moods.map((f, i) => {
                                  const Icon = iconMap[f.iconName]
                                  return (
                                    <motion.span
                                      key={f.label.en}
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
                                      <Icon className="w-3 h-3" /> {locale === 'fr' ? f.label.fr : locale === 'es' ? f.label.en : f.label.en}
                                    </motion.span>
                                  )
                                })}
                              </motion.div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="space-y-2">
                              {/* Flow visualization - natural curve ending high */}
                              <div className="flex justify-center">
                                <div className="relative h-32 w-[300px] overflow-visible">
                                  {/* Connecting line - passes through node centers */}
                                  <svg className="absolute inset-0 w-full h-full overflow-visible">
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
                              </div>
                              {/* Label */}
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                                className="text-xs text-neutral-500 text-center"
                              >
                                {locale === 'fr' ? 'Votre flow cette semaine' : locale === 'es' ? 'Tu flujo esta semana' : 'Your flow this week'}
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
                                <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Bloom a remarqué quelque chose...' : locale === 'es' ? 'Bloom notó algo...' : 'Bloom noticed something...'}</p>
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
                                    {[currentDemo.image, currentDemo.secondImage].map((src, i) => (
                                      <img key={i} src={src} alt="" className="w-8 h-8 rounded-lg border-2 border-white object-cover" />
                                    ))}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-neutral-800 font-medium">{locale === 'fr' ? currentDemo.insight.title.fr : locale === 'es' ? currentDemo.insight.title.en : currentDemo.insight.title.en}</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">{locale === 'fr' ? currentDemo.insight.subtitle.fr : locale === 'es' ? currentDemo.insight.subtitle.en : currentDemo.insight.subtitle.en}</p>
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
                                      animate={{ width: `${currentDemo.insight.percent}%` }}
                                      transition={{ delay: 1.2, duration: 0.6 }}
                                      className="h-full bg-[#4A9A86] rounded-full"
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-[#4A9A86]">{currentDemo.insight.percent}%</span>
                                  <span className="text-xs text-neutral-500">{locale === 'fr' ? currentDemo.insight.metric.fr : locale === 'es' ? currentDemo.insight.metric.en : currentDemo.insight.metric.en}</span>
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
                              <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Un petit geste pour vous' : locale === 'es' ? 'Un pequeño gesto para ti' : 'A tiny act for you'}</p>
                              <div className="space-y-2">
                                {[
                                  { id: 'window', icon: Sun, label: locale === 'fr' ? 'Moment fenêtre' : locale === 'es' ? 'Momento ventana' : 'Window moment', desc: locale === 'fr' ? '2 min à regarder le monde' : locale === 'es' ? '2 min mirando el mundo' : '2 min gazing at the world' },
                                  { id: 'sip', icon: Circle, label: locale === 'fr' ? 'Première gorgée' : locale === 'es' ? 'Primer sorbo' : 'First sip', desc: locale === 'fr' ? 'Savourer votre boisson' : locale === 'es' ? 'Saborear tu bebida' : 'Savor your drink' },
                                  { id: 'breath', icon: Heart, label: locale === 'fr' ? 'Souffle lever' : locale === 'es' ? 'Respiro amanecer' : 'Sunrise breath', desc: locale === 'fr' ? '3 respirations profondes' : locale === 'es' ? '3 respiraciones profundas' : '3 deep breaths' },
                                  { id: 'intention', icon: Sparkles, label: locale === 'fr' ? 'Graine d\'intention' : locale === 'es' ? 'Semilla de intención' : 'Intention seed', desc: locale === 'fr' ? 'Une pensée pour la journée' : locale === 'es' ? 'Un pensamiento para el día' : 'One thought for the day' },
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
                              <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Quand vous sentez-vous prêt?' : locale === 'es' ? '¿Cuándo te sientes listo?' : 'When feels right?'}</p>
                              <div className="flex gap-2">
                                {[
                                  { id: 'wakeup', label: locale === 'fr' ? 'Au réveil' : locale === 'es' ? 'Al despertar' : 'Waking up', emoji: '🌅' },
                                  { id: 'midday', label: locale === 'fr' ? 'Pause midi' : locale === 'es' ? 'Pausa del mediodía' : 'Midday pause', emoji: '☀️' },
                                  { id: 'evening', label: locale === 'fr' ? 'Fin de journée' : locale === 'es' ? 'Fin del día' : 'Winding down', emoji: '🌙' },
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
                                <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Votre petit geste est prêt' : locale === 'es' ? 'Tu pequeño gesto está listo' : 'Your tiny act is ready'}</p>
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
                                      {selectedRitual === 'window' ? (locale === 'fr' ? 'Moment fenêtre' : locale === 'es' ? 'Momento ventana' : 'Window moment')
                                        : selectedRitual === 'sip' ? (locale === 'fr' ? 'Première gorgée' : locale === 'es' ? 'Primer sorbo' : 'First sip')
                                        : selectedRitual === 'breath' ? (locale === 'fr' ? 'Souffle lever' : locale === 'es' ? 'Respiro amanecer' : 'Sunrise breath')
                                        : (locale === 'fr' ? 'Graine d\'intention' : locale === 'es' ? 'Semilla de intención' : 'Intention seed')}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      {selectedTime === 'wakeup' ? (locale === 'fr' ? '🌅 Au réveil' : locale === 'es' ? '🌅 Al despertar' : '🌅 Waking up')
                                        : selectedTime === 'midday' ? (locale === 'fr' ? '☀️ Pause midi' : locale === 'es' ? '☀️ Pausa del mediodía' : '☀️ Midday pause')
                                        : (locale === 'fr' ? '🌙 Fin de journée' : locale === 'es' ? '🌙 Fin del día' : '🌙 Winding down')}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                              <p className="text-xs text-neutral-400 text-center">
                                {locale === 'fr' ? 'Pas de pression. Juste une invitation.' : locale === 'es' ? 'Sin presión. Solo una invitación.' : 'No pressure. Just an invitation.'}
                              </p>
                              <button
                                onClick={() => setInteractiveStep(3)}
                                className="text-xs text-[#4A9A86] font-medium"
                              >
                                {locale === 'fr' ? 'Voir la magie →' : locale === 'es' ? 'Ver la magia →' : 'See the magic →'}
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
                                <span className="text-xs text-neutral-500">{locale === 'fr' ? 'Jour 1' : locale === 'es' ? 'Día 1' : 'Day 1'}</span>
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
                                        ? (locale === 'fr' ? '2 minutes à regarder le monde. Parfois c\'est tout ce qu\'il faut pour se recentrer.' : locale === 'es' ? '2 minutos mirando el mundo. A veces eso es todo lo que necesitas para centrarte.' : '2 minutes looking at the world. Sometimes that\'s all it takes to feel centered.')
                                        : selectedRitual === 'sip'
                                        ? (locale === 'fr' ? 'Cette première gorgée, savourée. Un petit rituel qui change la couleur de la journée.' : locale === 'es' ? 'Ese primer sorbo, saboreado. Un pequeño ritual que cambia cómo se siente el día.' : 'That first sip, savored. A tiny ritual that changes how the day feels.')
                                        : selectedRitual === 'breath'
                                        ? (locale === 'fr' ? '3 respirations. Votre corps connaît déjà le chemin vers le calme.' : locale === 'es' ? '3 respiraciones. Tu cuerpo ya conoce el camino hacia la calma.' : '3 breaths. Your body already knows the way to calm.')
                                        : (locale === 'fr' ? 'Une pensée pour guider la journée. Pas un objectif, juste une intention douce.' : locale === 'es' ? 'Un pensamiento para guiar el día. No es una meta, solo una intención suave.' : 'One thought to guide the day. Not a goal, just a gentle intention.')
                                      }
                                    </p>
                                    <motion.p
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 1.2 }}
                                      className="text-xs text-[#4A9A86] mt-2"
                                    >
                                      {locale === 'fr' ? 'Bloom remarquera ce qui fonctionne pour vous →' : locale === 'es' ? 'Bloom notará lo que funciona para ti →' : 'Bloom will notice what works for you →'}
                                    </motion.p>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Start again */}
                              <button
                                onClick={resetRitualsInteractive}
                                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                {locale === 'fr' ? '↺ Recommencer' : locale === 'es' ? '↺ Empezar de nuevo' : '↺ Start again'}
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
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Pas des habitudes. Des petits gestes...' : locale === 'es' ? 'No son hábitos. Son pequeños gestos...' : 'Not habits. Tiny acts...'}</p>
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
                                  <p className="text-sm font-medium text-neutral-800">{locale === 'fr' ? 'Moment fenêtre' : locale === 'es' ? 'Momento ventana' : 'Window moment'}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5">{locale === 'fr' ? '2 minutes à regarder le monde' : locale === 'es' ? '2 minutos mirando el mundo' : '2 minutes gazing at the world'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Des gestes simples qui vous ressemblent...' : locale === 'es' ? 'Gestos simples que se sienten como tú...' : 'Simple acts that feel like you...'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { icon: Sun, name: locale === 'fr' ? 'Moment fenêtre' : locale === 'es' ? 'Momento ventana' : 'Window moment', when: locale === 'fr' ? 'Au réveil' : locale === 'es' ? 'Al despertar' : 'Waking up' },
                                  { icon: Circle, name: locale === 'fr' ? 'Première gorgée' : locale === 'es' ? 'Primer sorbo' : 'First sip', when: locale === 'fr' ? 'Avec mon café' : locale === 'es' ? 'Con mi café' : 'With my coffee' },
                                  { icon: Heart, name: locale === 'fr' ? 'Souffle lever' : locale === 'es' ? 'Respiro amanecer' : 'Sunrise breath', when: locale === 'fr' ? 'Quand j\'en ai besoin' : locale === 'es' ? 'Cuando lo necesito' : 'When I need it' },
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
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Pas de pression. Juste des invitations...' : locale === 'es' ? 'Sin presión. Solo invitaciones...' : 'No pressure. Just invitations...'}</p>
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
                                  <span className="text-xs text-neutral-500">{locale === 'fr' ? 'Cette semaine' : locale === 'es' ? 'Esta semana' : 'This week'}</span>
                                </div>
                                <p className="text-sm text-neutral-600 text-center">
                                  {locale === 'fr' ? '3 moments de calme trouvés' : locale === 'es' ? '3 momentos de calma encontrados' : '3 quiet moments found'}
                                </p>
                              </div>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Bloom remarque ce qui fonctionne...' : locale === 'es' ? 'Bloom nota lo que funciona...' : 'Bloom notices what works...'}</p>
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
                                        : locale === 'es'
                                        ? 'Tus mañanas con un momento ventana? Te sientes más presente el resto del día.'
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
                              <p className="text-sm text-neutral-600">{locale === 'fr' ? 'Comment était votre journée?' : locale === 'es' ? '¿Cómo fue tu día?' : 'How was your day?'}</p>
                              <div className="space-y-3">
                                {[
                                  { id: 'work', label: locale === 'fr' ? 'Travail' : locale === 'es' ? 'Trabajo' : 'Work', color: 'bg-red-400', defaultVal: 80 },
                                  { id: 'rest', label: locale === 'fr' ? 'Repos' : locale === 'es' ? 'Descanso' : 'Rest', color: 'bg-emerald-400', defaultVal: 30 },
                                  { id: 'social', label: locale === 'fr' ? 'Social' : locale === 'es' ? 'Social' : 'Social', color: 'bg-purple-400', defaultVal: 40 },
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
                                      {item.id === 'work' && <span className="text-[10px] text-red-400 font-medium">{locale === 'fr' ? 'Beaucoup' : locale === 'es' ? 'Mucho' : 'A lot'}</span>}
                                      {item.id === 'rest' && <span className="text-[10px] text-amber-500 font-medium">{locale === 'fr' ? 'Peu' : locale === 'es' ? 'Poco' : 'Little'}</span>}
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
                                {locale === 'fr' ? 'Voir ce que ça signifie →' : locale === 'es' ? 'Ver qué significa esto →' : 'See what this means →'}
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
                                  <span className="text-xs text-red-600 font-medium">{locale === 'fr' ? 'Déséquilibre détecté' : locale === 'es' ? 'Desequilibrio detectado' : 'Imbalance detected'}</span>
                                </div>
                                <p className="text-sm text-red-700">
                                  {locale === 'fr' ? 'Beaucoup de travail, peu de repos' : locale === 'es' ? 'Mucho trabajo, poco descanso' : 'Lots of work, little rest'}
                                </p>
                              </div>

                              {/* Week view - simple dots */}
                              <div className="space-y-1.5">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Cette semaine' : locale === 'es' ? 'Esta semana' : 'This week'}</p>
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
                                {locale === 'fr' ? 'Voir les conseils →' : locale === 'es' ? 'Ver sugerencias →' : 'See suggestions →'}
                              </button>
                            </motion.div>
                          )}

                          {/* Step 2: Bloom suggestion */}
                          {interactiveStep === 2 && (
                            <motion.div key="bal-step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-[#4A9A86]" />
                                <p className="text-sm text-neutral-700 font-medium">{locale === 'fr' ? 'Bloom comprend' : locale === 'es' ? 'Bloom entiende' : 'Bloom understands'}</p>
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
                                        : locale === 'es'
                                        ? '5 días de trabajo intenso. Esta noche, ¿quizás un momento para ti?'
                                        : '5 days of intense work. Tonight, maybe a moment for yourself?'}
                                    </p>
                                    <p className="text-xs text-[#4A9A86] mt-1.5">
                                      {locale === 'fr' ? 'Bloom apprend vos rythmes →' : locale === 'es' ? 'Bloom aprende tus ritmos →' : 'Bloom learns your rhythms →'}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>

                              <button
                                onClick={resetBalanceInteractive}
                                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                {locale === 'fr' ? '↺ Recommencer' : locale === 'es' ? '↺ Empezar de nuevo' : '↺ Start again'}
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
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Où va votre énergie?' : locale === 'es' ? '¿A dónde va tu energía?' : 'Where does your energy go?'}</p>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { label: locale === 'fr' ? 'Travail' : locale === 'es' ? 'Trabajo' : 'Work', color: 'bg-red-400', value: 80 },
                                  { label: locale === 'fr' ? 'Repos' : locale === 'es' ? 'Descanso' : 'Rest', color: 'bg-emerald-400', value: 25 },
                                  { label: locale === 'fr' ? 'Social' : locale === 'es' ? 'Social' : 'Social', color: 'bg-purple-400', value: 45 },
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
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Bloom remarque les patterns...' : locale === 'es' ? 'Bloom nota los patrones...' : 'Bloom notices patterns...'}</p>
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
                                    <p className="text-xs text-red-600 font-medium">{locale === 'fr' ? 'Déséquilibre' : locale === 'es' ? 'Desequilibrio' : 'Imbalance'}</p>
                                    <p className="text-xs text-red-500">{locale === 'fr' ? 'Trop de travail cette semaine' : locale === 'es' ? 'Demasiado trabajo esta semana' : 'Too much work this week'}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Voyez la semaine...' : locale === 'es' ? 'Mira tu semana...' : 'See your week...'}</p>
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
                              <p className="text-xs text-neutral-500 text-center">{locale === 'fr' ? '5 jours travail • 2 jours repos' : locale === 'es' ? '5 días de trabajo • 2 días de descanso' : '5 work days • 2 rest days'}</p>
                            </motion.div>
                          )}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Bloom vous aide à équilibrer...' : locale === 'es' ? 'Bloom te ayuda a equilibrar...' : 'Bloom helps you balance...'}</p>
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
                                        : locale === 'es'
                                        ? 'Semana ocupada. Un momento de descanso esta noche te haría bien.'
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
                                : locale === 'es'
                                ? "No son hábitos para tachar. Son pequeños gestos que se sienten como tú — mirar por la ventana 2 minutos, saborear tu primer sorbo, 3 respiraciones al despertar."
                                : "These aren't habits to check off. They're tiny acts that feel like you — gazing out the window for 2 minutes, savoring that first sip, 3 breaths when you wake."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Pas de streaks. Pas de pression. Juste de petites invitations, quand vous êtes prêt. Bloom remarque ce qui fonctionne, doucement."
                                : locale === 'es'
                                ? "Sin rachas. Sin presión. Solo invitaciones suaves, cuando estés listo. Bloom nota lo que funciona, en silencio."
                                : "No streaks. No pressure. Just gentle invitations, when you're ready. Bloom notices what works, quietly."
                              }
                            </p>
                          </>
                        ) : personalSubTab === 'balance' ? (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "Vous savez ce sentiment quand tout semble déséquilibré? Trop de travail, pas assez de repos. Trop de temps seul, pas assez de connexion."
                                : locale === 'es'
                                ? "¿Conoces esa sensación cuando todo parece desequilibrado? Demasiado trabajo, poco descanso. Demasiado tiempo solo, poca conexión."
                                : "You know that feeling when everything feels off-balance? Too much work, not enough rest. Too much alone time, not enough connection."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Balance vous montre où va votre énergie, jour après jour. Pas pour juger, mais pour vous aider à voir — et à ajuster, doucement."
                                : locale === 'es'
                                ? "Equilibrio te muestra a dónde va tu energía, día a día. No para juzgar, sino para ayudarte a ver — y ajustar con suavidad."
                                : "Balance shows you where your energy goes, day by day. Not to judge, but to help you see — and gently adjust."
                              }
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {locale === 'fr'
                                ? "La vie n'est pas qu'une suite de grandes réussites. Ce sont les petits moments — un café calme, un sourire de votre chat, une balade au lever du soleil — qui façonnent vraiment qui vous êtes."
                                : locale === 'es'
                                ? "La vida no se trata solo de grandes logros. Son los pequeños momentos — un café tranquilo, el ronroneo de tu gato, un paseo al amanecer — los que realmente te definen."
                                : "Life isn't just about big achievements. It's the small moments — a quiet coffee, your cat's purr, a sunrise walk — that truly shape who you are."
                              }
                            </p>
                            <p className="text-sm text-neutral-600">
                              {locale === 'fr'
                                ? "Moments vous aide à les capturer, à voir les patterns, et à comprendre ce qui vous fait vraiment du bien."
                                : locale === 'es'
                                ? "Momentos te ayuda a capturarlos, ver los patrones, y entender lo que realmente te hace sentir bien."
                                : "Moments helps you capture them, see the patterns, and understand what truly makes you feel good."
                              }
                            </p>
                          </>
                        )}
                        <button
                          onClick={() => setShowExplanation(false)}
                          className="text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          {locale === 'fr' ? '← Retour' : locale === 'es' ? '← Volver' : '← Back'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom bar - CTA */}
                {isInteractive && interactiveStep === 3 ? (
                  <div className="flex justify-end">
                    <button
                      onClick={handleOpenEarlyAccess}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A9A86] text-white text-sm font-medium rounded-full hover:bg-[#3d8a76] transition-colors"
                    >
                      {locale === 'fr' ? 'Obtenir un accès anticipé' : locale === 'es' ? 'Obtener acceso anticipado' : 'Get Early Access'}
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                ) : isInteractive ? (
                  <div className={`flex items-center w-full ${interactiveStep > 0 ? 'justify-between' : 'justify-end'}`}>
                    {interactiveStep > 0 && (
                      <button
                        onClick={
                          personalSubTab === 'rituals' ? resetRitualsInteractive
                            : personalSubTab === 'balance' ? resetBalanceInteractive
                            : resetInteractive
                        }
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {locale === 'fr' ? '← Recommencer' : locale === 'es' ? '← Empezar de nuevo' : '← Start over'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsInteractive(false)
                        setDemoStep(0)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-500 bg-transparent text-xs font-medium rounded-full hover:bg-neutral-100 transition-colors"
                    >
                      {locale === 'fr' ? 'Voir un exemple' : locale === 'es' ? 'Ver ejemplo' : 'View example'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        setIsInteractive(true)
                        setInteractiveStep(0)
                        setShowExplanation(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-[#4A9A86] text-[#4A9A86] bg-transparent text-sm font-medium rounded-full hover:bg-[#4A9A86]/10 transition-colors"
                    >
                      {locale === 'fr' ? 'À vous' : locale === 'es' ? 'Tu turno' : 'Your turn'}
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
                  <span className="hidden sm:inline text-neutral-700 text-sm">
                    {locale === 'fr' ? 'Voir mes' : locale === 'es' ? 'Ver mis' : 'View my'}
                  </span>

                  {/* Members pill tab */}
                  <div className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap cursor-default bg-[#D4856A]/15 text-[#D4856A] font-medium">
                    <Users className="w-3 h-3" />
                    {locale === 'fr' ? 'clients' : locale === 'es' ? 'miembros' : 'members'}
                  </div>
                </div>

                {/* Feature Trailer - Step by step demo */}
                <div className="bg-neutral-50 rounded-xl p-4 mb-3 min-h-[140px]">
                  <AnimatePresence mode="wait">
                    {/* Members Demo Mode */}
                    {!practitionerInteractive && practitionerSubTab === 'members' && (
                      <motion.div key="members-trailer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {/* Step 0: Client List with Add Button - Compact Row */}
                          {demoStep === 0 && (
                            <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Vos clients' : locale === 'es' ? 'Tus clientes' : 'Your clients'}</p>
                                <span className="text-[10px] text-neutral-400">4 {locale === 'fr' ? 'actifs' : locale === 'es' ? 'activos' : 'active'}</span>
                              </div>
                              {/* Client avatars in a row */}
                              <div className="flex items-center gap-2">
                                {[
                                  { initials: 'SL', name: 'Sarah L.', color: 'from-[#D4856A] to-[#E8A87C]' },
                                  { initials: 'MD', name: 'Marc D.', color: 'from-violet-500 to-violet-400' },
                                  { initials: 'JT', name: 'Julie T.', color: 'from-emerald-500 to-emerald-400' },
                                  { initials: 'AR', name: 'Alex R.', color: 'from-blue-500 to-blue-400' },
                                ].map((client, i) => (
                                  <motion.div
                                    key={client.initials}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.08, type: "spring" }}
                                    className="flex flex-col items-center gap-1 cursor-pointer group"
                                  >
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${client.color} flex items-center justify-center text-white text-[10px] font-medium shadow-sm group-hover:scale-110 transition-transform`}>
                                      {client.initials}
                                    </div>
                                    <p className="text-[9px] text-neutral-500 group-hover:text-neutral-700">{client.name.split(' ')[0]}</p>
                                  </motion.div>
                                ))}
                                {/* Add button */}
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.35, type: "spring" }}
                                  className="flex flex-col items-center gap-1 cursor-pointer group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 group-hover:border-[#D4856A] group-hover:text-[#D4856A] transition-colors">
                                    <Plus className="w-4 h-4" />
                                  </div>
                                  <p className="text-[9px] text-neutral-400 group-hover:text-[#D4856A]">{locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}</p>
                                </motion.div>
                              </div>
                            </motion.div>
                          )}
                          {/* Step 1: Client Detail View - Compact Header */}
                          {demoStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-2">
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring" }}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-xs font-medium"
                                  >
                                    SL
                                  </motion.div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-800">Sarah L.</p>
                                    <p className="text-[10px] text-neutral-400">{locale === 'fr' ? '12 sessions • Depuis mars' : locale === 'es' ? '12 sesiones • Desde mar' : '12 sessions • Since Mar'}</p>
                                  </div>
                                  {/* Inline stats */}
                                  <div className="flex items-center gap-3 text-center">
                                    <div>
                                      <p className="text-sm font-semibold text-[#D4856A]">12</p>
                                      <p className="text-[8px] text-neutral-400">{locale === 'fr' ? 'sess.' : locale === 'es' ? 'ses.' : 'sess.'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-green-500">↑</p>
                                      <p className="text-[8px] text-neutral-400">{locale === 'fr' ? 'prog.' : locale === 'es' ? 'prog.' : 'prog.'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {/* Step 2: Key Considerations & Objectives - Compact */}
                          {demoStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Key Considerations */}
                                  <div>
                                    <p className="text-[9px] uppercase tracking-wider text-neutral-400 mb-1.5">{locale === 'fr' ? 'Points clés' : locale === 'es' ? 'Puntos clave' : 'Key points'}</p>
                                    <div className="space-y-1">
                                      {[
                                        locale === 'fr' ? 'Anxiété sociale' : locale === 'es' ? 'Ansiedad social' : 'Social anxiety',
                                        locale === 'fr' ? 'Besoin structure' : locale === 'es' ? 'Necesita estructura' : 'Needs structure',
                                      ].map((item, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: i * 0.1 }}
                                          className="flex items-center gap-1.5 text-[10px] text-neutral-600"
                                        >
                                          <div className="w-1 h-1 rounded-full bg-[#D4856A]" />
                                          {item}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Objectives */}
                                  <div>
                                    <p className="text-[9px] uppercase tracking-wider text-neutral-400 mb-1.5">{locale === 'fr' ? 'Objectifs' : locale === 'es' ? 'Objetivos' : 'Goals'}</p>
                                    <div className="space-y-1">
                                      {[
                                        { text: locale === 'fr' ? 'Respiration' : locale === 'es' ? 'Respiración' : 'Breathing', done: true },
                                        { text: locale === 'fr' ? 'Gestion stress' : locale === 'es' ? 'Manejo estrés' : 'Stress mgmt', done: true },
                                        { text: locale === 'fr' ? 'Affirmation' : locale === 'es' ? 'Afirmación' : 'Assertion', done: false },
                                      ].map((obj, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: i * 0.1 }}
                                          className="flex items-center gap-1.5 text-[10px]"
                                        >
                                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${obj.done ? 'bg-[#D4856A] border-[#D4856A]' : 'border-neutral-300'}`}>
                                            {obj.done && <Check className="w-2 h-2 text-white" />}
                                          </div>
                                          <span className={obj.done ? 'text-neutral-400 line-through' : 'text-neutral-600'}>{obj.text}</span>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          {/* Step 3: Notes - Compact with Share button */}
                          {demoStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-2">
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[9px] uppercase tracking-wider text-neutral-400">{locale === 'fr' ? 'Notes récentes' : locale === 'es' ? 'Notas recientes' : 'Recent notes'}</p>
                                  <span className="text-[9px] text-[#D4856A]">+ {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}</span>
                                </div>
                                <div className="space-y-2">
                                  {[
                                    { date: locale === 'fr' ? '15 jan' : locale === 'es' ? '15 ene' : 'Jan 15', note: locale === 'fr' ? 'Excellent - visualisation réussie' : locale === 'es' ? 'Excelente - visualización exitosa' : 'Excellent - visualization success' },
                                    { date: locale === 'fr' ? '8 jan' : locale === 'es' ? '8 ene' : 'Jan 8', note: locale === 'fr' ? 'Progrès anxiété, continue exercices' : locale === 'es' ? 'Progreso ansiedad, continúa ejercicios' : 'Anxiety progress, continuing exercises' },
                                  ].map((entry, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="text-[9px] text-[#D4856A] font-medium shrink-0 pt-0.5">{entry.date}</span>
                                      <p className="text-[10px] text-neutral-600">{entry.note}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                              {/* Share resource button */}
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                onClick={() => setDemoStep(4)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-[#D4856A]/10 text-[#D4856A] text-[10px] font-medium rounded-lg hover:bg-[#D4856A]/20 transition-colors"
                              >
                                <Share2 className="w-3 h-3" />
                                {locale === 'fr' ? 'Partager une ressource' : locale === 'es' ? 'Compartir un recurso' : 'Share a resource'}
                              </motion.button>
                            </motion.div>
                          )}
                          {/* Step 4: Resource Selection */}
                          {demoStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Choisir une ressource...' : locale === 'es' ? 'Elegir un recurso...' : 'Choose a resource...'}</p>
                              </div>
                              <div className="space-y-1.5">
                                {[
                                  { id: 'breathing', name: locale === 'fr' ? 'Exercice de respiration' : locale === 'es' ? 'Ejercicio de respiración' : 'Breathing exercise', type: 'PDF' },
                                  { id: 'gratitude', name: locale === 'fr' ? 'Journal de gratitude' : locale === 'es' ? 'Diario de gratitud' : 'Gratitude journal', type: 'Guide' },
                                  { id: 'anxiety', name: locale === 'fr' ? 'Gérer l\'anxiété' : locale === 'es' ? 'Manejar la ansiedad' : 'Managing anxiety', type: 'Article' },
                                ].map((resource, i) => (
                                  <motion.button
                                    key={resource.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => setDemoStep(5)}
                                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white hover:bg-[#D4856A]/5 border border-transparent hover:border-[#D4856A]/20 transition-all shadow-sm"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[#D4856A]/10 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-[#D4856A]" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="text-[11px] font-medium text-neutral-700">{resource.name}</p>
                                      <p className="text-[9px] text-neutral-400">{resource.type}</p>
                                    </div>
                                    <Share2 className="w-3.5 h-3.5 text-neutral-300" />
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {/* Step 5: Resource Shared Confirmation */}
                          {demoStep === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-3">
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
                                  {locale === 'fr' ? 'Ressource partagée!' : locale === 'es' ? '¡Recurso compartido!' : 'Resource shared!'}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {locale === 'fr'
                                    ? 'Sarah L. recevra une notification'
                                    : locale === 'es'
                                    ? 'Sarah L. recibirá una notificación'
                                    : 'Sarah L. will receive a notification'}
                                </p>
                              </div>
                              {/* See progress button */}
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                onClick={() => setDemoStep(6)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-[#D4856A]/10 text-[#D4856A] text-[10px] font-medium rounded-lg hover:bg-[#D4856A]/20 transition-colors"
                              >
                                {locale === 'fr' ? 'Voir la progression →' : locale === 'es' ? 'Ver progreso →' : 'See progress →'}
                              </motion.button>
                            </motion.div>
                          )}
                          {/* Step 6: Progress Board */}
                          {demoStep === 6 && (
                            <motion.div key="step6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Progression de Sarah' : locale === 'es' ? 'Progreso de Sarah' : "Sarah's Progress"}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { id: 'discovery', label: locale === 'fr' ? 'Découverte' : locale === 'es' ? 'Descubrimiento' : 'Discovery', count: 0, color: 'bg-blue-50 border-blue-200' },
                                  { id: 'building', label: locale === 'fr' ? 'Construction' : locale === 'es' ? 'Construcción' : 'Building', count: 1, color: 'bg-amber-50 border-amber-200', hasCard: true },
                                  { id: 'thriving', label: locale === 'fr' ? 'Épanoui' : locale === 'es' ? 'Floreciendo' : 'Thriving', count: 0, color: 'bg-emerald-50 border-emerald-200' },
                                  { id: 'independent', label: locale === 'fr' ? 'Autonome' : locale === 'es' ? 'Independiente' : 'Independent', count: 0, color: 'bg-purple-50 border-purple-200' },
                                ].map((stage, i) => (
                                  <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`rounded-lg p-1.5 border ${stage.color} min-h-[60px]`}
                                  >
                                    <p className="text-[7px] font-medium text-neutral-600 mb-1 truncate">{stage.label}</p>
                                    {stage.hasCard && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.4, type: "spring" }}
                                        className="bg-white rounded p-1 shadow-sm border border-neutral-100 cursor-grab"
                                      >
                                        <p className="text-[7px] text-neutral-700 font-medium">{locale === 'fr' ? 'Gestion stress' : locale === 'es' ? 'Manejo estrés' : 'Stress mgmt'}</p>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-[9px] text-center text-neutral-400"
                              >
                                {locale === 'fr' ? 'Glissez les objectifs entre les colonnes' : locale === 'es' ? 'Arrastra los objetivos entre columnas' : 'Drag goals between columns'}
                              </motion.p>
                            </motion.div>
                          )}
                          {/* Step 7: Goal Moved Confirmation */}
                          {demoStep === 7 && (
                            <motion.div key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Progression de Sarah' : locale === 'es' ? 'Progreso de Sarah' : "Sarah's Progress"}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { id: 'discovery', label: locale === 'fr' ? 'Découverte' : locale === 'es' ? 'Descubrimiento' : 'Discovery', color: 'bg-blue-50 border-blue-200' },
                                  { id: 'building', label: locale === 'fr' ? 'Construction' : locale === 'es' ? 'Construcción' : 'Building', color: 'bg-amber-50 border-amber-200' },
                                  { id: 'thriving', label: locale === 'fr' ? 'Épanoui' : locale === 'es' ? 'Floreciendo' : 'Thriving', color: 'bg-emerald-50 border-emerald-200', hasCard: true },
                                  { id: 'independent', label: locale === 'fr' ? 'Autonome' : locale === 'es' ? 'Independiente' : 'Independent', color: 'bg-purple-50 border-purple-200' },
                                ].map((stage, i) => (
                                  <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`rounded-lg p-1.5 border ${stage.color} min-h-[60px]`}
                                  >
                                    <p className="text-[7px] font-medium text-neutral-600 mb-1 truncate">{stage.label}</p>
                                    {stage.hasCard && (
                                      <motion.div
                                        initial={{ x: -30, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, type: "spring" }}
                                        className="bg-white rounded p-1 shadow-sm border border-emerald-200"
                                      >
                                        <p className="text-[7px] text-neutral-700 font-medium">{locale === 'fr' ? 'Gestion stress' : locale === 'es' ? 'Manejo estrés' : 'Stress mgmt'}</p>
                                        <Check className="w-2.5 h-2.5 text-emerald-500 mt-0.5" />
                                      </motion.div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center justify-center gap-2 py-1.5 bg-emerald-50 rounded-lg"
                              >
                                <Check className="w-3 h-3 text-emerald-500" />
                                <p className="text-[9px] text-emerald-700 font-medium">
                                  {locale === 'fr' ? 'Objectif avancé vers Épanoui!' : locale === 'es' ? '¡Objetivo movido a Floreciendo!' : 'Goal moved to Thriving!'}
                                </p>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Members Interactive Mode */}
                    {practitionerInteractive && practitionerSubTab === 'members' && (
                      <motion.div key="members-interactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence mode="wait">
                          {/* Step 0: Client list with Add button - Compact Row */}
                          {practitionerStep === 0 && (
                            <motion.div key="int-step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Sélectionnez un client' : locale === 'es' ? 'Selecciona un cliente' : 'Select a client'}</p>
                                <span className="text-[10px] text-neutral-400">3 {locale === 'fr' ? 'actifs' : locale === 'es' ? 'activos' : 'active'}</span>
                              </div>
                              {/* Client avatars in a row */}
                              <div className="flex items-center gap-2">
                                {[
                                  { id: 'sarah', name: 'Sarah', initials: 'SL', color: 'from-[#D4856A] to-[#E8A87C]' },
                                  { id: 'marc', name: 'Marc', initials: 'MD', color: 'from-violet-500 to-violet-400' },
                                  { id: 'julie', name: 'Julie', initials: 'JT', color: 'from-emerald-500 to-emerald-400' },
                                ].map((client, i) => (
                                  <motion.button
                                    key={client.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.08, type: "spring" }}
                                    onClick={() => {
                                      setSelectedClient(client.id)
                                      setClientName(`${client.name} L.`)
                                      setPractitionerStep(2)
                                    }}
                                    className="flex flex-col items-center gap-1 group"
                                  >
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${client.color} flex items-center justify-center text-white text-[10px] font-medium shadow-sm group-hover:scale-110 transition-transform`}>
                                      {client.initials}
                                    </div>
                                    <p className="text-[9px] text-neutral-500 group-hover:text-neutral-700">{client.name}</p>
                                  </motion.button>
                                ))}
                                {/* Add button */}
                                <motion.button
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.25, type: "spring" }}
                                  onClick={() => {
                                    setSelectedClient('new')
                                    setClientName('')
                                    setPractitionerStep(1)
                                  }}
                                  className="flex flex-col items-center gap-1 group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 group-hover:border-[#D4856A] group-hover:text-[#D4856A] transition-colors">
                                    <Plus className="w-4 h-4" />
                                  </div>
                                  <p className="text-[9px] text-neutral-400 group-hover:text-[#D4856A]">{locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}</p>
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                          {/* Step 1: Add new client form - Compact */}
                          {practitionerStep === 1 && (
                            <motion.div key="int-step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-2">
                              <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Nouveau client' : locale === 'es' ? 'Nuevo cliente' : 'New client'}</p>
                              <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
                                <input
                                  type="text"
                                  value={clientName}
                                  onChange={(e) => setClientName(e.target.value)}
                                  placeholder={locale === 'fr' ? 'Nom du client...' : locale === 'es' ? 'Nombre del cliente...' : 'Client name...'}
                                  className="w-full text-sm text-neutral-700 placeholder:text-neutral-300 bg-neutral-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D4856A]/30"
                                />
                                <button
                                  onClick={() => {
                                    if (clientName.trim()) {
                                      setSelectedClient('new-added')
                                      setPractitionerStep(2)
                                    }
                                  }}
                                  className="w-full py-2 bg-[#D4856A] text-white text-xs font-medium rounded-lg hover:bg-[#c27459] transition-colors disabled:opacity-50"
                                  disabled={!clientName.trim()}
                                >
                                  {locale === 'fr' ? 'Créer' : locale === 'es' ? 'Crear' : 'Create'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                          {/* Step 2: Client detail view - Compact 2-column */}
                          {practitionerStep === 2 && (
                            <motion.div key="int-step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-2">
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-[9px] font-medium">
                                    {clientName ? clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NC'}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-neutral-800">{clientName || 'New Client'}</p>
                                    <p className="text-[9px] text-neutral-400">{locale === 'fr' ? '8 sessions' : locale === 'es' ? '8 sesiones' : '8 sessions'}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Key Points */}
                                  <div>
                                    <p className="text-[8px] uppercase tracking-wider text-neutral-400 mb-1">{locale === 'fr' ? 'Points clés' : locale === 'es' ? 'Puntos clave' : 'Key points'}</p>
                                    <div className="space-y-0.5">
                                      {[
                                        locale === 'fr' ? 'Anxiété sociale' : locale === 'es' ? 'Ansiedad social' : 'Social anxiety',
                                        locale === 'fr' ? 'Besoin structure' : locale === 'es' ? 'Necesita estructura' : 'Needs structure',
                                      ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-1 text-[9px] text-neutral-600">
                                          <div className="w-1 h-1 rounded-full bg-[#D4856A]" />
                                          {item}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Goals */}
                                  <div>
                                    <p className="text-[8px] uppercase tracking-wider text-neutral-400 mb-1">{locale === 'fr' ? 'Objectifs' : locale === 'es' ? 'Objetivos' : 'Goals'}</p>
                                    <div className="space-y-0.5">
                                      {[
                                        { text: locale === 'fr' ? 'Respiration' : locale === 'es' ? 'Respiración' : 'Breathing', done: true },
                                        { text: locale === 'fr' ? 'Gestion stress' : locale === 'es' ? 'Manejo estrés' : 'Stress mgmt', done: false },
                                      ].map((obj, i) => (
                                        <div key={i} className="flex items-center gap-1 text-[9px]">
                                          <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${obj.done ? 'bg-[#D4856A] border-[#D4856A]' : 'border-neutral-300'}`}>
                                            {obj.done && <Check className="w-1.5 h-1.5 text-white" />}
                                          </div>
                                          <span className={obj.done ? 'text-neutral-400 line-through' : 'text-neutral-600'}>{obj.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setPractitionerStep(3)}
                                className="w-full py-1.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                              >
                                {locale === 'fr' ? 'Notes →' : locale === 'es' ? 'Notas →' : 'Notes →'}
                              </button>
                            </motion.div>
                          )}
                          {/* Step 3: Notes view - Compact with Share button */}
                          {practitionerStep === 3 && (
                            <motion.div key="int-step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-2">
                              <div className="bg-white rounded-xl p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[9px] uppercase tracking-wider text-neutral-400">{locale === 'fr' ? 'Notes' : locale === 'es' ? 'Notas' : 'Notes'}</p>
                                  <button className="text-[9px] text-[#D4856A] font-medium">+ {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}</button>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-start gap-2">
                                    <span className="text-[8px] text-[#D4856A] font-medium shrink-0 pt-0.5">{locale === 'fr' ? '15 jan' : locale === 'es' ? '15 ene' : 'Jan 15'}</span>
                                    <p className="text-[9px] text-neutral-600">{locale === 'fr' ? 'Excellent - visualisation réussie' : locale === 'es' ? 'Excelente - visualización exitosa' : 'Excellent - visualization success'}</p>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-[8px] text-[#D4856A] font-medium shrink-0 pt-0.5">{locale === 'fr' ? '8 jan' : locale === 'es' ? '8 ene' : 'Jan 8'}</span>
                                    <p className="text-[9px] text-neutral-600">{locale === 'fr' ? 'Progrès anxiété, continue' : locale === 'es' ? 'Progreso ansiedad, continúa' : 'Anxiety progress, continuing'}</p>
                                  </div>
                                </div>
                              </div>
                              {/* Share resource button */}
                              <button
                                onClick={() => setPractitionerStep(4)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-[#D4856A]/10 text-[#D4856A] text-[10px] font-medium rounded-lg hover:bg-[#D4856A]/20 transition-colors"
                              >
                                <Share2 className="w-3 h-3" />
                                {locale === 'fr' ? 'Partager une ressource' : locale === 'es' ? 'Compartir un recurso' : 'Share a resource'}
                              </button>
                            </motion.div>
                          )}
                          {/* Step 4: Resource Selection */}
                          {practitionerStep === 4 && (
                            <motion.div key="int-step4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? 'Choisir une ressource...' : locale === 'es' ? 'Elegir un recurso...' : 'Choose a resource...'}</p>
                              </div>
                              <div className="space-y-1.5">
                                {[
                                  { id: 'breathing', name: locale === 'fr' ? 'Exercice de respiration' : locale === 'es' ? 'Ejercicio de respiración' : 'Breathing exercise', type: 'PDF' },
                                  { id: 'gratitude', name: locale === 'fr' ? 'Journal de gratitude' : locale === 'es' ? 'Diario de gratitud' : 'Gratitude journal', type: 'Guide' },
                                  { id: 'anxiety', name: locale === 'fr' ? 'Gérer l\'anxiété' : locale === 'es' ? 'Manejar la ansiedad' : 'Managing anxiety', type: 'Article' },
                                ].map((resource, i) => (
                                  <motion.button
                                    key={resource.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => setPractitionerStep(5)}
                                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white hover:bg-[#D4856A]/5 border border-transparent hover:border-[#D4856A]/20 transition-all shadow-sm"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[#D4856A]/10 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-[#D4856A]" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="text-[11px] font-medium text-neutral-700">{resource.name}</p>
                                      <p className="text-[9px] text-neutral-400">{resource.type}</p>
                                    </div>
                                    <Share2 className="w-3.5 h-3.5 text-neutral-300" />
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {/* Step 5: Resource Shared Confirmation */}
                          {practitionerStep === 5 && (
                            <motion.div key="int-step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
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
                                  {locale === 'fr' ? 'Ressource partagée!' : locale === 'es' ? '¡Recurso compartido!' : 'Resource shared!'}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {locale === 'fr'
                                    ? `${clientName} recevra une notification`
                                    : locale === 'es'
                                    ? `${clientName} recibirá una notificación`
                                    : `${clientName} will receive a notification`}
                                </p>
                              </div>
                              {/* See progress button */}
                              <button
                                onClick={() => setPractitionerStep(6)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-[#D4856A]/10 text-[#D4856A] text-[10px] font-medium rounded-lg hover:bg-[#D4856A]/20 transition-colors"
                              >
                                {locale === 'fr' ? 'Voir la progression →' : locale === 'es' ? 'Ver progreso →' : 'See progress →'}
                              </button>
                            </motion.div>
                          )}
                          {/* Step 6: Progress Board - Interactive */}
                          {practitionerStep === 6 && (
                            <motion.div key="int-step6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? `Progression de ${clientName}` : locale === 'es' ? `Progreso de ${clientName}` : `${clientName}'s Progress`}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { id: 'discovery', label: locale === 'fr' ? 'Découverte' : locale === 'es' ? 'Descubrimiento' : 'Discovery', color: 'bg-blue-50 border-blue-200' },
                                  { id: 'building', label: locale === 'fr' ? 'Construction' : locale === 'es' ? 'Construcción' : 'Building', color: 'bg-amber-50 border-amber-200', hasCard: true },
                                  { id: 'thriving', label: locale === 'fr' ? 'Épanoui' : locale === 'es' ? 'Floreciendo' : 'Thriving', color: 'bg-emerald-50 border-emerald-200' },
                                  { id: 'independent', label: locale === 'fr' ? 'Autonome' : locale === 'es' ? 'Independiente' : 'Independent', color: 'bg-purple-50 border-purple-200' },
                                ].map((stage, i) => (
                                  <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => stage.id === 'thriving' && setPractitionerStep(7)}
                                    className={`rounded-lg p-1.5 border ${stage.color} min-h-[60px] ${stage.id === 'thriving' ? 'cursor-pointer hover:border-emerald-400 transition-colors' : ''}`}
                                  >
                                    <p className="text-[7px] font-medium text-neutral-600 mb-1 truncate">{stage.label}</p>
                                    {stage.hasCard && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.4, type: "spring" }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => setPractitionerStep(7)}
                                        className="bg-white rounded p-1 shadow-sm border border-neutral-100 cursor-grab active:cursor-grabbing"
                                      >
                                        <p className="text-[7px] text-neutral-700 font-medium">{locale === 'fr' ? 'Gestion stress' : locale === 'es' ? 'Manejo estrés' : 'Stress mgmt'}</p>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                              <p className="text-[9px] text-center text-neutral-400">
                                {locale === 'fr' ? 'Cliquez sur un objectif pour le déplacer' : locale === 'es' ? 'Haz clic en un objetivo para moverlo' : 'Click a goal to move it'}
                              </p>
                            </motion.div>
                          )}
                          {/* Step 7: Goal Moved Confirmation */}
                          {practitionerStep === 7 && (
                            <motion.div key="int-step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-neutral-500">{locale === 'fr' ? `Progression de ${clientName}` : locale === 'es' ? `Progreso de ${clientName}` : `${clientName}'s Progress`}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { id: 'discovery', label: locale === 'fr' ? 'Découverte' : locale === 'es' ? 'Descubrimiento' : 'Discovery', color: 'bg-blue-50 border-blue-200' },
                                  { id: 'building', label: locale === 'fr' ? 'Construction' : locale === 'es' ? 'Construcción' : 'Building', color: 'bg-amber-50 border-amber-200' },
                                  { id: 'thriving', label: locale === 'fr' ? 'Épanoui' : locale === 'es' ? 'Floreciendo' : 'Thriving', color: 'bg-emerald-50 border-emerald-200', hasCard: true },
                                  { id: 'independent', label: locale === 'fr' ? 'Autonome' : locale === 'es' ? 'Independiente' : 'Independent', color: 'bg-purple-50 border-purple-200' },
                                ].map((stage, i) => (
                                  <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`rounded-lg p-1.5 border ${stage.color} min-h-[60px]`}
                                  >
                                    <p className="text-[7px] font-medium text-neutral-600 mb-1 truncate">{stage.label}</p>
                                    {stage.hasCard && (
                                      <motion.div
                                        initial={{ x: -30, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, type: "spring" }}
                                        className="bg-white rounded p-1 shadow-sm border border-emerald-200"
                                      >
                                        <p className="text-[7px] text-neutral-700 font-medium">{locale === 'fr' ? 'Gestion stress' : locale === 'es' ? 'Manejo estrés' : 'Stress mgmt'}</p>
                                        <Check className="w-2.5 h-2.5 text-emerald-500 mt-0.5" />
                                      </motion.div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center justify-center gap-2 py-1.5 bg-emerald-50 rounded-lg"
                              >
                                <Check className="w-3 h-3 text-emerald-500" />
                                <p className="text-[9px] text-emerald-700 font-medium">
                                  {locale === 'fr' ? 'Objectif avancé vers Épanoui!' : locale === 'es' ? '¡Objetivo movido a Floreciendo!' : 'Goal moved to Thriving!'}
                                </p>
                              </motion.div>
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
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          {locale === 'fr'
                            ? "Vos clients ne sont pas des numéros. Ce sont des personnes avec des histoires, des progrès, des défis. Bloom vous aide à garder tout organisé — notes, sessions, jalons — pour que vous puissiez vous concentrer sur ce qui compte."
                            : locale === 'es'
                            ? "Tus clientes no son números. Son personas con historias, progresos, desafíos. Bloom te ayuda a mantener todo organizado — notas, sesiones, hitos — para que puedas concentrarte en lo que importa."
                            : "Your clients aren't numbers. They're people with stories, progress, challenges. Bloom helps you keep everything organized — notes, sessions, milestones — so you can focus on what matters."
                          }
                        </p>
                        <p className="text-sm text-neutral-600">
                          {locale === 'fr'
                            ? "Pas de logiciels compliqués. Juste un espace calme pour accompagner chaque parcours."
                            : locale === 'es'
                            ? "Sin software complicado. Solo un espacio tranquilo para acompañar cada recorrido."
                            : "No complicated software. Just a calm space to support each journey."
                          }
                        </p>
                        <button
                          onClick={() => setPractitionerExplanation(false)}
                          className="text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          {locale === 'fr' ? '← Retour' : locale === 'es' ? '← Volver' : '← Back'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom bar - CTA */}
                {practitionerInteractive && practitionerStep === 7 ? (
                  <button
                    onClick={handleOpenEarlyAccess}
                    className="flex items-center justify-between group w-full"
                  >
                    <span className="text-sm text-[#D4856A] font-medium group-hover:text-[#c27459] transition-colors">
                      {locale === 'fr' ? 'Obtenir un accès anticipé' : locale === 'es' ? 'Obtener acceso anticipado' : 'Get Early Access'}
                    </span>
                    <div className="w-8 h-8 bg-[#D4856A] rounded-full flex items-center justify-center group-hover:bg-[#c27459] transition-colors">
                      <ArrowUp className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ) : practitionerInteractive ? (
                  <div className={`flex items-center w-full ${practitionerStep > 0 ? 'justify-between' : 'justify-end'}`}>
                    {practitionerStep > 0 && (
                      <button
                        onClick={resetMembersInteractive}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {locale === 'fr' ? '← Recommencer' : locale === 'es' ? '← Empezar de nuevo' : '← Start over'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPractitionerInteractive(false)
                        setDemoStep(0)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-500 bg-transparent text-xs font-medium rounded-full hover:bg-neutral-100 transition-colors"
                    >
                      {locale === 'fr' ? 'Voir un exemple' : locale === 'es' ? 'Ver ejemplo' : 'View example'}
                    </button>
                  </div>
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
                      {locale === 'fr' ? 'À vous' : locale === 'es' ? 'Tu turno' : 'Your turn'}
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CTA Button - only on member homepage, after demo */}
        {!isPractitionerPage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={handleOpenEarlyAccess}
              className="px-8 py-3 bg-[#4A9A86] hover:bg-[#3d8a76] text-white font-medium rounded-full shadow-lg shadow-[#4A9A86]/30 hover:shadow-xl transition-all duration-300"
            >
              {locale === 'fr' ? 'Commencer gratuitement' : locale === 'es' ? 'Comenzar gratis' : 'Get started free'}
            </button>
          </motion.div>
        )}

        {/* Practitioner CTA */}
        {isPractitionerPage && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-full max-w-xl mx-auto mt-10 px-4 sm:px-6 flex justify-center"
          >
            <button
              onClick={handleOpenEarlyAccess}
              className="px-8 py-4 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-full shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300"
            >
              {locale === 'fr' ? 'Obtenir un accès anticipé' : locale === 'es' ? 'Obtener acceso anticipado' : 'Get Early Access'}
            </button>
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
