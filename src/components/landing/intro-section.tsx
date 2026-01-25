'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Sun } from 'lucide-react'

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

// Badge component for "moment"
function MomentBadge({
  scrollYProgress,
  start,
  end,
  text,
}: {
  scrollYProgress: any
  start: number
  end: number
  text: string
}) {
  const bgOpacity = useTransform(scrollYProgress, [start, end], [0.3, 1])
  const textColor = useTransform(scrollYProgress, [start, end], ['#9ca3af', '#0d9488'])

  return (
    <motion.span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.85em] font-medium mx-1"
      style={{
        backgroundColor: useTransform(bgOpacity, (v) => `rgba(204, 251, 241, ${v})`),
        color: textColor,
      }}
    >
      <Sun className="w-4 h-4" />
      {text}
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

  const segmentCount = 10
  const segmentDuration = 1 / segmentCount

  return (
    <section
      ref={containerRef}
      className="min-h-[100vh] mt-20 py-20 bg-gradient-to-b from-white via-gray-50/20 to-white"
    >
      <div className="sticky top-1/3">
        <div className="container mx-auto px-6 max-w-3xl">
          <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-[1.8] text-center">
            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={0}
              end={0.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              {locale === 'fr' ? 'Vous savez comment la vie va vite et on oublie les petits' : 'You know how life moves fast and we forget the small'}
            </HighlightedSegment>
            {' '}
            <MomentBadge
              scrollYProgress={scrollYProgress}
              start={1 * segmentDuration}
              end={1.5 * segmentDuration}
              text={locale === 'fr' ? 'moments' : 'moments'}
            />
            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={1 * segmentDuration}
              end={1.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              ?
            </HighlightedSegment>

            <br /><br />

            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={2 * segmentDuration}
              end={2.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              {locale === 'fr' ? 'Ouais.' : 'Yeah.'}
            </HighlightedSegment>

            <br /><br />

            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={3 * segmentDuration}
              end={3.5 * segmentDuration}
              highlightColor="#0d9488"
            >
              {locale === 'fr' ? 'On vous aide à les capturer' : 'We help you capture those'}
            </HighlightedSegment>
            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={4 * segmentDuration}
              end={4.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              {locale === 'fr'
                ? " — une photo, une note vocale, ou juste ce que vous ressentez."
                : " — a photo, a voice note, or just how you're feeling."}
            </HighlightedSegment>

            <br /><br />

            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={5 * segmentDuration}
              end={5.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              {locale === 'fr' ? 'Au fil du temps, vous voyez vos patterns,' : 'Over time, you see your patterns,'}
            </HighlightedSegment>
            {' '}
            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={6 * segmentDuration}
              end={6.5 * segmentDuration}
              highlightColor="#0d9488"
            >
              {locale === 'fr' ? 'vous comprenez mieux,' : 'understand yourself better,'}
            </HighlightedSegment>
            {' '}
            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={7 * segmentDuration}
              end={7.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              {locale === 'fr' ? 'et vous avancez plus doucement.' : 'and take gentler steps forward.'}
            </HighlightedSegment>

            <br /><br />

            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={8 * segmentDuration}
              end={8.5 * segmentDuration}
              highlightColor="#6b7280"
            >
              {locale === 'fr' ? "Quand vous avez besoin d'un petit coup de pouce," : 'When you need a gentle nudge,'}
            </HighlightedSegment>
            {' '}
            <HighlightedSegment
              scrollYProgress={scrollYProgress}
              start={9 * segmentDuration}
              end={9.5 * segmentDuration}
              highlightColor="#0d9488"
            >
              {locale === 'fr' ? 'Bloom est là.' : 'Bloom is there.'}
            </HighlightedSegment>
          </p>
        </div>
      </div>
    </section>
  )
}
