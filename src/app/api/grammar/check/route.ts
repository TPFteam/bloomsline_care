import { NextRequest, NextResponse } from 'next/server'

// PROTOTYPE grammar-check proxy. Routes note text to a LanguageTool instance.
//
// PRIVACY: notes are clinical (PHI). Set LANGUAGETOOL_URL to a SELF-HOSTED
// LanguageTool (e.g. the `erikvl87/languagetool` Docker image) so text never
// leaves your infra. The public default below sends text to LanguageTool's
// cloud — acceptable only for local prototyping with non-real data. The feature
// is OFF by default (see GrammarOverlay) so nothing is sent unless enabled.
const LT_BASE = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org'
// Shared secret for a locked-down self-hosted instance (sent as a Bearer
// header; the reverse proxy in front of LanguageTool enforces it).
const LT_TOKEN = process.env.LANGUAGETOOL_TOKEN || ''

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json()
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ matches: [] })
    }
    if (text.length > 40000) {
      return NextResponse.json({ matches: [], error: 'text too long' })
    }

    const params = new URLSearchParams()
    params.set('text', text)
    params.set('language', language || 'auto')

    const res = await fetch(`${LT_BASE}/v2/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(LT_TOKEN ? { Authorization: `Bearer ${LT_TOKEN}` } : {}),
      },
      body: params.toString(),
      // LanguageTool can be slow on long text; cap it.
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json({ matches: [], error: `languagetool ${res.status}` })
    }

    const data = await res.json()
    const matches = (data.matches || []).map((m: any) => ({
      offset: m.offset,
      length: m.length,
      message: m.message,
      shortMessage: m.shortMessage || '',
      replacements: (m.replacements || []).slice(0, 6).map((r: any) => r.value),
      issueType: m.rule?.issueType || 'misc',
      category: m.rule?.category?.name || '',
    }))

    return NextResponse.json({ matches })
  } catch (e: any) {
    return NextResponse.json({ matches: [], error: String(e?.message || e) })
  }
}
