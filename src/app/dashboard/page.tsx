'use client'

// Bloomsline home page. Cut down from a 1.8k-line mix of activity feeds,
// templates, and quick-action cards to a focused three-zone layout:
//   1. Adaptive greeting + urgency chips (only what needs attention)
//   2. Up next list + click-to-expand mini week calendar
//   3. Compact quick-action row
//
// The previous /dashboard-preview route was the iteration sandbox for
// this — same layout, real data fetches.

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO, isToday, isTomorrow, isYesterday, isSameDay, startOfWeek, addDays } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, ChevronRight, UserPlus, Share2, Video, X,
  AlertCircle, ArrowUpRight, Sparkles, Loader2,
  Search, FileText, Send, Mail, Phone, Save,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { WeekCalendarView } from '@/components/bookings/WeekCalendarView'
import { ScheduleSessionModal } from '@/components/schedule-session-modal'
import { ConsentModal } from '@/components/consent-modal'
import { Button } from '@/components/ui/button'
import { PhoneInput } from '@/components/ui/phone-input'
import { useFloatingNotes } from '@/lib/floating-notes/context'
import { useBookingsChanged } from '@/lib/bookings-events'
import { FIXED_NOTE_TYPES, DEFAULT_NOTE_TYPES } from '@/types/member'
import type { User } from '@/types/user'

interface DashBooking {
  id: string
  practitioner_id: string
  member_id: string | null
  client_name: string
  client_email: string
  start_time: string
  end_time: string
  status: string
  session_type: string
  notes: string | null
  google_event_id?: string | null
  meet_link?: string | null
  payment_status?: string | null
}

