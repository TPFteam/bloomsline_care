'use client'

/**
 * Right-side preview pane in the resource creator. Replaces the old
 * tips + step-count sidebar.
 *
 * - Toggle between Mobile and Desktop.
 * - Auto-detects whether the current set of blocks is interactive or
 *   reading-only by inspecting block types (anything in the question-
 *   types set means interactive).
 * - Mobile preview is a working step-through: practitioner can click
 *   Next/Back/Submit just like their patient.
 * - 200ms debounce so the preview doesn't flicker on every keystroke
 *   while the practitioner edits.
 *
 * Round 1 scope: worksheet creator only. Component is generic enough
 * to drop into psychoeducation/table/exercise creators in Round 2.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Smartphone, Monitor, Eye, Check } from 'lucide-react'
import { DeviceFrame } from './DeviceFrame'
import { MobileMock, groupBlocksIntoSteps } from './MobileMock'
import { RESOURCE_PALETTE } from './palette'
import { useLanguage } from '@/lib/i18n/context'

const PREVIEW_COPY = {
  en: {
    preview: 'Preview',
    interactive: 'INTERACTIVE',
    reading: 'READING',
    mobileAria: 'Mobile preview',
    desktopAria: 'Desktop preview',
    captionInteractive: 'Approximate preview. Click Next / Back to walk through the steps.',
    captionReading: 'Approximate preview.',
  },
  fr: {
    preview: 'Aperçu',
    interactive: 'INTERACTIF',
    reading: 'LECTURE',
    mobileAria: 'Aperçu mobile',
    desktopAria: 'Aperçu ordinateur',
    captionInteractive: 'Aperçu approximatif. Cliquez sur Suivant / Retour pour parcourir les étapes.',
    captionReading: 'Aperçu approximatif.',
  },
  es: {
    preview: 'Vista previa',
    interactive: 'INTERACTIVO',
    reading: 'LECTURA',
    mobileAria: 'Vista previa móvil',
    desktopAria: 'Vista previa de escritorio',
    captionInteractive: 'Vista previa aproximada. Haz clic en Siguiente / Atrás para recorrer los pasos.',
    captionReading: 'Vista previa aproximada.',
  },
} as const

const INTERACTIVE_TYPES = new Set([
  'prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
  'mood', 'matching_pairs', 'flashcard', 'fill_blank', 'ordering',
  'list_input', 'numeric', 'slider', 'matrix_rating', 'date_picker',
  'time_input', 'file_response', 'audio_response', 'video_response',
  'table_exercise',
  // Spatial-zone exercise (Circle of Control, Eisenhower, …)
  'zoned_canvas',
])

interface ResourcePreviewProps {
  blocks: any[]
  title: string
  /** When provided, enables the per-screen colour picker — picking a colour
   *  writes `color` onto the screen's anchor block and calls this with the
   *  updated block list. Omit to keep the preview read-only. */
  onBlocksChange?: (next: any[]) => void
  /** Block the practitioner is currently editing in the builder. When it
   *  changes, the interactive preview jumps to the screen that contains it. */
  activeBlockId?: string | null
}

