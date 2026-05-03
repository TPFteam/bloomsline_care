'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  BookOpen,
  Share2,
  Loader2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Bell,
  Users,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { notifyResourceShared, sendResourceSharedEmail } from '@/lib/notifications'
import type { User } from '@/types/user'

interface SharedRecord {
  id: string
  resource_id: string
  member_id: string
  shared_at: string
  resource_title: string
  resource_type: string
  member_first_name: string
  member_last_name: string
  response_status: string | null
  response_submitted_at: string | null
  last_reminder_at: string | null
}

export default function SharedResourcesPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [records, setRecords] = useState<SharedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [memberFilter, setMemberFilter] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/sign-in'); return }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    setUser(profile)

    // Fetch all shared resources with member info
    const { data: shared } = await supabase
      .from('member_shared_resources')
      .select(`
        id,
        resource_id,
        member_id,
        shared_at,
        last_reminder_at,
        resources(title, type),
        members!inner(first_name, last_name, deleted_at)
      `)
      .eq('practitioner_id', authUser.id)
      .order('shared_at', { ascending: false })

    if (!shared) { setLoading(false); return }

    // Filter out soft-deleted members
    const activeShared = shared.filter((s: any) => !s.members?.deleted_at)

    // Fetch response statuses for these shares
    const resourceMemberPairs = activeShared.map(s => ({ resource_id: s.resource_id, member_id: s.member_id }))
    const { data: responses } = await supabase
      .from('resource_responses')
      .select('resource_id, member_id, status, submitted_at')
      .eq('practitioner_id', authUser.id)

    const responseMap = new Map<string, { status: string; submitted_at: string | null }>()
    responses?.forEach(r => {
      responseMap.set(`${r.resource_id}|${r.member_id}`, { status: r.status, submitted_at: r.submitted_at })
    })

    const enriched: SharedRecord[] = activeShared.map((s: any) => {
      const resp = responseMap.get(`${s.resource_id}|${s.member_id}`)
      return {
        id: s.id,
        resource_id: s.resource_id,
        member_id: s.member_id,
        shared_at: s.shared_at,
        resource_title: s.resources?.title || 'Untitled',
        resource_type: s.resources?.type || 'worksheet',
        member_first_name: s.members?.first_name || '',
        member_last_name: s.members?.last_name || '',
        response_status: resp?.status || null,
        response_submitted_at: resp?.submitted_at || null,
        last_reminder_at: s.last_reminder_at || null,
      }
    })

    setRecords(enriched)
    setLoading(false)
  }

  const [expandedResource, setExpandedResource] = useState<string | null>(null)
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'person' | 'resource'>('person')

  // Unique members for filter dropdown
  const uniqueMembers = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>()
    records.forEach(r => {
      if (!seen.has(r.member_id)) {
        seen.set(r.member_id, { id: r.member_id, name: `${r.member_first_name} ${r.member_last_name}` })
      }
    })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const q = search.toLowerCase()
        if (!r.resource_title.toLowerCase().includes(q) &&
            !`${r.member_first_name} ${r.member_last_name}`.toLowerCase().includes(q)) return false
      }
      if (memberFilter.length > 0 && !memberFilter.includes(r.member_id)) return false
      if (statusFilter === 'pending' && r.response_status) return false
      if (statusFilter === 'draft' && r.response_status !== 'draft') return false
      if (statusFilter === 'submitted' && r.response_status !== 'submitted') return false
      if (statusFilter === 'reviewed' && r.response_status !== 'reviewed') return false
      return true
    })
  }, [records, search, statusFilter, memberFilter])

  // Group filtered records by resource_id
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, { title: string; type: string; members: SharedRecord[] }>()
    filteredRecords.forEach(r => {
      if (!groups.has(r.resource_id)) {
        groups.set(r.resource_id, { title: r.resource_title, type: r.resource_type, members: [] })
      }
      groups.get(r.resource_id)!.members.push(r)
    })
    return Array.from(groups.entries()).map(([id, group]) => ({ resource_id: id, ...group }))
  }, [filteredRecords])

  // Group by person
  const groupedByPerson = useMemo(() => {
    const groups = new Map<string, { name: string; initials: string; resources: SharedRecord[] }>()
    filteredRecords.forEach(r => {
      if (!groups.has(r.member_id)) {
        groups.set(r.member_id, {
          name: `${r.member_first_name} ${r.member_last_name}`,
          initials: `${r.member_first_name[0] || ''}${r.member_last_name[0] || ''}`.toUpperCase(),
          resources: [],
        })
      }
      groups.get(r.member_id)!.resources.push(r)
    })
    return Array.from(groups.entries()).map(([id, g]) => ({ member_id: id, ...g }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredRecords])

  const statusCounts = useMemo(() => {
    const counts = { all: records.length, pending: 0, draft: 0, submitted: 0, reviewed: 0 }
    records.forEach(r => {
      if (!r.response_status) counts.pending++
      else if (r.response_status === 'draft') counts.draft++
      else if (r.response_status === 'submitted') counts.submitted++
      else if (r.response_status === 'reviewed') counts.reviewed++
    })
    return counts
  }, [records])

  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  const handleRemind = async (e: React.MouseEvent, record: SharedRecord) => {
    e.stopPropagation()
    setSendingReminder(record.id)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const practName = user?.full_name || 'Your practitioner'

      // Check if member has account
      const { data: memberData } = await supabase
        .from('members')
        .select('user_id, email')
        .eq('id', record.member_id)
        .single()

      if (memberData?.user_id) {
        await notifyResourceShared(supabase, {
          memberId: record.member_id,
          memberUserId: memberData.user_id,
          resourceId: record.resource_id,
          resourceTitle: record.resource_title,
          resourceType: record.resource_type,
          practitionerName: practName,
          memberEmail: memberData.email || undefined,
        })
      } else if (memberData?.email) {
        await sendResourceSharedEmail({
          memberEmail: memberData.email,
          resourceTitle: record.resource_title,
          resourceType: record.resource_type,
          practitionerName: practName,
          resourceId: record.resource_id,
        })
      }

      // Save reminder timestamp
      const now = new Date().toISOString()
      await supabase
        .from('member_shared_resources')
        .update({ last_reminder_at: now })
        .eq('id', record.id)

      // Update local state
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, last_reminder_at: now } : r))

      toast.success(locale === 'fr' ? 'Rappel envoyé' : 'Reminder sent')
    } catch {
      toast.error(locale === 'fr' ? 'Échec de l\'envoi' : 'Failed to send')
    }
    setSendingReminder(null)
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return { label: locale === 'fr' ? 'En attente' : 'Pending', bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock }
    if (status === 'submitted') return { label: locale === 'fr' ? 'Complété' : 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle2 }
    if (status === 'reviewed') return { label: locale === 'fr' ? 'Relu' : 'Reviewed', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Eye }
    if (status === 'draft') return { label: locale === 'fr' ? 'En cours' : 'In progress', bg: 'bg-blue-50', text: 'text-blue-500', icon: Clock }
    return { label: status, bg: 'bg-gray-100', text: 'text-gray-500', icon: Clock }
  }

  const typeLabels: Record<string, string> = {
    worksheet: locale === 'fr' ? 'Fiche' : 'Worksheet',
    exercise: locale === 'fr' ? 'Exercice' : 'Exercise',
    assessment: locale === 'fr' ? 'Évaluation' : 'Assessment',
    psychoeducation: locale === 'fr' ? 'Psychoéducation' : 'Psychoeducation',
    table: locale === 'fr' ? 'Tableau' : 'Table',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="library" />
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Share2 className="w-4 h-4" strokeWidth={2.5} />
              <span>{locale === 'fr' ? 'Partagés' : 'Shared'}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* Tabs Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <Link href="/resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <span>{locale === 'fr' ? 'Mes ressources' : 'My Resources'}</span>
                </div>
              </Link>
              {/* Explore tab — hidden for now */}
              <Link href="/shared-resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium text-sm">
                  <Share2 className="w-4 h-4" />
                  <span>{locale === 'fr' ? 'Partagés' : 'Shared'}</span>
                </div>
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              {records.length} {locale === 'fr' ? 'ressources partagées' : 'resources shared'}
            </div>
          </div>

          {/* Status filters — top row */}
          <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden mb-4 w-fit">
            {([
              { key: 'all' as const, label: locale === 'fr' ? 'Tous' : 'All', dot: null },
              { key: 'pending' as const, label: locale === 'fr' ? 'En attente' : 'Pending', dot: 'bg-amber-400' },
              { key: 'draft' as const, label: locale === 'fr' ? 'En cours' : 'In progress', dot: 'bg-blue-400' },
              { key: 'submitted' as const, label: locale === 'fr' ? 'Complété' : 'Completed', dot: 'bg-emerald-400' },
              { key: 'reviewed' as const, label: locale === 'fr' ? 'Relu' : 'Reviewed', dot: 'bg-emerald-600' },
            ]).map((s, i) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                  i > 0 ? 'border-l border-gray-200' : ''
                } ${
                  statusFilter === s.key ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {s.dot && <span className={`w-2 h-2 rounded-full ${s.dot}`} />}
                {s.label}
                <span className="text-gray-400">{statusCounts[s.key]}</span>
              </button>
            ))}
          </div>

          {/* Search + view toggle — second row */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === 'fr' ? 'Rechercher par patient ou ressource...' : 'Search by patient or resource...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('person')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'person' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-3 h-3" />
                {locale === 'fr' ? 'Personne' : 'Person'}
              </button>
              <button
                onClick={() => setViewMode('resource')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'resource' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-3 h-3" />
                {locale === 'fr' ? 'Ressource' : 'Resource'}
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20">
              <Share2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {records.length === 0
                  ? (locale === 'fr' ? 'Aucune ressource partagée' : 'No resources shared yet')
                  : (locale === 'fr' ? 'Aucun résultat' : 'No results match your filters')}
              </p>
            </div>
          ) : viewMode === 'person' ? (
            /* ─── Person View ─── */
            <div className="space-y-2">
              {groupedByPerson.map((person) => {
                const isExpanded = expandedPerson === person.member_id
                return (
                  <div key={person.member_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedPerson(isExpanded ? null : person.member_id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                        {person.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-400">{person.resources.length} {locale === 'fr' ? 'ressource(s)' : 'resource(s)'}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {person.resources.map(record => {
                          const badge = getStatusBadge(record.response_status)
                          const daysAgo = Math.floor((Date.now() - new Date(record.shared_at).getTime()) / 86400000)
                          return (
                            <div key={record.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group">
                              <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                              <p className="flex-1 text-sm text-gray-700 truncate min-w-0">{record.resource_title}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                              <span className="text-[11px] text-gray-400 shrink-0 w-44 text-right">
                                {locale === 'fr' ? 'Envoyé le' : 'Sent'} {new Date(record.shared_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                                {' '}({locale === 'fr' ? `il y a ${daysAgo} jours` : `${daysAgo}d ago`})
                              </span>
                              <Link href={`/resources/${record.resource_id}`} onClick={e => e.stopPropagation()}>
                                <button className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-1 shrink-0">
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                              </Link>
                              <div className="relative shrink-0">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setExpandedResource(expandedResource === record.id ? null : record.id) }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {expandedResource === record.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setExpandedResource(null)} />
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                                      {(() => {
                                        const lastReminder = record.last_reminder_at ? new Date(record.last_reminder_at) : null
                                        const canRemind = !record.response_status && (!lastReminder || (Date.now() - lastReminder.getTime()) / (60 * 60 * 1000) >= 24)
                                        return canRemind ? (
                                          <button
                                            onClick={(e) => { setExpandedResource(null); handleRemind(e, record) }}
                                            disabled={sendingReminder === record.id}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                          >
                                            <Bell className="w-3.5 h-3.5 text-amber-500" />
                                            {locale === 'fr' ? 'Rappeler' : 'Remind'}
                                          </button>
                                        ) : null
                                      })()}
                                      <button
                                        onClick={() => { setExpandedResource(null); router.push(`/members/${record.member_id}?tab=shared`) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        {locale === 'fr' ? 'Voir le patient' : 'View member'}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* ─── Resource View ─── */
            <div className="space-y-2">
              {groupedRecords.map((group) => {
                const isExpanded = expandedResource === group.resource_id
                const pendingCount = group.members.filter(m => !m.response_status).length
                const submittedCount = group.members.filter(m => m.response_status === 'submitted').length
                const reviewedCount = group.members.filter(m => m.response_status === 'reviewed').length

                return (
                  <div key={group.resource_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Group header */}
                    <button
                      onClick={() => setExpandedResource(isExpanded ? null : group.resource_id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                        <p className="text-xs text-gray-400">{typeLabels[group.type] || group.type}</p>
                      </div>

                      {/* Member avatars stack */}
                      <div className="flex items-center -space-x-2">
                        {group.members.slice(0, 5).map((m, i) => (
                          <div
                            key={m.id}
                            className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500"
                            title={`${m.member_first_name} ${m.member_last_name}`}
                          >
                            {m.member_first_name[0]}{m.member_last_name[0]}
                          </div>
                        ))}
                        {group.members.length > 5 && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                            +{group.members.length - 5}
                          </div>
                        )}
                      </div>

                      {/* Status summary pills */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {pendingCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600">
                            <Clock className="w-2.5 h-2.5" /> {pendingCount}
                          </span>
                        )}
                        {submittedCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {submittedCount}
                          </span>
                        )}
                        {reviewedCount > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600">
                            <Eye className="w-2.5 h-2.5" /> {reviewedCount}
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {group.members.length} {locale === 'fr' ? 'personnes' : 'people'}
                      </span>

                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded member list */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {group.members.map((record) => {
                          const badge = getStatusBadge(record.response_status)
                          const BadgeIcon = badge.icon
                          return (
                            <div
                              key={record.id}
                              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => router.push(`/members/${record.member_id}?tab=shared`)}
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                {record.member_first_name[0]}{record.member_last_name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                  {record.member_first_name} {record.member_last_name}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(record.shared_at).toLocaleDateString(
                                  locale === 'fr' ? 'fr-FR' : 'en-US',
                                  { day: 'numeric', month: 'short' }
                                )}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </span>
                              {!record.response_status && (() => {
                                const days = Math.floor((Date.now() - new Date(record.shared_at).getTime()) / 86400000)
                                return days >= 2 ? (
                                  <span className="text-[10px] text-amber-500 font-medium">
                                    {days}{locale === 'fr' ? 'j' : 'd'}
                                  </span>
                                ) : null
                              })()}
                              {!record.response_status && (() => {
                                const lastReminder = record.last_reminder_at ? new Date(record.last_reminder_at) : null
                                const hoursSince = lastReminder ? (Date.now() - lastReminder.getTime()) / (60 * 60 * 1000) : 999
                                const canRemind = hoursSince >= 24

                                if (lastReminder && !canRemind) {
                                  return (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                      <Bell className="w-2.5 h-2.5" />
                                      {locale === 'fr' ? 'Rappel envoyé le' : 'Reminded'} {lastReminder.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )
                                }

                                return (
                                  <button
                                    onClick={(e) => handleRemind(e, record)}
                                    disabled={sendingReminder === record.id}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex items-center gap-1"
                                  >
                                    {sendingReminder === record.id ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <Bell className="w-2.5 h-2.5" />
                                    )}
                                    {lastReminder
                                      ? (locale === 'fr' ? 'Re-rappeler' : 'Remind again')
                                      : (locale === 'fr' ? 'Rappel' : 'Remind')}
                                  </button>
                                )
                              })()}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
