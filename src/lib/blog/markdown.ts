import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Render practitioner-authored markdown to safe HTML. Always sanitized — the
// content is user-generated and shown publicly on bloomsline.com.
// Images are stored out of the editable text (so the writer never sees raw
// URLs). The body holds tidy `{{token}}` placeholders; here we swap them for
// real markdown images right before rendering.
export function composeMarkdown(content: string, images?: { token: string; url: string }[]): string {
  let out = content || ''
  for (const img of images || []) {
    out = out.split(`{{${img.token}}}`).join(`\n\n![](${img.url})\n\n`)
  }
  return out
}

// Content is authored as markdown (with {{image}} placeholders). marked passes
// any HTML through; we then sanitize.
export function renderMarkdown(md: string): string {
  if (!md?.trim()) return ''
  const raw = marked.parse(md, { async: false, breaks: true, gfm: true }) as string
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 'del',
      'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'div', 'span',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
  })
}

// First ~160 chars of plain text, for an auto excerpt when none is given.
// Strips both HTML tags and markdown syntax.
export function autoExcerpt(src: string, max = 160): string {
  const text = (src || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_>`\-!\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

// URL-safe slug from a title.
export function slugify(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}
