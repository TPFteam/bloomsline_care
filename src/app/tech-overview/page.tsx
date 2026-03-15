'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu,
  Shield,
  Globe,
  Zap,
  Database,
  Brain,
  Mail,
  BarChart3,
  Calendar,
  Smartphone,
  Lock,
  Languages,
  MonitorSmartphone,
  Server,
  Layers,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Monitor,
  Users,
  MessageSquare,
  Bell,
  Activity,
} from 'lucide-react'

// ── Translation helper type ──────────────────────────────────────────────
type T = (en: string, fr: string) => string

// ── Data (functions accepting t) ─────────────────────────────────────────

function getStackLayers(t: T) {
  return [
    {
      title: t('Frontend', 'Interface'),
      icon: MonitorSmartphone,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50 text-blue-600',
      items: [
        { name: 'Next.js 16', detail: t('App Router, SSR, API routes', 'App Router, SSR, routes API') },
        { name: 'React 19', detail: t('Latest with Server Components', 'Version la plus recente avec Server Components') },
        { name: 'TypeScript', detail: t('End-to-end type safety', 'Typage de bout en bout') },
        { name: 'Tailwind CSS 4', detail: t('Utility-first styling', 'Stylisation utilitaire') },
        { name: 'Framer Motion', detail: t('Smooth animations & transitions', 'Animations et transitions fluides') },
        { name: 'Recharts 3.6', detail: t('Interactive data visualizations', 'Visualisations de donnees interactives') },
        { name: 'Radix UI', detail: t('Accessible headless components', 'Composants accessibles sans interface') },
        { name: 'React Hook Form + Zod', detail: t('Form handling & validation', 'Gestion et validation de formulaires') },
      ],
    },
    {
      title: t('Backend & Database', 'Backend et base de donnees'),
      icon: Database,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50 text-emerald-600',
      items: [
        { name: 'Supabase PostgreSQL', detail: t('Primary database with real-time subscriptions', 'Base de donnees principale avec abonnements en temps reel') },
        { name: 'Supabase Auth', detail: t('Google OAuth + magic links + session management', 'Google OAuth + liens magiques + gestion de sessions') },
        { name: 'Row Level Security', detail: t('Database-level access control per user', 'Controle d\'acces au niveau de la base par utilisateur') },
        { name: t('Next.js API Routes', 'Routes API Next.js'), detail: t('24+ REST endpoints with middleware', '24+ points d\'acces REST avec middleware') },
        { name: 'Zustand + TanStack Query', detail: t('Client state & server cache management', 'Gestion de l\'etat client et du cache serveur') },
        { name: t('Rate Limiting', 'Limitation de debit'), detail: t('Upstash Redis distributed throttling (public, auth, AI)', 'Limitation distribuee Upstash Redis par route (public, auth, IA)') },
      ],
    },
    {
      title: t('AI Engine', 'Moteur IA'),
      icon: Brain,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50 text-violet-600',
      items: [
        { name: 'Anthropic Claude API', detail: t('Primary LLM for all AI features', 'LLM principal pour toutes les fonctionnalites IA') },
        { name: 'Claude Haiku', detail: t('Cost-optimized conversations (~\u20AC1.80/user/mo)', 'Conversations optimisees en cout (~1,80\u20AC/utilisateur/mois)') },
        { name: 'Claude Sonnet', detail: t('Complex tasks \u2014 summaries, pattern analysis', 'Taches complexes \u2014 resumes, analyse de tendances') },
        { name: 'Bloom Chat', detail: t('AI companion for member self-reflection', 'Compagnon IA pour l\'auto-reflexion des membres') },
        { name: 'Bloom Assist', detail: t('Practitioner copilot for clinical notes', 'Copilote praticien pour les notes cliniques') },
      ],
    },
    {
      title: t('External Services', 'Services externes'),
      icon: Layers,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50 text-amber-600',
      items: [
        { name: 'Google Calendar API', detail: t('OAuth 2.0 \u2014 session booking & sync', 'OAuth 2.0 \u2014 reservation de sessions et synchronisation') },
        { name: 'Postmark', detail: t('Transactional emails (hi@bloomsline.com)', 'Emails transactionnels (hi@bloomsline.com)') },
        { name: 'PostHog', detail: t('Product analytics & session recording (EU-hosted)', 'Analytique produit et enregistrement de sessions (heberge en UE)') },
        { name: 'HubSpot', detail: t('CRM, feedback tickets & file uploads', 'CRM, tickets de retour et telechargement de fichiers') },
        { name: 'Google OAuth', detail: t('Social login for practitioners', 'Connexion sociale pour les praticiens') },
        { name: 'Upstash Redis', detail: t('Distributed rate limiting across serverless instances (EU region)', 'Limitation de debit distribuee entre instances serverless (region UE)') },
        { name: 'Expo (React Native)', detail: t('Cross-platform member mobile app', 'Application mobile multiplateforme pour les membres') },
      ],
    },
  ]
}

