'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  FileText,
  BookOpen,
  Lightbulb,
  Check,
  Table2,
  ChevronRight,
  Sparkles,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { AppHeader, AppSidebar } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import type { User } from '@/types/user'

// Simplified resource types for practitioners
type PractitionerResourceType = 'worksheet' | 'psychoeducation' | 'table' | 'exercise'

interface ResourceTypeOption {
  id: PractitionerResourceType
  comingSoon?: boolean
}

interface Template {
  id: string
  name: { en: string; fr: string }
  description: { en: string; fr: string }
  blocks: number
  isBlank?: boolean
}

// 4 main resource types
const resourceTypes: ResourceTypeOption[] = [
  { id: 'psychoeducation' },
  { id: 'worksheet' },
  { id: 'table' },
  { id: 'exercise', comingSoon: true },
]

const typeLabels: Record<PractitionerResourceType, { en: string; fr: string }> = {
  worksheet: { en: 'Worksheet', fr: 'Exercice' },
  table: { en: 'Table', fr: 'Tableau' },
  psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation' },
  exercise: { en: 'Exercise / Activity', fr: 'Exercice / Activité' },
}

const typeDescriptions: Record<PractitionerResourceType, { en: string; fr: string }> = {
  worksheet: {
    en: 'Engage through active exploration',
    fr: 'Faire travailler par une exploration active',
  },
  table: {
    en: 'Help observe, structure and gain perspective',
    fr: 'Aider à observer, structurer et à prendre du recul',
  },
  psychoeducation: {
    en: 'Explain, share and establish a common framework',
    fr: 'Expliquer, transmettre et poser un cadre commun',
  },
  exercise: {
    en: 'Offer a concrete practice to do independently',
    fr: 'Proposer une pratique concrète à faire en autonomie',
  },
}

const typeExamples: Record<PractitionerResourceType, { en: string[]; fr: string[] }> = {
  worksheet: {
    en: ['Self-esteem', 'Relationships', 'Regulation'],
    fr: ['Estime de soi', 'Relations', 'Régulation'],
  },
  table: {
    en: ['Automatic thoughts', 'Anxiety tracking'],
    fr: ['Automatiques', 'Anxiété'],
  },
  psychoeducation: {
    en: ['Fact sheets', 'Guides'],
    fr: ['Fiches explicatives', 'Guides'],
  },
  exercise: {
    en: ['Breathing', 'Grounding', 'Mindfulness'],
    fr: ['Respiration', 'Ancrage', 'Pleine conscience'],
  },
}

// Templates for each resource type (IDs must match the actual templates in each editor page)
const templates: Record<PractitionerResourceType, Template[]> = {
  worksheet: [
    {
      id: 'gratitude',
      name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
      description: { en: 'Daily gratitude reflection practice', fr: 'Pratique quotidienne de réflexion de gratitude' },
      blocks: 12,
    },
  ],
  table: [
    {
      id: 'cognitive-restructuring',
      name: { en: 'Cognitive Restructuring Chart', fr: 'Tableau de restructuration cognitive' },
      description: { en: 'Challenge and reframe negative thoughts', fr: 'Remettre en question les pensées négatives' },
      blocks: 7,
    },
    {
      id: 'emotion-tracker',
      name: { en: 'Emotion Tracker', fr: 'Suivi des émotions' },
      description: { en: 'Monitor emotions and coping strategies', fr: 'Surveiller les émotions et stratégies d\'adaptation' },
      blocks: 5,
    },
  ],
  psychoeducation: [
    {
      id: 'self-esteem',
      name: { en: 'Understanding Self-Esteem', fr: 'Comprendre l\'estime de soi' },
      description: { en: 'Guide to building healthy self-esteem', fr: 'Guide pour développer une estime de soi saine' },
      blocks: 12,
    },
    {
      id: 'cbt-introduction',
      name: { en: 'CBT Introduction', fr: 'Introduction à la TCC' },
      description: { en: 'Simple introduction to Cognitive Behavioral Therapy', fr: 'Introduction simple à la TCC' },
      blocks: 12,
    },
  ],
  exercise: [],
}

