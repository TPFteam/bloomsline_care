'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Heart } from 'lucide-react'

export function CommunityNote() {
  const { t, locale } = useLanguage()
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
          <p className="text-xl sm:text-2xl font-light text-neutral-600 max-w-2xl mx-auto leading-relaxed inline-flex items-center justify-center flex-wrap gap-2 mb-8" suppressHydrationWarning>
            {t.testimonials.communityNote}
            <Heart className="w-5 h-5 text-[#4A9A86] fill-[#4A9A86] inline-block" />
          </p>

          {/* Early Access Form */}
          <form
            action="/early-access"
            method="GET"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
          >
            <input
              type="text"
              name="name"
              placeholder={locale === 'fr' ? 'Votre nom' : 'Your name'}
              className="w-full sm:w-auto px-4 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
              suppressHydrationWarning
            />
            <input
              type="email"
              name="email"
              placeholder={locale === 'fr' ? 'Votre email' : 'Your email'}
              className="w-full sm:w-auto px-4 py-3 rounded-full border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4856A]/30 focus:border-[#D4856A]"
              suppressHydrationWarning
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-full shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300 whitespace-nowrap"
              suppressHydrationWarning
            >
              {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
