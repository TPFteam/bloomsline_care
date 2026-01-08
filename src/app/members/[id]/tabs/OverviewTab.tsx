'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Heart,
  AlertCircle,
  Phone,
  Plus,
  ChevronRight,
  User,
  Lock,
  Edit3,
  X,
  FileText,
  Clock,
  Target,
  Share2,
  Video,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, ProgressNote, NoteType, MemberPreferences, Milestone, MilestoneCategory, Session as MemberSession } from '@/types/member'
import { formatRelativeTime, getSessionTypeLabel, getSessionFormatLabel } from '@/types/member'

interface OverviewTabProps {
  member: Member
  notes: ProgressNote[]
  sessions: MemberSession[]
  onMemberUpdate: () => void
}

export default function OverviewTab({ member, notes, sessions, onMemberUpdate }: OverviewTabProps) {
  const { t } = useLanguage()
  const supabase = createClient()


  // Edit states
  const [editingAbout, setEditingAbout] = useState(false)
  const [editingPreferences, setEditingPreferences] = useState(false)
  const [saving, setSaving] = useState(false)

  // Section refs for scrolling
  const preferencesRef = useRef<HTMLDivElement>(null)

  // About edit fields
  const [aboutNotes, setAboutNotes] = useState(member.internal_notes || '')

  // Preferences edit fields
  const [commStyles, setCommStyles] = useState<string[]>(
    Array.isArray(member.preferences.communication_style)
      ? member.preferences.communication_style
      : member.preferences.communication_style
        ? [member.preferences.communication_style]
        : []
  )
  const [commStyleInput, setCommStyleInput] = useState('')
  const [strengths, setStrengths] = useState<string[]>(member.preferences.key_strengths)
  const [strengthInput, setStrengthInput] = useState('')
  const [sensitivities, setSensitivities] = useState<string[]>(member.preferences.areas_of_sensitivity)
  const [sensitivityInput, setSensitivityInput] = useState('')


  // Active Goals state
  const [activeGoals, setActiveGoals] = useState<Milestone[]>([])

  // Shared Resources state
  const [sharedResources, setSharedResources] = useState<any[]>([])

  // Fetch active goals and shared resources
  useEffect(() => {
    const fetchActiveGoals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('milestones')
          .select('*')
          .eq('member_id', member.id)
          .eq('practitioner_id', user.id)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(3)

        if (data) setActiveGoals(data)
      } catch (error) {
        console.error('Error fetching active goals:', error)
      }
    }

    const fetchSharedResources = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch shared library resources
        const { data, error } = await supabase
          .from('member_shared_resources')
          .select(`
            *,
            resource:resources!inner(id, title, type, description)
          `)
          .eq('member_id', member.id)
          .eq('practitioner_id', user.id)
          .order('shared_at', { ascending: false })
          .limit(3)

        if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
          if (error.message && !error.message.includes('does not exist')) {
            console.error('Error fetching shared resources:', error)
          }
        }

        if (data) setSharedResources(data)
      } catch (error) {
        console.error('Error fetching shared resources:', error)
      }
    }

    fetchActiveGoals()
    fetchSharedResources()
  }, [member.id, supabase])

  // Helper functions
  const handleAddCommStyle = () => {
    if (commStyleInput.trim() && !commStyles.includes(commStyleInput.trim())) {
      setCommStyles([...commStyles, commStyleInput.trim()])
      setCommStyleInput('')
    }
  }

  const handleAddStrength = () => {
    if (strengthInput.trim() && !strengths.includes(strengthInput.trim())) {
      setStrengths([...strengths, strengthInput.trim()])
      setStrengthInput('')
    }
  }

  const handleAddSensitivity = () => {
    if (sensitivityInput.trim() && !sensitivities.includes(sensitivityInput.trim())) {
      setSensitivities([...sensitivities, sensitivityInput.trim()])
      setSensitivityInput('')
    }
  }

  // Save handlers
  const handleSaveAbout = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ internal_notes: aboutNotes.trim() || null })
        .eq('id', member.id)

      if (error) throw error

      toast.success('About section updated')
      setEditingAbout(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating about:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const preferences: MemberPreferences = {
        communication_style: commStyles.length > 0 ? commStyles : null,
        key_strengths: strengths,
        areas_of_sensitivity: sensitivities,
        therapeutic_context: member.preferences.therapeutic_context,
        preferred_contact_method: member.preferences.preferred_contact_method,
        preferred_session_format: member.preferences.preferred_session_format,
      }

      const { error } = await supabase
        .from('members')
        .update({ preferences })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Preferences updated')
      setEditingPreferences(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // Check if preferences section has any data
  const hasPreferencesData =
    member.preferences.communication_style ||
    member.preferences.key_strengths.length > 0 ||
    member.preferences.areas_of_sensitivity.length > 0 ||
    member.preferences.therapeutic_context

  const noteTypeColors: Record<NoteType, { bg: string; text: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-700' },
    assessment: { bg: 'bg-blue-50', text: 'text-blue-700' },
    treatment_plan: { bg: 'bg-purple-50', text: 'text-purple-700' },
    milestone: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    concern: { bg: 'bg-red-50', text: 'text-red-700' },
    observation: { bg: 'bg-amber-50', text: 'text-amber-700' },
  }

  const categoryColors: Record<MilestoneCategory, { bg: string; text: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-700' },
    therapy_goal: { bg: 'bg-purple-50', text: 'text-purple-700' },
    behavioral: { bg: 'bg-blue-50', text: 'text-blue-700' },
    emotional: { bg: 'bg-rose-50', text: 'text-rose-700' },
    social: { bg: 'bg-teal-50', text: 'text-teal-700' },
    other: { bg: 'bg-gray-100', text: 'text-gray-700' },
  }

  const sessionFormatIcons: Record<string, React.ReactNode> = {
    in_person: <User className="w-3 h-3" />,
    virtual: <Video className="w-3 h-3" />,
    phone: <Phone className="w-3 h-3" />,
  }

  const { locale } = useLanguage()

  // Scroll and open handlers
  const handleOpenPreferences = () => {
    setEditingPreferences(true)
    setTimeout(() => {
      preferencesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Check what's missing
  const missingItems = []
  if (!hasPreferencesData) missingItems.push({ key: 'preferences', label: locale === 'fr' ? 'Préférences' : 'Preferences', action: handleOpenPreferences })

  return (
    <div className="space-y-6">
      {/* Complete Profile Banner */}
      {missingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">
                {locale === 'fr' ? 'Compléter le profil' : 'Complete Profile'}
              </p>
              <p className="text-xs text-amber-700">
                {locale === 'fr' ? 'Ajoutez plus de détails pour ce client' : 'Add more details for this client'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {missingItems.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant="outline"
                onClick={item.action}
                className="text-amber-700 border-amber-300 hover:bg-amber-100 rounded-lg text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                {t.members.overview.aboutClient}
              </h3>
              {!editingAbout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAbout(true)}
                  className="text-gray-500 hover:text-gray-700 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editingAbout ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <textarea
                    value={aboutNotes}
                    onChange={(e) => setAboutNotes(e.target.value)}
                    placeholder="Add notes about this client..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all resize-none text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAboutNotes(member.internal_notes || '')
                        setEditingAbout(false)
                      }}
                      className="rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveAbout}
                      disabled={saving}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </motion.div>
              ) : member.internal_notes ? (
                <motion.p
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed"
                >
                  {member.internal_notes}
                </motion.p>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No notes added yet</p>
                  <Button
                    size="sm"
                    onClick={() => setEditingAbout(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Notes
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Active Goals - in left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-600" />
                </div>
                Active Goals
              </h3>
            </div>

            {activeGoals.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No active goals</p>
                <p className="text-xs text-gray-400 mt-1">Goals in progress will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((goal, index) => {
                  const catStyle = categoryColors[goal.category]
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                          {goal.category.replace('_', ' ')}
                        </span>
                        {goal.target_date && (
                          <span className="text-xs text-gray-400">
                            Target: {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Past Sessions - in left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                Past Sessions
              </h3>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No sessions yet</p>
                <p className="text-xs text-gray-400 mt-1">Past sessions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {sessionFormatIcons[session.session_format]}
                          {getSessionFormatLabel(session.session_format)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          session.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                          session.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                          session.status === 'no_show' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 text-sm mb-1">{getSessionTypeLabel(session.session_type)}</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(session.scheduled_at)}</p>
                  </motion.div>
                ))}

                {sessions.length > 3 && (
                  <button className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
                    View all sessions
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Preferences Section */}
        <motion.div
          ref={preferencesRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-600" />
              </div>
              {t.members.overview.preferences}
            </h3>
            {!editingPreferences && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPreferences(true)}
                className="text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editingPreferences ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Communication Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.communicationStyle}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={commStyleInput}
                      onChange={(e) => setCommStyleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCommStyle()
                        }
                      }}
                      placeholder={t.members.form.communicationStylePlaceholder}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCommStyle}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {commStyles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {commStyles.map((style) => (
                        <span
                          key={style}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm"
                        >
                          {style}
                          <button
                            type="button"
                            onClick={() => setCommStyles(commStyles.filter(s => s !== style))}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Strengths */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.keyStrengths}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={strengthInput}
                      onChange={(e) => setStrengthInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddStrength()
                        }
                      }}
                      placeholder={t.members.form.keyStrengthsPlaceholder}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleAddStrength}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {strengths.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {strengths.map((strength) => (
                        <span
                          key={strength}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm"
                        >
                          {strength}
                          <button
                            type="button"
                            onClick={() => setStrengths(strengths.filter(s => s !== strength))}
                            className="hover:text-emerald-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Areas of Sensitivity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.areasOfSensitivity}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={sensitivityInput}
                      onChange={(e) => setSensitivityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSensitivity()
                        }
                      }}
                      placeholder={t.members.form.areasOfSensitivityPlaceholder}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSensitivity}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {sensitivities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sensitivities.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => setSensitivities(sensitivities.filter(s => s !== area))}
                            className="hover:text-amber-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCommStyles(
                        Array.isArray(member.preferences.communication_style)
                          ? member.preferences.communication_style
                          : member.preferences.communication_style
                            ? [member.preferences.communication_style]
                            : []
                      )
                      setStrengths(member.preferences.key_strengths)
                      setSensitivities(member.preferences.areas_of_sensitivity)
                      setEditingPreferences(false)
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </motion.div>
            ) : hasPreferencesData ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {member.preferences.communication_style && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.communicationStyle}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(member.preferences.communication_style)
                        ? member.preferences.communication_style
                        : [member.preferences.communication_style]
                      ).map((style) => (
                        <span
                          key={style}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.preferences.key_strengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.keyStrengths}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {member.preferences.key_strengths.map((strength) => (
                        <span
                          key={strength}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.preferences.areas_of_sensitivity.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.areasOfSensitivity}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {member.preferences.areas_of_sensitivity.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No preferences set yet</p>
                <Button
                  size="sm"
                  onClick={() => setEditingPreferences(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Preferences
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

          {/* Recent Notes Section */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-violet-600" />
              </div>
              {t.members.overview.recentNotes}
            </h3>
          </div>

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
              {notes.slice(0, 3).map((note, index) => {
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
                        {formatRelativeTime(note.created_at)}
                      </span>
                    </div>
                    {note.title && (
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{note.title}</h4>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                  </motion.div>
                )
              })}

              {notes.length > 3 && (
                <button className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
                  {t.members.overview.allNotes}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>

          {/* Shared Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-indigo-600" />
              </div>
              Shared Resources
            </h3>
          </div>

          {sharedResources.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No shared resources</p>
              <p className="text-xs text-gray-400 mt-1">Resources you've shared with this client will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedResources.slice(0, 3).map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      resource.viewed_at ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {resource.viewed_at ? 'Viewed' : 'Not viewed'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(resource.shared_at)}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{resource.resource?.title}</h4>
                  {resource.resource?.type && (
                    <span className="text-xs text-gray-500 capitalize">{resource.resource.type}</span>
                  )}
                </motion.div>
              ))}

              {sharedResources.length > 3 && (
                <button className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
                  View all resources
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  )
}
