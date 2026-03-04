# SWOT Analysis & Porter's Five Forces

**Route:** `/swot-analysis`

---

## SWOT Matrix

### Strengths (7)

1. **Exceptional unit economics at pre-revenue stage** (Critical) — Modeled LTV/CAC of ~5x (target >3x). €50 CAC per practitioner, each bringing 20-50 members at zero incremental cost. Effective member CAC: €3.33 vs €30-50 for B2C apps. Payback period: ~2 months. ~83% gross margin.

2. **Unique B2B2C architecture — no competitor has both sides** (Critical) — SimplePractice: 237K practitioners, no member app. Headspace: 80M downloads, no practitioner tools. BetterHelp: both sides but commoditizes therapists.

3. **Practitioner-driven network effect creates organic distribution** (Critical) — 1 practitioner sale → 20-50 members for free (projected, unvalidated). Members locked into care relationship. Word-of-mouth flows through supervision groups/conferences.

4. **AI-native from day one — not bolted on** (High) — Bloom AI (Claude Haiku/Sonnet) embedded in every workflow. Notes generation, pattern detection, between-session companion, session summaries. Cost-optimized at ~€1.80/practitioner/month. 7 dedicated AI endpoints.

5. **GDPR-native and EU AI Act-ready by design** (High) — AES-256-GCM encryption, Row Level Security on every table. EU-hosted analytics (PostHog), Supabase EU region.

6. **Domain validation: 119 discovery interviews, 15 beta testers** (High) — Zero paying customers. Pivot to between-session care informed by practitioner pain, not founder assumption.

7. **Full-stack founder execution — no outsourced development** (Medium) — Entire platform built by founding team. Next.js 16, React 19, Supabase, Expo mobile app. 24+ API endpoints, 3-language i18n.

### Weaknesses (7)

1. **Pre-revenue with zero paying customers** (Critical) — MVP complete but no paying practitioners. Financial model entirely projected. Willingness-to-pay validated through interviews, not transactions.

2. **Two-person team limits execution bandwidth** (High) — Aditya: product/tech, Sarah: sales/ops. No clinical advisor on team. Single point of failure risk.

3. **No clinical validation or outcomes data** (High) — No published clinical evidence. Woebot had 5+ RCTs and still failed commercially. DiGA pathway (Germany) requires clinical evidence.

4. **Single-market dependency (France)** (Medium) — Expansion to Belgium/Switzerland is Phase 3 (M13-18).

5. **Practitioner technology adoption is historically slow** (Medium) — Only 5% of therapists currently use AI in practice. 55% express interest.

6. **Unproven pricing — no paying customer validated any tier** (Medium) — €19/29/49 three-tier pricing is modeled, not validated.

7. **Platform risk: dependency on Supabase and Anthropic Claude** (Medium) — No fallback AI provider implemented.

### Opportunities (7)

1. **EU regulatory infrastructure creating structural moat** (Very Large, Now → 3yr) — EU AI Act (Aug 2026), EHDS, France MonParcoursPsy, Germany DiGA (~60 apps, 45% mental health).

2. **B2C therapy marketplace collapse opening B2B2C window** (Large, Now) — BetterHelp revenue -11% Q1 2025, Talkspace pivoting, Woebot shut down June 2025.

3. **Therapist burnout crisis creating urgent demand** (Large, Now) — 93% of behavioral health workers report burnout. 29% considering leaving. AI scribes saving 12-15 hrs/month.

4. **Germany DiGA pathway as future insurance-reimbursed revenue** (Very Large, 2-4yr) — €200-500 per 90-day prescription. 45% target mental health.

5. **SimplePractice (Vista, $4B) focused on US — EU white space open** (Large, Now → 2yr) — Zero AI-native practitioner-focused mental health SaaS in Europe.

6. **Measurement-based care demand rising while <20% track outcomes** (Medium, 1-3yr)

7. **Training institute partnerships for distribution at scale** (Medium, 6mo → 2yr) — France produces 5,000+ new psychologists annually (21% YoY growth). AFTCC, IFFORTHECC, IRCCADE, Asadis.

### Threats (7)

1. **SimplePractice/Vista evolves into a platform play** (High severity, Medium probability) — Could close window in 18-24 months with member app + EU expansion.

2. **Doctolib adds between-session engagement features** (High severity, Low-Medium probability) — 80M patients, 400K practitioners, €348M ARR, €6.4B valuation.

3. **French HDS compliance requirement** (Medium severity, Medium probability) — Migration to OVHcloud/Scalingo: 3-6 months engineering + higher costs.

4. **AI regulation restricts clinical AI features** (Medium severity, Medium probability) — EU AI Act high-risk classification. Estimated compliance costs: €50-100K.

5. **Practitioner adoption slower than modeled** (High severity, Medium probability) — If 10-15% MoM instead of 20-30%, runway math shifts.

6. **Anthropic pricing increase** (Medium severity, Low probability) — If prices 3-5x: AI costs become 20-30% of ARPU.

7. **Open-source/free AI tools commoditize advantage** (Medium severity, Medium-High probability) — Meta Llama, Mistral approaching Claude quality.

---

## Cross-Strategies

### SO Strategies (Strengths × Opportunities)
1. **(P0)** Land Marie + practitioner-driven network effect — own French market before others enter
2. **(P0)** AI notes as acquisition hook, between-session engagement as retention
3. **(P1)** EU regulatory positioning as feature — "Built in Europe, for Europe, under European rules"
4. **(P1)** Training institute partnerships — capture newly certified practitioners

### WT Risks (Weaknesses × Threats)
1. **(Critical)** Pre-revenue + slower adoption → set hard milestone (10 paying practitioners in 90 days or pivot)
2. **(High)** Two-person team + SimplePractice/Vista → compete on care quality and local market fit, not features
3. **(High)** No clinical validation + AI regulation → begin informal clinical measurement from Day 1
4. **(Medium)** Unproven pricing + AI cost increases → build pricing headroom, test willingness-to-pay

---

## Porter's Five Forces

| Force | Score | Assessment |
|-------|-------|-----------|
| Supplier Power | 4/10 (Low-Moderate) | Anthropic: medium power (~€1.80/user/mo). Supabase: medium (4-8 weeks switching). Vercel/Expo: low. |
| Buyer Power | 6/10 (Moderate-High) | Solo practitioners (Marie): medium-high, price-sensitive. Group practices (Thomas): medium. Members: low (non-paying). |
| Competitive Rivalry | 3/10 (Low) | "Between-session care platform" category barely exists. No direct rivals. Risk: future convergence. |
| Threat of Substitution | 7/10 (Moderate-High) | "Do nothing" (paper, spreadsheets): highest power, 80%+ use this. Generic tools (WhatsApp, Google Docs): medium. |
| Threat of New Entry | 5/10 (Moderate) | Technical barriers: low. Regulatory barriers: medium-high (GDPR, EU AI Act add 6-12 months). Distribution: medium. |

**Overall Industry Attractiveness: 7/10 (Attractive)** — Low competitive rivalry + low supplier power = favorable. Buyer power + substitution threat = primary forces to manage.
