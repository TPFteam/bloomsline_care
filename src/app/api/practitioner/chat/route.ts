import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { buildPractitionerContext, formatPractitionerContextForPrompt } from '@/lib/bloom/practitioner-context'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

function getSystemPrompt(locale: 'en' | 'fr' | 'es' = 'en'): string {
  return `You are Bloom Assistant, a professional data assistant for healthcare practitioners using Bloomsline Care.

ROLE:
- You help practitioners understand their practice data: members, sessions, milestones, resources, and patterns.
- You reference actual names, dates, and numbers from the practitioner's data provided below.
- You are warm but professional — like a knowledgeable colleague.

RULES:
- Keep answers concise: 2-5 sentences for simple questions, more for complex analysis.
- Always reference specific data when available (member names, counts, dates).
- If the data doesn't contain what's needed, say so clearly.
- You CANNOT modify data, schedule sessions, or take actions — only analyze and inform.
- You CANNOT give clinical advice, diagnoses, or treatment recommendations.
- Never fabricate data. Only reference what's in the context.
- FORMATTING: Use plain text only. No markdown, no bold (**), no italics, no bullet points (- or *). Use line breaks and numbered lists (1. 2. 3.) for structure. Use ALL CAPS sparingly for emphasis instead of bold.
${locale === 'fr' ? '- IMPORTANT: Always respond in French.' : locale === 'es' ? '- IMPORTANT: Always respond in Spanish.' : '- Respond in English by default.'}`
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.expensive)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

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
    } = body as {
      message: string
      conversationId?: string
      locale?: 'en' | 'fr' | 'es'
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create conversation
    let activeConversationId = conversationId

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
      const { data: newConversation, error: convError } = await supabase
        .from('bloom_conversations')
        .insert({
          user_id: user.id,
          title: `Practice: ${message.slice(0, 40)}`,
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

    // Build practitioner context
    const practitionerContext = await buildPractitionerContext(supabase, user.id)
    const contextPrompt = formatPractitionerContextForPrompt(practitionerContext, locale)

    const systemPrompt = `${getSystemPrompt(locale)}

PRACTITIONER DATA:
${contextPrompt}`

    // Build messages array
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
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

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
    console.error('Practitioner chat error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
