'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ImagePlus, Trash2, Loader2, Eye, PenLine, Send, Check, Clock, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { BlogContent } from './BlogContent'
import { RichBlogEditor } from './RichBlogEditor'
import { autoExcerpt } from '@/lib/blog/markdown'
import { createPost, updatePost, submitPost, deletePost, uploadBlogImage } from '@/lib/blog/queries'
import type { BlogPost, BlogStatus } from '@/types/blog'

const tr = (locale: string, en: string, fr: string) => (locale === 'fr' ? fr : en)

export function BlogEditor({ initialPost }: { initialPost: BlogPost | null }) {
  const router = useRouter()
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => tr(locale, en, fr)

  const [postId, setPostId] = useState<string | null>(initialPost?.id ?? null)
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [coverUrl, setCoverUrl] = useState<string | null>(initialPost?.cover_image_url ?? null)
  const [postLang, setPostLang] = useState(initialPost?.language ?? (locale === 'fr' ? 'fr' : 'en'))
  const [status, setStatus] = useState<BlogStatus>(initialPost?.status ?? 'draft')
  const reviewNote = initialPost?.review_note ?? null
  const isLive = initialPost?.published_snapshot != null

  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const coverInput = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  // Grow the title box to fit a long title instead of scrolling inside one line.
  const grow = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(() => { grow(titleRef.current) }, [])

  const input = () => ({
    title: title.trim(),
    excerpt: excerpt.trim() || autoExcerpt(content),
    content,
    cover_image_url: coverUrl,
    language: postLang,
  })

  // Persist the working copy. Returns the id (creating the row on first save).
  async function persist(): Promise<string | null> {
    if (postId) {
      const res = await updatePost(postId, input())
      if (res.error) { toast.error(t('Could not save', 'Échec de l\'enregistrement')); return null }
      return postId
    }
    const res = await createPost(input())
    if ('error' in res) { toast.error(t('Could not create', 'Échec de la création')); return null }
    setPostId(res.id)
    // Move the URL to the post without a reload, so subsequent saves update it.
    router.replace(`/blogs/${res.id}`)
    return res.id
  }

  async function handleSaveDraft() {
    if (saving) return
    setSaving(true)
    const id = await persist()
    setSaving(false)
    if (id) toast.success(t('Draft saved', 'Brouillon enregistré'))
  }

  async function handleSubmit() {
    if (saving) return
    if (!title.trim()) { toast.error(t('Add a title first', 'Ajoutez un titre d\'abord')); return }
    if (content.replace(/\s/g, '').length < 20) { toast.error(t('Write a bit more before submitting', 'Écrivez un peu plus avant d\'envoyer')); return }
    setSaving(true)
    const id = await persist()
    if (!id) { setSaving(false); return }
    const res = await submitPost(id)
    setSaving(false)
    if (res.error) { toast.error(t('Could not submit', 'Échec de l\'envoi')); return }
    setStatus('pending')
    toast.success(t('Sent for review', 'Envoyé pour validation'))
    router.push('/blogs')
  }

  async function handleCover(file: File) {
    setUploading(true)
    const res = await uploadBlogImage(file)
    setUploading(false)
    if ('error' in res) { toast.error(t('Upload failed', 'Échec du téléversement')); return }
    setCoverUrl(res.url)
  }

  function handleDelete() {
    if (!postId) { router.push('/blogs'); return }
    setConfirmingDelete(true)
  }

  async function confirmDelete() {
    if (!postId) return
    setDeleting(true)
    const res = await deletePost(postId)
    if (res.error) { setDeleting(false); toast.error(t('Could not delete', 'Échec de la suppression')); return }
    toast.success(t('Post deleted', 'Article supprimé'))
    router.push('/blogs')
  }

  return (
    <>
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.push('/blogs')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('Blogs', 'Blogs')}
        </button>
        <div className="flex items-center gap-2">
          <StatusPill status={status} isLive={isLive} t={t} />
          <button onClick={handleSaveDraft} disabled={saving} className="px-3.5 py-1.5 rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
            {t('Save', 'Enregistrer')}
          </button>
          <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isLive ? t('Submit changes', 'Envoyer les modifications') : t('Submit for review', 'Envoyer pour validation')}
          </button>
        </div>
      </div>

      {/* Review feedback */}
      {status === 'changes_requested' && reviewNote && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs font-semibold tracking-wide uppercase text-amber-700 mb-1">{t('Changes requested', 'Modifications demandées')}</p>
          <p className="text-sm text-amber-900 leading-relaxed">{reviewNote}</p>
        </div>
      )}
      {isLive && status === 'pending' && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500">
          {t('Your changes are in review. The live version stays up until they\'re approved.', 'Vos modifications sont en validation. La version en ligne reste publiée jusqu\'à approbation.')}
        </div>
      )}

      {/* Cover image */}
      {coverUrl ? (
        <div className="relative mb-8 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" className="w-full h-60 object-cover rounded-2xl" />
          <button onClick={() => setCoverUrl(null)} className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/55 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            {t('Remove cover', 'Retirer la couverture')}
          </button>
        </div>
      ) : (
        <button onClick={() => coverInput.current?.click()} disabled={uploading} className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-teal-700 transition-colors">
          <ImagePlus className="w-4 h-4" /> {t('Add a cover image', 'Ajouter une couverture')}
        </button>
      )}
      <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} />

      {/* Title */}
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => { setTitle(e.target.value); grow(e.target) }}
        placeholder={t('Title', 'Titre')}
        rows={1}
        className="w-full resize-none overflow-hidden border-0 outline-none bg-transparent text-3xl sm:text-4xl font-semibold text-gray-900 placeholder:text-gray-300 leading-tight tracking-tight mb-6"
      />

      {/* Edit / Preview */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-100">
        <Tab active={tab === 'write'} onClick={() => setTab('write')} icon={<PenLine className="w-3.5 h-3.5" />} label={t('Edit', 'Édition')} />
        <Tab active={tab === 'preview'} onClick={() => setTab('preview')} icon={<Eye className="w-3.5 h-3.5" />} label={t('Preview', 'Aperçu')} />
      </div>

      {tab === 'write' ? (
        <RichBlogEditor
          value={content}
          onChange={setContent}
          uploading={uploading}
          placeholder={t('Write your story…', 'Écrivez votre article…')}
          uploadImage={async (file) => {
            setUploading(true)
            const res = await uploadBlogImage(file)
            setUploading(false)
            if ('error' in res) { toast.error(t('Upload failed', 'Échec du téléversement')); return null }
            return res.url
          }}
        />
      ) : (
        <div className="min-h-[50vh]">
          {content.trim()
            ? <BlogContent markdown={content} />
            : <p className="text-gray-300 italic">{t('Nothing to preview yet.', 'Rien à prévisualiser pour l\'instant.')}</p>}
        </div>
      )}

      {/* Meta: excerpt + language + delete */}
      <div className="mt-12 pt-8 border-t border-gray-100 space-y-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">{t('Summary (optional)', 'Résumé (optionnel)')}</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder={t('A short line shown in the blog list. Left blank, we\'ll use your opening.', 'Une courte phrase affichée dans la liste. Si vide, on prend votre intro.')}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-teal-400 resize-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('Language', 'Langue')}</span>
            {(['en', 'fr'] as const).map((lng) => (
              <button key={lng} onClick={() => setPostLang(lng)} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${postLang === lng ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={handleDelete} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" /> {t('Delete', 'Supprimer')}
          </button>
        </div>
      </div>
    </div>

    {/* Delete confirmation — custom modal (no native browser alert) */}
    {confirmingDelete && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }} onClick={() => !deleting && setConfirmingDelete(false)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('Delete this post?', 'Supprimer cet article ?')}</h3>
          <p className="text-sm text-gray-600 mb-5">
            {t('This permanently deletes the post and removes it from bloomsline.com if it was live. This cannot be undone.', 'Cela supprime définitivement l\'article et le retire de bloomsline.com s\'il était en ligne. Action irréversible.')}
          </p>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setConfirmingDelete(false)} disabled={deleting} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
              {t('Cancel', 'Annuler')}
            </button>
            <button onClick={confirmDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {t('Delete', 'Supprimer')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${active ? 'border-teal-600 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
      {icon} {label}
    </button>
  )
}

function StatusPill({ status, isLive, t }: { status: BlogStatus; isLive: boolean; t: (en: string, fr: string) => string }) {
  // When a live post has unsubmitted edits, it's a 'draft' working copy but still public.
  if (isLive && status === 'draft') return <Pill tone="green" icon={<Check className="w-3 h-3" />}>{t('Live · editing', 'En ligne · édition')}</Pill>
  switch (status) {
    case 'published': return <Pill tone="green" icon={<Check className="w-3 h-3" />}>{t('Live', 'En ligne')}</Pill>
    case 'pending': return <Pill tone="amber" icon={<Clock className="w-3 h-3" />}>{t('In review', 'En validation')}</Pill>
    case 'changes_requested': return <Pill tone="red" icon={<AlertCircle className="w-3 h-3" />}>{t('Changes requested', 'Modifications demandées')}</Pill>
    case 'unpublished': return <Pill tone="gray" icon={<AlertCircle className="w-3 h-3" />}>{t('Unpublished', 'Dépublié')}</Pill>
    default: return <Pill tone="gray" icon={<PenLine className="w-3 h-3" />}>{t('Draft', 'Brouillon')}</Pill>
  }
}

function Pill({ tone, icon, children }: { tone: 'green' | 'amber' | 'red' | 'gray'; icon: React.ReactNode; children: React.ReactNode }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]}`}>{icon}{children}</span>
}
