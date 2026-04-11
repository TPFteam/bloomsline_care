'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Globe,
  Mail,
  Calendar,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

// ─────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────

const translations = {
  en: {
    slides: {
      hero: 'Open',
      silence: 'The Silence',
      whyItMatters: 'Why It Matters',
      origin: 'Origin',
      product: 'Product',
      boundary: 'Boundary',
      whyNow: 'Why Now',
      model: 'Model',
      real: "What's Real",
      team: 'Team',
      vision: 'Vision',
      ask: 'The Ask',
      close: 'Close',
    },
    hero: {
      tag: 'Bloomsline',
      title1: 'Therapy happens in sessions.',
      title2: 'Change happens between sessions.',
      changeTooltip: 'Mood shifts. Pattern breaks. Small wins. Hard days.',
      subtitle: 'The platform for care between sessions.',
      stage: '',
      cta: 'Here\'s the story',
    },
    silence: {
      label: 'THE PROBLEM',
      headline: 'Between sessions, nothing holds the thread.',
      headline2: 'It all relies on memory, and memory fades.',
      patientLabel: 'For patients',
      patientItems: [
        'Forget what they discussed',
        'Fall back into old patterns',
        'Come back starting over',
      ],
      practitionerLabel: 'For practitioners',
      practitionerItems: [
        'Know only what patients remember to share',
        'Start every session from scratch',
        'Half the session is catch-up',
      ],
      quote: '"My client shared something painful on Tuesday. By our next session, I\'d lost the thread. I spent 15 minutes catching up instead of doing the work."',
      quoteAttribution: 'Practitioner, Paris',
      stats: [
        {
          value: '~35%',
          label: 'of patients drop out of therapy',
          source: 'PMC meta-analysis, 146 studies, 2022',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9667417/',
        },
        {
          value: '9%',
          label: 'receive adequate care for depression',
          source: 'WHO 2025',
          url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
        },
        {
          value: '35%',
          label: 'of clinician time goes to documentation',
          source: 'AHRQ Technical Brief, 2024',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/',
        },
        {
          value: '42%',
          label: 'of Gen Z in therapy — up 22% since 2022',
          source: 'Grow Therapy, 2025',
          url: 'https://growtherapy.com/blog/mental-health-statistics/',
        },
      ],
    },
    whyItMatters: {
      label: 'WHY IT MATTERS',
      headline1: 'This isn\'t just inefficient.',
      headline2: 'It changes the depth of care.',
      item1Label: 'TIME',
      item1Body: '10–15 minutes per session rebuilding context.',
      item2Label: 'SIGNALS',
      item2Body: 'Patterns, improvements, relapses — invisible.',
      item3Label: 'FEELING',
      item3Body: '"I\'m not progressing. I\'m not understood."',
      item4Label: 'BUSINESS',
      item4Body: 'Disengagement. Dropout. Lower retention.',
      closing: 'Lost time. Lost signals. Lost patients. And no one built anything to fix it.',
    },
    origin: {
      label: 'HOW WE GOT HERE',
      headline: 'We didn\'t start here.',
      para1: 'In 2024, Sarah and I built Doctalink — a way to find a therapist based on values, not degrees. It failed.',
      para2: 'But in the conversations that followed, the same thing kept coming up: finding a therapist wasn\'t the problem.',
      para3: 'The silence after was.',
      para4: 'Bloomsline is what we built with that insight.',
      quote: 'We didn\'t find a problem and build a product. We earned the insight through a product that failed.',
      timeline: [
        { period: '2024', label: 'Doctalink' },
        { period: '2025', label: 'Discovery' },
        { period: '2026', label: 'Bloomsline — live', accent: true },
      ],
    },
    product: {
      label: 'WHAT WE BUILT',
      hero1: 'Not a tool.',
      hero2: 'A visibility layer.',
      description1: 'Everything a practice needs — notes, sessions, resources.',
      description2: 'Plus the layer no one else built: what happens between them.',
      practitionerTag: 'For practitioners',
      practitionerItems: [
        'Walk in prepared.',
        'Context, not catch-up.',
        'Patients who come back.',
      ],
      memberTag: 'For members',
      memberItems: [
        'Capture thoughts in 10 seconds.',
        'A mirror for your patterns.',
        'Visible progress, not performance.',
      ],
    },
    boundary: {
      label: 'THE BOUNDARY',
      hero1: 'There\'s a boundary in therapy.',
      hero2: 'We respect it.',
      explanation: 'The therapeutic frame — the professional structure of the relationship — is what makes therapy work.',
      howLabel: 'How we protect it:',
      items: [
        { rule: 'No chat. No back-and-forth messaging.', detail: 'The practitioner sees context, not conversations.' },
        { rule: 'We don\'t replace the practitioner.', detail: 'Bloom AI reflects patterns — never gives advice.' },
        { rule: 'We don\'t gamify reflection.', detail: 'No streaks, no badges, no guilt.' },
        { rule: 'We add context, not interaction.', detail: 'Data flows to the session — not messages between sessions.' },
      ],
      closing1: 'Not forcing new habits.',
      closing2: 'Making what already happens visible.',
    },
    whyNow: {
      label: 'WHY NOW',
      headline: 'Three things just became true.',
      item1Title: 'B2C therapy collapsed.',
      item1Body: 'BetterHelp revenue down 9%, $1B loss in 2024. Woebot shut down June 2025. The market learned you can\'t cut out the therapist.',
      item1Sources: [
        { label: 'Healthcare Dive, 2024', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
        { label: 'STAT News, 2025', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      ],
      item2Title: 'AI is clinically acceptable.',
      item2Body: '49% of people with mental health issues already use AI tools. The resistance is gone.',
      item2Sources: [
        { label: 'Sentio Research, 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
      item3Title: 'Europe has a regulatory moat.',
      item3Body: 'EU AI Act mandates healthcare AI compliance by August 2026. Building compliant from day 1 is a 12–24 month lead over US competitors.',
      item3Sources: [
        { label: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
        { label: 'DataGuard Timeline', url: 'https://www.dataguard.com/eu-ai-act/timeline' },
      ],
      closing: 'Zero AI-native clinical SaaS in EU. The wedge is open.',
    },
    model: {
      label: 'THE MODEL',
      headline: 'Practitioners are our distribution.',
      flow1Label: '1 practitioner',
      flow1Value: '€29 / month',
      flow2Label: 'brings',
      flow2Value: '20–50 members',
      flow3Label: 'who invite',
      flow3Value: 'peers, organically',
      revenueTitle: 'Revenue',
      revenueItems: [
        '€19 / €29 / €49 per seat',
        '~83% modeled gross margin',
        'Future: member premium €3/mo',
      ],
      compoundTitle: 'Why it compounds',
      compoundItems: [
        'Practitioners refer each other in a tight community',
        'SEO-indexed practitioner profiles',
        'Every member is a future practitioner-referrer',
      ],
      footnote: '~20 patients/week × ~€60/session = ~€4,800/mo. One patient who stays instead of dropping out covers Bloomsline for 6 months.',
    },
    real: {
      label: "WHAT'S REAL",
      headline: "We're pre-revenue. The product isn't.",
      builtLabel: 'BUILT',
      builtItems: [
        'Practitioner web app',
        'Member mobile app',
        'Bloom AI',
        '2 languages · 24+ API endpoints',
        'Live in production',
      ],
      learnedLabel: 'LEARNED',
      learnedItems: [
        'Deep discovery across Europe',
        'Early testers in the loop',
        'Pivoted once, from real signal',
        'Found the wedge',
      ],
      honestLabel: 'HONEST',
      honestItems: [
        'Close to PMF — the inflection point is near',
        'Pricing calibrated by real conversations, not spreadsheets',
        'Two founders, full-stack. Speed as our moat',
      ],
      quote: 'This isn\'t a deck. It\'s a working platform you can touch today.',
    },
    team: {
      label: 'THE TEAM',
      headline: 'Two people. Built in-house. Near-zero burn.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Sales & Operations',
      sarahBio: 'The person practitioners trust. She listens before she sells — and that\'s why they stay.',
      adityaName: 'Aditya Channe',
      adityaRole: 'Product & Technology',
      adityaBio: 'Built every screen you see. Leads the product — and makes sure it stays close to the problem.',
      quote: 'Two people. Everything in-house. Because this had to be built by people who feel the problem.',
      footnote: 'Actively looking for a clinical advisor. The clinical voice is in the product — not yet on the cap table.',
    },
    vision: {
      label: 'THE LONG GAME',
      headline: 'Software today.',
      headline2: 'Infrastructure tomorrow.',
      viewMore: 'View more',
      showLess: 'Show less',
      buildingLabel: 'How',
      unlocksLabel: 'What it unlocks',
      impactLabel: 'Business impact',
      headsLabel: 'Where it heads',
      todayTag: 'Today',
      todayTitle: 'We sell a platform to practitioners.',
      todayBody: 'Get 100+ paying. Prove patients keep coming back.',
      todayBuilding: 'Practitioner web app, member mobile app, Bloom AI — live in production.',
      todayUnlocks: 'First-party data on what actually predicts patient continuity.',
      todayImpact: '100+ paying practitioners by M12 → €30K+ ARR. Proof of model.',
      todayHeads: 'A trusted relationship in the most sensitive data category in tech.',
      nextTag: 'Next',
      nextTitle: 'We turn the platform into a dataset.',
      nextBody: 'Turn what we capture into insights researchers and insurers pay for.',
      nextBuilding: 'Anonymized behavioral patterns across thousands of practitioner–patient loops.',
      nextUnlocks: 'The first longitudinal "moments → interventions → outcomes" dataset outside academia.',
      nextImpact: 'Research partnerships, insurance pilots, premium analytics tier for practitioners.',
      nextHeads: 'From "a tool we sell" to "the data partner the industry needs."',
      laterTag: 'Eventually',
      laterTitle: 'We turn the dataset into infrastructure.',
      laterBody: 'Become the layer every mental health tool plugs into.',
      laterBuilding: 'An interoperable layer for clinical workflows, research, and insurance.',
      laterUnlocks: 'The industry standard for therapeutic continuity data in Europe.',
      laterImpact: 'Multi-product SaaS · data licensing · research partnerships.',
      laterHeads: 'The default substrate for how mental health care is measured and improved.',
      footnote: 'Vision earns the right to exist through execution. Right now, we\'re heads-down on Today.',
    },
    ask: {
      label: 'THE ASK',
      headline: 'Raising €400–500K pre-seed.',
      subhead: '18 months of runway. Three milestones.',
      m6Label: 'M6',
      m6Value: '30–50 paying practitioners',
      m12Label: 'M12',
      m12Value: '100+ practitioners · 80%+ retention',
      m12Note: 'PMF signal',
      m18Label: 'M18',
      m18Value: '€100K+ ARR',
      fundsLabel: 'Use of funds',
      fundsItems: [
        { label: 'Product', value: '40%' },
        { label: 'Team', value: '25%' },
        { label: 'Go-to-market', value: '25%' },
        { label: 'Operations', value: '10%' },
      ],
      closing: 'Enough to find product-market fit without compromising the story we\'re building.',
    },
    close: {
      line1: 'Therapy happens in sessions.',
      line2: 'Life happens every day.',
      line3: 'And today, nothing connects the two.',
      line4: "That's the layer we're building.",
      cta: "Let's talk.",
      bookCall: 'Book a 20-min call',
      emailUs: 'hi@bloomsline.com',
      copyright: '© 2026 Bloomsline',
    },
  },
  fr: {
    slides: {
      hero: 'Ouverture',
      silence: 'Le Silence',
      whyItMatters: 'Pourquoi Ça Compte',
      origin: 'Origine',
      product: 'Produit',
      boundary: 'Limite',
      whyNow: 'Pourquoi Maintenant',
      model: 'Modèle',
      real: 'Ce Qui Est Réel',
      team: 'Équipe',
      vision: 'Vision',
      ask: 'La Demande',
      close: 'Conclusion',
    },
    hero: {
      tag: 'Bloomsline',
      title1: 'La thérapie a lieu en séance.',
      title2: 'Le changement se passe entre les séances.',
      changeTooltip: 'Humeurs. Ruptures de schémas. Petites victoires. Jours difficiles.',
      subtitle: 'La plateforme pour le soin entre les séances.',
      stage: 'Pre-seed · Pré-revenu · 2026',
      cta: 'Voici l\'histoire',
    },
    silence: {
      label: 'LE PROBLÈME',
      headline: 'Entre les séances, rien ne tient le fil.',
      headline2: 'Tout repose sur la mémoire, et la mémoire s\'efface.',
      patientLabel: 'Pour les patients',
      patientItems: [
        'Oublient ce qu\'ils ont abordé',
        'Retombent dans les anciens schémas',
        'Reviennent en recommençant',
      ],
      practitionerLabel: 'Pour les praticiens',
      practitionerItems: [
        'Ne savent que ce que le patient se souvient de partager',
        'Chaque séance repart de zéro',
        'La moitié de la séance, du rattrapage',
      ],
      quote: '"Mon patient m\'a partagé quelque chose de douloureux mardi. À notre prochaine séance, j\'avais perdu le fil. J\'ai passé 15 minutes à rattraper au lieu de faire le travail."',
      quoteAttribution: 'Praticienne, Paris',
      stats: [
        {
          value: '~35%',
          label: 'des patients abandonnent la thérapie',
          source: 'PMC méta-analyse, 146 études, 2022',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9667417/',
        },
        {
          value: '9%',
          label: 'reçoivent des soins adéquats pour la dépression',
          source: 'OMS 2025',
          url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
        },
        {
          value: '35%',
          label: 'du temps clinicien consacré à la documentation',
          source: 'AHRQ Technical Brief, 2024',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/',
        },
        {
          value: '42%',
          label: 'de la Gen Z en thérapie — +22% depuis 2022',
          source: 'Grow Therapy, 2025',
          url: 'https://growtherapy.com/blog/mental-health-statistics/',
        },
      ],
    },
    whyItMatters: {
      label: 'POURQUOI ÇA COMPTE',
      headline1: 'Ce n\'est pas juste inefficace.',
      headline2: 'Ça change la profondeur des soins.',
      item1Label: 'TEMPS',
      item1Body: '10–15 minutes par séance à reconstruire le contexte.',
      item2Label: 'SIGNAUX',
      item2Body: 'Patterns, progrès, rechutes — invisibles.',
      item3Label: 'RESSENTI',
      item3Body: '« Je n\'avance pas. On ne me comprend pas. »',
      item4Label: 'BUSINESS',
      item4Body: 'Désengagement. Abandon. Rétention en baisse.',
      closing: 'Rien ne soutient ce qui se passe entre les séances.',
    },
    origin: {
      label: 'COMMENT NOUS SOMMES ARRIVÉS ICI',
      headline: 'Nous avons d\'abord construit la mauvaise chose.',
      para1: 'En 2023, Sarah et moi avons construit Doctalink — un moyen de trouver un thérapeute basé sur les valeurs, pas les diplômes. Ça a échoué.',
      para2: 'Mais dans les conversations qui ont suivi, la même chose revenait : trouver un thérapeute n\'était pas le problème.',
      para3: 'Le silence après, l\'était.',
      para4: 'Bloomsline est ce que nous avons construit avec cette insight.',
      quote: 'Nous n\'avons pas trouvé un problème puis construit un produit. Nous avons gagné l\'insight à travers un produit qui a échoué.',
      timeline: [
        { period: '2024', label: 'Doctalink' },
        { period: '2025', label: 'Découverte' },
        { period: '2026', label: 'Bloomsline — en production', accent: true },
      ],
    },
    product: {
      label: 'CE QUE NOUS AVONS CONSTRUIT',
      hero1: 'Pas un outil.',
      hero2: 'Une couche de visibilité.',
      description1: 'Tout ce dont un cabinet a besoin — notes, séances, ressources.',
      description2: 'Plus la couche que personne n\'a construite : ce qui se passe entre les séances.',
      practitionerTag: 'Pour les praticiens',
      practitionerItems: [
        'Arriver préparé.',
        'Du contexte, pas du rattrapage.',
        'Des patients qui reviennent.',
      ],
      memberTag: 'Pour les membres',
      memberItems: [
        'Capturer ses pensées en 10 secondes.',
        'Un miroir de vos ressentis.',
        'Progression visible, pas de performance.',
      ],
    },
    boundary: {
      label: 'LA LIMITE',
      hero1: 'Il y a une limite en thérapie.',
      hero2: 'Nous la respectons.',
      explanation: 'Le cadre thérapeutique — la structure professionnelle de la relation — est ce qui fait fonctionner la thérapie.',
      howLabel: 'Comment nous la protégeons :',
      items: [
        { rule: 'Pas de chat. Pas de messagerie.', detail: 'Le praticien voit du contexte, pas des conversations.' },
        { rule: 'Nous ne remplaçons pas le praticien.', detail: 'Bloom IA reflète les patterns — ne donne jamais de conseils.' },
        { rule: 'Nous ne gamifions pas la réflexion.', detail: 'Pas de streaks, pas de badges, pas de culpabilité.' },
        { rule: 'Nous ajoutons du contexte, pas de l\'interaction.', detail: 'Les données vont vers la séance — pas des messages entre les séances.' },
      ],
      closing1: 'Pas de nouvelles habitudes forcées.',
      closing2: 'Rendre visible ce qui se passe déjà.',
    },
    whyNow: {
      label: 'POURQUOI MAINTENANT',
      headline: 'Trois choses viennent de devenir vraies.',
      item1Title: 'La thérapie B2C s\'est effondrée.',
      item1Body: 'BetterHelp : revenus en baisse de 9%, perte de 1 Md$ en 2024. Woebot a fermé en juin 2025. Le marché a appris qu\'on ne peut pas exclure le thérapeute.',
      item1Sources: [
        { label: 'Healthcare Dive, 2024', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
        { label: 'STAT News, 2025', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      ],
      item2Title: 'L\'IA est cliniquement acceptable.',
      item2Body: '49% des personnes ayant des problèmes de santé mentale utilisent déjà l\'IA. La résistance a disparu.',
      item2Sources: [
        { label: 'Sentio Research, 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
      item3Title: 'L\'Europe a un fossé réglementaire.',
      item3Body: 'L\'AI Act européen impose la conformité IA santé d\'ici août 2026. Construire conforme dès le jour 1, c\'est 12–24 mois d\'avance sur les concurrents US.',
      item3Sources: [
        { label: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
        { label: 'DataGuard Timeline', url: 'https://www.dataguard.com/eu-ai-act/timeline' },
      ],
      closing: 'Zéro SaaS clinique AI-native en Europe. La fenêtre est ouverte.',
    },
    model: {
      label: 'LE MODÈLE',
      headline: 'Les praticiens sont notre distribution.',
      flow1Label: '1 praticien',
      flow1Value: '€29 / mois',
      flow2Label: 'apporte',
      flow2Value: '20–50 membres',
      flow3Label: 'qui invitent',
      flow3Value: 'leurs pairs, organiquement',
      revenueTitle: 'Revenus',
      revenueItems: [
        '€19 / €29 / €49 par siège',
        '~83% de marge brute modélisée',
        'Futur : premium membre €3/mois',
      ],
      compoundTitle: 'Pourquoi ça compose',
      compoundItems: [
        'Les praticiens se recommandent dans une communauté serrée',
        'Profils praticiens indexés SEO',
        'Chaque membre est un futur parrain de praticien',
      ],
      footnote: 'Revenu de base d\'un praticien solo : €4 800/mois. Une annulation évitée paie 6 mois de Bloomsline.',
    },
    real: {
      label: 'CE QUI EST RÉEL',
      headline: 'Nous sommes pré-revenu. Le produit, non.',
      builtLabel: 'CONSTRUIT',
      builtItems: [
        'App web praticien',
        'App mobile membre',
        'Bloom IA',
        '2 langues · 24+ endpoints API',
        'En production',
      ],
      learnedLabel: 'APPRIS',
      learnedItems: [
        'Découverte en profondeur à travers l\'Europe',
        'Testeurs précoces dans la boucle',
        'Un pivot, depuis un signal réel',
        'Le wedge trouvé',
      ],
      honestLabel: 'HONNÊTE',
      honestItems: [
        'Proche du PMF — le point d\'inflexion approche',
        'Prix calibré par de vraies conversations, pas des tableurs',
        'Deux fondateurs, full-stack. La vitesse comme moat',
      ],
      quote: 'Ce n\'est pas un deck. C\'est une plateforme fonctionnelle que vous pouvez toucher aujourd\'hui.',
    },
    team: {
      label: 'L\'ÉQUIPE',
      headline: 'Deux personnes. Tout fait en interne. Burn quasi nul.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Ventes & Opérations',
      sarahBio: 'La personne en qui les praticiens ont confiance. Elle écoute avant de vendre — c\'est pour ça qu\'ils restent.',
      adityaName: 'Aditya Channe',
      adityaRole: 'Produit & Technologie',
      adityaBio: 'A construit chaque écran que vous voyez. Dirige le produit — et s\'assure qu\'il reste proche du problème.',
      quote: 'Ce problème est trop proche pour être délégué. Alors on l\'a construit nous-mêmes — deux personnes, en interne, burn quasi nul.',
      footnote: 'Nous cherchons activement un conseiller clinique. La voix clinique est dans le produit — pas encore au cap table.',
    },
    vision: {
      label: 'LE LONG TERME',
      headline: 'Logiciel aujourd\'hui.',
      headline2: 'Infrastructure demain.',
      viewMore: 'Voir plus',
      showLess: 'Voir moins',
      buildingLabel: 'Comment',
      unlocksLabel: 'Ce que ça débloque',
      impactLabel: 'Impact business',
      headsLabel: 'Direction',
      todayTag: 'Aujourd\'hui',
      todayTitle: 'On vend une plateforme aux praticiens.',
      todayBody: 'Atteindre 100+ praticiens payants. Prouver que les patients reviennent.',
      todayBuilding: 'App web praticien, app mobile membre, Bloom IA — en production.',
      todayUnlocks: 'Données de première main sur ce qui prédit vraiment la continuité patient.',
      todayImpact: '100+ praticiens payants à M12 → €30K+ ARR. Preuve du modèle.',
      todayHeads: 'Une relation de confiance dans la catégorie de données la plus sensible.',
      nextTag: 'Ensuite',
      nextTitle: 'On transforme la plateforme en dataset.',
      nextBody: 'Transformer ce qu\'on capture en insights que chercheurs et assureurs paient.',
      nextBuilding: 'Patterns comportementaux anonymisés sur des milliers de boucles praticien-patient.',
      nextUnlocks: 'Premier dataset longitudinal "moments → interventions → résultats" hors académique.',
      nextImpact: 'Partenariats recherche, pilotes assurance, tier analytics premium pour praticiens.',
      nextHeads: 'D\'un "outil qu\'on vend" à "le partenaire data dont l\'industrie a besoin."',
      laterTag: 'Un jour',
      laterTitle: 'On transforme le dataset en infrastructure.',
      laterBody: 'Devenir la couche dans laquelle chaque outil de santé mentale se branche.',
      laterBuilding: 'Une couche interopérable pour les workflows cliniques, la recherche, l\'assurance.',
      laterUnlocks: 'Le standard de l\'industrie pour les données de continuité thérapeutique en Europe.',
      laterImpact: 'SaaS multi-produits · licences data · partenariats recherche.',
      laterHeads: 'Le substrat par défaut pour mesurer et améliorer les soins de santé mentale.',
      footnote: 'La vision gagne le droit d\'exister par l\'exécution. Là, on est concentrés sur Aujourd\'hui.',
    },
    ask: {
      label: 'LA DEMANDE',
      headline: 'Levée de €400–500K en pre-seed.',
      subhead: '18 mois de runway. Trois jalons.',
      m6Label: 'M6',
      m6Value: '30–50 praticiens payants',
      m12Label: 'M12',
      m12Value: '100+ praticiens · 80%+ de rétention',
      m12Note: 'signal PMF',
      m18Label: 'M18',
      m18Value: '€100K+ ARR',
      fundsLabel: 'Utilisation des fonds',
      fundsItems: [
        { label: 'Produit', value: '40%' },
        { label: 'Équipe', value: '25%' },
        { label: 'Go-to-market', value: '25%' },
        { label: 'Opérations', value: '10%' },
      ],
      closing: 'Assez pour trouver le product-market fit sans compromettre l\'histoire que nous construisons.',
    },
    close: {
      line1: 'La thérapie a lieu en séance.',
      line2: 'La vie a lieu chaque jour.',
      line3: 'Et aujourd\'hui, rien ne relie les deux.',
      line4: 'C\'est la couche que nous construisons.',
      cta: 'Discutons.',
      bookCall: 'Réserver un appel de 20 min',
      emailUs: 'hi@bloomsline.com',
      copyright: '© 2026 Bloomsline',
    },
  },
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────

export default function PitchNewPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  const slides = [
    { id: 'hero', title: t.slides.hero },
    { id: 'silence', title: t.slides.silence },
    { id: 'whyItMatters', title: t.slides.whyItMatters },
    { id: 'origin', title: t.slides.origin },
    { id: 'product', title: t.slides.product },
    { id: 'boundary', title: t.slides.boundary },
    { id: 'whyNow', title: t.slides.whyNow },
    { id: 'real', title: t.slides.real },
    { id: 'model', title: t.slides.model },
    { id: 'team', title: t.slides.team },
    { id: 'vision', title: t.slides.vision },
    { id: 'ask', title: t.slides.ask },
    { id: 'close', title: t.slides.close },
  ]

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= slides.length) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating, slides.length])

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide])
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSlide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  const slideVariants = {
    enter: { opacity: 0, y: 30 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  }

  // Dark slide gets dark nav styling
  const isDark = currentSlide === 6 // whyNow

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ backgroundColor: isDark ? '#0a0a0a' : '#FAF8F5' }}>
      {/* Language Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all text-sm font-medium ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300 text-neutral-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          {locale === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Navigation dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className="group flex items-center gap-2 transition-all duration-300"
            aria-label={slide.title}
          >
            <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isDark
                ? (currentSlide === index ? 'text-teal-400' : 'text-neutral-500')
                : (currentSlide === index ? 'text-teal-600' : 'text-neutral-400')
            }`}>
              {slide.title}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isDark
                ? (currentSlide === index ? 'bg-teal-400 scale-150' : 'bg-white/30 hover:bg-white/50')
                : (currentSlide === index ? 'bg-teal-600 scale-150' : 'bg-neutral-300 hover:bg-neutral-400')
            }`} />
          </button>
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-2 rounded-full backdrop-blur-sm border transition-all ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300'
          } ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          aria-label="Previous slide"
        >
          <ChevronUp className={`w-5 h-5 ${isDark ? 'text-white' : 'text-neutral-600'}`} />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`p-2 rounded-full backdrop-blur-sm border transition-all ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300'
          } ${currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
          aria-label="Next slide"
        >
          <ChevronDown className={`w-5 h-5 ${isDark ? 'text-white' : 'text-neutral-600'}`} />
        </button>
      </div>

      {/* Logo */}
      <div className="fixed top-6 left-6 z-50">
        <a href="/" className="flex items-center gap-2">
          <Logo size="md" showText />
        </a>
      </div>

      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentSlide}-${locale}`}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full w-full"
        >
          {currentSlide === 0 && <HeroSlide onNext={nextSlide} t={t.hero} />}
          {currentSlide === 1 && <SilenceSlide t={t.silence} />}
          {currentSlide === 2 && <WhyItMattersSlide t={t.whyItMatters} />}
          {currentSlide === 3 && <OriginSlide t={t.origin} />}
          {currentSlide === 4 && <ProductSlide t={t.product} />}
          {currentSlide === 5 && <BoundarySlide t={t.boundary} />}
          {currentSlide === 6 && <WhyNowSlide t={t.whyNow} />}
          {currentSlide === 7 && <RealSlide t={t.real} />}
          {currentSlide === 8 && <ModelSlide t={t.model} />}
          {currentSlide === 9 && <TeamSlide t={t.team} />}
          {currentSlide === 10 && <VisionSlide t={t.vision} />}
          {currentSlide === 11 && <AskSlide t={t.ask} />}
          {currentSlide === 12 && <CloseSlide t={t.close} />}
        </motion.div>
      </AnimatePresence>

      {/* Slide counter */}
      <div className={`fixed bottom-6 right-6 z-50 text-sm font-medium ${isDark ? 'text-white/40' : 'text-neutral-400'}`}>
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 1: HERO — "One hour a week. 167 hours of silence."
// =============================================================================

function HeroSlide({ onNext, t }: { onNext: () => void; t: typeof translations.en.hero }) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden px-8">
      {/* Subtle blob */}
      <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-teal-100/40 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />
      <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />

      <div className="relative z-10 max-w-5xl w-full">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm tracking-[0.3em] text-neutral-500 mb-12 uppercase"
        >
          {t.tag}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-3xl sm:text-4xl lg:text-[3.5rem] font-light text-neutral-900 leading-[1.1] tracking-tight mb-4"
        >
          {t.title1}
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-[3.5rem] font-light leading-[1.1] tracking-tight mb-16"
        >
          <span className="text-teal-700">{t.title2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xl text-neutral-600 mb-2"
        >
          {t.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-sm text-neutral-400 mb-12"
        >
          {t.stage}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Button
            onClick={onNext}
            className="px-12 py-5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-base font-medium"
          >
            {t.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 2: THE SILENCE
// =============================================================================

function SilenceSlide({ t }: { t: typeof translations.en.silence }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-400 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline2}
        </motion.h2>

        {/* Two column contrast — what breaks on each side */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 max-w-4xl"
        >
          <div>
            <p className="text-xs tracking-[0.2em] text-teal-700 uppercase mb-4">{t.practitionerLabel}</p>
            <ul className="space-y-2">
              {t.practitionerItems.map((item, i) => (
                <li key={i} className="text-lg text-neutral-900 font-light">{item}</li>
              ))}
            </ul>
          </div>
          <div className="md:border-l border-neutral-200 md:pl-12">
            <p className="text-xs tracking-[0.2em] text-teal-700 uppercase mb-4">{t.patientLabel}</p>
            <ul className="space-y-2">
              {t.patientItems.map((item, i) => (
                <li key={i} className="text-lg text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Stats footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-wrap gap-8 pt-8 border-t border-neutral-200"
        >
          {t.stats.map((stat, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-2xl font-light text-neutral-900">{stat.value}</span>
              <span className="text-xs text-neutral-900">{stat.label}</span>
              <a
                href={stat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-teal-700 underline decoration-dotted underline-offset-2 transition-colors"
              >
                {stat.source} ↗
              </a>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 3: WHY IT MATTERS — consequences of the problem
// =============================================================================

function WhyItMattersSlide({ t }: { t: typeof translations.en.whyItMatters }) {
  const items = [
    { label: t.item1Label, body: t.item1Body },
    { label: t.item2Label, body: t.item2Body },
    { label: t.item3Label, body: t.item3Body },
    { label: t.item4Label, body: t.item4Body },
  ]

  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.headline1}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline2}
        </motion.h2>

        {/* Four consequence quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-14 max-w-4xl">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="flex flex-col gap-2"
            >
              <p className="text-xs tracking-[0.25em] uppercase font-mono text-teal-700">
                {item.label}
              </p>
              <p className="text-lg text-neutral-800 font-light leading-snug">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg text-neutral-500 italic font-light pt-8 border-t border-neutral-200 max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 4: ORIGIN — "We built the wrong thing first"
// =============================================================================

function OriginSlide({ t }: { t: typeof translations.en.origin }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-5 text-lg text-neutral-700 font-light leading-relaxed"
          >
            <p>{t.para1}</p>
            <p>{t.para2}</p>
            <p className="text-neutral-900 font-medium">{t.para3}</p>
            <p className="text-neutral-700">{t.para4}</p>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="lg:col-span-3 lg:pl-12 lg:border-l border-neutral-200"
          >
            <p className="text-3xl lg:text-4xl font-light italic text-neutral-900 leading-snug">
              &ldquo;{t.quote}&rdquo;
            </p>
          </motion.blockquote>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="pt-8 border-t border-neutral-200"
        >
          <div className="flex items-start justify-between max-w-3xl">
            {(t.timeline as Array<{ period: string; label: string; accent?: boolean }>).map((item, i, arr) => (
              <div key={i} className="flex items-start flex-1">
                <div>
                  <p className={`text-sm font-medium ${item.accent ? 'text-teal-700' : 'text-neutral-900'}`}>{item.period}</p>
                  <p className={`text-xs mt-1 ${item.accent ? 'text-teal-600' : 'text-neutral-500'}`}>{item.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 mx-6 mt-2 border-t border-dashed border-neutral-300" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 4: PRODUCT — "What we built"
// =============================================================================

function ProductSlide({ t }: { t: typeof translations.en.product }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-5xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-8"
        >
          {t.label}
        </motion.p>

        {/* Hero — Not a tool / A visibility layer */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-400 leading-[1.1] tracking-tight mb-2"
        >
          {t.hero1}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-14"
        >
          {t.hero2}
        </motion.h2>

        {/* Description — two tight lines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-12 max-w-3xl space-y-1"
        >
          <p className="text-lg text-neutral-700 font-light leading-relaxed">{t.description1}</p>
          <p className="text-lg text-neutral-700 font-light leading-relaxed">{t.description2}</p>
        </motion.div>

        {/* Two columns: practitioners + members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <p className="text-xs tracking-[0.2em] uppercase mb-3 text-teal-700">
              {t.practitionerTag}
            </p>
            <ul className="space-y-2">
              {(t.practitionerItems as string[]).map((item, i) => (
                <li key={i} className="text-base text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="md:border-l border-neutral-200 md:pl-12"
          >
            <p className="text-xs tracking-[0.2em] uppercase mb-3 text-teal-700">
              {t.memberTag}
            </p>
            <ul className="space-y-2">
              {(t.memberItems as string[]).map((item, i) => (
                <li key={i} className="text-base text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 5: BOUNDARY — objection handling
// =============================================================================

function BoundarySlide({ t }: { t: typeof translations.en.boundary }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-5xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-8"
        >
          {t.label}
        </motion.p>

        {/* Two hero lines */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.hero1}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-12"
        >
          {t.hero2}
        </motion.h2>

        {/* Explanation of what the boundary is */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg text-neutral-700 font-light max-w-3xl mb-12 leading-relaxed"
        >
          {t.explanation}
        </motion.p>

        {/* How we protect it — label + 4 bullets */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="text-xs tracking-[0.25em] uppercase text-neutral-400 font-mono mb-4"
        >
          {t.howLabel}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-2 max-w-3xl mb-10"
        >
          {(t.items as Array<{ rule: string; detail: string }>).map((item, i) => (
            <p key={i} className="text-base text-neutral-700 font-light">— {item.rule}</p>
          ))}
        </motion.div>

        {/* Closing philosophy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="max-w-3xl"
        >
          <p className="text-lg text-neutral-400 font-light">{t.closing1}</p>
          <p className="text-lg text-neutral-900 font-light">{t.closing2}</p>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 6: WHY NOW — dark slide
// =============================================================================

function WhyNowSlide({ t }: { t: typeof translations.en.whyNow }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-400 uppercase mb-4"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.1] tracking-tight mb-12"
        >
          {t.headline}
        </motion.h2>

        <div className="space-y-8 mb-10 max-w-4xl">
          {[
            { title: t.item1Title, body: t.item1Body, sources: t.item1Sources as Array<{ label: string; url: string }>, num: '01' },
            { title: t.item2Title, body: t.item2Body, sources: t.item2Sources as Array<{ label: string; url: string }>, num: '02' },
            { title: t.item3Title, body: t.item3Body, sources: t.item3Sources as Array<{ label: string; url: string }>, num: '03' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
              className="flex gap-8 items-start"
            >
              <span className="text-2xl font-light text-teal-400/50 mt-1">{item.num}</span>
              <div className="flex-1">
                <h3 className="text-2xl font-medium text-white mb-2">{item.title}</h3>
                <p className="text-lg text-neutral-400 font-light leading-relaxed">{item.body}</p>
                {item.sources && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {item.sources.map((src, j) => (
                      <a
                        key={j}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neutral-600 hover:text-teal-400 underline decoration-dotted underline-offset-2 transition-colors"
                      >
                        {src.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-xl text-teal-300 italic font-light pt-8 border-t border-white/10 max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 6: MODEL — B2B2C
// =============================================================================

function ModelSlide({ t }: { t: typeof translations.en.model }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        {/* Flow math */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4 mb-16 max-w-3xl"
        >
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-neutral-500 w-32">{t.flow1Label}</span>
            <span className="text-2xl font-light text-neutral-900">{t.flow1Value}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-neutral-500 w-32">→ {t.flow2Label}</span>
            <span className="text-2xl font-light text-teal-700">{t.flow2Value}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-neutral-500 w-32">→ {t.flow3Label}</span>
            <span className="text-2xl font-light text-neutral-900">{t.flow3Value}</span>
          </div>
        </motion.div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">{t.revenueTitle}</p>
            <ul className="space-y-2">
              {t.revenueItems.map((item, i) => (
                <li key={i} className="text-base text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="md:border-l border-neutral-200 md:pl-12"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">{t.compoundTitle}</p>
            <ul className="space-y-2">
              {t.compoundItems.map((item, i) => (
                <li key={i} className="text-base text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-sm text-neutral-500 italic pt-8 border-t border-neutral-200"
        >
          {t.footnote}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 7: WHAT'S REAL — traction
// =============================================================================

function RealSlide({ t }: { t: typeof translations.en.real }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {[
            { label: t.builtLabel, items: t.builtItems, color: 'text-teal-700' },
            { label: t.learnedLabel, items: t.learnedItems, color: 'text-neutral-700' },
            { label: t.honestLabel, items: t.honestItems, color: 'text-neutral-500' },
          ].map((col, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
            >
              <p className={`text-xs tracking-[0.25em] uppercase mb-5 font-mono ${col.color}`}>{col.label}</p>
              <ul className="space-y-2.5">
                {col.items.map((item, j) => (
                  <li key={j} className="text-base text-neutral-700 font-light leading-snug">{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="border-l-2 border-teal-600 pl-6 py-2 max-w-3xl"
        >
          <p className="text-xl text-neutral-900 italic font-light leading-relaxed">
            &ldquo;{t.quote}&rdquo;
          </p>
        </motion.blockquote>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 8: TEAM
// =============================================================================

function TeamSlide({ t }: { t: typeof translations.en.team }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-5 items-start"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium" style={{ background: 'linear-gradient(135deg, #D4856A, #E8A87C)' }}>
              SL
            </div>
            <div>
              <h3 className="text-xl font-medium text-neutral-900">{t.sarahName}</h3>
              <p className="text-sm text-neutral-500 mb-2">{t.sarahRole}</p>
              <p className="text-base text-neutral-700 font-light leading-relaxed">{t.sarahBio}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex gap-5 items-start"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium bg-gradient-to-br from-teal-500 to-teal-600">
              AC
            </div>
            <div>
              <h3 className="text-xl font-medium text-neutral-900">{t.adityaName}</h3>
              <p className="text-sm text-neutral-500 mb-2">{t.adityaRole}</p>
              <p className="text-base text-neutral-700 font-light leading-relaxed">{t.adityaBio}</p>
            </div>
          </motion.div>
        </div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="border-l-2 border-teal-600 pl-6 py-2 max-w-4xl mb-8"
        >
          <p className="text-xl text-neutral-900 italic font-light leading-relaxed">
            &ldquo;{t.quote}&rdquo;
          </p>
        </motion.blockquote>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-sm text-neutral-500 italic"
        >
          {t.footnote}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 9: VISION — The long game
// =============================================================================

function VisionSlide({ t }: { t: typeof translations.en.vision }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const subLabels = [t.buildingLabel, t.unlocksLabel, t.impactLabel, t.headsLabel]

  const phases = [
    {
      tag: t.todayTag,
      title: t.todayTitle,
      body: t.todayBody,
      items: [t.todayBuilding, t.todayUnlocks, t.todayImpact, t.todayHeads],
      accent: true,
    },
    {
      tag: t.nextTag,
      title: t.nextTitle,
      body: t.nextBody,
      items: [t.nextBuilding, t.nextUnlocks, t.nextImpact, t.nextHeads],
      accent: false,
    },
    {
      tag: t.laterTag,
      title: t.laterTitle,
      body: t.laterBody,
      items: [t.laterBuilding, t.laterUnlocks, t.laterImpact, t.laterHeads],
      accent: false,
    },
  ]

  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-4"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-12"
        >
          {t.headline2}
        </motion.h2>

        {/* Three phases — one supporting line each, expandable */}
        <div className="space-y-6 mb-8">
          {phases.map((phase, i) => {
            const isOpen = expanded.has(i)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                className="grid grid-cols-12 gap-6 items-baseline"
              >
                <div className="col-span-12 lg:col-span-2">
                  <p className={`text-xs tracking-[0.25em] uppercase font-mono ${phase.accent ? 'text-teal-700' : 'text-neutral-400'}`}>
                    {phase.tag}
                  </p>
                </div>
                <div className="col-span-12 lg:col-span-10">
                  <p className={`text-xl lg:text-2xl font-light leading-snug mb-2 ${phase.accent ? 'text-neutral-900' : 'text-neutral-700'}`}>
                    {phase.title}
                  </p>
                  <p className="text-sm text-neutral-500 font-light">{phase.body}</p>

                  <button
                    onClick={() => toggle(i)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] tracking-wide text-neutral-400 hover:text-teal-700 transition-colors group"
                  >
                    <span>{isOpen ? t.showLess : t.viewMore}</span>
                    {isOpen
                      ? <ChevronUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
                      : <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                    }
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-5 pt-5 border-t border-neutral-200">
                          {phase.items.map((item, j) => (
                            <div key={j} className="flex flex-col gap-1">
                              <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-mono">
                                {subLabels[j]}
                              </span>
                              <span className="text-sm text-neutral-700 font-light leading-relaxed">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="text-sm text-neutral-500 italic pt-8 border-t border-neutral-200 max-w-3xl"
        >
          {t.footnote}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 10: ASK
// =============================================================================

function AskSlide({ t }: { t: typeof translations.en.ask }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-3"
        >
          {t.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-xl text-neutral-500 font-light mb-16"
        >
          {t.subhead}
        </motion.p>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-3 gap-8 mb-16 max-w-4xl"
        >
          {[
            { label: t.m6Label, value: t.m6Value, note: null },
            { label: t.m12Label, value: t.m12Value, note: t.m12Note },
            { label: t.m18Label, value: t.m18Value, note: null },
          ].map((m, i) => (
            <div key={i} className="relative">
              <div className="w-3 h-3 rounded-full bg-teal-600 mb-4" />
              <p className="text-sm font-medium text-teal-700 mb-2">{m.label}</p>
              <p className="text-lg text-neutral-900 font-light leading-snug">{m.value}</p>
              {m.note && <p className="text-xs text-neutral-500 italic mt-1">{m.note}</p>}
            </div>
          ))}
        </motion.div>

        {/* Use of funds */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="pt-8 border-t border-neutral-200 mb-10"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">{t.fundsLabel}</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {t.fundsItems.map((item, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-neutral-900">{item.value}</span>
                <span className="text-sm text-neutral-500">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg text-neutral-600 italic font-light max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 11: CLOSE
// =============================================================================

function CloseSlide({ t }: { t: typeof translations.en.close }) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden px-8">
      {/* Subtle blob echoing hero */}
      <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-teal-100/40 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />
      <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />

      <div className="relative z-10 max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-3 mb-16"
        >
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.15] tracking-tight">
            {t.line1}
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.15] tracking-tight">
            {t.line2}
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-400 leading-[1.15] tracking-tight">
            {t.line3}
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.15] tracking-tight pt-2">
            {t.line4}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-2xl text-neutral-700 font-light mb-6"
        >
          {t.cta}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-wrap gap-4 mb-16"
        >
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="px-10 py-5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-base font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              {t.bookCall}
            </Button>
          </a>
          <a href={`mailto:${t.emailUs}`}>
            <Button variant="outline" className="px-10 py-5 border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-full text-base font-medium">
              <Mail className="w-4 h-4 mr-2" />
              {t.emailUs}
            </Button>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="text-xs text-neutral-400 tracking-wide"
        >
          {t.copyright}
        </motion.p>
      </div>
    </div>
  )
}
