'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Sparkles,
  FolderTree,
  Share2,
  TrendingUp,
  Search,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'

const featureIcons = [
  BookOpen,
  Sparkles,
  Search,
  FolderTree,
  Share2,
  TrendingUp,
]

const featureColors = [
  'teal',
  'lavender',
  'teal',
  'lavender',
  'teal',
  'lavender',
] as const

const colorClasses = {
  teal: {
    bg: 'bg-teal-100',
    icon: 'text-teal-600',
    border: 'border-teal-200',
    shadow: 'shadow-teal-500/10',
  },
  lavender: {
    bg: 'bg-lavender-100',
    icon: 'text-lavender-600',
    border: 'border-lavender-200',
    shadow: 'shadow-lavender-500/10',
  },
}

export function Features() {
  const { t } = useLanguage()

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-teal-50/30 via-white to-lavender-50/30 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-gradient-to-br from-teal-200 to-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-br from-lavender-200 to-lavender-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4" suppressHydrationWarning>
            {t.features.sectionTitle}
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t.features.sectionSubtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.features.map((feature, index) => {
            const Icon = featureIcons[index]
            const colorKey = featureColors[index]
            const colors = colorClasses[colorKey]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`p-8 h-full bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl hover:shadow-2xl hover:bg-white/60 transition-all duration-500 group cursor-pointer rounded-3xl hover:-translate-y-2`}>
                  <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <Icon className={`w-7 h-7 ${colors.icon}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900" suppressHydrationWarning>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" suppressHydrationWarning>
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
