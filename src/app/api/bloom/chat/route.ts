import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { getBloomSystemPrompt } from '@/lib/bloom/prompts'
import { buildBloomContext, formatContextForPrompt, type EntryPoint } from '@/lib/bloom/context'
import type { BloomPersonality } from '@/types/bloom'

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    const body = await request.json()
    const {
      message,
      conversationId,
      locale = 'en',
      entryPoint = 'general',
    } = body as {
      message: string
      conversationId?: string
      locale?: 'en' | 'fr'
      entryPoint?: EntryPoint
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Bloom settings
    const { data: settings } = await supabase
      .from('bloom_user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const personality: BloomPersonality = settings?.bloom_personality || 'gentle'

    // Get or create conversation
    let activeConversationId = conversationId

    if (!activeConversationId) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('bloom_conversations')
        .insert({
          user_id: user.id,
          title: message.slice(0, 50),
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      activeConversationId = newConversation.id
    }

    // Get conversation history
    const { data: messageHistory } = await supabase
      .from('bloom_messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build comprehensive user context
    const bloomContext = await buildBloomContext(supabase, user.id, entryPoint)
    const contextPrompt = formatContextForPrompt(bloomContext, locale)

    // Build system prompt with full context
    const systemPrompt = `${getBloomSystemPrompt(personality, locale)}

USER CONTEXT:
${contextPrompt}`

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [
      ...(messageHistory || []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ]

    // Save user message
    await supabase.from('bloom_messages').insert({
      conversation_id: activeConversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    })

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    })

    // Extract response text
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Save assistant message
    await supabase.from('bloom_messages').insert({
      conversation_id: activeConversationId,
      user_id: user.id,
      role: 'assistant',
      content: responseText,
      tokens_used: response.usage.output_tokens,
      model_version: response.model,
    })

    // Update conversation last_message_at
    await supabase
      .from('bloom_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', activeConversationId)

    return NextResponse.json({
      message: responseText,
      conversationId: activeConversationId,
    })
  } catch (error) {
    console.error('Bloom chat error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
