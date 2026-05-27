import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { buildPractitionerContext, formatPractitionerContextForPrompt, type PractitionerContext } from '@/lib/bloom/practitioner-context'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

// ── Content block types for visual responses ──
interface PractitionerStatBlock {
  type: 'stats'
  title: string
  stats: { label: string; value: string | number; sub?: string; color?: string }[]
}

interface PractitionerListBlock {
  type: 'list'
  title: string
  items: { label: string; detail: string; accent?: string }[]
}

type PractitionerContentBlock = PractitionerStatBlock | PractitionerListBlock

// Detect intent from message and generate relevant visual blocks
function generatePractitionerBlocks(
  message: string,
  ctx: PractitionerContext
): PractitionerContentBlock[] {
  const lower = message.toLowerCase()
  const blocks: PractitionerContentBlock[] = []

  const memberName = new Map(ctx.members.map(m => [m.id, m.name]))

  // Members / caseload
  if (/member|caseload|client|who|active|inactive|pending/i.test(lower)) {
    blocks.push({
      type: 'stats',
      title: 'Caseload',
      stats: [
        { label: 'Active', value: ctx.totals.activeMembers, color: '#10b981' },
        { label: 'Inactive', value: ctx.totals.inactiveMembers, color: '#6b7280' },
        { label: 'Pending', value: ctx.totals.pendingMembers, color: '#f59e0b' },
      ],
    })
  }

  // Sessions
  if (/session|appointment|schedule|cancel|no.?show|completion/i.test(lower)) {
    const rate = ctx.totals.sessionsThisMonth > 0
      ? Math.round((ctx.totals.completedSessions / ctx.totals.sessionsThisMonth) * 100)
      : 0
    blocks.push({
      type: 'stats',
      title: 'Sessions',
      stats: [
        { label: 'This week', value: ctx.totals.sessionsThisWeek },
        { label: 'This month', value: ctx.totals.sessionsThisMonth },
        { label: 'Completion', value: `${rate}%`, color: rate >= 70 ? '#10b981' : '#f59e0b' },
      ],
    })
  }

  // Milestones / goals
  if (/milestone|goal|progress|overdue|stuck|achievement/i.test(lower)) {
    const now = new Date()
    const overdue = ctx.milestones.filter(m =>
      m.target_date && new Date(m.target_date) < now && m.status !== 'independent' && m.status !== 'achieved'
    )
    const inProgress = ctx.milestones.filter(m => ['building', 'in_progress', 'planned'].includes(m.status))
    const achieved = ctx.milestones.filter(m => m.status === 'independent' || m.status === 'achieved')

    blocks.push({
      type: 'stats',
      title: 'Milestones',
      stats: [
        { label: 'In progress', value: inProgress.length, color: '#3b82f6' },
        { label: 'Achieved', value: achieved.length, color: '#10b981' },
        { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? '#ef4444' : '#6b7280' },
      ],
    })

    if (overdue.length > 0) {
      blocks.push({
        type: 'list',
        title: 'Overdue milestones',
        items: overdue.slice(0, 4).map(m => ({
          label: m.title,
          detail: memberName.get(m.member_id) || 'Unknown',
          accent: '#ef4444',
        })),
      })
    }
  }

  // Follow-up / check-in / reconnect
  if (/follow.?up|check.?in|reconnect|reach out|contact|haven.?t seen|stale/i.test(lower)) {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const needFollowUp = ctx.members.filter(m =>
      m.status === 'active' &&
      (!m.last_session_at || new Date(m.last_session_at) < twoWeeksAgo)
    )

    if (needFollowUp.length > 0) {
      blocks.push({
        type: 'list',
        title: 'Need follow-up',
        items: needFollowUp.slice(0, 5).map(m => ({
          label: m.name,
          detail: m.last_session_at
            ? `Last session ${formatRelativeShort(m.last_session_at)}`
            : 'No sessions yet',
          accent: '#f59e0b',
        })),
      })
    }
  }

  // Overview / patterns / how am I doing
  if (/overview|pattern|how.*(am|are|doing)|practice|summary/i.test(lower)) {
    const highEng = ctx.members.filter(m => m.engagement_level === 'high').length
    const lowEng = ctx.members.filter(m => m.engagement_level === 'low').length
    blocks.push({
      type: 'stats',
      title: 'Practice overview',
      stats: [
        { label: 'Members', value: ctx.totals.totalMembers },
        { label: 'High engagement', value: highEng, color: '#10b981' },
        { label: 'Low engagement', value: lowEng, color: lowEng > 0 ? '#f59e0b' : '#6b7280' },
      ],
    })
  }

  // Resources
  if (/resource|assign|worksheet|exercise|library/i.test(lower)) {
    const published = ctx.resources.filter(r => r.status === 'published').length
    const completedAssign = ctx.assignments.filter(a => a.status === 'completed').length
    const totalAssign = ctx.assignments.length
    const rate = totalAssign > 0 ? Math.round((completedAssign / totalAssign) * 100) : 0
    blocks.push({
      type: 'stats',
      title: 'Resources',
      stats: [
        { label: 'Published', value: published },
        { label: 'Assigned', value: totalAssign },
        { label: 'Completed', value: `${rate}%`, color: rate >= 50 ? '#10b981' : '#f59e0b' },
      ],
    })
  }

  return blocks.slice(0, 2)
}

