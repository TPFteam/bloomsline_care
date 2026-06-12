/**
 * AI-powered therapeutic summary prompt builder
 */

import type { Member, Session, ProgressNote, Milestone } from '@/types/member'

export type SupportedLocale = 'en' | 'fr' | 'es'

interface MemberReflection {
  id: string
  mood_value: number | null
  gratitude_entries: string[] | null
  created_at: string
}

interface SharedResource {
  id: string
  shared_at: string
  viewed_at: string | null
  resource?: {
    title: string
    type: string
  }
}

interface MilestoneComment {
  id: string
  content: string
  created_at: string
  milestone_id: string
}

// Patient-shared moment from the B2C mobile app, plus its conversation
// thread with the practitioner (if any).
interface SharedMomentInput {
  id: string
  type: string
  moods: string[] | null
  caption: string | null
  text_content: string | null
  created_at: string
  shared_with_practitioner_at: string | null
  comments?: Array<{ author_type: 'practitioner' | 'member'; content: string; created_at: string }>
}

// Patient-authored story (mobile app journal) that was shared with the
// practitioner. Content is JSONB blocks — we extract plain text for
// the prompt so the model isn't choking on layout JSON.
interface PatientStoryInput {
  id: string
  title: string | null
  shared_at: string
  excerpt: string | null
}

// Practitioner-shared resource that the patient actually filled out.
interface ResourceResponseInput {
  id: string
  resource_title: string | null
  resource_type: string | null
  status: string | null
  submitted_at: string | null
  answers_summary: string | null
}

// Scheduled / past bookings (gives the model timeline context the
// `sessions` query alone doesn't surface — e.g. several no-shows in a
// row, or an upcoming first-session-back after a gap).
interface BookingInput {
  id: string
  start_time: string
  status: string | null
  session_type: string | null
  session_format: string | null
}

export interface SummaryContext {
  member: Member
  sessions: Session[]
  notes: ProgressNote[]
  milestones: Milestone[]
  reflections: MemberReflection[]
  sharedResources: SharedResource[]
  milestoneComments: MilestoneComment[]
  sharedMoments?: SharedMomentInput[]
  patientStories?: PatientStoryInput[]
  resourceResponses?: ResourceResponseInput[]
  bookings?: BookingInput[]
  // Pre-serialized "About patient" sections (replaces internal_notes/preferences)
  aboutText?: string
  locale: SupportedLocale
}

const LANGUAGE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  en: 'Respond in English.',
  fr: 'Répondez en français.',
  es: 'Responde en español.',
}

/**
 * System prompt for therapeutic summary generation
 */
