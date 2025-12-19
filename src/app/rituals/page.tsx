'use client'

import { motion } from 'framer-motion'
import { Circle, Sun, Moon, Coffee, Heart, Star } from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'

const ritualCategories = [
  {
    icon: Sun,
    titleEn: 'Morning',
    titleFr: 'Matin',
    descEn: 'Start your day mindfully',
    descFr: 'Commencez votre journée en pleine conscience',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Coffee,
    titleEn: 'Midday',
    titleFr: 'Midi',
    descEn: 'Reset and recharge',
    descFr: 'Rechargez vos batteries',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Moon,
    titleEn: 'Evening',
    titleFr: 'Soir',
    descEn: 'Wind down peacefully',
    descFr: 'Détendez-vous paisiblement',
    gradient: 'from-indigo-400 to-purple-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: Heart,
    titleEn: 'Self-Care',
    titleFr: 'Bien-être',
    descEn: 'Nurture yourself',
    descFr: 'Prenez soin de vous',
    gradient: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
  },
]

export default function RitualsPage() {
  const { locale } = useLanguage()

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <Circle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === 'fr' ? 'Rituels' : 'Rituals'}
            </h1>
          </div>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Créez des habitudes positives pour votre bien-être'
              : 'Build positive habits for your wellbeing'}
          </p>
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-5 mb-6 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">
                {locale === 'fr' ? 'Bientôt disponible' : 'Coming Soon'}
              </h3>
              <p className="text-amber-100 text-sm">
                {locale === 'fr'
                  ? 'Vos rituels personnalisés arrivent bientôt'
                  : 'Your personalized rituals are coming soon'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Ritual Categories Preview */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'Catégories' : 'Categories'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ritualCategories.map((category, idx) => {
              const Icon = category.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className={`${category.bg} rounded-2xl p-4 border border-gray-100`}
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${category.gradient} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {locale === 'fr' ? category.titleFr : category.titleEn}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {locale === 'fr' ? category.descFr : category.descEn}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
        >
          <p className="text-gray-600 text-sm text-center">
            {locale === 'fr'
              ? 'Votre mentor pourra bientôt vous assigner des rituels personnalisés pour soutenir votre parcours de bien-être.'
              : 'Your mentor will soon be able to assign personalized rituals to support your wellness journey.'}
          </p>
        </motion.div>
      </div>
    </MemberLayout>
  )
}
