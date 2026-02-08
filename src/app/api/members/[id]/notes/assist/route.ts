import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import {
  getAssistSystemPrompt,
  buildAssistUserPrompt,
  type PromptKey,
  type AssistContext,
  type SupportedLocale,
} from '@/lib/assist/prompts'

const VALID_PROMPT_KEYS: PromptKey[] = [
  'summarize_session',
  'key_themes',
  'focus_next',
  'session_reflection',
  'note_suggestions',
]

/**
 * POST /api/members/[id]/notes/assist
 * Generate a quick AI-powered insight for the Notes tab (ephemeral — not saved)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      )
    }

    const supabase = createAdminClient()

    // Auth via Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const clientId = getClientIdentifier(request, user.id)
    const rateLimitResult = checkRateLimit(`assist:${clientId}`, RATE_LIMITS.assist)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Parse body
    const body = await request.json().catch(() => ({}))
    const { promptKey, locale: rawLocale } = body

    if (!promptKey || !VALID_PROMPT_KEYS.includes(promptKey)) {
      return NextResponse.json({ error: 'Invalid prompt key' }, { status: 400 })
    }

    const locale: SupportedLocale = ['en', 'fr', 'es'].includes(rawLocale) ? rawLocale : 'en'

    // Verify practitioner owns this member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .eq('practitioner_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Fetch context data
    const [sessionsResult, notesResult, milestonesResult] = await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('scheduled_at', { ascending: false })
        .limit(10),
      supabase
        .from('progress_notes')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('milestones')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    const sessions = sessionsResult.data || []
    const notes = notesResult.data || []
    const milestones = milestonesResult.data || []

    const hasData = sessions.length > 0 || notes.length > 0

    if (!hasData) {
      return NextResponse.json({
        error: 'Not enough data to generate insights. Add sessions or notes first.',
        code: 'INSUFFICIENT_DATA',
      }, { status: 400 })
    }

    const context: AssistContext = { member, sessions, notes, milestones }

    const systemPrompt = getAssistSystemPrompt(locale)
    const userPrompt = buildAssistUserPrompt(promptKey, context, locale)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return NextResponse.json({ response: responseText })
  } catch (error) {
    console.error('Bloom Assist error:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating the response' },
      { status: 500 }
    )
  }
}
