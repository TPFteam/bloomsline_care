# Customer Journey Maps

**Route:** `/customer-journey`
**B2B Practitioner Journey (7 stages) + B2C Member Journey (7 stages), each with emotion score, description, actions, thoughts, touchpoints, pain points, opportunities, metrics, tools**

---

## B2B Journey — Practitioner

### Stage 1: Awareness
- **Emotion:** 0 (Curious)
- **Description:** Practitioner first encounters Bloomsline through peer networks, conferences, or online content. They are overwhelmed by admin work and skeptical about AI but open to solutions that respect clinical practice.

**Actions:**
- Sees Bloomsline post in supervision group or LinkedIn
- Hears colleague mention AI-assisted notes at AFTCC conference
- Searches "AI therapy notes GDPR" or "between-session care tool"
- Reads blog article on practitioner burnout and technology solutions

**Thoughts:**
- "I spend 40% of my time on paperwork instead of clients"
- "Another AI tool — is this actually designed for therapists?"
- "My colleagues at the conference seemed impressed, worth a look"
- "Will this comply with GDPR? I handle sensitive data"

**Touchpoints:**
- LinkedIn / social media
- Professional conferences (AFTCC, Asadis)
- Peer referral / supervision groups
- Google search / SEO content

**Pain Points:**
- Information overload — too many SaaS tools making big promises
- No clear differentiation from general practice management tools
- Distrust of AI in clinical settings (45% of therapists skeptical — APA 2024)
- Unclear if tool is built for French/EU market specifically

**Opportunities:**
- Lead with practitioner burnout narrative (not AI features)
- Showcase "built by therapists, for therapists" positioning
- Provide free downloadable guides on session documentation best practices
- Leverage AFTCC and training institute partnerships for credibility

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Website visitors/month | 2,000+ |
| Content engagement rate | >3% |
| Brand recall in target segment | >15% |

**Tools:** PostHog (analytics), LinkedIn Ads, Mailchimp (newsletter), Blog/SEO

---

### Stage 2: Consideration
- **Emotion:** +1 (Interested)
- **Description:** Practitioner evaluates Bloomsline against alternatives. They compare features, pricing, and GDPR compliance. They want proof that this works for practitioners like them.

**Actions:**
- Visits bloomslinecare.com and explores features page
- Watches product demo video or attends live webinar
- Compares Bloomsline to SimplePractice, Doctolib Pro, Quenza
- Checks privacy policy and data residency information
- Asks colleagues who are already using it for honest feedback

**Thoughts:**
- "The AI notes look impressive but can I trust it with clinical data?"
- "€19-49/month — that is less than one cancelled session costs me"
- "Will my clients actually use a between-session app?"
- "I need something that works with my existing workflow, not replaces it"

**Touchpoints:**
- Product website / feature pages
- Live demo / webinar
- Comparison reviews / case studies
- Direct email from sales

**Pain Points:**
- No peer-reviewed clinical validation available yet
- Unclear how AI notes integrate with existing documentation workflow
- Concern about learning curve and time investment to set up
- No free tier to test before committing credit card

**Opportunities:**
- Offer live 1:1 demo with a clinical specialist, not a sales rep
- Create comparison landing pages vs. SimplePractice, Quenza, Doctolib
- Publish early beta tester feedback with specific outcomes
- Provide 14-day free trial with full features, no credit card required

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Demo booking rate | >25% |
| Website → trial conversion | >8% |
| Time on features page | >3 min |

**Tools:** Calendly (demo booking), Crisp (live chat), PostHog (funnel), Case study PDFs

---

### Stage 3: Decision
- **Emotion:** 0 (Cautious)
- **Description:** Practitioner decides whether to commit. Highest-friction moment — they need final reassurance on data security, clinical appropriateness, and ROI before entering payment details.

**Actions:**
- Starts 14-day free trial and generates first AI session note
- Tests the member app with one client as a pilot
- Reads terms of service and data processing agreement
- Discusses with practice partner or supervisor
- Evaluates ROI: time saved vs. monthly cost

