'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Heart,
  Briefcase,
  MapPin,
  GraduationCap,
  DollarSign,
  UserCircle,
  Home,
  ArrowRight,
  Star,
  XCircle,
  Zap,
  Clock,
  Eye,
  Megaphone,
  Search,
  CreditCard,
  Monitor,
  BookOpen,
  MessageSquare,
  Lightbulb,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

type TranslateFn = (en: string, fr: string) => string

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

interface Persona {
  name: string
  emoji: string
  role: string
  tagline: string
  quote: string
  priority: 'P0' | 'P1' | 'P2'
  priorityLabel: string
  side: 'b2b' | 'b2c'
  accentColor: string
  accentBg: string
  accentBorder: string
  accentText: string
  accentLight: string
  demographics: { label: string; value: string; icon: typeof MapPin }[]
  psychographics: {
    values: string[]
    beliefs: string[]
    lifestyle: string[]
    personality: string[]
  }
  painPoints: string[]
  goals: string[]
  buyingBehavior: {
    discovery: string[]
    evaluation: string[]
    purchase: string[]
  }
  mediaConsumption: {
    online: string[]
    offline: string[]
  }
  objections: { title: string; detail: string }[]
  triggerEvents: { event: string; emotion: string }[]
  willingness: {
    range: string
    comparisons: string[]
    sensitivity: string
  }
  retentionRisk?: string
}

// ── Persona Data ─────────────────────────────────────────────────────────

