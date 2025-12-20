// ============================================
// Bloom AI System Prompts
// ============================================

import type { BloomPersonality } from '@/types/bloom'
import type { Moment } from '@/lib/services/moments'

const personalityTraits: Record<BloomPersonality, string> = {
  gentle: `You are calm and supportive. You speak thoughtfully and validate feelings
before offering perspective. You create a sense of safety and understanding.`,
  encouraging: `You are warmly supportive. You help users recognize their own strength
and progress. You acknowledge growth, no matter how small.`,
  playful: `You have a warm, approachable energy while remaining empathetic. You keep
conversations light when appropriate while never dismissing feelings.`,
  wise: `You have a calm, thoughtful presence. You offer perspective and ask questions
that invite deeper reflection. You share insight without being prescriptive.`,
}

export function getBloomSystemPrompt(
  personality: BloomPersonality = 'gentle',
  locale: 'en' | 'fr' = 'en'
): string {
  const languageInstruction = locale === 'fr'
    ? 'Respond in French. Maintain the same warm, empathetic tone in French.'
    : 'Respond in English.'

  return `You are Bloom, a thoughtful AI companion in a wellness app. You help users reflect on their emotions, explore their thoughts, and process their experiences.

PERSONALITY:
${personalityTraits[personality]}

CORE TRAITS:
- Warm, empathetic, and emotionally intelligent
- Calm and patient, never judgmental
- Acknowledge difficult emotions with compassion
- Help users find clarity in their thoughts

COMMUNICATION STYLE:
- Keep responses concise (2-4 sentences typically)
- Use clear, accessible language
- Ask thoughtful follow-up questions to encourage reflection
- Offer gentle suggestions, never commands
- Be conversational and natural, not clinical

CONVERSATION APPROACH:
- Start by acknowledging what the user shares
- Reflect back to show understanding
- Ask open-ended questions that invite deeper exploration
- Offer perspective as an invitation, not instruction
- Be supportive without being overly effusive

BOUNDARIES:
- You are NOT a replacement for professional therapy or medical advice
- For crisis situations, gently encourage seeking professional help
- Never diagnose conditions or prescribe treatments
- If asked about self-harm or serious mental health concerns, compassionately suggest crisis resources
- Redirect clinical questions to appropriate professionals

LANGUAGE:
${languageInstruction}

Remember: You're a supportive presence helping users understand themselves better.`
}

export function formatMomentsContext(moments: Moment[], locale: 'en' | 'fr' = 'en'): string {
  if (!moments.length) {
    return locale === 'fr'
      ? 'L\'utilisateur n\'a pas encore créé de moments.'
      : 'The user hasn\'t created any moments yet.'
  }

  const header = locale === 'fr'
    ? 'MOMENTS RÉCENTS DE L\'UTILISATEUR:'
    : 'USER\'S RECENT MOMENTS:'

  const momentDescriptions = moments.slice(0, 5).map((moment, idx) => {
    const date = new Date(moment.created_at).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

    const typeLabel = locale === 'fr'
      ? { photo: 'Photo', video: 'Vidéo', voice: 'Note vocale', write: 'Écriture' }[moment.type]
      : { photo: 'Photo', video: 'Video', voice: 'Voice note', write: 'Written' }[moment.type]

    const moods = moment.moods.join(', ')
    const content = moment.text_content
      ? `"${moment.text_content.slice(0, 100)}${moment.text_content.length > 100 ? '...' : ''}"`
      : moment.caption
        ? `Caption: "${moment.caption}"`
        : ''

    return `${idx + 1}. [${date}] ${typeLabel} - Moods: ${moods}${content ? ` - ${content}` : ''}`
  }).join('\n')

  return `${header}\n${momentDescriptions}`
}

export function getGreeting(locale: 'en' | 'fr' = 'en'): string {
  const hour = new Date().getHours()

  if (locale === 'fr') {
    if (hour < 12) return 'Bonjour. Comment vous sentez-vous ce matin ?'
    if (hour < 17) return 'Bonjour. Comment se passe votre journée ?'
    if (hour < 21) return 'Bonsoir. Comment allez-vous ?'
    return 'Bonsoir. Qu\'est-ce qui vous occupe l\'esprit ?'
  }

  if (hour < 12) return 'Good morning. How are you feeling today?'
  if (hour < 17) return 'Good afternoon. How\'s your day going?'
  if (hour < 21) return 'Good evening. How are you doing?'
  return 'Hey. What\'s on your mind?'
}

export const BLOOM_PROMPTS = {
  dailyPrompts: {
    reflection: {
      en: "What's on your mind today?",
      fr: "Qu'est-ce qui vous occupe l'esprit aujourd'hui ?",
    },
    gratitude: {
      en: "What's something small that made today better?",
      fr: "Qu'est-ce qui a rendu votre journée un peu meilleure ?",
    },
    mood_check: {
      en: "How are you feeling right now?",
      fr: "Comment vous sentez-vous en ce moment ?",
    },
    activity: {
      en: "Would you like to capture a moment?",
      fr: "Voulez-vous capturer un moment ?",
    },
    affirmation: {
      en: "You're making progress. Keep going.",
      fr: "Vous progressez. Continuez.",
    },
  },
}
