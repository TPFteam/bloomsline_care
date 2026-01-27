'use client'

import { GuideStep } from '../FeatureGuide'
import {
  SeedsWelcomeAnimation,
  SeedsGrowLetGoAnimation,
  SeedsAddAnimation,
  SeedsDailyTrackAnimation,
  SeedsProgressAnimation
} from './SeedsGuideAnimations'

export const seedsGuideSteps: GuideStep[] = [
  {
    animation: <SeedsWelcomeAnimation />,
    titleEn: "Welcome to Daily Seeds",
    titleFr: "Bienvenue dans Graines du Jour",
    descriptionEn: "Plant seeds of intention each day. Small, consistent actions help you become who you want to be.",
    descriptionFr: "Plantez des graines d'intention chaque jour. De petites actions constantes vous aident à devenir qui vous voulez être.",
  },
  {
    animation: <SeedsGrowLetGoAnimation />,
    titleEn: "Grow & Let Go",
    titleFr: "Garder et Alléger",
    descriptionEn: "Choose what to nurture more of, and what to gently release. Both paths lead to growth.",
    descriptionFr: "Choisissez ce que vous voulez cultiver davantage et ce que vous souhaitez libérer doucement. Les deux chemins mènent à la croissance.",
  },
  {
    animation: <SeedsAddAnimation />,
    titleEn: "Choose Your Seeds",
    titleFr: "Choisissez vos graines",
    descriptionEn: "Pick from suggested seeds or create your own. These become your daily intentions.",
    descriptionFr: "Choisissez parmi les graines suggérées ou créez les vôtres. Elles deviennent vos intentions quotidiennes.",
  },
  {
    animation: <SeedsDailyTrackAnimation />,
    titleEn: "Tend Daily",
    titleFr: "Cultivez chaque jour",
    descriptionEn: "Check in each day. A simple tap to acknowledge when you've nurtured a seed.",
    descriptionFr: "Faites le point chaque jour. Un simple tap pour reconnaître quand vous avez nourri une graine.",
  },
  {
    animation: <SeedsProgressAnimation />,
    titleEn: "Watch Yourself Grow",
    titleFr: "Regardez-vous grandir",
    descriptionEn: "Over time, see your patterns emerge. Celebrate your progress and adjust as needed.",
    descriptionFr: "Avec le temps, voyez vos tendances émerger. Célébrez vos progrès et ajustez selon vos besoins.",
  }
]
