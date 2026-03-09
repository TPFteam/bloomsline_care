'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FolderOpen,
  Heart,
  Star,
  Bookmark,
  Briefcase,
  Lightbulb,
  Brain,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
  ClipboardCheck,
  Puzzle,
  BookOpen,
  Loader2,
  Plus,
  X,
  Table2,
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
import { AppSidebar } from '@/components/layout'
import {
  getCollectionById,
  getCollectionResourcesWithDetails,
  removeResourceFromCollection,
} from '@/lib/services/collections'
import type { Collection, CollectionColor, CollectionIcon } from '@/types/collection'
import type { Resource } from '@/types/resource'
import { toast } from 'sonner'

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
const colorConfig: Record<CollectionColor, {
  gradient: string
  bg: string
  text: string
  iconBg: string
  lightBg: string
}> = {
  blue: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-100/80',
    text: 'text-blue-700',
    iconBg: 'bg-blue-50',
    lightBg: 'from-blue-50 to-blue-100/50',
  },
  red: {
    gradient: 'from-red-400 to-red-600',
    bg: 'bg-red-100/80',
    text: 'text-red-700',
    iconBg: 'bg-red-50',
    lightBg: 'from-red-50 to-red-100/50',
  },
  emerald: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-100/80',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
    lightBg: 'from-emerald-50 to-emerald-100/50',
  },
  amber: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-100/80',
    text: 'text-amber-700',
    iconBg: 'bg-amber-50',
    lightBg: 'from-amber-50 to-amber-100/50',
  },
  purple: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-100/80',
    text: 'text-purple-700',
    iconBg: 'bg-purple-50',
    lightBg: 'from-purple-50 to-purple-100/50',
  },
  pink: {
    gradient: 'from-pink-400 to-pink-600',
    bg: 'bg-pink-100/80',
    text: 'text-pink-700',
    iconBg: 'bg-pink-50',
    lightBg: 'from-pink-50 to-pink-100/50',
  },
  slate: {
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-100/80',
    text: 'text-slate-700',
    iconBg: 'bg-slate-50',
    lightBg: 'from-slate-50 to-slate-100/50',
  },
}

// Resource type icons
const resourceTypeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  assessment: ClipboardCheck,
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

// Resource type config
const resourceTypeConfig: Record<string, {
  gradient: string
  bg: string
  text: string
  iconBg: string
}> = {
  worksheet: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100/80',
  },
  assessment: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100/80',
  },
  exercise: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100/80',
  },
  psychoeducation: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100/80',
  },
  table: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100/80',
  },
}

interface CollectionResourceWithDetails {
  id: string
  collection_id: string
  resource_id: string
  added_at: string
  resource: Resource
}

