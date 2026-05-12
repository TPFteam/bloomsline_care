'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Circle,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Mic,
  Upload,
  FileText,
  Play,
  Pause,
  File,
  Smile,
  Laugh,
  Meh,
  Frown,
  Angry,
} from 'lucide-react'

// Mood icon mapping
const moodIcons: Record<string, React.ElementType> = {
  'Angry': Angry,
  'Frown': Frown,
  'Meh': Meh,
  'Smile': Smile,
  'Laugh': Laugh,
}

// Mood icon colors
const moodColors: Record<string, string> = {
  'Angry': 'text-red-500',
  'Frown': 'text-orange-500',
  'Meh': 'text-amber-500',
  'Smile': 'text-teal-500',
  'Laugh': 'text-emerald-500',
}
import { AnimatePresence } from 'framer-motion'
import type { ResourceBlock } from '@/types/resource'
import { sanitizeUrl } from '@/lib/security/validation'

interface BlockRendererProps {
  block: ResourceBlock
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  locale?: 'en' | 'fr' | 'es'
  settings?: {
    rowMode?: 'unlimited' | 'limited'
    minRows?: number
    maxRows?: number
  }
}

export function BlockRenderer({
  block,
  value,
  onChange,
  disabled = false,
  locale = 'en',
  settings,
}: BlockRendererProps) {
  // Handle different block types
  switch (block.type) {
    // Display-only blocks
    case 'heading':
      return (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-semibold text-gray-800"
        >
          {typeof block.content === 'string' ? block.content : ''}
        </motion.h2>
      )

    case 'paragraph':
      return (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]"
        >
          {typeof block.content === 'string' ? block.content : ''}
        </motion.p>
      )

    case 'quote':
      return (
        <motion.blockquote
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-l-3 border-teal-400 pl-4 py-3 italic text-gray-600 bg-gradient-to-r from-teal-50/80 to-transparent rounded-r-xl"
        >
          {typeof block.content === 'string' ? block.content : ''}
        </motion.blockquote>
      )

    case 'tip':
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-100 rounded-2xl"
        >
          <p className="text-teal-700 text-[15px]">
            <span className="font-medium">{locale === 'fr' ? '💡 Conseil: ' : locale === 'es' ? '💡 Consejo: ' : '💡 Tip: '}</span>
            {typeof block.content === 'string' ? block.content : ''}
          </p>
        </motion.div>
      )

    case 'divider':
      return <hr className="border-gray-100 my-2" />

    case 'image':
      const imageUrl = ('mediaFile' in block && block.mediaFile?.url) || ('imageUrl' in block && (block as { imageUrl?: string }).imageUrl)
      if (imageUrl) {
        return (
          <div className="rounded-xl overflow-hidden">
            <img
              src={imageUrl}
              alt={typeof block.content === 'string' ? block.content : 'Image'}
              className="w-full h-auto"
            />
            {block.content && (
              <p className="text-sm text-gray-500 mt-2 text-center">{block.content}</p>
            )}
          </div>
        )
      }
      return null

    case 'audio':
      const audioUrl = ('mediaFile' in block && block.mediaFile?.url)
      const audioCaption = ('caption' in block && typeof block.caption === 'string') ? block.caption : ''
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {audioCaption && (
            <p className="text-gray-700 text-sm font-medium">{audioCaption}</p>
          )}
          {audioUrl ? (
            <audio controls className="w-full h-12">
              <source src={audioUrl} />
              {locale === 'fr' ? 'Votre navigateur ne supporte pas l\'audio.' : locale === 'es' ? 'Su navegador no soporta audio.' : 'Your browser does not support audio.'}
            </audio>
          ) : (
            <div className="p-3 bg-gray-100 rounded-xl text-gray-500 text-sm">
              {locale === 'fr' ? 'Aucun audio disponible' : locale === 'es' ? 'No hay audio disponible' : 'No audio available'}
            </div>
          )}
        </motion.div>
      )

    case 'video':
      const videoUrl = ('mediaFile' in block && block.mediaFile?.url)
      const videoCaption = ('caption' in block && typeof block.caption === 'string') ? block.caption : ''
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {videoUrl ? (
            <div className="rounded-xl overflow-hidden bg-black">
              <video controls className="w-full">
                <source src={videoUrl} />
                {locale === 'fr' ? 'Votre navigateur ne supporte pas la vidéo.' : locale === 'es' ? 'Su navegador no soporta video.' : 'Your browser does not support video.'}
              </video>
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded-xl text-gray-500 text-sm text-center">
              {locale === 'fr' ? 'Aucune vidéo disponible' : locale === 'es' ? 'No hay video disponible' : 'No video available'}
            </div>
          )}
          {videoCaption && (
            <p className="text-gray-500 text-sm text-center italic">{videoCaption}</p>
          )}
        </motion.div>
      )

    case 'link':
      const linkUrl = ('linkUrl' in block && typeof block.linkUrl === 'string') ? block.linkUrl : ''
      const linkTitle = ('linkTitle' in block && typeof block.linkTitle === 'string') ? block.linkTitle : ''
      const linkPlatform = ('linkPlatform' in block && typeof block.linkPlatform === 'string') ? block.linkPlatform : 'other'
      const platformIcons: Record<string, string> = {
        youtube: '📺',
        vimeo: '🎬',
        spotify: '🎧',
        soundcloud: '🔊',
        other: '🔗',
      }
      // Sanitize URL to prevent XSS via javascript: URLs
      const safeLinkUrl = sanitizeUrl(linkUrl)
      return (
        <motion.a
          href={safeLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:border-teal-300 hover:shadow-sm transition-all"
        >
          <span className="text-2xl">{platformIcons[linkPlatform] || '🔗'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-medium truncate">
              {linkTitle || (typeof block.content === 'string' ? block.content : (locale === 'fr' ? 'Lien externe' : locale === 'es' ? 'Enlace externo' : 'External link'))}
            </p>
            {linkUrl && (
              <p className="text-xs text-gray-400 truncate">{linkUrl}</p>
            )}
          </div>
          <span className="text-teal-500">→</span>
        </motion.a>
      )

    case 'key_points':
      const keyPoints = ('points' in block && Array.isArray(block.points)) ? block.points : []
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {typeof block.content === 'string' && block.content && (
            <p className="font-medium text-gray-900 mb-2">{block.content}</p>
          )}
          <ul className="space-y-2">
            {keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <span className="text-gray-700 text-[15px]">{typeof point === 'string' ? point : ''}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )

    case 'callout':
      const calloutType = ('calloutType' in block && typeof block.calloutType === 'string') ? block.calloutType : 'info'
      const calloutStyles: Record<string, { bg: string; borderColor: string; text: string }> = {
        info: { bg: 'bg-blue-50', borderColor: 'border-blue-500', text: 'text-blue-800' },
        warning: { bg: 'bg-amber-50', borderColor: 'border-amber-500', text: 'text-amber-800' },
        success: { bg: 'bg-emerald-50', borderColor: 'border-emerald-500', text: 'text-emerald-800' },
        tip: { bg: 'bg-green-50', borderColor: 'border-green-500', text: 'text-green-800' },
        example: { bg: 'bg-purple-50', borderColor: 'border-purple-500', text: 'text-purple-800' },
      }
      const style = calloutStyles[calloutType] || calloutStyles.info
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-l-4 ${style.bg} ${style.borderColor}`}
        >
          <p className={`${style.text} text-[15px] leading-relaxed`}>
            {typeof block.content === 'string' ? block.content : ''}
          </p>
        </motion.div>
      )

    // Response blocks
    case 'prompt':
      return (
        <div>
          <label className="block text-gray-800 font-medium mb-3 text-[15px]">
            {typeof block.content === 'string' ? block.content : ''}
            {'required' in block && block.required && (
              <span className="text-rose-400 ml-1">*</span>
            )}
          </label>
          <motion.textarea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={locale === 'fr' ? 'Partagez vos pensées...' : locale === 'es' ? 'Comparta sus pensamientos...' : 'Share your thoughts...'}
            className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-teal-300 focus:bg-white focus:ring-0 outline-none resize-none min-h-[120px] disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
          />
        </div>
      )

    case 'multiple_choice':
      return (
        <MultipleChoiceBlock
          block={block}
          value={value as number | number[] | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'yes_no':
      return (
        <YesNoBlock
          block={block}
          value={value as 'yes' | 'no' | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'checklist':
      return (
        <ChecklistBlock
          block={block}
          value={value as number[] | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'scale':
      return (
        <ScaleBlock
          block={block}
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'likert':
      return (
        <LikertBlock
          block={block}
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'slider':
      return (
        <SliderBlock
          block={block}
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'numeric':
      return (
        <NumericBlock
          block={block}
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'matrix_rating':
      return (
        <MatrixRatingBlock
          block={block}
          value={value as Record<string, number> | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'mood':
      return (
        <MoodBlock
          block={block}
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'date_picker':
      return (
        <DatePickerBlock
          block={block}
          value={value as string | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'time_input':
      return (
        <TimeInputBlock
          block={block}
          value={value as string | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'list_input':
      return (
        <ListInputBlock
          block={block}
          value={value as string[] | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'table_exercise':
      return (
        <TableExerciseBlock
          block={block}
          value={value as Record<string, string>[] | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
          settings={settings}
        />
      )

    case 'audio_response':
      return (
        <AudioResponseBlock
          block={block}
          value={value as { url?: string; fileName?: string } | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'file_response':
      return (
        <FileResponseBlock
          block={block}
          value={value as { url?: string; fileName?: string; fileSize?: number } | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    case 'zoned_canvas':
      return (
        <ZonedCanvasRenderer
          block={block}
          value={value as Record<string, Array<{ id: string; text: string; createdAt: string }>> | undefined}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      )

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-xl text-gray-500">
          {locale === 'fr' ? 'Type de bloc non supporté: ' : locale === 'es' ? 'Tipo de bloque no soportado: ' : 'Unsupported block type: '}{block.type}
        </div>
      )
  }
}

// ===== Multiple Choice Block =====
function MultipleChoiceBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  // When allowMultiple is set the response is an array of indices and the
  // UI renders checkboxes; otherwise it's a single index and we render
  // radio-style buttons. Both shapes are stored as JSONB so the round-trip
  // through the DB is fine.
  value: number | number[] | undefined
  onChange: (value: number | number[]) => void
  disabled: boolean
  locale: string
}) {
  const allowMultiple = 'allowMultiple' in block && !!(block as { allowMultiple?: boolean }).allowMultiple

  // Support both 'options' and 'choices' field names
  const options: (string | { label: string })[] =
    ('options' in block && Array.isArray(block.options)) ? block.options :
    ('choices' in block && Array.isArray(block.choices)) ? block.choices : []

  const isSelectedAt = (index: number) =>
    allowMultiple
      ? Array.isArray(value) && value.includes(index)
      : value === index

  const onPick = (index: number) => {
    if (!allowMultiple) {
      onChange(index)
      return
    }
    const current = Array.isArray(value) ? value : []
    const next = current.includes(index)
      ? current.filter(i => i !== index)
      : [...current, index]
    onChange(next)
  }

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      {options.length === 0 ? (
        <p className="text-gray-400 italic text-sm">
          {locale === 'fr' ? 'Aucune option disponible' : locale === 'es' ? 'No hay opciones disponibles' : 'No options available'}
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => {
            const label = typeof option === 'string' ? option : option.label
            const isSelected = isSelectedAt(index)

            return (
              <motion.button
                key={index}
                type="button"
                disabled={disabled}
                onClick={() => onPick(index)}
                whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                  isSelected
                    ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-white'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {allowMultiple ? (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-teal-500 bg-teal-500 scale-110' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-teal-500 bg-teal-500 scale-110' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                )}
                <span className={`text-[15px] ${isSelected ? 'text-teal-700 font-medium' : 'text-gray-600'}`}>
                  {label || `Option ${index + 1}`}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===== Yes/No Block =====
function YesNoBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: 'yes' | 'no' | undefined
  onChange: (value: 'yes' | 'no') => void
  disabled: boolean
  locale: string
}) {
  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="flex gap-3">
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onChange('yes')}
          whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all duration-200 ${
            value === 'yes'
              ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 shadow-sm'
              : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/50 hover:bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <CheckCircle className={`w-5 h-5 ${value === 'yes' ? 'text-emerald-500' : 'text-gray-400'}`} />
          <span className="font-medium">{locale === 'fr' ? 'Oui' : locale === 'es' ? 'Sí' : 'Yes'}</span>
        </motion.button>
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onChange('no')}
          whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all duration-200 ${
            value === 'no'
              ? 'border-gray-400 bg-gray-100 text-gray-700 shadow-sm'
              : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/50 hover:bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <X className={`w-5 h-5 ${value === 'no' ? 'text-gray-600' : 'text-gray-400'}`} />
          <span className="font-medium">{locale === 'fr' ? 'Non' : locale === 'es' ? 'No' : 'No'}</span>
        </motion.button>
      </div>
    </div>
  )
}

// ===== Checklist Block =====
function ChecklistBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: number[] | undefined
  onChange: (value: number[]) => void
  disabled: boolean
  locale: string
}) {
  const items: (string | { text: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
  const selectedIndices = value || []

  const toggleItem = (index: number) => {
    if (selectedIndices.includes(index)) {
      onChange(selectedIndices.filter(i => i !== index))
    } else {
      onChange([...selectedIndices, index])
    }
  }

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="space-y-2">
        {items.map((item, index) => {
          const isChecked = selectedIndices.includes(index)
          const text = typeof item === 'string' ? item : item.text

          return (
            <motion.button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => toggleItem(index)}
              whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
              className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all duration-200 ${
                isChecked
                  ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm'
                  : 'border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-white'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                isChecked ? 'border-teal-500 bg-teal-500 scale-110' : 'border-gray-300'
              }`}>
                {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-[15px] ${isChecked ? 'text-teal-700 font-medium' : 'text-gray-600'}`}>
                {text}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ===== Scale Block =====
function ScaleBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: number | undefined
  onChange: (value: number) => void
  disabled: boolean
  locale: string
}) {
  const min = ('scaleMin' in block ? block.scaleMin : 1) as number
  const max = ('scaleMax' in block ? block.scaleMax : 10) as number
  const minLabel = ('scaleMinLabel' in block ? block.scaleMinLabel : min.toString()) as string
  const maxLabel = ('scaleMaxLabel' in block ? block.scaleMaxLabel : max.toString()) as string

  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="flex gap-1.5 justify-center flex-wrap">
        {numbers.map((num) => (
          <motion.button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => onChange(num)}
            whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-medium text-sm transition-all duration-200 ${
              value === num
                ? 'bg-gradient-to-br from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-500/30'
                : 'bg-gray-50 border-2 border-gray-100 text-gray-600 hover:bg-white hover:border-teal-200'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {num}
          </motion.button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <p className="text-xs text-gray-400 text-center mt-3">
          {min} = {minLabel} · {max} = {maxLabel}
        </p>
      )}
    </div>
  )
}

// ===== Likert Block =====
function LikertBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: number | undefined
  onChange: (value: number) => void
  disabled: boolean
  locale: string
}) {
  const scaleType = ('scaleType' in block ? block.scaleType : 'likert') as 'likert' | 'rating' | 'mood'
  const scale = ('scaleRange' in block ? block.scaleRange : ('likertScale' in block ? block.likertScale : 5)) as number
  const labels = 'likertLabels' in block ? block.likertLabels as { start?: string; end?: string } : {}
  const scaleLabels = 'scaleLabels' in block ? block.scaleLabels as string[] : []
  const numbers = Array.from({ length: scale }, (_, i) => i + 1)

  // Mood options for mood scale type (using icon names)
  const moodOptions = [
    { emoji: 'Angry', label: locale === 'fr' ? 'Difficile' : locale === 'es' ? 'Luchando' : 'Struggling', value: 1 },
    { emoji: 'Frown', label: locale === 'fr' ? 'Fragile' : locale === 'es' ? 'Bajo' : 'Low', value: 2 },
    { emoji: 'Meh', label: locale === 'fr' ? 'Neutre' : locale === 'es' ? 'Regular' : 'Okay', value: 3 },
    { emoji: 'Smile', label: locale === 'fr' ? 'Bien' : locale === 'es' ? 'Bien' : 'Good', value: 4 },
    { emoji: 'Laugh', label: locale === 'fr' ? 'Épanoui' : locale === 'es' ? 'Excelente' : 'Thriving', value: 5 },
  ]

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-4 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>

      {/* Mood Scale */}
      {scaleType === 'mood' && (
        <div className="flex justify-center gap-2 sm:gap-4">
          {moodOptions.map((mood) => {
            const isSelected = value === mood.value
            return (
              <motion.button
                key={mood.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(mood.value)}
                whileHover={!disabled ? { scale: 1.08, y: -3 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`flex flex-col items-center p-2.5 sm:p-3.5 rounded-2xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-50 to-emerald-50 ring-2 ring-teal-400 shadow-sm'
                    : 'bg-gray-50/50 hover:bg-white border-2 border-transparent hover:border-gray-100'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {moodIcons[mood.emoji] ? (
                  (() => {
                    const Icon = moodIcons[mood.emoji]
                    return <Icon className={`w-7 h-7 sm:w-9 sm:h-9 mb-1.5 ${isSelected ? moodColors[mood.emoji] : 'text-gray-400'}`} />
                  })()
                ) : (
                  <span className="text-2xl sm:text-3xl mb-1.5">{mood.emoji}</span>
                )}
                <span className={`text-[10px] sm:text-xs ${isSelected ? 'text-teal-700 font-medium' : 'text-gray-500'}`}>
                  {mood.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Rating Scale (Stars) */}
      {scaleType === 'rating' && (
        <div className="flex justify-center gap-2 sm:gap-3 p-3 bg-gray-50/50 rounded-2xl">
          {numbers.map((num) => {
            const isSelected = value !== undefined && num <= value
            return (
              <motion.button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num)}
                whileHover={!disabled ? { scale: 1.2, y: -2 } : {}}
                whileTap={!disabled ? { scale: 0.9 } : {}}
                className={`text-2xl sm:text-3xl transition-all duration-200 ${
                  isSelected ? 'text-amber-400 drop-shadow-sm' : 'text-gray-200 hover:text-amber-300'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                ★
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Likert Scale (Default - numbered circles) */}
      {(!scaleType || scaleType === 'likert') && (
        <div>
          <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
            {numbers.map((num) => (
              <motion.button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num)}
                whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-medium text-sm sm:text-base transition-all duration-200 ${
                  value === num
                    ? 'bg-gradient-to-br from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-gray-50 border-2 border-gray-100 text-gray-600 hover:bg-white hover:border-teal-200'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {num}
              </motion.button>
            ))}
          </div>
          {/* Scale labels as note below */}
          {(scaleLabels[0] || labels.start || scaleLabels[scaleLabels.length - 1] || labels.end) && (
            <p className="text-xs text-gray-400 text-center mt-3">
              1 = {scaleLabels[0] || labels.start || '1'} · {scale} = {scaleLabels[scaleLabels.length - 1] || labels.end || scale.toString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ===== Slider Block =====
function SliderBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: number | undefined
  onChange: (value: number) => void
  disabled: boolean
  locale: string
}) {
  const min = ('sliderMin' in block ? block.sliderMin : 0) as number
  const max = ('sliderMax' in block ? block.sliderMax : 100) as number
  const step = ('sliderStep' in block ? block.sliderStep : 1) as number
  const unit = ('sliderUnit' in block ? block.sliderUnit : '') as string

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl space-y-4">
        <div className="flex items-center justify-center">
          <motion.span
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent"
          >
            {value !== undefined ? `${value}${unit}` : '-'}
          </motion.span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-500 disabled:opacity-60 transition-all"
        />
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  )
}

// ===== Numeric Block =====
function NumericBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: number | undefined
  onChange: (value: number) => void
  disabled: boolean
  locale: string
}) {
  const min = ('numericMin' in block ? block.numericMin : undefined) as number | undefined
  const max = ('numericMax' in block ? block.numericMax : undefined) as number | undefined

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        placeholder={locale === 'fr' ? 'Entrez un nombre...' : locale === 'es' ? 'Ingrese un número...' : 'Enter a number...'}
        className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-teal-300 focus:bg-white focus:ring-0 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
      />
    </div>
  )
}

// ===== Matrix Rating Block =====
function MatrixRatingBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: Record<string, number> | undefined
  onChange: (value: Record<string, number>) => void
  disabled: boolean
  locale: string
}) {
  // Get matrix items - if empty, treat the content as the single item
  const items = ('matrixItems' in block && Array.isArray(block.matrixItems) && block.matrixItems.length > 0)
    ? block.matrixItems
    : []

  // If no matrixItems but has content, use single item mode (common case for individual rating questions)
  const isSingleItemMode = items.length === 0 && typeof block.content === 'string'

  const scaleMax = ('matrixScaleMax' in block ? block.matrixScaleMax : 5) as number
  const labels = 'matrixScaleLabels' in block ? block.matrixScaleLabels as { min?: string; max?: string } : {}
  const ratings = value || {}

  const setRating = (itemKey: string, rating: number) => {
    onChange({ ...ratings, [itemKey]: rating })
  }

  // Single item mode - simpler UI with larger clickable buttons
  if (isSingleItemMode) {
    const currentRating = ratings['0'] || 0

    return (
      <div>
        <label className="block text-gray-800 font-medium mb-4 text-[15px]">
          {block.content as string}
          {'required' in block && block.required && (
            <span className="text-rose-400 ml-1">*</span>
          )}
        </label>
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
          {Array.from({ length: scaleMax }).map((_, i) => {
            const ratingValue = i + 1
            const isSelected = currentRating === ratingValue

            return (
              <motion.button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => setRating('0', ratingValue)}
                whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-gray-50 border-2 border-gray-100 text-gray-600 hover:bg-white hover:border-teal-200'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {ratingValue}
              </motion.button>
            )
          })}
        </div>
        {(labels.min || labels.max) && (
          <p className="text-xs text-gray-400 text-center mt-3">
            1 = {labels.min || (locale === 'fr' ? 'Pas du tout' : locale === 'es' ? 'Para nada' : 'Not at all')} · {scaleMax} = {labels.max || (locale === 'fr' ? 'Tout à fait' : locale === 'es' ? 'Completamente' : 'Completely')}
          </p>
        )}
      </div>
    )
  }

  // Multi-item mode - table UI
  return (
    <div>
      <label className="block text-gray-800 font-medium mb-4 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium"></th>
              {Array.from({ length: scaleMax }).map((_, i) => (
                <th key={i} className="px-2 py-3 text-center text-sm text-gray-500 font-medium">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, itemIndex) => (
              <tr key={itemIndex} className="border-t border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="py-4 px-4 text-gray-700 text-[15px]">{item}</td>
                {Array.from({ length: scaleMax }).map((_, rating) => (
                  <td key={rating} className="px-2 py-4 text-center">
                    <motion.button
                      type="button"
                      disabled={disabled}
                      onClick={() => setRating(itemIndex.toString(), rating + 1)}
                      whileHover={!disabled ? { scale: 1.15 } : {}}
                      whileTap={!disabled ? { scale: 0.9 } : {}}
                      className={`w-7 h-7 rounded-xl border-2 transition-all duration-200 ${
                        ratings[itemIndex.toString()] === rating + 1
                          ? 'border-teal-500 bg-gradient-to-br from-teal-400 to-teal-500'
                          : 'border-gray-200 hover:border-teal-300 bg-white'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(labels.min || labels.max) && (
        <p className="text-xs text-gray-400 text-center mt-3">
          1 = {labels.min} · {scaleMax} = {labels.max}
        </p>
      )}
    </div>
  )
}

// ===== Mood Block =====
function MoodBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: number | undefined
  onChange: (value: number) => void
  disabled: boolean
  locale: string
}) {
  const moodOptions = ('moodOptions' in block && Array.isArray(block.moodOptions))
    ? block.moodOptions
    : [
        { emoji: 'Angry', label: locale === 'fr' ? 'Difficile' : locale === 'es' ? 'Luchando' : 'Struggling', value: 1 },
        { emoji: 'Frown', label: locale === 'fr' ? 'Fragile' : locale === 'es' ? 'Bajo' : 'Low', value: 2 },
        { emoji: 'Meh', label: locale === 'fr' ? 'Neutre' : locale === 'es' ? 'Regular' : 'Okay', value: 3 },
        { emoji: 'Smile', label: locale === 'fr' ? 'Bien' : locale === 'es' ? 'Bien' : 'Good', value: 4 },
        { emoji: 'Laugh', label: locale === 'fr' ? 'Épanoui' : locale === 'es' ? 'Excelente' : 'Thriving', value: 5 },
      ]

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-4 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="flex justify-center gap-2 sm:gap-4">
        {moodOptions.map((mood, index) => {
          const moodValue = mood.value ?? index + 1
          const isSelected = value === moodValue

          return (
            <motion.button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onChange(moodValue)}
              whileHover={!disabled ? { scale: 1.08, y: -3 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={`flex flex-col items-center p-2.5 sm:p-3.5 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-50 to-emerald-50 ring-2 ring-teal-400 shadow-sm'
                  : 'bg-gray-50/50 hover:bg-white border-2 border-transparent hover:border-gray-100'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {moodIcons[mood.emoji] ? (
                (() => {
                  const Icon = moodIcons[mood.emoji]
                  return <Icon className={`w-7 h-7 sm:w-9 sm:h-9 mb-1.5 ${isSelected ? moodColors[mood.emoji] : 'text-gray-400'}`} />
                })()
              ) : (
                <span className="text-2xl sm:text-3xl mb-1.5">{mood.emoji}</span>
              )}
              <span className={`text-[10px] sm:text-xs ${isSelected ? 'text-teal-700 font-medium' : 'text-gray-500'}`}>
                {mood.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ===== Date Picker Block =====
function DatePickerBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: string | undefined
  onChange: (value: string) => void
  disabled: boolean
  locale: string
}) {
  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-teal-300 focus:bg-white focus:ring-0 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-700"
      />
    </div>
  )
}

// ===== Time Input Block =====
function TimeInputBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: string | undefined
  onChange: (value: string) => void
  disabled: boolean
  locale: string
}) {
  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-teal-300 focus:bg-white focus:ring-0 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-700"
      />
    </div>
  )
}

// ===== List Input Block =====
function ListInputBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: string[] | undefined
  onChange: (value: string[]) => void
  disabled: boolean
  locale: string
}) {
  const items = value || ['']

  const updateItem = (index: number, text: string) => {
    const newItems = [...items]
    newItems[index] = text
    onChange(newItems)
  }

  const addItem = () => {
    onChange([...items, ''])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index))
    }
  }

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>
      <div className="space-y-2.5">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-2 items-center"
            >
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium flex-shrink-0">
                {index + 1}
              </div>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                disabled={disabled}
                placeholder={locale === 'fr' ? `Élément ${index + 1}...` : locale === 'es' ? `Elemento ${index + 1}...` : `Item ${index + 1}...`}
                className="flex-1 p-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-teal-300 focus:bg-white focus:ring-0 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
              />
              {items.length > 1 && !disabled && (
                <motion.button
                  type="button"
                  onClick={() => removeItem(index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-300 hover:text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {!disabled && (
          <motion.button
            type="button"
            onClick={addItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {locale === 'fr' ? 'Ajouter un élément' : locale === 'es' ? 'Agregar elemento' : 'Add item'}
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ===== Table Exercise Block =====
interface TableColumn {
  id: string
  header: string
  description?: string
}

function TableExerciseBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
  settings,
}: {
  block: ResourceBlock
  value: Record<string, string>[] | undefined
  onChange: (value: Record<string, string>[]) => void
  disabled: boolean
  locale: string
  settings?: {
    rowMode?: 'unlimited' | 'limited'
    minRows?: number
    maxRows?: number
  }
}) {
  // Get columns from block
  const columns: TableColumn[] = ('columns' in block && Array.isArray(block.columns)) ? block.columns : []
  const instructions = ('instructions' in block && typeof block.instructions === 'string') ? block.instructions : null

  // Get row limits from settings
  const minRows = settings?.minRows || 1
  const maxRows = settings?.rowMode === 'limited' ? (settings?.maxRows || 999) : 999

  // Initialize with minimum rows if no value
  const rows = value && value.length > 0 ? value : Array(minRows).fill({})

  // Current entry index - default to latest entry
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, rows.length - 1))

  // Ensure currentIndex is valid
  const safeCurrentIndex = Math.min(currentIndex, rows.length - 1)
  const currentRow = rows[safeCurrentIndex] || {}

  const updateCell = (rowIndex: number, columnId: string, cellValue: string) => {
    const newRows = [...rows]
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = {}
    }
    newRows[rowIndex] = { ...newRows[rowIndex], [columnId]: cellValue }
    onChange(newRows)
  }

  const addRow = () => {
    if (rows.length < maxRows) {
      const newRows = [...rows, {}]
      onChange(newRows)
      setCurrentIndex(newRows.length - 1) // Navigate to new entry
    }
  }

  const removeRow = (index: number) => {
    if (rows.length > minRows) {
      const newRows = rows.filter((_, i) => i !== index)
      onChange(newRows)
      // Adjust current index if needed
      if (currentIndex >= newRows.length) {
        setCurrentIndex(Math.max(0, newRows.length - 1))
      }
    }
  }

  const goToPrevious = () => {
    if (safeCurrentIndex > 0) {
      setCurrentIndex(safeCurrentIndex - 1)
    }
  }

  const goToNext = () => {
    if (safeCurrentIndex < rows.length - 1) {
      setCurrentIndex(safeCurrentIndex + 1)
    }
  }

  const canAddRow = rows.length < maxRows
  const canRemoveRow = rows.length > minRows

  if (columns.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl text-gray-500">
        {locale === 'fr' ? 'Aucune colonne définie' : locale === 'es' ? 'No hay columnas definidas' : 'No columns defined'}
      </div>
    )
  }

  return (
    <div>
      {/* Instructions */}
      {instructions && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-emerald-800 text-sm">{instructions}</p>
        </div>
      )}

      {/* Mobile Single Entry View */}
      <div className="md:hidden">
        {/* Entry Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {locale === 'fr' ? 'Entrée' : locale === 'es' ? 'Entrada' : 'Entry'} {safeCurrentIndex + 1}
            </span>
            <span className="text-sm text-gray-400">
              / {rows.length}
            </span>
          </div>
          {!disabled && canRemoveRow && (
            <button
              type="button"
              onClick={() => removeRow(safeCurrentIndex)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Entry Pills Navigation */}
        {rows.length > 1 && (
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2">
            {rows.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  index === safeCurrentIndex
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
            {!disabled && canAddRow && (
              <button
                type="button"
                onClick={addRow}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Current Entry Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={safeCurrentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Card Fields */}
            <div className="p-4 space-y-4">
              {columns.map((col) => (
                <div key={col.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {col.header}
                  </label>
                  {col.description && (
                    <p className="text-xs text-gray-500 mb-2 italic">{col.description}</p>
                  )}
                  <textarea
                    value={currentRow[col.id] || ''}
                    onChange={(e) => updateCell(safeCurrentIndex, col.id, e.target.value)}
                    disabled={disabled}
                    placeholder={locale === 'fr' ? 'Tapez ici...' : locale === 'es' ? 'Escriba aquí...' : 'Type here...'}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none resize-none text-base disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-4 gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={safeCurrentIndex === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              safeCurrentIndex === 0
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-98'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            {locale === 'fr' ? 'Précédent' : locale === 'es' ? 'Anterior' : 'Previous'}
          </button>

          {safeCurrentIndex < rows.length - 1 ? (
            <button
              type="button"
              onClick={goToNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-98 transition-all"
            >
              {locale === 'fr' ? 'Suivant' : locale === 'es' ? 'Siguiente' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : !disabled && canAddRow ? (
            <button
              type="button"
              onClick={addRow}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-98 transition-all"
            >
              <Plus className="w-5 h-5" />
              {locale === 'fr' ? 'Nouvelle entrée' : locale === 'es' ? 'Nueva entrada' : 'New Entry'}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-400">
              {locale === 'fr' ? 'Dernière entrée' : locale === 'es' ? 'Última entrada' : 'Last Entry'}
            </div>
          )}
        </div>

        {/* Max reached message - Mobile */}
        {!disabled && !canAddRow && settings?.rowMode === 'limited' && (
          <div className="text-center py-3 mt-2 text-sm text-gray-500">
            {locale === 'fr'
              ? `Maximum de ${maxRows} entrées atteint`
              : locale === 'es'
                ? `Máximo de ${maxRows} entradas alcanzado`
                : `Maximum of ${maxRows} entries reached`}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                {columns.map((col) => (
                  <th key={col.id} className="px-4 py-2.5 text-left text-xs font-semibold">{col.header}</th>
                ))}
                {!disabled && <th className="w-12"></th>}
              </tr>
              {columns.some(col => col.description) && (
                <tr className="bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-2.5 text-xs text-gray-500 italic border-t border-gray-100 align-top whitespace-pre-wrap">{col.description || ''}</td>
                  ))}
                  {!disabled && <td className="border-t border-gray-100"></td>}
                </tr>
              )}
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={col.id} className="px-3 py-2 border-t border-gray-100 align-top">
                      <textarea
                        value={row[col.id] || ''}
                        onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
                        disabled={disabled}
                        placeholder={locale === 'fr' ? 'Réponse...' : locale === 'es' ? 'Respuesta...' : "Member's response..."}
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-none text-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:italic min-h-[60px]"
                      />
                    </td>
                  ))}
                  {!disabled && (
                    <td className="px-2 py-2 border-t border-gray-100 text-center align-top">
                      {canRemoveRow && (
                        <button
                          type="button"
                          onClick={() => removeRow(rowIndex)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!disabled && canAddRow && (
          <button
            type="button"
            onClick={addRow}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {locale === 'fr' ? 'Ajouter une ligne' : locale === 'es' ? 'Agregar fila' : 'Add Row'}
            {settings?.rowMode === 'limited' && (
              <span className="text-gray-400">({rows.length}/{maxRows})</span>
            )}
          </button>
        )}

        {/* Max reached message - Desktop */}
        {!disabled && !canAddRow && settings?.rowMode === 'limited' && (
          <p className="mt-4 text-sm text-gray-500">
            {locale === 'fr'
              ? `Maximum de ${maxRows} entrées atteint`
              : locale === 'es'
                ? `Máximo de ${maxRows} entradas alcanzado`
                : `Maximum of ${maxRows} entries reached`}
          </p>
        )}
      </div>

      {/* Entry count */}
      {rows.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 text-center md:block hidden">
          {rows.length} {locale === 'fr'
            ? (rows.length === 1 ? 'entrée' : 'entrées')
            : locale === 'es'
              ? (rows.length === 1 ? 'entrada' : 'entradas')
              : (rows.length === 1 ? 'entry' : 'entries')}
          {settings?.rowMode === 'limited' && ` / ${maxRows} max`}
          {minRows > 1 && ` (${locale === 'fr' ? 'min' : locale === 'es' ? 'mín' : 'min'}: ${minRows})`}
        </p>
      )}
    </div>
  )
}

// ===== Audio Response Block =====
function AudioResponseBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: { url?: string; fileName?: string } | undefined
  onChange: (value: { url?: string; fileName?: string } | null) => void
  disabled: boolean
  locale: string
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      // Create a local URL for preview (in a real app, you'd upload to storage)
      const url = URL.createObjectURL(file)
      onChange({ url, fileName: file.name })
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>

      {value?.url ? (
        // Audio preview
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border-2 border-teal-100"
        >
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </motion.button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-teal-700 truncate">{value.fileName || 'Audio recording'}</p>
              <p className="text-xs text-teal-600">{locale === 'fr' ? 'Prêt à jouer' : locale === 'es' ? 'Listo para reproducir' : 'Ready to play'}</p>
            </div>
            {!disabled && (
              <motion.button
                type="button"
                onClick={handleRemove}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>
          {value.url && (
            <audio src={value.url} className="hidden" />
          )}
        </motion.div>
      ) : (
        // Upload/record UI
        <div className="space-y-3">
          {/* Record button - placeholder for future implementation */}
          <motion.button
            type="button"
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 transition-all duration-200 ${
              disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-teal-200 bg-teal-50/50 hover:border-teal-300 hover:bg-teal-50 cursor-pointer'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              disabled ? 'bg-gray-200 text-gray-400' : 'bg-teal-100 text-teal-600'
            }`}>
              <Mic className="w-6 h-6" />
            </div>
            <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-teal-700'}`}>
              {locale === 'fr' ? 'Enregistrer un audio' : locale === 'es' ? 'Grabar audio' : 'Record audio'}
            </span>
            <span className={`text-xs ${disabled ? 'text-gray-400' : 'text-teal-600'}`}>
              {locale === 'fr' ? '(Bientôt disponible)' : locale === 'es' ? '(Próximamente)' : '(Coming soon)'}
            </span>
          </motion.button>

          {/* File upload */}
          <label className={`block w-full p-4 rounded-2xl border-2 border-dashed text-center transition-all duration-200 ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-200 bg-gray-50/50 hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer'
          }`}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={disabled}
              className="hidden"
            />
            <Upload className={`w-5 h-5 mx-auto mb-2 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {locale === 'fr' ? 'Ou téléverser un fichier audio' : locale === 'es' ? 'O subir un archivo de audio' : 'Or upload an audio file'}
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

// ===== File Response Block =====
function FileResponseBlock({
  block,
  value,
  onChange,
  disabled,
  locale,
}: {
  block: ResourceBlock
  value: { url?: string; fileName?: string; fileSize?: number } | undefined
  onChange: (value: { url?: string; fileName?: string; fileSize?: number } | null) => void
  disabled: boolean
  locale: string
}) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a local URL for preview (in a real app, you'd upload to storage)
      const url = URL.createObjectURL(file)
      onChange({ url, fileName: file.name, fileSize: file.size })
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Get accepted file types from block settings
  const acceptedTypes = ('acceptedTypes' in block && Array.isArray(block.acceptedTypes))
    ? block.acceptedTypes.join(',')
    : '*'

  return (
    <div>
      <label className="block text-gray-800 font-medium mb-3 text-[15px]">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-rose-400 ml-1">*</span>
        )}
      </label>

      {value?.url ? (
        // File preview
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{value.fileName || 'Uploaded file'}</p>
              {value.fileSize && (
                <p className="text-xs text-gray-500">{formatFileSize(value.fileSize)}</p>
              )}
            </div>
            {!disabled && (
              <motion.button
                type="button"
                onClick={handleRemove}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </motion.div>
      ) : (
        // Upload UI
        <label className={`block w-full p-6 rounded-2xl border-2 border-dashed text-center transition-all duration-200 ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-200 bg-gray-50/50 hover:border-teal-300 hover:bg-teal-50/50 cursor-pointer'
        }`}>
          <input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileUpload}
            disabled={disabled}
            className="hidden"
          />
          <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
            disabled ? 'bg-gray-200' : 'bg-gradient-to-br from-teal-100 to-emerald-100'
          }`}>
            <Upload className={`w-7 h-7 ${disabled ? 'text-gray-400' : 'text-teal-600'}`} />
          </div>
          <p className={`text-sm font-medium mb-1 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {locale === 'fr' ? 'Cliquez pour téléverser' : locale === 'es' ? 'Haga clic para subir' : 'Click to upload'}
          </p>
          <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            {locale === 'fr' ? 'ou glissez-déposez un fichier' : locale === 'es' ? 'o arrastre y suelte un archivo' : 'or drag and drop a file'}
          </p>
        </label>
      )}
    </div>
  )
}

// ===== Zoned Canvas Block =====
// Renders a 2-D canvas with labeled zones (rectangles, circles, polygons).
// Patients add entries by tapping a zone OR by pressing the "+ Add" button
// under the list view below the canvas. The list view is the primary entry
// surface on mobile and the accessibility fallback on desktop. SVG canvas
// is for visual context.
type Accent = 'teal' | 'amber' | 'rose' | 'violet' | 'sky' | 'emerald' | 'orange' | 'slate'
const ACCENT_COLORS: Record<Accent, { fill: string; stroke: string; text: string; bg: string; border: string }> = {
  teal:    { fill: 'rgba(20, 184, 166, 0.10)', stroke: '#0d9488', text: '#0f766e', bg: 'bg-teal-50',    border: 'border-teal-200' },
  amber:   { fill: 'rgba(245, 158, 11, 0.10)', stroke: '#d97706', text: '#a16207', bg: 'bg-amber-50',   border: 'border-amber-200' },
  rose:    { fill: 'rgba(244, 63, 94, 0.10)',  stroke: '#e11d48', text: '#be123c', bg: 'bg-rose-50',    border: 'border-rose-200' },
  violet:  { fill: 'rgba(139, 92, 246, 0.10)', stroke: '#7c3aed', text: '#6d28d9', bg: 'bg-violet-50',  border: 'border-violet-200' },
  sky:     { fill: 'rgba(14, 165, 233, 0.10)', stroke: '#0284c7', text: '#0369a1', bg: 'bg-sky-50',     border: 'border-sky-200' },
  emerald: { fill: 'rgba(16, 185, 129, 0.10)', stroke: '#059669', text: '#047857', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  orange:  { fill: 'rgba(249, 115, 22, 0.10)', stroke: '#ea580c', text: '#c2410c', bg: 'bg-orange-50',  border: 'border-orange-200' },
  slate:   { fill: 'rgba(100, 116, 139, 0.06)', stroke: '#475569', text: '#334155', bg: 'bg-slate-50',  border: 'border-slate-200' },
}

interface ZoneShape {
  kind: 'rect' | 'circle' | 'ellipse' | 'polygon'
  x?: number; y?: number; w?: number; h?: number; rx?: number
  cx?: number; cy?: number; r?: number; ry?: number
  points?: [number, number][]
}

interface CanvasZone {
  id: string
  label: { en: string; fr: string; es?: string }
  description?: { en: string; fr: string; es?: string }
  shape: ZoneShape
  accent?: Accent
  parentZoneId?: string | null
  maxItems?: number
}

interface ZonedCanvasBlockData {
  type: 'zoned_canvas'
  id: string
  content?: string
  canvas: { width: number; height: number; backgroundImageUrl?: string }
  zones: CanvasZone[]
}

interface ZoneEntry { id: string; text: string; createdAt: string }

function ZonedCanvasRenderer({
  block,
  value,
  onChange,
  disabled = false,
  locale = 'en',
}: {
  block: ResourceBlock
  value: Record<string, ZoneEntry[]> | undefined
  onChange: (value: Record<string, ZoneEntry[]>) => void
  disabled?: boolean
  locale?: 'en' | 'fr' | 'es'
}) {
  const b = block as unknown as ZonedCanvasBlockData
  const entries: Record<string, ZoneEntry[]> = value || {}
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const labelOf = (z: CanvasZone) => z.label[locale] || z.label.en
  const descOf = (z: CanvasZone) => z.description?.[locale] || z.description?.en

  const startAdd = (zoneId: string) => {
    if (disabled) return
    setEditingZone(zoneId)
    setDraft('')
  }
  const commitAdd = () => {
    if (!editingZone || !draft.trim()) { setEditingZone(null); return }
    const next = { ...entries }
    const list = next[editingZone] ? [...next[editingZone]] : []
    list.push({
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    })
    next[editingZone] = list
    onChange(next)
    setEditingZone(null)
    setDraft('')
  }
  const removeEntry = (zoneId: string, entryId: string) => {
    const next = { ...entries }
    next[zoneId] = (next[zoneId] || []).filter(e => e.id !== entryId)
    if (next[zoneId].length === 0) delete next[zoneId]
    onChange(next)
  }

  // Sort zones by area (descending) for SVG paint order, so the smaller
  // nested zones (e.g. inner circle) render on top of their parent.
  const zoneArea = (z: CanvasZone): number => {
    const s = z.shape
    if (s.kind === 'rect')    return (s.w ?? 0) * (s.h ?? 0)
    if (s.kind === 'circle')  return Math.PI * (s.r ?? 0) ** 2
    if (s.kind === 'ellipse') return Math.PI * (s.rx ?? 0) * (s.ry ?? 0)
    if (s.kind === 'polygon' && s.points) {
      let a = 0
      for (let i = 0; i < s.points.length; i++) {
        const [x1, y1] = s.points[i]
        const [x2, y2] = s.points[(i + 1) % s.points.length]
        a += x1 * y2 - x2 * y1
      }
      return Math.abs(a) / 2
    }
    return 0
  }
  const paintOrder = [...b.zones].sort((a, z) => zoneArea(z) - zoneArea(a))

  const renderShape = (z: CanvasZone) => {
    const colour = ACCENT_COLORS[z.accent ?? 'slate']
    const onActivate = () => startAdd(z.id)
    const common = {
      fill: colour.fill,
      stroke: colour.stroke,
      strokeWidth: 2,
      cursor: disabled ? 'default' : 'pointer',
      onClick: onActivate,
      // Accessibility: each zone is a button labelled with its zone
      // label so screen readers can target zones directly.
      role: disabled ? undefined : 'button',
      tabIndex: disabled ? undefined : 0,
      'aria-label': labelOf(z),
      onKeyDown: disabled ? undefined : (e: React.KeyboardEvent<SVGElement>) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate() }
      },
    }
    const s = z.shape
    if (s.kind === 'rect') {
      return <rect key={z.id} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} {...common} />
    }
    if (s.kind === 'circle') {
      return <circle key={z.id} cx={s.cx} cy={s.cy} r={s.r} {...common} />
    }
    if (s.kind === 'ellipse') {
      return <ellipse key={z.id} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...common} />
    }
    if (s.kind === 'polygon' && s.points) {
      return <polygon key={z.id} points={s.points.map(([x, y]) => `${x},${y}`).join(' ')} {...common} />
    }
    return null
  }

  // Label inside each zone — centred on shape centroid, accent-coloured.
  const renderLabel = (z: CanvasZone) => {
    const colour = ACCENT_COLORS[z.accent ?? 'slate']
    const s = z.shape
    let cx = 0, cy = 0
    if (s.kind === 'rect')         { cx = (s.x ?? 0) + (s.w ?? 0) / 2; cy = (s.y ?? 0) + 22 }
    else if (s.kind === 'circle')  { cx = s.cx ?? 0; cy = s.cy ?? 0 }
    else if (s.kind === 'ellipse') { cx = s.cx ?? 0; cy = s.cy ?? 0 }
    else if (s.kind === 'polygon' && s.points && s.points.length) {
      cx = s.points.reduce((a, [x]) => a + x, 0) / s.points.length
      cy = s.points.reduce((a, [, y]) => a + y, 0) / s.points.length
    }
    return (
      <text
        key={`label-${z.id}`}
        x={cx}
        y={cy}
        fill={colour.text}
        fontSize={14}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {labelOf(z)}
      </text>
    )
  }

  return (
    <div>
      {b.content && (
        <p className="text-gray-700 mb-4 text-[15px] leading-relaxed">{b.content}</p>
      )}

      {/* Visual canvas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4">
        <svg
          viewBox={`0 0 ${b.canvas.width} ${b.canvas.height}`}
          className="w-full h-auto"
          style={{ maxHeight: 480 }}
          role="img"
          aria-label="Zoned canvas — use the list below to add entries"
        >
          {b.canvas.backgroundImageUrl && (
            <image
              href={b.canvas.backgroundImageUrl}
              x={0} y={0}
              width={b.canvas.width}
              height={b.canvas.height}
              preserveAspectRatio="xMidYMid meet"
            />
          )}
          {paintOrder.map(renderShape)}
          {paintOrder.map(renderLabel)}
        </svg>
      </div>

      {/* Zone-grouped entry list — primary input surface */}
      <div className="space-y-3">
        {b.zones.map(zone => {
          const colour = ACCENT_COLORS[zone.accent ?? 'slate']
          const list = entries[zone.id] ?? []
          return (
            <div
              key={zone.id}
              className={`rounded-xl ${colour.bg} ${colour.border} border p-3`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: colour.text }}>
                    {labelOf(zone)}
                  </p>
                  {descOf(zone) && <p className="text-xs text-gray-500 leading-tight">{descOf(zone)}</p>}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => startAdd(zone.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="w-3 h-3" />
                    {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}
                  </button>
                )}
              </div>
              {list.length > 0 ? (
                <ul className="space-y-1">
                  {list.map(entry => (
                    <li key={entry.id} className="flex items-start gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: colour.stroke }} />
                      <span className="flex-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{entry.text}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => removeEntry(zone.id, entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-opacity"
                          aria-label="Remove entry"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {locale === 'fr' ? 'Aucune entrée pour le moment' : locale === 'es' ? 'Sin entradas todavía' : 'No entries yet'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal-style input sheet */}
      <AnimatePresence>
        {editingZone && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingZone(null)}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {locale === 'fr' ? 'Ajouter à' : locale === 'es' ? 'Añadir a' : 'Add to'}
              </p>
              <p className="text-base font-semibold text-gray-900 mb-3">
                {labelOf(b.zones.find(z => z.id === editingZone) as CanvasZone)}
              </p>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commitAdd() }}
                placeholder={locale === 'fr' ? 'Écrivez quelque chose…' : locale === 'es' ? 'Escribe algo…' : 'Write something…'}
                rows={3}
                autoFocus
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-teal-300 focus:ring-2 focus:ring-teal-100 outline-none text-sm text-gray-800 resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={commitAdd}
                  disabled={!draft.trim()}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlockRenderer
