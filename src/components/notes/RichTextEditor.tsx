'use client'

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Italic, ChevronDown, List, ListOrdered, Minus, ScanLine, FileUp, Loader2, Type, Target, Tag, Quote, X, Eye, EyeOff, Undo2, Redo2, Lock, Plus, Pencil, Trash2, ImagePlus, ZoomIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

// Inline style colors for goal marks (hex so they persist in stored HTML)
const GOAL_COLORS: Record<string, { bg: string; border: string }> = {
  discovery: { bg: '#dbeafe', border: '#1e3a5f' },
  planned: { bg: '#dbeafe', border: '#1e3a5f' },
  building: { bg: '#dbeafe', border: '#1e3a5f' },
  in_progress: { bg: '#dbeafe', border: '#1e3a5f' },
  thriving: { bg: '#dbeafe', border: '#1e3a5f' },
  achieved: { bg: '#dbeafe', border: '#1e3a5f' },
  independent: { bg: '#dbeafe', border: '#1e3a5f' },
}
const DEFAULT_GOAL_COLOR = { bg: '#dbeafe', border: '#1e3a5f' }

function getGoalColor(status: string) {
  return GOAL_COLORS[status] || DEFAULT_GOAL_COLOR
}

// 10 unique colors — evenly spaced hues, no two neighbors look alike
const TAG_COLOR_PALETTE: { bg: string; border: string }[] = [
  { bg: '#fef2f2', border: '#ef4444' },  // 0 red
  { bg: '#eff6ff', border: '#3b82f6' },  // 1 blue
  { bg: '#fff7ed', border: '#f97316' },  // 2 orange
  { bg: '#f5f3ff', border: '#A88AE1' },  // 3 violet
  { bg: '#fef9c3', border: '#ca8a04' },  // 4 gold
  { bg: '#fdf2f8', border: '#ec4899' },  // 5 pink
  { bg: '#ecfdf5', border: '#10b981' },  // 6 emerald
  { bg: '#eef2ff', border: '#6366f1' },  // 7 indigo
  { bg: '#ecfeff', border: '#06b6d4' },  // 8 cyan
  { bg: '#faf5ff', border: '#a21caf' },  // 9 fuchsia
]

function getTagColor(type: string, allTypes?: string[]) {
  if (allTypes) {
    const idx = allTypes.indexOf(type)
    if (idx >= 0) return TAG_COLOR_PALETTE[idx % TAG_COLOR_PALETTE.length]
  }
  return TAG_COLOR_PALETTE[TAG_COLOR_PALETTE.length - 1]
}

const GOAL_NAVY = '#1e3a5f'
const GOAL_BG = '#dbeafe'
const OLD_GOAL_COLORS = ['#059669','#047857','#065f46','#6d28d9','#2563eb','#d1fae5','#a7f3d0','#6ee7b7','#ede9fe']

/** Hoist mid-sentence tag labels to start of their parent block */
// No label hoisting needed — ::before CSS handles labels inline for all marks

/** Get clean innerHTML for saving — strips hoisted labels and empty marks */
function getCleanHtml(el: HTMLElement): string {
  // Clone so we never modify the live DOM (preserves cursor position)
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-hoisted-label]').forEach(n => n.remove())
  clone.querySelectorAll('.label-hoisted').forEach(n => n.classList.remove('label-hoisted'))
  clone.querySelectorAll('mark[data-tag], mark[data-goal-id], mark[data-verbatim]').forEach(mark => {
    const text = mark.textContent?.replace(/\u200B/g, '').replace(/\u00A0/g, '').trim()
    if (!text) mark.parentNode?.removeChild(mark)
  })
  // Remove verbatim "mention" marks (the member name prefix) — keep only the "said" marks
  clone.querySelectorAll('mark[data-verbatim-type="mention"]').forEach(mark => {
    mark.parentNode?.removeChild(mark)
  })
  return clone.innerHTML
}

/** Inject --tag-color and --tag-bg + recolor old goal greens to navy + rewrite tag colors to palette */
function injectTagColors(html: string, allTypes?: string[]): string {
  let result = html.replace(/<mark\b([^>]*)\bstyle="([^"]*)"([^>]*)>/gi, (full, before: string, style: string, after: string) => {
    // Rewrite tag colors to current palette
    const tagMatch = (before + after).match(/data-tag="([^"]*)"/)
    if (tagMatch && allTypes) {
      const tagType = tagMatch[1]
      const colors = getTagColor(tagType, allTypes)
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
  // Recolor goal sections + headers + marks from old greens to navy
  result = result.replace(/(<div[^>]*data-goal-section(?!-)[^>]*style=")([^"]*)(")/gi, (_f, pre, style, post) => {
    let s = style; for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY); return pre + s + post
  })
  result = result.replace(/(<div[^>]*data-goal-section-header[^>]*style=")([^"]*)(")/gi, (_f, pre, style, post) => {
    let s = style; for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY)
    s = s.replace(/font-size:\s*13px/, 'font-size:16px').replace(/font-weight:\s*600/, 'font-weight:700'); return pre + s + post
  })
  result = result.replace(/(<mark[^>]*data-goal-id[^>]*style=")([^"]*)(")/gi, (_f, pre, style, post) => {
    let s = style; for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY)
    s = s.replace(/background-color:\s*#[0-9a-fA-F]{3,8}/, `background-color:${GOAL_BG}`); return pre + s + post
  })
  return result
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
  /** Types that cannot be removed (shown with lock icon) */
  lockedTypes?: string[]
  /** Called when user adds a custom type from the tag sidebar */
  onAddType?: (typeName: string) => void
  /** Called when user renames a custom type */
  onRenameType?: (oldName: string, newName: string) => void
  /** Called when user deletes a custom type. reassignTo = target tag for existing notes (e.g. 'general') */
  onDeleteType?: (typeName: string, reassignTo: string) => void
  /** Returns how many notes use a given tag type */
  getTagNoteCount?: (typeName: string) => number
  /** Max number of tags allowed (default 10) */
  maxTypes?: number
  memberName?: string
  onAutoSave?: (html: string) => void | Promise<void>
  autoSaveDelay?: number
  toolbarActions?: React.ReactNode
  /** Image attachments for the note (stored separately from note content) */
  attachments?: { url: string; filename: string; size: number }[]
  onAttachmentsChange?: (attachments: { url: string; filename: string; size: number }[]) => void
  /** Supabase storage path prefix for uploads (e.g. practitionerId/memberId/sessionId) */
  attachmentStoragePath?: string
  compact?: boolean
  onSubmit?: () => void
  /** Called when user inserts an inline @tag — receives the tag type string */
  onTagInsert?: (tagType: string) => void
  /** When parent changes the note type while a tag annotation is active, update the mark */
  activeTagType?: string
}

