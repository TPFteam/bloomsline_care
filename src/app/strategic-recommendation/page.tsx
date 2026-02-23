'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  Clock,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Target,
  Shield,
  BarChart3,
  Scale,
  Eye,
  Star,
  Crosshair,
  Layers,
  Brain,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
})

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
)

// ── Types ────────────────────────────────────────────────────────────────

interface StrategicOption {
  id: string
  name: string
  subtitle: string
  color: string
  borderColor: string
  bgColor: string
  textColor: string
  iconColor: string
  thesis: string
  description: string
  investment: string
  timeline: string
  expectedOutcome: string[]
  keyRisks: string[]
  m12Revenue: string
  m12Practitioners: string
  seriesATimeline: string
  probabilityOfSuccess: string
}

interface Initiative {
  rank: number
  title: string
  rationale: string
  owner: string
  timeline: string
  metric: string
  investment: string
  color: string
}

interface ResourceReq {
  category: string
  icon: typeof Users
  color: string
  items: { role: string; cost: string; when: string; why: string }[]
}

interface DecisionCriteria {
  criterion: string
  weight: string
  description: string
  greenSignal: string
  redSignal: string
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function StrategicRecommendationPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  // ── Current State Data ──────────────────────────────────────────────
  const CURRENT_STATE = {
    strengths: [
      { label: t('B2B2C architecture is category-defining', 'L\'architecture B2B2C est un avantage concurrentiel majeur'), detail: t('Only platform connecting practitioner tools + member app + AI companion in EU. SimplePractice has practitioners (237K) but no member app. Headspace has members (80M) but no practitioner tools. Nobody has both.', 'Seule plateforme combinant outils praticiens + application membres + compagnon IA en Europe. SimplePractice a des praticiens (237K) mais pas d\'application membres. Headspace a des membres (80M) mais pas d\'outils praticiens. Personne n\'a les deux.'), rating: t('Decisive', 'Décisif') },
      { label: t('Unit economics are exceptional — on paper', 'L\'économie unitaire est exceptionnelle — sur le papier'), detail: t('LTV/CAC 72.5x (vs. 3-5x median), 85% gross margin, €50 CAC, 1.7-month payback. The Care Network Effect (1 practitioner → 12-15 free members) makes acquisition economics structurally superior to any competitor. IF the assumptions hold.', 'LTV/CAC 72,5x (vs. 3-5x médiane), marge brute 85%, CAC 50€, retour sur investissement 1,7 mois. L\'effet réseau de soins (1 praticien → 12-15 membres gratuits) rend l\'économie d\'acquisition structurellement supérieure à tout concurrent. SI les hypothèses se confirment.'), rating: t('Strong', 'Fort') },
      { label: t('Product is built, not vaporware', 'Le produit est construit, pas du vaporware'), detail: t('Full MVP live: Next.js 16 web dashboard + Expo mobile app, 24+ API endpoints, 7 AI endpoints (Claude Haiku/Sonnet), 3-language i18n (en/fr/es), Google Calendar sync, real-time subscriptions. Built entirely by founding team — no outsourced code, no technical debt from agencies.', 'MVP complet en ligne : tableau de bord web Next.js 16 + application mobile Expo, 24+ endpoints API, 7 endpoints IA (Claude Haiku/Sonnet), i18n 3 langues (en/fr/es), synchronisation Google Calendar, abonnements en temps réel. Entièrement développé par l\'équipe fondatrice — aucun code externalisé, aucune dette technique d\'agences.'), rating: t('Strong', 'Fort') },
      { label: t('EU regulatory positioning creates structural moat', 'Le positionnement réglementaire européen crée un avantage structurel'), detail: t('GDPR-native from first line of code. AES-256-GCM encryption, Row Level Security on every table, EU-hosted analytics. EU AI Act-ready (Aug 2026 deadline). US competitors need 12-24 months to achieve parity. This advantage deepens over time.', 'Conforme au RGPD dès la première ligne de code. Chiffrement AES-256-GCM, sécurité au niveau des lignes sur chaque table, analytics hébergées en UE. Prêt pour l\'AI Act européen (échéance août 2026). Les concurrents américains ont besoin de 12-24 mois pour atteindre la parité. Cet avantage se renforce avec le temps.'), rating: t('Strong', 'Fort') },
      { label: t('Market timing is favorable — window is open', 'Le timing du marché est favorable — la fenêtre est ouverte'), detail: t('BetterHelp revenue -11%, Woebot shut down (June 2025), Talkspace pivoting B2B (+42% payor revenue). B2C model is collapsing; capital is moving to B2B/B2B2C. Therapist burnout at 93%. Zero AI-native practitioner SaaS exists in EU.', 'Revenus BetterHelp -11%, Woebot fermé (juin 2025), Talkspace pivote vers le B2B (+42% revenus assureurs). Le modèle B2C s\'effondre ; les capitaux migrent vers le B2B/B2B2C. Épuisement professionnel des thérapeutes à 93%. Aucun SaaS IA natif pour praticiens en UE.'), rating: t('Favorable', 'Favorable') },
    ],
    weaknesses: [
      { label: t('Zero revenue. Zero paying customers. Zero validated demand.', 'Zéro revenu. Zéro client payant. Zéro demande validée.'), detail: t('Every financial metric (LTV, CAC, churn, LTV/CAC) is modeled, not observed. 187 interviews validate interest, but stated preference ≠ purchasing behavior. Woebot had 5+ RCTs and $123M funding and still failed commercially. The gap between "interesting" and "I will pay monthly" remains uncrossed.', 'Chaque métrique financière (LTV, CAC, churn, LTV/CAC) est modélisée, pas observée. 187 entretiens valident l\'intérêt, mais préférence déclarée ≠ comportement d\'achat. Woebot avait 5+ ECR et 123M$ de financement et a quand même échoué commercialement. L\'écart entre « intéressant » et « je paierai chaque mois » reste à franchir.'), severity: t('Critical', 'Critique') },
      { label: t('Two-person team is a single point of failure', 'L\'équipe de deux personnes est un point de défaillance unique'), detail: t('Two founders covering product, engineering, sales, marketing, design, support, and fundraising simultaneously. No clinical advisor. No engineering hire. If one founder is unavailable for 2 weeks, the entire operation stalls. Cannot match feature velocity of funded competitors.', 'Deux fondateurs couvrant simultanément produit, ingénierie, ventes, marketing, design, support et levée de fonds. Aucun conseiller clinique. Aucun recrutement technique. Si un fondateur est indisponible pendant 2 semaines, toute l\'opération s\'arrête. Impossible d\'égaler la vélocité produit des concurrents financés.'), severity: t('Critical', 'Critique') },
      { label: t('"Do nothing" is the real competitor', '« Ne rien faire » est le vrai concurrent'), detail: t('80%+ of French solo practitioners manage between-session care with paper notes or nothing at all. The cost is zero. The inertia is massive. Only 5% of therapists use AI in practice today (though 55% express interest). Changing behavior is harder than building features.', '80%+ des praticiens français indépendants gèrent le suivi entre les séances avec des notes papier ou rien du tout. Le coût est zéro. L\'inertie est massive. Seulement 5% des thérapeutes utilisent l\'IA en pratique aujourd\'hui (bien que 55% expriment un intérêt). Changer les comportements est plus difficile que construire des fonctionnalités.'), severity: t('High', 'Élevé') },
      { label: t('No clinical evidence base', 'Aucune base de preuves cliniques'), detail: t('No published outcomes data. No clinical trials. No measurement-based care validation. Germany\'s DiGA pathway requires it. EU AI Act high-risk classification expects it. Insurance reimbursement demands it. Without evidence, the regulatory and commercial pathways narrow significantly.', 'Aucune donnée de résultats publiée. Aucun essai clinique. Aucune validation par des soins fondés sur la mesure. Le parcours DiGA en Allemagne l\'exige. La classification à haut risque de l\'AI Act européen l\'attend. Le remboursement par les assurances l\'exige. Sans preuves, les voies réglementaires et commerciales se rétrécissent considérablement.'), severity: t('High', 'Élevé') },
    ],
  }

