'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  X,
  Sparkles,
  Send,
  Loader2,
  Video,
  Mic,
  FileText,
  Square,
  Check,
  Trash2,
  Upload,
  MicOff,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createMoment } from '@/lib/services/moments'
import { toast } from 'sonner'

type CaptureType = 'photo' | 'video' | 'voice' | 'write'
type Step = 'select' | 'capture' | 'preview' | 'details'

const moodTags = [
  // Positive emotions
  { id: 'grateful', emoji: '🙏', labelEn: 'Grateful', labelFr: 'Reconnaissant' },
  { id: 'peaceful', emoji: '🌿', labelEn: 'Peaceful', labelFr: 'Paisible' },
  { id: 'joyful', emoji: '✨', labelEn: 'Joyful', labelFr: 'Joyeux' },
  { id: 'inspired', emoji: '💡', labelEn: 'Inspired', labelFr: 'Inspiré' },
  { id: 'loved', emoji: '💕', labelEn: 'Loved', labelFr: 'Aimé' },
  { id: 'calm', emoji: '🧘', labelEn: 'Calm', labelFr: 'Calme' },
  { id: 'hopeful', emoji: '🌟', labelEn: 'Hopeful', labelFr: 'Plein d\'espoir' },
  { id: 'proud', emoji: '🏆', labelEn: 'Proud', labelFr: 'Fier' },
  // Softer/processing emotions
  { id: 'overwhelmed', emoji: '🌊', labelEn: 'Overwhelmed', labelFr: 'Submergé' },
  { id: 'tired', emoji: '🌙', labelEn: 'Tired', labelFr: 'Fatigué' },
  { id: 'uncertain', emoji: '🌫️', labelEn: 'Uncertain', labelFr: 'Incertain' },
  { id: 'tender', emoji: '🥀', labelEn: 'Tender', labelFr: 'Sensible' },
  { id: 'restless', emoji: '💭', labelEn: 'Restless', labelFr: 'Agité' },
  { id: 'heavy', emoji: '🌧️', labelEn: 'Heavy', labelFr: 'Lourd' },
]

const captureTypes = [
  {
    id: 'photo' as CaptureType,
    icon: Camera,
    labelEn: 'Photo',
    labelFr: 'Photo',
    descEn: 'Take or upload a photo',
    descFr: 'Prendre ou télécharger une photo',
    gradient: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
  },
  {
    id: 'video' as CaptureType,
    icon: Video,
    labelEn: 'Video',
    labelFr: 'Vidéo',
    descEn: 'Record or upload a video',
    descFr: 'Enregistrer ou télécharger une vidéo',
    gradient: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50',
  },
  {
    id: 'voice' as CaptureType,
    icon: Mic,
    labelEn: 'Voice',
    labelFr: 'Voix',
    descEn: 'Record a voice note',
    descFr: 'Enregistrer une note vocale',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    id: 'write' as CaptureType,
    icon: FileText,
    labelEn: 'Write',
    labelFr: 'Écrire',
    descEn: 'Write your thoughts',
    descFr: 'Écrivez vos pensées',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
  },
]

