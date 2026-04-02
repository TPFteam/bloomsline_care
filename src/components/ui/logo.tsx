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
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({ size = 'sm', className, showText = false, variant = 'light' }: LogoProps) {
  if (!showText) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="w-5 h-5 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      <span className={cn(
        textSizeMap[size],
        'tracking-wide whitespace-nowrap',
        variant === 'dark' ? 'text-white' : ''
      )} style={variant === 'light' ? { color: '#1F2227' } : undefined}>
        <span className="font-medium">blooms</span>
        <motion.span
          className="font-light text-[#4A9A86]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >line</motion.span>
      </span>
    </div>
  )
}
