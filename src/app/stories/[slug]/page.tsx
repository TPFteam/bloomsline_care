'use client'

import { useState, useEffect, use } from 'react'
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser-client'
import { BlockRenderer } from '@/components/story/block-renderer'
import type { ContentBlock } from '@/types/story'

interface Story {
  id: string
  title: string
  content: ContentBlock[]
  published: boolean
  unique_slug: string
  secret_code: string | null
  created_at: string
}

function parseContent(raw: any): ContentBlock[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {}
  }
  return []
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const supabase = createClient()

  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [needsCode, setNeedsCode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    async function fetchStory() {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('unique_slug', slug)
          .eq('published', true)
          .single()

        if (error || !data) { setNotFound(true); return }

        const s: Story = { ...data, content: parseContent(data.content) }
        setStory(s)
        if (s.secret_code) setNeedsCode(true)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStory()
  }, [slug])

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!story) return
    if (codeInput.trim() === story.secret_code) {
      setUnlocked(true)
      setNeedsCode(false)
      setCodeError('')
    } else {
      setCodeError('Incorrect code. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-teal-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Story Not Found</h1>
          <p className="text-gray-500 mb-8">This story may have been removed or unpublished.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium">
            <ArrowLeft className="w-4 h-4" /> Go home
          </Link>
        </div>
      </div>
    )
  }

  if (needsCode && !unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-teal-50/30 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <Lock className="w-10 h-10 text-purple-700" />
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">This Story is Private</h2>
            <p className="text-gray-600">Enter the secret code to view this story.</p>
          </div>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="secret-code" className="block text-sm font-medium text-gray-700 mb-2">Secret Code</label>
              <input
                id="secret-code"
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeError('') }}
                placeholder="Enter the secret code"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none transition-colors"
                autoFocus
              />
              {codeError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!codeInput.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Unlock Story
            </button>
          </form>
          <p className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Don&apos;t have the code? <span className="text-purple-600 font-medium">Ask the author to share it with you</span>
          </p>
        </div>
      </div>
    )
  }

  const blocks = story.content.sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-teal-50/30">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          {story.secret_code && unlocked && (
            <span className="flex items-center gap-1 text-purple-500 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-medium">
              <Lock className="w-3 h-3" /> Private
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">{story.title}</h1>
          <p className="text-sm text-gray-400 mb-12">{formatDate(story.created_at)}</p>
          {blocks.length > 0 ? (
            <BlockRenderer blocks={blocks} />
          ) : (
            <p className="text-gray-400 italic">This story has no content yet.</p>
          )}
        </article>
      </main>

      <footer className="border-t border-gray-200/60 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-400">
            Shared via{' '}
            <a href="https://bloomsline.care" className="text-amber-600 hover:text-amber-700 font-medium">Bloomsline</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
