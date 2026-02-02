'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface SpotlightStep {
  target: string // data-spotlight attribute value
  titleEn: string
  titleFr: string
  descriptionEn: string
  descriptionFr: string
  fallbackDescriptionEn?: string
  fallbackDescriptionFr?: string
}

const STEPS: SpotlightStep[] = [
  {
    target: 'time-indicator',
    titleEn: 'Right Now',
    titleFr: 'En ce moment',
    descriptionEn: 'This green line shows where you are in the day. Everything to the left has already happened, everything to the right is still to come.',
    descriptionFr: 'Cette ligne verte montre où vous en êtes dans la journée. Tout à gauche s\'est déjà passé, tout à droite est encore à venir.',
  },
  {
    target: 'flow-line',
    titleEn: 'The Flow Line',
    titleFr: 'La ligne de flux',
    descriptionEn: 'This line connects your moments through the day. Higher means you felt more positive, lower means you were processing.',
    descriptionFr: 'Cette ligne relie vos moments au fil de la journée. Plus haut signifie que vous vous sentiez plus positif, plus bas que vous étiez en traitement.',
    fallbackDescriptionEn: 'When you capture more than one moment, a flowing line will connect them here.',
    fallbackDescriptionFr: 'Quand vous capturerez plus d\'un moment, une ligne fluide les reliera ici.',
  },
  {
    target: 'moment-dot',
    titleEn: 'Your Moments',
    titleFr: 'Vos moments',
    descriptionEn: 'Each orb is a moment you captured — a photo, voice note, or journal entry. The color reflects your emotion. Tap any to revisit.',
    descriptionFr: 'Chaque orbe est un moment que vous avez capturé — une photo, une note vocale ou une entrée de journal. La couleur reflète votre émotion. Appuyez pour revisiter.',
    fallbackDescriptionEn: 'When you capture a moment, it will appear here as a colored orb.',
    fallbackDescriptionFr: 'Quand vous capturerez un moment, il apparaîtra ici sous forme d\'orbe coloré.',
  },
  {
    target: 'ritual-dot',
    titleEn: 'Your Rituals',
    titleFr: 'Vos rituels',
    descriptionEn: 'These smaller dots are your daily rituals. A green check means completed. Grey means still pending.',
    descriptionFr: 'Ces petits points sont vos rituels quotidiens. Un coche vert signifie complété. Gris signifie en attente.',
    fallbackDescriptionEn: 'When you add rituals, they will appear here on your timeline.',
    fallbackDescriptionFr: 'Quand vous ajouterez des rituels, ils apparaîtront ici sur votre fil.',
  },
  {
    target: 'seed-dot',
    titleEn: 'Your Little Steps',
    titleFr: 'Vos petits pas',
    descriptionEn: 'These are your seeds — small habits you\'re growing or gently letting go. They appear at the bottom of your flow.',
    descriptionFr: 'Ce sont vos graines — de petites habitudes que vous cultivez ou laissez doucement partir. Elles apparaissent en bas de votre flux.',
    fallbackDescriptionEn: 'When you log a seed, it will appear at the bottom of your flow.',
    fallbackDescriptionFr: 'Quand vous enregistrerez une graine, elle apparaîtra en bas de votre flux.',
  },
  {
    target: 'wanna-talk',
    titleEn: 'Talk to Bloom',
    titleFr: 'Parler à Bloom',
    descriptionEn: 'Whenever you need to process something, Bloom is here. Tap to start a gentle conversation.',
    descriptionFr: 'Chaque fois que vous avez besoin de parler, Bloom est là. Appuyez pour commencer une conversation douce.',
  },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

type TooltipPosition = 'above' | 'below'

interface FlowSpotlightProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  flowContainerRef: React.RefObject<HTMLDivElement | null>
}

function measureElement(target: string, flowContainerRef: React.RefObject<HTMLDivElement | null>): { rect: Rect; isFallback: boolean } | null {
  const el = document.querySelector(`[data-spotlight="${target}"]`)
  if (el) {
    const r = el.getBoundingClientRect()
    const padding = 8
    return {
      rect: {
        top: r.top - padding,
        left: r.left - padding,
        width: r.width + padding * 2,
        height: r.height + padding * 2,
      },
      isFallback: false,
    }
  }
  // Fallback: center of flow container
  if (flowContainerRef.current) {
    const containerRect = flowContainerRef.current.getBoundingClientRect()
    const size = 80
    return {
      rect: {
        top: containerRect.top + containerRect.height / 2 - size / 2,
        left: containerRect.left + containerRect.width / 2 - size / 2,
        width: size,
        height: size,
      },
      isFallback: true,
    }
  }
  return null
}

