/**
 * Single source of truth for rendering a patient's response to a
 * worksheet/resource block.
 *
 * Before this lived in /app/resources/[id]/page.tsx and 3+ other places
 * had their own minimal `String(value)` renderers — same 1-10 scale
 * answer would show as stars on one screen, "6" on another, and 5
 * Likert badges on the PDF. Everything that displays a saved response
 * to the practitioner should funnel through this component so the same
 * data renders the same way everywhere.
 *
 * PDF generation can't use JSX — it has its own renderer in
 * /lib/pdf/resource-submission-pdf.ts that mirrors the branching logic
 * here. Keep them in sync when adding new block types.
 */

import { BlockRenderer } from '@/components/resources/BlockRenderer'
import type { ResourceBlock } from '@/types/resource'

interface Props {
  block: ResourceBlock
  value: unknown
  locale: string
}

export function ResponseValueDisplay({ block, value, locale }: Props) {
  if (value === undefined || value === null) {
    return <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
  }

  switch (block.type) {
    case 'prompt':
      return <p className="text-gray-800 whitespace-pre-wrap">{String(value)}</p>

    case 'multiple_choice': {
      const options: (string | { label?: string })[] =
        ('options' in block && Array.isArray(block.options)) ? block.options :
        ('choices' in block && Array.isArray(block.choices)) ? block.choices : []
      const index = Number(value)
      const label = typeof options[index] === 'string'
        ? options[index]
        : (options[index] as any)?.label || `Option ${index + 1}`
      return <span className="inline-flex px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">{label}</span>
    }

    case 'yes_no': {
      const isYes = value === 'yes'
      return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${isYes ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {isYes ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No')}
        </span>
      )
    }

    case 'checklist': {
      const items: (string | { text: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
      const indices = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {indices.map((i: number) => {
            const item = items[i]
            const text = typeof item === 'string' ? item : item?.text || String(i)
            return <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs">✓ {text}</span>
          })}
        </div>
      )
    }

    case 'numeric': {
      // Numeric input is freeform — just show the value clearly.
      return <span className="text-lg font-bold text-gray-900">{String(value)}</span>
    }

    case 'scale':
    case 'slider': {
      // Mirror the patient/editor rendering: numbered pills with the
      // chosen value highlighted. Large ranges (sliders) fall back to a
      // bar to avoid 100 pills on screen.
      const num = Number(value)
      const max = (block as any).scaleMax ?? (block as any).sliderMax ?? 10
      const min = (block as any).scaleMin ?? (block as any).sliderMin ?? 0
      const range = max - min + 1
      const minLabel = (block as any).scaleMinLabel ?? (block as any).sliderMinLabel
      const maxLabel = (block as any).scaleMaxLabel ?? (block as any).sliderMaxLabel
      if (range > 12 || block.type === 'slider') {
        const pct = Math.round(((num - min) / Math.max(max - min, 1)) * 100)
        return (
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">{num}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[200px]">
              <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400">{minLabel ?? min} — {maxLabel ?? max}</span>
          </div>
        )
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: range }).map((_, i) => {
            const pillValue = min + i
            const selected = pillValue === num
            return (
              <span
                key={i}
                className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold border ${
                  selected
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {pillValue}
              </span>
            )
          })}
        </div>
      )
    }

    case 'likert': {
      // Mirror the patient/editor rendering — numbered (or labelled)
      // pills with the chosen step highlighted. Stars are out; the
      // editor never shows stars, so the response shouldn't either.
      // Mood blocks keep their dedicated label rendering.
      const scaleType = (block as any).scaleType
      const num = Number(value)
      if (scaleType === 'mood') {
        const moods = ['Thriving', 'Good', 'Okay', 'Low', 'Struggling']
        const moodsFr = ['Épanoui', 'Bien', 'Neutre', 'Fragile', 'Difficile']
        const colors = ['text-emerald-500', 'text-teal-500', 'text-amber-500', 'text-orange-500', 'text-red-500']
        return <span className={`text-sm font-medium ${colors[num] || 'text-gray-600'}`}>{locale === 'fr' ? moodsFr[num] : moods[num]} ({num + 1}/5)</span>
      }
      const scaleRange = (block as any).scaleRange || (block as any).likertScale || 5
      const rawLabels = (block as any).scaleLabels || (block as any).likertLabels || []
      const labels: string[] = Array.isArray(rawLabels) ? rawLabels : []
      const useLabels = labels.length === scaleRange
      // The patient-facing UI is 1-indexed (numbers run 1..scaleRange,
      // selected when num === pillValue). Match that here.
      // Patient values are 1-indexed (BlockRenderer fires onChange(i+1)).
      // Match that exactly — don't also highlight `num === i`, that's
      // what produced the "two pills lit" bug.
      return (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: scaleRange }).map((_, i) => {
            const pillValue = i + 1
            const selected = num === pillValue
            return (
              <span
                key={i}
                className={`inline-flex items-center justify-center ${useLabels ? 'px-3' : 'min-w-[28px] px-2'} h-7 rounded-md text-xs font-semibold border ${
                  selected
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {useLabels ? labels[i] : pillValue}
              </span>
            )
          })}
        </div>
      )
    }

    case 'mood':
      return <span className="text-lg font-bold text-gray-900">{String(value)}</span>

    case 'matrix_rating': {
      const matrixItems = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
      const ratings = value as Record<string, number>
      const max = (block as any).matrixScaleMax || 5
      return (
        <div className="space-y-1.5">
          {Object.entries(ratings).map(([idx, rating]) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 min-w-[120px]">{matrixItems[Number(idx)] || idx}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: max }).map((_, i) => (
                  <div key={i} className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${i < rating ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-300'}`}>{i + 1}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'date_picker':
      return <span className="text-sm text-gray-800">{value ? new Date(String(value)).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>

    case 'time_input':
      return <span className="text-sm font-medium text-gray-800">{String(value)}</span>

    case 'list_input':
      return Array.isArray(value) ? (
        <ul className="space-y-1">
          {value.filter(Boolean).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      ) : <span>-</span>

    case 'file_response':
      return typeof value === 'string' && value.startsWith('http') ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 underline">
          {value.split('/').pop()?.split('?')[0] || 'File'}
        </a>
      ) : <span className="text-sm text-gray-500">{locale === 'fr' ? 'Fichier envoyé' : 'File uploaded'}</span>

    case 'zoned_canvas':
      // Visual layout (SVG + zone list) rather than a bullet dump.
      return (
        <BlockRenderer
          block={block as any}
          value={(value && typeof value === 'object' ? value : {}) as any}
          onChange={() => {}}
          disabled
          locale={locale as 'en' | 'fr' | 'es'}
        />
      )

    default:
      return <span className="text-sm text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
  }
}
