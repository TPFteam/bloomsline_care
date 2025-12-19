'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserCheck,
  Clock,
  Plus,
  Search,
  Calendar,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Sparkles,
  Activity,
  MoreHorizontal,
} from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icons'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, MemberFilter, MemberHubStats } from '@/types/member'
import { getMemberFullName, getMemberInitials, formatRelativeTime } from '@/types/member'

export default function MembersPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MemberFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<MemberHubStats>({
    total_members: 0,
    active_members: 0,
    inactive_members: 0,
    pending_members: 0,
    sessions_this_week: 0,
    average_engagement: 0,
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.log('Members table not yet created')
          setMembers([])
          calculateStats([])
          setLoading(false)
          return
        }
        throw error
      }

      setMembers(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error(t.members.errors.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (membersList: Member[]) => {
    const active = membersList.filter(m => m.status === 'active').length
    const inactive = membersList.filter(m => m.status === 'inactive').length
    const pending = membersList.filter(m => m.status === 'pending').length

    const engagementValues = { low: 1, medium: 2, high: 3 }
    const totalEngagement = membersList.reduce((sum, m) => sum + engagementValues[m.engagement_level], 0)
    const avgEngagement = membersList.length > 0 ? Math.round((totalEngagement / membersList.length / 3) * 100) : 0

    setStats({
      total_members: membersList.length,
      active_members: active,
      inactive_members: inactive,
      pending_members: pending,
      sessions_this_week: 0,
      average_engagement: avgEngagement,
    })
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm(t.members.actions.confirmDelete)) return

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMembers(members.filter(m => m.id !== id))
      calculateStats(members.filter(m => m.id !== id))
      toast.success(t.members.success.memberDeleted)
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error(t.members.errors.deleteFailed)
    }
  }

  const filteredMembers = members.filter(member => {
    if (filter !== 'all' && member.status !== filter) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = getMemberFullName(member).toLowerCase()
      const email = member.email?.toLowerCase() || ''
      const phone = member.phone?.toLowerCase() || ''

      if (!fullName.includes(query) && !email.includes(query) && !phone.includes(query)) {
        return false
      }
    }

    return true
  })

  const filterOptions: { value: MemberFilter; label: string; count: number }[] = [
    { value: 'all', label: t.members.filters.all, count: stats.total_members },
    { value: 'active', label: t.members.filters.active, count: stats.active_members },
    { value: 'inactive', label: t.members.filters.inactive, count: stats.inactive_members },
    { value: 'pending', label: t.members.filters.pending, count: stats.pending_members },
  ]

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <AnimatedIcon icon={Users} animation="pulse" size={32} animateOnHover={false} animateOnRender className="text-white" />
          </div>
          <p className="text-gray-500 font-medium">{t.dashboard.loading}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-coral-200/20 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-80 p-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-lavender-100/80 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-lg shadow-lavender-200/50">
                <AnimatedIcon icon={Users} animation="scale" size={20} animateOnHover animateOnRender={false} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {t.members.title}
                <AnimatedIcon icon={Sparkles} animation="sparkle" size={24} animateOnHover animateOnRender={false} className="text-lavender-400" />
              </h1>
              <p className="text-gray-600">{t.members.subtitle}</p>
            </div>
          </div>
          <Link href="/members/new">
            <Button className="bg-gradient-to-r from-lavender-500 via-lavender-500 to-indigo-500 hover:from-lavender-600 hover:via-lavender-600 hover:to-indigo-600 text-white shadow-xl shadow-lavender-300/30 border-0 rounded-xl px-6 py-3 text-base font-medium hover-lift">
              <AnimatedIcon icon={Plus} animation="scale" size={20} animateOnHover animateOnRender={false} className="mr-2" />
              {t.members.actions.addMember}
            </Button>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, value: stats.total_members, label: t.members.stats.totalMembers, gradient: 'from-lavender-400 to-lavender-600', bg: 'from-lavender-50 to-lavender-100/50', iconBg: 'bg-lavender-100/80' },
            { icon: UserCheck, value: stats.active_members, label: t.members.stats.activeMembers, gradient: 'from-emerald-400 to-emerald-600', bg: 'from-emerald-50 to-emerald-100/50', iconBg: 'bg-emerald-100/80' },
            { icon: Clock, value: stats.pending_members, label: t.members.stats.pendingMembers, gradient: 'from-amber-400 to-amber-600', bg: 'from-amber-50 to-amber-100/50', iconBg: 'bg-amber-100/80' },
            { icon: TrendingUp, value: `${stats.average_engagement}%`, label: t.members.stats.engagementRate, gradient: 'from-mint-400 to-mint-600', bg: 'from-mint-50 to-mint-100/50', iconBg: 'bg-mint-100/80' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 hover-lift cursor-default group shadow-lg shadow-gray-200/40 border border-white/60"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                  <AnimatedIcon icon={stat.icon} animation="scale" size={18} animateOnHover animateOnRender={false} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-4 mb-6 shadow-lg shadow-gray-200/30 border border-white/60"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    filter === option.value
                      ? 'bg-gradient-to-r from-lavender-500 to-indigo-500 text-white shadow-lg shadow-lavender-200/50'
                      : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80 hover:shadow-sm'
                  }`}
                >
                  {option.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filter === option.value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200/80 text-gray-500'
                  }`}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <AnimatedIcon icon={Search} animation="scale" size={20} animateOnHover animateOnRender={false} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.members.filters.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-50/80 border border-gray-100/80 focus:bg-white focus:border-lavender-300 focus:ring-2 focus:ring-lavender-100 outline-none transition-all text-sm placeholder:text-gray-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <AnimatePresence>
          {(searchQuery || filter !== 'all') && members.length > 0 && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-gray-500 mb-4"
            >
              {t.members.list.showing} <span className="font-semibold text-gray-700">{filteredMembers.length}</span> {t.members.list.of} {members.length} {t.members.list.members}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Members Grid */}
        <div className="max-w-7xl">
          {members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-12 max-w-md mx-auto shadow-xl shadow-gray-200/40 border border-white/60">
                <div className="w-20 h-20 bg-gradient-to-br from-lavender-100 to-lavender-200 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
                  <Users className="w-10 h-10 text-lavender-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t.members.list.noMembers}
                </h2>
                <p className="text-gray-500 mb-8">
                  {t.members.list.noMembersDescription}
                </p>
                <Link href="/members/new">
                  <Button className="bg-gradient-to-r from-lavender-500 to-indigo-500 hover:from-lavender-600 hover:to-indigo-600 text-white shadow-xl shadow-lavender-300/30 rounded-xl px-8 py-3 text-base font-medium">
                    <Plus className="w-5 h-5 mr-2" />
                    {t.members.actions.addMember}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : filteredMembers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-12 max-w-md mx-auto shadow-xl shadow-gray-200/40 border border-white/60">
                <div className="w-20 h-20 bg-gray-100/80 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t.members.list.noResults}
                </h2>
                <p className="text-gray-500">
                  {t.members.list.noResultsDescription}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, index) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    index={index}
                    onDelete={handleDeleteMember}
                    t={t}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Member Card Component
