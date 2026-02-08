'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Sparkles } from 'lucide-react'
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
}

const suggestions: Record<string, string[]> = {
  en: [
    'Which members need follow-up?',
    'How were this week\'s sessions?',
    'Show me milestone progress',
  ],
  fr: [
    'Quels membres ont besoin d\'un suivi ?',
    'Comment se sont passées les sessions cette semaine ?',
    'Montre-moi les progrès des jalons',
  ],
  es: [
    'Cuales miembros necesitan seguimiento?',
    'Como fueron las sesiones de esta semana?',
    'Muestra el progreso de los hitos',
  ],
}

const uiText: Record<string, Record<string, string>> = {
  title: { en: 'Bloom Assistant', fr: 'Bloom Assistant', es: 'Bloom Asistente' },
  subtitle: { en: 'Ask about your practice data', fr: 'Posez des questions sur vos donnees', es: 'Pregunte sobre sus datos' },
  placeholder: { en: 'Ask about your members, sessions...', fr: 'Posez une question sur vos membres, sessions...', es: 'Pregunte sobre sus miembros, sesiones...' },
  error: { en: 'Something went wrong. Please try again.', fr: 'Une erreur est survenue. Veuillez reessayer.', es: 'Algo salio mal. Intente de nuevo.' },
  rateLimit: { en: 'Too many requests. Please wait a moment.', fr: 'Trop de requetes. Veuillez patienter.', es: 'Demasiadas solicitudes. Espere un momento.' },
}

export function PractitionerChatPanel({ isOpen, onClose }: PractitionerChatPanelProps) {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const t = (key: string) => uiText[key]?.[locale] || uiText[key]?.en || key

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const loc = locale as 'en' | 'fr' | 'es'
  const currentSuggestions = suggestions[loc] || suggestions.en

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Hide floating help button when panel is open */}
          <style>{`[data-feedback-button] { display: none !important; }`}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-[199]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[420px] max-w-[calc(100vw-48px)] bg-white dark:bg-gray-900 shadow-2xl z-[200] flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4856A] to-[#E8A87C] flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('title')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#D4856A]/10 dark:bg-[#D4856A]/20 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-[#D4856A]" />
                  </div>
                  <div className="space-y-3 w-full">
                    {currentSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion)}
                        className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white'
                        : msg.error
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('placeholder')}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4856A] focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
