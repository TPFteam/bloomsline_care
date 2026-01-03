'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Target,
  Activity,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Minus,
  Sparkles,
  BookOpen,
  Heart,
  Brain,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar, AppHeader } from '@/components/layout'

// Time period filter options
type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

// Sample analytics data
const overviewStats = {
  totalClients: { value: 24, change: 12, trend: 'up' as const },
  activeSessions: { value: 142, change: 8, trend: 'up' as const },
  avgSessionLength: { value: 52, change: -3, trend: 'down' as const },
  completionRate: { value: 87, change: 5, trend: 'up' as const },
}

const clientEngagement = {
  sessionsCompleted: 142,
  sessionsCancelled: 8,
  noShows: 4,
  reschedules: 12,
}

const resourceUsage = [
  { name: 'Anxiety Worksheets', count: 45, percentage: 28 },
  { name: 'Mindfulness Exercises', count: 38, percentage: 24 },
  { name: 'CBT Activities', count: 32, percentage: 20 },
  { name: 'Assessment Tools', count: 28, percentage: 17 },
  { name: 'Education', count: 18, percentage: 11 },
]

const weeklySessionData = [
  { day: 'Mon', sessions: 6, hours: 5.2 },
  { day: 'Tue', sessions: 8, hours: 7.1 },
  { day: 'Wed', sessions: 5, hours: 4.5 },
  { day: 'Thu', sessions: 9, hours: 8.0 },
  { day: 'Fri', sessions: 7, hours: 6.3 },
  { day: 'Sat', sessions: 2, hours: 1.8 },
  { day: 'Sun', sessions: 0, hours: 0 },
]

const clientProgress = [
  { name: 'Emma S.', progress: 85, trend: 'up', sessions: 12 },
  { name: 'James M.', progress: 72, trend: 'up', sessions: 8 },
  { name: 'Sarah L.', progress: 68, trend: 'stable', sessions: 15 },
  { name: 'Michael R.', progress: 45, trend: 'up', sessions: 5 },
  { name: 'Lisa K.', progress: 90, trend: 'up', sessions: 20 },
]

const topInsights = [
  {
    icon: TrendingUp,
    title: 'Session Completion Up',
    description: 'Your session completion rate increased by 5% this month',
    color: 'emerald',
  },
  {
    icon: Users,
    title: 'Growing Client Base',
    description: '3 new clients joined your practice this week',
    color: 'blue',
  },
  {
    icon: Heart,
    title: 'High Engagement',
    description: 'Anxiety worksheets are your most used resource',
    color: 'coral',
  },
  {
    icon: Award,
    title: 'Milestone Reached',
    description: '5 clients completed their treatment goals this month',
    color: 'amber',
  },
]

