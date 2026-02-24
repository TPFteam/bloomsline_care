import { SupabaseClient } from '@supabase/supabase-js'

// Demo members to create for new practitioners (bilingual EN/FR)
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
    internal_notes: 'EN: Patient engaged in deep therapeutic work. Solid therapeutic alliance. Sensitive to recognition issues. Current work on internal safety and relationship patterns.\n\nFR: Patiente engagée dans un travail thérapeutique profond. Alliance thérapeutique solide. Sensible aux enjeux de reconnaissance. Travail actuel sur la sécurité interne et le rapport au lien.',
    preferences: {
      communication_style: {
        en: ['Needs relational safety before any sensitive exploration', 'Tends to respond through thinking rather than feeling'],
        fr: ['Besoin de sécurité relationnelle préalable avant toute exploration sensible', 'Tendance à répondre par la pensée plutôt que par l\'affect'],
      },
      key_strengths: {
        en: ['Emotional intelligence', 'Reflective capacity', 'Therapeutic engagement'],
        fr: ['Intelligence émotionnelle', 'Capacité de réflexion', 'Engagement thérapeutique'],
      },
      areas_of_sensitivity: {
        en: ['Recognition in relationships', 'Body trauma', 'Dissociation'],
        fr: ['Reconnaissance dans le lien', 'Trauma corporel', 'Dissociation'],
      },
      therapeutic_context: {
        en: 'Relational functioning marked by early over-adaptation and strong control in relationships\n\nDevelopmental trauma history (body trauma during adolescence)\n\nOngoing therapeutic work around internal safety, relationship patterns, and subjective recognition\n\nCurrent life situation is fragile (unemployment, financial precarity, uncomfortable housing) which may increase dissociation/freezing\n\nEngaged therapy, solid alliance but sensitive to recognition issues in the relationship',
        fr: 'Fonctionnement relationnel marqué par une suradaptation précoce et un fort contrôle du lien\n\nHistoire traumatique développementale (trauma corporel à l\'adolescence)\n\nTravail thérapeutique en cours autour de la sécurité interne, du rapport au lien, et de la reconnaissance subjective\n\nSituation de vie actuelle fragile (chômage, précarité matérielle, logement inconfortable) pouvant majorer la dissociation / le gel\n\nThérapie engagée, alliance solide mais sensible aux enjeux de reconnaissance dans le lien',
      },
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

/**
 * Creates demo members with full sample data for a new practitioner.
 * This includes members, sessions, milestones, milestone comments, and progress notes.
 */
export async function createDemoMembers(serviceClient: SupabaseClient, practitionerId: string) {
  const demoMembersWithPractitioner = DEMO_MEMBERS.map(member => ({
    ...member,
    practitioner_id: practitionerId,
  }))

  const { data: createdMembers, error: demoError } = await serviceClient
    .from('members')
    .insert(demoMembersWithPractitioner)
    .select('id, first_name')

  if (demoError) {
    console.error('Error creating demo members:', demoError)
    return
  }

  if (!createdMembers || createdMembers.length === 0) return

  const emmaMember = createdMembers.find(m => m.first_name === 'Emma')
  const lucasMember = createdMembers.find(m => m.first_name === 'Lucas')

  // ============================================
  // SESSIONS for Emma (active member)
  // ============================================
  if (emmaMember) {
    const now = new Date()

    const session1Date = new Date(now)
    session1Date.setDate(session1Date.getDate() - 14)

    const session2Date = new Date(now)
    session2Date.setDate(session2Date.getDate() - 7)

    const session3Date = new Date(now)
    session3Date.setDate(session3Date.getDate() + 3)

    await serviceClient.from('sessions').insert([
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        session_type: 'initial_consultation',
        session_format: 'virtual',
        scheduled_at: session1Date.toISOString(),
        duration_minutes: 60,
        status: 'completed',
        notes: 'EN: First meeting. Gathered history and reasons for consultation. Therapeutic alliance building. Patient expresses need for recognition and safety in relationships.\n\nFR: Première rencontre. Recueil de l\'histoire et des motifs de consultation. Alliance thérapeutique en construction. La patiente exprime un besoin de reconnaissance et de sécurité dans le lien.',
        summary: 'EN: Initial consultation. Identified focus areas: internal safety, relationship patterns, subjective recognition.\nFR: Consultation initiale. Identification des axes de travail: sécurité interne, rapport au lien, reconnaissance subjective.',
        mood_rating: 6,
      },
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        session_type: 'follow_up',
        session_format: 'virtual',
        scheduled_at: session2Date.toISOString(),
        duration_minutes: 50,
        status: 'completed',
        notes: 'EN: Session focused on exploring protective mechanisms in relationships. Patient identifies tendency to anticipate expectations to avoid disappointment. Working on the legitimacy of her own needs.\n\nFR: Séance centrée sur l\'exploration des mécanismes de protection dans le lien. La patiente identifie sa tendance à anticiper les attentes pour éviter la déception. Travail sur la légitimité de ses besoins propres.',
        summary: 'EN: Progress in awareness of over-adaptation patterns. Opening toward expressing authentic needs.\nFR: Progrès dans la conscience des mécanismes de suradaptation. Ouverture vers l\'expression des besoins authentiques.',
        mood_rating: 7,
      },
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
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
    // MILESTONES for Emma
    // ============================================
    const targetDate60 = new Date(now)
    targetDate60.setDate(targetDate60.getDate() + 60)
    const targetDate30 = new Date(now)
    targetDate30.setDate(targetDate30.getDate() + 30)

    const { data: milestones } = await serviceClient.from('milestones').insert([
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        title: 'Access emotions safely / Accéder à l\'affect',
        description: 'EN: Access emotions without forcing or dissociating\nFR: Accéder à l\'affect sans forçage ni dissociation',
        category: 'general',
        status: 'building',
        target_date: targetDate30.toISOString().split('T')[0],
      },
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        title: 'Be present in relationships / Exister dans le lien',
        description: 'EN: Be present in relationships without protecting through control or performance\nFR: Exister dans le lien sans se protéger par le contrôle ou la performance',
        category: 'general',
        status: 'discovery',
        target_date: targetDate60.toISOString().split('T')[0],
      },
    ]).select('id, title')

    if (milestones) {
      const affectMilestone = milestones.find(m => m.title.includes('Access emotions'))

      if (affectMilestone) {
        await serviceClient.from('milestone_comments').insert({
          milestone_id: affectMilestone.id,
          practitioner_id: practitionerId,
          content: 'EN: Notable progress in ability to identify emotional states. Ongoing work on accessing emotions without dissociating.\n\nFR: Progrès notables dans la capacité à identifier les états émotionnels. Travail en cours sur l\'accès aux émotions sans dissociation.',
        })
      }
    }

    // ============================================
    // PROGRESS NOTES for Emma
    // ============================================
    await serviceClient.from('progress_notes').insert([
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        title: 'Session Summary',
        content: 'EN: Follow-up session focused on accessing emotions and recognition in relationships. Patient shows increasing ability to identify emotional states without dissociating. Continuing work on internal safety.\n\nFR: Séance de suivi centrée sur l\'accès aux émotions et la reconnaissance dans les relations. La patiente montre une capacité croissante à identifier ses états émotionnels sans dissocier. Poursuite du travail sur la sécurité interne.',
        note_type: 'general',
        is_private: false,
      },
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        title: 'Clinical Observation / Observation clinique',
        content: 'EN: Good mentalization capacity when the setting feels safe. Tendency to freeze or over-adapt when perceiving expectations. Work on subjective recognition is progressing.\n\nFR: Bonne capacité de mentalisation quand le cadre est sécurisant. Tendance au gel ou à la suradaptation quand elle perçoit une attente. Le travail sur la reconnaissance subjective progresse.',
        note_type: 'hypothese',
        is_private: true,
      },
      {
        member_id: emmaMember.id,
        practitioner_id: practitionerId,
        title: 'Treatment Plan / Plan de traitement',
        content: 'EN: Focus areas:\n1. Internal safety and emotional regulation\n2. Relationships without control or performance\n3. Subjective recognition and experience validation\n4. Gradual trauma work when window of tolerance allows\n\nFR: Axes de travail:\n1. Sécurité interne et régulation émotionnelle\n2. Rapport au lien sans contrôle ni performance\n3. Reconnaissance subjective et validation de l\'expérience\n4. Travail progressif sur le trauma corporel quand la fenêtre de tolérance le permet',
        note_type: 'ajustement_envisage',
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
      practitioner_id: practitionerId,
      session_type: 'initial_consultation',
      session_format: 'in_person',
      scheduled_at: upcomingDate.toISOString(),
      duration_minutes: 60,
      status: 'scheduled',
      notes: null,
      summary: null,
      mood_rating: null,
    })

    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 14)

    await serviceClient.from('milestones').insert({
      member_id: lucasMember.id,
      practitioner_id: practitionerId,
      title: 'Complete initial assessment',
      description: 'Conduct comprehensive intake interview and establish treatment goals.',
      category: 'therapy_goal',
      status: 'discovery',
      target_date: targetDate.toISOString().split('T')[0],
    })
  }
}
