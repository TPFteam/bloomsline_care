'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
  variant?: 'light' | 'dark' // light = dark text for light bg, dark = light text for dark bg
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const textSizeMap = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
}

export function Logo({ size = 'sm', className, showText = false, variant = 'light' }: LogoProps) {
  const logoIcon = (
    <div className={cn(sizeMap[size], 'relative flex-shrink-0')}>
      {/* Background circle */}
      <div className={cn(
        "absolute inset-0 rounded-xl",
        variant === 'light'
          ? "bg-gradient-to-br from-teal-100 to-lavender-100"
          : "bg-gradient-to-br from-teal-800/50 to-lavender-800/50"
      )} />

      {/* Animated bloom/flower */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Center circle */}
        <motion.div
          className="absolute w-2/5 h-2/5 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full z-10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
          <motion.div
            key={i}
            className="absolute w-1/4 h-2/5 bg-gradient-to-t from-lavender-400 to-lavender-300 rounded-full origin-bottom"
            style={{
              transform: `rotate(${rotation}deg) translateY(-35%)`,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15
            }}
          />
        ))}
      </div>
    </div>
  )

  if (!showText) {
    return <div className={className}>{logoIcon}</div>
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {logoIcon}
      <span className={cn(
        textSizeMap[size],
        'font-bold tracking-tight',
        variant === 'light' ? 'text-gray-900' : 'text-white'
      )}>
        Bloomsline
      </span>
    </div>
  )
}
