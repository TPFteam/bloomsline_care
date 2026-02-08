'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircleQuestion, X, Send, Bug, Lightbulb, HelpCircle, Loader2, ImagePlus, Trash2, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { toast } from 'sonner'

type TicketType = 'bug' | 'feature' | 'question'

interface FeedbackButtonProps {
  userEmail?: string | null
  userName?: string | null
  showFloatingButton?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const ticketTypes: { value: TicketType; icon: typeof Bug; labelEn: string; labelFr: string; labelEs: string }[] = [
  { value: 'bug', icon: Bug, labelEn: 'Bug', labelFr: 'Bug', labelEs: 'Error' },
  { value: 'feature', icon: Lightbulb, labelEn: 'Feature', labelFr: 'Idée', labelEs: 'Idea' },
  { value: 'question', icon: HelpCircle, labelEn: 'Question', labelFr: 'Question', labelEs: 'Pregunta' },
]

const successMessages: Record<TicketType, { en: { title: string; message: string }; fr: { title: string; message: string }; es: { title: string; message: string } }> = {
  bug: {
    en: { title: "Bug reported!", message: "Thanks for helping us improve. We'll investigate this and get back to you within 24 hours." },
    fr: { title: "Bug signalé !", message: "Merci de nous aider à nous améliorer. Nous allons examiner ce problème et vous recontacter sous 24 heures." },
    es: { title: "Error reportado!", message: "Gracias por ayudarnos a mejorar. Investigaremos esto y le responderemos en 24 horas." },
  },
  feature: {
    en: { title: "Great idea!", message: "We love hearing your suggestions. We'll review this and follow up with you within 24-48 hours." },
    fr: { title: "Super idée !", message: "Nous adorons vos suggestions. Nous allons l'examiner et vous recontacter sous 24 à 48 heures." },
    es: { title: "Gran idea!", message: "Nos encanta escuchar sus sugerencias. Lo revisaremos y le daremos seguimiento en 24 a 48 horas." },
  },
  question: {
    en: { title: "Question received!", message: "We're on it! Expect a response from our team within 24 hours." },
    fr: { title: "Question reçue !", message: "On s'en occupe ! Attendez une réponse de notre équipe sous 24 heures." },
    es: { title: "Pregunta recibida!", message: "Estamos en ello! Espere una respuesta de nuestro equipo en 24 horas." },
  },
}

export function FeedbackButton({
  userEmail,
  userName,
  showFloatingButton = true,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: FeedbackButtonProps) {
  const { locale } = useLanguage()
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = controlledOnClose
    ? (open: boolean) => { if (!open) controlledOnClose(); else setInternalIsOpen(true); }
    : setInternalIsOpen
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedType, setSubmittedType] = useState<TicketType>('question')
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    type: 'question' as TicketType,
    subject: '',
    description: '',
  })

  const resetAndClose = () => {
    setIsOpen(false)
    // Reset after animation
    setTimeout(() => {
      setSuccess(false)
      setFormData({ type: 'question', subject: '', description: '' })
      images.forEach(img => URL.revokeObjectURL(img.preview))
      setImages([])
    }, 300)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: { file: File; preview: string }[] = []

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        if (images.length + newImages.length < 3) {
          newImages.push({
            file,
            preview: URL.createObjectURL(file),
          })
        }
      }
    })

    setImages([...images, ...newImages])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    URL.revokeObjectURL(newImages[index].preview)
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error(locale === 'fr' ? 'Veuillez remplir tous les champs' : locale === 'es' ? 'Por favor complete todos los campos' : 'Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Convert images to base64
      const imageData: { name: string; base64: string }[] = []
      for (const { file } of images) {
        const base64 = await convertToBase64(file)
        imageData.push({ name: file.name, base64 })
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userEmail,
          userName,
          images: imageData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      // Show success state
      setSubmittedType(formData.type)
      setSuccess(true)
    } catch {
      toast.error(
        locale === 'fr'
          ? 'Erreur lors de l\'envoi. Réessayez.'
          : locale === 'es'
            ? 'Error al enviar. Inténtelo de nuevo.'
            : 'Failed to send. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button - only show if enabled */}
      {showFloatingButton && (
        <motion.button
          data-feedback-button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[150] w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={locale === 'fr' ? 'Aide & Support' : locale === 'es' ? 'Ayuda y Soporte' : 'Help & Support'}
        >
          <MessageCircleQuestion className="w-5 h-5" />
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Aide & Support' : locale === 'es' ? 'Ayuda y Soporte' : 'Help & Support'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Bugs, idées, questions — on vous écoute' : locale === 'es' ? 'Errores, ideas, preguntas — te escuchamos' : 'Bugs, ideas, questions — we\'re listening'}
                  </p>
                </div>
                <button
                  onClick={resetAndClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                /* Success State */
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {successMessages[submittedType][locale as 'en' | 'fr' | 'es']?.title ?? successMessages[submittedType].en.title}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {successMessages[submittedType][locale as 'en' | 'fr' | 'es']?.message ?? successMessages[submittedType].en.message}
                  </p>
                  <button
                    onClick={resetAndClose}
                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    {locale === 'fr' ? 'Fermer' : locale === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'fr' ? 'Type' : locale === 'es' ? 'Tipo' : 'Type'}
                  </label>
                  <div className="flex gap-2">
                    {ticketTypes.map((type) => {
                      const Icon = type.icon
                      const isSelected = formData.type === type.value
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.value })}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{locale === 'fr' ? type.labelFr : locale === 'es' ? type.labelEs : type.labelEn}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Sujet' : locale === 'es' ? 'Asunto' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={locale === 'fr' ? 'Décrivez brièvement...' : locale === 'es' ? 'Describa brevemente...' : 'Briefly describe...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Description' : locale === 'es' ? 'Descripcion' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={locale === 'fr'
                      ? 'Donnez-nous plus de détails...'
                      : locale === 'es'
                        ? 'Denos mas detalles...'
                        : 'Tell us more details...'}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Images' : locale === 'es' ? 'Capturas de pantalla' : 'Screenshots'}
                    <span className="text-gray-400 font-normal ml-1">
                      ({locale === 'fr' ? 'optionnel, max 3' : locale === 'es' ? 'opcional, max 3' : 'optional, max 3'})
                    </span>
                  </label>

                  {/* Image previews */}
                  {images.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {images.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {locale === 'fr' ? 'Ajouter une image' : locale === 'es' ? 'Agregar captura de pantalla' : 'Add screenshot'}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* User Info (read-only if available) */}
                {userEmail && (
                  <p className="text-xs text-gray-400">
                    {locale === 'fr' ? 'Envoyé en tant que' : locale === 'es' ? 'Enviando como' : 'Sending as'}: {userEmail}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {locale === 'fr' ? 'Envoyer' : locale === 'es' ? 'Enviar' : 'Submit'}
                    </>
                  )}
                </button>
              </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
