'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Map,
  CheckCircle2,
  Circle,
  ArrowRight,
  Monitor,
  Smartphone,
  Globe,
  Brain,
  Users,
  Building2,
  Megaphone,
  PenTool,
  GraduationCap,
  Handshake,
  Rocket,
  TrendingUp,
  Zap,
  Shield,
  Languages,
  Search,
  Video,
  Calendar,
  Star,
  Heart,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

interface RoadmapItem {
  label: string
  done?: boolean
}

interface Track {
  id: string
  title: string
  icon: typeof Monitor
  color: string
  lightBg: string
  textColor: string
  dotColor: string
}

interface Phase {
  id: string
  period: string
  title: string
  subtitle: string
  status: 'done' | 'current' | 'upcoming'
  items: Record<string, RoadmapItem[]>
}

// ── Data builders ────────────────────────────────────────────────────────

function getTracks(t: (en: string, fr: string) => string): Track[] {
  return [
    { id: 'product', title: t('Product & AI', 'Produit & IA'), icon: Brain, color: 'bg-violet-500', lightBg: 'bg-violet-50', textColor: 'text-violet-700', dotColor: 'bg-violet-400' },
    { id: 'b2b', title: t('B2B — Practitioners', 'B2B — Praticiens'), icon: Monitor, color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-400' },
    { id: 'b2c', title: t('B2C — Members', 'B2C — Membres'), icon: Smartphone, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-400' },
    { id: 'digital', title: t('Digital Presence', 'Présence numérique'), icon: Globe, color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-400' },
    { id: 'business', title: t('Business & Team', 'Entreprise & Équipe'), icon: Building2, color: 'bg-rose-500', lightBg: 'bg-rose-50', textColor: 'text-rose-700', dotColor: 'bg-rose-400' },
  ]
}

function getPhases(t: (en: string, fr: string) => string): Phase[] {
  return [
    {
      id: 'done',
      period: 'T3 2025 – T1 2026',
      title: t('Foundation', 'Fondation'),
      subtitle: t('MVP built, beta testing, validation', 'MVP développé, tests bêta, validation'),
      status: 'done',
      items: {
        product: [
          { label: t('Bloom AI companion (Claude-powered)', 'Compagnon Bloom IA (propulsé par Claude)'), done: true },
          { label: t('Bloom Assist — AI clinical note tools', 'Bloom Assist — outils IA de notes cliniques'), done: true },
          { label: t('Pattern detection & wellbeing trends', 'Détection de schémas et tendances de bien-être'), done: true },
          { label: t('i18n framework (EN/FR, ES ready)', 'Framework i18n (EN/FR, ES prêt)'), done: true },
          { label: t('Rate limiting & security layer', 'Limitation de débit et couche de sécurité'), done: true },
        ],
        b2b: [
          { label: t('Practitioner dashboard & member management', 'Tableau de bord praticien et gestion des membres'), done: true },
          { label: t('Session scheduling & Google Calendar sync', 'Planification des séances et synchronisation Google Calendar'), done: true },
          { label: t('Progress notes & milestone tracking', 'Notes de suivi et suivi des étapes clés'), done: true },
          { label: t('Resource library — create & share worksheets', 'Bibliothèque de ressources — créer et partager des fiches'), done: true },
          { label: t('Analytics page (Your Flow)', 'Page d\'analyse (Your Flow)'), done: true },
        ],
        b2c: [
          { label: t('Expo mobile app — full member experience', 'Application mobile Expo — expérience membre complète'), done: true },
          { label: t('Moment capture (photo, voice, text)', 'Capture de moments (photo, voix, texte)'), done: true },
          { label: t('Bloom AI chat — always available companion', 'Chat Bloom IA — compagnon toujours disponible'), done: true },
          { label: t('Mood tracking & daily rituals', 'Suivi de l\'humeur et rituels quotidiens'), done: true },
          { label: t('Milestone progress & celebrations', 'Progression des étapes clés et célébrations'), done: true },
        ],
        digital: [
          { label: t('bloomsline.com — landing page live', 'bloomsline.com — page d\'accueil en ligne'), done: true },
          { label: t('Practitioner public profiles (/p/[slug])', 'Profils publics praticiens (/p/[slug])'), done: true },
          { label: t('Public stories page (/stories/[slug])', 'Page témoignages publics (/stories/[slug])'), done: true },
          { label: t('Early access waitlist system', 'Système de liste d\'attente accès anticipé'), done: true },
          { label: t('PostHog analytics (EU-hosted)', 'Analytique PostHog (hébergé en UE)'), done: true },
        ],
        business: [
          { label: t('SAS incorporated in France', 'SAS immatriculée en France'), done: true },
          { label: t('119 discovery interviews completed', '119 entretiens découverte réalisés'), done: true },
          { label: t('15 beta testers onboarded', '15 testeurs bêta intégrés'), done: true },
          { label: t('Investor data room built', 'Data room investisseur construite'), done: true },
          { label: t('Pitch deck & financial model ready', 'Pitch deck et modèle financier prêts'), done: true },
        ],
      },
    },
    {
      id: 'q2-2026',
      period: 'T2 2026 (Avr – Juin)',
      title: t('Launch & First Revenue', 'Lancement & Premiers revenus'),
      subtitle: t('0 → 10 paying practitioners, prove willingness to pay', '0 → 10 praticiens payants, prouver la disposition à payer'),
      status: 'current',
      items: {
        product: [
          { label: t('Spanish language full support', 'Support complet de la langue espagnole') },
          { label: t('Bloom conversation memory & context improvements', 'Mémoire de conversation Bloom et améliorations du contexte') },
          { label: t('Notification system — email + push (Postmark)', 'Système de notifications — e-mail + push (Postmark)') },
          { label: t('Practitioner onboarding flow optimization', 'Optimisation du parcours d\'intégration praticien') },
        ],
        b2b: [
          { label: t('Payment integration — Stripe billing (€19/29/49 tiers)', 'Intégration de paiement — facturation Stripe (paliers 19/29/49 €)') },
          { label: t('Practitioner settings & profile customization', 'Paramètres praticien et personnalisation du profil') },
          { label: t('Session recap — AI-generated pre-session brief', 'Résumé de séance — brief pré-séance généré par IA') },
          { label: t('Member invite flow (email + link)', 'Parcours d\'invitation membre (e-mail + lien)') },
        ],
        b2c: [
          { label: t('Push notifications (session reminders, Bloom nudges)', 'Notifications push (rappels de séance, coups de pouce Bloom)') },
          { label: t('Offline mode — capture moments without internet', 'Mode hors ligne — capturer des moments sans internet') },
          { label: t('Improved onboarding (member welcome journey)', 'Intégration améliorée (parcours d\'accueil membre)') },
          { label: t('Session booking from mobile app', 'Réservation de séance depuis l\'application mobile') },
        ],
        digital: [
          { label: t('French blog launch — bi-weekly SEO articles', 'Lancement du blog français — articles SEO bimensuels') },
          { label: t('LinkedIn presence — founder-led content on practitioner pain points', 'Présence LinkedIn — contenu fondateur sur les difficultés des praticiens') },
          { label: t('Practitioner testimonial videos (2-3 beta users)', 'Vidéos témoignages praticiens (2-3 utilisateurs bêta)') },
          { label: t('HubSpot CRM pipeline for practitioner leads', 'Pipeline CRM HubSpot pour leads praticiens') },
        ],
        business: [
          { label: t('Close pre-seed round (€400K-500K for 18 months runway)', 'Clôturer le tour pré-seed (400-500 K€ pour 18 mois de trésorerie)') },
          { label: t('First 10 paying practitioners (from beta converts + outbound)', '10 premiers praticiens payants (conversions bêta + prospection)') },
          { label: t('Attend first conference (AFTCC or similar)', 'Participer à la première conférence (AFTCC ou similaire)') },
          { label: t('Launch referral program (1 free month per referral)', 'Lancer le programme de parrainage (1 mois offert par parrainage)') },
        ],
      },
    },
    {
      id: 'q3-2026',
      period: 'T3 2026 (Juil – Sep)',
      title: t('Grow & Iterate', 'Croître & Itérer'),
      subtitle: t('10 → 30 practitioners, first organic signups', '10 → 30 praticiens, premières inscriptions organiques'),
      status: 'upcoming',
      items: {
        product: [
          { label: t('Bloom AI improvements based on user feedback', 'Améliorations Bloom IA basées sur les retours utilisateurs') },
          { label: t('Session prep summaries — pull recent member data for practitioners', 'Résumés de préparation de séance — données récentes du membre pour le praticien') },
          { label: t('Member progress reports (shareable with practitioner)', 'Rapports de progression membre (partageables avec le praticien)') },
          { label: t('Performance and reliability fixes as usage grows', 'Corrections de performance et fiabilité à mesure que l\'usage augmente') },
        ],
        b2b: [
          { label: t('Exportable clinical reports (PDF)', 'Rapports cliniques exportables (PDF)') },
          { label: t('Custom resource templates', 'Modèles de ressources personnalisés') },
          { label: t('Practitioner referral program (invite a colleague)', 'Programme de parrainage praticien (inviter un collègue)') },
          { label: t('Group practice support — if demand warrants it', 'Support cabinet de groupe — si la demande le justifie') },
        ],
        b2c: [
          { label: t('Guided journaling prompts (AI-personalized)', 'Invitations de journal guidé (personnalisé par IA)') },
          { label: t('Widget for quick mood check-in (iOS/Android)', 'Widget de vérification rapide de l\'humeur (iOS/Android)') },
          { label: t('Offline mode improvements', 'Améliorations du mode hors ligne') },
          { label: t('Member engagement improvements based on usage data', 'Améliorations de l\'engagement membre basées sur les données d\'usage') },
        ],
        digital: [
          { label: t('SEO target: 200+ organic monthly visits', 'Objectif SEO : 200+ visites organiques mensuelles') },
          { label: t('Guest on 1-2 French psych podcasts', 'Invité sur 1-2 podcasts français de psychologie') },
          { label: t('First case study published from an early adopter', 'Première étude de cas publiée d\'un adopteur précoce') },
          { label: t('Conference attendance — networking, not booths yet', 'Participation à une conférence — networking, pas encore de stand') },
        ],
        business: [
          { label: t('Evaluate first hire — customer success or support', 'Évaluer la première embauche — succès client ou support') },
          { label: t('Begin conversations with training institutes (AFTCC, IFFORTHECC)', 'Engager les conversations avec les instituts de formation (AFTCC, IFFORTHECC)') },
          { label: t('First organic or referral signups', 'Premières inscriptions organiques ou par parrainage') },
          { label: t('Monthly burn stable at <€10K/mo', 'Dépenses mensuelles stables à < 10 K€/mois') },
        ],
      },
    },
    {
      id: 'q4-2026',
      period: 'T4 2026 (Oct – Déc)',
      title: t('Consolidate & Expand', 'Consolider & Développer'),
      subtitle: t('30 → 50+ practitioners, refine unit economics', '30 → 50+ praticiens, affiner les métriques unitaires'),
      status: 'upcoming',
      items: {
        product: [
          { label: t('Bloom AI improvements — voice note analysis if validated', 'Améliorations Bloom IA — analyse de notes vocales si validée') },
          { label: t('Outcomes measurement — track what works for practitioners', 'Mesure des résultats — suivre ce qui fonctionne pour les praticiens') },
          { label: t('Begin HDS-certified hosting evaluation (required for enterprise in France)', 'Commencer l\'évaluation d\'hébergement certifié HDS (requis pour l\'entreprise en France)') },
          { label: t('Evaluate EHR integration needs based on practitioner requests', 'Évaluer les besoins d\'intégration DSE selon les demandes des praticiens') },
        ],
        b2b: [
          { label: t('Group practice pricing — if enough demand from Q3', 'Tarification cabinet de groupe — si assez de demande du T3') },
          { label: t('Admin dashboard for multi-practitioner accounts', 'Tableau de bord admin pour comptes multi-praticiens') },
          { label: t('Insurance/reimbursement pathway exploration', 'Exploration du parcours assurance/remboursement') },
          { label: t('Explore expansion to French-speaking markets (Belgium, Switzerland)', 'Explorer l\'expansion sur les marchés francophones (Belgique, Suisse)') },
        ],
        b2c: [
          { label: t('Personalized wellbeing suggestions based on usage patterns', 'Suggestions de bien-être personnalisées basées sur les habitudes d\'usage') },
          { label: t('Celebrate milestones — shareable progress cards', 'Célébrer les étapes — cartes de progression partageables') },
          { label: t('Apple Health integration (if validated by member feedback)', 'Intégration Apple Health (si validée par les retours membres)') },
          { label: t('Continued mobile app polish based on real usage', 'Amélioration continue de l\'app mobile basée sur l\'usage réel') },
        ],
        digital: [
          { label: t('SEO target: 500+ organic monthly visits', 'Objectif SEO : 500+ visites organiques mensuelles') },
          { label: t('2-3 published case studies with real practitioner data', '2-3 études de cas publiées avec des données praticien réelles') },
          { label: t('Co-marketing with one training institute if partnership closes', 'Co-marketing avec un institut de formation si le partenariat aboutit') },
          { label: t('Double down on whatever channel is working', 'Doubler les efforts sur le canal qui fonctionne') },
        ],
        business: [
          { label: t('First or second hire depending on traction', 'Première ou deuxième embauche selon la traction') },
          { label: t('Build data package: retention, NPS, unit economics', 'Construire le dossier de données : rétention, NPS, métriques unitaires') },
          { label: t('Referrals growing as % of new signups', 'Parrainages en croissance en % des nouvelles inscriptions') },
          { label: t('Evaluate if ready for seed round conversations', 'Évaluer si prêt pour les discussions de tour d\'amorçage') },
        ],
      },
    },
    {
      id: '2027',
      period: '2027',
      title: t('Seed Round & Growth', 'Tour d\'amorçage & Croissance'),
      subtitle: t('If traction supports it: raise seed, expand team, enter new markets', 'Si la traction le justifie : lever un tour d\'amorçage, agrandir l\'équipe, entrer sur de nouveaux marchés'),
      status: 'upcoming',
      items: {
        product: [
          { label: t('Bloom AI — deeper personalization based on 12+ months of data', 'Bloom IA — personnalisation plus poussée basée sur 12+ mois de données') },
          { label: t('Clinical evidence package from real usage outcomes', 'Dossier de preuves cliniques à partir des résultats d\'usage réels') },
          { label: t('Open API for partner integrations if enterprise demand exists', 'API ouverte pour intégrations partenaires si la demande entreprise existe') },
        ],
        b2b: [
          { label: t('UK or Germany market entry — one new market at a time', 'Entrée sur le marché UK ou Allemagne — un nouveau marché à la fois') },
          { label: t('Explore employee assistance program channel', 'Explorer le canal programmes d\'aide aux employés') },
          { label: t('Add German or English practitioner support based on expansion market', 'Ajouter le support praticien allemand ou anglais selon le marché d\'expansion') },
        ],
        b2c: [
          { label: t('Bloom voice companion — explore real-time audio if tech matures', 'Compagnon vocal Bloom — explorer l\'audio en temps réel si la technologie mûrit') },
          { label: t('Self-guided programs based on practitioner input', 'Programmes en autonomie basés sur les retours des praticiens') },
          { label: t('Mobile app features driven by actual member usage data', 'Fonctionnalités mobile guidées par les données d\'usage réel des membres') },
        ],
        digital: [
          { label: t('SEO in expansion market (UK or DE)', 'SEO sur le marché d\'expansion (UK ou DE)') },
          { label: t('Conference speaking if brand awareness warrants it', 'Conférences si la notoriété de la marque le justifie') },
          { label: t('Content partnerships with practitioner training organizations', 'Partenariats de contenu avec les organisations de formation de praticiens') },
        ],
        business: [
          { label: t('Raise seed round if pre-seed metrics support it', 'Lever un tour d\'amorçage si les métriques pré-seed le justifient') },
          { label: t('Team to 4-6 people', 'Équipe de 4-6 personnes') },
          { label: t('Focus remains Europe — North America is years away', 'Le focus reste l\'Europe — l\'Amérique du Nord est à des années') },
        ],
      },
    },
  ]
}

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function StatusBadge({ status, t }: { status: 'done' | 'current' | 'upcoming'; t: (en: string, fr: string) => string }) {
  if (status === 'done') return <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t('Completed', 'Terminé')}</span>
  if (status === 'current') return <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">{t('In Progress', 'En cours')}</span>
  return <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t('Planned', 'Planifié')}</span>
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const TRACKS = getTracks(t)
  const PHASES = getPhases(t)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Map className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Product Roadmap', 'Feuille de route produit')}</h1>
              <p className="text-[10px] text-gray-400">{t("Bloomsline Care — Where We're Going", 'Bloomsline Care — Notre trajectoire')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-10">

        {/* ── Intro ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Building the Care Platform', 'Construire la plateforme de soin')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              'Our roadmap across product, practitioner tools, member experience, digital presence, and business growth. We are a 2-person team (product/tech + sales/ops), pre-revenue, with 15 beta testers and 119 discovery interviews completed. Priorities shift based on what practitioners actually need.',
              'Notre feuille de route couvrant le produit, les outils praticiens, l\'expérience membre, la présence numérique et la croissance. Nous sommes une équipe de 2 personnes (produit/tech + ventes/ops), pré-revenu, avec 15 testeurs bêta et 119 entretiens découverte réalisés. Les priorités évoluent selon les besoins réels des praticiens.'
            )}
          </p>
        </motion.div>

        {/* ── Track Legend ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="flex flex-wrap items-center gap-3">
          {TRACKS.map((track) => {
            const Icon = track.icon
            return (
              <div key={track.id} className={`${track.lightBg} rounded-lg px-3 py-1.5 flex items-center gap-2`}>
                <Icon className={`w-3.5 h-3.5 ${track.textColor}`} />
                <span className={`text-[10px] font-semibold ${track.textColor}`}>{track.title}</span>
              </div>
            )
          })}
        </motion.div>

        {/* ── Timeline ────────────────────────────────────────────── */}
        <div className="space-y-8">
          {PHASES.map((phase, pi) => (
            <motion.div
              key={phase.id}
              {...fadeUp}
              transition={{ delay: 0.1 + pi * 0.05 }}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  phase.status === 'done' ? 'bg-emerald-500' :
                  phase.status === 'current' ? 'bg-blue-600' :
                  'bg-gray-300'
                }`}>
                  {phase.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : phase.status === 'current' ? (
                    <Zap className="w-5 h-5 text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{phase.title}</h3>
                    <StatusBadge status={phase.status} t={t} />
                  </div>
                  <p className="text-[10px] text-gray-400">{phase.period} — {phase.subtitle}</p>
                </div>
              </div>

              {/* Track Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 ml-[52px]">
                {TRACKS.map((track) => {
                  const items = phase.items[track.id] || []
                  const Icon = track.icon
                  return (
                    <div
                      key={track.id}
                      className={`${phase.status === 'done' ? 'bg-white' : track.lightBg} border ${
                        phase.status === 'done' ? 'border-gray-200' : 'border-transparent'
                      } rounded-xl p-3`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${track.dotColor}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          phase.status === 'done' ? 'text-gray-400' : track.textColor
                        }`}>{track.title}</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <div key={item.label} className="flex items-start gap-1.5">
                            {item.done ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
                            )}
                            <span className={`text-[10px] leading-tight ${
                              item.done ? 'text-gray-400' : 'text-gray-600'
                            }`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Vision Summary ──────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-3">{t('Where We Want to Be', 'Où nous voulons aller')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t('End of 2026', 'Fin 2026')}</p>
              <p className="text-xs text-gray-300">{t(
                '50+ paying practitioners in France. Clear retention and unit economics. Practitioners actively referring colleagues. Ready to evaluate seed round.',
                '50+ praticiens payants en France. Rétention et métriques unitaires claires. Les praticiens recommandent activement leurs collègues. Prêt à évaluer un tour d\'amorçage.'
              )}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">2027</p>
              <p className="text-xs text-gray-300">{t(
                'Enter one new European market (UK or Germany). Team of 4-6. Deeper AI features based on real usage data. Enterprise exploration.',
                'Entrer sur un nouveau marché européen (UK ou Allemagne). Équipe de 4-6. Fonctionnalités IA plus poussées basées sur les données d\'usage réel. Exploration entreprise.'
              )}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t('Long Term', 'Long terme')}</p>
              <p className="text-xs text-gray-300">{t(
                'The go-to platform for practitioners who want to stay connected with their clients between sessions. Built on real clinical needs, not hype.',
                'La plateforme de référence pour les praticiens qui veulent rester connectés avec leurs clients entre les séances. Construite sur des besoins cliniques réels, pas sur des effets de mode.'
              )}</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t(
              'Roadmap is iterative — priorities shift based on practitioner feedback and market signals.',
              'La feuille de route est itérative — les priorités évoluent selon les retours des praticiens et les signaux du marché.'
            )}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
