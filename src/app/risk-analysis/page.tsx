'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Eye,
  Target,
  DollarSign,
  Scale,
  Users,
  Brain,
  Lock,
  Lightbulb,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

type TFn = (en: string, fr: string) => string

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

function ImpactBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded-sm ${i < value ? color : 'bg-gray-100'}`}
        />
      ))}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${styles[severity] || styles.Medium}`}>
      {severity}
    </span>
  )
}

// ── Category config ─────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; dotColor: string; icon: typeof Shield }> = {
  Market: { color: 'text-blue-600 bg-blue-50 border-blue-200', dotColor: 'bg-blue-500', icon: TrendingUp },
  Operational: { color: 'text-orange-600 bg-orange-50 border-orange-200', dotColor: 'bg-orange-500', icon: Users },
  Financial: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500', icon: DollarSign },
  Regulatory: { color: 'text-violet-600 bg-violet-50 border-violet-200', dotColor: 'bg-violet-500', icon: Scale },
  Reputational: { color: 'text-rose-600 bg-rose-50 border-rose-200', dotColor: 'bg-rose-500', icon: Eye },
}

// ── Risk data ───────────────────────────────────────────────────────────

interface Risk {
  id: string
  category: string
  name: string
  probability: number
  impact: number
  score: number
  severity: string
  description: string
  earlyWarnings: string[]
  mitigation: string
  contingency: string
}

