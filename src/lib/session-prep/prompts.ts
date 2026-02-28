/**
 * Session Preparation — AI-powered pre-session briefing prompt builder
 */

import type { Member, Session, ProgressNote, Milestone } from '@/types/member'

export type SupportedLocale = 'en' | 'fr' | 'es'

export interface SessionPrep {
  quick_context: string
  last_session: {
    date: string
    summary: string
    mood: number | null
    key_takeaways: string[]
  } | null
  open_threads: string[]
  suggested_focus: string[]
  things_to_note: string[]
}

interface MemberReflection {
  id: string
  mood_value: number | null
  gratitude_entries: string[] | null
  created_at: string
}

export interface SessionPrepContext {
  member: Member
  targetSession: Session
  sessions: Session[]
  notes: ProgressNote[]
  milestones: Milestone[]
  reflections: MemberReflection[]
  locale: SupportedLocale
}

const LANGUAGE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  en: 'Respond in English.',
  fr: 'Répondez en français.',
  es: 'Responde en español.',
}

/**
 * System prompt for session preparation briefing
 */
export function getSessionPrepSystemPrompt(locale: SupportedLocale): string {
  return `You are a clinical briefing assistant helping mental health practitioners prepare for upcoming sessions. Your role is to synthesize client data into a scannable, structured briefing that can be reviewed in 2-3 minutes.

## Guidelines

1. **Concise and Scannable**: Every section should be brief and immediately useful. No filler.
2. **Clinical Tone**: Professional, objective, and supportive language.
3. **Data-Driven**: Base all observations on the provided data. Never speculate or diagnose.
4. **Actionable**: Focus on what the practitioner needs to know and can act on in the upcoming session.
5. **Pattern-Aware**: Highlight trends, recurring themes, and shifts in mood or engagement.

${LANGUAGE_INSTRUCTIONS[locale]}

## Output Format

Respond with a valid JSON object matching this structure exactly:

{
  "quick_context": "1-2 sentences situating this client and where they are in their journey.",
  "last_session": {
    "date": "Human-readable date of the last completed session",
    "summary": "2-3 sentence summary of what happened",
    "mood": 7,
    "key_takeaways": ["Takeaway 1", "Takeaway 2"]
  },
  "open_threads": ["Unresolved homework item", "In-progress goal"],
  "suggested_focus": ["Area to explore 1", "Area to explore 2"],
  "things_to_note": ["Sensitivity or pattern to be aware of"]
}

Rules:
- quick_context: 1-2 sentences max
- last_session: null if no completed sessions exist. mood is a number 1-10 or null.
- last_session.key_takeaways: 1-3 items
- open_threads: 0-5 items. Include unfinished homework, in-progress goals, and unresolved topics.
- suggested_focus: 2-3 items. Actionable areas for the upcoming session.
- things_to_note: 0-4 items. Sensitivities, mood trends, patterns, or anything the practitioner should keep in mind.`
}

/**
 * Build the user prompt with all member context for session preparation
 */
