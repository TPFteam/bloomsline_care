'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

export function CommunityNote() {
  const { t } = useLanguage()
  return (
    <section className="py-24 bg-gradient-to-b from-mint-50/30 via-lavender-50/20 to-peach-50/30 relative overflow-hidden">
      <div className="absolute top-20 left-0 w-96 h-96 bg-gradient-to-br from-lavender-200 to-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-gradient-to-br from-peach-200 to-coral-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t.testimonials.communityNote}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
