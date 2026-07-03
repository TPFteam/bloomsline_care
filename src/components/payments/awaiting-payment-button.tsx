'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wallet, X, Loader2, ChevronRight, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'

const COOLDOWN_MS = 24 * 60 * 60 * 1000

type AwaitingSession = {
  id: string
  scheduled_at: string
  session_type: string | null
  price: number | null
  payment_reminder_sent_at: string | null
}
type Patient = {
  memberId: string
  name: string
  initials: string
  email: string | null
  total: number
  sessions: AwaitingSession[]
  lastRemindedMs: number | null
}

/**
 * Wallet icon for the dashboard. Badge = number of patients awaiting payment.
 * Opens a popup to review who owes, bulk-send reminders (24h cooldown, one
 * email per patient), and quickly mark a session Paid / Not billed (which
 * removes it from the awaiting list).
 */
export function AwaitingPaymentButton({ open: openProp, onOpenChange, hideTrigger }: { open?: boolean; onOpenChange?: (v: boolean) => void; hideTrigger?: boolean } = {}) {
  const supabase = createClient()
  const { locale } = useLanguage()
  const fr = locale === 'fr', es = locale === 'es'
  const lid = fr ? 'fr-FR' : es ? 'es-ES' : 'en-US'

  // Controlled (parent passes `open`) or self-managed. Lets the mobile
  // "Payments" tile open this same popup without the wallet trigger.
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = (v: boolean) => { if (openProp === undefined) setOpenState(v); onOpenChange?.(v) }
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [currency, setCurrency] = useState('EUR')
  // Pending status change awaiting confirmation (dropdown → confirm → apply).
  const [pendingChange, setPendingChange] = useState<{ memberId: string; sessionId: string; status: 'paid' | 'free'; label: string } | null>(null)

  const fmt = (n: number) => {
    try { return new Intl.NumberFormat(lid, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) }
    catch { return `${n} ${currency}` }
  }
  // A session is in cooldown if it was reminded within 24h. A patient is only
  // blocked when ALL their owed sessions are in cooldown (none left to send).
  const sessionCooling = (s: AwaitingSession) => !!s.payment_reminder_sent_at && Date.now() - new Date(s.payment_reminder_sent_at).getTime() < COOLDOWN_MS
  const sendableOf = (p: Patient) => p.sessions.filter(s => !sessionCooling(s))
  const inCooldown = (p: Patient) => sendableOf(p).length === 0
  const lastRemindedOf = (p: Patient) => p.sessions.reduce((max, s) => Math.max(max, s.payment_reminder_sent_at ? new Date(s.payment_reminder_sent_at).getTime() : 0), 0)
  // "Reminded 3h ago · wait 21h" style note for a patient in cooldown.
  const cooldownNote = (p: Patient): string => {
    const sent = lastRemindedOf(p)
    if (!sent) return fr ? 'Rappel envoyé' : es ? 'Recordatorio enviado' : 'Reminded'
    const mins = Math.floor((Date.now() - sent) / 60000)
    const ago = mins < 1 ? (fr ? "à l'instant" : es ? 'ahora' : 'just now') : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h`
    const remH = Math.max(1, Math.ceil((COOLDOWN_MS - (Date.now() - sent)) / 3_600_000))
    return fr ? `Rappel il y a ${ago} · réessayez dans ${remH} h`
      : es ? `Recordatorio hace ${ago} · espere ${remH} h`
      : `Reminded ${ago} ago · wait ${remH}h`
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const nowIso = new Date().toISOString()
      const [sessRes, settingsRes] = await Promise.all([
        supabase.from('sessions')
          .select('id, member_id, scheduled_at, session_type, price, payment_reminder_sent_at')
          .eq('practitioner_id', user.id).eq('payment_status', 'unpaid').lte('scheduled_at', nowIso),
        supabase.from('booking_settings').select('currency, session_types').eq('practitioner_id', user.id).maybeSingle(),
      ])
      const sessions = (sessRes.data || []) as Array<AwaitingSession & { member_id: string }>
      setCurrency((settingsRes.data as { currency?: string } | null)?.currency || 'EUR')
      // Session-type price map (by id / name / name_fr).
      const typePrice: Record<string, number> = {}
      for (const t of ((settingsRes.data as { session_types?: Array<{ id?: string; name?: string; name_fr?: string; price?: number | null }> } | null)?.session_types) || []) {
        if (t.price) { if (t.id) typePrice[t.id] = t.price; if (t.name) typePrice[t.name] = t.price; if (t.name_fr) typePrice[t.name_fr] = t.price }
      }
      const memberIds = [...new Set(sessions.map(s => s.member_id).filter(Boolean))]
      const { data: members } = memberIds.length
        ? await supabase.from('members').select('id, first_name, last_name, email, session_price').in('id', memberIds)
        : { data: [] as Array<{ id: string; first_name: string; last_name: string; email: string | null; session_price: number | null }> }
      const memById = new Map((members || []).map(m => [m.id, m]))
      const priceOf = (s: AwaitingSession & { member_id: string }) =>
        s.price || memById.get(s.member_id)?.session_price || (s.session_type ? typePrice[s.session_type] : 0) || 0

      const byId = new Map<string, Patient>()
      for (const s of sessions) {
        const m = memById.get(s.member_id)
        const name = m ? `${m.first_name} ${m.last_name}`.trim() : (fr ? 'Inconnu' : es ? 'Desconocido' : 'Unknown')
        const initials = m ? `${(m.first_name || '?')[0] || '?'}${(m.last_name || '')[0] || ''}`.toUpperCase() : '–'
        const p: Patient = byId.get(s.member_id) || { memberId: s.member_id, name, initials, email: m?.email ?? null, total: 0, sessions: [], lastRemindedMs: null }
        p.total += priceOf(s)
        p.sessions.push({ id: s.id, scheduled_at: s.scheduled_at, session_type: s.session_type, price: priceOf(s), payment_reminder_sent_at: s.payment_reminder_sent_at })
        const remMs = s.payment_reminder_sent_at ? new Date(s.payment_reminder_sent_at).getTime() : null
        if (remMs && (!p.lastRemindedMs || remMs > p.lastRemindedMs)) p.lastRemindedMs = remMs
        byId.set(s.member_id, p)
      }
      const list = [...byId.values()]
      list.forEach(p => p.sessions.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()))
      list.sort((a, b) => b.total - a.total)
      setPatients(list)
      setCount(list.length)
    } finally {
      setLoading(false)
    }
  }, [supabase, fr, es])

  // Lightweight count for the badge on mount.
  const loadCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('sessions').select('member_id')
      .eq('practitioner_id', user.id).eq('payment_status', 'unpaid').lte('scheduled_at', new Date().toISOString())
    setCount(new Set((data || []).map(d => d.member_id)).size)
  }, [supabase])

  useEffect(() => { loadCount() }, [loadCount])
  // Keep the badge in sync while the popup is open (marking paid drops rows).
  useEffect(() => { if (open) setCount(patients.length) }, [patients, open])

  const openPopup = () => setOpen(true)
  // Load (and reset selection) whenever the popup opens — covers both the
  // wallet trigger and the controlled (mobile tile) path.
  useEffect(() => { if (open) { setSelected(new Set()); setExpanded(null); load() } }, [open, load])

  const selectable = patients.filter(p => !inCooldown(p))
  const allSelected = selectable.length > 0 && selectable.every(p => selected.has(p.memberId))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map(p => p.memberId)))
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const sendReminders = async () => {
    if (selected.size === 0) return
    setSending(true)
    let ok = 0
    try {
      for (const id of selected) {
        const p = patients.find(x => x.memberId === id)
        // Only remind the sessions NOT already reminded in the last 24h.
        const owed = p ? sendableOf(p).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()) : []
        if (!p || !owed.length) continue
        const fmtDate = (iso: string) => new Date(iso).toLocaleString(lid, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
        const res = await fetch('/api/payment-reminder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'sessions', recordId: owed[0].id, locale,
            dateLabel: fmtDate(owed[0].scheduled_at),
            dateLabels: owed.map(s => fmtDate(s.scheduled_at)),
            sessionIds: owed.map(s => s.id),
          }),
        })
        if (res.ok) {
          ok++
          // Stamp only the just-reminded sessions (keep earlier ones as-is).
          const nowIso = new Date().toISOString()
          const sent = new Set(owed.map(s => s.id))
          setPatients(prev => prev.map(x => x.memberId === id
            ? { ...x, sessions: x.sessions.map(s => sent.has(s.id) ? { ...s, payment_reminder_sent_at: nowIso } : s) }
            : x))
        }
      }
      setSelected(new Set())
      toast.success(fr ? `${ok} rappel${ok > 1 ? 's' : ''} envoyé${ok > 1 ? 's' : ''}` : es ? `${ok} recordatorio${ok > 1 ? 's' : ''} enviado${ok > 1 ? 's' : ''}` : `${ok} reminder${ok > 1 ? 's' : ''} sent`)
    } finally {
      setSending(false)
    }
  }

  // Mark one session Paid / Not billed → drop it from the awaiting list.
  const setSessionStatus = async (memberId: string, sessionId: string, status: 'paid' | 'free') => {
    const p = patients.find(x => x.memberId === memberId)
    const s = p?.sessions.find(ss => ss.id === sessionId)
    await supabase.from('sessions').update({ payment_status: status }).eq('id', sessionId)
    // Best-effort mirror to the paired booking (same patient + time).
    if (s) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('bookings').update({ payment_status: status })
        .eq('practitioner_id', user.id).eq('member_id', memberId).eq('start_time', s.scheduled_at)
    }
    setPatients(prev => prev.flatMap(x => {
      if (x.memberId !== memberId) return [x]
      const sessions = x.sessions.filter(ss => ss.id !== sessionId)
      if (sessions.length === 0) return []
      return [{ ...x, sessions, total: sessions.reduce((sum, ss) => sum + (ss.price || 0), 0) }]
    }))
    toast.success(status === 'paid' ? (fr ? 'Marqué payé' : es ? 'Marcado pagado' : 'Marked paid') : (fr ? 'Marqué non facturé' : es ? 'Marcado no facturado' : 'Marked not billed'))
  }

  return (
    <>
      {/* Wallet quick-icon with count badge */}
      {!hideTrigger && (
        <button
          type="button"
          onClick={openPopup}
          title={fr ? 'Paiements en attente' : es ? 'Pagos pendientes' : 'Awaiting payment'}
          aria-label={fr ? 'Paiements en attente' : es ? 'Pagos pendientes' : 'Awaiting payment'}
          className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-gray-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        >
          <Wallet className="w-6 h-6" />
          {!!count && count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">{count}</span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }} onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Wallet className="w-4 h-4 text-emerald-600" /></div>
                <h3 className="text-base font-bold text-gray-900">{fr ? 'En attente de paiement' : es ? 'A la espera de pago' : 'Awaiting payment'}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            {/* Select-all row */}
            {patients.length > 0 && (
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50">
                <button type="button" onClick={toggleAll} className="text-xs font-medium text-gray-600 hover:text-gray-900">
                  {allSelected ? (fr ? 'Tout désélectionner' : es ? 'Deseleccionar todo' : 'Deselect all') : (fr ? 'Tout sélectionner' : es ? 'Seleccionar todo' : 'Select all')}
                </button>
                <span className="text-xs text-gray-400">{selected.size > 0 ? `${selected.size} ${fr ? 'sélectionné(s)' : es ? 'seleccionado(s)' : 'selected'}` : ''}</span>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : patients.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">{fr ? 'Aucun paiement en attente 🎉' : es ? 'Nada pendiente 🎉' : 'Nothing awaiting payment 🎉'}</p>
              ) : patients.map(p => {
                const cooling = inCooldown(p)
                const isOpen = expanded === p.memberId
                return (
                  <div key={p.memberId} className="rounded-lg">
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${cooling ? 'opacity-60' : 'hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        disabled={cooling}
                        checked={selected.has(p.memberId)}
                        onChange={() => toggle(p.memberId)}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900 disabled:cursor-not-allowed"
                      />
                      <button type="button" onClick={() => setExpanded(isOpen ? null : p.memberId)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">{p.initials}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">
                            {cooling
                              ? cooldownNote(p)
                              : `${fr ? 'En attente' : es ? 'A la espera' : 'Awaiting payment'} · ${p.sessions.length} ${fr ? 'séance(s)' : es ? 'sesión(es)' : p.sessions.length === 1 ? 'session' : 'sessions'}`}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{fmt(p.total)}</span>
                        <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="pl-12 pr-3 pb-2 space-y-1.5">
                        {p.sessions.map(s => (
                          <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-1.5 text-gray-500 min-w-0">
                              <span className="truncate">{new Date(s.scheduled_at).toLocaleString(lid, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              {sessionCooling(s) && (
                                <span className="shrink-0 text-[10px] font-medium text-emerald-600">✓ {fr ? 'Rappel envoyé' : es ? 'Recordatorio enviado' : 'Reminded'}</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-gray-600 font-medium">{fmt(s.price || 0)}</span>
                              <select
                                value="unpaid"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const v = e.target.value as 'paid' | 'free' | 'unpaid'
                                  if (v === 'paid' || v === 'free') {
                                    const label = v === 'paid' ? (fr ? 'Payé' : es ? 'Pagado' : 'Paid') : (fr ? 'Non facturé' : es ? 'No facturado' : 'Not billed')
                                    setPendingChange({ memberId: p.memberId, sessionId: s.id, status: v, label })
                                  }
                                }}
                                className="text-[11px] border border-gray-200 rounded-md pl-1.5 pr-5 py-1 bg-white text-amber-700 font-medium cursor-pointer hover:border-gray-300"
                              >
                                <option value="unpaid">{fr ? 'En attente de paiement' : es ? 'A la espera de pago' : 'Awaiting payment'}</option>
                                <option value="paid">{fr ? 'Marquer payé' : es ? 'Marcar pagado' : 'Mark as Paid'}</option>
                                <option value="free">{fr ? 'Marquer non facturé' : es ? 'Marcar no facturado' : 'Mark as Not billed'}</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer — bulk send */}
            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={sendReminders}
                disabled={selected.size === 0 || sending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {selected.size > 0
                  ? (fr ? `Envoyer ${selected.size} rappel${selected.size > 1 ? 's' : ''}` : es ? `Enviar ${selected.size} recordatorio${selected.size > 1 ? 's' : ''}` : `Send ${selected.size} reminder${selected.size > 1 ? 's' : ''}`)
                  : (fr ? 'Sélectionnez des patients' : es ? 'Selecciona pacientes' : 'Select patients to remind')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm a status change before applying it. */}
      {pendingChange && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 10001 }} onClick={() => setPendingChange(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{fr ? 'Changer le statut ?' : es ? '¿Cambiar el estado?' : 'Change status?'}</h3>
            <p className="text-sm text-gray-600 mb-5">
              {fr
                ? <>Marquer cette séance comme <strong>{pendingChange.label}</strong> ?</>
                : es
                  ? <>¿Marcar esta sesión como <strong>{pendingChange.label}</strong>?</>
                  : <>Mark this session as <strong>{pendingChange.label}</strong>?</>}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setPendingChange(null)} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                {fr ? 'Annuler' : es ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => { const pc = pendingChange; setPendingChange(null); await setSessionStatus(pc.memberId, pc.sessionId, pc.status) }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white"
              >
                {fr ? 'Confirmer' : es ? 'Confirmar' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
