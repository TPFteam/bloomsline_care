'use client'

import { motion } from 'framer-motion'
import { Play, Moon, Sparkles } from 'lucide-react'

interface DailyStoryCardProps {
  momentsCount: number
  seedsCount: number
  ritualsCount?: number
  locale: string
  onClick: () => void
}

export function DailyStoryCard({ momentsCount, seedsCount, ritualsCount = 0, locale, onClick }: DailyStoryCardProps) {
  const hasContent = momentsCount > 0 || seedsCount > 0 || ritualsCount > 0

  if (!hasContent) return null

  // Build stats text
  const stats: string[] = []
  if (momentsCount > 0) {
    stats.push(locale === 'fr'
      ? `${momentsCount} moment${momentsCount !== 1 ? 's' : ''}`
      : `${momentsCount} moment${momentsCount !== 1 ? 's' : ''}`
    )
  }
  if (ritualsCount > 0) {
    stats.push(locale === 'fr'
      ? `${ritualsCount} rituel${ritualsCount !== 1 ? 's' : ''}`
      : `${ritualsCount} ritual${ritualsCount !== 1 ? 's' : ''}`
    )
  }
  if (seedsCount > 0) {
    stats.push(locale === 'fr'
      ? `${seedsCount} graine${seedsCount !== 1 ? 's' : ''}`
      : `${seedsCount} seed${seedsCount !== 1 ? 's' : ''}`
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-left shadow-lg"
    >
      {/* Animated background circles */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/20 rounded-full blur-2xl"
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated ring */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-full border-2 border-dashed border-white/40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Moon className="w-5 h-5 text-white" />
              </div>
            </div>
            {/* Sparkle indicator */}
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-base">
              {locale === 'fr' ? 'Votre journée' : 'Your Day'}
            </h3>
            <p className="text-white/70 text-sm">
              {stats.join(' • ')}
            </p>
          </div>
        </div>

        {/* Play button */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Play className="w-5 h-5 text-purple-600 ml-0.5" fill="currentColor" />
        </motion.div>
      </div>

      {/* Bottom text */}
      <p className="relative z-10 mt-3 text-white/60 text-xs">
        {locale === 'fr' ? 'Appuyez pour voir votre histoire' : 'Tap to watch your story'}
      </p>
    </motion.button>
  )
}
