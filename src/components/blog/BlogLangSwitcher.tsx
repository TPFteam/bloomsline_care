'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'

// On the SSR blog pages the URL is the source of truth for language, so the
// switcher is real navigation between the EN and FR URLs (crawlable links),
// not a client state toggle. It also nudges the client LanguageProvider to
// match the current URL so the rest of the site (navbar, footer) stays in the
// same language once the visitor navigates away.
export function BlogLangSwitcher({
  enHref,
  frHref,
  current,
}: {
  enHref: string | null
  frHref: string | null
  current: 'en' | 'fr'
}) {
  const { locale, setLocale } = useLanguage()

  useEffect(() => {
    if (locale !== current) setLocale(current, false)
  }, [current, locale, setLocale])

  const pill = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-teal-700 text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:border-teal-300'}`

  // Only one language present → nothing to switch to.
  if (!enHref || !frHref) return null

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <Link href={enHref} className={pill(current === 'en')} aria-current={current === 'en'}>EN</Link>
      <Link href={frHref} className={pill(current === 'fr')} aria-current={current === 'fr'}>FR</Link>
    </div>
  )
}
