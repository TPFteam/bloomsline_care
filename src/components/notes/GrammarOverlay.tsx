'use client'

// PROTOTYPE grammar underline layer for the note editor. Additive and
// non-invasive: it reads the contenteditable via the Range API and draws
// underlines in an absolutely-positioned overlay. It NEVER mutates innerHTML
// except when the user clicks "apply a suggestion" (which goes through
// execCommand so it stays in the editor's normal undo history).
//
// OFF by default. Enable for testing with either:
//   - env  NEXT_PUBLIC_GRAMMAR_CHECK=1
//   - console  localStorage.setItem('bloom_grammar','1')  (then re-focus editor)

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Match {
  offset: number
  length: number
  message: string
  shortMessage: string
  replacements: string[]
  issueType: string
  category: string
}

interface Box {
  id: string
  left: number
  top: number
  width: number
  height: number
  match: Match
  range: Range
}

// Inline elements whose text we should NOT grammar-check (tags, mentions,
// goal-section chrome, verbatim chips, hoisted labels, and anything explicitly
// marked non-editable).
function isSkipped(el: Element): boolean {
  return (
    el.hasAttribute('data-tag') ||
    el.hasAttribute('data-goal-section') ||
    el.hasAttribute('data-goal-section-header') ||
    el.hasAttribute('data-verbatim') ||
    el.hasAttribute('data-hoisted-label') ||
    el.getAttribute('contenteditable') === 'false'
  )
}

const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'UL', 'OL', 'BLOCKQUOTE', 'HR'])

interface Segment {
  node: Text
  start: number
  end: number
}

// Build a plain-text string + a map back to the DOM text nodes. Skipped
// elements contribute a single space so offsets stay monotonic without
// checking their text. Block boundaries become newlines so LanguageTool
// sees sentence breaks correctly.
function buildText(root: HTMLElement): { text: string; segments: Segment[] } {
  const segments: Segment[] = []
  let text = ''

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node as Text
      const content = t.data
      if (content.length) {
        segments.push({ node: t, start: text.length, end: text.length + content.length })
        text += content
      }
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    if (isSkipped(el)) {
      text += ' '
      return
    }
    if (el.tagName === 'BR') {
      text += '\n'
      return
    }
    const isBlock = BLOCK_TAGS.has(el.tagName)
    for (const child of Array.from(node.childNodes)) walk(child)
    if (isBlock && !text.endsWith('\n')) text += '\n'
  }

  walk(root)
  return { text, segments }
}

function locate(segments: Segment[], pos: number): { node: Text; offset: number } | null {
  for (const s of segments) {
    if (pos >= s.start && pos <= s.end) return { node: s.node, offset: pos - s.start }
  }
  return null
}

const UNDERLINE_COLOR: Record<string, string> = {
  misspelling: '#ef4444', // red — spelling
  grammar: '#f59e0b', // amber — grammar
  typographical: '#f59e0b',
  style: '#3b82f6', // blue — style
  misc: '#f59e0b',
}

