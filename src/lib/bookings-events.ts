'use client'

import { useEffect } from 'react'

// Lightweight cross-page / cross-tab event bus for booking mutations.
//
// When a booking or session is closed, cancelled, reopened, rescheduled
// or deleted on ONE surface (e.g. the patient detail Sessions tab), the
// other open surfaces (e.g. /bookings, /dashboard) were displaying
// stale state until the user manually refreshed. This util fires a
// single event after every mutation so every listening surface
// refetches.
//
// Two channels:
//   - `window` CustomEvent for same-tab listeners (cheap, synchronous)
//   - `BroadcastChannel` for cross-tab listeners (separate tabs of
//     the care app stay in sync without a hard refresh)

const EVENT_NAME = 'bloomsline:bookings-changed'
const CHANNEL_NAME = 'bloomsline-bookings'

export function emitBookingsChanged(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  } catch {
    // ignore — non-DOM context
  }
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME)
    bc.postMessage({ ts: Date.now() })
    bc.close()
  } catch {
    // ignore — BroadcastChannel may not be supported (older Safari, etc.)
  }
}

export function useBookingsChanged(handler: () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onEvent = () => handler()
    window.addEventListener(EVENT_NAME, onEvent)

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel(CHANNEL_NAME)
      bc.addEventListener('message', onEvent)
    } catch {
      // ignore
    }

    // Also refetch when the tab regains focus — catches the case where
    // a user mutates on one tab, switches to another tab that was
    // already open, without explicit cross-tab broadcast having fired
    // (e.g. an older browser or a closed BroadcastChannel).
    const onVisibility = () => {
      if (document.visibilityState === 'visible') handler()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener(EVENT_NAME, onEvent)
      if (bc) {
        bc.removeEventListener('message', onEvent)
        bc.close()
      }
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [handler])
}
