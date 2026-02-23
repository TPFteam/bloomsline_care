'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Users,
  MessageSquare,
  Megaphone,
  Handshake,
  Target,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Calendar,
  BookOpen,
  Globe,
  TrendingUp,
  AlertTriangle,
  Zap,
  RefreshCw,
  MapPin,
  GraduationCap,
  Mic,
  PenTool,
  UserPlus,
  Star,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

type Lang = 'en' | 'fr'
type T = (en: string, fr: string) => string

// ── Data factories (language-aware) ──────────────────────────────────────

const MARKET_SIZE = {
  totalPsychologists: '89,800',
  independent: '~30,000',
  yoyGrowth: '+21%',
  density: '107.7 / 100K',
}

function getPHASES(t: T) {
  return [
    {
      id: 'pre',
      label: t('Pre-Raise', 'Pré-levée'),
      timeline: t('Now → Close', 'Maintenant → Clôture'),
      color: 'bg-gray-900',
      lightBg: 'bg-gray-50',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-900',
      target: t('3 → 10 practitioners', '3 → 10 praticiens'),
      mrr: '€250',
      strategy: t('Founder-led direct outreach', 'Prospection directe par les fondateurs'),
      activities: [
        t('LinkedIn outreach: 10 personalized messages/day per founder', 'Prospection LinkedIn : 10 messages personnalisés/jour par fondateur'),
        t('Validate willingness to pay — convert beta testers to €25/mo', 'Valider la volonté de payer — convertir les bêta-testeurs à 25 €/mois'),
        t('Collect 3-5 testimonials and usage data', 'Recueillir 3 à 5 témoignages et données d\'utilisation'),
        t('Refine pitch: "what happens between sessions" positioning', 'Affiner le pitch : positionnement « ce qui se passe entre les séances »'),
        t('Build prospect list: 200 practitioners (Paris, LinkedIn + Doctolib)', 'Constituer une liste de 200 praticiens (Paris, LinkedIn + Doctolib)'),
      ],
      channels: [
        t('Direct outreach (LinkedIn)', 'Prospection directe (LinkedIn)'),
        t('Personal network', 'Réseau personnel'),
        t('Demo calls', 'Appels démo'),
      ],
    },
    {
      id: 'p1',
      label: 'Phase 1',
      timeline: 'M1 – M6',
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      target: t('10 → 60 practitioners', '10 → 60 praticiens'),
      mrr: '€1,500',
      strategy: t('Expand outreach + start content', 'Élargir la prospection + lancer le contenu'),
      activities: [
        t('Scale LinkedIn outreach with multi-channel (email + LinkedIn + follow-up)', 'Intensifier la prospection LinkedIn en multicanal (email + LinkedIn + relance)'),
        t('Launch blog in French: "gestion cabinet psychologue", "suivi patient"', 'Lancer le blog en français : « gestion cabinet psychologue », « suivi patient »'),
        t('Attend first conference (AFTCC workshop or Congrès Français de Psychiatrie)', 'Participer à un premier congrès (atelier AFTCC ou Congrès Français de Psychiatrie)'),
        t('Launch referral program: 1 free month per referral', 'Lancer le programme de parrainage : 1 mois offert par parrainage'),
        t('Contact AFTCC and FFPP about presenting at events', 'Contacter l\'AFTCC et la FFPP pour présenter lors d\'événements'),
        t('Publish 2 case studies from beta practitioners', 'Publier 2 études de cas de praticiens bêta'),
      ],
      channels: [
        t('Direct outreach', 'Prospection directe'),
        t('Content (blog FR)', 'Contenu (blog FR)'),
        t('Events', 'Événements'),
        t('Referrals', 'Parrainages'),
      ],
    },
    {
      id: 'p2',
      label: 'Phase 2',
      timeline: 'M7 – M12',
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      target: t('60 → 150 practitioners', '60 → 150 praticiens'),
      mrr: '€3,750',
      strategy: t('Organic inbound + partnerships', 'Inbound organique + partenariats'),
      activities: [
        t('Content marketing in full swing: weekly posts, SEO compounding', 'Marketing de contenu à plein régime : publications hebdomadaires, effet cumulatif du SEO'),
        t('Training institute partnerships (IFFORTHECC, IRCCADE, Asadis)', 'Partenariats avec des instituts de formation (IFFORTHECC, IRCCADE, Asadis)'),
        t('Offer free year for newly certified practitioners', 'Offrir une année gratuite aux praticiens nouvellement certifiés'),
        t('Guest on French psych podcasts (Deux Psys, Catherine la Psy)', 'Invité sur des podcasts psy français (Deux Psys, Catherine la Psy)'),
        t('First organic/referral signups should appear (inflection signal)', 'Les premières inscriptions organiques / par parrainage devraient apparaître (signal d\'inflexion)'),
        t('Consider first hire: customer success / support', 'Envisager une première embauche : succès client / support'),
      ],
      channels: [
        t('Content (SEO)', 'Contenu (SEO)'),
        t('Partnerships', 'Partenariats'),
        t('Referrals', 'Parrainages'),
        t('Podcasts', 'Podcasts'),
        t('Inbound', 'Inbound'),
      ],
    },
    {
      id: 'p3',
      label: 'Phase 3',
      timeline: 'M13 – M18',
      color: 'bg-violet-600',
      lightBg: 'bg-violet-50',
      borderColor: 'border-violet-200',
      textColor: 'text-violet-700',
      target: t('150 → 280+ practitioners', '150 → 280+ praticiens'),
      mrr: '€7,000+',
      strategy: t('Flywheel spinning + Series A prep', 'Volant d\'inertie en marche + préparation Série A'),
      activities: [
        t('Referrals should be 20-30% of new signups', 'Les parrainages devraient représenter 20 à 30 % des nouvelles inscriptions'),
        t('Expand to French-speaking markets (Belgium, Switzerland)', 'Expansion vers les marchés francophones (Belgique, Suisse)'),
        t('Explore group practice / multi-practitioner plans', 'Explorer les offres cabinet de groupe / multi-praticiens'),
        t('Build Series A data package: retention, NPS, unit economics', 'Préparer le dossier Série A : rétention, NPS, unit economics'),
        t('Start conversations with enterprise / EAP partners', 'Entamer des discussions avec des partenaires entreprises / PAE'),
        t('Evaluate HDS certification for larger clients', 'Évaluer la certification HDS pour les grands comptes'),
      ],
      channels: [
        t('Referrals', 'Parrainages'),
        t('Organic inbound', 'Inbound organique'),
        t('Partnerships', 'Partenariats'),
        t('Expansion', 'Expansion'),
      ],
    },
  ]
}

