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
  UserPlus,
  CalendarPlus,
} from 'lucide-react'
import { EditMemberModal } from '@/components/members/EditMemberModal'
import { MaskedContact } from '@/components/ui/masked-contact'
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
import { MemberDocumentsCard } from '@/components/members/MemberDocumentsCard'

type TabId = 'overview' | 'sessions_notes' | 'progress' | 'files' | 'shared'
type SubTabId = 'sessions' | 'notes'

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get initial tab from URL or default to 'overview'.
  // Back-compat: legacy `?tab=sessions` and `?tab=notes` URLs are mapped to the
  // new merged 'sessions_notes' tab with the correct sub-tab pre-selected.
  const rawTabFromUrl = searchParams.get('tab')
  const rawSubFromUrl = searchParams.get('sub') as SubTabId | null
  const validTabs: TabId[] = ['overview', 'sessions_notes', 'progress', 'files', 'shared']
  let initialTab: TabId = 'overview'
  let initialSub: SubTabId = 'sessions'
  if (rawTabFromUrl === 'sessions') {
    initialTab = 'sessions_notes'
    initialSub = 'sessions'
  } else if (rawTabFromUrl === 'notes') {
    initialTab = 'sessions_notes'
    initialSub = 'notes'
  } else if (rawTabFromUrl && validTabs.includes(rawTabFromUrl as TabId)) {
    initialTab = rawTabFromUrl as TabId
    if (initialTab === 'sessions_notes' && (rawSubFromUrl === 'sessions' || rawSubFromUrl === 'notes')) {
      initialSub = rawSubFromUrl
    }
  }

  const [member, setMember] = useState<Member | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(initialSub)
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [bookSessionTrigger, setBookSessionTrigger] = useState(false)
  const [highlightId, setHighlightId] = useState<string | undefined>(
    searchParams.get('highlight') || undefined,
  )
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [sessions, setSessions] = useState<MemberSession[]>([])

  useEffect(() => {
    fetchMember()
    fetchRelatedData()
  }, [resolvedParams.id])

  // Auto-clear the URL-provided highlight after a few seconds so the
  // ring fades naturally and the URL stops carrying transient state.
  useEffect(() => {
    if (!searchParams.get('highlight')) return
    const t = setTimeout(() => setHighlightId(undefined), 4000)
    return () => clearTimeout(t)
  }, [searchParams])

  // Redirect prospect to 'sessions_notes' tab if on a tab they can't see
  useEffect(() => {
    if (member?.status === 'prospect' && !prospectTabs.includes(activeTab)) {
      setActiveTab('sessions_notes')
      setActiveSubTab('sessions')
    }
  }, [member?.status])

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

      // Lifecycle hook: when a member becomes inactive, cancel their future
      // recurring-series occurrences. The relationship has paused/ended, so
      // those slots shouldn't keep blocking the practitioner's availability.
      // We mark them cancelled directly rather than calling the booking
      // cancel API to avoid spamming the patient with notifications now that
      // the relationship is over (sendUpdates=none in spirit).
      if (newStatus === 'inactive') {
        try {
          const nowIso = new Date().toISOString()
          await supabase
            .from('bookings')
            .update({
              status: 'cancelled',
              cancelled_at: nowIso,
              cancelled_by: 'practitioner',
              cancellation_reason: 'Member set to inactive — series cleanup',
              updated_at: nowIso,
            })
            .eq('member_id', member.id)
            .gte('start_time', nowIso)
            .not('series_id', 'is', null)
            .neq('status', 'cancelled')

          await supabase
            .from('sessions')
            .update({ status: 'cancelled', updated_at: nowIso })
            .eq('member_id', member.id)
            .gte('scheduled_at', nowIso)
            .not('series_id', 'is', null)
            .in('status', ['scheduled', 'confirmed'])
        } catch (cleanupErr) {
          console.warn('Series cleanup on inactive failed:', cleanupErr)
        }
      }

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

  // Helper to update URL with tab + optional sub-tab
  const updateTabInUrl = (tab: TabId, sub?: SubTabId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    if (tab === 'sessions_notes') {
      // Only set sub when not the default ('sessions')
      if (sub && sub !== 'sessions') params.set('sub', sub)
      else params.delete('sub')
    } else {
      params.delete('sub')
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }

  // Handler for navigating to tabs with optional highlight + optional sub-tab.
  // Pulse citations route session/note source types here with a sub hint.
  const handleNavigateToTab = (tab: TabId, id?: string, sub?: SubTabId) => {
    setActiveTab(tab)
    if (sub) setActiveSubTab(sub)
    updateTabInUrl(tab, sub)
    setHighlightId(id)
    // Clear highlight ring after a delay. Files tab may need to fetch a
    // subfolder before scrolling, so give it a bit more headroom.
    if (id) {
      const delay = tab === 'files' ? 6000 : 3000
      setTimeout(() => setHighlightId(undefined), delay)
    }
  }

  // Handler for tab button clicks
  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab)
    updateTabInUrl(tab, tab === 'sessions_notes' ? activeSubTab : undefined)
  }

  // Handler for sub-tab clicks inside Sessions and Notes
  const handleSubTabClick = (sub: SubTabId) => {
    setActiveSubTab(sub)
    updateTabInUrl('sessions_notes', sub)
  }

  const isProspect = member?.status === 'prospect'

  const sessionsAndNotesLabel = locale === 'fr'
    ? 'Suivi'
    : locale === 'es'
      ? 'Sesiones'
      : 'Sessions'

  const allTabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: t.members.profile.overview, icon: User },
    { id: 'sessions_notes', label: sessionsAndNotesLabel, icon: Clock },
    { id: 'progress', label: t.members.profile.progress, icon: TrendingUp },
    { id: 'files', label: t.members.profile.files, icon: FileText },
    { id: 'shared', label: t.members.profile.sharedResources, icon: Share2 },
  ]

  const prospectTabs: TabId[] = ['sessions_notes', 'files']
  const tabs = isProspect ? allTabs.filter(tab => prospectTabs.includes(tab.id)) : allTabs

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    prospect: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
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
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 relative"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Session - top right */}
                <div className="absolute top-6 right-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('sessions_notes')
                      setActiveSubTab('sessions')
                      updateTabInUrl('sessions_notes', 'sessions')
                      setBookSessionTrigger(true)
                    }}
                    className="text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                  >
                    <CalendarPlus className="w-4 h-4 mr-1.5" />
                    {locale === 'fr' ? 'Réserver une séance' : 'Book session'}
                  </Button>
                </div>
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
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={() => setShowEditModal(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {/* Status Badge with Edit */}
                    <div className="flex items-center gap-1 group/status">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        {member.status === 'prospect' ? (locale === 'fr' ? 'Nouveau' : 'New') : (t.members.status[member.status as 'active' | 'inactive' | 'pending'] || t.members.status.active)}
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
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap text-sm transition-all duration-200 flex items-center gap-1.5 pr-0 group-hover:pr-2">
                          <MaskedContact value={member.email} type="email" />
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              navigator.clipboard.writeText(member.email!)
                              toast.success(locale === 'fr' ? 'Email copié' : 'Email copied')
                            }}
                            className="p-1 rounded hover:bg-gray-300 transition-colors flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="group h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 overflow-hidden">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="max-w-0 group-hover:max-w-xs overflow-hidden whitespace-nowrap text-sm transition-all duration-200 flex items-center gap-1.5 pr-0 group-hover:pr-2">
                          <MaskedContact value={member.phone} type="phone" />
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              navigator.clipboard.writeText(member.phone!)
                              toast.success(locale === 'fr' ? 'Téléphone copié' : 'Phone copied')
                            }}
                            className="p-1 rounded hover:bg-gray-300 transition-colors flex-shrink-0"
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

          {/* Prospect banner */}
          {isProspect && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-teal-800">
                  {locale === 'fr' ? 'Nouveau contact' : 'New contact'}
                </p>
                <p className="text-xs text-teal-600">
                  {locale === 'fr' ? 'Ce contact a réservé une séance mais n\'est pas encore patient.' : 'This contact booked a session but is not a patient yet.'}
                </p>
              </div>
              <button
                onClick={() => setShowConvertConfirm(true)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium whitespace-nowrap ml-4 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {locale === 'fr' ? 'Convertir en patient' : 'Convert to patient'}
              </button>
            </motion.div>
          )}

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
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
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
              {activeTab === 'sessions_notes' && (
                <div>
                  {/* Sub-tab strip — underline style, secondary nav */}
                  <div className="flex items-center gap-6 mb-5 border-b border-gray-200">
                    {([
                      { id: 'sessions' as const, label: t.members.profile.sessions, icon: Clock },
                      { id: 'notes' as const, label: locale === 'fr' ? 'Parcourir' : locale === 'es' ? 'Buscar' : 'Find', icon: StickyNote },
                    ]).map(sub => {
                      const SubIcon = sub.icon
                      const isActive = activeSubTab === sub.id
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSubTabClick(sub.id)}
                          className={`flex items-center gap-2 px-1 pb-2.5 -mb-px text-sm font-medium transition-colors border-b-2 ${
                            isActive
                              ? 'text-gray-900 border-gray-900'
                              : 'text-gray-500 border-transparent hover:text-gray-700'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>

                  {activeSubTab === 'sessions' && (
                    <SessionsTab
                      memberId={member.id}
                      member={member}
                      sessions={sessions}
                      onSessionsUpdate={fetchRelatedData}
                      highlightSessionId={highlightId}
                      openBookModal={bookSessionTrigger}
                      onBookModalOpened={() => setBookSessionTrigger(false)}
                    />
                  )}
                  {activeSubTab === 'notes' && (
                    <NotesTab memberId={member.id} sessions={sessions} notes={notes} onNotesUpdate={fetchRelatedData} onSessionsUpdate={fetchRelatedData} member={member} highlightNoteId={highlightId} />
                  )}
                </div>
              )}
              {activeTab === 'progress' && (
                <ProgressTab memberId={member.id} notes={notes} onNotesUpdate={fetchRelatedData} highlightMilestoneId={highlightId} />
              )}
              {activeTab === 'files' && (
                <div>
                  <MemberDocumentsCard memberId={member.id} locale={locale} />
                  <FilesTab memberId={member.id} member={member} onMemberUpdate={fetchMember} highlightFileId={highlightId} />
                </div>
              )}
              {activeTab === 'shared' && (
                <SharedTab memberId={member.id} member={member} highlightResourceId={highlightId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Edit Member Modal */}
      {showEditModal && member && (
        <EditMemberModal
          memberId={member.id}
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setMember(updated)
          }}
        />
      )}

      {/* Convert to patient confirmation */}
      {showConvertConfirm && member && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConvertConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              {locale === 'fr' ? 'Convertir en patient ?' : 'Convert to patient?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {locale === 'fr'
                ? `${member.first_name} ${member.last_name} deviendra un patient actif avec accès à toutes les fonctionnalités.`
                : `${member.first_name} ${member.last_name} will become an active patient with access to all features.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConvertConfirm(false)}
                className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await supabase.from('members').update({ status: 'active' }).eq('id', member.id)
                  setMember(prev => prev ? { ...prev, status: 'active' as const } : prev)
                  setShowConvertConfirm(false)
                  toast.success(locale === 'fr' ? 'Converti en patient !' : 'Converted to patient!')
                }}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium"
              >
                {locale === 'fr' ? 'Convertir' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