function getPersonas(t: TranslateFn): Persona[] {
  return [
    // ── B2B ──
    {
      name: 'Marie',
      emoji: '👩‍⚕️',
      role: t('Independent Psychotherapist', 'Psychothérapeute indépendante'),
      tagline: t('Core ICP — shortest sales cycle', 'ICP principal — cycle de vente le plus court'),
      quote: t(
        '"I became a therapist to help people heal, not to spend my Sundays doing paperwork. But every week, it\'s the same — notes, follow-ups, no-shows. I feel like I\'m running a business I never signed up for."',
        '"Je suis devenue thérapeute pour aider les gens à guérir, pas pour passer mes dimanches à faire de la paperasse. Mais chaque semaine, c\'est pareil — notes, suivis, absences. J\'ai l\'impression de gérer une entreprise que je n\'ai jamais choisie."'
      ),
      priority: 'P0',
      priorityLabel: t('Core ICP', 'ICP principal'),
      side: 'b2b',
      accentColor: 'bg-indigo-500',
      accentBg: 'bg-indigo-50',
      accentBorder: 'border-indigo-200',
      accentText: 'text-indigo-600',
      accentLight: 'bg-indigo-100',
      demographics: [
        { label: t('Age', 'Âge'), value: '35-45', icon: UserCircle },
        { label: t('Income', 'Revenu'), value: '€45-65K/' + t('yr', 'an'), icon: DollarSign },
        { label: t('Education', 'Formation'), value: t('Master\'s in Psychology', 'Master en psychologie'), icon: GraduationCap },
        { label: t('Location', 'Localisation'), value: 'Paris / Lyon', icon: MapPin },
        { label: t('Job Title', 'Poste'), value: t('Psychotherapist (solo)', 'Psychothérapeute (solo)'), icon: Briefcase },
        { label: t('Family', 'Famille'), value: t('Partner, 0-2 children', 'Conjoint(e), 0-2 enfants'), icon: Home },
      ],
      psychographics: {
        values: [
          t('Client wellbeing above all', 'Bien-être du client avant tout'),
          t('Evidence-based practice', 'Pratique fondée sur les preuves'),
          t('Work-life balance', 'Équilibre vie pro / vie perso'),
          t('Continuous learning', 'Formation continue'),
        ],
        beliefs: [
          t('Therapy works when sustained', 'La thérapie fonctionne quand elle est soutenue'),
          t('Admin kills care quality', 'L\'administratif nuit à la qualité des soins'),
          t('Tech should be invisible', 'La technologie doit être invisible'),
          t('EU tools should exist', 'Des outils européens devraient exister'),
        ],
        lifestyle: [
          t('Works 4-5 days/week', 'Travaille 4-5 jours/semaine'),
          t('Reads journals on weekends', 'Lit des revues le week-end'),
          t('Attends 1-2 conferences/yr', 'Participe à 1-2 conférences/an'),
          t('Exercises for self-care', 'Fait du sport pour prendre soin d\'elle'),
        ],
        personality: [
          t('Empathetic & detail-oriented', 'Empathique et méticuleuse'),
          t('Skeptical of "shiny" tech', 'Méfiante envers la tech « tape-à-l\'œil »'),
          t('Pragmatic problem-solver', 'Pragmatique dans la résolution de problèmes'),
          t('Values peer validation', 'Accorde de l\'importance à la validation par les pairs'),
        ],
      },
      painPoints: [
        t('5-8 hrs/week on admin (notes, scheduling, follow-ups)', '5-8 h/semaine d\'administratif (notes, planification, suivis)'),
        t('"167-hour blind spot" — zero visibility between sessions', '« Angle mort de 167 heures » — aucune visibilité entre les séances'),
        t('Clients drop off silently with no early warning', 'Les clients décrochent en silence sans signe avant-coureur'),
        t('No EU-native, affordable tools — forced to use US software or spreadsheets', 'Aucun outil européen abordable — obligée d\'utiliser des logiciels américains ou des tableurs'),
        t('Can\'t prove outcomes to referral partners or insurance', 'Impossible de prouver les résultats aux partenaires d\'adressage ou aux assurances'),
      ],
      goals: [
        t('Spend 80%+ of work time on actual therapy', 'Consacrer plus de 80 % de son temps à la thérapie'),
        t('See clients progressing between sessions, not just during', 'Voir les clients progresser entre les séances, pas seulement pendant'),
        t('Reduce no-shows and silent dropoffs', 'Réduire les absences et les abandons silencieux'),
        t('Have one tool that handles notes, scheduling, and client engagement', 'Disposer d\'un outil unique pour les notes, la planification et l\'engagement client'),
      ],
      buyingBehavior: {
        discovery: [
          t('LinkedIn peer recommendations', 'Recommandations de pairs sur LinkedIn'),
          t('AFTCC / FFPP conference demos', 'Démonstrations aux congrès AFTCC / FFPP'),
          t('Word-of-mouth from training cohort', 'Bouche-à-oreille de la promotion de formation'),
        ],
        evaluation: [
          t('Free trial (must work in <10 min)', 'Essai gratuit (doit fonctionner en <10 min)'),
          t('Checks RGPD compliance first', 'Vérifie d\'abord la conformité RGPD'),
          t('Compares to current workflow cost', 'Compare au coût du flux de travail actuel'),
        ],
        purchase: [
          t('Monthly subscription (no annual lock-in)', 'Abonnement mensuel (sans engagement annuel)'),
          t('Solo decision — no committee', 'Décision individuelle — pas de comité'),
          t('Converts within 2-4 weeks of trial', 'Convertit dans les 2-4 semaines de l\'essai'),
        ],
      },
      mediaConsumption: {
        online: [
          t('LinkedIn (daily)', 'LinkedIn (quotidien)'),
          t('Psychology Today articles', 'Articles Psychology Today'),
          t('Webinars on clinical tools', 'Webinaires sur les outils cliniques'),
          t('WhatsApp peer groups', 'Groupes WhatsApp entre pairs'),
        ],
        offline: [
          t('AFTCC annual conference', 'Congrès annuel de l\'AFTCC'),
          t('Local supervision groups', 'Groupes de supervision locaux'),
          t('University continuing ed', 'Formation continue universitaire'),
          t('Professional journals', 'Revues professionnelles'),
        ],
      },
      objections: [
        {
          title: t('"I don\'t have time to learn another tool"', '"Je n\'ai pas le temps d\'apprendre un autre outil"'),
          detail: t(
            'Needs onboarding in <10 minutes. If setup takes a full afternoon, she\'ll abandon it.',
            'L\'intégration doit se faire en <10 minutes. Si la configuration prend un après-midi, elle abandonnera.'
          ),
        },
        {
          title: t('"Is my client data really safe?"', '"Les données de mes clients sont-elles vraiment en sécurité ?"'),
          detail: t(
            'RGPD/GDPR compliance is non-negotiable. Hosting must be in Europe. She needs to see the privacy policy before signing up.',
            'La conformité RGPD est non négociable. L\'hébergement doit être en Europe. Elle doit voir la politique de confidentialité avant de s\'inscrire.'
          ),
        },
        {
          title: t('"My clients aren\'t tech-savvy enough"', '"Mes clients ne sont pas assez à l\'aise avec la technologie"'),
          detail: t(
            'Needs proof that the member app works for all ages. One bad client experience = she stops recommending it.',
            'A besoin de preuves que l\'application fonctionne pour tous les âges. Une mauvaise expérience client = elle arrête de la recommander.'
          ),
        },
      ],
      triggerEvents: [
        {
          event: t('Loses a client who "just stopped coming"', 'Perd un client qui « a simplement arrêté de venir »'),
          emotion: t('Guilt + frustration — "I should have seen this coming"', 'Culpabilité + frustration — « J\'aurais dû le voir venir »'),
        },
        {
          event: t('Sunday evening spent catching up on notes', 'Dimanche soir passé à rattraper les notes'),
          emotion: t('Resentment — "This isn\'t why I became a therapist"', 'Amertume — « Ce n\'est pas pour ça que je suis devenue thérapeute »'),
        },
        {
          event: t('Referral partner asks for outcome data', 'Un partenaire d\'adressage demande des données de résultats'),
          emotion: t('Embarrassment — "I have nothing to show them"', 'Embarras — « Je n\'ai rien à leur montrer »'),
        },
      ],
      willingness: {
        range: '€25-50/' + t('mo', 'mois'),
        comparisons: [
          t('1 cancelled session = €60-80 lost', '1 séance annulée = 60-80 € perdus'),
          t('Current US tools cost €50-139/mo', 'Les outils américains actuels coûtent 50-139 €/mois'),
          t('Paper + spreadsheets = "free" but 5-8 hrs/week', 'Papier + tableurs = « gratuit » mais 5-8 h/semaine'),
        ],
        sensitivity: t('Medium — price-conscious but values time savings', 'Moyenne — sensible au prix mais valorise le gain de temps'),
      },
    },
    {
      name: 'Thomas',
      emoji: '👨‍💼',
      role: t('Group Practice Director', 'Directeur de cabinet de groupe'),
      tagline: t('High ACV — longer sales cycle', 'VMA élevée — cycle de vente plus long'),
      quote: t(
        '"I manage 6 practitioners and I have no idea how their clients are actually doing. Everyone uses different tools, different note formats. When someone burns out and leaves, I lose months of institutional knowledge."',
        '"Je dirige 6 praticiens et je n\'ai aucune idée de l\'état réel de leurs clients. Chacun utilise des outils différents, des formats de notes différents. Quand quelqu\'un fait un burn-out et part, je perds des mois de savoir institutionnel."'
      ),
      priority: 'P1',
      priorityLabel: t('High ACV', 'VMA élevée'),
      side: 'b2b',
      accentColor: 'bg-blue-500',
      accentBg: 'bg-blue-50',
      accentBorder: 'border-blue-200',
      accentText: 'text-blue-600',
      accentLight: 'bg-blue-100',
      demographics: [
        { label: t('Age', 'Âge'), value: '40-55', icon: UserCircle },
        { label: t('Income', 'Revenu'), value: '€65-90K/' + t('yr', 'an'), icon: DollarSign },
        { label: t('Education', 'Formation'), value: t('Master\'s + management training', 'Master + formation en gestion'), icon: GraduationCap },
        { label: t('Location', 'Localisation'), value: t('Metro France (Paris, Bordeaux, Marseille)', 'France métropolitaine (Paris, Bordeaux, Marseille)'), icon: MapPin },
        { label: t('Job Title', 'Poste'), value: t('Practice Director / Clinical Lead', 'Directeur de cabinet / Responsable clinique'), icon: Briefcase },
        { label: t('Family', 'Famille'), value: t('Partner, 1-3 children', 'Conjoint(e), 1-3 enfants'), icon: Home },
      ],
      psychographics: {
        values: [
          t('Team wellbeing & retention', 'Bien-être et rétention de l\'équipe'),
          t('Operational efficiency', 'Efficacité opérationnelle'),
          t('Evidence-based outcomes', 'Résultats fondés sur les preuves'),
          t('Sustainable growth', 'Croissance durable'),
        ],
        beliefs: [
          t('Good tools reduce burnout', 'De bons outils réduisent l\'épuisement'),
          t('Data drives better care', 'Les données améliorent les soins'),
          t('Standardization enables quality', 'La standardisation favorise la qualité'),
          t('Tech must scale with team', 'La technologie doit évoluer avec l\'équipe'),
        ],
        lifestyle: [
          t('60+ hr weeks in growth phase', 'Semaines de 60 h+ en phase de croissance'),
          t('Splits time: clinical + management', 'Partage son temps : clinique + gestion'),
          t('Attends industry + business events', 'Participe à des événements professionnels'),
          t('Delegates but verifies', 'Délègue mais vérifie'),
        ],
        personality: [
          t('Analytical & systems-oriented', 'Analytique et orienté systèmes'),
          t('Risk-averse with new vendors', 'Prudent avec les nouveaux fournisseurs'),
          t('Consensus builder', 'Bâtisseur de consensus'),
          t('ROI-driven decision maker', 'Décideur orienté ROI'),
        ],
      },
      painPoints: [
        t('No unified view across 3-8 practitioners — each uses different tools', 'Aucune vue unifiée sur 3-8 praticiens — chacun utilise des outils différents'),
        t('Can\'t prove outcomes to referral partners, insurers, or funders', 'Impossible de prouver les résultats aux partenaires, assureurs ou financeurs'),
        t('Staff burn out on admin — loses 1-2 practitioners/year', 'L\'équipe s\'épuise sur l\'administratif — perd 1-2 praticiens/an'),
        t('Onboarding new practitioners takes weeks of manual setup', 'L\'intégration de nouveaux praticiens prend des semaines de configuration manuelle'),
        t('No way to identify at-risk clients across the practice', 'Aucun moyen d\'identifier les clients à risque dans tout le cabinet'),
      ],
      goals: [
        t('Single platform for the entire team with unified client records', 'Une plateforme unique pour toute l\'équipe avec des dossiers clients unifiés'),
        t('Prove clinical outcomes to referral partners and insurers', 'Prouver les résultats cliniques aux partenaires d\'adressage et aux assureurs'),
        t('Reduce practitioner admin load to improve retention', 'Réduire la charge administrative des praticiens pour améliorer la rétention'),
        t('Scalable system that grows with the practice', 'Un système évolutif qui grandit avec le cabinet'),
      ],
      buyingBehavior: {
        discovery: [
          t('Team member recommends after personal trial', 'Un membre de l\'équipe recommande après un essai personnel'),
          t('Industry conference or webinar', 'Conférence sectorielle ou webinaire'),
          t('Peer practice director referral', 'Recommandation d\'un directeur de cabinet pair'),
        ],
        evaluation: [
          t('Pilot with 1-2 practitioners (4-6 weeks)', 'Pilote avec 1-2 praticiens (4-6 semaines)'),
          t('ROI analysis: time saved x hourly rate', 'Analyse du ROI : temps gagné x taux horaire'),
          t('Security audit + RGPD verification', 'Audit de sécurité + vérification RGPD'),
        ],
        purchase: [
          t('Per-practitioner pricing (volume)', 'Tarification par praticien (volume)'),
          t('Annual contract preferred for budget planning', 'Contrat annuel préféré pour la planification budgétaire'),
          t('6-12 week decision cycle', 'Cycle de décision de 6-12 semaines'),
        ],
      },
      mediaConsumption: {
        online: [
          t('LinkedIn (professional content)', 'LinkedIn (contenu professionnel)'),
          t('Healthcare management newsletters', 'Newsletters de gestion de la santé'),
          t('SaaS comparison sites', 'Sites de comparaison SaaS'),
          t('Webinars on practice growth', 'Webinaires sur la croissance de cabinet'),
        ],
        offline: [
          t('Healthcare management conferences', 'Conférences de gestion de la santé'),
          t('Regional practitioner networks', 'Réseaux régionaux de praticiens'),
          t('ARS-sponsored events', 'Événements parrainés par les ARS'),
          t('Business coaching groups', 'Groupes de coaching d\'affaires'),
        ],
      },
      objections: [
        {
          title: t('"My team won\'t adopt another tool"', '"Mon équipe n\'adoptera pas un autre outil"'),
          detail: t(
            'Needs proof of minimal learning curve. Wants to see adoption rates from similar practices before committing.',
            'A besoin de preuves d\'une courbe d\'apprentissage minimale. Veut voir les taux d\'adoption de cabinets similaires avant de s\'engager.'
          ),
        },
        {
          title: t('"I need ROI data to justify the expense"', '"J\'ai besoin de données de ROI pour justifier la dépense"'),
          detail: t(
            'Requires a clear cost-benefit analysis: time saved per practitioner x hourly rate vs. subscription cost per seat.',
            'Exige une analyse coût-bénéfice claire : temps gagné par praticien x taux horaire vs. coût d\'abonnement par poste.'
          ),
        },
        {
          title: t('"What about data migration from our current systems?"', '"Qu\'en est-il de la migration des données depuis nos systèmes actuels ?"'),
          detail: t(
            'Needs import tools or white-glove onboarding. Switching cost anxiety is the #1 blocker for group practices.',
            'A besoin d\'outils d\'import ou d\'un accompagnement personnalisé. L\'angoisse du coût de migration est le frein n°1 pour les cabinets de groupe.'
          ),
        },
      ],
      triggerEvents: [
        {
          event: t('Loses a practitioner to burnout', 'Perd un praticien à cause de l\'épuisement'),
          emotion: t('Urgency — "I need to fix the admin burden before I lose another one"', 'Urgence — « Je dois alléger la charge administrative avant d\'en perdre un autre »'),
        },
        {
          event: t('Referral partner asks for outcome data', 'Un partenaire d\'adressage demande des données de résultats'),
          emotion: t('Pressure — "If I can\'t show results, we lose the referral pipeline"', 'Pression — « Si je ne peux pas montrer de résultats, on perd le réseau d\'adressage »'),
        },
        {
          event: t('Insurance/ARS audit request', 'Demande d\'audit assurance / ARS'),
          emotion: t('Anxiety — "We need proper documentation across the practice NOW"', 'Anxiété — « Il nous faut une documentation correcte dans tout le cabinet MAINTENANT »'),
        },
      ],
      willingness: {
        range: '€20-25/' + t('practitioner/mo', 'praticien/mois'),
        comparisons: [
          t('Losing 1 practitioner = €50-80K replacement cost', 'Perdre 1 praticien = 50-80 K€ de coût de remplacement'),
          t('Manual tracking across team = 2-3 hrs/week of director time', 'Suivi manuel de l\'équipe = 2-3 h/semaine de temps directeur'),
          t('Current multi-tool stack = €80-150/practitioner/mo', 'Empilement d\'outils actuel = 80-150 €/praticien/mois'),
        ],
        sensitivity: t('Low — volume buyer, needs ROI justification not lowest price', 'Faible — acheteur en volume, a besoin de justification ROI, pas du prix le plus bas'),
      },
    },
    // ── B2C ──
    {
      name: 'Lea',
      emoji: '👩‍💻',
      role: t('Engaged Young Professional', 'Jeune professionnelle engagée'),
      tagline: t('Self-activating, freemium upside', 'Auto-activation, potentiel freemium'),
      quote: t(
        '"My therapist gives me these amazing insights during sessions, but by Wednesday I can\'t remember half of what we talked about. I journal sometimes, but it feels disconnected from my actual therapy. I wish there was something that bridged the gap."',
        '"Ma thérapeute me donne des éclairages incroyables en séance, mais dès mercredi je ne me souviens plus de la moitié de ce qu\'on a dit. Je tiens parfois un journal, mais ça semble déconnecté de ma thérapie. J\'aimerais un outil qui fasse le lien."'
      ),
      priority: 'P1',
      priorityLabel: t('Organic Growth', 'Croissance organique'),
      side: 'b2c',
      accentColor: 'bg-emerald-500',
      accentBg: 'bg-emerald-50',
      accentBorder: 'border-emerald-200',
      accentText: 'text-emerald-600',
      accentLight: 'bg-emerald-100',
      demographics: [
        { label: t('Age', 'Âge'), value: '26-34', icon: UserCircle },
        { label: t('Income', 'Revenu'), value: '€35-55K/' + t('yr', 'an'), icon: DollarSign },
        { label: t('Education', 'Formation'), value: t('Bachelor\'s / Master\'s', 'Licence / Master'), icon: GraduationCap },
        { label: t('Location', 'Localisation'), value: t('Paris (urban)', 'Paris (urbain)'), icon: MapPin },
        { label: t('Job Title', 'Poste'), value: t('Marketing / Tech / Consulting', 'Marketing / Tech / Conseil'), icon: Briefcase },
        { label: t('Family', 'Famille'), value: t('Single or partner, no kids', 'Célibataire ou en couple, sans enfant'), icon: Home },
      ],
      psychographics: {
        values: [
          t('Personal growth & self-awareness', 'Développement personnel et connaissance de soi'),
          t('Mental health destigmatization', 'Déstigmatisation de la santé mentale'),
          t('Digital-first solutions', 'Solutions numériques avant tout'),
          t('Authenticity in relationships', 'Authenticité dans les relations'),
        ],
        beliefs: [
          t('Therapy is an investment, not a weakness', 'La thérapie est un investissement, pas une faiblesse'),
          t('Progress should be visible', 'Le progrès devrait être visible'),
          t('Good UX matters for health tools', 'Une bonne UX est importante pour les outils de santé'),
          t('Data privacy is important', 'La protection des données est importante'),
        ],
        lifestyle: [
          t('Digitally native — 6+ hrs screen time/day', 'Digital native — 6 h+ d\'écran/jour'),
          t('Exercises 3-4x/week', 'Fait du sport 3-4x/semaine'),
          t('Active on Instagram & TikTok', 'Active sur Instagram et TikTok'),
          t('Reads self-help & psychology content', 'Lit du contenu développement personnel et psychologie'),
        ],
        personality: [
          t('Growth-oriented & curious', 'Orientée croissance et curieuse'),
          t('Willing to try new apps', 'Prête à essayer de nouvelles applis'),
          t('Shares health tools with friends', 'Partage les outils santé avec ses amis'),
          t('Abandons apps with bad UX quickly', 'Abandonne vite les applis avec une mauvaise UX'),
        ],
      },
      painPoints: [
        t('Forgets therapy insights by day 3 — "What did we even talk about?"', 'Oublie les enseignements de thérapie au jour 3 — « De quoi on a parlé déjà ? »'),
        t('Journaling apps feel generic — not connected to her actual care plan', 'Les applis de journal sont trop génériques — pas liées à son vrai plan de soins'),
        t('No way to share progress moments with her therapist between sessions', 'Aucun moyen de partager ses moments de progrès avec sa thérapeute entre les séances'),
        t('Meditation apps (Headspace, Calm) feel disconnected from real therapy', 'Les applis de méditation (Headspace, Calm) semblent déconnectées de la vraie thérapie'),
        t('Wants to track progress but doesn\'t know what to measure', 'Veut suivre ses progrès mais ne sait pas quoi mesurer'),
      ],
      goals: [
        t('Retain and apply therapy insights throughout the week', 'Retenir et appliquer les enseignements de thérapie toute la semaine'),
        t('See tangible evidence of her mental health progress over time', 'Voir des preuves tangibles de ses progrès en santé mentale au fil du temps'),
        t('Have a tool her therapist actually recommends and uses', 'Avoir un outil que sa thérapeute recommande et utilise vraiment'),
        t('Bridge the gap between weekly sessions with meaningful activities', 'Combler le vide entre les séances hebdomadaires avec des activités utiles'),
      ],
      buyingBehavior: {
        discovery: [
          t('100% via therapist recommendation — never finds it alone', '100 % via la recommandation du thérapeute — ne le trouve jamais seule'),
          t('Judges app quality in first 3 uses (UX = trust signal)', 'Juge la qualité de l\'appli en 3 utilisations (UX = signal de confiance)'),
          t('Checks App Store reviews before downloading', 'Consulte les avis sur l\'App Store avant de télécharger'),
        ],
        evaluation: [
          t('Tries free version immediately after therapist recommends', 'Essaie la version gratuite juste après la recommandation du thérapeute'),
          t('Compares to Headspace/Calm experience', 'Compare à l\'expérience Headspace/Calm'),
          t('Needs to see value within first week', 'Doit voir la valeur dès la première semaine'),
        ],
        purchase: [
          t('Free via practitioner initially', 'Gratuit via le praticien au départ'),
          t('5-8% convert to ~€3/mo premium after 2-3 months', '5-8 % convertissent vers ~3 €/mois premium après 2-3 mois'),
          t('In-app upgrade — no sales contact needed', 'Upgrade in-app — aucun contact commercial nécessaire'),
        ],
      },
      mediaConsumption: {
        online: [
          t('Instagram & TikTok (mental health content)', 'Instagram et TikTok (contenu santé mentale)'),
          t('Spotify podcasts (therapy & wellness)', 'Podcasts Spotify (thérapie et bien-être)'),
          t('App Store browsing', 'Navigation sur l\'App Store'),
          t('Reddit r/therapy communities', 'Communautés Reddit r/therapy'),
        ],
        offline: [
          t('Yoga / fitness studios', 'Studios de yoga / fitness'),
          t('Book clubs (self-help genre)', 'Clubs de lecture (développement personnel)'),
          t('Friends\' recommendations', 'Recommandations d\'amis'),
          t('University alumni events', 'Événements d\'anciens élèves'),
        ],
      },
      objections: [
        {
          title: t('"Another app? I already have Headspace"', '"Encore une appli ? J\'ai déjà Headspace"'),
          detail: t(
            'Needs to understand this isn\'t a meditation app — it\'s connected to her actual therapy and therapist.',
            'Doit comprendre que ce n\'est pas une appli de méditation — c\'est connecté à sa vraie thérapie et à son thérapeute.'
          ),
        },
        {
          title: t('"Will my therapist actually see what I share?"', '"Ma thérapeute va-t-elle vraiment voir ce que je partage ?"'),
          detail: t(
            'Wants clarity on privacy controls: what her therapist sees vs. what stays private.',
            'Veut de la clarté sur les contrôles de confidentialité : ce que la thérapeute voit vs. ce qui reste privé.'
          ),
        },
        {
          title: t('"I\'ll probably forget to use it after a week"', '"Je vais probablement oublier de l\'utiliser après une semaine"'),
          detail: t(
            'Needs gentle nudges (not spam notifications) and therapist-driven prompts to build the habit.',
            'A besoin de rappels doux (pas de notifications spam) et de suggestions du thérapeute pour créer l\'habitude.'
          ),
        },
      ],
      triggerEvents: [
        {
          event: t('Therapist says "I wish I could see how you\'re doing between sessions"', 'La thérapeute dit « J\'aimerais voir comment vous allez entre les séances »'),
          emotion: t('Openness — "If my therapist recommends it, I\'ll try it"', 'Ouverture — « Si ma thérapeute le recommande, je vais essayer »'),
        },
        {
          event: t('Has a breakthrough session but can\'t recall details by Friday', 'A une séance déclic mais ne se souvient plus des détails vendredi'),
          emotion: t('Frustration — "I need to capture these moments somehow"', 'Frustration — « Il faut que je capture ces moments d\'une manière ou d\'une autre »'),
        },
        {
          event: t('Friend shares their therapy progress on social media', 'Une amie partage ses progrès thérapeutiques sur les réseaux sociaux'),
          emotion: t('Inspiration — "I want to track my journey like that too"', 'Inspiration — « Je veux aussi suivre mon parcours comme ça »'),
        },
      ],
      willingness: {
        range: t('€0 to start, ~€3/mo premium', '0 € au départ, ~3 €/mois premium'),
        comparisons: [
          t('Headspace: €12.99/mo (generic meditation)', 'Headspace : 12,99 €/mois (méditation générique)'),
          t('Calm: €11.99/mo (sleep + relaxation)', 'Calm : 11,99 €/mois (sommeil + relaxation)'),
          t('Therapy session: €60-80/session (1x/week)', 'Séance de thérapie : 60-80 €/séance (1x/semaine)'),
        ],
        sensitivity: t('High — expects free core, pays for extras she genuinely uses', 'Élevée — s\'attend à un cœur gratuit, paie pour les extras qu\'elle utilise vraiment'),
      },
    },
    {
      name: 'Sophie',
      emoji: '👩‍👧‍👦',
      role: t('Overwhelmed Parent', 'Parent débordée'),
      tagline: t('Design constraint — retention proof', 'Contrainte de design — preuve de rétention'),
      quote: t(
        '"I know therapy is helping, but honestly, by the time I get the kids to bed and clean up, I can barely remember what my therapist said. I feel guilty for not doing the exercises, but I just don\'t have the energy to figure out another app."',
        '"Je sais que la thérapie m\'aide, mais honnêtement, le temps de coucher les enfants et de ranger, je me souviens à peine de ce que ma thérapeute a dit. Je culpabilise de ne pas faire les exercices, mais je n\'ai juste pas l\'énergie pour comprendre une autre appli."'
      ),
      priority: 'P2',
      priorityLabel: t('Design Constraint', 'Contrainte de design'),
      side: 'b2c',
      accentColor: 'bg-violet-500',
      accentBg: 'bg-violet-50',
      accentBorder: 'border-violet-200',
      accentText: 'text-violet-600',
      accentLight: 'bg-violet-100',
      demographics: [
        { label: t('Age', 'Âge'), value: '38-48', icon: UserCircle },
        { label: t('Income', 'Revenu'), value: '€22-35K/' + t('yr', 'an'), icon: DollarSign },
        { label: t('Education', 'Formation'), value: 'Bac+2 / BTS', icon: GraduationCap },
        { label: t('Location', 'Localisation'), value: t('Suburban France', 'France périurbaine'), icon: MapPin },
        { label: t('Job Title', 'Poste'), value: t('Part-time (admin / retail / care)', 'Temps partiel (admin / commerce / aide)'), icon: Briefcase },
        { label: t('Family', 'Famille'), value: t('Partner + 2 children', 'Conjoint(e) + 2 enfants'), icon: Home },
      ],
      psychographics: {
        values: [
          t('Family stability above all', 'Stabilité familiale avant tout'),
          t('Practical over theoretical', 'Pratique plutôt que théorique'),
          t('Trust in her therapist', 'Confiance envers sa thérapeute'),
          t('Simplicity & reliability', 'Simplicité et fiabilité'),
        ],
        beliefs: [
          t('Tech is for younger people', 'La technologie, c\'est pour les jeunes'),
          t('Free tools have hidden costs', 'Les outils gratuits ont des coûts cachés'),
          t('Therapy is already expensive enough', 'La thérapie coûte déjà assez cher'),
          t('She shouldn\'t need help with help', 'Elle ne devrait pas avoir besoin d\'aide pour se faire aider'),
        ],
        lifestyle: [
          t('Zero free time — kids → work → kids → sleep', 'Zéro temps libre — enfants → travail → enfants → dodo'),
          t('Phone = WhatsApp + photos only', 'Téléphone = WhatsApp + photos uniquement'),
          t('Rarely downloads new apps', 'Télécharge rarement de nouvelles applis'),
          t('Gets info from family/friends, not internet', 'S\'informe via famille/amis, pas par internet'),
        ],
        personality: [
          t('Warm but exhausted', 'Chaleureuse mais épuisée'),
          t('Low tech confidence', 'Peu confiante avec la technologie'),
          t('Needs encouragement, not instructions', 'A besoin d\'encouragements, pas d\'instructions'),
          t('Will do it if it\'s truly simple', 'Le fera si c\'est vraiment simple'),
        ],
      },
      painPoints: [
        t('Zero time — mornings are chaos, evenings are exhaustion', 'Zéro temps — les matins c\'est le chaos, les soirs c\'est l\'épuisement'),
        t('Feels guilty about therapy cost — needs to feel it\'s "working"', 'Culpabilise du coût de la thérapie — a besoin de sentir que « ça marche »'),
        t('Forgets homework assignments and feels ashamed at next session', 'Oublie les exercices à faire et a honte à la séance suivante'),
        t('Apps feel intimidating — "too many buttons, not sure what to do"', 'Les applis sont intimidantes — « trop de boutons, je ne sais pas quoi faire »'),
        t('Doesn\'t want to "bother" her therapist between sessions', 'Ne veut pas « déranger » sa thérapeute entre les séances'),
      ],
      goals: [
        t('Remember and complete therapy exercises without added stress', 'Se souvenir des exercices de thérapie et les réaliser sans stress supplémentaire'),
        t('Feel that therapy money is well-spent (visible progress)', 'Sentir que l\'argent de la thérapie est bien dépensé (progrès visibles)'),
        t('Simple tool her therapist sets up FOR her — zero self-setup', 'Un outil simple que sa thérapeute configure POUR elle — zéro config personnelle'),
        t('Quick daily check-in that fits between school run and dinner', 'Un bilan quotidien rapide qui se glisse entre l\'école et le dîner'),
      ],
      buyingBehavior: {
        discovery: [
          t('100% via therapist — sets it up IN session on her phone', '100 % via la thérapeute — configure l\'appli EN séance sur son téléphone'),
          t('Never discovers it alone — zero chance of organic download', 'Ne la découvre jamais seule — zéro chance de téléchargement organique'),
          t('Trusts only her therapist\'s recommendation', 'Ne fait confiance qu\'à la recommandation de sa thérapeute'),
        ],
        evaluation: [
          t('No evaluation phase — if therapist sets it up, she uses it', 'Pas de phase d\'évaluation — si la thérapeute le configure, elle l\'utilise'),
          t('First impression happens in-session with therapist guiding', 'La première impression se fait en séance avec la thérapeute qui guide'),
          t('If confused in first 30 seconds, she closes and never returns', 'Si perdue dans les 30 premières secondes, elle ferme et ne revient jamais'),
        ],
        purchase: [
          t('€0 forever — by design', '0 € pour toujours — par design'),
          t('Her engagement IS the product value (proves B2B outcomes)', 'Son engagement EST la valeur du produit (prouve les résultats B2B)'),
          t('Never shown a paywall — protected by design', 'Ne voit jamais de paywall — protégée par design'),
        ],
      },
      mediaConsumption: {
        online: [
          t('WhatsApp (family groups)', 'WhatsApp (groupes familiaux)'),
          t('Facebook (local community groups)', 'Facebook (groupes communautaires locaux)'),
          t('YouTube (cooking, kids\' content)', 'YouTube (cuisine, contenu enfants)'),
          t('Google (health symptoms search)', 'Google (recherche de symptômes de santé)'),
        ],
        offline: [
          t('School parent meetings', 'Réunions de parents d\'élèves'),
          t('Local pharmacy / GP waiting room', 'Pharmacie locale / salle d\'attente du médecin'),
          t('Family & neighborhood network', 'Réseau familial et de voisinage'),
          t('Free community workshops', 'Ateliers communautaires gratuits'),
        ],
      },
      objections: [
        {
          title: t('"I\'m not good with technology"', '"Je ne suis pas douée avec la technologie"'),
          detail: t(
            'Must work like WhatsApp — open, tap, done. Any complexity beyond that and she\'s lost.',
            'Doit fonctionner comme WhatsApp — ouvrir, appuyer, terminé. Toute complexité au-delà et elle est perdue.'
          ),
        },
        {
          title: t('"I don\'t have time for this"', '"Je n\'ai pas le temps pour ça"'),
          detail: t(
            'Daily interaction must be <30 seconds. If it feels like homework, she\'ll associate it with failure.',
            'L\'interaction quotidienne doit prendre <30 secondes. Si ça ressemble à des devoirs, elle l\'associera à un échec.'
          ),
        },
        {
          title: t('"What if I do it wrong?"', '"Et si je fais mal ?"'),
          detail: t(
            'No error states, no red warnings, no "you missed a day" guilt. Only positive reinforcement.',
            'Pas d\'états d\'erreur, pas d\'avertissements rouges, pas de culpabilisation « vous avez raté un jour ». Uniquement du renforcement positif.'
          ),
        },
      ],
      triggerEvents: [
        {
          event: t('Therapist says "let me show you something on your phone"', 'La thérapeute dit « laissez-moi vous montrer quelque chose sur votre téléphone »'),
          emotion: t('Trust — "If she\'s setting it up for me, it must be important"', 'Confiance — « Si elle le configure pour moi, ça doit être important »'),
        },
        {
          event: t('Feels progress after using a simple check-in for 1 week', 'Ressent des progrès après avoir utilisé un simple bilan pendant 1 semaine'),
          emotion: t('Pride — "I\'m actually doing something for myself"', 'Fierté — « Je fais enfin quelque chose pour moi »'),
        },
      ],
      willingness: {
        range: t('€0 forever (by design)', '0 € pour toujours (par design)'),
        comparisons: [
          t('Therapy session: €60-80 (often subsidized)', 'Séance de thérapie : 60-80 € (souvent subventionnée)'),
          t('Her engagement proves practitioner ROI', 'Son engagement prouve le ROI du praticien'),
          t('If she drops off, the practitioner loses data — our problem, not hers', 'Si elle décroche, le praticien perd des données — notre problème, pas le sien'),
        ],
        sensitivity: t('N/A — never pays. Her value is engagement data for B2B.', 'N/A — ne paie jamais. Sa valeur réside dans les données d\'engagement pour le B2B.'),
      },
      retentionRisk: t(
        'If first use takes >30 seconds to understand, she never opens it again. Onboarding must happen IN session with practitioner guiding. No self-serve setup. No tutorial screens. Open → one action → done.',
        'Si la première utilisation prend plus de 30 secondes à comprendre, elle ne l\'ouvre plus jamais. L\'intégration doit se faire EN séance avec le praticien qui guide. Pas de configuration en autonomie. Pas d\'écrans tutoriels. Ouvrir → une action → terminé.'
      ),
    },
  ]
}

