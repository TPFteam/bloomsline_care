'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Session } from '@/types/member'

type SessionType = 'initial_consultation' | 'follow_up' | 'check_in' | 'crisis' | 'group' | 'other'
type SessionFormat = 'in_person' | 'virtual' | 'phone'

interface EditSessionModalProps {
  session: Session | null
  onClose: () => void
  onSave: () => void
  /**
   * When true, also surface the outcome (attended / no-show) + payment
   * controls — the unified "Edit" for already-closed sessions. Off by
   * default so the simpler edit (NotesTab, scheduled rows) stays unchanged.
   */
  showOutcome?: boolean
}

export function EditSessionModal({ session, onClose, onSave, showOutcome = false }: EditSessionModalProps) {
  const { locale, t } = useLanguage()
  const supabase = createClient()

  const [sessionType, setSessionType] = useState<SessionType>('follow_up')
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>('in_person')
  const [duration, setDuration] = useState(60)
  const [outcome, setOutcome] = useState<'completed' | 'cancelled'>('completed')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  // Populate from session when it changes. Date/time stays in Reschedule;
  // when showOutcome is on we also pre-fill the recorded outcome + payment.
  useEffect(() => {
    if (session) {
      setSessionType(session.session_type as SessionType)
      setSessionFormat(session.session_format as SessionFormat)
      setDuration(session.duration_minutes)
      setOutcome(session.status === 'completed' ? 'completed' : 'cancelled')
      setPaymentStatus((session.payment_status as 'paid' | 'unpaid') || 'unpaid')
      setReason(session.cancellation_reason || '')
    }
  }, [session])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {
        session_type: sessionType,
        session_format: sessionFormat,
        duration_minutes: duration,
        updated_at: new Date().toISOString(),
      }
      if (showOutcome) {
        updates.status = outcome
        updates.payment_status = paymentStatus
        if (outcome === 'completed') {
          // Re-attended: clear any stale cancellation data. Note: the
          // sessions table has no cancelled_at column (that lives on
          // bookings) — writing it here makes Postgres reject the whole
          // update and breaks closing the session.
          updates.cancellation_reason = null
        } else {
          updates.cancellation_reason = reason || null
        }
      }
      const { error } = await supabase.from('sessions').update(updates).eq('id', session.id)
      if (error) throw error

      // Parity: mirror the outcome + payment to the paired booking row.
      if (showOutcome && session.member_id) {
        try {
          const { data: b } = await supabase
            .from('bookings')
            .select('id')
            .eq('practitioner_id', session.practitioner_id)
            .eq('member_id', session.member_id)
            .eq('start_time', session.scheduled_at)
            .maybeSingle()
          if (b) {
            const bUpd: Record<string, unknown> = {
              status: outcome,
              payment_status: paymentStatus,
              updated_at: new Date().toISOString(),
            }
            if (outcome === 'completed') {
              bUpd.cancellation_reason = null
              bUpd.cancelled_at = null
            } else {
              bUpd.cancellation_reason = reason || null
            }
            await supabase.from('bookings').update(bUpd).eq('id', b.id)
          }
        } catch (mirrorErr) {
          console.warn('Could not mirror edited outcome to booking:', mirrorErr)
        }
      }

      toast.success(t.members.success.sessionUpdated)
      onClose()
      onSave()
    } catch (error) {
      console.error('Error updating session:', error)
      toast.error(t.members.errors.sessionSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {session && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-teal-500" />
                {locale === 'fr' ? 'Modifier la séance' : 'Edit Session'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body — only the three fields the practitioner can change
                here. Date/time is reachable via Reschedule; status is set
                through the Show / No-show flow. */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
              <p className="text-xs text-gray-500">
                {locale === 'fr'
                  ? 'Pour changer la date ou l\'heure, utilisez Reprogrammer dans le menu.'
                  : 'To change the date or time, use Reschedule from the menu.'}
              </p>

              {/* Outcome + Payment — only when editing an already-closed
                  session (the unified Edit). Merges the old "Edit close". */}
              {showOutcome && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Déroulement' : 'Outcome'}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOutcome('completed')}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                          outcome === 'completed'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {locale === 'fr' ? 'Présent' : 'Attended'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutcome('cancelled')}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                          outcome === 'cancelled'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        {locale === 'fr' ? 'Absent' : 'No-show'}
                      </button>
                    </div>
                  </div>

                  {/* Reason — only for No-show, editable, pre-filled. */}
                  {outcome === 'cancelled' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Raison' : 'Reason'}
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                      >
                        <option value="">{locale === 'fr' ? 'Sélectionner une raison…' : 'Select a reason…'}</option>
                        {([
                          ['no_communication', locale === 'fr' ? 'Aucune communication' : 'No communication'],
                          ['client_request', locale === 'fr' ? 'Demande du patient' : 'Client request'],
                          ['late_cancellation', locale === 'fr' ? 'Annulation tardive' : 'Late cancellation'],
                          ['illness', locale === 'fr' ? 'Maladie' : 'Illness'],
                          ['forgot', locale === 'fr' ? 'Patient a oublié' : 'Client forgot'],
                          ['emergency', locale === 'fr' ? 'Urgence' : 'Emergency'],
                          ['technical_issue', locale === 'fr' ? 'Problème technique' : 'Technical issue'],
                          ['scheduling_conflict', locale === 'fr' ? "Conflit d'agenda" : 'Scheduling conflict'],
                          ['practitioner_unavailable', locale === 'fr' ? 'Praticien indisponible' : 'Practitioner unavailable'],
                          ['other', locale === 'fr' ? 'Autre' : 'Other'],
                        ] as const).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Paiement' : 'Payment'}
                    </label>
                    <div className="flex gap-2">
                      {(['paid', 'unpaid'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPaymentStatus(opt)}
                          className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                            paymentStatus === opt
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
                </>
              )}

              {/* Type & Format */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.sessionType}
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                  >
                    <option value="initial_consultation">{t.members.sessionTypes.initial_consultation}</option>
                    <option value="follow_up">{t.members.sessionTypes.follow_up}</option>
                    <option value="check_in">{t.members.sessionTypes.check_in}</option>
                    <option value="crisis">{t.members.sessionTypes.crisis}</option>
                    <option value="group">{t.members.sessionTypes.group}</option>
                    <option value="other">{t.members.sessionTypes.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.members.sessions.sessionFormat}
                  </label>
                  <select
                    value={sessionFormat}
                    onChange={(e) => setSessionFormat(e.target.value as SessionFormat)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                  >
                    <option value="in_person">{t.members.sessionFormats.in_person}</option>
                    <option value="virtual">{t.members.sessionFormats.virtual}</option>
                    <option value="phone">{t.members.sessionFormats.phone}</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.members.sessions.duration}
                </label>
                <div className="flex gap-2">
                  {[30, 45, 50, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <Button variant="ghost" onClick={onClose} className="rounded-xl">
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg"
              >
                {saving
                  ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...')
                  : (locale === 'fr' ? 'Enregistrer' : 'Save Changes')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
