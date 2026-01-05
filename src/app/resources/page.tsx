'use client'

import { useState, useMemo, useEffect } from 'react'
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
  Users,
  Share2,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { getResources, deleteResource } from '@/lib/services/resources'
import { getCollections, createCollection, removeResourceFromAllCollections, getSavedResources, addResourceToCollection } from '@/lib/services/collections'
import type { Resource } from '@/types/resource'
import type { Collection, CollectionColor, CollectionIcon, collectionColorConfig } from '@/types/collection'
import type { Member } from '@/types/member'
import type { User } from '@/types/user'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'
import { notifyResourceShared } from '@/lib/notifications'
import { ResourceCard } from '@/components/resources/ResourceCard'

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
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'fr'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'worksheet' | 'psychoeducation' | 'exercise' | 'table'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Resources state
  const [dbResources, setDbResources] = useState<Resource[]>([])
  const [savedDbResources, setSavedDbResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
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
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')


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

  // Handle share modal
  const handleOpenShareModal = async (resource: Resource) => {
    setSelectedResourceToShare(resource)
    setShowShareModal(true)
    setSelectedMemberId(null)
    setShareMessage('')
    setMemberSearchQuery('')

    if (members.length === 0) {
      setIsLoadingMembers(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('members')
          .select('*')
          .eq('practitioner_id', user.id)
          .order('first_name', { ascending: true })
        setMembers(data || [])
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setIsLoadingMembers(false)
      }
    }
  }

  // Handle share resource
  const handleShareResource = async () => {
    if (!selectedResourceToShare || !selectedMemberId) return
    setIsSharing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('member_shared_resources')
        .insert({
          member_id: selectedMemberId,
          resource_id: selectedResourceToShare.id,
          practitioner_id: user.id,
          message: shareMessage.trim() || null,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error(locale === 'fr' ? 'Déjà partagé' : 'Already shared')
        } else {
          throw error
        }
        return
      }

      // Send notification
      try {
        const [memberResult, practitionerResult] = await Promise.all([
          supabase.from('members').select('user_id').eq('id', selectedMemberId).single(),
          supabase.from('users').select('full_name').eq('id', user.id).single(),
        ])
        if (memberResult.data?.user_id) {
          await notifyResourceShared(supabase, {
            memberId: selectedMemberId,
            memberUserId: memberResult.data.user_id,
            resourceId: selectedResourceToShare.id,
            resourceTitle: selectedResourceToShare.title,
            resourceType: selectedResourceToShare.type,
            practitionerName: practitionerResult.data?.full_name || 'Your practitioner',
            message: shareMessage.trim() || undefined,
          })
        }
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError)
      }

      toast.success(locale === 'fr' ? 'Ressource partagée' : 'Resource shared')
      setShowShareModal(false)
    } catch (error) {
      console.error('Error sharing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
    } finally {
      setIsSharing(false)
    }
  }

  // Filter members
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery) return members
    const query = memberSearchQuery.toLowerCase()
    return members.filter(m =>
      m.first_name.toLowerCase().includes(query) ||
      m.last_name.toLowerCase().includes(query)
    )
  }, [members, memberSearchQuery])

  // Filter resources
  const savedResources = useMemo(() => {
    let filtered = savedDbResources
    if (languageFilter !== 'all') filtered = filtered.filter(r => r.language === languageFilter)
    if (typeFilter !== 'all') filtered = filtered.filter(r => r.type === typeFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => r.title.toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query))
    }
    return filtered
  }, [savedDbResources, searchQuery, languageFilter, typeFilter])

  const createdResources = useMemo(() => {
    let filtered = dbResources
    if (languageFilter !== 'all') filtered = filtered.filter(r => r.language === languageFilter)
    if (typeFilter !== 'all') filtered = filtered.filter(r => r.type === typeFilter)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => r.title.toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query))
    }
    return filtered
  }, [dbResources, searchQuery, languageFilter, typeFilter])

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || languageFilter !== 'all'

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
      <main className="flex-1 ml-64">
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
              <Link href="/library">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{locale === 'fr' ? 'Explorer' : 'Explore'}</span>
                </div>
              </Link>
              <Link href="/resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium text-sm">
                  <span>{locale === 'fr' ? 'Mes ressources' : 'My Resources'}</span>
                </div>
              </Link>
            </div>

            <div className="text-sm text-gray-500">
              {createdResources.length} {locale === 'fr' ? 'ressources créées' : 'resources created'}
            </div>
          </div>

          {/* Sub-tabs for My Resources */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveSubTab('created')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSubTab === 'created'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {locale === 'fr' ? 'Créées' : 'Created'} ({createdResources.length})
            </button>
            <button
              onClick={() => setActiveSubTab('saved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSubTab === 'saved'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {locale === 'fr' ? 'Enregistrées' : 'Saved'} ({savedResources.length})
            </button>
          </div>

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

            <div className="relative">
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
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setTypeFilter('all'); setLanguageFilter('all') }}
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
                        onEdit={() => router.push(`/resources/create/${resource.type}?edit=${resource.id}`)}
                        onPreview={() => router.push(`/resources/${resource.id}`)}
                        onDelete={() => handleDelete(resource.id)}
                        onShare={() => handleOpenShareModal(resource)}
                        isDeleting={isDeleting === resource.id}
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
                        onShare={() => handleOpenShareModal(resource)}
                        isRemoving={isRemoving === resource.id}
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
                      {locale === 'fr' ? 'Explorez la bibliothèque' : 'Explore the library'}
                    </p>
                    <Link href="/library">
                      <Button variant="outline" className="rounded-xl">
                        {locale === 'fr' ? 'Explorer' : 'Explore'}
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
      <AnimatePresence>
        {showShareModal && selectedResourceToShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold">{locale === 'fr' ? 'Partager' : 'Share'}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedResourceToShare.title}</p>
                </div>
                <button onClick={() => setShowShareModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                {isLoadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredMembers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${
                          selectedMemberId === member.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedMemberId === member.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium">{member.first_name} {member.last_name}</p>
                          {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                        </div>
                        {selectedMemberId === member.id && <Check className="w-5 h-5" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucun membre' : 'No members'}</p>
                  </div>
                )}
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder={locale === 'fr' ? 'Message (optionnel)' : 'Message (optional)'}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none"
                />
              </div>
              <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
                <Button variant="outline" onClick={() => setShowShareModal(false)} className="flex-1 rounded-xl">
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleShareResource}
                  disabled={!selectedMemberId || isSharing}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {isSharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {locale === 'fr' ? 'Partager' : 'Share'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
