import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import Anthropic from '@anthropic-ai/sdk'

/**
 * POST /api/resources/convert-pdf
 *
 * Receives PDF pages as base64 images, sends them to Claude Vision,
 * and returns a structured blocks array for the worksheet builder.
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
    const { pages, language } = body as { pages: string[]; language?: string }

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'No PDF pages provided' }, { status: 400 })
    }

    // Limit to 20 pages
    const limitedPages = pages.slice(0, 20)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are converting a practitioner's PDF document into an interactive exercise for their patients. You must output ONLY valid JSON — no markdown, no explanation, no code fences.

Output format:
{
  "title": "Exercise title",
  "description": "Short description",
  "blocks": [...]
}

Available block types:

CONTENT BLOCKS:
- {"id": "unique", "type": "heading", "content": "Section Title"}
- {"id": "unique", "type": "paragraph", "content": "Educational text..."}
- {"id": "unique", "type": "tip", "content": "Helpful advice..."}
- {"id": "unique", "type": "quote", "content": "Quote text", "author": "Author name"}

QUESTION BLOCKS:
- {"id": "unique", "type": "prompt", "content": "Open-ended question?", "required": true}
- {"id": "unique", "type": "multiple_choice", "content": "Choose one:", "options": ["A", "B", "C"], "required": true}
- {"id": "unique", "type": "checklist", "content": "Select all that apply:", "options": ["A", "B", "C"]}
- {"id": "unique", "type": "yes_no", "content": "True or false statement?"}
- {"id": "unique", "type": "scale", "content": "Rate 1-10:", "min": 1, "max": 10}
- {"id": "unique", "type": "likert", "content": "How do you feel?", "options": [{"label": "Not at all", "value": 1}, {"label": "Somewhat", "value": 2}, {"label": "Very much", "value": 3}]}
- {"id": "unique", "type": "list_input", "content": "List 3 things:"}

INTERACTIVE BLOCKS:
- {"id": "unique", "type": "matching_pairs", "content": "Match the items:", "pairs": [{"left": "Term", "right": "Definition"}, ...]}
- {"id": "unique", "type": "flashcard", "content": "Review:", "cards": [{"front": "Question", "back": "Answer"}, ...]}
- {"id": "unique", "type": "fill_blank", "content": "Complete:", "sentence": "Text with {0} blanks {1}", "blanks": [{"index": 0, "answer": "correct", "options": ["correct", "wrong1", "wrong2"]}, ...]}
- {"id": "unique", "type": "ordering", "content": "Put in order:", "items": ["First", "Second", "Third"], "correctOrder": [0, 1, 2]}

GUIDELINES:
- Keep the ORIGINAL language of the PDF (${language || 'auto-detect'})
- Educational content → heading + paragraph + tip
- Vocabulary/term pairs → matching_pairs
- Key concepts to memorize → flashcard
- Step-by-step processes → ordering
- Reflection/open questions → prompt
- Self-assessment → scale or likert
- Selection exercises → multiple_choice or checklist
- Fill-in exercises → fill_blank
- Generate 5-15 interactive blocks maximum
- Every block must have a unique "id" (use "b1", "b2", etc.)
- Alternate between content blocks and interactive blocks
- Make it engaging — not just a form, but an interactive experience`

    // Build the message with PDF page images
    const imageContent: Anthropic.Messages.ContentBlockParam[] = limitedPages.map((pageBase64, i) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/png' as const,
        data: pageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    }))

    imageContent.push({
      type: 'text' as const,
      text: 'Convert this PDF document into an interactive exercise. Output ONLY the JSON object with title, description, and blocks array. No markdown, no explanation.',
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: imageContent }],
    })

    // Extract JSON from response
    const responseText = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Parse JSON — handle potential markdown code fences
    let parsed
    try {
      const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('[convert-pdf] Failed to parse Claude response:', responseText.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json({
      title: parsed.title || 'Imported Exercise',
      description: parsed.description || '',
      blocks: parsed.blocks || [],
    })
  } catch (err) {
    console.error('[convert-pdf] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to convert PDF' },
      { status: 500 }
    )
  }
}
