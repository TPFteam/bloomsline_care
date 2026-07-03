'use client'

import { useEffect, useState } from 'react'

// True on phone-sized screens (below Tailwind's `sm`, 640px). SSR-safe: starts
// false, resolves on mount, and stays reactive to viewport changes.
export function useIsMobile(query = '(max-width: 639px)'): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return isMobile
}
