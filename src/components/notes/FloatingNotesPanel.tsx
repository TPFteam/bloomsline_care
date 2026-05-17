'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GripVertical, Minus, X, Maximize2, Minimize2, Save, Loader2, FileText } from 'lucide-react'
import { analytics } from '@/lib/analytics/events'
import { useFloatingNotes } from '@/lib/floating-notes/context'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { toast } from 'sonner'

const MIN_WIDTH = 360
const MIN_HEIGHT = 250
const DEFAULT_WIDTH = 420
const DEFAULT_HEIGHT = 400

export function FloatingNotesPanel() {
  const { floatingNote, isMinimized, closeFloat, updateContent, setMinimized } = useFloatingNotes()
  const { locale } = useLanguage()
  const fr = locale === 'fr'
  const supabase = createClient()

  // Position & size
  const [pos, setPos] = useState({ x: -1, y: -1 })
  const [size, setSize] = useState({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT })
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Drag state
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Resize state
  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  // Portal mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset position when a new floating note opens — centred on the
  // viewport so it reads like a modal rather than a docked toast. The
  // practitioner can still drag and resize it (or toggle to compact
  // via the icon) afterwards.
  //
  // Defaults to the EXPANDED size: practitioners want room to write,
  // and the compact toast-style panel makes them squint. The toggle
  // button remains for anyone who prefers the smaller footprint.
  useEffect(() => {
    if (floatingNote) {
      const targetW = typeof window !== 'undefined'
        ? Math.min(1100, Math.max(MIN_WIDTH, window.innerWidth - 96))
        : DEFAULT_WIDTH
      const targetH = typeof window !== 'undefined'
        ? Math.min(760, Math.max(MIN_HEIGHT, window.innerHeight - 96))
        : DEFAULT_HEIGHT
      setPos({
        x: Math.max(16, (window.innerWidth - targetW) / 2),
        y: Math.max(16, (window.innerHeight - targetH) / 2),
      })
      setSize({ w: targetW, h: targetH })
      setShowConfirm(false)
      setIsExpanded(true)
    }
  }, [floatingNote?.memberId, floatingNote?.mode])

  // Toggle a larger, more modal-like layout for distraction-free note
  // taking. Re-centres so it lands neatly regardless of where the user
  // had dragged the smaller panel.
  const toggleExpand = useCallback(() => {
    if (typeof window === 'undefined') return
    setIsExpanded(prev => {
      const next = !prev
      const targetW = next ? Math.min(1100, Math.max(MIN_WIDTH, window.innerWidth - 96)) : DEFAULT_WIDTH
      const targetH = next ? Math.min(760, Math.max(MIN_HEIGHT, window.innerHeight - 96)) : DEFAULT_HEIGHT
      setSize({ w: targetW, h: targetH })
      setPos({
        x: Math.max(16, (window.innerWidth - targetW) / 2),
        y: Math.max(16, (window.innerHeight - targetH) / 2),
      })
      return next
    })
  }, [])

  // Escape key minimizes
  useEffect(() => {
    if (!floatingNote) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMinimized(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [floatingNote, setMinimized])

  // Drag handlers
  const onDragStart = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const nx = Math.max(0, Math.min(window.innerWidth - size.w, e.clientX - dragOffset.current.x))
    const ny = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.current.y))
    setPos({ x: nx, y: ny })
  }, [size.w])

  const onDragEnd = useCallback(() => {
    dragging.current = false
  }, [])

  // Resize handlers
  const onResizeStart = useCallback((e: React.PointerEvent) => {
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }, [size])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return
    const dw = e.clientX - resizeStart.current.x
    const dh = e.clientY - resizeStart.current.y
    setSize({
      w: Math.max(MIN_WIDTH, resizeStart.current.w + dw),
      h: Math.max(MIN_HEIGHT, resizeStart.current.h + dh),
    })
  }, [])

  const onResizeEnd = useCallback(() => {
    resizing.current = false
  }, [])

  // Close with confirmation
  const handleClose = useCallback(() => {
    if (floatingNote?.content?.trim()) {
      setShowConfirm(true)
    } else {
      closeFloat()
    }
  }, [floatingNote, closeFloat])

  // Save from floating panel
  const handleSave = useCallback(async () => {
    if (!floatingNote || !floatingNote.content.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (floatingNote.mode === 'session' && floatingNote.sessionId) {
        // Session note — upsert
        if (floatingNote.existingNoteId) {
          const { error } = await supabase
            .from('progress_notes')
            .update({ content: floatingNote.content.trim(), updated_at: new Date().toISOString() })
            .eq('id', floatingNote.existingNoteId)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('progress_notes')
            .insert({
              member_id: floatingNote.memberId,
              practitioner_id: user.id,
              session_id: floatingNote.sessionId,
              content: floatingNote.content.trim(),
              note_type: 'session_summary',
              is_private: true,
            })
          if (error) throw error
        }
      } else {
        // Quick note
        const { error } = await supabase
          .from('progress_notes')
          .insert({
            member_id: floatingNote.memberId,
            practitioner_id: user.id,
            content: floatingNote.content.trim(),
            note_type: floatingNote.noteType || 'general',
            is_private: true,
          })
        if (error) throw error
      }

      toast.success(fr ? 'Note enregistrée' : 'Note saved')
      analytics.sessionNoteSaved()
      closeFloat()
    } catch (error) {
      console.error('Error saving floating note:', error)
      toast.error(fr ? 'Échec de l\'enregistrement' : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }, [floatingNote, supabase, fr, closeFloat])

  if (!mounted || !floatingNote) return null

  // Minimized pill
  if (isMinimized) {
    return createPortal(
      <div
        className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setMinimized(false)}
      >
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
          {floatingNote.memberName}
        </span>
        <span className="text-xs text-gray-400">
          {floatingNote.mode === 'session' ? (fr ? 'Séance' : 'Session') : (fr ? 'Note' : 'Note')}
        </span>
        <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
      </div>,
      document.body
    )
  }

  // Full window
  return createPortal(
    <>
      {/* Floating window */}
      <div
        className="fixed z-[90] bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
        style={{
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h,
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-grab active:cursor-grabbing select-none shrink-0"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
        >
          <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700 truncate">
              {floatingNote.memberName}
              {floatingNote.sessionContext?.title && (
                <span className="text-gray-400 font-normal"> · {floatingNote.sessionContext.title}</span>
              )}
            </div>
            {floatingNote.sessionContext ? (
              <div className="text-[10px] text-gray-500 truncate">
                {(() => {
                  const d = new Date(floatingNote.sessionContext.startTimeIso)
                  const dateStr = d.toLocaleDateString(fr ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  const timeStr = d.toLocaleTimeString(fr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: !fr })
                  const fmt = floatingNote.sessionContext.format
                  const fmtLabel = fmt === 'in_person' ? (fr ? 'En personne' : 'In person') :
                                   (fmt === 'video' || fmt === 'virtual') ? (fr ? 'Vidéo' : 'Virtual') :
                                   null
                  const parts = [dateStr, timeStr, `${floatingNote.sessionContext.durationMinutes} min`]
                  if (fmtLabel) parts.push(fmtLabel)
                  return parts.join(' · ')
                })()}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400">
                {floatingNote.mode === 'session' ? (fr ? 'Note de séance' : 'Session note') : (fr ? 'Note rapide' : 'Quick note')}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={fr ? 'Réduire' : 'Minimize'}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleExpand}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? (fr ? 'Réduire à la taille normale' : 'Restore size') : (fr ? 'Agrandir' : 'Expand')}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title={fr ? 'Fermer' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {floatingNote.mode === 'session' ? (
            <RichTextEditor
              value={floatingNote.content}
              onChange={updateContent}
              placeholder={fr ? 'Rédigez votre note de séance...' : 'Write your session note...'}
              memberId={floatingNote.memberId}
              locale={locale}
              autoFocus
              milestones={floatingNote.milestones}
              noteTypes={floatingNote.editorNoteTypes}
              memberName={floatingNote.memberName}
            />
          ) : (
            <div className="p-3">
              <textarea
                value={floatingNote.content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={fr ? 'Écrivez une note...' : 'Write a note...'}
                className="w-full h-full min-h-[120px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-none"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {floatingNote.noteType || 'general'}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !floatingNote.content?.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {fr ? 'Enregistrer' : 'Save'}
          </button>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-300">
            <path d="M14 14L8 14L14 8Z" fill="currentColor" />
            <path d="M14 14L11 14L14 11Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-sm mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {fr ? 'Abandonner la note ?' : 'Discard note?'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {fr
                ? 'Vous avez du contenu non enregistré. Voulez-vous l\'enregistrer ou l\'abandonner ?'
                : 'You have unsaved content. Would you like to save or discard it?'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => { setShowConfirm(false); closeFloat() }}
                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                {fr ? 'Abandonner' : 'Discard'}
              </button>
              <button
                type="button"
                onClick={() => { setShowConfirm(false); handleSave() }}
                className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {fr ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
