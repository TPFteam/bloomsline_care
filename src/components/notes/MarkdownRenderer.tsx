'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Target, Tag, Quote, X, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  className?: string
  /** If provided, enables "Remove" on tag/goal tooltips. Called with updated HTML after unlinking. */
  onContentChange?: (html: string) => void
  /** If provided, shows an edit button in the side rail. */
  onEdit?: () => void
  /** If provided, shows a delete button in the side rail. */
  onDelete?: () => void
}

const RICH_TEXT_STYLES = 'text-sm text-gray-700 [line-height:1.8] [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 [&_hr]:border-gray-200 [&_hr]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic'

function isHtml(text: string): boolean {
  return /<\/?(?:b|strong|i|em|h[1-6]|ul|ol|li|p|br|hr|div|mark)\b/i.test(text)
}

function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
}

const GOAL_NAVY = '#1e3a5f'
const GOAL_BG = '#dbeafe'
// Old goal greens to replace with navy
const OLD_GOAL_COLORS = ['#059669','#047857','#065f46','#6d28d9','#2563eb','#d1fae5','#a7f3d0','#6ee7b7','#ede9fe']

// Same palette as RichTextEditor — must stay in sync
const TAG_COLOR_PALETTE: { bg: string; border: string }[] = [
  { bg: '#fef2f2', border: '#ef4444' },  // red
  { bg: '#eff6ff', border: '#3b82f6' },  // blue
  { bg: '#fff7ed', border: '#f97316' },  // orange
  { bg: '#f5f3ff', border: '#A88AE1' },  // violet
  { bg: '#fef9c3', border: '#ca8a04' },  // gold
  { bg: '#fdf2f8', border: '#ec4899' },  // pink
  { bg: '#ecfdf5', border: '#10b981' },  // emerald
  { bg: '#eef2ff', border: '#6366f1' },  // indigo
  { bg: '#ecfeff', border: '#06b6d4' },  // cyan
  { bg: '#faf5ff', border: '#a21caf' },  // fuchsia
]

/** Inject --tag-color and --tag-bg into mark inline styles + rewrite tag colors to current palette */
function injectTagColors(html: string): string {
  // Collect all tag types in document order for palette assignment
  const tagTypes: string[] = []
  html.replace(/data-tag="([^"]*)"/gi, (_m, type) => { if (!tagTypes.includes(type)) tagTypes.push(type); return '' })

  // 1. Inject CSS vars into marks + recolor to palette
  let result = html.replace(/<mark\b([^>]*)\bstyle="([^"]*)"([^>]*)>/gi, (full, before: string, style: string, after: string) => {
    // Rewrite tag colors to current palette
    const tagMatch = (before + after).match(/data-tag="([^"]*)"/)
    if (tagMatch && tagTypes.length) {
      const tagType = tagMatch[1]
      const idx = tagTypes.indexOf(tagType)
      const colors = idx >= 0 ? TAG_COLOR_PALETTE[idx % TAG_COLOR_PALETTE.length] : TAG_COLOR_PALETTE[TAG_COLOR_PALETTE.length - 1]
      let s = style
      s = s.replace(/background-color:\s*#[0-9a-fA-F]{3,8}/, `background-color:${colors.bg}`)
      s = s.replace(/border-bottom:\s*2px\s+solid\s+#[0-9a-fA-F]{3,8}/, `border-bottom:2px solid ${colors.border}`)
      s = s.replace(/--tag-color:\s*#[0-9a-fA-F]{3,8}/, `--tag-color:${colors.border}`)
      s = s.replace(/--tag-bg:\s*#[0-9a-fA-F]{3,8}/, `--tag-bg:${colors.bg}`)
      if (!s.includes('--tag-color')) s += `;--tag-color:${colors.border}`
      if (!s.includes('--tag-bg')) s += `;--tag-bg:${colors.bg}`
      return `<mark${before}style="${s}"${after}>`
    }

    let extras = ''
    if (!style.includes('--tag-color')) {
      const borderMatch = style.match(/border-(?:bottom|left):[^;]*solid\s+(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/)
      const colorMatch = style.match(/(?:^|;)\s*color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/)
      const tagColor = borderMatch?.[1] || colorMatch?.[1]
      if (tagColor) extras += `--tag-color:${tagColor};`
    }
    if (!style.includes('--tag-bg')) {
      const bgMatch = style.match(/background-color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/)
      if (bgMatch) extras += `--tag-bg:${bgMatch[1]};`
    }
    if (!extras) return full
    return `<mark${before}style="${style};${extras}"${after}>`
  })
  // 2. Recolor goal sections (left border + header) from old greens to navy
  result = result.replace(/(<div[^>]*data-goal-section[^>]*style=")([^"]*)(")/gi, (_full, pre, style, post) => {
    let s = style
    for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY)
    return pre + s + post
  })
  result = result.replace(/(<div[^>]*data-goal-section-header[^>]*style=")([^"]*)(")/gi, (_full, pre, style, post) => {
    let s = style
    for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY)
    s = s.replace(/font-size:\s*13px/, 'font-size:16px').replace(/font-weight:\s*600/, 'font-weight:700')
    return pre + s + post
  })
  // Also recolor goal marks
  result = result.replace(/(<mark[^>]*data-goal-id[^>]*style=")([^"]*)(")/gi, (_full, pre, style, post) => {
    let s = style
    for (const c of OLD_GOAL_COLORS) {
      s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY)
    }
    s = s.replace(/background-color:\s*#[0-9a-fA-F]{3,8}/, `background-color:${GOAL_BG}`)
    return pre + s + post
  })
  return result
}


