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
  Check,
  Brain,
  Heart,
  Smile,
  Table2,
  BarChart2,
  FileUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorialVideo } from '@/components/ui/tutorial-video'
import { useLanguage, lt } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import type { User } from '@/types/user'

interface Template {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  blocks: number
  type: string
  icon: typeof FileText
  color: string
}

const templates: Template[] = [
  {
    id: 'gratitude',
    name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
    description: { en: 'Daily gratitude reflection practice', fr: 'Pratique quotidienne de réflexion de gratitude' },
    blocks: 12,
    type: 'worksheet',
    icon: Heart,
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'self-esteem',
    name: { en: 'Understanding Self-Esteem', fr: 'Comprendre l\'estime de soi' },
    description: { en: 'Guide to building healthy self-esteem', fr: 'Guide pour développer une estime de soi saine' },
    blocks: 12,
    type: 'worksheet',
    icon: Smile,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'cbt-introduction',
    name: { en: 'CBT Introduction', fr: 'Introduction à la TCC' },
    description: { en: 'Simple introduction to Cognitive Behavioral Therapy', fr: 'Introduction simple à la TCC' },
    blocks: 12,
    type: 'worksheet',
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'cognitive-restructuring',
    name: { en: 'Cognitive Restructuring Chart', fr: 'Tableau de restructuration cognitive' },
    description: { en: 'Challenge and reframe negative thoughts', fr: 'Remettre en question les pensées négatives' },
    blocks: 7,
    type: 'table',
    icon: Table2,
    color: 'from-teal-500 to-emerald-500',
  },
  {
    id: 'emotion-tracker',
    name: { en: 'Emotion Tracker', fr: 'Suivi des émotions' },
    description: { en: 'Monitor emotions and coping strategies', fr: 'Surveiller les émotions et stratégies d\'adaptation' },
    blocks: 5,
    type: 'table',
    icon: BarChart2,
    color: 'from-blue-500 to-cyan-500',
  },
]

export default function CreateResourcePage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

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

  const handleContinue = () => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      router.push(`/resources/create/worksheet?template=${selectedTemplate}${template?.type === 'table' ? '&type=table' : ''}`)
    }
  }

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

          {/* Templates */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {locale === 'fr' ? 'ou choisissez un modèle' : 'or pick a template'}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {templates.map((template, index) => {
                const isSelected = selectedTemplate === template.id
                const Icon = template.icon
                return (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + index * 0.04 }}
                    onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                    whileHover={{ y: -3 }}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all group ${
                      isSelected
                        ? 'bg-white border-gray-900 shadow-lg ring-1 ring-gray-900/5'
                        : 'bg-white border-transparent shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.span>
                    )}

                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{lt(template.name, locale)}</h3>
                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">{lt(template.description, locale)}</p>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {template.blocks} {locale === 'fr' ? 'blocs' : 'blocks'}
                      </span>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                        {template.type === 'table' ? (locale === 'fr' ? 'Tableau' : 'Table') : (locale === 'fr' ? 'Exercice' : 'Worksheet')}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Continue with template */}
            {selectedTemplate && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                <Button onClick={handleContinue} className="px-8 py-3 h-auto rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg">
                  {locale === 'fr' ? 'Continuer avec ce modèle' : 'Continue with template'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
