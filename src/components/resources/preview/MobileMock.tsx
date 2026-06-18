'use client'

/**
 * Mobile preview mock — reproduces the patient-facing WorksheetStepView
 * (interactive resources: one block per screen with Next/Back nav) and
 * the BlockRenderer feed (reading-only resources: continuous scroll).
 *
 * The visual chrome — coloured step backgrounds, white question card,
 * teal pull-to-refresh feel — mirrors what's in
 * bloomsline_mobile/components/practitioner/WorksheetStepView.tsx so
 * the practitioner sees a faithful approximation of what their patient
 * will experience.
 */

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { CONTENT_TYPES, RenderContextBlock, RenderQuestionBlock } from './blocks'
import { STEP_COLORS, screenForeground } from './palette'

interface Step {
  contextBlocks: any[]
  questionBlock: any | null
  color: string
  /** Block whose `color` field drives this screen — the one we write a
   *  practitioner's colour override onto. The question block when present,
   *  otherwise the last context block of a context-only screen. */
  anchorId: string | null
}

/**
 * Group a flat block list into screens. Each screen's colour is the override
 * stored on its anchor block (`block.color`), falling back to the auto
 * rotation by position. Exported so the preview pane can map a screen index
 * to the anchor block it should colour.
 */
export function groupBlocksIntoSteps(blocks: any[]): Step[] {
  const steps: Step[] = []
  let pendingContext: any[] = []
  const colorFor = (anchor: any | null, idx: number) =>
    (anchor?.color as string | undefined) || STEP_COLORS[idx % STEP_COLORS.length]
  for (const block of blocks) {
    if (CONTENT_TYPES.has(block.type)) {
      pendingContext.push(block)
    } else {
      steps.push({
        contextBlocks: pendingContext,
        questionBlock: block,
        anchorId: block.id ?? null,
        color: colorFor(block, steps.length),
      })
      pendingContext = []
    }
  }
  if (pendingContext.length > 0) {
    const anchor = pendingContext[pendingContext.length - 1]
    steps.push({
      contextBlocks: pendingContext,
      questionBlock: null,
      anchorId: anchor?.id ?? null,
      color: colorFor(anchor, steps.length),
    })
  }
  return steps
}

interface MobileMockProps {
  blocks: any[]
  title: string
  /** "interactive" → step-by-step nav. "reading" → continuous scroll. */
  mode: 'interactive' | 'reading'
  /** Controlled current step (so the preview's colour picker knows which
   *  screen is showing). Falls back to internal state when omitted. */
  stepIdx?: number
  onStepChange?: (idx: number) => void
}

export function MobileMock({ blocks, title, mode, stepIdx, onStepChange }: MobileMockProps) {
  if (mode === 'reading') return <MobileReadingMock blocks={blocks} title={title} />
  return <MobileInteractiveMock blocks={blocks} title={title} stepIdx={stepIdx} onStepChange={onStepChange} />
}

/** ─── Interactive mode ─────────────────────────────────────────── */

