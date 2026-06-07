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

  let affirmations: string[] = pick(base, count) // curated fallback
  let source: 'ai' | 'curated' = 'curated'

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const system = [
        'You write short, personal affirmations for a mental-health app — like a warm, grounded friend speaking gently to someone, not a generic quote generator.',
        'Voice:',
        '- Sound human and intimate, the way a close friend would reassure you. Specific, not clichéd.',
        '- Vary the phrasing: some lines can speak TO them ("You\'ve carried a lot today"), some can be theirs to say ("I can let today be enough"). Avoid every line starting "I am".',
        `- Speak to what they shared: theme = "${theme}", what would help = "${tone}".`,
        firstName ? `- Use their name ("${firstName}") naturally in ONE line, like a friend would.` : '- Don\'t invent a name.',
        'Hard rules:',
        '- Warm, present tense, short (max ~14 words). No advice, instructions, diagnoses, toxic positivity, or promises that everything will be fine.',
        `- Write in ${locale === 'fr' ? 'French' : 'English'}.`,
        '- Stay in the spirit of the example lines below (same gentle, safe meaning) but make them feel freshly written for this person.',
        `- Return ONLY a JSON array of ${count} strings. No preamble, no extra keys.`,
      ].join('\n')

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        temperature: 0.9,
        system,
        messages: [{ role: 'user', content: `Example affirmations to stay in the spirit of:\n${JSON.stringify(base)}\n\nWrite ${count} fresh, personal lines for this person.` }],
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
