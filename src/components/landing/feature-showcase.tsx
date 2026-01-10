'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Sun, Circle, Smile, Camera, Play, Heart, MessageCircle,
  Sparkles, Check, Clock, TrendingUp, Users, Target, BookOpen,
  Share2, BarChart3, FileText
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

type FeatureTab = 'moments' | 'rituals' | 'balance'
type PractitionerFeatureTab = 'members' | 'journeys' | 'resources'

// Mock moment data
const mockMoments = [
  { id: 1, image: '/api/placeholder/200/200', emotion: 'grateful', time: '2 min ago' },
  { id: 2, image: '/api/placeholder/200/200', emotion: 'peaceful', time: '1 hour ago' },
  { id: 3, image: '/api/placeholder/200/200', emotion: 'joyful', time: 'Yesterday' },
]

export function FeatureShowcase() {
  const { locale } = useLanguage()
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('moments')
  const [practitionerFeature, setPractitionerFeature] = useState<PractitionerFeatureTab>('members')
  const [demoStep, setDemoStep] = useState(0)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  // Auto-advance demo steps
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [isInView, activeFeature])

  // Reset demo when feature changes
  useEffect(() => {
    setDemoStep(0)
  }, [activeFeature, practitionerFeature])

  const features = {
    moments: {
      icon: Sun,
      title: locale === 'fr' ? 'Moments' : 'Moments',
      tagline: locale === 'fr' ? 'Capturez. Ressentez. Revivez.' : 'Capture. Feel. Relive.',
      color: '#4A9A86',
    },
    rituals: {
      icon: Circle,
      title: locale === 'fr' ? 'Rituels' : 'Rituals',
      tagline: locale === 'fr' ? 'Des habitudes qui vous ressemblent' : 'Habits that feel like you',
      color: '#4A9A86',
    },
    balance: {
      icon: Smile,
      title: locale === 'fr' ? 'Équilibre' : 'Balance',
      tagline: locale === 'fr' ? 'Comprenez vos patterns' : 'Understand your patterns',
      color: '#4A9A86',
    },
  }

  const practitionerFeatures = {
    members: {
      icon: Users,
      title: locale === 'fr' ? 'Clients' : 'Members',
      tagline: locale === 'fr' ? 'Tout au même endroit' : 'Everything in one place',
      color: '#D4856A',
    },
    journeys: {
      icon: Target,
      title: locale === 'fr' ? 'Parcours' : 'Journeys',
      tagline: locale === 'fr' ? 'Visualisez les progrès' : 'Visualize progress',
      color: '#D4856A',
    },
    resources: {
      icon: BookOpen,
      title: locale === 'fr' ? 'Ressources' : 'Resources',
      tagline: locale === 'fr' ? 'Partagez en un clic' : 'Share with one click',
      color: '#D4856A',
    },
  }

  return (
    <section ref={sectionRef} className="py-24 bg-neutral-50/50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
            {locale === 'fr' ? 'Découvrez comment ça marche' : 'See how it works'}
          </h2>
          <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
            {locale === 'fr'
              ? 'Des outils simples pour un bien-être authentique'
              : 'Simple tools for authentic wellbeing'}
          </p>
        </motion.div>

        {/* Personal Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-24"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#4A9A86]" />
            <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
              {locale === 'fr' ? 'Pour vous' : 'For you'}
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Feature Tabs */}
            <div className="space-y-4">
              {(Object.keys(features) as FeatureTab[]).map((key) => {
                const feature = features[key]
                const isActive = activeFeature === key
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFeature(key)}
                    className={`w-full text-left p-5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-white shadow-lg shadow-neutral-200/50'
                        : 'bg-transparent hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? 'bg-[#4A9A86]' : 'bg-neutral-200'
                      }`}>
                        <feature.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium mb-1 ${isActive ? 'text-neutral-900' : 'text-neutral-600'}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm ${isActive ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {feature.tagline}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Feature Demo */}
            <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/30 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeFeature === 'moments' && (
                  <MomentsDemo key="moments" demoStep={demoStep} locale={locale} />
                )}
                {activeFeature === 'rituals' && (
                  <RitualsDemo key="rituals" demoStep={demoStep} locale={locale} />
                )}
                {activeFeature === 'balance' && (
                  <BalanceDemo key="balance" demoStep={demoStep} locale={locale} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Practitioner Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#D4856A]" />
            <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
              {locale === 'fr' ? 'Pour praticiens' : 'For practitioners'}
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Feature Demo */}
            <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/30 overflow-hidden order-2 lg:order-1">
              <AnimatePresence mode="wait">
                {practitionerFeature === 'members' && (
                  <MembersDemo key="members" demoStep={demoStep} locale={locale} />
                )}
                {practitionerFeature === 'journeys' && (
                  <JourneysDemo key="journeys" demoStep={demoStep} locale={locale} />
                )}
                {practitionerFeature === 'resources' && (
                  <ResourcesDemo key="resources" demoStep={demoStep} locale={locale} />
                )}
              </AnimatePresence>
            </div>

            {/* Feature Tabs */}
            <div className="space-y-4 order-1 lg:order-2">
              {(Object.keys(practitionerFeatures) as PractitionerFeatureTab[]).map((key) => {
                const feature = practitionerFeatures[key]
                const isActive = practitionerFeature === key
                return (
                  <button
                    key={key}
                    onClick={() => setPractitionerFeature(key)}
                    className={`w-full text-left p-5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-white shadow-lg shadow-neutral-200/50'
                        : 'bg-transparent hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? 'bg-[#D4856A]' : 'bg-neutral-200'
                      }`}>
                        <feature.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium mb-1 ${isActive ? 'text-neutral-900' : 'text-neutral-600'}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm ${isActive ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {feature.tagline}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Moments Demo Component
function MomentsDemo({ demoStep, locale }: { demoStep: number; locale: 'en' | 'fr' }) {
  const steps = [
    {
      title: locale === 'fr' ? 'Capturez un moment' : 'Capture a moment',
      desc: locale === 'fr' ? 'Photo, note vocale, ou texte' : 'Photo, voice note, or text'
    },
    {
      title: locale === 'fr' ? 'Ajoutez votre ressenti' : 'Add how you feel',
      desc: locale === 'fr' ? 'Étiquetez vos émotions' : 'Tag your emotions'
    },
    {
      title: locale === 'fr' ? 'Voyez votre flow' : 'See your flow',
      desc: locale === 'fr' ? 'Une timeline de vos moments' : 'A timeline of your moments'
    },
    {
      title: locale === 'fr' ? 'Parlez avec vos souvenirs' : 'Talk with your memories',
      desc: locale === 'fr' ? 'L\'IA vous aide à réfléchir' : 'AI helps you reflect'
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= demoStep ? 'bg-[#4A9A86]' : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-neutral-900 mb-1">{steps[demoStep].title}</h4>
        <p className="text-sm text-neutral-500">{steps[demoStep].desc}</p>
      </div>

      {/* Demo visualization */}
      <div className="bg-neutral-50 rounded-2xl p-4 min-h-[280px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {demoStep === 0 && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center h-full py-8"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-[#4A9A86] flex items-center justify-center mb-4 shadow-lg shadow-[#4A9A86]/30"
              >
                <Camera className="w-10 h-10 text-white" />
              </motion.div>
              <p className="text-sm text-neutral-500">{locale === 'fr' ? 'Appuyez pour capturer' : 'Tap to capture'}</p>
            </motion.div>
          )}

          {demoStep === 1 && (
            <motion.div
              key="emotion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 py-4"
            >
              <div className="aspect-video bg-gradient-to-br from-[#4A9A86]/20 to-[#6BB3A0]/20 rounded-xl flex items-center justify-center">
                <Sun className="w-12 h-12 text-[#4A9A86]/50" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['grateful', 'peaceful', 'hopeful'].map((emotion, i) => (
                  <motion.button
                    key={emotion}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      i === 0
                        ? 'bg-[#4A9A86] text-white'
                        : 'bg-white text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {emotion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {demoStep === 2 && (
            <motion.div
              key="flow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="shrink-0 w-32"
                  >
                    <div className="aspect-square bg-gradient-to-br from-[#4A9A86]/20 to-[#6BB3A0]/30 rounded-xl mb-2 flex items-center justify-center">
                      <Sun className="w-6 h-6 text-[#4A9A86]/40" />
                    </div>
                    <p className="text-xs text-neutral-400 text-center">
                      {i === 0 ? (locale === 'fr' ? 'Maintenant' : 'Now') : `${i}h ago`}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Play className="w-4 h-4 text-[#4A9A86]" />
                <span className="text-sm text-[#4A9A86] font-medium">
                  {locale === 'fr' ? 'Voir le flow' : 'View flow'}
                </span>
              </div>
            </motion.div>
          )}

          {demoStep === 3 && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 py-4"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-[#4A9A86] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm text-neutral-700">
                    {locale === 'fr'
                      ? "J'ai remarqué que vous capturez souvent des moments de gratitude le matin. Qu'est-ce qui vous inspire ces jours-ci?"
                      : "I noticed you often capture gratitude moments in the morning. What's been inspiring you lately?"}
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2 justify-end"
              >
                <div className="bg-[#4A9A86] rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                  <p className="text-sm text-white">
                    {locale === 'fr'
                      ? "Le lever du soleil sur ma terrasse..."
                      : "The sunrise from my balcony..."}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Rituals Demo Component
function RitualsDemo({ demoStep, locale }: { demoStep: number; locale: 'en' | 'fr' }) {
  const rituals = [
    { name: locale === 'fr' ? 'Gratitude matinale' : 'Morning gratitude', time: '7:00 AM', done: true },
    { name: locale === 'fr' ? 'Méditation' : 'Meditation', time: '7:30 AM', done: demoStep >= 1 },
    { name: locale === 'fr' ? 'Journaling' : 'Journaling', time: '8:00 PM', done: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">
            {locale === 'fr' ? 'Mes Rituels' : 'My Rituals'}
          </h4>
          <p className="text-sm text-neutral-500">
            {locale === 'fr' ? 'Aujourd\'hui' : 'Today'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-light text-[#4A9A86]">2/3</p>
          <p className="text-xs text-neutral-400">{locale === 'fr' ? 'complétés' : 'completed'}</p>
        </div>
      </div>

      <div className="space-y-3">
        {rituals.map((ritual, i) => (
          <motion.div
            key={ritual.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-4 p-4 rounded-xl ${
              ritual.done ? 'bg-[#4A9A86]/5' : 'bg-neutral-50'
            }`}
          >
            <motion.div
              animate={ritual.done ? { scale: [1, 1.2, 1] } : {}}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ritual.done ? 'bg-[#4A9A86]' : 'bg-white border-2 border-neutral-200'
              }`}
            >
              {ritual.done && <Check className="w-5 h-5 text-white" />}
            </motion.div>
            <div className="flex-1">
              <p className={`font-medium ${ritual.done ? 'text-neutral-900' : 'text-neutral-600'}`}>
                {ritual.name}
              </p>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ritual.time}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-[#4A9A86]/10 to-transparent rounded-xl"
      >
        <div className="flex items-center gap-2 text-sm text-[#4A9A86]">
          <TrendingUp className="w-4 h-4" />
          <span>{locale === 'fr' ? '7 jours de suite!' : '7 day streak!'}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Balance Demo Component
function BalanceDemo({ demoStep, locale }: { demoStep: number; locale: 'en' | 'fr' }) {
  const metrics = [
    { label: locale === 'fr' ? 'Humeur' : 'Mood', value: 8, color: '#4A9A86' },
    { label: locale === 'fr' ? 'Énergie' : 'Energy', value: 7, color: '#6BB3A0' },
    { label: locale === 'fr' ? 'Sommeil' : 'Sleep', value: 6, color: '#8DCBB8' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">
            {locale === 'fr' ? 'Mon Équilibre' : 'My Balance'}
          </h4>
          <p className="text-sm text-neutral-500">
            {locale === 'fr' ? 'Cette semaine' : 'This week'}
          </p>
        </div>
        <Smile className="w-8 h-8 text-[#4A9A86]" />
      </div>

      <div className="space-y-4 mb-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-600">{metric.label}</span>
              <span className="text-sm font-medium" style={{ color: metric.color }}>{metric.value}/10</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value * 10}%` }}
                transition={{ duration: 1, delay: i * 0.15 }}
                className="h-full rounded-full"
                style={{ backgroundColor: metric.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-neutral-50 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4A9A86]/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#4A9A86]" />
          </div>
          <div>
            <p className="text-sm text-neutral-700">
              {locale === 'fr'
                ? "Votre énergie est plus haute les jours où vous faites votre rituel du matin."
                : "Your energy is higher on days when you complete your morning ritual."}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Members Demo Component
function MembersDemo({ demoStep, locale }: { demoStep: number; locale: 'en' | 'fr' }) {
  const members = [
    { name: 'Sarah L.', initials: 'SL', status: 'active', lastSession: locale === 'fr' ? 'Hier' : 'Yesterday' },
    { name: 'Marc D.', initials: 'MD', status: 'active', lastSession: locale === 'fr' ? 'Il y a 3 jours' : '3 days ago' },
    { name: 'Julie T.', initials: 'JT', status: 'pending', lastSession: locale === 'fr' ? 'Prochaine: Demain' : 'Next: Tomorrow' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">
            {locale === 'fr' ? 'Mes Clients' : 'My Members'}
          </h4>
          <p className="text-sm text-neutral-500">
            {locale === 'fr' ? '12 actifs' : '12 active'}
          </p>
        </div>
        <Users className="w-8 h-8 text-[#D4856A]" />
      </div>

      <div className="space-y-3">
        {members.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-sm font-medium">
              {member.initials}
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{member.name}</p>
              <p className="text-xs text-neutral-400">{member.lastSession}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              member.status === 'active' ? 'bg-green-400' : 'bg-amber-400'
            }`} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Journeys Demo Component
function JourneysDemo({ demoStep, locale }: { demoStep: number; locale: 'en' | 'fr' }) {
  const stages = [
    { name: locale === 'fr' ? 'Découverte' : 'Discovery', icon: '🌱', completed: true },
    { name: locale === 'fr' ? 'Construction' : 'Building', icon: '🏗️', completed: true },
    { name: locale === 'fr' ? 'Épanouissement' : 'Thriving', icon: '🌸', completed: false, current: true },
    { name: locale === 'fr' ? 'Autonomie' : 'Independent', icon: '🦋', completed: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">Sarah L.</h4>
          <p className="text-sm text-neutral-500">
            {locale === 'fr' ? 'Parcours thérapeutique' : 'Therapy journey'}
          </p>
        </div>
        <Target className="w-8 h-8 text-[#D4856A]" />
      </div>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-neutral-200" />
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '50%' }}
          transition={{ duration: 1 }}
          className="absolute left-5 top-5 w-0.5 bg-[#D4856A]"
        />

        <div className="space-y-4">
          {stages.map((stage, i) => (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`flex items-center gap-4 pl-0 ${stage.current ? 'py-2' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                stage.completed
                  ? 'bg-[#D4856A]'
                  : stage.current
                    ? 'bg-white border-2 border-[#D4856A]'
                    : 'bg-neutral-200'
              }`}>
                {stage.completed ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-lg">{stage.icon}</span>
                )}
              </div>
              <div>
                <p className={`font-medium ${stage.current ? 'text-[#D4856A]' : stage.completed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {stage.name}
                </p>
                {stage.current && (
                  <p className="text-xs text-neutral-400">{locale === 'fr' ? 'En cours' : 'In progress'}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Resources Demo Component
function ResourcesDemo({ demoStep, locale }: { demoStep: number; locale: 'en' | 'fr' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">
            {locale === 'fr' ? 'Bibliothèque' : 'Library'}
          </h4>
          <p className="text-sm text-neutral-500">
            {locale === 'fr' ? '24 ressources' : '24 resources'}
          </p>
        </div>
        <BookOpen className="w-8 h-8 text-[#D4856A]" />
      </div>

      <div className="space-y-3 mb-6">
        {[
          { title: locale === 'fr' ? 'Exercice de respiration' : 'Breathing exercise', type: 'PDF', shared: true },
          { title: locale === 'fr' ? 'Journal de gratitude' : 'Gratitude journal', type: 'Template', shared: false },
        ].map((resource, i) => (
          <motion.div
            key={resource.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50"
          >
            <div className="w-10 h-10 rounded-lg bg-[#D4856A]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#D4856A]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900 text-sm">{resource.title}</p>
              <p className="text-xs text-neutral-400">{resource.type}</p>
            </div>
            <button className={`p-2 rounded-lg transition-colors ${
              resource.shared ? 'bg-[#D4856A]/10 text-[#D4856A]' : 'bg-neutral-100 text-neutral-400 hover:bg-[#D4856A]/10 hover:text-[#D4856A]'
            }`}>
              <Share2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-[#D4856A]/10 to-transparent rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center text-white text-xs font-medium">
            SL
          </div>
          <div className="flex-1">
            <p className="text-sm text-neutral-700">
              {locale === 'fr'
                ? 'Partagé avec Sarah L.'
                : 'Shared with Sarah L.'}
            </p>
            <p className="text-xs text-neutral-400">{locale === 'fr' ? 'Il y a 2 min' : '2 min ago'}</p>
          </div>
          <Check className="w-5 h-5 text-[#D4856A]" />
        </div>
      </motion.div>
    </motion.div>
  )
}
