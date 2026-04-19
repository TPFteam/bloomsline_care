import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/resources/convert-pdf
 *
 * Receives PDF pages as base64 images, sends them to Claude Vision,
 * and returns structured sections (reading pages + question blocks)
 * interleaved in document order.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { pages, language } = body as {
      pages: string[]
      language?: string
    }

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'No PDF pages provided' }, { status: 400 })
    }

    // Limit to 40 pages
    const limitedPages = pages.slice(0, 40)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are analyzing a practitioner's PDF document. You must output ONLY valid JSON — no markdown, no explanation, no code fences.

Your job is to split the document into SECTIONS in order. Each section is either:
1. **reading** — pages that contain explanatory text, instructions, theory, diagrams (no fillable questions)
2. **questions** — a group of fillable questions extracted from the page(s)

CRITICAL RULES:
- DO NOT invent questions. Only extract questions that EXPLICITLY EXIST in the PDF.
- Copy question text VERBATIM — do not rephrase.
- Keep the ORIGINAL language of the PDF. Do not translate.
- Pages are numbered starting from 1 (image 1 = page 1, image 2 = page 2, etc.)

Output format:
{
  "title": "Document title (from the PDF)",
  "description": "Short description",
  "sections": [
    { "type": "reading", "pages": [1, 2, 3], "label": "Introduction" },
    { "type": "questions", "startPage": 4, "blocks": [
      {"id": "b1", "type": "prompt", "content": "exact question?", "required": true},
      {"id": "b2", "type": "multiple_choice", "content": "exact question?", "options": ["A", "B", "C"]}
    ]},
    { "type": "reading", "pages": [5, 6], "label": "Section 2" },
    { "type": "questions", "startPage": 7, "blocks": [...] }
  ],
  "noQuestions": false
}

If the ENTIRE document is questions with no reading content, return a single questions section:
{ "title": "...", "description": "...", "sections": [{ "type": "questions", "startPage": 1, "blocks": [...] }], "noQuestions": false }

If NO questions are found at all:
{ "title": "...", "description": "...", "sections": [{ "type": "reading", "pages": [1,2,...], "label": "Full document" }], "noQuestions": true }

How to identify question types:
- Question text followed by blank/dotted lines → {"id": "b1", "type": "prompt", "content": "exact question text?", "required": true}
- Numbered options with circles/bullets → {"id": "b2", "type": "multiple_choice", "content": "exact question?", "options": ["Option A", "Option B", "Option C"], "required": true}
- Checkboxes with options → {"id": "b3", "type": "checklist", "content": "exact instruction text:", "options": ["Item 1", "Item 2"]}
- Yes/No or True/False → {"id": "b4", "type": "yes_no", "content": "exact statement?"}
- Rating scales (1-5, 1-10, etc.) → {"id": "b5", "type": "scale", "content": "exact question?", "min": 1, "max": 10}
- "List X things" with blank spaces → {"id": "b6", "type": "list_input", "content": "exact instruction text"}

Every block must have a unique "id" (use "b1", "b2", etc.).
DO NOT extract section titles, headings, instructional paragraphs, or explanatory text as blocks. ONLY extract fillable questions that require a response.

IMPORTANT:
- Scan the ENTIRE document from first page to last.
- Group CONSECUTIVE reading pages together into one reading section.
- Group CONSECUTIVE question pages together into one questions section.
- A page with BOTH reading content AND questions should be included in a questions section.
- Extract ALL questions — do not stop after a few.
- Sections must be in document order.`

    // Build the message with PDF page images — label each page
    const imageContent: Anthropic.Messages.ContentBlockParam[] = []
    limitedPages.forEach((pageBase64, i) => {
      imageContent.push({
        type: 'text' as const,
        text: `[Page ${i + 1}]`,
      })
      imageContent.push({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/png' as const,
          data: pageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      })
    })

    imageContent.push({
      type: 'text' as const,
      text: `This document has ${limitedPages.length} pages. Analyze ALL pages. Split into reading sections and question sections in order. Output ONLY the JSON object. No markdown, no explanation.`,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: imageContent }],
    })

    // Extract JSON from response
    const responseText = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Parse JSON — handle potential markdown code fences and truncation
    let parsed
    try {
      let jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      try {
        parsed = JSON.parse(jsonStr)
      } catch {
        // If truncated mid-JSON, try to recover
        const lastCompleteBlock = jsonStr.lastIndexOf('}')
        if (lastCompleteBlock > 0) {
          let recovered = jsonStr.slice(0, lastCompleteBlock + 1)
          if (!recovered.endsWith(']}')) {
            if (!recovered.endsWith(']')) recovered += ']'
            if (!recovered.endsWith('}')) recovered += '}'
          }
          parsed = JSON.parse(recovered)
          console.log('[convert-pdf] Recovered truncated JSON — some content may be missing')
        } else {
          throw new Error('Cannot recover truncated JSON')
        }
      }
    } catch (parseErr) {
      console.error('[convert-pdf] Failed to parse Claude response:', responseText.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Normalize: if old format (blocks array), convert to sections format
    if (parsed.blocks && !parsed.sections) {
      parsed.sections = [{ type: 'questions', startPage: 1, blocks: parsed.blocks }]
    }

    return NextResponse.json({
      title: parsed.title || 'Imported Exercise',
      description: parsed.description || '',
      sections: parsed.sections || [],
      noQuestions: parsed.noQuestions || false,
    })
  } catch (err) {
    console.error('[convert-pdf] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to convert PDF' },
      { status: 500 }
    )
  }
}
