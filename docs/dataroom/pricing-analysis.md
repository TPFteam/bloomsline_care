# Pricing Strategy & Revenue Architecture

**Route:** `/pricing-analysis`
**Competitor audit, value-based pricing, cost-plus floor, price elasticity, psychological tactics, 3-tier design, discount rules, revenue scenarios, monetization map**

---

## 1. Competitor Pricing Audit

| Competitor | Category | Starter | Mid | Top | AI Add-on | Member App |
|-----------|----------|---------|-----|-----|-----------|-----------|
| SimplePractice | Practice Management | $49/mo | $79/mo | $99/mo | None | None |
| TherapyNotes | Practice Management | $69/mo | $79 + $50/clinician | Enterprise (30+) | $40/mo (AI Scribe) | None |
| Jane App | Practice Management | C$54/mo (~€37) | C$79/mo (~€54) | C$99/mo (~€68) | None | None |
| Doctolib | Booking/Admin | €139/mo | Custom (group) | +€99/mo AI assistant | €99/mo (phone AI) | Patient app (booking only) |
| Ensora Health | Practice Management | $29/mo | $49/mo | $89/mo | None | Client portal |
| Headspace | B2C Wellness | $12.99/mo | $69.99/yr | $399.99 lifetime | Built-in | Is the product |
| Spring Health | Enterprise EAP | $5-14 PEPM | Outcome-based | Custom enterprise | ML matching built-in | Employee app |
| **Bloomsline** | **B2B2C Care Platform** | **€19/mo** | **€29/mo** | **€49+€19/head** | **Included (all tiers)** | **Free + €3/mo premium** |

**Key Insight:** No competitor offers AI + member app + practitioner tools in a single subscription. Bloomsline at €29/mo with AI included is a category-creating price point.

---

## 2. Value-Based Pricing Model

| Value Dimension | Annual Savings | Bloomsline Cost | Value Multiple |
|----------------|---------------|-----------------|---------------|
| Admin time saved (5-8 hrs/week × €40/hr) | €10,400+ | €348/yr (Pro) | 35x |
| Client retention improvement (2-3 fewer dropoffs) | €1,600+ | €348/yr | 5x |
| Between-session visibility | €2,000+ (est.) | €348/yr | 7x |
| Outcome documentation | €1,500+ (new revenue) | €348/yr | 5x |
| AI-assisted notes (20min → 5min per session) | €7,800+ (time value) | €348/yr | 26x |

**Total annual value:** €23,300+ | **Bloomsline Pro captures just 1.5%** of value created. Deliberate underpricing for adoption velocity.

---

## 3. Cost-Plus Analysis — The Price Floor

| Cost Item | Per Practitioner/mo | Note |
|----------|-------------------|------|
| Claude Haiku API | €1.80 | Primary variable cost. $1/MTok in, $5/MTok out. |
| Supabase (DB + auth) | €0.50 | Pro plan shared. Scales sub-linearly. |
| Hosting (Vercel/EU) | €0.30 | EU region for GDPR. |
| PostHog analytics | €0.10 | Free tier covers 1M events/month. |
| Email/notifications | €0.05 | Transactional emails, push notifications. |
| Support & onboarding | €1.50 | White-glove initially. Drops to €0.50 at scale. |
| **Total Variable Cost** | **€4.25/mo** | **Absolute floor — below this, lose money per user.** |

| Level | Price | Margin |
|-------|-------|--------|
| Cost Floor | €4.25/mo | 0% |
| 3x Markup (minimum viable) | ~€13/mo | ~67% |
| Target Margin (~83%) | ~€25/mo | ~83% |

At blended ARPU of ~€25.50 with €4.25 variable cost: **~83% gross margin projected**. Even at €19/mo (Essentiel), gross margin is ~78%.

---

## 4. Price Elasticity Estimate

| Price | Demand Index | Revenue Index | Segment | Note |
|-------|-------------|--------------|---------|------|
| €15/mo | 100 | 60 | Maximum adoption | Below cost floor. Unsustainable. |
| €19/mo | 95 | 72 | High adoption | Charm price. Impulse zone. €0.63/day. |
| €25/mo | 85 | 85 | Sweet spot | Near blended ARPU target. |
| **€29/mo** | **78** | **91** | **Near-optimal** | **Charm price. "Under €30" barrier.** |
| €39/mo | 65 | 101 | Revenue max | Revenue-maximizing. Filters tire-kickers. |
| €49/mo | 50 | 98 | Premium | Matches SimplePractice Starter. |
| €79/mo | 30 | 95 | High anchor | Only viable with proven outcomes. |
| €99/mo | 18 | 71 | Exclusion | Too expensive for solo French practitioners. |

**Recommendation:** €29/mo is the optimal balance — charm price below €30 barrier with 85% gross margin and strong adoption. Revisit at 500+ practitioners.

---

## 5. Psychological Pricing Tactics

