'use client'

import { useMemo, useState } from 'react'
import { Sparkles, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  slug: string
  locale: 'en' | 'fr' | 'es'
  /** Site origin used in the snippets — falls back to bloomsline.com when not provided. */
  origin?: string
}

type Mode = 'iframe' | 'script'
type BadgeLang = 'en' | 'fr' | 'es'

export function BrandBadgeCard({ slug, locale, origin }: Props) {
  const [mode, setMode] = useState<Mode>('script')
  const [badgeLang, setBadgeLang] = useState<BadgeLang>(locale)
  const [copied, setCopied] = useState(false)

  const t = (en: string, fr: string, es: string) => (locale === 'fr' ? fr : locale === 'es' ? es : en)

  const baseOrigin =
    origin || (typeof window !== 'undefined' ? window.location.origin : 'https://bloomsline.com')

  const previewUrl = useMemo(
    () => `${baseOrigin}/embed/badge/${encodeURIComponent(slug)}?lang=${badgeLang}`,
    [baseOrigin, slug, badgeLang],
  )

  const iframeSnippet = useMemo(
    () => `<iframe
  src="${baseOrigin}/embed/badge/${slug}?lang=${badgeLang}"
  width="100%"
  height="240"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 340px; display: block;"
  title="Bloomsline"
></iframe>`,
    [baseOrigin, slug, badgeLang],
  )

  const scriptSnippet = useMemo(
    () => `<div
  data-bloomsline-badge="${slug}"
  data-lang="${badgeLang}"
  data-max-width="340"
></div>
<script src="${baseOrigin}/embed.js" async></script>`,
    [baseOrigin, slug, badgeLang],
  )

  const activeSnippet = mode === 'iframe' ? iframeSnippet : scriptSnippet

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const langs: { value: BadgeLang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
  ]

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-teal-600" />
          {t('Add a Bloomsline badge', 'Ajouter un badge Bloomsline', 'Añadir una insignia Bloomsline')}
        </CardTitle>
        <CardDescription>
          {t(
            'A small "I work with Bloomsline" card for your website. It shows patients you offer a calm space between sessions — and links them to learn more.',
            'Une petite carte « Je collabore avec Bloomsline » pour votre site. Elle montre à vos patients que vous offrez un espace apaisant entre les séances — et les invite à en savoir plus.',
            'Una pequeña tarjeta «Colaboro con Bloomsline» para tu sitio. Muestra a tus pacientes que ofreces un espacio entre sesiones — y los invita a saber más.',
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Language */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t('Badge language', 'Langue du badge', 'Idioma de la insignia')}
          </p>
          <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {langs.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setBadgeLang(l.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  badgeLang === l.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('Live preview', 'Aperçu', 'Vista previa')}
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              {t('Open in new tab', 'Ouvrir dans un onglet', 'Abrir en pestaña')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-5 flex justify-center">
            <iframe
              key={previewUrl}
              src={previewUrl}
              style={{ width: '100%', maxWidth: 340, height: 240, border: 'none', display: 'block' }}
              scrolling="no"
              title="Bloomsline badge preview"
            />
          </div>
        </div>

        {/* Mode tabs */}
        <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('script')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'script' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('Auto-resize (script)', 'Auto-ajustement (script)', 'Auto-ajuste (script)')}
          </button>
          <button
            type="button"
            onClick={() => setMode('iframe')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'iframe' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('Simple iframe', 'iFrame simple', 'iFrame simple')}
          </button>
        </div>

        <p className="text-xs text-gray-500 -mt-2">
          {mode === 'script'
            ? t(
                'Recommended. The badge sizes itself to fit. Requires the platform to allow <script> tags (Webflow, Squarespace, WordPress, Wix embed, etc.).',
                "Recommandé. Le badge s'ajuste tout seul. Nécessite que la plateforme autorise les balises <script> (Webflow, Squarespace, WordPress, Wix, etc.).",
                'Recomendado. La insignia se ajusta sola. Requiere que la plataforma permita etiquetas <script>.',
              )
            : t(
                'Works on every platform. Fixed height — paste it anywhere that accepts an iframe.',
                'Fonctionne partout. Hauteur fixe — collez-le partout où un iframe est accepté.',
                'Funciona en todas las plataformas. Altura fija — pégalo donde se acepte un iframe.',
              )}
        </p>

        {/* Snippet block */}
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto font-mono leading-relaxed whitespace-pre">
{activeSnippet}
          </pre>
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-7 bg-gray-700 hover:bg-gray-600 text-white text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {t('Copied!', 'Copié !', 'Copiado!')}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                {t('Copy', 'Copier', 'Copiar')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
