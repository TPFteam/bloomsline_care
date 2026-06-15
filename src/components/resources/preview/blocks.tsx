'use client'

/**
 * HTML/Tailwind reproductions of the mobile app's block renderers.
 * Pixel-near to what the patient sees on their phone, but rendered in
 * the practitioner's browser. Two render contexts:
 *
 *   - "context" → heading, paragraph, tip, quote, key_points etc.
 *     Used as the lead-in above each question step.
 *   - "question" → prompts, scales, choices, etc. The interactive
 *     widgets the patient actually fills.
 *
 * For Round 1 we cover the most common block types. Less-used blocks
 * (matrix_rating, fill_blank, ordering, immersive timed exercises)
 * fall back to a generic placeholder. Easy to extend later.
 */

import { useEffect, useRef, useState } from 'react'
import { CheckSquare, Circle as RadioOff, CheckCircle2, Lightbulb, Quote as QuoteIcon, ExternalLink, Star } from 'lucide-react'

/** Block types that lead into a question (no response expected). */
export const CONTENT_TYPES = new Set([
  'heading', 'paragraph', 'quote', 'tip', 'divider', 'key_points',
  'callout', 'image', 'video', 'audio', 'link', 'pdf_document',
  'affirmation', 'spacer',
])

interface RenderBlockProps {
  block: any
  /** Member's response value for this block (read from a local responses
   *  map kept inside the preview). */
  value?: any
  /** Setter for the response. Lets the practitioner click through their
   *  own preview as if they were the patient. */
  onChange?: (value: any) => void
  /** Brand colour for the current step — used by question backgrounds /
   *  selected indicators. */
  color: string
}

/** ─── Context blocks (lead-in content) ─────────────────────────── */