// ── Segment Sizing Data ──────────────────────────────────────────────────

function getSegments(t: TranslateFn) {
  return [
    { segment: t('Solo practitioners', 'Praticiens indépendants'), persona: 'Marie', pctMarket: '65%', tam: t('~19.5K (France)', '~19,5K (France)'), priority: 'P0', priorityColor: 'bg-red-50 text-red-700 border-red-200', rationale: t('Core ICP, shortest sales cycle, highest volume', 'ICP principal, cycle de vente le plus court, volume le plus élevé') },
    { segment: t('Group practices', 'Cabinets de groupe'), persona: 'Thomas', pctMarket: '20%', tam: t('~3-5K practices', '~3-5K cabinets'), priority: 'P1', priorityColor: 'bg-amber-50 text-amber-700 border-amber-200', rationale: t('Higher ACV, longer cycle, expansion revenue', 'VMA plus élevée, cycle plus long, revenus d\'expansion') },
    { segment: t('Engaged members', 'Membres engagés'), persona: 'Lea', pctMarket: t('45% of members', '45 % des membres'), tam: '~195K', priority: 'P1', priorityColor: 'bg-amber-50 text-amber-700 border-amber-200', rationale: t('Self-activating, freemium conversion upside', 'Auto-activation, potentiel de conversion freemium') },
    { segment: t('High-risk members', 'Membres à haut risque'), persona: 'Sophie', pctMarket: t('35% of members', '35 % des membres'), tam: '~130K', priority: 'P2', priorityColor: 'bg-gray-50 text-gray-500 border-gray-200', rationale: t('Retention proof, drives B2B outcomes data', 'Preuve de rétention, génère des données de résultats B2B') },
  ]
}

