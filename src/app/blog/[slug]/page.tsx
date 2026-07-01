import type { Metadata } from 'next'
import { buildPostMetadata, renderBlogPost } from '../_shared/render'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return buildPostMetadata({ slug, locale: 'en' })
}

export default async function PublicBlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return renderBlogPost({ slug, locale: 'en' })
}
