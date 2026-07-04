'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { BlogAppShell } from '@/components/blog/BlogAppShell'
import { VideoEditor } from '@/components/video/VideoEditor'
import { getMyVideo } from '@/lib/videos/queries'
import type { PractitionerVideo } from '@/types/video'

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [video, setVideo] = useState<PractitionerVideo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyVideo(id).then((v) => {
      if (!v) { router.push('/blogs?tab=videos'); return }
      setVideo(v)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <BlogAppShell>
      {loading || !video ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
      ) : (
        <VideoEditor initialVideo={video} />
      )}
    </BlogAppShell>
  )
}
