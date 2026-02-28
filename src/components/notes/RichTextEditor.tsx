'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bold, ChevronDown, ListOrdered, Minus, ScanLine, Loader2, Type, Target, Tag, Quote, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

// Inline style colors for goal marks (hex so they persist in stored HTML)
const GOAL_COLORS: Record<string, { bg: string; border: string }> = {
  discovery: { bg: '#d1fae5', border: '#059669' },
  planned: { bg: '#d1fae5', border: '#059669' },
  building: { bg: '#a7f3d0', border: '#047857' },
  in_progress: { bg: '#a7f3d0', border: '#047857' },
  thriving: { bg: '#6ee7b7', border: '#065f46' },
  achieved: { bg: '#6ee7b7', border: '#065f46' },
  independent: { bg: '#ede9fe', border: '#6d28d9' },
}
const DEFAULT_GOAL_COLOR = { bg: '#dbeafe', border: '#2563eb' }

function getGoalColor(status: string) {
  return GOAL_COLORS[status] || DEFAULT_GOAL_COLOR
}

// Inline style colors for tag marks
const TAG_COLORS: Record<string, { bg: string; border: string }> = {
  general: { bg: '#f3f4f6', border: '#6b7280' },
  symptome: { bg: '#fff1f2', border: '#f43f5e' },
  recurrence: { bg: '#faf5ff', border: '#a855f7' },
  hypothese: { bg: '#f0fdfa', border: '#14b8a6' },
  transfert: { bg: '#eef2ff', border: '#6366f1' },
  contre_transfert: { bg: '#fdf2f8', border: '#ec4899' },
  ajustement_envisage: { bg: '#ecfdf5', border: '#10b981' },
  milestone: { bg: '#f0fdf4', border: '#22c55e' },
}
const DEFAULT_TAG_COLOR = { bg: '#f3f4f6', border: '#6b7280' }

function getTagColor(type: string) {
  return TAG_COLORS[type] || DEFAULT_TAG_COLOR
}

type PopoverMode = 'choices' | 'goals' | 'tags'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  memberId: string
  locale: string
  autoFocus?: boolean
  milestones?: { id: string; title: string; status: string }[]
  noteTypes?: { type: string; label: string }[]
  memberName?: string
}