export function RichTextEditor({ value, onChange, placeholder, memberId, locale, autoFocus, milestones, noteTypes, memberName, onAutoSave, autoSaveDelay = 2000, toolbarActions, compact, onSubmit, lockedTypes, onAddType, onRenameType, onDeleteType, getTagNoteCount, maxTypes = 7, onTagInsert, activeTagType, attachments = [], onAttachmentsChange, attachmentStoragePath }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textFileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value)
  const [headingOpen, setHeadingOpen] = useState(false)
  const [sideMenu, setSideMenu] = useState<'tags' | 'goals' | null>(null)
  const [sideMenuPos, setSideMenuPos] = useState<{ top: number; left: number } | null>(null)
  const sideMenuRef = useRef<HTMLDivElement>(null)
  const [activeGoal, setActiveGoal] = useState<{ id: string; title: string; status: string } | null>(null)
  const [activeTag, setActiveTag] = useState<{ type: string; label: string } | null>(null)
  const [activeVerbatim, setActiveVerbatim] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Image attachment upload handler
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !onAttachmentsChange || !attachmentStoragePath) return
    const MAX_IMAGES = 5
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const currentCount = attachments.length
    const remaining = MAX_IMAGES - currentCount
    if (remaining <= 0) {
      toast.error(fr ? 'Maximum 5 images atteint' : 'Maximum 5 images reached')
      return
    }
    const toUpload = Array.from(files).slice(0, remaining)
    setUploadingImage(true)
    const newAttachments = [...attachments]
    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_SIZE) {
        toast.error(fr ? `${file.name} est trop volumineux (max 5 Mo)` : `${file.name} is too large (max 5MB)`)
        continue
      }
      const sanitized = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
      const path = `${attachmentStoragePath}/${Date.now()}-${sanitized}`
      const { error } = await supabase.storage.from('session-notes-attachments').upload(path, file)
      if (error) {
        toast.error(fr ? `Impossible de télécharger ${file.name}` : `Failed to upload ${file.name}`)
        continue
      }
      const { data: urlData } = supabase.storage.from('session-notes-attachments').getPublicUrl(path)
      newAttachments.push({ url: urlData.publicUrl, filename: file.name, size: file.size })
    }
    onAttachmentsChange(newAttachments)
    setUploadingImage(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleRemoveAttachment = (index: number) => {
    if (!onAttachmentsChange) return
    const updated = attachments.filter((_, i) => i !== index)
    onAttachmentsChange(updated)
  }
  const initialized = useRef(false)
  const fr = locale === 'fr'
  const es = locale === 'es'

  // Tag management state
  const [tagEditMode, setTagEditMode] = useState(false)
  const [renamingTag, setRenamingTag] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null)
  const [deleteReassignTo, setDeleteReassignTo] = useState('general')

  // P2 — Inline trigger state
  const [inlineTrigger, setInlineTrigger] = useState<{
    type: 'tag' | 'goal' | 'end-tag' | 'end-goal' | 'verbatim' | 'end-verbatim'
    query: string
    position: { top: number; left: number }
    source?: string // which character triggered it (e.g. '/' vs '>')
  } | null>(null)
  const [inlineHighlight, setInlineHighlight] = useState(0)
  const inlineDropdownRef = useRef<HTMLDivElement>(null)

  // Reposition inline dropdown after render using current caret position
  useLayoutEffect(() => {
    if (!inlineTrigger || !inlineDropdownRef.current || !editorRef.current) return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    // Only reposition if selection is within our editor
    if (!editorRef.current.contains(sel.anchorNode)) return
    const range = sel.getRangeAt(0)
    let rect = range.getBoundingClientRect()
    // Collapsed ranges can return {0,0} — use temp span fallback
    if (rect.top === 0 && rect.left === 0 && rect.width === 0) {
      const span = document.createElement('span')
      span.textContent = '\u200B'
      const cloned = range.cloneRange()
      cloned.collapse(false)
      cloned.insertNode(span)
      rect = span.getBoundingClientRect()
      span.parentNode?.removeChild(span)
    }
    if (rect.top > 0 || rect.left > 0) {
      const el = inlineDropdownRef.current
      const dropdownHeight = el.offsetHeight || 380
      const spaceBelow = window.innerHeight - rect.bottom
      el.style.top = spaceBelow < dropdownHeight
        ? `${rect.top - dropdownHeight - 4}px`
        : `${rect.bottom + 4}px`
      el.style.left = `${rect.left}px`
    }
  })

  // Tagging state
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; flipped?: boolean } | null>(null)
  const [popoverMode, setPopoverMode] = useState<PopoverMode>('tags')
  const [markTooltip, setMarkTooltip] = useState<{ top: number; left: number; markEl: HTMLElement; kind: 'goal' | 'tag' | 'verbatim' } | null>(null)
  const [hoverTooltip, setHoverTooltip] = useState<{ top: number; left: number; label: string; kind: 'goal' | 'tag' | 'verbatim' } | null>(null)
  const savedRange = useRef<Range | null>(null)

  // Floating selection toolbar
  const [selectionToolbar, setSelectionToolbar] = useState<{ top: number; left: number } | null>(null)
  const selectionToolbarRef = useRef<HTMLDivElement>(null)

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedHtml = useRef(value)

  const hasGoals = !!milestones?.length
  const hasTags = !!noteTypes?.length
  const hasAnnotations = hasGoals || hasTags
  const allTagTypes = noteTypes?.map(nt => nt.type) || []

  // Set initial content once
  const baselineHtml = useRef('')
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value ? injectTagColors(value, allTagTypes) : ''
      initialized.current = true
      // Strip hoisted labels that leaked into saved HTML
      editorRef.current.querySelectorAll('[data-hoisted-label]').forEach(n => n.remove())
      // Remove empty marks (marks with no text content — just zero-width spaces)
      editorRef.current.querySelectorAll('mark[data-tag], mark[data-goal-id], mark[data-verbatim]').forEach(mark => {
        const text = mark.textContent?.replace(/\u200B/g, '').replace(/\u00A0/g, '').trim()
        if (!text) mark.parentNode?.removeChild(mark)
      })
      // Sync cleaned HTML to parent so saving without edits writes clean content
      const cleanedInit = editorRef.current.innerHTML
      if (value && cleanedInit !== value) {
        onChange(cleanedInit)
      }
      baselineHtml.current = cleanedInit
      setIsEmpty(!value)
      if (autoFocus) {
        requestAnimationFrame(() => editorRef.current?.focus())
      }
    }
  }, [value, autoFocus])

  // Reset editor when value is cleared externally (e.g. after submit)
  useEffect(() => {
    if (initialized.current && editorRef.current && !value) {
      const currentText = editorRef.current.textContent || ''
      if (currentText.trim()) {
        editorRef.current.innerHTML = ''
        baselineHtml.current = ''
        setIsEmpty(true)
      }
    }
  }, [value])

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [])

  // When parent changes the note type: update active mark OR start annotation if editor is empty
  useEffect(() => {
    if (activeTagType === undefined) return
    const editor = editorRef.current
    if (!editor) return
    // Case 0: Tag deselected while annotating → end the annotation
    if (!activeTagType && activeTag) {
      const marks = editor.querySelectorAll(`mark[data-tag="${activeTag.type}"]`)
      const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
      setActiveTag(null)
      if (mark) {
        // Clean zero-width spaces
        const walker = document.createTreeWalker(mark, NodeFilter.SHOW_TEXT)
        let tn: Node | null
        while ((tn = walker.nextNode())) {
          if (tn.textContent) tn.textContent = tn.textContent.replace(/\u200B/g, '')
        }
        if (!mark.textContent?.trim()) {
          mark.parentNode?.removeChild(mark)
        } else {
          const spacer = document.createTextNode('\u00A0')
          if (mark.nextSibling) {
            mark.parentNode?.insertBefore(spacer, mark.nextSibling)
          } else {
            mark.parentNode?.appendChild(spacer)
          }
          const sel = window.getSelection()
          if (sel) {
            const r = document.createRange()
            r.setStart(spacer, spacer.length)
            r.collapse(true)
            sel.removeAllRanges()
            sel.addRange(r)
          }
        }
        onChange(getCleanHtml(editor))
      }
      return
    }

    const newNoteType = noteTypes?.find(nt => nt.type === activeTagType)

    // Case 1: Active tag exists but type changed → update the existing mark
    if (activeTag && activeTag.type !== activeTagType && newNoteType) {
      const marks = editor.querySelectorAll(`mark[data-tag="${activeTag.type}"]`)
      const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
      if (mark) {
        const colors = getTagColor(newNoteType.type, allTagTypes)
        mark.dataset.tag = newNoteType.type
        mark.dataset.tagLabel = newNoteType.label
        mark.setAttribute('style',
          `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;--tag-color:${colors.border};--tag-bg:${colors.bg};`
        )
        onChange(getCleanHtml(editor))
      }
      setActiveTag(newNoteType)
      return
    }

    // Case 2: No active tag, editor empty, non-default type → auto-start annotation
    if (!activeTag && newNoteType) {
      const text = editor.textContent || ''
      if (!text.trim()) {
        editor.focus()
        // Ensure cursor is inside the editor
        const sel = window.getSelection()
        if (!sel || !sel.rangeCount) {
          const range = document.createRange()
          range.selectNodeContents(editor)
          range.collapse(false)
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
        const range = sel!.getRangeAt(0)
        const colors = getTagColor(newNoteType.type, allTagTypes)
        const mark = document.createElement('mark')
        mark.dataset.tag = newNoteType.type
        mark.dataset.tagLabel = newNoteType.label
        mark.setAttribute('style',
          `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;--tag-color:${colors.border};--tag-bg:${colors.bg};`
        )
        mark.appendChild(document.createTextNode('\u200B'))
        // Clear any existing content and insert the mark
        editor.innerHTML = ''
        editor.appendChild(mark)
        const newRange = document.createRange()
        const lastChild = mark.lastChild || mark
        if (lastChild.nodeType === Node.TEXT_NODE) {
          newRange.setStart(lastChild, lastChild.textContent?.length || 0)
        } else {
          newRange.selectNodeContents(mark)
          newRange.collapse(false)
        }
        newRange.collapse(true)
        sel!.removeAllRanges()
        sel!.addRange(newRange)
        setActiveTag(newNoteType)
        setIsEmpty(false)
        onChange(getCleanHtml(editor))
      }
    }
  }, [activeTagType])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    const html = getCleanHtml(editorRef.current)
    const text = editorRef.current.textContent || ''
    setIsEmpty(!text.trim() && html !== '<hr>')
    onChange(html)

    // Autosave — debounce
    if (onAutoSave && html !== lastSavedHtml.current) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      setSaveStatus('idle')
      autoSaveTimer.current = setTimeout(async () => {
        // Re-check: content may have been saved manually while we waited
        if (html === lastSavedHtml.current) return
        setSaveStatus('saving')
        try {
          await onAutoSave(html)
          lastSavedHtml.current = html
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000)
        } catch {
          setSaveStatus('idle')
        }
      }, autoSaveDelay)
    }

    // Sync activeGoal from DOM cursor position
    {
      const syncSel = window.getSelection()
      if (syncSel && syncSel.rangeCount) {
        let n: Node | null = syncSel.anchorNode
        let foundSection: HTMLElement | null = null
        while (n && n !== editorRef.current) {
          if (n instanceof HTMLElement && n.hasAttribute('data-goal-section')) {
            foundSection = n
            break
          }
          n = n.parentNode
        }
        if (foundSection) {
          const id = foundSection.dataset.goalId || ''
          const title = foundSection.dataset.goalTitle || ''
          const status = foundSection.dataset.goalStatus || ''
          if (!activeGoal || activeGoal.id !== id) {
            setActiveGoal({ id, title, status })
          }
        } else {
          if (activeGoal) setActiveGoal(null)
        }
      }
    }

    // P2 — Detect inline triggers (# or @)
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !sel.isCollapsed) {
      if (inlineTrigger) setInlineTrigger(null)
      return
    }
    const anchor = sel.anchorNode
    if (!anchor || anchor.nodeType !== Node.TEXT_NODE) {
      if (inlineTrigger) setInlineTrigger(null)
      return
    }
    const textContent = anchor.textContent || ''
    const offset = sel.anchorOffset
    const before = textContent.slice(0, offset)

    // Walk backwards to find #, @, >, or /
    const hashIdx = before.lastIndexOf('#')
    const atIdx = before.lastIndexOf('@')
    const gtIdx = before.lastIndexOf('>')
    const slashIdx = before.lastIndexOf('/')
    const triggerIdx = Math.max(hashIdx, atIdx, gtIdx, slashIdx)
    // Note: / is handled as a direct action (no dropdown), while > shows the dropdown

    if (triggerIdx >= 0) {
      const triggerChar = before[triggerIdx]
      // Must be preceded by whitespace or be at start of text
      if (triggerIdx === 0 || /\s/.test(before[triggerIdx - 1])) {
        const query = before.slice(triggerIdx + 1)
        // No spaces in query (single-word trigger)
        if (!/\s/.test(query)) {
          const range = sel.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          const spaceBelow = window.innerHeight - rect.bottom
          const dropdownHeight = 380 // approximate max height
          const pos = spaceBelow < dropdownHeight
            ? { top: rect.top - dropdownHeight - 4, left: rect.left }
            : { top: rect.bottom + 4, left: rect.left }

          if (triggerChar === '@') {
            if (activeTag) {
              setInlineTrigger({ type: 'end-tag', query, position: pos })
              setInlineHighlight(0)
              return
            }
            if (hasTags) {
              setInlineTrigger({ type: 'tag', query, position: pos })
              setInlineHighlight(0)
              return
            }
          }

          if (triggerChar === '>' && memberName) {
            if (activeVerbatim) {
              setInlineTrigger({ type: 'end-verbatim', query, position: pos })
              setInlineHighlight(0)
              return
            }
            setInlineTrigger({ type: 'verbatim', query, position: pos })
            setInlineHighlight(0)
            return
          }

          // / shortcut: show quote dropdown (only "Name said", no mention)
          if (triggerChar === '/' && memberName && !query) {
            if (activeVerbatim) {
              setInlineTrigger({ type: 'end-verbatim', query, position: pos, source: '/' })
              setInlineHighlight(0)
              return
            }
            setInlineTrigger({ type: 'verbatim', query, position: pos, source: '/' })
            setInlineHighlight(0) // Only one option, so index 0
            return
          }
        }
      }
    }
    setInlineTrigger(null)
  }, [onChange, hasGoals, hasTags, activeGoal, activeTag, activeVerbatim, onAutoSave, autoSaveDelay, memberName])

  const exec = useCallback((command: string, val?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()

    if (command === 'undo' || command === 'redo') {
      // Cancel any pending autosave so it doesn't save stale content
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = null
      }
      // Clear active annotation states — undo may remove the mark they reference
      setActiveTag(null)
      setActiveGoal(null)
      setActiveVerbatim(false)
      setInlineTrigger(null)

      const before = editor.innerHTML
      document.execCommand(command, false)
      const after = editor.innerHTML
      // Only block undo if: editor became empty AND baseline had content (went past initial state)
      if (command === 'undo' && !after.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').trim()) {
        const baselineHad = baselineHtml.current.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, '').trim()
        if (baselineHad) {
          document.execCommand('redo', false)
          return
        }
      }
      // Update state without triggering autosave
      if (after !== before) {
        const text = editor.textContent || ''
        setIsEmpty(!text.trim() && after !== '<hr>')
        onChange(after)
      }
      return
    }

    document.execCommand(command, false, val)
    handleInput()
  }, [handleInput, onChange])

  // P2 — Get filtered items for inline trigger
  const getFilteredInlineItems = useCallback(() => {
    if (!inlineTrigger) return []
    const q = inlineTrigger.query.toLowerCase()
    if (inlineTrigger.type === 'tag' && noteTypes?.length) {
      return noteTypes.filter(nt => nt.label.toLowerCase().includes(q)).slice(0, 10)
    }
    if (inlineTrigger.type === 'goal' && milestones?.length) {
      return milestones.filter(m => m.title.toLowerCase().includes(q)).slice(0, 10)
    }
    return []
  }, [inlineTrigger, noteTypes, milestones])

  // Delete the inline trigger text (@query or #query) from the DOM
  const deleteTriggerText = useCallback(() => {
    if (!inlineTrigger) return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const anchor = sel.anchorNode
    if (!anchor || anchor.nodeType !== Node.TEXT_NODE) return
    const text = anchor.textContent || ''
    const offset = sel.anchorOffset
    const before = text.slice(0, offset)
    // For verbatim triggers, detect which character was actually used (> or /)
    const verbatimTriggerChar = (() => {
      if (inlineTrigger.type !== 'verbatim' && inlineTrigger.type !== 'end-verbatim') return '>'
      const sel2 = window.getSelection()
      if (!sel2 || !sel2.anchorNode) return '>'
      const txt = sel2.anchorNode.textContent || ''
      const off = sel2.anchorOffset
      const bef = txt.slice(0, off)
      const si = bef.lastIndexOf('/')
      const gi = bef.lastIndexOf('>')
      return si > gi ? '/' : '>'
    })()
    const triggerChar = (inlineTrigger.type === 'end-goal' || inlineTrigger.type === 'goal') ? '#'
      : (inlineTrigger.type === 'verbatim' || inlineTrigger.type === 'end-verbatim') ? verbatimTriggerChar
      : '@'
    const triggerIdx = before.lastIndexOf(triggerChar)
    if (triggerIdx < 0) return
    // Select the trigger text and delete via execCommand so it's undoable
    const range = document.createRange()
    range.setStart(anchor, triggerIdx)
    range.setEnd(anchor, offset)
    sel.removeAllRanges()
    sel.addRange(range)
    document.execCommand('delete', false)
  }, [inlineTrigger])

  // Start goal annotation mode — insert section at cursor, wrapping selected text if any
  const startGoalAnnotation = useCallback((milestone: { id: string; title: string; status: string }) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const hasSelection = !sel.isCollapsed && editor.contains(range.commonAncestorContainer)

    const colors = getGoalColor(milestone.status)

    if (hasSelection) {
      // Extract selected content, wrap it inside the goal section
      const fragment = range.extractContents()
      const section = document.createElement('div')
      section.dataset.goalSection = ''
      section.dataset.goalId = milestone.id
      section.dataset.goalTitle = milestone.title
      section.dataset.goalStatus = milestone.status
      section.setAttribute('style', `margin:16px 0 8px;border-left:3px solid ${colors.border};padding:0 0 4px 16px;`)

      const header = document.createElement('div')
      header.contentEditable = 'false'
      header.dataset.goalSectionHeader = ''
      header.setAttribute('style', `font-size:16px;font-weight:700;color:${colors.border};padding:8px 0;user-select:none;`)
      header.textContent = `\u25CF ${milestone.title}`
      section.appendChild(header)

      // Wrap fragment nodes in <p> if they're bare text
      const wrapper = document.createElement('div')
      wrapper.appendChild(fragment)
      if (wrapper.childNodes.length > 0) {
        Array.from(wrapper.childNodes).forEach(child => {
          section.appendChild(child)
        })
      } else {
        const p = document.createElement('p')
        p.appendChild(document.createElement('br'))
        section.appendChild(p)
      }

      range.insertNode(section)

      // Add trailing <p> after section
      const trailingP = document.createElement('p')
      trailingP.appendChild(document.createElement('br'))
      section.parentNode?.insertBefore(trailingP, section.nextSibling)

      // Place cursor at end of content inside the section
      const lastChild = section.lastChild
      if (lastChild) {
        const newRange = document.createRange()
        newRange.selectNodeContents(lastChild)
        newRange.collapse(false)
        sel.removeAllRanges()
        sel.addRange(newRange)
      }
    } else {
      // No selection — insert empty section after current block
      let blockNode: Node | null = sel.anchorNode
      while (blockNode && blockNode !== editor && blockNode.parentNode !== editor) {
        blockNode = blockNode.parentNode
      }
      if (blockNode && blockNode !== editor) {
        range.setStartAfter(blockNode)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }

      const sectionHTML =
        `<div data-goal-section="" data-goal-id="${milestone.id}" data-goal-title="${milestone.title.replace(/"/g, '&quot;')}" data-goal-status="${milestone.status}" style="margin:16px 0 8px;border-left:3px solid ${colors.border};padding:0 0 4px 16px;">` +
        `<div contenteditable="false" data-goal-section-header="" style="font-size:16px;font-weight:700;color:${colors.border};padding:8px 0;user-select:none;">\u25CF ${milestone.title}</div>` +
        `<p><br></p>` +
        `</div>` +
        `<p><br></p>`

      document.execCommand('insertHTML', false, sectionHTML)

      const section = editor.querySelector(`div[data-goal-section][data-goal-id="${milestone.id}"]`) as HTMLElement | null
      if (section) {
        const contentP = section.querySelector('p')
        if (contentP) {
          const newRange = document.createRange()
          newRange.setStart(contentP, 0)
          newRange.collapse(true)
          sel.removeAllRanges()
          sel.addRange(newRange)
        }
      }
    }

    setActiveGoal(milestone)
    setSideMenu(null)
    handleInput()
  }, [handleInput])

  // End goal annotation — move cursor out of section
  const endGoalAnnotation = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !activeGoal) { setActiveGoal(null); return }

    const section = editor.querySelector(`div[data-goal-section][data-goal-id="${activeGoal.id}"]`) as HTMLElement | null
    setActiveGoal(null)

    if (section) {
      // Ensure a <p><br></p> exists after the section
      let nextEl = section.nextElementSibling
      if (!nextEl || nextEl.tagName !== 'P') {
        const trailingP = document.createElement('p')
        trailingP.appendChild(document.createElement('br'))
        section.parentNode?.insertBefore(trailingP, section.nextSibling)
        nextEl = trailingP
      }
      // Move cursor to the paragraph after the section
      editor.focus()
      const sel = window.getSelection()
      if (sel && nextEl) {
        const range = document.createRange()
        range.setStart(nextEl, 0)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    handleInput()
  }, [handleInput, activeGoal])

  // P2 — Insert inline trigger mark
  const insertInlineMark = useCallback((item: { type: 'tag'; data: { type: string; label: string } } | { type: 'goal'; data: { id: string; title: string; status: string } }) => {
    const editor = editorRef.current
    if (!editor || !inlineTrigger) return

    // For goals: delete trigger text and create a section
    if (item.type === 'goal') {
      deleteTriggerText()
      startGoalAnnotation(item.data)
      setInlineTrigger(null)
      setInlineHighlight(0)
      return
    }

    // Tag path
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return

    const anchor = sel.anchorNode
    if (!anchor || anchor.nodeType !== Node.TEXT_NODE) return

    const textContent = anchor.textContent || ''
    const offset = sel.anchorOffset
    const before = textContent.slice(0, offset)
    const triggerIdx = before.lastIndexOf('@')

    if (triggerIdx < 0) return

    // Select the trigger text (@query) and replace via execCommand so it's undoable
    const range = document.createRange()
    range.setStart(anchor, triggerIdx)
    range.setEnd(anchor, offset)
    sel.removeAllRanges()
    sel.addRange(range)

    const colors = getTagColor(item.data.type, allTagTypes)
    const markHTML =
      `<mark data-tag="${item.data.type}" data-tag-label="${item.data.label.replace(/"/g, '&quot;')}" style="background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;--tag-color:${colors.border};--tag-bg:${colors.bg};">\u200B</mark>`

    document.execCommand('insertHTML', false, markHTML)

    // Place cursor inside the mark for annotation mode
    if (editor) {
      const marks = editor.querySelectorAll(`mark[data-tag="${item.data.type}"]`)
      const mark = marks[marks.length - 1]
      if (mark) {
        const newRange = document.createRange()
        const lastChild = mark.lastChild || mark
        if (lastChild.nodeType === Node.TEXT_NODE) {
          newRange.setStart(lastChild, lastChild.textContent?.length || 0)
        } else {
          newRange.selectNodeContents(mark)
          newRange.collapse(false)
        }
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
      }
    }

    setActiveTag(item.data)
    onTagInsert?.(item.data.type)
    setInlineTrigger(null)
    setInlineHighlight(0)
    handleInput()
  }, [inlineTrigger, handleInput, deleteTriggerText, startGoalAnnotation, onTagInsert])

  // Shared helper: clean up a mark, move cursor out of it
  const finishMark = useCallback((mark: HTMLElement) => {
    const editor = editorRef.current
    if (!editor) return
    // Clean zero-width spaces
    const walker = document.createTreeWalker(mark, NodeFilter.SHOW_TEXT)
    let tn: Node | null
    while ((tn = walker.nextNode())) {
      if (tn.textContent) tn.textContent = tn.textContent.replace(/\u200B/g, '')
    }
    if (!mark.textContent?.trim()) {
      mark.parentNode?.removeChild(mark)
      editor.focus()
    } else {
      // Insert a real text node with a space AFTER the mark, place cursor in it
      const spacer = document.createTextNode('\u00A0')
      if (mark.nextSibling) {
        mark.parentNode!.insertBefore(spacer, mark.nextSibling)
      } else {
        mark.parentNode!.appendChild(spacer)
      }
      editor.focus()
      const sel = window.getSelection()
      if (sel) {
        const range = document.createRange()
        range.setStart(spacer, spacer.length)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    handleInput()
  }, [handleInput])

  // Paste handler — keep pasted text inside active <mark> tag
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const editor = editorRef.current
    if (!editor) return

    // Check if cursor is inside a mark element (even without activeTag/activeVerbatim)
    const sel = window.getSelection()
    const isInsideMark = (() => {
      if (!sel || !sel.rangeCount) return false
      let node: Node | null = sel.anchorNode
      while (node && node !== editor) {
        if (node instanceof HTMLElement && node.tagName === 'MARK') return true
        node = node.parentNode
      }
      return false
    })()

    // Force plain-text paste if inside an active annotation OR any mark element
    if (activeTag || activeVerbatim || isInsideMark) {
      e.preventDefault()
      // Strip newlines when pasting inside a mark to prevent breaking block structure
      const text = e.clipboardData.getData('text/plain').replace(/\r?\n/g, ' ')
      if (!text) return

      if (!sel || !sel.rangeCount) return

      if (isInsideMark) {
        // Insert as plain text within the mark
        const range = sel.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      } else {
        // Cursor not in a mark — insert plain text normally
        document.execCommand('insertText', false, text)
      }

      handleInput()
    }
    // If no active annotation and not inside a mark, let the browser handle paste normally
  }, [activeTag, activeVerbatim, handleInput])

  // Break out of <mark> on Enter — let browser handle Enter, then unwrap
  // the mark that gets carried into the new line (skip if in active annotation mode)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Compact mode: Enter (without Shift) submits, Shift+Enter inserts newline
    if (compact && onSubmit && e.key === 'Enter' && !e.shiftKey && !activeGoal && !activeTag && !activeVerbatim && !inlineTrigger) {
      e.preventDefault()
      // Flush current content to parent state before submitting (Firefox may not have fired onInput yet)
      if (editorRef.current) {
        onChange(getCleanHtml(editorRef.current))
      }
      // Use setTimeout to let React process the state update before submit reads it
      setTimeout(() => onSubmit(), 0)
      return
    }

    // Backspace at the start of a line right after a verbatim quote: prevent merging into the quote
    if (e.key === 'Backspace' && !activeVerbatim && !activeTag && !activeGoal && !inlineTrigger) {
      const sel = window.getSelection()
      if (sel && sel.isCollapsed && sel.rangeCount) {
        const range = sel.getRangeAt(0)
        // Only intercept when cursor is at position 0 (start of text node or element)
        if (range.startOffset === 0) {
          const node = range.startContainer
          const block = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement)
          // Check if the previous sibling (or parent's previous sibling) is a verbatim mark
          const prevEl = block?.previousElementSibling || block?.parentElement?.previousElementSibling
          if (prevEl?.matches?.('mark[data-verbatim]')) {
            e.preventDefault()
            // Just delete the current empty block if it's empty, otherwise do nothing
            if (block && !block.textContent?.trim()) {
              block.parentElement?.removeChild(block)
              // Move cursor to end of the mark (without entering it)
              const p = document.createElement('p')
              p.appendChild(document.createElement('br'))
              prevEl.after(p)
              const newRange = document.createRange()
              newRange.setStart(p, 0)
              newRange.collapse(true)
              sel.removeAllRanges()
              sel.addRange(newRange)
              handleInput()
            }
            return
          }
        }
      }
    }

    // Delete (forward) at the end of a line right before a verbatim quote: prevent merging quote into current line
    if (e.key === 'Delete' && !activeVerbatim && !activeTag && !activeGoal && !inlineTrigger) {
      const sel = window.getSelection()
      if (sel && sel.isCollapsed && sel.rangeCount) {
        const range = sel.getRangeAt(0)
        const node = range.startContainer
        const block = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement)
        // Check if cursor is at the end of the text
        const atEnd = node.nodeType === Node.TEXT_NODE
          ? range.startOffset === (node.textContent?.length || 0)
          : range.startOffset === (node as HTMLElement).childNodes.length
        if (atEnd) {
          const nextEl = block?.nextElementSibling || block?.parentElement?.nextElementSibling
          if (nextEl?.matches?.('mark[data-verbatim]')) {
            e.preventDefault()
            return
          }
        }
      }
    }

    // Enter inside a verbatim quote block (non-active mode): exit the quote and create a new line below
    if (e.key === 'Enter' && !e.shiftKey && !activeVerbatim && !activeTag && !activeGoal && !inlineTrigger) {
      const sel = window.getSelection()
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0)
        const node = range.startContainer
        const markEl = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement)?.closest?.('mark[data-verbatim]')
        if (markEl && editorRef.current?.contains(markEl)) {
          e.preventDefault()
          const p = document.createElement('p')
          p.appendChild(document.createElement('br'))
          markEl.after(p)
          const newRange = document.createRange()
          newRange.setStart(p, 0)
          newRange.collapse(true)
          sel.removeAllRanges()
          sel.addRange(newRange)
          handleInput()
          return
        }
      }
    }

    // Enter or Escape ends the innermost active annotation the cursor is in
    // Skip if an inline trigger dropdown is open — let the trigger handler below handle it
    if ((e.key === 'Enter' || e.key === 'Escape') && (activeGoal || activeTag || activeVerbatim) && !inlineTrigger) {
      const editor = editorRef.current
      if (!editor) return

      // If a verbatim "said" annotation is active, end it first (innermost)
      if (activeVerbatim) {
        e.preventDefault()
        setActiveVerbatim(false)
        const marks = editor.querySelectorAll('mark[data-verbatim-type="said"]')
        const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
        if (mark) finishMark(mark)
        else handleInput()
        return
      }

      // If a tag annotation is active, end it first (innermost annotation)
      if (activeTag) {
        e.preventDefault()
        setActiveTag(null)
        const marks = editor.querySelectorAll(`mark[data-tag="${activeTag.type}"]`)
        const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
        if (mark) finishMark(mark)
        else handleInput()
        return
      }

      // Goal section: only Escape exits the section
      if (activeGoal) {
        if (e.key === 'Escape') {
          e.preventDefault()
          endGoalAnnotation()
          return
        }
        // Enter: let browser handle it (new line inside section)
        return
      }
    }

    // P2 — Inline trigger keyboard handling
    if (inlineTrigger) {
      const items = getFilteredInlineItems()
      const maxIdx = inlineTrigger.type === 'verbatim' ? (inlineTrigger.source === '/' ? 0 : 1) : (inlineTrigger.type === 'end-goal' || inlineTrigger.type === 'end-tag' || inlineTrigger.type === 'end-verbatim') ? 0 : items.length - 1
      if (e.key === 'Escape') {
        e.preventDefault()
        setInlineTrigger(null)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setInlineHighlight(prev => Math.min(prev + 1, maxIdx))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setInlineHighlight(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (inlineTrigger.type === 'end-goal') {
          deleteTriggerText()
          endGoalAnnotation()
          setInlineTrigger(null)
        } else if (inlineTrigger.type === 'end-verbatim') {
          deleteTriggerText()
          setActiveVerbatim(false)
          const editor = editorRef.current
          if (editor) {
            const marks = editor.querySelectorAll('mark[data-verbatim-type="said"]')
            const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
            if (mark) finishMark(mark)
          }
          setInlineTrigger(null)
        } else if (inlineTrigger.type === 'end-tag') {
          deleteTriggerText()
          const editor = editorRef.current
          if (editor && activeTag) {
            const marks = editor.querySelectorAll(`mark[data-tag="${activeTag.type}"]`)
            const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
            setActiveTag(null)
            if (mark) finishMark(mark)
          }
          setInlineTrigger(null)
        } else if (inlineTrigger.type === 'verbatim' && memberName) {
          deleteTriggerText()
          const editor = editorRef.current
          if (editor) {
            const sel = window.getSelection()
            if (sel && sel.rangeCount) {
              if (inlineHighlight === 0 && inlineTrigger.source !== '/') {
                // Name mention — subtle tag, cursor placed after (only for > trigger)
                const mentionHTML =
                  `<mark data-verbatim="${memberName}" data-verbatim-type="mention" style="background-color:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;font-weight:500;--tag-color:#0369a1;">${memberName}</mark>\u00A0`
                document.execCommand('insertHTML', false, mentionHTML)
              } else {
                // "Name said:" — enter annotation mode, cursor inside mark
                const saidHTML =
                  `<mark data-verbatim="${memberName}" data-verbatim-type="said" style="display:block;background-color:#f0f7ff;border-left:none;padding:6px 10px;margin:8px 0;border-radius:6px;font-style:italic;color:#1e3a5f;--tag-color:#3b82f6;--tag-bg:#f0f7ff;">\u200B</mark>`
                document.execCommand('insertHTML', false, saidHTML)
                // Place cursor inside the mark
                const marks = editor.querySelectorAll('mark[data-verbatim-type="said"]')
                const mark = marks[marks.length - 1]
                if (mark) {
                  const lastChild = mark.lastChild
                  if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
                    const newRange = document.createRange()
                    newRange.setStart(lastChild, lastChild.textContent?.length || 0)
                    newRange.collapse(true)
                    sel.removeAllRanges()
                    sel.addRange(newRange)
                  }
                }
                setActiveVerbatim(true)
              }
              handleInput()
            }
          }
          setInlineTrigger(null)
        } else if (items.length > 0) {
          const item = items[inlineHighlight]
          if (inlineTrigger.type === 'tag' && 'label' in item) {
            insertInlineMark({ type: 'tag', data: item as { type: string; label: string } })
          } else if (inlineTrigger.type === 'goal' && 'title' in item) {
            insertInlineMark({ type: 'goal', data: item as { id: string; title: string; status: string } })
          }
        }
        return
      }
    }

    if (e.key !== 'Enter') return
    // If in active annotation mode, let text stay inside the mark
    if (activeGoal || activeTag || activeVerbatim) return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const editor = editorRef.current
    if (!editor) return

    // Check if caret is inside a mark
    let node: Node | null = sel.anchorNode
    let originalMark: HTMLElement | null = null
    while (node && node !== editor) {
      if (node instanceof HTMLElement && node.tagName === 'MARK') {
        originalMark = node
        break
      }
      node = node.parentNode
    }
    if (!originalMark) return

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

      // Only unwrap if this is a DIFFERENT mark (the copy on the new line),
      // not the original mark — otherwise we'd destroy the original tag
      if (newMark && newMark !== originalMark) {
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
      } else if (newMark && newMark === originalMark) {
        // Browser didn't split the mark — it inserted a <br> inside it.
        // Split manually: move everything after the <br> out of the mark.
        const brs = originalMark.querySelectorAll('br')
        const lastBr = brs[brs.length - 1]
        if (lastBr) {
          const parent = originalMark.parentNode
          if (!parent) return
          // Collect nodes after the <br>
          const nodesAfter: Node[] = []
          let sibling = lastBr.nextSibling
          while (sibling) {
            nodesAfter.push(sibling)
            sibling = sibling.nextSibling
          }
          // Remove <br> and move trailing nodes out after the mark
          originalMark.removeChild(lastBr)
          const afterMark = originalMark.nextSibling
          for (const n of nodesAfter) {
            parent.insertBefore(n, afterMark)
          }
          // Insert a <br> before the extracted content for the line break
          parent.insertBefore(document.createElement('br'), nodesAfter[0] || afterMark)

          // Place caret at start of extracted content
          const range = document.createRange()
          if (nodesAfter.length > 0) {
            range.setStart(nodesAfter[0], 0)
          } else {
            range.setStartAfter(originalMark)
          }
          range.collapse(true)
          sel2.removeAllRanges()
          sel2.addRange(range)
        }
      }

      handleInput()
    })
  }, [handleInput, activeGoal, activeTag, activeVerbatim, inlineTrigger, getFilteredInlineItems, inlineHighlight, insertInlineMark, deleteTriggerText, finishMark, endGoalAnnotation, memberName, fr, compact, onSubmit])

  // Dismiss popover/tooltip/side menu/inline trigger on click outside
  useEffect(() => {
    if (!popoverPos && !markTooltip && !sideMenu && !inlineTrigger) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-goal-popover]') || target.closest('[data-goal-tooltip]') || target.closest('[data-side-menu]') || target.closest('[data-inline-trigger]')) return
      setPopoverPos(null)
      setPopoverMode('choices')
      setMarkTooltip(null)
      setSideMenu(null)
      setTagEditMode(false)
      setRenamingTag(null)
      setConfirmDeleteTag(null)
      setInlineTrigger(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popoverPos, markTooltip, sideMenu, inlineTrigger])

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

    // Check if inside a goal section
    let insideGoalSection = false
    node = range.commonAncestorContainer
    while (node && node !== editor) {
      if (node instanceof HTMLElement && node.hasAttribute('data-goal-section')) {
        insideGoalSection = true
        break
      }
      node = node.parentNode
    }

    const rect = range.getBoundingClientRect()
    // Flip upward if near the bottom of the viewport (within 250px)
    const nearBottom = rect.bottom + 250 > window.innerHeight
    const top = nearBottom ? rect.top - 8 : rect.bottom + 4
    const left = rect.left + rect.width / 2

    savedRange.current = range.cloneRange()
    setPopoverPos({ top, left, flipped: nearBottom })
    // If inside a goal section, only show tags (no goals)
    if (insideGoalSection) {
      if (hasTags) setPopoverMode('tags')
      else { setPopoverPos(null); return }
    } else if (hasGoals && !hasTags) setPopoverMode('goals')
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

    // Safety: reject if selection crosses an existing mark boundary
    // (extractContents would split the mark and corrupt the DOM)
    const ancestor = range.commonAncestorContainer
    const container = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentElement : ancestor as HTMLElement
    if (container) {
      const marks = container.querySelectorAll('mark[data-tag], mark[data-goal-id], mark[data-verbatim]')
      for (const mark of Array.from(marks)) {
        const markRange = document.createRange()
        markRange.selectNodeContents(mark)
        // Check if selection partially overlaps this mark (starts inside, ends outside or vice versa)
        const startsInside = range.compareBoundaryPoints(Range.START_TO_START, markRange) >= 0 &&
                             range.compareBoundaryPoints(Range.START_TO_END, markRange) < 0
        const endsInside = range.compareBoundaryPoints(Range.END_TO_START, markRange) > 0 &&
                           range.compareBoundaryPoints(Range.END_TO_END, markRange) <= 0
        if ((startsInside && !endsInside) || (!startsInside && endsInside)) {
          // Partial overlap — abort
          toast?.error?.(fr ? 'Sélection invalide — chevauche une annotation existante.' : 'Invalid selection — overlaps an existing annotation.')
          savedRange.current = null
          return
        }
      }
    }

    // Extract the selected content and put it inside the mark
    const fragment = range.extractContents()
    markEl.appendChild(fragment)
    range.insertNode(markEl)

    // Place cursor at end of the mark
    if (sel) {
      const newRange = document.createRange()
      newRange.selectNodeContents(markEl)
      newRange.collapse(false)
      sel.removeAllRanges()
      sel.addRange(newRange)
    }

    setPopoverPos(null)
    setPopoverMode('choices')
    savedRange.current = null
    handleInput()
  }, [handleInput, fr])

  const wrapSelectionWithGoal = useCallback((milestone: { id: string; title: string; status: string }) => {
    const colors = getGoalColor(milestone.status)
    const mark = document.createElement('mark')
    mark.dataset.goalId = milestone.id
    mark.dataset.goalTitle = milestone.title
    mark.dataset.goalStatus = milestone.status
    mark.setAttribute('style',
      `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;--tag-color:${colors.border};--tag-bg:${colors.bg};`
    )
    wrapWithMark(mark)
  }, [wrapWithMark])

  const wrapSelectionWithTag = useCallback((noteType: { type: string; label: string }) => {
    const colors = getTagColor(noteType.type, allTagTypes)
    const mark = document.createElement('mark')
    mark.dataset.tag = noteType.type
    mark.dataset.tagLabel = noteType.label
    mark.setAttribute('style',
      `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;--tag-color:${colors.border};--tag-bg:${colors.bg};`
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
      'display:block;background-color:#f0f7ff;border-left:none;padding:6px 10px;margin:8px 0;border-radius:6px;font-style:italic;color:#1e3a5f;--tag-color:#3b82f6;--tag-bg:#f0f7ff;'
    )
    wrapWithMark(mark)
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

  // Clean up empty marks (marks with no text content)
  const cleanEmptyMarks = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const marks = editor.querySelectorAll('mark[data-tag], mark[data-goal-id], mark[data-verbatim]')
    marks.forEach(mark => {
      // Strip zero-width spaces and non-breaking spaces before checking if empty
      const text = mark.textContent?.replace(/\u200B/g, '').replace(/\u00A0/g, '').trim()
      if (!text) {
        mark.parentNode?.removeChild(mark)
      }
    })
    handleInput()
  }, [handleInput])

  // Side menu handlers
  const openSideMenu = useCallback((menu: 'tags' | 'goals') => {
    setSideMenu(prev => {
      if (prev === menu) { setSideMenuPos(null); return null }
      // Calculate position from side rail
      if (sideMenuRef.current) {
        const rect = sideMenuRef.current.getBoundingClientRect()
        setSideMenuPos({ top: rect.top, left: rect.right + 4 })
      }
      return menu
    })
    setPopoverPos(null)
    setMarkTooltip(null)
  }, [])

  // Start tag annotation mode
  const startTagAnnotation = useCallback((noteType: { type: string; label: string }) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)

    const colors = getTagColor(noteType.type, allTagTypes)
    const mark = document.createElement('mark')
    mark.dataset.tag = noteType.type
    mark.dataset.tagLabel = noteType.label
    mark.setAttribute('style',
      `background-color:${colors.bg};border-bottom:2px solid ${colors.border};padding:1px 2px;border-radius:2px;cursor:pointer;--tag-color:${colors.border};--tag-bg:${colors.bg};`
    )

    if (!sel.isCollapsed) {
      try { range.surroundContents(mark) } catch {
        const fragment = range.extractContents()
        mark.appendChild(fragment)
        range.insertNode(mark)
      }
    } else {
      mark.appendChild(document.createTextNode('\u200B'))
      range.collapse(false)
      range.insertNode(mark)
    }

    const newRange = document.createRange()
    const lastChild = mark.lastChild || mark
    if (lastChild.nodeType === Node.TEXT_NODE) {
      newRange.setStart(lastChild, lastChild.textContent?.length || 0)
    } else {
      newRange.selectNodeContents(mark)
      newRange.collapse(false)
    }
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)

    setActiveTag(noteType)
    // Don't clear activeGoal — allow both active simultaneously
    setSideMenu(null)
    handleInput()
  }, [handleInput])

  // End tag annotation — clean up mark, move cursor out
  const endTagAnnotation = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !activeTag) { setActiveTag(null); return }

    const marks = editor.querySelectorAll(`mark[data-tag="${activeTag.type}"]`)
    const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null

    setActiveTag(null)
    if (mark) finishMark(mark)
    else handleInput()
  }, [handleInput, activeTag, finishMark])

  // Handle click on existing marks and goal sections
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const editor = editorRef.current
    if (!editor) return

    // Check for mark click (goal/tag/verbatim tooltips)
    const markEl = target.closest('mark[data-goal-id], mark[data-tag], mark[data-verbatim]') as HTMLElement | null
    if (markEl) {
      // Don't prevent default — let browser place cursor where user clicked
      const rect = markEl.getBoundingClientRect()
      setMarkTooltip({
        top: rect.bottom + 4,
        left: rect.left + rect.width / 2,
        markEl,
        kind: markEl.dataset.goalId ? 'goal' : markEl.dataset.tag ? 'tag' : 'verbatim',
      })
      setPopoverPos(null)
      setPopoverMode('choices')
      return
    }

    // Sync activeGoal from goal section detection
    const sectionEl = target.closest('[data-goal-section]') as HTMLElement | null
    if (sectionEl) {
      const id = sectionEl.dataset.goalId || ''
      const title = sectionEl.dataset.goalTitle || ''
      const status = sectionEl.dataset.goalStatus || ''
      if (!activeGoal || activeGoal.id !== id) {
        setActiveGoal({ id, title, status })
      }
    } else if (activeGoal) {
      setActiveGoal(null)
    }
  }, [activeGoal])

  // Hover tooltip on marks
  const handleEditorMouseOver = useCallback((e: React.MouseEvent) => {
    if (markTooltip) return // click tooltip is open, skip hover
    const target = e.target as HTMLElement
    // Find the innermost (closest) mark to the hover target
    const markEl = target.closest('mark[data-goal-id], mark[data-tag], mark[data-verbatim]') as HTMLElement | null
    if (!markEl) { setHoverTooltip(null); return }

    const isGoal = !!markEl.dataset.goalId
    const isTag = !!markEl.dataset.tag
    const rect = markEl.getBoundingClientRect()
    const label = isGoal
      ? markEl.dataset.goalTitle || ''
      : isTag
        ? markEl.dataset.tagLabel || ''
        : markEl.dataset.verbatim || ''
    setHoverTooltip({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
      label,
      kind: isGoal ? 'goal' : isTag ? 'tag' : 'verbatim',
    })
  }, [markTooltip])

  const handleEditorMouseLeave = useCallback(() => {
    setHoverTooltip(null)
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

      // Append extracted text (validate type first)
      const extractedText = typeof data.extractedText === 'string' ? data.extractedText : String(data.extractedText || '')
      if (editorRef.current && extractedText.trim()) {
        const lines = extractedText
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .split('\n')
          .map((line: string) => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
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

  const handleImportTextFile = async (file: File) => {
    setImporting(true)
    try {
      // 5 MB cap to keep things reasonable
      if (file.size > 5 * 1024 * 1024) {
        toast.error(fr ? 'Fichier trop volumineux (max 5 Mo).' : 'File too large (max 5 MB).')
        return
      }

      let htmlContent = ''

      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // Parse DOCX using mammoth
        const mammoth = (await import('mammoth')).default
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        htmlContent = result.value
      } else {
        // Plain text file
        const text = await file.text()
        if (!text.trim()) {
          toast.error(fr ? 'Le fichier est vide.' : 'The file is empty.')
          return
        }
        htmlContent = text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .split('\n')
          .map((line: string) => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
          .join('')
      }

      if (editorRef.current && htmlContent) {
        editorRef.current.innerHTML += htmlContent
        handleInput()
      }
      toast.success(fr ? 'Fichier importé' : 'File imported')
      setTimeout(() => editorRef.current?.focus(), 100)
    } catch {
      toast.error(fr ? "Impossible de lire le fichier." : 'Could not read the file.')
    } finally {
      setImporting(false)
      if (textFileInputRef.current) textFileInputRef.current.value = ''
    }
  }

  const btn = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  )

  // Popover content based on mode
  const renderPopoverContent = () => {
    // Show tags directly as horizontal pills — no intermediate "choices" step
    if ((popoverMode === 'choices' || popoverMode === 'tags') && noteTypes?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 flex items-center gap-1 flex-wrap max-w-[360px]">
          {noteTypes.map((nt) => {
            const colors = getTagColor(nt.type, allTagTypes)
            return (
              <button
                key={nt.type}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wrapSelectionWithTag(nt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-all whitespace-nowrap"
                style={{ backgroundColor: colors.bg, color: colors.border }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }} />
                {nt.label}
              </button>
            )
          })}
          {memberName && (
            <>
              <div className="w-px h-5 bg-gray-200 mx-0.5" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setPopoverPos(null)
                  wrapSelectionWithVerbatim()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors whitespace-nowrap"
              >
                <Quote className="w-3 h-3" />
                {fr ? 'Citation' : 'Quote'}
              </button>
            </>
          )}
        </div>
      )
    }

    if (popoverMode === 'goals' && milestones?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[220px] max-h-[200px] overflow-y-auto">
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
                onClick={() => {
                  setPopoverPos(null)
                  setPopoverMode('choices')
                  savedRange.current = null
                  startGoalAnnotation(m)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }} />
                <span className="text-xs text-gray-700 truncate">{m.title}</span>
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
      {/* Force consistent quote styling on all verbatim marks (overrides old inline styles from DB) */}
      <style>{`
        .rte-editor mark[data-verbatim] {
          display: inline !important;
          background-color: #f0f7ff !important;
          border-left: none !important;
          padding: 2px 8px !important;
          margin: 0 2px !important;
          border-radius: 4px !important;
          font-style: italic !important;
          color: #1e3a5f !important;
        }
        .rte-editor.show-labels mark[data-goal-id],
        .rte-editor.show-labels mark[data-tag] {
          background-color: var(--tag-bg, #f3f4f6) !important;
          border-bottom: none !important;
          border-left: none !important;
          padding: 2px 4px;
          border-radius: 3px;
          color: inherit;
        }
        .rte-editor.show-labels mark[data-verbatim] {
          background-color: #f0f7ff !important;
          border-left: none !important;
          padding: 6px 10px;
          border-radius: 6px;
          font-style: italic;
          color: #1e3a5f;
          display: block;
          margin: 8px 0;
        }
        .rte-editor.show-labels mark[data-goal-id]::before,
        .rte-editor.show-labels mark[data-tag]::before {
          font-size: inherit;
          font-style: normal;
          font-weight: 700;
          color: var(--tag-color, #6b7280);
        }
        .rte-editor.show-labels mark[data-goal-id]::before {
          content: attr(data-goal-title) ": ";
        }
        .rte-editor.show-labels mark[data-tag]::before {
          content: attr(data-tag-label) ": ";
        }
      `}</style>

      {/* P0 — Toolbar at top (sticky so it stays visible while scrolling notes) */}
      {compact ? (
        <div className="sticky top-0 z-30 flex items-center px-2 py-1 border-b border-gray-100 bg-white">
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
          <div className="ml-auto flex items-center gap-2">
            {toolbarActions}
          </div>
        </div>
      ) : (
      <div className="sticky top-0 z-30 flex items-center flex-wrap gap-0.5 px-2 py-1 border-b border-gray-200 bg-white">
        {btn(<Undo2 className="w-4 h-4" />, fr ? 'Annuler' : 'Undo', () => exec('undo'))}
        {btn(<Redo2 className="w-4 h-4" />, fr ? 'Rétablir' : 'Redo', () => exec('redo'))}
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        {btn(<Bold className="w-4 h-4" />, fr ? 'Gras' : 'Bold', () => exec('bold'))}
        {/* Heading dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setHeadingOpen(!headingOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Type className="w-4 h-4" />
            <span>{fr ? 'Titre' : 'Heading'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {headingOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setHeadingOpen(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
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
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        {btn(<ListOrdered className="w-4 h-4" />, fr ? 'Numéros' : 'Numbers', () => exec('insertOrderedList'))}
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        {btn(<Minus className="w-4 h-4" />, fr ? 'Séparateur' : 'Divider', () => exec('insertHorizontalRule'))}

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
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

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => textFileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
          <span>{importing ? (fr ? 'Import...' : 'Importing...') : (fr ? 'Importer fichier' : 'Import file')}</span>
        </button>
        <input
          ref={textFileInputRef}
          type="file"
          accept=".txt,.doc,.docx,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImportTextFile(file)
          }}
        />

        {/* Right side: autosave indicator + action buttons */}
        <div className="ml-auto flex items-center gap-2">
          {onAutoSave && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              {saveStatus === 'saving' ? (
                <><Loader2 className="w-3 h-3 animate-spin" /><span>{fr ? 'Enregistrement...' : 'Saving...'}</span></>
              ) : saveStatus === 'saved' ? (
                <span>{fr ? 'Enregistré' : 'Saved'}</span>
              ) : (
                <span className="text-gray-300">{fr ? 'Brouillon' : 'Draft'}</span>
              )}
            </div>
          )}
          {toolbarActions}
        </div>
      </div>
      )}

      {/* Image attachments strip */}
      {onAttachmentsChange && (
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(att.url)}
                  className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden hover:border-teal-300 hover:shadow-sm transition-all bg-white"
                >
                  <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {attachments.length < 5 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 flex flex-col items-center justify-center text-gray-400 hover:text-teal-600 transition-all"
              >
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                <span className="text-[9px] mt-0.5">{attachments.length}/5</span>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-8" onClick={() => setLightboxUrl(null)}>
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 text-white/80 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Editable area with side rail */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex flex-1 gap-0">
          {/* Side rail — tag toggle (hidden in compact mode) */}
          {!compact && hasAnnotations && (
            <div ref={sideMenuRef} data-side-menu className="sticky top-[42px] z-20 flex flex-col pt-2 bg-white self-start relative">
              {hasTags && (
                activeTag ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={endTagAnnotation}
                    className="p-2.5 transition-colors text-violet-600 bg-violet-100 animate-pulse rounded-lg"
                    title={fr ? `Fin: ${activeTag.label}` : `End: ${activeTag.label}`}
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => openSideMenu('tags')}
                    className={`p-2.5 rounded-lg transition-colors ${sideMenu === 'tags' ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50/50'}`}
                    title={fr ? 'Étiquettes' : 'Tags'}
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                )
              )}

              {/* Quote button */}
              {memberName && (
                activeVerbatim ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const editor = editorRef.current
                      if (!editor) return
                      const marks = editor.querySelectorAll('mark[data-verbatim-type="said"]')
                      if (marks.length > 0) {
                        const last = marks[marks.length - 1] as HTMLElement
                        finishMark(last)
                      }
                      setActiveVerbatim(false)
                      setTimeout(() => handleInput(), 0)
                    }}
                    className="p-2.5 rounded-lg transition-colors text-sky-600 bg-sky-100 animate-pulse"
                    title={fr ? `Fin: ${memberName} said` : `End: ${memberName} said`}
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const editor = editorRef.current
                      if (!editor) return
                      const sel = window.getSelection()
                      if (!sel || !sel.rangeCount) return
                      const range = sel.getRangeAt(0)
                      // If text is selected, wrap it as a quote highlight
                      if (!sel.isCollapsed && editor.contains(range.commonAncestorContainer)) {
                        wrapSelectionWithVerbatim()
                        return
                      }
                      // Otherwise start annotation mode
                      range.collapse(false)
                      const mark = document.createElement('mark')
                      mark.dataset.verbatim = memberName
                      mark.dataset.verbatimType = 'said'
                      mark.setAttribute('style',
                        'display:block;background-color:#f0f7ff;border-left:none;padding:6px 10px;margin:8px 0;border-radius:6px;font-style:italic;color:#1e3a5f;--tag-color:#3b82f6;--tag-bg:#f0f7ff;'
                      )
                      const zwsp = document.createTextNode('\u200B')
                      mark.appendChild(zwsp)
                      range.insertNode(mark)
                      const newRange = document.createRange()
                      newRange.setStart(zwsp, zwsp.length)
                      newRange.collapse(true)
                      sel.removeAllRanges()
                      sel.addRange(newRange)
                      setActiveVerbatim(true)
                      handleInput()
                    }}
                    className="p-2.5 rounded-lg transition-colors text-sky-500 hover:text-sky-600 hover:bg-sky-50/50"
                    title={fr ? `${memberName} a dit` : `${memberName} said`}
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                )
              )}


              {/* Goal dropdown — inline absolute */}
              {sideMenu === 'goals' && !activeGoal && milestones?.length && (
                <div data-side-menu className="absolute left-full top-0 ml-1 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[200px] max-h-[360px] overflow-y-auto">
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
                    onClick={() => startGoalAnnotation(m)}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }} />
                    <span className="text-xs text-gray-700 truncate">{m.title}</span>
                  </button>
                )
              })}
                </div>
              )}
              {/* Tag dropdown — inline absolute */}
              {sideMenu === 'tags' && !activeTag && noteTypes?.length && (
                <div data-side-menu className="absolute left-full top-0 ml-1 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[180px] max-h-[360px] overflow-y-auto">
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {fr ? 'Étiquettes' : 'Tags'}
                </span>
                {(onRenameType || onDeleteType) && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setTagEditMode(prev => !prev); setRenamingTag(null); setConfirmDeleteTag(null) }}
                    className={`p-1 rounded transition-colors ${tagEditMode ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600 hover:bg-gray-100'}`}
                    title={fr ? 'Modifier les étiquettes' : 'Edit tags'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {noteTypes.map((nt) => {
                const colors = getTagColor(nt.type, allTagTypes)
                const isLocked = lockedTypes?.includes(nt.type)
                const isRenaming = renamingTag === nt.type
                const isConfirmingDelete = confirmDeleteTag === nt.type

                // Edit mode: show rename/delete controls
                if (tagEditMode && !isLocked) {
                  return (
                    <div key={nt.type} className="w-full px-3 py-1.5 flex items-center gap-2 group">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }} />
                      {isRenaming ? (
                        <form
                          className="flex-1 flex items-center gap-1"
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (onRenameType) onRenameType(nt.type, renameValue)
                            setRenamingTag(null)
                          }}
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => {
                              if (onRenameType && renameValue.trim()) onRenameType(nt.type, renameValue)
                              setRenamingTag(null)
                            }}
                            onKeyDown={(e) => { if (e.key === 'Escape') setRenamingTag(null) }}
                            className="flex-1 text-xs px-1.5 py-0.5 border border-violet-300 rounded focus:outline-none focus:ring-1 focus:ring-violet-300 min-w-0"
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </form>
                      ) : isConfirmingDelete ? (
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const count = getTagNoteCount?.(nt.type) ?? 0
                            const otherTags = noteTypes?.filter(t => t.type !== nt.type) || []
                            return (
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-gray-600 leading-tight">
                                  {count > 0
                                    ? (fr
                                        ? `${count} note${count > 1 ? 's' : ''} utilise${count > 1 ? 'nt' : ''} ce tag. Réassigner à :`
                                        : `${count} note${count > 1 ? 's' : ''} use this tag. Reassign to:`)
                                    : (fr ? 'Aucune note n\'utilise ce tag.' : 'No notes use this tag.')
                                  }
                                </p>
                                {count > 0 && (
                                  <select
                                    value={deleteReassignTo}
                                    onChange={(e) => setDeleteReassignTo(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-full text-[10px] px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:border-violet-300"
                                  >
                                    <option value="general">{fr ? 'Général (pas de tag)' : 'General (no tag)'}</option>
                                    {otherTags.map(t => (
                                      <option key={t.type} value={t.type}>{t.label}</option>
                                    ))}
                                  </select>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { if (onDeleteType) onDeleteType(nt.type, deleteReassignTo); setConfirmDeleteTag(null); setDeleteReassignTo('general') }}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    {fr ? 'Supprimer' : 'Delete'}
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setConfirmDeleteTag(null); setDeleteReassignTo('general') }}
                                    className="px-2 py-0.5 rounded text-[10px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    {fr ? 'Annuler' : 'Cancel'}
                                  </button>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        <>
                          <span className="text-xs text-gray-700 truncate flex-1">{nt.label}</span>
                          <div className="flex items-center gap-0.5">
                            {onRenameType && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setRenamingTag(nt.type); setRenameValue(nt.label); setConfirmDeleteTag(null) }}
                                className="p-0.5 rounded text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-colors"
                                title={fr ? 'Renommer' : 'Rename'}
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {onDeleteType && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setConfirmDeleteTag(nt.type); setRenamingTag(null) }}
                                className="p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title={fr ? 'Supprimer' : 'Delete'}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                }

                // Normal mode or locked tag
                return (
                  <button
                    key={nt.type}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => startTagAnnotation(nt)}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }} />
                    <span className="text-xs text-gray-700 truncate flex-1">{nt.label}</span>
                    {isLocked && <Lock className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />}
                  </button>
                )
              })}
              {onAddType && (noteTypes?.length || 0) < maxTypes && (
                <div className="border-t border-gray-100 mt-1 pt-1 px-3 py-1">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const input = (e.target as HTMLFormElement).elements.namedItem('newTag') as HTMLInputElement
                      const val = input.value.trim().toLowerCase().replace(/\s+/g, '_')
                      if (val && !noteTypes.some(nt => nt.type === val)) {
                        onAddType(val)
                        input.value = ''
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      name="newTag"
                      type="text"
                      placeholder={fr ? 'Nouveau...' : 'New...'}
                      className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-violet-300"
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <button type="submit" className="p-0.5 text-violet-500 hover:text-violet-700" onMouseDown={(e) => e.preventDefault()}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
                </div>
              )}
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onPaste={handlePaste}
              onMouseUp={handleMouseUp}
              onKeyDown={handleKeyDown}
              onClick={handleEditorClick}
              onMouseOver={handleEditorMouseOver}
              onMouseLeave={handleEditorMouseLeave}
              className={`rte-editor ${showLabels ? 'show-labels' : ''} w-full px-6 ${compact ? 'py-2' : 'py-4'} text-sm bg-white outline-none [line-height:2.2] ${compact ? 'min-h-[60px] max-h-[140px]' : 'min-h-[300px]'} overflow-y-auto [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-2 [&_h1]:mb-0.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-2 [&_h2]:mb-0.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-2 [&_h3]:mb-0.5 [&_hr]:border-gray-200 [&_hr]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
            />
            {isEmpty && (
              <div className="absolute top-4 left-6 text-sm text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection popover — portal to body */}
      {popoverPos && hasAnnotations && createPortal(
        <div
          data-goal-popover
          className="fixed z-[100]"
          style={{
            ...(popoverPos.flipped
              ? { bottom: window.innerHeight - popoverPos.top, left: popoverPos.left, transform: 'translateX(-50%)' }
              : { top: popoverPos.top, left: popoverPos.left, transform: 'translateX(-50%)' }),
          }}
        >
          {renderPopoverContent()}
        </div>,
        document.body
      )}

      {/* Mark tooltip (edit mode) — portal to body */}
      {markTooltip && createPortal(
        <div
          data-goal-tooltip
          className="fixed z-[100]"
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
                  : `${markTooltip.markEl.dataset.verbatim} ${fr ? 'a dit' : es ? 'dijo' : 'said'}`}
            </span>
            <div className="w-px h-3 bg-gray-600" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                // Guard: check mark still exists in DOM (could have been undone)
                if (markTooltip.markEl.parentNode) {
                  unlinkMark(markTooltip.markEl)
                } else {
                  setMarkTooltip(null)
                }
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>{fr ? 'Retirer' : 'Remove'}</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Hover tooltip on marks — portal to body */}
      {hoverTooltip && !markTooltip && createPortal(
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ top: hoverTooltip.top, left: hoverTooltip.left, transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 text-white rounded-lg shadow-lg text-xs whitespace-nowrap max-w-[220px]">
            {hoverTooltip.kind === 'goal' ? (
              <Target className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            ) : hoverTooltip.kind === 'tag' ? (
              <Tag className="w-3 h-3 text-violet-400 flex-shrink-0" />
            ) : (
              <Quote className="w-3 h-3 text-sky-400 flex-shrink-0" />
            )}
            <span className="truncate">{hoverTooltip.label}</span>
          </div>
        </div>,
        document.body
      )}

      {/* P2 — Inline trigger dropdown — portal to body */}
      {inlineTrigger && createPortal(
        <div
          ref={inlineDropdownRef}
          data-inline-trigger
          className="fixed z-[100]"
          style={{ top: inlineTrigger.position.top, left: inlineTrigger.position.left }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] max-h-[360px] overflow-y-auto">
            {(inlineTrigger.type === 'end-goal' || inlineTrigger.type === 'end-tag' || inlineTrigger.type === 'end-verbatim') ? (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {inlineTrigger.type === 'end-goal'
                    ? (fr ? 'Objectif actif' : 'Active goal')
                    : inlineTrigger.type === 'end-verbatim'
                    ? (fr ? 'Citation active' : 'Active quote')
                    : (fr ? 'Étiquette active' : 'Active tag')}
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    deleteTriggerText()
                    if (inlineTrigger?.type === 'end-goal') {
                      endGoalAnnotation()
                    } else if (inlineTrigger?.type === 'end-verbatim') {
                      setActiveVerbatim(false)
                      const editor = editorRef.current
                      if (editor) {
                        const marks = editor.querySelectorAll('mark[data-verbatim-type="said"]')
                        const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
                        if (mark) finishMark(mark)
                      }
                    } else {
                      const editor = editorRef.current
                      if (editor && activeTag) {
                        const marks = editor.querySelectorAll(`mark[data-tag="${activeTag.type}"]`)
                        const mark = marks.length ? marks[marks.length - 1] as HTMLElement : null
                        setActiveTag(null)
                        if (mark) finishMark(mark)
                      }
                    }
                    setInlineTrigger(null)
                  }}
                  className={`w-full text-left px-3 py-1.5 transition-colors flex items-center gap-2 ${
                    inlineHighlight === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {inlineTrigger.type === 'end-goal' ? (
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                  ) : inlineTrigger.type === 'end-verbatim' ? (
                    <Quote className="w-3.5 h-3.5 text-sky-500" />
                  ) : (
                    <Tag className="w-3.5 h-3.5 text-violet-600" />
                  )}
                  <span className="text-xs text-gray-700">
                    {fr ? 'Terminer' : 'End'}: {inlineTrigger.type === 'end-verbatim' ? `${memberName} ${fr ? 'a dit' : es ? 'dijo' : 'said'}` : (activeGoal?.title || activeTag?.label)}
                  </span>
                </button>
              </>
            ) : inlineTrigger.type === 'verbatim' && memberName ? (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {inlineTrigger.source === '/' ? (fr ? 'Citation' : 'Quote') : (fr ? 'Mention' : 'Mention')}
                </div>
                {(inlineTrigger.source === '/'
                  ? [{ label: `${memberName} ${fr ? 'a dit' : es ? 'dijo' : 'said'}`, isVerbatim: true }]
                  : [
                      { label: memberName, isVerbatim: false },
                      { label: `${memberName} ${fr ? 'a dit' : es ? 'dijo' : 'said'}`, isVerbatim: true },
                    ]
                ).map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      deleteTriggerText()
                      const editor = editorRef.current
                      if (editor) {
                        const sel = window.getSelection()
                        if (sel && sel.rangeCount) {
                          const range = sel.getRangeAt(0)
                          const mark = document.createElement('mark')
                          mark.dataset.verbatim = memberName
                          if (opt.isVerbatim) {
                            // "Name said:" — enter annotation mode
                            mark.dataset.verbatimType = 'said'
                            mark.setAttribute('style',
                              'display:block;background-color:#f0f7ff;border-left:none;padding:6px 10px;margin:8px 0;border-radius:6px;font-style:italic;color:#1e3a5f;--tag-color:#3b82f6;--tag-bg:#f0f7ff;'
                            )
                            const zwsp = document.createTextNode('\u200B')
                            mark.appendChild(zwsp)
                            range.insertNode(mark)
                            const newRange = document.createRange()
                            newRange.setStart(zwsp, zwsp.length)
                            newRange.collapse(true)
                            sel.removeAllRanges()
                            sel.addRange(newRange)
                            setActiveVerbatim(true)
                          } else {
                            // Name mention — insert and place cursor after
                            mark.dataset.verbatimType = 'mention'
                            mark.setAttribute('style',
                              'background-color:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;font-weight:500;--tag-color:#0369a1;'
                            )
                            mark.appendChild(document.createTextNode(opt.label))
                            range.insertNode(mark)
                            const spacer = document.createTextNode('\u00A0')
                            mark.parentNode?.insertBefore(spacer, mark.nextSibling)
                            const newRange = document.createRange()
                            newRange.setStart(spacer, spacer.length)
                            newRange.collapse(true)
                            sel.removeAllRanges()
                            sel.addRange(newRange)
                          }
                          handleInput()
                        }
                      }
                      setInlineTrigger(null)
                    }}
                    className={`w-full text-left px-3 py-1.5 transition-colors flex items-center gap-2 ${
                      idx === inlineHighlight ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    {opt.isVerbatim
                      ? <Quote className="w-3.5 h-3.5 text-sky-500" />
                      : <span className="w-3.5 h-3.5 text-center text-[11px] font-semibold text-gray-500">@</span>
                    }
                    <span className="text-xs text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {inlineTrigger.type === 'goal'
                    ? (fr ? 'Objectifs' : 'Goals')
                    : (fr ? 'Étiquettes' : 'Tags')}
                </div>
                {(() => {
                  const items = getFilteredInlineItems()
                  if (items.length === 0) {
                    return (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        {fr ? 'Aucun résultat' : 'No results'}
                      </div>
                    )
                  }
                  return items.map((item, idx) => {
                    const isGoal = 'title' in item
                    const colors = isGoal
                      ? getGoalColor((item as { id: string; title: string; status: string }).status)
                      : getTagColor((item as { type: string; label: string }).type, allTagTypes)
                    return (
                      <button
                        key={isGoal ? (item as { id: string }).id : (item as { type: string }).type}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (isGoal) {
                            insertInlineMark({ type: 'goal', data: item as { id: string; title: string; status: string } })
                          } else {
                            insertInlineMark({ type: 'tag', data: item as { type: string; label: string } })
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors flex items-center gap-2 ${
                          idx === inlineHighlight ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors.border }}
                        />
                        <span className="text-xs text-gray-700 truncate">
                          {isGoal ? (item as { title: string }).title : (item as { label: string }).label}
                        </span>
                      </button>
                    )
                  })
                })()}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
