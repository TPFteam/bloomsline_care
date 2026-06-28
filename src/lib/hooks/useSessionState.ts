import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Like useState, but persisted to sessionStorage so the value survives
 * navigating away and back (tab switches) within the same browser session.
 * It clears automatically when the tab/window closes, and can be wiped on
 * logout via clearSessionState() — so it's "remember while I'm working,"
 * not forever (which is what localStorage would do).
 *
 * SSR-safe: starts from `initial` on first render (matching the server),
 * then loads the stored value on mount to avoid hydration mismatches.
 */
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial)
  // Skip persisting on the very first commit so we don't overwrite the stored
  // value with `initial` before the load effect has had a chance to read it.
  const skipPersist = useRef(true)

  // Load any persisted value once on mount (client only).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (raw !== null) setState(JSON.parse(raw) as T)
    } catch {
      /* ignore malformed/unavailable storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Persist on every change after the initial mount.
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* ignore quota/unavailable storage */
    }
  }, [key, state])

  return [state, setState]
}

/** Clear all session-persisted filter state (call on logout). */
export function clearSessionState(prefix?: string) {
  try {
    if (!prefix) return sessionStorage.clear()
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => sessionStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
