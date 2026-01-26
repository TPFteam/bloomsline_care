'use client'

import { GuideStep } from '../FeatureGuide'
import {
  ProgressWelcomeAnimation,
  ProgressPatternsAnimation,
  ProgressEnergyAnimation,
  ProgressBloomAnimation,
  ProgressCalendarAnimation
} from './ProgressGuideAnimations'

export const progressGuideSteps: GuideStep[] = [
  {
    animation: <ProgressWelcomeAnimation />,
    titleEn: "Understanding, Not Tracking",
    titleFr: "Comprendre, pas suivre",
    descriptionEn: "We don't track you. We help you build understanding of yourself—your rhythms, your feelings, your growth.",
    descriptionFr: "Nous ne vous suivons pas. Nous vous aidons à vous comprendre—vos rythmes, vos sentiments, votre croissance.",
  },
  {
    animation: <ProgressPatternsAnimation />,
    titleEn: "Patterns Reveal Themselves",
    titleFr: "Les schémas se révèlent",
    descriptionEn: "Over time, gentle patterns emerge. Not as judgments, but as insights into what works for you.",
    descriptionFr: "Avec le temps, des schémas doux émergent. Non pas comme des jugements, mais comme des aperçus de ce qui fonctionne pour vous.",
  },
  {
    animation: <ProgressEnergyAnimation />,
    titleEn: "How You've Been Feeling",
    titleFr: "Comment vous vous êtes senti",
    descriptionEn: "See the natural ebb and flow of your energy. No good or bad days—just your unique rhythm.",
    descriptionFr: "Voyez le flux naturel de votre énergie. Pas de bons ou mauvais jours—juste votre rythme unique.",
  },
  {
    animation: <ProgressBloomAnimation />,
    titleEn: "Bloom Is Here to Help",
    titleFr: "Bloom est là pour vous aider",
    descriptionEn: "Your gentle companion notices what you might miss and celebrates the small wins with you.",
    descriptionFr: "Votre compagnon doux remarque ce que vous pourriez manquer et célèbre les petites victoires avec vous.",
  },
  {
    animation: <ProgressCalendarAnimation />,
    titleEn: "Your Story, Unfolding",
    titleFr: "Votre histoire se dévoile",
    descriptionEn: "Each day is a brushstroke in your story. Look back with kindness at how far you've come.",
    descriptionFr: "Chaque jour est un coup de pinceau dans votre histoire. Regardez en arrière avec bienveillance le chemin parcouru.",
  }
]