// ── Journey Map Data ─────────────────────────────────────────────────────

function getJourneyStages(t: TranslateFn) {
  return [
    t('Awareness', 'Notoriété'),
    t('Evaluation', 'Évaluation'),
    t('Onboarding', 'Intégration'),
    t('Engagement', 'Engagement'),
    t('Advocacy', 'Recommandation'),
  ]
}

function getJourneyRows(t: TranslateFn) {
  return [
    {
      persona: 'Marie',
      emoji: '👩‍⚕️',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      dotColor: 'bg-indigo-500',
      stages: [
        { desc: t('Sees peer post on LinkedIn or conference demo', 'Voit une publication de pair sur LinkedIn ou une démo en congrès'), duration: t('1-2 weeks', '1-2 semaines') },
        { desc: t('Free trial, tests with 2-3 clients, checks RGPD', 'Essai gratuit, teste avec 2-3 clients, vérifie le RGPD'), duration: t('2-4 weeks', '2-4 semaines') },
        { desc: t('Sets up practice profile, invites first 5 clients', 'Configure son profil de cabinet, invite ses 5 premiers clients'), duration: t('1 day', '1 jour') },
        { desc: t('Daily: notes, scheduling. Weekly: reviews client progress', 'Quotidien : notes, planification. Hebdomadaire : suivi des progrès'), duration: t('Ongoing', 'Continu') },
        { desc: t('Recommends to supervision group, posts LinkedIn review', 'Recommande à son groupe de supervision, publie un avis sur LinkedIn'), duration: t('Month 3+', 'Mois 3+') },
      ],
    },
    {
      persona: 'Thomas',
      emoji: '👨‍💼',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500',
      stages: [
        { desc: t('Team member shows it, or hears at conference', 'Un membre de l\'équipe le montre, ou il en entend parler en congrès'), duration: t('2-4 weeks', '2-4 semaines') },
        { desc: t('Pilots with 1-2 practitioners, runs ROI analysis', 'Pilote avec 1-2 praticiens, réalise une analyse ROI'), duration: t('6-12 weeks', '6-12 semaines') },
        { desc: t('Rolls out to full team, imports client data', 'Déploie à toute l\'équipe, importe les données clients'), duration: t('1-2 weeks', '1-2 semaines') },
        { desc: t('Reviews team dashboard, monitors outcomes data', 'Consulte le tableau de bord de l\'équipe, suit les données de résultats'), duration: t('Ongoing', 'Continu') },
        { desc: t('Refers to peer practice directors, becomes case study', 'Recommande à d\'autres directeurs, devient étude de cas'), duration: t('Month 6+', 'Mois 6+') },
      ],
    },
    {
      persona: 'Lea',
      emoji: '👩‍💻',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      stages: [
        { desc: t('Therapist says "I want you to try this app"', 'La thérapeute dit « Je veux que vous essayiez cette appli »'), duration: t('In session', 'En séance') },
        { desc: t('Downloads, judges UX in first 3 uses', 'Télécharge, juge l\'UX en 3 utilisations'), duration: t('1 week', '1 semaine') },
        { desc: t('Completes first check-in, explores activities', 'Complète son premier bilan, explore les activités'), duration: '10 min' },
        { desc: t('Daily mood tracking, weekly reflections, shares moments', 'Suivi d\'humeur quotidien, réflexions hebdo, partage de moments'), duration: t('Ongoing', 'Continu') },
        { desc: t('Tells friends in therapy, leaves App Store review', 'En parle à ses amis en thérapie, laisse un avis sur l\'App Store'), duration: t('Month 2+', 'Mois 2+') },
      ],
    },
    {
      persona: 'Sophie',
      emoji: '👩‍👧‍👦',
      color: 'bg-violet-100 text-violet-700 border-violet-200',
      dotColor: 'bg-violet-500',
      stages: [
        { desc: t('Therapist opens app on Sophie\'s phone IN session', 'La thérapeute ouvre l\'appli sur le téléphone de Sophie EN séance'), duration: t('In session', 'En séance') },
        { desc: t('None — therapist sets it up, no self-evaluation', 'Aucune — la thérapeute configure, pas d\'auto-évaluation'), duration: '0' },
        { desc: t('First check-in done with therapist watching', 'Premier bilan fait avec la thérapeute qui observe'), duration: '30 sec' },
        { desc: t('Quick daily check-in between school run and dinner', 'Bilan quotidien rapide entre l\'école et le dîner'), duration: t('Ongoing', 'Continu') },
        { desc: t('Tells other parents at school pickup (word of mouth)', 'En parle aux autres parents à la sortie d\'école (bouche-à-oreille)'), duration: t('Month 3+', 'Mois 3+') },
      ],
    },
  ]
}