**Thoughts:**
- "The AI note was actually good — better than what I write at 9 PM"
- "My client responded to the between-session check-in, that is new"
- "€19-49/month = less than 1 hour of my time. If it saves 4+ hours, it is worth it"
- "What happens to data if I stop paying? Can I export everything?"

**Touchpoints:**
- In-product trial experience
- Onboarding email sequence
- Checkout / pricing page
- Support chat during trial

**Pain Points:**
- Payment friction — especially for solo practitioners used to free tools
- Anxiety about committing to a platform for sensitive clinical data
- Trial period may not be long enough to see member engagement results
- No clear exit path or data portability guarantee visible during signup

**Opportunities:**
- Offer "first month 50% off" or extended 30-day trial for conference leads
- Show clear data export and account deletion options during trial
- Send personalized email: "Your first AI note took X minutes instead of Y"
- Provide ROI calculator: hours saved × hourly rate vs. subscription cost

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Trial → paid conversion | >40% |
| Days to conversion | <10 days |
| Average revenue per signup | €19-49 |

**Tools:** Stripe (payments), Customer.io (email automation), In-app analytics, ROI calculator widget

---

### Stage 4: Onboarding
- **Emotion:** -1 (Overwhelmed)
- **Description:** The critical first 7 days. Practitioner must experience the "aha moment" — generating their first AI note in under 5 minutes and inviting their first member. If onboarding takes too long or feels complex, churn risk spikes.

**Actions:**
- Completes profile setup and practice preferences
- Generates first AI session note (target: within 5 minutes)
- Customizes note templates and clinical terminology
- Invites first 1-3 members to the platform
- Reviews first between-session engagement summary

**Thoughts:**
- "Where do I start? There are a lot of features here"
- "OK the AI note was fast — but I need to review and edit it"
- "How do I explain this to my clients? Do they need to download an app?"
- "I am worried about getting the clinical language right"

**Touchpoints:**
- In-app guided setup wizard
- Welcome email sequence (Days 1, 3, 7)
- Video tutorials / help center
- Optional 1:1 onboarding call

**Pain Points:**
- Setup feels like "another thing to learn" on top of clinical load
- Member invitation flow requires explaining a new tool to clients
- AI note quality varies — needs calibration to practitioner style
- No immediate feedback on whether members are actually engaging

**Opportunities:**
- Guided "first session" wizard: upload or dictate → AI note in 90 seconds
- Pre-written member invitation templates (email, SMS, in-session script)
- Day 3 check-in email: "Here is what your first note looked like — try this next"
- White-glove onboarding for first 100 practitioners (builds loyalty + feedback)

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Time to first AI note | <5 min |
| Members invited in Week 1 | ≥1 |
| Onboarding completion rate | >75% |

**Tools:** Product tours (Shepherd.js), Intercom (in-app messaging), Loom (video walkthroughs), Calendly (1:1 calls)

---

### Stage 5: Engagement
- **Emotion:** +2 (Delighted)
- **Description:** Practitioner has integrated Bloomsline into their daily workflow. They generate AI notes after every session, track member engagement between appointments, and see measurable time savings. Value realization phase.

**Actions:**
- Generates AI notes for all sessions (2-4x/day)
- Reviews weekly member engagement dashboard
- Uses between-session care plans with 5-10 active members
- Tracks client progress milestones and outcomes data
- Shares feedback and feature requests with the team

**Thoughts:**
- "I am saving significant time on documentation" (projected: 4-6 hrs/week)
- "My clients are more engaged between sessions — I can see the data"
- "The AI catches patterns I might miss across my caseload"
- "This is becoming essential to how I practice"

**Touchpoints:**
- Daily dashboard usage
- Weekly engagement reports (email)
- In-app feature updates
- Community forum / peer group

**Pain Points:**
- Feature requests pile up — practitioners want customization
- AI note quality inconsistency for edge-case modalities (EMDR, art therapy)
- Dashboard can feel data-heavy for practitioners who prefer simplicity
- Member engagement varies — some clients engage daily, others not at all

