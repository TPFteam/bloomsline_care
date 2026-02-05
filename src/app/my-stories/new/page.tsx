'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Check, Cloud, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { generateSlug, type ContentBlock } from '@/types/story'
import { BlockEditor } from '@/components/story/block-editor'
import { PublishModal } from '@/components/story/publish-modal'

export default function NewStoryPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [showPublishModal, setShowPublishModal] = useState(false)

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstChangeRef = useRef(true)

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!title.trim() || blocks.length === 0) return

    setAutoSaveStatus('saving')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('stories')
          .update({
            title: title.trim(),
            content: blocks,
          })
          .eq('id', draftId)

        if (error) throw error
      } else {
        // Create new draft
        const slug = generateSlug(title.trim(), user.id)
        const { data, error } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            title: title.trim(),
            content: blocks,
            media_urls: [],
            published: false,
            unique_slug: slug,
          })
          .select('id')
          .single()

        if (error) throw error
        if (data) {
          setDraftId(data.id)
          // Update URL to include draft ID
          router.replace(`/my-stories/${data.id}/edit`, { scroll: false })
        }
      }

      setAutoSaveStatus('saved')
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)

      // Reset to idle after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setAutoSaveStatus('error')
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    }
  }, [title, blocks, draftId, supabase, router])

  // Track changes and trigger auto-save
  useEffect(() => {
    // Skip first render
    if (isFirstChangeRef.current) {
      isFirstChangeRef.current = false
      return
    }

    // Only auto-save if there's meaningful content
    if (!title.trim() && blocks.length === 0) return

    setHasUnsavedChanges(true)

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save (2 second delay)
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave()
    }, 2000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, blocks, performAutoSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const handleSave = async (publish: boolean, secretCode?: string) => {
    if (!title.trim()) {
      toast.error(locale === 'fr' ? 'Veuillez entrer un titre' : locale === 'es' ? 'Por favor ingresa un título' : 'Please enter a title')
      return
    }

    if (blocks.length === 0) {
      toast.error(locale === 'fr' ? 'Veuillez ajouter au moins un bloc' : locale === 'es' ? 'Por favor agrega al menos un bloque de contenido' : 'Please add at least one content block')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('stories')
          .update({
            title: title.trim(),
            content: blocks,
            published: publish,
            secret_code: secretCode || null
          })
          .eq('id', draftId)

        if (error) throw error
      } else {
        // Create new story
        const slug = generateSlug(title.trim(), user.id)
        const { error } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            title: title.trim(),
            content: blocks,
            media_urls: [],
            published: publish,
            unique_slug: slug,
            secret_code: secretCode || null
          })

        if (error) throw error
      }

      setShowPublishModal(false)
      toast.success(publish
        ? (locale === 'fr' ? 'Histoire publiée!' : locale === 'es' ? '¡Historia publicada!' : 'Story published!')
        : (locale === 'fr' ? 'Brouillon enregistré' : locale === 'es' ? 'Borrador guardado' : 'Story saved as draft'))
      router.push('/my-stories')
    } catch (error) {
      console.error('Error saving story:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : locale === 'es' ? 'Error al guardar la historia' : 'Failed to save story')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-white to-teal-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver a las historias' : 'Back to Stories'}
          </Button>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                {locale === 'fr' ? 'Créer une histoire' : locale === 'es' ? 'Crear nueva historia' : 'Create New Story'}
              </h1>

              {/* Auto-save status */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span className="text-amber-600">{locale === 'fr' ? 'Enregistrement...' : locale === 'es' ? 'Guardando...' : 'Saving...'}</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600">{locale === 'fr' ? 'Enregistré' : locale === 'es' ? 'Guardado' : 'Saved'}</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-red-500">{locale === 'fr' ? 'Erreur d\'enregistrement' : locale === 'es' ? 'Error al guardar' : 'Save error'}</span>
                )}
                {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                  <>
                    <Cloud className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">{locale === 'fr' ? 'Non enregistré' : locale === 'es' ? 'Sin guardar' : 'Unsaved'}</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSavedAt && (
                  <>
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-400">
                      {locale === 'fr' ? 'Enregistré à ' : locale === 'es' ? 'Guardado a las ' : 'Saved at '}
                      {lastSavedAt.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Titre' : locale === 'es' ? 'Título' : 'Title'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={locale === 'fr' ? 'Donnez un titre à votre histoire...' : locale === 'es' ? 'Dale un título a tu historia...' : 'Give your story a title...'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/200 {locale === 'fr' ? 'caractères' : locale === 'es' ? 'caracteres' : 'characters'}</p>
              </div>

              {/* Block Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  {locale === 'fr' ? 'Contenu' : locale === 'es' ? 'Contenido de la historia' : 'Story Content'}
                </label>
                <BlockEditor blocks={blocks} onChange={setBlocks} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  {locale === 'fr' ? 'Enregistrer brouillon' : locale === 'es' ? 'Guardar borrador' : 'Save as Draft'}
                </Button>
                <Button
                  onClick={() => setShowPublishModal(true)}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  {locale === 'fr' ? 'Publier' : locale === 'es' ? 'Publicar historia' : 'Publish Story'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={(secretCode) => handleSave(true, secretCode)}
        saving={saving}
      />
    </div>
  )
}