function MemberCard({
  member,
  index,
  onDelete,
  t,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  t: ReturnType<typeof useLanguage>['t']
}) {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)

  const statusConfig = {
    active: {
      gradient: 'from-emerald-400 to-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      glow: 'shadow-emerald-200/50',
    },
    inactive: {
      gradient: 'from-gray-300 to-gray-400',
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      glow: 'shadow-gray-200/50',
    },
    pending: {
      gradient: 'from-amber-400 to-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      glow: 'shadow-amber-200/50',
    },
  }

  const engagementConfig = {
    high: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🔥' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⚡' },
    low: { bg: 'bg-red-50', text: 'text-red-700', icon: '💤' },
  }

  const status = statusConfig[member.status]
  const engagement = engagementConfig[member.engagement_level]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div
        className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] overflow-hidden cursor-pointer transition-all duration-300 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-gray-200/60 border border-white/60"
        onClick={() => router.push(`/members/${member.id}`)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Gradient accent bar */}
        <div className={`h-1.5 bg-gradient-to-r ${status.gradient}`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-100 via-lavender-50 to-lavender-200 flex items-center justify-center text-lavender-700 font-bold text-lg shadow-md border border-white/80 ${status.glow} group-hover:scale-105 transition-transform duration-300`}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  getMemberInitials(member)
                )}
              </div>
              {/* Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${status.dot} border-[2.5px] border-white shadow-md ${member.status === 'active' ? 'status-dot-active' : ''}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-lavender-700 transition-colors">
                {getMemberFullName(member)}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 ${status.dot} rounded-full mr-1.5`} />
                  {t.members.status[member.status]}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${engagement.bg} ${engagement.text}`}>
                  <span>{engagement.icon}</span>
                  {t.members.engagement[member.engagement_level]}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg bg-white/80 text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                    onClick={() => router.push(`/members/${member.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg bg-white/80 text-gray-500 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contact Info */}
          <div className="space-y-2.5 mb-4">
            {member.email && (
              <div className="flex items-center gap-2.5 text-sm text-gray-500 group/item hover:text-gray-700 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-gray-50/80 flex items-center justify-center group-hover/item:bg-lavender-50 transition-colors">
                  <Mail className="w-4 h-4 group-hover/item:text-lavender-500 transition-colors" />
                </div>
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2.5 text-sm text-gray-500 group/item hover:text-gray-700 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-gray-50/80 flex items-center justify-center group-hover/item:bg-mint-50 transition-colors">
                  <Phone className="w-4 h-4 group-hover/item:text-mint-500 transition-colors" />
                </div>
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100/60 mt-auto">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.members.list.lastSession}: {formatRelativeTime(member.last_session_at)}</span>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showActions ? 1 : 0 }}
              className="flex items-center gap-1.5 text-lavender-600 text-xs font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              View Profile
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
