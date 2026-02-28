'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Target, Tag, Quote, X } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
  /** If provided, enables "Remove" on tag/goal tooltips. Called with updated HTML after unlinking. */
  onContentChange?: (html: string) => void
}

const RICH_TEXT_STYLES = 'text-sm text-gray-700 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 [&_hr]:border-gray-200 [&_hr]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic'

function isHtml(text: string): boolean {
  return /<\/?(?:b|strong|i|em|h[1-6]|ul|ol|li|p|br|hr|div|mark)\b/i.test(text)
}

function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
}

export function MarkdownRenderer({ content, className, onContentChange }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ top: number; left: number; title: string; kind: 'goal' | 'tag' | 'verbatim'; markEl: HTMLElement } | null>(null)

  // Dismiss tooltip on click outside
  useEffect(() => {
    if (!tooltip) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-goal-read-tooltip]')) return
      setTooltip(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tooltip])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const goalMark = target.closest('mark[data-goal-id]') as HTMLElement | null
    const tagMark = target.closest('mark[data-tag]') as HTMLElement | null
    const verbatimMark = target.closest('mark[data-verbatim]') as HTMLElement | null
    const markEl = goalMark || tagMark || verbatimMark
    if (!markEl) return

    e.stopPropagation()
    const title = goalMark
      ? markEl.dataset.goalTitle
      : tagMark
        ? markEl.dataset.tagLabel
        : `${markEl.dataset.verbatim} said`
    if (!title) return

    const rect = markEl.getBoundingClientRect()

    setTooltip({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
      title,
      kind: goalMark ? 'goal' : tagMark ? 'tag' : 'verbatim',
      markEl,
    })
  }, [])

  const handleRemove = useCallback(() => {
    if (!tooltip || !containerRef.current || !onContentChange) return
    const markEl = tooltip.markEl
    const parent = markEl.parentNode
    if (!parent) return

    while (markEl.firstChild) {
      parent.insertBefore(markEl.firstChild, markEl)
    }
    parent.removeChild(markEl)
    setTooltip(null)

    // Pass updated HTML back to parent
    onContentChange(containerRef.current.innerHTML)
  }, [tooltip, onContentChange])

  if (!content) return null

  // HTML content (from rich text editor)
  if (isHtml(content)) {
    return (
      <>
        <div
          ref={containerRef}
          className={`${RICH_TEXT_STYLES} ${className || ''}`}
          dangerouslySetInnerHTML={{ __html: sanitize(content) }}
          onClick={handleClick}
        />
        {tooltip && createPortal(
          <div
            data-goal-read-tooltip
            className="fixed z-50"
            style={{ top: tooltip.top, left: tooltip.left, transform: 'translateX(-50%)' }}
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg shadow-lg text-xs whitespace-nowrap">
              {tooltip.kind === 'goal' ? (
                <Target className="w-3 h-3 text-emerald-400" />
              ) : tooltip.kind === 'tag' ? (
                <Tag className="w-3 h-3 text-violet-400" />
              ) : (
                <Quote className="w-3 h-3 text-sky-400" />
              )}
              <span>{tooltip.title}</span>
              {onContentChange && (
                <>
                  <div className="w-px h-3 bg-gray-600" />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleRemove}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // Legacy plain text — render with preserved line breaks
  return (
    <p className={`text-sm text-gray-700 whitespace-pre-wrap ${className || ''}`}>
      {content}
    </p>
  )
}
