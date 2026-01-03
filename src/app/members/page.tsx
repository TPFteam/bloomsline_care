'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Clock,
  Plus,
  Search,
  Calendar,
  Mail,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
  CalendarCheck,
  Phone,
  X,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import type { User } from '@/types/user'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, MemberFilter, MemberHubStats, Session } from '@/types/member'
import { getMemberFullName, getMemberInitials, formatDate } from '@/types/member'

export default function MembersPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<Member[]>([])
  const [nextSessions, setNextSessions] = useState<Record<string, Session | null>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MemberFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<MemberHubStats>({
    total_members: 0,
    active_members: 0,
    inactive_members: 0,
    pending_members: 0,
    sessions_this_week: 0,
    average_engagement: 0,
  })

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
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
        .eq('practitioner_id', authUser.id)
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

      // Fetch next scheduled sessions for all members
      if (data && data.length > 0) {
        const memberIds = data.map(m => m.id)
        const now = new Date().toISOString()

        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .in('member_id', memberIds)
          .eq('status', 'scheduled')
          .gte('scheduled_at', now)
          .order('scheduled_at', { ascending: true })

        // Group by member_id and get the earliest session for each
        const sessionsMap: Record<string, Session | null> = {}
        memberIds.forEach(id => { sessionsMap[id] = null })

        sessions?.forEach(session => {
          if (!sessionsMap[session.member_id]) {
            sessionsMap[session.member_id] = session as Session
          }
        })

        setNextSessions(sessionsMap)
      }
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()) {
      toast.error(locale === 'fr'
        ? 'Le prénom, le nom et l\'email sont requis'
        : 'First name, last name, and email are required')
      return
    }

    setSaving(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        return
      }

      const memberData = {
        practitioner_id: authUser.id,
        first_name: newMember.firstName.trim(),
        last_name: newMember.lastName.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone.trim() || null,
        status: 'pending' as const,
        engagement_level: 'medium' as const,
      }

      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // Add to list and recalculate stats
      const updatedMembers = [data, ...members]
      setMembers(updatedMembers)
      calculateStats(updatedMembers)

      // Reset form and close modal
      setNewMember({ firstName: '', lastName: '', email: '', phone: '' })
      setShowAddModal(false)
      toast.success(t.members.success.memberCreated)
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error(error instanceof Error ? error.message : t.members.errors.saveFailed)
    } finally {
      setSaving(false)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="text-gray-500 text-sm">{t.dashboard.loading}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="members" />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Users className="w-4 h-4" strokeWidth={2.5} />
              <span>{locale === 'fr' ? 'Patients' : 'Members'}</span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 mb-6"
          >
            {/* Top Row: Filter Pills and Actions */}
            <div className="flex items-center justify-between gap-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      filter === option.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {option.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                      filter === option.value
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.members.filters.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 rounded-xl bg-white border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                  />
                </div>

                {/* View Mode */}
                <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Bookings Button */}
                <Link href="/bookings">
                  <Button variant="outline" className="rounded-xl px-4 border-gray-200">
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Séances' : 'Bookings'}
                  </Button>
                </Link>

                {/* Add Member Button */}
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.members.actions.addMember}
                </Button>
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

          {/* Members Grid/List */}
          {members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="bg-white rounded-2xl p-12 max-w-md mx-auto border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t.members.list.noMembers}
                </h2>
                <p className="text-gray-500 mb-6">
                  {t.members.list.noMembersDescription}
                </p>
                <Link href="/members/new">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
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
              <div className="bg-white rounded-2xl p-12 max-w-md mx-auto border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t.members.list.noResults}
                </h2>
                <p className="text-gray-500">
                  {t.members.list.noResultsDescription}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-3'
            }>
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, index) => (
                  viewMode === 'grid' ? (
                    <MemberCard
                      key={member.id}
                      member={member}
                      index={index}
                      onDelete={handleDeleteMember}
                      t={t}
                      locale={locale}
                      nextSession={nextSessions[member.id] || null}
                    />
                  ) : (
                    <MemberListItem
                      key={member.id}
                      member={member}
                      index={index}
                      onDelete={handleDeleteMember}
                      t={t}
                      locale={locale}
                      nextSession={nextSessions[member.id] || null}
                    />
                  )
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-md shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr' ? 'Nouveau Client' : 'New Member'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddMember} className="p-5">
                <div className="space-y-4">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t.members.form.firstName} *
                      </label>
                      <input
                        type="text"
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                        placeholder={locale === 'fr' ? 'Jean' : 'John'}
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t.members.form.lastName} *
                      </label>
                      <input
                        type="text"
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                        placeholder={locale === 'fr' ? 'Dupont' : 'Doe'}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {t.members.form.email} *
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                      placeholder={locale === 'fr' ? 'jean@exemple.com' : 'john@example.com'}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {t.members.form.phone}
                      <span className="text-gray-400 font-normal text-xs">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                      placeholder={locale === 'fr' ? '+33 6 12 34 56 78' : '+1 (555) 123-4567'}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {t.members.form.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.members.form.saving}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Créer' : 'Create'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Member Card Component (Grid View)
function MemberCard({
  member,
  index,
  onDelete,
  t,
  locale,
  nextSession,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  t: ReturnType<typeof useLanguage>['t']
  locale: 'en' | 'fr'
  nextSession: Session | null
}) {
  const router = useRouter()

  const statusConfig = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  }

  const engagementConfig = {
    high: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '🔥' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', label: '⚡' },
    low: { bg: 'bg-gray-100', text: 'text-gray-600', label: '💤' },
  }

  const status = statusConfig[member.status]
  const engagement = engagementConfig[member.engagement_level]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => router.push(`/members/${member.id}`)}
      className="group bg-white rounded-2xl p-5 cursor-pointer transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              getMemberInitials(member)
            )}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${status.dot} border-2 border-white`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
            {getMemberFullName(member)}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.bg} ${status.text}`}>
              {t.members.status[member.status]}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${engagement.bg} ${engagement.text}`}>
              {engagement.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/members/${member.id}/edit`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {member.email && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {locale === 'fr' ? 'Dernière' : 'Last'}: {formatDate(member.last_session_at, locale)}
          </span>
        </div>
        {nextSession ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">
              {locale === 'fr' ? 'Prochaine' : 'Next'}: {formatDate(nextSession.scheduled_at, locale)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{locale === 'fr' ? 'Pas de séance planifiée' : 'No session scheduled'}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Member List Item Component (List View)
function MemberListItem({
  member,
  index,
  onDelete,
  t,
  locale,
  nextSession,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  t: ReturnType<typeof useLanguage>['t']
  locale: 'en' | 'fr'
  nextSession: Session | null
}) {
  const router = useRouter()

  const statusConfig = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  }

  const status = statusConfig[member.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={() => router.push(`/members/${member.id}`)}
      className="group bg-white rounded-xl p-4 cursor-pointer transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
          ) : (
            getMemberInitials(member)
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.dot} border-2 border-white`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">
            {getMemberFullName(member)}
          </h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.bg} ${status.text}`}>
            {t.members.status[member.status]}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {member.email || (locale === 'fr' ? 'Pas de contact' : 'No contact')}
        </p>
      </div>

      {/* Session Info */}
      <div className="hidden lg:flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(member.last_session_at, locale)}</span>
        </div>
        {nextSession && (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Clock className="w-4 h-4" />
            <span>{formatDate(nextSession.scheduled_at, locale)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => router.push(`/members/${member.id}/edit`)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
