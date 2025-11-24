'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/browser-client'
import type { Story } from '@/types/story'
import { motion } from 'framer-motion'
import { BlockRenderer } from '@/components/story/block-renderer'
import { CodeEntryModal } from '@/components/story/code-entry-modal'

export default function PublicStoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [supabase] = useState(() => createClient())
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [needsCode, setNeedsCode] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    fetchStory()
  }, [slug])

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('unique_slug', slug)
        .eq('published', true)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Check if story has a secret code
      if (data.secret_code && !isUnlocked) {
        setNeedsCode(true)
        setStory(data) // Store story data but don't show content yet
        setLoading(false)
        return
      }

      // Parse content safely - handle both old text format and new block format
      let parsedContent = []
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

      const parsedStory = {
        ...data,
        content: parsedContent
      }

      setStory(parsedStory)
      setNeedsCode(false)
    } catch (error) {
      console.error('Error fetching story:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = (enteredCode: string) => {
    if (story && story.secret_code === enteredCode) {
      setIsUnlocked(true)
      setNeedsCode(false)
      setCodeError('')
      // Don't re-fetch - just unlock and show the existing story
    } else {
      setCodeError('Incorrect code. Please try again.')
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

  if (notFound || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-gray-200 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">🔍</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Story Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              This story doesn't exist or hasn't been published yet.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (needsCode) {
    return <CodeEntryModal onSubmit={handleCodeSubmit} error={codeError} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

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
    </div>
  )
}
