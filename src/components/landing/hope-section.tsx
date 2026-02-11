'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { RotateCcw, Ban, Download, Frown, Sun, TrendingDown, TrendingUp, RefreshCw, User, Infinity as InfinityIcon } from 'lucide-react'

export function HopeSection() {
  const { locale } = useLanguage()
  const [selectedPattern, setSelectedPattern] = useState<number | null>(null)
  const [activeStage, setActiveStage] = useState(0)

  const stages = [
    {
      icon: Sun,
      phase: { en: 'Hope', fr: 'Espoir', es: 'Esperanza' },
      message: {
        en: "This time will be different.",
        fr: "Cette fois sera différent.",
        es: "Esta vez será diferente.",
      },
    },
    {
      icon: TrendingUp,
      phase: { en: 'Progress', fr: 'Progrès', es: 'Progreso' },
      message: {
        en: "Day 5, I've got this!",
        fr: "Jour 5, j'y arrive !",
        es: "Día 5, ¡puedo con esto!",
      },
    },
    {
      icon: TrendingDown,
      phase: { en: 'Fall', fr: 'Chute', es: 'Caída' },
      message: {
        en: "I slipped up again...",
        fr: "J'ai encore échoué...",
        es: "Volví a fallar...",
      },
    },
    {
      icon: Frown,
      phase: { en: 'Doubt', fr: 'Doute', es: 'Duda' },
      message: {
        en: "Why can't I stick to anything?",
        fr: "Pourquoi je n'arrive à rien tenir ?",
        es: "¿Por qué no puedo mantener nada?",
      },
    },
    {
      icon: RefreshCw,
      phase: { en: 'Restart', fr: 'Recommencer', es: 'Reiniciar' },
      message: {
        en: "I'll start fresh on Monday.",
        fr: "Je recommence lundi.",
        es: "Empezaré de nuevo el lunes.",
      },
    },
  ]

  // Sync with animation - each stage lasts 2 seconds (10s total / 5 stages)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 5)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const patterns = [
    {
      icon: Frown,
      text: { en: 'Feel guilty', fr: 'Je me sens coupable', es: 'Me siento culpable' },
      response: {
        en: "That guilt? It means you care. You deserve support, not shame.",
        fr: "Cette culpabilité ? Elle montre que vous tenez à vous. Vous méritez du soutien, pas de la honte.",
        es: "¿Esa culpa? Significa que te importa. Mereces apoyo, no vergüenza.",
      },
    },
    {
      icon: RotateCcw,
      text: { en: 'Try again tomorrow', fr: 'Je reporte au lendemain', es: 'Lo intento mañana' },
      response: {
        en: "You've been trying. That takes strength. What if tomorrow had a little more support?",
        fr: "Vous avez essayé. Ça demande de la force. Et si demain avait un peu plus de soutien ?",
        es: "Lo has intentado. Eso requiere fuerza. ¿Y si mañana tuvieras un poco más de apoyo?",
      },
    },
    {
      icon: Download,
      text: { en: 'Download another app', fr: 'Je télécharge une app', es: 'Descargo otra app' },
      response: {
        en: "The 10th app won't be different. You don't need another app. You need something that actually understands.",
        fr: "La 10ème app ne sera pas différente. Vous n'avez pas besoin d'une autre app. Vous avez besoin de quelque chose qui comprend vraiment.",
        es: "La décima app no será diferente. No necesitas otra app. Necesitas algo que realmente te entienda.",
      },
    },
    {
      icon: Ban,
      text: { en: 'Give up', fr: "J'abandonne", es: 'Me rindo' },
      response: {
        en: "You haven't given up. You're here, still looking. That takes courage.",
        fr: "Vous n'avez pas abandonné. Vous êtes là, encore à chercher. Ça demande du courage.",
        es: "No te has rendido. Estás aquí, todavía buscando. Eso requiere valentía.",
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
            className="flex flex-col items-center justify-center pb-28 lg:pb-0"
          >
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              {/* Main circle track */}
              <div className="absolute inset-4 border-2 border-dashed border-neutral-200 rounded-full" />

              {/* Stage icons around the circle - pentagon layout for 5 stages */}
              {/* Top - Hope (0°) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 0 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <Sun className="w-5 h-5" />
                </div>
              </div>

              {/* Top-right - Progress (72°) */}
              <div className="absolute top-[19%] right-[5%]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 1 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom-right - Fall (144°) */}
              <div className="absolute bottom-[12%] right-[12%]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 2 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom-left - Doubt (216°) */}
              <div className="absolute bottom-[12%] left-[12%]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 3 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <Frown className="w-5 h-5" />
                </div>
              </div>

              {/* Top-left - Restart (288°) */}
              <div className="absolute top-[19%] left-[5%]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  activeStage === 4 ? 'bg-neutral-900 text-white scale-110' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>

              {/* Center - infinity icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <InfinityIcon className="w-6 h-6 text-neutral-300" />
              </div>

              {/* Chat bubble with current message and phase label */}
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-72">
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
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                        {locale === 'fr' ? stages[activeStage].phase.fr : locale === 'es' ? stages[activeStage].phase.es : stages[activeStage].phase.en}
                      </p>
                      <p className="text-sm text-neutral-700">
                        {locale === 'fr' ? stages[activeStage].message.fr : locale === 'es' ? stages[activeStage].message.es : stages[activeStage].message.en}
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
              {locale === 'fr' ? "Que faites-vous quand vous n'avez plus l'énergie d'avancer ?" : locale === 'es' ? '¿Qué sueles hacer cuando pierdes el impulso?' : 'What do you usually do when you lose momentum?'}
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
                    {locale === 'fr' ? pattern.text.fr : locale === 'es' ? pattern.text.es : pattern.text.en}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Response Message - From Bloom */}
            <AnimatePresence mode="wait">
              {selectedPattern !== null && (
                <motion.div
                  key={selectedPattern}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 pt-2">
                    {/* Bloom avatar */}
                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-medium">B</span>
                    </div>
                    {/* Message bubble */}
                    <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {locale === 'fr'
                          ? patterns[selectedPattern].response.fr
                          : locale === 'es'
                          ? patterns[selectedPattern].response.es
                          : patterns[selectedPattern].response.en}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
