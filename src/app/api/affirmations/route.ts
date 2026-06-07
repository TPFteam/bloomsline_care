/**
 * POST /api/affirmations — personalized affirmations for the mobile "For You"
 * tab. Hybrid: curated base lines (source of truth) lightly rephrased by Bloom
 * AI for the person. Falls back to the raw curated lines if the AI is
 * unavailable or its output looks wrong.
 *
 * Body: { topic, state, need?, firstName?, locale? }
 * Returns: { crisis: true } when the intake signals acute distress (the app
 * then shows crisis support instead), else { affirmations: string[], theme }.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { TOPIC_TO_THEME, NEED_TO_TONE, baseAffirmations, type AffirmationLocale } from '@/lib/affirmations/bank'

// The intake "state" answer that means "I'm really struggling" — deterministic
// crisis trigger (no NLP needed). The app should also route on this locally.
const CRISIS_STATE = 'struggling'

function pick<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n)
}

export async function POST(request: NextRequest) {
  // Rate limit (AI is the expensive path).
  const clientId = getClientIdentifier(request)
  const rl = checkRateLimit(clientId, RATE_LIMITS.expensive)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: getRateLimitHeaders(rl) })
  }

  // Require a valid session (mobile sends a Bearer token).
  const admin = createAdminClient()
  const authHeader = request.headers.get('authorization')
  let userId: string | null = null
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await admin.auth.getUser(authHeader.slice(7))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const topic = String(body?.topic || 'not_sure')
  const state = String(body?.state || '')
  const need = String(body?.need || '')
  const firstName = (body?.firstName ? String(body.firstName).trim() : '').slice(0, 40)
  const locale: AffirmationLocale = body?.locale === 'fr' ? 'fr' : 'en'

  // Safety: acute distress → don't affirm, tell the app to show crisis support.
  if (state === CRISIS_STATE) {
    return NextResponse.json({ crisis: true })
  }

  const theme = TOPIC_TO_THEME[topic] || 'general'
  const base = baseAffirmations(theme, locale)
  const tone = (NEED_TO_TONE[need]?.[locale]) || (locale === 'fr' ? 'doux et bienveillant' : 'gentle and warm')

  // A fresh number of lines each session (5–8) so it feels alive.
  const count = 5 + Math.floor(Math.random() * 4)

  // ── Personalization context (abstracted, privacy-safe) ──────────────
  // Recent moods — labels only, never raw moment/journal text.
  let recentMoods: string[] = []
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: moments } = await admin
      .from('moments')
      .select('moods')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50)
    const counts: Record<string, number> = {}
    for (const m of (moments || []) as Array<{ moods: string[] | null }>) {
      for (const mood of (m.moods || [])) counts[mood] = (counts[mood] || 0) + 1
    }
    recentMoods = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k)
  } catch { /* moods are optional context */ }

  // Time of day from the app's local hour — a small human touch.
  const hourRaw = Number(body?.hour)
  const hour = Number.isFinite(hourRaw) ? ((hourRaw % 24) + 24) % 24 : null
  const partOfDay = hour === null ? null
    : hour < 5 ? 'late at night'
    : hour < 12 ? 'morning'
    : hour < 18 ? 'afternoon'
    : hour < 22 ? 'evening'
    : 'late evening'

  // Recent lines to avoid echoing (continuity without repetition).
  let recentLines: string[] = []
  try {
    const { data: hist } = await admin
      .from('affirmation_history')
      .select('affirmations')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)
    recentLines = (hist || []).flatMap((h: { affirmations: string[] | null }) => h.affirmations || []).slice(0, 12)
  } catch { /* optional */ }

  let affirmations: string[] = pick(base, count) // curated fallback
  let source: 'ai' | 'curated' = 'curated'

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const system = [
        'Write short, simple affirmations for a wellbeing app — like a kind friend sending a few words. Plain, everyday language.',
        'Make it feel personal — these should land like they were written for THIS person right now, not generic quotes.',
        'Keep it simple:',
        '- Ordinary words only. No poetic, flowery, grand, clever, or "beautiful" language.',
        '- Short and calm, like a text from a friend (max ~12 words each).',
        '- Mix it up: some lines speak to them ("You did your best today"), some are theirs to say ("I can take this slowly"). Do not start every line with "I am".',
        firstName ? `- You may use their first name ("${firstName}") in one line, casually.` : '- Do not use any name.',
        'What you know about them (use it to feel personal, gently):',
        `- Right now they want help with: ${theme}; what would help: ${tone}.`,
        recentMoods.length ? `- Lately they've mostly felt: ${recentMoods.join(', ')}. Let a couple of lines quietly meet that — plainly, WITHOUT naming it as a diagnosis or explaining why they feel it.` : '',
        partOfDay ? `- It's ${partOfDay} for them — you may let that gently colour one line.` : '',
        'Respect the therapeutic frame — these are gentle reminders, NOT therapy:',
        '- No advice, instructions, interpretations, diagnoses, or analysis of the person.',
        '- No claims about their progress, healing, their past, or what they should do or feel.',
        '- No promises that things will be okay. No spiritual, mystical, or weird statements.',
        recentLines.length ? `- Do NOT reuse or closely echo these recent lines: ${JSON.stringify(recentLines)}.` : '',
        `- Write in ${locale === 'fr' ? 'French' : 'English'}.`,
        `- Return ONLY a JSON array of ${count} short strings. Nothing else.`,
      ].filter(Boolean).join('\n')

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        temperature: 0.7,
        system,
        messages: [{ role: 'user', content: `Examples to stay close to in tone and meaning:\n${JSON.stringify(base)}\n\nWrite ${count} simple, plain lines for this person.` }],
      })
      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('').trim()
      const jsonStart = text.indexOf('[')
      const jsonEnd = text.lastIndexOf(']')
      const parsed = jsonStart >= 0 && jsonEnd > jsonStart ? JSON.parse(text.slice(jsonStart, jsonEnd + 1)) : null
      const cleaned = Array.isArray(parsed)
        ? parsed.map((s) => String(s).trim()).filter((s) => s.length > 0 && s.length <= 140).slice(0, count)
        : []
      if (cleaned.length >= 3) { affirmations = cleaned; source = 'ai' }
    } catch (e) {
      console.warn('affirmations AI failed, using curated fallback:', e)
    }
  }

  // Store the session (best-effort — don't fail the response on a write error).
  try {
    await admin.from('affirmation_history').insert({
      user_id: userId, theme, topic, state, need, locale, affirmations, source,
    })
  } catch (e) {
    console.warn('affirmation_history insert failed:', e)
  }

  return NextResponse.json({ affirmations, theme })
}
