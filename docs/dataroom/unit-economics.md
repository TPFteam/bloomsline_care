# Unit Economics & Financial Model

**Route:** `/unit-economics`
**CAC by channel, LTV calculation, margin waterfall, 3-year projection, break-even, sensitivity, benchmarks, red flags**

---

## Summary Metrics (All Modeled)

| Metric | Value |
|--------|-------|
| LTV (modeled) | €3,625 |
| CAC (modeled) | €50 |
| LTV/CAC (modeled) | ~5x |
| Payback (modeled) | ~2 months |
| Gross Margin (modeled) | ~83% |
| Break-even (projected) | ~M24 |

---

## 1. CAC by Channel

| Channel | CAC | Volume | Timeline | Lead Quality | LTV/CAC |
|---------|-----|--------|----------|-------------|---------|
| Founder LinkedIn outreach | €35-50 | 50+ conversations/week | Pre-launch → M6 | High (personal, high intent) | 86x |
| Referral program | €29 (1 month free) | 5-15 referrals/month at scale | M3 → ongoing | Highest (16-25% higher LTV) | 150x |
| French SEO / content | €15-25 | Scales with content volume | M3-M6 (compounds) | High (self-selected) | 181x |
| Events & conferences | €60-100 | 10-20 leads/event | M3 → M18 | Very high (face-to-face) | 45x |
| Training institute partnerships | €0 (free accounts) | 50-100 graduates/year | M6 → M18 | Medium (newly certified) | ∞ |
| Podcast guest appearances | €0 | 2-5 signups per episode | M6 → ongoing | High (authority-driven) | ∞ |

---

## 2. LTV Calculation

| Component | Formula | Value | Assumption |
|-----------|---------|-------|------------|
| ARPU (monthly, modeled) | Blended average of tier mix | ~€25.50/mo | 20% Essentiel (€19) + 70% Pro (€29) + 10% Cabinet (~€29/head). Projected, not observed. |
| Gross margin (modeled) | (Revenue - Variable Cost) / Revenue | ~83% | Variable cost €4.25/practitioner/mo (AI €1.80 + infra €0.95 + support €1.50). |
| Monthly churn rate | Churned / Start-of-month | 4% | SaaS benchmark 2-10%. Care relationship lock-in hypothesis. |
| Average lifetime | 1 / Monthly churn | 25 months | Conservative: 20 months (5% churn). Aggressive: 33 months (3%). |
| **Lifetime Value (LTV)** | ARPU × Lifetime × Gross margin | **€3,625** | €29 × 25 × 0.853 |
| B2C upside per practitioner | Members × conversion % × premium × lifetime | +€540 | 12 members × 5% × €3/mo × 25 months. Not in core LTV. |

---

## 3. Gross Margin & Contribution Margin

| Item | Per Practitioner | % of Revenue | Note |
|------|-----------------|-------------|------|
| **Revenue** | **€29.00** | **100%** | Pro tier (70% of customers) |
| Claude Haiku API | -€1.80 | 6.2% | $1/MTok in, $5/MTok out |
| Supabase (DB + auth) | -€0.50 | 1.7% | Pro plan shared, sub-linear scaling |
| Hosting (Vercel EU) | -€0.30 | 1.0% | EU region for GDPR |
| PostHog analytics | -€0.10 | 0.3% | EU-hosted, free tier initially |
| Email / notifications | -€0.05 | 0.2% | Transactional emails, push |
| Support & onboarding | -€1.50 | 5.2% | White-glove, drops to €0.50 at scale |
| **Gross Profit** | **€24.75** | **85.3%** | Variable cost: €4.25/practitioner/mo |
| CAC amortized (25-mo) | -€2.00 | 6.9% | €50 CAC / 25 months |
| **Contribution Margin** | **€22.75** | **78.4%** | After COGS + amortized acquisition |

---

## 4. 3-Year Financial Projection (Base Case)

**Assumptions:** €29 ARPU, 30% initial → 7% mature growth, 4% churn, €450K starting cash

### Year 1 (Monthly)

