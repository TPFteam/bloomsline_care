'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  Play,
  X,
  Trash2,
  MessageSquare,
  Calendar,
  Pencil,
  Lightbulb,
  History,
  Tag,
  ChevronDown,
  FileText,
  Loader2,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorialVideo } from '@/components/ui/tutorial-video'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { DEFAULT_NOTE_TYPES } from '@/types/member'
import type { Milestone, MilestoneCategory, MilestoneStatus, MilestoneComment, MilestoneStatusHistory, ProgressNote, MemberSummary, SummaryContent } from '@/types/member'

interface ProgressTabProps {
  memberId: string
  notes: ProgressNote[]
  onNotesUpdate: () => void
  highlightMilestoneId?: string
}

// Move categoryColors outside to prevent recreation on each render
const categoryColors: Record<MilestoneCategory, { bg: string; text: string; dot: string }> = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  therapy_goal: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  behavioral: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  emotional: { bg: 'bg-coral-50', text: 'text-coral-700', dot: 'bg-coral-400' },
  social: { bg: 'bg-mint-50', text: 'text-mint-700', dot: 'bg-mint-400' },
  other: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
}

// Session-linked note interface
interface SessionLinkedNote {
  id: string
  content: string
  created_at: string
  session_id: string | null
  session_date?: string
  session_type?: string
  note_type?: string
}

interface TaggedExcerpt {
  text: string
  html?: string
  sessionDate?: string
  sessionType?: string
  isSession?: boolean
}

// Helper: parse HTML content and extract goal-related excerpts from both
// <mark data-goal-id="..."> inline highlights AND <div data-goal-section data-goal-id="..."> section containers
function extractGoalExcerpts(html: string): { goalId: string; text: string; html?: string }[] {
  if (!html || !html.includes('data-goal-id')) return []
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const results: { goalId: string; text: string; html?: string }[] = []
    const sectionGoalIds = new Set<string>()

    // 1. Extract full goal sections with their HTML preserved
    const sections = doc.querySelectorAll('div[data-goal-section][data-goal-id]')
    sections.forEach((section) => {
      const goalId = section.getAttribute('data-goal-id')
      if (!goalId) return
      sectionGoalIds.add(goalId)
      const text = section.textContent?.trim()
      if (text) {
        results.push({ goalId, text, html: (section as HTMLElement).outerHTML })
      }
    })

    // 2. Extract inline <mark data-goal-id> highlights that are NOT inside a section
    const marks = doc.querySelectorAll('mark[data-goal-id]')
    marks.forEach((mark) => {
      const goalId = mark.getAttribute('data-goal-id')
      const text = mark.textContent?.trim()
      if (!goalId || !text) return
      // Skip if this mark is inside a goal section we already captured
      if (mark.closest('div[data-goal-section]')) return
      results.push({ goalId, text, html: (mark as HTMLElement).outerHTML })
    })

    return results
  } catch {
    return []
  }
}

// Strip HTML tags for plain text preview
function stripHtml(input: string | undefined | null): string {
  if (!input) return ''
  return input.replace(/<[^>]*>/g, '')
}

// Tag color palette — must match RichTextEditor's TAG_COLOR_PALETTE
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

const GOAL_NAVY = '#1e3a5f'
const GOAL_BG = '#dbeafe'
const OLD_GOAL_COLORS = ['#059669','#047857','#065f46','#6d28d9','#2563eb','#d1fae5','#a7f3d0','#6ee7b7','#ede9fe']

function getExcerptTagColor(type: string, allTypes?: string[]) {
  if (allTypes) {
    const idx = allTypes.indexOf(type)
    if (idx >= 0) return TAG_COLOR_PALETTE[idx % TAG_COLOR_PALETTE.length]
  }
  return TAG_COLOR_PALETTE[TAG_COLOR_PALETTE.length - 1]
}

/** Rewrite tag/goal colors in excerpt HTML to match the current palette */
function recolorExcerptHtml(html: string, allTypes?: string[]): string {
  let result = html.replace(/<mark\b([^>]*)\bstyle="([^"]*)"([^>]*)>/gi, (full, before: string, style: string, after: string) => {
    // Rewrite tag colors to current palette
    const tagMatch = (before + after).match(/data-tag="([^"]*)"/)
    if (tagMatch && allTypes) {
      const colors = getExcerptTagColor(tagMatch[1], allTypes)
      let s = style
      s = s.replace(/background-color:\s*#[0-9a-fA-F]{3,8}/, `background-color:${colors.bg}`)
      s = s.replace(/border-bottom:\s*2px\s+solid\s+#[0-9a-fA-F]{3,8}/, `border-bottom:2px solid ${colors.border}`)
      s = s.replace(/--tag-color:\s*#[0-9a-fA-F]{3,8}/, `--tag-color:${colors.border}`)
      s = s.replace(/--tag-bg:\s*#[0-9a-fA-F]{3,8}/, `--tag-bg:${colors.bg}`)
      if (!s.includes('--tag-color')) s += `;--tag-color:${colors.border}`
      if (!s.includes('--tag-bg')) s += `;--tag-bg:${colors.bg}`
      return `<mark${before}style="${s}"${after}>`
    }
    // Inject CSS vars for non-tag marks
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
  // Recolor old goal greens to navy
  result = result.replace(/(<div[^>]*data-goal-section(?!-)[^>]*style=")([^"]*)(")/gi, (_f, pre, style, post) => {
    let s = style; for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY); return pre + s + post
  })
  result = result.replace(/(<div[^>]*data-goal-section-header[^>]*style=")([^"]*)(")/gi, (_f, pre, style, post) => {
    let s = style; for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY); return pre + s + post
  })
  result = result.replace(/(<mark[^>]*data-goal-id[^>]*style=")([^"]*)(")/gi, (_f, pre, style, post) => {
    let s = style; for (const c of OLD_GOAL_COLORS) s = s.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), GOAL_NAVY)
    s = s.replace(/background-color:\s*#[0-9a-fA-F]{3,8}/, `background-color:${GOAL_BG}`); return pre + s + post
  })
  return result
}

