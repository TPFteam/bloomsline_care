import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'
import { isValidEmail, sanitizeString } from '@/lib/security/validation'

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

const VALID_PRACTITIONER_TYPES = ['psychologue', 'psychanalyste', 'praticien', 'autre'] as const

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public signup endpoint
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.public)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    if (!HUBSPOT_ACCESS_TOKEN) {
      console.error('HUBSPOT_ACCESS_TOKEN not configured')
      return NextResponse.json(
        { error: 'Signup service not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const fullname = sanitizeString(body.fullname, 100)
    const email = sanitizeString(body.email, 255)?.toLowerCase()
    const practitionerType = body.practitionerType

    if (!fullname || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (!practitionerType || !VALID_PRACTITIONER_TYPES.includes(practitionerType)) {
      return NextResponse.json(
        { error: 'Please select a practitioner type' },
        { status: 400 }
      )
    }

    // Split fullname into first/last
    const nameParts = fullname.trim().split(/\s+/)
    const firstname = nameParts[0]
    const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    // Practitioner type labels for HubSpot
    const typeLabels: Record<string, string> = {
      psychologue: 'Psychologue',
      psychanalyste: 'Psychanalyste',
      praticien: 'Praticien',
      autre: 'Autre',
    }

    // Create contact in HubSpot
    const contactPayload = {
      properties: {
        firstname,
        lastname,
        email,
        jobtitle: typeLabels[practitionerType] || practitionerType,
        lifecyclestage: 'lead',
      },
    }

    console.log('Creating HubSpot contact:', JSON.stringify(contactPayload))

    const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactPayload),
    })

    if (!hubspotResponse.ok) {
      const errorData = await hubspotResponse.json()
      console.error('HubSpot API error:', hubspotResponse.status, JSON.stringify(errorData))

      // HubSpot returns 409 for duplicate contacts
      if (hubspotResponse.status === 409) {
        return NextResponse.json(
          { error: 'This email is already registered', code: 'DUPLICATE' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to submit signup', details: errorData },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing practitioner signup:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