function getSecurityFeatures(t: T) {
  return [
    { icon: Lock, label: t('AES-256-GCM encryption', 'Chiffrement AES-256-GCM'), detail: t('OAuth tokens & sensitive data encrypted at rest', 'Tokens OAuth et donnees sensibles chiffrees au repos') },
    { icon: Shield, label: 'Row Level Security', detail: t('Postgres RLS on every table \u2014 data isolation per user', 'RLS Postgres sur chaque table \u2014 isolation des donnees par utilisateur') },
    { icon: Zap, label: t('Distributed rate limiting', 'Limitation de debit distribuee'), detail: t('Upstash Redis \u2014 per-route throttling across serverless instances (public, auth, AI tiers)', 'Upstash Redis \u2014 limitation par route entre instances serverless (niveaux public, auth, IA)') },
    { icon: Globe, label: t('GDPR-ready', 'Conforme au RGPD'), detail: t('EU-hosted analytics (PostHog EU), cookie consent, data control', 'Analytique hebergee en UE (PostHog EU), consentement cookies, controle des donnees') },
    { icon: Shield, label: t('CI/CD security pipeline', 'Pipeline de securite CI/CD'), detail: t('GitHub Actions \u2014 automated build checks, dependency audits, secret detection on every push', 'GitHub Actions \u2014 verifications de build automatisees, audits de dependances, detection de secrets a chaque push') },
    { icon: Lock, label: t('Security headers', 'En-tetes de securite'), detail: t('HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy', 'HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy') },
  ]
}

function getKeyNumbers(t: T) {
  return [
    { value: '24+', label: t('API endpoints', 'Points d\'acces API'), icon: Server },
    { value: '3', label: t('Languages (EN/FR/ES)', 'Langues (EN/FR/ES)'), icon: Languages },
    { value: '6', label: t('External services integrated', 'Services externes integres'), icon: Layers },
    { value: '2', label: t('Platforms (Web + Mobile)', 'Plateformes (Web + Mobile)'), icon: Smartphone },
  ]
}

function getAiFeatures(t: T) {
  return [
    { name: 'Bloom Chat', description: t('Conversational AI companion for member self-reflection and wellbeing tracking', 'Compagnon IA conversationnel pour l\'auto-reflexion et le suivi du bien-etre des membres') },
    { name: 'Bloom Assist', description: t('Quick-action AI for practitioners \u2014 summarize sessions, extract themes, suggest focus areas', 'IA d\'action rapide pour les praticiens \u2014 resumer les sessions, extraire les themes, suggerer des axes de travail') },
    { name: t('Pattern Detection', 'Detection de tendances'), description: t('Identifies wellbeing trends across mood and activity data logged by members', 'Identifie les tendances de bien-etre a travers les donnees d\'humeur et d\'activite enregistrees par les membres') },
    { name: t('Notifications', 'Notifications'), description: t('Email and in-app notifications for session reminders, member invitations, and milestone updates. Delivered via Postmark.', 'Notifications par email et dans l\'app pour les rappels de seance, invitations membre, et mises a jour de jalons. Envoyees via Postmark.') },
  ]
}

