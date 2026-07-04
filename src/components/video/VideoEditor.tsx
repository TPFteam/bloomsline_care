'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UploadCloud, Loader2, Send, Trash2, Video as VideoIcon, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createVideo, updateVideo, submitVideo, deleteVideo, uploadVideoFile } from '@/lib/videos/queries'
import type { PractitionerVideo } from '@/types/video'
import { toast } from 'sonner'

// Create/edit a practitioner video. Data + file live on the admin Supabase
// project via the /api/videos routes. The draft row is created lazily (on first
// save or file pick) so bailing out of "New video" leaves nothing behind.
export function VideoEditor({ initialVideo }: { initialVideo: PractitionerVideo | null }) {
  const router = useRouter()
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const fileRef = useRef<HTMLInputElement>(null)

  const [videoId, setVideoId] = useState<string | null>(initialVideo?.id ?? null)
  const [title, setTitle] = useState(initialVideo?.title ?? '')
  const [description, setDescription] = useState(initialVideo?.description ?? '')
  const [language, setLanguage] = useState(initialVideo?.language ?? locale ?? 'en')
  const [storagePath, setStoragePath] = useState<string | null>(initialVideo?.storage_path ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialVideo?.playback_url ?? null)
  const status = initialVideo?.status ?? 'draft'
  const reviewNote = initialVideo?.review_note ?? null

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)

  const ensureDraft = async (): Promise<string | null> => {
    if (videoId) return videoId
    const res = await createVideo({ title, description, language })
    if ('error' in res) { toast.error(t('Could not create draft', 'Impossible de créer le brouillon')); return null }
    setVideoId(res.id)
    return res.id
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('video/')) { toast.error(t('Please choose a video file', 'Choisissez un fichier vidéo')); return }
    const id = await ensureDraft()
    if (!id) return
    setUploading(true)
    setProgress(0)
    const res = await uploadVideoFile(id, file, setProgress)
    setUploading(false)
    if ('error' in res) { toast.error(t('Upload failed', 'Échec du téléversement')); return }
    setStoragePath(res.path)
    await updateVideo(id, { storage_path: res.path })
    setPreviewUrl(URL.createObjectURL(file)) // instant local preview
    toast.success(t('Video uploaded', 'Vidéo téléversée'))
  }

  const save = async (): Promise<string | null> => {
    const id = await ensureDraft()
    if (!id) return null
    const { error } = await updateVideo(id, { title, description, language, storage_path: storagePath })
    if (error) { toast.error(t('Could not save', 'Échec de l\'enregistrement')); return null }
    return id
  }

  const onSaveDraft = async () => {
    setBusy(true)
    const id = await save()
    setBusy(false)
    if (id) { toast.success(t('Saved', 'Enregistré')); router.push('/blogs?tab=videos') }
  }

  const onSubmit = async () => {
    if (!storagePath) { toast.error(t('Upload a video first', 'Téléversez d\'abord une vidéo')); return }
    if (!title.trim()) { toast.error(t('Add a title', 'Ajoutez un titre')); return }
    setBusy(true)
    const id = await save()
    if (id) {
      const { error } = await submitVideo(id)
      if (error) toast.error(t('Could not submit', 'Échec de l\'envoi'))
      else { toast.success(t('Submitted for review', 'Envoyé pour validation')); router.push('/blogs?tab=videos') }
    }
    setBusy(false)
  }

  const onDelete = async () => {
    if (!videoId) { router.push('/blogs?tab=videos'); return }
    setBusy(true)
    const { error } = await deleteVideo(videoId)
    setBusy(false)
    if (error) toast.error(t('Could not delete', 'Échec de la suppression'))
    else { toast.success(t('Deleted', 'Supprimé')); router.push('/blogs?tab=videos') }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button onClick={() => router.push('/blogs?tab=videos')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('Back to videos', 'Retour aux vidéos')}
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">
        {initialVideo ? t('Edit video', 'Modifier la vidéo') : t('New video', 'Nouvelle vidéo')}
      </h1>

      {status === 'changes_requested' && reviewNote && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">{t('Changes requested', 'Modifications demandées')}</p>
            <p className="text-sm text-red-600 mt-0.5">{reviewNote}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Upload / preview */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">{t('Video', 'Vidéo')}</label>
          {previewUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={previewUrl} controls className="w-full rounded-2xl bg-black aspect-video" />
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors py-12 flex flex-col items-center justify-center gap-2 text-gray-500"
            >
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-teal-500" /> : <UploadCloud className="w-6 h-6 text-teal-500" />}
              <span className="text-sm font-medium">{uploading ? t('Uploading…', 'Téléversement…') : t('Choose a video to upload', 'Choisir une vidéo à téléverser')}</span>
              <span className="text-xs text-gray-400">MP4, MOV, WebM</span>
            </button>
          )}

          {uploading && (
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          {previewUrl && !uploading && (
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800">
              <VideoIcon className="w-4 h-4" /> {t('Replace video', 'Remplacer la vidéo')}
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">{t('Title', 'Titre')}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('A short, clear title', 'Un titre court et clair')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">{t('Description', 'Description')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={t('What is this video about?', 'De quoi parle cette vidéo ?')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm resize-none" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">{t('Language', 'Langue')}</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm">
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-8 pt-6 border-t border-gray-100">
        <button onClick={onDelete} disabled={busy || uploading} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
          <Trash2 className="w-4 h-4" /> {initialVideo ? t('Delete', 'Supprimer') : t('Discard', 'Abandonner')}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onSaveDraft} disabled={busy || uploading} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">{t('Save draft', 'Brouillon')}</button>
          <button onClick={onSubmit} disabled={busy || uploading} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('Submit for review', 'Envoyer pour validation')}
          </button>
        </div>
      </div>
    </div>
  )
}
