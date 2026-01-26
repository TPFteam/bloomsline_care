'use client'

import { motion } from 'framer-motion'
import { Camera, Video, Mic, PenLine, Plus, Heart, Smile, Sparkles, Check } from 'lucide-react'

// Animation 1: Welcome - Floating moments collage
export function WelcomeAnimation() {
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* Floating cards representing moments */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-3, -3, -3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-16 h-20 bg-gradient-to-br from-[#D4856A] to-[#E8A87C] rounded-xl shadow-lg -left-2 top-4"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [2, 2, 2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="absolute w-20 h-24 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-xl shadow-lg z-10"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0], rotate: [4, 4, 4] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute w-16 h-20 bg-gradient-to-br from-[#4A9A86] to-[#6BB3A0] rounded-xl shadow-lg -right-2 top-6"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </motion.div>
    </div>
  )
}

// Animation 2: Capture - Show the capture flow
export function CaptureAnimation() {
  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Phone frame */}
      <div className="relative w-36 h-40 bg-gray-900 rounded-2xl p-1.5 shadow-xl">
        <div className="w-full h-full bg-gray-800 rounded-xl overflow-hidden relative">
          {/* Capture options appearing */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {[
              { icon: Camera, color: 'from-[#4A9A86] to-[#5AB39C]', delay: 0 },
              { icon: Video, color: 'from-[#D4856A] to-[#E8A87C]', delay: 0.15 },
              { icon: Mic, color: 'from-[#4A9A86] to-[#6BB3A0]', delay: 0.3 },
              { icon: PenLine, color: 'from-[#C27459] to-[#D4856A]', delay: 0.45 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  delay: item.delay,
                  duration: 0.4,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  repeatType: 'loop'
                }}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center`}
              >
                <item.icon className="w-4 h-4 text-white" />
              </motion.div>
            ))}
          </div>

          {/* Plus button that triggers */}
          <motion.div
            animate={{ scale: [1, 0.9, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 -translate-y-12 w-10 h-10 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full flex items-center justify-center shadow-lg"
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.div>

          {/* Selection indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
            className="absolute bottom-3 left-3 w-8 h-8 border-2 border-white rounded-full"
          />
        </div>
      </div>
    </div>
  )
}

// Animation 3: Mood tracking
export function MoodAnimation() {
  const moods = [
    { emoji: '😊', color: 'bg-[#e8f5f1]', delay: 0 },
    { emoji: '😌', color: 'bg-[#f5ebe7]', delay: 0.1 },
    { emoji: '🥰', color: 'bg-[#e8f5f1]', delay: 0.2 },
    { emoji: '😔', color: 'bg-[#f0f5f3]', delay: 0.3 },
    { emoji: '😤', color: 'bg-[#f5ebe7]', delay: 0.4 },
  ]

  return (
    <div className="relative w-full h-40 flex flex-col items-center justify-center">
      {/* Mood selector */}
      <div className="flex gap-2 mb-4">
        {moods.map((mood, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: mood.delay, duration: 0.3, repeat: Infinity, repeatDelay: 3 }}
            className={`w-10 h-10 ${mood.color} rounded-full flex items-center justify-center text-lg`}
          >
            {mood.emoji}
          </motion.div>
        ))}
      </div>

      {/* Selection animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
        transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e8f5f1] to-[#d4ebe4] rounded-full"
      >
        <span className="text-lg">😊</span>
        <span className="text-sm font-medium text-[#4A9A86]">Grateful</span>
        <motion.div
          animate={{ scale: [0, 1] }}
          transition={{ delay: 1, duration: 0.3, repeat: Infinity, repeatDelay: 2.7 }}
        >
          <Check className="w-4 h-4 text-[#4A9A86]" />
        </motion.div>
      </motion.div>
    </div>
  )
}

// Animation 4: Talk to Bloom
export function BloomAnimation() {
  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Chat interface mockup */}
      <div className="w-48 bg-gray-50 rounded-2xl p-3 shadow-lg">
        {/* Bloom avatar */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <span className="text-xs font-semibold text-gray-700">Bloom</span>
        </div>

        {/* Chat bubble appearing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          className="bg-white rounded-xl p-2 shadow-sm mb-2"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3, repeat: Infinity, repeatDelay: 3.2 }}
            className="text-xs text-gray-600"
          >
            How are you feeling today?
          </motion.p>
        </motion.div>

        {/* Typing indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
          className="flex items-center gap-1 ml-auto w-fit bg-[#f5ebe7] rounded-xl px-3 py-1.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 bg-[#D4856A] rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// Animation 5: Your story grows
export function GrowthAnimation() {
  return (
    <div className="relative w-full h-44 flex items-center justify-center">
      {/* Growing collection */}
      <div className="relative">
        {/* Base moment */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 4 }}
          className="w-14 h-14 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-xl shadow-lg flex items-center justify-center"
        >
          <Camera className="w-6 h-6 text-white" />
        </motion.div>

        {/* Growing moments */}
        {[
          { x: -40, y: -30, delay: 0.5, color: 'from-[#D4856A] to-[#E8A87C]', icon: Heart },
          { x: 40, y: -25, delay: 1, color: 'from-[#4A9A86] to-[#6BB3A0]', icon: Smile },
          { x: -35, y: 30, delay: 1.5, color: 'from-[#5AB39C] to-[#4A9A86]', icon: PenLine },
          { x: 45, y: 35, delay: 2, color: 'from-[#C27459] to-[#D4856A]', icon: Mic },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{ scale: 1, x: item.x, y: item.y }}
            transition={{ delay: item.delay, duration: 0.5, repeat: Infinity, repeatDelay: 3.5 - item.delay }}
            className={`absolute top-0 left-0 w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg shadow-md flex items-center justify-center`}
          >
            <item.icon className="w-4 h-4 text-white" />
          </motion.div>
        ))}

        {/* Sparkle burst at end */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{ delay: 3, duration: 0.8, repeat: Infinity, repeatDelay: 3.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sparkles className="w-20 h-20 text-[#4A9A86]" />
        </motion.div>
      </div>
    </div>
  )
}