  // ── Strategic Options ───────────────────────────────────────────────
  const OPTIONS: StrategicOption[] = [
    {
      id: 'A',
      name: t('Capital Preservation', 'Préservation du capital'),
      subtitle: t('Prove PMF in France with minimal spend before scaling', 'Prouver le PMF en France avec un investissement minimal avant de passer à l\'échelle'),
      color: 'text-blue-700',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
      thesis: t('The biggest risk is spending money before proving demand. Raise the minimum viable amount, keep burn at absolute minimum, and achieve product-market fit in one market before expanding. If 30 practitioners pay monthly with <5% churn, you have a business. If not, you preserved capital to pivot.', 'Le plus grand risque est de dépenser avant de prouver la demande. Lever le montant minimum viable, maintenir le burn au minimum absolu, et atteindre le product-market fit sur un seul marché avant de s\'étendre. Si 30 praticiens paient mensuellement avec <5% de churn, vous avez une entreprise. Sinon, vous avez préservé du capital pour pivoter.'),
      description: t('Raise €250-300K. Founder salaries at €2K/month each. No engineering hire for 6 months. Focus exclusively on France. Digital-only GTM: LinkedIn outreach + blog + referrals. No conferences, no partnerships until 30 practitioners achieved. Extend runway to 36+ months. Build slowly, validate deeply.', 'Lever 250-300K€. Salaires fondateurs à 2K€/mois chacun. Aucun recrutement technique pendant 6 mois. Se concentrer exclusivement sur la France. GTM 100% numérique : prospection LinkedIn + blog + recommandations. Pas de conférences, pas de partenariats avant 30 praticiens. Étendre le runway à 36+ mois. Construire lentement, valider en profondeur.'),
      investment: t('€250-300K seed raise', 'Levée seed de 250-300K€'),
      timeline: t('36+ months runway', 'Runway de 36+ mois'),
      expectedOutcome: [
        t('M6: 25-40 practitioners (France only)', 'M6 : 25-40 praticiens (France uniquement)'),
        t('M12: 60-80 practitioners, €2-3K MRR', 'M12 : 60-80 praticiens, 2-3K€ MRR'),
        t('M18: 100-120 practitioners, €4-5K MRR', 'M18 : 100-120 praticiens, 4-5K€ MRR'),
        t('Validated PMF before significant capital deployment', 'PMF validé avant déploiement significatif de capital'),
        t('Founders retain 83-85% equity', 'Les fondateurs conservent 83-85% du capital'),
      ],
      keyRisks: [
        t('Slow growth allows SimplePractice/Doctolib to close window', 'Une croissance lente permet à SimplePractice/Doctolib de fermer la fenêtre'),
        t('Two founders burn out covering all functions for 18+ months', 'Les deux fondateurs s\'épuisent en couvrant toutes les fonctions pendant 18+ mois'),
        t('Cannot hire engineer → product development stalls', 'Impossible de recruter un ingénieur → le développement produit stagne'),
        t('Investors may perceive lack of ambition', 'Les investisseurs peuvent percevoir un manque d\'ambition'),
        t('French-only traction may not justify Series A valuation', 'La traction France uniquement pourrait ne pas justifier une valorisation Series A'),
      ],
      m12Revenue: '€2-3K MRR',
      m12Practitioners: '60-80',
      seriesATimeline: 'M24-M30',
      probabilityOfSuccess: '45%',
    },
    {
      id: 'B',
      name: t('Validated Expansion', 'Expansion validée'),
      subtitle: t('Prove France, then expand to 3 markets within seed runway', 'Prouver la France, puis s\'étendre à 3 marchés dans le runway seed'),
      color: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-500',
      thesis: t('The market window is 12-18 months. You need to prove PMF in France fast (90 days), then demonstrate multi-market viability to justify Series A. Hire one engineer to accelerate product development while founders focus on GTM. Expand to Belgium and Switzerland (zero localization cost) to prove the model works beyond France. Use multi-market traction as the Series A narrative.', 'La fenêtre de marché est de 12-18 mois. Vous devez prouver le PMF en France rapidement (90 jours), puis démontrer la viabilité multi-marchés pour justifier une Series A. Recruter un ingénieur pour accélérer le développement produit tandis que les fondateurs se concentrent sur le GTM. S\'étendre à la Belgique et la Suisse (coût de localisation nul) pour prouver que le modèle fonctionne au-delà de la France. Utiliser la traction multi-marchés comme narratif Series A.'),
      description: t('Raise €350-450K. Hire first engineer within 60 days (€2.5K/month). Founders at €2.5K/month each. Burn: €10-12K/month. France-first GTM with hard 90-day milestone (10 practitioners or pivot). Belgium/Switzerland expansion at M4-6. Begin German localization at M8. Active investor networking from M9. Target Series A by M18.', 'Lever 350-450K€. Recruter le premier ingénieur sous 60 jours (2,5K€/mois). Fondateurs à 2,5K€/mois chacun. Burn : 10-12K€/mois. GTM France d\'abord avec jalon ferme à 90 jours (10 praticiens ou pivot). Expansion Belgique/Suisse à M4-6. Début localisation allemande à M8. Networking investisseurs actif dès M9. Series A ciblée à M18.'),
      investment: t('€350-450K seed raise', 'Levée seed de 350-450K€'),
      timeline: t('28-33 months runway', 'Runway de 28-33 mois'),
      expectedOutcome: [
        t('M3: 15-20 practitioners (France), PMF signal clear', 'M3 : 15-20 praticiens (France), signal PMF clair'),
        t('M6: 50-60 practitioners across FR/BE/CH, €2K MRR', 'M6 : 50-60 praticiens en FR/BE/CH, 2K€ MRR'),
        t('M12: 120-150 practitioners across 3-4 markets, €5-6K MRR', 'M12 : 120-150 praticiens sur 3-4 marchés, 5-6K€ MRR'),
        t('M18: 200+ practitioners, €7-8K MRR, Series A ready', 'M18 : 200+ praticiens, 7-8K€ MRR, prêt pour la Series A'),
        t('Multi-market proof validates B2B2C model internationally', 'La preuve multi-marchés valide le modèle B2B2C à l\'international'),
      ],
      keyRisks: [
        t('Multi-market expansion stretches two founders + one engineer thin', 'L\'expansion multi-marchés étire deux fondateurs + un ingénieur à leurs limites'),
        t('Belgium/Switzerland may not convert despite French language fit', 'La Belgique/Suisse pourrait ne pas convertir malgré la compatibilité francophone'),
        t('If France PMF takes 6 months instead of 3, timeline shifts', 'Si le PMF France prend 6 mois au lieu de 3, le calendrier glisse'),
        t('Bridge round may be needed if Series A takes longer than M18', 'Un bridge pourrait être nécessaire si la Series A prend plus longtemps que M18'),
      ],
      m12Revenue: '€5-6K MRR',
      m12Practitioners: '120-150',
      seriesATimeline: 'M16-M20',
      probabilityOfSuccess: '55%',
    },
    {
      id: 'C',
      name: t('Blitzscale Europe', 'Blitzscale Europe'),
      subtitle: t('Maximum velocity — own the EU category before anyone else can', 'Vélocité maximale — s\'emparer de la catégorie européenne avant tout concurrent'),
      color: 'text-amber-700',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-500',
      thesis: t('The 12-18 month window before SimplePractice/Doctolib convergence is the defining strategic constraint. Speed is everything. Raise the maximum amount, hire aggressively, launch in 5 markets within 12 months, and build network effects that make the position defensible before well-funded competitors enter. Accept higher burn for faster market capture.', 'La fenêtre de 12-18 mois avant la convergence SimplePractice/Doctolib est la contrainte stratégique déterminante. La vitesse est primordiale. Lever le montant maximum, recruter agressivement, lancer sur 5 marchés en 12 mois, et construire des effets de réseau rendant la position défendable avant l\'entrée de concurrents bien financés. Accepter un burn plus élevé pour une prise de marché plus rapide.'),
      description: t('Raise €500-750K. Hire engineer (M1), community manager (M3), and part-time clinical advisor (M3). Burn: €15-18K/month. Simultaneous launch prep for France, Belgium, Switzerland. German and Spanish expansion by M8. Partner with training institutes across all markets. Aggressive conference presence. Target 5 live markets by M10. Series A by M15 at 3-5x step-up.', 'Lever 500-750K€. Recruter un ingénieur (M1), un community manager (M3) et un conseiller clinique à temps partiel (M3). Burn : 15-18K€/mois. Préparation simultanée du lancement France, Belgique, Suisse. Expansion Allemagne et Espagne à M8. Partenariats avec des instituts de formation sur tous les marchés. Présence agressive en conférences. Objectif : 5 marchés actifs à M10. Series A à M15 avec step-up de 3-5x.'),
      investment: t('€500-750K seed raise', 'Levée seed de 500-750K€'),
      timeline: t('22-28 months runway', 'Runway de 22-28 mois'),
      expectedOutcome: [
        t('M3: 25-30 practitioners (France), aggressive outreach', 'M3 : 25-30 praticiens (France), prospection agressive'),
        t('M6: 80-100 practitioners across FR/BE/CH, €3-4K MRR', 'M6 : 80-100 praticiens en FR/BE/CH, 3-4K€ MRR'),
        t('M12: 200-250 practitioners across 5 markets, €8-10K MRR', 'M12 : 200-250 praticiens sur 5 marchés, 8-10K€ MRR'),
        t('M15: Series A at 3-5x step-up (€8-15M valuation)', 'M15 : Series A avec step-up 3-5x (valorisation 8-15M€)'),
        t('Category ownership: "the European between-session care platform"', 'Propriété de la catégorie : « la plateforme européenne de suivi entre les séances »'),
      ],
      keyRisks: [
        t('Higher burn = shorter runway = less room for pivots', 'Burn plus élevé = runway plus court = moins de marge pour pivoter'),
        t('Speed may sacrifice product quality and retention', 'La vitesse peut sacrifier la qualité produit et la rétention'),
        t('Hiring at pre-revenue stage is expensive and risky', 'Recruter au stade pré-revenu est coûteux et risqué'),
        t('If PMF is slower than expected, burn rate becomes existential', 'Si le PMF est plus lent que prévu, le burn rate devient existentiel'),
        t('Raising €500-750K pre-revenue in EU is challenging', 'Lever 500-750K€ en pré-revenu en UE est un défi'),
        t('Team management complexity with 4-5 people before PMF', 'Complexité de gestion d\'équipe avec 4-5 personnes avant le PMF'),
      ],
      m12Revenue: '€8-10K MRR',
      m12Practitioners: '200-250',
      seriesATimeline: 'M12-M16',
      probabilityOfSuccess: '35%',
    },
  ]

