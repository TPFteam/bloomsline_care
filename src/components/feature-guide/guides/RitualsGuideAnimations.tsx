'use client'

import { motion } from 'framer-motion'
import { Sun, Moon, Coffee, Heart, Check, Clock, Plus, Smile, PenLine } from 'lucide-react'

// Animation 1: Welcome - Daily rituals visualization
export function RitualsWelcomeAnimation() {
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* Time-based ritual cards */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-5, -5, -5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-14 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl shadow-lg -left-4 top-6"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Sun className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute w-16 h-20 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-xl shadow-lg z-10"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Coffee className="w-7 h-7 text-white" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0], rotate: [5, 5, 5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute w-14 h-16 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl shadow-lg -right-4 top-8"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Moon className="w-6 h-6 text-white" />
        </div>
      </motion.div>
    </div>
  )
}

// Animation 2: Categories - Time of day selection
export function RitualsCategoriesAnimation() {
  const categories = [
    { icon: Sun, color: 'from-amber-400 to-amber-500', label: 'AM', delay: 0 },
    { icon: Coffee, color: 'from-[#4A9A86] to-[#5AB39C]', label: '12', delay: 0.15 },
    { icon: Moon, color: 'from-indigo-400 to-indigo-500', label: 'PM', delay: 0.3 },
    { icon: Heart, color: 'from-[#D4856A] to-[#E8A87C]', label: '', delay: 0.45 },
  ]

  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      <div className="flex gap-3">
        {categories.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{
              delay: cat.delay,
              duration: 0.4,
              repeat: Infinity,
              repeatDelay: 3,
              repeatType: 'loop'
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
              <cat.icon className="w-5 h-5 text-white" />
            </div>
            {cat.label && (
              <span className="text-[10px] text-gray-400 font-medium">{cat.label}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Selection indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
        transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#e8f5f1] rounded-full"
      >
        <span className="text-xs font-medium text-[#4A9A86]">Morning selected</span>
      </motion.div>
    </div>
  )
}

// Animation 3: Tracking types - Checkbox and Timer
export function RitualsTrackingAnimation() {
  return (
    <div className="relative w-full h-40 flex flex-col items-center justify-center gap-4">
      {/* Checkbox tracking */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 4 }}
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl w-52"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.5, duration: 0.3, repeat: Infinity, repeatDelay: 4.2 }}
          className="w-7 h-7 rounded-lg bg-[#4A9A86] flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
        <div>
          <span className="text-sm text-gray-700 font-medium">Solo date</span>
          <p className="text-[10px] text-gray-400">Simple check-off</p>
        </div>
      </motion.div>

      {/* Timer tracking */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4, repeat: Infinity, repeatDelay: 3.7 }}
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl w-52"
      >
        <div className="w-7 h-7 rounded-lg bg-[#D4856A] flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 font-medium">Dance break</span>
            <span className="text-xs text-[#D4856A]">5:00</span>
          </div>
          <motion.div
            className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden"
          >
            <motion.div
              animate={{ width: ['0%', '70%'] }}
              transition={{ delay: 1.2, duration: 2, repeat: Infinity, repeatDelay: 2.5 }}
              className="h-full bg-[#D4856A] rounded-full"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// Animation 4: Reflect on how you feel
export function RitualsReflectAnimation() {
  const moods = [
    { emoji: '😌', label: 'Calm' },
    { emoji: '😊', label: 'Happy' },
  ]

  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Completed ritual card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 4.5 }}
        className="w-48 bg-gray-50 rounded-2xl p-3 mb-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-[#4A9A86] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Window gazing</span>
        </div>

        {/* How do you feel? */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3, repeat: Infinity, repeatDelay: 4.5 }}
          className="text-[10px] text-gray-500 mb-2"
        >
          How do you feel?
        </motion.p>

        {/* Mood options */}
        <div className="flex gap-1.5">
          {moods.map((mood, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.15, duration: 0.3, repeat: Infinity, repeatDelay: 4.1 - i * 0.15 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${
                i === 0 ? 'bg-[#e8f5f1] text-[#4A9A86]' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Note being added */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -5] }}
        transition={{ delay: 1.5, duration: 2.5, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm"
      >
        <PenLine className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] text-gray-500 italic">Felt present today...</span>
      </motion.div>
    </div>
  )
}

// Animation 5: Add your rituals
export function RitualsAddAnimation() {
  return (
    <div className="relative w-full h-44 flex flex-col items-center justify-center">
      {/* Card mockup */}
      <div className="w-52 bg-gray-50 rounded-2xl p-4 shadow-sm">
        {/* Existing rituals */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-[#4A9A86] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-600">Sunshine walk</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-[#4A9A86] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-600">Tea moment</span>
          </div>
        </div>

        {/* Add button animating */}
        <motion.div
          animate={{ scale: [1, 0.95, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#4A9A86] to-[#5AB39C] rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-xs font-medium text-white">Add ritual</span>
        </motion.div>
      </div>

      {/* Floating suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 20, x: 30 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10], x: 30 }}
        transition={{ delay: 1, duration: 2.5, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
        className="absolute top-2 right-2 px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-100"
      >
        <span className="text-[10px] text-gray-500">+ Create custom</span>
      </motion.div>
    </div>
  )
}
