'use client'

import { motion } from 'framer-motion'

interface LoadingDotsProps {
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingDots({ fullScreen = false, size = 'md' }: LoadingDotsProps) {
  // Dot positions for different shapes: [dot1, dot2, dot3] each with [x, y]
  const sizeMultiplier = size === 'sm' ? 0.7 : size === 'lg' ? 1.3 : 1

  const shapes = {
    line: [[-16, 0], [0, 0], [16, 0]],
    triangle: [[0, -14], [-14, 10], [14, 10]],
    heart: [[-8, -4], [8, -4], [0, 12]],
    smile: [[-10, -6], [10, -6], [0, 10]],
  }

  const sequence = ['line', 'triangle', 'heart', 'smile'] as const

  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
  const dotMargin = size === 'sm' ? '-4px' : size === 'lg' ? '-8px' : '-6px'

  const content = (
    <div className="relative w-12 h-12">
      {[0, 1, 2].map((dotIndex) => (
        <motion.div
          key={dotIndex}
          className={`absolute ${dotSize} rounded-full bg-[#4A9A86]`}
          style={{ left: '50%', top: '50%', marginLeft: dotMargin, marginTop: dotMargin }}
          animate={{
            x: sequence.map(shape => shapes[shape][dotIndex][0] * sizeMultiplier),
            y: sequence.map(shape => shapes[shape][dotIndex][1] * sizeMultiplier),
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75],
          }}
        />
      ))}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 via-teal-50/30 to-white">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  )
}
