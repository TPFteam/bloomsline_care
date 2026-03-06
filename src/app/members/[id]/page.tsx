'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  Clock,
  Share2,
  StickyNote,
  Users,
  ChevronRight,
  Edit,
  Loader2,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, ProgressNote, Session as MemberSession } from '@/types/member'
import type { User as UserType } from '@/types/user'
import { getMemberFullName, getMemberInitials } from '@/types/member'

// Tab Components
import OverviewTab from './tabs/OverviewTab'
import SessionsTab from './tabs/SessionsTab'
import ProgressTab from './tabs/ProgressTab'
import FilesTab from './tabs/FilesTab'
import SharedTab from './tabs/SharedTab'
import NotesTab from './tabs/NotesTab'

type TabId = 'overview' | 'sessions' | 'notes' | 'progress' | 'files' | 'shared'

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get initial tab from URL or default to 'overview'
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const validTabs: TabId[] = ['overview', 'sessions', 'notes', 'progress', 'files', 'shared']
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'

  const [member, setMember] = useState<Member | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [highlightId, setHighlightId] = useState<string | undefined>(undefined)
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [sessions, setSessions] = useState<MemberSession[]>([])

  useEffect(() => {
    fetchMember()
    fetchRelatedData()
  }, [resolvedParams.id])

  const fetchMember = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        return
      }

      // Fetch user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userProfile) {
        setUser(userProfile)
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          user_type: authUser.user_metadata?.user_type || 'mentor',
          preferred_language: 'en',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        })
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('practitioner_id', authUser.id)
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
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('member_id', resolvedParams.id)
        .eq('practitioner_id', user.id)
        .order('scheduled_at', { ascending: false })

      if (sessionsData) setSessions(sessionsData)
    } catch (error) {
      console.error('Error fetching related data:', error)
    }
  }

  const handleStatusChange = async (newStatus: 'active' | 'inactive') => {
    if (!member) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', member.id)

      if (error) throw error

      // Update local state
      setMember({ ...member, status: newStatus })

      toast.success(
        locale === 'fr'
          ? `Statut changé en ${newStatus === 'active' ? 'Actif' : 'Inactif'}`
          : locale === 'es'
          ? `Estado cambiado a ${newStatus === 'active' ? 'Activo' : 'Inactivo'}`
          : `Status changed to ${newStatus === 'active' ? 'Active' : 'Inactive'}`
      )
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(
        locale === 'fr'
          ? 'Erreur lors du changement de statut'
          : locale === 'es'
          ? 'Error al cambiar el estado'
          : 'Failed to update status'
      )
    }
  }

  // Helper to update URL with tab parameter
  const updateTabInUrl = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }

  // Handler for navigating to tabs with optional highlight
  const handleNavigateToTab = (tab: TabId, id?: string) => {
    setActiveTab(tab)
    updateTabInUrl(tab)
    setHighlightId(id)
    // Clear highlight after 3 seconds
    if (id) {
      setTimeout(() => setHighlightId(undefined), 3000)
    }
  }

  // Handler for tab button clicks
  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab)
    updateTabInUrl(tab)
  }

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: t.members.profile.overview, icon: User },
    { id: 'sessions', label: t.members.profile.sessions, icon: Clock },
    { id: 'notes', label: t.members.profile.notes, icon: StickyNote },
    { id: 'progress', label: t.members.profile.progress, icon: TrendingUp },
    { id: 'files', label: t.members.profile.files, icon: FileText },
    { id: 'shared', label: t.members.profile.sharedResources, icon: Share2 },
  ]

  const statusConfig = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="text-gray-500 text-sm">{t.dashboard.loading}</span>
        </div>
      </div>
    )
  }

  if (!member) {
    return null
  }

  const status = statusConfig[member.status]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="members" />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm">
              <Link href="/members" className="text-gray-500 hover:text-gray-700 transition-colors">
                <Users className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900 truncate max-w-[300px]">
                {getMemberFullName(member)}
              </span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-2xl">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        getMemberInitials(member)
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${status.dot} rounded-full border-2 border-white`} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {getMemberFullName(member)}
                    </h1>
                    <Link href={`/members/${member.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    {/* Status Badge with Edit */}
                    <div className="flex items-center gap-1 group/status">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        {t.members.status[member.status] || t.members.status.active}
                      </span>
                      <button
                        onClick={() => {
                          const newStatus = member.status === 'active' ? 'inactive' : 'active'
                          const newStatusLabel = newStatus === 'active'
                            ? (locale === 'fr' ? 'Actif' : locale === 'es' ? 'Activo' : 'Active')
                            : (locale === 'fr' ? 'Inactif' : locale === 'es' ? 'Inactivo' : 'Inactive')
                          const confirmMsg = locale === 'fr'
                            ? `Changer le statut en "${newStatusLabel}" ?`
                            : locale === 'es'
                            ? `¿Cambiar estado a "${newStatusLabel}"?`
                            : `Change status to "${newStatusLabel}"?`
                          if (confirm(confirmMsg)) {
                            handleStatusChange(newStatus)
                          }
                        }}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover/status:opacity-100"
                        title={locale === 'fr' ? 'Changer le statut' : locale === 'es' ? 'Cambiar estado' : 'Change status'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {member.email && (
                      <div className="group h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 overflow-hidden">
                        <a
                          href={`mailto:${member.email}`}
                          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap text-sm transition-all duration-200 flex items-center">
                          <a href={`mailto:${member.email}`} className="hover:underline">
                            {member.email}
                          </a>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              navigator.clipboard.writeText(member.email!)
                              toast.success('Email copied')
                            }}
                            className="ml-2 mr-2 p-1 rounded hover:bg-gray-300 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="group h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 overflow-hidden">
                        <a
                          href={`tel:${member.phone}`}
                          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap text-sm transition-all duration-200 flex items-center">
                          <a href={`tel:${member.phone}`} className="hover:underline">
                            {member.phone}
                          </a>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              navigator.clipboard.writeText(member.phone!)
                              toast.success('Phone copied')
                            }}
                            className="ml-2 mr-2 p-1 rounded hover:bg-gray-300 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 overflow-x-auto"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  member={member}
                  notes={notes}
                  sessions={sessions}
                  onMemberUpdate={fetchMember}
                  onNavigateToTab={handleNavigateToTab}
                />
              )}
              {activeTab === 'sessions' && (
                <SessionsTab
                  memberId={member.id}
                  member={member}
                  sessions={sessions}
                  onSessionsUpdate={fetchRelatedData}
                  highlightSessionId={highlightId}
                />
              )}
              {activeTab === 'notes' && (
                <NotesTab memberId={member.id} sessions={sessions} notes={notes} onNotesUpdate={fetchRelatedData} member={member} />
              )}
              {activeTab === 'progress' && (
                <ProgressTab memberId={member.id} notes={notes} onNotesUpdate={fetchRelatedData} highlightMilestoneId={highlightId} />
              )}
              {activeTab === 'files' && (
                <FilesTab memberId={member.id} member={member} onMemberUpdate={fetchMember} />
              )}
              {activeTab === 'shared' && (
                <SharedTab memberId={member.id} member={member} highlightResourceId={highlightId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
