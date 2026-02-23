'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import {
  Globe,
  Target,
  Crosshair,
  TrendingUp,
  Users,
  Building2,
  Heart,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  ChevronRight,
  Info,
  Shield,
  Landmark,
  Stethoscope,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

interface MarketLayer {
  label: string
  sublabel: string
  size2025: string
  size2030: string
  cagr: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Globe
  description: string
  sources: { label: string; url: string }[]
}

interface Assumption {
  label: string
  value: string
  source: string
  url: string
  why: string
}

interface BottomUpRow {
  label: string
  description: string
  b2b: string
  b2c: string
  calc?: string
  sources?: { label: string; url: string }[]
}

interface CompReport {
  firm: string
  metric: string
  value: string
  year: string
  url: string
  context: string
}

interface GrowthYear {
  year: string
  tam: number
  sam: number
  som: number
}

// ── Translation helper type ─────────────────────────────────────────────

type T = (en: string, fr: string) => string

// ── Data (translation-aware) ────────────────────────────────────────────

function getMarketLayers(t: T): MarketLayer[] {
  return [
    {
      label: 'TAM',
      sublabel: t('Total Addressable Market', 'Marche total adressable'),
      size2025: '$33B',
      size2030: '$88B',
      cagr: '18.6%',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      icon: Globe,
      description: t(
        'Global digital mental health market — teletherapy, digital therapeutics, practice software, and wellness apps.',
        'Marche mondial de la sante mentale numerique — teletherapie, therapeutiques numeriques, logiciels de cabinet et applications de bien-etre.'
      ),
      sources: [
        { label: 'Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing' },
        { label: 'Market Research Future', url: 'https://www.marketresearchfuture.com/reports/digital-mental-health-market-11062' },
      ],
    },
    {
      label: 'SAM',
      sublabel: t('Serviceable Available Market', 'Marche disponible adressable'),
      size2025: '$5.5B',
      size2030: '$12B',
      cagr: '14.1%',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      icon: Target,
      description: t(
        'Practice management software + mental health apps in our launch markets (Europe, North America). The tools practitioners and members actually buy today.',
        'Logiciels de gestion de cabinet + applications de sante mentale dans nos marches de lancement (Europe, Amerique du Nord). Les outils que les praticiens et les membres achetent aujourd\'hui.'
      ),
      sources: [
        { label: 'Verified Market Reports', url: 'https://www.verifiedmarketreports.com/product/mental-health-practice-management-software-market/' },
        { label: 'Grand View Research', url: 'https://www.grandviewresearch.com/industry-analysis/mental-health-apps-market-report' },
      ],
    },
    {
      label: 'SOM',
      sublabel: t('Serviceable Obtainable Market', 'Marche reellement accessible'),
      size2025: '$180M',
      size2030: '$500M',
      cagr: '22.7%',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: Crosshair,
      description: t(
        'Practitioners actively seeking between-session engagement tools in Europe + early North America. Our realistic capture within 5 years.',
        'Praticiens recherchant activement des outils d\'engagement entre les seances en Europe + debut en Amerique du Nord. Notre capture realiste sur 5 ans.'
      ),
      sources: [
        { label: 'Grand View Research — Behavioral Health Software', url: 'https://www.grandviewresearch.com/industry-analysis/behavioral-mental-health-care-software-market' },
        { label: t('Internal bottom-up model', 'Modele ascendant interne'), url: '/financial-model' },
      ],
    },
  ]
}

const GROWTH_DATA: GrowthYear[] = [
  { year: '2025', tam: 33, sam: 5.5, som: 0.18 },
  { year: '2026', tam: 39, sam: 6.3, som: 0.25 },
  { year: '2027', tam: 46, sam: 7.2, som: 0.32 },
  { year: '2028', tam: 55, sam: 8.2, som: 0.40 },
  { year: '2029', tam: 65, sam: 9.4, som: 0.45 },
  { year: '2030', tam: 88, sam: 12.0, som: 0.50 },
]

function getTopDownAssumptions(t: T): Assumption[] {
  return [
    { label: t('Total market today', 'Marche total aujourd\'hui'), value: '$33B', source: 'Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing', why: t('How much the world spends on digital mental health right now. This is the biggest circle — our starting point.', 'Combien le monde depense en sante mentale numerique actuellement. C\'est le plus grand cercle — notre point de depart.') },
    { label: t('How fast it\'s growing', 'Vitesse de croissance'), value: '18.6%/yr', source: 'Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing', why: t('The market nearly triples in a decade. Demand is going up, not slowing down.', 'Le marche triple presque en une decennie. La demande augmente, elle ne ralentit pas.') },
    { label: t('What practitioners spend on tools', 'Ce que les praticiens depensent en outils'), value: '$2.1B', source: 'Verified Market Reports', url: 'https://www.verifiedmarketreports.com/product/mental-health-practice-management-software-market/', why: t('Money already being spent on tools like SimplePractice and TherapyNotes. Bloomsline competes for this budget.', 'Argent deja depense pour des outils comme SimplePractice et TherapyNotes. Bloomsline est en concurrence pour ce budget.') },
    { label: t('What members spend on wellness apps', 'Ce que les membres depensent en applications de bien-etre'), value: '$7.5B', source: 'Grand View Research', url: 'https://www.grandviewresearch.com/industry-analysis/mental-health-apps-market-report', why: t('What people pay for apps like Headspace and Calm. Bloomsline\'s member premium plan taps into this.', 'Ce que les gens paient pour des applications comme Headspace et Calm. Le plan premium membre de Bloomsline exploite ce segment.') },
    { label: t('We sell to both sides', 'Nous vendons aux deux cotes'), value: 'B2B + B2C', source: 'Internal', url: '/competitive-landscape', why: t('Most competitors pick one side. Bloomsline sells to practitioners and gives their clients a free app — one sale reaches ~30 people.', 'La plupart des concurrents choisissent un cote. Bloomsline vend aux praticiens et offre a leurs clients une application gratuite — une vente atteint environ 30 personnes.') },
    { label: t('We start in Europe + North America', 'Nous commencons en Europe + Amerique du Nord'), value: t('~65% of spend', '~65% des depenses'), source: 'Grand View Research', url: 'https://www.grandviewresearch.com/industry-analysis/mental-health-apps-market-report', why: t('These two regions make up most of the global spending. Europe first (founder network), then North America.', 'Ces deux regions representent la majorite des depenses mondiales. L\'Europe d\'abord (reseau du fondateur), puis l\'Amerique du Nord.') },
  ]
}

