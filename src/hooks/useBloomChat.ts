'use client'

import { useState, useCallback, useEffect } from 'react'
import { sendMessage, getActiveConversation, getConversationMessages } from '@/lib/services/bloom'
import { getGreeting } from '@/lib/bloom/prompts'
import type { BloomMessage, BloomState } from '@/types/bloom'

interface UseBloomChatOptions {
  locale?: 'en' | 'fr'
  includeRecentMoments?: boolean
}

interface UseBloomChatReturn {
  messages: BloomMessage[]
  isLoading: boolean
  bloomState: BloomState
  conversationId: string | null
  error: string | null
  sendUserMessage: (message: string) => Promise<void>
  clearChat: () => void
}

export function useBloomChat(options: UseBloomChatOptions = {}): UseBloomChatReturn {
  const { locale = 'en', includeRecentMoments = true } = options

  const [messages, setMessages] = useState<BloomMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bloomState, setBloomState] = useState<BloomState>('idle')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Initialize with greeting
  useEffect(() => {
    if (initialized) return

    const greeting = getGreeting(locale)
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
    setInitialized(true)
  }, [locale, initialized])

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
        includeRecentMoments,
        locale,
      })

      setConversationId(response.conversationId)

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
  }, [conversationId, includeRecentMoments, locale])

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
    sendUserMessage,
    clearChat,
  }
}
