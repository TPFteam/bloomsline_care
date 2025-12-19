'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { updateDraftResponse } from '@/lib/services/member-resources'

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface UseAutoSaveDraftOptions {
  responseId: string | null
  responses: Record<string, unknown>
  debounceMs?: number
  enabled?: boolean
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

interface UseAutoSaveDraftReturn {
  status: AutoSaveStatus
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  saveNow: () => Promise<void>
  error: Error | null
}

export function useAutoSaveDraft({
  responseId,
  responses,
  debounceMs = 3000,
  enabled = true,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveDraftOptions): UseAutoSaveDraftReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs to prevent stale closures
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedResponsesRef = useRef<string>('')
  const responsesRef = useRef(responses)
  const responseIdRef = useRef(responseId)

  // Keep refs updated
  useEffect(() => {
    responsesRef.current = responses
  }, [responses])

  useEffect(() => {
    responseIdRef.current = responseId
  }, [responseId])

  // Save function
  const performSave = useCallback(async () => {
    const currentResponseId = responseIdRef.current
    const currentResponses = responsesRef.current

    if (!currentResponseId || isSavingRef.current) {
      return
    }

    const responsesJson = JSON.stringify(currentResponses)
    if (responsesJson === lastSavedResponsesRef.current) {
      setStatus('idle')
      setHasUnsavedChanges(false)
      return
    }

    isSavingRef.current = true
    setStatus('saving')
    setError(null)
    onSaveStart?.()

    try {
      await updateDraftResponse(currentResponseId, currentResponses)
      lastSavedResponsesRef.current = responsesJson
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)
      setStatus('saved')
      onSaveSuccess?.()

      // Reset to idle after showing "saved" briefly
      setTimeout(() => {
        setStatus('idle')
      }, 2000)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save')
      setError(error)
      setStatus('error')
      onSaveError?.(error)
    } finally {
      isSavingRef.current = false
    }
  }, [onSaveStart, onSaveSuccess, onSaveError])

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSave()
  }, [performSave])

  // Detect changes and schedule auto-save
  useEffect(() => {
    if (!enabled || !responseId) {
      return
    }

    const responsesJson = JSON.stringify(responses)
    const hasChanges = responsesJson !== lastSavedResponsesRef.current

    if (hasChanges) {
      setHasUnsavedChanges(true)
      setStatus('pending')

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Schedule save
      timeoutRef.current = setTimeout(() => {
        performSave()
      }, debounceMs)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [responses, responseId, enabled, debounceMs, performSave])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && responseIdRef.current) {
        // Try to save synchronously
        const responsesJson = JSON.stringify(responsesRef.current)
        if (responsesJson !== lastSavedResponsesRef.current) {
          // Show browser warning
          e.preventDefault()
          e.returnValue = ''
        }
      }
    }

    // Use visibilitychange to save when user leaves tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        performSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    lastSavedAt,
    hasUnsavedChanges,
    saveNow,
    error,
  }
}
