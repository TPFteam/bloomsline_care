'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

const sizeMap = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function Logo({ size = 'sm', className, showText = false }: LogoProps) {
  const logoIcon = (
    <div className={cn(sizeMap[size], 'relative flex-shrink-0')}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <style>
          {`
            @keyframes colorCycle {
              0%, 100% { fill: #E9E3F5; }
              50% { fill: #D1F4E0; }
            }
            .logo-bg {
              animation: colorCycle 30s ease-in-out infinite;
            }
          `}
        </style>

        {/* Animated background - cycles between lavender and mint */}
        <rect width="32" height="32" rx="8" className="logo-bg" />

        {/* Bold premium "B" - clean filled letterform */}
        <path
          d="M11 8V24H17.5C20.5376 24 23 21.5376 23 18.5C23 16.5 21.8 14.8 20 14C21.2 13.2 22 11.9 22 10.5C22 8.01472 19.9853 6 17.5 6H11V8ZM14 10H17C18.1046 10 19 10.8954 19 12C19 13.1046 18.1046 14 17 14H14V10ZM14 17H17.5C18.8807 17 20 18.1193 20 19.5C20 20.8807 18.8807 22 17.5 22H14V17Z"
          fill="#4A3F5C"
          fillRule="evenodd"
        />
      </svg>
    </div>
  )

  if (!showText) {
    return <div className={className}>{logoIcon}</div>
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {logoIcon}
      <span className={cn(
        textSizeMap[size],
        'font-semibold tracking-tight text-gray-900'
      )}>
        Bloomsline
      </span>
    </div>
  )
}
