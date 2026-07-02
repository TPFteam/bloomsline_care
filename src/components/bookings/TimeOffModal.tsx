'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Palmtree, Plus, Trash2, Loader2, Sun, Sunset, CalendarOff, ChevronLeft, ChevronRight, X, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  format, parseISO, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay,
} from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'

type Portion = 'full' | 'morning' | 'afternoon'

interface TimeOffItem {
  id: string
  date: string // YYYY-MM-DD
  portion: Portion
  reason: string | null
}

interface Block {
  ids: string[]
  start: string
  end: string
  portion: Portion
  reason: string | null
}

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

function groupBlocks(items: TimeOffItem[]): Block[] {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))
  const blocks: Block[] = []
  for (const it of sorted) {
    const prev = blocks[blocks.length - 1]
    const isNextDay = prev && (() => {
      const d = parseISO(prev.end); d.setDate(d.getDate() + 1)
      return ymd(d) === it.date
    })()
    if (prev && isNextDay && prev.portion === it.portion && (prev.reason || '') === (it.reason || '')) {
      prev.end = it.date
      prev.ids.push(it.id)
    } else {
      blocks.push({ ids: [it.id], start: it.date, end: it.date, portion: it.portion, reason: it.reason })
    }
  }
  return blocks
}

export function TimeOffModal({
  open, onClose, locale, onChanged,
}: { open: boolean; onClose: () => void; locale: string; onChanged?: () => void }) {
  const fr = locale === 'fr'
  const dfns = fr ? { locale: frLocale } : undefined

  const [items, setItems] = useState<TimeOffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingKey, setRemovingKey] = useState<string | null>(null)

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [portion, setPortion] = useState<Portion>('full')
  const [reason, setReason] = useState('')
  // Non-null when the form is editing an existing entry (vs. adding a new one).
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/availability/time-off')
      const d = await res.json().catch(() => ({ items: [] }))
      setItems(d.items || [])
    } catch {
      /* keep prior list on transient failure */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (open) { setLoading(true); load() } }, [open, load])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const portionMeta: Record<Portion, { label: string; icon: typeof Sun }> = {
    full: { label: fr ? 'Journée complète' : 'Full day', icon: CalendarOff },
    morning: { label: fr ? 'Première moitié' : 'First half', icon: Sun },
    afternoon: { label: fr ? 'Seconde moitié' : 'Second half', icon: Sunset },
  }

  // Blocked dates (already time off) → highlighted on the picker with a hover
  // tooltip. Keyed by date so we can show the duration + reason.
  const blockedByDate = new Map<string, TimeOffItem>()
  for (const it of items) blockedByDate.set(it.date, it)

  // Range selection, hotel-booking style: first click sets the start, second
  // click sets the end; clicking before the start (or after a full range)
  // restarts the selection.
  const clickDay = (dateStr: string) => {
    if (!rangeStart || (rangeStart && rangeEnd)) { setRangeStart(dateStr); setRangeEnd(null); return }
    if (dateStr < rangeStart) { setRangeStart(dateStr); return }
    setRangeEnd(dateStr)
  }

  // Effective end used for highlighting (previews the hovered day mid-selection).
  const previewEnd = rangeEnd || (rangeStart && hover && hover >= rangeStart ? hover : null)
  const inRange = (d: string) => !!rangeStart && !!previewEnd && d >= rangeStart && d <= previewEnd
  const isStart = (d: string) => d === rangeStart
  const isEnd = (d: string) => !!previewEnd && d === previewEnd

  const gridDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })
  const weekdayLabels = fr ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const fmt = (d: string) => format(parseISO(d), fr ? 'd MMM yyyy' : 'MMM d, yyyy', dfns)
  const rangeLabel = () => {
    if (!rangeStart) return fr ? 'Sélectionnez des dates' : 'Select dates'
    if (!rangeEnd) return fmt(rangeStart)
    return `${fmt(rangeStart)}  →  ${fmt(rangeEnd)}`
  }

  const resetForm = () => {
    setRangeStart(null); setRangeEnd(null); setHover(null); setReason(''); setPortion('full'); setEditingBlock(null)
  }

  // Load an existing entry back into the picker for editing.
  const startEdit = (b: Block) => {
    setEditingBlock(b)
    setRangeStart(b.start)
    setRangeEnd(b.start === b.end ? null : b.end)
    setHover(null)
    setPortion(b.portion)
    setReason(b.reason || '')
    setMonth(startOfMonth(parseISO(b.start)))
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    if (!rangeStart) { toast.error(fr ? 'Sélectionnez au moins une date' : 'Select at least one date'); return }
    setSaving(true)
    // When editing, drop the original entry first so shrinking the range
    // doesn't leave orphaned blocked days (the POST is idempotent per date,
    // so overlapping dates are safely rewritten).
    if (editingBlock) {
      const del = await fetch('/api/availability/time-off', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: editingBlock.ids }),
      })
      if (!del.ok) { setSaving(false); toast.error(fr ? "Échec de l'enregistrement" : 'Failed to save'); return }
    }
    const res = await fetch('/api/availability/time-off', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: rangeStart, endDate: rangeEnd || rangeStart, portion, reason: reason.trim() || undefined }),
    })
    setSaving(false)
    if (!res.ok) { toast.error(fr ? "Échec de l'enregistrement" : 'Failed to save'); return }
    toast.success(editingBlock ? (fr ? 'Congé mis à jour' : 'Time off updated') : (fr ? 'Congé ajouté' : 'Time off added'))
    resetForm()
    await load()
    onChanged?.()
  }

  const remove = async (block: Block) => {
    const key = block.ids.join(',')
    setRemovingKey(key)
    const res = await fetch('/api/availability/time-off', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: block.ids }),
    })
    setRemovingKey(null)
    if (!res.ok) { toast.error(fr ? 'Échec de la suppression' : 'Failed to remove'); return }
    toast.success(fr ? 'Congé supprimé' : 'Time off removed')
    await load()
    onChanged?.()
  }

  const blocks = groupBlocks(items)
  const rangeLabelText = (b: Block) => (b.start === b.end ? fmt(b.start) : `${fmt(b.start)} → ${fmt(b.end)}`)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={scrollRef} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Palmtree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{fr ? 'Congés et absences' : 'Holidays & time off'}</h2>
              <p className="text-xs text-gray-500">{fr ? 'Masqués automatiquement de vos réservations' : 'Automatically hidden from your bookings'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Month calendar — range select */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMonth((m) => addMonths(m, -1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-800 capitalize">{format(month, 'MMMM yyyy', dfns)}</span>
              <button onClick={() => setMonth((m) => addMonths(m, 1))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {weekdayLabels.map((w, i) => (
                <div key={i} className="text-[10px] font-medium text-gray-400 uppercase pb-1">{w}</div>
              ))}
              {gridDays.map((day) => {
                const ds = ymd(day)
                const dim = !isSameMonth(day, month)
                const today = isSameDay(day, new Date())
                const selStart = isStart(ds)
                const selEnd = isEnd(ds)
                const within = inRange(ds) && !selStart && !selEnd
                const blocked = blockedByDate.get(ds)
                // Show the amber "holiday" circle only when the day isn't part
                // of the current selection highlight (teal takes precedence).
                const showBlocked = !!blocked && !selStart && !selEnd && !within
                const tip = blocked ? `${portionMeta[blocked.portion].label}${blocked.reason ? ` · ${blocked.reason}` : ''}` : undefined
                return (
                  <button
                    key={ds}
                    type="button"
                    onClick={() => clickDay(ds)}
                    onMouseEnter={() => setHover(ds)}
                    className={`relative h-9 text-sm flex items-center justify-center transition-colors
                      ${hover === ds && showBlocked ? 'z-20' : ''}
                      ${within ? 'bg-teal-50' : ''}
                      ${selStart ? 'rounded-l-lg' : ''} ${selEnd ? 'rounded-r-lg' : ''}
                      ${(selStart || selEnd) ? 'bg-teal-600 text-white font-semibold rounded-lg' : ''}
                      ${!selStart && !selEnd && !within ? 'hover:bg-gray-100 rounded-lg' : ''}
                      ${dim && !showBlocked ? 'text-gray-300' : selStart || selEnd ? '' : 'text-gray-800'}`}
                  >
                    <span className={
                      (selStart || selEnd)
                        ? ''
                        : showBlocked
                          ? `w-7 h-7 rounded-full flex items-center justify-center ${blocked!.portion === 'full' ? 'bg-amber-200 text-amber-900 font-semibold' : 'ring-1 ring-amber-400 text-amber-700 font-medium'}`
                          : today
                            ? 'w-7 h-7 rounded-full border border-teal-500 flex items-center justify-center'
                            : ''
                    }>
                      {format(day, 'd')}
                    </span>
                    {/* Custom themed tooltip — instant on hover (no native delay). */}
                    {showBlocked && hover === ds && tip && (
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] font-medium px-2 py-1 shadow-lg">
                        {tip}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected range */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5">
            <span className="text-sm text-gray-700">{rangeLabel()}</span>
            {(rangeStart || rangeEnd) && (
              <button onClick={() => { setRangeStart(null); setRangeEnd(null); setHover(null) }} className="text-xs text-gray-400 hover:text-gray-700">
                {fr ? 'Effacer' : 'Clear'}
              </button>
            )}
          </div>

          {/* Portion */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{fr ? 'Durée' : 'Duration'}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'morning', 'afternoon'] as Portion[]).map((p) => {
                const M = portionMeta[p]
                const active = portion === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPortion(p)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-colors ${active ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <M.icon className="w-4 h-4" /> {M.label}
                  </button>
                )
              })}
            </div>
            {rangeStart && rangeEnd && rangeEnd !== rangeStart && portion !== 'full' && (
              <p className="text-xs text-gray-500 mt-1.5">
                {fr ? `${portionMeta[portion].label} bloquée pour chaque jour de la période.` : `${portionMeta[portion].label} is blocked on every day in the range.`}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Motif (optionnel)' : 'Reason (optional)'}</label>
            <input
              type="text" value={reason} maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              placeholder={fr ? 'Ex. Vacances, formation…' : 'E.g. Vacation, training…'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={save} disabled={saving || !rangeStart}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBlock ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingBlock ? (fr ? 'Enregistrer les modifications' : 'Save changes') : (fr ? 'Ajouter un congé' : 'Add time off')}
            </button>
            {editingBlock && (
              <button
                onClick={resetForm} disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                {fr ? 'Annuler' : 'Cancel'}
              </button>
            )}
          </div>

          {/* Upcoming list */}
          <div className="pt-1">
            <p className="text-sm font-medium text-gray-700 mb-2">{fr ? 'À venir' : 'Upcoming'}</p>
            {loading ? (
              <div className="py-5 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
            ) : blocks.length === 0 ? (
              <p className="text-sm text-gray-400">{fr ? 'Aucun congé planifié.' : 'No time off scheduled.'}</p>
            ) : (
              <div className="space-y-2">
                {blocks.map((b) => {
                  const M = portionMeta[b.portion]
                  const key = b.ids.join(',')
                  const busy = removingKey === key
                  const isEditing = editingBlock?.ids.join(',') === key
                  return (
                    <div key={key} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isEditing ? 'border-teal-300 ring-1 ring-teal-100 bg-teal-50/40' : 'border-gray-100'}`}>
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                        <M.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{rangeLabelText(b)}</p>
                        <p className="text-xs text-gray-500 truncate">{M.label}{b.reason ? ` · ${b.reason}` : ''}</p>
                      </div>
                      <button
                        onClick={() => startEdit(b)} disabled={busy || saving}
                        className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
                        aria-label={fr ? 'Modifier' : 'Edit'}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(b)} disabled={busy}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        aria-label={fr ? 'Supprimer' : 'Remove'}
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
