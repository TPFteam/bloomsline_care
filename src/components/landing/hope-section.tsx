'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { RotateCcw, Ban, Download, Frown, Sparkles, TrendingDown, RefreshCw, User } from 'lucide-react'

export function HopeSection() {
  const { locale } = useLanguage()
  const [selectedPattern, setSelectedPattern] = useState<number | null>(null)
  const [activeStage, setActiveStage] = useState(0)

  const stages = [
    {
      icon: Sparkles,
      message: {
        en: "This time will be different.",
        fr: "Cette fois sera différent.",
      },
    },
    {
      icon: TrendingDown,
      message: {
        en: "I slipped up again...",
        fr: "J'ai encore échoué...",
      },
    },
    {
      icon: Frown,
      message: {
        en: "Why can't I stick to anything?",
        fr: "Pourquoi je n'arrive à rien tenir ?",
      },
    },
    {
      icon: RefreshCw,
      message: {
        en: "I'll start fresh on Monday.",
        fr: "Je recommence lundi.",
      },
    },
  ]

  // Sync with animation - each stage lasts 2.5 seconds (10s total / 4 stages)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 4)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const patterns = [
    {
      icon: Frown,
      text: { en: 'Feel guilty', fr: 'Se sentir coupable' },
      response: {
        en: "That guilt? It means you care. You deserve support, not shame.",
        fr: "Cette culpabilité ? Elle montre que vous tenez à vous. Vous méritez du soutien, pas de la honte.",
      },
    },
    {
      icon: RotateCcw,
      text: { en: 'Try again tomorrow', fr: 'Réessayer demain' },
      response: {
        en: "You've been trying. That takes strength. What if tomorrow had a little more support?",
        fr: "Vous avez essayé. Ça demande de la force. Et si demain avait un peu plus de soutien ?",
      },
    },
    {
      icon: Download,
      text: { en: 'Download another app', fr: 'Télécharger une autre app' },
      response: {
        en: "The 10th app won't be different. You don't need another app. You need something that actually understands.",
        fr: "La 10ème app ne sera pas différente. Vous n'avez pas besoin d'une autre app. Vous avez besoin de quelque chose qui comprend vraiment.",
      },
    },
    {
      icon: Ban,
      text: { en: 'Give up', fr: 'Abandonner' },
      response: {
        en: "You haven't given up. You're here, still looking. That takes courage.",
        fr: "Vous n'avez pas abandonné. Vous êtes là, encore à chercher. Ça demande du courage.",
      },
    },
  ]

  const handlePatternClick = (index: number) => {
    setSelectedPattern(selectedPattern === index ? null : index)
  }

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="container mx-auto px-6">
        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left - The Cycle Visual */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              {/* Main circle track */}
              <div className="absolute inset-4 border-2 border-dashed border-neutral-200 rounded-full" />

              {/* Stage icons around the circle - just icons, no text */}
              {/* Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 0 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Right */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 1 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 2 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <Frown className="w-5 h-5" />
                </div>
              </div>

              {/* Left */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 3 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>

              {/* Center - repeat icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-neutral-300" />
              </div>

              {/* Chat bubble with current message */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-neutral-500" />
                    </div>
                    <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                      <p className="text-sm text-neutral-700">
                        {locale === 'fr' ? stages[activeStage].message.fr : stages[activeStage].message.en}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right - Question & Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-lg sm:text-xl text-neutral-600 mb-8">
              {locale === 'fr' ? "Que faites-vous d'habitude quand vous perdez l'élan ?" : 'What do you usually do when you lose momentum?'}
            </p>

            {/* Pattern Options - Clickable - 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {patterns.map((pattern, index) => (
                <motion.button
                  key={index}
                  onClick={() => handlePatternClick(index)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full transition-all cursor-pointer ${
                    selectedPattern === index
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  <pattern.icon className="w-4 h-4" />
                  <span className="text-sm">
                    {locale === 'fr' ? pattern.text.fr : pattern.text.en}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Response Message - From Bloom */}
            <div className="h-24 flex items-start">
              <AnimatePresence mode="wait">
                {selectedPattern !== null && (
                  <motion.div
                    key={selectedPattern}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    {/* Bloom avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white text-xs font-semibold">B</span>
                    </div>
                    {/* Message bubble */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {locale === 'fr'
                          ? patterns[selectedPattern].response.fr
                          : patterns[selectedPattern].response.en}
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-1.5 font-medium">
                        Bloom
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* The Hope - Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-24"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-8 sm:w-12 bg-neutral-300" />
            <span className="text-sm text-neutral-400 uppercase tracking-wider">
              {locale === 'fr' ? 'ou' : 'or'}
            </span>
            <div className="h-px w-8 sm:w-12 bg-neutral-300" />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900"
          >
            {locale === 'fr' ? 'Il y a une meilleure façon.' : "There's a better way."}
          </motion.h2>
        </motion.div>
      </div>
    </section>
  )
}
