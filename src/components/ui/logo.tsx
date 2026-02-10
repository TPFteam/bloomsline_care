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
    <div className={cn(sizeMap[size], 'relative flex-shrink-0 flex items-center justify-center')}>
      <motion.div
        className="w-3/5 h-3/5 bg-gradient-to-br from-[#4A9A86] to-[#5AB39C] rounded-full"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )

  if (!showText) {
    return <div className={className}>{logoIcon}</div>
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {logoIcon}
      <span className={cn(
        textSizeMap[size],
        'font-medium tracking-wide',
        variant === 'dark' ? 'text-white' : ''
      )} style={variant === 'light' ? { color: '#1F2227', textShadow: '0 1px 3px rgba(0,0,0,0.2)' } : undefined}>
        Bloomsline
      </span>
    </div>
  )
}
