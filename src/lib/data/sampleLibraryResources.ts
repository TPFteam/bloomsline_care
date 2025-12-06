import type { LibraryResource } from '@/types/library'

// Sample curated library resources for demonstration
export const sampleLibraryResources: LibraryResource[] = [
  {
    id: '1',
    title: 'Anxiety Coping Toolkit',
    description: 'A comprehensive set of evidence-based coping strategies for managing anxiety. Includes breathing exercises, grounding techniques, and cognitive reframing tools.',
    type: 'activity',
    category: 'anxiety',
    content: {
      overview: 'This toolkit provides practical strategies for managing anxiety symptoms...',
      instructions: 'Use these tools when anxiety symptoms arise or as preventive daily practice.',
      materials_needed: ['Journal or paper', 'Quiet space'],
      sections: [
        { id: '1', title: 'Breathing Exercises', content: '4-7-8 breathing technique...', duration_minutes: 5, order: 1 },
        { id: '2', title: 'Grounding Techniques', content: '5-4-3-2-1 sensory grounding...', duration_minutes: 10, order: 2 },
      ],
      tips: ['Start with breathing exercises', 'Practice daily for best results'],
      modifications: [
        { id: '1', for_group: 'Children', description: 'Use simpler language and shorter durations' },
      ],
    },
    thumbnail_url: null,
    tags: ['coping', 'breathing', 'grounding', 'self-help'],
    age_group: 'all',
    difficulty: 'beginner',
    duration_minutes: 30,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 234,
    use_count: 1520,
    rating: 4.8,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    published: true,
  },
  {
    id: '2',
    title: 'Daily Mindfulness Ritual',
    description: 'A structured 10-minute morning mindfulness practice designed to start the day with intention and presence.',
    type: 'ritual',
    category: 'mindfulness',
    content: {
      overview: 'This daily ritual combines meditation, intention-setting, and gratitude...',
      instructions: 'Practice each morning before checking devices or starting work.',
      materials_needed: ['Comfortable seating', 'Timer'],
      sections: [
        { id: '1', title: 'Centering Breath', content: 'Begin with 3 deep breaths...', duration_minutes: 2, order: 1 },
        { id: '2', title: 'Body Scan', content: 'Notice sensations from head to toe...', duration_minutes: 3, order: 2 },
        { id: '3', title: 'Intention Setting', content: 'Set one intention for the day...', duration_minutes: 2, order: 3 },
        { id: '4', title: 'Gratitude', content: 'Name three things you are grateful for...', duration_minutes: 3, order: 4 },
      ],
      tips: ['Consistency is more important than duration', 'Start with 5 minutes if 10 feels too long'],
      modifications: [],
    },
    thumbnail_url: null,
    tags: ['mindfulness', 'meditation', 'morning routine', 'gratitude'],
    age_group: 'adults',
    difficulty: 'beginner',
    duration_minutes: 10,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 456,
    use_count: 3200,
    rating: 4.9,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-05-15T00:00:00Z',
    published: true,
  },
  {
    id: '3',
    title: 'Depression Screening Questionnaire',
    description: 'A standardized assessment tool based on PHQ-9 for evaluating depression symptoms and severity.',
    type: 'assessment',
    category: 'depression',
    content: {
      overview: 'This assessment helps identify symptoms and severity of depression...',
      instructions: 'Administer at intake and periodically to track progress.',
      materials_needed: ['Questionnaire form', 'Scoring guide'],
      sections: [
        { id: '1', title: 'Questionnaire', content: 'Nine questions about the past two weeks...', duration_minutes: 5, order: 1 },
        { id: '2', title: 'Scoring', content: 'Calculate total score and interpret results...', duration_minutes: 3, order: 2 },
      ],
      tips: ['Use as part of comprehensive assessment', 'Discuss results with client'],
      modifications: [
        { id: '1', for_group: 'Teens', description: 'Use adolescent-friendly language' },
      ],
    },
    thumbnail_url: null,
    tags: ['assessment', 'PHQ-9', 'screening', 'intake'],
    age_group: 'adults',
    difficulty: 'beginner',
    duration_minutes: 10,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 567,
    use_count: 4500,
    rating: 4.7,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-04-20T00:00:00Z',
    published: true,
  },
  {
    id: '4',
    title: 'Cognitive Restructuring Worksheet',
    description: 'A guided worksheet for identifying and challenging negative thought patterns using CBT principles.',
    type: 'template',
    category: 'coping_skills',
    content: {
      overview: 'This worksheet helps clients identify cognitive distortions and develop balanced thinking...',
      instructions: 'Use during session or assign as homework.',
      materials_needed: ['Printed worksheet or digital form'],
      sections: [
        { id: '1', title: 'Situation', content: 'Describe the triggering situation...', duration_minutes: 5, order: 1 },
        { id: '2', title: 'Automatic Thoughts', content: 'What thoughts came to mind?', duration_minutes: 5, order: 2 },
        { id: '3', title: 'Evidence', content: 'What evidence supports or contradicts these thoughts?', duration_minutes: 10, order: 3 },
        { id: '4', title: 'Balanced Thought', content: 'What is a more balanced way to view this?', duration_minutes: 5, order: 4 },
      ],
      tips: ['Model the process first', 'Start with less emotionally charged situations'],
      modifications: [],
    },
    thumbnail_url: null,
    tags: ['CBT', 'cognitive distortions', 'worksheet', 'homework'],
    age_group: 'all',
    difficulty: 'intermediate',
    duration_minutes: 25,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 789,
    use_count: 5600,
    rating: 4.6,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z',
    published: true,
  },
  {
    id: '5',
    title: 'Understanding Emotions Guide',
    description: 'An educational resource explaining different emotions, their purpose, and healthy ways to express them.',
    type: 'educational',
    category: 'self_esteem',
    content: {
      overview: 'This guide helps clients understand and normalize their emotional experiences...',
      instructions: 'Review with client or provide as reading material.',
      materials_needed: [],
      sections: [
        { id: '1', title: 'What Are Emotions?', content: 'Emotions are natural responses...', duration_minutes: 5, order: 1 },
        { id: '2', title: 'Primary Emotions', content: 'Joy, sadness, fear, anger, surprise, disgust...', duration_minutes: 10, order: 2 },
        { id: '3', title: 'Healthy Expression', content: 'Ways to express emotions constructively...', duration_minutes: 10, order: 3 },
      ],
      tips: ['Normalize all emotions', 'Focus on expression not suppression'],
      modifications: [
        { id: '1', for_group: 'Children', description: 'Use emotion faces and simpler examples' },
      ],
    },
    thumbnail_url: null,
    tags: ['emotions', 'psychoeducation', 'emotional intelligence'],
    age_group: 'all',
    difficulty: 'beginner',
    duration_minutes: 25,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 345,
    use_count: 2100,
    rating: 4.5,
    created_at: '2024-02-28T00:00:00Z',
    updated_at: '2024-05-05T00:00:00Z',
    published: true,
  },
  {
    id: '6',
    title: 'Stress Management Activity Pack',
    description: 'A collection of interactive stress-relief activities including progressive muscle relaxation, visualization, and journaling prompts.',
    type: 'activity',
    category: 'stress',
    content: {
      overview: 'This activity pack provides multiple options for stress relief...',
      instructions: 'Choose activities based on client preferences and time available.',
      materials_needed: ['Journal', 'Comfortable space', 'Optional: calming music'],
      sections: [
        { id: '1', title: 'Progressive Muscle Relaxation', content: 'Systematic tension and release...', duration_minutes: 15, order: 1 },
        { id: '2', title: 'Guided Visualization', content: 'Safe place visualization...', duration_minutes: 10, order: 2 },
        { id: '3', title: 'Journaling Prompts', content: 'Reflective writing exercises...', duration_minutes: 15, order: 3 },
      ],
      tips: ['Let client choose their preferred activity', 'Practice together first'],
      modifications: [],
    },
    thumbnail_url: null,
    tags: ['stress relief', 'relaxation', 'PMR', 'visualization'],
    age_group: 'adults',
    difficulty: 'beginner',
    duration_minutes: 40,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 421,
    use_count: 2800,
    rating: 4.7,
    created_at: '2024-03-05T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
    published: true,
  },
  {
    id: '7',
    title: 'Communication Skills Builder',
    description: 'Interactive exercises for developing assertive communication, active listening, and conflict resolution skills.',
    type: 'activity',
    category: 'communication',
    content: {
      overview: 'Build essential communication skills through practice and role-play...',
      instructions: 'Best used in session with role-play practice.',
      materials_needed: ['Role-play scenarios', 'Communication style handout'],
      sections: [
        { id: '1', title: 'Communication Styles', content: 'Passive, aggressive, assertive...', duration_minutes: 10, order: 1 },
        { id: '2', title: 'I-Statements', content: 'How to express needs effectively...', duration_minutes: 10, order: 2 },
        { id: '3', title: 'Active Listening', content: 'Skills for being fully present...', duration_minutes: 10, order: 3 },
        { id: '4', title: 'Practice Scenarios', content: 'Role-play common situations...', duration_minutes: 15, order: 4 },
      ],
      tips: ['Start with low-stakes scenarios', 'Model skills first'],
      modifications: [
        { id: '1', for_group: 'Couples', description: 'Adapt for partner communication practice' },
      ],
    },
    thumbnail_url: null,
    tags: ['communication', 'assertiveness', 'relationships', 'role-play'],
    age_group: 'adults',
    difficulty: 'intermediate',
    duration_minutes: 45,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 298,
    use_count: 1900,
    rating: 4.6,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-05-25T00:00:00Z',
    published: true,
  },
  {
    id: '8',
    title: 'Grief Processing Journey',
    description: 'A gentle, guided approach to processing grief through stages of acceptance, memory work, and meaning-making.',
    type: 'activity',
    category: 'grief',
    content: {
      overview: 'Support clients through their unique grief journey...',
      instructions: 'Use flexibly based on client readiness and needs.',
      materials_needed: ['Journal', 'Memory items (optional)', 'Tissues'],
      sections: [
        { id: '1', title: 'Honoring Grief', content: 'Acknowledging and validating the loss...', duration_minutes: 15, order: 1 },
        { id: '2', title: 'Memory Work', content: 'Preserving and honoring memories...', duration_minutes: 20, order: 2 },
        { id: '3', title: 'Finding Meaning', content: 'Integrating loss into life story...', duration_minutes: 15, order: 3 },
      ],
      tips: ['Follow clients lead', 'No timeline for grief', 'Have tissues available'],
      modifications: [
        { id: '1', for_group: 'Children', description: 'Use age-appropriate language and creative activities' },
      ],
    },
    thumbnail_url: null,
    tags: ['grief', 'loss', 'bereavement', 'healing'],
    age_group: 'all',
    difficulty: 'intermediate',
    duration_minutes: 50,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 187,
    use_count: 1200,
    rating: 4.9,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-06-05T00:00:00Z',
    published: true,
  },
  {
    id: '9',
    title: 'Self-Esteem Building Exercises',
    description: 'Practical exercises for building self-worth, challenging negative self-talk, and cultivating self-compassion.',
    type: 'activity',
    category: 'self_esteem',
    content: {
      overview: 'Help clients develop a healthier relationship with themselves...',
      instructions: 'Introduce exercises gradually and practice together.',
      materials_needed: ['Journal', 'Mirror (for some exercises)'],
      sections: [
        { id: '1', title: 'Self-Talk Awareness', content: 'Noticing internal dialogue...', duration_minutes: 10, order: 1 },
        { id: '2', title: 'Strength Inventory', content: 'Identifying personal strengths...', duration_minutes: 15, order: 2 },
        { id: '3', title: 'Self-Compassion Practice', content: 'Treating yourself with kindness...', duration_minutes: 10, order: 3 },
        { id: '4', title: 'Affirmations', content: 'Creating personalized affirmations...', duration_minutes: 10, order: 4 },
      ],
      tips: ['Start small', 'Celebrate any progress', 'Make it personal'],
      modifications: [
        { id: '1', for_group: 'Teens', description: 'Include social media and comparison topics' },
      ],
    },
    thumbnail_url: null,
    tags: ['self-esteem', 'self-compassion', 'confidence', 'self-talk'],
    age_group: 'all',
    difficulty: 'beginner',
    duration_minutes: 45,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 534,
    use_count: 3400,
    rating: 4.7,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-05-30T00:00:00Z',
    published: true,
  },
  {
    id: '10',
    title: 'Session Notes Template',
    description: 'A structured template for documenting therapy sessions including presenting concerns, interventions, and homework.',
    type: 'template',
    category: 'general',
    content: {
      overview: 'Standardize your session documentation with this comprehensive template...',
      instructions: 'Complete during or immediately after each session.',
      materials_needed: ['Template form'],
      sections: [
        { id: '1', title: 'Session Overview', content: 'Date, client info, session number...', duration_minutes: 2, order: 1 },
        { id: '2', title: 'Presenting Concerns', content: 'What the client brought to session...', duration_minutes: 5, order: 2 },
        { id: '3', title: 'Interventions Used', content: 'Techniques and approaches applied...', duration_minutes: 5, order: 3 },
        { id: '4', title: 'Progress & Observations', content: 'Notable changes or insights...', duration_minutes: 5, order: 4 },
        { id: '5', title: 'Homework & Next Steps', content: 'Assignments and plan for next session...', duration_minutes: 3, order: 5 },
      ],
      tips: ['Complete notes promptly', 'Be specific but concise', 'Include client quotes when relevant'],
      modifications: [],
    },
    thumbnail_url: null,
    tags: ['documentation', 'session notes', 'template', 'practice management'],
    age_group: 'all',
    difficulty: 'beginner',
    duration_minutes: 20,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 892,
    use_count: 7800,
    rating: 4.8,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-04-15T00:00:00Z',
    published: true,
  },
  {
    id: '11',
    title: 'Family Communication Exercise',
    description: 'Structured activities for improving communication within family systems, including active listening and boundary setting.',
    type: 'activity',
    category: 'family',
    content: {
      overview: 'Strengthen family bonds through improved communication...',
      instructions: 'Best used in family therapy sessions.',
      materials_needed: ['Talking stick or object', 'Timer'],
      sections: [
        { id: '1', title: 'Check-In Round', content: 'Each family member shares their current state...', duration_minutes: 10, order: 1 },
        { id: '2', title: 'Listening Exercise', content: 'Practice reflective listening in pairs...', duration_minutes: 15, order: 2 },
        { id: '3', title: 'Boundary Discussion', content: 'Identify and express personal boundaries...', duration_minutes: 15, order: 3 },
      ],
      tips: ['Ensure equal speaking time', 'Model healthy communication', 'Address power dynamics'],
      modifications: [
        { id: '1', for_group: 'With young children', description: 'Use simpler language and shorter durations' },
      ],
    },
    thumbnail_url: null,
    tags: ['family therapy', 'communication', 'boundaries', 'relationships'],
    age_group: 'all',
    difficulty: 'intermediate',
    duration_minutes: 40,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 256,
    use_count: 1650,
    rating: 4.5,
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-06-08T00:00:00Z',
    published: true,
  },
  {
    id: '12',
    title: 'Feelings Identification for Kids',
    description: 'Age-appropriate activities helping children identify, name, and express their emotions using colors, faces, and body sensations.',
    type: 'activity',
    category: 'children',
    content: {
      overview: 'Help children build emotional vocabulary and awareness...',
      instructions: 'Use playfully and follow the childs lead.',
      materials_needed: ['Emotion cards', 'Coloring materials', 'Body outline sheet'],
      sections: [
        { id: '1', title: 'Emotion Faces', content: 'Match feelings to facial expressions...', duration_minutes: 10, order: 1 },
        { id: '2', title: 'Color Your Feelings', content: 'Associate emotions with colors...', duration_minutes: 10, order: 2 },
        { id: '3', title: 'Body Map', content: 'Where do you feel emotions in your body?', duration_minutes: 10, order: 3 },
      ],
      tips: ['Make it fun and playful', 'Validate all emotions', 'Use examples from their life'],
      modifications: [],
    },
    thumbnail_url: null,
    tags: ['children', 'emotions', 'play therapy', 'emotional intelligence'],
    age_group: 'children',
    difficulty: 'beginner',
    duration_minutes: 30,
    is_curated: true,
    creator_id: null,
    creator_name: 'Bloomsline Team',
    save_count: 378,
    use_count: 2400,
    rating: 4.8,
    created_at: '2024-02-05T00:00:00Z',
    updated_at: '2024-05-20T00:00:00Z',
    published: true,
  },
  // Community-contributed resources with creator profiles
  {
    id: '13',
    title: 'Trauma-Informed Grounding Techniques',
    description: 'A collection of gentle, body-based grounding exercises specifically designed for trauma survivors, emphasizing safety and choice.',
    type: 'activity',
    category: 'trauma',
    content: {
      overview: 'These grounding techniques are designed with trauma survivors in mind, prioritizing safety, consent, and client autonomy throughout.',
      instructions: 'Always offer choice and never push clients past their window of tolerance. Start with eyes-open exercises.',
      materials_needed: ['Comfortable seating', 'Grounding objects (optional)', 'Fidget tools (optional)'],
      sections: [
        { id: '1', title: 'Orienting to Safety', content: 'Begin by noticing 5 things you can see in the room...', duration_minutes: 5, order: 1 },
        { id: '2', title: 'Feet on the Ground', content: 'Feel the weight of your body pressing down through your feet...', duration_minutes: 5, order: 2 },
        { id: '3', title: 'Temperature Grounding', content: 'Hold something cool or warm and notice the sensation...', duration_minutes: 5, order: 3 },
        { id: '4', title: 'Bilateral Stimulation', content: 'Gentle butterfly tapping or alternating foot taps...', duration_minutes: 5, order: 4 },
      ],
      tips: ['Always ask permission before touch-based exercises', 'Respect when clients say no', 'Keep voice calm and pacing slow'],
      modifications: [
        { id: '1', for_group: 'Complex PTSD', description: 'Start with external focus only, avoid body-based exercises initially' },
        { id: '2', for_group: 'Virtual sessions', description: 'Have client gather grounding objects beforehand' },
      ],
    },
    thumbnail_url: null,
    tags: ['trauma', 'grounding', 'PTSD', 'somatic', 'safety'],
    age_group: 'adults',
    difficulty: 'intermediate',
    duration_minutes: 20,
    is_curated: false,
    creator_id: 'user-sarah-chen',
    creator_name: 'Dr. Sarah Chen',
    creator_profile: {
      id: 'user-sarah-chen',
      slug: 'dr-sarah-chen',
      avatar_url: null,
      headline: 'Trauma-Informed Care Specialist | EMDR Certified',
      credentials: ['Ph.D.', 'LMFT', 'EMDR'],
      specialties: ['trauma_ptsd', 'anxiety', 'grief_loss'],
      years_experience: 15,
      is_verified: true,
    },
    save_count: 523,
    use_count: 3100,
    rating: 4.9,
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
    published: true,
  },
  {
    id: '14',
    title: 'Teen Identity Exploration Workbook',
    description: 'Interactive worksheets helping teenagers explore their values, strengths, and sense of self during the challenging adolescent years.',
    type: 'template',
    category: 'teens',
    content: {
      overview: 'This workbook provides structured activities for teens to explore who they are and who they want to become.',
      instructions: 'Can be used in session or assigned as homework. Discuss responses together.',
      materials_needed: ['Printed workbook or digital version', 'Colored pens/markers (optional)'],
      sections: [
        { id: '1', title: 'Values Sort', content: 'Rank and explore what matters most to you...', duration_minutes: 15, order: 1 },
        { id: '2', title: 'Strengths Map', content: 'Identify your unique strengths and talents...', duration_minutes: 10, order: 2 },
        { id: '3', title: 'Future Self Letter', content: 'Write a letter to your future self...', duration_minutes: 15, order: 3 },
        { id: '4', title: 'Identity Collage', content: 'Create a visual representation of who you are...', duration_minutes: 20, order: 4 },
      ],
      tips: ['Normalize identity confusion', 'Validate all identities', 'Be mindful of cultural context'],
      modifications: [
        { id: '1', for_group: 'Younger teens (13-14)', description: 'Simplify language and add more creative activities' },
      ],
    },
    thumbnail_url: null,
    tags: ['teens', 'identity', 'self-discovery', 'worksheet', 'adolescence'],
    age_group: 'teens',
    difficulty: 'beginner',
    duration_minutes: 60,
    is_curated: false,
    creator_id: 'user-marcus-johnson',
    creator_name: 'Marcus Johnson, LPC',
    creator_profile: {
      id: 'user-marcus-johnson',
      slug: 'marcus-johnson',
      avatar_url: null,
      headline: 'Adolescent Therapy Specialist | School Counselor',
      credentials: ['LPC', 'NCC', 'RPT'],
      specialties: ['self_esteem', 'adhd', 'life_transitions'],
      years_experience: 8,
      is_verified: true,
    },
    save_count: 312,
    use_count: 1850,
    rating: 4.7,
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
    published: true,
  },
  {
    id: '15',
    title: 'Couples Communication Reset',
    description: 'A structured 4-session protocol for couples to rebuild communication patterns and reconnect emotionally.',
    type: 'template',
    category: 'couples',
    content: {
      overview: 'This protocol guides couples through essential communication repairs over 4 sessions.',
      instructions: 'Follow the session structure but adapt to couple dynamics.',
      materials_needed: ['Session worksheets', 'Timer for exercises'],
      sections: [
        { id: '1', title: 'Session 1: Safety First', content: 'Establish ground rules and create emotional safety...', duration_minutes: 50, order: 1 },
        { id: '2', title: 'Session 2: Hearing Each Other', content: 'Active listening exercises and validation practice...', duration_minutes: 50, order: 2 },
        { id: '3', title: 'Session 3: Expressing Needs', content: 'Using I-statements and soft startups...', duration_minutes: 50, order: 3 },
        { id: '4', title: 'Session 4: Moving Forward', content: 'Creating communication agreements and rituals...', duration_minutes: 50, order: 4 },
      ],
      tips: ['Watch for stonewalling and flooding', 'Take breaks when needed', 'Balance support between partners'],
      modifications: [
        { id: '1', for_group: 'High conflict couples', description: 'Add individual sessions between couples sessions' },
      ],
    },
    thumbnail_url: null,
    tags: ['couples', 'communication', 'relationships', 'Gottman', 'EFT'],
    age_group: 'adults',
    difficulty: 'advanced',
    duration_minutes: 200,
    is_curated: false,
    creator_id: 'user-elena-rodriguez',
    creator_name: 'Elena Rodriguez, LMFT',
    creator_profile: {
      id: 'user-elena-rodriguez',
      slug: 'elena-rodriguez',
      avatar_url: null,
      headline: 'Gottman-Certified Couples Therapist',
      credentials: ['LMFT', 'Gottman Level 3'],
      specialties: ['couples', 'relationships', 'family'],
      years_experience: 12,
      is_verified: true,
    },
    save_count: 445,
    use_count: 2200,
    rating: 4.8,
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-06-18T00:00:00Z',
    published: true,
  },
]