// ── Prioritization Matrix ────────────────────────────────────────────────

function PrioritizationMatrix({ t }: { t: TranslateFn }) {
  const dots: Array<{ name: string; emoji: string; x: number; y: number; color: string; label: string }> = [
    { name: 'Marie', emoji: '👩‍⚕️', x: 75, y: 80, color: 'bg-indigo-500', label: t('P0 — Sweet spot', 'P0 — Zone idéale') },
    { name: 'Thomas', emoji: '👨‍💼', x: 30, y: 85, color: 'bg-blue-500', label: t('P1 — High value', 'P1 — Haute valeur') },
    { name: 'Lea', emoji: '👩‍💻', x: 72, y: 30, color: 'bg-emerald-500', label: t('P1 — Organic', 'P1 — Organique') },
    { name: 'Sophie', emoji: '👩‍👧‍👦', x: 25, y: 18, color: 'bg-violet-500', label: t('P2 — Design test', 'P2 — Test de design') },
  ]

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Quadrant labels */}
        <div className="absolute top-3 left-3 text-[9px] text-gray-300 font-medium">{t('Hard to acquire, high revenue', 'Difficile à acquérir, revenu élevé')}</div>
        <div className="absolute top-3 right-3 text-[9px] text-gray-300 font-medium">{t('Easy to acquire, high revenue', 'Facile à acquérir, revenu élevé')}</div>
        <div className="absolute bottom-3 left-3 text-[9px] text-gray-300 font-medium">{t('Hard to acquire, low revenue', 'Difficile à acquérir, revenu faible')}</div>
        <div className="absolute bottom-3 right-3 text-[9px] text-gray-300 font-medium">{t('Easy to acquire, low revenue', 'Facile à acquérir, revenu faible')}</div>

        {/* Grid lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-100" />

        {/* Sweet spot zone */}
        <div className="absolute top-[5%] right-[5%] w-[42%] h-[42%] bg-emerald-50/50 border border-dashed border-emerald-200 rounded-lg flex items-start justify-end p-2">
          <span className="text-[9px] font-semibold text-emerald-400">{t('SWEET SPOT', 'ZONE IDÉALE')}</span>
        </div>

        {/* Axis labels */}
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2">
          <div className="flex items-center gap-12 text-[10px] text-gray-400">
            <span>{t('Hard to acquire', 'Difficile à acquérir')}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{t('Easy to acquire', 'Facile à acquérir')}</span>
          </div>
        </div>
        <div className="absolute top-1/2 -left-0 -translate-x-full -translate-y-1/2 pr-2">
          <div className="flex flex-col items-center gap-8 text-[10px] text-gray-400">
            <span className="rotate-[-90deg] whitespace-nowrap">{t('High revenue', 'Revenu élevé')}</span>
            <span className="rotate-[-90deg] whitespace-nowrap">{t('Low revenue', 'Revenu faible')}</span>
          </div>
        </div>

        {/* Dots */}
        {dots.map((dot) => (
          <div
            key={dot.name}
            className="absolute group"
            style={{ left: `${dot.x}%`, bottom: `${dot.y}%`, transform: 'translate(-50%, 50%)' }}
          >
            <div className={`${dot.color} rounded-full w-4 h-4 ring-4 ring-gray-900/5 transition-transform group-hover:scale-125 flex items-center justify-center`}>
              <span className="text-[8px]">{dot.emoji}</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-gray-900 text-white shadow-sm">
                {dot.name} — {dot.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Persona Card Component ───────────────────────────────────────────────

function PersonaCard({ persona, delay, t }: { persona: Persona; delay: number; t: TranslateFn }) {
  return (
    <motion.div {...fadeUp(delay)} className={`${persona.accentBg} border ${persona.accentBorder} rounded-xl p-6`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">{persona.emoji}</span>
            <span className={`text-base font-bold ${persona.accentText}`}>{persona.name}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
              persona.priority === 'P0' ? 'bg-red-50 text-red-700 border-red-200' :
              persona.priority === 'P1' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {persona.priority}
            </span>
          </div>
          <p className="text-xs text-gray-500">{persona.role} — {persona.tagline}</p>
        </div>
      </div>

      {/* Quote */}
      <div className="bg-white/60 rounded-lg p-4 mb-5 border-l-3 border-gray-300">
        <p className="text-xs text-gray-500 italic leading-relaxed">{persona.quote}</p>
      </div>

      {/* Retention risk callout */}
      {persona.retentionRisk && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">{t('High Retention Risk', 'Risque de rétention élevé')}</p>
            <p className="text-[10px] text-amber-600 leading-relaxed">{persona.retentionRisk}</p>
          </div>
        </div>
      )}

      {/* Demographics — 2x3 grid */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2">{t('Demographics', 'Démographie')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {persona.demographics.map((d) => {
            const Icon = d.icon
            return (
              <div key={d.label} className="bg-white/70 rounded-lg px-3 py-2 flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-gray-400">{d.label}</p>
                  <p className="text-[10px] font-medium text-gray-700">{d.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Psychographics — 4 groups */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2">{t('Psychographics', 'Psychographie')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(persona.psychographics) as [string, string[]][]).map(([group, items]) => {
            const groupLabels: Record<string, string> = {
              values: t('values', 'valeurs'),
              beliefs: t('beliefs', 'croyances'),
              lifestyle: t('lifestyle', 'mode de vie'),
              personality: t('personality', 'personnalité'),
            }
            return (
              <div key={group}>
                <p className={`text-[9px] font-semibold ${persona.accentText} capitalize mb-1`}>{groupLabels[group] || group}</p>
                <ul className="space-y-0.5">
                  {items.map((item, i) => (
                    <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                      <span className={`w-1 h-1 rounded-full ${persona.accentColor} shrink-0 mt-1.5`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pain Points + Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> {t('Pain Points', 'Points de douleur')}
          </p>
          <ul className="space-y-1.5">
            {persona.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('Goals', 'Objectifs')}
          </p>
          <ul className="space-y-1.5">
            {persona.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-gray-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Buying Behavior — 3 col */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <ShoppingCart className="w-3 h-3" /> {t('Buying Behavior', 'Comportement d\'achat')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { key: 'discovery', label: t('Discovery', 'Découverte'), icon: Search },
            { key: 'evaluation', label: t('Evaluation', 'Évaluation'), icon: Eye },
            { key: 'purchase', label: t('Purchase', 'Achat'), icon: CreditCard },
          ] as const).map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-white/70 rounded-lg p-3">
              <p className={`text-[9px] font-semibold ${persona.accentText} mb-1.5 flex items-center gap-1`}>
                <Icon className="w-3 h-3" /> {label}
              </p>
              <ul className="space-y-1">
                {persona.buyingBehavior[key].map((item, i) => (
                  <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                    <span className="text-gray-300 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Media Consumption — 2 col */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Monitor className="w-3 h-3" /> {t('Media Consumption', 'Consommation de médias')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'online', label: t('Online', 'En ligne'), icon: Monitor },
            { key: 'offline', label: t('Offline', 'Hors ligne'), icon: BookOpen },
          ] as const).map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-white/70 rounded-lg p-3">
              <p className={`text-[9px] font-semibold ${persona.accentText} mb-1.5 flex items-center gap-1`}>
                <Icon className="w-3 h-3" /> {label}
              </p>
              <ul className="space-y-0.5">
                {persona.mediaConsumption[key].map((item, i) => (
                  <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                    <span className="text-gray-300 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Objections */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {t('Objections', 'Objections')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {persona.objections.map((obj, i) => (
            <div key={i} className="bg-red-50/60 border border-red-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-red-700 mb-1">{obj.title}</p>
              <p className="text-[10px] text-red-600/80 leading-relaxed">{obj.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Events */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" /> {t('Trigger Events', 'Événements déclencheurs')}
        </p>
        <div className="space-y-2">
          {persona.triggerEvents.map((te, i) => (
            <div key={i} className="bg-white/70 rounded-lg px-3 py-2 flex items-start gap-3">
              <Zap className={`w-3.5 h-3.5 ${persona.accentText} shrink-0 mt-0.5`} />
              <div>
                <p className="text-[10px] font-medium text-gray-700">{te.event}</p>
                <p className="text-[10px] text-gray-400 italic">{te.emotion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Willingness to Pay */}
      <div>
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> {t('Willingness to Pay', 'Disposition à payer')}
        </p>
        <div className="bg-white/70 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">{persona.willingness.range}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
              persona.willingness.sensitivity.startsWith('N/A') ? 'bg-gray-50 text-gray-500 border-gray-200' :
              persona.willingness.sensitivity.includes(t('High', 'Élevée')) ? 'bg-amber-50 text-amber-700 border-amber-200' :
              persona.willingness.sensitivity.includes(t('Low', 'Faible')) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {persona.willingness.sensitivity.split('—')[0].trim()}
            </span>
          </div>
          <div className="space-y-0.5">
            {persona.willingness.comparisons.map((c, i) => (
              <p key={i} className="text-[10px] text-gray-500 flex items-start gap-1">
                <span className="text-gray-300 shrink-0">vs.</span>
                {c}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CustomerPersonasPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const personas = getPersonas(t)
  const segments = getSegments(t)
  const journeyStages = getJourneyStages(t)
  const journeyRows = getJourneyRows(t)

  const b2bPersonas = personas.filter((p) => p.side === 'b2b')
  const b2cPersonas = personas.filter((p) => p.side === 'b2c')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Customer Personas', 'Personas clients')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — Buyer & User Profiles', 'Bloomsline Care — Profils acheteurs et utilisateurs')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Who we\u2019re building for', 'Pour qui nous construisons')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Bloomsline is a dual-sided platform. Practitioners pay (B2B) and their clients use (B2C). Each side has distinct needs, buying behaviors, and success criteria. These four personas define our product decisions, pricing architecture, and go-to-market priorities.',
              'Bloomsline est une plateforme biface. Les praticiens paient (B2B) et leurs clients utilisent (B2C). Chaque côté a des besoins distincts, des comportements d\'achat et des critères de succès différents. Ces quatre personas définissent nos décisions produit, notre architecture de prix et nos priorités de mise en marché.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {personas.map((p) => (
              <span
                key={p.name}
                className={`text-[10px] font-semibold ${p.accentBg} ${p.accentText} px-3 py-1.5 rounded-full border ${p.accentBorder} flex items-center gap-1.5`}
              >
                <span className="text-sm">{p.emoji}</span>
                {p.name} — {p.role}
              </span>
            ))}
          </div>
        </motion.section>

        {/* ── 2. B2B Section Header ────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('Practitioners who pay for Bloomsline', 'Les praticiens qui paient pour Bloomsline')}>{t('The Buyers', 'Les acheteurs')}</SectionTitle>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] text-gray-400">{t('B2B — Revenue engine', 'B2B — Moteur de revenus')}</span>
          </div>

          {/* ── 3-4. Marie & Thomas Cards ──────────────────────── */}
          <div className="space-y-6">
            {b2bPersonas.map((persona, i) => (
              <PersonaCard key={persona.name} persona={persona} delay={0.1 + i * 0.1} t={t} />
            ))}
          </div>
        </motion.section>

        {/* ── 5. B2C Section Header ────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('Members who use Bloomsline through their practitioners', 'Les membres qui utilisent Bloomsline via leurs praticiens')}>{t('The Users', 'Les utilisateurs')}</SectionTitle>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-400">{t('B2C — Free, invited by practitioners', 'B2C — Gratuit, invité par les praticiens')}</span>
          </div>

          {/* ── 6-7. Lea & Sophie Cards ────────────────────────── */}
          <div className="space-y-6">
            {b2cPersonas.map((persona, i) => (
              <PersonaCard key={persona.name} persona={persona} delay={0.35 + i * 0.1} t={t} />
            ))}
          </div>
        </motion.section>

        {/* ── 8. Segment Sizing Table ──────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle={t('How each persona maps to market size and go-to-market priority', 'Comment chaque persona correspond à la taille du marché et aux priorités de mise en marché')}>{t('Segment Sizing', 'Dimensionnement des segments')}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">{t('Segment', 'Segment')}</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Persona</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">{t('% Market', '% Marché')}</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">TAM</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">{t('Priority', 'Priorité')}</th>
                  <th className="text-left py-2 pl-2 text-gray-500 font-medium">{t('Rationale', 'Justification')}</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((seg) => (
                  <tr key={seg.persona} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 pr-3 font-medium text-gray-800">{seg.segment}</td>
                    <td className="py-2.5 px-2 text-gray-600">{seg.persona}</td>
                    <td className="py-2.5 px-2 text-center text-gray-600">{seg.pctMarket}</td>
                    <td className="py-2.5 px-2 text-center font-medium text-gray-800">{seg.tam}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${seg.priorityColor}`}>
                        {seg.priority}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-gray-500 text-[10px]">{seg.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ── 9. Prioritization Matrix (2x2) ──────────────────── */}
        <motion.section {...fadeUp(0.55)}>
          <SectionTitle subtitle={t('Acquisition ease vs. revenue potential — where each persona sits', 'Facilité d\'acquisition vs. potentiel de revenus — où se situe chaque persona')}>{t('Prioritization Matrix', 'Matrice de priorisation')}</SectionTitle>
          <PrioritizationMatrix t={t} />
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {personas.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${p.accentColor}`} />
                <span className="text-[10px] text-gray-500">{p.emoji} {p.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 italic">
            {t(
              'Marie is in the sweet spot — easiest to acquire with highest revenue potential. Start here.',
              'Marie est dans la zone idéale — la plus facile à acquérir avec le potentiel de revenus le plus élevé. Commencez ici.'
            )}
          </p>
        </motion.section>

        {/* ── 10. Journey Map ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <SectionTitle subtitle={t('How each persona enters, evaluates, and progresses through Bloomsline', 'Comment chaque persona entre, évalue et progresse dans Bloomsline')}>{t('Journey Map', 'Carte du parcours')}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-100">
              <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Persona</div>
              {journeyStages.map((stage) => (
                <div key={stage} className="px-2 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
                  {stage}
                </div>
              ))}
            </div>

            {/* Persona rows */}
            {journeyRows.map((row, ri) => (
              <div key={row.persona} className={`grid grid-cols-6 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-50 last:border-0`}>
                <div className="px-3 py-3 flex items-center gap-2">
                  <span className="text-sm">{row.emoji}</span>
                  <span className={`text-[10px] font-semibold ${row.color.split(' ')[1]}`}>{row.persona}</span>
                </div>
                {row.stages.map((stage, si) => (
                  <div key={si} className="px-2 py-3 flex flex-col items-center text-center">
                    <div className={`w-2 h-2 rounded-full ${row.dotColor} mb-1.5`} />
                    <p className="text-[9px] text-gray-600 leading-relaxed mb-1">{stage.desc}</p>
                    <span className="text-[8px] text-gray-400 font-medium">{stage.duration}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            {t(
              'B2B personas (Marie, Thomas) follow a traditional SaaS evaluation path. B2C personas (Lea, Sophie) enter exclusively through their practitioner — zero organic acquisition.',
              'Les personas B2B (Marie, Thomas) suivent un parcours d\'évaluation SaaS classique. Les personas B2C (Lea, Sophie) entrent exclusivement via leur praticien — zéro acquisition organique.'
            )}
          </p>
        </motion.section>

        {/* ── 11. Key Takeaways ────────────────────────────────── */}
        <motion.section {...fadeUp(0.65)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">{t('Key Takeaways', 'Points clés')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">👩‍⚕️</span>
                <div>
                  <p className="text-xs font-semibold text-indigo-300">{t('Marie is the entry point.', 'Marie est le point d\'entrée.')}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{t('Solo practitioners are the fastest to convert, easiest to reach, and bring their clients with them.', 'Les praticiens indépendants convertissent le plus vite, sont les plus faciles à atteindre et amènent leurs clients avec eux.')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👩‍👧‍👦</span>
                <div>
                  <p className="text-xs font-semibold text-violet-300">{t('Sophie is the design constraint.', 'Sophie est la contrainte de design.')}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{t('If Sophie can use it, anyone can. She forces us to build the simplest possible product.', 'Si Sophie peut l\'utiliser, tout le monde peut. Elle nous oblige à construire le produit le plus simple possible.')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👩‍💻</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-300">{t('Lea is the retention engine.', 'Lea est le moteur de rétention.')}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{t('Engaged members generate data that proves practitioner ROI — and 5-8% convert to paid.', 'Les membres engagés génèrent des données qui prouvent le ROI des praticiens — et 5-8 % convertissent en payant.')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👨‍💼</span>
                <div>
                  <p className="text-xs font-semibold text-blue-300">{t('Thomas is the expansion path.', 'Thomas est le vecteur d\'expansion.')}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{t('Group practices mean multi-seat deals, higher ACV, and the credibility to attract institutional partners.', 'Les cabinets de groupe signifient des contrats multi-postes, une VMA plus élevée et la crédibilité pour attirer des partenaires institutionnels.')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 12. Footer ──────────────────────────────────────── */}
        <motion.div {...fadeUp(0.7)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Research as of Feb 2026 — Bloomsline Care', 'Recherche en date de fév. 2026 — Bloomsline Care')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