export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLanguage()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<Collection | null>(null)
  const [resources, setResources] = useState<CollectionResourceWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingResourceId, setRemovingResourceId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [collectionData, resourcesData] = await Promise.all([
          getCollectionById(collectionId),
          getCollectionResourcesWithDetails(collectionId),
        ])
        setCollection(collectionData)
        setResources(resourcesData as CollectionResourceWithDetails[])
      } catch (error) {
        console.error('Error fetching collection:', error)
        toast.error(locale === 'fr' ? 'Erreur lors du chargement' : 'Error loading collection')
      } finally {
        setIsLoading(false)
      }
    }

    if (collectionId) {
      fetchData()
    }
  }, [collectionId, locale])

  const handleRemoveResource = async (resourceId: string) => {
    try {
      setRemovingResourceId(resourceId)
      await removeResourceFromCollection(collectionId, resourceId)
      setResources(prev => prev.filter(r => r.resource_id !== resourceId))
      toast.success(locale === 'fr' ? 'Ressource retirée' : 'Resource removed')
    } catch (error) {
      console.error('Error removing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error removing resource')
    } finally {
      setRemovingResourceId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex">
        <AppSidebar activeItem="library" />
        <main className="flex-1 ml-14 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-lavender-500 mx-auto mb-4" />
            <p className="text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen gradient-mesh flex">
        <AppSidebar activeItem="library" />
        <main className="flex-1 ml-14 p-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-8 shadow-lg shadow-gray-200/40 border border-white/60"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {locale === 'fr' ? 'Collection introuvable' : 'Collection not found'}
            </h1>
            <p className="text-gray-500 mb-4">
              {locale === 'fr'
                ? 'Cette collection n\'existe pas ou a été supprimée'
                : 'This collection doesn\'t exist or has been deleted'}
            </p>
            <Link href="/resources">
              <Button className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Retour aux ressources' : 'Back to Resources'}
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    )
  }

  const IconComponent = collectionIcons[collection.icon as CollectionIcon] || FolderOpen
  const config = colorConfig[collection.color as CollectionColor] || colorConfig.blue

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <AppSidebar activeItem="library" />

      {/* Main Content */}
      <main className="flex-1 ml-14 p-8 relative">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-500 mb-6"
        >
          <Link href="/resources" className="hover:text-lavender-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            {locale === 'fr' ? 'Mes ressources' : 'My Resources'}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{collection.name}</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden mb-8"
        >
          {/* Header with gradient */}
          <div className={`h-24 bg-gradient-to-br ${config.lightBg} relative flex items-center px-6`}>
            <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Collection Info */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{collection.name}</h1>
                {collection.description && (
                  <p className="text-gray-600 mb-4">{collection.description}</p>
                )}
                <div className="flex items-center gap-4">
                  <Badge className={`${config.bg} ${config.text}`}>
                    {resources.length} {locale === 'fr' ? 'ressources' : 'resources'}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {locale === 'fr' ? 'Créée le' : 'Created'}{' '}
                    {new Date(collection.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                </div>
              </div>
              <Link href="/library">
                <Button className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Ajouter des ressources' : 'Add Resources'}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Resources Grid */}
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {resources.map((item, index) => {
                const resource = item.resource
                const TypeIcon = resourceTypeIcons[resource.type] || FileText
                const typeConfig = resourceTypeConfig[resource.type] || resourceTypeConfig.worksheet
                const isRemoving = removingResourceId === item.resource_id

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden hover:shadow-xl transition-all">
                      {/* Header */}
                      <div className={`h-20 ${typeConfig.bg} relative flex items-center justify-center`}>
                        <div className={`w-12 h-12 rounded-xl ${typeConfig.iconBg} flex items-center justify-center`}>
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center shadow-md`}>
                            <TypeIcon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <Badge className={`absolute top-3 left-3 ${typeConfig.bg} ${typeConfig.text} text-xs`}>
                          {resource.type}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                          {resource.description?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || (locale === 'fr' ? 'Aucune description' : 'No description')}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            {locale === 'fr' ? 'Ajouté le' : 'Added'}{' '}
                            {new Date(item.added_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/resources/${resource.id}`)}
                              className="h-8 px-3 rounded-lg hover:bg-lavender-50"
                            >
                              <Eye className="w-4 h-4 mr-1 text-lavender-600" />
                              <span className="text-lavender-700 text-xs">{locale === 'fr' ? 'Voir' : 'View'}</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/resources/${resource.id}`)}
                                  className="rounded-lg"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {locale === 'fr' ? 'Voir les détails' : 'View Details'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/resources/${resource.id}/edit`)}
                                  className="rounded-lg"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  {locale === 'fr' ? 'Modifier' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRemoveResource(item.resource_id)}
                                  disabled={isRemoving}
                                  className="text-red-600 rounded-lg"
                                >
                                  {isRemoving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4 mr-2" />
                                  )}
                                  {locale === 'fr' ? 'Retirer de la collection' : 'Remove from Collection'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100/80 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Collection vide' : 'Empty Collection'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm max-w-md mx-auto">
              {locale === 'fr'
                ? 'Cette collection ne contient pas encore de ressources. Parcourez la bibliothèque pour en ajouter.'
                : 'This collection doesn\'t have any resources yet. Browse the library to add some.'}
            </p>
            <Link href="/library">
              <Button className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Parcourir la bibliothèque' : 'Browse Library'}
              </Button>
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}