function getCHANNELS(t: T) {
  return [
    {
      icon: MessageSquare,
      name: t('Direct Outreach (LinkedIn + Email)', 'Prospection directe (LinkedIn + Email)'),
      priority: t('Primary — now', 'Prioritaire — maintenant'),
      color: 'bg-blue-50 text-blue-600',
      when: t('Pre-raise → M6', 'Pré-levée → M6'),
      why: t(
        'Highest leverage at early stage. Multi-channel gets 287% higher reply rate vs single channel. At €25/mo, you need volume: 50+ conversations/week.',
        'Levier le plus puissant en phase initiale. Le multicanal obtient un taux de réponse 287 % supérieur au monocanal. À 25 €/mois, il faut du volume : 50+ conversations/semaine.'
      ),
      how: t(
        'Build list from LinkedIn Sales Navigator + Doctolib. Personalize every message. Offer 15-min demo, not a sales pitch. Follow up 3x.',
        'Constituer la liste via LinkedIn Sales Navigator + Doctolib. Personnaliser chaque message. Proposer une démo de 15 min, pas un pitch commercial. Relancer 3 fois.'
      ),
    },
    {
      icon: PenTool,
      name: t('Content Marketing (French blog + SEO)', 'Marketing de contenu (blog français + SEO)'),
      priority: t('Start now — compounds', 'Commencer maintenant — effet cumulatif'),
      color: 'bg-emerald-50 text-emerald-600',
      when: t('M1 → ongoing', 'M1 → continu'),
      why: t(
        'French practitioners search for "gestion cabinet", "suivi patient", "RGPD psychologue". Low competition in French. SEO compounds over time.',
        'Les praticiens français recherchent « gestion cabinet », « suivi patient », « RGPD psychologue ». Faible concurrence en français. Le SEO se cumule dans le temps.'
      ),
      how: t(
        'Publish weekly in French. Target keywords practitioners search. Share on LinkedIn. Repurpose for social. Goal: organic inbound by M6.',
        'Publier chaque semaine en français. Cibler les mots-clés recherchés par les praticiens. Partager sur LinkedIn. Réutiliser pour les réseaux sociaux. Objectif : inbound organique d\'ici M6.'
      ),
    },
    {
      icon: Calendar,
      name: t('Events & Conferences', 'Événements et congrès'),
      priority: t('High — credibility', 'Élevée — crédibilité'),
      color: 'bg-amber-50 text-amber-600',
      when: 'M3 → M18',
      why: t(
        'SimplePractice founder got first customers by attending local chapter meetings. AFTCC has 2,500 members. Congrès Français de Psychiatrie is the annual gathering.',
        'Le fondateur de SimplePractice a obtenu ses premiers clients en participant aux réunions locales. L\'AFTCC compte 2 500 membres. Le Congrès Français de Psychiatrie est le rendez-vous annuel.'
      ),
      how: t(
        'Attend AFTCC workshops. Present at FFPP/SNP events. Demo at Congrès (Dec 2025 Cannes, Dec 2026 Strasbourg).',
        'Participer aux ateliers AFTCC. Présenter lors des événements FFPP/SNP. Démonstration au Congrès (déc. 2025 Cannes, déc. 2026 Strasbourg).'
      ),
    },
    {
      icon: UserPlus,
      name: t('Referral Program', 'Programme de parrainage'),
      priority: t('Activate at 10 users', 'Activer à 10 utilisateurs'),
      color: 'bg-violet-50 text-violet-600',
      when: t('M3 → ongoing', 'M3 → continu'),
      why: t(
        '86% of B2B buyers say word-of-mouth is most influential. Referred customers have 16-25% higher LTV and lower churn.',
        '86 % des acheteurs B2B considèrent le bouche-à-oreille comme le plus influent. Les clients parrainés ont une LTV 16 à 25 % plus élevée et un churn plus faible.'
      ),
      how: t(
        '1 free month per successful referral. Ask every user for 2 introductions. Built into dashboard: "Invite a colleague" button.',
        '1 mois gratuit par parrainage réussi. Demander à chaque utilisateur 2 mises en relation. Intégré au tableau de bord : bouton « Inviter un collègue ».'
      ),
    },
    {
      icon: GraduationCap,
      name: t('Training Institute Partnerships', 'Partenariats avec les instituts de formation'),
      priority: t('Medium-term — high leverage', 'Moyen terme — fort levier'),
      color: 'bg-rose-50 text-rose-600',
      when: 'M6 → M18',
      why: t(
        '21% growth in psychologist numbers = thousands of new practitioners setting up practice each year. Easiest early adopters.',
        '21 % de croissance du nombre de psychologues = des milliers de nouveaux praticiens s\'installant chaque année. Les primo-adoptants les plus faciles.'
      ),
      how: t(
        'Partner with AFTCC, IFFORTHECC, IRCCADE, Asadis. Free year for students/newly certified. "Recommended tool" positioning.',
        'Partenariat avec AFTCC, IFFORTHECC, IRCCADE, Asadis. Année gratuite pour les étudiants/nouveaux certifiés. Positionnement « outil recommandé ».'
      ),
    },
    {
      icon: Mic,
      name: t('Podcast Guest Appearances', 'Passages en tant qu\'invité sur les podcasts'),
      priority: t('Complement — authority', 'Complémentaire — autorité'),
      color: 'bg-cyan-50 text-cyan-600',
      when: 'M6 → M18',
      why: t(
        'Practitioners listen to Deux Psys, Catherine la Psy, Le Comptoir de la Psychologie. Builds authority and trust with zero cost.',
        'Les praticiens écoutent Deux Psys, Catherine la Psy, Le Comptoir de la Psychologie. Construit l\'autorité et la confiance à coût nul.'
      ),
      how: t(
        'Pitch guest spots on 3-5 French psych podcasts. Share practitioner stories and between-session care insights.',
        'Proposer des interventions sur 3 à 5 podcasts psy français. Partager des témoignages de praticiens et des réflexions sur le suivi entre les séances.'
      ),
    },
  ]
}