// Status label helpers for history timeline
const statusLabels: Record<MilestoneStatus, { en: string; fr: string }> = {
  discovery: { en: 'Discovery', fr: 'Compréhension' },
  building: { en: 'Building', fr: 'Ancrage' },
  thriving: { en: 'Thriving', fr: 'Évolution' },
  independent: { en: 'Independent', fr: 'Autonomie' },
}

// Rank order matching the kanban columns left→right
const statusRank: Record<MilestoneStatus, number> = {
  discovery: 0,
  thriving: 1,
  building: 2,
  independent: 3,
}

function getHistoryDotColor(oldStatus: MilestoneStatus | null, newStatus: MilestoneStatus): string {
  if (!oldStatus) return 'bg-emerald-500' // creation = green
  if (statusRank[newStatus] > statusRank[oldStatus]) return 'bg-emerald-500' // forward = green
  return 'bg-orange-500' // backward = orange
}

// Memoized MilestoneCard component to prevent re-renders
interface MilestoneCardProps {
  milestone: Milestone
  columnId: MilestoneStatus
  commentCount: number
  sessionNoteCount: number
  observationNoteCount: number
  excerptCount: number
  latestNote?: SessionLinkedNote | null
  latestExcerpt?: TaggedExcerpt | null
  hasHistory?: boolean
  onDelete: (id: string) => void
  onOpenDetail: (milestoneId: string) => void
  locale: string
  isHighlighted?: boolean
}

