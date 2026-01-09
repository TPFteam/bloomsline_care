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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Milestone, MilestoneCategory, MilestoneStatus, ProgressNote, NoteType } from '@/types/member'

interface ProgressTabProps {
  memberId: string
  notes: ProgressNote[]
  onNotesUpdate: () => void
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

// Memoized MilestoneCard component to prevent re-renders
interface MilestoneCardProps {
  milestone: Milestone
  columnId: MilestoneStatus
  onToggleShare: (id: string, shared: boolean) => void
  onDelete: (id: string) => void
  onUpdateStatus: (id: string, status: MilestoneStatus) => void
  categoryLabel: string
}

const MilestoneCard = memo(function MilestoneCard({
  milestone,
  columnId,
  onToggleShare,
  onDelete,
  onUpdateStatus,
  categoryLabel,
}: MilestoneCardProps) {
  const catStyle = categoryColors[milestone.category]

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('milestoneId', milestone.id)
    e.dataTransfer.setData('sourceColumn', columnId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
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
          <button
            onClick={() => onDelete(milestone.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Independent Date */}
        {columnId === 'independent' && milestone.achieved_at && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-violet-600">
            <Sparkles className="w-3 h-3" />
            <span>Validated {new Date(milestone.achieved_at).toLocaleDateString()}</span>
          </div>
        )}

        {/* Drag hint */}
        <div className="mt-3 pt-2 border-t border-gray-50 text-center">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Drag to move</span>
        </div>
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

export default function ProgressTab({ memberId, notes, onNotesUpdate }: ProgressTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  const [milestones, setMilestones] = useState<Milestone[]>([])
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

  useEffect(() => {
    fetchMilestones()
  }, [memberId])

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
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
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

      toast.success('Hypothesis added')
      setShowAddMilestone(false)
      setTitle('')
      setDescription('')
      setInitialStatus('discovery')
      fetchMilestones()
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast.error('Failed to add hypothesis')
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
        independent: 'Hypothesis validated! 🎉',
      }
      toast.success(statusMessages[newStatus])
      fetchMilestones()
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error('Failed to update hypothesis')
    }
  }, [supabase])

  const handleDelete = useCallback(async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this hypothesis?')) return

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) throw error

      toast.success('Hypothesis deleted')
      fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error('Failed to delete hypothesis')
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

      toast.success(currentlyShared ? 'Hypothesis hidden from member' : 'Hypothesis shared with member')
      fetchMilestones()
    } catch (error) {
      console.error('Error toggling share:', error)
      toast.error('Failed to update sharing')
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
      titleFr: 'Découverte',
      description: 'Understanding needs, building trust, and identifying areas for growth together.',
      descriptionFr: 'Comprendre les besoins, établir la confiance et identifier les domaines de croissance.',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200',
      items: discoveryMilestones,
    },
    {
      id: 'building',
      title: 'Building',
      titleFr: 'Construction',
      description: 'Actively working through challenges and developing new skills and coping strategies.',
      descriptionFr: 'Travailler activement sur les défis et développer de nouvelles compétences.',
      icon: Play,
      color: 'text-amber-600',
      bgColor: 'from-amber-50 to-amber-100/50',
      borderColor: 'border-amber-200',
      items: buildingMilestones,
    },
    {
      id: 'thriving',
      title: 'Thriving',
      titleFr: 'Épanouissement',
      description: 'Maintaining progress and consistently applying learned strategies in daily life.',
      descriptionFr: 'Maintenir les progrès et appliquer les stratégies apprises au quotidien.',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100/50',
      borderColor: 'border-emerald-200',
      items: thrivingMilestones,
    },
    {
      id: 'independent',
      title: 'Independent',
      titleFr: 'Autonome',
      description: 'Confidently self-managing with minimal guidance, ready to continue the journey solo.',
      descriptionFr: 'Gérer avec confiance de manière autonome, prêt à continuer seul.',
      icon: Sparkles,
      color: 'text-violet-600',
      bgColor: 'from-violet-50 to-violet-100/50',
      borderColor: 'border-violet-200',
      items: independentMilestones,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl  border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-pulse-glow"></div>
          <p className="text-gray-500 font-medium">Loading hypotheses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                  Add New Hypothesis
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
                    Hypothesis Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Practice breathing exercises daily"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details about this hypothesis..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as MilestoneStatus)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white "
                  >
                    <option value="discovery">{locale === 'fr' ? 'Découverte' : 'Discovery'}</option>
                    <option value="building">{locale === 'fr' ? 'Construction' : 'Building'}</option>
                    <option value="thriving">{locale === 'fr' ? 'Épanouissement' : 'Thriving'}</option>
                    <option value="independent">{locale === 'fr' ? 'Autonome' : 'Independent'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowAddMilestone(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMilestone}
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                >
                  {saving ? 'Adding...' : 'Add Hypothesis'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Hypothesis Button */}
      {milestones.length > 0 && (
        <div className="flex items-center justify-end">
          <Button
            onClick={() => setShowAddMilestone(!showAddMilestone)}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Hypothesis
          </Button>
        </div>
      )}

      {/* Empty State */}
      {milestones.length === 0 && !showAddMilestone ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl  border border-gray-200 p-16 text-center"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
            <div className="relative w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Target className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {t.members.progress.noMilestones}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {t.members.progress.noMilestonesDescription}
          </p>
          <Button
            onClick={() => setShowAddMilestone(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-colors hover-lift"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Hypothesis
          </Button>
        </motion.div>
      ) : milestones.length > 0 && (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((column) => {
            const Icon = column.icon
            return (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-b ${column.bgColor} rounded-2xl border ${column.borderColor} min-h-[400px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-white/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center `}>
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
                  className={`flex-1 p-3 space-y-3 overflow-y-auto transition-all ${
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
                        onToggleShare={handleToggleShare}
                        onDelete={handleDelete}
                        onUpdateStatus={handleUpdateStatus}
                        categoryLabel={t.members.milestoneCategories[milestone.category]}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Empty Column State */}
                  {column.items.length === 0 && (
                    <div className="text-center py-8">
                      <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mx-auto mb-3`}>
                        <Icon className={`w-6 h-6 ${column.color} opacity-50`} />
                      </div>
                      <p className="text-sm text-gray-400">
                        {dragOverColumn === column.id ? 'Drop here' : 'No hypotheses here yet'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Progress Summary */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-5 gap-3"
        >
          {/* Total Hypotheses Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Hypotheses</p>
            <p className="text-2xl font-bold text-gray-900">{milestones.length}</p>
          </div>

          {/* Discovery Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-xs text-blue-600 font-medium">{locale === 'fr' ? 'Découverte' : 'Discovery'}</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{discoveryMilestones.length}</p>
          </div>

          {/* Building Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-xs text-amber-600 font-medium">{locale === 'fr' ? 'Construction' : 'Building'}</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{buildingMilestones.length}</p>
          </div>

          {/* Thriving Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs text-emerald-600 font-medium">{locale === 'fr' ? 'Épanouissement' : 'Thriving'}</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{thrivingMilestones.length}</p>
          </div>

          {/* Independent Card */}
          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl p-4 border border-violet-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <p className="text-xs text-violet-600 font-medium">{locale === 'fr' ? 'Autonome' : 'Independent'}</p>
            </div>
            <p className="text-2xl font-bold text-violet-700">{independentMilestones.length}</p>
          </div>
        </motion.div>
      )}

      {/* Recent Notes Section */}
      <motion.div
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
      </motion.div>

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
