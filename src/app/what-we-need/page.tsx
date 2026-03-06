'use client'

import { Globe, Download, ArrowLeft, AlertTriangle, Clock, Users, Cpu, Handshake, Target, Zap, CircleDot, MessageSquareQuote } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const translations = {
  en: {
    title: 'What We Need to Succeed',
    subtitle: 'An honest internal assessment — grounded in what practitioners actually told us',
    back: 'Back to Dataroom',
    sections: {
      whereWeAre: {
        title: 'Where We Actually Are',
        subtitle: 'March 2026 — no sugarcoating',
        items: [
          { label: 'Revenue', value: '€0', note: 'Zero. No one is paying. Everyone we\'ve talked to said "interesting" — but no one has swiped a card.' },
          { label: 'Team', value: '2 people', note: 'One founder builds everything (product, AI, infra, design). The other handles sales, partnerships, and everything else.' },
          { label: 'Sales pipeline', value: 'Mixed', note: 'Part outbound hunting, part inbound. Every single practitioner gets the same white-glove treatment — personal calls, custom setup, hand-holding.' },
          { label: 'Product', value: 'Live', note: 'The platform works. Sessions, notes, milestones, AI briefs, member app, Bloom companion. Wide but not deep enough in any one place.' },
          { label: 'Validation', value: 'Demos done', note: 'We\'ve demoed to practitioners. They validate the idea, ask good questions, and say they\'d test it for free. But "I\'d test it" ≠ "I\'d pay for this."' },
        ],
      },
      whatWeHeard: {
        title: 'What Practitioners Actually Told Us',
        subtitle: 'Patterns from demo conversations — the real signal',
        quotes: [
          {
            who: 'Sandra',
            quote: '"It works like a second brain — it lets me connect and find things that are normally buried in my notes."',
            insight: 'The #1 pain is not lack of tools — it\'s fragmentation. Every practitioner uses Google Drive, paper, scattered files. Finding a note from 5 sessions ago is painful.',
          },
          {
            who: 'Alisée',
            quote: '"I have a Google Drive folder per patient. I date each doc. But when I need to know if a patient is on medication, I have to go back to my very first note."',
            insight: 'They\'re all doing the same thing: bricolage. Drive folders, paper notebooks, Excel. It works until it doesn\'t — and it stops working fast.',
          },
          {
            who: 'Kevin',
            quote: '"The resources you share between sessions — that\'s an indirect key. It puts the client into a process. It triggers the decision to come back."',
            insight: 'Resources aren\'t just "homework." They\'re a retention mechanism. Practitioners who share content between sessions see more engaged clients.',
          },
          {
            who: 'Yoann',
            quote: '"I\'d have no problem investing €20/month in something like this."',
            insight: '€20/month is the ceiling for most solo practitioners. Our €19 Essentiel tier is right. But they need to feel it\'s worth replacing their current bricolage.',
          },
          {
            who: 'Patricia',
            quote: '"Patient data on a platform? Absolutely not. That\'s confidential. I don\'t even use Doctolib."',
            insight: 'Trust and privacy are non-negotiable. Some practitioners will never put patient data online. We need to respect that — and lead with value they trust.',
          },
          {
            who: 'Yoann',
            quote: '"It\'s well designed. I could figure it out on my own without you explaining. That\'s a good sign."',
            insight: 'They don\'t want training. They want intuitive. If it takes more than 10 minutes to understand, they won\'t use it.',
          },
        ],
      },
      honestProblems: {
        title: 'Our Real Problems',
        subtitle: 'The things we avoid talking about',
        items: [
          {
            problem: 'Everyone says "interesting" — no one says "take my money"',
            detail: 'We\'ve done multiple demos. Practitioners like the product, ask questions, offer to test. But not a single person has paid. The gap between "I\'d test it for free" and "I need this" is the gap we haven\'t crossed.',
            fix: 'Ship payments. Ask 5 practitioners this week: "Would you pay €19/month?" If they say no, ask what would need to change. Stop demoing and start selling.',
          },
          {
            problem: 'Our sales process doesn\'t scale',
            detail: 'Every practitioner gets the full white-glove experience: research, custom demo, personal onboarding call, follow-ups. It\'s beautiful and it takes 3-4 weeks per person. At this rate, getting to 100 practitioners would take 2+ years.',
            fix: 'Split practitioners into two tiers. Solo practitioners: self-serve onboarding (no call required). Cabinets: keep the white-glove. Spend 80% of time finding who to talk to, not hand-holding one person.',
          },
          {
            problem: 'We don\'t know our wedge feature',
            detail: 'We have notes, resources, milestones, AI briefs, member app. Different practitioners reacted to different things. Sandra lit up about note retrieval ("second brain"). Kevin got excited about resource sharing ("indirect key"). Yoann cared most about it being intuitive. We haven\'t found the ONE thing that makes all of them say "I can\'t go back to Google Drive."',
            fix: 'Look at what got the strongest reactions: Sandra on note retrieval by tags, Kevin on resource sharing between sessions, Yoann on the overview page. Bet on one and make it undeniable.',
          },
          {
            problem: 'Privacy fear is a real blocker',
            detail: 'Patricia flat-out refused to put any patient data on a platform: "Absolutely not. That\'s confidential. I don\'t even use Doctolib." Others hesitated too. This isn\'t irrational — it\'s a real concern in mental health.',
            fix: 'Lead with features that don\'t require patient data: resource creation, library, templates. Let trust build. Patient data features come after they\'re already invested.',
          },
        ],
      },
      whatSalesNeeds: {
        title: 'How We Actually Get to Revenue',
        subtitle: 'Hard truth: we\'re asking "how to scale sales" when zero demos have converted to payment. Scaling zero is still zero.',
        hardTruth: 'The white-glove approach generates great conversations. Sandra and Kevin both said they\'d try the platform — that\'s real interest, not nothing. But "I\'ll try it" is still not "I\'ll pay for it." We have warm leads, not revenue. The next step isn\'t more demos — it\'s turning those two into paying users and learning what makes the difference.',
        approaches: [
          {
            name: 'Close one, then five (do this NOW)',
            effort: 'Low',
            description: 'Sandra and Kevin said they\'d try it. Go back to them first — not with another demo, but with: "We\'re live at €19/month. Ready to start?" Then ask the others. The answers tell us everything: is the gap product, price, or trust?',
            verdict: 'This is the only thing that matters right now.',
          },
          {
            name: 'Product-led self-serve',
            effort: 'Medium',
            description: 'Build a signup flow where a practitioner can start using the platform without a call. Free trial → payment. Yoann said "I could figure it out on my own without you explaining" — if that\'s true for others, the product can sell itself. This is how you go from 5 to 100 without burning out.',
            verdict: 'Right long-term play. But only works if the product already delivers clear value in the first 10 minutes.',
          },
          {
            name: 'Content + community inbound',
            effort: 'Medium',
            description: 'Turn demo insights into blog posts, short videos, newsletter. "How therapists organize notes" type content. Practitioners trust peers and content — not cold outreach. Builds slowly but compounds.',
            verdict: 'Good for months 2-6. Not the first priority.',
          },
          {
            name: 'Automated cold outreach',
            effort: 'Low cost, high risk',
            description: 'LinkedIn automation, cold email sequences, scraping practitioner directories. High volume, low cost.',
            verdict: 'Dangerous for this market. Patricia said "patient data on a platform? Absolutely not" — and she\'s not alone. Cold outreach from an unknown platform asking therapists to digitize patient data could actively damage the brand. Not recommended.',
          },
          {
            name: 'Hire a dedicated salesperson',
            effort: 'High cost',
            description: 'Bring in someone who only does sales. Split strategy: one person for white-glove cabinets, the other for high-volume solo outreach.',
            verdict: 'Premature. You can\'t hire someone to follow a playbook that doesn\'t exist. First prove one conversion, write the playbook, then hire someone to run it. Not before.',
          },
        ],
        bottomLine: 'The real sales engine for therapists is one happy practitioner telling 3 colleagues. That\'s it. Everything else is a bridge to get there. Step 1: make one practitioner so happy they\'d be upset if the product disappeared. Step 2: ask them to tell one friend.',
      },
      whatProductNeeds: {
        title: 'What Product Needs to Ship',
        subtitle: 'The things that move us from "nice demo" to "I\'m paying for this"',
        items: [
          'Payments + free trial (Stripe) — Offer 3-6 months free so practitioners can build real habits with the platform. No credit card upfront. After the trial, ask for payment — by then they either depend on it or they don\'t. This removes the "I\'d try it" hesitation and gives us real usage data before we ever ask for money.',
          'Pre-session overview in 10 seconds — Sandra described wanting a "second brain" that surfaces what matters. Build the page so a practitioner opens a client profile and instantly sees: last session summary, mood trends, upcoming goals, flagged moments. No clicking around, no digging. If this page is fast and complete, it becomes the reason they open Bloomsline every morning.',
          'Note search by tags — bulletproof — Alisée told us she has to scroll back to her very first note to find if a patient is on medication. Tag-based retrieval has to be instant and reliable. Search "medication" → every mention across every session. This is the feature that makes Google Drive folders feel broken.',
          'Resource sharing that Kevin described — Kevin said shared resources are "an indirect key" that keeps clients in a process and triggers rebooking. Make it one click to send a resource, one click to see if it was opened. If we nail this, practitioners see engagement between sessions — something they\'ve never had before.',
          'Stop building new features — Deep over wide. The platform has sessions, notes, milestones, AI briefs, member app, Bloom. That\'s enough surface area. What it needs now is polish: faster loads, fewer clicks, smoother flows. Yoann said he could figure it out on his own — make sure that\'s true for every single screen.',
        ],
      },
      milestones: {
        title: 'The Only Milestones That Matter',
        subtitle: 'Not features shipped — outcomes reached',
        categories: [
          {
            name: 'Get them in (next 30 days)',
            items: [
              'Ship the free trial flow — Sandra and Kevin said they\'d try it, so let them. 3-6 months free, no card, no friction. Remove every excuse not to start.',
              'Get Sandra, Kevin, and Yoann actually using the platform with real clients — not demo data, real sessions. This is the only validation that matters.',
              'First practitioner signs up and starts on their own without a call. If Yoann was right that "I could figure it out on my own," prove it.',
              'Nail the pre-session overview page. If a practitioner opens it before a session and it saves them 5 minutes of digging through notes, they\'ll come back tomorrow.',
            ],
          },
          {
            name: 'Make it stick (days 30–90)',
            items: [
              'At least 3 practitioners opening the platform 3+ times per week without us reminding them. If they don\'t come back on their own, the product isn\'t sticky enough.',
              'One practitioner writes a note using tags and later retrieves it with search — the "second brain" moment Alisée described. If this works in real life, it\'s our wedge.',
              'One practitioner shares a resource to a client between sessions and sees it was opened — the "indirect key" Kevin talked about. Between-session engagement is our moat.',
              'Answer honestly: after 1 month of real use, do they depend on it? Or could they go back to Google Drive without missing anything?',
            ],
          },
          {
            name: 'First revenue (days 90–180)',
            items: [
              'Free trials end. Ask for €19/month. The ones who built real habits will pay. The ones who didn\'t will tell us why — and that feedback is worth more than the €19.',
              '5 paying practitioners — real money, not promises. This proves the model works.',
              'One practitioner refers a colleague without us asking. Sandra mentioned WhatsApp groups with psychologists — if she forwards us to one, that\'s the real sales engine starting.',
              'A repeatable way to onboard someone new without improvising every time. Write down what worked with the first 5 and do it again.',
            ],
          },
        ],
      },
      keyResources: {
        title: 'What We Have Going For Us',
        subtitle: 'Things that are actually working — not hype',
        items: [
          { name: 'Bloom already works', plain: 'The AI companion reads session notes and generates pre-session briefs automatically. A practitioner can open a client\'s page and see a summary of what happened, what to watch for, and what to ask — without digging through old notes. No competitor does this.' },
          { name: 'People got it without help', plain: 'Yoann said "I could figure it out on my own without you explaining." That\'s the bar. If a therapist can sit down and understand the product in 10 minutes, we don\'t need sales calls for every single user.' },
          { name: 'We know the real pain', plain: 'Every practitioner we talked to does the same thing: Google Drive folders, paper notebooks, WhatsApp check-ins. They all know it\'s messy. They just haven\'t found something worth switching to. We know what "worth switching" looks like now.' },
          { name: 'We can survive', plain: 'Two founders, no office, no employees, no ad spend. Monthly burn is basically API costs + hosting (~€2/user). We have time to get this right without rushing into bad decisions.' },
        ],
      },
      people: {
        title: 'People We Need',
        subtitle: 'What\'s covered, what\'s missing, what to hire for',
        roles: [
          {
            role: 'Practitioner Success Lead',
            type: 'Founding team or freelance',
            why: 'Owns everything after a practitioner says "I\'m interested": onboards them into the platform, helps them set up their first 3 clients, checks in after week 1 to see what\'s confusing, follows up at week 4 to ask "would you pay for this?" Knows that Alisée organizes by date and needs tag search to click, that Yoann wants zero hand-holding, that Patricia won\'t put patient data online. Tracks who logged in this week and who didn\'t. Sends a message when someone goes quiet — not to sell, but to understand what broke. Turns every conversation into product feedback. Asks happy practitioners to refer one colleague. This person is the reason practitioners stay or leave. If founding team: they get equity and shape how Bloomsline treats every user forever. If freelance: they get paid per practitioner successfully onboarded and retained past month 3.',
            when: 'First hire (as soon as possible)',
          },
          {
            role: 'Operations / Automation Person',
            type: 'Freelance',
            why: 'Someone who builds the systems behind growth: automated onboarding emails, CRM workflows, follow-up sequences, trial expiry reminders, usage alerts. The stuff that makes one person\'s effort feel like a team of five. Without this, every process stays manual and breaks at 20 users. Compensate based on results — number of automated workflows live, users successfully onboarded through the system.',
            when: 'Not now — in 1-2 months when volume creates the need',
          },
          {
            role: 'Clinical Advisor',
            type: 'Founding team',
            why: 'Not a contractor — a founding team member. A practitioner who shapes the product from inside, validates every feature against real clinical practice, and becomes the face practitioners trust. Kevin offered to help for 1-2 hours during his demo. We need someone like him but deeper in — someone who stakes their reputation on this being the right tool for therapists. Equity, not a free account.',
            when: 'Now',
          },
          {
            role: 'Digital Presence / Content',
            type: 'Covered internally',
            why: 'Building the system for blog posts, social content, and newsletter is something we can handle ourselves for now. Friends are already helping with this. What matters is having the system — not a full-time person. Revisit when the content machine needs more volume than we can produce.',
            when: 'Covered for now (revisit after seed)',
          },
        ],
      },
      partners: {
        title: 'Relationships That Would Change Everything',
        subtitle: 'Not a wishlist — specific things that unblock us',
        items: [
          { who: '3 Champion Practitioners', what: 'The ones who use it daily and tell peers unprompted. Sandra said "I have WhatsApp groups with psychologists — send me something I can forward." We need to find 3 more like her.' },
          { who: '1 Group Practice (Cabinet)', what: 'A cabinet of 3-5 practitioners who use the platform together. Proves the €49+€19/seat model works and gives us our first case study.' },
          { who: '1 Professional Association', what: 'SNP, AFTCC, or similar. Gets us into their newsletter/conference. One mention to their network = 50+ qualified leads.' },
        ],
      },
      hardQuestions: {
        title: 'Questions We Need to Answer Honestly',
        subtitle: 'Before the next 90 days are over',
        items: [
          'Would any of our demo practitioners pay €19/month today? If not — what\'s actually missing?',
          'Is the "second brain for notes" enough to replace Google Drive? Or do we also need scheduling/billing to be worth switching?',
          'Can we close 5 practitioners without doing a personal call? If not, what needs to change in the product?',
          'Patricia said "patient data on a platform? Absolutely not." How many feel this way? Is this 10% or 50%?',
          'Are we building for practitioners who want to modernize? Or trying to convince ones who are happy with paper notebooks?',
        ],
      },
    },
  },
  fr: {
    title: 'Ce Dont Nous Avons Besoin',
    subtitle: 'Une évaluation interne honnête — ancrée dans ce que les praticiens nous ont vraiment dit',
    back: 'Retour au Dataroom',
    sections: {
      whereWeAre: {
        title: 'Où On en Est Vraiment',
        subtitle: 'Mars 2026 — sans enjoliver',
        items: [
          { label: 'Revenu', value: '0€', note: 'Zéro. Personne ne paie. Tous ceux à qui on a parlé ont dit "intéressant" — mais personne n\'a sorti sa carte.' },
          { label: 'Équipe', value: '2 personnes', note: 'Un fondateur construit tout (produit, IA, infra, design). L\'autre gère la vente, les partenariats, et tout le reste.' },
          { label: 'Pipeline commercial', value: 'Mixte', note: 'Outbound + inbound. Chaque praticien reçoit le même traitement white-glove — appels personnels, setup sur-mesure.' },
          { label: 'Produit', value: 'En ligne', note: 'La plateforme fonctionne. Séances, notes, objectifs, briefs IA, app membre, Bloom. Large mais pas assez profond.' },
          { label: 'Validation', value: 'Démos faites', note: 'On a fait des démos aux praticiens. Ils valident l\'idée, posent de bonnes questions, et disent qu\'ils testeraient gratuitement. Mais "je testerais" ≠ "je paierais pour ça."' },
        ],
      },
      whatWeHeard: {
        title: 'Ce Que les Praticiens Nous Ont Vraiment Dit',
        subtitle: 'Les patterns des conversations de démo — le vrai signal',
        quotes: [
          {
            who: 'Sandra',
            quote: '"Ça fait un logiciel qui fonctionne comme un autre cerveau — ça permet de connecter et retrouver des choses qui sont normalement enterrées dans les notes."',
            insight: 'La douleur n°1 n\'est pas le manque d\'outils — c\'est la fragmentation. Tout le monde utilise Google Drive, papier, fichiers éparpillés. Retrouver une note de 5 séances avant est douloureux.',
          },
          {
            who: 'Alisée',
            quote: '"J\'ai un dossier Google Drive par patient. Je date chaque doc. Mais quand j\'ai besoin de savoir si un patient est sous traitement, il faut que je retourne à ma toute première note."',
            insight: 'Ils font tous la même chose : du bricolage. Dossiers Drive, carnets papier, Excel. Ça marche jusqu\'à ce que ça ne marche plus — et ça lâche vite.',
          },
          {
            who: 'Kevin',
            quote: '"Les ressources partagées entre les séances, c\'est une clé indirecte. Ça met la personne dans un processus. Ça déclenche la reprise de rendez-vous."',
            insight: 'Les ressources ne sont pas des "devoirs." C\'est un mécanisme de rétention. Les praticiens qui partagent du contenu entre les séances voient des clients plus engagés.',
          },
          {
            who: 'Yoann',
            quote: '"J\'aurais aucun problème à investir 20 euros par mois dans un truc comme ça."',
            insight: '20€/mois est le plafond pour la plupart des praticiens solo. Notre tier Essentiel à 19€ est juste. Mais ils doivent sentir que ça vaut le coup de remplacer leur bricolage actuel.',
          },
          {
            who: 'Patricia',
            quote: '"Les données patients sur une plateforme ? Absolument pas. C\'est confidentiel. Je n\'utilise même pas Doctolib."',
            insight: 'La confiance et la vie privée sont non négociables. Certains praticiens ne mettront jamais de données patient en ligne. On doit le respecter — et mener avec une valeur en laquelle ils ont confiance.',
          },
          {
            who: 'Yoann',
            quote: '"C\'est bien conçu. Je pourrais m\'en sortir tout seul sans qu\'on m\'explique. Ça c\'est bon signe."',
            insight: 'Ils ne veulent pas de formation. Ils veulent de l\'intuitif. Si ça prend plus de 10 minutes à comprendre, ils ne l\'utiliseront pas.',
          },
        ],
      },
      honestProblems: {
        title: 'Nos Vrais Problèmes',
        subtitle: 'Ce qu\'on évite d\'aborder',
        items: [
          {
            problem: 'Tout le monde dit "intéressant" — personne ne dit "prenez mon argent"',
            detail: 'On a fait plusieurs démos. Les praticiens aiment le produit, posent des questions, proposent de tester. Mais personne n\'a payé. L\'écart entre "je testerais gratuitement" et "j\'en ai besoin" est l\'écart qu\'on n\'a pas franchi.',
            fix: 'Intégrer les paiements. Demander à 5 praticiens cette semaine : "Tu paierais 19€/mois ?" Si non, demander ce qui devrait changer. Arrêter de faire des démos et commencer à vendre.',
          },
          {
            problem: 'Notre process de vente ne scale pas',
            detail: 'Chaque praticien reçoit l\'expérience white-glove complète : recherche, démo personnalisée, appel d\'onboarding, relances. C\'est magnifique et ça prend 3-4 semaines par personne.',
            fix: 'Séparer en deux tiers. Solo : onboarding self-serve (pas d\'appel). Cabinets : garder le white-glove. Passer 80% du temps à trouver qui contacter, pas à accompagner un seul.',
          },
          {
            problem: 'On ne connaît pas notre feature d\'entrée',
            detail: 'On a notes, ressources, jalons, briefs IA, app membre. Des praticiens différents ont réagi à des choses différentes. Sandra s\'est illuminée sur la recherche de notes ("second cerveau"). Kevin s\'est enthousiasmé pour le partage de ressources ("clé indirecte"). Yoann tenait surtout à ce que ce soit intuitif. On n\'a pas trouvé LA chose qui fait dire à tous "je ne peux pas revenir à Google Drive."',
            fix: 'Regarder ce qui a eu les plus fortes réactions : Sandra sur la recherche de notes par tags, Kevin sur le partage de ressources entre séances, Yoann sur la page d\'aperçu. Miser sur un et le rendre indéniable.',
          },
          {
            problem: 'La peur de la vie privée est un vrai bloqueur',
            detail: 'Patricia a catégoriquement refusé de mettre des données patient sur une plateforme : "Absolument pas. C\'est confidentiel. Je n\'utilise même pas Doctolib." D\'autres ont hésité aussi. Ce n\'est pas irrationnel — c\'est une vraie préoccupation en santé mentale.',
            fix: 'Commencer par des features qui n\'exigent pas de données patient : création de ressources, bibliothèque, modèles. Laisser la confiance se construire. Les features avec données patient viennent après.',
          },
        ],
      },
      whatSalesNeeds: {
        title: 'Comment On Arrive Vraiment au Revenu',
        subtitle: 'Vérité dure : on se demande "comment scaler la vente" alors que zéro démo n\'a converti en paiement. Scaler zéro, c\'est toujours zéro.',
        hardTruth: 'L\'approche white-glove génère de super conversations. Sandra et Kevin ont tous les deux dit qu\'ils essaieraient la plateforme — c\'est un vrai intérêt, pas rien. Mais "je vais essayer" n\'est toujours pas "je vais payer." On a des leads chauds, pas du revenu. La prochaine étape n\'est pas plus de démos — c\'est transformer ces deux-là en utilisateurs payants et comprendre ce qui fait la différence.',
        approaches: [
          {
            name: 'Closer un, puis cinq (faire ça MAINTENANT)',
            effort: 'Faible',
            description: 'Sandra et Kevin ont dit qu\'ils essaieraient. Les recontacter en premier — pas avec une autre démo, mais avec : "On est live à 19€/mois. Prêt à commencer ?" Puis demander aux autres. Les réponses nous disent tout : le gap est-il produit, prix, ou confiance ?',
            verdict: 'C\'est la seule chose qui compte maintenant.',
          },
          {
            name: 'Self-serve piloté par le produit',
            effort: 'Moyen',
            description: 'Construire un flux d\'inscription où un praticien peut commencer sans appel. Essai gratuit → paiement. Yoann a dit "je pourrais m\'en sortir tout seul sans qu\'on m\'explique" — si c\'est vrai pour les autres, le produit peut se vendre tout seul. C\'est comme ça qu\'on passe de 5 à 100 sans s\'épuiser.',
            verdict: 'Bon jeu long terme. Mais ne marche que si le produit délivre une valeur claire dans les 10 premières minutes.',
          },
          {
            name: 'Contenu + communauté inbound',
            effort: 'Moyen',
            description: 'Transformer les insights de démo en articles, vidéos courtes, newsletter. Du contenu type "Comment les thérapeutes organisent leurs notes." Les praticiens font confiance aux pairs et au contenu — pas au démarchage à froid. Lent mais cumulatif.',
            verdict: 'Bon pour les mois 2-6. Pas la première priorité.',
          },
          {
            name: 'Démarchage automatisé à froid',
            effort: 'Faible coût, haut risque',
            description: 'Automation LinkedIn, séquences d\'emails froids, scraping d\'annuaires de praticiens. Gros volume, faible coût.',
            verdict: 'Dangereux pour ce marché. Patricia a dit "les données patients sur une plateforme ? Absolument pas" — et elle n\'est pas la seule. Du démarchage à froid d\'une plateforme inconnue qui demande aux thérapeutes de numériser des données patient pourrait activement abîmer la marque. Non recommandé.',
          },
          {
            name: 'Embaucher un commercial dédié',
            effort: 'Coût élevé',
            description: 'Recruter quelqu\'un qui ne fait que la vente. Stratégie split : une personne pour les cabinets white-glove, l\'autre pour le volume solo.',
            verdict: 'Prématuré. On ne peut pas recruter quelqu\'un pour suivre un playbook qui n\'existe pas. D\'abord prouver une conversion, écrire le playbook, puis recruter. Pas avant.',
          },
        ],
        bottomLine: 'Le vrai moteur de vente pour les thérapeutes, c\'est un praticien content qui en parle à 3 collègues. C\'est tout. Tout le reste est un pont pour y arriver. Étape 1 : rendre un praticien si content qu\'il serait contrarié si le produit disparaissait. Étape 2 : lui demander de parler à un ami.',
      },
      whatProductNeeds: {
        title: 'Ce Que le Produit Doit Livrer',
        subtitle: 'Ce qui nous fait passer de "belle démo" à "je paie pour ça"',
        items: [
          'Paiements + essai gratuit (Stripe) — Offrir 3-6 mois gratuits pour que les praticiens construisent de vraies habitudes avec la plateforme. Pas de carte bancaire au départ. Après l\'essai, demander le paiement — à ce stade ils en dépendent ou pas. Ça supprime l\'hésitation "je testerais" et nous donne des données d\'usage réelles avant de demander de l\'argent.',
          'Aperçu pré-séance en 10 secondes — Sandra a décrit vouloir un "second cerveau" qui fait remonter ce qui compte. Construire la page pour qu\'un praticien ouvre un profil client et voie instantanément : résumé de la dernière séance, tendances d\'humeur, objectifs à venir, moments signalés. Pas de clics partout. Si cette page est rapide et complète, elle devient la raison d\'ouvrir Bloomsline chaque matin.',
          'Recherche de notes par tags — sans faille — Alisée nous a dit qu\'elle doit remonter jusqu\'à sa toute première note pour savoir si un patient est sous traitement. La recherche par tags doit être instantanée et fiable. Chercher "traitement" → chaque mention dans chaque séance. C\'est la feature qui rend les dossiers Google Drive obsolètes.',
          'Partage de ressources comme Kevin l\'a décrit — Kevin a dit que les ressources partagées sont "une clé indirecte" qui maintient les clients dans un processus et déclenche la reprise de rendez-vous. Un clic pour envoyer, un clic pour voir si c\'est ouvert. Si on réussit ça, les praticiens voient de l\'engagement entre les séances — quelque chose qu\'ils n\'ont jamais eu.',
          'Arrêter de construire de nouvelles features — Profondeur plutôt que largeur. La plateforme a séances, notes, jalons, briefs IA, app membre, Bloom. C\'est assez de surface. Ce qu\'il faut maintenant c\'est du polish : chargements plus rapides, moins de clics, des flux plus fluides. Yoann a dit qu\'il pouvait s\'en sortir tout seul — s\'assurer que c\'est vrai pour chaque écran.',
        ],
      },
      milestones: {
        title: 'Les Seuls Jalons Qui Comptent',
        subtitle: 'Pas des features livrées — des résultats atteints',
        categories: [
          {
            name: 'Les faire entrer (30 prochains jours)',
            items: [
              'Livrer le flux d\'essai gratuit — Sandra et Kevin ont dit qu\'ils essaieraient, alors laissons-les. 3-6 mois gratuits, pas de carte, pas de friction. Supprimer chaque excuse de ne pas commencer.',
              'Faire en sorte que Sandra, Kevin et Yoann utilisent vraiment la plateforme avec de vrais clients — pas des données de démo, de vraies séances. C\'est la seule validation qui compte.',
              'Premier praticien qui s\'inscrit et démarre seul sans appel. Si Yoann avait raison que "je pourrais m\'en sortir tout seul," le prouver.',
              'Perfectionner la page d\'aperçu pré-séance. Si un praticien l\'ouvre avant une séance et que ça lui économise 5 minutes de fouille dans les notes, il reviendra demain.',
            ],
          },
          {
            name: 'Que ça tienne (jours 30–90)',
            items: [
              'Au moins 3 praticiens qui ouvrent la plateforme 3+ fois par semaine sans qu\'on les relance. S\'ils ne reviennent pas d\'eux-mêmes, le produit n\'est pas assez accrocheur.',
              'Un praticien écrit une note avec des tags et la retrouve plus tard par recherche — le moment "second cerveau" qu\'Alisée a décrit. Si ça marche en vrai, c\'est notre feature d\'entrée.',
              'Un praticien partage une ressource à un client entre les séances et voit qu\'elle a été ouverte — la "clé indirecte" dont Kevin a parlé. L\'engagement entre séances est notre avantage.',
              'Répondre honnêtement : après 1 mois d\'usage réel, ils en dépendent ? Ou ils pourraient retourner sur Google Drive sans rien regretter ?',
            ],
          },
          {
            name: 'Premier revenu (jours 90–180)',
            items: [
              'Les essais gratuits se terminent. Demander 19€/mois. Ceux qui ont construit de vraies habitudes paieront. Ceux qui n\'ont pas nous diront pourquoi — et ce feedback vaut plus que les 19€.',
              '5 praticiens payants — du vrai argent, pas des promesses. Ça prouve que le modèle marche.',
              'Un praticien recommande un collègue sans qu\'on demande. Sandra a mentionné des groupes WhatsApp de psychologues — si elle nous transfère à un, c\'est le vrai moteur de vente qui démarre.',
              'Une façon répétable d\'onboarder quelqu\'un de nouveau sans improviser à chaque fois. Noter ce qui a marché avec les 5 premiers et le refaire.',
            ],
          },
        ],
      },
      keyResources: {
        title: 'Ce Qu\'on a Pour Nous',
        subtitle: 'Ce qui marche vraiment — pas du blabla',
        items: [
          { name: 'Bloom marche déjà', plain: 'Le compagnon IA lit les notes de séance et génère des briefs pré-séance automatiquement. Un praticien peut ouvrir la page d\'un client et voir un résumé de ce qui s\'est passé, quoi surveiller, et quoi demander — sans fouiller dans les vieilles notes. Aucun concurrent ne fait ça.' },
          { name: 'Les gens ont compris sans aide', plain: 'Yoann a dit "je pourrais m\'en sortir tout seul sans qu\'on m\'explique." C\'est la barre. Si un thérapeute peut s\'asseoir et comprendre le produit en 10 minutes, on n\'a pas besoin d\'un appel de vente pour chaque utilisateur.' },
          { name: 'On connaît la vraie douleur', plain: 'Chaque praticien à qui on a parlé fait la même chose : dossiers Google Drive, carnets papier, check-ins WhatsApp. Ils savent tous que c\'est le bazar. Ils n\'ont juste pas trouvé quelque chose qui vaille le coup de changer. On sait maintenant à quoi ça ressemble.' },
          { name: 'On peut tenir', plain: 'Deux fondateurs, pas de bureau, pas d\'employés, pas de pub. Le burn mensuel c\'est essentiellement les coûts API + hébergement (~2€/utilisateur). On a le temps de faire les choses bien sans se précipiter dans de mauvaises décisions.' },
        ],
      },
      people: {
        title: 'Les Gens Dont On a Besoin',
        subtitle: 'Ce qui est couvert, ce qui manque, pour quoi recruter',
        roles: [
          {
            role: 'Responsable Succès Praticiens',
            type: 'Équipe fondatrice ou freelance',
            why: 'Gère tout après qu\'un praticien dit "ça m\'intéresse" : l\'onboarde sur la plateforme, l\'aide à configurer ses 3 premiers clients, fait le point après la semaine 1 pour voir ce qui bloque, relance à la semaine 4 pour demander "tu paierais pour ça ?" Sait qu\'Alisée organise par date et a besoin que la recherche par tags marche, que Yoann veut zéro accompagnement, que Patricia ne mettra pas de données patient en ligne. Suit qui s\'est connecté cette semaine et qui non. Envoie un message quand quelqu\'un devient silencieux — pas pour vendre, mais pour comprendre ce qui a cassé. Transforme chaque conversation en feedback produit. Demande aux praticiens contents de recommander un collègue. Cette personne est la raison pour laquelle les praticiens restent ou partent. Si équipe fondatrice : equity et elle façonne comment Bloomsline traite chaque utilisateur pour toujours. Si freelance : payée par praticien onboardé et retenu après le mois 3.',
            when: 'Premier recrutement (dès que possible)',
          },
          {
            role: 'Opérations / Automatisation',
            type: 'Freelance',
            why: 'Quelqu\'un qui construit les systèmes derrière la croissance : emails d\'onboarding automatisés, workflows CRM, séquences de relance, rappels de fin d\'essai, alertes d\'usage. Ce qui fait qu\'une personne a l\'impact d\'une équipe de cinq. Sans ça, chaque process reste manuel et casse à 20 utilisateurs. Rémunérer sur les résultats — nombre de workflows automatisés en production, utilisateurs onboardés via le système.',
            when: 'Pas maintenant — dans 1-2 mois quand le volume crée le besoin',
          },
          {
            role: 'Conseiller Clinique',
            type: 'Équipe fondatrice',
            why: 'Pas un prestataire — un membre de l\'équipe fondatrice. Un praticien qui façonne le produit de l\'intérieur, valide chaque feature contre la pratique clinique réelle, et devient le visage en qui les praticiens ont confiance. Kevin a proposé d\'aider 1-2 heures pendant sa démo. On a besoin de quelqu\'un comme lui mais plus impliqué — quelqu\'un qui met sa réputation en jeu sur le fait que c\'est le bon outil pour les thérapeutes. De l\'equity, pas un compte gratuit.',
            when: 'Maintenant',
          },
          {
            role: 'Présence Digitale / Contenu',
            type: 'Couvert en interne',
            why: 'Construire le système pour les articles, contenu social et newsletter, c\'est quelque chose qu\'on peut gérer nous-mêmes pour l\'instant. Des amis aident déjà avec ça. Ce qui compte c\'est avoir le système — pas une personne à temps plein. À revoir quand la machine à contenu a besoin de plus de volume qu\'on peut produire.',
            when: 'Couvert pour l\'instant (revoir après le seed)',
          },
        ],
      },
      partners: {
        title: 'Relations Qui Changeraient Tout',
        subtitle: 'Pas une wishlist — des choses concrètes qui nous débloquent',
        items: [
          { who: '3 Praticiens Champions', what: 'Ceux qui l\'utilisent chaque jour et en parlent spontanément. Sandra a dit "j\'ai des groupes WhatsApp avec des psychologues — envoyez-moi quelque chose que je peux transférer." En trouver 3 comme elle.' },
          { who: '1 Cabinet de Groupe', what: 'Un cabinet de 3-5 praticiens qui utilisent la plateforme ensemble. Prouve que le modèle 49€+19€/siège marche et nous donne notre première étude de cas.' },
          { who: '1 Association Professionnelle', what: 'SNP, AFTCC ou similaire. Nous fait entrer dans leur newsletter/conférence. Une mention à leur réseau = 50+ leads qualifiés.' },
        ],
      },
      hardQuestions: {
        title: 'Questions Auxquelles On Doit Répondre Honnêtement',
        subtitle: 'Avant la fin des 90 prochains jours',
        items: [
          'Est-ce qu\'un de nos praticiens de démo paierait 19€/mois aujourd\'hui ? Si non — qu\'est-ce qui manque vraiment ?',
          'Est-ce que le "second cerveau pour les notes" suffit à remplacer Google Drive ? Ou faut-il aussi l\'agenda/facturation pour que ça vaille le coup de changer ?',
          'Peut-on closer 5 praticiens sans faire d\'appel personnel ? Si non, qu\'est-ce qui doit changer dans le produit ?',
          'Patricia a dit "les données patients sur une plateforme ? Absolument pas." Combien pensent comme ça ? 10% ou 50% ?',
          'Est-ce qu\'on construit pour des praticiens qui veulent se moderniser ? Ou essaie-t-on de convaincre ceux qui sont contents avec leurs carnets papier ?',
        ],
      },
    },
  },
}

