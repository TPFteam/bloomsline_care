'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Share2,
  Lock,
  KeyRound,
  FileText,
  Image,
  Clock,
  ChevronLeft,
  Loader2,
  MoreVertical,
  X,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import type { Story } from '@/types/story'
import { toast } from 'sonner'
import MemberLayout from '@/components/member/MemberLayout'

export default function MobileStoriesPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [codeModalStory, setCodeModalStory] = useState<Story | null>(null)
  const [newSecretCode, setNewSecretCode] = useState('')
  const [confirmSecretCode, setConfirmSecretCode] = useState('')
  const [savingCode, setSavingCode] = useState(false)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Parse content for each story safely
      const parsedStories = (data || []).map(story => {
        let parsedContent = []

        if (Array.isArray(story.content)) {
          parsedContent = story.content
        } else if (typeof story.content === 'string') {
          try {
            const parsed = JSON.parse(story.content)
            parsedContent = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            parsedContent = [{
              id: 'legacy',
              type: 'text',
              content: { text: story.content },
              order: 0
            }]
          }
        }

        return {
          ...story,
          content: parsedContent
        }
      })

      setStories(parsedStories)
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error(locale === 'fr' ? 'Erreur de chargement' : 'Failed to load stories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'fr' ? 'Voulez-vous supprimer cette histoire?' : 'Delete this story?')) return

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setStories(stories.filter(s => s.id !== id))
      toast.success(locale === 'fr' ? 'Histoire supprimée' : 'Story deleted')
      setActiveMenu(null)
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error(locale === 'fr' ? 'Erreur de suppression' : 'Failed to delete')
    }
  }

  const togglePublish = async (story: Story) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ published: !story.published })
        .eq('id', story.id)

      if (error) throw error

      setStories(stories.map(s =>
        s.id === story.id ? { ...s, published: !s.published } : s
      ))
      toast.success(story.published
        ? (locale === 'fr' ? 'Dépublié' : 'Unpublished')
        : (locale === 'fr' ? 'Publié' : 'Published'))
      setActiveMenu(null)
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error(locale === 'fr' ? 'Erreur de mise à jour' : 'Failed to update')
    }
  }

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/stories/${slug}`
    navigator.clipboard.writeText(url)
    toast.success(locale === 'fr' ? 'Lien copié!' : 'Link copied!')
    setActiveMenu(null)
  }

  const openCodeModal = (story: Story) => {
    setCodeModalStory(story)
    setNewSecretCode(story.secret_code || '')
    setConfirmSecretCode(story.secret_code || '')
    setActiveMenu(null)
  }

  const closeCodeModal = () => {
    setCodeModalStory(null)
    setNewSecretCode('')
    setConfirmSecretCode('')
  }

  const updateSecretCode = async () => {
    if (!codeModalStory) return

    if (newSecretCode && newSecretCode !== confirmSecretCode) {
      toast.error(locale === 'fr' ? 'Les codes ne correspondent pas' : 'Codes do not match')
      return
    }

    if (newSecretCode && newSecretCode.trim().length < 4) {
      toast.error(locale === 'fr' ? 'Minimum 4 caractères' : 'Min 4 characters')
      return
    }

    setSavingCode(true)
    try {
      const codeValue = newSecretCode.trim() || null
      const { error } = await supabase
        .from('stories')
        .update({ secret_code: codeValue })
        .eq('id', codeModalStory.id)

      if (error) throw error

      setStories(stories.map(s =>
        s.id === codeModalStory.id ? { ...s, secret_code: codeValue } : s
      ))
      toast.success(codeValue
        ? (locale === 'fr' ? 'Code mis à jour' : 'Code updated')
        : (locale === 'fr' ? 'Code supprimé' : 'Code removed'))
      closeCodeModal()
    } catch (error) {
      console.error('Error updating secret code:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Failed to update')
    } finally {
      setSavingCode(false)
    }
  }

  // Filter stories
  const filteredStories = stories.filter(s => {
    if (filter === 'all') return true
    if (filter === 'published') return s.published
    if (filter === 'draft') return !s.published
    return true
  })

  const publishedCount = stories.filter(s => s.published).length
  const draftCount = stories.filter(s => !s.published).length

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {locale === 'fr' ? 'Mes Histoires' : 'My Stories'}
              </h1>
              <p className="text-gray-500 text-sm">
                {locale === 'fr' ? 'Partagez vos pensées et expériences' : 'Share your thoughts and experiences'}
              </p>
            </div>
            <Link href="/my-stories/new">
              <Button
                size="sm"
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-200/50"
              >
                <Plus className="w-4 h-4 mr-1" />
                {locale === 'fr' ? 'Créer' : 'Create'}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        {stories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{stories.length}</p>
              <p className="text-xs text-gray-500">{locale === 'fr' ? 'Total' : 'Total'}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center">
              <p className="text-2xl font-bold text-emerald-600">{publishedCount}</p>
              <p className="text-xs text-emerald-600">{locale === 'fr' ? 'Publiés' : 'Published'}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-center">
              <p className="text-2xl font-bold text-gray-600">{draftCount}</p>
              <p className="text-xs text-gray-500">{locale === 'fr' ? 'Brouillons' : 'Drafts'}</p>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={`rounded-full whitespace-nowrap ${filter === 'all' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            {locale === 'fr' ? 'Tous' : 'All'}
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('published')}
            className={`rounded-full whitespace-nowrap ${filter === 'published' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
          >
            {locale === 'fr' ? 'Publiés' : 'Published'}
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('draft')}
            className={`rounded-full whitespace-nowrap ${filter === 'draft' ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
          >
            {locale === 'fr' ? 'Brouillons' : 'Drafts'}
          </Button>
        </div>

        {/* Stories List */}
        {filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-8 text-center border border-gray-100"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'published'
                ? (locale === 'fr' ? 'Aucune histoire publiée' : 'No published stories')
                : filter === 'draft'
                  ? (locale === 'fr' ? 'Aucun brouillon' : 'No drafts')
                  : (locale === 'fr' ? 'Aucune histoire' : 'No stories yet')}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {locale === 'fr'
                ? 'Commencez à partager vos pensées'
                : 'Start sharing your thoughts'}
            </p>
            <Link href="/my-stories/new">
              <Button className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Créer une histoire' : 'Create Story'}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredStories.map((story, index) => {
              const mediaCount = story.content?.filter((block: any) =>
                block.type === 'image' || block.type === 'video'
              ).length || 0

              const contentPreview = story.content
                ?.map((block: any) => {
                  if (block.type === 'text') return block.content?.text
                  if (block.type === 'heading') return block.content?.text
                  return ''
                })
                .filter(Boolean)
                .join(' ')
                .slice(0, 100)

              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Status bar */}
                  <div className={`h-1 ${story.published ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gray-200'}`} />

                  <div
                    className="p-4 cursor-pointer active:bg-gray-50"
                    onClick={() => router.push(`/my-stories/${story.id}/preview`)}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {story.published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <Eye className="w-3 h-3" />
                            {locale === 'fr' ? 'Publié' : 'Published'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <EyeOff className="w-3 h-3" />
                            {locale === 'fr' ? 'Brouillon' : 'Draft'}
                          </span>
                        )}
                        {story.secret_code && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Menu button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === story.id ? null : story.id)
                        }}
                        className="p-1.5 -mr-1 rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {story.title}
                    </h3>

                    {/* Preview */}
                    {contentPreview && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {contentPreview}...
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(story.updated_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {mediaCount > 0 && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <Image className="w-3 h-3" />
                          {mediaCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Menu */}
                  <AnimatePresence>
                    {activeMenu === story.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 overflow-hidden"
                      >
                        <div className="p-2 flex flex-wrap gap-2">
                          <Link href={`/my-stories/${story.id}/edit`}>
                            <Button variant="outline" size="sm" className="rounded-full text-xs">
                              <Edit className="w-3 h-3 mr-1" />
                              {locale === 'fr' ? 'Modifier' : 'Edit'}
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePublish(story)
                            }}
                          >
                            {story.published ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                {locale === 'fr' ? 'Dépublier' : 'Unpublish'}
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                {locale === 'fr' ? 'Publier' : 'Publish'}
                              </>
                            )}
                          </Button>
                          {story.published && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs text-teal-600 border-teal-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyShareLink(story.unique_slug)
                              }}
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              {locale === 'fr' ? 'Partager' : 'Share'}
                            </Button>
                          )}
                          {story.secret_code && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs text-purple-600 border-purple-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                openCodeModal(story)
                              }}
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              {locale === 'fr' ? 'Code' : 'Code'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs text-red-500 border-red-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(story.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {locale === 'fr' ? 'Supprimer' : 'Delete'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Secret Code Modal */}
      <AnimatePresence>
        {codeModalStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={closeCodeModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {locale === 'fr' ? 'Code Secret' : 'Secret Code'}
                </h2>
                <button
                  onClick={closeCodeModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Current code */}
              <div className="bg-purple-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-700 font-medium">
                      {locale === 'fr' ? 'Code actuel' : 'Current code'}
                    </p>
                    <p className="font-mono text-purple-900 bg-white px-3 py-1 rounded-lg mt-1 inline-block">
                      {codeModalStory.secret_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Change code */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {locale === 'fr' ? 'Nouveau code (vide pour supprimer)' : 'New code (empty to remove)'}
                  </label>
                  <input
                    type="text"
                    value={newSecretCode}
                    onChange={(e) => setNewSecretCode(e.target.value)}
                    placeholder={locale === 'fr' ? 'Min. 4 caractères' : 'Min. 4 characters'}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {locale === 'fr' ? 'Confirmer le code' : 'Confirm code'}
                  </label>
                  <input
                    type="text"
                    value={confirmSecretCode}
                    onChange={(e) => setConfirmSecretCode(e.target.value)}
                    placeholder={locale === 'fr' ? 'Répéter le code' : 'Repeat code'}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none"
                  />
                  {confirmSecretCode && newSecretCode !== confirmSecretCode && (
                    <p className="text-xs text-red-500 mt-1">
                      {locale === 'fr' ? 'Les codes ne correspondent pas' : 'Codes don\'t match'}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeCodeModal}
                  className="flex-1 rounded-xl h-12"
                  disabled={savingCode}
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={updateSecretCode}
                  disabled={savingCode || (newSecretCode !== '' && (newSecretCode.length < 4 || newSecretCode !== confirmSecretCode))}
                  className="flex-1 rounded-xl h-12 bg-purple-600 hover:bg-purple-700"
                >
                  {savingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : newSecretCode ? (
                    locale === 'fr' ? 'Mettre à jour' : 'Update'
                  ) : (
                    locale === 'fr' ? 'Supprimer' : 'Remove'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MemberLayout>
  )
}
