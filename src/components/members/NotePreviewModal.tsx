'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Loader2, Calendar, Link as LinkIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser-client'

interface NotePreviewModalProps {
  noteId: string | null
  locale: string
  onClose: () => void
}

interface NoteRow {
  id: string
  title: string | null
  content: string
  created_at: string
  session_id: string | null
  note_type: string | null
}

interface SessionRow {
  id: string
  scheduled_at: string
  session_type: string | null
}

export function NotePreviewModal({ noteId, locale, onClose }: NotePreviewModalProps) {
  const [note, setNote] = useState<NoteRow | null>(null)
  const [session, setSession] = useState<SessionRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!noteId) {
      setNote(null)
      setSession(null)
      return
    }
    let cancelled = false
    const sb = createClient()
    setLoading(true)
    setError(null)
    ;(async () => {
      const { data, error } = await sb
        .from('progress_notes')
        .select('id, title, content, created_at, session_id, note_type')
        .eq('id', noteId)
        .maybeSingle()
      if (cancelled) return
      if (error || !data) {
        setError(locale === 'fr' ? 'Note introuvable' : 'Note not found')
        setLoading(false)
        return
      }
      setNote(data as NoteRow)
      if (data.session_id) {
        const { data: s } = await sb
          .from('sessions')
          .select('id, scheduled_at, session_type')
          .eq('id', data.session_id)
          .maybeSingle()
        if (!cancelled && s) setSession(s as SessionRow)
      } else {
        setSession(null)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [noteId, locale])

  useEffect(() => {
    if (!noteId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [noteId, onClose])

  const localeStr = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(localeStr, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <AnimatePresence>
      {noteId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .note-preview-content mark[data-tag] {
                background-color: var(--tag-bg, #f3f4f6);
                padding: 1px 3px;
                border-radius: 3px;
              }
              .note-preview-content mark[data-tag]::before {
                content: attr(data-tag-label) ": ";
                font-weight: 700;
                color: var(--tag-color, #6b7280);
              }
              .note-preview-content mark[data-verbatim]:not([data-verbatim-type="mention"]) {
                background-color: #f0f9ff;
                color: #0369a1;
                font-style: italic;
                padding: 1px 4px;
                border-radius: 3px;
              }
              .note-preview-content p { margin: 0.5rem 0; }
              .note-preview-content h1, .note-preview-content h2, .note-preview-content h3 {
                font-weight: 600;
                margin: 0.75rem 0 0.25rem;
              }
              .note-preview-content ul, .note-preview-content ol {
                padding-left: 1.5rem;
                margin: 0.5rem 0;
              }
            `}</style>
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug truncate">
                    {note?.title || (locale === 'fr' ? 'Note' : 'Note')}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {note && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(session?.scheduled_at || note.created_at)}
                      </span>
                    )}
                    {session && (
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <LinkIcon className="w-3 h-3" />
                        {locale === 'fr' ? 'Séance liée' : locale === 'es' ? 'Sesión vinculada' : 'Linked session'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                aria-label={locale === 'fr' ? 'Fermer' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              {error && (
                <div className="text-sm text-gray-500 py-8 text-center">{error}</div>
              )}
              {!loading && !error && note && (
                <div
                  className="note-preview-content text-sm text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: note.content || '' }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
