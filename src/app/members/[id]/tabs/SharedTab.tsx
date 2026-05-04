'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Clock,
  Bell,
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
  last_reminder_at: string | null
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

interface PatientSharedStory {
  id: string // story_share id
  story_id: string
  shared_at: string
  story: {
    id: string
    title: string
    content: any[]
    media_urls: any[]
    unique_slug: string
    updated_at: string
  }
}

interface StoryShareComment {
  id: string
  share_id: string
  author_id: string
  author_type: 'practitioner' | 'member'
  content: string
  created_at: string
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
  const searchParams = useSearchParams()
  const openShareIdFromUrl = searchParams.get('openShareId')


  // Shared resources state
  const [sharedResources, setSharedResources] = useState<SharedResourceWithStory[]>([])
  const [sharedLibraryResources, setSharedLibraryResources] = useState<SharedLibraryResource[]>([])
  const [patientStories, setPatientStories] = useState<PatientSharedStory[]>([])
  const [viewingPatientStory, setViewingPatientStory] = useState<PatientSharedStory | null>(null)
  const [storyComments, setStoryComments] = useState<StoryShareComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [availableStories, setAvailableStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedStory, setSelectedStory] = useState<string>('')
  const [shareMessage, setShareMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Quick share modal
  const [showQuickShare, setShowQuickShare] = useState(false)
  const [practResources, setPractResources] = useState<Array<{ id: string; title: string; type: string; blocks: any[] }>>([])
  const [quickShareSearch, setQuickShareSearch] = useState('')
  const [quickShareSelected, setQuickShareSelected] = useState<Set<string>>(new Set())
  const [quickSharing, setQuickSharing] = useState(false)

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionWithResource[]>([])
  const [remindResource, setRemindResource] = useState<{ id: string; title: string } | null>(null)

  // Expanded response viewer
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null)

  // Resource completion filter
  const [resourceFilter, setResourceFilter] = useState<'all' | 'completed' | 'not_completed'>('all')
  const [activeShareTab, setActiveShareTab] = useState<'resources' | 'stories'>('resources')

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

  // Auto-open patient story when navigated from notification
  useEffect(() => {
    if (!openShareIdFromUrl || patientStories.length === 0) return
    const share = patientStories.find(s => s.id === openShareIdFromUrl)
    if (share) {
      setActiveShareTab('stories')
      openPatientStory(share)
    }
  }, [openShareIdFromUrl, patientStories])

  const openQuickShare = async () => {
    setShowQuickShare(true)
    setQuickShareSelected(new Set())
    setQuickShareSearch('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('resources')
      .select('id, title, type, blocks')
      .eq('practitioner_id', user.id)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(20)
    setPractResources(data || [])
  }

  const handleQuickShare = async () => {
    if (quickShareSelected.size === 0) return
    setQuickSharing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let shared = 0
      for (const resourceId of quickShareSelected) {
        const { error } = await supabase
          .from('member_shared_resources')
          .insert({
            member_id: memberId,
            resource_id: resourceId,
            practitioner_id: user.id,
            shared_at: new Date().toISOString(),
          })
        if (!error) shared++
      }
      if (shared > 0) {
        toast.success(locale === 'fr' ? `${shared} ressource(s) partagée(s)` : `${shared} resource(s) shared`)
        fetchData()
      }
      setShowQuickShare(false)
    } catch {
      toast.error(locale === 'fr' ? 'Erreur lors du partage' : 'Failed to share')
    } finally {
      setQuickSharing(false)
    }
  }

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

      // Fetch stories that the patient shared with this practitioner
      const { data: patientShareData } = await supabase
        .from('story_shares')
        .select(`id, story_id, shared_at, story:stories!inner(id, title, content, media_urls, unique_slug, updated_at)`)
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('shared_at', { ascending: false })
      setPatientStories((patientShareData || []) as any)

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

