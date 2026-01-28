'use client'

import { GuideStep } from '../FeatureGuide'
import {
  OnboardingWelcomeAnimation,
  OnboardingPersonalSpaceAnimation,
  OnboardingCaptureAnimation,
  OnboardingGrowLetGoAnimation,
  OnboardingInfoIconsAnimation,
  OnboardingReadyAnimation
} from './OnboardingGuideAnimations'

export const onboardingGuideSteps: GuideStep[] = [
  {
    animation: <OnboardingWelcomeAnimation />,
    titleEn: "Welcome to Bloomsline",
    titleFr: "Bienvenue sur Bloomsline",
    descriptionEn: "A gentle space to nurture your wellbeing. We're here to support your journey, one moment at a time.",
    descriptionFr: "Un espace doux pour prendre soin de vous. Nous sommes la pour accompagner votre cheminement, un moment a la fois.",
  },
  {
    animation: <OnboardingPersonalSpaceAnimation />,
    titleEn: "Your Personal Space",
    titleFr: "Votre espace personnel",
    descriptionEn: "This is your private sanctuary. Everything here is just for you - a place to reflect, grow, and heal at your own pace.",
    descriptionFr: "C'est votre sanctuaire prive. Tout ici est juste pour vous - un endroit pour reflechir, grandir et guerir a votre rythme.",
  },
  {
    animation: <OnboardingCaptureAnimation />,
    titleEn: "Capture Your Moments",
    titleFr: "Capturez vos moments",
    descriptionEn: "Snap photos of things that bring you joy or peace. Build a visual diary of the little things that matter.",
    descriptionFr: "Prenez des photos de ce qui vous apporte joie ou paix. Construisez un journal visuel des petites choses qui comptent.",
  },
  {
    animation: <OnboardingGrowLetGoAnimation />,
    titleEn: "Keep & Lighten",
    titleFr: "Garder et Alleger",
    descriptionEn: "Plant seeds of habits you want to grow. Release what no longer serves you. Find your balance.",
    descriptionFr: "Plantez des graines d'habitudes que vous voulez cultiver. Liberez ce qui ne vous sert plus. Trouvez votre equilibre.",
  },
  {
    animation: <OnboardingInfoIconsAnimation />,
    titleEn: "Find Help Anytime",
    titleFr: "Trouvez de l'aide a tout moment",
    descriptionEn: "Look for the info icon on each section. Tap it to learn how each feature works with helpful guides.",
    descriptionFr: "Cherchez l'icone info sur chaque section. Appuyez dessus pour apprendre comment fonctionne chaque fonctionnalite.",
  },
  {
    animation: <OnboardingReadyAnimation />,
    titleEn: "You're Ready!",
    titleFr: "Vous etes pret(e) !",
    descriptionEn: "Take a deep breath. There's no rush, no judgment. Just you, growing at your own pace. Let's begin.",
    descriptionFr: "Prenez une grande respiration. Pas de pression, pas de jugement. Juste vous, evoluant a votre rythme. Commencons.",
  }
]
