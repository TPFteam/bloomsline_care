'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  Heart,
  Users,
  ArrowRight,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

const stakeholderIcons = [Heart, Brain, Users]

export function Stakeholders() {
  const { t } = useLanguage()
  return (
    <section id="solutions" className="py-24 bg-gradient-to-b from-lavender-50/30 via-white to-mint-50/30 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-peach-200 to-coral-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-mint-200 to-mint-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground" suppressHydrationWarning>
            {t.stakeholders.sectionTitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t.stakeholders.sectionSubtitle}
          </p>
        </motion.div>

        {/* Stakeholder Cards - Simple Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.stakeholders.stakeholders.map((stakeholder, index) => {
            const Icon = stakeholderIcons[index]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="p-8 rounded-3xl border border-white/60 transition-all duration-500 hover:shadow-2xl bg-white/50 backdrop-blur-xl hover:bg-white/60 h-full flex flex-col hover:-translate-y-2">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mint-100 to-mint-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Icon className="w-7 h-7 text-mint-600" />
                  </div>

                  {/* Type */}
                  <div className="text-sm font-medium text-mint-600 mb-3" suppressHydrationWarning>
                    {stakeholder.type}
                  </div>

                  {/* Tagline */}
                  <h3 className="text-xl font-bold mb-3 text-foreground" suppressHydrationWarning>
                    {stakeholder.tagline}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-6 flex-grow" suppressHydrationWarning>
                    {stakeholder.description}
                  </p>

                  {/* Learn More Link */}
                  <a
                    href="#"
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-mint-600 hover:text-white bg-mint-50 hover:bg-gradient-to-r hover:from-mint-500 hover:to-mint-600 rounded-full transition-all duration-300 group shadow-md hover:shadow-lg"
                  >
                    <span suppressHydrationWarning>{t.stakeholders.learnMore}</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