**Opportunities:**
- Launch "Practitioner Spotlight" program — feature power users in content
- Build modality-specific AI templates (CBT, psychodynamic, systemic)
- Send monthly "practice insights" email with aggregated anonymized trends
- Introduce outcome measurement tools shareable with referrers

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Daily active practitioners | >60% of base |
| AI notes per practitioner/week | 8-15 |
| NPS score | >50 |

**Tools:** PostHog (product analytics), Customer.io (lifecycle emails), Canny (feature requests), Discord (community)

---

### Stage 6: Loyalty
- **Emotion:** +2 (Committed)
- **Description:** Practitioner becomes an advocate. They recommend Bloomsline to peers, participate in beta testing, and upgrade to annual billing. Their data is deeply embedded — switching cost is now high.

**Actions:**
- Switches to annual billing (20% discount)
- Refers 2-3 colleagues to Bloomsline
- Joins Clinical Advisory Board or beta program
- Presents Bloomsline at supervision group or local conference
- Has 15-30 active members on the platform

**Thoughts:**
- "I cannot imagine going back to handwritten notes"
- "I told my supervision group — three of them signed up"
- "The team actually listens to my feedback and ships it"
- "This has genuinely improved my practice and reduced burnout"

**Touchpoints:**
- Referral program / ambassador community
- Annual billing renewal
- Beta feature access
- Advisory board meetings

**Pain Points:**
- Long-term practitioners want enterprise features (multi-clinician, shared templates)
- Concern about platform stability and long-term viability of a startup
- Annual billing feels risky if the product might change direction
- Referral program lacks tangible incentives beyond goodwill

**Opportunities:**
- Launch referral rewards: 1 month free per successful referral
- Create "Bloomsline Champions" badge with exclusive community access
- Offer group practice pricing for practitioners who bring their clinic
- Co-author case studies and blog posts with loyal practitioners

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Annual billing adoption | >30% |
| Referral rate | >15% |
| Monthly churn (loyal segment) | <2% |

**Tools:** Referral program (Rewardful), Slack (champions community), Calendly (advisory calls), Stripe (annual billing)

---

### Stage 7: Churn Risk
- **Emotion:** -2 (Frustrated)
- **Description:** Practitioner disengages. Usage drops, AI notes become infrequent, members are no longer being invited. Without intervention, they cancel within 30-60 days. Early detection and re-engagement are critical.

**Actions:**
- Stops generating AI notes (usage drops >50% in 2 weeks)
- Ignores weekly engagement emails and in-app notifications
- Stops inviting new members to the platform
- Contacts support about cancellation or data export
- Lets subscription lapse without formal cancellation

**Thoughts:**
- "I am not using this enough to justify the cost"
- "My clients did not engage with the between-session features"
- "The AI notes are good but I already have a workflow that works"
- "I am going back to my old system — less sophisticated but familiar"

**Touchpoints:**
- Churn prediction alerts (internal)
- Re-engagement email sequence
- Personal outreach from founder/CSM
- Cancellation flow with save offers

**Pain Points:**
- Feels like the platform is not tailored to their specific practice style
- Members did not adopt between-session care — practitioners feel it failed
- Feature complexity increased but core value proposition did not deepen
- No clear improvement in client outcomes visible from the dashboard

**Opportunities:**
- Build churn prediction model: trigger at 50% usage drop over 14 days
- Offer 1:1 "practice optimization" call — reactivate value, not sales pitch
- Create "pause" option (3 months) instead of hard cancellation
- Exit survey: "What would bring you back?" — feed into product roadmap

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Monthly churn rate | <5% |
| Churn save rate | >25% |
| Win-back rate (90 days) | >10% |

**Tools:** Churn prediction (custom ML), Customer.io (win-back flows), Typeform (exit survey), Stripe (pause billing)

---

## B2C Journey — Member/Client

