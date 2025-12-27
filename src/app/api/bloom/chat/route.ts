import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { getBloomSystemPrompt, generateSuggestions, generateContentBlocks } from '@/lib/bloom/prompts'
import { buildBloomContext, formatContextForPrompt, type EntryPoint } from '@/lib/bloom/context'
import type { BloomPersonality } from '@/types/bloom'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for expensive AI operations
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.expensive)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

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

    // SECURITY: Verify conversation ownership if conversationId provided
    if (conversationId) {
      const { data: existingConversation, error: convCheckError } = await supabase
        .from('bloom_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single()

      if (convCheckError || !existingConversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      if (existingConversation.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized: Cannot access this conversation' }, { status: 403 })
      }
    }

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

    // Generate personalized suggestions based on context
    const now = new Date()
    const todayBalance = bloomContext.today.balance
    const weeklyMoods = bloomContext.thisWeek.moods

    // Determine mood trend from weekly data
    let moodTrend: 'positive' | 'negative' | 'neutral' | undefined
    if (weeklyMoods.positive > 60) moodTrend = 'positive'
    else if (weeklyMoods.negative > 40) moodTrend = 'negative'
    else moodTrend = 'neutral'

    const suggestions = generateSuggestions({
      hasMoments: bloomContext.today.moments.count > 0 || bloomContext.thisWeek.momentsCount > 0,
      recentMoodTrend: moodTrend,
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours(),
      hasSleptWell: todayBalance.hasLogged ? (todayBalance.sleep / 60) >= 7 : undefined,
      workLifeBalance: todayBalance.hasLogged
        ? (todayBalance.work > 9 ? 'work_heavy' : 'balanced')
        : undefined,
    }, locale)

    // Generate rich content blocks based on user's message
    const contentBlocks = generateContentBlocks(message, bloomContext, locale)

    return NextResponse.json({
      message: responseText,
      conversationId: activeConversationId,
      suggestions,
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
    })
  } catch (error) {
    console.error('Bloom chat error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