export function RenderContextBlock({ block }: { block: any }) {
  const c = block.content || ''

  switch (block.type) {
    case 'heading': {
      const lvl = block.headingLevel === 'h1' ? 'h1' : block.headingLevel === 'h3' ? 'h3' : 'h2'
      const cls = lvl === 'h1'
        ? 'text-xl font-bold text-white'
        : lvl === 'h3' ? 'text-sm font-semibold text-white'
        : 'text-lg font-bold text-white'
      if (lvl === 'h1') return <h1 className={cls}>{c}</h1>
      if (lvl === 'h3') return <h3 className={cls}>{c}</h3>
      return <h2 className={cls}>{c}</h2>
    }
    case 'spacer': {
      const h = block.spacerSize === 'sm' ? 8 : block.spacerSize === 'lg' ? 28 : 16
      return <div style={{ height: h }} aria-hidden />
    }
    case 'paragraph':
      return <p className="text-[13px] text-white/90 leading-relaxed">{c}</p>
    case 'tip':
      return (
        <div className="flex gap-2 p-3 rounded-xl bg-white/15 border border-white/20">
          <Lightbulb className="w-4 h-4 text-white/90 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/95 leading-relaxed">{c}</p>
        </div>
      )
    case 'quote':
      return (
        <div className="border-l-2 border-white/40 pl-3">
          <QuoteIcon className="w-3 h-3 text-white/70 mb-1" />
          <p className="text-[13px] italic text-white/90">{c}</p>
          {block.quoteAuthor && (
            <p className="text-[11px] text-white/70 mt-1">— {block.quoteAuthor}</p>
          )}
        </div>
      )
    case 'callout':
    case 'affirmation':
      return (
        <div className="p-3 rounded-xl bg-white/15 border border-white/20">
          <p className="text-[13px] text-white text-center font-medium">{c}</p>
        </div>
      )
    case 'key_points':
      return (
        <ul className="space-y-1.5">
          {(block.points || []).map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-white/90">
              <span className="w-1 h-1 rounded-full bg-white/60 mt-1.5 flex-shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )
    case 'divider':
      return <div className="h-px bg-white/20 my-1" />
    case 'image':
      return (block as any).mediaFile?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={(block as any).mediaFile.url} alt="" className="w-full rounded-xl" />
      ) : null
    case 'link':
      return block.linkUrl ? (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/15 border border-white/20">
          <ExternalLink className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
          <span className="text-[12px] text-white/95 truncate">{c || block.linkUrl}</span>
        </div>
      ) : null
    default:
      return null
  }
}

/** ─── Question blocks (interactive) ───────────────────────────── */

export function RenderQuestionBlock({ block, value, onChange, color }: RenderBlockProps) {
  switch (block.type) {
    case 'prompt':
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">
            {block.content}{block.required ? <span className="text-rose-500"> *</span> : null}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={block.placeholder || 'Type your answer…'}
            rows={Math.max(3, block.lines || 3)}
            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none text-[12px] resize-none"
          />
        </div>
      )

    case 'multiple_choice': {
      const choices: string[] = block.choices || block.options || []
      const allowMultiple = !!block.allowMultiple
      const isSel = (i: number) =>
        allowMultiple
          ? Array.isArray(value) && value.includes(i)
          : value === i
      const onPick = (i: number) => {
        if (allowMultiple) {
          const cur: number[] = Array.isArray(value) ? value : []
          onChange?.(cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i])
        } else onChange?.(i)
      }
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <div className="space-y-1.5">
            {choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(i)}
                className={`w-full text-left p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all ${
                  isSel(i) ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 ${allowMultiple ? 'rounded' : 'rounded-full'} border-2 flex items-center justify-center flex-shrink-0`}
                  style={isSel(i) ? { borderColor: color, backgroundColor: color } : { borderColor: '#D4D4D4' }}
                >
                  {isSel(i) && (
                    allowMultiple
                      ? <span className="text-white text-[8px] leading-none">✓</span>
                      : <span className="w-1 h-1 rounded-full bg-white" />
                  )}
                </span>
                <span className="text-[12px] text-gray-700">{c}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    case 'yes_no':
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <div className="flex gap-2">
            {(['yes', 'no'] as const).map(v => {
              const sel = value === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange?.(v)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-[12px] font-medium transition-all ${
                    sel
                      ? v === 'yes'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {v === 'yes' ? 'Yes' : 'No'}
                </button>
              )
            })}
          </div>
        </div>
      )

    case 'checklist': {
      const items: string[] = block.items || []
      const checked: number[] = Array.isArray(value) ? value : []
      return (
        <div className="space-y-2">
          {block.content && (
            <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          )}
          <div className="space-y-1.5">
            {items.map((item, i) => {
              const isChecked = checked.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange?.(isChecked ? checked.filter(x => x !== i) : [...checked, i])}
                  className={`w-full text-left p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all ${
                    isChecked ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={isChecked ? { borderColor: color, backgroundColor: color } : { borderColor: '#D4D4D4' }}
                  >
                    {isChecked && <span className="text-white text-[8px] leading-none">✓</span>}
                  </span>
                  <span className="text-[12px] text-gray-700">{item}</span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    case 'scale': {
      const min = block.scaleMin ?? 1
      const max = block.scaleMax ?? 10
      const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <div className="flex justify-center gap-1 flex-wrap">
            {range.map(v => {
              const sel = value === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange?.(v)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-medium transition-all ${
                    sel ? 'text-white shadow' : 'bg-gray-100 text-gray-600'
                  }`}
                  style={sel ? { backgroundColor: color } : undefined}
                >
                  {v}
                </button>
              )
            })}
          </div>
          {(block.scaleMinLabel || block.scaleMaxLabel) && (
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>{block.scaleMinLabel}</span>
              <span>{block.scaleMaxLabel}</span>
            </div>
          )}
        </div>
      )
    }

    case 'mood': {
      const moods = block.moodOptions || [
        { emoji: '🌧️', label: 'Struggling', value: 1 },
        { emoji: '🍂', label: 'Low', value: 2 },
        { emoji: '🌱', label: 'Okay', value: 3 },
        { emoji: '🌿', label: 'Good', value: 4 },
        { emoji: '🌸', label: 'Thriving', value: 5 },
      ]
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <div className="flex justify-center gap-2">
            {moods.map((m: any, i: number) => {
              const sel = value === (m.value ?? i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange?.(m.value ?? i)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
                    sel ? 'bg-gray-100 scale-110' : ''
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[9px] text-gray-500">{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    case 'list_input': {
      const list: string[] = Array.isArray(value) ? value : []
      const min = block.listMinItems || 1
      const items = list.length < min ? [...list, ...Array(min - list.length).fill('')] : list
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <div className="space-y-1.5">
            {items.map((it, i) => (
              <input
                key={i}
                type="text"
                value={it}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = e.target.value
                  onChange?.(next.filter(Boolean))
                }}
                placeholder={block.listItemPlaceholder || `Item ${i + 1}`}
                className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none text-[12px]"
              />
            ))}
          </div>
        </div>
      )
    }

    case 'date_picker':
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none text-[12px]"
          />
        </div>
      )

    case 'time_input':
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none text-[12px]"
          />
        </div>
      )

    case 'numeric':
      return (
        <div className="space-y-2">
          <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            min={block.minValue}
            max={block.maxValue}
            className="w-32 p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400 outline-none text-[12px]"
          />
        </div>
      )

    case 'table_exercise':
      return <TableExerciseRender block={block} value={value} onChange={onChange} />

    case 'zoned_canvas':
      return <ZonedCanvasRender block={block} />


    default:
      return (
        <div className="p-3 rounded-xl bg-gray-100 text-[11px] text-gray-500 text-center">
          {block.type} preview
        </div>
      )
  }
}