  const openPatientStory = async (share: PatientSharedStory) => {
    setViewingPatientStory(share)
    setStoryComments([])
    setNewComment('')
    const { data } = await supabase
      .from('story_share_comments')
      .select('*')
      .eq('share_id', share.id)
      .order('created_at', { ascending: true })
    setStoryComments((data || []) as StoryShareComment[])
  }

  const postStoryComment = async () => {
    if (!viewingPatientStory || !newComment.trim()) return
    setPostingComment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('story_share_comments')
        .insert({
          share_id: viewingPatientStory.id,
          author_id: user.id,
          author_type: 'practitioner',
          content: newComment.trim(),
        })
        .select()
        .single()
      if (error) throw error
      setStoryComments(prev => [...prev, data as StoryShareComment])
      setNewComment('')

      // Notify member
      const { data: memberData } = await supabase
        .from('members')
        .select('user_id')
        .eq('id', memberId)
        .single()
      if (memberData?.user_id) {
        const session = (await supabase.auth.getSession()).data.session
        if (session) {
          fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
              userId: memberData.user_id,
              userType: 'member',
              type: 'story_comment',
              entityType: 'story_share',
              entityId: viewingPatientStory.id,
              metadata: {
                storyTitle: viewingPatientStory.story.title || 'Untitled',
                storyId: viewingPatientStory.story.id,
                shareId: viewingPatientStory.id,
              },
            }),
          }).catch(() => {})
        }
      }
    } catch (err) {
      toast.error(locale === 'fr' ? 'Erreur' : 'Failed to post comment')
    } finally {
      setPostingComment(false)
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
      toast.error(locale === 'fr' ? 'Veuillez sélectionner une histoire' : 'Please select a story')
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
      toast.error(locale === 'fr' ? 'Impossible de partager l\'histoire' : 'Failed to share story')
    } finally {
      setSaving(false)
    }
  }

  const handleUnshare = async (resourceId: string) => {
    if (!confirm(locale === 'fr' ? 'Êtes-vous sûr de vouloir retirer le partage de cette ressource ?' : 'Are you sure you want to unshare this resource?')) return

    try {
      const { error } = await supabase
        .from('shared_resources')
        .delete()
        .eq('id', resourceId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Partage retiré' : 'Resource unshared')
      fetchData()
    } catch (error) {
      console.error('Error unsharing resource:', error)
      toast.error(locale === 'fr' ? 'Impossible de retirer le partage' : 'Failed to unshare resource')
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

        <Button
          onClick={openQuickShare}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.members.shared.shareStory}
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveShareTab('resources')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
            activeShareTab === 'resources'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {locale === 'fr' ? 'Ressources' : 'Resources'}
          {sharedLibraryResources.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{sharedLibraryResources.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveShareTab('stories')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
            activeShareTab === 'stories'
              ? 'border-teal-500 text-teal-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {locale === 'fr' ? 'Histoires' : 'Stories'}
          {(patientStories.length + sharedResources.length) > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{patientStories.length + sharedResources.length}</span>
          )}
        </button>
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
          {activeShareTab === 'resources' && sharedLibraryResources.length > 0 && (
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
                                  // Draft = in progress
                                  if (submission.status === 'draft') {
                                    return (
                                      <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                        <Clock className="w-3 h-3" />
                                        {locale === 'fr' ? 'En cours' : 'In progress'}
                                      </span>
                                    )
                                  }
                                  // For psychoeducation, show "Read on" instead of "Submitted on"
                                  if (isPsychoeducation) {
                                    return (
                                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        <Eye className="w-3 h-3" />
                                        {locale === 'fr' ? 'Complété le' : 'Completed on'} {new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
                                      </span>
                                    )
                                  }
                                  return (
                                    <span className="flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                                      <CheckCircle className="w-3 h-3" />
                                      {locale === 'fr' ? 'Complété le' : 'Completed on'} {new Date(submission.submitted_at || submission.created_at).toLocaleDateString()}
                                    </span>
                                  )
                                }

                                // Then check viewed status
                                if (resource.viewed_at) {
                                  return (
                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                      <Eye className="w-3 h-3" />
                                      {isPsychoeducation
                                        ? (locale === 'fr' ? 'Complété le' : 'Completed on')
                                        : (locale === 'fr' ? 'Vu le' : 'Viewed on')
                                      } {new Date(resource.viewed_at).toLocaleDateString()}
                                    </span>
                                  )
                                }

                                // Not viewed/read — show days pending
                                const daysPending = Math.floor((Date.now() - new Date(resource.shared_at).getTime()) / (24 * 60 * 60 * 1000))
                                return (
                                  <>
                                    <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                      <EyeOff className="w-3 h-3" />
                                      {isPsychoeducation
                                        ? (locale === 'fr' ? 'Non lu' : 'Not read')
                                        : (locale === 'fr' ? 'Non vu' : 'Not viewed')
                                      }
                                    </span>
                                    {daysPending >= 2 && (
                                      <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                                        <Clock className="w-3 h-3" />
                                        {locale === 'fr' ? `${daysPending}j en attente` : `Pending ${daysPending}d`}
                                      </span>
                                    )}
                                    {resource.last_reminder_at && (
                                      <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                                        <Bell className="w-3 h-3" />
                                        {locale === 'fr' ? 'Rappel envoyé le' : 'Reminded'} {new Date(resource.last_reminder_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!resource.viewed_at && !submissions.find(s => s.resource_id === resource.resource_id) && Math.floor((Date.now() - new Date(resource.shared_at).getTime()) / (24 * 60 * 60 * 1000)) >= 2 && (() => {
                            const lastReminder = resource.last_reminder_at ? new Date(resource.last_reminder_at) : null
                            const hoursSinceReminder = lastReminder ? (Date.now() - lastReminder.getTime()) / (60 * 60 * 1000) : 999
                            const canRemind = hoursSinceReminder >= 24

                            return canRemind ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setRemindResource({ id: resource.id, title: resource.resource.title })
                                }}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors h-9 px-3 text-xs font-medium gap-1.5"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                {lastReminder
                                  ? (locale === 'fr' ? 'Re-rappeler' : 'Remind again')
                                  : (locale === 'fr' ? 'Rappeler' : 'Remind')}
                              </Button>
                            ) : null
                          })()}
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

          {/* Stories shared by patient */}
          {activeShareTab === 'stories' && patientStories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-violet-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100/50 flex items-center gap-2 bg-violet-50/30">
                <BookOpen className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-gray-900">
                  {locale === 'fr' ? 'Histoires envoyées par le patient' : 'Stories shared by patient'}
                </h3>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{patientStories.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {patientStories.map(share => (
                  <button
                    key={share.id}
                    onClick={() => openPatientStory(share)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{share.story.title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</p>
                      <p className="text-xs text-gray-400">
                        {locale === 'fr' ? 'Partagé le' : 'Shared'} {new Date(share.shared_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Resources tab empty state */}
          {activeShareTab === 'resources' && sharedLibraryResources.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {locale === 'fr' ? 'Aucune ressource partagée' : 'No resources shared yet'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {locale === 'fr' ? 'Partagez des ressources de votre bibliothèque avec ce patient.' : 'Share resources from your library with this patient.'}
                </p>
                <Button onClick={openQuickShare} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Partager une ressource' : 'Share a resource'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Shared Stories List (Stories tab only) */}
          {activeShareTab === 'stories' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
          >
            {sharedResources.length === 0 && patientStories.length === 0 ? (
              <div className="p-16 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
                  <div className="relative w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Book className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t.members.shared.noShared}</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">{t.members.shared.noSharedDescription}</p>
                <Button onClick={openQuickShare} className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-colors hover-lift">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.members.shared.shareStory}
                </Button>
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
          )}
        </>
      {/* Remind Confirmation Modal */}
      {remindResource && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setRemindResource(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              {locale === 'fr' ? 'Envoyer un rappel ?' : 'Send a reminder?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {locale === 'fr'
                ? `Un rappel sera envoyé pour "${remindResource.title}".`
                : `A reminder will be sent for "${remindResource.title}".`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setRemindResource(null)}
                className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { user: authUser } } = await supabase.auth.getUser()
                    if (!authUser) return

                    // Find the shared resource record to get resource_id
                    const sharedRecord = sharedLibraryResources.find(r => r.id === remindResource.id)
                    if (!sharedRecord) throw new Error('Record not found')

                    await supabase.functions.invoke('send-resource-shared-email', {
                      body: {
                        type: 'INSERT',
                        record: {
                          member_id: memberId,
                          resource_id: sharedRecord.resource_id,
                          practitioner_id: authUser.id,
                          isReminder: true,
                        },
                      },
                    })

                    // Save reminder timestamp
                    const now = new Date().toISOString()
                    await supabase
                      .from('member_shared_resources')
                      .update({ last_reminder_at: now })
                      .eq('id', remindResource.id)

                    // Update local state
                    setSharedLibraryResources(prev => prev.map(r =>
                      r.id === remindResource.id ? { ...r, last_reminder_at: now } : r
                    ))

                    toast.success(locale === 'fr' ? 'Rappel envoyé !' : 'Reminder sent!')
                  } catch {
                    toast.error(locale === 'fr' ? 'Échec de l\'envoi' : 'Failed to send')
                  }
                  setRemindResource(null)
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium"
              >
                {locale === 'fr' ? 'Envoyer' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Patient Story Viewer Modal */}
      {viewingPatientStory && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => setViewingPatientStory(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-violet-50/30">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{viewingPatientStory.story.title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</h3>
                <p className="text-xs text-gray-400">
                  {locale === 'fr' ? 'Mis à jour le' : 'Updated'} {new Date(viewingPatientStory.story.updated_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setViewingPatientStory(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(() => {
                const raw: any = viewingPatientStory.story.content
                let blocks: any[] = []
                if (Array.isArray(raw)) blocks = raw
                else if (typeof raw === 'string') {
                  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) blocks = parsed } catch {}
                  if (blocks.length === 0 && raw.trim()) blocks = [{ type: 'text', content: { text: raw } }]
                } else if (raw && typeof raw === 'object') {
                  if (Array.isArray(raw.blocks)) blocks = raw.blocks
                }
                return blocks
              })().map((block: any, i: number) => {
                if (block.type === 'heading') {
                  const Tag = `h${block.content?.level || 2}` as any
                  return <Tag key={i} className="font-bold text-gray-900">{block.content?.text}</Tag>
                }
                if (block.type === 'text') {
                  return <p key={i} className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{block.content?.text}</p>
                }
                if (block.type === 'list') {
                  const Tag = block.content?.ordered ? 'ol' : 'ul'
                  return (
                    <Tag key={i} className={`text-sm text-gray-800 ${block.content?.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1`}>
                      {(block.content?.items || []).map((it: string, j: number) => <li key={j}>{it}</li>)}
                    </Tag>
                  )
                }
                if (block.type === 'quote') {
                  return <blockquote key={i} className="border-l-4 border-violet-300 pl-4 italic text-gray-700">{block.content?.text}</blockquote>
                }
                if (block.type === 'media' || block.type === 'image') {
                  const items = block.content?.items || []
                  return (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      {items.map((m: any, j: number) => (
                        m.fileType === 'image' || m.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                          ? <img key={j} src={m.url} alt="" className="rounded-lg object-cover w-full" />
                          : <a key={j} href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">{m.fileName || m.url}</a>
                      ))}
                    </div>
                  )
                }
                return null
              })}

              {/* Comment thread */}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                  {locale === 'fr' ? 'Conversation' : 'Conversation'}
                </p>
                {storyComments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">{locale === 'fr' ? 'Aucun commentaire pour le moment' : 'No comments yet'}</p>
                ) : (
                  <div className="space-y-3">
                    {storyComments.map((c, i) => {
                      const isLast = i === storyComments.length - 1
                      const shouldHighlight = isLast && !!openShareIdFromUrl && c.author_type === 'member'
                      return (
                        <div
                          key={c.id}
                          ref={isLast ? (el) => { if (el && shouldHighlight) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } : undefined}
                          className={`flex ${c.author_type === 'practitioner' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 transition-all ${c.author_type === 'practitioner' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800'} ${shouldHighlight ? 'ring-2 ring-amber-400 ring-offset-2 animate-pulse' : ''}`}>
                            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                            <p className={`text-[10px] mt-1 ${c.author_type === 'practitioner' ? 'text-teal-100' : 'text-gray-400'}`}>
                              {new Date(c.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), postStoryComment())}
                placeholder={locale === 'fr' ? 'Écrire un commentaire...' : 'Write a comment...'}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={postingComment}
              />
              <Button onClick={postStoryComment} disabled={postingComment || !newComment.trim()} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4">
                {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'fr' ? 'Envoyer' : 'Send')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Share Modal */}
      <AnimatePresence>
        {showQuickShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuickShare(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr' ? 'Partager une ressource' : 'Share a resource'}
                </h3>
                <button onClick={() => setShowQuickShare(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-xl leading-none">&times;</span>
                </button>
              </div>

              <div className="p-4 border-b border-gray-100">
                <input
                  type="text"
                  value={quickShareSearch}
                  onChange={e => setQuickShareSearch(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher une ressource...' : 'Search resources...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                />
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {practResources
                  .filter(r => !quickShareSearch || r.title.toLowerCase().includes(quickShareSearch.toLowerCase()))
                  .map(resource => {
                    const isSelected = quickShareSelected.has(resource.id)
                    const TypeIcon = resourceTypeIcons[resource.type] || FileText
                    const alreadyShared = sharedLibraryResources.find(s => s.resource_id === resource.id)
                    return (
                      <div
                        key={resource.id}
                        onClick={() => {
                          if (alreadyShared) return
                          const next = new Set(quickShareSelected)
                          if (isSelected) next.delete(resource.id)
                          else next.add(resource.id)
                          setQuickShareSelected(next)
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                          alreadyShared ? 'bg-gray-50 cursor-default' :
                          isSelected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-teal-100' : 'bg-gray-100'}`}>
                          <TypeIcon className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                            {alreadyShared && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-100 text-teal-700">
                                {locale === 'fr' ? 'Partagé' : 'Shared'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{resource.type} · {resource.blocks?.length || 0} {locale === 'fr' ? 'blocs' : 'blocks'}</p>
                        </div>
                        {alreadyShared ? (() => {
                          const lastReminder = alreadyShared.last_reminder_at ? new Date(alreadyShared.last_reminder_at) : null
                          const canRemind = !lastReminder || (Date.now() - lastReminder.getTime()) / (60 * 60 * 1000) >= 24
                          return canRemind ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setRemindResource({ id: alreadyShared.id, title: resource.title }); }}
                              className="shrink-0 p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                              title={locale === 'fr' ? 'Rappeler' : 'Remind'}
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="shrink-0 text-[10px] text-gray-400">
                              {locale === 'fr' ? 'Rappelé' : 'Reminded'}
                            </span>
                          )
                        })() : isSelected ? (
                          <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                        ) : null}
                      </div>
                    )
                  })}
                {practResources.filter(r => !quickShareSearch || r.title.toLowerCase().includes(quickShareSearch.toLowerCase())).length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">
                    {locale === 'fr' ? 'Aucune ressource trouvée' : 'No resources found'}
                  </p>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {quickShareSelected.size > 0
                    ? (locale === 'fr' ? `${quickShareSelected.size} sélectionnée(s)` : `${quickShareSelected.size} selected`)
                    : (locale === 'fr' ? 'Sélectionnez des ressources' : 'Select resources')}
                </p>
                <Button
                  onClick={handleQuickShare}
                  disabled={quickSharing || quickShareSelected.size === 0}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {quickSharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {locale === 'fr' ? 'Partager' : 'Share'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
