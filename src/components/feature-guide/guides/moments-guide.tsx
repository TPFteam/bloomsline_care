'use client'

import { GuideStep } from '../FeatureGuide'
import {
  WelcomeAnimation,
  CaptureAnimation,
  MoodAnimation,
  BloomAnimation,
  GrowthAnimation
} from './MomentsGuideAnimations'

export const momentsGuideSteps: GuideStep[] = [
  {
    animation: <WelcomeAnimation />,
    titleEn: "Welcome to Moments",
    titleFr: "Bienvenue dans Moments",
    descriptionEn: "Capture the feelings, thoughts, and experiences that matter to you. Your private space to document your emotional journey.",
    descriptionFr: "Capturez les sentiments, pensées et expériences qui comptent pour vous. Votre espace privé pour documenter votre parcours émotionnel.",
  },
  {
    animation: <CaptureAnimation />,
    titleEn: "Capture in Your Way",
    titleFr: "Capturez à votre façon",
    descriptionEn: "Tap the + button, then choose: photo, video, voice note, or text. Whatever feels natural in the moment.",
    descriptionFr: "Appuyez sur +, puis choisissez: photo, vidéo, note vocale ou texte. Ce qui vous semble naturel sur le moment.",
  },
  {
    animation: <MoodAnimation />,
    titleEn: "Track Your Moods",
    titleFr: "Suivez vos humeurs",
    descriptionEn: "Add moods to each moment. Over time, you'll discover patterns and see how your emotional landscape evolves.",
    descriptionFr: "Ajoutez des humeurs à chaque moment. Avec le temps, vous découvrirez des tendances dans votre paysage émotionnel.",
  },
  {
    animation: <BloomAnimation />,
    titleEn: "Talk to Bloom",
    titleFr: "Parlez à Bloom",
    descriptionEn: "Need to process your feelings? Bloom, your AI companion, is always here to listen and help you reflect.",
    descriptionFr: "Besoin de traiter vos émotions? Bloom, votre compagnon IA, est là pour vous écouter et vous aider à réfléchir.",
  },
  {
    animation: <GrowthAnimation />,
    titleEn: "Watch Yourself Bloom",
    titleFr: "Regardez-vous vous épanouir",
    descriptionEn: "Every moment you capture is a seed of self-awareness. Your collection grows with you.",
    descriptionFr: "Chaque moment que vous capturez est une graine de conscience de soi. Votre collection grandit avec vous.",
  }
]