/** Tiny preview for zoned_canvas blocks in the practitioner's mobile
 *  mock. Renders the canvas + the per-zone list with no entries. The
 *  practitioner just wants to see the structure they'll be sharing. */
function ZonedCanvasRender({ block }: { block: any }) {
  const accentToHex: Record<string, { stroke: string; bg: string }> = {
    teal:    { stroke: '#0d9488', bg: 'rgba(20, 184, 166, 0.10)' },
    amber:   { stroke: '#d97706', bg: 'rgba(245, 158, 11, 0.10)' },
    rose:    { stroke: '#e11d48', bg: 'rgba(244, 63, 94, 0.10)' },
    violet:  { stroke: '#7c3aed', bg: 'rgba(139, 92, 246, 0.10)' },
    sky:     { stroke: '#0284c7', bg: 'rgba(14, 165, 233, 0.10)' },
    emerald: { stroke: '#059669', bg: 'rgba(16, 185, 129, 0.10)' },
    orange:  { stroke: '#ea580c', bg: 'rgba(249, 115, 22, 0.10)' },
    slate:   { stroke: '#475569', bg: 'rgba(100, 116, 139, 0.06)' },
  }
  const labelOf = (z: any): string => z?.label?.en || z?.label?.fr || ''
  const zones = Array.isArray(block.zones) ? block.zones : []
  // SVG <text> doesn't wrap — long custom labels spill outside the canvas.
  // Draw a small numbered badge on each zone; the full labels show in the
  // legend/list below (number → label), so nothing is cut or overflows.
  const zoneNumber: Record<string, number> = {}
  zones.forEach((z: any, i: number) => { zoneNumber[z.id] = i + 1 })
  const canvas = block.canvas || { width: 800, height: 600 }
  const ordered = [...zones].sort((a: any, b: any) => {
    const area = (z: any): number => {
      const s = z.shape || {}
      if (s.kind === 'rect') return (s.w ?? 0) * (s.h ?? 0)
      if (s.kind === 'circle') return Math.PI * (s.r ?? 0) ** 2
      if (s.kind === 'ellipse') return Math.PI * (s.rx ?? 0) * (s.ry ?? 0)
      return 1
    }
    return area(b) - area(a)
  })
  return (
    <div className="space-y-3">
      {block.content && (
        <p className="text-[13px] text-gray-800 leading-relaxed">{block.content}</p>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <svg viewBox={`0 0 ${canvas.width} ${canvas.height}`} className="w-full h-auto" style={{ maxHeight: 240 }}>
          {ordered.map((z: any) => {
            const a = accentToHex[z.accent ?? 'slate'] ?? accentToHex.slate
            const s = z.shape || {}
            let shapeEl: React.ReactNode = null
            let cx = 0, cy = 0
            if (s.kind === 'rect') {
              shapeEl = <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} fill={a.bg} stroke={a.stroke} strokeWidth={2} />
              cx = (s.x ?? 0) + (s.w ?? 0) / 2; cy = (s.y ?? 0) + 22
            } else if (s.kind === 'circle') {
              shapeEl = <circle cx={s.cx} cy={s.cy} r={s.r} fill={a.bg} stroke={a.stroke} strokeWidth={2} />
              cx = s.cx; cy = s.cy
            } else if (s.kind === 'ellipse') {
              shapeEl = <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={a.bg} stroke={a.stroke} strokeWidth={2} />
              cx = s.cx; cy = s.cy
            } else if (s.kind === 'polygon' && Array.isArray(s.points)) {
              shapeEl = <polygon points={s.points.map(([x, y]: [number, number]) => `${x},${y}`).join(' ')} fill={a.bg} stroke={a.stroke} strokeWidth={2} />
              cx = s.points.reduce((acc: number, [x]: [number, number]) => acc + x, 0) / s.points.length
              cy = s.points.reduce((acc: number, [, y]: [number, number]) => acc + y, 0) / s.points.length
            }
            return (
              <g key={z.id}>
                {shapeEl}
                <circle cx={cx} cy={cy} r={12} fill={a.stroke} pointerEvents="none" />
                <text x={cx} y={cy} fill="#ffffff" fontSize={13} fontWeight={700} textAnchor="middle" dominantBaseline="central" pointerEvents="none">
                  {zoneNumber[z.id]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      {/* Per-zone empty stubs so the practitioner sees the input UI */}
      <div className="space-y-2">
        {zones.map((z: any) => {
          const a = accentToHex[z.accent ?? 'slate'] ?? accentToHex.slate
          return (
            <div
              key={z.id}
              className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2"
              style={{ borderColor: a.stroke + '33', background: a.bg }}
            >
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className="shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                  style={{ background: a.stroke }}
                >
                  {zoneNumber[z.id]}
                </span>
                <p className="text-[12px] font-semibold" style={{ color: a.stroke }}>{labelOf(z)}</p>
              </div>
              <span className="text-[11px] text-gray-400">+ Add</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Table-exercise renderer with a custom always-visible scrollbar at
 * the bottom. The native scrollbar (especially on macOS / iOS) hides
 * itself at rest, hiding the swipe affordance the patient needs to
 * realize there are more columns. We hide the native bar entirely and
 * draw our own thin track + thumb whose width and offset are computed
 * from the live scroll state.
 */
function TableExerciseRender({ block, value, onChange }: { block: any; value?: any; onChange?: (v: any) => void }) {
  const cols = (block.columns || []) as Array<{ id: string; header: string }>
  const exampleRow = block.exampleRow as Record<string, string> | undefined
  const hasExample = !!exampleRow && cols.some(c => exampleRow[c.id])
  const gridTemplateColumns = `repeat(${Math.max(1, cols.length)}, minmax(96px, 1fr))`

  const scrollRef = useRef<HTMLDivElement>(null)
  // thumbPct: portion of the track the thumb fills (= clientWidth / scrollWidth)
  // leftPct:  thumb's offset from the left edge of the track (in %)
  // overflowing: whether the table is wide enough to scroll at all
  const [scrollState, setScrollState] = useState({ thumbPct: 100, leftPct: 0, overflowing: false })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const visible = el.clientWidth
      const total = el.scrollWidth
      const overflowing = total > visible + 1
      const thumbPct = overflowing ? Math.max(15, (visible / total) * 100) : 100
      const leftPct = overflowing
        ? (el.scrollLeft / Math.max(1, total - visible)) * (100 - thumbPct)
        : 0
      setScrollState({ thumbPct, leftPct, overflowing })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [cols.length])

  return (
    <div className="space-y-2">
      {block.content && (
        <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
      )}
      <div className="relative border border-gray-200 rounded-xl overflow-hidden text-[11px]">
        {/* Native scrollbar hidden — our custom one (below) replaces it
            so the affordance is visible at rest, not just during scroll. */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2.5"
        >
          <div style={{ minWidth: 'max-content' }}>
            <div className="bg-gray-100 grid" style={{ gridTemplateColumns }}>
              {cols.map((col, i) => (
                <div key={i} className="p-2 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">{col.header}</div>
              ))}
            </div>
            {hasExample && (
              <div className="grid bg-white border-t border-gray-100" style={{ gridTemplateColumns }}>
                {cols.map((col, i) => {
                  const ex = exampleRow?.[col.id]
                  return (
                    <div key={i} className="p-2 italic text-gray-400 leading-snug border-r border-gray-200 last:border-r-0">
                      {ex ? `Ex. : ${ex}` : ''}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="grid bg-white border-t border-gray-100" style={{ gridTemplateColumns }}>
              {cols.map((col, i) => (
                <div key={i} className="min-w-0 border-r border-gray-200 last:border-r-0">
                  <input
                    type="text"
                    value={value?.[0]?.[col.id] || ''}
                    onChange={(e) => {
                      const row0 = { ...(value?.[0] || {}), [col.id]: e.target.value }
                      onChange?.([row0])
                    }}
                    placeholder="…"
                    className="w-full min-w-0 p-2 outline-none text-[11px] bg-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Custom always-visible scrollbar. Track shows even when the
            table fits (as a subtle hint), thumb only when overflowing. */}
        <div className="absolute left-2 right-2 bottom-1 h-1 bg-gray-100 rounded-full pointer-events-none">
          {scrollState.overflowing && (
            <div
              className="absolute top-0 h-1 bg-gray-400 rounded-full transition-[left] duration-75"
              style={{ left: `${scrollState.leftPct}%`, width: `${scrollState.thumbPct}%` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
