'use client'

import { GuideStep } from '../FeatureGuide'
import {
  FlowWelcomeAnimation,
  FlowAllInOneAnimation,
  FlowTapExploreAnimation,
  FlowNavigateAnimation,
  FlowStoryAnimation
} from './FlowGuideAnimations'

export const flowGuideSteps: GuideStep[] = [
  {
    animation: <FlowWelcomeAnimation />,
    titleEn: "Your Day at a Glance",
    titleFr: "Votre journée en un coup d'œil",
    descriptionEn: "See your entire day unfold on a visual timeline. Morning to night, everything in one place.",
    descriptionFr: "Voyez votre journée entière se dérouler sur une ligne du temps visuelle. Du matin au soir, tout en un seul endroit.",
  },
  {
    animation: <FlowAllInOneAnimation />,
    titleEn: "Everything Connected",
    titleFr: "Tout est connecté",
    descriptionEn: "Your moments, rituals, and seeds all appear here. Watch how they flow together through your day.",
    descriptionFr: "Vos moments, rituels et graines apparaissent tous ici. Observez comment ils s'enchaînent tout au long de votre journée.",
  },
  {
    animation: <FlowTapExploreAnimation />,
    titleEn: "Tap to Explore",
    titleFr: "Tapez pour explorer",
    descriptionEn: "Each point is a moment in time. Tap any one to see what you captured or completed.",
    descriptionFr: "Chaque point est un instant. Tapez sur n'importe lequel pour voir ce que vous avez capturé ou accompli.",
  },
  {
    animation: <FlowNavigateAnimation />,
    titleEn: "Travel Through Time",
    titleFr: "Voyagez dans le temps",
    descriptionEn: "Use the arrows to look back at previous days. Reflect on your journey and patterns.",
    descriptionFr: "Utilisez les flèches pour regarder les jours précédents. Réfléchissez à votre parcours et vos habitudes.",
  },
  {
    animation: <FlowStoryAnimation />,
    titleEn: "Your Story Unfolds",
    titleFr: "Votre histoire se dévoile",
    descriptionEn: "Each day adds to your story. Over time, you'll see the beautiful rhythm of your life.",
    descriptionFr: "Chaque jour ajoute à votre histoire. Avec le temps, vous verrez le beau rythme de votre vie.",
  }
]
