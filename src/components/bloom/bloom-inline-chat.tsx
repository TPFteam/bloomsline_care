'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  // Visual accent. Default 'teal' (the app-wide Ask Bloom look). Pass 'blue'
  // when launched from the Signals practice panel so the popup matches that
  // panel's blue styling instead of showing a mismatched green chat.
  accent?: 'teal' | 'blue'
}

const ACCENTS = {
  teal: {
    grad: 'from-teal-400 to-teal-600',
    hoverDot: 'group-hover:bg-teal-500',
    loadDot: 'bg-teal-400/50',
    mentionHex: '#0d9488',
    newBtn: 'text-teal-600 hover:bg-teal-500/5',
    activeDot: 'bg-teal-500',
    mentionRow: 'hover:bg-teal-50',
    mentionHi: 'bg-teal-50',
    mentionAvatar: 'from-teal-200 to-teal-400',
    backdrop: 'bg-black/5',
  },
  blue: {
    grad: 'from-blue-400 to-blue-600',
    hoverDot: 'group-hover:bg-blue-500',
    loadDot: 'bg-blue-400/50',
    mentionHex: '#2563eb',
    newBtn: 'text-blue-600 hover:bg-blue-500/5',
    activeDot: 'bg-blue-500',
    mentionRow: 'hover:bg-blue-50',
    mentionHi: 'bg-blue-50',
    mentionAvatar: 'from-blue-200 to-blue-400',
    backdrop: 'bg-blue-900/10',
  },
} as const

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

export function BloomInlineChat({ isOpen, onClose, initialMessage, suggestions = [], accent = 'teal' }: BloomInlineChatProps) {
  const theme = ACCENTS[accent]
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

  // ── @mention autocomplete ────────────────────────────────────────
  // The practitioner can type "@" + a patient's name to scope a
  // question to that patient. Selecting from the dropdown both
  // inserts "@Name" into the text and tracks the member's id so the
  // server can inject deep per-patient context.
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])
  const [mentionedIds, setMentionedIds] = useState<string[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null)
  const [mentionHighlight, setMentionHighlight] = useState(0)

  useEffect(() => {
    if (!expanded || members.length > 0) return
    void (async () => {
      // Scope explicitly to this practitioner's own roster. Without
      // the practitioner_id filter, RLS lets the user also see
      // members where their auth uid is the member's user_id (e.g.
      // they're themselves a patient under another practitioner),
      // which is NOT a valid mention target.
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('practitioner_id', authUser.id)
        .eq('is_demo', false)
        .order('last_session_at', { ascending: false, nullsFirst: false })
        .limit(200)
      if (data) {
        setMembers(data.map((m: { id: string; first_name: string | null; last_name: string | null }) => ({
          id: m.id,
          name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || '—',
        })))
      }
    })()
  }, [expanded, members.length, supabase])

  // Update input + detect active @mention by scanning backward from
  // the cursor. We allow up to two words after @ so "Sonia L" still
  // matches Sonia Lebari.
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursor = e.target.selectionStart ?? value.length
    setInput(value)
    const upToCursor = value.slice(0, cursor)
    const atIdx = upToCursor.lastIndexOf('@')
    if (atIdx === -1) {
      setMentionQuery(null)
      setMentionAnchor(null)
      return
    }
    const frag = upToCursor.slice(atIdx + 1)
    // Stop the mention if there's a newline or more than ~30 chars of
    // garbage between @ and cursor.
    if (frag.length > 30 || /\n/.test(frag)) {
      setMentionQuery(null)
      setMentionAnchor(null)
      return
    }
    setMentionQuery(frag)
    setMentionAnchor(atIdx)
  }, [])

  // No artificial cap — show the full filtered list; the dropdown
  // itself is scrollable.
  const mentionMatches = mentionQuery !== null
    ? members.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : []

  // Reset the highlighted row whenever the query changes — the user
  // expects the new top match to be the active one.
  useEffect(() => {
    setMentionHighlight(0)
  }, [mentionQuery])

  const pickMention = useCallback((m: { id: string; name: string }) => {
    if (mentionAnchor === null) return
    const fragLen = mentionQuery?.length ?? 0
    const before = input.slice(0, mentionAnchor)
    const after = input.slice(mentionAnchor + 1 + fragLen)
    const newValue = `${before}@${m.name} ${after}`
    setInput(newValue)
    setMentionQuery(null)
    setMentionAnchor(null)
    setMentionedIds(prev => (prev.includes(m.id) ? prev : [...prev, m.id]))
    setTimeout(() => {
      const el = inputRef.current
      if (el) {
        el.focus()
        const pos = mentionAnchor + 1 + m.name.length + 1
        el.setSelectionRange(pos, pos)
      }
    }, 0)
  }, [input, mentionAnchor, mentionQuery])

  // Enter → pick highlighted match (instead of submitting the form).
  // ArrowDown / ArrowUp → move highlight. Escape → close dropdown.
  // All gated on the dropdown actually being visible.
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionMatches.length === 0) return
    if (e.key === 'Enter') {
      e.preventDefault()
      const pick = mentionMatches[mentionHighlight] || mentionMatches[0]
      if (pick) pickMention(pick)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMentionHighlight(i => (i + 1) % mentionMatches.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMentionHighlight(i => (i - 1 + mentionMatches.length) % mentionMatches.length)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setMentionQuery(null)
      setMentionAnchor(null)
    }
  }, [mentionMatches, mentionHighlight, pickMention])

  // When the user wipes the input or sends, clear mention state.
  // Also keep the mentionedIds list aligned with what's actually in
  // the input — if they backspaced over "@Sonia", drop that id.
  useEffect(() => {
    if (mentionedIds.length === 0) return
    const active = new Set<string>()
    for (const m of members) {
      if (input.includes(`@${m.name}`)) active.add(m.id)
    }
    if (active.size !== mentionedIds.length || mentionedIds.some(id => !active.has(id))) {
      setMentionedIds(Array.from(active))
    }
  }, [input, members, mentionedIds])

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
        body: JSON.stringify({ message: text.trim(), conversationId, locale, mentionedMemberIds: mentionedIds }),
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
      // Clear mention state once the message is sent — next question
      // starts clean unless the practitioner re-tags.
      setMentionedIds([])
    }
  }, [isLoading, conversationId, locale, supabase, errText, limitText, mentionedIds])

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
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.grad} shrink-0`} />
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
            className={`fixed inset-0 z-[300] ${theme.backdrop} backdrop-blur-sm flex items-start justify-center pt-[15vh]`}
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
                            <div className="relative">
                            <div className="flex items-center gap-3 px-5 py-4">
                              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${theme.grad} shrink-0`} />
                              <input
                                ref={isEmpty ? inputRef : undefined}
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleInputKeyDown}
                                placeholder={locale === 'fr' ? 'Demandez à Bloom… tapez @ pour mentionner un patient' : locale === 'es' ? 'Pregunta a Bloom… escribe @ para mencionar un paciente' : 'Ask Bloom… type @ to mention a patient'}
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
                            {mentionMatches.length > 0 && (
                              <MentionDropdown
                                matches={mentionMatches}
                                onPick={pickMention}
                                anchorRef={inputRef}
                                highlight={mentionHighlight}
                                topAnchored
                                accent={accent}
                              />
                            )}
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
                                  <span className={`w-1.5 h-1.5 rounded-full bg-gray-300 ${theme.hoverDot} transition-colors shrink-0`} />
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
                                                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.accent || theme.mentionHex }} />
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
                                  <span className={`w-1.5 h-1.5 ${theme.loadDot} rounded-full animate-bounce [animation-delay:0ms]`} />
                                  <span className={`w-1.5 h-1.5 ${theme.loadDot} rounded-full animate-bounce [animation-delay:150ms]`} />
                                  <span className={`w-1.5 h-1.5 ${theme.loadDot} rounded-full animate-bounce [animation-delay:300ms]`} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom input */}
                          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}>
                            <div className="relative border-t border-gray-100">
                            {mentionMatches.length > 0 && (
                              <MentionDropdown
                                matches={mentionMatches}
                                onPick={pickMention}
                                anchorRef={inputRef}
                                highlight={mentionHighlight}
                                accent={accent}
                              />
                            )}
                            <div className="flex items-center gap-3 px-5 py-3">
                              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${theme.grad} shrink-0`} />
                              <input
                                ref={isEmpty ? undefined : inputRef}
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleInputKeyDown}
                                placeholder={locale === 'fr' ? 'Continuez… @ pour mentionner' : locale === 'es' ? 'Continúa… @ para mencionar' : 'Follow up… @ to mention'}
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
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${theme.newBtn} rounded-lg transition-colors`}
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
                                <span className={`w-1.5 h-1.5 rounded-full ${theme.activeDot} shrink-0 ml-3`} />
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

