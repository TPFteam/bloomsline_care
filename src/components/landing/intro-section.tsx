'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Camera, Mic, Heart } from 'lucide-react'

// Floating bubble component
function FloatingBubble({
  size,
  initialX,
  initialY,
  color,
  grayToColor,
  delay = 0,
}: {
  size: number
  initialX: string
  initialY: string
  color: string
  grayToColor: any
  delay?: number
}) {
  const colorValue = useTransform(grayToColor, [0, 1], ['#e5e7eb', color])
  const opacity = useTransform(grayToColor, [0, 0.5, 1], [0.3, 0.5, 0.7])
  const scale = useTransform(grayToColor, [0, 1], [0.8, 1])

  return (
    <motion.div
      className="absolute rounded-full blur-xl pointer-events-none"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
        backgroundColor: colorValue,
        opacity,
        scale,
      }}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
      }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  )
}

export function IntroSection() {
  const { locale } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Transform scroll progress to color transition
  const grayToColor = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 0, 1])
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [0.4, 1])
  const iconOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1])
  const iconScale = useTransform(scrollYProgress, [0.2, 0.4], [0.5, 1])

  const content = {
    en: {
      thought: "You know how life moves fast and we forget the small moments?",
      answer: "We help you capture those",
      details: "a photo, a voice note, or just how you're feeling",
      pattern: "Over time, you see your patterns, understand yourself better, and take gentler steps forward.",
      bloom: "When you need a gentle nudge, Bloom is there.",
    },
    fr: {
      thought: "Vous savez comment la vie va vite et on oublie les petits moments ?",
      answer: "On vous aide à les capturer",
      details: "une photo, une note vocale, ou juste ce que vous ressentez",
      pattern: "Au fil du temps, vous voyez vos patterns, vous comprenez mieux, et vous avancez plus doucement.",
      bloom: "Quand vous avez besoin d'un petit coup de pouce, Bloom est là.",
    },
  }

  const t = locale === 'fr' ? content.fr : content.en

  // Capture type icons
  const captureIcons = [
    { Icon: Camera, color: '#14b8a6' },  // teal
    { Icon: Mic, color: '#f59e0b' },     // amber
    { Icon: Heart, color: '#ec4899' },   // pink
  ]

  return (
    <section
      ref={containerRef}
      className="py-24 md:py-36 bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden relative"
    >
      {/* Floating bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingBubble
          size={120}
          initialX="10%"
          initialY="20%"
          color="#99f6e4"
          grayToColor={grayToColor}
          delay={0}
        />
        <FloatingBubble
          size={80}
          initialX="85%"
          initialY="15%"
          color="#fde68a"
          grayToColor={grayToColor}
          delay={1}
        />
        <FloatingBubble
          size={100}
          initialX="75%"
          initialY="60%"
          color="#fbcfe8"
          grayToColor={grayToColor}
          delay={2}
        />
        <FloatingBubble
          size={60}
          initialX="5%"
          initialY="70%"
          color="#a5f3fc"
          grayToColor={grayToColor}
          delay={1.5}
        />
        <FloatingBubble
          size={90}
          initialX="50%"
          initialY="80%"
          color="#c4b5fd"
          grayToColor={grayToColor}
          delay={0.5}
        />
      </div>

      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        <motion.div
          className="text-center space-y-6"
          style={{ opacity: textOpacity }}
        >
          {/* The thought - starts gray */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#9ca3af', '#374151'])
            }}
          >
            {t.thought}
          </motion.p>

          {/* The answer - reveals in teal */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#9ca3af', '#0d9488'])
            }}
          >
            {t.answer}
          </motion.p>

          {/* Capture icons */}
          <motion.div
            className="flex justify-center gap-4 py-2"
            style={{ opacity: iconOpacity, scale: iconScale }}
          >
            {captureIcons.map(({ Icon, color }, index) => (
              <motion.div
                key={index}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: useTransform(grayToColor, [0, 1], ['#f3f4f6', `${color}20`]),
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{
                    color: useTransform(grayToColor, [0, 1], ['#9ca3af', color]) as any,
                  }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* The details - with em dashes */}
          <motion.p
            className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#d1d5db', '#6b7280'])
            }}
          >
            — {t.details} —
          </motion.p>

          {/* Spacer */}
          <div className="py-4" />

          {/* Pattern recognition */}
          <motion.p
            className="text-xl md:text-2xl font-light leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#d1d5db', '#6b7280'])
            }}
          >
            {t.pattern}
          </motion.p>

          {/* Bloom - the finale in teal */}
          <motion.p
            className="text-xl md:text-2xl font-medium leading-relaxed"
            style={{
              color: useTransform(grayToColor, [0, 1], ['#d1d5db', '#14b8a6'])
            }}
          >
            {t.bloom}
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
