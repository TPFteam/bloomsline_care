'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  FileText,
  BookOpen,
  ChevronRight,
  Sparkles,
  FileUp,
  Loader2,
  Copy,
} from 'lucide-react'
import { TutorialVideo } from '@/components/ui/tutorial-video'
import { useLanguage, lt } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import type { User } from '@/types/user'
import { toast } from 'sonner'

const BLOOMSLINE_EMAIL = 'hi@bloomsline.com'

// Category colors for visual variety
const CATEGORY_COLORS: Record<string, string> = {
  anxiety: 'from-amber-500 to-orange-500',
  depression: 'from-blue-500 to-indigo-500',
  stress: 'from-rose-500 to-pink-500',
  self_esteem: 'from-violet-500 to-purple-500',
  relationships: 'from-teal-500 to-emerald-500',
  mindfulness: 'from-cyan-500 to-sky-500',
  emotional_regulation: 'from-emerald-500 to-teal-500',
  grief_loss: 'from-slate-500 to-gray-600',
  default: 'from-gray-600 to-gray-700',
}

export default function CreateResourcePage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userProfile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
        if (userProfile) setUser(userProfile)
        else setUser({ id: authUser.id, email: authUser.email!, full_name: authUser.user_metadata?.full_name || null, avatar_url: authUser.user_metadata?.avatar_url || null, user_type: authUser.user_metadata?.user_type || 'mentor', preferred_language: 'en', created_at: authUser.created_at, updated_at: authUser.updated_at || authUser.created_at })
      }
    }
    fetchUser()
  }, [supabase])

  // Fetch templates from Bloomsline account
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Find the Bloomsline user
        const { data: bloomUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', BLOOMSLINE_EMAIL)
          .single()

        if (!bloomUser) {
          setLoadingTemplates(false)
          return
        }

        // Fetch published resources from that user
        const { data: resources } = await supabase
          .from('resources')
          .select('id, title, description, type, category, blocks, status, language')
          .eq('practitioner_id', bloomUser.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        setTemplates(resources || [])
      } catch {
        // Silent fail
      }
      setLoadingTemplates(false)
    }
    fetchTemplates()
  }, [supabase])

  // Duplicate a template into the practitioner's account
  const handleDuplicate = async (template: any) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    setDuplicating(template.id)
    try {
      const title = typeof template.title === 'string' ? template.title : (template.title?.[locale] || template.title?.en || 'Untitled')
      const description = typeof template.description === 'string' ? template.description : (template.description?.[locale] || template.description?.en || '')

      const { data: newResource, error } = await supabase
        .from('resources')
        .insert({
          practitioner_id: authUser.id,
          title,
          description,
          type: template.type || 'worksheet',
          category: template.category || null,
          blocks: template.blocks || [],
          status: 'draft',
          visibility: 'private',
          language: template.language || locale,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(locale === 'fr' ? 'Modèle dupliqué !' : 'Template duplicated!')
      router.push(`/resources/create/worksheet?edit=${newResource.id}`)
    } catch (err) {
      console.error('Duplicate failed:', err)
      toast.error(locale === 'fr' ? 'Erreur lors de la duplication' : 'Failed to duplicate')
    }
    setDuplicating(null)
  }

  const getTemplateTitle = (t: any) => typeof t.title === 'string' ? t.title : (t.title?.[locale] || t.title?.en || 'Untitled')
  const getTemplateDesc = (t: any) => typeof t.description === 'string' ? t.description : (t.description?.[locale] || t.description?.en || '')
  const getColor = (category: string) => CATEGORY_COLORS[category] || CATEGORY_COLORS.default

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="library" />
      <main className="flex-1 ml-14">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm">
              <Link href="/library" className="text-gray-500 hover:text-gray-700 transition-colors">
                <BookOpen className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{locale === 'fr' ? 'Créer' : 'Create'}</span>
            </div>
          }
        />

        <div className="p-8 max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-10">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-gray-900 mb-2">
              <span className="flex items-center justify-between">
                {locale === 'fr' ? 'Créer un support' : 'Create a Resource'}
                <TutorialVideo
                  url="https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/creer%20un%20support.mov"
                  title={locale === 'fr' ? "Comment créer un support d'accompagnement" : 'How to create a resource'}
                />
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500">
              {locale === 'fr' ? 'Commencez avec un modèle ou partez de zéro' : 'Start with a template or from scratch'}
            </motion.p>
          </div>

          {/* Action cards row */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => router.push('/resources/create/worksheet?template=blank')}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 p-5 text-left group shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-0.5">
                    {locale === 'fr' ? 'Partir de zéro' : 'Start from scratch'}
                  </h3>
                  <p className="text-xs text-white/70">
                    {locale === 'fr' ? 'Créez votre propre support' : 'Build your own resource'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              onClick={() => router.push('/resources/create/worksheet?template=blank&import=pdf')}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5 text-left group shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                  <FileUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-0.5">
                    {locale === 'fr' ? 'Importer un PDF' : 'Import from PDF'}
                  </h3>
                  <p className="text-xs text-white/60">
                    {locale === 'fr' ? 'Convertir en exercice interactif' : 'Convert into an interactive exercise'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </motion.button>
          </div>

          {/* Templates from Bloomsline */}
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
            </div>
          ) : templates.length > 0 && (
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  {locale === 'fr' ? 'ou utilisez un modèle' : 'or use a template'}
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => {
                  const title = getTemplateTitle(template)
                  const desc = getTemplateDesc(template)
                  const color = getColor(template.category || '')
                  const blockCount = Array.isArray(template.blocks) ? template.blocks.length : 0
                  const isDuplicating = duplicating === template.id

                  return (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + index * 0.04 }}
                      onClick={() => router.push(`/resources/${template.id}?template=true`)}
                      whileHover={{ y: -3 }}
                      className="relative text-left p-5 rounded-2xl bg-white border-transparent shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm`}>
                        <FileText className="w-5 h-5 text-white" />
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{title}</h3>
                      {desc && <p className="text-sm text-gray-500 mb-3 leading-relaxed line-clamp-2">{desc}</p>}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {blockCount > 0 && (
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {blockCount} {locale === 'fr' ? 'blocs' : 'blocks'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-400 group-hover:text-teal-600 transition-colors">
                          {locale === 'fr' ? 'Aperçu' : 'Preview'} →
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}