function MobileInteractiveMock({ blocks, title, stepIdx: controlledStepIdx, onStepChange }: { blocks: any[]; title: string; stepIdx?: number; onStepChange?: (idx: number) => void }) {
  const steps = useMemo(() => groupBlocksIntoSteps(blocks), [blocks])
  const [internalStepIdx, setInternalStepIdx] = useState(0)
  const stepIdx = controlledStepIdx ?? internalStepIdx
  const setStepIdx = (idx: number) => { if (onStepChange) onStepChange(idx); else setInternalStepIdx(idx) }
  // Local responses so the practitioner can click through their own
  // worksheet as if they were the patient.
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)

  // Clamp step index when blocks change underfoot (e.g., practitioner
  // deletes the step that was currently shown in the preview).
  const safeStepIdx = Math.min(stepIdx, Math.max(0, steps.length - 1))
  const step = steps[safeStepIdx]
  const isLast = safeStepIdx === steps.length - 1
  const isFirst = safeStepIdx === 0

  if (steps.length === 0) {
    return <EmptyState />
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-emerald-50">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
          <Check className="w-6 h-6 text-white" />
        </div>
        <p className="text-[14px] font-semibold text-emerald-900">All done!</p>
        <p className="text-[11px] text-emerald-700 mt-1">Preview submitted</p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setStepIdx(0); setResponses({}) }}
          className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-medium"
        >
          Start over
        </button>
      </div>
    )
  }

  const setBlockValue = (id: string, v: any) =>
    setResponses(prev => ({ ...prev, [id]: v }))

  // Adapt text / chrome so light screen colours stay readable.
  const fg = screenForeground(step.color)

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: step.color }}>
      {/* Top progress bar */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        <button type="button" className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: fg.chipBg }}>
          <X className="w-3.5 h-3.5" style={{ color: fg.text }} />
        </button>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: fg.track }}>
          <div
            className="h-full transition-all"
            style={{ width: `${((safeStepIdx + 1) / steps.length) * 100}%`, backgroundColor: fg.fill }}
          />
        </div>
        <span className="text-[10px] font-medium tabular-nums" style={{ color: fg.textSoft }}>
          {safeStepIdx + 1}/{steps.length}
        </span>
      </div>

      {/* Step body — scrollable but with the platform scrollbar hidden,
          matching how a real iOS/Android app feels inside the frame. */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2.5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Context blocks (lead-in) */}
        {step.contextBlocks.map((b, i) => (
          <RenderContextBlock key={b.id || i} block={b} foreground={fg.text} onLight={fg.light} />
        ))}

        {/* Question card */}
        {step.questionBlock && (
          <div className="mt-2 p-3 rounded-2xl bg-white shadow-md">
            <RenderQuestionBlock
              block={step.questionBlock}
              value={responses[step.questionBlock.id]}
              onChange={(v) => setBlockValue(step.questionBlock.id, v)}
              color={step.color}
            />
          </div>
        )}

        {/* Worksheet title shown only on the first step, like a hero */}
        {safeStepIdx === 0 && title && (
          <div className="absolute bottom-14 left-3 right-3 pointer-events-none truncate text-[10px]" style={{ color: fg.textSoft, opacity: 0.5 }}>
            {title}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-3 py-2 flex gap-2 bg-transparent">
        <button
          type="button"
          onClick={() => setStepIdx(Math.max(0, safeStepIdx - 1))}
          disabled={isFirst}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-[11px] font-medium disabled:opacity-40"
          style={{ backgroundColor: fg.backBg, color: fg.text }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {isFirst ? 'Close' : 'Back'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isLast) setSubmitted(true)
            else setStepIdx(safeStepIdx + 1)
          }}
          className="flex-[1.5] flex items-center justify-center gap-1 py-2 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: fg.primaryBg, color: fg.primaryText }}
        >
          {isLast ? 'Submit' : 'Next'}
          {isLast ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

/** ─── Reading mode ─────────────────────────────────────────────── */

function MobileReadingMock({ blocks, title }: { blocks: any[]; title: string }) {
  if (blocks.length === 0) return <EmptyState />
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[15px] font-bold text-gray-900 truncate">{title || 'Untitled'}</p>
      </div>
      {/* Continuous scroll body. Blocks rendered with brand-coloured
          context-block component, but on a white background — the
          mobile reading view doesn't have step backgrounds. */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {blocks.map((b, i) => (
          <ReadingBlock key={b.id || i} block={b} />
        ))}
      </div>
    </div>
  )
}

function ReadingBlock({ block }: { block: any }) {
  const c = block.content || ''
  switch (block.type) {
    case 'heading': {
      const lvl = block.headingLevel === 'h1' ? 'h1' : block.headingLevel === 'h3' ? 'h3' : 'h2'
      const cls = lvl === 'h1'
        ? 'text-[17px] font-bold text-gray-900'
        : lvl === 'h3' ? 'text-[13px] font-semibold text-gray-900'
        : 'text-[15px] font-bold text-gray-900'
      if (lvl === 'h1') return <h1 className={cls}>{c}</h1>
      if (lvl === 'h3') return <h3 className={cls}>{c}</h3>
      return <h2 className={cls}>{c}</h2>
    }
    case 'spacer': {
      const h = block.spacerSize === 'sm' ? 8 : block.spacerSize === 'lg' ? 28 : 16
      return <div style={{ height: h }} aria-hidden />
    }
    case 'paragraph':
      return <p className="text-[12px] text-gray-700 leading-relaxed">{c}</p>
    case 'tip':
      return (
        <div className="flex gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-amber-500">💡</span>
          <p className="text-[12px] text-amber-900">{c}</p>
        </div>
      )
    case 'quote':
      return (
        <blockquote className="border-l-2 border-purple-300 pl-3 italic text-[12px] text-gray-700">
          {c}
          {block.quoteAuthor && <footer className="text-[10px] text-gray-500 not-italic mt-1">— {block.quoteAuthor}</footer>}
        </blockquote>
      )
    case 'callout':
    case 'affirmation':
      return (
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 text-center">
          <p className="text-[13px] font-medium text-violet-900">{c}</p>
        </div>
      )
    case 'key_points':
      return (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
          {(block.points || []).map((p: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      )
    case 'image':
      return (block as any).mediaFile?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={(block as any).mediaFile.url} alt="" className="w-full rounded-xl" />
      ) : null
    case 'divider':
      return <hr className="border-gray-100" />
    case 'link':
      return block.linkUrl ? (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50 border border-teal-100">
          <span className="text-teal-600 text-[14px]">🔗</span>
          <span className="text-[12px] text-teal-900 truncate">{c || block.linkUrl}</span>
        </div>
      ) : null
    default:
      return null
  }
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <span className="text-gray-400 text-lg">+</span>
      </div>
      <p className="text-[12px] text-gray-500">Add a block to see how patients will experience this.</p>
    </div>
  )
}
