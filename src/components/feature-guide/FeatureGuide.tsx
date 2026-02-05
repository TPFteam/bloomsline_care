'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import confetti from 'canvas-confetti'

export interface GuideStep {
  icon?: React.ReactNode
  animation?: React.ReactNode // Custom animated illustration
  titleEn: string
  titleFr: string
  titleEs?: string // Optional, falls back to English
  descriptionEn: string
  descriptionFr: string
  descriptionEs?: string // Optional, falls back to English
  gradient?: string // Custom gradient for icon background
}

interface FeatureGuideProps {
  featureName: string
  steps: GuideStep[]
  onComplete: () => void
  onSkip?: () => void
}

export function FeatureGuide({
  steps,
  onComplete,
  onSkip,
}: FeatureGuideProps) {
  const { locale } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [direction, setDirection] = useState(1) // 1 for next, -1 for prev

  const isLastStep = currentStep === steps.length - 1
  const step = steps[currentStep]

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    // Trigger confetti celebration
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#4A9A86', '#5AB39C', '#6BB3A0', '#D4856A', '#E8A87C']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#4A9A86', '#5AB39C', '#6BB3A0', '#D4856A', '#E8A87C']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()

    setIsExiting(true)
    setTimeout(() => {
      onComplete()
    }, 600)
  }

  const handleSkip = () => {
    setIsExiting(true)
    setTimeout(() => {
      onSkip?.()
    }, 300)
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95
    })
  }

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Floating orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#D4856A] via-[#E8A87C] to-[#f5d6c6] opacity-30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -20, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-[#4A9A86] via-[#5AB39C] to-[#6BB3A0] opacity-20 rounded-full blur-3xl"
            />
          </div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden"
          >
            {/* Solid card */}
            <div className="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden">
              {/* Skip button */}
              {onSkip && !isLastStep && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleSkip}
                  className="absolute top-5 right-5 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}

              {/* Content */}
              <div className="px-5 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="text-center"
                  >
                    {/* Animation or Icon */}
                    {step.animation ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="mb-4 sm:mb-6 scale-90 sm:scale-100 origin-center"
                      >
                        {step.animation}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                        className="relative mx-auto mb-8 w-24 h-24"
                      >
                        {/* Glow effect */}
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`absolute inset-0 bg-gradient-to-br ${step.gradient || 'from-[#4A9A86] to-[#5AB39C]'} rounded-3xl blur-xl`}
                        />
                        {/* Icon box */}
                        <div className={`relative w-full h-full bg-gradient-to-br ${step.gradient || 'from-[#4A9A86] to-[#5AB39C]'} rounded-3xl flex items-center justify-center shadow-lg`}>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                            className="text-white"
                          >
                            {step.icon}
                          </motion.div>
                        </div>
                        {/* Sparkle decorations */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                          className="absolute -top-2 -right-2 text-[#4A9A86]"
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4"
                    >
                      {locale === 'fr' ? step.titleFr : locale === 'es' ? (step.titleEs || step.titleEn) : step.titleEn}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-600 leading-relaxed text-sm sm:text-base"
                    >
                      {locale === 'fr' ? step.descriptionFr : locale === 'es' ? (step.descriptionEs || step.descriptionEn) : step.descriptionEn}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 sm:gap-2.5 mt-6 sm:mt-10 mb-5 sm:mb-8">
                  {steps.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setDirection(index > currentStep ? 1 : -1)
                        setCurrentStep(index)
                      }}
                      className="relative"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          width: index === currentStep ? 28 : 10,
                          backgroundColor: index === currentStep
                            ? '#4A9A86'
                            : index < currentStep
                              ? '#5AB39C'
                              : '#e5e7eb'
                        }}
                        className="h-2.5 rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-2 sm:gap-3">
                  {currentStep > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={handlePrev}
                      className="flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      {locale === 'fr' ? 'Retour' : locale === 'es' ? 'Atrás' : 'Back'}
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#4A9A86] to-[#5AB39C] hover:from-[#3d8a76] hover:to-[#4da38c] text-white font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-sm sm:text-base"
                  >
                    {isLastStep ? (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        {locale === 'fr' ? "C'est parti !" : locale === 'es' ? '¡Vamos!' : "Let's Go!"}
                      </>
                    ) : (
                      <>
                        {locale === 'fr' ? 'Suivant' : locale === 'es' ? 'Siguiente' : 'Next'}
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Step counter */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-gray-400 text-xs sm:text-sm mt-4 sm:mt-6"
                >
                  {currentStep + 1} / {steps.length}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
