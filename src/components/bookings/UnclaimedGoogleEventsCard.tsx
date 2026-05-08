'use client'

/**
 * Surfaces Google Calendar events booked outside Bloomsline so the
 * practitioner can attach each one to a patient (creates the matching
 * `bookings` + `sessions` row without re-pushing the event to Google).
 *
 * Uses /api/calendar/orphan-events for the list and
 * /api/bookings/claim-google-event for the claim action.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Search, X, Loader2, ChevronDown, ChevronRight, Video, Building2, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'

interface OrphanEvent {
  googleEventId: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  timezone: string
  location: string | null
  hangoutLink: string | null
  attendees: Array<{ email: string; displayName: string | null }>
  suggestedMember: { id: string; name: string } | null
  suggestedAttendeeEmail: string | null
}

interface MemberOption {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

interface SessionTypeOption {
  id: string
  name: string
  duration?: number
  price?: number | null
}

interface Props {
  sessionTypes: SessionTypeOption[]
  locale: 'en' | 'fr' | 'es'
  /** Called after a successful claim so the parent can refresh its bookings list. */
  onClaimed?: () => void
}

export function UnclaimedGoogleEventsCard({ sessionTypes, locale, onClaimed }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [events, setEvents] = useState<OrphanEvent[] | null>(null)
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [claiming, setClaiming] = useState<OrphanEvent | null>(null)

  // Members list — used to populate the picker in the claim modal.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('practitioner_id', user.id)
        .order('first_name', { ascending: true })
      if (data) setMembers(data as MemberOption[])
    })()
  }, [supabase])

  const fetchOrphans = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/calendar/orphan-events', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const json = await res.json()
      if (!json.hasGoogleConnection) {
        setEvents([])
        return
      }
      setEvents(json.events as OrphanEvent[])
    } catch {
      setError(locale === 'fr' ? 'Impossible de charger les événements.' : 'Failed to load events.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrphans()
  }, [])

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  // Hide the entire card when there's nothing to show (no Google events
  // unclaimed) or while we're still figuring that out for the very first
  // load. Don't clutter the page on quiet days.
  if (!loading && (!events || events.length === 0) && !error) return null

  const count = events?.length || 0

  return (
    <>
      <div className="rounded-2xl border border-violet-200 bg-violet-50/40 overflow-hidden">
        <div className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-violet-50/70 transition-colors">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2.5 text-left flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {count > 0
                  ? t(
                      `${count} Google event${count > 1 ? 's' : ''} not linked yet`,
                      `${count} événement${count > 1 ? 's' : ''} Google non rattaché${count > 1 ? 's' : ''}`,
                      `${count} evento${count > 1 ? 's' : ''} de Google sin vincular`,
                    )
                  : t('Google events', 'Événements Google', 'Eventos de Google')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {t(
                  'Booked in Google but not in Bloomsline. Attach each one to a patient.',
                  'Réservés dans Google mais pas dans Bloomsline. Rattachez chacun à un patient.',
                  'Reservados en Google pero no en Bloomsline. Vincula cada uno a un paciente.',
                )}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchOrphans}
              className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-100 transition-colors"
              title={t('Refresh', 'Actualiser', 'Actualizar')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-violet-100 transition-colors"
              title={expanded ? t('Collapse', 'Réduire', 'Contraer') : t('Expand', 'Développer', 'Expandir')}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1">
                {error && (
                  <p className="text-xs text-red-600 px-2 py-2">{error}</p>
                )}
                {loading && !events && (
                  <div className="flex items-center justify-center py-6 text-violet-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">{t('Loading…', 'Chargement…', 'Cargando…')}</span>
                  </div>
                )}
                {events && events.length > 0 && (
                  <div className="space-y-2">
                    {events.map(evt => (
                      <OrphanRow
                        key={evt.googleEventId}
                        event={evt}
                        locale={locale}
                        onClaim={() => setClaiming(evt)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ClaimModal
        event={claiming}
        members={members}
        sessionTypes={sessionTypes}
        locale={locale}
        onClose={() => setClaiming(null)}
        onClaimed={() => {
          setClaiming(null)
          fetchOrphans()
          onClaimed?.()
        }}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Row card
// ---------------------------------------------------------------------------

function OrphanRow({
  event,
  locale,
  onClaim,
}: {
  event: OrphanEvent
  locale: 'en' | 'fr' | 'es'
  onClaim: () => void
}) {
  const start = new Date(event.startTime)
  const dateLabel = start.toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const timeLabel = start.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit', minute: '2-digit', hour12: locale !== 'fr',
  })
  const isPast = start.getTime() < Date.now()
  const FormatIcon = event.hangoutLink ? Video : Building2

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <FormatIcon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 truncate">{event.title || t('(no title)', '(sans titre)', '(sin título)')}</p>
          {isPast && (
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-medium">
              {t('Past', 'Passée', 'Pasada')}
            </span>
          )}
          {event.suggestedMember && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium">
              {t('Match', 'Correspondance', 'Coincidencia')}: {event.suggestedMember.name}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {dateLabel} · {timeLabel}
          {event.attendees[0]?.email && (
            <> · {event.attendees[0].email}</>
          )}
        </p>
      </div>
      <Button
        size="sm"
        onClick={onClaim}
        className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white shrink-0"
      >
        {t('Add to Bloomsline', 'Ajouter à Bloomsline', 'Agregar a Bloomsline')}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Claim modal
// ---------------------------------------------------------------------------

function ClaimModal({
  event,
  members,
  sessionTypes,
  locale,
  onClose,
  onClaimed,
}: {
  event: OrphanEvent | null
  members: MemberOption[]
  sessionTypes: SessionTypeOption[]
  locale: 'en' | 'fr' | 'es'
  onClose: () => void
  onClaimed: () => void
}) {
  const [memberId, setMemberId] = useState<string>('')
  const [sessionTypeId, setSessionTypeId] = useState<string>('')
  const [memberSearch, setMemberSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Pre-pick the suggested member (and a sane session type default) whenever
  // the modal opens with a new event.
  useEffect(() => {
    if (event) {
      setMemberId(event.suggestedMember?.id || '')
      setSessionTypeId(sessionTypes[0]?.id || '')
      setMemberSearch('')
    }
  }, [event, sessionTypes])

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members
    const q = memberSearch.toLowerCase()
    return members.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q),
    )
  }, [members, memberSearch])

  if (!event) return null

  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const dateLabel = start.toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeRange = `${start.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: locale !== 'fr' })} – ${end.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: locale !== 'fr' })}`

  const handleConfirm = async () => {
    if (!memberId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings/claim-google-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleEventId: event.googleEventId,
          memberId,
          sessionTypeId: sessionTypeId || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = json.error || (locale === 'fr' ? 'Échec de l\'ajout' : 'Failed to add')
        toast.error(message)
        return
      }
      toast.success(locale === 'fr' ? 'Séance ajoutée à Bloomsline' : 'Session added to Bloomsline')
      onClaimed()
    } catch {
      toast.error(locale === 'fr' ? 'Échec de l\'ajout' : 'Failed to add')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[210] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">
            {t('Add to Bloomsline', 'Ajouter à Bloomsline', 'Agregar a Bloomsline')}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 px-3 py-2.5 mb-4 space-y-1">
          <p className="text-sm font-medium text-gray-900 truncate">{event.title || t('(no title)', '(sans titre)', '(sin título)')}</p>
          <p className="text-xs text-gray-500">{dateLabel} · {timeRange}</p>
          {event.attendees[0] && (
            <p className="text-xs text-gray-400 truncate">{event.attendees[0].email}</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              {t('Patient', 'Patient', 'Paciente')}
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder={t('Search by name or email', 'Rechercher par nom ou email', 'Buscar por nombre o correo')}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white"
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">
                  {t('No matching patient', 'Aucun patient correspondant', 'Ningún paciente coincide')}
                </p>
              ) : filteredMembers.map(m => {
                const selected = memberId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMemberId(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                      selected ? 'bg-violet-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`truncate ${selected ? 'text-violet-800 font-medium' : 'text-gray-900'}`}>
                        {m.first_name} {m.last_name}
                      </p>
                      {m.email && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
                    </div>
                    {selected && <Check className="w-4 h-4 text-violet-600 shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>
          </div>

          {sessionTypes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {t('Session type', 'Type de séance', 'Tipo de sesión')}
              </label>
              <select
                value={sessionTypeId}
                onChange={e => setSessionTypeId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
              >
                {sessionTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            {t('Cancel', 'Annuler', 'Cancelar')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!memberId || submitting}
            className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {t('Add', 'Ajouter', 'Agregar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