### Stage 1: Awareness
- **Emotion:** -1 (Uncertain)
- **Description:** Member first learns about Bloomsline through their practitioner — not through marketing. This is a trust-transfer moment: the practitioner's recommendation carries enormous weight for someone in a vulnerable therapeutic relationship.

**Actions:**
- Practitioner mentions Bloomsline during session
- Receives invitation email or SMS from practitioner
- Hears "there is an app to help you between our sessions"
- Googles "Bloomsline Care" to check legitimacy and privacy

**Thoughts:**
- "My therapist recommended this — it must be trustworthy"
- "Will this replace our in-person sessions?"
- "I already use mindfulness apps — is this different?"
- "Who can see my data? Is this really private?"

**Touchpoints:**
- In-session practitioner recommendation
- Practitioner-sent invitation (email/SMS)
- Bloomsline member landing page
- App Store listing

**Pain Points:**
- Skepticism about yet another health app collecting personal data
- Anxiety about digital tools in a deeply personal therapeutic context
- Unclear on the value — "what will I actually do with this?"
- Fear that app engagement will be "homework" monitored by therapist

**Opportunities:**
- Practitioner-framed introduction: "This extends our work together"
- Member landing page with clear privacy-first messaging and GDPR badges
- Show value immediately: "Track your mood, journal safely, stay connected"
- Emphasize practitioner control: "Your therapist chose this for you"

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Invitation → app download | >60% |
| Time from invitation to download | <48h |
| Landing page bounce rate | <40% |

**Tools:** Deep links (Branch.io), App Store optimization, Member landing page, Practitioner invitation templates

---

### Stage 2: Consideration
- **Emotion:** 0 (Open-minded)
- **Description:** Member evaluates whether to engage. Unlike B2B, the practitioner has already validated the tool — so the barrier is personal comfort with digital mental health tools, not feature comparison.

**Actions:**
- Downloads the Bloomsline member app
- Reads privacy policy and data sharing explanation
- Explores the app interface (mood tracker, journal, resources)
- Checks App Store reviews and ratings

**Thoughts:**
- "The interface feels calm and welcoming — not clinical"
- "OK, only my therapist can see my entries — that feels safe"
- "A mood tracker and journal — I have tried these before and stopped"
- "The personalized content from my therapist makes this feel different"

**Touchpoints:**
- App first-open experience
- In-app privacy explainer
- Personalized content from practitioner
- Push notification (gentle)

**Pain Points:**
- App fatigue — users have downloaded and abandoned similar apps before
- Privacy anxiety about journaling on a platform linked to their therapist
- Unclear how this is different from free apps (Headspace, Calm, Daylio)
- No immediate emotional reward from signing up

**Opportunities:**
- First-open experience: 60-second video from practitioner (personalized or template)
- Show "your therapist has prepared content for you" — creates immediate value
- Minimal permissions asked at signup — build trust before requesting data
- Clear visual comparison: "This is connected to your therapy, not standalone"

**Key Metrics:**
| Metric | Target |
|--------|--------|
| App download → account creation | >80% |
| First session completion (in-app) | >65% |
| Privacy policy engagement | >30% scroll |

**Tools:** App onboarding (custom), Practitioner-personalized content, In-app privacy flow, Analytics (Mixpanel)

---

### Stage 3: Decision
- **Emotion:** +1 (Willing)
- **Description:** Member decides to actively engage — completing their first mood check-in, journal entry, or between-session activity. Low friction (no payment required) but high emotional commitment for someone sharing mental health data.

**Actions:**
- Completes first mood check-in
- Writes first journal entry or reflection
- Engages with practitioner-assigned activity or resource
- Responds to an AI-generated check-in prompt

**Thoughts:**
- "That mood check-in was actually quick and easy"
- "Writing this out between sessions feels productive"
- "My therapist sent me a resource — they are thinking of me between sessions"
- "I feel more connected to my therapy process"

**Touchpoints:**
- First mood check-in flow
- First journal entry prompt
- Practitioner-shared resource or activity
- AI check-in notification

