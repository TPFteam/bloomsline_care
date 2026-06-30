'use client'

import { BlogAppShell } from '@/components/blog/BlogAppShell'
import { BlogEditor } from '@/components/blog/BlogEditor'

export default function NewBlogPage() {
  return (
    <BlogAppShell>
      <BlogEditor initialPost={null} />
    </BlogAppShell>
  )
}
