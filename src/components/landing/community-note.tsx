'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Heart } from 'lucide-react'

export function CommunityNote() {
  const { t } = useLanguage()
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-xl sm:text-2xl font-light text-neutral-600 max-w-2xl mx-auto leading-relaxed inline-flex items-center justify-center flex-wrap gap-2" suppressHydrationWarning>
            {t.testimonials.communityNote}
            <Heart className="w-5 h-5 text-[#4A9A86] fill-[#4A9A86] inline-block" />
          </p>
        </motion.div>
      </div>
    </section>
  )
}