export function buildSessionPrepPrompt(context: SessionPrepContext): string {
  const { member, targetSession, sessions, notes, milestones, reflections, locale } = context
  const sections: string[] = []

  // Client Profile
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
      contextParts.push(`Internal Notes: ${truncate(member.internal_notes, 300)}`)
    }

    const prefs = member.preferences
    if (prefs) {
      if (prefs.therapeutic_context) {
        const tc = typeof prefs.therapeutic_context === 'object' && 'en' in prefs.therapeutic_context
          ? prefs.therapeutic_context[locale === 'fr' ? 'fr' : 'en']
          : prefs.therapeutic_context
        if (tc) contextParts.push(`Therapeutic Context: ${truncate(String(tc), 200)}`)
      }

      const strengths = getLocalizedArray(prefs.key_strengths, locale)
      if (strengths.length > 0) contextParts.push(`Key Strengths: ${strengths.join(', ')}`)

      const sensitivities = getLocalizedArray(prefs.areas_of_sensitivity, locale)
      if (sensitivities.length > 0) contextParts.push(`Areas of Sensitivity: ${sensitivities.join(', ')}`)

      const commStyles = getLocalizedArray(prefs.communication_style, locale)
      if (commStyles.length > 0) contextParts.push(`Communication Style: ${commStyles.join(', ')}`)
    }

    if (contextParts.length > 0) {
      sections.push(`## Therapeutic Context\n\n${contextParts.join('\n')}`)
    }
  }

  // Target Session
  const targetDate = new Date(targetSession.scheduled_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  sections.push(`## Upcoming Session

Date: ${targetDate}
Type: ${targetSession.session_type}
Format: ${targetSession.session_format}
Duration: ${targetSession.duration_minutes} minutes`)

  // Completed Sessions
  const completedSessions = sessions.filter(s => s.status === 'completed')
  if (completedSessions.length > 0) {
    const sessionLines = completedSessions.slice(0, 15).map(session => {
      const parts = [`- ${formatDate(session.scheduled_at, locale)}: ${session.session_type}`]

      if (session.mood_rating) parts[0] += ` (Mood: ${session.mood_rating}/10)`

      if (session.summary) parts.push(`  Summary: ${truncate(session.summary, 200)}`)
      else if (session.notes) parts.push(`  Notes: ${truncate(session.notes, 200)}`)

      if (session.goals && session.goals.length > 0) {
        const achieved = session.goals.filter(g => g.achieved).length
        parts.push(`  Goals: ${achieved}/${session.goals.length} achieved`)
        const unachieved = session.goals.filter(g => !g.achieved)
        if (unachieved.length > 0) {
          parts.push(`  Open goals: ${unachieved.map(g => g.text).join('; ')}`)
        }
      }

      if (session.homework && session.homework.length > 0) {
        const done = session.homework.filter(h => h.completed).length
        parts.push(`  Homework: ${done}/${session.homework.length} completed`)
        const pending = session.homework.filter(h => !h.completed)
        if (pending.length > 0) {
          parts.push(`  Pending homework: ${pending.map(h => h.text).join('; ')}`)
        }
      }

      return parts.join('\n')
    })

    sections.push(`## Completed Sessions (${completedSessions.length} total, showing recent ${Math.min(15, completedSessions.length)})\n\n${sessionLines.join('\n\n')}`)
  }

  // Progress Notes
  if (notes.length > 0) {
    const noteLines = notes.slice(0, 15).map(note =>
      `- [${note.note_type}] ${formatDate(note.created_at, locale)}: ${truncate(note.content, 150)}`
    )
    sections.push(`## Progress Notes (${notes.length} total, showing recent ${Math.min(15, notes.length)})\n\n${noteLines.join('\n')}`)
  }

  // Milestones
  if (milestones.length > 0) {
    const active = milestones.filter(m => !m.achieved && m.status !== 'independent')
    const achieved = milestones.filter(m => m.achieved || m.status === 'independent')

    const goalLines: string[] = []
    if (active.length > 0) {
      goalLines.push(`Active Goals (${active.length}):`)
      active.forEach(g => goalLines.push(`- ${g.title} [${g.category}] — status: ${g.status}`))
    }
    if (achieved.length > 0) {
      goalLines.push(`Achieved Goals (${achieved.length}):`)
      achieved.slice(0, 5).forEach(g =>
        goalLines.push(`- ${g.title} (achieved ${g.achieved_at ? formatDate(g.achieved_at, locale) : ''})`)
      )
    }
    sections.push(`## Goals & Milestones\n\n${goalLines.join('\n')}`)
  }

  // Reflections
  if (reflections.length > 0) {
    const moodValues = reflections.filter(r => r.mood_value !== null).map(r => r.mood_value as number)
    const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : 'N/A'

    const refLines = reflections.slice(0, 10).map(ref => {
      const parts = [`- ${formatDate(ref.created_at, locale)}`]
      if (ref.mood_value !== null) parts[0] += `: Mood ${ref.mood_value}/10`
      if (ref.gratitude_entries && ref.gratitude_entries.length > 0) {
        parts.push(`  Gratitude: ${ref.gratitude_entries.join(', ')}`)
      }
      return parts.join('\n')
    })

    sections.push(`## Client Self-Reflections (avg mood: ${avgMood}/10)\n\n${refLines.join('\n')}`)
  }

  // Final instruction
  const instruction = locale === 'fr'
    ? `\n\n---\n\nÀ partir des informations ci-dessus, générez un briefing de préparation de séance structuré. Répondez avec un objet JSON valide.`
    : locale === 'es'
    ? `\n\n---\n\nCon base en la información anterior, genera un briefing estructurado de preparación de sesión. Responde con un objeto JSON válido.`
    : `\n\n---\n\nBased on the information above, generate a structured session preparation briefing for this upcoming session. Respond with a valid JSON object.`

  return sections.join('\n\n') + instruction
}

// Helpers

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
