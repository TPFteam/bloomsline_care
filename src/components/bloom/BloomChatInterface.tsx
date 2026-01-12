'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Loader2, History, ChevronLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useBloomChat } from '@/hooks/useBloomChat'
import { getConversations, getConversationMessages } from '@/lib/services/bloom'
import { ContentBlockRenderer } from './ContentBlocks'
import type { BloomMessage, BloomConversation } from '@/types/bloom'

export type BloomEntryPoint = 'home' | 'balance' | 'moments' | 'rituals' | 'progress' | 'reflect' | 'general'

interface BloomChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  entryPoint?: BloomEntryPoint
}

function ChatBubble({ message, isUser, isDark }: { message: BloomMessage; isUser: boolean; isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md'
            : isDark
              ? 'bg-white/10 text-white/90 rounded-bl-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  )
}

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-start mb-3"
    >
      <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className={`w-2 h-2 rounded-full ${isDark ? 'bg-white/50' : 'bg-gray-400'}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// History Panel Component
function HistoryPanel({
  isDark,
  locale,
  onBack,
  onSelectConversation,
}: {
  isDark: boolean
  locale: string
  onBack: () => void
  onSelectConversation: (conv: BloomConversation) => void
}) {
  const [conversations, setConversations] = useState<BloomConversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadConversations() {
      setLoading(true)
      const convs = await getConversations(20)
      setConversations(convs)
      setLoading(false)
    }
    loadConversations()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return locale === 'fr' ? "Aujourd'hui" : 'Today'
    } else if (diffDays === 1) {
      return locale === 'fr' ? 'Hier' : 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' })
    } else {
      return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* History Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
        <button
          onClick={onBack}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {locale === 'fr' ? 'Conversations passées' : 'Past Conversations'}
        </h3>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
          </div>
        ) : conversations.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            <p className="text-sm">
              {locale === 'fr' ? 'Pas encore de conversations' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <motion.button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-colors ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    {formatDate(conv.last_message_at || conv.created_at)}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-300'}`}>
                    {new Date(conv.last_message_at || conv.created_at).toLocaleTimeString(
                      locale === 'fr' ? 'fr-FR' : 'en-US',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                </div>
                <p className={`text-sm truncate ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {conv.title || (locale === 'fr' ? 'Conversation avec Bloom' : 'Conversation with Bloom')}
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Conversation View Component (read-only)
function ConversationView({
  isDark,
  locale,
  conversation,
  onBack,
}: {
  isDark: boolean
  locale: string
  conversation: BloomConversation
  onBack: () => void
}) {
  const [messages, setMessages] = useState<BloomMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMessages() {
      setLoading(true)
      const msgs = await getConversationMessages(conversation.id)
      setMessages(msgs)
      setLoading(false)
    }
    loadMessages()
  }, [conversation.id])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Conversation Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
        <button
          onClick={onBack}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatDate(conversation.created_at)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-5 py-4 ${
        isDark ? 'bg-transparent' : 'bg-gray-50/50'
      }`}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            <p className="text-sm">
              {locale === 'fr' ? 'Pas de messages' : 'No messages'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              isUser={message.role === 'user'}
              isDark={isDark}
            />
          ))
        )}
      </div>

      {/* Read-only notice */}
      <div className={`px-4 py-3 text-center border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
        <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
          {locale === 'fr' ? 'Conversation archivée (lecture seule)' : 'Archived conversation (read-only)'}
        </p>
      </div>
    </div>
  )
}

// Default suggestions shown before first API response
const DEFAULT_SUGGESTIONS_EN = [
  "How am I feeling today",
  "What have you noticed about me",
  "I need some perspective",
]

const DEFAULT_SUGGESTIONS_FR = [
  "Comment je me sens aujourd'hui",
  "Qu'est-ce que tu as remarqué chez moi",
  "J'ai besoin de perspective",
]

const TAGLINES_EN = [
  "Listening to you",
  "Here for you",
  "Always by your side",
  "You matter",
  "Take your time",
  "I'm here",
]

const TAGLINES_FR = [
  "À votre écoute",
  "Là pour vous",
  "Toujours à vos côtés",
  "Vous comptez",
  "Prenez votre temps",
  "Je suis là",
]

export default function BloomChatInterface({ isOpen, onClose, isDark = true, entryPoint = 'general' }: BloomChatInterfaceProps) {
  const { locale } = useLanguage()
  const [inputValue, setInputValue] = useState('')
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<BloomConversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isLoading,
    sendUserMessage,
    error,
    suggestions,
    contentBlocks,
  } = useBloomChat({ locale: locale as 'en' | 'fr', entryPoint })

  // Use API suggestions if available, otherwise show defaults
  const defaultSuggestions = locale === 'fr' ? DEFAULT_SUGGESTIONS_FR : DEFAULT_SUGGESTIONS_EN
  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions
  const taglines = locale === 'fr' ? TAGLINES_FR : TAGLINES_EN
  // Show suggestions after each Bloom response (not during loading)
  const showSuggestions = !isLoading && messages.length > 0

  // Rotate taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [taglines.length])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll to bottom and focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      // Scroll to latest message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    const message = inputValue
    setInputValue('')
    await sendUserMessage(message)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Chat container */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-[70] max-w-md mx-auto"
          >
            <div
              className={`rounded-3xl overflow-hidden backdrop-blur-2xl ${
                isDark
                  ? 'bg-[#1a1a1c]/95 border border-white/10'
                  : 'bg-white/95 border border-gray-200'
              }`}
              style={{
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
              }}
            >
              {/* Show History Panel or Conversation View */}
              {showHistory || selectedConversation ? (
                selectedConversation ? (
                  <ConversationView
                    isDark={isDark}
                    locale={locale}
                    conversation={selectedConversation}
                    onBack={() => setSelectedConversation(null)}
                  />
                ) : (
                  <HistoryPanel
                    isDark={isDark}
                    locale={locale}
                    onBack={() => setShowHistory(false)}
                    onSelectConversation={(conv) => setSelectedConversation(conv)}
                  />
                )
              ) : (
                <>
                  {/* Header */}
                  <div className={`flex items-center justify-between px-5 py-4 border-b ${
                    isDark ? 'border-white/10' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      {/* Animated status dot */}
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400"
                        />
                        <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <h2 className={`font-semibold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Bloom
                        </h2>
                        <div className="h-4 overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={taglineIndex}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.4, ease: 'easeInOut' }}
                              className={`text-[11px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}
                            >
                              {taglines[taglineIndex]}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowHistory(true)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-400'
                        }`}
                        title={locale === 'fr' ? 'Historique' : 'History'}
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onClose}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-400'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
              <div
                className={`h-80 overflow-y-auto px-5 py-4 ${
                  isDark
                    ? 'bg-transparent scrollbar-minimal'
                    : 'bg-gray-50/50 scrollbar-minimal-light'
                }`}
              >
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isUser={message.role === 'user'}
                    isDark={isDark}
                  />
                ))}

                {isLoading && <TypingIndicator isDark={isDark} />}

                {/* Rich Content Blocks */}
                {!isLoading && contentBlocks.length > 0 && (
                  <div className="mt-2">
                    {contentBlocks.map((block, index) => (
                      <ContentBlockRenderer
                        key={`${block.type}-${index}`}
                        block={block}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-red-400 py-2"
                  >
                    {error}
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Personalized Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`px-4 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}
                  >
                    <p className={`text-xs mb-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {locale === 'fr' ? 'Suggestions pour vous' : 'Suggestions for you'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {displaySuggestions.map((suggestion, i) => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => sendUserMessage(suggestion)}
                          className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
                            isDark
                              ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                          }`}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

                  {/* Input */}
                  <div className={`px-4 py-4 ${!showSuggestions ? `border-t ${isDark ? 'border-white/10' : 'border-gray-100'}` : ''}`}>
                    <div className="flex items-center gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={locale === 'fr' ? 'Écrivez ici...' : 'Type something...'}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-2xl text-[14px] transition-colors focus:outline-none disabled:opacity-50 ${
                          isDark
                            ? 'bg-white/10 text-white placeholder-white/40 focus:bg-white/15'
                            : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-gray-200/80'
                        }`}
                      />
                      <motion.button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        whileTap={{ scale: 0.9 }}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