| Period | Practitioners | Members | MRR | ARR | Net Burn | Cumulative Cash |
|--------|-------------|---------|-----|-----|----------|----------------|
| M1 | 10 | 120 | €290 | €3,480 | -€8,503 | €291,497 |
| M3 | 16 | 192 | €464 | €5,568 | -€8,444 | €274,580 |
| M6 | 32 | 384 | €928 | €11,136 | -€8,288 | €249,531 |
| M9 | 62 | 744 | €1,798 | €21,576 | -€7,996 | €225,212 |
| **M12** | **117** | **1,404** | **€3,393** | **€40,716** | **-€7,459** | **€202,230** |

### Year 2 (Quarterly)

| Period | Practitioners | MRR | ARR | Net Burn | Cumulative Cash |
|--------|-------------|-----|-----|----------|----------------|
| Q5 (M13-15) | 170 | €4,930 | €59,160 | -€23,078 | €179,152 |
| **Q6 (M16-18)** | **240** | **€6,960** | **€83,520** | **-€18,180** | **€160,972** |
| Q7 (M19-21) | 320 | €9,280 | €111,360 | -€14,840 | €146,132 |
| **Q8 (M22-24)** | **410** | **€11,890** | **€142,680** | **-€8,358** | **€137,774** |

### Year 3 (Quarterly)

| Period | Practitioners | MRR | ARR | Net Burn | Cumulative Cash |
|--------|-------------|-----|-----|----------|----------------|
| Q9 (M25-27) | 500 | €14,500 | €174,000 | -€4,875 | €132,899 |
| **Q10 (M28-30)** | **600** | **€17,400** | **€208,800** | **+€2,550** | **€135,449** |
| Q11 (M31-33) | 710 | €20,590 | €247,080 | +€10,218 | €145,667 |
| **Q12 (M34-36)** | **850** | **€24,650** | **€295,800** | **+€20,112** | **€165,779** |

**Cash-flow positive around M28-M30.**

---

## 5. Fixed vs Variable Costs

| Category | Type | M1 | M12 | M36 | Scales With |
|----------|------|-----|------|------|------------|
| Team (founders + contractors) | Fixed | €6,500 | €6,500 | €12,000 | Stepped: +hire at 100, +hire at 300 |
| Claude Haiku API | Variable | €18 | €211 | €1,530 | Linear with practitioners (€1.80/mo) |
| Supabase | Semi-variable | €25 | €50 | €200 | Sub-linear. Pro plan covers 0-500. |
| Hosting (Vercel) | Semi-variable | €0 | €30 | €200 | Free → Pro at ~50 → Enterprise at 500+ |
| PostHog analytics | Semi-variable | €0 | €0 | €100 | Free tier (1M events/mo) |
| Marketing spend | Fixed | €1,000 | €1,000 | €2,000 | Content + events. No paid ads until PMF. |
| Other (legal, accounting) | Fixed | €400 | €400 | €800 | Stepped: +legal at HDS certification |
| Customer acquisition (CAC) | Variable | €150 | €1,755 | €4,500 | Linear: new practitioners × €50 |
| Support labor | Variable | €15 | €176 | €425 | €1.50/practitioner initially, €0.50 at scale |

---

## 6. Break-Even Analysis

| Scenario | Fixed Costs | Contribution Margin | Break-Even Users | Break-Even MRR | Expected Month |
|----------|------------|-------------------|-----------------|---------------|---------------|
| Conservative (€19 ARPU, 5% churn) | €6,700/mo | €14.75/user/mo | 454 practitioners | €8,626 | M28-M32 |
| **Base case (€29 ARPU, 4% churn)** | **€8,600/mo** | **€24.75/user/mo** | **347 practitioners** | **€10,063** | **M22-M26** |
| Aggressive (€35 ARPU, 3% churn) | €11,000/mo | €30.75/user/mo | 358 practitioners | €12,530 | M16-M20 |

---

## 7. Sensitivity Analysis

