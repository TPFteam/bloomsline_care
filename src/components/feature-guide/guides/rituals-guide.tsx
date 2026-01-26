'use client'

import { GuideStep } from '../FeatureGuide'
import {
  RitualsWelcomeAnimation,
  RitualsCategoriesAnimation,
  RitualsTrackingAnimation,
  RitualsReflectAnimation,
  RitualsAddAnimation
} from './RitualsGuideAnimations'

export const ritualsGuideSteps: GuideStep[] = [
  {
    animation: <RitualsWelcomeAnimation />,
    titleEn: "Welcome to Rituals",
    titleFr: "Bienvenue dans Rituels",
    descriptionEn: "Build healthy daily habits that nurture your wellbeing. Small consistent actions create lasting change.",
    descriptionFr: "Construisez des habitudes quotidiennes saines qui nourrissent votre bien-être. De petites actions constantes créent un changement durable.",
  },
  {
    animation: <RitualsCategoriesAnimation />,
    titleEn: "Choose Your Time",
    titleFr: "Choisissez votre moment",
    descriptionEn: "Organize rituals by time of day: morning to energize, midday to reset, evening to unwind, or self-care anytime.",
    descriptionFr: "Organisez vos rituels par moment: matin pour vous énergiser, midi pour vous ressourcer, soir pour vous détendre.",
  },
  {
    animation: <RitualsTrackingAnimation />,
    titleEn: "Track Your Way",
    titleFr: "Suivez à votre façon",
    descriptionEn: "Check off completions, use a timer for mindful practice, or build streaks to stay motivated.",
    descriptionFr: "Cochez vos accomplissements, utilisez un minuteur pour une pratique consciente, ou construisez des séries.",
  },
  {
    animation: <RitualsReflectAnimation />,
    titleEn: "Reflect & Feel",
    titleFr: "Réfléchissez et ressentez",
    descriptionEn: "After each ritual, take a moment to notice how you feel. Add notes to deepen your practice.",
    descriptionFr: "Après chaque rituel, prenez un moment pour observer comment vous vous sentez. Ajoutez des notes pour approfondir votre pratique.",
  },
  {
    animation: <RitualsAddAnimation />,
    titleEn: "Make It Yours",
    titleFr: "Personnalisez",
    descriptionEn: "Choose from suggested rituals or create your own. Your practice, your way.",
    descriptionFr: "Choisissez parmi les rituels suggérés ou créez les vôtres. Votre pratique, à votre façon.",
  }
]
