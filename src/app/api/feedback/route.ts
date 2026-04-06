import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

const typeToPriority: Record<string, string> = {
  bug: 'High',
  feature: 'Medium',
  question: 'Low',
}

const typeToNotionType: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature request',
  question: 'Question',
}

async function uploadImageToSupabase(base64: string, name: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    const base64Data = base64.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    const mimeMatch = base64.match(/data:image\/(\w+);/)
    const ext = mimeMatch ? mimeMatch[1] : 'png'
    const fileName = `feedback/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    const { error } = await supabase.storage
      .from('feedback-screenshots')
      .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: false })

    if (error) {
      // Bucket might not exist — try creating it
      if (error.message?.includes('not found')) {
        await supabase.storage.createBucket('feedback-screenshots', { public: true })
        const { error: retryError } = await supabase.storage
          .from('feedback-screenshots')
          .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: false })
        if (retryError) {
          console.error('Upload retry failed:', retryError)
          return null
        }
      } else {
        console.error('Upload failed:', error)
        return null
      }
    }

    const { data: urlData } = supabase.storage.from('feedback-screenshots').getPublicUrl(fileName)
    return urlData.publicUrl
  } catch (err) {
    console.error('Image upload error:', err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
      console.error('Notion API not configured')
      return NextResponse.json(
        { error: 'Feedback service not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { type, subject, description, userEmail, userName, images } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // Build rich text content blocks
    const children: any[] = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: description } }],
        },
      },
      {
        object: 'block',
        type: 'divider',
        divider: {},
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: `${userName || 'Anonymous'}${userEmail ? ` · ${userEmail}` : ''}` }, annotations: { color: 'gray', italic: true } },
          ],
        },
      },
    ]

    // Upload images to Supabase and embed in Notion
    if (images && images.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: 'Screenshots' } }],
        },
      })

      for (const image of images) {
        const publicUrl = await uploadImageToSupabase(image.base64, image.name || 'screenshot')
        if (publicUrl) {
          children.push({
            object: 'block',
            type: 'image',
            image: {
              type: 'external',
              external: { url: publicUrl },
            },
          })
        }
      }
    }

    // Create page in Notion database
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          'Issue': {
            title: [{ text: { content: `[${type.toUpperCase()}] ${subject}` } }],
          },
          'Type': {
            multi_select: [{ name: typeToNotionType[type] || 'Question' }],
          },
          'Priority': {
            select: { name: typeToPriority[type] || 'Medium' },
          },
          'Source': {
            rich_text: [{ text: { content: 'In-App Feedback' } }],
          },
        },
        children,
      }),
    })

    if (!notionResponse.ok) {
      const errorData = await notionResponse.json()
      console.error('Notion API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }

    const page = await notionResponse.json()

    return NextResponse.json({
      success: true,
      ticketId: page.id,
    })

  } catch (error) {
    console.error('Error creating feedback ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
