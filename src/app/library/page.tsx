'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  BookOpen,
  FileText,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Loader2,
  Table2,
  Check,
  Mail,
  Phone,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhoneInput } from '@/components/ui/phone-input'
import { toast } from 'sonner'
import { getCollections, addResourceToCollection, createCollection, getSavedResources, removeResourceFromAllCollections } from '@/lib/services/collections'
// Notification + email for resource sharing handled by Supabase edge function
import type { Collection } from '@/types/collection'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import type { ResourceCategory } from '@/types/library'
import { getResources, createResource } from '@/lib/services/resources'
import type { Resource } from '@/types/resource'
import { createClient } from '@/lib/supabase/browser-client'
import { ResourceCard, ResourceCardList } from '@/components/resources/ResourceCard'
import type { User } from '@/types/user'

// Simple member type for sharing
interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url: string | null
  status: string
}

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

export default function LibraryPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  // User state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Database resource filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'worksheet' | 'psychoeducation' | 'exercise' | 'table'>('all')
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'fr'>('all')
  const [showDbFilters, setShowDbFilters] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Public resources from database
  const [publicResources, setPublicResources] = useState<Resource[]>([])
  const [isLoadingPublic, setIsLoadingPublic] = useState(true)

  // Collections for "Add to Collection" dropdown
  const [collections, setCollections] = useState<Collection[]>([])

  // Members for "Share with Members" dropdown
  const [members, setMembers] = useState<SimpleMember[]>([])
  const [memberGroups, setMemberGroups] = useState<{ id: string; name: string; color: string; member_ids: string[] }[]>([])

  // Bookmarked resources tracking
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [isBookmarking, setIsBookmarking] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)

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

  // Fetch public resources and collections
  useEffect(() => {
    const fetchPublicResources = async () => {
      try {
        const resources = await getResources({ publicOnly: true })
        setPublicResources(resources)
      } catch (error) {
        console.error('Error fetching public resources:', error)
      } finally {
        setIsLoadingPublic(false)
      }
    }
    fetchPublicResources()
  }, [])

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await getCollections()
        setCollections(data)
      } catch (error) {
        console.error('Error fetching collections:', error)
      }
    }
    fetchCollections()
  }, [])

  // Fetch saved resources to highlight bookmarked items
  useEffect(() => {
    const fetchSavedResourceIds = async () => {
      try {
        const savedResources = await getSavedResources()
        const savedIds = new Set(savedResources.map(r => r.id))
        setBookmarkedIds(savedIds)
      } catch (error) {
        console.error('Error fetching saved resources:', error)
      }
    }
    fetchSavedResourceIds()
  }, [])

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowDbFilters(false)
      }
    }
    if (showDbFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDbFilters])

  // Fetch members function
  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, avatar_url, status')
        .eq('practitioner_id', user.id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('first_name', { ascending: true })

      if (error) {
        if (error.code === '42P01') return
        throw error
      }

      setMembers(data || [])

      // Fetch member groups
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
      console.error('Error fetching members:', error)
    }
  }

  // Fetch members on mount
  useEffect(() => {
    fetchMembers()
  }, [supabase])

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMember.firstName.trim() || !newMember.lastName.trim()) {
      toast.error(locale === 'fr'
        ? 'Le prénom et le nom sont requis'
        : 'First name and last name are required')
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
        email: newMember.email.trim() || null,
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

  // Filter public database resources
  const filteredPublicResources = useMemo(() => {
    let filtered = publicResources

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.description || '').toLowerCase().includes(query)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter)
    }

    if (languageFilter !== 'all') {
      filtered = filtered.filter(r => r.language === languageFilter)
    }

    // Pin onboarding resources to the top
    return filtered.sort((a, b) => {
      const aOnboarding = (a as any).visibility === 'onboarding' ? 0 : 1
      const bOnboarding = (b as any).visibility === 'onboarding' ? 0 : 1
      return aOnboarding - bOnboarding
    })
  }, [publicResources, searchQuery, typeFilter, languageFilter])

  // Get stats
  const stats = useMemo(() => ({
    total: publicResources.length,
    filtered: filteredPublicResources.length,
    categories: allCategories.length,
  }), [filteredPublicResources, publicResources])

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || languageFilter !== 'all'

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setLanguageFilter('all')
  }

  // Handle adding resource to collection
  const handleAddToCollection = async (resourceId: string, collectionId: string) => {
    try {
      await addResourceToCollection(collectionId, resourceId)
      toast.success(locale === 'fr' ? 'Ressource ajoutée à la collection' : 'Resource added to collection')
    } catch (error) {
      console.error('Error adding to collection:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding to collection')
    }
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

  // Handle quick bookmark (toggle add/remove)
  const handleBookmark = async (resourceId: string) => {
    if (isBookmarking) return

    setIsBookmarking(resourceId)
    try {
      // If already bookmarked, remove it
      if (bookmarkedIds.has(resourceId)) {
        await removeResourceFromAllCollections(resourceId)
        setBookmarkedIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(resourceId)
          return newSet
        })
        toast.success(locale === 'fr' ? 'Retiré des favoris' : 'Removed from favorites')
        return
      }

      // Otherwise, add it
      let targetCollectionId: string

      if (collections.length > 0) {
        targetCollectionId = collections[0].id
      } else {
        const newCollection = await createCollection({
          name: locale === 'fr' ? 'Mes favoris' : 'My Favorites',
          description: locale === 'fr' ? 'Ressources enregistrées de la bibliothèque' : 'Saved resources from the library',
          color: 'amber',
          icon: 'bookmark',
        })
        setCollections([newCollection])
        targetCollectionId = newCollection.id
      }

      try {
        await addResourceToCollection(targetCollectionId, resourceId)
        setBookmarkedIds(prev => new Set([...prev, resourceId]))
        toast.success(locale === 'fr' ? 'Ajouté aux favoris!' : 'Added to favorites!')
      } catch (addError: any) {
        if (addError?.code === '23505') {
          setBookmarkedIds(prev => new Set([...prev, resourceId]))
          toast.info(locale === 'fr' ? 'Déjà dans vos favoris' : 'Already in your favorites')
        } else {
          throw addError
        }
      }
    } catch (error) {
      console.error('Error bookmarking resource:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
    } finally {
      setIsBookmarking(null)
    }
  }

  // Generate duplicate title
  const generateDuplicateTitle = (originalTitle: string): string => {
    const copyLabel = locale === 'fr' ? 'Copie' : 'Copy'
    const copyPattern = locale === 'fr' ? /\(Copie(?: (\d+))?\)$/ : /\(Copy(?: (\d+))?\)$/

    const match = originalTitle.match(copyPattern)
    if (match) {
      const currentNum = match[1] ? parseInt(match[1]) : 1
      const newNum = currentNum + 1
      return originalTitle.replace(copyPattern, `(${copyLabel} ${newNum})`)
    } else {
      return `${originalTitle} (${copyLabel})`
    }
  }

  // Handle duplicate resource from library
  const handleDuplicate = async (resource: Resource) => {
    setIsDuplicating(resource.id)
    try {
      await createResource({
        type: resource.type,
        title: generateDuplicateTitle(resource.title),
        description: resource.description,
        category: resource.category,
        tags: resource.tags,
        blocks: resource.blocks,
        settings: resource.settings,
        status: 'draft',
        visibility: 'private',
        language: resource.language,
      })

      toast.success(locale === 'fr' ? 'Ressource dupliquée dans vos ressources' : 'Resource duplicated to your resources')
    } catch (error) {
      console.error('Error duplicating resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la duplication' : 'Error duplicating resource')
    } finally {
      setIsDuplicating(null)
    }
  }


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
              <BookOpen className="w-4 h-4" strokeWidth={2.5} />
              <span>{locale === 'fr' ? 'Bibliothèque' : 'Library'}</span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          {/* Tabs Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              {/* My Resources Tab */}
              <Link href="/resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <span>{locale === 'fr' ? 'Mes ressources' : 'My Resources'}</span>
                </div>
              </Link>

              {/* Explore Tab - Active */}
              <Link href="/library">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{locale === 'fr' ? 'Explorer' : 'Explore'}</span>
                </div>
              </Link>

              {/* Shared Tab */}
              <Link href="/shared-resources">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <span>{locale === 'fr' ? 'Partagés' : 'Shared'}</span>
                </div>
              </Link>
            </div>

            {/* Stats */}
            <div className="text-sm text-gray-500">
              {stats.total} {locale === 'fr' ? 'ressources disponibles' : 'resources available'}
            </div>
          </div>

          {/* Search and Filters Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={locale === 'fr' ? 'Rechercher des ressources...' : 'Search resources...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setShowDbFilters(!showDbFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  hasActiveFilters
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {locale === 'fr' ? 'Filtres' : 'Filters'}
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-white text-gray-900 text-xs flex items-center justify-center">
                    {(typeFilter !== 'all' ? 1 : 0) + (languageFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              <AnimatePresence>
                {showDbFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                  >
                    {/* Type Filter */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {locale === 'fr' ? 'Type' : 'Type'}
                      </label>
                      <div className="space-y-1">
                        {[
                          { value: 'all', label: locale === 'fr' ? 'Tous' : 'All', icon: null },
                          { value: 'worksheet', label: locale === 'fr' ? 'Exercices' : 'Worksheets', icon: FileText },
                          { value: 'table', label: locale === 'fr' ? 'Tableaux' : 'Tables', icon: Table2 },
                          { value: 'psychoeducation', label: locale === 'fr' ? 'Éducation' : 'Education', icon: BookOpen },
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setTypeFilter(item.value as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                              typeFilter === item.value
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {item.icon && <item.icon className="w-4 h-4" />}
                            {!item.icon && <div className="w-4 h-4" />}
                            <span className="flex-1 text-left">{item.label}</span>
                            {typeFilter === item.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language Filter */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {locale === 'fr' ? 'Langue' : 'Language'}
                      </label>
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
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                              languageFilter === item.value
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex-1 text-left">{item.label}</span>
                            {languageFilter === item.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                      >
                        {locale === 'fr' ? 'Effacer les filtres' : 'Clear filters'}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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

            {/* Create Button */}
            <Link href="/resources/create">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4">
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Créer une ressource' : 'Create a Resource'}
              </Button>
            </Link>
          </motion.div>

          {/* Results Count */}
          {hasActiveFilters && (
            <p className="text-sm text-gray-500 mb-4">
              {stats.filtered} {locale === 'fr' ? 'résultats sur' : 'of'} {stats.total}
            </p>
          )}

          {/* Loading */}
          {isLoadingPublic && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</span>
            </div>
          )}

          {/* Resources Grid */}
          {!isLoadingPublic && filteredPublicResources.length > 0 && (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-4'
            }>
              <AnimatePresence mode="popLayout">
                {filteredPublicResources.map((resource, index) => (
                  viewMode === 'grid' ? (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      locale={locale}
                      variant="library"
                      index={index}
                      members={members}
                      groups={memberGroups}
                      onShareWithMembers={handleShareWithMembers}
                      onAddMember={() => setShowAddMemberModal(true)}
                      onBookmark={handleBookmark}
                      onDuplicate={() => handleDuplicate(resource)}
                      isBookmarked={bookmarkedIds.has(resource.id)}
                      isDuplicating={isDuplicating === resource.id}
                      showCuratedBadge={resource.is_curated === true}
                    />
                  ) : (
                    <ResourceCardList
                      key={resource.id}
                      resource={resource}
                      locale={locale}
                      variant="library"
                      index={index}
                      onBookmark={handleBookmark}
                      onDuplicate={() => handleDuplicate(resource)}
                      isBookmarked={bookmarkedIds.has(resource.id)}
                      isDuplicating={isDuplicating === resource.id}
                      showCuratedBadge={resource.is_curated === true}
                    />
                  )
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPublic && filteredPublicResources.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === 'fr' ? 'Aucun résultat' : 'No results found'}
              </h2>
              <p className="text-gray-500 mb-4">
                {locale === 'fr' ? 'Essayez d\'ajuster vos filtres' : 'Try adjusting your filters'}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                  {locale === 'fr' ? 'Effacer les filtres' : 'Clear filters'}
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </main>

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
                      Email
                      <span className="text-gray-400 font-normal text-xs">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                      placeholder={locale === 'fr' ? 'jean@exemple.com' : 'john@example.com'}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {locale === 'fr' ? 'Téléphone' : 'Phone'}
                      <span className="text-gray-400 font-normal text-xs">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                    </label>
                    <PhoneInput
                      value={newMember.phone}
                      onChange={(v) => setNewMember({ ...newMember, phone: v })}
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
