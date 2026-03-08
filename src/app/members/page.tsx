'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Mail,
  Edit,
  Trash2,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import type { User } from '@/types/user'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
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
  const supabase = createClient()

  const [members, setMembers] = useState<Member[]>([])
  const [nextSessions, setNextSessions] = useState<Record<string, Session | null>>({})
  const [lastSharedResources, setLastSharedResources] = useState<Record<string, { title: string; type: string; sharedAt: string } | null>>({})
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
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] as string[] })
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
            shared_at,
            resource:resources(title, type)
          `)
          .in('member_id', memberIds)
          .order('shared_at', { ascending: false })

        const sharedMap: Record<string, { title: string; type: string; sharedAt: string } | null> = {}
        memberIds.forEach(id => { sharedMap[id] = null })

        sharedResources?.forEach((share: { member_id: string; shared_at: string; resource: { title: string; type: string }[] | { title: string; type: string } | null }) => {
          if (!sharedMap[share.member_id] && share.resource) {
            const resource = Array.isArray(share.resource) ? share.resource[0] : share.resource
            if (resource) {
              sharedMap[share.member_id] = { title: resource.title, type: resource.type, sharedAt: share.shared_at }
            }
          }
        })

        setLastSharedResources(sharedMap)
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

    const engagementValues = { low: 1, medium: 2, high: 3 }
    const totalEngagement = membersList.reduce((sum, m) => sum + engagementValues[m.engagement_level], 0)
    const avgEngagement = membersList.length > 0 ? Math.round((totalEngagement / membersList.length / 3) * 100) : 0

    setStats({
      total_members: membersList.length,
      active_members: active,
      inactive_members: inactive,
      pending_members: 0,
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

      // Check if a member with this email already exists
      const { data: existingMembers } = await supabase
        .from('members')
        .select('id, practitioner_id, first_name, last_name')
        .eq('email', emailToAdd)

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

      const memberData = {
        practitioner_id: authUser.id,
        first_name: newMember.firstName.trim(),
        last_name: newMember.lastName.trim(),
        email: emailToAdd,
        phone: newMember.phone.trim() || null,
        status: 'active' as const,
        engagement_level: 'medium' as const,
        is_minor: newMember.isMinor,
      }

      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
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

      // Reset form and close modal
      setNewMember({ firstName: '', lastName: '', email: '', phone: '', isMinor: false, groupIds: [] })
      setShowAddModal(false)
      toast.success(t.members.success.memberCreated)
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
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilter(option.value); setShowGroupsView(false) }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      filter === option.value && !showGroupsView
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {option.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                      filter === option.value && !showGroupsView
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {option.count}
                    </span>
                  </button>
                ))}

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Groups Pill */}
                <button
                  onClick={() => setShowGroupsView(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    showGroupsView
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {locale === 'fr' ? 'Groupes' : locale === 'es' ? 'Grupos' : 'Groups'}
                  <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                    showGroupsView
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {memberGroups.length}
                  </span>
                </button>
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

                {/* Import CSV Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  className="rounded-xl px-2.5 border-gray-200"
                  title={locale === 'fr' ? 'Importer CSV' : locale === 'es' ? 'Importar CSV' : 'Import CSV'}
                >
                  <Upload className="w-4 h-4" />
                </Button>

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
              </div>
            </div>
          </motion.div>

          {/* Groups View */}
          {showGroupsView ? (
            <div>
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
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
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
                      onStatusChange={handleStatusChange}
                      t={t}
                      locale={locale}
                      nextSession={nextSessions[member.id] || null}
                      lastSharedResource={lastSharedResources[member.id] || null}
                    />
                  ) : (
                    <MemberListItem
                      key={member.id}
                      member={member}
                      index={index}
                      onDelete={handleDeleteMember}
                      onStatusChange={handleStatusChange}
                      t={t}
                      locale={locale}
                      nextSession={nextSessions[member.id] || null}
                      lastSharedResource={lastSharedResources[member.id] || null}
                    />
                  )
                ))}
              </AnimatePresence>
            </div>
          )}
          </>
          )}
        </div>
      </main>

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
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
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
                        onChange={(e) => setNewMember({ ...newMember, isMinor: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-900 transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover/minor:text-gray-900 transition-colors">
                      {locale === 'fr' ? 'Mineur' : locale === 'es' ? 'Menor' : 'Minor'}
                    </span>
                  </label>

                  {/* Group selector */}
                  {memberGroups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Ajouter à un groupe' : locale === 'es' ? 'Añadir a un grupo' : 'Add to a Group'}
                      </label>
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
  t,
  locale,
  nextSession,
  lastSharedResource,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  onStatusChange: (id: string, newStatus: 'active' | 'inactive') => void
  t: ReturnType<typeof useLanguage>['t']
  locale: 'en' | 'fr' | 'es'
  nextSession: Session | null
  lastSharedResource: { title: string; type: string; sharedAt: string } | null
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => router.push(`/members/${member.id}`)}
      className="group bg-white rounded-2xl p-5 cursor-pointer transition-all border border-gray-200 hover:border-gray-300 hover:shadow-lg"
    >
      {/* Header with Avatar & Name */}
      <div className="flex items-center gap-3 mb-4">
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
              {t.members.status[member.status] || t.members.status.active}
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
            onClick={() => router.push(`/members/${member.id}/edit`)}
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
      </div>

      {/* Share Resource Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/resources?share=${member.id}`)
        }}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
      >
        <Share2 className="w-4 h-4" />
        {locale === 'fr' ? 'Partager une ressource' : 'Share resource'}
      </button>
    </motion.div>
  )
}

// Member List Item Component (List View)
function MemberListItem({
  member,
  index,
  onDelete,
  onStatusChange,
  t,
  locale,
  nextSession,
  lastSharedResource,
}: {
  member: Member
  index: number
  onDelete: (id: string) => void
  onStatusChange: (id: string, newStatus: 'active' | 'inactive') => void
  t: ReturnType<typeof useLanguage>['t']
  locale: 'en' | 'fr' | 'es'
  nextSession: Session | null
  lastSharedResource: { title: string; type: string; sharedAt: string } | null
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
          {member.is_demo && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-600 border border-violet-200">
              {locale === 'fr' ? 'Démo' : locale === 'es' ? 'Demo' : 'Demo'}
            </span>
          )}
          <div className="flex items-center gap-1 group/status">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.bg} ${status.text}`}>
              {t.members.status[member.status] || t.members.status.active}
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
