/**
 * Bloom Assist — AI quick-action prompt builder for the Notes tab
 */

import type { Member, Session, ProgressNote, Milestone } from '@/types/member'

export type SupportedLocale = 'en' | 'fr' | 'es'

export type PromptKey =
  | 'summarize_session'
  | 'key_themes'
  | 'focus_next'
  | 'session_reflection'
  | 'note_suggestions'

export interface AssistContext {
  member: Member
  sessions: Session[]
  notes: ProgressNote[]
  milestones: Milestone[]
}

const LANGUAGE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  en: 'Respond in English.',
  fr: 'Repondez en francais.',
  es: 'Responde en espanol.',
}

/**
 * System prompt for Bloom Assist quick actions
 */
export function getAssistSystemPrompt(locale: SupportedLocale): string {
  return `You are Bloom Assist, a concise clinical helper for mental health practitioners. You provide brief, actionable insights based on client data.

## Guidelines
- Be concise: 3-6 sentences or short bullet points.
- Use professional clinical language.
- Base observations only on the provided data. Never speculate or diagnose.
- Maintain a supportive, objective tone.
- Output plain text only — no markdown, no JSON, no headings.

${LANGUAGE_INSTRUCTIONS[locale]}`
}

/**
 * Build the user prompt with context + specific instruction per prompt key
 */
export function buildAssistUserPrompt(
  promptKey: PromptKey,
  context: AssistContext,
  locale: SupportedLocale
): string {
  const { member, sessions, notes, milestones } = context
  const sections: string[] = []

  // Member basics
  sections.push(`Client: ${member.first_name} ${member.last_name} (${member.status}, engagement: ${member.engagement_level})`)

  // Recent sessions
  const completedSessions = sessions.filter(s => s.status === 'completed')
  if (completedSessions.length > 0) {
    const sessionLines = completedSessions.slice(0, 10).map(s => {
      const date = new Date(s.scheduled_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      const parts = [`${date}: ${s.session_type}`]
      if (s.mood_rating) parts[0] += ` (mood: ${s.mood_rating}/10)`
      if (s.notes) parts.push(truncate(s.notes, 150))
      if (s.summary) parts.push(truncate(s.summary, 150))
      return parts.join(' — ')
    })
    sections.push(`Recent sessions:\n${sessionLines.join('\n')}`)
  }

  // Recent notes
  if (notes.length > 0) {
    const noteLines = notes.slice(0, 15).map(n => {
      const date = new Date(n.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      return `[${n.note_type}] ${date}: ${truncate(n.content, 120)}`
    })
    sections.push(`Recent notes:\n${noteLines.join('\n')}`)
  }

  // Milestones
  if (milestones.length > 0) {
    const milestoneLines = milestones.slice(0, 8).map(m => {
      const status = m.achieved ? 'achieved' : m.status
      return `- ${m.title} [${m.category}] (${status})`
    })
    sections.push(`Goals:\n${milestoneLines.join('\n')}`)
  }

  // Specific instruction per prompt key
  const instructions = getPromptInstruction(promptKey, locale)
  sections.push(`---\n${instructions}`)

  return sections.join('\n\n')
}

function getPromptInstruction(key: PromptKey, locale: SupportedLocale): string {
  const instructions: Record<SupportedLocale, Record<PromptKey, string>> = {
    en: {
      summarize_session: 'Summarize the most recent session in 3-5 concise sentences, highlighting mood, key topics discussed, and any notable observations.',
      key_themes: 'Identify 3-5 recurring themes across recent sessions and notes. For each theme, provide a brief supporting observation.',
      focus_next: 'Based on the client\'s progress and current goals, suggest 2-3 specific areas to focus on in the next session.',
      session_reflection: 'Provide a brief clinical reflection on the most recent session: what went well, what could be explored further, and any patterns emerging.',
      note_suggestions: 'Suggest 2-3 specific observations or follow-up items worth documenting as progress notes based on recent sessions.',
    },
    fr: {
      summarize_session: 'Resumez la seance la plus recente en 3-5 phrases concises, en soulignant l\'humeur, les sujets cles abordes et toute observation notable.',
      key_themes: 'Identifiez 3-5 themes recurrents dans les seances et notes recentes. Pour chaque theme, fournissez une breve observation.',
      focus_next: 'En fonction des progres du client et des objectifs actuels, suggerez 2-3 domaines specifiques sur lesquels se concentrer lors de la prochaine seance.',
      session_reflection: 'Fournissez une breve reflexion clinique sur la seance la plus recente : ce qui s\'est bien passe, ce qui pourrait etre explore davantage, et les tendances emergentes.',
      note_suggestions: 'Suggerez 2-3 observations specifiques ou elements de suivi a documenter comme notes de progres en fonction des seances recentes.',
    },
    es: {
      summarize_session: 'Resume la sesion mas reciente en 3-5 oraciones concisas, destacando el estado de animo, los temas clave discutidos y cualquier observacion notable.',
      key_themes: 'Identifica 3-5 temas recurrentes en las sesiones y notas recientes. Para cada tema, proporciona una breve observacion de apoyo.',
      focus_next: 'Basandote en el progreso del cliente y los objetivos actuales, sugiere 2-3 areas especificas en las que enfocarse en la proxima sesion.',
      session_reflection: 'Proporciona una breve reflexion clinica sobre la sesion mas reciente: que salio bien, que podria explorarse mas y que patrones estan surgiendo.',
      note_suggestions: 'Sugiere 2-3 observaciones especificas o elementos de seguimiento que vale la pena documentar como notas de progreso basandose en las sesiones recientes.',
    },
  }

  return instructions[locale][key]
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
