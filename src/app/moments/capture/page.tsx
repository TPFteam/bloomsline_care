'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  X,
  Image,
  Sparkles,
  Heart,
  Sun,
  Smile,
  Send,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

const moodTags = [
  { id: 'grateful', emoji: '🙏', labelEn: 'Grateful', labelFr: 'Reconnaissant' },
  { id: 'peaceful', emoji: '🌿', labelEn: 'Peaceful', labelFr: 'Paisible' },
  { id: 'joyful', emoji: '✨', labelEn: 'Joyful', labelFr: 'Joyeux' },
  { id: 'inspired', emoji: '💡', labelEn: 'Inspired', labelFr: 'Inspiré' },
  { id: 'loved', emoji: '💕', labelEn: 'Loved', labelFr: 'Aimé' },
  { id: 'calm', emoji: '🧘', labelEn: 'Calm', labelFr: 'Calme' },
]

export default function CaptureMomentPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'capture' | 'preview' | 'details'>('capture')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string)
        setStep('preview')
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleMood = (id: string) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate save - in production, upload to storage and save to database
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSaving(false)
    router.push('/home')
  }

  const resetCapture = () => {
    setCapturedImage(null)
    setSelectedMoods([])
    setCaption('')
    setStep('capture')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 relative z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-medium">
          {locale === 'fr' ? 'Capturer un moment' : 'Capture Moment'}
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              {/* Camera placeholder */}
              <div className="w-full aspect-square max-w-sm bg-gray-900 rounded-3xl flex flex-col items-center justify-center mb-8">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-12 h-12 text-white/60" />
                </div>
                <p className="text-white/60 text-center px-8">
                  {locale === 'fr'
                    ? 'Capturez un moment de bien-être'
                    : 'Capture a wellness moment'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center"
                >
                  <Image className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>

                <button
                  onClick={() => {}}
                  className="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center"
                >
                  <RotateCcw className="w-6 h-6 text-white" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {step === 'preview' && capturedImage && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Image preview */}
              <div className="flex-1 relative">
                <img
                  src={capturedImage}
                  alt="Captured moment"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetCapture}
                    className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={() => setStep('details')}
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

          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-white rounded-t-[32px] -mt-8 pt-2"
            >
              {/* Drag handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

              <div className="px-6 pb-10">
                {/* Image thumbnail */}
                {capturedImage && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6">
                    <img
                      src={capturedImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
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

                {/* Caption */}
                <div className="mb-8">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {locale === 'fr' ? 'Ajouter une note' : 'Add a note'}
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={locale === 'fr' ? 'Décrivez ce moment...' : 'Describe this moment...'}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
                    rows={3}
                  />
                </div>

                {/* Save button */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl text-white font-semibold text-lg"
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
