'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Route,
  Users,
  User,
  Heart,
  Search,
  CheckCircle2,
  Star,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Mail,
  Globe,
  Smartphone,
  Calendar,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Shield,
  DollarSign,
  BarChart3,
  Handshake,
  Eye,
  Megaphone,
  Gift,
  RefreshCw,
  XCircle,
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

// ── Types ────────────────────────────────────────────────────────────────

interface JourneyStage {
  id: string
  stage: string
  emotion: number // -2 to +2 scale
  emotionLabel: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Search
  description: string
  actions: string[]
  thoughts: string[]
  touchpoints: { channel: string; icon: typeof Globe }[]
  painPoints: string[]
  opportunities: string[]
  metrics: { label: string; target: string }[]
  tools: string[]
}

// ── B2B Journey (Practitioner) ──────────────────────────────────────────

const getB2BStages = (t: (en: string, fr: string) => string): JourneyStage[] => [
  {
    id: 'b2b-awareness',
    stage: t('Awareness', 'Sensibilisation'),
    emotion: 0,
    emotionLabel: t('Curious', 'Curieux'),
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Eye,
    description: t(
      'Practitioner first encounters Bloomsline through peer networks, conferences, or online content. They are overwhelmed by admin work and skeptical about AI but open to solutions that respect clinical practice.',
      'Le praticien découvre Bloomsline via ses réseaux professionnels, des conférences ou du contenu en ligne. Débordé par les tâches administratives et sceptique face à l\'IA, il reste ouvert aux solutions respectueuses de la pratique clinique.'
    ),
    actions: [
      t('Sees Bloomsline post in supervision group or LinkedIn', 'Voit une publication Bloomsline dans un groupe de supervision ou sur LinkedIn'),
      t('Hears colleague mention AI-assisted notes at AFTCC conference', 'Entend un collègue mentionner les notes assistées par IA lors d\'une conférence AFTCC'),
      t('Searches "AI therapy notes GDPR" or "between-session care tool"', 'Recherche « notes thérapie IA RGPD » ou « outil de suivi inter-séances »'),
      t('Reads blog article on practitioner burnout and technology solutions', 'Lit un article de blog sur l\'épuisement professionnel et les solutions technologiques'),
    ],
    thoughts: [
      t('"I spend 40% of my time on paperwork instead of clients"', '« Je passe 40 % de mon temps sur la paperasse au lieu des patients »'),
      t('"Another AI tool — is this actually designed for therapists?"', '« Encore un outil IA — est-il vraiment conçu pour les thérapeutes ? »'),
      t('"My colleagues at the conference seemed impressed, worth a look"', '« Mes collègues à la conférence semblaient impressionnés, ça vaut le coup d\'oeil »'),
      t('"Will this comply with GDPR? I handle sensitive data"', '« Est-ce conforme au RGPD ? Je traite des données sensibles »'),
    ],
    touchpoints: [
      { channel: t('LinkedIn / social media', 'LinkedIn / réseaux sociaux'), icon: Globe },
      { channel: t('Professional conferences (AFTCC, Asadis)', 'Conférences professionnelles (AFTCC, Asadis)'), icon: Megaphone },
      { channel: t('Peer referral / supervision groups', 'Recommandation de pairs / groupes de supervision'), icon: Users },
      { channel: t('Google search / SEO content', 'Recherche Google / contenu SEO'), icon: Search },
    ],
    painPoints: [
      t('Information overload — too many SaaS tools making big promises', 'Surcharge d\'information — trop d\'outils SaaS faisant de grandes promesses'),
      t('No clear differentiation from general practice management tools', 'Pas de différenciation claire par rapport aux outils de gestion de cabinet généraux'),
      t('Distrust of AI in clinical settings (45% of therapists skeptical — APA 2024)', 'Méfiance envers l\'IA en milieu clinique (45 % des thérapeutes sceptiques — APA 2024)'),
      t('Unclear if tool is built for French/EU market specifically', 'Incertitude quant à la conception spécifique pour le marché français/européen'),
    ],
    opportunities: [
      t('Lead with practitioner burnout narrative (not AI features)', 'Mettre en avant le récit de l\'épuisement professionnel (pas les fonctionnalités IA)'),
      t('Showcase "built by therapists, for therapists" positioning', 'Valoriser le positionnement « conçu par des thérapeutes, pour des thérapeutes »'),
      t('Provide free downloadable guides on session documentation best practices', 'Proposer des guides téléchargeables gratuits sur les bonnes pratiques de documentation'),
      t('Leverage AFTCC and training institute partnerships for credibility', 'Capitaliser sur les partenariats avec l\'AFTCC et les instituts de formation'),
    ],
    metrics: [
      { label: t('Website visitors/month', 'Visiteurs du site/mois'), target: '2 000+' },
      { label: t('Content engagement rate', 'Taux d\'engagement contenu'), target: '>3 %' },
      { label: t('Brand recall in target segment', 'Notoriété de marque dans le segment cible'), target: '>15 %' },
    ],
    tools: ['PostHog (analytics)', 'LinkedIn Ads', 'Mailchimp (newsletter)', 'Blog/SEO'],
  },
  {
    id: 'b2b-consideration',
    stage: t('Consideration', 'Considération'),
    emotion: 1,
    emotionLabel: t('Interested', 'Intéressé'),
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Search,
    description: t(
      'Practitioner evaluates Bloomsline against alternatives. They compare features, pricing, and GDPR compliance. They want proof that this works for practitioners like them — not just a generic demo.',
      'Le praticien évalue Bloomsline face aux alternatives. Il compare les fonctionnalités, les tarifs et la conformité RGPD. Il veut la preuve que l\'outil fonctionne pour des praticiens comme lui — pas seulement une démo générique.'
    ),
    actions: [
      t('Visits bloomslinecare.com and explores features page', 'Visite bloomslinecare.com et explore la page des fonctionnalités'),
      t('Watches product demo video or attends live webinar', 'Regarde une démo produit ou assiste à un webinaire en direct'),
      t('Compares Bloomsline to SimplePractice, Doctolib Pro, Quenza', 'Compare Bloomsline à SimplePractice, Doctolib Pro, Quenza'),
      t('Checks privacy policy and data residency information', 'Vérifie la politique de confidentialité et la localisation des données'),
      t('Asks colleagues who are already using it for honest feedback', 'Demande un retour honnête à des collègues qui l\'utilisent déjà'),
    ],
    thoughts: [
      t('"The AI notes look impressive but can I trust it with clinical data?"', '« Les notes IA sont impressionnantes mais puis-je leur confier des données cliniques ? »'),
      t('"€19-49/month — that is less than one cancelled session costs me"', '« 19-49 €/mois — c\'est moins que le coût d\'une séance annulée »'),
      t('"Will my clients actually use a between-session app?"', '« Mes patients utiliseront-ils vraiment une application inter-séances ? »'),
      t('"I need something that works with my existing workflow, not replaces it"', '« J\'ai besoin d\'un outil qui s\'intègre à mon flux de travail, pas qui le remplace »'),
    ],
    touchpoints: [
      { channel: t('Product website / feature pages', 'Site web produit / pages fonctionnalités'), icon: Globe },
      { channel: t('Live demo / webinar', 'Démo en direct / webinaire'), icon: Smartphone },
      { channel: t('Comparison reviews / case studies', 'Comparatifs / études de cas'), icon: BarChart3 },
      { channel: t('Direct email from sales', 'E-mail direct de l\'équipe commerciale'), icon: Mail },
    ],
    painPoints: [
      t('No peer-reviewed clinical validation available yet', 'Pas encore de validation clinique évaluée par des pairs'),
      t('Unclear how AI notes integrate with existing documentation workflow', 'Intégration floue des notes IA au flux de documentation existant'),
      t('Concern about learning curve and time investment to set up', 'Préoccupation quant à la courbe d\'apprentissage et au temps de mise en place'),
      t('No free tier to test before committing credit card', 'Pas d\'offre gratuite pour tester avant de fournir sa carte bancaire'),
    ],
    opportunities: [
      t('Offer live 1:1 demo with a clinical specialist, not a sales rep', 'Proposer une démo individuelle avec un spécialiste clinique, pas un commercial'),
      t('Create comparison landing pages vs. SimplePractice, Quenza, Doctolib', 'Créer des pages comparatives vs. SimplePractice, Quenza, Doctolib'),
      t('Publish early beta tester feedback with specific outcomes (target: "saves me X hrs/week")', 'Publier les retours des premiers bêta-testeurs avec des résultats concrets (cible : « me fait gagner X h/semaine »)'),
      t('Provide 14-day free trial with full features, no credit card required', 'Proposer un essai gratuit de 14 jours avec toutes les fonctionnalités, sans carte bancaire'),
    ],
    metrics: [
      { label: t('Demo booking rate', 'Taux de réservation de démo'), target: '>25 %' },
      { label: t('Website → trial conversion', 'Conversion site → essai'), target: '>8 %' },
      { label: t('Time on features page', 'Temps sur la page fonctionnalités'), target: '>3 min' },
    ],
    tools: ['Calendly (demo booking)', 'Crisp (live chat)', 'PostHog (funnel)', 'Case study PDFs'],
  },
  {
    id: 'b2b-decision',
    stage: t('Decision', 'Décision'),
    emotion: 0,
    emotionLabel: t('Cautious', 'Prudent'),
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: CheckCircle2,
    description: t(
      'Practitioner decides whether to commit. This is the highest-friction moment — they need final reassurance on data security, clinical appropriateness, and ROI before entering payment details.',
      'Le praticien décide de s\'engager ou non. C\'est le moment de plus grande friction — il a besoin d\'une dernière assurance sur la sécurité des données, la pertinence clinique et le retour sur investissement avant de saisir ses coordonnées de paiement.'
    ),
    actions: [
      t('Starts 14-day free trial and generates first AI session note', 'Démarre l\'essai gratuit de 14 jours et génère sa première note de séance IA'),
      t('Tests the member app with one client as a pilot', 'Teste l\'application membre avec un patient pilote'),
      t('Reads terms of service and data processing agreement', 'Lit les conditions d\'utilisation et le contrat de traitement des données'),
      t('Discusses with practice partner or supervisor', 'En discute avec un associé ou un superviseur'),
      t('Evaluates ROI: time saved vs. monthly cost', 'Évalue le ROI : temps gagné vs. coût mensuel'),
    ],
    thoughts: [
      t('"The AI note was actually good — better than what I write at 9 PM"', '« La note IA était vraiment bien — meilleure que ce que j\'écris à 21 h »'),
      t('"My client responded to the between-session check-in, that is new"', '« Mon patient a répondu au suivi inter-séances, c\'est nouveau »'),
      t('"€19-49/month = less than 1 hour of my time. If it saves 4+ hours, it is worth it"', '« 19-49 €/mois = moins d\'une heure de mon temps. Si ça m\'en fait gagner 4+, c\'est rentable »'),
      t('"What happens to data if I stop paying? Can I export everything?"', '« Qu\'advient-il de mes données si j\'arrête de payer ? Puis-je tout exporter ? »'),
    ],
    touchpoints: [
      { channel: t('In-product trial experience', 'Expérience d\'essai dans le produit'), icon: Smartphone },
      { channel: t('Onboarding email sequence', 'Séquence d\'e-mails d\'intégration'), icon: Mail },
      { channel: t('Checkout / pricing page', 'Page de paiement / tarifs'), icon: DollarSign },
      { channel: t('Support chat during trial', 'Chat support pendant l\'essai'), icon: MessageSquare },
    ],
    painPoints: [
      t('Payment friction — especially for solo practitioners used to free tools', 'Friction au paiement — surtout pour les praticiens indépendants habitués aux outils gratuits'),
      t('Anxiety about committing to a platform for sensitive clinical data', 'Anxiété à l\'idée de confier des données cliniques sensibles à une plateforme'),
      t('Trial period may not be long enough to see member engagement results', 'La période d\'essai peut être trop courte pour voir les résultats d\'engagement des membres'),
      t('No clear exit path or data portability guarantee visible during signup', 'Pas de chemin de sortie clair ni de garantie de portabilité des données visible à l\'inscription'),
    ],
    opportunities: [
      t('Offer "first month 50% off" or extended 30-day trial for conference leads', 'Proposer « premier mois à -50 % » ou un essai prolongé de 30 jours pour les contacts conférence'),
      t('Show clear data export and account deletion options during trial', 'Afficher clairement les options d\'export et de suppression de compte pendant l\'essai'),
      t('Send personalized email: "Your first AI note took X minutes instead of Y" (measure in beta)', 'Envoyer un e-mail personnalisé : « Votre première note IA a pris X minutes au lieu de Y » (mesurer en bêta)'),
      t('Provide ROI calculator: hours saved × hourly rate vs. subscription cost', 'Fournir un calculateur de ROI : heures gagnées × tarif horaire vs. coût d\'abonnement'),
    ],
    metrics: [
      { label: t('Trial → paid conversion (target)', 'Conversion essai → payant (cible)'), target: '>40 %' },
      { label: t('Days to conversion (target)', 'Jours avant conversion (cible)'), target: t('<10 days', '<10 jours') },
      { label: t('Average revenue per signup (projected)', 'Revenu moyen par inscription (projeté)'), target: '19-49 €' },
    ],
    tools: ['Stripe (payments)', 'Customer.io (email automation)', 'In-app analytics', t('ROI calculator widget', 'Widget calculateur de ROI')],
  },
  {
    id: 'b2b-onboarding',
    stage: t('Onboarding', 'Intégration'),
    emotion: -1,
    emotionLabel: t('Overwhelmed', 'Débordé'),
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Zap,
    description: t(
      'The critical first 7 days. Practitioner must experience the "aha moment" — generating their first AI note in under 5 minutes and inviting their first member. If onboarding takes too long or feels complex, churn risk spikes.',
      'Les 7 premiers jours critiques. Le praticien doit vivre le « moment déclic » — générer sa première note IA en moins de 5 minutes et inviter son premier membre. Si l\'intégration est trop longue ou complexe, le risque de désabonnement augmente.'
    ),
    actions: [
      t('Completes profile setup and practice preferences', 'Complète la configuration du profil et les préférences de pratique'),
      t('Generates first AI session note (target: within 5 minutes)', 'Génère sa première note de séance IA (objectif : en moins de 5 minutes)'),
      t('Customizes note templates and clinical terminology', 'Personnalise les modèles de notes et la terminologie clinique'),
      t('Invites first 1-3 members to the platform', 'Invite ses 1 à 3 premiers membres sur la plateforme'),
      t('Reviews first between-session engagement summary', 'Consulte le premier résumé d\'engagement inter-séances'),
    ],
    thoughts: [
      t('"Where do I start? There are a lot of features here"', '« Par où commencer ? Il y a beaucoup de fonctionnalités ici »'),
      t('"OK the AI note was fast — but I need to review and edit it"', '« OK, la note IA était rapide — mais je dois la relire et la modifier »'),
      t('"How do I explain this to my clients? Do they need to download an app?"', '« Comment expliquer ça à mes patients ? Doivent-ils télécharger une application ? »'),
      t('"I am worried about getting the clinical language right"', '« Je crains que le vocabulaire clinique ne soit pas juste »'),
    ],
    touchpoints: [
      { channel: t('In-app guided setup wizard', 'Assistant de configuration guidée dans l\'application'), icon: Smartphone },
      { channel: t('Welcome email sequence (Days 1, 3, 7)', 'Séquence d\'e-mails de bienvenue (jours 1, 3, 7)'), icon: Mail },
      { channel: t('Video tutorials / help center', 'Tutoriels vidéo / centre d\'aide'), icon: Globe },
      { channel: t('Optional 1:1 onboarding call', 'Appel d\'intégration individuel optionnel'), icon: Calendar },
    ],
    painPoints: [
      t('Setup feels like "another thing to learn" on top of clinical load', 'La configuration semble être « une chose de plus à apprendre » en plus de la charge clinique'),
      t('Member invitation flow requires explaining a new tool to clients', 'Le processus d\'invitation des membres nécessite d\'expliquer un nouvel outil aux patients'),
      t('AI note quality varies — needs calibration to practitioner style', 'La qualité des notes IA varie — nécessite un calibrage au style du praticien'),
      t('No immediate feedback on whether members are actually engaging', 'Pas de retour immédiat sur l\'engagement réel des membres'),
    ],
    opportunities: [
      t('Guided "first session" wizard: upload or dictate → AI note in 90 seconds', 'Assistant « première séance » guidé : téléverser ou dicter → note IA en 90 secondes'),
      t('Pre-written member invitation templates (email, SMS, in-session script)', 'Modèles d\'invitation prêts à l\'emploi (e-mail, SMS, script en séance)'),
      t('Day 3 check-in email: "Here is what your first note looked like — try this next"', 'E-mail de suivi au jour 3 : « Voici à quoi ressemblait votre première note — essayez ceci ensuite »'),
      t('White-glove onboarding for first 100 practitioners (builds loyalty + feedback)', 'Intégration personnalisée pour les 100 premiers praticiens (fidélisation + retours)'),
    ],
    metrics: [
      { label: t('Time to first AI note', 'Temps jusqu\'à la première note IA'), target: '<5 min' },
      { label: t('Members invited in Week 1', 'Membres invités en semaine 1'), target: '≥1' },
      { label: t('Onboarding completion rate', 'Taux de complétion de l\'intégration'), target: '>75 %' },
    ],
    tools: ['Product tours (Shepherd.js)', 'Intercom (in-app messaging)', 'Loom (video walkthroughs)', 'Calendly (1:1 calls)'],
  },
  {
    id: 'b2b-engagement',
    stage: t('Engagement', 'Engagement'),
    emotion: 2,
    emotionLabel: t('Delighted', 'Ravi'),
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Heart,
    description: t(
      'Practitioner has integrated Bloomsline into their daily workflow. They generate AI notes after every session, track member engagement between appointments, and see measurable time savings. This is the value realization phase.',
      'Le praticien a intégré Bloomsline dans son flux de travail quotidien. Il génère des notes IA après chaque séance, suit l\'engagement des membres entre les rendez-vous et constate un gain de temps mesurable. C\'est la phase de réalisation de la valeur.'
    ),
    actions: [
      t('Generates AI notes for all sessions (2-4x/day)', 'Génère des notes IA pour toutes les séances (2 à 4 fois/jour)'),
      t('Reviews weekly member engagement dashboard', 'Consulte le tableau de bord hebdomadaire d\'engagement des membres'),
      t('Uses between-session care plans with 5-10 active members', 'Utilise les plans de suivi inter-séances avec 5 à 10 membres actifs'),
      t('Tracks client progress milestones and outcomes data', 'Suit les jalons de progression des patients et les données de résultats'),
      t('Shares feedback and feature requests with the team', 'Partage ses retours et demandes de fonctionnalités avec l\'équipe'),
    ],
    thoughts: [
      t('"I am saving significant time on documentation" (projected: 4-6 hrs/week based on AI scribe benchmarks)', '« Je gagne un temps considérable sur la documentation » (projeté : 4-6 h/semaine selon les benchmarks des scribes IA)'),
      t('"My clients are more engaged between sessions — I can see the data"', '« Mes patients sont plus engagés entre les séances — je peux le voir dans les données »'),
      t('"The AI catches patterns I might miss across my caseload"', '« L\'IA repère des schémas que je pourrais manquer dans ma patientèle »'),
      t('"This is becoming essential to how I practice"', '« C\'est en train de devenir essentiel dans ma pratique »'),
    ],
    touchpoints: [
      { channel: t('Daily dashboard usage', 'Utilisation quotidienne du tableau de bord'), icon: Smartphone },
      { channel: t('Weekly engagement reports (email)', 'Rapports d\'engagement hebdomadaires (e-mail)'), icon: Mail },
      { channel: t('In-app feature updates', 'Mises à jour de fonctionnalités dans l\'application'), icon: Sparkles },
      { channel: t('Community forum / peer group', 'Forum communautaire / groupe de pairs'), icon: Users },
    ],
    painPoints: [
      t('Feature requests pile up — practitioners want customization', 'Les demandes de fonctionnalités s\'accumulent — les praticiens veulent de la personnalisation'),
      t('AI note quality inconsistency for edge-case modalities (EMDR, art therapy)', 'Qualité inconstante des notes IA pour les modalités atypiques (EMDR, art-thérapie)'),
      t('Dashboard can feel data-heavy for practitioners who prefer simplicity', 'Le tableau de bord peut sembler surchargé pour les praticiens qui préfèrent la simplicité'),
      t('Member engagement varies — some clients engage daily, others not at all', 'L\'engagement des membres varie — certains patients s\'investissent quotidiennement, d\'autres pas du tout'),
    ],
    opportunities: [
      t('Launch "Practitioner Spotlight" program — feature power users in content', 'Lancer le programme « Praticien en vedette » — mettre en avant les utilisateurs clés'),
      t('Build modality-specific AI templates (CBT, psychodynamic, systemic)', 'Créer des modèles IA par modalité (TCC, psychodynamique, systémique)'),
      t('Send monthly "practice insights" email with aggregated anonymized trends', 'Envoyer un e-mail mensuel « aperçu de la pratique » avec des tendances anonymisées'),
      t('Introduce outcome measurement tools that practitioners can share with referrers', 'Introduire des outils de mesure des résultats partageables avec les prescripteurs'),
    ],
    metrics: [
      { label: t('Daily active practitioners (target)', 'Praticiens actifs quotidiens (cible)'), target: t('>60% of base', '>60 % de la base') },
      { label: t('AI notes per practitioner/week (target)', 'Notes IA par praticien/semaine (cible)'), target: '8-15' },
      { label: t('NPS score (target)', 'Score NPS (cible)'), target: '>50' },
    ],
    tools: ['PostHog (product analytics)', 'Customer.io (lifecycle emails)', 'Canny (feature requests)', 'Discord (community)'],
  },
  {
    id: 'b2b-loyalty',
    stage: t('Loyalty', 'Fidélité'),
    emotion: 2,
    emotionLabel: t('Committed', 'Engagé'),
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: Star,
    description: t(
      'Practitioner becomes an advocate. They recommend Bloomsline to peers, participate in beta testing, and upgrade to annual billing. Their data is deeply embedded in the platform — switching cost is now high.',
      'Le praticien devient ambassadeur. Il recommande Bloomsline à ses pairs, participe aux tests bêta et passe à la facturation annuelle. Ses données sont profondément ancrées dans la plateforme — le coût de changement est désormais élevé.'
    ),
    actions: [
      t('Switches to annual billing (20% discount)', 'Passe à la facturation annuelle (remise de 20 %)'),
      t('Refers 2-3 colleagues to Bloomsline', 'Recommande Bloomsline à 2-3 collègues'),
      t('Joins Clinical Advisory Board or beta program', 'Rejoint le Comité consultatif clinique ou le programme bêta'),
      t('Presents Bloomsline at supervision group or local conference', 'Présente Bloomsline lors d\'un groupe de supervision ou d\'une conférence locale'),
      t('Has 15-30 active members on the platform', 'Compte 15 à 30 membres actifs sur la plateforme'),
    ],
    thoughts: [
      t('"I cannot imagine going back to handwritten notes"', '« Je ne peux plus imaginer revenir aux notes manuscrites »'),
      t('"I told my supervision group — three of them signed up"', '« J\'en ai parlé à mon groupe de supervision — trois se sont inscrits »'),
      t('"The team actually listens to my feedback and ships it"', '« L\'équipe écoute vraiment mes retours et les intègre »'),
      t('"This has genuinely improved my practice and reduced burnout"', '« Cela a véritablement amélioré ma pratique et réduit l\'épuisement »'),
    ],
    touchpoints: [
      { channel: t('Referral program / ambassador community', 'Programme de parrainage / communauté d\'ambassadeurs'), icon: Gift },
      { channel: t('Annual billing renewal', 'Renouvellement de facturation annuelle'), icon: DollarSign },
      { channel: t('Beta feature access', 'Accès aux fonctionnalités bêta'), icon: Sparkles },
      { channel: t('Advisory board meetings', 'Réunions du comité consultatif'), icon: Handshake },
    ],
    painPoints: [
      t('Long-term practitioners want enterprise features (multi-clinician, shared templates)', 'Les praticiens de longue date veulent des fonctionnalités entreprise (multi-praticien, modèles partagés)'),
      t('Concern about platform stability and long-term viability of a startup', 'Préoccupation quant à la stabilité de la plateforme et la viabilité à long terme d\'une startup'),
      t('Annual billing feels risky if the product might change direction', 'La facturation annuelle semble risquée si le produit change de direction'),
      t('Referral program lacks tangible incentives beyond goodwill', 'Le programme de parrainage manque d\'incitations tangibles au-delà de la bonne volonté'),
    ],
    opportunities: [
      t('Launch referral rewards: 1 month free per successful referral', 'Lancer des récompenses de parrainage : 1 mois gratuit par parrainage réussi'),
      t('Create "Bloomsline Champions" badge with exclusive community access', 'Créer un badge « Champions Bloomsline » avec accès exclusif à la communauté'),
      t('Offer group practice pricing for practitioners who bring their clinic', 'Proposer un tarif groupe pour les praticiens qui amènent leur cabinet'),
      t('Co-author case studies and blog posts with loyal practitioners', 'Co-rédiger des études de cas et articles avec les praticiens fidèles'),
    ],
    metrics: [
      { label: t('Annual billing adoption', 'Adoption de la facturation annuelle'), target: '>30 %' },
      { label: t('Referral rate', 'Taux de parrainage'), target: '>15 %' },
      { label: t('Monthly churn (loyal segment)', 'Désabonnement mensuel (segment fidèle)'), target: '<2 %' },
    ],
    tools: ['Referral program (Rewardful)', 'Slack (champions community)', 'Calendly (advisory calls)', 'Stripe (annual billing)'],
  },
  {
    id: 'b2b-churn',
    stage: t('Churn Risk', 'Risque de désabonnement'),
    emotion: -2,
    emotionLabel: t('Frustrated', 'Frustré'),
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: t(
      'Practitioner disengages. Usage drops, AI notes become infrequent, members are no longer being invited. Without intervention, they cancel within 30-60 days. Early detection and re-engagement are critical.',
      'Le praticien se désengage. L\'utilisation chute, les notes IA deviennent rares, les membres ne sont plus invités. Sans intervention, il résilie dans les 30 à 60 jours. La détection précoce et la réactivation sont essentielles.'
    ),
    actions: [
      t('Stops generating AI notes (usage drops >50% in 2 weeks)', 'Arrête de générer des notes IA (utilisation en baisse de >50 % en 2 semaines)'),
      t('Ignores weekly engagement emails and in-app notifications', 'Ignore les e-mails d\'engagement hebdomadaires et les notifications in-app'),
      t('Stops inviting new members to the platform', 'Cesse d\'inviter de nouveaux membres sur la plateforme'),
      t('Contacts support about cancellation or data export', 'Contacte le support pour une résiliation ou un export de données'),
      t('Lets subscription lapse without formal cancellation', 'Laisse l\'abonnement expirer sans résiliation formelle'),
    ],
    thoughts: [
      t('"I am not using this enough to justify the cost"', '« Je ne l\'utilise pas assez pour justifier le coût »'),
      t('"My clients did not engage with the between-session features"', '« Mes patients ne se sont pas investis dans les fonctionnalités inter-séances »'),
      t('"The AI notes are good but I already have a workflow that works"', '« Les notes IA sont bonnes mais j\'ai déjà un flux de travail qui fonctionne »'),
      t('"I am going back to my old system — it is less sophisticated but familiar"', '« Je reviens à mon ancien système — moins sophistiqué mais familier »'),
    ],
    touchpoints: [
      { channel: t('Churn prediction alerts (internal)', 'Alertes de prédiction de désabonnement (internes)'), icon: AlertTriangle },
      { channel: t('Re-engagement email sequence', 'Séquence d\'e-mails de réactivation'), icon: Mail },
      { channel: t('Personal outreach from founder/CSM', 'Contact personnel du fondateur/CSM'), icon: MessageSquare },
      { channel: t('Cancellation flow with save offers', 'Flux de résiliation avec offres de rétention'), icon: RefreshCw },
    ],
    painPoints: [
      t('Feels like the platform is not tailored to their specific practice style', 'L\'impression que la plateforme n\'est pas adaptée à leur style de pratique spécifique'),
      t('Members did not adopt between-session care — practitioners feel it failed', 'Les membres n\'ont pas adopté le suivi inter-séances — les praticiens ont le sentiment d\'un échec'),
      t('Feature complexity increased but core value proposition did not deepen', 'La complexité des fonctionnalités a augmenté sans approfondir la proposition de valeur'),
      t('No clear improvement in client outcomes visible from the dashboard', 'Pas d\'amélioration visible des résultats patients depuis le tableau de bord'),
    ],
    opportunities: [
      t('Build churn prediction model: trigger at 50% usage drop over 14 days', 'Construire un modèle de prédiction de désabonnement : déclenchement à -50 % d\'utilisation sur 14 jours'),
      t('Offer 1:1 "practice optimization" call — reactivate value, not sales pitch', 'Proposer un appel « optimisation de la pratique » — réactiver la valeur, pas un argumentaire commercial'),
      t('Create "pause" option (3 months) instead of hard cancellation', 'Créer une option « pause » (3 mois) au lieu d\'une résiliation définitive'),
      t('Exit survey: "What would bring you back?" — feed into product roadmap', 'Enquête de départ : « Qu\'est-ce qui vous ferait revenir ? » — alimenter la feuille de route produit'),
    ],
    metrics: [
      { label: t('Monthly churn rate', 'Taux de désabonnement mensuel'), target: '<5 %' },
      { label: t('Churn save rate', 'Taux de rétention (désabonnement évité)'), target: '>25 %' },
      { label: t('Win-back rate (90 days)', 'Taux de reconquête (90 jours)'), target: '>10 %' },
    ],
    tools: ['Churn prediction (custom ML)', 'Customer.io (win-back flows)', 'Typeform (exit survey)', 'Stripe (pause billing)'],
  },
]