  // ── Priority Initiatives ────────────────────────────────────────────
  const INITIATIVES: Initiative[] = [
    {
      rank: 1,
      title: t('Close 10 paying practitioners in 90 days', 'Convertir 10 praticiens payants en 90 jours'),
      rationale: t('Nothing else matters until money changes hands. Every strength (unit economics, AI, B2B2C architecture) is a hypothesis until validated by revenue. The 90-day window creates urgency. If this fails, pivot before burning more capital.', 'Rien d\'autre ne compte tant que de l\'argent n\'a pas changé de mains. Chaque force (économie unitaire, IA, architecture B2B2C) est une hypothèse tant qu\'elle n\'est pas validée par du revenu. La fenêtre de 90 jours crée l\'urgence. En cas d\'échec, pivoter avant de brûler davantage de capital.'),
      owner: t('Both founders', 'Les deux fondateurs'),
      timeline: t('Day 1 → Day 90', 'Jour 1 → Jour 90'),
      metric: t('10 practitioners paying €29/mo, <8% churn, NPS >30', '10 praticiens payant 29€/mois, <8% churn, NPS >30'),
      investment: t('€0 cash (100% founder time)', '0€ en cash (100% du temps des fondateurs)'),
      color: 'border-red-200 bg-red-50',
    },
    {
      rank: 2,
      title: t('Close seed round within 60 days', 'Clôturer la levée seed en 60 jours'),
      rationale: t('Fundraising is a full-time job that competes with sales. Every week spent fundraising is a week not spent acquiring practitioners. Target €350-450K. Minimum viable: €250K. Close fast, then redirect all energy to GTM.', 'La levée de fonds est un travail à plein temps qui concurrence les ventes. Chaque semaine passée à lever des fonds est une semaine non consacrée à l\'acquisition de praticiens. Cible : 350-450K€. Minimum viable : 250K€. Clôturer rapidement, puis rediriger toute l\'énergie vers le GTM.'),
      owner: t('Lead founder', 'Fondateur principal'),
      timeline: t('Day 1 → Day 60', 'Jour 1 → Jour 60'),
      metric: t('Term sheet signed, funds in bank', 'Term sheet signé, fonds en banque'),
      investment: t('Pipeline of 40+ investors, 15-20 meetings/week', 'Pipeline de 40+ investisseurs, 15-20 réunions/semaine'),
      color: 'border-amber-200 bg-amber-50',
    },
    {
      rank: 3,
      title: t('Hire first engineer', 'Recruter le premier ingénieur'),
      rationale: t('The two-person team bottleneck is a critical risk (R4, score 16). Every hour founders spend on engineering is an hour not spent on sales or fundraising. One senior full-stack engineer at €2.5K/month doubles product velocity and frees founders for GTM.', 'Le goulot d\'étranglement de l\'équipe à deux personnes est un risque critique (R4, score 16). Chaque heure que les fondateurs passent sur l\'ingénierie est une heure non consacrée aux ventes ou à la levée de fonds. Un ingénieur full-stack senior à 2,5K€/mois double la vélocité produit et libère les fondateurs pour le GTM.'),
      owner: t('CTO founder', 'Fondateur CTO'),
      timeline: t('Post-seed close → 30 days', 'Post-clôture seed → 30 jours'),
      metric: t('Engineer onboarded, first PR merged within 14 days', 'Ingénieur intégré, première PR mergée sous 14 jours'),
      investment: t('€2,500/month (€30K/year)', '2 500€/mois (30K€/an)'),
      color: 'border-blue-200 bg-blue-50',
    },
    {
      rank: 4,
      title: t('Establish Clinical Advisory Board', 'Constituer le comité consultatif clinique'),
      rationale: t('No clinical advisor on the team is a high-severity weakness. Two advisors (one French psychologist, one EU health-tech regulatory expert) fill the credibility gap, de-risk AI safety, inform product development, and strengthen investor narrative. Cost: equity (0.25-0.5% each) + €500/month stipend.', 'L\'absence de conseiller clinique dans l\'équipe est une faiblesse de haute gravité. Deux conseillers (un psychologue français, un expert réglementaire health-tech UE) comblent le déficit de crédibilité, réduisent les risques liés à la sécurité de l\'IA, orientent le développement produit et renforcent le narratif investisseur. Coût : equity (0,25-0,5% chacun) + 500€/mois.'),
      owner: t('Both founders', 'Les deux fondateurs'),
      timeline: t('Day 30 → Day 75', 'Jour 30 → Jour 75'),
      metric: t('2 advisors signed, first meeting held, DPIA completed', '2 conseillers signés, première réunion tenue, AIPD complétée'),
      investment: t('0.5-1% equity + €1K/month', '0,5-1% equity + 1K€/mois'),
      color: 'border-violet-200 bg-violet-50',
    },
    {
      rank: 5,
      title: t('Launch French content engine', 'Lancer le moteur de contenu français'),
      rationale: t('SEO is the highest-ROI channel long-term (181x LTV/CAC) and compounds over time. Starting now means 500+ organic visits by M6 and 2,000+ by M12. Content = credibility + pipeline. Every blog post targeting "gestion cabinet psychologue" or "suivi patient entre séances" builds a moat competitors cannot buy.', 'Le SEO est le canal au meilleur ROI à long terme (181x LTV/CAC) et s\'accumule avec le temps. Commencer maintenant signifie 500+ visites organiques à M6 et 2 000+ à M12. Contenu = crédibilité + pipeline. Chaque article de blog ciblant « gestion cabinet psychologue » ou « suivi patient entre séances » construit un avantage que les concurrents ne peuvent pas acheter.'),
      owner: t('Content founder + AI assist', 'Fondateur contenu + assistance IA'),
      timeline: t('Day 14 → ongoing (1 post/week)', 'Jour 14 → continu (1 article/semaine)'),
      metric: t('8 posts published in 60 days, 200+ organic visits by M3', '8 articles publiés en 60 jours, 200+ visites organiques à M3'),
      investment: t('€200/month (tooling + design)', '200€/mois (outils + design)'),
      color: 'border-emerald-200 bg-emerald-50',
    },
  ]

