'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, History, Plus, ChevronLeft, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'

interface StatBlock {
  type: 'stats'
  title: string
  stats: { label: string; value: string | number; sub?: string; color?: string }[]
}

interface ListBlock {
  type: 'list'
  title: string
  items: { label: string; detail: string; accent?: string }[]
}

type ContentBlock = StatBlock | ListBlock

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
  contentBlocks?: ContentBlock[]
}

interface ConversationItem {
  id: string
  title: string
  last_message_at: string
}

interface BloomInlineChatProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  suggestions?: string[]
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return locale === 'fr' ? "À l'instant" : locale === 'es' ? 'Ahora' : 'Just now'
  if (mins < 60) return locale === 'fr' ? `Il y a ${mins}min` : locale === 'es' ? `Hace ${mins}min` : `${mins}m ago`
  if (hours < 24) return locale === 'fr' ? `Il y a ${hours}h` : locale === 'es' ? `Hace ${hours}h` : `${hours}h ago`
  if (days < 7) return locale === 'fr' ? `Il y a ${days}j` : locale === 'es' ? `Hace ${days}d` : `${days}d ago`
  return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' })
}

export function BloomInlineChat({ isOpen, onClose, initialMessage, suggestions = [] }: BloomInlineChatProps) {
  const { locale } = useLanguage()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [history, setHistory] = useState<ConversationItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const errText = locale === 'fr' ? 'Quelque chose s\'est mal passé.' : locale === 'es' ? 'Algo salió mal.' : 'Something went wrong.'
  const limitText = locale === 'fr' ? 'Trop de requêtes.' : locale === 'es' ? 'Demasiadas solicitudes.' : 'Too many requests.'

  const expanded = isOpen && !minimized

  useEffect(() => {
    if (expanded && view === 'chat') setTimeout(() => inputRef.current?.focus(), 150)
  }, [expanded, view])

  // Auto-scroll and re-focus input on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    if (!isLoading && expanded && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [messages, isLoading, expanded, view])

  useEffect(() => {
    if (isOpen) setMinimized(false)
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (view === 'history') { setView('chat'); return }
        setMessages([])
        setConversationId(null)
        setInput('')
        setMinimized(false)
        setView('chat')
        initialSentRef.current = null
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose, view])

  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        if (messages.length > 0) {
          setMinimized(true)
        } else {
          onClose()
        }
      }
    }
    const timeout = setTimeout(() => document.addEventListener('mousedown', handler), 100)
    return () => { clearTimeout(timeout); document.removeEventListener('mousedown', handler) }
  }, [expanded])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const { data } = await supabase
        .from('bloom_conversations')
        .select('id, title, last_message_at')
        .order('last_message_at', { ascending: false })
        .limit(20)
      setHistory((data || []) as ConversationItem[])
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }, [supabase])

  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true)
    setView('chat')
    setConversationId(convId)
    try {
      const { data } = await supabase
        .from('bloom_messages')
        .select('id, role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      if (data) {
        setMessages(data.filter(m => m.role !== 'system').map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })))
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const startNewConversation = () => {
    setMessages([])
    setConversationId(null)
    setInput('')
    initialSentRef.current = null
    setView('chat')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const openHistory = () => {
    fetchHistory()
    setView('history')
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text.trim() }])
    setInput('')
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No auth')

      const res = await fetch('/api/practitioner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: text.trim(), conversationId, locale }),
      })

      if (res.status === 429) {
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: limitText, error: true }])
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (!conversationId && data.conversationId) setConversationId(data.conversationId)
      setMessages(prev => [...prev, {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        contentBlocks: data.contentBlocks,
      }])
    } catch {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: errText, error: true }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId, locale, supabase, errText, limitText])

  const initialSentRef = useRef<string | null>(null)
  useEffect(() => {
    if (expanded && view === 'chat' && initialMessage && initialMessage !== initialSentRef.current && messages.length === 0 && !isLoading) {
      initialSentRef.current = initialMessage
      sendMessage(initialMessage)
    }
  }, [expanded, view, initialMessage, messages.length, isLoading, sendMessage])

  const isEmpty = messages.length === 0 && !isLoading
  const lastResponse = [...messages].reverse().find(m => m.role === 'assistant')

  if (!isOpen) return null

  return (
    <>
      {/* Minimized pill */}
      <AnimatePresence>
        {minimized && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[78px] right-8 z-[301] flex items-center gap-2 pl-3 pr-2 py-2 bg-white rounded-full shadow-lg shadow-gray-900/10 border border-gray-200 hover:shadow-xl transition-all"
          >
            <button
              onClick={() => setMinimized(false)}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shrink-0" />
              <span className="text-sm text-gray-600 max-w-[180px] truncate">
                {lastResponse
                  ? lastResponse.content.slice(0, 35) + (lastResponse.content.length > 35 ? '...' : '')
                  : 'Bloom'}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMessages([])
                setConversationId(null)
                setInput('')
                setMinimized(false)
                setView('chat')
                initialSentRef.current = null
                onClose()
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[300] bg-black/5 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          >
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[560px] mx-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl shadow-gray-900/10 overflow-hidden">
                <AnimatePresence mode="wait">
                  {view === 'chat' ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* Empty state: input at top + suggestions below */}
                      {isEmpty && (
                        <>
                          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}>
                            <div className="flex items-center gap-3 px-5 py-4">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shrink-0" />
                              <input
                                ref={isEmpty ? inputRef : undefined}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={locale === 'fr' ? 'Demandez à Bloom...' : locale === 'es' ? 'Pregunta a Bloom...' : 'Ask Bloom...'}
                                disabled={isLoading}
                                className="flex-1 text-base bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50"
                              />
                              <button
                                type="button"
                                onClick={openHistory}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                title={locale === 'fr' ? 'Historique' : locale === 'es' ? 'Historial' : 'History'}
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </form>

                          {suggestions.length > 0 && (
                            <div className="border-t border-gray-100 px-5 py-3">
                              {suggestions.map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => sendMessage(s)}
                                  className="w-full flex items-center gap-3 px-2 py-2 -mx-2 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-teal-500 transition-colors shrink-0" />
                                  <span className="text-sm text-gray-500 group-hover:text-gray-800 transition-colors">{s}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Active conversation: thread on top, input at bottom */}
                      {!isEmpty && (
                        <>
                          <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto">
                            {messages.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`px-5 py-3 ${msg.role === 'user' ? 'bg-gray-50' : ''}`}
                              >
                                {msg.role === 'user' ? (
                                  <p className="text-[14px] text-gray-500">{msg.content}</p>
                                ) : (
                                  <>
                                    <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${msg.error ? 'text-red-500' : 'text-gray-700'}`}>
                                      {msg.content}
                                    </p>
                                    {msg.contentBlocks && msg.contentBlocks.length > 0 && (
                                      <div className="mt-3 flex flex-col gap-2">
                                        {msg.contentBlocks.map((block, bi) => (
                                          <div key={bi} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{block.title}</p>
                                            {block.type === 'stats' && (
                                              <div className="flex gap-4">
                                                {block.stats.map((s, si) => (
                                                  <div key={si} className="flex-1 min-w-0">
                                                    <p className="text-lg font-semibold" style={{ color: s.color || '#111827' }}>{s.value}</p>
                                                    <p className="text-[11px] text-gray-500">{s.label}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {block.type === 'list' && (
                                              <div className="flex flex-col gap-1.5">
                                                {block.items.map((item, ii) => (
                                                  <div key={ii} className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.accent || '#0d9488' }} />
                                                      <span className="text-sm text-gray-800 truncate">{item.label}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 shrink-0">{item.detail}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </motion.div>
                            ))}

                            {isLoading && (
                              <div className="px-5 py-3">
                                <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-teal-400/50 rounded-full animate-bounce [animation-delay:0ms]" />
                                  <span className="w-1.5 h-1.5 bg-teal-400/50 rounded-full animate-bounce [animation-delay:150ms]" />
                                  <span className="w-1.5 h-1.5 bg-teal-400/50 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom input */}
                          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}>
                            <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-100">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shrink-0" />
                              <input
                                ref={isEmpty ? undefined : inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={locale === 'fr' ? 'Continuez...' : locale === 'es' ? 'Continúa...' : 'Follow up...'}
                                disabled={isLoading}
                                className="flex-1 text-sm bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={startNewConversation}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                  title={locale === 'fr' ? 'Nouveau' : locale === 'es' ? 'Nuevo' : 'New chat'}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={openHistory}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                  title={locale === 'fr' ? 'Historique' : locale === 'es' ? 'Historial' : 'History'}
                                >
                                  <History className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMinimized(true)}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                  title={locale === 'fr' ? 'Réduire' : locale === 'es' ? 'Minimizar' : 'Minimize'}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </form>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* History header */}
                      <div className="flex items-center gap-3 px-5 py-4">
                        <button
                          onClick={() => setView('chat')}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 flex-1">
                          {locale === 'fr' ? 'Conversations' : locale === 'es' ? 'Conversaciones' : 'Conversations'}
                        </span>
                        <button
                          onClick={startNewConversation}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal-600 hover:bg-teal-500/5 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {locale === 'fr' ? 'Nouveau' : locale === 'es' ? 'Nuevo' : 'New'}
                        </button>
                      </div>

                      {/* History list */}
                      <div className="border-t border-gray-100 max-h-[50vh] overflow-y-auto">
                        {historyLoading ? (
                          <div className="px-5 py-8 text-center">
                            <p className="text-sm text-gray-400">
                              {locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
                            </p>
                          </div>
                        ) : history.length === 0 ? (
                          <div className="px-5 py-8 text-center">
                            <p className="text-sm text-gray-400">
                              {locale === 'fr' ? 'Aucune conversation' : locale === 'es' ? 'Sin conversaciones' : 'No conversations yet'}
                            </p>
                          </div>
                        ) : (
                          history.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => loadConversation(conv.id)}
                              className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors ${
                                conv.id === conversationId ? 'bg-gray-50' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-800 truncate">
                                  {conv.title?.replace('Practice: ', '') || (locale === 'fr' ? 'Conversation' : 'Conversation')}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {timeAgo(conv.last_message_at, locale)}
                                </p>
                              </div>
                              {conv.id === conversationId && (
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 ml-3" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
