'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export function Testimonials() {
  const { t } = useLanguage()
  return (
    <section className="py-24 bg-gradient-to-b from-mint-50/30 via-lavender-50/20 to-peach-50/30 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-gradient-to-br from-lavender-200 to-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-gradient-to-br from-peach-200 to-coral-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground" suppressHydrationWarning>
            {t.testimonials.sectionTitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t.testimonials.sectionSubtitle}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.testimonials.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="p-8 rounded-3xl border border-white/60 bg-white/50 backdrop-blur-xl hover:bg-white/60 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                {/* Quote Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-100 to-mint-100 flex items-center justify-center mb-6 shadow-md">
                  <Quote className="w-6 h-6 text-lavender-600" />
                </div>

                {/* Quote */}
                <p className="text-gray-700 leading-relaxed mb-6 flex-grow text-base italic" suppressHydrationWarning>
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-foreground" suppressHydrationWarning>{testimonial.author}</p>
                  <p className="text-sm text-gray-600" suppressHydrationWarning>{testimonial.role}</p>
                  <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Community Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t.testimonials.communityNote}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