  // ── Resource Requirements ───────────────────────────────────────────
  const RESOURCES: ResourceReq[] = [
    {
      category: t('People', 'Personnes'),
      icon: Users,
      color: 'text-blue-600',
      items: [
        { role: t('Full-stack engineer', 'Ingénieur full-stack'), cost: t('€2,500/mo (€30K/yr)', '2 500€/mois (30K€/an)'), when: t('M1 (post-seed)', 'M1 (post-seed)'), why: t('Doubles product velocity. Frees founders for GTM. Addresses R4 (team bottleneck).', 'Double la vélocité produit. Libère les fondateurs pour le GTM. Adresse R4 (goulot d\'étranglement équipe).') },
        { role: t('Clinical advisor (French psychologist)', 'Conseiller clinique (psychologue français)'), cost: t('0.25% equity + €500/mo', '0,25% equity + 500€/mois'), when: 'M1-M2', why: t('Product credibility, AI safety review, practitioner association introductions.', 'Crédibilité produit, revue sécurité IA, introductions aux associations de praticiens.') },
        { role: t('Regulatory advisor (EU health-tech)', 'Conseiller réglementaire (health-tech UE)'), cost: t('0.25% equity + €500/mo', '0,25% equity + 500€/mois'), when: 'M2-M3', why: t('GDPR audit, AI Act prep, HDS consultation, DiGA pathway research.', 'Audit RGPD, préparation AI Act, consultation HDS, recherche parcours DiGA.') },
        { role: t('German community manager (part-time)', 'Community manager allemand (temps partiel)'), cost: t('€1,500/mo', '1 500€/mois'), when: 'M7-M8', why: t('German market entry. Localization quality assurance. DGPs/BDP outreach.', 'Entrée sur le marché allemand. Assurance qualité localisation. Prospection DGPs/BDP.') },
        { role: t('Customer success (part-time)', 'Succès client (temps partiel)'), cost: t('€1,500/mo', '1 500€/mois'), when: 'M9-M10', why: t('White-glove onboarding at scale. Retention. Churn prevention.', 'Onboarding premium à grande échelle. Rétention. Prévention du churn.') },
      ],
    },
    {
      category: t('Capital', 'Capital'),
      icon: DollarSign,
      color: 'text-emerald-600',
      items: [
        { role: t('Seed round', 'Tour seed'), cost: '€350-450K', when: t('M0 (immediate)', 'M0 (immédiat)'), why: t('Runway for 28-33 months. Covers team, GTM, expansion, compliance.', 'Runway de 28-33 mois. Couvre l\'équipe, le GTM, l\'expansion, la conformité.') },
        { role: 'Bpifrance Bourse French Tech', cost: t('€30K (non-dilutive)', '30K€ (non dilutif)'), when: t('M2-M4 (apply)', 'M2-M4 (candidature)'), why: t('Extends runway 3 months without dilution. Validates French institutional support.', 'Étend le runway de 3 mois sans dilution. Valide le soutien institutionnel français.') },
        { role: t('EU innovation grants', 'Subventions innovation UE'), cost: t('€50-100K (non-dilutive)', '50-100K€ (non dilutif)'), when: t('M6-M12 (apply)', 'M6-M12 (candidature)'), why: t('EIC Accelerator, Horizon Europe. Funds clinical evidence + German expansion.', 'EIC Accelerator, Horizon Europe. Finance les preuves cliniques + l\'expansion allemande.') },
      ],
    },
    {
      category: t('Tools & Infrastructure', 'Outils et infrastructure'),
      icon: Layers,
      color: 'text-violet-600',
      items: [
        { role: 'Stripe (payments)', cost: '2.9% + €0.25/txn', when: t('Pre-launch', 'Pré-lancement'), why: t('Multi-currency billing (EUR, CHF, GBP). Subscription management. Tax compliance.', 'Facturation multi-devises (EUR, CHF, GBP). Gestion des abonnements. Conformité fiscale.') },
        { role: 'LinkedIn Sales Navigator', cost: '€80/mo', when: t('Pre-launch', 'Pré-lancement'), why: t('Targeted practitioner outreach. 287% higher reply rate vs. cold email.', 'Prospection ciblée de praticiens. Taux de réponse 287% supérieur vs. email à froid.') },
        { role: 'HubSpot CRM (free tier)', cost: '€0', when: t('Pre-launch', 'Pré-lancement'), why: t('Pipeline management. Investor tracking. Support tickets. Already integrated.', 'Gestion du pipeline. Suivi investisseurs. Tickets support. Déjà intégré.') },
        { role: t('Penetration test', 'Test de pénétration'), cost: t('€3-5K (one-time)', '3-5K€ (unique)'), when: 'M4-M6', why: t('Security validation. Addresses R14 (data breach risk). SOC 2 prep.', 'Validation sécurité. Adresse R14 (risque de fuite de données). Préparation SOC 2.') },
      ],
    },
  ]

