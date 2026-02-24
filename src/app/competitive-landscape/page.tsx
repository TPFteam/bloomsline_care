'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  CheckCircle2,
  XCircle,
  Minus,
  ArrowRight,
  Globe,
  Users,
  Brain,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Shield,
  Clock,
  Lightbulb,
  Flag,
  ChevronRight,
  ExternalLink,
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

function FeatureIcon({ value }: { value: boolean | 'partial' }) {
  if (value === true) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
  if (value === 'partial') return <Minus className="w-3.5 h-3.5 text-amber-400" />
  return <XCircle className="w-3.5 h-3.5 text-gray-200" />
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700 inline-flex items-center gap-0.5"
    >
      {children}
      <ExternalLink className="w-2 h-2" />
    </a>
  )
}

// ── Types ────────────────────────────────────────────────────────────────

interface CompetitorSource {
  label: string
  url: string
}

interface Competitor {
  name: string
  oneLiner: string
  pricing: string
  pricingSource: CompetitorSource
  category: 'practice' | 'wellness' | 'enterprise' | 'ai'
  target: string
  fundingOrScale: string
  keyDifferentiator: string
  moat: string
  strengths: string[]
  weaknesses: string[]
  threatLevel: 'high' | 'medium' | 'low'
  threatReason: string
  defense: string
  sources: CompetitorSource[]
  features: {
    practitionerTools: boolean | 'partial'
    memberApp: boolean | 'partial'
    aiCompanion: boolean
    european: boolean | 'partial'
    b2b2c: boolean
  }
}

// ── Data builders (accept t for translation) ────────────────────────────

type TFn = (en: string, fr: string) => string

