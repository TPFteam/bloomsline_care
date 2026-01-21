import { NextRequest, NextResponse } from 'next/server'

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

// Map our types to HubSpot categories
const typeToCategory: Record<string, string> = {
  bug: 'BUG',
  feature: 'FEATURE_REQUEST',
  question: 'GENERAL_INQUIRY',
  other: 'GENERAL_INQUIRY',
}

export async function POST(request: NextRequest) {
  try {
    if (!HUBSPOT_ACCESS_TOKEN) {
      console.error('HUBSPOT_ACCESS_TOKEN not configured')
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

    // Upload images to HubSpot and get URLs
    const imageUrls: string[] = []
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          // Extract base64 data (remove data:image/xxx;base64, prefix)
          const base64Data = image.base64.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')

          // Determine file extension from base64 prefix
          const mimeMatch = image.base64.match(/data:image\/(\w+);/)
          const ext = mimeMatch ? mimeMatch[1] : 'png'
          const fileName = `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

          // Upload to HubSpot Files API
          const formData = new FormData()
          formData.append('file', new Blob([buffer]), fileName)
          formData.append('folderPath', '/feedback-attachments')
          formData.append('options', JSON.stringify({
            access: 'PUBLIC_INDEXABLE'
          }))

          const uploadResponse = await fetch('https://api.hubapi.com/files/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
            },
            body: formData,
          })

          if (uploadResponse.ok) {
            const fileData = await uploadResponse.json()
            console.log('Image uploaded successfully:', fileData.url)
            imageUrls.push(fileData.url)
          } else {
            const errorData = await uploadResponse.json()
            console.error('HubSpot file upload failed:', errorData)
          }
        } catch (uploadError) {
          console.error('Error uploading image to HubSpot:', uploadError)
        }
      }
    }

    // Build images section if any
    const imagesSection = imageUrls.length > 0
      ? `\n\nAttachments:\n${imageUrls.map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}`
      : ''

    // Build the ticket description with user info
    const fullDescription = `
${description}${imagesSection}

---
Submitted by: ${userName || 'Anonymous'} ${userEmail ? `(${userEmail})` : ''}
Type: ${type}
Source: In-App Feedback
    `.trim()

    // Create ticket in HubSpot
    // Using EU endpoint since the token is pat-eu1-*
    const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          subject: `[${type.toUpperCase()}] ${subject}`,
          content: fullDescription,
          hs_pipeline: '0', // Default pipeline
          hs_pipeline_stage: '1', // New/Open stage
          hs_ticket_priority: type === 'bug' ? 'HIGH' : 'MEDIUM',
          // Custom properties - create these in HubSpot first
          ...(userEmail && { submitter_email: userEmail }),
          ...(userName && { submitter_name: userName }),
          ticket_type: type, // bug, feature, or question
        },
      }),
    })

    if (!hubspotResponse.ok) {
      const errorData = await hubspotResponse.json()
      console.error('HubSpot API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }

    const ticket = await hubspotResponse.json()

    // If we have a user email, try to associate the ticket with a contact
    if (userEmail) {
      try {
        // Search for existing contact
        const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: userEmail,
              }],
            }],
          }),
        })

        const searchData = await searchResponse.json()

        if (searchData.total > 0) {
          const contactId = searchData.results[0].id

          // Associate ticket with contact
          await fetch(`https://api.hubapi.com/crm/v3/objects/tickets/${ticket.id}/associations/contacts/${contactId}/ticket_to_contact`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
            },
          })
        }
      } catch (assocError) {
        // Don't fail if association fails, ticket is still created
        console.error('Failed to associate ticket with contact:', assocError)
      }
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id
    })

  } catch (error) {
    console.error('Error creating feedback ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
