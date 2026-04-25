'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { analytics } from '@/lib/analytics/events'
import { motion } from 'framer-motion'
import {
  Clock,
  ChevronRight,
  FileText,
  ClipboardCheck,
  Puzzle,
  BookOpen,
  Edit,
  Trash2,
  Users,
  Lock,
  Globe,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  BarChart2,
  Star,
  Eye,
  MessageSquare,
  CheckCircle2,
  X,
  Table2,
  FolderOpen,
  Copy,
  Link2,
  Send,
  Calendar,
  RotateCcw,
  Video,
  Mic2,
  Paperclip,
  Info,
  Target,
  Lightbulb,
  BookMarked,
  ExternalLink,
  Laugh,
  Smile,
  Meh,
  Frown,
  Angry,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { useLanguage, lt } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { getResourceById, deleteResource, getResourceSubmissions, updateSubmission, type ResourceSubmission } from '@/lib/services/resources'
import { removeResourceFromAllCollections, isResourceSaved } from '@/lib/services/collections'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Resource, ResourceType, ResourceBlock } from '@/types/resource'
// Notification + email for resource sharing handled by Supabase edge function
import { ShareResourceModal } from '@/components/resources/ShareResourceModal'

interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url?: string | null
}

interface SharedMemberInfo {
  member_id: string
  shared_at: string
  viewed_at: string | null
  completed_at: string | null
  member: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }
}

// Include 'assessment' as legacy type for backwards compatibility
const typeIcons: Record<ResourceType | 'assessment', React.ElementType> = {
  worksheet: FileText,
  assessment: FileText, // Legacy - displays same as worksheet
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

const typeConfig: Record<ResourceType | 'assessment', {
  gradient: string
  bg: string
  text: string
  border: string
  iconBg: string
  glow: string
  lightBg: string
}> = {
  worksheet: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100/80',
    glow: 'shadow-blue-200/50',
    lightBg: 'from-blue-50 to-blue-100/50',
  },
  assessment: {
    // Legacy - displays same as worksheet
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100/80',
    glow: 'shadow-blue-200/50',
    lightBg: 'from-blue-50 to-blue-100/50',
  },
  exercise: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100/80',
    glow: 'shadow-amber-200/50',
    lightBg: 'from-amber-50 to-amber-100/50',
  },
  psychoeducation: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100/80',
    glow: 'shadow-purple-200/50',
    lightBg: 'from-purple-50 to-purple-100/50',
  },
  table: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
    lightBg: 'from-emerald-50 to-emerald-100/50',
  },
}

// Question type labels
const questionTypeLabels: Record<string, Record<string, string>> = {
  multiple_choice: { en: 'Multiple Choice', fr: 'Choix multiple' },
  likert: { en: 'Likert Scale', fr: 'Échelle de Likert' },
  yes_no: { en: 'Yes/No', fr: 'Oui/Non' },
  numeric: { en: 'Numeric', fr: 'Numérique' },
  text: { en: 'Text', fr: 'Texte' },
  checklist: { en: 'Checklist', fr: 'Liste de contrôle' },
  scale: { en: 'Scale', fr: 'Échelle' },
  mood: { en: 'Mood', fr: 'Humeur' },
  slider: { en: 'Slider', fr: 'Curseur' },
  matrix_rating: { en: 'Matrix Rating', fr: 'Évaluation matricielle' },
}

