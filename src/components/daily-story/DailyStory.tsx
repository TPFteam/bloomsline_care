'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Leaf, Heart, Sun, Moon, Sparkles, Mic, Play, Pause, PenLine, Video } from 'lucide-react'
import Image from 'next/image'

type MomentType = 'photo' | 'video' | 'voice' | 'write'

interface Moment {
  id: string
  type: MomentType
  media_url?: string | null
  text_content?: string | null
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
            <MomentSlide
              moment={currentSlide.data as Moment}
              locale={locale}
              onPause={() => setIsPaused(true)}
              onResume={() => setIsPaused(false)}
            />
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

// Moment Slide - handles photo, video, voice, and text
function MomentSlide({ moment, locale, onPause, onResume }: { moment: Moment; locale: string; onPause: () => void; onResume: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const time = new Date(moment.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const getTypeIcon = () => {
    switch (moment.type) {
      case 'photo': return <Camera className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'voice': return <Mic className="w-4 h-4" />
      case 'write': return <PenLine className="w-4 h-4" />
      default: return <Camera className="w-4 h-4" />
    }
  }

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (moment.type === 'voice' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        onResume()
      } else {
        audioRef.current.play()
        onPause()
      }
      setIsPlaying(!isPlaying)
    } else if (moment.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        onResume()
      } else {
        videoRef.current.play()
        onPause()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Photo slide
  if (moment.type === 'photo' && moment.media_url) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={moment.media_url}
          alt={moment.caption || 'Moment'}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-white/70 text-sm mb-2"
          >
            {getTypeIcon()}
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

  // Video slide
  if (moment.type === 'video' && moment.media_url) {
    return (
      <div className="relative w-full h-full bg-black">
        <video
          ref={videoRef}
          src={moment.media_url}
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
          onEnded={() => { setIsPlaying(false); onResume() }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" fill="white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          )}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-white/70 text-sm mb-2"
          >
            {getTypeIcon()}
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

  // Voice slide
  if (moment.type === 'voice' && moment.media_url) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex flex-col items-center justify-center">
        <audio
          ref={audioRef}
          src={moment.media_url}
          onEnded={() => { setIsPlaying(false); onResume() }}
        />

        {/* Animated waves */}
        <div className="relative mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={isPlaying ? {
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute inset-0 w-24 h-24 border-2 border-white/30 rounded-full"
              style={{ transform: `scale(${1 + i * 0.3})` }}
            />
          ))}
          <button
            onClick={handlePlayPause}
            className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" fill="white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            )}
          </button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/70 text-sm mb-2"
        >
          {locale === 'fr' ? 'Note vocale' : 'Voice note'}
        </motion.p>

        <div className="absolute bottom-0 left-0 right-0 p-6 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-white/70 text-sm mb-2"
          >
            {getTypeIcon()}
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

  // Text/Write slide
  if (moment.type === 'write') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <PenLine className="w-8 h-8 text-white" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white text-2xl font-medium leading-relaxed"
          >
            "{moment.text_content || moment.caption}"
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center justify-center gap-2 text-white/70 text-sm"
          >
            {getTypeIcon()}
            <span>{time}</span>
          </motion.div>
        </div>
      </div>
    )
  }

  // Fallback for unknown types
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <p className="text-white/50">{locale === 'fr' ? 'Moment' : 'Moment'}</p>
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
