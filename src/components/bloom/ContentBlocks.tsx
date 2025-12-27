'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type {
  ContentBlock,
  ChartContentBlock,
  StatsContentBlock,
  WeeklySummaryBlock,
  InsightContentBlock,
} from '@/types/bloom'

interface ContentBlockProps {
  block: ContentBlock
  isDark: boolean
}

/**
 * Main renderer that dispatches to specific block components
 */
export function ContentBlockRenderer({ block, isDark }: ContentBlockProps) {
  switch (block.type) {
    case 'chart':
      return <ChartBlock block={block} isDark={isDark} />
    case 'stats':
      return <StatsBlock block={block} isDark={isDark} />
    case 'weekly_summary':
      return <WeeklySummaryBlockComponent block={block} isDark={isDark} />
    case 'insight':
      return <InsightBlock block={block} isDark={isDark} />
    default:
      return null
  }
}

/**
 * Mini chart visualization (bar or donut)
 */
function ChartBlock({ block, isDark }: { block: ChartContentBlock; isDark: boolean }) {
  const maxValue = Math.max(...block.data.values, 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 mb-3 ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
      }`}
    >
      <div className="mb-3">
        <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {block.title}
        </h4>
        {block.subtitle && (
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            {block.subtitle}
          </p>
        )}
      </div>

      {block.chartType === 'bar' && (
        <div className="flex items-end gap-1 h-20">
          {block.data.values.map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(value / maxValue) * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="w-full rounded-t-sm min-h-[4px]"
                style={{ backgroundColor: block.data.colors?.[i] || '#10b981' }}
              />
              <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {block.data.labels[i]}
              </span>
            </div>
          ))}
        </div>
      )}

      {block.chartType === 'donut' && (
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {block.data.values.map((value, i) => {
                const total = block.data.values.reduce((a, b) => a + b, 0)
                const percentage = (value / total) * 100
                const previousPercentages = block.data.values
                  .slice(0, i)
                  .reduce((a, b) => a + (b / total) * 100, 0)

                return (
                  <motion.circle
                    key={i}
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={block.data.colors?.[i] || '#10b981'}
                    strokeWidth="4"
                    strokeDasharray={`${percentage} ${100 - percentage}`}
                    strokeDashoffset={-previousPercentages}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                )
              })}
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            {block.data.labels.map((label, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: block.data.colors?.[i] || '#10b981' }}
                />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  {label}: {block.data.values[i]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/**
 * Stats card with trend indicators
 */
function StatsBlock({ block, isDark }: { block: StatsContentBlock; isDark: boolean }) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }

  const trendColor = {
    up: 'text-emerald-500',
    down: 'text-rose-500',
    neutral: isDark ? 'text-white/40' : 'text-gray-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 mb-3 ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'
      }`}
    >
      <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {block.title}
      </h4>

      <div className="grid grid-cols-3 gap-3">
        {block.stats.map((stat, i) => {
          const Icon = stat.trend ? TrendIcon[stat.trend] : null

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-center"
            >
              {stat.icon && <div className="text-lg mb-1">{stat.icon}</div>}
              <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {stat.label}
              </div>
              {stat.trend && Icon && (
                <div className={`flex items-center justify-center gap-1 mt-1 ${trendColor[stat.trend]}`}>
                  <Icon className="w-3 h-3" />
                  {stat.trendValue && (
                    <span className="text-[10px]">{stat.trendValue}</span>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/**
 * Weekly summary card
 */
function WeeklySummaryBlockComponent({ block, isDark }: { block: WeeklySummaryBlock; isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 mb-3 ${
        isDark
          ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20'
          : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {block.weekLabel}
        </h4>
        {block.momentsCount !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ? 'bg-white/10 text-white/70' : 'bg-white text-gray-600'
          }`}>
            {block.momentsCount} moments
          </span>
        )}
      </div>

      <div className="space-y-2">
        {block.highlights.map((highlight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2"
          >
            <span className="text-base">{highlight.icon}</span>
            <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
              {highlight.text}
            </span>
          </motion.div>
        ))}
      </div>

      {block.moodBreakdown && (
        <div className="mt-3 pt-3 border-t border-emerald-500/20">
          <div className="flex h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${block.moodBreakdown.positive}%` }}
              className="bg-emerald-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${block.moodBreakdown.neutral}%` }}
              transition={{ delay: 0.1 }}
              className="bg-gray-400"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${block.moodBreakdown.negative}%` }}
              transition={{ delay: 0.2 }}
              className="bg-amber-500"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              Positive {block.moodBreakdown.positive}%
            </span>
            <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              Challenging {block.moodBreakdown.negative}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/**
 * Insight card
 */
function InsightBlock({ block, isDark }: { block: InsightContentBlock; isDark: boolean }) {
  const bgColors = {
    pattern: isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100',
    achievement: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100',
    suggestion: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 mb-3 border ${bgColors[block.insightType]}`}
    >
      <div className="flex items-start gap-3">
        {block.icon && <span className="text-2xl">{block.icon}</span>}
        <div>
          <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {block.title}
          </h4>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {block.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