function DashboardInner() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale, setLocale } = useLanguage()
  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en
  const { openFloat } = useFloatingNotes()

  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<DashBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [hasConsented, setHasConsented] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  // Slot-click prefill — mirrors the bookings page so a click on an
  // empty time slot in the full-calendar modal opens the schedule
  // modal with that date/time already set.
  const [calendarSlotBooking, setCalendarSlotBooking] = useState<{ date: Date; time: string; outsideHours?: boolean } | null>(null)
  const [sessionTypeMap, setSessionTypeMap] = useState<Record<string, { name: string; name_fr?: string }>>({})

  // Member list — feeds the picker for the Share-resource flow.
  type MemberLite = { id: string; first_name: string; last_name: string; status: string; last_session_at: string | null }
  const [members, setMembers] = useState<MemberLite[]>([])

  // Add Member modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [sendInvite, setSendInvite] = useState(true)
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] as string[] })
  const [savingMember, setSavingMember] = useState(false)
  const [memberGroups, setMemberGroups] = useState<{ id: string; name: string; color: string }[]>([])

  // Member picker (step 1 of the share-resource flow)
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [memberPickerAction, setMemberPickerAction] = useState<'share' | null>(null)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // Resource picker (step 2 of the share-resource flow)
  const [shareTargetMember, setShareTargetMember] = useState<{ id: string; first_name: string; last_name: string } | null>(null)
  const [showResourcePicker, setShowResourcePicker] = useState(false)
  const [resourcePickerSearch, setResourcePickerSearch] = useState('')
  const [resourcePickerList, setResourcePickerList] = useState<{ id: string; title: string; type: string; description: string | null; updated_at: string }[]>([])
  const [resourcePickerLoading, setResourcePickerLoading] = useState(false)
  const [resourcePickerSending, setResourcePickerSending] = useState<string | null>(null)

  // Recently-shared resources for the home-page widget (last 5 shares
  // joined with member name + resource title).
  type RecentShare = {
    id: string
    shared_at: string
    member_id: string
    member_first_name: string
    member_last_name: string
    resource_id: string
    resource_title: string
    resource_type: string | null
  }
  const [recentShares, setRecentShares] = useState<RecentShare[]>([])

  // Refetch bookings when any other surface (bookings page, patient
  // detail, another tab) mutates a booking or session. Keeps the
  // dashboard's Up next + "Notes à écrire" + Cette semaine views in
  // sync without requiring a manual refresh.
  useBookingsChanged(() => {
    if (!user?.id) return
    void (async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const horizonStart = addDays(weekStart, -14).toISOString()
      const horizonEnd = addDays(weekStart, 21).toISOString()
      const { data: bk } = await supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', user.id)
        .gte('start_time', horizonStart)
        .lt('start_time', horizonEnd)
        .order('start_time', { ascending: true })
      if (bk) setBookings(bk as DashBooking[])
    })()
  })

  // Keys of past sessions (member_id|start_time_ms) that already carry a
  // session_summary progress note. Used to compute the "Notes à écrire"
  // card so we only surface sessions still waiting for a write-up.
  const [notedSessionKeys, setNotedSessionKeys] = useState<Set<string>>(new Set())

  // Compose-note modal state — opened from the home composer line.
  const [showNoteComposer, setShowNoteComposer] = useState(false)
  const [noteComposerSearch, setNoteComposerSearch] = useState('')

  // Auth gate, profile bootstrap, consent state, then data fetch.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.replace('/sign-in'); return }
      if (cancelled) return

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (cancelled) return

      if (profile?.user_type === 'member') {
        router.replace('/home')
        return
      }

      const resolvedUser = (profile as User) || ({ id: authUser.id, email: authUser.email } as User)
      setUser(resolvedUser)
      setHasConsented(!!profile?.has_consented)
      if (profile?.preferred_language) setLocale(profile.preferred_language as any, false)

      // Open the Schedule Session modal directly when arriving with
      // ?action=schedule (back-compat with existing CTAs across the app).
      if (searchParams.get('action') === 'schedule') setShowSchedule(true)

      // Pull 14 days back + 21 days ahead so:
      //   - the mini calendar can render even on quiet weeks (forward)
      //   - the "Notes à écrire" card has past sessions to surface (back)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const horizonStart = addDays(weekStart, -14).toISOString()
      const horizonEnd = addDays(weekStart, 21).toISOString()
      const { data: bk } = await supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', authUser.id)
        .gte('start_time', horizonStart)
        .lt('start_time', horizonEnd)
        .order('start_time', { ascending: true })
      if (!cancelled && bk) setBookings(bk as DashBooking[])

      // Which past sessions already have a session_summary note? Build a
      // set of "member_id|start_time_ms" keys so the awaiting-notes
      // computation is a simple Set lookup against bookings.
      const noteWindowStart = addDays(new Date(), -14).toISOString()
      const nowIso = new Date().toISOString()
      const { data: pastSessions } = await supabase
        .from('sessions')
        .select('id, member_id, scheduled_at')
        .eq('practitioner_id', authUser.id)
        .gte('scheduled_at', noteWindowStart)
        .lt('scheduled_at', nowIso)
      if (!cancelled && pastSessions && pastSessions.length > 0) {
        const sessionIds = pastSessions.map((s: any) => s.id as string)
        const { data: notes } = await supabase
          .from('progress_notes')
          .select('session_id')
          .eq('note_type', 'session_summary')
          .in('session_id', sessionIds)
        const notedSessionIds = new Set((notes || []).map((n: any) => n.session_id as string))
        const keys = new Set(
          pastSessions
            .filter((s: any) => s.member_id && notedSessionIds.has(s.id))
            .map((s: any) => `${s.member_id}|${Math.floor(new Date(s.scheduled_at).getTime() / 1000)}`),
        )
        setNotedSessionKeys(keys)
      } else if (!cancelled) {
        setNotedSessionKeys(new Set())
      }

      // Practitioner's members — used by the Share-resource picker.
      const { data: membersData } = await supabase
        .from('members')
        .select('id, first_name, last_name, status, last_session_at')
        .eq('practitioner_id', authUser.id)
        .is('deleted_at', null)
        .order('first_name')
      if (!cancelled && membersData) setMembers(membersData as MemberLite[])

      // Last 5 shares — for the "Recent resources" widget under the
      // mini-week. Joins via FK so we get member name + resource title
      // in a single round-trip.
      const { data: shares } = await supabase
        .from('member_shared_resources')
        .select('id, shared_at, member:members(id, first_name, last_name), resource:resources(id, title, type)')
        .eq('practitioner_id', authUser.id)
        .order('shared_at', { ascending: false })
        .limit(5)
      if (!cancelled && shares) {
        const mapped: RecentShare[] = shares
          .map((s: any) => {
            const m = Array.isArray(s.member) ? s.member[0] : s.member
            const r = Array.isArray(s.resource) ? s.resource[0] : s.resource
            if (!m || !r) return null
            const title = typeof r.title === 'string'
              ? r.title
              : (r.title?.[locale] || r.title?.en || Object.values(r.title || {})[0] || 'Untitled')
            return {
              id: s.id as string,
              shared_at: s.shared_at as string,
              member_id: m.id as string,
              member_first_name: m.first_name as string,
              member_last_name: m.last_name as string,
              resource_id: r.id as string,
              resource_title: title as string,
              resource_type: (r.type as string) ?? null,
            }
          })
          .filter(Boolean) as RecentShare[]
        setRecentShares(mapped)
      }

      // Build a lookup so we can render session_type IDs as human
      // labels in the Up next list.
      const { data: settings } = await supabase
        .from('booking_settings')
        .select('session_types')
        .eq('user_id', authUser.id)
        .maybeSingle()
      if (!cancelled && Array.isArray(settings?.session_types)) {
        const map: Record<string, { name: string; name_fr?: string }> = {}
        for (const st of settings!.session_types as Array<{ id?: string; name: string; name_fr?: string }>) {
          if (st.id) map[st.id] = { name: st.name, name_fr: st.name_fr }
          map[st.name] = { name: st.name, name_fr: st.name_fr }
        }
        setSessionTypeMap(map)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [supabase, router, searchParams, setLocale])

  const handleConsent = async () => {
    setHasConsented(true)
    if (user) await supabase.from('users').update({ has_consented: true }).eq('id', user.id)
  }

  // Open the global floating note panel scoped to this session. Mirrors
  // the bookings page so notes captured here land in the same surface.
  const handleTakeNotes = async (booking: DashBooking) => {
    if (!booking.member_id) {
      toast.error(t('No patient linked to this session', 'Aucun patient lié à cette séance', 'Sin paciente vinculado'))
      return
    }
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    const [sessionRowRes, customTypesRes, milestonesRes] = await Promise.all([
      supabase.from('sessions')
        .select('id')
        .eq('practitioner_id', u.id)
        .eq('member_id', booking.member_id)
        .eq('scheduled_at', booking.start_time)
        .maybeSingle(),
      supabase.from('custom_note_types')
        .select('type_name')
        .eq('practitioner_id', u.id)
        .order('created_at'),
      supabase.from('milestones')
        .select('id, title, status')
        .eq('member_id', booking.member_id)
        .order('created_at'),
    ])
    const sessionRow = sessionRowRes.data
    const customTypes = (customTypesRes.data || [])
      .map((r: any) => r.type_name as string)
      .filter((name: string) => !name.startsWith('_hidden:'))
    const milestones = (milestonesRes.data || []) as Array<{ id: string; title: string; status: string }>
    const noteTypeMap = new Map<string, { type: string; label: string }>()
    for (const tt of FIXED_NOTE_TYPES) noteTypeMap.set(tt, { type: tt, label: tt.replace(/_/g, ' ') })
    for (const tt of DEFAULT_NOTE_TYPES) if (!noteTypeMap.has(tt)) noteTypeMap.set(tt, { type: tt, label: tt.replace(/_/g, ' ') })
    for (const tt of customTypes) if (!noteTypeMap.has(tt)) noteTypeMap.set(tt, { type: tt, label: tt.replace(/_/g, ' ') })
    const editorNoteTypes = Array.from(noteTypeMap.values())
    const { data: existingNote } = sessionRow?.id
      ? await supabase
          .from('progress_notes')
          .select('id, content')
          .eq('session_id', sessionRow.id)
          .eq('note_type', 'session_summary')
          .maybeSingle()
      : { data: null }
    const durationMinutes = Math.max(0, Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000))
    // Resolve a friendly session-type label for the panel header.
    const typeMeta = sessionTypeMap[booking.session_type]
    const sessionTitle = typeMeta
      ? (locale === 'fr' ? (typeMeta.name_fr || typeMeta.name) : typeMeta.name)
      : booking.session_type
    openFloat({
      mode: 'session',
      content: existingNote?.content || '',
      memberId: booking.member_id,
      memberName: booking.client_name || '',
      noteType: 'session_summary',
      sessionId: sessionRow?.id,
      existingNoteId: existingNote?.id || undefined,
      milestones,
      editorNoteTypes,
      sessionContext: {
        title: sessionTitle,
        startTimeIso: booking.start_time,
        durationMinutes,
        format: null,
      },
    })
  }

  // Compact "Nh ago" / "Nd ago" used in the member picker.
  const formatTimeAgo = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return locale === 'fr' ? "À l'instant" : 'Just now'
    if (diffMins < 60) return locale === 'fr' ? `Il y a ${diffMins} min` : `${diffMins}m ago`
    if (diffHours < 24) return locale === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`
    if (diffDays < 7) return locale === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`
    return new Date(timestamp).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
  }

  // Open Add Member modal + lazily load groups for the chip selector.
  const openAddMember = () => {
    setShowAddMemberModal(true)
    supabase.from('member_groups').select('id, name, color').order('name').then(({ data }) => {
      if (data) setMemberGroups(data)
    })
  }

  // Refresh members + bookings so newly-created entries appear immediately.
  const refreshAfterMemberChange = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const { data: membersData } = await supabase
      .from('members')
      .select('id, first_name, last_name, status, last_session_at')
      .eq('practitioner_id', authUser.id)
      .is('deleted_at', null)
      .order('first_name')
    if (membersData) setMembers(membersData as MemberLite[])
  }

  // Create the member, optionally fire the welcome email, then close modal.
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    // Email is optional — some practitioners see in-person-only patients
    // who don't want or don't have an email on file. Only first + last
    // name are required so we can identify the row.
    if (!newMember.firstName.trim() || !newMember.lastName.trim()) {
      toast.error(locale === 'fr'
        ? "Le prénom et le nom sont requis"
        : 'First name and last name are required')
      return
    }
    setSavingMember(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/sign-in'); return }

      const trimmedEmail = newMember.email.trim()
      const memberData = {
        practitioner_id: authUser.id,
        first_name: newMember.firstName.trim(),
        last_name: newMember.lastName.trim(),
        email: trimmedEmail || null,
        phone: newMember.phone.trim() || null,
        status: 'pending' as const,
        engagement_level: 'medium' as const,
        is_minor: newMember.isMinor,
      }
      const { data: memberResult, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()
      if (error) throw error

      if (newMember.groupIds.length > 0 && memberResult?.id) {
        await supabase.from('member_group_members').insert(
          newMember.groupIds.map(gid => ({ group_id: gid, member_id: memberResult.id }))
        )
      }

      if (sendInvite && memberResult?.id && trimmedEmail) {
        try {
          const { data: practitionerProfile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .single()
          await supabase.functions.invoke('send-member-welcome', {
            body: {
              memberName: newMember.firstName.trim(),
              memberLastName: newMember.lastName.trim(),
              memberEmail: trimmedEmail,
              practitionerName: practitionerProfile?.full_name || 'Your practitioner',
              practitionerAvatarUrl: practitionerProfile?.avatar_url || null,
              locale,
            },
          })
          await supabase
            .from('members')
            .update({ invitation_sent: true, invitation_sent_at: new Date().toISOString() })
            .eq('id', memberResult.id)
        } catch (inviteErr) {
          console.error('Error sending invitation:', inviteErr)
        }
      }

      setNewMember({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] })
      setSendInvite(true)
      setShowAddMemberModal(false)
      toast.success(locale === 'fr' ? 'Patient créé avec succès!' : 'Member created successfully!')
      await refreshAfterMemberChange()
    } catch (err) {
      console.error('Error creating member:', err)
      toast.error(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating member')
    } finally {
      setSavingMember(false)
    }
  }

  // ── Derived counts ──
  const now = new Date()
  const pendingCount = useMemo(
    () => bookings.filter(b => b.status === 'pending').length,
    [bookings],
  )
  const awaitingCount = useMemo(
    () => bookings.filter(b => b.status === 'confirmed' && parseISO(b.start_time) < now).length,
    [bookings, now],
  )
  const todayCount = useMemo(
    () => bookings.filter(b => isSameDay(parseISO(b.start_time), now) && b.status !== 'cancelled').length,
    [bookings, now],
  )
  const upNext = useMemo(
    () => bookings
      .filter(b => parseISO(b.start_time) > now && (b.status === 'confirmed' || b.status === 'pending'))
      .slice(0, 5),
    [bookings, now],
  )

  // Past bookings (within the 14-day fetch window) that have a member
  // and an outcome-relevant status, but no session_summary note yet.
  // Powers the "Notes à écrire" card so the practitioner doesn't have
  // to navigate patient → details → sessions to find what's waiting.
  const awaitingNotes = useMemo(() => {
    const fourteenDaysAgo = addDays(now, -14).getTime()
    return bookings
      .filter(b => {
        if (!b.member_id) return false
        if (!(b.status === 'confirmed' || b.status === 'completed')) return false
        const startMs = parseISO(b.start_time).getTime()
        if (startMs >= now.getTime()) return false
        if (startMs < fourteenDaysAgo) return false
        const key = `${b.member_id}|${Math.floor(startMs / 1000)}`
        return !notedSessionKeys.has(key)
      })
      .sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime())
      .slice(0, 6)
  }, [bookings, notedSessionKeys, now])

  // Mini week — 7 day cells Mon→Sun for the current week.
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const countForDay = (d: Date) =>
    bookings.filter(b => b.status !== 'cancelled' && isSameDay(parseISO(b.start_time), d)).length

  // Derive first name from the User row's `full_name`. Skip the email
  // prefix fallback so we never read "Hi bloomsline".
  const rawFull = user?.full_name?.trim()
  const firstName = rawFull && !rawFull.includes('@') ? rawFull.split(/\s+/)[0] : ''
  const dateLabel = format(now, locale === 'fr' ? 'EEEE d MMMM' : 'EEEE, MMMM d', {
    locale: locale === 'fr' ? frLocale : undefined,
  })

  // Two-line greeting:
  //   Line 1 — time-of-day + practitioner's first name (prominent)
  //   Line 2 — today's flow with patient names, or a context-aware
  //            mood line when there's nothing scheduled. Picks are
  //            stable within the same hour so the page doesn't flicker.
  const hour = now.getHours()
  const day = now.getDay()
  const seed = Math.abs(now.getDate() + hour)

  const timeOfDayHeadline = (() => {
    const tod = hour < 12
      ? t('Good morning', 'Bonjour', 'Buenos días')
      : hour < 18
        ? t('Good afternoon', 'Bon après-midi', 'Buenas tardes')
        : t('Good evening', 'Bonsoir', 'Buenas noches')
    return firstName ? `${tod}, ${firstName}` : tod
  })()

  const todaysFlowLine = (() => {
    if (loading) return ''

    if (todayCount > 0) {
      // Patient names from today's bookings (skip cancelled). De-dup so
      // a recurring patient with multiple sessions today only shows
      // their name once.
      const todaysPatients = bookings
        .filter(b => isSameDay(parseISO(b.start_time), now) && b.status !== 'cancelled')
        .map(b => b.client_name?.split(/\s+/)[0])
        .filter(Boolean) as string[]
      const unique = Array.from(new Set(todaysPatients))
      const first = unique[0]
      const second = unique[1]
      // No names available — fall back to a count-only sentence.
      if (!first) {
        return t(
          `${todayCount} session${todayCount > 1 ? 's' : ''} on the books today.`,
          `${todayCount} séance${todayCount > 1 ? 's' : ''} aujourd'hui.`,
          `${todayCount} sesión${todayCount > 1 ? 'es' : ''} hoy.`,
        )
      }
      // Only one unique patient across N sessions.
      if (!second) {
        if (todayCount === 1) {
          return t(
            `Today you'll see ${first}.`,
            `Aujourd'hui, vous verrez ${first}.`,
            `Hoy verás a ${first}.`,
          )
        }
        return t(
          `${todayCount} sessions today with ${first}.`,
          `${todayCount} séances aujourd'hui avec ${first}.`,
          `${todayCount} sesiones hoy con ${first}.`,
        )
      }
      // Two+ unique patients — show first two, collapse the rest.
      const rest = todayCount - 2
      if (rest <= 0) {
        return t(
          `Today you'll see ${first} and ${second}.`,
          `Aujourd'hui, vous verrez ${first} et ${second}.`,
          `Hoy verás a ${first} y ${second}.`,
        )
      }
      const others = rest === 1
        ? t('1 other', '1 autre', '1 más')
        : t(`${rest} others`, `${rest} autres`, `${rest} más`)
      return t(
        `Today you'll see ${first}, ${second}, and ${others}.`,
        `Aujourd'hui, vous verrez ${first}, ${second} et ${others}.`,
        `Hoy verás a ${first}, ${second} y ${others}.`,
      )
    }

    // Empty-today branch — mood line varies by weekday / time / awaiting.
    const candidates: string[] = []
    if (day === 0 || day === 6) candidates.push(t(
      'Enjoy the weekend.',
      'Profitez de votre week-end.',
      'Disfruta el fin de semana.',
    ))
    if (day === 1) candidates.push(t(
      'A quiet Monday — a good moment to set the week.',
      'Un lundi calme — l\'occasion de poser la semaine.',
      'Lunes tranquilo — un buen momento para preparar la semana.',
    ))
    if (day === 5) candidates.push(t(
      'Light Friday — wind down before the weekend.',
      'Vendredi calme — préparez le week-end.',
      'Viernes ligero — desconecta antes del fin de semana.',
    ))
    if (hour < 12) {
      candidates.push(t('Your morning is clear.', 'Votre matinée est libre.', 'Tu mañana está libre.'))
      if (awaitingCount > 0) candidates.push(t(
        `A quiet morning — a chance to close ${awaitingCount} session${awaitingCount > 1 ? 's' : ''}.`,
        `Matinée calme — l'occasion de clôturer ${awaitingCount} séance${awaitingCount > 1 ? 's' : ''}.`,
        `Mañana tranquila — momento para cerrar ${awaitingCount} sesión${awaitingCount > 1 ? 'es' : ''}.`,
      ))
    } else if (hour < 18) {
      candidates.push(t('Your afternoon is open.', 'Votre après-midi est libre.', 'Tu tarde está libre.'))
    } else {
      candidates.push(t('The day is winding down.', 'La journée touche à sa fin.', 'El día está terminando.'))
    }
    if (pendingCount > 0) candidates.push(t(
      `${pendingCount} request${pendingCount > 1 ? 's' : ''} waiting on you.`,
      `${pendingCount} demande${pendingCount > 1 ? 's' : ''} en attente.`,
      `${pendingCount} solicitud${pendingCount > 1 ? 'es' : ''} esperando.`,
    ))
    if (candidates.length === 0) return ''
    return candidates[seed % candidates.length]
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="home" />
      <main className="flex-1 ml-14">
        <AppHeader user={user} leftContent={
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold text-gray-900">{t('Home', 'Accueil', 'Inicio')}</h1>
          </div>
        } />

        <div className="px-8 py-6 max-w-7xl mx-auto w-full">
          {/* ── Zone 1: Greeting + urgency row + quick-action icons ── */}
          <section className="mb-8 flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400 mb-2 capitalize">{dateLabel}</p>
              <h2 className="text-3xl font-semibold text-gray-900 leading-snug">{timeOfDayHeadline}</h2>
              {todaysFlowLine && (
                <p className="text-base text-gray-600 mt-1 mb-4">{todaysFlowLine}</p>
              )}
              <UrgencyRow pending={pendingCount} awaiting={awaitingCount} t={t} loading={loading} />
            </div>
            {/* Quick actions — icon buttons aligned with the headline
                level, slightly larger so they feel like a primary
                action set. Tooltip on hover (title attr) describes each. */}
            <div className="flex items-center gap-2 shrink-0 mt-10">
              <QuickIcon
                icon={Calendar}
                color="amber"
                label={t('Book session', 'Planifier', 'Reservar')}
                onClick={() => setShowSchedule(true)}
              />
              <QuickIcon
                icon={UserPlus}
                color="teal"
                label={t('Add patient', 'Nouveau patient', 'Nuevo paciente')}
                onClick={openAddMember}
              />
              <QuickIcon
                icon={Share2}
                color="indigo"
                label={t('Share resource', 'Partager', 'Compartir')}
                onClick={() => {
                  setMemberSearchQuery('')
                  setMemberPickerAction('share')
                  setShowMemberPicker(true)
                }}
              />
            </div>
          </section>

          {/* ── Zone 2: Up next + Notes to write (left) | mini week calendar + resources (right) ── */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8 items-start">
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <header className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">{t('Up next', 'À venir', 'Próximas')}</h3>
                  <Link href="/bookings" className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    {t('View all', 'Voir tout', 'Ver todo')}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </header>
                {loading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-lg" />)}
                  </div>
                ) : upNext.length === 0 ? (
                  <EmptyUpNext t={t} />
                ) : (
                  <ul className="space-y-2">
                    {upNext.map((b, i) => <UpNextRow key={b.id} booking={b} locale={locale} t={t} sessionTypeMap={sessionTypeMap} onTakeNotes={handleTakeNotes} isFirst={i === 0} />)}
                  </ul>
                )}
              </div>

              {/* Quick-note composer — one slim line. Click anywhere on
                  the row → modal opens with the searchable list of
                  sessions that don't have a session_summary note yet.
                  Selecting a session opens the same floating editor as
                  the Up-next "Take notes" button. */}
              {!loading && (
                <button
                  type="button"
                  onClick={() => { setNoteComposerSearch(''); setShowNoteComposer(true) }}
                  className="w-full flex items-center gap-3 bg-white hover:bg-amber-50/40 border border-gray-200 hover:border-amber-300 rounded-2xl px-5 py-3.5 text-left transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                      {awaitingNotes.length > 0
                        ? t('Take a quick note…', 'Prendre une note rapide…', 'Tomar una nota rápida…')
                        : t('All caught up — no sessions waiting for notes.',
                            'Vous êtes à jour — aucune séance en attente.',
                            'Al día — sin sesiones esperando notas.')}
                    </p>
                  </div>
                  {awaitingNotes.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium tabular-nums shrink-0">
                      {awaitingNotes.length} {t('awaiting', 'en attente', 'pendientes')}
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="bg-white rounded-2xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-sm transition group"
            >
              {/* Header: title + week total. Total reads at a glance so
                  the practitioner doesn't have to count days. */}
              {(() => {
                const totalThisWeek = weekDays.reduce((acc, d) => acc + countForDay(d), 0)
                return (
                  <header className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <h3 className="text-base font-semibold text-gray-900">{t('This week', 'Cette semaine', 'Esta semana')}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {totalThisWeek > 0 && (
                        <span className="text-xs text-gray-500 tabular-nums">
                          {totalThisWeek === 1
                            ? t('1 session', '1 séance', '1 sesión')
                            : t(`${totalThisWeek} sessions`, `${totalThisWeek} séances`, `${totalThisWeek} sesiones`)}
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                  </header>
                )
              })()}
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => {
                  const count = countForDay(day)
                  const isCurrentDay = isSameDay(day, now)
                  return (
                    <div key={day.toISOString()} className="flex flex-col items-center gap-1 py-2">
                      <span className={`text-[10px] uppercase tracking-wide ${isCurrentDay ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                        {format(day, 'EEE', { locale: locale === 'fr' ? frLocale : undefined }).slice(0, 3)}
                      </span>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCurrentDay
                          ? 'bg-gray-900 text-white'
                          : count > 0
                            ? 'text-gray-900'
                            : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {/* Session count below the date — "N session(s)"
                          for non-empty days, nothing for empty ones. */}
                      <span className={`text-[10px] tabular-nums leading-none mt-0.5 ${
                        count === 0
                          ? 'text-transparent select-none'
                          : 'text-blue-600 font-medium'
                      }`}>
                        {count > 0
                          ? (count === 1
                              ? t('1 session', '1 séance', '1 sesión')
                              : t(`${count} sessions`, `${count} séances`, `${count} sesiones`))
                          : '0'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                {t('Click anywhere to open the full calendar', 'Cliquez pour ouvrir le calendrier complet', 'Clic para abrir el calendario completo')}
              </p>
            </button>

            {/* Recently shared resources — quick "what did I just send"
                surface; complements the calendar by filling the space
                under it. */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-900">{t('Recent resources', 'Ressources récentes', 'Recursos recientes')}</h3>
                </div>
                <Link
                  href="/resources"
                  className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                >
                  {t('View all', 'Voir tout', 'Ver todo')}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </header>
              {loading ? (
                <div className="space-y-2">
                  {[0, 1].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)}
                </div>
              ) : recentShares.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-xs">
                    {t('No resources shared yet.', 'Aucune ressource partagée pour le moment.', 'Aún no se han compartido recursos.')}
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {recentShares.slice(0, 3).map(s => {
                    const sharedAt = parseISO(s.shared_at)
                    const minsAgo = (Date.now() - sharedAt.getTime()) / 60000
                    const timeAgo =
                      minsAgo < 60 ? `${Math.max(1, Math.floor(minsAgo))}m`
                      : minsAgo < 60 * 24 ? `${Math.floor(minsAgo / 60)}h`
                      : minsAgo < 60 * 24 * 7 ? `${Math.floor(minsAgo / (60 * 24))}d`
                      : format(sharedAt, locale === 'fr' ? 'd MMM' : 'MMM d', { locale: locale === 'fr' ? frLocale : undefined })
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/resources/${s.resource_id}`}
                          className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition group/share"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate group-hover/share:text-violet-700">
                              {s.resource_title}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {t(`Shared with ${s.member_first_name}`, `Partagée avec ${s.member_first_name}`, `Compartido con ${s.member_first_name}`)}
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{timeAgo}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            </div>
          </section>


        </div>
      </main>

      {/* ── Modals ── */}
      <ConsentModal isOpen={!hasConsented} onAccept={handleConsent} locale={locale} />

      <NoteComposerPicker
        isOpen={showNoteComposer}
        onClose={() => setShowNoteComposer(false)}
        awaitingNotes={awaitingNotes}
        search={noteComposerSearch}
        onSearchChange={setNoteComposerSearch}
        locale={locale}
        t={t}
        sessionTypeMap={sessionTypeMap}
        onPick={(b) => { setShowNoteComposer(false); handleTakeNotes(b) }}
      />

      <ScheduleSessionModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        onSuccess={() => {
          setShowSchedule(false)
          // Re-fetch so the new booking shows up in Up next + mini week
          ;(async () => {
            const { data: { user: u } } = await supabase.auth.getUser()
            if (!u) return
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
            const horizonEnd = addDays(weekStart, 21).toISOString()
            const { data: bk } = await supabase.from('bookings').select('*')
              .eq('practitioner_id', u.id)
              .gte('start_time', weekStart.toISOString())
              .lt('start_time', horizonEnd)
              .order('start_time', { ascending: true })
            if (bk) setBookings(bk as DashBooking[])
          })()
        }}
      />

      {/* Slot-click flow — same shape as the bookings page. Opens the
          schedule modal pre-filled with the clicked day + time. */}
      <ScheduleSessionModal
        isOpen={!!calendarSlotBooking}
        onClose={() => setCalendarSlotBooking(null)}
        onSuccess={() => {
          setCalendarSlotBooking(null)
          ;(async () => {
            const { data: { user: u } } = await supabase.auth.getUser()
            if (!u) return
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
            const horizonEnd = addDays(weekStart, 21).toISOString()
            const { data: bk } = await supabase.from('bookings').select('*')
              .eq('practitioner_id', u.id)
              .gte('start_time', weekStart.toISOString())
              .lt('start_time', horizonEnd)
              .order('start_time', { ascending: true })
            if (bk) setBookings(bk as DashBooking[])
          })()
        }}
        preselectedDate={calendarSlotBooking?.date}
        preselectedTime={calendarSlotBooking?.time}
        preselectedOutsideHours={calendarSlotBooking?.outsideHours}
      />

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
            onClick={() => setShowAddMemberModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr' ? 'Ajouter un nouveau patient / client' : 'Add a New Person'}
                </h2>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Prénom' : 'First Name'} *
                      </label>
                      <input
                        type="text"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                        placeholder={locale === 'fr' ? 'Jean' : 'John'}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Nom' : 'Last Name'} *
                      </label>
                      <input
                        type="text"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                        placeholder={locale === 'fr' ? 'Dupont' : 'Doe'}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Email
                      <span className="text-gray-400 font-normal text-xs">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                      placeholder={locale === 'fr' ? 'jean@exemple.com' : 'john@example.com'}
                    />
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                      {locale === 'fr'
                        ? 'Sans email : pas d\'app patient, pas d\'invitations Google Agenda, pas de rappels.'
                        : 'Without email: no patient app, no Google Calendar invites, no reminders.'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {locale === 'fr' ? 'Téléphone' : 'Phone'}
                      <span className="text-gray-400 font-normal text-xs">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                    </label>
                    <PhoneInput
                      value={newMember.phone}
                      onChange={(v) => setNewMember({ ...newMember, phone: v })}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newMember.isMinor || false}
                      onChange={(e) => { setNewMember({ ...newMember, isMinor: e.target.checked }); if (e.target.checked) setSendInvite(false) }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {locale === 'fr' ? 'Mineur' : 'Minor'}
                  </span>
                </label>

                <div
                  onClick={() => { if (newMember.email.trim()) setSendInvite(!sendInvite) }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all mt-4 ${
                    !newMember.email.trim()
                      ? 'border-gray-100 bg-gray-50/30 opacity-50 cursor-not-allowed'
                      : `cursor-pointer ${sendInvite ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100 bg-gray-50/50'}`
                  }`}
                  title={!newMember.email.trim() ? (locale === 'fr' ? 'Un email est nécessaire pour envoyer l\'invitation' : 'An email is required to send the invitation') : undefined}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    sendInvite ? 'bg-teal-100' : 'bg-gray-100'
                  }`}>
                    <Mail className={`w-4 h-4 ${sendInvite ? 'text-teal-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${sendInvite ? 'text-teal-900' : 'text-gray-500'}`}>
                      {locale === 'fr'
                        ? `Inviter ${newMember.firstName.trim() || 'cette personne'} sur l'app bien-être`
                        : `Invite ${newMember.firstName.trim() || 'this person'} to the wellbeing app`}
                    </p>
                    <p className="text-xs text-gray-400 leading-snug">
                      {locale === 'fr' ? 'Accès gratuit entre les séances' : 'Free access between sessions'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 relative">
                    <div className={`w-9 h-5 rounded-full transition-colors ${sendInvite ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${sendInvite ? 'translate-x-4' : ''}`} />
                  </div>
                </div>

                {memberGroups.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Ajouter à un groupe' : 'Add to a Group'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {memberGroups.map(group => {
                        const selected = newMember.groupIds.includes(group.id)
                        const dotColors: Record<string, string> = {
                          blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500',
                          amber: 'bg-amber-500', red: 'bg-red-500', pink: 'bg-pink-500', cyan: 'bg-cyan-500',
                        }
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setNewMember({
                              ...newMember,
                              groupIds: selected
                                ? newMember.groupIds.filter(id => id !== group.id)
                                : [...newMember.groupIds, group.id]
                            })}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              selected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${dotColors[group.color] || 'bg-blue-500'}`} />
                            {group.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddMemberModal(false)}
                    className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingMember}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                  >
                    {savingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {locale === 'fr' ? 'Création...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Créer' : 'Create'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Picker — step 1 of the share-resource flow */}
      <AnimatePresence>
        {showMemberPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowMemberPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Rechercher une personne' : 'Search for a person'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {memberPickerAction === 'share' && (locale === 'fr' ? 'Envoyer un support' : 'Share a resource')}
                  </p>
                </div>
                <button
                  onClick={() => setShowMemberPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-5 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder={locale === 'fr' ? 'Rechercher un patient...' : 'Search members...'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto space-y-1">
                {(() => {
                  const query = memberSearchQuery.toLowerCase()
                  const filtered = members.filter(m =>
                    `${m.first_name} ${m.last_name}`.toLowerCase().includes(query)
                  )
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Aucun patient trouvé' : 'No members found'}
                        </p>
                      </div>
                    )
                  }
                  return filtered.map((member, index) => {
                    const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                    const statusColor = member.status === 'active' ? 'bg-emerald-400' : member.status === 'inactive' ? 'bg-gray-400' : 'bg-amber-400'
                    return (
                      <motion.button
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={async () => {
                          setShowMemberPicker(false)
                          if (memberPickerAction === 'share') {
                            // Step 2 — load practitioner's resource library
                            setShareTargetMember({ id: member.id, first_name: member.first_name, last_name: member.last_name })
                            setResourcePickerSearch('')
                            setShowResourcePicker(true)
                            setResourcePickerLoading(true)
                            try {
                              const { data: { user: authUser } } = await supabase.auth.getUser()
                              if (authUser) {
                                const { data } = await supabase
                                  .from('resources')
                                  .select('id, title, type, description, updated_at')
                                  .eq('practitioner_id', authUser.id)
                                  .order('updated_at', { ascending: false })
                                setResourcePickerList((data ?? []) as any)
                              }
                            } finally {
                              setResourcePickerLoading(false)
                            }
                          }
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {initials}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.status === 'active' ? (locale === 'fr' ? 'Actif' : 'Active') :
                             member.status === 'inactive' ? (locale === 'fr' ? 'Inactif' : 'Inactive') :
                             (locale === 'fr' ? 'En attente' : 'Pending')}
                            {member.last_session_at && ` · ${formatTimeAgo(member.last_session_at)}`}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                      </motion.button>
                    )
                  })
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resource Picker — step 2 of the share-resource flow. Inserts a
          row into member_shared_resources; existing edge-function webhook
          handles notification + email. */}
      <AnimatePresence>
        {showResourcePicker && shareTargetMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowResourcePicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {locale === 'fr' ? 'Choisir un support' : locale === 'es' ? 'Elige un recurso' : 'Pick a resource'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowResourcePicker(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {locale === 'fr'
                    ? `À envoyer à ${shareTargetMember.first_name} ${shareTargetMember.last_name}`
                    : locale === 'es'
                      ? `Para enviar a ${shareTargetMember.first_name} ${shareTargetMember.last_name}`
                      : `Sending to ${shareTargetMember.first_name} ${shareTargetMember.last_name}`}
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={resourcePickerSearch}
                    onChange={(e) => setResourcePickerSearch(e.target.value)}
                    placeholder={locale === 'fr' ? 'Rechercher...' : locale === 'es' ? 'Buscar...' : 'Search...'}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {resourcePickerLoading ? (
                  <div className="py-10 flex items-center justify-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (() => {
                  const q = resourcePickerSearch.trim().toLowerCase()
                  const filtered = q
                    ? resourcePickerList.filter(r => r.title?.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q))
                    : resourcePickerList
                  if (filtered.length === 0) {
                    return (
                      <div className="py-10 text-center">
                        <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          {q
                            ? (locale === 'fr' ? 'Aucun résultat' : locale === 'es' ? 'Sin resultados' : 'No results')
                            : (locale === 'fr' ? 'Aucun support créé' : locale === 'es' ? 'Sin recursos' : 'No resources yet')}
                        </p>
                      </div>
                    )
                  }
                  return filtered.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={async () => {
                        if (resourcePickerSending) return
                        setResourcePickerSending(res.id)
                        try {
                          const { data: { user: authUser } } = await supabase.auth.getUser()
                          if (!authUser) throw new Error('Not authenticated')
                          const { error } = await supabase
                            .from('member_shared_resources')
                            .insert({
                              member_id: shareTargetMember.id,
                              resource_id: res.id,
                              practitioner_id: authUser.id,
                              shared_at: new Date().toISOString(),
                            })
                          if (error) {
                            if (error.code === '23505') {
                              toast.info(
                                locale === 'fr'
                                  ? `Déjà partagé avec ${shareTargetMember.first_name}`
                                  : locale === 'es'
                                    ? `Ya compartido con ${shareTargetMember.first_name}`
                                    : `Already shared with ${shareTargetMember.first_name}`
                              )
                            } else {
                              throw error
                            }
                          } else {
                            toast.success(
                              locale === 'fr'
                                ? `Partagé avec ${shareTargetMember.first_name}`
                                : locale === 'es'
                                  ? `Compartido con ${shareTargetMember.first_name}`
                                  : `Shared with ${shareTargetMember.first_name}`
                            )
                          }
                          setShowResourcePicker(false)
                          setShareTargetMember(null)
                        } catch (err) {
                          console.error('Share resource failed:', err)
                          toast.error(locale === 'fr' ? 'Erreur lors du partage' : 'Error sharing resource')
                        } finally {
                          setResourcePickerSending(null)
                        }
                      }}
                      disabled={!!resourcePickerSending}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{res.title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</p>
                        {res.description && (
                          <p className="text-xs text-gray-500 truncate">{res.description}</p>
                        )}
                      </div>
                      {resourcePickerSending === res.id ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                      )}
                    </button>
                  ))
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full calendar modal */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/90 flex flex-col"
          onClick={() => setShowCalendar(false)}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h3 className="text-white text-base font-semibold">{t('Calendar', 'Calendrier', 'Calendario')}</h3>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition shadow"
            >
              <X className="w-4 h-4" />
              {t('Close', 'Fermer', 'Cerrar')}
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl p-4 max-w-6xl mx-auto">
              <WeekCalendarView
                bookings={bookings as any}
                onApprove={async () => {}}
                onReject={async () => {}}
                processingId={null}
                onSlotClick={(day, time, options) => {
                  setShowCalendar(false)
                  setCalendarSlotBooking({ date: day, time, outsideHours: options?.outsideHours })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <DashboardInner />
    </Suspense>
  )
}

// ─────────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────────

function UrgencyRow({
  pending, awaiting, t, loading,
}: {
  pending: number
  awaiting: number
  t: (en: string, fr: string, es: string) => string
  loading: boolean
}) {
  if (loading) return null
  if (pending + awaiting === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {pending > 0 && (
        <Link href="/bookings?filter=pending" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium hover:bg-amber-100 transition">
          <AlertCircle className="w-3.5 h-3.5" />
          {t(`${pending} pending approval${pending > 1 ? 's' : ''}`, `${pending} en attente d'approbation`, `${pending} pendiente${pending > 1 ? 's' : ''}`)}
        </Link>
      )}
      {awaiting > 0 && (
        <Link href="/bookings#history-section" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium hover:bg-orange-100 transition">
          <AlertCircle className="w-3.5 h-3.5" />
          {t(`${awaiting} to close`, `${awaiting} à clôturer`, `${awaiting} por cerrar`)}
        </Link>
      )}
    </div>
  )
}

function UpNextRow({
  booking, locale, t, sessionTypeMap, onTakeNotes, isFirst,
}: {
  booking: DashBooking
  locale: string
  t: (en: string, fr: string, es: string) => string
  sessionTypeMap: Record<string, { name: string; name_fr?: string }>
  onTakeNotes: (b: DashBooking) => void
  isFirst: boolean
}) {
  const start = parseISO(booking.start_time)
  const displayName = booking.client_name || t('Unnamed patient', 'Patient sans nom', 'Paciente sin nombre')
  const dateLabel = isToday(start)
    ? t('Today', "Aujourd'hui", 'Hoy')
    : isTomorrow(start)
      ? t('Tomorrow', 'Demain', 'Mañana')
      : format(start, locale === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale: locale === 'fr' ? frLocale : undefined })
  // 24-hour clock for fr/es, am/pm for en. Single line.
  const timeFmt = locale === 'en' ? 'h:mm a' : 'HH:mm'
  // Resolve a friendly session-type label. Prefer the practitioner's
  // configured list (handles 'custom_…' IDs). Fall back to a localized
  // default-enum label, finally the raw value.
  const typeMeta = sessionTypeMap[booking.session_type]
  const enumDefaults: Record<string, { en: string; fr: string; es: string }> = {
    initial_consultation: { en: 'Initial consultation', fr: 'Première séance', es: 'Consulta inicial' },
    follow_up:            { en: 'Follow-up',            fr: 'Suivi',           es: 'Seguimiento' },
    check_in:             { en: 'Check-in',             fr: 'Bilan',           es: 'Revisión' },
    crisis:               { en: 'Crisis',               fr: 'Crise',           es: 'Crisis' },
    group:                { en: 'Group',                fr: 'Groupe',          es: 'Grupo' },
    other:                { en: 'Other',                fr: 'Autre',           es: 'Otro' },
  }
  const enumDefault = enumDefaults[booking.session_type]
  const sessionLabel =
    typeMeta
      ? (locale === 'fr' ? (typeMeta.name_fr || typeMeta.name) : typeMeta.name)
      : enumDefault
        ? enumDefault[locale as 'en' | 'fr' | 'es'] || enumDefault.en
        : booking.session_type
  return (
    <li className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition">
      <div className="px-2.5 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0 tabular-nums">
        {format(start, timeFmt)}
      </div>
      <div className="flex-1 min-w-0">
        {booking.member_id ? (
          <Link href={`/members/${booking.member_id}`} className="text-sm font-medium text-gray-900 hover:text-violet-700 truncate inline-block">
            {displayName}
          </Link>
        ) : (
          <span className="text-sm font-medium text-gray-900 truncate inline-block">{displayName}</span>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          <span className="text-gray-700 font-medium">{dateLabel}</span>
          <span className="text-gray-400"> · </span>
          {booking.status === 'pending'
            ? <span className="text-amber-700 font-medium">{t('Pending approval', "En attente d'approbation", 'Pendiente de aprobación')}</span>
            : <span>{sessionLabel}</span>}
        </p>
      </div>
      {/* Action buttons only show on the very next session — the
          practitioner doesn't need a Join button for a session three
          days away. */}
      {isFirst && (
        <div className="flex items-center gap-2 shrink-0">
          {booking.meet_link && (booking.status === 'confirmed' || booking.status === 'pending') && (
            <a
              href={booking.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              {t('Join now', 'Rejoindre', 'Unirse')}
            </a>
          )}
          {booking.member_id && (booking.status === 'confirmed' || booking.status === 'pending') && (
            <button
              type="button"
              onClick={() => onTakeNotes(booking)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              {t('Take notes', 'Prendre des notes', 'Tomar notas')}
            </button>
          )}
        </div>
      )}
    </li>
  )
}

function NoteComposerPicker({
  isOpen, onClose, awaitingNotes, search, onSearchChange, locale, t, sessionTypeMap, onPick,
}: {
  isOpen: boolean
  onClose: () => void
  awaitingNotes: DashBooking[]
  search: string
  onSearchChange: (s: string) => void
  locale: string
  t: (en: string, fr: string, es: string) => string
  sessionTypeMap: Record<string, { name: string; name_fr?: string }>
  onPick: (b: DashBooking) => void
}) {
  if (!isOpen) return null
  const q = search.trim().toLowerCase()
  const filtered = q.length === 0
    ? awaitingNotes
    : awaitingNotes.filter(b =>
        (b.client_name || '').toLowerCase().includes(q) ||
        (b.client_email || '').toLowerCase().includes(q),
      )
  return (
    <AnimatePresence>
      <motion.div
        key="note-composer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-24"
        onClick={onClose}
      >
        <motion.div
          key="note-composer-panel"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                {t('Pick a session to note', 'Choisir une séance', 'Elegir una sesión')}
              </h2>
              {awaitingNotes.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold tabular-nums">
                  {awaitingNotes.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('Search patient…', 'Rechercher un patient…', 'Buscar paciente…')}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
              />
            </div>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-emerald-300" />
                <p className="text-sm">
                  {awaitingNotes.length === 0
                    ? t('All caught up.', 'Vous êtes à jour.', 'Al día.')
                    : t('No matches.', 'Aucun résultat.', 'Sin coincidencias.')}
                </p>
              </div>
            ) : (
              <ul className="py-1">
                {filtered.map(b => (
                  <NoteComposerRow
                    key={b.id}
                    booking={b}
                    locale={locale}
                    t={t}
                    sessionTypeMap={sessionTypeMap}
                    onPick={onPick}
                  />
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function NoteComposerRow({
  booking, locale, t, sessionTypeMap, onPick,
}: {
  booking: DashBooking
  locale: string
  t: (en: string, fr: string, es: string) => string
  sessionTypeMap: Record<string, { name: string; name_fr?: string }>
  onPick: (b: DashBooking) => void
}) {
  const start = parseISO(booking.start_time)
  const displayName = booking.client_name || t('Unnamed patient', 'Patient sans nom', 'Paciente sin nombre')
  const dateLabel = isToday(start)
    ? t('Today', "Aujourd'hui", 'Hoy')
    : isYesterday(start)
      ? t('Yesterday', 'Hier', 'Ayer')
      : format(start, locale === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale: locale === 'fr' ? frLocale : undefined })
  const timeFmt = locale === 'en' ? 'h:mm a' : 'HH:mm'
  const typeMeta = sessionTypeMap[booking.session_type]
  const enumDefaults: Record<string, { en: string; fr: string; es: string }> = {
    initial_consultation: { en: 'Initial consultation', fr: 'Première séance', es: 'Consulta inicial' },
    follow_up:            { en: 'Follow-up',            fr: 'Suivi',           es: 'Seguimiento' },
    check_in:             { en: 'Check-in',             fr: 'Bilan',           es: 'Revisión' },
    crisis:               { en: 'Crisis',               fr: 'Crise',           es: 'Crisis' },
    group:                { en: 'Group',                fr: 'Groupe',          es: 'Grupo' },
    other:                { en: 'Other',                fr: 'Autre',           es: 'Otro' },
  }
  const enumDefault = enumDefaults[booking.session_type]
  const sessionLabel = typeMeta
    ? (locale === 'fr' ? (typeMeta.name_fr || typeMeta.name) : typeMeta.name)
    : enumDefault
      ? enumDefault[locale as 'en' | 'fr' | 'es'] || enumDefault.en
      : booking.session_type
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(booking)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50/40 text-left transition-colors"
      >
        <div className="w-14 px-2 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-semibold shrink-0 tabular-nums">
          {format(start, timeFmt)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="text-gray-700">{dateLabel}</span>
            <span className="text-gray-400"> · </span>
            <span>{sessionLabel}</span>
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
      </button>
    </li>
  )
}

function AwaitingNoteRow({
  booking, locale, t, sessionTypeMap, onTakeNotes,
}: {
  booking: DashBooking
  locale: string
  t: (en: string, fr: string, es: string) => string
  sessionTypeMap: Record<string, { name: string; name_fr?: string }>
  onTakeNotes: (b: DashBooking) => void
}) {
  const start = parseISO(booking.start_time)
  const displayName = booking.client_name || t('Unnamed patient', 'Patient sans nom', 'Paciente sin nombre')
  const dateLabel = isToday(start)
    ? t('Today', "Aujourd'hui", 'Hoy')
    : isYesterday(start)
      ? t('Yesterday', 'Hier', 'Ayer')
      : format(start, locale === 'fr' ? 'EEE d MMM' : 'EEE, MMM d', { locale: locale === 'fr' ? frLocale : undefined })
  const timeFmt = locale === 'en' ? 'h:mm a' : 'HH:mm'
  const typeMeta = sessionTypeMap[booking.session_type]
  const enumDefaults: Record<string, { en: string; fr: string; es: string }> = {
    initial_consultation: { en: 'Initial consultation', fr: 'Première séance', es: 'Consulta inicial' },
    follow_up:            { en: 'Follow-up',            fr: 'Suivi',           es: 'Seguimiento' },
    check_in:             { en: 'Check-in',             fr: 'Bilan',           es: 'Revisión' },
    crisis:               { en: 'Crisis',               fr: 'Crise',           es: 'Crisis' },
    group:                { en: 'Group',                fr: 'Groupe',          es: 'Grupo' },
    other:                { en: 'Other',                fr: 'Autre',           es: 'Otro' },
  }
  const enumDefault = enumDefaults[booking.session_type]
  const sessionLabel =
    typeMeta
      ? (locale === 'fr' ? (typeMeta.name_fr || typeMeta.name) : typeMeta.name)
      : enumDefault
        ? enumDefault[locale as 'en' | 'fr' | 'es'] || enumDefault.en
        : booking.session_type
  return (
    <li className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition">
      <div className="px-2.5 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-semibold shrink-0 tabular-nums">
        {format(start, timeFmt)}
      </div>
      <div className="flex-1 min-w-0">
        {booking.member_id ? (
          <Link href={`/members/${booking.member_id}`} className="text-sm font-medium text-gray-900 hover:text-violet-700 truncate inline-block">
            {displayName}
          </Link>
        ) : (
          <span className="text-sm font-medium text-gray-900 truncate inline-block">{displayName}</span>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          <span className="text-gray-700 font-medium">{dateLabel}</span>
          <span className="text-gray-400"> · </span>
          <span>{sessionLabel}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => onTakeNotes(booking)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-md transition-colors shrink-0"
      >
        <FileText className="w-3.5 h-3.5" />
        {t('Take notes', 'Prendre des notes', 'Tomar notas')}
      </button>
    </li>
  )
}

function EmptyUpNext({
  t,
}: {
  t: (en: string, fr: string, es: string) => string
}) {
  return (
    <div className="text-center py-10 text-gray-400">
      <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-300" />
      <p className="text-sm">{t('No sessions yet — your week is open.', 'Aucune séance — votre semaine est libre.', 'Sin sesiones — tu semana está libre.')}</p>
    </div>
  )
}

function QuickIcon({
  icon: Icon, color, label, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  color: 'rose' | 'teal' | 'indigo' | 'amber'
  label: string
  onClick: () => void
}) {
  // Bumped to the 100/200 shades so the colored chip is unambiguously
  // present at glance (50 read as nearly-white on light backgrounds).
  const colorClass: Record<typeof color, string> = {
    rose:   'bg-rose-100 text-rose-700 hover:bg-rose-200',
    teal:   'bg-teal-100 text-teal-700 hover:bg-teal-200',
    indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    amber:  'bg-amber-100 text-amber-700 hover:bg-amber-200',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-gray-200 ${colorClass[color]}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  )
}
