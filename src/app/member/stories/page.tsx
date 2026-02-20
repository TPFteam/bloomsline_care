'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Calendar, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { MemberSidebar } from '@/components/layout/member-sidebar'

interface StoryCard {
  id: string
  title: string
  unique_slug: string
  created_at: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function MemberStoriesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [stories, setStories] = useState<StoryCard[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Fetch published stories
      const { data: published } = await supabase
        .from('stories')
        .select('id, title, unique_slug, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })

      // Fetch stories shared specifically with this member via shared_resources
      const { data: shared } = await supabase
        .from('shared_resources')
        .select('resource_id')
        .eq('member_user_id', user.id)
        .eq('resource_type', 'story')

      let sharedStories: StoryCard[] = []
      if (shared && shared.length > 0) {
        const ids = shared.map((s) => s.resource_id)
        const { data } = await supabase
          .from('stories')
          .select('id, title, unique_slug, created_at')
          .in('id', ids)
          .order('created_at', { ascending: false })
        sharedStories = data || []
      }

      // Merge and deduplicate
      const all = [...(published || []), ...sharedStories]
      const unique = Array.from(new Map(all.map((s) => [s.id, s])).values())
      unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setStories(unique)
      setLoading(false)
    }
    load()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MemberSidebar />
      <main className="flex-1 ml-[17.5rem] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Stories</h1>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : stories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-500">No stories available yet</p>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, i) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/stories/${story.unique_slug}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-teal-100 transition-all group cursor-pointer h-full">
                      <h3 className="font-medium text-gray-900 group-hover:text-teal-600 transition-colors mb-3 line-clamp-2">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(story.created_at)}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
