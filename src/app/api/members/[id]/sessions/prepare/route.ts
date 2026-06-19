import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import {
  getSessionPrepSystemPrompt,
  buildSessionPrepPrompt,
  type SessionPrepContext,
  type SupportedLocale,
  type SessionPrep,
} from '@/lib/session-prep/prompts'
import { buildAboutText } from '@/lib/members/about-sections'

/**
 * POST /api/members/[id]/sessions/prepare
 * Generate an AI-powered session preparation briefing (ephemeral, not saved)
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

    // Rate limiting
    const clientId = getClientIdentifier(request, user.id)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.expensive)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Parse body
    const body = await request.json().catch(() => ({}))
    const locale: SupportedLocale = ['en', 'fr', 'es'].includes(body.locale) ? body.locale : 'en'
    const sessionId = body.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

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

    // Fetch target session (must be scheduled)
    const { data: targetSession, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('member_id', memberId)
      .eq('practitioner_id', user.id)
      .single()

    if (sessionError || !targetSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (targetSession.status !== 'scheduled') {
      return NextResponse.json({ error: 'Session must be scheduled' }, { status: 400 })
    }

    // Fetch context data in parallel
    const [
      sessionsResult,
      notesResult,
      milestonesResult,
      reflectionsResult,
    ] = await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(15),

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

      supabase
        .from('member_reflections')
        .select('id, mood_value, gratitude_entries, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const sessions = sessionsResult.data || []
    const notes = notesResult.data || []
    const milestones = milestonesResult.data || []
    const reflections = reflectionsResult.data || []

    // Serialize the practitioner's "About patient" sections for this member.
    const aboutText = await buildAboutText(supabase, user.id, member.overview_content)

    // Check for minimum data
    const hasData = sessions.length > 0 || notes.length > 0 || milestones.length > 0 || !!aboutText

    if (!hasData) {
      return NextResponse.json({
        error: 'Not enough data to prepare for this session. Add sessions, notes, or goals first.',
        code: 'INSUFFICIENT_DATA',
      }, { status: 400 })
    }

    // Build prompts
    const context: SessionPrepContext = {
      member,
      targetSession,
      sessions,
      notes,
      milestones,
      reflections,
      aboutText,
      locale,
    }

    const systemPrompt = getSessionPrepSystemPrompt(locale)
    const userPrompt = buildSessionPrepPrompt(context)

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Parse JSON response
    let prep: SessionPrep
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      prep = JSON.parse(jsonMatch[0])

      // Validate required fields
      if (!prep.quick_context || !Array.isArray(prep.suggested_focus)) {
        throw new Error('Invalid session prep structure')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', responseText)
      return NextResponse.json({
        error: 'Failed to generate session preparation. Please try again.',
        code: 'PARSE_ERROR',
      }, { status: 500 })
    }

    // Persist the prep to the session record
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ preparation: prep })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Failed to save session preparation:', updateError)
      // Still return the prep even if saving failed
    }

    return NextResponse.json({ prep })
  } catch (error) {
    console.error('Session prep generation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while preparing for the session' },
      { status: 500 }
    )
  }
}
