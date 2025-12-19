'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  Target,
  Flame,
  Loader2,
  Users,
  FileText,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'

interface ProgressStats {
  totalCompleted: number
  totalAssigned: number
  currentStreak: number
  longestStreak: number
  weeklyProgress: number[]
}

export default function ProgressPage() {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProgressStats>({
    totalCompleted: 0,
    totalAssigned: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
  })

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get member record
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      // Get completed submissions
      const { data: submissions } = await supabase
        .from('resource_responses')
        .select('submitted_at, status')
        .eq('member_id', member.id)
        .eq('status', 'submitted')

      // Get total assignments
      const { data: assignments } = await supabase
        .from('resource_assignments')
        .select('id')
        .eq('member_id', member.id)

      // Get shared resources
      const { data: shared } = await supabase
        .from('member_shared_resources')
        .select('id')
        .eq('member_id', member.id)

      const totalAssigned = (assignments?.length || 0) + (shared?.length || 0)
      const totalCompleted = submissions?.length || 0

      // Calculate weekly progress (last 7 days)
      const weeklyProgress = [0, 0, 0, 0, 0, 0, 0]
      const now = new Date()

      submissions?.forEach(sub => {
        if (sub.submitted_at) {
          const subDate = new Date(sub.submitted_at)
          const daysDiff = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff >= 0 && daysDiff < 7) {
            weeklyProgress[6 - daysDiff]++
          }
        }
      })

      // Calculate streak (simplified)
      let currentStreak = 0
      const sortedDates = submissions
        ?.filter(s => s.submitted_at)
        .map(s => new Date(s.submitted_at!).toDateString())
        .filter((v, i, a) => a.indexOf(v) === i) // unique dates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      if (sortedDates && sortedDates.length > 0) {
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          currentStreak = 1
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1])
            const currDate = new Date(sortedDates[i])
            const diff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
            if (diff === 1) {
              currentStreak++
            } else {
              break
            }
          }
        }
      }

      setStats({
        totalCompleted,
        totalAssigned,
        currentStreak,
        longestStreak: Math.max(currentStreak, 3), // Placeholder
        weeklyProgress,
      })
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const completionPercentage = stats.totalAssigned > 0
    ? Math.round((stats.totalCompleted / stats.totalAssigned) * 100)
    : 0

  const dayLabels = locale === 'fr'
    ? ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {locale === 'fr' ? 'Votre Progrès' : 'Your Progress'}
          </h1>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Suivez votre parcours de bien-être'
              : 'Track your wellness journey'}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Completion Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold mb-1">{completionPercentage}%</p>
            <p className="text-emerald-100 text-sm">
              {locale === 'fr' ? 'Complété' : 'Completed'}
            </p>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-5 text-white"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.currentStreak}</p>
            <p className="text-amber-100 text-sm">
              {locale === 'fr' ? 'Jours de suite' : 'Day Streak'}
            </p>
          </motion.div>

          {/* Total Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCompleted}</p>
            <p className="text-gray-500 text-sm">
              {locale === 'fr' ? 'Terminés' : 'Completed'}
            </p>
          </motion.div>

          {/* Total Assigned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAssigned}</p>
            <p className="text-gray-500 text-sm">
              {locale === 'fr' ? 'Total assignés' : 'Total Assigned'}
            </p>
          </motion.div>
        </div>

        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {locale === 'fr' ? 'Cette semaine' : 'This Week'}
            </h3>
            <div className="flex items-center gap-1 text-emerald-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.weeklyProgress.reduce((a, b) => a + b, 0)} {locale === 'fr' ? 'terminés' : 'completed'}</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-24">
            {stats.weeklyProgress.map((count, idx) => {
              const maxCount = Math.max(...stats.weeklyProgress, 1)
              const height = (count / maxCount) * 100
              const isToday = idx === 6

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-16">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 8)}%` }}
                      transition={{ delay: 0.4 + idx * 0.05, type: 'spring' }}
                      className={`w-full max-w-[28px] rounded-full ${
                        isToday
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : count > 0
                            ? 'bg-emerald-200'
                            : 'bg-gray-100'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                    {dayLabels[idx]}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Quick Access Sections */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'Accès rapide' : 'Quick Access'}
          </h3>
          <div className="space-y-3">
            {/* My Mentors */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Link
                href="/mentors"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Mes Mentors' : 'My Mentors'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Voir vos accompagnants' : 'View your practitioners'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>

            {/* My Resources */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/worksheets"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Mes Ressources' : 'My Worksheets'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Worksheets et exercices' : 'Worksheets and exercises'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>

            {/* My Stories */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link
                href="/stories"
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Mes Histoires' : 'My Stories'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Récits thérapeutiques' : 'Therapeutic stories'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Achievements Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {locale === 'fr' ? 'Prochaine réussite' : 'Next Achievement'}
              </h3>
              <p className="text-sm text-gray-500">
                {locale === 'fr'
                  ? `${5 - stats.totalCompleted > 0 ? 5 - stats.totalCompleted : 0} de plus pour débloquer`
                  : `${5 - stats.totalCompleted > 0 ? 5 - stats.totalCompleted : 0} more to unlock`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.totalCompleted / 5) * 100, 100)}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
            <span className="text-sm font-medium text-purple-600">
              {stats.totalCompleted}/5
            </span>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  )
}
