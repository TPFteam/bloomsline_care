'use client'

import { motion, type TargetAndTransition } from 'framer-motion'
import type { BloomState } from '@/types/bloom'

interface BloomCharacterProps {
  state?: BloomState
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showSpeechBubble?: boolean
  speechText?: string
}

const sizeConfig = {
  sm: { container: 'w-14 h-14', inner: 'w-10 h-10', eyes: 'w-1.5 h-1.5', sparkle: 'w-6 h-6' },
  md: { container: 'w-20 h-20', inner: 'w-14 h-14', eyes: 'w-2 h-2', sparkle: 'w-8 h-8' },
  lg: { container: 'w-28 h-28', inner: 'w-20 h-20', eyes: 'w-2.5 h-2.5', sparkle: 'w-10 h-10' },
}

const stateAnimations: Record<BloomState, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  listening: {
    scale: [1, 1.05, 1],
    transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
  },
  thinking: {
    rotate: [0, 5, -5, 0],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  },
  speaking: {
    scale: [1, 1.03, 1],
    y: [0, -2, 0],
    transition: { duration: 0.3, repeat: Infinity, ease: 'easeInOut' },
  },
  happy: {
    scale: [1, 1.1, 1],
    y: [0, -8, 0],
    transition: { duration: 0.5, repeat: Infinity, ease: 'easeOut' },
  },
  concerned: {
    y: [0, -2, 0],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

const glowColors: Record<BloomState, string> = {
  idle: 'shadow-emerald-300/40',
  listening: 'shadow-sky-300/50',
  thinking: 'shadow-violet-300/50',
  speaking: 'shadow-emerald-400/60',
  happy: 'shadow-amber-300/60',
  concerned: 'shadow-blue-300/40',
}

export default function BloomCharacter({
  state = 'idle',
  size = 'md',
  onClick,
  showSpeechBubble = false,
  speechText,
}: BloomCharacterProps) {
  const sizes = sizeConfig[size]

  return (
    <div className="relative">
      {/* Speech Bubble */}
      {showSpeechBubble && speechText && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10"
        >
          <div className="bg-white rounded-2xl px-4 py-2 shadow-lg border border-emerald-100 max-w-[200px]">
            <p className="text-sm text-gray-700 text-center">{speechText}</p>
            {/* Speech bubble tail */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-3 h-3 bg-white border-r border-b border-emerald-100 rotate-45" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Character */}
      <motion.button
        onClick={onClick}
        animate={stateAnimations[state]}
        className={`relative ${sizes.container} cursor-pointer focus:outline-none`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 blur-sm`}
        />

        {/* Main Body */}
        <div
          className={`absolute inset-1 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 shadow-lg ${glowColors[state]}`}
        >
          {/* Inner Body */}
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div
              className={`${sizes.inner} rounded-full bg-gradient-to-br from-emerald-300 via-teal-300 to-emerald-400 flex items-center justify-center relative overflow-hidden`}
            >
              {/* Face */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Eyes */}
                <div className="flex gap-3 mb-1">
                  <motion.div
                    animate={
                      state === 'thinking'
                        ? { scaleY: 0.3 }
                        : state === 'happy'
                          ? { scaleY: 0.5, y: 1 }
                          : {}
                    }
                    className={`${sizes.eyes} rounded-full bg-gray-800`}
                  />
                  <motion.div
                    animate={
                      state === 'thinking'
                        ? { scaleY: 0.3 }
                        : state === 'happy'
                          ? { scaleY: 0.5, y: 1 }
                          : {}
                    }
                    className={`${sizes.eyes} rounded-full bg-gray-800`}
                  />
                </div>

                {/* Blush (when happy) */}
                {state === 'happy' && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      className="absolute left-1 top-1/2 w-2 h-1 rounded-full bg-pink-300"
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      className="absolute right-1 top-1/2 w-2 h-1 rounded-full bg-pink-300"
                    />
                  </>
                )}
              </div>

              {/* Inner Shine */}
              <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-white/40" />

              {/* Petal accents */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 rounded-t-full bg-gradient-to-b from-amber-200 to-amber-300 opacity-80" />
            </div>
          </div>

          {/* Leaf decorations */}
          <motion.div
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-1 -left-1 w-4 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 rotate-45"
          />
          <motion.div
            animate={{ rotate: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-1 -right-1 w-4 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 -rotate-45"
          />
        </div>

        {/* Sparkles (when speaking or happy) */}
        {(state === 'speaking' || state === 'happy') && (
          <>
            <motion.div
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [-10, -20, -30],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className="absolute -top-2 left-0 text-amber-300 text-xs"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [-10, -25, -35],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -top-1 right-1 text-emerald-300 text-xs"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [-5, -15, -25],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              className="absolute top-0 -right-2 text-teal-300 text-xs"
            >
              ✨
            </motion.div>
          </>
        )}

        {/* Thinking dots */}
        {state === 'thinking' && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -4, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
              />
            ))}
          </div>
        )}
      </motion.button>
    </div>
  )
}
