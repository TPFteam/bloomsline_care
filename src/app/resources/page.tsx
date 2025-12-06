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
  Share2,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  ClipboardCheck,
  Puzzle,
  Sun,
  BookOpen,
  FileText,
  Clock,
  Users,
  Star,
  Sparkles,
  Loader2,
  Lock,
  Globe,
  X,
  Briefcase,
  Lightbulb,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar } from '@/components/app-sidebar'
import { sampleLibraryResources } from '@/lib/data/sampleLibraryResources'
import { formatDuration } from '@/types/library'
import type { LibraryResource, ResourceType, UserResource } from '@/types/library'
import { getResources, deleteResource } from '@/lib/services/resources'
import { getCollections, createCollection, deleteCollection } from '@/lib/services/collections'
import type { Resource } from '@/types/resource'
import type { Collection, CollectionColor, CollectionIcon, collectionColorConfig } from '@/types/collection'
import type { Member } from '@/types/member'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/browser-client'

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
  blue: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-100/80',
    text: 'text-blue-700',
    iconBg: 'bg-blue-50',
  },
  red: {
    gradient: 'from-red-400 to-red-600',
    bg: 'bg-red-100/80',
    text: 'text-red-700',
    iconBg: 'bg-red-50',
  },
  emerald: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-100/80',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
  },
  amber: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-100/80',
    text: 'text-amber-700',
    iconBg: 'bg-amber-50',
  },
  purple: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-100/80',
    text: 'text-purple-700',
    iconBg: 'bg-purple-50',
  },
  pink: {
    gradient: 'from-pink-400 to-pink-600',
    bg: 'bg-pink-100/80',
    text: 'text-pink-700',
    iconBg: 'bg-pink-50',
  },
  slate: {
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-100/80',
    text: 'text-slate-700',
    iconBg: 'bg-slate-50',
  },
}

// Type icons
const typeIcons: Record<ResourceType, React.ElementType> = {
  assessment: ClipboardCheck,
  activity: Puzzle,
  ritual: Sun,
  educational: BookOpen,
  template: FileText,
}

// Enhanced type config with gradients matching Member Hub style
const typeConfig: Record<ResourceType, {
  gradient: string
  bg: string
  text: string
  iconBg: string
  glow: string
}> = {
  assessment: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100/80',
    glow: 'shadow-blue-200/50',
  },
  activity: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
  },
  ritual: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100/80',
    glow: 'shadow-amber-200/50',
  },
  educational: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100/80',
    glow: 'shadow-purple-200/50',
  },
  template: {
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    iconBg: 'bg-slate-100/80',
    glow: 'shadow-slate-200/50',
  },
}

// Resource type icons for database resources
const dbResourceTypeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  assessment: ClipboardCheck,
  exercise: Puzzle,
  psychoeducation: BookOpen,
}

// Resource type config for database resources
const dbResourceTypeConfig: Record<string, {
  gradient: string
  bg: string
  text: string
  iconBg: string
  glow: string
}> = {
  worksheet: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100/80',
    glow: 'shadow-blue-200/50',
  },
  assessment: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100/80',
    glow: 'shadow-purple-200/50',
  },
  exercise: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
  },
  psychoeducation: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100/80',
    glow: 'shadow-amber-200/50',
  },
}

type TabType = 'saved' | 'created' | 'shared'

