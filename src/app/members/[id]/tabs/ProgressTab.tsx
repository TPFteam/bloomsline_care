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
  Lock,
  ChevronRight,
  ImagePlus,
  Calendar,
  Pencil,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Milestone, MilestoneCategory, MilestoneStatus, MilestoneComment, ProgressNote, NoteType, MemberSummary, SummaryContent } from '@/types/member'

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
}

// Memoized MilestoneCard component to prevent re-renders
interface MilestoneCardProps {
  milestone: Milestone
  columnId: MilestoneStatus
  comments: MilestoneComment[]
  sessionNotes: SessionLinkedNote[]
  onToggleShare: (id: string, shared: boolean) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: MilestoneStatus) => void
  onAddComment: (milestoneId: string, content: string) => Promise<void>
  onUpdateComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  categoryLabel: string
  locale: string
  isHighlighted?: boolean
}

const MilestoneCard = memo(function MilestoneCard({
  milestone,
  columnId,
  comments,
  sessionNotes,
  onToggleShare,
  onDelete,
  onUpdateStatus,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  categoryLabel,
  locale,
  isHighlighted,
}: MilestoneCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('milestoneId', milestone.id)
    e.dataTransfer.setData('sourceColumn', columnId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setSavingComment(true)
    await onAddComment(milestone.id, newComment.trim())
    setNewComment('')
    setSavingComment(false)
  }

  const handleSaveEdit = async () => {
    if (!editCommentContent.trim() || !editingCommentId) return
    setSavingComment(true)
    await onUpdateComment(editingCommentId, editCommentContent.trim())
    setEditingCommentId(null)
    setEditCommentContent('')
    setSavingComment(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
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
        className={`bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group ${
          isHighlighted ? 'ring-2 ring-violet-400 ring-offset-2' : ''
        }`}
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                comments.length > 0
                  ? 'text-blue-500 bg-blue-50'
                  : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 hover:bg-blue-50'
              }`}
              title={locale === 'fr' ? 'Commentaires' : 'Comments'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {comments.length > 0 && (
                <span className="text-[10px] font-medium">{comments.length}</span>
              )}
            </button>
            <button
              onClick={() => onDelete(milestone.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Comments Preview (show latest comment when collapsed) */}
        {comments.length > 0 && !showComments && (
          <div
            onClick={() => setShowComments(true)}
            className="mt-2 p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
          >
            <p className="text-xs text-blue-700 line-clamp-2">{comments[0].content}</p>
            <div className="flex items-center justify-between mt-1">
              {comments.length > 1 ? (
                <p className="text-[10px] text-blue-500">
                  +{comments.length - 1} {locale === 'fr' ? 'autre(s)' : 'more'}
                </p>
              ) : <span />}
              <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" />
                {locale === 'fr' ? 'Ajouter' : 'Add'}
              </p>
            </div>
          </div>
        )}

        {/* Add Comment Button (when no comments and collapsed) */}
        {comments.length === 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{locale === 'fr' ? 'Ajouter une note' : 'Add note'}</span>
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 space-y-2">
            {/* Existing Comments */}
            {comments.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="group/comment p-2 bg-gray-50 rounded-lg">
                    {editingCommentId === comment.id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          rows={2}
                          autoFocus
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                        />
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditCommentContent('')
                            }}
                            className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-700 rounded"
                          >
                            {locale === 'fr' ? 'Annuler' : 'Cancel'}
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={savingComment || !editCommentContent.trim()}
                            className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            {savingComment ? '...' : (locale === 'fr' ? 'Enregistrer' : 'Save')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-gray-700 flex-1">{comment.content}</p>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-all shrink-0">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditCommentContent(comment.content)
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 rounded"
                              title={locale === 'fr' ? 'Modifier' : 'Edit'}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteComment(comment.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                              title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Comment */}
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={locale === 'fr' ? 'Ajouter une note...' : 'Add a note...'}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none resize-none"
                rows={2}
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowComments(false)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                {locale === 'fr' ? 'Fermer' : 'Close'}
              </button>
              <button
                onClick={handleAddComment}
                disabled={savingComment || !newComment.trim()}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {savingComment
                  ? (locale === 'fr' ? 'Ajout...' : 'Adding...')
                  : (locale === 'fr' ? 'Ajouter' : 'Add')
                }
              </button>
            </div>

            {/* Session-linked notes */}
            {sessionNotes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {locale === 'fr' ? 'Notes de séances' : 'Session notes'}
                </p>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {sessionNotes.map((note) => (
                    <div key={note.id} className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs text-gray-700 line-clamp-2">{note.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {note.session_date ? new Date(note.session_date).toLocaleDateString() : new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session-linked notes preview (when comments collapsed) */}
        {sessionNotes.length > 0 && !showComments && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {locale === 'fr' ? 'Notes de séances' : 'Session notes'} ({sessionNotes.length})
            </p>
            <p className="text-xs text-gray-700 line-clamp-2">{sessionNotes[0].content}</p>
          </div>
        )}

        {/* Independent Date */}
        {columnId === 'independent' && milestone.achieved_at && !showComments && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-violet-600">
            <Sparkles className="w-3 h-3" />
            <span>{locale === 'fr' ? 'Validé le' : 'Validated'} {new Date(milestone.achieved_at).toLocaleDateString()}</span>
          </div>
        )}

        {/* Drag hint */}
        {!showComments && (
          <div className="mt-3 pt-2 border-t border-gray-50 text-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              {locale === 'fr' ? 'Glisser pour déplacer' : 'Drag to move'}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
})

// Note type colors
const noteTypeColors: Record<NoteType, { bg: string; text: string }> = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700' },
  assessment: { bg: 'bg-blue-50', text: 'text-blue-700' },
  treatment_plan: { bg: 'bg-purple-50', text: 'text-purple-700' },
  milestone: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  concern: { bg: 'bg-red-50', text: 'text-red-700' },
  observation: { bg: 'bg-amber-50', text: 'text-amber-700' },
}

export default function ProgressTab({ memberId, notes, onNotesUpdate, highlightMilestoneId }: ProgressTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [milestoneComments, setMilestoneComments] = useState<Record<string, MilestoneComment[]>>({})
  const [milestoneSessionNotes, setMilestoneSessionNotes] = useState<Record<string, SessionLinkedNote[]>>({})
  const [loading, setLoading] = useState(true)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialStatus, setInitialStatus] = useState<MilestoneStatus>('discovery')
  const [saving, setSaving] = useState(false)
  const [dragOverColumn, setDragOverColumn] = useState<MilestoneStatus | null>(null)

  // Notes state
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [isPrivate, setIsPrivate] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [noteImages, setNoteImages] = useState<File[]>([])
  const [noteImagePreviews, setNoteImagePreviews] = useState<string[]>([])
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Goal suggestions from Bloom Pulse
  const [latestSummary, setLatestSummary] = useState<MemberSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
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

        // Fetch session-linked notes (notes with milestone_id and session_id)
        const { data: sessionNotesData, error: sessionNotesError } = await supabase
          .from('progress_notes')
          .select('id, content, created_at, session_id, milestone_id, sessions(scheduled_at, session_type)')
          .in('milestone_id', milestoneIds)
          .not('session_id', 'is', null)
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
              })
            }
          })
          setMilestoneSessionNotes(groupedNotes)
        }
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
    }
  }

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

      toast.success(locale === 'fr' ? 'Objectif ajouté' : locale === 'es' ? 'Objetivo añadido' : 'Goal added')

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
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
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

      if (error) throw error

      toast.success('Journey added')
      setShowAddMilestone(false)
      setTitle('')
      setDescription('')
      setInitialStatus('discovery')
      fetchMilestones()
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast.error('Failed to add journey')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = useCallback(async (milestoneId: string, newStatus: MilestoneStatus) => {
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

      const statusMessages: Record<MilestoneStatus, string> = {
        discovery: 'Moved to Discovery',
        building: 'Moved to Building',
        thriving: 'Moved to Thriving',
        independent: 'Journey completed! 🎉',
      }
      toast.success(statusMessages[newStatus])
      fetchMilestones()
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error('Failed to update journey')
    }
  }, [supabase])

  const handleDelete = useCallback(async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this journey?')) return

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) throw error

      toast.success('Journey deleted')
      fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error('Failed to delete journey')
    }
  }, [supabase])

  const handleToggleShare = useCallback(async (milestoneId: string, currentlyShared: boolean) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          shared_with_member: !currentlyShared,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)

      if (error) throw error

      toast.success(currentlyShared ? 'Journey hidden from member' : 'Journey shared with member')
      fetchMilestones()
    } catch (error) {
      console.error('Error toggling share:', error)
      toast.error('Failed to update sharing')
    }
  }, [supabase])

  const handleAddComment = useCallback(async (milestoneId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('milestone_comments')
        .insert({
          milestone_id: milestoneId,
          practitioner_id: user.id,
          content: content,
        })

      if (error) throw error

      toast.success(locale === 'fr' ? 'Commentaire ajouté' : 'Comment added')
      fetchMilestones()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'ajout' : 'Failed to add comment')
    }
  }, [supabase, locale])

  const handleUpdateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('milestone_comments')
        .update({ content, updated_at: new Date().toISOString() })
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
    const sourceColumn = e.dataTransfer.getData('sourceColumn')

    if (sourceColumn !== targetColumn && milestoneId) {
      handleUpdateStatus(milestoneId, targetColumn)
    }
  }, [handleUpdateStatus])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setNoteImages(prev => [...prev, ...files])

      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNoteImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setNoteImages(prev => prev.filter((_, i) => i !== index))
    setNoteImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllImages = () => {
    setNoteImages([])
    setNoteImagePreviews([])
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Note content is required')
      return
    }

    setSavingNote(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const imageUrls: string[] = []

      // Upload all images
      for (const image of noteImages) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}/${memberId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('note-images')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('note-images')
            .getPublicUrl(fileName)
          imageUrls.push(publicUrl)
        }
      }

      const { error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          title: noteTitle.trim() || null,
          content: noteContent.trim(),
          note_type: noteType,
          is_private: isPrivate,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })

      if (error) throw error

      toast.success(t.members.success.noteAdded)
      setShowAddNote(false)
      setNoteTitle('')
      setNoteContent('')
      setNoteType('general')
      setNoteImages([])
      setNoteImagePreviews([])
      onNotesUpdate()
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setSavingNote(false)
    }
  }

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
        <div className="bg-white rounded-2xl  border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-pulse-glow"></div>
          <p className="text-gray-500 font-medium">Loading journeys...</p>
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
          className="bg-gradient-to-r from-[#D4856A]/5 to-[#D4856A]/10 rounded-2xl border border-[#D4856A]/20 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D4856A]/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-[#D4856A]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {locale === 'fr' ? 'Objectifs suggérés' : locale === 'es' ? 'Objetivos sugeridos' : 'Suggested Goals'}
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
                <div className="w-4 h-4 border-2 border-[#D4856A] border-t-transparent rounded-full animate-spin" />
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
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-[#D4856A]/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2">{suggestion}</p>
                    </div>
                    <button
                      onClick={() => handleQuickAddGoal(suggestion)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#D4856A] bg-[#D4856A]/10 hover:bg-[#D4856A]/20 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Añadir' : 'Add'}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-xl bg-[#D4856A]/10 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5 text-[#D4856A]" />
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {locale === 'fr' ? 'Aucune suggestion disponible' : locale === 'es' ? 'Sin sugerencias disponibles' : 'No suggestions available'}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {locale === 'fr'
                    ? 'Générez un Bloom Pulse pour obtenir des recommandations personnalisées'
                    : locale === 'es'
                    ? 'Genere un Bloom Pulse para obtener recomendaciones personalizadas'
                    : 'Generate a Bloom Pulse to get personalized recommendations'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* View recommendations button when hidden */}
      {!showSuggestions && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSuggestions(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#D4856A] bg-[#D4856A]/5 hover:bg-[#D4856A]/10 border border-[#D4856A]/20 rounded-xl transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          {locale === 'fr' ? 'Voir les recommandations' : locale === 'es' ? 'Ver recomendaciones' : 'View recommendations'}
        </motion.button>
      )}

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
                  {locale === 'fr' ? 'Nouvel objectif' : 'Add New Goal'}
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
                    placeholder={locale === 'fr' ? 'Détails supplémentaires sur cet objectif...' : 'Additional details about this goal...'}
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
                      onClick={() => setInitialStatus('building')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        initialStatus === 'building'
                          ? 'bg-emerald-200 text-emerald-800 border-2 border-emerald-500 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {initialStatus === 'building' && <CheckCircle className="w-4 h-4" />}
                      {locale === 'fr' ? 'Ancrage' : 'Building'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialStatus('thriving')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        initialStatus === 'thriving'
                          ? 'bg-emerald-300 text-emerald-900 border-2 border-emerald-600 shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {initialStatus === 'thriving' && <CheckCircle className="w-4 h-4" />}
                      {locale === 'fr' ? 'Évolution' : 'Thriving'}
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
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setShowAddMilestone(!showAddMilestone)}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          {locale === 'fr' ? 'Ajouter un objectif' : 'Add Goal'}
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
                        comments={milestoneComments[milestone.id] || []}
                        sessionNotes={milestoneSessionNotes[milestone.id] || []}
                        onToggleShare={handleToggleShare}
                        onDelete={handleDelete}
                        onUpdateStatus={handleUpdateStatus}
                        onAddComment={handleAddComment}
                        onUpdateComment={handleUpdateComment}
                        onDeleteComment={handleDeleteComment}
                        categoryLabel={t.members.milestoneCategories[milestone.category]}
                        locale={locale}
                        isHighlighted={highlightMilestoneId === milestone.id || newlyAddedGoalId === milestone.id}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Empty Column State */}
                  {column.items.length === 0 && dragOverColumn !== column.id && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">
                        {locale === 'fr' ? 'Aucun objectif' : 'No goals'}
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
                    <span>{locale === 'fr' ? 'Ajouter un objectif' : 'Add a goal'}</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
      </div>

      {/* Progress Summary */}
      {/* Recent Notes Section - Hidden for now */}
      {false && <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-violet-600" />
            </div>
            {t.members.overview.recentNotes}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddNote(!showAddNote)}
            className="text-gray-500 hover:text-gray-700 rounded-lg"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Add Note Form */}
        <AnimatePresence>
          {showAddNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-gray-50 rounded-xl p-4">
                <input
                  type="text"
                  placeholder={t.members.notes.noteTitle}
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm bg-white"
                />
                <textarea
                  placeholder={t.members.notes.noteContent}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm resize-none bg-white"
                />

                {/* Image Upload */}
                <div className="mb-3">
                  {noteImagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {noteImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                    <ImagePlus className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {noteImagePreviews.length > 0 ? 'Add more' : 'Add images'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as NoteType)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm bg-white"
                  >
                    <option value="general">{t.members.noteTypes.general}</option>
                    <option value="assessment">{t.members.noteTypes.assessment}</option>
                    <option value="treatment_plan">{t.members.noteTypes.treatment_plan}</option>
                    <option value="milestone">{t.members.noteTypes.milestone}</option>
                    <option value="concern">{t.members.noteTypes.concern}</option>
                    <option value="observation">{t.members.noteTypes.observation}</option>
                  </select>
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddNote(false)}
                      className="rounded-lg"
                    >
                      {t.members.form.cancel}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingNote}
                      onClick={handleAddNote}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                    >
                      {savingNote ? t.members.form.saving : t.members.notes.save}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{t.members.overview.noNotes}</p>
            <p className="text-xs text-gray-400 mt-1">{t.members.overview.noNotesDescription}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, index) => {
              const typeStyle = noteTypeColors[note.note_type]
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                        {t.members.noteTypes[note.note_type]}
                      </span>
                      {note.is_private && (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {note.title && (
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{note.title}</h4>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                  {note.image_urls && note.image_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.image_urls.map((url, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={url}
                          alt={`Attachment ${imgIndex + 1}`}
                          className="h-16 w-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setLightboxImage(url)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}

            {notes.length >= 5 && (
              <button className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
                {t.members.overview.allNotes}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>}

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <img
                src={lightboxImage}
                alt="Full size"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
