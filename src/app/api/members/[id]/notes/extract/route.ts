import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server-client'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

const MAX_BASE64_SIZE = 4 * 1024 * 1024 // ~4MB

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * POST /api/members/[id]/notes/extract
 * Extract text from an image using Claude vision
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

    // Auth via Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting — same tier as assist
    const clientId = getClientIdentifier(request, user.id)
    const rateLimitResult = checkRateLimit(`extract:${clientId}`, RATE_LIMITS.assist)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // Parse body
    const body = await request.json().catch(() => ({}))
    const { imageBase64, mimeType, locale: rawLocale } = body

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    if (!mimeType || !VALID_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid or unsupported image type' }, { status: 400 })
    }

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: 'Image too large (max ~4MB)' }, { status: 400 })
    }

    const locale = ['en', 'fr', 'es'].includes(rawLocale) ? rawLocale : 'en'

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

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const extractionInstruction = locale === 'fr'
      ? 'Extrais tout le texte de cette image fidèlement. Si l\'image ne contient pas de texte significatif, réponds exactement : NOT_A_NOTE'
      : locale === 'es'
        ? 'Extrae todo el texto de esta imagen fielmente. Si la imagen no contiene texto significativo, responde exactamente: NOT_A_NOTE'
        : 'Extract all text from this image faithfully. If the image does not contain meaningful text, respond with exactly: NOT_A_NOTE'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: 'You are a document text extractor. Examine the image. If it contains handwritten notes, typed text, a screenshot of text, or any document — extract all text faithfully, preserving line breaks and structure. If the image does NOT contain meaningful text (e.g. a photo, artwork, diagram without text), respond with exactly: NOT_A_NOTE',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: extractionInstruction,
            },
          ],
        },
      ],
    })

    const extractedText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    const isNote = extractedText !== 'NOT_A_NOTE'

    return NextResponse.json({
      extractedText: isNote ? extractedText : '',
      isNote,
    })
  } catch (error) {
    console.error('Text extraction error:', error)
    return NextResponse.json(
      { error: 'An error occurred while extracting text' },
      { status: 500 }
    )
  }
}
