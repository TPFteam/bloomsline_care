import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

// Public directory of practitioners. Merges self-signup profiles
// (practitioner_profiles, is_public) with admin-created directory entries
// (public_practitioners, is_published), deduped by person (user_id, else slug).
// Uses the service-role client so profile names (users join) read reliably and
// aren't blocked by RLS — only public, published fields are exposed.
export async function GET() {
  try {
    const db = createAdminClient()
    const [{ data: profs }, { data: pubs }] = await Promise.all([
      db.from('practitioner_profiles')
        .select('slug, headline, city, country, specialties, user_id')
        .eq('is_public', true),
      db.from('public_practitioners')
        .select('slug, full_name, avatar_url, headline, city, country, specialties, user_id')
        .eq('is_published', true),
    ])

    // Names/avatars + the is_demo (test-account) flag come from the users table.
    // We fetch separately because there's no PostgREST FK relationship configured
    // between practitioner_profiles and users (the users(...) embed errors out).
    // Test practitioners are flagged by users.is_demo and excluded here.
    const allUserIds = Array.from(new Set([
      ...(profs || []).map((p) => p.user_id as string),
      ...(pubs || []).map((p) => p.user_id as string),
    ].filter(Boolean)))
    const userMap = new Map<string, { name: string; avatar: string | null; isDemo: boolean }>()
    if (allUserIds.length) {
      const { data: users } = await db.from('users').select('id, full_name, avatar_url, is_demo').in('id', allUserIds)
      for (const u of users || []) userMap.set(u.id as string, { name: (u.full_name as string) || '', avatar: (u.avatar_url as string) || null, isDemo: u.is_demo === true })
    }

    const keyFor = (userId: string | null, slug: string) => (userId ? `u:${userId}` : `s:${slug}`)
    const map = new Map<string, {
      slug: string; name: string; avatar: string | null; headline: string | null;
      city: string | null; country: string | null; specialties: string[]
    }>()

    // Self-managed profiles win (most up to date).
    for (const p of profs || []) {
      const slug = p.slug as string
      const u = p.user_id ? userMap.get(p.user_id as string) : undefined
      if (!slug || !u?.name || u.isDemo) continue // skip test accounts
      map.set(keyFor((p.user_id as string) || null, slug), {
        slug, name: u.name, avatar: u.avatar,
        headline: (p.headline as string) || null, city: (p.city as string) || null,
        country: (p.country as string) || null, specialties: (p.specialties as string[]) || [],
      })
    }
    for (const p of pubs || []) {
      const slug = p.slug as string
      const userId = (p.user_id as string) || null
      if (!slug || !p.full_name) continue
      if (userId && userMap.get(userId)?.isDemo) continue // skip test accounts
      if (map.has(keyFor(userId, slug))) continue
      if (userId && map.has(`u:${userId}`)) continue // same person already via a profile
      map.set(keyFor(userId, slug), {
        slug, name: p.full_name as string, avatar: (p.avatar_url as string) || null,
        headline: (p.headline as string) || null, city: (p.city as string) || null,
        country: (p.country as string) || null, specialties: (p.specialties as string[]) || [],
      })
    }

    const practitioners = [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ practitioners })
  } catch (error) {
    console.error('public practitioners list error:', error)
    return NextResponse.json({ practitioners: [] }, { status: 500 })
  }
}
