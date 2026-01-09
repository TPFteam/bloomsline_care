'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'

export function Hero() {
  const { t, locale } = useLanguage()
  return (
    <section className="relative flex items-center justify-center overflow-hidden min-h-screen" style={{ background: 'linear-gradient(to bottom right, rgba(255, 181, 167, 0.25), white, rgba(131, 197, 190, 0.15))' }}>
      {/* Cinematic gradient background - More subtle */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(255, 181, 167, 0.15), rgba(131, 197, 190, 0.08), rgba(131, 197, 190, 0.15))' }}></div>

      {/* Large organic blobs - Softer, more elegant */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full mix-blend-multiply filter blur-[160px] animate-blob" style={{ background: 'linear-gradient(to bottom right, rgba(255, 181, 167, 0.4), rgba(255, 181, 167, 0.5))' }}></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[140px] animate-blob animation-delay-2000" style={{ background: 'linear-gradient(to bottom right, rgba(131, 197, 190, 0.35), rgba(131, 197, 190, 0.4))' }}></div>
      <div className="absolute bottom-0 left-1/3 w-[900px] h-[900px] rounded-full mix-blend-multiply filter blur-[180px] animate-blob animation-delay-4000" style={{ background: 'linear-gradient(to bottom right, rgba(131, 197, 190, 0.35), rgba(131, 197, 190, 0.4))' }}></div>

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
          <div className="absolute inset-12 rounded-full" style={{ background: 'linear-gradient(to top left, rgba(255, 181, 167, 0.3), transparent)' }}></div>
          <div className="absolute inset-24 rounded-full" style={{ background: 'linear-gradient(to bottom right, rgba(131, 197, 190, 0.25), transparent)' }}></div>
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
            <span className="block text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-2 tracking-tight" suppressHydrationWarning>
              {t.hero.yourCare} <span className="italic" style={{ color: '#ffb5a7' }}>{t.hero.matters}</span>
            </span>
            <span className="block text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 tracking-tight" suppressHydrationWarning>
              {t.hero.weMakeIt} <span className="italic" style={{ color: '#83c5be' }}>{t.hero.easier}</span>
            </span>
          </motion.h1>

          {/* Subtitle - Minimal & Poetic */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-base sm:text-lg text-gray-600 mb-12 max-w-xl mx-auto font-light"
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
                className="group px-8 h-12 text-sm font-medium text-white hover:opacity-90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{ backgroundColor: '#ffb5a7' }}
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
            className="mt-12 text-xs text-gray-500 font-light tracking-wide"
            suppressHydrationWarning
          >
            {t.hero.trustedBy}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
