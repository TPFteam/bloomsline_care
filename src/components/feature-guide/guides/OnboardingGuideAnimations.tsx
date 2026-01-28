'use client'

import { motion } from 'framer-motion'
import { Leaf, Heart, Sun, Camera, Sparkles, Info, Home, Circle } from 'lucide-react'

// Animation 1: Welcome to Bloomsline - Logo reveal with bloom effect
export function OnboardingWelcomeAnimation() {
  return (
    <div className="relative w-full h-36 sm:h-44 flex flex-col items-center justify-center">
      {/* Bloomsline Logo - Animated flower */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-[#4A9A86]/40 to-[#D4856A]/40 rounded-full blur-xl scale-150"
        />

        {/* Logo container */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
          {/* Petals - Coral */}
          {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-10 sm:w-8 sm:h-14 bg-gradient-to-t from-[#D4856A] to-[#E8A87C] rounded-full origin-bottom"
              style={{
                transform: `rotate(${rotation}deg) translateY(-35%)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.85, 1, 0.85]
              }}
              transition={{
                scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 },
                opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 },
              }}
            />
          ))}

          {/* Center circle - Teal */}
          <motion.div
            className="absolute w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full z-10 shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        </motion.div>

      {/* Bloomsline text */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-gray-800 tracking-tight"
      >
        Bloomsline
      </motion.p>
    </div>
  )
}

// Animation 2: Your personal space - showing calm, private space
export function OnboardingPersonalSpaceAnimation() {
  return (
    <div className="relative w-full h-32 sm:h-40 flex items-center justify-center">
      {/* Phone/app frame */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-36 sm:w-44 h-24 sm:h-28 bg-gradient-to-b from-teal-50 to-emerald-50 rounded-xl sm:rounded-2xl border-2 border-gray-200 overflow-hidden"
      >
        {/* Content inside */}
        <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          {/* Greeting */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-300 to-amber-400 rounded-full flex items-center justify-center">
              <Sun className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-gray-200 rounded" />
              <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-gray-100 rounded mt-0.5" />
            </div>
          </motion.div>

          {/* Content cards */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-1.5 sm:gap-2"
          >
            <div className="flex-1 h-6 sm:h-8 bg-white/80 rounded-lg border border-gray-100" />
            <div className="flex-1 h-6 sm:h-8 bg-white/80 rounded-lg border border-gray-100" />
          </motion.div>
        </div>

        {/* Privacy shield effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-[#4A9A86]/20 to-transparent"
        />
      </motion.div>

      {/* Heart indicating personal */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        className="absolute -bottom-2 -right-2 sm:right-0"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4856A]" fill="#D4856A" />
        </motion.div>
      </motion.div>
    </div>
  )
}

// Animation 3: Capture moments - camera and photos
export function OnboardingCaptureAnimation() {
  return (
    <div className="relative w-full h-32 sm:h-40 flex items-center justify-center">
      {/* Photo cards stack */}
      <div className="relative">
        {/* Background photos */}
        <motion.div
          initial={{ opacity: 0, rotate: -8 }}
          animate={{ opacity: 1, rotate: -8 }}
          transition={{ delay: 0.2 }}
          className="absolute -left-6 sm:-left-8 -top-2 w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg sm:rounded-xl shadow-md"
        />
        <motion.div
          initial={{ opacity: 0, rotate: 6 }}
          animate={{ opacity: 1, rotate: 6 }}
          transition={{ delay: 0.4 }}
          className="absolute -right-6 sm:-right-8 -top-1 w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg sm:rounded-xl shadow-md"
        />

        {/* Main photo with camera */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
          className="relative w-20 h-24 sm:w-24 sm:h-28 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center z-10"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>

          {/* Flash effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 1.5, duration: 0.3, repeat: Infinity, repeatDelay: 2.5 }}
            className="absolute inset-0 bg-white rounded-xl sm:rounded-2xl"
          />
        </motion.div>
      </div>

      {/* Text hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute -bottom-1 sm:bottom-0 px-2 sm:px-3 py-1 bg-white rounded-full shadow-md text-[9px] sm:text-[10px] text-gray-600"
      >
        Capture what matters
      </motion.div>
    </div>
  )
}

// Animation 4: Grow and let go - balance concept
export function OnboardingGrowLetGoAnimation() {
  return (
    <div className="relative w-full h-32 sm:h-40 flex items-center justify-center">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Grow side */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          <span className="text-[10px] sm:text-xs font-medium text-[#4A9A86] mt-1.5 sm:mt-2">Garder</span>
        </motion.div>

        {/* Balance indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-0.5 sm:w-1 h-12 sm:h-14 bg-gray-200 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full mt-1"
          />
        </motion.div>

        {/* Let go side */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#D4856A] to-[#E8A87C] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          <span className="text-[10px] sm:text-xs font-medium text-[#D4856A] mt-1.5 sm:mt-2">Alleger</span>
        </motion.div>
      </div>
    </div>
  )
}

// Animation 5: Info icons - showing where to find help
export function OnboardingInfoIconsAnimation() {
  const items = [
    { icon: Home, label: 'Home', color: 'from-[#4A9A86] to-[#5AB39C]' },
    { icon: Sun, label: 'Moments', color: 'from-amber-400 to-amber-500' },
    { icon: Circle, label: 'Rituals', color: 'from-[#D4856A] to-[#E8A87C]' },
  ]

  return (
    <div className="relative w-full h-36 sm:h-44 flex flex-col items-center justify-center">
      {/* Nav bar mockup */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-2.5 sm:py-3 bg-white rounded-full shadow-lg"
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${item.color} rounded-lg sm:rounded-xl flex items-center justify-center`}>
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Info button highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative mt-4 sm:mt-6"
      >
        {/* Info button */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-md border-2 border-[#4A9A86]"
        >
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-[#4A9A86]" />
        </motion.div>

        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 border-2 border-[#4A9A86] rounded-full"
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
          transition={{ delay: 1.2, duration: 2.5, repeat: Infinity }}
          className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5 bg-[#4A9A86] text-white text-[9px] sm:text-[10px] rounded-lg shadow-lg"
        >
          Tap for guides
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#4A9A86] rotate-45" />
        </motion.div>
      </motion.div>
    </div>
  )
}

// Animation 6: Ready to start - encouraging final screen
export function OnboardingReadyAnimation() {
  return (
    <div className="relative w-full h-36 sm:h-44 flex items-center justify-center">
      {/* Celebration elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 60,
            y: Math.sin(i * 45 * Math.PI / 180) * 60,
          }}
          transition={{
            delay: 0.5 + i * 0.1,
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="absolute"
        >
          <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${i % 2 === 0 ? 'text-[#4A9A86]' : 'text-[#D4856A]'}`} />
        </motion.div>
      ))}

      {/* Center content */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#4A9A86] via-[#5AB39C] to-[#4A9A86] rounded-full flex items-center justify-center shadow-xl"
        >
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Leaf className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-[#4A9A86]"
        >
          Your journey begins
        </motion.p>
      </motion.div>
    </div>
  )
}
