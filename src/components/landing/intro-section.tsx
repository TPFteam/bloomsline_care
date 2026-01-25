'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

// Highlighted text segment component
function HighlightedSegment({
  children,
  scrollYProgress,
  start,
  end,
  highlightColor = '#0d9488',
}: {
  children: React.ReactNode
  scrollYProgress: any
  start: number
  end: number
  highlightColor?: string
}) {
  const color = useTransform(
    scrollYProgress,
    [start, end],
    ['#d1d5db', highlightColor]
  )

  return (
    <motion.span style={{ color }}>
      {children}
    </motion.span>
  )
}

export function IntroSection() {
  const { locale } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  })

  const content = {
    en: {
      segments: [
        { text: "You know how life moves fast", highlight: '#6b7280' },
        { text: " and we forget the small moments?", highlight: '#6b7280' },
        { text: "\n\nWe help you capture those", highlight: '#0d9488' },
        { text: " — a photo, a voice note, or just how you're feeling.", highlight: '#6b7280' },
        { text: "\n\nOver time, you see your patterns,", highlight: '#6b7280' },
        { text: " understand yourself better,", highlight: '#0d9488' },
        { text: " and take gentler steps forward.", highlight: '#6b7280' },
        { text: "\n\nWhen you need a gentle nudge,", highlight: '#6b7280' },
        { text: " Bloom is there.", highlight: '#0d9488' },
      ]
    },
    fr: {
      segments: [
        { text: "Vous savez comment la vie va vite", highlight: '#6b7280' },
        { text: " et on oublie les petits moments ?", highlight: '#6b7280' },
        { text: "\n\nOn vous aide à les capturer", highlight: '#0d9488' },
        { text: " — une photo, une note vocale, ou juste ce que vous ressentez.", highlight: '#6b7280' },
        { text: "\n\nAu fil du temps, vous voyez vos patterns,", highlight: '#6b7280' },
        { text: " vous comprenez mieux,", highlight: '#0d9488' },
        { text: " et vous avancez plus doucement.", highlight: '#6b7280' },
        { text: "\n\nQuand vous avez besoin d'un petit coup de pouce,", highlight: '#6b7280' },
        { text: " Bloom est là.", highlight: '#0d9488' },
      ]
    },
  }

  const t = locale === 'fr' ? content.fr : content.en
  const segmentCount = t.segments.length
  const segmentDuration = 1 / segmentCount

  return (
    <section
      ref={containerRef}
      className="min-h-[120vh] py-32 md:py-40 bg-gradient-to-b from-white via-gray-50/20 to-white"
    >
      <div className="sticky top-1/2 -translate-y-1/2">
        <div className="container mx-auto px-6 max-w-3xl">
          <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-center whitespace-pre-line">
            {t.segments.map((segment, index) => (
              <HighlightedSegment
                key={index}
                scrollYProgress={scrollYProgress}
                start={index * segmentDuration}
                end={(index + 0.5) * segmentDuration}
                highlightColor={segment.highlight}
              >
                {segment.text}
              </HighlightedSegment>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
