'use client'

import { motion } from 'framer-motion'
import { Heart, Sparkles, Eye, MessageCircle, Calendar } from 'lucide-react'

// Animation 1: Welcome - Understanding, not tracking
export function ProgressWelcomeAnimation() {
  return (
    <div className="relative w-full h-28 sm:h-36 flex items-center justify-center">
      {/* Central heart with understanding pulse */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glow ring */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full blur-xl"
        />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full flex items-center justify-center shadow-lg">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
          </motion.div>
        </div>
      </motion.div>

      {/* Floating words */}
      <motion.span
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: [0, 1, 1, 0], x: [-30, -50, -50, -30] }}
        transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-[#4A9A86] font-medium"
      >
        understand
      </motion.span>
      <motion.span
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: [0, 1, 1, 0], x: [30, 50, 50, 30] }}
        transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1], delay: 0.5 }}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-[#D4856A] font-medium"
      >
        grow
      </motion.span>
    </div>
  )
}

// Animation 2: Patterns reveal themselves
export function ProgressPatternsAnimation() {
  const dots = [
    { day: 'M', filled: true },
    { day: 'T', filled: true },
    { day: 'W', filled: false },
    { day: 'T', filled: true },
    { day: 'F', filled: true },
    { day: 'S', filled: false },
    { day: 'S', filled: true },
  ]

  return (
    <div className="relative w-full h-28 sm:h-36 flex flex-col items-center justify-center">
      {/* Week dots */}
      <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
        {dots.map((dot, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={dot.filled ? { scale: [1, 1.1, 1] } : {}}
              transition={{ delay: i * 0.2, duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                dot.filled
                  ? 'bg-gradient-to-br from-[#4A9A86] to-[#5AB39C]'
                  : 'bg-gray-100 border border-gray-200'
              }`}
            />
            <span className="text-[8px] sm:text-[10px] text-gray-400 mt-1">{dot.day}</span>
          </motion.div>
        ))}
      </div>

      {/* Insight message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -5] }}
        transition={{ delay: 1, duration: 2.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#e8f5f1] rounded-full"
      >
        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-[#4A9A86]" />
        <span className="text-[10px] sm:text-xs font-medium text-[#4A9A86]">Patterns emerge gently</span>
      </motion.div>
    </div>
  )
}

// Animation 3: Energy & feelings
export function ProgressEnergyAnimation() {
  const energyLevels = [
    { level: 60, color: '#4A9A86' },
    { level: 45, color: '#5AB39C' },
    { level: 75, color: '#4A9A86' },
    { level: 55, color: '#D4856A' },
    { level: 80, color: '#4A9A86' },
  ]

  return (
    <div className="relative w-full h-28 sm:h-36 flex flex-col items-center justify-center">
      {/* Energy bars */}
      <div className="flex items-end gap-2 sm:gap-3 h-16 sm:h-20 mb-2 sm:mb-3">
        {energyLevels.map((item, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${item.level}%` }}
            transition={{ delay: i * 0.15, duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            style={{ backgroundColor: item.color }}
            className="w-5 sm:w-6 rounded-t-lg"
          />
        ))}
      </div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[10px] sm:text-xs text-gray-500"
      >
        How you&apos;ve been feeling
      </motion.p>
    </div>
  )
}

// Animation 4: Bloom companion
export function ProgressBloomAnimation() {
  return (
    <div className="relative w-full h-28 sm:h-36 flex items-center justify-center">
      {/* Chat bubble conversation */}
      <div className="flex flex-col gap-2 sm:gap-3 w-48 sm:w-56">
        {/* Bloom message */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-2"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[140px] sm:max-w-[160px]"
          >
            <p className="text-[10px] sm:text-xs text-gray-700">I notice you&apos;ve been consistent this week</p>
          </motion.div>
        </motion.div>

        {/* User response */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex items-start gap-2 justify-end"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-[#4A9A86] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[120px] sm:max-w-[140px]"
          >
            <p className="text-[10px] sm:text-xs text-white">It feels good!</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Animation 5: Calendar reflection
export function ProgressCalendarAnimation() {
  const days = Array.from({ length: 21 }, (_, i) => ({
    active: [2, 3, 5, 8, 9, 10, 12, 15, 16, 17, 19].includes(i),
  }))

  return (
    <div className="relative w-full h-28 sm:h-36 flex flex-col items-center justify-center">
      {/* Mini calendar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg border border-gray-100"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#4A9A86]" />
          <span className="text-[10px] sm:text-xs font-medium text-gray-600">Your Journey</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${
                day.active
                  ? 'bg-gradient-to-br from-[#4A9A86] to-[#5AB39C]'
                  : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-gray-400"
      >
        Every day adds to your story
      </motion.p>
    </div>
  )
}
