'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  Plus,
  FolderOpen,
  Heart,
  Search,
  BookOpen,
  Loader2,
  X,
  Briefcase,
  Lightbulb,
  Brain,
  SlidersHorizontal,
  Check,
  Star,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Save,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { getResources, deleteResource, createResource } from '@/lib/services/resources'
import { getCollections, createCollection, removeResourceFromAllCollections, getSavedResources, addResourceToCollection } from '@/lib/services/collections'
import type { Resource } from '@/types/resource'
import type { Collection, CollectionColor, CollectionIcon, collectionColorConfig } from '@/types/collection'
import type { User } from '@/types/user'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'
// Notification + email for resource sharing handled by Supabase edge function
import { ResourceCard } from '@/components/resources/ResourceCard'
import { ShareResourceModal } from '@/components/resources/ShareResourceModal'

// Simple member type for sharing
interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url?: string | null
}

// Collection icon mapping
const collectionIcons: Record<CollectionIcon, React.ElementType> = {
  folder: FolderOpen,
  heart: Heart,
  star: Star,
  bookmark: Bookmark,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
  brain: Brain,
}

// Collection color config
const colorConfig: typeof collectionColorConfig = {
  blue: { gradient: 'from-blue-400 to-blue-600', bg: 'bg-blue-100/80', text: 'text-blue-700', iconBg: 'bg-blue-50' },
  red: { gradient: 'from-red-400 to-red-600', bg: 'bg-red-100/80', text: 'text-red-700', iconBg: 'bg-red-50' },
  emerald: { gradient: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-100/80', text: 'text-emerald-700', iconBg: 'bg-emerald-50' },
  amber: { gradient: 'from-amber-400 to-amber-600', bg: 'bg-amber-100/80', text: 'text-amber-700', iconBg: 'bg-amber-50' },
  purple: { gradient: 'from-purple-400 to-purple-600', bg: 'bg-purple-100/80', text: 'text-purple-700', iconBg: 'bg-purple-50' },
  pink: { gradient: 'from-pink-400 to-pink-600', bg: 'bg-pink-100/80', text: 'text-pink-700', iconBg: 'bg-pink-50' },
  slate: { gradient: 'from-slate-400 to-slate-600', bg: 'bg-slate-100/80', text: 'text-slate-700', iconBg: 'bg-slate-50' },
}

type SubTab = 'created' | 'saved' | 'collections'
type SortOption = 'recent_edited' | 'recent_created' | 'title_asc' | 'title_desc'

export default function MyResourcesPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  // User state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Sub-tab state (within My Resources)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'worksheet' | 'psychoeducation' | 'exercise' | 'table'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('recent_edited')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Resources state
  const [dbResources, setDbResources] = useState<Resource[]>([])
  const [savedDbResources, setSavedDbResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([])
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [newCollectionColor, setNewCollectionColor] = useState<CollectionColor>('blue')
  const [newCollectionIcon, setNewCollectionIcon] = useState<CollectionIcon>('folder')

  // Share state
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedResourceToShare, setSelectedResourceToShare] = useState<Resource | null>(null)
  const [members, setMembers] = useState<SimpleMember[]>([])
  const [memberGroups, setMemberGroups] = useState<{ id: string; name: string; color: string; member_ids: string[] }[]>([])

  // Add Member Modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [savingMember, setSavingMember] = useState(false)


  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/sign-in')
        return
      }

      setCurrentUserId(authUser.id)

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userProfile) {
        if (userProfile.user_type === 'member') {
          router.replace('/home')
          return
        }
        setUser(userProfile)
      }
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const resources = await getResources({ myResourcesOnly: true })
        setDbResources(resources)
      } catch (error) {
        console.error('Error fetching resources:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchResources()
  }, [])

  // Fetch saved resources
  useEffect(() => {
    const fetchSavedResources = async () => {
      try {
        const saved = await getSavedResources()
        setSavedDbResources(saved)
      } catch (error) {
        console.error('Error fetching saved resources:', error)
      } finally {
        setIsLoadingSaved(false)
      }
    }
    fetchSavedResources()
  }, [])

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsData = await getCollections()
        setCollections(collectionsData)
      } catch (error) {
        console.error('Error fetching collections:', error)
      }
    }
    fetchCollections()
  }, [])

  // Close filter and sort dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }

    if (showFilters || showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters, showSortDropdown])

  // Handle create collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error(locale === 'fr' ? 'Le nom est requis' : 'Name is required')
      return
    }
    setIsCreatingCollection(true)
    try {
      const newCollection = await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        color: newCollectionColor,
        icon: newCollectionIcon,
      })
      setCollections(prev => [newCollection, ...prev])
      setShowCreateCollectionModal(false)
      setNewCollectionName('')
      setNewCollectionDescription('')
      toast.success(locale === 'fr' ? 'Collection créée' : 'Collection created')
    } catch (error) {
      console.error('Error creating collection:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating collection')
    } finally {
      setIsCreatingCollection(false)
    }
  }

  // Handle delete resource
  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'fr' ? 'Supprimer cette ressource?' : 'Delete this resource?')) return
    setIsDeleting(id)
    try {
      await deleteResource(id)
      setDbResources(prev => prev.filter(r => r.id !== id))
      toast.success(locale === 'fr' ? 'Ressource supprimée' : 'Resource deleted')
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
    } finally {
      setIsDeleting(null)
    }
  }

  // Generate duplicate title
  const generateDuplicateTitle = (originalTitle: string): string => {
    const copyLabel = locale === 'fr' ? 'Copie' : 'Copy'
    const copyPattern = locale === 'fr' ? /\(Copie(?: (\d+))?\)$/ : /\(Copy(?: (\d+))?\)$/

    const match = originalTitle.match(copyPattern)
    if (match) {
      // Already has (Copy) or (Copy N) - increment the number
      const currentNum = match[1] ? parseInt(match[1]) : 1
      const newNum = currentNum + 1
      return originalTitle.replace(copyPattern, `(${copyLabel} ${newNum})`)
    } else {
      // No copy suffix - add (Copy)
      return `${originalTitle} (${copyLabel})`
    }
  }

  // Handle duplicate resource
  const handleDuplicate = async (resource: Resource) => {
    setIsDuplicating(resource.id)
    try {
      const duplicatedResource = await createResource({
        type: resource.type,
        title: generateDuplicateTitle(resource.title),
        description: resource.description,
        category: resource.category,
        tags: resource.tags,
        blocks: resource.blocks,
        settings: resource.settings,
        status: 'draft', // Always start as draft
        visibility: 'private', // Always start as private
        language: resource.language,
      })

      // Add the new resource to the list
      setDbResources(prev => [duplicatedResource, ...prev])
      toast.success(locale === 'fr' ? 'Ressource dupliquée' : 'Resource duplicated')
    } catch (error) {
      console.error('Error duplicating resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la duplication' : 'Error duplicating resource')
    } finally {
      setIsDuplicating(null)
    }
  }

  // Handle remove from library
  const handleRemoveFromLibrary = async (id: string) => {
    if (!confirm(locale === 'fr' ? 'Retirer de votre bibliothèque?' : 'Remove from your library?')) return
    setIsRemoving(id)
    try {
      await removeResourceFromAllCollections(id)
      setSavedDbResources(prev => prev.filter(r => r.id !== id))
      toast.success(locale === 'fr' ? 'Ressource retirée' : 'Resource removed')
    } catch (error) {
      console.error('Error removing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
    } finally {
      setIsRemoving(null)
    }
  }

  // Handle add to collection
  const handleAddToCollection = async (resourceId: string, collectionId: string) => {
    try {
      await addResourceToCollection(collectionId, resourceId)
      toast.success(locale === 'fr' ? 'Ajouté à la collection' : 'Added to collection')
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.info(locale === 'fr' ? 'Déjà dans cette collection' : 'Already in this collection')
      } else {
        toast.error(locale === 'fr' ? 'Erreur' : 'Error')
      }
    }
  }

  // Fetch members function
  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('practitioner_id', user.id)
        .eq('status', 'active')
        .order('first_name', { ascending: true })
      setMembers(data || [])

    } catch (error) {
      console.error('Error fetching members:', error)
    }

    // Fetch member groups (separate try/catch so it doesn't block members)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: groups } = await supabase
        .from('member_groups')
        .select('id, name, color')
        .eq('practitioner_id', user.id)
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
          name: g.name,
          color: g.color,
          member_ids: membersByGroup[g.id] || [],
        })))
      }
    } catch (error) {
      console.error('Error fetching member groups:', error)
    }
  }

  // Fetch members on mount
  useEffect(() => {
    fetchMembers()
  }, [supabase])

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMember.firstName.trim() || !newMember.lastName.trim() || !newMember.email.trim()) {
      toast.error(locale === 'fr'
        ? 'Le prénom, le nom et l\'email sont requis'
        : 'First name, last name, and email are required')
      return
    }

    setSavingMember(true)

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
        status: 'active' as const,
        engagement_level: 'medium' as const,
      }

      const { error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // Reset form and close modal
      setNewMember({ firstName: '', lastName: '', email: '', phone: '' })
      setShowAddMemberModal(false)
      toast.success(locale === 'fr' ? 'Patient créé avec succès!' : 'Member created successfully!')

      // Refresh members list
      await fetchMembers()
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating member')
    } finally {
      setSavingMember(false)
    }
  }

  // Handle share modal
  const handleOpenShareModal = (resource: Resource) => {
    setSelectedResourceToShare(resource)
    setShowShareModal(true)
  }

  // Handle share with multiple members
  const handleShareWithMembers = async (resourceId: string, memberIds: string[], message?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get resource info for notifications
      const { data: resourceData } = await supabase
        .from('resources')
        .select('title, type')
        .eq('id', resourceId)
        .single()

      // Get practitioner name for notifications
      const { data: practitionerData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      let successCount = 0
      let alreadySharedCount = 0

      // Share with each member
      for (const memberId of memberIds) {
        const { error } = await supabase
          .from('member_shared_resources')
          .insert({
            member_id: memberId,
            resource_id: resourceId,
            practitioner_id: user.id,
            shared_at: new Date().toISOString(),
            message: message || null,
          })

        if (error) {
          if (error.code === '23505') {
            alreadySharedCount++
            continue
          }
          console.error('Error sharing with member:', error)
          continue
        }

        successCount++

        // Notification + email handled by Supabase edge function (on_resource_shared webhook)
      }

      // Show appropriate toast
      if (successCount > 0) {
        toast.success(
          locale === 'fr'
            ? `Ressource partagée avec ${successCount} patient${successCount > 1 ? 's' : ''}`
            : `Resource shared with ${successCount} member${successCount > 1 ? 's' : ''}`
        )
      }
      if (alreadySharedCount > 0) {
        toast.info(
          locale === 'fr'
            ? `Déjà partagée avec ${alreadySharedCount} patient${alreadySharedCount > 1 ? 's' : ''}`
            : `Already shared with ${alreadySharedCount} member${alreadySharedCount > 1 ? 's' : ''}`
        )
      }
    } catch (error) {
      console.error('Error sharing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du partage' : 'Error sharing resource')
    }
  }

  // Sort function
  const sortResources = (resources: Resource[]) => {
    return [...resources].sort((a, b) => {
      switch (sortBy) {
        case 'recent_edited':
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        case 'recent_created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'title_desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })
  }

  // Filter resources
  const savedResources = useMemo(() => {
    let filtered = savedDbResources
    if (languageFilter !== 'all') filtered = filtered.filter(r => r.language === languageFilter)
    if (typeFilter !== 'all') filtered = filtered.filter(r => r.type === typeFilter)
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => r.title.toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query))
    }
    return sortResources(filtered)
  }, [savedDbResources, searchQuery, languageFilter, typeFilter, statusFilter, sortBy])

  const createdResources = useMemo(() => {
    let filtered = dbResources
    if (languageFilter !== 'all') filtered = filtered.filter(r => r.language === languageFilter)
    if (typeFilter !== 'all') filtered = filtered.filter(r => r.type === typeFilter)
    if (statusFilter !== 'all') filtered = filtered.filter(r => r.status === statusFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => r.title.toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query))
    }
    return sortResources(filtered)
  }, [dbResources, searchQuery, languageFilter, typeFilter, statusFilter, sortBy])

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || languageFilter !== 'all' || statusFilter !== 'all'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">{t.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="library" />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <FolderOpen className="w-4 h-4" strokeWidth={2.5} />
              <span>{locale === 'fr' ? 'Mes ressources' : 'My Resources'}</span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          {/* Tabs Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <Link href="/resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium text-sm">
                  <span>{locale === 'fr' ? 'Mes ressources' : 'My Resources'}</span>
                </div>
              </Link>
              {/* Explore tab — hidden for now */}
              <Link href="/shared-resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <span>{locale === 'fr' ? 'Partagés' : 'Shared'}</span>
                </div>
              </Link>
            </div>

            <div className="text-sm text-gray-500">
              {createdResources.length} {locale === 'fr' ? 'ressources créées' : 'resources created'}
            </div>
          </div>

          {/* Sub-tabs — hidden for now (only Created remains, no need for tab) */}

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {sortBy === 'recent_edited' && (locale === 'fr' ? 'Récemment modifié' : 'Recently edited')}
                  {sortBy === 'recent_created' && (locale === 'fr' ? 'Récemment créé' : 'Recently created')}
                  {sortBy === 'title_asc' && (locale === 'fr' ? 'Titre A-Z' : 'Title A-Z')}
                  {sortBy === 'title_desc' && (locale === 'fr' ? 'Titre Z-A' : 'Title Z-A')}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                  >
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                      {locale === 'fr' ? 'Trier par' : 'Sort by'}
                    </div>
                    {[
                      { value: 'recent_edited', label: locale === 'fr' ? 'Récemment modifié' : 'Recently edited' },
                      { value: 'recent_created', label: locale === 'fr' ? 'Récemment créé' : 'Recently created' },
                      { value: 'title_asc', label: locale === 'fr' ? 'Titre A-Z' : 'Title A-Z' },
                      { value: 'title_desc', label: locale === 'fr' ? 'Titre Z-A' : 'Title Z-A' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setSortBy(item.value as SortOption)
                          setShowSortDropdown(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${
                          sortBy === item.value ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex-1 text-left">{item.label}</span>
                        {sortBy === item.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  hasActiveFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {locale === 'fr' ? 'Filtres' : 'Filters'}
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                  >
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Type</label>
                      <div className="space-y-1">
                        {[
                          { value: 'all', label: locale === 'fr' ? 'Tous' : 'All' },
                          { value: 'worksheet', label: locale === 'fr' ? 'Exercices' : 'Worksheets' },
                          { value: 'table', label: locale === 'fr' ? 'Tableaux' : 'Tables' },
                          { value: 'psychoeducation', label: locale === 'fr' ? 'Éducation' : 'Education' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setTypeFilter(item.value as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              typeFilter === item.value ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex-1 text-left">{item.label}</span>
                            {typeFilter === item.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">{locale === 'fr' ? 'Langue' : 'Language'}</label>
                      <div className="space-y-1">
                        {[
                          { value: 'all', label: locale === 'fr' ? 'Toutes' : 'All' },
                          { value: 'en', label: 'English' },
                          { value: 'fr', label: 'Français' },
                          { value: 'es', label: 'Español' },
                          { value: 'de', label: 'Deutsch' },
                          { value: 'it', label: 'Italiano' },
                          { value: 'pt', label: 'Português' },
                          { value: 'nl', label: 'Nederlands' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setLanguageFilter(item.value as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              languageFilter === item.value ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex-1 text-left">{item.label}</span>
                            {languageFilter === item.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">{locale === 'fr' ? 'Statut' : 'Status'}</label>
                      <div className="space-y-1">
                        {[
                          { value: 'all', label: locale === 'fr' ? 'Tous' : 'All' },
                          { value: 'draft', label: locale === 'fr' ? 'Brouillon' : 'Draft' },
                          { value: 'published', label: locale === 'fr' ? 'Publié' : 'Published' },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setStatusFilter(item.value as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                              statusFilter === item.value ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex-1 text-left">{item.label}</span>
                            {statusFilter === item.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setTypeFilter('all'); setLanguageFilter('all'); setStatusFilter('all') }}
                        className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        {locale === 'fr' ? 'Effacer' : 'Clear'}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Link href="/resources/create">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4">
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Créer' : 'Create'}
              </Button>
            </Link>
          </div>

          {/* Content based on sub-tab */}
          <AnimatePresence mode="wait">
            {activeSubTab === 'created' && (
              <motion.div key="created" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : createdResources.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-3'}>
                    {createdResources.map((resource, index) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        locale={locale}
                        variant="owned"
                        index={index}
                        viewMode={viewMode}
                        onEdit={() => router.push(`/resources/create/worksheet?edit=${resource.id}`)}
                        onPreview={() => router.push(`/resources/${resource.id}`)}
                        onDelete={() => handleDelete(resource.id)}
                        onDuplicate={() => handleDuplicate(resource)}
                        onShare={() => handleOpenShareModal(resource)}
                        isDeleting={isDeleting === resource.id}
                        isDuplicating={isDuplicating === resource.id}
                        isOwner={currentUserId === resource.practitioner_id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {locale === 'fr' ? 'Aucune ressource créée' : 'No resources created'}
                    </h2>
                    <p className="text-gray-500 mb-4">
                      {locale === 'fr' ? 'Créez votre première ressource' : 'Create your first resource'}
                    </p>
                    <Link href="/resources/create">
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Créer' : 'Create'}
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

            {activeSubTab === 'saved' && (
              <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isLoadingSaved ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : savedResources.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-3'}>
                    {savedResources.map((resource, index) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        locale={locale}
                        variant="saved"
                        index={index}
                        viewMode={viewMode}
                        onPreview={() => router.push(`/resources/${resource.id}`)}
                        onRemove={() => handleRemoveFromLibrary(resource.id)}
                        onDuplicate={() => handleDuplicate(resource)}
                        onShare={() => handleOpenShareModal(resource)}
                        isRemoving={isRemoving === resource.id}
                        isDuplicating={isDuplicating === resource.id}
                        isOwner={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {locale === 'fr' ? 'Aucune ressource enregistrée' : 'No saved resources'}
                    </h2>
                    <p className="text-gray-500 mb-4">
                      {locale === 'fr' ? 'Créez votre première ressource' : 'Create your first resource'}
                    </p>
                    <Link href="/resources/create">
                      <Button variant="outline" className="rounded-xl">
                        {locale === 'fr' ? 'Créer' : 'Create'}
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreateCollectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateCollectionModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">{locale === 'fr' ? 'Nouvelle collection' : 'New Collection'}</h2>
                <button onClick={() => setShowCreateCollectionModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{locale === 'fr' ? 'Nom' : 'Name'}</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{locale === 'fr' ? 'Couleur' : 'Color'}</label>
                  <div className="flex gap-2">
                    {(Object.keys(colorConfig) as CollectionColor[]).map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCollectionColor(color)}
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorConfig[color].gradient} ${
                          newCollectionColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{locale === 'fr' ? 'Icône' : 'Icon'}</label>
                  <div className="flex gap-2">
                    {(Object.keys(collectionIcons) as CollectionIcon[]).map((icon) => {
                      const IconComp = collectionIcons[icon]
                      return (
                        <button
                          key={icon}
                          onClick={() => setNewCollectionIcon(icon)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            newCollectionIcon === icon ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-150'
                          }`}
                        >
                          <IconComp className="w-5 h-5 text-gray-600" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
                <Button variant="outline" onClick={() => setShowCreateCollectionModal(false)} className="flex-1 rounded-xl">
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isCreatingCollection}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {isCreatingCollection ? <Loader2 className="w-4 h-4 animate-spin" /> : locale === 'fr' ? 'Créer' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {selectedResourceToShare && (
        <ShareResourceModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          resource={selectedResourceToShare}
          members={members}
          locale={locale}
          onShare={handleShareWithMembers}
          onAddMember={() => setShowAddMemberModal(true)}
          groups={memberGroups}
        />
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
            onClick={() => setShowAddMemberModal(false)}
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
                  {locale === 'fr' ? 'Nouveau Patient' : 'New Member'}
                </h2>
                <button
                  onClick={() => setShowAddMemberModal(false)}
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
                        {locale === 'fr' ? 'Prénom' : 'First Name'} *
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
                        {locale === 'fr' ? 'Nom' : 'Last Name'} *
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
                      Email *
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
                      {locale === 'fr' ? 'Téléphone' : 'Phone'}
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
                    onClick={() => setShowAddMemberModal(false)}
                    className="text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingMember}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 text-sm"
                  >
                    {savingMember ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {locale === 'fr' ? 'Création...' : 'Creating...'}
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