**Pain Points:**
- Journal prompts feel generic rather than specific to therapeutic goals
- Uncertainty about what to write or share — fear of judgment
- Notification timing is off — arrives during work or late at night
- No immediate feedback or acknowledgment after first entry

**Opportunities:**
- Celebrate first entry: warm congratulations + visual streak indicator
- Personalized journal prompts linked to last session themes
- Let members choose notification timing and frequency
- Bloom AI sends supportive acknowledgment: "Thank you for sharing — your therapist will see this"

**Key Metrics:**
| Metric | Target |
|--------|--------|
| First activity completion (48h) | >50% |
| Second activity completion (7d) | >35% |
| Notification opt-in rate | >70% |

**Tools:** Push notifications (OneSignal), In-app celebrations, Practitioner content assignment, Bloom AI prompts

---

### Stage 4: Onboarding
- **Emotion:** 0 (Adjusting)
- **Description:** Member builds a habit over the first 2-4 weeks. Critical activation milestones: 3 mood check-ins in Week 1, 1 journal entry in Week 2, and engagement with at least 1 practitioner-assigned activity. Members who hit these milestones are expected to retain significantly better.

**Actions:**
- Completes 3+ mood check-ins in first week
- Writes 2+ journal entries in first two weeks
- Engages with practitioner-assigned between-session activity
- Views the mood trend visualization after 5+ entries
- Discusses app experience in next therapy session

**Thoughts:**
- "I am starting to see patterns in my mood data"
- "Writing before my session helps me know what to talk about"
- "The practitioner mentioned my journal in our session — it feels connected"
- "This is becoming part of my self-care routine"

**Touchpoints:**
- Daily mood check-in reminders
- Weekly progress summary
- Practitioner mention in session
- Resource library exploration

**Pain Points:**
- Habit formation is hard — members forget to check in after initial novelty
- Mood data feels abstract without context or interpretation
- Practitioner may not reference app data in sessions, breaking the loop
- Resource library can feel overwhelming if not curated per member

**Opportunities:**
- Streak rewards: visual badges for 3-day, 7-day, 14-day check-in streaks
- AI-generated "week in review" summary shared with member and practitioner
- Coach practitioners to reference member data in sessions (closes the loop)
- Personalized resource recommendations based on mood patterns and journal themes

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Week 1 activation (3+ check-ins) | >45% |
| Week 2 journal entry | >30% |
| 30-day retention | >50% |

**Tools:** Streak tracking (custom), AI weekly summary, Push notification scheduling, Resource recommendation engine

---

### Stage 5: Engagement
- **Emotion:** +2 (Empowered)
- **Description:** Member is an active user. They check in 3-5x/week, journal regularly, engage with practitioner-assigned activities, and use the resource library. They feel the app is a genuine extension of their therapy — not a separate obligation.

**Actions:**
- Daily or near-daily mood check-ins (habit established)
- Regular journaling linked to therapeutic themes
- Completes between-session activities assigned by practitioner
- Uses Bloom AI for coping strategies and psychoeducation
- Reviews mood trends and shares insights in sessions

**Thoughts:**
- "I notice more about myself between sessions now"
- "My therapist and I are more aligned because of the shared data"
- "The between-session activities make my sessions more productive"
- "I feel like an active participant in my healing, not just a patient"

**Touchpoints:**
- Daily app usage (habitual)
- Bloom AI conversations
- Practitioner-shared insights
- Mood trend visualizations

**Pain Points:**
- Content can feel repetitive after 2-3 months of regular use
- AI responses sometimes feel generic for complex emotional states
- No peer community or shared experience features (isolation)
- Notifications feel intrusive once habit is established — wants more control

**Opportunities:**
- Introduce goal tracking tied to therapeutic milestones
- AI-powered insights: "Over the past month, your mood improves after journaling"
- Expand resource library with multimedia (guided exercises, audio)
- Allow members to adjust notification frequency as habits mature

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Weekly active usage | >3 days/week |
| Avg. entries per month | >12 |
| Session preparation rate | >40% |

