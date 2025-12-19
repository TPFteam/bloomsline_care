'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Edit, Trash2, Eye, EyeOff, Share2, Lock, KeyRound, X, Smartphone, Monitor, Tablet, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/browser-client'
import type { Story } from '@/types/story'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { BlockRenderer } from '@/components/story/block-renderer'
import type { StoryView } from '@/lib/analytics'

export default function StoryPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const storyId = params.id as string
  const supabase = createClient()

  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [newSecretCode, setNewSecretCode] = useState('')
  const [confirmSecretCode, setConfirmSecretCode] = useState('')
  const [savingCode, setSavingCode] = useState(false)
  const [views, setViews] = useState<StoryView[]>([])
  const [loadingViews, setLoadingViews] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    fetchStory()
    fetchViews()
  }, [storyId])

  const fetchViews = async () => {
    try {
      const { data, error } = await supabase
        .from('story_views')
        .select('*')
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setViews(data || [])
    } catch (error) {
      console.error('Error fetching views:', error)
    } finally {
      setLoadingViews(false)
    }
  }

  const fetchStory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        toast.error('Story not found')
        router.push('/my-stories')
        return
      }

      // Parse content safely
      let parsedContent: any[] = []
      if (data.content) {
        if (Array.isArray(data.content)) {
          parsedContent = data.content
        } else if (typeof data.content === 'string') {
          try {
            const parsed = JSON.parse(data.content)
            parsedContent = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            parsedContent = [{
              id: 'legacy',
              type: 'text',
              content: { text: data.content },
              order: 0
            }]
          }
        }
      }

      setStory({ ...data, content: parsedContent })
    } catch (error) {
      console.error('Error fetching story:', error)
      toast.error('Failed to load story')
      router.push('/my-stories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!story) return
    if (!confirm('Are you sure you want to delete this story?')) return

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id)

      if (error) throw error

      toast.success('Story deleted successfully')
      router.push('/my-stories')
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
    }
  }

  const togglePublish = async () => {
    if (!story) return

    try {
      const { error } = await supabase
        .from('stories')
        .update({ published: !story.published })
        .eq('id', story.id)

      if (error) throw error

      setStory({ ...story, published: !story.published })
      toast.success(story.published ? 'Story unpublished' : 'Story published')
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error('Failed to update story')
    }
  }

  const copyShareLink = () => {
    if (!story) return
    const url = `${window.location.origin}/stories/${story.unique_slug}`
    navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard!')
  }

  const openCodeModal = () => {
    if (!story) return
    setNewSecretCode(story.secret_code || '')
    setConfirmSecretCode(story.secret_code || '')
    setCodeModalOpen(true)
  }

  const closeCodeModal = () => {
    setCodeModalOpen(false)
    setNewSecretCode('')
    setConfirmSecretCode('')
  }

  const updateSecretCode = async () => {
    if (!story) return

    if (newSecretCode && newSecretCode !== confirmSecretCode) {
      toast.error('Codes do not match')
      return
    }

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
        .eq('id', story.id)

      if (error) throw error

      setStory({ ...story, secret_code: codeValue })
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
      {/* Top Bar - Mobile Responsive */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Two rows */}
          <div className="flex flex-col py-3 gap-3 lg:hidden">
            {/* Row 1: Back + Status badges */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="px-2" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <div className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Preview
                </div>
                {story.secret_code && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
                {story.published ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    <Eye className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    <EyeOff className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            {/* Row 2: Action buttons - scrollable */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              <Link href={`/my-stories/${story.id}/edit`}>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePublish}
                className="shrink-0"
              >
                {story.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              {story.published && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareLink}
                  className="shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
              {story.secret_code && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 shrink-0"
                  onClick={openCodeModal}
                >
                  <KeyRound className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50 shrink-0"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant={showAnalytics ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`shrink-0 ${showAnalytics ? "bg-blue-600 hover:bg-blue-700" : ""}`}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                {views.length}
              </Button>
            </div>
          </div>

          {/* Desktop: Single row */}
          <div className="hidden lg:flex items-center justify-between h-16">
            {/* Left side - Back button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Button>

            {/* Center - Status badges */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                Preview Mode
              </div>
              {story.secret_code && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  <Lock className="w-3 h-3" />
                  Password Protected
                </div>
              )}
              {story.published ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <Eye className="w-3 h-3" />
                  Published
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  <EyeOff className="w-3 h-3" />
                  Unpublished
                </div>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              <Link href={`/my-stories/${story.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePublish}
              >
                {story.published ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              {story.published && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareLink}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              {story.secret_code && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  onClick={openCodeModal}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Password
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                variant={showAnalytics ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={showAnalytics ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Views ({views.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">View Analytics</h3>
                <span className="text-sm text-gray-500">Last 100 views</span>
              </div>

              {loadingViews ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : views.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No views yet</p>
                  <p className="text-sm text-gray-400 mt-1">Views will appear here once someone visits your story</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Monitor className="w-4 h-4 text-blue-500" />
                        <span className="text-2xl font-bold text-gray-800">
                          {views.filter(v => v.device_type === 'desktop').length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Desktop</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Smartphone className="w-4 h-4 text-green-500" />
                        <span className="text-2xl font-bold text-gray-800">
                          {views.filter(v => v.device_type === 'mobile').length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Mobile</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Tablet className="w-4 h-4 text-purple-500" />
                        <span className="text-2xl font-bold text-gray-800">
                          {views.filter(v => v.device_type === 'tablet').length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Tablet</p>
                    </div>
                  </div>

                  {/* Recent Views List */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700">Recent Views</h4>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {views.slice(0, 20).map((view) => (
                        <div key={view.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {view.device_type === 'mobile' ? (
                              <Smartphone className="w-4 h-4 text-green-500" />
                            ) : view.device_type === 'tablet' ? (
                              <Tablet className="w-4 h-4 text-purple-500" />
                            ) : (
                              <Monitor className="w-4 h-4 text-blue-500" />
                            )}
                            <div>
                              <p className="text-sm text-gray-800">
                                {view.device_type?.charAt(0).toUpperCase()}{view.device_type?.slice(1)} • {view.browser}
                              </p>
                              {view.referrer && (
                                <p className="text-xs text-gray-400 truncate max-w-xs">
                                  from: {new URL(view.referrer).hostname}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(view.viewed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <article className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-gray-200 shadow-xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {story.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(story.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            {story.content && story.content.length > 0 && (
              <div className="mb-8">
                <BlockRenderer blocks={story.content} />
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Shared via <span className="font-semibold text-amber-600">Bloomsline Stories</span>
                </p>
                <Button
                  onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  size="sm"
                >
                  Visit Bloomsline
                </Button>
              </div>
            </div>
          </article>
        </motion.div>
      </div>

      {/* Secret Code Modal */}
      {codeModalOpen && (
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
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">Current secret code</p>
                    <p className="font-mono bg-white px-3 py-1.5 rounded-lg border border-purple-200 inline-block">
                      {story.secret_code}
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
