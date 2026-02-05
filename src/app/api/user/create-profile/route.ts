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
    internal_notes: 'Emma has been working on managing work-related stress and perfectionism. She responds well to reflective exercises and journaling prompts. Making excellent progress with self-awareness.',
    preferences: {
      communication_style: 'Prefers gentle, reflective conversations. Appreciates when given time to process before responding.',
      key_strengths: ['Self-awareness', 'Journaling', 'Openness to growth', 'Commitment to therapy'],
      areas_of_sensitivity: ['Work-related stress', 'Perfectionism', 'Fear of disappointing others'],
      therapeutic_context: 'Working on establishing healthier boundaries at work and developing self-compassion practices.',
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
                notes: 'First session focused on understanding Emma\'s background and current challenges. Discussed her work environment and identified key stressors. She expressed motivation to work on setting boundaries.',
                summary: 'Initial consultation completed. Established rapport and identified primary focus areas: work stress, perfectionism, and self-compassion.',
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
                notes: 'Reviewed journaling homework from last week. Emma identified several patterns in her stress responses. Introduced breathing techniques for moments of overwhelm.',
                summary: 'Good progress on self-awareness. Emma has been consistent with journaling. Introduced grounding techniques.',
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
                title: 'Develop self-compassion practice',
                description: 'Build a daily practice of self-compassion, replacing self-critical thoughts with kinder self-talk.',
                category: 'emotional',
                status: 'discovery',
                target_date: targetDate60.toISOString().split('T')[0],
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Set boundaries at work',
                description: 'Learn to say no to extra tasks and communicate workload limits to manager.',
                category: 'behavioral',
                status: 'building',
                target_date: targetDate30.toISOString().split('T')[0],
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Daily journaling habit',
                description: 'Maintain a consistent evening journaling practice to process daily experiences and emotions.',
                category: 'behavioral',
                status: 'thriving',
                target_date: targetDate14.toISOString().split('T')[0],
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Identify stress triggers',
                description: 'Recognize and name the specific situations and thoughts that trigger stress responses.',
                category: 'therapy_goal',
                status: 'independent',
                achieved_at: achievedDate.toISOString(),
              },
            ]).select('id, title')

            // Add milestone comments
            if (milestones) {
              const journalingMilestone = milestones.find(m => m.title === 'Daily journaling habit')
              const boundariesMilestone = milestones.find(m => m.title === 'Set boundaries at work')

              if (journalingMilestone) {
                await serviceClient.from('milestone_comments').insert({
                  milestone_id: journalingMilestone.id,
                  practitioner_id: user.id,
                  content: 'Emma has been making excellent progress with her journaling. She\'s now consistently writing every evening and finding it helps her process the day.',
                })
              }
              if (boundariesMilestone) {
                await serviceClient.from('milestone_comments').insert({
                  milestone_id: boundariesMilestone.id,
                  practitioner_id: user.id,
                  content: 'Working on practicing "I" statements when expressing workload concerns. Had a successful conversation with her manager last week.',
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
                title: 'Initial observations',
                content: 'Emma presents as articulate and self-aware. She has a strong desire to improve but tends to be self-critical when progress isn\'t immediate. Will focus on normalizing the non-linear nature of growth.',
                note_type: 'observation',
                is_private: true,
              },
              {
                member_id: emmaMember.id,
                practitioner_id: user.id,
                title: 'Treatment approach',
                content: 'Combining CBT techniques with mindfulness-based approaches. Focus areas: cognitive restructuring for perfectionist thoughts, boundary-setting skills, and self-compassion exercises.',
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
