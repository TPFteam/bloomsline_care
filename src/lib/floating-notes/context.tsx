'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser-client'

export type FloatingNoteMode = 'quick' | 'session'

export interface FloatingNoteData {
  mode: FloatingNoteMode
  content: string
  memberId: string
  memberName: string
  noteType: string
  sessionId?: string
  existingNoteId?: string
  milestones?: { id: string; title: string; status: string }[]
  editorNoteTypes?: { type: string; label: string }[]
  /**
   * Optional human context shown in the panel title bar so the
   * practitioner can confirm which session this note is for. Only set
   * when the panel is opened from a session-specific surface like the
   * Bookings page; null for ad-hoc quick notes.
   */
  sessionContext?: {
    title: string
    startTimeIso: string
    durationMinutes: number
    format?: 'in_person' | 'video' | 'virtual' | string | null
  }
}

interface FloatingNotesContextValue {
  floatingNote: FloatingNoteData | null
  isMinimized: boolean
  openFloat: (data: FloatingNoteData) => void
  closeFloat: () => void
  dockNote: () => FloatingNoteData | null
  updateContent: (content: string) => void
  setMinimized: (minimized: boolean) => void
}

const FloatingNotesContext = createContext<FloatingNotesContextValue | null>(null)

export function FloatingNotesProvider({ children }: { children: React.ReactNode }) {
  const [floatingNote, setFloatingNote] = useState<FloatingNoteData | null>(null)
  const [isMinimized, setMinimized] = useState(false)
  const noteRef = useRef<FloatingNoteData | null>(null)

  // Keep ref in sync for beforeunload handler
  useEffect(() => {
    noteRef.current = floatingNote
  }, [floatingNote])

  // Clear floating note on sign out
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setFloatingNote(null)
        setMinimized(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Warn on browser close/refresh if floating note has content
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (noteRef.current?.content?.trim()) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const openFloat = useCallback((data: FloatingNoteData) => {
    setFloatingNote(data)
    setMinimized(false)
  }, [])

  const closeFloat = useCallback(() => {
    setFloatingNote(null)
    setMinimized(false)
  }, [])

  const dockNote = useCallback(() => {
    const data = noteRef.current
    setFloatingNote(null)
    setMinimized(false)
    return data
  }, [])

  const updateContent = useCallback((content: string) => {
    setFloatingNote(prev => prev ? { ...prev, content } : null)
  }, [])

  return (
    <FloatingNotesContext.Provider value={{ floatingNote, isMinimized, openFloat, closeFloat, dockNote, updateContent, setMinimized }}>
      {children}
    </FloatingNotesContext.Provider>
  )
}

export function useFloatingNotes() {
  const ctx = useContext(FloatingNotesContext)
  if (!ctx) throw new Error('useFloatingNotes must be used within FloatingNotesProvider')
  return ctx
}