function getBottomUp(t: T): BottomUpRow[] {
  return [
    { label: t('Addressable practitioners', 'Praticiens adressables'), description: t('Total therapists, psychologists, and counselors in our launch markets', 'Total des therapeutes, psychologues et conseillers dans nos marches de lancement'), b2b: '530K (US) + 400K (EU)', b2c: '—', calc: t('US: ~530K licensed mental health professionals (APA, HRSA). EU: ~400K psychologists + counselors (WHO, Eurostat). Only counting licensed practitioners in our Phase 1–2 markets.', 'US : ~530K professionnels de sante mentale agrees (APA, HRSA). UE : ~400K psychologues + conseillers (OMS, Eurostat). Seuls les praticiens agrees dans nos marches Phase 1-2.'), sources: [{ label: 'APA — Therapist Count', url: 'https://www.autonotes.ai/blog/how-many-therapists-are-in-the-us/' }, { label: 'HRSA — Behavioral Health Workforce 2025', url: 'https://bhw.hrsa.gov/sites/default/files/bureau-health-workforce/data-research/Behavioral-Health-Workforce-Brief-2025.pdf' }, { label: 'WHO — Mental Health Workers', url: 'https://www.who.int/data/gho/data/themes/topics/indicator-groups/indicator-group-details/GHO/mental-health-workers' }, { label: 'Eurostat — Psychiatrists in Europe', url: 'https://ec.europa.eu/eurostat/web/products-eurostat-news/-/ddn-20200506-1' }] },
    { label: t('Target penetration (5yr)', 'Penetration cible (5 ans)'), description: t('Realistic share of practitioners we can convert within 5 years', 'Part realiste des praticiens que nous pouvons convertir en 5 ans'), b2b: '1–2%', b2c: '—', calc: t('Seed-stage SaaS benchmarks: 0.5–2% penetration in Year 5 is standard. We use 1–2% given PLG distribution (one sale → 30 members) and Care Network Effect.', 'Benchmarks SaaS en phase d\'amorcage : 0,5-2% de penetration en annee 5 est standard. Nous utilisons 1-2% compte tenu de la distribution PLG (une vente → 30 membres) et de l\'effet reseau de soins.') },
    { label: t('Paying practitioners', 'Praticiens payants'), description: t('Number of practitioners on a paid subscription by Year 5', 'Nombre de praticiens sur un abonnement payant en annee 5'), b2b: '~7,500', b2c: '—', calc: t('930K addressable × 0.8% midpoint penetration ≈ 7,500 paying practitioners. SimplePractice reached 200K+ in ~10 years for reference.', '930K adressables × 0,8% de penetration au point median ≈ 7 500 praticiens payants. SimplePractice a atteint 200K+ en environ 10 ans pour reference.'), sources: [{ label: 'SimplePractice — EngageSmart Acquisition', url: 'https://www.summitpartners.com/news/vista-equity-partners-completes-acquisition-of-engagesmart' }] },
    { label: t('Avg. revenue / practitioner / yr', 'Revenu moy. / praticien / an'), description: t('Blended annual subscription revenue per practitioner', 'Revenu d\'abonnement annuel mixte par praticien'), b2b: '€470 (~$510)', b2c: '—', calc: t('Starter: €22/mo, Professional: €79/mo. Assuming 70% Starter + 30% Professional: (0.7 × 22) + (0.3 × 79) = €39/mo → €468/yr ≈ €470. Conservative — excludes tax and annual plan discounts.', 'Starter : 22€/mois, Professional : 79€/mois. En supposant 70% Starter + 30% Professional : (0,7 × 22) + (0,3 × 79) = 39€/mois → 468€/an ≈ 470€. Conservateur — hors taxes et remises sur abonnement annuel.'), sources: [{ label: 'Bloomsline Pricing', url: '/pitch-new' }] },
    { label: t('Members per practitioner', 'Membres par praticien'), description: t('Average clients each practitioner invites to the platform', 'Nombre moyen de clients que chaque praticien invite sur la plateforme'), b2b: '—', b2c: t('30 avg', '30 en moy.'), calc: t('APA data shows average active caseload for a therapist is 20–40 clients. Not all will accept the invite — assuming ~75% adoption (it\'s free and recommended by their therapist): 40 × 0.75 = 30. Practitioners already get full value without members (notes, sessions, CRM, booking). Member invites are optional and additive — unlocking between-session visibility and shared resources.', 'Les donnees de l\'APA montrent que la charge active moyenne d\'un therapeute est de 20-40 clients. Tous n\'accepteront pas l\'invitation — en supposant environ 75% d\'adoption (c\'est gratuit et recommande par leur therapeute) : 40 × 0,75 = 30. Les praticiens tirent deja pleinement profit sans les membres (notes, seances, CRM, reservations). Les invitations de membres sont optionnelles et additives — offrant une visibilite entre les seances et des ressources partagees.'), sources: [{ label: 'APA — Mental Health Care Access', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' }] },
    { label: t('Active members (Year 5)', 'Membres actifs (annee 5)'), description: t('Total members using the platform through their practitioners', 'Total des membres utilisant la plateforme via leurs praticiens'), b2b: '—', b2c: '~225,000', calc: t('7,500 practitioners × 30 members each = 225,000 active members on the platform. Zero acquisition cost — distributed through practitioners.', '7 500 praticiens × 30 membres chacun = 225 000 membres actifs sur la plateforme. Cout d\'acquisition nul — distribue via les praticiens.') },
    { label: t('B2C freemium conversion', 'Conversion freemium B2C'), description: t('Share of free members who upgrade to a paid personal plan', 'Part des membres gratuits qui passent a un plan personnel payant'), b2b: '—', b2c: '5–8%', calc: t('Industry benchmark: freemium-to-paid conversion in health apps is 2–10% (Headspace ~6%, Calm ~4%). We use 5–8% given the practitioner trust channel driving adoption.', 'Benchmark sectoriel : la conversion freemium-payant dans les applications de sante est de 2-10% (Headspace ~6%, Calm ~4%). Nous utilisons 5-8% compte tenu du canal de confiance du praticien stimulant l\'adoption.'), sources: [{ label: 'Business of Apps — Headspace Stats', url: 'https://www.businessofapps.com/data/headspace-statistics/' }] },
    { label: t('B2C ARPU / yr', 'ARPU B2C / an'), description: t('Average revenue per paying member per year', 'Revenu moyen par membre payant par an'), b2b: '—', b2c: '€36 (~$40)', calc: t('Priced at €3/mo for premium member features (AI companion, advanced insights, extra rituals). €3 × 12 = €36/yr. Well below Headspace ($70/yr) — accessible by design.', 'Au prix de 3€/mois pour les fonctionnalites premium membre (compagnon IA, analyses avancees, rituels supplementaires). 3€ × 12 = 36€/an. Bien en dessous de Headspace (70$/an) — accessible par conception.') },
    { label: t('Annual B2B revenue', 'Revenu annuel B2B'), description: t('Practitioner subscription revenue at Year 5', 'Revenu d\'abonnement des praticiens en annee 5'), b2b: '$3.8M', b2c: '—', calc: t('7,500 practitioners × €470/yr = €3.5M ≈ $3.8M USD. This is the primary revenue engine.', '7 500 praticiens × 470€/an = 3,5M€ ≈ 3,8M$ USD. C\'est le moteur de revenu principal.') },
    { label: t('Annual B2C revenue', 'Revenu annuel B2C'), description: t('Member premium plan revenue at Year 5', 'Revenu du plan premium membre en annee 5'), b2b: '—', b2c: '$0.6M', calc: t('225,000 members × 6.5% conversion × €36/yr = €527K ≈ $0.6M USD. Upside channel — not required for unit economics to work.', '225 000 membres × 6,5% de conversion × 36€/an = 527K€ ≈ 0,6M$ USD. Canal supplementaire — non necessaire pour que l\'economie unitaire fonctionne.') },
    { label: t('Total bottom-up ARR (Year 5)', 'ARR ascendant total (annee 5)'), description: t('Combined annual recurring revenue from both sides', 'Revenu recurrent annuel combine des deux cotes'), b2b: t('$4.4M combined', '$4.4M combines'), b2c: '', calc: t('$3.8M (B2B) + $0.6M (B2C) = $4.4M ARR. Represents 0.04% of SAM — conservative and realistic for seed-stage.', '3,8M$ (B2B) + 0,6M$ (B2C) = 4,4M$ ARR. Represente 0,04% du SAM — conservateur et realiste pour une phase d\'amorcage.') },
  ]
}

function getCompReports(t: T): CompReport[] {
  return [
    { firm: 'Grand View Research', metric: t('Mental Health Apps Market', 'Marche des applications de sante mentale'), value: '$7.5B → $17.5B', year: '2025–2030', url: 'https://www.grandviewresearch.com/industry-analysis/mental-health-apps-market-report', context: t('Consumer apps like Headspace and Calm. This is our B2C benchmark — Bloomsline\'s member side competes here at a lower price point.', 'Applications grand public comme Headspace et Calm. C\'est notre benchmark B2C — le volet membre de Bloomsline est en concurrence ici a un prix inferieur.') },
    { firm: 'Towards Healthcare', metric: t('Digital Mental Health Market', 'Marche de la sante mentale numerique'), value: '$33B → $153B', year: '2025–2034', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing', context: t('The broadest view — everything digital in mental health. This is our TAM source. The 4.6x growth over 9 years confirms the market is expanding rapidly.', 'La vision la plus large — tout le numerique en sante mentale. C\'est notre source TAM. La croissance de 4,6x sur 9 ans confirme que le marche se developpe rapidement.') },
    { firm: 'Verified Market Reports', metric: t('Practice Management Software', 'Logiciels de gestion de cabinet'), value: '$2.1B → $5.5B', year: '2024–2033', url: 'https://www.verifiedmarketreports.com/product/mental-health-practice-management-software-market/', context: t('Tools like SimplePractice and TherapyNotes. This is Bloomsline\'s direct B2B competitor space — what practitioners already pay for today.', 'Outils comme SimplePractice et TherapyNotes. C\'est l\'espace concurrent direct B2B de Bloomsline — ce que les praticiens paient deja aujourd\'hui.') },
    { firm: 'Fortune Business Insights', metric: t('Mental Health Apps', 'Applications de sante mentale'), value: '$7.2B → $35.3B', year: '2025–2034', url: 'https://www.fortunebusinessinsights.com/mental-health-apps-market-109012', context: t('A second independent estimate for the B2C apps market. Cross-validates the Grand View number and shows even faster long-term growth.', 'Une deuxieme estimation independante du marche des applications B2C. Valide le chiffre de Grand View et montre une croissance encore plus rapide a long terme.') },
    { firm: 'Grand View Research', metric: t('Behavioral Health Software', 'Logiciels de sante comportementale'), value: '$4.7B → $12B+', year: '2025–2030', url: 'https://www.grandviewresearch.com/industry-analysis/behavioral-mental-health-care-software-market', context: t('Broader than practice management — includes EHRs, clinical tools, and outcomes tracking. Bloomsline\'s clinical features (notes, progress, sessions) sit in this space.', 'Plus large que la gestion de cabinet — inclut les DSE, les outils cliniques et le suivi des resultats. Les fonctionnalites cliniques de Bloomsline (notes, progres, seances) se situent dans cet espace.') },
    { firm: 'Mordor Intelligence', metric: t('Digital Therapeutics', 'Therapeutiques numeriques'), value: '$7.7B → $32.5B', year: '2024–2030', url: 'https://www.mordorintelligence.com/industry-reports/digital-therapeutic-devices-market', context: t('FDA-approved digital treatments and evidence-based interventions. An adjacent market — Bloomsline isn\'t a DTx today, but could evolve toward clinical validation.', 'Traitements numeriques approuves par la FDA et interventions basees sur les preuves. Un marche adjacent — Bloomsline n\'est pas un DTx aujourd\'hui, mais pourrait evoluer vers la validation clinique.') },
  ]
}

interface TailwindItem {
  icon: typeof TrendingUp
  text: string
  context: string
  source?: { label: string; url: string }
}

function getEuropeTailwinds(t: T): TailwindItem[] {
  return [
    { icon: Landmark, text: t('France reimburses 12 psychology sessions/year — no GP referral required', 'La France rembourse 12 seances de psychologie/an — sans ordonnance du medecin'), context: t('Mental health is France\'s "Grande Cause Nationale" for 2025. Government is funding both patient demand and practitioner supply — 5,500+ partner psychologists enrolled.', 'La sante mentale est la « Grande Cause Nationale » de la France pour 2025. Le gouvernement finance la demande des patients et l\'offre de praticiens — plus de 5 500 psychologues partenaires inscrits.'), source: { label: 'info.gouv.fr', url: 'https://www.info.gouv.fr/actualite/monparcourspsy-un-dispositif-pour-faciliter-lacces-a-un-accompagnement-psychologique' } },
    { icon: Building2, text: t('EU commits €1.23B to mental health — 20 flagship initiatives', 'L\'UE engage 1,23 Md€ pour la sante mentale — 20 initiatives phares'), context: t('First time the EU treats mental health as a cross-policy priority on par with physical health. Regulatory frameworks being built now will define the next decade of digital health.', 'Premiere fois que l\'UE traite la sante mentale comme une priorite transversale au meme titre que la sante physique. Les cadres reglementaires en cours de construction definiront la prochaine decennie de la sante numerique.'), source: { label: 'European Commission', url: 'https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/promoting-our-european-way-life/european-health-union/comprehensive-approach-mental-health_en' } },
    { icon: Stethoscope, text: t('Germany\'s DiGA: 1M+ prescriptions for digital health apps — mental health is the #1 category', 'DiGA en Allemagne : 1M+ de prescriptions pour les applications de sante numerique — la sante mentale est la categorie n°1'), context: t('World\'s first national insurance-reimbursement pathway for digital health apps. 45% of approved DiGAs target mental health. A model being studied across the EU.', 'Premier systeme national de remboursement par l\'assurance pour les applications de sante numerique. 45% des DiGA approuvees ciblent la sante mentale. Un modele etudie dans toute l\'UE.'), source: { label: 'npj Digital Medicine', url: 'https://www.nature.com/articles/s41746-024-01137-1' } },
    { icon: Shield, text: t('GDPR + European Health Data Space = structural trust advantage for EU-native health tech', 'RGPD + Espace europeen des donnees de sante = avantage structurel de confiance pour la sante numerique native UE'), context: t('In mental health — where data sensitivity is highest — GDPR compliance is a product differentiator. EU-native companies have inherent advantages over US platforms retrofitting compliance.', 'En sante mentale — ou la sensibilite des donnees est maximale — la conformite au RGPD est un differentiant produit. Les entreprises natives de l\'UE ont un avantage inherent par rapport aux plateformes americaines qui adaptent leur conformite.'), source: { label: 'European Commission — EHDS', url: 'https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en' } },
    { icon: Users, text: t('Europe has only 9.7 psychiatrists per 100K people — and the workforce is shrinking', 'L\'Europe ne compte que 9,7 psychiatres pour 100K habitants — et les effectifs diminuent'), context: t('Acute shortages mean existing practitioners must serve growing demand. Tools that multiply practitioner capacity and efficiency aren\'t nice-to-haves — they address a system-level crisis.', 'Les penuries aigues signifient que les praticiens existants doivent repondre a une demande croissante. Les outils qui multiplient la capacite et l\'efficacite des praticiens ne sont pas un luxe — ils repondent a une crise systemique.'), source: { label: 'WHO/Europe', url: 'https://www.who.int/europe/health-topics/mental-health' } },
    { icon: DollarSign, text: t('Mental health costs Europe €600B+ annually — 4% of EU GDP', 'La sante mentale coute a l\'Europe plus de 600 Md€ par an — 4% du PIB de l\'UE'), context: t('Productivity losses (€240–260B) exceed direct healthcare spending (€190B). The business case for employer-purchased mental health tools is built on measurable ROI, not altruism.', 'Les pertes de productivite (240-260 Md€) depassent les depenses directes de sante (190 Md€). L\'argumentaire economique pour les outils de sante mentale achetes par les employeurs repose sur un ROI mesurable, pas sur l\'altruisme.'), source: { label: 'European Parliament', url: 'https://www.europarl.europa.eu/RegData/etudes/BRIE/2023/751416/EPRS_BRI(2023)751416_EN.pdf' } },
  ]
}

function getGlobalTailwinds(t: T): TailwindItem[] {
  return [
    { icon: TrendingUp, text: t('Post-2020 destigmatization — mental health is mainstream, teletherapy is permanent', 'Destigmatisation post-2020 — la sante mentale est grand public, la teletherapie est permanente'), context: t('Teletherapy adoption was forced by COVID but retained because patients prefer it. This is permanent behavioral change, not a cyclical trend. The market nearly triples by 2034.', 'L\'adoption de la teletherapie a ete forcee par le COVID mais maintenue car les patients la preferent. C\'est un changement comportemental permanent, pas une tendance cyclique. Le marche triple presque d\'ici 2034.'), source: { label: 'Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing' } },
    { icon: AlertTriangle, text: t('1 billion people live with a mental health condition — 91% with depression can\'t access care', '1 milliard de personnes vivent avec un trouble de sante mentale — 91% des personnes depressives n\'ont pas acces aux soins'), context: t('The treatment gap is the defining structural fact of the market. Only 2% of health budgets go to mental health globally. Any scalable digital model addresses a need affecting hundreds of millions.', 'Le deficit de traitement est le fait structurel determinant du marche. Seuls 2% des budgets de sante sont consacres a la sante mentale dans le monde. Tout modele numerique evolutif repond a un besoin touchant des centaines de millions de personnes.'), source: { label: 'WHO Mental Health Atlas 2024', url: 'https://www.who.int/news/item/02-09-2025-who-releases-new-reports-and-estimates-highlighting-urgent-gaps-in-mental-health' } },
    { icon: Briefcase, text: t('Mental health is now the #1 global health concern for employees — top 5 cost driver for employers', 'La sante mentale est desormais la preoccupation n°1 de sante pour les employes — dans le top 5 des couts pour les employeurs'), context: t('Ipsos 2024: #1 health concern across 31 countries. $438B in global productivity losses. Employers are now pushed by measurable cost pressure to invest, creating a B2B buyer willing to pay.', 'Ipsos 2024 : preoccupation de sante n°1 dans 31 pays. 438 Md$ de pertes de productivite mondiales. Les employeurs sont desormais pousses par une pression de couts mesurable a investir, creant un acheteur B2B pret a payer.'), source: { label: 'Business Group on Health', url: 'https://www.businessgrouphealth.org/topics/blog/growing-mental-health-needs-drive-costs-globally' } },
    { icon: Heart, text: t('49% of people with mental health issues already use AI for support', '49% des personnes ayant des troubles de sante mentale utilisent deja l\'IA pour se soutenir'), context: t('Consumer comfort with AI-assisted care is growing faster than regulation. Products that combine human connection with AI augmentation are positioned for the next wave of adoption.', 'Le confort des consommateurs avec les soins assistes par IA croit plus vite que la reglementation. Les produits combinant connexion humaine et augmentation par IA sont positionnes pour la prochaine vague d\'adoption.') },
    { icon: DollarSign, text: t('Insurance payers demand measurable outcomes — drives adoption of tracking tools', 'Les assureurs exigent des resultats mesurables — stimulant l\'adoption des outils de suivi'), context: t('Reimbursement is shifting from fee-for-service to value-based care. Platforms that capture progress data give practitioners evidence payers require — and create stickiness.', 'Le remboursement evolue du paiement a l\'acte vers les soins bases sur la valeur. Les plateformes qui capturent les donnees de progres fournissent aux praticiens les preuves exigees par les payeurs — et creent de la fidelisation.') },
  ]
}

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

// ── Concentric circles visual ────────────────────────────────────────────

function ConcentricCircles() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center">
      <motion.div
        className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-2 bg-indigo-50 border-indigo-200 flex items-center justify-center relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] font-bold text-indigo-500">TAM</p>
          <p className="text-sm font-bold text-indigo-600">$33B</p>
        </span>
        <motion.div
          className="w-48 h-48 sm:w-52 sm:h-52 rounded-full border-2 bg-violet-50 border-violet-200 flex items-center justify-center relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
            <p className="text-[10px] font-bold text-violet-500">SAM</p>
            <p className="text-sm font-bold text-violet-600">$5.5B</p>
          </span>
          <motion.div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 bg-emerald-50 border-emerald-200 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="text-center">
              <p className="text-[10px] font-bold text-emerald-500">SOM</p>
              <p className="text-sm font-bold text-emerald-600">$180M</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}


