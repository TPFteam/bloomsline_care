'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'

export function Hero() {
  const { t } = useLanguage()
  return (
    <section className="relative flex items-center justify-center overflow-hidden min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-teal-50/50">
      {/* Cinematic gradient background - More subtle */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender-100/30 via-teal-50/20 to-teal-100/30"></div>

      {/* Large organic blobs - Softer, more elegant */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-lavender-200/40 to-lavender-300/40 rounded-full mix-blend-multiply filter blur-[160px] animate-blob"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-teal-200/30 to-teal-300/30 rounded-full mix-blend-multiply filter blur-[140px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/3 w-[900px] h-[900px] bg-gradient-to-br from-teal-200/30 to-teal-300/30 rounded-full mix-blend-multiply filter blur-[180px] animate-blob animation-delay-4000"></div>

      {/* Abstract organic shapes - Multiple layers like Luma */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-[500px] sm:h-[500px]">
        {/* Main organic shape */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-full backdrop-blur-md"></div>
          <div className="absolute inset-12 bg-gradient-to-tl from-lavender-100/50 to-transparent rounded-full"></div>
          <div className="absolute inset-24 bg-gradient-to-br from-teal-100/40 to-transparent rounded-full"></div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main heading - Cinematic & Overlaid */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8 leading-tight"
            suppressHydrationWarning
          >
            <span className="block text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground/90 mb-2 tracking-tight" suppressHydrationWarning>
              {t.hero.yourCare} <span className="italic text-lavender-600">{t.hero.matters}</span>.
            </span>
            <span className="block text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground/90 tracking-tight" suppressHydrationWarning>
              {t.hero.weMakeIt} <span className="italic text-teal-600">{t.hero.easier}</span>.
            </span>
          </motion.h1>

          {/* Subtitle - Minimal & Poetic */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-base sm:text-lg text-foreground/60 mb-12 max-w-xl mx-auto font-light"
            suppressHydrationWarning
          >
            {t.hero.subtitle}
          </motion.p>


          {/* CTA Button - Single, prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex justify-center"
          >
            <Link href="/sign-up">
              <Button
                size="lg"
                className="group px-8 h-12 text-sm font-medium bg-white/80 text-foreground hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60 backdrop-blur-sm"
                suppressHydrationWarning
              >
                {t.buttons.tryNow}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Minimal social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 text-xs text-foreground/40 font-light tracking-wide"
            suppressHydrationWarning
          >
            {t.hero.trustedBy}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