**Tools:** Bloom AI (between-session), Mood analytics dashboard, Goal tracking (custom), Resource library

---

### Stage 6: Loyalty
- **Emotion:** +2 (Grateful)
- **Description:** Member attributes part of their therapeutic progress to Bloomsline. They recommend it to friends in therapy, leave positive reviews, and feel genuine attachment. If they switch practitioners, they want one who also uses Bloomsline.

**Actions:**
- Tells friends in therapy about the platform
- Leaves App Store review (prompted at engagement milestone)
- Achieves therapeutic milestones visible in the app
- If switching practitioners, prefers one using Bloomsline
- Explores additional resources beyond practitioner assignments

**Thoughts:**
- "This app is a real part of my progress — I want to keep it"
- "I told my friend who started therapy to ask if their therapist uses this"
- "Looking at my mood data over 6 months — I can see how far I have come"
- "If I change therapists, I want one who uses Bloomsline"

**Touchpoints:**
- Milestone celebrations in-app
- App Store review prompt
- Progress reports (shareable)
- Practitioner referral network

**Pain Points:**
- Fear of losing data if practitioner stops using Bloomsline
- Wants to maintain progress tracking even if therapy ends
- No formal way to recommend the platform beyond word-of-mouth
- Milestone definitions feel arbitrary rather than clinically meaningful

**Opportunities:**
- Build member continuity: data persists even if they switch practitioners
- Create shareable (anonymized) progress reports for personal records
- Launch "refer your therapist" feature — close the B2C → B2B loop
- Clinically-validated milestones designed with advisory board input

**Key Metrics:**
| Metric | Target |
|--------|--------|
| App Store rating | >4.5 stars |
| Member referral rate | >10% |
| 6-month retention | >40% |

**Tools:** App Store review prompts, Progress visualization, Referral tracking, Milestone engine

---

### Stage 7: Churn Risk
- **Emotion:** -2 (Disconnected)
- **Description:** Member disengages. Usage drops, check-ins become sporadic, journal entries stop. Often correlates with therapy ending, practitioner switching, or a perceived lack of value. Unlike B2B, members don't pay — so churn manifests as silent disengagement.

**Actions:**
- Stops daily mood check-ins (drops from 5x/week to 0-1x)
- Ignores push notifications or disables them
- Does not engage with new practitioner-assigned activities
- Deletes the app or just stops opening it
- Therapy ends and there is no standalone value proposition

**Thoughts:**
- "I stopped therapy, so I do not need this anymore"
- "I was using it because my therapist asked me to, not for myself"
- "The check-ins feel like a chore now, not a help"
- "I got what I needed — my mood is better, I do not need to track anymore"

**Touchpoints:**
- Re-engagement push notification
- Practitioner alert (member disengaging)
- "We miss you" email
- App deletion detection

**Pain Points:**
- No standalone value — app only makes sense within active therapy
- Therapy ending = app ending for most members
- Re-engagement messages feel guilt-inducing for vulnerable users
- No graceful off-ramp or "maintenance mode" for therapy completers

**Opportunities:**
- Build "therapy complete" mode: lighter check-ins, self-directed resources
- Alert practitioner when member disengages — opportunity for in-session conversation
- Celebrate therapy completion: "Look how far you have come" retrospective
- Offer maintenance plan: monthly mood check-in + access to resource library

**Key Metrics:**
| Metric | Target |
|--------|--------|
| Member monthly churn | <8% |
| Practitioner notification → re-engagement | >20% |
| Post-therapy retention (90 days) | >15% |

**Tools:** Churn prediction (custom), Practitioner alert system, Completion retrospective generator, Maintenance mode

---

## Emotion Curve Summary

### B2B Practitioner Journey
```
Awareness(0) → Consideration(+1) → Decision(0) → Onboarding(-1) → Engagement(+2) → Loyalty(+2) → Churn(-2)
```

### B2C Member Journey
```
Awareness(-1) → Consideration(0) → Decision(+1) → Onboarding(0) → Engagement(+2) → Loyalty(+2) → Churn(-2)
```