const MilestoneCard = memo(function MilestoneCard({
  milestone,
  columnId,
  commentCount,
  sessionNoteCount,
  observationNoteCount,
  excerptCount,
  latestNote,
  latestExcerpt,
  onDelete,
  onOpenDetail,
  locale,
  isHighlighted,
}: MilestoneCardProps) {
  const [confirmDeleteMilestone, setConfirmDeleteMilestone] = useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('milestoneId', milestone.id)
    e.dataTransfer.setData('sourceColumn', columnId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      id={`milestone-${milestone.id}`}
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          boxShadow: isHighlighted
            ? ['0 0 0 0 rgba(139, 92, 246, 0)', '0 0 20px 8px rgba(139, 92, 246, 0.4)', '0 0 0 0 rgba(139, 92, 246, 0)']
            : '0 0 0 0 rgba(0, 0, 0, 0)'
        }}
        transition={{
          boxShadow: isHighlighted ? { duration: 1.5, repeat: 2 } : {}
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer ${
          isHighlighted ? 'ring-2 ring-violet-400 ring-offset-2' : ''
        }`}
        onClick={() => onOpenDetail(milestone.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm leading-snug">
              {milestone.title}
            </h4>
            {milestone.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {milestone.description}
              </p>
            )}
          </div>
          {/* Delete button on hover */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {confirmDeleteMilestone ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(milestone.id); setConfirmDeleteMilestone(false) }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  {locale === 'fr' ? 'Confirmer' : locale === 'es' ? 'Confirmar' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDeleteMilestone(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteMilestone(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom indicator row */}
        {(commentCount > 0 || (columnId === 'independent' && milestone.achieved_at)) && (
          <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-gray-50">
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-teal-500" title={locale === 'fr' ? 'Commentaires' : 'Comments'}>
                <MessageSquare className="w-3 h-3" />
                {commentCount}
              </span>
            )}
            {columnId === 'independent' && milestone.achieved_at && (
              <span className="flex items-center gap-1 text-[10px] text-violet-500 ml-auto">
                <Sparkles className="w-3 h-3" />
                {new Date(milestone.achieved_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}


      </motion.div>
    </div>
  )
})

// MilestoneDetailModal — full detail view for a milestone
interface MilestoneDetailModalProps {
  milestone: Milestone
  comments: MilestoneComment[]
  sessionNotes: SessionLinkedNote[]
  taggedExcerpts: TaggedExcerpt[]
  noteTypes: { type: string; label: string }[]
  onClose: () => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: MilestoneStatus) => void
  onAddComment: (milestoneId: string, content: string, tag: string) => Promise<void>
  onUpdateComment: (commentId: string, content: string, tag: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onFetchHistory: (milestoneId: string) => Promise<MilestoneStatusHistory[]>
  onUpdateMilestone: (id: string, title: string, description: string) => Promise<void>
  locale: string
  columns: { id: MilestoneStatus; title: string; titleFr: string }[]
}

function MilestoneDetailModal({
  milestone,
  comments,
  sessionNotes,
  taggedExcerpts,
  noteTypes,
  onClose,
  onDelete,
  onUpdateStatus,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onFetchHistory,
  onUpdateMilestone,
  locale,
  columns,
}: MilestoneDetailModalProps) {
  const [newComment, setNewComment] = useState('')
  const [newCommentTag, setNewCommentTag] = useState('')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [editCommentTag, setEditCommentTag] = useState('')
  const [showEditTagPicker, setShowEditTagPicker] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [history, setHistory] = useState<MilestoneStatusHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Inline edit state for title/description
  const [editingDetails, setEditingDetails] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editDescription, setEditDescription] = useState(milestone.description || '')
  const [savingDetails, setSavingDetails] = useState(false)

  // Load history on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingHistory(true)
      const data = await onFetchHistory(milestone.id)
      if (!cancelled) {
        setHistory(data)
        setLoadingHistory(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [milestone.id, onFetchHistory])

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setSavingComment(true)
    await onAddComment(milestone.id, newComment.trim(), newCommentTag)
    setNewComment('')
    setNewCommentTag('')
    setSavingComment(false)
  }

  const handleSaveEdit = async () => {
    if (!editCommentContent.trim() || !editingCommentId) return
    setSavingComment(true)
    await onUpdateComment(editingCommentId, editCommentContent.trim(), editCommentTag)
    setEditingCommentId(null)
    setEditCommentContent('')
    setEditCommentTag('')
    setSavingComment(false)
  }

  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const [commentSearch, setCommentSearch] = useState('')
  const [commentTagFilter, setCommentTagFilter] = useState('')

  const filteredComments = comments.filter(c => {
    if (commentTagFilter && c.tag !== commentTagFilter) return false
    if (commentSearch && !c.content.toLowerCase().includes(commentSearch.toLowerCase())) return false
    return true
  })

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNewComment(val)
    // Detect @ trigger
    const cursor = e.target.selectionStart
    const before = val.slice(0, cursor)
    const atIdx = before.lastIndexOf('@')
    if (atIdx >= 0 && (atIdx === 0 || /\s/.test(before[atIdx - 1]))) {
      const query = before.slice(atIdx + 1)
      if (!/\s/.test(query)) {
        setTagQuery(query.toLowerCase())
        setShowTagDropdown(true)
        return
      }
    }
    setShowTagDropdown(false)
  }

  const insertTag = (nt: { type: string; label: string }) => {
    // Remove the @query from the text
    const cursor = newComment.lastIndexOf('@')
    if (cursor >= 0) {
      setNewComment(newComment.slice(0, cursor).trimEnd() + ' ')
    }
    setNewCommentTag(nt.type)
    setShowTagDropdown(false)
  }

  const filteredTags = noteTypes.filter(nt =>
    nt.label.toLowerCase().includes(tagQuery) || nt.type.toLowerCase().includes(tagQuery)
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showTagDropdown && e.key === 'Escape') {
      setShowTagDropdown(false)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showTagDropdown && filteredTags.length > 0) {
        insertTag(filteredTags[0])
      } else {
        handleAddComment()
      }
    }
  }

  // Tag color helper
  const tagColors: Record<string, { bg: string; text: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-600' },
    symptome: { bg: 'bg-rose-50', text: 'text-rose-600' },
    recurrence: { bg: 'bg-purple-50', text: 'text-purple-600' },
    hypothese: { bg: 'bg-teal-50', text: 'text-teal-600' },
    transfert: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    contre_transfert: { bg: 'bg-pink-50', text: 'text-pink-600' },
    ajustement_envisage: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  }
  const getTagColor = (tag: string) => tagColors[tag] || { bg: 'bg-gray-100', text: 'text-gray-600' }
  const getTagLabel = (tag: string) => noteTypes.find(nt => nt.type === tag)?.label || tag.replace(/_/g, ' ')

  const categoryColor = categoryColors[milestone.category] || categoryColors.general

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Annotation label styles for excerpts */}
        <style>{`
          .rte-read.show-labels mark[data-goal-id],
          .rte-read.show-labels mark[data-tag],
          .rte-read.show-labels mark[data-verbatim] {
            background-color: var(--tag-bg, #f3f4f6) !important;
            border-bottom: none !important;
            border-left: none !important;
            padding: 1px 3px;
            border-radius: 3px;
            color: inherit;
          }
          .rte-read.show-labels mark[data-goal-id]::before {
            content: attr(data-goal-title) ": ";
            font-size: inherit;
            font-style: normal;
            font-weight: 700;
            color: var(--tag-color, #6b7280);
          }
          .rte-read.show-labels mark[data-tag]::before {
            content: attr(data-tag-label) ": ";
            font-size: inherit;
            font-style: normal;
            font-weight: 700;
            color: var(--tag-color, #6b7280);
          }
          .rte-read.show-labels mark[data-verbatim]::before {
            content: attr(data-verbatim) ": ";
            font-size: inherit;
            font-style: normal;
            font-weight: 700;
            color: var(--tag-color, #6b7280);
          }
          /* Compact excerpt overrides for modal context */
          .excerpt-compact div[data-goal-section] {
            margin: 0 !important;
            padding: 0 !important;
            border-left: 2px solid #1e3a5f !important;
            padding-left: 10px !important;
          }
          .excerpt-compact div[data-goal-section-header] {
            font-size: 12px !important;
            font-weight: 600 !important;
            padding: 0 0 4px 0 !important;
            color: #1e3a5f !important;
          }
          .excerpt-compact p {
            margin: 2px 0 !important;
          }
          .excerpt-compact mark {
            font-size: 11px !important;
          }
        `}</style>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editingDetails ? (
                <div className="space-y-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="w-full text-lg font-semibold text-gray-900 px-2 py-1 -ml-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                    rows={2}
                    className="w-full text-sm text-gray-600 px-2 py-1.5 -ml-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDetails(false)
                        setEditTitle(milestone.title)
                        setEditDescription(milestone.description || '')
                      }}
                      className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {locale === 'fr' ? 'Annuler' : 'Cancel'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!editTitle.trim()) return
                        setSavingDetails(true)
                        await onUpdateMilestone(milestone.id, editTitle.trim(), editDescription.trim())
                        setSavingDetails(false)
                        setEditingDetails(false)
                      }}
                      disabled={savingDetails || !editTitle.trim()}
                      className="px-2.5 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {savingDetails ? '...' : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="group/title cursor-pointer -ml-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setEditingDetails(true)}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{milestone.title}</h2>
                    <Pencil className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Actions — move between columns */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {locale === 'fr' ? 'Déplacer vers' : 'Move to'}
          </p>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <button
                key={col.id}
                onClick={() => {
                  if (col.id !== milestone.status) {
                    onUpdateStatus(milestone.id, col.id)
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  col.id === milestone.status
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {locale === 'fr' ? col.titleFr : col.title}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {locale === 'fr' ? 'Commentaires' : locale === 'es' ? 'Comentarios' : 'Comments'}
            <span className="text-gray-400">({comments.length})</span>
          </p>


          {/* Existing comments */}
          {comments.length > 0 && (
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
              {filteredComments.map((comment) => (
                <div key={comment.id} className="group relative p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={savingComment}
                          className="px-2.5 py-1 text-[10px] font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                        >
                          {locale === 'fr' ? 'Enregistrer' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-2.5 py-1 text-[10px] text-gray-500 hover:text-gray-700"
                        >
                          {locale === 'fr' ? 'Annuler' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {comment.tag && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium mb-1.5 ${getTagColor(comment.tag).bg} ${getTagColor(comment.tag).text}`}>
                          @ {getTagLabel(comment.tag)}
                        </span>
                      )}
                      <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(comment.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); setEditCommentTag(comment.tag || '') }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {deletingCommentId === comment.id ? (
                            <button
                              onClick={() => { onDeleteComment(comment.id); setDeletingCommentId(null) }}
                              className="px-1.5 py-0.5 text-[10px] text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            >
                              {locale === 'fr' ? 'Confirmer' : 'Confirm'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeletingCommentId(comment.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New comment input */}
          <div className="space-y-2">
            {/* Tag selector */}
            <div className="flex flex-wrap gap-1">
              {noteTypes.map((nt) => {
                const colors = getTagColor(nt.type)
                const isActive = newCommentTag === nt.type
                return (
                  <button
                    key={nt.type}
                    type="button"
                    onClick={() => setNewCommentTag(isActive ? '' : nt.type)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                      isActive
                        ? `${colors.bg} ${colors.text} ring-1 ring-current`
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    @ {nt.label}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={handleCommentChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 150)}
                  placeholder={locale === 'fr' ? 'Ajouter un commentaire... (@ pour tag)' : 'Add a comment... (@ to tag)'}
                  rows={1}
                  className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 resize-none"
                />
                {/* @ tag dropdown */}
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                    {filteredTags.map((nt) => {
                      const colors = getTagColor(nt.type)
                      return (
                        <button
                          key={nt.type}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertTag(nt)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full ${colors.bg} ring-1 ring-current ${colors.text}`} />
                          {nt.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || savingComment}
                className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors self-end"
              >
                {savingComment ? '...' : locale === 'fr' ? 'Envoyer' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            {locale === 'fr' ? 'Historique' : 'History'}
          </p>
          {loadingHistory ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-gray-400 py-1">
              {locale === 'fr' ? 'Aucun historique' : 'No history yet'}
            </p>
          ) : (
            <div className="relative space-y-0">
              {history.length > 1 && (
                <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-violet-200" />
              )}
              {history.map((entry) => {
                const isCreation = entry.old_status === null
                const dotColor = getHistoryDotColor(entry.old_status, entry.new_status)
                const date = new Date(entry.changed_at).toLocaleDateString(
                  locale === 'fr' ? 'fr-FR' : 'en-US',
                  { day: 'numeric', month: 'short', year: 'numeric' }
                )
                return (
                  <div key={entry.id} className="flex items-start gap-2 py-1.5 relative">
                    <div className={`w-[11px] h-[11px] rounded-full ${dotColor} border-2 border-white shrink-0 mt-0.5 z-10`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug">
                        {isCreation ? (
                          <>
                            {locale === 'fr' ? 'Créé dans ' : 'Created in '}
                            <span className="font-medium">
                              {locale === 'fr' ? statusLabels[entry.new_status].fr : statusLabels[entry.new_status].en}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">
                              {locale === 'fr' ? statusLabels[entry.old_status!].fr : statusLabels[entry.old_status!].en}
                            </span>
                            {' → '}
                            <span className="font-medium">
                              {locale === 'fr' ? statusLabels[entry.new_status].fr : statusLabels[entry.new_status].en}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer — Delete */}
        <div className="px-6 py-4 flex items-center justify-end">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">
                {locale === 'fr' ? 'Supprimer ?' : 'Delete?'}
              </span>
              <button
                onClick={() => { onDelete(milestone.id); onClose() }}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              >
                {locale === 'fr' ? 'Confirmer' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {locale === 'fr' ? 'Supprimer' : 'Delete'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProgressTab({ memberId, notes, onNotesUpdate, highlightMilestoneId }: ProgressTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [milestoneComments, setMilestoneComments] = useState<Record<string, MilestoneComment[]>>({})
  const [milestoneSessionNotes, setMilestoneSessionNotes] = useState<Record<string, SessionLinkedNote[]>>({})
  const [milestoneTaggedExcerpts, setMilestoneTaggedExcerpts] = useState<Record<string, TaggedExcerpt[]>>({})
  const [editorNoteTypes, setEditorNoteTypes] = useState<{ type: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialStatus, setInitialStatus] = useState<MilestoneStatus>('discovery')
  const [saving, setSaving] = useState(false)
  const [dragOverColumn, setDragOverColumn] = useState<MilestoneStatus | null>(null)

  // Detail modal state
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)

  // Goal suggestions from Bloom Pulse
  const [latestSummary, setLatestSummary] = useState<MemberSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [generatingPulse, setGeneratingPulse] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchMilestones()
    fetchLatestSummary()
  }, [memberId])

  const fetchLatestSummary = async () => {
    setLoadingSummary(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/members/${memberId}/summary`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLatestSummary(data.summary)
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
    } finally {
      setLoadingSummary(false)
    }
  }

  const generatePulseInline = async () => {
    setGeneratingPulse(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/members/${memberId}/summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      })

      const data = await response.json()
      if (response.ok) {
        setLatestSummary(data.summary)
        toast.success(locale === 'fr' ? 'Bloom Pulse généré' : locale === 'es' ? 'Bloom Pulse generado' : 'Bloom Pulse generated')
      } else if (data.code === 'INSUFFICIENT_DATA') {
        toast.error(locale === 'fr' ? 'Pas assez de données' : locale === 'es' ? 'Datos insuficientes' : 'Not enough data yet')
      } else {
        toast.error(data.error || (locale === 'fr' ? 'Impossible de générer' : 'Failed to generate'))
      }
    } catch {
      toast.error(locale === 'fr' ? 'Une erreur est survenue' : 'Something went wrong')
    } finally {
      setGeneratingPulse(false)
    }
  }

  // Scroll to highlighted milestone
  useEffect(() => {
    if (highlightMilestoneId) {
      // Wait for the DOM to update
      setTimeout(() => {
        const element = document.getElementById(`milestone-${highlightMilestoneId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [highlightMilestoneId])

  const fetchMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })

      if (error && error.code !== '42P01') throw error

      // Map old data format to new format (backwards compatibility)
      const mappedData = (data || []).map(m => {
        // Map old status values to new ones
        const rawStatus = m.status as string
        let status: MilestoneStatus
        if (rawStatus === 'planned') status = 'discovery'
        else if (rawStatus === 'in_progress') status = 'building'
        else if (rawStatus === 'achieved') status = 'independent'
        else if (['discovery', 'building', 'thriving', 'independent'].includes(rawStatus)) status = rawStatus as MilestoneStatus
        else status = m.achieved ? 'independent' : 'discovery'

        return {
          ...m,
          status,
          shared_with_member: m.shared_with_member ?? false
        }
      })

      setMilestones(mappedData)

      // Fetch comments and session-linked notes for all milestones
      if (mappedData.length > 0) {
        const milestoneIds = mappedData.map(m => m.id)

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('milestone_comments')
          .select('*')
          .in('milestone_id', milestoneIds)
          .order('created_at', { ascending: false })

        if (!commentsError && commentsData) {
          // Group comments by milestone_id
          const groupedComments: Record<string, MilestoneComment[]> = {}
          commentsData.forEach(comment => {
            if (!groupedComments[comment.milestone_id]) {
              groupedComments[comment.milestone_id] = []
            }
            groupedComments[comment.milestone_id].push(comment)
          })
          setMilestoneComments(groupedComments)
        }

        // Fetch all notes linked to milestones
        const { data: sessionNotesData, error: sessionNotesError } = await supabase
          .from('progress_notes')
          .select('id, content, created_at, session_id, milestone_id, note_type, sessions(scheduled_at, session_type)')
          .in('milestone_id', milestoneIds)
          .order('created_at', { ascending: false })

        if (!sessionNotesError && sessionNotesData) {
          // Group notes by milestone_id
          const groupedNotes: Record<string, SessionLinkedNote[]> = {}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessionNotesData.forEach((note: any) => {
            if (note.milestone_id) {
              if (!groupedNotes[note.milestone_id]) {
                groupedNotes[note.milestone_id] = []
              }
              // Handle sessions relation - it may be an array or single object
              const sessionData = Array.isArray(note.sessions) ? note.sessions[0] : note.sessions
              groupedNotes[note.milestone_id].push({
                id: note.id,
                content: note.content,
                created_at: note.created_at,
                session_id: note.session_id,
                session_date: sessionData?.scheduled_at,
                session_type: sessionData?.session_type,
                note_type: note.note_type,
              })
            }
          })
          setMilestoneSessionNotes(groupedNotes)
        }

        // Fetch inline goal-tagged excerpts from all notes (observations + session summaries)
        const { data: summaryNotes } = await supabase
          .from('progress_notes')
          .select('content, session_id, sessions(scheduled_at, session_type)')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false })

        if (summaryNotes) {
          const grouped: Record<string, TaggedExcerpt[]> = {}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          summaryNotes.forEach((note: any) => {
            const excerpts = extractGoalExcerpts(note.content)
            if (excerpts.length === 0) return
            const sessionData = Array.isArray(note.sessions) ? note.sessions[0] : note.sessions
            for (const { goalId, text, html } of excerpts) {
              if (!grouped[goalId]) grouped[goalId] = []
              grouped[goalId].push({
                text,
                html,
                sessionDate: sessionData?.scheduled_at,
                sessionType: sessionData?.session_type,
                isSession: !!note.session_id,
              })
            }
          })
          setMilestoneTaggedExcerpts(grouped)
        }
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Build note types list for inline tagging in comments
  useEffect(() => {
    const buildNoteTypes = async () => {
      const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined
      const types: { type: string; label: string }[] = DEFAULT_NOTE_TYPES.map(nt => ({
        type: nt,
        label: noteTypeLabels?.[nt] || nt,
      }))
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('custom_note_types')
          .select('type_name')
          .eq('practitioner_id', user.id)
          .order('created_at')
        if (data) {
          for (const d of data) {
            if (!types.some(existing => existing.type === d.type_name)) {
              types.push({ type: d.type_name, label: noteTypeLabels?.[d.type_name] || d.type_name.replace(/_/g, ' ') })
            }
          }
        }
      }
      setEditorNoteTypes(types)
    }
    buildNoteTypes()
  }, [supabase, t])

  const [newlyAddedGoalId, setNewlyAddedGoalId] = useState<string | null>(null)

  const handleQuickAddGoal = async (suggestion: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          title: suggestion,
          description: null,
          category: 'general',
          target_date: null,
          status: 'discovery',
          achieved: false,
          achieved_at: null,
          shared_with_member: false,
        })
        .select('id')
        .single()

      if (error) throw error

      // Log initial creation in history
      if (data?.id) {
        await supabase.from('milestone_status_history').insert({
          milestone_id: data.id,
          old_status: null,
          new_status: 'discovery',
        })
      }

      toast.success(locale === 'fr' ? 'Axe de travail ajouté' : locale === 'es' ? 'Objetivo añadido' : 'Goal added')

      // Set the newly added goal ID for highlighting
      if (data?.id) {
        setNewlyAddedGoalId(data.id)
        // Clear highlight after animation
        setTimeout(() => setNewlyAddedGoalId(null), 3000)
      }

      await fetchMilestones()

      // Scroll to the new goal after DOM updates
      if (data?.id) {
        setTimeout(() => {
          const element = document.getElementById(`milestone-${data.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 150)
      }
    } catch (error) {
      console.error('Error adding goal:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'ajout' : 'Failed to add goal')
    }
  }

  const handleAddMilestone = async () => {
    if (!title.trim()) {
      toast.error(locale === 'fr' ? 'Le titre est requis' : 'Title is required')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newMilestone, error } = await supabase
        .from('milestones')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category: 'general',
          target_date: null,
          status: initialStatus,
          achieved: initialStatus === 'independent',
          achieved_at: initialStatus === 'independent' ? new Date().toISOString() : null,
          shared_with_member: false,
        })
        .select('id')
        .single()

      if (error) throw error

      // Log initial creation in history
      if (newMilestone) {
        await supabase.from('milestone_status_history').insert({
          milestone_id: newMilestone.id,
          old_status: null,
          new_status: initialStatus,
        })
      }

      toast.success(locale === 'fr' ? 'Parcours ajouté' : 'Journey added')
      setShowAddMilestone(false)
      setTitle('')
      setDescription('')
      setInitialStatus('discovery')
      fetchMilestones()
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast.error(locale === 'fr' ? 'Impossible d\'ajouter le parcours' : 'Failed to add journey')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = useCallback(async (milestoneId: string, newStatus: MilestoneStatus, oldStatus?: MilestoneStatus) => {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        achieved: newStatus === 'independent',
      }

      if (newStatus === 'independent') {
        updateData.achieved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', milestoneId)

      if (error) throw error

      // Log status change in history
      if (oldStatus) {
        await supabase.from('milestone_status_history').insert({
          milestone_id: milestoneId,
          old_status: oldStatus,
          new_status: newStatus,
        })
      }

      const statusMessages: Record<MilestoneStatus, string> = locale === 'fr' ? {
        discovery: 'Déplacé vers Découverte',
        building: 'Déplacé vers Construction',
        thriving: 'Déplacé vers Épanouissement',
        independent: 'Parcours terminé ! 🎉',
      } : {
        discovery: 'Moved to Discovery',
        building: 'Moved to Building',
        thriving: 'Moved to Thriving',
        independent: 'Journey completed! 🎉',
      }
      toast.success(statusMessages[newStatus])
      fetchMilestones()
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error(locale === 'fr' ? 'Impossible de mettre à jour le parcours' : 'Failed to update journey')
    }
  }, [supabase, locale])

  const handleDelete = useCallback(async (milestoneId: string) => {
    if (!confirm(locale === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce parcours ?' : 'Are you sure you want to delete this journey?')) return

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Parcours supprimé' : 'Journey deleted')
      fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error(locale === 'fr' ? 'Impossible de supprimer le parcours' : 'Failed to delete journey')
    }
  }, [supabase, locale])

  const handleUpdateMilestone = useCallback(async (milestoneId: string, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ title, description: description || null, updated_at: new Date().toISOString() })
        .eq('id', milestoneId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Objectif mis à jour' : 'Goal updated')
      fetchMilestones()
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error(locale === 'fr' ? 'Échec de la mise à jour' : 'Failed to update goal')
    }
  }, [supabase, locale])

  const handleAddComment = useCallback(async (milestoneId: string, content: string, tag: string = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('milestone_comments')
        .insert({
          milestone_id: milestoneId,
          practitioner_id: user.id,
          content,
          tag: tag || null,
        })

      if (error) throw error

      toast.success(locale === 'fr' ? 'Commentaire ajouté' : 'Comment added')
      fetchMilestones()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'ajout' : 'Failed to add comment')
    }
  }, [supabase, locale])

  const handleUpdateComment = useCallback(async (commentId: string, content: string, tag: string = '') => {
    try {
      const { error } = await supabase
        .from('milestone_comments')
        .update({ content, tag: tag || null, updated_at: new Date().toISOString() })
        .eq('id', commentId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Commentaire mis à jour' : 'Comment updated')
      fetchMilestones()
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error(locale === 'fr' ? 'Échec de la mise à jour' : 'Failed to update comment')
    }
  }, [supabase, locale])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('milestone_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Commentaire supprimé' : 'Comment deleted')
      fetchMilestones()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error(locale === 'fr' ? 'Échec de la suppression' : 'Failed to delete comment')
    }
  }, [supabase, locale])

  const handleFetchHistory = useCallback(async (milestoneId: string): Promise<MilestoneStatusHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('milestone_status_history')
        .select('*')
        .eq('milestone_id', milestoneId)
        .order('changed_at', { ascending: true })

      if (error) throw error
      return (data || []) as MilestoneStatusHistory[]
    } catch (error) {
      console.error('Error fetching history:', error)
      return []
    }
  }, [supabase])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent, columnId: MilestoneStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetColumn: MilestoneStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    const milestoneId = e.dataTransfer.getData('milestoneId')
    const sourceColumn = e.dataTransfer.getData('sourceColumn') as MilestoneStatus

    if (sourceColumn !== targetColumn && milestoneId) {
      handleUpdateStatus(milestoneId, targetColumn, sourceColumn)
    }
  }, [handleUpdateStatus])

  // Group milestones by status (4 journey stages)
  const discoveryMilestones = milestones.filter(m => m.status === 'discovery')
  const buildingMilestones = milestones.filter(m => m.status === 'building')
  const thrivingMilestones = milestones.filter(m => m.status === 'thriving')
  const independentMilestones = milestones.filter(m => m.status === 'independent')

  const columns: { id: MilestoneStatus; title: string; titleFr: string; description: string; descriptionFr: string; icon: typeof Clock; color: string; bgColor: string; borderColor: string; items: Milestone[] }[] = [
    {
      id: 'discovery',
      title: 'Discovery',
      titleFr: 'Compréhension',
      description: 'Understanding needs, building trust, and identifying areas for growth together.',
      descriptionFr: 'Mettre des mots sur ce qui se joue et comprendre ses mécanismes.',
      icon: Target,
      color: 'text-emerald-500',
      bgColor: 'from-emerald-50/50 to-emerald-100/30',
      borderColor: 'border-emerald-200/50',
      items: discoveryMilestones,
    },
    {
      id: 'thriving',
      title: 'Thriving',
      titleFr: 'Évolution',
      description: 'Maintaining progress and consistently applying learned strategies in daily life.',
      descriptionFr: 'Expérimenter de nouvelles façons de penser, d\'agir et de réagir.',
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'from-emerald-200/50 to-emerald-300/30',
      borderColor: 'border-emerald-400/50',
      items: thrivingMilestones,
    },
    {
      id: 'building',
      title: 'Building',
      titleFr: 'Ancrage',
      description: 'Actively working through challenges and developing new skills and coping strategies.',
      descriptionFr: 'Installer des repères stables pour mieux traverser les situations.',
      icon: Play,
      color: 'text-emerald-600',
      bgColor: 'from-emerald-100/50 to-emerald-200/30',
      borderColor: 'border-emerald-300/50',
      items: buildingMilestones,
    },
    {
      id: 'independent',
      title: 'Independent',
      titleFr: 'Autonomie',
      description: 'Confidently self-managing with minimal guidance, ready to continue the journey solo.',
      descriptionFr: 'Mobiliser ses ressources de manière durable et indépendante.',
      icon: Sparkles,
      color: 'text-emerald-800',
      bgColor: 'from-emerald-300/50 to-emerald-400/30',
      borderColor: 'border-emerald-500/50',
      items: independentMilestones,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="text-gray-500 text-sm">{locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}</span>
        </div>
      </div>
    )
  }

  // Get suggestions from summary
  const summaryContent = latestSummary?.summary_content as SummaryContent | undefined
  const suggestions = [
    ...(summaryContent?.recommendations || []),
    ...(summaryContent?.next_steps || []),
  ].slice(0, 5) // Limit to 5 suggestions

  // Check if summary is older than 7 days
  const isSummaryStale = latestSummary
    ? (Date.now() - new Date(latestSummary.generated_at).getTime()) > 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <div className="space-y-6">
      {/* Goal Suggestions from Bloom Pulse */}
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-500/5 to-teal-500/10 rounded-2xl border border-teal-500/20 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {locale === 'fr' ? 'Axes suggérés' : locale === 'es' ? 'Objetivos sugeridos' : 'Suggested Goals'}
                  </h3>
                  {latestSummary && (
                    <p className="text-xs text-gray-500">
                      {locale === 'fr' ? 'Basé sur Bloom Pulse' : locale === 'es' ? 'Basado en Bloom Pulse' : 'Based on Bloom Pulse'}
                      {isSummaryStale && (
                        <span className="text-amber-600 ml-1">
                          ({locale === 'fr' ? 'mis à jour il y a plus de 7 jours' : locale === 'es' ? 'actualizado hace más de 7 días' : 'updated over 7 days ago'})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingSummary ? (
              <div className="flex items-center gap-2 py-3">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">
                  {locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
                </span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-teal-500/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2">{suggestion}</p>
                    </div>
                    <button
                      onClick={() => handleQuickAddGoal(suggestion)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {locale === 'fr' ? 'Aucune suggestion disponible' : locale === 'es' ? 'Sin sugerencias disponibles' : 'No suggestions available'}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {locale === 'fr'
                    ? 'Générez un Bloom Pulse pour obtenir des recommandations personnalisées'
                    : locale === 'es'
                    ? 'Genere un Bloom Pulse para obtener recomendaciones personalizadas'
                    : 'Generate a Bloom Pulse to get personalized recommendations'}
                </p>
                <button
                  onClick={generatePulseInline}
                  disabled={generatingPulse}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {generatingPulse ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {locale === 'fr' ? 'Génération...' : locale === 'es' ? 'Generando...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Générer Bloom Pulse' : locale === 'es' ? 'Generar Bloom Pulse' : 'Generate Bloom Pulse'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* View recommendations button when hidden */}
      <div className="flex items-center gap-2">
        {!showSuggestions && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowSuggestions(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-600 bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/20 rounded-xl transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            {locale === 'fr' ? 'Voir les recommandations' : locale === 'es' ? 'Ver recomendaciones' : 'View recommendations'}
          </motion.button>
        )}
        <TutorialVideo
          videos={[
            {
              url: 'https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/ajouter%20une%20note%20dobjctif.mov',
              title: locale === 'fr' ? 'Comment ajouter une note à un axe de travail' : 'How to add a note to a goal',
            },
            {
              url: 'https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/deplacer%20un%20axe%20de%20travail.mov',
              title: locale === 'fr' ? 'Comment déplacer un axe dans le tableau' : 'How to move a goal on the board',
            },
          ]}
        />
      </div>

      {/* Add Milestone Form */}
      <AnimatePresence>
        {showAddMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl  border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-lavender-500" />
                  {locale === 'fr' ? 'Nouvel axe de travail' : 'Add New Goal'}
                </h3>
                <button
                  onClick={() => setShowAddMilestone(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Titre *' : 'Title *'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={locale === 'fr' ? 'ex: Pratiquer des exercices de respiration' : 'e.g., Practice breathing exercises daily'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={locale === 'fr' ? 'Détails supplémentaires sur cet axe de travail...' : 'Additional details about this goal...'}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Statut initial' : 'Initial Status'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setInitialStatus('discovery')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        initialStatus === 'discovery'
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {initialStatus === 'discovery' && <CheckCircle className="w-4 h-4" />}
                      {locale === 'fr' ? 'Compréhension' : 'Discovery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialStatus('thriving')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        initialStatus === 'thriving'
                          ? 'bg-emerald-200 text-emerald-800 border-2 border-emerald-500 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {initialStatus === 'thriving' && <CheckCircle className="w-4 h-4" />}
                      {locale === 'fr' ? 'Évolution' : 'Thriving'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialStatus('building')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        initialStatus === 'building'
                          ? 'bg-emerald-300 text-emerald-900 border-2 border-emerald-600 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {initialStatus === 'building' && <CheckCircle className="w-4 h-4" />}
                      {locale === 'fr' ? 'Ancrage' : 'Building'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialStatus('independent')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        initialStatus === 'independent'
                          ? 'bg-emerald-400 text-emerald-950 border-2 border-emerald-700 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {initialStatus === 'independent' && <CheckCircle className="w-4 h-4" />}
                      {locale === 'fr' ? 'Autonomie' : 'Independent'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowAddMilestone(false)} className="rounded-xl">
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleAddMilestone}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                >
                  {saving ? (locale === 'fr' ? 'Ajout...' : 'Adding...') : (locale === 'fr' ? 'Ajouter' : 'Add Journey')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Journey Button */}
      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={() => setShowAddMilestone(!showAddMilestone)}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          {locale === 'fr' ? 'Axe de travail' : 'Add Goal'}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {columns.map((column) => {
            const Icon = column.icon
            return (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-b ${column.bgColor} rounded-2xl border ${column.borderColor} flex flex-col`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${column.color}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{locale === 'fr' ? column.titleFr : column.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-white ${column.color}`}>
                      {column.items.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {locale === 'fr' ? column.descriptionFr : column.description}
                  </p>
                </div>

                {/* Column Content - Drop Zone */}
                <div
                  className={`p-3 space-y-3 transition-all min-h-[100px] ${
                    dragOverColumn === column.id ? 'bg-white/30 ring-2 ring-inset ring-gray-300 ring-dashed' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <AnimatePresence>
                    {column.items.map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        columnId={column.id}
                        commentCount={(milestoneComments[milestone.id] || []).length}
                        sessionNoteCount={(milestoneSessionNotes[milestone.id] || []).filter(n => n.session_id).length}
                        observationNoteCount={(milestoneSessionNotes[milestone.id] || []).filter(n => !n.session_id).length}
                        latestNote={(milestoneSessionNotes[milestone.id] || [])[0] || null}
                        latestExcerpt={(milestoneTaggedExcerpts[milestone.id] || [])[0] || null}
                        excerptCount={(milestoneTaggedExcerpts[milestone.id] || []).length}
                        onDelete={handleDelete}
                        onOpenDetail={setSelectedMilestoneId}
                        locale={locale}
                        isHighlighted={highlightMilestoneId === milestone.id || newlyAddedGoalId === milestone.id}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Empty Column State */}
                  {column.items.length === 0 && dragOverColumn !== column.id && (
                    <div className="text-center py-8 px-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                        <Icon className={`w-5 h-5 ${column.color} opacity-50`} />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">
                        {locale === 'fr' ? 'Aucun axe de travail' : 'No goals yet'}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {locale === 'fr' ? 'Glissez ou ajoutez un axe' : 'Drag or add a goal here'}
                      </p>
                    </div>
                  )}

                  {/* Drop indicator */}
                  {dragOverColumn === column.id && column.items.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 font-medium">
                        {locale === 'fr' ? 'Déposez ici' : 'Drop here'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Add Card Button */}
                <div className="p-3 pt-0">
                  <button
                    onClick={() => {
                      setInitialStatus(column.id)
                      setShowAddMilestone(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'fr' ? 'Ajouter un axe de travail' : 'Add a goal'}</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
      </div>

      {/* Milestone Detail Modal */}
      <AnimatePresence>
        {selectedMilestoneId && (() => {
          const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId)
          if (!selectedMilestone) return null
          return (
            <MilestoneDetailModal
              milestone={selectedMilestone}
              comments={milestoneComments[selectedMilestoneId] || []}
              sessionNotes={milestoneSessionNotes[selectedMilestoneId] || []}
              taggedExcerpts={milestoneTaggedExcerpts[selectedMilestoneId] || []}
              noteTypes={editorNoteTypes}
              onClose={() => setSelectedMilestoneId(null)}
              onDelete={handleDelete}
              onUpdateStatus={(id, status) => {
                handleUpdateStatus(id, status, selectedMilestone.status)
              }}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onFetchHistory={handleFetchHistory}
              onUpdateMilestone={handleUpdateMilestone}
              locale={locale}
              columns={columns.map(c => ({ id: c.id, title: c.title, titleFr: c.titleFr }))}
            />
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
