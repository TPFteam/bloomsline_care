import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

/**
 * POST /api/session-prep
 *
 * Minimalist pre-session orientation for the practitioner, generated from
 * their last 2-3 progress notes plus recent session history. Context and
 * reminders only — never advice, diagnosis, or suggestions about what to do
 * in the session (respects the therapeutic frame). Ephemeral (not persisted).
 *
 * Body: { memberId, sessionType?, startTime?, locale? }
 */

type Locale = 'en' | 'fr' | 'es'

const NOTE_LIMIT = 3
const LONG_GAP_DAYS = 60

function daysAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()

    // ── Auth (mobile/web sends a Bearer token) ──────────────────────────
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.slice(7))
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Rate limit (AI is the expensive path) ───────────────────────────
    const rl = checkRateLimit(getClientIdentifier(request, user.id), RATE_LIMITS.expensive)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rl) },
      )
    }

    const body = await request.json().catch(() => ({}))
    const memberId = String(body?.memberId || '')
    const sessionType = body?.sessionType ? String(body.sessionType) : ''
    const locale: Locale = ['en', 'fr', 'es'].includes(body?.locale) ? body.locale : 'en'
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    // ── Verify the practitioner owns this member ────────────────────────
    const { data: member } = await admin
      .from('members')
      .select('id, practitioner_id')
      .eq('id', memberId)
      .eq('practitioner_id', user.id)
      .single()
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    // ── Recent past sessions → edge cases, "last seen", session number ──
    const { data: pastData } = await admin
      .from('sessions')
      .select('status, scheduled_at')
      .eq('member_id', memberId)
      .eq('practitioner_id', user.id)
      .lt('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: false })
      .limit(12)

    const past = pastData || []
    const completed = past.filter((s) => s.status === 'completed')
    const sessionNumber = completed.length + 1
    const lastCompleted = completed[0] || null
    const mostRecentPast = past[0] || null

    let statusFlag: 'cancelled' | 'no_show' | 'long_gap' | 'first' | null = null
    if (completed.length === 0) {
      statusFlag = 'first'
    } else if (mostRecentPast?.status === 'cancelled') {
      statusFlag = 'cancelled'
    } else if (mostRecentPast?.status === 'no_show') {
      statusFlag = 'no_show'
    } else if (lastCompleted && daysAgo(lastCompleted.scheduled_at) > LONG_GAP_DAYS) {
      statusFlag = 'long_gap'
    }

    const header = {
      sessionNumber,
      sessionType,
      lastSeen: lastCompleted ? lastCompleted.scheduled_at : null,
      gapDays: lastCompleted ? daysAgo(lastCompleted.scheduled_at) : null,
    }

    // Last 3 sessions (date + status) — shown for quick orientation.
    const recentSessions = past.slice(0, 3).map((s) => ({ date: s.scheduled_at, status: s.status }))

    // ── Phase 2: between-session signals (abstracted, privacy-safe) ─────
    // Mood check-ins since the last session. Labels/aggregates only — never
    // raw journal text. Trend is scale-independent (recent half vs earlier).
    let betweenSessions: { checkIns: number; moodTrend: 'up' | 'down' | 'steady' | null; windowDays: number } | null = null
    try {
      const windowStartMs = Math.max(
        lastCompleted ? new Date(lastCompleted.scheduled_at).getTime() : 0,
        Date.now() - 30 * 86_400_000,
      )
      const { data: refl } = await admin
        .from('member_reflections')
        .select('mood_value, created_at')
        .eq('member_id', memberId)
        .gte('created_at', new Date(windowStartMs).toISOString())
        .order('created_at', { ascending: true })
        .limit(60)
      const list = refl || []
      if (list.length > 0) {
        const moods = list.map((r) => r.mood_value).filter((m): m is number => typeof m === 'number')
        let moodTrend: 'up' | 'down' | 'steady' | null = null
        if (moods.length >= 4) {
          const mid = Math.floor(moods.length / 2)
          const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length
          const earlier = avg(moods.slice(0, mid))
          const recent = avg(moods.slice(mid))
          moodTrend = recent > earlier + 0.001 ? 'up' : recent < earlier - 0.001 ? 'down' : 'steady'
        }
        betweenSessions = {
          checkIns: list.length,
          moodTrend,
          windowDays: Math.max(1, Math.round((Date.now() - windowStartMs) / 86_400_000)),
        }
      }
    } catch { /* reflections are optional context */ }

    // ── Last 2-3 notes ──────────────────────────────────────────────────
    const { data: notesData } = await admin
      .from('progress_notes')
      .select('title, content, created_at')
      .eq('member_id', memberId)
      .eq('practitioner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(NOTE_LIMIT)
    const notes = (notesData || []).filter((n) => String(n.content || '').trim().length > 0)

    // No notes → graceful, no AI call.
    if (notes.length === 0) {
      return NextResponse.json({
        header, statusFlag, recentSessions, betweenSessions,
        whereLeftOff: null, thread: [], toRevisit: null, notesUsed: 0, source: 'none',
      })
    }

    // ── Generate the orientation (notes only; context, not advice) ──────
    let whereLeftOff: string | null = null
    let thread: string[] = []
    let toRevisit: string | null = null
    let source: 'ai' | 'none' = 'none'

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const notesText = notes
          .map((n, i) => {
            const d = new Date(n.created_at).toISOString().slice(0, 10)
            return `Note ${i + 1} (${d}${n.title ? `, "${n.title}"` : ''}):\n${String(n.content).slice(0, 2000)}`
          })
          .join('\n\n')

        const langName = locale === 'fr' ? 'French' : locale === 'es' ? 'Spanish' : 'English'
        const system = [
          'You write a brief pre-session orientation for a therapist, drawn ONLY from their own recent session notes.',
          'Goal: in a few seconds, remind them where things stand before the patient walks in.',
          'Rules:',
          '- Summarize only what is in the notes. Never invent, infer beyond the notes, diagnose, or suggest what to do in the session.',
          '- Plain, factual, concise. No clinical jargon, no advice, no reassurance, no praise.',
          '- Speak about the patient in the third person.',
          `- Write in ${langName}.`,
          'Return ONLY a JSON object with exactly these keys:',
          '{"whereLeftOff": string (1-2 plain sentences on the last session\'s main theme),',
          ' "thread": string[] (2-4 very short recurring-theme tags, 1-3 words each),',
          ' "toRevisit": string|null (one concrete thing the notes say to follow up on, else null)}',
        ].join('\n')

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          temperature: 0.3,
          system,
          messages: [{ role: 'user', content: `Recent notes (newest first):\n\n${notesText}\n\nWrite the orientation JSON.` }],
        })
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('')
        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          whereLeftOff = typeof parsed.whereLeftOff === 'string' && parsed.whereLeftOff.trim() ? parsed.whereLeftOff.trim() : null
          thread = Array.isArray(parsed.thread)
            ? parsed.thread.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 4)
            : []
          toRevisit = parsed.toRevisit ? String(parsed.toRevisit).trim() : null
          source = 'ai'
        }
      } catch (e) {
        console.warn('session-prep AI failed:', e)
      }
    }

    return NextResponse.json({
      header, statusFlag, recentSessions, betweenSessions,
      whereLeftOff, thread, toRevisit, notesUsed: notes.length, source,
    })
  } catch (error) {
    console.error('session-prep error:', error)
    return NextResponse.json({ error: 'Failed to prepare session' }, { status: 500 })
  }
}