export function getSummarySystemPrompt(locale: SupportedLocale): string {
  return `You are a clinical documentation assistant helping mental health practitioners create therapeutic summaries for their clients. Your role is to synthesize information objectively and professionally.

## Guidelines

1. **Professional Clinical Language**: Use clear, objective clinical terminology appropriate for practitioner documentation.

2. **Objective and Factual**: Base observations only on the provided data. Never speculate or make diagnoses.

3. **Highlight Patterns**: Identify recurring themes, progress trends, and areas of growth or concern.

4. **Supportive Tone**: While objective, maintain a supportive and hopeful perspective that acknowledges the client's journey.

5. **Never Diagnose**: Do not provide diagnoses or clinical recommendations beyond what's documented. You are summarizing, not diagnosing.

6. **Privacy Conscious**: This summary is for the practitioner's use. Be thorough but professional.

${LANGUAGE_INSTRUCTIONS[locale]}

## Output Format

Respond with a valid JSON object containing BOTH the legacy fields (for backward compatibility) AND a structured \`v2\` object for visual rendering:

{
  "current_status": "A 2-3 sentence overview (legacy)",
  "progress_highlights": ["Plain bullet 1", "Plain bullet 2"],
  "key_themes": ["Theme 1", "Theme 2"],
  "areas_of_attention": ["Concern 1"],
  "recommendations": ["Recommendation 1"],
  "next_steps": ["Action 1"],

  "v2": {
    "sentiment": "progressing" | "stable" | "plateau" | "attention",
    "status_headline": "Short headline, max 12 words. No clinical jargon.",
    "status_detail": "1-2 sentences expanding the headline.",

    "themes": [
      { "label": "anxiety", "tone": "concerning", "sources": [{ "type": "session", "id": "abc-123" }] },
      { "label": "self-compassion", "tone": "positive", "sources": [{ "type": "note", "id": "def-456" }] }
    ],

    "highlights": [
      { "title": "Started journaling daily", "detail": "Reports calmer mornings since week 3.", "type": "progress", "sources": [{ "type": "session", "id": "abc-123" }, { "type": "session", "id": "ghi-789" }] },
      { "title": "Strong social support", "detail": "Reliable network of two close friends mentioned across 4 sessions.", "type": "strength", "sources": [{ "type": "session", "id": "abc-123" }] },
      { "title": "Completed exposure goal", "detail": "Achieved hierarchy step 3 (public speaking).", "type": "milestone", "sources": [{ "type": "milestone", "id": "mil-001" }] },
      { "title": "Pattern: anxiety after work calls", "detail": "Mentioned in 3 of last 5 sessions.", "type": "insight", "sources": [{ "type": "session", "id": "abc-123" }] }
    ],

    "attention": [
      { "title": "Sleep regression", "detail": "Reported poor sleep last 2 sessions.", "severity": "medium", "sources": [{ "type": "session", "id": "abc-123" }] },
      { "title": "Missed last 2 reflections", "detail": "Engagement may be dropping.", "severity": "low" }
    ],

    "recommendations": [
      { "title": "Revisit grounding techniques", "detail": "Consider re-introducing 5-4-3-2-1 from session 4.", "timeframe": "next_session", "sources": [{ "type": "session", "id": "abc-123" }] },
      { "title": "Check in on medication", "detail": "Patient mentioned starting new SSRI 3 weeks ago.", "timeframe": "this_week", "sources": [{ "type": "note", "id": "def-456" }] }
    ],

    "next_steps": [
      "Schedule follow-up within 2 weeks",
      "Share sleep hygiene resource",
      "Review goal hierarchy progress"
    ]
  }
}

### Guidance for v2 fields

- **sentiment**: pick ONE based on overall trajectory:
  - \`progressing\` = clear forward movement, mood improving, goals advancing
  - \`stable\` = steady, no major changes, maintaining gains
  - \`plateau\` = stuck, no progress for a while, may need new approach
  - \`attention\` = concerning trend, regression, or risk signals

- **status_headline**: ONE short sentence, plain language, no jargon. Examples: "Steady progress on anxiety, sleep needs attention." / "Strong therapeutic alliance, plateau on social goals."

- **themes**: 3-6 short noun phrases (1-3 words each). \`tone\` reflects whether the theme is a strength, neutral observation, or concern.

- **highlights**: 3-5 items. \`type\` distinguishes:
  - \`progress\` = forward movement
  - \`strength\` = existing resource the patient leverages
  - \`milestone\` = goal achieved
  - \`insight\` = pattern you noticed in the data

- **attention**: 0-4 items. \`severity\`:
  - \`high\` = urgent, address next session
  - \`medium\` = monitor closely
  - \`low\` = note for awareness

- **recommendations**: 0-4 items. \`timeframe\`:
  - \`this_week\` = act before next session
  - \`next_session\` = bring up in upcoming session
  - \`ongoing\` = thematic, no specific deadline

- **next_steps**: 2-4 short imperative actions.

### Citation rules (CRITICAL)

Every claim in highlights, attention, recommendations, and themes should cite the source data it came from. Use the IDs from the input:

- Each input record is tagged with \`[type:id]\` — for example \`[session:abc-123]\`, \`[note:def-456]\`, \`[milestone:mil-001]\`, \`[file:xyz-789]\`
- In the JSON output, attach a \`sources\` array to each item: \`"sources": [{ "type": "session", "id": "abc-123" }]\`
- Valid types are: \`session\`, \`note\`, \`milestone\`, \`file\`
- ONLY cite IDs that you actually saw in the input. Do not invent IDs.
- Cite up to 4 sources per item. If a claim spans many records, pick the most representative.
- If an item is general/synthesized and has no specific source, omit the \`sources\` field entirely.

Keep all titles and labels short. Detail fields should be 1-2 sentences max.

Both the legacy fields AND v2 must be present — the legacy fields are for older clients that haven't been updated yet.`
}

