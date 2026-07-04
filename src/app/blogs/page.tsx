'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, PenLine, Check, Clock, AlertCircle, Loader2, Video, Star, Trash2, Send, X } from 'lucide-react'
import { AppSidebar, AppHeader } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { isAdmin } from '@/lib/admin'
import { listMyPosts } from '@/lib/blog/queries'
import { listMyVideos } from '@/lib/videos/queries'
import { listMyReviews, createReview, updateReview, submitReview, deleteReview } from '@/lib/reviews/queries'
import type { BlogPost, BlogStatus } from '@/types/blog'
import type { PractitionerVideo } from '@/types/video'
import type { PractitionerReview } from '@/types/review'
import type { User } from '@/types/user'
import { toast } from 'sonner'

type Tab = 'blogs' | 'videos' | 'reviews'

export default function BlogsPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState(false)
  const [tab, setTab] = useState<Tab>('blogs')

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [videos, setVideos] = useState<PractitionerVideo[]>([])
  const [reviews, setReviews] = useState<PractitionerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [videosLoaded, setVideosLoaded] = useState(false)
  const [reviewsLoaded, setReviewsLoaded] = useState(false)

  const [reviewModal, setReviewModal] = useState<PractitionerReview | 'new' | null>(null)

  // Auth + blogs (default tab) upfront. Tab deep-link read from the URL.
  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/sign-in'); return }
      setAdmin(isAdmin(authUser.id))
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle()
      setUser((profile as User) ?? ({ id: authUser.id, email: authUser.email } as User))
      setPosts(await listMyPosts())
      setLoading(false)
    })()
    const initial = new URLSearchParams(window.location.search).get('tab')
    if (initial === 'videos' || initial === 'reviews') setTab(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lazy-load a tab's data the first time it's opened.
  useEffect(() => {
    if (tab === 'videos' && !videosLoaded) {
      listMyVideos().then(v => { setVideos(v); setVideosLoaded(true) })
    }
    if (tab === 'reviews' && !reviewsLoaded) {
      listMyReviews().then(r => { setReviews(r); setReviewsLoaded(true) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const switchTab = (next: Tab) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === 'blogs') url.searchParams.delete('tab')
    else url.searchParams.set('tab', next)
    window.history.replaceState(null, '', url.toString())
  }

  const refreshReviews = async () => setReviews(await listMyReviews())

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="blogs" />
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          isAdmin={admin}
          leftContent={<div className="text-sm font-medium text-gray-900">{t('Studio', 'Studio')}</div>}
        />

        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-8 bg-gray-100 p-1 rounded-full w-fit">
            {([
              { id: 'blogs' as Tab, label: t('Blogs', 'Blogs') },
              { id: 'videos' as Tab, label: t('Videos', 'Vidéos') },
              { id: 'reviews' as Tab, label: t('Reviews', 'Avis') },
            ]).map(tb => (
              <button
                key={tb.id}
                onClick={() => switchTab(tb.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tab === tb.id ? 'bg-white shadow-sm text-teal-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* ── Blogs ── */}
          {tab === 'blogs' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t('Your blogs', 'Vos blogs')}</h1>
                  <p className="text-sm text-gray-500 mt-1">{t('Write, submit for review, and we publish it on bloomsline.com.', 'Rédigez, envoyez pour validation, et on le publie sur bloomsline.com.')}</p>
                </div>
                <Link href="/blogs/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shrink-0">
                  <Plus className="w-4 h-4" /> {t('New post', 'Nouvel article')}
                </Link>
              </div>

              {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
              ) : posts.length === 0 ? (
                <EmptyState
                  icon={<PenLine className="w-5 h-5 text-teal-600" />}
                  title={t('No posts yet', 'Aucun article pour l\'instant')}
                  sub={t('Share something with the people who read you.', 'Partagez quelque chose avec celles et ceux qui vous lisent.')}
                  cta={<Link href="/blogs/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"><Plus className="w-4 h-4" /> {t('Write your first post', 'Écrire votre premier article')}</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {posts.map((p) => (
                    <Link key={p.id} href={`/blogs/${p.id}`} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 pr-5 hover:shadow-md hover:shadow-gray-100 hover:border-gray-200 transition-all">
                      {p.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_image_url} alt="" className="w-24 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-gray-50 flex items-center justify-center shrink-0">
                          <PenLine className="w-4 h-4 text-teal-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-teal-800 transition-colors">{p.title || t('Untitled', 'Sans titre')}</h2>
                        {p.excerpt && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.excerpt}</p>}
                        <p className="text-xs text-gray-400 mt-1.5">{t('Updated', 'Modifié')} {fmtDate(p.updated_at, locale)}</p>
                      </div>
                      <StatusPill status={p.status} isLive={p.published_snapshot != null} t={t} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Videos ── */}
          {tab === 'videos' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t('Your videos', 'Vos vidéos')}</h1>
                  <p className="text-sm text-gray-500 mt-1">{t('Upload a video, submit for review, and we publish it on bloomsline.com.', 'Téléversez une vidéo, envoyez pour validation, et on la publie sur bloomsline.com.')}</p>
                </div>
                <Link href="/blogs/videos/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shrink-0">
                  <Plus className="w-4 h-4" /> {t('New video', 'Nouvelle vidéo')}
                </Link>
              </div>

              {!videosLoaded ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
              ) : videos.length === 0 ? (
                <EmptyState
                  icon={<Video className="w-5 h-5 text-teal-600" />}
                  title={t('No videos yet', 'Aucune vidéo pour l\'instant')}
                  sub={t('Record something worth sharing.', 'Enregistrez quelque chose à partager.')}
                  cta={<Link href="/blogs/videos/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"><Plus className="w-4 h-4" /> {t('Upload your first video', 'Téléverser votre première vidéo')}</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {videos.map((v) => (
                    <Link key={v.id} href={`/blogs/videos/${v.id}`} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 pr-5 hover:shadow-md hover:shadow-gray-100 hover:border-gray-200 transition-all">
                      <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-gray-50 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-teal-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-teal-800 transition-colors">{v.title || t('Untitled', 'Sans titre')}</h2>
                        {v.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{v.description}</p>}
                        <p className="text-xs text-gray-400 mt-1.5">{t('Updated', 'Modifié')} {fmtDate(v.updated_at, locale)}</p>
                      </div>
                      <StatusPill status={v.status} isLive={false} t={t} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t('Your reviews', 'Vos avis')}</h1>
                  <p className="text-sm text-gray-500 mt-1">{t('Tell us what Bloomsline means to you. With your consent, we may share it.', 'Dites-nous ce que Bloomsline représente pour vous. Avec votre accord, nous pourrons le partager.')}</p>
                </div>
                <button onClick={() => setReviewModal('new')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shrink-0">
                  <Plus className="w-4 h-4" /> {t('Write a review', 'Écrire un avis')}
                </button>
              </div>

              {!reviewsLoaded ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
              ) : reviews.length === 0 ? (
                <EmptyState
                  icon={<Star className="w-5 h-5 text-teal-600" />}
                  title={t('No reviews yet', 'Aucun avis pour l\'instant')}
                  sub={t('Share your experience with Bloomsline.', 'Partagez votre expérience avec Bloomsline.')}
                  cta={<button onClick={() => setReviewModal('new')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"><Plus className="w-4 h-4" /> {t('Write your first review', 'Écrire votre premier avis')}</button>}
                />
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <button key={r.id} onClick={() => setReviewModal(r)} className="w-full text-left group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 pr-5 hover:shadow-md hover:shadow-gray-100 hover:border-gray-200 transition-all">
                      <div className="min-w-0 flex-1">
                        <Stars value={r.rating ?? 0} />
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{r.content || t('(empty)', '(vide)')}</p>
                        <p className="text-xs text-gray-400 mt-2">{t('Updated', 'Modifié')} {fmtDate(r.updated_at, locale)}</p>
                      </div>
                      <StatusPill status={r.status} isLive={false} t={t} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {reviewModal && (
        <ReviewModal
          review={reviewModal === 'new' ? null : reviewModal}
          locale={locale}
          t={t}
          onClose={() => setReviewModal(null)}
          onSaved={async () => { setReviewModal(null); await refreshReviews() }}
        />
      )}
    </div>
  )
}

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
}

function EmptyState({ icon, title, sub, cta }: { icon: React.ReactNode; title: string; sub: string; cta: React.ReactNode }) {
  return (
    <div className="py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">{icon}</div>
      <p className="text-gray-900 font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1 mb-6">{sub}</p>
      {cta}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-4 h-4 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

function StatusPill({ status, isLive, t }: { status: BlogStatus; isLive: boolean; t: (en: string, fr: string) => string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    live: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Check className="w-3 h-3" />, label: isLive && status === 'draft' ? t('Live · editing', 'En ligne · édition') : t('Live', 'En ligne') },
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" />, label: t('In review', 'En validation') },
    changes_requested: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3" />, label: t('Changes requested', 'Modifications') },
    unpublished: { cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: <AlertCircle className="w-3 h-3" />, label: t('Unpublished', 'Dépublié') },
    draft: { cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: <PenLine className="w-3 h-3" />, label: t('Draft', 'Brouillon') },
  }
  const key = status === 'published' || (isLive && status === 'draft') ? 'live' : status
  const c = map[key] ?? map.draft
  return <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${c.cls}`}>{c.icon}{c.label}</span>
}

// ── Write / edit a review ──
function ReviewModal({ review, locale, t, onClose, onSaved }: {
  review: PractitionerReview | null
  locale: string
  t: (en: string, fr: string) => string
  onClose: () => void
  onSaved: () => void
}) {
  const [rating, setRating] = useState<number>(review?.rating ?? 0)
  const [hover, setHover] = useState<number>(0)
  const [content, setContent] = useState(review?.content ?? '')
  const [consent, setConsent] = useState(review?.consent_publish ?? false)
  const [busy, setBusy] = useState(false)
  const isSubmitted = review?.status === 'pending' || review?.status === 'published'

  // Persist (create or update) and return the id.
  const persist = async (): Promise<string | null> => {
    if (review) {
      const { error } = await updateReview(review.id, { rating: rating || null, content, consent_publish: consent })
      if (error) { toast.error(t('Could not save', 'Échec de l\'enregistrement')); return null }
      return review.id
    }
    const res = await createReview({ rating: rating || null, content, consent_publish: consent })
    if ('error' in res) { toast.error(t('Could not save', 'Échec de l\'enregistrement')); return null }
    return res.id
  }

  const saveDraft = async () => {
    setBusy(true)
    const id = await persist()
    setBusy(false)
    if (id) { toast.success(t('Saved', 'Enregistré')); onSaved() }
  }

  const submit = async () => {
    if (!content.trim()) { toast.error(t('Write a few words first', 'Écrivez quelques mots d\'abord')); return }
    setBusy(true)
    const id = await persist()
    if (id) {
      const { error } = await submitReview(id)
      if (error) toast.error(t('Could not submit', 'Échec de l\'envoi'))
      else toast.success(t('Submitted for review', 'Envoyé pour validation'))
    }
    setBusy(false)
    if (id) onSaved()
  }

  const remove = async () => {
    if (!review) return
    setBusy(true)
    const { error } = await deleteReview(review.id)
    setBusy(false)
    if (error) toast.error(t('Could not delete', 'Échec de la suppression'))
    else { toast.success(t('Deleted', 'Supprimé')); onSaved() }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{review ? t('Your review', 'Votre avis') : t('Write a review', 'Écrire un avis')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-5">
          {isSubmitted && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {review?.status === 'published' ? t('This review is live.', 'Cet avis est en ligne.') : t('This review is in review. Saving will update it.', 'Cet avis est en validation. L\'enregistrement le mettra à jour.')}
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t('Rating', 'Note')}</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
                  <Star className={`w-7 h-7 transition-colors ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t('Your review', 'Votre avis')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder={t('What has Bloomsline changed for you and your practice?', 'Qu\'est-ce que Bloomsline a changé pour vous et votre pratique ?')}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <span className="text-sm text-gray-600">{t('I consent to Bloomsline publishing this review (with my name and photo) on bloomsline.com and marketing.', 'J\'autorise Bloomsline à publier cet avis (avec mon nom et ma photo) sur bloomsline.com et ses supports marketing.')}</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-gray-100">
          {review ? (
            <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> {t('Delete', 'Supprimer')}
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={saveDraft} disabled={busy} className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">{t('Save draft', 'Brouillon')}</button>
            <button onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {t('Submit', 'Envoyer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