function getPARTNERSHIPS(t: T) {
  return [
    { name: 'AFTCC', type: t('Professional Association', 'Association professionnelle'), members: t('2,500 members', '2 500 membres'), opportunity: t('Workshop sponsorship, event presence', 'Sponsoring d\'ateliers, présence événementielle') },
    { name: 'FFPP', type: t('Federation', 'Fédération'), members: t('National umbrella', 'Organisation nationale'), opportunity: t('Chapter meetings, newsletter features', 'Réunions régionales, mise en avant dans la newsletter') },
    { name: 'SNP', type: t('Union', 'Syndicat'), members: t('National scope', 'Envergure nationale'), opportunity: t('Advocacy alignment, policy discussions', 'Alignement sur le plaidoyer, discussions politiques') },
    { name: 'IFFORTHECC', type: t('Training Institute', 'Institut de formation'), members: t('Diploma programs', 'Programmes diplômants'), opportunity: t('Student partnerships, recommended tool', 'Partenariats étudiants, outil recommandé') },
    { name: 'IRCCADE', type: t('Training Institute', 'Institut de formation'), members: 'Bordeaux/Sud-Ouest', opportunity: t('Regional expansion, graduate pipeline', 'Expansion régionale, vivier de diplômés') },
    { name: 'Asadis', type: t('Online Training', 'Formation en ligne'), members: t('By & for psychologists', 'Par et pour les psychologues'), opportunity: t('Platform integration, co-marketing', 'Intégration plateforme, co-marketing') },
  ]
}

