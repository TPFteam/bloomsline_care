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

export interface SummaryContext {
  member: Member
  sessions: Session[]
  notes: ProgressNote[]
  milestones: Milestone[]
  reflections: MemberReflection[]
  sharedResources: SharedResource[]
  milestoneComments: MilestoneComment[]
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

Respond with a valid JSON object containing these sections:

{
  "current_status": "A 2-3 sentence overview of where the client currently is in their therapeutic journey",
  "progress_highlights": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "key_themes": ["Theme 1", "Theme 2", "Theme 3"],
  "areas_of_attention": ["Concern 1", "Concern 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "next_steps": ["Action item 1", "Action item 2"]
}

Keep each section concise:
- current_status: 2-3 sentences
- progress_highlights: 3-5 bullet points
- key_themes: 3-5 bullet points
- areas_of_attention: 2-4 bullet points
- recommendations: 2-4 bullet points
- next_steps: 2-3 bullet points`
}

/**
 * Build the user prompt with all member context
 */
export function buildSummaryPrompt(context: SummaryContext): string {
  const { member, sessions, notes, milestones, reflections, sharedResources, milestoneComments, locale } = context

  const sections: string[] = []

  // Member Profile
  sections.push(`## Client Profile

Name: ${member.first_name} ${member.last_name}
Status: ${member.status}
Engagement Level: ${member.engagement_level}
Member Since: ${formatDate(member.created_at, locale)}
Last Session: ${member.last_session_at ? formatDate(member.last_session_at, locale) : 'Never'}`)

  // Therapeutic Context
  if (member.internal_notes || member.preferences) {
    const contextParts: string[] = []

    if (member.internal_notes) {
      contextParts.push(`Internal Notes: ${member.internal_notes}`)
    }

    const prefs = member.preferences
    if (prefs) {
      if (prefs.therapeutic_context) {
        const context = typeof prefs.therapeutic_context === 'object' && 'en' in prefs.therapeutic_context
          ? prefs.therapeutic_context[locale === 'fr' ? 'fr' : 'en']
          : prefs.therapeutic_context
        if (context) contextParts.push(`Therapeutic Context: ${context}`)
      }

      const strengths = getLocalizedArray(prefs.key_strengths, locale)
      if (strengths.length > 0) {
        contextParts.push(`Key Strengths: ${strengths.join(', ')}`)
      }

      const sensitivities = getLocalizedArray(prefs.areas_of_sensitivity, locale)
      if (sensitivities.length > 0) {
        contextParts.push(`Areas of Sensitivity: ${sensitivities.join(', ')}`)
      }

      const commStyles = getLocalizedArray(prefs.communication_style, locale)
      if (commStyles.length > 0) {
        contextParts.push(`Communication Style: ${commStyles.join(', ')}`)
      }
    }

    if (contextParts.length > 0) {
      sections.push(`## Background & Preferences\n\n${contextParts.join('\n')}`)
    }
  }

  // Sessions Summary
  if (sessions.length > 0) {
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const sessionSummaries = completedSessions.slice(0, 10).map(session => {
      const parts = [`- ${formatDate(session.scheduled_at, locale)}: ${getSessionTypeLabel(session.session_type)}`]

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

  // Progress Notes
  if (notes.length > 0) {
    const recentNotes = notes.slice(0, 8).map(note => {
      return `- [${note.note_type}] ${formatDate(note.created_at, locale)}: ${truncate(note.content, 150)}`
    })

    sections.push(`## Progress Notes (${notes.length} total, showing recent ${Math.min(8, notes.length)})\n\n${recentNotes.join('\n')}`)
  }

  // Milestones & Goals
  if (milestones.length > 0) {
    const activeGoals = milestones.filter(m => !m.achieved && (m.status === 'building' || m.status === 'thriving'))
    const achievedGoals = milestones.filter(m => m.achieved || m.status === 'independent')

    const goalsSummary: string[] = []

    if (activeGoals.length > 0) {
      goalsSummary.push(`Active Goals (${activeGoals.length}):`)
      activeGoals.forEach(goal => {
        goalsSummary.push(`- ${goal.title} [${goal.category}]: ${goal.description || 'No description'}`)
      })
    }

    if (achievedGoals.length > 0) {
      goalsSummary.push(`\nAchieved Goals (${achievedGoals.length}):`)
      achievedGoals.slice(0, 5).forEach(goal => {
        goalsSummary.push(`- ${goal.title} (achieved ${goal.achieved_at ? formatDate(goal.achieved_at, locale) : 'date unknown'})`)
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

function getLocalizedArray(
  value: string[] | string | { en: string[]; fr: string[] } | null | undefined,
  locale: string
): string[] {
  if (!value) return []
  if (typeof value === 'object' && 'en' in value && 'fr' in value) {
    return (value as { en: string[]; fr: string[] })[locale === 'fr' ? 'fr' : 'en'] || []
  }
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
}