// Helper to render response values based on block type
function ResponseValueDisplay({ block, value, locale }: { block: ResourceBlock; value: unknown; locale: string }) {
  if (value === undefined || value === null) return <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>

  switch (block.type) {
    case 'prompt':
      return <p className="text-gray-800 whitespace-pre-wrap">{String(value)}</p>

    case 'multiple_choice': {
      const options: (string | { label?: string })[] =
        ('options' in block && Array.isArray(block.options)) ? block.options :
        ('choices' in block && Array.isArray(block.choices)) ? block.choices : []
      const index = Number(value)
      const label = typeof options[index] === 'string' ? options[index] : (options[index] as any)?.label || `Option ${index + 1}`
      return <span className="inline-flex px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium">{label}</span>
    }

    case 'yes_no': {
      const isYes = value === 'yes'
      return (
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${isYes ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {isYes ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No')}
        </span>
      )
    }

    case 'checklist': {
      const items: (string | { text: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
      const indices = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {indices.map((i: number) => {
            const item = items[i]
            const text = typeof item === 'string' ? item : item?.text || String(i)
            return <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs">✓ {text}</span>
          })}
        </div>
      )
    }

    case 'scale':
    case 'numeric':
    case 'slider': {
      const num = Number(value)
      const max = (block as any).scaleMax || (block as any).sliderMax || 10
      const min = (block as any).scaleMin || (block as any).sliderMin || 0
      const pct = Math.round(((num - min) / (max - min)) * 100)
      return (
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900">{num}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[200px]">
            <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-400">{(block as any).scaleMinLabel || min} — {(block as any).scaleMaxLabel || max}</span>
        </div>
      )
    }

    case 'likert': {
      const scaleType = (block as any).scaleType
      const num = Number(value)
      if (scaleType === 'mood') {
        const moods = ['Thriving', 'Good', 'Okay', 'Low', 'Struggling']
        const moodsFr = ['Épanoui', 'Bien', 'Neutre', 'Fragile', 'Difficile']
        const colors = ['text-emerald-500', 'text-teal-500', 'text-amber-500', 'text-orange-500', 'text-red-500']
        return <span className={`text-sm font-medium ${colors[num] || 'text-gray-600'}`}>{locale === 'fr' ? moodsFr[num] : moods[num]} ({num + 1}/5)</span>
      }
      if (scaleType === 'rating') {
        const max = (block as any).scaleRange || 5
        return (
          <div className="flex gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
              <span key={i} className={`text-lg ${i <= num ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
        )
      }
      // Default likert — show label if available
      const labels = (block as any).scaleLabels || []
      return labels[num]
        ? <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">{labels[num]}</span>
        : <span className="text-lg font-bold text-gray-900">{num + 1}</span>
    }

    case 'mood':
      return <span className="text-lg font-bold text-gray-900">{String(value)}</span>

    case 'matrix_rating': {
      const matrixItems = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
      const ratings = value as Record<string, number>
      const max = (block as any).matrixScaleMax || 5
      return (
        <div className="space-y-1.5">
          {Object.entries(ratings).map(([idx, rating]) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 min-w-[120px]">{matrixItems[Number(idx)] || idx}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: max }).map((_, i) => (
                  <div key={i} className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${i < rating ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-300'}`}>{i + 1}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'date_picker':
      return <span className="text-sm text-gray-800">{value ? new Date(String(value)).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>

    case 'time_input':
      return <span className="text-sm font-medium text-gray-800">{String(value)}</span>

    case 'list_input':
      return Array.isArray(value) ? (
        <ul className="space-y-1">
          {value.filter(Boolean).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      ) : <span>-</span>

    case 'file_response':
      return typeof value === 'string' && value.startsWith('http') ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 underline">
          {value.split('/').pop()?.split('?')[0] || 'File'}
        </a>
      ) : <span className="text-sm text-gray-500">{locale === 'fr' ? 'Fichier envoyé' : 'File uploaded'}</span>

    default:
      return <span className="text-sm text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
  }
}

// Legacy string version for backward compatibility
function renderResponseValue(block: ResourceBlock, value: unknown, locale: string): string {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isTemplateView = searchParams.get('template') === 'true'
  const { locale, t } = useLanguage()
  const supabase = createClient()
  const [resource, setResource] = useState<Resource | null>(null)
  const [duplicatingTemplate, setDuplicatingTemplate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [submissions, setSubmissions] = useState<ResourceSubmission[]>([])
  const [sharedMembers, setSharedMembers] = useState<SharedMemberInfo[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<ResourceSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lightbox, setLightbox] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [pdfViewer, setPdfViewer] = useState<{ url: string; fileName?: string } | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [members, setMembers] = useState<SimpleMember[]>([])
  const [memberGroups, setMemberGroups] = useState<{ id: string; name: string; color: string; member_ids: string[] }[]>([])
  const [accessStatus, setAccessStatus] = useState<'allowed' | 'private' | 'not_found' | 'login_required' | 'practitioner_only' | null>(null)
  const [privateResourceCreator, setPrivateResourceCreator] = useState<{
    id: string
    slug: string | null
    full_name: string
    avatar_url: string | null
    headline: string | null
    credentials: string[]
    is_verified: boolean
  } | null>(null)
  const [user, setUser] = useState<{ full_name?: string; avatar_url?: string } | null>(null)

  useEffect(() => {
    async function fetchResource() {
      try {
        // Get current user
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Current user:', user?.id)

        const data = await getResourceById(params.id as string)
        console.log('Resource practitioner_id:', data?.practitioner_id)
        console.log('Match:', user?.id === data?.practitioner_id)
        // Onboarding resources: require logged-in practitioner
        if (data?.visibility === 'onboarding') {
          if (!user) {
            setAccessStatus('login_required')
            setLoading(false)
            return
          }
          const { data: userProfile } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', user.id)
            .single()
          if (!userProfile || (userProfile.user_type !== 'mentor' && userProfile.user_type !== 'practitioner')) {
            setAccessStatus('practitioner_only')
            setLoading(false)
            return
          }
        }

        setResource(data)

        // Check if current user is the owner
        if (user && data && data.practitioner_id === user.id) {
          console.log('Setting isOwner to true')
          setIsOwner(true)
          setAccessStatus('allowed')
          // Fetch user profile for header
          const { data: userProfile } = await supabase
            .from('users')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single()
          if (userProfile) {
            setUser(userProfile)
          }
          // Fetch submissions if owner
          fetchSubmissions(params.id as string)
          // Fetch members for share modal
          const { data: membersData } = await supabase
            .from('members')
            .select('id, first_name, last_name, email, avatar_url')
            .eq('practitioner_id', user.id)
            .eq('status', 'active')
            .order('first_name', { ascending: true })
          setMembers(membersData || [])

          // Fetch member groups for share modal
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
        } else if (data) {
          // If not owner, check if the resource is saved in their collections
          const saved = await isResourceSaved(data.id)
          setIsSaved(saved)
          setAccessStatus('allowed')

          // For public/link_only resources, fetch proper creator profile from API
          // (browser client may not have access to users table due to RLS)
          if (data.creator_profile?.full_name === 'Practitioner' || !data.creator_profile?.full_name) {
            try {
              const creatorResponse = await fetch(`/api/resources/creator?id=${params.id}`)
              const creatorData = await creatorResponse.json()
              if (creatorData.creatorProfile) {
                setResource(prev => prev ? { ...prev, creator_profile: creatorData.creatorProfile } : prev)
              }
            } catch (e) {
              console.error('Error fetching creator profile:', e)
            }
          }
        } else {
          // Resource is null - check if it's truly not found or just private
          const response = await fetch(`/api/resources/check-access?id=${params.id}`)
          const accessData = await response.json()

          if (accessData.exists && !accessData.hasAccess) {
            setAccessStatus('private')
            if (accessData.creatorProfile) {
              setPrivateResourceCreator(accessData.creatorProfile)
            }
          } else {
            setAccessStatus('not_found')
          }
        }
      } catch (error) {
        console.error('Error fetching resource:', error)
        toast.error(locale === 'fr' ? 'Erreur lors du chargement' : 'Error loading resource')
        setAccessStatus('not_found')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchResource()
    }
  }, [params.id, locale])

  const fetchSubmissions = async (resourceId: string) => {
    setLoadingSubmissions(true)
    try {
      // Fetch submissions (responses) and shared members in parallel
      const [submissionsData, sharedData] = await Promise.all([
        getResourceSubmissions(resourceId),
        (async () => {
          const { data } = await supabase
            .from('member_shared_resources')
            .select(`
              member_id,
              shared_at,
              viewed_at,
              completed_at,
              member:members(id, first_name, last_name, avatar_url)
            `)
            .eq('resource_id', resourceId)
            .order('shared_at', { ascending: false })
          return (data || []) as unknown as SharedMemberInfo[]
        })()
      ])
      setSubmissions(submissionsData)
      setSharedMembers(sharedData)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleSaveReviewNotes = async () => {
    if (!selectedSubmission) return

    setSavingNotes(true)
    try {
      await updateSubmission(selectedSubmission.id, {
        status: 'reviewed',
        practitioner_notes: reviewNotes
      })

      // Also mark the shared resource as completed so member sees "Completed" status
      if (selectedSubmission.member?.id && resource) {
        await supabase
          .from('member_shared_resources')
          .update({ completed_at: new Date().toISOString() })
          .eq('member_id', selectedSubmission.member.id)
          .eq('resource_id', resource.id)
      }

      toast.success(locale === 'fr' ? 'Notes enregistrées' : 'Notes saved')
      analytics.submissionReviewed({ resource_id: resource?.id })
      // Refresh submissions
      fetchSubmissions(params.id as string)
      setSelectedSubmission(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleCopyLink = async () => {
    if (!resource) return
    const url = `${window.location.origin}/resources/${resource.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(locale === 'fr' ? 'Lien copié' : 'Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(locale === 'fr' ? 'Échec de la copie' : 'Failed to copy link')
    }
  }

  const handleShareWithMembers = async (resourceId: string, memberIds: string[], message?: string, isRecurring?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !resource) return

      const { data: practitionerData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      let successCount = 0
      let alreadySharedCount = 0

      for (const memberId of memberIds) {
        const { error } = await supabase
          .from('member_shared_resources')
          .insert({
            member_id: memberId,
            resource_id: resourceId,
            practitioner_id: user.id,
            shared_at: new Date().toISOString(),
            message: message || null,
            is_recurring: isRecurring || !!(resource as any).is_recurring || false,
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

        try {
          const { data: memberResult } = await supabase
            .from('members')
            .select('user_id, email')
            .eq('id', memberId)
            .single()

          const resTitle = typeof resource.title === 'string' ? resource.title : ''
          const practName = practitionerData?.full_name || 'Your practitioner'

          console.log('[share] Member lookup:', { memberId, user_id: memberResult?.user_id, email: memberResult?.email })

          // Notification + email handled by Supabase edge function (on_resource_shared webhook)
        } catch (notifyError) {
          console.error('[share] Error sending notification:', notifyError)
        }
      }

      if (successCount > 0) {
        analytics.resourceShared({ type: resource.type, member_count: successCount, resource_id: resourceId })
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

  const handleDelete = async () => {
    if (!resource) return

    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Êtes-vous sûr de vouloir supprimer cette ressource?'
        : 'Are you sure you want to delete this resource?'
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteResource(resource.id)
      toast.success(locale === 'fr' ? 'Ressource supprimée' : 'Resource deleted')
      router.push('/resources')
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting resource')
    } finally {
      setDeleting(false)
    }
  }

  const handleRemoveFromLibrary = async () => {
    if (!resource) return

    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Êtes-vous sûr de vouloir retirer cette ressource de votre bibliothèque?'
        : 'Are you sure you want to remove this resource from your library?'
    )

    if (!confirmed) return

    setRemoving(true)
    try {
      await removeResourceFromAllCollections(resource.id)
      toast.success(locale === 'fr' ? 'Ressource retirée de votre bibliothèque' : 'Resource removed from your library')
      router.push('/resources')
    } catch (error) {
      console.error('Error removing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du retrait' : 'Error removing resource')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-gray-600"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{locale === 'fr' ? 'Chargement...' : 'Loading...'}</span>
        </motion.div>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-8 shadow-lg shadow-gray-200/40 border border-white/60 max-w-md"
        >
          {(accessStatus === 'login_required' || accessStatus === 'practitioner_only') ? (
            <>
              <Heart className="w-12 h-12 text-teal-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'fr' ? 'Bienvenue sur Bloomsline' : 'Welcome to Bloomsline'}
              </h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {accessStatus === 'login_required'
                  ? (locale === 'fr'
                    ? 'Cette ressource est réservée aux praticiens Bloomsline. Connectez-vous pour y accéder.'
                    : 'This resource is for Bloomsline practitioners. Sign in to access it.')
                  : (locale === 'fr'
                    ? 'Cette ressource est réservée aux praticiens. Découvrez comment Bloomsline peut vous aider dans votre pratique.'
                    : 'This resource is for practitioners. Discover how Bloomsline can help your practice.')}
              </p>
              <div className="flex flex-col gap-3 items-center mt-2 w-full max-w-[200px] mx-auto">
                {accessStatus === 'login_required' ? (
                  <Link href="/sign-in" className="w-full">
                    <Button className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white h-11">
                      {locale === 'fr' ? 'Se connecter' : 'Sign in'}
                    </Button>
                  </Link>
                ) : (
                  <a href="https://bloomsline.com" target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white h-11">
                      {locale === 'fr' ? 'Découvrir Bloomsline' : 'Explore Bloomsline'}
                    </Button>
                  </a>
                )}
              </div>
            </>
          ) : accessStatus === 'private' ? (
            <>
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'fr' ? 'Ressource privée' : 'Private Resource'}
              </h1>
              <p className="text-gray-600 mb-6">
                {locale === 'fr'
                  ? 'Cette ressource n\'est pas accessible publiquement. Veuillez contacter le propriétaire pour demander l\'accès.'
                  : 'This resource is not publicly accessible. Please contact the owner to request access.'}
              </p>

              {/* Creator Profile Card */}
              {privateResourceCreator && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    {locale === 'fr' ? 'Créé par' : 'Created by'}
                  </p>
                  {privateResourceCreator.slug ? (
                    <Link
                      href={`/practitioners/${privateResourceCreator.slug}`}
                      className="block bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 overflow-hidden">
                          {privateResourceCreator.avatar_url ? (
                            <img
                              src={privateResourceCreator.avatar_url}
                              alt={privateResourceCreator.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            privateResourceCreator.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 truncate">
                              {privateResourceCreator.full_name}
                            </span>
                            {privateResourceCreator.is_verified && (
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            )}
                          </div>
                          {privateResourceCreator.headline && (
                            <p className="text-sm text-gray-600 truncate">
                              {privateResourceCreator.headline}
                            </p>
                          )}
                          {privateResourceCreator.credentials && privateResourceCreator.credentials.length > 0 && (
                            <p className="text-xs text-gray-500 truncate">
                              {privateResourceCreator.credentials.slice(0, 3).join(', ')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 overflow-hidden">
                          {privateResourceCreator.avatar_url ? (
                            <img
                              src={privateResourceCreator.avatar_url}
                              alt={privateResourceCreator.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            privateResourceCreator.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 truncate block">
                            {privateResourceCreator.full_name}
                          </span>
                          {privateResourceCreator.headline && (
                            <p className="text-sm text-gray-600 truncate">
                              {privateResourceCreator.headline}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'fr' ? 'Ressource non trouvée' : 'Resource not found'}
              </h1>
              <p className="text-gray-600 mb-6">
                {locale === 'fr'
                  ? 'Cette ressource n\'existe pas ou a été supprimée.'
                  : 'This resource does not exist or has been deleted.'}
              </p>
            </>
          )}
          {accessStatus !== 'login_required' && accessStatus !== 'practitioner_only' && (
            <Link href="/resources">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl mt-4">
                {locale === 'fr' ? 'Retour aux ressources' : 'Back to Resources'}
              </Button>
            </Link>
          )}
        </motion.div>
      </div>
    )
  }

  // Handle legacy 'assessment' type as 'worksheet' for display
  const TypeIcon = typeIcons[resource.type as ResourceType | 'assessment'] || FileText
  const config = typeConfig[resource.type as ResourceType | 'assessment'] || typeConfig.worksheet

  // Get scoring settings - works for legacy assessments AND scored worksheets
  const isLegacyAssessment = (resource.type as string) === 'assessment'
  const worksheetSettings = resource.settings as {
    questions?: Array<{
      id: string
      type: string
      text?: string
      question?: string
      required?: boolean
      options?: Array<{ label: string; score: number } | string>
      scaleLabels?: string[]
      scaleRange?: number
      likertScale?: number
      likertLabels?: { start: string; end: string }
      yesScore?: number
      noScore?: number
      minValue?: number
      maxValue?: number
      moodOptions?: Array<{ emoji: string; label: string; value?: number; score?: number }>
      items?: Array<{ text: string; checked: boolean } | string>
      scaleMin?: number
      scaleMax?: number
      scaleMinLabel?: string
      scaleMaxLabel?: string
      scoring?: { [key: string]: number }
    }>
    enableScoring?: boolean
    showScoreToMember?: boolean
    scoringRanges?: Array<{ min: number; max: number; label: Record<string, string> } | { minScore: number; maxScore: number; label: string; description: string }>
    maxScore?: number
    instructions?: string
  } | null

  const hasScoring = isLegacyAssessment || worksheetSettings?.enableScoring

  const typeLabels: Record<string, string> = {
    worksheet: locale === 'fr' ? 'Exercice' : 'Worksheet',
    assessment: locale === 'fr' ? 'Exercice' : 'Worksheet', // Legacy - shows as worksheet
    exercise: locale === 'fr' ? 'Exercice' : 'Exercise',
    psychoeducation: locale === 'fr' ? 'Éducation' : 'Education',
  }
  const typeLabel = typeLabels[resource.type as string] || typeLabels.worksheet

  // Shared content blocks for both public and owner views
  const contentBlocks = (
    <>
            {/* Table type resources now use the unified "Content - As seen by members" section below, same as worksheets */}

            {/* Assessment/Scored Worksheet Questions Preview */}
            {hasScoring && worksheetSettings?.questions && worksheetSettings.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {locale === 'fr' ? 'Questions' : 'Questions'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {worksheetSettings.questions.length} {locale === 'fr' ? 'question(s)' : 'question(s)'}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                {worksheetSettings.instructions && (
                  <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700">{typeof worksheetSettings.instructions === 'string' ? worksheetSettings.instructions : (worksheetSettings.instructions as Record<string, string>)?.[locale] || ''}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {worksheetSettings.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 bg-gray-50/80 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-gray-900">{question.question || question.text || ''}</p>
                            {question.required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {questionTypeLabels[question.type] ? lt(questionTypeLabels[question.type], locale) : question.type}
                            </Badge>
                            {hasScoring && question.type === 'multiple_choice' && question.options && (
                              <span className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Score max:' : 'Max score:'} {Math.max(...question.options.map(o => typeof o === 'object' && 'score' in o ? (o.score || 0) : 0))} pts
                              </span>
                            )}
                            {hasScoring && question.type === 'likert' && (
                              <span className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Score max:' : 'Max score:'} {(question.scaleRange || question.likertScale || 5) - 1} pts
                              </span>
                            )}
                          </div>

                          {/* Show options preview */}
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="mt-3 space-y-1">
                              {question.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <Circle className="w-3 h-3" />
                                  <span>{typeof opt === 'string' ? opt : (typeof opt === 'object' && 'label' in opt ? opt.label : JSON.stringify(opt))}</span>
                                  {hasScoring && typeof opt === 'object' && 'score' in opt && (
                                    <span className="text-xs text-gray-400">({opt.score} pts)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'likert' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                              <span>{question.scaleLabels?.[0] || question.likertLabels?.start || '1'}</span>
                              <div className="flex gap-1">
                                {Array.from({ length: question.scaleRange || question.likertScale || 5 }).map((_, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">
                                    {i + 1}
                                  </div>
                                ))}
                              </div>
                              <span>{question.scaleLabels?.[question.scaleLabels.length - 1] || question.likertLabels?.end || (question.scaleRange || question.likertScale || 5).toString()}</span>
                            </div>
                          )}

                          {question.type === 'yes_no' && (
                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                {locale === 'fr' ? 'Oui' : 'Yes'}
                                {hasScoring && <span className="text-xs">({question.yesScore || question.scoring?.yes || 1} pt)</span>}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Circle className="w-4 h-4" />
                                {locale === 'fr' ? 'Non' : 'No'}
                                {hasScoring && <span className="text-xs">({question.noScore || question.scoring?.no || 0} pt)</span>}
                              </span>
                            </div>
                          )}

                          {question.type === 'mood' && question.moodOptions && (
                            <div className="mt-3 flex items-center gap-2">
                              {question.moodOptions.map((mood, i) => (
                                <div key={i} className="text-center">
                                  <span className="text-xl">{mood.emoji}</span>
                                  <p className="text-xs text-gray-500">{typeof mood.label === 'string' ? mood.label : ''}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'checklist' && question.items && (
                            <div className="mt-3 space-y-1">
                              {question.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="w-4 h-4 rounded border border-gray-300" />
                                  <span>{typeof item === 'string' ? item : (typeof item === 'object' && 'text' in item ? item.text : '')}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'scale' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                              <span>{typeof question.scaleMinLabel === 'string' ? question.scaleMinLabel : (question.scaleMin || 0)}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                              <span>{typeof question.scaleMaxLabel === 'string' ? question.scaleMaxLabel : (question.scaleMax || 10)}</span>
                            </div>
                          )}

                          {question.type === 'slider' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                              <span>{question.minValue || 0}</span>
                              <div className="flex-1 h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full" />
                              <span>{question.maxValue || 100}</span>
                            </div>
                          )}

                          {question.type === 'matrix_rating' && (
                            <div className="mt-3">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr>
                                      <th className="text-left py-2 pr-4 text-gray-500 font-normal"></th>
                                      {Array.from({ length: (question as any).matrixScaleMax || 5 }).map((_, i) => (
                                        <th key={i} className="px-2 py-2 text-center text-gray-500 font-normal">
                                          {i + 1}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {((question as any).matrixItems || []).map((item: string, i: number) => (
                                      <tr key={i} className="border-t border-gray-100">
                                        <td className="py-2 pr-4 text-gray-700">{item}</td>
                                        {Array.from({ length: (question as any).matrixScaleMax || 5 }).map((_, j) => (
                                          <td key={j} className="px-2 py-2 text-center">
                                            <Circle className="w-4 h-4 text-gray-300 mx-auto" />
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {(question as any).matrixScaleLabels && (
                                <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                                  <span>{(question as any).matrixScaleLabels.min}</span>
                                  <span>{(question as any).matrixScaleLabels.max}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scoring Interpretation */}
            {hasScoring && worksheetSettings?.scoringRanges && worksheetSettings.scoringRanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Interprétation des scores' : 'Score Interpretation'}
                  </h2>
                </div>

                <div className="space-y-3">
                  {worksheetSettings.scoringRanges.map((range, index) => {
                    const colors = ['bg-emerald-100 text-emerald-700 border-emerald-200', 'bg-yellow-100 text-yellow-700 border-yellow-200', 'bg-orange-100 text-orange-700 border-orange-200', 'bg-red-100 text-red-700 border-red-200']
                    const color = colors[Math.min(index, colors.length - 1)]
                    // Handle both legacy (minScore/maxScore) and new (min/max) formats
                    const minVal = 'min' in range ? range.min : (range as any).minScore
                    const maxVal = 'max' in range ? range.max : (range as any).maxScore
                    const labelVal = typeof range.label === 'object' && 'en' in range.label ? lt(range.label as Record<string, string>, locale) : (typeof range.label === 'string' ? range.label : '')
                    const descVal = 'description' in range && range.description ? (typeof range.description === 'object' && 'en' in range.description ? lt(range.description as Record<string, string>, locale) : (typeof range.description === 'string' ? range.description : '')) : ''

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border ${color}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{labelVal}</span>
                          <span className="text-sm">
                            {minVal} - {maxVal} pts
                          </span>
                        </div>
                        {descVal && (
                          <p className="text-sm opacity-80">{descVal}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Worksheet Blocks Preview */}
            {(resource.type === 'worksheet' || resource.type === 'table') && resource.blocks && resource.blocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {locale === 'fr' ? 'Contenu' : 'Content'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {locale === 'fr' ? 'Ce que les patients verront' : 'As seen by members'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">
                    {resource.blocks.length} {locale === 'fr' ? (resource.blocks.length === 1 ? 'étape' : 'étapes') : 'steps'}
                  </Badge>
                </div>

                {/* Clean preview mimicking actual worksheet experience */}
                <div className="space-y-6">
                  {(() => {
                    // Track question and info numbers separately
                    let questionNumber = 0
                    let infoNumber = 0
                    const questionTypes = ['prompt', 'checklist', 'scale', 'matrix_rating', 'likert', 'multiple_choice', 'yes_no', 'mood', 'numeric', 'slider', 'date_picker', 'time_input', 'list_input', 'audio_response', 'file_response', 'video_response', 'table_exercise']
                    const infoTypes = ['heading', 'paragraph', 'quote', 'tip', 'affirmation', 'image', 'divider', 'pdf_document']

                    // Question type labels for display
                    const typeLabels: Record<string, Record<string, string>> = {
                      prompt: { en: 'Text', fr: 'Texte' },
                      checklist: { en: 'Checklist', fr: 'Liste' },
                      scale: { en: 'Scale', fr: 'Échelle' },
                      matrix_rating: { en: 'Matrix', fr: 'Matrice' },
                      likert: { en: 'Scale', fr: 'Échelle' },
                      multiple_choice: { en: 'Choice', fr: 'Choix' },
                      yes_no: { en: 'Yes/No', fr: 'Oui/Non' },
                      mood: { en: 'Mood', fr: 'Humeur' },
                      numeric: { en: 'Number', fr: 'Nombre' },
                      slider: { en: 'Slider', fr: 'Curseur' },
                      date_picker: { en: 'Date', fr: 'Date' },
                      time_input: { en: 'Time', fr: 'Heure' },
                      list_input: { en: 'List', fr: 'Liste' },
                      audio_response: { en: 'Audio', fr: 'Audio' },
                      file_response: { en: 'File', fr: 'Fichier' },
                      video_response: { en: 'Video', fr: 'Vidéo' },
                      table_exercise: { en: 'Table', fr: 'Tableau' },
                    }

                    // Info type labels for display
                    const infoTypeLabels: Record<string, Record<string, string>> = {
                      heading: { en: 'Title', fr: 'Titre' },
                      paragraph: { en: 'Text', fr: 'Texte' },
                      quote: { en: 'Quote', fr: 'Citation' },
                      tip: { en: 'Tip', fr: 'Conseil' },
                      affirmation: { en: 'Affirm', fr: 'Affirm.' },
                      image: { en: 'Image', fr: 'Image' },
                      divider: { en: 'Line', fr: 'Ligne' },
                      pdf_document: { en: 'PDF', fr: 'PDF' },
                    }

                    return resource.blocks.map((block, index) => {
                    const blockType = (block as any).type as string
                    const blockContent = typeof (block as any).content === 'string' ? (block as any).content : ''
                    const blockId = (block as any).id || index
                    const isQuestion = questionTypes.includes(blockType)
                    const isInfo = infoTypes.includes(blockType)
                    if (isQuestion) questionNumber++
                    if (isInfo) infoNumber++

                    // Content/Info blocks with inline indicator
                    if (blockType === 'heading') {
                      return (
                        <div key={blockId}>
                          <h3 className="text-xl font-semibold text-gray-900">{blockContent}</h3>
                        </div>
                      )
                    }

                    if (blockType === 'paragraph') {
                      return (
                        <div key={blockId}>
                          <p className="text-gray-700 leading-relaxed">{blockContent}</p>
                        </div>
                      )
                    }

                    if (blockType === 'divider') {
                      return <hr key={blockId} className="border-gray-200" />
                    }

                    if (blockType === 'quote') {
                      return (
                        <div key={blockId}>
                          <blockquote className="border-l-4 border-lavender-300 pl-4 py-2 italic text-gray-700 bg-lavender-50/30 rounded-r-lg">
                            {blockContent}
                            {(block as any).quoteAuthor && (
                              <footer className="text-sm text-gray-500 mt-2 not-italic">— {(block as any).quoteAuthor}</footer>
                            )}
                          </blockquote>
                        </div>
                      )
                    }

                    if (blockType === 'tip') {
                      const tipStyles = {
                        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                        warning: 'bg-amber-50 border-amber-200 text-amber-800',
                        info: 'bg-blue-50 border-blue-200 text-blue-800',
                        default: 'bg-gray-50 border-gray-200 text-gray-700'
                      }
                      const style = (block as any).style || 'default'
                      return (
                        <div key={blockId} className={`p-4 rounded-xl border ${tipStyles[style as keyof typeof tipStyles] || tipStyles.default}`}>
                          <p className="text-sm">{blockContent}</p>
                        </div>
                      )
                    }

                    if (blockType === 'affirmation') {
                      return (
                        <div key={blockId} className="p-5 bg-gradient-to-br from-lavender-50 to-purple-50 rounded-xl border border-lavender-100 text-center">
                          <p className="text-lavender-700 font-medium text-lg">{blockContent}</p>
                        </div>
                      )
                    }

                    if (blockType === 'image') {
                      return (
                        <div key={blockId}>
                          <div className="flex flex-col items-start">
                            {(block as any).mediaFile?.url ? (
                              <div className="group relative">
                                <img
                                  src={(block as any).mediaFile.url}
                                  alt={(block as any).mediaAlt || (block as any).mediaCaption || ''}
                                  className="max-h-64 w-auto rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => setLightbox({ url: (block as any).mediaFile.url, type: 'image' })}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                                    {locale === 'fr' ? 'Cliquez pour agrandir' : 'Click to enlarge'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="h-40 w-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                {locale === 'fr' ? 'Image' : 'Image'}
                              </div>
                            )}
                            {(block as any).mediaCaption && (
                              <p className="text-sm text-gray-600 mt-3 max-w-md">{(block as any).mediaCaption}</p>
                            )}
                          </div>
                        </div>
                      )
                    }

                    if (blockType === 'pdf_document') {
                      const pdfUrl = (block as any).mediaFile || (block as any).pdfUrl || (block as any).url || ''
                      const pdfFileName = (block as any).fileName || (block as any).pdfFileName || ''
                      const pageRange = (block as any).pageRange as number[] | undefined
                      const pageLabel = pageRange && pageRange.length > 0
                        ? (pageRange.length === 1 ? `Page ${pageRange[0]}` : `Pages ${pageRange[0]}–${pageRange[pageRange.length - 1]}`)
                        : null
                      return (
                        <div key={blockId}>
                          {blockContent && <p className="text-gray-900 font-medium mb-2">{blockContent}</p>}
                          <button
                            onClick={() => pdfUrl && setPdfViewer({ url: pdfUrl, fileName: pdfFileName })}
                            className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{pdfFileName || 'document.pdf'}</p>
                              <p className="text-xs text-gray-500">
                                {pageLabel && <span className="font-medium">{pageLabel} · </span>}
                                {locale === 'fr' ? 'Cliquer pour ouvrir' : 'Click to open'}
                              </p>
                            </div>
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      )
                    }

                    // Interactive blocks get a subtle card treatment with question number
                    const typeLabel = typeLabels[blockType] ? lt(typeLabels[blockType], locale) : blockType

                    return (
                      <div
                        key={blockId}
                        className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm"
                      >

                        {blockType === 'prompt' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent}</p>
                            <div className="min-h-[100px] bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                              <span className="text-sm text-gray-400">{locale === 'fr' ? 'Zone de réponse texte' : 'Text response area'}</span>
                            </div>
                          </>
                        )}

                        {blockType === 'checklist' && 'items' in block && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="space-y-3">
                              {(block as any).items?.map((item: any, i: number) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                  <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center group-hover:border-emerald-400 transition-colors">
                                  </div>
                                  <span className="text-gray-700">{typeof item === 'string' ? item : ''}</span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}

                        {blockType === 'scale' && 'scaleMin' in block && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500 min-w-[60px] text-right">{typeof (block as any).scaleMinLabel === 'string' ? (block as any).scaleMinLabel : (block as any).scaleMin}</span>
                              <div className="flex-1 h-3 bg-gradient-to-r from-gray-200 via-emerald-200 to-emerald-400 rounded-full" />
                              <span className="text-sm text-gray-500 min-w-[60px]">{typeof (block as any).scaleMaxLabel === 'string' ? (block as any).scaleMaxLabel : (block as any).scaleMax}</span>
                            </div>
                          </>
                        )}

                        {blockType === 'matrix_rating' && 'matrixItems' in block && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  {(block as any).matrixScaleLabels && (
                                    <tr>
                                      <th></th>
                                      <th className="px-3 pt-2 text-center text-xs text-gray-400 font-normal">{(block as any).matrixScaleLabels.min}</th>
                                      {Array.from({ length: Math.max(0, ((block as any).matrixScaleMax || 5) - 2) }).map((_, i) => (
                                        <th key={i}></th>
                                      ))}
                                      <th className="px-3 pt-2 text-center text-xs text-gray-400 font-normal">{(block as any).matrixScaleLabels.max}</th>
                                    </tr>
                                  )}
                                  <tr>
                                    <th className="text-left py-2 pr-4 text-sm text-gray-500 font-normal"></th>
                                    {Array.from({ length: (block as any).matrixScaleMax || 5 }).map((_, i) => (
                                      <th key={i} className="px-3 py-2 text-center text-sm text-gray-500 font-medium">
                                        {i + 1}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {((block as any).matrixItems || []).map((item: string, i: number) => (
                                    <tr key={i} className="border-t border-gray-100">
                                      <td className="py-3 pr-4 text-gray-700">{item}</td>
                                      {Array.from({ length: (block as any).matrixScaleMax || 5 }).map((_, j) => (
                                        <td key={j} className="px-3 py-3 text-center">
                                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto hover:border-emerald-400 transition-colors cursor-pointer" />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {blockType === 'likert' && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            {/* Mood Scale */}
                            {(block as any).scaleType === 'mood' && (
                              <div className="flex items-center justify-center gap-6 py-2">
                                {[
                                  { Icon: Laugh, label: locale === 'fr' ? 'Épanoui' : 'Thriving', color: 'text-emerald-500' },
                                  { Icon: Smile, label: locale === 'fr' ? 'Bien' : 'Good', color: 'text-teal-500' },
                                  { Icon: Meh, label: locale === 'fr' ? 'Neutre' : 'Okay', color: 'text-amber-500' },
                                  { Icon: Frown, label: locale === 'fr' ? 'Fragile' : 'Low', color: 'text-orange-500' },
                                  { Icon: Angry, label: locale === 'fr' ? 'Difficile' : 'Struggling', color: 'text-red-500' },
                                ].map((mood, i) => (
                                  <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer hover:scale-110 transition-transform">
                                    <mood.Icon className={`w-8 h-8 ${mood.color}`} />
                                    <p className={`text-xs ${mood.color}`}>{mood.label}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Rating Scale */}
                            {(block as any).scaleType === 'rating' && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {Array.from({ length: ((block as any).scaleMax ?? (block as any).scaleRange ?? 5) - ((block as any).scaleMin ?? 1) + 1 }, (_, i) => {
                                  const value = ((block as any).scaleMin ?? 1) + i
                                  return (
                                    <div key={value} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-400 hover:border-amber-300 hover:bg-amber-50 cursor-pointer transition-all">
                                      {value}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {/* Likert Scale (default) */}
                            {(!(block as any).scaleType || (block as any).scaleType === 'likert') && (
                              <div>
                                <div className="flex justify-center gap-2">
                                  {Array.from({ length: (block as any).scaleRange || (block as any).likertScale || 5 }).map((_, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm text-gray-500 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer transition-all">
                                      {i + 1}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                  <span className="text-xs text-gray-400">{(block as any).scaleLabels?.[0] || (block as any).likertLabels?.start || ''}</span>
                                  <span className="text-xs text-gray-400">{(block as any).scaleLabels?.[(block as any).scaleLabels?.length - 1] || (block as any).likertLabels?.end || ''}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {blockType === 'multiple_choice' && ('options' in block || 'choices' in block) && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="space-y-2">
                              {((block as any).options || (block as any).choices || []).map((opt: any, i: number) => (
                                <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all">
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                  <span className="text-gray-700">{typeof opt === 'string' ? opt : opt.label}</span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}

                        {blockType === 'yes_no' && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="flex items-center gap-3">
                              <button className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                <span className="font-medium text-gray-700">{locale === 'fr' ? 'Oui' : 'Yes'}</span>
                              </button>
                              <button className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <X className="w-5 h-5 text-gray-400" />
                                <span className="font-medium text-gray-700">{locale === 'fr' ? 'Non' : 'No'}</span>
                              </button>
                            </div>
                          </>
                        )}

                        {blockType === 'mood' && 'moodOptions' in block && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="flex items-center justify-center gap-6">
                              {((block as any).moodOptions || []).map((mood: any, i: number) => (
                                <div key={i} className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
                                  <span className="text-2xl">{mood.emoji}</span>
                                  <p className="text-xs text-gray-500">{mood.label}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {blockType === 'numeric' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent}</p>
                            <input
                              type="number"
                              disabled
                              placeholder="0"
                              className="w-32 h-11 px-4 border border-gray-200 rounded-lg text-gray-400 bg-gray-50"
                            />
                          </>
                        )}

                        {blockType === 'slider' && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500 min-w-[40px] text-right">{(block as any).sliderMin || 0}</span>
                              <div className="flex-1 h-2 bg-gradient-to-r from-gray-200 to-emerald-400 rounded-full relative">
                                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-emerald-400 rounded-full shadow-sm" />
                              </div>
                              <span className="text-sm text-gray-500 min-w-[40px]">{(block as any).sliderMax || 100}</span>
                            </div>
                          </>
                        )}

                        {blockType === 'date_picker' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent}</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-500 bg-gray-50">
                              <span>📅</span>
                              <span className="text-sm">{locale === 'fr' ? 'Sélectionner une date' : 'Select date'}</span>
                            </div>
                          </>
                        )}

                        {blockType === 'time_input' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent}</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-500 bg-gray-50">
                              <span>🕐</span>
                              <span className="text-sm">{locale === 'fr' ? 'Sélectionner l\'heure' : 'Select time'}</span>
                            </div>
                          </>
                        )}

                        {blockType === 'list_input' && (
                          <>
                            <p className="text-gray-800 font-medium mb-4">{blockContent}</p>
                            <div className="space-y-2">
                              {Array.from({ length: Math.min((block as any).listMinItems || 1, 3) }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-gray-400 text-sm font-medium w-6">{i + 1}.</span>
                                  <div className="flex-1 h-11 border border-gray-200 rounded-lg bg-gray-50 flex items-center px-4 text-gray-400 text-sm">
                                    {(block as any).listItemPlaceholder || (locale === 'fr' ? 'Entrez un élément...' : 'Enter an item...')}
                                  </div>
                                </div>
                              ))}
                              {((block as any).listMinItems || 1) > 3 && (
                                <p className="text-xs text-gray-400 text-center pt-1">+ {(block as any).listMinItems - 3} {locale === 'fr' ? 'autres champs' : 'more fields'}</p>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                              {locale === 'fr' ? `${(block as any).listMinItems || 1} à ${(block as any).listMaxItems || 10} éléments` : `${(block as any).listMinItems || 1} to ${(block as any).listMaxItems || 10} items`}
                            </p>
                          </>
                        )}

                        {blockType === 'table_exercise' && (
                          <>
                            {blockContent && <p className="text-gray-800 font-medium mb-3">{blockContent}</p>}
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-800 text-white">
                                    {((block as any).columns || []).map((col: any) => (
                                      <th key={col.id} className="px-4 py-2.5 text-left text-xs font-semibold">{col.header}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.values((block as any).exampleRow || {}).some((v: any) => v) && (
                                    <tr className="bg-gray-50">
                                      {((block as any).columns || []).map((col: any) => (
                                        <td key={col.id} className="px-4 py-2.5 text-xs text-gray-500 italic border-t border-gray-100 align-top whitespace-pre-wrap">{(block as any).exampleRow?.[col.id] || ''}</td>
                                      ))}
                                    </tr>
                                  )}
                                  <tr>
                                    {((block as any).columns || []).map((col: any) => (
                                      <td key={col.id} className="px-4 py-3 border-t border-gray-100 align-top">
                                        <div className="min-h-[60px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 italic">
                                          {locale === 'fr' ? 'Réponse du membre...' : "Member's response..."}
                                        </div>
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

                        {blockType === 'audio_response' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent || (locale === 'fr' ? 'Enregistrement audio' : 'Audio Recording')}</p>
                            <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center">
                                <Mic2 className="w-6 h-6 text-rose-500" />
                              </div>
                              <p className="text-sm text-gray-500">{locale === 'fr' ? 'Cliquez pour enregistrer' : 'Click to record'}</p>
                            </div>
                          </>
                        )}

                        {blockType === 'file_response' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent || (locale === 'fr' ? 'Téléverser un fichier' : 'File Upload')}</p>
                            <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                                <Paperclip className="w-6 h-6 text-blue-500" />
                              </div>
                              <p className="text-sm text-gray-500">{locale === 'fr' ? 'Glissez un fichier ou cliquez pour parcourir' : 'Drag a file or click to browse'}</p>
                            </div>
                          </>
                        )}

                        {blockType === 'video_response' && (
                          <>
                            <p className="text-gray-800 font-medium mb-3">{blockContent || (locale === 'fr' ? 'Enregistrement vidéo' : 'Video Recording')}</p>
                            <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                                <Video className="w-6 h-6 text-purple-500" />
                              </div>
                              <p className="text-sm text-gray-500">{locale === 'fr' ? 'Cliquez pour enregistrer' : 'Click to record'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                  })()}
                </div>
              </motion.div>
            )}

            {/* Learning objectives — separate card */}
            {resource.type === 'psychoeducation' && (() => {
              const objectives = (resource.settings as any)?.learningObjectives?.filter((o: string) => o?.trim()) || []
              return objectives.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                  <p className="text-sm font-semibold text-gray-900 mb-3">{locale === 'fr' ? 'Objectifs d\'apprentissage' : 'Learning Objectives'}</p>
                  <ul className="space-y-2">
                    {objectives.map((obj: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : null
            })()}

            {/* Psychoeducation Blocks Preview */}
            {resource.type === 'psychoeducation' && resource.blocks && resource.blocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#FAFAF8] rounded-2xl shadow-sm border border-gray-200/60 p-8 md:p-10"
              >
                {/* Reading time */}
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200/50">
                  <span className="text-xs font-medium text-gray-400">
                    {Math.max(1, Math.ceil(resource.blocks.reduce((acc: number, b: any) => acc + (typeof b.content === 'string' ? b.content.length : 0), 0) / 1000))} min {locale === 'fr' ? 'de lecture' : 'read'}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">
                    {resource.blocks.length} {locale === 'fr' ? 'sections' : 'sections'}
                  </span>
                </div>

                {/* Therapeutic reading layout */}
                <div className="max-w-[640px] mx-auto space-y-10">
                  {(() => {
                    const typeLabels: Record<string, Record<string, string>> = {
                      heading: { en: 'Title', fr: 'Titre' },
                      paragraph: { en: 'Text', fr: 'Texte' },
                      key_points: { en: 'Key Points', fr: 'Points clés' },
                      callout: { en: 'Callout', fr: 'Encadré' },
                      quote: { en: 'Quote', fr: 'Citation' },
                      image: { en: 'Image', fr: 'Image' },
                      audio: { en: 'Audio', fr: 'Audio' },
                      video: { en: 'Video', fr: 'Vidéo' },
                      link: { en: 'Link', fr: 'Lien' },
                    }

                    return resource.blocks.map((block, index) => {
                      const blockType = (block as any).type as string
                      const blockContent = typeof (block as any).content === 'string' ? (block as any).content : ''
                      const blockId = (block as any).id || index
                      const sectionNumber = index + 1
                      const typeLabel = typeLabels[blockType] ? lt(typeLabels[blockType], locale) : blockType

                      // Heading
                      if (blockType === 'heading') {
                        return (
                          <div key={blockId}>
                            <h3 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mt-2">{blockContent}</h3>
                          </div>
                        )
                      }

                      // Paragraph
                      if (blockType === 'paragraph') {
                        return (
                          <div key={blockId}>
                            <p className="text-[17px] text-[#374151] leading-[1.75]">{blockContent}</p>
                          </div>
                        )
                      }

                      // Key Points
                      if (blockType === 'key_points') {
                        const points = (block as any).points || []
                        return (
                          <div key={blockId}>
                            <div className="p-6 bg-white border-l-[3px] border-teal-400 rounded-r-xl shadow-sm">
                              {blockContent && <p className="text-[15px] font-semibold text-[#1A1A1A] mb-3">{blockContent}</p>}
                              <ul className="space-y-3">
                                {points.map((point: string, i: number) => (
                                  <li key={i} className="flex items-start gap-3 text-[#374151]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2.5 flex-shrink-0" />
                                    <span className="text-[15px] leading-[1.7]">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )
                      }

                      // Callout
                      if (blockType === 'callout') {
                        const calloutStyles = {
                          info: { borderColor: 'border-l-blue-400', iconColor: 'text-blue-400', textColor: 'text-[#374151]', Icon: Info },
                          warning: { borderColor: 'border-l-amber-400', iconColor: 'text-amber-400', textColor: 'text-[#374151]', Icon: Target },
                          tip: { borderColor: 'border-l-emerald-400', iconColor: 'text-emerald-400', textColor: 'text-[#374151]', Icon: Lightbulb },
                          example: { borderColor: 'border-l-purple-400', iconColor: 'text-purple-400', textColor: 'text-[#374151]', Icon: BookMarked },
                        }
                        const calloutType = (block as any).calloutType || 'info'
                        const style = calloutStyles[calloutType as keyof typeof calloutStyles] || calloutStyles.info
                        const CalloutIcon = style.Icon
                        return (
                          <div key={blockId}>
                            <div className={`p-5 bg-white border-l-[3px] ${style.borderColor} rounded-r-xl shadow-sm`}>
                              <div className="flex items-start gap-3">
                                <CalloutIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                                <p className={`text-[15px] leading-[1.7] ${style.textColor}`}>{blockContent}</p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Quote
                      if (blockType === 'quote') {
                        return (
                          <div key={blockId}>
                            <blockquote className="border-l-[3px] border-amber-300 pl-5 py-3 italic text-[17px] text-[#374151] leading-[1.75] rounded-r-xl">
                              &ldquo;{blockContent}&rdquo;
                              {(block as any).attribution && (
                                <footer className="text-sm text-gray-400 mt-3 not-italic">— {(block as any).attribution}</footer>
                              )}
                            </blockquote>
                          </div>
                        )
                      }

                      // Image
                      if (blockType === 'image') {
                        return (
                          <div key={blockId}>
                            {(block as any).mediaFile?.url ? (
                              <div
                                className="group relative rounded-xl overflow-hidden cursor-pointer"
                                onClick={() => setLightbox({ url: (block as any).mediaFile.url, type: 'image' })}
                              >
                                <img
                                  src={(block as any).mediaFile.url}
                                  alt={(block as any).caption || ''}
                                  className="w-full max-h-[400px] object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              </div>
                            ) : null}
                            {(block as any).caption && (
                              <p className="text-xs text-gray-500 mt-2 italic">{(block as any).caption}</p>
                            )}
                          </div>
                        )
                      }

                      // Audio
                      if (blockType === 'audio') {
                        return (
                          <div key={blockId}>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                                  <Mic2 className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{(block as any).title || (locale === 'fr' ? 'Audio' : 'Audio')}</p>
                                  {(block as any).caption && <p className="text-xs text-gray-500">{(block as any).caption}</p>}
                                </div>
                              </div>
                              {(block as any).mediaFile?.url ? (
                                <audio controls className="w-full" src={(block as any).mediaFile.url}>
                                  Your browser does not support audio.
                                </audio>
                              ) : null}
                            </div>
                          </div>
                        )
                      }

                      // Video
                      if (blockType === 'video') {
                        return (
                          <div key={blockId}>
                            {(block as any).mediaFile?.url ? (
                              <div
                                className="group relative w-full max-h-[360px] bg-gray-900 rounded-xl overflow-hidden cursor-pointer"
                                onClick={() => setLightbox({ url: (block as any).mediaFile.url, type: 'video' })}
                              >
                                <video
                                  src={(block as any).mediaFile.url}
                                  className="w-full max-h-[360px] object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                    <span className="text-gray-900 text-lg ml-1">▶</span>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                            {(block as any).caption && (
                              <p className="text-xs text-gray-500 mt-2 italic">{(block as any).caption}</p>
                            )}
                          </div>
                        )
                      }

                      // Link
                      if (blockType === 'link') {
                        return (
                          <div key={blockId}>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${
                                  (block as any).linkPlatform === 'youtube' ? 'bg-red-100 text-red-600'
                                    : (block as any).linkPlatform === 'vimeo' ? 'bg-blue-100 text-blue-600'
                                    : (block as any).linkPlatform === 'spotify' ? 'bg-green-100 text-green-600'
                                    : (block as any).linkPlatform === 'soundcloud' ? 'bg-orange-100 text-orange-600'
                                    : 'bg-teal-50 text-teal-600'
                                }`}>
                                  <Link2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {(block as any).linkTitle || (locale === 'fr' ? 'Lien externe' : 'External Link')}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">{(block as any).linkUrl}</p>
                                  {blockContent && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{blockContent}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      navigator.clipboard.writeText((block as any).linkUrl || '')
                                      toast.success(locale === 'fr' ? 'Lien copié' : 'Link copied')
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    title={locale === 'fr' ? 'Copier' : 'Copy'}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={(block as any).linkUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    title={locale === 'fr' ? 'Ouvrir' : 'Open'}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // PDF Document
                      if (blockType === 'pdf_document') {
                        const pdfUrl = (block as any).mediaFile || (block as any).pdfUrl || (block as any).url || ''
                        const pdfFileName = (block as any).fileName || (block as any).pdfFileName || ''
                        const pageRange = (block as any).pageRange as number[] | undefined
                        const pageLabel = pageRange && pageRange.length > 0
                          ? (pageRange.length === 1 ? `Page ${pageRange[0]}` : `Pages ${pageRange[0]}–${pageRange[pageRange.length - 1]}`)
                          : null
                        return (
                          <div key={blockId}>
                            {blockContent && <p className="text-[15px] font-semibold text-[#1A1A1A] mb-2">{blockContent}</p>}
                            <button
                              onClick={() => pdfUrl && setPdfViewer({ url: pdfUrl, fileName: pdfFileName })}
                              className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{pdfFileName || 'document.pdf'}</p>
                                <p className="text-xs text-gray-500">
                                  {pageLabel && <span className="font-medium">{pageLabel} · </span>}
                                  {locale === 'fr' ? 'Cliquer pour ouvrir' : 'Click to open'}
                                </p>
                              </div>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        )
                      }

                      // Default fallback
                      return blockContent ? (
                        <div key={blockId}>
                          <p className="text-[17px] text-[#374151] leading-[1.75]">{blockContent}</p>
                        </div>
                      ) : null
                    })
                  })()}
                </div>
              </motion.div>
            )}

            {/* Exercise content */}
            {resource.type === 'exercise' && resource.blocks && resource.blocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{locale === 'fr' ? 'Étapes' : 'Steps'}</h2>
                    <p className="text-sm text-gray-500">{resource.blocks.length} {locale === 'fr' ? 'étapes' : 'steps'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {resource.blocks.map((block: ResourceBlock, idx: number) => {
                    const stepLabels: Record<string, string> = {
                      instruction: locale === 'fr' ? 'Instructions' : 'Instructions',
                      timed_action: locale === 'fr' ? 'Action minutée' : 'Timed Action',
                      breathing: locale === 'fr' ? 'Respiration' : 'Breathing',
                      visualization: locale === 'fr' ? 'Visualisation' : 'Visualization',
                      body_scan: locale === 'fr' ? 'Scan corporel' : 'Body Scan',
                      reflection: locale === 'fr' ? 'Réflexion' : 'Reflection',
                    }
                    return (
                      <div key={block.id || idx} className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-4">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{stepLabels[block.type] || block.type}</p>
                          {(block as any).instructions && <p className="text-sm text-gray-700">{(block as any).instructions}</p>}
                          {typeof block.content === 'string' && block.content && <p className="text-sm text-gray-700">{block.content}</p>}
                          {(block.type as string) === 'breathing' && (block as any).pattern && (
                            <p className="text-sm font-bold text-emerald-600 mt-1">{(block as any).pattern} &middot; {(block as any).cycles || 3} cycles</p>
                          )}
                          {(block.type as string) === 'timed_action' && (block as any).duration && (
                            <p className="text-xs text-gray-400 mt-1">{Math.floor((block as any).duration / 60)}m {(block as any).duration % 60}s</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
    </>
  )

  // For non-owners, show simpler public view
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Public Branding Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2">
                <Logo size="sm" showText />
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs h-8 px-3 border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    {locale === 'fr' ? 'Pour les praticiens' : 'For Practitioners'}
                  </Button>
                </Link>
                <Link href="/for-everyone">
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs h-8 px-3"
                  >
                    {locale === 'fr' ? 'Pour votre bien-être' : 'For Personal Wellbeing'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-6 h-6 ${config.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{typeof resource.title === 'string' ? resource.title : ''}</h1>
                    {resource.description && (
                      <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: typeof resource.description === 'string' ? resource.description : '' }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`${config.bg} ${config.text} ${config.border} border`}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {typeLabel}
                    </Badge>
                  </div>
                </div>

                  {/* Meta Row */}
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    {resource.category && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium">
                        {typeof resource.category === 'string' ? ((t.library.categories as Record<string, string>)[resource.category] || resource.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : ''}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {resource.tags.map((tag, idx) => (
                        <span
                          key={typeof tag === 'string' ? tag : idx}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full"
                        >
                          {typeof tag === 'string' ? tag : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {locale === 'fr' ? 'Créé le' : 'Created'} {new Date(resource.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
              </motion.div>
              {contentBlocks}
            </div>

            {/* Sidebar - Creator Info for public view */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {resource.visibility === 'onboarding' ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Bloomsline</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-4">
                    {locale === 'fr' ? 'Votre espace bien-être' : 'Your wellness space'}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {locale === 'fr'
                      ? "Cette ressource a été créée par l'équipe Bloomsline pour vous accompagner dans votre parcours."
                      : "This resource was created by the Bloomsline team to support you on your journey."}
                  </p>
                </motion.div>
              ) : resource.creator_profile && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                      {resource.creator_profile.avatar_url ? (
                        <img
                          src={resource.creator_profile.avatar_url}
                          alt={resource.creator_profile.full_name || ''}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-600">
                            {(resource.creator_profile.full_name || 'P').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {resource.creator_profile.is_verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {resource.creator_profile.full_name || (locale === 'fr' ? 'Praticien' : 'Practitioner')}
                      </p>
                      {resource.creator_profile.credentials.length > 0 && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {resource.creator_profile.credentials.slice(0, 3).join(', ')}
                        </p>
                      )}
                      {resource.creator_profile.years_experience && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {resource.creator_profile.years_experience}+ {locale === 'fr' ? 'ans d\'expérience' : 'years experience'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Headline */}
                  {resource.creator_profile.headline && (
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{resource.creator_profile.headline}</p>
                  )}

                  {/* Specialties */}
                  {resource.creator_profile.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {resource.creator_profile.specialties.slice(0, 4).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                      {resource.creator_profile.specialties.length > 4 && (
                        <span className="text-xs px-2.5 py-1 text-gray-400">
                          +{resource.creator_profile.specialties.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {resource.creator_profile.slug && (
                      <Link href={`/practitioner/${resource.creator_profile.slug}/book`}>
                        <Button className="w-full h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          {locale === 'fr' ? 'Réserver une séance' : 'Book a Session'}
                        </Button>
                      </Link>
                    )}
                    <Link href={resource.creator_profile.slug ? `/practitioner/${resource.creator_profile.slug}` : `/practitioner/${resource.creator_profile.id}`}>
                      <Button variant="outline" className="w-full h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm">
                        {locale === 'fr' ? 'Voir le profil' : 'View Profile'}
                      </Button>
                    </Link>
                  </div>

                  {/* Remove from library button for non-owners who have saved the resource */}
                  {isSaved && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="w-full h-10 rounded-xl border border-gray-200 hover:bg-amber-50 text-amber-600 text-sm"
                        onClick={handleRemoveFromLibrary}
                        disabled={removing}
                      >
                        {removing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {locale === 'fr' ? 'Retirer de ma bibliothèque' : 'Remove from library'}
                      </Button>
                    </div>
                  )}

                  {/* Branding */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-sm text-gray-400">
                    <span>{locale === 'fr' ? 'Fait avec soin sur' : 'Made with care on'}</span>
                    <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
                      <Logo size="sm" />
                      <span className="font-semibold">Bloomsline</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Share with members modal */}
        {resource && (
          <ShareResourceModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            resource={resource}
            members={members}
            locale={locale as 'en' | 'fr' | 'es'}
            onShare={handleShareWithMembers}
            groups={memberGroups}
          />
        )}
      </div>
    )
  }

  // Owner view with sidebar
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="library" />

      {/* Main Content */}
      <main className="flex-1 ml-14">
        <AppHeader
          user={user as any}
          leftContent={
            <div className="flex items-center gap-2 text-sm">
              <Link href="/resources" className="text-gray-500 hover:text-gray-700 transition-colors">
                <FolderOpen className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900 truncate max-w-[300px]">
                {typeof resource.title === 'string' ? resource.title : 'Resource'}
              </span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={`w-6 h-6 ${config.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{typeof resource.title === 'string' ? resource.title : ''}</h1>
                  {resource.description && (
                    <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: typeof resource.description === 'string' ? resource.description : '' }} />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`${config.bg} ${config.text} ${config.border} border`}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {typeLabel}
                  </Badge>
                  {isOwner && (
                    <Badge className={resource.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-amber-50 text-amber-700 border-amber-200 border'}>
                      {resource.status === 'published'
                        ? (locale === 'fr' ? 'Publié' : 'Published')
                        : (locale === 'fr' ? 'Brouillon' : 'Draft')
                      }
                    </Badge>
                  )}
                </div>
              </div>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {resource.category && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium">
                      {typeof resource.category === 'string' ? ((t.library.categories as Record<string, string>)[resource.category] || resource.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : ''}
                    </span>
                  )}
                  {/* Visibility badge - only show for owner */}
                  {isOwner && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                      {resource.visibility === 'onboarding' ? (
                        <>
                          <BookOpen className="w-4 h-4 text-teal-500" />
                          Onboarding
                        </>
                      ) : resource.visibility === 'public' ? (
                        <>
                          <Globe className="w-4 h-4 text-gray-400" />
                          {locale === 'fr' ? 'Public' : 'Public'}
                        </>
                      ) : resource.visibility === 'link_only' ? (
                        <>
                          <Globe className="w-4 h-4 text-gray-400" />
                          {locale === 'fr' ? 'Lien partageable' : 'Shareable link'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-gray-400" />
                          {locale === 'fr' ? 'Privé' : 'Private'}
                        </>
                      )}
                    </span>
                  )}
                  {/* Times assigned - only show for owner */}
                  {isOwner && resource.times_assigned > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      {resource.times_assigned} {locale === 'fr' ? 'assigné(s)' : 'assigned'}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {resource.tags.map((tag, idx) => (
                      <span
                        key={typeof tag === 'string' ? tag : idx}
                        className="text-xs px-3 py-1.5 bg-lavender-50 text-lavender-700 rounded-full"
                      >
                        {typeof tag === 'string' ? tag : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {locale === 'fr' ? 'Créé le' : 'Created'} {new Date(resource.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                  {/* Times completed - only show for owner */}
                  {isOwner && resource.times_completed > 0 && (
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {resource.times_completed} {locale === 'fr' ? 'complété(s)' : 'completed'}
                    </span>
                  )}
                </div>
            </motion.div>

            {contentBlocks}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8"
            >
              {/* Template mode: show Duplicate button */}
              {isTemplateView && (
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                  <Button
                    className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
                    disabled={duplicatingTemplate}
                    onClick={async () => {
                      setDuplicatingTemplate(true)
                      try {
                        const { data: { user: authUser } } = await supabase.auth.getUser()
                        if (!authUser || !resource) return
                        const title = typeof resource.title === 'string' ? resource.title : ((resource.title as any)?.[locale] || (resource.title as any)?.en || 'Untitled')
                        const description = typeof resource.description === 'string' ? resource.description : ((resource.description as any)?.[locale] || (resource.description as any)?.en || '')
                        const { data: newResource, error } = await supabase
                          .from('resources')
                          .insert({
                            practitioner_id: authUser.id,
                            title,
                            description,
                            type: resource.type || 'worksheet',
                            category: resource.category || null,
                            blocks: resource.blocks || [],
                            status: 'draft',
                            visibility: 'private',
                            language: resource.language || locale,
                          })
                          .select()
                          .single()
                        if (error) throw error
                        toast.success(locale === 'fr' ? 'Modèle dupliqué !' : 'Template duplicated!')
                        router.push(`/resources/create/worksheet?edit=${newResource.id}`)
                      } catch {
                        toast.error(locale === 'fr' ? 'Erreur lors de la duplication' : 'Failed to duplicate')
                      }
                      setDuplicatingTemplate(false)
                    }}
                  >
                    {duplicatingTemplate ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Copy className="w-5 h-5 mr-2" />
                    )}
                    {locale === 'fr' ? 'Dupliquer ce modèle' : 'Duplicate this template'}
                  </Button>
                </div>
              )}

              {/* Only show edit/delete buttons if the user is the owner */}
              {isOwner && !isTemplateView && (
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
                      onClick={() => router.push(`/resources/create/worksheet?edit=${resource.id}`)}
                    >
                      <Edit className="w-5 h-5 mr-2" />
                      {locale === 'fr' ? 'Éditer' : 'Edit'}
                    </Button>
                    {resource.visibility !== 'onboarding' && (
                      <Button variant="outline" className="h-11 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all px-3" onClick={() => setShowShareModal(true)}>
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border border-gray-200 hover:bg-red-50 text-red-600 transition-all"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {locale === 'fr' ? 'Supprimer' : 'Delete'}
                  </Button>
                </div>
              )}

              {/* Remove from library button for non-owners who have saved the resource */}
              {!isOwner && isSaved && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border border-gray-200 hover:bg-amber-50 text-amber-600 transition-all"
                    onClick={handleRemoveFromLibrary}
                    disabled={removing}
                  >
                    {removing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {locale === 'fr' ? 'Retirer de ma bibliothèque' : 'Remove from my library'}
                  </Button>
                </div>
              )}

              {/* Share link - show when published and public or link_only */}
              {resource.status === 'published' && (resource.visibility === 'public' || resource.visibility === 'link_only') && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    {locale === 'fr' ? 'Lien public' : 'Public link'}
                  </p>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {typeof window !== 'undefined' ? `${window.location.origin}/resources/${resource.id}` : `/resources/${resource.id}`}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Resource Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {locale === 'fr' ? 'Type' : 'Type'}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bg} ${config.text} text-sm font-medium`}>
                    <TypeIcon className="w-4 h-4" />
                    {typeLabel}
                  </span>
                </div>

                {/* Status - only show for owner */}
                {isOwner && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      {locale === 'fr' ? 'Statut' : 'Status'}
                    </p>
                    <Badge className={resource.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-amber-50 text-amber-700 border-amber-200 border'}>
                      {resource.status === 'published'
                        ? (locale === 'fr' ? 'Publié' : 'Published')
                        : resource.status === 'draft'
                        ? (locale === 'fr' ? 'Brouillon' : 'Draft')
                        : (locale === 'fr' ? 'Archivé' : 'Archived')
                      }
                    </Badge>
                  </div>
                )}

                {/* Visibility - only show for owner */}
                {isOwner && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      {locale === 'fr' ? 'Visibilité' : 'Visibility'}
                    </p>
                    <Badge className={resource.visibility === 'public' ? 'bg-blue-50 text-blue-700 border-blue-200 border' : resource.visibility === 'link_only' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-gray-50 text-gray-700 border-gray-200 border'}>
                      {resource.visibility === 'public' ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          {locale === 'fr' ? 'Public' : 'Public'}
                        </>
                      ) : resource.visibility === 'link_only' ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          {locale === 'fr' ? 'Lien partageable' : 'Shareable link'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          {locale === 'fr' ? 'Privé' : 'Private'}
                        </>
                      )}
                    </Badge>
                  </div>
                )}

                {resource.category && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      {locale === 'fr' ? 'Catégorie' : 'Category'}
                    </p>
                    <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-medium">
                      {typeof resource.category === 'string' ? ((t.library.categories as Record<string, string>)[resource.category] || resource.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) : ''}
                    </span>
                  </div>
                )}

                {/* Creator Profile Section */}
                {resource.creator_profile && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                      {locale === 'fr' ? 'Créé par' : 'Created by'}
                    </p>
                    <Link href={resource.creator_profile.slug ? `/practitioner/${resource.creator_profile.slug}` : `/practitioner/${resource.creator_profile.id}`}>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {resource.creator_profile.avatar_url ? (
                              <img
                                src={resource.creator_profile.avatar_url}
                                alt={resource.creator_profile.full_name || ''}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center shadow-md">
                                <span className="text-lg font-bold text-white">
                                  {(resource.creator_profile.full_name || 'P').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {resource.creator_profile.is_verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-mint-400 to-mint-600 rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-lavender-700 transition-colors">
                              {resource.creator_profile.full_name || (locale === 'fr' ? 'Praticien' : 'Practitioner')}
                            </p>

                            {/* Credentials */}
                            {resource.creator_profile.credentials.length > 0 && (
                              <p className="text-xs text-lavender-600 font-medium mt-0.5">
                                {resource.creator_profile.credentials.slice(0, 3).join(', ')}
                              </p>
                            )}

                            {/* Headline */}
                            {resource.creator_profile.headline && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {resource.creator_profile.headline}
                              </p>
                            )}

                            {/* Specialties Tags */}
                            {resource.creator_profile.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resource.creator_profile.specialties.slice(0, 3).map((specialty, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 bg-white/80 text-gray-600 rounded-full border border-gray-100"
                                  >
                                    {specialty}
                                  </span>
                                ))}
                                {resource.creator_profile.specialties.length > 3 && (
                                  <span className="text-[10px] px-2 py-0.5 text-gray-400">
                                    +{resource.creator_profile.specialties.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Years Experience */}
                            {resource.creator_profile.years_experience && (
                              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {resource.creator_profile.years_experience}+ {locale === 'fr' ? 'ans d\'expérience' : 'years experience'}
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Submissions & Shared Section - Only show for owner */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {resource.type === 'psychoeducation'
                          ? (locale === 'fr' ? 'Partagé avec' : 'Shared With')
                          : (locale === 'fr' ? 'Réponses des patients' : 'Member Submissions')}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {resource.type === 'psychoeducation'
                          ? `${sharedMembers.length} ${locale === 'fr' ? 'membre(s)' : 'member(s)'} · ${sharedMembers.filter(s => s.viewed_at).length} ${locale === 'fr' ? 'complété(s)' : 'completed'}`
                          : `${sharedMembers.length} ${locale === 'fr' ? 'partagé(s)' : 'shared'} · ${submissions.length} ${locale === 'fr' ? 'réponse(s)' : 'response(s)'}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="divide-y divide-gray-100">
                {loadingSubmissions ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>
                  </div>
                ) : sharedMembers.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Send className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      {resource.visibility === 'onboarding'
                        ? (locale === 'fr' ? 'Ressource d\'onboarding' : 'Onboarding resource')
                        : (locale === 'fr' ? 'Pas encore partagé' : 'Not shared yet')}
                    </p>
                    {resource.visibility !== 'onboarding' && (
                      <>
                        <p className="text-sm text-gray-400 mt-1">
                          {locale === 'fr'
                            ? 'Partagez cette ressource avec vos patients pour voir leurs réponses'
                            : 'Share this resource with your members to see their responses'}
                        </p>
                        <Button
                          onClick={() => setShowShareModal(true)}
                          className="mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {locale === 'fr' ? 'Partager' : 'Share'}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  (() => {
                    // Build a map of member_id -> submissions (all for recurring, latest for non-recurring)
                    const submissionsByMember = new Map<string, ResourceSubmission[]>()
                    submissions.forEach(sub => {
                      if (sub.member?.id) {
                        const existing = submissionsByMember.get(sub.member.id) || []
                        existing.push(sub)
                        submissionsByMember.set(sub.member.id, existing)
                      }
                    })
                    const isRecurringResource = !!(resource as any).is_recurring

                    return sharedMembers.map((shared) => {
                      const memberSubmissions = submissionsByMember.get(shared.member_id) || []
                      const submission = memberSubmissions.find(s => s.status !== 'draft') || memberSubmissions[0] || null
                      const submissionCount = memberSubmissions.filter(s => s.status === 'submitted' || s.status === 'reviewed').length
                      const isPsychoeducation = resource.type === 'psychoeducation'

                      // Determine status
                      let statusBadge: React.ReactNode
                      if (isPsychoeducation) {
                        statusBadge = shared.viewed_at ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">
                            <Eye className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'Complété' : 'Completed'}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-gray-200 border">
                            <Clock className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'Non lu' : 'Unread'}
                          </Badge>
                        )
                      } else if (submission) {
                        // If member completed the resource but response is still draft, treat as submitted
                        const effectiveStatus = (submission.status === 'draft' && shared.completed_at) ? 'submitted' : submission.status
                        statusBadge = effectiveStatus === 'reviewed' ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'Révisé' : 'Reviewed'}
                          </Badge>
                        ) : effectiveStatus === 'draft' ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">
                            <Edit className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'Brouillon' : 'Draft'}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'Complété' : 'Completed'}
                          </Badge>
                        )
                      } else {
                        statusBadge = (
                          <Badge className="bg-gray-100 text-gray-500 border-gray-200 border">
                            <Clock className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'En attente' : 'Pending'}
                          </Badge>
                        )
                      }

                      const dateStr = isPsychoeducation && shared.viewed_at
                        ? new Date(shared.viewed_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
                        : submission?.submitted_at
                        ? new Date(submission.submitted_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : new Date(shared.shared_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })

                      return (
                        <div
                          key={shared.member_id}
                          className="p-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Member Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              {shared.member?.avatar_url ? (
                                <img src={shared.member.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                  {shared.member?.first_name?.charAt(0) || 'M'}{shared.member?.last_name?.charAt(0) || ''}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {shared.member?.first_name} {shared.member?.last_name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {isPsychoeducation
                                    ? (shared.viewed_at
                                      ? `${locale === 'fr' ? 'Complété le' : 'Completed'} ${dateStr}`
                                      : `${locale === 'fr' ? 'Partagé le' : 'Shared'} ${dateStr}`)
                                    : (submission
                                      ? `${submission.status === 'draft' ? (locale === 'fr' ? 'Brouillon' : 'Draft') : (locale === 'fr' ? 'Complété le' : 'Completed')} ${dateStr}`
                                      : `${locale === 'fr' ? 'Partagé le' : 'Shared'} ${dateStr}`)}
                                </p>
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Score for scored worksheets */}
                              {hasScoring && submission?.scores?.total !== undefined && (
                                <div className="text-right mr-1">
                                  <p className="text-sm font-bold text-emerald-600">
                                    {submission.scores.total}/{submission.scores.maxScore}
                                  </p>
                                </div>
                              )}

                              {statusBadge}

                              {/* Submission count for recurring */}
                              {isRecurringResource && submissionCount > 1 && (
                                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                  {submissionCount}
                                </span>
                              )}

                              {/* View button for submissions */}
                              {!isPsychoeducation && submission && (
                                isRecurringResource && submissionCount > 1 ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const latest = memberSubmissions
                                        .filter(s => s.status === 'submitted' || s.status === 'reviewed')
                                        .sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime())[0]
                                      if (latest) {
                                        setSelectedSubmission({ ...latest, status: latest.status as 'draft' | 'submitted' | 'reviewed' })
                                        setReviewNotes(latest.practitioner_notes || '')
                                      }
                                    }}
                                    className="rounded-lg"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    {locale === 'fr' ? 'Voir' : 'View'}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const effectiveStatus = (submission.status === 'draft' && shared.completed_at) ? 'submitted' : submission.status
                                      setSelectedSubmission({ ...submission, status: effectiveStatus as 'draft' | 'submitted' | 'reviewed' })
                                      setReviewNotes(submission.practitioner_notes || '')
                                    }}
                                    className="rounded-lg"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    {locale === 'fr' ? 'Voir' : 'View'}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Reviewer Notes Preview */}
                          {submission?.practitioner_notes && (
                            <div className="mt-3 ml-13 pl-3 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600 line-clamp-2">{submission.practitioner_notes}</p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {selectedSubmission.member?.first_name?.charAt(0) || 'M'}{selectedSubmission.member?.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedSubmission.member?.first_name} {selectedSubmission.member?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedSubmission.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Submission navigation tabs for recurring */}
              {(() => {
                if (!(resource as any).is_recurring || !selectedSubmission.member?.id) return null
                const memberSubs = submissions
                  .filter(s => s.member?.id === selectedSubmission.member?.id && (s.status === 'submitted' || s.status === 'reviewed'))
                  .sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime())
                if (memberSubs.length <= 1) return null
                return (
                  <div className="flex gap-1.5 overflow-x-auto px-6 py-2.5 border-b border-gray-100 bg-gray-50/50">
                    {memberSubs.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission({ ...sub, status: sub.status as 'draft' | 'submitted' | 'reviewed' })
                          setReviewNotes(sub.practitioner_notes || '')
                        }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedSubmission.id === sub.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {new Date(sub.submitted_at || sub.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {sub.status === 'reviewed' && <span className="ml-1 text-emerald-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )
              })()}

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Score Section for Scored Worksheets/Assessments */}
                {hasScoring && selectedSubmission.scores?.total !== undefined && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-mint-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-800">
                          {locale === 'fr' ? 'Score total' : 'Total Score'}
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1">
                          {selectedSubmission.scores.total} / {selectedSubmission.scores.maxScore}
                        </p>
                      </div>
                      {selectedSubmission.scores.percentage !== undefined && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-base px-4 py-2">
                          {selectedSubmission.scores.percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Responses Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {locale === 'fr' ? 'Réponses' : 'Responses'}
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      // Get question blocks from resource
                      const blocks = (resource?.blocks || []) as ResourceBlock[]
                      const questionBlocks = blocks.filter(b =>
                        ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
                         'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input', 'table_exercise',
                         'video_response', 'audio_response', 'file_response'].includes(b.type)
                      )
                      const responses = (selectedSubmission.responses || {}) as Record<string, unknown>

                      if (questionBlocks.length === 0) {
                        return (
                          <p className="text-gray-500 text-sm italic">
                            {locale === 'fr' ? 'Aucune question dans cette ressource' : 'No questions in this resource'}
                          </p>
                        )
                      }

                      return questionBlocks.map((block, index) => {
                        const response = responses[block.id]
                        const hasResponse = response !== undefined && response !== null && response !== ''
                        const isTable = block.type === 'table_exercise'

                        if (isTable && hasResponse) {
                          const columns = ('columns' in block && Array.isArray(block.columns)) ? block.columns as { id: string; header: string }[] : []
                          const rows = Array.isArray(response) ? response as Record<string, string>[] : []
                          return (
                            <div key={block.id} className="p-4 rounded-xl bg-gray-50">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                {typeof block.content === 'string' ? block.content : `Table ${index + 1}`}
                              </p>
                              {rows.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr>
                                        {columns.map(col => (
                                          <th key={col.id} className="text-left px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-100/50">{col.header}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((row, ri) => (
                                        <tr key={ri}>
                                          {columns.map(col => (
                                            <td key={col.id} className="px-3 py-2 text-gray-900 border-b border-gray-100">{row[col.id] || '-'}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">{locale === 'fr' ? 'Aucune entrée' : 'No entries'}</p>
                              )}
                            </div>
                          )
                        }

                        return (
                          <div
                            key={block.id}
                            className={`p-4 rounded-xl ${hasResponse ? 'bg-gray-50' : 'bg-red-50/50'}`}
                          >
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Q{index + 1}: {typeof block.content === 'string' ? block.content : ''}
                            </p>
                            {block.type === 'video_response' && hasResponse && typeof response === 'string' && (response.startsWith('http') || response.startsWith('blob:')) ? (
                              <video src={response} controls className="w-full max-h-64 rounded-lg bg-black mt-2" preload="metadata" />
                            ) : block.type === 'audio_response' && hasResponse && typeof response === 'string' && (response.startsWith('http') || response.startsWith('blob:')) ? (
                              <audio src={response} controls className="w-full mt-2" preload="metadata" />
                            ) : (
                              <div className="mt-1">
                                {hasResponse
                                  ? <ResponseValueDisplay block={block} value={response} locale={locale} />
                                  : <span className="text-sm text-red-500 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Review Notes Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {locale === 'fr'
                      ? `Un mot pour ${selectedSubmission?.member?.first_name || 'votre patient'} ?`
                      : `Anything you'd like to say to ${selectedSubmission?.member?.first_name || 'your client'}?`}
                  </h4>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={locale === 'fr' ? 'Ajoutez vos notes ici...' : 'Add your notes here...'}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none resize-none h-32"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-100">
                <div>
                  {(selectedSubmission.status === 'submitted' || selectedSubmission.status === 'reviewed') && <Button
                    variant="ghost"
                    onClick={async () => {
                      if (!selectedSubmission) return
                      const confirmed = window.confirm(
                        locale === 'fr'
                          ? 'Rouvrir cette ressource ? Le patient pourra la remplir à nouveau.'
                          : 'Reopen this resource? The patient will be able to fill it in again.'
                      )
                      if (!confirmed) return
                      setSavingNotes(true)
                      try {
                        await updateSubmission(selectedSubmission.id, { status: 'draft' })
                        // Also clear completed_at on shared resource so member can fill again
                        if (selectedSubmission.member?.id && resource) {
                          await supabase
                            .from('member_shared_resources')
                            .update({ completed_at: null })
                            .eq('member_id', selectedSubmission.member.id)
                            .eq('resource_id', resource.id)
                        }
                        toast.success(locale === 'fr' ? 'Ressource rouverte pour le patient' : 'Resource reopened for patient')
                        fetchSubmissions(params.id as string)
                        setSelectedSubmission(null)
                      } catch {
                        toast.error(locale === 'fr' ? 'Échec de la réouverture' : 'Failed to reopen')
                      }
                      setSavingNotes(false)
                    }}
                    disabled={savingNotes}
                    className="rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Rouvrir pour le patient' : 'Reopen for patient'}
                  </Button>}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedSubmission(null)}
                    className="rounded-xl"
                  >
                    {locale === 'fr' ? 'Fermer' : 'Close'}
                  </Button>
                  <Button
                    onClick={handleSaveReviewNotes}
                    disabled={savingNotes}
                    className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                  >
                    {savingNotes ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {locale === 'fr' ? 'Marquer comme révisé' : 'Mark as Reviewed'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </div>
        {/* Share with members modal */}
        {resource && (
          <ShareResourceModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            resource={resource}
            members={members}
            locale={locale as 'en' | 'fr' | 'es'}
            onShare={handleShareWithMembers}
            groups={memberGroups}
          />
        )}
      </main>

      {/* PDF viewer overlay */}
      {pdfViewer && (
        <div className="fixed inset-0 z-[9999] bg-black/85 flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-black/60 z-10">
            <p className="text-sm font-medium text-white truncate">{pdfViewer.fileName || 'PDF Document'}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(pdfViewer.url, '_blank')}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setPdfViewer(null)}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <iframe
            src={pdfViewer.url}
            className="w-[90%] h-[85%] border-0 rounded-xl mt-12 bg-white"
            title={pdfViewer.fileName || 'PDF Document'}
          />
        </div>
      )}

      {/* Lightbox modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {lightbox.type === 'image' ? (
            <img
              src={lightbox.url}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-[90vw] max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  )
}
