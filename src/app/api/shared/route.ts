import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/shared?token=<token>
 * Validate a share token and return resource data for public preview
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Look up the share token
    const { data: shareToken, error: tokenError } = await supabase
      .from('resource_share_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (tokenError || !shareToken) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    // Check expiry
    if (new Date(shareToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    // Fetch the resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('id, title, description, type, category, blocks, settings, language')
      .eq('id', shareToken.resource_id)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Fetch practitioner name
    const { data: practitioner } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', shareToken.practitioner_id)
      .single()

    return NextResponse.json({
      resource,
      practitioner: {
        full_name: practitioner?.full_name || 'Your practitioner',
        avatar_url: practitioner?.avatar_url || null,
      },
      memberEmail: shareToken.member_email,
    })
  } catch (error) {
    console.error('Error validating share token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
