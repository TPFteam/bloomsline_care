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
    const { pages, language, length, customPrompt } = body as {
      pages: string[]
      language?: string
      length?: 'short' | 'medium' | 'long'
      customPrompt?: string
    }

    const blockRange = length === 'short' ? '5-7' : length === 'long' ? '13-18' : '8-12'

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'No PDF pages provided' }, { status: 400 })
    }

    // Limit to 40 pages
    const limitedPages = pages.slice(0, 40)

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are extracting fillable questions from a practitioner's PDF document. You must output ONLY valid JSON — no markdown, no explanation, no code fences.

CRITICAL RULES:
- DO NOT invent questions. Only extract questions that EXPLICITLY EXIST in the PDF.
- Copy question text VERBATIM from the document — do not rephrase.
- Keep the ORIGINAL language of the PDF. Do not translate.
- If NO fillable questions are found, return: {"title": "...", "description": "...", "blocks": [], "noQuestions": true}

Output format:
{
  "title": "Document title (from the PDF)",
  "description": "Short description",
  "blocks": [...],
  "noQuestions": false
}

How to identify question types in the PDF:
- Question text followed by blank/dotted lines → {"id": "b1", "type": "prompt", "content": "exact question text?", "required": true}
- Numbered options with circles/bullets → {"id": "b2", "type": "multiple_choice", "content": "exact question?", "options": ["Option A", "Option B", "Option C"], "required": true}
- Checkboxes with options → {"id": "b3", "type": "checklist", "content": "exact instruction text:", "options": ["Item 1", "Item 2"]}
- Yes/No or True/False → {"id": "b4", "type": "yes_no", "content": "exact statement?"}
- Rating scales (1-5, 1-10, etc.) → {"id": "b5", "type": "scale", "content": "exact question?", "min": 1, "max": 10}
- "List X things" with blank spaces → {"id": "b6", "type": "list_input", "content": "exact instruction text"}
- Section titles above questions → {"id": "b7", "type": "heading", "content": "exact section title"}
- Instructional paragraphs above questions → {"id": "b8", "type": "paragraph", "content": "exact text"}

Every block must have a unique "id" (use "b1", "b2", etc.).
IMPORTANT:
- Extract ALL questions from ALL pages — do not stop after a few.
- Scan the ENTIRE document from first page to last.
- Extract questions IN ORDER as they appear in the document.
- If the document has 20 questions, output all 20. If it has 5, output 5.`

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
      text: 'Extract ALL fillable questions from this entire PDF document. Scan EVERY page. Output ONLY the JSON object with title, description, and blocks array. No markdown, no explanation.',
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

      // Try direct parse first
      try {
        parsed = JSON.parse(jsonStr)
      } catch {
        // If truncated mid-JSON, try to recover by closing open structures
        // Find last complete block entry (ends with "}")
        const lastCompleteBlock = jsonStr.lastIndexOf('}')
        if (lastCompleteBlock > 0) {
          let recovered = jsonStr.slice(0, lastCompleteBlock + 1)
          // Close the blocks array and root object if needed
          if (!recovered.endsWith(']}')) {
            if (!recovered.endsWith(']')) recovered += ']'
            if (!recovered.endsWith('}')) recovered += '}'
          }
          parsed = JSON.parse(recovered)
          console.log('[convert-pdf] Recovered truncated JSON — some questions may be missing')
        } else {
          throw new Error('Cannot recover truncated JSON')
        }
      }
    } catch (parseErr) {
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
