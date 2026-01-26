'use client'

import { motion } from 'framer-motion'
import { Sprout, Leaf, Droplet, Heart, Plus, Check, TrendingUp } from 'lucide-react'

// Animation 1: Welcome - Seeds growing visualization
export function SeedsWelcomeAnimation() {
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* Soil line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-40 h-2 bg-[#d4a574] rounded-full opacity-30" />

      {/* Growing seeds */}
      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3.5 }}
        className="absolute left-1/4 bottom-10"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full flex items-center justify-center shadow-lg">
          <Sprout className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, repeat: Infinity, repeatDelay: 3.2 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-14"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-[#4A9A86] to-[#6BB3A0] rounded-full flex items-center justify-center shadow-lg">
          <Leaf className="w-7 h-7 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, repeat: Infinity, repeatDelay: 2.9 }}
        className="absolute right-1/4 bottom-10"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-[#5AB39C] to-[#4A9A86] rounded-full flex items-center justify-center shadow-lg">
          <Heart className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      {/* Sparkles */}
      <motion.div
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ delay: 1, duration: 1.5, repeat: Infinity, repeatDelay: 2.5 }}
        className="absolute top-6 left-1/3 w-2 h-2 bg-[#4A9A86] rounded-full"
      />
      <motion.div
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ delay: 1.3, duration: 1.5, repeat: Infinity, repeatDelay: 2.2 }}
        className="absolute top-10 right-1/3 w-1.5 h-1.5 bg-[#5AB39C] rounded-full"
      />
    </div>
  )
}

// Animation 2: Grow vs Let Go concept
export function SeedsGrowLetGoAnimation() {
  return (
    <div className="relative w-full h-44 flex items-center justify-center gap-6">
      {/* Grow side */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 4 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-2xl flex items-center justify-center shadow-lg mb-2">
          <Sprout className="w-8 h-8 text-white" />
        </div>
        <span className="text-xs font-medium text-[#4A9A86]">Grow</span>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3, repeat: Infinity, repeatDelay: 4 }}
          className="mt-2 text-[10px] text-gray-500"
        >
          + Nurture good
        </motion.div>
      </motion.div>

      {/* Divider */}
      <div className="h-20 w-px bg-gray-200" />

      {/* Let Go side */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, repeat: Infinity, repeatDelay: 3.7 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-[#D4856A] to-[#E8A87C] rounded-2xl flex items-center justify-center shadow-lg mb-2">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <span className="text-xs font-medium text-[#D4856A]">Let Go</span>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.3, repeat: Infinity, repeatDelay: 3.7 }}
          className="mt-2 text-[10px] text-gray-500"
        >
          − Release what doesn't serve
        </motion.div>
      </motion.div>
    </div>
  )
}

// Animation 3: Adding seeds
export function SeedsAddAnimation() {
  const seeds = [
    { icon: Droplet, label: 'Water', color: 'bg-blue-100' },
    { icon: Heart, label: 'Kindness', color: 'bg-rose-100' },
  ]

  return (
    <div className="relative w-full h-40 flex flex-col items-center justify-center">
      {/* Seed cards */}
      <div className="flex gap-2 mb-4">
        {seeds.map((seed, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.2, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 - i * 0.2 }}
            className={`w-16 h-16 ${seed.color} rounded-xl flex flex-col items-center justify-center gap-1`}
          >
            <seed.icon className="w-5 h-5 text-gray-600" />
            <span className="text-[9px] text-gray-500">{seed.label}</span>
          </motion.div>
        ))}

        {/* Add button */}
        <motion.div
          animate={{ scale: [1, 0.95, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-xl flex items-center justify-center shadow-md"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 1, duration: 2.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="text-[10px] text-gray-400"
      >
        Tap + to add your seeds
      </motion.p>
    </div>
  )
}

// Animation 4: Daily tracking
export function SeedsDailyTrackAnimation() {
  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Today's card */}
      <div className="w-48 bg-gray-50 rounded-2xl p-3">
        <p className="text-[10px] text-gray-400 mb-2">Today</p>

        {/* Seeds to track */}
        <div className="space-y-2">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}
            className="flex items-center justify-between px-3 py-2 bg-white rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">Stay hydrated</span>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 0.3, repeat: Infinity, repeatDelay: 3.5 }}
              className="w-5 h-5 bg-[#4A9A86] rounded-full flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3, repeat: Infinity, repeatDelay: 3.2 }}
            className="flex items-center justify-between px-3 py-2 bg-white rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-xs text-gray-600">Self-care time</span>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 1, duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
              className="w-5 h-5 bg-[#4A9A86] rounded-full flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Animation 5: Watch your progress
export function SeedsProgressAnimation() {
  const bars = [30, 50, 40, 70, 60, 80, 90]

  return (
    <div className="relative w-full h-40 flex flex-col items-center justify-center">
      {/* Mini chart */}
      <div className="flex items-end gap-2 h-20 mb-3">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: i * 0.1, duration: 0.4, repeat: Infinity, repeatDelay: 3.3 - i * 0.1 }}
            className={`w-5 rounded-t-md ${
              i === bars.length - 1
                ? 'bg-gradient-to-t from-[#4A9A86] to-[#6BB3A0]'
                : 'bg-[#e8f5f1]'
            }`}
          />
        ))}
      </div>

      {/* Trend indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -5] }}
        transition={{ delay: 1, duration: 2.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#e8f5f1] rounded-full"
      >
        <TrendingUp className="w-4 h-4 text-[#4A9A86]" />
        <span className="text-xs font-medium text-[#4A9A86]">Growing strong!</span>
      </motion.div>
    </div>
  )
}
