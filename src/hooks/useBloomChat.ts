'use client'

import { useState, useCallback, useEffect } from 'react'
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
  const [initialized, setInitialized] = useState(false)
  const [greetingLoading, setGreetingLoading] = useState(false)

  // Fetch context-aware greeting from API
  useEffect(() => {
    if (initialized || greetingLoading) return

    async function fetchGreeting() {
      setGreetingLoading(true)
      try {
        const response = await fetch('/api/bloom/greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, entryPoint }),
        })

        if (response.ok) {
          const data = await response.json()
          const greetingMessage: BloomMessage = {
            id: 'greeting',
            conversation_id: '',
            user_id: '',
            role: 'assistant',
            content: data.greeting,
            is_voice_message: false,
            audio_url: null,
            audio_duration_seconds: null,
            tokens_used: null,
            model_version: null,
            created_at: new Date().toISOString(),
          }
          setMessages([greetingMessage])
        } else {
          // Fallback to simple greeting
          const hour = new Date().getHours()
          const greeting = locale === 'fr'
            ? (hour < 12 ? 'Bonjour. Comment vas-tu ?' : 'Bonsoir. Comment vas-tu ?')
            : (hour < 12 ? 'Good morning. How are you?' : 'Good evening. How are you?')

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
        }
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
        setGreetingLoading(false)
        setInitialized(true)
      }
    }

    fetchGreeting()
  }, [locale, entryPoint, initialized, greetingLoading])

  // Load existing conversation if available
  useEffect(() => {
    async function loadConversation() {
      try {
        const activeConv = await getActiveConversation()
        if (activeConv) {
          setConversationId(activeConv.id)
          const existingMessages = await getConversationMessages(activeConv.id)
          if (existingMessages.length > 0) {
            setMessages(existingMessages)
          }
        }
      } catch (err) {
        // Silent fail - just start fresh
        console.log('No existing conversation')
      }
    }

    loadConversation()
  }, [])

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
