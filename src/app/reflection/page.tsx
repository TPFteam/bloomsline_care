'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Plus,
  Calendar,
  Sun,
  Moon,
  Cloud,
  Heart,
  Smile,
  Meh,
  Frown,
  ChevronRight,
  Loader2,
  Edit3,
  Trash2,
} from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'

interface Reflection {
  id: string
  mood: number
  gratitude: string
  thoughts: string
  created_at: string
}

const moodEmojis = [
  { emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-600' },
  { emoji: '😕', label: 'Down', color: 'bg-indigo-100 text-indigo-600' },
  { emoji: '😐', label: 'Okay', color: 'bg-gray-100 text-gray-600' },
  { emoji: '🙂', label: 'Good', color: 'bg-amber-100 text-amber-600' },
  { emoji: '😊', label: 'Great', color: 'bg-emerald-100 text-emerald-600' },
]

export default function ReflectionPage() {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [showNew, setShowNew] = useState(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [gratitude, setGratitude] = useState('')
  const [thoughts, setThoughts] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchReflections()
  }, [])

  const fetchReflections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get member record
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      // Get reflections
      const { data } = await supabase
        .from('member_reflections')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setReflections(data)
      }
    } catch (error) {
      // Table might not exist yet
      console.log('Reflections table not ready:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveReflection = async () => {
    if (selectedMood === null) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      const { error } = await supabase
        .from('member_reflections')
        .insert({
          member_id: member.id,
          mood: selectedMood,
          gratitude,
          thoughts,
        })

      if (!error) {
        setShowNew(false)
        setSelectedMood(null)
        setGratitude('')
        setThoughts('')
        fetchReflections()
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setSaving(false)
    }
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { icon: Sun, label: locale === 'fr' ? 'matin' : 'morning' }
    if (hour < 17) return { icon: Cloud, label: locale === 'fr' ? 'après-midi' : 'afternoon' }
    return { icon: Moon, label: locale === 'fr' ? 'soir' : 'evening' }
  }

  const timeOfDay = getTimeOfDay()
  const TimeIcon = timeOfDay.icon

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <TimeIcon className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">
              {locale === 'fr' ? `Bon ${timeOfDay.label}` : `Good ${timeOfDay.label}`}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'fr' ? 'Vos Réflexions' : 'Your Reflections'}
          </h1>
        </motion.div>

        {/* Daily Check-in Prompt */}
        {!showNew && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <Button
                onClick={() => setShowNew(true)}
                className="bg-white text-purple-600 hover:bg-white/90 rounded-full px-4 h-9"
              >
                <Plus className="w-4 h-4 mr-1" />
                {locale === 'fr' ? 'Nouveau' : 'New'}
              </Button>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {locale === 'fr' ? 'Comment vous sentez-vous ?' : 'How are you feeling?'}
            </h3>
            <p className="text-purple-100 text-sm">
              {locale === 'fr'
                ? 'Prenez un moment pour réfléchir à votre journée'
                : 'Take a moment to reflect on your day'}
            </p>
          </motion.div>
        )}

        {/* New Reflection Form */}
        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-lg p-5 mb-6 overflow-hidden"
            >
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Nouvelle réflexion' : 'New Reflection'}
              </h3>

              {/* Mood Selection */}
              <div className="mb-5">
                <label className="text-sm text-gray-600 mb-3 block">
                  {locale === 'fr' ? 'Comment vous sentez-vous ?' : 'How are you feeling?'}
                </label>
                <div className="flex justify-between gap-2">
                  {moodEmojis.map((mood, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMood(idx)}
                      className={`flex-1 py-3 rounded-2xl text-2xl transition-all ${
                        selectedMood === idx
                          ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-110'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gratitude */}
              <div className="mb-5">
                <label className="text-sm text-gray-600 mb-2 block">
                  {locale === 'fr'
                    ? 'Pour quoi êtes-vous reconnaissant ?'
                    : 'What are you grateful for?'}
                </label>
                <textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder={locale === 'fr' ? 'Je suis reconnaissant pour...' : "I'm grateful for..."}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                  rows={2}
                />
              </div>

              {/* Thoughts */}
              <div className="mb-5">
                <label className="text-sm text-gray-600 mb-2 block">
                  {locale === 'fr' ? 'Autres pensées' : 'Other thoughts'}
                </label>
                <textarea
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                  placeholder={locale === 'fr' ? 'Écrivez vos pensées...' : 'Write your thoughts...'}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNew(false)}
                  className="flex-1 rounded-full"
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={saveReflection}
                  disabled={selectedMood === null || saving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-full"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    locale === 'fr' ? 'Enregistrer' : 'Save'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past Reflections */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'Réflexions passées' : 'Past Reflections'}
          </h3>

          {reflections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {locale === 'fr'
                  ? 'Commencez votre première réflexion'
                  : 'Start your first reflection'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {reflections.map((reflection, idx) => (
                <motion.div
                  key={reflection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${moodEmojis[reflection.mood]?.color || 'bg-gray-100'}`}>
                      {moodEmojis[reflection.mood]?.emoji || '😐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {moodEmojis[reflection.mood]?.label || 'Neutral'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(reflection.created_at)}
                        </span>
                      </div>
                      {reflection.gratitude && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <span className="text-emerald-600">✨</span> {reflection.gratitude}
                        </p>
                      )}
                      {reflection.thoughts && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {reflection.thoughts}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mindfulness Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-5 border border-teal-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">
                {locale === 'fr' ? 'Conseil du jour' : 'Daily Tip'}
              </h4>
              <p className="text-sm text-gray-600">
                {locale === 'fr'
                  ? 'La gratitude quotidienne peut améliorer votre bien-être mental.'
                  : 'Daily gratitude can improve your mental well-being.'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  )
}
