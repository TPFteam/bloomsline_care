/**
 * Shared close-session popup — the "How did this session go?" flow.
 *
 * Used from both /bookings (row menu) and /dashboard (the "Sessions to
 * close" list). Self-contained: owns its own state for outcome / payment
 * / note / no-show reason, and runs the supabase writes that flip the
 * booking + paired session row.
 *
 * Host pages just render <CloseSessionPopup booking={…} onClose={…}
 * onSaved={…} /> — the popup unmounts when `booking` is null.
 */

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, XCircle, PenLine, Loader2 } from 'lucide-react'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { emitBookingsChanged } from '@/lib/bookings-events'
import { DEFAULT_NOTE_TYPES, FIXED_NOTE_TYPES } from '@/types/member'
import type { PaymentStatus } from '@/types/member'
import { PAYMENT_OPTIONS, paymentLabel } from '@/lib/payments'
import { reasonToStatus, reasonToPaymentDefault, getCloseReasonGroups } from '@/lib/sessions/close-reasons'

const TAG_LABELS: Record<string, { en: string; fr: string; es: string }> = {
  recurrence:          { en: 'Recurrence',          fr: 'Récurrence',          es: 'Recurrencia' },
  hypothese:           { en: 'Hypothesis',          fr: 'Hypothèse',           es: 'Hipótesis' },
  general:             { en: 'General',             fr: 'Général',             es: 'General' },
  symptome:            { en: 'Symptom',             fr: 'Symptôme',            es: 'Síntoma' },
  transfert:           { en: 'Transference',        fr: 'Transfert',           es: 'Transferencia' },
  contre_transfert:    { en: 'Countertransference', fr: 'Contre-transfert',    es: 'Contratransferencia' },
  ajustement_envisage: { en: 'Planned adjustment',  fr: 'Ajustement envisagé', es: 'Ajuste previsto' },
}

export interface CloseSessionBooking {
  id: string
  practitioner_id: string
  member_id?: string | null
  client_name?: string | null
  start_time: string
  practitioner_notes?: string | null
  /** Current payment so the close popup can pre-select it (Paid stays Paid). */
  payment_status?: PaymentStatus | null
}

export interface CloseSessionResult {
  bookingId: string
  status: 'completed' | 'cancelled' | 'no_show'
  payment_status: PaymentStatus
}

interface Props {
  booking: CloseSessionBooking | null
  onClose: () => void
  /** Called after a successful save so the host can refresh local data. */
  onSaved?: (result: CloseSessionResult) => void
  locale: string
  /**
   * Pre-selected outcome. When set (the practitioner clicked Show / No-show
   * directly on the row), we skip the "How did this session go?" toggle and
   * go straight to the fields. Omitted for "Edit close", which keeps the
   * toggle so the recorded outcome can be switched.
   */
  initialOutcome?: 'show' | 'no_show'
}

// Fire-and-forget: ask the server to email the client a thank-you + payment
// link. The endpoint no-ops unless the practitioner configured a payment link,
// so it's safe to call on every "Awaiting payment" close.
function notifyPaymentRequest(bookingId: string, locale: string) {
  fetch('/api/payment-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, locale }),
  }).catch(() => { /* best-effort; manual reminder remains available */ })
}

