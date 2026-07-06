'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage, type Locale } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'

// Routes that have dedicated /fr/* counterparts (locale-pinned, shareable URLs).
// For these, switching language must navigate between the URLs; every other
// page follows the client language context in place.
const LOCALE_PINNED = ['/our-practitioners', '/blog']
const isPinned = (p: string) => LOCALE_PINNED.some((b) => p === b || p.startsWith(`${b}/`))

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Switch the language and, on locale-pinned routes, move to the matching URL
  // (add /fr for French, strip it for English) so the URL and page stay in sync.
  const changeLanguage = (code: Locale) => {
    const path = pathname || '/'
    const onFr = path === '/fr' || path.startsWith('/fr/')
    if (code === 'fr' && !onFr && isPinned(path)) {
      router.push(`/fr${path}`)
    } else if (code !== 'fr' && onFr) {
      router.push(path.replace(/^\/fr/, '') || '/')
    }
    setLocale(code)
  }

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale)

  // Prevent hydration mismatch by showing consistent content until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-sm font-medium rounded-full"
      >
        <Globe className="w-4 h-4" />
        <span className="w-6">EN</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-sm font-medium rounded-full"
        >
          <Globe className="w-4 h-4" />
          {currentLanguage?.code.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code as Locale)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
            {locale === lang.code && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
