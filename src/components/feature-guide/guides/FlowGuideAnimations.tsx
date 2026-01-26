'use client'

import { motion } from 'framer-motion'
import { Sun, Moon, Coffee, Camera, Heart, Sparkles, Clock } from 'lucide-react'

// Animation 1: Welcome - Timeline visualization
export function FlowWelcomeAnimation() {
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* Timeline line */}
      <div className="absolute left-8 right-8 h-1 bg-gray-200 rounded-full top-1/2 -translate-y-1/2" />

      {/* Time markers */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 3.7 }}
        className="absolute left-8 top-1/2 -translate-y-1/2"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
          <Sun className="w-5 h-5 text-white" />
        </div>
        <span className="text-[9px] text-gray-400 mt-1 block text-center">AM</span>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3, repeat: Infinity, repeatDelay: 3.4 }}
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full flex items-center justify-center shadow-lg">
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <span className="text-[9px] text-gray-400 mt-1 block text-center">Noon</span>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, duration: 0.3, repeat: Infinity, repeatDelay: 3.1 }}
        className="absolute right-8 top-1/2 -translate-y-1/2"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
          <Moon className="w-5 h-5 text-white" />
        </div>
        <span className="text-[9px] text-gray-400 mt-1 block text-center">PM</span>
      </motion.div>
    </div>
  )
}

// Animation 2: Everything in one place
export function FlowAllInOneAnimation() {
  const items = [
    { icon: Camera, label: 'Moments', color: 'from-[#4A9A86] to-[#5AB39C]', delay: 0 },
    { icon: Heart, label: 'Rituals', color: 'from-[#D4856A] to-[#E8A87C]', delay: 0.2 },
    { icon: Sparkles, label: 'Seeds', color: 'from-amber-400 to-amber-500', delay: 0.4 },
  ]

  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Items flowing into timeline */}
      <div className="flex gap-4 mb-4">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: item.delay, duration: 0.4, repeat: Infinity, repeatDelay: 3.6 - item.delay }}
            className="flex flex-col items-center"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{item.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Arrow down */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 0.8, duration: 2, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="text-gray-300 text-xl mb-2"
      >
        ↓
      </motion.div>

      {/* Timeline result */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
        className="flex items-center gap-2 px-4 py-2 bg-[#e8f5f1] rounded-full"
      >
        <Clock className="w-4 h-4 text-[#4A9A86]" />
        <span className="text-xs font-medium text-[#4A9A86]">Your day, visualized</span>
      </motion.div>
    </div>
  )
}

// Animation 3: Tap to explore
export function FlowTapExploreAnimation() {
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* Mini timeline */}
      <div className="relative w-52 h-20 bg-gray-50 rounded-2xl p-3">
        {/* Timeline bar */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 rounded-full" />

        {/* Points on timeline */}
        <motion.div
          className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#4A9A86] rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-1/3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#D4856A] rounded-full"
        />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full"
        />
        <motion.div
          className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#4A9A86] rounded-full"
        />

        {/* Tap indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 border-2 border-[#4A9A86] rounded-full"
        />
      </div>

      {/* Detail popup */}
      <motion.div
        initial={{ opacity: 0, y: 10, x: -20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10], x: -20 }}
        transition={{ delay: 0.5, duration: 2.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="absolute -top-2 left-1/4 bg-white rounded-xl px-3 py-2 shadow-lg border border-gray-100"
      >
        <p className="text-[10px] text-gray-600">9:30 AM</p>
        <p className="text-xs font-medium text-gray-800">Morning coffee</p>
      </motion.div>
    </div>
  )
}

// Animation 4: Navigate through days
export function FlowNavigateAnimation() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  return (
    <div className="relative w-full h-40 flex flex-col items-center justify-center">
      {/* Day selector */}
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ x: [-5, 0, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-gray-400"
        >
          ←
        </motion.div>

        <div className="flex gap-1">
          {days.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: i === 2 ? 1 : 0.5 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium ${
                i === 2
                  ? 'bg-[#4A9A86] text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {day}
            </motion.div>
          ))}
        </div>

        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-gray-400"
        >
          →
        </motion.div>
      </div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 0.5, duration: 2.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="text-[10px] text-gray-400"
      >
        Swipe to see past days
      </motion.p>
    </div>
  )
}

// Animation 5: Your story unfolds
export function FlowStoryAnimation() {
  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Growing timeline */}
      <div className="relative w-48">
        {/* Base line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          className="h-1 bg-gradient-to-r from-[#4A9A86] via-[#D4856A] to-amber-400 rounded-full"
        />

        {/* Points appearing */}
        {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: pos * 2, duration: 0.3, repeat: Infinity, repeatDelay: 4 - pos * 2 }}
            style={{ left: `${pos * 100}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#4A9A86] rounded-full"
          />
        ))}
      </div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -5] }}
        transition={{ delay: 2.5, duration: 1.5, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-[#e8f5f1] rounded-full"
      >
        <Sparkles className="w-4 h-4 text-[#4A9A86]" />
        <span className="text-xs font-medium text-[#4A9A86]">Every day tells a story</span>
      </motion.div>
    </div>
  )
}
