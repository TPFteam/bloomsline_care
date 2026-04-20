'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { analytics } from '@/lib/analytics/events'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Mail,
  Edit,
  Trash2,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  Calendar,
  Phone,
  X,
  Save,
  FileText,
  Share2,
  Upload,
  Check,
  AlertCircle,
  Download,
  UserPlus,
  Send,
  Lock,
  ChevronDown,
  Heart,
  CheckSquare,
  Square,
  SlidersHorizontal,
} from 'lucide-react'
import { MaskedContact } from '@/components/ui/masked-contact'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import type { User } from '@/types/user'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { TutorialVideo } from '@/components/ui/tutorial-video'
import { EditMemberModal } from '@/components/members/EditMemberModal'
import type { Member, MemberFilter, MemberHubStats, Session } from '@/types/member'
import { getMemberFullName, getMemberInitials } from '@/types/member'
import type { MemberGroup } from '@/types/member-group'
import { FeedbackButton } from '@/components/feedback-button'

// Import row type for CSV bulk import
type ImportRow = {
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  is_minor?: boolean
  valid: boolean
  error?: string
}

// Known field names for smart column detection (supports EN/FR/ES headers)
const FIELD_PATTERNS: Record<string, RegExp> = {
  first_name: /^(first.?name|prénom|prenom|nombre|given.?name|firstname)$/i,
  last_name: /^(last.?name|nom|apellido|surname|family.?name|lastname)$/i,
  email: /^(e?.?mail|courriel|correo)$/i,
  phone: /^(phone|tel|téléphone|telephone|telefono|mobile|cell)$/i,
  date_of_birth: /^(date.?of.?birth|dob|birth.?date|date.?naissance|date.?de.?naissance|fecha.?nacimiento|birthday)$/i,
  is_minor: /^(is.?minor|minor|mineur|menor)$/i,
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Normalize various date formats to YYYY-MM-DD
const normalizeDate = (input: string): string | null => {
  const trimmed = input.trim()
  if (!trimmed) return null
  // Already YYYY-MM-DD
  if (DATE_REGEX.test(trimmed)) {
    const d = new Date(trimmed)
    return isNaN(d.getTime()) ? null : trimmed
  }
  // DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = trimmed.split(/[/.\-]/)
  if (parts.length === 3) {
    let day: number, month: number, year: number
    if (parts[2].length === 4) {
      // DD/MM/YYYY or MM/DD/YYYY
      year = parseInt(parts[2])
      const a = parseInt(parts[0])
      const b = parseInt(parts[1])
      // If first part > 12, it must be day (DD/MM/YYYY)
      if (a > 12) { day = a; month = b }
      // If second part > 12, it must be day (MM/DD/YYYY)
      else if (b > 12) { month = a; day = b }
      // Ambiguous — assume DD/MM/YYYY (more common internationally)
      else { day = a; month = b }
    } else if (parts[0].length === 4) {
      // YYYY/MM/DD
      year = parseInt(parts[0])
      month = parseInt(parts[1])
      day = parseInt(parts[2])
    } else {
      return null
    }
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null
    const str = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : str
  }
  return null
}

// Helper function for relative time
function getRelativeTime(dateString: string, locale: 'en' | 'fr' | 'es'): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffDays === 0) {
    return locale === 'fr' ? "Aujourd'hui" : 'Today'
  } else if (diffDays === 1) {
    return locale === 'fr' ? 'Hier' : 'Yesterday'
  } else if (diffDays < 7) {
    return locale === 'fr' ? `Il y a ${diffDays} jours` : `${diffDays} days ago`
  } else if (diffWeeks === 1) {
    return locale === 'fr' ? 'Il y a 1 semaine' : '1 week ago'
  } else if (diffWeeks < 4) {
    return locale === 'fr' ? `Il y a ${diffWeeks} semaines` : `${diffWeeks} weeks ago`
  } else if (diffMonths === 1) {
    return locale === 'fr' ? 'Il y a 1 mois' : '1 month ago'
  } else if (diffMonths < 12) {
    return locale === 'fr' ? `Il y a ${diffMonths} mois` : `${diffMonths} months ago`
  } else if (diffYears === 1) {
    return locale === 'fr' ? 'Il y a 1 an' : '1 year ago'
  } else {
    return locale === 'fr' ? `Il y a ${diffYears} ans` : `${diffYears} years ago`
  }
}