function getMILESTONES(t: T) {
  return [
    { users: 10, label: t('Payment validated', 'Paiement validé'), signal: t('Willingness to pay proven', 'Volonté de payer prouvée'), trigger: t('Close pre-seed', 'Clôturer le pré-seed') },
    { users: 30, label: t('PMF signal', 'Signal PMF'), signal: t('<5% monthly churn', '<5 % de churn mensuel'), trigger: t('Stop selling, fix product if churn >10%', 'Arrêter de vendre, corriger le produit si churn >10 %') },
    { users: 50, label: t('First organic signup', 'Première inscription organique'), signal: t('Someone signed up without founder contact', 'Quelqu\'un s\'est inscrit sans contact fondateur'), trigger: t('Word-of-mouth beginning', 'Début du bouche-à-oreille') },
    { users: 100, label: t('Model proven', 'Modèle prouvé'), signal: t('15-20% MoM growth, stable churn', '15-20 % de croissance MoM, churn stable'), trigger: t('Consider first hire', 'Envisager une première embauche') },
    { users: 200, label: t('Flywheel spinning', 'Volant d\'inertie en marche'), signal: t('Referrals = 20-30% of signups', 'Parrainages = 20-30 % des inscriptions'), trigger: t('Series A conversations', 'Discussions Série A') },
    { users: 280, label: t('Seed target hit', 'Objectif seed atteint'), signal: t('€7K+ MRR, proven unit economics', '7 K€+ MRR, unit economics prouvés'), trigger: t('Raise Series A', 'Lever la Série A') },
  ]
}

function getRISKS(t: T) {
  return [
    {
      risk: t('Slow adoption / long sales cycles', 'Adoption lente / cycles de vente longs'),
      likelihood: t('High', 'Élevé'),
      mitigation: t(
        'Multi-channel outreach, free trial, white-glove onboarding, ultra-low €25/mo friction',
        'Prospection multicanal, essai gratuit, onboarding personnalisé, friction ultra-faible à 25 €/mois'
      ),
    },
    {
      risk: t('Practitioners don\'t see enough value', 'Les praticiens ne perçoivent pas assez de valeur'),
      likelihood: t('Medium', 'Moyen'),
      mitigation: t(
        'Focus on member engagement data — show practitioners their clients are using it',
        'Se concentrer sur les données d\'engagement des membres — montrer aux praticiens que leurs clients l\'utilisent'
      ),
    },
    {
      risk: t('Doctolib adds engagement features', 'Doctolib ajoute des fonctionnalités d\'engagement'),
      likelihood: t('Low-Med', 'Faible-Moyen'),
      mitigation: t(
        'Move fast. Our B2C member layer + AI companion is hard to bolt on as an afterthought',
        'Aller vite. Notre couche B2C membre + compagnon IA est difficile à ajouter après coup'
      ),
    },
    {
      risk: t('HDS compliance required', 'Certification HDS requise'),
      likelihood: t('Medium', 'Moyen'),
      mitigation: t(
        'Get legal advice early. Evaluate HDS-certified hosting (Scalingo, OVHcloud) as backup',
        'Consulter un avocat tôt. Évaluer un hébergement certifié HDS (Scalingo, OVHcloud) en plan B'
      ),
    },
    {
      risk: t('Runway runs out before traction', 'Le runway s\'épuise avant la traction'),
      likelihood: t('Medium', 'Moyen'),
      mitigation: t(
        'Keep burn under €10K/mo. Milestone-based spending. Don\'t hire until PMF signal.',
        'Maintenir le burn sous 10 K€/mois. Dépenses par jalons. Ne pas embaucher avant le signal PMF.'
      ),
    },
  ]
}

