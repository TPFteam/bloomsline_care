'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Camera, Leaf, Heart, Sun, Moon, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface Moment {
  id: string
  image_url: string
  caption?: string
  created_at: string
}

interface SeedLog {
  id: string
  anchor: {
    icon: string
    labelEn: string
    labelFr: string
    type: 'grow' | 'letgo'
  }
  logged_at: string
}

interface StorySlide {
  type: 'intro' | 'moment' | 'seeds-summary' | 'outro'
  data?: Moment | SeedLog[] | null
}

interface DailyStoryProps {
  moments: Moment[]
  seedLogs: SeedLog[]
  locale: string
  onClose: () => void
}

export function DailyStory({ moments, seedLogs, locale, onClose }: DailyStoryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Build slides array
  const slides: StorySlide[] = [
    { type: 'intro' },
    ...moments.map(m => ({ type: 'moment' as const, data: m })),
    ...(seedLogs.length > 0 ? [{ type: 'seeds-summary' as const, data: seedLogs }] : []),
    { type: 'outro' },
  ]

  const totalSlides = slides.length
  const slideDuration = 5000 // 5 seconds per slide

  // Auto-advance logic
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next slide
          if (currentIndex < totalSlides - 1) {
            setCurrentIndex(i => i + 1)
            return 0
          } else {
            // End of story
            onClose()
            return 100
          }
        }
        return prev + (100 / (slideDuration / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [currentIndex, totalSlides, isPaused, onClose])

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0)
  }, [currentIndex])

  const goToNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex(i => i + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }, [currentIndex, totalSlides, onClose])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setProgress(0)
    }
  }, [currentIndex])

  // Handle tap zones
  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width / 3) {
      goToPrev()
    } else {
      goToNext()
    }
  }

  const currentSlide = slides[currentIndex]

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (locale === 'fr') {
      if (hour < 18) return 'Votre journée'
      return 'Bonsoir'
    }
    if (hour < 18) return 'Your Day'
    return 'Good evening'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black"
      onClick={handleTap}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-3 pt-safe">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-12 right-4 z-50 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {currentSlide.type === 'intro' && (
            <IntroSlide locale={locale} greeting={getGreeting()} momentsCount={moments.length} seedsCount={seedLogs.length} />
          )}

          {currentSlide.type === 'moment' && currentSlide.data && (
            <MomentSlide moment={currentSlide.data as Moment} locale={locale} />
          )}

          {currentSlide.type === 'seeds-summary' && currentSlide.data && (
            <SeedsSummarySlide seeds={currentSlide.data as SeedLog[]} locale={locale} />
          )}

          {currentSlide.type === 'outro' && (
            <OutroSlide locale={locale} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation hints */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 text-white/50 text-xs">
        <span>{locale === 'fr' ? 'Appuyez pour avancer' : 'Tap to continue'}</span>
      </div>
    </motion.div>
  )
}

// Intro Slide
function IntroSlide({ locale, greeting, momentsCount, seedsCount }: { locale: string; greeting: string; momentsCount: number; seedsCount: number }) {
  const hour = new Date().getHours()
  const Icon = hour >= 18 ? Moon : Sun

  return (
    <div className="flex flex-col items-center justify-center text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full flex items-center justify-center mb-6"
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-white mb-2"
      >
        {greeting}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-white/70 text-lg"
      >
        {locale === 'fr'
          ? `${momentsCount} moment${momentsCount !== 1 ? 's' : ''} • ${seedsCount} graine${seedsCount !== 1 ? 's' : ''}`
          : `${momentsCount} moment${momentsCount !== 1 ? 's' : ''} • ${seedsCount} seed${seedsCount !== 1 ? 's' : ''}`
        }
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex items-center gap-2 text-white/50 text-sm"
      >
        <Sparkles className="w-4 h-4" />
        <span>{locale === 'fr' ? 'Votre histoire du jour' : "Here's your day"}</span>
      </motion.div>
    </div>
  )
}

// Moment Slide
function MomentSlide({ moment, locale }: { moment: Moment; locale: string }) {
  const time = new Date(moment.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="relative w-full h-full">
      {/* Background image */}
      <Image
        src={moment.image_url}
        alt={moment.caption || 'Moment'}
        fill
        className="object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-white/70 text-sm mb-2"
        >
          <Camera className="w-4 h-4" />
          <span>{time}</span>
        </motion.div>

        {moment.caption && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white text-xl font-medium"
          >
            {moment.caption}
          </motion.p>
        )}
      </div>
    </div>
  )
}

// Seeds Summary Slide
function SeedsSummarySlide({ seeds, locale }: { seeds: SeedLog[]; locale: string }) {
  const growSeeds = seeds.filter(s => s.anchor.type === 'grow')
  const letGoSeeds = seeds.filter(s => s.anchor.type === 'letgo')

  return (
    <div className="flex flex-col items-center justify-center text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mb-6"
      >
        <Leaf className="w-8 h-8 text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-white mb-6"
      >
        {locale === 'fr' ? 'Vos petits pas' : 'Your Little Steps'}
      </motion.h2>

      <div className="space-y-4 w-full max-w-xs">
        {growSeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#4A9A86]/20 rounded-2xl p-4"
          >
            <p className="text-[#5AB39C] text-sm font-medium mb-2">
              {locale === 'fr' ? 'Garder' : 'Keep'} ({growSeeds.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {growSeeds.slice(0, 5).map((seed, i) => (
                <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-white text-sm">
                  {locale === 'fr' ? seed.anchor.labelFr : seed.anchor.labelEn}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {letGoSeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#D4856A]/20 rounded-2xl p-4"
          >
            <p className="text-[#E8A87C] text-sm font-medium mb-2">
              {locale === 'fr' ? 'Alléger' : 'Lighten'} ({letGoSeeds.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {letGoSeeds.slice(0, 5).map((seed, i) => (
                <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-white text-sm">
                  {locale === 'fr' ? seed.anchor.labelFr : seed.anchor.labelEn}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Outro Slide
function OutroSlide({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8">
      {/* Bloomsline Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="relative w-24 h-24 flex items-center justify-center mb-6"
      >
        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
          <motion.div
            key={i}
            className="absolute w-6 h-10 bg-gradient-to-t from-[#D4856A] to-[#E8A87C] rounded-full origin-bottom"
            style={{
              transform: `rotate(${rotation}deg) translateY(-35%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.9 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          />
        ))}
        {/* Center */}
        <motion.div
          className="absolute w-10 h-10 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-2xl font-bold text-white mb-2"
      >
        {locale === 'fr' ? 'Bien joué !' : 'Well done!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-white/70"
      >
        {locale === 'fr'
          ? 'Chaque petit pas compte.'
          : 'Every small step matters.'
        }
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 flex items-center gap-2 text-white/50 text-sm"
      >
        <Heart className="w-4 h-4" fill="currentColor" />
        <span>{locale === 'fr' ? 'À demain' : 'See you tomorrow'}</span>
      </motion.div>
    </div>
  )
}
