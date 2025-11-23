'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

export default function ResourcesPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50/50 via-white to-mint-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.dashboard.backToDashboard}
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-coral-200 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-coral-400 to-coral-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">💚</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t.dashboard.sections.resources.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t.dashboard.sections.resources.detail}
            </p>
            <div className="inline-block bg-coral-50 border border-coral-200 rounded-full px-6 py-3">
              <p className="text-coral-700 font-medium">{t.dashboard.comingSoon}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