/**
 * Build the user prompt with all member context
 */
export function buildSummaryPrompt(context: SummaryContext): string {
  const { member, sessions, notes, milestones, reflections, sharedResources, milestoneComments, aboutText, locale } = context

  const sections: string[] = []

  // Member Profile
  sections.push(`## Client Profile

Name: ${member.first_name} ${member.last_name}
Status: ${member.status}
Engagement Level: ${member.engagement_level}
Member Since: ${formatDate(member.created_at, locale)}
Last Session: ${member.last_session_at ? formatDate(member.last_session_at, locale) : 'Never'}`)

  // About the patient — the practitioner's customizable sections
  // (replaces the legacy internal_notes / preferences surface).
  if (aboutText && aboutText.trim()) {
    sections.push(`## Background & Preferences\n\n${aboutText.trim()}`)
  }

  // Sessions Summary — include IDs so AI can cite them
  if (sessions.length > 0) {
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const sessionSummaries = completedSessions.slice(0, 10).map(session => {
      const parts = [`- [session:${session.id}] ${formatDate(session.scheduled_at, locale)}: ${getSessionTypeLabel(session.session_type)}`]

      if (session.mood_rating) {
        parts[0] += ` (Mood: ${session.mood_rating}/10)`
      }

      if (session.notes) {
        parts.push(`  Notes: ${truncate(session.notes, 200)}`)
      }

      if (session.summary) {
        parts.push(`  Summary: ${truncate(session.summary, 200)}`)
      }

      if (session.goals && session.goals.length > 0) {
        const achievedGoals = session.goals.filter(g => g.achieved).length
        parts.push(`  Goals: ${achievedGoals}/${session.goals.length} achieved`)
      }

      return parts.join('\n')
    })

    sections.push(`## Session History (${completedSessions.length} completed, showing recent ${Math.min(10, completedSessions.length)})\n\n${sessionSummaries.join('\n\n')}`)
  } else {
    sections.push(`## Session History\n\nNo sessions recorded yet.`)
  }

  // Progress Notes — include IDs
  if (notes.length > 0) {
    const recentNotes = notes.slice(0, 8).map(note => {
      return `- [note:${note.id}] [${note.note_type}] ${formatDate(note.created_at, locale)}: ${truncate(note.content, 150)}`
    })

    sections.push(`## Progress Notes (${notes.length} total, showing recent ${Math.min(8, notes.length)})\n\n${recentNotes.join('\n')}`)
  }

  // Milestones & Goals — include IDs
  if (milestones.length > 0) {
    const activeGoals = milestones.filter(m => !m.achieved && (m.status === 'building' || m.status === 'thriving'))
    const achievedGoals = milestones.filter(m => m.achieved || m.status === 'independent')

    const goalsSummary: string[] = []

    if (activeGoals.length > 0) {
      goalsSummary.push(`Active Goals (${activeGoals.length}):`)
      activeGoals.forEach(goal => {
        goalsSummary.push(`- [milestone:${goal.id}] ${goal.title} [${goal.category}]: ${goal.description || 'No description'}`)
      })
    }

    if (achievedGoals.length > 0) {
      goalsSummary.push(`\nAchieved Goals (${achievedGoals.length}):`)
      achievedGoals.slice(0, 5).forEach(goal => {
        goalsSummary.push(`- [milestone:${goal.id}] ${goal.title} (achieved ${goal.achieved_at ? formatDate(goal.achieved_at, locale) : 'date unknown'})`)
      })
    }

    sections.push(`## Goals & Milestones\n\n${goalsSummary.join('\n')}`)
  }

  // Milestone Comments (Goal Notes)
  if (milestoneComments.length > 0) {
    const recentComments = milestoneComments.slice(0, 5).map(comment => {
      return `- ${formatDate(comment.created_at, locale)}: ${truncate(comment.content, 100)}`
    })

    sections.push(`## Goal Notes\n\n${recentComments.join('\n')}`)
  }

  // Member Reflections (if available)
  if (reflections.length > 0) {
    const moodValues = reflections.filter(r => r.mood_value !== null).map(r => r.mood_value as number)
    const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : 'N/A'

    const recentReflections = reflections.slice(0, 5).map(ref => {
      const parts = [`- ${formatDate(ref.created_at, locale)}`]
      if (ref.mood_value !== null) parts[0] += `: Mood ${ref.mood_value}/10`
      if (ref.gratitude_entries && ref.gratitude_entries.length > 0) {
        parts.push(`  Gratitude: ${ref.gratitude_entries.join(', ')}`)
      }
      return parts.join('\n')
    })

    sections.push(`## Client Self-Reflections (${reflections.length} total, avg mood: ${avgMood}/10)\n\n${recentReflections.join('\n')}`)
  }

  // Shared Resources
  if (sharedResources.length > 0) {
    const viewedCount = sharedResources.filter(r => r.viewed_at).length
    const resourceList = sharedResources.slice(0, 5).map(r => {
      const status = r.viewed_at ? 'viewed' : 'not viewed'
      return `- ${r.resource?.title || 'Resource'} (${r.resource?.type || 'unknown'}) - ${status}`
    })

    sections.push(`## Shared Resources (${sharedResources.length} shared, ${viewedCount} viewed)\n\n${resourceList.join('\n')}`)
  }

  // Resource Responses — what the patient actually submitted on
  // worksheets / assessments the practitioner shared with them.
  const responses = context.resourceResponses || []
  if (responses.length > 0) {
    const list = responses.slice(0, 8).map(r => {
      const when = r.submitted_at ? formatDate(r.submitted_at, locale) : '—'
      const head = `- [${when}] ${r.resource_title || 'Resource'} (${r.resource_type || 'unknown'}) · ${r.status || 'submitted'}`
      return r.answers_summary ? `${head}\n  ${r.answers_summary}` : head
    })
    sections.push(`## Resource Responses (${responses.length} total, showing recent ${Math.min(8, responses.length)})\n\n${list.join('\n')}`)
  }

  // Patient-shared Moments (B2C mobile app). Each captures a mood +
  // optional text / caption. Sample includes the practitioner ↔ patient
  // comment thread when there is one so the model sees the dialogue
  // context, not just the moment.
  const sharedMoments = context.sharedMoments || []
  if (sharedMoments.length > 0) {
    const list = sharedMoments.slice(0, 10).map(m => {
      const when = formatDate(m.shared_with_practitioner_at || m.created_at, locale)
      const moods = (m.moods || []).join(', ') || '—'
      const body = (m.text_content || m.caption || '').trim().slice(0, 280)
      const lines = [`- [${when}] type=${m.type} · moods=${moods}`]
      if (body) lines.push(`  "${body}"`)
      if (m.comments && m.comments.length > 0) {
        lines.push('  Conversation:')
        for (const c of m.comments.slice(0, 4)) {
          lines.push(`    [${c.author_type}] ${c.content.trim().slice(0, 200)}`)
        }
      }
      return lines.join('\n')
    })
    sections.push(`## Shared Moments (${sharedMoments.length} shared by the patient via the mobile app, showing recent ${Math.min(10, sharedMoments.length)})\n\n${list.join('\n')}`)
  }

  // Patient-authored Stories / Journal (mobile app journal entries
  // shared with this practitioner).
  const stories = context.patientStories || []
  if (stories.length > 0) {
    const list = stories.slice(0, 6).map(s => {
      const when = formatDate(s.shared_at, locale)
      const head = `- [${when}] "${s.title || 'Untitled'}"`
      return s.excerpt ? `${head}\n  ${s.excerpt.slice(0, 300)}` : head
    })
    sections.push(`## Patient Journal Entries (${stories.length} shared with you, showing recent ${Math.min(6, stories.length)})\n\n${list.join('\n')}`)
  }

  // Bookings timeline — past + upcoming, so the model sees cadence
  // (gaps, recent no-shows, what's next) even when there's no note yet.
  const bookings = context.bookings || []
  if (bookings.length > 0) {
    const list = bookings.slice(0, 10).map(b => {
      return `- [${formatDate(b.start_time, locale)}] ${b.session_type || '—'} · ${b.session_format || '—'} · status=${b.status || '—'}`
    })
    sections.push(`## Bookings Timeline (recent ${Math.min(10, bookings.length)} of ${bookings.length})\n\n${list.join('\n')}`)
  }

  // Final instruction
  const instruction = locale === 'fr'
    ? `\n\n---\n\nBasez-vous sur les informations ci-dessus pour générer un résumé thérapeutique structuré pour ce client. Répondez avec un objet JSON valide.`
    : locale === 'es'
    ? `\n\n---\n\nBasándote en la información anterior, genera un resumen terapéutico estructurado para este cliente. Responde con un objeto JSON válido.`
    : `\n\n---\n\nBased on the information above, generate a structured therapeutic summary for this client. Respond with a valid JSON object.`

  return sections.join('\n\n') + instruction
}

