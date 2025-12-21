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
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import type { ResourceBlock } from '@/types/resource'

interface BlockRendererProps {
  block: ResourceBlock
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  locale?: 'en' | 'fr'
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
            <span className="font-medium">{locale === 'fr' ? '💡 Conseil: ' : '💡 Tip: '}</span>
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
            placeholder={locale === 'fr' ? 'Partagez vos pensées...' : 'Share your thoughts...'}
            className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-teal-300 focus:bg-white focus:ring-0 outline-none resize-none min-h-[120px] disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
          />
        </div>
      )

    case 'multiple_choice':
      return (
        <MultipleChoiceBlock
          block={block}
          value={value as number | undefined}
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

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-xl text-gray-500">
          {locale === 'fr' ? 'Type de bloc non supporté: ' : 'Unsupported block type: '}{block.type}
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
  value: number | undefined
  onChange: (value: number) => void
  disabled: boolean
  locale: string
}) {
  // Support both 'options' and 'choices' field names
  const options: (string | { label: string })[] =
    ('options' in block && Array.isArray(block.options)) ? block.options :
    ('choices' in block && Array.isArray(block.choices)) ? block.choices : []

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
          {locale === 'fr' ? 'Aucune option disponible' : 'No options available'}
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => {
            const label = typeof option === 'string' ? option : option.label
            const isSelected = value === index

            return (
              <motion.button
                key={index}
                type="button"
                disabled={disabled}
                onClick={() => onChange(index)}
                whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${
                  isSelected
                    ? 'border-teal-400 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-white'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'border-teal-500 bg-teal-500 scale-110' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
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
          <span className="font-medium">{locale === 'fr' ? 'Oui' : 'Yes'}</span>
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
          <span className="font-medium">{locale === 'fr' ? 'Non' : 'No'}</span>
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

  // Mood options for mood scale type
  const moodOptions = [
    { emoji: '🌧️', label: locale === 'fr' ? 'Difficile' : 'Struggling', value: 1 },
    { emoji: '🍂', label: locale === 'fr' ? 'Fragile' : 'Low', value: 2 },
    { emoji: '🌱', label: locale === 'fr' ? 'Neutre' : 'Okay', value: 3 },
    { emoji: '🌿', label: locale === 'fr' ? 'Bien' : 'Good', value: 4 },
    { emoji: '🌸', label: locale === 'fr' ? 'Épanoui' : 'Thriving', value: 5 },
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
                <span className="text-2xl sm:text-3xl mb-1.5">{mood.emoji}</span>
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
        placeholder={locale === 'fr' ? 'Entrez un nombre...' : 'Enter a number...'}
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
            1 = {labels.min || (locale === 'fr' ? 'Pas du tout' : 'Not at all')} · {scaleMax} = {labels.max || (locale === 'fr' ? 'Tout à fait' : 'Completely')}
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
        { emoji: '🌧️', label: locale === 'fr' ? 'Difficile' : 'Struggling', value: 1 },
        { emoji: '🍂', label: locale === 'fr' ? 'Fragile' : 'Low', value: 2 },
        { emoji: '🌱', label: locale === 'fr' ? 'Neutre' : 'Okay', value: 3 },
        { emoji: '🌿', label: locale === 'fr' ? 'Bien' : 'Good', value: 4 },
        { emoji: '🌸', label: locale === 'fr' ? 'Épanoui' : 'Thriving', value: 5 },
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
              <span className="text-2xl sm:text-3xl mb-1.5">{mood.emoji}</span>
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
                placeholder={locale === 'fr' ? `Élément ${index + 1}...` : `Item ${index + 1}...`}
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
            {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
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
        {locale === 'fr' ? 'Aucune colonne définie' : 'No columns defined'}
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
              {locale === 'fr' ? 'Entrée' : 'Entry'} {safeCurrentIndex + 1}
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
                    placeholder={locale === 'fr' ? 'Tapez ici...' : 'Type here...'}
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
            {locale === 'fr' ? 'Précédent' : 'Previous'}
          </button>

          {safeCurrentIndex < rows.length - 1 ? (
            <button
              type="button"
              onClick={goToNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-98 transition-all"
            >
              {locale === 'fr' ? 'Suivant' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : !disabled && canAddRow ? (
            <button
              type="button"
              onClick={addRow}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-98 transition-all"
            >
              <Plus className="w-5 h-5" />
              {locale === 'fr' ? 'Nouvelle entrée' : 'New Entry'}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-400">
              {locale === 'fr' ? 'Dernière entrée' : 'Last Entry'}
            </div>
          )}
        </div>

        {/* Max reached message - Mobile */}
        {!disabled && !canAddRow && settings?.rowMode === 'limited' && (
          <div className="text-center py-3 mt-2 text-sm text-gray-500">
            {locale === 'fr'
              ? `Maximum de ${maxRows} entrées atteint`
              : `Maximum of ${maxRows} entries reached`}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-100">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="px-4 py-3 text-left font-semibold text-emerald-900 border-b border-emerald-200"
                  >
                    {col.header}
                  </th>
                ))}
                {!disabled && <th className="w-12 border-b border-emerald-200"></th>}
              </tr>
              {/* Description row */}
              {columns.some(col => col.description) && (
                <tr className="bg-emerald-50/50">
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="px-4 py-2 text-xs text-emerald-700 italic border-b border-emerald-100"
                    >
                      {col.description || ''}
                    </td>
                  ))}
                  {!disabled && <td className="border-b border-emerald-100"></td>}
                </tr>
              )}
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.id} className="px-2 py-2 border-b border-gray-100">
                      <textarea
                        value={row[col.id] || ''}
                        onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
                        disabled={disabled}
                        placeholder={locale === 'fr' ? 'Tapez ici...' : 'Type here...'}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                  ))}
                  {!disabled && (
                    <td className="px-2 py-2 border-b border-gray-100 text-center">
                      {canRemoveRow && (
                        <button
                          type="button"
                          onClick={() => removeRow(rowIndex)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Add Row Button - Desktop */}
        {!disabled && canAddRow && (
          <motion.button
            type="button"
            onClick={addRow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {locale === 'fr' ? 'Ajouter une ligne' : 'Add Row'}
            {settings?.rowMode === 'limited' && (
              <span className="text-emerald-500">({rows.length}/{maxRows})</span>
            )}
          </motion.button>
        )}

        {/* Max reached message - Desktop */}
        {!disabled && !canAddRow && settings?.rowMode === 'limited' && (
          <p className="mt-4 text-sm text-gray-500">
            {locale === 'fr'
              ? `Maximum de ${maxRows} entrées atteint`
              : `Maximum of ${maxRows} entries reached`}
          </p>
        )}
      </div>

      {/* Entry count */}
      {rows.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 text-center md:block hidden">
          {rows.length} {locale === 'fr'
            ? (rows.length === 1 ? 'entrée' : 'entrées')
            : (rows.length === 1 ? 'entry' : 'entries')}
          {settings?.rowMode === 'limited' && ` / ${maxRows} max`}
          {minRows > 1 && ` (${locale === 'fr' ? 'min' : 'min'}: ${minRows})`}
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
              <p className="text-xs text-teal-600">{locale === 'fr' ? 'Prêt à jouer' : 'Ready to play'}</p>
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
              {locale === 'fr' ? 'Enregistrer un audio' : 'Record audio'}
            </span>
            <span className={`text-xs ${disabled ? 'text-gray-400' : 'text-teal-600'}`}>
              {locale === 'fr' ? '(Bientôt disponible)' : '(Coming soon)'}
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
              {locale === 'fr' ? 'Ou téléverser un fichier audio' : 'Or upload an audio file'}
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
            {locale === 'fr' ? 'Cliquez pour téléverser' : 'Click to upload'}
          </p>
          <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            {locale === 'fr' ? 'ou glissez-déposez un fichier' : 'or drag and drop a file'}
          </p>
        </label>
      )}
    </div>
  )
}

export default BlockRenderer