// Get unique tags from all resources
export function getAvailableTags(): string[] {
  const allTags = sampleLibraryResources.flatMap((r) => r.tags)
  return [...new Set(allTags)].sort()
}

// Filter resources
export function filterResources(
  resources: LibraryResource[],
  filters: {
    search?: string
    types?: string[]
    categories?: string[]
    tags?: string[]
    age_group?: string | null
    difficulty?: string | null
    is_curated?: boolean | null
    duration_max?: number | null
  }
): LibraryResource[] {
  return resources.filter((resource) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description.toLowerCase().includes(searchLower) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      if (!matchesSearch) return false
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(resource.type)) return false
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(resource.category)) return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((tag) => resource.tags.includes(tag))) return false
    }

    // Age group filter
    if (filters.age_group) {
      if (resource.age_group !== filters.age_group && resource.age_group !== 'all') return false
    }

    // Difficulty filter
    if (filters.difficulty) {
      if (resource.difficulty !== filters.difficulty) return false
    }

    // Curated filter
    if (filters.is_curated !== null && filters.is_curated !== undefined) {
      if (resource.is_curated !== filters.is_curated) return false
    }

    // Duration filter
    if (filters.duration_max && resource.duration_minutes) {
      if (resource.duration_minutes > filters.duration_max) return false
    }

    return true
  })
}