export default function AnalyticsPage() {
  const { t, locale } = useLanguage()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

  const timePeriodLabels: Record<TimePeriod, { en: string; fr: string }> = {
    week: { en: 'This Week', fr: 'Cette semaine' },
    month: { en: 'This Month', fr: 'Ce mois' },
    quarter: { en: 'This Quarter', fr: 'Ce trimestre' },
    year: { en: 'This Year', fr: 'Cette année' },
  }

  const maxSessions = Math.max(...weeklySessionData.map(d => d.sessions))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="analytics" />

      <main className="flex-1 ml-64">
        <AppHeader
          user={null}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <BarChart3 className="w-4 h-4" />
              <span>{t.dashboard.sections.analytics.title}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* Time Period Filter */}
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {(Object.keys(timePeriodLabels) as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timePeriod === period
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {timePeriodLabels[period][locale]}
                </button>
              ))}
            </div>
          </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label={locale === 'en' ? 'Total Clients' : 'Clients totaux'}
            value={overviewStats.totalClients.value}
            change={overviewStats.totalClients.change}
            trend={overviewStats.totalClients.trend}
            color="lavender"
            delay={0.1}
          />
          <StatCard
            icon={Calendar}
            label={locale === 'en' ? 'Sessions Completed' : 'Séances terminées'}
            value={overviewStats.activeSessions.value}
            change={overviewStats.activeSessions.change}
            trend={overviewStats.activeSessions.trend}
            color="emerald"
            delay={0.15}
          />
          <StatCard
            icon={Clock}
            label={locale === 'en' ? 'Avg. Session Length' : 'Durée moyenne'}
            value={`${overviewStats.avgSessionLength.value}m`}
            change={overviewStats.avgSessionLength.change}
            trend={overviewStats.avgSessionLength.trend}
            color="blue"
            delay={0.2}
          />
          <StatCard
            icon={Target}
            label={locale === 'en' ? 'Completion Rate' : 'Taux de complétion'}
            value={`${overviewStats.completionRate.value}%`}
            change={overviewStats.completionRate.change}
            trend={overviewStats.completionRate.trend}
            color="peach"
            delay={0.25}
          />
        </div>

        {/* Key Insights */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-900">
                {locale === 'en' ? 'Key Insights' : 'Aperçus clés'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topInsights.map((insight, index) => {
                const Icon = insight.icon
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">{insight.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Sessions Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <LineChart className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {locale === 'en' ? 'Weekly Sessions' : 'Séances hebdomadaires'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {locale === 'en' ? 'Sessions per day' : 'Séances par jour'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">37</p>
                <p className="text-sm text-gray-500">
                  {locale === 'en' ? 'total this week' : 'total cette semaine'}
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-3 h-48 px-2">
              {weeklySessionData.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.sessions / maxSessions) * 100}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    className="w-full bg-gray-900 rounded-t-lg min-h-[4px] relative group cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                      {day.sessions} {locale === 'en' ? 'sessions' : 'séances'}
                    </div>
                  </motion.div>
                  <span className="text-xs text-gray-500 font-medium">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {locale === 'en' ? 'Session Status' : 'Statut des séances'}
                </h3>
                <p className="text-sm text-gray-500">
                  {locale === 'en' ? 'Breakdown by outcome' : 'Répartition par résultat'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <StatusRow
                icon={CheckCircle2}
                label={locale === 'en' ? 'Completed' : 'Terminées'}
                value={clientEngagement.sessionsCompleted}
                total={166}
                color="emerald"
              />
              <StatusRow
                icon={XCircle}
                label={locale === 'en' ? 'Cancelled' : 'Annulées'}
                value={clientEngagement.sessionsCancelled}
                total={166}
                color="red"
              />
              <StatusRow
                icon={Minus}
                label={locale === 'en' ? 'No-shows' : 'Absences'}
                value={clientEngagement.noShows}
                total={166}
                color="amber"
              />
              <StatusRow
                icon={Activity}
                label={locale === 'en' ? 'Rescheduled' : 'Reprogrammées'}
                value={clientEngagement.reschedules}
                total={166}
                color="blue"
              />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Usage */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {locale === 'en' ? 'Top Resources Used' : 'Ressources les plus utilisées'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {locale === 'en' ? 'Most popular with clients' : 'Les plus populaires'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {resourceUsage.map((resource) => (
                  <div key={resource.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{resource.name}</span>
                      <span className="text-sm text-gray-500">{resource.count} {locale === 'en' ? 'uses' : 'utilisations'}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${resource.percentage}%` }}
                        className="h-full bg-gray-900 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Progress */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {locale === 'en' ? 'Client Progress' : 'Progrès des clients'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {locale === 'en' ? 'Treatment goal completion' : 'Progression des objectifs'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {clientProgress.map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white font-medium text-sm">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">{client.name}</span>
                        <div className="flex items-center gap-1">
                          {client.trend === 'up' ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          ) : client.trend === 'down' ? (
                            <ArrowDownRight className="w-3 h-3 text-red-500" />
                          ) : (
                            <Minus className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-sm font-semibold text-gray-900">{client.progress}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${client.progress}%` }}
                          className={`h-full rounded-full ${
                            client.progress >= 80 ? 'bg-emerald-500' :
                            client.progress >= 60 ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Quick Actions */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/members">
              <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
                <Users className="w-4 h-4 mr-2" />
                {locale === 'en' ? 'View All Clients' : 'Voir tous les clients'}
              </Button>
            </Link>
            <Link href="/resources">
              <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
                <BookOpen className="w-4 h-4 mr-2" />
                {locale === 'en' ? 'Browse Resources' : 'Parcourir les ressources'}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  color?: string
  delay?: number
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

// Status Row Component
function StatusRow({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  total: number
  color: 'emerald' | 'red' | 'amber' | 'blue'
}) {
  const percentage = Math.round((value / total) * 100)
  const colorClasses = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
  }[color]

  const iconColorClasses = {
    emerald: 'text-emerald-500',
    red: 'text-red-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
  }[color]

  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${iconColorClasses}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`h-full rounded-full ${colorClasses}`}
          />
        </div>
      </div>
    </div>
  )
}
