'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Cloud,
  Heart,
  Loader2,
  Edit3,
  Image as ImageIcon,
  X,
  Wind,
  Lightbulb,
  Feather,
  ChevronLeft,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Frown,
  Meh,
  Smile,
  Laugh,
  Annoyed,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import MemberLayout from '@/components/member/MemberLayout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import BloomChatInterface from '@/components/bloom/BloomChatInterface'
import { toast } from 'sonner'

interface Reflection {
  id: string
  intent: string
  content: string
  image_url?: string
  audio_url?: string
  mood?: number
  created_at: string
  // Legacy fields for backwards compatibility
  gratitude?: string
  thoughts?: string
}

// Intent options - why are you here?
const intents = [
  {
    id: 'discovery',
    icon: Lightbulb,
    color: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    iconColor: 'text-amber-500',
  },
  {
    id: 'vent',
    icon: Wind,
    color: 'from-purple-400 to-indigo-500',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    iconColor: 'text-purple-500',
  },
  {
    id: 'reflect',
    icon: Feather,
    color: 'from-emerald-400 to-teal-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    iconColor: 'text-emerald-500',
  },
  {
    id: 'gratitude',
    icon: Heart,
    color: 'from-pink-400 to-rose-500',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    iconColor: 'text-pink-500',
  },
]

const moodIcons = [
  { icon: Frown, color: 'text-blue-500', bg: 'bg-blue-100' },
  { icon: Annoyed, color: 'text-purple-500', bg: 'bg-purple-100' },
  { icon: Meh, color: 'text-gray-500', bg: 'bg-gray-100' },
  { icon: Smile, color: 'text-amber-500', bg: 'bg-amber-100' },
  { icon: Laugh, color: 'text-emerald-500', bg: 'bg-emerald-100' },
]

const BLOOM_PROMPTS_EN = [
  'How are you feeling?',
  "What's on your mind?",
  'Need someone to talk to?',
  "I'm here to listen",
  'Share your thoughts...',
]

const BLOOM_PROMPTS_FR = [
  'Comment vous sentez-vous ?',
  'À quoi pensez-vous ?',
  'Besoin de parler ?',
  'Je suis là pour écouter',
  'Partagez vos pensées...',
]

