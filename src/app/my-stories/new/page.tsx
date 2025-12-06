'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { generateSlug, type ContentBlock } from '@/types/story'
import { BlockEditor } from '@/components/story/block-editor'
import { PublishModal } from '@/components/story/publish-modal'

export default function NewStoryPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [showPublishModal, setShowPublishModal] = useState(false)

  const handleSave = async (publish: boolean, secretCode?: string) => {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Generate unique slug with user ID
      const slug = generateSlug(title.trim(), user.id)

      const { data, error} = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: blocks,
          media_urls: [], // No longer used, media is in blocks
          published: publish,
          unique_slug: slug,
          secret_code: secretCode || null
        })
        .select()
        .single()

      if (error) throw error

      setShowPublishModal(false)
      toast.success(publish ? 'Story published!' : 'Story saved as draft')
      router.push('/my-stories')
    } catch (error) {
      console.error('Error saving story:', error)
      toast.error('Failed to save story')
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-3xl font-bold text-foreground mb-8">Create New Story</h1>

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
                <Button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={() => setShowPublishModal(true)}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  Publish Story
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={(secretCode) => handleSave(true, secretCode)}
        saving={saving}
      />
    </div>
  )
}
