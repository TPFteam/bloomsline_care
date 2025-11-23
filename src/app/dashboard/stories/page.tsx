'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Share2 } from 'lucide-react'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.dashboard.backToDashboard}
            </Button>
          </Link>
          <Link href="/dashboard/stories/new">
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Button>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t.dashboard.sections.stories.title}
            </h1>
            <p className="text-lg text-gray-600">
              {t.dashboard.sections.stories.detail}
            </p>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-amber-200 shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-4xl">📝</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  No stories yet
                </h2>
                <p className="text-gray-600 mb-8">
                  Start sharing your thoughts and experiences with your mentor
                </p>
                <Link href="/dashboard/stories/new">
                  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Story
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-1 ml-2">
                        {story.published ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {story.content && story.content.length > 0 && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
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

                    {story.content && (() => {
                      const mediaCount = story.content.filter((block: any) =>
                        block.type === 'image' || block.type === 'video'
                      ).length
                      return mediaCount > 0 ? (
                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                          <span>📎 {mediaCount} media file{mediaCount > 1 ? 's' : ''}</span>
                        </div>
                      ) : null
                    })()}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/stories/${story.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0"
                            onClick={() => copyShareLink(story.unique_slug)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(story.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      Updated {new Date(story.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
