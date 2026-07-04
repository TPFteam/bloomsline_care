'use client'

import { BlogAppShell } from '@/components/blog/BlogAppShell'
import { VideoEditor } from '@/components/video/VideoEditor'

export default function NewVideoPage() {
  return (
    <BlogAppShell>
      <VideoEditor initialVideo={null} />
    </BlogAppShell>
  )
}
