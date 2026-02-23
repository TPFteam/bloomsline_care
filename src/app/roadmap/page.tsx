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
          { label: t('187 discovery interviews (68 practitioners, 119 users)', '187 entretiens découverte (68 praticiens, 119 utilisateurs)'), done: true },
          { label: t('3-5 beta testers onboarded', '3-5 testeurs bêta intégrés'), done: true },
          { label: t('Investor data room built', 'Data room investisseur construite'), done: true },
          { label: t('Pitch deck & financial model ready', 'Pitch deck et modèle financier prêts'), done: true },
        ],
      },
    },
    {
      id: 'q2-2026',
      period: 'T2 2026 (Avr – Juin)',
      title: t('Launch & Validate', 'Lancement & Validation'),
      subtitle: t('10 → 30 paying practitioners, prove willingness to pay', '10 → 30 praticiens payants, prouver la disposition à payer'),
      status: 'current',
      items: {
        product: [
          { label: t('Spanish language full support', 'Support complet de la langue espagnole') },
          { label: t('Bloom conversation memory & context improvements', 'Mémoire de conversation Bloom et améliorations du contexte') },
          { label: t('Notification system — email + push (Postmark)', 'Système de notifications — e-mail + push (Postmark)') },
          { label: t('Practitioner onboarding flow optimization', 'Optimisation du parcours d\'intégration praticien') },
        ],
        b2b: [
          { label: t('Payment integration — Stripe billing (€25/mo)', 'Intégration de paiement — facturation Stripe (25 €/mois)') },
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
          { label: t('French blog launch — weekly SEO content', 'Lancement du blog français — contenu SEO hebdomadaire') },
          { label: t('LinkedIn presence — founder-led thought leadership', 'Présence LinkedIn — leadership d\'opinion par le fondateur') },
          { label: t('Practitioner testimonial videos (2-3 beta users)', 'Vidéos témoignages praticiens (2-3 utilisateurs bêta)') },
          { label: t('HubSpot CRM pipeline for practitioner leads', 'Pipeline CRM HubSpot pour leads praticiens') },
        ],
        business: [
          { label: t('Close pre-seed round (€250-400K)', 'Clôturer le tour pré-seed (250-400 K€)') },
          { label: t('First 10 paying practitioners', '10 premiers praticiens payants') },
          { label: t('Attend first conference (AFTCC or similar)', 'Participer à la première conférence (AFTCC ou similaire)') },
          { label: t('Launch referral program (1 free month per referral)', 'Lancer le programme de parrainage (1 mois offert par parrainage)') },
        ],
      },
    },
    {
      id: 'q3-2026',
      period: 'T3 2026 (Juil – Sep)',
      title: t('Grow & Iterate', 'Croître & Itérer'),
      subtitle: t('30 → 100 practitioners, organic inbound begins', '30 → 100 praticiens, début de l\'acquisition organique'),
      status: 'upcoming',
      items: {
        product: [
          { label: t('Advanced Bloom — emotional pattern summaries', 'Bloom avancé — résumés de schémas émotionnels') },
          { label: t('Practitioner copilot v2 — smarter session prep', 'Copilote praticien v2 — préparation de séance plus intelligente') },
          { label: t('Member progress reports (shareable with practitioner)', 'Rapports de progression membre (partageables avec le praticien)') },
          { label: t('API performance optimization for scale', 'Optimisation des performances API pour le passage à l\'échelle') },
        ],
        b2b: [
          { label: t('Group practice support (multi-practitioner accounts)', 'Support cabinet de groupe (comptes multi-praticiens)') },
          { label: t('Exportable clinical reports (PDF)', 'Rapports cliniques exportables (PDF)') },
          { label: t('Practitioner-to-practitioner referral system', 'Système d\'orientation entre praticiens') },
          { label: t('Custom resource templates', 'Modèles de ressources personnalisés') },
        ],
        b2c: [
          { label: t('Guided journaling prompts (AI-personalized)', 'Invitations de journal guidé (personnalisé par IA)') },
          { label: t('Sleep tracking integration', 'Intégration du suivi du sommeil') },
          { label: t('Community features — anonymous peer support', 'Fonctionnalités communautaires — soutien anonyme entre pairs') },
          { label: t('Widget for quick mood check-in (iOS/Android)', 'Widget de vérification rapide de l\'humeur (iOS/Android)') },
        ],
        digital: [
          { label: t('SEO compounding — target 500+ organic monthly visits', 'Effet cumulatif SEO — objectif 500+ visites organiques mensuelles') },
          { label: t('Guest on 2-3 French psych podcasts', 'Invité sur 2-3 podcasts français de psychologie') },
          { label: t('Case studies published from early adopters', 'Études de cas publiées d\'adopteurs précoces') },
          { label: t('Conference presence — demo booth at major event', 'Présence en conférence — stand de démo à un événement majeur') },
        ],
        business: [
          { label: t('First hire — customer success / support', 'Première embauche — succès client / support') },
          { label: t('Training institute partnerships (AFTCC, IFFORTHECC)', 'Partenariats avec des instituts de formation (AFTCC, IFFORTHECC)') },
          { label: t('First organic/referral signups (inflection point)', 'Premières inscriptions organiques/parrainage (point d\'inflexion)') },
          { label: t('Monthly burn stable at <€10K/mo', 'Dépenses mensuelles stables à < 10 K€/mois') },
        ],
      },
    },
    {
      id: 'q4-2026',
      period: 'T4 2026 (Oct – Déc)',
      title: t('Scale & Expand', 'Croissance & Expansion'),
      subtitle: t('100 → 200+ practitioners, Series A prep', '100 → 200+ praticiens, préparation Série A'),
      status: 'upcoming',
      items: {
        product: [
          { label: t('Bloom AI v3 — multi-modal (voice notes analysis)', 'Bloom IA v3 — multimodal (analyse de notes vocales)') },
          { label: t('Outcomes measurement framework', 'Cadre de mesure des résultats') },
          { label: t('HDS-certified hosting evaluation (for enterprise)', 'Évaluation d\'hébergement certifié HDS (pour entreprise)') },
          { label: t('API for third-party EHR integrations', 'API pour intégrations de DSE tiers') },
        ],
        b2b: [
          { label: t('Enterprise plan — clinic / group practice pricing', 'Offre entreprise — tarification cabinet / groupe') },
          { label: t('Admin dashboard for practice managers', 'Tableau de bord administrateur pour responsables de cabinet') },
          { label: t('Insurance/reimbursement pathway exploration', 'Exploration du parcours assurance/remboursement') },
          { label: t('White-label option for large practices', 'Option marque blanche pour grands cabinets') },
        ],
        b2c: [
          { label: t('Personalized wellbeing programs (AI-generated)', 'Programmes de bien-être personnalisés (générés par IA)') },
          { label: t('Family/couple mode (shared care journeys)', 'Mode famille/couple (parcours de soin partagés)') },
          { label: t('Wearable integrations (Apple Health, Fitbit)', 'Intégrations objets connectés (Apple Health, Fitbit)') },
          { label: t('Celebrate milestones — shareable achievement cards', 'Célébrer les étapes — cartes de réussite partageables') },
        ],
        digital: [
          { label: t('Expand to French-speaking markets (Belgium, Switzerland)', 'Expansion sur les marchés francophones (Belgique, Suisse)') },
          { label: t('SEO target: 2,000+ organic monthly visits', 'Objectif SEO : 2 000+ visites organiques mensuelles') },
          { label: t('YouTube channel — practitioner education content', 'Chaîne YouTube — contenu éducatif pour praticiens') },
          { label: t('Partnership co-marketing with training institutes', 'Co-marketing en partenariat avec les instituts de formation') },
        ],
        business: [
          { label: t('Second hire — full-stack developer', 'Deuxième embauche — développeur full-stack') },
          { label: t('Series A data package (retention, NPS, unit economics)', 'Dossier de données Série A (rétention, NPS, unit economics)') },
          { label: t('Referrals = 20-30% of new signups', 'Parrainages = 20-30 % des nouvelles inscriptions') },
          { label: t('Start Series A conversations', 'Débuter les discussions Série A') },
        ],
      },
    },
    {
      id: '2027',
      period: '2027',
      title: t('Series A & Beyond', 'Série A & Au-delà'),
      subtitle: t('European expansion, enterprise, advanced AI', 'Expansion européenne, entreprise, IA avancée'),
      status: 'upcoming',
      items: {
        product: [
          { label: t('Bloom AI v4 — predictive wellbeing alerts', 'Bloom IA v4 — alertes prédictives de bien-être') },
          { label: t('Clinical evidence package (outcome data)', 'Dossier de preuves cliniques (données de résultats)') },
          { label: t('Open API for partner integrations', 'API ouverte pour intégrations partenaires') },
        ],
        b2b: [
          { label: t('UK & Germany market entry', 'Entrée sur les marchés UK et Allemagne') },
          { label: t('EAP (Employee Assistance Program) channel', 'Canal PAE (Programme d\'Aide aux Employés)') },
          { label: t('Multi-language practitioner support (DE, IT, PT)', 'Support praticien multilingue (DE, IT, PT)') },
        ],
        b2c: [
          { label: t('Bloom voice companion (real-time audio)', 'Compagnon vocal Bloom (audio en temps réel)') },
          { label: t('AR/VR mindfulness experiences', 'Expériences de pleine conscience AR/VR') },
          { label: t('Self-guided therapeutic programs', 'Programmes thérapeutiques en autonomie') },
        ],
        digital: [
          { label: t('Multi-market SEO (UK, DE, Benelux)', 'SEO multi-marchés (UK, DE, Benelux)') },
          { label: t('Thought leadership — conference speaking circuit', 'Leadership d\'opinion — circuit de conférences') },
          { label: t('Strategic media partnerships', 'Partenariats médias stratégiques') },
        ],
        business: [
          { label: t('Raise Series A', 'Lever la Série A') },
          { label: t('Team to 8-12 people', 'Équipe de 8-12 personnes') },
          { label: t('North America exploration', 'Exploration de l\'Amérique du Nord') },
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
              'From MVP to market leader — our roadmap across product, B2B practitioner tools, B2C member experience, digital presence, and business growth. Built iteratively based on real practitioner feedback.',
              'Du MVP au leader du marché — notre feuille de route couvrant le produit, les outils B2B pour praticiens, l\'expérience B2C pour les membres, la présence numérique et la croissance de l\'entreprise. Construit de manière itérative à partir de retours réels de praticiens.'
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
          <h3 className="text-sm font-semibold mb-3">{t('The Vision', 'La Vision')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t('End of 2026', 'Fin 2026')}</p>
              <p className="text-xs text-gray-300">{t(
                '200+ practitioners across France. Proven B2B2C flywheel. Series A ready with real traction data.',
                '200+ praticiens en France. Boucle B2B2C prouvée. Prêt pour la Série A avec des données de traction réelles.'
              )}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">2027</p>
              <p className="text-xs text-gray-300">{t(
                'European expansion (UK, Germany, Benelux). Enterprise channel. Team of 8-12. Advanced AI companion.',
                'Expansion européenne (UK, Allemagne, Benelux). Canal entreprise. Équipe de 8-12. Compagnon IA avancé.'
              )}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t('Long Term', 'Long terme')}</p>
              <p className="text-xs text-gray-300">{t(
                'The default platform for therapeutic care between sessions. Every practitioner, every member, connected through AI.',
                'La plateforme de référence pour le soin thérapeutique entre les séances. Chaque praticien, chaque membre, connectés grâce à l\'IA.'
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
