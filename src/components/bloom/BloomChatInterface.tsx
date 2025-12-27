'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useBloomChat } from '@/hooks/useBloomChat'
import type { BloomMessage } from '@/types/bloom'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    isLoading,
    sendUserMessage,
    error,
    suggestions,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
                <button
                  onClick={onClose}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-400'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
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
                    onKeyPress={handleKeyPress}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