export default function MembersPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Auto-open add modal if ?add=true
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
      // Clean the URL
      router.replace('/members', { scroll: false })
    }
  }, [searchParams, router])

  const [members, setMembers] = useState<Member[]>([])
  const [nextSessions, setNextSessions] = useState<Record<string, Session | null>>({})
  const [lastSharedResources, setLastSharedResources] = useState<Record<string, { title: string; type: string; sharedAt: string } | null>>({})
  const [pendingWorksheets, setPendingWorksheets] = useState<Record<string, { title: string; daysPending: number } | null>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MemberFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterInvited, setFilterInvited] = useState<'all' | 'invited' | 'not_invited'>('all')
  const [filterAppStatus, setFilterAppStatus] = useState<'all' | 'joined' | 'not_joined'>('all')
  const [filterSessions, setFilterSessions] = useState<'all' | 'upcoming' | 'had' | 'never'>('all')
  const [filterPending, setFilterPending] = useState<'all' | 'pending' | 'none'>('all')
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
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] as string[] })
  const [sendInvite, setSendInvite] = useState(true)
  const [saving, setSaving] = useState(false)

  // Groups
  const [memberGroups, setMemberGroups] = useState<MemberGroup[]>([])
  const [showGroupsView, setShowGroupsView] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<MemberGroup | null>(null)
  const [groupForm, setGroupForm] = useState({ name: '', color: 'blue', memberIds: [] as string[] })
  const [savingGroup, setSavingGroup] = useState(false)
  const [groupSearchQuery, setGroupSearchQuery] = useState('')

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [prospects, setProspects] = useState<{ client_name: string; client_email: string; client_phone: string | null; session_type: string; start_time: string; status: string; id: string }[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteProspect, setDeleteProspect] = useState<{ id: string; email: string; name: string } | null>(null)
  const [convertConfirm, setConvertConfirm] = useState<{ id: string; name: string } | null>(null)
  const [editMemberId, setEditMemberId] = useState<string | null>(null)
  const [inviteConfirmMember, setInviteConfirmMember] = useState<Member | null>(null)
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload')
  const [importMode, setImportMode] = useState<'paste' | 'csv'>('paste')
  const [pasteText, setPasteText] = useState('')
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [bulkImportSupportOpen, setBulkImportSupportOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        .is('deleted_at', null)
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

      // Fetch next scheduled sessions and last shared resources for all members
      if (data && data.length > 0) {
        const memberIds = data.map(m => m.id)
        const now = new Date().toISOString()

        // Fetch next sessions
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .in('member_id', memberIds)
          .eq('status', 'scheduled')
          .gte('scheduled_at', now)
          .order('scheduled_at', { ascending: true })

        const sessionsMap: Record<string, Session | null> = {}
        memberIds.forEach(id => { sessionsMap[id] = null })

        sessions?.forEach(session => {
          if (!sessionsMap[session.member_id]) {
            sessionsMap[session.member_id] = session as Session
          }
        })

        setNextSessions(sessionsMap)

        // Fetch last shared resource for each member
        const { data: sharedResources } = await supabase
          .from('member_shared_resources')
          .select(`
            member_id,
            resource_id,
            shared_at,
            viewed_at,
            resource:resources(title, type)
          `)
          .in('member_id', memberIds)
          .order('shared_at', { ascending: false })

        const sharedMap: Record<string, { title: string; type: string; sharedAt: string } | null> = {}
        memberIds.forEach(id => { sharedMap[id] = null })

        sharedResources?.forEach((share: { member_id: string; resource_id: string; shared_at: string; resource: { title: string; type: string }[] | { title: string; type: string } | null }) => {
          if (!sharedMap[share.member_id] && share.resource) {
            const resource = Array.isArray(share.resource) ? share.resource[0] : share.resource
            if (resource) {
              sharedMap[share.member_id] = { title: resource.title, type: resource.type, sharedAt: share.shared_at }
            }
          }
        })

        setLastSharedResources(sharedMap)

        // Check for pending worksheets — shared but no completed submission after 2+ days
        const { data: submissions } = await supabase
          .from('resource_submissions')
          .select('member_id, resource_id, status')
          .eq('practitioner_id', authUser.id)
          .neq('status', 'draft')

        const submittedSet = new Set(
          (submissions || []).map((s: { member_id: string; resource_id: string }) => `${s.member_id}_${s.resource_id}`)
        )

        const pendingMap: Record<string, { title: string; daysPending: number } | null> = {}
        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000

        sharedResources?.forEach((share: any) => {
          if (pendingMap[share.member_id]) return // already found one
          if (share.viewed_at) return // already viewed/read
          const sharedTime = new Date(share.shared_at).getTime()
          if (sharedTime > twoDaysAgo) return // shared less than 2 days ago
          const key = `${share.member_id}_${share.resource_id}`
          if (submittedSet.has(key)) return // already submitted
          const resource = Array.isArray(share.resource) ? share.resource[0] : share.resource
          if (resource) {
            const daysPending = Math.floor((Date.now() - sharedTime) / (24 * 60 * 60 * 1000))
            pendingMap[share.member_id] = { title: resource.title, daysPending }
          }
        })
        setPendingWorksheets(pendingMap)
      }

      // Fetch member groups
      const { data: groups } = await supabase
        .from('member_groups')
        .select('*')
        .eq('practitioner_id', authUser.id)
        .order('name', { ascending: true })

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id)
        const { data: groupMembers } = await supabase
          .from('member_group_members')
          .select('group_id, member_id')
          .in('group_id', groupIds)

        const membersByGroup: Record<string, string[]> = {}
        groupMembers?.forEach((gm: { group_id: string; member_id: string }) => {
          if (!membersByGroup[gm.group_id]) membersByGroup[gm.group_id] = []
          membersByGroup[gm.group_id].push(gm.member_id)
        })

        setMemberGroups(groups.map(g => ({
          id: g.id,
          practitioner_id: g.practitioner_id,
          name: g.name,
          color: g.color,
          created_at: g.created_at,
          updated_at: g.updated_at,
          member_count: membersByGroup[g.id]?.length || 0,
          member_ids: membersByGroup[g.id] || [],
        })))
      }

      // Fetch prospects — bookings with no member_id and email not matching ANY member (including prospects)
      const memberEmails = new Set((data || []).map(m => m.email?.toLowerCase()).filter(Boolean))
      const { data: guestBookings } = await supabase
        .from('bookings')
        .select('id, client_name, client_email, client_phone, session_type, start_time, status')
        .eq('practitioner_id', authUser.id)
        .is('member_id', null)
        .in('status', ['pending', 'confirmed', 'completed'])
        .order('start_time', { ascending: false })

      if (guestBookings) {
        let needsRefresh = false
        // Auto-convert legacy booking prospects to prospect members
        for (const b of guestBookings) {
          const email = b.client_email.toLowerCase().trim()
          if (!memberEmails.has(email)) {
            // Double-check DB to prevent duplicates (exclude soft-deleted)
            const { data: alreadyExists } = await supabase
              .from('members')
              .select('id')
              .eq('practitioner_id', authUser.id)
              .ilike('email', email)
              .is('deleted_at', null)
              .maybeSingle()

            if (alreadyExists) {
              // Member exists but wasn't in our initial fetch — just link bookings
              await supabase
                .from('bookings')
                .update({ member_id: alreadyExists.id })
                .eq('client_email', b.client_email)
                .eq('practitioner_id', authUser.id)
                .is('member_id', null)
              memberEmails.add(email)
              needsRefresh = true
              continue
            }

            const nameParts = b.client_name.trim().split(' ')
            const { data: newMember } = await supabase
              .from('members')
              .insert({
                practitioner_id: authUser.id,
                first_name: nameParts[0] || b.client_name,
                last_name: nameParts.slice(1).join(' ') || '',
                email: b.client_email.trim(),
                phone: b.client_phone || null,
                status: 'prospect',
                engagement_level: 'medium',
              })
              .select('id')
              .maybeSingle()

            if (newMember) {
              await supabase
                .from('bookings')
                .update({ member_id: newMember.id })
                .eq('client_email', b.client_email)
                .eq('practitioner_id', authUser.id)
                .is('member_id', null)
              memberEmails.add(email)
              needsRefresh = true
            }
          }
        }
        setProspects([])
        if (needsRefresh) {
          const { data: refreshed } = await supabase
            .from('members')
            .select('*')
            .eq('practitioner_id', authUser.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
          if (refreshed) {
            setMembers(refreshed)
            calculateStats(refreshed)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error(t.members.errors.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (membersList: Member[]) => {
    const nonProspects = membersList.filter(m => m.status !== 'prospect')
    const active = membersList.filter(m => m.status === 'active').length
    const inactive = membersList.filter(m => m.status === 'inactive').length

    const engagementValues = { low: 1, medium: 2, high: 3 }
    const totalEngagement = nonProspects.reduce((sum, m) => sum + engagementValues[m.engagement_level], 0)
    const avgEngagement = nonProspects.length > 0 ? Math.round((totalEngagement / nonProspects.length / 3) * 100) : 0

    setStats({
      total_members: nonProspects.length,
      active_members: active,
      inactive_members: inactive,
      pending_members: 0,
      sessions_this_week: 0,
      average_engagement: avgEngagement,
    })
  }

  const handleDeleteMember = async (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDeleteMember = async () => {
    if (!deleteConfirmId) return
    const id = deleteConfirmId
    setDeleteConfirmId(null)

    try {
      // Use API route for all deletions — handles bookings cleanup with admin client
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/members/${id}/delete-prospect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) throw new Error('Delete failed')

      const updated = members.filter(m => m.id !== id)
      setMembers(updated)
      calculateStats(updated)
      toast.success(t.members.success.memberDeleted)
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error(t.members.errors.deleteFailed)
    }
  }

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(paginatedMembers.map(m => m.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const viewModeBeforeSelect = useRef<'grid' | 'list'>('grid')

  const enterSelectionMode = () => {
    viewModeBeforeSelect.current = viewMode
    setSelectionMode(true)
    setViewMode('list')
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setViewMode(viewModeBeforeSelect.current)
  }

  // Bulk delete
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    setBulkDeleteConfirm(true)
  }

  const executeBulkDelete = async () => {
    setBulkDeleteConfirm(false)
    const count = selectedIds.size
    try {
      const { data: { session } } = await supabase.auth.getSession()
      for (const id of selectedIds) {
        await fetch(`/api/members/${id}/delete-prospect`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
      }
      const updated = members.filter(m => !selectedIds.has(m.id))
      setMembers(updated)
      calculateStats(updated)
      exitSelectionMode()
      toast.success(locale === 'fr' ? `${count} membre(s) supprimé(s)` : `${count} member(s) deleted`)
    } catch {
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Failed to delete')
    }
  }

  // Bulk invite with progress
  const [bulkInviteProgress, setBulkInviteProgress] = useState<{ total: number; sent: number; skipped: number } | null>(null)
  const [bulkInviteConfirm, setBulkInviteConfirm] = useState<{ toInvite: number; alreadyInvited: number } | null>(null)
  const [bulkResendInvites, setBulkResendInvites] = useState(false)

  const handleBulkInvite = () => {
    if (selectedIds.size === 0) return
    const selectedMembers = members.filter(m => selectedIds.has(m.id) && m.email)
    if (selectedMembers.length === 0) {
      toast.error(locale === 'fr' ? 'Aucun membre avec email' : 'No members with email')
      return
    }

    const toInvite = selectedMembers.filter(m => !(m as any).invitation_sent)
    const alreadyInvited = selectedMembers.length - toInvite.length

    setBulkResendInvites(false)
    setBulkInviteConfirm({ toInvite: toInvite.length, alreadyInvited })
  }

  const executeBulkInvite = async () => {
    setBulkInviteConfirm(null)
    const selectedMembers = bulkResendInvites
      ? members.filter(m => selectedIds.has(m.id) && m.email)
      : members.filter(m => selectedIds.has(m.id) && m.email && !(m as any).invitation_sent)
    const alreadyInvited = bulkResendInvites ? 0 : members.filter(m => selectedIds.has(m.id) && (m as any).invitation_sent).length

    setBulkInviteProgress({ total: selectedMembers.length, sent: 0, skipped: alreadyInvited })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      let sent = 0
      for (let i = 0; i < selectedMembers.length; i++) {
        const member = selectedMembers[i]
        try {
          const res = await fetch('/api/members/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ memberId: member.id, email: member.email }),
          })
          if (res.ok) {
            sent++
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, invitation_sent: true } as any : m))
          }
        } catch { /* continue */ }
        setBulkInviteProgress({ total: selectedMembers.length, sent: i + 1, skipped: alreadyInvited })
      }
      setBulkInviteProgress(null)
      exitSelectionMode()
      toast.success(locale === 'fr' ? `${sent} invitation(s) envoyée(s)` : `${sent} invitation(s) sent`)
    } catch {
      setBulkInviteProgress(null)
      toast.error(locale === 'fr' ? 'Erreur lors de l\'envoi' : 'Failed to send invitations')
    }
  }

  // Bulk status change
  const handleBulkStatusChange = async (newStatus: 'active' | 'inactive') => {
    if (selectedIds.size === 0) return
    try {
      for (const id of selectedIds) {
        await supabase.from('members').update({ status: newStatus }).eq('id', id)
      }
      const updated = members.map(m => selectedIds.has(m.id) ? { ...m, status: newStatus } : m)
      setMembers(updated)
      calculateStats(updated)
      exitSelectionMode()
      toast.success(locale === 'fr' ? `Statut mis à jour` : `Status updated`)
    } catch {
      toast.error(locale === 'fr' ? 'Erreur' : 'Failed')
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      // Update local state
      const updatedMembers = members.map(m =>
        m.id === id ? { ...m, status: newStatus } : m
      )
      setMembers(updatedMembers)
      calculateStats(updatedMembers)

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

      const emailToAdd = newMember.email.trim().toLowerCase()

      // Check if a member with this email already exists (exclude soft-deleted)
      const { data: existingMembers } = await supabase
        .from('members')
        .select('id, practitioner_id, first_name, last_name, user_id')
        .eq('email', emailToAdd)
        .is('deleted_at', null)

      if (existingMembers && existingMembers.length > 0) {
        // Check if already linked to this practitioner
        const alreadyYours = existingMembers.find(m => m.practitioner_id === authUser.id)
        if (alreadyYours) {
          toast.error(locale === 'fr'
            ? 'Cette personne est déjà dans votre liste'
            : 'This person is already in your list')
          setSaving(false)
          return
        }

        // Check if there's an orphan record (no practitioner) - link it instead of creating new
        const orphanRecord = existingMembers.find(m => !m.practitioner_id)
        if (orphanRecord) {
          const { data, error } = await supabase
            .from('members')
            .update({
              practitioner_id: authUser.id,
              first_name: newMember.firstName.trim(),
              last_name: newMember.lastName.trim(),
              phone: newMember.phone.trim() || null,
              status: 'active' as const,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orphanRecord.id)
            .select()
            .single()

          if (error) throw error

          // Add to groups if any selected
          if (newMember.groupIds.length > 0 && data.id) {
            await supabase.from('member_group_members').insert(
              newMember.groupIds.map(gid => ({ group_id: gid, member_id: data.id }))
            )
          }

          // Add to list and recalculate stats
          const updatedMembers = [data, ...members]
          setMembers(updatedMembers)
          calculateStats(updatedMembers)

          setNewMember({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] })
          setShowAddModal(false)
          toast.success(t.members.success.memberCreated)
          fetchMembers() // refresh group counts
          setSaving(false)
          return
        }
      }

      // If this email already belongs to a signed-up user, link user_id immediately
      let existingUserId: string | null = null
      if (existingMembers && existingMembers.length > 0) {
        const linked = existingMembers.find((m: any) => m.user_id)
        if (linked) existingUserId = (linked as any).user_id
      }

      const memberData: Record<string, any> = {
        practitioner_id: authUser.id,
        first_name: newMember.firstName.trim(),
        last_name: newMember.lastName.trim(),
        email: emailToAdd,
        phone: newMember.phone.trim() || null,
        status: 'active' as const,
        engagement_level: 'medium' as const,
        is_minor: newMember.isMinor,
      }
      if (existingUserId) memberData.user_id = existingUserId

      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // Link any existing bookings with matching email to this new member
      if (data.id && emailToAdd) {
        await supabase
          .from('bookings')
          .update({ member_id: data.id })
          .eq('client_email', emailToAdd)
          .eq('practitioner_id', authUser.id)
          .is('member_id', null)
      }

      // Add to groups if any selected
      if (newMember.groupIds.length > 0 && data.id) {
        await supabase.from('member_group_members').insert(
          newMember.groupIds.map(gid => ({ group_id: gid, member_id: data.id }))
        )
      }

      // Add to list, recalculate, and remove from prospects
      const updatedMembers = [data, ...members]
      setMembers(updatedMembers)
      calculateStats(updatedMembers)
      setProspects(prev => prev.filter(p => p.client_email.toLowerCase() !== emailToAdd.toLowerCase()))

      // Reset form and close modal
      setNewMember({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] })
      setShowAddModal(false)
      toast.success(t.members.success.memberCreated)
      analytics.memberAdded({ total_count: updatedMembers.length })

      // Send invitation email if toggle is on
      if (sendInvite && data.id && emailToAdd) {
        try {
          const { data: practitionerProfile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .single()

          await supabase.functions.invoke('send-member-welcome', {
            body: {
              memberName: newMember.firstName.trim(),
              memberLastName: newMember.lastName.trim(),
              memberEmail: emailToAdd,
              practitionerName: practitionerProfile?.full_name || 'Your practitioner',
              practitionerAvatarUrl: practitionerProfile?.avatar_url || null,
              locale,
            },
          })

          await supabase
            .from('members')
            .update({ invitation_sent: true, invitation_sent_at: new Date().toISOString() })
            .eq('id', data.id)
        } catch (inviteErr) {
          console.error('Error sending invitation:', inviteErr)
        }
      }

      fetchMembers() // refresh group counts
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error(error instanceof Error ? error.message : t.members.errors.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  // CSV Import Helpers
  const downloadTemplate = () => {
    const isFr = locale === 'fr'
    const headers = isFr
      ? 'prénom,nom,email,téléphone,date_de_naissance,mineur'
      : 'first_name,last_name,email,phone,date_of_birth,is_minor'
    const example = isFr
      ? 'Marie,Dupont,marie@exemple.com,+33 6 12 34 56 78,1990-01-15,false'
      : 'Jane,Doe,jane@example.com,+1 555-123-4567,1990-01-15,false'
    const filename = isFr ? 'modele_import_clients.csv' : 'members_template.csv'
    const blob = new Blob([headers + '\n' + example + '\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Detect delimiter: tab, comma, or semicolon
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || ''
    const tabCount = (firstLine.match(/\t/g) || []).length
    const commaCount = (firstLine.match(/,/g) || []).length
    const semiCount = (firstLine.match(/;/g) || []).length
    if (tabCount >= commaCount && tabCount >= semiCount) return '\t'
    if (semiCount > commaCount) return ';'
    return ','
  }

  const parseDelimited = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }
    const delimiter = detectDelimiter(text)

    const splitLine = (line: string): string[] => {
      if (delimiter === '\t') return line.split('\t').map(c => c.trim())
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headerRow = splitLine(lines[0])
    // Check if the first row looks like headers (contains known field patterns or non-email text)
    const looksLikeHeaders = headerRow.some(h =>
      Object.values(FIELD_PATTERNS).some(pattern => pattern.test(h))
    ) || !headerRow.some(h => EMAIL_REGEX.test(h))

    if (looksLikeHeaders) {
      return {
        headers: headerRow.map(h => h.toLowerCase()),
        rows: lines.slice(1).map(splitLine),
      }
    }
    // No headers detected — return empty headers
    return {
      headers: Array.from({ length: headerRow.length }, (_, i) => `column_${i + 1}`),
      rows: lines.map(splitLine),
    }
  }

  // Auto-detect column mapping from headers
  const autoMapColumns = (headers: string[]): Record<number, string> => {
    const mapping: Record<number, string> = {}
    const usedFields = new Set<string>()

    headers.forEach((header, idx) => {
      for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
        if (!usedFields.has(field) && pattern.test(header)) {
          mapping[idx] = field
          usedFields.add(field)
          break
        }
      }
    })

    // If no headers matched, try to guess by content heuristics on first few rows
    return mapping
  }

  const applyMappingAndValidate = (headers: string[], rows: string[][], mapping: Record<number, string>): ImportRow[] => {
    const fieldToIdx: Record<string, number> = {}
    Object.entries(mapping).forEach(([idx, field]) => {
      if (field && field !== 'skip') fieldToIdx[field] = parseInt(idx)
    })

    const seenEmails = new Set<string>()

    return rows.map(row => {
      const firstName = fieldToIdx.first_name !== undefined ? (row[fieldToIdx.first_name] || '').trim() : ''
      const lastName = fieldToIdx.last_name !== undefined ? (row[fieldToIdx.last_name] || '').trim() : ''
      const email = fieldToIdx.email !== undefined ? (row[fieldToIdx.email] || '').trim().toLowerCase() : ''
      const phone = fieldToIdx.phone !== undefined ? (row[fieldToIdx.phone] || '').trim() : ''
      const dobRaw = fieldToIdx.date_of_birth !== undefined ? (row[fieldToIdx.date_of_birth] || '').trim() : ''
      const dob = dobRaw ? normalizeDate(dobRaw) : undefined
      const minorStr = fieldToIdx.is_minor !== undefined ? (row[fieldToIdx.is_minor] || '').trim().toLowerCase() : ''
      const isMinor = ['true', 'yes', 'oui', '1', 'vrai'].includes(minorStr)

      const base: ImportRow = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
        date_of_birth: dob || undefined,
        is_minor: isMinor,
        valid: true,
      }

      if (!firstName) return { ...base, valid: false, error: locale === 'fr' ? 'Prénom requis' : 'First name required' }
      if (!lastName) return { ...base, valid: false, error: locale === 'fr' ? 'Nom requis' : 'Last name required' }
      if (!email) return { ...base, valid: false, error: locale === 'fr' ? 'Email requis' : 'Email required' }
      if (!EMAIL_REGEX.test(email)) return { ...base, valid: false, error: locale === 'fr' ? 'Email invalide' : 'Invalid email' }
      if (seenEmails.has(email)) return { ...base, valid: false, error: locale === 'fr' ? 'Email en double' : 'Duplicate email' }
      if (dobRaw && !dob) return { ...base, valid: false, error: locale === 'fr' ? 'Date invalide' : 'Invalid date' }

      seenEmails.add(email)
      return base
    })
  }

  // Process parsed data — auto-map and go to mapping step or directly to preview
  const processImportData = (text: string) => {
    const { headers, rows } = parseDelimited(text)

    if (rows.length === 0) {
      toast.error(locale === 'fr' ? 'Aucune donnée trouvée' : 'No data found')
      return
    }
    if (rows.length > 50) {
      toast.error(locale === 'fr' ? `Maximum 50 lignes (${rows.length} trouvées)` : `Maximum 50 rows (${rows.length} found)`)
      return
    }

    const mapping = autoMapColumns(headers)
    setRawHeaders(headers)
    setRawRows(rows)
    setColumnMapping(mapping)

    // If we have the 3 required fields mapped, go directly to preview
    const mappedFields = new Set(Object.values(mapping))
    if (mappedFields.has('first_name') && mappedFields.has('last_name') && mappedFields.has('email')) {
      const validated = applyMappingAndValidate(headers, rows, mapping)
      setImportRows(validated)
      setImportStep('preview')
    } else {
      // Need user to map columns
      setImportStep('mapping')
    }
  }

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      toast.error(locale === 'fr' ? 'Veuillez coller vos données' : 'Please paste your data')
      return
    }
    processImportData(pasteText)
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv') && !file.name.endsWith('.txt')) {
      toast.error(locale === 'fr' ? 'Format accepté : CSV, TSV ou TXT' : 'Accepted formats: CSV, TSV, or TXT')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      processImportData(text)
    }
    reader.readAsText(file)
  }

  const handleMappingConfirm = () => {
    const mappedFields = new Set(Object.values(columnMapping))
    if (!mappedFields.has('first_name') || !mappedFields.has('last_name') || !mappedFields.has('email')) {
      toast.error(locale === 'fr' ? 'Veuillez associer Prénom, Nom et Email' : 'Please map First Name, Last Name and Email')
      return
    }
    const validated = applyMappingAndValidate(rawHeaders, rawRows, columnMapping)
    setImportRows(validated)
    setImportStep('preview')
  }

  const handleBulkImport = async () => {
    const validRows = importRows.filter(r => r.valid)
    if (validRows.length === 0) return

    setImporting(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        return
      }

      // Check for existing emails
      const emails = validRows.map(r => r.email)
      const { data: existing } = await supabase
        .from('members')
        .select('email')
        .eq('practitioner_id', authUser.id)
        .in('email', emails)

      const existingEmails = new Set((existing || []).map(e => e.email))
      const newRows = validRows.filter(r => !existingEmails.has(r.email))
      const skippedCount = validRows.length - newRows.length

      if (newRows.length > 0) {
        const insertData = newRows.map(row => ({
          practitioner_id: authUser.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone || null,
          date_of_birth: row.date_of_birth || null,
          status: 'active' as const,
          engagement_level: 'medium' as const,
          is_minor: row.is_minor || false,
        }))

        const { error } = await supabase
          .from('members')
          .insert(insertData)
          .select()

        if (error) throw error
      }

      setImportResult({ imported: newRows.length, skipped: skippedCount })
      setImportStep('result')

      // Refresh member list
      fetchMembers()
    } catch (error) {
      console.error('Error importing members:', error)
      toast.error(locale === 'fr' ? "Erreur lors de l'import" : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const dismissImportRow = (index: number) => {
    setImportRows(prev => prev.filter((_, i) => i !== index))
  }

  const updateImportRow = (index: number, field: keyof ImportRow, value: string | boolean) => {
    setImportRows(prev => {
      const updated = [...prev]
      const row = { ...updated[index], [field]: value }
      // Re-validate
      row.valid = true
      row.error = undefined
      if (!row.first_name) { row.valid = false; row.error = locale === 'fr' ? 'Prénom requis' : 'First name required' }
      else if (!row.last_name) { row.valid = false; row.error = locale === 'fr' ? 'Nom requis' : 'Last name required' }
      else if (!row.email) { row.valid = false; row.error = locale === 'fr' ? 'Email requis' : 'Email required' }
      else if (!EMAIL_REGEX.test(row.email)) { row.valid = false; row.error = locale === 'fr' ? 'Email invalide' : 'Invalid email' }
      else if (row.date_of_birth && !normalizeDate(row.date_of_birth)) { row.valid = false; row.error = locale === 'fr' ? 'Date invalide' : 'Invalid date' }
      updated[index] = row
      return updated
    })
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setImportStep('upload')
    setImportMode('paste')
    setPasteText('')
    setImportRows([])
    setImportResult(null)
    setRawHeaders([])
    setRawRows([])
    setColumnMapping({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Group CRUD
  const GROUP_COLORS = ['blue', 'emerald', 'purple', 'amber', 'red', 'pink', 'cyan']

  const openGroupModal = (group?: MemberGroup) => {
    if (group) {
      setEditingGroup(group)
      setGroupForm({ name: group.name, color: group.color, memberIds: group.member_ids || [] })
    } else {
      setEditingGroup(null)
      setGroupForm({ name: '', color: 'blue', memberIds: [] })
    }
    setGroupSearchQuery('')
    setShowGroupModal(true)
  }

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) return
    setSavingGroup(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      if (editingGroup) {
        // Update group
        const { error } = await supabase
          .from('member_groups')
          .update({ name: groupForm.name.trim(), color: groupForm.color })
          .eq('id', editingGroup.id)

        if (error) throw error

        // Sync members: delete all, re-insert
        await supabase
          .from('member_group_members')
          .delete()
          .eq('group_id', editingGroup.id)

        if (groupForm.memberIds.length > 0) {
          const { error: insertError } = await supabase
            .from('member_group_members')
            .insert(groupForm.memberIds.map(mid => ({ group_id: editingGroup.id, member_id: mid })))

          if (insertError) throw insertError
        }

        toast.success(locale === 'fr' ? 'Groupe mis à jour' : 'Group updated')
      } else {
        // Create group
        const { data: newGroup, error } = await supabase
          .from('member_groups')
          .insert({ practitioner_id: authUser.id, name: groupForm.name.trim(), color: groupForm.color })
          .select()
          .single()

        if (error) throw error

        if (groupForm.memberIds.length > 0) {
          const { error: insertError } = await supabase
            .from('member_group_members')
            .insert(groupForm.memberIds.map(mid => ({ group_id: newGroup.id, member_id: mid })))

          if (insertError) throw insertError
        }

        toast.success(locale === 'fr' ? 'Groupe créé' : 'Group created')
      }

      setShowGroupModal(false)
      fetchMembers()
    } catch (error) {
      console.error('Error saving group:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Failed to save group')
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(locale === 'fr' ? 'Supprimer ce groupe ?' : 'Delete this group?')) return

    try {
      const { error } = await supabase
        .from('member_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      setMemberGroups(memberGroups.filter(g => g.id !== groupId))
      toast.success(locale === 'fr' ? 'Groupe supprimé' : 'Group deleted')
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Failed to delete group')
    }
  }

  const toggleGroupMember = (memberId: string) => {
    setGroupForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId]
    }))
  }

  const filteredGroupMembers = members.filter(m => {
    if (!groupSearchQuery.trim()) return true
    const query = groupSearchQuery.toLowerCase()
    const fullName = getMemberFullName(m).toLowerCase()
    return fullName.includes(query) || (m.email?.toLowerCase() || '').includes(query)
  })

  const groupColorMap: Record<string, { bg: string; dot: string; text: string; chipBg: string }> = {
    blue: { bg: 'bg-blue-50', dot: 'bg-blue-500', text: 'text-blue-700', chipBg: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700', chipBg: 'bg-emerald-100' },
    purple: { bg: 'bg-purple-50', dot: 'bg-purple-500', text: 'text-purple-700', chipBg: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700', chipBg: 'bg-amber-100' },
    red: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700', chipBg: 'bg-red-100' },
    pink: { bg: 'bg-pink-50', dot: 'bg-pink-500', text: 'text-pink-700', chipBg: 'bg-pink-100' },
    cyan: { bg: 'bg-cyan-50', dot: 'bg-cyan-500', text: 'text-cyan-700', chipBg: 'bg-cyan-100' },
  }

  const filteredMembers = members.filter(member => {
    if (filter === 'new') return member.status === 'prospect'
    if (filter !== 'all' && member.status !== filter) return false
    if (filter === 'all' && member.status === 'prospect') return false // hide prospects from "All"

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = getMemberFullName(member).toLowerCase()
      const email = member.email?.toLowerCase() || ''
      const phone = member.phone?.toLowerCase() || ''

      if (!fullName.includes(query) && !email.includes(query) && !phone.includes(query)) {
        return false
      }
    }

    // Invitation filter
    if (filterInvited === 'invited' && !(member as any).invitation_sent) return false
    if (filterInvited === 'not_invited' && (member as any).invitation_sent) return false

    // App status filter
    if (filterAppStatus === 'joined' && !member.user_id) return false
    if (filterAppStatus === 'not_joined' && member.user_id) return false

    // Sessions filter
    if (filterSessions === 'upcoming' && !nextSessions[member.id]) return false
    if (filterSessions === 'had' && !member.last_session_at) return false
    if (filterSessions === 'never' && member.last_session_at) return false

    // Pending worksheet filter
    if (filterPending === 'pending' && !pendingWorksheets[member.id]) return false
    if (filterPending === 'none' && pendingWorksheets[member.id]) return false

    return true
  })

  // Pagination
  const MEMBERS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * MEMBERS_PER_PAGE,
    currentPage * MEMBERS_PER_PAGE
  )

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery, filterInvited, filterAppStatus, filterSessions, filterPending])

  const prospectMembers = members.filter(m => m.status === 'prospect')
  const filterOptions: { value: MemberFilter; label: string; count: number; accent?: boolean }[] = [
    { value: 'all', label: t.members.filters.all, count: stats.total_members },
    { value: 'active', label: t.members.filters.active, count: stats.active_members },
    { value: 'inactive', label: t.members.filters.inactive, count: stats.inactive_members },
    ...(prospectMembers.length > 0 || prospects.length > 0
      ? [{ value: 'new' as MemberFilter, label: locale === 'fr' ? 'Nouveaux' : 'New', count: prospectMembers.length + prospects.length, accent: true }]
      : []),
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
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Users className="w-4 h-4" strokeWidth={2.5} />
              <span>{locale === 'fr' ? 'Personnes suivies' : 'People'}</span>
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
              {/* Filter Dropdown + Groups */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={showGroupsView ? '__groups__' : filter}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '__groups__') {
                        setShowGroupsView(true)
                      } else {
                        setShowGroupsView(false)
                        setFilter(val as MemberFilter)
                      }
                    }}
                    className="appearance-none pl-4 pr-10 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    {filterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                    <option value="__groups__">
                      {locale === 'fr' ? 'Groupes' : locale === 'es' ? 'Grupos' : 'Groups'} ({memberGroups.length})
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
                </div>

                {/* Search — icon that expands */}
                <div className="flex items-center">
                  {searchOpen ? (
                    <motion.div
                      initial={{ width: 40, opacity: 0.5 }}
                      animate={{ width: 280, opacity: 1 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="relative"
                    >
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t.members.filters.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                        autoFocus
                        className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm"
                      />
                      <button
                        onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100) }}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Select Mode Toggle — icon */}
                <button
                  onClick={() => selectionMode ? exitSelectionMode() : enterSelectionMode()}
                  className={`p-2 rounded-xl border transition-colors ${
                    selectionMode
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title={selectionMode ? (locale === 'fr' ? 'Annuler' : 'Cancel') : (locale === 'fr' ? 'Sélectionner' : 'Select')}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                {/* Filter icon + popover */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl border transition-colors relative ${
                      filterInvited !== 'all' || filterAppStatus !== 'all' || filterSessions !== 'all' || filterPending !== 'all'
                        ? 'bg-teal-50 text-teal-600 border-teal-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    title={locale === 'fr' ? 'Filtres' : 'Filters'}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {(filterInvited !== 'all' || filterAppStatus !== 'all' || filterSessions !== 'all' || filterPending !== 'all') && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  {showFilters && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowFilters(false)} />
                      <div className="absolute top-full left-0 mt-2 z-40 bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-64 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{locale === 'fr' ? 'Filtres' : 'Filters'}</p>
                          {(filterInvited !== 'all' || filterAppStatus !== 'all' || filterSessions !== 'all' || filterPending !== 'all') && (
                            <button
                              onClick={() => { setFilterInvited('all'); setFilterAppStatus('all'); setFilterSessions('all'); setFilterPending('all') }}
                              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                            >
                              {locale === 'fr' ? 'Réinitialiser' : 'Reset'}
                            </button>
                          )}
                        </div>

                        {/* Invitation */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            {locale === 'fr' ? 'Invitation' : 'Invitation'}
                          </label>
                          <select
                            value={filterInvited}
                            onChange={(e) => setFilterInvited(e.target.value as any)}
                            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            <option value="all">{locale === 'fr' ? 'Tous' : 'All'}</option>
                            <option value="invited">{locale === 'fr' ? 'Invité' : 'Invited'}</option>
                            <option value="not_invited">{locale === 'fr' ? 'Non invité' : 'Not invited'}</option>
                          </select>
                        </div>

                        {/* App status */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            {locale === 'fr' ? 'Statut app' : 'App status'}
                          </label>
                          <select
                            value={filterAppStatus}
                            onChange={(e) => setFilterAppStatus(e.target.value as any)}
                            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            <option value="all">{locale === 'fr' ? 'Tous' : 'All'}</option>
                            <option value="joined">{locale === 'fr' ? 'Sur l\'app' : 'Joined'}</option>
                            <option value="not_joined">{locale === 'fr' ? 'Pas sur l\'app' : 'Not joined'}</option>
                          </select>
                        </div>

                        {/* Sessions */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            {locale === 'fr' ? 'Séances' : 'Sessions'}
                          </label>
                          <select
                            value={filterSessions}
                            onChange={(e) => setFilterSessions(e.target.value as any)}
                            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            <option value="all">{locale === 'fr' ? 'Tous' : 'All'}</option>
                            <option value="upcoming">{locale === 'fr' ? 'Séance à venir' : 'Upcoming session'}</option>
                            <option value="had">{locale === 'fr' ? 'A eu des séances' : 'Had sessions'}</option>
                            <option value="never">{locale === 'fr' ? 'Aucune séance' : 'Never'}</option>
                          </select>
                        </div>

                        {/* Pending worksheet */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            {locale === 'fr' ? 'Exercices en attente' : 'Pending worksheets'}
                          </label>
                          <select
                            value={filterPending}
                            onChange={(e) => setFilterPending(e.target.value as any)}
                            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            <option value="all">{locale === 'fr' ? 'Tous' : 'All'}</option>
                            <option value="pending">{locale === 'fr' ? 'En attente' : 'Has pending'}</option>
                            <option value="none">{locale === 'fr' ? 'Aucun' : 'None'}</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-3">
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

                {/* Import CSV Button */}
                {/* CSV import button — hidden for now, re-enable when needed */}
                {/* <Button
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  className="rounded-xl px-2.5 border-gray-200"
                  title={locale === 'fr' ? 'Importer CSV' : locale === 'es' ? 'Importar CSV' : 'Import CSV'}
                >
                  <Upload className="w-4 h-4" />
                </Button> */}

                {/* Add Member / Group Button */}
                <Button
                  onClick={() => showGroupsView ? openGroupModal() : setShowAddModal(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4"
                >
                  {showGroupsView ? <Plus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {showGroupsView
                    ? (locale === 'fr' ? 'Nouveau groupe' : locale === 'es' ? 'Nuevo grupo' : 'New Group')
                    : t.members.actions.addMember}
                </Button>

                <TutorialVideo
                  url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/Inviter%20un%20patient%20a%20une%20seance%20(google%20calendar%20synchronise).mov"
                  title={locale === 'fr' ? 'Inviter un patient à une séance (Google Calendar synchronisé)' : 'Invite a patient to a session (Google Calendar synced)'}
                  size="md"
                />
              </div>
            </div>
          </motion.div>

          {/* Groups View */}
          {showGroupsView ? (
            <div>
              {/* Info note: groups are private */}
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                <Lock className="w-3 h-3 flex-shrink-0" />
                {locale === 'fr'
                  ? 'Les groupes sont privés — uniquement visibles par vous pour organiser vos patients. Vos patients ne savent pas qu\'ils font partie d\'un groupe.'
                  : 'Groups are private — only visible to you for organizing your patients. Your patients don\'t know they\'re part of a group.'}
              </p>
              {memberGroups.length === 0 ? (
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
                      {locale === 'fr' ? 'Aucun groupe' : locale === 'es' ? 'Sin grupos' : 'No groups yet'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                      {locale === 'fr'
                        ? 'Créez des groupes pour partager des ressources en masse'
                        : locale === 'es'
                        ? 'Cree grupos para compartir recursos en masa'
                        : 'Create groups to share resources in bulk'}
                    </p>
                    <Button
                      onClick={() => openGroupModal()}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Créer un groupe' : locale === 'es' ? 'Crear grupo' : 'Create Group'}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                    {memberGroups.map((group, index) => {
                      const colors = groupColorMap[group.color] || groupColorMap.blue
                      const groupMembers = members.filter(m => group.member_ids?.includes(m.id))
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="group bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                              <h3 className="font-semibold text-gray-900 text-base">{group.name}</h3>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openGroupModal(group)}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Member count */}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.text} text-xs font-medium mb-4`}>
                            <Users className="w-3 h-3" />
                            {group.member_count || 0} {locale === 'fr' ? 'membres' : 'members'}
                          </div>

                          {/* Stacked avatar initials */}
                          <div className="flex items-center">
                            {groupMembers.slice(0, 5).map((m, i) => (
                              <div
                                key={m.id}
                                className={`w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-medium text-xs ${i > 0 ? '-ml-2' : ''}`}
                                title={getMemberFullName(m)}
                              >
                                {getMemberInitials(m)}
                              </div>
                            ))}
                            {groupMembers.length > 5 && (
                              <div className="-ml-2 w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 font-medium text-xs">
                                +{groupMembers.length - 5}
                              </div>
                            )}
                            {groupMembers.length === 0 && (
                              <span className="text-sm text-gray-400">
                                {locale === 'fr' ? 'Aucun membre' : 'No members'}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
          <>
          {/* Results Count */}
          <AnimatePresence>
            {(searchQuery || filter !== 'all') && members.length > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-gray-500 mb-4"
              >
                {filter === 'new'
                  ? <><span className="font-semibold text-gray-700">{prospects.length}</span> {locale === 'fr' ? 'nouveaux contacts' : 'new contacts'}</>
                  : <>{t.members.list.showing} <span className="font-semibold text-gray-700">{filteredMembers.length}</span> {t.members.list.of} {members.length} {t.members.list.members}</>
                }
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
          ) : filteredMembers.length === 0 && filter !== 'new' ? (
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
          ) : filter === 'new' ? (
            /* Prospect cards — prospect-status members + legacy booking prospects */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Prospect members (have member records) */}
              {paginatedMembers.map((member) => {
                const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                const nextSession = nextSessions[member.id]
                // Check bookings for session info if no session record
                const matchingBooking = !nextSession ? prospects.find(p => p.client_email.toLowerCase() === member.email?.toLowerCase()) : null
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push(`/members/${member.id}`)}
                    className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{member.first_name} {member.last_name}</h3>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-600 border border-teal-200">
                        {locale === 'fr' ? 'Nouveau' : 'New'}
                      </span>
                    </div>

                    {(nextSession || matchingBooking) && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {nextSession
                              ? (locale === 'fr' ? 'Prochaine séance' : 'Next session')
                              : new Date(matchingBooking!.start_time) > new Date()
                                ? (locale === 'fr' ? 'Prochaine séance' : 'Next session')
                                : (locale === 'fr' ? 'Dernière séance' : 'Last session')}
                          </span>
                          <span className="ml-auto text-gray-700 font-medium">
                            {new Date(nextSession?.scheduled_at || matchingBooking!.start_time).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {matchingBooking && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{matchingBooking.session_type}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setConvertConfirm({ id: member.id, name: `${member.first_name} ${member.last_name}` })
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        {locale === 'fr' ? 'Convertir en patient' : 'Convert to patient'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(member.id)
                        }}
                        className="py-2.5 px-3 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}

              {/* Legacy booking prospects (no member record yet) */}
              {prospects.map((prospect) => {
                const nameParts = prospect.client_name.split(' ')
                const firstName = nameParts[0] || ''
                const lastName = nameParts.slice(1).join(' ') || ''
                const initials = `${firstName[0] || ''}${lastName[0] || firstName[1] || ''}`.toUpperCase()
                const sessionDate = new Date(prospect.start_time)
                const isPast = sessionDate < new Date()

                return (
                  <motion.div
                    key={`prospect-${prospect.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={async () => {
                      // Find or create prospect member, then navigate
                      const { data: { user: authUser } } = await supabase.auth.getUser()
                      if (!authUser) return

                      // Check if member already exists for this email
                      const { data: existing } = await supabase
                        .from('members')
                        .select('id')
                        .eq('practitioner_id', authUser.id)
                        .ilike('email', prospect.client_email.trim())
                        .maybeSingle()

                      if (existing) {
                        router.push(`/members/${existing.id}`)
                        return
                      }

                      const { data: newMember } = await supabase
                        .from('members')
                        .insert({
                          practitioner_id: authUser.id,
                          first_name: firstName,
                          last_name: lastName || '',
                          email: prospect.client_email,
                          phone: prospect.client_phone || null,
                          status: 'prospect',
                          engagement_level: 'medium',
                        })
                        .select('id')
                        .single()
                      if (newMember) {
                        // Link bookings
                        await supabase
                          .from('bookings')
                          .update({ member_id: newMember.id })
                          .eq('client_email', prospect.client_email)
                          .eq('practitioner_id', authUser.id)
                          .is('member_id', null)
                        router.push(`/members/${newMember.id}`)
                      }
                    }}
                    className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{prospect.client_name}</h3>
                        <p className="text-xs text-gray-500 truncate">{prospect.client_email}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-600 border border-teal-200">
                        {locale === 'fr' ? 'Nouveau' : 'New'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isPast ? (locale === 'fr' ? 'Dernière séance' : 'Last session') : (locale === 'fr' ? 'Prochaine séance' : 'Next session')}</span>
                      <span className="ml-auto text-gray-700 font-medium">
                        {sessionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{prospect.session_type}</span>
                    </div>

                    <div className="flex gap-2 mt-auto pt-4">
                      <button
                        onClick={() => {
                          setNewMember({
                            firstName,
                            lastName,
                            email: prospect.client_email,
                            phone: prospect.client_phone || '',
                            isMinor: false,
                            groupIds: [],
                          })
                          setShowAddModal(true)
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        {locale === 'fr' ? 'Ajouter' : 'Add'}
                      </button>
                      <button
                        onClick={() => setDeleteProspect({ id: prospect.id, email: prospect.client_email, name: prospect.client_name })}
                        className="py-2.5 px-3 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (<>
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-3'
            }>
              <AnimatePresence mode="popLayout">
                {paginatedMembers.map((member, index) => (
                  viewMode === 'grid' ? (
                    <MemberCard
                      key={member.id}
                      member={member}
                      index={index}
                      onDelete={handleDeleteMember}
                      onStatusChange={handleStatusChange}
                      onInviteClick={(m) => setInviteConfirmMember(m)}
                      onEdit={setEditMemberId}
                      t={t}
                      locale={locale}
                      nextSession={nextSessions[member.id] || null}
                      lastSharedResource={lastSharedResources[member.id] || null}
                      pendingWorksheet={pendingWorksheets[member.id] || null}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(member.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ) : (
                    <MemberListItem
                      key={member.id}
                      member={member}
                      index={index}
                      onDelete={handleDeleteMember}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditMemberId}
                      t={t}
                      locale={locale}
                      nextSession={nextSessions[member.id] || null}
                      lastSharedResource={lastSharedResources[member.id] || null}
                      pendingWorksheet={pendingWorksheets[member.id] || null}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(member.id)}
                      onToggleSelect={toggleSelect}
                    />
                  )
                ))}
              </AnimatePresence>
            </div>
          </>)}

          {/* Pagination */}
          {totalPages > 1 && filter !== 'new' && (
            <div className="flex items-center justify-center gap-2 mt-8 mb-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {locale === 'fr' ? 'Précédent' : 'Previous'}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, and pages near current
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .reduce((acc: (number | 'dots')[], page, i, arr) => {
                  if (i > 0 && page - (arr[i - 1] as number) > 1) acc.push('dots')
                  acc.push(page)
                  return acc
                }, [])
                .map((item, i) =>
                  item === 'dots' ? (
                    <span key={`dots-${i}`} className="px-1 text-gray-400">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === item
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {locale === 'fr' ? 'Suivant' : 'Next'}
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {/* Bulk delete confirmation modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setBulkDeleteConfirm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-96 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {locale === 'fr' ? 'Supprimer des membres' : 'Delete members'}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              {locale === 'fr'
                ? `${selectedIds.size} membre(s) seront supprimé(s). Cette action est irréversible.`
                : `${selectedIds.size} member(s) will be permanently deleted.`}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={executeBulkDelete}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk invite confirmation modal */}
      {bulkInviteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setBulkInviteConfirm(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-96 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {locale === 'fr' ? 'Envoyer les invitations' : 'Send invitations'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              {locale === 'fr'
                ? `${bulkResendInvites ? bulkInviteConfirm.toInvite + bulkInviteConfirm.alreadyInvited : bulkInviteConfirm.toInvite} invitation(s) seront envoyée(s).`
                : `${bulkResendInvites ? bulkInviteConfirm.toInvite + bulkInviteConfirm.alreadyInvited : bulkInviteConfirm.toInvite} invitation(s) will be sent.`}
            </p>
            {bulkInviteConfirm.alreadyInvited > 0 && (
              <div className="flex items-center justify-between mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {locale === 'fr'
                      ? `${bulkInviteConfirm.alreadyInvited} déjà invité(s)`
                      : `${bulkInviteConfirm.alreadyInvited} already invited`}
                  </p>
                  <p className="text-xs text-amber-600">
                    {locale === 'fr' ? 'Renvoyer l\'invitation ?' : 'Resend invitation?'}
                  </p>
                </div>
                <button
                  onClick={() => setBulkResendInvites(!bulkResendInvites)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${bulkResendInvites ? 'bg-teal-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${bulkResendInvites ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setBulkInviteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={executeBulkInvite}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {locale === 'fr' ? 'Envoyer' : 'Send'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk invite progress overlay */}
      {bulkInviteProgress && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              {locale === 'fr' ? 'Envoi des invitations...' : 'Sending invitations...'}
            </p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${(bulkInviteProgress.sent / bulkInviteProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {bulkInviteProgress.sent} / {bulkInviteProgress.total}
              {bulkInviteProgress.skipped > 0 && (
                <span className="text-gray-400"> · {bulkInviteProgress.skipped} {locale === 'fr' ? 'ignoré(s)' : 'skipped'}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
              <span className="text-sm font-semibold">{selectedIds.size}</span>
              <span className="text-sm text-gray-400">{locale === 'fr' ? 'sélectionné(s)' : 'selected'}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                {locale === 'fr' ? 'Tout sélectionner' : 'Select all'}
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                {locale === 'fr' ? 'Désélectionner' : 'Deselect'}
              </button>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-gray-700">
              <button
                onClick={handleBulkInvite}
                className="px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {locale === 'fr' ? 'Inviter' : 'Invite'}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingGroup
                    ? (locale === 'fr' ? 'Modifier le groupe' : locale === 'es' ? 'Editar grupo' : 'Edit Group')
                    : (locale === 'fr' ? 'Nouveau groupe' : locale === 'es' ? 'Nuevo grupo' : 'New Group')}
                </h2>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-4 flex-shrink-0">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Nom du groupe' : locale === 'es' ? 'Nombre del grupo' : 'Group name'} *
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    placeholder={locale === 'fr' ? 'ex: Groupe Anxiété' : 'e.g. Anxiety Group'}
                    autoFocus
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Couleur' : locale === 'es' ? 'Color' : 'Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    {GROUP_COLORS.map((color) => {
                      const colors = groupColorMap[color] || groupColorMap.blue
                      return (
                        <button
                          key={color}
                          onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full ${colors.dot} transition-all ${
                            groupForm.color === color
                              ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                              : 'hover:scale-105'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Member Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Membres' : locale === 'es' ? 'Miembros' : 'Members'}
                    <span className="text-gray-400 font-normal ml-1">({groupForm.memberIds.length})</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Member Checklist */}
              <div className="flex-1 overflow-y-auto border-t border-gray-100 max-h-60" style={{ scrollbarWidth: 'none' }}>
                {filteredGroupMembers.map((member) => {
                  const isChecked = groupForm.memberIds.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleGroupMember(member.id)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors ${
                        isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-xs flex-shrink-0">
                        {getMemberInitials(member)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`font-medium text-sm truncate ${isChecked ? 'text-blue-900' : 'text-gray-900'}`}>
                          {getMemberFullName(member)}
                        </p>
                        {member.email && (
                          <MaskedContact value={member.email} type="email" className="text-xs text-gray-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowGroupModal(false)}
                  className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSaveGroup}
                  disabled={!groupForm.name.trim() || savingGroup}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                >
                  {savingGroup ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingGroup
                        ? (locale === 'fr' ? 'Mettre à jour' : locale === 'es' ? 'Actualizar' : 'Update')
                        : (locale === 'fr' ? 'Créer' : locale === 'es' ? 'Crear' : 'Create')}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Confirmation Modal */}
      {inviteConfirmMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => inviteState === 'idle' ? setInviteConfirmMember(null) : undefined}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            {inviteState === 'success' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 animate-[scale-in_0.3s_ease-out]">
                  <Check className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                  {locale === 'fr' ? 'Invitation envoyée !' : 'Invitation sent!'}
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  {locale === 'fr'
                    ? `${inviteConfirmMember.first_name} recevra l'email dans quelques instants.`
                    : `${inviteConfirmMember.first_name} will receive the email shortly.`}
                </p>
              </>
            ) : inviteState === 'error' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                  {locale === 'fr' ? 'Échec de l\'envoi' : 'Failed to send'}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  {locale === 'fr' ? 'Veuillez réessayer.' : 'Please try again.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setInviteState('idle'); setInviteConfirmMember(null) }} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">
                    {locale === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                  <button onClick={() => setInviteState('idle')} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium">
                    {locale === 'fr' ? 'Réessayer' : 'Retry'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
                  {inviteState === 'sending' ? (
                    <Send className="w-6 h-6 text-teal-600 animate-[fly_1.5s_ease-in-out_infinite]" style={{ transform: 'rotate(-45deg)' }} />
                  ) : (
                    <Mail className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <style>{`
                  @keyframes fly {
                    0% { transform: rotate(-45deg) translate(0, 0); opacity: 1; }
                    50% { transform: rotate(-45deg) translate(12px, -12px); opacity: 0.4; }
                    51% { transform: rotate(-45deg) translate(-12px, 12px); opacity: 0; }
                    70% { transform: rotate(-45deg) translate(-6px, 6px); opacity: 0.6; }
                    100% { transform: rotate(-45deg) translate(0, 0); opacity: 1; }
                  }
                `}</style>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                  {inviteState === 'sending'
                    ? (locale === 'fr' ? 'Envoi en cours...' : 'Sending...')
                    : (locale === 'fr' ? 'Envoyer l\'invitation ?' : 'Send invitation?')}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  {inviteState === 'sending'
                    ? (locale === 'fr'
                      ? `Préparation de l'email pour ${inviteConfirmMember.first_name}...`
                      : `Preparing email for ${inviteConfirmMember.first_name}...`)
                    : (locale === 'fr'
                      ? `${inviteConfirmMember.first_name} ${inviteConfirmMember.last_name} recevra un email de bienvenue à ${inviteConfirmMember.email}`
                      : `${inviteConfirmMember.first_name} ${inviteConfirmMember.last_name} will receive a welcome email at ${inviteConfirmMember.email}`)}
                </p>
                {inviteState === 'idle' && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setInviteConfirmMember(null)}
                      className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
                    >
                      {locale === 'fr' ? 'Annuler' : 'Cancel'}
                    </button>
                    <button
                      onClick={async () => {
                        const m = inviteConfirmMember
                        setInviteState('sending')
                        try {
                          const { data: { user: authUser } } = await supabase.auth.getUser()
                          if (!authUser) throw new Error('Not authenticated')
                          const { data: practitionerProfile } = await supabase
                            .from('users')
                            .select('full_name, avatar_url')
                            .eq('id', authUser.id)
                            .single()

                          await supabase.functions.invoke('send-member-welcome', {
                            body: {
                              memberName: m.first_name,
                              memberLastName: m.last_name,
                              memberEmail: m.email,
                              practitionerName: practitionerProfile?.full_name || 'Your practitioner',
                              practitionerAvatarUrl: practitionerProfile?.avatar_url || null,
                              locale,
                            },
                          })

                          await supabase
                            .from('members')
                            .update({ invitation_sent: true, invitation_sent_at: new Date().toISOString() })
                            .eq('id', m.id)

                          setMembers(prev => prev.map(member => member.id === m.id ? { ...member, invitation_sent: true } as any : member))
                          setInviteState('success')
                          setTimeout(() => {
                            setInviteConfirmMember(null)
                            setInviteState('idle')
                          }, 2500)
                        } catch {
                          setInviteState('error')
                        }
                      }}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium"
                    >
                      {locale === 'fr' ? 'Envoyer' : 'Send'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {locale === 'fr' ? 'Supprimer ce patient ?' : 'Delete this member?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr'
                ? 'Cette action supprimera définitivement ce patient et toutes ses données associées. Cette action est irréversible.'
                : 'This will permanently delete this member and all associated data. This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={confirmDeleteMember}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium"
              >
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Patient Confirmation */}
      {convertConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConvertConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              {locale === 'fr' ? 'Convertir en patient ?' : 'Convert to patient?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {locale === 'fr'
                ? `${convertConfirm.name} deviendra un patient actif avec accès à toutes les fonctionnalités.`
                : `${convertConfirm.name} will become an active patient with access to all features.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConvertConfirm(null)}
                className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await supabase.from('members').update({ status: 'active' }).eq('id', convertConfirm.id)
                  setMembers(prev => prev.map(m => m.id === convertConfirm.id ? { ...m, status: 'active' as const } : m))
                  calculateStats(members.map(m => m.id === convertConfirm.id ? { ...m, status: 'active' as const } : m))
                  setConvertConfirm(null)
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

      {/* Edit Member Modal */}
      {editMemberId && (
        <EditMemberModal
          memberId={editMemberId}
          isOpen={true}
          onClose={() => setEditMemberId(null)}
          onSaved={(updated) => {
            setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))
            calculateStats(members.map(m => m.id === updated.id ? updated : m))
          }}
        />
      )}

      {/* Delete Prospect Modal */}
      {deleteProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteProspect(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              {locale === 'fr' ? 'Supprimer ce contact ?' : 'Delete this contact?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {locale === 'fr'
                ? `${deleteProspect.name} et ses réservations seront supprimés.`
                : `${deleteProspect.name} and their bookings will be deleted.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteProspect(null)}
                className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await supabase
                    .from('bookings')
                    .delete()
                    .eq('client_email', deleteProspect.email)
                    .is('member_id', null)
                  setProspects(prev => prev.filter(p => p.id !== deleteProspect.id))
                  setDeleteProspect(null)
                  toast.success(locale === 'fr' ? 'Contact supprimé' : 'Contact deleted')
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium"
              >
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
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
                  {locale === 'fr' ? 'Ajouter un nouveau patient / client' : 'Add a New Person'}
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

                  {/* Minor/Student Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group/minor">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newMember.isMinor}
                        onChange={(e) => { setNewMember({ ...newMember, isMinor: e.target.checked }); if (e.target.checked) setSendInvite(false) }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover/minor:text-gray-900 transition-colors">
                      {locale === 'fr' ? 'Mineur' : locale === 'es' ? 'Menor' : 'Minor'}
                    </span>
                  </label>

                  {/* Send Invitation Card */}
                  <div
                    onClick={() => setSendInvite(!sendInvite)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      sendInvite ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100 bg-gray-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      sendInvite ? 'bg-teal-100' : 'bg-gray-100'
                    }`}>
                      <Mail className={`w-4 h-4 ${sendInvite ? 'text-teal-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${sendInvite ? 'text-teal-900' : 'text-gray-500'}`}>
                        {locale === 'fr'
                          ? `Inviter ${newMember.firstName.trim() || 'cette personne'} sur l'app bien-être`
                          : `Invite ${newMember.firstName.trim() || 'this person'} to the wellbeing app`}
                      </p>
                      <p className="text-xs text-gray-400 leading-snug">
                        {locale === 'fr'
                          ? 'Accès gratuit entre les séances'
                          : 'Free access between sessions'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 relative">
                      <div className={`w-9 h-5 rounded-full transition-colors ${sendInvite ? 'bg-teal-600' : 'bg-gray-200'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${sendInvite ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>

                  {/* Group selector */}
                  {memberGroups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-0.5">
                        {locale === 'fr' ? 'Ajouter à un groupe' : locale === 'es' ? 'Añadir a un grupo' : 'Add to a Group'}
                      </label>
                      <p className="text-[11px] text-gray-400 mb-1.5">
                        {locale === 'fr'
                          ? 'Les groupes sont privés — votre patient ne le saura pas.'
                          : 'Groups are private — your patient won\'t know.'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {memberGroups.map(group => {
                          const colors = groupColorMap[group.color] || groupColorMap.blue
                          const isSelected = newMember.groupIds.includes(group.id)
                          return (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => setNewMember(prev => ({
                                ...prev,
                                groupIds: isSelected
                                  ? prev.groupIds.filter(id => id !== group.id)
                                  : [...prev.groupIds, group.id]
                              }))}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                isSelected
                                  ? `${colors.chipBg} ${colors.text} ring-1 ring-current ring-opacity-30`
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                              {group.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
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

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
            onClick={resetImportModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full max-w-4xl shadow-xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {locale === 'fr' ? 'Importer des clients' : locale === 'es' ? 'Importar miembros' : 'Import Members'}
                </h2>
                <button
                  onClick={resetImportModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Upload / Paste */}
              {importStep === 'upload' && (
                <div className="p-5">
                  {/* Tabs: Paste | Upload */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
                    <button
                      onClick={() => setImportMode('paste')}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                        importMode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {locale === 'fr' ? 'Coller' : 'Paste'}
                    </button>
                    <button
                      onClick={() => setImportMode('csv')}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                        importMode === 'csv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {locale === 'fr' ? 'Fichier CSV' : 'CSV File'}
                    </button>
                  </div>

                  {importMode === 'paste' ? (
                    <>
                      <p className="text-xs text-gray-400 mb-2">
                        {locale === 'fr'
                          ? 'Copiez vos données depuis Excel, Google Sheets ou Notion et collez-les ici'
                          : 'Copy your data from Excel, Google Sheets, or Notion and paste it here'}
                      </p>
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        onPaste={(e) => {
                          // Let the paste happen naturally via onChange
                        }}
                        className="w-full h-40 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none font-mono"
                        placeholder={locale === 'fr'
                          ? 'Prénom\tNom\tEmail\tTéléphone\nJean\tDupont\tjean@email.com\t0612345678\nMarie\tMartin\tmarie@email.com'
                          : 'First Name\tLast Name\tEmail\tPhone\nJane\tDoe\tjane@email.com\t+15551234567\nJohn\tSmith\tjohn@email.com'}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {locale === 'fr' ? 'Max 50 lignes' : 'Max 50 rows'}
                          {' · '}
                          <button
                            type="button"
                            onClick={() => setBulkImportSupportOpen(true)}
                            className="text-teal-500 hover:text-teal-600 underline underline-offset-2"
                          >
                            {locale === 'fr' ? 'Besoin de plus ?' : 'Need more?'}
                          </button>
                        </p>
                        <Button
                          onClick={handlePasteSubmit}
                          disabled={!pasteText.trim()}
                          className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                        >
                          {locale === 'fr' ? 'Continuer' : 'Continue'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.tsv,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(file)
                        }}
                      />

                      <div
                        className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-gray-400', 'bg-gray-50') }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-gray-400', 'bg-gray-50') }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('border-gray-400', 'bg-gray-50')
                          const file = e.dataTransfer.files[0]
                          if (file) handleFileSelect(file)
                        }}
                      >
                        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {locale === 'fr' ? 'Glissez votre fichier ici' : 'Drag your file here'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {locale === 'fr' ? 'CSV, TSV ou TXT · ou cliquez pour parcourir' : 'CSV, TSV, or TXT · or click to browse'}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={downloadTemplate}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {locale === 'fr' ? 'Télécharger le modèle' : 'Download template'}
                        </button>
                        <span className="text-xs text-gray-400">
                          {locale === 'fr' ? 'Max 50 lignes' : 'Max 50 rows'}
                          {' · '}
                          <button
                            type="button"
                            onClick={() => setBulkImportSupportOpen(true)}
                            className="text-teal-500 hover:text-teal-600 underline underline-offset-2"
                          >
                            {locale === 'fr' ? 'Besoin de plus ?' : 'Need more?'}
                          </button>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 1b: Column Mapping */}
              {importStep === 'mapping' && (
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-4">
                    {locale === 'fr'
                      ? 'Associez chaque colonne au bon champ. Prénom, Nom et Email sont obligatoires.'
                      : 'Map each column to the right field. First Name, Last Name and Email are required.'}
                  </p>

                  {/* Preview of first 2 rows */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          {rawHeaders.map((header, idx) => (
                            <th key={idx} className="px-2 py-1.5 text-left">
                              <select
                                value={columnMapping[idx] || ''}
                                onChange={(e) => setColumnMapping(prev => ({ ...prev, [idx]: e.target.value }))}
                                className={`w-full px-2 py-1.5 text-xs border rounded-lg transition-colors ${
                                  columnMapping[idx] ? 'border-teal-300 bg-teal-50 text-teal-700 font-medium' : 'border-gray-200 text-gray-500'
                                }`}
                              >
                                <option value="">{locale === 'fr' ? '— Ignorer —' : '— Skip —'}</option>
                                <option value="first_name">{locale === 'fr' ? 'Prénom' : 'First Name'} *</option>
                                <option value="last_name">{locale === 'fr' ? 'Nom' : 'Last Name'} *</option>
                                <option value="email">Email *</option>
                                <option value="phone">{locale === 'fr' ? 'Téléphone' : 'Phone'}</option>
                                <option value="date_of_birth">{locale === 'fr' ? 'Date de naissance' : 'Date of Birth'}</option>
                                <option value="is_minor">{locale === 'fr' ? 'Mineur' : 'Minor'}</option>
                              </select>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawRows.slice(0, 3).map((row, rIdx) => (
                          <tr key={rIdx} className="border-t border-gray-100">
                            {rawHeaders.map((_, cIdx) => (
                              <td key={cIdx} className="px-2 py-1.5 text-gray-600 truncate max-w-[140px]">
                                {row[cIdx] || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rawRows.length > 3 && (
                    <p className="text-xs text-gray-400 mb-4">
                      {locale === 'fr' ? `+ ${rawRows.length - 3} autres lignes` : `+ ${rawRows.length - 3} more rows`}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => { setImportStep('upload'); setRawHeaders([]); setRawRows([]); setColumnMapping({}) }}
                      className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      {locale === 'fr' ? 'Retour' : 'Back'}
                    </Button>
                    <Button
                      onClick={handleMappingConfirm}
                      disabled={(() => {
                        const mapped = new Set(Object.values(columnMapping).filter(v => v && v !== 'skip'))
                        return !mapped.has('first_name') || !mapped.has('last_name') || !mapped.has('email')
                      })()}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                    >
                      {locale === 'fr' ? 'Continuer' : 'Continue'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Preview */}
              {importStep === 'preview' && (
                <div className="flex flex-col min-h-0 flex-1">
                  {/* Summary */}
                  <div className="px-5 pt-4 pb-3 flex-shrink-0">
                    {(() => {
                      const validCount = importRows.filter(r => r.valid).length
                      const errorCount = importRows.filter(r => !r.valid).length
                      return (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <Check className="w-4 h-4" />
                            {validCount} {locale === 'fr' ? 'valides' : 'valid'}
                          </span>
                          {errorCount > 0 && (
                            <span className="flex items-center gap-1.5 text-red-500">
                              <AlertCircle className="w-4 h-4" />
                              {errorCount} {locale === 'fr' ? 'erreurs' : 'errors'}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Table */}
                  <div className="px-5 overflow-auto flex-1 min-h-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-2 text-gray-500 font-medium w-8"></th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{locale === 'fr' ? 'Prénom' : 'First Name'}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{locale === 'fr' ? 'Nom' : 'Last Name'}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">Email</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{locale === 'fr' ? 'Téléphone' : 'Phone'}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{locale === 'fr' ? 'Naissance' : 'DOB'}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{locale === 'fr' ? 'Mineur' : 'Minor'}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{locale === 'fr' ? 'Erreur' : 'Issue'}</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, idx) => (
                          <tr key={idx} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50/50' : ''}`}>
                            <td className="py-2 pr-2">
                              {row.valid ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                            </td>
                            <td className="py-1 px-1">
                              <input value={row.first_name} onChange={(e) => updateImportRow(idx, 'first_name', e.target.value)} className="w-full px-2 py-1 text-sm text-gray-700 border border-transparent rounded hover:border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all bg-transparent" />
                            </td>
                            <td className="py-1 px-1">
                              <input value={row.last_name} onChange={(e) => updateImportRow(idx, 'last_name', e.target.value)} className="w-full px-2 py-1 text-sm text-gray-700 border border-transparent rounded hover:border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all bg-transparent" />
                            </td>
                            <td className="py-1 px-1">
                              <input value={row.email} onChange={(e) => updateImportRow(idx, 'email', e.target.value)} className="w-full px-2 py-1 text-sm text-gray-700 border border-transparent rounded hover:border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all bg-transparent" />
                            </td>
                            <td className="py-1 px-1">
                              <input value={row.phone || ''} onChange={(e) => updateImportRow(idx, 'phone', e.target.value)} placeholder="—" className="w-full px-2 py-1 text-sm text-gray-400 border border-transparent rounded hover:border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all bg-transparent" />
                            </td>
                            <td className="py-1 px-1">
                              <input type="date" value={row.date_of_birth || ''} onChange={(e) => updateImportRow(idx, 'date_of_birth', e.target.value)} className="px-2 py-1 text-sm text-gray-400 border border-transparent rounded hover:border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all bg-transparent" />
                            </td>
                            <td className="py-1 px-1 text-center">
                              <button type="button" onClick={() => updateImportRow(idx, 'is_minor', !row.is_minor)} className={`px-2 py-1 text-xs rounded-md transition-colors ${row.is_minor ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                {row.is_minor ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No')}
                              </button>
                            </td>
                            <td className="py-2 px-2">
                              {!row.valid && (
                                <span className="text-red-500 text-xs">{row.error}</span>
                              )}
                            </td>
                            <td className="py-2 pl-2">
                              <button
                                onClick={() => dismissImportRow(idx)}
                                className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 flex-shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => { setImportStep('upload'); setImportRows([]); setPasteText(''); setRawHeaders([]); setRawRows([]); setColumnMapping({}); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      {locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver' : 'Back'}
                    </Button>
                    <Button
                      onClick={handleBulkImport}
                      disabled={importing || importRows.filter(r => r.valid).length === 0}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {locale === 'fr' ? 'Import en cours...' : 'Importing...'}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {locale === 'fr'
                            ? `Importer ${importRows.filter(r => r.valid).length} clients`
                            : locale === 'es'
                            ? `Importar ${importRows.filter(r => r.valid).length} miembros`
                            : `Import ${importRows.filter(r => r.valid).length} members`}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Result */}
              {importStep === 'result' && importResult && (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {locale === 'fr' ? 'Import terminé' : locale === 'es' ? 'Importación completada' : 'Import Complete'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">{importResult.imported}</span>{' '}
                    {locale === 'fr' ? 'importés' : 'imported'}
                  </p>
                  {importResult.skipped > 0 && (
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">{importResult.skipped}</span>{' '}
                      {locale === 'fr' ? 'ignorés (email existant)' : 'skipped (duplicate email)'}
                    </p>
                  )}
                  <Button
                    onClick={resetImportModal}
                    className="mt-6 bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-6 text-sm"
                  >
                    {locale === 'fr' ? 'Terminé' : locale === 'es' ? 'Listo' : 'Done'}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk import support modal */}
      <FeedbackButton
        showFloatingButton={false}
        isOpen={bulkImportSupportOpen}
        onClose={() => setBulkImportSupportOpen(false)}
        userEmail={user?.email}
        userName={user?.full_name}
        initialData={{
          type: 'feature' as const,
          subject: locale === 'fr' ? 'Import en masse - Plus de 50 membres' : 'Bulk import - More than 50 members',
          description: locale === 'fr'
            ? 'Bonjour,\n\nJ\'aimerais importer plus de 50 membres en une seule fois. Pouvez-vous m\'aider ?'
            : 'Hi,\n\nI\'d like to import more than 50 members at once. Can you help?',
        }}
      />
    </div>
  )
}

// Member Card Component (Grid View)
function MemberCard({
  member,
  index,
  onDelete,
  onStatusChange,
  onInviteClick,
  onEdit,
  t,
  locale,
  nextSession,
  lastSharedResource,
  pendingWorksheet,
  selectionMode,
  isSelected,
  onToggleSelect,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  onStatusChange: (id: string, newStatus: 'active' | 'inactive') => void
  onInviteClick?: (member: Member) => void
  onEdit?: (id: string) => void
  t: ReturnType<typeof useLanguage>['t']
  locale: 'en' | 'fr' | 'es'
  nextSession: Session | null
  lastSharedResource: { title: string; type: string; sharedAt: string } | null
  pendingWorksheet?: { title: string; daysPending: number } | null
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const router = useRouter()

  const statusConfig: Record<string, { bg: string; text: string; dot: string; hoverBg: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-100' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', hoverBg: 'hover:bg-gray-200' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', hoverBg: 'hover:bg-amber-100' },
  }

  const status = statusConfig[member.status] || statusConfig.active

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => selectionMode ? onToggleSelect?.(member.id) : router.push(`/members/${member.id}`)}
      className={`group bg-white rounded-2xl p-5 cursor-pointer transition-all border ${
        isSelected ? 'border-teal-400 bg-teal-50/40' : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      {/* Header with Avatar & Name */}
      <div className="flex items-center gap-3 mb-4">
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="flex-shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-teal-500" />
            ) : (
              <Square className="w-5 h-5 text-gray-300" />
            )}
          </div>
        )}
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-semibold text-lg">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getMemberInitials(member)
            )}
          </div>
          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${status.dot} border-2 border-white`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate text-base">
              {getMemberFullName(member)}
            </h3>
            {member.is_demo && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-600 border border-violet-200">
                {locale === 'fr' ? 'Démo' : locale === 'es' ? 'Demo' : 'Demo'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 group/status">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {member.status === 'prospect' ? (locale === 'fr' ? 'Nouveau' : 'New') : (t.members.status[member.status as 'active' | 'inactive' | 'pending'] || t.members.status.active)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
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
                  onStatusChange(member.id, newStatus)
                }
              }}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover/status:opacity-100"
              title={locale === 'fr' ? 'Changer le statut' : locale === 'es' ? 'Cambiar estado' : 'Change status'}
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(member.id) }}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
        {/* Last Shared Resource */}
        {lastSharedResource ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">{lastSharedResource.title}</span>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {getRelativeTime(lastSharedResource.sharedAt, locale)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-sm text-gray-400">{locale === 'fr' ? 'Aucune ressource partagée' : 'No resource shared'}</span>
          </div>
        )}

        {/* Pending worksheet indicator */}
        {pendingWorksheet && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-600 truncate flex-1">
              {pendingWorksheet.title}
            </span>
            <span className="text-xs text-amber-500 flex-shrink-0">
              {pendingWorksheet.daysPending}d
            </span>
          </div>
        )}

        {/* Next Session */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">{locale === 'fr' ? 'Prochaine séance' : 'Next session'}</span>
          </div>
          {nextSession ? (
            <span className="text-sm text-gray-900 font-medium">
              {new Date(nextSession.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          ) : (
            <span className="text-xs text-gray-400">{locale === 'fr' ? 'Non planifiée' : 'Not scheduled'}</span>
          )}
        </div>

        {/* App status — expandable invitation card */}
        {!member.user_id && member.email && (
          <InviteCard member={member} locale={locale} onInviteClick={onInviteClick} />
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
  onStatusChange,
  onEdit,
  t,
  locale,
  nextSession,
  lastSharedResource,
  selectionMode,
  isSelected,
  onToggleSelect,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  onStatusChange: (id: string, newStatus: 'active' | 'inactive') => void
  onEdit?: (id: string) => void
  t: ReturnType<typeof useLanguage>['t']
  locale: 'en' | 'fr' | 'es'
  nextSession: Session | null
  lastSharedResource: { title: string; type: string; sharedAt: string } | null
  pendingWorksheet?: { title: string; daysPending: number } | null
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}) {
  const router = useRouter()

  const statusConfig: Record<string, { bg: string; text: string; dot: string; hoverBg: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-100' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', hoverBg: 'hover:bg-gray-200' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', hoverBg: 'hover:bg-amber-100' },
  }

  const status = statusConfig[member.status] || statusConfig.active

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => selectionMode ? onToggleSelect?.(member.id) : router.push(`/members/${member.id}`)}
      className={`group bg-white rounded-xl p-4 cursor-pointer transition-all border flex items-center gap-4 ${
        isSelected ? 'border-teal-400 bg-teal-50/40' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0">
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-teal-500" />
          ) : (
            <Square className="w-5 h-5 text-gray-300" />
          )}
        </div>
      )}

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
          {member.is_demo && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-600 border border-violet-200">
              {locale === 'fr' ? 'Démo' : locale === 'es' ? 'Demo' : 'Demo'}
            </span>
          )}
          <div className="flex items-center gap-1 group/status">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.bg} ${status.text}`}>
              {member.status === 'prospect' ? (locale === 'fr' ? 'Nouveau' : 'New') : (t.members.status[member.status as 'active' | 'inactive' | 'pending'] || t.members.status.active)}
            </span>
            {member.user_id ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {locale === 'fr' ? 'Rejoint' : 'Joined'}
              </span>
            ) : (member as any).invitation_sent ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-100">
                {locale === 'fr' ? 'Invité' : 'Invited'}
              </span>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation()
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
                  onStatusChange(member.id, newStatus)
                }
              }}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover/status:opacity-100"
              title={locale === 'fr' ? 'Changer le statut' : locale === 'es' ? 'Cambiar estado' : 'Change status'}
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Last Shared Resource */}
      {lastSharedResource && (
        <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500 flex-shrink-0">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-900">
            {lastSharedResource.title}
          </span>
          <span className="text-gray-500 text-xs">{getRelativeTime(lastSharedResource.sharedAt, locale)}</span>
        </div>
      )}

      {/* Next Session */}
      <div className="hidden lg:flex items-center gap-1.5 text-sm flex-shrink-0">
        <Calendar className="w-4 h-4 text-emerald-500" />
        {nextSession ? (
          <span className="text-gray-900 font-medium">
            {new Date(nextSession.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">{locale === 'fr' ? 'Non planifiée' : 'Not scheduled'}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => router.push(`/resources?share=${member.id}`)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title={locale === 'fr' ? 'Partager une ressource' : 'Share resource'}
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(member.id) }}
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

function InviteCard({ member, locale, onInviteClick }: { member: Member; locale: string; onInviteClick?: (m: Member) => void }) {
  const [showPopup, setShowPopup] = useState(false)
  const isResend = !!(member as any).invitation_sent

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowPopup(true) }}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-teal-50/50 hover:bg-teal-50 border border-teal-100 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span className="text-sm text-teal-700">
            {locale === 'fr'
              ? `${member.first_name} n'a pas encore rejoint Bloomsline`
              : `${member.first_name} hasn't joined Bloomsline yet`}
          </span>
        </div>
        <span className="text-xs font-medium text-teal-600 group-hover:text-teal-700">
          {isResend ? (locale === 'fr' ? 'Renvoyer' : 'Resend') : (locale === 'fr' ? 'Inviter' : 'Invite')}
        </span>
      </button>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={(e) => { e.stopPropagation(); setShowPopup(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <p className="text-xl font-semibold text-gray-900 mb-1">
                <span className="font-bold">blooms</span><span className="font-bold text-teal-600">line</span>
              </p>
              <p className="text-sm text-gray-400">
                {locale === 'fr' ? 'Petits moments, grande compréhension' : 'Small moments, big understanding'}
              </p>
            </div>

            <p className="text-sm text-gray-600 text-center mb-6">
              {locale === 'fr'
                ? `Invitez ${member.first_name} à rejoindre Bloomsline. Voici ce qu'il/elle pourra faire :`
                : `Invite ${member.first_name} to join Bloomsline. Here's what they'll be able to do:`}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{locale === 'fr' ? 'Gérer leurs séances' : 'Manage sessions'}</p>
                  <p className="text-xs text-gray-500">{locale === 'fr' ? 'Voir, confirmer, reprogrammer ou annuler leurs rendez-vous.' : 'View, confirm, reschedule, or cancel appointments.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{locale === 'fr' ? 'Accéder aux ressources' : 'Access resources'}</p>
                  <p className="text-xs text-gray-500">{locale === 'fr' ? 'Compléter les exercices et fiches partagés par leur praticien.' : 'Complete exercises and worksheets shared by their practitioner.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{locale === 'fr' ? 'Rester connecté' : 'Stay connected'}</p>
                  <p className="text-xs text-gray-500">{locale === 'fr' ? 'Capturer des moments, suivre leur progression et préparer les séances.' : 'Capture moments, track progress, and prepare for sessions.'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onInviteClick?.(member); setShowPopup(false) }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
              >
                {isResend
                  ? (locale === 'fr' ? 'Renvoyer' : 'Resend')
                  : (locale === 'fr' ? 'Envoyer' : 'Send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
