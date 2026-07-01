import type { Metadata } from 'next'
import { buildListMetadata, renderBlogList } from './_shared/render'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return buildListMetadata('en')
}

export default async function PublicBlogList() {
  return renderBlogList({ locale: 'en' })
}
