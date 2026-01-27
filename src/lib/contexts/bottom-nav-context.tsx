'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface BottomNavContextType {
  blurBottomNav: boolean
  setBlurBottomNav: (blur: boolean) => void
}

const BottomNavContext = createContext<BottomNavContextType>({
  blurBottomNav: false,
  setBlurBottomNav: () => {},
})

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [blurBottomNav, setBlurBottomNav] = useState(false)

  return (
    <BottomNavContext.Provider value={{ blurBottomNav, setBlurBottomNav }}>
      {children}
    </BottomNavContext.Provider>
  )
}

export function useBottomNav() {
  return useContext(BottomNavContext)
}