function getApiDomains(t: T) {
  return [
    { domain: t('Auth & Users', 'Auth et utilisateurs'), endpoints: t('Setup member, create profile, update language, Google OAuth', 'Configurer un membre, creer un profil, mettre a jour la langue, Google OAuth'), count: 4 },
    { domain: 'Bloom AI', endpoints: t('Chat, greeting, patterns, assist, extract, summarize, practitioner chat', 'Chat, accueil, tendances, assistance, extraction, resume, chat praticien'), count: 7 },
    { domain: t('Calendar & Booking', 'Calendrier et reservations'), endpoints: t('Google OAuth flow, calendar events, create/update bookings, sync', 'Flux Google OAuth, evenements de calendrier, creation/mise a jour de reservations, synchronisation'), count: 6 },
    { domain: 'Notifications', endpoints: t('Fetch, send, mark read, mark all read, preferences', 'Recuperer, envoyer, marquer comme lu, tout marquer comme lu, preferences'), count: 5 },
    { domain: t('Resources & Content', 'Ressources et contenu'), endpoints: t('Create resource, check access, early access, feedback \u2192 HubSpot', 'Creer une ressource, verifier l\'acces, acces anticipe, retours \u2192 HubSpot'), count: 4 },
  ]
}

function getExternalServices(t: T) {
  return [
    {
      name: 'Supabase',
      purpose: t('Database, Auth & Real-time', 'Base de donnees, auth et temps reel'),
      detail: t('PostgreSQL with Row Level Security, Google OAuth, magic links, real-time subscriptions', 'PostgreSQL avec Row Level Security, Google OAuth, liens magiques, abonnements en temps reel'),
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      name: 'Anthropic Claude',
      purpose: t('AI / LLM Engine', 'Moteur IA / LLM'),
      detail: t('Haiku for cost-efficient chat, Sonnet for complex analysis. Powers Bloom companion + practitioner assist', 'Haiku pour un chat economique, Sonnet pour les analyses complexes. Alimente le compagnon Bloom et l\'assistance praticien'),
      color: 'bg-violet-500',
      lightBg: 'bg-violet-50',
      textColor: 'text-violet-700',
    },
    {
      name: 'Google Calendar',
      purpose: t('Session Scheduling', 'Planification de sessions'),
      detail: t('OAuth 2.0 with offline refresh tokens, calendar sync, availability management, booking creation', 'OAuth 2.0 avec tokens de rafraichissement hors ligne, synchronisation de calendrier, gestion des disponibilites, creation de reservations'),
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'Postmark',
      purpose: t('Email Delivery', 'Envoi d\'emails'),
      detail: t('Transactional emails from hi@bloomsline.com \u2014 notifications, invitations, session reminders', 'Emails transactionnels depuis hi@bloomsline.com \u2014 notifications, invitations, rappels de sessions'),
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      name: 'PostHog',
      purpose: t('Product Analytics', 'Analytique produit'),
      detail: t('EU-hosted (GDPR compliant), autocapture events, session recordings, user identification, cookie consent', 'Heberge en UE (conforme au RGPD), capture automatique d\'evenements, enregistrements de sessions, identification des utilisateurs, consentement cookies'),
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'HubSpot',
      purpose: t('CRM & Feedback', 'CRM et retours'),
      detail: t('API v3 \u2014 ticket creation from user feedback, file uploads for attachments, bug/feature/question categories', 'API v3 \u2014 creation de tickets a partir des retours utilisateurs, telechargement de fichiers joints, categories bug/fonctionnalite/question'),
      color: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      name: 'Upstash Redis',
      purpose: t('Rate Limiting', 'Limitation de debit'),
      detail: t('Distributed rate limiting via serverless Redis (EU region). Sliding window algorithm with per-route tiers (auth, AI, public). Works across all Vercel instances.', 'Limitation de debit distribuee via Redis serverless (region UE). Algorithme a fenetre glissante avec niveaux par route (auth, IA, public). Fonctionne entre toutes les instances Vercel.'),
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      name: 'GitHub Actions',
      purpose: t('CI/CD Pipeline', 'Pipeline CI/CD'),
      detail: t('Automated on every push \u2014 build verification, TypeScript type checking, dependency security audits, secret detection in code. Runs build + security jobs in parallel.', 'Automatise a chaque push \u2014 verification du build, verification des types TypeScript, audits de securite des dependances, detection de secrets dans le code. Execute les jobs build + securite en parallele.'),
      color: 'bg-gray-800',
      lightBg: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
  ]
}

// ── Animation helpers ────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ── Visual Architecture Diagram ──────────────────────────────────────────

function ArchitectureDiagram({ t }: { t: T }) {
  return (
    <div className="relative py-4">
      {/* Row 1: Clients */}
      <div className="flex justify-center gap-6 mb-3">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-3 text-center w-48">
          <Monitor className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-blue-700">{t('Practitioner Web', 'Web praticien')}</p>
          <p className="text-[10px] text-blue-500">Next.js 16 + React 19</p>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-5 py-3 text-center w-48">
          <Smartphone className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-emerald-700">{t('Member Mobile', 'Mobile membre')}</p>
          <p className="text-[10px] text-emerald-500">Expo (React Native)</p>
        </div>
      </div>

      {/* Arrows down */}
      <div className="flex justify-center gap-6 mb-3">
        <div className="w-48 flex justify-center">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
        <div className="w-48 flex justify-center">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {/* Row 2: API Layer */}
      <div className="flex justify-center mb-3">
        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl px-8 py-3 text-center w-[420px]">
          <Server className="w-5 h-5 text-gray-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-gray-700">{t('API Layer', 'Couche API')}</p>
          <p className="text-[10px] text-gray-500">{t('Next.js Routes + Middleware + Rate Limiting + Auth', 'Routes Next.js + Middleware + Limitation de debit + Auth')}</p>
          <div className="flex justify-center gap-1.5 mt-2">
            {['Auth', 'Bloom AI', t('Calendar', 'Calendrier'), t('Notify', 'Notif.'), t('Resources', 'Ressources')].map((d) => (
              <span key={d} className="text-[9px] bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Arrows down */}
      <div className="flex justify-center mb-3">
        <ArrowDown className="w-4 h-4 text-gray-300" />
      </div>

      {/* Row 3: Core Services */}
      <div className="flex justify-center gap-4 mb-3">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 text-center w-52">
          <Database className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-emerald-700">Supabase</p>
          <p className="text-[10px] text-emerald-500">PostgreSQL + Auth + RLS</p>
          <p className="text-[10px] text-emerald-400">{t('Real-time subscriptions', 'Abonnements en temps reel')}</p>
        </div>
        <div className="bg-violet-50 border-2 border-violet-200 rounded-xl px-4 py-3 text-center w-52">
          <Brain className="w-5 h-5 text-violet-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-violet-700">Claude AI</p>
          <p className="text-[10px] text-violet-500">{t('Haiku (chat) + Sonnet (analysis)', 'Haiku (chat) + Sonnet (analyse)')}</p>
          <p className="text-[10px] text-violet-400">{t('Bloom companion & assist', 'Compagnon Bloom et assistance')}</p>
        </div>
      </div>

      {/* Arrows down */}
      <div className="flex justify-center mb-3">
        <ArrowDown className="w-4 h-4 text-gray-300" />
      </div>

      {/* Row 4: External Services */}
      <div className="flex justify-center">
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 w-full max-w-xl">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">{t('External Services', 'Services externes')}</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">Google</p>
              <p className="text-[9px] text-gray-400">{t('Calendar + OAuth', 'Calendrier + OAuth')}</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">Postmark</p>
              <p className="text-[9px] text-gray-400">{t('Email delivery', 'Envoi d\'emails')}</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">PostHog</p>
              <p className="text-[9px] text-gray-400">{t('Analytics (EU)', 'Analytique (UE)')}</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">HubSpot</p>
              <p className="text-[9px] text-gray-400">{t('CRM & tickets', 'CRM et tickets')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Data Flow Diagram ────────────────────────────────────────────────────

function DataFlowDiagram({ t }: { t: T }) {
  const flows = [
    {
      label: t('Member opens app', 'Le membre ouvre l\'application'),
      steps: ['Expo App', 'API /bloom/chat', 'Claude Haiku', t('Response streamed back', 'Reponse envoyee en continu')],
      color: 'emerald',
    },
    {
      label: t('Practitioner books session', 'Le praticien reserve une session'),
      steps: ['Web App', 'API /bookings', 'Supabase', t('Google Calendar sync', 'Sync Google Calendar'), t('Postmark email to member', 'Email Postmark au membre')],
      color: 'blue',
    },
    {
      label: t('User submits feedback', 'L\'utilisateur envoie un retour'),
      steps: ['Web App', 'API /feedback', t('HubSpot ticket created', 'Ticket HubSpot cree'), t('File attachments uploaded', 'Fichiers joints telecharges')],
      color: 'amber',
    },
  ]

  const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  }

  return (
    <div className="space-y-3">
      {flows.map((flow) => {
        const c = colorMap[flow.color]
        return (
          <div key={flow.label} className={`${c.bg} border ${c.border} rounded-xl px-4 py-3`}>
            <p className={`text-[10px] font-semibold ${c.text} mb-2`}>{flow.label}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {flow.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-100">{step}</span>
                  {i < flow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function TechOverviewPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const STACK_LAYERS = getStackLayers(t)
  const SECURITY_FEATURES = getSecurityFeatures(t)
  const KEY_NUMBERS = getKeyNumbers(t)
  const AI_FEATURES = getAiFeatures(t)
  const API_DOMAINS = getApiDomains(t)
  const EXTERNAL_SERVICES = getExternalServices(t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{t('Technical Overview', 'Apercu technique')}</h1>
            <p className="text-[10px] text-gray-400">{t('Bloomsline Care \u2014 Architecture & Stack', 'Bloomsline Care \u2014 Architecture et stack technique')}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '\uD83C\uDDEB\uD83C\uDDF7 Fran\u00E7ais' : '\uD83C\uDDEC\uD83C\uDDE7 English'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* ── Intro ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('How Bloomsline Care is Built', 'Comment Bloomsline Care est construit')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              'Two interfaces \u2014 a web app for practitioners and a mobile app for their clients (members). Built solo by the technical co-founder using modern tools. Everything described here is live and working, not a prototype.',
              'Deux interfaces \u2014 une application web pour les praticiens et une application mobile pour leurs clients (membres). Construit seul par le co-fondateur technique avec des outils modernes. Tout ce qui est decrit ici est en production, pas un prototype.'
            )}
          </p>
        </motion.div>

        {/* ── Visual Architecture Diagram ──────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('System Architecture', 'Architecture du systeme')}</h3>
          <p className="text-[10px] text-gray-400 mb-4">{t('How everything connects \u2014 from clients to external services', 'Comment tout s\'interconnecte \u2014 des clients aux services externes')}</p>
          <ArchitectureDiagram t={t} />
        </motion.div>

        {/* ── Data Flow Examples ───────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('How Data Flows', 'Flux de donnees')}</h3>
          <p className="text-[10px] text-gray-400 mb-3">{t('Real request paths through the system', 'Parcours reels des requetes a travers le systeme')}</p>
          <DataFlowDiagram t={t} />
        </motion.div>

        {/* ── Key Numbers ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KEY_NUMBERS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <Icon className="w-4 h-4 text-gray-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <p className="text-[10px] text-gray-500 mt-1">{item.label}</p>
              </div>
            )
          })}
        </motion.div>

        {/* ── Stack Layers ────────────────────────────────────────── */}
        <div>
          <motion.h3 {...fadeUp} transition={{ delay: 0.15 }} className="text-sm font-semibold text-gray-900 mb-4">
            {t('Technology Stack', 'Stack technique')}
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STACK_LAYERS.map((layer, i) => {
              const Icon = layer.icon
              return (
                <motion.div
                  key={layer.title}
                  {...fadeUp}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${layer.lightColor} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">{layer.title}</h4>
                  </div>
                  <div className="space-y-2.5">
                    {layer.items.map((item) => (
                      <div key={item.name} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${layer.color} mt-1.5 shrink-0`} />
                        <div>
                          <span className="text-xs font-medium text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-400 ml-1.5">&mdash; {item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── External Services Detail ─────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('External Services', 'Services externes')}</h3>
            <span className="text-[10px] text-gray-400 ml-1">{t('6 integrations used in production', '6 integrations utilisees en production')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXTERNAL_SERVICES.map((svc) => (
              <div key={svc.name} className={`${svc.lightBg} border border-gray-100 rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${svc.color}`} />
                  <span className={`text-xs font-bold ${svc.textColor}`}>{svc.name}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{svc.purpose}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{svc.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── AI Deep Dive ────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('AI Features', 'Fonctionnalites IA')}</h3>
            <span className="text-[10px] text-gray-400 ml-1">{t('Built on Anthropic Claude', 'Construit sur Anthropic Claude')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AI_FEATURES.map((feature) => (
              <div key={feature.name} className="bg-gradient-to-br from-violet-50/50 to-white border border-violet-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-900 mb-1">{feature.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg px-4 py-2.5 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-xs text-violet-700">
              <span className="font-medium">{t('Cost optimization:', 'Optimisation des couts :')}</span> {t(
                'Bloom uses Claude Haiku for conversations (~\u20AC1.80/practitioner/mo), keeping AI costs manageable relative to \u20AC19-49/mo subscription tiers. Sonnet is reserved for heavier tasks like summaries and pattern detection.',
                'Bloom utilise Claude Haiku pour les conversations (~1,80\u20AC/praticien/mois), maintenant les couts IA maitrisables par rapport aux abonnements de 19-49\u20AC/mois. Sonnet est reserve pour les taches plus lourdes comme les resumes et la detection de tendances.'
              )}
            </p>
          </div>
        </motion.div>

        {/* ── API Surface ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('API Surface', 'Surface API')}</h3>
            <span className="text-[10px] text-gray-400 ml-1">{t('24+ endpoints across 5 domains', '24+ points d\'acces repartis sur 5 domaines')}</span>
          </div>
          <div className="space-y-2">
            {API_DOMAINS.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold text-gray-800 w-36 shrink-0">{d.domain}</span>
                <span className="text-xs text-gray-400 flex-1">{d.endpoints}</span>
                <span className="text-[10px] font-medium text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Security ────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('Security & Compliance', 'Securite et conformite')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SECURITY_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{feature.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Multi-Platform ──────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('Multi-Platform Architecture', 'Architecture multiplateforme')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
              <p className="text-xs font-semibold text-blue-700 mb-2">{t('Practitioner \u2014 Web App', 'Praticien \u2014 Application web')}</p>
              <div className="space-y-1.5">
                {[
                  t('Dashboard & member management', 'Tableau de bord et gestion des membres'),
                  t('Session scheduling via Google Calendar', 'Planification de sessions via Google Calendar'),
                  t('AI-assisted clinical notes (Bloom Assist)', 'Notes cliniques assistees par IA (Bloom Assist)'),
                  t('Resource library & sharing', 'Bibliotheque de ressources et partage'),
                  t('Analytics & progress tracking', 'Analytique et suivi de la progression'),
                  t('Feedback system \u2192 HubSpot', 'Systeme de retours \u2192 HubSpot'),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[11px] text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/30">
              <p className="text-xs font-semibold text-emerald-700 mb-2">{t('Member \u2014 Mobile App (Expo)', 'Membre \u2014 Application mobile (Expo)')}</p>
              <div className="space-y-1.5">
                {[
                  t('Bloom AI companion for self-reflection', 'Compagnon IA Bloom pour l\'auto-reflexion'),
                  t('Mood tracking & daily rituals', 'Suivi de l\'humeur et rituels quotidiens'),
                  t('Moment capture (photo, voice, text)', 'Capture de moments (photo, voix, texte)'),
                  t('Session booking & email reminders (Postmark)', 'Reservation de sessions et rappels par email (Postmark)'),
                  t('Milestone progress & celebrations', 'Progression des jalons et celebrations'),
                  t('Push notifications', 'Notifications push'),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── i18n ────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('Internationalization', 'Internationalisation')}</h3>
          </div>
          <div className="flex items-center gap-3">
            {[
              { flag: '\uD83C\uDDEC\uD83C\uDDE7', langName: t('English', 'Anglais'), code: 'en' },
              { flag: '\uD83C\uDDEB\uD83C\uDDF7', langName: t('French', 'Francais'), code: 'fr' },
              { flag: '\uD83C\uDDEA\uD83C\uDDF8', langName: t('Spanish', 'Espagnol'), code: 'es' },
            ].map((l) => (
              <div key={l.code} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm">{l.flag}</span>
                <span className="text-xs font-medium text-gray-700">{l.langName}</span>
                <span className="text-[10px] text-gray-400">{l.code}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('Full UI + AI prompts + system messages translated across all supported languages.', 'Interface complete + invites IA + messages systeme traduits dans toutes les langues prises en charge.')}</p>
        </motion.div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.65 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Built by a 2-person team. Architecture choices prioritize speed of iteration and low operational cost.', 'Construit par une equipe de 2 personnes. Les choix d\'architecture privilegient la rapidite d\'iteration et les faibles couts operationnels.')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
