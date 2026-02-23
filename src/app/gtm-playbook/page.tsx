'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Target,
  Users,
  MessageSquare,
  Megaphone,
  Handshake,
  PenTool,
  Calendar,
  GraduationCap,
  Mic,
  UserPlus,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  DollarSign,
  Globe,
  Shield,
  Eye,
  Mail,
  BookOpen,
  Trophy,
  Flame,
  ChevronRight,
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

function ScoreBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(score / max) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}/{max}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 1. LAUNCH PHASING
// ══════════════════════════════════════════════════════════════════════════

interface PhaseTask {
  task: string
  owner: string
  deliverable: string
  priority: string
}

interface LaunchPhase {
  id: string
  name: string
  timeline: string
  color: string
  lightBg: string
  borderColor: string
  textColor: string
  goal: string
  kpiTarget: string
  tasks: PhaseTask[]
}

const getLaunchPhases = (t: (en: string, fr: string) => string): LaunchPhase[] => [
  {
    id: 'pre-launch',
    name: t('Pre-Launch', 'Pre-lancement'),
    timeline: t('60 days before launch (D-60 → D-1)', '60 jours avant le lancement (J-60 → J-1)'),
    color: 'bg-gray-900',
    lightBg: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    goal: t('Build the pipeline, validate messaging, create launch assets', 'Construire le pipeline, valider le message, creer les supports de lancement'),
    kpiTarget: t('200 prospect list, 30 demo calls booked, 5 beta testimonials', '200 prospects, 30 demos reservees, 5 temoignages beta'),
    tasks: [
      { task: t('Build prospect list of 200 independent practitioners (Paris → Lyon → Bordeaux)', 'Construire une liste de 200 praticiens independants (Paris → Lyon → Bordeaux)'), owner: t('Founder 1', 'Fondateur 1'), deliverable: 'LinkedIn Sales Nav + Doctolib scrape → CRM', priority: 'P0' },
      { task: t('Run 50+ personalized LinkedIn outreach messages/week', 'Envoyer 50+ messages LinkedIn personnalises/semaine'), owner: t('Founder 1 + 2', 'Fondateur 1 + 2'), deliverable: t('25/founder/week, 3-touch sequence', '25/fondateur/semaine, sequence en 3 points de contact'), priority: 'P0' },
      { task: t('Convert 3-5 beta testers to paying at €29/mo', 'Convertir 3-5 beta testeurs en payants a 29 €/mois'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('First revenue + testimonials', 'Premiers revenus + temoignages'), priority: 'P0' },
      { task: t('Produce 3 case study videos (90-second practitioner stories)', 'Produire 3 videos d\'etudes de cas (temoignages praticiens de 90 secondes)'), owner: t('Founder 2', 'Fondateur 2'), deliverable: t('LinkedIn + website assets', 'Contenus LinkedIn + site web'), priority: 'P1' },
      { task: t('Write 8 French blog posts targeting SEO keywords', 'Rediger 8 articles de blog en francais ciblant les mots-cles SEO'), owner: t('Founder 2', 'Fondateur 2'), deliverable: '"gestion cabinet", "suivi patient", "RGPD psychologue"', priority: 'P1' },
      { task: t('Set up referral program infrastructure', 'Mettre en place l\'infrastructure du programme de parrainage'), owner: t('Engineering', 'Ingenierie'), deliverable: t('"Invite a colleague" → 1 free month per referral', '"Invitez un collegue" → 1 mois gratuit par parrainage'), priority: 'P1' },
      { task: t('Create onboarding flow (15-min white-glove setup)', 'Creer le parcours d\'onboarding (configuration assistee de 15 min)'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Script + Loom video + checklist', 'Script + video Loom + checklist'), priority: 'P1' },
      { task: t('Design pricing page with 3-tier layout', 'Concevoir la page tarifaire avec 3 niveaux'), owner: t('Founder 2', 'Fondateur 2'), deliverable: 'Essentiel 19 € / Pro 29 € / Cabinet 49 €+', priority: 'P2' },
      { task: t('Apply to AFTCC conference (speaking/booth slot)', 'Postuler a la conference AFTCC (intervention/stand)'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Conference submission + follow-up', 'Candidature conference + suivi'), priority: 'P2' },
      { task: t('Pitch 3 French psych podcasts for guest spots', 'Proposer 3 podcasts psy francais pour des interventions'), owner: t('Founder 2', 'Fondateur 2'), deliverable: 'Deux Psys, Catherine la Psy, Le Comptoir', priority: 'P2' },
    ],
  },
  {
    id: 'launch-week',
    name: t('Launch Week', 'Semaine de lancement'),
    timeline: t('Day 1 → Day 7', 'Jour 1 → Jour 7'),
    color: 'bg-indigo-600',
    lightBg: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    goal: t('Activate first 10 paying practitioners, generate social proof', 'Activer les 10 premiers praticiens payants, generer de la preuve sociale'),
    kpiTarget: t('10 paying users, 100+ members onboarded, 3 LinkedIn posts > 5K views', '10 utilisateurs payants, 100+ membres integres, 3 posts LinkedIn > 5K vues'),
    tasks: [
      { task: t('Personal outreach to all 30 warm leads — "We\'re live"', 'Contact personnel des 30 leads chauds — "On est en ligne"'), owner: t('Founder 1 + 2', 'Fondateur 1 + 2'), deliverable: t('15 calls/founder in 3 days', '15 appels/fondateur en 3 jours'), priority: 'P0' },
      { task: t('Publish LinkedIn launch post with practitioner story', 'Publier un post LinkedIn de lancement avec un temoignage praticien'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Narrative post (not product features)', 'Post narratif (pas de fonctionnalites produit)'), priority: 'P0' },
      { task: t('Email beta testers asking for public testimonials', 'Envoyer un email aux beta testeurs pour des temoignages publics'), owner: t('Founder 2', 'Fondateur 2'), deliverable: t('3-5 LinkedIn recommendations', '3-5 recommandations LinkedIn'), priority: 'P0' },
      { task: t('Offer 60-day extended trial to first 20 signups', 'Offrir un essai prolonge de 60 jours aux 20 premiers inscrits'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Urgency + exclusivity signal', 'Signal d\'urgence + exclusivite'), priority: 'P1' },
      { task: t('White-glove onboard every new practitioner (15-min call)', 'Onboarding personnalise pour chaque nouveau praticien (appel de 15 min)'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Account setup + first member invite', 'Configuration du compte + premiere invitation membre'), priority: 'P0' },
      { task: t('Post day-by-day "building in public" updates on LinkedIn', 'Publier des mises a jour quotidiennes "construire en public" sur LinkedIn'), owner: t('Founder 2', 'Fondateur 2'), deliverable: t('5 posts in 7 days, each with 1 real metric', '5 posts en 7 jours, chacun avec 1 metrique reelle'), priority: 'P1' },
      { task: t('Send thank-you messages to everyone who shared the launch', 'Envoyer des messages de remerciement a tous ceux qui ont partage le lancement'), owner: t('Founder 1 + 2', 'Fondateur 1 + 2'), deliverable: t('Relationship maintenance', 'Entretien des relations'), priority: 'P2' },
    ],
  },
  {
    id: 'post-launch',
    name: t('Post-Launch', 'Post-lancement'),
    timeline: t('Day 8 → Day 90', 'Jour 8 → Jour 90'),
    color: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    goal: t('Reach 30 practitioners, prove PMF (churn < 5%), activate referral loop', 'Atteindre 30 praticiens, prouver le PMF (churn < 5 %), activer la boucle de parrainage'),
    kpiTarget: t('30 practitioners, 360+ members, <5% churn, first organic signup', '30 praticiens, 360+ membres, <5 % churn, premiere inscription organique'),
    tasks: [
      { task: t('Week 2-4: Scale LinkedIn outreach to 100 messages/week', 'Sem. 2-4 : Passer la prospection LinkedIn a 100 messages/semaine'), owner: t('Founder 1 + 2', 'Fondateur 1 + 2'), deliverable: t('Multi-channel (LinkedIn + email + follow-up)', 'Multi-canal (LinkedIn + email + relance)'), priority: 'P0' },
      { task: t('Week 2: Activate referral program for all paying users', 'Sem. 2 : Activer le programme de parrainage pour tous les utilisateurs payants'), owner: t('Engineering', 'Ingenierie'), deliverable: t('Dashboard prompt: "Invite a colleague"', 'Invite tableau de bord : "Invitez un collegue"'), priority: 'P0' },
      { task: t('Week 3: Publish 2 case studies with real engagement data', 'Sem. 3 : Publier 2 etudes de cas avec des donnees d\'engagement reelles'), owner: t('Founder 2', 'Fondateur 2'), deliverable: t('Blog + LinkedIn + email to prospects', 'Blog + LinkedIn + email aux prospects'), priority: 'P1' },
      { task: t('Week 4: Analyze first-month churn — fix if > 5%', 'Sem. 4 : Analyser le churn du premier mois — corriger si > 5 %'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Churn analysis → product fixes or onboarding tweaks', 'Analyse du churn → corrections produit ou ajustements onboarding'), priority: 'P0' },
      { task: t('Month 2: Begin SEO content cadence (1 post/week in French)', 'Mois 2 : Demarrer le rythme de contenu SEO (1 article/semaine en francais)'), owner: t('Founder 2', 'Fondateur 2'), deliverable: t('Target: 500 organic visits/month by M3', 'Objectif : 500 visites organiques/mois a M3'), priority: 'P1' },
      { task: t('Month 2: Attend first professional event/conference', 'Mois 2 : Participer au premier evenement/conference professionnel'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('AFTCC workshop or regional FFPP chapter', 'Atelier AFTCC ou chapitre regional FFPP'), priority: 'P1' },
      { task: t('Month 2: Contact IFFORTHECC about student partnership', 'Mois 2 : Contacter IFFORTHECC pour un partenariat etudiant'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('Free year for newly certified → pipeline', 'Annee gratuite pour les nouveaux certifies → pipeline'), priority: 'P2' },
      { task: t('Month 3: Review NPS — target > 40', 'Mois 3 : Evaluer le NPS — objectif > 40'), owner: t('Founder 2', 'Fondateur 2'), deliverable: t('In-app survey at day 30', 'Sondage in-app au jour 30'), priority: 'P1' },
      { task: t('Month 3: Evaluate first organic/referral signup signal', 'Mois 3 : Evaluer le premier signal d\'inscription organique/parrainage'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('If 0 organic signups by M3, reassess messaging', 'Si 0 inscription organique a M3, revoir le message'), priority: 'P0' },
      { task: t('Month 3: Begin group practice outreach (Cabinet tier)', 'Mois 3 : Demarrer la prospection cabinets de groupe (offre Cabinet)'), owner: t('Founder 1', 'Fondateur 1'), deliverable: t('10 group practice targets identified', '10 cabinets de groupe cibles identifies'), priority: 'P2' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 2. CHANNEL STRATEGY (RANKED BY ROI)
// ══════════════════════════════════════════════════════════════════════════

interface Channel {
  rank: number
  name: string
  icon: typeof Rocket
  roiScore: number
  costPerLead: string
  timeToImpact: string
  scalability: string
  when: string
  budget: string
  why: string
  playbook: string[]
}

const getChannels = (t: (en: string, fr: string) => string): Channel[] => [
  {
    rank: 1,
    name: t('Founder-Led LinkedIn Outreach', 'Prospection LinkedIn par les fondateurs'),
    icon: MessageSquare,
    roiScore: 9,
    costPerLead: t('€2-5 (time only)', '2-5 € (temps uniquement)'),
    timeToImpact: t('Week 1', 'Semaine 1'),
    scalability: t('Low (founder time)', 'Faible (temps fondateurs)'),
    when: t('Pre-launch → M6', 'Pre-lancement → M6'),
    budget: t('€0 cash, 20 hrs/week founder time', '0 € en tresorerie, 20 h/sem. temps fondateurs'),
    why: t('Highest ROI channel at pre-seed. Multi-channel outreach gets 287% higher reply rate. Independent practitioners are reachable on LinkedIn. Zero cost, instant feedback loop.', 'Canal au meilleur ROI en pre-seed. La prospection multi-canal obtient 287 % de taux de reponse en plus. Les praticiens independants sont joignables sur LinkedIn. Zero cout, boucle de retour instantanee.'),
    playbook: [
      t('Build list: LinkedIn Sales Nav + Doctolib profiles → 200 targets', 'Construire la liste : LinkedIn Sales Nav + profils Doctolib → 200 cibles'),
      t('Sequence: Connection request → value post → DM with case study → demo offer', 'Sequence : demande de connexion → post de valeur → DM avec etude de cas → offre de demo'),
      t('50+ conversations/week (25 per founder)', '50+ conversations/semaine (25 par fondateur)'),
      t('Follow up 3x minimum — 80% of sales happen after 5th touchpoint', 'Relancer au moins 3 fois — 80 % des ventes se font apres le 5e point de contact'),
      t('Track: reply rate > 15%, demo rate > 5%, close rate > 20%', 'Suivi : taux de reponse > 15 %, taux de demo > 5 %, taux de conversion > 20 %'),
    ],
  },
  {
    rank: 2,
    name: t('Referral Program', 'Programme de parrainage'),
    icon: UserPlus,
    roiScore: 9,
    costPerLead: t('€29 (1 month free)', '29 € (1 mois gratuit)'),
    timeToImpact: 'M2-M3',
    scalability: t('High (viral loop)', 'Eleve (boucle virale)'),
    when: t('Activate at 10 users → ongoing', 'Activer a 10 utilisateurs → continu'),
    budget: t('€0 cash (deferred revenue)', '0 € en tresorerie (revenu differe)'),
    why: t('86% of B2B buyers say word-of-mouth is most influential. Referred customers have 16-25% higher LTV and lower churn. Practitioners talk in supervision groups and conferences.', '86 % des acheteurs B2B disent que le bouche-a-oreille est le plus influent. Les clients recommandes ont un LTV 16-25 % superieur et un churn plus faible. Les praticiens echangent dans les groupes de supervision et les conferences.'),
    playbook: [
      t('1 free month per successful referral (both sides)', '1 mois gratuit par parrainage reussi (les deux cotes)'),
      t('Ask every user for 2 introductions at day 14 (happiness peak)', 'Demander a chaque utilisateur 2 mises en relation au jour 14 (pic de satisfaction)'),
      t('Dashboard "Invite a colleague" button — always visible', 'Bouton "Invitez un collegue" dans le tableau de bord — toujours visible'),
      t('Cap at 3 free months/year per referrer', 'Plafond a 3 mois gratuits/an par parrain'),
      t('Target: referrals = 20-30% of signups by M12', 'Objectif : parrainages = 20-30 % des inscriptions a M12'),
    ],
  },
  {
    rank: 3,
    name: t('French Blog + SEO', 'Blog francais + SEO'),
    icon: PenTool,
    roiScore: 8,
    costPerLead: t('€5-15 (content creation time)', '5-15 € (temps de creation de contenu)'),
    timeToImpact: t('M3-M6 (compounds)', 'M3-M6 (se compose)'),
    scalability: t('Very high (evergreen)', 'Tres eleve (contenu perenne)'),
    when: t('Start M1 → ongoing', 'Debut M1 → continu'),
    budget: t('€200/mo (design + tooling)', '200 €/mois (design + outils)'),
    why: t('French practitioners search "gestion cabinet psychologue", "suivi patient", "RGPD psychologue" — low competition. SEO compounds over time. By M6, should drive 30% of pipeline.', 'Les praticiens francais recherchent "gestion cabinet psychologue", "suivi patient", "RGPD psychologue" — faible concurrence. Le SEO se compose au fil du temps. A M6, devrait generer 30 % du pipeline.'),
    playbook: [
      t('1 post/week in French targeting practitioner pain points', '1 article/semaine en francais ciblant les problematiques des praticiens'),
      t('Keywords: "gestion cabinet", "suivi patient entre seances", "RGPD psychologue"', 'Mots-cles : "gestion cabinet", "suivi patient entre seances", "RGPD psychologue"'),
      t('Each post has clear CTA: free trial or demo booking', 'Chaque article a un CTA clair : essai gratuit ou reservation de demo'),
      t('Repurpose blog → LinkedIn carousel → email newsletter', 'Reutiliser le blog → carrousel LinkedIn → newsletter email'),
      t('Target: 1,000 organic visits/month by M6, 5,000 by M12', 'Objectif : 1 000 visites organiques/mois a M6, 5 000 a M12'),
    ],
  },
  {
    rank: 4,
    name: t('Events & Conferences', 'Evenements et conferences'),
    icon: Calendar,
    roiScore: 7,
    costPerLead: t('€30-80 (travel + fees)', '30-80 € (deplacements + frais)'),
    timeToImpact: 'M3-M6',
    scalability: t('Medium (seasonal)', 'Moyen (saisonnier)'),
    when: 'M3 → M18',
    budget: t('€300-500/event', '300-500 €/evenement'),
    why: t('SimplePractice got their first 50 customers at local chapter meetings. AFTCC has 2,500 members. Congres Francais de Psychiatrie is the annual gathering. Face-to-face builds trust.', 'SimplePractice a obtenu ses 50 premiers clients lors de reunions de chapitres locaux. L\'AFTCC compte 2 500 membres. Le Congres Francais de Psychiatrie est le rassemblement annuel. Le face-a-face cree la confiance.'),
    playbook: [
      t('AFTCC workshops: present on "digital between-session care"', 'Ateliers AFTCC : presenter le "suivi numerique entre les seances"'),
      t('FFPP/SNP chapter meetings: demo at regional events', 'Reunions de chapitres FFPP/SNP : demo lors d\'evenements regionaux'),
      t('Congres Francais de Psychiatrie: booth or speaking slot', 'Congres Francais de Psychiatrie : stand ou intervention'),
      t('Every event: collect 20+ contacts, follow up within 48 hours', 'Chaque evenement : collecter 20+ contacts, relancer sous 48 heures'),
      t('Bring 1 testimonial practitioner as co-presenter', 'Amener 1 praticien temoin comme co-presentateur'),
    ],
  },
  {
    rank: 5,
    name: t('Training Institute Partnerships', 'Partenariats avec les instituts de formation'),
    icon: GraduationCap,
    roiScore: 7,
    costPerLead: t('€0 (partnership)', '0 € (partenariat)'),
    timeToImpact: 'M6-M12',
    scalability: t('High (pipeline)', 'Eleve (pipeline)'),
    when: 'M6 → M18',
    budget: t('€0 cash (free accounts)', '0 € en tresorerie (comptes gratuits)'),
    why: t('21% growth in psychologist numbers = thousands setting up practice annually. Newly certified practitioners are easiest early adopters — no existing tool habits.', '21 % de croissance du nombre de psychologues = des milliers s\'installent chaque annee. Les praticiens nouvellement certifies sont les adopteurs precoces les plus faciles — aucune habitude d\'outil existante.'),
    playbook: [
      t('Partners: AFTCC, IFFORTHECC, IRCCADE, Asadis', 'Partenaires : AFTCC, IFFORTHECC, IRCCADE, Asadis'),
      t('Offer: free year for newly certified practitioners', 'Offre : annee gratuite pour les praticiens nouvellement certifies'),
      t('Position as "recommended practice tool" in curriculum', 'Positionner comme "outil de pratique recommande" dans le cursus'),
      t('Co-branded onboarding materials for each institute', 'Supports d\'onboarding co-marques pour chaque institut'),
      t('Target: 3 institute partnerships signed by M12', 'Objectif : 3 partenariats d\'instituts signes a M12'),
    ],
  },
  {
    rank: 6,
    name: t('Podcast Guest Appearances', 'Interventions en podcast'),
    icon: Mic,
    roiScore: 6,
    costPerLead: '0 €',
    timeToImpact: 'M6-M12',
    scalability: t('Low (limited shows)', 'Faible (emissions limitees)'),
    when: 'M6 → M18',
    budget: '0 €',
    why: t('French practitioners listen to Deux Psys, Catherine la Psy, Le Comptoir de la Psychologie. Builds authority and trust. Zero cost. 1 podcast appearance = awareness among 5K-20K listeners.', 'Les praticiens francais ecoutent Deux Psys, Catherine la Psy, Le Comptoir de la Psychologie. Construit autorite et confiance. Zero cout. 1 apparition podcast = notoriete aupres de 5K-20K auditeurs.'),
    playbook: [
      t('Pitch 5 French psych podcasts with practitioner-centric angle', 'Proposer 5 podcasts psy francais avec un angle centre sur le praticien'),
      t('Topic: "What happens between sessions — and why it matters"', 'Sujet : "Ce qui se passe entre les seances — et pourquoi c\'est important"'),
      t('Share real practitioner stories, not product features', 'Partager de vrais temoignages de praticiens, pas des fonctionnalites produit'),
      t('Include unique offer code for listeners', 'Inclure un code promo unique pour les auditeurs'),
      t('Target: 3 appearances in first 12 months', 'Objectif : 3 apparitions dans les 12 premiers mois'),
    ],
  },
  {
    rank: 7,
    name: t('Email Newsletter (Practitioner Insights)', 'Newsletter email (conseils praticiens)'),
    icon: Mail,
    roiScore: 6,
    costPerLead: '1-3 €',
    timeToImpact: 'M3-M6',
    scalability: t('High (list grows)', 'Eleve (la liste grandit)'),
    when: t('M3 → ongoing', 'M3 → continu'),
    budget: t('€50/mo (email tool)', '50 €/mois (outil email)'),
    why: t('Nurtures warm leads who aren\'t ready to buy. Positions Bloomsline as thought leader. Bi-weekly cadence keeps brand top-of-mind. Low cost, compounds over time.', 'Nourrit les leads chauds qui ne sont pas prets a acheter. Positionne Bloomsline comme leader d\'opinion. Un rythme bimensuel garde la marque en tete. Faible cout, se compose avec le temps.'),
    playbook: [
      t('Bi-weekly email: 1 practitioner insight + 1 product tip + 1 CTA', 'Email bimensuel : 1 conseil praticien + 1 astuce produit + 1 CTA'),
      t('Build list from blog subscribers, event contacts, LinkedIn connections', 'Construire la liste a partir des abonnes blog, contacts evenements, connexions LinkedIn'),
      t('Subject line A/B test every send', 'Test A/B de l\'objet a chaque envoi'),
      t('Target: 500 subscribers by M6, 2,000 by M12', 'Objectif : 500 abonnes a M6, 2 000 a M12'),
      t('Open rate target: > 35%, CTR: > 5%', 'Objectif taux d\'ouverture : > 35 %, CTR : > 5 %'),
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 3. MESSAGING FRAMEWORK
// ══════════════════════════════════════════════════════════════════════════

const getMessaging = (t: (en: string, fr: string) => string) => ({
  coreValueProp: t('Bloomsline fills the 167 hours between sessions — so practitioners see their clients\' week, and members feel supported every day.', 'Bloomsline comble les 167 heures entre les seances — pour que les praticiens voient la semaine de leurs clients, et que les membres se sentent soutenus chaque jour.'),
  positioning: t('The only platform that connects practitioners and members through gentle, AI-powered between-session care.', 'La seule plateforme qui connecte praticiens et membres grace a un accompagnement bienveillant entre les seances, assiste par l\'IA.'),
  taglines: [
    t('Therapy is 1 hour a week. Life is the other 167.', 'La therapie, c\'est 1 heure par semaine. La vie, ce sont les 167 autres.'),
    t('See their week. Support their journey.', 'Voyez leur semaine. Accompagnez leur parcours.'),
    t('Between-session care that practitioners trust and members love.', 'Un suivi entre les seances auquel les praticiens font confiance et que les membres adorent.'),
  ],
  supportingMessages: [
    {
      message: t('Start every session already informed', 'Commencez chaque seance deja informe'),
      audience: t('Practitioners', 'Praticiens'),
      proofPoints: [
        t('50% of session time currently spent catching up (APA Practice)', '50 % du temps de seance est actuellement consacre a la mise a jour (APA Practice)'),
        t('Practitioners see real-time client engagement dashboard', 'Les praticiens voient un tableau de bord d\'engagement client en temps reel'),
        t('AI-generated session briefs from between-session activity', 'Briefings de seance generes par l\'IA a partir de l\'activite entre les seances'),
      ],
    },
    {
      message: t('Your growth continues between appointments', 'Votre progression continue entre les rendez-vous'),
      audience: t('Members', 'Membres'),
      proofPoints: [
        t('Bloom AI companion available 24/7 for gentle support', 'Compagnon IA Bloom disponible 24h/24 pour un soutien bienveillant'),
        t('Capture moments in 10 seconds — photo, voice, text', 'Capturez des moments en 10 secondes — photo, voix, texte'),
        t('AI discovers patterns in mood and behavior over time', 'L\'IA decouvre des tendances dans l\'humeur et le comportement au fil du temps'),
      ],
    },
    {
      message: t('One sale. 15 users. Zero incremental CAC.', 'Une vente. 15 utilisateurs. Zero CAC supplementaire.'),
      audience: t('Investors', 'Investisseurs'),
      proofPoints: [
        t('1 practitioner → 12-15 members at no additional cost', '1 praticien → 12-15 membres sans cout supplementaire'),
        t('LTV/CAC of 72x (benchmark: 3x)', 'LTV/CAC de 72x (reference : 3x)'),
        t('90% gross margin, €50 CAC, 1.7-month payback', '90 % de marge brute, 50 € de CAC, retour sur investissement en 1,7 mois'),
      ],
    },
  ],
  objectionCounters: [
    { objection: t('"I don\'t have time for a new tool"', '"Je n\'ai pas le temps pour un nouvel outil"'), counter: t('White-glove setup in 15 minutes. No data migration needed. We set it up for you.', 'Configuration assistee en 15 minutes. Aucune migration de donnees necessaire. Nous le configurons pour vous.') },
    { objection: t('"I already use Doctolib"', '"J\'utilise deja Doctolib"'), counter: t('Bloomsline doesn\'t replace Doctolib. We\'re the engagement layer between sessions — they handle booking, we handle care.', 'Bloomsline ne remplace pas Doctolib. Nous sommes la couche d\'engagement entre les seances — ils gerent la prise de rendez-vous, nous gerons le suivi.') },
    { objection: t('"€29/mo is too much"', '"29 €/mois c\'est trop cher"'), counter: t('€29/mo is less than one cancelled session (€60-80). Doctolib charges €139/mo with no AI. SimplePractice is $49-99.', '29 €/mois c\'est moins qu\'une seance annulee (60-80 €). Doctolib facture 139 €/mois sans IA. SimplePractice coute 49-99 $.') },
    { objection: t('"I worry about data privacy"', '"Je m\'inquiete de la confidentialite des donnees"'), counter: t('EU-hosted, GDPR-native from line 1. AES-256 encryption. Row Level Security on every table. We\'re not American SaaS.', 'Heberge en UE, conforme au RGPD des la premiere ligne. Chiffrement AES-256. Securite au niveau des lignes sur chaque table. Nous ne sommes pas un SaaS americain.') },
  ],
})

// ══════════════════════════════════════════════════════════════════════════
// 4. CONTENT STRATEGY
// ══════════════════════════════════════════════════════════════════════════

interface ContentItem {
  type: string
  format: string
  frequency: string
  channel: string
  purpose: string
}

interface FunnelStage {
  stage: string
  goal: string
  color: string
  content: ContentItem[]
}

const CONTENT_FUNNEL: FunnelStage[] = [
  {
    stage: 'Awareness',
    goal: 'Practitioners discover Bloomsline exists',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    content: [
      { type: 'LinkedIn thought leadership', format: 'Text posts (800-1,200 chars)', frequency: '3x/week', channel: 'LinkedIn', purpose: 'Build founder authority on "between-session care"' },
      { type: 'French SEO blog posts', format: 'Long-form (1,500+ words)', frequency: '1x/week', channel: 'Blog', purpose: 'Capture organic search: "gestion cabinet psychologue"' },
      { type: 'Podcast guest spots', format: '30-45 min interviews', frequency: '1x/month (M6+)', channel: 'Podcasts', purpose: 'Reach practitioner audiences on trusted platforms' },
      { type: 'Conference presentations', format: '20-min talk + demo', frequency: 'Quarterly', channel: 'Events', purpose: 'Face-to-face credibility with professional bodies' },
    ],
  },
  {
    stage: 'Consideration',
    goal: 'Practitioners evaluate Bloomsline seriously',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    content: [
      { type: 'Practitioner case studies', format: 'Written + 90-sec video', frequency: '2x/month', channel: 'Blog + LinkedIn', purpose: 'Social proof from real practitioners with real data' },
      { type: 'Comparison guides', format: '"Bloomsline vs Doctolib vs SimplePractice"', frequency: 'Evergreen', channel: 'Blog + SEO', purpose: 'Capture high-intent search traffic' },
      { type: 'Email nurture sequence', format: '5-email drip (one per week)', frequency: 'Automated', channel: 'Email', purpose: 'Educate warm leads who aren\'t ready to buy yet' },
      { type: 'Live demo recordings', format: '5-min product walkthrough', frequency: 'Monthly update', channel: 'Website + YouTube', purpose: 'Show, don\'t tell. Reduce friction to understanding.' },
    ],
  },
  {
    stage: 'Decision',
    goal: 'Practitioners commit to a paid plan',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    content: [
      { type: 'ROI calculator', format: 'Interactive tool on website', frequency: 'Evergreen', channel: 'Website', purpose: '"See how much time Bloomsline saves you per week"' },
      { type: 'Pricing page with social proof', format: '3-tier layout + testimonials', frequency: 'Evergreen', channel: 'Website', purpose: 'Reduce decision paralysis. "87% choose Pro."' },
      { type: 'Free trial (14 days, extended to 60 for events)', format: 'No credit card required', frequency: 'Always available', channel: 'Product', purpose: 'Remove last objection: "let me try it first"' },
      { type: 'Personal demo call with founder', format: '15-min video call', frequency: 'On demand', channel: 'Calendar', purpose: 'High-touch conversion for warm leads' },
    ],
  },
  {
    stage: 'Retention & Advocacy',
    goal: 'Practitioners renew, upgrade, and refer',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    content: [
      { type: 'Onboarding email sequence', format: '7 emails over 14 days', frequency: 'Automated', channel: 'Email', purpose: 'Guide to first value moment (first member invited)' },
      { type: 'In-app engagement nudges', format: 'Tooltips + milestone celebrations', frequency: 'Triggered', channel: 'Product', purpose: 'Drive activation: "Your first client logged a moment!"' },
      { type: 'Monthly practitioner digest', format: 'Email with usage insights', frequency: '1x/month', channel: 'Email', purpose: '"Your clients logged 47 moments this month"' },
      { type: 'Referral prompts', format: 'In-app + email at day 14', frequency: 'Triggered', channel: 'Product + Email', purpose: 'Ask for referrals when satisfaction is highest' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 5. STRATEGIC PARTNERSHIPS
// ══════════════════════════════════════════════════════════════════════════

interface PartnershipOp {
  name: string
  type: string
  reach: string
  dealStructure: string
  timeline: string
  expectedImpact: string
  priority: string
}

const PARTNERSHIPS: PartnershipOp[] = [
  {
    name: 'AFTCC (Association Française de TCC)',
    type: 'Professional association',
    reach: '2,500 members (CBT practitioners)',
    dealStructure: 'Workshop sponsorship (€500-1,000) + "recommended tool" endorsement. Offer free trial to all members.',
    timeline: 'M3 — first event attendance',
    expectedImpact: '30-50 trials, 10-15 conversions from first event. Ongoing pipeline.',
    priority: 'P0',
  },
  {
    name: 'IFFORTHECC + IRCCADE + Asadis',
    type: 'Training institutes (bundle)',
    reach: '1,000+ graduates/year combined',
    dealStructure: 'Free year for newly certified practitioners. Co-branded "starting your practice" toolkit. Bloomsline in curriculum.',
    timeline: 'M6 — partnership signed',
    expectedImpact: '50-100 new practitioners/year entering Bloomsline at day 1 of their practice. Lifetime habits.',
    priority: 'P1',
  },
  {
    name: 'FFPP (Fédération Française des Psychologues et de Psychologie)',
    type: 'National federation',
    reach: 'National umbrella organization',
    dealStructure: 'Newsletter feature + chapter meeting demos. No direct sponsorship cost — provide value through practitioner content.',
    timeline: 'M4 — first chapter meeting',
    expectedImpact: 'Brand legitimacy + 10-20 warm leads per chapter event. Access to regional networks.',
    priority: 'P1',
  },
  {
    name: 'Doctolib (Co-existence strategy)',
    type: 'Integration partnership',
    reach: '400K practitioners, 80M patients',
    dealStructure: 'Not a competitor — complementary. Build integration: "Book on Doctolib, engage on Bloomsline." API-level calendar sync.',
    timeline: 'M12+ — after proving scale',
    expectedImpact: 'If successful: access to Doctolib\'s practitioner base. Even a 0.1% conversion = 400 practitioners.',
    priority: 'P2',
  },
  {
    name: 'Mutuelle / Assurance Complémentaire',
    type: 'Insurance/benefits channel',
    reach: 'Employer-funded mental health benefits',
    dealStructure: 'PEPM (€3-5/employee/month) for covered mental health benefits. White-label member app under mutualist brand.',
    timeline: 'M18+ — post-Series A',
    expectedImpact: 'Single 1,000-employee contract = €3K-€5K MRR. Enterprise revenue diversification.',
    priority: 'P3',
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 6. BUDGET ALLOCATION
// ══════════════════════════════════════════════════════════════════════════

interface BudgetLine {
  channel: string
  monthlyBudget: string
  annualBudget: string
  percentOfGTM: string
  rationale: string
}

const BUDGET: BudgetLine[] = [
  { channel: 'Founder time (outreach)', monthlyBudget: 'Sweat equity', annualBudget: 'Sweat equity', percentOfGTM: '—', rationale: '40 hrs/week combined. Primary channel. Not in cash budget.' },
  { channel: 'Content & SEO', monthlyBudget: '€200', annualBudget: '€2,400', percentOfGTM: '24%', rationale: 'Blog tooling, Canva Pro, minor design. Writing is founder-led.' },
  { channel: 'Events & conferences', monthlyBudget: '€400 (avg)', annualBudget: '€4,800', percentOfGTM: '48%', rationale: '€300-500/event × 8-10 events/year. Travel + booth costs.' },
  { channel: 'Email tools', monthlyBudget: '€50', annualBudget: '€600', percentOfGTM: '6%', rationale: 'Mailchimp/Loops free tier → paid at 1K subscribers.' },
  { channel: 'LinkedIn Sales Nav', monthlyBudget: '€80', annualBudget: '€960', percentOfGTM: '10%', rationale: 'Premium search + InMail credits for outreach.' },
  { channel: 'Referral program costs', monthlyBudget: '~€145 (est.)', annualBudget: '~€1,740', percentOfGTM: '17%', rationale: '~5 referrals/month × €29 deferred revenue per referral.' },
  { channel: 'Paid ads', monthlyBudget: '€0', annualBudget: '€0', percentOfGTM: '0%', rationale: 'No paid ads at this stage. Organic only until PMF is proven.' },
]

// Total annual GTM cash budget
const TOTAL_GTM_CASH = '~€10,000/year'
const TOTAL_GTM_MONTHLY = '~€875/month'

// ══════════════════════════════════════════════════════════════════════════
// 7. KPI FRAMEWORK
// ══════════════════════════════════════════════════════════════════════════

interface KPI {
  metric: string
  category: string
  m3Target: string
  m6Target: string
  m12Target: string
  m18Target: string
  why: string
}

const KPIS: KPI[] = [
  { metric: 'Paying Practitioners', category: 'Growth', m3Target: '15', m6Target: '60', m12Target: '180', m18Target: '340', why: 'North star metric. Everything else follows.' },
  { metric: 'MRR', category: 'Revenue', m3Target: '€435', m6Target: '€1,740', m12Target: '€5,220', m18Target: '€9,860', why: 'Revenue trajectory for Series A readiness.' },
  { metric: 'Monthly Churn', category: 'Retention', m3Target: '<8%', m6Target: '<5%', m12Target: '<4%', m18Target: '<4%', why: 'PMF signal. >10% = pause sales, fix product.' },
  { metric: 'Active Members', category: 'Engagement', m3Target: '180', m6Target: '720', m12Target: '2,160', m18Target: '4,080', why: 'Member engagement proves practitioner value.' },
  { metric: 'Member Activation Rate', category: 'Engagement', m3Target: '>60%', m6Target: '>70%', m12Target: '>75%', m18Target: '>75%', why: '% of invited members who log first moment within 7 days.' },
  { metric: 'NPS', category: 'Satisfaction', m3Target: '>30', m6Target: '>40', m12Target: '>50', m18Target: '>50', why: 'Referral likelihood. >50 = world-class for SaaS.' },
  { metric: 'CAC', category: 'Efficiency', m3Target: '€50', m6Target: '€50', m12Target: '€45', m18Target: '€40', why: 'Should decrease as organic/referral channels compound.' },
  { metric: 'Referral %', category: 'Virality', m3Target: '5%', m6Target: '10%', m12Target: '20%', m18Target: '25%', why: '% of new signups from practitioner referrals.' },
  { metric: 'Demo → Paid Conversion', category: 'Sales', m3Target: '>20%', m6Target: '>25%', m12Target: '>30%', m18Target: '>30%', why: 'Sales efficiency metric. <15% = fix pitch.' },
  { metric: 'Organic Traffic (monthly)', category: 'Content', m3Target: '200', m6Target: '1,000', m12Target: '5,000', m18Target: '10,000', why: 'SEO compounding indicator. Leading signal for pipeline.' },
]

// ══════════════════════════════════════════════════════════════════════════
// 8. RISK MITIGATION
// ══════════════════════════════════════════════════════════════════════════

interface LaunchRisk {
  risk: string
  likelihood: string
  impact: string
  earlyWarning: string
  contingency: string
  owner: string
}

const RISKS: LaunchRisk[] = [
  {
    risk: 'Slow practitioner adoption (long sales cycles)',
    likelihood: 'High',
    impact: 'Critical',
    earlyWarning: '<5 paying users by day 30',
    contingency: 'Extend free trial to 60 days. Shift to referral-only growth. Add white-glove "we set it up for you" onboarding. Lower entry to €19/mo Essentiel tier.',
    owner: 'Founder 1',
  },
  {
    risk: 'Low member engagement (practitioners don\'t see value)',
    likelihood: 'Medium',
    impact: 'Critical',
    earlyWarning: 'Member activation rate < 50%. <3 moments/member/week.',
    contingency: 'Simplify first-use to <30 seconds. Add practitioner-triggered "homework" feature. Build engagement digest ("Your client logged 5 moments this week"). Make member value visible to practitioner.',
    owner: 'Founder 2',
  },
  {
    risk: 'Doctolib launches competing engagement features',
    likelihood: 'Low-Medium',
    impact: 'High',
    earlyWarning: 'Doctolib product announcements, job postings for "engagement" roles.',
    contingency: 'Move fast — our B2C member layer + AI companion is structurally hard to bolt on. Deepen AI differentiation. Build switching costs through data history. Consider Doctolib integration instead of competition.',
    owner: 'Founder 1',
  },
  {
    risk: 'Runway depletion before PMF',
    likelihood: 'Medium',
    impact: 'Fatal',
    earlyWarning: '<€100K remaining with <50 practitioners.',
    contingency: 'Keep burn under €10K/month. Milestone-based spending (no hires until 50+ users). Cut conference spend. Explore bridge round from existing investors. Never burn more than planned.',
    owner: 'Both Founders',
  },
  {
    risk: 'HDS (Hébergement de Données de Santé) compliance required',
    likelihood: 'Medium',
    impact: 'High',
    earlyWarning: 'Enterprise prospect or group practice requests HDS certification.',
    contingency: 'Get legal counsel early (€2K). Pre-evaluate HDS-certified hosts: Scalingo (€500/mo), OVHcloud Health. Can migrate Supabase to EU HDS-compliant host within 4-6 weeks.',
    owner: 'Founder 2',
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 9. QUICK WINS (FIRST 14 DAYS)
// ══════════════════════════════════════════════════════════════════════════

interface QuickWin {
  tactic: string
  timeline: string
  expectedResult: string
  effort: string
  steps: string[]
}

const QUICK_WINS: QuickWin[] = [
  {
    tactic: 'The Warm 30 Blitz',
    timeline: 'Day 1-3',
    expectedResult: '5-10 demo calls booked, 3-5 conversions',
    effort: '2 days of focused outreach',
    steps: [
      'List every practitioner you\'ve spoken to in the last 6 months',
      'Personal message (not mass email): "We just launched. You were one of the people who shaped this. Want to be one of the first?"',
      'Offer: first month free + founding member badge (visible in profile)',
      'Book 15-min "setup call" — you do the onboarding, they don\'t lift a finger',
      'Ask each convert for 1 introduction before hanging up',
    ],
  },
  {
    tactic: 'The LinkedIn Story Sprint',
    timeline: 'Day 1-7',
    expectedResult: '5K-15K impressions, 50+ profile visits, 10+ DM conversations',
    effort: '1 hour/day writing + engagement',
    steps: [
      'Day 1: Launch post — "Today we launched Bloomsline" with founder story (why mental health, why now)',
      'Day 3: Problem post — "My therapist has no idea what happened in my week" (member perspective)',
      'Day 5: Data post — "50% of session time is spent catching up" with APA source',
      'Day 7: Proof post — first testimonial from a beta practitioner (with permission)',
      'Engage in comments of French psychology LinkedIn creators — give value, don\'t pitch',
    ],
  },
  {
    tactic: 'The 10-Second Activation Hack',
    timeline: 'Day 1-14',
    expectedResult: '75%+ member activation rate, practitioners see immediate value',
    effort: 'Product tweak + onboarding change',
    steps: [
      'During practitioner onboarding call, help them invite their first 3 clients right then',
      'Pre-compose the member invitation message (they just hit send)',
      'Member first-open: show single prompt "How are you feeling right now?" — one tap response',
      'Immediately notify practitioner: "Marie just logged her first moment"',
      'This is the magic moment — practitioner sees the value in real time, not after a week of waiting',
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function GTMPlaybookPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const LAUNCH_PHASES = getLaunchPhases(t)
  const CHANNELS = getChannels(t)
  const MESSAGING = getMessaging(t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('GTM Playbook', 'Strategie GTM')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — Go-to-Market Execution Plan', 'Bloomsline Care — Plan de mise en marche')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '\u{1F1EB}\u{1F1F7} Fran\u00e7ais' : '\u{1F1EC}\u{1F1E7} English'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-14">
        {/* ── Hero ────────────────────────────────────── */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Go-to-Market Playbook', 'Plan de mise en marche')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
            {t(
              'A complete, actionable GTM execution plan for Bloomsline Care. Budget: ~€10K/year cash + founder sweat equity. Timeline: pre-launch (60 days) → launch (week 1) → post-launch (90 days) → scale (M4-M18). Built for a 2-founder pre-seed team targeting French independent mental health practitioners.',
              'Un plan GTM complet et actionnable pour Bloomsline Care. Budget : ~10 K€/an en tresorerie + travail des fondateurs. Calendrier : pre-lancement (60 jours) → lancement (semaine 1) → post-lancement (90 jours) → croissance (M4-M18). Concu pour une equipe de 2 fondateurs en pre-seed ciblant les praticiens independants en sante mentale en France.'
            )}
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: t('Budget', 'Budget'), value: '~€10K/' + t('yr', 'an'), sub: t('+ founder time', '+ temps fondateurs') },
              { label: t('Team', 'Equipe'), value: t('2 founders', '2 fondateurs'), sub: t('+ part-time eng', '+ dev temps partiel') },
              { label: t('Market', 'Marche'), value: '30K', sub: t('FR independent practitioners', 'praticiens independants FR') },
              { label: t('Price', 'Prix'), value: '€19-49/' + t('mo', 'mois'), sub: t('3-tier model', 'modele 3 niveaux') },
              { label: t('Target M18', 'Objectif M18'), value: t('340 users', '340 utilisateurs'), sub: '€118K ARR' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400">{s.label}</p>
                <p className="text-sm font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 9. QUICK WINS (FIRST 14 DAYS) — up front     */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('3 high-impact tactics that generate traction before everything else compounds', '3 tactiques a fort impact qui generent de la traction avant que tout le reste ne se compose')}>
            {t('Quick Wins — First 14 Days', 'Gains rapides — 14 premiers jours')}
          </SectionTitle>

          <div className="space-y-4">
            {QUICK_WINS.map((w, i) => (
              <div key={i} className="bg-white border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{w.tactic}</h4>
                      <p className="text-[10px] text-gray-400">{w.timeline}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {w.expectedResult}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {w.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-500 mt-0.5 w-4 shrink-0">{j + 1}.</span>
                      <span className="text-xs text-gray-600">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 1. LAUNCH PHASING                               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle={t('Pre-launch (60 days) → Launch (week 1) → Post-launch (90 days)', 'Pre-lancement (60 jours) → Lancement (semaine 1) → Post-lancement (90 jours)')}>
            {t('1. Launch Phasing', '1. Phases de lancement')}
          </SectionTitle>

          <div className="space-y-6">
            {LAUNCH_PHASES.map((phase) => (
              <div key={phase.id} className={`${phase.lightBg} border ${phase.borderColor} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${phase.color} text-white text-[10px] font-bold px-3 py-1.5 rounded-lg`}>
                      {phase.name}
                    </div>
                    <span className="text-xs text-gray-500">{phase.timeline}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${phase.textColor} bg-white px-2.5 py-1 rounded-full border`}>
                    {phase.kpiTarget}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  <strong className="text-gray-700">{t('Goal:', 'Objectif :')}</strong> {phase.goal}
                </p>

                <div className="space-y-2">
                  {phase.tasks.map((task, i) => (
                    <div key={i} className="bg-white/80 rounded-lg px-3 py-2.5 flex items-start gap-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                        task.priority === 'P0' ? 'bg-red-100 text-red-600' :
                        task.priority === 'P1' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{task.priority}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800">{task.task}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-400"><strong>{t('Owner:', 'Responsable :')}</strong> {task.owner}</span>
                          <span className="text-[10px] text-gray-400"><strong>{t('Output:', 'Livrable :')}</strong> {task.deliverable}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 2. CHANNEL STRATEGY                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle={t('Top 7 acquisition channels ranked by expected ROI at pre-seed stage', 'Les 7 meilleurs canaux d\'acquisition classes par ROI attendu au stade pre-seed')}>
            {t('2. Channel Strategy — Ranked by ROI', '2. Strategie canaux — Classement par ROI')}
          </SectionTitle>

          <div className="space-y-4">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              return (
                <div key={ch.rank} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-600">#{ch.rank}</span>
                      </div>
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{ch.name}</h4>
                        <span className="text-[10px] text-gray-400">{ch.when}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">{t('ROI Score', 'Score ROI')}</p>
                          <p className="text-xs font-bold text-indigo-600">{ch.roiScore}/10</p>
                        </div>
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">{t('Cost/Lead', 'Cout/Lead')}</p>
                          <p className="text-xs font-bold text-gray-700">{ch.costPerLead}</p>
                        </div>
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">{t('Time to Impact', 'Delai d\'impact')}</p>
                          <p className="text-xs font-bold text-gray-700">{ch.timeToImpact}</p>
                        </div>
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">{t('Budget', 'Budget')}</p>
                          <p className="text-xs font-bold text-gray-700">{ch.budget}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">{ch.why}</p>

                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-indigo-600 mb-1.5">{t('Playbook', 'Plan d\'action')}</p>
                        <div className="space-y-1">
                          {ch.playbook.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                              <span className="text-[10px] text-indigo-700">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 3. MESSAGING FRAMEWORK                           */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle={t('Core value proposition, supporting messages, and proof points', 'Proposition de valeur principale, messages de soutien et preuves')}>
            {t('3. Messaging Framework', '3. Cadre de communication')}
          </SectionTitle>

          {/* Core value prop */}
          <div className="bg-gray-900 text-white rounded-2xl p-6 mb-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">{t('Core Value Proposition', 'Proposition de valeur principale')}</p>
            <p className="text-lg font-bold leading-relaxed">{MESSAGING.coreValueProp}</p>
            <p className="text-xs text-gray-400 mt-3">{MESSAGING.positioning}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {MESSAGING.taglines.map((tag, i) => (
                <span key={i} className="text-[10px] bg-white/10 text-gray-300 px-2.5 py-1 rounded-full border border-white/10">
                  &quot;{tag}&quot;
                </span>
              ))}
            </div>
          </div>

          {/* Supporting messages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {MESSAGING.supportingMessages.map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  i === 0 ? 'bg-indigo-100 text-indigo-600' :
                  i === 1 ? 'bg-emerald-100 text-emerald-600' :
                  'bg-violet-100 text-violet-600'
                }`}>{m.audience}</span>
                <h4 className="text-sm font-bold text-gray-900 mt-2 mb-2">&quot;{m.message}&quot;</h4>
                <div className="space-y-1.5">
                  {m.proofPoints.map((p, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-gray-600">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Objection counters */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h4 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> {t('Top Objections & Counters', 'Objections principales et reponses')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MESSAGING.objectionCounters.map((o, i) => (
                <div key={i} className="bg-white rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-red-600 mb-0.5">{o.objection}</p>
                  <p className="text-[10px] text-gray-600">{o.counter}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 4. CONTENT STRATEGY                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.25)}>
          <SectionTitle subtitle={t('Content mapped to every stage of the practitioner buying journey', 'Contenu associe a chaque etape du parcours d\'achat du praticien')}>
            {t('4. Content Strategy — Full Funnel', '4. Strategie de contenu — Entonnoir complet')}
          </SectionTitle>

          <div className="space-y-4">
            {CONTENT_FUNNEL.map((stage, i) => (
              <div key={stage.stage} className={`${stage.color} border rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold">{stage.stage}</h4>
                  <span className="text-[10px] opacity-70">— {stage.goal}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stage.content.map((c, j) => (
                    <div key={j} className="bg-white/80 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-800">{c.type}</p>
                        <span className="text-[9px] text-gray-400">{c.frequency}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-1">{c.format}</p>
                      <p className="text-[10px] text-gray-400"><strong>{t('Channel:', 'Canal :')}</strong> {c.channel} | <strong>{t('Why:', 'Pourquoi :')}</strong> {c.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 5. PARTNERSHIPS                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('5 strategic partnerships ranked by timeline and expected impact', '5 partenariats strategiques classes par calendrier et impact attendu')}>
            {t('5. Strategic Partnerships', '5. Partenariats strategiques')}
          </SectionTitle>

          <div className="space-y-3">
            {PARTNERSHIPS.map((p, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.priority === 'P0' ? 'bg-red-100 text-red-600' :
                      p.priority === 'P1' ? 'bg-amber-100 text-amber-600' :
                      p.priority === 'P2' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{p.priority}</span>
                    <h4 className="text-sm font-semibold text-gray-900">{p.name}</h4>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{p.timeline}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <p className="text-gray-400 mb-0.5 font-medium">{t('Type & Reach', 'Type et portee')}</p>
                    <p className="text-gray-600">{p.type} — {p.reach}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 font-medium">{t('Deal Structure', 'Structure du partenariat')}</p>
                    <p className="text-gray-600">{p.dealStructure}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 font-medium">{t('Expected Impact', 'Impact attendu')}</p>
                    <p className="text-emerald-600 font-semibold">{p.expectedImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 6. BUDGET ALLOCATION                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle={t(`Total GTM cash budget: ${TOTAL_GTM_CASH} (${TOTAL_GTM_MONTHLY}) — plus founder sweat equity`, `Budget GTM total en tresorerie : ${TOTAL_GTM_CASH} (${TOTAL_GTM_MONTHLY}) — plus travail des fondateurs`)}>
            {t('6. Budget Allocation', '6. Repartition du budget')}
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Channel', 'Canal')}</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Monthly', 'Mensuel')}</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Annual', 'Annuel')}</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">{t('% of GTM', '% du GTM')}</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Rationale', 'Justification')}</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-medium text-gray-900 border-b border-gray-100">{b.channel}</td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{b.monthlyBudget}</td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{b.annualBudget}</td>
                    <td className="p-3 text-right font-mono text-gray-500 border-b border-gray-100">{b.percentOfGTM}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{b.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-800 mb-2">{t('Budget Philosophy', 'Philosophie budgetaire')}</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              {t(
                'At pre-seed, your time is your budget. The ~€10K annual cash spend is almost rounding error — it\'s the 80+ hours/week of founder outreach, content creation, and relationship-building that drives growth. No paid ads. No growth hacking shortcuts. Just consistent, founder-led, trust-based acquisition in a niche professional community where reputation compounds. When you hit 100+ practitioners and €3K MRR, then evaluate whether to add a €500-1,000/mo paid channel.',
                'Au stade pre-seed, votre temps est votre budget. Les ~10 K\u20AC de depenses annuelles en tresorerie sont presque negligeables \u2014 ce sont les 80+ heures/semaine de prospection, creation de contenu et developpement de relations par les fondateurs qui generent la croissance. Pas de publicite payante. Pas de raccourcis growth hacking. Juste une acquisition constante, menee par les fondateurs, basee sur la confiance dans une communaute professionnelle de niche ou la reputation se compose. Quand vous atteindrez 100+ praticiens et 3 K\u20AC de MRR, alors evaluez l\'ajout d\'un canal payant a 500-1 000 \u20AC/mois.'
              )}
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 7. KPI FRAMEWORK                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle={t('10 metrics to track with quarterly benchmarks — know what good looks like', '10 indicateurs a suivre avec des objectifs trimestriels — savoir a quoi ressemble le succes')}>
            {t('7. KPI Framework', '7. Cadre KPI')}
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Metric', 'Indicateur')}</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Category', 'Categorie')}</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M3</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M6</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M12</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M18</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Why This Matters', 'Pourquoi c\'est important')}</th>
                </tr>
              </thead>
              <tbody>
                {KPIS.map((kpi, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-semibold text-gray-900 border-b border-gray-100">{kpi.metric}</td>
                    <td className="p-3 border-b border-gray-100">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        kpi.category === 'Growth' ? 'bg-blue-100 text-blue-600' :
                        kpi.category === 'Revenue' ? 'bg-emerald-100 text-emerald-600' :
                        kpi.category === 'Retention' ? 'bg-red-100 text-red-600' :
                        kpi.category === 'Engagement' ? 'bg-violet-100 text-violet-600' :
                        kpi.category === 'Satisfaction' ? 'bg-amber-100 text-amber-600' :
                        kpi.category === 'Efficiency' ? 'bg-teal-100 text-teal-600' :
                        kpi.category === 'Virality' ? 'bg-pink-100 text-pink-600' :
                        kpi.category === 'Sales' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{kpi.category}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{kpi.m3Target}</td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{kpi.m6Target}</td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{kpi.m12Target}</td>
                    <td className="p-3 text-center font-mono font-semibold text-gray-900 border-b border-gray-100">{kpi.m18Target}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{kpi.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-red-400 mb-1">{t('Red Flag — Pause & Fix', 'Alerte rouge — Pause et correction')}</p>
              <p className="text-xs font-bold text-red-600">{t('Churn > 10% at M3', 'Churn > 10 % a M3')}</p>
              <p className="text-[10px] text-red-400 mt-0.5">{t('Stop selling. Fix the product.', 'Arretez de vendre. Corrigez le produit.')}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-amber-400 mb-1">{t('Yellow Flag — Investigate', 'Alerte jaune — Enqueter')}</p>
              <p className="text-xs font-bold text-amber-600">{t('0 organic signups by M3', '0 inscription organique a M3')}</p>
              <p className="text-[10px] text-amber-400 mt-0.5">{t('Messaging isn\'t resonating. Revisit positioning.', 'Le message ne resonne pas. Revoir le positionnement.')}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-emerald-400 mb-1">{t('Green Light — Accelerate', 'Feu vert — Accelerer')}</p>
              <p className="text-xs font-bold text-emerald-600">{t('Referrals > 20% by M6', 'Parrainages > 20 % a M6')}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{t('Flywheel spinning. Consider first hire.', 'La boucle de croissance tourne. Envisagez la premiere embauche.')}</p>
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 8. RISK MITIGATION                                 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle={t('Top 5 launch risks with early warning signals and contingency plans', 'Les 5 principaux risques de lancement avec signaux d\'alerte et plans de contingence')}>
            {t('8. Risk Mitigation', '8. Attenuation des risques')}
          </SectionTitle>

          <div className="space-y-3">
            {RISKS.map((r, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      r.impact === 'Fatal' ? 'text-red-500' :
                      r.impact === 'Critical' ? 'text-red-400' :
                      'text-amber-400'
                    }`} />
                    <h4 className="text-sm font-semibold text-gray-900">{r.risk}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      r.likelihood === 'High' ? 'bg-red-100 text-red-600' :
                      r.likelihood === 'Medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{r.likelihood}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      r.impact === 'Fatal' ? 'bg-red-200 text-red-700' :
                      r.impact === 'Critical' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>{t('Impact:', 'Impact :')} {r.impact}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <p className="text-amber-500 font-medium mb-0.5">{t('Early Warning', 'Signal d\'alerte')}</p>
                    <p className="text-amber-700">{r.earlyWarning}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg md:col-span-2">
                    <p className="text-emerald-500 font-medium mb-0.5">{t('Contingency Plan', 'Plan de contingence')}</p>
                    <p className="text-emerald-700">{r.contingency}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2"><strong>{t('Owner:', 'Responsable :')}</strong> {r.owner}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SYNTHESIS                                         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.5)}>
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-400" />
              {t('The GTM Operating System', 'Le systeme operationnel GTM')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3">{t('What makes this work', 'Ce qui fait que ca fonctionne')}</h4>
                <div className="space-y-2">
                  {[
                    { principle: t('Founder-led distribution', 'Distribution menee par les fondateurs'), detail: t('No marketing team needed. Two founders doing 50+ outreach conversations/week is more effective than any paid channel at this stage.', 'Pas besoin d\'equipe marketing. Deux fondateurs menant 50+ conversations de prospection/semaine est plus efficace que tout canal payant a ce stade.') },
                    { principle: t('Built-in viral loop', 'Boucle virale integree'), detail: t('1 practitioner → 12-15 members. Members can\'t buy Bloomsline themselves — the practitioner IS the distribution. Every sale seeds 15 potential advocates.', '1 praticien → 12-15 membres. Les membres ne peuvent pas acheter Bloomsline eux-memes — le praticien EST la distribution. Chaque vente seme 15 ambassadeurs potentiels.') },
                    { principle: t('Trust-based selling', 'Vente basee sur la confiance'), detail: t('Mental health professionals buy from peers and authority figures, not ads. Content + conferences + word-of-mouth is the only credible channel mix.', 'Les professionnels de sante mentale achetent aupres de pairs et de figures d\'autorite, pas via la publicite. Contenu + conferences + bouche-a-oreille est le seul mix de canaux credible.') },
                    { principle: t('CAC efficiency', 'Efficacite du CAC'), detail: t('At €50 CAC with 72x LTV/CAC, even 10% of your budget wasted is irrelevant. You\'re not optimizing spend — you\'re optimizing for speed to 100 users.', 'Avec un CAC de 50 \u20AC et un LTV/CAC de 72x, meme 10 % de budget gaspille est negligeable. Vous n\'optimisez pas les depenses — vous optimisez la vitesse pour atteindre 100 utilisateurs.') },
                  ].map((p, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-semibold text-white">{p.principle}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-amber-400 mb-3">{t('The 90-day truth test', 'Le test de verite a 90 jours')}</h4>
                <div className="space-y-3">
                  {[
                    { day: t('Day 14', 'Jour 14'), test: t('Have you talked to 50+ practitioners?', 'Avez-vous parle a plus de 50 praticiens ?'), answer: t('If no, you\'re not moving fast enough. Outreach volume trumps perfection.', 'Si non, vous n\'avancez pas assez vite. Le volume de prospection prime sur la perfection.') },
                    { day: t('Day 30', 'Jour 30'), test: t('Do you have 5+ paying users?', 'Avez-vous 5+ utilisateurs payants ?'), answer: t('If no, the pricing or value prop is wrong — not the product. Fix the pitch first.', 'Si non, le prix ou la proposition de valeur est mauvais — pas le produit. Corrigez le pitch d\'abord.') },
                    { day: t('Day 60', 'Jour 60'), test: t('Have members logged 100+ moments?', 'Les membres ont-ils enregistre 100+ moments ?'), answer: t('If no, onboarding is broken. Practitioners signed up but members aren\'t activated.', 'Si non, l\'onboarding est casse. Les praticiens se sont inscrits mais les membres ne sont pas actives.') },
                    { day: t('Day 90', 'Jour 90'), test: t('Has anyone signed up without your direct involvement?', 'Quelqu\'un s\'est-il inscrit sans votre implication directe ?'), answer: t('If yes, you have a business. If no, you have a consulting project. Act accordingly.', 'Si oui, vous avez un business. Si non, vous avez un projet de conseil. Agissez en consequence.') },
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{item.day}</span>
                        <p className="text-xs font-semibold text-white">{item.test}</p>
                      </div>
                      <p className="text-[10px] text-gray-400">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-white">{t('Bottom line:', 'L\'essentiel :')}</strong> {t(
                  'This is a founder-led GTM. Your budget is your calendar. Your channel is your network. Your content is your conviction. The first 30 practitioners will come from sweat, not spend. After that, the care network effect does the rest — each practitioner bringing 12-15 members, each member interaction proving the product, each proved practitioner telling their peers.',
                  'C\'est un GTM mene par les fondateurs. Votre budget, c\'est votre agenda. Votre canal, c\'est votre reseau. Votre contenu, c\'est votre conviction. Les 30 premiers praticiens viendront de l\'effort, pas des depenses. Ensuite, l\'effet reseau de soin fait le reste — chaque praticien amenant 12-15 membres, chaque interaction membre prouvant le produit, chaque praticien convaincu parlant a ses pairs.'
                )}
                <strong className="text-emerald-400"> {t('Get 10 paying practitioners in 30 days. Everything else follows.', 'Obtenez 10 praticiens payants en 30 jours. Tout le reste suivra.')}</strong>
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.55)}
          className="flex items-center gap-2 text-[10px] text-gray-400"
        >
          <Clock className="w-3 h-3" />
          <span>{t('GTM playbook as of Feb 2026', 'Strategie GTM en date de fevrier 2026')}</span>
          <span className="text-gray-200">|</span>
          <span>{t('Bloomsline Care — Go-to-Market Execution Plan', 'Bloomsline Care — Plan de mise en marche')}</span>
        </motion.div>
      </main>
    </div>
  )
}
