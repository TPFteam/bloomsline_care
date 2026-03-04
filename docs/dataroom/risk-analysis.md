# Risk Analysis & Scenarios

**Route:** `/risk-analysis`
**15 risks across 5 categories, 4 scenarios, 3-phase mitigation roadmap**

---

## Risk Register (15 Risks)

### Market Risks

**R1: Adoption slower than modeled** — CRITICAL (Score: 16, P:4 × I:4)
- Model assumes 20-30% MoM growth. If 10-15% due to therapist tech inertia (only 5% use AI today), Series A becomes unreachable.
- Early Warnings: <10 paying practitioners after 90 days, demo-to-signup <15%, trial-to-paid <40%
- Mitigation: Hard PMF milestone (10 practitioners in 90 days or pivot). Product-led onboarding (<5 min first AI note).
- Contingency: Shift to freemium model. Reduce burn to €6K/mo. Partnership distribution.

**R2: SimplePractice/Doctolib convergence** — HIGH (Score: 12, P:3 × I:4)
- Vista paid $4B for SimplePractice, building AI features. Doctolib (80M patients, €6.4B) could add care features. Window closes in 18-24 months.
- Mitigation: Compete on care quality and local market fit, not features. Reach 200+ practitioners before convergence.

**R3: Pricing pressure from open-source AI** — MEDIUM (Score: 6, P:2 × I:3)
- Meta Llama, Mistral approach Claude quality. EHR vendors adding free AI scribing could commoditize hook.
- Mitigation: AI notes = wedge, practitioner-member connection = moat. Model routing across providers.

### Operational Risks

**R4: Two-person team bottleneck** — CRITICAL (Score: 16, P:4 × I:4)
- Two founders covering all functions. No clinical advisor. If one unavailable, operation stalls.
- Mitigation: Hire engineer immediately post-close. Ruthless prioritization. Clinical advisory board (3 advisors, equity).

**R5: Anthropic dependency** — MEDIUM (Score: 9, P:3 × I:3)
- Core AI depends entirely on Claude. Current cost ~€1.80/practitioner/month. No fallback provider.
- Mitigation: Model abstraction layer by M4. Route between Claude/GPT-4/Mistral by task complexity.

**R6: Product-market fit not reached** — CRITICAL (Score: 15, P:3 × I:5)
- Core hypothesis unvalidated. 119 interviews + 15 beta testers = interest, not purchasing behavior. Woebot had 5+ RCTs and $123M, still failed.
- Mitigation: Launch with MVP. Measure PMF (Sean Ellis survey >40%). Weekly feedback loops.
- Contingency: If M9 PMF not reached, pivot options: (1) pure AI scribe, (2) B2B enterprise wellness, (3) training institute licensing.

### Financial Risks

**R7: Pre-seed raise falls short** — HIGH (Score: 12, P:3 × I:4)
- Target €400-500K. EU health-tech seed funding declined 15% in 2024. Pre-revenue with 0 customers faces skepticism.
- Mitigation: 40+ investor pipeline. French public grants (Bpifrance Bourse €30K non-dilutive).

**R8: Churn exceeds 8%** — HIGH (Score: 12, P:3 × I:4)
- Model assumes 4% monthly churn. At €19-29/mo monthly billing, switching cost near zero. All churn modeled, zero real data.
- Mitigation: Data-driven retention from Day 1. Annual billing 20% discount. Champions community.

**R9: Series A gap** — CRITICAL (Score: 15, P:3 × I:5)
- Series A requires €80-100K MRR, 200+ practitioners, <5% churn. Median EU pre-seed to Series A: 18-24 months.
- Mitigation: Series A networking from M9. Target EU health-tech funds (Heal Capital, Partech Health, Elaia).

### Regulatory Risks

**R10: HDS certification mandate** — HIGH (Score: 12, P:3 × I:4)
- France may require HDS for mental health data. Supabase not HDS-certified. Migration: 3-6 months + 2-3x infrastructure cost. Audit: €15-30K.
- Mitigation: HDS specialist consult by M3. Database abstraction for portability. Budget €30K in Series A plan.

**R11: EU AI Act high-risk classification** — MEDIUM (Score: 8, P:2 × I:4)
- Effective August 2026. Compliance costs estimated €50-100K. If medical device classification, burden multiplies.
- Mitigation: Position as "practitioner decision support" (lighter pathway). Begin documentation by M6.

**R12: CNIL investigation** — MEDIUM (Score: 8, P:2 × I:4)
- CNIL enforcement up 40% since 2023, focus on health data/AI. Penalties: €20M or 4% annual turnover.
- Mitigation: GDPR by design (DPO, DPIA, explicit consent, portability API, auto-deletion). Internal audit by M4.

### Reputational Risks

**R13: AI safety incident** — HIGH (Score: 10, P:2 × I:5)
- Bloom AI interacts with vulnerable populations. Single harmful output could generate media coverage, practitioner exodus, regulatory scrutiny.
- Mitigation: Multi-layer safety: crisis keyword detection, clinical boundaries, content filtering, practitioner review. Monthly red-team testing.

**R14: Data breach** — MEDIUM (Score: 5, P:1 × I:5)
- Mental health data among most sensitive. Healthcare breaches average $10.9M damages (IBM 2023). GDPR: 72-hour notification.
- Mitigation: Defense in depth (AES-256-GCM, TLS 1.3, RLS, least-privilege). Penetration test by M6 (€3-5K). SOC 2 Type I by M12.

**R15: Practitioner backlash** — MEDIUM (Score: 6, P:2 × I:3)
- 45% of therapists express concerns about AI (APA 2024). If perceived as "replacing therapist," associations could discourage adoption.
- Mitigation: Messaging discipline ("empowering practitioners, not replacing"). Clinical Advisory Board. Conference sponsorship.

---

## Scenario Planning

### Best Case (15-20% probability)
- Strong PMF within 60 days. 30%+ MoM growth. €400-500K pre-seed at favorable terms.
- M12: 200 practitioners, €8K MRR. Series A at M15 at 3-4x step-up.

### Base Case (40-50% probability)
- Moderate PMF. 20-25% MoM growth. 120 practitioners by M12, €5K MRR.
- Series A at M18-20 requiring bridge round.

### Worst Case (20-25% probability)
- Weak PMF — sign up for AI notes, churn 2-3 months. 10% MoM growth.
- M12: 50 practitioners, €2K MRR. Pivot evaluation at M9.

### Black Swan (5-10% probability)
- AI safety incident + CNIL investigation + EU funding winter. Revenue to zero in 60 days.
- Existential threat. Evaluate acqui-hire or orderly wind-down.

---

## Mitigation Roadmap

### Phase 1: Foundation (M0-M6)
- Hire first engineer (full-stack, AI)
- Complete GDPR audit + DPIA for all AI features
- Run PMF pilot with 10-30 practitioners
- Implement crisis detection in Bloom AI
- HDS compliance consultation
- Automated onboarding (<5 min first AI note)
- AI model abstraction layer
- First penetration test

### Phase 2: Growth (M6-M12)
- Build churn prediction model
- Reach 200+ practitioners (base case: 120)
- Begin EU AI Act documentation
- Start Series A networking
- Clinical ethics framework + advisory board
- Bpifrance innovation grants

### Phase 3: Scale (M12-M18)
- Close Series A or secure bridge round
- HDS migration if mandated
- EU AI Act conformity assessment if high-risk
- Pricing review: evaluate €35-45/mo tiers
- Evaluate pivot if PMF not reached by M15
