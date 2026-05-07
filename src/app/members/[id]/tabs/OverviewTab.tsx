'use client'

import { useState, useRef, useEffect, useMemo, useCallback, DragEvent } from 'react'
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
  GripVertical,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, ProgressNote, NoteType, MemberPreferences, Milestone, MilestoneCategory, Session as MemberSession, MemberSummary, SummaryContent } from '@/types/member'
import { formatRelativeTime, getSessionTypeLabel, getSessionFormatLabel, getMemberFullName } from '@/types/member'
import { MemberSummaryModal } from '@/components/members/MemberSummaryModal'
import { getUserPreferences, updateUserPreferences, DEFAULT_CARD_LAYOUT, type CardLayoutItem } from '@/lib/services/preferences'

type TabId = 'overview' | 'sessions_notes' | 'progress' | 'files' | 'shared'
type SubTabId = 'sessions' | 'notes'

interface OverviewTabProps {
  member: Member
  notes: ProgressNote[]
  sessions: MemberSession[]
  onMemberUpdate: () => void
  onNavigateToTab?: (tab: TabId, highlightId?: string, sub?: SubTabId) => void
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Helper to extract localized value from bilingual {en, fr} structure
function getLocalizedValue<T>(value: T | { en: T; fr: T } | null | undefined, locale: string): T | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'object' && value !== null && 'en' in value && 'fr' in value) {
    return (value as { en: T; fr: T })[locale === 'fr' ? 'fr' : 'en']
  }
  return value as T
}

// Helper to extract localized array
function getLocalizedArray(value: string[] | string | { en: string[]; fr: string[] } | null | undefined, locale: string): string[] {
  if (!value) return []
  if (typeof value === 'object' && 'en' in value && 'fr' in value) {
    return (value as { en: string[]; fr: string[] })[locale === 'fr' ? 'fr' : 'en'] || []
  }
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
}

