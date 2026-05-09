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

import { useEffect, useMemo, useState } from 'react'
import { Smartphone, Monitor, Eye } from 'lucide-react'
import { DeviceFrame } from './DeviceFrame'
import { MobileMock } from './MobileMock'
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
])

interface ResourcePreviewProps {
  blocks: any[]
  title: string
}

export function ResourcePreview({ blocks, title }: ResourcePreviewProps) {
  const { locale } = useLanguage()
  const copy = PREVIEW_COPY[locale as keyof typeof PREVIEW_COPY] ?? PREVIEW_COPY.en
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')

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

      {/* Frame */}
      <DeviceFrame device={device}>
        <MobileMock blocks={debouncedBlocks} title={debouncedTitle} mode={mode} />
      </DeviceFrame>

      <p className="text-[10px] text-gray-400 text-center px-4">
        {mode === 'interactive' ? copy.captionInteractive : copy.captionReading}
      </p>
    </div>
  )
}
