'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ArrowLeft, Check, Cloud, Loader2 } from 'lucide-react'
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
  const { t, locale } = useLanguage()
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

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

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
      isInitialLoadRef.current = false
    } catch (error) {
      console.error('Error fetching story:', error)
      toast.error('Failed to load story')
      router.push('/my-stories')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!title.trim() || blocks.length === 0) return

    setAutoSaveStatus('saving')
    try {
      const { error } = await supabase
        .from('stories')
        .update({
          title: title.trim(),
          content: blocks,
        })
        .eq('id', storyId)

      if (error) throw error

      setAutoSaveStatus('saved')
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)

      // Reset to idle after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setAutoSaveStatus('error')
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    }
  }, [title, blocks, storyId, supabase])

  // Track changes and trigger auto-save
  useEffect(() => {
    if (isInitialLoadRef.current || loading) return

    setHasUnsavedChanges(true)

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save (2 second delay)
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave()
    }, 2000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, blocks, loading, performAutoSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

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
      router.push('/my-stories')
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error('Failed to update story')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-100 via-white to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-white to-teal-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Stories
          </Button>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                {locale === 'fr' ? 'Modifier l\'histoire' : locale === 'es' ? 'Editar historia' : 'Edit Story'}
              </h1>
              <div className="flex items-center gap-4">
                {/* Auto-save status */}
                <div className="flex items-center gap-2 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span className="text-amber-600">{locale === 'fr' ? 'Enregistrement...' : locale === 'es' ? 'Guardando...' : 'Saving...'}</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600">{locale === 'fr' ? 'Enregistré' : locale === 'es' ? 'Guardado' : 'Saved'}</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <span className="text-red-500">{locale === 'fr' ? 'Erreur d\'enregistrement' : locale === 'es' ? 'Error al guardar' : 'Save error'}</span>
                  )}
                  {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                    <>
                      <Cloud className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">{locale === 'fr' ? 'Non enregistré' : locale === 'es' ? 'Sin guardar' : 'Unsaved'}</span>
                    </>
                  )}
                  {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSavedAt && (
                    <>
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <span className="text-gray-400">
                        {locale === 'fr' ? 'Enregistré à ' : locale === 'es' ? 'Guardado a las ' : 'Saved at '}
                        {lastSavedAt.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>

                {story && (
                  <div className={`text-sm px-3 py-1 rounded-full ${story.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {story.published ? (locale === 'fr' ? 'Publié' : locale === 'es' ? 'Publicado' : 'Published') : (locale === 'fr' ? 'Brouillon' : locale === 'es' ? 'Borrador' : 'Draft')}
                  </div>
                )}
              </div>
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