function CaptureMomentContent() {
  const { locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('from') || '/moments'

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // State
  const [step, setStep] = useState<Step>('select')
  const [captureType, setCaptureType] = useState<CaptureType | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null)
  const [capturedAudio, setCapturedAudio] = useState<string | null>(null)
  const [writtenText, setWrittenText] = useState('')
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)

  // File blobs for upload
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle type selection
  const handleTypeSelect = (type: CaptureType) => {
    setCaptureType(type)
    if (type === 'write') {
      setStep('capture')
    } else {
      setStep('capture')
    }
  }

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file) // Store the file for upload
      const reader = new FileReader()
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string)
        setStep('preview')
      }
      reader.readAsDataURL(file)
    }
  }

  // Video handling
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file) // Store the file for upload
      const url = URL.createObjectURL(file)
      setCapturedVideo(url)
      setStep('preview')
    }
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob) // Store the blob for upload
        const audioUrl = URL.createObjectURL(blob)
        setCapturedAudio(audioUrl)
        stream.getTracks().forEach(track => track.stop())
        setStep('preview')
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert(locale === 'fr'
        ? 'Impossible d\'accéder au microphone'
        : 'Unable to access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Toggle mood selection
  const toggleMood = (id: string) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  // Save moment
  const handleSave = async () => {
    if (!captureType) return

    setSaving(true)
    try {
      // Determine media file based on capture type
      let mediaFile: File | Blob | undefined
      if (captureType === 'photo' && photoFile) {
        mediaFile = photoFile
      } else if (captureType === 'video' && videoFile) {
        mediaFile = videoFile
      } else if (captureType === 'voice' && audioBlob) {
        mediaFile = audioBlob
      }

      const result = await createMoment({
        type: captureType,
        mediaFile,
        textContent: captureType === 'write' ? writtenText : undefined,
        caption: caption || undefined,
        moods: selectedMoods,
        durationSeconds: captureType === 'voice' ? recordingTime : undefined,
      })

      if (result) {
        toast.success(
          locale === 'fr' ? 'Moment sauvegardé!' : 'Moment saved!'
        )
        router.push(returnTo)
      } else {
        toast.error(
          locale === 'fr'
            ? 'Erreur lors de la sauvegarde'
            : 'Error saving moment'
        )
      }
    } catch (error) {
      console.error('Error saving moment:', error)
      toast.error(
        locale === 'fr'
          ? 'Erreur lors de la sauvegarde'
          : 'Error saving moment'
      )
    } finally {
      setSaving(false)
    }
  }

  // Reset
  const resetCapture = () => {
    setCapturedImage(null)
    setCapturedVideo(null)
    setCapturedAudio(null)
    setPhotoFile(null)
    setVideoFile(null)
    setAudioBlob(null)
    setWrittenText('')
    setSelectedMoods([])
    setCaption('')
    setRecordingTime(0)
    setCaptureType(null)
    setStep('select')
  }

  // Go to details
  const goToDetails = () => {
    setStep('details')
  }

  // Get current type info
  const currentType = captureTypes.find(t => t.id === captureType)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 relative z-10">
        <button
          onClick={() => step === 'select' ? router.back() : resetCapture()}
          className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-medium">
          {step === 'select'
            ? (locale === 'fr' ? 'Nouveau moment' : 'New Moment')
            : currentType
              ? (locale === 'fr' ? currentType.labelFr : currentType.labelEn)
              : ''}
        </h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step 1: Select capture type */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col p-6"
            >
              <p className="text-white/60 text-center mb-8">
                {locale === 'fr'
                  ? 'Comment voulez-vous capturer ce moment ?'
                  : 'How would you like to capture this moment?'}
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                {captureTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 flex flex-col items-center gap-3 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg`}>
                      <type.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white font-semibold">
                      {locale === 'fr' ? type.labelFr : type.labelEn}
                    </span>
                    <span className="text-white/50 text-xs text-center">
                      {locale === 'fr' ? type.descFr : type.descEn}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Capture based on type */}
          {step === 'capture' && captureType === 'photo' && (
            <motion.div
              key="photo-capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment')
                    fileInputRef.current.click()
                  }
                }}
                className="w-full aspect-square max-w-sm bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-3xl flex flex-col items-center justify-center mb-8 border-2 border-sky-400/30 hover:border-sky-400/50 hover:from-sky-500/30 hover:to-blue-500/30 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30">
                  <Camera className="w-12 h-12 text-white" />
                </div>
                <p className="text-white text-center px-8 font-medium">
                  {locale === 'fr' ? 'Appuyez pour prendre une photo' : 'Tap to take a photo'}
                </p>
              </button>

              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture')
                    fileInputRef.current.click()
                  }
                }}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-lg rounded-full text-white/80 hover:bg-white/20 transition-all"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {locale === 'fr' ? 'Choisir une photo' : 'Choose from gallery'}
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {step === 'capture' && captureType === 'video' && (
            <motion.div
              key="video-capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <button
                onClick={() => {
                  if (videoInputRef.current) {
                    videoInputRef.current.setAttribute('capture', 'environment')
                    videoInputRef.current.click()
                  }
                }}
                className="w-full aspect-video max-w-sm bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-3xl flex flex-col items-center justify-center mb-8 border-2 border-sky-400/30 hover:border-sky-400/50 hover:from-sky-500/30 hover:to-blue-500/30 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-sky-500/30">
                  <Video className="w-12 h-12 text-white" />
                </div>
                <p className="text-white text-center px-8 font-medium">
                  {locale === 'fr' ? 'Appuyez pour enregistrer une vidéo' : 'Tap to record a video'}
                </p>
              </button>

              <button
                onClick={() => {
                  if (videoInputRef.current) {
                    videoInputRef.current.removeAttribute('capture')
                    videoInputRef.current.click()
                  }
                }}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-lg rounded-full text-white/80 hover:bg-white/20 transition-all"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {locale === 'fr' ? 'Choisir une vidéo' : 'Choose from gallery'}
                </span>
              </button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {step === 'capture' && captureType === 'voice' && (
            <motion.div
              key="voice-capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              {/* Recording visualization */}
              <div className="w-48 h-48 relative mb-8">
                <motion.div
                  animate={isRecording ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-orange-500/20 rounded-full"
                />
                <motion.div
                  animate={isRecording ? {
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="absolute inset-4 bg-orange-500/30 rounded-full"
                />
                <div className={`absolute inset-8 rounded-full flex items-center justify-center ${
                  isRecording ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                }`}>
                  {isRecording ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>

              {/* Timer */}
              <div className="text-4xl font-mono text-white mb-8">
                {formatTime(recordingTime)}
              </div>

              {/* Recording controls */}
              <div className="flex items-center gap-6">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                  >
                    <Square className="w-8 h-8 text-white" />
                  </button>
                )}
              </div>

              <p className="text-white/60 mt-6 text-center">
                {isRecording
                  ? (locale === 'fr' ? 'Appuyez pour arrêter' : 'Tap to stop')
                  : (locale === 'fr' ? 'Appuyez pour enregistrer' : 'Tap to record')}
              </p>
            </motion.div>
          )}

          {step === 'capture' && captureType === 'write' && (
            <motion.div
              key="write-capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-6"
            >
              <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
                <textarea
                  value={writtenText}
                  onChange={(e) => setWrittenText(e.target.value)}
                  placeholder={locale === 'fr'
                    ? 'Écrivez vos pensées, sentiments, ou ce que vous voulez capturer...'
                    : 'Write your thoughts, feelings, or whatever you want to capture...'}
                  className="flex-1 w-full p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/10 text-white placeholder-white/40 resize-none text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent caret-white"
                  autoFocus
                />

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white/40 text-sm">
                    {writtenText.length} {locale === 'fr' ? 'caractères' : 'characters'}
                  </span>
                  <Button
                    onClick={goToDetails}
                    disabled={!writtenText.trim()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full px-6"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Continuer' : 'Continue'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Photo preview */}
              {captureType === 'photo' && capturedImage && (
                <div className="flex-1 relative">
                  <img
                    src={capturedImage}
                    alt="Captured moment"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              )}

              {/* Video preview */}
              {captureType === 'video' && capturedVideo && (
                <div className="flex-1 relative bg-black">
                  <video
                    ref={videoRef}
                    src={capturedVideo}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent h-32 pointer-events-none" />
                </div>
              )}

              {/* Audio preview */}
              {captureType === 'voice' && capturedAudio && (
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                    <Mic className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-white text-xl font-medium mb-2">
                    {locale === 'fr' ? 'Note vocale' : 'Voice Note'}
                  </p>
                  <p className="text-white/60 mb-6">
                    {formatTime(recordingTime)}
                  </p>
                  <audio src={capturedAudio} controls className="w-full max-w-sm" />
                </div>
              )}

              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 safe-area-pb">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetCapture}
                    className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center"
                  >
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={goToDetails}
                    className="flex-1 max-w-xs h-14 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">
                      {locale === 'fr' ? 'Continuer' : 'Continue'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-white rounded-t-[32px] pt-2 overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

              <div className="px-6 pb-10">
                {/* Media thumbnail */}
                <div className="flex items-start gap-4 mb-6">
                  {captureType === 'photo' && capturedImage && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {captureType === 'video' && capturedVideo && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-900 flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {captureType === 'voice' && (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {captureType === 'write' && (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {currentType && (locale === 'fr' ? currentType.labelFr : currentType.labelEn)}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {captureType === 'write' && writtenText
                        ? writtenText.slice(0, 50) + (writtenText.length > 50 ? '...' : '')
                        : captureType === 'voice'
                          ? formatTime(recordingTime)
                          : (locale === 'fr' ? 'Moment capturé' : 'Captured moment')}
                    </p>
                  </div>
                </div>

                {/* Written text preview */}
                {captureType === 'write' && writtenText && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{writtenText}</p>
                  </div>
                )}

                {/* Mood tags */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    {locale === 'fr' ? 'Comment vous sentez-vous ?' : 'How are you feeling?'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {moodTags.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => toggleMood(mood.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                          selectedMoods.includes(mood.id)
                            ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{mood.emoji}</span>
                        <span>{locale === 'fr' ? mood.labelFr : mood.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption (only show if not write type) */}
                {captureType !== 'write' && (
                  <div className="mb-8">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {locale === 'fr' ? 'Ajouter une note (optionnel)' : 'Add a note (optional)'}
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder={locale === 'fr' ? 'Décrivez ce moment...' : 'Describe this moment...'}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-emerald-500 resize-none text-sm text-gray-900 caret-gray-900"
                      rows={3}
                    />
                  </div>
                )}

                {/* Save button */}
                <Button
                  onClick={handleSave}
                  disabled={saving || selectedMoods.length === 0}
                  className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl text-white font-semibold text-lg disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {locale === 'fr' ? 'Sauvegarder le moment' : 'Save Moment'}
                    </>
                  )}
                </Button>

                {selectedMoods.length === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-3">
                    {locale === 'fr' ? 'Sélectionnez au moins une humeur' : 'Select at least one mood'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function CaptureMomentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <CaptureMomentContent />
    </Suspense>
  )
}