export function FlowSpotlight({ isOpen, onComplete, onSkip, flowContainerRef }: FlowSpotlightProps) {
  const { locale } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<Rect | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>('below')
  // Track if spotlight is actively showing (locked open once triggered)
  const [active, setActive] = useState(false)
  // Track if user has dismissed (completed/skipped) this session — prevents re-activation
  const dismissedRef = useRef(false)

  const step = STEPS[currentStep]

  // Track previous isOpen to detect fresh (i) button clicks
  const prevIsOpenRef = useRef(false)

  // Lock open when isOpen becomes true; only close via skip/complete
  useEffect(() => {
    // Detect a fresh open: isOpen went from false → true
    if (isOpen && !prevIsOpenRef.current) {
      dismissedRef.current = false // allow re-activation on explicit (i) click
    }
    prevIsOpenRef.current = isOpen

    if (isOpen && !active && !dismissedRef.current) {
      setActive(true)
      setCurrentStep(0)
    }
  }, [isOpen, active])

  const doMeasure = useCallback(() => {
    if (!active || !step) return
    const result = measureElement(step.target, flowContainerRef)
    if (result) {
      setHighlightRect(result.rect)
      setIsFallback(result.isFallback)
      const centerY = result.rect.top + result.rect.height / 2
      setTooltipPos(centerY < window.innerHeight / 2 ? 'below' : 'above')
    }
  }, [active, step, flowContainerRef])

  // Measure synchronously before paint when active or step changes
  useLayoutEffect(() => {
    doMeasure()
  }, [doMeasure])

  // Also re-measure on scroll/resize
  useEffect(() => {
    if (!active) return
    const handler = () => doMeasure()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [active, doMeasure])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      dismissedRef.current = true
      setActive(false)
      setHighlightRect(null)
      onComplete()
    }
  }

  const handleSkip = () => {
    dismissedRef.current = true
    setActive(false)
    setHighlightRect(null)
    onSkip()
  }

  if (!active || !highlightRect) return null

  const description = isFallback
    ? (locale === 'fr' ? (step.fallbackDescriptionFr || step.descriptionFr) : (step.fallbackDescriptionEn || step.descriptionEn))
    : (locale === 'fr' ? step.descriptionFr : step.descriptionEn)

  const title = locale === 'fr' ? step.titleFr : step.titleEn
  const isLastStep = currentStep === STEPS.length - 1

  // Tooltip positioning
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(16, Math.min(highlightRect.left, window.innerWidth - 304)),
    maxWidth: 288,
    zIndex: 52,
  }

  if (tooltipPos === 'below') {
    tooltipStyle.top = highlightRect.top + highlightRect.height + 16
  } else {
    tooltipStyle.bottom = window.innerHeight - highlightRect.top + 16
  }

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-50">
          {/* Dark overlay with spotlight cutout using box-shadow */}
          <motion.div
            key={`spotlight-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed z-50 rounded-2xl"
            style={{
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
            }}
          />

          {/* Click-blocking overlay (transparent, captures taps outside tooltip) */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 51 }}
            onClick={handleSkip}
          />

          {/* Tooltip card */}
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, y: tooltipPos === 'below' ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            style={tooltipStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 relative">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>

              {/* Step content */}
              <h4 className="text-base font-bold text-gray-900 pr-6 mb-1.5">
                {title}
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {description}
              </p>

              {/* Footer: progress dots + next button */}
              <div className="flex items-center justify-between">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? 'w-4 bg-teal-500'
                          : i < currentStep
                            ? 'w-1.5 bg-teal-300'
                            : 'w-1.5 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Next / Done button */}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-full transition-colors"
                >
                  <span>
                    {isLastStep
                      ? (locale === 'fr' ? 'Compris' : 'Got it')
                      : (locale === 'fr' ? 'Suivant' : 'Next')
                    }
                  </span>
                  {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
