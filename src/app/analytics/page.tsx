'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Heart,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar, AppHeader } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import type { User } from '@/types/user'

interface AnalyticsData {
  // Members
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  pendingMembers: number

  // Sessions
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  noShowSessions: number
  upcomingSessions: number

  // This month
  sessionsThisMonth: number
  newMembersThisMonth: number

  // Journey stages
  discoveryCount: number
  buildingCount: number
  thrivingCount: number
  independentCount: number

  // Notes
  totalNotes: number
  notesThisMonth: number

  // Resources shared
  totalSharedResources: number

  // Recent members
  recentMembers: Array<{
    id: string
    first_name: string
    last_name: string
    status: string
    last_session_at: string | null
    created_at: string
  }>
}

export default function AnalyticsPage() {
  const { locale } = useLanguage()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    fetchAnalytics()
  }, [selectedMonth])

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    if (next <= new Date()) {
      setSelectedMonth(next)
    }
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear()
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile as User)
      } else {
        // Fallback to auth user metadata
        setUserProfile({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          user_type: user.user_metadata?.user_type || 'mentor',
          preferred_language: 'en',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        })
      }

      const now = new Date()
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString()
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()

      // Fetch all data in parallel
      const [
        membersRes,
        sessionsRes,
        milestonesRes,
        notesRes,
        sharedRes,
        sessionsThisMonthRes,
        newMembersRes,
        notesThisMonthRes,
      ] = await Promise.all([
        // Members
        supabase
          .from('members')
          .select('id, first_name, last_name, status, last_session_at, created_at')
          .eq('practitioner_id', user.id),

        // Sessions
        supabase
          .from('sessions')
          .select('id, status, scheduled_at')
          .eq('practitioner_id', user.id),

        // Journeys
        supabase
          .from('milestones')
          .select('id, status')
          .eq('practitioner_id', user.id),

        // Notes
        supabase
          .from('progress_notes')
          .select('id')
          .eq('practitioner_id', user.id),

        // Shared resources
        supabase
          .from('shared_resources')
          .select('id')
          .eq('practitioner_id', user.id),

        // Sessions this month
        supabase
          .from('sessions')
          .select('id')
          .eq('practitioner_id', user.id)
          .gte('scheduled_at', startOfMonth)
          .lte('scheduled_at', endOfMonth),

        // New members this month
        supabase
          .from('members')
          .select('id')
          .eq('practitioner_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth),

        // Notes this month
        supabase
          .from('progress_notes')
          .select('id')
          .eq('practitioner_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth),
      ])

      const members = membersRes.data || []
      const sessions = sessionsRes.data || []
      const milestones = milestonesRes.data || []

      // Calculate member stats
      const activeMembers = members.filter(m => m.status === 'active').length
      const inactiveMembers = members.filter(m => m.status === 'inactive').length
      const pendingMembers = members.filter(m => m.status === 'pending').length

      // Calculate session stats
      const completedSessions = sessions.filter(s => s.status === 'completed').length
      const cancelledSessions = sessions.filter(s => s.status === 'cancelled').length
      const noShowSessions = sessions.filter(s => s.status === 'no_show').length
      const upcomingSessions = sessions.filter(s =>
        s.status === 'scheduled' && new Date(s.scheduled_at) >= now
      ).length

      // Calculate journey stages
      const discoveryCount = milestones.filter(m => m.status === 'discovery' || m.status === 'planned').length
      const buildingCount = milestones.filter(m => m.status === 'building' || m.status === 'in_progress').length
      const thrivingCount = milestones.filter(m => m.status === 'thriving').length
      const independentCount = milestones.filter(m => m.status === 'independent' || m.status === 'achieved').length

      // Recent members (last 5)
      const recentMembers = [...members]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setData({
        totalMembers: members.length,
        activeMembers,
        inactiveMembers,
        pendingMembers,
        totalSessions: sessions.length,
        completedSessions,
        cancelledSessions,
        noShowSessions,
        upcomingSessions,
        sessionsThisMonth: sessionsThisMonthRes.data?.length || 0,
        newMembersThisMonth: newMembersRes.data?.length || 0,
        discoveryCount,
        buildingCount,
        thrivingCount,
        independentCount,
        totalNotes: notesRes.data?.length || 0,
        notesThisMonth: notesThisMonthRes.data?.length || 0,
        totalSharedResources: sharedRes.data?.length || 0,
        recentMembers,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AppSidebar activeItem="analytics" />
        <main className="flex-1 ml-64">
          <AppHeader user={null} />
          <div className="flex items-center justify-center h-[calc(100vh-65px)]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const completionRate = data.totalSessions > 0
    ? Math.round((data.completedSessions / data.totalSessions) * 100)
    : 0

  const totalJourneys = data.discoveryCount + data.buildingCount + data.thrivingCount + data.independentCount

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="analytics" />

      <main className="flex-1 ml-64">
        <AppHeader
          user={userProfile}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Activity className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Votre pratique' : 'Your practice'}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {locale === 'fr' ? 'Votre pratique en un coup d\'œil' : 'Your practice at a glance'}
                </h1>
                <p className="text-gray-500">
                  {locale === 'fr'
                    ? `Vous accompagnez ${data.totalMembers} ${data.totalMembers === 1 ? 'personne' : 'personnes'} dans leur parcours.`
                    : `You're supporting ${data.totalMembers} ${data.totalMembers === 1 ? 'person' : 'people'} on their journey.`
                  }
                </p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center capitalize">
                  {formatMonthYear(selectedMonth)}
                </span>
                <button
                  onClick={goToNextMonth}
                  disabled={isCurrentMonth()}
                  className={`p-2 rounded-lg transition-colors ${
                    isCurrentMonth()
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Key Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">
                  {locale === 'fr' ? 'Clients actifs' : 'Active clients'}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.activeMembers}</p>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'fr' ? `sur ${data.totalMembers} au total` : `of ${data.totalMembers} total`}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-500">
                  {isCurrentMonth()
                    ? (locale === 'fr' ? 'Ce mois' : 'This month')
                    : formatMonthYear(selectedMonth)
                  }
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.sessionsThisMonth}</p>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'fr' ? 'séances' : 'sessions'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm text-gray-500">
                  {locale === 'fr' ? 'À venir' : 'Upcoming'}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.upcomingSessions}</p>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'fr' ? 'séances planifiées' : 'scheduled sessions'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm text-gray-500">
                  {locale === 'fr' ? 'Taux de complétion' : 'Completion rate'}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {locale === 'fr' ? `${data.completedSessions} terminées` : `${data.completedSessions} completed`}
              </p>
            </motion.div>
          </div>

          {/* Journey Progress */}
          {totalJourneys > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-6 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {locale === 'fr' ? 'Progrès des objectifs' : 'Goal progress'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr'
                      ? `${totalJourneys} objectifs suivis au total`
                      : `${totalJourneys} goals tracked in total`
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-blue-50">
                  <p className="text-2xl font-bold text-blue-700">{data.discoveryCount}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {locale === 'fr' ? 'Découverte' : 'Discovery'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-50">
                  <p className="text-2xl font-bold text-amber-700">{data.buildingCount}</p>
                  <p className="text-sm text-amber-600 mt-1">
                    {locale === 'fr' ? 'Construction' : 'Building'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50">
                  <p className="text-2xl font-bold text-emerald-700">{data.thrivingCount}</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    {locale === 'fr' ? 'Épanouissement' : 'Thriving'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-violet-50">
                  <p className="text-2xl font-bold text-violet-700">{data.independentCount}</p>
                  <p className="text-sm text-violet-600 mt-1">
                    {locale === 'fr' ? 'Autonome' : 'Independent'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Session Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <h3 className="font-medium text-gray-900 mb-4">
                {locale === 'fr' ? 'Résumé des séances' : 'Session summary'}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm text-gray-600">
                      {locale === 'fr' ? 'Terminées' : 'Completed'}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.completedSessions}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {locale === 'fr' ? 'Annulées' : 'Cancelled'}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.cancelledSessions}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-gray-600">
                      {locale === 'fr' ? 'Absences' : 'No-shows'}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.noShowSessions}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {locale === 'fr' ? 'Total des séances' : 'Total sessions'}
                  </span>
                  <span className="font-semibold text-gray-900">{data.totalSessions}</span>
                </div>
              </div>
            </motion.div>

            {/* Activity Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <h3 className="font-medium text-gray-900 mb-4">
                {locale === 'fr' ? 'Votre activité' : 'Your activity'}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {locale === 'fr' ? 'Notes rédigées' : 'Notes written'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{data.totalNotes}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({data.notesThisMonth} {locale === 'fr' ? 'ce mois' : 'this month'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {locale === 'fr' ? 'Nouveaux clients' : 'New clients'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{data.newMembersThisMonth}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {locale === 'fr' ? 'ce mois' : 'this month'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {locale === 'fr' ? 'Ressources partagées' : 'Resources shared'}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{data.totalSharedResources}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Members */}
          {data.recentMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {locale === 'fr' ? 'Clients récents' : 'Recent clients'}
                </h3>
                <Link href="/members">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 rounded-lg">
                    {locale === 'fr' ? 'Voir tous' : 'View all'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                {data.recentMembers.map((member) => (
                  <Link key={member.id} href={`/members/${member.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {locale === 'fr' ? 'Ajouté le' : 'Added'}{' '}
                            {new Date(member.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : member.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.status === 'active'
                          ? (locale === 'fr' ? 'Actif' : 'Active')
                          : member.status === 'pending'
                          ? (locale === 'fr' ? 'En attente' : 'Pending')
                          : (locale === 'fr' ? 'Inactif' : 'Inactive')
                        }
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {data.totalMembers === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-12 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {locale === 'fr' ? 'Commencez votre pratique' : 'Start your practice'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {locale === 'fr'
                  ? 'Ajoutez votre premier client pour commencer à suivre votre pratique.'
                  : 'Add your first client to start tracking your practice.'
                }
              </p>
              <Link href="/members">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl">
                  {locale === 'fr' ? 'Ajouter un client' : 'Add a client'}
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