function getRisks(t: TFn): Risk[] {
  return [
    {
      id: 'R1',
      category: t('Market', 'Marché'),
      name: t('Adoption slower than modeled', 'Adoption plus lente que prévu'),
      probability: 4,
      impact: 4,
      score: 16,
      severity: t('Critical', 'Critique'),
      description: t(
        'Financial model assumes 20-30% MoM practitioner growth from 10 initial users. If growth is 10-15% MoM due to therapist technology inertia (only 5% of therapists currently use AI in practice), runway math shifts dramatically. At €8.7K/month burn with €300K cash, 34 months of runway means nothing without revenue traction — Series A becomes unreachable.',
        'Le modèle financier prévoit une croissance de 20-30 % MoM des praticiens à partir de 10 utilisateurs initiaux. Si la croissance est de 10-15 % MoM en raison de l\'inertie technologique des thérapeutes (seulement 5 % des thérapeutes utilisent actuellement l\'IA en pratique), les projections financières changent radicalement. Avec un burn de 8,7 K€/mois et 300 K€ de trésorerie, 34 mois de runway ne servent à rien sans traction commerciale — la Série A devient inaccessible.'
      ),
      earlyWarnings: [
        t('Fewer than 10 paying practitioners after 90 days of launch', 'Moins de 10 praticiens payants après 90 jours de lancement'),
        t('Demo-to-signup conversion rate below 15%', 'Taux de conversion démo-inscription inférieur à 15 %'),
        t('Trial-to-paid conversion below 40%', 'Taux de conversion essai-payant inférieur à 40 %'),
        t('Average onboarding time exceeding 30 minutes', 'Durée moyenne d\'intégration supérieure à 30 minutes'),
      ],
      mitigation: t(
        'Set hard PMF milestone: 10 paying practitioners within 90 days or pivot positioning. Implement product-led onboarding that gets first AI note generated in under 5 minutes. Build "instant value" features (AI scribe, session summaries) that demonstrate ROI before subscription commitment. Target early-adopter conferences (AFTCC, Asadis) for concentrated acquisition.',
        'Fixer un jalon PMF strict : 10 praticiens payants en 90 jours ou repositionnement. Mettre en place un onboarding produit permettant de générer la première note IA en moins de 5 minutes. Développer des fonctionnalités à « valeur immédiate » (scribe IA, résumés de séance) démontrant le ROI avant l\'engagement. Cibler les conférences d\'early adopters (AFTCC, Asadis) pour une acquisition concentrée.'
      ),
      contingency: t(
        'If 90-day target missed: shift to freemium model with AI notes as free hook and between-session care as paid tier. Reduce burn to €6K/month by deferring hiring. Explore partnership distribution (training institutes offering Bloomsline to graduates). If 180-day target still missed, evaluate pivot to B2B enterprise wellness or training institute licensing.',
        'Si l\'objectif à 90 jours n\'est pas atteint : passer au modèle freemium avec les notes IA gratuites et le suivi inter-séances en version payante. Réduire le burn à 6 K€/mois en reportant les embauches. Explorer la distribution par partenariats (instituts de formation proposant Bloomsline aux diplômés). Si l\'objectif à 180 jours n\'est toujours pas atteint, évaluer un pivot vers le B2B bien-être en entreprise ou les licences pour instituts.'
      ),
    },
    {
      id: 'R2',
      category: t('Market', 'Marché'),
      name: t('SimplePractice/Doctolib convergence', 'Convergence SimplePractice/Doctolib'),
      probability: 3,
      impact: 4,
      score: 12,
      severity: t('High', 'Élevé'),
      description: t(
        'Vista paid $4B for SimplePractice (237K practitioners). They are acquiring (Luminello), hiring (Head of Payer Partnerships), and building AI features. If SimplePractice launches a member app and enters EU simultaneously, the window closes in 18-24 months. Doctolib (80M patients, €6.4B valuation) could add between-session features leveraging existing distribution.',
        'Vista a payé 4 Md$ pour SimplePractice (237 K praticiens). Ils acquièrent (Luminello), recrutent (Head of Payer Partnerships) et développent des fonctionnalités IA. Si SimplePractice lance une application membre et entre dans l\'UE simultanément, la fenêtre se referme en 18-24 mois. Doctolib (80 M de patients, valorisation de 6,4 Md€) pourrait ajouter des fonctionnalités de suivi inter-séances grâce à sa distribution existante.'
      ),
      earlyWarnings: [
        t('SimplePractice announces EU office or GDPR compliance initiative', 'SimplePractice annonce un bureau européen ou une initiative de conformité RGPD'),
        t('Doctolib adds care features beyond booking', 'Doctolib ajoute des fonctionnalités de soins au-delà de la prise de rendez-vous'),
        t('Vista acquires a European therapy SaaS platform', 'Vista acquiert une plateforme SaaS européenne de thérapie'),
        t('SimplePractice launches a patient/member-facing app', 'SimplePractice lance une application destinée aux patients/membres'),
      ],
      mitigation: t(
        'Compete on care quality and local market fit, not feature breadth. SimplePractice will build a generic EU product — Bloomsline builds a French-first product with AFTCC partnerships and MonParcoursPsy optimization. Reach 200+ practitioners before convergence to establish network effects. Build data moats: accumulated session notes and engagement patterns.',
        'Se différencier par la qualité du soin et l\'adaptation au marché local, non par l\'étendue des fonctionnalités. SimplePractice construira un produit UE générique — Bloomsline développe un produit pensé pour la France avec des partenariats AFTCC et l\'optimisation MonParcoursPsy. Atteindre 200+ praticiens avant la convergence pour établir des effets de réseau. Constituer des avantages concurrentiels : notes de séance accumulées et schémas d\'engagement.'
      ),
      contingency: t(
        'If SimplePractice enters EU: double down on French-specific features and practitioner relationships. Position as "the European alternative" with EU data residency, French language support, and AFTCC integration. If Doctolib adds care features: differentiate on AI quality and between-session engagement — Doctolib\'s DNA is scheduling, not clinical care.',
        'Si SimplePractice entre dans l\'UE : renforcer les fonctionnalités spécifiques à la France et les relations avec les praticiens. Se positionner comme « l\'alternative européenne » avec l\'hébergement des données dans l\'UE, le support en français et l\'intégration AFTCC. Si Doctolib ajoute des fonctionnalités de soins : se différencier sur la qualité de l\'IA et l\'engagement inter-séances — l\'ADN de Doctolib est la planification, pas le soin clinique.'
      ),
    },
    {
      id: 'R3',
      category: t('Market', 'Marché'),
      name: t('Pricing pressure from open-source AI', 'Pression tarifaire de l\'IA open source'),
      probability: 2,
      impact: 3,
      score: 6,
      severity: t('Medium', 'Moyen'),
      description: t(
        'Meta Llama, Mistral, and other open-source models approach Claude quality rapidly. If practitioners can get "good enough" AI notes from a free tool or built into existing EHRs, Bloomsline\'s AI advantage erodes to the between-session engagement layer only. EHR vendors adding basic AI scribing could commoditize the acquisition hook.',
        'Meta Llama, Mistral et d\'autres modèles open source approchent rapidement la qualité de Claude. Si les praticiens peuvent obtenir des notes IA « suffisamment bonnes » depuis un outil gratuit ou intégré aux DSE existants, l\'avantage IA de Bloomsline se limite à la couche d\'engagement inter-séances. Les éditeurs de DSE ajoutant la transcription IA de base pourraient banaliser le levier d\'acquisition.'
      ),
      earlyWarnings: [
        t('Major EHR vendor announces free AI notes feature', 'Un éditeur DSE majeur annonce une fonctionnalité de notes IA gratuites'),
        t('Open-source therapy-specific fine-tuned model released', 'Publication d\'un modèle open source spécialisé en thérapie'),
        t('Competitor offers AI notes at significantly lower price point', 'Un concurrent propose des notes IA à un prix nettement inférieur'),
      ],
      mitigation: t(
        'Position AI notes as the wedge, not the moat. The defensible value is the practitioner-member connection and between-session engagement data. Build AI model routing: use Claude for complex clinical tasks, fall back to Mistral/Llama for basic transcription. Maintain 2+ AI providers to prevent vendor lock-in. Invest in proprietary training data from platform usage.',
        'Positionner les notes IA comme le levier d\'entrée, pas comme l\'avantage défensif. La valeur défendable est la connexion praticien-membre et les données d\'engagement inter-séances. Mettre en place un routage IA : utiliser Claude pour les tâches cliniques complexes, Mistral/Llama pour la transcription de base. Maintenir 2+ fournisseurs IA pour éviter la dépendance. Investir dans les données d\'entraînement propriétaires issues de l\'utilisation de la plateforme.'
      ),
      contingency: t(
        'If AI notes become commoditized: pivot marketing to "connected care" narrative — the AI notes get them in, the between-session engagement keeps them. Accelerate development of proprietary features like outcome prediction, churn detection, and personalized care plans that require platform-specific data.',
        'Si les notes IA deviennent banalisées : réorienter le marketing vers le récit du « soin connecté » — les notes IA attirent, l\'engagement inter-séances fidélise. Accélérer le développement de fonctionnalités propriétaires comme la prédiction des résultats, la détection de l\'attrition et les plans de soins personnalisés nécessitant des données spécifiques à la plateforme.'
      ),
    },
    {
      id: 'R4',
      category: t('Operational', 'Opérationnel'),
      name: t('Two-person team bottleneck', 'Goulot d\'étranglement de l\'équipe à deux'),
      probability: 4,
      impact: 4,
      score: 16,
      severity: t('Critical', 'Critique'),
      description: t(
        'Two founders covering product, engineering, sales, marketing, design, support, and fundraising. No clinical advisor on the team. If one founder is unavailable (illness, burnout, personal emergency), the entire operation stalls. Hiring plan deferred to post-seed. Cannot match feature velocity of well-funded competitors.',
        'Deux fondateurs couvrant produit, ingénierie, ventes, marketing, design, support et levée de fonds. Aucun conseiller clinique dans l\'équipe. Si un fondateur est indisponible (maladie, épuisement, urgence personnelle), toute l\'opération s\'arrête. Le plan de recrutement est reporté à l\'après-seed. Impossible d\'égaler la vélocité produit des concurrents bien financés.'
      ),
      earlyWarnings: [
        t('Feature backlog growing faster than delivery capacity', 'Le backlog de fonctionnalités croît plus vite que la capacité de livraison'),
        t('Customer support response time exceeding 24 hours', 'Temps de réponse du support client supérieur à 24 heures'),
        t('Founder burnout symptoms: missed deadlines, declining code quality', 'Symptômes d\'épuisement des fondateurs : délais manqués, qualité du code en baisse'),
        t('Sales conversations stalling because of product gaps', 'Les conversations commerciales stagnent à cause des lacunes produit'),
      ],
      mitigation: t(
        'Hire first engineer immediately after seed close (Month 1-2). Prioritize ruthlessly: only build features that directly drive practitioner acquisition or retention. Use AI-assisted development to multiply output. Establish advisory board with 2-3 clinical advisors (compensated with equity). Document all critical systems so either founder can operate alone temporarily.',
        'Recruter le premier ingénieur immédiatement après la clôture du seed (Mois 1-2). Prioriser impitoyablement : ne construire que les fonctionnalités qui contribuent directement à l\'acquisition ou la rétention des praticiens. Utiliser le développement assisté par IA pour multiplier la production. Constituer un comité consultatif avec 2-3 conseillers cliniques (rémunérés en equity). Documenter tous les systèmes critiques pour qu\'un fondateur puisse opérer seul temporairement.'
      ),
      contingency: t(
        'If founder becomes unavailable: activate advisor network for interim coverage. Pre-negotiate contract with senior freelance developer for emergency support (€400-600/day). If scaling requires faster hiring: convert €15-20K of seed funding to recruitment budget. Consider technical co-founder from Bpifrance\'s La French Tech network.',
        'Si un fondateur devient indisponible : activer le réseau de conseillers pour une couverture intérimaire. Pré-négocier un contrat avec un développeur freelance senior pour le support d\'urgence (400-600 €/jour). Si la montée en charge nécessite un recrutement plus rapide : convertir 15-20 K€ du seed en budget de recrutement. Envisager un CTO technique issu du réseau La French Tech de Bpifrance.'
      ),
    },
    {
      id: 'R5',
      category: t('Operational', 'Opérationnel'),
      name: t('Anthropic dependency', 'Dépendance à Anthropic'),
      probability: 3,
      impact: 3,
      score: 9,
      severity: t('Medium', 'Moyen'),
      description: t(
        'Core AI engine depends entirely on Anthropic Claude. Current cost ~€1.80/practitioner/month. If Anthropic raises prices 3-5x (as OpenAI has done), AI costs become 20-30% of ARPU. No fallback AI provider implemented. Switching AI providers requires rewriting prompt engineering and clinical safety guardrails.',
        'Le moteur IA principal dépend entièrement d\'Anthropic Claude. Coût actuel ~1,80 €/praticien/mois. Si Anthropic augmente les prix de 3 à 5x (comme OpenAI l\'a fait), les coûts IA représenteraient 20-30 % de l\'ARPU. Aucun fournisseur IA de secours implémenté. Changer de fournisseur IA nécessite de réécrire le prompt engineering et les garde-fous de sécurité clinique.'
      ),
      earlyWarnings: [
        t('Anthropic announces pricing changes or removes current tier', 'Anthropic annonce des changements de tarifs ou supprime le palier actuel'),
        t('Claude API latency exceeds 3 seconds consistently', 'La latence de l\'API Claude dépasse systématiquement 3 secondes'),
        t('Anthropic deprecates Haiku model without equivalent replacement', 'Anthropic déprécie le modèle Haiku sans remplacement équivalent'),
        t('AI costs per practitioner trending above €3/month', 'Les coûts IA par praticien dépassent la tendance de 3 €/mois'),
      ],
      mitigation: t(
        'Implement model abstraction layer by Month 4: standardized interface that routes between Claude, GPT-4, and Mistral based on task complexity. Use Claude Haiku for routine tasks (notes, summaries), Claude Sonnet for complex analysis (pattern detection). Pre-build prompt templates for OpenAI and Mistral as failover. Monitor cost per API call daily.',
        'Implémenter une couche d\'abstraction de modèle d\'ici le Mois 4 : interface standardisée routant entre Claude, GPT-4 et Mistral selon la complexité de la tâche. Utiliser Claude Haiku pour les tâches courantes (notes, résumés), Claude Sonnet pour l\'analyse complexe (détection de schémas). Préparer des modèles de prompts pour OpenAI et Mistral en secours. Surveiller le coût par appel API quotidiennement.'
      ),
      contingency: t(
        'If Anthropic costs spike: immediately activate Mistral/Llama fallback for 60-70% of non-critical AI calls. Renegotiate with Anthropic for startup pricing. If API becomes unreliable: migrate to self-hosted Mistral Large within 2-4 weeks. Temporarily reduce AI features to essentials (notes generation only) while migrating.',
        'Si les coûts Anthropic augmentent brusquement : activer immédiatement le fallback Mistral/Llama pour 60-70 % des appels IA non critiques. Renégocier avec Anthropic un tarif startup. Si l\'API devient instable : migrer vers Mistral Large auto-hébergé en 2-4 semaines. Réduire temporairement les fonctionnalités IA à l\'essentiel (génération de notes uniquement) pendant la migration.'
      ),
    },
    {
      id: 'R6',
      category: t('Operational', 'Opérationnel'),
      name: t('Product-market fit not reached', 'Product-market fit non atteint'),
      probability: 3,
      impact: 5,
      score: 15,
      severity: t('Critical', 'Critique'),
      description: t(
        'The core hypothesis — that practitioners will pay €25/month for a between-session care platform — is unvalidated with revenue. Interview validation (187 conversations) shows interest, but stated preference ≠ purchasing behavior. Woebot had 5+ RCTs and still failed commercially. The gap between "this is interesting" and "I will pay monthly" remains uncrossed.',
        'L\'hypothèse centrale — que les praticiens paieront 25 €/mois pour une plateforme de suivi inter-séances — n\'est pas validée par des revenus. La validation par entretiens (187 conversations) montre de l\'intérêt, mais préférence déclarée ≠ comportement d\'achat. Woebot avait 5+ essais cliniques randomisés et a échoué commercialement. L\'écart entre « c\'est intéressant » et « je paierai mensuellement » reste à franchir.'
      ),
      earlyWarnings: [
        t('Monthly churn exceeding 8% after first 3 months', 'Taux d\'attrition mensuel supérieur à 8 % après les 3 premiers mois'),
        t('NPS score below 30 among active practitioners', 'Score NPS inférieur à 30 parmi les praticiens actifs'),
        t('Less than 40% of practitioners actively use between-session features', 'Moins de 40 % des praticiens utilisent activement les fonctionnalités inter-séances'),
        t('Practitioners using only AI notes but not the member engagement layer', 'Les praticiens n\'utilisent que les notes IA, pas la couche d\'engagement membre'),
      ],
      mitigation: t(
        'Launch with minimum viable product focused on the single highest-value workflow: AI-assisted session notes + member engagement summary. Measure PMF quantitatively: track Sean Ellis "very disappointed" survey (target >40%). Implement weekly practitioner feedback loops. Build usage analytics dashboard to identify which features drive retention vs. which are ignored.',
        'Lancer avec un produit minimum viable centré sur le flux de travail à plus forte valeur : notes de séance assistées par IA + résumé d\'engagement membre. Mesurer le PMF quantitativement : suivre l\'enquête Sean Ellis « très déçu » (objectif >40 %). Mettre en place des boucles de retour praticien hebdomadaires. Développer un tableau de bord analytique pour identifier quelles fonctionnalités favorisent la rétention et lesquelles sont ignorées.'
      ),
      contingency: t(
        'If PMF not reached by Month 9: pivot options include (1) pure AI scribe tool (remove member app, compete on notes quality), (2) B2B enterprise wellness platform (sell to group practices and clinics), (3) training institute licensing (Bloomsline as learning tool). Each pivot preserves core technology while changing distribution and business model.',
        'Si le PMF n\'est pas atteint au Mois 9 : options de pivot incluant (1) outil de scribe IA pur (supprimer l\'app membre, concurrencer sur la qualité des notes), (2) plateforme B2B bien-être en entreprise (vendre aux cabinets de groupe et cliniques), (3) licence pour instituts de formation (Bloomsline comme outil pédagogique). Chaque pivot préserve la technologie de base tout en modifiant la distribution et le modèle économique.'
      ),
    },
    {
      id: 'R7',
      category: t('Financial', 'Financier'),
      name: t('Seed raise falls short', 'Levée de seed insuffisante'),
      probability: 3,
      impact: 4,
      score: 12,
      severity: t('High', 'Élevé'),
      description: t(
        'Target: €250K-€400K pre-seed. EU health-tech seed funding declined 15% in 2024. If only €200K-€250K raised, runway shortens to 23-29 months and key hires (engineer, clinical advisor) may be delayed. Pre-revenue companies face heightened investor skepticism. French startup funding concentrated in Paris networks.',
        'Objectif : 250 K€-400 K€ en pré-seed. Le financement seed en health-tech UE a diminué de 15 % en 2024. Si seulement 200 K€-250 K€ sont levés, le runway se réduit à 23-29 mois et les recrutements clés (ingénieur, conseiller clinique) pourraient être retardés. Les entreprises pré-revenu font face à un scepticisme accru des investisseurs. Le financement des startups françaises est concentré dans les réseaux parisiens.'
      ),
      earlyWarnings: [
        t('Investor meetings converting below 20% to follow-up', 'Taux de conversion des réunions investisseurs en suivi inférieur à 20 %'),
        t('Term sheet negotiations stalling on valuation', 'Négociations de term sheet bloquées sur la valorisation'),
        t('Fundraise extending beyond 3 months', 'Levée de fonds s\'étendant au-delà de 3 mois'),
        t('Key target investors passing due to pre-revenue risk', 'Investisseurs cibles clés refusant en raison du risque pré-revenu'),
      ],
      mitigation: t(
        'Build fundraise pipeline of 40+ investors (mix of French angels, EU health-tech VCs, Bpifrance). Lead with unit economics story: €50 CAC, 25-50x LTV/CAC, 90% gross margin. Target French public grants (Bpifrance Bourse French Tech: €30K non-dilutive, La French Tech Tremplin). Set minimum viable raise at €250K with clear milestone plan. Close seed within 3 months to minimize distraction.',
        'Constituer un pipeline de 40+ investisseurs (mix d\'angels français, VCs health-tech UE, Bpifrance). Mener avec l\'histoire de l\'unit economics : 50 € de CAC, LTV/CAC de 25-50x, marge brute de 90 %. Cibler les subventions publiques françaises (Bpifrance Bourse French Tech : 30 K€ non dilutif, La French Tech Tremplin). Fixer la levée minimum viable à 250 K€ avec un plan de jalons clair. Clôturer le seed en 3 mois pour minimiser les distractions.'
      ),
      contingency: t(
        'If raise falls short: accept lower amount and adjust milestones accordingly. Reduce burn to €6K/month (no engineering hire, founder-only for 6 months longer). Pursue Bpifrance grants aggressively (€30-50K non-dilutive). Consider revenue-based financing if initial traction exists. Bridge with convertible notes from angel investors while building traction for larger seed.',
        'Si la levée est insuffisante : accepter un montant inférieur et ajuster les jalons en conséquence. Réduire le burn à 6 K€/mois (pas de recrutement ingénieur, fondateurs seuls pour 6 mois de plus). Poursuivre agressivement les subventions Bpifrance (30-50 K€ non dilutif). Envisager un financement basé sur les revenus si la traction initiale existe. Faire un bridge avec des obligations convertibles d\'angels tout en développant la traction pour un seed plus important.'
      ),
    },
    {
      id: 'R8',
      category: t('Financial', 'Financier'),
      name: t('Churn exceeds 8%', 'L\'attrition dépasse 8 %'),
      probability: 3,
      impact: 4,
      score: 12,
      severity: t('High', 'Élevé'),
      description: t(
        'Model assumes 5% monthly churn. At €25/month with monthly billing, switching cost is near zero. If churn reaches 8-12%, LTV drops from €500 to €208-€312, LTV/CAC ratio drops below 10x, and growth becomes a treadmill — every new practitioner just replaces a churned one. SaaS median churn for SMB is 3-7% monthly.',
        'Le modèle suppose une attrition mensuelle de 5 %. À 25 €/mois en facturation mensuelle, le coût de changement est quasi nul. Si l\'attrition atteint 8-12 %, la LTV chute de 500 € à 208-312 €, le ratio LTV/CAC passe sous 10x, et la croissance devient un tapis roulant — chaque nouveau praticien remplace simplement un praticien perdu. La médiane SaaS pour les PME est de 3-7 % mensuel.'
      ),
      earlyWarnings: [
        t('Monthly churn trending above 6% for 2 consecutive months', 'Attrition mensuelle tendant au-dessus de 6 % pendant 2 mois consécutifs'),
        t('Practitioner engagement declining after Month 2 of subscription', 'Engagement des praticiens en baisse après le Mois 2 d\'abonnement'),
        t('Support tickets mentioning "not using it enough"', 'Tickets de support mentionnant « je ne l\'utilise pas assez »'),
        t('Practitioners subscribing but not inviting members to the platform', 'Praticiens abonnés mais n\'invitant pas de membres sur la plateforme'),
      ],
      mitigation: t(
        'Build data-driven retention from Day 1. Track "activation score": practitioner generates first AI note (Day 1), invites first member (Week 1), member completes first between-session activity (Week 2). Implement proactive outreach when engagement drops. Build annual billing option with 20% discount (reduces churn to 2-3% monthly equivalent). Create "Bloomsline Champions" community for power users.',
        'Construire une rétention basée sur les données dès le Jour 1. Suivre le « score d\'activation » : le praticien génère sa première note IA (Jour 1), invite son premier membre (Semaine 1), le membre complète sa première activité inter-séances (Semaine 2). Mettre en place une relance proactive lorsque l\'engagement baisse. Proposer une facturation annuelle avec 20 % de réduction (réduit l\'attrition à 2-3 % mensuel équivalent). Créer une communauté « Champions Bloomsline » pour les utilisateurs avancés.'
      ),
      contingency: t(
        'If churn exceeds 8%: conduct exit interviews to identify root cause. If value gap: enhance core features rapidly. If pricing issue: test lower price point (€19/month) or usage-based pricing. If activation issue: redesign onboarding with white-glove support for first 30 days. If structural: consider pivot to annual contracts with group practices (lower churn, higher commitment).',
        'Si l\'attrition dépasse 8 % : mener des entretiens de sortie pour identifier la cause. Si écart de valeur : améliorer rapidement les fonctionnalités clés. Si problème de prix : tester un prix inférieur (19 €/mois) ou une tarification à l\'usage. Si problème d\'activation : repenser l\'onboarding avec un accompagnement dédié pendant 30 jours. Si structurel : envisager un pivot vers des contrats annuels avec les cabinets de groupe (attrition plus faible, engagement plus fort).'
      ),
    },
    {
      id: 'R9',
      category: t('Financial', 'Financier'),
      name: t('Series A gap', 'Fossé vers la Série A'),
      probability: 3,
      impact: 5,
      score: 15,
      severity: t('Critical', 'Critique'),
      description: t(
        'Series A requires €80-100K MRR, 200+ practitioners, <5% churn, and a clear path to €1M ARR. Median time from seed to Series A in EU health-tech is 18-24 months. If seed-stage milestones aren\'t hit (50 practitioners by Month 6, 120 by Month 12), Series A timeline extends or becomes impossible. Funding winter could coincide with fundraise window.',
        'La Série A nécessite 80-100 K€ de MRR, 200+ praticiens, <5 % d\'attrition et un chemin clair vers 1 M€ d\'ARR. Le délai médian du seed à la Série A en health-tech UE est de 18-24 mois. Si les jalons du seed ne sont pas atteints (50 praticiens au Mois 6, 120 au Mois 12), le calendrier de Série A s\'allonge ou devient impossible. L\'hiver du financement pourrait coïncider avec la fenêtre de levée.'
      ),
      earlyWarnings: [
        t('Practitioner count below 30 at Month 6', 'Nombre de praticiens inférieur à 30 au Mois 6'),
        t('MRR growth flattening below 15% MoM', 'Croissance du MRR stagnant sous 15 % MoM'),
        t('EU health-tech Series A deals declining in volume', 'Volume des opérations Série A en health-tech UE en baisse'),
        t('Key metrics (churn, NPS, engagement) not at benchmark levels', 'Métriques clés (attrition, NPS, engagement) en dessous des niveaux de référence'),
      ],
      mitigation: t(
        'Begin Series A networking at Month 9 — don\'t wait until Month 15+. Target EU-focused health-tech funds: Heal Capital, Partech Health, Digital Health Ventures, Elaia. Build investor update cadence from Day 1 (monthly updates to seed investors + prospective Series A leads). Set internal milestone: if <50 practitioners at Month 9, evaluate bridge round or strategic alternatives.',
        'Commencer le réseautage Série A au Mois 9 — ne pas attendre le Mois 15+. Cibler les fonds health-tech européens : Heal Capital, Partech Health, Digital Health Ventures, Elaia. Établir un rythme de mises à jour investisseurs dès le Jour 1 (mises à jour mensuelles aux investisseurs seed + prospects Série A). Fixer un jalon interne : si <50 praticiens au Mois 9, évaluer un bridge round ou des alternatives stratégiques.'
      ),
      contingency: t(
        'If Series A not achievable by Month 18: pursue bridge round (€150-200K from existing investors) to extend runway 6-9 months. Apply for Bpifrance innovation grants (€50-100K). Explore strategic investment from complementary health-tech company. If all funding options exhausted: evaluate acqui-hire offers from larger platforms (SimplePractice, Doctolib) that value the team and technology.',
        'Si la Série A n\'est pas réalisable au Mois 18 : poursuivre un bridge round (150-200 K€ des investisseurs existants) pour prolonger le runway de 6-9 mois. Candidater aux subventions d\'innovation Bpifrance (50-100 K€). Explorer l\'investissement stratégique d\'une entreprise health-tech complémentaire. Si toutes les options de financement sont épuisées : évaluer les offres d\'acqui-hire de plateformes plus grandes (SimplePractice, Doctolib) qui valorisent l\'équipe et la technologie.'
      ),
    },
    {
      id: 'R10',
      category: t('Regulatory', 'Réglementaire'),
      name: t('HDS certification mandate', 'Obligation de certification HDS'),
      probability: 3,
      impact: 4,
      score: 12,
      severity: t('High', 'Élevé'),
      description: t(
        'France may require HDS (Hébergeur de Données de Santé) certification for platforms storing mental health data. Supabase is not HDS-certified. Migration to OVHcloud, Scalingo, or Clever Cloud would cost 3-6 months of engineering time and increase infrastructure costs 2-3x. HDS audit itself costs €15-30K and takes 6-12 months.',
        'La France pourrait exiger la certification HDS (Hébergeur de Données de Santé) pour les plateformes stockant des données de santé mentale. Supabase n\'est pas certifié HDS. La migration vers OVHcloud, Scalingo ou Clever Cloud coûterait 3-6 mois d\'ingénierie et augmenterait les coûts d\'infrastructure de 2-3x. L\'audit HDS lui-même coûte 15-30 K€ et prend 6-12 mois.'
      ),
      earlyWarnings: [
        t('CNIL issues guidance classifying therapy notes as "health data" requiring HDS', 'La CNIL publie des directives classifiant les notes de thérapie comme « données de santé » nécessitant le HDS'),
        t('Competitor advertises HDS certification as differentiator', 'Un concurrent met en avant la certification HDS comme différenciateur'),
        t('French professional association recommends HDS-certified platforms only', 'Une association professionnelle française recommande uniquement les plateformes certifiées HDS'),
        t('Insurance companies require HDS for reimbursement integration', 'Les assurances exigent le HDS pour l\'intégration du remboursement'),
      ],
      mitigation: t(
        'Consult HDS specialist by Month 3 to clarify current obligations. Build database abstraction layer that makes infrastructure portable. Pre-evaluate OVHcloud Managed PostgreSQL and Scalingo as migration targets. Maintain strict data separation (personal data vs. usage data) to minimize scope of any HDS requirement. Budget €30K for HDS compliance in Series A plan.',
        'Consulter un spécialiste HDS d\'ici le Mois 3 pour clarifier les obligations actuelles. Construire une couche d\'abstraction de base de données rendant l\'infrastructure portable. Pré-évaluer OVHcloud Managed PostgreSQL et Scalingo comme cibles de migration. Maintenir une séparation stricte des données (données personnelles vs données d\'usage) pour minimiser le périmètre de toute exigence HDS. Budgéter 30 K€ pour la conformité HDS dans le plan Série A.'
      ),
      contingency: t(
        'If HDS becomes mandatory: execute pre-planned migration to OVHcloud (3-month timeline). Use managed PostgreSQL to minimize code changes. Apply for interim exemption while migration is in progress. If timeline is aggressive: partner with HDS-certified hosting provider and co-locate Supabase-compatible infrastructure.',
        'Si le HDS devient obligatoire : exécuter la migration pré-planifiée vers OVHcloud (calendrier de 3 mois). Utiliser PostgreSQL managé pour minimiser les changements de code. Demander une exemption temporaire pendant la migration. Si le calendrier est serré : s\'associer à un hébergeur certifié HDS et co-localiser une infrastructure compatible Supabase.'
      ),
    },
    {
      id: 'R11',
      category: t('Regulatory', 'Réglementaire'),
      name: t('EU AI Act high-risk classification', 'Classification haut risque par l\'AI Act européen'),
      probability: 2,
      impact: 4,
      score: 8,
      severity: t('Medium', 'Moyen'),
      description: t(
        'EU AI Act (effective August 2026) may classify mental health AI as high-risk, requiring conformity assessments, ongoing monitoring, documentation, and transparency obligations. Compliance costs estimated at €50-100K for startups. If Bloom AI is classified as a medical device, the regulatory burden multiplies significantly.',
        'L\'AI Act européen (en vigueur août 2026) pourrait classer l\'IA en santé mentale comme haut risque, nécessitant des évaluations de conformité, une surveillance continue, de la documentation et des obligations de transparence. Les coûts de conformité sont estimés à 50-100 K€ pour les startups. Si Bloom AI est classé comme dispositif médical, la charge réglementaire se multiplie considérablement.'
      ),
      earlyWarnings: [
        t('EU Commission guidance explicitly lists therapy AI tools as high-risk', 'La Commission européenne liste explicitement les outils IA de thérapie comme haut risque'),
        t('Competitor receives non-compliance notice for mental health AI features', 'Un concurrent reçoit un avis de non-conformité pour ses fonctionnalités IA en santé mentale'),
        t('Insurance companies require AI Act certification for coverage', 'Les assurances exigent la certification AI Act pour la couverture'),
        t('Professional associations issue warnings about non-compliant AI tools', 'Les associations professionnelles émettent des avertissements sur les outils IA non conformes'),
      ],
      mitigation: t(
        'Position Bloom AI as "practitioner decision support" (lighter regulatory pathway than autonomous clinical AI). Begin AI Act documentation by Month 6: data governance, risk management, human oversight, transparency. Engage EU AI Act compliance consultant (€5-10K) by Month 8. Build audit trail: every AI output logged, attributed, and reviewable by the practitioner.',
        'Positionner Bloom AI comme « aide à la décision du praticien » (voie réglementaire plus légère que l\'IA clinique autonome). Commencer la documentation AI Act au Mois 6 : gouvernance des données, gestion des risques, supervision humaine, transparence. Engager un consultant conformité AI Act (5-10 K€) au Mois 8. Construire une piste d\'audit : chaque sortie IA enregistrée, attribuée et vérifiable par le praticien.'
      ),
      contingency: t(
        'If classified as high-risk: allocate €50K from Series A funding for conformity assessment. Implement enhanced human-in-the-loop workflows (all AI outputs require practitioner review before sharing with members). If medical device classification: evaluate DiGA pathway in Germany as a strategic pivot that turns compliance cost into reimbursement revenue.',
        'Si classé haut risque : allouer 50 K€ du financement Série A pour l\'évaluation de conformité. Implémenter des workflows renforcés avec humain dans la boucle (toutes les sorties IA nécessitent une validation du praticien avant partage avec les membres). Si classé dispositif médical : évaluer la voie DiGA en Allemagne comme pivot stratégique transformant le coût de conformité en revenus de remboursement.'
      ),
    },
    {
      id: 'R12',
      category: t('Regulatory', 'Réglementaire'),
      name: t('CNIL investigation', 'Enquête de la CNIL'),
      probability: 2,
      impact: 4,
      score: 8,
      severity: t('Medium', 'Moyen'),
      description: t(
        'CNIL (French data protection authority) has increased enforcement actions by 40% since 2023, with specific focus on health data and AI. A complaint from a single practitioner or member could trigger an investigation. Non-compliance penalties up to €20M or 4% of annual turnover. Even an investigation without finding generates negative publicity.',
        'La CNIL (autorité française de protection des données) a augmenté ses actions répressives de 40 % depuis 2023, avec un focus spécifique sur les données de santé et l\'IA. Une plainte d\'un seul praticien ou membre pourrait déclencher une enquête. Pénalités de non-conformité jusqu\'à 20 M€ ou 4 % du chiffre d\'affaires annuel. Même une enquête sans résultat génère de la publicité négative.'
      ),
      earlyWarnings: [
        t('CNIL publishes guidance targeting health-tech AI specifically', 'La CNIL publie des directives ciblant spécifiquement l\'IA health-tech'),
        t('Competitor receives CNIL sanction for similar data processing', 'Un concurrent reçoit une sanction CNIL pour un traitement de données similaire'),
        t('User complaint about data handling reaches regulatory channel', 'Une plainte utilisateur concernant le traitement des données atteint le canal réglementaire'),
        t('CNIL announces sector-wide audit of health-tech startups', 'La CNIL annonce un audit sectoriel des startups health-tech'),
      ],
      mitigation: t(
        'GDPR compliance by design: DPO appointment (can be founder initially), DPIA for all AI features, explicit consent flows, data portability API, right-to-deletion automation. Conduct internal GDPR audit by Month 4. Maintain Article 30 records of processing. Implement data retention policies (auto-delete after account closure + 30 days). Use EU-only analytics (PostHog self-hosted).',
        'Conformité RGPD dès la conception : nomination d\'un DPO (peut être un fondateur initialement), AIPD pour toutes les fonctionnalités IA, flux de consentement explicites, API de portabilité des données, automatisation du droit à l\'effacement. Mener un audit RGPD interne d\'ici le Mois 4. Tenir les registres de traitement Article 30. Implémenter des politiques de rétention des données (suppression automatique après clôture du compte + 30 jours). Utiliser des outils analytiques uniquement UE (PostHog auto-hébergé).'
      ),
      contingency: t(
        'If CNIL contacts: respond within 72 hours (regulatory obligation). Engage GDPR lawyer immediately (budget €5-10K). Demonstrate proactive compliance measures: DPO, DPIA, audit trail, consent records. If sanction imposed: remediate within prescribed timeline and communicate transparently to users. Consider CNIL\'s "sandbox" program for AI health innovation.',
        'Si la CNIL nous contacte : répondre dans les 72 heures (obligation réglementaire). Engager immédiatement un avocat RGPD (budget 5-10 K€). Démontrer des mesures de conformité proactives : DPO, AIPD, piste d\'audit, registres de consentement. Si sanction imposée : remédier dans le délai prescrit et communiquer de manière transparente aux utilisateurs. Envisager le programme « bac à sable » de la CNIL pour l\'innovation IA en santé.'
      ),
    },
    {
      id: 'R13',
      category: t('Reputational', 'Réputationnel'),
      name: t('AI safety incident', 'Incident de sécurité IA'),
      probability: 2,
      impact: 5,
      score: 10,
      severity: t('High', 'Élevé'),
      description: t(
        'Bloom AI interacts with vulnerable populations (mental health clients). A single harmful AI output — inappropriate advice during a crisis, clinical misinformation, or privacy breach — could generate media coverage, practitioner exodus, and regulatory scrutiny. The Tessa chatbot incident (National Eating Disorders Association, 2023) showed how quickly AI mental health failures become national news.',
        'Bloom AI interagit avec des populations vulnérables (patients en santé mentale). Une seule sortie IA nuisible — conseil inapproprié en situation de crise, désinformation clinique ou violation de la vie privée — pourrait générer une couverture médiatique, un exode des praticiens et un examen réglementaire. L\'incident du chatbot Tessa (National Eating Disorders Association, 2023) a montré la rapidité avec laquelle les défaillances IA en santé mentale deviennent des nouvelles nationales.'
      ),
      earlyWarnings: [
        t('AI generating responses that bypass safety guardrails in testing', 'L\'IA génère des réponses contournant les garde-fous de sécurité lors des tests'),
        t('User reports of inappropriate AI suggestions', 'Signalements d\'utilisateurs concernant des suggestions IA inappropriées'),
        t('Edge case discovered where AI provides clinical advice beyond its scope', 'Cas limite découvert où l\'IA fournit des conseils cliniques au-delà de son périmètre'),
        t('Increased latency or errors in AI safety filter pipeline', 'Latence accrue ou erreurs dans le pipeline de filtrage de sécurité IA'),
      ],
      mitigation: t(
        'Multi-layer safety system from Day 1: (1) crisis keyword detection → immediate escalation to emergency resources, (2) clinical boundary enforcement — AI never diagnoses, prescribes, or contradicts practitioner guidance, (3) content filtering for self-harm, suicidal ideation, abuse disclosure, (4) practitioner review required for all AI-generated care plans. Monthly red-team testing of safety systems. Publish AI safety principles publicly.',
        'Système de sécurité multicouche dès le Jour 1 : (1) détection de mots-clés de crise → escalade immédiate vers les ressources d\'urgence, (2) respect des limites cliniques — l\'IA ne diagnostique jamais, ne prescrit pas et ne contredit pas les directives du praticien, (3) filtrage de contenu pour l\'automutilation, les idées suicidaires, les révélations d\'abus, (4) validation du praticien requise pour tous les plans de soins générés par IA. Tests red team mensuels des systèmes de sécurité. Publication publique des principes de sécurité IA.'
      ),
      contingency: t(
        'If incident occurs: activate crisis protocol within 1 hour — disable affected AI feature, notify all affected users, issue public statement acknowledging the issue. Engage crisis communications specialist (pre-identified, not scrambled). Report to CNIL within 72 hours if personal data involved. Conduct root cause analysis and publish findings. Consider temporary AI feature suspension while implementing fixes.',
        'En cas d\'incident : activer le protocole de crise dans l\'heure — désactiver la fonctionnalité IA affectée, notifier tous les utilisateurs concernés, publier un communiqué reconnaissant le problème. Mobiliser un spécialiste en communication de crise (pré-identifié, pas improvisé). Signaler à la CNIL dans les 72 heures si des données personnelles sont impliquées. Mener une analyse des causes profondes et publier les conclusions. Envisager une suspension temporaire des fonctionnalités IA pendant la mise en place des correctifs.'
      ),
    },
    {
      id: 'R14',
      category: t('Reputational', 'Réputationnel'),
      name: t('Data breach', 'Violation de données'),
      probability: 1,
      impact: 5,
      score: 5,
      severity: t('Medium', 'Moyen'),
      description: t(
        'Mental health data is among the most sensitive personal data categories. A breach exposing therapy notes, session recordings, or member engagement data would be catastrophic for trust. GDPR mandates 72-hour breach notification. Healthcare data breaches average $10.9M in damages (IBM, 2023). Even a minor breach at a small startup generates outsized coverage in health-tech media.',
        'Les données de santé mentale font partie des catégories de données personnelles les plus sensibles. Une violation exposant les notes de thérapie, les enregistrements de séance ou les données d\'engagement des membres serait catastrophique pour la confiance. Le RGPD impose une notification de violation sous 72 heures. Les violations de données de santé coûtent en moyenne 10,9 M$ de dommages (IBM, 2023). Même une violation mineure chez une petite startup génère une couverture disproportionnée dans les médias health-tech.'
      ),
      earlyWarnings: [
        t('Penetration test reveals critical vulnerability', 'Un test d\'intrusion révèle une vulnérabilité critique'),
        t('Unusual database access patterns detected', 'Schémas d\'accès inhabituels détectés dans la base de données'),
        t('Third-party dependency announces security vulnerability', 'Une dépendance tierce annonce une vulnérabilité de sécurité'),
        t('Supabase announces a security incident affecting shared infrastructure', 'Supabase annonce un incident de sécurité affectant l\'infrastructure partagée'),
      ],
      mitigation: t(
        'Defense in depth: AES-256-GCM encryption at rest, TLS 1.3 in transit, Row Level Security on every Supabase table, least-privilege API keys. Conduct penetration test by Month 6 (budget €3-5K). Implement real-time anomaly detection on database access patterns. Enable Supabase audit logging. Security-focused code review for every PR. SOC 2 Type I by Month 12.',
        'Défense en profondeur : chiffrement AES-256-GCM au repos, TLS 1.3 en transit, Row Level Security sur chaque table Supabase, clés API à moindre privilège. Réaliser un test d\'intrusion d\'ici le Mois 6 (budget 3-5 K€). Implémenter la détection d\'anomalies en temps réel sur les schémas d\'accès à la base de données. Activer la journalisation d\'audit Supabase. Revue de code axée sécurité pour chaque PR. SOC 2 Type I d\'ici le Mois 12.'
      ),
      contingency: t(
        'If breach detected: activate incident response plan — isolate affected systems within 30 minutes, assess scope within 4 hours, notify CNIL within 72 hours, notify affected users within 96 hours. Engage forensic security firm (pre-identified). Offer affected users credit monitoring. Publish transparent post-mortem. Implement additional security measures and undergo independent security audit.',
        'Si une violation est détectée : activer le plan de réponse aux incidents — isoler les systèmes affectés en 30 minutes, évaluer le périmètre en 4 heures, notifier la CNIL en 72 heures, notifier les utilisateurs affectés en 96 heures. Engager une société de sécurité forensique (pré-identifiée). Offrir un suivi de crédit aux utilisateurs affectés. Publier un post-mortem transparent. Mettre en place des mesures de sécurité supplémentaires et se soumettre à un audit de sécurité indépendant.'
      ),
    },
    {
      id: 'R15',
      category: t('Reputational', 'Réputationnel'),
      name: t('Practitioner backlash', 'Réactions négatives des praticiens'),
      probability: 2,
      impact: 3,
      score: 6,
      severity: t('Medium', 'Moyen'),
      description: t(
        'Mental health professionals are protective of the therapeutic alliance and skeptical of technology intermediation. 45% of therapists express concerns about AI in clinical settings (APA 2024). If Bloomsline is perceived as "replacing the therapist" or "commoditizing care," professional associations could actively discourage adoption.',
        'Les professionnels de la santé mentale protègent l\'alliance thérapeutique et sont sceptiques face à l\'intermédiation technologique. 45 % des thérapeutes expriment des inquiétudes concernant l\'IA en milieu clinique (APA 2024). Si Bloomsline est perçu comme « remplaçant le thérapeute » ou « banalisant les soins », les associations professionnelles pourraient activement décourager l\'adoption.'
      ),
      earlyWarnings: [
        t('Negative social media posts from influential practitioners', 'Publications négatives sur les réseaux sociaux de praticiens influents'),
        t('Professional association publishes guidance warning against AI therapy tools', 'Une association professionnelle publie des recommandations mettant en garde contre les outils IA de thérapie'),
        t('Conference panel discussion frames Bloomsline negatively', 'Une table ronde lors d\'une conférence présente Bloomsline de manière négative'),
        t('Practitioners cancel subscriptions citing ethical concerns', 'Des praticiens annulent leurs abonnements en citant des préoccupations éthiques'),
      ],
      mitigation: t(
        'Messaging discipline: always position as "empowering practitioners" not "replacing therapists." Use language that reinforces practitioner authority: "your AI assistant," "practitioner-controlled," "decision support." Build Clinical Advisory Board with respected practitioners. Sponsor practitioner conferences. Publish thought leadership on ethical AI in therapy. Ensure practitioner controls every AI interaction.',
        'Discipline du message : toujours se positionner comme « renforçant les praticiens » et non « remplaçant les thérapeutes ». Utiliser un langage qui renforce l\'autorité du praticien : « votre assistant IA », « contrôlé par le praticien », « aide à la décision ». Constituer un Comité consultatif clinique avec des praticiens respectés. Sponsoriser des conférences de praticiens. Publier des réflexions sur l\'IA éthique en thérapie. Assurer que le praticien contrôle chaque interaction IA.'
      ),
      contingency: t(
        'If backlash emerges: respond with empathy, not defensiveness. Invite critics to advisory board or beta testing. Publish practitioner testimonials showing enhanced care quality. If specific feature draws criticism: modify or remove it. If association-level opposition: engage leadership directly and propose collaborative guidelines. Consider temporarily removing controversial features to rebuild trust.',
        'Si des réactions négatives émergent : répondre avec empathie, pas sur la défensive. Inviter les critiques au comité consultatif ou aux tests bêta. Publier des témoignages de praticiens montrant l\'amélioration de la qualité des soins. Si une fonctionnalité spécifique attire les critiques : la modifier ou la retirer. En cas d\'opposition au niveau des associations : engager le dialogue directement avec la direction et proposer des lignes directrices collaboratives. Envisager de retirer temporairement les fonctionnalités controversées pour reconstruire la confiance.'
      ),
    },
  ]
}

