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
  descriptionEn: string
  descriptionFr: string
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
        colors: ['#a855f7', '#f59e0b', '#10b981', '#ec4899', '#3b82f6']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#a855f7', '#f59e0b', '#10b981', '#ec4899', '#3b82f6']
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
              className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 opacity-30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -20, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 opacity-20 rounded-full blur-3xl"
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
              <div className="px-8 pt-10 pb-8">
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
                        className="mb-6"
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
                          className={`absolute inset-0 bg-gradient-to-br ${step.gradient || 'from-amber-400 to-orange-500'} rounded-3xl blur-xl`}
                        />
                        {/* Icon box */}
                        <div className={`relative w-full h-full bg-gradient-to-br ${step.gradient || 'from-amber-400 to-orange-500'} rounded-3xl flex items-center justify-center shadow-lg`}>
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
                          className="absolute -top-2 -right-2 text-amber-400"
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
                      className="text-2xl font-bold text-gray-900 mb-4"
                    >
                      {locale === 'fr' ? step.titleFr : step.titleEn}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-600 leading-relaxed text-base"
                    >
                      {locale === 'fr' ? step.descriptionFr : step.descriptionEn}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex justify-center gap-2.5 mt-10 mb-8">
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
                            ? '#f59e0b'
                            : index < currentStep
                              ? '#fbbf24'
                              : '#e5e7eb'
                        }}
                        className="h-2.5 rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={handlePrev}
                      className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      {locale === 'fr' ? 'Retour' : 'Back'}
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isLastStep ? (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {locale === 'fr' ? "C'est parti !" : "Let's Go!"}
                      </>
                    ) : (
                      <>
                        {locale === 'fr' ? 'Suivant' : 'Next'}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Step counter */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-gray-400 text-sm mt-6"
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
