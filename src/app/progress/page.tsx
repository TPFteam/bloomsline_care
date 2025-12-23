'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import MemberLayout from '@/components/member/MemberLayout'
import {
  DailyMotivation,
  WeeklyInsights,
  GentleCalendar,
  EnergyCheck,
  WeeklyProgressDots,
} from '@/components/member/ProgressDisplay'
import BloomChatInterface from '@/components/bloom/BloomChatInterface'

export default function ProgressPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const [showBloomChat, setShowBloomChat] = useState(false)

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {locale === 'fr' ? 'Votre Progrès' : 'Your Progress'}
            </h1>
            <p className="text-sm text-gray-500">
              {locale === 'fr'
                ? 'Suivez votre parcours de bien-être'
                : 'Track your wellness journey'}
            </p>
          </div>
        </motion.div>

        {/* Progress Components */}
        <div className="space-y-4">
          {/* Daily Motivation - Greeting + Narrative */}
          <DailyMotivation />

          {/* Weekly Progress - Combined Dots + Labels */}
          <WeeklyProgressDots />

          {/* Energy Check - Human Insight with Interaction */}
          <EnergyCheck onOpenChat={() => setShowBloomChat(true)} />

          {/* Weekly Insights */}
          <WeeklyInsights />

          {/* Monthly Calendar */}
          <GentleCalendar />
        </div>
      </div>

      {/* Bloom Chat */}
      <BloomChatInterface
        isOpen={showBloomChat}
        onClose={() => setShowBloomChat(false)}
        isDark={false}
      />
    </MemberLayout>
  )
}