// ── Scenario data ───────────────────────────────────────────────────────

interface Scenario {
  name: string
  probability: string
  color: string
  borderColor: string
  bgColor: string
  textColor: string
  narrative: string
  revenueImpact: string
  milestones: string[]
  responses: string[]
}

function getScenarios(t: TFn): Scenario[] {
  return [
    {
      name: t('Best Case', 'Meilleur scénario'),
      probability: '15-20%',
      color: 'emerald',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      narrative: t(
        'Strong product-market fit validated within 60 days. 30%+ MoM practitioner growth driven by word-of-mouth through supervision groups and conferences. €500K raised at favorable terms. 200 practitioners by Month 12. Series A at Month 15 at 3-4x step-up. Bloom AI becomes the default between-session tool in French therapy training programs.',
        'Fort product-market fit validé en 60 jours. Croissance 30 %+ MoM des praticiens portée par le bouche-à-oreille via les groupes de supervision et les conférences. 500 K€ levés à des conditions favorables. 200 praticiens au Mois 12. Série A au Mois 15 avec un step-up de 3-4x. Bloom AI devient l\'outil inter-séances par défaut dans les programmes de formation en thérapie français.'
      ),
      revenueImpact: t(
        '€8K MRR by Month 12 — 200 practitioners × €40 blended ARPU',
        '8 K€ de MRR au Mois 12 — 200 praticiens × 40 € d\'ARPU moyen'
      ),
      milestones: [
        t('M3: 30 paying practitioners, <4% churn, NPS >50', 'M3 : 30 praticiens payants, <4 % d\'attrition, NPS >50'),
        t('M6: 80 practitioners, first group practice signed', 'M6 : 80 praticiens, premier cabinet de groupe signé'),
        t('M9: 140 practitioners, Series A conversations started', 'M9 : 140 praticiens, discussions Série A entamées'),
        t('M12: 200 practitioners, €8K MRR, Series A term sheet', 'M12 : 200 praticiens, 8 K€ de MRR, term sheet Série A'),
      ],
      responses: [
        t('Accelerate hiring: second engineer by Month 4, designer by Month 6', 'Accélérer le recrutement : deuxième ingénieur au Mois 4, designer au Mois 6'),
        t('Begin Belgium/Switzerland expansion prep at Month 8', 'Préparer l\'expansion Belgique/Suisse au Mois 8'),
        t('Invest in clinical outcomes measurement for DiGA pathway', 'Investir dans la mesure des résultats cliniques pour la voie DiGA'),
        t('Build enterprise tier for group practices (€20-25/seat/month)', 'Développer une offre entreprise pour les cabinets de groupe (20-25 €/siège/mois)'),
      ],
    },
    {
      name: t('Base Case', 'Scénario de base'),
      probability: '40-50%',
      color: 'blue',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      narrative: t(
        'Moderate PMF — practitioners value AI notes but between-session engagement adoption is slower. 20-25% MoM growth with steady effort. €400K raised after 2-month fundraise. 120 practitioners by Month 12. Series A at Month 18-20 requiring bridge round. Core market is solo French practitioners; group practices take longer to convert.',
        'PMF modéré — les praticiens apprécient les notes IA mais l\'adoption de l\'engagement inter-séances est plus lente. Croissance de 20-25 % MoM avec un effort soutenu. 400 K€ levés après 2 mois de levée. 120 praticiens au Mois 12. Série A au Mois 18-20 nécessitant un bridge round. Le marché principal est celui des praticiens français indépendants ; les cabinets de groupe prennent plus de temps à convertir.'
      ),
      revenueImpact: t(
        '€5K MRR by Month 12 — 120 practitioners × €42 blended ARPU (some annual)',
        '5 K€ de MRR au Mois 12 — 120 praticiens × 42 € d\'ARPU moyen (certains annuels)'
      ),
      milestones: [
        t('M3: 15 paying practitioners, <6% churn, PMF signal emerging', 'M3 : 15 praticiens payants, <6 % d\'attrition, signal PMF émergent'),
        t('M6: 50 practitioners, first AFTCC partnership signed', 'M6 : 50 praticiens, premier partenariat AFTCC signé'),
        t('M9: 85 practitioners, bridge round if needed', 'M9 : 85 praticiens, bridge round si nécessaire'),
        t('M12: 120 practitioners, €5K MRR, Series A prep', 'M12 : 120 praticiens, 5 K€ de MRR, préparation Série A'),
      ],
      responses: [
        t('Focus engineering on retention features: better onboarding, usage nudges', 'Concentrer l\'ingénierie sur les fonctionnalités de rétention : meilleur onboarding, rappels d\'utilisation'),
        t('Double down on content marketing: practitioner blog, case studies', 'Renforcer le marketing de contenu : blog praticien, études de cas'),
        t('Pursue Bpifrance grants to extend runway without dilution', 'Poursuivre les subventions Bpifrance pour étendre le runway sans dilution'),
        t('Begin Series A networking by Month 9 — build relationships early', 'Commencer le réseautage Série A au Mois 9 — établir les relations tôt'),
      ],
    },
    {
      name: t('Worst Case', 'Pire scénario'),
      probability: '20-25%',
      color: 'amber',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      narrative: t(
        'Weak PMF — practitioners sign up for AI notes but churn after 2-3 months. Between-session features underused. 10% MoM growth. €300K raised at less favorable terms. 50 practitioners by Month 12 with 8%+ monthly churn. Product needs significant iteration. Pivot evaluation at Month 9.',
        'PMF faible — les praticiens s\'inscrivent pour les notes IA mais partent après 2-3 mois. Fonctionnalités inter-séances sous-utilisées. Croissance de 10 % MoM. 300 K€ levés à des conditions moins favorables. 50 praticiens au Mois 12 avec une attrition mensuelle de 8 %+. Le produit nécessite une itération significative. Évaluation de pivot au Mois 9.'
      ),
      revenueImpact: t(
        '€2K MRR by Month 12 — 50 practitioners × €40 blended ARPU (high churn offsets growth)',
        '2 K€ de MRR au Mois 12 — 50 praticiens × 40 € d\'ARPU moyen (l\'attrition élevée compense la croissance)'
      ),
      milestones: [
        t('M3: 8 paying practitioners, churn concerning at 7-8%', 'M3 : 8 praticiens payants, attrition préoccupante à 7-8 %'),
        t('M6: 25 practitioners, PMF survey below 30% threshold', 'M6 : 25 praticiens, enquête PMF sous le seuil de 30 %'),
        t('M9: 35 practitioners, pivot evaluation begins', 'M9 : 35 praticiens, début de l\'évaluation de pivot'),
        t('M12: 50 practitioners, decide: iterate, pivot, or wind down', 'M12 : 50 praticiens, décision : itérer, pivoter ou arrêter'),
      ],
      responses: [
        t('Conduct deep customer interviews to identify value gap', 'Mener des entretiens clients approfondis pour identifier l\'écart de valeur'),
        t('Test pricing changes: lower price (€19/mo) or usage-based model', 'Tester des changements de prix : prix inférieur (19 €/mois) ou modèle à l\'usage'),
        t('Evaluate pivot to pure AI scribe tool or B2B enterprise wellness', 'Évaluer un pivot vers un outil scribe IA pur ou B2B bien-être en entreprise'),
        t('Reduce burn to absolute minimum (€5K/month) to extend runway for pivot', 'Réduire le burn au minimum absolu (5 K€/mois) pour étendre le runway du pivot'),
      ],
    },
    {
      name: t('Black Swan', 'Cygne noir'),
      probability: '5-10%',
      color: 'gray',
      borderColor: 'border-gray-300',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      narrative: t(
        'Convergence of catastrophic events: AI safety incident generates media coverage + CNIL launches investigation + EU funding winter deepens. Revenue drops to zero within 60 days as practitioners flee the platform. No fundraise possible in current environment. Existential threat to the company.',
        'Convergence d\'événements catastrophiques : un incident de sécurité IA génère une couverture médiatique + la CNIL lance une enquête + l\'hiver du financement UE s\'approfondit. Les revenus tombent à zéro en 60 jours alors que les praticiens quittent la plateforme. Aucune levée de fonds possible dans l\'environnement actuel. Menace existentielle pour l\'entreprise.'
      ),
      revenueImpact: t(
        'Revenue to zero in 60 days — complete practitioner exodus',
        'Revenus à zéro en 60 jours — exode complet des praticiens'
      ),
      milestones: [
        t('Day 1: AI incident occurs, media coverage begins', 'Jour 1 : L\'incident IA survient, la couverture médiatique commence'),
        t('Week 2: CNIL investigation notice, practitioner cancellations spike', 'Semaine 2 : Avis d\'enquête CNIL, pic d\'annulations des praticiens'),
        t('Month 1: Revenue down 80%, investor sentiment negative', 'Mois 1 : Revenus en baisse de 80 %, sentiment investisseur négatif'),
        t('Month 2: Revenue at zero, emergency board meeting', 'Mois 2 : Revenus à zéro, réunion du conseil d\'urgence'),
      ],
      responses: [
        t('Immediately disable affected AI features — safety over revenue', 'Désactiver immédiatement les fonctionnalités IA affectées — la sécurité avant les revenus'),
        t('Activate crisis communications plan (pre-written templates)', 'Activer le plan de communication de crise (modèles pré-rédigés)'),
        t('Evaluate acqui-hire offers from larger platforms (SimplePractice, Doctolib)', 'Évaluer les offres d\'acqui-hire de plateformes plus grandes (SimplePractice, Doctolib)'),
        t('If no viable path: orderly wind-down — return remaining capital to investors, help team find positions', 'Si aucune voie viable : cessation ordonnée — restituer le capital restant aux investisseurs, aider l\'équipe à trouver des postes'),
      ],
    },
  ]
}

