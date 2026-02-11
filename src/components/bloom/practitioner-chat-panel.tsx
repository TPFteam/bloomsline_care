'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUp } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

interface PractitionerChatPanelProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  practiceHint?: string
}

const starters: Record<string, string[]> = {
  en: [
    'Who should I check in with this week?',
    'What patterns do you see in my sessions?',
    'How are my members doing overall?',
    'Help me prepare for my next session',
  ],
  fr: [
    'Qui devrais-je contacter cette semaine ?',
    'Quelles tendances vois-tu dans mes séances ?',
    'Comment vont mes membres en général ?',
    'Aide-moi à préparer ma prochaine séance',
  ],
  es: [
    'Con quién debería conectarme esta semana?',
    'Qué patrones ves en mis sesiones?',
    'Cómo están mis miembros en general?',
    'Ayúdame a preparar mi próxima sesión',
  ],
}

const uiText: Record<string, Record<string, string>> = {
  placeholder: { en: 'Ask about your practice...', fr: 'Demandez ce que vous voulez...', es: 'Pregunta lo que quieras...' },
  error: { en: 'Something went wrong. Please try again.', fr: 'Une erreur est survenue. Réessayez.', es: 'Algo salió mal. Intenta de nuevo.' },
  rateLimit: { en: 'Too many requests. Please wait a moment.', fr: 'Trop de requêtes. Patientez un moment.', es: 'Demasiadas solicitudes. Espera un momento.' },
}

export function PractitionerChatPanel({ isOpen, onClose, initialMessage, practiceHint }: PractitionerChatPanelProps) {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const t = (key: string) => uiText[key]?.[locale] || uiText[key]?.en || key

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Escape key closes panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Auto-resize textarea
  const resizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const res = await fetch('/api/practitioner/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
          locale,
        }),
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('rateLimit'),
          error: true,
        }])
        return
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()

      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('error'),
        error: true,
      }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId, locale, supabase, t])

  // Auto-send initial message when panel opens with one
  const initialSentRef = useRef<string | null>(null)
  useEffect(() => {
    if (isOpen && initialMessage && initialMessage !== initialSentRef.current && messages.length === 0 && !isLoading) {
      initialSentRef.current = initialMessage
      sendMessage(initialMessage)
    }
  }, [isOpen, initialMessage, messages.length, isLoading, sendMessage])

  // Reset when panel closes
  useEffect(() => {
    if (!isOpen) {
      initialSentRef.current = null
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const loc = locale as 'en' | 'fr' | 'es'
  const currentStarters = starters[loc] || starters.en

  const hour = new Date().getHours()
  const timeGreeting = locale === 'fr'
    ? (hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir')
    : locale === 'es'
      ? (hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches')
      : (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')

  const isEmpty = messages.length === 0 && !isLoading

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{`[data-feedback-button] { display: none !important; }`}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[199]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[440px] max-w-[calc(100vw-48px)] bg-[#faf9f7] shadow-2xl z-[200] flex flex-col"
          >
            {/* Top bar — just close */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div />
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation thread */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-4">
              {isEmpty && (
                <div className="flex flex-col justify-between h-full">
                  {/* Top — Bloom's greeting as natural text */}
                  <div className="pt-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center mb-5">
                        <span className="text-white text-sm font-semibold">B</span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {timeGreeting}.
                      </h2>
                      <p className="text-[15px] text-gray-500 leading-relaxed max-w-[320px]">
                        {practiceHint || (locale === 'fr'
                          ? 'Comment puis-je vous aider avec votre pratique ?'
                          : locale === 'es'
                            ? 'Cómo puedo ayudarte con tu práctica?'
                            : 'What would you like to think through together?')}
                      </p>
                    </motion.div>
                  </div>

                  {/* Bottom — conversation starters as casual tappable text */}
                  <div className="pb-2 pt-8">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3"
                    >
                      {locale === 'fr' ? 'Essayez' : locale === 'es' ? 'Prueba' : 'Try asking'}
                    </motion.p>
                    <div className="flex flex-wrap gap-2">
                      {currentStarters.map((starter, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.06 }}
                          onClick={() => sendMessage(starter)}
                          className="px-3.5 py-2 text-[13px] text-gray-600 bg-white rounded-full border border-gray-200 hover:border-[#D4856A]/30 hover:text-gray-900 hover:shadow-sm transition-all"
                        >
                          {starter}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages — thread format, no bubbles */}
              {!isEmpty && (
                <div className="space-y-6 pt-2">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {msg.role === 'user' ? (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-white text-[10px] font-semibold">
                              {locale === 'fr' ? 'V' : locale === 'es' ? 'T' : 'Y'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-gray-400 mb-1">
                              {locale === 'fr' ? 'Vous' : locale === 'es' ? 'Tú' : 'You'}
                            </p>
                            <p className="text-[15px] text-gray-900 leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-white text-[10px] font-semibold">B</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-gray-400 mb-1">Bloom</p>
                            <div className={`text-[15px] leading-relaxed whitespace-pre-wrap ${
                              msg.error ? 'text-red-600' : 'text-gray-700'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-[10px] font-semibold">B</span>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#D4856A]/40 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-[#D4856A]/40 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-[#D4856A]/40 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Input — feels like writing, not messaging */}
            <div className="px-5 py-4">
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); resizeTextarea() }}
                  onKeyDown={handleKeyDown}
                  placeholder={t('placeholder')}
                  disabled={isLoading}
                  rows={1}
                  className="w-full resize-none px-4 py-3 pr-12 text-[15px] bg-white rounded-2xl border border-gray-200 focus:outline-none focus:border-gray-300 focus:shadow-sm text-gray-900 placeholder-gray-400 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 p-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
