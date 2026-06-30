'use client'

import { renderMarkdown, composeMarkdown } from '@/lib/blog/markdown'
import type { BlogImage } from '@/types/blog'

// Renders sanitized markdown with calm, readable editorial styling. {{image}}
// placeholders are swapped for the real images before rendering.
// Shared by the editor preview, the admin review screen, and the public post.
export function BlogContent({ markdown, images, className = '' }: { markdown: string; images?: BlogImage[]; className?: string }) {
  return (
    <div
      className={`blog-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(composeMarkdown(markdown, images)) }}
    />
  )
}