function buildCompetitors(t: TFn): Competitor[] {
  return [
    // Practice Management
    {
      name: 'SimplePractice',
      oneLiner: t('US-focused EHR for solo mental health practitioners', 'DSE axe sur les praticiens en sante mentale en solo aux USA'),
      pricing: '$49\u201399/mo',
      pricingSource: { label: 'SimplePractice Pricing', url: 'https://www.simplepractice.com/pricing/' },
      category: 'practice',
      target: t('US solo/small-group therapists', 'Therapeutes solo / petits cabinets aux USA'),
      fundingOrScale: t('250K+ practitioners, owned by Vista Equity Partners ($4B acquisition)', '250K+ praticiens, detenu par Vista Equity Partners (acquisition de 4 Mds $)'),
      keyDifferentiator: t('All-in-one billing, scheduling, notes, and telehealth', 'Facturation, planification, notes et telesante tout-en-un'),
      moat: t('Deep US insurance integrations & network effects among therapists', 'Integrations profondes avec les assurances US et effets de reseau entre therapeutes'),
      strengths: [
        t('Best-in-class EHR for US solo therapists', 'Meilleur DSE pour therapeutes solo aux USA'),
        t('Strong brand \u2014 250K+ practitioners', 'Marque forte \u2014 250K+ praticiens'),
        t('Comprehensive billing & insurance', 'Facturation et assurances completes'),
      ],
      weaknesses: [
        t('No member-facing app or engagement tools', 'Aucune application membre ni outils d\u2019engagement'),
        t('Zero AI in the care journey', 'Zero IA dans le parcours de soins'),
        t('US-only \u2014 no EU presence', 'USA uniquement \u2014 aucune presence en UE'),
      ],
      threatLevel: 'medium',
      threatReason: t('Scale and brand could enable EU expansion', 'La taille et la marque pourraient permettre une expansion en UE'),
      defense: t(
        'They have no member app, no AI, and no EU presence. Rebuilding for B2B2C would require a full product rethink.',
        'Ils n\u2019ont pas d\u2019application membre, pas d\u2019IA et aucune presence en UE. Pivoter vers le B2B2C necessiterait une refonte complete du produit.'
      ),
      sources: [
        { label: '250K practitioners (2025 Impact)', url: 'https://www.simplepractice.com/blog/2025-impact-roundup/' },
        { label: 'Vista acquires EngageSmart ($4B)', url: 'https://www.businesswire.com/news/home/20231023294863/en/EngageSmart-Agrees-to-Be-Acquired-by-Vista-Equity-Partners-for-4-0-Billion' },
      ],
      features: { practitionerTools: true, memberApp: false, aiCompanion: false, european: false, b2b2c: false },
    },
    {
      name: 'Jane App',
      oneLiner: t('Canadian practice management for health & wellness clinics', 'Gestion de cabinet canadienne pour cliniques sante et bien-etre'),
      pricing: 'CAD $54\u201399/mo',
      pricingSource: { label: 'Jane App Pricing', url: 'https://jane.app/pricing' },
      category: 'practice',
      target: t('Canadian/AU/UK allied health & wellness clinics', 'Cliniques de sante et bien-etre au Canada/AU/UK'),
      fundingOrScale: t('Mostly bootstrapped, 200K+ practitioners, $1.8B valuation (2025)', 'Majoritairement autofinance, 200K+ praticiens, valorisation de 1,8 Md $ (2025)'),
      keyDifferentiator: t('Multi-discipline support (physio, chiro, massage, mental health)', 'Support multidisciplinaire (physio, chiro, massage, sante mentale)'),
      moat: t('Broad allied health coverage & strong Canadian base', 'Large couverture paramedicale et forte base canadienne'),
      strengths: [
        t('Multi-discipline flexibility', 'Flexibilite multidisciplinaire'),
        t('Strong in Canada/Australia/UK \u2014 50K+ clinics', 'Fort au Canada/Australie/UK \u2014 50K+ cliniques'),
        t('Profitable since day one, ~$100M ARR', 'Rentable depuis le premier jour, ~100 M$ de ARR'),
      ],
      weaknesses: [
        t('Limited mental health specialization', 'Specialisation limitee en sante mentale'),
        t('No AI capabilities', 'Aucune capacite IA'),
        t('Minimal European footprint', 'Empreinte europeenne minimale'),
      ],
      threatLevel: 'low',
      threatReason: t('Not mental health focused, no AI or EU strategy', 'Non specialise en sante mentale, pas d\u2019IA ni de strategie UE'),
      defense: t(
        'Generalist tool \u2014 lacks the depth for mental health care journeys. No AI roadmap.',
        'Outil generaliste \u2014 manque de profondeur pour les parcours de sante mentale. Aucune feuille de route IA.'
      ),
      sources: [
        { label: '$1.8B valuation (BetaKit)', url: 'https://betakit.com/jane-software-to-be-reportedly-valued-at-1-8-billion-in-upcoming-secondary-financing/' },
        { label: 'Bootstrapped growth story', url: 'https://markmacleod.me/jane-apps-alison-taylor-on-building-a-600-person-profitable-healthcare-company-without-venture-capital/' },
      ],
      features: { practitionerTools: true, memberApp: 'partial', aiCompanion: false, european: 'partial', b2b2c: false },
    },
    {
      name: 'Doctolib',
      oneLiner: t('Dominant European healthcare booking & telehealth platform', 'Plateforme europeenne dominante de reservation et telesante'),
      pricing: '\u20AC139/mo',
      pricingSource: { label: 'Doctolib Pricing (Contrary Research)', url: 'https://research.contrary.com/company/doctolib' },
      category: 'practice',
      target: t('European GPs, specialists, hospitals', 'Generalistes, specialistes et hopitaux europeens'),
      fundingOrScale: t('80M patients, 400K practitioners, ~$850M raised, valued at $6.4B', '80M de patients, 400K praticiens, ~850 M$ leves, valorise a 6,4 Mds $'),
      keyDifferentiator: t('Largest EU patient booking network with 80M+ users', 'Plus grand reseau de reservation de patients en UE avec 80M+ utilisateurs'),
      moat: t('Massive network effects \u2014 80M patients, deep health system integrations', 'Effets de reseau massifs \u2014 80M de patients, integrations profondes aux systemes de sante'),
      strengths: [
        t('Dominant EU booking platform', 'Plateforme de reservation dominante en UE'),
        t('Massive user base and trust', 'Base utilisateurs massive et confiance'),
        t('\u20AC348M ARR (2024), approaching profitability', '348 M\u20AC de ARR (2024), proche de la rentabilite'),
      ],
      weaknesses: [
        t('Booking + admin only \u2014 no care features', 'Reservation + admin uniquement \u2014 aucune fonctionnalite de soins'),
        t('No AI companion or between-session tools', 'Pas de compagnon IA ni d\u2019outils entre les seances'),
        t('Not specialized for mental health', 'Non specialise en sante mentale'),
      ],
      threatLevel: 'high',
      threatReason: t('80M users in EU \u2014 could add care features at any time', '80M d\u2019utilisateurs en UE \u2014 pourrait ajouter des fonctionnalites de soins a tout moment'),
      defense: t(
        'Doctolib is a booking engine, not a care platform. Adding AI-powered between-session care would require a completely different product DNA. They optimize for volume; we optimize for outcomes.',
        'Doctolib est un moteur de reservation, pas une plateforme de soins. Ajouter un suivi inter-seances avec IA necessiterait un ADN produit completement different. Ils optimisent le volume ; nous optimisons les resultats.'
      ),
      sources: [
        { label: '\u20AC348M ARR, 80M patients (Sifted)', url: 'https://sifted.eu/articles/doctolib-results-2024' },
        { label: '$6.4B valuation (TechCrunch)', url: 'https://techcrunch.com/2022/03/15/healthcare-tech-platform-doctolib-reaches-6-4-billion-valuation/' },
      ],
      features: { practitionerTools: 'partial', memberApp: 'partial', aiCompanion: false, european: true, b2b2c: false },
    },
    // B2C Wellness
    {
      name: 'Headspace',
      oneLiner: t('Market-leading meditation & mindfulness content app', 'Application leader de meditation et pleine conscience'),
      pricing: '$12.99/mo',
      pricingSource: { label: 'Headspace Subscriptions', url: 'https://www.headspace.com/subscriptions' },
      category: 'wellness',
      target: t('Consumers seeking mindfulness & meditation', 'Consommateurs a la recherche de pleine conscience et meditation'),
      fundingOrScale: t('80M+ downloads, merged with Ginger \u2192 Headspace Health ($3B valuation)', '80M+ telechargements, fusion avec Ginger \u2192 Headspace Health (valorisation 3 Mds $)'),
      keyDifferentiator: t('Premium brand and library of meditation/sleep content', 'Marque premium et bibliotheque de contenus meditation/sommeil'),
      moat: t('Brand recognition & vast content library', 'Notoriete de marque et vaste bibliotheque de contenus'),
      strengths: [
        t('Massive brand awareness \u2014 80M+ downloads', 'Notoriete massive \u2014 80M+ telechargements'),
        t('Rich content library (meditation, sleep, focus)', 'Riche bibliotheque de contenus (meditation, sommeil, concentration)'),
        t('B2B enterprise offering (Headspace Health)', 'Offre B2B entreprise (Headspace Health)'),
      ],
      weaknesses: [
        t('Content only \u2014 no practitioner connection', 'Contenu uniquement \u2014 aucun lien avec un praticien'),
        t('No personalized AI or care plans', 'Pas d\u2019IA personnalisee ni de plans de soins'),
        t('Generic wellness, not clinical mental health', 'Bien-etre generique, pas de sante mentale clinique'),
      ],
      threatLevel: 'low',
      threatReason: t('Content play \u2014 different product category entirely', 'Strategie de contenu \u2014 categorie de produit completement differente'),
      defense: t(
        'Headspace is a content app, not a care platform. No practitioner tools, no AI companion, no clinical journey.',
        'Headspace est une application de contenu, pas une plateforme de soins. Pas d\u2019outils praticien, pas de compagnon IA, pas de parcours clinique.'
      ),
      sources: [
        { label: '80M+ downloads (Business of Apps)', url: 'https://www.businessofapps.com/data/headspace-statistics/' },
        { label: 'Ginger merger \u2192 $3B (TechCrunch)', url: 'https://techcrunch.com/2021/08/25/headspace-and-ginger-are-merging-to-form-headspace-health/' },
      ],
      features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: true, b2b2c: false },
    },
    {
      name: 'BetterHelp',
      oneLiner: t('Largest online therapy marketplace \u2014 text, phone & video', 'Plus grande marketplace de therapie en ligne \u2014 texte, telephone et video'),
      pricing: '$280\u2013400/mo',
      pricingSource: { label: 'BetterHelp Pricing', url: 'https://www.betterhelp.com/advice/general/how-much-does-betterhelp-cost/' },
      category: 'wellness',
      target: t('US consumers seeking affordable online therapy', 'Consommateurs americains a la recherche de therapie en ligne abordable'),
      fundingOrScale: t('5M+ users served, Teladoc subsidiary ($1B+ annual revenue)', '5M+ utilisateurs, filiale Teladoc (1 Md$+ de CA annuel)'),
      keyDifferentiator: t('Largest online therapy marketplace by volume', 'Plus grande marketplace de therapie en ligne par volume'),
      moat: t('Scale & SEO dominance for therapy keywords', 'Taille et domination SEO sur les mots-cles therapeutiques'),
      strengths: [
        t('Massive scale \u2014 5M+ users, 30K+ therapists', 'Taille massive \u2014 5M+ utilisateurs, 30K+ therapeutes'),
        t('Strong marketing & SEO machine', 'Machine marketing et SEO puissante'),
        t('Low friction onboarding', 'Inscription avec peu de friction'),
      ],
      weaknesses: [
        t('No practitioner tools \u2014 therapists are commoditized', 'Aucun outil praticien \u2014 les therapeutes sont marchandises'),
        t('No between-session engagement', 'Aucun engagement entre les seances'),
        t('Revenue declining 8% YoY (2024), US-only', 'Chiffre d\u2019affaires en baisse de 8 % en glissement annuel (2024), USA uniquement'),
      ],
      threatLevel: 'low',
      threatReason: t('Marketplace model misaligned with care continuity', 'Modele marketplace desaligne avec la continuite des soins'),
      defense: t(
        'BetterHelp is a marketplace that commoditizes therapists. Practitioners don\'t choose it \u2014 they tolerate it. We empower practitioners, not replace them.',
        'BetterHelp est une marketplace qui marchandise les therapeutes. Les praticiens ne la choisissent pas \u2014 ils la tolerent. Nous renforcons les praticiens, nous ne les remplacons pas.'
      ),
      sources: [
        { label: '5M+ users (Yahoo Finance)', url: 'https://finance.yahoo.com/news/betterhelp-surpasses-5-million-people-170000559.html' },
        { label: 'Revenue decline (Healthcare Dive)', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
      ],
      features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: false, b2b2c: false },
    },
    // Enterprise
    {
      name: 'Spring Health',
      oneLiner: t('Enterprise mental health platform with care matching', 'Plateforme de sante mentale entreprise avec orientation des soins'),
      pricing: '~$5\u201314 PEPM',
      pricingSource: { label: 'Spring Health PEPM (Oliver Wyman)', url: 'https://www.oliverwyman.com/our-expertise/perspectives/health/2025/april/3-keys-to-unlocking-value-in-an-evolving-eap-market.html' },
      category: 'enterprise',
      target: t('Large employers (1,000+ employees)', 'Grandes entreprises (1 000+ employes)'),
      fundingOrScale: t('$509M raised, valued at $3.3B (Series E, Jul 2024)', '509 M$ leves, valorise a 3,3 Mds $ (Serie E, juil. 2024)'),
      keyDifferentiator: t('AI-powered care navigation for enterprise employees', 'Orientation des soins par IA pour les employes d\u2019entreprise'),
      moat: t('Enterprise contracts, clinical outcomes data, care matching algorithms', 'Contrats entreprise, donnees de resultats cliniques, algorithmes d\u2019orientation'),
      strengths: [
        t('Strong enterprise sales \u2014 450 employers, 20M+ lives covered', 'Ventes entreprise solides \u2014 450 employeurs, 20M+ vies couvertes'),
        t('AI-powered care matching', 'Orientation des soins par IA'),
        t('$509M in funding, 3,400 employees', '509 M$ de financement, 3 400 employes'),
      ],
      weaknesses: [
        t('No practitioner SaaS tools', 'Aucun outil SaaS pour praticiens'),
        t('US-focused, limited EU presence', 'Axe USA, presence limitee en UE'),
        t('Employees only \u2014 no independent practitioner market', 'Employes uniquement \u2014 pas de marche de praticiens independants'),
      ],
      threatLevel: 'medium',
      threatReason: t('Resources to expand into EU or add practitioner tools', 'Ressources pour s\u2019etendre en UE ou ajouter des outils praticiens'),
      defense: t(
        'Spring Health sells to HR departments, not practitioners. Different buyer, different product, different market. EU expansion would take years of regulatory work.',
        'Spring Health vend aux DRH, pas aux praticiens. Acheteur different, produit different, marche different. L\u2019expansion en UE prendrait des annees de travail reglementaire.'
      ),
      sources: [
        { label: '$3.3B valuation, Series E (Fortune)', url: 'https://www.springhealth.com/news/fortune-exclusive-ai-powered-mental-health-startup-boosts-valuation' },
        { label: '450 employers, 20M+ lives (BHB)', url: 'https://bhbusiness.com/2024/07/31/mental-health-startup-spring-health-secures-100m-series-e-valuation-soars-to-3-3b/' },
      ],
      features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: false, b2b2c: false },
    },
    {
      name: 'Moka.care',
      oneLiner: t('French B2B mental wellbeing for companies', 'Bien-etre mental B2B francais pour les entreprises'),
      pricing: t('Custom PEPM', 'PEPM sur mesure'),
      pricingSource: { label: 'Moka.care B2B model (TechCrunch)', url: 'https://techcrunch.com/2021/02/04/moka-care-is-a-european-mental-health-care-solution-for-employees/' },
      category: 'enterprise',
      target: t('French/EU mid-size to large companies', 'Moyennes et grandes entreprises francaises/europeennes'),
      fundingOrScale: t('\u20AC17.5M raised, 320+ enterprise clients (L\'Oreal, Accor, ENGIE)', '17,5 M\u20AC leves, 320+ clients entreprise (L\'Oreal, Accor, ENGIE)'),
      keyDifferentiator: t('French-native B2B mental wellbeing with local practitioners', 'Bien-etre mental B2B natif francais avec des praticiens locaux'),
      moat: t('French enterprise relationships & local practitioner network', 'Relations entreprises francaises et reseau de praticiens locaux'),
      strengths: [
        t('French-native with EU focus', 'Natif francais avec un focus UE'),
        t('Strong B2B enterprise position \u2014 320+ clients', 'Position B2B entreprise solide \u2014 320+ clients'),
        t('Local practitioner network across 15 countries', 'Reseau de praticiens locaux dans 15 pays'),
      ],
      weaknesses: [
        t('Enterprise-only \u2014 no independent practitioner tools', 'Entreprise uniquement \u2014 pas d\u2019outils pour praticiens independants'),
        t('No member-facing app', 'Pas d\u2019application pour les membres'),
        t('No AI companion or between-session care', 'Pas de compagnon IA ni de suivi inter-seances'),
      ],
      threatLevel: 'low',
      threatReason: t('B2B-only model, no practitioner SaaS or AI', 'Modele B2B uniquement, pas de SaaS praticien ni d\u2019IA'),
      defense: t(
        'Moka.care serves companies, not practitioners. Different buyer, different value prop. No overlap with our B2B2C model.',
        'Moka.care sert les entreprises, pas les praticiens. Acheteur different, proposition de valeur differente. Aucun chevauchement avec notre modele B2B2C.'
      ),
      sources: [
        { label: '\u20AC15M Series A (Sifted)', url: 'https://sifted.eu/articles/moka-care-15m-series-a' },
        { label: 'Series A raise (TechCrunch)', url: 'https://techcrunch.com/2022/05/24/moka-care-raises-16-million-for-its-corporate-mental-health-service/' },
      ],
      features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: true, b2b2c: false },
    },
    // AI Mental Health
    {
      name: 'Woebot',
      oneLiner: t('CBT-based AI chatbot \u2014 consumer app shut down June 2025', 'Chatbot IA base sur la TCC \u2014 application grand public fermee en juin 2025'),
      pricing: t('B2B only', 'B2B uniquement'),
      pricingSource: { label: 'Woebot B2C shutdown (STAT News)', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      category: 'ai',
      target: t('Enterprise clients (after B2C shutdown)', 'Clients entreprise (apres la fermeture B2C)'),
      fundingOrScale: t('$123M raised, Stanford-backed, B2C app shut down June 2025', '123 M$ leves, soutenu par Stanford, application B2C fermee en juin 2025'),
      keyDifferentiator: t('Most clinically validated AI mental health chatbot', 'Chatbot IA de sante mentale le plus valide cliniquement'),
      moat: t('Clinical evidence base & research partnerships', 'Base de preuves cliniques et partenariats de recherche'),
      strengths: [
        t('Strongest clinical evidence in AI mental health', 'Preuves cliniques les plus solides en IA sante mentale'),
        t('Stanford/research credibility', 'Credibilite Stanford/recherche'),
        t('FDA Breakthrough Device designation (May 2021)', 'Designation FDA Breakthrough Device (mai 2021)'),
      ],
      weaknesses: [
        t('B2C model failed \u2014 app shut down June 2025', 'Modele B2C echoue \u2014 application fermee en juin 2025'),
        t('No practitioner tools', 'Pas d\u2019outils praticiens'),
        t('Pivoted to enterprise-only (limited TAM)', 'Pivot vers l\u2019entreprise uniquement (TAM limite)'),
      ],
      threatLevel: 'low',
      threatReason: t('B2C failure validates our care-anchored approach', 'L\u2019echec B2C valide notre approche ancree dans les soins'),
      defense: t(
        'Woebot\'s shutdown proves standalone AI mental health doesn\'t work. Our AI is embedded in a real care relationship \u2014 the model they couldn\'t build.',
        'La fermeture de Woebot prouve que l\u2019IA autonome en sante mentale ne fonctionne pas. Notre IA est integree dans une vraie relation de soins \u2014 le modele qu\u2019ils n\u2019ont pas su construire.'
      ),
      sources: [
        { label: 'App shutdown (MobiHealthNews)', url: 'https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app' },
        { label: '$123M total funding (BHB)', url: 'https://bhbusiness.com/2022/03/20/woebot-health-gets-9m-investment-from-bayer-ag-brings-total-funding-to-123m/' },
        { label: 'FDA Breakthrough Device (Woebot)', url: 'https://woebothealth.com/woebot-health-receives-fda-breakthrough-device-designation/' },
      ],
      features: { practitionerTools: false, memberApp: false, aiCompanion: true, european: false, b2b2c: false },
    },
    {
      name: 'Wysa',
      oneLiner: t('AI mental health chatbot with CBT/DBT exercises', 'Chatbot IA de sante mentale avec exercices TCC/TCD'),
      pricing: '$99.99/yr',
      pricingSource: { label: 'Wysa App Store Pricing', url: 'https://apps.apple.com/us/app/wysa-mental-health-support/id1166585565' },
      category: 'ai',
      target: t('Consumers & enterprise employees', 'Consommateurs et employes d\u2019entreprise'),
      fundingOrScale: t('$30.5M raised, 5M+ users, 500M+ AI conversations', '30,5 M$ leves, 5M+ utilisateurs, 500M+ conversations IA'),
      keyDifferentiator: t('AI chatbot with structured CBT/DBT/ACT exercises', 'Chatbot IA avec exercices structures TCC/TCD/ACT'),
      moat: t('NHS partnerships (31 Talking Therapy services) & clinical validation', 'Partenariats NHS (31 services Talking Therapy) et validation clinique'),
      strengths: [
        t('NHS-validated \u2014 117K+ patients referred via Wysa', 'Valide par le NHS \u2014 117K+ patients orientes via Wysa'),
        t('Structured therapy exercises', 'Exercices therapeutiques structures'),
        t('5M+ users across 90 countries', '5M+ utilisateurs dans 90 pays'),
      ],
      weaknesses: [
        t('No practitioner connection', 'Aucun lien avec un praticien'),
        t('Generic exercises \u2014 not personalized to care plan', 'Exercices generiques \u2014 non personnalises au plan de soins'),
        t('Limited European presence despite NHS work', 'Presence europeenne limitee malgre le travail avec le NHS'),
      ],
      threatLevel: 'low',
      threatReason: t('Standalone AI chatbot \u2014 same limitations as Woebot', 'Chatbot IA autonome \u2014 memes limites que Woebot'),
      defense: t(
        'Wysa is a self-help tool with no practitioner connection. Our AI knows the member\'s care plan, milestones, and practitioner \u2014 contextual, not generic.',
        'Wysa est un outil d\u2019auto-assistance sans lien avec un praticien. Notre IA connait le plan de soins, les jalons et le praticien du membre \u2014 contextuelle, pas generique.'
      ),
      sources: [
        { label: '$20M Series B (TechCrunch)', url: 'https://techcrunch.com/2022/07/14/wysa-20-million-series-b-funding-expand-therapist-chatbot-wider-mental-health-services/' },
        { label: '31 NHS services, 117K patients (Wysa)', url: 'https://blogs.wysa.io/blog/company-news/nhs-tackles-mental-health-crisis-with-ai' },
      ],
      features: { practitionerTools: false, memberApp: true, aiCompanion: true, european: false, b2b2c: false },
    },
  ]
}