export default function WhatWeNeedPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en
  const s = t.sections

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all text-sm font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        <button
          onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:border-neutral-300 transition-all text-sm font-medium text-neutral-600"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-6 print:pt-6">
        <Link href="/dataroom" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-8 print:hidden">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.back}
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Logo size="sm" showText={false} />
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t.title}</h1>
        </div>
        <p className="text-neutral-500 text-sm">{t.subtitle}</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20 space-y-12 print:space-y-6 print:pb-4">

        {/* === WHERE WE ARE === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <CircleDot className="w-4 h-4 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.whereWeAre.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.whereWeAre.subtitle}</p>
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            {s.whereWeAre.items.map((item, i) => (
              <div key={i} className={`flex items-start gap-4 px-4 py-3 ${i > 0 ? 'border-t border-neutral-100' : ''}`}>
                <div className="w-28 shrink-0">
                  <p className="text-xs text-neutral-400">{item.label}</p>
                  <p className="text-sm font-semibold text-neutral-900">{item.value}</p>
                </div>
                <p className="text-sm text-neutral-600">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === WHAT WE HEARD === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareQuote className="w-4 h-4 text-teal-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.whatWeHeard.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.whatWeHeard.subtitle}</p>
          <div className="space-y-3">
            {s.whatWeHeard.quotes.map((item, i) => (
              <div key={i} className="border border-teal-100 bg-teal-50/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-teal-800 italic leading-relaxed">{item.quote}</p>
                  {'who' in item && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 shrink-0 mt-0.5">
                      {(item as { who: string }).who}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 mt-2">{item.insight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === HONEST PROBLEMS === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.honestProblems.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.honestProblems.subtitle}</p>
          <div className="space-y-3">
            {s.honestProblems.items.map((item, i) => (
              <div key={i} className="border border-amber-100 bg-amber-50/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-neutral-900">{item.problem}</p>
                <p className="text-sm text-neutral-600 mt-1">{item.detail}</p>
                <div className="mt-2 flex items-start gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-teal-700 font-medium">{item.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* === WHAT SALES NEEDS === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-violet-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.whatSalesNeeds.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.whatSalesNeeds.subtitle}</p>

          {/* Hard truth */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-neutral-700 leading-relaxed">{(s.whatSalesNeeds as any).hardTruth}</p>
          </div>

          {/* Approaches */}
          <div className="space-y-3">
            {(s.whatSalesNeeds as any).approaches?.map((approach: any, i: number) => {
              const effortColors: Record<string, string> = {
                'Low': 'bg-green-100 text-green-700',
                'Faible': 'bg-green-100 text-green-700',
                'Medium': 'bg-amber-100 text-amber-700',
                'Moyen': 'bg-amber-100 text-amber-700',
                'Low cost, high risk': 'bg-red-100 text-red-700',
                'Faible coût, haut risque': 'bg-red-100 text-red-700',
                'High cost': 'bg-red-100 text-red-700',
                'Coût élevé': 'bg-red-100 text-red-700',
              }
              return (
                <div key={i} className="border border-violet-100 bg-violet-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-neutral-900">{approach.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${effortColors[approach.effort] || 'bg-neutral-100 text-neutral-600'}`}>
                      {approach.effort}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{approach.description}</p>
                  <div className="mt-2 flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-violet-700 font-medium">{approach.verdict}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom line */}
          <div className="mt-4 border border-teal-200 bg-teal-50/50 rounded-xl p-4">
            <p className="text-sm text-teal-800 font-medium leading-relaxed">{(s.whatSalesNeeds as any).bottomLine}</p>
          </div>
        </section>

        {/* === WHAT PRODUCT NEEDS === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.whatProductNeeds.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.whatProductNeeds.subtitle}</p>
          <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
            <ul className="space-y-2">
              {s.whatProductNeeds.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* === MILESTONES === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-teal-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.milestones.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.milestones.subtitle}</p>
          <div className="space-y-4">
            {s.milestones.categories.map((cat, i) => {
              const colors = ['border-red-200 bg-red-50/40', 'border-amber-200 bg-amber-50/40', 'border-teal-200 bg-teal-50/40']
              const accents = ['text-red-700', 'text-amber-700', 'text-teal-700']
              const dots = ['bg-red-400', 'bg-amber-400', 'bg-teal-400']
              return (
                <div key={i} className={`rounded-xl border p-4 ${colors[i]}`}>
                  <p className={`text-sm font-semibold ${accents[i]} mb-2`}>{cat.name}</p>
                  <ul className="space-y-1.5">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dots[i]} shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* === WHAT WE HAVE GOING FOR US === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.keyResources.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.keyResources.subtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s.keyResources.items.map((item, i) => (
              <div key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                <p className="text-sm font-semibold text-emerald-700 mb-1">{item.name}</p>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.plain}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === PEOPLE === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-violet-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.people.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.people.subtitle}</p>
          <div className="space-y-3">
            {s.people.roles.map((role, i) => {
              const r = role as any
              const typeColors: Record<string, string> = {
                'Freelance': 'bg-amber-100 text-amber-700',
                'Founding team': 'bg-violet-100 text-violet-700',
                'Équipe fondatrice': 'bg-violet-100 text-violet-700',
                'Founding team or freelance': 'bg-gradient-to-r from-violet-100 to-amber-100 text-violet-700',
                'Équipe fondatrice ou freelance': 'bg-gradient-to-r from-violet-100 to-amber-100 text-violet-700',
                'Covered internally': 'bg-teal-100 text-teal-700',
                'Couvert en interne': 'bg-teal-100 text-teal-700',
              }
              return (
                <div key={i} className="rounded-xl p-4 border border-neutral-100 bg-neutral-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-neutral-900">{role.role}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {r.type && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[r.type] || 'bg-neutral-100 text-neutral-600'}`}>
                          {r.type}
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                        {role.when}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600">{role.why}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* === PARTNERS === */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="w-4 h-4 text-indigo-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.partners.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.partners.subtitle}</p>
          <div className="space-y-2">
            {s.partners.items.map((item, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                <p className="text-sm font-semibold text-indigo-700 w-40 shrink-0">{item.who}</p>
                <p className="text-sm text-neutral-600">{item.what}</p>
              </div>
            ))}
          </div>
        </section>

        {/* === HARD QUESTIONS === */}
        <section className="print:break-before-page">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-rose-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{s.hardQuestions.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">{s.hardQuestions.subtitle}</p>
          <div className="border border-rose-100 bg-rose-50/30 rounded-xl p-4">
            <ul className="space-y-3">
              {s.hardQuestions.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-6 border-t border-neutral-100 text-xs text-neutral-400 text-center">
          Bloomsline Care &middot; Internal &middot; March 2026
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  )
}