  // ── Decision Framework ──────────────────────────────────────────────
  const DECISION_FRAMEWORK: DecisionCriteria[] = [
    {
      criterion: t('Does this accelerate time to 10 paying practitioners?', 'Cela accélère-t-il l\'atteinte de 10 praticiens payants ?'),
      weight: '30%',
      description: t('Revenue validation is the single highest-priority objective. Every decision should be evaluated against its impact on closing the first 10 customers.', 'La validation par le revenu est l\'objectif prioritaire unique. Chaque décision doit être évaluée selon son impact sur la conversion des 10 premiers clients.'),
      greenSignal: t('Directly creates or enables a practitioner conversion', 'Crée ou facilite directement une conversion de praticien'),
      redSignal: t('Nice-to-have that doesn\'t move the conversion needle', 'Accessoire qui ne fait pas avancer la conversion'),
    },
    {
      criterion: t('Does this reduce existential risk?', 'Cela réduit-il un risque existentiel ?'),
      weight: '25%',
      description: t('Four critical risks (R1: slow adoption, R4: team bottleneck, R6: no PMF, R9: Series A gap) threaten company survival. Prioritize actions that directly mitigate these.', 'Quatre risques critiques (R1 : adoption lente, R4 : goulot d\'étranglement équipe, R6 : pas de PMF, R9 : fossé Series A) menacent la survie de l\'entreprise. Prioriser les actions qui les atténuent directement.'),
      greenSignal: t('Addresses a critical (16) or high (12+) severity risk', 'Adresse un risque de gravité critique (16) ou élevée (12+)'),
      redSignal: t('Addresses a medium/low risk that isn\'t urgent', 'Adresse un risque moyen/faible qui n\'est pas urgent'),
    },
    {
      criterion: t('Is this reversible if wrong?', 'Est-ce réversible en cas d\'erreur ?'),
      weight: '15%',
      description: t('At pre-revenue, optionality is worth more than certainty. Prefer decisions that can be unwound in 2-4 weeks over those that lock the company into a path.', 'En pré-revenu, l\'optionalité vaut plus que la certitude. Préférer les décisions réversibles en 2-4 semaines à celles qui engagent l\'entreprise sur un chemin.'),
      greenSignal: t('Can be reversed or abandoned with minimal sunk cost', 'Peut être annulé ou abandonné avec un coût irrécupérable minimal'),
      redSignal: t('Creates long-term commitment (annual contracts, hires, entity setup)', 'Crée un engagement à long terme (contrats annuels, recrutements, création d\'entité)'),
    },
    {
      criterion: t('Does the data support this?', 'Les données soutiennent-elles cela ?'),
      weight: '15%',
      description: t('With 187 interviews and a live MVP, decisions should be grounded in observed behavior — not hypotheses. If no data exists, design the experiment first.', 'Avec 187 entretiens et un MVP en production, les décisions doivent s\'appuyer sur des comportements observés — pas des hypothèses. Si aucune donnée n\'existe, concevoir d\'abord l\'expérimentation.'),
      greenSignal: t('Based on user behavior, conversion data, or market evidence', 'Basé sur le comportement utilisateur, les données de conversion ou les preuves de marché'),
      redSignal: t('Based on founder intuition alone, without validation', 'Basé uniquement sur l\'intuition des fondateurs, sans validation'),
    },
    {
      criterion: t('Does this compound over time?', 'Cela se capitalise-t-il avec le temps ?'),
      weight: '15%',
      description: t('The highest-ROI activities (SEO, referrals, network effects) compound. Choose actions that are 10% better each month over one-time efforts.', 'Les activités au meilleur ROI (SEO, recommandations, effets de réseau) s\'accumulent. Choisir des actions qui s\'améliorent de 10% chaque mois plutôt que des efforts ponctuels.'),
      greenSignal: t('Creates an asset that grows in value (content, network, data)', 'Crée un actif qui prend de la valeur (contenu, réseau, données)'),
      redSignal: t('One-time effort with diminishing returns', 'Effort ponctuel avec des rendements décroissants'),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Strategic Recommendation', 'Recommandation stratégique')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — CEO Strategy Brief, Q1 2026', 'Bloomsline Care — Note stratégique CEO, T1 2026')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '\u{1F1EB}\u{1F1F7} Fran\u00e7ais' : '\u{1F1EC}\u{1F1E7} English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── Confidential Banner ─────────────────────────────── */}
        <motion.div {...fadeUp()} className="bg-gray-900 text-white rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">{t('Confidential', 'Confidentiel')}</p>
              <p className="text-[9px] text-gray-500">{t('Strategic Advisory — For CEO & Board Only', 'Conseil stratégique — Réservé au CEO et au Conseil')}</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-500">{t('February 2026', 'Février 2026')}</p>
        </motion.div>

        {/* ── 1. Executive Summary ────────────────────────────── */}
        <motion.section {...fadeUp(0.03)}>
          <SectionTitle subtitle={t('3-paragraph strategic overview — 2-minute read', 'Synthèse stratégique en 3 paragraphes — lecture de 2 minutes')}>{t('Executive Summary', 'Résumé exécutif')}</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">{t('The opportunity is real and time-bound.', 'L\'opportunité est réelle et limitée dans le temps.')}</span> {t('Bloomsline operates in a $33B global digital mental health market growing at 18.6% CAGR, targeting a €166M European segment with zero direct competitors. The B2B2C architecture — where one practitioner sale yields 12-15 free members — creates unit economics (72.5x LTV/CAC, 85% gross margin) that are structurally superior to any adjacent competitor. The B2C therapy model is collapsing (BetterHelp -11%, Woebot shutdown), and capital is migrating to practitioner-first models (Talkspace B2B +42% YoY). The EU regulatory landscape (GDPR, AI Act, DiGA) favors European-native builders. The window to own this category is 12-18 months before SimplePractice ($4B, Vista) or Doctolib (€6.4B) converge into the space.', 'Bloomsline opère dans un marché mondial de la santé mentale numérique de 33 milliards $, en croissance de 18,6% TCAC, ciblant un segment européen de 166M€ sans aucun concurrent direct. L\'architecture B2B2C — où une vente praticien génère 12-15 membres gratuits — crée une économie unitaire (72,5x LTV/CAC, marge brute 85%) structurellement supérieure à tout concurrent adjacent. Le modèle B2C de thérapie s\'effondre (BetterHelp -11%, fermeture Woebot), et les capitaux migrent vers les modèles centrés sur le praticien (Talkspace B2B +42% en glissement annuel). Le paysage réglementaire européen (RGPD, AI Act, DiGA) favorise les acteurs européens natifs. La fenêtre pour s\'emparer de cette catégorie est de 12-18 mois avant que SimplePractice (4 milliards $, Vista) ou Doctolib (6,4 milliards €) ne convergent vers cet espace.')}
            </p>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">{t('The product is built. Revenue is not.', 'Le produit est construit. Le revenu ne l\'est pas.')}</span> {t('The MVP is complete and technically impressive: 24+ API endpoints, 7 AI features (Claude Haiku/Sonnet), 3-language support, mobile app, real-time subscriptions. 187 discovery interviews across 7 countries validate the problem. But every financial metric — LTV, CAC, churn, LTV/CAC — is projected, not observed. Two founders cover every function. There are no paying customers, no clinical evidence, and no engineering team beyond the founding pair. The gap between a well-built product and a viable business remains the central strategic challenge.', 'Le MVP est complet et techniquement impressionnant : 24+ endpoints API, 7 fonctionnalités IA (Claude Haiku/Sonnet), support 3 langues, application mobile, abonnements en temps réel. 187 entretiens de découverte dans 7 pays valident le problème. Mais chaque métrique financière — LTV, CAC, churn, LTV/CAC — est projetée, non observée. Deux fondateurs couvrent toutes les fonctions. Il n\'y a aucun client payant, aucune preuve clinique, et aucune équipe technique au-delà du duo fondateur. L\'écart entre un produit bien construit et une entreprise viable reste le défi stratégique central.')}
            </p>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">{t('Our recommendation: Option B — Validated Expansion.', 'Notre recommandation : Option B — Expansion validée.')}</span> {t('Raise €350-450K. Set a non-negotiable 90-day milestone: 10 paying practitioners or pivot positioning. Hire one engineer immediately post-seed to free founders for GTM. Expand to Belgium and Switzerland at M4-6 (zero localization cost) to prove multi-market viability. Begin German localization at M8. Target 120-150 practitioners across 3-4 markets by Month 12. This approach balances speed against capital preservation, creates a compelling Series A narrative, and maintains optionality to pivot if PMF is slower than modeled.', 'Lever 350-450K€. Fixer un jalon non négociable à 90 jours : 10 praticiens payants ou pivot du positionnement. Recruter un ingénieur immédiatement après le seed pour libérer les fondateurs pour le GTM. S\'étendre à la Belgique et la Suisse à M4-6 (coût de localisation nul) pour prouver la viabilité multi-marchés. Commencer la localisation allemande à M8. Cibler 120-150 praticiens sur 3-4 marchés d\'ici le mois 12. Cette approche équilibre la vitesse et la préservation du capital, crée un narratif Series A convaincant et maintient l\'optionalité de pivoter si le PMF est plus lent que modélisé.')}
            </p>
          </div>
        </motion.section>

        {/* ── 2. Current State Assessment ─────────────────────── */}
        <motion.section {...fadeUp(0.08)}>
          <SectionTitle subtitle={t('Where the business stands today — an honest assessment', 'Où en est l\'entreprise aujourd\'hui — une évaluation honnête')}>{t('Current State Assessment', 'Évaluation de l\'état actuel')}</SectionTitle>

          {/* Situation snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: t('Stage', 'Stade'), value: t('Pre-revenue', 'Pré-revenu'), sub: t('MVP complete, Q1 2026', 'MVP complet, T1 2026'), color: 'text-amber-600' },
              { label: t('Revenue', 'Revenu'), value: '€0', sub: t('0 paying customers', '0 client payant'), color: 'text-red-600' },
              { label: t('Team', 'Équipe'), value: t('2 founders', '2 fondateurs'), sub: t('No employees', 'Aucun employé'), color: 'text-amber-600' },
              { label: t('Product', 'Produit'), value: t('MVP live', 'MVP en ligne'), sub: t('24+ APIs, 7 AI endpoints', '24+ API, 7 endpoints IA'), color: 'text-emerald-600' },
              { label: t('Validation', 'Validation'), value: t('187 interviews', '187 entretiens'), sub: t('68 practitioners, 7 countries', '68 praticiens, 7 pays'), color: 'text-emerald-600' },
              { label: t('Funding', 'Financement'), value: t('Seeking €250-500K', 'Recherche 250-500K€'), sub: t('Pre-seed / Seed', 'Pré-seed / Seed'), color: 'text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className={`text-sm font-bold ${item.color} mt-0.5`}>{item.value}</p>
                <p className="text-[9px] text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <h3 className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('What\'s Working', 'Ce qui fonctionne')}
          </h3>
          <div className="space-y-2 mb-6">
            {CURRENT_STATE.strengths.map((s, i) => (
              <motion.div key={i} className="bg-white border border-emerald-100 rounded-xl p-4" {...fadeUp(0.1 + i * 0.02)}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-[11px] font-bold text-gray-900">{s.label}</h4>
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">{s.rating}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">{s.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Weaknesses */}
          <h3 className="text-xs font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {t('What Needs to Be Said', 'Ce qu\'il faut dire')}
          </h3>
          <div className="space-y-2">
            {CURRENT_STATE.weaknesses.map((w, i) => (
              <motion.div key={i} className="bg-white border border-red-100 rounded-xl p-4" {...fadeUp(0.22 + i * 0.02)}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-[11px] font-bold text-gray-900">{w.label}</h4>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    w.severity === t('Critical', 'Critique') ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>{w.severity}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">{w.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 3. Strategic Options ────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('Three distinct paths forward — with expected outcomes, costs, and risks', 'Trois voies distinctes — avec résultats attendus, coûts et risques')}>
            {t('Strategic Options', 'Options stratégiques')}
          </SectionTitle>

          <div className="space-y-5">
            {OPTIONS.map((opt, i) => (
              <motion.div
                key={opt.id}
                className={`border ${opt.id === 'B' ? opt.borderColor + ' ring-2 ring-emerald-100' : 'border-gray-200'} rounded-xl overflow-hidden`}
                {...fadeUp(0.32 + i * 0.05)}
              >
                {/* Option header */}
                <div className={`${opt.bgColor} px-5 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black ${opt.textColor}`}>Option {opt.id}</span>
                    <div>
                      <h3 className={`text-sm font-bold ${opt.textColor}`}>{opt.name}</h3>
                      <p className="text-[10px] text-gray-500">{opt.subtitle}</p>
                    </div>
                  </div>
                  {opt.id === 'B' && (
                    <span className="text-[9px] font-bold text-white bg-emerald-600 px-3 py-1 rounded-full">
                      {t('RECOMMENDED', 'RECOMMANDÉ')}
                    </span>
                  )}
                </div>

                <div className="bg-white p-5">
                  {/* Thesis */}
                  <p className="text-[10px] text-gray-600 leading-relaxed mb-4 italic border-l-2 border-gray-200 pl-3">
                    &ldquo;{opt.thesis}&rdquo;
                  </p>

                  {/* Description */}
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{opt.description}</p>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('Investment', 'Investissement')}</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.investment}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('M12 Revenue', 'Revenu M12')}</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.m12Revenue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('M12 Users', 'Utilisateurs M12')}</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.m12Practitioners}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">Series A</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.seriesATimeline}</p>
                    </div>
                  </div>

                  {/* Outcomes + Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">{t('Expected Outcomes', 'Résultats attendus')}</p>
                      <div className="space-y-1">
                        {opt.expectedOutcome.map((o, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-emerald-700">{o}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-1.5">{t('Key Risks', 'Risques clés')}</p>
                      <div className="space-y-1">
                        {opt.keyRisks.map((r, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-red-700">{r}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Success probability */}
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-[9px] text-gray-400">{t('Estimated probability of achieving Series A:', 'Probabilité estimée d\'atteindre la Series A :')}</p>
                    <span className={`text-[10px] font-bold ${
                      opt.id === 'B' ? 'text-emerald-600' : opt.id === 'A' ? 'text-blue-600' : 'text-amber-600'
                    }`}>{opt.probabilityOfSuccess}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 4. Recommended Strategy ─────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle={t('Why Option B — and why now', 'Pourquoi l\'Option B — et pourquoi maintenant')}>{t('Recommended Strategy', 'Stratégie recommandée')}</SectionTitle>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-800">{t('Option B: Validated Expansion', 'Option B : Expansion validée')}</h3>
                <p className="text-[10px] text-emerald-600">{t('€350-450K raise, 3-4 markets in 12 months, Series A by M18', 'Levée 350-450K€, 3-4 marchés en 12 mois, Series A à M18')}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { reason: t('Balances speed against capital preservation', 'Équilibre entre vitesse et préservation du capital'), detail: t('28-33 months of runway provides 2 full pivots if needed, while €10-12K monthly burn supports one engineering hire and multi-market expansion. Option A is too slow for the window. Option C burns too fast for the validation stage.', '28-33 mois de runway offrent 2 pivots complets si nécessaire, tandis qu\'un burn mensuel de 10-12K€ permet un recrutement technique et une expansion multi-marchés. L\'option A est trop lente pour la fenêtre. L\'option C brûle trop vite pour le stade de validation.') },
                { reason: t('Multi-market traction is the Series A differentiator', 'La traction multi-marchés est le facteur différenciant pour la Series A'), detail: t('A French-only company with 80 practitioners is a lifestyle business. A 3-market company with 150 practitioners demonstrating B2B2C network effects across borders is a venture-scale opportunity. The Belgium/Switzerland expansion costs near-zero (French language) but multiplies the narrative.', 'Une entreprise française uniquement avec 80 praticiens est un lifestyle business. Une entreprise sur 3 marchés avec 150 praticiens démontrant des effets de réseau B2B2C transfrontaliers est une opportunité à l\'échelle venture. L\'expansion Belgique/Suisse coûte quasi-zéro (langue française) mais multiplie le narratif.') },
                { reason: t('90-day hard milestone creates accountability', 'Le jalon ferme à 90 jours crée la responsabilisation'), detail: t('10 paying practitioners by Day 90 — or pivot. This is the single most important gate. If the product cannot convert 10 practitioners in a market of 30,000 with founder-led sales, the problem is not the go-to-market. It is the product or the market.', '10 praticiens payants au jour 90 — ou pivot. C\'est le point de passage le plus important. Si le produit ne peut pas convertir 10 praticiens sur un marché de 30 000 avec des ventes menées par les fondateurs, le problème n\'est pas le go-to-market. C\'est le produit ou le marché.') },
                { reason: t('Maintains optionality for all scenarios', 'Maintient l\'optionalité pour tous les scénarios'), detail: t('If France exceeds expectations → accelerate to Option C velocity. If growth is slower → contract to Option A discipline. If PMF is absent → pivot or wind down with 18+ months of runway remaining. Option B is the only strategy that keeps all three doors open.', 'Si la France dépasse les attentes → accélérer à la vélocité de l\'option C. Si la croissance est plus lente → se contracter à la discipline de l\'option A. Si le PMF est absent → pivoter ou arrêter avec 18+ mois de runway restants. L\'option B est la seule stratégie qui garde les trois portes ouvertes.') },
              ].map((r, i) => (
                <div key={i} className="bg-white/70 rounded-lg p-3.5">
                  <h4 className="text-[11px] font-bold text-emerald-800 mb-1">{r.reason}</h4>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>

            {/* What Option B is NOT */}
            <div className="bg-white/50 rounded-lg p-3.5 border border-emerald-100">
              <p className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wider mb-2">{t('What This Strategy Is Not', 'Ce que cette stratégie n\'est pas')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  t('Not "move slow" — 90-day deadline is aggressive', 'Pas « aller lentement » — le délai de 90 jours est agressif'),
                  t('Not "spend everything" — 28-33 months of runway', 'Pas « tout dépenser » — 28-33 mois de runway'),
                  t('Not "France forever" — Belgium/Switzerland by M6', 'Pas « la France pour toujours » — Belgique/Suisse à M6'),
                  t('Not "hope for the best" — hard gates at M3, M6, M12', 'Pas « espérer le meilleur » — jalons fermes à M3, M6, M12'),
                ].map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Crosshair className="w-3 h-3 text-emerald-500 shrink-0" />
                    <p className="text-[10px] text-emerald-700">{n}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 5. Priority Initiatives (90 days) ──────────────── */}
        <motion.section {...fadeUp(0.55)}>
          <SectionTitle subtitle={t('The 5 highest-impact actions for the next 90 days — ranked', 'Les 5 actions à plus fort impact pour les 90 prochains jours — classées')}>
            {t('Priority Initiatives', 'Initiatives prioritaires')}
          </SectionTitle>

          <div className="space-y-3">
            {INITIATIVES.map((init, i) => (
              <motion.div
                key={init.rank}
                className={`bg-white border ${init.color.split(' ')[0]} rounded-xl p-5`}
                {...fadeUp(0.57 + i * 0.03)}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-xl ${init.color.split(' ')[1]} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-black ${init.color.split(' ')[0].replace('border-', 'text-').replace('-200', '-700')}`}>
                      {init.rank}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">{init.title}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">{init.rationale}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('Owner', 'Responsable')}</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.owner}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('Timeline', 'Calendrier')}</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.timeline}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('Success Metric', 'Métrique de succès')}</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.metric}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">{t('Investment', 'Investissement')}</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.investment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Resource Requirements ────────────────────────── */}
        <motion.section {...fadeUp(0.7)}>
          <SectionTitle subtitle={t('People, capital, and tools needed to execute Option B', 'Personnes, capital et outils nécessaires pour exécuter l\'option B')}>
            {t('Resource Requirements', 'Ressources nécessaires')}
          </SectionTitle>

          <div className="space-y-4">
            {RESOURCES.map((res, i) => {
              const ResIcon = res.icon
              return (
                <motion.div key={res.category} className="bg-white border border-gray-200 rounded-xl p-5" {...fadeUp(0.72 + i * 0.03)}>
                  <div className="flex items-center gap-2 mb-4">
                    <ResIcon className={`w-4 h-4 ${res.color}`} />
                    <h3 className="text-sm font-bold text-gray-900">{res.category}</h3>
                  </div>
                  <div className="space-y-2">
                    {res.items.map((item, j) => (
                      <div key={j} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <span className="text-[10px] font-semibold text-gray-700">{item.role}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">{item.cost}</span>
                            <span className="text-[9px] text-gray-400">{item.when}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500">{item.why}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 7. Decision Framework ──────────────────────────── */}
        <motion.section {...fadeUp(0.8)}>
          <SectionTitle subtitle={t('A simple matrix for making the next 10 strategic decisions', 'Une matrice simple pour prendre les 10 prochaines décisions stratégiques')}>
            {t('Decision Framework', 'Cadre décisionnel')}
          </SectionTitle>

          <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
            {t('For every strategic decision over the next 12 months, score it against these 5 criteria. If total score is below 60%, do not proceed. If above 80%, act immediately.', 'Pour chaque décision stratégique des 12 prochains mois, évaluez-la selon ces 5 critères. Si le score total est inférieur à 60%, ne pas poursuivre. Si supérieur à 80%, agir immédiatement.')}
          </p>

          <div className="space-y-3">
            {DECISION_FRAMEWORK.map((d, i) => (
              <motion.div key={i} className="bg-white border border-gray-200 rounded-xl p-4" {...fadeUp(0.82 + i * 0.025)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-[11px] font-bold text-gray-900">{d.criterion}</h4>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                    {t('Weight', 'Poids')} : {d.weight}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">{d.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-emerald-700 mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {t('Green Signal', 'Signal vert')}
                    </p>
                    <p className="text-[9px] text-emerald-600">{d.greenSignal}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-red-700 mb-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> {t('Red Signal', 'Signal rouge')}
                    </p>
                    <p className="text-[9px] text-red-600">{d.redSignal}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 8. "If I Only Had 1 Hour" Brief ────────────────── */}
        <motion.section {...fadeUp(0.95)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4.5 h-4.5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold">{t('If I Only Had 1 Hour', 'Si je n\'avais qu\'une heure')}</h2>
                <p className="text-[10px] text-gray-400">{t('The single most important insight and action', 'L\'insight et l\'action les plus importants')}</p>
              </div>
            </div>

            {/* The Insight */}
            <div className="bg-white/10 rounded-lg p-5 mb-5">
              <p className="text-[9px] font-semibold text-amber-300 uppercase tracking-wider mb-2">{t('The Insight', 'L\'insight')}</p>
              <p className="text-sm text-white font-semibold leading-relaxed mb-3">
                {t('Bloomsline has built a structurally superior product in a market with zero direct competitors and favorable timing. The only question that matters is whether practitioners will pay for it.', 'Bloomsline a construit un produit structurellement supérieur dans un marché sans concurrent direct et avec un timing favorable. La seule question qui compte est de savoir si les praticiens paieront pour l\'utiliser.')}
              </p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {t('Every other question — expansion strategy, team scaling, regulatory compliance, competitive positioning — is downstream of this one. The 72.5x LTV/CAC ratio, the EU regulatory moat, the Care Network Effect, the $33B TAM — all of it is a hypothesis until the first 10 practitioners pay €29/month and continue paying the following month. Woebot raised $123M and had Stanford-published RCTs. They still failed. The product is not the hard part. Converting the first dollar of recurring revenue is the hard part.', 'Toute autre question — stratégie d\'expansion, passage à l\'échelle de l\'équipe, conformité réglementaire, positionnement concurrentiel — est en aval de celle-ci. Le ratio LTV/CAC de 72,5x, l\'avantage réglementaire européen, l\'effet réseau de soins, le TAM de 33 milliards $ — tout cela reste une hypothèse tant que les 10 premiers praticiens ne paient pas 29€/mois et ne continuent pas de payer le mois suivant. Woebot a levé 123M$ et avait des ECR publiées par Stanford. Ils ont quand même échoué. Le produit n\'est pas la partie difficile. Convertir le premier euro de revenu récurrent est la partie difficile.')}
              </p>
            </div>

            {/* The Action */}
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-5 mb-5">
              <p className="text-[9px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">{t('The Action', 'L\'action')}</p>
              <p className="text-sm text-white font-semibold leading-relaxed mb-3">
                {t('Tomorrow morning, message 10 practitioners from your interview pool. Offer them the product at €29/month. Not a free trial. Not a demo. A paid subscription. Today.', 'Demain matin, contactez 10 praticiens de votre panel d\'entretiens. Proposez-leur le produit à 29€/mois. Pas un essai gratuit. Pas une démo. Un abonnement payant. Aujourd\'hui.')}
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {t('You have 187 interviews. At least 20-30 of those practitioners expressed strong interest. They have seen the product. They know the founders. The barrier to asking for money is psychological, not strategic. If 3 out of 10 say yes, you have product-market signal. If 0 out of 10 say yes, you have the most valuable data point in the company\'s history — and you got it before spending any investor capital.', 'Vous avez 187 entretiens. Au moins 20-30 de ces praticiens ont exprimé un fort intérêt. Ils ont vu le produit. Ils connaissent les fondateurs. La barrière pour demander de l\'argent est psychologique, pas stratégique. Si 3 sur 10 disent oui, vous avez un signal de product-market fit. Si 0 sur 10 disent oui, vous avez le point de données le plus précieux de l\'histoire de l\'entreprise — et vous l\'avez obtenu avant de dépenser du capital investisseur.')}
              </p>
            </div>

            {/* The Logic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">{t('If 3+ say yes', 'Si 3+ disent oui')}</p>
                <p className="text-[10px] text-emerald-300 font-semibold">{t('PMF signal confirmed', 'Signal PMF confirmé')}</p>
                <p className="text-[9px] text-gray-500 mt-1">{t('Raise seed with confidence. Execute Option B.', 'Lever le seed avec confiance. Exécuter l\'option B.')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">{t('If 1-2 say yes', 'Si 1-2 disent oui')}</p>
                <p className="text-[10px] text-amber-300 font-semibold">{t('Signal but not conviction', 'Signal mais pas conviction')}</p>
                <p className="text-[9px] text-gray-500 mt-1">{t('Iterate on pricing or positioning. Try 10 more.', 'Itérer sur le prix ou le positionnement. Essayer avec 10 de plus.')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">{t('If 0 say yes', 'Si 0 disent oui')}</p>
                <p className="text-[10px] text-red-300 font-semibold">{t('Critical data point', 'Point de données critique')}</p>
                <p className="text-[9px] text-gray-500 mt-1">{t('Understand why before raising. This saves you 6 months.', 'Comprendre pourquoi avant de lever. Cela vous fait gagner 6 mois.')}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <motion.div {...fadeUp(1.0)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Confidential — Strategic Advisory — February 2026 — Bloomsline Care', 'Confidentiel — Conseil stratégique — Février 2026 — Bloomsline Care')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
