'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Share2, Lock, KeyRound, FileText, Image, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import type { Story } from '@/types/story'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function StoriesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [codeModalStory, setCodeModalStory] = useState<Story | null>(null)
  const [newSecretCode, setNewSecretCode] = useState('')
  const [confirmSecretCode, setConfirmSecretCode] = useState('')
  const [savingCode, setSavingCode] = useState(false)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Check if user is a member - redirect to mobile stories page
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (userProfile?.user_type === 'member') {
        router.replace('/stories')
        return
      }

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Parse content for each story safely - handle both old and new formats
      const parsedStories = (data || []).map(story => {
        let parsedContent = []

        if (Array.isArray(story.content)) {
          parsedContent = story.content
        } else if (typeof story.content === 'string') {
          try {
            const parsed = JSON.parse(story.content)
            parsedContent = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            // Old plain text format - convert to single text block
            parsedContent = [{
              id: 'legacy',
              type: 'text',
              content: { text: story.content },
              order: 0
            }]
          }
        }

        return {
          ...story,
          content: parsedContent
        }
      })

      setStories(parsedStories)
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to load stories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setStories(stories.filter(s => s.id !== id))
      toast.success('Story deleted successfully')
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
    }
  }

  const togglePublish = async (story: Story) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ published: !story.published })
        .eq('id', story.id)

      if (error) throw error

      setStories(stories.map(s =>
        s.id === story.id ? { ...s, published: !s.published } : s
      ))
      toast.success(story.published ? 'Story unpublished' : 'Story published')
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error('Failed to update story')
    }
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/stories/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard!')
  }

  const openCodeModal = (story: Story) => {
    setCodeModalStory(story)
    setNewSecretCode(story.secret_code || '')
    setConfirmSecretCode(story.secret_code || '')
  }

  const closeCodeModal = () => {
    setCodeModalStory(null)
    setNewSecretCode('')
    setConfirmSecretCode('')
  }

  const updateSecretCode = async () => {
    if (!codeModalStory) return

    // Validate codes match if setting a new code
    if (newSecretCode && newSecretCode !== confirmSecretCode) {
      toast.error('Codes do not match')
      return
    }

    // Validate minimum length if setting a code
    if (newSecretCode && newSecretCode.trim().length < 4) {
      toast.error('Code must be at least 4 characters')
      return
    }

    setSavingCode(true)
    try {
      const codeValue = newSecretCode.trim() || null
      const { error } = await supabase
        .from('stories')
        .update({ secret_code: codeValue })
        .eq('id', codeModalStory.id)

      if (error) throw error

      setStories(stories.map(s =>
        s.id === codeModalStory.id ? { ...s, secret_code: codeValue } : s
      ))
      toast.success(codeValue ? 'Secret code updated' : 'Secret code removed')
      closeCodeModal()
    } catch (error) {
      console.error('Error updating secret code:', error)
      toast.error('Failed to update secret code')
    } finally {
      setSavingCode(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.dashboard.backToDashboard}
            </Button>
          </Link>
        </div>

        {/* Title Section with Stats */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t.dashboard.sections.stories.title}
              </h1>
              <p className="text-gray-500">
                {t.dashboard.sections.stories.detail}
              </p>
            </div>
            <Link href="/my-stories/new">
              <Button className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-200/50 border-0">
                <Plus className="w-4 h-4 mr-2" />
                Create Story
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          {stories.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stories.length}</p>
                <p className="text-sm text-gray-500">Total Stories</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-3">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stories.filter(s => s.published).length}</p>
                <p className="text-sm text-gray-500">Published</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stories.filter(s => s.secret_code).length}</p>
                <p className="text-sm text-gray-500">Protected</p>
              </div>
            </div>
          )}
        </div>

        {/* Stories Grid */}
        <div className="max-w-6xl">
          {stories.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No stories yet
                </h2>
                <p className="text-gray-500 mb-6">
                  Start sharing your thoughts and experiences
                </p>
                <Link href="/my-stories/new">
                  <Button className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-200/50">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Story
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/my-stories/${story.id}/preview`)}
                  >
                    {/* Card Header with gradient accent */}
                    <div className={`h-1.5 ${story.published ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`} />

                    <div className="p-5">
                      {/* Status badges */}
                      <div className="flex items-center gap-2 mb-3">
                        {story.published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <Eye className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <EyeOff className="w-3 h-3" />
                            Draft
                          </span>
                        )}
                        {story.secret_code && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                            <Lock className="w-3 h-3" />
                            Protected
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {story.title}
                      </h3>

                      {/* Content preview */}
                      {story.content && story.content.length > 0 && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {story.content
                            .map((block: any) => {
                              if (block.type === 'text') return block.content.text
                              if (block.type === 'heading') return block.content.text
                              if (block.type === 'list') return block.content.items.join(', ')
                              return ''
                            })
                            .filter(Boolean)
                            .join(' ')
                          }
                        </p>
                      )}

                      {/* Media indicator */}
                      {story.content && (() => {
                        const mediaCount = story.content.filter((block: any) =>
                          block.type === 'image' || block.type === 'video'
                        ).length
                        return mediaCount > 0 ? (
                          <div className="flex items-center gap-1.5 mb-4">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                              <Image className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">{mediaCount} media</span>
                            </div>
                          </div>
                        ) : null
                      })()}

                      {/* Footer with date and actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(story.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>

                        <div className="flex items-center gap-1">
                          <Link href={`/my-stories/${story.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => togglePublish(story)}
                          >
                            {story.published ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          {story.published && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                              onClick={() => copyShareLink(story.unique_slug)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          )}
                          {story.secret_code && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-purple-400 hover:text-purple-600 hover:bg-purple-50"
                              onClick={() => openCodeModal(story)}
                              title="View/Edit secret code"
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(story.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Secret Code Modal */}
      {codeModalStory && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Secret Code</h2>
                <p className="text-sm text-gray-500 mt-1">View or update your story's secret code</p>
              </div>
              <button
                onClick={closeCodeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={savingCode}
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Current secret code</p>
                    <p className="font-mono bg-white px-3 py-1.5 rounded-lg border border-purple-200 inline-block">
                      {codeModalStory.secret_code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Change secret code</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">New Code (leave empty to remove)</label>
                    <input
                      type="text"
                      value={newSecretCode}
                      onChange={(e) => setNewSecretCode(e.target.value)}
                      placeholder="Enter new code (min. 4 characters)"
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Confirm Code</label>
                    <input
                      type="text"
                      value={confirmSecretCode}
                      onChange={(e) => setConfirmSecretCode(e.target.value)}
                      placeholder="Re-enter new code"
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none transition-colors text-sm"
                    />
                    {confirmSecretCode && newSecretCode !== confirmSecretCode && (
                      <p className="text-xs text-red-500 mt-1">Codes don't match</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={closeCodeModal}
                  variant="outline"
                  className="flex-1"
                  disabled={savingCode}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateSecretCode}
                  disabled={savingCode || (newSecretCode !== '' && (newSecretCode.length < 4 || newSecretCode !== confirmSecretCode))}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  {savingCode ? 'Saving...' : newSecretCode ? 'Update Code' : 'Remove Code'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}
