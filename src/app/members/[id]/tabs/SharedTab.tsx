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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { SharedResourceWithStory } from '@/types/member'

interface SharedTabProps {
  memberId: string
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

export default function SharedTab({ memberId }: SharedTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  const [sharedResources, setSharedResources] = useState<SharedResourceWithStory[]>([])
  const [sharedLibraryResources, setSharedLibraryResources] = useState<SharedLibraryResource[]>([])
  const [availableStories, setAvailableStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedStory, setSelectedStory] = useState<string>('')
  const [shareMessage, setShareMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [memberId])

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

      // Ignore table not found errors (table may not exist yet)
      if (libraryError && libraryError.code !== '42P01' && libraryError.code !== 'PGRST116') {
        // Only log non-table-not-found errors
        if (libraryError.message && !libraryError.message.includes('does not exist')) {
          console.error('Error fetching shared library resources:', libraryError)
        }
      }

      setSharedLibraryResources(libraryData || [])

      // Fetch available stories (not already shared with this member)
      const sharedStoryIds = (sharedData || []).map(s => s.story_id)

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, title, unique_slug, published')
        .eq('author_id', user.id)
        .eq('published', true)
        .order('created_at', { ascending: false })

      // Ignore table not found errors
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl  border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-pulse-glow"></div>
          <p className="text-gray-500 font-medium">Loading shared resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center ">
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>
          {t.members.shared.title}
        </h2>
        <Button
          onClick={() => setShowShareModal(true)}
          disabled={availableStories.length === 0}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.members.shared.shareStory}
        </Button>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl  border border-gray-200 p-6">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white "
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white "
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
          className="bg-white rounded-2xl  border border-gray-200 overflow-hidden"
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
                      <div className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0  group-hover:shadow-md group-hover:scale-105 transition-all`}>
                        <TypeIcon className={`w-7 h-7 ${config.text}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {resource.resource.title}
                        </h4>
                        {resource.resource.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {resource.resource.description}
                          </p>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-teal-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
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
        className="bg-white rounded-2xl  border border-gray-200 overflow-hidden"
      >
        {sharedResources.length === 0 && sharedLibraryResources.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
              <div className="relative w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Book className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t.members.shared.noShared}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {t.members.shared.noSharedDescription}
            </p>
            {availableStories.length > 0 && (
              <Button
                onClick={() => setShowShareModal(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-colors hover-lift"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.members.shared.shareStory}
              </Button>
            )}
          </div>
        ) : sharedResources.length > 0 ? (
          <>
            <div className="p-4 border-b border-gray-100/50 flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                {locale === 'fr' ? 'Histoires Partagées' : 'Shared Stories'}
              </h3>
              <span className="text-xs bg-lavender-100 text-lavender-700 px-2 py-0.5 rounded-full">
                {sharedResources.length}
              </span>
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
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0  group-hover:shadow-md group-hover:scale-105 transition-all">
                        <Book className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {resource.story.title}
                        </h4>
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
                      <a
                        href={`/stories/${resource.story.unique_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-gray-50 rounded-xl transition-colors"
                        >
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
    </div>
  )
}