| Variable | Worst | Base | Best | Impact on LTV | Runway Impact |
|----------|-------|------|------|--------------|--------------|
| Monthly churn | 7% | 4% | 2.5% | €1,779 / €3,625 / €5,800 | High — 1% churn = €1,800 LTV swing |
| ARPU | €19 | €29 | €39 | €2,375 / €3,625 / €4,875 | High — €10 ARPU = 3x revenue at M18 |
| CAC | €100 | €50 | €25 | LTV/CAC: 36x / 72x / 145x | Medium — doubled CAC still yields 36x |
| Initial growth rate | 15% | 30% | 40% | Same LTV, different scale time | Critical — determines break-even timing |
| Members/practitioner | 8 | 12 | 20 | B2C upside: €288 / €540 / €900 | Low-Med — member revenue is upside |
| AI cost per practitioner | €3.50 | €1.80 | €1.00 | Gross margin: 77% / 85% / 89% | Low — worst case still healthy |
| Fixed costs (team) | €12,000/mo | €8,600/mo | €6,500/mo | N/A (affects break-even) | High — €3.4K/mo = 10+ months runway |

---

## 8. Key Assumptions

| Assumption | Value | Justification | Risk |
|-----------|-------|---------------|------|
| Starting practitioners at close | 10 | 15 beta, 0 paying. WTP not validated. | High |
| Monthly price (blended ARPU) | ~€25.50 | Charm price below €30. Less than 1 cancelled session. | Medium |
| Monthly churn rate | 4% | SaaS benchmark 2-10%. No real data. | High |
| CAC | €50 | Organic/content-driven. Below SaaS benchmark (€200-500). | Medium |
| Gross margin | ~83% | Variable cost €4.25/mo against ~€25.50 ARPU. | Low |
| Members per practitioner | 20-50 | Average caseload 15-25. Network effect unproven. | High |
| Growth rate (initial → mature) | 30% → 7% | Linear decay over 36 months. | Medium |
| Starting cash | €450,000 | Mid-point of €400K-€500K raise. | Low |
| Team cost | €8,600/mo | Founders below market rate. | Low |
| No paid acquisition | €0 ads | Trust-based acquisition. May need ads if organic stalls. | Low-Med |

---

## 9. SaaS Benchmarks

| Metric | Bloomsline | SaaS Median | Top Decile | Verdict |
|--------|-----------|-------------|-----------|---------|
| Gross margin | ~83% (modeled) | 70-75% | 85-90% | Projected top quartile. No revenue data. |
| LTV/CAC | ~5x (modeled) | 3-5x | 10-15x | Healthy if assumptions hold. All modeled. |
| CAC payback | ~2 months (modeled) | 12-18 months | 5-6 months | Projected. Unproven. |
| Monthly churn | 4% (modeled) | 5-7% | 2-3% | Entirely modeled. Zero data. |
| Net revenue retention | ~100% (est.) | 90-100% | 120-140% | Needs upsell motion for 110%+. |
| CAC | €50 (modeled) | €200-500 | €50-100 | Will rise if paid channels needed. |
| ARPU | €29/mo | €50-100/mo | Varies | Below median. Compensated by low CAC. |
| Rule of 40 | -30 (pre-rev) | 40+ | 60+ | N/A pre-revenue. Target 40+ by M18. |

---

## 10. Red Flags — When to Panic

| Flag | Threshold | Why Dangerous | Action | Check At |
|------|-----------|--------------|--------|----------|
| Churn exceeds 8% | >8% monthly | LTV crashes to €2,175. Losing customers faster than acquiring. | STOP selling. Interview every churned user. Fix top 3 reasons. | Monthly from M2 |
| Zero organic signups by M3 | 0 inbound by day 90 | Word-of-mouth isn't working. Product not remarkable enough. | Reassess messaging. Run 10 interviews. Consider pivot. | M3 check-in |
| Member activation below 50% | <50% invited log first moment | Practitioner sees no value. Will churn within 60 days. | Redesign first-use. <10 seconds. Practitioner-triggered nudges. | Monthly from M1 |
| CAC rises above €150 | >€150/practitioner | Organic channels saturating. | Double referrals and content/SEO. No paid ads. | Quarterly |
| Burn exceeds €12K/month | >€12K/mo net burn | Bleeding out if revenue not growing. | Audit expenses. Defer hiring. Founder salaries to €0. | Monthly |
| Demo-to-paid below 15% | <15% convert | Bad demo, wrong price, or wrong target. | Record 10 demos. A/B test. Test €19 entry. | Monthly from M2 |
| Cash below €150K with <50 users | <€150K, <50 users | Not Series A-ready. Not break-even trajectory. | Emergency mode. Bridge round or revenue partnership. | Monthly |