// ── Roadmap data ────────────────────────────────────────────────────────

interface RoadmapPhase {
  phase: string
  period: string
  color: string
  borderColor: string
  bgColor: string
  items: { action: string; owner: string }[]
}

function getRoadmap(t: TFn): RoadmapPhase[] {
  return [
    {
      phase: t('Foundation', 'Fondation'),
      period: 'M0-M6',
      color: 'text-blue-700',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      items: [
        { action: t('Hire first engineer (full-stack, AI experience)', 'Recruter le premier ingénieur (full-stack, expérience IA)'), owner: t('Founders', 'Fondateurs') },
        { action: t('Complete GDPR audit + DPIA for all AI features', 'Finaliser l\'audit RGPD + AIPD pour toutes les fonctionnalités IA'), owner: t('DPO / Legal', 'DPO / Juridique') },
        { action: t('Run PMF pilot with 10-30 practitioners', 'Lancer un pilote PMF avec 10-30 praticiens'), owner: t('Product', 'Produit') },
        { action: t('Implement crisis detection in Bloom AI', 'Implémenter la détection de crise dans Bloom AI'), owner: t('Engineering', 'Ingénierie') },
        { action: t('HDS compliance consultation + action plan', 'Consultation conformité HDS + plan d\'action'), owner: t('Legal', 'Juridique') },
        { action: t('Build automated onboarding (first AI note < 5 min)', 'Développer l\'onboarding automatisé (première note IA < 5 min)'), owner: t('Product', 'Produit') },
        { action: t('Implement AI model abstraction layer', 'Implémenter la couche d\'abstraction de modèle IA'), owner: t('Engineering', 'Ingénierie') },
        { action: t('Conduct first penetration test', 'Réaliser le premier test d\'intrusion'), owner: t('Security', 'Sécurité') },
      ],
    },
    {
      phase: t('Growth', 'Croissance'),
      period: 'M6-M12',
      color: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50',
      items: [
        { action: t('Build churn prediction model from usage data', 'Construire un modèle de prédiction d\'attrition à partir des données d\'usage'), owner: t('Engineering', 'Ingénierie') },
        { action: t('Reach 200+ practitioners (base case: 120)', 'Atteindre 200+ praticiens (scénario de base : 120)'), owner: t('Sales', 'Ventes') },
        { action: t('Begin EU AI Act documentation', 'Commencer la documentation AI Act européen'), owner: t('Compliance', 'Conformité') },
        { action: t('Start Series A networking and investor updates', 'Commencer le réseautage Série A et les mises à jour investisseurs'), owner: t('Founders', 'Fondateurs') },
        { action: t('Establish clinical ethics framework + advisory board', 'Établir le cadre d\'éthique clinique + comité consultatif'), owner: t('Clinical', 'Clinique') },
        { action: t('Apply for Bpifrance innovation grants', 'Candidater aux subventions d\'innovation Bpifrance'), owner: t('Finance', 'Finance') },
      ],
    },
    {
      phase: t('Scale', 'Montée en charge'),
      period: 'M12-M18',
      color: 'text-violet-700',
      borderColor: 'border-violet-200',
      bgColor: 'bg-violet-50',
      items: [
        { action: t('Close Series A or secure bridge round', 'Clôturer la Série A ou sécuriser un bridge round'), owner: t('Founders', 'Fondateurs') },
        { action: t('HDS migration if mandated (OVHcloud / Scalingo)', 'Migration HDS si obligatoire (OVHcloud / Scalingo)'), owner: t('Engineering', 'Ingénierie') },
        { action: t('EU AI Act conformity assessment if classified high-risk', 'Évaluation de conformité AI Act si classé haut risque'), owner: t('Compliance', 'Conformité') },
        { action: t('Pricing review: evaluate €35-45/mo tiers', 'Révision tarifaire : évaluer les paliers à 35-45 €/mois'), owner: t('Product', 'Produit') },
        { action: t('Evaluate pivot if PMF not reached by Month 15', 'Évaluer un pivot si le PMF n\'est pas atteint au Mois 15'), owner: t('Board', 'Conseil') },
      ],
    },
  ]
}