// ── B2C Journey (Member/Client) ─────────────────────────────────────────

const getB2CStages = (t: (en: string, fr: string) => string): JourneyStage[] => [
  {
    id: 'b2c-awareness',
    stage: t('Awareness', 'Sensibilisation'),
    emotion: -1,
    emotionLabel: t('Uncertain', 'Incertain'),
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Eye,
    description: t(
      'Member first learns about Bloomsline through their practitioner — not through marketing. This is a trust-transfer moment: the practitioner\'s recommendation carries enormous weight for someone already in a vulnerable therapeutic relationship.',
      'Le membre découvre Bloomsline par l\'intermédiaire de son praticien — pas via le marketing. C\'est un moment de transfert de confiance : la recommandation du praticien a un poids considérable pour une personne déjà dans une relation thérapeutique sensible.'
    ),
    actions: [
      t('Practitioner mentions Bloomsline during session', 'Le praticien mentionne Bloomsline pendant la séance'),
      t('Receives invitation email or SMS from practitioner', 'Reçoit une invitation par e-mail ou SMS du praticien'),
      t('Hears "there is an app to help you between our sessions"', 'Entend « il existe une application pour vous accompagner entre nos séances »'),
      t('Googles "Bloomsline Care" to check legitimacy and privacy', 'Recherche « Bloomsline Care » sur Google pour vérifier la légitimité et la confidentialité'),
    ],
    thoughts: [
      t('"My therapist recommended this — it must be trustworthy"', '« Mon thérapeute me l\'a recommandé — ça doit être fiable »'),
      t('"Will this replace our in-person sessions?"', '« Est-ce que ça va remplacer nos séances en personne ? »'),
      t('"I already use mindfulness apps — is this different?"', '« J\'utilise déjà des applications de pleine conscience — est-ce différent ? »'),
      t('"Who can see my data? Is this really private?"', '« Qui peut voir mes données ? Est-ce vraiment confidentiel ? »'),
    ],
    touchpoints: [
      { channel: t('In-session practitioner recommendation', 'Recommandation du praticien en séance'), icon: MessageSquare },
      { channel: t('Practitioner-sent invitation (email/SMS)', 'Invitation envoyée par le praticien (e-mail/SMS)'), icon: Mail },
      { channel: t('Bloomsline member landing page', 'Page d\'accueil membre Bloomsline'), icon: Globe },
      { channel: t('App Store listing', 'Fiche App Store'), icon: Smartphone },
    ],
    painPoints: [
      t('Skepticism about yet another health app collecting personal data', 'Scepticisme face à une énième application de santé collectant des données personnelles'),
      t('Anxiety about digital tools in a deeply personal therapeutic context', 'Anxiété face aux outils numériques dans un contexte thérapeutique très personnel'),
      t('Unclear on the value — "what will I actually do with this?"', 'Valeur ajoutée floue — « qu\'est-ce que je vais faire concrètement avec ? »'),
      t('Fear that app engagement will be "homework" monitored by therapist', 'Crainte que l\'utilisation de l\'application soit un « devoir » surveillé par le thérapeute'),
    ],
    opportunities: [
      t('Practitioner-framed introduction: "This extends our work together"', 'Introduction formulée par le praticien : « Cela prolonge notre travail ensemble »'),
      t('Member landing page with clear privacy-first messaging and GDPR badges', 'Page d\'accueil membre avec un message clair sur la confidentialité et les badges RGPD'),
      t('Show value immediately: "Track your mood, journal safely, stay connected"', 'Montrer la valeur immédiatement : « Suivez votre humeur, journalisez en sécurité, restez connecté »'),
      t('Emphasize practitioner control: "Your therapist chose this for you"', 'Mettre l\'accent sur le contrôle du praticien : « Votre thérapeute a choisi ceci pour vous »'),
    ],
    metrics: [
      { label: t('Invitation → app download', 'Invitation → téléchargement de l\'application'), target: '>60 %' },
      { label: t('Time from invitation to download', 'Délai entre l\'invitation et le téléchargement'), target: '<48 h' },
      { label: t('Landing page bounce rate', 'Taux de rebond de la page d\'accueil'), target: '<40 %' },
    ],
    tools: ['Deep links (Branch.io)', 'App Store optimization', t('Member landing page', 'Page d\'accueil membre'), t('Practitioner invitation templates', 'Modèles d\'invitation praticien')],
  },
  {
    id: 'b2c-consideration',
    stage: t('Consideration', 'Considération'),
    emotion: 0,
    emotionLabel: t('Open-minded', 'Ouvert d\'esprit'),
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Search,
    description: t(
      'Member evaluates whether to engage. Unlike B2B, the practitioner has already validated the tool — so the barrier is personal comfort with digital mental health tools, not feature comparison.',
      'Le membre évalue s\'il va s\'engager. Contrairement au B2B, le praticien a déjà validé l\'outil — la barrière est donc le confort personnel avec les outils numériques de santé mentale, pas la comparaison de fonctionnalités.'
    ),
    actions: [
      t('Downloads the Bloomsline member app', 'Télécharge l\'application membre Bloomsline'),
      t('Reads privacy policy and data sharing explanation', 'Lit la politique de confidentialité et l\'explication du partage de données'),
      t('Explores the app interface (mood tracker, journal, resources)', 'Explore l\'interface de l\'application (suivi d\'humeur, journal, ressources)'),
      t('Checks App Store reviews and ratings', 'Consulte les avis et notes sur l\'App Store'),
    ],
    thoughts: [
      t('"The interface feels calm and welcoming — not clinical"', '« L\'interface est apaisante et accueillante — pas clinique »'),
      t('"OK, only my therapist can see my entries — that feels safe"', '« OK, seul mon thérapeute peut voir mes entrées — ça me rassure »'),
      t('"A mood tracker and journal — I have tried these before and stopped"', '« Un suivi d\'humeur et un journal — j\'ai déjà essayé et abandonné »'),
      t('"The personalized content from my therapist makes this feel different"', '« Le contenu personnalisé de mon thérapeute rend l\'expérience différente »'),
    ],
    touchpoints: [
      { channel: t('App first-open experience', 'Première ouverture de l\'application'), icon: Smartphone },
      { channel: t('In-app privacy explainer', 'Explication de la confidentialité dans l\'application'), icon: Shield },
      { channel: t('Personalized content from practitioner', 'Contenu personnalisé du praticien'), icon: Heart },
      { channel: t('Push notification (gentle)', 'Notification push (douce)'), icon: MessageSquare },
    ],
    painPoints: [
      t('App fatigue — users have downloaded and abandoned similar apps before', 'Fatigue applicative — les utilisateurs ont déjà téléchargé et abandonné des applications similaires'),
      t('Privacy anxiety about journaling on a platform linked to their therapist', 'Anxiété sur la confidentialité du journal sur une plateforme liée à leur thérapeute'),
      t('Unclear how this is different from free apps (Headspace, Calm, Daylio)', 'Différence floue avec les applications gratuites (Headspace, Calm, Daylio)'),
      t('No immediate emotional reward from signing up', 'Aucune récompense émotionnelle immédiate à l\'inscription'),
    ],
    opportunities: [
      t('First-open experience: 60-second video from practitioner (personalized or template)', 'Première ouverture : vidéo de 60 secondes du praticien (personnalisée ou modèle)'),
      t('Show "your therapist has prepared content for you" — creates immediate value', 'Afficher « votre thérapeute a préparé du contenu pour vous » — crée de la valeur immédiate'),
      t('Minimal permissions asked at signup — build trust before requesting data', 'Permissions minimales à l\'inscription — construire la confiance avant de demander des données'),
      t('Clear visual comparison: "This is connected to your therapy, not standalone"', 'Comparaison visuelle claire : « Ceci est connecté à votre thérapie, pas autonome »'),
    ],
    metrics: [
      { label: t('App download → account creation', 'Téléchargement → création de compte'), target: '>80 %' },
      { label: t('First session completion (in-app)', 'Complétion de la première session (in-app)'), target: '>65 %' },
      { label: t('Privacy policy engagement', 'Engagement politique de confidentialité'), target: '>30 % scroll' },
    ],
    tools: ['App onboarding (custom)', t('Practitioner-personalized content', 'Contenu personnalisé par le praticien'), 'In-app privacy flow', 'Analytics (Mixpanel)'],
  },
  {
    id: 'b2c-decision',
    stage: t('Decision', 'Décision'),
    emotion: 1,
    emotionLabel: t('Willing', 'Disposé'),
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: CheckCircle2,
    description: t(
      'Member decides to actively engage — completing their first mood check-in, journal entry, or between-session activity. This is low friction (no payment required) but high emotional commitment for someone sharing mental health data.',
      'Le membre décide de s\'engager activement — en complétant son premier suivi d\'humeur, une entrée de journal ou une activité inter-séances. La friction est faible (pas de paiement requis) mais l\'engagement émotionnel est fort pour quelqu\'un partageant des données de santé mentale.'
    ),
    actions: [
      t('Completes first mood check-in', 'Complète son premier suivi d\'humeur'),
      t('Writes first journal entry or reflection', 'Rédige sa première entrée de journal ou réflexion'),
      t('Engages with practitioner-assigned activity or resource', 'S\'engage dans une activité ou ressource assignée par le praticien'),
      t('Responds to an AI-generated check-in prompt', 'Répond à une invitation de suivi générée par l\'IA'),
    ],
    thoughts: [
      t('"That mood check-in was actually quick and easy"', '« Ce suivi d\'humeur était vraiment rapide et facile »'),
      t('"Writing this out between sessions feels productive"', '« Écrire entre les séances me donne un sentiment de progression »'),
      t('"My therapist sent me a resource — they are thinking of me between sessions"', '« Mon thérapeute m\'a envoyé une ressource — il pense à moi entre les séances »'),
      t('"I feel more connected to my therapy process"', '« Je me sens plus connecté à mon processus thérapeutique »'),
    ],
    touchpoints: [
      { channel: t('First mood check-in flow', 'Premier flux de suivi d\'humeur'), icon: Heart },
      { channel: t('First journal entry prompt', 'Première invitation d\'entrée de journal'), icon: MessageSquare },
      { channel: t('Practitioner-shared resource or activity', 'Ressource ou activité partagée par le praticien'), icon: Sparkles },
      { channel: t('AI check-in notification', 'Notification de suivi IA'), icon: Brain },
    ],
    painPoints: [
      t('Journal prompts feel generic rather than specific to their therapeutic goals', 'Les invitations de journal semblent génériques plutôt que spécifiques à leurs objectifs thérapeutiques'),
      t('Uncertainty about what to write or share — fear of judgment', 'Incertitude sur quoi écrire ou partager — peur du jugement'),
      t('Notification timing is off — arrives during work or late at night', 'Mauvais timing des notifications — arrivent pendant le travail ou tard le soir'),
      t('No immediate feedback or acknowledgment after first entry', 'Aucun retour ou accusé de réception immédiat après la première entrée'),
    ],
    opportunities: [
      t('Celebrate first entry: warm congratulations + visual streak indicator', 'Célébrer la première entrée : félicitations chaleureuses + indicateur visuel de série'),
      t('Personalized journal prompts linked to last session themes', 'Invitations de journal personnalisées liées aux thèmes de la dernière séance'),
      t('Let members choose notification timing and frequency', 'Laisser les membres choisir l\'horaire et la fréquence des notifications'),
      t('Bloom AI sends supportive acknowledgment: "Thank you for sharing — your therapist will see this"', 'Bloom AI envoie un accusé de réception bienveillant : « Merci d\'avoir partagé — votre thérapeute le verra »'),
    ],
    metrics: [
      { label: t('First activity completion (48h)', 'Complétion de la première activité (48 h)'), target: '>50 %' },
      { label: t('Second activity completion (7d)', 'Complétion de la deuxième activité (7 j)'), target: '>35 %' },
      { label: t('Notification opt-in rate', 'Taux d\'acceptation des notifications'), target: '>70 %' },
    ],
    tools: ['Push notifications (OneSignal)', t('In-app celebrations', 'Célébrations in-app'), t('Practitioner content assignment', 'Attribution de contenu praticien'), 'Bloom AI prompts'],
  },
  {
    id: 'b2c-onboarding',
    stage: t('Onboarding', 'Intégration'),
    emotion: 0,
    emotionLabel: t('Adjusting', 'En adaptation'),
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Zap,
    description: t(
      'Member builds a habit over the first 2-4 weeks. The critical activation milestones: 3 mood check-ins in Week 1, 1 journal entry in Week 2, and engagement with at least 1 practitioner-assigned activity. Based on health app benchmarks, members who hit these milestones are expected to retain significantly better.',
      'Le membre construit une habitude sur les 2 à 4 premières semaines. Les jalons d\'activation critiques : 3 suivis d\'humeur en semaine 1, 1 entrée de journal en semaine 2, et engagement avec au moins 1 activité assignée par le praticien. Selon les benchmarks d\'applications de santé, les membres atteignant ces jalons devraient se retenir nettement mieux.'
    ),
    actions: [
      t('Completes 3+ mood check-ins in first week', 'Complète 3+ suivis d\'humeur la première semaine'),
      t('Writes 2+ journal entries in first two weeks', 'Rédige 2+ entrées de journal les deux premières semaines'),
      t('Engages with practitioner-assigned between-session activity', 'S\'engage dans une activité inter-séances assignée par le praticien'),
      t('Views the mood trend visualization after 5+ entries', 'Consulte la visualisation de tendance d\'humeur après 5+ entrées'),
      t('Discusses app experience in next therapy session', 'Discute de l\'expérience de l\'application lors de la prochaine séance'),
    ],
    thoughts: [
      t('"I am starting to see patterns in my mood data"', '« Je commence à voir des schémas dans mes données d\'humeur »'),
      t('"Writing before my session helps me know what to talk about"', '« Écrire avant ma séance m\'aide à savoir de quoi parler »'),
      t('"The practitioner mentioned my journal in our session — it feels connected"', '« Le praticien a mentionné mon journal en séance — ça crée un lien »'),
      t('"This is becoming part of my self-care routine"', '« Cela fait désormais partie de ma routine de bien-être »'),
    ],
    touchpoints: [
      { channel: t('Daily mood check-in reminders', 'Rappels quotidiens de suivi d\'humeur'), icon: Clock },
      { channel: t('Weekly progress summary', 'Résumé de progression hebdomadaire'), icon: BarChart3 },
      { channel: t('Practitioner mention in session', 'Mention du praticien en séance'), icon: MessageSquare },
      { channel: t('Resource library exploration', 'Exploration de la bibliothèque de ressources'), icon: Globe },
    ],
    painPoints: [
      t('Habit formation is hard — members forget to check in after initial novelty', 'La formation d\'habitude est difficile — les membres oublient de se connecter après la nouveauté initiale'),
      t('Mood data feels abstract without context or interpretation', 'Les données d\'humeur semblent abstraites sans contexte ni interprétation'),
      t('Practitioner may not reference app data in sessions, breaking the loop', 'Le praticien peut ne pas référencer les données de l\'application en séance, brisant la boucle'),
      t('Resource library can feel overwhelming if not curated per member', 'La bibliothèque de ressources peut sembler accablante si elle n\'est pas personnalisée par membre'),
    ],
    opportunities: [
      t('Streak rewards: visual badges for 3-day, 7-day, 14-day check-in streaks', 'Récompenses de série : badges visuels pour les séries de 3, 7 et 14 jours de suivi'),
      t('AI-generated "week in review" summary shared with member and practitioner', 'Résumé « bilan de la semaine » généré par l\'IA, partagé avec le membre et le praticien'),
      t('Coach practitioners to reference member data in sessions (closes the loop)', 'Accompagner les praticiens pour référencer les données des membres en séance (boucler la boucle)'),
      t('Personalized resource recommendations based on mood patterns and journal themes', 'Recommandations de ressources personnalisées basées sur les schémas d\'humeur et les thèmes du journal'),
    ],
    metrics: [
      { label: t('Week 1 activation (3+ check-ins)', 'Activation semaine 1 (3+ suivis)'), target: '>45 %' },
      { label: t('Week 2 journal entry', 'Entrée de journal semaine 2'), target: '>30 %' },
      { label: t('30-day retention', 'Rétention à 30 jours'), target: '>50 %' },
    ],
    tools: ['Streak tracking (custom)', t('AI weekly summary', 'Résumé IA hebdomadaire'), 'Push notification scheduling', t('Resource recommendation engine', 'Moteur de recommandation de ressources')],
  },
  {
    id: 'b2c-engagement',
    stage: t('Engagement', 'Engagement'),
    emotion: 2,
    emotionLabel: t('Empowered', 'Autonome'),
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Heart,
    description: t(
      'Member is an active user. They check in 3-5x/week, journal regularly, engage with practitioner-assigned activities, and use the resource library. They feel the app is a genuine extension of their therapy — not a separate obligation.',
      'Le membre est un utilisateur actif. Il se connecte 3 à 5 fois par semaine, journalise régulièrement, s\'investit dans les activités assignées par le praticien et utilise la bibliothèque de ressources. Il sent que l\'application est un véritable prolongement de sa thérapie — pas une obligation supplémentaire.'
    ),
    actions: [
      t('Daily or near-daily mood check-ins (habit established)', 'Suivis d\'humeur quotidiens ou quasi-quotidiens (habitude établie)'),
      t('Regular journaling linked to therapeutic themes', 'Journalisation régulière liée aux thèmes thérapeutiques'),
      t('Completes between-session activities assigned by practitioner', 'Complète les activités inter-séances assignées par le praticien'),
      t('Uses Bloom AI for coping strategies and psychoeducation', 'Utilise Bloom AI pour les stratégies d\'adaptation et la psychoéducation'),
      t('Reviews mood trends and shares insights in sessions', 'Consulte les tendances d\'humeur et partage ses observations en séance'),
    ],
    thoughts: [
      t('"I notice more about myself between sessions now"', '« Je remarque davantage de choses sur moi-même entre les séances maintenant »'),
      t('"My therapist and I are more aligned because of the shared data"', '« Mon thérapeute et moi sommes plus alignés grâce aux données partagées »'),
      t('"The between-session activities make my sessions more productive"', '« Les activités inter-séances rendent mes séances plus productives »'),
      t('"I feel like an active participant in my healing, not just a patient"', '« Je me sens acteur de ma guérison, pas simplement patient »'),
    ],
    touchpoints: [
      { channel: t('Daily app usage (habitual)', 'Utilisation quotidienne de l\'application (habituelle)'), icon: Smartphone },
      { channel: t('Bloom AI conversations', 'Conversations Bloom AI'), icon: Brain },
      { channel: t('Practitioner-shared insights', 'Observations partagées par le praticien'), icon: Sparkles },
      { channel: t('Mood trend visualizations', 'Visualisations de tendances d\'humeur'), icon: TrendingUp },
    ],
    painPoints: [
      t('Content can feel repetitive after 2-3 months of regular use', 'Le contenu peut sembler répétitif après 2-3 mois d\'utilisation régulière'),
      t('AI responses sometimes feel generic for complex emotional states', 'Les réponses de l\'IA semblent parfois génériques face à des états émotionnels complexes'),
      t('No peer community or shared experience features (isolation)', 'Pas de communauté de pairs ni de fonctionnalités d\'expérience partagée (isolement)'),
      t('Notifications feel intrusive once habit is established — wants more control', 'Les notifications semblent intrusives une fois l\'habitude établie — désir de plus de contrôle'),
    ],
    opportunities: [
      t('Introduce goal tracking tied to therapeutic milestones', 'Introduire un suivi d\'objectifs lié aux jalons thérapeutiques'),
      t('AI-powered insights: "Over the past month, your mood improves after journaling"', 'Observations générées par l\'IA : « Ce dernier mois, votre humeur s\'améliore après avoir journalisé »'),
      t('Expand resource library with multimedia (guided exercises, audio)', 'Enrichir la bibliothèque de ressources avec du multimédia (exercices guidés, audio)'),
      t('Allow members to adjust notification frequency as habits mature', 'Permettre aux membres d\'ajuster la fréquence des notifications à mesure que les habitudes mûrissent'),
    ],
    metrics: [
      { label: t('Weekly active usage', 'Utilisation active hebdomadaire'), target: t('>3 days/week', '>3 jours/semaine') },
      { label: t('Avg. entries per month', 'Entrées moy. par mois'), target: '>12' },
      { label: t('Session preparation rate', 'Taux de préparation de séance'), target: '>40 %' },
    ],
    tools: ['Bloom AI (between-session)', t('Mood analytics dashboard', 'Tableau de bord d\'analyse d\'humeur'), 'Goal tracking (custom)', t('Resource library', 'Bibliothèque de ressources')],
  },
  {
    id: 'b2c-loyalty',
    stage: t('Loyalty', 'Fidélité'),
    emotion: 2,
    emotionLabel: t('Grateful', 'Reconnaissant'),
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: Star,
    description: t(
      'Member attributes part of their therapeutic progress to Bloomsline. They recommend it to friends in therapy, leave positive reviews, and feel genuine attachment to the platform. If they switch practitioners, they want one who also uses Bloomsline.',
      'Le membre attribue une partie de sa progression thérapeutique à Bloomsline. Il le recommande à ses amis en thérapie, laisse des avis positifs et ressent un attachement sincère à la plateforme. S\'il change de praticien, il en veut un qui utilise aussi Bloomsline.'
    ),
    actions: [
      t('Tells friends in therapy about the platform', 'Parle de la plateforme à des amis en thérapie'),
      t('Leaves App Store review (prompted at engagement milestone)', 'Laisse un avis sur l\'App Store (invité à un jalon d\'engagement)'),
      t('Achieves therapeutic milestones visible in the app', 'Atteint des jalons thérapeutiques visibles dans l\'application'),
      t('If switching practitioners, prefers one using Bloomsline', 'S\'il change de praticien, préfère un qui utilise Bloomsline'),
      t('Explores additional resources beyond practitioner assignments', 'Explore des ressources supplémentaires au-delà des prescriptions du praticien'),
    ],
    thoughts: [
      t('"This app is a real part of my progress — I want to keep it"', '« Cette application fait vraiment partie de ma progression — je veux la garder »'),
      t('"I told my friend who started therapy to ask if their therapist uses this"', '« J\'ai dit à mon ami qui a commencé une thérapie de demander si son thérapeute utilise ceci »'),
      t('"Looking at my mood data over 6 months — I can see how far I have come"', '« En regardant mes données d\'humeur sur 6 mois — je vois tout le chemin parcouru »'),
      t('"If I change therapists, I want one who uses Bloomsline"', '« Si je change de thérapeute, j\'en veux un qui utilise Bloomsline »'),
    ],
    touchpoints: [
      { channel: t('Milestone celebrations in-app', 'Célébrations de jalons dans l\'application'), icon: Star },
      { channel: t('App Store review prompt', 'Invitation à laisser un avis App Store'), icon: Smartphone },
      { channel: t('Progress reports (shareable)', 'Rapports de progression (partageables)'), icon: BarChart3 },
      { channel: t('Practitioner referral network', 'Réseau de recommandation de praticiens'), icon: Handshake },
    ],
    painPoints: [
      t('Fear of losing data if practitioner stops using Bloomsline', 'Peur de perdre ses données si le praticien arrête d\'utiliser Bloomsline'),
      t('Wants to maintain progress tracking even if therapy ends', 'Souhaite maintenir le suivi de progression même si la thérapie se termine'),
      t('No formal way to recommend the platform beyond word-of-mouth', 'Pas de moyen formel de recommander la plateforme au-delà du bouche-à-oreille'),
      t('Milestone definitions feel arbitrary rather than clinically meaningful', 'Les définitions des jalons semblent arbitraires plutôt que cliniquement significatives'),
    ],
    opportunities: [
      t('Build member continuity: data persists even if they switch practitioners', 'Assurer la continuité des membres : les données persistent même en cas de changement de praticien'),
      t('Create shareable (anonymized) progress reports for personal records', 'Créer des rapports de progression partageables (anonymisés) pour les archives personnelles'),
      t('Launch "refer your therapist" feature — close the B2C → B2B loop', 'Lancer la fonctionnalité « recommandez votre thérapeute » — boucler la boucle B2C → B2B'),
      t('Clinically-validated milestones designed with advisory board input', 'Jalons validés cliniquement, conçus avec l\'apport du comité consultatif'),
    ],
    metrics: [
      { label: t('App Store rating', 'Note App Store'), target: t('>4.5 stars', '>4,5 étoiles') },
      { label: t('Member referral rate', 'Taux de recommandation des membres'), target: '>10 %' },
      { label: t('6-month retention', 'Rétention à 6 mois'), target: '>40 %' },
    ],
    tools: [t('App Store review prompts', 'Invitations avis App Store'), t('Progress visualization', 'Visualisation de progression'), t('Referral tracking', 'Suivi des recommandations'), t('Milestone engine', 'Moteur de jalons')],
  },
  {
    id: 'b2c-churn',
    stage: t('Churn Risk', 'Risque de désengagement'),
    emotion: -2,
    emotionLabel: t('Disconnected', 'Déconnecté'),
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: t(
      'Member disengages. Usage drops, check-ins become sporadic, journal entries stop. Often correlates with therapy ending, practitioner switching, or a perceived lack of value. Unlike B2B, members don\'t pay — so churn manifests as silent disengagement.',
      'Le membre se désengage. L\'utilisation chute, les suivis deviennent sporadiques, les entrées de journal s\'arrêtent. Souvent corrélé à la fin de la thérapie, un changement de praticien ou un manque de valeur perçue. Contrairement au B2B, les membres ne paient pas — le désengagement se manifeste donc silencieusement.'
    ),
    actions: [
      t('Stops daily mood check-ins (drops from 5x/week to 0-1x)', 'Arrête les suivis d\'humeur quotidiens (passe de 5x/semaine à 0-1x)'),
      t('Ignores push notifications or disables them', 'Ignore les notifications push ou les désactive'),
      t('Does not engage with new practitioner-assigned activities', 'Ne s\'engage pas dans les nouvelles activités assignées par le praticien'),
      t('Deletes the app or just stops opening it', 'Supprime l\'application ou cesse simplement de l\'ouvrir'),
      t('Therapy ends and there is no standalone value proposition', 'La thérapie se termine et il n\'y a pas de proposition de valeur autonome'),
    ],
    thoughts: [
      t('"I stopped therapy, so I do not need this anymore"', '« J\'ai arrêté la thérapie, donc je n\'ai plus besoin de ça »'),
      t('"I was using it because my therapist asked me to, not for myself"', '« Je l\'utilisais parce que mon thérapeute me l\'a demandé, pas pour moi-même »'),
      t('"The check-ins feel like a chore now, not a help"', '« Les suivis ressemblent à une corvée maintenant, pas à une aide »'),
      t('"I got what I needed — my mood is better, I do not need to track anymore"', '« J\'ai obtenu ce dont j\'avais besoin — mon humeur va mieux, je n\'ai plus besoin de suivre »'),
    ],
    touchpoints: [
      { channel: t('Re-engagement push notification', 'Notification push de réactivation'), icon: MessageSquare },
      { channel: t('Practitioner alert (member disengaging)', 'Alerte praticien (membre en désengagement)'), icon: AlertTriangle },
      { channel: t('"We miss you" email', 'E-mail « vous nous manquez »'), icon: Mail },
      { channel: t('App deletion detection', 'Détection de suppression de l\'application'), icon: Smartphone },
    ],
    painPoints: [
      t('No standalone value — app only makes sense within active therapy', 'Pas de valeur autonome — l\'application n\'a de sens qu\'en thérapie active'),
      t('Therapy ending = app ending for most members', 'Fin de thérapie = fin de l\'application pour la plupart des membres'),
      t('Re-engagement messages feel guilt-inducing for vulnerable users', 'Les messages de réactivation induisent de la culpabilité chez les utilisateurs vulnérables'),
      t('No graceful off-ramp or "maintenance mode" for therapy completers', 'Pas de sortie en douceur ni de « mode maintenance » pour ceux qui terminent leur thérapie'),
    ],
    opportunities: [
      t('Build "therapy complete" mode: lighter check-ins, self-directed resources', 'Créer un mode « thérapie terminée » : suivis allégés, ressources en autonomie'),
      t('Alert practitioner when member disengages — opportunity for in-session conversation', 'Alerter le praticien quand un membre se désengage — occasion de discussion en séance'),
      t('Celebrate therapy completion: "Look how far you have come" retrospective', 'Célébrer la fin de thérapie : rétrospective « regardez tout le chemin parcouru »'),
      t('Offer maintenance plan: monthly mood check-in + access to resource library', 'Proposer un plan de maintenance : suivi d\'humeur mensuel + accès à la bibliothèque de ressources'),
    ],
    metrics: [
      { label: t('Member monthly churn', 'Désengagement mensuel des membres'), target: '<8 %' },
      { label: t('Practitioner notification → re-engagement', 'Notification praticien → réengagement'), target: '>20 %' },
      { label: t('Post-therapy retention (90 days)', 'Rétention post-thérapie (90 jours)'), target: '>15 %' },
    ],
    tools: [t('Churn prediction (custom)', 'Prédiction de désabonnement (custom)'), t('Practitioner alert system', 'Système d\'alerte praticien'), t('Completion retrospective generator', 'Générateur de rétrospective de complétion'), t('Maintenance mode', 'Mode maintenance')],
  },
]

