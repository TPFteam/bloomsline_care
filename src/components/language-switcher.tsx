'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage, type Locale } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check, Settings } from 'lucide-react'

export function LanguageSwitcher() {
  const router = useRouter()
  const { locale, setLocale } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
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
            onClick={() => setLocale(lang.code as Locale)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
            {locale === lang.code && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/settings/member')}
          className="flex items-center gap-2 cursor-pointer text-gray-500"
        >
          <Settings className="w-4 h-4" />
          <span>{locale === 'fr' ? 'Ouvrir les paramètres' : locale === 'es' ? 'Abrir configuración' : 'Open in Settings'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