export default function OverviewTab({ member, notes, sessions, onMemberUpdate, onNavigateToTab }: OverviewTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  // Card layout state
  const [cardLayout, setCardLayout] = useState<CardLayoutItem[]>(DEFAULT_CARD_LAYOUT)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Edit states
  const [editingAbout, setEditingAbout] = useState(false)
  const [editingPreferences, setEditingPreferences] = useState(false)
  const [saving, setSaving] = useState(false)

  // Section refs for scrolling
  const preferencesRef = useRef<HTMLDivElement>(null)

  // About edit fields
  const [aboutNotes, setAboutNotes] = useState(member.internal_notes || '')

  // Preferences edit fields - handle bilingual structure
  const [commStyles, setCommStyles] = useState<string[]>(
    getLocalizedArray(member.preferences.communication_style, locale)
  )
  const [commStyleInput, setCommStyleInput] = useState('')
  const [strengths, setStrengths] = useState<string[]>(
    getLocalizedArray(member.preferences.key_strengths, locale)
  )
  const [strengthInput, setStrengthInput] = useState('')
  const [sensitivities, setSensitivities] = useState<string[]>(
    getLocalizedArray(member.preferences.areas_of_sensitivity, locale)
  )
  const [sensitivityInput, setSensitivityInput] = useState('')
  const [currentTreatment, setCurrentTreatment] = useState(
    getLocalizedValue(member.preferences?.current_treatment, locale) || ''
  )

  // Active Goals state
  const [activeGoals, setActiveGoals] = useState<Milestone[]>([])

  // Shared Resources state
  const [sharedResources, setSharedResources] = useState<any[]>([])

  // Combined recent notes (from sessions, session notes, milestone comments)
  interface CombinedNote {
    id: string
    note_id: string  // raw progress_notes.id for deep-link navigation
    content: string
    created_at: string
    type: 'session_summary' | 'note'
    note_type?: string  // raw tag from progress_notes (e.g. 'hypothese', 'recurrence')
    isHtml?: boolean
    source_label: string
    session_date?: string
    session_id?: string
  }
  const [combinedNotes, setCombinedNotes] = useState<CombinedNote[]>([])
  const [allNotes, setAllNotes] = useState<CombinedNote[]>([])
  const [showAllNotesModal, setShowAllNotesModal] = useState(false)

  // AI Summary state
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [latestSummary, setLatestSummary] = useState<MemberSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  // Load card layout from preferences
  useEffect(() => {
    getUserPreferences().then(prefs => {
      if (prefs?.overview_card_layout) {
        let layout = prefs.overview_card_layout
        // Add ai_summary card if it doesn't exist (for existing users)
        if (!layout.some(c => c.id === 'ai_summary')) {
          layout = [
            { id: 'ai_summary', column: 0 as const, order: 0 },
            ...layout.map(c => ({ ...c, order: c.order + 1 }))
          ]
        }
        // Drop cards that have been removed/merged:
        //   - `preferences` is now a sub-section inside the About card
        //   - `active_goals` is hidden for now (lives in the Journey tab)
        layout = layout.filter(c => c.id !== 'preferences' && c.id !== 'active_goals')
        setCardLayout(layout)
      }
    })
  }, [])

  // Fetch latest AI summary
  useEffect(() => {
    const fetchLatestSummary = async () => {
      setLoadingSummary(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch(`/api/members/${member.id}/summary`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setLatestSummary(data.summary)
        }
      } catch (error) {
        console.error('Error fetching summary:', error)
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchLatestSummary()
  }, [member.id, supabase])

  // Debounced save for card layout
  const saveLayoutDebounced = useMemo(
    () => debounce((layout: CardLayoutItem[]) => {
      updateUserPreferences({ overview_card_layout: layout })
    }, 500),
    []
  )

  // Derive column cards from layout
  const leftColumnCards = useMemo(() =>
    cardLayout
      .filter(c => c.column === 0)
      .sort((a, b) => a.order - b.order),
    [cardLayout]
  )

  const rightColumnCards = useMemo(() =>
    cardLayout
      .filter(c => c.column === 1)
      .sort((a, b) => a.order - b.order),
    [cardLayout]
  )

  // Drag handlers
  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, cardId: string) => {
    e.dataTransfer.setData('cardId', cardId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedCard(cardId)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, column: number, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(column)
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
    setDragOverIndex(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null)
    setDragOverColumn(null)
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetColumn: 0 | 1, targetIndex: number) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('cardId')
    if (!cardId) return

    setCardLayout(prevLayout => {
      // Find the card being moved
      const cardIndex = prevLayout.findIndex(c => c.id === cardId)
      if (cardIndex === -1) return prevLayout

      const card = prevLayout[cardIndex]

      // Get cards in target column (excluding the dragged card)
      const targetColumnCards = prevLayout
        .filter(c => c.column === targetColumn && c.id !== cardId)
        .sort((a, b) => a.order - b.order)

      // Create new layout
      const newLayout = prevLayout.map(c => {
        if (c.id === cardId) {
          // Move the dragged card
          return { ...c, column: targetColumn, order: targetIndex }
        }

        if (c.column === targetColumn && c.id !== cardId) {
          // Reorder cards in target column
          const cardOrderIndex = targetColumnCards.findIndex(tc => tc.id === c.id)
          let newOrder = cardOrderIndex

          if (cardOrderIndex >= targetIndex) {
            newOrder = cardOrderIndex + 1
          }

          return { ...c, order: newOrder }
        }

        // For cards in the source column (if different from target)
        if (card.column !== targetColumn && c.column === card.column && c.id !== cardId) {
          // Reorder remaining cards in source column
          const sourceColumnCards = prevLayout
            .filter(sc => sc.column === card.column && sc.id !== cardId)
            .sort((a, b) => a.order - b.order)
          const sourceOrderIndex = sourceColumnCards.findIndex(sc => sc.id === c.id)
          return { ...c, order: sourceOrderIndex }
        }

        return c
      })

      // Normalize orders for both columns
      const normalizedLayout = newLayout.map(c => {
        const columnCards = newLayout
          .filter(nc => nc.column === c.column)
          .sort((a, b) => a.order - b.order)
        const normalizedOrder = columnCards.findIndex(nc => nc.id === c.id)
        return { ...c, order: normalizedOrder }
      })

      saveLayoutDebounced(normalizedLayout)
      return normalizedLayout
    })

    setDraggedCard(null)
    setDragOverColumn(null)
    setDragOverIndex(null)
  }, [saveLayoutDebounced])

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
          .in('status', ['building', 'thriving'])
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

    const fetchCombinedNotes = async () => {
      try {
        const combined: CombinedNote[] = []

        // Fetch session summaries and regular notes from progress_notes
        const { data: allProgressNotes } = await supabase
          .from('progress_notes')
          .select('id, content, created_at, session_id, note_type, sessions(scheduled_at)')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false })
          .limit(30)

        if (allProgressNotes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allProgressNotes.forEach((note: any) => {
            const sessionData = Array.isArray(note.sessions) ? note.sessions[0] : note.sessions

            if (note.note_type === 'session_summary') {
              combined.push({
                id: `note-${note.id}`,
                note_id: note.id,
                content: note.content,
                created_at: note.created_at,
                type: 'session_summary',
                note_type: note.note_type,
                isHtml: true,
                source_label: locale === 'fr' ? 'Résumé de séance' : locale === 'es' ? 'Resumen de sesión' : 'Session Summary',
                session_date: sessionData?.scheduled_at,
                session_id: note.session_id,
              })
            } else {
              combined.push({
                id: `note-${note.id}`,
                note_id: note.id,
                content: note.content,
                created_at: note.created_at,
                type: 'note',
                note_type: note.note_type,
                source_label: 'Note',
              })
            }
          })
        }

        // Sort by created_at descending
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setAllNotes(combined)
        setCombinedNotes(combined.slice(0, 3))
      } catch (error) {
        console.error('Error fetching combined notes:', error)
      }
    }

    fetchActiveGoals()
    fetchSharedResources()
    fetchCombinedNotes()
  }, [member.id, sessions, supabase, locale])

  // Helper functions
  const handleAddCommStyle = () => {
    if (commStyleInput.trim() && !commStyles.includes(commStyleInput.trim())) {
      setCommStyles([...commStyles, commStyleInput.trim()])
      setCommStyleInput('')
    }
  }

  const stripHtml = (html: string) => {
    // Decode entities first so encoded tags like &lt;mark&gt; become <mark> before stripping
    const decoded = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    return decoded.replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>\s*<p>/gi, ' ').replace(/<[^>]+>/g, '').trim()
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

      toast.success(locale === 'fr' ? 'Section À propos mise à jour' : 'About section updated')
      setEditingAbout(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating about:', error)
      toast.error(locale === 'fr' ? 'Impossible de mettre à jour' : 'Failed to update')
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
        current_treatment: currentTreatment.trim() || null,
        preferred_contact_method: member.preferences.preferred_contact_method,
        preferred_session_format: member.preferences.preferred_session_format,
      }

      const { error } = await supabase
        .from('members')
        .update({ preferences })
        .eq('id', member.id)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Préférences mises à jour' : 'Preferences updated')
      setEditingPreferences(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error(locale === 'fr' ? 'Impossible de mettre à jour' : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // Check if preferences section has any data - use localized values
  const localizedCommStyles = getLocalizedArray(member.preferences.communication_style, locale)
  const localizedStrengths = getLocalizedArray(member.preferences.key_strengths, locale)
  const localizedSensitivities = getLocalizedArray(member.preferences.areas_of_sensitivity, locale)
  const localizedTherapeuticContext = getLocalizedValue(member.preferences.therapeutic_context, locale)
  const localizedCurrentTreatment = getLocalizedValue(member.preferences?.current_treatment, locale)

  const hasPreferencesData =
    localizedCommStyles.length > 0 ||
    localizedStrengths.length > 0 ||
    localizedSensitivities.length > 0 ||
    localizedTherapeuticContext ||
    localizedCurrentTreatment

  const noteTypeColors: Record<string, { bg: string; text: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-700' },
    symptome: { bg: 'bg-rose-50', text: 'text-rose-700' },
    recurrence: { bg: 'bg-purple-50', text: 'text-purple-700' },
    hypothese: { bg: 'bg-teal-50', text: 'text-teal-700' },
    transfert: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    contre_transfert: { bg: 'bg-pink-50', text: 'text-pink-700' },
    ajustement_envisage: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    milestone: { bg: 'bg-green-50', text: 'text-green-700' },
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

  // Card titles
  const cardTitles: Record<string, { label: string; icon: React.ReactNode; iconBg: string; iconColor: string }> = {
    ai_summary: {
      label: 'Bloom Pulse',
      icon: <Sparkles className="w-4 h-4" />,
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-600',
    },
    about: {
      label: t.members.overview.aboutClient,
      icon: <User className="w-4 h-4" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    active_goals: {
      label: locale === 'fr' ? 'Axes de travail actifs' : 'Active Goals',
      icon: <Target className="w-4 h-4" />,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    past_sessions: {
      label: locale === 'fr' ? 'Séances' : 'Sessions',
      icon: <Clock className="w-4 h-4" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    preferences: {
      label: t.members.overview.preferences,
      icon: <Heart className="w-4 h-4" />,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    recent_notes: {
      label: t.members.overview.recentNotes,
      icon: <MessageSquare className="w-4 h-4" />,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    shared_resources: {
      label: locale === 'fr' ? 'Ressources partagées' : 'Shared Resources',
      icon: <Share2 className="w-4 h-4" />,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  }

  // Render card content based on card ID
  const renderCardContent = (cardId: string) => {
    switch (cardId) {
      case 'ai_summary':
        return loadingSummary ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
        ) : latestSummary ? (
          <div className="space-y-3">
            {/* Current Status Preview */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-700 line-clamp-3">
                {(latestSummary.summary_content as SummaryContent).current_status}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(latestSummary.generated_at)}
              </span>
            </div>

            {/* View Full Summary Button */}
            <Button
              onClick={() => setShowSummaryModal(true)}
              variant="outline"
              className="w-full border-teal-500/30 text-teal-600 hover:bg-teal-500/5 rounded-lg"
            >
              {locale === 'fr' ? 'Voir Bloom Pulse' : locale === 'es' ? 'Ver Bloom Pulse' : 'View Bloom Pulse'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {locale === 'fr' ? 'Générez un aperçu thérapeutique' : locale === 'es' ? 'Genera una vista terapéutica' : 'Generate a therapeutic pulse'}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {locale === 'fr' ? 'Basé sur les séances et les notes' : locale === 'es' ? 'Basado en sesiones y notas' : 'Based on sessions and notes'}
            </p>
            <Button
              onClick={() => setShowSummaryModal(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
            >
              {locale === 'fr' ? 'Générer' : locale === 'es' ? 'Generar' : 'Generate'}
            </Button>
          </div>
        )

      case 'about':
        return (
          <>
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
                  <p className="text-sm text-gray-500 mb-3">{locale === 'fr' ? 'Aucune note ajoutée' : 'No notes added yet'}</p>
                  <Button
                    size="sm"
                    onClick={() => setEditingAbout(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {locale === 'fr' ? 'Ajouter des notes' : 'Add Notes'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Merged: Key considerations / Points d'attention as a sub-section */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3 group/prefs">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {locale === 'fr' ? "Points d'attention" : locale === 'es' ? 'Puntos de atención' : 'Key considerations'}
                </h4>
                {!editingPreferences && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPreferences(true)}
                    className="text-gray-400 hover:text-gray-700 h-6 w-6 p-0 rounded-md opacity-0 group-hover/prefs:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              {renderCardContent('preferences')}
            </div>
          </>
        )

      case 'active_goals':
        return activeGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucun axe de travail actif' : 'No active goals'}</p>
            <p className="text-xs text-gray-400 mt-1">{locale === 'fr' ? 'Les axes de travail en cours apparaîtront ici' : 'Goals in progress will appear here'}</p>
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
                  className="group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onNavigateToTab?.('progress', goal.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                      {goal.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {goal.target_date && (
                        <span className="text-xs text-gray-400">
                          {locale === 'fr' ? 'Cible:' : 'Target:'} {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{goal.title}</h4>
                  {goal.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                  )}
                </motion.div>
              )
            })}

            {/* View All Goals button */}
            <button
              onClick={() => onNavigateToTab?.('progress')}
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {locale === 'fr' ? `Voir tous les axes de travail (${activeGoals.length})` : `View All Goals (${activeGoals.length})`}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )

      case 'past_sessions':
        return sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucune séance' : 'No sessions yet'}</p>
            <p className="text-xs text-gray-400 mt-1">{locale === 'fr' ? 'Les séances passées apparaîtront ici' : 'Past sessions will appear here'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 3).map((session, index) => {
              const FormatIcon = session.session_format === 'in_person' ? User
                : session.session_format === 'phone' ? Phone
                : Video
              const statusStyle =
                session.status === 'completed' ? { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' }
                : session.status === 'cancelled' ? { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
                : session.status === 'no_show' ? { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' }
                : { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' }
              const statusLabel = locale === 'fr'
                ? ({ scheduled: 'planifié', confirmed: 'confirmé', completed: 'terminé', cancelled: 'annulé', no_show: 'absent' } as Record<string, string>)[session.status?.toLowerCase()] || session.status
                : session.status
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                  onClick={() => onNavigateToTab?.('sessions_notes', session.id, 'sessions')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-gray-200 shrink-0">
                        <FormatIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {getSessionTypeLabel(session.session_type, locale)}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle.bg} ${statusStyle.text} shrink-0`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>
                            {new Date(session.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </span>
                          <span>·</span>
                          <span>{session.duration_minutes} {locale === 'fr' ? 'min' : 'min'}</span>
                          <span>·</span>
                          <span>{getSessionFormatLabel(session.session_format, locale)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 ml-2" />
                  </div>
                </motion.div>
              )
            })}

            {/* View All Sessions button - always show to navigate to sessions tab */}
            <button
              onClick={() => onNavigateToTab?.('sessions_notes', 'past-sessions-section', 'sessions')}
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {locale === 'fr' ? `Voir toutes les séances (${sessions.length})` : `View All Sessions (${sessions.length})`}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )

      case 'preferences':
        return (
          <AnimatePresence mode="wait">
            {editingPreferences ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Communication Style — hidden */}
                {false && <div>
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
                </div>}

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

                {/* Current Treatment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.overview.currentTreatment}
                  </label>
                  <textarea
                    value={currentTreatment}
                    onChange={(e) => setCurrentTreatment(e.target.value)}
                    placeholder={locale === 'fr' ? 'Décrivez le traitement en cours...' : 'Describe current treatment...'}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCommStyles(getLocalizedArray(member.preferences.communication_style, locale))
                      setStrengths(getLocalizedArray(member.preferences.key_strengths, locale))
                      setSensitivities(getLocalizedArray(member.preferences.areas_of_sensitivity, locale))
                      setCurrentTreatment(getLocalizedValue(member.preferences?.current_treatment, locale) || '')
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
                {/* Communication Style — hidden */}

                {localizedStrengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.keyStrengths}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {localizedStrengths.map((strength) => (
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

                {localizedSensitivities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.areasOfSensitivity}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {localizedSensitivities.map((area) => (
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

                {localizedCurrentTreatment && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.currentTreatment}
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {localizedCurrentTreatment}
                    </p>
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
                <p className="text-sm text-gray-500 mb-3">{locale === 'fr' ? 'Aucune préférence définie' : 'No preferences set yet'}</p>
                <Button
                  size="sm"
                  onClick={() => setEditingPreferences(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {locale === 'fr' ? 'Ajouter des préférences' : 'Add Preferences'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )

      case 'recent_notes': {
        // Tag color palette — matches NotesTab's getNoteColor
        const tagColors: Record<string, { bg: string; text: string; border: string }> = {
          general:             { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
          recurrence:          { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
          hypothese:           { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
          symptome:            { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
          transfert:           { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200' },
          contre_transfert:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200' },
          ajustement_envisage: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
          session_summary:     { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
        }
        const fallbackTagColor = { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }

        // Resolve a human-readable label for any tag (uses i18n if available)
        const tagLabel = (slug: string): string => {
          const noteTypeLabels = (t.members as { noteTypes?: Record<string, string> })?.noteTypes
          if (slug === 'session_summary') return locale === 'fr' ? 'Résumé de séance' : locale === 'es' ? 'Resumen de sesión' : 'Session Summary'
          return noteTypeLabels?.[slug] || slug.replace(/_/g, ' ')
        }

        // Build list of latest 3 unique INLINE tags. We scan note content for
        // <mark data-tag="..." data-tag-label="...">tagged text</mark>
        // (the actual content tags practitioners apply inside the rich-text
        // editor). For each tag, keep the most recent note that introduced
        // it AND the tagged text fragment so we can show "tag → text".
        const seen = new Set<string>()
        const recentTags: Array<{ tag: string; label?: string; text: string; note: CombinedNote }> = []
        const tagRegex = /<mark[^>]*data-tag="([^"]*)"[^>]*?data-tag-label="([^"]*)"[^>]*>([\s\S]*?)<\/mark>/g
        for (const note of allNotes) {
          if (!note.content) continue
          const inlineTags: Array<{ type: string; label: string; text: string }> = []
          let m: RegExpExecArray | null
          tagRegex.lastIndex = 0
          while ((m = tagRegex.exec(note.content)) !== null) {
            const innerText = stripHtml(m[3]).trim()
            inlineTags.push({ type: m[1], label: m[2], text: innerText })
          }
          for (const inline of inlineTags) {
            if (seen.has(inline.type)) continue
            seen.add(inline.type)
            recentTags.push({ tag: inline.type, label: inline.label, text: inline.text, note })
            if (recentTags.length >= 3) break
          }
          if (recentTags.length >= 3) break
        }

        if (recentTags.length === 0) {
          return (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{t.members.overview.noNotes}</p>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'fr' ? 'Les tags utilisés apparaîtront ici' : locale === 'es' ? 'Las etiquetas usadas aparecerán aquí' : 'Tags you use will appear here'}
              </p>
            </div>
          )
        }

        return (
          <div className="space-y-2">
            {recentTags.map(({ tag, label, text, note }, index) => {
              const colors = tagColors[tag] || fallbackTagColor
              const displayLabel = label || tagLabel(tag)
              return (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => onNavigateToTab?.('sessions_notes', note.note_id, 'notes')}
                  className="group w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${colors.bg} ${colors.text} ${colors.border} shrink-0`}>
                        {displayLabel}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatRelativeTime(note.created_at)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </div>
                  {text && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{text}</p>
                  )}
                </motion.button>
              )
            })}

            {/* View All Notes button */}
            <button
              onClick={() => setShowAllNotesModal(true)}
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {locale === 'fr' ? `Voir toutes les notes (${allNotes.length})` : `View All Notes (${allNotes.length})`}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )
      }

      case 'shared_resources':
        return sharedResources.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucune ressource partagée' : 'No shared resources'}</p>
            <p className="text-xs text-gray-400 mt-1">{locale === 'fr' ? 'Les ressources partagées avec ce client apparaîtront ici' : 'Resources you\'ve shared with this client will appear here'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedResources.slice(0, 3).map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onNavigateToTab?.('shared', resource.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    (resource.status === 'submitted' || resource.viewed_at) ? 'bg-emerald-50 text-emerald-700' :
                    resource.status === 'draft' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {(resource.status === 'submitted' || resource.viewed_at) ? (locale === 'fr' ? 'Complété' : 'Completed') :
                     resource.status === 'draft' ? (locale === 'fr' ? 'En cours' : 'In progress') :
                     (locale === 'fr' ? 'En attente' : 'Pending')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(resource.shared_at)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">{resource.resource?.title}</h4>
                {resource.resource?.type && (
                  <span className="text-xs text-gray-500 capitalize">{resource.resource.type}</span>
                )}
              </motion.div>
            ))}

            {/* View All Resources button */}
            <button
              onClick={() => onNavigateToTab?.('shared', 'shared-resources-section')}
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {locale === 'fr' ? `Voir toutes les ressources (${sharedResources.length})` : `View All Resources (${sharedResources.length})`}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )

      default:
        return null
    }
  }

  // Render a single card
  const renderCard = (cardConfig: CardLayoutItem, columnIndex: number, cardIndex: number) => {
    const cardInfo = cardTitles[cardConfig.id]
    if (!cardInfo) return null

    const isDragging = draggedCard === cardConfig.id
    const isDropTarget = dragOverColumn === columnIndex && dragOverIndex === cardIndex
    const isEditing = (cardConfig.id === 'about' && editingAbout) || (cardConfig.id === 'preferences' && editingPreferences)

    return (
      <div
        key={cardConfig.id}
        draggable={!isEditing}
        onDragStart={(e) => isEditing ? e.preventDefault() : handleDragStart(e, cardConfig.id)}
        onDragOver={(e) => handleDragOver(e, columnIndex as 0 | 1, cardIndex)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, columnIndex as 0 | 1, cardIndex)}
        onDragEnd={handleDragEnd}
        className={`transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
      >
        {isDropTarget && !isDragging && (
          <div className="h-2 mb-2 bg-blue-100 rounded-full transition-all" />
        )}
        <motion.div
          layout={!isEditing}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          ref={cardConfig.id === 'preferences' ? preferencesRef : undefined}
          className={`bg-white rounded-2xl p-6 border border-gray-200 group ${isDragging ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              {cardConfig.id !== 'ai_summary' && (
                <div className={`w-9 h-9 rounded-xl ${cardInfo.iconBg} flex items-center justify-center ${cardInfo.iconColor}`}>
                  {cardInfo.icon}
                </div>
              )}
              {cardInfo.label}
            </h3>
            <div className="flex items-center gap-1">
              {/* Edit button for about and preferences */}
              {cardConfig.id === 'about' && !editingAbout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAbout(true)}
                  className="text-gray-500 hover:text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              {cardConfig.id === 'preferences' && !editingPreferences && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPreferences(true)}
                  className="text-gray-500 hover:text-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          </div>
          {renderCardContent(cardConfig.id)}
        </motion.div>
      </div>
    )
  }

  // Render column drop zone
  const renderColumnDropZone = (columnIndex: 0 | 1, cardsInColumn: CardLayoutItem[]) => {
    const isDropTarget = dragOverColumn === columnIndex && dragOverIndex === cardsInColumn.length

    return (
      <div
        onDragOver={(e) => handleDragOver(e, columnIndex, cardsInColumn.length)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, columnIndex, cardsInColumn.length)}
        className={`min-h-[50px] transition-all rounded-xl ${
          isDropTarget && draggedCard ? 'bg-blue-50 border-2 border-dashed border-blue-200' : ''
        }`}
      />
    )
  }

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
          {leftColumnCards.map((card, index) => renderCard(card, 0, index))}
          {renderColumnDropZone(0, leftColumnCards)}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {rightColumnCards.map((card, index) => renderCard(card, 1, index))}
          {renderColumnDropZone(1, rightColumnCards)}
        </div>
      </div>

      {/* All Notes Modal */}
      <AnimatePresence>
        {showAllNotesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAllNotesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {locale === 'fr' ? 'Toutes les notes' : 'All Notes'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {locale === 'fr' ? `${allNotes.length} notes trouvées` : `${allNotes.length} notes found`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllNotesModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {allNotes.map((note, index) => {
                    const noteStyles: Record<string, { bg: string; text: string; icon: React.ReactNode; tab: TabId; sub?: SubTabId }> = {
                      session_summary: { bg: 'bg-blue-50', text: 'text-blue-700', icon: <FileText className="w-3 h-3" />, tab: 'sessions_notes', sub: 'sessions' },
                      note: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <MessageSquare className="w-3 h-3" />, tab: 'sessions_notes', sub: 'notes' },
                    }
                    const style = noteStyles[note.type]
                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * index }}
                        className="group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setShowAllNotesModal(false)
                          onNavigateToTab?.(style.tab, note.session_id, style.sub)
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
                              {style.icon}
                              {note.source_label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(note.created_at)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{stripHtml(note.content)}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Summary Modal */}
      <MemberSummaryModal
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false)
          // Refresh the latest summary after modal closes
          const refreshSummary = async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) return

              const response = await fetch(`/api/members/${member.id}/summary`, {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              })

              if (response.ok) {
                const data = await response.json()
                setLatestSummary(data.summary)
              }
            } catch (error) {
              console.error('Error refreshing summary:', error)
            }
          }
          refreshSummary()
        }}
        memberId={member.id}
        memberName={getMemberFullName(member)}
        onNavigateToSource={(sourceType, sourceId) => {
          // Map Pulse source types → main tab + optional sub-tab
          const tabMap: Record<string, { tab: TabId; sub?: SubTabId } | null> = {
            session: { tab: 'sessions_notes', sub: 'sessions' },
            note: { tab: 'sessions_notes', sub: 'notes' },
            milestone: { tab: 'progress' },
            file: { tab: 'files' },
            reflection: null, // no destination — reflections are patient-private
          }
          const target = tabMap[sourceType]
          if (target && onNavigateToTab) {
            onNavigateToTab(target.tab, sourceId, target.sub)
          }
        }}
      />
    </div>
  )
}
