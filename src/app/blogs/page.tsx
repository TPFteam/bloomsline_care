'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, PenLine, Check, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { AppSidebar, AppHeader } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { useLanguage } from '@/lib/i18n/context'
import { isAdmin } from '@/lib/admin'
import { listMyPosts } from '@/lib/blog/queries'
import type { BlogPost, BlogStatus } from '@/types/blog'
import type { User } from '@/types/user'

export default function BlogsPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const t = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState(false)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="blogs" />
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          isAdmin={admin}
          leftContent={<div className="text-sm font-medium text-gray-900">{t('Blogs', 'Blogs')}</div>}
        />

        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t('Your blogs', 'Vos blogs')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('Write, submit for review, and we publish it on bloomsline.com.', 'Rédigez, envoyez pour validation, et on le publie sur bloomsline.com.')}</p>
            </div>
            <Link href="/blogs/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
              <Plus className="w-4 h-4" /> {t('New post', 'Nouvel article')}
            </Link>
          </div>

          {loading ? (
            <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <PenLine className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-gray-900 font-medium">{t('No posts yet', 'Aucun article pour l\'instant')}</p>
              <p className="text-sm text-gray-500 mt-1 mb-6">{t('Share something with the people who read you.', 'Partagez quelque chose avec celles et ceux qui vous lisent.')}</p>
              <Link href="/blogs/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
                <Plus className="w-4 h-4" /> {t('Write your first post', 'Écrire votre premier article')}
              </Link>
            </div>
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
                    <p className="text-xs text-gray-400 mt-1.5">{t('Updated', 'Modifié')} {new Date(p.updated_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <ListPill status={p.status} isLive={p.published_snapshot != null} t={t} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ListPill({ status, isLive, t }: { status: BlogStatus; isLive: boolean; t: (en: string, fr: string) => string }) {
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