export function CloseSessionPopup({ booking, onClose, onSaved, locale, initialOutcome }: Props) {
  const [outcome, setOutcome] = useState<'show' | 'no_show' | null>(initialOutcome ?? null)
  const [saving, setSaving] = useState(false)
  // Show branch
  const [showPayment, setShowPayment] = useState<PaymentStatus | null>(null)
  const [showNoteAction, setShowNoteAction] = useState<'take' | 'skip' | 'has' | null>(null)
  const [showNoteDraft, setShowNoteDraft] = useState('')
  // No-show branch
  const [noShowPayment, setNoShowPayment] = useState<PaymentStatus | null>(null)
  const [noShowReason, setNoShowReason] = useState('')
  const [noShowComments, setNoShowComments] = useState('')
  // Tag types for the inline tag picker — same shape as the main notes editor
  const [noteTypes, setNoteTypes] = useState<{ type: string; label: string }[]>([])
  // Guard against accidentally closing (backdrop / X / Cancel) while an
  // unsaved note is being written and losing it.
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  // True when editing an already-saved note (Edit on "Note already added").
  // Editing REPLACES the existing note instead of appending a new entry.
  const [noteEditing, setNoteEditing] = useState(false)

  // Reset state each time a new booking opens. "Note already added"
  // detection auto-satisfies the note requirement when the booking
  // already carries practitioner_notes.
  useEffect(() => {
    if (!booking) return
    setOutcome(initialOutcome ?? null)
    setSaving(false)
    // Carry the booking's current payment into the popup (Paid stays Paid).
    setShowPayment(booking.payment_status ?? null)
    const hasExistingNote = !!(booking.practitioner_notes && booking.practitioner_notes.trim().length > 0)
    setShowNoteAction(hasExistingNote ? 'has' : null)
    setShowNoteDraft('')
    setNoteEditing(false)
    setNoShowPayment(booking.payment_status === 'paid' ? 'paid' : null)
    setNoShowReason('')
    setNoShowComments('')
    setConfirmingDiscard(false)
  }, [booking, initialOutcome])

  // Build the practitioner's tag list (defaults + custom) so the inline
  // editor here gets the same tag-insert button as the main notes editor.
  useEffect(() => {
    if (!booking?.practitioner_id) return
    let cancelled = false
    const sb = createClient()
    const labelFor = (slug: string) =>
      TAG_LABELS[slug]?.[locale as 'en' | 'fr' | 'es'] || slug.replace(/_/g, ' ')

    ;(async () => {
      const { data: userRow } = await sb
        .from('users')
        .select('uses_legacy_default_tags')
        .eq('id', booking.practitioner_id)
        .maybeSingle()
      if (cancelled) return
      const baseDefaults = userRow?.uses_legacy_default_tags ? DEFAULT_NOTE_TYPES : FIXED_NOTE_TYPES

      const { data: customs } = await sb
        .from('custom_note_types')
        .select('type_name')
        .eq('practitioner_id', booking.practitioner_id)
        .order('created_at')
      if (cancelled) return

      // Split `_hidden:*` markers from real customs so soft-deleted
      // defaults stay hidden after a refresh.
      const hiddenSet = new Set<string>()
      const realCustoms: string[] = []
      if (customs) {
        for (const c of customs) {
          if (c.type_name.startsWith('_hidden:')) {
            hiddenSet.add(c.type_name.replace('_hidden:', ''))
          } else {
            realCustoms.push(c.type_name)
          }
        }
      }

      const types: { type: string; label: string }[] = baseDefaults
        .filter(nt => !hiddenSet.has(nt))
        .map(nt => ({ type: nt, label: labelFor(nt) }))
      for (const c of realCustoms) {
        if (!types.some(t => t.type === c)) {
          types.push({ type: c, label: labelFor(c) })
        }
      }
      setNoteTypes(types)
    })()

    return () => { cancelled = true }
  }, [booking?.practitioner_id, locale])

  if (!booking) return null

  // Has the practitioner typed note content that would be lost on close?
  // (session note draft, or the no-show free-text comments)
  const hasUnsavedNote =
    (showNoteAction === 'take' && showNoteDraft.replace(/<[^>]*>/g, '').trim().length > 0) ||
    noShowComments.trim().length > 0

  const handleClose = () => {
    if (saving) return
    // Don't silently drop a note in progress — confirm first.
    if (hasUnsavedNote) {
      setConfirmingDiscard(true)
      return
    }
    onClose()
  }

  const confirm = async () => {
    if (!outcome) return
    setSaving(true)
    try {
      const sb = createClient()
      // Mirror the booking close to the paired session row so the
      // member page's Sessions tab doesn't show it as "scheduled"
      // while bookings already has it closed.
      //   'show'    → both rows status='completed'
      //   'no_show' → both rows status='no_show' (distinct from a real
      //               cancellation so the calendar reads "No-show", not
      //               "Cancelled").
      const mirrorToSession = async (
        sessionStatus: 'completed' | 'cancelled' | 'no_show',
        paymentStatus: PaymentStatus,
        cancellationReason?: string,
      ) => {
        if (!booking.member_id) return
        try {
          const sessionUpdates: Record<string, unknown> = {
            status: sessionStatus,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          }
          if (cancellationReason) sessionUpdates.cancellation_reason = cancellationReason
          await sb
            .from('sessions')
            .update(sessionUpdates)
            .eq('practitioner_id', booking.practitioner_id)
            .eq('member_id', booking.member_id)
            .eq('scheduled_at', booking.start_time)
            .not('status', 'in', '("completed","cancelled","no_show")')
        } catch (sessErr) {
          console.warn('Could not propagate close to matching session:', sessErr)
        }
      }

      if (outcome === 'show') {
        if (showPayment === null || showNoteAction === null) { setSaving(false); return }
        const updates: Record<string, unknown> = {
          status: 'completed',
          payment_status: showPayment,
        }
        // Editing an existing note REPLACES it (or clears it when emptied);
        // a fresh note APPENDS so a prior entry isn't lost.
        if (noteEditing) {
          const plain = showNoteDraft.replace(/<[^>]*>/g, '').trim()
          updates.practitioner_notes = plain ? showNoteDraft : null
        } else if (showNoteAction === 'take' && showNoteDraft.replace(/<[^>]*>/g, '').trim()) {
          const existing = booking.practitioner_notes || ''
          updates.practitioner_notes = existing
            ? existing + '\n\n' + showNoteDraft
            : showNoteDraft
        }
        const { error } = await sb.from('bookings').update(updates).eq('id', booking.id)
        if (error) throw error
        await mirrorToSession('completed', showPayment)
        // Awaiting payment → email the client a thank-you + payment link
        // (only fires server-side if a payment link is configured).
        if (showPayment === 'unpaid') void notifyPaymentRequest(booking.id, locale)
        emitBookingsChanged()
        // Fire a background Pulse regeneration. Closing a session is
        // the most meaningful update event — practitioners reported
        // the Pulse felt stale after they finished a session.
        if (booking.member_id) void triggerPulseRegen(sb, booking.member_id, locale)
        onSaved?.({ bookingId: booking.id, status: 'completed', payment_status: showPayment })
        onClose()
        toast.success(locale === 'fr' ? 'Rendez-vous marqué comme terminé' : 'Booking marked as completed')
      } else {
        if (noShowPayment === null || !noShowReason) { setSaving(false); return }
        // The reason decides: no-contact reasons → no_show; called-off → cancelled.
        const closeStatus = reasonToStatus(noShowReason)
        const updates: Record<string, unknown> = {
          status: closeStatus,
          payment_status: noShowPayment,
          cancellation_reason: noShowReason,
        }
        if (noShowComments.trim()) {
          const existing = booking.practitioner_notes || ''
          updates.practitioner_notes = (existing
            ? existing + '\n\n' + noShowComments.trim()
            : noShowComments.trim()).trim()
        }
        const { error } = await sb.from('bookings').update(updates).eq('id', booking.id)
        if (error) throw error
        await mirrorToSession(closeStatus, noShowPayment, noShowReason)
        if (noShowPayment === 'unpaid') void notifyPaymentRequest(booking.id, locale)
        emitBookingsChanged()
        if (booking.member_id) void triggerPulseRegen(sb, booking.member_id, locale)
        onSaved?.({ bookingId: booking.id, status: closeStatus, payment_status: noShowPayment })
        onClose()
        toast.success(closeStatus === 'cancelled'
          ? (locale === 'fr' ? 'Rendez-vous marqué comme annulé' : 'Booking marked as cancelled')
          : (locale === 'fr' ? 'Rendez-vous marqué comme absence' : 'Booking marked as no-show'))
      }
    } catch (err) {
      console.error('CloseSessionPopup save error:', err)
      toast.error(locale === 'fr' ? 'Erreur lors de la mise à jour' : 'Failed to update booking')
    } finally {
      setSaving(false)
    }
  }

  const confirmDisabled =
    saving ||
    !outcome ||
    (outcome === 'show' && (showPayment === null || showNoteAction === null)) ||
    (outcome === 'no_show' && (noShowPayment === null || !noShowReason))

  return (
    <>
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full p-6 max-h-[90vh] overflow-y-auto transition-[max-width] duration-200 ${
          outcome === 'show' && showNoteAction === 'take' ? 'max-w-2xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {initialOutcome === 'show'
              ? (locale === 'fr' ? 'Séance présente' : 'Mark as attended')
              : initialOutcome === 'no_show'
                ? (locale === 'fr' ? 'Marquer absence' : 'Mark as no-show')
                : (locale === 'fr' ? 'Clôturer la séance' : 'Close session')}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outcome — hidden when pre-selected from a Show / No-show row button */}
        {!initialOutcome && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            {locale === 'fr' ? "Comment s'est passée la séance ?" : 'How did this session go?'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOutcome('show')}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition ${
                outcome === 'show'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {locale === 'fr' ? 'Présent' : 'Show'}
            </button>
            <button
              type="button"
              onClick={() => setOutcome('no_show')}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium border transition ${
                outcome === 'no_show'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <XCircle className="w-4 h-4" />
              {locale === 'fr' ? 'Absent' : 'No show'}
            </button>
          </div>
        </div>
        )}

        {/* Show branch */}
        {outcome === 'show' && (
          <>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Paiement' : 'Payment'}
              </p>
              <div className="flex gap-2">
                {PAYMENT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setShowPayment(opt)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                      showPayment === opt
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {paymentLabel(opt, locale)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Note de séance' : 'Session note'}
              </p>
              {showNoteAction === 'has' ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {locale === 'fr' ? 'Note déjà ajoutée' : 'Note already added'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoteDraft(booking.practitioner_notes || '')
                      setNoteEditing(true)
                      setShowNoteAction('take')
                    }}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline shrink-0"
                  >
                    {locale === 'fr' ? 'Modifier' : 'Edit'}
                  </button>
                </div>
              ) : showNoteAction === 'take' ? (
                <div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <RichTextEditor
                      value={showNoteDraft}
                      onChange={setShowNoteDraft}
                      placeholder={locale === 'fr' ? 'Rédigez votre note de séance...' : 'Write your session note...'}
                      memberId={booking.member_id || ''}
                      locale={locale}
                      autoFocus
                      memberName={booking.client_name?.split(' ')[0]}
                      noteTypes={noteTypes}
                    />
                  </div>
                  {noteEditing ? (
                    <button
                      type="button"
                      onClick={() => { setShowNoteAction('has'); setShowNoteDraft(''); setNoteEditing(false) }}
                      className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                    >
                      {locale === 'fr' ? '← Garder la note d\'origine' : '← Keep original note'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setShowNoteAction('skip'); setShowNoteDraft('') }}
                      className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                    >
                      {locale === 'fr' ? '← Sans note' : '← No note'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteAction('take')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <PenLine className="w-4 h-4 text-gray-500" />
                    {locale === 'fr' ? 'Prendre des notes' : 'Take notes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNoteAction('skip')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 border border-gray-200 text-gray-600"
                  >
                    {locale === 'fr' ? 'Aucune note' : 'No notes'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* No-show branch */}
        {outcome === 'no_show' && (
          <>
            {/* Reason first — what happened decides no-show vs cancelled,
                and you can't judge payment until you know. */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Que s\'est-il passé ?' : 'What happened?'}
              </p>
              <select
                value={noShowReason}
                onChange={(e) => {
                  const r = e.target.value
                  setNoShowReason(r)
                  // Smart payment default: no-shows are billable (you held
                  // the slot) → Paid; cancellations → no default, practitioner picks.
                  setNoShowPayment(booking.payment_status === 'paid' ? 'paid' : reasonToPaymentDefault(r))
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="" disabled>
                  {locale === 'fr' ? 'Sélectionner une raison…' : 'Select a reason…'}
                </option>
                {getCloseReasonGroups(locale).map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </optgroup>
                    ))}
              </select>
              {noShowReason && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {reasonToStatus(noShowReason) === 'cancelled'
                    ? (locale === 'fr' ? 'Sera enregistrée comme annulation.' : 'Will be recorded as a cancellation.')
                    : (locale === 'fr' ? 'Sera enregistrée comme absence.' : 'Will be recorded as a no-show.')}
                </p>
              )}
              <textarea
                value={noShowComments}
                onChange={(e) => setNoShowComments(e.target.value)}
                placeholder={locale === 'fr' ? 'Commentaires supplémentaires (optionnel)' : 'Additional comments (optional)'}
                rows={3}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Paiement' : 'Payment'}
              </p>
              <div className="flex gap-2">
                {PAYMENT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setNoShowPayment(opt)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                      noShowPayment === opt
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {paymentLabel(opt, locale)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            {locale === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button
            onClick={confirm}
            disabled={confirmDisabled}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {locale === 'fr' ? 'Confirmer' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>

    {/* Unsaved-note guard: confirm before discarding a note in progress. */}
    {confirmingDiscard && (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        style={{ zIndex: 10000 }}
        onClick={() => setConfirmingDiscard(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {locale === 'fr' ? 'Note non enregistrée' : 'Unsaved note'}
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            {locale === 'fr'
              ? 'Vous avez commencé une note qui n\'a pas encore été enregistrée. Si vous fermez maintenant, elle sera perdue.'
              : "You've started a note that hasn't been saved yet. If you close now, it will be lost."}
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmingDiscard(false)}
            >
              {locale === 'fr' ? 'Continuer la note' : 'Keep editing'}
            </Button>
            <Button
              onClick={() => { setConfirmingDiscard(false); onClose() }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {locale === 'fr' ? 'Abandonner' : 'Discard'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// Fire-and-forget regenerate of the member's Bloom Pulse after a
// session close. We don't await — the close UI shouldn't wait for an
// AI generation. The endpoint takes the practitioner's auth token via
// Authorization header.
async function triggerPulseRegen(
  sb: ReturnType<typeof createClient>,
  memberId: string,
  locale: string,
): Promise<void> {
  try {
    const { data: { session } } = await sb.auth.getSession()
    if (!session?.access_token) return
    void fetch(`/api/members/${memberId}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ locale }),
    }).catch(() => {})
  } catch {}
}