// ── Page ──────────────────────────────────────────────────────────────────

function BottomUpSection({ t }: { t: T }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const bottomUpData = getBottomUp(t)

  return (
    <motion.section {...fadeUp(0.25)}>
      <SectionTitle subtitle={t('Unit economics x potential customers — validates top-down estimates', 'Economie unitaire x clients potentiels — valide les estimations descendantes')}>{t('Bottom-Up Approach', 'Approche ascendante')}</SectionTitle>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-5 py-3 border-b border-gray-100">
          <span>{t('Metric', 'Indicateur')}</span>
          <span className="text-center">{t('B2B (Practitioners)', 'B2B (Praticiens)')}</span>
          <span className="text-center">{t('B2C (Members)', 'B2C (Membres)')}</span>
        </div>
        {bottomUpData.map((row, i) => (
          <div key={row.label}>
            <motion.div
              className={`grid grid-cols-3 px-5 py-3 text-xs cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${row.label.startsWith(t('Total', 'ARR')) ? 'border-t-2 border-gray-200 bg-emerald-50 font-semibold' : ''} ${expandedRow === row.label ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.03 }}
              onClick={() => setExpandedRow(expandedRow === row.label ? null : row.label)}
            >
              <div>
                <span className="text-gray-700 flex items-center gap-1.5">
                  {row.label}
                  {row.calc && <Info className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                </span>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{row.description}</p>
              </div>
              <span className="text-center text-gray-900 self-center">{row.b2b || '—'}</span>
              <span className="text-center text-gray-900 self-center">{row.b2c || '—'}</span>
            </motion.div>
            <AnimatePresence>
              {expandedRow === row.label && row.calc && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100">
                    <p className="text-[11px] text-indigo-700 leading-relaxed">{row.calc}</p>
                    {row.sources && row.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {row.sources.map((s) => (
                          <a
                            key={s.url}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-500 underline underline-offset-2 decoration-indigo-300 hover:text-indigo-700"
                          >
                            {s.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
        {t(
          'Click any row to see how the number was calculated. Bottom-up Year 5 ARR of ~$4.4M represents a 0.04% capture of SAM — conservative and realistic for a seed-stage company.',
          'Cliquez sur n\'importe quelle ligne pour voir comment le chiffre a ete calcule. L\'ARR ascendant en annee 5 de ~4,4M$ represente une capture de 0,04% du SAM — conservateur et realiste pour une entreprise en phase d\'amorcage.'
        )}
      </p>
    </motion.section>
  )
}

export default function MarketSizingPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const MARKET_LAYERS = getMarketLayers(t)
  const TOP_DOWN_ASSUMPTIONS = getTopDownAssumptions(t)
  const COMP_REPORTS = getCompReports(t)
  const EUROPE_TAILWINDS = getEuropeTailwinds(t)
  const GLOBAL_TAILWINDS = getGlobalTailwinds(t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">{t('Market Sizing', 'Dimensionnement du marche')}</h1>
            <p className="text-[10px] text-gray-400">{t('Bloomsline Care — TAM / SAM / SOM Analysis', 'Bloomsline Care — Analyse TAM / SAM / SOM')}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {lang === 'en' ? '\ud83c\uddeb\ud83c\uddf7 Fran\u00e7ais' : '\ud83c\uddec\ud83c\udde7 English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">
        {/* ── Hero ───────────────────────────────────────────── */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('$33B market. Growing 18% a year.', 'Un marche de 33 Md$. En croissance de 18% par an.')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Digital mental health is one of the fastest-growing healthcare verticals. Bloomsline sits at the intersection of two underserved segments — practitioner tools (B2B) and between-session member support (B2C) — in a market where neither side is well-connected today.',
              'La sante mentale numerique est l\'un des segments de sante les plus dynamiques. Bloomsline se situe a l\'intersection de deux segments sous-desservis — les outils pour praticiens (B2B) et le soutien des membres entre les seances (B2C) — dans un marche ou aucun des deux cotes n\'est bien connecte aujourd\'hui.'
            )}
          </p>
        </motion.div>

        {/* ── Concentric TAM/SAM/SOM ─────────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle={t('Top-down approach — global market narrowed to our segment', 'Approche descendante — marche mondial restreint a notre segment')}>TAM / SAM / SOM</SectionTitle>
          <ConcentricCircles />

          <div className="grid gap-4 mt-6">
            {MARKET_LAYERS.map((layer, i) => {
              const Icon = layer.icon
              return (
                <motion.div
                  key={layer.label}
                  className={`bg-white border ${layer.borderColor} rounded-xl p-5`}
                  {...fadeUp(0.15 + i * 0.08)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${layer.bgColor} ${layer.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${layer.color}`}>{layer.label}</span>
                        <span className="text-[10px] text-gray-400">{layer.sublabel}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">{layer.description}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                        {layer.sources.map((s) => (
                          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700">
                            {s.label}
                          </a>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400">2025</p>
                          <p className="text-sm font-bold text-gray-900">{layer.size2025}</p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        <div>
                          <p className="text-[10px] text-gray-400">2030</p>
                          <p className="text-sm font-bold text-gray-900">{layer.size2030}</p>
                        </div>
                        <div className="ml-auto">
                          <p className="text-[10px] text-gray-400">{t('CAGR', 'TCAC')}</p>
                          <p className={`text-sm font-bold ${layer.color}`}>{layer.cagr}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── Growth Projections ──────────────────────────────── */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle={t('5-year CAGR projections — each layer at its own scale', 'Projections TCAC sur 5 ans — chaque couche a sa propre echelle')}>{t('Growth Trajectory', 'Trajectoire de croissance')}</SectionTitle>

          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'tam', label: 'TAM', sublabel: t('Global Digital Mental Health', 'Sante mentale numerique mondiale'), insight: t('The rising tide — growing demand for digital mental health tools worldwide.', 'La maree montante — demande croissante d\'outils numeriques de sante mentale dans le monde.'), cagr: '18.6%', stroke: '#818cf8', gradId: 'tamGrad', stopColor: '#818cf8', color: 'text-indigo-600', bg: 'border-indigo-200', formatter: (v: number) => `$${v}B`, sources: [{ label: 'Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing' }] },
              { key: 'sam', label: 'SAM', sublabel: t('Practice Software + Apps', 'Logiciels de cabinet + applications'), insight: t('Where we compete — the tools practitioners and members actually pay for today.', 'La ou nous sommes en concurrence — les outils que les praticiens et les membres paient aujourd\'hui.'), cagr: '14.1%', stroke: '#8b5cf6', gradId: 'samGrad', stopColor: '#8b5cf6', color: 'text-violet-600', bg: 'border-violet-200', formatter: (v: number) => `$${v}B`, sources: [{ label: 'Verified Market Reports', url: 'https://www.verifiedmarketreports.com/product/mental-health-practice-management-software-market/' }] },
              { key: 'som', label: 'SOM', sublabel: t('Between-Session Tools', 'Outils entre les seances'), insight: t('What we can realistically capture — our fastest-growing segment.', 'Ce que nous pouvons capturer de maniere realiste — notre segment a la croissance la plus rapide.'), cagr: '22.7%', stroke: '#10b981', gradId: 'somGrad', stopColor: '#10b981', color: 'text-emerald-600', bg: 'border-emerald-200', formatter: (v: number) => v >= 1 ? `$${v}B` : `$${(v * 1000).toFixed(0)}M`, sources: [{ label: 'Grand View Research', url: 'https://www.grandviewresearch.com/industry-analysis/behavioral-mental-health-care-software-market' }] },
            ].map((chart, ci) => {
              const data = GROWTH_DATA.map((d) => ({ year: d.year, value: d[chart.key as keyof GrowthYear] as number }))
              const first = data[0].value
              const last = data[data.length - 1].value
              return (
                <motion.div
                  key={chart.key}
                  className={`bg-white border ${chart.bg} rounded-xl p-4`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + ci * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className={`text-xs font-bold ${chart.color}`}>{chart.label}</p>
                      <p className="text-[9px] text-gray-400">{chart.sublabel}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${chart.color}`}>{chart.cagr}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold text-gray-900">{chart.formatter(first)}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 mx-0.5" />
                    <span className="text-lg font-bold text-gray-900">{chart.formatter(last)}</span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={chart.gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chart.stopColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={chart.stopColor} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Area type="monotone" dataKey="value" stroke={chart.stroke} strokeWidth={2} fill={`url(#${chart.gradId})`} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-2">{chart.insight}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {chart.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700">
                        {s.label}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── Bottom-Up ──────────────────────────────────────── */}
        <BottomUpSection t={t} />

        {/* ── Key Assumptions ─────────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('These are the building blocks behind our market numbers. Each one explains where a figure comes from and why we used it.', 'Ce sont les elements constitutifs de nos chiffres de marche. Chacun explique d\'ou vient un chiffre et pourquoi nous l\'avons utilise.')}>{t('Key Assumptions', 'Hypotheses cles')}</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOP_DOWN_ASSUMPTIONS.map((a, i) => (
              <motion.div
                key={a.label}
                className="bg-white border border-gray-200 rounded-xl px-4 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-700">{a.label}</p>
                  <span className="text-sm font-bold text-gray-900 ml-3 flex-shrink-0">{a.value}</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{a.why}</p>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700">
                  {a.source}
                </a>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Analyst Comparisons ─────────────────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle={t('We didn\'t pick one source. These are 6 independent reports that back up our numbers — so you don\'t have to take our word for it.', 'Nous n\'avons pas choisi une seule source. Voici 6 rapports independants qui soutiennent nos chiffres — pour que vous n\'ayez pas a nous croire sur parole.')}>{t('Analyst Report Comparison', 'Comparaison des rapports d\'analystes')}</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {COMP_REPORTS.map((r, i) => (
              <motion.div
                key={`${r.firm}-${r.metric}`}
                className="bg-white border border-gray-200 rounded-xl px-4 py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-700">{r.metric}</p>
                  <span className="text-[10px] text-gray-400">{r.year}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-2">{r.value}</p>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{r.context}</p>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700">
                  {r.firm}
                </a>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Why Now / Tailwinds ─────────────────────────────── */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle={t('These aren\'t predictions — they\'re structural shifts already happening. Policy, funding, and behavior are all moving in the same direction.', 'Ce ne sont pas des predictions — ce sont des changements structurels deja en cours. Les politiques, les financements et les comportements vont tous dans la meme direction.')}>{t('Market Tailwinds', 'Vents porteurs du marche')}</SectionTitle>

          {/* Europe */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Europe</span>
              <span className="text-[10px] text-gray-400">{t('Our launch market', 'Notre marche de lancement')}</span>
            </div>
            <div className="space-y-3">
              {EUROPE_TAILWINDS.map((tw, i) => {
                const Icon = tw.icon
                return (
                  <motion.div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl px-5 py-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 leading-relaxed mb-1">{tw.text}</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{tw.context}</p>
                        {tw.source && (
                          <a href={tw.source.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700 mt-1.5 inline-block">
                            {tw.source.label}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Global */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{t('Global', 'Mondial')}</span>
              <span className="text-[10px] text-gray-400">{t('Macro trends across all markets', 'Tendances macro sur tous les marches')}</span>
            </div>
            <div className="space-y-3">
              {GLOBAL_TAILWINDS.map((tw, i) => {
                const Icon = tw.icon
                return (
                  <motion.div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl px-5 py-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + i * 0.05 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 leading-relaxed mb-1">{tw.text}</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{tw.context}</p>
                        {tw.source && (
                          <a href={tw.source.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-500 underline underline-offset-2 decoration-emerald-200 hover:text-emerald-700 mt-1.5 inline-block">
                            {tw.source.label}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.section>

        {/* ── Bloomsline Position ─────────────────────────────── */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle>{t('Where Bloomsline Sits', 'Ou se positionne Bloomsline')}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-900 mb-1">{t('Practice Tools', 'Outils de cabinet')}</p>
                <p className="text-[10px] text-gray-400">SimplePractice, Jane, TherapyNotes</p>
                <p className="text-[10px] text-gray-400 mt-1">{t('Run the business', 'Gerer le cabinet')}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 ring-2 ring-emerald-200">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-emerald-700 mb-1">Bloomsline</p>
                <p className="text-[10px] text-gray-500">{t('Between-session care platform', 'Plateforme de soins entre les seances')}</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">{t('Connects both sides', 'Connecte les deux cotes')}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-900 mb-1">{t('Wellness Apps', 'Applications de bien-etre')}</p>
                <p className="text-[10px] text-gray-400">Headspace, Calm, BetterHelp</p>
                <p className="text-[10px] text-gray-400 mt-1">{t('Help individuals cope', 'Aider les individus a faire face')}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-gray-100">
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <p className="text-[10px] text-gray-400">
                <a href="https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-gray-300 hover:text-gray-600">{t('BetterHelp revenue declining (-8% YoY, 2024)', 'Revenus de BetterHelp en baisse (-8% en glissement annuel, 2024)')}</a>.{' '}
                <a href="https://www.globenewswire.com/news-release/2025/02/20/3029565/0/en/Talkspace-Announces-Fourth-Quarter-and-Full-Year-2024-Results.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-gray-300 hover:text-gray-600">{t('Talkspace pivoting B2C → B2B (payor revenue +54% YoY)', 'Talkspace pivote B2C → B2B (revenus payeurs +54% en glissement annuel)')}</a>.{' '}
                {t('The market is validating the practitioner-first model.', 'Le marche valide le modele praticien d\'abord.')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Key Comps ──────────────────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle={t('Companies in our space that have scaled — and the multiples they achieved.', 'Entreprises de notre espace qui ont scale — et les multiples qu\'elles ont atteints.')}>{t('Valuation Benchmarks', 'References de valorisation')}</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-900 mb-1">EngageSmart (SimplePractice)</p>
              <p className="text-2xl font-bold text-gray-900">$4.0B</p>
              <p className="text-[10px] text-gray-400">{t('Acquired by Vista Equity Partners, 2023', 'Acquis par Vista Equity Partners, 2023')}</p>
              <p className="text-[10px] text-gray-500 mt-1">{t('~$100M ARR at acquisition', '~100M$ d\'ARR a l\'acquisition')}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-2">{t('Our B2B comp — practice tools for therapists', 'Notre comp B2B — outils de cabinet pour therapeutes')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-900 mb-1">Headspace</p>
              <p className="text-2xl font-bold text-gray-900">$3.0B</p>
              <p className="text-[10px] text-gray-400">{t('Last valuation, B2C wellness', 'Derniere valorisation, bien-etre B2C')}</p>
              <p className="text-[10px] text-gray-500 mt-1">{t('~$348M revenue', '~348M$ de revenus')}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-2">{t('Our B2C comp — consumer wellness app', 'Notre comp B2C — application de bien-etre grand public')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-900 mb-1">Talkspace (TALK)</p>
              <p className="text-2xl font-bold text-gray-900">$188M</p>
              <p className="text-[10px] text-gray-400">{t('2024 revenue, first profitable year', 'Revenus 2024, premiere annee rentable')}</p>
              <p className="text-[10px] text-gray-500 mt-1">{t('Pivoting D2C → payor/enterprise', 'Pivot D2C → payeur/entreprise')}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-2">{t('Validates the B2B pivot — practitioner-first wins', 'Valide le pivot B2B — le modele praticien d\'abord gagne')}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            {t(
              'Bloomsline combines elements of both models — B2B practice tools (like SimplePractice) and B2C member engagement (like Headspace) — connected into one platform. No one in the market does both today.',
              'Bloomsline combine des elements des deux modeles — outils de cabinet B2B (comme SimplePractice) et engagement B2C des membres (comme Headspace) — connectes en une seule plateforme. Personne sur le marche ne fait les deux aujourd\'hui.'
            )}
          </p>
        </motion.section>

        {/* ── EUR conversion note ─────────────────────────────── */}
        <motion.div {...fadeUp(0.55)} className="bg-gray-100 rounded-xl p-5 text-xs text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">{t('Currency reference (1 USD ≈ €0.92)', 'Reference de change (1 USD ≈ 0,92€)')}</p>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <p className="text-gray-400">TAM (2025)</p>
              <p className="text-sm font-bold text-gray-800">€30.4B</p>
            </div>
            <div>
              <p className="text-gray-400">SAM (2025)</p>
              <p className="text-sm font-bold text-gray-800">€5.1B</p>
            </div>
            <div>
              <p className="text-gray-400">SOM (2025)</p>
              <p className="text-sm font-bold text-gray-800">€166M</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...fadeUp(0.6)} className="flex items-center gap-2 text-[10px] text-gray-400 pt-4">
          <span>{t('Sources: Grand View Research, Towards Healthcare, Verified Market Reports, Fortune Business Insights, Mordor Intelligence', 'Sources : Grand View Research, Towards Healthcare, Verified Market Reports, Fortune Business Insights, Mordor Intelligence')}</span>
          <span className="text-gray-200">|</span>
          <span>{t('Last updated:', 'Derniere mise a jour :')} {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short', year: 'numeric' })}</span>
        </motion.div>
      </main>
    </div>
  )
}
