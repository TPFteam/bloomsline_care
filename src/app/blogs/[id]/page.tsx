'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { BlogAppShell } from '@/components/blog/BlogAppShell'
import { BlogEditor } from '@/components/blog/BlogEditor'
import { getMyPost } from '@/lib/blog/queries'
import type { BlogPost } from '@/types/blog'

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const p = await getMyPost(id)
      if (!p) { router.replace('/blogs'); return }
      setPost(p)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <BlogAppShell>
      {loading || !post
        ? <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
        : <BlogEditor initialPost={post} />}
    </BlogAppShell>
  )
}
