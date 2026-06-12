import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import {
  getSummarySystemPrompt,
  buildSummaryPrompt,
  generatePlainTextSummary,
  type SummaryContext,
  type SupportedLocale,
} from '@/lib/summary/prompts'
import { buildAboutText } from '@/lib/members/about-sections'
import { extractAllMemberFiles, formatExtractionsForPrompt } from '@/lib/pulse/file-extraction'
import { PULSE_VERSION } from '@/lib/bloom/pulse-version'
import type { SummaryContent } from '@/types/member'

/**
 * POST /api/members/[id]/summary
 * Generate a new AI-powered therapeutic summary for a member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params

    // Check for API key first
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
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

    // Rate limiting for AI summary operations
    const clientId = getClientIdentifier(request, user.id)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.summary)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many summary requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Parse request body for locale
    const body = await request.json().catch(() => ({}))
    const locale: SupportedLocale = ['en', 'fr', 'es'].includes(body.locale) ? body.locale : 'en'

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

    // Serialize the practitioner's "About patient" sections for this member
    // (replaces the legacy internal_notes/preferences context).
    const aboutText = await buildAboutText(supabase, user.id, member.overview_content)

    // Fetch all member data for context
    const [
      sessionsResult,
      notesResult,
      milestonesResult,
      reflectionsResult,
      sharedResourcesResult,
      milestoneCommentsResult,
      sharedMomentsResult,
      patientStoriesResult,
      resourceResponsesResult,
      bookingsResult,
    ] = await Promise.all([
      // Sessions
      supabase
        .from('sessions')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('scheduled_at', { ascending: false })
        .limit(20),

      // Progress notes
      supabase
        .from('progress_notes')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),

      // Milestones
      supabase
        .from('milestones')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false }),

      // Member reflections
      supabase
        .from('member_reflections')
        .select('id, mood_value, gratitude_entries, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Shared resources
      supabase
        .from('member_shared_resources')
        .select('id, shared_at, viewed_at, resource:resources(id, title, type)')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('shared_at', { ascending: false })
        .limit(10),

      // Milestone comments - first get milestone IDs for this member
      supabase
        .from('milestones')
        .select('id')
        .eq('member_id', memberId)
        .then(async ({ data: memberMilestones }) => {
          if (!memberMilestones || memberMilestones.length === 0) {
            return { data: [], error: null }
          }
          const milestoneIds = memberMilestones.map(m => m.id)
          return supabase
            .from('milestone_comments')
            .select('id, content, created_at, milestone_id')
            .in('milestone_id', milestoneIds)
            .order('created_at', { ascending: false })
            .limit(10)
        }),

      // Patient-shared moments (B2C). moments.user_id is the auth uid
      // of the patient — same id as members.user_id.
      member.user_id
        ? supabase
            .from('moments')
            .select('id, type, moods, caption, text_content, created_at, shared_with_practitioner_at')
            .eq('user_id', member.user_id)
            .not('shared_with_practitioner_at', 'is', null)
            .order('shared_with_practitioner_at', { ascending: false })
            .limit(15)
        : Promise.resolve({ data: [], error: null }),

      // Patient stories shared with this practitioner.
      supabase
        .from('story_shares')
        .select('id, shared_at, story:stories!inner(id, title, content)')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('shared_at', { ascending: false })
        .limit(8),

      // Submitted resource responses (worksheets / assessments the
      // patient actually filled out).
      supabase
        .from('resource_responses')
        .select('id, status, submitted_at, resource:resources(id, title, type), answers')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(10),

      // Bookings timeline — last 8 past + next 4 upcoming so the model
      // sees cadence + what's queued.
      supabase
        .from('bookings')
        .select('id, start_time, status, session_type, session_format')
        .eq('practitioner_id', user.id)
        .eq('member_id', memberId)
        .order('start_time', { ascending: false })
        .limit(12),
    ])

    // Check if there's enough data to generate a meaningful summary
    const sessions = sessionsResult.data || []
    const notes = notesResult.data || []
    const milestones = milestonesResult.data || []
    const reflections = reflectionsResult.data || []
    const sharedResources = sharedResourcesResult.data || []
    const milestoneComments = milestoneCommentsResult.data || []
    const sharedMomentsRaw = (sharedMomentsResult.data || []) as Array<{
      id: string; type: string; moods: string[] | null; caption: string | null;
      text_content: string | null; created_at: string;
      shared_with_practitioner_at: string | null;
    }>
    const patientStoriesRaw = (patientStoriesResult.data || []) as Array<{
      id: string; shared_at: string;
      story?: { id: string; title: string | null; content: unknown } | Array<{ id: string; title: string | null; content: unknown }>
    }>
    const resourceResponsesRaw = (resourceResponsesResult.data || []) as Array<{
      id: string; status: string | null; submitted_at: string | null;
      resource?: { id: string; title: string | null; type: string | null } | Array<{ id: string; title: string | null; type: string | null }>
      answers: unknown
    }>
    const bookingsRaw = (bookingsResult.data || []) as Array<{
      id: string; start_time: string; status: string | null;
      session_type: string | null; session_format: string | null
    }>

    // Fetch moment comments in one batch for the shared moments above.
    // Avoid the N+1 — single query with .in() then group by moment_id.
    let momentCommentsByMoment = new Map<string, Array<{ author_type: 'practitioner' | 'member'; content: string; created_at: string }>>()
    if (sharedMomentsRaw.length > 0) {
      const momentIds = sharedMomentsRaw.map(m => m.id)
      const { data: cmtRows } = await supabase
        .from('moment_comments')
        .select('moment_id, author_type, content, created_at')
        .in('moment_id', momentIds)
        .order('created_at', { ascending: true })
      for (const c of (cmtRows || []) as Array<{ moment_id: string; author_type: 'practitioner' | 'member'; content: string; created_at: string }>) {
        const list = momentCommentsByMoment.get(c.moment_id) || []
        list.push({ author_type: c.author_type, content: c.content, created_at: c.created_at })
        momentCommentsByMoment.set(c.moment_id, list)
      }
    }

    // Flatten the nested shapes Supabase returns when joining via FK.
    const sharedMoments = sharedMomentsRaw.map(m => ({
      ...m,
      comments: momentCommentsByMoment.get(m.id) || [],
    }))
    const patientStories = patientStoriesRaw.map(s => {
      const story = Array.isArray(s.story) ? s.story[0] : s.story
      const excerpt = extractStoryExcerpt(story?.content)
      return {
        id: s.id,
        title: story?.title ?? null,
        shared_at: s.shared_at,
        excerpt,
      }
    })
    const resourceResponses = resourceResponsesRaw.map(r => {
      const resource = Array.isArray(r.resource) ? r.resource[0] : r.resource
      return {
        id: r.id,
        resource_title: resource?.title ?? null,
        resource_type: resource?.type ?? null,
        status: r.status,
        submitted_at: r.submitted_at,
        answers_summary: summariseResponseAnswers(r.answers),
      }
    })
    const bookings = bookingsRaw

    const hasData = sessions.length > 0 || notes.length > 0 || milestones.length > 0 || !!aboutText

    if (!hasData) {
      return NextResponse.json({
        error: 'Not enough data to generate a summary. Add sessions, notes, or goals first.',
        code: 'INSUFFICIENT_DATA',
      }, { status: 400 })
    }

    // Build context for the prompt
    const context: SummaryContext = {
      member,
      aboutText,
      sessions,
      notes,
      milestones,
      reflections,
      sharedResources: sharedResources.map(r => {
        // Handle both array and object shapes from Supabase
        const resource = Array.isArray(r.resource) ? r.resource[0] : r.resource
        return {
          id: r.id,
          shared_at: r.shared_at,
          viewed_at: r.viewed_at,
          resource: resource ? { title: resource.title, type: resource.type } : undefined,
        }
      }),
      milestoneComments,
      sharedMoments,
      patientStories,
      resourceResponses,
      bookings,
      locale,
    }

    // Initialize Anthropic client (used by both file extraction and synthesis)
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Extract patient files (cache-aware: only re-runs on new/changed files)
    const fileExtractions = await extractAllMemberFiles(supabase, anthropic, memberId)
    const fileContextBlock = formatExtractionsForPrompt(fileExtractions)

    // Build prompts
    const systemPrompt = getSummarySystemPrompt(locale)
    let userPrompt = buildSummaryPrompt(context)
    if (fileContextBlock) {
      userPrompt = `${userPrompt}\n\n${fileContextBlock}`
    }

    // Build data-sources manifest (transparency: practitioner can see exactly what was fed in)
    const dataSources = {
      sessions: sessions.length,
      notes: notes.length,
      milestones: milestones.length,
      reflections: reflections.length,
      sharedResources: sharedResources.length,
      milestoneComments: milestoneComments.length,
      sharedMoments: sharedMoments.length,
      patientStories: patientStories.length,
      resourceResponses: resourceResponses.length,
      bookings: bookings.length,
      files: fileExtractions.map(e => ({
        id: e.fileId,
        name: e.fileName,
        status: e.status, // 'done' | 'cached' | 'skipped' | 'failed'
        error: e.error,
      })),
      filesIndexed: fileExtractions.filter(e => e.status === 'done' || e.status === 'cached').length,
      filesFailed: fileExtractions.filter(e => e.status === 'failed').length,
      filesSkipped: fileExtractions.filter(e => e.status === 'skipped').length,
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Extract response text
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Parse JSON response
    let summaryContent: SummaryContent
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      summaryContent = JSON.parse(jsonMatch[0])

      // Validate required fields
      if (!summaryContent.current_status || !Array.isArray(summaryContent.progress_highlights)) {
        throw new Error('Invalid summary structure')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', responseText)
      return NextResponse.json({
        error: 'Failed to generate structured summary. Please try again.',
        code: 'PARSE_ERROR',
      }, { status: 500 })
    }

    // Citation validation — drop any source IDs the model invented.
    // Build a set of valid IDs per source type so we can filter cited sources.
    if (summaryContent.v2) {
      const validIds: Record<string, Set<string>> = {
        session: new Set(sessions.map(s => s.id)),
        note: new Set(notes.map(n => n.id)),
        milestone: new Set(milestones.map(m => m.id)),
        file: new Set(fileExtractions.filter(e => e.summary).map(e => e.fileId)),
      }
      const localeStr = locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US'
      const shortDate = (iso: string | null | undefined) => {
        if (!iso) return ''
        try {
          return new Date(iso).toLocaleDateString(localeStr, { month: 'short', day: 'numeric' })
        } catch { return '' }
      }
      // For notes, prefer the linked session's date (what practitioners
      // anchor on) over the note's created_at (the timestamp the row was
      // written — drifts from the session date when notes get edited or
      // backfilled, which made citations show dates with no session).
      const sessionDateById = new Map(sessions.map(s => [s.id, s.scheduled_at]))
      const labelLookup: Record<string, Map<string, string>> = {
        session: new Map(sessions.map(s => [s.id, `${locale === 'fr' ? 'Séance' : locale === 'es' ? 'Sesión' : 'Session'} ${shortDate(s.scheduled_at)}`.trim()])),
        note: new Map(notes.map(n => {
          const anchor = (n.session_id && sessionDateById.get(n.session_id)) || n.created_at
          return [n.id, `${locale === 'fr' ? 'Note' : 'Note'} ${shortDate(anchor)}`.trim()]
        })),
        milestone: new Map(milestones.map(m => [m.id, m.title || (locale === 'fr' ? 'Objectif' : 'Goal')])),
        file: new Map(fileExtractions.filter(e => e.summary).map(e => [e.fileId, e.fileName])),
      }
      const validateSources = (sources: unknown): Array<{ type: string; id: string; label?: string }> | undefined => {
        if (!Array.isArray(sources)) return undefined
        const cleaned = sources
          .filter((s): s is { type: string; id: string } =>
            !!s && typeof s === 'object' && 'type' in s && 'id' in s &&
            typeof (s as { type: unknown }).type === 'string' &&
            typeof (s as { id: unknown }).id === 'string'
          )
          .filter(s => validIds[s.type]?.has(s.id))
          .slice(0, 4)
          .map(s => ({
            type: s.type,
            id: s.id,
            label: labelLookup[s.type]?.get(s.id),
          }))
        return cleaned.length > 0 ? cleaned : undefined
      }
      const cleanItems = <T extends { sources?: unknown }>(items: T[] | undefined): T[] | undefined => {
        if (!Array.isArray(items)) return items
        return items.map(item => ({ ...item, sources: validateSources(item.sources) })) as T[]
      }
      summaryContent.v2.themes = cleanItems(summaryContent.v2.themes) || []
      summaryContent.v2.highlights = cleanItems(summaryContent.v2.highlights) || []
      summaryContent.v2.attention = cleanItems(summaryContent.v2.attention) || []
      summaryContent.v2.recommendations = cleanItems(summaryContent.v2.recommendations) || []
    }

    // Generate plain text version
    const summaryText = generatePlainTextSummary(summaryContent, locale)

    // Store summary in database (data sources included in summary_content JSONB).
    // _meta.version lets the UI flag prior-version summaries with an
    // "Updated version available" banner (see lib/bloom/pulse-version).
    const summaryContentWithSources = {
      ...summaryContent,
      _data_sources: dataSources,
      _meta: { version: PULSE_VERSION },
    }

    const { data: savedSummary, error: saveError } = await supabase
      .from('member_summaries')
      .insert({
        member_id: memberId,
        practitioner_id: user.id,
        summary_content: summaryContentWithSources,
        summary_text: summaryText,
        model_used: response.model,
        tokens_used: response.usage.output_tokens,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save summary:', saveError)
      // Still return the summary even if saving failed
      return NextResponse.json({
        summary: {
          id: null,
          summary_content: summaryContentWithSources,
          summary_text: summaryText,
          generated_at: new Date().toISOString(),
          model_used: response.model,
          tokens_used: response.usage.output_tokens,
        },
        dataSources,
        warning: 'Summary generated but failed to save to history',
      })
    }

    return NextResponse.json({
      summary: savedSummary,
      dataSources,
    })
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating the summary' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/members/[id]/summary
 * Get the latest summary or summary history for a member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params
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

    // Check query params
    const { searchParams } = new URL(request.url)
    const history = searchParams.get('history') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Verify practitioner owns this member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('practitioner_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (history) {
      // Return summary history
      const { data: summaries, error: summariesError } = await supabase
        .from('member_summaries')
        .select('id, summary_content, summary_text, generated_at, model_used, tokens_used')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(limit)

      if (summariesError) {
        console.error('Failed to fetch summaries:', summariesError)
        return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 })
      }

      return NextResponse.json({ summaries })
    } else {
      // Return latest summary only
      const { data: summary, error: summaryError } = await supabase
        .from('member_summaries')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Failed to fetch summary:', summaryError)
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
      }

      // Compute delta: count of events since the latest Pulse generation
      let delta: { total: number; breakdown: Record<string, number>; sinceDate: string | null } | null = null
      if (summary) {
        const since = summary.generated_at
        // Need the member's auth uid to look up moments (keyed by
        // user_id, not member_id). Already fetched above for the
        // generation path but we re-read here to keep this branch
        // self-contained.
        const { data: memberRowForDelta } = await supabase
          .from('members')
          .select('user_id')
          .eq('id', memberId)
          .single()
        const memberUserId = memberRowForDelta?.user_id || null

        const [
          sessionsCount,
          notesCount,
          milestonesCount,
          reflectionsCount,
          filesCount,
          storyShareCount,
          storyCommentCount,
          resourceResponsesCount,
          bookingsCount,
          momentsSharedCount,
          momentCommentsCount,
        ] = await Promise.all([
          supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('created_at', since),
          supabase.from('progress_notes').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('created_at', since),
          supabase.from('milestones').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('updated_at', since),
          supabase.from('member_reflections').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gt('created_at', since),
          supabase.from('member_files').select('id', { count: 'exact', head: true }).eq('member_id', memberId).or('is_folder.is.null,is_folder.eq.false').gt('created_at', since),
          supabase.from('story_shares').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('shared_at', since),
          supabase.from('story_share_comments').select('id', { count: 'exact', head: true }).eq('author_type', 'member').gt('created_at', since),
          supabase.from('resource_responses').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gt('updated_at', since),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('created_at', since),
          memberUserId
            ? supabase.from('moments').select('id', { count: 'exact', head: true }).eq('user_id', memberUserId).gt('shared_with_practitioner_at', since)
            : Promise.resolve({ count: 0 } as { count: number }),
          memberUserId
            ? supabase.from('moment_comments').select('id', { count: 'exact', head: true }).eq('author_type', 'member').gt('created_at', since)
            : Promise.resolve({ count: 0 } as { count: number }),
        ])

        const breakdown = {
          sessions: sessionsCount.count || 0,
          notes: notesCount.count || 0,
          milestones: milestonesCount.count || 0,
          reflections: reflectionsCount.count || 0,
          files: filesCount.count || 0,
          stories: storyShareCount.count || 0,
          comments: storyCommentCount.count || 0,
          responses: resourceResponsesCount.count || 0,
          bookings: bookingsCount.count || 0,
          moments: momentsSharedCount.count || 0,
          momentComments: momentCommentsCount.count || 0,
        }
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
        delta = { total, breakdown, sinceDate: since }
      }

      // ─── Mood timeline (last 84 days = 12 weeks) ──────────────────
      const ninetyDaysAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString()
      const { data: moodRows } = await supabase
        .from('member_reflections')
        .select('mood_value, created_at')
        .eq('member_id', memberId)
        .gte('created_at', ninetyDaysAgo)
        .not('mood_value', 'is', null)
        .order('created_at', { ascending: true })
      const moodTimeline = (moodRows || []).map(r => ({
        date: r.created_at,
        mood: r.mood_value as number,
      }))

      // ─── Since last completed session ───────────────────────────────
      let sinceLastSession: {
        lastSessionDate: string | null
        lastSessionId: string | null
        breakdown: Record<string, number>
        total: number
      } | null = null
      const { data: lastSession } = await supabase
        .from('sessions')
        .select('id, scheduled_at')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .eq('status', 'completed')
        .lt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastSession) {
        const sinceTs = lastSession.scheduled_at
        const [
          newNotes,
          newReflections,
          newFiles,
          newComments,
          newResponses,
          newMilestones,
        ] = await Promise.all([
          supabase.from('progress_notes').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('created_at', sinceTs),
          supabase.from('member_reflections').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gt('created_at', sinceTs),
          supabase.from('member_files').select('id', { count: 'exact', head: true }).eq('member_id', memberId).or('is_folder.is.null,is_folder.eq.false').gt('created_at', sinceTs),
          supabase.from('story_share_comments').select('id', { count: 'exact', head: true }).eq('author_type', 'member').gt('created_at', sinceTs),
          supabase.from('resource_responses').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gt('updated_at', sinceTs),
          supabase.from('milestones').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('practitioner_id', user.id).gt('updated_at', sinceTs),
        ])
        const breakdown = {
          notes: newNotes.count || 0,
          reflections: newReflections.count || 0,
          files: newFiles.count || 0,
          comments: newComments.count || 0,
          responses: newResponses.count || 0,
          milestones: newMilestones.count || 0,
        }
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
        sinceLastSession = {
          lastSessionDate: sinceTs,
          lastSessionId: lastSession.id,
          breakdown,
          total,
        }
      }

      // ─── Upcoming session (within next 24h) for pre-session brief mode ────
      const now = new Date()
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      let upcomingSession: {
        id: string
        scheduled_at: string
        session_type: string
        session_format: string | null
        minutesUntil: number
      } | null = null
      const { data: nextSession } = await supabase
        .from('sessions')
        .select('id, scheduled_at, session_type, session_format')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .in('status', ['scheduled', 'confirmed'])
        .gt('scheduled_at', now.toISOString())
        .lt('scheduled_at', in24h)
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (nextSession) {
        const minutesUntil = Math.round((new Date(nextSession.scheduled_at).getTime() - now.getTime()) / 60000)
        upcomingSession = {
          id: nextSession.id,
          scheduled_at: nextSession.scheduled_at,
          session_type: nextSession.session_type,
          session_format: nextSession.session_format,
          minutesUntil,
        }
      }

      return NextResponse.json({
        summary: summary || null,
        delta,
        moodTimeline,
        sinceLastSession,
        upcomingSession,
      })
    }
  } catch (error) {
    console.error('Summary fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the summary' },
      { status: 500 }
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

// stories.content is JSONB — usually an array of {type, content:{text}}
// blocks. Walk it, collect any text strings, return the first ~400
// chars. Robust to legacy plain-string or wrapped-object shapes.
function extractStoryExcerpt(content: unknown): string | null {
  if (!content) return null
  let blocks: unknown[] = []
  if (Array.isArray(content)) blocks = content
  else if (typeof content === 'string') return content.trim().slice(0, 400) || null
  else if (typeof content === 'object' && content !== null) {
    const maybe = (content as { blocks?: unknown[] }).blocks
    if (Array.isArray(maybe)) blocks = maybe
  }
  const parts: string[] = []
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue
    const block = b as { type?: string; content?: { text?: string } }
    const text = block.content?.text
    if (typeof text === 'string' && text.trim()) parts.push(text.trim())
    if (parts.join(' ').length > 400) break
  }
  const joined = parts.join(' · ').trim()
  return joined.length > 0 ? joined.slice(0, 400) : null
}

// resource_responses.answers is JSONB — shape varies by resource type.
// We don't try to render every block here; just emit a compact
// "question: answer" digest so the model gets the gist without
// dragging the prompt over the token cliff.
function summariseResponseAnswers(answers: unknown): string | null {
  if (!answers || typeof answers !== 'object') return null
  const obj = answers as Record<string, unknown>
  const lines: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    let v: string
    if (value === null || value === undefined) v = '—'
    else if (Array.isArray(value)) v = value.map(x => String(x)).join(', ')
    else if (typeof value === 'object') {
      const o = value as Record<string, unknown>
      if (typeof o.value !== 'undefined') v = String(o.value)
      else v = JSON.stringify(o)
    } else {
      v = String(value)
    }
    lines.push(`${key}: ${v.slice(0, 120)}`)
    if (lines.join(' · ').length > 280) break
  }
  return lines.length > 0 ? lines.join(' · ').slice(0, 320) : null
}
