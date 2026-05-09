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

import { CheckSquare, Circle as RadioOff, CheckCircle2, Lightbulb, Quote as QuoteIcon, ExternalLink, Star } from 'lucide-react'

/** Block types that lead into a question (no response expected). */
export const CONTENT_TYPES = new Set([
  'heading', 'paragraph', 'quote', 'tip', 'divider', 'key_points',
  'callout', 'image', 'video', 'audio', 'link', 'pdf_document',
  'affirmation',
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
    case 'heading':
      return <h2 className="text-lg font-bold text-white">{c}</h2>
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

    case 'table_exercise': {
      const cols = block.columns || []
      return (
        <div className="space-y-2">
          {block.content && (
            <label className="block text-[14px] font-semibold text-gray-900">{block.content}</label>
          )}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-[11px]">
            <div className="bg-gray-100 grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, cols.length)}, 1fr)` }}>
              {cols.map((col: any, i: number) => (
                <div key={i} className="p-2 font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">{col.header}</div>
              ))}
            </div>
            <div className="grid bg-white" style={{ gridTemplateColumns: `repeat(${Math.max(1, cols.length)}, 1fr)` }}>
              {cols.map((col: any, i: number) => (
                <input
                  key={i}
                  type="text"
                  value={(value?.[0]?.[col.id]) || ''}
                  onChange={(e) => {
                    const row0 = { ...(value?.[0] || {}), [col.id]: e.target.value }
                    onChange?.([row0])
                  }}
                  placeholder="…"
                  className="p-2 outline-none border-r border-gray-200 last:border-r-0 text-[11px]"
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    default:
      return (
        <div className="p-3 rounded-xl bg-gray-100 text-[11px] text-gray-500 text-center">
          {block.type} preview
        </div>
      )
  }
}
