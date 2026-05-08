'use client'

import { useMemo, useState } from 'react'
import { Code2, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  slug: string
  locale: 'en' | 'fr' | 'es'
  /** Site origin used in the snippets — falls back to bloomsline.com when not provided. */
  origin?: string
}

type Mode = 'iframe' | 'script'

export function EmbedSnippetCard({ slug, locale, origin }: Props) {
  const [mode, setMode] = useState<Mode>('iframe')
  const [copied, setCopied] = useState(false)

  const t = (en: string, fr: string, es: string) => locale === 'fr' ? fr : locale === 'es' ? es : en

  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://bloomsline.com')

  const previewUrl = useMemo(
    () => `${baseOrigin}/practitioner/${encodeURIComponent(slug)}/book?embed=1`,
    [baseOrigin, slug],
  )

  const iframeSnippet = useMemo(
    () => `<iframe
  src="${baseOrigin}/practitioner/${slug}/book?embed=1"
  width="100%"
  height="780"
  frameborder="0"
  style="border: none; max-width: 720px; display: block; margin: 0 auto;"
  title="Book with ${slug}"
></iframe>`,
    [baseOrigin, slug],
  )

  const scriptSnippet = useMemo(
    () => `<div
  data-bloomsline-booking="${slug}"
  data-max-width="720"
></div>
<script src="${baseOrigin}/embed.js" async></script>`,
    [baseOrigin, slug],
  )

  const activeSnippet = mode === 'iframe' ? iframeSnippet : scriptSnippet

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="w-4 h-4 text-gray-600" />
          {t('Embed on your website', 'Intégrer sur votre site web', 'Insertar en tu sitio web')}
        </CardTitle>
        <CardDescription>
          {t(
            'Drop this snippet into your site and patients can book directly inside your page — no redirect.',
            "Collez ce code sur votre site et vos patients pourront réserver directement depuis votre page — sans redirection.",
            'Pega este código en tu sitio y los pacientes pueden reservar directamente desde tu página — sin redirección.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Mode tabs */}
        <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('iframe')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'iframe' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('Simple iframe', 'iFrame simple', 'iFrame simple')}
          </button>
          <button
            type="button"
            onClick={() => setMode('script')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'script' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('Auto-resize (script)', 'Auto-ajustement (script)', 'Auto-ajuste (script)')}
          </button>
        </div>

        <p className="text-xs text-gray-500 -mt-2">
          {mode === 'iframe'
            ? t(
                'Works on every platform. Fixed height — long forms may scroll inside the iframe.',
                'Fonctionne partout. Hauteur fixe — les formulaires longs peuvent défiler dans l\'iframe.',
                'Funciona en todas las plataformas. Altura fija — los formularios largos pueden desplazarse dentro del iframe.'
              )
            : t(
                'Iframe auto-resizes to the form height — no internal scrollbar. Requires the platform to allow <script> tags (Webflow, Squarespace, WordPress, etc.).',
                'L\'iframe s\'ajuste à la hauteur du formulaire — pas de défilement interne. Nécessite que la plateforme autorise les balises <script> (Webflow, Squarespace, WordPress, etc.).',
                'El iframe se ajusta a la altura del formulario — sin scroll interno. Requiere que la plataforma permita etiquetas <script>.'
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
            {copied
              ? <><Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />{t('Copied!', 'Copié !', 'Copiado!')}</>
              : <><Copy className="w-3.5 h-3.5 mr-1" />{t('Copy', 'Copier', 'Copiar')}</>}
          </Button>
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
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <iframe
              key={previewUrl}
              src={previewUrl}
              style={{ width: '100%', height: 540, border: 'none', display: 'block' }}
              title="Booking embed preview"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
