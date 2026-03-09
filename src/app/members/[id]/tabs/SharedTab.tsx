'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Share2,
  Plus,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Book,
  Calendar,
  MessageSquare,
  FileText,
  ClipboardCheck,
  Puzzle,
  BookOpen,
  Table2,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { SharedResourceWithStory, Member } from '@/types/member'
import type { Resource, ResourceResponse, ResourceBlock } from '@/types/resource'

interface SharedTabProps {
  memberId: string
  member?: Member
  highlightResourceId?: string
}

interface Story {
  id: string
  title: string
  unique_slug: string
  published: boolean
}

// Shared resource from library
interface SharedLibraryResource {
  id: string
  member_id: string
  resource_id: string
  practitioner_id: string
  shared_at: string
  message: string | null
  viewed_at: string | null
  resource: {
    id: string
    title: string
    type: string
    description: string | null
  }
}

interface SubmissionWithResource extends ResourceResponse {
  resource: Resource
}

// Resource type icons
const resourceTypeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  assessment: ClipboardCheck,
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

// Resource type config
const resourceTypeConfig: Record<string, { bg: string; text: string; iconBg: string }> = {
  worksheet: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  assessment: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100' },
  exercise: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  psychoeducation: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  table: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
}

export default function SharedTab({ memberId, member, highlightResourceId }: SharedTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()


  // Shared resources state
  const [sharedResources, setSharedResources] = useState<SharedResourceWithStory[]>([])
  const [sharedLibraryResources, setSharedLibraryResources] = useState<SharedLibraryResource[]>([])
  const [availableStories, setAvailableStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedStory, setSelectedStory] = useState<string>('')
  const [shareMessage, setShareMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionWithResource[]>([])

  // Expanded response viewer
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null)

  // Resource completion filter
  const [resourceFilter, setResourceFilter] = useState<'all' | 'completed' | 'not_completed'>('all')

  // Scroll to highlighted resource or section
  useEffect(() => {
    if (highlightResourceId) {
      // Wait for the DOM to update
      setTimeout(() => {
        // Handle special case for shared-resources-section
        const elementId = highlightResourceId === 'shared-resources-section'
          ? 'shared-resources-section'
          : `resource-${highlightResourceId}`
        const element = document.getElementById(elementId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [highlightResourceId])

  useEffect(() => {
    fetchData()
    if (member) {
      fetchSubmissions()
    }
  }, [memberId, member?.id])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch shared stories
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_resources')
        .select(`
          *,
          story:stories!inner(id, title, unique_slug, published)
        `)
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('shared_at', { ascending: false })

      if (sharedError && sharedError.code !== '42P01') {
        console.error('Error fetching shared resources:', sharedError)
      }

      setSharedResources(sharedData || [])

      // Fetch shared library resources
      const { data: libraryData, error: libraryError } = await supabase
        .from('member_shared_resources')
        .select(`
          *,
          resource:resources!inner(id, title, type, description)
        `)
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('shared_at', { ascending: false })

      if (libraryError && libraryError.code !== '42P01' && libraryError.code !== 'PGRST116') {
        if (libraryError.message && !libraryError.message.includes('does not exist')) {
          console.error('Error fetching shared library resources:', libraryError)
        }
      }

      setSharedLibraryResources(libraryData || [])

      // Fetch available stories
      const sharedStoryIds = (sharedData || []).map(s => s.story_id)

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, title, unique_slug, published')
        .eq('author_id', user.id)
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (storiesError && storiesError.code !== '42P01' && storiesError.code !== 'PGRST116') {
        if (storiesError.message && !storiesError.message.includes('does not exist')) {
          console.error('Error fetching stories:', storiesError)
        }
      }

      const available = (storiesData || []).filter(s => !sharedStoryIds.includes(s.id))
      setAvailableStories(available)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    if (!member) return
    try {
      const { data, error } = await supabase
        .from('resource_responses')
        .select(`
          *,
          resource:resources(*)
        `)
        .eq('member_id', member.id)
        .in('status', ['submitted', 'reviewed', 'draft'])
        .order('submitted_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          setSubmissions([])
          return
        }
        throw error
      }

      setSubmissions((data || []) as SubmissionWithResource[])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const renderResponseValue = (block: ResourceBlock, value: unknown): string => {
    if (value === undefined || value === null) return '-'
    switch (block.type) {
      case 'prompt': return String(value)
      case 'multiple_choice': {
        const options: (string | { label?: string })[] = ('options' in block && Array.isArray(block.options)) ? block.options :
          ('choices' in block && Array.isArray(block.choices)) ? block.choices : []
        const index = Number(value)
        const option = options[index]
        return typeof option === 'string' ? option : option?.label || `Option ${index + 1}`
      }
      case 'yes_no': return value === 'yes' ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No')
      case 'checklist': {
        const items: (string | { text: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
        const indices = Array.isArray(value) ? value : []
        return indices.map((i: number) => { const item = items[i]; return typeof item === 'string' ? item : item?.text || String(i) }).join(', ') || '-'
      }
      case 'scale': case 'likert': case 'numeric': case 'slider': case 'mood': return String(value)
      case 'matrix_rating': {
        const matrixItems = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
        const ratings = value as Record<string, number>
        return Object.entries(ratings).map(([idx, rating]) => `${matrixItems[Number(idx)] || idx}: ${rating}`).join(', ')
      }
      case 'table_exercise': {
        const rows = Array.isArray(value) ? value : []
        return `${rows.length} ${locale === 'fr' ? 'entrées' : 'entries'}`
      }
      case 'date_picker': return value ? new Date(String(value)).toLocaleDateString() : '-'
      case 'time_input': return String(value)
      case 'list_input': return Array.isArray(value) ? value.filter(Boolean).join(', ') : '-'
      default: return JSON.stringify(value)
    }
  }

  const handleShareStory = async () => {
    if (!selectedStory) {
      toast.error('Please select a story')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('shared_resources')
        .insert({
          member_id: memberId,
          story_id: selectedStory,
          practitioner_id: user.id,
          shared_at: new Date().toISOString(),
          message: shareMessage.trim() || null,
        })

      if (error) throw error

      toast.success(t.members.success.resourceShared)
      setShowShareModal(false)
      setSelectedStory('')
      setShareMessage('')
      fetchData()
    } catch (error) {
      console.error('Error sharing story:', error)
      toast.error('Failed to share story')
    } finally {
      setSaving(false)
    }
  }

  const handleUnshare = async (resourceId: string) => {
    if (!confirm('Are you sure you want to unshare this resource?')) return

    try {
      const { error } = await supabase
        .from('shared_resources')
        .delete()
        .eq('id', resourceId)

      if (error) throw error

      toast.success('Resource unshared')
      fetchData()
    } catch (error) {
      console.error('Error unsharing resource:', error)
      toast.error('Failed to unshare resource')
    }
  }

  const handleUnshareLibraryResource = async (resourceId: string) => {
    if (!confirm(locale === 'fr' ? 'Êtes-vous sûr de vouloir annuler le partage?' : 'Are you sure you want to unshare this resource?')) return

    try {
      const { error } = await supabase
        .from('member_shared_resources')
        .delete()
        .eq('id', resourceId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Partage annulé' : 'Resource unshared')
      fetchData()
    } catch (error) {
      console.error('Error unsharing library resource:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'annulation du partage' : 'Failed to unshare resource')
    }
  }

  // Resource filter helper
  const filteredLibraryResources = sharedLibraryResources.filter(resource => {
    if (resourceFilter === 'all') return true
    const hasSubmission = submissions.some(s => s.resource_id === resource.resource_id)
    const isCompleted = hasSubmission || !!resource.viewed_at
    if (resourceFilter === 'completed') return isCompleted
    return !isCompleted // not_completed
  })

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

  const totalShared = sharedResources.length + sharedLibraryResources.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            {locale === 'fr' ? 'Partagé' : 'Shared'}
          </h3>
          {totalShared > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              {totalShared}
            </span>
          )}
        </div>

        <Link href="/resources">
          <Button
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.members.shared.shareStory}
          </Button>
        </Link>
      </div>

      {/* Shared Resources Section */}
      <>
          {/* Share Modal */}
          <AnimatePresence>
            {showShareModal && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    <Book className="w-5 h-5 text-lavender-500" />
                    {t.members.shared.shareStory}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a Story
                      </label>
                      <select
                        value={selectedStory}
                        onChange={(e) => setSelectedStory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                      >
                        <option value="">Choose a story...</option>
                        {availableStories.map((story) => (
                          <option key={story.id} value={story.id}>
                            {story.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-lavender-500" />
                        {t.members.shared.message} (optional)
                      </label>
                      <textarea
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="Add a personal message for your client..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={() => setShowShareModal(false)} className="rounded-xl">
                      {t.members.form.cancel}
                    </Button>
                    <Button
                      onClick={handleShareStory}
                      disabled={saving || !selectedStory}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                    >
                      {saving ? t.members.form.saving : t.members.shared.shareStory}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shared Library Resources */}
          {sharedLibraryResources.length > 0 && (
            <motion.div
              id="shared-resources-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: highlightResourceId === 'shared-resources-section'
                  ? ['0 0 0 0 rgba(99, 102, 241, 0)', '0 0 20px 8px rgba(99, 102, 241, 0.4)', '0 0 0 0 rgba(99, 102, 241, 0)']
                  : '0 0 0 0 rgba(0, 0, 0, 0)'
              }}
              transition={{
                boxShadow: highlightResourceId === 'shared-resources-section' ? { duration: 1.5, repeat: 2 } : {}
              }}
              className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${
                highlightResourceId === 'shared-resources-section' ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
              }`}
            >
              <div className="p-4 border-b border-gray-100/50">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-gray-900">
                      {locale === 'fr' ? 'Ressources' : 'Resources'}
                    </h3>
                    <span className="text-xs bg-mint-100 text-mint-700 px-2 py-0.5 rounded-full">
                      {sharedLibraryResources.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setResourceFilter('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        resourceFilter === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {locale === 'fr' ? 'Tous' : 'All'}
                    </button>
                    <button
                      onClick={() => setResourceFilter('completed')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        resourceFilter === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {locale === 'fr' ? 'Complété' : 'Completed'}
                    </button>
                    <button
                      onClick={() => setResourceFilter('not_completed')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        resourceFilter === 'not_completed'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {locale === 'fr' ? 'Non complété' : 'Not Completed'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 p-4">
                {filteredLibraryResources.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">
                      {resourceFilter === 'completed'
                        ? (locale === 'fr' ? 'Aucune ressource complétée' : 'No completed resources')
                        : (locale === 'fr' ? 'Aucune ressource non complétée' : 'No uncompleted resources')}
                    </p>
                  </div>
                ) : filteredLibraryResources.map((resource, index) => {
                  const TypeIcon = resourceTypeIcons[resource.resource.type] || FileText
                  const config = resourceTypeConfig[resource.resource.type] || resourceTypeConfig.worksheet
                  const isHighlighted = highlightResourceId === resource.id
                  return (
                    <motion.div
                      key={resource.id}
                      id={`resource-${resource.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        boxShadow: isHighlighted
                          ? ['0 0 0 0 rgba(99, 102, 241, 0)', '0 0 20px 8px rgba(99, 102, 241, 0.4)', '0 0 0 0 rgba(99, 102, 241, 0)']
                          : '0 0 0 0 rgba(0, 0, 0, 0)'
                      }}
                      transition={{
                        delay: 0.05 * index,
                        boxShadow: isHighlighted ? { duration: 1.5, repeat: 2 } : {}
                      }}
                      className={`bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group ${
                        isHighlighted ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                            <TypeIcon className={`w-6 h-6 ${config.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{resource.resource.title}</h4>
                                {resource.resource.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.resource.description.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}</p>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text} flex-shrink-0`}>
                                {resource.resource.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                                <Calendar className="w-3 h-3" />
                                {locale === 'fr' ? 'Partagé le' : 'Shared on'} {new Date(resource.shared_at).toLocaleDateString()}
                              </span>
                              {(() => {
                                const isPsychoeducation = resource.resource.type === 'psychoeducation'
                                const submission = submissions.find(s => s.resource_id === resource.resource_id)

                                // Check for submission first
                                if (submission) {
                                  // For psychoeducation, show "Read on" instead of "Submitted on"
                                  if (isPsychoeducation) {
                                    return (
                                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        <Eye className="w-3 h-3" />
                                        {locale === 'fr' ? 'Lu le' : 'Read on'} {new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
                                      </span>
                                    )
                                  }
                                  return (
                                    <span className="flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                                      <CheckCircle className="w-3 h-3" />
                                      {locale === 'fr' ? 'Soumis le' : 'Submitted on'} {new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
                                    </span>
                                  )
                                }

                                // Then check viewed status
                                if (resource.viewed_at) {
                                  return (
                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                      <Eye className="w-3 h-3" />
                                      {isPsychoeducation
                                        ? (locale === 'fr' ? 'Lu le' : 'Read on')
                                        : (locale === 'fr' ? 'Vu le' : 'Viewed on')
                                      } {new Date(resource.viewed_at).toLocaleDateString()}
                                    </span>
                                  )
                                }

                                // Not viewed/read
                                return (
                                  <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                    <EyeOff className="w-3 h-3" />
                                    {isPsychoeducation
                                      ? (locale === 'fr' ? 'Non lu' : 'Not read')
                                      : (locale === 'fr' ? 'Non vu' : 'Not viewed')
                                    }
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link href={`/resources/${resource.resource_id}`}>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors h-9 w-9 p-0">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnshareLibraryResource(resource.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors h-9 w-9 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* View Responses - for interactive resource types */}
                      {(() => {
                        const submission = submissions.find(s => s.resource_id === resource.resource_id)
                        const isInteractive = ['worksheet', 'exercise', 'assessment', 'table'].includes(resource.resource.type)
                        if (!isInteractive || !submission) return null

                        const isExpanded = expandedResponseId === resource.id
                        const blocks = (submission.resource?.blocks || []) as ResourceBlock[]
                        const questionBlocks = blocks.filter(b =>
                          ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
                           'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input', 'table_exercise'].includes(b.type)
                        )
                        const responses = (submission.responses || {}) as Record<string, unknown>

                        return (
                          <>
                            <button
                              onClick={() => setExpandedResponseId(isExpanded ? null : resource.id)}
                              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {locale === 'fr' ? 'Voir les réponses' : 'View Responses'}
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                                    {questionBlocks.length > 0 ? questionBlocks.map((block, idx) => {
                                      const response = responses[block.id]
                                      const hasResponse = response !== undefined && response !== null && response !== ''

                                      // Table exercise: render rows
                                      if (block.type === 'table_exercise' && Array.isArray(response) && response.length > 0) {
                                        const columns = ('columns' in block && Array.isArray(block.columns)) ? block.columns : []
                                        return (
                                          <div key={block.id} className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-xs font-medium text-gray-500 mb-2">{typeof block.content === 'string' ? block.content : `Q${idx + 1}`}</p>
                                            <div className="overflow-x-auto">
                                              <table className="w-full text-xs">
                                                <thead>
                                                  <tr>
                                                    {columns.map((col: { id: string; header: string }) => (
                                                      <th key={col.id} className="text-left px-2 py-1.5 text-gray-500 font-medium border-b border-gray-200">{col.header}</th>
                                                    ))}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(response as Record<string, string>[]).map((row, ri) => (
                                                    <tr key={ri}>
                                                      {columns.map((col: { id: string; header: string }) => (
                                                        <td key={col.id} className="px-2 py-1.5 text-gray-900 border-b border-gray-100">{row[col.id] || '-'}</td>
                                                      ))}
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        )
                                      }

                                      return (
                                        <div key={block.id} className="rounded-xl bg-gray-50 px-3 py-2.5">
                                          <p className="text-xs text-gray-500">{typeof block.content === 'string' ? block.content : `Q${idx + 1}`}</p>
                                          <p className={`text-sm mt-0.5 ${hasResponse ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                            {hasResponse ? renderResponseValue(block, response) : (locale === 'fr' ? 'Non répondu' : 'Not answered')}
                                          </p>
                                        </div>
                                      )
                                    }) : (
                                      <p className="text-xs text-gray-400 text-center py-2">{locale === 'fr' ? 'Aucune question' : 'No questions'}</p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )
                      })()}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Shared Stories List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
          >
            {sharedResources.length === 0 && sharedLibraryResources.length === 0 ? (
              <div className="p-16 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
                  <div className="relative w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Book className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t.members.shared.noShared}</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">{t.members.shared.noSharedDescription}</p>
                <Link href="/resources">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-colors hover-lift">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.members.shared.shareStory}
                  </Button>
                </Link>
              </div>
            ) : sharedResources.length > 0 ? (
              <>
                <div className="p-4 border-b border-gray-100/50 flex items-center gap-2">
                  <Book className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{locale === 'fr' ? 'Histoires Partagées' : 'Shared Stories'}</h3>
                  <span className="text-xs bg-lavender-100 text-lavender-700 px-2 py-0.5 rounded-full">{sharedResources.length}</span>
                </div>
                <div className="grid gap-4 p-4">
                  {sharedResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:shadow-md group-hover:scale-105 transition-all">
                            <Book className="w-7 h-7 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{resource.story.title}</h4>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                <Calendar className="w-3 h-3" />
                                {t.members.shared.sharedOn} {new Date(resource.shared_at).toLocaleDateString()}
                              </span>
                              {resource.viewed_at ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                  <Eye className="w-3 h-3" />
                                  {t.members.shared.viewedOn} {new Date(resource.viewed_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                  <EyeOff className="w-3 h-3" />
                                  {t.members.shared.notViewed}
                                </span>
                              )}
                            </div>
                            {resource.message && (
                              <div className="mt-3 bg-gray-50 p-3 rounded-xl">
                                <p className="text-sm text-gray-600 flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                  {resource.message}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`/stories/${resource.story.unique_slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-gray-50 rounded-xl transition-colors">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              {t.members.shared.viewStory}
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnshare(resource.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : null}
          </motion.div>
        </>
    </div>
  )
}
