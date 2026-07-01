'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Check, X, Clock, Mail, Loader2, Video, Building2, ArrowRight, Palette, FileText, CheckCircle2, Hourglass, CalendarClock, AlertCircle, XCircle, Ban, Plus, Sparkles, Trash2, MoreHorizontal, RefreshCw, MessageCircle } from 'lucide-react'

// Calendar event palette — mirrors SessionDotLegend's STATUS_VISUAL hues so the
// SAME colours mean the same thing everywhere (dots + calendar):
//   scheduled=blue · awaiting=amber · pending=amber · completed=green ·
//   cancelled=red · no_show=gray. Google (external) gets its own violet so it
//   never clashes with a status colour.
// Modern minimal event chip: a clean flat soft-tinted fill, no borders.
// `bg` = light fill, `text` = label colour, `ring` = subtle select highlight.
function calStatusVisual(isGoogle: boolean, status: string | undefined, isPast: boolean) {
  if (isGoogle) return { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-300', Icon: CalendarClock, showIcon: true }
  if (status === 'pending') return { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-300', Icon: Hourglass, showIcon: true }
  if (status === 'completed') return { bg: 'bg-emerald-50', text: 'text-emerald-800', ring: 'ring-emerald-300', Icon: CheckCircle2, showIcon: true }
  if (status === 'cancelled') return { bg: 'bg-rose-50/70', text: 'text-rose-600', ring: 'ring-rose-300', Icon: XCircle, showIcon: true }
  if (status === 'no_show') return { bg: 'bg-gray-50', text: 'text-gray-500', ring: 'ring-gray-300', Icon: Ban, showIcon: true }
  // confirmed: past start + not closed = "needs outcome" (orange); else scheduled (blue)
  if (isPast) return { bg: 'bg-orange-50', text: 'text-orange-800', ring: 'ring-orange-300', Icon: AlertCircle, showIcon: true }
  return { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-300', Icon: CalendarClock, showIcon: true }
}

// Status header for the event popover — a solid top bar + a clear label so the
// practitioner reads the status instantly, without needing the legend.
function calStatusHeader(isGoogle: boolean, status: string | undefined, isPast: boolean) {
  if (isGoogle) return { borderT: 'border-t-violet-500', tint: 'bg-violet-50', text: 'text-violet-700', Icon: CalendarClock, en: 'Google Calendar', fr: 'Google Agenda' }
  if (status === 'pending') return { borderT: 'border-t-amber-400', tint: 'bg-amber-50', text: 'text-amber-700', Icon: Hourglass, en: 'Needs approval', fr: 'À approuver' }
  if (status === 'completed') return { borderT: 'border-t-emerald-500', tint: 'bg-emerald-50', text: 'text-emerald-700', Icon: CheckCircle2, en: 'Completed', fr: 'Terminé' }
  if (status === 'cancelled') return { borderT: 'border-t-rose-500', tint: 'bg-rose-50', text: 'text-rose-700', Icon: XCircle, en: 'Cancelled', fr: 'Annulé' }
  if (status === 'no_show') return { borderT: 'border-t-gray-400', tint: 'bg-gray-100', text: 'text-gray-600', Icon: Ban, en: 'No-show', fr: 'Absence' }
  if (isPast) return { borderT: 'border-t-orange-500', tint: 'bg-orange-50', text: 'text-orange-700', Icon: AlertCircle, en: 'Needs outcome', fr: 'À clôturer' }
  return { borderT: 'border-t-blue-500', tint: 'bg-blue-50', text: 'text-blue-700', Icon: CalendarClock, en: 'Scheduled', fr: 'Planifié' }
}
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser-client'
import { getCancelReasonGroups } from '@/lib/sessions/close-reasons'
import { buildBookingWaUrl, openWhatsApp } from '@/lib/whatsapp'
import { emitBookingsChanged, useBookingsChanged } from '@/lib/bookings-events'
import { PaymentBadge } from '@/components/ui/payment-badge'
import { useLanguage } from '@/lib/i18n/context'
import { SessionPrepDrawer } from '@/components/SessionPrepDrawer'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  source: 'booking' | 'google'
  status?: string
  email?: string
  sessionType?: string
  notes?: string
  meetLink?: string | null
  paymentStatus?: 'paid' | 'unpaid'
  bookingId?: string
  memberId?: string | null
  phone?: string | null
  timezone?: string | null
}

interface WeekCalendarViewProps {
  bookings: Array<{
    id: string
    client_name: string
    client_email: string
    client_phone?: string | null
    start_time: string
    end_time: string
    timezone?: string
    status: string
    session_type: string
    notes: string | null
    google_event_id?: string | null
    meet_link?: string | null
    payment_status?: string | null
    member_id?: string | null
  }>
  onApprove?: (id: string) => void
  onReject?: (id: string, cancellationReason?: string) => void
  // Permanently delete an event (silent — for mistakes/duplicates).
  onDelete?: (id: string) => void
  processingId?: string | null
  onSlotClick?: (day: Date, time: string, options?: { outsideHours?: boolean }) => void
  // When true, the toolbar (legend / week nav / Today / Availability)
  // is skipped entirely — only the day strip + time grid render.
  hideToolbar?: boolean
  // When true, render the toolbar but skip the legend chips on its
  // left side. Keeps week navigation, Today, timezone, and
  // Availability. Used by the dashboard embed where the legend is
  // noise but the practitioner still needs to navigate weeks.
  hideLegend?: boolean
  // Show availability (per-day format icons, shading, hover-to-book) by
  // default on mount. ON for the full Bookings calendar; left OFF for the
  // dashboard mini-calendar so it doesn't fire the heavy per-day
  // available-slots requests on every dashboard load.
  defaultShowAvailability?: boolean
  // Override for the internal grid's max-height (default 560). The
  // dashboard embed sets a smaller value to keep the widget at the
  // same height as a populated "Up next" list.
  gridMaxHeight?: number
  // Predicate from the parent that tells us whether a given booking
  // id already has a saved session_summary note. Parent encapsulates
  // the key-matching logic so this component doesn't have to
  // duplicate the (member_id, scheduled_at) minute-precision pairing.
  hasNotesForBooking?: (bookingId: string) => boolean
  // Open the floating notes editor for a specific booking. Parent
  // resolves bookingId → Booking and calls into the shared
  // handleTakeNotes flow.
  onTakeNotes?: (bookingId: string) => void
  // Opens the close-session flow for a booking. `outcome` pre-selects
  // Show / No-show (the practitioner clicked it directly on the row), so
  // the popup skips the "How did it go?" step. Omitted = edit close.
  onCloseSession?: (bookingId: string, outcome?: 'show' | 'no_show') => void
  // Reschedule a booking — opens the parent's reschedule flow.
  onReschedule?: (bookingId: string) => void
  // Delete a booking — opens the parent's delete-confirm flow (with the
  // recurring-series this/following scope).
  onDeleteRequest?: (bookingId: string) => void
  // Optional controlled week (so an external mini-calendar can drive it).
  // Falls back to internal state when omitted.
  weekStart?: Date
  onWeekStartChange?: (d: Date) => void
  // Make the grid fill the viewport height (full-screen calendar) instead of
  // the fixed gridMaxHeight.
  fillViewport?: boolean
  // Claim an unlinked Google event into Bloomsline (opens the claim flow in
  // the parent — typically the rail's UnclaimedGoogleEventsCard). Called with
  // the Google event id.
  onAddToBloomsline?: (ev: { googleEventId: string; title: string; startTime: string; endTime: string; email?: string }) => void
  // Master switch for the WhatsApp click-to-send action in the event popup.
  // When off, the "Notify on WhatsApp" item is hidden entirely.
  whatsappEnabled?: boolean
  // Practitioner's name — used to personalize the pre-filled WhatsApp message.
  practitionerName?: string
}

const HOUR_HEIGHT = 56
const START_HOUR = 7
const END_HOUR = 24 // through midnight so evening sessions + the now-line show
const TOTAL_HOURS = END_HOUR - START_HOUR

export function WeekCalendarView({ bookings, onApprove, onReject, onDelete, processingId, onSlotClick, hideToolbar, hideLegend, defaultShowAvailability = false, gridMaxHeight, hasNotesForBooking, onTakeNotes, onCloseSession, onReschedule, onDeleteRequest, weekStart: controlledWeekStart, onWeekStartChange, fillViewport, onAddToBloomsline, whatsappEnabled = false, practitionerName }: WeekCalendarViewProps) {
  const { locale } = useLanguage()
  // Session-prep drawer (opens from the event popover for upcoming sessions).
  const [prepEvent, setPrepEvent] = useState<CalendarEvent | null>(null)
  const supabase = createClient()
  const [internalWeekStart, setInternalWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  // Controlled when a parent passes weekStart (mini-calendar); else internal.
  const weekStart = controlledWeekStart ?? internalWeekStart
  const setWeekStart = (updater: Date | ((prev: Date) => Date)) => {
    const next = typeof updater === 'function' ? (updater as (p: Date) => Date)(weekStart) : updater
    if (onWeekStartChange) onWeekStartChange(next)
    else setInternalWeekStart(next)
  }
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  // The ⋮ action menu inside the event popover (reschedule / delete).
  const [eventMenuOpen, setEventMenuOpen] = useState(false)
  // Event popover positioning. We anchor to the clicked event's viewport rect
  // and render the popover `fixed`, flipping above / clamping so it always
  // stays fully on screen (low events used to open off the bottom edge).
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null)
  // Which event is mid-"are you sure?" for an appointment cancellation — so a
  // single click can't fire an irreversible patient-notifying cancel.
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const openEventPopover = (eventId: string, isSelected: boolean, e: React.MouseEvent) => {
    const willOpen = !isSelected
    setAnchorRect(willOpen ? (e.currentTarget as HTMLElement).getBoundingClientRect() : null)
    setPopoverPos(null)
    setCancelConfirmId(null)
    setCancelReason('')
    setDeleteConfirmId(null)
    setEventMenuOpen(false)
    setSelectedEvent(willOpen ? eventId : null)
  }
  useLayoutEffect(() => {
    if (!selectedEvent || !anchorRect) { setPopoverPos(null); return }
    const el = popoverRef.current
    if (!el) return
    const M = 8 // viewport margin
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = el.offsetWidth || 256
    const h = el.offsetHeight
    const left = Math.max(M, Math.min(anchorRect.left, vw - w - M))
    const spaceBelow = vh - anchorRect.bottom - M
    const spaceAbove = anchorRect.top - M
    let top: number
    let maxHeight: number
    if (h + 4 <= spaceBelow || spaceBelow >= spaceAbove) {
      top = anchorRect.bottom + 4
      maxHeight = vh - top - M
    } else {
      maxHeight = spaceAbove - 4
      top = Math.max(M, anchorRect.top - 4 - Math.min(h, maxHeight))
    }
    setPopoverPos({ top, left, maxHeight: Math.max(140, maxHeight) })
  }, [selectedEvent, anchorRect])
  const [practitionerTz, setPractitionerTz] = useState<string | null>(null)
  const [dayFormats, setDayFormats] = useState<Record<number, string[]>>({})
  // Availability (per-day format icons, shading, hover-to-book) shows by
  // default on the full Bookings calendar; the dashboard mini-calendar leaves
  // it off to avoid firing the heavy per-day available-slots requests.
  const [showAvailability, setShowAvailability] = useState(defaultShowAvailability)
  const [legendOpen, setLegendOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  // The day's working-hours windows from the API — used to colour/shade working
  // hours independently of which slots are free, past, or booked.
  const [availWindows, setAvailWindows] = useState<Record<string, Array<{ start: string; end: string }>>>({})
  const [availLoading, setAvailLoading] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  // The hour (in the practitioner's grid) the cursor is over → drives the
  // single 1-hour booking preview that follows the mouse.
  const [hoverHour, setHoverHour] = useState<number | null>(null)
  const [clickHint, setClickHint] = useState<{ x: number; y: number; key: string } | null>(null)

  useEffect(() => {
    if (!clickHint) return
    const t = setTimeout(() => setClickHint(null), 2500)
    return () => clearTimeout(t)
  }, [clickHint])

  // Fetch practitioner timezone + day formats
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase
        .from('availability_schedules')
        .select('timezone, day_of_week, session_format')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .then(({ data }) => {
          if (!data || data.length === 0) return
          setPractitionerTz(data[0].timezone)
          const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
          const dfMap: Record<number, string[]> = {}
          for (const d of data) {
            const num = dayMap[d.day_of_week]
            const fmt = (d as any).session_format || 'both'
            if (!dfMap[num]) dfMap[num] = []
            if (fmt === 'both') {
              if (!dfMap[num].includes('in_person')) dfMap[num].push('in_person')
              if (!dfMap[num].includes('video')) dfMap[num].push('video')
            } else {
              if (!dfMap[num].includes(fmt)) dfMap[num].push(fmt)
            }
          }
          setDayFormats(dfMap)
        })
    })
  }, [])

  // Helper: get hours/minutes in practitioner's timezone
  const getHoursInTz = (isoStr: string): number => {
    const d = new Date(isoStr)
    const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
    const h = parseInt(d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }))
    const m = parseInt(d.toLocaleString('en-US', { timeZone: tz, minute: '2-digit' }))
    return (h === 24 ? 0 : h) + m / 60
  }

  // True when hour `h` falls inside any of the day's working-hours windows.
  // Derived from the schedule (not free slots), so booked/past hours still
  // count as working hours.
  const isWorkingHour = (day: Date, h: number): boolean => {
    const wins = availWindows[format(day, 'yyyy-MM-dd')] || []
    return wins.some(w => {
      const ws = getHoursInTz(w.start)
      const we = getHoursInTz(w.end)
      return h >= ws && h < we
    })
  }

  const formatTimeInTz = (isoStr: string): string => {
    const d = new Date(isoStr)
    const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
    return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: locale !== 'fr',
    })
  }

  const isSameDayInTz = (isoStr: string, day: Date): boolean => {
    const tz = practitionerTz || Intl.DateTimeFormat().resolvedOptions().timeZone
    const d = new Date(isoStr)
    const eventDate = d.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
    const dayDate = format(day, 'yyyy-MM-dd')
    return eventDate === dayDate
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchGoogleEvents = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const start = weekStart.toISOString()
      const end = addDays(weekStart, 7).toISOString()
      const res = await fetch(`/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGoogleConnected(data.connected)
        setGoogleEvents((data.events || []).map((e: any) => ({ ...e, source: 'google' as const, meetLink: e.meetLink || null })))
      }
    } catch { /* silent */ }
  }, [weekStart])

  useEffect(() => { fetchGoogleEvents() }, [fetchGoogleEvents])

  // Refetch Google events whenever a booking changes (delete / reschedule /
  // cancel). Without this, a deleted booking's still-cached Google event
  // resurfaces as an unclaimed "Add to Bloomsline" phantom until a page
  // refresh. The server-side delete already removed it from Google, so the
  // refetch simply drops it from the calendar.
  useBookingsChanged(() => { fetchGoogleEvents() })

  // Sync check: cancel bookings that were removed from Google Calendar
  useEffect(() => {
    fetch('/api/calendar/sync-check', { method: 'POST' }).catch(() => {})
  }, [])

  // Reconcile moved events: if a Google event shares its id with a booking but
  // has been rescheduled to a new time, move the booking (and its session) to
  // follow it. Only auto-syncs ids that appear once among the Google events, so
  // recurring series (instances fighting over one booking) are left alone.
  useEffect(() => {
    if (googleEvents.length === 0 || bookings.length === 0) return
    const idCount = new Map<string, number>()
    for (const e of googleEvents) if (e.id) idCount.set(e.id, (idCount.get(e.id) || 0) + 1)
    const bookingByGid = new Map(
      bookings.filter(b => b.google_event_id).map(b => [b.google_event_id as string, b]),
    )
    const moves: { id: string; oldStart: string; memberId: string | null; start: string; end: string }[] = []
    for (const e of googleEvents) {
      if (!e.id || idCount.get(e.id) !== 1) continue
      const b = bookingByGid.get(e.id)
      if (!b || b.status === 'cancelled') continue
      const bMin = Math.floor(new Date(b.start_time).getTime() / 60000)
      const eMin = Math.floor(new Date(e.start).getTime() / 60000)
      if (bMin !== eMin) moves.push({ id: b.id, oldStart: b.start_time, memberId: b.member_id ?? null, start: e.start, end: e.end })
    }
    if (moves.length === 0) return
    let cancelled = false
    ;(async () => {
      for (const m of moves) {
        await supabase.from('bookings').update({ start_time: m.start, end_time: m.end, updated_at: new Date().toISOString() }).eq('id', m.id)
        if (m.memberId) {
          await supabase.from('sessions').update({ scheduled_at: m.start, updated_at: new Date().toISOString() }).eq('member_id', m.memberId).eq('scheduled_at', m.oldStart)
        }
      }
      if (!cancelled) emitBookingsChanged()
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleEvents, bookings])

  // Fetch available slots for visible week
  useEffect(() => {
    if (!showAvailability || !userId) { setAvailWindows({}); return }
    const fetchSlots = async () => {
      setAvailLoading(true)
      const windows: Record<string, Array<{ start: string; end: string }>> = {}
      await Promise.all(days.map(async (day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        try {
          const res = await fetch(`/api/bookings/available-slots?practitionerId=${userId}&date=${dateStr}&duration=60&skipNotice=true`)
          if (res.ok) {
            const data = await res.json()
            windows[dateStr] = (data.scheduleWindows || []).map((w: any) => ({ start: w.start, end: w.end }))
          }
        } catch { /* silent */ }
      }))
      setAvailWindows(windows)
      setAvailLoading(false)
    }
    fetchSlots()
  }, [showAvailability, weekStart, userId, dayFormats])


  // Show every status (incl. cancelled / no-show) so the calendar reflects the
  // full picture — they're rendered muted + struck-through and coloured red/gray.
  const bookingEvents: CalendarEvent[] = bookings
    .map(b => ({ id: b.id, title: b.client_name, start: b.start_time, end: b.end_time, source: 'booking' as const, status: b.status, email: b.client_email, phone: b.client_phone || null, timezone: b.timezone || null, sessionType: b.session_type, notes: b.notes || undefined, meetLink: b.meet_link, paymentStatus: (b.payment_status || 'unpaid') as 'paid' | 'unpaid', bookingId: b.id, memberId: b.member_id || null }))

  // Deduplicate: remove Google Calendar events that are already a Bloomsline
  // booking. A Google event is a duplicate if EITHER its google_event_id matches
  // a booking's (the reliable signal — survives reschedules / recurring instances
  // that share a base id) OR its start time matches a booking's (covers older
  // rows that linked by time only). The id check is what stops an already-linked
  // event from still showing "Add to Bloomsline" after it was moved in Google.
  const bookingGoogleIds = new Set(
    bookings.map(b => b.google_event_id).filter((id): id is string => !!id)
  )
  const bookingStartTimes = new Set(
    bookings
      .filter(b => b.google_event_id)
      .map(b => Math.floor(new Date(b.start_time).getTime() / 60000)) // round to minute
  )
  const dedupedGoogleEvents = googleEvents.filter(e => {
    if (e.id && bookingGoogleIds.has(e.id)) return false
    const startMin = Math.floor(new Date(e.start).getTime() / 60000)
    return !bookingStartTimes.has(startMin)
  })

  const allEvents = [...bookingEvents, ...dedupedGoogleEvents]
  const getEventsForDay = (day: Date) => allEvents.filter(e => isSameDayInTz(e.start, day))

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = getHoursInTz(event.start)
    const endHour = getHoursInTz(event.end)
    return {
      top: (startHour - START_HOUR) * HOUR_HEIGHT,
      height: Math.max((endHour - startHour) * HOUR_HEIGHT, 28),
    }
  }

  // Detect overlaps and assign columns
  const layoutEvents = (events: CalendarEvent[]) => {
    const sorted = [...events].sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
    const positioned: Array<CalendarEvent & { col: number; totalCols: number }> = []

    for (const event of sorted) {
      const eStart = parseISO(event.start).getTime()
      const eEnd = parseISO(event.end).getTime()

      // Find overlapping events already placed
      const overlapping = positioned.filter(p => {
        const pStart = parseISO(p.start).getTime()
        const pEnd = parseISO(p.end).getTime()
        return eStart < pEnd && eEnd > pStart
      })

      const usedCols = new Set(overlapping.map(o => o.col))
      let col = 0
      while (usedCols.has(col)) col++

      positioned.push({ ...event, col, totalCols: 1 })

      // Update totalCols for all overlapping events
      const group = [...overlapping, positioned[positioned.length - 1]]
      const maxCol = Math.max(...group.map(g => g.col)) + 1
      group.forEach(g => { g.totalCols = maxCol })
    }

    return positioned
  }

  const todayCheck = (day: Date) => isSameDay(day, new Date())
  // "Now" position (in the practitioner's tz) for the red current-time line.
  const nowHours = getHoursInTz(new Date().toISOString())

  // On mount, scroll the grid so the current time is in view (Google-style),
  // instead of starting at the top (7 AM) with the evening off-screen.
  const gridScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = gridScrollRef.current
    if (!el) return
    const h = getHoursInTz(new Date().toISOString())
    el.scrollTop = Math.max(0, (h - START_HOUR - 1.5) * HOUR_HEIGHT)
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header — toolbar with legend, week nav, Today, Availability.
          hideToolbar drops the whole bar; hideLegend keeps the bar
          but drops the legend chips (used by the dashboard embed). */}
      {!hideToolbar && (
      // hideLegend reverses the row so the nav controls slot to the
      // left and the right edge stays free for the dashboard embed's
      // expand button.
      <div className={`flex items-center justify-between px-6 py-4 ${hideLegend ? 'flex-row-reverse' : ''}`}>
        {/* Legend — "Confirmed" entry dropped; confirmed is the default
            state and the dedicated label was confusing alongside the
            "Completed" tag we use post-session. */}
        {hideLegend ? <div /> : (
        // Collapsed legend — palette icon opens a small popover with
        // the color key. Keeps the toolbar uncluttered while still
        // exposing what each color means on demand.
        <div className="relative">
          <button
            type="button"
            onClick={() => setLegendOpen(o => !o)}
            title={locale === 'fr' ? 'Légende des couleurs' : 'Color legend'}
            aria-label={locale === 'fr' ? 'Légende des couleurs' : 'Color legend'}
            aria-expanded={legendOpen}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              legendOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>
          {legendOpen && (
            <>
              {/* Click-away catcher */}
              <button
                type="button"
                onClick={() => setLegendOpen(false)}
                aria-hidden
                tabIndex={-1}
                className="fixed inset-0 z-30 cursor-default"
              />
              <div className="absolute top-full left-0 mt-2 z-40 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                  {locale === 'fr' ? 'Légende' : 'Legend'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-blue-50 border border-blue-400 flex items-center justify-center shrink-0">
                    <CalendarClock className="w-2.5 h-2.5 text-blue-600" />
                  </span>
                  {locale === 'fr' ? 'Prévue' : 'Scheduled'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-orange-50 border border-orange-500 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-2.5 h-2.5 text-orange-600" />
                  </span>
                  {locale === 'fr' ? 'À clôturer' : 'Needs outcome'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center shrink-0">
                    <Hourglass className="w-2.5 h-2.5 text-amber-500" />
                  </span>
                  {locale === 'fr' ? 'À approuver' : 'Needs approval'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  </span>
                  {locale === 'fr' ? 'Terminée' : 'Completed'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-rose-50 border border-rose-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-2.5 h-2.5 text-rose-600" />
                  </span>
                  {locale === 'fr' ? 'Annulée' : 'Cancelled'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-gray-100 border border-gray-400 flex items-center justify-center shrink-0">
                    <Ban className="w-2.5 h-2.5 text-gray-500" />
                  </span>
                  {locale === 'fr' ? 'Absent' : 'No-show'}
                </div>
                {googleConnected && (
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-violet-50 border border-violet-400 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-2.5 h-2.5 text-violet-600" />
                    </span>
                    Google Calendar
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-white border border-dashed border-gray-400 shrink-0" />
                  {locale === 'fr' ? 'Hors horaires' : 'After-hours'}
                </div>
              </div>
            </>
          )}
        </div>
        )}
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(prev => addDays(prev, -7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h3 className="text-sm font-semibold text-gray-800">
            {format(weekStart, locale === 'fr' ? 'd MMM' : 'MMM d', { locale: locale === 'fr' ? frLocale : undefined })} — {format(addDays(weekStart, 6), locale === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: locale === 'fr' ? frLocale : undefined })}
          </h3>
          <button onClick={() => setWeekStart(prev => addDays(prev, 7))} className="w-9 h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors">
            {locale === 'fr' ? "Aujourd'hui" : 'Today'}
          </button>
          {practitionerTz && (
            <span className="text-[11px] text-gray-400 ml-1">
              ({practitionerTz.replace(/_/g, ' ').split('/').pop()})
            </span>
          )}
          {availLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300 ml-1" />
          )}
        </div>
      </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-t border-gray-100">
        <div />
        {days.map(day => (
          <div key={day.toISOString()} className="py-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{format(day, 'EEE', { locale: locale === 'fr' ? frLocale : undefined })}</p>
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${todayCheck(day) ? 'bg-teal-600 text-white' : 'text-gray-800'}`}>
              <span className="text-sm font-semibold">{format(day, 'd')}</span>
            </div>
            {dayFormats[day.getDay()] && (
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {dayFormats[day.getDay()].includes('video') && (
                  <div className="w-4 h-4 rounded bg-blue-50 flex items-center justify-center" title={locale === 'fr' ? 'Vidéo' : 'Video'}>
                    <Video className="w-2.5 h-2.5 text-blue-400" />
                  </div>
                )}
                {dayFormats[day.getDay()].includes('in_person') && (
                  <div className="w-4 h-4 rounded bg-amber-50 flex items-center justify-center" title={locale === 'fr' ? 'En personne' : 'In person'}>
                    <Building2 className="w-2.5 h-2.5 text-amber-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative">
      {showAvailability && availLoading && (
        <div className="absolute inset-x-0 top-2 z-40 pointer-events-none flex items-start justify-center">
          <div className="bg-white shadow-md border border-gray-200 rounded-full px-3.5 py-1.5 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span className="text-[11px] font-medium text-gray-600">
              {locale === 'fr' ? 'Chargement des disponibilités…' : 'Loading availability…'}
            </span>
          </div>
        </div>
      )}
      <div ref={gridScrollRef} className="grid grid-cols-[56px_repeat(7,1fr)] overflow-y-auto border-t border-gray-100" style={{ maxHeight: fillViewport ? 'calc(100vh - 240px)' : `${gridMaxHeight ?? 560}px` }}>
        <div>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div key={i} className="flex items-start justify-end pr-3 pt-0.5" style={{ height: HOUR_HEIGHT }}>
              <span className="text-[10px] text-gray-300 font-medium">{format(new Date(2000, 0, 1, START_HOUR + i), 'h a')}</span>
            </div>
          ))}
        </div>

        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const today = todayCheck(day)
          const laid = layoutEvents(dayEvents)

          return (
            <div
              key={day.toISOString()}
              onMouseEnter={() => setHoveredDay(day.toISOString())}
              onMouseMove={(e) => {
                if (!showAvailability) return
                const rect = e.currentTarget.getBoundingClientRect()
                const h = Math.min(END_HOUR - 1, Math.max(START_HOUR, START_HOUR + Math.floor((e.clientY - rect.top) / HOUR_HEIGHT)))
                if (hoveredDay !== day.toISOString()) setHoveredDay(day.toISOString())
                if (h !== hoverHour) setHoverHour(h)
              }}
              onMouseLeave={() => { setHoveredDay(prev => prev === day.toISOString() ? null : prev); setHoverHour(null) }}
              className={`relative border-l border-gray-50 ${today ? 'bg-teal-50/20' : ''} ${onSlotClick ? 'cursor-pointer' : ''}`}
              style={{ touchAction: onSlotClick ? 'manipulation' : undefined }}
              onClick={(e) => {
                if (!onSlotClick) return
                if ((e.target as HTMLElement).closest('[data-event]')) return
                // First click reveals availability (loads working hours);
                // after that, clicking books the hovered 1-hour slot.
                if (!showAvailability) { setShowAvailability(true); return }
                const rect = e.currentTarget.getBoundingClientRect()
                const h = Math.min(END_HOUR - 1, Math.max(START_HOUR, START_HOUR + Math.floor((e.clientY - rect.top) / HOUR_HEIGHT)))
                // Don't book over an existing event.
                if (dayEvents.some(ev => { const s = getHoursInTz(ev.start); const en = getHoursInTz(ev.end); return s < h + 1 && en > h })) return
                const inHrs = isWorkingHour(day, h)
                onSlotClick(day, `${String(h).padStart(2, '0')}:00`, inHrs ? undefined : { outsideHours: true })
              }}
            >
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
              ))}

              {/* Off-hours shading — working hours stay clean (so events keep
                  their colours), the rest is dimmed grey to mark "unavailable".
                  Computed as the complement of the day's working windows. */}
              {showAvailability && (() => {
                const dayStart = START_HOUR
                const dayEnd = START_HOUR + TOTAL_HOURS
                const wins = (availWindows[format(day, 'yyyy-MM-dd')] || [])
                  .map(w => ({ s: Math.max(getHoursInTz(w.start), dayStart), e: Math.min(getHoursInTz(w.end), dayEnd) }))
                  .filter(w => w.e > w.s)
                  .sort((a, b) => a.s - b.s)
                const off: Array<{ s: number; e: number }> = []
                let cursor = dayStart
                for (const w of wins) {
                  if (w.s > cursor) off.push({ s: cursor, e: w.s })
                  cursor = Math.max(cursor, w.e)
                }
                if (cursor < dayEnd) off.push({ s: cursor, e: dayEnd })
                return off.map((seg, i) => (
                  <div
                    key={`off-${i}`}
                    className="absolute inset-x-0 bg-gray-400/[0.07] pointer-events-none z-0"
                    style={{ top: (seg.s - dayStart) * HOUR_HEIGHT, height: (seg.e - seg.s) * HOUR_HEIGHT }}
                  />
                ))
              })()}

              {/* Current-time line (today only) — the Google-style red marker. */}
              {today && nowHours >= START_HOUR && nowHours <= START_HOUR + TOTAL_HOURS && (
                <div className="pointer-events-none absolute inset-x-0 z-30" style={{ top: (nowHours - START_HOUR) * HOUR_HEIGHT }}>
                  <div className="relative border-t-2 border-red-500">
                    <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                </div>
              )}

              {/* Inline hint: shown when practitioner clicks empty grid space
                  after availability is loaded — directs them to click a slot. */}
              {clickHint && clickHint.key === day.toISOString() && !availLoading && (
                <div
                  className="absolute z-40 pointer-events-none animate-in fade-in duration-150"
                  style={{
                    left: Math.min(Math.max(clickHint.x, 8), 240),
                    top: clickHint.y + 8,
                  }}
                >
                  <div className="bg-gray-900 text-white text-[10.5px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    {locale === 'fr'
                      ? 'Cliquez sur un créneau disponible'
                      : 'Click an available slot to schedule'}
                  </div>
                </div>
              )}

              {/* Single hover preview — a 1-hour slot wherever the cursor is.
                  Teal in working hours, grey "Hors horaires" after hours,
                  hidden over an existing booking. Click anywhere books it. */}
              {showAvailability && hoveredDay === day.toISOString() && hoverHour != null && (() => {
                const h = hoverHour
                if (dayEvents.some(ev => { const s = getHoursInTz(ev.start); const en = getHoursInTz(ev.end); return s < h + 1 && en > h })) return null
                const inHrs = isWorkingHour(day, h)
                const endLabel = (h + 1) === 24 ? '00' : String(h + 1).padStart(2, '0')
                return (
                  <div
                    className={`absolute left-1 right-1 rounded-lg overflow-hidden pointer-events-none shadow-lg z-[8] ${inHrs ? 'bg-teal-500 border border-teal-600' : 'bg-gray-700 border border-gray-700'}`}
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT + 1, height: HOUR_HEIGHT - 2 }}
                  >
                    <div className="flex items-center gap-1 px-2 pt-1.5">
                      {!inHrs && <Clock className="w-2.5 h-2.5 shrink-0 text-white/80" />}
                      <span className="text-[10px] font-semibold text-white truncate">{`${String(h).padStart(2, '0')}:00 → ${endLabel}:00`}</span>
                    </div>
                    <div className="px-2 pb-1">
                      <span className="text-[10px] text-white/80">{inHrs ? '60 min' : (locale === 'fr' ? '60 min · hors horaires' : '60 min · after-hours')}</span>
                    </div>
                  </div>
                )
              })()}

              {/* Events */}
              {laid.map(event => {
                const { top, height } = getEventPosition(event)
                const isGoogle = event.source === 'google'
                const isPending = event.status === 'pending'
                const isSelected = selectedEvent === event.id
                // "Closeable" from 30 min before the start: the practitioner can
                // mark Show / No-show then (a no-show is usually known by start
                // time). Before that window the event reads as upcoming (Cancel).
                const isPast = new Date(event.start).getTime() - 30 * 60 * 1000 < Date.now()
                const sv = calStatusVisual(isGoogle, event.status, isPast)
                const SvIcon = sv.Icon
                const sh = calStatusHeader(isGoogle, event.status, isPast)
                const ShIcon = sh.Icon
                // Cancelled / no-show → muted + struck so "didn't happen" reads instantly.
                const dim = event.status === 'cancelled' || event.status === 'no_show'
                const colWidth = 100 / event.totalCols
                const left = `${event.col * colWidth}%`
                const width = `${colWidth - 2}%`

                return (
                  <div key={event.id} data-event>
                    <div
                      onClick={(e) => openEventPopover(event.id, isSelected, e)}
                      className={`absolute rounded-lg px-2 py-1.5 overflow-hidden z-10 cursor-pointer transition-all ${sv.bg} ${sv.text} ${dim ? 'opacity-60' : ''} ${
                        isSelected ? `ring-1 ${sv.ring} shadow-md z-20` : 'hover:shadow-sm'
                      }`}
                      style={{ top, height: Math.max(height, 26), left: `calc(${left} + 4px)`, width: `calc(${width} - 2px)` }}
                    >
                      <p className="text-[11px] font-semibold truncate leading-tight flex items-center gap-1">
                        {sv.showIcon && <SvIcon className="w-3 h-3 shrink-0" />}
                        <span className={`truncate ${dim ? 'line-through' : ''}`}>{event.title}</span>
                      </p>
                      {height > 32 && (
                        <p className="text-[10px] opacity-60 truncate mt-0.5">
                          {formatTimeInTz(event.start)}
                        </p>
                      )}
                    </div>

                    {/* Popover */}
                    {isSelected && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSelectedEvent(null)} />
                        <div
                          ref={popoverRef}
                          className="fixed z-50 bg-white rounded-2xl shadow-xl shadow-gray-900/[0.08] border border-gray-100 w-64 overflow-y-auto"
                          style={{
                            top: popoverPos?.top ?? 0,
                            left: popoverPos?.left ?? 0,
                            maxHeight: popoverPos?.maxHeight,
                            visibility: popoverPos ? 'visible' : 'hidden',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Header — status pill + name + view profile. The
                              colored top edge (above) + this pill make the
                              status clear without the legend. */}
                          <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${sh.text}`}>
                                <ShIcon className="w-3 h-3" />
                                {locale === 'fr' ? sh.fr : sh.en}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                {event.memberId && (
                                  <Link
                                    href={`/members/${event.memberId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-0.5 text-[11px] text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap"
                                  >
                                    {locale === 'fr' ? 'Profil' : 'Profile'}
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}
                                {/* Top delete icon — only when there's no ⋮ menu delete
                                    (e.g. dashboard mini-calendar). On the full Bookings
                                    calendar, Delete lives in the ⋮ menu instead. */}
                                {event.source === 'booking' && event.bookingId && onDelete && !onDeleteRequest && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(event.id); setCancelConfirmId(null) }}
                                    title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                                    aria-label={locale === 'fr' ? 'Supprimer' : 'Delete'}
                                    className="p-1 -m-1 text-gray-300 hover:text-rose-600 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="mb-1.5">
                              <p className="font-semibold text-gray-900 text-sm leading-tight break-words">{event.title}</p>
                            </div>
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatTimeInTz(event.start)} – {formatTimeInTz(event.end)}
                            </p>
                          </div>

                          {/* Delete confirm — destructive, so it asks first. */}
                          {deleteConfirmId === event.id && onDelete && event.bookingId && (
                            <div className="px-4 py-3 bg-rose-50/60 border-b border-rose-100 space-y-2">
                              <p className="text-[11px] text-gray-600 leading-snug">
                                {locale === 'fr'
                                  ? 'Supprimer définitivement cet événement ? Action irréversible.'
                                  : "Delete this event permanently? This can't be undone."}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null) }}
                                  className="flex-1 px-2 py-1.5 text-gray-600 border border-gray-200 hover:bg-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  {locale === 'fr' ? 'Garder' : 'Keep'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDelete(event.bookingId!); setDeleteConfirmId(null); setSelectedEvent(null) }}
                                  disabled={processingId === event.bookingId}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {locale === 'fr' ? 'Supprimer' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Body */}
                          <div className="px-4 py-3 space-y-2.5">
                            {/* Payment + session type — the status itself now
                                lives in the colored header above, so it's not
                                repeated here. */}
                            {(event.sessionType || (event.source === 'booking' && event.bookingId)) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {event.source === 'booking' && event.bookingId && (
                                  <PaymentBadge
                                    status={event.paymentStatus || 'unpaid'}
                                    table="bookings"
                                    recordId={event.bookingId}
                                    compact
                                    readOnly
                                  />
                                )}
                                {event.sessionType && (
                                  <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-medium capitalize">
                                    {event.sessionType.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Email */}
                            {event.email && (
                              <p className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{event.email}</span>
                              </p>
                            )}

                            {/* Quick actions — one row of icon buttons
                                (Join Meet · Session prep · Take notes). Labels
                                live in the tooltip / aria-label to keep the
                                popover compact. */}
                            {(() => {
                              const meetLabel = locale === 'fr' ? 'Rejoindre Google Meet' : 'Join Google Meet'
                              const prepLabel = locale === 'fr' ? 'Préparation' : 'Session prep'
                              const showPrep = event.source === 'booking' && event.memberId && event.status !== 'completed' && event.status !== 'cancelled' && event.status !== 'no_show'
                              const showNotes = event.source === 'booking' && event.bookingId && event.memberId && !!onTakeNotes
                              const hasNote = showNotes ? (hasNotesForBooking?.(event.bookingId!) ?? false) : false
                              const notesLabel = hasNote ? (locale === 'fr' ? 'Voir les notes' : 'View notes') : (locale === 'fr' ? 'Prendre des notes' : 'Take notes')
                              if (!event.meetLink && !showPrep && !showNotes) return null
                              return (
                                <div className="flex gap-2">
                                  {event.meetLink && (
                                    <a
                                      href={event.meetLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      title={meetLabel}
                                      aria-label={meetLabel}
                                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                    >
                                      <Video className="w-4 h-4" />
                                    </a>
                                  )}
                                  {showPrep && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setPrepEvent(event); setSelectedEvent(null) }}
                                      title={prepLabel}
                                      aria-label={prepLabel}
                                      className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors"
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </button>
                                  )}
                                  {showNotes && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); onTakeNotes!(event.bookingId!); setSelectedEvent(null) }}
                                      title={notesLabel}
                                      aria-label={notesLabel}
                                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                                        hasNote
                                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )
                            })()}

                            {/* Google source tag + claim action — these events
                                live only in Google, not Bloomsline yet, so offer
                                to attach them to a patient. */}
                            {isGoogle && (
                              <>
                                {onAddToBloomsline && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onAddToBloomsline({ googleEventId: event.id, title: event.title, startTime: event.start, endTime: event.end, email: event.email }); setSelectedEvent(null) }}
                                    className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    {locale === 'fr' ? 'Ajouter à Bloomsline' : 'Add to Bloomsline'}
                                  </button>
                                )}
                                <p className="text-[10px] text-blue-500">Google Calendar</p>
                              </>
                            )}

                            {/* Notes */}
                            {event.notes && (
                              <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2.5">{event.notes}</p>
                            )}
                          </div>

                          {/* Footer — actions */}
                          {isPending && onApprove && onReject && (
                            <div className="px-4 pb-3 pt-1 flex gap-2 border-t border-gray-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); onApprove(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 mt-2"
                              >
                                {processingId === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                {locale === 'fr' ? 'Accepter' : 'Approve'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onReject(event.id); setSelectedEvent(null) }}
                                disabled={processingId === event.id}
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 mt-2"
                              >
                                <X className="w-3 h-3" />
                                {locale === 'fr' ? 'Refuser' : 'Reject'}
                              </button>
                            </div>
                          )}

                          {/* Confirmed booking — time-aware actions.
                              Past  → record the outcome (Show / No-show). "Patient
                                      cancelled" lives inside No-show, so there's no
                                      separate Cancel here.
                              Future → call off the appointment (notifies the patient). */}
                          {event.status === 'confirmed' && event.source === 'booking' && (
                            <div className="px-4 pb-3 pt-2 border-t border-gray-100 space-y-2">
                              {isPast ? (
                                event.bookingId && onCloseSession && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onCloseSession(event.bookingId!, 'show'); setSelectedEvent(null) }}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {locale === 'fr' ? 'Présent' : 'Show'}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onCloseSession(event.bookingId!, 'no_show'); setSelectedEvent(null) }}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      {locale === 'fr' ? 'Absent' : 'No-show'}
                                    </button>
                                  </div>
                                )
                              ) : (
                                onReject && (
                                  cancelConfirmId === event.id ? (
                                    <div className="space-y-2">
                                      <p className="text-[11px] text-gray-500 leading-snug">
                                        {locale === 'fr'
                                          ? 'Annuler ce rendez-vous ? Le patient sera prévenu.'
                                          : 'Cancel this appointment? The patient will be notified.'}
                                      </p>
                                      <select
                                        value={cancelReason}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => { e.stopPropagation(); setCancelReason(e.target.value) }}
                                        className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                                      >
                                        <option value="" disabled>{locale === 'fr' ? 'Raison…' : 'Reason…'}</option>
                                        {getCancelReasonGroups(locale).map((group) => (
                                          <optgroup key={group.label} label={group.label}>
                                            {group.options.map(([value, label]) => (
                                              <option key={value} value={value}>{label}</option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setCancelConfirmId(null); setCancelReason('') }}
                                          className="flex-1 px-2 py-2 text-gray-600 border border-gray-200 hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors"
                                        >
                                          {locale === 'fr' ? 'Garder' : 'Keep'}
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onReject(event.id, cancelReason || undefined); setCancelConfirmId(null); setCancelReason(''); setSelectedEvent(null) }}
                                          disabled={processingId === event.id || !cancelReason}
                                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
                                        >
                                          {processingId === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                          {locale === 'fr' ? "Oui, annuler" : 'Yes, cancel'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setCancelConfirmId(event.id) }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-rose-600 border border-rose-200 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        {locale === 'fr' ? 'Annuler le rendez-vous' : 'Cancel appointment'}
                                      </button>
                                      {(onReschedule || onDeleteRequest) && event.bookingId && (
                                        <div className="relative">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setEventMenuOpen((v) => !v) }}
                                            className="px-2 py-2 text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                                            aria-label={locale === 'fr' ? "Plus d'actions" : 'More actions'}
                                          >
                                            <MoreHorizontal className="w-4 h-4" />
                                          </button>
                                          {eventMenuOpen && (
                                            <div
                                              className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {whatsappEnabled && event.phone && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    const url = buildBookingWaUrl({ phone: event.phone, locale, clientName: event.title, practitionerName, startIso: event.start, timezone: event.timezone, kind: 'confirmed' })
                                                    if (url) openWhatsApp(url)
                                                    setEventMenuOpen(false); setSelectedEvent(null)
                                                  }}
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                >
                                                  <MessageCircle className="w-3.5 h-3.5" />
                                                  {locale === 'fr' ? 'Notifier sur WhatsApp' : 'Notify on WhatsApp'}
                                                </button>
                                              )}
                                              {onReschedule && (
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); onReschedule(event.bookingId!); setEventMenuOpen(false); setSelectedEvent(null) }}
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                  <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                                                  {locale === 'fr' ? 'Reprogrammer' : 'Reschedule'}
                                                </button>
                                              )}
                                              {onDeleteRequest && (
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); onDeleteRequest(event.bookingId!); setEventMenuOpen(false); setSelectedEvent(null) }}
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                  {locale === 'fr' ? 'Supprimer' : 'Delete'}
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                )
                              )}
                            </div>
                          )}

                          {/* Closed booking (completed / cancelled / no-show): Edit close */}
                          {(event.status === 'completed' || event.status === 'cancelled' || event.status === 'no_show') && event.source === 'booking' && event.bookingId && onCloseSession && (
                            <div className="px-4 pb-3 pt-2 border-t border-gray-100">
                              <button
                                onClick={(e) => { e.stopPropagation(); onCloseSession(event.bookingId!); setSelectedEvent(null) }}
                                className="w-full flex items-center justify-center gap-1.5 px-2 py-2 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {locale === 'fr' ? 'Modifier la clôture' : 'Edit close'}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      </div>

      <SessionPrepDrawer
        isOpen={!!prepEvent}
        booking={prepEvent && prepEvent.memberId ? {
          member_id: prepEvent.memberId,
          client_name: prepEvent.title,
          start_time: prepEvent.start,
          session_type: prepEvent.sessionType || '',
        } : null}
        onClose={() => setPrepEvent(null)}
        locale={locale as 'en' | 'fr' | 'es'}
      />

    </div>
  )
}
