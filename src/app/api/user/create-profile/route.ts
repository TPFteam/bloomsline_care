import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createAdminClient } from '@/lib/supabase/server-client'
import { UserType, isValidUserType } from '@/types/user'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/security/rate-limit'

// Demo members to create for new practitioners
const DEMO_MEMBERS = [
  {
    first_name: 'Emma',
    last_name: 'Thompson',
    email: null,
    phone: null,
    date_of_birth: '1992-03-15',
    status: 'active' as const,
    engagement_level: 'high' as const,
    is_demo: true,
    internal_notes: 'Patiente engagée dans un travail thérapeutique profond. Alliance thérapeutique solide. Sensible aux enjeux de reconnaissance. Travail actuel sur la sécurité interne et le rapport au lien.',
    preferences: {
      communication_style: ['Besoin de sécurité relationnelle préalable avant toute exploration sensible', 'Tendance à répondre par la pensée plutôt que par l\'affect'],
      key_strengths: ['Intelligence émotionnelle', 'Capacité de réflexion', 'Engagement thérapeutique'],
      areas_of_sensitivity: ['Reconnaissance dans le lien', 'Trauma corporel', 'Dissociation'],
      therapeutic_context: 'Fonctionnement relationnel marqué par une suradaptation précoce et un fort contrôle du lien\n\nHistoire traumatique développementale (trauma corporel à l\'adolescence)\n\nTravail thérapeutique en cours autour de la sécurité interne, du rapport au lien, et de la reconnaissance subjective\n\nSituation de vie actuelle fragile (chômage, précarité matérielle, logement inconfortable) pouvant majorer la dissociation / le gel\n\nThérapie engagée, alliance solide mais sensible aux enjeux de reconnaissance dans le lien',
      preferred_contact_method: 'email',
      preferred_session_format: 'virtual',
    },
    emergency_contact: {
      name: 'David Thompson',
      relationship: 'Spouse',
      phone: '+1 555-0123',
      email: null,
      notes: 'Primary emergency contact',
    },
  },
  {
    first_name: 'Lucas',
    last_name: 'Martin',
    email: null,
    phone: null,
    date_of_birth: '1988-07-22',
    status: 'active' as const,
    engagement_level: 'medium' as const,
    is_demo: true,
    internal_notes: 'Lucas is a new client interested in developing better stress management techniques. Prefers direct, action-oriented approaches.',
    preferences: {
      communication_style: 'Direct and action-oriented. Prefers concrete techniques over abstract discussions.',
      key_strengths: ['Problem-solving', 'Resilience', 'Logical thinking'],
      areas_of_sensitivity: ['Discussing emotions directly', 'Vulnerability'],
      therapeutic_context: 'Initial consultation pending. Interested in CBT-based approaches.',
      preferred_contact_method: 'phone',
      preferred_session_format: 'in_person',
    },
    emergency_contact: {
      name: null,
      relationship: null,
      phone: null,
      email: null,
      notes: null,
    },
  },
]

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.auth)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }

  try {
    const response = NextResponse.next()
    const supabase = createRouteHandlerClient(request, response)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { user_type, has_consented } = body

    // Validate user_type
    if (!user_type || !isValidUserType(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be "mentor" or "member"' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        user_type: user_type as UserType,
        has_consented: !!has_consented,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // If practitioner (mentor), create demo members with full data to showcase all features
    if (user_type === 'mentor') {
      try {
        const serviceClient = createAdminClient()
        const demoMembersWithPractitioner = DEMO_MEMBERS.map(member => ({
          ...member,
          practitioner_id: user.id,
        }))

        const { data: createdMembers, error: demoError } = await serviceClient
          .from('members')
          .insert(demoMembersWithPractitioner)
          .select('id, first_name')

        if (demoError) {
          console.error('Error creating demo members:', demoError)
        } else if (createdMembers && createdMembers.length > 0) {
          const emmaMember = createdMembers.find(m => m.first_name === 'Emma')
          const lucasMember = createdMembers.find(m => m.first_name === 'Lucas')

          // ============================================
          // SESSIONS for Emma (active member)
          // ============================================
          if (emmaMember) {
            const now = new Date()

            // Session 1: Completed initial consultation (2 weeks ago)
            const session1Date = new Date(now)
            session1Date.setDate(session1Date.getDate() - 14)

            // Session 2: Completed follow-up (1 week ago)
            const session2Date = new Date(now)
            session2Date.setDate(session2Date.getDate() - 7)

            // Session 3: Upcoming (3 days from now)
            const session3Date = new Date(now)
            session3Date.setDate(session3Date.getDate() + 3)

            await serviceClient.from('sessions').insert([
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                session_type: 'initial_consultation',
                session_format: 'virtual',
                scheduled_at: session1Date.toISOString(),
                duration_minutes: 60,
                status: 'completed',
                notes: 'Première rencontre. Recueil de l\'histoire et des motifs de consultation. Alliance thérapeutique en construction. La patiente exprime un besoin de reconnaissance et de sécurité dans le lien.',
                summary: 'Consultation initiale. Identification des axes de travail: sécurité interne, rapport au lien, reconnaissance subjective.',
                mood_rating: 6,
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                session_type: 'follow_up',
                session_format: 'virtual',
                scheduled_at: session2Date.toISOString(),
                duration_minutes: 50,
                status: 'completed',
                notes: 'Séance centrée sur l\'exploration des mécanismes de protection dans le lien. La patiente identifie sa tendance à anticiper les attentes pour éviter la déception. Travail sur la légitimité de ses besoins propres.',
                summary: 'Progrès dans la conscience des mécanismes de suradaptation. Ouverture vers l\'expression des besoins authentiques.',
                mood_rating: 7,
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                session_type: 'follow_up',
                session_format: 'virtual',
                scheduled_at: session3Date.toISOString(),
                duration_minutes: 50,
                status: 'scheduled',
                notes: null,
                summary: null,
                mood_rating: null,
              },
            ])

            // ============================================
            // MILESTONES for Emma (Progress tab)
            // ============================================
            const targetDate60 = new Date(now)
            targetDate60.setDate(targetDate60.getDate() + 60)
            const targetDate30 = new Date(now)
            targetDate30.setDate(targetDate30.getDate() + 30)
            const targetDate14 = new Date(now)
            targetDate14.setDate(targetDate14.getDate() + 14)
            const achievedDate = new Date(now)
            achievedDate.setDate(achievedDate.getDate() - 5)

            const { data: milestones } = await serviceClient.from('milestones').insert([
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Accéder à l\'affect',
                description: 'Accéder à l\'affect sans forçage ni dissociation',
                category: 'general',
                status: 'building',
                target_date: targetDate30.toISOString().split('T')[0],
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Exister dans le lien',
                description: 'Exister dans le lien sans se protéger par le contrôle ou la performance',
                category: 'general',
                status: 'discovery',
                target_date: targetDate60.toISOString().split('T')[0],
              },
            ]).select('id, title')

            // Add milestone comments
            if (milestones) {
              const affectMilestone = milestones.find(m => m.title === 'Accéder à l\'affect')

              if (affectMilestone) {
                await serviceClient.from('milestone_comments').insert({
                  milestone_id: affectMilestone.id,
                  practitioner_id: user.id,
                  content: 'Progrès notables dans la capacité à identifier les états émotionnels. Travail en cours sur l\'accès sans passage par la dissociation.',
                })
              }
            }

            // ============================================
            // PROGRESS NOTES for Emma
            // ============================================
            await serviceClient.from('progress_notes').insert([
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Session Summary',
                content: 'Follow-up session. Travail sur l\'accès à l\'affect et la reconnaissance dans le lien. La patiente montre une capacité croissante à identifier ses états émotionnels sans passer par la dissociation. Poursuite du travail sur la sécurité interne.',
                note_type: 'general',
                is_private: false,
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Observation clinique',
                content: 'Bonne capacité de mentalisation quand le cadre est sécurisant. Tendance au gel ou à la suradaptation quand elle perçoit une attente. Le travail sur la reconnaissance subjective progresse.',
                note_type: 'observation',
                is_private: true,
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Plan de traitement',
                content: 'Axes de travail:\n1. Sécurité interne et régulation émotionnelle\n2. Rapport au lien sans contrôle ni performance\n3. Reconnaissance subjective et validation de l\'expérience\n4. Travail progressif sur le trauma corporel quand la fenêtre de tolérance le permet',
                note_type: 'treatment_plan',
                is_private: true,
              },
            ])
          }

          // ============================================
          // SESSIONS for Lucas (pending member)
          // ============================================
          if (lucasMember) {
            const upcomingDate = new Date()
            upcomingDate.setDate(upcomingDate.getDate() + 5)

            await serviceClient.from('sessions').insert({
              member_id: lucasMember.id,
              practitioner_id: user.id,
              session_type: 'initial_consultation',
              session_format: 'in_person',
              scheduled_at: upcomingDate.toISOString(),
              duration_minutes: 60,
              status: 'scheduled',
              notes: null,
              summary: null,
              mood_rating: null,
            })

            // Simple milestone for Lucas
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + 14)

            await serviceClient.from('milestones').insert({
              member_id: lucasMember.id,
              practitioner_id: user.id,
              title: 'Complete initial assessment',
              description: 'Conduct comprehensive intake interview and establish treatment goals.',
              category: 'therapy_goal',
              status: 'discovery',
              target_date: targetDate.toISOString().split('T')[0],
            })
          }
        }
      } catch (demoErr) {
        console.error('Failed to create demo members:', demoErr)
        // Don't fail the main request
      }
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