export default function CreateResourcePage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [selectedResourceType, setSelectedResourceType] = useState<PractitionerResourceType | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const templatesRef = useRef<HTMLDivElement>(null)

  // Auto-select type from URL query parameter (e.g., ?type=worksheet)
  useEffect(() => {
    const typeFromUrl = searchParams.get('type')
    if (typeFromUrl && ['worksheet', 'table', 'psychoeducation', 'exercise'].includes(typeFromUrl)) {
      const validType = typeFromUrl as PractitionerResourceType
      // Only auto-select if not already selected and not coming soon
      const resourceType = resourceTypes.find(r => r.id === validType)
      if (resourceType && !resourceType.comingSoon) {
        setSelectedResourceType(validType)
      }
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        if (userProfile) {
          setUser(userProfile)
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email!,
            full_name: authUser.user_metadata?.full_name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            user_type: authUser.user_metadata?.user_type || 'mentor',
            preferred_language: 'en',
            created_at: authUser.created_at,
            updated_at: authUser.updated_at || authUser.created_at,
          })
        }
      }
    }
    fetchUser()
  }, [supabase])

  const handleTypeSelect = (type: PractitionerResourceType) => {
    setSelectedResourceType(type)
    setSelectedTemplate(null)
  }

  // Scroll to templates when type is selected
  useEffect(() => {
    if (selectedResourceType && templatesRef.current) {
      setTimeout(() => {
        templatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [selectedResourceType])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleContinue = () => {
    if (selectedResourceType && selectedTemplate) {
      // Always pass template param, including for blank
      router.push(`/resources/create/${selectedResourceType}?template=${selectedTemplate}`)
    }
  }

  const currentTemplates = selectedResourceType ? templates[selectedResourceType] : []

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="library" />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <AppHeader
          user={user}
          leftContent={
            <div className="flex items-center gap-2 text-sm">
              <Link href="/library" className="text-gray-500 hover:text-gray-700 transition-colors">
                <BookOpen className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">
                {locale === 'fr' ? 'Créer' : 'Create'}
              </span>
            </div>
          }
        />

        {/* Content */}
        <div className="p-8 max-w-6xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold text-gray-900 mb-2"
            >
              {locale === 'fr' ? 'Créer un support' : 'Create a Resource'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-gray-500"
            >
              {locale === 'fr'
                ? 'Choisissez le format du support que vous souhaitez créer'
                : 'Choose the type of resource you want to create'}
            </motion.p>
          </div>

          {/* Resource Type Selection - Large Cards with Illustrations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {resourceTypes.map((type, index) => {
              const isSelected = selectedResourceType === type.id
              const isDisabled = type.comingSoon

              return (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !isDisabled && handleTypeSelect(type.id)}
                  disabled={isDisabled}
                  className={`relative text-center p-6 rounded-2xl border-2 transition-all group ${
                    isDisabled
                      ? 'cursor-not-allowed opacity-50 bg-gray-50 border-gray-100'
                      : isSelected
                      ? 'bg-white border-gray-900 shadow-xl ring-4 ring-gray-900/5'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg'
                  }`}
                  whileHover={isDisabled ? {} : { y: -4 }}
                  whileTap={isDisabled ? {} : { scale: 0.98 }}
                >
                  {/* Selection indicator */}
                  {isSelected && !isDisabled && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 z-10 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.span>
                  )}

                  {/* Illustrated Icon Area */}
                  <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-gray-200/80 transition-colors relative overflow-hidden p-4">
                    {/* Coming Soon badge - inside illustration area */}
                    {isDisabled && (
                      <span className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full whitespace-nowrap">
                        {locale === 'fr' ? 'Bientôt' : 'Coming Soon'}
                      </span>
                    )}
                    {type.id === 'worksheet' && (
                      <div className="relative">
                        {/* Document */}
                        <motion.div
                          className="w-16 h-20 bg-white rounded-lg shadow-md flex flex-col p-2 gap-1.5"
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="w-full h-1.5 bg-blue-200 rounded-full" />
                          <div className="w-3/4 h-1.5 bg-blue-100 rounded-full" />
                          <div className="w-full h-1.5 bg-blue-200 rounded-full" />
                          <div className="w-1/2 h-1.5 bg-blue-100 rounded-full" />
                        </motion.div>
                        {/* Floating badge */}
                        <motion.div
                          className="absolute -right-3 -top-2 w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <FileText className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      </div>
                    )}

                    {type.id === 'table' && (
                      <div className="relative">
                        {/* Table grid */}
                        <motion.div
                          className="grid grid-cols-3 gap-1 p-2 bg-white rounded-lg shadow-md"
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        >
                          {[...Array(9)].map((_, i) => (
                            <motion.div
                              key={i}
                              className={`w-4 h-4 rounded ${i < 3 ? 'bg-emerald-300' : 'bg-emerald-100'}`}
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </motion.div>
                        {/* Floating badge */}
                        <motion.div
                          className="absolute -right-2 -bottom-2 w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        >
                          <Table2 className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      </div>
                    )}

                    {type.id === 'psychoeducation' && (
                      <div className="relative">
                        {/* Book */}
                        <motion.div
                          className="w-14 h-18 bg-gradient-to-br from-purple-500 to-purple-600 rounded-r-lg rounded-l shadow-md flex flex-col justify-center items-center"
                          animate={{ rotateY: [0, 5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="w-10 h-1 bg-white/30 rounded mb-1" />
                          <div className="w-8 h-1 bg-white/20 rounded mb-1" />
                          <div className="w-10 h-1 bg-white/30 rounded" />
                        </motion.div>
                        {/* Floating elements */}
                        <motion.div
                          className="absolute -left-3 -top-2 w-6 h-6 bg-purple-200 rounded-lg flex items-center justify-center"
                          animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Lightbulb className="w-3 h-3 text-purple-600" />
                        </motion.div>
                        <motion.div
                          className="absolute -right-2 top-0 w-5 h-5 bg-purple-300 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                        />
                      </div>
                    )}

                    {type.id === 'exercise' && (
                      <div className="relative">
                        {/* Meditation/breathing visualization */}
                        <motion.div
                          className="relative w-16 h-16 flex items-center justify-center"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {/* Outer ring - breathing circle */}
                          <motion.div
                            className="absolute w-16 h-16 rounded-full border-4 border-amber-200"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          />
                          {/* Middle ring */}
                          <motion.div
                            className="absolute w-12 h-12 rounded-full bg-amber-100"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          />
                          {/* Inner circle - person silhouette */}
                          <motion.div
                            className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-3 h-3 bg-white rounded-full" />
                          </motion.div>
                        </motion.div>
                        {/* Floating sparkles */}
                        <motion.div
                          className="absolute -right-2 -top-1 w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center"
                          animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        </motion.div>
                        <motion.div
                          className="absolute -left-2 bottom-0 w-4 h-4 bg-amber-300 rounded-full"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                        {/* Activity badge */}
                        <motion.div
                          className="absolute -right-3 -bottom-2 w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg"
                          animate={{ rotate: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Type Label */}
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    {typeLabels[type.id][locale]}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    {typeDescriptions[type.id][locale]}
                  </p>

                  {/* Examples */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {typeExamples[type.id][locale].map((example, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Templates Section - Shows when type is selected */}
          <AnimatePresence>
            {selectedResourceType && (
              <motion.div
                ref={templatesRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="pt-8 border-t border-gray-200"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {locale === 'fr' ? 'Choisir un modèle' : 'Choose a template'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr'
                      ? 'Commencez avec un modèle ou créez à partir de zéro'
                      : 'Start with a template or create from scratch'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {/* Template Cards */}
                  {currentTemplates.map((template, index) => {
                    const isSelected = selectedTemplate === template.id
                    return (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'bg-white border-gray-900 shadow-lg'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.span>
                        )}
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {template.name[locale]}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {template.description[locale]}
                        </p>
                        <span className="text-xs text-blue-600 font-medium">
                          {template.blocks} {locale === 'fr' ? 'blocs' : 'blocks'}
                        </span>
                      </motion.button>
                    )
                  })}

                  {/* Blank Option - Always last */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: currentTemplates.length * 0.05 }}
                    onClick={() => handleTemplateSelect('blank')}
                    className={`relative text-left p-5 rounded-xl border-2 border-dashed transition-all ${
                      selectedTemplate === 'blank'
                        ? 'bg-white border-gray-900 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {selectedTemplate === 'blank' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.span>
                    )}
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <Plus className="w-5 h-5 text-gray-500" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {locale === 'fr'
                        ? (selectedResourceType === 'worksheet' ? 'Nouvel exercice' : selectedResourceType === 'table' ? 'Nouveau tableau' : 'Nouvelle fiche')
                        : (selectedResourceType === 'worksheet' ? 'New Worksheet' : selectedResourceType === 'table' ? 'New Table' : 'New Psychoeducation')
                      }
                    </h3>
                    <p className="text-sm text-gray-500">
                      {locale === 'fr' ? 'Créez sans modèle' : 'Start from scratch'}
                    </p>
                  </motion.button>
                </div>

                {/* Continue Button */}
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedTemplate}
                    className={`px-8 py-3 h-auto rounded-xl text-sm font-medium transition-all ${
                      selectedTemplate
                        ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {locale === 'fr' ? 'Continuer' : 'Continue'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