// ── Flywheel Visual ──────────────────────────────────────────────────────

function FlywheelDiagram({ lang }: { lang: Lang }) {
  const t: T = (en, fr) => lang === 'fr' ? fr : en

  const steps = [
    { icon: UserPlus, label: t('Practitioner signs up', 'Un praticien s\'inscrit'), sub: t('€25/mo', '25 €/mois'), color: 'bg-blue-100 text-blue-700' },
    { icon: Users, label: t('Onboards 10-15 members', 'Intègre 10-15 membres'), sub: t('Free for members', 'Gratuit pour les membres'), color: 'bg-emerald-100 text-emerald-700' },
    { icon: Star, label: t('Members engage with Bloom AI', 'Les membres interagissent avec Bloom AI'), sub: t('Better outcomes', 'De meilleurs résultats'), color: 'bg-violet-100 text-violet-700' },
    { icon: TrendingUp, label: t('Practitioner sees results', 'Le praticien voit les résultats'), sub: t('Engagement data + retention', 'Données d\'engagement + rétention'), color: 'bg-amber-100 text-amber-700' },
    { icon: Megaphone, label: t('Tells peers about it', 'En parle à ses pairs'), sub: t('Word-of-mouth', 'Bouche-à-oreille'), color: 'bg-rose-100 text-rose-700' },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.label} className="flex flex-col items-center">
            <div className={`${step.color} rounded-xl px-5 py-3 flex items-center gap-3 w-full max-w-sm`}>
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[10px] opacity-70">{step.sub}</p>
              </div>
            </div>
            {i < steps.length - 1 && <ArrowDown className="w-4 h-4 text-gray-300 my-1" />}
          </div>
        )
      })}
      {/* Loop back arrow */}
      <div className="flex items-center gap-2 mt-1">
        <RefreshCw className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-semibold text-indigo-500">
          {t('New practitioners join → repeat', 'De nouveaux praticiens s\'inscrivent → cycle')}
        </span>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function GoToMarketPage() {
  const [lang, setLang] = useState<Lang>('en')
  const t: T = (en, fr) => lang === 'fr' ? fr : en

  const PHASES = getPHASES(t)
  const CHANNELS = getCHANNELS(t)
  const PARTNERSHIPS_DATA = getPARTNERSHIPS(t)
  const MILESTONES_DATA = getMILESTONES(t)
  const RISKS_DATA = getRISKS(t)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Go-to-Market Strategy', 'Stratégie de mise en marché')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — From 10 to 280 Practitioners', 'Bloomsline Care — De 10 à 280 praticiens')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {lang === 'en' ? '\u{1F1EB}\u{1F1F7} Fran\u00e7ais' : '\u{1F1EC}\u{1F1E7} English'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* ── Thesis ──────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Practitioner-Led Growth', 'Croissance portée par les praticiens')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              "We don\u2019t sell to consumers. We sell to practitioners \u2014 they bring their entire caseload. One \u20ac25/mo sale = 10-15 member accounts for free. That\u2019s not marketing \u2014 that\u2019s how care works. Every practitioner who joins seeds the next wave through peer word-of-mouth.",
              "Nous ne vendons pas aux consommateurs. Nous vendons aux praticiens \u2014 ils am\u00e8nent toute leur client\u00e8le. Une vente \u00e0 25\u00a0\u20ac/mois = 10 \u00e0 15 comptes membres gratuits. Ce n\u2019est pas du marketing \u2014 c\u2019est ainsi que fonctionne le soin. Chaque praticien qui s\u2019inscrit g\u00e9n\u00e8re la vague suivante par le bouche-\u00e0-oreille entre pairs."
            )}
          </p>
        </motion.div>

        {/* ── Market Size ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('France Market — Starting Here', 'Marché français — Notre point de départ')}</h3>
            <span className="text-[10px] text-gray-400 ml-1">{t('Mental health declared 2025 "Grande Cause Nationale"', 'Santé mentale déclarée « Grande Cause Nationale » 2025')}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{MARKET_SIZE.totalPsychologists}</p>
              <p className="text-[10px] text-gray-500">{t('Psychologists in France', 'Psychologues en France')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-indigo-600">{MARKET_SIZE.independent}</p>
              <p className="text-[10px] text-gray-500">{t('Independent / mixed practice', 'Libéral / exercice mixte')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{MARKET_SIZE.yoyGrowth}</p>
              <p className="text-[10px] text-gray-500">{t('YoY growth (2024)', 'Croissance annuelle (2024)')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-600">{MARKET_SIZE.density}</p>
              <p className="text-[10px] text-gray-500">{t('Per 100K inhabitants', 'Pour 100 000 habitants')}</p>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg px-4 py-2.5">
            <p className="text-xs text-indigo-700">
              {t(
                'Our addressable market: ~30,000 independent practitioners. At 1% penetration (300 users) = €90K ARR. At 5% (1,500) = €450K ARR. This is psychologists only — add psychiatrists, psychotherapists, coaches and the TAM grows significantly.',
                'Notre marché adressable : ~30 000 praticiens indépendants. À 1 % de pénétration (300 utilisateurs) = 90 K€ ARR. À 5 % (1 500) = 450 K€ ARR. Cela concerne uniquement les psychologues — en ajoutant psychiatres, psychothérapeutes et coachs, le TAM augmente considérablement.'
              )}
            </p>
          </div>
        </motion.div>

        {/* ── The Flywheel ────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('The Growth Flywheel', 'Le volant d\'inertie de croissance')}</h3>
          <p className="text-[10px] text-gray-400 mb-5">{t('Each practitioner seeds the next wave through the care network effect', 'Chaque praticien génère la vague suivante grâce à l\'effet réseau de soin')}</p>
          <FlywheelDiagram lang={lang} />
        </motion.div>

        {/* ── Phased Plan ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('The Plan — 18 Months', 'Le plan — 18 mois')}</h3>
          <div className="space-y-4">
            {PHASES.map((phase, i) => (
              <motion.div
                key={phase.id}
                {...fadeUp}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`${phase.lightBg} border ${phase.borderColor} rounded-xl p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`${phase.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-lg`}>
                      {phase.timeline}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${phase.textColor}`}>{phase.label}: {phase.strategy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{phase.target}</p>
                    <p className="text-[10px] text-gray-400">MRR: {phase.mrr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mb-3">
                  {phase.activities.map((activity) => (
                    <div key={activity} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-600">{activity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50">
                  <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{t('Channels:', 'Canaux :')}</span>
                  {phase.channels.map((ch) => (
                    <span key={ch} className="text-[10px] bg-white/80 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{ch}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Channel Strategy ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('Channel Strategy — Ranked by Priority', 'Stratégie par canal — Classement par priorité')}</h3>
          <div className="space-y-3">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              return (
                <div key={ch.name} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${ch.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-900">{ch.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400">{ch.when}</span>
                          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{ch.priority}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5">{ch.why}</p>
                      <p className="text-xs text-gray-400"><span className="font-medium text-gray-500">{t('How:', 'Comment :')}</span> {ch.how}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Key Partnerships ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('Target Partnerships', 'Partenariats cibles')}</h3>
            <span className="text-[10px] text-gray-400 ml-1">{t('French professional ecosystem', 'Écosystème professionnel français')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PARTNERSHIPS_DATA.map((p) => (
              <div key={p.name} className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-amber-600">{p.name.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900">{p.name}</p>
                    <span className="text-[9px] text-gray-400">{p.type}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{p.members}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.opportunity}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Growth Milestones ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('Inflection Points — What to Watch', 'Points d\'inflexion — Ce qu\'il faut surveiller')}</h3>
          <div className="space-y-2">
            {MILESTONES_DATA.map((m) => (
              <div key={m.users} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{m.users}</span>
                  <span className="text-[8px] text-gray-400">{t('users', 'utilisateurs')}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">{m.label}</p>
                  <p className="text-[10px] text-gray-500">{m.signal}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">{m.trigger}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Sales Cycle ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('Sales Cycle — Independent Practitioners', 'Cycle de vente — Praticiens indépendants')}</h3>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {[
              { stage: t('Awareness', 'Notoriété'), time: t('1-4 weeks', '1-4 semaines'), color: 'bg-blue-100 text-blue-700' },
              { stage: t('Demo / Trial', 'Démo / Essai'), time: t('1-2 weeks', '1-2 semaines'), color: 'bg-emerald-100 text-emerald-700' },
              { stage: t('Conversion', 'Conversion'), time: t('2-4 weeks', '2-4 semaines'), color: 'bg-violet-100 text-violet-700' },
            ].map((s, i) => (
              <div key={s.stage} className="flex items-center gap-2">
                <div className={`${s.color} rounded-lg px-3 py-2 text-center`}>
                  <p className="text-[10px] font-bold">{s.stage}</p>
                  <p className="text-[9px] opacity-70">{s.time}</p>
                </div>
                {i < 2 && <ArrowRight className="w-3 h-3 text-gray-300" />}
              </div>
            ))}
            <div className="bg-gray-100 rounded-lg px-3 py-2 ml-2">
              <p className="text-[10px] font-bold text-gray-700">{t('Total: 4-10 weeks', 'Total : 4-10 semaines')}</p>
              <p className="text-[9px] text-gray-400">{t('Solo decision-maker, low price', 'Décideur unique, prix bas')}</p>
            </div>
          </div>

          <h4 className="text-xs font-semibold text-gray-700 mb-2">{t('Top Objections & Counters', 'Principales objections et réponses')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              {
                objection: t('"I don\'t have time to learn a new tool"', '« Je n\'ai pas le temps d\'apprendre un nouvel outil »'),
                counter: t('White-glove onboarding — we set up their account in 15 min', 'Onboarding personnalisé — nous configurons leur compte en 15 min'),
              },
              {
                objection: t('"I already use Doctolib"', '« J\'utilise déjà Doctolib »'),
                counter: t('We\'re not replacing Doctolib. We\'re the engagement layer between sessions.', 'Nous ne remplaçons pas Doctolib. Nous sommes la couche d\'engagement entre les séances.'),
              },
              {
                objection: t('"It costs too much"', '« C\'est trop cher »'),
                counter: t('€25/mo = less than one cancelled session. Compare to Doctolib at €129/mo.', '25 €/mois = moins qu\'une séance annulée. Comparez à Doctolib à 129 €/mois.'),
              },
              {
                objection: t('"I\'m worried about data security"', '« Je m\'inquiète pour la sécurité des données »'),
                counter: t('EU-hosted, GDPR-native, AES-256 encryption, Row Level Security on every table.', 'Hébergé dans l\'UE, natif RGPD, chiffrement AES-256, sécurité au niveau des lignes sur chaque table.'),
              },
            ].map((o) => (
              <div key={o.objection} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold text-red-600 mb-0.5">{o.objection}</p>
                <p className="text-[10px] text-gray-600">{o.counter}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Risks & Mitigations ─────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('Key Risks', 'Risques clés')}</h3>
          </div>
          <div className="space-y-2">
            {RISKS_DATA.map((r) => (
              <div key={r.risk} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-4">
                <div className="shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    r.likelihood === t('High', 'Élevé') ? 'bg-red-100 text-red-600' :
                    r.likelihood === t('Medium', 'Moyen') ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{r.likelihood}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">{r.risk}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom Line ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-2">{t('The Bottom Line', 'L\'essentiel')}</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            {t(
              "We\u2019re not building a marketing machine \u2014 we\u2019re building a care network. Every practitioner who joins brings 10-15 members. Those members see other practitioners. Those practitioners hear about us. The flywheel is the product itself. With \u20ac250-400K, 2 founders, and 18 months of runway, we target 280 practitioners and \u20ac84K ARR \u2014 enough for a credible Series A conversation.",
              "Nous ne construisons pas une machine marketing \u2014 nous construisons un r\u00e9seau de soin. Chaque praticien qui s\u2019inscrit am\u00e8ne 10 \u00e0 15 membres. Ces membres consultent d\u2019autres praticiens. Ces praticiens entendent parler de nous. Le volant d\u2019inertie, c\u2019est le produit lui-m\u00eame. Avec 250 \u00e0 400\u00a0K\u20ac, 2 fondateurs et 18 mois de runway, nous visons 280 praticiens et 84\u00a0K\u20ac d\u2019ARR \u2014 suffisant pour une discussion cr\u00e9dible de S\u00e9rie A."
            )}
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div {...fadeUp} transition={{ delay: 0.65 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Go-to-market strategy — Bloomsline Care, Feb 2026', 'Stratégie de mise en marché — Bloomsline Care, fév. 2026')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