export default function GrammarOverlay({
  editorRef,
  locale,
}: {
  editorRef: React.RefObject<HTMLDivElement | null>
  locale: string
}) {
  const [enabled, setEnabled] = useState(false)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [popover, setPopover] = useState<Box | null>(null)
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle')

  const matchesRef = useRef<Match[]>([])
  const lastTextRef = useRef<string>('')
  const ignoredRef = useRef<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const ltLanguage = locale === 'fr' ? 'fr' : locale === 'es' ? 'es' : 'en-US'

  useEffect(() => {
    const read = () => {
      const on =
        process.env.NEXT_PUBLIC_GRAMMAR_CHECK === '1' ||
        (typeof window !== 'undefined' && localStorage.getItem('bloom_grammar') === '1')
      setEnabled(!!on)
    }
    read()
    // Re-read the flag on focus so toggling it in the console takes effect
    // without a full page reload (storage events don't fire in the same tab).
    const editor = editorRef.current
    editor?.addEventListener('focus', read)
    window.addEventListener('focus', read)
    return () => {
      editor?.removeEventListener('focus', read)
      window.removeEventListener('focus', read)
    }
  }, [editorRef])

  const matchKey = (m: Match) => `${m.offset}:${m.length}:${m.message}`

  // Recompute underline boxes from the current DOM + current matches.
  const recomputeBoxes = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const { segments } = buildText(editor)
    const editorRect = editor.getBoundingClientRect()
    const next: Box[] = []
    for (const m of matchesRef.current) {
      if (ignoredRef.current.has(matchKey(m))) continue
      const start = locate(segments, m.offset)
      const end = locate(segments, m.offset + m.length)
      if (!start || !end) continue
      let range: Range
      try {
        range = document.createRange()
        range.setStart(start.node, start.offset)
        range.setEnd(end.node, end.offset)
      } catch {
        continue
      }
      const rects = Array.from(range.getClientRects())
      rects.forEach((r, i) => {
        if (r.width < 1) return
        // Range rects are viewport coords that already reflect the editor's
        // internal scroll, so subtract only the editor's viewport origin.
        next.push({
          id: `${matchKey(m)}#${i}`,
          left: r.left - editorRect.left,
          top: r.top - editorRect.top,
          width: r.width,
          height: r.height,
          match: m,
          range,
        })
      })
    }
    setBoxes(next)
  }, [editorRef])

  const runCheck = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const { text } = buildText(editor)
    if (text.trim().length === 0) {
      matchesRef.current = []
      lastTextRef.current = ''
      setBoxes([])
      setStatus('idle')
      return
    }
    if (text === lastTextRef.current) return
    lastTextRef.current = text

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStatus('checking')
    try {
      const res = await fetch('/api/grammar/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: ltLanguage }),
        signal: ctrl.signal,
      })
      const data = await res.json()
      matchesRef.current = (data.matches || []) as Match[]
      recomputeBoxes()
      setStatus('done')
    } catch (e: any) {
      if (e?.name !== 'AbortError') setStatus('error')
    }
  }, [editorRef, ltLanguage, recomputeBoxes])

  const scheduleCheck = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runCheck, 1200)
  }, [runCheck])

  // Observe edits + scroll/resize while enabled.
  useEffect(() => {
    if (!enabled) return
    const editor = editorRef.current
    if (!editor) return

    const obs = new MutationObserver(() => {
      setPopover(null)
      scheduleCheck()
    })
    obs.observe(editor, { childList: true, subtree: true, characterData: true })

    const onScrollResize = () => {
      setPopover(null)
      recomputeBoxes()
    }
    editor.addEventListener('scroll', onScrollResize)
    window.addEventListener('resize', onScrollResize)

    scheduleCheck()

    return () => {
      obs.disconnect()
      editor.removeEventListener('scroll', onScrollResize)
      window.removeEventListener('resize', onScrollResize)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [enabled, editorRef, scheduleCheck, recomputeBoxes])

  const applyReplacement = (box: Box, value: string) => {
    const editor = editorRef.current
    if (!editor) return
    // Re-derive a fresh range from current DOM (the stored one may be stale).
    const { segments } = buildText(editor)
    const start = locate(segments, box.match.offset)
    const end = locate(segments, box.match.offset + box.match.length)
    if (!start || !end) {
      setPopover(null)
      return
    }
    try {
      const range = document.createRange()
      range.setStart(start.node, start.offset)
      range.setEnd(end.node, end.offset)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      editor.focus()
      document.execCommand('insertText', false, value)
    } catch {
      /* no-op */
    }
    setPopover(null)
    lastTextRef.current = '' // force a re-check
    scheduleCheck()
  }

  const ignore = (box: Box) => {
    ignoredRef.current.add(matchKey(box.match))
    setPopover(null)
    recomputeBoxes()
  }

  const toggle = () => {
    setEnabled((prev) => {
      const nv = !prev
      try {
        localStorage.setItem('bloom_grammar', nv ? '1' : '0')
      } catch {
        /* ignore */
      }
      if (!nv) {
        matchesRef.current = []
        lastTextRef.current = ''
        setBoxes([])
        setStatus('idle')
        setPopover(null)
      }
      return nv
    })
  }

  const label =
    status === 'checking'
      ? 'Grammaire…'
      : status === 'error'
        ? 'Grammaire ⚠'
        : boxes.length > 0
          ? `Grammaire · ${boxes.length}`
          : 'Grammaire'

  return (
    <>
      {/* Underline overlay — clipped to the editor, non-interactive except marks */}
      {enabled && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {boxes.map((b) => {
            const color = UNDERLINE_COLOR[b.match.issueType] || '#f59e0b'
            return (
              <span
                key={b.id}
                onClick={() => setPopover(b)}
                className="pointer-events-auto absolute cursor-pointer"
                style={{
                  left: b.left,
                  top: b.top,
                  width: b.width,
                  height: b.height,
                  borderBottom: `2px solid ${color}`,
                  backgroundColor: `${color}12`,
                }}
                title={b.match.message}
              />
            )
          })}
        </div>
      )}

      {/* Toggle — always visible so the feature is discoverable and deterministic */}
      <button
        type="button"
        onClick={toggle}
        title="Vérification grammaticale (FR/EN/ES)"
        className={`absolute top-2 right-2 z-20 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
          enabled
            ? 'bg-teal-600 text-white shadow-sm'
            : 'bg-white border border-gray-300 text-gray-500 shadow-sm hover:border-teal-300 hover:text-teal-600'
        }`}
      >
        {enabled ? label : '✓ Grammaire'}
      </button>

      {/* Suggestion popover */}
      {enabled &&
        popover &&
        typeof document !== 'undefined' &&
        createPortal(
          <GrammarPopover
            box={popover}
            editorRef={editorRef}
            onApply={(v) => applyReplacement(popover, v)}
            onIgnore={() => ignore(popover)}
            onClose={() => setPopover(null)}
          />,
          document.body
        )}
    </>
  )
}

function GrammarPopover({
  box,
  editorRef,
  onApply,
  onIgnore,
  onClose,
}: {
  box: Box
  editorRef: React.RefObject<HTMLDivElement | null>
  onApply: (value: string) => void
  onIgnore: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const editor = editorRef.current
  const editorRect = editor?.getBoundingClientRect()
  // box.left/top are already relative to the editor's visible box.
  const left = (editorRect?.left ?? 0) + box.left
  const top = (editorRect?.top ?? 0) + box.top + box.height + 6

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-[80] w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      style={{ left: Math.max(8, Math.min(left, window.innerWidth - 264)), top }}
    >
      <p className="mb-2 text-xs leading-snug text-gray-600">{box.match.message}</p>
      {box.match.replacements.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {box.match.replacements.map((r, i) => (
            <button
              key={i}
              onClick={() => onApply(r)}
              className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100"
            >
              {r}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-gray-400">Aucune correction proposée</p>
      )}
      <button
        onClick={onIgnore}
        className="mt-2 text-[11px] text-gray-400 hover:text-gray-600"
      >
        Ignorer
      </button>
    </div>
  )
}
