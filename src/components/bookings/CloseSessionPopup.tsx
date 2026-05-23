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

export interface CloseSessionBooking {
  id: string
  practitioner_id: string
  member_id?: string | null
  client_name?: string | null
  start_time: string
  practitioner_notes?: string | null
}

export interface CloseSessionResult {
  bookingId: string
  status: 'completed' | 'cancelled'
  payment_status: 'paid' | 'unpaid'
}

interface Props {
  booking: CloseSessionBooking | null
  onClose: () => void
  /** Called after a successful save so the host can refresh local data. */
  onSaved?: (result: CloseSessionResult) => void
  locale: string
}

export function CloseSessionPopup({ booking, onClose, onSaved, locale }: Props) {
  const [outcome, setOutcome] = useState<'show' | 'no_show' | null>(null)
  const [saving, setSaving] = useState(false)
  // Show branch
  const [showPayment, setShowPayment] = useState<'paid' | 'unpaid' | null>(null)
  const [showNoteAction, setShowNoteAction] = useState<'take' | 'skip' | 'has' | null>(null)
  const [showNoteDraft, setShowNoteDraft] = useState('')
  // No-show branch
  const [noShowPayment, setNoShowPayment] = useState<'paid' | 'unpaid' | null>(null)
  const [noShowReason, setNoShowReason] = useState('')
  const [noShowComments, setNoShowComments] = useState('')

  // Reset state each time a new booking opens. "Note already added"
  // detection auto-satisfies the note requirement when the booking
  // already carries practitioner_notes.
  useEffect(() => {
    if (!booking) return
    setOutcome(null)
    setSaving(false)
    setShowPayment(null)
    const hasExistingNote = !!(booking.practitioner_notes && booking.practitioner_notes.trim().length > 0)
    setShowNoteAction(hasExistingNote ? 'has' : null)
    setShowNoteDraft('')
    setNoShowPayment(null)
    setNoShowReason('')
    setNoShowComments('')
  }, [booking])

  if (!booking) return null

  const handleClose = () => {
    if (saving) return
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
      //   'no_show' → both rows status='cancelled' (no_show is just a
      //               reason; we store it as cancelled per founder's call).
      const mirrorToSession = async (
        sessionStatus: 'completed' | 'cancelled',
        paymentStatus: 'paid' | 'unpaid',
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
            .not('status', 'in', '("completed","cancelled")')
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
        if (showNoteAction === 'take' && showNoteDraft.replace(/<[^>]*>/g, '').trim()) {
          const existing = booking.practitioner_notes || ''
          updates.practitioner_notes = existing
            ? existing + '\n\n' + showNoteDraft
            : showNoteDraft
        }
        const { error } = await sb.from('bookings').update(updates).eq('id', booking.id)
        if (error) throw error
        await mirrorToSession('completed', showPayment)
        emitBookingsChanged()
        onSaved?.({ bookingId: booking.id, status: 'completed', payment_status: showPayment })
        onClose()
        toast.success(locale === 'fr' ? 'Rendez-vous marqué comme terminé' : 'Booking marked as completed')
      } else {
        if (noShowPayment === null || !noShowReason) { setSaving(false); return }
        const updates: Record<string, unknown> = {
          status: 'cancelled',
          payment_status: noShowPayment,
          cancellation_reason: noShowReason,
          cancelled_at: new Date().toISOString(),
        }
        if (noShowComments.trim()) {
          const existing = booking.practitioner_notes || ''
          updates.practitioner_notes = (existing
            ? existing + '\n\n' + noShowComments.trim()
            : noShowComments.trim()).trim()
        }
        const { error } = await sb.from('bookings').update(updates).eq('id', booking.id)
        if (error) throw error
        await mirrorToSession('cancelled', noShowPayment, noShowReason)
        emitBookingsChanged()
        onSaved?.({ bookingId: booking.id, status: 'cancelled', payment_status: noShowPayment })
        onClose()
        toast.success(locale === 'fr' ? 'Rendez-vous marqué comme annulé' : 'Booking marked as cancelled')
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
            {locale === 'fr' ? 'Clôturer la séance' : 'Close session'}
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

        {/* Outcome */}
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

        {/* Show branch */}
        {outcome === 'show' && (
          <>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Paiement' : 'Payment'}
              </p>
              <div className="flex gap-2">
                {(['paid', 'unpaid'] as const).map(opt => (
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
                    {opt === 'paid'
                      ? (locale === 'fr' ? 'Payé' : 'Paid')
                      : (locale === 'fr' ? 'Non payé' : 'Unpaid')}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Note de séance' : 'Session note'}
              </p>
              {showNoteAction === 'has' ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>{locale === 'fr' ? 'Note déjà ajoutée' : 'Note already added'}</span>
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
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowNoteAction('skip'); setShowNoteDraft('') }}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                  >
                    {locale === 'fr' ? '← Sans note' : '← No note'}
                  </button>
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
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Paiement' : 'Payment'}
              </p>
              <div className="flex gap-2">
                {(['paid', 'unpaid'] as const).map(opt => (
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
                    {opt === 'paid'
                      ? (locale === 'fr' ? 'Payé' : 'Paid')
                      : (locale === 'fr' ? 'Non payé' : 'Unpaid')}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {locale === 'fr' ? 'Raison' : 'Reason'}
              </p>
              <select
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="" disabled>
                  {locale === 'fr' ? 'Sélectionner une raison…' : 'Select a reason…'}
                </option>
                {([
                  ['no_communication', locale === 'fr' ? 'Aucune communication' : 'No communication'],
                  ['client_request', locale === 'fr' ? 'Demande du patient' : 'Client request'],
                  ['late_cancellation', locale === 'fr' ? 'Annulation tardive' : 'Late cancellation'],
                  ['illness', locale === 'fr' ? 'Maladie' : 'Illness'],
                  ['forgot', locale === 'fr' ? 'Patient a oublié' : 'Client forgot'],
                  ['emergency', locale === 'fr' ? 'Urgence' : 'Emergency'],
                  ['technical_issue', locale === 'fr' ? 'Problème technique' : 'Technical issue'],
                  ['scheduling_conflict', locale === 'fr' ? 'Conflit d\'agenda' : 'Scheduling conflict'],
                  ['practitioner_unavailable', locale === 'fr' ? 'Praticien indisponible' : 'Practitioner unavailable'],
                  ['other', locale === 'fr' ? 'Autre' : 'Other'],
                ] as const).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <textarea
                value={noShowComments}
                onChange={(e) => setNoShowComments(e.target.value)}
                placeholder={locale === 'fr' ? 'Commentaires supplémentaires (optionnel)' : 'Additional comments (optional)'}
                rows={3}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
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
  )
}
