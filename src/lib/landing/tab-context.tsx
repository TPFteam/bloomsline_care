'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type TabType = 'personal' | 'practitioner'

interface TabContextType {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children, defaultTab = 'personal' }: { children: ReactNode; defaultTab?: TabType }) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  )
}

export function useTab() {
  const context = useContext(TabContext)
  if (!context) {
    // Return default values when outside provider (e.g., other pages)
    return {
      activeTab: 'personal' as TabType,
      setActiveTab: () => {},
    }
  }
  return context
}
