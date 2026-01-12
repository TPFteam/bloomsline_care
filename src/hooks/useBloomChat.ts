'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { sendMessage, getActiveConversation, getConversationMessages } from '@/lib/services/bloom'
import type { BloomMessage, BloomState, ContentBlock } from '@/types/bloom'

export type BloomEntryPoint = 'home' | 'balance' | 'moments' | 'rituals' | 'progress' | 'reflect' | 'general'

interface UseBloomChatOptions {
  locale?: 'en' | 'fr'
  entryPoint?: BloomEntryPoint
}

interface UseBloomChatReturn {
  messages: BloomMessage[]
  isLoading: boolean
  bloomState: BloomState
  conversationId: string | null
  error: string | null
  suggestions: string[]
  contentBlocks: ContentBlock[]
  sendUserMessage: (message: string) => Promise<void>
  clearChat: () => void
}

export function useBloomChat(options: UseBloomChatOptions = {}): UseBloomChatReturn {
  const { locale = 'en', entryPoint = 'general' } = options

  const [messages, setMessages] = useState<BloomMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bloomState, setBloomState] = useState<BloomState>('idle')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const initRef = useRef(false)

  // Initialize chat: Load existing conversation OR fetch greeting
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    async function initializeChat() {
      try {
        // First, try to load existing conversation
        const activeConv = await getActiveConversation()

        if (activeConv) {
          // Check if conversation is from today (within last 24 hours)
          const lastMessageTime = new Date(activeConv.last_message_at || activeConv.created_at)
          const now = new Date()
          const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60)

          // If conversation is recent (within 4 hours), restore it
          if (hoursSinceLastMessage < 4) {
            setConversationId(activeConv.id)
            const existingMessages = await getConversationMessages(activeConv.id)
            if (existingMessages.length > 0) {
              setMessages(existingMessages)
              return // Don't fetch greeting if we have existing messages
            }
          }
        }

        // No recent conversation - fetch fresh greeting
        const response = await fetch('/api/bloom/greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, entryPoint }),
        })

        let greeting: string
        if (response.ok) {
          const data = await response.json()
          greeting = data.greeting
        } else {
          // Fallback to simple greeting
          const hour = new Date().getHours()
          greeting = locale === 'fr'
            ? (hour < 12 ? 'Bonjour. Comment vas-tu ?' : 'Bonsoir. Comment vas-tu ?')
            : (hour < 12 ? 'Good morning. How are you?' : 'Good evening. How are you?')
        }

        const greetingMessage: BloomMessage = {
          id: 'greeting',
          conversation_id: '',
          user_id: '',
          role: 'assistant',
          content: greeting,
          is_voice_message: false,
          audio_url: null,
          audio_duration_seconds: null,
          tokens_used: null,
          model_version: null,
          created_at: new Date().toISOString(),
        }
        setMessages([greetingMessage])
      } catch {
        // Fallback greeting on error
        const greeting = locale === 'fr' ? 'Bonjour. Comment vas-tu ?' : 'Hey. How are you?'
        const greetingMessage: BloomMessage = {
          id: 'greeting',
          conversation_id: '',
          user_id: '',
          role: 'assistant',
          content: greeting,
          is_voice_message: false,
          audio_url: null,
          audio_duration_seconds: null,
          tokens_used: null,
          model_version: null,
          created_at: new Date().toISOString(),
        }
        setMessages([greetingMessage])
      } finally {
        // Chat initialized
      }
    }

    initializeChat()
  }, [locale, entryPoint])

  const sendUserMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    setIsLoading(true)
    setError(null)
    setBloomState('thinking')

    // Add user message immediately for UI feedback
    const tempUserMessage: BloomMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId || '',
      user_id: '',
      role: 'user',
      content: message,
      is_voice_message: false,
      audio_url: null,
      audio_duration_seconds: null,
      tokens_used: null,
      model_version: null,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await sendMessage({
        message,
        conversationId: conversationId || undefined,
        locale,
        entryPoint,
      })

      setConversationId(response.conversationId)

      // Update suggestions from API response
      if (response.suggestions) {
        setSuggestions(response.suggestions)
      }

      // Update content blocks from API response
      if (response.contentBlocks) {
        setContentBlocks(response.contentBlocks)
      } else {
        setContentBlocks([])
      }

      // Add assistant response
      const assistantMessage: BloomMessage = {
        id: `response-${Date.now()}`,
        conversation_id: response.conversationId,
        user_id: '',
        role: 'assistant',
        content: response.message,
        is_voice_message: false,
        audio_url: null,
        audio_duration_seconds: null,
        tokens_used: null,
        model_version: null,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setBloomState('speaking')

      // Return to idle after a moment
      setTimeout(() => setBloomState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setBloomState('concerned')

      // Remove the temp user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))

      setTimeout(() => setBloomState('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, locale, entryPoint])

  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
    setInitialized(false)
  }, [])

  return {
    messages,
    isLoading,
    bloomState,
    conversationId,
    error,
    suggestions,
    contentBlocks,
    sendUserMessage,
    clearChat,
  }
}
