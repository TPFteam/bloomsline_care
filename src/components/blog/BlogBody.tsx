'use client'

import { useEffect, useState } from 'react'
import type { BlogImage } from '@/types/blog'

// Renders the post body (markdown → sanitized HTML) on the CLIENT only.
// The markdown lib pulls in isomorphic-dompurify → jsdom, which breaks Vercel's
// serverless bundle when imported into a server component. Dynamically
// importing it inside useEffect keeps it out of the server graph entirely, so
// the server-rendered page (title, metadata, hreflang, JSON-LD) stays intact.
export function BlogBody({ markdown, images }: { markdown: string; images?: BlogImage[] }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    let active = true
    import('@/lib/blog/markdown').then(({ renderMarkdown, composeMarkdown }) => {
      if (active) setHtml(renderMarkdown(composeMarkdown(markdown, images)))
    })
    return () => { active = false }
  }, [markdown, images])

  return <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />
}
