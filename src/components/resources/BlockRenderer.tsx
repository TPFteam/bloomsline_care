'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Circle,
  Plus,
  X,
} from 'lucide-react'
import type { ResourceBlock } from '@/types/resource'

interface BlockRendererProps {
  block: ResourceBlock
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  locale?: 'en' | 'fr'
}

export function BlockRenderer({
  block,
  value,
  onChange,
  disabled = false,
  locale = 'en',
}: BlockRendererProps) {
  // Handle different block types
  switch (block.type) {
    // Display-only blocks
    case 'heading':
      return (
        <h2 className="text-xl font-bold text-gray-900">
          {typeof block.content === 'string' ? block.content : ''}
        </h2>
      )

    case 'paragraph':
      return (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {typeof block.content === 'string' ? block.content : ''}
        </p>
      )

    case 'quote':
      return (
        <blockquote className="border-l-4 border-lavender-400 pl-4 py-2 italic text-gray-600 bg-lavender-50/50 rounded-r-lg">
          {typeof block.content === 'string' ? block.content : ''}
        </blockquote>
      )

    case 'tip':
      return (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <p className="text-teal-700">
            <span className="font-semibold">{locale === 'fr' ? 'Conseil: ' : 'Tip: '}</span>
            {typeof block.content === 'string' ? block.content : ''}
          </p>
        </div>
      )

    case 'divider':
      return <hr className="border-gray-200 my-4" />

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
          <label className="block text-gray-900 font-medium mb-2">
            {typeof block.content === 'string' ? block.content : ''}
            {'required' in block && block.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={locale === 'fr' ? 'Votre réponse...' : 'Your response...'}
            className="w-full p-4 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none resize-none min-h-[120px] disabled:bg-gray-50 disabled:text-gray-500"
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
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
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
                whileHover={!disabled ? { scale: 1.01 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={isSelected ? 'text-teal-700 font-medium' : 'text-gray-700'}>
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
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="flex gap-3">
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onChange('yes')}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
            value === 'yes'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <CheckCircle className={`w-5 h-5 ${value === 'yes' ? 'text-emerald-600' : ''}`} />
          <span className="font-medium">{locale === 'fr' ? 'Oui' : 'Yes'}</span>
        </motion.button>
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onChange('no')}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
            value === 'no'
              ? 'border-gray-500 bg-gray-50 text-gray-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Circle className="w-5 h-5" />
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
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
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
              whileHover={!disabled ? { scale: 1.01 } : {}}
              className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                isChecked
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                isChecked ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
              }`}>
                {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={isChecked ? 'text-teal-700' : 'text-gray-700'}>
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
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 w-20 text-right">{minLabel}</span>
        <div className="flex-1 flex gap-1 justify-center">
          {numbers.map((num) => (
            <motion.button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => onChange(num)}
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                value === num
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {num}
            </motion.button>
          ))}
        </div>
        <span className="text-sm text-gray-500 w-20">{maxLabel}</span>
      </div>
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
  const scale = ('likertScale' in block ? block.likertScale : 5) as number
  const labels = 'likertLabels' in block ? block.likertLabels as { start?: string; end?: string } : {}
  const numbers = Array.from({ length: scale }, (_, i) => i + 1)

  return (
    <div>
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 w-24 text-right">{labels.start || '1'}</span>
        <div className="flex-1 flex gap-2 justify-center">
          {numbers.map((num) => (
            <motion.button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => onChange(num)}
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium transition-all ${
                value === num
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-teal-300'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {num}
            </motion.button>
          ))}
        </div>
        <span className="text-sm text-gray-500 w-24">{labels.end || scale.toString()}</span>
      </div>
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
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{min}{unit}</span>
          <span className="text-lg font-semibold text-teal-600">
            {value !== undefined ? `${value}${unit}` : '-'}
          </span>
          <span>{max}{unit}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-60"
        />
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
      <label className="block text-gray-900 font-medium mb-2">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
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
        className="w-full p-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none disabled:bg-gray-50 disabled:text-gray-500"
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
  const items = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
  const scaleMax = ('matrixScaleMax' in block ? block.matrixScaleMax : 5) as number
  const labels = 'matrixScaleLabels' in block ? block.matrixScaleLabels as { min?: string; max?: string } : {}
  const ratings = value || {}

  const setRating = (itemIndex: string, rating: number) => {
    onChange({ ...ratings, [itemIndex]: rating })
  }

  return (
    <div>
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4"></th>
              {Array.from({ length: scaleMax }).map((_, i) => (
                <th key={i} className="px-2 py-2 text-center text-sm text-gray-500 font-normal">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, itemIndex) => (
              <tr key={itemIndex} className="border-t border-gray-100">
                <td className="py-3 pr-4 text-gray-700">{item}</td>
                {Array.from({ length: scaleMax }).map((_, rating) => (
                  <td key={rating} className="px-2 py-3 text-center">
                    <motion.button
                      type="button"
                      disabled={disabled}
                      onClick={() => setRating(itemIndex.toString(), rating + 1)}
                      whileHover={!disabled ? { scale: 1.2 } : {}}
                      whileTap={!disabled ? { scale: 0.9 } : {}}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        ratings[itemIndex.toString()] === rating + 1
                          ? 'border-teal-500 bg-teal-500'
                          : 'border-gray-300 hover:border-teal-300'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {(labels.min || labels.max) && (
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>{labels.min}</span>
            <span>{labels.max}</span>
          </div>
        )}
      </div>
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
        { emoji: '😢', label: locale === 'fr' ? 'Très mal' : 'Very bad', value: 1 },
        { emoji: '😕', label: locale === 'fr' ? 'Mal' : 'Bad', value: 2 },
        { emoji: '😐', label: locale === 'fr' ? 'Neutre' : 'Neutral', value: 3 },
        { emoji: '🙂', label: locale === 'fr' ? 'Bien' : 'Good', value: 4 },
        { emoji: '😊', label: locale === 'fr' ? 'Très bien' : 'Very good', value: 5 },
      ]

  return (
    <div>
      <label className="block text-gray-900 font-medium mb-3">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="flex justify-center gap-4">
        {moodOptions.map((mood, index) => {
          const moodValue = mood.value ?? index + 1
          const isSelected = value === moodValue

          return (
            <motion.button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onChange(moodValue)}
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-teal-50 ring-2 ring-teal-500'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-3xl mb-1">{mood.emoji}</span>
              <span className={`text-xs ${isSelected ? 'text-teal-700 font-medium' : 'text-gray-500'}`}>
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
      <label className="block text-gray-900 font-medium mb-2">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none disabled:bg-gray-50 disabled:text-gray-500"
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
      <label className="block text-gray-900 font-medium mb-2">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none disabled:bg-gray-50 disabled:text-gray-500"
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
      <label className="block text-gray-900 font-medium mb-2">
        {typeof block.content === 'string' ? block.content : ''}
        {'required' in block && block.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              disabled={disabled}
              placeholder={locale === 'fr' ? `Élément ${index + 1}...` : `Item ${index + 1}...`}
              className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none disabled:bg-gray-50"
            />
            {items.length > 1 && !disabled && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-3 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
          </button>
        )}
      </div>
    </div>
  )
}

export default BlockRenderer