export function MarkdownRenderer({ content, className, onContentChange, onEdit, onDelete }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ top: number; left: number; title: string; kind: 'goal' | 'tag' | 'verbatim'; markEl: HTMLElement } | null>(null)
  const [showLabels, setShowLabels] = useState(true)

  // Check if the content has any annotation marks
  const hasAnnotations = useMemo(() => {
    if (!content) return false
    return /data-goal-id|data-tag=|data-verbatim|data-goal-section/.test(content)
  }, [content])

  // Preprocess HTML: inject CSS custom properties for tag colors
  const processedHtml = useMemo(() => {
    if (!content) return ''
    if (!isHtml(content)) return `<p>${content}</p>`
    return injectTagColors(sanitize(content))
  }, [content])

  // Hoist mid-sentence tag labels to the start of their block
  useEffect(() => {
    const el = containerRef.current
    if (!el || !showLabels || !hasAnnotations) return

    // Clean up previous hoisted labels
    el.querySelectorAll('[data-hoisted-label]').forEach(n => n.remove())
    el.querySelectorAll('.label-hoisted').forEach(n => n.classList.remove('label-hoisted'))

    const blockTags = new Set(['p', 'div', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    const marks = el.querySelectorAll('mark[data-tag], mark[data-goal-id], mark[data-verbatim]')

    marks.forEach(mark => {
      const markEl = mark as HTMLElement
      let block: HTMLElement | null = markEl.parentElement
      while (block && block !== el) {
        if (blockTags.has(block.tagName.toLowerCase())) break
        block = block.parentElement
      }
      if (!block || block === el) block = el

      // Check if mark is already the first meaningful node
      let isFirst = true
      let node: ChildNode | null = block.firstChild
      while (node && node !== mark) {
        if (node.nodeType === 1 || (node.nodeType === 3 && node.textContent?.trim())) {
          isFirst = false
          break
        }
        node = node.nextSibling
      }
      if (isFirst) return // ::before handles it

      const style = markEl.getAttribute('style') || ''
      const colorMatch = style.match(/--tag-color:\s*([^;]+)/)
      const bgMatch = style.match(/--tag-bg:\s*([^;]+)/)
      const color = colorMatch?.[1]?.trim() || '#6b7280'
      const bg = bgMatch?.[1]?.trim() || '#f3f4f6'
      const tagLabel = markEl.dataset.tagLabel || markEl.dataset.goalTitle || markEl.dataset.verbatim || ''

      const label = document.createElement('span')
      label.setAttribute('data-hoisted-label', '')
      label.setAttribute('style', `font-weight:700;color:${color};`)
      label.textContent = tagLabel + ': '

      markEl.classList.add('label-hoisted')
      block.insertBefore(label, block.firstChild)
    })

    return () => {
      if (!el) return
      el.querySelectorAll('[data-hoisted-label]').forEach(n => n.remove())
      el.querySelectorAll('.label-hoisted').forEach(n => n.classList.remove('label-hoisted'))
    }
  }, [content, showLabels, hasAnnotations])

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
        {hasAnnotations && (
          <style>{`
            .rte-read.show-labels mark[data-goal-id],
            .rte-read.show-labels mark[data-tag],
            .rte-read.show-labels mark[data-verbatim] {
              background-color: var(--tag-bg, #f3f4f6) !important;
              border-bottom: none !important;
              border-left: none !important;
              padding: 2px 4px;
              border-radius: 3px;
              color: inherit;
            }
            .rte-read.show-labels mark[data-goal-id]::before,
            .rte-read.show-labels mark[data-tag]::before,
            .rte-read.show-labels mark[data-verbatim]::before {
              font-size: inherit;
              font-style: normal;
              font-weight: 700;
              color: var(--tag-color, #6b7280);
            }
            .rte-read.show-labels mark[data-goal-id]::before {
              content: attr(data-goal-title) ": ";
            }
            .rte-read.show-labels mark[data-tag]::before {
              content: attr(data-tag-label) ": ";
            }
            .rte-read.show-labels mark[data-verbatim]::before {
              content: attr(data-verbatim) ": ";
            }
            .rte-read.show-labels mark.label-hoisted::before {
              display: none !important;
            }
          `}</style>
        )}
        <div className="relative flex">
          {(onEdit || onDelete) && (
            <div className="flex flex-col items-center gap-1 pt-1 pr-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  className="p-1.5 rounded transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="p-1.5 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <div
            ref={containerRef}
            className={`flex-1 ${RICH_TEXT_STYLES} ${hasAnnotations ? 'rte-read' : ''} ${showLabels ? 'show-labels' : ''} ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
            onClick={handleClick}
          />
        </div>
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
    <div className="relative flex">
      {(onEdit || onDelete) && (
        <div className="flex flex-col items-center gap-1 pt-1 pr-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <p className={`flex-1 text-sm text-gray-700 whitespace-pre-wrap ${className || ''}`}>
        {content}
      </p>
    </div>
  )
}
