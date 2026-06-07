// Curated, vetted affirmation backbone for the mobile "For You" tab.
//
// Hybrid model: these base lines are the source of truth (safe, warm, present
// tense). Bloom AI only *rephrases* them for the person — it never invents
// affirmations from scratch — and we fall back to these raw lines if the AI
// is unavailable or its output looks off. Everything is bilingual because the
// AI polishes in the user's own language.

export type AffirmationTheme =
  | 'anxiety' | 'self_worth' | 'connection' | 'burnout' | 'grief' | 'rest' | 'general'

export type AffirmationLocale = 'en' | 'fr'

/** Intake answer → theme. The mobile sends answer keys; we map here. */
export const TOPIC_TO_THEME: Record<string, AffirmationTheme> = {
  anxiety: 'anxiety',
  stress: 'anxiety',
  relationships: 'connection',
  family: 'connection',
  work: 'burnout',
  burnout: 'burnout',
  self_esteem: 'self_worth',
  grief: 'grief',
  sleep: 'rest',
  not_sure: 'general',
}

/** "What would help?" answer → a tone hint passed to the AI prompt. */
export const NEED_TO_TONE: Record<string, { en: string; fr: string }> = {
  calm: { en: 'soothing and grounding', fr: 'apaisant et rassurant' },
  reassurance: { en: 'gentle and reassuring', fr: 'doux et rassurant' },
  strength: { en: 'quietly empowering', fr: 'qui redonne de la force, sans excès' },
  hope: { en: 'warm and hopeful', fr: 'chaleureux et porteur d’espoir' },
  rest: { en: 'permission-giving and restful', fr: 'qui autorise le repos' },
}

export const AFFIRMATIONS: Record<AffirmationTheme, Record<AffirmationLocale, string[]>> = {
  anxiety: {
    en: [
      'This feeling is real, and it will pass.',
      'I can breathe slowly and let my body soften.',
      'I don’t have to figure everything out right now.',
      'I am safe in this moment.',
      'One small step is enough for today.',
    ],
    fr: [
      'Ce que je ressens est réel, et cela va passer.',
      'Je peux respirer lentement et laisser mon corps se détendre.',
      'Je n’ai pas besoin de tout résoudre maintenant.',
      'Je suis en sécurité dans cet instant.',
      'Un petit pas suffit pour aujourd’hui.',
    ],
  },
  self_worth: {
    en: [
      'My worth isn’t something I have to earn.',
      'I am allowed to take up space.',
      'I am doing the best I can with what I have.',
      'I can be kind to myself, especially today.',
      'I am more than my hardest moments.',
    ],
    fr: [
      'Ma valeur n’est pas quelque chose que je dois mériter.',
      'J’ai le droit d’exister pleinement.',
      'Je fais de mon mieux avec ce que j’ai.',
      'Je peux être bienveillant(e) envers moi, surtout aujourd’hui.',
      'Je suis bien plus que mes moments difficiles.',
    ],
  },
  connection: {
    en: [
      'I am worthy of warmth and connection.',
      'It’s okay to need other people.',
      'I can reach out, even imperfectly.',
      'I deserve relationships that feel safe.',
      'I am not a burden for having needs.',
    ],
    fr: [
      'Je mérite de la tendresse et des liens sincères.',
      'C’est normal d’avoir besoin des autres.',
      'Je peux tendre la main, même maladroitement.',
      'Je mérite des relations où je me sens en sécurité.',
      'Avoir des besoins ne fait pas de moi un fardeau.',
    ],
  },
  burnout: {
    en: [
      'Rest is productive too.',
      'I don’t have to earn my right to slow down.',
      'I can do less and still be enough.',
      'My value isn’t measured by what I produce.',
      'It’s okay to set the work down for now.',
    ],
    fr: [
      'Le repos est utile, lui aussi.',
      'Je n’ai pas à mériter le droit de ralentir.',
      'Je peux en faire moins et rester suffisant(e).',
      'Ma valeur ne se mesure pas à ce que je produis.',
      'Je peux poser le travail pour le moment.',
    ],
  },
  grief: {
    en: [
      'There’s no right way to grieve.',
      'I can hold sadness and still keep going.',
      'What I lost mattered, and so do I.',
      'I can take this one breath at a time.',
      'It’s okay to not be okay right now.',
    ],
    fr: [
      'Il n’y a pas de bonne façon de faire son deuil.',
      'Je peux porter ma tristesse et continuer d’avancer.',
      'Ce que j’ai perdu comptait, et moi aussi.',
      'Je peux avancer une respiration à la fois.',
      'C’est normal de ne pas aller bien en ce moment.',
    ],
  },
  rest: {
    en: [
      'I am allowed to rest without guilt.',
      'My body deserves gentleness tonight.',
      'I can let today be enough.',
      'Slowing down is a kind of care.',
      'I release what I cannot finish today.',
    ],
    fr: [
      'J’ai le droit de me reposer sans culpabilité.',
      'Mon corps mérite de la douceur ce soir.',
      'Je peux laisser cette journée être suffisante.',
      'Ralentir est une forme de soin.',
      'Je lâche ce que je ne peux pas terminer aujourd’hui.',
    ],
  },
  general: {
    en: [
      'I am exactly where I need to begin.',
      'I can be gentle with myself today.',
      'Whatever I’m feeling is allowed.',
      'I am growing, even when it’s hard to see.',
      'This moment is mine to start fresh.',
    ],
    fr: [
      'Je suis exactement là où je dois commencer.',
      'Je peux être doux/douce avec moi aujourd’hui.',
      'Tout ce que je ressens a le droit d’exister.',
      'Je grandis, même quand c’est difficile à voir.',
      'Cet instant est à moi pour repartir.',
    ],
  },
}

export function baseAffirmations(theme: AffirmationTheme, locale: AffirmationLocale): string[] {
  return (AFFIRMATIONS[theme] || AFFIRMATIONS.general)[locale] || AFFIRMATIONS.general.en
}
