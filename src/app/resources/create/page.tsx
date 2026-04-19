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
  Plus,
  FileUp,
  Check,
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
  type: string // what builder type to open
}

// All templates from all resource types — unified
const templates: Template[] = [
  {
    id: 'gratitude',
    name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
    description: { en: 'Daily gratitude reflection practice', fr: 'Pratique quotidienne de réflexion de gratitude' },
    blocks: 12,
    type: 'worksheet',
  },
  {
    id: 'self-esteem',
    name: { en: 'Understanding Self-Esteem', fr: 'Comprendre l\'estime de soi' },
    description: { en: 'Guide to building healthy self-esteem', fr: 'Guide pour développer une estime de soi saine' },
    blocks: 12,
    type: 'worksheet',
  },
  {
    id: 'cbt-introduction',
    name: { en: 'CBT Introduction', fr: 'Introduction à la TCC' },
    description: { en: 'Simple introduction to Cognitive Behavioral Therapy', fr: 'Introduction simple à la TCC' },
    blocks: 12,
    type: 'worksheet',
  },
  {
    id: 'cognitive-restructuring',
    name: { en: 'Cognitive Restructuring Chart', fr: 'Tableau de restructuration cognitive' },
    description: { en: 'Challenge and reframe negative thoughts', fr: 'Remettre en question les pensées négatives' },
    blocks: 7,
    type: 'table',
  },
  {
    id: 'emotion-tracker',
    name: { en: 'Emotion Tracker', fr: 'Suivi des émotions' },
    description: { en: 'Monitor emotions and coping strategies', fr: 'Surveiller les émotions et stratégies d\'adaptation' },
    blocks: 5,
    type: 'table',
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

        <div className="p-8 max-w-5xl mx-auto">
          {/* Title */}
          <div className="mb-8">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-semibold text-gray-900 mb-2">
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

          {/* Quick action: Start from scratch */}
          <div className="mb-10">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => router.push('/resources/create/worksheet?template=blank')}
              className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-teal-300 hover:shadow-lg transition-all text-left group"
              whileHover={{ y: -2 }}
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                <Plus className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{locale === 'fr' ? 'Partir de zéro' : 'Start from scratch'}</h3>
                <p className="text-sm text-gray-500">{locale === 'fr' ? 'Créez votre propre support' : 'Build your own resource'}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 ml-auto transition-colors" />
            </motion.button>
          </div>

          {/* Templates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {locale === 'fr' ? 'Ou commencez avec un modèle' : 'Or start with a template'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {locale === 'fr' ? 'Des modèles prêts à l\'emploi pour des cas courants' : 'Ready-to-use templates for common use cases'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {templates.map((template, index) => {
                const isSelected = selectedTemplate === template.id
                return (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                    className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-white border-gray-900 shadow-lg'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </motion.span>
                    )}
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{lt(template.name, locale)}</h3>
                    <p className="text-sm text-gray-500 mb-2">{lt(template.description, locale)}</p>
                    <span className="text-xs text-gray-400">{template.blocks} {locale === 'fr' ? 'blocs' : 'blocks'}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* Continue with template */}
            {selectedTemplate && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