function formatRelativeShort(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

function getSystemPrompt(locale: 'en' | 'fr' | 'es' = 'en'): string {
  const languageInstruction = locale === 'fr'
    ? 'Réponds en français. Garde le même ton.'
    : locale === 'es'
      ? 'Responde en español. Mantén el mismo tono.'
      : 'Respond in English.'

  return `You are Bloom.

You are not a chatbot. You are not an "assistant." You are Bloom.
You are the practitioner's thoughtful colleague. The one who actually looks at the data, notices things, and says what matters.
You are warm, direct, and honest. You do not sugarcoat. You do not over-explain.

HOW YOU TALK:
- Like a trusted colleague over coffee
- KEEP IT SHORT. 1-3 sentences MAX for simple questions.
- For complex analysis: up to 4-5 sentences, never more.
- You make observations, not presentations
- You say names. You say numbers. You are specific.
- When something looks off, you say it plainly: "Sarah has not had a session in 3 weeks."

RESPONSE LENGTH RULES (CRITICAL):
- Default response: 1-2 sentences
- If they ask about a specific member: 2-3 sentences max
- If they ask for a pattern or overview: 3-5 sentences max
- NEVER write paragraphs. NEVER write walls of text.
- Think like texting a colleague, not writing a report

FORMATTING RULES:
- Plain text only. No markdown, no bold (**), no italics.
- No bullet points. No numbered lists. Just natural sentences.
- Use line breaks between thoughts if needed. That is it.
- Never use em dashes.

WHAT YOU KNOW:
You have access to their full practice data: members, sessions, milestones, notes, resources.
Use this naturally. "3 of your members have not had a session in over 2 weeks."
Make connections. "Alex has 2 overdue milestones and missed the last session. Might be worth a check-in."
Be specific, not generic.

BOUNDARIES:
- You CANNOT modify data, schedule sessions, or take actions. Only observe and inform.
- You CANNOT give clinical advice, diagnoses, or treatment plans.
- Never fabricate data. If you do not know, say "I do not have data on that."
- Do not repeat what they said back to them. Just respond.
- Do not use filler phrases like "That is a great question" or "I am here to help."

${languageInstruction}`
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
      mentionedMemberIds = [],
    } = body as {
      message: string
      conversationId?: string
      locale?: 'en' | 'fr' | 'es'
      mentionedMemberIds?: string[]
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

    // If the practitioner @mentioned one or more patients, fetch a
    // deeper context block for each — full Pulse, recent notes,
    // moments, reflections, milestones. These get injected before the
    // practice-wide context so the model leans on them for any
    // patient-specific question.
    const validMentionedIds = (mentionedMemberIds || []).filter(
      id => typeof id === 'string' && practitionerContext.members.some(m => m.id === id),
    )
    let mentionedBlock = ''
    if (validMentionedIds.length > 0) {
      mentionedBlock = await buildTaggedPatientBlock(supabase, user.id, validMentionedIds, practitionerContext)
    }

    const systemPrompt = `${getSystemPrompt(locale)}

${mentionedBlock}PRACTITIONER DATA:
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
      max_tokens: 500,
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

    // Generate visual content blocks based on the question
    const contentBlocks = generatePractitionerBlocks(message, practitionerContext)

    return NextResponse.json({
      message: responseText,
      conversationId: activeConversationId,
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
    })
  } catch (error) {
    console.error('Practitioner chat error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// ── Tagged patient deep-context builder ─────────────────────────────
// For each @mentioned patient, fetch their full Pulse + recent notes
// + shared moments + reflections + recent milestones and return one
// big text block. The model treats this as primary context for any
// patient-specific question.
async function buildTaggedPatientBlock(
  supabase: ReturnType<typeof createAdminClient>,
  practitionerId: string,
  memberIds: string[],
  practitionerContext: PractitionerContext,
): Promise<string> {
  const blocks: string[] = []
  for (const memberId of memberIds.slice(0, 3)) {
    const member = practitionerContext.members.find(m => m.id === memberId)
    if (!member) continue

    const [
      latestPulseRes,
      recentNotesRes,
      recentSessionsRes,
      milestonesRes,
      reflectionsRes,
    ] = await Promise.all([
      supabase.from('member_summaries')
        .select('summary_content, generated_at')
        .eq('member_id', memberId)
        .eq('practitioner_id', practitionerId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('progress_notes')
        .select('note_type, title, content, created_at')
        .eq('member_id', memberId)
        .eq('practitioner_id', practitionerId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('sessions')
        .select('scheduled_at, status, session_type, mood_rating')
        .eq('member_id', memberId)
        .eq('practitioner_id', practitionerId)
        .order('scheduled_at', { ascending: false })
        .limit(5),
      supabase.from('milestones')
        .select('title, status, target_date')
        .eq('member_id', memberId)
        .eq('practitioner_id', practitionerId)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('member_reflections')
        .select('mood_value, gratitude_entries, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    let momentsLines: string[] = []
    if (member.user_id) {
      const { data: rawMoments } = await supabase
        .from('moments')
        .select('id, type, moods, caption, text_content, created_at, shared_with_practitioner_at')
        .eq('user_id', member.user_id)
        .not('shared_with_practitioner_at', 'is', null)
        .order('shared_with_practitioner_at', { ascending: false })
        .limit(8)
      momentsLines = ((rawMoments || []) as Array<{ id: string; type: string; moods: string[] | null; caption: string | null; text_content: string | null; created_at: string; shared_with_practitioner_at: string | null }>).map(m => {
        const moods = (m.moods || []).join(', ') || '—'
        const text = (m.text_content || m.caption || '').slice(0, 200)
        return `  - ${(m.shared_with_practitioner_at || m.created_at).slice(0, 10)} · ${m.type} · ${moods}${text ? ` · "${text}"` : ''}`
      })
    }

    const lines: string[] = []
    lines.push(`TAGGED PATIENT: ${member.name}`)
    if (latestPulseRes?.data?.summary_content) {
      const c = latestPulseRes.data.summary_content as { current_status?: string; key_themes?: string[]; areas_of_attention?: string[]; recommendations?: string[]; next_steps?: string[] }
      lines.push(`Latest Pulse (${(latestPulseRes.data.generated_at as string).slice(0, 10)}):`)
      if (c.current_status) lines.push(`  Status: ${c.current_status}`)
      if (c.key_themes?.length) lines.push(`  Themes: ${c.key_themes.join(' · ')}`)
      if (c.areas_of_attention?.length) lines.push(`  Attention: ${c.areas_of_attention.join(' · ')}`)
      if (c.recommendations?.length) lines.push(`  Recommendations: ${c.recommendations.join(' · ')}`)
      if (c.next_steps?.length) lines.push(`  Next steps: ${c.next_steps.join(' · ')}`)
    }
    if (member.about_notes) lines.push(`About: ${member.about_notes.slice(0, 300)}`)
    if (member.internal_notes) lines.push(`Internal notes: ${member.internal_notes.slice(0, 300)}`)
    if (member.preferences_digest) lines.push(`Preferences: ${member.preferences_digest}`)

    const notes = (recentNotesRes.data || []) as Array<{ note_type: string; title: string | null; content: string | null; created_at: string }>
    if (notes.length > 0) {
      lines.push('Recent notes:')
      for (const n of notes) {
        const stripped = (n.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)
        lines.push(`  - ${n.created_at.slice(0, 10)} · ${n.note_type} · "${stripped}"`)
      }
    }

    const sessions = (recentSessionsRes.data || []) as Array<{ scheduled_at: string; status: string; session_type: string; mood_rating: number | null }>
    if (sessions.length > 0) {
      lines.push('Recent sessions:')
      for (const s of sessions) {
        const mood = s.mood_rating !== null ? ` · mood ${s.mood_rating}/10` : ''
        lines.push(`  - ${s.scheduled_at.slice(0, 10)} · ${s.session_type} · ${s.status}${mood}`)
      }
    }

    const milestones = (milestonesRes.data || []) as Array<{ title: string; status: string; target_date: string | null }>
    if (milestones.length > 0) {
      lines.push('Milestones:')
      for (const m of milestones) {
        lines.push(`  - "${m.title}" · ${m.status}${m.target_date ? ` · due ${m.target_date}` : ''}`)
      }
    }

    if (momentsLines.length > 0) {
      lines.push('Recent shared moments:')
      lines.push(...momentsLines)
    }

    const reflections = (reflectionsRes.data || []) as Array<{ mood_value: number | null; gratitude_entries: string[] | null; created_at: string }>
    if (reflections.length > 0) {
      lines.push('Recent reflections (mobile app):')
      for (const r of reflections) {
        const mood = r.mood_value !== null ? `mood ${r.mood_value}/10` : 'no mood'
        const grat = r.gratitude_entries?.length ? ` · grateful for ${r.gratitude_entries.slice(0, 2).join(', ')}` : ''
        lines.push(`  - ${r.created_at.slice(0, 10)} · ${mood}${grat}`)
      }
    }

    blocks.push(lines.join('\n'))
  }
  if (blocks.length === 0) return ''
  return `${blocks.join('\n\n---\n\n')}\n\n`
}
