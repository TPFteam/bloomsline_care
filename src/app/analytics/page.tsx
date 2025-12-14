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
import { AnimatedIcon } from '@/components/ui/animated-icons'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar } from '@/components/app-sidebar'

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
  { name: 'Psychoeducation', count: 18, percentage: 11 },
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
    <div className="min-h-screen gradient-mesh relative flex">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-peach-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-mint-200/20 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-80 p-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-peach-100/80 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-peach-400 to-peach-600 flex items-center justify-center shadow-lg shadow-peach-200/50">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.sections.analytics.title}</h1>
              <p className="text-gray-600">{t.dashboard.sections.analytics.detail}</p>
            </div>
          </div>

          {/* Time Period Filter */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-xl p-1.5 shadow-sm border border-white/60">
            {(Object.keys(timePeriodLabels) as TimePeriod[]).map((period) => (
              <motion.button
                key={period}
                onClick={() => setTimePeriod(period)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timePeriod === period
                    ? 'bg-gradient-to-r from-peach-500 to-peach-600 text-white shadow-md shadow-peach-200/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                {timePeriodLabels[period][locale]}
              </motion.button>
            ))}
          </div>
        </motion.div>

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {locale === 'en' ? 'Key Insights' : 'Aperçus clés'}
            </h2>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topInsights.map((insight, index) => {
              const Icon = insight.icon
              const colorClasses = {
                emerald: { bg: 'bg-emerald-100/80', iconBg: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200/50' },
                blue: { bg: 'bg-blue-100/80', iconBg: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-200/50' },
                coral: { bg: 'bg-coral-100/80', iconBg: 'from-coral-400 to-coral-600', shadow: 'shadow-coral-200/50' },
                amber: { bg: 'bg-amber-100/80', iconBg: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-200/50' },
              }[insight.color]

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 shadow-lg shadow-gray-200/40 border border-white/60 cursor-default group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colorClasses?.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorClasses?.iconBg} flex items-center justify-center shadow-md ${colorClasses?.shadow}`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{insight.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Sessions Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lavender-100/80 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-md">
                    <LineChart className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
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
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-lavender-500 to-lavender-400 rounded-t-lg min-h-[4px] relative group cursor-pointer"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                      {day.sessions} {locale === 'en' ? 'sessions' : 'séances'}
                    </div>
                  </motion.div>
                  <span className="text-xs text-gray-500 font-medium">{day.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Session Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                  <PieChart className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
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
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resource Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-coral-100/80 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center shadow-md">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {locale === 'en' ? 'Top Resources Used' : 'Ressources les plus utilisées'}
                </h3>
                <p className="text-sm text-gray-500">
                  {locale === 'en' ? 'Most popular with clients' : 'Les plus populaires'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {resourceUsage.map((resource, index) => (
                <motion.div
                  key={resource.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + index * 0.05 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{resource.name}</span>
                    <span className="text-sm text-gray-500">{resource.count} {locale === 'en' ? 'uses' : 'utilisations'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resource.percentage}%` }}
                      transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-coral-400 to-coral-500 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Client Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-mint-100/80 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center shadow-md">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {locale === 'en' ? 'Client Progress' : 'Progrès des clients'}
                </h3>
                <p className="text-sm text-gray-500">
                  {locale === 'en' ? 'Treatment goal completion' : 'Progression des objectifs'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {clientProgress.map((client, index) => (
                <motion.div
                  key={client.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50/80 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
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
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${client.progress}%` }}
                        transition={{ delay: 0.65 + index * 0.05, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          client.progress >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                          client.progress >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                          'bg-gradient-to-r from-amber-400 to-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <Link href="/members">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="rounded-xl border-2 border-lavender-200 hover:border-lavender-300 hover:bg-lavender-50">
                <Users className="w-4 h-4 mr-2 text-lavender-600" />
                <span className="text-lavender-700">
                  {locale === 'en' ? 'View All Clients' : 'Voir tous les clients'}
                </span>
              </Button>
            </motion.div>
          </Link>
          <Link href="/resources">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="rounded-xl border-2 border-coral-200 hover:border-coral-300 hover:bg-coral-50">
                <BookOpen className="w-4 h-4 mr-2 text-coral-600" />
                <span className="text-coral-700">
                  {locale === 'en' ? 'Browse Resources' : 'Parcourir les ressources'}
                </span>
              </Button>
            </motion.div>
          </Link>
        </motion.div>
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
  color,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  color: 'lavender' | 'emerald' | 'blue' | 'peach'
  delay: number
}) {
  const colorClasses = {
    lavender: {
      bg: 'bg-lavender-100/80',
      iconBg: 'from-lavender-400 to-lavender-600',
      shadow: 'shadow-lavender-200/50',
    },
    emerald: {
      bg: 'bg-emerald-100/80',
      iconBg: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-200/50',
    },
    blue: {
      bg: 'bg-blue-100/80',
      iconBg: 'from-blue-400 to-blue-600',
      shadow: 'shadow-blue-200/50',
    },
    peach: {
      bg: 'bg-peach-100/80',
      iconBg: 'from-peach-400 to-peach-600',
      shadow: 'shadow-peach-200/50',
    },
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 shadow-lg shadow-gray-200/40 border border-white/60 cursor-default group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-2xl ${colorClasses.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorClasses.iconBg} flex items-center justify-center shadow-md ${colorClasses.shadow}`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
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
    </motion.div>
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