function BloomPill({ locale, onClick }: { locale: string; onClick: () => void }) {
  const [promptIndex, setPromptIndex] = useState(0)
  const prompts = locale === 'fr' ? BLOOM_PROMPTS_FR : BLOOM_PROMPTS_EN

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [prompts.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      {/* Ambient glow behind pill */}
      <motion.div
        animate={{
          opacity: [0.5, 0.7, 0.5],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 blur-3xl"
        style={{ transform: 'scale(2.2)' }}
      />

      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center gap-3 pl-4 pr-6 py-3 rounded-full backdrop-blur-2xl overflow-hidden bg-gradient-to-r from-white/90 to-white/70 border border-white/50"
        style={{
          boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.25), 0 4px 20px -5px rgba(0,0,0,0.08)'
        }}
      >
        {/* Shimmer effect */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />

        {/* Animated orb */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Outer ring pulse */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
          />
          {/* Middle glow */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 blur-sm"
          />
          {/* Core */}
          <motion.div
            animate={{
              scale: [1, 0.9, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-lg"
          />
        </div>

        {/* Rotating prompt */}
        <div className="relative w-[160px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={promptIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="block text-sm font-medium truncate text-gray-700"
            >
              {prompts[promptIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.button>
    </motion.div>
  )
}

export default function ReflectionPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Bloom chat state
  const [showBloomChat, setShowBloomChat] = useState(false)

  // Translations
  const t = {
    en: {
      greeting: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
      },
      title: 'Your Space',
      subtitle: "What brings you here?",
      intents: {
        discovery: 'I found something',
        vent: 'I need to let go',
        reflect: 'Just reflecting',
        gratitude: 'Feeling grateful',
      },
      intentTags: {
        discovery: 'Insight',
        vent: 'Vent',
        reflect: 'Reflection',
        gratitude: 'Grateful',
      },
      intentDescriptions: {
        discovery: 'An insight about yourself',
        vent: 'Release what weighs on you',
        reflect: 'Process your thoughts',
        gratitude: 'Appreciate the good',
      },
      placeholders: {
        discovery: "I realized that...",
        vent: "Let it out... this space is just for you.",
        reflect: "What's on your mind...",
        gratitude: "I'm grateful for...",
      },
      addPhoto: 'Add photo',
      changePhoto: 'Change',
      removePhoto: 'Remove',
      record: 'Record',
      recording: 'Recording...',
      stopRecording: 'Stop',
      howDoYouFeel: 'How does this feel?',
      save: 'Save',
      saving: 'Saving...',
      back: 'Back',
      pastReflections: 'Looking Back',
      emptyState: 'Your reflections will appear here',
      emptyStateDescription: 'This is your private space to process, discover, and grow',
      saved: 'Saved',
      errorSaving: 'Could not save. Please try again.',
    },
    fr: {
      greeting: {
        morning: 'Bonjour',
        afternoon: 'Bon après-midi',
        evening: 'Bonsoir',
      },
      title: 'Votre Espace',
      subtitle: "Qu'est-ce qui vous amène ici ?",
      intents: {
        discovery: "J'ai découvert quelque chose",
        vent: "J'ai besoin d'évacuer",
        reflect: 'Je réfléchis',
        gratitude: 'Reconnaissant',
      },
      intentTags: {
        discovery: 'Insight',
        vent: 'Vent',
        reflect: 'Réflexion',
        gratitude: 'Gratitude',
      },
      intentDescriptions: {
        discovery: 'Une prise de conscience',
        vent: 'Libérez ce qui vous pèse',
        reflect: 'Traitez vos pensées',
        gratitude: 'Apprécier le positif',
      },
      placeholders: {
        discovery: "J'ai réalisé que...",
        vent: "Laissez sortir... cet espace est juste pour vous.",
        reflect: "Qu'avez-vous en tête...",
        gratitude: "Je suis reconnaissant pour...",
      },
      addPhoto: 'Ajouter photo',
      changePhoto: 'Changer',
      removePhoto: 'Supprimer',
      record: 'Enregistrer',
      recording: 'Enregistrement...',
      stopRecording: 'Arrêter',
      howDoYouFeel: 'Comment vous sentez-vous ?',
      save: 'Sauvegarder',
      saving: 'Sauvegarde...',
      back: 'Retour',
      pastReflections: 'Retour en arrière',
      emptyState: 'Vos réflexions apparaîtront ici',
      emptyStateDescription: 'Ceci est votre espace privé pour traiter, découvrir et grandir',
      saved: 'Enregistré',
      errorSaving: 'Impossible de sauvegarder. Réessayez.',
    },
  }

  const text = locale === 'fr' ? t.fr : t.en

  useEffect(() => {
    fetchReflections()
  }, [])

  const fetchReflections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('member_reflections')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setReflections(data)
      }
    } catch (error) {
      console.log('Reflections table not ready:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      mediaRecorderRef.current.onstart = () => {
        ;(mediaRecorderRef.current as any).timerInterval = interval
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if ((mediaRecorderRef.current as any).timerInterval) {
        clearInterval((mediaRecorderRef.current as any).timerInterval)
      }
    }
  }

  const removeAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return

    if (isPlaying) {
      audioPlayerRef.current.pause()
    } else {
      audioPlayerRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const saveReflection = async () => {
    if (!selectedIntent || (!content.trim() && !selectedImage && !audioBlob)) return

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

      let image_url = null
      let audio_url = null

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${member.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reflections')
          .upload(fileName, selectedImage)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('reflections')
            .getPublicUrl(fileName)
          image_url = publicUrl
        }
      }

      // Upload audio if recorded
      if (audioBlob) {
        const fileName = `${member.id}/${Date.now()}.webm`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reflections')
          .upload(fileName, audioBlob)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('reflections')
            .getPublicUrl(fileName)
          audio_url = publicUrl
        }
      }

      const { error } = await supabase
        .from('member_reflections')
        .insert({
          member_id: member.id,
          intent: selectedIntent,
          content: content.trim(),
          image_url,
          audio_url,
          mood: selectedMood,
          // Map to old fields for compatibility
          gratitude: selectedIntent === 'discovery' ? content.trim() : '',
          thoughts: selectedIntent !== 'discovery' ? content.trim() : '',
        })

      if (!error) {
        toast.success(text.saved)
        resetForm()
        fetchReflections()
      } else {
        toast.error(text.errorSaving)
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
      toast.error(text.errorSaving)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSelectedIntent(null)
    setContent('')
    setSelectedImage(null)
    setImagePreview(null)
    setSelectedMood(null)
    removeAudio()
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { icon: Sun, key: 'morning' as const }
    if (hour < 17) return { icon: Cloud, key: 'afternoon' as const }
    return { icon: Moon, key: 'evening' as const }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } else if (diffDays === 1) {
      return locale === 'fr' ? 'Hier' : 'Yesterday'
    } else if (diffDays < 7) {
      return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
      })
    }
    return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getIntentInfo = (intentId: string) => {
    return intents.find(i => i.id === intentId) || intents[2]
  }

  const timeOfDay = getTimeOfDay()
  const TimeIcon = timeOfDay.icon
  const currentIntent = selectedIntent ? getIntentInfo(selectedIntent) : null

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
      <div className="px-5 pt-6 pb-8 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <TimeIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-500">
                  {text.greeting[timeOfDay.key]}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{text.title}</h1>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedIntent ? (
            /* Intent Selection */
            <motion.div
              key="intent-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p className="text-gray-600 mb-6">{text.subtitle}</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {intents.map((intent, idx) => {
                  const IntentIcon = intent.icon
                  return (
                    <motion.button
                      key={intent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedIntent(intent.id)}
                      className="relative overflow-hidden rounded-3xl p-5 text-left group"
                    >
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${intent.color} opacity-90 group-hover:opacity-100 transition-opacity`} />

                      {/* Content */}
                      <div className="relative z-10 text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                          <IntentIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold mb-1">
                          {text.intents[intent.id as keyof typeof text.intents]}
                        </h3>
                        <p className="text-sm text-white/80">
                          {text.intentDescriptions[intent.id as keyof typeof text.intentDescriptions]}
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Past Reflections */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{text.pastReflections}</h3>

                {reflections.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50 rounded-3xl p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Edit3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">{text.emptyState}</p>
                    <p className="text-sm text-gray-500">{text.emptyStateDescription}</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {reflections.map((reflection, idx) => {
                      const intentInfo = getIntentInfo(reflection.intent || 'reflect')
                      return (
                        <motion.div
                          key={reflection.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white rounded-2xl p-4 border border-black/[0.06] hover:bg-black/[0.01] transition-colors cursor-pointer"
                        >
                          {/* Image at top if exists */}
                          {reflection.image_url && (
                            <div className="w-full aspect-video rounded-xl overflow-hidden mb-3">
                              <img
                                src={reflection.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Audio player if exists */}
                          {reflection.audio_url && (
                            <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center relative">
                              <div className="flex items-center gap-1">
                                {[...Array(12)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{
                                      height: [8, 20 + Math.random() * 16, 8],
                                    }}
                                    transition={{
                                      duration: 0.8 + Math.random() * 0.4,
                                      repeat: Infinity,
                                      delay: i * 0.1,
                                      ease: 'easeInOut'
                                    }}
                                    className="w-1 rounded-full bg-purple-400/60"
                                    style={{ height: 12 + Math.random() * 12 }}
                                  />
                                ))}
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                  <Play className="w-5 h-5 text-purple-600 ml-0.5" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          {(reflection.content || reflection.gratitude || reflection.thoughts) && (
                            <p className="text-gray-900 text-sm leading-relaxed line-clamp-3">
                              {reflection.content || reflection.gratitude || reflection.thoughts}
                            </p>
                          )}

                          {/* Bottom row: Intent tag, mood, and time */}
                          <div className="flex items-center justify-between mt-3 pt-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${intentInfo.bgLight} ${intentInfo.textColor}`}>
                                <intentInfo.icon className="w-3 h-3" />
                                {text.intentTags[intentInfo.id as keyof typeof text.intentTags]}
                              </span>
                              {reflection.mood !== undefined && reflection.mood !== null && (() => {
                                const MoodIcon = moodIcons[reflection.mood].icon
                                return (
                                  <div className={`w-6 h-6 rounded-full ${moodIcons[reflection.mood].bg} flex items-center justify-center`}>
                                    <MoodIcon className={`w-3.5 h-3.5 ${moodIcons[reflection.mood].color}`} />
                                  </div>
                                )
                              })()}
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDate(reflection.created_at)}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Canvas View */
            <motion.div
              key="canvas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col"
            >
              {/* Back button and intent badge */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={resetForm}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className={`px-4 py-2 rounded-full ${currentIntent?.bgLight} flex items-center gap-2`}>
                  {currentIntent && <currentIntent.icon className={`w-4 h-4 ${currentIntent.textColor}`} />}
                  <span className={`text-sm font-medium ${currentIntent?.textColor}`}>
                    {text.intents[selectedIntent as keyof typeof text.intents]}
                  </span>
                </div>
              </div>

              {/* Image preview */}
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative mb-4 rounded-2xl overflow-hidden"
                >
                  <img src={imagePreview} alt="" className="w-full h-48 object-cover" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Audio preview */}
              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 bg-purple-50 rounded-2xl p-4 flex items-center gap-3"
                >
                  <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <button
                    onClick={togglePlayback}
                    className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white hover:bg-purple-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">
                      {locale === 'fr' ? 'Note vocale' : 'Voice note'}
                    </p>
                    <p className="text-xs text-purple-600">{formatTime(recordingTime)}</p>
                  </div>
                  <button
                    onClick={removeAudio}
                    className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Recording indicator */}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 bg-red-50 rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{text.recording}</p>
                    <p className="text-xs text-red-600">{formatTime(recordingTime)}</p>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-500 rounded-full text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Square className="w-3 h-3" />
                    {text.stopRecording}
                  </button>
                </motion.div>
              )}

              {/* Text area */}
              <div className="flex-1 mb-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={text.placeholders[selectedIntent as keyof typeof text.placeholders]}
                  className="w-full h-48 p-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-emerald-500 resize-none text-base leading-relaxed"
                  autoFocus
                />
              </div>

              {/* Optional mood */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">{text.howDoYouFeel}</p>
                <div className="flex gap-2">
                  {moodIcons.map((mood, idx) => {
                    const MoodIcon = mood.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedMood(selectedMood === idx ? null : idx)}
                        className={`w-11 h-11 rounded-full transition-all flex items-center justify-center ${
                          selectedMood === idx
                            ? `${mood.bg} ring-2 ring-offset-2 ring-emerald-400 scale-110`
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <MoodIcon className={`w-5 h-5 ${selectedMood === idx ? mood.color : 'text-gray-400'}`} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full px-3"
                  disabled={isRecording}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>

                {/* Record button */}
                {!audioUrl && !isRecording && (
                  <Button
                    variant="outline"
                    onClick={startRecording}
                    className="rounded-full px-3"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                )}

                <div className="flex-1" />

                <Button
                  onClick={saveReflection}
                  disabled={(!content.trim() && !selectedImage && !audioBlob) || saving || isRecording}
                  className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-600"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {text.save}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mindfulness reminder - only show when not in canvas */}
        {!selectedIntent && reflections.length > 0 && (
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
                  {locale === 'fr' ? 'Votre espace sûr' : 'Your safe space'}
                </h4>
                <p className="text-sm text-gray-600">
                  {locale === 'fr'
                    ? 'Tout ce que vous partagez ici reste privé et sécurisé.'
                    : 'Everything you share here stays private and secure.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bloom Pill - only show when not in canvas mode */}
      {!selectedIntent && (
        <BloomPill locale={locale} onClick={() => setShowBloomChat(true)} />
      )}

      {/* Bloom Chat */}
      <BloomChatInterface
        isOpen={showBloomChat}
        onClose={() => setShowBloomChat(false)}
        isDark={false}
      />
    </MemberLayout>
  )
}
