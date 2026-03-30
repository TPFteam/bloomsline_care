'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Users,
  Globe,
  EyeOff,
  FileText,
  ArrowRight,
  X,
  Send,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { PublicPractitioner } from '@/types/public-practitioner'
import type { User } from '@/types/user'

interface AdminResource {
  id: string
  title: string
  type: string
  category: string | null
  status: string
  visibility: string
  practitioner_id: string
  created_at: string
  updated_at: string
  owner_name: string
  owner_email: string
}

interface PractitionerAccount {
  id: string
  full_name: string
  email: string
}

type TabType = 'practitioners' | 'resources' | 'invite'

export default function AdminPractitionersPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabType>('practitioners')
  const [user, setUser] = useState<User | null>(null)
  const [practitioners, setPractitioners] = useState<PublicPractitioner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Resources tab state
  const [resources, setResources] = useState<AdminResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourceSearch, setResourceSearch] = useState('')
  const [clearConfirmId, setClearConfirmId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [practitionerAccounts, setPractitionerAccounts] = useState<PractitionerAccount[]>([])
  const [transferSearch, setTransferSearch] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<PractitionerAccount | null>(null)

  // Invite tab state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviteLang, setInviteLang] = useState<'fr' | 'en'>('fr')
  const [inviting, setInviting] = useState(false)
  const [invitedList, setInvitedList] = useState<{ id: string; email: string; name: string; status: string; created_at: string }[]>([])
  const [invitedLoading, setInvitedLoading] = useState(false)

  const statusOptions = ['pending', 'invited', 'activated', 'rejected', 'waitlisted']
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
    invited: { bg: 'bg-blue-50', text: 'text-blue-600' },
    activated: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    rejected: { bg: 'bg-red-50', text: 'text-red-600' },
    waitlisted: { bg: 'bg-gray-100', text: 'text-gray-500' },
  }

  const [confirmStatusChange, setConfirmStatusChange] = useState<{ id: string; name: string; from: string; to: string } | null>(null)

  const handleStatusSelect = (id: string, name: string, currentStatus: string, newStatus: string) => {
    if (newStatus === currentStatus) return
    setConfirmStatusChange({ id, name, from: currentStatus, to: newStatus })
  }

  const confirmStatus = async () => {
    if (!confirmStatusChange) return
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmStatusChange.id, status: confirmStatusChange.to }),
      })
      if (res.ok) {
        setInvitedList(prev => prev.map(inv => inv.id === confirmStatusChange.id ? { ...inv, status: confirmStatusChange.to } : inv))
        toast.success(locale === 'fr' ? 'Statut mis à jour' : 'Status updated')
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    }
    setConfirmStatusChange(null)
  }

  const fetchInvited = async () => {
    setInvitedLoading(true)
    try {
      const res = await fetch('/api/admin/invites')
      if (res.ok) {
        const data = await res.json()
        setInvitedList(data.invites || [])
      }
    } catch {
      // ignore
    }
    setInvitedLoading(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          name: inviteName.trim(),
          message: inviteMessage.trim() || undefined,
          preferredLanguage: inviteLang,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send invite')
      } else {
        toast.success(locale === 'fr' ? 'Invitation envoyée !' : 'Invite sent!')
        setInviteEmail('')
        setInviteName('')
        setInviteMessage('')
        fetchInvited()
      }
    } catch {
      toast.error('Failed to send invite')
    }
    setInviting(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'resources' && resources.length === 0) {
      fetchResources()
    }
    if (activeTab === 'invite' && invitedList.length === 0) {
      fetchInvited()
    }
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .eq('id', authUser.id)
        .single()

      if (userData) setUser(userData as User)

      const res = await fetch('/api/admin/practitioners')
      if (!res.ok) throw new Error('Failed to fetch')
      const { practitioners: data } = await res.json()
      setPractitioners(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load practitioners')
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    setResourcesLoading(true)
    try {
      const res = await fetch('/api/admin/resources')
      if (!res.ok) throw new Error('Failed to fetch resources')
      const { resources: data } = await res.json()
      setResources(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  const fetchPractitionerAccounts = async () => {
    try {
      const res = await fetch('/api/admin/practitioners/accounts')
      if (!res.ok) throw new Error('Failed to fetch')
      const { practitioners: data } = await res.json()
      setPractitionerAccounts(data || [])
    } catch {
      toast.error('Failed to load practitioner accounts')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/practitioners/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPractitioners(prev => prev.filter(p => p.id !== id))
      toast.success('Practitioner deleted')
    } catch {
      toast.error('Failed to delete practitioner')
    } finally {
      setDeleting(null)
    }
  }

  const handleTransfer = async (newPractitionerId: string) => {
    if (selectedResources.size === 0) return

    setTransferring(true)
    try {
      const res = await fetch('/api/admin/resources/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_ids: Array.from(selectedResources),
          new_practitioner_id: newPractitionerId,
        }),
      })

      if (!res.ok) throw new Error('Failed to transfer')
      const { message } = await res.json()
      toast.success(message)
      setSelectedResources(new Set())
      setShowTransferModal(false)
      fetchResources()
    } catch {
      toast.error('Failed to transfer resources')
    } finally {
      setTransferring(false)
    }
  }

  const openTransferModal = () => {
    if (selectedResources.size === 0) {
      toast.error(locale === 'fr' ? 'Sélectionnez au moins une ressource' : 'Select at least one resource')
      return
    }
    fetchPractitionerAccounts()
    setShowTransferModal(true)
    setTransferSearch('')
    setConfirmTarget(null)
  }

  const toggleResource = (id: string) => {
    setSelectedResources(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedResources.size === filteredResources.length) {
      setSelectedResources(new Set())
    } else {
      setSelectedResources(new Set(filteredResources.map(r => r.id)))
    }
  }

  const filtered = practitioners.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    r.owner_name.toLowerCase().includes(resourceSearch.toLowerCase())
  )

  const filteredAccounts = practitionerAccounts.filter(a =>
    a.full_name.toLowerCase().includes(transferSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(transferSearch.toLowerCase())
  )

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      worksheet: locale === 'fr' ? 'Fiche' : 'Worksheet',
      psychoeducation: 'Psychoeducation',
      exercise: locale === 'fr' ? 'Exercice' : 'Exercise',
      assessment: locale === 'fr' ? 'Évaluation' : 'Assessment',
    }
    return labels[type] || type
  }

  const statusColor = (status: string) => {
    if (status === 'published') return 'bg-emerald-50 text-emerald-700'
    if (status === 'draft') return 'bg-gray-100 text-gray-500'
    return 'bg-amber-50 text-amber-700'
  }

  const visibilityColor = (v: string) => {
    if (v === 'onboarding') return 'bg-teal-50 text-teal-700'
    if (v === 'public') return 'bg-blue-50 text-blue-700'
    if (v === 'link_only') return 'bg-purple-50 text-purple-700'
    return 'bg-gray-100 text-gray-500'
  }

  const visibilityLabel = (v: string) => {
    const labels: Record<string, string> = { private: 'Private', public: 'Public', link_only: 'Link', onboarding: 'Onboarding' }
    return labels[v] || v
  }

  const handleVisibilityChange = async (resourceId: string, newVisibility: string) => {
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, visibility: newVisibility }),
      })
      if (!res.ok) throw new Error('Failed')
      setResources(prev => prev.map(r => r.id === resourceId ? { ...r, visibility: newVisibility } : r))
      toast.success(`Visibility changed to ${visibilityLabel(newVisibility)}`)
    } catch {
      toast.error('Failed to update visibility')
    }
  }

  const handleClearResource = async () => {
    if (!clearConfirmId) return
    setClearing(true)
    try {
      const res = await fetch(`/api/admin/resources?resourceId=${clearConfirmId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success(locale === 'fr' ? 'Données effacées' : 'Data cleared')
    } catch {
      toast.error(locale === 'fr' ? 'Échec' : 'Failed to clear')
    }
    setClearing(false)
    setClearConfirmId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />

      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          isAdmin
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Users className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Administration' : 'Admin'}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('practitioners')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'practitioners'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              {locale === 'fr' ? 'Praticiens' : 'Practitioners'}
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'resources'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              {locale === 'fr' ? 'Ressources' : 'Resources'}
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'invite'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              {locale === 'fr' ? 'Inviter' : 'Invite'}
            </button>
          </div>

          {/* ─── Practitioners Tab ─── */}
          {activeTab === 'practitioners' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {locale === 'fr' ? 'Praticiens publics' : 'Public Practitioners'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {locale === 'fr'
                      ? 'Gérer les pages de profil public des praticiens'
                      : 'Manage public practitioner profile pages'}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/admin/practitioners/new')}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Créer nouveau' : 'Create New'}
                </Button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher par nom...' : 'Search by name...'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none bg-white"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {search
                      ? (locale === 'fr' ? 'Aucun résultat' : 'No results')
                      : (locale === 'fr' ? 'Aucun praticien' : 'No practitioners yet')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {search
                      ? (locale === 'fr' ? 'Essayez un autre terme' : 'Try a different search term')
                      : (locale === 'fr' ? 'Créez votre premier profil public' : 'Create your first public practitioner profile')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg overflow-hidden flex-shrink-0">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          p.full_name.charAt(0)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{p.full_name}</h3>
                          {p.credentials && p.credentials.length > 0 && (
                            <span className="text-sm text-gray-500">{p.credentials.join(', ')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">/p/{p.slug}</span>
                          {p.is_published ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              <Globe className="w-3 h-3" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.is_published && (
                          <Link
                            href={`/p/${p.slug}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View public page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => router.push(`/admin/practitioners/${p.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.full_name)}
                          disabled={deleting === p.id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          {deleting === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── Resources Tab ─── */}
          {activeTab === 'resources' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {locale === 'fr' ? 'Toutes les ressources' : 'All Resources'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {locale === 'fr'
                      ? 'Voir et transférer la propriété des ressources'
                      : 'View and transfer resource ownership'}
                  </p>
                </div>
                {selectedResources.size > 0 && (
                  <Button
                    onClick={openTransferModal}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {locale === 'fr'
                      ? `Transférer (${selectedResources.size})`
                      : `Transfer (${selectedResources.size})`}
                  </Button>
                )}
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher par titre ou propriétaire...' : 'Search by title or owner...'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none bg-white"
                />
              </div>

              {resourcesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {resourceSearch
                      ? (locale === 'fr' ? 'Aucun résultat' : 'No results')
                      : (locale === 'fr' ? 'Aucune ressource' : 'No resources yet')}
                  </h3>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[40px_1fr_120px_130px_130px_200px_80px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedResources.size === filteredResources.length && filteredResources.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                    </div>
                    <div>{locale === 'fr' ? 'Titre' : 'Title'}</div>
                    <div>{locale === 'fr' ? 'Type' : 'Type'}</div>
                    <div>{locale === 'fr' ? 'Statut' : 'Status'}</div>
                    <div>{locale === 'fr' ? 'Visibilité' : 'Visibility'}</div>
                    <div>{locale === 'fr' ? 'Propriétaire' : 'Owner'}</div>
                    <div></div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-gray-100">
                    {filteredResources.map((r) => (
                      <div
                        key={r.id}
                        className={`grid grid-cols-[40px_1fr_120px_130px_130px_200px_80px] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedResources.has(r.id) ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => toggleResource(r.id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedResources.has(r.id)}
                            onChange={() => toggleResource(r.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{r.title}</p>
                          {r.category && (
                            <p className="text-xs text-gray-400 mt-0.5">{r.category}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">{typeLabel(r.type)}</span>
                        </div>
                        <div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                            {r.status}
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <select
                            value={r.visibility || 'private'}
                            onChange={(e) => handleVisibilityChange(r.id, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${visibilityColor(r.visibility || 'private')}`}
                          >
                            <option value="private">Private</option>
                            <option value="public">Public</option>
                            <option value="link_only">Link</option>
                            <option value="onboarding">Onboarding</option>
                          </select>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">{r.owner_name}</p>
                          <p className="text-xs text-gray-400 truncate">{r.owner_email}</p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setClearConfirmId(r.id)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {locale === 'fr' ? 'Effacer' : 'Clear'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Invite Tab ─── */}
          {activeTab === 'invite' && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {locale === 'fr' ? 'Inviter un praticien' : 'Invite a Practitioner'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {locale === 'fr'
                    ? 'Envoyez une invitation pour rejoindre Bloomsline Care. Ils seront ajoutés à la liste d\'attente.'
                    : 'Send an invitation to join Bloomsline Care. They\'ll be added to the waitlist.'}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Nom complet' : 'Full name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder={locale === 'fr' ? 'Dr. Marie Dupont' : 'Dr. Jane Smith'}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Adresse email' : 'Email address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="practitioner@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Message personnel (optionnel)' : 'Personal message (optional)'}
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder={locale === 'fr'
                      ? 'Bonjour, je vous invite à découvrir Bloomsline Care...'
                      : 'Hi, I\'d like to invite you to try Bloomsline Care...'}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Langue préférée' : 'Preferred language'}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteLang('fr')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        inviteLang === 'fr'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Français
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteLang('en')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        inviteLang === 'en'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {locale === 'fr' ? 'Envoyer l\'invitation' : 'Send Invitation'}
                    </>
                  )}
                </button>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {locale === 'fr' ? 'Invitations envoyées' : 'Sent Invitations'}
                </h2>
                {invitedLoading ? (
                  <div className="flex items-center gap-2 py-4 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</span>
                  </div>
                ) : invitedList.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">
                    {locale === 'fr' ? 'Aucune invitation envoyée' : 'No invitations sent yet'}
                  </p>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {invitedList.map((inv) => {
                      const sc = statusColors[inv.status] || statusColors.pending
                      return (
                        <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {inv.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{inv.name}</p>
                            <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                          </div>
                          <select
                            value={inv.status || 'pending'}
                            onChange={(e) => handleStatusSelect(inv.id, inv.name, inv.status, e.target.value)}
                            className={`text-[11px] font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300 ${sc.bg} ${sc.text}`}
                          >
                            {statusOptions.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {new Date(inv.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Clear Confirmation Modal */}
      {clearConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {locale === 'fr' ? 'Effacer toutes les données ?' : 'Clear all data?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr'
                ? 'Cela supprimera tous les partages, réponses et assignations pour cette ressource. Cette action est irréversible.'
                : 'This will delete all shares, responses, and assignments for this resource. This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setClearConfirmId(null)}
                disabled={clearing}
                className="rounded-xl"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                onClick={handleClearResource}
                disabled={clearing}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {clearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {locale === 'fr' ? 'Effacer' : 'Clear'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {locale === 'fr' ? 'Transférer les ressources' : 'Transfer Resources'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {locale === 'fr'
                    ? `${selectedResources.size} ressource(s) sélectionnée(s)`
                    : `${selectedResources.size} resource(s) selected`}
                </p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher un praticien...' : 'Search practitioner...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none bg-white text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  {practitionerAccounts.length === 0
                    ? (locale === 'fr' ? 'Chargement...' : 'Loading...')
                    : (locale === 'fr' ? 'Aucun praticien trouvé' : 'No practitioners found')}
                </div>
              ) : (
                filteredAccounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setConfirmTarget(a)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      confirmTarget?.id === a.id
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                      confirmTarget?.id === a.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {a.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${confirmTarget?.id === a.id ? 'text-white' : 'text-gray-900'}`}>{a.full_name}</p>
                      <p className={`text-xs truncate ${confirmTarget?.id === a.id ? 'text-white/70' : 'text-gray-500'}`}>{a.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Confirmation footer */}
            {confirmTarget && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <p className="text-sm text-gray-600 mb-3">
                  {locale === 'fr'
                    ? `Transférer ${selectedResources.size} ressource(s) à ${confirmTarget.full_name} ?`
                    : `Transfer ${selectedResources.size} resource(s) to ${confirmTarget.full_name}?`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmTarget(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleTransfer(confirmTarget.id)}
                    disabled={transferring}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {transferring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        {locale === 'fr' ? 'Confirmer' : 'Confirm'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Change Confirmation */}
      {confirmStatusChange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Confirmer le changement' : 'Confirm Change'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {locale === 'fr'
                ? `Changer le statut de "${confirmStatusChange.name}" ?`
                : `Change status for "${confirmStatusChange.name}"?`}
            </p>
            <div className="flex items-center gap-2 mb-5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${(statusColors[confirmStatusChange.from] || statusColors.pending).bg} ${(statusColors[confirmStatusChange.from] || statusColors.pending).text}`}>
                {confirmStatusChange.from}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${(statusColors[confirmStatusChange.to] || statusColors.pending).bg} ${(statusColors[confirmStatusChange.to] || statusColors.pending).text}`}>
                {confirmStatusChange.to}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmStatusChange(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={confirmStatus}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {locale === 'fr' ? 'Confirmer' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
