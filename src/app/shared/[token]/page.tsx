'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  BookOpen,
  Puzzle,
  Table2,
  Loader2,
  Lock,
  AlertCircle,
  UserPlus,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { BlockRenderer } from '@/components/resources/BlockRenderer'
import type { ResourceBlock, ResourceType } from '@/types/resource'

const typeIcons: Record<ResourceType, React.ElementType> = {
  worksheet: FileText,
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

const typeLabels: Record<ResourceType, { en: string; fr: string }> = {
  worksheet: { en: 'Worksheet', fr: 'Fiche' },
  exercise: { en: 'Exercise', fr: 'Exercice' },
  psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation' },
  table: { en: 'Table Exercise', fr: 'Exercice de tableau' },
}

interface SharedResource {
  id: string
  title: string
  description: string | null
  type: ResourceType
  category: string | null
  blocks: ResourceBlock[]
  settings: Record<string, unknown>
  language: string
}

interface SharedData {
  resource: SharedResource
  practitioner: { full_name: string; avatar_url: string | null }
  memberEmail: string
}

export default function SharedResourcePreview({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()

  const [data, setData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedResource()
  }, [token])

  const fetchSharedResource = async () => {
    try {
      const res = await fetch(`/api/shared?token=${token}`)
      if (!res.ok) {
        const { error: msg } = await res.json()
        setError(msg || 'Failed to load resource')
        return
      }
      const result = await res.json()
      setData(result)
    } catch {
      setError('Failed to load resource')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error === 'This link has expired'
              ? 'Link Expired'
              : 'Resource Not Found'}
          </h2>
          <p className="text-sm text-gray-500">
            {error === 'This link has expired'
              ? 'This preview link has expired. Please contact your practitioner for a new link.'
              : 'This link is invalid or the resource is no longer available.'}
          </p>
        </div>
      </div>
    )
  }

  const { resource, practitioner, memberEmail } = data
  const TypeIcon = typeIcons[resource.type] || FileText
  const locale = (resource.language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Bloomsline Care</p>
              <p className="text-xs text-gray-500">
                {locale === 'fr' ? 'Partagé par' : 'Shared by'} {practitioner.full_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const signUpUrl = `/sign-up?email=${encodeURIComponent(memberEmail)}`
              router.push(signUpUrl)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {locale === 'fr' ? 'Créer un compte' : 'Create Account'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Resource header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TypeIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{resource.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{typeLabels[resource.type]?.[locale] || resource.type}</span>
                {resource.category && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{resource.category}</span>
                  </>
                )}
              </div>
              {resource.description && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{resource.description}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Disabled notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {locale === 'fr'
                ? 'Aperçu en lecture seule'
                : 'Read-only preview'}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {locale === 'fr'
                ? 'Créez votre compte pour compléter et soumettre cet exercice à votre praticien.'
                : 'Create your account to complete and submit this exercise to your practitioner.'}
            </p>
          </div>
        </motion.div>

        {/* Resource blocks - all disabled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6"
        >
          {resource.blocks.map((block, index) => (
            <BlockRenderer
              key={block.id || index}
              block={block}
              value={undefined}
              onChange={() => {}}
              disabled={true}
              locale={locale}
            />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-center text-white"
        >
          <h2 className="text-lg font-bold mb-2">
            {locale === 'fr'
              ? 'Prêt à commencer ?'
              : 'Ready to get started?'}
          </h2>
          <p className="text-sm text-white/80 mb-4">
            {locale === 'fr'
              ? 'Créez votre compte gratuit pour compléter cet exercice et accéder à toutes les ressources partagées par votre praticien.'
              : 'Create your free account to complete this exercise and access all resources shared by your practitioner.'}
          </p>
          <button
            onClick={() => {
              const signUpUrl = `/sign-up?email=${encodeURIComponent(memberEmail)}`
              router.push(signUpUrl)
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {locale === 'fr' ? 'Créer mon compte' : 'Create My Account'}
          </button>
        </motion.div>
      </main>
    </div>
  )
}