export function RichTextEditor({ value, onChange, placeholder, memberId, locale, autoFocus, milestones, noteTypes, memberName }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value)
  const [headingOpen, setHeadingOpen] = useState(false)
  const supabase = createClient()
  const initialized = useRef(false)
  const fr = locale === 'fr'

  // Tagging state
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [popoverMode, setPopoverMode] = useState<PopoverMode>('choices')
  const [markTooltip, setMarkTooltip] = useState<{ top: number; left: number; markEl: HTMLElement; kind: 'goal' | 'tag' | 'verbatim' } | null>(null)
  const savedRange = useRef<Range | null>(null)

  const hasGoals = !!milestones?.length
  const hasTags = !!noteTypes?.length
  const hasAnnotations = hasGoals || hasTags

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || ''
      initialized.current = true
      setIsEmpty(!value)
      if (autoFocus) {
        requestAnimationFrame(() => editorRef.current?.focus())
      }
    }
  }, [value, autoFocus])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const text = editorRef.current.textContent || ''
    setIsEmpty(!text.trim() && html !== '<hr>')
    onChange(html)
  }, [onChange])

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, val)
    handleInput()
  }, [handleInput])

  // Break out of <mark> on Enter — let browser handle Enter, then unwrap
  // the mark that gets carried into the new line
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const editor = editorRef.current
    if (!editor) return

    // Check if caret is inside a mark
    let node: Node | null = sel.anchorNode
    let inMark = false
    while (node && node !== editor) {
      if (node instanceof HTMLElement && node.tagName === 'MARK') {
        inMark = true
        break
      }
      node = node.parentNode
    }
    if (!inMark) return

    // Let the browser handle Enter natively, then clean up the duplicated mark
    requestAnimationFrame(() => {
      const sel2 = window.getSelection()
      if (!sel2 || !sel2.rangeCount || !editor) return

      // Find if caret ended up inside a mark in the new line
      let cur: Node | null = sel2.anchorNode
      let newMark: HTMLElement | null = null
      while (cur && cur !== editor) {
        if (cur instanceof HTMLElement && cur.tagName === 'MARK') {
          newMark = cur
          break
        }
        cur = cur.parentNode
      }

      if (newMark) {
        // Unwrap: move children out, place caret, remove empty mark
        const parent = newMark.parentNode
        if (!parent) return
        const firstChild = newMark.firstChild
        while (newMark.firstChild) {
          parent.insertBefore(newMark.firstChild, newMark)
        }
        parent.removeChild(newMark)

        // Restore caret position
        const range = document.createRange()
        if (firstChild) {
          range.setStart(firstChild, 0)
        } else {
          range.setStart(parent, 0)
        }
        range.collapse(true)
        sel2.removeAllRanges()
        sel2.addRange(range)
      }

      handleInput()
    })
  }, [handleInput])

  // Dismiss popover/tooltip on click outside
  useEffect(() => {
    if (!popoverPos && !markTooltip) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-goal-popover]') || target.closest('[data-goal-tooltip]')) return
      setPopoverPos(null)
      setPopoverMode('choices')
      setMarkTooltip(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popoverPos, markTooltip])

  // Handle text selection to show popover
  const handleMouseUp = useCallback(() => {
    if (!hasAnnotations) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) return

    const range = sel.getRangeAt(0)
    const editor = editorRef.current
    if (!editor || !editor.contains(range.commonAncestorContainer)) return

    // Don't show popover if selection is inside an existing mark
    let node: Node | null = range.commonAncestorContainer
    while (node && node !== editor) {
      if (node instanceof HTMLElement && node.tagName === 'MARK' && (node.dataset.goalId || node.dataset.tag)) return
      node = node.parentNode
    }

    const rect = range.getBoundingClientRect()
    const top = rect.bottom + 4
    const left = rect.left + rect.width / 2

    savedRange.current = range.cloneRange()
    setPopoverPos({ top, left })
    // If only one type available, skip the choices step
    if (hasGoals && !hasTags) setPopoverMode('goals')
    else if (hasTags && !hasGoals) setPopoverMode('tags')
    else setPopoverMode('choices')
    setMarkTooltip(null)
  }, [hasAnnotations, hasGoals, hasTags])

  // Wrap helpers
  const wrapWithMark = useCallback((markEl: HTMLElement) => {
    const range = savedRange.current
    if (!range || !editorRef.current) return

    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }

    try {
      range.surroundContents(markEl)
    } catch {
      const fragment = range.extractContents()
      markEl.appendChild(fragment)
      range.insertNode(markEl)
    }

    setPopoverPos(null)
    setPopoverMode('choices')
    savedRange.current = null
    handleInput()
  }, [handleInput])

  const wrapSelectionWithGoal = useCallback((milestone: { id: string; title: string; status: string }) => {
    const colors = getGoalColor(milestone.status)
    const mark = document.createElement('mark')
    mark.dataset.goalId = milestone.id
    mark.dataset.goalTitle = milestone.title
    mark.dataset.goalStatus = milestone.status
    mark.setAttribute('style',
      `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;`
    )
    wrapWithMark(mark)
  }, [wrapWithMark])

  const wrapSelectionWithTag = useCallback((noteType: { type: string; label: string }) => {
    const colors = getTagColor(noteType.type)
    const mark = document.createElement('mark')
    mark.dataset.tag = noteType.type
    mark.dataset.tagLabel = noteType.label
    mark.setAttribute('style',
      `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;`
    )
    wrapWithMark(mark)
  }, [wrapWithMark])

  const wrapSelectionWithVerbatim = useCallback(() => {
    if (!memberName) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const editor = editorRef.current
    if (!editor || !editor.contains(range.commonAncestorContainer)) return

    savedRange.current = range.cloneRange()
    const mark = document.createElement('mark')
    mark.dataset.verbatim = memberName
    mark.setAttribute('style',
      'background-color:#f0f9ff;border-left:3px solid #0ea5e9;padding:2px 6px;border-radius:4px;font-style:italic;'
    )
    wrapWithMark(mark)
    // Refocus editor so user can keep typing after wrapping
    editor.focus()
  }, [memberName, wrapWithMark])

  // Unlink a mark (unwrap to text)
  const unlinkMark = useCallback((markEl: HTMLElement) => {
    const parent = markEl.parentNode
    if (!parent) return
    while (markEl.firstChild) {
      parent.insertBefore(markEl.firstChild, markEl)
    }
    parent.removeChild(markEl)
    setMarkTooltip(null)
    handleInput()
  }, [handleInput])

  // Handle click on existing marks
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const goalMark = target.closest('mark[data-goal-id]') as HTMLElement | null
    const tagMark = target.closest('mark[data-tag]') as HTMLElement | null
    const verbatimMark = target.closest('mark[data-verbatim]') as HTMLElement | null
    const markEl = goalMark || tagMark || verbatimMark
    if (!markEl || !editorRef.current) return

    e.stopPropagation()
    const rect = markEl.getBoundingClientRect()

    setMarkTooltip({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
      markEl,
      kind: goalMark ? 'goal' : tagMark ? 'tag' : 'verbatim',
    })
    setPopoverPos(null)
    setPopoverMode('choices')
  }, [])

  // OCR
  const handleOCR = async (file: File) => {
    setExtracting(true)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) {
        toast.error(fr ? 'Format image invalide.' : 'Invalid image format.')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/members/${memberId}/notes/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64: match[2], mimeType: match[1], locale }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(res.status === 429
          ? (fr ? 'Trop de requêtes.' : 'Too many requests.')
          : (fr ? 'Une erreur est survenue.' : 'Something went wrong.'))
        return
      }

      if (!data.isNote) {
        toast.error(fr ? "Cette image ne semble pas contenir une note." : "This image doesn't appear to contain a note.")
        return
      }

      // Append extracted text
      if (editorRef.current) {
        const lines = (data.extractedText as string)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .split('\n')
          .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
          .join('')
        editorRef.current.innerHTML += lines
        handleInput()
      }
      toast.success(fr ? 'Texte extrait' : 'Text extracted')
      setTimeout(() => editorRef.current?.focus(), 100)
    } catch {
      toast.error(fr ? 'Une erreur est survenue.' : 'Something went wrong.')
    } finally {
      setExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const btn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  )

  // Popover content based on mode
  const renderPopoverContent = () => {
    if (popoverMode === 'choices') {
      return (
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
          {hasGoals && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPopoverMode('goals')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              {fr ? 'Objectif' : 'Goal'}
            </button>
          )}
          {hasTags && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPopoverMode('tags')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Tag className="w-3.5 h-3.5 text-violet-600" />
              {fr ? 'Étiquette' : 'Tag'}
            </button>
          )}
        </div>
      )
    }

    if (popoverMode === 'goals' && milestones?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[220px] max-h-[200px] overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {fr ? 'Objectifs' : 'Goals'}
          </div>
          {milestones.map((m) => {
            const colors = getGoalColor(m.status)
            return (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelectionWithGoal(m)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors.border }}
                />
                <span className="text-xs text-gray-700 truncate">{m.title}</span>
              </button>
            )
          })}
        </div>
      )
    }

    if (popoverMode === 'tags' && noteTypes?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] max-h-[200px] overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {fr ? 'Étiquettes' : 'Tags'}
          </div>
          {noteTypes.map((nt) => {
            const colors = getTagColor(nt.type)
            return (
              <button
                key={nt.type}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelectionWithTag(nt)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors.border }}
                />
                <span className="text-xs text-gray-700 truncate">{nt.label}</span>
              </button>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <>
      {/* Editable area */}
      <div className="p-3 pb-0">
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onMouseUp={handleMouseUp}
            onKeyDown={handleKeyDown}
            onClick={handleEditorClick}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none min-h-[150px] overflow-y-auto [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-2 [&_h1]:mb-0.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-2 [&_h2]:mb-0.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-2 [&_h3]:mb-0.5 [&_hr]:border-gray-200 [&_hr]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
          {isEmpty && (
            <div className="absolute top-2 left-3 text-sm text-gray-400 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>

      {/* Selection popover — portal to body */}
      {popoverPos && hasAnnotations && createPortal(
        <div
          data-goal-popover
          className="fixed z-50"
          style={{ top: popoverPos.top, left: popoverPos.left, transform: 'translateX(-50%)' }}
        >
          {renderPopoverContent()}
        </div>,
        document.body
      )}

      {/* Mark tooltip (edit mode) — portal to body */}
      {markTooltip && createPortal(
        <div
          data-goal-tooltip
          className="fixed z-50"
          style={{ top: markTooltip.top, left: markTooltip.left, transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg shadow-lg text-xs whitespace-nowrap">
            {markTooltip.kind === 'goal' ? (
              <Target className="w-3 h-3 text-emerald-400" />
            ) : markTooltip.kind === 'tag' ? (
              <Tag className="w-3 h-3 text-violet-400" />
            ) : (
              <Quote className="w-3 h-3 text-sky-400" />
            )}
            <span>
              {markTooltip.kind === 'goal'
                ? markTooltip.markEl.dataset.goalTitle
                : markTooltip.kind === 'tag'
                  ? markTooltip.markEl.dataset.tagLabel
                  : `${markTooltip.markEl.dataset.verbatim} ${fr ? 'a dit' : 'said'}`}
            </span>
            <div className="w-px h-3 bg-gray-600" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => unlinkMark(markTooltip.markEl)}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>{fr ? 'Retirer' : 'Remove'}</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-1.5 py-1 border-t border-gray-100 bg-gray-50/50 rounded-b-xl mt-1">
        {btn(<Bold className="w-3.5 h-3.5" />, fr ? 'Gras' : 'Bold', () => exec('bold'))}
        {/* Heading dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setHeadingOpen(!headingOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Type className="w-3.5 h-3.5" />
            <span>{fr ? 'Titre' : 'Heading'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {headingOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setHeadingOpen(false)} />
              <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                {([
                  { tag: 'h1', label: fr ? 'Grand titre' : 'Large heading', className: 'text-base font-bold' },
                  { tag: 'h2', label: fr ? 'Titre moyen' : 'Medium heading', className: 'text-sm font-semibold' },
                  { tag: 'h3', label: fr ? 'Petit titre' : 'Small heading', className: 'text-xs font-semibold' },
                  { tag: 'p', label: fr ? 'Texte normal' : 'Normal text', className: 'text-xs font-normal' },
                ] as const).map(({ tag, label, className }) => (
                  <button
                    key={tag}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('formatBlock', tag)
                      setHeadingOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className={`text-gray-700 ${className}`}>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {btn(<ListOrdered className="w-3.5 h-3.5" />, fr ? 'Numéros' : 'Numbers', () => exec('insertOrderedList'))}
        {btn(<Minus className="w-3.5 h-3.5" />, fr ? 'Séparateur' : 'Divider', () => exec('insertHorizontalRule'))}

        {memberName && (
          <>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={wrapSelectionWithVerbatim}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-sky-600 hover:text-sky-800 hover:bg-sky-50 transition-colors"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>&ldquo;{memberName} {fr ? 'a dit' : 'said'}&rdquo;</span>
            </button>
          </>
        )}

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
          <span>{extracting ? (fr ? 'Extraction...' : 'Scanning...') : (fr ? 'Scanner image' : 'Scan image')}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleOCR(file)
          }}
        />
      </div>
    </>
  )
}