// ── Emotion curve helper ────────────────────────────────────────────────

const EMOTION_LABELS: Record<number, { label: string; color: string }> = {
  '-2': { label: 'Frustrated', color: 'text-red-500' },
  '-1': { label: 'Anxious', color: 'text-amber-500' },
  '0': { label: 'Neutral', color: 'text-gray-400' },
  '1': { label: 'Positive', color: 'text-blue-500' },
  '2': { label: 'Delighted', color: 'text-emerald-500' },
}

function EmotionCurve({ stages, color }: { stages: JourneyStage[]; color: string }) {
  const height = 120
  const padding = 24
  const usableHeight = height - padding * 2
  const stepWidth = 100 / (stages.length - 1)

  // Map emotion (-2 to +2) to y coordinate (top = +2, bottom = -2)
  const toY = (emotion: number) => padding + ((2 - emotion) / 4) * usableHeight

  const points = stages.map((s, i) => ({
    x: i * stepWidth,
    y: toY(s.emotion),
    label: s.emotionLabel,
    stage: s.stage,
    emotion: s.emotion,
  }))

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="relative" style={{ height }}>
        {/* Horizontal reference lines */}
        {[-2, -1, 0, 1, 2].map((level) => (
          <div
            key={level}
            className="absolute left-0 right-0 border-t border-dashed border-gray-100"
            style={{ top: toY(level) }}
          >
            <span className={`absolute -left-1 -translate-y-1/2 text-[8px] font-medium ${EMOTION_LABELS[level]?.color || 'text-gray-400'}`} style={{ left: -4 }}>
              {level === 2 ? '😊' : level === 1 ? '🙂' : level === 0 ? '😐' : level === -1 ? '😟' : '😣'}
            </span>
          </div>
        ))}

        {/* SVG curve */}
        <svg
          viewBox={`0 0 100 ${height}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Stage labels below */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between" style={{ bottom: -20 }}>
          {points.map((p, i) => (
            <div key={i} className="text-center" style={{ width: `${100 / stages.length}%` }}>
              <p className="text-[8px] font-semibold text-gray-500 truncate">{p.stage}</p>
              <p className={`text-[7px] font-medium ${EMOTION_LABELS[p.emotion]?.color || 'text-gray-400'}`}>{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Stage card renderer ─────────────────────────────────────────────────

function StageCard({ stage, index, baseDelay, t }: { stage: JourneyStage; index: number; baseDelay: number; t: (en: string, fr: string) => string }) {
  const Icon = stage.icon
  return (
    <motion.div
      className={`bg-white border ${stage.borderColor} rounded-xl p-5`}
      {...fadeUp(baseDelay + index * 0.03)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${stage.bgColor} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${stage.color}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">{stage.stage}</h4>
            <p className={`text-[9px] font-semibold ${stage.color}`}>{stage.emotionLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i <= stage.emotion + 2
                  ? stage.emotion >= 1 ? 'bg-emerald-400' : stage.emotion >= 0 ? 'bg-blue-400' : stage.emotion >= -1 ? 'bg-amber-400' : 'bg-red-400'
                  : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{stage.description}</p>

      {/* Actions & Thoughts (side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Actions', 'Actions')}</p>
          <div className="space-y-1.5">
            {stage.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Thoughts', 'Pens\u00e9es')}</p>
          <div className="space-y-1.5">
            {stage.thoughts.map((th, i) => (
              <div key={i} className="flex items-start gap-2">
                <Brain className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 italic">{th}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Touchpoints */}
      <div className="mb-4">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Touchpoints', 'Points de contact')}</p>
        <div className="flex flex-wrap gap-2">
          {stage.touchpoints.map((tp, i) => {
            const TpIcon = tp.icon
            return (
              <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                <TpIcon className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] text-gray-600">{tp.channel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pain Points & Opportunities (side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {t('Pain Points', 'Points de douleur')}
          </p>
          <div className="space-y-1.5">
            {stage.painPoints.map((p, i) => (
              <p key={i} className="text-[10px] text-red-600 leading-relaxed">• {p}</p>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> {t('Opportunities', 'Opportunit\u00e9s')}
          </p>
          <div className="space-y-1.5">
            {stage.opportunities.map((o, i) => (
              <p key={i} className="text-[10px] text-emerald-600 leading-relaxed">• {o}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics & Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Key Metrics', 'M\u00e9triques cl\u00e9s')}</p>
          <div className="space-y-1.5">
            {stage.metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{m.label}</span>
                <span className="text-[10px] font-bold text-gray-900">{m.target}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Recommended Tools', 'Outils recommand\u00e9s')}</p>
          <div className="flex flex-wrap gap-1.5">
            {stage.tools.map((tool, i) => (
              <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CustomerJourneyPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en
  const B2B_STAGES = getB2BStages(t)
  const B2C_STAGES = getB2CStages(t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Customer Journey Map', 'Carte du parcours client')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — B2B Practitioner & B2C Member Journeys', 'Bloomsline Care — Parcours praticien B2B & membre B2C')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ─────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Two journeys. One connected experience.', 'Deux parcours. Une exp\u00e9rience connect\u00e9e.')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Bloomsline operates a B2B2C model: practitioners (B2B) adopt the platform and invite their members (B2C). Each journey has 7 lifecycle stages \u2014 from awareness to churn risk \u2014 with distinct emotional arcs, touchpoints, and intervention points. Understanding both journeys is critical because practitioner retention depends on member engagement, and member engagement depends on practitioner activation. Note: These journeys are constructed from 119 discovery interviews with practitioners and industry benchmarks. All metrics are targets or projections \u2014 not measured data. We have 15 beta testers and 0 paying customers.',
              'Bloomsline fonctionne sur un mod\u00e8le B2B2C : les praticiens (B2B) adoptent la plateforme et invitent leurs membres (B2C). Chaque parcours comporte 7 \u00e9tapes du cycle de vie \u2014 de la sensibilisation au risque de d\u00e9sabonnement \u2014 avec des arcs \u00e9motionnels, des points de contact et des points d\u2019intervention distincts. Comprendre les deux parcours est essentiel car la r\u00e9tention des praticiens d\u00e9pend de l\u2019engagement des membres, et l\u2019engagement des membres d\u00e9pend de l\u2019activation des praticiens. Note : Ces parcours sont construits \u00e0 partir de 119 entretiens de d\u00e9couverte avec des praticiens et de benchmarks sectoriels. Toutes les m\u00e9triques sont des cibles ou des projections \u2014 pas des donn\u00e9es mesur\u00e9es. Nous avons 15 b\u00eata-testeurs et 0 client payant.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{t('7 B2B stages', '7 \u00e9tapes B2B')}</span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">{t('7 B2C stages', '7 \u00e9tapes B2C')}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{t('84 touchpoints mapped', '84 points de contact cartographi\u00e9s')}</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">{t('56 opportunities identified', '56 opportunit\u00e9s identifi\u00e9es')}</span>
          </div>
        </motion.section>

        {/* ── 2. Journey Overview ─────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('How the B2B and B2C journeys interlock in the Bloomsline flywheel', 'Comment les parcours B2B et B2C s\u2019imbriquent dans le volant d\u2019inertie Bloomsline')}>{t('Journey Architecture', 'Architecture du parcours')}</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-blue-700 mb-1">{t('B2B: Practitioner', 'B2B : Praticien')}</p>
                <p className="text-[9px] text-blue-600">{t('Adopts platform \u2192 generates AI notes \u2192 invites members \u2192 sees engagement data \u2192 retains subscription', 'Adopte la plateforme \u2192 g\u00e9n\u00e8re des notes IA \u2192 invite des membres \u2192 consulte les donn\u00e9es d\u2019engagement \u2192 conserve l\u2019abonnement')}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-gray-600 mb-1">{t('Flywheel', 'Volant d\u2019inertie')}</p>
                  <p className="text-[9px] text-gray-500">{t('Practitioner activation drives member engagement. Member engagement drives practitioner retention.', 'L\u2019activation du praticien stimule l\u2019engagement des membres. L\u2019engagement des membres stimule la r\u00e9tention des praticiens.')}</p>
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                <User className="w-5 h-5 text-rose-600 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-rose-700 mb-1">{t('B2C: Member', 'B2C : Membre')}</p>
                <p className="text-[9px] text-rose-600">{t('Receives invitation \u2192 downloads app \u2192 builds habit \u2192 shares data \u2192 stays connected between sessions', 'Re\u00e7oit l\u2019invitation \u2192 t\u00e9l\u00e9charge l\u2019application \u2192 construit l\u2019habitude \u2192 partage les donn\u00e9es \u2192 reste connect\u00e9 entre les s\u00e9ances')}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── B2B PRACTITIONER JOURNEY ───────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}

        <motion.section {...fadeUp(0.1)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('B2B Practitioner Journey', 'Parcours praticien B2B')}</h2>
              <p className="text-sm text-gray-500">{t('Personas: Marie (psychologist, 38) & Thomas (psychiatrist, 52)', 'Personas : Marie (psychologue, 38 ans) & Thomas (psychiatre, 52 ans)')}</p>
            </div>
          </div>
        </motion.section>

        {/* B2B Emotional Curve */}
        <motion.section {...fadeUp(0.12)}>
          <SectionTitle subtitle={t('Emotional arc from first contact to loyalty or churn', 'Arc \u00e9motionnel du premier contact \u00e0 la fid\u00e9lit\u00e9 ou au d\u00e9sabonnement')}>{t('Practitioner Emotional Curve', 'Courbe \u00e9motionnelle du praticien')}</SectionTitle>
          <EmotionCurve stages={B2B_STAGES} color="#3b82f6" />
        </motion.section>

        {/* B2B Stage Cards */}
        {B2B_STAGES.map((stage, i) => (
          <StageCard key={stage.id} stage={stage} index={i} baseDelay={0.18} t={t} />
        ))}

        {/* B2B Journey Insight */}
        <motion.section {...fadeUp(0.5)}>
          <div className="bg-blue-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-bold">{t('B2B Critical Insight', 'Insight critique B2B')}</h3>
            </div>
            <p className="text-[10px] text-blue-200 leading-relaxed mb-3">
              {t(
                'The practitioner journey has one make-or-break moment: ',
                'Le parcours du praticien a un moment d\u00e9cisif : '
              )}
              <span className="text-white font-semibold">{t('the first AI note generated in under 5 minutes', 'la premi\u00e8re note IA g\u00e9n\u00e9r\u00e9e en moins de 5 minutes')}</span>.
              {t(
                ' If a practitioner sees their first session notes generated instantly, they experience the "aha moment" that shifts perception from "another SaaS tool" to "this changes my practice." Every touchpoint before this moment should reduce friction. Every touchpoint after should deepen the habit loop.',
                ' Si un praticien voit ses premi\u00e8res notes de s\u00e9ance g\u00e9n\u00e9r\u00e9es instantan\u00e9ment, il vit le \u00ab moment d\u00e9clic \u00bb qui fait passer la perception de \u00ab un outil SaaS de plus \u00bb \u00e0 \u00ab cela transforme ma pratique \u00bb. Chaque point de contact avant ce moment doit r\u00e9duire la friction. Chaque point de contact apr\u00e8s doit approfondir la boucle d\u2019habitude.'
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">5 min</p>
                <p className="text-[9px] text-blue-300">{t('Time to first AI note', 'Temps avant la premi\u00e8re note IA')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{t('7 days', '7 jours')}</p>
                <p className="text-[9px] text-blue-300">{t('Activation window', 'Fen\u00eatre d\u2019activation')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">3x</p>
                <p className="text-[9px] text-blue-300">{t('Retention lift (projected, SaaS benchmark)', 'Gain de r\u00e9tention (projet\u00e9, benchmark SaaS)')}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── B2C MEMBER JOURNEY ─────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}

        <motion.section {...fadeUp(0.55)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <User className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('B2C Member Journey', 'Parcours membre B2C')}</h2>
              <p className="text-sm text-gray-500">{t('Personas: Lea (client, 29, anxiety) & Sophie (HR manager, 41, burnout)', 'Personas : L\u00e9a (cliente, 29 ans, anxi\u00e9t\u00e9) & Sophie (DRH, 41 ans, burnout)')}</p>
            </div>
          </div>
        </motion.section>

        {/* B2C Emotional Curve */}
        <motion.section {...fadeUp(0.57)}>
          <SectionTitle subtitle={t('Emotional arc from practitioner invitation to habitual engagement or disengagement', 'Arc \u00e9motionnel de l\u2019invitation du praticien \u00e0 l\u2019engagement habituel ou au d\u00e9sengagement')}>{t('Member Emotional Curve', 'Courbe \u00e9motionnelle du membre')}</SectionTitle>
          <EmotionCurve stages={B2C_STAGES} color="#f43f5e" />
        </motion.section>

        {/* B2C Stage Cards */}
        {B2C_STAGES.map((stage, i) => (
          <StageCard key={stage.id} stage={stage} index={i} baseDelay={0.62} t={t} />
        ))}

        {/* B2C Journey Insight */}
        <motion.section {...fadeUp(0.9)}>
          <div className="bg-rose-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-rose-300" />
              <h3 className="text-sm font-bold">{t('B2C Critical Insight', 'Insight critique B2C')}</h3>
            </div>
            <p className="text-[10px] text-rose-200 leading-relaxed mb-3">
              {t(
                'The member journey is fundamentally different from typical consumer apps: ',
                'Le parcours du membre est fondamentalement diff\u00e9rent des applications grand public classiques : '
              )}
              <span className="text-white font-semibold">{t('acquisition is practitioner-driven, not marketing-driven', 'l\u2019acquisition est pilot\u00e9e par le praticien, pas par le marketing')}</span>.
              {t(
                ' This means members arrive with high trust (therapist recommendation) but low intrinsic motivation (they didn\'t seek the app). The critical challenge is converting extrinsic motivation ("my therapist asked me to") into intrinsic motivation ("I do this because it helps me") within the first 14 days.',
                ' Cela signifie que les membres arrivent avec une confiance \u00e9lev\u00e9e (recommandation du th\u00e9rapeute) mais une faible motivation intrins\u00e8que (ils n\u2019ont pas cherch\u00e9 l\u2019application). Le d\u00e9fi critique est de convertir la motivation extrins\u00e8que (\u00ab mon th\u00e9rapeute me l\u2019a demand\u00e9 \u00bb) en motivation intrins\u00e8que (\u00ab je le fais parce que \u00e7a m\u2019aide \u00bb) dans les 14 premiers jours.'
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">48 h</p>
                <p className="text-[9px] text-rose-300">{t('Invite \u2192 first check-in', 'Invitation \u2192 premier suivi')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{t('14 days', '14 jours')}</p>
                <p className="text-[9px] text-rose-300">{t('Habit formation window', 'Fen\u00eatre de formation d\u2019habitude')}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{t('3 check-ins', '3 suivis')}</p>
                <p className="text-[9px] text-rose-300">{t('Week 1 activation target', 'Objectif d\u2019activation semaine 1')}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Cross-Journey Synthesis ─────────────────────────── */}
        <motion.section {...fadeUp(0.95)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">{t('Cross-Journey Key Takeaways', 'Points cl\u00e9s inter-parcours')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">{t('Flywheel Mechanics', 'M\u00e9canismes du volant d\u2019inertie')}</p>
                <div className="space-y-2">
                  {[
                    t('Practitioner activation (AI note) triggers member invitation', 'L\u2019activation du praticien (note IA) d\u00e9clenche l\u2019invitation des membres'),
                    t('Member engagement data reinforces practitioner value perception', 'Les donn\u00e9es d\u2019engagement des membres renforcent la perception de valeur du praticien'),
                    t('Practitioner referrals create new B2B acquisition at near-zero CAC', 'Les recommandations des praticiens cr\u00e9ent de nouvelles acquisitions B2B \u00e0 un CAC quasi nul'),
                    t('Member "refer your therapist" closes the B2C \u2192 B2B loop', 'Le \u00ab recommandez votre th\u00e9rapeute \u00bb des membres boucle la boucle B2C \u2192 B2B'),
                    t('Network effects (hypothesis): each practitioner brings 5-15 members to the platform', 'Effets de r\u00e9seau (hypoth\u00e8se) : chaque praticien am\u00e8ne 5 \u00e0 15 membres sur la plateforme'),
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">{t('Churn Interdependencies', 'Interd\u00e9pendances de d\u00e9sabonnement')}</p>
                <div className="space-y-2">
                  {[
                    t('Practitioner churn causes instant loss of all associated members', 'Le d\u00e9sabonnement d\u2019un praticien entra\u00eene la perte imm\u00e9diate de tous ses membres associ\u00e9s'),
                    t('Low member engagement reduces practitioner perceived value \u2192 churn risk', 'Un faible engagement des membres r\u00e9duit la valeur per\u00e7ue par le praticien \u2192 risque de d\u00e9sabonnement'),
                    t('Practitioner burnout (admin overload) is the root cause of most B2B churn', 'L\u2019\u00e9puisement du praticien (surcharge administrative) est la cause principale du d\u00e9sabonnement B2B'),
                    t('Member churn from therapy completion is natural \u2014 not a failure signal', 'Le d\u00e9sengagement des membres en fin de th\u00e9rapie est naturel \u2014 pas un signal d\u2019\u00e9chec'),
                    t('Silent B2C disengagement is the hardest churn to detect and prevent', 'Le d\u00e9sengagement silencieux B2C est le plus difficile \u00e0 d\u00e9tecter et pr\u00e9venir'),
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
              <p className="text-xs font-semibold text-white mb-2">{t('The Single Most Important Metric', 'La m\u00e9trique la plus importante')}</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">{t('Members per practitioner with weekly engagement.', 'Membres par praticien avec engagement hebdomadaire.')}</span>{' '}
                {t(
                  'This is the flywheel metric \u2014 it captures practitioner activation (are they inviting members?), member value (are members engaging?), and retention health (active engagement predicts both B2B and B2C retention). Target: 5+ members per practitioner with 3+ check-ins/week by Month 6. Every product, marketing, and support decision should be evaluated against its impact on this number.',
                  'C\u2019est la m\u00e9trique du volant d\u2019inertie \u2014 elle capture l\u2019activation du praticien (invite-t-il des membres ?), la valeur pour les membres (les membres s\u2019engagent-ils ?) et la sant\u00e9 de la r\u00e9tention (l\u2019engagement actif pr\u00e9dit la r\u00e9tention B2B et B2C). Objectif : 5+ membres par praticien avec 3+ suivis/semaine au mois 6. Chaque d\u00e9cision produit, marketing et support doit \u00eatre \u00e9valu\u00e9e en fonction de son impact sur ce chiffre.'
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────── */}
        <motion.div {...fadeUp(1.0)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Customer Journey Map \u2014 Feb 2026 \u2014 Bloomsline Care', 'Carte du parcours client \u2014 F\u00e9v. 2026 \u2014 Bloomsline Care')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