// ── Mention dropdown ────────────────────────────────────────────────
// Standalone so both the empty-state input and the chat-active input
// can render the same component without duplicating markup. Anchored
// just below the input row by absolute positioning; topAnchored flips
// the side for the empty-state input which sits at the top of the
// modal.
function MentionDropdown({
  matches,
  onPick,
  anchorRef,
  highlight,
  topAnchored,
  accent = 'teal',
}: {
  matches: Array<{ id: string; name: string }>
  onPick: (m: { id: string; name: string }) => void
  anchorRef: React.RefObject<HTMLInputElement | null>
  highlight: number
  topAnchored?: boolean
  accent?: 'teal' | 'blue'
}) {
  const theme = ACCENTS[accent]
  // Position via fixed coordinates + portal so the dropdown escapes
  // the Ask Bloom modal's overflow-hidden container.
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const compute = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Drop ~24px to clear the bullet circle + breathing room.
      const left = Math.max(8, rect.left - 24)
      const width = 240
      const dropdownH = dropdownRef.current?.offsetHeight ?? 280
      const top = topAnchored
        ? rect.bottom + 10
        : Math.max(8, rect.top - dropdownH - 8)
      setCoords({ top, left, width })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [anchorRef, topAnchored, matches.length])

  if (typeof document === 'undefined' || !coords) return null

  return createPortal(
    <div
      ref={dropdownRef}
      // Stop mousedown propagation so the Ask Bloom modal's "click
      // outside to close" handler treats this dropdown as part of the
      // popup. Without this, picking a patient closes the whole modal
      // because the portal mounts outside contentRef.
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-[400] bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden"
      style={{ top: coords.top, left: coords.left, width: coords.width }}
    >
      <ul className="max-h-72 overflow-y-auto py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {matches.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onPick(m) }}
              className={`w-full text-left px-2.5 py-1.5 text-[13px] text-gray-900 ${theme.mentionRow} transition-colors flex items-center gap-2 ${
                i === highlight ? theme.mentionHi : ''
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${theme.mentionAvatar} text-[9px] font-semibold text-white flex items-center justify-center shrink-0`}>
                {(m.name[0] || '?').toUpperCase()}
              </span>
              <span className="truncate">{m.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  )
}
