'use client'

import { motion } from 'framer-motion'
import { Play, Heart } from 'lucide-react'

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
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-left shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Animated ring */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-dashed border-white/40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm">
              {locale === 'fr' ? 'Votre journée' : 'Your Day'}
            </h3>
            <p className="text-white/70 text-xs">
              {stats.join(' · ')}
            </p>
          </div>
        </div>

        {/* Play button */}
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Play className="w-4 h-4 text-purple-600 ml-0.5" fill="currentColor" />
        </div>
      </div>
    </motion.button>
  )
}
