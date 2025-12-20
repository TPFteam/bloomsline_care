'use client'

import { motion } from 'framer-motion'
import { MOOD_PLANT_MAP, type MoodType } from '@/types/bloom'
import type { Moment } from '@/lib/services/moments'

interface GardenPlantProps {
  moment: Moment
  index: number
  onClick?: () => void
  isSelected?: boolean
}

// Get the primary mood from the moment (first mood in array)
function getPrimaryMood(moods: string[]): MoodType {
  const validMoods = Object.keys(MOOD_PLANT_MAP)
  const primaryMood = moods.find((m) => validMoods.includes(m))
  return (primaryMood as MoodType) || 'peaceful'
}

// Calculate plant size based on content length or engagement
function getPlantSize(moment: Moment): 'sm' | 'md' | 'lg' {
  const contentLength = (moment.text_content?.length || 0) + (moment.caption?.length || 0)
  if (contentLength > 200) return 'lg'
  if (contentLength > 50) return 'md'
  return 'sm'
}

const sizeDimensions = {
  sm: { height: 60, width: 40, flowerSize: 24, stemHeight: 36 },
  md: { height: 80, width: 50, flowerSize: 32, stemHeight: 48 },
  lg: { height: 100, width: 60, flowerSize: 40, stemHeight: 60 },
}

export default function GardenPlant({
  moment,
  index,
  onClick,
  isSelected = false,
}: GardenPlantProps) {
  const primaryMood = getPrimaryMood(moment.moods)
  const plantConfig = MOOD_PLANT_MAP[primaryMood]
  const size = getPlantSize(moment)
  const dims = sizeDimensions[size]

  // Stagger delay based on index
  const delay = index * 0.1

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay,
      }}
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative focus:outline-none"
      style={{ width: dims.width, height: dims.height }}
    >
      {/* Glow when selected */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${plantConfig.flower} blur-xl opacity-40`}
        />
      )}

      {/* Stem */}
      <motion.div
        animate={{
          rotate: [-1, 1, -1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.2,
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
        style={{ height: dims.stemHeight }}
      >
        {/* Main stem */}
        <div
          className={`w-1.5 h-full rounded-full bg-gradient-to-t ${plantConfig.stem}`}
          style={{ marginLeft: -3 }}
        />

        {/* Left leaf */}
        <motion.div
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
          className={`absolute left-0 bg-gradient-to-br ${plantConfig.stem} rounded-full origin-right`}
          style={{
            width: dims.flowerSize * 0.4,
            height: dims.flowerSize * 0.2,
            top: dims.stemHeight * 0.4,
            left: -dims.flowerSize * 0.35,
            transform: 'rotate(-30deg)',
          }}
        />

        {/* Right leaf */}
        <motion.div
          animate={{ rotate: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
          className={`absolute bg-gradient-to-br ${plantConfig.stem} rounded-full origin-left`}
          style={{
            width: dims.flowerSize * 0.4,
            height: dims.flowerSize * 0.2,
            top: dims.stemHeight * 0.6,
            left: 2,
            transform: 'rotate(30deg)',
          }}
        />

        {/* Flower head */}
        <motion.div
          animate={{
            y: [0, -2, 0],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.15,
          }}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: -dims.flowerSize * 0.8,
            width: dims.flowerSize,
            height: dims.flowerSize,
          }}
        >
          {/* Petals */}
          <div className="relative w-full h-full">
            {/* Outer petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <div
                key={angle}
                className={`absolute left-1/2 top-1/2 rounded-full bg-gradient-to-br ${plantConfig.flower}`}
                style={{
                  width: dims.flowerSize * 0.4,
                  height: dims.flowerSize * 0.5,
                  transformOrigin: 'center bottom',
                  transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                  opacity: 0.9,
                }}
              />
            ))}

            {/* Center */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 shadow-inner"
              style={{
                width: dims.flowerSize * 0.4,
                height: dims.flowerSize * 0.4,
              }}
            >
              {/* Center detail */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/30"
                style={{
                  width: dims.flowerSize * 0.2,
                  height: dims.flowerSize * 0.2,
                }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Sparkle effect on hover/selected */}
      {isSelected && (
        <>
          <motion.div
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-2 -left-1 text-amber-300 text-xs"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-3 right-0 text-emerald-300 text-xs"
          >
            ✨
          </motion.div>
        </>
      )}
    </motion.button>
  )
}