/**
 * Generate a plain text summary from structured content
 */
export function generatePlainTextSummary(
  content: {
    current_status: string
    progress_highlights: string[]
    key_themes: string[]
    areas_of_attention: string[]
    recommendations: string[]
    next_steps: string[]
  },
  locale: SupportedLocale
): string {
  const labels = {
    en: {
      status: 'Current Status',
      highlights: 'Progress Highlights',
      themes: 'Key Themes',
      attention: 'Areas of Attention',
      recommendations: 'Recommendations',
      nextSteps: 'Next Steps',
    },
    fr: {
      status: 'Statut actuel',
      highlights: 'Points forts',
      themes: 'Thèmes clés',
      attention: 'Points d\'attention',
      recommendations: 'Recommandations',
      nextSteps: 'Prochaines étapes',
    },
    es: {
      status: 'Estado actual',
      highlights: 'Logros destacados',
      themes: 'Temas clave',
      attention: 'Áreas de atención',
      recommendations: 'Recomendaciones',
      nextSteps: 'Próximos pasos',
    },
  }

  const l = labels[locale]

  const sections = [
    `${l.status}:\n${content.current_status}`,
    `${l.highlights}:\n${content.progress_highlights.map(h => `• ${h}`).join('\n')}`,
    `${l.themes}:\n${content.key_themes.map(t => `• ${t}`).join('\n')}`,
    `${l.attention}:\n${content.areas_of_attention.map(a => `• ${a}`).join('\n')}`,
    `${l.recommendations}:\n${content.recommendations.map(r => `• ${r}`).join('\n')}`,
    `${l.nextSteps}:\n${content.next_steps.map(s => `• ${s}`).join('\n')}`,
  ]

  return sections.join('\n\n')
}

// Helper functions
function formatDate(date: string, locale: SupportedLocale): string {
  const d = new Date(date)
  return d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

function getSessionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    initial_consultation: 'Initial Consultation',
    follow_up: 'Follow-up',
    check_in: 'Check-in',
    crisis: 'Crisis',
    group: 'Group Session',
    other: 'Other',
  }
  return labels[type] || type
}
