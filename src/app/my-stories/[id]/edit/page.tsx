'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Story, ContentBlock } from '@/types/story'
import { BlockEditor } from '@/components/story/block-editor'
import { PublishModal } from '@/components/story/publish-modal'

export default function EditStoryPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [story, setStory] = useState<Story | null>(null)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [showPublishModal, setShowPublishModal] = useState(false)

  useEffect(() => {
    fetchStory()
  }, [storyId])

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

      if (error) throw error

      if (!data) {
        toast.error('Story not found')
        router.push('/my-stories')
        return
      }

      setStory(data)
      setTitle(data.title)

      // Parse content safely - handle both old text format and new block format
      let parsedContent: ContentBlock[] = []
      if (Array.isArray(data.content)) {
        // Already an array of blocks
        parsedContent = data.content
      } else if (typeof data.content === 'string') {
        try {
          // Try to parse as JSON (new format)
          const parsed = JSON.parse(data.content)
          parsedContent = Array.isArray(parsed) ? parsed : []
        } catch (e) {
          // Old plain text format - convert to a single text block
          parsedContent = [{
            id: 'legacy',
            type: 'text',
            content: { text: data.content },
            order: 0
          }]
        }
      }

      setBlocks(parsedContent)
    } catch (error) {
      console.error('Error fetching story:', error)
      toast.error('Failed to load story')
      router.push('/dashboard/stories')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (publish?: boolean, secretCode?: string) => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (blocks.length === 0) {
      toast.error('Please add at least one content block')
      return
    }

    setSaving(true)

    try {
      const updateData: any = {
        title: title.trim(),
        content: blocks,
        media_urls: [] // No longer used, media is in blocks
      }

      if (publish !== undefined) {
        updateData.published = publish
      }

      if (secretCode !== undefined) {
        updateData.secret_code = secretCode || null
      }

      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)

      if (error) throw error

      setShowPublishModal(false)
      toast.success(publish ? 'Story published!' : 'Story updated successfully')
      router.push('/dashboard/stories')
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error('Failed to update story')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/my-stories">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Button>
          </Link>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-foreground">Edit Story</h1>
              {story && (
                <div className="text-sm text-gray-500">
                  {story.published ? 'Published' : 'Draft'}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your story a title..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
              </div>

              {/* Block Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Story Content
                </label>
                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                {story && !story.published ? (
                  <>
                    <Button
                      onClick={() => handleUpdate()}
                      disabled={saving}
                      variant="outline"
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => setShowPublishModal(true)}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      Publish Story
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleUpdate()}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={(secretCode) => handleUpdate(true, secretCode)}
        saving={saving}
      />
    </div>
  )
}
