'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, ProgressNote, Session as MemberSession } from '@/types/member'
import { getMemberFullName, getMemberInitials, formatRelativeTime } from '@/types/member'

// Tab Components
import OverviewTab from './tabs/OverviewTab'
import SessionsTab from './tabs/SessionsTab'
import ProgressTab from './tabs/ProgressTab'
import FilesTab from './tabs/FilesTab'
import SharedTab from './tabs/SharedTab'
import SubmissionsTab from './tabs/SubmissionsTab'

type TabId = 'overview' | 'sessions' | 'progress' | 'files' | 'shared' | 'submissions'

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    fetchMember()
    fetchRelatedData()
  }, [resolvedParams.id])

  const fetchMember = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('practitioner_id', user.id)
        .single()

      if (error) {
        if (error.code === '42P01') {
          console.log('Members table not yet created')
          router.push('/members')
          return
        }
        throw error
      }

      if (!data) {
        router.push('/members')
        return
      }

      setMember(data)
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error(t.members.errors.loadFailed)
      router.push('/members')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch notes
      const { data: notesData } = await supabase
        .from('progress_notes')
        .select('*')
        .eq('member_id', resolvedParams.id)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notesData) setNotes(notesData)

      // Fetch sessions
      const { data: sessionsData, count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('member_id', resolvedParams.id)
        .eq('practitioner_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (sessionsData) setSessions(sessionsData)
      if (count !== null) setTotalSessions(count)
    } catch (error) {
      console.error('Error fetching related data:', error)
    }
  }

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: t.members.profile.overview, icon: User },
    { id: 'sessions', label: t.members.profile.sessions, icon: Clock },
    { id: 'progress', label: t.members.profile.progress, icon: TrendingUp },
    { id: 'submissions', label: t.members.profile.submissions || 'Submissions', icon: FileText },
    { id: 'files', label: t.members.profile.files, icon: FileText },
    { id: 'shared', label: t.members.profile.sharedResources, icon: Share2 },
  ]

  const statusStyles = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', gradient: 'from-emerald-400 to-mint-500', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-gray-50', text: 'text-gray-600', gradient: 'from-gray-300 to-gray-400', dot: 'bg-gray-400' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', gradient: 'from-amber-400 to-peach-500', dot: 'bg-amber-500' },
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-lavender-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-mint-400/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center glass-card rounded-3xl p-12"
        >
          <div className="w-16 h-16 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 animate-pulse-glow"></div>
          <p className="text-gray-600 font-medium">{t.dashboard.loading}</p>
        </motion.div>
      </div>
    )
  }

  if (!member) {
    return null
  }

  const status = statusStyles[member.status]

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lavender-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-mint-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-coral-300/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Members', labelFr: 'Membres', href: '/members', icon: <Users className="w-4 h-4" /> },
              { label: getMemberFullName(member) },
            ]}
          />
        </div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          {/* Main Profile Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white/60 overflow-hidden">
            {/* Status Bar with gradient */}
            <div className={`h-1.5 bg-gradient-to-r ${status.gradient}`} />

            <div className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Avatar with glow effect */}
                <div className="flex-shrink-0 flex justify-center md:justify-start">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-[1.75rem] blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[1.5rem] bg-gradient-to-br from-lavender-100 via-lavender-50 to-lavender-200 flex items-center justify-center text-lavender-700 font-bold text-3xl sm:text-4xl shadow-lg border-2 border-white/80">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full rounded-[1.5rem] object-cover" />
                      ) : (
                        getMemberInitials(member)
                      )}
                    </div>
                    {/* Status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 ${status.dot} rounded-full border-[3px] border-white shadow-lg`}>
                      <div className={`absolute inset-0 ${status.dot} rounded-full animate-ping opacity-30`} />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                      {getMemberFullName(member)}
                      {member.engagement_level === 'high' && (
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      )}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>
                        <span className={`w-2 h-2 ${status.dot} rounded-full mr-2`} />
                        {t.members.status[member.status]}
                      </span>
                      {member.date_of_birth && (
                        <span className="text-sm text-gray-500 flex items-center gap-1.5 bg-gray-50/80 px-3 py-1.5 rounded-full">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(member.date_of_birth).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-lavender-600 transition-all bg-gray-50/80 hover:bg-lavender-50 px-4 py-2.5 rounded-xl group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-lavender-100 group-hover:bg-lavender-200 flex items-center justify-center transition-colors">
                          <Mail className="w-4 h-4 text-lavender-600" />
                        </div>
                        <span className="font-medium">{member.email}</span>
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-mint-600 transition-all bg-gray-50/80 hover:bg-mint-50 px-4 py-2.5 rounded-xl group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-mint-100 group-hover:bg-mint-200 flex items-center justify-center transition-colors">
                          <Phone className="w-4 h-4 text-mint-600" />
                        </div>
                        <span className="font-medium">{member.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section - Separated with subtle bg */}
            <div className="bg-gradient-to-r from-gray-50/80 via-gray-50/60 to-gray-50/80 border-t border-gray-100/80 px-6 sm:px-8 py-5">
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center group"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-lavender-100/80 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5 text-lavender-600" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t.members.profile.memberSince}</p>
                    <p className="font-bold text-gray-900">
                      {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-center group border-x border-gray-200/50"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-mint-100/80 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5 text-mint-600" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t.members.profile.lastSession}</p>
                    <p className="font-bold text-gray-900">
                      {formatRelativeTime(member.last_session_at)}
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center group"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-coral-100/80 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 text-coral-600" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t.members.profile.totalSessions}</p>
                    <p className="font-bold text-gray-900">{totalSessions}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-2 mb-6 shadow-lg shadow-gray-200/30 border border-white/60"
        >
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-smooth whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-white/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-lavender-500 to-lavender-600 rounded-xl shadow-lg shadow-lavender-300/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                member={member}
                notes={notes}
                onNotesUpdate={fetchRelatedData}
                onMemberUpdate={fetchMember}
              />
            )}
            {activeTab === 'sessions' && (
              <SessionsTab
                memberId={member.id}
                member={member}
                sessions={sessions}
                onSessionsUpdate={fetchRelatedData}
              />
            )}
            {activeTab === 'progress' && (
              <ProgressTab memberId={member.id} />
            )}
            {activeTab === 'submissions' && (
              <SubmissionsTab member={member} />
            )}
            {activeTab === 'files' && (
              <FilesTab memberId={member.id} />
            )}
            {activeTab === 'shared' && (
              <SharedTab memberId={member.id} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
