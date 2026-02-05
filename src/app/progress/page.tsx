'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Info } from 'lucide-react'
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
import { FeatureGuide } from '@/components/feature-guide/FeatureGuide'
import { progressGuideSteps } from '@/components/feature-guide/guides/progress-guide'
import { useFeatureGuide } from '@/lib/hooks/useFeatureGuide'

export default function ProgressPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const [showBloomChat, setShowBloomChat] = useState(false)

  // Feature guide for Progress (auto-show on first visit)
  const { showGuide, completeGuide, skipGuide, setShowGuide } = useFeatureGuide('progress')

  return (
    <MemberLayout>
      {/* Feature Guide */}
      {showGuide && (
        <FeatureGuide
          featureName="progress"
          steps={progressGuideSteps}
          onComplete={completeGuide}
          onSkip={skipGuide}
        />
      )}

      <div className="px-5 pt-6 pb-8">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {locale === 'fr' ? 'Votre Progrès' : locale === 'es' ? 'Tu Progreso' : 'Your Progress'}
              </h1>
              <p className="text-sm text-gray-500">
                {locale === 'fr'
                  ? 'Comprendre votre parcours'
                  : locale === 'es' ? 'Comprende tu camino'
                  : 'Understand your journey'}
              </p>
            </div>
          </div>
          {/* Info button to show guide */}
          <button
            onClick={() => setShowGuide(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 hover:bg-gray-50 transition-colors"
            title={locale === 'fr' ? "Qu'est-ce que c'est?" : locale === 'es' ? "¿Qué es esto?" : "What's this?"}
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
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
        entryPoint="progress"
      />
    </MemberLayout>
  )
}