function buildCategories(t: TFn) {
  return [
    { id: 'practice' as const, label: t('Practice Management', 'Gestion de cabinet'), color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
    { id: 'wellness' as const, label: t('B2C Wellness & Therapy', 'Bien-etre et therapie B2C'), color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
    { id: 'enterprise' as const, label: t('Enterprise B2B', 'Entreprise B2B'), color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
    { id: 'ai' as const, label: t('AI Mental Health', 'IA en sante mentale'), color: 'bg-violet-500', lightBg: 'bg-violet-50', textColor: 'text-violet-700', borderColor: 'border-violet-200' },
  ]
}

function buildDifferentiators(t: TFn) {
  return [
    {
      icon: Users,
      title: t('B2B2C Model', 'Modele B2B2C'),
      subtitle: t('Practitioner as distribution', 'Le praticien comme canal de distribution'),
      detail: t(
        'Target: \u20AC50 to acquire 1 practitioner \u2192 ~12 members invited for free. Hypothetical member CAC: ~\u20AC4 vs \u20AC30-50 for B2C apps. This is our thesis based on 119 discovery interviews — not yet validated with paying customers.',
        'Objectif : 50 \u20AC pour acquerir 1 praticien \u2192 environ 12 membres invites gratuitement. CAC theorique par membre : ~4 \u20AC contre 30-50 \u20AC pour les apps B2C. C\'est notre these basee sur 119 entretiens de decouverte — pas encore validee avec des clients payants.'
      ),
    },
    {
      icon: Brain,
      title: t('AI in the Care Journey', 'L\u2019IA dans le parcours de soins'),
      subtitle: t('Not standalone \u2014 contextual', 'Pas autonome \u2014 contextuelle'),
      detail: t(
        'Bloom knows the member\'s practitioner, milestones, and session history. Unlike generic chatbots, it\'s embedded in a real care relationship.',
        'Bloom connait le praticien, les jalons et l\u2019historique des seances du membre. Contrairement aux chatbots generiques, elle est integree dans une vraie relation de soins.'
      ),
    },
    {
      icon: Sparkles,
      title: t('Both Sides Connected', 'Les deux cotes connectes'),
      subtitle: t('Practitioner + member in one ecosystem', 'Praticien + membre dans un seul ecosysteme'),
      detail: t(
        'No major competitor connects both sides today. SimplePractice has no member app. BetterHelp has no practitioner tools. We are building both, though we are early-stage and need to prove this model works.',
        'Aucun concurrent majeur ne connecte les deux cotes aujourd\u2019hui. SimplePractice n\u2019a pas d\u2019application membre. BetterHelp n\u2019a pas d\u2019outils praticiens. Nous construisons les deux, bien que nous soyons en phase initiale et devions prouver que ce modele fonctionne.'
      ),
    },
    {
      icon: Globe,
      title: t('European White Space', 'Espace vierge europeen'),
      subtitle: t('No AI-native competitor in EU', 'Aucun concurrent natif IA en UE'),
      detail: t(
        'SimplePractice, BetterHelp, Spring Health \u2014 all US-only. Doctolib dominates booking (80M patients, \u20AC6.4B valuation) but is not a care platform. The gap exists, but Doctolib could move into this space. We\'re GDPR-native with FR/EN/ES from day one.',
        'SimplePractice, BetterHelp, Spring Health \u2014 tous exclusivement americains. Doctolib domine la reservation (80M de patients, 6,4 Mds \u20AC de valorisation) mais n\u2019est pas une plateforme de soins. Le vide existe, mais Doctolib pourrait investir cet espace. Nous sommes natifs RGPD avec FR/EN/ES des le premier jour.'
      ),
    },
    {
      icon: DollarSign,
      title: t('Price as a Weapon', 'Le prix comme arme'),
      subtitle: t('\u20AC19-49/mo vs \u20AC50-139/mo competitors', '19-49 \u20AC/mois contre 50-139 \u20AC/mois chez les concurrents'),
      detail: t(
        '2-3x cheaper than most practice management tools at our mid-tier (€29/mo). 85%+ target gross margin with AI cost-optimized on Claude Haiku. We are pre-revenue — pricing validated through 119 discovery interviews, not paying customers yet.',
        '2 a 3 fois moins cher que la plupart des outils de gestion de cabinet a notre palier intermediaire (29 \u20AC/mois). Marge brute cible de 85%+ avec un cout IA optimise sur Claude Haiku. Nous sommes pre-revenu — tarification validee par 119 entretiens de decouverte, pas encore de clients payants.'
      ),
    },
  ]
}

function buildFeatureColumns(t: TFn) {
  return [
    { key: 'practitionerTools' as const, label: t('Practitioner Tools', 'Outils praticien') },
    { key: 'memberApp' as const, label: t('Member App', 'App membre') },
    { key: 'aiCompanion' as const, label: t('AI Companion', 'Compagnon IA') },
    { key: 'european' as const, label: t('European', 'Europeen') },
    { key: 'b2b2c' as const, label: 'B2B2C' },
  ]
}

function buildUncontestedSpaces(t: TFn) {
  return [
    {
      icon: Clock,
      title: t('Between-Session Care', 'Suivi inter-seances'),
      description: t(
        'The 167 hours between weekly sessions are completely unserved. 20-50% of therapy homework goes uncompleted \u2014 no tool helps practitioners extend care into daily life.',
        'Les 167 heures entre les seances hebdomadaires sont totalement non desservies. 20 a 50 % des exercices therapeutiques ne sont pas realises \u2014 aucun outil n\u2019aide les praticiens a etendre les soins au quotidien.'
      ),
      signal: t(
        'JMIR: "little a therapist can do between sessions to remind clients"',
        'JMIR : "peu de choses qu\u2019un therapeute peut faire entre les seances pour rappeler les clients"'
      ),
      sourceUrl: 'https://mental.jmir.org/2017/2/e20/',
    },
    {
      icon: Brain,
      title: t('AI Anchored in Care Relationships', 'IA ancree dans les relations de soins'),
      description: t(
        'Woebot proved standalone AI fails. The market needs AI embedded in real therapeutic relationships \u2014 not replacing them.',
        'Woebot a prouve que l\u2019IA autonome echoue. Le marche a besoin d\u2019une IA integree dans de vraies relations therapeutiques \u2014 pas pour les remplacer.'
      ),
      signal: t(
        'Woebot B2C shutdown (June 2025) validates this gap',
        'La fermeture B2C de Woebot (juin 2025) valide ce vide'
      ),
      sourceUrl: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/',
    },
    {
      icon: Globe,
      title: t('European Practitioner SaaS', 'SaaS praticien europeen'),
      description: t(
        'SimplePractice, BetterHelp, Spring Health \u2014 none operate in Europe. Doctolib is booking. The EU has no modern mental health SaaS.',
        'SimplePractice, BetterHelp, Spring Health \u2014 aucun n\u2019opere en Europe. Doctolib fait de la reservation. L\u2019UE n\u2019a pas de SaaS moderne de sante mentale.'
      ),
      signal: t(
        'EU mental health apps market: $2.2B in 2025, projected $4.8B by 2030',
        'Marche des apps de sante mentale en UE : 2,2 Mds $ en 2025, projete a 4,8 Mds $ d\u2019ici 2030'
      ),
      sourceUrl: 'https://www.grandviewresearch.com/horizon/outlook/mental-health-apps-market/europe',
    },
    {
      icon: Users,
      title: t('Dual-Sided B2B2C Platform', 'Plateforme B2B2C bilaterale'),
      description: t(
        'Every competitor is one-sided: practitioner-only OR member-only. Nobody connects both in a single ecosystem.',
        'Chaque concurrent est unilateral : praticien uniquement OU membre uniquement. Personne ne connecte les deux dans un seul ecosysteme.'
      ),
      signal: t(
        '1 practitioner sale = 12 engaged members for free',
        '1 vente praticien = 12 membres engages gratuitement'
      ),
    },
    {
      icon: DollarSign,
      title: t('Affordable AI-Native Practice Tool', 'Outil de cabinet natif IA et abordable'),
      description: t(
        'Practice management tools cost \u20AC50-139/mo. We aim to deliver more (AI + member app) starting at \u20AC19/mo \u2014 significantly cheaper. This pricing is validated by discovery interviews, not paying customers yet.',
        'Les outils de gestion de cabinet coutent 50-139 \u20AC/mois. Nous visons a offrir plus (IA + application membre) a partir de 19 \u20AC/mois \u2014 nettement moins cher. Cette tarification est validee par des entretiens de decouverte, pas encore de clients payants.'
      ),
      signal: t(
        '85%+ target gross margin with AI optimized on Claude Haiku',
        'Marge brute cible de 85%+ avec une IA optimisee sur Claude Haiku'
      ),
    },
  ]
}

function buildStrategicRecs(t: TFn) {
  return [
    {
      priority: 'critical' as const,
      title: t('Own "between-session care" as a category', 'S\u2019approprier le "suivi inter-seances" comme categorie'),
      description: t(
        'No competitor occupies this space. Be the first to define and own it \u2014 the tool that works when the therapist isn\'t in the room.',
        'Aucun concurrent n\u2019occupe cet espace. Etre le premier a le definir et le posseder \u2014 l\u2019outil qui fonctionne quand le therapeute n\u2019est pas dans la piece.'
      ),
      icon: Target,
    },
    {
      priority: 'critical' as const,
      title: t('Win France before expanding', 'Gagner la France avant de s\u2019etendre'),
      description: t(
        'Doctolib proved France is the EU beachhead. Win the first 100-200 French practitioners and prove unit economics, then expand to DE/ES/UK with a proven playbook. We currently have 0 paying customers and 15 beta testers.',
        'Doctolib a prouve que la France est la tete de pont europeenne. Gagner les 100-200 premiers praticiens francais et prouver l\u2019economie unitaire, puis s\u2019etendre en DE/ES/UK avec un playbook eprouve. Nous avons actuellement 0 client payant et 15 beta testeurs.'
      ),
      icon: Flag,
    },
    {
      priority: 'important' as const,
      title: t('Use B2B2C as the moat', 'Utiliser le B2B2C comme avantage defensif'),
      description: t(
        '1 practitioner sale \u2192 ~12 members invited for free. If this model works, it creates organic distribution that B2C and B2B competitors can\'t easily replicate. We need to validate this thesis.',
        '1 vente praticien \u2192 environ 12 membres invites gratuitement. Si ce modele fonctionne, il cree une distribution organique que les concurrents B2C et B2B ne peuvent pas facilement repliquer. Nous devons valider cette these.'
      ),
      icon: Shield,
    },
    {
      priority: 'opportunity' as const,
      title: t('Position for the "Woebot gap"', 'Se positionner sur le "vide Woebot"'),
      description: t(
        'Woebot\'s shutdown left a gap: clinically-grounded AI mental health. Position Bloom as what Woebot should have been \u2014 AI anchored in real care.',
        'La fermeture de Woebot a laisse un vide : une IA de sante mentale fondee cliniquement. Positionner Bloom comme ce que Woebot aurait du etre \u2014 une IA ancree dans de vrais soins.'
      ),
      icon: Lightbulb,
    },
  ]
}

// All sources referenced on this page (source labels are kept as-is since they reference external publications)
const ALL_SOURCES: CompetitorSource[] = [
  // Market sizing
  { label: 'Digital Mental Health Market \u2014 \u20AC12B EU TAM (2025), Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing' },
  { label: 'EU Mental Health Apps Market \u2014 $2.2B (2025), Grand View Research', url: 'https://www.grandviewresearch.com/horizon/outlook/mental-health-apps-market/europe' },
  // Between-session gap
  { label: 'Between-session homework non-adherence 20-50%, JMIR Mental Health (2017)', url: 'https://mental.jmir.org/2017/2/e20/' },
  { label: 'Tailoring between-session activities, CHI 2024 / PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11197942/' },
  // SimplePractice
  { label: 'SimplePractice Pricing ($49-99/mo)', url: 'https://www.simplepractice.com/pricing/' },
  { label: 'SimplePractice 2025 Impact \u2014 250K+ practitioners', url: 'https://www.simplepractice.com/blog/2025-impact-roundup/' },
  { label: 'Vista Equity acquires EngageSmart for $4B, BusinessWire', url: 'https://www.businesswire.com/news/home/20231023294863/en/EngageSmart-Agrees-to-Be-Acquired-by-Vista-Equity-Partners-for-4-0-Billion' },
  // Jane App
  { label: 'Jane App Pricing (CAD $54-99/mo)', url: 'https://jane.app/pricing' },
  { label: 'Jane $1.8B valuation, BetaKit', url: 'https://betakit.com/jane-software-to-be-reportedly-valued-at-1-8-billion-in-upcoming-secondary-financing/' },
  { label: 'Jane bootstrapped growth story, Mark MacLeod', url: 'https://markmacleod.me/jane-apps-alison-taylor-on-building-a-600-person-profitable-healthcare-company-without-venture-capital/' },
  // Doctolib
  { label: 'Doctolib \u20AC348M ARR, 80M patients, 400K practitioners, Sifted', url: 'https://sifted.eu/articles/doctolib-results-2024' },
  { label: 'Doctolib $6.4B valuation, TechCrunch', url: 'https://techcrunch.com/2022/03/15/healthcare-tech-platform-doctolib-reaches-6-4-billion-valuation/' },
  { label: 'Doctolib pricing & business breakdown, Contrary Research', url: 'https://research.contrary.com/company/doctolib' },
  // Headspace
  { label: 'Headspace Pricing ($12.99/mo)', url: 'https://www.headspace.com/subscriptions' },
  { label: 'Headspace 80M+ downloads, Business of Apps', url: 'https://www.businessofapps.com/data/headspace-statistics/' },
  { label: 'Headspace-Ginger merger \u2192 $3B, TechCrunch', url: 'https://techcrunch.com/2021/08/25/headspace-and-ginger-are-merging-to-form-headspace-health/' },
  // BetterHelp
  { label: 'BetterHelp Pricing ($280-400/mo)', url: 'https://www.betterhelp.com/advice/general/how-much-does-betterhelp-cost/' },
  { label: 'BetterHelp 5M+ users, Yahoo Finance', url: 'https://finance.yahoo.com/news/betterhelp-surpasses-5-million-people-170000559.html' },
  { label: 'Teladoc $1B loss, BetterHelp revenue decline, Healthcare Dive', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
  // Spring Health
  { label: 'Spring Health $3.3B valuation, Series E, Fortune', url: 'https://www.springhealth.com/news/fortune-exclusive-ai-powered-mental-health-startup-boosts-valuation' },
  { label: 'Spring Health 450 employers, 20M+ lives, BHB', url: 'https://bhbusiness.com/2024/07/31/mental-health-startup-spring-health-secures-100m-series-e-valuation-soars-to-3-3b/' },
  { label: 'Spring Health PEPM range, Oliver Wyman', url: 'https://www.oliverwyman.com/our-expertise/perspectives/health/2025/april/3-keys-to-unlocking-value-in-an-evolving-eap-market.html' },
  // Moka.care
  { label: 'Moka.care \u20AC15M Series A, Sifted', url: 'https://sifted.eu/articles/moka-care-15m-series-a' },
  { label: 'Moka.care raises $16M, TechCrunch', url: 'https://techcrunch.com/2022/05/24/moka-care-raises-16-million-for-its-corporate-mental-health-service/' },
  // Woebot
  { label: 'Woebot app shutdown, MobiHealthNews', url: 'https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app' },
  { label: 'Woebot $123M total funding, BHB', url: 'https://bhbusiness.com/2022/03/20/woebot-health-gets-9m-investment-from-bayer-ag-brings-total-funding-to-123m/' },
  { label: 'Woebot FDA Breakthrough Device designation', url: 'https://woebothealth.com/woebot-health-receives-fda-breakthrough-device-designation/' },
  { label: 'Why Woebot shut down, STAT News', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
  // Wysa
  { label: 'Wysa $20M Series B, TechCrunch', url: 'https://techcrunch.com/2022/07/14/wysa-20-million-series-b-funding-expand-therapist-chatbot-wider-mental-health-services/' },
  { label: 'Wysa NHS \u2014 31 services, 117K patients', url: 'https://blogs.wysa.io/blog/company-news/nhs-tackles-mental-health-crisis-with-ai' },
  { label: 'Wysa App Store pricing ($99.99/yr)', url: 'https://apps.apple.com/us/app/wysa-mental-health-support/id1166585565' },
]

// ── Market Map (2x2 visual) ──────────────────────────────────────────────

function MarketMap({ t }: { t: TFn }) {
  const dots: Array<{ name: string; x: number; y: number; color: string; size?: string }> = [
    { name: 'SimplePractice', x: 12, y: 20, color: 'bg-blue-400' },
    { name: 'Jane App', x: 18, y: 25, color: 'bg-blue-400' },
    { name: 'Doctolib', x: 25, y: 12, color: 'bg-blue-400' },
    { name: 'Headspace', x: 85, y: 30, color: 'bg-emerald-400' },
    { name: 'BetterHelp', x: 78, y: 35, color: 'bg-emerald-400' },
    { name: 'Spring Health', x: 55, y: 28, color: 'bg-amber-400' },
    { name: 'Moka.care', x: 52, y: 18, color: 'bg-amber-400' },
    { name: 'Wysa', x: 82, y: 60, color: 'bg-violet-400' },
    { name: 'Woebot', x: 72, y: 55, color: 'bg-violet-300' },
    { name: 'Bloomsline', x: 50, y: 85, color: 'bg-gray-900', size: 'large' },
  ]

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="absolute top-3 left-3 text-[9px] text-gray-300 font-medium">{t('Admin-focused', 'Axe administration')}</div>
        <div className="absolute top-3 right-3 text-[9px] text-gray-300 font-medium">{t('Admin-focused', 'Axe administration')}</div>
        <div className="absolute bottom-3 left-3 text-[9px] text-gray-300 font-medium">{t('Practitioner-only', 'Praticien uniquement')}</div>
        <div className="absolute bottom-3 right-3 text-[9px] text-gray-300 font-medium">{t('Member-only', 'Membre uniquement')}</div>
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-100" />
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2">
          <div className="flex items-center gap-12 text-[10px] text-gray-400">
            <span>{t('Practitioner focus', 'Focus praticien')}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{t('Member focus', 'Focus membre')}</span>
          </div>
        </div>
        <div className="absolute top-1/2 -left-0 -translate-x-full -translate-y-1/2 pr-2">
          <div className="flex flex-col items-center gap-8 text-[10px] text-gray-400">
            <span className="rotate-[-90deg] whitespace-nowrap">{t('AI-powered care', 'Soins assistes par IA')}</span>
            <span className="rotate-[-90deg] whitespace-nowrap">{t('Admin / scheduling', 'Admin / planification')}</span>
          </div>
        </div>
        <div className="absolute top-[5%] left-[30%] right-[30%] bottom-[55%] bg-indigo-50/50 border border-dashed border-indigo-200 rounded-lg flex items-center justify-center">
          <span className="text-[10px] font-semibold text-indigo-400">{t('THE GAP', 'LE VIDE')}</span>
        </div>
        {dots.map((dot) => (
          <div
            key={dot.name}
            className="absolute group"
            style={{ left: `${dot.x}%`, bottom: `${dot.y}%`, transform: 'translate(-50%, 50%)' }}
          >
            <div className={`${dot.color} rounded-full ${dot.size === 'large' ? 'w-4 h-4 ring-4 ring-gray-900/10' : 'w-2.5 h-2.5'} transition-transform group-hover:scale-150`} />
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${dot.size === 'large' ? 'opacity-100' : ''}`}>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${dot.size === 'large' ? 'bg-gray-900 text-white text-[10px]' : 'bg-white text-gray-700 shadow-sm border border-gray-100'}`}>
                {dot.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── The Gap Visualization ────────────────────────────────────────────────

function GapVisualization({ t }: { t: TFn }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-blue-700 mb-1">{t('Practice Tools', 'Outils de cabinet')}</p>
        <p className="text-[10px] text-blue-500">SimplePractice, Jane, Doctolib</p>
        <p className="text-[10px] text-blue-400 mt-2">{t('Run the business', 'Gerer l\u2019activite')}</p>
        <p className="text-[10px] text-red-400 font-medium">{t('No member experience', 'Aucune experience membre')}</p>
      </div>
      <div className="flex flex-col items-center shrink-0">
        <ArrowRight className="w-4 h-4 text-gray-300 mb-1" />
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold">Bloomsline</p>
          <p className="text-[9px] text-gray-300">{t('Both sides', 'Les deux cotes')}</p>
          <p className="text-[9px] text-gray-300">+ {t('AI', 'IA')}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 mt-1 rotate-180" />
      </div>
      <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-emerald-700 mb-1">{t('Wellness Apps', 'Applications bien-etre')}</p>
        <p className="text-[10px] text-emerald-500">Headspace, BetterHelp, Wysa</p>
        <p className="text-[10px] text-emerald-400 mt-2">{t('Help the individual', 'Aider l\u2019individu')}</p>
        <p className="text-[10px] text-red-400 font-medium">{t('No practitioner connection', 'Aucun lien avec un praticien')}</p>
      </div>
    </div>
  )
}

// ── Badges ───────────────────────────────────────────────────────────────

function ThreatBadge({ level, t }: { level: 'high' | 'medium' | 'low'; t: TFn }) {
  const styles = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const labels = {
    high: t('High', 'Eleve'),
    medium: t('Medium', 'Moyen'),
    low: t('Low', 'Faible'),
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

function PriorityBadge({ priority, t }: { priority: 'critical' | 'important' | 'opportunity'; t: TFn }) {
  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    important: 'bg-amber-50 text-amber-700 border-amber-200',
    opportunity: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }
  const labels = {
    critical: t('critical', 'critique'),
    important: t('important', 'important'),
    opportunity: t('opportunity', 'opportunite'),
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border capitalize ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CompetitiveLandscapePage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const COMPETITORS = buildCompetitors(t)
  const CATEGORIES = buildCategories(t)
  const DIFFERENTIATORS = buildDifferentiators(t)
  const FEATURE_COLUMNS = buildFeatureColumns(t)
  const UNCONTESTED_SPACES = buildUncontestedSpaces(t)
  const STRATEGIC_RECS = buildStrategicRecs(t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">{t('Competitive Landscape', 'Paysage concurrentiel')}</h1>
            <p className="text-[10px] text-gray-400">{t('Bloomsline Care \u2014 Market Positioning & Competitive Intelligence', 'Bloomsline Care \u2014 Positionnement marche et veille concurrentielle')}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shrink-0"
          >
            {lang === 'en' ? '\ud83c\uddeb\ud83c\uddf7 Fran\u00e7ais' : '\ud83c\uddec\ud83c\udde7 English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('Nobody owns the space between sessions.', 'Personne ne possede l\u2019espace entre les seances.')}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Mental health tech is fragmented into silos \u2014 practice tools for clinicians, wellness apps for consumers, enterprise platforms for HR. Nobody connects both sides with AI in Europe. Bloomsline is building for the gap that everyone else ignores: the 167 hours between weekly sessions where care should still be happening. We are pre-revenue with 15 beta testers and 119 discovery interviews.',
              'La tech en sante mentale est fragmentee en silos \u2014 outils de cabinet pour les cliniciens, applications bien-etre pour les consommateurs, plateformes entreprise pour les RH. Personne ne connecte les deux cotes avec l\u2019IA en Europe. Bloomsline construit pour le vide que tout le monde ignore : les 167 heures entre les seances hebdomadaires ou les soins devraient continuer. Nous sommes pre-revenu avec 15 beta testeurs et 119 entretiens de decouverte.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{t('€12B EU market', 'Marche UE de 12 Mds €')}</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{t('0 dual-sided platforms', '0 plateforme bilaterale')}</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">{t('No AI-native competitor in EU', 'Aucun concurrent natif IA en UE')}</span>
          </div>
          <div className="mt-2">
            <SourceLink href="https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing">
              €12B EU TAM: Towards Healthcare, Digital Mental Health Market (2025)
            </SourceLink>
          </div>
        </motion.section>

        {/* ── 2. The Gap ───────────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('Two worlds that don\'t talk to each other', 'Deux mondes qui ne se parlent pas')}>
            {t('The Gap', 'Le vide')}
          </SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <GapVisualization t={t} />
          </div>
        </motion.section>

        {/* ── 3. Market Positioning Map ────────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle={t('Where each competitor sits \u2014 and the gap Bloomsline occupies alone', 'Ou se situe chaque concurrent \u2014 et le vide que Bloomsline occupe seul')}>
            {t('Market Positioning Map', 'Carte de positionnement marche')}
          </SectionTitle>
          <MarketMap t={t} />
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                <span className="text-[10px] text-gray-500">{cat.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-900 ring-2 ring-gray-900/10" />
              <span className="text-[10px] font-semibold text-gray-700">Bloomsline</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 italic">
            {t('No competitor sits in the upper center \u2014 AI-powered and dual-sided.', 'Aucun concurrent ne se situe au centre superieur \u2014 propulse par l\u2019IA et bilateral.')}
          </p>
        </motion.section>

        {/* ── 4. Competitor Profiles ───────────────────────────── */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle={t('What each player does well, where they fall short, and why they matter', 'Ce que chaque acteur fait bien, ou il echoue, et pourquoi il compte')}>
            {t('Competitor Profiles', 'Profils des concurrents')}
          </SectionTitle>
          {CATEGORIES.map((cat) => {
            const competitors = COMPETITORS.filter((c) => c.category === cat.id)
            if (competitors.length === 0) return null
            return (
              <div key={cat.id} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                  <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
                </div>
                <div className="space-y-3">
                  {competitors.map((comp) => (
                    <div key={comp.name} className={`${cat.lightBg} border ${cat.borderColor} rounded-xl p-5`}>
                      {/* Header row */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-bold ${cat.textColor}`}>{comp.name}</span>
                            <ThreatBadge level={comp.threatLevel} t={t} />
                          </div>
                          <p className="text-xs text-gray-500">{comp.oneLiner}</p>
                        </div>
                        <a
                          href={comp.pricingSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 shrink-0 hover:text-indigo-500 hover:border-indigo-200 transition-colors flex items-center gap-1"
                          title={comp.pricingSource.label}
                        >
                          {comp.pricing}
                          <ExternalLink className="w-2 h-2 opacity-40" />
                        </a>
                      </div>

                      {/* Meta row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-[10px]">
                        <div>
                          <span className="text-gray-400 font-medium">{t('Target:', 'Cible :')}</span>{' '}
                          <span className="text-gray-600">{comp.target}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">{t('Scale:', 'Taille :')}</span>{' '}
                          <span className="text-gray-600">{comp.fundingOrScale}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">{t('Differentiator:', 'Differenciateur :')}</span>{' '}
                          <span className="text-gray-600">{comp.keyDifferentiator}</span>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-emerald-600 mb-1">{t('Strengths', 'Forces')}</p>
                          <ul className="space-y-0.5">
                            {comp.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-red-500 mb-1">{t('Weaknesses', 'Faiblesses')}</p>
                          <ul className="space-y-0.5">
                            {comp.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <XCircle className="w-3 h-3 text-red-300 shrink-0 mt-0.5" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Feature icons row */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200/60">
                        {FEATURE_COLUMNS.map((col) => (
                          <div key={col.key} className="flex items-center gap-1">
                            <FeatureIcon value={comp.features[col.key]} />
                            <span className="text-[9px] text-gray-400">{col.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Sources */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-200/40">
                        {comp.sources.map((src, i) => (
                          <SourceLink key={i} href={src.url}>{src.label}</SourceLink>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </motion.section>

        {/* ── 5. Feature Comparison Table ──────────────────────── */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle={t('Bloomsline is the only platform that checks every box', 'Bloomsline est la seule plateforme qui coche toutes les cases')}>
            {t('Feature Comparison', 'Comparaison des fonctionnalites')}
          </SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium w-36">{t('Company', 'Entreprise')}</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('Pricing', 'Tarification')}</th>
                  {FEATURE_COLUMNS.map((col) => (
                    <th key={col.key} className="text-center py-2 px-2 text-gray-500 font-medium">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-900 text-white rounded-lg">
                  <td className="py-2.5 pr-4 font-bold rounded-l-lg pl-3">Bloomsline Care</td>
                  <td className="py-2.5 px-2 font-semibold">\u20AC19-49/{t('mo', 'mois')}</td>
                  {FEATURE_COLUMNS.map((col) => (
                    <td key={col.key} className="text-center py-2.5 px-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                    </td>
                  ))}
                </tr>
                {COMPETITORS.map((comp) => (
                  <tr key={comp.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{comp.name}</td>
                    <td className="py-2 px-2 text-gray-400">
                      <a href={comp.pricingSource.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors" title={comp.pricingSource.label}>
                        {comp.pricing}
                      </a>
                    </td>
                    {FEATURE_COLUMNS.map((col) => (
                      <td key={col.key} className="text-center py-2 px-2">
                        <FeatureIcon value={comp.features[col.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1 text-[10px] text-gray-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t('Yes', 'Oui')}</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400"><Minus className="w-3 h-3 text-amber-400" /> {t('Partial', 'Partiel')}</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400"><XCircle className="w-3 h-3 text-gray-200" /> {t('No', 'Non')}</span>
            </div>
          </div>
        </motion.section>

        {/* ── 6. Competitive Moats ────────────────────────────── */}
        <motion.section {...fadeUp(0.25)}>
          <SectionTitle subtitle={t('What makes each competitor hard to displace \u2014 and what makes Bloomsline defensible', 'Ce qui rend chaque concurrent difficile a deplacer \u2014 et ce qui rend Bloomsline defensible')}>
            {t('Competitive Moats', 'Avantages concurrentiels')}
          </SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto mb-6">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">{t('Competitor Moats', 'Avantages des concurrents')}</h3>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium w-32">{t('Competitor', 'Concurrent')}</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('Primary Moat', 'Avantage principal')}</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium w-24">{t('Threat', 'Menace')}</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((comp) => {
                  const cat = CATEGORIES.find((c) => c.id === comp.category)!
                  return (
                    <tr key={comp.name} className="border-b border-gray-50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                          <span className="font-medium text-gray-800">{comp.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{comp.moat}</td>
                      <td className="py-2 px-2"><ThreatBadge level={comp.threatLevel} t={t} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h3 className="text-xs font-semibold text-gray-700 mb-3">{t('Bloomsline\u2019s Defensibility', 'Defensibilite de Bloomsline')}</h3>
          <div className="space-y-3">
            {DIFFERENTIATORS.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.title} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900">{d.title}</p>
                      <span className="text-[10px] text-gray-400">\u2014 {d.subtitle}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{d.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 7. Threat Assessment ────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('Which competitors could block us \u2014 and why we believe we can win anyway', 'Quels concurrents pourraient nous bloquer \u2014 et pourquoi nous pensons pouvoir gagner malgre tout')}>
            {t('Threat Assessment', 'Evaluation des menaces')}
          </SectionTitle>

          {(() => {
            const high = COMPETITORS.filter((c) => c.threatLevel === 'high')
            const medium = COMPETITORS.filter((c) => c.threatLevel === 'medium')
            const low = COMPETITORS.filter((c) => c.threatLevel === 'low')
            return (
              <div className="space-y-4">
                {high.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{'\ud83d\udd34'}</span>
                      <h3 className="text-xs font-bold text-red-700">{t('High Threat', 'Menace elevee')}</h3>
                    </div>
                    {high.map((comp) => (
                      <div key={comp.name} className="bg-red-50 border border-red-200 rounded-xl p-5 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-red-800">{comp.name}</span>
                          <span className="text-[10px] text-red-500">{comp.fundingOrScale}</span>
                        </div>
                        <p className="text-xs text-red-700 mb-2">{comp.threatReason}</p>
                        <div className="bg-white/60 rounded-lg p-3 mb-2">
                          <p className="text-[10px] font-semibold text-gray-700 mb-0.5">{t('Our defense:', 'Notre defense :')}</p>
                          <p className="text-[10px] text-gray-600 leading-relaxed">{comp.defense}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {comp.sources.map((src, i) => (
                            <SourceLink key={i} href={src.url}>{src.label}</SourceLink>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {medium.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{'\ud83d\udfe1'}</span>
                      <h3 className="text-xs font-bold text-amber-700">{t('Medium Threat', 'Menace moyenne')}</h3>
                    </div>
                    <div className="space-y-2">
                      {medium.map((comp) => (
                        <div key={comp.name} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-800">{comp.name}</span>
                            <span className="text-[10px] text-amber-500">{comp.fundingOrScale}</span>
                          </div>
                          <p className="text-[10px] text-amber-700 mb-2">{comp.threatReason}</p>
                          <div className="bg-white/60 rounded-lg p-2.5 mb-2">
                            <p className="text-[10px] font-semibold text-gray-700 mb-0.5">{t('Our defense:', 'Notre defense :')}</p>
                            <p className="text-[10px] text-gray-600 leading-relaxed">{comp.defense}</p>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {comp.sources.map((src, i) => (
                              <SourceLink key={i} href={src.url}>{src.label}</SourceLink>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {low.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{'\u26aa'}</span>
                      <h3 className="text-xs font-bold text-gray-500">{t('Low Threat', 'Menace faible')}</h3>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {low.map((comp) => (
                        <div key={comp.name} className="px-4 py-3 flex items-start gap-3">
                          <div className="flex items-center gap-2 shrink-0 w-28">
                            <span className="text-xs font-semibold text-gray-700">{comp.name}</span>
                          </div>
                          <p className="text-[10px] text-gray-500">{comp.threatReason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </motion.section>

        {/* ── 8. Uncontested Market Spaces ─────────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle={t('Where the market is underserved \u2014 openings Bloomsline is built to own', 'Ou le marche est sous-desservi \u2014 des opportunites que Bloomsline est concu pour saisir')}>
            {t('Uncontested Market Spaces', 'Espaces de marche non contestes')}
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UNCONTESTED_SPACES.map((space) => {
              const Icon = space.icon
              return (
                <div key={space.title} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900">{space.title}</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{space.description}</p>
                  <div className="flex items-start gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-emerald-600 font-medium">{space.signal}</p>
                  </div>
                  {'sourceUrl' in space && space.sourceUrl && (
                    <SourceLink href={space.sourceUrl}>{t('Source', 'Source')}</SourceLink>
                  )}
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 9. Market Validation ─────────────────────────────── */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle={t('External signals that confirm our positioning is right', 'Signaux externes qui confirment la justesse de notre positionnement')}>
            {t('Market Validation', 'Validation du marche')}
          </SectionTitle>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">
                  {t('Woebot Shut Down Its Consumer App (June 2025)', 'Woebot a ferme son application grand public (juin 2025)')}
                </p>
                <p className="text-xs text-amber-700 leading-relaxed mb-2">
                  {t(
                    'The most clinically rigorous AI mental health app ($123M raised, Stanford-backed) could not survive as a standalone B2C product. It pivoted to enterprise-only B2B. This validates our thesis: ',
                    'L\u2019application d\u2019IA en sante mentale la plus rigoureuse cliniquement (123 M$ leves, soutenue par Stanford) n\u2019a pas survecu en tant que produit B2C autonome. Elle a pivote vers le B2B entreprise uniquement. Cela valide notre these : '
                  )}
                  <span className="font-semibold">
                    {t('standalone AI mental health apps don\'t work.', 'les applications d\u2019IA autonomes en sante mentale ne fonctionnent pas.')}
                  </span>
                  {' '}
                  {t(
                    'The AI needs to be anchored to a real care relationship. Bloomsline\u2019s B2B2C model \u2014 AI embedded in the practitioner-member journey \u2014 is the sustainable path.',
                    'L\u2019IA doit etre ancree dans une vraie relation de soins. Le modele B2B2C de Bloomsline \u2014 l\u2019IA integree dans le parcours praticien-membre \u2014 est la voie durable.'
                  )}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <SourceLink href="https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/">STAT News \u2014 Why Woebot shut down</SourceLink>
                  <SourceLink href="https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app">MobiHealthNews \u2014 Woebot app shutdown</SourceLink>
                  <SourceLink href="https://bhbusiness.com/2022/03/20/woebot-health-gets-9m-investment-from-bayer-ag-brings-total-funding-to-123m/">BHB \u2014 $123M total funding</SourceLink>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-800 mb-1">
                  {t('The European Opportunity', 'L\u2019opportunite europeenne')}
                </p>
                <p className="text-xs text-indigo-700 leading-relaxed mb-2">
                  {t('SimplePractice, BetterHelp, Spring Health \u2014 ', 'SimplePractice, BetterHelp, Spring Health \u2014 ')}
                  <span className="font-semibold">
                    {t('none operate in Europe.', 'aucun n\u2019opere en Europe.')}
                  </span>
                  {' '}
                  {t(
                    'Doctolib dominates booking but isn\u2019t a care platform. Moka.care and Unmind serve enterprises only. There is no AI-native, practitioner-focused mental health SaaS for the European market. Bloomsline is building in this white space \u2014 GDPR-native, French-first, with EN/FR/ES from day one.',
                    'Doctolib domine la reservation mais n\u2019est pas une plateforme de soins. Moka.care et Unmind ne servent que les entreprises. Il n\u2019existe aucun SaaS de sante mentale natif IA et centre sur les praticiens pour le marche europeen. Bloomsline construit dans cet espace vierge \u2014 natif RGPD, francais d\u2019abord, avec EN/FR/ES des le premier jour.'
                  )}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <SourceLink href="https://www.grandviewresearch.com/horizon/outlook/mental-health-apps-market/europe">Grand View Research \u2014 EU Mental Health Apps Market</SourceLink>
                  <SourceLink href="https://sifted.eu/articles/doctolib-results-2024">Sifted \u2014 Doctolib 2024 results</SourceLink>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 10. How Bloomsline Wins ──────────────────────────── */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle={t('Our competitive strategy', 'Notre strategie concurrentielle')}>
            {t('How Bloomsline Wins', 'Comment Bloomsline gagne')}
          </SectionTitle>
          <div className="space-y-3">
            {STRATEGIC_RECS.map((rec) => {
              const Icon = rec.icon
              return (
                <div key={rec.title} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={rec.priority} t={t} />
                      <p className="text-xs font-bold text-gray-900">{rec.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{rec.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 shrink-0 mt-1" />
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 11. Sources ─────────────────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle={t('All data points on this page are sourced from public filings, pricing pages, press coverage, and analyst reports', 'Toutes les donnees de cette page proviennent de documents publics, pages de tarification, couverture presse et rapports d\u2019analystes')}>
            {t('Sources', 'Sources')}
          </SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {ALL_SOURCES.map((src, i) => (
                <div key={i} className="py-1">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700 leading-relaxed inline-flex items-start gap-1"
                  >
                    <span className="text-gray-300 shrink-0 font-mono w-4 text-right">{i + 1}.</span>
                    <span>{src.label}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── 12. Footer ──────────────────────────────────────── */}
        <motion.div {...fadeUp(0.55)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Research as of Feb 2026 \u2014 Bloomsline Care', 'Recherche en date de fev. 2026 \u2014 Bloomsline Care')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
