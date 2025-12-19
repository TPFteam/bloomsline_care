'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Puzzle,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import {
  getAllMemberRecords,
  getAllMemberResources,
  type MemberResourceItem,
} from '@/lib/services/member-resources'
import { toast } from 'sonner'
import MemberLayout from '@/components/member/MemberLayout'

// Resource type icons
const typeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  exercise: Puzzle,
  psychoeducation: BookOpen,
}

export default function ResourcesPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const [resources, setResources] = useState<MemberResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    loadResources()
  }, [])

  async function loadResources() {
    try {
      const memberRecords = await getAllMemberRecords()

      if (memberRecords.length > 0) {
        const resourcePromises = memberRecords.map(m =>
          getAllMemberResources(m.id, m.practitioner_id)
        )
        const resourceResults = await Promise.all(resourcePromises)
        setResources(resourceResults.flat())
      }
    } catch (error) {
      console.error('Error loading resources:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du chargement' : 'Error loading resources')
    } finally {
      setLoading(false)
    }
  }

  const handleResourceClick = (item: MemberResourceItem) => {
    if (item.type === 'assignment') {
      router.push(`/fill/${item.assignmentId}`)
    } else {
      router.push(`/fill/shared/${item.resource.id}`)
    }
  }

  // Filter resources
  const filteredResources = resources.filter(r => {
    if (filter === 'all') return true
    if (filter === 'pending') {
      return r.status === 'pending' || r.status === 'in_progress' || r.status === 'unviewed'
    }
    if (filter === 'completed') {
      return r.status === 'completed' || r.status === 'viewed'
    }
    return true
  })

  const pendingCount = resources.filter(r =>
    r.status === 'pending' || r.status === 'in_progress' || r.status === 'unviewed'
  ).length

  const completedCount = resources.filter(r =>
    r.status === 'completed' || r.status === 'viewed'
  ).length

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{locale === 'fr' ? 'Retour' : 'Back'}</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {locale === 'fr' ? 'Mes Ressources' : 'My Resources'}
          </h1>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Worksheets et exercices partagés par vos mentors'
              : 'Worksheets and exercises shared by your mentors'}
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={`rounded-full ${filter === 'all' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
          >
            {locale === 'fr' ? 'Tous' : 'All'}
            <span className="ml-1.5 text-xs opacity-70">{resources.length}</span>
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={`rounded-full ${filter === 'pending' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            {locale === 'fr' ? 'À faire' : 'To do'}
            <span className="ml-1.5 text-xs opacity-70">{pendingCount}</span>
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
            className={`rounded-full ${filter === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
          >
            {locale === 'fr' ? 'Complétés' : 'Completed'}
            <span className="ml-1.5 text-xs opacity-70">{completedCount}</span>
          </Button>
        </div>

        {/* Resources List */}
        {filteredResources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 rounded-3xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'pending'
                ? (locale === 'fr' ? 'Aucune ressource en attente' : 'No pending resources')
                : filter === 'completed'
                  ? (locale === 'fr' ? 'Aucune ressource complétée' : 'No completed resources')
                  : (locale === 'fr' ? 'Aucune ressource' : 'No resources yet')}
            </h3>
            <p className="text-gray-500">
              {locale === 'fr'
                ? 'Les ressources de vos mentors apparaîtront ici.'
                : 'Resources from your mentors will appear here.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredResources.map((item, index) => {
              const TypeIcon = typeIcons[item.resource.type] || FileText
              const isCompleted = item.status === 'completed' || item.status === 'viewed'
              const isInProgress = item.status === 'in_progress'

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleResourceClick(item)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left border border-gray-100 shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCompleted
                      ? 'bg-emerald-100'
                      : isInProgress
                        ? 'bg-amber-100'
                        : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : isInProgress ? (
                      <Clock className="w-6 h-6 text-amber-600" />
                    ) : (
                      <TypeIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium line-clamp-1 ${
                      isCompleted ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {typeof item.resource.title === 'string' ? item.resource.title : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600'
                          : isInProgress
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted
                          ? (locale === 'fr' ? 'Complété' : 'Completed')
                          : isInProgress
                            ? (locale === 'fr' ? 'En cours' : 'In progress')
                            : (locale === 'fr' ? 'À faire' : 'To do')}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="capitalize">{item.resource.type}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