export default function MyResourcesPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [dbResources, setDbResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [newCollectionColor, setNewCollectionColor] = useState<CollectionColor>('blue')
  const [newCollectionIcon, setNewCollectionIcon] = useState<CollectionIcon>('folder')

  // Share with member state
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedResourceToShare, setSelectedResourceToShare] = useState<Resource | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // Fetch resources from database
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const resources = await getResources()
        setDbResources(resources)
      } catch (error) {
        console.error('Error fetching resources:', error)
        toast.error(locale === 'fr' ? 'Erreur lors du chargement des ressources' : 'Error loading resources')
      } finally {
        setIsLoading(false)
      }
    }
    fetchResources()
  }, [locale])

  // Fetch collections from database
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsData = await getCollections()
        setCollections(collectionsData)
      } catch (error) {
        console.error('Error fetching collections:', error)
        // Don't show error toast - collections table might not exist yet
      } finally {
        setIsLoadingCollections(false)
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
      setNewCollectionColor('blue')
      setNewCollectionIcon('folder')
      toast.success(locale === 'fr' ? 'Collection créée' : 'Collection created')
    } catch (error) {
      console.error('Error creating collection:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la création' : 'Error creating collection')
    } finally {
      setIsCreatingCollection(false)
    }
  }

  // Handle delete collection
  const handleDeleteCollection = async (id: string) => {
    if (!confirm(locale === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette collection?' : 'Are you sure you want to delete this collection?')) {
      return
    }
    try {
      await deleteCollection(id)
      setCollections(prev => prev.filter(c => c.id !== id))
      toast.success(locale === 'fr' ? 'Collection supprimée' : 'Collection deleted')
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting collection')
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette ressource?' : 'Are you sure you want to delete this resource?')) {
      return
    }
    setIsDeleting(id)
    try {
      await deleteResource(id)
      setDbResources(prev => prev.filter(r => r.id !== id))
      toast.success(locale === 'fr' ? 'Ressource supprimée' : 'Resource deleted')
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting resource')
    } finally {
      setIsDeleting(null)
    }
  }

  // Open share modal and fetch members
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

        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('practitioner_id', user.id)
          .order('first_name', { ascending: true })

        if (error) throw error
        setMembers(data || [])
      } catch (error) {
        console.error('Error fetching members:', error)
        toast.error(locale === 'fr' ? 'Erreur lors du chargement des membres' : 'Error loading members')
      } finally {
        setIsLoadingMembers(false)
      }
    }
  }

  // Share resource with member
  const handleShareResource = async () => {
    if (!selectedResourceToShare || !selectedMemberId) {
      toast.error(locale === 'fr' ? 'Veuillez sélectionner un membre' : 'Please select a member')
      return
    }

    setIsSharing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Insert into member_shared_resources table
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
          toast.error(locale === 'fr' ? 'Cette ressource est déjà partagée avec ce membre' : 'This resource is already shared with this member')
        } else {
          throw error
        }
        return
      }

      toast.success(locale === 'fr' ? 'Ressource partagée avec succès' : 'Resource shared successfully')
      setShowShareModal(false)
      setSelectedResourceToShare(null)
      setSelectedMemberId(null)
      setShareMessage('')
    } catch (error) {
      console.error('Error sharing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du partage' : 'Error sharing resource')
    } finally {
      setIsSharing(false)
    }
  }

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery) return members
    const query = memberSearchQuery.toLowerCase()
    return members.filter(m =>
      m.first_name.toLowerCase().includes(query) ||
      m.last_name.toLowerCase().includes(query) ||
      (m.email || '').toLowerCase().includes(query)
    )
  }, [members, memberSearchQuery])

  // Demo: first 5 resources are "saved"
  const savedResources = useMemo(() => {
    const saved = sampleLibraryResources.slice(0, 5)
    if (!searchQuery) return saved
    const query = searchQuery.toLowerCase()
    return saved.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // User-created resources from database
  const createdResources = useMemo(() => {
    if (!searchQuery) return dbResources
    const query = searchQuery.toLowerCase()
    return dbResources.filter(r =>
      r.title.toLowerCase().includes(query) ||
      (r.description || '').toLowerCase().includes(query)
    )
  }, [searchQuery, dbResources])

  // Shared resources (empty for demo)
  const sharedResources: LibraryResource[] = []

  const tabs = [
    { id: 'created' as TabType, label: t.library.myResources.tabs.created, count: createdResources.length, icon: FolderOpen },
    { id: 'saved' as TabType, label: t.library.myResources.tabs.saved, count: savedResources.length, icon: Bookmark },
    { id: 'shared' as TabType, label: t.library.myResources.tabs.shared, count: sharedResources.length, icon: Share2 },
  ]

  // Stats
  const stats = {
    saved: sampleLibraryResources.slice(0, 5).length,
    created: dbResources.length,
    collections: collections.length,
  }

  return (
    <div className="min-h-screen gradient-mesh relative flex">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-coral-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-mint-200/20 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-80 p-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-coral-100/80 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center shadow-lg shadow-coral-200/50">
                <Heart className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.library.myResources.title}</h1>
              <p className="text-gray-600">{t.library.myResources.subtitle}</p>
            </div>
          </div>
          <Link href="/resources/create">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="sm" className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lg shadow-lavender-200/50 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                {t.library.create.title}
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 hover-lift cursor-default group shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lavender-100/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-md">
                  <Bookmark className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.saved}</p>
                <p className="text-sm text-gray-500">{t.library.stats.savedItems}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 hover-lift cursor-default group shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                  <FolderOpen className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.created}</p>
                <p className="text-sm text-gray-500">{t.library.stats.myCreations}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 hover-lift cursor-default group shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.collections}</p>
                <p className="text-sm text-gray-500">{t.library.stats.collections}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-gray-100/80 rounded-xl p-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-md shadow-lavender-200/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.library.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {savedResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedResources.map((resource) => (
                    <SavedResourceCard
                      key={resource.id}
                      resource={resource}
                      onView={() => router.push(`/library/${resource.id}`)}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bookmark}
                  title={t.library.myResources.noSaved}
                  description={t.library.myResources.noSavedDescription}
                  actionLabel={t.library.empty.browseButton}
                  onAction={() => router.push('/library')}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'created' && (
            <motion.div
              key="created"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-lavender-500" />
                </div>
              ) : createdResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {createdResources.map((resource) => (
                    <DbResourceCard
                      key={resource.id}
                      resource={resource}
                      onEdit={() => router.push(`/resources/${resource.id}/edit`)}
                      onPreview={() => router.push(`/resources/${resource.id}`)}
                      onDelete={() => handleDelete(resource.id)}
                      onShare={() => handleOpenShareModal(resource)}
                      isDeleting={isDeleting === resource.id}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title={t.library.myResources.noCreated}
                  description={t.library.myResources.noCreatedDescription}
                  actionLabel={t.library.create.title}
                  onAction={() => router.push('/resources/create')}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'shared' && (
            <motion.div
              key="shared"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <EmptyState
                icon={Share2}
                title={t.library.myResources.noShared}
                description={t.library.myResources.noSharedDescription}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collections Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-lavender-400 to-lavender-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t.library.collections.title}</h2>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateCollectionModal(true)}
                className="rounded-xl border-2 border-lavender-200 hover:border-lavender-300 hover:bg-lavender-50"
              >
                <Plus className="w-4 h-4 mr-2 text-lavender-600" />
                <span className="text-lavender-700">{t.library.collections.createCollection}</span>
              </Button>
            </motion.div>
          </div>

          {isLoadingCollections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-lavender-500" />
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {collections.map((collection) => {
                const IconComponent = collectionIcons[collection.icon as CollectionIcon] || FolderOpen
                const config = colorConfig[collection.color as CollectionColor] || colorConfig.blue
                return (
                  <motion.div
                    key={collection.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => router.push(`/resources/collections/${collection.id}`)}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5 cursor-pointer hover:shadow-xl transition-all group relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{collection.name}</h3>
                        <p className="text-sm text-gray-500">
                          {collection.resource_count || 0} {locale === 'fr' ? 'ressources' : 'resources'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/resources/collections/${collection.id}`)
                            }}
                            className="rounded-lg"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {locale === 'fr' ? 'Voir' : 'View'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <Pencil className="w-4 h-4 mr-2" />
                            {locale === 'fr' ? 'Modifier' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCollection(collection.id)
                            }}
                            className="text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {locale === 'fr' ? 'Supprimer' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {collection.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-1">{collection.description}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100/80 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === 'fr' ? 'Aucune collection' : 'No collections yet'}
              </h3>
              <p className="text-gray-500 mb-4 text-sm max-w-sm mx-auto">
                {locale === 'fr'
                  ? 'Créez des collections pour organiser vos ressources'
                  : 'Create collections to organize your resources'}
              </p>
              <Button
                onClick={() => setShowCreateCollectionModal(true)}
                className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.library.collections.createCollection}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Create Collection Modal */}
        <AnimatePresence>
          {showCreateCollectionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateCollectionModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {locale === 'fr' ? 'Nouvelle collection' : 'New Collection'}
                  </h2>
                  <button
                    onClick={() => setShowCreateCollectionModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Nom' : 'Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder={locale === 'fr' ? 'Ex: Outils pour l\'anxiété' : 'e.g., Anxiety Tools'}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Description' : 'Description'}
                    </label>
                    <textarea
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      placeholder={locale === 'fr' ? 'Description optionnelle...' : 'Optional description...'}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Couleur' : 'Color'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(colorConfig) as CollectionColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewCollectionColor(color)}
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorConfig[color].gradient} transition-all ${
                            newCollectionColor === color
                              ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                              : 'hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Icône' : 'Icon'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(collectionIcons) as CollectionIcon[]).map((icon) => {
                        const IconComp = collectionIcons[icon]
                        return (
                          <button
                            key={icon}
                            onClick={() => setNewCollectionIcon(icon)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                              newCollectionIcon === icon
                                ? `${colorConfig[newCollectionColor].bg} ${colorConfig[newCollectionColor].text} ring-2 ring-offset-1 ring-gray-300`
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Aperçu' : 'Preview'}
                    </label>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colorConfig[newCollectionColor].bg} flex items-center justify-center`}>
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorConfig[newCollectionColor].gradient} flex items-center justify-center`}>
                            {(() => {
                              const PreviewIcon = collectionIcons[newCollectionIcon]
                              return <PreviewIcon className="w-3.5 h-3.5 text-white" />
                            })()}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {newCollectionName || (locale === 'fr' ? 'Nom de la collection' : 'Collection name')}
                          </p>
                          <p className="text-xs text-gray-500">0 {locale === 'fr' ? 'ressources' : 'resources'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateCollectionModal(false)}
                    className="rounded-xl"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim() || isCreatingCollection}
                    className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 rounded-xl"
                  >
                    {isCreatingCollection ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {locale === 'fr' ? 'Création...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Créer' : 'Create'}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share with Member Modal */}
        <AnimatePresence>
          {showShareModal && selectedResourceToShare && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {locale === 'fr' ? 'Partager avec un membre' : 'Share with Member'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedResourceToShare.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  {/* Search Members */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Rechercher un membre' : 'Search Member'}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Members List */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Sélectionner un membre' : 'Select a Member'}
                    </label>
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-lavender-500" />
                      </div>
                    ) : filteredMembers.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                              selectedMemberId === member.id
                                ? 'border-lavender-500 bg-lavender-50'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              selectedMemberId === member.id
                                ? 'bg-lavender-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {member.first_name[0]}{member.last_name[0]}
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-medium text-gray-900">
                                {member.first_name} {member.last_name}
                              </p>
                              {member.email && (
                                <p className="text-xs text-gray-500">{member.email}</p>
                              )}
                            </div>
                            {selectedMemberId === member.id && (
                              <div className="w-5 h-5 rounded-full bg-lavender-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Aucun membre trouvé' : 'No members found'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Message (optionnel)' : 'Message (optional)'}
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder={locale === 'fr' ? 'Ajouter un message personnel...' : 'Add a personal message...'}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareModal(false)}
                    className="rounded-xl"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleShareResource}
                    disabled={!selectedMemberId || isSharing}
                    className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 rounded-xl"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {locale === 'fr' ? 'Partage...' : 'Sharing...'}
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Partager' : 'Share'}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// Saved Resource Card Component
function SavedResourceCard({
  resource,
  onView,
  t,
}: {
  resource: LibraryResource
  onView: () => void
  t: any
}) {
  const TypeIcon = typeIcons[resource.type] || FileText
  const config = typeConfig[resource.type] || typeConfig.template

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={onView} className="rounded-lg">
                <Eye className="w-4 h-4 mr-2" />
                {t.library.resource.viewDetails}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t.library.resource.useWithClient}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 rounded-lg">
                <Trash2 className="w-4 h-4 mr-2" />
                {t.library.resource.unsave}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{resource.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{resource.description}</p>

        <div className="flex items-center gap-2 flex-wrap">
          {resource.duration_minutes && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
              <Clock className="w-3 h-3 text-gray-400" />
              {formatDuration(resource.duration_minutes)}
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
            <Users className="w-3 h-3 text-gray-400" />
            {t.library.ageGroups[resource.age_group]}
          </span>
          {resource.rating && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-xs text-amber-700">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {resource.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Database Resource Card Component
function DbResourceCard({
  resource,
  onEdit,
  onPreview,
  onDelete,
  onShare,
  isDeleting,
  locale,
  t,
}: {
  resource: Resource
  onEdit: () => void
  onPreview: () => void
  onDelete: () => void
  onShare: () => void
  isDeleting: boolean
  locale: 'en' | 'fr'
  t: any
}) {
  const TypeIcon = dbResourceTypeIcons[resource.type] || FileText
  const config = dbResourceTypeConfig[resource.type] || dbResourceTypeConfig.worksheet

  const typeLabels: Record<string, { en: string; fr: string }> = {
    worksheet: { en: 'Worksheet', fr: 'Feuille de travail' },
    assessment: { en: 'Assessment', fr: 'Évaluation' },
    exercise: { en: 'Exercise', fr: 'Exercice' },
    psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation' },
  }

  const statusLabels: Record<string, { en: string; fr: string }> = {
    draft: { en: 'Draft', fr: 'Brouillon' },
    published: { en: 'Published', fr: 'Publié' },
    archived: { en: 'Archived', fr: 'Archivé' },
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden cursor-pointer hover:shadow-xl transition-all group ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Visibility Badge */}
            {resource.visibility === 'public' ? (
              <Badge className="text-xs bg-blue-100 text-blue-700 border-0 shadow-sm">
                <Globe className="w-3 h-3 mr-1" />
                {locale === 'fr' ? 'Public' : 'Public'}
              </Badge>
            ) : (
              <Badge className="text-xs bg-gray-100 text-gray-600 border-0 shadow-sm">
                <Lock className="w-3 h-3 mr-1" />
                {locale === 'fr' ? 'Privé' : 'Private'}
              </Badge>
            )}
            {/* Status Badge */}
            <Badge className={`text-xs border-0 shadow-sm ${
              resource.status === 'published'
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white'
                : resource.status === 'archived'
                ? 'bg-gray-200 text-gray-600'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {statusLabels[resource.status]?.[locale] || resource.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onPreview} className="rounded-lg">
                  <Eye className="w-4 h-4 mr-2" />
                  {t.library.create.preview}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} className="rounded-lg">
                  <Pencil className="w-4 h-4 mr-2" />
                  {t.library.create.editTitle}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare} className="rounded-lg text-lavender-600">
                  <Users className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Partager avec un membre' : 'Share with Member'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600 rounded-lg">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Supprimer' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 cursor-pointer" onClick={onPreview}>{resource.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{resource.description || (locale === 'fr' ? 'Aucune description' : 'No description')}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 ${config.bg} ${config.text} rounded-lg`}>
              {typeLabels[resource.type]?.[locale] || resource.type}
            </span>
            {resource.category && (
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                {resource.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{resource.blocks.length} {locale === 'fr' ? 'blocs' : 'blocks'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Created Resource Card Component (for UserResource type - library resources)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CreatedResourceCard({
  resource,
  onEdit,
  t,
}: {
  resource: UserResource
  onEdit: () => void
  t: any
}) {
  const TypeIcon = typeIcons[resource.type] || FileText
  const config = typeConfig[resource.type] || typeConfig.template

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resource.is_shared && (
              <Badge className="text-xs bg-gradient-to-r from-emerald-400 to-emerald-600 text-white border-0 shadow-sm">
                <Share2 className="w-3 h-3 mr-1" />
                {t.library.share.shared}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onEdit} className="rounded-lg">
                  <Pencil className="w-4 h-4 mr-2" />
                  {t.library.create.editTitle}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg">
                  <Eye className="w-4 h-4 mr-2" />
                  {t.library.create.preview}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg">
                  <Share2 className="w-4 h-4 mr-2" />
                  {resource.is_shared ? t.library.share.unshareButton : t.library.share.shareButton}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 rounded-lg">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{resource.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{resource.description}</p>

        <div className="flex flex-wrap gap-2">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 bg-lavender-50 text-lavender-700 rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 rounded-2xl bg-gray-100/80 flex items-center justify-center mx-auto mb-5">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-inner">
          <Icon className="w-7 h-7 text-gray-500" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onAction}
            className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lg shadow-lavender-200/50 rounded-xl px-6 py-2.5"
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