| Tactic | Mechanism | Implementation | Expected Lift |
|--------|-----------|---------------|--------------|
| Charm pricing (€X9) | Left-digit effect — €29 feels closer to €20 | €19, €29, €49 tiers | +15-20% |
| Decoy effect | Middle tier = obvious best value | Essentiel limited, Pro "best value", Cabinet anchor | +25-30% |
| Anchoring against alternatives | Frame vs. cost of cancelled session (€60-80) | "Less than one cancelled session per month" | +10-15% |
| Daily cost framing | €29/mo = €0.97/day | "Less than a daily espresso" | +8-12% |
| Loss aversion framing | Losses felt 2x more than gains | "120+ between-session hours per client lost" | +12-18% |
| Social proof tiering | "Most Popular" badge → bandwagon effect | "87% of practitioners choose this plan" | +20-25% |

---

## 6. Recommended Pricing Tiers

### Essentiel — €19/mo (€190/yr)
- **Target:** Solo practitioners testing the waters
- **Features:** Up to 10 clients, member app (free), basic Bloom AI, manual session notes, progress tracking, email support
- **Limits:** No AI notes, no pattern detection, no outcome reports, no custom resources
- **Rationale:** Get in the door. Designed to feel limited — drives upgrades within 60 days.

### Pro — €29/mo (€290/yr) — MOST POPULAR
- **Target:** Independent practitioners with 15-25 clients (Marie persona)
- **Features:** Unlimited clients, full Bloom AI, AI-assisted notes, pattern detection, outcome tracking, custom resources, engagement dashboard, priority support, data export
- **Limits:** Single practitioner, no team management, no API
- **Rationale:** Hero tier. 90% should land here. Below €30 barrier, less than 1 cancelled session.

### Cabinet — €49/mo base + €19/practitioner (€490+€190/yr)
- **Target:** Group practice directors (Thomas persona), 3-8 practitioners
- **Features:** Everything in Pro + multi-practitioner management, team dashboard, cross-practitioner insights, practice-level reports, custom branding, admin roles, API access, phone support
- **Limits:** Up to 15 practitioners. Enterprise = custom quote.
- **Rationale:** 5-practitioner group = €144/mo (~€29/head). Volume discount baked in. Anchors Pro as a deal.

---

## 7. Discount Strategy

| Scenario | Discount | Mechanism | Duration | Guard |
|----------|---------|-----------|----------|-------|
| Annual commitment | ~17% (2 months free) | 10x monthly instead of 12x | Permanent while annual | Auto-renews. No refund after 30 days. |
| Referral reward | 1 month free per referral | Both sides get 1 month free | One-time credit | Cap at 3 free months/year. |
| Training institute partnership | 100% free for 12 months | Newly certified from AFTCC, IFFORTHECC | 12 months | Graduated within 6 months. Auto-converts to Pro. |
| Conference/event trial | 60-day free trial (vs 14) | Extended for in-person contacts | 60 days | Requires onboarding call. No credit card. |
| Group volume discount | 15-25% for 10+ seats | Cabinet tier: 10+ → €16/head | While on annual | Minimum 12-month commitment. |
| Student / trainee | 50% off Pro | €14.50/mo verified via .edu | Until graduation + 6 months | Verify enrollment annually. |

### Never Discount Rules
- Never discount in response to first-conversation price objections — reframe value
- Never below €19/mo (brand devaluation worse than margin loss)
- Never permanent discounts — all time-bound with auto-conversion
- Never publicly display discount codes
- Never discount member premium tier (€3/mo — already trivially cheap)

---

## 8. Revenue Scenarios

### Conservative
- Pricing: €19/mo avg (60% Essentiel / 35% Pro / 5% Cabinet)
- Growth: 20% initial → 5% mature | Churn: 5%
- M18 ARR: €42K | M36 ARR: €77K

### Base Case
- Pricing: €29/mo avg (20% Essentiel / 70% Pro / 10% Cabinet)
- Growth: 30% initial → 7% mature | Churn: 4% | 5% member premium at €3/mo
- M18 ARR: €126K | M36 ARR: €314K

### Aggressive
- Pricing: €35/mo avg (10% Essentiel / 65% Pro / 25% Cabinet)
- Growth: 35% initial → 7% mature | Churn: 3% | 8% member premium at €3/mo
- M18 ARR: €241K | M36 ARR: €649K

---

## 9. Monetization Opportunities (Beyond Core SaaS)

| Opportunity | Model | Timing | Revenue Est. | Risk | Priority |
|------------|-------|--------|-------------|------|----------|
| Member premium tier | €3/mo advanced AI, rituals, patterns | M3+ | €1,530/mo at 850 practitioners (M36) | Low | P0 |
| AI-powered outcome reports | €5/report or Pro+ addon | M6+ | €1,700-€4,250/mo at scale | Low | P1 |
| Resource marketplace | 20% commission on practitioner resources | M12+ | €500-€2,000/mo at scale | Medium | P2 |
| Training institute white-label | €500-€2,000/mo per institute | M12+ | €5,000-€10,000/mo | Medium | P2 |
| Employer/insurance (PEPM) | €3-5 PEPM white-label | M18+ (post-Series A) | €3K-€5K/mo per 1K-employee contract | High | P3 |
| API access for EHR integrations | €99-€249/mo per integrator | M18+ | €1,500-€7,500/mo | Medium | P3 |
