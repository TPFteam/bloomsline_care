import type { Metadata } from 'next'
import { buildListMetadata, renderBlogList } from '../../blog/_shared/render'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return buildListMetadata('fr')
}

export default async function FrenchBlogList() {
  return renderBlogList({ locale: 'fr' })
}
