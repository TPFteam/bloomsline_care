'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Users,
  Globe,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { PublicPractitioner } from '@/types/public-practitioner'
import type { User } from '@/types/user'

export default function AdminPractitionersPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [practitioners, setPractitioners] = useState<PublicPractitioner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/sign-in')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .eq('id', authUser.id)
        .single()

      if (userData) setUser(userData as User)

      const res = await fetch('/api/admin/practitioners')
      if (!res.ok) throw new Error('Failed to fetch')
      const { practitioners: data } = await res.json()
      setPractitioners(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load practitioners')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/practitioners/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPractitioners(prev => prev.filter(p => p.id !== id))
      toast.success('Practitioner deleted')
    } catch {
      toast.error('Failed to delete practitioner')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = practitioners.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />

      <main className="flex-1 ml-16">
        <AppHeader
          user={user}
          isAdmin
          leftContent={
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Users className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Praticiens publics' : 'Public Practitioners'}</span>
            </div>
          }
        />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {locale === 'fr' ? 'Praticiens publics' : 'Public Practitioners'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {locale === 'fr'
                  ? 'Gérer les pages de profil public des praticiens'
                  : 'Manage public practitioner profile pages'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin/practitioners/new')}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              {locale === 'fr' ? 'Créer nouveau' : 'Create New'}
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === 'fr' ? 'Rechercher par nom...' : 'Search by name...'}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all outline-none bg-white"
            />
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {search
                  ? (locale === 'fr' ? 'Aucun résultat' : 'No results')
                  : (locale === 'fr' ? 'Aucun praticien' : 'No practitioners yet')}
              </h3>
              <p className="text-sm text-gray-500">
                {search
                  ? (locale === 'fr' ? 'Essayez un autre terme' : 'Try a different search term')
                  : (locale === 'fr' ? 'Créez votre premier profil public' : 'Create your first public practitioner profile')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-gray-300 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg overflow-hidden flex-shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      p.full_name.charAt(0)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{p.full_name}</h3>
                      {p.credentials && p.credentials.length > 0 && (
                        <span className="text-sm text-gray-500">{p.credentials.join(', ')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500">/p/{p.slug}</span>
                      {p.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <Globe className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.is_published && (
                      <Link
                        href={`/p/${p.slug}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => router.push(`/admin/practitioners/${p.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.full_name)}
                      disabled={deleting === p.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      {deleting === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
