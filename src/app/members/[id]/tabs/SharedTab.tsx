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
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { SharedResourceWithStory, Member } from '@/types/member'
import type { Resource, ResourceBlock, ResourceResponse } from '@/types/resource'

interface SharedTabProps {
  memberId: string
  member?: Member
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

export default function SharedTab({ memberId, member }: SharedTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  // Tab state
  const [activeSection, setActiveSection] = useState<'shared' | 'submissions'>('shared')

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
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'submitted' | 'reviewed'>('all')

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
        .in('status', ['submitted', 'reviewed'])
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
    } finally {
      setSubmissionsLoading(false)
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

  // Submissions helpers
  const filteredSubmissions = submissions.filter(sub => {
    if (submissionFilter === 'all') return true
    return sub.status === submissionFilter
  })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          icon: CheckCircle,
          label: locale === 'fr' ? 'Soumis' : 'Submitted',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
        }
      case 'reviewed':
        return {
          icon: Eye,
          label: locale === 'fr' ? 'Examiné' : 'Reviewed',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        }
      default:
        return {
          icon: Clock,
          label: locale === 'fr' ? 'Brouillon' : 'Draft',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        }
    }
  }

  const renderResponseValue = (block: ResourceBlock, value: unknown): string => {
    if (value === undefined || value === null) return '-'

    switch (block.type) {
      case 'prompt':
        return String(value)
      case 'multiple_choice': {
        const options: (string | { label?: string })[] = ('options' in block && Array.isArray(block.options)) ? block.options :
          ('choices' in block && Array.isArray(block.choices)) ? block.choices : []
        const index = Number(value)
        const option = options[index]
        return typeof option === 'string' ? option : option?.label || `Option ${index + 1}`
      }
      case 'yes_no':
        return value === 'yes' ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No')
      case 'checklist': {
        const items: (string | { text: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
        const indices = Array.isArray(value) ? value : []
        return indices.map((i: number) => {
          const item = items[i]
          return typeof item === 'string' ? item : item?.text || String(i)
        }).join(', ') || '-'
      }
      case 'scale':
      case 'likert':
      case 'numeric':
      case 'slider':
      case 'mood':
        return String(value)
      case 'matrix_rating': {
        const matrixItems = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
        const ratings = value as Record<string, number>
        return Object.entries(ratings).map(([idx, rating]) => `${matrixItems[Number(idx)] || idx}: ${rating}`).join(', ')
      }
      case 'date_picker':
        return value ? new Date(String(value)).toLocaleDateString() : '-'
      case 'time_input':
        return String(value)
      case 'list_input':
        return Array.isArray(value) ? value.filter(Boolean).join(', ') : '-'
      default:
        return JSON.stringify(value)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-pulse-glow"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const totalShared = sharedResources.length + sharedLibraryResources.length

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveSection('shared')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'shared'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Share2 className="w-4 h-4" />
            {locale === 'fr' ? 'Partagé' : 'Shared'}
            {totalShared > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeSection === 'shared' ? 'bg-gray-100' : 'bg-gray-200'}`}>
                {totalShared}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'submissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="w-4 h-4" />
            {locale === 'fr' ? 'Soumissions' : 'Submissions'}
            {submissions.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeSection === 'submissions' ? 'bg-gray-100' : 'bg-gray-200'}`}>
                {submissions.length}
              </span>
            )}
          </button>
        </div>

        {activeSection === 'shared' && (
          <Link href="/resources">
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.members.shared.shareStory}
            </Button>
          </Link>
        )}
      </div>

      {/* Shared Resources Section */}
      {activeSection === 'shared' && (
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100/50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-gray-900">
                  {locale === 'fr' ? 'Ressources de la Bibliothèque' : 'Library Resources'}
                </h3>
                <span className="text-xs bg-mint-100 text-mint-700 px-2 py-0.5 rounded-full">
                  {sharedLibraryResources.length}
                </span>
              </div>
              <div className="divide-y divide-gray-100/50">
                {sharedLibraryResources.map((resource, index) => {
                  const TypeIcon = resourceTypeIcons[resource.resource.type] || FileText
                  const config = resourceTypeConfig[resource.resource.type] || resourceTypeConfig.worksheet
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-5 hover:bg-white/60 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0 group-hover:shadow-md group-hover:scale-105 transition-all`}>
                            <TypeIcon className={`w-7 h-7 ${config.text}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{resource.resource.title}</h4>
                            {resource.resource.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{resource.resource.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                                {resource.resource.type}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                                <Calendar className="w-3 h-3" />
                                {locale === 'fr' ? 'Partagé le' : 'Shared on'} {new Date(resource.shared_at).toLocaleDateString()}
                              </span>
                              {resource.viewed_at ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                  <Eye className="w-3 h-3" />
                                  {locale === 'fr' ? 'Vu le' : 'Viewed on'} {new Date(resource.viewed_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                  <EyeOff className="w-3 h-3" />
                                  {locale === 'fr' ? 'Non vu' : 'Not viewed'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/resources/${resource.resource_id}`}>
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-gray-50 rounded-xl transition-colors">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              {locale === 'fr' ? 'Voir' : 'View'}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnshareLibraryResource(resource.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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
                <div className="divide-y divide-gray-100/50">
                  {sharedResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="p-5 hover:bg-white/60 transition-all group"
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
      )}

      {/* Submissions Section */}
      {activeSection === 'submissions' && (
        <>
          {/* Submissions Filter */}
          <div className="flex gap-2">
            <Button
              variant={submissionFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubmissionFilter('all')}
              className={`rounded-full ${submissionFilter === 'all' ? 'bg-gray-900' : ''}`}
            >
              {locale === 'fr' ? 'Tous' : 'All'}
              <Badge variant="secondary" className="ml-1.5 bg-white/20">{submissions.length}</Badge>
            </Button>
            <Button
              variant={submissionFilter === 'submitted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubmissionFilter('submitted')}
              className={`rounded-full ${submissionFilter === 'submitted' ? 'bg-emerald-500' : ''}`}
            >
              {locale === 'fr' ? 'Soumis' : 'Submitted'}
              <Badge variant="secondary" className="ml-1.5 bg-white/20">{submissions.filter(s => s.status === 'submitted').length}</Badge>
            </Button>
            <Button
              variant={submissionFilter === 'reviewed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubmissionFilter('reviewed')}
              className={`rounded-full ${submissionFilter === 'reviewed' ? 'bg-blue-500' : ''}`}
            >
              {locale === 'fr' ? 'Examiné' : 'Reviewed'}
              <Badge variant="secondary" className="ml-1.5 bg-white/20">{submissions.filter(s => s.status === 'reviewed').length}</Badge>
            </Button>
          </div>

          {/* Submissions List */}
          {submissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === 'fr' ? 'Aucune soumission' : 'No submissions'}
              </h3>
              <p className="text-gray-500">
                {locale === 'fr' ? 'Ce membre n\'a pas encore soumis de réponses.' : 'This member hasn\'t submitted any responses yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const statusConfig = getStatusConfig(submission.status || 'draft')
                const StatusIcon = statusConfig.icon
                const isExpanded = expandedId === submission.id
                const resourceTitle = typeof submission.resource?.title === 'string' ? submission.resource.title : 'Untitled Resource'
                const blocks = (submission.resource?.blocks || []) as ResourceBlock[]
                const questionBlocks = blocks.filter(b =>
                  ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert', 'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input'].includes(b.type)
                )
                const responses = (submission.responses || {}) as Record<string, unknown>
                const scores = submission.scores as { total?: number; maxScore?: number; percentage?: number } | null

                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                  >
                    <div onClick={() => toggleExpand(submission.id)} className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{resourceTitle}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {submission.submitted_at && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(submission.submitted_at)}
                                </span>
                              )}
                              {scores && scores.total !== undefined && (
                                <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50">
                                  <Star className="w-3 h-3 mr-1" />
                                  {scores.total}/{scores.maxScore} ({scores.percentage}%)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100"
                        >
                          <div className="p-5 space-y-4">
                            {questionBlocks.length > 0 ? (
                              <div className="space-y-3">
                                {questionBlocks.map((block, index) => {
                                  const response = responses[block.id]
                                  const hasResponse = response !== undefined && response !== null && response !== ''
                                  return (
                                    <div key={block.id} className={`p-4 rounded-xl ${hasResponse ? 'bg-gray-50' : 'bg-red-50/50'}`}>
                                      <p className="text-sm font-medium text-gray-700 mb-1">
                                        Q{index + 1}: {typeof block.content === 'string' ? block.content : ''}
                                      </p>
                                      <p className={`text-sm ${hasResponse ? 'text-gray-900' : 'text-red-500 italic'}`}>
                                        {hasResponse ? renderResponseValue(block, response) : (locale === 'fr' ? 'Non répondu' : 'Not answered')}
                                      </p>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                {locale === 'fr' ? 'Aucune question dans cette ressource' : 'No questions in this resource'}
                              </div>
                            )}

                            {submission.practitioner_notes && (
                              <div className="p-4 bg-lavender-50 rounded-xl border border-lavender-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-lavender-700">{locale === 'fr' ? 'Vos notes' : 'Your Notes'}</span>
                                </div>
                                <p className="text-sm text-lavender-800">{submission.practitioner_notes}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
                              <span>{locale === 'fr' ? 'Créé' : 'Created'}: {formatDate(submission.created_at)}</span>
                              <span>{locale === 'fr' ? 'Mis à jour' : 'Updated'}: {formatDate(submission.updated_at)}</span>
                              {submission.time_spent_seconds && (
                                <span>{locale === 'fr' ? 'Temps passé' : 'Time spent'}: {Math.round(submission.time_spent_seconds / 60)} min</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