export function ResourcePreview({ blocks, title, onBlocksChange, activeBlockId }: ResourcePreviewProps) {
  const { locale } = useLanguage()
  const copy = PREVIEW_COPY[locale as keyof typeof PREVIEW_COPY] ?? PREVIEW_COPY.en
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  // Current preview screen (controlled so the colour picker targets it) +
  // colour-dropdown open state and the "apply to all screens" toggle.
  const [stepIdx, setStepIdx] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [applyAll, setApplyAll] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!paletteOpen) return
    const onDown = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) setPaletteOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [paletteOpen])

  // Persist the device choice across sessions so the practitioner
  // doesn't have to re-pick mobile every time they open a worksheet.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('bl_preview_device')
    if (saved === 'mobile' || saved === 'desktop') setDevice(saved)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bl_preview_device', device)
    }
  }, [device])

  // Debounce the input blocks so the preview doesn't re-render on
  // every keystroke. 200ms keeps the preview feeling live without
  // flickering.
  const [debouncedBlocks, setDebouncedBlocks] = useState(blocks)
  const [debouncedTitle, setDebouncedTitle] = useState(title)
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedBlocks(blocks)
      setDebouncedTitle(title)
    }, 200)
    return () => clearTimeout(id)
  }, [blocks, title])

  // Auto-detect mode from block types.
  const mode: 'interactive' | 'reading' = useMemo(() => {
    const hasInteractive = debouncedBlocks.some(b => INTERACTIVE_TYPES.has(b.type))
    return hasInteractive ? 'interactive' : 'reading'
  }, [debouncedBlocks])

  // ── Per-screen colour picker ──────────────────────────────────────
  const steps = useMemo(() => groupBlocksIntoSteps(debouncedBlocks), [debouncedBlocks])
  const safeIdx = Math.min(stepIdx, Math.max(0, steps.length - 1))
  const currentStep = steps[safeIdx]
  const currentAnchorId = currentStep?.anchorId ?? null
  const currentColor = currentStep?.color
  // Whether the current screen carries a practitioner override (vs auto).
  const overrideColor: string | undefined = debouncedBlocks.find(b => b.id === currentAnchorId)?.color
  const showPalette = !!onBlocksChange && mode === 'interactive' && device === 'mobile' && steps.length > 0

  // Follow the block being edited: when the practitioner expands/selects a
  // block in the builder, jump the interactive preview to its screen.
  useEffect(() => {
    if (!activeBlockId) return
    const idx = steps.findIndex(
      s => s.questionBlock?.id === activeBlockId || s.contextBlocks.some((b: any) => b.id === activeBlockId),
    )
    if (idx >= 0) setStepIdx(idx)
  }, [activeBlockId, steps])

  const applyColor = (color: string | null) => {
    if (!onBlocksChange) return
    const targetIds = applyAll
      ? new Set(steps.map(s => s.anchorId).filter(Boolean) as string[])
      : new Set(currentAnchorId ? [currentAnchorId] : [])
    if (targetIds.size === 0) return
    onBlocksChange(blocks.map(b => (targetIds.has(b.id) ? { ...b, color: color ?? undefined } : b)))
    setPaletteOpen(false)
  }

  const pl = {
    screenColor: locale === 'fr' ? 'Couleur de l’écran' : locale === 'es' ? 'Color de pantalla' : 'Screen colour',
    auto: locale === 'fr' ? 'Auto (varié)' : locale === 'es' ? 'Auto (variado)' : 'Auto (varied)',
    applyAll: locale === 'fr' ? 'Appliquer à tous les écrans' : locale === 'es' ? 'Aplicar a todas las pantallas' : 'Apply to all screens',
    dark: locale === 'fr' ? 'Foncé' : locale === 'es' ? 'Oscuro' : 'Dark',
    light: locale === 'fr' ? 'Clair' : locale === 'es' ? 'Claro' : 'Light',
    screenN: (n: number, total: number) => locale === 'fr' ? `Écran ${n}/${total}` : locale === 'es' ? `Pantalla ${n}/${total}` : `Screen ${n}/${total}`,
  }

  return (
    <div className="space-y-3 sticky top-4">
      {/* Header: label + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">{copy.preview}</h3>
          <span className="text-[10px] uppercase tracking-wide text-gray-400">
            {mode === 'interactive' ? copy.interactive : copy.reading}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Per-screen colour — a swatch of the current screen's colour;
              click to open the palette. */}
          {showPalette && (
            <div className="relative z-50" ref={paletteRef}>
              <button
                type="button"
                onClick={() => setPaletteOpen(o => !o)}
                className="w-7 h-7 rounded-full border-2 border-white shadow ring-1 ring-gray-200 transition-transform hover:scale-105"
                style={{ backgroundColor: currentColor }}
                aria-label={pl.screenColor}
                title={pl.screenColor}
              />
              {paletteOpen && (
                <div className="absolute right-0 top-9 z-30 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-900">{pl.screenColor}</p>
                    <span className="text-[10px] text-gray-400">{pl.screenN(safeIdx + 1, steps.length)}</span>
                  </div>

                  {/* Apply-to-all toggle */}
                  <label className="flex items-center justify-between gap-2 mb-2.5 cursor-pointer select-none">
                    <span className="text-[11px] text-gray-600">{pl.applyAll}</span>
                    <button
                      type="button"
                      onClick={() => setApplyAll(v => !v)}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${applyAll ? 'bg-teal-600' : 'bg-gray-200'}`}
                      aria-pressed={applyAll}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${applyAll ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </label>

                  {/* Auto (varied) */}
                  <button
                    type="button"
                    onClick={() => applyColor(null)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 transition-colors hover:bg-gray-50 ${!overrideColor ? 'bg-gray-50' : ''}`}
                  >
                    <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: 'conic-gradient(#4A9A86,#3B82F6,#8B5CF6,#F97316,#F43F5E,#10B981,#4A9A86)' }} />
                    <span className="flex-1 text-left text-[11px] font-medium text-gray-700">{pl.auto}</span>
                    {!overrideColor && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>

                  <div className="h-px bg-gray-100 my-1.5" />

                  {/* Hues */}
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                    {RESOURCE_PALETTE.map(hue => (
                      <div key={hue.key} className="flex items-center gap-2 px-2 py-0.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-gray-700 leading-tight">{locale === 'fr' ? hue.labelFr : hue.label}</p>
                          <p className="text-[9px] text-gray-400 leading-tight truncate">{locale === 'fr' ? hue.meaningFr : hue.meaning}</p>
                        </div>
                        {([['dark', hue.dark], ['light', hue.light]] as const).map(([variant, hex]) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => applyColor(hex)}
                            title={variant === 'dark' ? pl.dark : pl.light}
                            className="w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-inset ring-black/5 transition-transform hover:scale-110"
                            style={{ backgroundColor: hex }}
                          >
                            {overrideColor === hex && <Check className="w-3.5 h-3.5" style={{ color: variant === 'light' ? '#1F2937' : '#FFFFFF' }} />}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center bg-gray-100 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                device === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
              aria-label={copy.mobileAria}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                device === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
              aria-label={copy.desktopAria}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Frame */}
      <DeviceFrame device={device}>
        <MobileMock blocks={debouncedBlocks} title={debouncedTitle} mode={mode} stepIdx={safeIdx} onStepChange={setStepIdx} />
      </DeviceFrame>

      <p className="text-[10px] text-gray-400 text-center px-4">
        {mode === 'interactive' ? copy.captionInteractive : copy.captionReading}
      </p>
    </div>
  )
}
