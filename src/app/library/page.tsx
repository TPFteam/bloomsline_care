'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  ClipboardCheck,
  Puzzle,
  Sun,
  BookOpen,
  FileText,
  Bookmark,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  Eye,
  TrendingUp,
  Library,
  Loader2,
  MoreHorizontal,
  FolderPlus,
  Users,
} from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { getCollections, addResourceToCollection } from '@/lib/services/collections'
import type { Collection } from '@/types/collection'
import { useLanguage } from '@/lib/i18n/context'
import { AppSidebar } from '@/components/app-sidebar'
import type { ResourceType, ResourceCategory, AgeGroup, DifficultyLevel } from '@/types/library'
import { getResources } from '@/lib/services/resources'
import type { Resource } from '@/types/resource'
import { getMemberFullName, getMemberInitials } from '@/types/member'
import { createClient } from '@/lib/supabase/browser-client'

// Simple member type for sharing
interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url: string | null
  status: string
}

// Type icons for filter chips
const typeIcons: Record<ResourceType, React.ElementType> = {
  assessment: ClipboardCheck,
  activity: Puzzle,
  ritual: Sun,
  educational: BookOpen,
  template: FileText,
}

const typeConfig: Record<ResourceType, { gradient: string; bg: string; text: string; iconBg: string; glow: string }> = {
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

const allTypes: ResourceType[] = ['assessment', 'activity', 'ritual', 'educational', 'template']

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

const allAgeGroups: AgeGroup[] = ['children', 'teens', 'adults', 'all']

const allDifficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced']

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

export default function LibraryPage() {
  const { t, locale } = useLanguage()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<ResourceCategory[]>([])
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Public resources from database
  const [publicResources, setPublicResources] = useState<Resource[]>([])
  const [isLoadingPublic, setIsLoadingPublic] = useState(true)

  // Collections for "Add to Collection" dropdown
  const [collections, setCollections] = useState<Collection[]>([])

  // Members for "Share with Members" dropdown
  const [members, setMembers] = useState<SimpleMember[]>([])

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

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, email, avatar_url, status')
          .eq('practitioner_id', user.id)
          .eq('status', 'active')
          .order('first_name', { ascending: true })

        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist yet
            return
          }
          throw error
        }

        setMembers(data || [])
      } catch (error) {
        console.error('Error fetching members:', error)
      }
    }
    fetchMembers()
  }, [])

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

    // Note: database resources use different type names
    // We can add more filtering logic here as needed

    return filtered
  }, [publicResources, searchQuery])

  // Get stats
  const stats = useMemo(() => ({
    total: publicResources.length,
    filtered: filteredPublicResources.length,
    categories: allCategories.length,
  }), [filteredPublicResources, publicResources])

  // Type filter toggle
  const toggleType = (type: ResourceType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // Category filter toggle
  const toggleCategory = (category: ResourceCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedCategories([])
    setSelectedAgeGroup(null)
    setSelectedDifficulty(null)
  }

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedTypes.length > 0 || selectedCategories.length > 0 || selectedAgeGroup || selectedDifficulty

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

  // Handle share with specific member
  const handleShareWithMember = async (resourceId: string, memberId: string, memberName: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Insert into member_shared_resources table
      const { error } = await supabase
        .from('member_shared_resources')
        .insert({
          member_id: memberId,
          resource_id: resourceId,
          practitioner_id: user.id,
          shared_at: new Date().toISOString(),
        })

      if (error) {
        // Check if it's a duplicate error (resource already shared)
        if (error.code === '23505') {
          toast.info(
            locale === 'fr'
              ? `Cette ressource a déjà été partagée avec ${memberName}`
              : `This resource has already been shared with ${memberName}`
          )
          return
        }
        throw error
      }

      toast.success(
        locale === 'fr'
          ? `Ressource partagée avec ${memberName}`
          : `Resource shared with ${memberName}`
      )
    } catch (error) {
      console.error('Error sharing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du partage' : 'Error sharing resource')
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-80 p-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-mint-100/80 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center shadow-lg shadow-mint-200/50">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {t.library.title}
                <AnimatedIcon icon={Sparkles} animation="sparkle" size={24} animateOnHover animateOnRender={false} className="text-mint-400" />
              </h1>
              <p className="text-gray-600">{t.library.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/resources">
              <Button variant="ghost" className="glass-subtle rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/60">
                <AnimatedIcon icon={Bookmark} animation="scale" size={16} animateOnHover animateOnRender={false} className="mr-2" />
                {t.library.myResources.title}
              </Button>
            </Link>
            <Link href="/resources/create">
              <Button className="bg-gradient-to-r from-mint-500 via-mint-500 to-emerald-500 hover:from-mint-600 hover:via-mint-600 hover:to-emerald-600 text-white shadow-xl shadow-mint-300/30 border-0 rounded-xl px-6 py-3 text-base font-medium hover-lift">
                <AnimatedIcon icon={Plus} animation="scale" size={20} animateOnHover animateOnRender={false} className="mr-2" />
                {t.library.create.title}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Library, value: stats.total, label: t.library.stats.totalResources, gradient: 'from-mint-400 to-mint-600', iconBg: 'bg-mint-100/80' },
            { icon: Puzzle, value: stats.categories, label: t.library.stats.categories, gradient: 'from-lavender-400 to-lavender-600', iconBg: 'bg-lavender-100/80' },
            { icon: TrendingUp, value: stats.filtered, label: locale === 'fr' ? 'Résultats' : 'Results', gradient: 'from-amber-400 to-amber-600', iconBg: 'bg-amber-100/80' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 hover-lift cursor-default group shadow-lg shadow-gray-200/40 border border-white/60"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                  <AnimatedIcon icon={stat.icon} animation="scale" size={18} animateOnHover animateOnRender={false} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-4 mb-6 shadow-lg shadow-gray-200/30 border border-white/60"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <AnimatedIcon icon={Search} animation="scale" size={20} animateOnHover animateOnRender={false} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.library.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-50/80 border border-gray-100/80 focus:bg-white focus:border-mint-300 focus:ring-2 focus:ring-mint-100 outline-none transition-all text-sm placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle & View Mode */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-full px-5 py-2.5 transition-all duration-300 ${
                  showFilters
                    ? 'bg-gradient-to-r from-mint-500 to-emerald-500 text-white shadow-lg shadow-mint-200/50'
                    : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {t.library.filters.title}
                {hasActiveFilters && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    showFilters ? 'bg-white/20 text-white' : 'bg-mint-100 text-mint-700'
                  }`}>
                    {selectedTypes.length + selectedCategories.length + (selectedAgeGroup ? 1 : 0) + (selectedDifficulty ? 1 : 0)}
                  </span>
                )}
              </Button>

              <div className="flex items-center bg-gray-50/80 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-full transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-white text-mint-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-full transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-white text-mint-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {allTypes.map((type) => {
              const Icon = typeIcons[type]
              const config = typeConfig[type]
              const isSelected = selectedTypes.includes(type)
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ${config.glow}`
                      : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80 hover:shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.library.types[type]}
                </motion.button>
              )
            })}
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100/60 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.library.filters.category}
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {allCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            selectedCategories.includes(category)
                              ? 'bg-gradient-to-r from-mint-500 to-emerald-500 text-white shadow-md'
                              : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
                          }`}
                        >
                          {t.library.categories[category]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.library.filters.ageGroup}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allAgeGroups.map((age) => (
                        <button
                          key={age}
                          onClick={() => setSelectedAgeGroup(selectedAgeGroup === age ? null : age)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            selectedAgeGroup === age
                              ? 'bg-gradient-to-r from-lavender-500 to-indigo-500 text-white shadow-md'
                              : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
                          }`}
                        >
                          {t.library.ageGroups[age]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {t.library.filters.difficulty}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allDifficulties.map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            selectedDifficulty === diff
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                              : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
                          }`}
                        >
                          {t.library.difficulty[diff]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-100/60 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-500 hover:text-gray-700 rounded-full"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t.library.filters.clearAll}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-gray-500 mb-4"
            >
              {t.library.search.resultsCount
                .replace('{count}', String(stats.filtered))
                .replace('{total}', String(stats.total))}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Loading indicator for resources */}
        {isLoadingPublic && (
          <div className="flex items-center justify-center py-8 mb-8">
            <Loader2 className="w-6 h-6 animate-spin text-mint-500 mr-2" />
            <span className="text-gray-500">{locale === 'fr' ? 'Chargement des ressources...' : 'Loading resources...'}</span>
          </div>
        )}

        {/* Curated Library Section */}
        {filteredPublicResources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-mint-500" />
              <h2 className="text-lg font-bold text-gray-900">
                {locale === 'fr' ? 'Bibliothèque' : 'Curated Library'}
              </h2>
              <Badge className="bg-mint-100 text-mint-700 text-xs">
                {filteredPublicResources.length}
              </Badge>
            </div>
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-4'
            }>
              <AnimatePresence mode="popLayout">
                {filteredPublicResources.map((resource, index) => (
                  <LibraryResourceCard
                    key={resource.id}
                    resource={resource}
                    index={index}
                    viewMode={viewMode}
                    locale={locale}
                    collections={collections}
                    members={members}
                    onAddToCollection={handleAddToCollection}
                    onShareWithMember={handleShareWithMember}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredPublicResources.length === 0 && !isLoadingPublic && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-12 max-w-md mx-auto shadow-xl shadow-gray-200/40 border border-white/60">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t.library.search.noResults}
              </h2>
              <p className="text-gray-500 mb-6">
                {t.library.search.noResultsDescription}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-mint-500 to-emerald-500 hover:from-mint-600 hover:to-emerald-600 text-white shadow-lg shadow-mint-200/30 rounded-xl px-6"
                >
                  {t.library.filters.clearAll}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Featured Section */}
        {!hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">Featured Resources</h2>
            </div>
            <div className="bg-gradient-to-r from-mint-50/80 via-white/60 to-lavender-50/80 backdrop-blur-xl rounded-[1.5rem] p-8 border border-white/60 shadow-lg shadow-gray-200/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { emoji: '🎯', title: 'Evidence-Based', desc: 'All resources are grounded in research and best practices' },
                  { emoji: '✏️', title: 'Customizable', desc: 'Duplicate and adapt resources to fit your clients needs' },
                  { emoji: '🔄', title: 'Always Growing', desc: 'New resources added regularly by our expert team' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="text-center group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

// Library Resource Card Component (for database resources)
function LibraryResourceCard({
  resource,
  index,
  viewMode,
  locale,
  collections,
  members,
  onAddToCollection,
  onShareWithMember,
}: {
  resource: Resource
  index: number
  viewMode: 'grid' | 'list'
  locale: 'en' | 'fr'
  collections: Collection[]
  members: SimpleMember[]
  onAddToCollection: (resourceId: string, collectionId: string) => void
  onShareWithMember: (resourceId: string, memberId: string, memberName: string) => void
}) {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)
  const TypeIcon = dbResourceTypeIcons[resource.type] || FileText
  const config = dbResourceTypeConfig[resource.type] || dbResourceTypeConfig.worksheet

  const handleClick = () => {
    router.push(`/resources/${resource.id}`)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const typeLabels: Record<string, { en: string; fr: string }> = {
    worksheet: { en: 'Worksheet', fr: 'Exercice' },
    assessment: { en: 'Assessment', fr: 'Évaluation' },
    exercise: { en: 'Exercise', fr: 'Exercice' },
    psychoeducation: { en: 'Education', fr: 'Éducation' },
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        whileHover={{ y: -2 }}
        className="group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={handleClick}
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 cursor-pointer transition-all duration-300 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-gray-200/60 border border-white/60 flex items-center gap-5">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-mint-700 transition-colors">
                {resource.title}
              </h3>
              <Badge className="bg-mint-100 text-mint-700 text-xs border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                {locale === 'fr' ? 'Curé' : 'Curated'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1">{resource.description || (locale === 'fr' ? 'Aucune description' : 'No description')}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-400 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs ${config.bg} ${config.text}`}>
              {typeLabels[resource.type]?.[locale] || resource.type}
            </span>

            {/* Actions Menu */}
            <div onClick={handleMenuClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <FolderPlus className="w-4 h-4" />
                      {locale === 'fr' ? 'Ajouter à collection' : 'Add to Collection'}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48">
                      {collections.length === 0 ? (
                        <DropdownMenuItem disabled className="text-gray-400 text-sm">
                          {locale === 'fr' ? 'Aucune collection' : 'No collections yet'}
                        </DropdownMenuItem>
                      ) : (
                        collections.map((collection) => (
                          <DropdownMenuItem
                            key={collection.id}
                            onClick={() => onAddToCollection(resource.id, collection.id)}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-3 h-3 rounded-full bg-${collection.color}-400`} />
                            {collection.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {locale === 'fr' ? 'Partager avec membre' : 'Share with Member'}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 max-h-60 overflow-y-auto">
                      {members.length === 0 ? (
                        <DropdownMenuItem disabled className="text-gray-400 text-sm">
                          {locale === 'fr' ? 'Aucun membre' : 'No members yet'}
                        </DropdownMenuItem>
                      ) : (
                        members.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            onClick={() => onShareWithMember(resource.id, member.id, getMemberFullName(member))}
                            className="flex items-center gap-2"
                          >
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-mint-100 flex items-center justify-center text-[10px] font-medium text-mint-700">
                                {getMemberInitials(member)}
                              </div>
                            )}
                            <span className="truncate">{getMemberFullName(member)}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] overflow-hidden cursor-pointer transition-all duration-300 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-gray-200/60 border border-white/60">
        {/* Header with icon */}
        <div className={`h-24 ${config.bg} relative flex items-center justify-center`}>
          <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border border-white/40`}>
              {typeLabels[resource.type]?.[locale] || resource.type}
            </span>
          </div>

          {/* Curated Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-mint-100 text-mint-700 text-xs border-0 shadow-md">
              <Sparkles className="w-3 h-3 mr-1" />
              {locale === 'fr' ? 'Curé' : 'Curated'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-mint-700 transition-colors">
            {resource.title}
          </h3>

          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {resource.description || (locale === 'fr' ? 'Aucune description' : 'No description')}
          </p>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {resource.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 bg-gray-100/80 text-gray-500 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-xs px-2.5 py-1 bg-gray-100/80 text-gray-400 rounded-full">
                  +{resource.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {resource.blocks.length} {locale === 'fr' ? 'blocs' : 'blocks'}
            </span>
            {resource.category && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                {resource.category}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100/60">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{resource.times_assigned} {locale === 'fr' ? 'assigné(s)' : 'assigned'}</span>
            </div>

            <div className="flex items-center gap-2">
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-mint-600 text-xs font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {locale === 'fr' ? 'Voir détails' : 'View Details'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions Menu */}
              <div onClick={handleMenuClick}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <FolderPlus className="w-4 h-4" />
                        {locale === 'fr' ? 'Ajouter à collection' : 'Add to Collection'}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        {collections.length === 0 ? (
                          <DropdownMenuItem disabled className="text-gray-400 text-sm">
                            {locale === 'fr' ? 'Aucune collection' : 'No collections yet'}
                          </DropdownMenuItem>
                        ) : (
                          collections.map((collection) => (
                            <DropdownMenuItem
                              key={collection.id}
                              onClick={() => onAddToCollection(resource.id, collection.id)}
                              className="flex items-center gap-2"
                            >
                              <div className={`w-3 h-3 rounded-full bg-${collection.color}-400`} />
                              {collection.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {locale === 'fr' ? 'Partager avec membre' : 'Share with Member'}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 max-h-60 overflow-y-auto">
                        {members.length === 0 ? (
                          <DropdownMenuItem disabled className="text-gray-400 text-sm">
                            {locale === 'fr' ? 'Aucun membre' : 'No members yet'}
                          </DropdownMenuItem>
                        ) : (
                          members.map((member) => (
                            <DropdownMenuItem
                              key={member.id}
                              onClick={() => onShareWithMember(resource.id, member.id, getMemberFullName(member))}
                              className="flex items-center gap-2"
                            >
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-mint-100 flex items-center justify-center text-[10px] font-medium text-mint-700">
                                  {getMemberInitials(member)}
                                </div>
                              )}
                              <span className="truncate">{getMemberFullName(member)}</span>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