// ── Category labels ──────────────────────────────────────────────────────

function getCategoryLabel(category: string, t: TFn): string {
  const labels: Record<string, string> = {
    Market: t('Market', 'Marché'),
    Operational: t('Operational', 'Opérationnel'),
    Financial: t('Financial', 'Financier'),
    Regulatory: t('Regulatory', 'Réglementaire'),
    Reputational: t('Reputational', 'Réputationnel'),
  }
  return labels[category] || category
}

const CATEGORIES = ['Market', 'Operational', 'Financial', 'Regulatory', 'Reputational']

// ── Page ─────────────────────────────────────────────────────────────────

export default function RiskAnalysisPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const risks = getRisks(t)
  const scenarios = getScenarios(t)
  const roadmap = getRoadmap(t)

  const criticalCount = risks.filter((r) => r.severity === t('Critical', 'Critique')).length
  const highCount = risks.filter((r) => r.severity === t('High', 'Élevé')).length
  const mediumCount = risks.filter((r) => r.severity === t('Medium', 'Moyen')).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">{t('Risk Analysis & Scenario Planning', 'Analyse des risques et planification de scénarios')}</h1>
            <p className="text-[10px] text-gray-400">{t('Bloomsline Care — Investor Risk Report, Q1 2026', 'Bloomsline Care — Rapport de risques investisseur, T1 2026')}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ─────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('15 risks identified. Every one has a plan.', '15 risques identifiés. Chacun a un plan.')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Building in EU health-tech means navigating regulatory complexity, adoption inertia, and funding cycles simultaneously. This report maps every material risk across five categories, models four outcome scenarios, and lays out a phased mitigation roadmap. No risk is unaddressed. The question is not whether risks exist — it\u2019s whether the team has planned for them.',
              'Construire dans la health-tech européenne signifie naviguer simultanément dans la complexité réglementaire, l\'inertie d\'adoption et les cycles de financement. Ce rapport cartographie chaque risque significatif dans cinq catégories, modélise quatre scénarios de résultats et présente une feuille de route d\'atténuation par phases. Aucun risque n\'est sans réponse. La question n\'est pas de savoir si des risques existent — c\'est de savoir si l\'équipe les a anticipés.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">{criticalCount} {t('critical', 'critiques')}</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{highCount} {t('high', 'élevés')}</span>
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">{mediumCount} {t('medium', 'moyens')}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">0 {t('unmitigated', 'sans atténuation')}</span>
          </div>
        </motion.section>

        {/* ── 2. Risk Heat Map ────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('Probability × Impact — 15 risks plotted by severity', 'Probabilité × Impact — 15 risques classés par sévérité')}>{t('Risk Heat Map', 'Carte de chaleur des risques')}</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
            {/* Grid container */}
            <div className="relative">
              {/* Y-axis label */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">
                {t('Impact', 'Impact')}
              </div>

              <div className="ml-6 pt-8">
                {/* Heat map grid */}
                <div className="grid grid-cols-5 gap-px bg-gray-200 rounded-lg">
                  {/* Row by row, top (impact=5) to bottom (impact=1) */}
                  {[5, 4, 3, 2, 1].map((impact) =>
                    [1, 2, 3, 4, 5].map((prob) => {
                      const score = prob * impact
                      const bg =
                        score >= 15 ? 'bg-red-50' :
                        score >= 10 ? 'bg-amber-50' :
                        score >= 5 ? 'bg-yellow-50' :
                        'bg-emerald-50'

                      const risksInCell = risks.filter(
                        (r) => r.probability === prob && r.impact === impact
                      )

                      const corner =
                        impact === 5 && prob === 1 ? 'rounded-tl-lg' :
                        impact === 5 && prob === 5 ? 'rounded-tr-lg' :
                        impact === 1 && prob === 1 ? 'rounded-bl-lg' :
                        impact === 1 && prob === 5 ? 'rounded-br-lg' : ''

                      return (
                        <div
                          key={`${prob}-${impact}`}
                          className={`${bg} ${corner} min-h-[52px] sm:min-h-[60px] p-1.5 flex flex-wrap items-center justify-center gap-1 relative`}
                        >
                          {risksInCell.map((r) => {
                            const dotColor = CATEGORY_CONFIG[r.category]?.dotColor || CATEGORY_CONFIG[Object.keys(CATEGORY_CONFIG).find(k => getCategoryLabel(k, t) === r.category) || '']?.dotColor || 'bg-gray-400'
                            return (
                              <div key={r.id} className="group relative">
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${dotColor} border-2 border-white shadow-sm flex items-center justify-center cursor-default`}>
                                  <span className="text-[7px] sm:text-[8px] font-bold text-white">{r.id.slice(1)}</span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20">
                                  <div className="bg-gray-900 text-white text-[9px] px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                                    {r.id}: {r.name}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* X-axis labels */}
                <div className="grid grid-cols-5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <div key={p} className="text-center text-[9px] text-gray-400">{p}</div>
                  ))}
                </div>
                <p className="text-center text-[9px] font-semibold text-gray-400 tracking-wider uppercase mt-1">{t('Probability', 'Probabilité')}</p>
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-6 top-8 bottom-6 flex flex-col justify-around pointer-events-none">
                {[5, 4, 3, 2, 1].map((i) => (
                  <div key={i} className="text-[9px] text-gray-400 -ml-4 text-right w-3">{i}</div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
              {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
                  <span className="text-[9px] text-gray-500">{getCategoryLabel(cat, t)}</span>
                </div>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-emerald-50 border border-emerald-200" /><span className="text-[8px] text-gray-400">{t('Low', 'Faible')}</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-yellow-50 border border-yellow-200" /><span className="text-[8px] text-gray-400">{t('Med', 'Moy')}</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-amber-50 border border-amber-200" /><span className="text-[8px] text-gray-400">{t('High', 'Élevé')}</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-red-50 border border-red-200" /><span className="text-[8px] text-gray-400">{t('Critical', 'Critique')}</span></div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 3. Risk Register ────────────────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle={t('All 15 risks ranked by severity score (Probability × Impact)', 'Les 15 risques classés par score de sévérité (Probabilité × Impact)')}>{t('Risk Register', 'Registre des risques')}</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{t('Category', 'Catégorie')}</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{t('Risk', 'Risque')}</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">P</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">I</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">Score</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{t('Severity', 'Sévérité')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...risks].sort((a, b) => b.score - a.score).map((risk, i) => (
                    <tr key={risk.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5 text-[10px] font-mono font-bold text-gray-700">{risk.id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_CONFIG[Object.keys(CATEGORY_CONFIG).find(k => getCategoryLabel(k, t) === risk.category) || '']?.color || ''}`}>
                          {risk.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-700 font-medium">{risk.name}</td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-600 text-center font-mono">{risk.probability}</td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-600 text-center font-mono">{risk.impact}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[10px] font-bold ${
                          risk.score >= 15 ? 'text-red-600' :
                          risk.score >= 10 ? 'text-amber-600' :
                          risk.score >= 5 ? 'text-yellow-600' :
                          'text-emerald-600'
                        }`}>
                          {risk.score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><SeverityBadge severity={risk.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* ── 4. Detailed Risk Cards ─────────────────────────── */}
        {CATEGORIES.map((category, ci) => {
          const categoryRisks = risks.filter((r) => r.category === getCategoryLabel(category, t))
          const config = CATEGORY_CONFIG[category]
          const CategoryIcon = config?.icon || Shield

          return (
            <motion.section key={category} {...fadeUp(0.15 + ci * 0.05)}>
              <SectionTitle subtitle={t(
                `${categoryRisks.length} risks — detailed analysis, early warnings, and response plans`,
                `${categoryRisks.length} risques — analyse détaillée, signaux d'alerte précoce et plans de réponse`
              )}>
                <span className="flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4" />
                  {t(`${category} Risks`, `Risques ${getCategoryLabel(category, t).toLowerCase()}s`)}
                </span>
              </SectionTitle>

              <div className="space-y-4">
                {categoryRisks.map((risk, ri) => (
                  <motion.div
                    key={risk.id}
                    className="bg-white border border-gray-200 rounded-xl p-5"
                    {...fadeUp(0.17 + ci * 0.05 + ri * 0.03)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-gray-400">{risk.id}</span>
                          <h4 className="text-xs font-bold text-gray-900">{risk.name}</h4>
                        </div>
                      </div>
                      <SeverityBadge severity={risk.severity} />
                    </div>

                    {/* P/I bars */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Probability', 'Probabilité')} ({risk.probability}/5)</p>
                        <ImpactBar value={risk.probability} color={risk.score >= 15 ? 'bg-red-400' : risk.score >= 10 ? 'bg-amber-400' : 'bg-yellow-400'} />
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Impact', 'Impact')} ({risk.impact}/5)</p>
                        <ImpactBar value={risk.impact} color={risk.score >= 15 ? 'bg-red-400' : risk.score >= 10 ? 'bg-amber-400' : 'bg-yellow-400'} />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{risk.description}</p>

                    {/* Early warnings */}
                    <div className="mb-4">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" /> {t('Early Warning Signals', 'Signaux d\'alerte précoce')}
                      </p>
                      <div className="space-y-1">
                        {risk.earlyWarnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-gray-500">{w}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mitigation + Contingency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t('Mitigation', 'Atténuation')}
                        </p>
                        <p className="text-[10px] text-emerald-700 leading-relaxed">{risk.mitigation}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {t('Contingency', 'Contingence')}
                        </p>
                        <p className="text-[10px] text-amber-700 leading-relaxed">{risk.contingency}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })}

        {/* ── 5. Scenario Planning ────────────────────────────── */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle={t('Four outcome models — from best case to black swan', 'Quatre modèles de résultats — du meilleur scénario au cygne noir')}>{t('Scenario Planning', 'Planification de scénarios')}</SectionTitle>

          <div className="space-y-4">
            {scenarios.map((scenario, i) => (
              <motion.div
                key={scenario.name}
                className={`${scenario.bgColor} border ${scenario.borderColor} rounded-xl p-5`}
                {...fadeUp(0.47 + i * 0.04)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`text-sm font-bold ${scenario.textColor}`}>{scenario.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t('Probability', 'Probabilité')}: {scenario.probability}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border ${scenario.borderColor} ${scenario.textColor}`}>
                    {scenario.probability}
                  </span>
                </div>

                {/* Narrative */}
                <p className="text-[10px] text-gray-600 leading-relaxed mb-4">{scenario.narrative}</p>

                {/* Revenue impact */}
                <div className="bg-white/60 rounded-lg px-3 py-2 mb-4">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{t('Revenue Impact', 'Impact sur les revenus')}</p>
                  <p className={`text-xs font-bold ${scenario.textColor}`}>{scenario.revenueImpact}</p>
                </div>

                {/* Timeline milestones */}
                <div className="mb-4">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Key Milestones', 'Jalons clés')}</p>
                  <div className="space-y-1.5">
                    {scenario.milestones.map((m, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-600">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic responses */}
                <div>
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Strategic Response', 'Réponse stratégique')}</p>
                  <div className="space-y-1.5">
                    {scenario.responses.map((resp, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-600">{resp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Risk Mitigation Roadmap ──────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <SectionTitle subtitle={t('Phased mitigation plan — from foundation to scale', 'Plan d\'atténuation par phases — des fondations à la montée en charge')}>{t('Risk Mitigation Roadmap', 'Feuille de route d\'atténuation des risques')}</SectionTitle>

          <div className="space-y-4">
            {roadmap.map((phase, pi) => (
              <motion.div
                key={phase.phase}
                className={`bg-white border ${phase.borderColor} rounded-xl p-5`}
                {...fadeUp(0.62 + pi * 0.04)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${phase.bgColor} ${phase.color} text-[10px] font-bold px-3 py-1 rounded-full`}>
                    {phase.period}
                  </div>
                  <h3 className={`text-sm font-bold ${phase.color}`}>{phase.phase}</h3>
                </div>
                <div className="space-y-2">
                  {phase.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full ${phase.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                        <ChevronRight className={`w-3 h-3 ${phase.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-700 font-medium">{item.action}</p>
                        <p className="text-[9px] text-gray-400">{item.owner}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 7. Key Takeaways ────────────────────────────────── */}
        <motion.section {...fadeUp(0.75)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">{t('Key Takeaways', 'Points clés')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">{t('Manageable', 'Maîtrisable')}</p>
                <div className="space-y-2">
                  {[
                    t('No unmitigated risk — every threat has a specific response plan', 'Aucun risque sans atténuation — chaque menace a un plan de réponse spécifique'),
                    t('85% gross margin provides buffer for cost shocks', 'La marge brute de 85 % offre un tampon contre les chocs de coûts'),
                    t('B2B2C model de-risks distribution through practitioner networks', 'Le modèle B2B2C réduit le risque de distribution via les réseaux de praticiens'),
                    t('EU regulation creates structural moat that deepens over time', 'La réglementation européenne crée un avantage structurel qui se renforce avec le temps'),
                    t('Pre-revenue stage means low blast radius if things go wrong', 'Le stade pré-revenu signifie un impact limité en cas de problème'),
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">{t('Uncontrollable', 'Incontrôlable')}</p>
                <div className="space-y-2">
                  {[
                    t('Practitioner adoption is structurally slow — inertia is real', 'L\'adoption par les praticiens est structurellement lente — l\'inertie est réelle'),
                    t('Funding winter is macro — no startup can control investor sentiment', 'L\'hiver du financement est macro — aucune startup ne peut contrôler le sentiment des investisseurs'),
                    t('AI safety risk is never zero — only manageable to asymptotic limits', 'Le risque de sécurité IA n\'est jamais nul — seulement gérable jusqu\'à des limites asymptotiques'),
                    t('HDS certification timing depends on French regulatory decisions', 'Le calendrier de certification HDS dépend des décisions réglementaires françaises'),
                    t('Doctolib and SimplePractice have resources we cannot match', 'Doctolib et SimplePractice ont des ressources que nous ne pouvons pas égaler'),
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs font-semibold text-white mb-2">{t('Honest Assessment', 'Évaluation honnête')}</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {t(
                  'The question is not whether risks exist. The question is whether the team has identified them honestly, planned for them specifically, and built a product architecture that gives us options when things go wrong. This analysis covers 15 risks across 5 categories. Four are critical, four are high, seven are medium. None are unmitigated. The scenarios range from €8K MRR at Month 12 to complete wind-down. The roadmap prioritizes the risks that matter most, earliest.',
                  'La question n\'est pas de savoir si des risques existent. La question est de savoir si l\'équipe les a identifiés honnêtement, planifiés spécifiquement et construit une architecture produit qui nous donne des options quand les choses tournent mal. Cette analyse couvre 15 risques dans 5 catégories. Quatre sont critiques, quatre sont élevés, sept sont moyens. Aucun n\'est sans atténuation. Les scénarios vont de 8 K€ de MRR au Mois 12 à une cessation complète. La feuille de route priorise les risques les plus importants en premier.'
                )}
                {' '}
                <span className="text-white font-semibold">{t('That is the best any pre-revenue company can do.', 'C\'est le mieux que toute entreprise pré-revenu puisse faire.')}</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── 8. Footer ───────────────────────────────────────── */}
        <motion.div {...fadeUp(0.8)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Analysis as of Feb 2026 — Bloomsline Care', 'Analyse en date de février 2026 — Bloomsline Care')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
