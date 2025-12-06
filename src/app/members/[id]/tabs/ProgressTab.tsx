'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Plus,
  Target,
  CheckCircle,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Play,
  X,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Milestone, MilestoneCategory, MilestoneStatus } from '@/types/member'

interface ProgressTabProps {
  memberId: string
}

export default function ProgressTab({ memberId }: ProgressTabProps) {
  const { t } = useLanguage()
  const supabase = createClient()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MilestoneCategory>('general')
  const [targetDate, setTargetDate] = useState('')
  const [initialStatus, setInitialStatus] = useState<MilestoneStatus>('planned')
  const [saving, setSaving] = useState(false)

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
      const mappedData = (data || []).map(m => ({
        ...m,
        status: m.status || (m.achieved ? 'achieved' : 'planned') as MilestoneStatus
      }))

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
          category,
          target_date: targetDate || null,
          status: initialStatus,
          achieved: initialStatus === 'achieved',
          achieved_at: initialStatus === 'achieved' ? new Date().toISOString() : null,
        })

      if (error) throw error

      toast.success('Goal added')
      setShowAddMilestone(false)
      setTitle('')
      setDescription('')
      setCategory('general')
      setTargetDate('')
      setInitialStatus('planned')
      fetchMilestones()
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast.error('Failed to add goal')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (milestoneId: string, newStatus: MilestoneStatus) => {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        achieved: newStatus === 'achieved',
      }

      if (newStatus === 'achieved') {
        updateData.achieved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', milestoneId)

      if (error) throw error

      const statusMessages = {
        planned: 'Moved to Planned',
        in_progress: 'Started working on goal',
        achieved: 'Goal achieved! 🎉',
      }
      toast.success(statusMessages[newStatus])
      fetchMilestones()
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error('Failed to update goal')
    }
  }

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) throw error

      toast.success('Goal deleted')
      fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error('Failed to delete goal')
    }
  }

  // Group milestones by status
  const plannedMilestones = milestones.filter(m => m.status === 'planned')
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress')
  const achievedMilestones = milestones.filter(m => m.status === 'achieved')

  const categoryColors: Record<MilestoneCategory, { bg: string; text: string; dot: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
    therapy_goal: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
    behavioral: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    emotional: { bg: 'bg-coral-50', text: 'text-coral-700', dot: 'bg-coral-400' },
    social: { bg: 'bg-mint-50', text: 'text-mint-700', dot: 'bg-mint-400' },
    other: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  }

  const columns: { id: MilestoneStatus; title: string; icon: typeof Clock; color: string; bgColor: string; borderColor: string; items: Milestone[] }[] = [
    {
      id: 'planned',
      title: t.members.progress.planned || 'Planned',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200',
      items: plannedMilestones,
    },
    {
      id: 'in_progress',
      title: t.members.progress.inProgress || 'In Progress',
      icon: Play,
      color: 'text-amber-600',
      bgColor: 'from-amber-50 to-amber-100/50',
      borderColor: 'border-amber-200',
      items: inProgressMilestones,
    },
    {
      id: 'achieved',
      title: t.members.progress.achieved || 'Achieved',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'from-emerald-50 to-emerald-100/50',
      borderColor: 'border-emerald-200',
      items: achievedMilestones,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-8 text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-pulse-glow"></div>
          <p className="text-gray-500 font-medium">Loading goals...</p>
        </div>
      </div>
    )
  }

  const MilestoneCard = ({ milestone, columnId }: { milestone: Milestone; columnId: MilestoneStatus }) => {
    const catStyle = categoryColors[milestone.category]
    const isOverdue = milestone.target_date && new Date(milestone.target_date) < new Date() && columnId !== 'achieved'

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${catStyle.dot}`} />
              <span className={`text-xs font-medium ${catStyle.text}`}>
                {t.members.milestoneCategories[milestone.category]}
              </span>
            </div>
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
            onClick={() => handleDelete(milestone.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Target Date */}
        {milestone.target_date && (
          <div className={`flex items-center gap-1.5 mt-3 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            <Calendar className="w-3 h-3" />
            <span>{isOverdue ? 'Overdue: ' : ''}{new Date(milestone.target_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Achieved Date */}
        {columnId === 'achieved' && milestone.achieved_at && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600">
            <Sparkles className="w-3 h-3" />
            <span>Achieved {new Date(milestone.achieved_at).toLocaleDateString()}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
          {columnId === 'planned' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(milestone.id, 'in_progress')}
              className="h-7 text-xs text-amber-600 hover:bg-amber-50 rounded-lg flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {columnId === 'planned' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(milestone.id, 'achieved')}
              className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg flex-1"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Done
            </Button>
          )}
          {columnId === 'in_progress' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(milestone.id, 'planned')}
                className="h-7 text-xs text-gray-500 hover:bg-gray-50 rounded-lg"
              >
                <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(milestone.id, 'achieved')}
                className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg flex-1"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Button>
            </>
          )}
          {columnId === 'achieved' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateStatus(milestone.id, 'in_progress')}
              className="h-7 text-xs text-gray-500 hover:bg-gray-50 rounded-lg flex-1"
            >
              <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
              Reopen
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5 text-lavender-600" />
          </div>
          {t.members.progress.title}
        </h2>
        <Button
          onClick={() => setShowAddMilestone(!showAddMilestone)}
          className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-smooth hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Progress Summary */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-white/60"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{milestones.length}</p>
                <p className="text-xs text-gray-500">Total Goals</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-600">{plannedMilestones.length} Planned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-sm text-gray-600">{inProgressMilestones.length} In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-sm text-gray-600">{achievedMilestones.length} Achieved</span>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="flex-1 max-w-xs">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                {plannedMilestones.length > 0 && (
                  <div
                    className="h-full bg-blue-400"
                    style={{ width: `${(plannedMilestones.length / milestones.length) * 100}%` }}
                  />
                )}
                {inProgressMilestones.length > 0 && (
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(inProgressMilestones.length / milestones.length) * 100}%` }}
                  />
                )}
                {achievedMilestones.length > 0 && (
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${(achievedMilestones.length / milestones.length) * 100}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {Math.round((achievedMilestones.length / milestones.length) * 100)}% complete
              </p>
            </div>
          </div>
        </motion.div>
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
            <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-lavender-500" />
                  Add New Goal
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
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Practice breathing exercises daily"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details about this goal..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none resize-none bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MilestoneCategory)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
                    >
                      <option value="general">{t.members.milestoneCategories.general}</option>
                      <option value="therapy_goal">{t.members.milestoneCategories.therapy_goal}</option>
                      <option value="behavioral">{t.members.milestoneCategories.behavioral}</option>
                      <option value="emotional">{t.members.milestoneCategories.emotional}</option>
                      <option value="social">{t.members.milestoneCategories.social}</option>
                      <option value="other">{t.members.milestoneCategories.other}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Status
                    </label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value as MilestoneStatus)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="achieved">Achieved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-lavender-500" />
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowAddMilestone(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMilestone}
                  disabled={saving}
                  className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                >
                  {saving ? 'Adding...' : 'Add Goal'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {milestones.length === 0 && !showAddMilestone ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-16 text-center"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-lavender-100 to-lavender-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Target className="w-10 h-10 text-lavender-600" />
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
            className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-smooth hover-lift"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Goal
          </Button>
        </motion.div>
      ) : milestones.length > 0 && (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-4 h-4 ${column.color}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-white/80 ${column.color}`}>
                      {column.items.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  <AnimatePresence>
                    {column.items.map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        columnId={column.id}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Empty Column State */}
                  {column.items.length === 0 && (
                    <div className="text-center py-8">
                      <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mx-auto mb-3`}>
                        <Icon className={`w-6 h-6 ${column.color} opacity-50`} />
                      </div>
                      <p className="text-sm text-gray-400">No goals here yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
